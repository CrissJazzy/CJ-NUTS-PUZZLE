package com.example.data.repository

import android.content.Context
import com.example.R
import com.example.data.model.UserProfile
import com.google.firebase.FieldValue
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.tasks.await

class GameProgressRepository(
    private val db: FirebaseFirestore,
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) {
    constructor(context: Context) : this(
        FirebaseFirestore.getInstance(
            context.applicationContext.getString(R.string.firestore_database_id)
        ),
        FirebaseAuth.getInstance()
    )

    fun requireUserId(): String {
        return auth.currentUser?.uid ?: error("User must be authenticated to perform Firestore operations")
    }

    suspend fun saveOrUpdateProgress(unlockedLevel: Int, totalStars: Int, displayName: String?) {
        val uid = requireUserId()
        val name = displayName ?: auth.currentUser?.displayName ?: "Player"
        val data = hashMapOf(
            "userId" to uid,
            "displayName" to name.take(100),
            "unlockedLevel" to unlockedLevel.coerceIn(1, 30),
            "totalStars" to totalStars.coerceIn(0, 90),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        db.collection("users").document(uid).set(data).await()
    }

    suspend fun recordLevelCompleted(levelNumber: Int, stars: Int, moves: Int, timeSeconds: Int) {
        val uid = requireUserId()
        val docRef = db.collection("users").document(uid)
            .collection("records").document(levelNumber.toString())

        val recordData = hashMapOf(
            "userId" to uid,
            "levelNumber" to levelNumber.coerceIn(1, 30),
            "stars" to stars.coerceIn(1, 3),
            "bestMoves" to moves.coerceIn(1, 9999),
            "bestTimeSeconds" to timeSeconds.coerceIn(1, 86400),
            "completedAt" to FieldValue.serverTimestamp()
        )
        docRef.set(recordData).await()
    }

    fun listenToUserProfile(onProfile: (UserProfile?) -> Unit): ListenerRegistration? {
        val uid = auth.currentUser?.uid ?: return null
        return db.collection("users").document(uid).addSnapshotListener { snapshot, error ->
            if (error != null) {
                onProfile(null)
                return@addSnapshotListener
            }
            if (snapshot != null && snapshot.exists()) {
                val profile = UserProfile(
                    userId = snapshot.getString("userId") ?: uid,
                    displayName = snapshot.getString("displayName") ?: "",
                    unlockedLevel = (snapshot.getLong("unlockedLevel") ?: 1L).toInt(),
                    totalStars = (snapshot.getLong("totalStars") ?: 0L).toInt(),
                    updatedAt = snapshot.getTimestamp("updatedAt")
                )
                onProfile(profile)
            } else {
                onProfile(null)
            }
        }
    }
}
