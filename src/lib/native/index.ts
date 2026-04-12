/**
 * 硬件统一调用层
 * 
 * 根据运行环境自动选择：
 * - 原生APP：直接调用Capacitor插件
 * - PWA/Web：通过API代理调用（模拟模式）
 */

// 延迟加载 Capacitor，避免 SSR 时出错
let Capacitor: any = null;

function getCapacitor() {
  if (Capacitor === null && typeof window !== 'undefined') {
    Capacitor = (window as any).Capacitor;
  }
  return Capacitor;
}

// 类型定义
export interface ScaleDevice {
  name: string;
  address: string;
  vendorId?: number;
  productId?: number;
  productName?: string;
}

export interface SerialPort {
  path: string;
  name: string;
  type: string;
  description: string;
  readable?: boolean;
  writable?: boolean;
}

export interface UsbDevice {
  name: string;
  vendorId: number;
  productId: number;
  deviceId: number;
  productName: string;
  path: string;
  deviceType?: string;
}

export interface ScaleProtocol {
  code: string;
  name: string;
  description: string;
}

export interface WeightData {
  weight: number;
  unit: string;
  stable: boolean;
  timestamp: number;
  protocol?: string;
}

// 常用波特率
export const BAUD_RATES = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];

// 支持的电子秤协议
export const SCALE_PROTOCOLS: ScaleProtocol[] = [
  { code: 'AUTO', name: '自动检测', description: '自动检测电子秤协议' },
  { code: 'OS2', name: '顶尖OS2', description: '顶尖OS2协议，最常用' },
  { code: 'OS3', name: '顶尖OS3', description: '顶尖OS3协议' },
  { code: 'TAILING', name: '顶尖通用', description: '顶尖通用协议' },
  { code: 'DAHUA', name: '大华', description: '大华电子秤协议' },
  { code: 'DIBO', name: '迪宝', description: '迪宝电子秤协议' },
  { code: 'METTLER', name: '托利多', description: '梅特勒-托利多电子秤协议' },
  { code: 'ZHIGANG', name: '志功', description: '志功电子秤协议' },
  { code: 'YAZHI', name: '雅斯科', description: '雅斯科电子秤协议' },
  { code: 'LAND', name: '兰德', description: '兰德电子秤协议' },
];

export interface PrinterDevice {
  name: string;
  address: string;
  type: string;
  paired: boolean;
}

export interface ReceiptData {
  shopName?: string;
  orderNo?: string;
  date?: string;
  cashier?: string;
  items: Array<{ name: string; quantity: string; price: string }>;
  total: number;
  discount?: number;
  payment: number;
  change: number;
}

// 原生插件接口
interface ScalePlugin {
  listDevices(): Promise<{ success: boolean; devices?: ScaleDevice[] }>;
  listSerialPorts(): Promise<{
    success: boolean;
    serialPorts?: SerialPort[];
    usbDevices?: UsbDevice[];
    baudRates?: number[];
    scannedPorts?: string[];
  }>;
  getProtocols(): Promise<{
    success: boolean;
    protocols?: string[];
    descriptions?: string[];
    default?: string;
  }>;
  getBaudRates(): Promise<{ success: boolean; baudRates?: number[]; commonConfigs?: any }>;
  connect(config: {
    port?: string;
    baudRate?: number;
    protocol?: string;
    dataBits?: number;
    stopBits?: number;
    parity?: string;
  }): Promise<{
    success: boolean;
    mode?: string;
    port?: string;
    baudRate?: number;
    protocol?: string;
    detectedBaudRate?: number;
    message?: string;
    tip?: string;
  }>;
  disconnect(): Promise<void>;
  getWeight(): Promise<{
    success: boolean;
    weight?: number;
    unit?: string;
    stable?: boolean;
    protocol?: string;
  }>;
  getStatus(): Promise<{
    connected: boolean;
    polling?: boolean;
    mode?: string;
    protocol?: string;
    available?: boolean;
    baudRate?: number;
    name?: string;
    deviceName?: string;
    address?: string;
    device?: string;
  }>;
  openCashbox(): Promise<{ success: boolean; message?: string }>;
  getCashboxStatus(): Promise<{ success: boolean; open?: boolean; connected?: boolean; hasCashDrawer?: boolean }>;
}

