'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  HardwareService, 
  HardwareDevice, 
  PrinterStatus,
  ReceiptData,
  ScannerType,
  PrinterType 
} from '@/lib/hardware-service';

/**
 * 硬件设备管理 Hook
 * 提供扫码枪、打印机、钱箱的统一管理接口
 */
export function useHardware() {
  const hardwareService = HardwareService.getInstance();
  
  // 设备状态
  const [scanner, setScanner] = useState<HardwareDevice | null>(null);
  const [printer, setPrinter] = useState<HardwareDevice | null>(null);
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>('disconnected');
  const [cashboxStatus, setCahboxStatus] = useState<'closed' | 'open'>('closed');
  
  // 连接状态
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 清理函数引用
  const scannerCleanupRef = useRef<(() => void) | null>(null);

  // 扫码回调
  const [onBarcodeScanned, setOnBarcodeScanned] = useState<((barcode: string) => void) | null>(null);

  // 更新设备状态
  const updateDeviceStatus = useCallback(() => {
    const status = hardwareService.getDevicesStatus();
    setScanner(status.scanner);
    setPrinter(status.printer);
    setPrinterStatus(status.printerStatus);
    setCahboxStatus(status.cashbox);
  }, [hardwareService]);

  // 初始化硬件设备
  useEffect(() => {
    updateDeviceStatus();
    
    return () => {
      // 清理所有设备连接
      if (scannerCleanupRef.current) {
        scannerCleanupRef.current();
      }
    };
  }, [updateDeviceStatus]);

  // 启用扫码枪监听
  const enableScanner = useCallback((type: ScannerType, callback: (barcode: string) => void): (() => void) | undefined => {
    setOnBarcodeScanned(() => callback);
    
    if (type === 'usb') {
      // 清理旧的监听器
      if (scannerCleanupRef.current) {
        scannerCleanupRef.current();
      }
      
      // 启用 USB 扫码枪
      scannerCleanupRef.current = hardwareService.enableUsbScanner((barcode) => {
        console.log('[useHardware] Barcode scanned:', barcode);
        callback(barcode);
      });
      
      setScanner({
        id: 'usb-scanner',
        name: 'USB 扫码枪',
        type: 'usb',
        status: 'connected',
      });
      
      // 返回清理函数
      return () => {
        if (scannerCleanupRef.current) {
          scannerCleanupRef.current();
          scannerCleanupRef.current = null;
        }
        setScanner(null);
      };
    }
    
    return undefined;
  }, [hardwareService]);

  // 禁用扫码枪
  const disableScanner = useCallback(() => {
    if (scannerCleanupRef.current) {
      scannerCleanupRef.current();
      scannerCleanupRef.current = null;
    }
    setScanner(null);
    setOnBarcodeScanned(null);
  }, []);

  // 连接打印机
  const connectPrinter = useCallback(async (type: PrinterType, config?: { ipAddress?: string; port?: number }) => {
    setIsConnecting(true);
    setError(null);

    try {
      let device: HardwareDevice | null = null;

      switch (type) {
        case 'usb':
          device = await hardwareService.connectUsbPrinter();
          break;
        case 'bluetooth':
          device = await hardwareService.connectBluetoothPrinter();
          break;
        case 'network':
          if (!config?.ipAddress) {
            throw new Error('网络打印机需要提供IP地址');
          }
          device = await hardwareService.connectNetworkPrinter(config.ipAddress, config.port || 9100);
          break;
      }

      if (device) {
        setPrinter(device);
        setPrinterStatus('connected');
      }

      return device;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '连接失败';
      setError(errorMsg);
      setPrinterStatus('error');
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [hardwareService]);

  // 断开打印机
  const disconnectPrinter = useCallback(async () => {
    await hardwareService.disconnectPrinter();
    setPrinter(null);
    setPrinterStatus('disconnected');
  }, [hardwareService]);

  // 打印小票
  const printReceipt = useCallback(async (data: ReceiptData): Promise<boolean> => {
    try {
      const result = await hardwareService.printReceipt(data);
      if (result) {
        updateDeviceStatus();
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '打印失败');
      return false;
    }
  }, [hardwareService, updateDeviceStatus]);

  // 测试打印
  const testPrint = useCallback(async (): Promise<boolean> => {
    try {
      const result = await hardwareService.testPrint();
      updateDeviceStatus();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '测试打印失败');
      return false;
    }
  }, [hardwareService, updateDeviceStatus]);

  // 打开钱箱
  const openCashbox = useCallback(async (): Promise<boolean> => {
    try {
      const result = await hardwareService.openCashbox();
      if (result) {
        setCahboxStatus('open');
        // 1秒后自动恢复为关闭状态
        setTimeout(() => setCahboxStatus('closed'), 1000);
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '打开钱箱失败');
      return false;
    }
  }, [hardwareService]);

  // 设备自检
  const selfTest = useCallback(async () => {
    return await hardwareService.selfTest();
  }, [hardwareService]);

  // 断开所有设备
  const disconnectAll = useCallback(async () => {
    disableScanner();
    await disconnectPrinter();
    setCahboxStatus('closed');
  }, [disableScanner, disconnectPrinter]);

  return {
    // 设备状态
    scanner,
    printer,
    printerStatus,
    cashboxStatus,
    
    // 连接状态
    isConnecting,
    error,
    
    // 扫码枪操作
    enableScanner,
    disableScanner,
    
    // 打印机操作
    connectPrinter,
    disconnectPrinter,
    printReceipt,
    testPrint,
    
    // 钱箱操作
    openCashbox,
    
    // 工具方法
    selfTest,
    disconnectAll,
    updateDeviceStatus,
  };
}

/**
 * 检查是否在支持硬件的环境（原生App或HTTPS）
 */
export function isHardwareSupported(): boolean {
  // 检查是否在安全上下文（HTTPS 或 localhost）
  const isSecureContext = window.isSecureContext;
  
  // 检查是否支持 Web Serial（USB 设备）
  const hasSerial = 'serial' in navigator;
  
  // 检查是否支持 Web Bluetooth
  const hasBluetooth = 'bluetooth' in navigator;
  
  return isSecureContext && (hasSerial || hasBluetooth);
}

/**
 * 获取支持的硬件特性
 */
export function getSupportedHardwareFeatures(): {
  usb: boolean;
  bluetooth: boolean;
  camera: boolean;
} {
  return {
    usb: 'serial' in navigator,
    bluetooth: 'bluetooth' in navigator,
    camera: !!navigator.mediaDevices?.getUserMedia,
  };
}
