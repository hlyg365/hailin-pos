'use client';

/**
 * 硬件设备Hook
 * 
 * 提供统一的硬件设备访问接口
 * 自动检测并使用原生插件或模拟模式
 */

import { useState, useEffect, useCallback } from 'react';
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
  
  // 电子秤
  scale: {
    connected: boolean;
    available: boolean;
    connecting: boolean;
    devices: ScaleDevice[];
  };
  
  // 打印机
  printer: {
    connected: boolean;
    available: boolean;
    connecting: boolean;
    devices: PrinterDevice[];
    deviceName: string | null;
  };
  
  // 客显屏
  display: {
    open: boolean;
    available: boolean;
  };
}

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

export function useHardware() {
  const [state, setState] = useState<HardwareState>({
    isNativeApp: false,
    debugInfo: null,
    
    scale: {
      connected: false,
      available: false,
      connecting: false,
      devices: [],
    },
    
    printer: {
      connected: false,
      available: false,
      connecting: false,
      devices: [],
      deviceName: null,
    },
    
    display: {
      open: false,
      available: false,
    },
  });

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
      const scaleStatus = await Scale.getStatus();
      const printerStatus = await Printer.getStatus();
      const displayStatus = await CustomerDisplay.getStatus();
      
      setState(prev => ({
        ...prev,
        scale: { ...prev.scale, available: scaleStatus.available },
        printer: { ...prev.printer, available: printerStatus.available },
        display: { ...prev.display, available: displayStatus.available },
      }));
    };
    
    checkAvailability();
  }, []);

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

    connect: useCallback(async (port?: string, baudRate?: number) => {
      setState(prev => ({
        ...prev,
        scale: { ...prev.scale, connecting: true },
      }));
      
      const result = await Scale.connect({ port, baudRate });
      
      setState(prev => ({
        ...prev,
        scale: { ...prev.scale, connecting: false, connected: result.success },
      }));
      
      return result;
    }, []),

    disconnect: useCallback(async () => {
      await Scale.disconnect();
      setState(prev => ({
        ...prev,
        scale: { ...prev.scale, connected: false },
      }));
    }, []),

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
        printer: { ...prev.printer, connecting: true },
      }));
      
      const result = await Printer.connect(address, name);
      
      setState(prev => ({
        ...prev,
        printer: { 
          ...prev.printer, 
          connecting: false, 
          connected: result.success,
          deviceName: result.success ? name || address : prev.printer.deviceName,
        },
      }));
      
      return result;
    }, []),

    disconnect: useCallback(async () => {
      await Printer.disconnect();
      setState(prev => ({
        ...prev,
        printer: { ...prev.printer, connected: false, deviceName: null },
      }));
    }, []),

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
      return result;
    }, []),

    close: useCallback(async () => {
      await CustomerDisplay.close();
      setState(prev => ({
        ...prev,
        display: { ...prev.display, open: false },
      }));
    }, []),

    sendData: useCallback(async (data: any) => {
      return await CustomerDisplay.sendData(data);
    }, []),
  };

  return {
    // 状态
    ...state,
    
    // 电子秤
    scale: {
      ...state.scale,
      ...scaleActions,
    },
    
    // 打印机
    printer: {
      ...state.printer,
      ...printerActions,
    },
    
    // 客显屏
    display: {
      ...state.display,
      ...displayActions,
    },
  };
}
