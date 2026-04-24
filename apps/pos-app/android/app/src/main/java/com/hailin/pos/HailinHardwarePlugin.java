package com.hailin.pos;

import android.app.Presentation;
import android.content.Context;
import android.content.res.Resources;
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
import android.view.Gravity;
import android.webkit.WebView;
import android.widget.Toast;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// USB Host API for USB Serial Communication
import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbRequest;
import android.os.Build;
import android.os.SystemClock;

import org.json.JSONArray;
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
@CapacitorPlugin(name = "HailinHardware")
public class HailinHardwarePlugin extends Plugin {

    private static final String TAG = "HailinHardware";
    
    // ==================== 连接池管理 ====================
    private final Map<String, Socket> socketPool = new ConcurrentHashMap<>();
    private final Map<String, SerialConnection> serialPool = new ConcurrentHashMap<>();
    private final Map<String, ReaderThread> readerThreads = new ConcurrentHashMap<>();
    private final ExecutorService executor = Executors.newFixedThreadPool(8);
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    
    // USB Serial
    private UsbManager usbManager;
    private DisplayManager displayManager;
    private Context appContext;
    
    // ==================== 插件初始化 ====================
    @Override
    public void load() {
        super.load();
        appContext = getContext();
        usbManager = (UsbManager) appContext.getSystemService(Context.USB_SERVICE);
        displayManager = (DisplayManager) appContext.getSystemService(Context.DISPLAY_SERVICE);
        Log.i(TAG, "HailinHardware 硬件抽象层已加载");
    }

    // ==================== 1. 电子秤驱动模块 ====================
    
