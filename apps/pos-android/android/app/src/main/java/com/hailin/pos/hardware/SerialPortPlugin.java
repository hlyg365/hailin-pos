package com.hailin.pos.hardware;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import io.github.mikeras73.UsbSerial.CdcAcmSerialDriver;
import io.github.mikeras73.UsbSerial.SerialInputStream;
import io.github.mikeras73.UsbSerial.SerialOutputStream;
import io.github.mikeras73.UsbSerial.UsbSerialDriver;
import io.github.mikeras73.UsbSerial.UsbSerialPort;
import io.github.mikeras73.UsbSerial.UsbSerialProber;

/**
 * 串口通信插件 - 支持USB转串口电子秤
 */
@NativePlugin(
    permissions = {"android.permission.INTERNET", "android.hardware.usb.host"}
)
public class SerialPortPlugin extends Plugin {
    
    private static final String TAG = "SerialPortPlugin";
    private static final String ACTION_USB_PERMISSION = "com.hailin.pos.USB_PERMISSION";
    
    private UsbManager usbManager;
    private UsbSerialPort serialPort;
    private SerialReaderThread readerThread;
    private String currentPortPath;
    
    @Override
    public void load() {
        super.load();
        usbManager = (UsbManager) context.getSystemService(Context.USB_SERVICE);
        
        // 注册USB权限广播
        IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(usbPermissionReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            context.registerReceiver(usbPermissionReceiver, filter);
        }
        
        Log.d(TAG, "SerialPortPlugin loaded");
    }
    
