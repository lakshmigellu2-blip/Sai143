# Mitra Chat - Firebase & Native Android Setup Guide

This guide provides end-to-end instructions for configuring Google Sign-In, Cloud Firestore, Firebase Cloud Storage, and Push Notifications for **Mitra Chat** (`com.mitrachat.app`).

---

## 1. Firebase Project Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new Firebase project (e.g. `mitra-chat-prod`).
3. Click **Add App** and select **Android**.
4. Register the package name:
   - **Android package name**: `com.mitrachat.app`
   - **App nickname**: `Mitra Chat`

---

## 2. SHA-1 & SHA-256 Certificate Fingerprints (Mandatory for Google Sign-In)

Google Sign-In with Android Credential Manager **will fail with an API exception** if the SHA-1 signing fingerprint is not added to your Firebase Android app.

### For Debug Builds:
Run this command in your Android project terminal:
```bash
cd android
./gradlew signingReport
```
Or with `keytool`:
```bash
keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android -keypass android
```
Copy the **SHA-1** and **SHA-256** lines and paste them into:
**Firebase Console -> Project Settings -> Your Apps -> Android App -> Add Fingerprint**.

---

## 3. Enable Google Sign-In in Firebase Authentication

1. Go to **Firebase Console -> Build -> Authentication -> Sign-in method**.
2. Click **Add new provider** and select **Google**.
3. Toggle **Enable**.
4. Set the **Project support email** (e.g. your Gmail).
5. Click **Save**.
6. Under **Web SDK configuration**, copy the **Web Client ID** (e.g., `123456789-abcdef.apps.googleusercontent.com`).
7. Paste this client ID into:
   `android/app/src/main/res/values/strings.xml`:
   ```xml
   <string name="default_web_client_id">YOUR_COPIED_WEB_CLIENT_ID.apps.googleusercontent.com</string>
   ```

---

## 4. Place `google-services.json`

1. In Firebase Console, download the `google-services.json` file for `com.mitrachat.app`.
2. Place the file at:
   ```
   android/app/google-services.json
   ```

---

## 5. Deploy Cloud Firestore Rules & Indexes

Deploy the hardened ABAC security rules provided in `firestore.rules`:
```bash
firebase deploy --only firestore:rules
```

### Required Firestore Composite Index:
For querying conversations sorted by recent activity:
- Collection: `conversations`
- Fields:
  - `participantIds` (Array-contains)
  - `lastMessageTimestamp` (Descending)
- Query scope: Collection

---

## 6. Deploy Firebase Cloud Storage Rules

Deploy the storage security rules provided in `storage.rules`:
```bash
firebase deploy --only storage
```

---

## 7. Deploy Push Notifications Cloud Function

Deploy the serverless FCM trigger provided in `functions/`:
```bash
cd functions
npm install
firebase deploy --only functions
```
*Note: Never place service account private keys inside the Android app! The Cloud Function securely queries recipient tokens and sends multicast FCM notifications automatically when new message documents are created in Firestore.*

---

## 8. Building & Running in Android Studio

1. Open Android Studio (Ladybug / Koala or newer).
2. Click **Open** and select the `android/` directory.
3. Allow Gradle to sync dependencies.
4. Select a connected device or Android Virtual Device (AVD running API 26+).
5. Click **Run 'app'** (`Shift + F10`).
6. Sign in with any Google account to begin real-time messaging!
