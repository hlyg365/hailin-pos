package com.hailin.pos;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 延迟注册插件，确保 Bridge 完全初始化
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            Log.i("MainActivity", "开始注册插件...");
            
            // 注册 HailinHardware 插件
            try {
                registerPlugin(HailinHardwarePlugin.class);
                Log.i("MainActivity", "HailinHardwarePlugin 注册成功");
            } catch (Exception e) {
                Log.e("MainActivity", "HailinHardwarePlugin 注册失败: " + e.getMessage());
            }
            
            // 注册 TTS 插件
            try {
                registerPlugin(TTSPlugin.class);
                Log.i("MainActivity", "TTSPlugin 注册成功");
            } catch (Exception e) {
                Log.e("MainActivity", "TTSPlugin 注册失败: " + e.getMessage());
            }
        }, 1000); // 延迟 1 秒确保 Bridge 完全初始化
    }
}
