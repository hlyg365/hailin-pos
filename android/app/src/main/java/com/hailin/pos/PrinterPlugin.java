package com.hailin.pos;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.ProgressDialog;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothClass;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.Charset;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(name = "Printer")
public class PrinterPlugin extends Plugin {
    
    private static final String TAG = "PrinterPlugin";
    private static final String ACTION_CONNECT = "connect";
    private static final String ACTION_DISCONNECT = "disconnect";
    private static final String ACTION_PRINT = "print";
    private static final String ACTION_PRINT_TEXT = "printText";
    private static final String ACTION_PRINT_RECEIPT = "printReceipt";
    private static final String ACTION_OPEN_CASHBOX = "openCashbox";
    private static final String ACTION_LIST_DEVICES = "listDevices";
    private static final String ACTION_GET_STATUS = "getStatus";
    
    // 蓝牙相关
    private BluetoothAdapter bluetoothAdapter = null;
    private BluetoothSocket bluetoothSocket = null;
    private BluetoothDevice currentDevice = null;
    private OutputStream outputStream = null;
    private InputStream inputStream = null;
    private boolean isConnected = false;
    
    // 蓝牙UUID - 串口服务UUID
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    
    // 打印命令
    private static final byte[] CMD_INIT = {0x1B, 0x40}; // 初始化打印机
    private static final byte[] CMD_ALIGN_CENTER = {0x1B, 0x61, 0x01};
    private static final byte[] CMD_ALIGN_LEFT = {0x1B, 0x61, 0x00};
    private static final byte[] CMD_BOLD_ON = {0x1B, 0x45, 0x01};
    private static final byte[] CMD_BOLD_OFF = {0x1B, 0x45, 0x00};
    private static final byte[] CMD_DOUBLE_HEIGHT = {0x1D, 0x21, 0x10};
    private static final byte[] CMD_NORMAL_SIZE = {0x1D, 0x21, 0x00};
    private static final byte[] CMD_CUT = {0x1D, 0x56, 0x00}; // 全切
    private static final byte[] CMD_PARTIAL_CUT = {0x1D, 0x56, 0x01}; // 半切
    private static final byte[] CMD_FEED_CUT = {0x0A, 0x1D, 0x56, 0x42, 0x03}; // 进纸后切纸
    private static final byte[] CMD_OPEN_CASHBOX = {0x1B, 0x70, 0x00, 0x19, (byte)0xFA}; // 钱箱命令
    
    private Handler mainHandler = null;
    
    public PrinterPlugin() {
        mainHandler = new Handler(Looper.getMainLooper());
    }
    
