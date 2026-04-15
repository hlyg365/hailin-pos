package com.hailin.pos;

import android.Manifest;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;
import android.view.WindowManager;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.hailin.cashier.UsbDeviceService;
import com.hailin.cashier.UsbPermissionReceiver;

/**
 * 海邻到家收银台主Activity
 * 负责初始化插件、管理USB设备、保持屏幕常亮等
 */
public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    
    // 权限请求码
    private static final int REQUEST_CODE_PERMISSIONS = 1001;
    
    // 需要的权限列表
    private static final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.CAMERA,
        Manifest.permission.BLUETOOTH,
        Manifest.permission.BLUETOOTH_CONNECT,
        Manifest.permission.BLUETOOTH_SCAN,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.WRITE_EXTERNAL_STORAGE,
        Manifest.permission.READ_EXTERNAL_STORAGE,
        Manifest.permission.VIBRATE,
        Manifest.permission.INTERNET,
        Manifest.permission.ACCESS_NETWORK_STATE,
    };
    
    // USB权限广播接收器
    private UsbPermissionReceiver usbPermissionReceiver;
    private BroadcastReceiver usbDeviceReceiver;
    
    // 屏幕常亮标签
    private static final String WAKELOCK_TAG = "hailin:cashier_wakelock";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.d(TAG, "MainActivity onCreate");
        
        // 保持屏幕常亮
        keepScreenOn(true);
        
        // 注册USB设备监听
        registerUsbDeviceListener();
        
        // 注册USB权限接收器
        registerUsbPermissionReceiver();
        
        // 请求必要的权限
        requestRequiredPermissions();
        
        // 初始化USB设备服务
        initUsbDeviceService();
        
        // 初始化硬件插件
        initHardwarePlugins();
        
        // 隐藏系统栏（全屏显示）
        hideSystemUI();
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        
        // 刷新USB设备列表
        refreshUsbDevices();
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        
        // 取消屏幕常亮
        keepScreenOn(false);
        
        // 取消注册USB接收器
        unregisterUsbDeviceListener();
        unregisterUsbPermissionReceiver();
        
        // 释放USB设备服务
        UsbDeviceService.getInstance().release();
    }
    
    /**
     * 保持屏幕常亮
     */
    private void keepScreenOn(boolean on) {
        if (on) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            
            // 使用PowerManager的WakeLock（可选）
            try {
                PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
                PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    WAKELOCK_TAG
                );
                wakeLock.acquire(10 * 60 * 1000L); // 10分钟超时
            } catch (Exception e) {
                Log.e(TAG, "Failed to acquire wake lock", e);
            }
        } else {
            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }
    }
    
    /**
     * 注册USB设备监听
     */
    private void registerUsbDeviceListener() {
        usbDeviceReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                
                if (UsbManager.ACTION_USB_DEVICE_ATTACHED.equals(action)) {
                    UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    handleUsbDeviceAttached(device);
                } else if (UsbManager.ACTION_USB_DEVICE_DETACHED.equals(action)) {
                    UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    handleUsbDeviceDetached(device);
                }
            }
        };
        
        IntentFilter filter = new IntentFilter();
        filter.addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED);
        filter.addAction(UsbManager.ACTION_USB_DEVICE_DETACHED);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(usbDeviceReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(usbDeviceReceiver, filter);
        }
    }
    
    /**
     * 取消注册USB设备监听
     */
    private void unregisterUsbDeviceListener() {
        if (usbDeviceReceiver != null) {
            try {
                unregisterReceiver(usbDeviceReceiver);
            } catch (Exception e) {
                Log.e(TAG, "Failed to unregister USB device receiver", e);
            }
            usbDeviceReceiver = null;
        }
    }
    
    /**
     * 注册USB权限接收器
     */
    private void registerUsbPermissionReceiver() {
        usbPermissionReceiver = UsbPermissionReceiver.register(this);
    }
    
    /**
     * 取消注册USB权限接收器
     */
    private void unregisterUsbPermissionReceiver() {
        UsbPermissionReceiver.unregister(this, usbPermissionReceiver);
    }
    
    /**
     * 处理USB设备连接
     */
    private void handleUsbDeviceAttached(UsbDevice device) {
        if (device == null) return;
        
        Log.d(TAG, "USB Device attached: " + device.getDeviceName());
        
        // 获取USB管理器
        UsbManager usbManager = (UsbManager) getSystemService(Context.USB_SERVICE);
        
        // 请求权限
        UsbPermissionReceiver.PermissionHelper helper = 
            new UsbPermissionReceiver.PermissionHelper(this);
        
        helper.requestPermission(device, new UsbPermissionReceiver.PermissionResultCallback() {
            @Override
            public void onPermissionGranted(UsbDevice device) {
                Log.d(TAG, "USB permission granted for: " + device.getDeviceName());
                notifyPluginDeviceConnected(device);
            }
            
            @Override
            public void onPermissionDenied(UsbDevice device) {
                Log.w(TAG, "USB permission denied for: " + device.getDeviceName());
            }
        });
    }
    
    /**
     * 处理USB设备断开
     */
    private void handleUsbDeviceDetached(UsbDevice device) {
        if (device == null) return;
        
        Log.d(TAG, "USB Device detached: " + device.getDeviceName());
        notifyPluginDeviceDisconnected(device);
    }
    
    /**
     * 通知插件设备已连接
     */
    private void notifyPluginDeviceConnected(UsbDevice device) {
        // 通知PrinterPlugin
        notifyPlugin("PrinterPlugin", "onDeviceConnected", device);
        // 通知ScalePlugin
        notifyPlugin("ScalePlugin", "onDeviceConnected", device);
        // 通知CashboxPlugin
        notifyPlugin("CashboxPlugin", "onDeviceConnected", device);
    }
    
    /**
     * 通知插件设备已断开
     */
    private void notifyPluginDeviceDisconnected(UsbDevice device) {
        // 通知PrinterPlugin
        notifyPlugin("PrinterPlugin", "onDeviceDisconnected", device);
        // 通知ScalePlugin
        notifyPlugin("ScalePlugin", "onDeviceDisconnected", device);
        // 通知CashboxPlugin
        notifyPlugin("CashboxPlugin", "onDeviceDisconnected", device);
    }
    
    /**
     * 通知插件
     */
    private void notifyPlugin(String pluginName, String method, UsbDevice device) {
        try {
            Plugin plugin = getBridge().getPlugin(pluginName);
            if (plugin != null) {
                // 通过广播通知插件
                Intent intent = new Intent("com.hailin.cashier." + pluginName.toUpperCase() + "_CONNECTED");
                intent.putExtra("device_name", device.getDeviceName());
                intent.putExtra("vendor_id", device.getVendorId());
                intent.putExtra("product_id", device.getProductId());
                sendBroadcast(intent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to notify plugin: " + pluginName, e);
        }
    }
    
    /**
     * 请求必要的权限
     */
    private void requestRequiredPermissions() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return;
        }
        
        java.util.List<String> permissionsToRequest = new java.util.ArrayList<>();
        
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) 
                    != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission);
            }
        }
        
        if (!permissionsToRequest.isEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toArray(new String[0]),
                REQUEST_CODE_PERMISSIONS
            );
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, 
            @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            for (int i = 0; i < permissions.length; i++) {
                String permission = permissions[i];
                int result = grantResults[i];
                
                if (result == PackageManager.PERMISSION_GRANTED) {
                    Log.d(TAG, "Permission granted: " + permission);
                } else {
                    Log.w(TAG, "Permission denied: " + permission);
                }
            }
        }
    }
    
    /**
     * 初始化USB设备服务
     */
    private void initUsbDeviceService() {
        UsbDeviceService service = UsbDeviceService.getInstance();
        service.init(this);
        
        // 注册设备回调
        service.registerCallback("*", new UsbDeviceService.UsbDeviceCallback() {
            @Override
            public void onDeviceConnected(UsbDevice device) {
                Log.d(TAG, "Device connected via service: " + device.getDeviceName());
            }
            
            @Override
            public void onDeviceDisconnected(UsbDevice device) {
                Log.d(TAG, "Device disconnected via service: " + device.getDeviceName());
            }
            
            @Override
            public void onDeviceError(UsbDevice device, String error) {
                Log.e(TAG, "Device error: " + error);
            }
        });
    }
    
    /**
     * 初始化硬件插件
     */
    private void initHardwarePlugins() {
        // 预加载插件
        getBridge().getPlugin("PrinterPlugin");
        getBridge().getPlugin("ScalePlugin");
        getBridge().getPlugin("CashboxPlugin");
        getBridge().getPlugin("DualScreenPlugin");
        getBridge().getPlugin("AppUpdatePlugin");
        
        Log.d(TAG, "Hardware plugins initialized");
    }
    
    /**
     * 刷新USB设备列表
     */
    private void refreshUsbDevices() {
        UsbManager usbManager = (UsbManager) getSystemService(Context.USB_SERVICE);
        
        if (usbManager != null) {
            java.util.Map<String, UsbDevice> devices = usbManager.getDeviceList();
            Log.d(TAG, "USB devices found: " + devices.size());
            
            for (java.util.Map.Entry<String, UsbDevice> entry : devices.entrySet()) {
                UsbDevice device = entry.getValue();
                Log.d(TAG, "  - " + device.getDeviceName() + 
                      " (VID:" + String.format("%04X", device.getVendorId()) + 
                      " PID:" + String.format("%04X", device.getProductId()) + ")");
            }
        }
    }
    
    /**
     * 隐藏系统栏
     */
    private void hideSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Android 11+
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(android.view.WindowInsets.Type.statusBars() 
                    | android.view.WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            // Android 4.4+
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            );
        }
    }
    
    /**
     * 显示系统栏
     */
    private void showSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.show(android.view.WindowInsets.Type.statusBars() 
                    | android.view.WindowInsets.Type.navigationBars());
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            );
        }
    }
    
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }
    
    /**
     * 获取设备ID
     */
    public static String getDeviceId(Context context) {
        return Settings.Secure.getString(context.getContentResolver(), 
            Settings.Secure.ANDROID_ID);
    }
    
    /**
     * 检查USB调试是否开启
     */
    public static boolean isUsbDebugEnabled(Context context) {
        return Settings.Secure.getInt(context.getContentResolver(),
            Settings.Secure.ADB_ENABLED, 0) == 1;
    }
    
    /**
     * 显示Android设置
     */
    public static void openAndroidSettings(Activity activity) {
        Intent intent = new Intent(Settings.ACTION_SETTINGS);
        activity.startActivity(intent);
    }
    
    /**
     * 显示USB设置
     */
    public static void openUsbSettings(Activity activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(Settings.ACTION_USB_SETTINGS);
            activity.startActivity(intent);
        } else {
            // 旧版本直接打开设置
            openAndroidSettings(activity);
        }
    }
    
    /**
     * 显示应用设置
     */
    public static void openAppSettings(Activity activity) {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(Uri.parse("package:" + activity.getPackageName()));
        activity.startActivity(intent);
    }
    
    // 导入缺失的类
    import android.net.Uri;
    import android.view.View;
    import android.view.WindowInsetsController;
}
