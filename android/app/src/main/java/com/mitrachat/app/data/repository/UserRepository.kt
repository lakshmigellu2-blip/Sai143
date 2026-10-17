package com.mitrachat.app.data.repository

import com.google.firebase.Timestamp
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.mitrachat.app.data.model.User
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

interface UserRepository {
    fun observeUserProfile(userId: String): Flow<User?>
    suspend fun getUserProfile(userId: String): Result<User?>
    suspend fun searchUsersByUsername(query: String, currentUserId: String): Result<List<User>>
    suspend fun updateProfile(userId: String, displayName: String, status: String, photoUrl: String? = null): Result<Unit>
    suspend fun blockUser(currentUserId: String, targetUserId: String): Result<Unit>
    suspend fun unblockUser(currentUserId: String, targetUserId: String): Result<Unit>
    suspend fun reportUser(reporterUid: String, reportedUid: String, reason: String): Result<Unit>
}

class UserRepositoryImpl(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) : UserRepository {

    override fun observeUserProfile(userId: String): Flow<User?> = callbackFlow {
        val docRef = firestore.collection("users").document(userId)
        val listener = docRef.addSnapshotListener { snapshot, error ->
            if (error != null) {
                close(error)
                return@addSnapshotListener
            }
            trySend(snapshot?.toObject(User::class.java))
        }
        awaitClose { listener.remove() }
    }

    override suspend fun getUserProfile(userId: String): Result<User?> {
        return try {
            val snapshot = firestore.collection("users").document(userId).get().await()
            Result.success(snapshot.toObject(User::class.java))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun searchUsersByUsername(query: String, currentUserId: String): Result<List<User>> {
        return try {
            val cleanQuery = query.trim().lowercase()
            if (cleanQuery.length < 2) return Result.success(emptyList())

            val endQuery = cleanQuery + '\uf8ff'
            val snapshot = firestore.collection("users")
                .whereGreaterThanOrEqualTo("searchableUsername", cleanQuery)
                .whereLessThanOrEqualTo("searchableUsername", endQuery)
                .limit(20)
                .get()
                .await()

            val users = snapshot.documents.mapNotNull { it.toObject(User::class.java) }
                // Exclude current user and sanitize to prevent private email leaks
                .filter { it.uid != currentUserId }
                .map { user ->
                    user.copy(email = "") // Strict privacy: do not expose email in contact search
                }

            Result.success(users)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateProfile(
        userId: String,
        displayName: String,
        status: String,
        photoUrl: String?
    ): Result<Unit> {
        return try {
            val updates = mutableMapOf<String, Any>(
                "displayName" to displayName.trim().take(64),
                "status" to status.trim().take(140),
                "lastActive" to Timestamp.now()
            )
            if (photoUrl != null) {
                updates["photoUrl"] = photoUrl
            }
            firestore.collection("users").document(userId).update(updates).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun blockUser(currentUserId: String, targetUserId: String): Result<Unit> {
        return try {
            firestore.collection("users").document(currentUserId)
                .update("blockedUsers", FieldValue.arrayUnion(targetUserId))
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun unblockUser(currentUserId: String, targetUserId: String): Result<Unit> {
        return try {
            firestore.collection("users").document(currentUserId)
                .update("blockedUsers", FieldValue.arrayRemove(targetUserId))
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun reportUser(reporterUid: String, reportedUid: String, reason: String): Result<Unit> {
        return try {
            val reportDoc = mapOf(
                "reporterUid" to reporterUid,
                "reportedUid" to reportedUid,
                "reason" to reason,
                "timestamp" to FieldValue.serverTimestamp()
            )
            firestore.collection("reports").add(reportDoc).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
