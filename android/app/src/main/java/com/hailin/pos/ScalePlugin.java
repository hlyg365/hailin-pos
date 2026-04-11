package com.hailin.pos;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.util.HashMap;

@CapacitorPlugin(name = "Scale")
public class ScalePlugin extends Plugin {
    
    private static final String TAG = "ScalePlugin";
    private static final String ACTION_CONNECT = "connect";
    private static final String ACTION_DISCONNECT = "disconnect";
    private static final String ACTION_GET_WEIGHT = "getWeight";
    private static final String ACTION_GET_STATUS = "getStatus";
    private static final String ACTION_SET_WEIGHT = "setWeight";
    private static final String ACTION_LIST_DEVICES = "listDevices";
    
    // 串口通信相关
    private UsbManager usbManager = null;
    private UsbDevice currentDevice = null;
    private SerialConnection serialConnection = null;
    private Handler mainHandler = null;
    private Runnable weightPollingRunnable = null;
    private boolean isConnected = false;
    private boolean isPolling = false;
    
    // 当前重量数据
    private WeightData currentWeight = new WeightData();
    
    // 顶尖OS2协议相关常量
    private static final byte FRAME_HEAD = 0x02;
    private static final byte FRAME_END = 0x03;
    
    public ScalePlugin() {
        mainHandler = new Handler(Looper.getMainLooper());
    }
    
