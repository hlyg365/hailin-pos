package com.hailin.pos;

import android.os.Bundle;
import android.view.WindowManager;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    private android.content.BroadcastReceiver usbReceiver;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 保持屏幕常亮
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // 创建USB广播接收器
        usbReceiver = new android.content.BroadcastReceiver() {
            @Override
            public void onReceive(android.content.Context context, Intent intent) {
                String action = intent.getAction();
                if (UsbManager.ACTION_USB_DEVICE_ATTACHED.equals(action)) {
                    android.util.Log.d("MainActivity", "USB设备已连接");
                } else if (UsbManager.ACTION_USB_DEVICE_DETACHED.equals(action)) {
                    android.util.Log.d("MainActivity", "USB设备已断开");
                }
            }
        };
        
        // 注册USB设备广播接收器
        IntentFilter filter = new IntentFilter(UsbManager.ACTION_USB_DEVICE_ATTACHED);
        filter.addAction(UsbManager.ACTION_USB_DEVICE_DETACHED);
        registerReceiver(usbReceiver, filter);
        
        // 注册原生插件
        registerPlugin(ScalePlugin.class);
        registerPlugin(PrinterPlugin.class);
        registerPlugin(DualScreenPlugin.class);
        registerPlugin(AppUpdatePlugin.class);
    }
    
    @Override
    protected void onDestroy() {
        // 取消注册广播接收器
        if (usbReceiver != null) {
            try {
                unregisterReceiver(usbReceiver);
            } catch (Exception e) {
                // 忽略未注册的异常
            }
        }
        super.onDestroy();
    }
}
