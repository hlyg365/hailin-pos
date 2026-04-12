/**
 * 原生钱箱服务
 * 
 * 支持的钱箱连接方式：
 * 1. RJ11/RJ12 接口（通过USB转串口或RS232）
 * 2. USB接口钱箱
 * 3. 打印机钱箱接口（通过打印机控制）
 * 
 * 使用方法:
 * import { CashboxService } from '@/lib/native/cashbox-service';
 * const result = await CashboxService.open();
 */

// 延迟加载 Capacitor
let Capacitor: any = null;
function getCapacitor() {
  if (Capacitor === null && typeof window !== 'undefined') {
    Capacitor = (window as any).Capacitor;
  }
  return Capacitor;
}

// 获取原生插件
function getCashboxPlugin(): any | null {
  const cap = getCapacitor();
  if (cap && cap.Plugins && cap.Plugins.Cashbox) {
    return cap.Plugins.Cashbox;
  }
  return null;
}

// 类型定义
export interface CashboxDevice {
  name: string;
  path: string;
  type: 'usb' | 'serial' | 'printer';
  interface: string;
  description: string;
  vendorId?: number;
  productId?: number;
}

export interface CashboxStatus {
  connected: boolean;
  drawerOpen: boolean;
  hasDevice: boolean;
}

export interface CashboxResult {
  success: boolean;
  message?: string;
  mode?: 'usb' | 'serial' | 'printer' | 'simulation';
  error?: string;
}

// 钱箱服务
export const CashboxService = {
  /**
   * 获取钱箱状态
   */
  async getStatus(): Promise<CashboxStatus> {
    const plugin = getCashboxPlugin();
    
    if (plugin) {
      try {
        const result = await plugin.getStatus();
        return {
          connected: result.connected || false,
          drawerOpen: result.drawerOpen || false,
          hasDevice: result.hasDevice || false,
        };
      } catch (e) {
        console.error('[CashboxService] getStatus error:', e);
      }
    }
    
    return {
      connected: false,
      drawerOpen: false,
      hasDevice: false,
    };
  },

  /**
   * 列出可用的钱箱设备
   */
  async listDevices(): Promise<CashboxDevice[]> {
    const plugin = getCashboxPlugin();
    
    if (plugin) {
      try {
        const result = await plugin.listDevices();
        if (result.success) {
          return result.devices || [];
        }
      } catch (e) {
        console.error('[CashboxService] listDevices error:', e);
      }
    }
    
    // 返回默认选项
    return [
      {
        name: '打印机钱箱接口',
        path: 'printer',
        type: 'printer',
        interface: 'ESC/POS',
        description: '通过连接的打印机控制钱箱',
      },
    ];
  },

  /**
   * 连接钱箱设备
   * @param port 设备路径或类型 ('printer', '/dev/ttyUSB0', 'usb://vid:pid')
   * @param baudRate 波特率（串口模式）
   */
  async connect(port: string = 'printer', baudRate: number = 9600): Promise<CashboxResult> {
    const plugin = getCashboxPlugin();
    
    if (plugin) {
      try {
        const result = await plugin.connect({ port, baudRate });
        return result;
      } catch (e: any) {
        console.error('[CashboxService] connect error:', e);
        return { success: false, error: e.message };
      }
    }
    
    // 非原生环境，模拟连接
    console.log('[CashboxService] Running in browser, simulating connection');
    return { success: true, message: '模拟连接成功', mode: 'simulation' };
  },

  /**
   * 打开钱箱
   * @param drawer 钱箱编号 (0=引脚2, 1=引脚5, 2=钱箱1, 3=钱箱2)
   */
  async open(drawer: number = 0): Promise<CashboxResult> {
    const plugin = getCashboxPlugin();
    
    if (plugin) {
      try {
        const result = await plugin.open({ drawer });
        return result;
      } catch (e: any) {
        console.error('[CashboxService] open error:', e);
        return { success: false, error: e.message };
      }
    }
    
    // 非原生环境，模拟打开
    console.log('[CashboxService] Running in browser, simulating open');
    return { success: true, message: '钱箱已打开（模拟）', mode: 'simulation' };
  },

  /**
   * 断开钱箱连接
   */
  async disconnect(): Promise<CashboxResult> {
    const plugin = getCashboxPlugin();
    
    if (plugin) {
      try {
        const result = await plugin.disconnect();
        return result;
      } catch (e: any) {
        console.error('[CashboxService] disconnect error:', e);
        return { success: false, error: e.message };
      }
    }
    
    return { success: true, message: '已断开' };
  },

  /**
   * 获取支持的波特率
   */
  async getBaudRates(): Promise<number[]> {
    const plugin = getCashboxPlugin();
    
    if (plugin) {
      try {
        const result = await plugin.getBaudRates();
        if (result.success) {
          return result.baudRates || [9600];
        }
      } catch (e) {
        console.error('[CashboxService] getBaudRates error:', e);
      }
    }
    
    // 默认波特率
    return [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];
  },
};

export default CashboxService;
