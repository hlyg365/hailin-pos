package com.hailin.pos;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 保持屏幕常亮
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // 全屏沉浸模式
        enableImmersiveMode();
        
        // 直接加载收银台页面
        loadCashierPage();
    }
    
    private void loadCashierPage() {
        final WebView webView = this.bridge.getWebView();
        
        // 设置WebViewClient，监听页面加载
        webView.setWebViewClient(new WebViewClient() {
            private boolean redirected = false;
            
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                
                // 如果还没有重定向，则执行
                if (!redirected) {
                    redirected = true;
                    
                    // 延迟一点确保JS已加载
                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        // 检查是否是404页面
                        checkAndRedirect(view);
                    }, 300);
                }
            }
        });
        
        // 直接加载收银台HTML页面
        webView.loadUrl("file:///android_asset/public/pos/cashier.html");
    }
    
    private void checkAndRedirect(WebView webView) {
        // 检查页面内容
        webView.evaluateJavascript(
            "(function() { " +
            "  var text = document.body ? document.body.innerText : ''; " +
            "  return text; " +
            "})();",
            (value) -> {
                if (value != null && (value.contains("找不到页面") || value.contains("404") || value.contains("Not Found"))) {
                    // 如果是404，尝试其他路径
                    redirectToCashier(webView);
                }
            }
        );
    }
    
    private void redirectToCashier(WebView webView) {
        // 尝试不同的路由格式
        String[] routes = {
            "file:///android_asset/public/index.html#/pos/cashier",
            "file:///android_asset/public/index.html#/pos/cashier.html",
        };
        
        for (String route : routes) {
            try {
                webView.loadUrl(route);
                return;
            } catch (Exception ignored) {}
        }
        
        // 最后尝试加载pos/cashier.html
        webView.loadUrl("file:///android_asset/public/pos/cashier.html");
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