interface PrinterPlugin {
  listDevices(): Promise<{ success: boolean; devices?: PrinterDevice[] }>;
  connect(config: { address: string; name?: string }): Promise<{ success: boolean }>;
  disconnect(): Promise<void>;
  printReceipt(data: ReceiptData): Promise<{ success: boolean }>;
  openCashbox(): Promise<{ success: boolean }>;
  getStatus(): Promise<{ connected: boolean; address?: string; printerName?: string; name?: string }>;
}

interface DualScreenPlugin {
  getDisplays(): Promise<{ success: boolean; displays?: any[] }>;
  open(config: { displayId?: number; url?: string }): Promise<{ success: boolean }>;
  close(): Promise<void>;
  sendData(data: any): Promise<{ success: boolean }>;
  getStatus(): Promise<{ isOpen: boolean }>;
}

interface AppUpdatePlugin {
  checkUpdate(): Promise<{ hasUpdate: boolean; latestVersion?: string }>;
  downloadAndInstall(): Promise<{ success: boolean; message?: string }>;
}

interface CashboxPlugin {
  getStatus(): Promise<{ 
    connected: boolean; 
    drawerOpen?: boolean; 
    hasDevice?: boolean;
    address?: string;
    deviceName?: string;
    interface?: string;
    mode?: string;
  }>;
  listDevices(): Promise<{ success: boolean; devices?: any[] }>;
  connect(config: { port?: string; baudRate?: number }): Promise<{ success: boolean; mode?: string; message?: string }>;
  open(config: { drawer?: number }): Promise<{ success: boolean; drawerOpen?: boolean; mode?: string; message?: string }>;
  disconnect(): Promise<{ success: boolean }>;
  getBaudRates(): Promise<{ success: boolean; baudRates?: number[] }>;
}

// 获取原生插件（如果存在）
function getScalePlugin(): ScalePlugin | null {
  if (typeof window === 'undefined') return null;
  const cap = (window as any).Capacitor;
  if (cap && cap.Plugins && cap.Plugins.Scale) {
    return cap.Plugins.Scale;
  }
  return null;
}

function getPrinterPlugin(): PrinterPlugin | null {
  if (typeof window === 'undefined') return null;
  const cap = (window as any).Capacitor;
  if (cap && cap.Plugins && cap.Plugins.Printer) {
    return cap.Plugins.Printer;
  }
  return null;
}

function getDualScreenPlugin(): DualScreenPlugin | null {
  if (typeof window === 'undefined') return null;
  const cap = (window as any).Capacitor;
  if (cap && cap.Plugins && cap.Plugins.DualScreen) {
    return cap.Plugins.DualScreen;
  }
  return null;
}

function getAppUpdatePlugin(): AppUpdatePlugin | null {
  if (typeof window === 'undefined') return null;
  const cap = (window as any).Capacitor;
  if (cap && cap.Plugins && cap.Plugins.AppUpdate) {
    return cap.Plugins.AppUpdate;
  }
  return null;
}

function getCashboxPlugin(): CashboxPlugin | null {
  if (typeof window === 'undefined') return null;
  const cap = (window as any).Capacitor;
  if (cap && cap.Plugins && cap.Plugins.Cashbox) {
    return cap.Plugins.Cashbox;
  }
  return null;
}

