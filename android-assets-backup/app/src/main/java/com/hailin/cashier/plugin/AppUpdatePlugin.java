package com.hailin.cashier.plugin;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import java.io.File;
import java.net.HttpURLConnection;
import java.net.URL;

public class AppUpdatePlugin extends Plugin {
    private static final String TAG = "AppUpdatePlugin";
    
    private DownloadManager downloadManager;
    private long downloadId = -1;
    private Handler mainHandler;
    private JSObject pendingResult;
    
    public AppUpdatePlugin() {
        mainHandler = new Handler(Looper.getMainLooper());
    }
    
    @Override
    public void load() {
        super.load();
        Log.d(TAG, "AppUpdatePlugin loaded");
        
        downloadManager = (DownloadManager) 
            bridge.getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        
        // 注册下载完成监听
        registerDownloadReceiver();
    }
    
    @PluginMethod
    public void getVersion(PluginCall call) {
        try {
            Context context = bridge.getContext();
            PackageInfo pInfo = context.getPackageManager()
                .getPackageInfo(context.getPackageName(), 0);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("version", pInfo.versionName);
            result.put("versionCode", Build.VERSION.SDK_INT >= 28 
                ? pInfo.getLongVersionCode() 
                : pInfo.versionCode);
            result.put("packageName", pInfo.packageName);
            call.resolve(result);
            
        } catch (PackageManager.NameNotFoundException e) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }
    
    @PluginMethod
    public void checkUpdate(PluginCall call) {
        String checkUrl = call.getString("url");
        
        if (checkUrl == null || checkUrl.isEmpty()) {
            call.reject("请提供检查更新的URL");
            return;
        }
        
        pendingResult = new JSObject();
        pendingResult.put("callId", call.getCallbackId());
        
        new Thread(() -> {
            try {
                URL url = new URL(checkUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(10000);
                
                int responseCode = conn.getResponseCode();
                
                if (responseCode == 200) {
                    // 读取响应内容
                    java.io.BufferedReader reader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(conn.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();
                    
                    // 解析JSON响应
                    org.json.JSONObject updateInfo = new org.json.JSONObject(response.toString());
                    
                    mainHandler.post(() -> {
                        JSObject result = new JSObject();
                        result.put("success", true);
                        result.put("hasUpdate", true);
                        result.put("version", updateInfo.optString("version"));
                        result.put("versionCode", updateInfo.optInt("versionCode"));
                        result.put("downloadUrl", updateInfo.optString("downloadUrl"));
                        result.put(" description", updateInfo.optString("description"));
                        result.put("forceUpdate", updateInfo.optBoolean("forceUpdate", false));
                        call.resolve(result);
                    });
                    
                } else {
                    mainHandler.post(() -> {
                        JSObject result = new JSObject();
                        result.put("success", false);
                        result.put("error", "检查更新失败: " + responseCode);
                        call.resolve(result);
                    });
                }
                
            } catch (Exception e) {
                Log.e(TAG, "Error checking update", e);
                mainHandler.post(() -> {
                    JSObject result = new JSObject();
                    result.put("success", false);
                    result.put("error", e.getMessage());
                    call.resolve(result);
                });
            }
        }).start();
    }
    
    @PluginMethod
    public void downloadUpdate(PluginCall call) {
        String downloadUrl = call.getString("downloadUrl");
        
        if (downloadUrl == null || downloadUrl.isEmpty()) {
            call.reject("请提供下载URL");
            return;
        }
        
        try {
            Uri uri = Uri.parse(downloadUrl);
            DownloadManager.Request request = new DownloadManager.Request(uri);
            
            // 设置下载信息
            request.setTitle("海邻到家更新");
            request.setDescription("正在下载新版本...");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setVisibleInDownloadsUi(true);
            
            // 设置下载路径
            File apkFile = new File(
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                "hailin_cashier.apk"
            );
            request.setDestinationUri(Uri.fromFile(apkFile));
            
            // 开始下载
            downloadId = downloadManager.enqueue(request);
            
            // 保存下载ID
            bridge.getContext()
                .getSharedPreferences("app_update", Context.MODE_PRIVATE)
                .edit()
                .putLong("download_id", downloadId)
                .apply();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("downloadId", downloadId);
            result.put("message", "开始下载...");
            call.resolve(result);
            
            // 监听下载进度
            startProgressMonitoring();
            
        } catch (Exception e) {
            Log.e(TAG, "Error downloading update", e);
            call.reject(e.getMessage());
        }
    }
    
    @PluginMethod
    public void installUpdate(PluginCall call) {
        File apkFile = new File(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
            "hailin_cashier.apk"
        );
        
        if (!apkFile.exists()) {
            call.reject("安装包文件不存在");
            return;
        }
        
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(Uri.fromFile(apkFile), 
                "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            bridge.getContext().startActivity(intent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "正在启动安装程序...");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error installing update", e);
            call.reject(e.getMessage());
        }
    }
    
    @PluginMethod
    public void getDownloadProgress(PluginCall call) {
        if (downloadId == -1) {
            // 尝试获取保存的下载ID
            downloadId = bridge.getContext()
                .getSharedPreferences("app_update", Context.MODE_PRIVATE)
                .getLong("download_id", -1);
        }
        
        if (downloadId == -1) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "没有正在进行的下载");
            call.resolve(result);
            return;
        }
        
