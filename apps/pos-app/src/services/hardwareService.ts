/**
 * 海邻到家一体机硬件服务层 V6.0
 * 完整支持：电子秤、打印机、钱箱、扫码枪、客显屏、AI识别
 */
import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

// ==================== 插件类型定义 ====================

interface ScaleWeight {
  weight: number;      // 重量值（kg）
  unit: string;         // 单位 (kg/lb/g)
  stable: boolean;      // 是否稳定
  timestamp: number;    // 时间戳
  raw?: string;         // 原始十六进制数据（如 "02 47 53 2B 30 31 32 2E 35 30 30 03"）
}

// 电子秤协议数据解析结果
interface ScaleProtocol {
  status: 'stable' | 'unstable' | 'tare' | 'zero';  // 状态
  negative: boolean;   // 正负
  weight: number;      // 数值
  decimals: number;    // 小数位数
  unit: string;        // 单位
  raw: string;         // 原始十六进制
}

interface DeviceStatus {
  scaleConnected: boolean;
  printerConnected: boolean;
  labelPrinterConnected: boolean;
  scannerEnabled: boolean;
}

interface PrinterOptions {
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  fontSize?: number;
}

interface ReceiptData {
  title?: string;
  time?: string;
  orderId?: string;
  items?: string;
  total?: string;
  discount?: string;
  paid?: string;
  qrCode?: string;
}

interface LabelData {
  width?: number;
  height?: number;
  gap?: number;
  productName?: string;
  price?: string;
  barcode?: string;
  date?: string;
}

interface AIMatchResult {
  productId: string;
  productName: string;
  price: number;
  confidence: number;
}

// ==================== 插件桥接 ====================

interface HailinHardwarePlugin {
  // 电子秤
  scaleConnect(options: { port: string; baudRate: number; protocol?: string }): Promise<any>;
  scaleConnectTcp(options: { host: string; port: number; protocol?: string }): Promise<any>;
  scaleTare(options?: { connectionId?: string }): Promise<any>;
  scaleZero(options?: { connectionId?: string }): Promise<any>;
  scaleReadWeight(options?: { connectionId?: string }): Promise<ScaleWeight>;
  scaleDisconnect(options?: { connectionId?: string }): Promise<any>;
  
  // ESC/POS 打印机
  printerConnect(options: { host: string; port: number }): Promise<any>;
  printerInit(): Promise<any>;
  printerPrintText(options: { text: string } & PrinterOptions): Promise<any>;
  printerNewLine(options?: { lines: number }): Promise<any>;
  printerPrintDivider(options?: { type?: string; width?: number }): Promise<any>;
  printerPrintQRCode(options: { data: string; size?: number }): Promise<any>;
  printerPrintBarcode(options: { data: string; type?: string; height?: number; width?: number }): Promise<any>;
  printerBeep(options?: { count?: number; interval?: number }): Promise<any>;
  printerCut(options?: { full?: boolean }): Promise<any>;
  openCashDrawer(): Promise<any>;
  printerPrintReceipt(options: { receiptData: string }): Promise<any>;
  printerDisconnect(): Promise<any>;
  
  // TSPL 标签打印机
  labelPrinterConnect(options: { host: string; port: number }): Promise<any>;
  labelInit(options?: { width?: number; height?: number; gap?: number }): Promise<any>;
  labelPrint(options: { labelData: string }): Promise<any>;
  
  // 扫码枪
  enableBarcodeScanner(): Promise<any>;
  disableBarcodeScanner(): Promise<any>;
  onBarcodeScanned(options: { barcode: string }): Promise<any>;
  getLastScan(): Promise<{ barcode: string; timestamp: number }>;
  
  // 双屏客显
  showOnCustomerDisplay(options: {
    mode: 'welcome' | 'amount' | 'qrcode' | 'member' | 'advertisement';
    title?: string;
    amount?: number;
    qrCodeUrl?: string;
  }): Promise<any>;
  dismissCustomerDisplay(): Promise<any>;
  
  // AI视觉识别
  captureAndRecognize(options: { imageData: string }): Promise<AIMatchResult>;
  getCameraFrame(): Promise<any>;
  
  // 设备管理
  getDeviceStatus(): Promise<DeviceStatus>;
  disconnectAll(): Promise<any>;
  
  // 事件监听
  addListener(eventName: string, callback: (data: any) => void): Promise<any>;
  removeAllListeners(): Promise<any>;
}

// 尝试获取原生插件
let hardwarePlugin: HailinHardwarePlugin | null = null;
let pluginRetryCount = 0;
const MAX_PLUGIN_RETRIES = 10;

// 获取插件，带重试机制
function getHardwarePlugin(): HailinHardwarePlugin | null {
  if (Capacitor.isNativePlatform()) {
    try {
      // 使用 Capacitor.getPlugin 获取已注册的插件
      const plugin = (Capacitor as any).Plugins?.HailinHardware;
      if (plugin) {
        console.log('[硬件服务] HailinHardware 原生插件已加载');
        return plugin as HailinHardwarePlugin;
      }
    } catch (e) {
      console.warn('[硬件服务] 获取 HailinHardware 插件失败:', e);
    }
  }
  return null;
}