    /**
     * 连接电子秤（串口/RS232）
     */
    @PluginMethod
    public void scaleConnect(PluginCall call) {
        String port = call.getString("port", "/dev/ttyS4");
        int baudRate = call.getInt("baudRate", 9600);  // 9600波特率
        int dataBits = call.getInt("dataBits", 8);
        int stopBits = call.getInt("stopBits", 1);
        String parity = call.getString("parity", "none");
        String protocol = call.getString("protocol", "soki");
        
        Log.i(TAG, "========================================");
        Log.i(TAG, "[秤] scaleConnect 开始");
        Log.i(TAG, "[秤] 参数: port=" + port + ", baudRate=" + baudRate);
        Log.i(TAG, "[秤] 参数: dataBits=" + dataBits + ", stopBits=" + stopBits + ", parity=" + parity);
        Log.i(TAG, "[秤] 参数: protocol=" + protocol);
        Log.i(TAG, "========================================");
        
        executor.execute(() -> {
            JSObject jsResult = new JSObject();
            
            try {
                // 首先检查设备是否存在
                File deviceFile = new File(port);
                Log.i(TAG, "[秤] 检查设备文件: " + port);
                Log.i(TAG, "[秤]   - 存在: " + deviceFile.exists());
                Log.i(TAG, "[秤]   - 可读: " + deviceFile.canRead());
                Log.i(TAG, "[秤]   - 可写: " + deviceFile.canWrite());
                
                // 列出所有tty设备帮助调试
                File devDir = new File("/dev");
                if (devDir.exists()) {
                    File[] files = devDir.listFiles();
                    if (files != null) {
                        StringBuilder allTty = new StringBuilder("[秤] /dev下所有tty设备:");
                        for (File f : files) {
                            if (f.getName().startsWith("tty")) {
                                allTty.append(" ").append(f.getName());
                            }
                        }
                        Log.i(TAG, allTty.toString());
                    }
                }
                
                // 首先断开已有连接，避免端口占用
                SerialConnection existingSerial = serialPool.remove("scale");
                if (existingSerial != null) {
                    Log.d(TAG, "[秤] 关闭已有串口连接");
                    existingSerial.close();
                }
                
                // 尝试USB转串口连接
                SerialConnection serial = new SerialConnection(appContext);
                SerialConnection.SerialConnectResult result = serial.connectWithDetail(port, baudRate, dataBits, stopBits, parity);
                
                Log.i(TAG, "[秤] connectWithDetail 结果: success=" + result.success + ", error=" + result.error);
                
                if (result.success) {
                    serialPool.put("scale", serial);
                    
                    // ====== 连接成功后发送初始化命令 ======
                    try {
                        Thread.sleep(20);
                        // 发送初始化命令到电子秤
                        if (serial.output != null) {
                            serial.output.write(new byte[]{0x05});  // ENQ唤醒
                            serial.output.flush();
                            Log.d(TAG, "[秤] 发送ENQ唤醒命令");
                            Thread.sleep(20);
                            serial.output.write(new byte[]{0x11});  // DC1初始化
                            serial.output.flush();
                            Log.d(TAG, "[秤] 发送DC1初始化命令");
                        }
                    } catch (Exception e) {
                        Log.w(TAG, "[秤] 初始化命令发送失败: " + e.getMessage());
                    }
                    
                    // 启动数据读取
                    startScaleReader(protocol);
                    
                    jsResult.put("success", true);
                    jsResult.put("port", port);
                    jsResult.put("baudRate", baudRate);
                    jsResult.put("message", "电子秤连接成功");
                    jsResult.put("info", result.message);
                    call.resolve(jsResult);
                } else {
                    jsResult.put("success", false);
                    jsResult.put("error", result.error);
                    jsResult.put("detail", result.message);
                    call.resolve(jsResult);
                }
            } catch (Exception e) {
                Log.e(TAG, "电子秤连接异常", e);
                jsResult = new JSObject();
                jsResult.put("success", false);
                jsResult.put("error", "电子秤连接异常: " + e.getMessage());
                call.resolve(jsResult);
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
        String protocol = call.getString("protocol", "soki");
        
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
     * 检测电子秤（通过尝试连接并读取数据验证）
     */
    @PluginMethod
    public void detectScale(PluginCall call) {
        String port = call.getString("port", "/dev/ttyS4");
        int baudRate = call.getInt("baudRate", 9600);  // 9600波特率
        
        executor.execute(() -> {
            SerialConnection serial = null;
            try {
                Log.i(TAG, "[秤] 检测电子秤: " + port + " @ " + baudRate);
                
                // 使用 SerialConnection 的详细连接方法
                serial = new SerialConnection(appContext);
                SerialConnection.SerialConnectResult connResult = serial.connectWithDetail(port, baudRate, 8, 1, "NONE");
                
                if (connResult.success) {
                    Log.i(TAG, "[秤] 检测成功，设备可访问");
                    
                    // 检测成功，但不要在这里持有连接，让scaleConnect来管理
                    serial.close();
                    serial = null;
                    
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("detected", true);
                    result.put("port", port);
                    result.put("baudRate", baudRate);
                    result.put("protocol", "soki");
                    result.put("deviceInfo", "顶尖OS2电子秤");
                    result.put("message", connResult.message);
                    call.resolve(result);
                    
                    Log.i(TAG, "[秤] 检测成功！");
                } else {
                    Log.w(TAG, "[秤] 检测失败: " + connResult.error);
                    
                    JSObject result = new JSObject();
                    result.put("success", false);
                    result.put("detected", false);
                    result.put("error", connResult.error);
                    result.put("detail", connResult.message);
                    call.resolve(result);
                }
            } catch (Exception e) {
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("detected", false);
                result.put("error", e.getMessage());
                call.resolve(result);
                
                Log.e(TAG, "[秤] 检测异常: " + e.getMessage());
            } finally {
                // 确保连接被关闭
                if (serial != null) {
                    serial.close();
                }
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

    // ==================== 枚举可用串口设备 ====================
    @PluginMethod
    public void listSerialPorts(PluginCall call) {
        Log.i(TAG, "[枚举串口] 开始枚举可用串口设备...");
        JSObject result = new JSObject();
        JSONArray ports = new JSONArray();
        
        try {
            // 串口设备目录
            File devDir = new File("/dev");
            
            // 首先检查目录是否存在
            Log.i(TAG, "[枚举串口] /dev 目录存在: " + devDir.exists());
            Log.i(TAG, "[枚举串口] /dev 是目录: " + devDir.isDirectory());
            Log.i(TAG, "[枚举串口] /dev 可读: " + devDir.canRead());
            
            if (!devDir.exists()) {
                result.put("success", false);
                result.put("error", "/dev 目录不存在");
                result.put("ports", ports);
                call.resolve(result);
                return;
            }
            
            File[] files = devDir.listFiles();
            if (files == null) {
                Log.w(TAG, "[枚举串口] listFiles() 返回 null，可能权限不足");
                result.put("success", false);
                result.put("error", "无法列出设备，可能是权限问题");
                result.put("ports", ports);
                result.put("hint", "请在设备设置中授权USB权限");
                call.resolve(result);
                return;
            }
            
            Log.i(TAG, "[枚举串口] 共发现 " + files.length + " 个文件/目录");
            
            for (File file : files) {
                String name = file.getName();
                // 匹配常见的串口设备名称
                if (name.startsWith("ttyS") || name.startsWith("ttyUSB") || 
                    name.startsWith("ttyACM") || name.startsWith("ttyAMA")) {
                    try {
                        JSONObject portInfo = new JSONObject();
                        portInfo.put("path", file.getAbsolutePath());
                        portInfo.put("name", name);
                        portInfo.put("readable", file.canRead());
                        portInfo.put("writable", file.canWrite());
                        ports.put(portInfo);
                        Log.i(TAG, "[枚举串口] 发现设备: " + file.getAbsolutePath() + 
                              " (r=" + file.canRead() + ", w=" + file.canWrite() + ")");
                    } catch (Exception e) {
                        Log.w(TAG, "[枚举串口] 读取设备信息失败: " + name);
                    }
                }
            }
            
            // 列出所有tty*设备（调试用）
            Log.i(TAG, "[枚举串口] 所有tty设备:");
            for (File file : files) {
                if (file.getName().startsWith("tty")) {
                    Log.i(TAG, "  " + file.getName() + " (r=" + file.canRead() + ", w=" + file.canWrite() + ")");
                }
            }
            
            result.put("success", true);
            result.put("ports", ports);
            result.put("count", ports.length());
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "[枚举串口] 失败: " + e.getMessage());
            e.printStackTrace();
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("ports", ports);
            call.resolve(result);
        }
    }

    // ==================== 2. ESC/POS 打印模块 ====================
    
    // ESC/POS 指令常量
    private static final byte[] ESC = new byte[]{0x1B};
    private static final byte GS = 0x1D;
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
        String type = call.getString("type", "CODE128");
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
            out.write(height & 0xFF);
            
            // 设置条码宽度
            out.write(GS);
            out.write(0x77);
            out.write(width & 0xFF);
            
            // 选择条码类型并打印
            byte[] cmd;
            if ("EAN13".equals(type)) {
                cmd = new byte[]{GS, 0x6B, 0x02, (byte)(dataBytes.length & 0xFF)};
            } else {
                cmd = new byte[]{GS, 0x6B, 0x00, 0x00};
            }
            out.write(cmd, 0, cmd.length);
            out.write(dataBytes, 0, dataBytes.length);
            
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
                Display[] displays = displayManager.getDisplays();
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
        Context context;  // 用于USB Host API
        
        // 波特率扫描相关
        String currentPort;
        int currentBaudRate;
        int baudRateIndex = 0;
        long lastBaudRateSwitchTime = 0;
        
        // 支持的波特率列表（顶尖OS2 - 9600优先）
        static final int[] BAUD_RATES = {9600, 19200, 38400, 57600, 115200, 4800, 2400};
        
        SerialConnection(Context ctx) {
            this.context = ctx;
        }
        
        // 尝试切换到下一个波特率
        boolean tryNextBaudRate() {
            if (currentPort == null) {
                Log.w(TAG, "[波特率扫描] currentPort为null，无法切换");
                return false;
            }
            
            Log.i(TAG, "[波特率扫描] 开始切换波特率...");
            
            // 关闭当前连接
            try {
                if (input != null) {
                    input.close();
                    input = null;
                }
                if (output != null) {
                    output.close();
                    output = null;
                }
                connected = false;
            } catch (Exception e) {
                Log.e(TAG, "[波特率扫描] 关闭连接失败: " + e.getMessage());
            }
            
            // 切换到下一个波特率
            baudRateIndex = (baudRateIndex + 1) % BAUD_RATES.length;
            currentBaudRate = BAUD_RATES[baudRateIndex];
            lastBaudRateSwitchTime = System.currentTimeMillis();
            
            Log.i(TAG, "[波特率扫描] >>> 切换到波特率: " + currentBaudRate);
            
            // 尝试设置波特率并重新连接
            boolean baudSet = setBaudRateAfterOpen(currentPort, currentBaudRate);
            if (baudSet) {
                Log.i(TAG, "[波特率扫描] stty设置波特率成功: " + currentBaudRate);
            } else {
                Log.w(TAG, "[波特率扫描] stty设置波特率失败，继续尝试");
            }
            
            // 重新打开设备
            try {
                File device = new File(currentPort);
                if (!device.exists()) {
                    Log.e(TAG, "[波特率扫描] 设备不存在: " + currentPort);
                    return false;
                }
                if (!device.canRead() || !device.canWrite()) {
                    Log.e(TAG, "[波特率扫描] 设备无权限");
                    return false;
                }
                
                input = new FileInputStream(device);
                output = new FileOutputStream(device);
                connected = true;
                
                Log.i(TAG, "[波特率扫描] 设备重新打开成功!");
                return true;
            } catch (Exception e) {
                Log.e(TAG, "[波特率扫描] 设备重新打开失败: " + e.getMessage());
                return false;
            }
        }
        
        // 串口连接详细结果
        static class SerialConnectResult {
            boolean success;
            String error;
            String message;
            SerialConnectResult(boolean success, String error, String message) {
                this.success = success;
                this.error = error;
                this.message = message;
            }
        }
        
        // 数据平滑和稳定检测
        static final int STABLE_COUNT = 3;  // 连续3次稳定才认为稳定
        static final double STABLE_THRESHOLD = 0.005;  // 5g 稳定阈值
        static final long STABLE_TIME_MS = 500;  // 500ms 内稳定
        
        double[] weightHistory = new double[STABLE_COUNT];
        int historyIndex = 0;
        int stableCount = 0;
        long lastStableTime = 0;
        boolean isStable = false;
        
        // 归零检测
        static final double ZERO_THRESHOLD = 0.005;  // 5g 以下认为是零
        long lastNonZeroTime = 0;
        
        void reset() {
            lastWeight = null;
            historyIndex = 0;
            stableCount = 0;
            isStable = false;
            lastStableTime = 0;
            lastNonZeroTime = 0;
            for (int i = 0; i < weightHistory.length; i++) {
                weightHistory[i] = 0;
            }
        }
        
        // 获取可用的tty设备列表
        private String getAvailableTtyDevices() {
            StringBuilder sb = new StringBuilder("可用设备: ");
            File devDir = new File("/dev");
            if (devDir.exists() && devDir.isDirectory()) {
                String[] devices = devDir.list();
                if (devices != null) {
                    for (String d : devices) {
                        if (d.startsWith("tty")) {
                            File f = new File("/dev/" + d);
                            String perm = (f.canRead() && f.canWrite()) ? "读写" : (f.canRead() ? "只读" : "无权限");
                            sb.append(d).append("(").append(perm).append("), ");
                        }
                    }
                }
            }
            return sb.toString();
        }
        
        // USB相关变量
        UsbDevice usbDevice = null;
        UsbDeviceConnection usbConnection = null;
        UsbInterface usbInterface = null;
        UsbEndpoint endpointIn = null;
        UsbEndpoint endpointOut = null;
        
        /**
         * 带详细信息的串口连接方法 - 使用USB Host API
         */
        SerialConnectResult connectWithDetail(String port, int baudRate, int dataBits, int stopBits, String parity) {
            Log.i(TAG, "[秤] connectWithDetail: port=" + port + ", baudRate=" + baudRate);
            
            // 关键判断：如果是主板串口(ttyS*)直接使用传统方式
            // 如果是USB转串口(ttyUSB*, ttyACM*)使用USB Host API
            boolean isUsbSerial = port.startsWith("/dev/ttyUSB") || port.startsWith("/dev/ttyACM");
            boolean isBoardSerial = port.startsWith("/dev/ttyS");
            
            Log.i(TAG, "[秤] 设备类型判断: isUsbSerial=" + isUsbSerial + ", isBoardSerial=" + isBoardSerial);
            
            if (isBoardSerial) {
                // 主板串口 - 使用传统方式（直接打开设备文件）
                Log.i(TAG, "[秤] 使用主板串口方式: " + port);
                return connectBoardSerial(port, baudRate, dataBits, stopBits, parity);
            }
            
            // USB转串口设备 - 先尝试预设置波特率
            Log.i(TAG, "[秤] 尝试预设置波特率: " + baudRate);
            boolean preBaudSet = setBaudRateBeforeOpen(port, baudRate);
            if (preBaudSet) {
                Log.i(TAG, "[秤] 预设置波特率成功!");
            } else {
                Log.w(TAG, "[秤] 预设置波特率失败，将继续尝试连接");
            }
            
            // 尝试USB Host API连接
            SerialConnectResult usbResult = tryUsbConnection(port, baudRate, dataBits, stopBits, parity);
            if (usbResult.success) {
                Log.i(TAG, "[秤] USB Host API连接成功");
                return usbResult;
            }
            
            // USB Host API失败，尝试传统方式
            Log.w(TAG, "[秤] USB Host API失败: " + usbResult.error + "，尝试传统方式...");
            return connectWithDetailLegacy(port, baudRate, dataBits, stopBits, parity);
        }
        
        // 主板串口连接（传统方式）
        private SerialConnectResult connectBoardSerial(String port, int baudRate, int dataBits, int stopBits, String parity) {
            Log.i(TAG, "[秤-主板串口] 开始连接: port=" + port + ", baudRate=" + baudRate);
            
            try {
                File device = new File(port);
                Log.i(TAG, "[秤-主板串口] 设备文件存在: " + device.exists());
                
                if (!device.exists()) {
                    Log.e(TAG, "[秤-主板串口] 设备不存在: " + port);
                    // 列出所有tty*设备帮助调试
                    File devDir = new File("/dev");
                    if (devDir.exists()) {
                        File[] files = devDir.listFiles();
                        if (files != null) {
                            StringBuilder allTty = new StringBuilder("[秤-主板串口] /dev下所有tty设备:");
                            for (File f : files) {
                                if (f.getName().startsWith("tty")) {
                                    allTty.append(" ").append(f.getName());
                                }
                            }
                            Log.i(TAG, allTty.toString());
                        }
                    }
                    return new SerialConnectResult(false, "串口设备不存在: " + port, "检查路径是否正确");
                }
                
                // 直接尝试打开设备文件（不依赖canRead/canWrite，因为它们可能返回false）
                Log.i(TAG, "[秤-主板串口] 尝试直接打开设备文件...");
                
                FileInputStream tempInput = new FileInputStream(device);
                Log.i(TAG, "[秤-主板串口] FileInputStream 打开成功");
                
                FileOutputStream tempOutput = new FileOutputStream(device);
                Log.i(TAG, "[秤-主板串口] FileOutputStream 打开成功");
                
                // 尝试设置波特率
                try {
                    Runtime.getRuntime().exec("stty -F " + port + " " + baudRate + " raw");
                    Log.i(TAG, "[秤-主板串口] stty设置波特率成功: " + baudRate);
                } catch (Exception e) {
                    Log.w(TAG, "[秤-主板串口] stty设置波特率失败: " + e.getMessage());
                    // 波特率设置失败不影响连接，使用默认波特率
                }
                
                // 保存连接
                this.input = tempInput;
                this.output = tempOutput;
                this.connected = true;
                this.currentPort = port;
                this.currentBaudRate = baudRate;
                
                Log.i(TAG, "[秤-主板串口] 连接成功！");
                return new SerialConnectResult(true, "连接成功", "主板串口 " + port);
                
            } catch (SecurityException e) {
                Log.e(TAG, "[秤-主板串口] 权限不足（SecurityException）: " + e.getMessage());
                return new SerialConnectResult(false, "权限不足，无法访问串口", "请在设置中授权USB权限或检查SELinux状态");
            } catch (Exception e) {
                Log.e(TAG, "[秤-主板串口] 连接失败: " + e.getMessage());
                return new SerialConnectResult(false, "连接失败: " + e.getMessage(), e.toString());
            }
        }
        
        /**
         * 使用USB Host API连接USB CDC设备
         */
        private SerialConnectResult tryUsbConnection(String port, int baudRate, int dataBits, int stopBits, String parity) {
            Log.d(TAG, "[USB] 尝试USB Host API连接...");
            
            try {
                // 获取USB Manager
                UsbManager usbManager = (UsbManager) context.getSystemService(Context.USB_SERVICE);
                if (usbManager == null) {
                    return new SerialConnectResult(false, "USB服务不可用", "请检查USB权限");
                }
                
                // 从端口路径获取USB设备信息
                // 端口格式可能是 /dev/ttyUSB0 或 /dev/ttyACM0，需要解析
                String deviceName = port;
                if (port.startsWith("/dev/")) {
                    deviceName = port.substring(5);  // 去掉 /dev/ 前缀
                }
                
                // 获取USB设备列表
                HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
                Log.d(TAG, "[USB] 找到 " + deviceList.size() + " 个USB设备");
                
                UsbDevice targetDevice = null;
                for (UsbDevice device : deviceList.values()) {
                    String devName = device.getDeviceName();
                    Log.d(TAG, "[USB] 检查设备: " + devName);
                    
                    // 尝试匹配设备名或接口
                    if (devName.contains(deviceName) || deviceName.contains(devName.replace("/dev/", ""))) {
                        targetDevice = device;
                        Log.i(TAG, "[USB] 找到目标设备: " + device.getDeviceName());
                        break;
                    }
                    
                    // 检查USB转串口芯片
                    int vid = device.getVendorId();
                    int pid = device.getProductId();
                    if (vid == 0x0403 || vid == 0x067B || vid == 0x1A86 || vid == 0x10C4) {
                        // FTDI, PL2303, CH340, CP2102等常见USB转串口芯片
                        targetDevice = device;
                        Log.i(TAG, "[USB] 找到USB转串口芯片: VID=" + String.format("%04X", vid) + " PID=" + String.format("%04X", pid));
                        break;
                    }
                }
                
                if (targetDevice == null) {
                    return new SerialConnectResult(false, "未找到USB设备", "请检查USB连接");
                }
                
                // 请求USB权限
                if (!usbManager.hasPermission(targetDevice)) {
                    Log.d(TAG, "[USB] 请求USB权限...");
                    // 注意：这里需要用户授权，可以通过PendingIntent实现
                    // 暂时跳过权限检查，尝试直接连接
                }
                
                // 打开USB设备
                usbConnection = usbManager.openDevice(targetDevice);
                if (usbConnection == null) {
                    return new SerialConnectResult(false, "无法打开USB设备", "可能没有USB权限");
                }
                Log.d(TAG, "[USB] USB设备打开成功");
                
                // 查找CDC ACM接口（通常是接口0）
                int interfaceCount = targetDevice.getInterfaceCount();
                usbInterface = null;
                for (int i = 0; i < interfaceCount; i++) {
                    UsbInterface intf = targetDevice.getInterface(i);
                    int intfClass = intf.getInterfaceClass();
                    int intfSubClass = intf.getInterfaceSubclass();
                    Log.d(TAG, "[USB] 接口" + i + ": class=" + intfClass + ", subclass=" + intfSubClass);
                    
                    // CDC ACM class = 10 (0x0A), subclass = 2 (ACM)
                    if (intfClass == 10 && intfSubClass == 2) {
                        usbInterface = intf;
                        Log.i(TAG, "[USB] 找到CDC ACM接口: " + i);
                        break;
                    }
                    
                    // 也尝试查找Communication接口
                    if (intfClass == 2) {
                        usbInterface = intf;
                        Log.i(TAG, "[USB] 找到Communication接口: " + i);
                    }
                }
                
                // 如果没找到CDC ACM，使用接口0
                if (usbInterface == null && interfaceCount > 0) {
                    usbInterface = targetDevice.getInterface(0);
                    Log.i(TAG, "[USB] 使用接口0");
                }
                
                if (usbInterface == null) {
                    usbConnection.close();
                    return new SerialConnectResult(false, "未找到可用接口", "USB设备可能不兼容");
                }
                
                // 声明接口
                if (!usbConnection.claimInterface(usbInterface, true)) {
                    usbConnection.close();
                    return new SerialConnectResult(false, "无法声明USB接口", "接口被占用");
                }
                Log.d(TAG, "[USB] 接口声明成功");
                
                // 查找IN/OUT端点
                int endpointCount = usbInterface.getEndpointCount();
                endpointIn = null;
                endpointOut = null;
                for (int i = 0; i < endpointCount; i++) {
                    UsbEndpoint ep = usbInterface.getEndpoint(i);
                    if (ep.getType() == UsbConstants.USB_ENDPOINT_XFER_BULK) {
                        if (ep.getDirection() == UsbConstants.USB_DIR_IN) {
                            endpointIn = ep;
                            Log.d(TAG, "[USB] 找到IN端点");
                        } else {
                            endpointOut = ep;
                            Log.d(TAG, "[USB] 找到OUT端点");
                        }
                    }
                }
                
                if (endpointIn == null || endpointOut == null) {
                    usbConnection.close();
                    return new SerialConnectResult(false, "未找到BULK端点", "USB设备可能不兼容");
                }
                
                // 设置波特率（通过CDC控制请求）
                boolean baudSet = setUsbBaudRate(baudRate);
                if (baudSet) {
                    Log.i(TAG, "[USB] 波特率设置成功: " + baudRate);
                } else {
                    Log.w(TAG, "[USB] 波特率设置失败，使用默认");
                }
                
                // 连接成功，设置标志
                connected = true;
                input = null;  // 使用USB，不再使用FileInputStream
                output = null;
                usbDevice = targetDevice;
                
                String msg = "USB CDC连接成功: " + port + " @ " + baudRate + " (波特率设置: " + (baudSet ? "成功" : "失败") + ")";
                Log.i(TAG, "[USB] " + msg);
                return new SerialConnectResult(true, null, msg);
                
            } catch (SecurityException e) {
                Log.e(TAG, "[USB] 安全异常(无权限)", e);
                return new SerialConnectResult(false, "USB权限被拒绝", "请在设置中允许USB调试");
            } catch (Exception e) {
                Log.e(TAG, "[USB] 连接异常", e);
                return new SerialConnectResult(false, e.getMessage(), e.toString());
            }
        }
        
        /**
         * 设置USB CDC设备的波特率
         * CDC SET_LINE_CODING 请求
         */
        private boolean setUsbBaudRate(int baudRate) {
            try {
                if (usbConnection == null || usbInterface == null) {
                    return false;
                }
                
                Log.d(TAG, "[USB] 设置波特率: " + baudRate);
                
                // CDC Line Coding 结构 (7字节):
                // dwDTERate (4字节, little-endian): 波特率
                // bCharFormat (1字节): 停止位 (0=1位, 1=1.5位, 2=2位)
                // bParityType (1字节): 校验 (0=无, 1=奇, 2=偶, 3=标记, 4=空格)
                // bDataBits (1字节): 数据位 (5,6,7,8,16)
                byte[] lineCoding = new byte[7];
                
                // 波特率 (little-endian)
                lineCoding[0] = (byte) (baudRate & 0xFF);
                lineCoding[1] = (byte) ((baudRate >> 8) & 0xFF);
                lineCoding[2] = (byte) ((baudRate >> 16) & 0xFF);
                lineCoding[3] = (byte) ((baudRate >> 24) & 0xFF);
                
                // 停止位: 0 = 1位
                lineCoding[4] = 0;
                // 校验: 0 = 无
                lineCoding[5] = 0;
                // 数据位: 8
                lineCoding[6] = 8;
                
                // CDC请求: SET_LINE_CODING (0x20)
                // requestType: 0x21 (HOST_TO_DEVICE | CLASS | INTERFACE)
                // request: 0x20 (SET_LINE_CODING)
                // value: 0
                // index: 0 (接口号)
                int requestType = 0x21;  // HOST_TO_DEVICE | CLASS | INTERFACE
                int request = 0x20;      // SET_LINE_CODING
                int value = 0;
                int index = usbInterface.getId();  // 接口ID
                
                int result = usbConnection.controlTransfer(requestType, request, value, index, lineCoding, lineCoding.length, 1000);
                
                Log.d(TAG, "[USB] controlTransfer结果: " + result);
                return result >= 0;
                
            } catch (Exception e) {
                Log.e(TAG, "[USB] 设置波特率异常", e);
                return false;
            }
        }
        
        /**
         * 传统串口连接方式（备用）
         */
        SerialConnectResult connectWithDetailLegacy(String port, int baudRate, int dataBits, int stopBits, String parity) {
            Log.i(TAG, "[串口-传统] connectWithDetailLegacy: port=" + port + ", baudRate=" + baudRate);
            
            try {
                File device = new File(port);
                
                // 检查设备是否存在
                if (!device.exists()) {
                    String error = "串口设备不存在: " + port;
                    Log.e(TAG, "[串口-传统] " + error);
                    return new SerialConnectResult(false, error, getAvailableTtyDevices());
                }
                Log.d(TAG, "[串口-传统] 设备存在: " + port);
                
                // 检查读写权限
                boolean canRead = device.canRead();
                boolean canWrite = device.canWrite();
                Log.d(TAG, "[串口-传统] 权限检查: canRead=" + canRead + ", canWrite=" + canWrite);
                
                if (!canRead) {
                    String error = "串口设备无读权限: " + port;
                    Log.e(TAG, "[串口-传统] " + error);
                    return new SerialConnectResult(false, error, "请检查设备权限");
                }
                if (!canWrite) {
                    String error = "串口设备无写权限: " + port;
                    Log.e(TAG, "[串口-传统] " + error);
                    return new SerialConnectResult(false, error, "请检查设备权限");
                }
                
                Log.d(TAG, "[串口-传统] 权限检查通过");
                
                // 尝试打开设备
                try {
                    input = new FileInputStream(device);
                    Log.d(TAG, "[串口-传统] FileInputStream 打开成功");
                } catch (Exception e) {
                    String error = "FileInputStream 打开失败: " + e.getMessage();
                    Log.e(TAG, "[串口-传统] " + error);
                    return new SerialConnectResult(false, error, e.getMessage());
                }
                
                try {
                    output = new FileOutputStream(device);
                    Log.d(TAG, "[串口-传统] FileOutputStream 打开成功");
                } catch (Exception e) {
                    String error = "FileOutputStream 打开失败: " + e.getMessage();
                    Log.e(TAG, "[串口-传统] " + error);
                    if (input != null) {
                        try { input.close(); } catch (Exception ex) {}
                    }
                    return new SerialConnectResult(false, error, e.getMessage());
                }
                
                // 尝试设置波特率
                Log.d(TAG, "[串口-传统] 尝试设置波特率: " + baudRate);
                boolean baudSet = setBaudRateAfterOpen(port, baudRate);
                if (baudSet) {
                    Log.i(TAG, "[串口-传统] 波特率设置成功!");
                } else {
                    Log.w(TAG, "[串口-传统] 波特率设置失败（可能需要root权限），使用默认波特率");
                }
                
                // 保存端口和波特率信息（用于波特率扫描）
                currentPort = port;
                currentBaudRate = baudRate;
                baudRateIndex = 0;
                lastBaudRateSwitchTime = System.currentTimeMillis();
                
                connected = true;
                String msg = "传统串口连接成功: " + port + " @ " + baudRate + "bps";
                Log.i(TAG, "[串口-传统] " + msg);
                
                // 连接成功后立即开始波特率扫描测试
                Log.i(TAG, "[串口-传统] === 开始波特率扫描测试 ===");
                Log.i(TAG, "[串口-传统] 将依次测试: 2400, 4800, 9600, 19200, 38400, 57600, 115200");
                
                return new SerialConnectResult(true, null, msg);
                
            } catch (SecurityException e) {
                String error = "安全异常(无权限): " + e.getMessage();
                Log.e(TAG, "[串口-传统] " + error);
                return new SerialConnectResult(false, error, "应用缺少访问串口的权限");
            } catch (Exception e) {
                String error = "串口连接异常: " + e.getMessage();
                Log.e(TAG, "[串口-传统] " + error, e);
                return new SerialConnectResult(false, error, e.getMessage());
            }
        }
        
        // 在打开串口之前设置波特率（需要在root环境下）
        private static boolean setBaudRateBeforeOpen(String port, int baudRate) {
            try {
                Log.d(TAG, "[串口] 尝试预设置波特率: " + port + " @ " + baudRate);
                
                // 首先尝试chmod确保设备可访问
                try {
                    Process chmod = Runtime.getRuntime().exec("chmod 666 " + port);
                    int chmodResult = chmod.waitFor();
                    Log.d(TAG, "[串口] chmod 666 " + port + " 结果: " + chmodResult);
                } catch (Exception e) {
                    Log.d(TAG, "[串口] chmod失败: " + e.getMessage());
                }
                
                // 方法1：使用stty命令（可能需要root）
                String[] sttyCommands = {
                    "stty -F " + port + " " + baudRate + " raw -echo -echoe -echok -echoctl -echoke",
                    "stty -F " + port + " " + baudRate,
                    "stty " + baudRate + " -F " + port,
                    "stty -F " + port + " speed " + baudRate + " raw"
                };
                
                for (String cmd : sttyCommands) {
                    try {
                        Log.i(TAG, "[串口] 尝试stty: " + cmd);
                        Process process = Runtime.getRuntime().exec(cmd);
                        int exitCode = process.waitFor();
                        
                        // 读取输出
                        StringBuilder output = new StringBuilder();
                        try {
                            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                            String line;
                            while ((line = reader.readLine()) != null) {
                                output.append(line).append("\n");
                            }
                        } catch (Exception ex) {}
                        
                        if (exitCode == 0) {
                            Log.i(TAG, "[串口] stty成功: " + cmd);
                            return true;
                        } else {
                            Log.w(TAG, "[串口] stty失败(退出码:" + exitCode + "): " + cmd);
                        }
                    } catch (Exception e) {
                        Log.w(TAG, "[串口] stty异常: " + cmd + " - " + e.getMessage());
                    }
                }
                
                // 方法2：使用setserial（可能需要root）
                try {
                    String setserialCmd = "setserial -v " + port + " baud_base " + baudRate + " spd_cust divisor " + (2400 / baudRate);
                    Log.i(TAG, "[串口] 尝试setserial: " + setserialCmd);
                    Process process = Runtime.getRuntime().exec(setserialCmd);
                    int exitCode = process.waitFor();
                    if (exitCode == 0) {
                        Log.i(TAG, "[串口] setserial成功");
                        return true;
                    }
                } catch (Exception e) {
                    Log.w(TAG, "[串口] setserial失败: " + e.getMessage());
                }
                
                Log.w(TAG, "[串口] 所有波特率设置失败（可能需要root）");
                return false;
                
            } catch (Exception e) {
                Log.e(TAG, "[串口] 波特率预设置异常: " + e.getMessage());
                return false;
            }
        }
        
        // 在打开串口之后设置波特率（通过su获取root权限）
        private static boolean setBaudRateAfterOpen(String port, int baudRate) {
            try {
                Log.d(TAG, "[串口] 尝试在打开后设置波特率: " + port + " @ " + baudRate);
                
                // 方法1：通过su执行stty命令
                String[] sttyCommands = {
                    "stty -F " + port + " " + baudRate + " raw -echo -echoe -echok -echoctl -echoke",
                    "stty -F " + port + " " + baudRate,
                    "stty " + baudRate + " -F " + port
                };
                
                for (String cmd : sttyCommands) {
                    try {
                        Log.d(TAG, "[串口] 通过su执行stty: " + cmd);
                        Process su = Runtime.getRuntime().exec("su");
                        DataOutputStream os = new DataOutputStream(su.getOutputStream());
                        os.writeBytes(cmd + "\n");
                        os.writeBytes("exit\n");
                        os.flush();
                        int exitCode = su.waitFor();
                        
                        if (exitCode == 0) {
                            Log.i(TAG, "[串口] su+stty成功!");
                            return true;
                        } else {
                            Log.d(TAG, "[串口] su+stty失败(退出码:" + exitCode + ")");
                        }
                    } catch (Exception e) {
                        Log.d(TAG, "[串口] su+stty异常: " + e.getMessage());
                    }
                }
                
                // 方法2：直接执行stty（可能因权限失败）
                for (String cmd : sttyCommands) {
                    try {
                        Log.d(TAG, "[串口] 直接执行stty: " + cmd);
                        Process process = Runtime.getRuntime().exec(cmd);
                        int exitCode = process.waitFor();
                        
                        if (exitCode == 0) {
                            Log.i(TAG, "[串口] stty直接成功!");
                            return true;
                        } else {
                            Log.d(TAG, "[串口] stty直接失败(退出码:" + exitCode + ")");
                        }
                    } catch (Exception e) {
                        Log.d(TAG, "[串口] stty直接异常: " + e.getMessage());
                    }
                }
                
                Log.w(TAG, "[串口] 所有波特率设置方法失败");
                return false;
                
            } catch (Exception e) {
                Log.e(TAG, "[串口] 波特率设置异常: " + e.getMessage());
                return false;
            }
        }
        
        boolean connect(String port, int baudRate, int dataBits, int stopBits, String parity) {
            SerialConnectResult result = connectWithDetail(port, baudRate, dataBits, stopBits, parity);
            return result.success;
        }
        
        void close() {
            try {
                // 关闭USB连接
                if (usbConnection != null) {
                    if (usbInterface != null) {
                        usbConnection.releaseInterface(usbInterface);
                    }
                    usbConnection.close();
                    usbConnection = null;
                    Log.d(TAG, "[USB] USB连接已关闭");
                }
                
                // 关闭传统串口
                if (input != null) {
                    input.close();
                    input = null;
                }
                if (output != null) {
                    output.close();
                    output = null;
                }
                connected = false;
                Log.d(TAG, "[串口] 串口连接已关闭");
            } catch (Exception e) {
                Log.e(TAG, "关闭串口失败", e);
            }
        }
        
        /**
         * 处理称重数据，进行平滑和稳定检测
         * @return 处理后的ScaleWeight，如果数据不稳定返回null
         */
        ScaleWeight processWeight(double rawWeight) {
            long now = System.currentTimeMillis();
            
            // 归零检测：如果重量为0或接近0，持续超过2秒，强制归零
            if (rawWeight <= ZERO_THRESHOLD) {
                if (lastNonZeroTime > 0 && (now - lastNonZeroTime) > 2000) {
                    // 归零
                    ScaleWeight w = new ScaleWeight();
                    w.weight = 0;
                    w.unit = "kg";
                    w.stable = true;
                    w.timestamp = now;
                    isStable = true;
                    lastStableTime = now;
                    return w;
                }
            } else {
                lastNonZeroTime = now;
            }
            
            // 添加到历史数据
            weightHistory[historyIndex] = rawWeight;
            historyIndex = (historyIndex + 1) % STABLE_COUNT;
            stableCount++;
            if (stableCount > STABLE_COUNT) stableCount = STABLE_COUNT;
            
            // 计算平均重量
            double sum = 0;
            int count = Math.min(stableCount, STABLE_COUNT);
            for (int i = 0; i < count; i++) {
                sum += weightHistory[i];
            }
            double avgWeight = sum / count;
            
            // 检查是否稳定：所有历史数据在阈值范围内波动
            boolean stable = true;
            for (int i = 0; i < count; i++) {
                if (Math.abs(weightHistory[i] - avgWeight) > STABLE_THRESHOLD) {
                    stable = false;
                    break;
                }
            }
            
            // 如果稳定，更新稳定时间
            if (stable && count >= STABLE_COUNT) {
                if (!isStable) {
                    lastStableTime = now;
                }
                isStable = true;
                
                // 只有稳定超过一定时间才认为真正稳定
                if ((now - lastStableTime) >= 300) {
                    ScaleWeight w = new ScaleWeight();
                    w.weight = Math.round(avgWeight * 1000.0) / 1000.0;  // 保留3位小数
                    w.unit = "kg";
                    w.stable = true;
                    w.timestamp = now;
                    return w;
                }
            } else {
                isStable = false;
            }
            
            // 不稳定时返回粗略平均值（不精确但可用）
            return null;
        }
        
        // 通过stty命令设置波特率
        private boolean setBaudRate(String port, int baudRate) {
            try {
                Log.d(TAG, "使用stty设置波特率: " + port + " @ " + baudRate);
                
                // 首先尝试用stty命令设置波特率
                // stty命令格式: stty -F /dev/ttyS0 2400 raw
                String sttyCmd = "stty -F " + port + " " + baudRate + " raw -echo -echoe -echok -echoctl -echoke";
                Log.d(TAG, "执行命令: " + sttyCmd);
                
                Process process = Runtime.getRuntime().exec(sttyCmd);
                int exitCode = process.waitFor();
                
                if (exitCode == 0) {
                    Log.d(TAG, "stty波特率设置成功: " + baudRate);
                    return true;
                } else {
                    // 读取错误信息
                    BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
                    StringBuilder errorMsg = new StringBuilder();
                    String line;
                    while ((line = errorReader.readLine()) != null) {
                        errorMsg.append(line).append("\n");
                    }
                    Log.e(TAG, "stty设置失败，退出码: " + exitCode + ", 错误: " + errorMsg.toString());
                    
                    // 尝试备选方案：使用setserial
                    return trySetSerial(port, baudRate);
                }
            } catch (Exception e) {
                Log.e(TAG, "stty命令执行异常", e);
                return false;
            }
        }
        
        // 备选方案：使用setserial命令
        private boolean trySetSerial(String port, int baudRate) {
            try {
                // setserial命令格式: setserial -v /dev/ttyS0 spd_cust divisor 2400
                // 有些系统需要特殊处理
                String[] cmds = {
                    "setserial -v " + port + " baud_base 2400 spd_cust divisor 5",
                    "stty -F " + port + " 2400"
                };
                
                for (String cmd : cmds) {
                    try {
                        Log.d(TAG, "尝试备选命令: " + cmd);
                        Process process = Runtime.getRuntime().exec(cmd);
                        int exitCode = process.waitFor();
                        if (exitCode == 0) {
                            Log.d(TAG, "备选命令成功: " + cmd);
                            return true;
                        }
                    } catch (Exception e) {
                        Log.d(TAG, "备选命令失败: " + cmd + " - " + e.getMessage());
                    }
                }
                
                Log.w(TAG, "所有波特率设置方法都失败，将使用默认波特率");
                return false;
            } catch (Exception e) {
                Log.e(TAG, "setserial执行异常", e);
                return false;
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
        
        /**
         * USB读取数据
         */
        int readUsb(byte[] buffer) {
            try {
                if (usbConnection != null && endpointIn != null) {
                    int len = usbConnection.bulkTransfer(endpointIn, buffer, buffer.length, 100);
                    return len;
                }
            } catch (Exception e) {
                Log.e(TAG, "[USB] 读取异常: " + e.getMessage());
            }
            return -1;
        }
        
        /**
         * USB发送读取命令
         */
        void sendUsbCommand() {
            try {
                if (usbConnection != null && endpointOut != null) {
                    // SOKI协议命令: DC1 (0x11)
                    byte[] cmd = new byte[]{0x11};
                    int len = usbConnection.bulkTransfer(endpointOut, cmd, cmd.length, 100);
                    Log.d(TAG, "[USB命令] 发送: DC1(0x11), 结果: " + len);
                }
            } catch (Exception e) {
                Log.e(TAG, "[USB命令] 发送异常: " + e.getMessage());
            }
        }
    }
    
    // ==================== 内部类：秤数据 ====================
    
    static class ScaleWeight {
        double weight;
        String unit;
        boolean stable;
        long timestamp;
        String raw;  // 原始数据字符串
    }
    
    // ==================== 内部类：秤读取线程 ====================
    
    class ReaderThread extends Thread {
        private volatile boolean running = true;
        private SerialConnection serial;
        private Socket socket;  // 网络秤socket
        private String protocol;
        
        ReaderThread(SerialConnection serial, String protocol) {
            this.serial = serial;
            this.protocol = protocol;
            this.socket = null;
        }
        
        ReaderThread(Socket socket, String protocol) {
            this.socket = socket;
            this.serial = null;
            this.protocol = protocol;
        }
        
        @Override
        public void run() {
            Log.i(TAG, "========================================");
            Log.i(TAG, "[秤读取] ReaderThread启动");
            Log.i(TAG, "[秤读取] serial=" + serial + ", serial.input=" + (serial != null ? serial.input : "null"));
            Log.i(TAG, "[秤读取] serial.usbConnection=" + (serial != null ? serial.usbConnection : "null"));
            if (serial != null) {
                Log.i(TAG, "[秤读取] currentPort=" + serial.currentPort + ", currentBaudRate=" + serial.currentBaudRate);
            }
            Log.i(TAG, "========================================");
            
            // 在屏幕上显示Toast
            try {
                Handler handler = new Handler(Looper.getMainLooper());
                handler.post(() -> {
                    try {
                        Toast.makeText(appContext, "秤读取线程已启动!", Toast.LENGTH_SHORT).show();
                    } catch (Exception e) {}
                });
            } catch (Exception e) {}
            
            byte[] buffer = new byte[128];
            long lastReadTime = 0;
            long lastCommandTime = 0;
            int readAttempt = 0;
            
            // 首次进入时显示当前波特率
            try {
                Handler handler = new Handler(Looper.getMainLooper());
                handler.post(() -> {
                    try {
                        int br = serial != null ? serial.currentBaudRate : 0;
                        Toast.makeText(appContext, "当前波特率: " + br, Toast.LENGTH_SHORT).show();
                    } catch (Exception e) {}
                });
            } catch (Exception e) {}
            
            while (running) {
                try {
                    if (serial != null) {
                        // 检查是USB还是传统串口
                        if (serial.usbConnection != null) {
                            // USB读取
                            try {
                                int len = serial.readUsb(buffer);
                                if (len > 0) {
                                    lastReadTime = System.currentTimeMillis();
                                    readAttempt = 0;
                                    Log.i(TAG, "[秤读取-USB] 读到数据，长度: " + len);
                                    StringBuilder hex = new StringBuilder();
                                    for (int i = 0; i < len; i++) {
                                        hex.append(String.format("%02X ", buffer[i]));
                                    }
                                    Log.i(TAG, "[秤原始HEX] " + hex.toString());
                                    parseScaleData(buffer, len);
                                } else {
                                    readAttempt++;
                                    if (System.currentTimeMillis() - lastCommandTime > 2000) {
                                        serial.sendUsbCommand();
                                        lastCommandTime = System.currentTimeMillis();
                                    }
                                }
                            } catch (Exception e) {
                                Log.e(TAG, "[秤读取-USB] 读取异常: " + e.getMessage());
                            }
                        } else if (serial.input != null) {
                            // 传统串口读取 - 快速非阻塞方式
                            int len = 0;
                            try {
                                // 检查是否有数据可用
                                int available = serial.input.available();
                                if (available > 0) {
                                    // 有数据，读取
                                    len = Math.min(available, buffer.length);
                                    len = serial.input.read(buffer, 0, len);
                                    if (len < 0) len = 0;
                                } else {
                                    // 没有数据，短暂等待后重试
                                    Thread.sleep(20);  // 20ms延迟，提高响应速度
                                }
                            } catch (IOException e) {
                                // 读取异常，短暂等待
                                try { Thread.sleep(50); } catch (Exception ex) {}
                            } catch (Exception e) {
                                try { Thread.sleep(20); } catch (Exception ex) {}
                            }
                            
                            if (len > 0) {
                                lastReadTime = System.currentTimeMillis();
                                readAttempt = 0;
                                Log.i(TAG, "[秤读取] 读到数据，长度: " + len);
                                parseScaleData(buffer, len);
                            } else {
                                readAttempt++;
                                
                                // 无数据超过30秒，尝试切换波特率（仅在非9600时）
                                if (readAttempt >= 1500 && serial.currentBaudRate != 9600) {  // 30秒
                                    Log.w(TAG, "[波特率扫描] 30秒无数据，切换波特率...");
                                    serial.tryNextBaudRate();
                                    readAttempt = 0;
                                }
                                
                                // 只在日志中输出，避免Toast影响性能
                                if (readAttempt % 50 == 0) {  // 每秒输出一次
                                    Log.d(TAG, "[秤读取] 等待中... " + readAttempt);
                                }
                            }
                        }
                    } else if (socket != null && socket.isConnected() && !socket.isClosed()) {
                        // 网络秤读取
                        if (socket.getInputStream() != null) {
                            int len = socket.getInputStream().read(buffer);
                            if (len > 0) {
                                parseScaleData(buffer, len);
                            }
                        }
                    }
                    Thread.sleep(20);  // 20ms间隔，50次/秒采样，极速响应
                } catch (Exception e) {
                    if (running) Log.e(TAG, "秤读取异常", e);
                }
            }
            Log.i(TAG, "[秤读取] ReaderThread结束");
        }
        
        // 发送电子秤读取命令 - 顶尖OS2系列 SOKI协议
        private void sendScaleReadCommand() {
            try {
                if (serial != null && serial.output != null) {
                    // 顶尖OS2系列 SOKI协议命令 - 依次尝试
                    
                    // 命令1: DC1 (0x11) - SOKI协议常用读取命令
                    byte[] cmd1 = new byte[]{0x11};  // DC1
                    
                    // 命令2: 读取重量
                    byte[] cmd2 = new byte[]{'W', 0x0D};  // 'W' + CR
                    
                    // 命令3: 读取数据
                    byte[] cmd3 = new byte[]{'D', 0x0D};  // 'D' + CR
                    
                    // 命令4: STX + W
                    byte[] cmd4 = new byte[]{0x02, 'W', 0x0D};  // STX + 'W' + CR
                    
                    // 依次尝试发送命令
                    try {
                        serial.output.write(cmd1);
                        serial.output.flush();
                        Log.i(TAG, "[秤命令] 发送: DC1(0x11)");
                    } catch (Exception e) {
                        Log.e(TAG, "[秤命令] DC1发送失败: " + e.getMessage());
                    }
                    
                    try {
                        serial.output.write(cmd2);
                        serial.output.flush();
                        Log.i(TAG, "[秤命令] 发送: W+CR");
                    } catch (Exception e) {
                        Log.e(TAG, "[秤命令] W+CR发送失败: " + e.getMessage());
                    }
                    
                    try {
                        serial.output.write(cmd3);
                        serial.output.flush();
                        Log.i(TAG, "[秤命令] 发送: D+CR");
                    } catch (Exception e) {
                        Log.e(TAG, "[秤命令] D+CR发送失败: " + e.getMessage());
                    }
                    
                } else {
                    Log.w(TAG, "[秤命令] 串口output为null，无法发送");
                }
            } catch (Exception e) {
                Log.e(TAG, "[秤命令] 发送命令异常: " + e.getMessage());
            }
        }
        
        void parseScaleData(byte[] data, int len) {
            // 记录原始十六进制数据用于调试
            StringBuilder hexBuilder = new StringBuilder();
            for (int i = 0; i < len; i++) {
                hexBuilder.append(String.format("%02X ", data[i]));
            }
            
            // 尝试解析顶尖OS2二进制协议
            ScaleWeight rawWeight = parseSokiProtocol(data, len);
            
            if (rawWeight != null) {
                Log.d(TAG, "解析原始重量: " + rawWeight.weight + " kg, stable=" + rawWeight.stable);
                
                // 使用数据平滑处理
                ScaleWeight processedWeight = serial.processWeight(rawWeight.weight);
                
                if (processedWeight != null) {
                    // 稳定数据，发送事件
                    serial.lastWeight = processedWeight;
                    
                    JSObject event = new JSObject();
                    event.put("weight", processedWeight.weight);
                    event.put("unit", processedWeight.unit);
                    event.put("stable", processedWeight.stable);
                    event.put("timestamp", processedWeight.timestamp);
                    notifyListeners("scaleData", event);
                    // 通过WebView直接发送（备用方案）
                    sendToWebView("scaleData", event);
                    Log.d(TAG, "发送稳定重量: " + processedWeight.weight + " kg");
                } else {
                    // 数据不稳定，但仍然发送数据让前端实时显示
                    // 如果原始重量接近零（小于50g），强制归零
                    if (rawWeight.weight < 0.05) {
                        ScaleWeight zeroWeight = new ScaleWeight();
                        zeroWeight.weight = 0;
                        zeroWeight.unit = "kg";
                        zeroWeight.stable = true;
                        zeroWeight.timestamp = System.currentTimeMillis();
                        serial.lastWeight = zeroWeight;
                        
                        JSObject event = new JSObject();
                        event.put("weight", 0);
                        event.put("unit", "kg");
                        event.put("stable", true);
                        event.put("timestamp", zeroWeight.timestamp);
                        notifyListeners("scaleData", event);
                        // 通过WebView直接发送（备用方案）
                        sendToWebView("scaleData", event);
                        Log.d(TAG, "秤归零（原始重量太小）: 0.000 kg");
                    } else {
                        // 数据不稳定且重量较大，发送不稳定数据让前端实时响应
                        ScaleWeight roughWeight = new ScaleWeight();
                        roughWeight.weight = rawWeight.weight;
                        roughWeight.unit = "kg";
                        roughWeight.stable = false;
                        roughWeight.timestamp = System.currentTimeMillis();
                        serial.lastWeight = roughWeight;
                        
                        // 始终发送数据，包括不稳定数据，确保前端实时响应
                        JSObject event = new JSObject();
                        event.put("weight", roughWeight.weight);
                        event.put("unit", roughWeight.unit);
                        event.put("stable", roughWeight.stable);
                        event.put("timestamp", roughWeight.timestamp);
                        notifyListeners("scaleData", event);
                        // 通过WebView直接发送（备用方案）
                        sendToWebView("scaleData", event);
                        Log.d(TAG, "发送不稳定数据: " + roughWeight.weight + " kg");
                    }
                }
                return;
            }
            
            // 备选：尝试解析通用文本协议
            String raw = new String(data, 0, len);
            Log.d(TAG, "秤原始数据[TXT]: " + raw);
            
            Pattern pattern = Pattern.compile("(ST|GS),([0-9]),([+-]?\\d+\\.\\d{3}),(\\w+)");
            Matcher matcher = pattern.matcher(raw);
            
            if (matcher.find()) {
                ScaleWeight weight = new ScaleWeight();
                weight.weight = Double.parseDouble(matcher.group(3));
                weight.unit = matcher.group(4);
                weight.stable = "GS".equals(matcher.group(1));
                weight.timestamp = System.currentTimeMillis();
                
                // 使用数据平滑处理
                ScaleWeight processedWeight = serial.processWeight(weight.weight);
                
                if (processedWeight != null) {
                    serial.lastWeight = processedWeight;
                } else {
                    serial.lastWeight = weight;
                }
                
                JSObject event = new JSObject();
                event.put("weight", serial.lastWeight.weight);
                event.put("unit", serial.lastWeight.unit);
                event.put("stable", serial.lastWeight.stable);
                event.put("timestamp", serial.lastWeight.timestamp);
                notifyListeners("scaleData", event);
            }
        }
        
        /**
         * 解析顶尖OS2二进制协议
         * 帧格式: STX(0x02) + 8字节重量ASCII + ETX(0x03) + BCC校验
         * 例如: 02 30 30 30 30 30 2E 30 30 03 B4
         *       -> "00000.00" = 0.00 kg
         */
        ScaleWeight parseSokiProtocol(byte[] data, int len) {
            // 显示原始HEX数据
            StringBuilder hex = new StringBuilder();
            for (int i = 0; i < len; i++) {
                hex.append(String.format("%02X ", data[i]));
            }
            Log.i(TAG, "秤原始数据[HEX]: " + hex.toString());
            showToast("读到数据: " + hex.toString());
            
            // 2字节数据可能是简单的状态或确认响应
            if (len == 2) {
                Log.i(TAG, "[秤] 收到2字节响应: " + hex.toString());
                showToast("秤响应: " + hex.toString());
                // 返回一个空的稳定重量，继续监听
                ScaleWeight w = new ScaleWeight();
                w.weight = 0;
                w.unit = "kg";
                w.stable = true;
                w.timestamp = System.currentTimeMillis();
                return w;
            }
            
            // 16字节数据 - 顶尖OS2协议（9600波特率）
            if (len == 16) {
                Log.i(TAG, "[秤] 收到16字节数据");
                
                // 尝试作为ASCII字符串解析
                String str = new String(data, 0, len).trim();
                Log.i(TAG, "[秤] 原始字符串: '" + str + "'");
                showToast("原始数据: " + str);
                
                // 格式: "S 00.498kgd" 或 "S00.498kgd"
                // 解析：00.498 应该直接得到 0.498kg
                
                // 查找S后面的数字部分
                int startIndex = -1;
                for (int i = 0; i < len; i++) {
                    if (data[i] == 'S' || data[i] == 's') {
                        startIndex = i + 1;
                        break;
                    }
                }
                
                if (startIndex < 0) {
                    Log.w(TAG, "[秤] 未找到S开头");
                    return null;
                }
                
                // 从S后面开始提取数字和小数点
                String numStr = "";
                for (int i = startIndex; i < len; i++) {
                    char c = (char) data[i];
                    // 收集数字和小数点
                    if ((c >= '0' && c <= '9') || c == '.') {
                        numStr += c;
                    } else if (numStr.length() > 0 && c != ' ') {
                        // 已有数字，遇到非数字字符（非空格）停止
                        break;
                    }
                }
                
                Log.i(TAG, "[秤] 提取数字字符串: '" + numStr + "'");
                
                if (numStr.length() > 0) {
                    try {
                        double weight = Double.parseDouble(numStr);
                        
                        // 判断是否稳定（S开头通常表示稳定）
                        boolean isStable = str.startsWith("S") || str.startsWith("s");
                        
                        // 如果重量接近0，可能不稳定
                        if (weight < 0.01) {
                            isStable = false;
                        }
                        
                        ScaleWeight w = new ScaleWeight();
                        w.weight = weight;
                        w.unit = "kg";
                        w.stable = isStable;
                        w.timestamp = System.currentTimeMillis();
                        w.raw = str;
                        
                        Log.i(TAG, "[秤] >>> 重量: " + weight + " kg, 稳定:" + isStable);
                        showToast(">>> 重量: " + weight + " kg");
                        return w;
                        
                    } catch (NumberFormatException e) {
                        Log.e(TAG, "[秤] 数字解析失败: " + numStr);
                    }
                }
                
                return null;
            }
            
            if (len < 5) {
                Log.w(TAG, "[秤] 数据太短(" + len + "字节)，需要至少5字节");
                return null;
            }
            
            // 查找STX(0x02)和ETX(0x03)位置
            int stxIndex = -1;
            int etxIndex = -1;
            
            for (int i = 0; i < len; i++) {
                if (data[i] == 0x02) {
                    stxIndex = i;
                } else if (data[i] == 0x03) {
                    etxIndex = i;
                    break;
                }
            }
            
            // 必须找到STX和ETX
            if (stxIndex < 0 || etxIndex < 0 || etxIndex <= stxIndex) {
                // 检查是否是纯ASCII格式 (例如 " 0.510 kg")
                String raw = new String(data, 0, len).trim();
                if (raw.matches("[\\s0-9.-]+kg")) {
                    ScaleWeight w = new ScaleWeight();
                    w.unit = "kg";
                    w.stable = true;
                    w.timestamp = System.currentTimeMillis();
                    // 提取数字部分
                    String numStr = raw.replaceAll("[^0-9.-]", "");
                    try {
                        w.weight = Double.parseDouble(numStr);
                        return w;
                    } catch (NumberFormatException e) {
                        return null;
                    }
                }
                return null;
            }
            
            // 提取重量数据部分 (STX之后, ETX之前)
            int weightStart = stxIndex + 1;
            int weightLen = etxIndex - weightStart;
            
            if (weightLen < 4) return null;
            
            try {
                String weightStr = new String(data, weightStart, weightLen, "US-ASCII");
                Log.d(TAG, "OS2重量字符串: '" + weightStr + "'");
                
                // 重量字符串格式可能是:
                // "00000.00" -> 0.00 kg
                // "00001.235" -> 1.235 kg
                // 去除前后空白
                weightStr = weightStr.trim();
                
                ScaleWeight w = new ScaleWeight();
                w.weight = Double.parseDouble(weightStr);
                w.unit = "kg";
                w.stable = true; // OS2协议，稳定位在状态字节中
                w.timestamp = System.currentTimeMillis();
                
                // 检查状态字节（如果有）
                if (etxIndex + 1 < len) {
                    byte status = data[etxIndex + 1];
                    // 稳定 = 0x0D, 不稳定 = 0x00 (或其他)
                    w.stable = (status & 0x40) != 0; // 根据实际协议调整
                }
                
                Log.d(TAG, "OS2解析成功: " + w.weight + " " + w.unit + " 稳定:" + w.stable);
                return w;
                
            } catch (Exception e) {
                Log.e(TAG, "OS2协议解析失败: " + e.getMessage());
                return null;
            }
        }
        
        void stopReading() {
            running = false;
        }
    }
    
    // ==================== 内部类：网络秤读取线程 ====================
    
    void startNetworkScaleReader(String protocol) {
        Socket socket = socketPool.get("scale_tcp");
        if (socket == null) return;
        
        // 使用socket构造函数
        ReaderThread reader = new ReaderThread(socket, protocol);
        readerThreads.put("scale_tcp", reader);
        reader.start();
    }
    
    void startScaleReader(String protocol) {
        Log.i(TAG, "[秤] startScaleReader 被调用");
        showToast("开始启动秤读取线程...");
        
        SerialConnection serial = serialPool.get("scale");
        if (serial == null) {
            Log.e(TAG, "[秤] serialPool.get(\"scale\") 返回 null!");
            showToast("错误：无法获取秤连接！");
            return;
        }
        
        Log.i(TAG, "[秤] 创建 ReaderThread");
        showToast("创建读取线程...");
        
        ReaderThread reader = new ReaderThread(serial, protocol);
        readerThreads.put("scale", reader);
        
        Log.i(TAG, "[秤] 准备启动 ReaderThread...");
        showToast("启动读取线程...");
        
        reader.start();
        Log.i(TAG, "[秤] ReaderThread.start() 已调用");
        showToast("读取线程已启动，等待数据...");
    }
    
    // 通过WebView直接调用JS函数（备用方案，确保数据能到达前端）
    private void sendToWebView(String eventName, JSObject data) {
        try {
            // 通过bridge获取WebView
            Handler handler = new Handler(Looper.getMainLooper());
            handler.post(() -> {
                try {
                    // 获取WebView
                    WebView webView = null;
                    try {
                        java.lang.reflect.Method method = this.getClass().getSuperclass().getDeclaredMethod("getWebView");
                        method.setAccessible(true);
                        webView = (WebView) method.invoke(this);
                    } catch (Exception e) {
                        // 尝试通过bridge获取
                        try {
                            Object bridge = this.getClass().getSuperclass().getDeclaredField("bridge").get(this);
                            if (bridge != null) {
                                java.lang.reflect.Field webViewField = bridge.getClass().getDeclaredField("webView");
                                webViewField.setAccessible(true);
                                webView = (WebView) webViewField.get(bridge);
                            }
                        } catch (Exception e2) {
                            Log.w(TAG, "无法获取WebView: " + e2.getMessage());
                        }
                    }
                    
                    if (webView != null) {
                        String jsonData = data.toString();
                        String jsCode = String.format(
                            "javascript:window.HailinHardwareBridge && window.HailinHardwareBridge('%s', %s)",
                            eventName, jsonData
                        );
                        Log.d(TAG, "[WebView发送] " + eventName + ": " + jsonData);
                        webView.evaluateJavascript(jsCode, null);
                    } else {
                        Log.w(TAG, "[WebView] WebView为null，无法直接发送");
                    }
                } catch (Exception e) {
                    Log.e(TAG, "[WebView] 发送失败: " + e.getMessage());
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "[WebView] sendToWebView异常: " + e.getMessage());
        }
    }
    
    // 显示Toast通知
    private void showToast(String message) {
        try {
            Handler handler = new Handler(Looper.getMainLooper());
            handler.post(() -> {
                try {
                    Toast toast = Toast.makeText(appContext, message, Toast.LENGTH_SHORT);
                    toast.setGravity(Gravity.TOP | Gravity.CENTER_HORIZONTAL, 0, 200);
                    toast.show();
                } catch (Exception e) {
                    Log.e(TAG, "Toast显示失败: " + e.getMessage());
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "showToast异常: " + e.getMessage());
        }
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
    
    // ==================== 列出USB设备 ====================
    @PluginMethod
    public void listUsbDevices(PluginCall call) {
        executor.execute(() -> {
            try {
                JSObject result = new JSObject();
                JSObject devices = new JSObject();
                
                if (usbManager != null) {
                    HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
                    int index = 0;
                    for (String key : deviceList.keySet()) {
                        UsbDevice device = deviceList.get(key);
                        JSObject deviceInfo = new JSObject();
                        deviceInfo.put("name", device.getDeviceName());
                        deviceInfo.put("vendorId", device.getVendorId());
                        deviceInfo.put("productId", device.getProductId());
                        deviceInfo.put("productName", device.getProductName());
                        deviceInfo.put("manufacturerName", device.getManufacturerName());
                        
                        // 尝试识别芯片类型
                        int vid = device.getVendorId();
                        String chipType = "未知";
                        if (vid == 0x0403) chipType = "FTDI"; // FTDI
                        else if (vid == 0x067B) chipType = "PL2303"; // Prolific
                        else if (vid == 0x1A86) chipType = "CH340/CH341"; // WCH
                        else if (vid == 0x04D8) chipType = "Microchip";
                        else if (vid == 0x046D) chipType = "Logitech";
                        else if (vid == 0x413C) chipType = "Dell";
                        
                        deviceInfo.put("chipType", chipType);
                        devices.put("device_" + index, deviceInfo);
                        index++;
                        
                        Log.d(TAG, "USB设备: " + device.getDeviceName() + " VID:" + String.format("%04X", vid) + " (" + chipType + ")");
                    }
                    
                    result.put("count", deviceList.size());
                    result.put("devices", devices);
                } else {
                    result.put("count", 0);
                    result.put("error", "USB服务不可用");
                }
                
                call.resolve(result);
            } catch (Exception e) {
                Log.e(TAG, "列出USB设备失败", e);
                JSObject result = new JSObject();
                result.put("count", 0);
                result.put("error", e.getMessage());
                call.resolve(result);
            }
        });
    }
    
    // ==================== 列出tty设备 ====================
    @PluginMethod
    public void listTtyDevices(PluginCall call) {
        executor.execute(() -> {
            try {
                JSObject result = new JSObject();
                JSObject devices = new JSObject();
                
                File devDir = new File("/dev");
                if (devDir.exists() && devDir.isDirectory()) {
                    String[] files = devDir.list();
                    int index = 0;
                    if (files != null) {
                        for (String f : files) {
                            if (f.startsWith("tty")) {
                                File device = new File("/dev/" + f);
                                String permission;
                                if (device.canRead() && device.canWrite()) {
                                    permission = "可读写";
                                } else if (device.canRead()) {
                                    permission = "仅可读";
                                } else if (device.canWrite()) {
                                    permission = "仅可写";
                                } else {
                                    permission = "无权限";
                                }
                                // 返回格式: { "ttyS0": "可读写", "ttyS4": "可读写" }
                                devices.put(f, permission);
                                index++;
                                Log.d(TAG, "Tty设备: /dev/" + f + " - " + permission);
                            }
                        }
                    }
                    result.put("count", index);
                    result.put("devices", devices);
                } else {
                    result.put("count", 0);
                    result.put("error", "/dev目录不存在");
                }
                
                call.resolve(result);
            } catch (Exception e) {
                Log.e(TAG, "列出tty设备失败", e);
                JSObject result = new JSObject();
                result.put("count", 0);
                result.put("error", e.getMessage());
                call.resolve(result);
            }
        });
    }
    
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        disconnectAll(null);
        executor.shutdown();
        Log.i(TAG, "HailinHardware 硬件抽象层已卸载");
    }
}
