/**
 * 原生打印机服务 - Android蓝牙打印机专用
 * 
 * 使用方法:
 * import { PrinterService } from '@/lib/native/printer-service';
 * const printer = PrinterService.getInstance();
 * await printer.connect('XX:XX:XX:XX:XX:XX');
 * await printer.printReceipt(receiptData);
 */

import { Capacitor } from '@capacitor/core';

export interface PrinterDevice {
  name: string;
  address: string;
  type: string;
  paired: boolean;
}

export interface ReceiptItem {
  name: string;
  quantity: string;
  price: string;
}

export interface ReceiptData {
  shopName?: string;
  orderNo?: string;
  date?: string;
  cashier?: string;
  items: ReceiptItem[];
  total: number;
  discount?: number;
  payment: number;
  change: number;
}

class PrinterService {
  private static instance: PrinterService;
  private plugin: any = null;
  private isConnected: boolean = false;
  private currentDevice: PrinterDevice | null = null;
  private initialized: boolean = false;

  private constructor() {
    // 延迟初始化，等待Capacitor完全准备好
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => this.initPlugin(), 0);
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => this.initPlugin(), 0);
        });
      }
    }
  }

  public static getInstance(): PrinterService {
    if (!PrinterService.instance) {
      PrinterService.instance = new PrinterService();
    }
    return PrinterService.instance;
  }

  private initPlugin() {
    if (this.initialized) return;
    this.initialized = true;
    
    // 直接从window获取Capacitor和插件
    const cap = (window as any).Capacitor;
    if (cap) {
      this.plugin = (window as any).Printer;
      
      if (this.plugin) {
        console.log('[PrinterService] Plugin initialized successfully');
      } else {
        console.log('[PrinterService] Plugin not found, running in fallback mode');
      }
    }
  }

  private isNativePlatform(): boolean {
    return this.plugin != null;
  }

  /**
   * 列出已配对的蓝牙设备
   */
  async listDevices(): Promise<PrinterDevice[]> {
    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.listDevices();
        if (result.success) {
          const devices: PrinterDevice[] = [];
          const deviceList = result.devices || [];
          for (const device of deviceList) {
            devices.push({
              name: device.name || '未知设备',
              address: device.address,
              type: device.type || '未知',
              paired: device.paired || false,
            });
          }
          return devices;
        }
        throw new Error(result.error || '获取设备列表失败');
      } catch (e) {
        console.error('[PrinterService] listDevices error:', e);
        return [];
      }
    }
    return [];
  }

  /**
   * 连接蓝牙打印机
   */
  async connect(address: string): Promise<boolean> {
    if (!this.isNativePlatform()) {
      console.warn('[PrinterService] Not in native platform, using simulation');
      this.isConnected = true;
      return true;
    }

    try {
      const result = await this.plugin.connect({ address });
      if (result.success) {
        this.isConnected = true;
        this.currentDevice = { name: '蓝牙打印机', address, type: 'bluetooth', paired: true };
        return true;
      }
      throw new Error(result.error || '连接失败');
    } catch (e) {
      console.error('[PrinterService] Connect error:', e);
      return false;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (this.isNativePlatform()) {
      try {
        await this.plugin.disconnect();
      } catch (e) {
        console.error('[PrinterService] Disconnect error:', e);
      }
    }
    this.isConnected = false;
    this.currentDevice = null;
  }

  /**
   * 打印小票
   */
  async printReceipt(data: ReceiptData): Promise<boolean> {
    if (!this.isNativePlatform()) {
      console.warn('[PrinterService] Not in native platform, simulating print');
      console.log('[PrinterService] Receipt:', data);
      return true;
    }

    try {
      const result = await this.plugin.printReceipt(data);
      return result.success;
    } catch (e) {
      console.error('[PrinterService] Print error:', e);
      return false;
    }
  }

  /**
   * 打印文本
   */
  async printText(text: string): Promise<boolean> {
    if (!this.isNativePlatform()) {
      console.log('[PrinterService] Print text:', text);
      return true;
    }

    try {
      const result = await this.plugin.printText({ text });
      return result.success;
    } catch (e) {
      console.error('[PrinterService] PrintText error:', e);
      return false;
    }
  }

  /**
   * 打开钱箱
   */
  async openCashbox(): Promise<boolean> {
    if (!this.isNativePlatform()) {
      console.warn('[PrinterService] Not in native platform');
      return false;
    }

    try {
      const result = await this.plugin.openCashbox();
      return result.success;
    } catch (e) {
      console.error('[PrinterService] OpenCashbox error:', e);
      return false;
    }
  }

  /**
   * 获取状态
   */
  async getStatus(): Promise<{ connected: boolean; available: boolean; device: PrinterDevice | null }> {
    const hasPlugin = this.isNativePlatform();
    
    return {
      connected: this.isConnected,
      available: hasPlugin || false,
      device: this.currentDevice,
    };
  }

  /**
   * 获取当前连接的设备
   */
  getCurrentDevice(): PrinterDevice | null {
    return this.currentDevice;
  }
}

export const printerService = PrinterService.getInstance();
export { PrinterService };
