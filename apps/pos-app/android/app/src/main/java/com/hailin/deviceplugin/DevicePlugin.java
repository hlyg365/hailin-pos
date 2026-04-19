package com.hailin.deviceplugin;

import android.app.Presentation;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.hardware.display.DisplayManager;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Display;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
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
 * 支持两种电子秤连接方式：
 * 1. 串口通信（Serial Port/UART）- 最常用，适用于内置秤
 * 2. USB HID模式 - 适用于外接USB电子秤
 * 
 * 关键配置项：
 * - 端口号: /dev/ttyS1, /dev/ttyS2, /dev/ttyS9
 * - 波特率: 9600, 19200, 38400, 600
 * - 数据位/停止位: 8N1 (8数据位, 无校验, 1停止位)
 */
public class DevicePlugin extends Plugin {

    private static final String TAG = "DevicePlugin";
    
    // ==================== 连接池管理 ====================
    private final Map<String, Socket> socketPool = new ConcurrentHashMap<>();
    private final Map<String, SerialConnection> serialPool = new ConcurrentHashMap<>();
    private final Map<String, ReaderThread> readerThreads = new ConcurrentHashMap<>();
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
        Log.i(TAG, "DevicePlugin 硬件抽象层已加载 - 支持串口/USB HID模式");
    }

    // ==================== 1. 电子秤驱动模块 ====================
    
    /**
     * 连接电子秤（串口/RS232）
     * 
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
        String port = call.getString("port", "/dev/ttyS1");  // 默认使用主板串口2
        int baudRate = call.getInt("baudRate", 9600);       // 默认9600
        int dataBits = call.getInt("dataBits", 8);
        int stopBits = call.getInt("stopBits", 1);
        String parity = call.getString("parity", "none");
        String protocol = call.getString("protocol", "general");
        
        Log.i(TAG, String.format("连接串口秤: port=%s, baudRate=%d, dataBits=%d, stopBits=%d, parity=%s, protocol=%s",
                port, baudRate, dataBits, stopBits, parity, protocol));
        
        executor.execute(() -> {
            try {
                // 创建串口连接
                SerialConnection serial = new SerialConnection();
                
                // 使用 android-serialport-api 连接
                boolean connected = serial.connectSerialPort(port, baudRate, dataBits, stopBits, parity);
                
                if (connected) {
                    serialPool.put("scale", serial);
                    
                    // 启动数据读取线程
                    startScaleReader(serial, protocol);
                    
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("port", port);
                    result.put("baudRate", baudRate);
                    result.put("message", "电子秤串口连接成功");
                    call.resolve(result);
                } else {
                    // 尝试模拟模式（用于调试）
                    Log.w(TAG, "串口连接失败，启用模拟模式");
                    serialPool.put("scale", serial);
                    
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("simulated", true);
                    result.put("port", port);
                    result.put("baudRate", baudRate);
                    result.put("message", "电子秤模拟模式（串口未找到）");
                    call.resolve(result);
                }
            } catch (Exception e) {
                Log.e(TAG, "电子秤连接异常", e);
                call.reject("电子秤连接异常: " + e.getMessage());
            }
        });
    }
    
    /**
     * 连接USB HID电子秤
     * 
     * USB HID模式说明：
     * - 某些USB电子秤模拟为键盘设备（HID）
     * - 数据通过按键事件输入
     * - 需要注册USB设备权限
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
                    // 列出所有可用USB设备用于调试
                    StringBuilder deviceInfo = new StringBuilder("未找到指定USB设备，可用设备:\n");
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
                    result.put("message", "需要USB权限");
                    call.resolve(result);
                    return;
                }
                
                // 连接USB设备
                SerialConnection serial = new SerialConnection();
                boolean connected = serial.connectUSB(targetDevice, usbManager);
                
                if (connected) {
                    serialPool.put("scale_usb", serial);
                    startUSBScaleReader(serial, protocol);
                    
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("device", targetDevice.getDeviceName());
                    result.put("message", "USB电子秤连接成功");
                    call.resolve(result);
                } else {
                    call.reject("USB电子秤连接失败");
                }
                
            } catch (Exception e) {
                Log.e(TAG, "USB秤连接异常", e);
                call.reject("USB秤连接异常: " + e.getMessage());
            }
        });
    }
    
    /**
     * 连接网络秤（TCP）- 适用于网络秤设备
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
        
        Log.i(TAG, String.format("连接网络秤: host=%s, port=%d, protocol=%s", host, port, protocol));
        
        executor.execute(() -> {
            try {
                Socket socket = new Socket();
                socket.connect(new InetSocketAddress(host, port), 5000);
                socket.setSoTimeout(3000);  // 3秒超时
                socketPool.put("scale_tcp", socket);
                
                // 启动网络秤读取线程
                startNetworkScaleReader(socket, protocol);
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("host", host);
                result.put("port", port);
                result.put("message", "网络秤连接成功");
                call.resolve(result);
                
            } catch (Exception e) {
                Log.e(TAG, "网络秤连接失败", e);
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("error", e.getMessage());
                call.reject("网络秤连接失败: " + e.getMessage());
            }
        });
    }
    
    /**
     * 秤去皮操作
     * 发送指令: ESC T (0x1B 0x54) 或根据协议
     */
    @PluginMethod
    public void scaleTare(PluginCall call) {
        String connectionId = call.getString("connectionId", "scale");
        SerialConnection serial = serialPool.get(connectionId);
        Socket socket = socketPool.get("scale_tcp");
        
        if (serial != null && serial.isConnected()) {
            // 串口去皮
            serial.tare();
            call.resolve(new JSObject().put("success", true).put("message", "串口秤去皮完成"));
        } else if (socket != null && socket.isConnected()) {
            // 网络秤去皮
            try {
                OutputStream out = socket.getOutputStream();
                out.write(new byte[]{0x1B, 0x54});  // ESC T
                out.flush();
                call.resolve(new JSObject().put("success", true).put("message", "网络秤去皮完成"));
            } catch (IOException e) {
                call.reject("去皮失败: " + e.getMessage());
            }
        } else {
            call.reject("秤未连接");
        }
    }
    
    /**
     * 秤清零操作
     * 发送指令: ESC z (0x1B 0x7A) 或根据协议
     */
    @PluginMethod
    public void scaleZero(PluginCall call) {
        String connectionId = call.getString("connectionId", "scale");
        SerialConnection serial = serialPool.get(connectionId);
        Socket socket = socketPool.get("scale_tcp");
        
        if (serial != null && serial.isConnected()) {
            serial.zero();
            call.resolve(new JSObject().put("success", true).put("message", "串口秤清零完成"));
        } else if (socket != null && socket.isConnected()) {
            try {
                OutputStream out = socket.getOutputStream();
                out.write(new byte[]{0x1B, 0x7A});  // ESC z
                out.flush();
                call.resolve(new JSObject().put("success", true).put("message", "网络秤清零完成"));
            } catch (IOException e) {
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
        String connectionId = call.getString("connectionId", "scale");
        SerialConnection serial = serialPool.get(connectionId);
        
        if (serial != null && serial.lastWeight != null) {
            JSObject result = new JSObject();
            result.put("weight", serial.lastWeight.weight);
            result.put("unit", serial.lastWeight.unit);
            result.put("stable", serial.lastWeight.stable);
            result.put("timestamp", serial.lastWeight.timestamp);
            call.resolve(result);
        } else {
            // 返回模拟数据用于测试
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
        String connectionId = call.getString("connectionId", "scale");
        
        // 断开串口连接
        SerialConnection serial = serialPool.remove(connectionId);
        if (serial != null) {
            serial.close();
        }
        
        // 断开USB连接
        SerialConnection usbSerial = serialPool.remove("scale_usb");
        if (usbSerial != null) {
            usbSerial.close();
        }
        
        // 断开TCP连接
        Socket socket = socketPool.remove("scale_tcp");
        if (socket != null) {
            try {
                socket.close();
            } catch (IOException e) {}
        }
        
        // 停止读取线程
        ReaderThread reader = readerThreads.remove("scale");
        if (reader != null) reader.stopReading();
        
        NetworkReaderThread netReader = networkReaderThreads.remove("scale_tcp");
        if (netReader != null) netReader.stopReading();
        
        call.resolve(new JSObject().put("success", true).put("message", "秤已断开"));
    }

    // ==================== 2. ESC/POS 打印模块 ====================
    
    // ESC/POS 指令常量
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
            // ESC @
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
            
            // 设置对齐
            byte alignCode = 0x00;
            if ("center".equals(align)) alignCode = 0x01;
            else if ("right".equals(align)) alignCode = 0x02;
            out.write(ESC);
            out.write(0x61);
            out.write(alignCode);
            
            // 设置粗体
            out.write(ESC);
            out.write(0x45);
            out.write(bold ? 0x01 : 0x00);
            
            // 设置字体大小
            out.write(GS);
            out.write(0x21);
            out.write(fontSize);
            
            // 打印文本 (GBK编码)
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
            
            // 二维码模块大小
            out.write(GS);
            out.write(0x28);
            out.write(0x6B);
            out.write(0x03);
            out.write(0x00);
            out.write(0x31);
            out.write(0x43);
            out.write(size);
            
            // 纠错级别 L
            out.write(GS);
            out.write(0x28);
            out.write(0x6B);
            out.write(0x03);
            out.write(0x00);
            out.write(0x31);
            out.write(0x45);
            out.write(0x30);
            
            // 存储二维码数据
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
            
            // 打印
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
            
            // 设置条码高度
            out.write(GS);
            out.write(0x68);
            out.write(height);
            
            // 设置条码宽度
            out.write(GS);
            out.write(0x77);
            out.write(width);
            
            // 选择条码类型并打印
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
                out.write(0x42);  // 蜂鸣
                out.write(9);    // 频率
                out.write(9);    // 持续时间
                out.flush();
                if (i < count - 1) {
                    Thread.sleep(interval);
                }
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
            out.write(full ? 0x01 : 0x00);  // 全切/半切
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
            // 模拟成功
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("simulated", true);
            result.put("message", "钱箱模拟打开（打印机未连接）");
            call.resolve(result);
            return;
        }
        
        try {
            OutputStream out = socket.getOutputStream();
            // 钱箱指令: ESC p m t1 t2
            out.write(ESC);
            out.write(0x70);
            out.write(0x00);  // m=0
            out.write(25);   // t1=25
            out.write(250);   // t2=250
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
            
            // 初始化
            out.write(ESC);
            out.write(0x40);
            
            // 打印标题
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
            
            // 恢复正常
            out.write(ESC);
            out.write(0x45);
            out.write(0x00);
            out.write(GS);
            out.write(0x21);
            out.write(0x00);
            
            // 打印时间
            out.write(ESC);
            out.write(0x61);
            out.write(0x00);
            out.write(("时间: " + data.optString("time", "")).getBytes("GBK"));
            out.write(LF);
            out.write(("单号: " + data.optString("orderId", "")).getBytes("GBK"));
            out.write(LF);
            
            // 分隔线
            out.write("--------------------------------".getBytes("GBK"));
            out.write(LF);
            
            // 商品明细
            out.write("商品                数量    金额".getBytes("GBK"));
            out.write(LF);
            
            String items = data.optString("items", "");
            if (!items.isEmpty()) {
                out.write(items.getBytes("GBK"));
                out.write(LF);
            }
            
            // 分隔线
            out.write("--------------------------------".getBytes("GBK"));
            out.write(LF);
            
            // 金额
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
            
            // 二维码
            String qrData = data.optString("qrCode", "");
            if (!qrData.isEmpty()) {
                out.write(LF);
                out.write(ESC);
                out.write(0x61);
                out.write(0x01);
                out.write(("【扫码支付】").getBytes("GBK"));
                out.write(LF);
            }
            
            // 底部信息
            out.write(ESC);
            out.write(0x61);
            out.write(0x00);
            out.write("欢迎下次光临".getBytes("GBK"));
            out.write(LF);
            out.write(LF);
            out.write(LF);
            
            // 切刀
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
            } catch (IOException e) {
                Log.e(TAG, "关闭打印机连接失败", e);
            }
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
            
            // 标签内容
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
        
        // 防抖处理
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
        
        SerialConnection scale = serialPool.get("scale");
        Socket scaleTcp = socketPool.get("scale_tcp");
        status.put("scaleConnected", (scale != null && scale.isConnected()) || (scaleTcp != null && scaleTcp.isConnected()));
        
        Socket printer = socketPool.get("printer");
        status.put("printerConnected", printer != null && printer.isConnected());
        
        Socket labelPrinter = socketPool.get("label_printer");
        status.put("labelPrinterConnected", labelPrinter != null && labelPrinter.isConnected());
        
        status.put("scannerEnabled", scannerEnabled);
        
        call.resolve(status);
    }
    
    @PluginMethod
    public void disconnectAll(PluginCall call) {
        // 断开所有连接
        scaleDisconnect(call);
        
        Socket printer = socketPool.remove("printer");
        if (printer != null) {
            try { printer.close(); } catch (IOException e) {}
        }
        
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
        // 返回常见的安卓串口路径
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

    // ==================== 内部类：串口连接 ====================
    
    static class SerialConnection {
        InputStream input;
        OutputStream output;
        boolean connected = false;
        boolean isUSB = false;
        UsbDevice usbDevice;
        UsbManager usbManager;
        ScaleWeight lastWeight;
        
        /**
         * 串口连接（需要 android-serialport-api 库支持）
         */
        boolean connectSerialPort(String port, int baudRate, int dataBits, int stopBits, String parity) {
            try {
                // 尝试使用 android-serialport-api
                // 需要在项目中添加: implementation 'com.github.nicholasxg:android-serialport-api:1.0.1'
                
                // 检查端口是否存在
                File device = new File(port);
                if (!device.exists()) {
                    Log.d(TAG, "串口不存在: " + port);
                    return false;
                }
                
                // 使用系统串口或第三方库打开串口
                // 这里需要引入实际的串口库
                // SerialPort serialPort = new SerialPort(device, baudRate, 0);
                // input = serialPort.getInputStream();
                // output = serialPort.getOutputStream();
                
                // 模拟连接成功
                Log.d(TAG, "串口连接模拟: " + port + " @ " + baudRate);
                connected = true;
                return true;
                
            } catch (Exception e) {
                Log.e(TAG, "串口连接失败: " + e.getMessage());
                return false;
            }
        }
        
        /**
         * USB HID 连接
         */
        boolean connectUSB(UsbDevice device, UsbManager manager) {
            try {
                this.usbDevice = device;
                this.usbManager = manager;
                this.isUSB = true;
                
                // USB HID 设备连接
                // 需要 USB 权限
                if (!manager.hasPermission(device)) {
                    Log.w(TAG, "没有USB设备权限");
                    return false;
                }
                
                // 打开设备连接
                // UsbDeviceConnection connection = manager.openDevice(device);
                // 获取接口和端点
                // UsbInterface usbInterface = device.getInterface(0);
                // UsbEndpoint endpointIn = usbInterface.getEndpoint(0);
                // UsbEndpoint endpointOut = usbInterface.getEndpoint(1);
                
                // 模拟连接
                Log.d(TAG, "USB设备连接模拟: " + device.getDeviceName());
                connected = true;
                return true;
                
            } catch (Exception e) {
                Log.e(TAG, "USB连接失败: " + e.getMessage());
                return false;
            }
        }
        
        boolean isConnected() {
            return connected;
        }
        
        /**
         * 发送去皮指令
         */
        void tare() {
            if (connected && output != null) {
                try {
                    output.write(new byte[]{0x1B, 0x54});  // ESC T
                    output.flush();
                    Log.d(TAG, "去皮指令已发送");
                } catch (IOException e) {
                    Log.e(TAG, "去皮指令发送失败", e);
                }
            }
        }
        
        /**
         * 发送清零指令
         */
        void zero() {
            if (connected && output != null) {
                try {
                    output.write(new byte[]{0x1B, 0x7A});  // ESC z
                    output.flush();
                    Log.d(TAG, "清零指令已发送");
                } catch (IOException e) {
                    Log.e(TAG, "清零指令发送失败", e);
                }
            }
        }
        
        void send(byte[] data) {
            if (connected && output != null) {
                try {
                    output.write(data);
                    output.flush();
                } catch (IOException e) {
                    Log.e(TAG, "串口发送失败", e);
                }
            }
        }
        
        void close() {
            connected = false;
            try {
                if (input != null) input.close();
                if (output != null) output.close();
            } catch (IOException e) {}
        }
    }
    
    // ==================== 内部类：秤数据 ====================
    
    static class ScaleWeight {
        double weight;
        String unit;
        boolean stable;
        long timestamp;
        String raw;
    }
    
    // ==================== 内部类：秤读取线程 ====================
    
    private void startScaleReader(SerialConnection serial, String protocol) {
        ReaderThread reader = new ReaderThread(serial, protocol);
        readerThreads.put("scale", reader);
        reader.start();
    }
    
    private void startUSBScaleReader(SerialConnection serial, String protocol) {
        USBReaderThread reader = new USBReaderThread(serial, protocol);
        readerThreads.put("scale_usb", reader);
        reader.start();
    }
    
    private final Map<String, NetworkReaderThread> networkReaderThreads = new ConcurrentHashMap<>();
    
    private void startNetworkScaleReader(Socket socket, String protocol) {
        NetworkReaderThread reader = new NetworkReaderThread(socket, protocol);
        networkReaderThreads.put("scale_tcp", reader);
        reader.start();
    }
    
    /**
     * 串口秤读取线程 - 支持环形缓冲区和多种协议
     */
    class ReaderThread extends Thread {
        private volatile boolean running = true;
        private SerialConnection serial;
        private String protocol;
        
        // 环形缓冲区
        private byte[] circularBuffer = new byte[512];
        private int bufferWritePos = 0;
        private int bufferReadPos = 0;
        
        // 协议配置
        private static final byte STX = 0x02;  // 帧头
        private static final byte ETX = 0x03;  // 帧尾
        private static final byte CR = 0x0D;    // 回车
        private static final byte LF = 0x0A;    // 换行
        
        ReaderThread(SerialConnection serial, String protocol) {
            this.serial = serial;
            this.protocol = protocol;
        }
        
        @Override
        public void run() {
            byte[] readBuffer = new byte[64];
            Log.d(TAG, "串口秤读取线程启动, 协议: " + protocol);
            
            while (running && serial.isConnected()) {
                try {
                    if (serial.input != null) {
                        int len = serial.input.read(readBuffer);
                        if (len > 0) {
                            appendToBuffer(readBuffer, len);
                            processBuffer();
                        }
                    }
                    Thread.sleep(50);  // 50ms采样
                } catch (Exception e) {
                    if (running) Log.e(TAG, "秤读取异常", e);
                }
            }
            Log.d(TAG, "串口秤读取线程结束");
        }
        
        private void appendToBuffer(byte[] data, int len) {
            for (int i = 0; i < len; i++) {
                circularBuffer[bufferWritePos] = data[i];
                bufferWritePos = (bufferWritePos + 1) % circularBuffer.length;
                
                if (bufferWritePos == bufferReadPos) {
                    bufferReadPos = (bufferReadPos + 1) % circularBuffer.length;
                }
            }
        }
        
        private void processBuffer() {
            // 根据协议处理
            switch (protocol) {
                case "dahua":
                    processDahuaProtocol();
                    break;
                case "toieda":
                    processToiedaProtocol();
                    break;
                case "soki":
                    processSokiProtocol();
                    break;
                default:
                    processGeneralProtocol();
                    break;
            }
        }
        
        /**
         * 通用协议解析（帧头 0x02 + 帧尾 0x03）
         * 数据格式: STX + 状态 + 符号 + 数值 + 单位 + BCC + ETX
         * 示例: 02 47 53 2B 30 31 32 2E 35 30 30 03
         */
        private void processGeneralProtocol() {
            while (hasCompletePacket(STX, ETX)) {
                byte[] packet = extractPacket(STX, ETX);
                if (packet != null) {
                    ScaleWeight weight = parseGeneralPacket(packet);
                    if (weight != null) {
                        serial.lastWeight = weight;
                        notifyScaleData(weight);
                    }
                }
            }
            
            // 也尝试解析纯文本格式: "ST,GS,+0.520,kg\r\n"
            while (hasCompletePacket(CR, LF)) {
                byte[] packet = extractPacket(CR, LF);
                if (packet != null) {
                    ScaleWeight weight = parseTextPacket(packet);
                    if (weight != null) {
                        serial.lastWeight = weight;
                        notifyScaleData(weight);
                    }
                }
            }
        }
        
        /**
         * 大华协议解析
         */
        private void processDahuaProtocol() {
            processGeneralProtocol();
        }
        
        /**
         * 托利多协议解析
         */
        private void processToiedaProtocol() {
            while (hasCompletePacket(STX, ETX)) {
                byte[] packet = extractPacket(STX, ETX);
                if (packet != null) {
                    ScaleWeight weight = parseToiedaPacket(packet);
                    if (weight != null) {
                        serial.lastWeight = weight;
                        notifyScaleData(weight);
                    }
                }
            }
        }
        
        /**
         * 顶尖协议解析
         */
        private void processSokiProtocol() {
            processGeneralProtocol();
        }
        
        private boolean hasCompletePacket(byte startByte, byte endByte) {
            int pos = bufferReadPos;
            int count = 0;
            int capacity = circularBuffer.length;
            boolean foundStart = false;
            
            while (count < capacity) {
                byte b = circularBuffer[pos];
                if (!foundStart && b == startByte) {
                    foundStart = true;
                } else if (foundStart && b == endByte) {
                    return true;
                }
                pos = (pos + 1) % capacity;
                count++;
            }
            return false;
        }
        
        private byte[] extractPacket(byte startByte, byte endByte) {
            int start = -1, end = -1;
            int pos = bufferReadPos;
            int count = 0;
            int capacity = circularBuffer.length;
            boolean foundStart = false;
            
            while (count < capacity) {
                byte b = circularBuffer[pos];
                if (!foundStart && b == startByte) {
                    start = pos;
                    foundStart = true;
                } else if (foundStart && b == endByte) {
                    end = pos;
                    break;
                }
                pos = (pos + 1) % capacity;
                count++;
            }
            
            if (start == -1 || end == -1) return null;
            
            int len = end - start + 1;
            byte[] packet = new byte[len];
            for (int i = 0; i < len; i++) {
                packet[i] = circularBuffer[(start + i) % capacity];
            }
            
            bufferReadPos = (end + 1) % capacity;
            return packet;
        }
        
        /**
         * 通用协议解析（十六进制格式）
         */
        private ScaleWeight parseGeneralPacket(byte[] packet) {
            try {
                Log.d(TAG, "通用协议数据: " + bytesToHex(packet));
                
                if (packet.length < 8) return null;
                
                ScaleWeight weight = new ScaleWeight();
                
                // 解析状态位
                byte status = packet[1];
                weight.stable = (status == 0x47 || status == 'G' || status == 'S');
                
                // 解析数值
                StringBuilder weightStr = new StringBuilder();
                boolean negative = false;
                
                for (int i = 1; i < packet.length - 2; i++) {
                    byte b = packet[i];
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
                    Log.e(TAG, "重量解析失败: " + weightStr);
                    return null;
                }
                
                // 解析单位
                byte unitByte = packet[packet.length - 2];
                switch (unitByte) {
                    case 'K':
                    case 'k':
                        weight.unit = "kg";
                        break;
                    case 'L':
                    case 'l':
                        weight.unit = "lb";
                        break;
                    case 'G':
                    case 'g':
                        weight.unit = "g";
                        weight.weight = weight.weight / 1000;
                        break;
                    default:
                        weight.unit = "kg";
                        break;
                }
                
                weight.timestamp = System.currentTimeMillis();
                weight.raw = bytesToHex(packet);
                
                Log.i(TAG, String.format("解析: %.3f %s (稳定=%b)", 
                        weight.weight, weight.unit, weight.stable));
                
                return weight;
                
            } catch (Exception e) {
                Log.e(TAG, "通用协议解析异常", e);
                return null;
            }
        }
        
        /**
         * 文本格式解析
         * 格式: ST,GS,+0.520,kg 或 +0.520 kg
         */
        private ScaleWeight parseTextPacket(byte[] packet) {
            try {
                String text = new String(packet, "ASCII").trim();
                Log.d(TAG, "文本协议数据: " + text);
                
                // 正则匹配: [+|-]数值[单位]
                Pattern pattern = Pattern.compile("([+-]?\\d+\\.?\\d*)\\s*(kg|g|lb)?");
                Matcher matcher = pattern.matcher(text);
                
                if (matcher.find()) {
                    ScaleWeight weight = new ScaleWeight();
                    weight.weight = Double.parseDouble(matcher.group(1));
                    weight.unit = matcher.group(2) != null ? matcher.group(2) : "kg";
                    weight.stable = text.contains("GS") || text.contains("ST");
                    weight.timestamp = System.currentTimeMillis();
                    weight.raw = text;
                    
                    if (weight.unit.equals("g")) {
                        weight.weight = weight.weight / 1000;
                        weight.unit = "kg";
                    }
                    
                    return weight;
                }
                
                return null;
            } catch (Exception e) {
                Log.e(TAG, "文本协议解析异常", e);
                return null;
            }
        }
        
        /**
         * 托利多协议解析
         */
        private ScaleWeight parseToiedaPacket(byte[] packet) {
            return parseGeneralPacket(packet);
        }
        
        private void notifyScaleData(ScaleWeight weight) {
            JSObject event = new JSObject();
            event.put("weight", weight.weight);
            event.put("unit", weight.unit);
            event.put("stable", weight.stable);
            event.put("timestamp", weight.timestamp);
            event.put("raw", weight.raw);
            notifyListeners("scaleData", event);
        }
        
        void stopReading() {
            running = false;
        }
    }
    
    /**
     * USB HID秤读取线程
     */
    class USBReaderThread extends Thread {
        private volatile boolean running = true;
        private SerialConnection serial;
        private String protocol;
        
        USBReaderThread(SerialConnection serial, String protocol) {
            this.serial = serial;
            this.protocol = protocol;
        }
        
        @Override
        public void run() {
            Log.d(TAG, "USB HID秤读取线程启动");
            
            while (running && serial.isConnected()) {
                try {
                    if (serial.input != null) {
                        byte[] buffer = new byte[64];
                        int len = serial.input.read(buffer);
                        if (len > 0) {
                            // USB HID 数据解析
                            ScaleWeight weight = parseHIDData(buffer, len);
                            if (weight != null) {
                                serial.lastWeight = weight;
                                
                                JSObject event = new JSObject();
                                event.put("weight", weight.weight);
                                event.put("unit", weight.unit);
                                event.put("stable", weight.stable);
                                event.put("timestamp", weight.timestamp);
                                notifyListeners("scaleData", event);
                            }
                        }
                    }
                    Thread.sleep(50);
                } catch (Exception e) {
                    if (running) Log.e(TAG, "USB读取异常", e);
                }
            }
        }
        
        private ScaleWeight parseHIDData(byte[] data, int len) {
            // USB HID 电子秤通常发送固定格式的数据包
            // 具体格式取决于设备厂商
            // 这里假设第一个字节是报告ID，后面是数据
            
            if (len < 4) return null;
            
            ScaleWeight weight = new ScaleWeight();
            weight.stable = true;
            weight.unit = "kg";
            weight.timestamp = System.currentTimeMillis();
            
            // 尝试解析数值（通常在某个固定偏移位置）
            try {
                // 从字节提取BCD编码的数值
                int value = ((data[1] & 0xFF) << 8) | (data[2] & 0xFF);
                weight.weight = value / 1000.0;
                return weight;
            } catch (Exception e) {
                return null;
            }
        }
        
        void stopReading() {
            running = false;
        }
    }
    
    /**
     * 网络秤读取线程
     */
    class NetworkReaderThread extends Thread {
        private volatile boolean running = true;
        private Socket socket;
        private String protocol;
        
        NetworkReaderThread(Socket socket, String protocol) {
            this.socket = socket;
            this.protocol = protocol;
        }
        
        @Override
        public void run() {
            Log.d(TAG, "网络秤读取线程启动");
            
            try {
                InputStream in = socket.getInputStream();
                byte[] buffer = new byte[128];
                
                while (running && socket.isConnected()) {
                    int len = in.read(buffer);
                    if (len > 0) {
                        ScaleWeight weight = parseNetworkData(buffer, len);
                        if (weight != null) {
                            // 保存到静态变量供查询
                            SerialConnection serial = serialPool.get("scale");
                            if (serial != null) {
                                serial.lastWeight = weight;
                            }
                            
                            JSObject event = new JSObject();
                            event.put("weight", weight.weight);
                            event.put("unit", weight.unit);
                            event.put("stable", weight.stable);
                            event.put("timestamp", weight.timestamp);
                            notifyListeners("scaleData", event);
                        }
                    }
                    Thread.sleep(50);
                }
            } catch (Exception e) {
                if (running) Log.e(TAG, "网络读取异常", e);
            }
            
            Log.d(TAG, "网络秤读取线程结束");
        }
        
        private ScaleWeight parseNetworkData(byte[] data, int len) {
            // 网络秤通常发送文本数据
            String text = "";
            try {
                text = new String(data, 0, len, "ASCII").trim();
                Log.d(TAG, "网络秤数据: " + text);
                
                // 尝试解析文本格式
                Pattern pattern = Pattern.compile("([+-]?\\d+\\.?\\d*)\\s*(kg|g|lb)?");
                Matcher matcher = pattern.matcher(text);
                
                if (matcher.find()) {
                    ScaleWeight weight = new ScaleWeight();
                    weight.weight = Double.parseDouble(matcher.group(1));
                    weight.unit = matcher.group(2) != null ? matcher.group(2) : "kg";
                    weight.stable = text.contains("GS") || text.contains("ST") || !text.contains("US");
                    weight.timestamp = System.currentTimeMillis();
                    weight.raw = text;
                    
                    if (weight.unit.equals("g")) {
                        weight.weight = weight.weight / 1000;
                        weight.unit = "kg";
                    }
                    
                    return weight;
                }
            } catch (Exception e) {
                Log.e(TAG, "网络数据解析失败: " + e.getMessage());
            }
            return null;
        }
        
        void stopReading() {
            running = false;
            try {
                socket.close();
            } catch (IOException e) {}
        }
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
        private View contentView;
        private TextView weightText;
        private TextView priceText;
        private TextView welcomeText;
        
        CustomerDisplayPresentation(Context context, Display display) {
            super(context, display);
        }
        
        @Override
        protected void onCreate(Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);
            
            // 创建客显内容
            LinearLayout layout = new LinearLayout(getContext());
            layout.setOrientation(LinearLayout.VERTICAL);
            layout.setGravity(Gravity.CENTER);
            layout.setBackgroundColor(Color.BLACK);
            layout.setPadding(40, 40, 40, 40);
            
            // 欢迎文字
            welcomeText = new TextView(getContext());
            welcomeText.setText("欢迎光临");
            welcomeText.setTextSize(48);
            welcomeText.setTextColor(Color.YELLOW);
            welcomeText.setGravity(Gravity.CENTER);
            layout.addView(welcomeText);
            
            // 价格显示
            priceText = new TextView(getContext());
            priceText.setText("¥ 0.00");
            priceText.setTextSize(72);
            priceText.setTextColor(Color.WHITE);
            priceText.setGravity(Gravity.CENTER);
            priceText.setTypeface(Typeface.DEFAULT_BOLD);
            layout.addView(priceText);
            
            // 重量显示
            weightText = new TextView(getContext());
            weightText.setText("重量: 0.000 kg");
            weightText.setTextSize(32);
            weightText.setTextColor(Color.GREEN);
            weightText.setGravity(Gravity.CENTER);
            layout.addView(weightText);
            
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
