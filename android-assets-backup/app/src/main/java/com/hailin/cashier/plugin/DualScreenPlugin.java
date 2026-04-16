package com.hailin.cashier.plugin;

import android.app.Activity;
import android.content.Intent;
import android.hardware.display.DisplayManager;
import android.hardware.display.WifiDisplay;
import android.hardware.display.WifiDisplayStatus;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Display;
import android.view.View;
import android.widget.TextView;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import java.util.HashMap;
import java.util.Map;

public class DualScreenPlugin extends Plugin {
    private static final String TAG = "DualScreenPlugin";
    
    private Activity mainActivity;
    private Activity customerDisplayActivity;
    private boolean isConnected = false;
    private String currentWifiDisplay = null;
    private Handler mainHandler;
    
    // 缓存最后一次显示的内容
    private Map<String, String> displayCache = new HashMap<>();
    
    public DualScreenPlugin() {
        mainHandler = new Handler(Looper.getMainLooper());
    }
    
    @Override
    public void load() {
        super.load();
        Log.d(TAG, "DualScreenPlugin loaded");
        
        mainActivity = bridge.getActivity();
        
        // 注册屏幕变化监听
        registerDisplayListener();
    }
    
    @PluginMethod
    public void getDisplays(PluginCall call) {
        try {
            DisplayManager displayManager = (DisplayManager) 
                mainActivity.getSystemService(Activity.DISPLAY_SERVICE);
            
            Display[] displays = displayManager.getDisplays();
            
            JSObject result = new JSObject();
            JSObject displayList = new JSObject();
            
            for (int i = 0; i < displays.length; i++) {
                Display display = displays[i];
                JSObject displayInfo = new JSObject();
                displayInfo.put("id", display.getDisplayId());
                displayInfo.put("name", display.getName());
                displayInfo.put("width", display.getWidth());
                displayInfo.put("height", display.getHeight());
                displayInfo.put("isSecure", display.isSecure());
                displayInfo.put("isPrimary", i == 0);
                
                displayList.put(String.valueOf(i), displayInfo);
            }
            
            result.put("success", true);
            result.put("displays", displayList);
            result.put("count", displays.length);
            
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error getting displays", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }
    
    @PluginMethod
    public void openCustomerDisplay(PluginCall call) {
        try {
            Intent intent = new Intent(mainActivity, CustomerDisplayActivity.class);
            mainActivity.startActivity(intent);
            
            isConnected = true;
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "客显屏已打开");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error opening customer display", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }
    
    @PluginMethod
    public void closeCustomerDisplay(PluginCall call) {
        try {
            if (customerDisplayActivity != null) {
                customerDisplayActivity.finish();
                customerDisplayActivity = null;
            }
            
            isConnected = false;
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "客显屏已关闭");
            call.resolve(result);
            
        } catch (Exception e) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }
    
    @PluginMethod
    public void showWelcome(PluginCall call) {
        String title = call.getString("title", "欢迎光临");
        String subtitle = call.getString("subtitle", "请扫描商品");
        
        displayCache.put("title", title);
        displayCache.put("subtitle", subtitle);
        
        updateCustomerDisplay();
        
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }
    
    @PluginMethod
    public void showAmount(PluginCall call) {
        double amount = call.getDouble("amount", 0);
        String orderNo = call.getString("orderNo", "");
        
        displayCache.put("amount", String.format("%.2f", amount));
        displayCache.put("orderNo", orderNo);
        displayCache.put("type", "amount");
        
        updateCustomerDisplay();
        
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }
    
    @PluginMethod
    public void showPayment(PluginCall call) {
        String method = call.getString("method", "微信支付");
        String amount = call.getString("amount", "");
        String qrCode = call.getString("qrCode", "");
        
        displayCache.put("method", method);
        displayCache.put("qrAmount", amount);
        displayCache.put("qrCode", qrCode);
        displayCache.put("type", "payment");
        
        updateCustomerDisplay();
        
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }
    
    @PluginMethod
    public void showSuccess(PluginCall call) {
        String message = call.getString("message", "支付成功");
        String amount = call.getString("amount", "");
        
        displayCache.put("message", message);
        displayCache.put("successAmount", amount);
        displayCache.put("type", "success");
        
        updateCustomerDisplay();
        
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }
    
    @PluginMethod
    public void showError(PluginCall call) {
        String message = call.getString("message", "交易失败");
        
        displayCache.put("message", message);
        displayCache.put("type", "error");
        
        updateCustomerDisplay();
        
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }
    
    @PluginMethod
    public void showQRCode(PluginCall call) {
        String qrContent = call.getString("content", "");
        String title = call.getString("title", "扫码支付");
        String amount = call.getString("amount", "");
        
        displayCache.put("qrContent", qrContent);
        displayCache.put("qrTitle", title);
        displayCache.put("qrAmount", amount);
        displayCache.put("type", "qrcode");
        
        updateCustomerDisplay();
        
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }
    
    @PluginMethod
    public void clear(PluginCall call) {
        displayCache.clear();
        displayCache.put("type", "clear");
        
        updateCustomerDisplay();
        
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }
    
    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("connected", isConnected);
        result.put("wifiDisplay", currentWifiDisplay);
        result.put("cached", displayCache);
        call.resolve(result);
    }
    
    @PluginMethod
    public void connectWifiDisplay(PluginCall call) {
        String deviceAddress = call.getString("deviceAddress");
        
        if (deviceAddress == null || deviceAddress.isEmpty()) {
            call.reject("请提供设备地址");
            return;
        }
        
        try {
            DisplayManager displayManager = (DisplayManager) 
                mainActivity.getSystemService(Activity.DISPLAY_SERVICE);
            
            // 请求连接WiFi显示设备
            displayManager.connectWifiDisplay(deviceAddress);
            
            currentWifiDisplay = deviceAddress;
            isConnected = true;
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "正在连接到无线显示器...");
            result.put("device", deviceAddress);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error connecting to WiFi display", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }
    
    @PluginMethod
    public void disconnectWifiDisplay(PluginCall call) {
        try {
            DisplayManager displayManager = (DisplayManager) 
                mainActivity.getSystemService(Activity.DISPLAY_SERVICE);
            
            displayManager.disconnectWifiDisplay();
            
            currentWifiDisplay = null;
            isConnected = false;
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "无线显示器已断开");
            call.resolve(result);
            
        } catch (Exception e) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }
    
    @PluginMethod
    public void getWifiDisplays(PluginCall call) {
        try {
            DisplayManager displayManager = (DisplayManager) 
                mainActivity.getSystemService(Activity.DISPLAY_SERVICE);
            
            WifiDisplayStatus status = displayManager.getWifiDisplayStatus();
            
            JSObject result = new JSObject();
            JSObject devices = new JSObject();
            
            for (WifiDisplay display : status.getAvailableWifiDisplays()) {
                JSObject device = new JSObject();
                device.put("name", display.getFriendlyName());
                device.put("address", display.getDeviceAddress());
                device.put("isConnected", display.equals(status.getActiveWifiDisplay()));
                devices.put(display.getDeviceAddress(), device);
            }
            
            result.put("success", true);
            result.put("devices", devices);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error getting WiFi displays", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }
    
    /**
     * 更新客显屏显示内容
     */
    private void updateCustomerDisplay() {
        mainHandler.post(() -> {
            try {
                // 发送广播更新客显屏
                Intent intent = new Intent("com.hailin.cashier.UPDATE_DISPLAY");
                intent.putExtra("data", new java.util.HashMap<>(displayCache));
                mainActivity.sendBroadcast(intent);
                
                // 如果客显屏Activity存在，直接更新
                if (customerDisplayActivity != null) {
                    // 更新客显屏内容
                    updateDisplayActivity();
                }
                
            } catch (Exception e) {
                Log.e(TAG, "Error updating customer display", e);
            }
        });
    }
    
    /**
     * 更新客显屏Activity
     */
    private void updateDisplayActivity() {
        if (customerDisplayActivity == null) return;
        
        try {
            // 查找View并更新内容
            // 实际实现需要根据具体布局更新
            // customerDisplayActivity.findViewById(R.id.xxx);
        } catch (Exception e) {
            Log.e(TAG, "Error updating display activity", e);
        }
    }
    
    /**
     * 注册屏幕变化监听
     */
    private void registerDisplayListener() {
        DisplayManager displayManager = (DisplayManager) 
            mainActivity.getSystemService(Activity.DISPLAY_SERVICE);
        
        displayManager.registerDisplayListener(new DisplayManager.DisplayListener() {
            @Override
            public void onDisplayAdded(int displayId) {
                Log.d(TAG, "Display added: " + displayId);
                notifyListeners("onDisplayConnected", new JSObject().put("displayId", displayId));
            }
            
            @Override
            public void onDisplayRemoved(int displayId) {
                Log.d(TAG, "Display removed: " + displayId);
                notifyListeners("onDisplayDisconnected", new JSObject().put("displayId", displayId));
            }
            
            @Override
            public void onDisplayChanged(int displayId) {
                Log.d(TAG, "Display changed: " + displayId);
            }
        }, mainHandler);
    }
    
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        
        // 关闭客显屏
        if (customerDisplayActivity != null) {
            try {
                customerDisplayActivity.finish();
            } catch (Exception e) {
                Log.e(TAG, "Error closing customer display", e);
            }
        }
    }
}
