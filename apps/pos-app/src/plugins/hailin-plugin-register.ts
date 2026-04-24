/**
 * Capacitor 插件手动注册脚本
 * 当 Capacitor CLI 无法自动识别本地插件时使用
 */
import { Capacitor } from '@capacitor/core';

// HailinHardware 插件的原生接口
interface HailinHardwareInterface {
  // 枚举可用串口设备
  listSerialPorts(): Promise<{ success: boolean; ports: Array<{ path: string; name: string; readable: boolean; writable: boolean }>; count: number; error?: string }>;
  // 电子秤
  scaleConnect(options: { port: string; baudRate: number; protocol?: string }): Promise<{ success: boolean; connectionId?: string }>;
  scaleDisconnect(options?: { connectionId?: string }): Promise<{ success: boolean }>;
  scaleReadWeight(options?: { connectionId?: string }): Promise<{ weight: number; unit: string; stable: boolean }>;
  scaleTare(options?: { connectionId?: string }): Promise<{ success: boolean }>;
  scaleZero(options?: { connectionId?: string }): Promise<{ success: boolean }>;
  printerConnect(options: { host: string; port: number }): Promise<{ success: boolean; connectionId?: string }>;
  printerInit(): Promise<{ success: boolean }>;
  printerPrintText(options: { text: string }): Promise<{ success: boolean }>;
  printerNewLine(): Promise<{ success: boolean }>;
  printerCut(): Promise<{ success: boolean }>;
  printerDisconnect(): Promise<{ success: boolean }>;
  openCashDrawer(): Promise<{ success: boolean }>;
  showOnCustomerDisplay(options: { mode: string; title?: string; amount?: number }): Promise<{ success: boolean }>;
  dismissCustomerDisplay(): Promise<{ success: boolean }>;
  enableBarcodeScanner(): Promise<{ success: boolean }>;
  disableBarcodeScanner(): Promise<{ success: boolean }>;
  addListener(eventName: string, callback: (data: any) => void): Promise<{ remove: () => void }>;
  removeAllListeners(): Promise<{ success: boolean }>;
}

