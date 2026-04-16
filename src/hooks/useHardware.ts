'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  hardwareService,
  scalePlugin,
  printerPlugin,
  cashboxPlugin,
  dualScreenPlugin,
  ScaleReading,
  PrinterStatus,
  CashboxStatus,
} from '@/lib/hardware';

/**
 * 硬件设备连接状态
 */
export interface HardwareStatus {
  initialized: boolean;
  scale: {
    connected: boolean;
    deviceId: string | null;
    lastReading: ScaleReading | null;
  };
  printer: {
    connected: boolean;
    status: PrinterStatus;
  };
  cashbox: {
    connected: boolean;
    status: CashboxStatus;
  };
  dualScreen: {
    active: boolean;
    screen: string;
  };
}

/**
 * 硬件管理Hook
 */
export function useHardware() {
  const [status, setStatus] = useState<HardwareStatus>({
    initialized: false,
    scale: {
      connected: false,
      deviceId: null,
      lastReading: null,
    },
    printer: {
      connected: false,
      status: 'idle',
    },
    cashbox: {
      connected: false,
      status: 'closed',
    },
    dualScreen: {
      active: false,
      screen: 'customer',
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化所有硬件
  const initialize = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await hardwareService.initializeAll();
      
      setStatus(prev => ({
        ...prev,
        initialized: true,
        scale: {
          ...prev.scale,
          connected: result.scale,
          deviceId: scalePlugin.getStatus().deviceId,
        },
        printer: {
          connected: result.printer,
          status: printerPlugin.getStatus(),
        },
        cashbox: {
          connected: result.cashbox,
          status: cashboxPlugin.getStatus(),
        },
        dualScreen: {
          active: result.dualScreen,
          screen: dualScreenPlugin.getCurrentScreen(),
        },
      }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 连接电子秤
  const connectScale = useCallback(async (deviceId?: string) => {
    try {
      const result = await scalePlugin.connect(deviceId);
      
      setStatus(prev => ({
        ...prev,
        scale: {
          ...prev.scale,
          connected: result,
          deviceId: scalePlugin.getStatus().deviceId,
        },
      }));

      return result;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, []);

  // 断开电子秤
  const disconnectScale = useCallback(async () => {
    await scalePlugin.disconnect();
    
    setStatus(prev => ({
      ...prev,
      scale: {
        ...prev.scale,
        connected: false,
        deviceId: null,
        lastReading: null,
      },
    }));
  }, []);

  // 读取电子秤重量
  const readScale = useCallback(async () => {
    if (!status.scale.connected) {
      return null;
    }

    try {
      const reading = await scalePlugin.getWeight();
      
      setStatus(prev => ({
        ...prev,
        scale: {
          ...prev.scale,
          lastReading: reading,
        },
      }));

      return reading;
    } catch (err) {
      console.error('Failed to read scale:', err);
      return null;
    }
  }, [status.scale.connected]);

  // 连接打印机
  const connectPrinter = useCallback(async (deviceId?: string) => {
    try {
      const result = await printerPlugin.connect(deviceId);
      
      setStatus(prev => ({
        ...prev,
        printer: {
          connected: result,
          status: printerPlugin.getStatus(),
        },
      }));

      return result;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, []);

  // 断开打印机
  const disconnectPrinter = useCallback(async () => {
    await printerPlugin.disconnect();
    
    setStatus(prev => ({
      ...prev,
      printer: {
        connected: false,
        status: 'idle',
      },
    }));
  }, []);

  // 打印小票
  const printReceipt = useCallback(async (receiptData: Parameters<typeof printerPlugin.printReceipt>[0]) => {
    if (!status.printer.connected) {
      throw new Error('Printer not connected');
    }

    setStatus(prev => ({
      ...prev,
      printer: {
        ...prev.printer,
        status: 'printing',
      },
    }));

    try {
      const result = await printerPlugin.printReceipt(receiptData);
      
      setStatus(prev => ({
        ...prev,
        printer: {
          ...prev.printer,
          status: result ? 'idle' : 'error',
        },
      }));

      return result;
    } catch (err) {
      setStatus(prev => ({
        ...prev,
        printer: {
          ...prev.printer,
          status: 'error',
        },
      }));
      throw err;
    }
  }, [status.printer.connected]);

  // 打开钱箱
  const openCashbox = useCallback(async () => {
    try {
      const result = await cashboxPlugin.open();
      
      setStatus(prev => ({
        ...prev,
        cashbox: {
          ...prev.cashbox,
          status: result ? 'open' : 'error',
        },
      }));

      return result;
    } catch (err) {
      setStatus(prev => ({
        ...prev,
        cashbox: {
          ...prev.cashbox,
          status: 'error',
        },
      }));
      return false;
    }
  }, []);

  // 打开客显屏
  const openDualScreen = useCallback(async () => {
    try {
      const window = await dualScreenPlugin.openScreen();
      
      setStatus(prev => ({
        ...prev,
        dualScreen: {
          active: !!window,
          screen: dualScreenPlugin.getCurrentScreen(),
        },
      }));

      return !!window;
    } catch (err) {
      console.error('Failed to open dual screen:', err);
      return false;
    }
  }, []);

  // 显示欢迎信息
  const showWelcome = useCallback(async () => {
    if (!status.dualScreen.active) return;
    await dualScreenPlugin.showWelcome();
  }, [status.dualScreen.active]);

  // 显示商品信息
  const showProduct = useCallback(async (name: string, price: number) => {
    if (!status.dualScreen.active) return;
    await dualScreenPlugin.showProduct(name, price);
  }, [status.dualScreen.active]);

  // 显示价格
  const showPrice = useCallback(async (amount: number, change?: number) => {
    if (!status.dualScreen.active) return;
    await dualScreenPlugin.showPrice(amount, change);
  }, [status.dualScreen.active]);

  // 显示二维码
  const showQRCode = useCallback(async (data: string, title?: string) => {
    if (!status.dualScreen.active) return;
    await dualScreenPlugin.showQRCode(data, title);
  }, [status.dualScreen.active]);

  // 显示闲置画面
  const showIdle = useCallback(async () => {
    if (!status.dualScreen.active) return;
    await dualScreenPlugin.showIdle();
  }, [status.dualScreen.active]);

  // 初始化
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 状态更新
  const updateDeviceStatus = useCallback((updates: Partial<typeof status>) => {
    setStatus(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    // 兼容属性（旧API）
    scanner: { connected: status.scale.connected },
    printer: printerPlugin,
    printerStatus: status.printer.status,
    enableScanner: (type: string, callback: (barcode: string) => void) => {
      // 返回清理函数
      const { startListening, stopListening } = useScanner(callback);
      startListening();
      return () => stopListening();
    },
    
    // 状态
    status,
    loading,
    error,
    
    // 电子秤
    connectScale,
    disconnectScale,
    readScale,
    
    // 打印机
    connectPrinter,
    disconnectPrinter,
    printReceipt,
    
    // 钱箱
    openCashbox,
    
    // 双屏
    openDualScreen,
    showWelcome,
    showProduct,
    showPrice,
    showQRCode,
    showIdle,
    
    // 通用
    initialize,
    updateDeviceStatus,
  };
}

/**
 * 扫码枪Hook
 * 使用键盘输入监听实现扫码枪支持
 */
export function useScanner(onScan: (barcode: string) => void, onError?: (error: Error) => void) {
  const [isListening, setIsListening] = useState(false);
  const bufferRef = { current: '' };
  const timeoutRef: { current: number | null } = { current: null };

  const startListening = useCallback(() => {
    if (isListening) return;

    setIsListening(true);

    const handleKeyDown = (event: KeyboardEvent) => {
      // 如果是回车键，扫码结束
      if (event.key === 'Enter') {
        if (bufferRef.current.length > 0) {
          const barcode = bufferRef.current;
          bufferRef.current = '';
          
          // 清除超时
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          // 触发扫码回调
          try {
            onScan(barcode);
          } catch (err) {
            onError?.(err as Error);
          }
        }
        return;
      }

      // 只接收数字
      if (/^\d$/.test(event.key)) {
        bufferRef.current += event.key;

        // 设置超时，防止扫码中断
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
          bufferRef.current = '';
        }, 100); // 100ms内没有新输入则清空
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // 返回清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsListening(false);
    };
  }, [isListening, onScan, onError]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    bufferRef.current = '';
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
  };
}
