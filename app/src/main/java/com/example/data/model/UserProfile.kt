package com.example.data.model

import com.google.firebase.Timestamp

data class UserProfile(
    val userId: String = "",
    val displayName: String = "",
    val unlockedLevel: Int = 1,
    val totalStars: Int = 0,
    val updatedAt: Timestamp? = null
)
