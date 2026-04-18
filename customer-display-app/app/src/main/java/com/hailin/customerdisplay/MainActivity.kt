package com.hailin.customerdisplay

import android.os.Bundle
import android.util.Log
import android.view.WindowManager
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * 主Activity
 * 提供控制界面和API服务
 */
class MainActivity : AppCompatActivity() {

    private lateinit var displayManager: DisplayManager
    private lateinit var apiServer: ApiServer
    private lateinit var displayStatus: TextView
    private lateinit var statusText: TextView
    
    private lateinit var editAmount: EditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 保持屏幕常亮
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        setContentView(R.layout.activity_main)
        
        initViews()
        initDisplayManager()
        initApiServer()
        setupButtons()
        
        // 检查副屏连接状态
        checkDisplayStatus()
    }

    private fun initViews() {
        displayStatus = findViewById(R.id.displayStatus)
        statusText = findViewById(R.id.statusText)
        editAmount = findViewById(R.id.editAmount)
    }

    private fun initDisplayManager() {
        displayManager = DisplayManager(this)
    }

    private fun initApiServer() {
        apiServer = ApiServer(5001) { request ->
            handleApiCommand(request)
        }
        apiServer.start()
        Log.i(TAG, "API Server started")
    }

    private fun handleApiCommand(request: DisplayRequest): DisplayResponse {
        return try {
            val mode = when (request.mode.lowercase()) {
                "welcome" -> DisplayMode.WELCOME
                "waiting", "wait" -> DisplayMode.WAITING_PAYMENT
                "success" -> DisplayMode.PAYMENT_SUCCESS
                "failed", "fail" -> DisplayMode.PAYMENT_FAILED
                "qr", "qrcode", "qr_code" -> DisplayMode.QR_CODE
                "thanks", "thankyou", "thank_you" -> DisplayMode.THANK_YOU
                else -> DisplayMode.WELCOME
            }
            
            displayManager.setMode(
                mode = mode,
                amount = request.amount ?: 0.0,
                qrCodeUrl = request.qrCode
            )
            
            DisplayResponse(
                success = true,
                message = "Mode changed to $mode",
                currentMode = mode.name
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error handling command", e)
            DisplayResponse(
                success = false,
                message = e.message ?: "Unknown error",
                currentMode = displayManager.getCurrentContent().mode.name
            )
        }
    }

    private fun setupButtons() {
        findViewById<Button>(R.id.btnWelcome).setOnClickListener {
            displayManager.showWelcome()
            showToast("已切换到欢迎语")
        }
        
        findViewById<Button>(R.id.btnWaiting).setOnClickListener {
            val amount = editAmount.text.toString().toDoubleOrNull() ?: 0.0
            displayManager.showWaitingPayment(amount)
            showToast("已切换到等待付款")
        }
        
        findViewById<Button>(R.id.btnSuccess).setOnClickListener {
            val amount = editAmount.text.toString().toDoubleOrNull() ?: 0.0
            displayManager.showPaymentSuccess(amount)
            showToast("已切换到付款成功")
        }
        
        findViewById<Button>(R.id.btnFailed).setOnClickListener {
            displayManager.showPaymentFailed()
            showToast("已切换到付款失败")
        }
        
        findViewById<Button>(R.id.btnQRCode).setOnClickListener {
            // 使用默认二维码或占位图
            displayManager.showQRCode("")
            showToast("已切换到二维码")
        }
        
        findViewById<Button>(R.id.btnThankYou).setOnClickListener {
            displayManager.showThankYou()
            showToast("已切换到谢谢惠顾")
        }
        
        findViewById<Button>(R.id.btnCustom).setOnClickListener {
            val amount = editAmount.text.toString().toDoubleOrNull() ?: 0.0
            displayManager.showWaitingPayment(amount)
            showToast("已显示金额 ¥$amount")
        }
        
        findViewById<Button>(R.id.btnShowAmount).setOnClickListener {
            val amount = editAmount.text.toString().toDoubleOrNull() ?: 0.0
            displayManager.showWaitingPayment(amount)
            showToast("已显示金额 ¥$amount")
        }
    }

    private fun checkDisplayStatus() {
        lifecycleScope.launch {
            while (true) {
                withContext(Dispatchers.Main) {
                    val connected = displayManager.checkForSecondaryDisplay()
                    displayStatus.text = if (connected) {
                        "副屏状态: 已连接"
                    } else {
                        "副屏状态: 未连接"
                    }
                }
                kotlinx.coroutines.delay(2000)
            }
        }
    }

    private fun showToast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }

    override fun onResume() {
        super.onResume()
        displayManager.checkForSecondaryDisplay()
    }

    override fun onDestroy() {
        super.onDestroy()
        displayManager.release()
        apiServer.stopServer()
    }

    companion object {
        private const val TAG = "CustomerDisplay"
    }
}
