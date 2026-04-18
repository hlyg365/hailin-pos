package com.hailin.customerdisplay

import android.util.Log
import com.google.gson.Gson
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStream
import java.net.ServerSocket
import java.net.Socket
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

/**
 * HTTP API 服务器
 * 用于接收来自收银台的控制命令
 */
class ApiServer(
    private val port: Int = 5001,
    private val onCommand: (DisplayRequest) -> DisplayResponse
) : Thread() {

    private val gson = Gson()
    private var serverSocket: ServerSocket? = null
    private var isRunning = false

    override fun run() {
        try {
            serverSocket = ServerSocket(port)
            isRunning = true
            Log.i(TAG, "API Server started on port $port")

            while (isRunning) {
                try {
                    val client = serverSocket?.accept() ?: break
                    handleClient(client)
                } catch (e: Exception) {
                    if (isRunning) {
                        Log.e(TAG, "Error handling client", e)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Server error", e)
        }
    }

    private fun handleClient(client: Socket) {
        try {
            val reader = BufferedReader(InputStreamReader(client.getInputStream(), StandardCharsets.UTF_8))
            val output = client.getOutputStream()
            
            val requestLine = reader.readLine() ?: return
            val method = requestLine.split(" ")[0]
            val path = requestLine.split(" ")[1].split("?")[0]
            
            // 读取请求头
            var contentLength = 0
            var line: String?
            while (reader.readLine().also { line = it } != "") {
                if (line?.lowercase()?.startsWith("content-length:") == true) {
                    contentLength = line?.substringAfter(":")?.trim()?.toIntOrNull() ?: 0
                }
            }
            
            // 读取请求体
            val body = if (contentLength > 0) {
                val bodyChars = CharArray(contentLength)
                reader.read(bodyChars)
                String(bodyChars)
            } else {
                ""
            }
            
            // 处理请求
            val response = when {
                path == "/api/display" && method == "POST" -> {
                    handleDisplayCommand(body)
                }
                path == "/api/status" && method == "GET" -> {
                    handleStatusCommand()
                }
                path == "/health" && method == "GET" -> {
                    createJsonResponse(true, "OK", "healthy")
                }
                else -> {
                    createJsonResponse(false, "Not Found", "unknown")
                }
            }
            
            // 发送响应
            val responseBytes = response.toByteArray(StandardCharsets.UTF_8)
            output.write("HTTP/1.1 200 OK\r\n".toByteArray())
            output.write("Content-Type: application/json; charset=utf-8\r\n".toByteArray())
            output.write("Content-Length: ${responseBytes.size}\r\n".toByteArray())
            output.write("Access-Control-Allow-Origin: *\r\n".toByteArray())
            output.write("\r\n".toByteArray())
            output.write(responseBytes)
            output.flush()
            
        } catch (e: Exception) {
            Log.e(TAG, "Error handling client", e)
        } finally {
            try {
                client.close()
            } catch (e: Exception) {
                // Ignore
            }
        }
    }

    private fun handleDisplayCommand(body: String): String {
        return try {
            val request = gson.fromJson(body, DisplayRequest::class.java)
            val response = onCommand(request)
            gson.toJson(response)
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing command", e)
            createJsonResponse(false, "Invalid request", "error")
        }
    }

    private fun handleStatusCommand(): String {
        return createJsonResponse(true, "OK", "running")
    }

    private fun createJsonResponse(success: Boolean, message: String, status: String): String {
        return gson.toJson(mapOf(
            "success" to success,
            "message" to message,
            "status" to status
        ))
    }

    fun stopServer() {
        isRunning = false
        try {
            serverSocket?.close()
        } catch (e: Exception) {
            // Ignore
        }
    }

    fun isServerRunning(): Boolean = isRunning

    companion object {
        private const val TAG = "ApiServer"
    }
}
