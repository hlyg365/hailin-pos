package com.hailin.cashier;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.os.Build;
import android.util.Log;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * USB权限接收器
 * 用于处理USB设备权限请求和授权结果
 */
public class UsbPermissionReceiver extends BroadcastReceiver {
    private static final String TAG = "UsbPermissionReceiver";
    
    private static final String ACTION_USB_PERMISSION = "com.hailin.cashier.USB_PERMISSION";
    
    // 权限回调映射
    private static final Map<String, PermissionResultCallback> callbacks = new ConcurrentHashMap<>();
    
    // 已授权的设备缓存
    private static final Map<String, Boolean> authorizedDevices = new ConcurrentHashMap<>();
    
    public interface PermissionResultCallback {
        void onPermissionGranted(UsbDevice device);
        void onPermissionDenied(UsbDevice device);
    }
    
    public UsbPermissionReceiver() {
        super();
    }
    
    /**
     * 注册权限回调
     */
    public static void registerCallback(String deviceKey, PermissionResultCallback callback) {
        callbacks.put(deviceKey, callback);
    }
    
    /**
     * 取消注册权限回调
     */
    public static void unregisterCallback(String deviceKey) {
        callbacks.remove(deviceKey);
    }
    
    /**
     * 清除所有回调
     */
    public static void clearCallbacks() {
        callbacks.clear();
    }
    
    /**
     * 检查设备是否已授权
     */
    public static boolean isDeviceAuthorized(UsbDevice device) {
        if (device == null) {
            return false;
        }
        String key = getDeviceKey(device);
        return authorizedDevices.getOrDefault(key, false);
    }
    
    /**
     * 清除授权缓存
     */
    public static void clearAuthorizedCache() {
        authorizedDevices.clear();
    }
    
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        
        if (ACTION_USB_PERMISSION.equals(action)) {
            handlePermissionResult(context, intent);
        }
    }
    
    /**
     * 处理权限结果
     */
    private void handlePermissionResult(Context context, Intent intent) {
        UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
        boolean granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false);
        
        if (device == null) {
            Log.w(TAG, "Permission result: device is null");
            return;
        }
        
        String deviceKey = getDeviceKey(device);
        
        // 缓存授权结果
        authorizedDevices.put(deviceKey, granted);
        
        Log.d(TAG, "USB Permission " + (granted ? "granted" : "denied") + " for: " + deviceKey);
        
        // 调用对应的回调
        PermissionResultCallback callback = callbacks.get(deviceKey);
        if (callback != null) {
            if (granted) {
                callback.onPermissionGranted(device);
            } else {
                callback.onPermissionDenied(device);
            }
            // 回调执行后移除
            callbacks.remove(deviceKey);
        }
    }
    
    /**
     * 获取设备唯一标识
     */
    private static String getDeviceKey(UsbDevice device) {
        return String.format("%s_%d", device.getDeviceName(), device.getDeviceId());
    }
    
    /**
     * USB权限帮助类
     * 用于发送权限请求和等待授权结果
     */
    public static class PermissionHelper {
        private final Context context;
        private final UsbManager usbManager;
        
        public PermissionHelper(Context context) {
            this.context = context.getApplicationContext();
            this.usbManager = (UsbManager) context.getSystemService(Context.USB_SERVICE);
        }
        
        /**
         * 请求USB设备权限
         * 
         * @param device 目标设备
         * @param callback 权限结果回调
         */
        public void requestPermission(UsbDevice device, PermissionResultCallback callback) {
            if (usbManager == null) {
                Log.e(TAG, "UsbManager is null");
                if (callback != null) {
                    callback.onPermissionDenied(device);
                }
                return;
            }
            
            // 检查是否已有权限
            if (usbManager.hasPermission(device)) {
                Log.d(TAG, "Already has permission for device");
                authorizedDevices.put(getDeviceKey(device), true);
                if (callback != null) {
                    callback.onPermissionGranted(device);
                }
                return;
            }
            
            // 注册回调
            String deviceKey = getDeviceKey(device);
            if (callback != null) {
                registerCallback(deviceKey, callback);
            }
            
            // 创建PendingIntent用于接收授权结果
            Intent permissionIntent = new Intent(ACTION_USB_PERMISSION);
            PendingIntent pendingIntent;
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                pendingIntent = PendingIntent.getBroadcast(
                    context,
                    deviceKey.hashCode(),
                    permissionIntent,
                    PendingIntent.FLAG_MUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
                );
            } else {
                pendingIntent = PendingIntent.getBroadcast(
                    context,
                    deviceKey.hashCode(),
                    permissionIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT
                );
            }
            
            // 发送权限请求
            usbManager.requestPermission(device, pendingIntent);
            
            Log.d(TAG, "Permission request sent for: " + deviceKey);
        }
        
        /**
         * 同步请求USB设备权限（会阻塞）
         * 
         * @param device 目标设备
         * @param timeoutMs 超时时间（毫秒）
         * @return true=已授权，false=未授权或超时
         */
        public boolean requestPermissionSync(UsbDevice device, long timeoutMs) {
            final boolean[] result = {false};
            final boolean[] completed = {false};
            
            requestPermission(device, new PermissionResultCallback() {
                @Override
                public void onPermissionGranted(UsbDevice device) {
                    result[0] = true;
                    completed[0] = true;
                }
                
                @Override
                public void onPermissionDenied(UsbDevice device) {
                    result[0] = false;
                    completed[0] = true;
                }
            });
            
            // 等待结果
            long startTime = System.currentTimeMillis();
            while (!completed[0] && (System.currentTimeMillis() - startTime) < timeoutMs) {
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    break;
                }
            }
            
            return result[0];
        }
        
        /**
         * 检查USB设备是否有权限
         */
        public boolean hasPermission(UsbDevice device) {
            if (usbManager == null) {
                return false;
            }
            return usbManager.hasPermission(device);
        }
    }
    
    /**
     * 注册全局USB权限广播接收器
     * 
     * @param context 上下文
     * @return 注册的接收器，需要在适当时候取消注册
     */
    public static UsbPermissionReceiver register(Context context) {
        UsbPermissionReceiver receiver = new UsbPermissionReceiver();
        
        IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            context.registerReceiver(receiver, filter);
        }
        
        Log.d(TAG, "UsbPermissionReceiver registered");
        
        return receiver;
    }
    
    /**
     * 取消注册全局USB权限广播接收器
     * 
     * @param context 上下文
     * @param receiver 要取消注册的接收器
     */
    public static void unregister(Context context, UsbPermissionReceiver receiver) {
        if (receiver != null) {
            try {
                context.unregisterReceiver(receiver);
                Log.d(TAG, "UsbPermissionReceiver unregistered");
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering receiver", e);
            }
        }
    }
}
