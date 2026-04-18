/**
 * 海邻到家一体机硬件服务层 V6.0
 * 完整支持：电子秤、打印机、钱箱、扫码枪、客显屏、AI识别
 */
import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

// ==================== 插件类型定义 ====================

interface ScaleWeight {
  weight: number;
  unit: string;
  stable: boolean;
  timestamp: number;
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

if (Capacitor.isNativePlatform()) {
  try {
    hardwarePlugin = registerPlugin('DevicePlugin') as HailinHardwarePlugin;
    console.log('[硬件服务] 原生插件已加载');
  } catch (e) {
    console.warn('[硬件服务] 原生插件未安装，将使用模拟实现');
  }
}

// ==================== 事件总线 ====================

type EventCallback = (data: any) => void;
const eventListeners: Map<string, Set<EventCallback>> = new Map();

// 转发原生事件到前端
if (hardwarePlugin) {
  hardwarePlugin.addListener('scaleData', (data) => {
    emit('scaleData', data);
  });
  hardwarePlugin.addListener('barcodeScanned', (data) => {
    emit('barcodeScanned', data);
  });
}

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

// ==================== 电子秤服务 ====================

export class ScaleService {
  private connected = false;
  private connectionId = 'scale';
  private protocol = 'general';
  private lastWeight: ScaleWeight | null = null;
  private pollingInterval: number | null = null;
  
  /**
   * 连接电子秤
   */
  async connect(options: {
    port?: string;
    baudRate?: number;
    protocol?: string;
  } = {}): Promise<boolean> {
    const { port = '/dev/ttyS0', baudRate = 9600, protocol = 'general' } = options;
    this.protocol = protocol;
    
    try {
      if (hardwarePlugin) {
        // 优先尝试网络秤
        const tcpResult = await hardwarePlugin.scaleConnectTcp({
          host: port,
          port: 9101,
          protocol
        });
        this.connected = tcpResult.success;
        this.connectionId = 'scale_tcp';
      } else {
        // 模拟连接
        this.connected = true;
        console.log('[秤] 模拟连接成功');
      }
      
      if (this.connected) {
        // 监听秤数据
        on('scaleData', this.handleScaleData);
      }
      
      return this.connected;
    } catch (error) {
      console.error('[秤] 连接失败:', error);
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
    if (config.scale) {
      await this.scale.connect({
        port: config.scale.host,
        baudRate: config.scale.port || 9101,
        protocol: 'general'
      });
    }
    
    // 连接小票打印机
    if (config.receiptPrinter) {
      await this.receiptPrinter.connect(
        config.receiptPrinter.host,
        config.receiptPrinter.port || 9100
      );
    }
    
    // 连接标签打印机
    if (config.labelPrinter) {
      await this.labelPrinter.connect(
        config.labelPrinter.host,
        config.labelPrinter.port || 9100
      );
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
