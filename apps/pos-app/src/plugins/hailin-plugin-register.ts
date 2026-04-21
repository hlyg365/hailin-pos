/**
 * Capacitor 插件手动注册脚本
 * 当 Capacitor CLI 无法自动识别本地插件时使用
 */
import { Capacitor } from '@capacitor/core';

// HailinHardware 插件的原生接口
interface HailinHardwareInterface {
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
    async scaleConnect(options) {
      return (window as any).Capacitor.nativeCallback('HailinHardware', 'scaleConnect', options);
    },
    async scaleDisconnect(options) {
      return (window as any).Capacitor.nativeCallback('HailinHardware', 'scaleDisconnect', options);
    },
    async scaleReadWeight(options) {
      return (window as any).Capacitor.nativeCallback('HailinHardware', 'scaleReadWeight', options);
    },
    async scaleTare(options) {
      return (window as any).Capacitor.nativeCallback('HailinHardware', 'scaleTare', options);
    },
    async scaleZero(options) {
      return (window as any).Capacitor.nativeCallback('HailinHardware', 'scaleZero', options);
    },
    async printerConnect(options) {
      return (window as any).Capacitor.nativeCallback('HailinHardware', 'printerConnect', options);
    },
    async printerInit() {
      return (window as any).Capacitor.nativeCallback('HailinHardware', 'printerInit', {});
    },
    async printerPrintText(options) {
      return (window as any).Capacitor.nativeCallback('HailinHardware', 'printerPrintText', options);
    },
    async printerNewLine() {
      return (window as any).Capacitor.nativeCallback('HailinHardware', 'printerNewLine', {});
    },
    async printerCut() {
      return (window as any).Capacitor.nativeCallback('HailinHardware', 'printerCut', {});
    },
    async printerDisconnect() {
      return (window as any).Capacitor.nativeCallback('HailinHardware', 'printerDisconnect', {});
    },
    async openCashDrawer() {
      return (window as any).Capacitor.nativeCallback('HailinHardware', 'openCashDrawer', {});
    },
    async showOnCustomerDisplay(options) {
      return (window as any).Capacitor.nativeCallback('HailinHardware', 'showOnCustomerDisplay', options);
    },
    async dismissCustomerDisplay() {
      return (window as any).Capacitor.nativeCallback('HailinHardware', 'dismissCustomerDisplay', {});
    },
    async enableBarcodeScanner() {
      return (window as any).Capacitor.nativeCallback('HailinHardware', 'enableBarcodeScanner', {});
    },
    async disableBarcodeScanner() {
      return (window as any).Capacitor.nativeCallback('HailinHardware', 'disableBarcodeScanner', {});
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
