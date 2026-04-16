package com.hailin.cashier;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.os.Build;
import android.util.Log;

import com.hailin.cashier.plugin.PrinterPlugin;
import com.hailin.cashier.plugin.ScalePlugin;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * USB设备服务
 * 统一管理所有USB设备，包括打印机、扫码枪、电子秤等
 */
public class UsbDeviceService {
    private static final String TAG = "UsbDeviceService";
    
    private static UsbDeviceService instance;
    
    private UsbManager usbManager;
    private Context context;
    
    // 设备回调
    private Map<String, UsbDeviceCallback> deviceCallbacks = new ConcurrentHashMap<>();
    
    // 已连接的设备
    private Map<String, UsbDevice> connectedDevices = new ConcurrentHashMap<>();
    
    // USB权限请求回调
    private PermissionCallback permissionCallback;
    private String pendingDeviceName;
    
    // USB设备变化广播接收器
    private BroadcastReceiver usbReceiver;
    
    // 已注册的设备类型
    public static final String DEVICE_TYPE_PRINTER = "printer";
    public static final String DEVICE_TYPE_SCALE = "scale";
    public static final String DEVICE_TYPE_SCANNER = "scanner";
    public static final String DEVICE_TYPE_CASHBOX = "cashbox";
    
    // 已知设备PID/VID
    private static final Map<String, DeviceInfo> KNOWN_DEVICES = new ConcurrentHashMap<>();
    
    static {
        // 打印机
        KNOWN_DEVICES.put("1D:0483", new DeviceInfo("打印机", DEVICE_TYPE_PRINTER));
        KNOWN_DEVICES.put("0471:0815", new DeviceInfo("飞利浦打印机", DEVICE_TYPE_PRINTER));
        KNOWN_DEVICES.put("04B8:0202", new DeviceInfo("爱普生打印机", DEVICE_TYPE_PRINTER));
        KNOWN_DEVICES.put("04E6:0006", new DeviceInfo("Star打印机", DEVICE_TYPE_PRINTER));
        KNOWN_DEVICES.put("067B:2305", new DeviceInfo("USB转串口", DEVICE_TYPE_PRINTER));
        KNOWN_DEVICES.put("10C4:EA60", new DeviceInfo("CP2102串口", DEVICE_TYPE_PRINTER));
        
        // 电子秤
        KNOWN_DEVICES.put("0483:5740", new DeviceInfo("电子秤", DEVICE_TYPE_SCALE));
        KNOWN_DEVICES.put("1A86:7523", new DeviceInfo("CH340电子秤", DEVICE_TYPE_SCALE));
        
        // 扫码枪
        KNOWN_DEVICES.put("05E0:1300", new DeviceInfo("Symbol扫码枪", DEVICE_TYPE_SCANNER));
        KNOWN_DEVICES.put("05E0:1200", new DeviceInfo("霍尼韦尔扫码枪", DEVICE_TYPE_SCANNER));
    }
    
    public interface UsbDeviceCallback {
        void onDeviceConnected(UsbDevice device);
        void onDeviceDisconnected(UsbDevice device);
        void onDeviceError(UsbDevice device, String error);
    }
    
    public interface PermissionCallback {
        void onPermissionGranted(UsbDevice device);
        void onPermissionDenied(UsbDevice device);
    }
    
    public static class DeviceInfo {
        public String name;
        public String type;
        
        public DeviceInfo(String name, String type) {
            this.name = name;
            this.type = type;
        }
    }
    
    private UsbDeviceService() {
    }
    
    public static synchronized UsbDeviceService getInstance() {
        if (instance == null) {
            instance = new UsbDeviceService();
        }
        return instance;
    }
    
    /**
     * 初始化服务
     */
    public void init(Context context) {
        this.context = context.getApplicationContext();
        this.usbManager = (UsbManager) context.getSystemService(Context.USB_SERVICE);
        
        registerUsbReceiver();
        
        Log.d(TAG, "UsbDeviceService initialized");
    }
    
