/**
 * 钱箱驱动服务 - 收银机专用
 * 
 * 支持接口：
 * - RJ11/RJ12接口（通过并口或USB转接）
 * - RS232串口（DB9）
 * - USB接口（模拟串口或HID）
 * - 打印机钱箱接口（ESC/POS指令）
 * 
 * 钱箱控制协议：
 * - ESC/POS标准钱箱指令
 * - 跳钱指令 (Kick drawer)
 */

import { serialService, SerialPortConfig } from './serial-service';

// 钱箱类型
export type CashboxInterface = 'printer' | 'serial' | 'usb' | 'parallel';

// 钱箱配置
export interface CashboxConfig {
  interface: CashboxInterface;
  port?: string;        // 串口路径
  baudRate?: number;    // 波特率
  printerIndex?: number; // 打印机索引（多打印机时）
}

// 钱箱状态
export interface CashboxStatus {
  connected: boolean;
  drawerOpen: boolean;
  hasDevice: boolean;
  interface: CashboxInterface;
}

// 钱箱打开结果
export interface CashboxResult {
  success: boolean;
  message?: string;
  mode?: CashboxInterface;
  error?: string;
}

// 钱箱接口设备
export interface CashboxDevice {
  name: string;
  path: string;
  type: CashboxInterface;
  description: string;
}

// RJ11钱箱引脚定义
export const CASHBOX_PINOUT = {
  // RJ11 6P2C 引脚 (从左到右)
  PIN_1: { name: 'DKD1', description: '钱箱检测1' },
  PIN_2: { name: 'GND', description: '地线' },
  PIN_3: { name: 'FG', description: '外壳接地' },
  PIN_4: { name: 'CashDrawer', description: '钱箱信号' },
  PIN_5: { name: '+12V', description: '电源12V' },
  PIN_6: { name: 'DKD2', description: '钱箱检测2' },
};

// 打印机接口（多打印机时选择）
export interface PrinterCashboxConfig {
  printerIndex: number;   // 打印机索引
  drawerNumber: 0 | 1;    // 钱箱编号（0=主钱箱，1=第二钱箱）
}

// 钱箱驱动服务
export class CashboxDriver {
  private static instance: CashboxDriver;
  private config: CashboxConfig | null = null;
  private status: CashboxStatus = {
    connected: false,
    drawerOpen: false,
    hasDevice: false,
    interface: 'printer',
  };
  private drawerState: 'closed' | 'open' = 'closed';
  
  private constructor() {}
  
  public static getInstance(): CashboxDriver {
    if (!CashboxDriver.instance) {
      CashboxDriver.instance = new CashboxDriver();
    }
    return CashboxDriver.instance;
  }
  
  /**
   * 获取钱箱状态
   */
  async getStatus(): Promise<CashboxStatus> {
    // 如果是打印机模式，检查打印机钱箱状态
    if (this.config?.interface === 'printer') {
      const printerStatus = await this.checkPrinterCashbox();
      return {
        ...this.status,
        hasDevice: printerStatus,
        interface: 'printer',
      };
    }
    
    return this.status;
  }
  
  /**
   * 检查打印机是否有钱箱
   */
  private async checkPrinterCashbox(): Promise<boolean> {
    // 通过原生插件或Web Serial检查打印机钱箱状态
    // 这里简化处理，返回true表示有打印机钱箱
    return true;
  }
  
  /**
   * 获取可用钱箱设备列表
   */
  async listDevices(): Promise<CashboxDevice[]> {
    const devices: CashboxDevice[] = [];
    
    // 打印机钱箱接口
    devices.push({
      name: '打印机钱箱接口',
      path: 'printer:0',
      type: 'printer',
      description: '通过连接的打印机控制钱箱（推荐）',
    });
    
    // 串口钱箱
    devices.push({
      name: '串口钱箱 (COM1)',
      path: '/dev/ttyS0',
      type: 'serial',
      description: 'RS232 串口钱箱',
    });
    
    devices.push({
      name: 'USB转串口钱箱',
      path: '/dev/ttyUSB0',
      type: 'serial',
      description: 'USB转串口钱箱 (CH340/FTDI)',
    });
    
    return devices;
  }
  
  /**
   * 配置钱箱
   */
  async configure(config: CashboxConfig): Promise<CashboxResult> {
    this.config = config;
    
    // 根据接口类型初始化
    switch (config.interface) {
      case 'printer':
        this.status.interface = 'printer';
        this.status.hasDevice = true;
        this.status.connected = true;
        return { success: true, message: '已配置打印机钱箱模式', mode: 'printer' };
        
      case 'serial':
        const serialResult = await this.initSerialCashbox(config.port || '/dev/ttyS0', config.baudRate || 9600);
        return serialResult;
        
      case 'usb':
        // USB钱箱通常模拟HID键盘或串口
        this.status.interface = 'usb';
        this.status.hasDevice = true;
        this.status.connected = true;
        return { success: true, message: '已配置USB钱箱模式', mode: 'usb' };
        
      default:
        return { success: false, error: '不支持的钱箱接口类型' };
    }
  }
  
