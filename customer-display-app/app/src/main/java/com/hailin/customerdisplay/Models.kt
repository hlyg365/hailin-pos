package com.hailin.customerdisplay

/**
 * 显示模式枚举
 */
enum class DisplayMode {
    WELCOME,           // 欢迎语
    WAITING_PAYMENT,   // 等待付款
    PAYMENT_SUCCESS,   // 付款成功
    PAYMENT_FAILED,    // 付款失败
    QR_CODE,           // 二维码
    THANK_YOU          // 谢谢惠顾
}

/**
 * 显示内容数据类
 */
data class DisplayContent(
    val mode: DisplayMode = DisplayMode.WELCOME,
    val amount: Double = 0.0,
    val qrCodeUrl: String? = null,
    val customMessage: String? = null
)

/**
 * API 请求/响应数据类
 */
data class DisplayRequest(
    val mode: String,
    val amount: Double? = null,
    val qrCode: String? = null,
    val message: String? = null
)

data class DisplayResponse(
    val success: Boolean,
    val message: String,
    val currentMode: String
)
