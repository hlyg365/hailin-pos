/**
 * 硬件统一调用层
 * 
 * 根据运行环境自动选择：
 * - 原生APP：直接调用Capacitor插件
 * - PWA/Web：通过API代理调用（模拟模式）
 */

import { Capacitor } from '@capacitor/core';

// 类型定义
export interface ScaleDevice {
  name: string;
  address: string;
  vendorId?: number;
  productId?: number;
}

export interface WeightData {
  weight: number;
  unit: string;
  stable: boolean;
  timestamp: number;
}

export interface PrinterDevice {
  name: string;
  address: string;
  type: string;
  paired: boolean;
}

export interface ReceiptData {
  shopName?: string;
  orderNo?: string;
  date?: string;
  cashier?: string;
  items: Array<{ name: string; quantity: string; price: string }>;
  total: number;
  discount?: number;
  payment: number;
  change: number;
}

// 原生插件接口
interface ScalePlugin {
  listDevices(): Promise<{ success: boolean; devices?: any }>;
  connect(config: { port?: string; baudRate?: number }): Promise<{ success: boolean; mode?: string }>;
  disconnect(): Promise<void>;
  getWeight(): Promise<{ success: boolean; weight?: number; unit?: string; stable?: boolean }>;
  getStatus(): Promise<{ connected: boolean }>;
}

interface PrinterPlugin {
  listDevices(): Promise<{ success: boolean; devices?: PrinterDevice[] }>;
  connect(config: { address: string; name?: string }): Promise<{ success: boolean }>;
  disconnect(): Promise<void>;
  printReceipt(data: ReceiptData): Promise<{ success: boolean }>;
  openCashbox(): Promise<{ success: boolean }>;
  getStatus(): Promise<{ connected: boolean }>;
}

interface DualScreenPlugin {
  getDisplays(): Promise<{ success: boolean; displays?: any[] }>;
  open(config: { displayId?: number; url?: string }): Promise<{ success: boolean }>;
  close(): Promise<void>;
  sendData(data: any): Promise<{ success: boolean }>;
  getStatus(): Promise<{ isOpen: boolean }>;
}

interface AppUpdatePlugin {
  checkUpdate(): Promise<{ hasUpdate: boolean; latestVersion?: string }>;
  downloadAndInstall(): Promise<{ success: boolean; message?: string }>;
}

// 获取原生插件（如果存在）
function getScalePlugin(): ScalePlugin | null {
  const cap = (window as any).Capacitor;
  if (cap && cap.Plugins && cap.Plugins.Scale) {
    return cap.Plugins.Scale;
  }
  return null;
}

function getPrinterPlugin(): PrinterPlugin | null {
  const cap = (window as any).Capacitor;
  if (cap && cap.Plugins && cap.Plugins.Printer) {
    return cap.Plugins.Printer;
  }
  return null;
}

function getDualScreenPlugin(): DualScreenPlugin | null {
  const cap = (window as any).Capacitor;
  if (cap && cap.Plugins && cap.Plugins.DualScreen) {
    return cap.Plugins.DualScreen;
  }
  return null;
}

function getAppUpdatePlugin(): AppUpdatePlugin | null {
  const cap = (window as any).Capacitor;
  if (cap && cap.Plugins && cap.Plugins.AppUpdate) {
    return cap.Plugins.AppUpdate;
  }
  return null;
}

// 检测是否在原生APP中
export function isNativeApp(): boolean {
  // 1. 检查Capacitor.isNativePlatform()
  if (Capacitor.isNativePlatform()) {
    return true;
  }
  
  // 2. 检查Android WebView特征
  const ua = navigator.userAgent || '';
  if (ua.includes('Android') && (ua.includes('wv') || ua.includes('WebView'))) {
    return true;
  }
  
  // 3. 检查Capacitor插件是否存在
  const cap = (window as any).Capacitor;
  if (cap && cap.Plugins && Object.keys(cap.Plugins).length > 0) {
    return true;
  }
  
  return false;
}

// ==================== 电子秤 ====================