        DownloadManager.Query query = new DownloadManager.Query();
        query.setFilterById(downloadId);
        
        Cursor cursor = downloadManager.query(query);
        
        if (cursor != null && cursor.moveToFirst()) {
            int bytesDownloadedCol = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR);
            int bytesTotalCol = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES);
            int statusCol = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
            
            long bytesDownloaded = cursor.getLong(bytesDownloadedCol);
            long bytesTotal = cursor.getLong(bytesTotalCol);
            int status = cursor.getInt(statusCol);
            
            cursor.close();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("bytesDownloaded", bytesDownloaded);
            result.put("bytesTotal", bytesTotal);
            result.put("progress", bytesTotal > 0 ? (bytesDownloaded * 100 / bytesTotal) : 0);
            result.put("status", getStatusText(status));
            call.resolve(result);
            
        } else {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "无法获取下载进度");
            call.resolve(result);
        }
    }
    
    @PluginMethod
    public void cancelDownload(PluginCall call) {
        if (downloadId != -1) {
            downloadManager.remove(downloadId);
            downloadId = -1;
        }
        
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "下载已取消");
        call.resolve(result);
    }
    
    /**
     * 注册下载完成广播接收器
     */
    private void registerDownloadReceiver() {
        BroadcastReceiver receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                
                if (id == downloadId) {
                    DownloadManager.Query query = new DownloadManager.Query();
                    query.setFilterById(id);
                    
                    Cursor cursor = downloadManager.query(query);
                    
                    if (cursor != null && cursor.moveToFirst()) {
                        int statusCol = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                        int status = cursor.getInt(statusCol);
                        
                        cursor.close();
                        
                        if (status == DownloadManager.STATUS_SUCCESSFUL) {
                            // 下载成功，提示用户安装
                            mainHandler.post(() -> {
                                showInstallDialog();
                            });
                            
                            notifyListeners("onDownloadComplete", new JSObject());
                        } else if (status == DownloadManager.STATUS_FAILED) {
                            notifyListeners("onDownloadFailed", new JSObject()
                                .put("error", "下载失败"));
                        }
                    }
                }
            }
        };
        
        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            bridge.getContext().registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            bridge.getContext().registerReceiver(receiver, filter);
        }
    }
    
    /**
     * 开始下载进度监控
     */
    private void startProgressMonitoring() {
        new Thread(() -> {
            while (downloadId != -1) {
                try {
                    DownloadManager.Query query = new DownloadManager.Query();
                    query.setFilterById(downloadId);
                    
                    Cursor cursor = downloadManager.query(query);
                    
                    if (cursor != null && cursor.moveToFirst()) {
                        int bytesDownloadedCol = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR);
                        int bytesTotalCol = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES);
                        int statusCol = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                        
                        long bytesDownloaded = cursor.getLong(bytesDownloadedCol);
                        long bytesTotal = cursor.getLong(bytesTotalCol);
                        int status = cursor.getInt(statusCol);
                        
                        cursor.close();
                        
                        int progress = bytesTotal > 0 ? (int) (bytesDownloaded * 100 / bytesTotal) : 0;
                        
                        JSObject data = new JSObject();
                        data.put("progress", progress);
                        data.put("bytesDownloaded", bytesDownloaded);
                        data.put("bytesTotal", bytesTotal);
                        data.put("status", getStatusText(status));
                        
                        notifyListeners("onProgressUpdate", data);
                        
                        if (status == DownloadManager.STATUS_SUCCESSFUL || 
                            status == DownloadManager.STATUS_FAILED) {
                            break;
                        }
                    }
                    
                    Thread.sleep(1000); // 每秒更新一次
                    
                } catch (Exception e) {
                    Log.e(TAG, "Error monitoring progress", e);
                    break;
                }
            }
        }).start();
    }
    
    /**
     * 显示安装确认对话框
     */
    private void showInstallDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(bridge.getActivity());
        builder.setTitle("下载完成");
        builder.setMessage("新版本已下载完成，是否立即安装？");
        builder.setPositiveButton("立即安装", (dialog, which) -> {
            installUpdate(null);
        });
        builder.setNegativeButton("稍后安装", (dialog, which) -> {
            dialog.dismiss();
        });
        builder.setCancelable(false);
        builder.show();
    }
    
    /**
     * 获取状态文字
     */
    private String getStatusText(int status) {
        switch (status) {
            case DownloadManager.STATUS_PENDING:
                return "等待中";
            case DownloadManager.STATUS_RUNNING:
                return "下载中";
            case DownloadManager.STATUS_PAUSED:
                return "已暂停";
            case DownloadManager.STATUS_SUCCESSFUL:
                return "下载完成";
            case DownloadManager.STATUS_FAILED:
                return "下载失败";
            default:
                return "未知状态";
        }
    }
    
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        
        // 清理
        if (downloadId != -1) {
            // 不取消下载，只是不再监听
        }
    }
}
