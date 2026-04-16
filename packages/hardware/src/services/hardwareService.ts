// ============================================
// 海邻到家 - 硬件服务工厂
// 统一管理所有硬件设备
// ============================================

import { PrinterService } from './printer';
import { ScannerService } from './scanner';
import { CashboxService } from './cashbox';
import { ScaleService } from './scale';
import type { Device, PrinterConfig, ScaleConfig } from '@hailin/core';

/** 硬件服务管理器 */
class HardwareService {
  private static instance: HardwareService;
  
  public printer: PrinterService;
  public scanner: ScannerService;
  public cashbox: CashboxService;
  public scale: ScaleService;
  
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  
  private constructor() {
    this.printer = new PrinterService();
    this.scanner = new ScannerService();
    this.cashbox = new CashboxService();
    this.scale = new ScaleService();
  }
  
  /** 获取单例 */
  public static getInstance(): HardwareService {
    if (!HardwareService.instance) {
      HardwareService.instance = new HardwareService();
    }
    return HardwareService.instance;
  }
  
  /** 初始化所有硬件 */
  async initialize(config?: HardwareConfig): Promise<{ success: boolean; errors: string[] }> {
    if (this.initPromise) {
      return this.initPromise.then(() => ({ success: true, errors: [] }))
        .catch((err: Error) => ({ success: false, errors: [err.message] }));
    }
    
    this.initPromise = this._doInitialize(config);
    return this.initPromise.then(() => ({ success: true, errors: [] }))
      .catch((err: Error) => ({ success: false, errors: [err.message] }));
  }
  
  private async _doInitialize(config?: HardwareConfig): Promise<void> {
    const tasks: Promise<void>[] = [];
    
    // 初始化打印机
    if (config?.printer) {
      tasks.push(
        this.printer.connect(config.printer)
          .then(() => {})
          .catch((err) => console.error('Printer init failed:', err))
      );
    }
    
    // 初始化电子秤
    if (config?.scale) {
      tasks.push(
        this.scale.connect(config.scale)
          .then(() => {})
          .catch((err) => console.error('Scale init failed:', err))
      );
    }
    
    await Promise.allSettled(tasks);
    this.initialized = true;
  }
  
  /** 获取所有设备状态 */
  getDevices(): Device[] {
    return [
      { id: 'printer', type: 'printer', name: '小票打印机', status: this.printer.getStatus() },
      { id: 'scanner', type: 'scanner', name: '扫码枪', status: this.scanner.getStatus() },
      { id: 'cashbox', type: 'cashbox', name: '钱箱', status: this.cashbox.getStatus() },
      { id: 'scale', type: 'scale', name: '电子秤', status: this.scale.getStatus() },
    ];
  }
  
  /** 检查设备是否就绪 */
  isReady(): boolean {
    return this.initialized;
  }
  
  /** 重置所有设备 */
  async reset(): Promise<void> {
    await Promise.allSettled([
      this.printer.disconnect(),
      this.scanner.disconnect(),
      this.cashbox.disconnect(),
      this.scale.disconnect(),
    ]);
    this.initialized = false;
    this.initPromise = null;
  }
}

/** 硬件配置 */
export interface HardwareConfig {
  printer?: PrinterConfig;
  scale?: ScaleConfig;
  scanner?: { type: 'usb' | 'bluetooth' };
  cashbox?: { type: 'serial' | 'printer' };
}

// 导出单例
export const hardwareService = HardwareService.getInstance();
export default hardwareService;