    /**
     * 注册USB设备变化广播接收器
     */
    private void registerUsbReceiver() {
        usbReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                
                if (UsbManager.ACTION_USB_DEVICE_ATTACHED.equals(action)) {
                    UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    if (device != null) {
                        handleDeviceConnected(device);
                    }
                } else if (UsbManager.ACTION_USB_DEVICE_DETACHED.equals(action)) {
                    UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    if (device != null) {
                        handleDeviceDisconnected(device);
                    }
                } else if (UsbManager.ACTION_USB_PERMISSION.equals(action)) {
                    UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    boolean granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false);
                    handlePermissionResult(device, granted);
                }
            }
        };
        
        IntentFilter filter = new IntentFilter();
        filter.addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED);
        filter.addAction(UsbManager.ACTION_USB_DEVICE_DETACHED);
        filter.addAction(UsbManager.ACTION_USB_PERMISSION);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(usbReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            context.registerReceiver(usbReceiver, filter);
        }
    }
    
    /**
     * 获取所有已连接的USB设备
     */
    public Map<String, UsbDevice> getConnectedDevices() {
        if (usbManager == null) {
            return new HashMap<>();
        }
        
        Map<String, UsbDevice> devices = usbManager.getDeviceList();
        connectedDevices.clear();
        connectedDevices.putAll(devices);
        
        return new HashMap<>(devices);
    }
    
    /**
     * 获取设备类型
     */
    public String getDeviceType(UsbDevice device) {
        String key = String.format("%04X:%04X", device.getVendorId(), device.getProductId());
        
        DeviceInfo info = KNOWN_DEVICES.get(key);
        if (info != null) {
            return info.type;
        }
        
        // 根据设备名称推断
        String name = device.getDeviceName().toLowerCase();
        if (name.contains("printer") || name.contains("print")) {
            return DEVICE_TYPE_PRINTER;
        } else if (name.contains("scale") || name.contains("秤")) {
            return DEVICE_TYPE_SCALE;
        } else if (name.contains("scanner") || name.contains("扫码")) {
            return DEVICE_TYPE_SCANNER;
        } else if (name.contains("cash") || name.contains("钱箱")) {
            return DEVICE_TYPE_CASHBOX;
        }
        
        return "unknown";
    }
    
    /**
     * 获取设备名称
     */
    public String getDeviceName(UsbDevice device) {
        String key = String.format("%04X:%04X", device.getVendorId(), device.getProductId());
        
        DeviceInfo info = KNOWN_DEVICES.get(key);
        if (info != null) {
            return info.name;
        }
        
        String productName = device.getProductName();
        if (productName != null && !productName.isEmpty()) {
            return productName;
        }
        
        String deviceName = device.getDeviceName();
        if (deviceName != null && !deviceName.isEmpty()) {
            return deviceName;
        }
        
        return "USB Device (" + key + ")";
    }
    
    /**
     * 请求USB设备权限
     */
    public void requestPermission(UsbDevice device, PermissionCallback callback) {
        if (usbManager == null) {
            callback.onPermissionDenied(device);
            return;
        }
        
        if (usbManager.hasPermission(device)) {
            callback.onPermissionGranted(device);
            return;
        }
        
        permissionCallback = callback;
        pendingDeviceName = device.getDeviceName();
        
        IntentFilter filter = new IntentFilter(UsbManager.ACTION_USB_PERMISSION);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            0,
            new Intent(UsbManager.ACTION_USB_PERMISSION),
            PendingIntent.FLAG_MUTABLE
        );
        
        usbManager.requestPermission(device, pendingIntent);
    }
    
    /**
     * 检查USB设备权限
     */
    public boolean hasPermission(UsbDevice device) {
        if (usbManager == null) {
            return false;
        }
        return usbManager.hasPermission(device);
    }
    
    /**
     * 注册设备回调
     */
    public void registerCallback(String deviceKey, UsbDeviceCallback callback) {
        deviceCallbacks.put(deviceKey, callback);
    }
    
    /**
     * 取消注册设备回调
     */
    public void unregisterCallback(String deviceKey) {
        deviceCallbacks.remove(deviceKey);
    }
    
    /**
     * 处理设备连接
     */
    private void handleDeviceConnected(UsbDevice device) {
        String key = getDeviceKey(device);
        Log.d(TAG, "USB Device connected: " + key);
        
        UsbDeviceCallback callback = deviceCallbacks.get(key);
        if (callback != null) {
            callback.onDeviceConnected(device);
        }
        
        // 检查并请求权限
        requestPermission(device, new PermissionCallback() {
            @Override
            public void onPermissionGranted(UsbDevice device) {
                Log.d(TAG, "Permission granted for: " + key);
                
                // 通知对应的插件
                String deviceType = getDeviceType(device);
                if (DEVICE_TYPE_PRINTER.equals(deviceType)) {
                    // PrinterPlugin.getInstance().onDeviceConnected(device);
                } else if (DEVICE_TYPE_SCALE.equals(deviceType)) {
                    // ScalePlugin.getInstance().onDeviceConnected(device);
                }
            }
            
            @Override
            public void onPermissionDenied(UsbDevice device) {
                Log.w(TAG, "Permission denied for: " + key);
            }
        });
    }
    
    /**
     * 处理设备断开
     */
    private void handleDeviceDisconnected(UsbDevice device) {
        String key = getDeviceKey(device);
        Log.d(TAG, "USB Device disconnected: " + key);
        
        UsbDeviceCallback callback = deviceCallbacks.get(key);
        if (callback != null) {
            callback.onDeviceDisconnected(device);
        }
        
        // 通知对应的插件
        String deviceType = getDeviceType(device);
        if (DEVICE_TYPE_PRINTER.equals(deviceType)) {
            // PrinterPlugin.getInstance().onDeviceDisconnected(device);
        } else if (DEVICE_TYPE_SCALE.equals(deviceType)) {
            // ScalePlugin.getInstance().onDeviceDisconnected(device);
        }
    }
    
    /**
     * 处理权限请求结果
     */
    private void handlePermissionResult(UsbDevice device, boolean granted) {
        if (device == null) {
            return;
        }
        
        String deviceName = device.getDeviceName();
        if (deviceName != null && deviceName.equals(pendingDeviceName) && permissionCallback != null) {
            if (granted) {
                permissionCallback.onPermissionGranted(device);
            } else {
                permissionCallback.onPermissionDenied(device);
            }
            permissionCallback = null;
            pendingDeviceName = null;
        }
    }
    
    /**
     * 获取设备唯一标识
     */
    public String getDeviceKey(UsbDevice device) {
        return String.format("%s_%d", device.getDeviceName(), device.getDeviceId());
    }
    
    /**
     * 列出所有USB设备
     */
    public String[] listDevices() {
        Map<String, UsbDevice> devices = getConnectedDevices();
        String[] deviceList = new String[devices.size()];
        
        int i = 0;
        for (Map.Entry<String, UsbDevice> entry : devices.entrySet()) {
            UsbDevice device = entry.getValue();
            String info = String.format("%s [%s:%s] %s",
                getDeviceName(device),
                String.format("%04X", device.getVendorId()),
                String.format("%04X", device.getProductId()),
                entry.getKey()
            );
            deviceList[i++] = info;
        }
        
        return deviceList;
    }
    
    /**
     * 打开USB设备
     */
    public android.hardware.usb.UsbDeviceConnection openDevice(UsbDevice device) {
        if (usbManager == null || device == null) {
            return null;
        }
        
        if (!usbManager.hasPermission(device)) {
            Log.w(TAG, "No permission for device");
            return null;
        }
        
        return usbManager.openDevice(device);
    }
    
    /**
     * 释放资源
     */
    public void release() {
        if (usbReceiver != null && context != null) {
            try {
                context.unregisterReceiver(usbReceiver);
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering receiver", e);
            }
            usbReceiver = null;
        }
        
        deviceCallbacks.clear();
        connectedDevices.clear();
        
        instance = null;
    }
}
