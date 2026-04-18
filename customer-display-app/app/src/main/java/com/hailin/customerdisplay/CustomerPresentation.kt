package com.hailin.customerdisplay

import android.app.Presentation
import android.content.Context
import android.content.res.Resources
import android.graphics.Bitmap
import android.os.Bundle
import android.view.Display
import android.view.View
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import com.google.gson.Gson
import java.io.InputStream
import java.net.URL

/**
 * 客显屏 Presentation 类
 * 用于在第二屏幕上显示内容
 */
class CustomerPresentation(
    context: Context,
    display: Display
) : Presentation(context, display) {

    private var content: DisplayContent = DisplayContent()
    private val gson = Gson()

    // 视图引用
    private lateinit var layoutWelcome: LinearLayout
    private lateinit var layoutWaiting: LinearLayout
    private lateinit var layoutSuccess: LinearLayout
    private lateinit var layoutFailed: LinearLayout
    private lateinit var layoutQRCode: LinearLayout
    private lateinit var layoutThankYou: LinearLayout

    private lateinit var textAmount: TextView
    private lateinit var textPaidAmount: TextView
    private lateinit var imageQRCode: ImageView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.presentation_content)
        initViews()
        updateDisplay(content)
    }

    private fun initViews() {
        layoutWelcome = findViewById(R.id.layoutWelcome)
        layoutWaiting = findViewById(R.id.layoutWaiting)
        layoutSuccess = findViewById(R.id.layoutSuccess)
        layoutFailed = findViewById(R.id.layoutFailed)
        layoutQRCode = findViewById(R.id.layoutQRCode)
        layoutThankYou = findViewById(R.id.layoutThankYou)

        textAmount = findViewById(R.id.textAmount)
        textPaidAmount = findViewById(R.id.textPaidAmount)
        imageQRCode = findViewById(R.id.imageQRCode)
    }

    /**
     * 更新显示内容
     */
    fun updateDisplay(newContent: DisplayContent) {
        content = newContent
        runOnUiThread {
            hideAllLayouts()
            when (content.mode) {
                DisplayMode.WELCOME -> showWelcome()
                DisplayMode.WAITING_PAYMENT -> showWaitingPayment()
                DisplayMode.PAYMENT_SUCCESS -> showPaymentSuccess()
                DisplayMode.PAYMENT_FAILED -> showPaymentFailed()
                DisplayMode.QR_CODE -> showQRCode()
                DisplayMode.THANK_YOU -> showThankYou()
            }
        }
    }

    private fun hideAllLayouts() {
        layoutWelcome.visibility = View.GONE
        layoutWaiting.visibility = View.GONE
        layoutSuccess.visibility = View.GONE
        layoutFailed.visibility = View.GONE
        layoutQRCode.visibility = View.GONE
        layoutThankYou.visibility = View.GONE
    }

    private fun showWelcome() {
        layoutWelcome.visibility = View.VISIBLE
    }

    private fun showWaitingPayment() {
        layoutWaiting.visibility = View.VISIBLE
        textAmount.text = "¥${String.format("%.2f", content.amount)}"
    }

    private fun showPaymentSuccess() {
        layoutSuccess.visibility = View.VISIBLE
        textPaidAmount.text = "¥${String.format("%.2f", content.amount)}"
    }

    private fun showPaymentFailed() {
        layoutFailed.visibility = View.VISIBLE
    }

    private fun showQRCode() {
        layoutQRCode.visibility = View.VISIBLE
        content.qrCodeUrl?.let { url ->
            loadQRCodeImage(url)
        }
    }

    private fun showThankYou() {
        layoutThankYou.visibility = View.VISIBLE
    }

    private fun loadQRCodeImage(url: String) {
        Thread {
            try {
                val bitmap = if (url.startsWith("http")) {
                    val connection = URL(url).openConnection()
                    connection.doInput = true
                    connection.connect()
                    val input: InputStream = connection.getInputStream()
                    BitmapFactory.decodeStream(input)
                } else {
                    // 从资源加载
                    val resourceId = url.toIntOrNull() ?: return@Thread
                    BitmapFactory.decodeResource(context?.resources, resourceId)
                }
                imageQRCode.post {
                    imageQRCode.setImageBitmap(bitmap)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }.start()
    }

    /**
     * 获取当前显示内容
     */
    fun getCurrentContent(): DisplayContent = content

    /**
     * 获取当前模式的JSON字符串
     */
    fun getContentJson(): String = gson.toJson(content)
}
