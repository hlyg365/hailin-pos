package com.hailin.pos;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.app.Activity;
import android.content.Intent;
import android.content.Context;

/**
 * 客显屏Activity - 用于Android双屏收银机的副屏显示
 * 
 * 在双屏收银机上，此Activity会在副屏的全屏WebView中显示
 */
public class CustomerDisplayActivity extends Activity {
    
    private WebView webView;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 创建全屏WebView
        webView = new WebView(this);
        webView.setLayoutParams(new android.view.ViewGroup.LayoutParams(
            android.view.ViewGroup.LayoutParams.MATCH_PARENT,
            android.view.ViewGroup.LayoutParams.MATCH_PARENT
        ));
        
        // 配置WebView
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // 设置WebViewClient
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // 页面加载完成后隐藏进度条
            }
        });
        
        setContentView(webView);
        
        // 获取传入的URL
        Intent intent = getIntent();
        String url = intent.getStringExtra("url");
        
        if (url == null || url.isEmpty()) {
            // 默认加载客显屏页面
            url = "file:///android_asset/public/pos/customer-display.html";
        }
        
        // 检查URL是否是相对路径
        if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("file://")) {
            url = "file:///android_asset/public/" + url;
        }
        
        webView.loadUrl(url);
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        
        // 处理新的数据
        String data = intent.getStringExtra("data");
        if (data != null && webView != null) {
            String js = "if(window.updateCustomerDisplay) { window.updateCustomerDisplay(" + data + "); }";
            webView.evaluateJavascript(js, null);
        }
    }
    
    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
