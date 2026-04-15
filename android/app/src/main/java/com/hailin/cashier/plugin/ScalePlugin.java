package com.hailin.cashier.plugin;

import android.content.Context;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

public class ScalePlugin extends Plugin {
    private static final String TAG = "ScalePlugin";
    
    // 顶尖OS2协议控制字符
    private static final byte STX = 0x02;
    private static final byte ETX = 0x03;
    private static final byte CR = 0x0D;
    
    private SerialPortManager serialPortManager;
    private Handler mainHandler;
    private boolean isListening = false;
    
    public ScalePlugin() {
        mainHandler = new Handler(Looper.getMainLooper());
    }
    
    @Override
    public void load() {
        super.load();
        Log.d(TAG, "ScalePlugin loaded");
    }
    
    @PluginMethod
    public void connect(PluginCall call) {
        String port = call.getString("port", "/dev/ttyUSB0");
        int baudRate = call.getInt("baudRate", 9600);
        
        try {
            serialPortManager = new SerialPortManager(port, baudRate);
            serialPortManager.open();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "电子秤连接成功");
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Failed to connect scale", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }
    
    @PluginMethod
    public void disconnect(PluginCall call) {
        try {
            if (serialPortManager != null) {
                serialPortManager.close();
                serialPortManager = null;
            }
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "电子秤已断开");
            call.resolve(result);
        } catch (Exception e) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }
    
    @PluginMethod
    public void startListening(PluginCall call) {
        if (serialPortManager == null) {
            call.reject("电子秤未连接");
            return;
        }
        
        if (isListening) {
            call.resolve();
            return;
        }
        
        isListening = true;
        new Thread(() -> {
            while (isListening) {
                try {
                    byte[] data = serialPortManager.read();
                    if (data != null && data.length > 0) {
                        ScaleData scaleData = parseScaleData(data);
                        notifyListeners("onWeightChange", scaleData.toJSObject());
                    }
                    Thread.sleep(100);
                } catch (Exception e) {
                    Log.e(TAG, "Error reading scale data", e);
                }
            }
        }).start();
        
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }
    
    @PluginMethod
    public void stopListening(PluginCall call) {
        isListening = false;
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }
    
    @PluginMethod
    public void getWeight(PluginCall call) {
        if (serialPortManager == null) {
            call.reject("电子秤未连接");
            return;
        }
        
        try {
            // 发送重量请求（有些秤需要主动请求才发送数据）
            byte[] request = {(byte) 0x05}; // ENQ
            serialPortManager.write(request);
            
            // 等待响应
            Thread.sleep(200);
            byte[] data = serialPortManager.read();
            
            if (data != null && data.length > 0) {
                ScaleData scaleData = parseScaleData(data);
                call.resolve(scaleData.toJSObject());
            } else {
                call.reject("未能读取到数据");
            }
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
    
    @PluginMethod
    public void setZero(PluginCall call) {
        if (serialPortManager == null) {
            call.reject("电子秤未连接");
            return;
        }
        
        try {
            byte[] command = "T\r\n".getBytes(StandardCharsets.US_ASCII);
            serialPortManager.write(command);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
    
    @PluginMethod
    public void setTare(PluginCall call) {
        if (serialPortManager == null) {
            call.reject("电子秤未连接");
            return;
        }
        
        try {
            byte[] command = "PT\r\n".getBytes(StandardCharsets.US_ASCII);
            serialPortManager.write(command);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
    
    @PluginMethod
    public void clearTare(PluginCall call) {
        if (serialPortManager == null) {
            call.reject("电子秤未连接");
            return;
        }
        
        try {
            byte[] command = "CT\r\n".getBytes(StandardCharsets.US_ASCII);
            serialPortManager.write(command);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
    
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        isListening = false;
        if (serialPortManager != null) {
            try {
                serialPortManager.close();
            } catch (IOException e) {
                Log.e(TAG, "Error closing serial port", e);
            }
        }
    }
    
    /**
     * 解析顶尖OS2协议数据
     * 格式: +002.450 kg\r\n
     */
    private ScaleData parseScaleData(byte[] rawData) {
        ScaleData data = new ScaleData();
        
        try {
            String raw = new String(rawData, StandardCharsets.US_ASCII);
            Log.d(TAG, "Raw scale data: " + raw);
            
            // 解析重量值
            StringBuilder weightStr = new StringBuilder();
            boolean hasSign = false;
            
            for (char c : raw.toCharArray()) {
                if (c == '+' || c == '-') {
                    hasSign = true;
                    weightStr.append(c);
                } else if (Character.isDigit(c) || c == '.') {
                    weightStr.append(c);
                } else if (c == ' ' && hasSign) {
                    break; // 遇到空格停止，重量部分结束
                }
            }
            
            if (weightStr.length() > 0) {
                data.weight = Math.abs(Double.parseDouble(weightStr.toString()));
                data.stable = raw.contains("kg") && raw.indexOf(' ') > 0;
            }
            
            // 判断状态
            if (raw.contains("ST")) {
                data.status = "stable";
            } else if (raw.contains("US")) {
                data.status = "unstable";
            } else if (raw.contains("OL")) {
                data.status = "overload";
            } else if (raw.contains("OL-")) {
                data.status = "underload";
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error parsing scale data", e);
            data.error = e.getMessage();
        }
        
        return data;
    }
    
    /**
     * 电子秤数据类
     */
    private static class ScaleData {
        double weight = 0;
        boolean stable = false;
        String status = "unknown";
        String error = null;
        
        JSObject toJSObject() {
            JSObject obj = new JSObject();
            obj.put("weight", weight);
            obj.put("stable", stable);
            obj.put("status", status);
            if (error != null) {
                obj.put("error", error);
            }
            return obj;
        }
    }
    
    /**
     * 串口管理类
     */
    private static class SerialPortManager {
        private final String port;
        private final int baudRate;
        private Object serialPort;
        private Object inputStream;
        private Object outputStream;
        
        public SerialPortManager(String port, int baudRate) {
            this.port = port;
            this.baudRate = baudRate;
        }
        
        public void open() throws IOException {
            try {
                // 使用Android USB Serial库
                Class<?> usbDeviceConnectionClass = Class.forName("com.hoho.android.usbserial.driver.UsbSerialDriver");
                
                // 这里需要实际的串口实现
                // 简化处理，实际使用时需要完整的USB Serial库
                Log.d("ScalePlugin", "Opening serial port: " + port);
                
            } catch (Exception e) {
                throw new IOException("Failed to open serial port: " + e.getMessage(), e);
            }
        }
        
        public void write(byte[] data) throws IOException {
            // 实现串口写入
            Log.d("ScalePlugin", "Writing to serial: " + new String(data));
        }
        
        public byte[] read() throws IOException {
            // 实现串口读取
            return new byte[0];
        }
        
        public void close() throws IOException {
            // 关闭串口
            Log.d("ScalePlugin", "Closing serial port");
        }
    }
}
