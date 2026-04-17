/**
 * Android 硬件服务模块
 * 通过 Capacitor 桥接调用 Android 原生硬件
 */

import { registerPlugin } from '@capacitor/core';

// ============ 类型定义 ============

export interface SerialDevice {
  path: string;
  vendorId: number;
  productId: number;
  deviceId: number;
}

export interface ScaleReading {
  weight: number;
  unit: string;
  stable: boolean;
  raw: string;
}

export interface PrintReceiptOptions {
  storeName: string;
  orderNo: string;
  date: string;
  cashier: string;
  total: number;
  paymentMethod: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
}

export interface PrintLabelOptions {
  name: string;
  price: number;
  barcode: string;
  date?: string;
}

// ============ 串口插件 ============

const SerialPortPlugin = registerPlugin<{
  listPorts(): Promise<{ ports: SerialDevice[]; count: number }>;
  connect(port: string, baudRate?: number): Promise<{ success: boolean; port: string }>;
  disconnect(): Promise<{ success: boolean }>;
  write(data: string): Promise<{ success: boolean; bytesWritten: number }>;
  getScaleReading(): Promise<ScaleReading>;
}>('SerialPortPlugin');

// ============ 打印机插件 ============

const PrinterPlugin = registerPlugin<{
  listPrinters(): Promise<{ count: number; message: string }>;
  printReceipt(options: PrintReceiptOptions): Promise<{ success: boolean; message: string }>;
  printLabel(options: PrintLabelOptions): Promise<{ success: boolean }>;
  printTest(): Promise<{ success: boolean }>;
}>('PrinterPlugin');

// ============ 钱箱插件 ============

const CashDrawerPlugin = registerPlugin<{
  open(reason?: 'sale' | 'manual' | 'shift'): Promise<{ success: boolean; reason: string }>;
  getStatus(): Promise<{ open: boolean; connected: boolean; message: string }>;
}>('CashDrawerPlugin');

// ============ Android 硬件服务类 ============

class AndroidSerialService {
  private listeners: ((data: ScaleReading) => void)[] = [];

  /**
   * 列出可用串口
   */
  async listPorts(): Promise<SerialDevice[]> {
    try {
      const result = await SerialPortPlugin.listPorts();
      return result.ports || [];
    } catch (e) {
      console.error('[AndroidSerial] 列出端口失败:', e);
      return [];
    }
  }

  /**
   * 连接电子秤
   */
  async connect(portPath?: string, baudRate = 9600): Promise<boolean> {
    try {
      // 如果未指定端口，自动选择第一个
      if (!portPath) {
        const ports = await this.listPorts();
        if (ports.length === 0) {
          console.error('[AndroidSerial] 未找到可用串口');
          return false;
        }
        portPath = ports[0].path;
      }

      const result = await SerialPortPlugin.connect(portPath, baudRate);
      
      if (result.success) {
        console.log('[AndroidSerial] 已连接:', portPath);
        // 监听秤数据
        // 需要在App中设置事件监听
      }
      
      return result.success;
    } catch (e) {
      console.error('[AndroidSerial] 连接失败:', e);
      return false;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    await SerialPortPlugin.disconnect();
    console.log('[AndroidSerial] 已断开');
  }

  /**
   * 获取秤读数
   */
  async getReading(): Promise<ScaleReading | null> {
    try {
      return await SerialPortPlugin.getScaleReading();
    } catch {
      return null;
    }
  }

  /**
   * 监听秤数据
   */
  onData(callback: (data: ScaleReading) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
}

class AndroidPrinterService {
  /**
   * 打印小票
   */
  async printReceipt(options: PrintReceiptOptions): Promise<boolean> {
    try {
      const result = await PrinterPlugin.printReceipt(options);
      console.log('[AndroidPrinter] 小票已打印:', result.message);
      return result.success;
    } catch (e) {
      console.error('[AndroidPrinter] 打印失败:', e);
      return false;
    }
  }

  /**
   * 打印标签
   */
  async printLabel(options: PrintLabelOptions): Promise<boolean> {
    try {
      const result = await PrinterPlugin.printLabel(options);
      return result.success;
    } catch (e) {
      console.error('[AndroidPrinter] 标签打印失败:', e);
      return false;
    }
  }

  /**
   * 打印测试页
   */
  async printTest(): Promise<boolean> {
    try {
      const result = await PrinterPlugin.printTest();
      return result.success;
    } catch (e) {
      console.error('[AndroidPrinter] 测试打印失败:', e);
      return false;
    }
  }
}

class AndroidCashDrawerService {
  /**
   * 打开钱箱
   */
  async open(reason: 'sale' | 'manual' | 'shift' = 'sale'): Promise<boolean> {
    try {
      const result = await CashDrawerPlugin.open(reason);
      console.log('[AndroidCashDrawer] 钱箱已打开:', reason);
      return result.success;
    } catch (e) {
      console.error('[AndroidCashDrawer] 打开失败:', e);
      return false;
    }
  }

  /**
   * 获取钱箱状态
   */
  async getStatus(): Promise<{ open: boolean; connected: boolean }> {
    try {
      const result = await CashDrawerPlugin.getStatus();
      return {
        open: result.open,
        connected: result.connected
      };
    } catch {
      return { open: false, connected: false };
    }
  }
}

// ============ 导出单例 ============

export const androidSerial = new AndroidSerialService();
export const androidPrinter = new AndroidPrinterService();
export const androidCashDrawer = new AndroidCashDrawerService();

// 平台检测
export const isAndroid = () => {
  return typeof window !== 'undefined' && 
         /Android/.test(navigator.userAgent);
};

// 自动选择合适的实现
export const getSerialService = () => {
  if (isAndroid()) {
    return androidSerial;
  }
  // 回退到 Electron 或 Web 实现
  return null;
};

export const getPrinterService = () => {
  if (isAndroid()) {
    return androidPrinter;
  }
  return null;
};

export const getCashDrawerService = () => {
  if (isAndroid()) {
    return androidCashDrawer;
  }
  return null;
};
