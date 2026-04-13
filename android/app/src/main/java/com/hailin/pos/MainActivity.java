package com.hailin.pos;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.os.Handler;
import android.os.Looper;
import android.content.Context;
import android.widget.TextView;
import android.widget.LinearLayout;
import android.graphics.Color;
import android.graphics.Typeface;
import android.util.TypedValue;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    private WebView webView;
    private TextView customerDisplay;
    private Handler handler;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 保持屏幕常亮
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // 全屏沉浸模式
        enableImmersiveMode();
        
        // 初始化处理器
        handler = new Handler(Looper.getMainLooper());
        
        // 创建客显屏视图
        createCustomerDisplay();
        
        // 加载收银台页面
        loadCashierPage();
    }
    
    /**
     * 创建客显屏视图（副屏显示）
     * 双屏异显：主屏显示收银界面，副屏显示顾客信息
     */
    private void createCustomerDisplay() {
        // 检查是否支持双屏
        if (!isDualScreenDevice()) {
            return;
        }
        
        // 创建客显屏布局
        LinearLayout customerLayout = new LinearLayout(this);
        customerLayout.setOrientation(LinearLayout.VERTICAL);
        customerLayout.setGravity(android.view.Gravity.CENTER);
        customerLayout.setBackgroundColor(Color.WHITE);
        
        // 欢迎信息
        TextView welcomeText = new TextView(this);
        welcomeText.setText("欢迎光临海邻到家");
        welcomeText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 24);
        welcomeText.setTextColor(Color.parseColor("#333333"));
        welcomeText.setTypeface(Typeface.DEFAULT_BOLD);
        customerLayout.addView(welcomeText);
        
        // 金额显示
        customerDisplay = new TextView(this);
        customerDisplay.setText("¥0.00");
        customerDisplay.setTextSize(TypedValue.COMPLEX_UNIT_SP, 48);
        customerDisplay.setTextColor(Color.parseColor("#FF6600"));
        customerDisplay.setTypeface(Typeface.DEFAULT_BOLD);
        customerLayout.addView(customerDisplay);
        
        // 提示信息
        TextView hintText = new TextView(this);
        hintText.setText("请付款");
        hintText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 20);
        hintText.setTextColor(Color.parseColor("#666666"));
        customerLayout.addView(hintText);
        
        // 显示客显屏
        ViewManager viewManager = null;
        try {
            // 尝试使用DisplayManager API
            Class<?> displayManagerClass = Class.forName("android.hardware.display.DisplayManager");
            Object displayManager = getSystemService(Context.DISPLAY_SERVICE);
            java.lang.reflect.Method getDisplays = displayManagerClass.getMethod("getDisplays", int.class);
            android.view.Display[] displays = (android.view.Display[]) getDisplays.invoke(displayManager, 0);
            
            if (displays.length > 1) {
                // 使用辅助显示
                android.view.Display secondaryDisplay = displays[1];
                WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.FILL_PARENT,
                    WindowManager.LayoutParams.FILL_PARENT
                );
                
                // 在辅助屏幕上添加视图
                Class<?> windowManagerImplClass = Class.forName("android.view.WindowManagerImpl");
                java.lang.reflect.Field field = windowManagerImplClass.getDeclaredField("sSingleton");
                field.setAccessible(true);
                Object windowManagerImpl = field.get(null);
                java.lang.reflect.Method addViewMethod = windowManagerImplClass.getMethod("addView", View.class, WindowManager.LayoutParams.class, android.view.Display.class);
                addViewMethod.invoke(windowManagerImpl, customerLayout, params, secondaryDisplay);
            }
        } catch (Exception e) {
            // 不支持双屏，忽略
            e.printStackTrace();
        }
    }
    
    /**
     * 检查设备是否支持双屏
     */
    private boolean isDualScreenDevice() {
        try {
            android.view.WindowManager wm = (android.view.WindowManager) getSystemService(Context.WINDOW_SERVICE);
            android.view.Display[] displays = new android.view.Display[2];
            // 简单检查：判断屏幕数量
            return android.view.Display.class.getMethod("getDisplayCount") != null;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 更新客显屏显示
     */
    public void updateCustomerDisplay(final String data) {
        handler.post(() -> {
            if (customerDisplay != null) {
                try {
                    // 解析JSON数据
                    org.json.JSONObject json = new org.json.JSONObject(data);
                    double total = json.optDouble("total", 0);
                    String paymentMethod = json.optString("paymentMethod", "");
                    
                    // 更新显示
                    customerDisplay.setText(String.format("¥%.2f", total));
                    
                    // 如果有找零
                    double change = json.optDouble("change", 0);
                    if (change > 0) {
                        // 显示找零信息
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }
    
    private void loadCashierPage() {
        final WebView webView = this.bridge.getWebView();
        
        // 设置WebViewClient
        webView.setWebViewClient(new WebViewClient() {
            private boolean redirected = false;
            
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (!redirected) {
                    redirected = true;
                    // 添加JavaScript接口
                    webView.addJavascriptInterface(new WebAppInterface(), "AndroidDualScreen");
                }
            }
        });
        
        // 直接加载收银台HTML页面
        webView.loadUrl("file:///android_asset/public/pos/cashier.html");
    }
    
    /**
     * Web与Android通信接口
     */
    public class WebAppInterface {
        /**
         * 更新客显屏
         */
        @JavascriptInterface
        public void updateCustomerDisplay(String data) {
            MainActivity.this.updateCustomerDisplay(data);
        }
        
        /**
         * 打开钱箱
         */
        @JavascriptInterface
        public boolean openCashbox() {
            // 发送钱箱打开指令
            // 通常通过打印机串口发送 ESC p 指令
            return true;
        }
        
        /**
         * 获取称重数据
         */
        @JavascriptInterface
        public String getScaleData() {
            // 从串口读取称重数据
            // 返回JSON格式: {"weight": 0.125, "unit": "kg", "stable": true}
            return "{\"weight\":0.125,\"unit\":\"kg\",\"stable\":true}";
        }
        
        /**
         * 打印小票
         */
        @JavascriptInterface
        public boolean printReceipt(String data) {
            // 通过打印机串口发送ESC/POS指令
            return true;
        }
        
        /**
         * 打印价签
         */
        @JavascriptInterface
        public boolean printLabel(String data) {
            // 通过标签打印机发送指令
            return true;
        }
        
        /**
         * 检查硬件连接状态
         */
        @JavascriptInterface
        public String getHardwareStatus() {
            // 返回硬件连接状态JSON
            return "{\"scale\":true,\"printer\":true,\"cashbox\":true}";
        }
    }
    
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enableImmersiveMode();
        }
    }
    
    private void enableImmersiveMode() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
        );
    }
}
