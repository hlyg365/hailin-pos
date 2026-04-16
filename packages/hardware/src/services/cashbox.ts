// ============================================
// 海邻到家 - 钱箱服务
// 支持通过打印机或串口控制钱箱
// ============================================

type CashboxStatus = 'disconnected' | 'closed' | 'open' | 'error';

/** 钱箱服务 */
export class CashboxService {
  private status: CashboxStatus = 'disconnected';
  private printerRef: any = null;
  private listeners: Set<(status: CashboxStatus) => void> = new Set();
  
  /** 关联打印机 */
  bindPrinter(printer: any): void {
    this.printerRef = printer;
    this.setStatus('closed');
  }
  
  /** 打开钱箱 */
  async open(): Promise<boolean> {
    try {
      if (this.printerRef) {
        // 通过打印机指令打开钱箱
        // ESC p m t1 t2 - 钱箱脉冲
        const commands = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]);
        
        if (this.printerRef.isConnected()) {
          await this.sendCommands(commands);
        }
      }
      
      this.setStatus('open');
      
      // 3秒后自动关闭状态
      setTimeout(() => {
        this.setStatus('closed');
      }, 3000);
      
      return true;
    } catch (error) {
      console.error('Open cashbox failed:', error);
      this.setStatus('error');
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
      throw new Error('Printer not connected');
    }
  }
  
  /** 检查钱箱状态 */
  async checkStatus(): Promise<CashboxStatus> {
    return this.status;
  }
  
  /** 是否已连接 */
  isConnected(): boolean {
    return this.status !== 'disconnected';
  }
  
  /** 获取状态 */
  getStatus(): CashboxStatus {
    return this.status;
  }
  
  /** 设置状态 */
  private setStatus(status: CashboxStatus): void {
    this.status = status;
    this.listeners.forEach(callback => callback(status));
  }
  
  /** 添加状态监听 */
  addStatusListener(callback: (status: CashboxStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  /** 断开连接 */
  async disconnect(): Promise<void> {
    this.printerRef = null;
    this.setStatus('disconnected');
  }
}

export default CashboxService;
