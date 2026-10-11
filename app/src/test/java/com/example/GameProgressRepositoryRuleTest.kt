package com.example

import com.example.data.model.LevelRecord
import com.example.data.model.UserProfile
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class GameProgressRepositoryRuleTest {

    @Test
    fun userProfile_modelIntegrity() {
        val profile = UserProfile(
            userId = "test-user-123",
            displayName = "PuzzleMaster",
            unlockedLevel = 5,
            totalStars = 12,
            updatedAt = null
        )
        assertEquals("test-user-123", profile.userId)
        assertEquals("PuzzleMaster", profile.displayName)
        assertEquals(5, profile.unlockedLevel)
        assertEquals(12, profile.totalStars)
    }

    @Test
    fun levelRecord_modelIntegrity() {
        val record = LevelRecord(
            userId = "test-user-123",
            levelNumber = 1,
            stars = 3,
            bestMoves = 10,
            bestTimeSeconds = 35,
            completedAt = null
        )
        assertEquals("test-user-123", record.userId)
        assertEquals(1, record.levelNumber)
        assertEquals(3, record.stars)
        assertEquals(10, record.bestMoves)
        assertEquals(35, record.bestTimeSeconds)
    }
}