    @Override
    public void load() {
        super.load();
        usbManager = (UsbManager) getContext().getSystemService(Context.USB_SERVICE);
        registerUsbReceiver();
        Log.d(TAG, "ScalePlugin loaded");
    }
    
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        disconnect();
        try {
            getContext().unregisterReceiver(usbReceiver);
        } catch (Exception e) {
            Log.e(TAG, "Failed to unregister receiver", e);
        }
    }
    
    private void registerUsbReceiver() {
        IntentFilter filter = new IntentFilter(UsbManager.ACTION_USB_DEVICE_DETACHED);
        getContext().registerReceiver(usbReceiver, filter);
    }
    
    private final BroadcastReceiver usbReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (UsbManager.ACTION_USB_DEVICE_DETACHED.equals(action)) {
                synchronized (this) {
                    UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    if (device != null && device.equals(currentDevice)) {
                        Log.d(TAG, "USB device detached");
                        disconnect();
                        notifyListeners("onDisconnect", createResult(false, "电子秤已断开连接"));
                    }
                }
            }
        }
    };
    
    @PluginMethod
    public void listDevices(PluginCall call) {
        JSObject result = new JSObject();
        
        try {
            if (usbManager == null) {
                usbManager = (UsbManager) getContext().getSystemService(Context.USB_SERVICE);
            }
            
            HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
            JSObject devices = new JSObject();
            
            for (String key : deviceList.keySet()) {
                UsbDevice device = deviceList.get(key);
                JSObject deviceInfo = new JSObject();
                deviceInfo.put("name", device.getDeviceName());
                deviceInfo.put("vendorId", device.getVendorId());
                deviceInfo.put("productId", device.getProductId());
                deviceInfo.put("deviceId", device.getDeviceId());
                deviceInfo.put("productName", device.getProductName());
                devices.put(key, deviceInfo);
            }
            
            result.put("success", true);
            result.put("devices", devices);
            result.put("count", deviceList.size());
            call.resolve(result);
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            call.reject("Failed to list devices", e);
        }
    }
    
    @PluginMethod
    public void connect(PluginCall call) {
        String port = call.getString("port", "");
        int baudRate = call.getInt("baudRate", 9600);
        String protocol = call.getString("protocol", "OS2");
        
        Log.d(TAG, "Connecting to scale: port=" + port + ", baudRate=" + baudRate + ", protocol=" + protocol);
        
        try {
            // 如果已经连接，先断开
            if (isConnected) {
                disconnect();
            }
            
            // 尝试连接USB设备
            if (usbManager == null) {
                usbManager = (UsbManager) getContext().getSystemService(Context.USB_SERVICE);
            }
            
            HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
            
            // 查找匹配的设备
            UsbDevice targetDevice = null;
            for (UsbDevice device : deviceList.values()) {
                // 尝试匹配 vendor/product ID 或设备名
                String deviceName = device.getDeviceName().toLowerCase();
                if (port.isEmpty() || deviceName.contains(port.toLowerCase()) ||
                    device.getVendorId() == getVendorIdFromPort(port)) {
                    targetDevice = device;
                    break;
                }
            }
            
            if (targetDevice == null) {
                // 没有找到USB设备，尝试使用模拟模式或虚拟串口
                Log.d(TAG, "No USB device found, trying simulation mode");
                startSimulationMode();
                
                JSObject result = createResult(true, "模拟模式已启用（未检测到电子秤设备）");
                result.put("mode", "simulation");
                call.resolve(result);
                return;
            }
            
            // 请求USB权限
            PendingIntent permissionIntent = PendingIntent.getBroadcast(
                getContext(), 0, new Intent("com.hailin.pos.USB_PERMISSION"), 0);
            
            if (usbManager.hasPermission(targetDevice)) {
                openDevice(targetDevice, baudRate);
            } else {
                // 保存调用以在权限授予后继续
                call.save();
                usbManager.requestPermission(targetDevice, permissionIntent);
                return;
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to connect", e);
            call.reject("连接失败: " + e.getMessage(), e);
        }
    }
    
    private int getVendorIdFromPort(String port) {
        // 常见USB转串口芯片的Vendor ID
        switch (port.toUpperCase()) {
            case "CH340":
            case "CH340G":
                return 0x1a86; // WCH
            case "CP2102":
            case "CP2104":
                return 0x10c4; // Silicon Labs
            case "FTDI":
            case "FT232":
                return 0x0403; // FTDI
            case "PL2303":
                return 0x067b; // Prolific
            default:
                return 0; // 未知
        }
    }
    
    private void openDevice(UsbDevice device, int baudRate) {
        try {
            // 检查权限
            if (!usbManager.hasPermission(device)) {
                Log.e(TAG, "No permission for device");
                return;
            }
            
            currentDevice = device;
            
            // 创建USB连接
            UsbDeviceConnection connection = usbManager.openDevice(device);
            
            if (connection == null) {
                Log.e(TAG, "Failed to open USB device");
                return;
            }
            
            // 获取接口
            UsbInterface usbInterface = device.getInterface(0);
            
            // Claim接口
            if (!connection.claimInterface(usbInterface, true)) {
                Log.e(TAG, "Failed to claim interface");
                connection.close();
                return;
            }
            
            // 创建串口连接
            serialConnection = new SerialConnection(connection, usbInterface, baudRate);
            
            isConnected = true;
            startPolling();
            
            Log.d(TAG, "Connected to scale successfully");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to open device", e);
        }
    }
    
    private void startSimulationMode() {
        isConnected = true;
        currentWeight.weight = 1.5;
        currentWeight.unit = "kg";
        currentWeight.stable = true;
        currentWeight.timestamp = System.currentTimeMillis();
        
        // 模拟重量变化
        startPolling();
    }
    
    @PluginMethod
    public void disconnect(PluginCall call) {
        disconnect();
        JSObject result = createResult(true, "已断开电子秤连接");
        call.resolve(result);
    }
    
    private void disconnect() {
        stopPolling();
        
        if (serialConnection != null) {
            serialConnection.close();
            serialConnection = null;
        }
        
        currentDevice = null;
        isConnected = false;
        
        currentWeight = new WeightData();
        
        Log.d(TAG, "Disconnected from scale");
    }
    
    @PluginMethod
    public void getWeight(PluginCall call) {
        JSObject result = new JSObject();
        
        if (!isConnected) {
            result.put("success", false);
            result.put("connected", false);
            result.put("error", "电子秤未连接");
            call.resolve(result);
            return;
        }
        
        result.put("success", true);
        result.put("connected", true);
        result.put("weight", currentWeight.weight);
        result.put("unit", currentWeight.unit);
        result.put("stable", currentWeight.stable);
        result.put("timestamp", currentWeight.timestamp);
        
        call.resolve(result);
    }
    
    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = createResult(true, "ok");
        result.put("connected", isConnected);
        result.put("polling", isPolling);
        result.put("mode", serialConnection != null ? "usb" : "simulation");
        call.resolve(result);
    }
    
    @PluginMethod
    public void setWeight(PluginCall call) {
        double weight = call.getDouble("weight", 0);
        String unit = call.getString("unit", "kg");
        boolean stable = call.getBoolean("stable", true);
        
        currentWeight.weight = weight;
        currentWeight.unit = unit;
        currentWeight.stable = stable;
        currentWeight.timestamp = System.currentTimeMillis();
        
        // 通知监听器
        JSObject data = new JSObject();
        data.put("weight", weight);
        data.put("unit", unit);
        data.put("stable", stable);
        data.put("timestamp", currentWeight.timestamp);
        
        notifyListeners("onWeightChange", data);
        
        JSObject result = createResult(true, "重量已设置");
        call.resolve(result);
    }
    
    private void startPolling() {
        if (isPolling) return;
        
        isPolling = true;
        weightPollingRunnable = new Runnable() {
            @Override
            public void run() {
                if (isPolling && isConnected) {
                    pollWeight();
                    mainHandler.postDelayed(this, 200); // 200ms轮询间隔
                }
            }
        };
        mainHandler.post(weightPollingRunnable);
    }
    
    private void stopPolling() {
        isPolling = false;
        if (weightPollingRunnable != null) {
            mainHandler.removeCallbacks(weightPollingRunnable);
            weightPollingRunnable = null;
        }
    }
    
    private void pollWeight() {
        try {
            if (serialConnection != null) {
                // 读取串口数据
                byte[] data = serialConnection.read();
                if (data != null && data.length > 0) {
                    parseWeightData(data);
                }
                
                // 发送读取命令（如果需要）
                serialConnection.sendCommand(getReadCommand());
            } else {
                // 模拟模式：生成随机重量
                simulateWeight();
            }
            
            // 通知监听器
            if (currentWeight.timestamp > 0) {
                JSObject data = new JSObject();
                data.put("weight", currentWeight.weight);
                data.put("unit", currentWeight.unit);
                data.put("stable", currentWeight.stable);
                data.put("timestamp", currentWeight.timestamp);
                
                notifyListeners("onWeightChange", data);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error polling weight", e);
        }
    }
    
    private void parseWeightData(byte[] data) {
        try {
            // 尝试解析顶尖OS2协议
            // 协议格式: 0x02 [数据] 0x03
            
            String hexData = bytesToHex(data);
            Log.d(TAG, "Received data: " + hexData);
            
            // 查找帧头和帧尾
            int start = -1, end = -1;
            for (int i = 0; i < data.length; i++) {
                if (data[i] == FRAME_HEAD) start = i;
                if (data[i] == FRAME_END) {
                    end = i;
                    break;
                }
            }
            
            if (start >= 0 && end > start) {
                byte[] payload = new byte[end - start - 1];
                System.arraycopy(data, start + 1, payload, 0, payload.length);
                
                // 解析重量数据
                String weightStr = new String(payload);
                parseOS2Data(weightStr);
            } else {
                // 尝试直接解析
                String strData = new String(data, "US-ASCII");
                parseOS2Data(strData);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to parse weight data", e);
        }
    }
    
    private void parseOS2Data(String data) {
        try {
            // 格式1: ST,GS,+002.365,kg, 0000
            // 格式2: +002.365kg
            
            String weightStr = "";
            String unit = "kg";
            boolean stable = true;
            
            if (data.contains(",")) {
                String[] parts = data.split(",");
                for (int i = 0; i < parts.length; i++) {
                    String part = parts[i].trim();
                    // 查找包含小数点的数字
                    if (part.matches("[+-]?[0-9]*\\.?[0-9]+")) {
                        weightStr = part;
                        if (i + 1 < parts.length) {
                            unit = parts[i + 1].trim();
                        }
                        break;
                    }
                }
            } else {
                // 提取数字
                String digits = data.replaceAll("[^0-9.-]", "");
                weightStr = digits;
            }
            
            if (!weightStr.isEmpty()) {
                currentWeight.weight = Double.parseDouble(weightStr);
                currentWeight.unit = unit.toLowerCase();
                currentWeight.stable = stable;
                currentWeight.timestamp = System.currentTimeMillis();
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to parse OS2 data: " + data, e);
        }
    }
    
    private void simulateWeight() {
        // 模拟重量变化
        double base = 1.5 + Math.sin(System.currentTimeMillis() / 2000.0) * 0.5;
        double noise = (Math.random() - 0.5) * 0.02;
        currentWeight.weight = Math.round((base + noise) * 1000.0) / 1000.0;
        currentWeight.unit = "kg";
        currentWeight.stable = Math.random() > 0.1;
        currentWeight.timestamp = System.currentTimeMillis();
    }
    
    private byte[] getReadCommand() {
        // 顶尖OS2协议读取命令
        // 如果电子秤是主动发送模式，可能不需要命令
        return new byte[]{};
    }
    
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X ", b));
        }
        return sb.toString();
    }
    
    private JSObject createResult(boolean success, String message) {
        JSObject result = new JSObject();
        result.put("success", success);
        result.put("message", message);
        return result;
    }
    
    // 内部类：串口连接
    private class SerialConnection {
        private UsbDeviceConnection connection;
        private UsbInterface usbInterface;
        private int baudRate;
        
        public SerialConnection(UsbDeviceConnection connection, UsbInterface usbInterface, int baudRate) {
            this.connection = connection;
            this.usbInterface = usbInterface;
            this.baudRate = baudRate;
        }
        
        public byte[] read() {
            // USB转串口读取
            // 实际实现需要使用UsbRequest进行批量传输
            // 这里简化处理
            byte[] buffer = new byte[64];
            int ret = connection.bulkTransfer(
                usbInterface.getEndpoint(0),
                buffer, buffer.length, 100
            );
            
            if (ret > 0) {
                byte[] data = new byte[ret];
                System.arraycopy(buffer, 0, data, 0, ret);
                return data;
            }
            return null;
        }
        
        public void sendCommand(byte[] command) {
            if (command.length == 0) return;
            
            // 查找OUT端点
            UsbEndpoint outEndpoint = null;
            for (int i = 0; i < usbInterface.getEndpointCount(); i++) {
                UsbEndpoint ep = usbInterface.getEndpoint(i);
                if (ep.getDirection() == UsbConstants.USB_DIR_OUT) {
                    outEndpoint = ep;
                    break;
                }
            }
            
            if (outEndpoint != null) {
                connection.bulkTransfer(outEndpoint, command, command.length, 100);
            }
        }
        
        public void close() {
            if (connection != null) {
                connection.releaseInterface(usbInterface);
                connection.close();
            }
        }
    }
    
    // 内部类：重量数据
    private static class WeightData {
        double weight = 0;
        String unit = "kg";
        boolean stable = false;
        long timestamp = 0;
    }
}
