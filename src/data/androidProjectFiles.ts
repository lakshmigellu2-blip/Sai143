export interface ProjectFile {
  path: string;
  name: string;
  category: 'kotlin' | 'gradle' | 'xml' | 'rules' | 'docs';
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: ProjectFile[] = [
  {
    path: 'android/app/src/main/java/com/mitrachat/app/MainActivity.kt',
    name: 'MainActivity.kt',
    category: 'kotlin',
    description: 'ComponentActivity entry point, Edge-to-Edge, and notification permission launcher',
    content: `package com.mitrachat.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.mitrachat.app.ui.navigation.MitraChatNavHost
import com.mitrachat.app.ui.theme.MitraChatTheme

class MainActivity : ComponentActivity() {

    private val requestNotificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _ -> }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        requestNotificationPermission()

        setContent {
            MitraChatTheme {
                MitraChatNavHost()
            }
        }
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val hasPermission = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED

            if (!hasPermission) {
                requestNotificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }
}`
  },
  {
    path: 'android/app/src/main/java/com/mitrachat/app/MitraApplication.kt',
    name: 'MitraApplication.kt',
    category: 'kotlin',
    description: 'Application class with Firebase initialization and notification channels',
    content: `package com.mitrachat.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.google.firebase.FirebaseApp

class MitraApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        FirebaseApp.initializeApp(this)
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_MESSAGES_ID,
                "Mitra Messages",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Incoming chat messages and notifications"
                enableVibration(true)
                setShowBadge(true)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    companion object {
        const val CHANNEL_MESSAGES_ID = "mitra_chat_messages_channel"
    }
}`
  },
  {
    path: 'android/app/src/main/java/com/mitrachat/app/data/model/User.kt',
    name: 'User.kt',
    category: 'kotlin',
    description: 'User profile entity with searchableUsername and privacy fields',
    content: `package com.mitrachat.app.data.model

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
}`
  },
  {
    path: 'android/app/src/main/java/com/mitrachat/app/data/model/Conversation.kt',
    name: 'Conversation.kt',
    category: 'kotlin',
    description: '1-to-1 and group chat data model with participant details',
    content: `package com.mitrachat.app.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.ServerTimestamp

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
    fun getResolvedTitle(currentUserId: String): String {
        if (isGroup && title.isNotBlank()) return title
        val otherId = participantIds.firstOrNull { it != currentUserId } ?: return title.ifBlank { "Chat" }
        return participantDetails[otherId]?.get("displayName") ?: title.ifBlank { "Mitra User" }
    }

    fun getResolvedPhotoUrl(currentUserId: String): String {
        if (isGroup) return groupPhotoUrl
        val otherId = participantIds.firstOrNull { it != currentUserId } ?: return ""
        return participantDetails[otherId]?.get("photoUrl") ?: ""
    }

    fun getUnreadCount(userId: String): Int = unreadCounts[userId] ?: 0
}`
  },
  {
    path: 'android/app/src/main/java/com/mitrachat/app/data/model/Message.kt',
    name: 'Message.kt',
    category: 'kotlin',
    description: 'Real-time chat message model with delivery status & attachments',
    content: `package com.mitrachat.app.data.model

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
        get() = try { MessageStatus.valueOf(status) } catch (_: Exception) { MessageStatus.SENT }

    fun isReadBy(userId: String): Boolean = readBy.contains(userId)
}`
  },
  {
    path: 'android/app/src/main/java/com/mitrachat/app/data/repository/AuthRepository.kt',
    name: 'AuthRepository.kt',
    category: 'kotlin',
    description: 'Android Credential Manager Google Sign-In with Firebase Auth',
    content: `package com.mitrachat.app.data.repository

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
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
}`
  },
  {
    path: 'android/app/src/main/java/com/mitrachat/app/data/repository/ChatRepository.kt',
    name: 'ChatRepository.kt',
    category: 'kotlin',
    description: 'Cloud Firestore real-time Flow listeners, message dispatch & read receipts',
    content: `package com.mitrachat.app.data.repository

import com.google.firebase.Timestamp
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.mitrachat.app.data.model.Conversation
import com.mitrachat.app.data.model.MediaType
import com.mitrachat.app.data.model.Message
import com.mitrachat.app.data.model.MessageStatus
import com.mitrachat.app.data.model.User
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

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
}`
  },
  {
    path: 'android/app/src/main/java/com/mitrachat/app/service/MitraFirebaseMessagingService.kt',
    name: 'MitraFirebaseMessagingService.kt',
    category: 'kotlin',
    description: 'FCM push notifications handling & deep link navigation',
    content: `package com.mitrachat.app.service

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.app.NotificationCompat
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.mitrachat.app.MainActivity
import com.mitrachat.app.MitraApplication
import com.mitrachat.app.R

class MitraFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        val uid = FirebaseAuth.getInstance().currentUser?.uid ?: return
        FirebaseFirestore.getInstance().collection("users").document(uid)
            .update("fcmTokens", FieldValue.arrayUnion(token))
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        val senderName = remoteMessage.data["senderName"] ?: "New Message"
        val messageText = remoteMessage.data["messageText"] ?: "You have a new message"
        val conversationId = remoteMessage.data["conversationId"] ?: ""
        sendNotification(senderName, messageText, conversationId)
    }

    private fun sendNotification(title: String, messageBody: String, conversationId: String) {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            data = Uri.parse("mitrachat://chat?conversationId=$conversationId")
        }
        val pendingIntent = PendingIntent.getActivity(
            this, conversationId.hashCode(), intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(this, MitraApplication.CHANNEL_MESSAGES_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(messageBody)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .build()

        (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
            .notify(conversationId.hashCode(), notification)
    }
}`
  },
  {
    path: 'firestore.rules',
    name: 'firestore.rules',
    category: 'rules',
    description: 'Zero-trust ABAC security rules with timestamp verification & anti-impersonation',
    content: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() { return request.auth != null; }
    function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }
    function incoming() { return request.resource.data; }
    function existing() { return resource.data; }
    function isValidId(id) {
      return id is string && id.size() > 0 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$');
    }

    match /users/{userId} {
      allow get, list: if isSignedIn();
      allow create: if isOwner(userId) && incoming().createdAt == request.time;
      allow update: if isOwner(userId) && incoming().uid == existing().uid && incoming().createdAt == existing().createdAt;
      allow delete: if isOwner(userId);
    }

    match /conversations/{conversationId} {
      allow get, list: if isSignedIn() && request.auth.uid in resource.data.participantIds;
      allow create: if isValidId(conversationId) && request.auth.uid in incoming().participantIds && incoming().createdAt == request.time;
      allow update: if isValidId(conversationId) && request.auth.uid in existing().participantIds;
      allow delete: if isValidId(conversationId) && existing().createdBy == request.auth.uid;

      match /messages/{messageId} {
        function getParent() { return get(/databases/$(database)/documents/conversations/$(conversationId)).data; }
        allow get, list: if isSignedIn() && request.auth.uid in getParent().participantIds;
        allow create: if isValidId(messageId)
          && request.auth.uid in getParent().participantIds
          && incoming().senderId == request.auth.uid
          && incoming().timestamp == request.time;
        allow update: if isValidId(messageId) && incoming().diff(existing()).affectedKeys().hasOnly(['readBy', 'status']);
        allow delete: if isValidId(messageId) && existing().senderId == request.auth.uid;
      }
    }
  }
}`
  },
  {
    path: 'android/gradle/libs.versions.toml',
    name: 'gradle/libs.versions.toml',
    category: 'gradle',
    description: 'Version catalog with Firebase BoM 33.7.0, Google GMS 4.4.2, and Credential Manager',
    content: `[versions]
