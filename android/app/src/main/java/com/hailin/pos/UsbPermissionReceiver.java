package com.hailin.pos;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.util.Log;

/**
 * USB设备权限广播接收器
 * 
 * 用于处理USB设备权限请求的响应
 */
public class UsbPermissionReceiver extends BroadcastReceiver {
    
    private static final String TAG = "UsbPermissionReceiver";
    public static final String ACTION_USB_PERMISSION = "com.hailin.pos.USB_PERMISSION";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        
        if (ACTION_USB_PERMISSION.equals(action)) {
            synchronized (this) {
                UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                
                if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                    if (device != null) {
                        Log.d(TAG, "USB permission granted for: " + device.getDeviceName());
                        
                        // 权限已授予，可以通过插件继续连接设备
                        Intent serviceIntent = new Intent(context, UsbDeviceService.class);
                        serviceIntent.setAction("connect");
                        serviceIntent.putExtra(UsbManager.EXTRA_DEVICE, device);
                        context.startService(serviceIntent);
                    }
                } else {
                    Log.d(TAG, "USB permission denied for: " + (device != null ? device.getDeviceName() : "null"));
                }
            }
        }
    }
}
