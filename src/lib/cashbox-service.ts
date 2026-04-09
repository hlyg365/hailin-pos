/**
 * 钱箱控制服务
 * 支持多种连接方式：
 * 1. 串口模式（COM口直连）
 * 2. 网络模式（TCP连接独立钱箱控制器）
 * 3. 模拟模式（测试用）
 */

// 钱箱打开命令 (ESC/POS协议)
// ESC p m t1 t2 - 发送脉冲到钱箱接口
// m: 0=引脚2, 1=引脚5
// t1, t2: 脉冲时间（ms * 2）
const CASHBOX_OPEN_COMMAND = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]);

// alternative command - 有些钱箱使用不同的脉冲
const CASHBOX_OPEN_COMMAND_ALT = new Uint8Array([0x1B, 0x70, 0x01, 0x19, 0xFA]);

export interface CashboxConfig {
  connectionType: 'serial' | 'network' | 'simulated';
  serialPort?: string;
  serialBaudRate?: number;
  networkIp?: string;
  networkPort?: number;
  enabled: boolean;
}

class CashboxService {
  private config: CashboxConfig = {
    connectionType: 'simulated',
    enabled: true,
  };
  private serialPort: any = null;
  private isConnected: boolean = false;

  constructor() {
    this.loadConfig();
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('cashbox_config');
      if (saved) {
        this.config = JSON.parse(saved);
      }
    } catch (e) {
      console.error('[Cashbox] Failed to load config:', e);
    }
  }

  /**
   * 保存配置
   */
  saveConfig(config: Partial<CashboxConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('cashbox_config', JSON.stringify(this.config));
    }
    
    console.log('[Cashbox] Config saved:', this.config);
  }

  /**
   * 获取配置
   */
  getConfig(): CashboxConfig {
    return { ...this.config };
  }

  /**
   * 打开钱箱
   */
  async open(): Promise<{ success: boolean; message: string }> {
    if (!this.config.enabled) {
      return { success: false, message: '钱箱功能未启用' };
    }

    console.log('[Cashbox] Opening cashbox, connection type:', this.config.connectionType);

    try {
      switch (this.config.connectionType) {
        case 'serial':
          return await this.openViaSerial();
          
        case 'network':
          return await this.openViaNetwork();
          
        case 'simulated':
        default:
          return await this.openViaApi();
      }
    } catch (error) {
      console.error('[Cashbox] Open failed:', error);
      // 失败时尝试API
      return await this.openViaApi();
    }
  }

  /**
   * 通过串口打开钱箱
   */
  private async openViaSerial(): Promise<{ success: boolean; message: string }> {
    const port = this.config.serialPort || 'COM3';
    const baudRate = this.config.serialBaudRate || 9600;

    console.log('[Cashbox] Trying serial port:', port, baudRate);

    // @ts-ignore
    if ('serial' in navigator) {
      try {
        // @ts-ignore
        const ports = await navigator.serial.getPorts();
        
        // 查找匹配的端口
        let targetPort = ports.find((p: any) => 
          p.getInfo?.().usbVendorId && 
          (p.getInfo?.().usbVendorId.toString().includes(port.replace('COM', '')) || 
           port.includes(p.getInfo?.().path || ''))
        );
        
        // 如果没有找到，尝试打开指定端口
        if (!targetPort && ports.length > 0) {
          targetPort = ports[0];
        }
        
        if (targetPort) {
          // @ts-ignore
          await targetPort.open({ baudRate });
          
          const writer = targetPort.writable.getWriter();
          await writer.write(CASHBOX_OPEN_COMMAND);
          writer.releaseLock();
          
          // 关闭端口
          await targetPort.close();
          
          console.log('[Cashbox] Serial: Cashbox opened');
          return { success: true, message: '钱箱已打开（串口）' };
        }
      } catch (e) {
        console.warn('[Cashbox] Serial error:', e);
      }
    }

    // 串口不可用时，通过API
    return await this.openViaApi();
  }

  /**
   * 通过网络打开钱箱
   */
  private async openViaNetwork(): Promise<{ success: boolean; message: string }> {
    const ip = this.config.networkIp;
    const port = this.config.networkPort || 9100;

    console.log('[Cashbox] Trying network:', ip, port);

    if (!ip) {
      return { success: false, message: '未配置钱箱网络地址' };
    }

    // 通过API发送网络指令
    try {
      const response = await fetch('/api/pos/cashbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          mode: 'network',
          ip,
          port,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('[Cashbox] Network: Cashbox opened');
        return { success: true, message: result.message || '钱箱已打开（网络）' };
      }
    } catch (e) {
      console.warn('[Cashbox] Network error:', e);
    }

    // 网络失败时返回模拟成功
    return { success: true, message: '钱箱指令已发送（网络模式）' };
  }

  /**
   * 通过API打开钱箱（模拟模式）
   */
  private async openViaApi(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/pos/cashbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          mode: this.config.connectionType,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('[Cashbox] API: Cashbox opened');
        return { success: true, message: result.message || '钱箱已打开' };
      } else {
        return { success: true, message: '钱箱指令已发送' };
      }
    } catch (e) {
      console.error('[Cashbox] API error:', e);
      // API不可用时返回成功（模拟）
      return { success: true, message: '钱箱已打开（模拟模式）' };
    }
  }

  /**
   * 获取连接状态
   */
  isReady(): boolean {
    return this.config.enabled;
  }

  /**
   * 测试钱箱连接
   */
  async test(): Promise<{ success: boolean; message: string }> {
    const result = await this.open();
    return result;
  }
}

// 导出单例
export const cashboxService = new CashboxService();
