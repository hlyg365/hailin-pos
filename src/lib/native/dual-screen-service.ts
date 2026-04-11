/**
 * 原生双屏服务 - Android双屏收银机专用
 * 
 * 使用方法:
 * import { DualScreenService } from '@/lib/native/dual-screen-service';
 * const dualScreen = DualScreenService.getInstance();
 * 
 * // 检测屏幕
 * const displays = await dualScreen.getDisplays();
 * 
 * // 打开客显屏
 * await dualScreen.open({ url: '/pos/customer-display' });
 * 
 * // 发送数据到客显屏
 * await dualScreen.sendData({ cart: [...], total: 100 });
 * 
 * // 关闭客显屏
 * await dualScreen.close();
 */

import { Capacitor } from '@capacitor/core';

export interface DisplayInfo {
  id: number;
  name: string;
  width: number;
  height: number;
  isPrimary: boolean;
}

export interface DualScreenConfig {
  url?: string;
  displayId?: number;
}

export interface CustomerDisplayData {
  cart?: any[];
  member?: { name: string; points: number } | null;
  total?: number;
  discount?: number;
  payment?: number;
  change?: number;
  orderNo?: string;
  message?: string;
}

type DataListener = (data: CustomerDisplayData) => void;

class DualScreenService {
  private static instance: DualScreenService;
  private plugin: any = null;
  private isOpen: boolean = false;
  private currentDisplay: DisplayInfo | null = null;
  private listeners: Set<DataListener> = new Set();
  private eventHandler: ((e: CustomEvent) => void) | null = null;

  private constructor() {
    this.initPlugin();
  }

  public static getInstance(): DualScreenService {
    if (!DualScreenService.instance) {
      DualScreenService.instance = new DualScreenService();
    }
    return DualScreenService.instance;
  }

  private initPlugin() {
    if (Capacitor.isNativePlatform()) {
      // @ts-ignore
      this.plugin = (window as any).DualScreen;
      
      // 监听来自客显屏的消息
      if (this.plugin) {
        this.setupEventListener();
      }
    }
  }

  private isNativePlatform(): boolean {
    return Capacitor.isNativePlatform() && this.plugin != null;
  }

  private setupEventListener() {
    // 通过 Capacitor 的事件系统监听
    if (typeof window !== 'undefined') {
      this.eventHandler = (e: CustomEvent) => {
        const data = e.detail as CustomerDisplayData;
        this.listeners.forEach(cb => cb(data));
      };
      
      window.addEventListener('customerDisplayData', this.eventHandler as EventListener);
    }
  }

