package com.hailin.deviceplugin;

import android.app.Presentation;
import android.content.Context;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketAddress;
import java.util.HashMap;
import java.util.Map;

/**
 * 海邻到家设备通讯插件
 * 支持：USB串口、网络TCP/IP通讯
 */
public class DevicePlugin extends Plugin {
    
    private static final String TAG = "DevicePlugin";
    
    // 网络连接池
    private final Map<String, Socket> socketPool = new HashMap<>();
    private final Map<String, Thread> readerThreads = new HashMap<>();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    
    // USB Serial
    private UsbManager usbManager;
    private UsbDevice currentDevice;
    private UsbDeviceConnection usbConnection;
    
    @Override
    public void load() {
        super.load();
        usbManager = (UsbManager) getContext().getSystemService(Context.USB_SERVICE);
        Log.i(TAG, "DevicePlugin loaded");
    }
    
    /**
     * 连接到网络设备 (TCP)
     */
    @PluginMethod
    public void connectTcp(PluginCall call) {
        String id = call.getString("id", "tcp_" + System.currentTimeMillis());
        String host = call.getString("host");
        int port = call.getInt("port", 9100);
        int timeout = call.getInt("timeout", 5000);
        
        if (host == null || host.isEmpty()) {
            call.reject("Host is required");
            return;
        }
        
        new Thread(() -> {
            try {
                Socket socket = new Socket();
                SocketAddress address = new InetSocketAddress(host, port);
                socket.connect(address, timeout);
                
                synchronized (socketPool) {
                    socketPool.put(id, socket);
                }
                
                // 启动读取线程
                startReader(id, socket);
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("id", id);
                result.put("message", "Connected to " + host + ":" + port);
                call.resolve(result);
                
                Log.i(TAG, "TCP connected: " + id + " -> " + host + ":" + port);
                
            } catch (Exception e) {
                Log.e(TAG, "TCP connection failed", e);
                call.reject("Connection failed: " + e.getMessage());
            }
        }).start();
    }
    
    /**
     * 断开连接
     */
    @PluginMethod
    public void disconnect(PluginCall call) {
        String id = call.getString("id");
        
        if (id == null) {
            call.reject("ID is required");
            return;
        }
        
        synchronized (socketPool) {
            Socket socket = socketPool.remove(id);
            if (socket != null) {
                try {
                    socket.close();
                } catch (IOException e) {
                    Log.e(TAG, "Error closing socket", e);
                }
            }
        }
        
        // 停止读取线程
        Thread reader = readerThreads.remove(id);
        if (reader != null) {
            reader.interrupt();
        }
        
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("id", id);
        call.resolve(result);
        
        Log.i(TAG, "Disconnected: " + id);
    }
    
    /**
     * 发送数据
     */
    @PluginMethod
    public void send(PluginCall call) {
        String id = call.getString("id");
        String data = call.getString("data");
        String encoding = call.getString("encoding", "UTF-8");
        
        if (id == null || data == null) {
            call.reject("ID and data are required");
            return;
        }
        
        new Thread(() -> {
            try {
                Socket socket;
                synchronized (socketPool) {
                    socket = socketPool.get(id);
                }
                
                if (socket == null || !socket.isConnected()) {
                    call.reject("Not connected");
                    return;
                }
                
                OutputStream out = socket.getOutputStream();
                
                // 根据编码转换数据
                if ("hex".equals(encoding)) {
                    // 十六进制字符串，如 "1B40" -> bytes
                    byte[] bytes = hexStringToBytes(data);
                    out.write(bytes);
                } else {
                    out.write(data.getBytes(encoding));
                }
                out.flush();
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("sent", data.length());
                call.resolve(result);
                
                Log.d(TAG, "Data sent to " + id + ": " + data.length() + " bytes");
                
            } catch (Exception e) {
                Log.e(TAG, "Send failed", e);
                call.reject("Send failed: " + e.getMessage());
            }
        }).start();
    }
    
