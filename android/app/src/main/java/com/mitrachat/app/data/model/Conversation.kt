package com.mitrachat.app.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.ServerTimestamp

data class ParticipantInfo(
    val displayName: String = "",
    val photoUrl: String = "",
    val searchableUsername: String = ""
)

data class Conversation(
    @DocumentId
    val id: String = "",
    val isGroup: Boolean = false,
    val title: String = "",
    val groupPhotoUrl: String = "",
    val participantIds: List<String> = emptyList(),
    val participantDetails: Map<String, Map<String, String>> = emptyMap(),
    val lastMessage: String = "",
    @ServerTimestamp
    val lastMessageTimestamp: Timestamp? = null,
    val lastMessageSenderId: String = "",
    val unreadCounts: Map<String, Int> = emptyMap(),
    val createdBy: String = "",
    val adminIds: List<String> = emptyList(),
    @ServerTimestamp
    val createdAt: Timestamp? = null
) {
    /**
     * Resolves the display name for a one-to-one conversation for the given viewer UID.
     */
    fun getResolvedTitle(currentUserId: String): String {
        if (isGroup && title.isNotBlank()) return title
        val otherId = participantIds.firstOrNull { it != currentUserId } ?: return title.ifBlank { "Chat" }
        val details = participantDetails[otherId]
        val name = details?.get("displayName")
        return if (!name.isNullOrBlank()) name else title.ifBlank { "Mitra User" }
    }

    /**
     * Resolves the avatar URL for a one-to-one conversation for the given viewer UID.
     */
    fun getResolvedPhotoUrl(currentUserId: String): String {
        if (isGroup) return groupPhotoUrl
        val otherId = participantIds.firstOrNull { it != currentUserId } ?: return ""
        return participantDetails[otherId]?.get("photoUrl") ?: ""
    }

    fun getUnreadCount(userId: String): Int {
        return unreadCounts[userId] ?: 0
    }
}
