package com.mitrachat.app.data.repository

import com.google.firebase.Timestamp
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.SetOptions
import com.mitrachat.app.data.model.Conversation
import com.mitrachat.app.data.model.MediaType
import com.mitrachat.app.data.model.Message
import com.mitrachat.app.data.model.MessageStatus
import com.mitrachat.app.data.model.User
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.UUID

interface ChatRepository {
    fun observeConversations(currentUserId: String): Flow<List<Conversation>>
    fun observeMessages(conversationId: String, limitCount: Long = 50): Flow<List<Message>>
    suspend fun getOrCreateOneToOneConversation(currentUser: User, targetUser: User): Result<Conversation>
    suspend fun createGroupConversation(currentUser: User, groupTitle: String, members: List<User>): Result<Conversation>
    suspend fun sendMessage(
        conversationId: String,
        sender: User,
        text: String,
        mediaUrl: String = "",
        mediaType: MediaType = MediaType.NONE,
        replyTo: Message? = null
    ): Result<Message>
    suspend fun markMessagesAsRead(conversationId: String, currentUserId: String): Result<Unit>
    suspend fun deleteMessage(conversationId: String, messageId: String): Result<Unit>
}

class ChatRepositoryImpl(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) : ChatRepository {

    override fun observeConversations(currentUserId: String): Flow<List<Conversation>> = callbackFlow {
        val query = firestore.collection("conversations")
            .whereArrayContains("participantIds", currentUserId)
            .orderBy("lastMessageTimestamp", Query.Direction.DESCENDING)

        val listener = query.addSnapshotListener { snapshot, error ->
            if (error != null) {
                close(error)
                return@addSnapshotListener
            }
            val conversations = snapshot?.documents?.mapNotNull { doc ->
                doc.toObject(Conversation::class.java)?.copy(id = doc.id)
            } ?: emptyList()
            trySend(conversations)
        }
        awaitClose { listener.remove() }
    }

    override fun observeMessages(conversationId: String, limitCount: Long): Flow<List<Message>> = callbackFlow {
        val query = firestore.collection("conversations")
            .document(conversationId)
            .collection("messages")
            .orderBy("timestamp", Query.Direction.ASCENDING)
            .limitToLast(limitCount.toInt())

        val listener = query.addSnapshotListener { snapshot, error ->
            if (error != null) {
                close(error)
                return@addSnapshotListener
            }
            val messages = snapshot?.documents?.mapNotNull { doc ->
                doc.toObject(Message::class.java)?.copy(id = doc.id)
            } ?: emptyList()
            trySend(messages)
        }
        awaitClose { listener.remove() }
    }

