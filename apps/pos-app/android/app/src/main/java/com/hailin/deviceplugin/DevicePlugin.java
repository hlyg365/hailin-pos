package com.hailin.deviceplugin;

import android.content.Context;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Display;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 海邻到家一体机硬件抽象层 V6.0
 * 
 * 支持两种电子秤连接方式：
 * 1. 网络秤（TCP）- 适用于网络秤设备
 * 2. USB HID模式 - 适用于外接USB电子秤
 * 
 * 串口通信需要使用 Android USB Host API 或第三方库
 */
public class DevicePlugin extends Plugin {

    private static final String TAG = "DevicePlugin";
    
    // ==================== 连接池管理 ====================
    private final Map<String, Socket> socketPool = new ConcurrentHashMap<>();
    private final Map<String, ScaleDataCallback> scaleCallbacks = new ConcurrentHashMap<>();
    private final ExecutorService executor = Executors.newFixedThreadPool(8);
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    
    // USB Serial
    private UsbManager usbManager;
    private Context appContext;
    
    // ==================== 插件初始化 ====================
    @Override
    public void load() {
        super.load();
        appContext = getContext();
        usbManager = (UsbManager) appContext.getSystemService(Context.USB_SERVICE);
        Log.i(TAG, "DevicePlugin 硬件抽象层已加载");
    }

    // ==================== 1. 电子秤驱动模块 ====================
    
    /**
     * 连接电子秤（网络/TCP）
     */
    @PluginMethod
    public void scaleConnect(PluginCall call) {
        String host = call.getString("host", "192.168.1.100");
        int port = call.getInt("port", 8000);
        String protocol = call.getString("protocol", "general");
        int timeout = call.getInt("timeout", 5000);
        
        Log.i(TAG, String.format("连接网络秤: host=%s, port=%d, protocol=%s",
                host, port, protocol));
        
        executor.execute(() -> {
            try {
                Socket socket = new Socket();
                socket.connect(new InetSocketAddress(host, port), timeout);
                socket.setSoTimeout(0); // 非阻塞
                
                socketPool.put("scale", socket);
                
                // 保存回调
                ScaleDataCallback callback = new ScaleDataCallback();
                callback.protocol = protocol;
                scaleCallbacks.put("scale", callback);
                
                // 启动数据读取线程
                startScaleReader(socket, protocol);
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("host", host);
                result.put("port", port);
                result.put("message", "电子秤网络连接成功");
                call.resolve(result);
                
                Log.i(TAG, "电子秤网络连接成功");
                
            } catch (Exception e) {
                Log.e(TAG, "电子秤连接失败", e);
                call.reject("电子秤连接失败: " + e.getMessage());
            }
        });
    }
    
    /**
     * 启动秤数据读取线程
     */
    private void startScaleReader(Socket socket, String protocol) {
        executor.execute(() -> {
            try {
                InputStream in = socket.getInputStream();
                byte[] buffer = new byte[64];
                
                while (socket.isConnected() && !socket.isClosed()) {
                    int bytesRead = in.read(buffer);
                    if (bytesRead > 0) {
                        byte[] data = new byte[bytesRead];
                        System.arraycopy(buffer, 0, data, 0, bytesRead);
                        handleScaleData(data, protocol);
                    }
                    Thread.sleep(50); // 避免CPU占用过高
                }
            } catch (Exception e) {
                Log.e(TAG, "秤读取线程异常", e);
            }
        });
    }
    
    /**
     * 处理接收到的秤数据
     */
    private void handleScaleData(byte[] data, String protocol) {
        ScaleDataCallback callback = scaleCallbacks.get("scale");
        if (callback == null) return;
        
        ScaleWeight weight = parseScaleData(data, protocol);
        if (weight != null) {
            callback.lastWeight = weight;
            
            mainHandler.post(() -> {
                JSObject event = new JSObject();
                event.put("weight", weight.weight);
                event.put("unit", weight.unit);
                event.put("stable", weight.stable);
                event.put("timestamp", weight.timestamp);
                event.put("raw", bytesToHex(data));
                notifyListeners("scaleData", event);
            });
        }
    }
    
    /**
     * 通用协议解析
     */
    private ScaleWeight parseGeneralProtocol(byte[] data, ScaleWeight weight) {
        if (data.length < 8) return null;
        
        if (data[0] == 0x02) {
            weight.stable = (data[1] == 0x47 || data[1] == 'G' || data[1] == 'S');
            
            StringBuilder weightStr = new StringBuilder();
            boolean negative = false;
            
            for (int i = 1; i < data.length - 2; i++) {
                byte b = data[i];
                if (b == '-' || b == 0x2D) {
                    negative = true;
                } else if ((b >= '0' && b <= '9') || b == '.' || b == '+') {
                    weightStr.append((char) b);
                }
            }
            
            try {
                double rawWeight = Double.parseDouble(weightStr.toString().replace("+", "").trim());
                weight.weight = negative ? -rawWeight : rawWeight;
            } catch (NumberFormatException e) {
                return null;
            }
            
            weight.unit = "kg";
        }
        
        return weight;
    }
    
