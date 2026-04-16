// ============================================
// 海邻到家 - 钱箱服务
// 支持通过打印机或串口控制钱箱
// ============================================

import type { Device } from '@hailin/core';

/** 钱箱状态 */
type CashboxStatus = 'disconnected' | 'closed' | 'open' | 'error';

/** 钱箱服务 */
export class CashboxService {
  private status: CashboxStatus = 'disconnected';
  private printerRef: any = null;
  
  /** 关联打印机 */
  setPrinter(printer: any): void {
    this.printerRef = printer;
    this.status = 'closed';
  }
  
  /** 打开钱箱 */
  async open(): Promise<boolean> {
    try {
      if (this.printerRef) {
        // 通过打印机指令打开钱箱
        // ESC p m t1 t2 - 钱箱脉冲
        const commands = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]);
        
        // 通过打印机发送指令
        // 这里需要根据实际打印机实现
        await this.sendCommands(commands);
      }
      
      this.status = 'open';
      
      // 3秒后自动关闭状态（实际钱箱已打开）
      setTimeout(() => {
        this.status = 'closed';
      }, 3000);
      
      return true;
    } catch (error) {
      console.error('Open cashbox failed:', error);
      this.status = 'error';
      return false;
    }
  }
  
  /** 发送指令 */
  private async sendCommands(commands: Uint8Array): Promise<void> {
    if (this.printerRef?.device?.writable) {
      const writer = this.printerRef.device.writable.getWriter();
      await writer.write(commands);
      writer.releaseLock();
    } else if (this.printerRef?.device?.characteristic) {
      await this.printerRef.device.characteristic.writeValue(commands);
    } else {
      throw new Error('打印机未连接');
    }
  }
  
  /** 检查钱箱状态 */
  async checkStatus(): Promise<CashboxStatus> {
    // 实际钱箱状态需要硬件支持
    // 这里返回内存中的状态
    return this.status;
  }
  
  /** 获取状态 */
  getStatus(): Device['status'] {
    return this.status as Device['status'];
  }
  
  /** 断开连接 */
  async disconnect(): Promise<void> {
    this.printerRef = null;
    this.status = 'disconnected';
  }
}

export default CashboxService;
