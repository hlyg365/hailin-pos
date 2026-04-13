package com.hailin.pos;

import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 在super之前设置启动路径
        getIntent().putExtra("com.capacitor.startPath", "/pos/cashier");
        super.onCreate(savedInstanceState);
        
        // 保持屏幕常亮（收银机需要）
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
}
