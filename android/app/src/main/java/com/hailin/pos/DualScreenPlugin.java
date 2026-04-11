package com.hailin.pos;

import android.app.Presentation;
import android.content.Context;
import android.content.Intent;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Display;
import android.view.View;
import android.webkit.WebView;

import com.getcapacitor.Bridge;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;

@CapacitorPlugin(name = "DualScreen")
public class DualScreenPlugin extends Plugin {
    
    private static final String ACTION_OPEN = "open";
    private static final String ACTION_CLOSE = "close";
    private static final String ACTION_SEND_DATA = "sendData";
    private static final String ACTION_GET_STATUS = "getStatus";
    private static final String ACTION_GET_DISPLAYS = "getDisplays";
    
    private CustomerPresentation currentPresentation = null;
    private WebView presentationWebView = null;
    private boolean isPresentationShowing = false;
    
    @Override
    public void load() {
        super.load();
        // 检测当前设备屏幕信息
        detectScreens();
    }
    
    @PluginMethod
    public void getDisplays(PluginCall call) {
        Display[] displays = getActivity().getWindowManager().getDisplays();
        JSObject result = new JSObject();
        JSObject displaysResult = new JSObject();
        
        for (int i = 0; i < displays.length; i++) {
            Display display = displays[i];
            JSObject displayInfo = new JSObject();
            displayInfo.put("id", display.getDisplayId());
            displayInfo.put("name", display.getName());
            displayInfo.put("width", display.getWidth());
            displayInfo.put("height", display.getHeight());
            displayInfo.put("isPrimary", (display.getDisplayId() == Display.DEFAULT_DISPLAY));
            displaysResult.put("display_" + i, displayInfo);
        }
        
        result.put("displays", displaysResult);
        result.put("count", displays.length);
        result.put("isDualScreen", displays.length > 1);
        
        call.resolve(result);
    }
    
    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url", "");
        int displayId = call.getInt("displayId", -1);
        
        try {
            // 获取目标显示器
            Display[] displays = getActivity().getWindowManager().getDisplays();
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
                // 没有外接显示器，创建一个悬浮窗口
                call.resolve(createResult(true, "未检测到外接显示器，将在主屏创建客显屏视图"));
                return;
            }
            
            // 关闭之前的客显屏
            if (currentPresentation != null) {
                currentPresentation.dismiss();
            }
            
            // 创建客显屏Presentation
            currentPresentation = new CustomerPresentation(getContext(), targetDisplay);
            presentationWebView = currentPresentation.getWebView();
            
            // 加载客显屏页面
            if (url.isEmpty()) {
                // 使用默认的客显屏页面
                url = getBridge().getWebView().getUrl();
                if (url != null && url.contains("/pos")) {
                    url = url.replace("/pos", "/pos/customer-display");
                } else {
                    url = getContext().getPackageResourcePath() + "/assets/index.html/pos/customer-display";
                }
            }
            
            // 修正URL路径
            String baseUrl = bridge.getWebView().getUrl();
            if (baseUrl != null) {
                String base = baseUrl.substring(0, baseUrl.indexOf("/", baseUrl.indexOf("//") + 2));
                if (url.startsWith("/")) {
                    url = base + url;
                }
            }
            
            presentationWebView.loadUrl(url);
            currentPresentation.show();
            isPresentationShowing = true;
            
            JSObject result = createResult(true, "客显屏已打开在副屏");
            result.put("displayId", targetDisplay.getDisplayId());
            result.put("displayName", targetDisplay.getName());
            call.resolve(result);
            
        } catch (Exception e) {
            JSObject error = createResult(false, "打开客显屏失败: " + e.getMessage());
            call.reject("Failed to open customer display", e);
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
            
            JSObject result = createResult(true, "客显屏已关闭");
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("Failed to close customer display", e);
        }
    }
    
    @PluginMethod
    public void sendData(PluginCall call) {
        String data = call.getString("data", "");
        
        if (presentationWebView == null || !isPresentationShowing) {
            JSObject error = createResult(false, "客显屏未打开");
            call.reject("Customer display not open");
            return;
        }
        
        try {
            // 通过JavaScript注入方式发送数据
            String js = "if(window.dispatchEvent) { window.dispatchEvent(new CustomEvent('customerDisplayData', {detail: " + data + "})); }";
            presentationWebView.evaluateJavascript(js, null);
            
            JSObject result = createResult(true, "数据已发送");
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("Failed to send data", e);
        }
    }
    
    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = createResult(true, "ok");
        result.put("isOpen", isPresentationShowing);
        result.put("hasPresentation", currentPresentation != null);
        call.resolve(result);
    }
    
    private void detectScreens() {
        Display[] displays = getActivity().getWindowManager().getDisplays();
        android.util.Log.d("DualScreenPlugin", "检测到 " + displays.length + " 个显示器");
        
        for (Display display : displays) {
            android.util.Log.d("DualScreenPlugin", 
                "屏幕: " + display.getName() + 
                " (" + display.getWidth() + "x" + display.getHeight() + ")");
        }
    }
    
    private JSObject createResult(boolean success, String message) {
        JSObject result = new JSObject();
        result.put("success", success);
        result.put("message", message);
        return result;
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