    /**
     * 顶尖 OS2 协议解析
     */
    private ScaleWeight parseTopSokiOS2Protocol(byte[] data, ScaleWeight weight) {
        if (data == null || data.length < 9) return null;
        
        try {
            Log.d(TAG, "顶尖OS2协议数据: " + bytesToHex(data));
            
            // 检测帧头 0x01
            if (data[0] == 0x01) {
                // 状态位 (第2字节)
                // 0x15=不稳定, 0x17=稳定, 0x1F=零位
                byte status = data[1];
                weight.stable = (status == 0x17 || status == 0x1F);
                
                // 单位 (第3字节)
                // 'K'=kg, 'g'=g
                weight.unit = (data[2] == 'K' || data[2] == 'k') ? "kg" : "g";
                
                // 重量数值 (第4-8字节): BCD编码
                // 示例: 01 17 4B 12 34 56 78 00
                int value = ((data[4] & 0xFF) * 10000) +
                           ((data[5] & 0xFF) * 100) +
                           (data[6] & 0xFF);
                
                // 根据单位转换
                if (data[2] == 'K' || data[2] == 'k') {
                    weight.weight = value / 1000.0; // 转换为kg
                } else {
                    weight.weight = value; // 直接是g
                }
                
                // 检测负数
                if ((data[7] & 0x40) != 0) {
                    weight.weight = -weight.weight;
                }
                
                Log.d(TAG, String.format("顶尖OS2协议解析结果: weight=%.3f%s, stable=%s",
                        weight.weight, weight.unit, weight.stable));
            } else {
                return null;
            }
            
            return weight;
        } catch (Exception e) {
            Log.e(TAG, "顶尖OS2协议解析异常", e);
            return null;
        }
    }
    
    /**
     * 顶尖 ACLaS 协议解析
     */
    private ScaleWeight parseTopSokiACLaSProtocol(byte[] data, ScaleWeight weight) {
        if (data == null || data.length < 12) return null;
        
        try {
            Log.d(TAG, "顶尖ACLaS协议数据: " + bytesToHex(data));
            
            if (data[0] == 0x02 && data[data.length - 1] == 0x03) {
                weight.stable = (data[1] == 0x30);
                
                StringBuilder weightStr = new StringBuilder();
                for (int i = 2; i < Math.min(data.length - 1, 10); i++) {
                    if (data[i] >= 0x30 && data[i] <= 0x39) {
                        weightStr.append((char) data[i]);
                    }
                }
                
                try {
                    double rawWeight = Double.parseDouble(weightStr.toString()) / 1000.0;
                    weight.weight = rawWeight;
                    weight.unit = "kg";
                } catch (NumberFormatException e) {
                    return null;
                }
            } else {
                return parseGeneralProtocol(data, weight);
            }
            
            return weight;
        } catch (Exception e) {
            Log.e(TAG, "顶尖ACLaS协议解析异常", e);
            return null;
        }
    }
    
    /**
     * 大华协议解析
     */
    private ScaleWeight parseDahuaProtocol(byte[] data, ScaleWeight weight) {
        if (data == null || data.length < 10) return null;
        
        try {
            // 大华秤协议: STX + 状态 + 重量 + 单位 + ETX + BCC
            if (data[0] == 0x02 && data[data.length - 2] == 0x03) {
                weight.stable = (data[1] == 'S');
                
                StringBuilder weightStr = new StringBuilder();
                for (int i = 2; i < data.length - 3; i++) {
                    if ((data[i] >= '0' && data[i] <= '9') || data[i] == '.' || data[i] == '-') {
                        weightStr.append((char) data[i]);
                    }
                }
                
                try {
                    weight.weight = Double.parseDouble(weightStr.toString());
                } catch (NumberFormatException e) {
                    return null;
                }
                
                // 单位
                weight.unit = (data[data.length - 3] == 'k') ? "kg" : "g";
            }
            
            return weight;
        } catch (Exception e) {
            Log.e(TAG, "大华协议解析异常", e);
            return null;
        }
    }
    
