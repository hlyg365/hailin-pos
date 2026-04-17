package com.hailin.pos;

import android.os.Bundle;
import android.view.WindowManager;
import android.content.Intent;
import android.hardware.usb.UsbManager;
import android.os.Build;

import com.getcapacitor.BridgeActivity;
import com.hailin.pos.hardware.SerialPortPlugin;
import com.hailin.pos.hardware.PrinterPlugin;
import com.hailin.pos.hardware.CashDrawerPlugin;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 保持屏幕常亮（一体机需要）
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // 隐藏系统导航栏（全屏模式）
        hideSystemUI();
        
        // 初始化USB权限
        checkUsbPermissions();
        
        // 注册插件
        registerPlugin(SerialPortPlugin.class);
        registerPlugin(PrinterPlugin.class);
        registerPlugin(CashDrawerPlugin.class);
    }
    
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }
    
    private void hideSystemUI() {
        // 全屏沉浸模式
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
            );
        }
    }
    
    private void checkUsbPermissions() {
        UsbManager usbManager = (UsbManager) getSystemService(USB_SERVICE);
        // USB权限将在插件中动态请求
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // 处理外部Intent（如USB设备插入）
        setIntent(intent);
    }
}