export const Scale = {
  /**
   * 列出可用设备
   */
  async listDevices(): Promise<ScaleDevice[]> {
    const plugin = getScalePlugin();
    if (plugin) {
      try {
        const result = await plugin.listDevices();
        if (result.success && result.devices) {
          const devices: ScaleDevice[] = [];
          const deviceMap = result.devices;
          for (const key in deviceMap) {
            const d = deviceMap[key];
            devices.push({
              name: d.productName || d.name || 'USB秤',
              address: key,
              vendorId: d.vendorId,
              productId: d.productId,
            });
          }
          return devices;
        }
      } catch (e) {
        console.error('[Scale] listDevices error:', e);
      }
    }
    // Fallback: 返回空列表
    return [];
  },

  /**
   * 连接电子秤
   */
  async connect(config?: { port?: string; baudRate?: number }): Promise<{ success: boolean; message: string; mode?: string }> {
    const plugin = getScalePlugin();
    if (plugin) {
      try {
        const result = await plugin.connect(config || { baudRate: 9600 });
        if (result.success) {
          return { success: true, message: '连接成功', mode: result.mode || 'usb' };
        }
        return { success: false, message: result.success ? '连接成功' : '连接失败' };
      } catch (e: any) {
        console.error('[Scale] connect error:', e);
        return { success: false, message: e.message || '连接失败' };
      }
    }
    // 非原生环境
    return { success: false, message: '原生插件不可用，请在APP中使用此功能' };
  },

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    const plugin = getScalePlugin();
    if (plugin) {
      await plugin.disconnect();
    }
  },

  /**
   * 获取当前重量
   */
  async getWeight(): Promise<WeightData | null> {
    const plugin = getScalePlugin();
    if (plugin) {
      try {
        const result = await plugin.getWeight();
        if (result.success) {
          return {
            weight: result.weight || 0,
            unit: result.unit || 'kg',
            stable: result.stable || false,
            timestamp: Date.now(),
          };
        }
      } catch (e) {
        console.error('[Scale] getWeight error:', e);
      }
    }
    return null;
  },

  /**
   * 获取连接状态
   */
  async getStatus(): Promise<{ connected: boolean; available: boolean }> {
    const plugin = getScalePlugin();
    return {
      connected: plugin ? (await plugin.getStatus()).connected : false,
      available: plugin !== null,
    };
  },
};

// ==================== 打印机 ====================

export const Printer = {
  /**
   * 列出已配对的蓝牙设备
   */
  async listDevices(): Promise<PrinterDevice[]> {
    const plugin = getPrinterPlugin();
    if (plugin) {
      try {
        const result = await plugin.listDevices();
        if (result.success) {
          return result.devices || [];
        }
      } catch (e) {
        console.error('[Printer] listDevices error:', e);
      }
    }
    return [];
  },

  /**
   * 连接蓝牙打印机
   */
  async connect(address: string, name?: string): Promise<{ success: boolean; message: string }> {
    const plugin = getPrinterPlugin();
    if (plugin) {
      try {
        const result = await plugin.connect({ address, name });
        if (result.success) {
          return { success: true, message: '连接成功' };
        }
        return { success: false, message: '连接失败' };
      } catch (e: any) {
        console.error('[Printer] connect error:', e);
        return { success: false, message: e.message || '连接失败' };
      }
    }
    return { success: false, message: '原生插件不可用，请在APP中使用此功能' };
  },

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    const plugin = getPrinterPlugin();
    if (plugin) {
      await plugin.disconnect();
    }
  },

  /**
   * 打印小票
   */
  async printReceipt(data: ReceiptData): Promise<{ success: boolean; message: string }> {
    const plugin = getPrinterPlugin();
    if (plugin) {
      try {
        const result = await plugin.printReceipt(data);
        return { success: result.success, message: result.success ? '打印成功' : '打印失败' };
      } catch (e: any) {
        console.error('[Printer] printReceipt error:', e);
        return { success: false, message: e.message || '打印失败' };
      }
    }
    // 非原生环境：模拟打印
    console.log('[Printer] Simulating receipt print:', data);
    return { success: true, message: '模拟打印成功' };
  },

  /**
   * 打开钱箱
   */
  async openCashbox(): Promise<{ success: boolean; message: string }> {
    const plugin = getPrinterPlugin();
    if (plugin) {
      try {
        const result = await plugin.openCashbox();
        return { success: result.success, message: result.success ? '钱箱已打开' : '打开失败' };
      } catch (e: any) {
        console.error('[Printer] openCashbox error:', e);
        return { success: false, message: e.message || '打开失败' };
      }
    }
    return { success: false, message: '原生插件不可用' };
  },

  /**
   * 获取连接状态
   */
  async getStatus(): Promise<{ connected: boolean; available: boolean }> {
    const plugin = getPrinterPlugin();
    return {
      connected: plugin ? (await plugin.getStatus()).connected : false,
      available: plugin !== null,
    };
  },
};

