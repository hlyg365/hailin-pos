'use client';

/**
 * 硬件设备Hook
 * 
 * 提供统一的硬件设备访问接口
 * 自动检测并使用原生插件或模拟模式
 * 支持设备热插拔监听和自动重连
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  isNativeApp as checkNativeApp, 
  Scale, 
  Printer, 
  CustomerDisplay,
  getDebugInfo,
  type ScaleDevice,
  type PrinterDevice,
  type WeightData,
} from '@/lib/native/index';

export interface HardwareState {
  isNativeApp: boolean;
  debugInfo: any;
  
  // 扫码器
  scanner: {
    enabled: boolean;
    connected: boolean;
    available: boolean;
    devices: Array<{ id: string; name: string; type: string }>;
  };
  
  // 电子秤
  scale: {
    connected: boolean;
    available: boolean;
    connecting: boolean;
    devices: ScaleDevice[];
    lastError?: string;
  };
  
  // 打印机
  printer: {
    connected: boolean;
    available: boolean;
    connecting: boolean;
    devices: PrinterDevice[];
    deviceName: string | null;
    lastError?: string;
  };
  
  // 钱箱
  cashbox: {
    connected: boolean;
    available: boolean;
  };
  
  // 客显屏
  display: {
    open: boolean;
    available: boolean;
  };
  
  // 连接状态
  isConnecting: boolean;
  error: string | null;
  
  // 设备变化事件计数（用于触发重新渲染）
  deviceChangeCount: number;
  
  // 自动重连设置
  autoReconnect: boolean;
}

// 设备连接状态变化事件类型
export interface DeviceChangeEvent {
  type: 'scale' | 'printer' | 'display' | 'scanner';
  action: 'connected' | 'disconnected' | 'error';
  device?: ScaleDevice | PrinterDevice;
}

// 设备变化监听器类型
type DeviceChangeListener = (event: DeviceChangeEvent) => void;

/**
 * 检测是否支持硬件功能
 */
export function isHardwareSupported(): boolean {
  return checkNativeApp();
}

/**
 * 获取支持的硬件特性列表
 */
export function getSupportedHardwareFeatures(): string[] {
  const features: string[] = [];
  
  if (checkNativeApp()) {
    features.push('native_app');
    features.push('usb_scale');
    features.push('bluetooth_printer');
    features.push('dual_screen');
    features.push('cashbox');
  }
  
  features.push('web_api');
  features.push('simulation');
  
  return features;
}

