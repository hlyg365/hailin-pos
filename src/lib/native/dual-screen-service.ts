/**
 * 原生双屏客显服务 - Android Presentation API专用
 * 
 * 使用方法:
 * import { DualScreenService } from '@/lib/native/dual-screen-service';
 * const display = DualScreenService.getInstance();
 * await display.open();
 * await display.sendData({ total: 100, items: [...] });
 */

import { Capacitor } from '@capacitor/core';

export interface CustomerDisplayData {
  total?: number;
  payment?: number;
  change?: number;
  items?: Array<{ name: string; price: number; quantity?: number }>;
  shopName?: string;
  orderNo?: string;
  message?: string;
}

class DualScreenService {
  private static instance: DualScreenService;
  private plugin: any = null;
  private isOpen: boolean = false;
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

  public static getInstance(): DualScreenService {
    if (!DualScreenService.instance) {
      DualScreenService.instance = new DualScreenService();
    }
    return DualScreenService.instance;
  }

  private initPlugin() {
    if (this.initialized) return;
    this.initialized = true;
    
    // 直接从window获取Capacitor和插件
    const cap = (window as any).Capacitor;
    if (cap) {
      this.plugin = (window as any).DualScreen;
      
      if (this.plugin) {
        console.log('[DualScreenService] Plugin initialized successfully');
      } else {
        console.log('[DualScreenService] Plugin not found, running in fallback mode');
      }
    }
  }

  private isNativePlatform(): boolean {
    return this.plugin != null;
  }

  /**
   * 获取可用屏幕列表
   */
  async getDisplays(): Promise<Array<{ id: number; name: string }>> {
    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.getDisplays();
        if (result.success) {
          return result.displays || [];
        }
      } catch (e) {
        console.error('[DualScreenService] getDisplays error:', e);
      }
    }
    return [];
  }

  /**
   * 打开客显屏
   */
  async open(displayId?: number): Promise<boolean> {
    if (!this.isNativePlatform()) {
      console.warn('[DualScreenService] Not in native platform, cannot open display');
      return false;
    }

    try {
      const result = await this.plugin.open({ displayId: displayId || 0 });
      if (result.success) {
        this.isOpen = true;
        return true;
      }
      console.error('[DualScreenService] Open failed:', result.error);
      return false;
    } catch (e) {
      console.error('[DualScreenService] Open error:', e);
      return false;
    }
  }

  /**
   * 关闭客显屏
   */
  async close(): Promise<void> {
    if (this.isNativePlatform()) {
      try {
        await this.plugin.close();
      } catch (e) {
        console.error('[DualScreenService] Close error:', e);
      }
    }
    this.isOpen = false;
  }

  /**
   * 发送数据到客显屏
   */
  async sendData(data: CustomerDisplayData): Promise<boolean> {
    if (!this.isNativePlatform()) {
      console.log('[DualScreenService] Display data (simulated):', data);
      return true;
    }

    try {
      const result = await this.plugin.sendData(data);
      return result.success;
    } catch (e) {
      console.error('[DualScreenService] SendData error:', e);
      return false;
    }
  }

  /**
   * 显示等待付款界面
   */
  async showWaitingPayment(total: number, shopName?: string): Promise<boolean> {
    return this.sendData({
      total,
      shopName,
      message: '等待付款',
    });
  }

  /**
   * 显示付款成功界面
   */
  async showPaymentSuccess(total: number, payment: number, change: number): Promise<boolean> {
    return this.sendData({
      total,
      payment,
      change,
      message: '付款成功',
    });
  }

  /**
   * 显示商品列表
   */
  async showItems(items: Array<{ name: string; price: number; quantity?: number }>, total: number): Promise<boolean> {
    return this.sendData({
      items,
      total,
      message: '当前商品',
    });
  }

  /**
   * 显示二维码
   */
  async showQRCode(qrcodeUrl: string, amount: number): Promise<boolean> {
    if (!this.isNativePlatform()) {
      console.log('[DualScreenService] QR Code (simulated):', qrcodeUrl, amount);
      return true;
    }

    try {
      const result = await this.plugin.showQRCode({ qrcodeUrl, amount });
      return result.success;
    } catch (e) {
      console.error('[DualScreenService] ShowQRCode error:', e);
      return false;
    }
  }

  /**
   * 获取状态
   */
  async getStatus(): Promise<{ isOpen: boolean; available: boolean }> {
    const hasPlugin = this.isNativePlatform();
    
    return {
      isOpen: this.isOpen,
      available: hasPlugin || false,
    };
  }
}

export const dualScreenService = DualScreenService.getInstance();
export { DualScreenService };
