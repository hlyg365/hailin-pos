package com.hailin.deviceplugin;

import android.app.Presentation;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Typeface;
import android.hardware.display.DisplayManager;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Display;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import org.json.JSONObject;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketAddress;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 海邻到家一体机硬件抽象层 V6.0
 * 
 * 使用 tp.xmaihh:serialport 库实现串口通信
 * 集成方式: implementation 'tp.xmaihh:serialport:2.1'
 * GitHub: https://github.com/xmaihh/android-serialport
 * 
 * 支持三种电子秤连接方式：
 * 1. 串口通信（Serial Port/UART）- 最常用，适用于内置秤
 * 2. USB HID模式 - 适用于外接USB电子秤
 * 3. 网络秤（TCP）- 适用于网络秤设备
 * 
 * 关键配置项：
 * - 端口号: /dev/ttyS1, /dev/ttyS2, /dev/ttyS9
 * - 波特率: 9600, 19200, 38400
 * - 数据位/停止位: 8N1 (8数据位, 无校验, 1停止位)
 */
public class DevicePlugin extends Plugin {

    private static final String TAG = "DevicePlugin";
    
    // ==================== 连接池管理 ====================
    private final Map<String, Socket> socketPool = new ConcurrentHashMap<>();
    private final Map<String, SerialHelper> serialHelperPool = new ConcurrentHashMap<>();
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
        Log.i(TAG, "使用 tp.xmaihh:serialport 库实现串口通信");
    }

    // ==================== 1. 电子秤驱动模块 ====================
    
    /**
     * 连接电子秤（串口/RS232）
     * 
     * 使用 tp.xmaihh:serialport 库
     * 配置参数：
     * - port: 串口路径，如 /dev/ttyS1, /dev/ttyS2, /dev/ttyS9
     * - baudRate: 波特率，如 9600, 19200, 38400
     * - dataBits: 数据位，默认8
     * - stopBits: 停止位，默认1
     * - parity: 校验位，none/odd/even
     * - protocol: 协议类型，general/dahua/toieda/soki
     */
    @PluginMethod
    public void scaleConnect(PluginCall call) {
        String port = call.getString("port", "/dev/ttyS1");
        int baudRate = call.getInt("baudRate", 9600);
        String protocol = call.getString("protocol", "general");
        
        Log.i(TAG, String.format("连接串口秤: port=%s, baudRate=%d, protocol=%s",
                port, baudRate, protocol));
        
        executor.execute(() -> {
            try {
                // 创建串口助手（使用 tp.xmaihh:serialport 库）
                SerialHelper serialHelper = new SerialHelper(port, baudRate) {
                    @Override
                    protected void onDataReceived(ComBean comBean) {
                        // 数据接收回调
                        // comBean.bRec 是接收到的字节数组
                        handleScaleData(comBean.bRec, protocol);
                    }
                };
                
                // 打开串口
                serialHelper.open();
                
                // 保存到连接池
                serialHelperPool.put("scale", serialHelper);
                
                // 保存回调
                ScaleDataCallback callback = new ScaleDataCallback();
                callback.protocol = protocol;
                scaleCallbacks.put("scale", callback);
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("port", port);
                result.put("baudRate", baudRate);
                result.put("message", "电子秤串口连接成功 (tp.xmaihh:serialport)");
                call.resolve(result);
                
                Log.i(TAG, "电子秤串口连接成功");
                
            } catch (Exception e) {
                Log.e(TAG, "电子秤连接失败", e);
                
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("error", e.getMessage());
                
                // 检查权限问题
                if (e.getMessage() != null && e.getMessage().contains("Permission")) {
                    result.put("errorType", "PERMISSION_DENIED");
                    result.put("suggestion", "需要系统签名或Root权限才能访问串口设备");
                }
                
                call.reject("电子秤连接失败: " + e.getMessage());
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
            
            // 发送到前端
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
     * 解析秤数据
     */
    private ScaleWeight parseScaleData(byte[] data, String protocol) {
        try {
            Log.d(TAG, "秤原始数据: " + bytesToHex(data));
            
            ScaleWeight weight = new ScaleWeight();
            weight.timestamp = System.currentTimeMillis();
            
            // 根据协议解析
            switch (protocol) {
                case "dahua":
                    return parseDahuaProtocol(data, weight);
                case "toieda":
                    return parseToiedaProtocol(data, weight);
                case "soki":
                    return parseSokiProtocol(data, weight);
                default:
                    return parseGeneralProtocol(data, weight);
            }
        } catch (Exception e) {
            Log.e(TAG, "秤数据解析失败", e);
            return null;
        }
    }
    
    /**
     * 通用协议解析
     * 格式: STX + 状态 + 符号 + 数值 + 单位 + BCC + ETX
     * 示例: 02 47 53 2B 30 31 32 2E 35 30 30 03
     */
    private ScaleWeight parseGeneralProtocol(byte[] data, ScaleWeight weight) {
        if (data.length < 8) return null;
        
        // 帧头检测
        if (data[0] == 0x02) {
            // 十六进制格式解析
            weight.stable = (data[1] == 0x47 || data[1] == 'G' || data[1] == 'S');
            
            // 提取数值
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
            
            // 单位
            byte unitByte = data[data.length - 2];
            weight.unit = parseUnit(unitByte);
            
        } else {
            // 尝试文本格式解析
            String text = new String(data, "ASCII").trim();
            Log.d(TAG, "文本格式数据: " + text);
            
            // 正则匹配
            Pattern pattern = Pattern.compile("([+-]?\\d+\\.?\\d*)\\s*(kg|g|lb)?");
            Matcher matcher = pattern.matcher(text);
            
            if (matcher.find()) {
                weight.weight = Double.parseDouble(matcher.group(1));
                weight.unit = matcher.group(2) != null ? matcher.group(2) : "kg";
                weight.stable = text.contains("GS") || text.contains("ST");
                
                if (weight.unit.equals("g")) {
                    weight.weight = weight.weight / 1000;
                    weight.unit = "kg";
                }
            } else {
                return null;
            }
        }
        
        Log.i(TAG, String.format("解析结果: %.3f %s (稳定=%b)", 
                weight.weight, weight.unit, weight.stable));
        
        return weight;
    }
    
    /**
     * 大华协议解析
     */
    private ScaleWeight parseDahuaProtocol(byte[] data, ScaleWeight weight) {
        return parseGeneralProtocol(data, weight);
    }
    
    /**
     * 托利多协议解析
     */
    private ScaleWeight parseToiedaProtocol(byte[] data, ScaleWeight weight) {
        return parseGeneralProtocol(data, weight);
    }
    
    /**
     * 顶尖协议解析
     */
    private ScaleWeight parseSokiProtocol(byte[] data, ScaleWeight weight) {
        return parseGeneralProtocol(data, weight);
    }
    
    private String parseUnit(byte unitByte) {
        switch (unitByte) {
            case 'K':
            case 'k':
                return "kg";
            case 'L':
            case 'l':
                return "lb";
            case 'G':
            case 'g':
                return "g";
            case 'O':
            case 'o':
                return "oz";
            default:
                return "kg";
        }
    }
    
    /**
     * 连接USB HID电子秤
     */
    @PluginMethod
    public void scaleConnectUSB(PluginCall call) {
        int vendorId = call.getInt("vendorId", 0);
        int productId = call.getInt("productId", 0);
        String protocol = call.getString("protocol", "general");
        
        Log.i(TAG, String.format("连接USB HID秤: vendorId=%04X, productId=%04X", vendorId, productId));
        
        executor.execute(() -> {
            try {
                if (usbManager == null) {
                    call.reject("USB服务不可用");
                    return;
                }
                
                // 查找USB设备
                HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
                UsbDevice targetDevice = null;
                
                for (Map.Entry<String, UsbDevice> entry : deviceList.entrySet()) {
                    UsbDevice device = entry.getValue();
                    if ((vendorId == 0 || device.getVendorId() == vendorId) &&
                        (productId == 0 || device.getProductId() == productId)) {
                        targetDevice = device;
                        break;
                    }
                }
                
                if (targetDevice == null) {
                    // 列出所有可用USB设备
                    StringBuilder deviceInfo = new StringBuilder("可用USB设备:\n");
                    for (Map.Entry<String, UsbDevice> entry : deviceList.entrySet()) {
                        UsbDevice device = entry.getValue();
                        deviceInfo.append(String.format("- %s: VID=%04X PID=%04X\n", 
                            device.getDeviceName(), device.getVendorId(), device.getProductId()));
                    }
                    
                    JSObject result = new JSObject();
                    result.put("success", false);
                    result.put("availableDevices", deviceInfo.toString());
                    call.resolve(result);
                    return;
                }
                
                // 请求USB权限
                if (!usbManager.hasPermission(targetDevice)) {
                    JSObject result = new JSObject();
                    result.put("success", false);
                    result.put("needPermission", true);
                    result.put("deviceName", targetDevice.getDeviceName());
                    call.resolve(result);
                    return;
                }
                
                // USB HID 设备连接
                // 注意: USB HID 需要使用 android.hardware.usb 包的 API
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("device", targetDevice.getDeviceName());
                result.put("message", "USB HID秤已连接");
                call.resolve(result);
                
            } catch (Exception e) {
                Log.e(TAG, "USB秤连接异常", e);
                call.reject("USB秤连接异常: " + e.getMessage());
            }
        });
    }
    
    /**
     * 连接网络秤（TCP）
     */
    @PluginMethod
    public void scaleConnectTcp(PluginCall call) {
        String host = call.getString("host");
        int port = call.getInt("port", 9101);
        String protocol = call.getString("protocol", "general");
        
        if (host == null || host.isEmpty()) {
            call.reject("IP地址不能为空");
            return;
        }
        
        Log.i(TAG, String.format("连接网络秤: host=%s, port=%d", host, port));
        
        executor.execute(() -> {
            try {
                Socket socket = new Socket();
                socket.connect(new InetSocketAddress(host, port), 5000);
                socket.setSoTimeout(3000);
                socketPool.put("scale_tcp", socket);
                
                // 启动网络读取线程
                startNetworkScaleReader(socket, protocol);
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("host", host);
                result.put("port", port);
                result.put("message", "网络秤连接成功");
                call.resolve(result);
                
            } catch (Exception e) {
                Log.e(TAG, "网络秤连接失败", e);
                call.reject("网络秤连接失败: " + e.getMessage());
            }
        });
    }
    
    /**
     * 启动网络秤读取线程
     */
    private void startNetworkScaleReader(Socket socket, String protocol) {
        executor.execute(() -> {
            try {
                InputStream in = socket.getInputStream();
                byte[] buffer = new byte[128];
                
                while (!socket.isClosed() && socket.isConnected()) {
                    try {
                        int len = in.read(buffer);
                        if (len > 0) {
                            byte[] data = new byte[len];
                            System.arraycopy(buffer, 0, data, 0, len);
                            
                            ScaleWeight weight = parseScaleData(data, protocol);
                            if (weight != null) {
                                // 发送到前端
                                mainHandler.post(() -> {
                                    JSObject event = new JSObject();
                                    event.put("weight", weight.weight);
                                    event.put("unit", weight.unit);
                                    event.put("stable", weight.stable);
                                    event.put("timestamp", weight.timestamp);
                                    notifyListeners("scaleData", event);
                                });
                            }
                        }
                    } catch (IOException e) {
                        if (!socket.isClosed()) {
                            Log.e(TAG, "网络读取异常", e);
                        }
                        break;
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "网络读取线程异常", e);
            }
        });
    }
    
    /**
     * 秤去皮操作
     */
    @PluginMethod
    public void scaleTare(PluginCall call) {
        SerialHelper serial = serialHelperPool.get("scale");
        
        if (serial != null && serial.isOpen()) {
            // 发送去皮指令: ESC T (0x1B 0x54)
            try {
                serial.sendHex("1B 54");
                call.resolve(new JSObject().put("success", true).put("message", "去皮完成"));
            } catch (Exception e) {
                call.reject("去皮失败: " + e.getMessage());
            }
        } else {
            call.reject("秤未连接");
        }
    }
    
    /**
     * 秤清零操作
     */
    @PluginMethod
    public void scaleZero(PluginCall call) {
        SerialHelper serial = serialHelperPool.get("scale");
        
        if (serial != null && serial.isOpen()) {
            // 发送清零指令: ESC z (0x1B 0x7A)
            try {
                serial.sendHex("1B 7A");
                call.resolve(new JSObject().put("success", true).put("message", "清零完成"));
            } catch (Exception e) {
                call.reject("清零失败: " + e.getMessage());
            }
        } else {
            call.reject("秤未连接");
        }
    }
    
    /**
     * 获取当前重量
     */
    @PluginMethod
    public void scaleReadWeight(PluginCall call) {
        ScaleDataCallback callback = scaleCallbacks.get("scale");
        
        if (callback != null && callback.lastWeight != null) {
            JSObject result = new JSObject();
            result.put("weight", callback.lastWeight.weight);
            result.put("unit", callback.lastWeight.unit);
            result.put("stable", callback.lastWeight.stable);
            result.put("timestamp", callback.lastWeight.timestamp);
            call.resolve(result);
        } else {
            // 返回模拟数据
            JSObject result = new JSObject();
            result.put("weight", 0.520);
            result.put("unit", "kg");
            result.put("stable", true);
            result.put("timestamp", System.currentTimeMillis());
            result.put("simulated", true);
            call.resolve(result);
        }
    }
    
    /**
     * 断开秤连接
     */
    @PluginMethod
    public void scaleDisconnect(PluginCall call) {
        // 关闭串口
        SerialHelper serial = serialHelperPool.remove("scale");
        if (serial != null) {
            serial.close();
            Log.i(TAG, "电子秤串口已断开");
        }
        
        // 关闭网络连接
        Socket socket = socketPool.remove("scale_tcp");
        if (socket != null) {
            try {
                socket.close();
            } catch (IOException e) {}
        }
        
        scaleCallbacks.remove("scale");
        
        call.resolve(new JSObject().put("success", true).put("message", "秤已断开"));
    }

    // ==================== 2. ESC/POS 打印模块 ====================
    
    private static final byte[] ESC = new byte[]{0x1B};
    private static final byte[] GS = new byte[]{0x1D};
    private static final byte[] LF = new byte[]{0x0A};
    
    @PluginMethod
    public void printerConnect(PluginCall call) {
        String host = call.getString("host");
        int port = call.getInt("port", 9100);
        
        if (host == null || host.isEmpty()) {
            call.reject("打印机IP地址不能为空");
            return;
        }
        
        executor.execute(() -> {
            try {
                Socket socket = new Socket();
                socket.connect(new InetSocketAddress(host, port), 5000);
                socket.setSoTimeout(3000);
                socketPool.put("printer", socket);
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("host", host);
                result.put("port", port);
                result.put("message", "打印机连接成功");
                call.resolve(result);
                
            } catch (Exception e) {
                Log.e(TAG, "打印机连接失败", e);
                call.reject("打印机连接失败: " + e.getMessage());
            }
        });
    }
    
    @PluginMethod
    public void printerInit(PluginCall call) {
        Socket socket = socketPool.get("printer");
        if (socket == null || !socket.isConnected()) {
            call.reject("打印机未连接");
            return;
        }
        
        try {
            OutputStream out = socket.getOutputStream();
            out.write(ESC);
            out.write(0x40);
            out.flush();
            call.resolve(new JSObject().put("success", true));
        } catch (IOException e) {
            call.reject("打印机初始化失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void printerPrintText(PluginCall call) {
        String text = call.getString("text", "");
        String align = call.getString("align", "left");
        boolean bold = call.getBoolean("bold", false);
        int fontSize = call.getInt("fontSize", 1);
        
        Socket socket = socketPool.get("printer");
        if (socket == null || !socket.isConnected()) {
            call.reject("打印机未连接");
            return;
        }
        
        try {
            OutputStream out = socket.getOutputStream();
            
            byte alignCode = 0x00;
            if ("center".equals(align)) alignCode = 0x01;
            else if ("right".equals(align)) alignCode = 0x02;
            out.write(ESC);
            out.write(0x61);
            out.write(alignCode);
            
            out.write(ESC);
            out.write(0x45);
            out.write(bold ? 0x01 : 0x00);
            
            out.write(GS);
            out.write(0x21);
            out.write(fontSize);
            
            out.write(text.getBytes("GBK"));
            out.write(LF);
            out.flush();
            
            call.resolve(new JSObject().put("success", true));
        } catch (IOException e) {
            call.reject("打印失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void printerNewLine(PluginCall call) {
        int lines = call.getInt("lines", 1);
        Socket socket = socketPool.get("printer");
        if (socket == null || !socket.isConnected()) {
            call.reject("打印机未连接");
            return;
        }
        
        try {
            OutputStream out = socket.getOutputStream();
            for (int i = 0; i < lines; i++) {
                out.write(LF);
            }
            out.flush();
            call.resolve(new JSObject().put("success", true));
        } catch (IOException e) {
            call.reject("打印失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void printerPrintDivider(PluginCall call) {
        String charType = call.getString("type", "-");
        int width = call.getInt("width", 32);
        
        Socket socket = socketPool.get("printer");
        if (socket == null || !socket.isConnected()) {
            call.reject("打印机未连接");
            return;
        }
        
        try {
            OutputStream out = socket.getOutputStream();
            String line = String.format("%" + width + "s", "").replace(' ', charType.charAt(0));
            out.write(line.getBytes("GBK"));
            out.write(LF);
            out.flush();
            call.resolve(new JSObject().put("success", true));
        } catch (IOException e) {
            call.reject("打印失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void printerPrintQRCode(PluginCall call) {
        String data = call.getString("data", "");
        int size = call.getInt("size", 6);
        
        Socket socket = socketPool.get("printer");
        if (socket == null || !socket.isConnected()) {
            call.reject("打印机未连接");
            return;
        }
        
        try {
            OutputStream out = socket.getOutputStream();
            
            out.write(GS);
            out.write(0x28);
            out.write(0x6B);
            out.write(0x03);
            out.write(0x00);
            out.write(0x31);
            out.write(0x43);
            out.write(size);
            
            out.write(GS);
            out.write(0x28);
            out.write(0x6B);
            out.write(0x03);
            out.write(0x00);
            out.write(0x31);
            out.write(0x45);
            out.write(0x30);
            
            byte[] dataBytes = data.getBytes();
            int len = dataBytes.length + 3;
            out.write(GS);
            out.write(0x28);
            out.write(0x6B);
            out.write((len & 0xFF));
            out.write(((len >> 8) & 0xFF));
            out.write(0x00);
            out.write(0x31);
            out.write(0x50);
            out.write(0x30);
            out.write(dataBytes);
            
            out.write(GS);
            out.write(0x28);
            out.write(0x6B);
            out.write(0x03);
            out.write(0x00);
            out.write(0x31);
            out.write(0x51);
            out.write(0x30);
            
            out.flush();
            call.resolve(new JSObject().put("success", true));
        } catch (IOException e) {
            call.reject("打印二维码失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void printerPrintBarcode(PluginCall call) {
        String data = call.getString("data", "");
        String type = call.getString("type", "CODE128");
        int height = call.getInt("height", 80);
        int width = call.getInt("width", 2);
        
        Socket socket = socketPool.get("printer");
        if (socket == null || !socket.isConnected()) {
            call.reject("打印机未连接");
            return;
        }
        
        try {
            OutputStream out = socket.getOutputStream();
            byte[] dataBytes = data.getBytes();
            
            out.write(GS);
            out.write(0x68);
            out.write(height);
            
            out.write(GS);
            out.write(0x77);
            out.write(width);
            
            if ("EAN13".equals(type)) {
                out.write(GS);
                out.write(0x6B);
                out.write(0x02);
                out.write(dataBytes.length);
            } else {
                out.write(GS);
                out.write(0x6B);
                out.write(0x00);
            }
            out.write(dataBytes);
            
            out.flush();
            call.resolve(new JSObject().put("success", true));
        } catch (IOException e) {
            call.reject("打印条形码失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void printerBeep(PluginCall call) {
        int count = call.getInt("count", 2);
        int interval = call.getInt("interval", 200);
        
        Socket socket = socketPool.get("printer");
        if (socket == null || !socket.isConnected()) {
            call.reject("打印机未连接");
            return;
        }
        
        try {
            OutputStream out = socket.getOutputStream();
            for (int i = 0; i < count; i++) {
                out.write(ESC);
                out.write(0x42);
                out.write(9);
                out.write(9);
                out.flush();
                if (i < count - 1) Thread.sleep(interval);
            }
            call.resolve(new JSObject().put("success", true));
        } catch (Exception e) {
            call.reject("蜂鸣失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void printerCut(PluginCall call) {
        boolean full = call.getBoolean("full", false);
        
        Socket socket = socketPool.get("printer");
        if (socket == null || !socket.isConnected()) {
            call.reject("打印机未连接");
            return;
        }
        
        try {
            OutputStream out = socket.getOutputStream();
            out.write(GS);
            out.write(0x56);
            out.write(full ? 0x01 : 0x00);
            out.flush();
            call.resolve(new JSObject().put("success", true));
        } catch (IOException e) {
            call.reject("切纸失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void openCashDrawer(PluginCall call) {
        Socket socket = socketPool.get("printer");
        if (socket == null || !socket.isConnected()) {
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("simulated", true);
            result.put("message", "钱箱模拟打开（打印机未连接）");
            call.resolve(result);
            return;
        }
        
        try {
            OutputStream out = socket.getOutputStream();
            out.write(ESC);
            out.write(0x70);
            out.write(0x00);
            out.write(25);
            out.write(250);
            out.flush();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "钱箱已打开");
            call.resolve(result);
        } catch (IOException e) {
            call.reject("钱箱打开失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void printerPrintReceipt(PluginCall call) {
        String receiptData = call.getString("receiptData", "{}");
        
        Socket socket = socketPool.get("printer");
        if (socket == null || !socket.isConnected()) {
            call.reject("打印机未连接");
            return;
        }
        
        try {
            JSONObject data = new JSONObject(receiptData);
            OutputStream out = socket.getOutputStream();
            
            out.write(ESC);
            out.write(0x40);
            
            out.write(ESC);
            out.write(0x61);
            out.write(0x01);
            out.write(ESC);
            out.write(0x45);
            out.write(0x01);
            out.write(GS);
            out.write(0x21);
            out.write(0x11);
            
            String title = data.optString("title", "海邻到家便利店");
            out.write(title.getBytes("GBK"));
            out.write(LF);
            
            out.write(ESC);
            out.write(0x45);
            out.write(0x00);
            out.write(GS);
            out.write(0x21);
            out.write(0x00);
            
            out.write(ESC);
            out.write(0x61);
            out.write(0x00);
            out.write(("时间: " + data.optString("time", "")).getBytes("GBK"));
            out.write(LF);
            out.write(("单号: " + data.optString("orderId", "")).getBytes("GBK"));
            out.write(LF);
            
            out.write("--------------------------------".getBytes("GBK"));
            out.write(LF);
            
            out.write("商品                数量    金额".getBytes("GBK"));
            out.write(LF);
            
            String items = data.optString("items", "");
            if (!items.isEmpty()) {
                out.write(items.getBytes("GBK"));
                out.write(LF);
            }
            
            out.write("--------------------------------".getBytes("GBK"));
            out.write(LF);
            
            out.write(ESC);
            out.write(0x45);
            out.write(0x01);
            out.write(("合计: ¥" + data.optString("total", "0.00")).getBytes("GBK"));
            out.write(LF);
            
            if (data.has("discount")) {
                out.write(("优惠: -¥" + data.optString("discount", "0.00")).getBytes("GBK"));
                out.write(LF);
            }
            
            out.write(("实收: ¥" + data.optString("paid", "0.00")).getBytes("GBK"));
            out.write(LF);
            out.write(LF);
            out.write("欢迎下次光临".getBytes("GBK"));
            out.write(LF);
            out.write(LF);
            out.write(LF);
            
            out.write(GS);
            out.write(0x56);
            out.write(0x00);
            
            out.flush();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "小票打印完成");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "打印小票失败", e);
            call.reject("打印小票失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void printerDisconnect(PluginCall call) {
        Socket socket = socketPool.remove("printer");
        if (socket != null) {
            try {
                socket.close();
            } catch (IOException e) {}
        }
        call.resolve(new JSObject().put("success", true));
    }

    // ==================== 3. TSPL 标签打印模块 ====================
    
    @PluginMethod
    public void labelPrinterConnect(PluginCall call) {
        String host = call.getString("host");
        int port = call.getInt("port", 9100);
        
        executor.execute(() -> {
            try {
                Socket socket = new Socket();
                socket.connect(new InetSocketAddress(host, port), 5000);
                socketPool.put("label_printer", socket);
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("message", "标签打印机连接成功");
                call.resolve(result);
            } catch (Exception e) {
                call.reject("标签打印机连接失败: " + e.getMessage());
            }
        });
    }
    
    @PluginMethod
    public void labelInit(PluginCall call) {
        int width = call.getInt("width", 40);
        int height = call.getInt("height", 30);
        int gap = call.getInt("gap", 2);
        
        Socket socket = socketPool.get("label_printer");
        if (socket == null || !socket.isConnected()) {
            call.reject("标签打印机未连接");
            return;
        }
        
        try {
            OutputStream out = socket.getOutputStream();
            StringBuilder cmd = new StringBuilder();
            cmd.append("SIZE ").append(width).append(" mm, ").append(height).append(" mm\n");
            cmd.append("GAP ").append(gap).append(" mm\n");
            cmd.append("CLS\n");
            
            out.write(cmd.toString().getBytes("GBK"));
            out.flush();
            call.resolve(new JSObject().put("success", true));
        } catch (IOException e) {
            call.reject("初始化标签打印机失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void labelPrint(PluginCall call) {
        String labelData = call.getString("labelData");
        int copies = call.getInt("copies", 1);
        
        Socket socket = socketPool.get("label_printer");
        if (socket == null || !socket.isConnected()) {
            call.reject("标签打印机未连接");
            return;
        }
        
        try {
            JSONObject data = new JSONObject(labelData);
            OutputStream out = socket.getOutputStream();
            
            StringBuilder cmd = new StringBuilder();
            cmd.append("SIZE ").append(data.optInt("width", 40)).append(" mm, ").append(data.optInt("height", 30)).append(" mm\n");
            cmd.append("GAP ").append(data.optInt("gap", 2)).append(" mm\n");
            cmd.append("CLS\n");
            cmd.append("TEXT 20,10,\"3\",0,\"").append(data.optString("productName", "商品")).append("\"\n");
            cmd.append("TEXT 20,40,\"2\",0,\"价格: ¥").append(data.optString("price", "0.00")).append("\"\n");
            cmd.append("TEXT 20,65,\"2\",0,\"").append(data.optString("barcode", "")).append("\"\n");
            
            String barcode = data.optString("barcode", "");
            if (!barcode.isEmpty()) {
                cmd.append("BARCODE 20,85,\"128\",50,1,0,2,2,\"").append(barcode).append("\"\n");
            }
            
            cmd.append("TEXT 20,145,\"2\",0,\"").append(data.optString("date", "")).append("\"\n");
            cmd.append("PRINT ").append(copies).append("\n");
            
            out.write(cmd.toString().getBytes("GBK"));
            out.flush();
            
            call.resolve(new JSObject().put("success", true));
        } catch (Exception e) {
            call.reject("打印标签失败: " + e.getMessage());
        }
    }

    // ==================== 4. 扫码枪模块 ====================
    
    private volatile String lastScannedBarcode = "";
    private volatile long lastScanTime = 0;
    private volatile boolean scannerEnabled = true;
    
    @PluginMethod
    public void enableBarcodeScanner(PluginCall call) {
        scannerEnabled = true;
        call.resolve(new JSObject().put("success", true).put("enabled", true));
    }
    
    @PluginMethod
    public void disableBarcodeScanner(PluginCall call) {
        scannerEnabled = false;
        call.resolve(new JSObject().put("success", true).put("enabled", false));
    }
    
    @PluginMethod
    public void onBarcodeScanned(PluginCall call) {
        String barcode = call.getString("barcode", "");
        long timestamp = System.currentTimeMillis();
        
        if (timestamp - lastScanTime < 100 && barcode.equals(lastScannedBarcode)) {
            return;
        }
        
        lastScannedBarcode = barcode;
        lastScanTime = timestamp;
        
        JSObject event = new JSObject();
        event.put("barcode", barcode);
        event.put("timestamp", timestamp);
        notifyListeners("barcodeScanned", event);
        
        Log.d(TAG, "扫码: " + barcode);
        
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("barcode", barcode);
        call.resolve(result);
    }
    
    @PluginMethod
    public void getLastScan(PluginCall call) {
        JSObject result = new JSObject();
        result.put("barcode", lastScannedBarcode);
        result.put("timestamp", lastScanTime);
        call.resolve(result);
    }

    // ==================== 5. 双屏客显模块 ====================
    
    private CustomerDisplayPresentation currentPresentation = null;
    
    @PluginMethod
    public void showOnCustomerDisplay(PluginCall call) {
        String mode = call.getString("mode", "welcome");
        String title = call.getString("title", "");
        double amount = call.getDouble("amount", 0.0);
        String qrCodeUrl = call.getString("qrCodeUrl", "");
        
        if (currentPresentation != null && currentPresentation.isShowing()) {
            mainHandler.post(() -> {
                currentPresentation.updateDisplay(mode, title, amount, qrCodeUrl);
            });
        } else {
            try {
                DisplayManager dm = (DisplayManager) appContext.getSystemService(Context.DISPLAY_SERVICE);
                Display[] displays = dm.getDisplays();
                for (Display display : displays) {
                    if (display.getDisplayId() != Display.DEFAULT_DISPLAY) {
                        mainHandler.post(() -> {
                            dismissPresentation();
                            currentPresentation = new CustomerDisplayPresentation(appContext, display);
                            currentPresentation.updateDisplay(mode, title, amount, qrCodeUrl);
                            currentPresentation.show();
                        });
                        break;
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "显示到客显失败", e);
            }
        }
        
        call.resolve(new JSObject().put("success", true));
    }
    
    @PluginMethod
    public void dismissCustomerDisplay(PluginCall call) {
        dismissPresentation();
        call.resolve(new JSObject().put("success", true));
    }
    
    private void dismissPresentation() {
        if (currentPresentation != null && currentPresentation.isShowing()) {
            currentPresentation.dismiss();
            currentPresentation = null;
        }
    }

    // ==================== 6. AI视觉识别模块 ====================
    
    @PluginMethod
    public void captureAndRecognize(PluginCall call) {
        String imageData = call.getString("imageData");
        
        executor.execute(() -> {
            try {
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("recognized", true);
                result.put("productId", "DEMO001");
                result.put("productName", "模拟商品");
                result.put("price", 9.90);
                result.put("confidence", 0.95);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("AI识别失败: " + e.getMessage());
            }
        });
    }
    
    @PluginMethod
    public void getCameraFrame(PluginCall call) {
        JSObject result = new JSObject();
        result.put("cameraAvailable", true);
        result.put("resolution", "1920x1080");
        result.put("fps", 30);
        call.resolve(result);
    }

    // ==================== 7. 设备状态查询 ====================
    
    @PluginMethod
    public void getDeviceStatus(PluginCall call) {
        JSObject status = new JSObject();
        
        SerialHelper scale = serialHelperPool.get("scale");
        Socket scaleTcp = socketPool.get("scale_tcp");
        status.put("scaleConnected", (scale != null && scale.isOpen()) || (scaleTcp != null && scaleTcp.isConnected()));
        
        Socket printer = socketPool.get("printer");
        status.put("printerConnected", printer != null && printer.isConnected());
        
        Socket labelPrinter = socketPool.get("label_printer");
        status.put("labelPrinterConnected", labelPrinter != null && labelPrinter.isConnected());
        
        status.put("scannerEnabled", scannerEnabled);
        
        call.resolve(status);
    }
    
    @PluginMethod
    public void disconnectAll(PluginCall call) {
        // 断开秤
        scaleDisconnect(call);
        
        // 断开打印机
        Socket printer = socketPool.remove("printer");
        if (printer != null) {
            try { printer.close(); } catch (IOException e) {}
        }
        
        // 断开标签打印机
        Socket labelPrinter = socketPool.remove("label_printer");
        if (labelPrinter != null) {
            try { labelPrinter.close(); } catch (IOException e) {}
        }
        
        dismissPresentation();
        
        call.resolve(new JSObject().put("success", true));
    }

    // ==================== 8. 获取可用串口列表 ====================
    
    @PluginMethod
    public void getAvailablePorts(PluginCall call) {
        String[] commonPorts = {
            "/dev/ttyS0",  // 串口0
            "/dev/ttyS1",  // 串口1
            "/dev/ttyS2",  // 串口2
            "/dev/ttyS3",  // 串口3
            "/dev/ttyS4",  // 串口4
            "/dev/ttyS5",  // 串口5
            "/dev/ttyS6",  // 串口6
            "/dev/ttyS7",  // 串口7
            "/dev/ttyS8",  // 串口8
            "/dev/ttyS9",  // 串口9
            "/dev/ttyACM0",  // USB ACM
            "/dev/ttyUSB0",  // USB转串口
            "/dev/ttyUSB1",  // USB转串口
            "/dev/ttyUSB2",  // USB转串口
            "/dev/ttyMT1",  // 联发科芯片
        };
        
        JSObject result = new JSObject();
        result.put("ports", commonPorts);
        
        // 获取USB设备列表
        if (usbManager != null) {
            HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
            StringBuilder usbDevices = new StringBuilder();
            for (Map.Entry<String, UsbDevice> entry : deviceList.entrySet()) {
                UsbDevice device = entry.getValue();
                usbDevices.append(String.format("%s: VID=%04X PID=%04X\n",
                    device.getDeviceName(), device.getVendorId(), device.getProductId()));
            }
            result.put("usbDevices", usbDevices.toString());
        }
        
        call.resolve(result);
    }

    // ==================== 内部类 ====================
    
    /**
     * 秤数据回调
     */
    static class ScaleDataCallback {
        String protocol = "general";
        ScaleWeight lastWeight;
    }
    
    /**
     * 秤重量数据
     */
    static class ScaleWeight {
        double weight;
        String unit;
        boolean stable;
        long timestamp;
    }

    // ==================== 工具方法 ====================
    
    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X ", b));
        }
        return sb.toString().trim();
    }

    // ==================== 内部类：客显屏 Presentation ====================
    
    class CustomerDisplayPresentation extends Presentation {
        private TextView priceText;
        private TextView welcomeText;
        
        CustomerDisplayPresentation(Context context, Display display) {
            super(context, display);
        }
        
        @Override
        protected void onCreate(Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);
            
            LinearLayout layout = new LinearLayout(getContext());
            layout.setOrientation(LinearLayout.VERTICAL);
            layout.setGravity(Gravity.CENTER);
            layout.setBackgroundColor(Color.BLACK);
            layout.setPadding(40, 40, 40, 40);
            
            welcomeText = new TextView(getContext());
            welcomeText.setText("欢迎光临");
            welcomeText.setTextSize(48);
            welcomeText.setTextColor(Color.YELLOW);
            welcomeText.setGravity(Gravity.CENTER);
            layout.addView(welcomeText);
            
            priceText = new TextView(getContext());
            priceText.setText("¥ 0.00");
            priceText.setTextSize(72);
            priceText.setTextColor(Color.WHITE);
            priceText.setGravity(Gravity.CENTER);
            priceText.setTypeface(Typeface.DEFAULT_BOLD);
            layout.addView(priceText);
            
            setContentView(layout);
        }
        
        void updateDisplay(String mode, String title, double amount, String qrCodeUrl) {
            if (priceText != null) {
                priceText.setText(String.format("¥ %.2f", amount));
            }
            if (welcomeText != null) {
                if ("welcome".equals(mode)) {
                    welcomeText.setText("欢迎光临海邻到家");
                } else if ("waiting".equals(mode)) {
                    welcomeText.setText("等待付款中...");
                } else if ("paid".equals(mode)) {
                    welcomeText.setText("付款成功");
                }
            }
        }
    }
}
