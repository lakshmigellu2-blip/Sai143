# Mitra Chat - Security Specification & Threat Audit

## 1. Data Invariants
- **Identity Invariant**: Only the authenticated user (`request.auth.uid`) can create or modify their own `/users/{uid}` document.
- **Privacy / Anti-Harvesting Invariant**: Private email address is protected. User discovery is performed via explicit `searchableUsername` without blanket database dumping.
- **Conversation Isolation**: Only users whose UID is in `participantIds` can read, query, or receive message updates in a conversation.
- **Anti-Impersonation**: In `messages/{messageId}`, `incoming().senderId` MUST strictly match `request.auth.uid`. No user can send a message pretending to be another participant.
- **Self-Conversation Prevention**: A 1-to-1 conversation MUST have exactly 2 distinct participant IDs (`participantIds[0] != participantIds[1]`).
- **Temporal Integrity**: `createdAt`, `timestamp`, and `updatedAt` MUST use Firestore server timestamps (`request.time`) to prevent backdated or future-dated attacks.

## 2. The "Dirty Dozen" Vulnerability Payloads & Defenses

1. **Payload 1: Impersonated Sender**
   - Attempt: User `attacker123` sends message with `senderId: "victim456"`.
   - Result: `PERMISSION_DENIED` (Blocked by `incoming().senderId == request.auth.uid`).
2. **Payload 2: Eavesdropping on Foreign Conversation**
   - Attempt: User `eavesdropper` queries `/conversations/otherConv/messages`.
   - Result: `PERMISSION_DENIED` (Blocked by `isParentParticipant()`).
3. **Payload 3: Self-Chat / Duplicate ID Injection**
   - Attempt: User creates conversation with `participantIds: ["userA", "userA"]`.
   - Result: `PERMISSION_DENIED` (Blocked by `participantIds[0] != participantIds[1]`).
4. **Payload 4: Client Timestamp Forgery**
   - Attempt: User submits historical or future timestamp `timestamp: "2020-01-01"`.
   - Result: `PERMISSION_DENIED` (Blocked by `incoming().timestamp == request.time`).
5. **Payload 5: Massive Text Payload (Denial of Wallet)**
   - Attempt: Message with 500,000 characters text.
   - Result: `PERMISSION_DENIED` (Blocked by `data.text.size() <= 4000`).
6. **Payload 6: Shadow Field Injection in Profile**
   - Attempt: Profile update payload includes `isAdmin: true` or `verifiedStatus: true`.
   - Result: `PERMISSION_DENIED` (Blocked by strict `keys().hasOnly(...)`).
7. **Payload 7: Foreign Message Tampering**
   - Attempt: User B attempts to edit User A's sent message text.
   - Result: `PERMISSION_DENIED` (Blocked by `existing().senderId == request.auth.uid`).
8. **Payload 8: Storage Executable File Injection**
   - Attempt: User attempts to upload `.apk` or `.exe` script to `/users/{uid}/profile.jpg`.
   - Result: `PERMISSION_DENIED` (Blocked by `contentType.matches('image/.*')`).
9. **Payload 9: Unauthenticated Read**
   - Attempt: Guest/anonymous client reads `/conversations`.
   - Result: `PERMISSION_DENIED` (Blocked by `request.auth != null`).
10. **Payload 10: ID Poisoning / Traversal**
    - Attempt: Document ID containing slashes or illegal characters.
    - Result: `PERMISSION_DENIED` (Blocked by `isValidId(id)` regex).
11. **Payload 11: Deleting Other User's Account Document**
    - Attempt: User A sends `DELETE /users/userB`.
    - Result: `PERMISSION_DENIED` (Blocked by `isOwner(userId)`).
12. **Payload 12: Blanket Collection Scraping**
    - Attempt: Client queries all conversations without `participantIds` array-contains filter.
    - Result: `PERMISSION_DENIED` (Blocked by `resource.data.participantIds` evaluation).
