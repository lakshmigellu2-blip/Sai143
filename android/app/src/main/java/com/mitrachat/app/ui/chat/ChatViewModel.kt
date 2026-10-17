package com.mitrachat.app.ui.chat

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mitrachat.app.data.model.MediaType
import com.mitrachat.app.data.model.Message
import com.mitrachat.app.data.model.User
import com.mitrachat.app.data.repository.AuthRepository
import com.mitrachat.app.data.repository.AuthRepositoryImpl
import com.mitrachat.app.data.repository.ChatRepository
import com.mitrachat.app.data.repository.ChatRepositoryImpl
import com.mitrachat.app.data.repository.UserRepository
import com.mitrachat.app.data.repository.UserRepositoryImpl
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ChatUiState(
    val conversationId: String = "",
    val participantName: String = "",
    val inputText: String = "",
    val isSending: Boolean = false,
    val replyingTo: Message? = null,
    val selectedAttachmentUrl: String? = null,
    val selectedAttachmentType: MediaType = MediaType.NONE,
    val currentUser: User? = null,
    val error: String? = null
)

class ChatViewModel(
    savedStateHandle: SavedStateHandle,
    private val authRepository: AuthRepository = AuthRepositoryImpl(),
    private val chatRepository: ChatRepository = ChatRepositoryImpl(),
    private val userRepository: UserRepository = UserRepositoryImpl()
) : ViewModel() {

    private val conversationId: String = checkNotNull(savedStateHandle["conversationId"])
    private val participantName: String = savedStateHandle["participantName"] ?: "Chat"

    val currentUserId: String = authRepository.currentUserId ?: ""

    private val _uiState = MutableStateFlow(
        ChatUiState(
            conversationId = conversationId,
            participantName = participantName
        )
    )
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    val messages: StateFlow<List<Message>> = chatRepository.observeMessages(conversationId)
        .catch { emit(emptyList()) }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    init {
        loadCurrentUser()
        markRead()
    }

    private fun loadCurrentUser() {
        if (currentUserId.isNotBlank()) {
            viewModelScope.launch {
                val user = userRepository.getUserProfile(currentUserId).getOrNull()
                _uiState.update { it.copy(currentUser = user) }
            }
        }
    }

    fun markRead() {
        if (currentUserId.isNotBlank()) {
            viewModelScope.launch {
                chatRepository.markMessagesAsRead(conversationId, currentUserId)
            }
        }
    }

    fun onTextChanged(text: String) {
        _uiState.update { it.copy(inputText = text) }
    }

    fun onReplyTo(message: Message?) {
        _uiState.update { it.copy(replyingTo = message) }
    }

    fun setAttachment(url: String, type: MediaType) {
        _uiState.update { it.copy(selectedAttachmentUrl = url, selectedAttachmentType = type) }
    }

    fun clearAttachment() {
        _uiState.update { it.copy(selectedAttachmentUrl = null, selectedAttachmentType = MediaType.NONE) }
    }

    fun sendMessage() {
        val state = _uiState.value
        val text = state.inputText.trim()
        val attachmentUrl = state.selectedAttachmentUrl ?: ""
        val attachmentType = state.selectedAttachmentType

        if (text.isEmpty() && attachmentUrl.isEmpty()) return

        val user = state.currentUser ?: return

        viewModelScope.launch {
            _uiState.update { it.copy(isSending = true, error = null) }
            val result = chatRepository.sendMessage(
                conversationId = conversationId,
                sender = user,
                text = text,
                mediaUrl = attachmentUrl,
                mediaType = attachmentType,
                replyTo = state.replyingTo
            )
            result.onSuccess {
                _uiState.update {
                    it.copy(
                        inputText = "",
                        replyingTo = null,
                        selectedAttachmentUrl = null,
                        selectedAttachmentType = MediaType.NONE,
                        isSending = false
                    )
                }
            }.onFailure { err ->
                _uiState.update { it.copy(isSending = false, error = err.message) }
            }
        }
    }

    fun deleteMessage(messageId: String) {
        viewModelScope.launch {
            chatRepository.deleteMessage(conversationId, messageId)
        }
    }
}
