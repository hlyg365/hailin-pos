// ============================================
// 海邻到家 - 硬件Hooks
// 收银台专用硬件设备管理
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { hardwareService, type HardwareConfig } from '../services/hardwareService';
import type { Device, PrinterConfig, ScaleConfig, ReceiptData } from '@hailin/core';

/** 硬件状态Hook */
export function useHardware() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  // 初始化硬件
  const initialize = useCallback(async (config?: HardwareConfig) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await hardwareService.initialize(config);
      
      if (!result.success) {
        setError(result.errors.join(', '));
      }
      
      setDevices(hardwareService.getDevices());
      setInitialized(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 刷新设备状态
  const refreshDevices = useCallback(() => {
    setDevices(hardwareService.getDevices());
  }, []);
  
  // 重置硬件
  const reset = useCallback(async () => {
    await hardwareService.reset();
    setDevices([]);
    setInitialized(false);
  }, []);
  
  // 监听设备变化
  useEffect(() => {
    const interval = setInterval(() => {
      if (initialized) {
        refreshDevices();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [initialized, refreshDevices]);
  
  return {
    devices,
    loading,
    error,
    initialized,
    initialize,
    refreshDevices,
    reset,
  };
}

/** 打印机Hook */
export function usePrinter() {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'printing' | 'error'>('disconnected');
  const [loading, setLoading] = useState(false);
  
  // 连接打印机
  const connect = useCallback(async (config: PrinterConfig) => {
    setLoading(true);
    try {
      const success = await hardwareService.printer.connect(config);
      setStatus(success ? 'connected' : 'error');
      return success;
    } catch (err) {
      setStatus('error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 打印小票
  const print = useCallback(async (data: ReceiptData) => {
    if (status !== 'connected') {
      throw new Error('打印机未连接');
    }
    
    setStatus('printing');
    try {
      const success = await hardwareService.printer.printReceipt(data);
      setStatus('connected');
      return success;
    } catch (err) {
      setStatus('error');
      throw err;
    }
  }, [status]);
  
  // 断开连接
  const disconnect = useCallback(async () => {
    await hardwareService.printer.disconnect();
    setStatus('disconnected');
  }, []);
  
  return {
    status,
    loading,
    isConnected: status === 'connected',
    isPrinting: status === 'printing',
    connect,
    print,
    disconnect,
  };
}

/** 扫码枪Hook */
export function useScanner() {
  const [status, setStatus] = useState<'disconnected' | 'listening' | 'scanning'>('disconnected');
  const [lastScan, setLastScan] = useState<{ barcode: string; type: string; time: number } | null>(null);
  
  // 开始监听
  const startListening = useCallback((callback: (barcode: string, type: string) => void) => {
    const cleanup = hardwareService.scanner.startListening((barcode, type) => {
      setStatus('scanning');
      setLastScan({ barcode, type, time: Date.now() });
      
      setTimeout(() => {
        setStatus('listening');
      }, 100);
      
      callback(barcode, type);
    });
    
    setStatus('listening');
    return cleanup;
  }, []);
  
  // 停止监听
  const stopListening = useCallback(() => {
    hardwareService.scanner.stopListening();
    setStatus('disconnected');
  }, []);
  
  // 摄像头扫码
  const scanWithCamera = useCallback(async () => {
    const result = await hardwareService.scanner.scanWithCamera();
    if (result) {
      setLastScan({ barcode: result, type: 'unknown', time: Date.now() });
    }
    return result;
  }, []);
  
  return {
    status,
    lastScan,
    isListening: status === 'listening',
    startListening,
    stopListening,
    scanWithCamera,
  };
}

/** 钱箱Hook */
export function useCashbox() {
  const [status, setStatus] = useState<'disconnected' | 'closed' | 'open' | 'error'>('disconnected');
  
  // 打开钱箱
  const open = useCallback(async () => {
    try {
      const success = await hardwareService.cashbox.open();
      setStatus(success ? 'open' : 'error');
      
      // 3秒后自动关闭
      setTimeout(() => {
        setStatus('closed');
      }, 3000);
      
      return success;
    } catch (err) {
      setStatus('error');
      return false;
    }
  }, []);
  
  // 关联打印机
  const linkPrinter = useCallback((printer: any) => {
    hardwareService.cashbox.setPrinter(printer);
    setStatus('closed');
  }, []);
  
  return {
    status,
    isOpen: status === 'open',
    open,
    linkPrinter,
  };
}

/** 电子秤Hook */
export function useScale() {
  const [status, setStatus] = useState<'disconnected' | 'connected' | 'weighing' | 'stable' | 'error'>('disconnected');
  const [reading, setReading] = useState<{ weight: number; unit: string; stable: boolean } | null>(null);
  
  // 连接电子秤
  const connect = useCallback(async (config: ScaleConfig) => {
    try {
      const success = await hardwareService.scale.connect(config);
      setStatus(success ? 'connected' : 'error');
      return success;
    } catch (err) {
      setStatus('error');
      return false;
    }
  }, []);
  
  // 获取重量
  const getWeight = useCallback(async () => {
    if (status !== 'connected' && status !== 'weighing' && status !== 'stable') {
      return null;
    }
    
    try {
      const result = await hardwareService.scale.getWeight();
      if (result) {
        setReading(result);
        setStatus(result.stable ? 'stable' : 'weighing');
      }
      return result;
    } catch (err) {
      return null;
    }
  }, [status]);
  
  // 去皮
  const tare = useCallback(async () => {
    const success = await hardwareService.scale.tare();
    if (success) {
      setReading({ weight: 0, unit: reading?.unit || 'kg', stable: true });
    }
    return success;
  }, [reading]);
  
  // 断开连接
  const disconnect = useCallback(async () => {
    await hardwareService.scale.disconnect();
    setStatus('disconnected');
    setReading(null);
  }, []);
  
  return {
    status,
    reading,
    isConnected: status === 'connected' || status === 'weighing' || status === 'stable',
    isStable: status === 'stable',
    connect,
    getWeight,
    tare,
    disconnect,
  };
}