// 检测是否在原生APP中
export function isNativeApp(): boolean {
  // 服务端环境直接返回false
  if (typeof window === 'undefined') {
    return false;
  }
  
  const cap = getCapacitor();
  if (!cap) return false;
  
  // 1. 检查Capacitor.isNativePlatform()
  if (cap.isNativePlatform && cap.isNativePlatform()) {
    return true;
  }
  
  // 2. 检查Android WebView特征
  const ua = navigator.userAgent || '';
  if (ua.includes('Android') && (ua.includes('wv') || ua.includes('WebView'))) {
    return true;
  }
  
  // 3. 检查Capacitor插件是否存在
  if (cap.Plugins && Object.keys(cap.Plugins).length > 0) {
    return true;
  }
  
  return false;
}

// ==================== 电子秤 ====================

export const Scale = {
  /**
   * 列出可用设备
   */
  async listDevices(): Promise<ScaleDevice[]> {
    const plugin = getScalePlugin();
    if (plugin) {
      try {
        const result = await plugin.listDevices();
        if (result.success && result.devices) {
          const devices: ScaleDevice[] = [];
          const deviceMap = result.devices;
          for (const key in deviceMap) {
            const d = deviceMap[key];
            devices.push({
              name: d.productName || d.name || 'USB秤',
              address: key,
              vendorId: d.vendorId,
              productId: d.productId,
            });
          }
          return devices;
        }
      } catch (e) {
        console.error('[Scale] listDevices error:', e);
      }
    }
    // Fallback: 返回空列表
    return [];
  },

  /**
   * 列出所有串口设备（RS232和USB）
   * 返回格式：{ serialPorts: SerialPort[], usbDevices: UsbDevice[], baudRates: number[] }
   */
  async listSerialPorts(): Promise<{ serialPorts: SerialPort[]; usbDevices: UsbDevice[]; baudRates: number[] }> {
    const plugin = getScalePlugin();
    if (plugin && (plugin as any).listSerialPorts) {
      try {
        const result = await (plugin as any).listSerialPorts();
        if (result.success) {
          return {
            serialPorts: result.serialPorts || [],
            usbDevices: result.usbDevices || [],
            baudRates: result.baudRates || [9600],
          };
        }
      } catch (e) {
        console.error('[Scale] listSerialPorts error:', e);
      }
    }
    // Fallback
    return { serialPorts: [], usbDevices: [], baudRates: [9600] };
  },

  /**
   * 获取支持的电子秤协议列表
   */
  async getProtocols(): Promise<ScaleProtocol[]> {
    const plugin = getScalePlugin();
    if (plugin && (plugin as any).getProtocols) {
      try {
        const result = await (plugin as any).getProtocols();
        if (result.success && result.protocols) {
          return result.protocols.map((code: string, index: number) => ({
            code,
            name: result.descriptions?.[index] || code,
            description: result.descriptions?.[index] || '',
          }));
        }
      } catch (e) {
        console.error('[Scale] getProtocols error:', e);
      }
    }
    // Fallback: 返回默认协议列表
    return SCALE_PROTOCOLS;
  },

  /**
   * 获取支持的波特率
   */
  async getBaudRates(): Promise<number[]> {
    const plugin = getScalePlugin();
    if (plugin && (plugin as any).getBaudRates) {
      try {
        const result = await (plugin as any).getBaudRates();
        if (result.success) {
          return result.baudRates || [9600];
        }
      } catch (e) {
        console.error('[Scale] getBaudRates error:', e);
      }
    }
    return BAUD_RATES;
  },

  /**
   * 连接电子秤
   * @param config.port 串口路径，如 '/dev/ttyUSB0'
   * @param config.baudRate 波特率，默认 9600
   * @param config.protocol 电子秤协议，如 'OS2', 'DAHUA', 'DIBO', 'AUTO' 等
   * @param config.dataBits 数据位，默认 8
   * @param config.stopBits 停止位，默认 1
   * @param config.parity 校验位，默认 'none'
   */
  async connect(config?: {
    port?: string;
    baudRate?: number;
    protocol?: string;
    dataBits?: number;
    stopBits?: number;
    parity?: string;
  }): Promise<{
    success: boolean;
    message: string;
    mode?: string;
    port?: string;
    baudRate?: number;
    protocol?: string;
    detectedBaudRate?: number;
    tip?: string;
  }> {
    const plugin = getScalePlugin();
    if (plugin) {
      try {
        const result = await plugin.connect({
          port: config?.port,
          baudRate: config?.baudRate || 9600,
          protocol: config?.protocol || 'AUTO',
          dataBits: config?.dataBits || 8,
          stopBits: config?.stopBits || 1,
          parity: config?.parity || 'none',
        });
        
        if (result.success) {
          return {
            success: true,
            message: result.message || '连接成功',
            mode: result.mode,
            port: result.port,
            baudRate: result.baudRate || result.detectedBaudRate,
            protocol: result.protocol,
            tip: result.tip,
          };
        }
        return {
          success: false,
          message: result.message || '连接失败',
        };
      } catch (e: any) {
        console.error('[Scale] connect error:', e);
        return { success: false, message: e.message || '连接失败' };
      }
    }
    // 非原生环境
    return {
      success: false,
      message: '原生插件不可用，请在APP中使用此功能',
      tip: '请在Android APP中测试',
    };
  },

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    const plugin = getScalePlugin();
    if (plugin) {
      await plugin.disconnect();
    }
  },

  /**
   * 获取当前重量
   */
  async getWeight(): Promise<WeightData | null> {
    const plugin = getScalePlugin();
    if (plugin) {
      try {
        const result = await plugin.getWeight();
        if (result.success) {
          return {
            weight: result.weight || 0,
            unit: result.unit || 'kg',
            stable: result.stable || false,
            timestamp: Date.now(),
          };
        }
      } catch (e) {
        console.error('[Scale] getWeight error:', e);
      }
    }
    return null;
  },

  /**
   * 获取连接状态
   */
  async getStatus(): Promise<{
    connected: boolean;
    available: boolean;
    mode?: string;
    protocol?: string;
    baudRate?: number;
    polling?: boolean;
    name?: string;
    deviceName?: string;
    address?: string;
    device?: string;
  }> {
    const plugin = getScalePlugin();
    if (plugin) {
      try {
        const result = await plugin.getStatus();
        return {
          connected: result.connected,
          available: result.available !== false,
          mode: result.mode,
          protocol: result.protocol,
          baudRate: result.baudRate,
          polling: result.polling,
          name: result.name,
          deviceName: result.deviceName,
          address: result.address,
          device: result.device,
        };
      } catch (e) {
        console.error('[Scale] getStatus error:', e);
        return { connected: false, available: true };
      }
    }
    return { connected: false, available: false };
  },
};

