package com.mitrachat.app.ui.navigation

sealed class Screen(val route: String) {
    object Auth : Screen("auth")
    object Home : Screen("home")
    object Chat : Screen("chat/{conversationId}/{participantName}") {
        fun createRoute(conversationId: String, participantName: String = "Chat"): String {
            val encodedName = java.net.URLEncoder.encode(participantName, "UTF-8")
            return "chat/$conversationId/$encodedName"
        }
    }
    object Profile : Screen("profile")
    object Settings : Screen("settings")
    object NewGroup : Screen("new_group")
}
