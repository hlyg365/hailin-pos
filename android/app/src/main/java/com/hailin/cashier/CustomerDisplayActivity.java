package com.hailin.cashier;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Display;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import java.util.HashMap;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

/**
 * 客显屏Activity
 * 用于在副屏显示收银信息，包括金额、支付二维码等
 */
public class CustomerDisplayActivity extends Activity {
    
    private LinearLayout containerLayout;
    private TextView tvTitle;
    private TextView tvSubtitle;
    private TextView tvAmount;
    private TextView tvOrderNo;
    private ImageView ivQrCode;
    private TextView tvPaymentMethod;
    
    private LinearLayout welcomeLayout;
    private LinearLayout amountLayout;
    private LinearLayout paymentLayout;
    private LinearLayout successLayout;
    private LinearLayout errorLayout;
    
    private BroadcastReceiver displayReceiver;
    private Handler handler;
    private Timer animationTimer;
    
    // 动画相关
    private int dotCount = 0;
    
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 设置为全屏、无标题栏
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // 获取副屏信息
        Display display = getWindow().getDecorView().getDisplay();
        if (display != null) {
            android.util.Log.d("CustomerDisplay", "Display: " + display.getName());
        }
        
        // 初始化UI
        initUI();
        
        // 注册广播接收器
        registerDisplayReceiver();
        
        // 显示欢迎页面
        showWelcome("欢迎光临", "请扫描商品");
        
