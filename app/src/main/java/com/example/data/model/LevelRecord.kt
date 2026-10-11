package com.example.data.model

import com.google.firebase.Timestamp

data class LevelRecord(
    val userId: String = "",
    val levelNumber: Int = 1,
    val stars: Int = 1,
    val bestMoves: Int = 0,
    val bestTimeSeconds: Int = 0,
    val completedAt: Timestamp? = null
)