// ==================== 客显屏 ====================

export const CustomerDisplay = {
  /**
   * 获取可用屏幕列表
   */
  async getDisplays(): Promise<Array<{ id: number; name: string; isPrimary: boolean }>> {
    const plugin = getDualScreenPlugin();
    if (plugin) {
      try {
        const result = await plugin.getDisplays();
        if (result.success && result.displays) {
          const displays: Array<{ id: number; name: string; isPrimary: boolean }> = [];
          for (const key in result.displays) {
            const d = result.displays[key];
            displays.push({
              id: d.id,
              name: d.name || `屏幕 ${d.id}`,
              isPrimary: d.isPrimary || false,
            });
          }
          return displays;
        }
      } catch (e) {
        console.error('[DualScreen] getDisplays error:', e);
      }
    }
    return [];
  },

  /**
   * 打开客显屏
   */
  async open(displayId?: number): Promise<{ success: boolean; message: string }> {
    const plugin = getDualScreenPlugin();
    if (plugin) {
      try {
        const result = await plugin.open({ displayId });
        return { success: result.success, message: result.success ? '客显屏已打开' : '打开失败' };
      } catch (e: any) {
        console.error('[DualScreen] open error:', e);
        return { success: false, message: e.message || '打开失败' };
      }
    }
    return { success: false, message: '原生插件不可用，请在APP中使用此功能' };
  },

  /**
   * 关闭客显屏
   */
  async close(): Promise<void> {
    const plugin = getDualScreenPlugin();
    if (plugin) {
      await plugin.close();
    }
  },

  /**
   * 发送数据到客显屏
   */
  async sendData(data: { total?: number; payment?: number; change?: number; items?: any[]; message?: string }): Promise<{ success: boolean }> {
    const plugin = getDualScreenPlugin();
    if (plugin) {
      try {
        return { success: (await plugin.sendData(data)).success };
      } catch (e) {
        console.error('[DualScreen] sendData error:', e);
        return { success: false };
      }
    }
    return { success: false };
  },

  /**
   * 获取状态
   */
  async getStatus(): Promise<{ isOpen: boolean; available: boolean }> {
    const plugin = getDualScreenPlugin();
    return {
      isOpen: plugin ? (await plugin.getStatus()).isOpen : false,
      available: plugin !== null,
    };
  },
};

// ==================== APP更新 ====================

export const AppUpdate = {
  /**
   * 检查更新
   */
  async checkUpdate(): Promise<{ hasUpdate: boolean; latestVersion?: string }> {
    const plugin = getAppUpdatePlugin();
    if (plugin) {
      return await plugin.checkUpdate();
    }
    return { hasUpdate: false };
  },

  /**
   * 下载并安装
   */
  async downloadAndInstall(): Promise<{ success: boolean; message: string }> {
    const plugin = getAppUpdatePlugin();
    if (plugin) {
      return await plugin.downloadAndInstall();
    }
    return { success: false, message: '原生插件不可用' };
  },
};

// ==================== 调试信息 ====================

export function getDebugInfo() {
  const cap = (window as any).Capacitor;
  return {
    isNativeApp: isNativeApp(),
    capacitorExists: !!cap,
    isNativePlatform: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
    plugins: cap?.Plugins ? Object.keys(cap.Plugins) : [],
    userAgent: navigator.userAgent,
  };
}
