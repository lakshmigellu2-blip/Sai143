package com.mitrachat.app

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.firestore.FirebaseFirestore
import com.mitrachat.app.data.repository.AuthRepository
import com.mitrachat.app.data.repository.AuthRepositoryImpl
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class AuthRepositoryTest {

    private lateinit var mockAuth: FirebaseAuth
    private lateinit var mockFirestore: FirebaseFirestore
    private lateinit var authRepository: AuthRepository

    @Before
    fun setUp() {
        mockAuth = mockk(relaxed = true)
        mockFirestore = mockk(relaxed = true)
        authRepository = AuthRepositoryImpl(mockAuth, mockFirestore)
    }

    @Test
    fun `currentUser returns authenticated user when signed in`() {
        val mockUser: FirebaseUser = mockk {
            every { uid } returns "test_uid_123"
            every { email } returns "lakshmi@example.com"
        }
        every { mockAuth.currentUser } returns mockUser

        val user = authRepository.currentUser
        assertNotNull(user)
        assertEquals("test_uid_123", user?.uid)
        assertEquals("test_uid_123", authRepository.currentUserId)
    }

    @Test
    fun `currentUser returns null when signed out`() {
        every { mockAuth.currentUser } returns null
        assertNull(authRepository.currentUser)
        assertNull(authRepository.currentUserId)
    }

    @Test
    fun `signOut triggers firebase auth sign out`() = runTest {
        authRepository.signOut()
        verify(exactly = 1) { mockAuth.signOut() }
    }
}
