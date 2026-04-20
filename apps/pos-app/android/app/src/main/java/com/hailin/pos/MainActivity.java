package com.hailin.pos;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.Bridge;

public class MainActivity extends BridgeActivity {
    
    private static final String TAG = "MainActivity";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.i(TAG, "=== HailinHardware APP 启动中 ===");
        Log.i(TAG, "包名: " + getPackageName());
        
        // 打印Bridge状态
        try {
            Bridge bridge = getBridge();
            if (bridge != null) {
                Log.i(TAG, "Bridge已初始化");
                // 检查已注册的插件
                try {
                    java.lang.reflect.Field pluginField = Bridge.class.getDeclaredField("pluginMap");
                    pluginField.setAccessible(true);
                    @SuppressWarnings("unchecked")
                    java.util.Map<String, Plugin> pluginMap = (java.util.Map<String, Plugin>) pluginField.get(bridge);
                    Log.i(TAG, "已注册插件数量: " + pluginMap.size());
                    for (String name : pluginMap.keySet()) {
                        Log.i(TAG, "  已注册: " + name);
                    }
                } catch (Exception e) {
                    Log.w(TAG, "无法获取插件列表: " + e.getMessage());
                }
            } else {
                Log.w(TAG, "Bridge未初始化!");
            }
        } catch (Exception e) {
            Log.e(TAG, "检查Bridge失败: " + e.getMessage());
        }
        
        // 手动注册自定义插件（双重保险）
        registerPlugins();
        
        // 延迟检查插件是否注册成功
        new android.os.Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                checkPluginsRegistered();
            }
        }, 2000);
    }
    
    private void registerPlugins() {
        try {
            // 注册HailinHardware硬件插件
            registerPlugin(HailinHardwarePlugin.class);
            Log.i(TAG, "HailinHardwarePlugin 注册完成");
        } catch (Exception e) {
            Log.e(TAG, "HailinHardwarePlugin 注册失败: " + e.getMessage(), e);
        }
        
        try {
            // 注册TTS语音插件
            registerPlugin(TTSPlugin.class);
            Log.i(TAG, "TTSPlugin 注册完成");
        } catch (Exception e) {
            Log.e(TAG, "TTSPlugin 注册失败: " + e.getMessage(), e);
        }
    }
    
    private void checkPluginsRegistered() {
        try {
            Bridge bridge = getBridge();
            if (bridge != null) {
                java.lang.reflect.Field pluginField = Bridge.class.getDeclaredField("pluginMap");
                pluginField.setAccessible(true);
                @SuppressWarnings("unchecked")
                java.util.Map<String, Plugin> pluginMap = (java.util.Map<String, Plugin>) pluginField.get(bridge);
                Log.i(TAG, "=== 延迟2秒后检查 ===");
                Log.i(TAG, "已注册插件数量: " + pluginMap.size());
                for (String name : pluginMap.keySet()) {
                    Log.i(TAG, "  已注册: " + name);
                }
                
                // 检查HailinHardware是否已注册
                if (pluginMap.containsKey("HailinHardware")) {
                    Log.i(TAG, "✓ HailinHardware 插件已就绪!");
                } else {
                    Log.e(TAG, "✗ HailinHardware 插件未注册!");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "检查插件失败: " + e.getMessage(), e);
        }
    }
}
