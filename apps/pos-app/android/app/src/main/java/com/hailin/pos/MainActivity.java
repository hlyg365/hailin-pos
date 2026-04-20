package com.hailin.pos;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 在 Bridge 初始化后注册插件
        new Handler(getMainLooper()).postDelayed(() -> {
            try {
                // 尝试动态注册插件
                PluginHandle handle = bridge.getPlugin("HailinHardware");
                if (handle == null) {
                    // 插件尚未加载，尝试注册
                    registerPlugin(HailinHardwarePlugin.class);
                    Log.i("MainActivity", "HailinHardwarePlugin 动态注册完成");
                } else {
                    Log.i("MainActivity", "HailinHardwarePlugin 已存在");
                }
            } catch (Exception e) {
                Log.e("MainActivity", "注册 HailinHardware 失败: " + e.getMessage());
            }
            
            try {
                PluginHandle handle = bridge.getPlugin("TTS");
                if (handle == null) {
                    registerPlugin(TTSPlugin.class);
                    Log.i("MainActivity", "TTSPlugin 动态注册完成");
                }
            } catch (Exception e) {
                Log.e("MainActivity", "注册 TTS 失败: " + e.getMessage());
            }
        }, 500); // 延迟 500ms 确保 Bridge 完全初始化
    }
}
