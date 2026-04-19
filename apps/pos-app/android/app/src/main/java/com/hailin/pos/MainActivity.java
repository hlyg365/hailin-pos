package com.hailin.pos;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import com.hailin.deviceplugin.HailinHardwarePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 手动注册 HailinHardware 原生插件
        registerPlugin(HailinHardwarePlugin.class);
    }
}
