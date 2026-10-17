package com.mitrachat.app.data.repository

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.mitrachat.app.R
import com.mitrachat.app.data.model.User
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

sealed class AuthResult {
    data class Success(val user: FirebaseUser) : AuthResult()
    data class Error(val message: String) : AuthResult()
    object Cancelled : AuthResult()
}

interface AuthRepository {
    val currentUser: FirebaseUser?
    val currentUserId: String?
    fun observeAuthState(): Flow<FirebaseUser?>
    suspend fun signInWithGoogle(context: Context): AuthResult
    suspend fun syncUserProfile(user: FirebaseUser): Result<User>
    suspend fun signOut()
    suspend fun deleteAccount(): Result<Unit>
}

class AuthRepositoryImpl(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) : AuthRepository {

    override val currentUser: FirebaseUser?
        get() = auth.currentUser

    override val currentUserId: String?
        get() = auth.currentUser?.uid

    override fun observeAuthState(): Flow<FirebaseUser?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { firebaseAuth ->
            trySend(firebaseAuth.currentUser)
        }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    override suspend fun signInWithGoogle(context: Context): AuthResult {
        return try {
            val credentialManager = CredentialManager.create(context)
            val webClientId = context.getString(R.string.default_web_client_id)

            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId(webClientId)
                .setAutoSelectEnabled(false)
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            val result = credentialManager.getCredential(context = context, request = request)
            val credential = result.credential

            if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                val idToken = googleIdTokenCredential.idToken

                val firebaseCredential = GoogleAuthProvider.getCredential(idToken, null)
                val authResult = auth.signInWithCredential(firebaseCredential).await()
                val user = authResult.user

                if (user != null) {
                    syncUserProfile(user)
                    AuthResult.Success(user)
                } else {
                    AuthResult.Error("Firebase sign in returned null user")
                }
            } else {
                AuthResult.Error("Unexpected credential type: ${credential::class.java.name}")
            }
        } catch (e: GetCredentialCancellationException) {
            AuthResult.Cancelled
        } catch (e: GetCredentialException) {
            AuthResult.Error("Credential Manager error: ${e.message}")
        } catch (e: Exception) {
            AuthResult.Error("Authentication failed: ${e.localizedMessage ?: "Unknown error"}")
        }
    }

    override suspend fun syncUserProfile(user: FirebaseUser): Result<User> {
        return try {
            val userRef = firestore.collection("users").document(user.uid)
            val snapshot = userRef.get().await()

            val baseUsername = (user.email?.substringBefore("@") ?: "user")
                .lowercase()
                .replace(Regex("[^a-z0-9_]"), "")
                .take(20)
                .ifBlank { "user_${user.uid.take(6)}" }

            val profile = if (!snapshot.exists()) {
                val newUser = User(
                    uid = user.uid,
                    displayName = user.displayName ?: "Mitra User",
                    searchableUsername = baseUsername,
                    email = user.email ?: "",
                    photoUrl = user.photoUrl?.toString() ?: "",
                    status = "Hey there! I am using Mitra Chat.",
                    createdAt = Timestamp.now(),
                    lastActive = Timestamp.now()
                )
                userRef.set(newUser).await()
                newUser
            } else {
                val existing = snapshot.toObject(User::class.java) ?: User(uid = user.uid)
                userRef.update(
                    mapOf(
                        "lastActive" to Timestamp.now(),
                        "displayName" to (existing.displayName.ifBlank { user.displayName ?: "Mitra User" }),
                        "photoUrl" to (existing.photoUrl.ifBlank { user.photoUrl?.toString() ?: "" })
                    )
                ).await()
                existing
            }
            Result.success(profile)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun signOut() {
        auth.signOut()
    }

    override suspend fun deleteAccount(): Result<Unit> {
        return try {
            val user = auth.currentUser ?: return Result.failure(IllegalStateException("No signed-in user"))
            val uid = user.uid
            // Remove user document from Firestore
            firestore.collection("users").document(uid).delete().await()
            // Delete user in Firebase Auth
            user.delete().await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
