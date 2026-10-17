package com.mitrachat.app.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mitrachat.app.data.model.User
import com.mitrachat.app.data.repository.AuthRepository
import com.mitrachat.app.data.repository.AuthRepositoryImpl
import com.mitrachat.app.data.repository.UserRepository
import com.mitrachat.app.data.repository.UserRepositoryImpl
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProfileUiState(
    val user: User? = null,
    val displayName: String = "",
    val status: String = "",
    val isSaving: Boolean = false,
    val saveSuccess: Boolean = false,
    val error: String? = null
)

class ProfileViewModel(
    private val authRepository: AuthRepository = AuthRepositoryImpl(),
    private val userRepository: UserRepository = UserRepositoryImpl()
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    val currentUserId: String = authRepository.currentUserId ?: ""

    init {
        loadProfile()
    }

    private fun loadProfile() {
        if (currentUserId.isNotBlank()) {
            viewModelScope.launch {
                val user = userRepository.getUserProfile(currentUserId).getOrNull()
                if (user != null) {
                    _uiState.update {
                        it.copy(
                            user = user,
                            displayName = user.displayName,
                            status = user.status
                        )
                    }
                }
            }
        }
    }

    fun onDisplayNameChanged(name: String) {
        _uiState.update { it.copy(displayName = name) }
    }

    fun onStatusChanged(status: String) {
        _uiState.update { it.copy(status = status) }
    }

    fun saveProfile() {
        val state = _uiState.value
        if (state.displayName.isBlank()) {
            _uiState.update { it.copy(error = "Display name cannot be empty") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, error = null, saveSuccess = false) }
            val res = userRepository.updateProfile(
                userId = currentUserId,
                displayName = state.displayName,
                status = state.status
            )
            res.onSuccess {
                _uiState.update { it.copy(isSaving = false, saveSuccess = true) }
            }.onFailure { err ->
                _uiState.update { it.copy(isSaving = false, error = err.message) }
            }
        }
    }

    fun deleteAccount(onDeleted: () -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true) }
            val res = authRepository.deleteAccount()
            res.onSuccess {
                onDeleted()
            }.onFailure { err ->
                _uiState.update { it.copy(isSaving = false, error = "Failed to delete account: ${err.message}") }
            }
        }
    }
}
