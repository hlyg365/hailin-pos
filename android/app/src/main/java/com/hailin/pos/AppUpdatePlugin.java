package com.hailin.pos;

import android.app.AlarmManager;
import android.app.DownloadManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Environment;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {
    
    private static final String TAG = "AppUpdatePlugin";
    
    // 更新服务器地址
    private static final String UPDATE_SERVER = "https://hailin-pos.dev.coze.site";
    private static final String CHECK_UPDATE_URL = UPDATE_SERVER + "/api/update";
    private static final String DOWNLOAD_URL = UPDATE_SERVER + "/api/update/download";
    
    // 通知渠道
    private static final String CHANNEL_ID = "app_update_channel";
    private static final int NOTIFICATION_ID = 1001;
    private static final int PROGRESS_NOTIFICATION_ID = 1002;
    
    // 存储键
    private static final String PREF_NAME = "app_update_prefs";
    private static final String KEY_LAST_CHECK_TIME = "last_check_time";
    private static final String KEY_SKIP_VERSION = "skip_version";
    private static final String KEY_AUTO_UPDATE = "auto_update";
    private static final String KEY_WIFI_ONLY = "wifi_only";
    private static final String KEY_CHECK_INTERVAL = "check_interval";
    
    // 默认检查间隔（毫秒）- 4小时
    private static final long DEFAULT_CHECK_INTERVAL = 4 * 60 * 60 * 1000L;
    
    private SharedPreferences prefs = null;
    private ExecutorService executor = null;
    private DownloadTask currentDownloadTask = null;
    
    @Override
    public void load() {
        super.load();
        prefs = getContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        executor = Executors.newSingleThreadExecutor();
        createNotificationChannel();
        
        // 注册下载完成广播接收器
        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        getContext().registerReceiver(downloadCompleteReceiver, filter);
        
        Log.d(TAG, "AppUpdatePlugin loaded");
    }
    
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        
        // 取消注册广播接收器
        try {
            getContext().unregisterReceiver(downloadCompleteReceiver);
        } catch (Exception e) {
            Log.e(TAG, "Failed to unregister receiver", e);
        }
        
        // 关闭线程池
        if (executor != null) {
            executor.shutdownNow();
        }
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "应用更新",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            channel.setDescription("应用更新下载进度通知");
            channel.setShowBadge(true);
            
            NotificationManager manager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
    
    @PluginMethod
    public void checkUpdate(PluginCall call) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                checkForUpdate(call, false);
            }
        });
    }
    
    @PluginMethod
    public void downloadUpdate(PluginCall call) {
        String downloadUrl = call.getString("url", DOWNLOAD_URL);
        
        executor.execute(new Runnable() {
            @Override
            public void run() {
                startDownload(downloadUrl, call);
            }
        });
    }
    
    @PluginMethod
    public void installUpdate(PluginCall call) {
        try {
            File apkFile = getLatestApkFile();
            
            if (!apkFile.exists()) {
                call.reject("APK文件不存在");
                return;
            }
            
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(Uri.fromFile(apkFile), "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            
            getContext().startActivity(intent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "开始安装");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to install update", e);
            call.reject("安装失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void getUpdateSettings(PluginCall call) {
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("autoUpdate", prefs.getBoolean(KEY_AUTO_UPDATE, true));
        result.put("wifiOnly", prefs.getBoolean(KEY_WIFI_ONLY, true));
        result.put("skipVersion", prefs.getString(KEY_SKIP_VERSION, ""));
        result.put("checkInterval", prefs.getLong(KEY_CHECK_INTERVAL, DEFAULT_CHECK_INTERVAL));
        call.resolve(result);
    }
    
    @PluginMethod
    public void setUpdateSettings(PluginCall call) {
        try {
            String autoUpdateStr = call.getString("autoUpdate");
            if (autoUpdateStr != null) {
                prefs.edit().putBoolean(KEY_AUTO_UPDATE, Boolean.parseBoolean(autoUpdateStr)).apply();
            }
            String wifiOnlyStr = call.getString("wifiOnly");
            if (wifiOnlyStr != null) {
                prefs.edit().putBoolean(KEY_WIFI_ONLY, Boolean.parseBoolean(wifiOnlyStr)).apply();
            }
            String skipVersion = call.getString("skipVersion");
            if (skipVersion != null) {
                prefs.edit().putString(KEY_SKIP_VERSION, skipVersion).apply();
            }
            String checkIntervalStr = call.getString("checkInterval");
            if (checkIntervalStr != null) {
                prefs.edit().putLong(KEY_CHECK_INTERVAL, Long.parseLong(checkIntervalStr)).apply();
            }
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "设置已保存");
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("保存设置失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void getLocalVersion(PluginCall call) {
        try {
            Context context = getContext();
            int versionCode = context.getPackageManager()
                .getPackageInfo(context.getPackageName(), 0).versionCode;
            String versionName = context.getPackageManager()
                .getPackageInfo(context.getPackageName(), 0).versionName;
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("versionCode", versionCode);
            result.put("versionName", versionName);
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("获取版本失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void cancelDownload(PluginCall call) {
        if (currentDownloadTask != null) {
            currentDownloadTask.cancel(true);
            currentDownloadTask = null;
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "下载已取消");
            call.resolve(result);
        } else {
            call.reject("没有正在进行的下载");
        }
    }
    
    private void checkForUpdate(PluginCall call, boolean isBackground) {
        try {
            // 检查网络
            if (!isNetworkAvailable()) {
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("error", "网络不可用");
                result.put("networkAvailable", false);
                notifyListeners("onUpdateCheck", result);
                call.resolve(result);
                return;
            }
            
            // 检查WiFi设置
            if (prefs.getBoolean(KEY_WIFI_ONLY, true) && !isWifiConnected()) {
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("error", "当前不是WiFi环境");
                result.put("wifiRequired", true);
                notifyListeners("onUpdateCheck", result);
                call.resolve(result);
                return;
            }
            
            // 获取当前版本
            Context context = getContext();
            int currentVersionCode = context.getPackageManager()
                .getPackageInfo(context.getPackageName(), 0).versionCode;
            
            // 发送检查请求
            URL url = new URL(CHECK_UPDATE_URL + "?platform=android");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            
            int responseCode = conn.getResponseCode();
            
            if (responseCode == 200) {
                BufferedInputStream in = new BufferedInputStream(conn.getInputStream());
                String response = readStream(in);
                conn.disconnect();
                
                JSONObject json = new JSONObject(response);
                
                JSObject result = new JSObject();
                result.put("success", json.optBoolean("success", true));
                result.put("networkAvailable", true);
                
                if (json.optBoolean("update", false)) {
                    result.put("hasUpdate", true);
                    result.put("latestVersion", json.optString("latestVersion", ""));
                    result.put("versionCode", json.optInt("versionCode", 0));
                    result.put("releaseNotes", json.optString("releaseNotes", ""));
                    result.put("forceUpdate", json.optBoolean("forceUpdate", false));
                    result.put("downloadUrl", json.optString("downloadUrl", ""));
                    
                    // 检查是否跳过此版本
                    String skipVersion = prefs.getString(KEY_SKIP_VERSION, "");
                    String latestVersion = json.optString("latestVersion", "");
                    
                    if (skipVersion.equals(latestVersion)) {
                        result.put("skipped", true);
                        result.put("hasUpdate", false);
                    }
                } else {
                    result.put("hasUpdate", false);
                    result.put("latestVersion", json.optString("currentVersion", ""));
                }
                
                // 保存检查时间
                prefs.edit().putLong(KEY_LAST_CHECK_TIME, System.currentTimeMillis()).apply();
                
                notifyListeners("onUpdateCheck", result);
                call.resolve(result);
            } else {
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("error", "检查更新失败，HTTP " + responseCode);
                notifyListeners("onUpdateCheck", result);
                call.resolve(result);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to check update", e);
            
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            notifyListeners("onUpdateCheck", result);
            call.resolve(result);
        }
    }
    
    private void startDownload(String downloadUrl, PluginCall call) {
        try {
            // 创建下载目录
            File downloadDir = new File(getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "updates");
            if (!downloadDir.exists()) {
                downloadDir.mkdirs();
            }
            
            // 创建下载文件
            File apkFile = new File(downloadDir, "hailin-pos-latest.apk");
            
            // 显示下载通知
            showDownloadNotification("正在下载更新...", 0);
            
            // 开始下载
            currentDownloadTask = new DownloadTask(call);
            currentDownloadTask.filePath = apkFile.getAbsolutePath();
            currentDownloadTask.execute(downloadUrl);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to start download", e);
            call.reject("下载失败: " + e.getMessage());
        }
    }
    
    private void showDownloadNotification(String message, int progress) {
        NotificationManager manager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        
        NotificationCompat.Builder builder = new NotificationCompat.Builder(getContext(), CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle("海邻收银台")
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setOnlyAlertOnce(true);
        
        if (progress > 0) {
            builder.setProgress(100, progress, false);
        } else {
            builder.setProgress(100, 0, true);
        }
        
        manager.notify(PROGRESS_NOTIFICATION_ID, builder.build());
    }
    
    private void hideDownloadNotification() {
        NotificationManager manager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.cancel(PROGRESS_NOTIFICATION_ID);
        }
    }
    
    private void showCompleteNotification(String version) {
        NotificationManager manager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        
        Intent intent = new Intent(getContext(), MainActivity.class);
        intent.setAction("com.hailin.pos.INSTALL_UPDATE");
        PendingIntent pendingIntent = PendingIntent.getActivity(
            getContext(), 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        NotificationCompat.Builder builder = new NotificationCompat.Builder(getContext(), CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setContentTitle("下载完成")
            .setContentText("海邻收银台 v" + version + " 已下载完成，点击安装")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent);
        
        manager.notify(NOTIFICATION_ID, builder.build());
    }
    
    private File getLatestApkFile() {
        File downloadDir = new File(getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "updates");
        return new File(downloadDir, "hailin-pos-latest.apk");
    }
    
    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        
        NetworkInfo info = cm.getActiveNetworkInfo();
        return info != null && info.isConnected();
    }
    
    private boolean isWifiConnected() {
        ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        
        NetworkInfo info = cm.getActiveNetworkInfo();
        return info != null && info.getType() == ConnectivityManager.TYPE_WIFI;
    }
    
    private String readStream(java.io.InputStream in) throws java.io.IOException {
        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(in));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        reader.close();
        return sb.toString();
    }
    
    // 下载完成广播接收器
    private BroadcastReceiver downloadCompleteReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            long downloadId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            Log.d(TAG, "Download completed: " + downloadId);
            
            hideDownloadNotification();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "下载完成");
            notifyListeners("onDownloadComplete", result);
        }
    };
    
    // 下载任务内部类
    private class DownloadTask extends AsyncTask<String, Integer, String> {
        private PluginCall call;
        public String filePath = "";
        
        public DownloadTask(PluginCall call) {
            this.call = call;
        }
        
        @Override
        protected String doInBackground(String... params) {
            String downloadUrl = params[0];
            
            HttpURLConnection conn = null;
            java.io.BufferedInputStream in = null;
            FileOutputStream out = null;
            
            try {
                URL url = new URL(downloadUrl);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(30000);
                conn.setReadTimeout(30000);
                
                int totalSize = conn.getContentLength();
                int downloadedSize = 0;
                
                in = new java.io.BufferedInputStream(conn.getInputStream());
                out = new FileOutputStream(filePath);
                
                byte[] buffer = new byte[8192];
                int count;
                int lastProgress = 0;
                
                while ((count = in.read(buffer)) != -1) {
                    if (isCancelled()) {
                        return "cancelled";
                    }
                    
                    out.write(buffer, 0, count);
                    downloadedSize += count;
                    
                    if (totalSize > 0) {
                        int progress = (int) ((downloadedSize * 100) / totalSize);
                        if (progress != lastProgress) {
                            lastProgress = progress;
                            publishProgress(progress);
                        }
                    }
                }
                
                out.flush();
                return "success";
                
            } catch (Exception e) {
                Log.e(TAG, "Download failed", e);
                return "error: " + e.getMessage();
            } finally {
                try {
                    if (out != null) out.close();
                    if (in != null) in.close();
                    if (conn != null) conn.disconnect();
                } catch (Exception e) {}
            }
        }
        
        @Override
        protected void onProgressUpdate(Integer... values) {
            int progress = values[0];
            showDownloadNotification("下载中 " + progress + "%", progress);
            
            JSObject result = new JSObject();
            result.put("progress", progress);
            result.put("downloading", true);
            notifyListeners("onDownloadProgress", result);
        }
        
        @Override
        protected void onPostExecute(String result) {
            currentDownloadTask = null;
            hideDownloadNotification();
            
            if ("success".equals(result)) {
                showCompleteNotification("3.0.0");
                
                JSObject jsResult = new JSObject();
                jsResult.put("success", true);
                jsResult.put("message", "下载完成");
                jsResult.put("filePath", filePath);
                notifyListeners("onDownloadComplete", jsResult);
                call.resolve(jsResult);
                
            } else if ("cancelled".equals(result)) {
                JSObject jsResult = new JSObject();
                jsResult.put("success", false);
                jsResult.put("message", "下载已取消");
                call.resolve(jsResult);
                
            } else {
                call.reject("下载失败: " + result);
            }
        }
        
        @Override
        protected void onCancelled(String s) {
            currentDownloadTask = null;
            hideDownloadNotification();
        }
    }
}
