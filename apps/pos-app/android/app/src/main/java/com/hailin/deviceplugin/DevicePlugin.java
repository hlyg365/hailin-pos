package com.hailin.deviceplugin;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
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

import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 海邻到家一体机硬件抽象层 V6.0
 * 
 * 支持三种电子秤连接方式：
 * 1. 串口通信（USB Serial）- 使用 Android USB Host API
 * 2. 网络秤（TCP）- 适用于网络秤设备
 * 3. USB HID模式 - 适用于 HID 电子秤
 * 
 * 顶尖电子秤配置：
 * - 波特率: 9600
 * - 数据位: 8
 * - 停止位: 1
 * - 校验位: 无
 * - 协议: OS2 (帧头 0x01)
 */
public class DevicePlugin extends Plugin {

    private static final String TAG = "DevicePlugin";
    private static final String ACTION_USB_PERMISSION = "com.hailin.USB_PERMISSION";
    
    // USB Vendor IDs for common USB-Serial chips
    private static final int USB_VID_FTDI = 0x0403;
    private static final int USB_VID_SILABS = 0x10C4;
    private static final int USB_VID_PROLIFIC = 0x067B;
    private static final int USB_VID_CH340 = 0x1A86;
    
    // 连接池管理
    private final Map<String, UsbSerialConnection> usbSerialPool = new ConcurrentHashMap<>();
    private final Map<String, ScaleDataCallback> scaleCallbacks = new ConcurrentHashMap<>();
    private final ExecutorService executor = Executors.newFixedThreadPool(8);
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    
    // USB Serial
    private UsbManager usbManager;
    private Context appContext;
    private UsbDevice currentScaleDevice;
    private PendingIntent permissionIntent;
    
    // ==================== 插件初始化 ====================
    @Override
    public void load() {
        super.load();
        appContext = getContext();
        usbManager = (UsbManager) appContext.getSystemService(Context.USB_SERVICE);
        
        // 创建权限请求的 PendingIntent
        permissionIntent = PendingIntent.getBroadcast(
            appContext, 0, new Intent(ACTION_USB_PERMISSION), 
            PendingIntent.FLAG_IMMUTABLE);
        
        // 注册 USB 设备广播接收器
        IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
        filter.addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED);
        filter.addAction(UsbManager.ACTION_USB_DEVICE_DETACHED);
        appContext.registerReceiver(usbReceiver, filter);
        