// ==================== 打印机 ====================

export const Printer = {
  /**
   * 列出已配对的蓝牙设备
   */
  async listDevices(): Promise<PrinterDevice[]> {
    const plugin = getPrinterPlugin();
    if (plugin) {
      try {
        const result = await plugin.listDevices();
        if (result.success) {
          return result.devices || [];
        }
      } catch (e) {
        console.error('[Printer] listDevices error:', e);
      }
    }
    return [];
  },

  /**
   * 连接蓝牙打印机
   */
  async connect(address: string, name?: string): Promise<{ success: boolean; message: string }> {
    const plugin = getPrinterPlugin();
    if (plugin) {
      try {
        const result = await plugin.connect({ address, name });
        if (result.success) {
          return { success: true, message: '连接成功' };
        }
        return { success: false, message: '连接失败' };
      } catch (e: any) {
        console.error('[Printer] connect error:', e);
        return { success: false, message: e.message || '连接失败' };
      }
    }
    return { success: false, message: '原生插件不可用，请在APP中使用此功能' };
  },

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    const plugin = getPrinterPlugin();
    if (plugin) {
      await plugin.disconnect();
    }
  },

  /**
   * 打印小票
   */
  async printReceipt(data: ReceiptData): Promise<{ success: boolean; message: string }> {
    const plugin = getPrinterPlugin();
    if (plugin) {
      try {
        const result = await plugin.printReceipt(data);
        return { success: result.success, message: result.success ? '打印成功' : '打印失败' };
      } catch (e: any) {
        console.error('[Printer] printReceipt error:', e);
        return { success: false, message: e.message || '打印失败' };
      }
    }
    // 非原生环境：模拟打印
    console.log('[Printer] Simulating receipt print:', data);
    return { success: true, message: '模拟打印成功' };
  },

  /**
   * 打开钱箱
   */
  async openCashbox(): Promise<{ success: boolean; message: string }> {
    const plugin = getPrinterPlugin();
    if (plugin) {
      try {
        const result = await plugin.openCashbox();
        return { success: result.success, message: result.success ? '钱箱已打开' : '打开失败' };
      } catch (e: any) {
        console.error('[Printer] openCashbox error:', e);
        return { success: false, message: e.message || '打开失败' };
      }
    }
    return { success: false, message: '原生插件不可用' };
  },

  /**
   * 获取连接状态
   */
  async getStatus(): Promise<{ 
    connected: boolean; 
    available: boolean;
    address?: string;
    printerName?: string;
    name?: string;
  }> {
    const plugin = getPrinterPlugin();
    if (plugin) {
      try {
        const result = await plugin.getStatus();
        return {
          connected: result.connected,
          available: plugin !== null,
          address: result.address,
          printerName: result.printerName,
          name: result.name,
        };
      } catch (e) {
        console.error('[Printer] getStatus error:', e);
        return { connected: false, available: true };
      }
    }
    return { connected: false, available: false };
  },
};

