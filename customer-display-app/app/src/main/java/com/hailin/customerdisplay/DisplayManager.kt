package com.hailin.customerdisplay

import android.app.Activity
import android.app Presentation
import android.content.Context
import android.hardware.display.DisplayManager
import android.os.Handler
import android.os.Looper
import android.view.Display
import android.view.WindowManager

/**
 * 显示管理器
 * 负责管理客显屏的连接和内容显示
 */
class DisplayManager(private val context: Context) {

    private var presentation: CustomerPresentation? = null
    private var currentContent: DisplayContent = DisplayContent()
    private var isConnected: Boolean = false
    
    private val displayManager: DisplayManager by lazy {
        context.getSystemService(Context.DISPLAY_SERVICE) as DisplayManager
    }
    
    private val handler = Handler(Looper.getMainLooper())

    /**
     * 显示监听器
     */
    private val displayListener = object : DisplayManager.DisplayListener {
        override fun onDisplayAdded(displayId: Int) {
            handler.post {
                checkForSecondaryDisplay()
            }
        }

        override fun onDisplayRemoved(displayId: Int) {
            handler.post {
                if (displayId != Display.DEFAULT_DISPLAY) {
                    dismissPresentation()
                }
            }
        }

        override fun onDisplayChanged(displayId: Int) {
            handler.post {
                if (displayId != Display.DEFAULT_DISPLAY) {
                    checkForSecondaryDisplay()
                }
            }
        }
    }

    init {
        displayManager.registerDisplayListener(displayListener, handler)
    }

    /**
     * 检查并连接副屏
     */
    fun checkForSecondaryDisplay(): Boolean {
        val displays = displayManager.displays
        
        for (display in displays) {
            if (display.displayId != Display.DEFAULT_DISPLAY) {
                return showOnPresentation(display)
            }
        }
        
        return false
    }

    /**
     * 在指定屏幕上显示 Presentation
     */
    private fun showOnPresentation(display: Display): Boolean {
        try {
            // 检查屏幕属性
            if (display.width <= 0 || display.height <= 0) {
                return false
            }

            dismissPresentation()
            
            presentation = CustomerPresentation(context, display)
            presentation?.show()
            
            isConnected = true
            currentContent.let { presentation?.updateDisplay(it) }
            
            return true
        } catch (e: Exception) {
            e.printStackTrace()
            isConnected = false
            return false
        }
    }

    /**
     * 更新显示内容
     */
    fun updateContent(content: DisplayContent) {
        currentContent = content
        presentation?.updateContent(content)
    }

    /**
     * 设置显示模式
     */
    fun setMode(mode: DisplayMode, amount: Double = 0.0, qrCodeUrl: String? = null) {
        val content = DisplayContent(
            mode = mode,
            amount = amount,
            qrCodeUrl = qrCodeUrl
        )
        updateContent(content)
    }

    /**
     * 显示欢迎语
     */
    fun showWelcome() {
        setMode(DisplayMode.WELCOME)
    }

    /**
     * 显示等待付款
     */
    fun showWaitingPayment(amount: Double) {
        setMode(DisplayMode.WAITING_PAYMENT, amount)
    }

    /**
     * 显示付款成功
     */
    fun showPaymentSuccess(amount: Double) {
        setMode(DisplayMode.PAYMENT_SUCCESS, amount)
    }

    /**
     * 显示付款失败
     */
    fun showPaymentFailed() {
        setMode(DisplayMode.PAYMENT_FAILED)
    }

    /**
     * 显示二维码
     */
    fun showQRCode(qrCodeUrl: String) {
        setMode(DisplayMode.QR_CODE, qrCodeUrl = qrCodeUrl)
    }

    /**
     * 显示谢谢惠顾
     */
    fun showThankYou() {
        setMode(DisplayMode.THANK_YOU)
    }

    /**
     * 获取连接状态
     */
    fun isConnected(): Boolean = isConnected && presentation?.isShowing == true

    /**
     * 获取当前显示内容
     */
    fun getCurrentContent(): DisplayContent = currentContent

    /**
     * 关闭 Presentation
     */
    fun dismissPresentation() {
        presentation?.let {
            if (it.isShowing) {
                it.dismiss()
            }
        }
        presentation = null
        isConnected = false
    }

    /**
     * 释放资源
     */
    fun release() {
        dismissPresentation()
        displayManager.unregisterDisplayListener(displayListener)
    }

    companion object {
        /**
         * 检查设备是否支持双屏
         */
        fun hasSecondaryDisplay(context: Context): Boolean {
            val dm = context.getSystemService(Context.DISPLAY_SERVICE) as DisplayManager
            return dm.displays.size > 1
        }
    }
}
