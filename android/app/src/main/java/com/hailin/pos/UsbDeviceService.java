package com.hailin.pos;

import android.app.Service;
import android.content.Intent;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;
import android.os.Binder;
import android.os.IBinder;
import android.util.Log;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * USB设备服务
 * 
 * 用于管理USB设备的连接和数据传输
 * 支持串口秤等USB转串口设备
 */
public class UsbDeviceService extends Service {
    
    private static final String TAG = "UsbDeviceService";
    
    private UsbManager usbManager;
    private UsbDevice currentDevice;
    private UsbDeviceConnection connection;
    private UsbInterface usbInterface;
    
    private InputStream inputStream;
    private OutputStream outputStream;
    
    private final IBinder binder = new LocalBinder();
    
    public class LocalBinder extends Binder {
        public UsbDeviceService getService() {
            return UsbDeviceService.this;
        }
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        usbManager = (UsbManager) getSystemService(USB_SERVICE);
        Log.d(TAG, "UsbDeviceService created");
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if ("connect".equals(action)) {
                UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                if (device != null) {
                    connectDevice(device);
                }
            } else if ("disconnect".equals(action)) {
                disconnectDevice();
            }
        }
        return START_NOT_STICKY;
    }
    
    /**
     * 连接到USB设备
     */
    public boolean connectDevice(UsbDevice device) {
        try {
            if (usbManager == null) {
                usbManager = (UsbManager) getSystemService(USB_SERVICE);
            }
            
            currentDevice = device;
            
            // 检查权限
            if (!usbManager.hasPermission(device)) {
                Log.w(TAG, "No permission for device");
                return false;
            }
            
            // 打开设备连接
            connection = usbManager.openDevice(device);
            if (connection == null) {
                Log.e(TAG, "Failed to open device");
                return false;
            }
            
            // 获取USB接口（通常是0）
            usbInterface = device.getInterface(0);
            
            // Claim接口
            if (!connection.claimInterface(usbInterface, true)) {
                Log.e(TAG, "Failed to claim interface");
                connection.close();
                return false;
            }
            
            // 查找端点
            UsbEndpoint endpointIn = null;
            UsbEndpoint endpointOut = null;
            
            for (int i = 0; i < usbInterface.getEndpointCount(); i++) {
                UsbEndpoint ep = usbInterface.getEndpoint(i);
                if (ep.getDirection() == UsbConstants.USB_DIR_IN) {
                    endpointIn = ep;
                } else if (ep.getDirection() == UsbConstants.USB_DIR_OUT) {
                    endpointOut = ep;
                }
            }
            
            Log.d(TAG, "Connected to USB device: " + device.getDeviceName());
            return true;
            
        } catch (Exception e) {
            Log.e(TAG, "Error connecting to device", e);
            return false;
        }
    }
    
    /**
     * 断开USB设备连接
     */
    public void disconnectDevice() {
        try {
            if (connection != null) {
                if (usbInterface != null) {
                    connection.releaseInterface(usbInterface);
                }
                connection.close();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error disconnecting device", e);
        } finally {
            connection = null;
            usbInterface = null;
            currentDevice = null;
        }
    }
    
    /**
     * 从设备读取数据
     */
    public byte[] read(int timeout) {
        if (connection == null || usbInterface == null) {
            return null;
        }
        
        try {
            // 查找IN端点
            UsbEndpoint endpointIn = null;
            for (int i = 0; i < usbInterface.getEndpointCount(); i++) {
                UsbEndpoint ep = usbInterface.getEndpoint(i);
                if (ep.getDirection() == UsbConstants.USB_DIR_IN) {
                    endpointIn = ep;
                    break;
                }
            }
            
            if (endpointIn == null) {
                return null;
            }
            
            byte[] buffer = new byte[endpointIn.getMaxPacketSize()];
            int bytesRead = connection.bulkTransfer(endpointIn, buffer, buffer.length, timeout);
            
            if (bytesRead > 0) {
                byte[] data = new byte[bytesRead];
                System.arraycopy(buffer, 0, data, 0, bytesRead);
                return data;
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error reading from device", e);
        }
        
        return null;
    }
    
    /**
     * 向设备写入数据
     */
    public int write(byte[] data, int timeout) {
        if (connection == null || usbInterface == null) {
            return -1;
        }
        
        try {
            // 查找OUT端点
            UsbEndpoint endpointOut = null;
            for (int i = 0; i < usbInterface.getEndpointCount(); i++) {
                UsbEndpoint ep = usbInterface.getEndpoint(i);
                if (ep.getDirection() == UsbConstants.USB_DIR_OUT) {
                    endpointOut = ep;
                    break;
                }
            }
            
            if (endpointOut == null) {
                return -1;
            }
            
            return connection.bulkTransfer(endpointOut, data, data.length, timeout);
            
        } catch (Exception e) {
            Log.e(TAG, "Error writing to device", e);
            return -1;
        }
    }
    
    /**
     * 检查设备是否已连接
     */
    public boolean isConnected() {
        return connection != null && currentDevice != null;
    }
    
    @Override
    public void onDestroy() {
        disconnectDevice();
        super.onDestroy();
        Log.d(TAG, "UsbDeviceService destroyed");
    }
}
