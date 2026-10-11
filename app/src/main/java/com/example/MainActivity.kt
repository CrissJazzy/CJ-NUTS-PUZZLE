package com.example

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.lifecycleScope
import com.example.auth.AuthManager
import com.example.data.repository.GameProgressRepository
import com.example.ui.theme.MyApplicationTheme
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject

private const val TAG = "MainActivity"

class MainActivity : ComponentActivity() {

    private var webViewRef: WebView? = null
    private lateinit var authManager: AuthManager
    private lateinit var repository: GameProgressRepository
    private var authListener: FirebaseAuth.AuthStateListener? = null
    private var profileListener: ListenerRegistration? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        authManager = AuthManager(this)
        repository = GameProgressRepository(this)

        setupAuthListener()

        setContent {
            MyApplicationTheme {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFF0E1117))
                ) {
                    GameWebView(
                        onWebViewCreated = { webView ->
                            webViewRef = webView
                        },
                        authManager = authManager,
                        repository = repository,
                        activity = this@MainActivity
                    )
                }

                BackHandler {
                    val wv = webViewRef
                    if (wv != null) {
                        wv.evaluateJavascript("window.onAndroidBackPressed ? window.onAndroidBackPressed() : false") { result ->
                            if (result != "true") {
                                finish()
                            }
                        }
                    } else {
                        finish()
                    }
                }
            }
        }
    }

    private fun setupAuthListener() {
        authListener = FirebaseAuth.AuthStateListener { auth ->
            val user = auth.currentUser
            profileListener?.remove()
            profileListener = null

            if (user != null) {
                val userJson = JSONObject().apply {
                    put("uid", user.uid)
                    put("displayName", user.displayName ?: "Player")
                    put("email", user.email ?: "")
                }.toString()

                runOnUiThread {
                    webViewRef?.evaluateJavascript("window.onAuthChanged && window.onAuthChanged($userJson)", null)
                }

                profileListener = repository.listenToUserProfile { profile ->
                    if (profile != null) {
                        runOnUiThread {
                            webViewRef?.evaluateJavascript(
                                "window.onCloudSaveLoaded && window.onCloudSaveLoaded(${profile.unlockedLevel}, ${profile.totalStars})",
                                null
                            )
                        }
                    }
                }
            } else {
                runOnUiThread {
                    webViewRef?.evaluateJavascript("window.onAuthChanged && window.onAuthChanged(null)", null)
                }
            }
        }
        authManager.auth.addAuthStateListener(authListener!!)
    }

    override fun onDestroy() {
        authListener?.let { authManager.auth.removeAuthStateListener(it) }
        profileListener?.remove()
        webViewRef?.destroy()
        webViewRef = null
        super.onDestroy()
    }
}

class AndroidBridge(
    private val context: Context,
    private val authManager: AuthManager,
    private val repository: GameProgressRepository,
    private val activity: ComponentActivity
) {
    @JavascriptInterface
    fun vibrate(durationMs: Long) {
        try {
            val ms = durationMs.coerceIn(10, 500)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vibratorManager?.defaultVibrator?.vibrate(
                    VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE)
                )
            } else {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator?.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(ms)
                }
            }
        } catch (_: Exception) {}
    }

    @JavascriptInterface
    fun signInWithGoogle() {
        activity.lifecycleScope.launch(Dispatchers.Main) {
            val result = authManager.signInWithGoogle()
            result.onSuccess { user ->
                Log.d(TAG, "Google Sign In success: ${user.uid}")
            }.onFailure { err ->
                Log.e(TAG, "Google Sign In failed: ${err.message}", err)
            }
        }
    }

    @JavascriptInterface
    fun signOut() {
        activity.lifecycleScope.launch(Dispatchers.Main) {
            authManager.signOut()
        }
    }

    @JavascriptInterface
    fun syncProgress(unlockedLevel: Int, totalStars: Int) {
        activity.lifecycleScope.launch(Dispatchers.IO) {
            try {
                if (authManager.currentUser != null) {
                    repository.saveOrUpdateProgress(
                        unlockedLevel = unlockedLevel,
                        totalStars = totalStars,
                        displayName = authManager.currentUser?.displayName
                    )
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to sync progress to Firestore", e)
            }
        }
    }

    @JavascriptInterface
    fun recordLevelCompleted(level: Int, stars: Int, moves: Int, timeSeconds: Int) {
        activity.lifecycleScope.launch(Dispatchers.IO) {
            try {
                if (authManager.currentUser != null) {
                    repository.recordLevelCompleted(
                        levelNumber = level,
                        stars = stars,
                        moves = moves,
                        timeSeconds = timeSeconds
                    )
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to record level completion", e)
            }
        }
    }

    @JavascriptInterface
    fun getAuthStatus(): String {
        val user = authManager.currentUser
        return if (user != null) {
            JSONObject().apply {
                put("uid", user.uid)
                put("displayName", user.displayName ?: "Player")
                put("email", user.email ?: "")
            }.toString()
        } else {
            ""
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun GameWebView(
    onWebViewCreated: (WebView) -> Unit,
    authManager: AuthManager,
    repository: GameProgressRepository,
    activity: ComponentActivity,
    modifier: Modifier = Modifier
) {
    AndroidView(
        modifier = modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                setLayerType(View.LAYER_TYPE_HARDWARE, null)
                setBackgroundColor(0xFF0E1117.toInt())

                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    allowFileAccess = true
                    databaseEnabled = true
                    mediaPlaybackRequiresUserGesture = false
                    useWideViewPort = true
                    loadWithOverviewMode = true
                    cacheMode = WebSettings.LOAD_DEFAULT
                }

                webChromeClient = WebChromeClient()
                webViewClient = WebViewClient()

                addJavascriptInterface(
                    AndroidBridge(context, authManager, repository, activity),
                    "AndroidBridge"
                )

                loadUrl("file:///android_asset/web/index.html")
                onWebViewCreated(this)
            }
        }
    )
}
