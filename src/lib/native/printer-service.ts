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

  private constructor() {
    this.initPlugin();
  }

  public static getInstance(): PrinterService {
    if (!PrinterService.instance) {
      PrinterService.instance = new PrinterService();
    }
    return PrinterService.instance;
  }

  private initPlugin() {
    if (Capacitor.isNativePlatform()) {
      // @ts-ignore
      this.plugin = (window as any).Printer;
    }
  }

  private isNativePlatform(): boolean {
    return Capacitor.isNativePlatform() && this.plugin != null;
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
        } else {
          console.warn('[PrinterService] listDevices failed:', result.error);
        }
      } catch (e) {
        console.error('[PrinterService] listDevices error:', e);
      }
    } else {
      console.warn('[PrinterService] Not running on native platform');
    }
    return [];
  }

  /**
   * 连接到蓝牙打印机
   */
  async connect(address: string, name?: string): Promise<{ success: boolean; message: string }> {
    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.connect({ address, name: name || '' });
        
        if (result.success) {
          this.isConnected = true;
          this.currentDevice = { name: name || '', address, type: 'bluetooth', paired: true };
        }
        
        return {
          success: result.success,
          message: result.message || (result.success ? '连接成功' : '连接失败'),
        };
      } catch (e: any) {
        return { success: false, message: e.message || '连接失败' };
      }
    }

    // 非原生平台
    console.warn('[PrinterService] Running in browser, cannot connect to real printer');
    return { success: false, message: '非原生环境，无法连接打印机' };
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.currentDevice = null;

    if (this.isNativePlatform()) {
      try {
        await this.plugin.disconnect();
      } catch (e) {
        console.error('[PrinterService] disconnect error:', e);
      }
    }
  }

  /**
   * 获取连接状态
   */
  async getStatus(): Promise<{
    connected: boolean;
    deviceName?: string;
    deviceAddress?: string;
  }> {
    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.getStatus();
        this.isConnected = result.connected || false;
        return {
          connected: this.isConnected,
          deviceName: result.deviceName,
          deviceAddress: result.deviceAddress,
        };
      } catch (e) {
        console.error('[PrinterService] getStatus error:', e);
      }
    }

    return { connected: this.isConnected };
  }

  /**
   * 打印小票
   */
  async printReceipt(receipt: ReceiptData): Promise<{ success: boolean; message: string }> {
    if (!this.isConnected) {
      return { success: false, message: '打印机未连接' };
    }

    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.printReceipt(receipt);
        return {
          success: result.success,
          message: result.message || '打印完成',
        };
      } catch (e: any) {
        return { success: false, message: e.message || '打印失败' };
      }
    }

    // 非原生平台，模拟打印
    console.log('[PrinterService] Simulating receipt print:', receipt);
    return { success: true, message: '模拟打印成功' };
  }

  /**
   * 打印文本
   */
  async printText(
    text: string,
    options?: {
      align?: 'left' | 'center' | 'right';
      bold?: boolean;
      doubleHeight?: boolean;
    }
  ): Promise<{ success: boolean; message: string }> {
    if (!this.isConnected) {
      return { success: false, message: '打印机未连接' };
    }

    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.printText({
          text,
          align: options?.align || 'left',
          bold: options?.bold || false,
          doubleHeight: options?.doubleHeight || false,
        });
        return {
          success: result.success,
          message: result.message || '打印完成',
        };
      } catch (e: any) {
        return { success: false, message: e.message || '打印失败' };
      }
    }

    console.log('[PrinterService] Simulating text print:', text);
    return { success: true, message: '模拟打印成功' };
  }

  /**
   * 打开钱箱
   */
  async openCashbox(): Promise<{ success: boolean; message: string }> {
    if (!this.isConnected) {
      return { success: false, message: '钱箱未连接' };
    }

    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.openCashbox();
        return {
          success: result.success,
          message: result.message || '钱箱已打开',
        };
      } catch (e: any) {
        return { success: false, message: e.message || '打开钱箱失败' };
      }
    }

    console.log('[PrinterService] Simulating cashbox open');
    return { success: true, message: '模拟打开钱箱' };
  }

  /**
   * 切纸
   */
  async cutPaper(): Promise<{ success: boolean; message: string }> {
    if (!this.isConnected) {
      return { success: false, message: '打印机未连接' };
    }

    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.cutPaper();
        return {
          success: result.success,
          message: result.message || '切纸完成',
        };
      } catch (e: any) {
        return { success: false, message: e.message || '切纸失败' };
      }
    }

    return { success: true, message: '模拟切纸' };
  }

  /**
   * 发送原始数据（十六进制）
   */
  async sendRawData(hexString: string): Promise<{ success: boolean; message: string }> {
    if (!this.isConnected) {
      return { success: false, message: '打印机未连接' };
    }

    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.print({ data: hexString });
        return {
          success: result.success,
          message: result.message || '发送完成',
        };
      } catch (e: any) {
        return { success: false, message: e.message || '发送失败' };
      }
    }

    return { success: true, message: '模拟发送' };
  }
}

export const printerService = PrinterService.getInstance();
export { PrinterService };
export default PrinterService;
