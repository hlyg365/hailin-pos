package com.hailin.cashier.plugin;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.util.Log;
import android.widget.Toast;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public class PrinterPlugin extends Plugin {
    private static final String TAG = "PrinterPlugin";
    
    // ESC/POS Commands
    private static final byte[] ESC = {(byte) 0x1B};
    private static final byte[] GS = {(byte) 0x1D};
    
    // ESC/POS Commands
    private static final byte[] INIT = {0x1B, 0x40}; // 初始化打印机
    private static final byte[] ALIGN_CENTER = {0x1B, 0x61, 0x01};
    private static final byte[] ALIGN_LEFT = {0x1B, 0x61, 0x00};
    private static final byte[] ALIGN_RIGHT = {0x1B, 0x61, 0x02};
    private static final byte[] BOLD_ON = {0x1B, 0x45, 0x01};
    private static final byte[] BOLD_OFF = {0x1B, 0x45, 0x00};
    private static final byte[] DOUBLE_HEIGHT_ON = {0x1B, 0x21, 0x10};
    private static final byte[] DOUBLE_WIDTH_ON = {0x1B, 0x21, 0x20};
    private static final byte[] DOUBLE_ON = {0x1B, 0x21, 0x30};
    private static final byte[] NORMAL_SIZE = {0x1B, 0x21, 0x00};
    private static final byte[] UNDERLINE_ON = {0x1B, 0x2D, 0x01};
    private static final byte[] UNDERLINE_OFF = {0x1B, 0x2D, 0x00};
    private static final byte[] FEED_LINE = {0x1B, 0x64, 0x03}; // 进纸3行
    private static final byte[] CUT_PAPER = {0x1D, (byte) 0x56, 0x00}; // 全切
    private static final byte[] PARTIAL_CUT = {0x1D, (byte) 0x56, 0x01}; // 半切
    private static final byte[] OPEN_CASHBOX = {0x1B, 0x70, 0x00, 0x19, (byte) 0xFA}; // 钱箱kick
    
    private BluetoothSocket bluetoothSocket;
    private OutputStream outputStream;
    private InputStream inputStream;
    private UsbDevice currentUsbDevice;
    private boolean isConnected = false;
    
    @Override
    public void load() {
        super.load();
        Log.d(TAG, "PrinterPlugin loaded");
    }
    
    @PluginMethod
    public void getBluetoothDevices(PluginCall call) {
        try {
            BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
            if (adapter == null) {
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("error", "设备不支持蓝牙");
                call.resolve(result);
                return;
            }
            
            Set<BluetoothDevice> pairedDevices = adapter.getBondedDevices();
            JSObject result = new JSObject();
            JSObject devices = new JSObject();
            
            for (BluetoothDevice device : pairedDevices) {
                JSObject deviceInfo = new JSObject();
                deviceInfo.put("name", device.getName());
                deviceInfo.put("address", device.getAddress());
                deviceInfo.put("type", "bluetooth");
                devices.put(device.getAddress(), deviceInfo);
            }
            
            result.put("success", true);
            result.put("devices", devices);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error getting Bluetooth devices", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }
    
    @PluginMethod
    public void connectBluetooth(PluginCall call) {
        String address = call.getString("address");
        
        if (address == null || address.isEmpty()) {
            call.reject("请提供蓝牙设备地址");
            return;
        }
        
        new Thread(() -> {
            try {
                BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
                BluetoothDevice device = adapter.getRemoteDevice(address);
                
                // 蓝牙串口服务 UUID
                UUID uuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
                bluetoothSocket = device.createRfcommSocketToServiceRecord(uuid);
                
                adapter.cancelDiscovery();
                bluetoothSocket.connect();
                
                outputStream = bluetoothSocket.getOutputStream();
                inputStream = bluetoothSocket.getInputStream();
                isConnected = true;
                
                // 初始化打印机
                outputStream.write(INIT);
                
                mainHandler.post(() -> {
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("message", "蓝牙打印机连接成功");
                    call.resolve(result);
                });
                
            } catch (Exception e) {
                Log.e(TAG, "Error connecting to Bluetooth printer", e);
                mainHandler.post(() -> {
                    JSObject result = new JSObject();
                    result.put("success", false);
                    result.put("error", e.getMessage());
                    call.resolve(result);
                });
            }
        }).start();
    }
    
    @PluginMethod
    public void connectUSB(PluginCall call) {
        try {
            Context context = bridge.getContext();
            UsbManager usbManager = (UsbManager) context.getSystemService(Context.USB_SERVICE);
            
            HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
            
            if (deviceList.isEmpty()) {
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("error", "未发现USB打印机");
                call.resolve(result);
                return;
            }
            
            // 获取第一个USB设备
            Map.Entry<String, UsbDevice> entry = deviceList.entrySet().iterator().next();
            currentUsbDevice = entry.getValue();
            
            // 请求USB权限
            if (!usbManager.hasPermission(currentUsbDevice)) {
                PendingResult<PermissionRequestResult> permissionResult = 
                    usbManager.requestPermission(currentUsbDevice, getPendingResult());
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("message", "已请求USB权限");
                result.put("device", currentUsbDevice.getDeviceName());
                call.resolve(result);
            } else {
                isConnected = true;
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("message", "USB打印机连接成功");
                result.put("device", currentUsbDevice.getDeviceName());
                call.resolve(result);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error connecting USB printer", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }
    
    @PluginMethod
    public void disconnect(PluginCall call) {
        try {
            if (bluetoothSocket != null) {
                bluetoothSocket.close();
                bluetoothSocket = null;
            }
            if (outputStream != null) {
                outputStream.close();
                outputStream = null;
            }
            if (inputStream != null) {
                inputStream.close();
                inputStream = null;
            }
            isConnected = false;
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "打印机已断开");
            call.resolve(result);
            
        } catch (Exception e) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }
    
    @PluginMethod
    public void printText(PluginCall call) {
        if (!isConnected) {
            call.reject("打印机未连接");
            return;
        }
        
        String text = call.getString("text", "");
        String align = call.getString("align", "left");
        boolean bold = call.getBoolean("bold", false);
        boolean doubleHeight = call.getBoolean("doubleHeight", false);
        boolean doubleWidth = call.getBoolean("doubleWidth", false);
        boolean underline = call.getBoolean("underline", false);
        
        try {
            // 设置对齐方式
            switch (align) {
                case "center":
                    outputStream.write(ALIGN_CENTER);
                    break;
                case "right":
                    outputStream.write(ALIGN_RIGHT);
                    break;
                default:
                    outputStream.write(ALIGN_LEFT);
            }
            
            // 设置样式
            if (bold) outputStream.write(BOLD_ON);
            if (underline) outputStream.write(UNDERLINE_ON);
            if (doubleHeight && doubleWidth) outputStream.write(DOUBLE_ON);
            else if (doubleHeight) outputStream.write(DOUBLE_HEIGHT_ON);
            else if (doubleWidth) outputStream.write(DOUBLE_WIDTH_ON);
            
            // 打印文字
            outputStream.write(text.getBytes("GBK"));
            
            // 恢复默认样式
            if (bold) outputStream.write(BOLD_OFF);
            if (underline) outputStream.write(UNDERLINE_OFF);
            if (doubleHeight || doubleWidth) outputStream.write(NORMAL_SIZE);
            
            outputStream.flush();
            
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error printing text", e);
            call.reject(e.getMessage());
        }
    }
    
    @PluginMethod
    public void printReceipt(PluginCall call) {
        if (!isConnected) {
            call.reject("打印机未连接");
            return;
        }
        
        String receiptData = call.getString("receipt");
        
        if (receiptData == null || receiptData.isEmpty()) {
            call.reject("请提供小票数据");
            return;
        }
        
        try {
            // 初始化打印机
            outputStream.write(INIT);
            
            // 解析并打印JSON格式的小票数据
            // 实际实现需要解析JSON并调用printText
            
            // 进纸并切纸
            outputStream.write(FEED_LINE);
            outputStream.write(CUT_PAPER);
            
            outputStream.flush();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "小票打印完成");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error printing receipt", e);
            call.reject(e.getMessage());
        }
    }
    
    @PluginMethod
    public void printImage(PluginCall call) {
        if (!isConnected) {
            call.reject("打印机未连接");
            return;
        }
        
        String imageBase64 = call.getString("image");
        
        if (imageBase64 == null || imageBase64.isEmpty()) {
            call.reject("请提供图片数据");
            return;
        }
        
        new Thread(() -> {
            try {
                // 解码Base64图片
                byte[] imageBytes = android.util.Base64.decode(imageBase64, android.util.Base64.DEFAULT);
                Bitmap bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.length);
                
                if (bitmap == null) {
                    mainHandler.post(() -> call.reject("图片解码失败"));
                    return;
                }
                
                // 压缩图片到打印机宽度（384像素）
                int printWidth = 384;
                float ratio = (float) printWidth / bitmap.getWidth();
                int height = (int) (bitmap.getHeight() * ratio);
                Bitmap scaledBitmap = Bitmap.createScaledBitmap(bitmap, printWidth, height, true);
                
                // 转换为字节数据
                byte[] imageData = bitmapToByteArray(scaledBitmap);
                
                // 发送图片打印命令
                outputStream.write(ESC);
                outputStream.write(0x2A); // *
                outputStream.write((byte) (printWidth % 256));
                outputStream.write((byte) (printWidth / 256));
                outputStream.write(imageData);
                
                outputStream.write(FEED_LINE);
                outputStream.flush();
                
                // 清理
                bitmap.recycle();
                scaledBitmap.recycle();
                
                mainHandler.post(() -> {
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("message", "图片打印完成");
                    call.resolve(result);
                });
                
            } catch (Exception e) {
                Log.e(TAG, "Error printing image", e);
                mainHandler.post(() -> call.reject(e.getMessage()));
            }
        }).start();
    }
    
    @PluginMethod
    public void openCashbox(PluginCall call) {
        if (!isConnected) {
            call.reject("打印机未连接");
            return;
        }
        
        try {
            // 钱箱kick命令
            outputStream.write(OPEN_CASHBOX);
            outputStream.flush();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "钱箱已打开");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error opening cashbox", e);
            call.reject(e.getMessage());
        }
    }
    
    @PluginMethod
    public void feedPaper(PluginCall call) {
        if (!isConnected) {
            call.reject("打印机未连接");
            return;
        }
        
        int lines = call.getInt("lines", 3);
        
        try {
            outputStream.write(ESC);
            outputStream.write(0x64); // d
            outputStream.write((byte) lines);
            outputStream.flush();
            
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
    
    @PluginMethod
    public void cutPaper(PluginCall call) {
        if (!isConnected) {
            call.reject("打印机未连接");
            return;
        }
        
        boolean partial = call.getBoolean("partial", false);
        
        try {
            if (partial) {
                outputStream.write(PARTIAL_CUT);
            } else {
                outputStream.write(CUT_PAPER);
            }
            outputStream.flush();
            
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
    
    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("connected", isConnected);
        result.put("type", bluetoothSocket != null ? "bluetooth" : (currentUsbDevice != null ? "usb" : "none"));
        call.resolve(result);
    }
    
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        try {
            disconnect(null);
        } catch (Exception e) {
            Log.e(TAG, "Error cleaning up printer", e);
        }
    }
    
    /**
     * 将Bitmap转换为打印机可用的字节数组
     */
    private byte[] bitmapToByteArray(Bitmap bitmap) {
        int width = bitmap.getWidth();
        int height = bitmap.getHeight();
        
        // 每行字节数（8像素=1字节）
        int bytesPerRow = width / 8;
        
        byte[] data = new byte[bytesPerRow * height];
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < bytesPerRow; x++) {
                byte b = 0;
                for (int bit = 0; bit < 8; bit++) {
                    int px = x * 8 + bit;
                    int py = y;
                    
                    if (px < width && py < height) {
                        int pixel = bitmap.getPixel(px, py);
                        int r = (pixel >> 16) & 0xFF;
                        int g = (pixel >> 8) & 0xFF;
                        int bVal = pixel & 0xFF;
                        
                        // 转换为灰度
                        int gray = (r * 30 + g * 59 + bVal * 11) / 100;
                        
                        // 黑色=1，白色=0
                        if (gray < 128) {
                            b |= (1 << (7 - bit));
                        }
                    }
                }
                data[y * bytesPerRow + x] = b;
            }
        }
        
        return data;
    }
    
    private android.os.Handler mainHandler = new android.os.Handler(android.os.Looper.getMainLooper());
}
