package com.mitrachat.app

import androidx.lifecycle.SavedStateHandle
import com.mitrachat.app.data.model.Message
import com.mitrachat.app.data.model.User
import com.mitrachat.app.data.repository.AuthRepository
import com.mitrachat.app.data.repository.ChatRepository
import com.mitrachat.app.data.repository.UserRepository
import com.mitrachat.app.ui.chat.ChatViewModel
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class ChatViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var mockAuthRepo: AuthRepository
    private lateinit var mockChatRepo: ChatRepository
    private lateinit var mockUserRepo: UserRepository
    private lateinit var savedStateHandle: SavedStateHandle

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        mockAuthRepo = mockk {
            every { currentUserId } returns "user_me"
        }
        mockChatRepo = mockk(relaxed = true) {
            every { observeMessages("conv_101", any()) } returns flowOf(emptyList())
        }
        mockUserRepo = mockk(relaxed = true) {
            coEvery { getUserProfile("user_me") } returns Result.success(User(uid = "user_me", displayName = "Test User"))
        }
        savedStateHandle = SavedStateHandle(
            mapOf("conversationId" to "conv_101", "participantName" to "Priya")
        )
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `initial uiState contains correct conversationId and participantName`() {
        val viewModel = ChatViewModel(savedStateHandle, mockAuthRepo, mockChatRepo, mockUserRepo)
        assertEquals("conv_101", viewModel.uiState.value.conversationId)
        assertEquals("Priya", viewModel.uiState.value.participantName)
    }

    @Test
    fun `onTextChanged updates uiState inputText`() {
        val viewModel = ChatViewModel(savedStateHandle, mockAuthRepo, mockChatRepo, mockUserRepo)
        viewModel.onTextChanged("Hello from test")
        assertEquals("Hello from test", viewModel.uiState.value.inputText)
    }

    @Test
    fun `markRead invokes chatRepository markMessagesAsRead`() = runTest {
        val viewModel = ChatViewModel(savedStateHandle, mockAuthRepo, mockChatRepo, mockUserRepo)
        testDispatcher.scheduler.advanceUntilIdle()
        coVerify { mockChatRepo.markMessagesAsRead("conv_101", "user_me") }
    }
}
