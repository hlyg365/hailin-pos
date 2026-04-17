package com.hailin.pos.hardware;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintJob;
import android.print.PrintManager;
import android.util.Log;
import android.print.pdf.PrintedPdfDocument;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * 打印机插件 - 支持小票打印和标签打印
 */
@NativePlugin(
    permissions = {"android.permission.INTERNET", "android.hardware.usb.host"}
)
public class PrinterPlugin extends Plugin {
    
    private static final String TAG = "PrinterPlugin";
    
    private UsbManager usbManager;
    private UsbDevice currentPrinter;
    
    // ESC/POS 指令常量
    private static final byte ESC = 0x1B;
    private static final byte GS = 0x1D;
    private static final byte LF = 0x0A;
    
    @Override
    public void load() {
        super.load();
        usbManager = (UsbManager) context.getSystemService(Context.USB_SERVICE);
        Log.d(TAG, "PrinterPlugin loaded");
    }
    
    /**
     * 列出可用打印机
     */
    @PluginMethod
    public void listPrinters(PluginCall call) {
        try {
            JSObject result = new JSObject();
            
            // 获取USB设备列表
            var devices = usbManager.getDeviceList();
            int count = 0;
            
            for (UsbDevice device : devices.values()) {
                // 简单判断是否为打印机（通常Vendor ID在特定范围内）
                // 实际使用时需要根据具体打印机调整
                int vid = device.getVendorId();
                int pid = device.getProductId();
                
                // 常见的打印机Vendor ID
                if (vid == 0x0483 || vid == 0x04B8 || vid == 0x0519 || vid == 0x1504) {
                    count++;
                }
            }
            
            result.put("count", count);
            result.put("message", "使用Android Print Service进行打印");
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("Failed to list printers: " + e.getMessage());
        }
    }
    
    /**
     * 打印小票
     */
    @PluginMethod
    public void printReceipt(PluginCall call) {
        String storeName = call.getString("storeName", "海邻到家");
        String orderNo = call.getString("orderNo", "");
        String date = call.getString("date", "");
        String cashier = call.getString("cashier", "");
        double total = call.getDouble("total", 0);
        String paymentMethod = call.getString("paymentMethod", "");
        
        JSArray items = call.getArray("items");
        
        try {
            // 构建小票内容
            StringBuilder content = new StringBuilder();
            content.append("\n");
            content.append(centerText(storeName, 32)).append("\n");
            content.append("-".repeat(32)).append("\n");
            content.append("单号: ").append(orderNo).append("\n");
            content.append("时间: ").append(date).append("\n");
            content.append("收银: ").append(cashier).append("\n");
            content.append("-".repeat(32)).append("\n");
            
            if (items != null) {
                for (int i = 0; i < items.length(); i++) {
                    JSObject item = items.getJSONObject(i);
                    String name = item.getString("name", "");
                    int qty = item.getInt("qty", 1);
                    double price = item.getDouble("price", 0);
                    
                    content.append(name).append("\n");
                    content.append("  x").append(qty).append("      ¥").append(String.format("%.2f", price)).append("\n");
                }
            }
            
            content.append("-".repeat(32)).append("\n");
            content.append("合计:              ¥").append(String.format("%.2f", total)).append("\n");
            content.append("支付方式: ").append(paymentMethod).append("\n");
            content.append("\n");
            content.append(centerText("谢谢惠顾", 32)).append("\n");
            content.append("\n\n\n");
            
            // 使用Android Print Service打印
            printViaAndroidPrint(content.toString());
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "小票已发送到打印机");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Print error", e);
            call.reject("打印失败: " + e.getMessage());
        }
    }
    
    /**
     * 打印标签
     */
    @PluginMethod
    public void printLabel(PluginCall call) {
        String name = call.getString("name", "");
        double price = call.getDouble("price", 0);
        String barcode = call.getString("barcode", "");
        String date = call.getString("date", "");
        
        try {
            // 构建标签内容
            StringBuilder content = new StringBuilder();
            content.append("\n");
            content.append(centerText(name, 20)).append("\n");
            content.append("\n");
            content.append("¥").append(String.format("%.2f", price)).append("\n");
            content.append("\n");
            content.append(barcode).append("\n");
            if (date != null && !date.isEmpty()) {
                content.append(date).append("\n");
            }
            content.append("\n\n");
            
            printViaAndroidPrint(content.toString());
            
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("标签打印失败: " + e.getMessage());
        }
    }
    
    /**
     * 打印测试页
     */
    @PluginMethod
    public void printTest(PluginCall call) {
        String content = "\n\n" +
                centerText("海邻到家", 32) + "\n" +
                centerText("打印测试", 32) + "\n" +
                "\n" +
                "测试时间: " + java.text.DateFormat.getDateTimeInstance().format(new java.util.Date()) + "\n" +
                "\n" +
                "打印机连接正常\n" +
                "字体测试: ABCabc123\n" +
                "\n" +
                "\n\n\n";
        
        try {
            printViaAndroidPrint(content);
            
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("测试打印失败: " + e.getMessage());
        }
    }
    
    /**
     * 使用Android Print Service打印
     */
    private void printViaAndroidPrint(String content) {
        PrintManager printManager = (PrintManager) context.getSystemService(Context.PRINT_SERVICE);
        String jobName = context.getPackageName() + " - 收据打印";
        
        printManager.print(jobName, new PrintDocumentAdapter() {
            
            @Override
            public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes,
                                android.os.CancellationSignal cancellationSignal,
                                LayoutResultCallback callback, android.os.Bundle extras) {
                
                if (cancellationSignal.isCanceled()) {
                    callback.onLayoutCancelled();
                    return;
                }
                
                PrintedPdfDocument document = new PrintedPdfDocument(context, newAttributes);
                
                android.graphics.Canvas canvas = document.startPage(0).getCanvas();
                canvas.drawText(content, 20, 50, new android.graphics.Paint());
                document.finishPage(document);
                
                callback.onLayoutFinished(document, true);
            }
            
            @Override
            public void onWrite(android.print.PageRange[] pages, android.os.ParcelFileDescriptor destination,
                               android.os.CancellationSignal cancellationSignal,
                               WriteResultCallback callback) {
                // 写入PDF
                try {
                    document.writeTo(new FileOutputStream(destination.getFileDescriptor()));
                    callback.onWriteFinished(new android.print.PageRange[]{android.print.PageRange.ALL_PAGES});
                } catch (IOException e) {
                    callback.onWriteFailed(e.getMessage());
                }
            }
        }, null);
    }
    
    private String centerText(String text, int width) {
        if (text.length() >= width) return text;
        int padding = (width - text.length()) / 2;
        return " ".repeat(padding) + text;
    }
}