    /**
     * 连接USB设备
     */
    @PluginMethod
    public void connectUsb(PluginCall call) {
        // USB功能暂不实现，需要USB权限和设备列表
        // 后续版本支持
        
        String vendorId = call.getString("vendorId");
        int baudRate = call.getInt("baudRate", 9600);
        
        JSObject result = new JSObject();
        result.put("success", false);
        result.put("message", "USB connection requires device permissions. Use network connection for now.");
        call.resolve(result);
    }
    
    /**
     * 获取设备列表
     */
    @PluginMethod
    public void listDevices(PluginCall call) {
        JSObject result = new JSObject();
        
        // 返回当前已连接的设备
        synchronized (socketPool) {
            JSObject devices = new JSObject();
            for (String id : socketPool.keySet()) {
                Socket socket = socketPool.get(id);
                JSObject device = new JSObject();
                device.put("id", id);
                device.put("connected", socket != null && socket.isConnected());
                devices.put(id, device);
            }
            result.put("devices", devices);
        }
        
        call.resolve(result);
    }
    
    /**
     * 检查连接状态
     */
    @PluginMethod
    public void isConnected(PluginCall call) {
        String id = call.getString("id");
        
        boolean connected = false;
        synchronized (socketPool) {
            Socket socket = socketPool.get(id);
            connected = socket != null && socket.isConnected() && !socket.isClosed();
        }
        
        JSObject result = new JSObject();
        result.put("connected", connected);
        call.resolve(result);
    }
    
    /**
     * 启动数据读取线程
     */
    private void startReader(String id, Socket socket) {
        Thread reader = new Thread(() -> {
            byte[] buffer = new byte[1024];
            try {
                InputStream in = socket.getInputStream();
                while (!Thread.currentThread().isInterrupted() && socket.isConnected()) {
                    try {
                        int bytesRead = in.read(buffer);
                        if (bytesRead > 0) {
                            String data = new String(buffer, 0, bytesRead);
                            String hexData = bytesToHexString(buffer, bytesRead);
                            
                            // 发送数据事件到前端
                            JSObject event = new JSObject();
                            event.put("id", id);
                            event.put("data", data);
                            event.put("hexData", hexData);
                            event.put("timestamp", System.currentTimeMillis());
                            
                            mainHandler.post(() -> {
                                notifyListeners("deviceData", event);
                            });
                            
                            Log.d(TAG, "Data received from " + id + ": " + bytesRead + " bytes");
                        }
                    } catch (IOException e) {
                        if (!Thread.currentThread().isInterrupted()) {
                            Log.e(TAG, "Read error", e);
                        }
                        break;
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Reader thread error", e);
            }
            
            // 连接断开
            synchronized (socketPool) {
                socketPool.remove(id);
            }
            
            JSObject event = new JSObject();
            event.put("id", id);
            event.put("disconnected", true);
            mainHandler.post(() -> {
                notifyListeners("deviceDisconnected", event);
            });
        });
        
        readerThreads.put(id, reader);
        reader.start();
    }
    
    /**
     * 工具方法：字节数组转十六进制字符串
     */
    private String bytesToHexString(byte[] bytes, int length) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(String.format("%02X ", bytes[i]));
        }
        return sb.toString().trim();
    }
    
    /**
     * 工具方法：十六进制字符串转字节数组
     */
    private byte[] hexStringToBytes(String hex) {
        hex = hex.replaceAll("\\s", "");
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                                 + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
    }
    
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        // 清理所有连接
        synchronized (socketPool) {
            for (Socket socket : socketPool.values()) {
                try {
                    socket.close();
                } catch (IOException e) {
                    // Ignore
                }
            }
            socketPool.clear();
        }
        
        for (Thread thread : readerThreads.values()) {
            thread.interrupt();
        }
        readerThreads.clear();
        
        Log.i(TAG, "DevicePlugin destroyed");
    }
}
