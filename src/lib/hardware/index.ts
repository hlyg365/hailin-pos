/**
 * 硬件服务主入口
 * 统一导出所有硬件插件
 */

// USB设备服务
export { usbService, UsbDeviceService } from './plugins/UsbDeviceService';
export type { UsbDevice, UsbDeviceType, UsbDeviceEventType, UsbDeviceEventCallback } from './plugins/UsbDeviceService';

// 电子秤插件
export { scalePlugin, ScalePlugin } from './plugins/ScalePlugin';
export type { ScaleConfig, ScaleReading, ScaleStatus, WeightUnit } from './plugins/ScalePlugin';

// 打印机插件
export { printerPlugin, PrinterPlugin } from './plugins/PrinterPlugin';
export type { ReceiptData, PrintLine, PrintStyle, PrintAlign, PrintContentType, PrinterStatus } from './plugins/PrinterPlugin';

// 双屏插件
export { dualScreenPlugin, DualScreenPlugin } from './plugins/DualScreenPlugin';
export type { DualScreenConfig, DisplayContent, DisplayContentType, ScreenType } from './plugins/DualScreenPlugin';

// 钱箱插件
export { cashboxPlugin, CashboxPlugin } from './plugins/CashboxPlugin';
export type { CashboxConfig, CashboxStatus, CashboxEventType, CashboxEventCallback } from './plugins/CashboxPlugin';

// 导入插件供HardwareService使用
import { scalePlugin } from './plugins/ScalePlugin';
import { printerPlugin } from './plugins/PrinterPlugin';
import { cashboxPlugin } from './plugins/CashboxPlugin';
import { dualScreenPlugin } from './plugins/DualScreenPlugin';

/**
 * 硬件服务管理器
 * 提供统一的硬件初始化和状态管理
 */
class HardwareService {
  private static instance: HardwareService;
  private initialized: boolean = false;
  private devices: {
    scale: boolean;
    printer: boolean;
    cashbox: boolean;
    dualScreen: boolean;
  } = {
    scale: false,
    printer: false,
    cashbox: false,
    dualScreen: false,
  };

  private constructor() {}

  static getInstance(): HardwareService {
    if (!HardwareService.instance) {
      HardwareService.instance = new HardwareService();
    }
    return HardwareService.instance;
  }

  // 初始化所有硬件
  async initializeAll(): Promise<{
    scale: boolean;
    printer: boolean;
    cashbox: boolean;
    dualScreen: boolean;
  }> {
    if (this.initialized) {
      return this.devices;
    }

    try {
      // 并行初始化所有硬件
      const [scale, printer, cashbox, dualScreen] = await Promise.all([
        scalePlugin.isSupported() ? scalePlugin.connect().catch(() => false) : Promise.resolve(false),
        printerPlugin.isSupported() ? printerPlugin.connect().catch(() => false) : Promise.resolve(false),
        cashboxPlugin.initialize().catch(() => false),
        dualScreenPlugin.initialize().catch(() => false),
      ]);

      this.devices = {
        scale: !!scale,
        printer: !!printer,
        cashbox: !!cashbox,
        dualScreen: !!dualScreen,
      };

      this.initialized = true;
      console.log('HardwareService: All devices initialized', this.devices);
    } catch (error) {
      console.error('HardwareService: Initialization failed', error);
    }

    return this.devices;
  }

  // 获取所有设备状态
  getDeviceStatus(): typeof this.devices {
    return {
      scale: scalePlugin.isReady(),
      printer: printerPlugin.isReady(),
      cashbox: cashboxPlugin.isReady(),
      dualScreen: dualScreenPlugin.getStatus().active,
    };
  }

  // 检查是否已初始化
  isInitialized(): boolean {
    return this.initialized;
  }

  // 重置初始化状态
  reset(): void {
    this.initialized = false;
  }
}

// 导出硬件服务管理器
export const hardwareService = HardwareService.getInstance();
