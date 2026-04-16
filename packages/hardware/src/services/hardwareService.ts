// ============================================
// 海邻到家 - 硬件服务工厂
// 统一管理所有硬件设备
// ============================================

import { PrinterService } from './printer';
import { ScannerService } from './scanner';
import { CashboxService } from './cashbox';
import { ScaleService } from './scale';
import type { Device, PrinterConfig, ScaleConfig } from '@hailin/core';

/** 硬件配置 */
export interface HardwareConfig {
  printer?: PrinterConfig;
  scale?: ScaleConfig;
  scanner?: { type: 'usb' | 'bluetooth' };
  cashbox?: { type: 'serial' | 'printer' };
}

/** 硬件服务管理器 - 单例 */
class HardwareServiceManager {
  private static instance: HardwareServiceManager;
  
  public printer: PrinterService;
  public scanner: ScannerService;
  public cashbox: CashboxService;
  public scale: ScaleService;
  
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private listeners: Set<(devices: Device[]) => void> = new Set();
  
  private constructor() {
    this.printer = new PrinterService();
    this.scanner = new ScannerService();
    this.cashbox = new CashboxService();
    this.scale = new ScaleService();
  }
  
  /** 获取单例 */
  public static getInstance(): HardwareServiceManager {
    if (!HardwareServiceManager.instance) {
      HardwareServiceManager.instance = new HardwareServiceManager();
    }
    return HardwareServiceManager.instance;
  }
  
  /** 初始化所有硬件 */
  async initialize(config?: HardwareConfig): Promise<{ success: boolean; errors: string[] }> {
    if (this.initPromise) {
      return this.initPromise.then(() => ({ success: true, errors: [] }))
        .catch((err: Error) => ({ success: false, errors: [err.message] }));
    }
    
    this.initPromise = this.doInitialize(config);
    return this.initPromise.then(() => ({ success: true, errors: [] }))
      .catch((err: Error) => ({ success: false, errors: [err.message] }));
  }
  
  private async doInitialize(config?: HardwareConfig): Promise<void> {
    const tasks: Promise<void>[] = [];
    
    if (config?.printer) {
      tasks.push(
        this.printer.connect(config.printer)
          .catch((err) => console.error('Printer init failed:', err))
      );
    }
    
    if (config?.scale) {
      tasks.push(
        this.scale.connect(config.scale)
          .catch((err) => console.error('Scale init failed:', err))
      );
    }
    
    if (config?.scanner) {
      // 扫码枪不需要主动连接，只需开始监听
      this.scanner.startListening();
    }
    
    await Promise.allSettled(tasks);
    this.initialized = true;
    this.notifyListeners();
  }
  
  /** 获取所有设备状态 */
  getDevices(): Device[] {
    return [
      {
        id: 'printer',
        type: 'printer',
        name: '小票打印机',
        status: this.printer.isConnected() ? 'connected' : 'disconnected',
      },
      {
        id: 'scanner',
        type: 'scanner',
        name: '扫码枪',
        status: this.scanner.isListening() ? 'connected' : 'disconnected',
      },
      {
        id: 'cashbox',
        type: 'cashbox',
        name: '钱箱',
        status: this.cashbox.isConnected() ? 'connected' : 'disconnected',
      },
      {
        id: 'scale',
        type: 'scale',
        name: '电子秤',
        status: this.scale.isConnected() ? 'connected' : 'disconnected',
      },
    ];
  }
  
  /** 检查设备是否就绪 */
  isReady(): boolean {
    return this.initialized;
  }
  
  /** 绑定钱箱到打印机 */
  bindCashboxToPrinter(): void {
    this.cashbox.bindPrinter(this.printer);
  }
  
  /** 添加状态变化监听器 */
  addListener(callback: (devices: Device[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  /** 通知所有监听器 */
  private notifyListeners(): void {
    const devices = this.getDevices();
    this.listeners.forEach(callback => callback(devices));
  }
  
  /** 重置所有设备 */
  async reset(): Promise<void> {
    await Promise.allSettled([
      this.printer.disconnect(),
      this.scanner.stopListening(),
      this.cashbox.disconnect(),
      this.scale.disconnect(),
    ]);
    this.initialized = false;
    this.initPromise = null;
    this.notifyListeners();
  }
}

// 导出单例
export const hardwareService = HardwareServiceManager.getInstance();
export default hardwareService;
