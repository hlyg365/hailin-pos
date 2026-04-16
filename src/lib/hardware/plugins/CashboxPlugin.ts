/**
 * 钱箱插件 - CashboxPlugin
 * 提供钱箱控制功能
 * 支持通过打印机接口或USB直接控制钱箱
 */

// 钱箱状态
export type CashboxStatus = 'closed' | 'open' | 'error' | 'unknown';

// 钱箱事件类型
export type CashboxEventType = 'open' | 'close' | 'error';
export type CashboxEventCallback = (status: CashboxStatus, error?: Error) => void;

// 钱箱配置
export interface CashboxConfig {
  connectionType: 'printer' | 'usb' | 'serial';
  deviceId?: string;
  autoClose: boolean;
  autoCloseDelay: number; // 毫秒
}

// 钱箱插件类
class CashboxPlugin {
  private config: CashboxConfig;
  private status: CashboxStatus = 'closed';
  private isConnected: boolean = false;
  private printerPlugin: any = null; // 引用打印机插件
  private eventListeners: Map<CashboxEventType, Set<CashboxEventCallback>> = new Map();
  private static instance: CashboxPlugin;

  private constructor() {
    this.config = {
      connectionType: 'printer',
      autoClose: false,
      autoCloseDelay: 5000,
    };
    this.initEventListeners();
  }

  // 获取单例实例
  static getInstance(): CashboxPlugin {
    if (!CashboxPlugin.instance) {
      CashboxPlugin.instance = new CashboxPlugin();
    }
    return CashboxPlugin.instance;
  }

  // 初始化事件监听器
  private initEventListeners(): void {
    this.eventListeners.set('open', new Set());
    this.eventListeners.set('close', new Set());
    this.eventListeners.set('error', new Set());
  }

  // 添加事件监听
  on(event: CashboxEventType, callback: CashboxEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  // 移除事件监听
  off(event: CashboxEventType, callback: CashboxEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  // 触发事件
  private emit(event: CashboxEventType, error?: Error): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(this.status, error);
        } catch (e) {
          console.error(`Error in cashbox ${event} listener:`, e);
        }
      });
    }
  }

  // 设置状态
  private setStatus(status: CashboxStatus): void {
    this.status = status;
  }

  // 获取配置
  getConfig(): CashboxConfig {
    return { ...this.config };
  }

  // 设置配置
  setConfig(config: Partial<CashboxConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // 检查是否支持
  isSupported(): boolean {
    // 钱箱需要通过打印机或USB连接
    return true; // 始终支持（可通过打印机模拟）
  }

  // 获取状态
  getStatus(): CashboxStatus {
    return this.status;
  }

  // 是否就绪
  isReady(): boolean {
    return this.isConnected || this.config.connectionType === 'printer';
  }

  // 初始化
  async initialize(): Promise<boolean> {
    try {
      // 如果使用打印机模式，尝试连接打印机
      if (this.config.connectionType === 'printer') {
        // 尝试导入打印机插件
        try {
          const { printerPlugin } = await import('./PrinterPlugin');
          this.printerPlugin = printerPlugin;
          this.isConnected = true;
        } catch (e) {
          console.warn('Cashbox: Printer plugin not available, will use fallback');
        }
      }

      this.setStatus('closed');
      return true;
    } catch (error) {
      this.setStatus('error');
      this.emit('error', error as Error);
      return false;
    }
  }

  // 打开钱箱
  async open(): Promise<boolean> {
    try {
      console.log('Cashbox: Opening...');

      if (this.config.connectionType === 'printer' && this.printerPlugin) {
        // 通过打印机打开钱箱
        const result = await this.printerPlugin.openCashbox();
        
        if (result) {
          this.setStatus('open');
          this.emit('open');
          
          // 如果设置了自动关闭
          if (this.config.autoClose) {
            setTimeout(() => {
              this.close();
            }, this.config.autoCloseDelay);
          }
          
          return true;
        } else {
          throw new Error('Failed to send open command');
        }
      } else {
        // 模拟钱箱打开（开发环境）
        this.setStatus('open');
        this.emit('open');
        
        // 如果设置了自动关闭
        if (this.config.autoClose) {
          setTimeout(() => {
            this.close();
          }, this.config.autoCloseDelay);
        }
        
        return true;
      }
    } catch (error) {
      console.error('Cashbox: Failed to open', error);
      this.setStatus('error');
      this.emit('error', error as Error);
      return false;
    }
  }

  // 关闭钱箱
  async close(): Promise<void> {
    this.setStatus('closed');
    this.emit('close');
    console.log('Cashbox: Closed');
  }

  // 模拟钱箱状态检测
  // 实际钱箱通常没有状态检测功能，这里提供模拟
  async checkStatus(): Promise<CashboxStatus> {
    // 钱箱通常无法检测状态，这里返回最近的状态
    // 实际实现可能需要传感器或打印机状态查询
    return this.status;
  }

  // 发送钱箱打开脉冲（ESC/POS指令）
  // ESC p m t1 t2
  // m: 引脚选择 (0=引脚2, 1=引脚5)
  // t1 t2: 脉冲时间
  private getOpenPulseCommand(m: number = 0, t1: number = 25, t2: number = 250): Uint8Array {
    const ESC = 0x1B;
    return new Uint8Array([ESC, 0x70, m, t1, t2]);
  }

  // 通过USB直接控制（如果有USB钱箱）
  private async openViaUSB(): Promise<boolean> {
    if (!('usb' in navigator)) {
      return false;
    }

    try {
      const device = await (navigator as any).usb.requestDevice({
        filters: [
          // 常见钱箱相关的Vendor ID
          { vendorId: 0x04B8 }, // Epson
          { vendorId: 0x0483 }, // STMicroelectronics
        ]
      });

      if (!device) {
        return false;
      }

      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      // 发送钱箱打开脉冲
      const command = this.getOpenPulseCommand();
      await device.transferOut(1, command);
      
      await device.close();
      return true;
    } catch (error) {
      console.error('Cashbox: USB open failed', error);
      return false;
    }
  }

  // 通过串口控制（如果有串口钱箱）
  private async openViaSerial(): Promise<boolean> {
    if (!('serial' in navigator)) {
      return false;
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });

      // 发送钱箱打开脉冲
      const command = this.getOpenPulseCommand();
      const writer = port.writable.getWriter();
      await writer.write(command);
      writer.releaseLock();

      await port.close();
      return true;
    } catch (error) {
      console.error('Cashbox: Serial open failed', error);
      return false;
    }
  }

  // 获取钱箱事件日志
  getEventLog(): Array<{ time: number; event: CashboxEventType }> {
    // 实际应该维护一个事件日志
    return [];
  }
}

// 导出单例和类
export const cashboxPlugin = CashboxPlugin.getInstance();
export { CashboxPlugin };