    /**
     * 托利多协议解析
     */
    private ScaleWeight parseToiedaProtocol(byte[] data, ScaleWeight weight) {
        if (data == null || data.length < 10) return null;
        
        try {
            // 托利多协议: 稳定状态 + 重量 + 单位
            String text = new String(data, "ASCII").trim();
            
            if (text.contains("ST") || text.contains("US")) {
                weight.stable = text.contains("ST");
                
                // 提取数字
                StringBuilder weightStr = new StringBuilder();
                for (char c : text.toCharArray()) {
                    if (Character.isDigit(c) || c == '.' || c == '-') {
                        weightStr.append(c);
                    }
                }
                
                try {
                    weight.weight = Double.parseDouble(weightStr.toString());
                } catch (NumberFormatException e) {
                    return null;
                }
                
                weight.unit = text.contains("kg") ? "kg" : "g";
            }
            
            return weight;
        } catch (Exception e) {
            Log.e(TAG, "托利多协议解析异常", e);
            return null;
        }
    }
    
    /**
     * 路由到对应协议解析器
     */
    private ScaleWeight parseScaleData(byte[] data, String protocol) {
        try {
            Log.d(TAG, "秤原始数据: " + bytesToHex(data));
            
            ScaleWeight weight = new ScaleWeight();
            weight.timestamp = System.currentTimeMillis();
            
            switch (protocol) {
                case "soki":
                    ScaleWeight result = parseTopSokiOS2Protocol(data, weight);
                    if (result == null) {
                        result = parseTopSokiACLaSProtocol(data, weight);
                    }
                    return result;
                    
                case "aclas":
                    return parseTopSokiACLaSProtocol(data, weight);
                    
                case "dahua":
                    return parseDahuaProtocol(data, weight);
                    
                case "toieda":
                case "toledo":
                    return parseToiedaProtocol(data, weight);
                    
                default:
                    return autoDetectAndParse(data, weight);
            }
        } catch (Exception e) {
            Log.e(TAG, "秤数据解析失败", e);
            return null;
        }
    }
    
    /**
     * 自动检测协议并解析
     */
    private ScaleWeight autoDetectAndParse(byte[] data, ScaleWeight weight) {
        if (data == null || data.length < 5) return null;
        
        if (data[0] == 0x01) {
            Log.d(TAG, "检测到: 顶尖OS2协议");
            return parseTopSokiOS2Protocol(data, weight);
        }
        
        if (data[0] == 0x02) {
            Log.d(TAG, "检测到: 通用协议");
            return parseGeneralProtocol(data, weight);
        }
        
        String text;
        try {
            text = new String(data, "ASCII").trim();
        } catch (java.io.UnsupportedEncodingException e) {
            text = new String(data).trim();
        }
        if (text.contains("kg") || text.contains("g") || text.contains("ST")) {
            Log.d(TAG, "检测到: 文本协议");
            return parseGeneralProtocol(data, weight);
        }
        
        Log.w(TAG, "无法识别协议格式");
        return null;
    }
    
    /**
     * 获取当前重量
     */
    @PluginMethod
    public void scaleGetWeight(PluginCall call) {
        ScaleDataCallback callback = scaleCallbacks.get("scale");
        
        JSObject result = new JSObject();
        if (callback != null && callback.lastWeight != null) {
            result.put("success", true);
            result.put("weight", callback.lastWeight.weight);
            result.put("unit", callback.lastWeight.unit);
            result.put("stable", callback.lastWeight.stable);
            result.put("timestamp", callback.lastWeight.timestamp);
        } else {
            result.put("success", false);
            result.put("error", "秤未连接");
        }
        
        call.resolve(result);
    }
    
    /**
     * 获取秤连接状态
     */
    @PluginMethod
    public void scaleGetStatus(PluginCall call) {
        Socket socket = socketPool.get("scale");
        
        JSObject result = new JSObject();
        result.put("connected", socket != null && socket.isConnected());
        result.put("type", "network");
        
        call.resolve(result);
    }
    
    /**
     * 断开电子秤
     */
    @PluginMethod
    public void scaleDisconnect(PluginCall call) {
        Socket socket = socketPool.remove("scale");
        if (socket != null) {
            try {
                socket.close();
            } catch (IOException e) {
                Log.e(TAG, "关闭秤连接失败", e);
            }
        }
        
        scaleCallbacks.remove("scale");
        
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }
    
    /**
     * 断开所有设备
     */
    @PluginMethod
    public void disconnectAll(PluginCall call) {
        for (Socket socket : socketPool.values()) {
            try { socket.close(); } catch (IOException e) {}
        }
        socketPool.clear();
        scaleCallbacks.clear();
        
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "所有设备已断开");
        call.resolve(result);
    }

    // ==================== 辅助类 ====================
    
    static class ScaleWeight {
        double weight;
        String unit;
        boolean stable;
        long timestamp;
    }
    
    static class ScaleDataCallback {
        String protocol;
        ScaleWeight lastWeight;
    }
    
    // ==================== 工具方法 ====================
    
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X ", b));
        }
        return sb.toString().trim();
    }
}
