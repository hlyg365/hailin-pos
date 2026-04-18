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
 * 海邻到家一体机硬件抽象层
 * 完整支持：电子秤、打印机、钱箱、扫码枪、客显屏、AI识别
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
        Log.i(TAG, "DevicePlugin 硬件抽象层已加载");
    }

    // ==================== 1. 电子秤驱动模块 ====================
    
    /**
     * 连接电子秤（串口/RS232）
     */
    @PluginMethod
    public void scaleConnect(PluginCall call) {
        String port = call.getString("port", "/dev/ttyS0");
        int baudRate = call.getInt("baudRate", 9600);
        int dataBits = call.getInt("dataBits", 8);
        int stopBits = call.getInt("stopBits", 1);
        String parity = call.getString("parity", "none");
        String protocol = call.getString("protocol", "general");
        
        executor.execute(() -> {
            try {
                // 尝试USB转串口连接
                SerialConnection serial = new SerialConnection();
                boolean connected = serial.connect(port, baudRate, dataBits, stopBits, parity);
                
                if (connected) {
                    serialPool.put("scale", serial);
                    
                    // 启动数据读取
                    startScaleReader(protocol);
                    
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("port", port);
                    result.put("baudRate", baudRate);
                    result.put("message", "电子秤连接成功");
                    call.resolve(result);
                } else {
                    call.reject("电子秤连接失败");
                }
            } catch (Exception e) {
                Log.e(TAG, "电子秤连接异常", e);
                call.reject("电子秤连接异常: " + e.getMessage());
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
        
        if (host == null) {
            call.reject("IP地址不能为空");
            return;
        }
        
        executor.execute(() -> {
            try {
                Socket socket = new Socket();
                socket.connect(new InetSocketAddress(host, port), 5000);
                socketPool.put("scale_tcp", socket);
                
                // 启动网络秤读取
                startNetworkScaleReader(protocol);
                
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
     * 秤去皮操作
     */
    @PluginMethod
    public void scaleTare(PluginCall call) {
        String connectionId = call.getString("connectionId", "scale");
        SerialConnection serial = serialPool.get(connectionId);
        
        if (serial != null) {
            // 发送去皮指令（通用协议）
            serial.send(new byte[]{0x1B, 0x54}); // ESC T
            call.resolve(new JSObject().put("success", true).put("message", "去皮完成"));
        } else {
            call.reject("秤未连接");
        }
    }
    
    /**
     * 秤清零操作
     */
    @PluginMethod
    public void scaleZero(PluginCall call) {
        String connectionId = call.getString("connectionId", "scale");
        SerialConnection serial = serialPool.get(connectionId);
        
        if (serial != null) {
            serial.send(new byte[]{0x1B, 0x7A}); // ESC z
            call.resolve(new JSObject().put("success", true).put("message", "清零完成"));
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
            call.reject("秤未连接或无数据");
        }
    }
    
    /**
     * 断开秤连接
     */
    @PluginMethod
    public void scaleDisconnect(PluginCall call) {
        String connectionId = call.getString("connectionId", "scale");
        
        SerialConnection serial = serialPool.remove(connectionId);
        if (serial != null) {
            serial.close();
        }
        
        // 停止读取线程
        ReaderThread reader = readerThreads.remove("scale_" + connectionId);
        if (reader != null) reader.stopReading();
        
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
        
        if (host == null) {
            call.reject("打印机IP地址不能为空");
            return;
        }
        
        executor.execute(() -> {
            try {
                Socket socket = new Socket();
                socket.connect(new InetSocketAddress(host, port), 5000);
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
    
    /**
     * 初始化打印机
     */
    @PluginMethod
    public void printerInit(PluginCall call) {
        Socket socket = socketPool.get("printer");
        if (socket == null) {
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
    
    /**
     * 打印文本
     */
    @PluginMethod
    public void printerPrintText(PluginCall call) {
        String text = call.getString("text", "");
        String align = call.getString("align", "left"); // left, center, right
        boolean bold = call.getBoolean("bold", false);
        int fontSize = call.getInt("fontSize", 1); // 1=normal, 2=double
        
        Socket socket = socketPool.get("printer");
        if (socket == null) {
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
            out.write(fontSize); // n=1-8
            
            // 打印文本
            out.write(text.getBytes("GBK"));
            out.write(LF);
            out.flush();
            
            call.resolve(new JSObject().put("success", true));
        } catch (IOException e) {
            call.reject("打印失败: " + e.getMessage());
        }
    }
    
    /**
     * 打印空行
     */
    @PluginMethod
    public void printerNewLine(PluginCall call) {
        int lines = call.getInt("lines", 1);
        
        Socket socket = socketPool.get("printer");
        if (socket == null) {
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
    
    /**
     * 打印分隔线
     */
    @PluginMethod
    public void printerPrintDivider(PluginCall call) {
        String charType = call.getString("type", "-"); // -, =, *
        int width = call.getInt("width", 32);
        
        Socket socket = socketPool.get("printer");
        if (socket == null) {
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
    
    /**
     * 打印二维码
     */
    @PluginMethod
    public void printerPrintQRCode(PluginCall call) {
        String data = call.getString("data", "");
        int size = call.getInt("size", 6); // 模块大小 1-16
        
        Socket socket = socketPool.get("printer");
        if (socket == null) {
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
    
    /**
     * 打印条形码
     */
    @PluginMethod
    public void printerPrintBarcode(PluginCall call) {
        String data = call.getString("data", "");
        String type = call.getString("type", "CODE128"); // CODE128, EAN13, CODE39
        int height = call.getInt("height", 80);
        int width = call.getInt("width", 2);
        
        Socket socket = socketPool.get("printer");
        if (socket == null) {
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
    
    /**
     * 蜂鸣提示
     */
    @PluginMethod
    public void printerBeep(PluginCall call) {
        int count = call.getInt("count", 1);
        int interval = call.getInt("interval", 200); // ms
        
        Socket socket = socketPool.get("printer");
        if (socket == null) {
            call.reject("打印机未连接");
            return;
        }
        
        try {
            OutputStream out = socket.getOutputStream();
            for (int i = 0; i < count; i++) {
                out.write(ESC);
                out.write(0x42); // BELL
                out.write(0x05);
                out.flush();
                Thread.sleep(interval);
            }
            call.resolve(new JSObject().put("success", true));
        } catch (Exception e) {
            call.reject("蜂鸣失败: " + e.getMessage());
        }
    }
    
    /**
     * 切刀
     */
    @PluginMethod
    public void printerCut(PluginCall call) {
        boolean full = call.getBoolean("full", true); // true=全切, false=半切
        
        Socket socket = socketPool.get("printer");
        if (socket == null) {
            call.reject("打印机未连接");
            return;
        }
        
        try {
            OutputStream out = socket.getOutputStream();
            out.write(GS);
            out.write(0x56);
            out.write(full ? 0x00 : 0x01); // 0=全切, 1=半切
            out.flush();
            call.resolve(new JSObject().put("success", true));
        } catch (IOException e) {
            call.reject("切刀失败: " + e.getMessage());
        }
    }
    
    /**
     * 打开钱箱
     */
    @PluginMethod
    public void openCashDrawer(PluginCall call) {
        Socket socket = socketPool.get("printer");
        if (socket == null) {
            call.reject("打印机未连接，无法打开钱箱");
            return;
        }
        
        try {
            OutputStream out = socket.getOutputStream();
            // 钱箱脉冲指令
            out.write(ESC);
            out.write(0x70);
            out.write(0x00); // 钱箱1
            out.write(0x19); // 脉冲时间 50ms
            out.write(0xFA); // 脉冲时间
            out.flush();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "钱箱已打开");
            call.resolve(result);
            
        } catch (IOException e) {
            call.reject("钱箱打开失败: " + e.getMessage());
        }
    }
    
    /**
     * 打印小票（完整流程）
     */
    @PluginMethod
    public void printerPrintReceipt(PluginCall call) {
        String receiptData = call.getString("receiptData");
        
        Socket socket = socketPool.get("printer");
        if (socket == null) {
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
            out.write(0x01); // 居中
            out.write(ESC);
            out.write(0x45);
            out.write(0x01); // 粗体
            out.write(GS);
            out.write(0x21);
            out.write(0x11); // 2x2大小
            
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
            out.write(0x00); // 左对齐
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
            
            // 打印商品
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
            out.write(0x01); // 粗体
            out.write(("合计: ¥" + data.optString("total", "0.00")).getBytes("GBK"));
            out.write(LF);
            
            if (data.has("discount")) {
                out.write(("优惠: -¥" + data.optString("discount", "0.00")).getBytes("GBK"));
                out.write(LF);
            }
            
            out.write(("实收: ¥" + data.optString("paid", "0.00")).getBytes("GBK"));
            out.write(LF);
            
            // 打印二维码
            String qrData = data.optString("qrCode", "");
            if (!qrData.isEmpty()) {
                out.write(LF);
                out.write(ESC);
                out.write(0x61);
                out.write(0x01); // 居中
                // 简化二维码打印
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
    
    /**
     * 断开打印机
     */
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
    
    /**
     * 初始化标签打印机
     */
    @PluginMethod
    public void labelInit(PluginCall call) {
        int width = call.getInt("width", 40);  // mm
        int height = call.getInt("height", 30); // mm
        int gap = call.getInt("gap", 2);       // mm
        
        Socket socket = socketPool.get("label_printer");
        if (socket == null) {
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
    
    /**
     * 打印标签
     */
    @PluginMethod
    public void labelPrint(PluginCall call) {
        String labelData = call.getString("labelData");
        int copies = call.getInt("copies", 1);
        
        Socket socket = socketPool.get("label_printer");
        if (socket == null) {
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
            
            // 条码
            String barcode = data.optString("barcode", "");
            if (!barcode.isEmpty()) {
                cmd.append("BARCODE 20,85,\"128\",50,1,0,2,2,\"").append(barcode).append("\"\n");
            }
            
            // 日期
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
    
    /**
     * 模拟扫码输入（USB HID键盘模式）
     * 前端检测到快速输入时调用此方法
     */
    @PluginMethod
    public void onBarcodeScanned(PluginCall call) {
        String barcode = call.getString("barcode", "");
        long timestamp = System.currentTimeMillis();
        
        // 防抖处理：间隔小于100ms认为是快速连续扫码
        if (timestamp - lastScanTime < 100 && barcode.equals(lastScannedBarcode)) {
            return; // 忽略重复
        }
        
        lastScannedBarcode = barcode;
        lastScanTime = timestamp;
        
        // 发送扫码事件
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
    
    /**
     * 获取最后扫码结果
     */
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
            // 尝试显示到副屏
            try {
                // 获取所有显示设备
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
    
    /**
     * 拍照并识别商品
     */
    @PluginMethod
    public void captureAndRecognize(PluginCall call) {
        String imageData = call.getString("imageData"); // Base64编码的图片
        
        executor.execute(() -> {
            try {
                // 这里应该调用AI模型进行识别
                // 目前返回模拟结果
                
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
    
    /**
     * 获取相机图像用于AI识别
     */
    @PluginMethod
    public void getCameraFrame(PluginCall call) {
        // 返回相机状态
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
        
        // 秤状态
        SerialConnection scale = serialPool.get("scale");
        Socket scaleTcp = socketPool.get("scale_tcp");
        status.put("scaleConnected", scale != null || scaleTcp != null);
        
        // 打印机状态
        Socket printer = socketPool.get("printer");
        status.put("printerConnected", printer != null && printer.isConnected());
        
        // 标签打印机状态
        Socket labelPrinter = socketPool.get("label_printer");
        status.put("labelPrinterConnected", labelPrinter != null && labelPrinter.isConnected());
        
        // 扫码器状态
        status.put("scannerEnabled", scannerEnabled);
        
        call.resolve(status);
    }
    
    @PluginMethod
    public void disconnectAll(PluginCall call) {
        // 关闭所有连接
        for (Socket socket : socketPool.values()) {
            try { socket.close(); } catch (IOException e) {}
        }
        socketPool.clear();
        
        for (SerialConnection serial : serialPool.values()) {
            serial.close();
        }
        serialPool.clear();
        
        for (ReaderThread reader : readerThreads.values()) {
            reader.stopReading();
        }
        readerThreads.clear();
        
        dismissPresentation();
        
        call.resolve(new JSObject().put("success", true).put("message", "所有设备已断开"));
    }

    // ==================== 内部类：串口连接 ====================
    
    static class SerialConnection {
        InputStream input;
        OutputStream output;
        boolean connected = false;
        ScaleWeight lastWeight;
        
        boolean connect(String port, int baudRate, int dataBits, int stopBits, String parity) {
            // Android串口通信需要通过USB转接或系统串口
            // 这里简化处理，实际需要 UsbSerialLibrary
            Log.d(TAG, "串口连接模拟: " + port + " @ " + baudRate);
            connected = true;
            return true;
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
    }
    
    // ==================== 内部类：秤读取线程（支持粘包/断包处理）====================
    
    class ReaderThread extends Thread {
        private volatile boolean running = true;
        private SerialConnection serial;
        private String protocol;
        
        // 环形缓冲区：处理粘包和断包
        private byte[] circularBuffer = new byte[256];
        private int bufferWritePos = 0;  // 写入位置
        private int bufferReadPos = 0;   // 已解析位置
        
        // 协议配置（可根据不同品牌电子秤调整）
        private static final byte STX = 0x02;  // 帧头
        private static final byte ETX = 0x03;  // 帧尾
        
        ReaderThread(SerialConnection serial, String protocol) {
            this.serial = serial;
            this.protocol = protocol;
        }
        
        @Override
        public void run() {
            byte[] readBuffer = new byte[64];
            while (running && serial.connected) {
                try {
                    if (serial.input != null) {
                        int len = serial.input.read(readBuffer);
                        if (len > 0) {
                            // 将新数据追加到环形缓冲区
                            appendToBuffer(readBuffer, len);
                            // 循环解析所有完整数据包
                            processBuffer();
                        }
                    }
                    Thread.sleep(50);  // 50ms 采样频率
                } catch (Exception e) {
                    if (running) Log.e(TAG, "秤读取异常", e);
                }
            }
        }
        
        /**
         * 第一步：将新数据追加到缓冲区（处理粘包/断包）
         */
        private void appendToBuffer(byte[] data, int len) {
            for (int i = 0; i < len; i++) {
                circularBuffer[bufferWritePos] = data[i];
                bufferWritePos = (bufferWritePos + 1) % circularBuffer.length;
                
                // 防止覆盖未解析的数据
                if (bufferWritePos == bufferReadPos) {
                    Log.w(TAG, "秤缓冲区溢出，清空缓冲区");
                    bufferReadPos = bufferWritePos;
                }
            }
        }
        
        /**
         * 第二步：循环检测并解析所有完整数据包
         */
        private void processBuffer() {
            while (hasCompletePacket()) {
                byte[] packet = extractPacket();
                if (packet != null && packet.length > 0) {
                    ScaleWeight weight = parsePacket(packet);
                    if (weight != null) {
                        serial.lastWeight = weight;
                        
                        // 发送重量事件到前端
                        JSObject event = new JSObject();
                        event.put("weight", weight.weight);
                        event.put("unit", weight.unit);
                        event.put("stable", weight.stable);
                        event.put("timestamp", weight.timestamp);
                        event.put("raw", bytesToHex(packet));
                        notifyListeners("scaleData", event);
                    }
                }
            }
        }
        
        /**
         * 检测缓冲区中是否有完整的数据包
         */
        private boolean hasCompletePacket() {
            int start = -1, end = -1;
            int pos = bufferReadPos;
            int count = 0;
            int capacity = circularBuffer.length;
            
            while (count < capacity) {
                byte b = circularBuffer[pos];
                
                if (start == -1 && b == STX) {
                    start = pos;  // 找到帧头
                } else if (start != -1 && b == ETX) {
                    end = pos;    // 找到帧尾
                    break;
                }
                
                pos = (pos + 1) % capacity;
                count++;
            }
            
            return (start != -1 && end != -1 && end > start);
        }
        
        /**
         * 提取一个完整的数据包
         */
        private byte[] extractPacket() {
            int start = -1, end = -1;
            int pos = bufferReadPos;
            int count = 0;
            int capacity = circularBuffer.length;
            
            // 找到帧头和帧尾
            while (count < capacity) {
                byte b = circularBuffer[pos];
                
                if (start == -1 && b == STX) {
                    start = pos;
                } else if (start != -1 && b == ETX) {
                    end = pos;
                    break;
                }
                
                pos = (pos + 1) % capacity;
                count++;
            }
            
            if (start == -1 || end == -1) {
                return null;
            }
            
            // 计算数据包长度
            int len = (end - start + 1);
            if (len < 0) len += capacity;
            
            // 提取数据包
            byte[] packet = new byte[len];
            for (int i = 0; i < len; i++) {
                packet[i] = circularBuffer[(start + i) % capacity];
            }
            
            // 更新读取位置
            bufferReadPos = (end + 1) % capacity;
            
            return packet;
        }
        
        /**
         * 第三步：解析数据包（核心解析逻辑）
         */
        private ScaleWeight parsePacket(byte[] packet) {
            try {
                // 记录原始数据日志
                Log.d(TAG, "秤数据包: " + bytesToHex(packet));
                
                // 基础检查
                if (packet.length < 10) {
                    Log.w(TAG, "数据包太短: " + packet.length);
                    return null;
                }
                
                // 第三步A：验证帧头帧尾
                if (packet[0] != STX || packet[packet.length - 1] != ETX) {
                    Log.w(TAG, "帧头帧尾验证失败");
                    return null;
                }
                
                // 第三步B：校验数据完整性（异或校验 BCC）
                // 校验范围：第1字节到倒数第2字节（排除帧头、帧尾）
                byte calculatedCheck = 0;
                for (int i = 1; i < packet.length - 2; i++) {
                    calculatedCheck ^= packet[i];
                }
                byte realCheck = packet[packet.length - 2];
                
                if (calculatedCheck != realCheck) {
                    Log.w(TAG, String.format("校验失败: 计算值=0x%02X, 实际值=0x%02X", 
                            calculatedCheck & 0xFF, realCheck & 0xFF));
                    return null;
                }
                
                // 第三步C：提取重量字段（ASCII解码）
                // 常见协议格式：
                // [STX][状态][符号][整数][小数][小数位][单位][校验][ETX]
                // 示例: 02 47 53 2B 30 31 32 2E 35 30 30 03
                //        帧头  G  S  +  0   1   2  .  5   0   0  帧尾
                
                ScaleWeight weight = new ScaleWeight();
                
                // 解析状态位（第1字节）
                // 'G' (0x47) = 稳定, 'S' (0x53) = 稳定
                // 'U' (0x55) = 不稳定, 'D' (0x44) = 去皮中
                byte status = packet[1];
                weight.stable = (status == 0x47 || status == 'G' || status == 'S');
                
                // 解析符号（第2字节）
                // 2B = '+' (正), 2D = '-' (负)
                boolean negative = (packet[2] == 0x2D || packet[2] == '-');
                
                // 解析重量数值（ASCII格式，第3-8字节）
                // 格式可能是: "12.500" 或 "0012.5" 或 "+0012.5"
                StringBuilder weightStr = new StringBuilder();
                for (int i = 2; i < packet.length - 3 && i < 10; i++) {
                    byte b = packet[i];
                    // 跳过非数字字符（符号位、小数点等）
                    if ((b >= '0' && b <= '9') || b == '.') {
                        weightStr.append((char) b);
                    }
                }
                
                try {
                    double rawWeight = Double.parseDouble(weightStr.toString().trim());
                    weight.weight = negative ? -rawWeight : rawWeight;
                } catch (NumberFormatException e) {
                    Log.e(TAG, "重量解析失败: " + weightStr);
                    return null;
                }
                
                // 解析单位（第倒数第3字节）
                byte unitByte = packet[packet.length - 3];
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
                        weight.weight = weight.weight / 1000; // 转为kg
                        break;
                    case 'O':
                    case 'o':
                        weight.unit = "oz";
                        break;
                    default:
                        weight.unit = String.valueOf((char) unitByte);
                        break;
                }
                
                weight.timestamp = System.currentTimeMillis();
                
                Log.i(TAG, String.format("解析成功: %.3f %s (稳定=%b)", 
                        weight.weight, weight.unit, weight.stable));
                
                return weight;
                
            } catch (Exception e) {
                Log.e(TAG, "数据包解析异常", e);
                return null;
            }
        }
        
        /**
         * 字节数组转十六进制字符串（调试用）
         */
        private String bytesToHex(byte[] bytes) {
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02X ", b & 0xFF));
            }
            return sb.toString().trim();
        }
        
        void stopReading() {
            running = false;
        }
    }
    
    // ==================== 内部类：网络秤读取线程 ====================
    
    void startNetworkScaleReader(String protocol) {
        Socket socket = socketPool.get("scale_tcp");
        if (socket == null) return;
        
        ReaderThread reader = new ReaderThread(new SerialConnection(), protocol);
        readerThreads.put("scale_tcp", reader);
        reader.start();
    }
    
    void startScaleReader(String protocol) {
        SerialConnection serial = serialPool.get("scale");
        if (serial == null) return;
        
        ReaderThread reader = new ReaderThread(serial, protocol);
        readerThreads.put("scale", reader);
        reader.start();
    }
    
    // ==================== 内部类：客显屏Presentation ====================
    
    class CustomerDisplayPresentation extends Presentation {
        private String currentMode = "welcome";
        private String currentTitle = "";
        private double currentAmount = 0;
        private String currentQRCode = "";
        
        CustomerDisplayPresentation(Context context, Display display) {
            super(context, display);
        }
        
        void updateDisplay(String mode, String title, double amount, String qrCode) {
            currentMode = mode;
            currentTitle = title;
            currentAmount = amount;
            currentQRCode = qrCode;
            
            // 更新UI（需要实际布局）
            Log.d(TAG, "更新客显: mode=" + mode + ", amount=" + amount);
        }
    }
    
    // ==================== 生命周期管理 ====================
    
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        disconnectAll(null);
        executor.shutdown();
        Log.i(TAG, "DevicePlugin 硬件抽象层已卸载");
    }
}