        // 启动动画
        startAnimations();
    }
    
    private void initUI() {
        handler = new Handler(Looper.getMainLooper());
        
        // 主容器
        containerLayout = new LinearLayout(this);
        containerLayout.setOrientation(LinearLayout.VERTICAL);
        containerLayout.setGravity(android.view.Gravity.CENTER);
        containerLayout.setBackgroundColor(Color.WHITE);
        
        // 欢迎页面布局
        welcomeLayout = createWelcomeLayout();
        
        // 金额页面布局
        amountLayout = createAmountLayout();
        
        // 支付页面布局
        paymentLayout = createPaymentLayout();
        
        // 成功页面布局
        successLayout = createSuccessLayout();
        
        // 错误页面布局
        errorLayout = createErrorLayout();
        
        // 添加所有布局到容器（初始全部隐藏）
        containerLayout.addView(welcomeLayout);
        containerLayout.addView(amountLayout);
        containerLayout.addView(paymentLayout);
        containerLayout.addView(successLayout);
        containerLayout.addView(errorLayout);
        
        hideAllLayouts();
        
        setContentView(containerLayout);
    }
    
    private LinearLayout createWelcomeLayout() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(android.view.Gravity.CENTER);
        layout.setPadding(60, 80, 60, 80);
        
        tvTitle = new TextView(this);
        tvTitle.setTextSize(72);
        tvTitle.setTextColor(ContextCompat.getColor(this, android.R.color.black));
        tvTitle.setGravity(android.view.Gravity.CENTER);
        
        tvSubtitle = new TextView(this);
        tvSubtitle.setTextSize(36);
        tvSubtitle.setTextColor(Color.GRAY);
        tvSubtitle.setGravity(android.view.Gravity.CENTER);
        tvSubtitle.setPadding(0, 30, 0, 0);
        
        layout.addView(tvTitle);
        layout.addView(tvSubtitle);
        
        return layout;
    }
    
    private LinearLayout createAmountLayout() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(android.view.Gravity.CENTER);
        layout.setPadding(60, 80, 60, 80);
        
        tvOrderNo = new TextView(this);
        tvOrderNo.setTextSize(28);
        tvOrderNo.setTextColor(Color.GRAY);
        tvOrderNo.setGravity(android.view.Gravity.CENTER);
        
        TextView labelAmount = new TextView(this);
        labelAmount.setText("应收金额");
        labelAmount.setTextSize(36);
        labelAmount.setTextColor(Color.GRAY);
        labelAmount.setGravity(android.view.Gravity.CENTER);
        
        tvAmount = new TextView(this);
        tvAmount.setTextSize(96);
        tvAmount.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark));
        tvAmount.setGravity(android.view.Gravity.CENTER);
        tvAmount.setTypeface(null, android.graphics.Typeface.BOLD);
        
        layout.addView(tvOrderNo);
        layout.addView(labelAmount);
        layout.addView(tvAmount);
        
        return layout;
    }
    
    private LinearLayout createPaymentLayout() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(android.view.Gravity.CENTER);
        layout.setPadding(60, 40, 60, 40);
        
        tvPaymentMethod = new TextView(this);
        tvPaymentMethod.setTextSize(32);
        tvPaymentMethod.setTextColor(Color.GRAY);
        tvPaymentMethod.setGravity(android.view.Gravity.CENTER);
        
        ivQrCode = new ImageView(this);
        ivQrCode.setScaleType(ImageView.ScaleType.FIT_CENTER);
        LinearLayout.LayoutParams qrParams = new LinearLayout.LayoutParams(600, 600);
        qrParams.gravity = android.view.Gravity.CENTER;
        ivQrCode.setLayoutParams(qrParams);
        
        TextView tvQrAmount = new TextView(this);
        tvQrAmount.setTextSize(36);
        tvQrAmount.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark));
        tvQrAmount.setGravity(android.view.Gravity.CENTER);
        tvQrAmount.setId(View.generateViewId());
        
        TextView tvHint = new TextView(this);
        tvHint.setText("请扫描二维码支付");
        tvHint.setTextSize(24);
        tvHint.setTextColor(Color.GRAY);
        tvHint.setGravity(android.view.Gravity.CENTER);
        tvHint.setPadding(0, 20, 0, 0);
        
        layout.addView(tvPaymentMethod);
        layout.addView(ivQrCode);
        layout.addView(tvQrAmount);
        layout.addView(tvHint);
        
        return layout;
    }
    
    private LinearLayout createSuccessLayout() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(android.view.Gravity.CENTER);
        layout.setPadding(60, 80, 60, 80);
        layout.setBackgroundColor(Color.parseColor("#E8F5E9")); // 浅绿色背景
        
        TextView ivCheck = new TextView(this);
        ivCheck.setText("✓");
        ivCheck.setTextSize(120);
        ivCheck.setTextColor(Color.parseColor("#4CAF50"));
        ivCheck.setGravity(android.view.Gravity.CENTER);
        
        TextView tvSuccessMsg = new TextView(this);
        tvSuccessMsg.setTextSize(48);
        tvSuccessMsg.setTextColor(Color.parseColor("#2E7D32"));
        tvSuccessMsg.setGravity(android.view.Gravity.CENTER);
        tvSuccessMsg.setId(View.generateViewId());
        
        TextView tvSuccessAmount = new TextView(this);
        tvSuccessAmount.setTextSize(36);
        tvSuccessAmount.setTextColor(Color.parseColor("#2E7D32"));
        tvSuccessAmount.setGravity(android.view.Gravity.CENTER);
        tvSuccessAmount.setId(View.generateViewId());
        
        layout.addView(ivCheck);
        layout.addView(tvSuccessMsg);
        layout.addView(tvSuccessAmount);
        
        return layout;
    }
    
    private LinearLayout createErrorLayout() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(android.view.Gravity.CENTER);
        layout.setPadding(60, 80, 60, 80);
        layout.setBackgroundColor(Color.parseColor("#FFEBEE")); // 浅红色背景
        
        TextView ivX = new TextView(this);
        ivX.setText("✗");
        ivX.setTextSize(120);
        ivX.setTextColor(Color.parseColor("#F44336"));
        ivX.setGravity(android.view.Gravity.CENTER);
        
        TextView tvErrorMsg = new TextView(this);
        tvErrorMsg.setTextSize(48);
        tvErrorMsg.setTextColor(Color.parseColor("#C62828"));
        tvErrorMsg.setGravity(android.view.Gravity.CENTER);
        tvErrorMsg.setId(View.generateViewId());
        
        layout.addView(ivX);
        layout.addView(tvErrorMsg);
        
        return layout;
    }
    
    private void hideAllLayouts() {
        welcomeLayout.setVisibility(View.GONE);
        amountLayout.setVisibility(View.GONE);
        paymentLayout.setVisibility(View.GONE);
        successLayout.setVisibility(View.GONE);
        errorLayout.setVisibility(View.GONE);
    }
    
    /**
     * 注册广播接收器
     */
    private void registerDisplayReceiver() {
        displayReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if ("com.hailin.cashier.UPDATE_DISPLAY".equals(intent.getAction())) {
                    Map<String, String> data = (Map<String, String>) intent.getSerializableExtra("data");
                    if (data != null) {
                        handleDisplayUpdate(data);
                    }
                }
            }
        };
        
        IntentFilter filter = new IntentFilter("com.hailin.cashier.UPDATE_DISPLAY");
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(displayReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(displayReceiver, filter);
        }
    }
    
    /**
     * 处理显示更新
     */
    private void handleDisplayUpdate(Map<String, String> data) {
        handler.post(() -> {
            String type = data.get("type");
            
            hideAllLayouts();
            
            switch (type) {
                case "welcome":
                case "clear":
                    showWelcome(data.get("title"), data.get("subtitle"));
                    break;
                    
                case "amount":
                    showAmount(data.get("orderNo"), data.get("amount"));
                    break;
                    
                case "payment":
                    showPayment(data.get("method"), data.get("qrAmount"), data.get("qrContent"));
                    break;
                    
                case "success":
                    showSuccess(data.get("message"), data.get("successAmount"));
                    break;
                    
                case "error":
                    showError(data.get("message"));
                    break;
                    
                case "qrcode":
                    showQRCode(data.get("qrTitle"), data.get("qrAmount"), data.get("qrContent"));
                    break;
            }
        });
    }
    
    private void showWelcome(String title, String subtitle) {
        hideAllLayouts();
        welcomeLayout.setVisibility(View.VISIBLE);
        
        tvTitle.setText(title != null ? title : "欢迎光临");
        tvSubtitle.setText(subtitle != null ? subtitle : "请扫描商品");
    }
    
    private void showAmount(String orderNo, String amount) {
        hideAllLayouts();
        amountLayout.setVisibility(View.VISIBLE);
        
        if (orderNo != null && !orderNo.isEmpty()) {
            tvOrderNo.setText("订单号: " + orderNo);
            tvOrderNo.setVisibility(View.VISIBLE);
        } else {
            tvOrderNo.setVisibility(View.GONE);
        }
        
        if (amount != null && !amount.isEmpty()) {
            tvAmount.setText("¥" + amount);
        } else {
            tvAmount.setText("¥0.00");
        }
    }
    
    private void showPayment(String method, String amount, String qrContent) {
        hideAllLayouts();
        paymentLayout.setVisibility(View.VISIBLE);
        
        tvPaymentMethod.setText(method != null ? method : "扫码支付");
        
        if (qrContent != null && !qrContent.isEmpty()) {
            generateQRCode(qrContent);
        }
    }
    
    private void showQRCode(String title, String amount, String content) {
        hideAllLayouts();
        paymentLayout.setVisibility(View.VISIBLE);
        
        if (title != null) {
            tvPaymentMethod.setText(title);
        }
        
        if (content != null && !content.isEmpty()) {
            generateQRCode(content);
        }
    }
    
    private void showSuccess(String message, String amount) {
        hideAllLayouts();
        successLayout.setVisibility(View.VISIBLE);
        
        // 查找子视图并更新
        if (message != null) {
            TextView tvMsg = successLayout.findViewById(View.generateViewId());
            // 实际应该使用固定的ID
        }
    }
    
    private void showError(String message) {
        hideAllLayouts();
        errorLayout.setVisibility(View.VISIBLE);
        
        TextView tvError = errorLayout.findViewById(0);
        if (tvError != null && message != null) {
            tvError.setText(message);
        }
    }
    
    /**
     * 生成二维码
     */
    private void generateQRCode(String content) {
        if (content == null || content.isEmpty()) {
            ivQrCode.setImageResource(android.R.color.darker_gray);
            return;
        }
        
        try {
            int size = 600;
            QRCodeWriter writer = new QRCodeWriter();
            
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 1);
            
            BitMatrix bitMatrix = writer.encode(content, BarcodeFormat.QR_CODE, size, size, hints);
            
            int[] pixels = new int[size * size];
            for (int y = 0; y < size; y++) {
                for (int x = 0; x < size; x++) {
                    pixels[y * size + x] = bitMatrix.get(x, y) ? Color.BLACK : Color.WHITE;
                }
            }
            
            android.graphics.Bitmap bitmap = android.graphics.Bitmap.createBitmap(size, size, android.graphics.Bitmap.Config.ARGB_8888);
            bitmap.setPixels(pixels, 0, size, 0, 0, size, size);
            
            ivQrCode.setImageBitmap(bitmap);
            
        } catch (WriterException e) {
            android.util.Log.e("CustomerDisplay", "Error generating QR code", e);
        }
    }
    
    /**
     * 启动动画效果
     */
    private void startAnimations() {
        animationTimer = new Timer();
        animationTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                handler.post(() -> {
                    if (welcomeLayout.getVisibility() == View.VISIBLE) {
                        // 添加等待动画
                        dotCount = (dotCount + 1) % 4;
                        StringBuilder dots = new StringBuilder();
                        for (int i = 0; i < dotCount; i++) {
                            dots.append(".");
                        }
                        String subtitle = tvSubtitle.getText().toString().replaceAll("\\.*$", "");
                        tvSubtitle.setText(subtitle + dots.toString());
                    }
                });
            }
        }, 0, 500);
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        
        // 取消注册广播接收器
        if (displayReceiver != null) {
            try {
                unregisterReceiver(displayReceiver);
            } catch (Exception e) {
                android.util.Log.e("CustomerDisplay", "Error unregistering receiver", e);
            }
        }
        
        // 停止动画
        if (animationTimer != null) {
            animationTimer.cancel();
        }
    }
}
