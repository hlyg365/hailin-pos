package com.hailin.pos;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.i("MainActivity", "HailinHardware APP启动中...");
        
        // 注意：HailinHardwarePlugin通过@CapacitorPlugin注解自动注册
        // Capacitor框架会自动发现并注册所有标注了@CapacitorPlugin的插件
        Log.i("MainActivity", "插件自动注册已启用");
    }
}