    @Override
    public void load() {
        super.load();
        initBluetooth();
        Log.d(TAG, "PrinterPlugin loaded");
    }
    
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        disconnect();
    }
    
    private void initBluetooth() {
        try {
            BluetoothManager bluetoothManager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
            if (bluetoothManager != null) {
                bluetoothAdapter = bluetoothManager.getAdapter();
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to init Bluetooth", e);
        }
    }
    
    @PluginMethod
    public void listDevices(PluginCall call) {
        JSObject result = new JSObject();
        
        try {
            if (bluetoothAdapter == null) {
                result.put("success", false);
                result.put("error", "蓝牙不可用");
                call.resolve(result);
                return;
            }
            
            if (!bluetoothAdapter.isEnabled()) {
                result.put("success", false);
                result.put("error", "请先开启蓝牙");
                call.resolve(result);
                return;
            }
            
            List<JSONObject> devices = new ArrayList<>();
            
            // 获取已配对的设备
            Set<BluetoothDevice> pairedDevices = bluetoothAdapter.getBondedDevices();
            if (pairedDevices != null) {
                for (BluetoothDevice device : pairedDevices) {
                    JSONObject deviceInfo = new JSONObject();
                    deviceInfo.put("name", device.getName() != null ? device.getName() : "未知设备");
                    deviceInfo.put("address", device.getAddress());
                    deviceInfo.put("type", getDeviceTypeName(device.getBluetoothClass()));
                    deviceInfo.put("paired", true);
                    devices.add(deviceInfo);
                }
            }
            
            result.put("success", true);
            result.put("devices", new JSONArray(devices));
            result.put("count", devices.size());
            call.resolve(result);
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            call.reject("Failed to list devices", e);
        }
    }
    
    private String getDeviceTypeName(BluetoothClass btClass) {
        if (btClass == null) return "未知";
        int majorClass = btClass.getMajorDeviceClass();
        // BluetoothClass.Device.Major constants
        if (majorClass == 0x0200) return "手机";       // PHONE
        if (majorClass == 0x0100) return "电脑";      // COMPUTER
        if (majorClass == 0x0400) return "音频/视频"; // AUDIO_VIDEO
        if (majorClass == 0x0500) return "打印机";    // PERIPHERAL
        if (majorClass == 0x0600) return "成像设备";  // IMAGING
        return "其他";
    }
    
    @PluginMethod
    public void connect(PluginCall call) {
        String address = call.getString("address", "");
        String name = call.getString("name", "");
        
        Log.d(TAG, "Connecting to printer: " + name + " (" + address + ")");
        
        if (address.isEmpty()) {
            call.reject("设备地址不能为空");
            return;
        }
        
        // 如果已连接，先断开
        if (isConnected) {
            disconnect();
        }
        
        try {
            if (bluetoothAdapter == null) {
                initBluetooth();
            }
            
            if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
                call.reject("蓝牙未开启");
                return;
            }
            
            // 获取设备
            currentDevice = bluetoothAdapter.getRemoteDevice(address);
            
            if (currentDevice == null) {
                call.reject("未找到设备");
                return;
            }
            
            // 创建Socket并连接
            bluetoothSocket = currentDevice.createRfcommSocketToServiceRecord(SPP_UUID);
            
            // 在主线程执行连接
            Activity activity = getActivity();
            if (activity != null) {
                activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            bluetoothSocket.connect();
                            outputStream = bluetoothSocket.getOutputStream();
                            inputStream = bluetoothSocket.getInputStream();
                            isConnected = true;
                            
                            // 初始化打印机
                            initializePrinter();
                            
                            JSObject result = new JSObject();
                            result.put("success", true);
                            result.put("message", "已连接到 " + (name.isEmpty() ? address : name));
                            result.put("deviceName", name);
                            result.put("deviceAddress", address);
                            call.resolve(result);
                            
                            Log.d(TAG, "Printer connected successfully");
                            
                        } catch (IOException e) {
                            Log.e(TAG, "Failed to connect", e);
                            try {
                                bluetoothSocket.close();
                            } catch (IOException ex) {}
                            bluetoothSocket = null;
                            isConnected = false;
                            
                            call.reject("连接失败: " + e.getMessage());
                        }
                    }
                });
            } else {
                // 在后台线程连接
                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            bluetoothSocket.connect();
                            outputStream = bluetoothSocket.getOutputStream();
                            inputStream = bluetoothSocket.getInputStream();
                            isConnected = true;
                            
                            // 初始化打印机
                            initializePrinter();
                            
                            JSObject result = new JSObject();
                            result.put("success", true);
                            result.put("message", "已连接到打印机");
                            result.put("deviceName", name);
                            result.put("deviceAddress", address);
                            
                            mainHandler.post(new Runnable() {
                                @Override
                                public void run() {
                                    call.resolve(result);
                                }
                            });
                            
                        } catch (IOException e) {
                            Log.e(TAG, "Failed to connect", e);
                            try {
                                bluetoothSocket.close();
                            } catch (IOException ex) {}
                            bluetoothSocket = null;
                            isConnected = false;
                            
                            final String error = e.getMessage();
                            mainHandler.post(new Runnable() {
                                @Override
                                public void run() {
                                    call.reject("连接失败: " + error);
                                }
                            });
                        }
                    }
                }).start();
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to connect", e);
            call.reject("连接失败: " + e.getMessage());
        }
    }
    
    private void initializePrinter() throws IOException {
        if (outputStream != null) {
            outputStream.write(CMD_INIT);
            outputStream.flush();
        }
    }
    
    @PluginMethod
    public void disconnect(PluginCall call) {
        disconnect();
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "已断开打印机连接");
        call.resolve(result);
    }
    
    private void disconnect() {
        try {
            if (outputStream != null) {
                outputStream.close();
                outputStream = null;
            }
            if (inputStream != null) {
                inputStream.close();
                inputStream = null;
            }
            if (bluetoothSocket != null) {
                bluetoothSocket.close();
                bluetoothSocket = null;
            }
            currentDevice = null;
            isConnected = false;
        } catch (IOException e) {
            Log.e(TAG, "Error disconnecting", e);
        }
    }
    
    @PluginMethod
    public void print(PluginCall call) {
        String data = call.getString("data", "");
        
        if (!isConnected) {
            call.reject("打印机未连接");
            return;
        }
        
        try {
            // 发送数据
            byte[] bytes = hexStringToByteArray(data);
            outputStream.write(bytes);
            outputStream.flush();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "打印完成");
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("打印失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void printText(PluginCall call) {
        String text = call.getString("text", "");
        String align = call.getString("align", "left");
        boolean bold = call.getBoolean("bold", false);
        boolean doubleHeight = call.getBoolean("doubleHeight", false);
        
        if (!isConnected) {
            call.reject("打印机未连接");
            return;
        }
        
        try {
            // 设置对齐方式
            switch (align) {
                case "center":
                    outputStream.write(CMD_ALIGN_CENTER);
                    break;
                default:
                    outputStream.write(CMD_ALIGN_LEFT);
                    break;
            }
            
            // 设置粗体
            outputStream.write(bold ? CMD_BOLD_ON : CMD_BOLD_OFF);
            
            // 设置字体大小
            outputStream.write(doubleHeight ? CMD_DOUBLE_HEIGHT : CMD_NORMAL_SIZE);
            
            // 打印文字
            byte[] textBytes = text.getBytes("GBK");
            outputStream.write(textBytes);
            outputStream.write(0x0A); // 换行
            outputStream.flush();
            
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("打印失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void printReceipt(PluginCall call) {
        if (!isConnected) {
            call.reject("打印机未连接");
            return;
        }
        
        try {
            JSONObject receipt = call.getData();
            
            // 初始化打印机
            outputStream.write(CMD_INIT);
            
            // 打印头部
            String shopName = receipt.optString("shopName", "海邻到家便利店");
            String orderNo = receipt.optString("orderNo", "");
            String date = receipt.optString("date", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
            String cashier = receipt.optString("cashier", "收银员");
            
            // 店铺名称（居中、大号）
            outputStream.write(CMD_ALIGN_CENTER);
            outputStream.write(CMD_BOLD_ON);
            outputStream.write(CMD_DOUBLE_HEIGHT);
            outputStream.write((shopName + "\n").getBytes("GBK"));
            
            // 重置格式
            outputStream.write(CMD_NORMAL_SIZE);
            outputStream.write(CMD_BOLD_OFF);
            outputStream.write(CMD_ALIGN_LEFT);
            
            // 分隔线
            String divider = "--------------------------------\n";
            outputStream.write(divider.getBytes("GBK"));
            
            // 订单信息
            outputStream.write(("单号: " + orderNo + "\n").getBytes("GBK"));
            outputStream.write(("时间: " + date + "\n").getBytes("GBK"));
            outputStream.write(("收银: " + cashier + "\n").getBytes("GBK"));
            
            // 分隔线
            outputStream.write(divider.getBytes("GBK"));
            
            // 商品明细
            JSONArray items = receipt.optJSONArray("items");
            if (items != null) {
                for (int i = 0; i < items.length(); i++) {
                    JSONObject item = items.getJSONObject(i);
                    String name = item.optString("name", "");
                    String qty = item.optString("quantity", "1");
                    String price = item.optString("price", "0.00");
                    
                    // 商品名称（可能需要截断或换行）
                    if (name.length() > 20) {
                        name = name.substring(0, 18) + "..";
                    }
                    
                    String line = String.format("%-12s x%-3s %8s\n", name, qty, "¥" + price);
                    outputStream.write(line.getBytes("GBK"));
                }
            }
            
            // 分隔线
            outputStream.write(divider.getBytes("GBK"));
            
            // 金额
            double total = receipt.optDouble("total", 0);
            double discount = receipt.optDouble("discount", 0);
            double payment = receipt.optDouble("payment", 0);
            double change = receipt.optDouble("change", 0);
            
            outputStream.write(CMD_BOLD_ON);
            outputStream.write(("合计: ¥" + String.format("%.2f", total) + "\n").getBytes("GBK"));
            if (discount > 0) {
                outputStream.write(("优惠: -¥" + String.format("%.2f", discount) + "\n").getBytes("GBK"));
            }
            outputStream.write(CMD_BOLD_OFF);
            
            outputStream.write(("实收: ¥" + String.format("%.2f", payment) + "\n").getBytes("GBK"));
            outputStream.write(("找零: ¥" + String.format("%.2f", change) + "\n").getBytes("GBK"));
            
            // 分隔线
            outputStream.write(divider.getBytes("GBK"));
            
            // 底部信息
            outputStream.write(CMD_ALIGN_CENTER);
            outputStream.write("欢迎下次光临\n".getBytes("GBK"));
            outputStream.write("请妥善保管小票\n".getBytes("GBK"));
            outputStream.write("\n\n\n".getBytes("GBK"));
            
            // 切纸
            outputStream.write(CMD_FEED_CUT);
            outputStream.flush();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "小票打印完成");
            call.resolve(result);
            
            Log.d(TAG, "Receipt printed successfully");
            
        } catch (JSONException e) {
            call.reject("数据格式错误: " + e.getMessage());
        } catch (IOException e) {
            call.reject("打印失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void openCashbox(PluginCall call) {
        if (!isConnected) {
            call.reject("打印机未连接，无法打开钱箱");
            return;
        }
        
        try {
            // 发送钱箱命令
            outputStream.write(CMD_OPEN_CASHBOX);
            outputStream.flush();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "钱箱已打开");
            call.resolve(result);
            
            Log.d(TAG, "Cashbox opened");
            
        } catch (IOException e) {
            call.reject("打开钱箱失败: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("connected", isConnected);
        if (currentDevice != null) {
            result.put("deviceName", currentDevice.getName());
            result.put("deviceAddress", currentDevice.getAddress());
        }
        call.resolve(result);
    }
    
    @PluginMethod
    public void cutPaper(PluginCall call) {
        if (!isConnected) {
            call.reject("打印机未连接");
            return;
        }
        
        try {
            outputStream.write(CMD_FEED_CUT);
            outputStream.flush();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "切纸完成");
            call.resolve(result);
            
        } catch (IOException e) {
            call.reject("切纸失败: " + e.getMessage());
        }
    }
    
    private byte[] hexStringToByteArray(String s) {
        if (s == null || s.length() == 0) return new byte[0];
        
        int len = s.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4)
                    + Character.digit(s.charAt(i + 1), 16));
        }
        return data;
    }
}