    override suspend fun getOrCreateOneToOneConversation(currentUser: User, targetUser: User): Result<Conversation> {
        return try {
            if (currentUser.uid == targetUser.uid) {
                return Result.failure(IllegalArgumentException("Cannot start a conversation with yourself"))
            }

            // Check if 1-to-1 conversation already exists between these 2 users
            val query = firestore.collection("conversations")
                .whereEqualTo("isGroup", false)
                .whereArrayContains("participantIds", currentUser.uid)
                .get()
                .await()

            val existingDoc = query.documents.firstOrNull { doc ->
                val participants = doc.get("participantIds") as? List<*>
                participants != null && participants.contains(targetUser.uid) && participants.size == 2
            }

            if (existingDoc != null) {
                val conversation = existingDoc.toObject(Conversation::class.java)!!.copy(id = existingDoc.id)
                return Result.success(conversation)
            }

            // Create deterministic or new conversation
            val sortedIds = listOf(currentUser.uid, targetUser.uid).sorted()
            val conversationId = "direct_${sortedIds[0]}_${sortedIds[1]}"

            val participantDetails = mapOf(
                currentUser.uid to mapOf(
                    "displayName" to currentUser.displayName,
                    "photoUrl" to currentUser.photoUrl,
                    "searchableUsername" to currentUser.searchableUsername
                ),
                targetUser.uid to mapOf(
                    "displayName" to targetUser.displayName,
                    "photoUrl" to targetUser.photoUrl,
                    "searchableUsername" to targetUser.searchableUsername
                )
            )

            val newConversation = Conversation(
                id = conversationId,
                isGroup = false,
                title = targetUser.displayName,
                participantIds = sortedIds,
                participantDetails = participantDetails,
                lastMessage = "Started a conversation",
                lastMessageTimestamp = Timestamp.now(),
                lastMessageSenderId = currentUser.uid,
                unreadCounts = mapOf(currentUser.uid to 0, targetUser.uid to 0),
                createdBy = currentUser.uid,
                adminIds = emptyList(),
                createdAt = Timestamp.now()
            )

            firestore.collection("conversations").document(conversationId)
                .set(newConversation, SetOptions.merge())
                .await()

            Result.success(newConversation)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun createGroupConversation(
        currentUser: User,
        groupTitle: String,
        members: List<User>
    ): Result<Conversation> {
        return try {
            if (groupTitle.isBlank()) {
                return Result.failure(IllegalArgumentException("Group title cannot be blank"))
            }
            val allMembers = (members + currentUser).distinctBy { it.uid }
            val memberIds = allMembers.map { it.uid }
            val convId = "group_${UUID.randomUUID().toString().take(12)}"

            val participantDetails = allMembers.associate { member ->
                member.uid to mapOf(
                    "displayName" to member.displayName,
                    "photoUrl" to member.photoUrl,
                    "searchableUsername" to member.searchableUsername
                )
            }

            val unreadCounts = memberIds.associateWith { 0 }

            val groupConv = Conversation(
                id = convId,
                isGroup = true,
                title = groupTitle.trim().take(100),
                participantIds = memberIds,
                participantDetails = participantDetails,
                lastMessage = "${currentUser.displayName} created group \"$groupTitle\"",
                lastMessageTimestamp = Timestamp.now(),
                lastMessageSenderId = currentUser.uid,
                unreadCounts = unreadCounts,
                createdBy = currentUser.uid,
                adminIds = listOf(currentUser.uid),
                createdAt = Timestamp.now()
            )

            firestore.collection("conversations").document(convId).set(groupConv).await()
            Result.success(groupConv)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun sendMessage(
        conversationId: String,
        sender: User,
        text: String,
        mediaUrl: String,
        mediaType: MediaType,
        replyTo: Message?
    ): Result<Message> {
        return try {
            if (text.isBlank() && mediaUrl.isBlank()) {
                return Result.failure(IllegalArgumentException("Message content cannot be empty"))
            }

            val messageId = firestore.collection("conversations")
                .document(conversationId)
                .collection("messages")
                .document().id

            val message = Message(
                id = messageId,
                conversationId = conversationId,
                senderId = sender.uid,
                senderName = sender.displayName,
                senderPhotoUrl = sender.photoUrl,
                text = text.trim().take(4000),
                mediaUrl = mediaUrl,
                mediaType = mediaType.name,
                timestamp = Timestamp.now(),
                status = MessageStatus.SENT.name,
                readBy = listOf(sender.uid),
                replyToId = replyTo?.id ?: "",
                replyToText = replyTo?.text?.take(80) ?: ""
            )

            val convRef = firestore.collection("conversations").document(conversationId)
            val messageRef = convRef.collection("messages").document(messageId)

            firestore.runBatch { batch ->
                // Write message
                batch.set(messageRef, message)
                // Update parent conversation snippet & bump unread count for recipients
                val lastSnippet = if (mediaUrl.isNotEmpty() && text.isBlank()) "[Photo]" else text.take(100)
                batch.update(
                    convRef,
                    mapOf(
                        "lastMessage" to lastSnippet,
                        "lastMessageTimestamp" to FieldValue.serverTimestamp(),
                        "lastMessageSenderId" to sender.uid
                    )
                )
            }.await()

            Result.success(message)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun markMessagesAsRead(conversationId: String, currentUserId: String): Result<Unit> {
        return try {
            val convRef = firestore.collection("conversations").document(conversationId)
            convRef.update("unreadCounts.$currentUserId", 0).await()

            // Update status on recent messages received from other participants
            val unreadQuery = convRef.collection("messages")
                .whereNotEqualTo("senderId", currentUserId)
                .limit(20)
                .get()
                .await()

            if (!unreadQuery.isEmpty) {
                firestore.runBatch { batch ->
                    unreadQuery.documents.forEach { doc ->
                        val readBy = (doc.get("readBy") as? List<*>) ?: emptyList<String>()
                        if (!readBy.contains(currentUserId)) {
                            batch.update(
                                doc.reference,
                                mapOf(
                                    "status" to MessageStatus.READ.name,
                                    "readBy" to FieldValue.arrayUnion(currentUserId)
                                )
                            )
                        }
                    }
                }.await()
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteMessage(conversationId: String, messageId: String): Result<Unit> {
        return try {
            firestore.collection("conversations")
                .document(conversationId)
                .collection("messages")
                .document(messageId)
                .delete()
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
