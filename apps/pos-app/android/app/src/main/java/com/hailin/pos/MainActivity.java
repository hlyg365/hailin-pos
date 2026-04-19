package com.hailin.pos;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 手动注册 HailinHardware 原生插件
        registerPlugin(HailinHardwarePlugin.class);
        Log.i("MainActivity", "HailinHardwarePlugin 已注册");
    }
}
