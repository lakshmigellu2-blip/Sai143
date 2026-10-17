package com.mitrachat.app.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.ServerTimestamp

data class User(
    @DocumentId
    val uid: String = "",
    val displayName: String = "",
    val searchableUsername: String = "",
    val email: String = "",
    val photoUrl: String = "",
    val status: String = "Hey there! I am using Mitra Chat.",
    @ServerTimestamp
    val createdAt: Timestamp? = null,
    @ServerTimestamp
    val lastActive: Timestamp? = null,
    val blockedUsers: List<String> = emptyList()
) {
    fun isUserBlocked(otherUid: String): Boolean = blockedUsers.contains(otherUid)
}