export function useHardware(options?: {
  autoReconnect?: boolean;
  pollInterval?: number;
  onDeviceChange?: DeviceChangeListener;
}) {
  const { 
    autoReconnect = true, 
    pollInterval = 5000,
    onDeviceChange 
  } = options || {};
  
  const [state, setState] = useState<HardwareState>({
    isNativeApp: false,
    debugInfo: null,
    
    // 扫码器
    scanner: {
      enabled: false,
      connected: false,
      available: false,
      devices: [],
    },
    
    // 电子秤
    scale: {
      connected: false,
      available: false,
      connecting: false,
      devices: [],
    },
    
    // 打印机
    printer: {
      connected: false,
      available: false,
      connecting: false,
      devices: [],
      deviceName: null,
    },
    
    // 钱箱
    cashbox: {
      connected: false,
      available: false,
    },
    
    // 客显屏
    display: {
      open: false,
      available: false,
    },
    
    // 连接状态
    isConnecting: false,
    error: null as string | null,
    
    // 设备变化计数
    deviceChangeCount: 0,
    
    // 自动重连
    autoReconnect,
  });

  // 跟踪上次状态用于检测变化
  const lastScaleConnected = useRef(false);
  const lastPrinterConnected = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectScale = useRef(false);
  const reconnectPrinter = useRef(false);

  // 触发设备变化事件
  const triggerDeviceChange = useCallback((event: DeviceChangeEvent) => {
    setState(prev => ({
      ...prev,
      deviceChangeCount: prev.deviceChangeCount + 1,
    }));
    
    // 调用外部监听器
    if (onDeviceChange) {
      onDeviceChange(event);
    }
  }, [onDeviceChange]);

  // 初始化检测
  useEffect(() => {
    const info = getDebugInfo();
    setState(prev => ({
      ...prev,
      isNativeApp: info.isNativeApp,
      debugInfo: info,
    }));
    
    console.log('[useHardware] Debug info:', info);
    
    // 检查各设备可用性
    const checkAvailability = async () => {
      if (!info.isNativeApp) return;
      
      try {
        const scaleStatus = await Scale.getStatus();
        const printerStatus = await Printer.getStatus();
        const displayStatus = await CustomerDisplay.getStatus();
        
        setState(prev => ({
          ...prev,
          scale: { ...prev.scale, available: scaleStatus.available },
          printer: { ...prev.printer, available: printerStatus.available },
          display: { ...prev.display, available: displayStatus.available },
          scanner: { ...prev.scanner, available: info.isNativeApp },
          cashbox: { ...prev.cashbox, available: printerStatus.available },
        }));
        
        // 初始状态
        lastScaleConnected.current = scaleStatus.connected;
        lastPrinterConnected.current = printerStatus.connected;
      } catch (e) {
        console.error('[useHardware] Check availability error:', e);
      }
    };
    
    checkAvailability();
  }, []);

  // 设备状态轮询（检测热插拔）
  useEffect(() => {
    if (!state.isNativeApp) return;

    const checkDeviceStatus = async () => {
      try {
        // 检查电子秤状态
        const scaleStatus = await Scale.getStatus();
        const wasConnected = lastScaleConnected.current;
        const isNowConnected = scaleStatus.connected;
        
        if (wasConnected !== isNowConnected) {
          console.log('[useHardware] Scale connection changed:', wasConnected, '->', isNowConnected);
          lastScaleConnected.current = isNowConnected;
          
          if (isNowConnected) {
            triggerDeviceChange({ type: 'scale', action: 'connected' });
            reconnectScale.current = false;
          } else {
            triggerDeviceChange({ type: 'scale', action: 'disconnected' });
            
            // 自动重连
            if (state.autoReconnect && !reconnectScale.current) {
              reconnectScale.current = true;
              console.log('[useHardware] Auto-reconnecting scale...');
              await scaleActions.connect();
            }
          }
        }
        
        // 更新电子秤设备列表
        if (isNowConnected) {
          const devices = await Scale.listDevices();
          setState(prev => ({
            ...prev,
            scale: { ...prev.scale, devices },
          }));
        }

        // 检查打印机状态
        const printerStatus = await Printer.getStatus();
        const wasPrinterConnected = lastPrinterConnected.current;
        const isPrinterNowConnected = printerStatus.connected;
        
        if (wasPrinterConnected !== isPrinterNowConnected) {
          console.log('[useHardware] Printer connection changed:', wasPrinterConnected, '->', isPrinterNowConnected);
          lastPrinterConnected.current = isPrinterNowConnected;
          
          if (isPrinterNowConnected) {
            triggerDeviceChange({ type: 'printer', action: 'connected' });
            reconnectPrinter.current = false;
          } else {
            triggerDeviceChange({ type: 'printer', action: 'disconnected' });
            
            // 自动重连
            if (state.autoReconnect && !reconnectPrinter.current) {
              reconnectPrinter.current = true;
              console.log('[useHardware] Auto-reconnecting printer...');
              // 尝试连接上次使用的打印机
              const savedConfig = localStorage.getItem('hardware_device_config');
              if (savedConfig) {
                try {
                  const config = JSON.parse(savedConfig);
                  if (config.printers?.length > 0) {
                    const lastPrinter = config.printers[0];
                    await printerActions.connect(lastPrinter.address, lastPrinter.name);
                  }
                } catch (e) {
                  console.error('[useHardware] Reconnect printer error:', e);
                }
              }
            }
          }
        }
        
        // 更新打印机设备列表
        if (isPrinterNowConnected) {
          const printers = await Printer.listDevices();
          setState(prev => ({
            ...prev,
            printer: { ...prev.printer, devices: printers },
            cashbox: { ...prev.cashbox, connected: true },
          }));
        }
      } catch (e) {
        console.error('[useHardware] Poll device status error:', e);
      }
    };

    // 启动轮询
    pollIntervalRef.current = setInterval(checkDeviceStatus, pollInterval);
    
    // 清理函数
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [state.isNativeApp, state.autoReconnect, pollInterval, triggerDeviceChange]);

  // 设置自动重连
  const setAutoReconnectEnabled = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, autoReconnect: enabled }));
  }, []);

  // 手动刷新设备列表
  const refreshDevices = useCallback(async () => {
    try {
      const info = getDebugInfo();
      if (!info.isNativeApp) return;
      
      // 刷新电子秤
      const scaleDevices = await Scale.listDevices();
      const scaleStatus = await Scale.getStatus();
      
      // 刷新打印机
      const printerDevices = await Printer.listDevices();
      const printerStatus = await Printer.getStatus();
      
      // 刷新客显屏
      const displayStatus = await CustomerDisplay.getStatus();
      
      setState(prev => ({
        ...prev,
        scale: { ...prev.scale, devices: scaleDevices, connected: scaleStatus.connected },
        printer: { ...prev.printer, devices: printerDevices, connected: printerStatus.connected },
        display: { ...prev.display, available: displayStatus.available },
        cashbox: { ...prev.cashbox, available: printerStatus.available, connected: printerStatus.connected },
      }));
      
      triggerDeviceChange({ type: 'scale', action: scaleStatus.connected ? 'connected' : 'disconnected' });
      triggerDeviceChange({ type: 'printer', action: printerStatus.connected ? 'connected' : 'disconnected' });
      
      console.log('[useHardware] Devices refreshed');
    } catch (e) {
      console.error('[useHardware] Refresh devices error:', e);
    }
  }, [triggerDeviceChange]);

  // 电子秤操作
  const scaleActions = {
    listDevices: useCallback(async () => {
      const devices = await Scale.listDevices();
      setState(prev => ({
        ...prev,
        scale: { ...prev.scale, devices },
      }));
      return devices;
    }, []),

    connect: useCallback(async (options?: { port?: string; baudRate?: number }) => {
      setState(prev => ({
        ...prev,
        scale: { ...prev.scale, connecting: true, lastError: undefined },
      }));
      
      try {
        const result = await Scale.connect(options);
        
        setState(prev => ({
          ...prev,
          scale: { 
            ...prev.scale, 
            connecting: false, 
            connected: result.success,
            lastError: result.success ? undefined : result.message,
          },
        }));
        
        if (result.success) {
          lastScaleConnected.current = true;
          reconnectScale.current = false;
          triggerDeviceChange({ type: 'scale', action: 'connected' });
          
          // 保存到配置
          const savedConfig = localStorage.getItem('hardware_device_config');
          const config = savedConfig ? JSON.parse(savedConfig) : { scales: [], printers: [], autoConnect: true };
          const scaleDevices = await Scale.listDevices();
          if (scaleDevices.length > 0) {
            config.scales = [
              { address: scaleDevices[0].address, name: scaleDevices[0].name, lastUsed: new Date() },
              ...config.scales.filter((s: any) => s.address !== scaleDevices[0].address).slice(0, 4),
            ];
            localStorage.setItem('hardware_device_config', JSON.stringify(config));
          }
        }
        
        return result;
      } catch (e: any) {
        setState(prev => ({
          ...prev,
          scale: { ...prev.scale, connecting: false, lastError: e.message },
        }));
        throw e;
      }
    }, [triggerDeviceChange]),

    disconnect: useCallback(async () => {
      await Scale.disconnect();
      lastScaleConnected.current = false;
      reconnectScale.current = false;
      setState(prev => ({
        ...prev,
        scale: { ...prev.scale, connected: false },
      }));
      triggerDeviceChange({ type: 'scale', action: 'disconnected' });
    }, [triggerDeviceChange]),

    getWeight: useCallback(async () => {
      return await Scale.getWeight();
    }, []),
  };

  // 打印机操作
  const printerActions = {
    listDevices: useCallback(async () => {
      const devices = await Printer.listDevices();
      setState(prev => ({
        ...prev,
        printer: { ...prev.printer, devices },
      }));
      return devices;
    }, []),

    connect: useCallback(async (address: string, name?: string) => {
      setState(prev => ({
        ...prev,
        printer: { ...prev.printer, connecting: true, lastError: undefined },
      }));
      
      try {
        const result = await Printer.connect(address, name);
        
        setState(prev => ({
          ...prev,
          printer: { 
            ...prev.printer, 
            connecting: false, 
            connected: result.success,
            deviceName: result.success ? name || address : prev.printer.deviceName,
            lastError: result.success ? undefined : result.message,
          },
          cashbox: {
            ...prev.cashbox,
            connected: result.success,
          },
        }));
        
        if (result.success) {
          lastPrinterConnected.current = true;
          reconnectPrinter.current = false;
          triggerDeviceChange({ type: 'printer', action: 'connected' });
          
          // 保存到配置
          const savedConfig = localStorage.getItem('hardware_device_config');
          const config = savedConfig ? JSON.parse(savedConfig) : { scales: [], printers: [], autoConnect: true };
          config.printers = [
            { address, name: name || address, lastUsed: new Date() },
            ...config.printers.filter((p: any) => p.address !== address).slice(0, 4),
          ];
          localStorage.setItem('hardware_device_config', JSON.stringify(config));
        }
        
        return result;
      } catch (e: any) {
        setState(prev => ({
          ...prev,
          printer: { ...prev.printer, connecting: false, lastError: e.message },
        }));
        throw e;
      }
    }, [triggerDeviceChange]),

    disconnect: useCallback(async () => {
      await Printer.disconnect();
      lastPrinterConnected.current = false;
      reconnectPrinter.current = false;
      setState(prev => ({
        ...prev,
        printer: { ...prev.printer, connected: false, deviceName: null },
        cashbox: { ...prev.cashbox, connected: false },
      }));
      triggerDeviceChange({ type: 'printer', action: 'disconnected' });
    }, [triggerDeviceChange]),

    printReceipt: useCallback(async (data: any) => {
      return await Printer.printReceipt(data);
    }, []),

    openCashbox: useCallback(async () => {
      return await Printer.openCashbox();
    }, []),
  };

  // 客显屏操作
  const displayActions = {
    open: useCallback(async (displayId?: number) => {
      const result = await CustomerDisplay.open(displayId);
      setState(prev => ({
        ...prev,
        display: { ...prev.display, open: result.success },
      }));
      if (result.success) {
        triggerDeviceChange({ type: 'display', action: 'connected' });
      }
      return result;
    }, [triggerDeviceChange]),

    close: useCallback(async () => {
      await CustomerDisplay.close();
      setState(prev => ({
        ...prev,
        display: { ...prev.display, open: false },
      }));
      triggerDeviceChange({ type: 'display', action: 'disconnected' });
    }, [triggerDeviceChange]),

    sendData: useCallback(async (data: any) => {
      return await CustomerDisplay.sendData(data);
    }, []),
  };

  // 扫码器操作（基于原生键盘扫描）
  // 扫码回调监听器
  const barcodeListeners = useRef<Set<(barcode: string) => void>>(new Set());
  
  // 添加扫码监听器（兼容旧API：enableScanner(type, callback)）
  const addBarcodeListener = useCallback((type: string | ((barcode: string) => void), callback?: (barcode: string) => void) => {
    // 如果第一个参数是函数，说明是新版API：enableScanner(callback)
    if (typeof type === 'function') {
      const cb = type;
      barcodeListeners.current.add(cb);
      setState(prev => ({
        ...prev,
        scanner: { ...prev.scanner, enabled: true },
      }));
      
      // 返回清理函数
      return () => {
        barcodeListeners.current.delete(cb);
        if (barcodeListeners.current.size === 0) {
          setState(prev => ({
            ...prev,
            scanner: { ...prev.scanner, enabled: false },
          }));
        }
      };
    }
    
    // 旧版API：enableScanner('usb', callback)
    if (callback) {
      barcodeListeners.current.add(callback);
      setState(prev => ({
        ...prev,
        scanner: { ...prev.scanner, enabled: true },
      }));
      
      // 返回清理函数
      return () => {
        barcodeListeners.current.delete(callback);
        if (barcodeListeners.current.size === 0) {
          setState(prev => ({
            ...prev,
            scanner: { ...prev.scanner, enabled: false },
          }));
        }
      };
    }
    
    return () => {};
  }, []);
  
  // 处理扫码输入（通过键盘事件）
  useEffect(() => {
    if (!state.isNativeApp) return;
    
    let barcodeBuffer = '';
    let barcodeTimeout: NodeJS.Timeout | null = null;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框中的按键
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      // 扫码枪通常快速输入后会有一个回车
      if (e.key === 'Enter' && barcodeBuffer.length > 0) {
        // 触发所有监听器
        const barcode = barcodeBuffer;
        barcodeBuffer = '';
        barcodeListeners.current.forEach(callback => {
          try {
            callback(barcode);
          } catch (e) {
            console.error('[useHardware] Barcode callback error:', e);
          }
        });
        return;
      }
      
      // 清除之前的超时
      if (barcodeTimeout) {
        clearTimeout(barcodeTimeout);
      }
      
      // 添加到缓冲区
      if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }
      
      // 300ms 内没有新输入则清除缓冲区
      barcodeTimeout = setTimeout(() => {
        barcodeBuffer = '';
      }, 300);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (barcodeTimeout) {
        clearTimeout(barcodeTimeout);
      }
    };
  }, [state.isNativeApp]);
  
  const scannerActions = {
    enableMode: useCallback(() => {
      setState(prev => ({
        ...prev,
        scanner: { ...prev.scanner, enabled: true },
      }));
    }, []),

    disable: useCallback(() => {
      setState(prev => ({
        ...prev,
        scanner: { ...prev.scanner, enabled: false },
      }));
    }, []),
    
    // 兼容旧API：enableScanner(type, callback)
    enable: addBarcodeListener,
  };

  // 打印机兼容方法
  const connectPrinter = useCallback(async (address: string, name?: string) => {
    return await printerActions.connect(address, name);
  }, [printerActions]);

  const disconnectPrinter = useCallback(async () => {
    await printerActions.disconnect();
  }, [printerActions]);

  const testPrint = useCallback(async () => {
    // 测试打印
    const testData = {
      shopName: '海邻到家',
      orderNo: 'TEST' + Date.now(),
      date: new Date().toLocaleString(),
      cashier: '系统测试',
      items: [
        { name: '测试商品', quantity: '1', price: '99.00' },
      ],
      total: 99,
      payment: 100,
      change: 1,
    };
    return await Printer.printReceipt(testData);
  }, []);

  const openCashbox = useCallback(async () => {
    return await Printer.openCashbox();
  }, []);

  return {
    // 状态
    ...state,
    
    // 设备变化计数
    deviceChangeCount: state.deviceChangeCount,
    
    // 设置自动重连
    setAutoReconnect: setAutoReconnectEnabled,
    
    // 手动刷新设备
    refreshDevices,
    
    // 扫码器
    scanner: {
      ...state.scanner,
      ...scannerActions,
    },
    
    // 电子秤
    scale: {
      ...state.scale,
      ...scaleActions,
    },
    
    // 打印机状态别名
    printerStatus: state.printer,
    
    // 钱箱状态别名
    cashboxStatus: state.cashbox,
    
    // 打印机
    printer: {
      ...state.printer,
      ...printerActions,
    },
    
    // 打印机兼容方法
    connectPrinter,
    disconnectPrinter,
    printReceipt: printerActions.printReceipt,
    testPrint,
    openCashbox,
    
    // 兼容旧API
    enableScanner: scannerActions.enable,
    updateDeviceStatus: refreshDevices,
    
    // 客显屏
    display: {
      ...state.display,
      ...displayActions,
    },
  };
}