    @PluginMethod
    public void listPorts(PluginCall call) {
        try {
            HashMap<String, Object> result = new HashMap<>();
            
            // 获取USB设备列表
            HashMap<String, UsbDevice> devices = usbManager.getDeviceList();
            
            for (Map.Entry<String, UsbDevice> entry : devices.entrySet()) {
                UsbDevice device = entry.getValue();
                result.put(device.getDeviceName(), new SerialDeviceInfo(
                    device.getDeviceName(),
                    device.getVendorId(),
                    device.getProductId(),
                    device.getDeviceId()
                ).toMap());
            }
            
            JSObject ret = new JSObject();
            ret.put("ports", result.values());
            ret.put("count", result.size());
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "listPorts error", e);
            call.reject("Failed to list ports: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void connect(PluginCall call) {
        String portPath = call.getString("port");
        int baudRate = call.getInt("baudRate", 9600);
        
        if (portPath == null) {
            call.reject("Port path is required");
            return;
        }
        
        try {
            // 查找USB设备
            UsbDevice device = null;
            HashMap<String, UsbDevice> devices = usbManager.getDeviceList();
            for (UsbDevice d : devices.values()) {
                if (d.getDeviceName().equals(portPath)) {
                    device = d;
                    break;
                }
            }
            
            if (device == null) {
                call.reject("Device not found");
                return;
            }
            
            // 请求USB权限
            PendingIntent intent = PendingIntent.getBroadcast(
                context, 0, 
                new Intent(ACTION_USB_PERMISSION),
                PendingIntent.FLAG_IMMUTABLE
            );
            usbManager.requestPermission(device, intent);
            
            // 保存连接参数，等待权限回调
            pendingConnectCall = call;
            pendingBaudRate = baudRate;
            
        } catch (Exception e) {
            Log.e(TAG, "connect error", e);
            call.reject("Failed to connect: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void disconnect(PluginCall call) {
        try {
            if (readerThread != null) {
                readerThread.stop();
                readerThread = null;
            }
            if (serialPort != null) {
                serialPort.close();
                serialPort = null;
            }
            currentPortPath = null;
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Disconnect error: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void write(PluginCall call) {
        String data = call.getString("data");
        if (data == null) {
            call.reject("Data is required");
            return;
        }
        
        try {
            if (serialPort == null || !serialPort.isOpen()) {
                call.reject("Serial port not connected");
                return;
            }
            
            byte[] bytes = data.getBytes(StandardCharsets.UTF_8);
            serialPort.write(bytes, 1000);
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("bytesWritten", bytes.length);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Write error: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void getScaleReading(PluginCall call) {
        // 返回最新读取的秤数据
        if (lastScaleReading != null) {
            JSObject ret = new JSObject();
            ret.put("weight", lastScaleReading.weight);
            ret.put("unit", lastScaleReading.unit);
            ret.put("stable", lastScaleReading.stable);
            ret.put("raw", lastScaleReading.raw);
            call.resolve(ret);
        } else {
            call.reject("No reading available");
        }
    }
    
    private PluginCall pendingConnectCall;
    private int pendingBaudRate;
    private ScaleReading lastScaleReading;
    
    private final BroadcastReceiver usbPermissionReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (ACTION_USB_PERMISSION.equals(intent.getAction())) {
                synchronized (this) {
                    UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    
                    if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                        if (device != null && pendingConnectCall != null) {
                            openPort(device, pendingConnectCall, pendingBaudRate);
                        }
                    } else {
                        if (pendingConnectCall != null) {
                            pendingConnectCall.reject("USB permission denied");
                            pendingConnectCall = null;
                        }
                    }
                }
            }
        }
    };
    
    private void openPort(UsbDevice device, PluginCall call, int baudRate) {
        try {
            // 使用USB转串口库
            UsbSerialDriver driver = UsbSerialProber.getDefaultProber().probeDevice(device);
            if (driver == null) {
                // 尝试CDC/ACM驱动
                driver = new CdcAcmSerialDriver(device);
            }
            
            if (driver == null) {
                call.reject("No driver for this device");
                return;
            }
            
            UsbSerialPort port = driver.getPorts().get(0);
            port.open(device);
            port.setParameters(baudRate, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE);
            
            serialPort = port;
            currentPortPath = device.getDeviceName();
            
            // 启动读取线程
            readerThread = new SerialReaderThread(port);
            readerThread.start();
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("port", currentPortPath);
            call.resolve(ret);
            
            Log.d(TAG, "Serial port connected: " + currentPortPath);
            
        } catch (Exception e) {
            Log.e(TAG, "openPort error", e);
            call.reject("Failed to open port: " + e.getMessage());
        } finally {
            pendingConnectCall = null;
        }
    }
    
    private class SerialReaderThread extends Thread {
        private final UsbSerialPort port;
        private volatile boolean running = true;
        
        SerialReaderThread(UsbSerialPort port) {
            this.port = port;
        }
        
        @Override
        public void run() {
            byte[] buffer = new byte[1024];
            
            while (running && port.isOpen()) {
                try {
                    int len = port.read(buffer, 1000);
                    if (len > 0) {
                        String data = new String(buffer, 0, len, StandardCharsets.UTF_8);
                        processScaleData(data);
                    }
                } catch (IOException e) {
                    Log.e(TAG, "Read error", e);
                    break;
                }
            }
        }
        
        void stop() {
            running = false;
        }
    }
    
    private void processScaleData(String raw) {
        // 解析秤数据
        // 格式: "+01.250kg" 或 "01.250 kg"
        try {
            String trimmed = raw.trim();
            if (trimmed.matches("^[+-]?\\d+\\.\\d+\\s*kg$")) {
                String clean = trimmed.replace("kg", "").trim();
                double weight = Double.parseDouble(clean);
                boolean stable = !trimmed.startsWith("S") && !trimmed.startsWith("U");
                
                lastScaleReading = new ScaleReading(weight, "kg", stable, trimmed);
                
                // 发送到前端
                JSObject data = new JSObject();
                data.put("weight", weight);
                data.put("unit", "kg");
                data.put("stable", stable);
                data.put("raw", trimmed);
                notifyListeners("scaleData", data);
            }
        } catch (Exception e) {
            Log.w(TAG, "Parse scale data error: " + raw);
        }
    }
    
    private static class ScaleReading {
        double weight;
        String unit;
        boolean stable;
        String raw;
        
        ScaleReading(double weight, String unit, boolean stable, String raw) {
            this.weight = weight;
            this.unit = unit;
            this.stable = stable;
            this.raw = raw;
        }
    }
    
    private static class SerialDeviceInfo {
        String path;
        int vendorId;
        int productId;
        int deviceId;
        
        SerialDeviceInfo(String path, int vendorId, int productId, int deviceId) {
            this.path = path;
            this.vendorId = vendorId;
            this.productId = productId;
            this.deviceId = deviceId;
        }
        
        JSObject toMap() {
            JSObject map = new JSObject();
            map.put("path", path);
            map.put("vendorId", vendorId);
            map.put("productId", productId);
            map.put("deviceId", deviceId);
            return map;
        }
    }
    
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        try {
            context.unregisterReceiver(usbPermissionReceiver);
        } catch (Exception ignored) {}
    }
}
