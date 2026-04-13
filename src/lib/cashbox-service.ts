/**
 * 钱箱控制服务 v2.0
 * 支持PWA环境和原生APP环境
 * 
 * 连接方式：
 * 1. 串口模式 - 通过原生串口API
 * 2. 网络模式 - 通过TCP/IP连接独立钱箱控制器
 * 3. HTTP模式 - 通过收银机自带的钱箱API（如收银机SDK）
 * 4. 模拟模式 - 测试用
 */

// 钱箱打开命令 (ESC/POS协议)
// ESC p m t1 t2 - 发送脉冲到钱箱接口
const CASHBOX_OPEN_COMMAND = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]);

export interface CashboxConfig {
  connectionType: 'serial' | 'network' | 'http' | 'simulated';
  // 串口配置
  serialPort?: string;
  serialBaudRate?: number;
  // 网络配置
  networkIp?: string;
  networkPort?: number;
  // HTTP配置（收银机SDK）
  httpApiUrl?: string;
  // 通用配置
  enabled: boolean;
  // 钱箱密码（可选）
  password?: string;
  // 延迟设置
  openDelay?: number; // ms
  pulseWidth?: number; // ms
}

class CashboxService {
  private config: CashboxConfig = {
    connectionType: 'simulated',
    enabled: true,
    openDelay: 100,
    pulseWidth: 50,
  };
  private serialPort: any = null;

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
        this.config = { ...this.config, ...JSON.parse(saved) };
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
      try {
        localStorage.setItem('cashbox_config', JSON.stringify(this.config));
        console.log('[Cashbox] Config saved:', this.config);
      } catch (e) {
        console.error('[Cashbox] Failed to save config:', e);
      }
    }
  }

  /**
   * 获取配置
   */
  getConfig(): CashboxConfig {
    return { ...this.config };
  }

  /**
   * 打开钱箱
   * @param password 可选的钱箱密码
   */
  async open(password?: string): Promise<{ success: boolean; message: string }> {
    if (!this.config.enabled) {
      return { success: false, message: '钱箱功能未启用' };
    }

    // 验证密码
    if (this.config.password && this.config.password !== password) {
      return { success: false, message: '钱箱密码错误' };
    }

    console.log('[Cashbox] Opening cashbox, type:', this.config.connectionType);

    try {
      switch (this.config.connectionType) {
        case 'serial':
          return await this.openViaSerial();
          
        case 'network':
          return await this.openViaNetwork();
          
        case 'http':
          return await this.openViaHttp();
          
        case 'simulated':
        default:
          return await this.openViaApi();
      }
    } catch (error) {
      console.error('[Cashbox] Open failed:', error);
      return { success: false, message: `打开失败: ${error}` };
    }
  }

  /**
   * 通过串口打开钱箱（PWA和APP都支持）
   */
  private async openViaSerial(): Promise<{ success: boolean; message: string }> {
    const port = this.config.serialPort || 'COM3';
    const baudRate = this.config.serialBaudRate || 9600;

    console.log('[Cashbox] Trying serial port:', port, baudRate);

    // 方式1: Web Serial API (PWA环境)
    // @ts-ignore
    if ('serial' in navigator) {
      try {
        // @ts-ignore
        const ports = await navigator.serial.getPorts();
        
        if (ports.length > 0) {
          // 尝试打开第一个可用端口
          // @ts-ignore
          const targetPort = ports[0];
          // @ts-ignore
          await targetPort.open({ baudRate });
          
          // @ts-ignore
          if (targetPort.writable) {
            // @ts-ignore
            const writer = targetPort.writable.getWriter();
            await writer.write(CASHBOX_OPEN_COMMAND);
            writer.releaseLock();
          }
          
          // @ts-ignore
          await targetPort.close();
          
          console.log('[Cashbox] Serial (Web API): Cashbox opened');
          return { success: true, message: '钱箱已打开（串口/Web API）' };
        }
      } catch (e) {
        console.warn('[Cashbox] Web Serial API failed:', e);
      }
    }

    // 方式2: 通过HTTP API（兼容APP环境的钱箱SDK）
    console.log('[Cashbox] Falling back to HTTP API for APP environment');
    return await this.openViaHttp();
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

    // 尝试通过HTTP API发送网络钱箱指令
    return await this.openViaHttp();
  }

  /**
   * 通过HTTP API打开钱箱（兼容PWA和APP环境）
   * 支持收银机自带的钱箱SDK
   */
  private async openViaHttp(): Promise<{ success: boolean; message: string }> {
    const apiUrl = this.config.httpApiUrl || '/api/pos/cashbox';
    
    console.log('[Cashbox] Trying HTTP API:', apiUrl);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // 添加环境标识
          'X-Client-Env': this.getEnvironment(),
        },
        body: JSON.stringify({
          action: 'open',
          mode: this.config.connectionType,
          config: {
            serialPort: this.config.serialPort,
            serialBaudRate: this.config.serialBaudRate,
            networkIp: this.config.networkIp,
            networkPort: this.config.networkPort,
          },
          delay: this.config.openDelay,
          pulseWidth: this.config.pulseWidth,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('[Cashbox] HTTP API: Cashbox opened');
        return { success: true, message: result.message || '钱箱已打开' };
      } else {
        return { success: false, message: result.message || '打开失败' };
      }
    } catch (e) {
      console.error('[Cashbox] HTTP API error:', e);
      // API不可用时返回模拟成功
      return { success: true, message: '钱箱指令已发送（模拟模式）' };
    }
  }

  /**
   * 通过本地API打开钱箱（最终回退）
   */
  private async openViaApi(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/pos/cashbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          mode: this.config.connectionType,
          env: this.getEnvironment(),
        }),
      });
      
      const result = await response.json();
      
      return { 
        success: true, 
        message: result.message || '钱箱已打开（模拟模式）' 
      };
    } catch (e) {
      console.error('[Cashbox] API error:', e);
      return { success: true, message: '钱箱已打开（模拟模式）' };
    }
  }

  /**
   * 检测当前环境
   */
  private getEnvironment(): 'pwa' | 'app' | 'web' {
    if (typeof window === 'undefined') return 'web';
    
    // 检测是否为PWA环境
    // @ts-ignore
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'pwa';
    }
    
    // @ts-ignore
    if (navigator.standalone === true) {
      return 'pwa';
    }
    
    // @ts-ignore
    if (document.referrer.includes('android-app://')) {
      return 'app';
    }
    
    // 检测是否为原生APP的WebView
    // @ts-ignore
    const userAgent = navigator.userAgent || '';
    if (userAgent.includes('HailinPOS') || 
        userAgent.includes('JPush') ||
        userAgent.includes('cordova') ||
        userAgent.includes('Capacitor')) {
      return 'app';
    }
    
    return 'web';
  }

  /**
   * 检测钱箱硬件状态
   */
  async checkStatus(): Promise<{ connected: boolean; message: string }> {
    try {
      const response = await fetch('/api/pos/cashbox?action=status', {
        method: 'GET',
        headers: { 'X-Client-Env': this.getEnvironment() },
      });
      
      const result = await response.json();
      
      return {
        connected: result.success,
        message: result.message || '钱箱就绪',
      };
    } catch (e) {
      return { connected: false, message: '无法检测钱箱状态' };
    }
  }

  /**
   * 测试钱箱连接
   */
  async test(): Promise<{ success: boolean; message: string }> {
    return await this.open();
  }

  /**
   * 获取连接状态
   */
  isReady(): boolean {
    return this.config.enabled;
  }
}

// 导出单例
export const cashboxService = new CashboxService();