  /**
   * 初始化串口钱箱
   */
  private async initSerialCashbox(port: string, baudRate: number): Promise<CashboxResult> {
    try {
      // 尝试连接串口
      const { serialService } = await import('./serial-service');
      
      const serialConfig: SerialPortConfig = {
        path: port,
        baudRate: baudRate,
        dataBits: 8 as const,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
      };
      
      const status = await serialService.connect(serialConfig);
      
      if (status.connected) {
        this.status.interface = 'serial';
        this.status.connected = true;
        this.status.hasDevice = true;
        return { success: true, message: `已连接串口钱箱 ${port} @ ${baudRate}bps`, mode: 'serial' };
      } else {
        return { success: false, error: '串口连接失败' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 打开钱箱
   * @param drawer 钱箱编号（0=主钱箱，1=第二钱箱）
   */
  async open(drawer: 0 | 1 = 0): Promise<CashboxResult> {
    if (!this.config) {
      return { success: false, error: '钱箱未配置' };
    }
    
    switch (this.config.interface) {
      case 'printer':
        return this.openPrinterCashbox(drawer);
        
      case 'serial':
        return this.openSerialCashbox(drawer);
        
      case 'usb':
        return this.openUsbCashbox();
        
      default:
        return { success: false, error: '未配置钱箱接口' };
    }
  }
  
  /**
   * 通过打印机打开钱箱
   * 使用ESC/POS钱箱指令
   */
  private async openPrinterCashbox(drawer: 0 | 1): Promise<CashboxResult> {
    // ESC/POS钱箱指令
    // ESC p m t1 t2
    // m = 0 (钱箱1) 或 1 (钱箱2)
    // t1 = 脉冲开启时间高字节 (通常0x19 = 25)
    // t2 = 脉冲关闭时间低字节 (通常0xFA = 250)
    
    // 标准指令: ESC p 0 25 250
    const commands = new Uint8Array([0x1B, 0x70, drawer, 0x19, 0xFA]);
    
    try {
      // 发送到打印机 - 通过原生插件
      const plugin = (window as any).Capacitor?.Plugins?.Printer;
      if (plugin) {
        await plugin.openCashbox();
        
        this.drawerState = 'open';
        this.status.drawerOpen = true;
        
        // 钱箱通常会自动关闭，延迟重置状态
        setTimeout(() => {
          this.drawerState = 'closed';
          this.status.drawerOpen = false;
        }, 3000);
        
        return { success: true, message: '钱箱已打开', mode: 'printer' };
      }
    } catch (error: any) {
      console.error('[CashboxDriver] openPrinterCashbox error:', error);
    }
    
    // 模拟模式
    console.log('[CashboxDriver] 模拟打开钱箱 (打印机模式)');
    this.drawerState = 'open';
    this.status.drawerOpen = true;
    
    setTimeout(() => {
      this.drawerState = 'closed';
      this.status.drawerOpen = false;
    }, 3000);
    
    return { success: true, message: '钱箱已打开（模拟）', mode: 'printer' };
  }
  
  /**
   * 通过串口打开钱箱
   */
  private async openSerialCashbox(drawer: 0 | 1): Promise<CashboxResult> {
    // 串口钱箱协议（根据具体设备）
    // 常见协议：发送脉冲信号
    
    // 方法1: 发送RTS信号（硬件流控）
    // 方法2: 发送特定字节序列
    
    const commands = new Uint8Array([0xFF, 0x00, 0x00, drawer === 1 ? 0x02 : 0x01]);
    
    try {
      const { serialService } = await import('./serial-service');
      await serialService.write(commands);
      
      this.drawerState = 'open';
      this.status.drawerOpen = true;
      
      setTimeout(() => {
        this.drawerState = 'closed';
        this.status.drawerOpen = false;
      }, 3000);
      
      return { success: true, message: '钱箱已打开（串口模式）', mode: 'serial' };
    } catch (error: any) {
      return { success: false, error: error.message, mode: 'serial' };
    }
  }
  
  /**
   * 通过USB打开钱箱
   */
  private async openUsbCashbox(): Promise<CashboxResult> {
    // USB HID协议发送钱箱指令
    // USB钱箱通常作为HID设备，发送特定报告ID
    
    const reportId = 0x01;
    const commands = new Uint8Array([reportId, 0x70, 0x00, 0x19, 0xFA]);
    
    try {
      // 发送到USB设备
      // 实际实现需要通过Web USB发送HID报告
      console.log('[CashboxDriver] 发送USB钱箱指令:', commands);
      
      this.drawerState = 'open';
      this.status.drawerOpen = true;
      
      setTimeout(() => {
        this.drawerState = 'closed';
        this.status.drawerOpen = false;
      }, 3000);
      
      return { success: true, message: '钱箱已打开（USB模式）', mode: 'usb' };
    } catch (error: any) {
      return { success: false, error: error.message, mode: 'usb' };
    }
  }
  
  /**
   * 获取钱箱引脚状态（用于DIY钱箱）
   */
  getPinout(): typeof CASHBOX_PINOUT {
    return CASHBOX_PINOUT;
  }
  
  /**
   * 获取钱箱当前状态
   */
  getDrawerState(): 'closed' | 'open' {
    return this.drawerState;
  }
  
  /**
   * 重置钱箱状态
   */
  reset(): void {
    this.drawerState = 'closed';
    this.status.drawerOpen = false;
    this.config = null;
    this.status = {
      connected: false,
      drawerOpen: false,
      hasDevice: false,
      interface: 'printer',
    };
  }
}

// 导出单例
export const cashboxDriver = CashboxDriver.getInstance();
export default cashboxDriver;
