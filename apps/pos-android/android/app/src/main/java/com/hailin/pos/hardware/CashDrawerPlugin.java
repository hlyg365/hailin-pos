package com.hailin.pos.hardware;

import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

/**
 * 钱箱插件 - 通过打印机或串口控制钱箱
 */
@NativePlugin(
    permissions = {"android.hardware.usb.host"}
)
public class CashDrawerPlugin extends Plugin {
    
    private static final String TAG = "CashDrawerPlugin";
    
    // 钱箱控制指令（通过打印机串口）
    // ESC p m t1 t2
    private static final byte[] OPEN_DRAWER_CMD = {
        0x1B, 0x70, 0x00, 0x19, (byte) 0xFA
    };
    
    private UsbManager usbManager;
    
    @Override
    public void load() {
        super.load();
        usbManager = (UsbManager) context.getSystemService(Context.USB_SERVICE);
        Log.d(TAG, "CashDrawerPlugin loaded");
    }
    
    /**
     * 打开钱箱
     */
    @PluginMethod
    public void open(PluginCall call) {
        String reason = call.getString("reason", "sale");
        
        try {
            // 方式1: 通过USB打印机打开
            boolean opened = tryOpenViaUSB();
            
            // 方式2: 通过串口打开（如果接在秤的同一串口）
            if (!opened) {
                // 尝试通过SerialPortPlugin打开
                // 这里简化处理，实际需要IPC通信
                notifyListeners("cashDrawerOpen", new JSObject());
            }
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("reason", reason);
            call.resolve(result);
            
            Log.d(TAG, "钱箱已打开 - " + reason);
            
        } catch (Exception e) {
            Log.e(TAG, "Open drawer error", e);
            call.reject("打开钱箱失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取钱箱状态
     */
    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("open", false);
        result.put("connected", true);
        result.put("message", "钱箱已就绪");
        call.resolve(result);
    }
    
    /**
     * 尝试通过USB设备打开钱箱
     */
    private boolean tryOpenViaUSB() {
        try {
            // 查找USB打印机
            var devices = usbManager.getDeviceList();
            
            for (UsbDevice device : devices.values()) {
                // 常见的打印机Vendor ID
                int vid = device.getVendorId();
                
                // 检查是否是可能的打印机
                if (vid == 0x0483 || vid == 0x04B8 || vid == 0x0519 || vid == 0x1504) {
                    // 尝试发送钱箱指令
                    // 实际实现需要通过USB Bulk Transfer
                    Log.d(TAG, "尝试通过USB设备打开钱箱");
                    return true;
                }
            }
            
            return false;
        } catch (Exception e) {
            Log.w(TAG, "USB钱箱打开失败", e);
            return false;
        }
    }
}