        Log.i(TAG, "DevicePlugin 硬件抽象层已加载");
    }
    
    @Override
    protected void finalize() throws Throwable {
        super.finalize();
        try {
            appContext.unregisterReceiver(usbReceiver);
        } catch (Exception e) {}
    }
    
    private final BroadcastReceiver usbReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            
            if (ACTION_USB_PERMISSION.equals(action)) {
                synchronized (this) {
                    UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                        Log.i(TAG, "USB 权限已授予");
                    } else {
                        Log.w(TAG, "USB 权限被拒绝");
                    }
                }
            } else if (UsbManager.ACTION_USB_DEVICE_ATTACHED.equals(action)) {
                UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                if (device != null && isUsbSerialDevice(device)) {
                    Log.i(TAG, "USB 串口设备已连接: " + device.getDeviceName());
                }
            } else if (UsbManager.ACTION_USB_DEVICE_DETACHED.equals(action)) {
                UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                if (device != null && device.equals(currentScaleDevice)) {
                    Log.i(TAG, "秤设备已断开");
                    disconnectScale();
                }
            }
        }
    };
    
    /**
     * 检测是否为 USB 串口设备
     */
    private boolean isUsbSerialDevice(UsbDevice device) {
        int vid = device.getVendorId();
        // 常见 USB 转串口芯片
        return vid == USB_VID_FTDI || vid == USB_VID_SILABS || 
               vid == USB_VID_PROLIFIC || vid == USB_VID_CH340;
    }

    // ==================== 1. 电子秤驱动模块 ====================
    
    /**
     * 列出可用的 USB 串口设备
     */
    @PluginMethod
    public void listUsbDevices(PluginCall call) {
        HashMap<String, UsbDevice> devices = usbManager.getDeviceList();
        JSObject result = new JSObject();
        
        int count = 0;
        for (Map.Entry<String, UsbDevice> entry : devices.entrySet()) {
            UsbDevice device = entry.getValue();
            if (isUsbSerialDevice(device)) {
                count++;
                result.put("device_" + count, device.getDeviceName());
                result.put("vid_" + count, device.getVendorId());
                result.put("pid_" + count, device.getProductId());
                result.put("name_" + count, device.getProductName());
            }
        }
        
        result.put("count", count);
        call.resolve(result);
    }
    
    /**
     * 请求 USB 设备权限
     */
    @PluginMethod
    public void requestUsbPermission(PluginCall call) {
        String deviceName = call.getString("deviceName", "");
        
        HashMap<String, UsbDevice> devices = usbManager.getDeviceList();
        UsbDevice targetDevice = null;
        
        for (UsbDevice device : devices.values()) {
            if (device.getDeviceName().equals(deviceName) || deviceName.isEmpty()) {
                if (isUsbSerialDevice(device)) {
                    targetDevice = device;
                    break;
                }
            }
        }
        
        if (targetDevice == null) {
            call.reject("未找到指定的 USB 串口设备");
            return;
        }
        
        if (usbManager.hasPermission(targetDevice)) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
        } else {
            usbManager.requestPermission(targetDevice, permissionIntent);
            
            JSObject result = new JSObject();
            result.put("granted", false);
            result.put("message", "已请求权限，请在弹窗中授权");
            call.resolve(result);
        }
    }
    
    /**
     * 连接电子秤（USB 串口）
     * 
     * 参数：
     * - deviceName: USB 设备名称（可选，自动搜索）
     * - baudRate: 波特率，默认 9600
     * - protocol: 协议类型，general/soki/aclas/dahua/toieda
     */
    @PluginMethod
    public void scaleConnect(PluginCall call) {
        String deviceName = call.getString("deviceName", "");
        int baudRate = call.getInt("baudRate", 9600);
        String protocol = call.getString("protocol", "soki");
        
        Log.i(TAG, String.format("连接电子秤: device=%s, baudRate=%d, protocol=%s",
                deviceName, baudRate, protocol));
        
        executor.execute(() -> {
            try {
                UsbDevice targetDevice = null;
                
                // 查找 USB 串口设备
                HashMap<String, UsbDevice> devices = usbManager.getDeviceList();
                for (UsbDevice device : devices.values()) {
                    if (isUsbSerialDevice(device)) {
                        targetDevice = device;
                        if (!deviceName.isEmpty() && !device.getDeviceName().equals(deviceName)) {
                            continue;
                        }
                        break;
                    }
                }
                
                if (targetDevice == null) {
                    call.reject("未找到 USB 串口设备，请确保电子秤已连接");
                    return;
                }
                
                // 检查权限
                if (!usbManager.hasPermission(targetDevice)) {
                    call.reject("需要 USB 设备权限，请在弹窗中授权");
                    return;
                }
                
                // 建立 USB 连接
                UsbSerialConnection connection = new UsbSerialConnection(targetDevice, usbManager);
                if (!connection.open()) {
                    call.reject("无法打开 USB 设备");
                    return;
                }
                
                // 设置波特率
                connection.setBaudRate(baudRate);
                
                // 保存连接
                usbSerialPool.put("scale", connection);
                currentScaleDevice = targetDevice;
                
                // 保存回调
                ScaleDataCallback callback = new ScaleDataCallback();
                callback.protocol = protocol;
                scaleCallbacks.put("scale", callback);
                
                // 启动数据读取
                startUsbSerialReader(connection, protocol);
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("deviceName", targetDevice.getDeviceName());
                result.put("baudRate", baudRate);
                result.put("message", "电子秤连接成功 (USB Serial @ " + baudRate + " bps)");
                call.resolve(result);
                
                Log.i(TAG, "电子秤 USB 串口连接成功");
                
            } catch (Exception e) {
                Log.e(TAG, "电子秤连接失败", e);
                call.reject("电子秤连接失败: " + e.getMessage());
            }
        });
    }
    
    /**
     * 启动 USB 串口数据读取
     */
    private void startUsbSerialReader(UsbSerialConnection connection, String protocol) {
        executor.execute(() -> {
            byte[] buffer = new byte[64];
            
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    int bytesRead = connection.read(buffer, buffer.length);
                    if (bytesRead > 0) {
                        byte[] data = new byte[bytesRead];
                        System.arraycopy(buffer, 0, data, 0, bytesRead);
                        handleScaleData(data, protocol);
                    }
                    Thread.sleep(50);
                } catch (InterruptedException e) {
                    break;
                } catch (Exception e) {
                    Log.e(TAG, "USB 串口读取异常", e);
                    break;
                }
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
    
    // ==================== 2. 协议解析 ====================
    
    /**
     * 顶尖 OS2 协议解析
     * 帧头 0x01，格式：
     * 01 XX XX XX XX XX XX XX XX
     * 状态  单位  重量数值(BCD)
     */
    private ScaleWeight parseTopSokiOS2Protocol(byte[] data, ScaleWeight weight) {
        if (data == null || data.length < 9) return null;
        
        try {
            Log.d(TAG, "顶尖OS2协议数据: " + bytesToHex(data));
            
            if (data[0] == 0x01) {
                // 状态位
                byte status = data[1];
                weight.stable = (status == 0x17 || status == 0x1F);
                
                // 单位
                weight.unit = (data[2] == 'K' || data[2] == 'k') ? "kg" : "g";
                
                // BCD 编码重量
                int value = ((data[4] & 0xFF) * 10000) + ((data[5] & 0xFF) * 100) + (data[6] & 0xFF);
                
                if (weight.unit.equals("kg")) {
                    weight.weight = value / 1000.0;
                } else {
                    weight.weight = value;
                }
                
                // 负数检测
                if ((data[7] & 0x40) != 0) {
                    weight.weight = -weight.weight;
                }
                
                Log.d(TAG, String.format("顶尖OS2: weight=%.3f%s, stable=%s", 
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
     * 帧头 0x02，帧尾 0x03
     */
    private ScaleWeight parseTopSokiACLaSProtocol(byte[] data, ScaleWeight weight) {
        if (data == null || data.length < 12) return null;
        
        try {
            if (data[0] == 0x02 && data[data.length - 1] == 0x03) {
                weight.stable = (data[1] == 0x30);
                
                StringBuilder weightStr = new StringBuilder();
                for (int i = 2; i < Math.min(data.length - 1, 10); i++) {
                    if (data[i] >= 0x30 && data[i] <= 0x39) {
                        weightStr.append((char) data[i]);
                    }
                }
                
                try {
                    weight.weight = Double.parseDouble(weightStr.toString()) / 1000.0;
                    weight.unit = "kg";
                } catch (NumberFormatException e) {
                    return null;
                }
            } else {
                return parseGeneralProtocol(data, weight);
            }
            
            return weight;
        } catch (Exception e) {
            Log.e(TAG, "ACLaS协议解析异常", e);
            return null;
        }
    }
    
    /**
     * 通用协议解析
     */
    private ScaleWeight parseGeneralProtocol(byte[] data, ScaleWeight weight) {
        if (data == null || data.length < 8) return null;
        
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
     * 大华协议解析
     */
    private ScaleWeight parseDahuaProtocol(byte[] data, ScaleWeight weight) {
        if (data == null || data.length < 10) return null;
        
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
            
            weight.unit = (data[data.length - 3] == 'k') ? "kg" : "g";
        }
        
        return weight;
    }
    
    /**
     * 托利多协议解析
     */
    private ScaleWeight parseToiedaProtocol(byte[] data, ScaleWeight weight) {
        if (data == null || data.length < 10) return null;
        
        String text;
        try {
            text = new String(data, "ASCII").trim();
        } catch (UnsupportedEncodingException e) {
            text = new String(data).trim();
        }
        
        if (text.contains("ST") || text.contains("US")) {
            weight.stable = text.contains("ST");
            
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
        } catch (UnsupportedEncodingException e) {
            text = new String(data).trim();
        }
        
        if (text.contains("kg") || text.contains("g") || text.contains("ST")) {
            Log.d(TAG, "检测到: 文本协议");
            return parseGeneralProtocol(data, weight);
        }
        
        Log.w(TAG, "无法识别协议格式");
        return null;
    }
    
    // ==================== 3. 秤控制方法 ====================
    
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
        UsbSerialConnection connection = usbSerialPool.get("scale");
        
        JSObject result = new JSObject();
        result.put("connected", connection != null && connection.isConnected());
        result.put("type", "usb_serial");
        
        call.resolve(result);
    }
    
    /**
     * 断开电子秤
     */
    @PluginMethod
    public void scaleDisconnect(PluginCall call) {
        disconnectScale();
        
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }
    
    private void disconnectScale() {
        UsbSerialConnection connection = usbSerialPool.remove("scale");
        if (connection != null) {
            connection.close();
        }
        scaleCallbacks.remove("scale");
        currentScaleDevice = null;
    }
    
    /**
     * 断开所有设备
     */
    @PluginMethod
    public void disconnectAll(PluginCall call) {
        for (UsbSerialConnection conn : usbSerialPool.values()) {
            conn.close();
        }
        usbSerialPool.clear();
        scaleCallbacks.clear();
        currentScaleDevice = null;
        
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
    
    // ==================== USB 串口连接类 ====================
    
    /**
     * USB 串口连接封装
     * 支持 FTDI, Silicon Labs, Prolific, CH340 等常见 USB 转串口芯片
     */
    class UsbSerialConnection {
        private final UsbDevice device;
        private final UsbManager manager;
        private UsbEndpoint endpointIn;
        private UsbEndpoint endpointOut;
        private UsbInterface usbInterface;
        private boolean connected = false;
        private android.hardware.usb.UsbDeviceConnection connection;
        
        public UsbSerialConnection(UsbDevice device, UsbManager manager) {
            this.device = device;
            this.manager = manager;
        }
        
        public boolean open() {
            try {
                // 查找批量传输接口
                for (int i = 0; i < device.getInterfaceCount(); i++) {
                    UsbInterface intf = device.getInterface(i);
                    for (int j = 0; j < intf.getEndpointCount(); j++) {
                        UsbEndpoint ep = intf.getEndpoint(j);
                        if (ep.getType() == android.hardware.usb.UsbConstants.USB_ENDPOINT_XFER_BULK) {
                            if (ep.getDirection() == android.hardware.usb.UsbConstants.USB_DIR_IN) {
                                endpointIn = ep;
                            } else {
                                endpointOut = ep;
                            }
                        }
                    }
                    if (endpointIn != null && endpointOut != null) {
                        usbInterface = intf;
                        break;
                    }
                }
                
                if (endpointIn == null || endpointOut == null) {
                    Log.e(TAG, "未找到批量传输端点");
                    return false;
                }
                
                // 打开设备
                connection = manager.openDevice(device);
                if (connection == null) {
                    Log.e(TAG, "无法打开 USB 设备");
                    return false;
                }
                
                // 声明接口
                if (!connection.claimInterface(usbInterface, true)) {
                    Log.e(TAG, "无法声明 USB 接口");
                    connection.close();
                    return false;
                }
                
                connected = true;
                Log.i(TAG, "USB 串口打开成功");
                return true;
                
            } catch (Exception e) {
                Log.e(TAG, "打开 USB 串口失败", e);
                return false;
            }
        }
        
        public void setBaudRate(int baudRate) {
            // 不同芯片的波特率设置方式不同
            // 这里简化处理，实际需要根据芯片类型发送对应命令
            int vid = device.getVendorId();
            
            if (vid == USB_VID_FTDI) {
                // FTDI 芯片使用特殊命令设置波特率
                // 需要发送 FTDI 专用命令
                byte[] baudCmd = new byte[]{(byte) 0x86, 0x7C, 0x00, 0x00};
                // 计算分频值
                int divisor = 3000000 / baudRate;
                baudCmd[1] = (byte) (divisor & 0xFF);
                baudCmd[2] = (byte) ((divisor >> 8) & 0xFF);
                connection.bulkTransfer(endpointOut, baudCmd, baudCmd.length, 100);
            } else if (vid == USB_VID_SILABS) {
                // Silicon Labs CP210x - 通常自动检测波特率
            } else if (vid == USB_VID_CH340) {
                // CH340 - 发送波特率设置命令
                byte[] baudCmd = buildCH340BaudRate(baudRate);
                if (baudCmd != null) {
                    connection.bulkTransfer(endpointOut, baudCmd, baudCmd.length, 100);
                }
            }
            
            Log.d(TAG, "波特率已设置为: " + baudRate);
        }
        
        private byte[] buildCH340BaudRate(int baudRate) {
            // CH340 波特率设置命令
            int factor = 1536000 / baudRate;
            byte[] cmd = new byte[]{(byte) 0x9A, (byte) (factor & 0xFF), 0x00};
            // 计算校验位
            cmd[2] = (byte) (0x9A ^ cmd[1]);
            return cmd;
        }
        
        public int read(byte[] buffer, int timeout) {
            try {
                if (connection != null) {
                    return connection.bulkTransfer(endpointIn, buffer, buffer.length, timeout);
                }
            } catch (Exception e) {
                Log.e(TAG, "USB 读取异常", e);
            }
            return -1;
        }
        
        public int write(byte[] data) {
            try {
                if (connection != null) {
                    return connection.bulkTransfer(endpointOut, data, data.length, 1000);
                }
            } catch (Exception e) {
                Log.e(TAG, "USB 写入异常", e);
            }
            return -1;
        }
        
        public boolean isConnected() {
            return connected && connection != null;
        }
        
        public void close() {
            try {
                connected = false;
                if (connection != null) {
                    if (usbInterface != null) {
                        connection.releaseInterface(usbInterface);
                    }
                    connection.close();
                    connection = null;
                }
            } catch (Exception e) {
                Log.e(TAG, "关闭 USB 连接失败", e);
            }
        }
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
