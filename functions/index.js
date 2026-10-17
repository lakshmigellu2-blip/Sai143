/**
 * Mitra Chat - Firebase Cloud Functions Backend
 * Secure Server-Side Push Notification Trigger
 *
 * Runs with elevated Admin privileges inside Google Cloud.
 * NEVER put Firebase Admin private keys or service accounts in the Android app.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

/**
 * Triggers on new message document creation under any conversation.
 * Looks up the recipient's FCM tokens from their user document and dispatches
 * a secure high-priority FCM notification.
 */
exports.onMessageCreated = functions.firestore
  .document("conversations/{conversationId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const conversationId = context.params.conversationId;
    const senderId = message.senderId;
    const senderName = message.senderName || "New Message";
    const textSnippet = message.text || (message.mediaUrl ? "[Photo]" : "Sent you a message");

    try {
      // 1. Fetch parent conversation to find recipients
      const convDoc = await admin.firestore().collection("conversations").doc(conversationId).get();
      if (!convDoc.exists) return null;

      const convData = convDoc.data();
      const participantIds = convData.participantIds || [];

      // Recipients are all participants except the sender
      const recipientIds = participantIds.filter((uid) => uid !== senderId);
      if (recipientIds.length === 0) return null;

      // 2. Fetch FCM tokens for each recipient
      const userDocs = await Promise.all(
        recipientIds.map((uid) => admin.firestore().collection("users").doc(uid).get())
      );

      const tokens = [];
      userDocs.forEach((doc) => {
        if (doc.exists) {
          const userFCMs = doc.data().fcmTokens || [];
          tokens.push(...userFCMs);
        }
      });

      if (tokens.length === 0) {
        console.log("No FCM tokens registered for recipients");
        return null;
      }

      // 3. Construct and send Multicast notification
      const payload = {
        tokens: [...new Set(tokens)], // Deduplicate tokens
        notification: {
          title: convData.isGroup ? `${convData.title} (${senderName})` : senderName,
          body: textSnippet,
        },
        data: {
          conversationId: conversationId,
          senderId: senderId,
          senderName: senderName,
          messageText: textSnippet,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        android: {
          priority: "high",
          notification: {
            channelId: "mitra_chat_messages_channel",
            sound: "default",
            color: "#008069",
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(payload);
      console.log(`Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`);
      return response;
    } catch (error) {
      console.error("Error dispatching FCM notification:", error);
      return null;
    }
  });
