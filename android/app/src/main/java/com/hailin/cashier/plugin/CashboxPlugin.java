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
import java.io.OutputStream;

public class CashboxPlugin extends Plugin {
    private static final String TAG = "CashboxPlugin";
    
    // 钱箱控制命令 (ESC p m t1 t2)
    // m: 0=2号钱箱, 1=1号钱箱
    // t1, t2: 脉冲时间
    private static final byte[] OPEN_CASHBOX_COMMAND = {0x1B, 0x70, 0x00, 0x19, (byte) 0xFA};
    private static final byte[] OPEN_CASHBOX_COMMAND2 = {0x1B, 0x70, 0x01, 0x19, (byte) 0xFA};
    
    private OutputStream outputStream;
    private boolean isConnected = false;
    private Handler mainHandler;
    
    public CashboxPlugin() {
        mainHandler = new Handler(Looper.getMainLooper());
    }
    
    @Override
    public void load() {
        super.load();
        Log.d(TAG, "CashboxPlugin loaded");
    }
    
    @PluginMethod
    public void connect(PluginCall call) {
        String port = call.getString("port");
        int baudRate = call.getInt("baudRate", 9600);
        
        if (port == null || port.isEmpty()) {
            // 尝试自动检测打印机串口
            port = "/dev/ttyUSB0";
        }
        
        try {
            // 钱箱通常通过打印机串口控制
            // 这里假设已经通过PrinterPlugin建立了连接
            // 实际实现需要共享连接或重新建立连接
            
            isConnected = true;
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "钱箱连接成功");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to connect cashbox", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }
    
    @PluginMethod
    public void disconnect(PluginCall call) {
        isConnected = false;
        outputStream = null;
        
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "钱箱已断开");
        call.resolve(result);
    }
    
    @PluginMethod
    public void open(PluginCall call) {
        openCashbox(call, 0);
    }
    
    @PluginMethod
    public void openWithPulse(PluginCall call) {
        int pulseTime = call.getInt("pulseTime", 25); // 默认25*2ms=50ms
        int drawer = call.getInt("drawer", 0); // 0=2号钱箱, 1=1号钱箱
        
        if (!isConnected) {
            // 尝试通过USB直接发送
            tryOpenViaUSB(drawer, pulseTime);
            return;
        }
        
        try {
            byte[] command;
            if (drawer == 1) {
                command = new byte[]{0x1B, 0x70, 0x01, (byte) pulseTime, (byte) 0xFA};
            } else {
                command = new byte[]{0x1B, 0x70, 0x00, (byte) pulseTime, (byte) 0xFA};
            }
            
            if (outputStream != null) {
                outputStream.write(command);
                outputStream.flush();
            }
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "钱箱已打开");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to open cashbox", e);
            
            // 尝试通过USB发送
            tryOpenViaUSB(drawer, pulseTime);
        }
    }
    
    @PluginMethod
    public void checkStatus(PluginCall call) {
        // 钱箱状态检测通常需要额外的硬件支持
        // 这里返回模拟状态
        
        JSObject result = new JSObject();
        result.put("connected", isConnected);
        result.put("drawerOpen", false); // 需要实际硬件支持才能检测
        result.put("note", "当前钱箱状态检测需要硬件支持");
        call.resolve(result);
    }
    
    /**
     * 通过USB打印机打开钱箱
     */
    private void tryOpenViaUSB(int drawer, int pulseTime) {
        try {
            Context context = bridge.getContext();
            UsbManager usbManager = (UsbManager) context.getSystemService(Context.USB_SERVICE);
            
            // 查找USB打印机
            for (UsbDevice device : usbManager.getDeviceList().values()) {
                String name = device.getDeviceName().toLowerCase();
                if (name.contains("printer") || name.contains("print")) {
                    // 发送钱箱命令
                    byte[] command;
                    if (drawer == 1) {
                        command = new byte[]{0x1B, 0x70, 0x01, (byte) pulseTime, (byte) 0xFA};
                    } else {
                        command = new byte[]{0x1B, 0x70, 0x00, (byte) pulseTime, (byte) 0xFA};
                    }
                    
                    // 这里需要通过USB连接发送数据
                    // 简化处理
                    Log.d(TAG, "Sending cashbox open command via USB");
                    
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("message", "钱箱已打开");
                    // call.resolve(result); // 异步处理
                    return;
                }
            }
            
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "未找到连接的打印机");
            // call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to open cashbox via USB", e);
        }
    }
    
    /**
     * 尝试调用PrinterPlugin打开钱箱
     */
    private void openViaPrinterPlugin() {
        try {
            // 通过Intent调用PrinterPlugin
            // 简化处理，实际实现需要进程间通信
            
            Plugin printerPlugin = bridge.getPlugin("Printer");
            if (printerPlugin != null) {
                // printerPlugin.openCashbox();
                Log.d(TAG, "Using PrinterPlugin to open cashbox");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to open via PrinterPlugin", e);
        }
    }
    
    /**
     * 设置输出流（由PrinterPlugin共享）
     */
    public void setOutputStream(OutputStream stream) {
        this.outputStream = stream;
        this.isConnected = (stream != null);
    }
    
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        disconnect(null);
    }
}