agp = "8.8.0"
kotlin = "2.0.21"
firebaseBom = "33.7.0"
googleGms = "4.4.2"
credentials = "1.3.0"
googleId = "1.1.1"

[libraries]
firebase-bom = { group = "com.google.firebase", name = "firebase-bom", version.ref = "firebaseBom" }
firebase-auth = { group = "com.google.firebase", name = "firebase-auth" }
firebase-firestore = { group = "com.google.firebase", name = "firebase-firestore" }
firebase-storage = { group = "com.google.firebase", name = "firebase-storage" }
firebase-messaging = { group = "com.google.firebase", name = "firebase-messaging" }
androidx-credentials = { group = "androidx.credentials", name = "credentials", version.ref = "credentials" }
google-id = { group = "com.google.android.libraries.identity.googleid", name = "googleid", version.ref = "googleId" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
google-gms = { id = "com.google.gms.google-services", version.ref = "googleGms" }`
  },
  {
    path: 'android/build.gradle.kts',
    name: 'build.gradle.kts (Project)',
    category: 'gradle',
    description: 'Root project build script configuring the Google Services Gradle plugin',
    content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.google.gms) apply false // Google Services Gradle Plugin
}`
  },
  {
    path: 'android/app/google-services.json.template',
    name: 'google-services.json (Location Guide)',
    category: 'rules',
    description: 'Location and format guide for placing the downloaded google-services.json file',
    content: `// PLACE DOWNLOADED FILE AT: android/app/google-services.json
//
// 1. In Firebase Console (https://console.firebase.google.com/):
//    Select your project -> Project Settings -> Your Apps -> Android (com.mitrachat.app).
// 2. Download the 'google-services.json' file.
// 3. Move it directly into the 'android/app/' directory:
//    android/app/google-services.json
//
// The Google Services Gradle plugin reads this exact path during the build process.`
  },
  {
    path: 'android/app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    category: 'gradle',
    description: 'App module build script applying Google Services plugin and Firebase BoM',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.google.gms) // Processes android/app/google-services.json
}

