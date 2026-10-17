package com.mitrachat.app.ui.contacts

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.mitrachat.app.data.model.User
import com.mitrachat.app.data.repository.ChatRepository
import com.mitrachat.app.data.repository.ChatRepositoryImpl
import com.mitrachat.app.data.repository.UserRepository
import com.mitrachat.app.data.repository.UserRepositoryImpl
import com.mitrachat.app.ui.theme.MitraGreenDark
import com.mitrachat.app.ui.theme.MitraGreenPrimary
import kotlinx.coroutines.launch

@Composable
fun ContactsScreen(
    currentUserId: String,
    currentUser: User?,
    onOpenConversation: (conversationId: String, participantName: String) -> Unit,
    userRepository: UserRepository = remember { UserRepositoryImpl() },
    chatRepository: ChatRepository = remember { ChatRepositoryImpl() }
) {
    var searchQuery by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<User>>(emptyList()) }
    var isSearching by remember { mutableStateOf(false) }
    var selectedUserForAction by remember { mutableStateOf<User?>(null) }
    var showReportDialog by remember { mutableStateOf(false) }
    var reportReason by remember { mutableStateOf("") }

    val coroutineScope = rememberCoroutineScope()

    fun performSearch(query: String) {
        searchQuery = query
        if (query.trim().length >= 2) {
            isSearching = true
            coroutineScope.launch {
                val result = userRepository.searchUsersByUsername(query, currentUserId)
                searchResults = result.getOrDefault(emptyList())
                isSearching = false
            }
        } else {
            searchResults = emptyList()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Search Input
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { performSearch(it) },
            placeholder = { Text("Search by username (e.g. 'aarav', 'priya')...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        if (isSearching) {
            Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = MitraGreenPrimary)
            }
        } else if (searchQuery.isNotBlank() && searchResults.isEmpty()) {
            Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                Text(
                    text = "No users found matching \"$searchQuery\"",
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }
        } else {
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(searchResults, key = { it.uid }) { user ->
                    ContactRow(
                        user = user,
                        onChatClick = {
                            if (currentUser != null) {
                                coroutineScope.launch {
                                    val conv = chatRepository.getOrCreateOneToOneConversation(currentUser, user)
                                    conv.onSuccess {
                                        onOpenConversation(it.id, user.displayName)
                                    }
                                }
                            }
                        },
                        onBlockClick = {
                            coroutineScope.launch {
                                userRepository.blockUser(currentUserId, user.uid)
                            }
                        },
                        onReportClick = {
                            selectedUserForAction = user
                            showReportDialog = true
                        }
                    )
                    HorizontalDivider(
                        modifier = Modifier.padding(start = 68.dp),
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)
                    )
                }
            }
        }
    }

    // Report Dialog
    if (showReportDialog && selectedUserForAction != null) {
        AlertDialog(
            onDismissRequest = { showReportDialog = false },
            title = { Text("Report ${selectedUserForAction!!.displayName}") },
            text = {
                Column {
                    Text("Help us keep Mitra Chat safe. Why are you reporting this user?")
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = reportReason,
                        onValueChange = { reportReason = it },
                        placeholder = { Text("Reason (spam, harassment, inappropriate)...") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        coroutineScope.launch {
                            userRepository.reportUser(currentUserId, selectedUserForAction!!.uid, reportReason)
                            showReportDialog = false
                            reportReason = ""
                        }
                    }
                ) {
                    Text("Submit Report")
                }
            },
            dismissButton = {
                TextButton(onClick = { showReportDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun ContactRow(
    user: User,
    onChatClick: () -> Unit,
    onBlockClick: () -> Unit,
    onReportClick: () -> Unit
) {
    var menuExpanded by remember { mutableStateOf(false) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onChatClick)
            .padding(vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(MitraGreenPrimary.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            if (user.photoUrl.isNotBlank()) {
                AsyncImage(
                    model = user.photoUrl,
                    contentDescription = user.displayName,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize().clip(CircleShape)
                )
            } else {
                Icon(Icons.Default.Person, contentDescription = null, tint = MitraGreenDark)
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = user.displayName,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = "@${user.searchableUsername} • ${user.status}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                maxLines = 1
            )
        }

        IconButton(onClick = onChatClick) {
            Icon(Icons.Default.Chat, contentDescription = "Chat", tint = MitraGreenPrimary)
        }

        Box {
            IconButton(onClick = { menuExpanded = true }) {
                Icon(Icons.Default.MoreVert, contentDescription = "Options")
            }
            DropdownMenu(
                expanded = menuExpanded,
                onDismissRequest = { menuExpanded = false }
            ) {
                DropdownMenuItem(
                    text = { Text("Block User") },
                    onClick = {
                        menuExpanded = false
                        onBlockClick()
                    },
                    leadingIcon = { Icon(Icons.Default.Block, contentDescription = null) }
                )
                DropdownMenuItem(
                    text = { Text("Report User") },
                    onClick = {
                        menuExpanded = false
                        onReportClick()
                    },
                    leadingIcon = { Icon(Icons.Default.Flag, contentDescription = null) }
                )
            }
        }
    }
}