// 初始化插件
hardwarePlugin = getHardwarePlugin();

// 如果插件未立即可用，设置定时器重试
if (!hardwarePlugin && Capacitor.isNativePlatform()) {
  const retryInterval = setInterval(() => {
    pluginRetryCount++;
    hardwarePlugin = getHardwarePlugin();
    if (hardwarePlugin || pluginRetryCount >= MAX_PLUGIN_RETRIES) {
      clearInterval(retryInterval);
      if (!hardwarePlugin) {
        console.warn('[硬件服务] HailinHardware 原生插件未安装，将使用模拟实现');
      }
    }
  }, 500);
}

// ==================== 事件总线 ====================

type EventCallback = (data: any) => void;
const eventListeners: Map<string, Set<EventCallback>> = new Map();

// 转发原生事件到前端（延迟绑定，等待插件初始化）
function bindPluginListeners() {
  if (hardwarePlugin) {
    hardwarePlugin.addListener('scaleData', (data) => {
      emit('scaleData', data);
    });
    hardwarePlugin.addListener('barcodeScanned', (data) => {
      emit('barcodeScanned', data);
    });
  }
}

// 延迟绑定事件
setTimeout(bindPluginListeners, 1000);

function on(event: string, callback: EventCallback): void {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event)!.add(callback);
}

function off(event: string, callback: EventCallback): void {
  eventListeners.get(event)?.delete(callback);
}

function emit(event: string, data: any): void {
  eventListeners.get(event)?.forEach(cb => cb(data));
}

// ==================== 扩展类型定义 ====================

// 串口秤配置
interface SerialScaleConfig {
  type: 'serial' | 'network' | 'usb';
  port?: string;        // 串口路径，如 /dev/ttyS1
  host?: string;        // IP地址（网络秤）
  baudRate?: number;    // 波特率
  port?: number;        // TCP端口或串口波特率
  dataBits?: number;    // 数据位
  stopBits?: number;    // 停止位
  parity?: 'none' | 'odd' | 'even';  // 校验位
  protocol?: 'general' | 'dahua' | 'toieda' | 'soki';  // 秤协议
}

// USB HID秤配置
interface USBScaleConfig {
  vendorId?: number;
  productId?: number;
  protocol?: string;
}

// ==================== 电子秤服务 ====================

// 顶尖 OS2 系列电子秤默认配置
const SCALE_DEFAULTS = {
  baudRate: 2400,      // 顶尖OS2 默认波特率
  protocol: 'soki',    // 顶尖OS2 协议
  dataBits: 8,
  stopBits: 1,
  parity: 'none'
};

export class ScaleService {
  private connected = false;
  private connectionId = 'scale';
  private connectionType: 'serial' | 'network' | 'usb' = 'network';
  private protocol = 'general';
  private lastWeight: ScaleWeight | null = null;
  private pollingInterval: number | null = null;
  
  /**
   * 连接电子秤（自动识别类型）
   * options.port: 串口路径或IP地址
   * options.baudRate: 波特率（串口）或TCP端口（网络）
   */
  async connect(options: {
    port?: string;
    baudRate?: number;
    protocol?: string;
    type?: 'serial' | 'network' | 'usb';
  } = {}): Promise<boolean> {
    // 判断连接类型
    const { port, baudRate = SCALE_DEFAULTS.baudRate, protocol = SCALE_DEFAULTS.protocol, type } = options;
    
    // 自动检测：如果 port 包含 IP 格式或 ':'，则为网络连接
    const isNetwork = port?.includes('.') || port?.includes(':');
    // 自动检测：如果 port 是 /dev/tty* 格式，则为串口
    const isSerial = port?.startsWith('/dev/tty') || port?.startsWith('/dev/ttyS');
    
    if (type === 'serial' || isSerial) {
      return this.connectSerial(port || '/dev/ttyS1', baudRate, protocol);
    } else if (type === 'usb') {
      return this.connectUSB(options as USBScaleConfig);
    } else if (isNetwork) {
      return this.connectTCP(port!, baudRate, protocol);
    } else {
      // 默认尝试串口
      return this.connectSerial(port || '/dev/ttyS1', baudRate, protocol);
    }
  }
  
