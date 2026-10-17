package com.mitrachat.app.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mitrachat.app.data.model.Conversation
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
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class HomeUiState(
    val currentTab: Int = 0, // 0 = Chats, 1 = Contacts, 2 = Settings
    val searchQuery: String = "",
    val isLoading: Boolean = true,
    val errorMessage: String? = null,
    val currentUserProfile: User? = null
)

class HomeViewModel(
    private val authRepository: AuthRepository = AuthRepositoryImpl(),
    private val chatRepository: ChatRepository = ChatRepositoryImpl(),
    private val userRepository: UserRepository = UserRepositoryImpl()
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    val currentUserId: String = authRepository.currentUserId ?: ""

    private val _rawConversations = if (currentUserId.isNotBlank()) {
        chatRepository.observeConversations(currentUserId)
            .catch { emit(emptyList()) }
    } else {
        kotlinx.coroutines.flow.flowOf(emptyList())
    }

    val filteredConversations: StateFlow<List<Conversation>> = combine(
        _rawConversations,
        _uiState
    ) { conversations, state ->
        val query = state.searchQuery.trim().lowercase()
        if (query.isBlank()) {
            conversations
        } else {
            conversations.filter { conv ->
                val title = conv.getResolvedTitle(currentUserId).lowercase()
                val lastMsg = conv.lastMessage.lowercase()
                title.contains(query) || lastMsg.contains(query)
            }
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    init {
        loadCurrentUser()
    }

    private fun loadCurrentUser() {
        if (currentUserId.isNotBlank()) {
            viewModelScope.launch {
                userRepository.observeUserProfile(currentUserId).collect { user ->
                    _uiState.update { it.copy(currentUserProfile = user, isLoading = false) }
                }
            }
        } else {
            _uiState.update { it.copy(isLoading = false) }
        }
    }

    fun setTab(index: Int) {
        _uiState.update { it.copy(currentTab = index) }
    }

    fun onSearchQueryChanged(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun signOut(onSignedOut: () -> Unit) {
        viewModelScope.launch {
            authRepository.signOut()
            onSignedOut()
        }
    }
}