// ==================== 客显屏 ====================

export const CustomerDisplay = {
  /**
   * 获取可用屏幕列表
   */
  async getDisplays(): Promise<Array<{ id: number; name: string; isPrimary: boolean }>> {
    const plugin = getDualScreenPlugin();
    if (plugin) {
      try {
        const result = await plugin.getDisplays();
        if (result.success && result.displays) {
          const displays: Array<{ id: number; name: string; isPrimary: boolean }> = [];
          for (const key in result.displays) {
            const d = result.displays[key];
            displays.push({
              id: d.id,
              name: d.name || `屏幕 ${d.id}`,
              isPrimary: d.isPrimary || false,
            });
          }
          return displays;
        }
      } catch (e) {
        console.error('[DualScreen] getDisplays error:', e);
      }
    }
    return [];
  },

  /**
   * 打开客显屏
   */
  async open(displayId?: number): Promise<{ success: boolean; message: string }> {
    const plugin = getDualScreenPlugin();
    if (plugin) {
      try {
        const result = await plugin.open({ displayId });
        return { success: result.success, message: result.success ? '客显屏已打开' : '打开失败' };
      } catch (e: any) {
        console.error('[DualScreen] open error:', e);
        return { success: false, message: e.message || '打开失败' };
      }
    }
    return { success: false, message: '原生插件不可用，请在APP中使用此功能' };
  },

  /**
   * 关闭客显屏
   */
  async close(): Promise<void> {
    const plugin = getDualScreenPlugin();
    if (plugin) {
      await plugin.close();
    }
  },

  /**
   * 发送数据到客显屏
   */
  async sendData(data: { total?: number; payment?: number; change?: number; items?: any[]; message?: string }): Promise<{ success: boolean }> {
    const plugin = getDualScreenPlugin();
    if (plugin) {
      try {
        return { success: (await plugin.sendData(data)).success };
      } catch (e) {
        console.error('[DualScreen] sendData error:', e);
        return { success: false };
      }
    }
    return { success: false };
  },

  /**
   * 获取状态
   */
  async getStatus(): Promise<{ isOpen: boolean; available: boolean }> {
    const plugin = getDualScreenPlugin();
    return {
      isOpen: plugin ? (await plugin.getStatus()).isOpen : false,
      available: plugin !== null,
    };
  },
};

// ==================== APP更新 ====================

