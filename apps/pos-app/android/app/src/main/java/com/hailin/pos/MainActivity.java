package com.hailin.pos;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.i("MainActivity", "正在注册插件...");
        
        // 同步注册插件（不使用延迟）
        // Capacitor 会在 Bridge 初始化完成后自动调用插件注册
        try {
            registerPlugin(HailinHardwarePlugin.class);
            Log.i("MainActivity", "HailinHardwarePlugin 注册成功");
        } catch (Exception e) {
            Log.e("MainActivity", "HailinHardwarePlugin 注册失败: " + e.getMessage());
        }
        
        try {
            registerPlugin(TTSPlugin.class);
            Log.i("MainActivity", "TTSPlugin 注册成功");
        } catch (Exception e) {
            Log.e("MainActivity", "TTSPlugin 注册失败: " + e.getMessage());
        }
    }
}