android {
    namespace = "com.mitrachat.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.mitrachat.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    // Firebase BoM manages all Firebase library versions
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth)
    implementation(libs.firebase.firestore)
    implementation(libs.firebase.storage)
    implementation(libs.firebase.messaging)

    // Android Credential Manager for Google Sign-In
    implementation(libs.androidx.credentials)
    implementation(libs.google.id)
}`
  },
  {
    path: 'android/app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'xml',
    description: 'Android manifest with INTERNET, POST_NOTIFICATIONS, and FCM service',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <application
        android:name=".MitraApplication"
        android:allowBackup="true"
        android:label="@string/app_name"
        android:theme="@style/Theme.MitraChat">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <service
            android:name=".service.MitraFirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>
    </application>
</manifest>`
  },
  {
    path: 'functions/index.js',
    name: 'functions/index.js',
    category: 'rules',
    description: 'Firebase Cloud Functions secure server-side push notification dispatcher',
    content: `const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.onMessageCreated = functions.firestore
  .document("conversations/{conversationId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const conversationId = context.params.conversationId;
    const senderId = message.senderId;

    const convDoc = await admin.firestore().collection("conversations").doc(conversationId).get();
    if (!convDoc.exists) return null;

    const participantIds = convDoc.data().participantIds || [];
    const recipientIds = participantIds.filter((uid) => uid !== senderId);

    const userDocs = await Promise.all(
      recipientIds.map((uid) => admin.firestore().collection("users").doc(uid).get())
    );

    const tokens = [];
    userDocs.forEach((doc) => {
      if (doc.exists && doc.data().fcmTokens) {
        tokens.push(...doc.data().fcmTokens);
      }
    });

    if (tokens.length === 0) return null;

    return admin.messaging().sendEachForMulticast({
      tokens: [...new Set(tokens)],
      notification: {
        title: message.senderName || "New Message",
        body: message.text || "Photo",
      },
      data: { conversationId, senderId }
    });
  });`
  }
];
