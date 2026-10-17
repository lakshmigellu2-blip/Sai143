package com.mitrachat.app

import com.google.firebase.Timestamp
import com.mitrachat.app.data.model.Conversation
import com.mitrachat.app.data.model.Message
import com.mitrachat.app.data.model.MessageStatus
import com.mitrachat.app.data.model.User
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ChatRepositoryTest {

    @Test
    fun `Conversation getResolvedTitle returns other participant name for 1-on-1`() {
        val conv = Conversation(
            id = "direct_userA_userB",
            isGroup = false,
            participantIds = listOf("userA", "userB"),
            participantDetails = mapOf(
                "userA" to mapOf("displayName" to "Lakshmi"),
                "userB" to mapOf("displayName" to "Aarav")
            )
        )

        // For userA viewer, title must be Aarav
        assertEquals("Aarav", conv.getResolvedTitle("userA"))
        // For userB viewer, title must be Lakshmi
        assertEquals("Lakshmi", conv.getResolvedTitle("userB"))
    }

    @Test
    fun `Conversation getResolvedTitle returns group title for groups`() {
        val conv = Conversation(
            id = "group_123",
            isGroup = true,
            title = "Android Devs",
            participantIds = listOf("userA", "userB", "userC")
        )

        assertEquals("Android Devs", conv.getResolvedTitle("userA"))
    }

    @Test
    fun `Message isReadBy correctly evaluates read receipt array`() {
        val message = Message(
            id = "msg_1",
            conversationId = "conv_1",
            senderId = "userA",
            text = "Hello world!",
            status = MessageStatus.READ.name,
            readBy = listOf("userA", "userB")
        )

        assertTrue(message.isReadBy("userB"))
        assertFalse(message.isReadBy("userC"))
    }
}