  /**
   * 获取所有显示器信息
   */
  async getDisplays(): Promise<{
    displays: DisplayInfo[];
    count: number;
    isDualScreen: boolean;
  }> {
    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.getDisplays();
        return {
          displays: Object.values(result.displays || {}),
          count: result.count || 0,
          isDualScreen: result.isDualScreen || false,
        };
      } catch (e) {
        console.error('[DualScreenService] getDisplays error:', e);
      }
    } else {
      // 浏览器环境，检测多屏幕
      if (typeof window !== 'undefined' && 'getScreenDetails' in window) {
        try {
          // @ts-ignore
          const screenDetails = await window.getScreenDetails();
          // @ts-ignore
          const screens: Screen[] = screenDetails.screens;
          const displays: DisplayInfo[] = screens.map((s: any, i: number) => ({
            id: i,
            name: s.label || s.name || `屏幕 ${i + 1}`,
            width: s.width,
            height: s.height,
            isPrimary: i === 0,
          }));
          
          return {
            displays,
            count: displays.length,
            isDualScreen: displays.length > 1,
          };
        } catch (e) {
          console.warn('[DualScreenService] Screen Details API not available');
        }
      }
    }

    // 返回默认单屏
    return {
      displays: [{
        id: 0,
        name: '主屏幕',
        width: typeof window !== 'undefined' ? window.screen.width : 1920,
        height: typeof window !== 'undefined' ? window.screen.height : 1080,
        isPrimary: true,
      }],
      count: 1,
      isDualScreen: false,
    };
  }

  /**
   * 打开客显屏
   */
  async open(config?: DualScreenConfig): Promise<{
    success: boolean;
    message: string;
    displayId?: number;
    displayName?: string;
  }> {
    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.open({
          url: config?.url || '',
          displayId: config?.displayId ?? -1,
        });
        
        if (result.success) {
          this.isOpen = true;
          this.currentDisplay = {
            id: result.displayId || 0,
            name: result.displayName || '副屏幕',
            width: 0,
            height: 0,
            isPrimary: false,
          };
        }
        
        return {
          success: result.success,
          message: result.message || (result.success ? '客显屏已打开' : '打开失败'),
          displayId: result.displayId,
          displayName: result.displayName,
        };
      } catch (e: any) {
        return { success: false, message: e.message || '打开客显屏失败' };
      }
    }

    // 非原生平台，尝试在新窗口打开
    if (typeof window !== 'undefined') {
      const url = config?.url || '/pos/customer-display';
      const fullUrl = new URL(url, window.location.origin).toString();
      
      try {
        const newWindow = window.open(fullUrl, '_blank');
        if (newWindow) {
          this.isOpen = true;
          return {
            success: true,
            message: '客显屏窗口已打开（浏览器模式）',
          };
        } else {
          return {
            success: false,
            message: '弹窗被拦截，请允许弹窗后重试',
          };
        }
      } catch (e: any) {
        return { success: false, message: e.message || '打开失败' };
      }
    }

    return { success: false, message: '无法打开客显屏' };
  }

  /**
   * 关闭客显屏
   */
  async close(): Promise<{ success: boolean; message: string }> {
    if (this.isNativePlatform()) {
      try {
        await this.plugin.close();
        this.isOpen = false;
        this.currentDisplay = null;
        return { success: true, message: '客显屏已关闭' };
      } catch (e: any) {
        return { success: false, message: e.message || '关闭失败' };
      }
    }

    // 浏览器模式
    // 通过 localStorage 通知客显屏关闭
    if (typeof window !== 'undefined') {
      localStorage.setItem('customer_display_close', 'true');
      setTimeout(() => {
        localStorage.removeItem('customer_display_close');
      }, 1000);
    }

    this.isOpen = false;
    this.currentDisplay = null;
    return { success: true, message: '客显屏已关闭' };
  }

  /**
   * 发送数据到客显屏
   */
  async sendData(data: CustomerDisplayData): Promise<{ success: boolean; message: string }> {
    if (!this.isOpen) {
      return { success: false, message: '客显屏未打开' };
    }

    if (this.isNativePlatform()) {
      try {
        await this.plugin.sendData({ data: JSON.stringify(data) });
        return { success: true, message: '数据已发送' };
      } catch (e: any) {
        return { success: false, message: e.message || '发送失败' };
      }
    }

    // 浏览器模式，通过 localStorage 传递数据
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('customer_display_data', JSON.stringify({
          ...data,
          timestamp: Date.now(),
        }));
        return { success: true, message: '数据已发送' };
      } catch (e) {
        return { success: false, message: '发送失败' };
      }
    }

    return { success: false, message: '发送失败' };
  }

  /**
   * 获取客显屏状态
   */
  async getStatus(): Promise<{
    isOpen: boolean;
    hasPresentation: boolean;
  }> {
    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.getStatus();
        this.isOpen = result.isOpen || false;
        return {
          isOpen: this.isOpen,
          hasPresentation: result.hasPresentation || false,
        };
      } catch (e) {
        console.error('[DualScreenService] getStatus error:', e);
      }
    }

    return { isOpen: this.isOpen, hasPresentation: this.isOpen };
  }

  /**
   * 订阅来自客显屏的数据
   */
  onData(callback: DataListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * 更新客显屏显示（快捷方法）
   */
  async updateDisplay(data: {
    cart?: any[];
    member?: { name: string; points: number } | null;
    total?: number;
    discount?: number;
    payment?: number;
    change?: number;
  }): Promise<void> {
    await this.sendData(data);
  }
}

export const dualScreenService = DualScreenService.getInstance();
export { DualScreenService };
export default DualScreenService;
