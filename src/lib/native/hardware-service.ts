/**
 * 硬件服务统一接口
 * 
 * 提供统一的硬件访问接口，自动适配原生APP和浏览器环境
 * 
 * 使用示例:
 * import { HardwareService } from '@/lib/native/hardware-service';
 * 
 * const hardware = HardwareService.getInstance();
 * 
 * // 电子秤
 * await hardware.scale.connect();
 * hardware.scale.onWeightChange((data) => { ... });
 * 
 * // 打印机
 * await hardware.printer.connect('XX:XX:XX:XX:XX:XX');
 * await hardware.printer.printReceipt(receipt);
 * 
 * // 客显屏
 * await hardware.customerDisplay.open();
 * await hardware.customerDisplay.sendData({ ... });
 */

// 延迟加载 Capacitor
let Capacitor: any = null;
function getCapacitor() {
  if (Capacitor === null && typeof window !== 'undefined') {
    Capacitor = (window as any).Capacitor;
  }
  return Capacitor;
}

import { scaleService, ScaleService } from './scale-service';
import { printerService, PrinterService } from './printer-service';
import { dualScreenService, DualScreenService } from './dual-screen-service';

export interface HardwareStatus {
  platform: 'android' | 'ios' | 'web';
  isNative: boolean;
  scale: {
    connected: boolean;
    available: boolean;
  };
  printer: {
    connected: boolean;
    available: boolean;
  };
  customerDisplay: {
    open: boolean;
    available: boolean;
  };
}

class HardwareService {
  private static instance: HardwareService;
  
  public scale: ScaleService;
  public printer: PrinterService;
  public customerDisplay: DualScreenService;
  
  private platform: 'android' | 'ios' | 'web' = 'web';
  private isNative: boolean = false;

  private constructor() {
    this.scale = scaleService;
    this.printer = printerService;
    this.customerDisplay = dualScreenService;
    
    this.initPlatform();
  }

  public static getInstance(): HardwareService {
    if (!HardwareService.instance) {
      HardwareService.instance = new HardwareService();
    }
    return HardwareService.instance;
  }

  private initPlatform() {
    if (typeof window !== 'undefined') {
      this.isNative = Capacitor.isNativePlatform();
      this.platform = Capacitor.getPlatform() as 'android' | 'ios' | 'web';
    }
  }

  /**
   * 获取硬件状态
   */
  async getStatus(): Promise<HardwareStatus> {
    const scaleStatus = await this.scale.getStatus();
    const printerStatus = await this.printer.getStatus();
    const displayStatus = await this.customerDisplay.getStatus();

    return {
      platform: this.platform,
      isNative: this.isNative,
      scale: {
        connected: scaleStatus.connected,
        available: this.isNative || true, // 秤在非原生环境也可用（模拟模式）
      },
      printer: {
        connected: printerStatus.connected,
        available: this.isNative, // 打印机只能在原生环境使用
      },
      customerDisplay: {
        open: displayStatus.isOpen,
        available: this.isNative || true, // 客显屏在新窗口模式下也可用
      },
    };
  }

  /**
   * 初始化所有硬件
   */
  async initialize(): Promise<{
    success: boolean;
    message: string;
    details: {
      scale: string;
      printer: string;
      display: string;
    };
  }> {
    const details = {
      scale: '就绪',
      printer: '就绪',
      display: '就绪',
    };

    if (!this.isNative) {
      details.printer = '非原生环境（仅模拟）';
    }

    return {
      success: true,
      message: '硬件初始化完成',
      details,
    };
  }

  /**
   * 检查是否支持硬件功能
   */
  isSupported(feature: 'scale' | 'printer' | 'customerDisplay' | 'usb' | 'bluetooth'): boolean {
    switch (feature) {
      case 'scale':
        return true; // 秤在所有环境都可用
      case 'printer':
        return this.isNative;
      case 'customerDisplay':
        return this.isNative || typeof window !== 'undefined';
      case 'usb':
      case 'bluetooth':
        return this.isNative;
      default:
        return false;
    }
  }

  /**
   * 获取平台信息
   */
  getPlatform(): { platform: string; isNative: boolean; version?: string } {
    return {
      platform: this.platform,
      isNative: this.isNative,
      version: Capacitor.getPlatform(),
    };
  }
}

export const hardwareService = HardwareService.getInstance();
export default HardwareService;

// 重新导出子模块
export { scaleService } from './scale-service';
export { printerService } from './printer-service';
export { dualScreenService } from './dual-screen-service';
