package com.mitrachat.app.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.ServerTimestamp

enum class MessageStatus {
    SENDING,
    SENT,
    DELIVERED,
    READ
}

enum class MediaType {
    NONE,
    IMAGE,
    DOCUMENT,
    AUDIO
}

data class Message(
    @DocumentId
    val id: String = "",
    val conversationId: String = "",
    val senderId: String = "",
    val senderName: String = "",
    val senderPhotoUrl: String = "",
    val text: String = "",
    val mediaUrl: String = "",
    val mediaType: String = "NONE",
    @ServerTimestamp
    val timestamp: Timestamp? = null,
    val status: String = MessageStatus.SENT.name,
    val readBy: List<String> = emptyList(),
    val replyToId: String = "",
    val replyToText: String = ""
) {
    val messageStatus: MessageStatus
        get() = try {
            MessageStatus.valueOf(status)
        } catch (_: Exception) {
            MessageStatus.SENT
        }

    fun isReadBy(userId: String): Boolean {
        return readBy.contains(userId)
    }
}