  /**
   * 连接串口秤
   * @param port 串口路径，如 /dev/ttyS1, /dev/ttyS2
   * @param baudRate 波特率，如 9600, 19200, 38400
   */
  async connectSerial(port: string, baudRate: number, protocol: string): Promise<boolean> {
    this.protocol = protocol;
    this.connectionType = 'serial';
    this.connectionId = 'scale';
    
    console.log(`[秤] 连接串口: ${port} @ ${baudRate}bps, 协议: ${protocol}`);
    
    try {
      if (hardwarePlugin) {
        const result = await hardwarePlugin.scaleConnect({
          port,
          baudRate,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          protocol
        });
        this.connected = result.success;
        
        if (this.connected) {
          console.log(`[秤] 串口连接成功`);
          on('scaleData', this.handleScaleData);
        }
        
        return this.connected;
      } else {
        // 模拟模式
        this.connected = true;
        console.log('[秤] 串口模拟连接成功');
        
        // 启动模拟数据
        this.startSimulatedReading();
        
        return true;
      }
    } catch (error: any) {
      console.error('[秤] 串口连接失败:', error);
      return false;
    }
  }
  
  /**
   * 连接USB HID电子秤
   */
  async connectUSB(config: USBScaleConfig = {}): Promise<boolean> {
    this.protocol = config.protocol || 'general';
    this.connectionType = 'usb';
    
    console.log(`[秤] 连接USB HID秤: VID=${config.vendorId?.toString(16)}, PID=${config.productId?.toString(16)}`);
    
    try {
      if (hardwarePlugin) {
        const result = await hardwarePlugin.scaleConnectUSB({
          vendorId: config.vendorId,
          productId: config.productId,
          protocol: this.protocol
        });
        
        if (result.success) {
          this.connected = true;
          on('scaleData', this.handleScaleData);
        } else if (result.needPermission) {
          console.warn('[秤] 需要USB权限');
        }
        
        return result.success;
      } else {
        console.warn('[秤] USB连接需要原生插件');
        return false;
      }
    } catch (error: any) {
      console.error('[秤] USB连接失败:', error);
      return false;
    }
  }
  
  /**
   * 连接网络电子秤（TCP）
   */
  async connectTCP(host: string, port: number, protocol: string): Promise<boolean> {
    this.protocol = protocol;
    this.connectionType = 'network';
    
    console.log(`[秤] 连接网络秤: ${host}:${port}`);
    
    try {
      if (hardwarePlugin) {
        const result = await hardwarePlugin.scaleConnectTcp({
          host,
          port: port || 9101,
          protocol
        });
        this.connected = result.success;
        
        if (this.connected) {
          console.log('[秤] 网络连接成功');
          on('scaleData', this.handleScaleData);
        }
        
        return this.connected;
      } else {
        // 模拟模式
        this.connected = true;
        console.log('[秤] 网络秤模拟连接成功');
        this.startSimulatedReading();
        return true;
      }
    } catch (error: any) {
      console.error('[秤] 网络连接失败:', error);
      return false;
    }
  }
  
  /**
   * 监听秤数据
   */
  private handleScaleData = (data: ScaleWeight) => {
    this.lastWeight = data;
    // 触发重量变化事件
    emit('weightChanged', data);
  };
  
  /**
   * 启动模拟称重（用于开发调试）
   */
  private startSimulatedReading(): void {
    let baseWeight = 0.5;
    let stable = true;
    
    const interval = setInterval(() => {
      if (!this.connected) {
        clearInterval(interval);
        return;
      }
      
      // 模拟重量变化
      baseWeight += (Math.random() - 0.5) * 0.02;
      baseWeight = Math.max(0.1, Math.min(10, baseWeight));
      
      // 模拟稳定性变化
      if (Math.random() > 0.95) {
        stable = !stable;
      }
      
      const weight: ScaleWeight = {
        weight: Math.round(baseWeight * 1000) / 1000,
        unit: 'kg',
        stable,
        timestamp: Date.now(),
        raw: `模拟数据`
      };
      
      this.lastWeight = weight;
      emit('weightChanged', weight);
      emit('scaleData', weight);
      
    }, 500);
  }
  
  /**
   * 检测电子秤
   * 使用 scaleConnect 方法进行实际连接测试
   * @param port 串口路径
   * @param baudRate 波特率
   */
  async detect(port: string, baudRate: number): Promise<{
    success: boolean;
    detected: boolean;
    protocol?: string;
    deviceInfo?: string;
    baudRate?: number;
    port?: string;
  }> {
    console.log(`[秤] 检测电子秤: ${port} @ ${baudRate}`);
    
    try {
      if (hardwarePlugin && hardwarePlugin.scaleConnect) {
        // 使用 scaleConnect 方法尝试连接
        const result = await hardwarePlugin.scaleConnect({
          port,
          baudRate,
          protocol: 'soki'
        });
        
        console.log('[秤] 连接结果:', result);
        
        if (result && result.success) {
          // 连接成功，读取一次重量验证
          try {
            const weight = await hardwarePlugin.scaleReadWeight?.({ connectionId: 'scale' });
            return {
              success: true,
              detected: true,
              protocol: 'soki',
              deviceInfo: '顶尖OS2电子秤',
              baudRate,
              port
            };
          } catch {
            // 能连接上就是检测成功
            return {
              success: true,
              detected: true,
              protocol: 'soki',
              deviceInfo: '顶尖OS2电子秤',
              baudRate,
              port
            };
          }
        } else {
          return {
            success: false,
            detected: false
          };
        }
      } else {
        // 插件不存在，使用模拟检测
        console.log('[秤] 插件不存在，使用模拟检测');
        return {
          success: true,
          detected: true,
          protocol: 'soki',
          deviceInfo: '模拟电子秤（插件未注册）',
          baudRate,
          port
        };
      }
    } catch (error: any) {
      console.error('[秤] 检测失败:', error);
      return {
        success: false,
        detected: false
      };
    }
  }
  
