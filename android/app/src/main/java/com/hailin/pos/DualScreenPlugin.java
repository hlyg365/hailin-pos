package com.hailin.pos;

import android.annotation.TargetApi;
import android.app.Presentation;
import android.content.Context;
import android.content.Intent;
import android.hardware.display.DisplayManager;
import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.View;
import android.webkit.WebView;

import com.getcapacitor.Bridge;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DualScreen")
public class DualScreenPlugin extends Plugin {
    
    private static final String TAG = "DualScreenPlugin";
    
    private CustomerPresentation currentPresentation = null;
    private WebView presentationWebView = null;
    private boolean isPresentationShowing = false;
    
    @Override
    public void load() {
        super.load();
    }
    
    @PluginMethod
    @TargetApi(Build.VERSION_CODES.R)
    public void getDisplays(PluginCall call) {
        JSObject result = new JSObject();
        
        try {
            Display[] displays = getDisplays();
            JSObject displaysResult = new JSObject();
            
            // 记录日志
            android.util.Log.i(TAG, "检测到显示器数量: " + displays.length);
            
            for (int i = 0; i < displays.length; i++) {
                Display display = displays[i];
                JSObject displayInfo = new JSObject();
                displayInfo.put("id", display.getDisplayId());
                displayInfo.put("name", display.getName());
                displayInfo.put("width", display.getWidth());
                displayInfo.put("height", display.getHeight());
                displayInfo.put("isPrimary", (display.getDisplayId() == Display.DEFAULT_DISPLAY));
                displayInfo.put("isExternal", (display.getFlags() & Display.FLAG_SECURE) == 0);
                displaysResult.put("display_" + i, displayInfo);
                
                android.util.Log.i(TAG, "显示器[" + i + "]: id=" + display.getDisplayId() 
                    + ", name=" + display.getName() 
                    + ", isPrimary=" + (display.getDisplayId() == Display.DEFAULT_DISPLAY)
                    + ", flags=" + display.getFlags());
            }
            
            result.put("displays", displaysResult);
            result.put("count", displays.length);
            result.put("isDualScreen", displays.length > 1);
            result.put("success", true);
            
            // 添加诊断信息
            result.put("hasExternalDisplay", displays.length > 1);
            result.put("primaryDisplayId", Display.DEFAULT_DISPLAY);
            
        } catch (Exception e) {
            android.util.Log.e(TAG, "getDisplays error", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("count", 1);
            result.put("isDualScreen", false);
        }
        
        call.resolve(result);
    }
    
    private Display[] getDisplays() {
        // 使用 DisplayManager API（兼容所有版本）
        android.hardware.display.DisplayManager dm = (android.hardware.display.DisplayManager) getContext().getSystemService(Context.DISPLAY_SERVICE);
        return dm.getDisplays();
    }
    
    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url", "");
        int displayId = call.getInt("displayId", -1);
        
        try {
            // 获取目标显示器
            Display[] displays = getDisplays();
            Display targetDisplay = null;
            
            if (displayId >= 0 && displayId < displays.length) {
                targetDisplay = displays[displayId];
            } else {
                // 默认选择第二个显示器
                for (Display display : displays) {
                    if (display.getDisplayId() != Display.DEFAULT_DISPLAY) {
                        targetDisplay = display;
                        break;
                    }
                }
            }
            
            if (targetDisplay == null) {
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("message", "未检测到外接显示器，将在主屏创建客显屏视图");
                call.resolve(result);
                return;
            }
            
            // 关闭之前的客显屏
            if (currentPresentation != null) {
                currentPresentation.dismiss();
            }
            
            // 创建客显屏Presentation
            currentPresentation = new CustomerPresentation(getContext(), targetDisplay);
            presentationWebView = currentPresentation.getWebView();
            
            // 修正URL路径
            String baseUrl = bridge.getWebView().getUrl();
            if (baseUrl != null && baseUrl.contains("/pos")) {
                if (baseUrl.contains("/customer-display")) {
                    url = baseUrl;
                } else {
                    int posIndex = baseUrl.indexOf("/pos");
                    url = baseUrl.substring(0, posIndex) + "/pos/customer-display";
                }
            } else {
                url = "/pos/customer-display";
            }
            
            presentationWebView.loadUrl(url);
            currentPresentation.show();
            isPresentationShowing = true;
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "客显屏已打开在副屏");
            result.put("displayId", targetDisplay.getDisplayId());
            result.put("displayName", targetDisplay.getName());
            call.resolve(result);
            
        } catch (Exception e) {
            JSObject error = new JSObject();
            error.put("success", false);
            error.put("message", "打开客显屏失败: " + e.getMessage());
            call.reject("Failed to open customer display");
        }
    }
    
    @PluginMethod
    public void close(PluginCall call) {
        try {
            if (currentPresentation != null) {
                currentPresentation.dismiss();
                currentPresentation = null;
                presentationWebView = null;
                isPresentationShowing = false;
            }
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "客显屏已关闭");
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("Failed to close customer display");
        }
    }
    
    @PluginMethod
    public void sendData(PluginCall call) {
        String data = call.getString("data", "");
        
        if (presentationWebView == null || !isPresentationShowing) {
            call.reject("Customer display not open");
            return;
        }
        
        try {
            // 通过JavaScript注入方式发送数据
            String js = "if(window.dispatchEvent) { window.dispatchEvent(new CustomEvent('customerDisplayData', {detail: " + data + "})); }";
            presentationWebView.evaluateJavascript(js, null);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "数据已发送");
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("Failed to send data");
        }
    }
    
    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("isOpen", isPresentationShowing);
        result.put("hasPresentation", currentPresentation != null);
        call.resolve(result);
    }
    
    // 内部类：客显屏Presentation
    private class CustomerPresentation extends Presentation {
        private WebView webView;
        
        public CustomerPresentation(Context context, Display display) {
            super(context, display);
        }
        
        @Override
        protected void onCreate(Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);
            
            // 创建全屏WebView
            webView = new WebView(getContext());
            webView.setLayoutParams(new android.view.ViewGroup.LayoutParams(
                android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                android.view.ViewGroup.LayoutParams.MATCH_PARENT
            ));
            
            // 配置WebView
            webView.getSettings().setJavaScriptEnabled(true);
            webView.getSettings().setDomStorageEnabled(true);
            webView.getSettings().setAllowFileAccess(true);
            webView.getSettings().setUseWideViewPort(true);
            webView.getSettings().setLoadWithOverviewMode(true);
            
            setContentView(webView);
        }
        
        public WebView getWebView() {
            return webView;
        }
    }
}