export const AppUpdate = {
  /**
   * 检查更新
   */
  async checkUpdate(): Promise<{ hasUpdate: boolean; latestVersion?: string }> {
    const plugin = getAppUpdatePlugin();
    if (plugin) {
      return await plugin.checkUpdate();
    }
    return { hasUpdate: false };
  },

  /**
   * 下载并安装
   */
  async downloadAndInstall(): Promise<{ success: boolean; message?: string }> {
    const plugin = getAppUpdatePlugin();
    if (plugin) {
      return await plugin.downloadAndInstall();
    }
    return { success: false, message: '原生插件不可用' };
  },
};

// ==================== 钱箱 ====================

export const Cashbox = {
  /**
   * 获取钱箱状态
   */
  async getStatus(): Promise<{ 
    connected: boolean; 
    drawerOpen: boolean; 
    hasDevice: boolean;
    address?: string;
    deviceName?: string;
    interface?: string;
    mode?: string;
  }> {
    const plugin = getCashboxPlugin();
    if (plugin) {
      try {
        const result = await plugin.getStatus();
        return {
          connected: result.connected || false,
          drawerOpen: result.drawerOpen || false,
          hasDevice: result.hasDevice || false,
          address: result.address,
          deviceName: result.deviceName,
          interface: result.interface,
          mode: result.mode,
        };
      } catch (e) {
        console.error('[Cashbox] getStatus error:', e);
      }
    }
    return { connected: false, drawerOpen: false, hasDevice: false };
  },

  /**
   * 列出可用的钱箱设备
   */
  async listDevices(): Promise<Array<{ name: string; path: string; type: string; interface: string; description: string }>> {
    const plugin = getCashboxPlugin();
    if (plugin) {
      try {
        const result = await plugin.listDevices();
        if (result.success) {
          return result.devices || [];
        }
      } catch (e) {
        console.error('[Cashbox] listDevices error:', e);
      }
    }
    // 默认返回打印机钱箱接口
    return [{
      name: '打印机钱箱接口',
      path: 'printer',
      type: 'printer',
      interface: 'ESC/POS',
      description: '通过连接的打印机控制钱箱',
    }];
  },

  /**
   * 连接钱箱
   * @param port 设备路径 ('printer', '/dev/ttyUSB0', 'usb://vid:pid')
   * @param baudRate 波特率（串口模式）
   */
  async connect(port: string = 'printer', baudRate: number = 9600): Promise<{ success: boolean; mode?: string; message?: string }> {
    const plugin = getCashboxPlugin();
    if (plugin) {
      try {
        const result = await plugin.connect({ port, baudRate });
        return result;
      } catch (e: any) {
        console.error('[Cashbox] connect error:', e);
        return { success: false, message: e.message };
      }
    }
    // 非原生环境
    return { success: false, message: '原生插件不可用' };
  },

  /**
   * 打开钱箱
   * @param drawer 钱箱编号 (0=引脚2, 1=引脚5, 2=钱箱1, 3=钱箱2)
   */
  async open(drawer: number = 0): Promise<{ success: boolean; drawerOpen?: boolean; mode?: string; message?: string }> {
    const plugin = getCashboxPlugin();
    if (plugin) {
      try {
        const result = await plugin.open({ drawer });
        return result;
      } catch (e: any) {
        console.error('[Cashbox] open error:', e);
        return { success: false, message: e.message };
      }
    }
    // 非原生环境
    return { success: false, message: '原生插件不可用' };
  },

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    const plugin = getCashboxPlugin();
    if (plugin) {
      await plugin.disconnect();
    }
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
        console.error('[Cashbox] getBaudRates error:', e);
      }
    }
    return [1200, 2400, 4800, 9600, 19200, 38400];
  },
};

// ==================== 调试信息 ====================

export function getDebugInfo() {
  const cap = (window as any).Capacitor;
  return {
    isNativeApp: isNativeApp(),
    capacitorExists: !!cap,
    isNativePlatform: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
    plugins: cap?.Plugins ? Object.keys(cap.Plugins) : [],
    userAgent: navigator.userAgent,
  };
}
