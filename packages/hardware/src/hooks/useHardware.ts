// ============================================
// 海邻到家 - 硬件Hooks
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { hardwareService, HardwareConfig } from '../services/hardwareService';
import { useDeviceStore } from '@hailin/core';
import type { Device, ReceiptData } from '@hailin/core';

/** 硬件状态Hook */
export function useHardware() {
  const { 
    printerConnected, scannerConnected, cashboxConnected, scaleConnected,
    updateDeviceStatus, resetDevices 
  } = useDeviceStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // 监听设备变化
  useEffect(() => {
    const unsubscribe = hardwareService.addListener((devices) => {
      devices.forEach(device => {
        updateDeviceStatus(device.type, device.status === 'connected');
      });
    });

    // 立即获取初始状态
    const devices = hardwareService.getDevices();
    devices.forEach(device => {
      updateDeviceStatus(device.type, device.status === 'connected');
    });

    return unsubscribe;
  }, [updateDeviceStatus]);

  // 初始化硬件
  const initialize = useCallback(async (config?: HardwareConfig) => {
    setLoading(true);
    setError(null);

    try {
      const result = await hardwareService.initialize(config);

      if (!result.success) {
        setError(result.errors.join(', '));
      }

      setInitialized(true);
      return result;
    } catch (err: any) {
      setError(err.message);
      return { success: false, errors: [err.message] };
    } finally {
      setLoading(false);
    }
  }, []);

  // 重置硬件
  const reset = useCallback(async () => {
    await hardwareService.reset();
    resetDevices();
    setInitialized(false);
  }, [resetDevices]);

  return {
    printerConnected,
    scannerConnected,
    cashboxConnected,
    scaleConnected,
    loading,
    error,
    initialized,
    initialize,
    reset,
  };
}

/** 打印机Hook */
export function usePrinter() {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'printing' | 'error'>('disconnected');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = hardwareService.printer.addStatusListener(setStatus);
    return unsubscribe;
  }, []);

  const connect = useCallback(async (config: Parameters<typeof hardwareService.printer.connect>[0]) => {
    setLoading(true);
    try {
      const success = await hardwareService.printer.connect(config);
      return success;
    } finally {
      setLoading(false);
    }
  }, []);

  const print = useCallback(async (data: ReceiptData) => {
    return await hardwareService.printer.printReceipt(data);
  }, []);

  const disconnect = useCallback(async () => {
    await hardwareService.printer.disconnect();
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

  useEffect(() => {
    const unsubscribe = hardwareService.scanner.addStatusListener(setStatus);
    return unsubscribe;
  }, []);

  const startListening = useCallback((callback: (barcode: string, type: string) => void) => {
    hardwareService.scanner.startListening((barcode, type) => {
      setLastScan({ barcode, type, time: Date.now() });
      callback(barcode, type);
    });
  }, []);

  const stopListening = useCallback(() => {
    hardwareService.scanner.stopListening();
  }, []);

  return {
    status,
    lastScan,
    isListening: status === 'listening',
    isScanning: status === 'scanning',
    startListening,
    stopListening,
  };
}

/** 钱箱Hook */
export function useCashbox() {
  const [status, setStatus] = useState<'disconnected' | 'closed' | 'open' | 'error'>('disconnected');

  useEffect(() => {
    // 先绑定打印机
    hardwareService.bindCashboxToPrinter();
    
    const unsubscribe = hardwareService.cashbox.addStatusListener(setStatus);
    return unsubscribe;
  }, []);

  const open = useCallback(async () => {
    return await hardwareService.cashbox.open();
  }, []);

  return {
    status,
    isOpen: status === 'open',
    open,
  };
}

/** 电子秤Hook */
export function useScale() {
  const [status, setStatus] = useState<'disconnected' | 'connected' | 'weighing' | 'stable' | 'error'>('disconnected');
  const [reading, setReading] = useState<{ weight: number; unit: string; stable: boolean } | null>(null);

  useEffect(() => {
    const unsubscribe = hardwareService.scale.addStatusListener(setStatus);
    return unsubscribe;
  }, []);

  // 定期获取读数
  useEffect(() => {
    if (status !== 'connected' && status !== 'weighing' && status !== 'stable') {
      return;
    }

    const interval = setInterval(async () => {
      const weight = await hardwareService.scale.getWeight();
      if (weight) {
        setReading(weight);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [status]);

  const tare = useCallback(async () => {
    return await hardwareService.scale.tare();
  }, []);

  const disconnect = useCallback(async () => {
    await hardwareService.scale.disconnect();
  }, []);

  return {
    status,
    reading,
    isConnected: status === 'connected' || status === 'weighing' || status === 'stable',
    isStable: status === 'stable',
    tare,
    disconnect,
  };
}
