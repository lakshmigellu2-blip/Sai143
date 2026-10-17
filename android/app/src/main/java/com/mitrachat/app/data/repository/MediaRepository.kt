package com.mitrachat.app.data.repository

import android.net.Uri
import com.google.firebase.storage.FirebaseStorage
import com.google.firebase.storage.StorageMetadata
import kotlinx.coroutines.tasks.await
import java.util.UUID

interface MediaRepository {
    suspend fun uploadProfileImage(userId: String, imageUri: Uri, mimeType: String = "image/jpeg"): Result<String>
    suspend fun uploadChatAttachment(conversationId: String, fileUri: Uri, mimeType: String): Result<String>
}

class MediaRepositoryImpl(
    private val storage: FirebaseStorage = FirebaseStorage.getInstance()
) : MediaRepository {

    override suspend fun uploadProfileImage(userId: String, imageUri: Uri, mimeType: String): Result<String> {
        return try {
            val storageRef = storage.reference.child("users/$userId/profile.jpg")
            val metadata = StorageMetadata.Builder()
                .setContentType(mimeType)
                .build()

            storageRef.putFile(imageUri, metadata).await()
            val downloadUrl = storageRef.downloadUrl.await().toString()
            Result.success(downloadUrl)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun uploadChatAttachment(conversationId: String, fileUri: Uri, mimeType: String): Result<String> {
        return try {
            val fileId = UUID.randomUUID().toString()
            val extension = if (mimeType.contains("png")) "png" else "jpg"
            val storageRef = storage.reference.child("conversations/$conversationId/$fileId.$extension")
            val metadata = StorageMetadata.Builder()
                .setContentType(mimeType)
                .build()

            storageRef.putFile(fileUri, metadata).await()
            val downloadUrl = storageRef.downloadUrl.await().toString()
            Result.success(downloadUrl)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