// 注册插件到 Capacitor
function registerHailinHardwarePlugin(): void {
  if (typeof window === 'undefined') return;
  
  // @ts-ignore
  if (!window.Capacitor) return;
  
  console.log('[HailinPlugin] 开始注册 HailinHardware 插件...');
  
  // 定义插件实现
  const pluginImplementation: HailinHardwareInterface = {
    // 枚举可用串口设备 - 使用 nativePromise 获取异步结果
    async listSerialPorts() {
      const cap = (window as any).Capacitor;
      if (cap && typeof cap.nativePromise === 'function') {
        return cap.nativePromise('HailinHardware', 'listSerialPorts', {});
      }
      // fallback 到 nativeCallback（返回 callbackId，不是结果）
      return cap.nativeCallback('HailinHardware', 'listSerialPorts', {});
    },
    async scaleConnect(options) {
      const cap = (window as any).Capacitor;
      if (cap && typeof cap.nativePromise === 'function') {
        return cap.nativePromise('HailinHardware', 'scaleConnect', options);
      }
      return cap.nativeCallback('HailinHardware', 'scaleConnect', options);
    },
    async scaleDisconnect(options) {
      const cap = (window as any).Capacitor;
      if (cap && typeof cap.nativePromise === 'function') {
        return cap.nativePromise('HailinHardware', 'scaleDisconnect', options || {});
      }
      return cap.nativeCallback('HailinHardware', 'scaleDisconnect', options || {});
    },
    async scaleReadWeight(options) {
      const cap = (window as any).Capacitor;
      if (cap && typeof cap.nativePromise === 'function') {
        return cap.nativePromise('HailinHardware', 'scaleReadWeight', options || {});
      }
      return cap.nativeCallback('HailinHardware', 'scaleReadWeight', options || {});
    },
    async scaleTare(options) {
      const cap = (window as any).Capacitor;
      if (cap && typeof cap.nativePromise === 'function') {
        return cap.nativePromise('HailinHardware', 'scaleTare', options || {});
      }
      return cap.nativeCallback('HailinHardware', 'scaleTare', options || {});
    },
    async scaleZero(options) {
      const cap = (window as any).Capacitor;
      if (cap && typeof cap.nativePromise === 'function') {
        return cap.nativePromise('HailinHardware', 'scaleZero', options || {});
      }
      return cap.nativeCallback('HailinHardware', 'scaleZero', options || {});
    },
    async printerConnect(options) {
      const cap = (window as any).Capacitor;
      if (cap && typeof cap.nativePromise === 'function') {
        return cap.nativePromise('HailinHardware', 'printerConnect', options);
      }
      return cap.nativeCallback('HailinHardware', 'printerConnect', options);
    },
    async printerInit() {
      const cap = (window as any).Capacitor;
      if (cap && typeof cap.nativePromise === 'function') {
        return cap.nativePromise('HailinHardware', 'printerInit', {});
      }
      return cap.nativeCallback('HailinHardware', 'printerInit', {});
    },
    async printerPrintText(options) {
      const cap = (window as any).Capacitor;
      if (cap && typeof cap.nativePromise === 'function') {
        return cap.nativePromise('HailinHardware', 'printerPrintText', options);
      }
      return cap.nativeCallback('HailinHardware', 'printerPrintText', options);
    },
    async printerNewLine() {
      const cap = (window as any).Capacitor;
      if (cap && typeof cap.nativePromise === 'function') {
        return cap.nativePromise('HailinHardware', 'printerNewLine', {});
      }
      return cap.nativeCallback('HailinHardware', 'printerNewLine', {});
    },
    async printerCut() {
      const cap = (window as any).Capacitor;
      if (cap && typeof cap.nativePromise === 'function') {
        return cap.nativePromise('HailinHardware', 'printerCut', {});
      }
      return cap.nativeCallback('HailinHardware', 'printerCut', {});
    },
    async printerDisconnect() {
      const cap = (window as any).Capacitor;
      if (cap && typeof cap.nativePromise === 'function') {
        return cap.nativePromise('HailinHardware', 'printerDisconnect', {});
      }
      return cap.nativeCallback('HailinHardware', 'printerDisconnect', {});
    },
    async openCashDrawer() {
      const cap = (window as any).Capacitor;
      if (cap && typeof cap.nativePromise === 'function') {
        return cap.nativePromise('HailinHardware', 'openCashDrawer', {});
      }
      return cap.nativeCallback('HailinHardware', 'openCashDrawer', {});
    },
    async showOnCustomerDisplay(options) {
      const cap = (window as any).Capacitor;
      if (cap && typeof cap.nativePromise === 'function') {
        return cap.nativePromise('HailinHardware', 'showOnCustomerDisplay', options);
      }
      return cap.nativeCallback('HailinHardware', 'showOnCustomerDisplay', options);
    },
    async dismissCustomerDisplay() {
      const cap = (window as any).Capacitor;
      if (cap && typeof cap.nativePromise === 'function') {
        return cap.nativePromise('HailinHardware', 'dismissCustomerDisplay', {});
      }
      return cap.nativeCallback('HailinHardware', 'dismissCustomerDisplay', {});
    },
    async enableBarcodeScanner() {
      const cap = (window as any).Capacitor;
      if (cap && typeof cap.nativePromise === 'function') {
        return cap.nativePromise('HailinHardware', 'enableBarcodeScanner', {});
      }
      return cap.nativeCallback('HailinHardware', 'enableBarcodeScanner', {});
    },
    async disableBarcodeScanner() {
      const cap = (window as any).Capacitor;
      if (cap && typeof cap.nativePromise === 'function') {
        return cap.nativePromise('HailinHardware', 'disableBarcodeScanner', {});
      }
      return cap.nativeCallback('HailinHardware', 'disableBarcodeScanner', {});
    },
    async addListener(eventName, callback) {
      return (window as any).Capacitor.addListener('HailinHardware', eventName, callback);
    },
    async removeAllListeners() {
      return (window as any).Capacitor.nativeCallback('HailinHardware', 'removeAllListeners', {});
    }
  };
  
  // 尝试多种方式注册插件
  try {
    // 方式1: 注册到 Capacitor.Plugins
    if (!(window as any).Capacitor.Plugins) {
      (window as any).Capacitor.Plugins = {};
    }
    (window as any).Capacitor.Plugins.HailinHardware = pluginImplementation;
    console.log('[HailinPlugin] ✓ 注册到 Capacitor.Plugins');
  } catch (e) {
    console.warn('[HailinPlugin] 无法注册到 Plugins:', e);
  }
  
  // 方式2: 注册到 pluginManager
  try {
    if ((window as any).Capacitor?.pluginManager) {
      (window as any).Capacitor.pluginManager.registerPlugin('HailinHardware', pluginImplementation);
      console.log('[HailinPlugin] ✓ 注册到 pluginManager');
    }
  } catch (e) {
    console.warn('[HailinPlugin] 无法注册到 pluginManager:', e);
  }
  
  console.log('[HailinPlugin] HailinHardware 插件注册完成');
}

// 页面加载后注册插件
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(registerHailinHardwarePlugin, 100);
    });
  } else {
    setTimeout(registerHailinHardwarePlugin, 100);
  }
}

// 导出注册函数
export { registerHailinHardwarePlugin };
