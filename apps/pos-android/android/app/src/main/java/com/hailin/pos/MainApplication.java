package com.hailin.pos;

import android.app.Application;
import android.content.Context;

import com.getcapacitor.core.CapConfig;
import com.getcapacitor.core.Capacitor;

public class MainApplication extends Application {
    
    @Override
    public void onCreate() {
        super.onCreate();
        
        // 初始化 Capacitor
        Capacitor.setInitialScale(1.0);
        
        // 允许 HTTP 明文传输（开发调试用）
        Capacitor.setConfig(new CapConfig(this)
            .setAllowMixedContent(true)
            .setAllowWebViewDebugging(true)
            .setBackgroundColor("#1a1a2e")
            .setServerHostname("localhost")
        );
    }
}