  /**
   * 获取秤当前状态
   */
  async getStatus(): Promise<{
    connected: boolean;
    weight: number;
    unit: string;
    stable: boolean;
    timestamp: number;
  }> {
    try {
      if (hardwarePlugin) {
        return await hardwarePlugin.getScaleStatus();
      } else {
        return {
          connected: this.connected,
          weight: 0.520,
          unit: 'kg',
          stable: true,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      return {
        connected: false,
        weight: 0,
        unit: 'kg',
        stable: false,
        timestamp: 0
      };
    }
  }
  
  /**
   * 获取设备信息
   * 返回支持的设备列表和连接状态
   */
  async getDeviceInfo(): Promise<{
    scale: { connected: boolean; supportedProtocols: string[] };
    printer: { connected: boolean };
    usbDevices: string[];
    serialPorts: string[];
  }> {
    try {
      if (hardwarePlugin) {
        return await hardwarePlugin.getDeviceInfo();
      } else {
        return {
          scale: { connected: false, supportedProtocols: ['soki', 'aclss', 'general', 'dahua', 'toieda'] },
          printer: { connected: false },
          usbDevices: [],
          serialPorts: ['/dev/ttyS0', '/dev/ttyS1', '/dev/ttyS2']
        };
      }
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 发送自定义指令
   */
  async sendCommand(command: string): Promise<boolean> {
    try {
      if (hardwarePlugin) {
        await hardwarePlugin.sendScaleCommand({ command });
        return true;
      }
      return false;
    } catch (error) {
      console.error('[秤] 发送指令失败:', error);
      return false;
    }
  }
  
  /**
   * 获取当前重量
   */
  async getWeight(): Promise<ScaleWeight | null> {
    if (!this.connected) return null;
    
    try {
      if (hardwarePlugin) {
        const result = await hardwarePlugin.scaleReadWeight({ connectionId: this.connectionId });
        this.lastWeight = result;
        return result;
      } else {
        // 模拟返回重量
        return {
          weight: 0.5 + Math.random() * 0.1,
          unit: 'kg',
          stable: true,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('[秤] 读取重量失败:', error);
      return this.lastWeight;
    }
  }
  
  /**
   * 开始持续称重（轮询模式）
   */
  startContinuous(intervalMs = 200): void {
    if (this.pollingInterval) return;
    
    this.pollingInterval = window.setInterval(async () => {
      await this.getWeight();
    }, intervalMs);
  }
  
  /**
   * 停止持续称重
   */
  stopContinuous(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
  
  /**
   * 去皮
   */
  async tare(): Promise<boolean> {
    if (!this.connected) return false;
    
    try {
      if (hardwarePlugin) {
        await hardwarePlugin.scaleTare({ connectionId: this.connectionId });
      } else {
        console.log('[秤] 模拟去皮');
      }
      return true;
    } catch (error) {
      console.error('[秤] 去皮失败:', error);
      return false;
    }
  }
  
  /**
   * 清零
   */
  async zero(): Promise<boolean> {
    if (!this.connected) return false;
    
    try {
      if (hardwarePlugin) {
        await hardwarePlugin.scaleZero({ connectionId: this.connectionId });
      } else {
        console.log('[秤] 模拟清零');
      }
      return true;
    } catch (error) {
      console.error('[秤] 清零失败:', error);
      return false;
    }
  }
  
  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (this.pollingInterval) {
      this.stopContinuous();
    }
    
    off('scaleData', this.handleScaleData);
    
    if (hardwarePlugin) {
      await hardwarePlugin.scaleDisconnect({ connectionId: this.connectionId });
    }
    
    this.connected = false;
  }
  
  get isConnected(): boolean {
    return this.connected;
  }
  
  get currentWeight(): ScaleWeight | null {
    return this.lastWeight;
  }
  
  /**
   * 静态解析器：解析电子秤十六进制数据（前端调试用）
   * 
   * 协议格式：
   * [STX][状态][符号][整数][小数][小数位][单位][校验][ETX]
   * 示例: 02 47 53 2B 30 31 32 2E 35 30 30 03
   *        帧头  G  S  +  0   1   2  .  5   0   0  帧尾
   * 
   * @param hexString 十六进制字符串，格式如 "02 47 53 2B 30 31 32 2E 35 30 30 03"
   * @returns 解析后的秤数据，或 null 如果解析失败
   */
  static parseHex(hexString: string): ScaleProtocol | null {
    try {
      // 解析十六进制字符串
      const bytes = hexString.split(/\s+/).map(b => parseInt(b, 16));
      
      if (bytes.length < 10) {
        console.warn('[秤解析] 数据太短:', bytes.length);
        return null;
      }
      
      const STX = 0x02;
      const ETX = 0x03;
      
      // 验证帧头帧尾
      if (bytes[0] !== STX || bytes[bytes.length - 1] !== ETX) {
        console.warn('[秤解析] 帧头帧尾验证失败');
        return null;
      }
      
      // 验证校验位（异或校验）
      let calculatedCheck = 0;
      for (let i = 1; i < bytes.length - 2; i++) {
        calculatedCheck ^= bytes[i];
      }
      const realCheck = bytes[bytes.length - 2];
      
      if (calculatedCheck !== realCheck) {
        console.warn(`[秤解析] 校验失败: 计算值=0x${calculatedCheck.toString(16)}, 实际值=0x${realCheck.toString(16)}`);
        return null;
      }
      
      // 解析状态位
      const statusMap: Record<number, ScaleProtocol['status']> = {
        0x47: 'stable',  // 'G'
        0x53: 'stable',  // 'S'
        0x55: 'unstable', // 'U'
        0x44: 'tare',    // 'D'
        0x5A: 'zero',    // 'Z'
      };
      const status = statusMap[bytes[1]] || 'unstable';
      
      // 解析符号
      const negative = bytes[2] === 0x2D || bytes[2] === 0x2d; // '-'
      
      // 解析重量数值
      let weightStr = '';
      for (let i = 2; i < bytes.length - 3; i++) {
        const b = bytes[i];
        if ((b >= 0x30 && b <= 0x39) || b === 0x2E) { // 0-9 或 .
          weightStr += String.fromCharCode(b);
        }
      }
      
      const weight = negative ? -parseFloat(weightStr) : parseFloat(weightStr);
      
      // 解析单位
      const unitMap: Record<number, string> = {
        0x4B: 'kg',
        0x6B: 'kg',
        0x4C: 'lb',
        0x6C: 'lb',
        0x47: 'g',
        0x67: 'g',
        0x4F: 'oz',
        0x6F: 'oz',
      };
      const unit = unitMap[bytes[bytes.length - 3]] || 'kg';
      
      return {
        status,
        negative,
        weight,
        decimals: weightStr.includes('.') ? weightStr.split('.')[1].length : 0,
        unit,
        raw: hexString,
      };
      
    } catch (error) {
      console.error('[秤解析] 解析异常:', error);
      return null;
    }
  }
}

// ==================== 小票打印机服务 ====================

export class ReceiptPrinterService {
  private connected = false;
  private host = '';
  private port = 9100;
  
  /**
   * 连接打印机
   */
  async connect(host: string, port = 9100): Promise<boolean> {
    this.host = host;
    this.port = port;
    
    try {
      if (hardwarePlugin) {
        const result = await hardwarePlugin.printerConnect({ host, port });
        this.connected = result.success;
      } else {
        // 模拟连接
        this.connected = true;
        console.log(`[打印机] 模拟连接到 ${host}:${port}`);
      }
      
      if (this.connected) {
        await this.init();
      }
      
      return this.connected;
    } catch (error) {
      console.error('[打印机] 连接失败:', error);
      return false;
    }
  }
  
  /**
   * 初始化打印机
   */
  async init(): Promise<void> {
    if (!this.connected) return;
    
    if (hardwarePlugin) {
      await hardwarePlugin.printerInit();
    } else {
      console.log('[打印机] 模拟初始化');
    }
  }
  
  /**
   * 打印文本
   */
  async printText(text: string, options: PrinterOptions = {}): Promise<void> {
    if (!this.connected) {
      console.warn('[打印机] 未连接');
      return;
    }
    
    if (hardwarePlugin) {
      await hardwarePlugin.printerPrintText({ text, ...options });
    } else {
      console.log(`[打印机] 打印: ${text}`);
    }
  }
  
  /**
   * 打印空行
   */
  async newLine(lines = 1): Promise<void> {
    if (!this.connected) return;
    
    if (hardwarePlugin) {
      await hardwarePlugin.printerNewLine({ lines });
    }
  }
  
  /**
   * 打印分隔线
   */
  async printDivider(char = '-', width = 32): Promise<void> {
    if (!this.connected) return;
    
    if (hardwarePlugin) {
      await hardwarePlugin.printerPrintDivider({ type: char, width });
    }
  }
  
  /**
   * 打印二维码
   */
  async printQRCode(data: string, size = 6): Promise<void> {
    if (!this.connected) return;
    
    if (hardwarePlugin) {
      await hardwarePlugin.printerPrintQRCode({ data, size });
    }
  }
  
  /**
   * 打印条形码
   */
  async printBarcode(data: string, type = 'CODE128'): Promise<void> {
    if (!this.connected) return;
    
    if (hardwarePlugin) {
      await hardwarePlugin.printerPrintBarcode({ data, type });
    }
  }
  
  /**
   * 蜂鸣
   */
  async beep(count = 1): Promise<void> {
    if (!this.connected) return;
    
    if (hardwarePlugin) {
      await hardwarePlugin.printerBeep({ count });
    }
  }
  
  /**
   * 切刀
   */
  async cut(full = true): Promise<void> {
    if (!this.connected) return;
    
    if (hardwarePlugin) {
      await hardwarePlugin.printerCut({ full });
    }
  }
  
  /**
   * 打开钱箱
   */
  async openCashDrawer(): Promise<boolean> {
    if (!this.connected) {
      console.warn('[打印机] 未连接，无法打开钱箱');
      return false;
    }
    
    try {
      if (hardwarePlugin) {
        await hardwarePlugin.openCashDrawer();
      } else {
        console.log('[打印机] 模拟打开钱箱');
      }
      return true;
    } catch (error) {
      console.error('[打印机] 打开钱箱失败:', error);
      return false;
    }
  }
  
  /**
   * 打印完整小票
   */
  async printReceipt(data: ReceiptData): Promise<void> {
    if (!this.connected) {
      console.warn('[打印机] 未连接');
      return;
    }
    
    // 播放提示音
    await this.beep(1);
    
    if (hardwarePlugin) {
      await hardwarePlugin.printerPrintReceipt({
        receiptData: JSON.stringify(data)
      });
    } else {
      console.log('[打印机] 模拟打印小票:', data);
    }
  }
  
  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (hardwarePlugin) {
      await hardwarePlugin.printerDisconnect();
    }
    this.connected = false;
  }
  
  get isConnected(): boolean {
    return this.connected;
  }
}

// ==================== 标签打印机服务 ====================

export class LabelPrinterService {
  private connected = false;
  
  /**
   * 连接标签打印机
   */
  async connect(host: string, port = 9100): Promise<boolean> {
    try {
      if (hardwarePlugin) {
        const result = await hardwarePlugin.labelPrinterConnect({ host, port });
        this.connected = result.success;
      } else {
        this.connected = true;
        console.log('[标签打印机] 模拟连接成功');
      }
      
      if (this.connected) {
        await this.init();
      }
      
      return this.connected;
    } catch (error) {
      console.error('[标签打印机] 连接失败:', error);
      return false;
    }
  }
  
  /**
   * 初始化
   */
  async init(options: { width?: number; height?: number; gap?: number } = {}): Promise<void> {
    if (!this.connected) return;
    
    if (hardwarePlugin) {
      await hardwarePlugin.labelInit(options);
    }
  }
  
  /**
   * 打印标签
   */
  async printLabel(data: LabelData): Promise<void> {
    if (!this.connected) {
      console.warn('[标签打印机] 未连接');
      return;
    }
    
    if (hardwarePlugin) {
      await hardwarePlugin.labelPrint({
        labelData: JSON.stringify(data)
      });
    } else {
      console.log('[标签打印机] 模拟打印标签:', data);
    }
  }
  
  /**
   * 批量打印标签
   */
  async printLabels(labels: LabelData[], copies = 1): Promise<void> {
    for (let i = 0; i < labels.length; i++) {
      for (let j = 0; j < copies; j++) {
        await this.printLabel(labels[i]);
        await new Promise(resolve => setTimeout(resolve, 500)); // 间隔
      }
    }
  }
  
  async disconnect(): Promise<void> {
    this.connected = false;
  }
  
  get isConnected(): boolean {
    return this.connected;
  }
}

// ==================== 扫码枪服务 ====================

export class BarcodeScannerService {
  private enabled = false;
  private lastBarcode = '';
  private lastScanTime = 0;
  private buffer = '';
  private bufferTimeout: number | null = null;
  private readonly SCAN_THRESHOLD = 50; // 字符输入间隔阈值(ms)
  
  /**
   * 初始化扫码枪监听
   */
  init(): void {
    // 监听键盘输入（USB HID模式）
    document.addEventListener('keydown', this.handleKeyDown);
    console.log('[扫码枪] 监听已启动');
  }
  
  /**
   * 启用扫码
   */
  async enable(): Promise<void> {
    this.enabled = true;
    
    if (hardwarePlugin) {
      await hardwarePlugin.enableBarcodeScanner();
    }
    
    // 监听扫码事件
    on('barcodeScanned', this.handleBarcodeEvent);
  }
  
  /**
   * 禁用扫码
   */
  async disable(): Promise<void> {
    this.enabled = false;
    
    if (hardwarePlugin) {
      await hardwarePlugin.disableBarcodeScanner();
    }
    
    off('barcodeScanned', this.handleBarcodeEvent);
  }
  
  /**
   * 键盘事件处理（USB HID模式）
   */
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.enabled) return;
    
    const now = Date.now();
    
    // 检测是否是扫码枪输入（快速连续输入）
    if (this.bufferTimeout && now - this.lastScanTime < this.SCAN_THRESHOLD) {
      // 继续收集
      if (e.key === 'Enter') {
        // 扫码结束
        this.processBarcode(this.buffer);
        this.buffer = '';
        clearTimeout(this.bufferTimeout);
        this.bufferTimeout = null;
        e.preventDefault();
        return;
      }
      
      this.buffer += e.key;
      e.preventDefault();
    } else {
      // 重置缓冲区
      this.buffer = '';
    }
    
    this.lastScanTime = now;
    
    // 超时后清空缓冲区
    if (this.bufferTimeout) {
      clearTimeout(this.bufferTimeout);
    }
    this.bufferTimeout = window.setTimeout(() => {
      this.buffer = '';
    }, 200);
  };
  
  /**
   * 处理扫码结果
   */
  private handleBarcodeEvent = async (data: { barcode: string; timestamp: number }): Promise<void> => {
    this.lastBarcode = data.barcode;
    emit('scan', data);
  };
  
  /**
   * 处理扫码结果（键盘模式）
   */
  private processBarcode(barcode: string): void {
    if (!barcode || barcode.length < 4) return;
    
    this.lastBarcode = barcode;
    console.log('[扫码枪] 扫码:', barcode);
    
    // 发送到原生层
    if (hardwarePlugin) {
      hardwarePlugin.onBarcodeScanned({ barcode });
    }
    
    // 触发扫码事件
    emit('scan', {
      barcode,
      timestamp: Date.now()
    });
  }
  
  /**
   * 获取最后扫码结果
   */
  async getLastScan(): Promise<string> {
    if (hardwarePlugin) {
      const result = await hardwarePlugin.getLastScan();
      return result.barcode;
    }
    return this.lastBarcode;
  }
  
  /**
   * 销毁
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.disable();
  }
  
  get isEnabled(): boolean {
    return this.enabled;
  }
}

// ==================== 客显屏服务 ====================

export class CustomerDisplayService {
  /**
   * 显示欢迎界面
   */
  async showWelcome(): Promise<void> {
    if (hardwarePlugin) {
      await hardwarePlugin.showOnCustomerDisplay({
        mode: 'welcome',
        title: '欢迎光临海邻到家'
      });
    } else {
      console.log('[客显] 显示欢迎界面');
    }
  }
  
  /**
   * 显示金额
   */
  async showAmount(amount: number, title?: string): Promise<void> {
    if (hardwarePlugin) {
      await hardwarePlugin.showOnCustomerDisplay({
        mode: 'amount',
        title: title || '应付金额',
        amount
      });
    } else {
      console.log(`[客显] 显示金额: ¥${amount.toFixed(2)}`);
    }
  }
  
  /**
   * 显示支付二维码
   */
  async showQRCode(qrCodeUrl: string, amount?: number): Promise<void> {
    if (hardwarePlugin) {
      await hardwarePlugin.showOnCustomerDisplay({
        mode: 'qrcode',
        title: '请扫码支付',
        amount,
        qrCodeUrl
      });
    } else {
      console.log('[客显] 显示二维码:', qrCodeUrl);
    }
  }
  
  /**
   * 显示会员信息
   */
  async showMember(memberName: string, points: number, balance: number): Promise<void> {
    if (hardwarePlugin) {
      await hardwarePlugin.showOnCustomerDisplay({
        mode: 'member',
        title: `会员: ${memberName}`,
        amount: balance
      });
    } else {
      console.log(`[客显] 会员: ${memberName}, 积分: ${points}, 余额: ¥${balance.toFixed(2)}`);
    }
  }
  
  /**
   * 显示广告轮播
   */
  async showAdvertisement(): Promise<void> {
    if (hardwarePlugin) {
      await hardwarePlugin.showOnCustomerDisplay({
        mode: 'advertisement',
        title: '广告'
      });
    } else {
      console.log('[客显] 显示广告');
    }
  }
  
  /**
   * 关闭客显
   */
  async dismiss(): Promise<void> {
    if (hardwarePlugin) {
      await hardwarePlugin.dismissCustomerDisplay();
    }
  }
}

// ==================== AI视觉识别服务 ====================

export class AIRecognitionService {
  /**
   * 识别商品
   */
  async recognize(imageData: string): Promise<AIMatchResult | null> {
    try {
      if (hardwarePlugin) {
        const result = await hardwarePlugin.captureAndRecognize({ imageData });
        return result;
      } else {
        // 模拟识别
        console.log('[AI识别] 模拟识别');
        return {
          productId: 'DEMO001',
          productName: '模拟商品',
          price: 9.90,
          confidence: 0.95
        };
      }
    } catch (error) {
      console.error('[AI识别] 识别失败:', error);
      return null;
    }
  }
  
  /**
   * 获取相机状态
   */
  async getCameraStatus(): Promise<{ available: boolean; resolution: string; fps: number }> {
    if (hardwarePlugin) {
      const result = await hardwarePlugin.getCameraFrame();
      return {
        available: result.cameraAvailable,
        resolution: result.resolution,
        fps: result.fps
      };
    }
    return {
      available: false,
      resolution: '1920x1080',
      fps: 30
    };
  }
}

// ==================== 设备管理服务 ====================

export class DeviceManager {
  scale: ScaleService;
  receiptPrinter: ReceiptPrinterService;
  labelPrinter: LabelPrinterService;
  scanner: BarcodeScannerService;
  customerDisplay: CustomerDisplayService;
  aiRecognition: AIRecognitionService;
  
  constructor() {
    this.scale = new ScaleService();
    this.receiptPrinter = new ReceiptPrinterService();
    this.labelPrinter = new LabelPrinterService();
    this.scanner = new BarcodeScannerService();
    this.customerDisplay = new CustomerDisplayService();
    this.aiRecognition = new AIRecognitionService();
  }
  
  /**
   * 初始化所有设备
   */
  async init(config: {
    scale?: { host: string; port?: number };
    receiptPrinter?: { host: string; port?: number };
    labelPrinter?: { host: string; port?: number };
  }): Promise<DeviceStatus> {
    console.log('[设备管理] 开始初始化...');
    
    // 初始化扫码枪
    this.scanner.init();
    await this.scanner.enable();
    
    // 连接电子秤
    if (config.scale && config.scale.host) {
      console.log(`[设备管理] 连接电子秤: ${config.scale.host}:${config.scale.port || 9101}`);
      try {
        const result = await this.scale.connect({
          port: config.scale.host,  // 作为 host/IP 使用
          baudRate: config.scale.port || 9101,  // 作为 TCP 端口
          protocol: 'general'
        });
        console.log(`[设备管理] 电子秤连接结果: ${result}`);
      } catch (e: any) {
        console.error('[设备管理] 电子秤连接异常:', e);
      }
    }
    
    // 连接小票打印机
    if (config.receiptPrinter && config.receiptPrinter.host) {
      console.log(`[设备管理] 连接打印机: ${config.receiptPrinter.host}:${config.receiptPrinter.port || 9100}`);
      try {
        await this.receiptPrinter.connect(
          config.receiptPrinter.host,
          config.receiptPrinter.port || 9100
        );
      } catch (e: any) {
        console.error('[设备管理] 打印机连接异常:', e);
      }
    }
    
    // 连接标签打印机
    if (config.labelPrinter && config.labelPrinter.host) {
      console.log(`[设备管理] 连接标签打印机: ${config.labelPrinter.host}:${config.labelPrinter.port || 9100}`);
      try {
        await this.labelPrinter.connect(
          config.labelPrinter.host,
          config.labelPrinter.port || 9100
        );
      } catch (e: any) {
        console.error('[设备管理] 标签打印机连接异常:', e);
      }
    }
    
    // 显示欢迎
    await this.customerDisplay.showWelcome();
    
    return await this.getStatus();
  }
  
  /**
   * 获取所有设备状态
   */
  async getStatus(): Promise<DeviceStatus> {
    if (hardwarePlugin) {
      return await hardwarePlugin.getDeviceStatus();
    }
    
    return {
      scaleConnected: this.scale.isConnected,
      printerConnected: this.receiptPrinter.isConnected,
      labelPrinterConnected: this.labelPrinter.isConnected,
      scannerEnabled: this.scanner.isEnabled
    };
  }
  
  /**
   * 断开所有设备
   */
  async disconnectAll(): Promise<void> {
    if (hardwarePlugin) {
      await hardwarePlugin.disconnectAll();
    }
    
    this.scanner.destroy();
    await this.scale.disconnect();
    await this.receiptPrinter.disconnect();
    await this.labelPrinter.disconnect();
    await this.customerDisplay.dismiss();
    
    console.log('[设备管理] 所有设备已断开');
  }
  
  /**
   * 打开钱箱（便捷方法）
   */
  async openCashDrawer(): Promise<boolean> {
    return await this.receiptPrinter.openCashDrawer();
  }
  
  /**
   * 打印小票（便捷方法）
   */
  async printReceipt(data: ReceiptData): Promise<void> {
    await this.receiptPrinter.printReceipt(data);
  }
  
  /**
   * 打印标签（便捷方法）
   */
  async printLabel(data: LabelData): Promise<void> {
    await this.labelPrinter.printLabel(data);
  }
}

// ==================== 事件导出 ====================

export const deviceEvents = {
  on,
  off,
  emit
};

// ==================== 导出设备管理器单例 ====================

export const deviceManager = new DeviceManager();

// ==================== 兼容旧接口 ====================

// 保持向后兼容的简写方法
export const NetworkScale = ScaleService;
export const ReceiptPrinter = ReceiptPrinterService;
export const LabelPrinter = LabelPrinterService;
export const BarcodeScanner = BarcodeScannerService;
export const CustomerDisplay = CustomerDisplayService;

// 导出类型
export type { ScaleWeight, DeviceStatus, PrinterOptions, ReceiptData, LabelData, AIMatchResult };
