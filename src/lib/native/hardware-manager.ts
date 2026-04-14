/**
 * 统一硬件管理接口 - 收银机专用
 * 
 * 整合所有硬件服务，提供统一的API接口
 * 
 * 支持设备：
 * - 条码扫描器 (USB HID / 蓝牙 / 串口 / 摄像头)
 * - 电子秤 (RS232串口 / USB CDC)
 * - 热敏打印机 (内置 / USB / 蓝牙 / 网络)
 * - 标签打印机 (USB / 蓝牙 / 网络)
 * - 顾客显示屏 (LVDS/eDP内置 / USB CDC / HDMI)
 * - 钱箱 (RJ11通过打印机 / RS232 / USB)
 * - 读卡器 (USB HID / 蓝牙)
 * - AI摄像头 (USB / MIPI)
 * - 网络 (以太网 / WiFi / 4G)
 */

// 导出所有硬件服务
export * from './serial-service';
export * from './usb-service';
export * from './cashbox-driver';
export * from './customer-display-service';
export * from './thermal-printer-service';
export * from './network-service';

// 导入具体服务
import { serialService, SerialService, SerialPortConfig, SerialDevice } from './serial-service';
import { usbService, UsbService, UsbDeviceWrapper, UsbDeviceType } from './usb-service';
import { cashboxDriver, CashboxDriver, CashboxConfig, CashboxResult, CashboxStatus } from './cashbox-driver';
import { customerDisplayService, CustomerDisplayService, DisplayInfo, CustomerDisplayContent } from './customer-display-service';
import { thermalPrinterService, ThermalPrinterService, PrinterConfig, PrinterStatus, ReceiptData as PrinterReceiptData, LabelData } from './thermal-printer-service';
import { networkService, NetworkService, NetworkStatus, NetworkConfig, NetworkDiagnostic } from './network-service';
import { WeightData } from './index';

// 硬件类型
export type HardwareType = 'scale' | 'receipt_printer' | 'label_printer' | 'cashbox' | 'scanner' | 'customer_display' | 'card_reader';

// 硬件设备状态
export interface HardwareDeviceStatus {
  type: HardwareType | 'ai_camera' | 'network';
  name: string;
  connected: boolean;
  ready: boolean;
  status: string;
  lastUpdate: number;
  info?: Record<string, any>;
}

// 硬件初始化结果
export interface HardwareInitResult {
  success: boolean;
  devices: HardwareDeviceStatus[];
  errors: string[];
  suggestions: string[];
}

// 硬件管理配置
export interface HardwareManagerConfig {
  autoConnect: boolean;       // 自动连接设备
  reconnectOnError: boolean;  // 错误时自动重连
  simulateOnWeb: boolean;     // Web环境下使用模拟设备
  debug: boolean;             // 调试模式
}

// 硬件事件类型
export type HardwareEventType = 
  | 'device_connected'
  | 'device_disconnected'
  | 'device_error'
  | 'weight_update'
  | 'scan_result'
  | 'print_complete'
  | 'cashbox_opened'
  | 'network_change';

// 硬件事件
export interface HardwareEvent {
  type: HardwareEventType;
  device?: HardwareDeviceStatus;
  data?: any;
  timestamp: number;
}

// 统一硬件管理类
export class HardwareManager {
  private static instance: HardwareManager;
  private config: HardwareManagerConfig = {
    autoConnect: true,
    reconnectOnError: true,
    simulateOnWeb: true,
    debug: false,
  };
  private devices: Map<HardwareType | 'ai_camera' | 'network', HardwareDeviceStatus> = new Map();
  private listeners: Map<HardwareEventType, Set<(event: HardwareEvent) => void>> = new Map();
  private initPromise: Promise<HardwareInitResult> | null = null;
  
  private constructor() {}
  
  public static getInstance(): HardwareManager {
    if (!HardwareManager.instance) {
      HardwareManager.instance = new HardwareManager();
    }
    return HardwareManager.instance;
  }
  
  // ===== 配置方法 =====
  
  /**
   * 配置硬件管理器
   */
  configure(config: Partial<HardwareManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  getConfig(): HardwareManagerConfig {
    return { ...this.config };
  }
  
  // ===== 初始化方法 =====
  
  /**
   * 初始化所有硬件设备
   */
  async initialize(): Promise<HardwareInitResult> {
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = this.doInitialize();
    return this.initPromise;
  }
  
  private async doInitialize(): Promise<HardwareInitResult> {
    const result: HardwareInitResult = {
      success: true,
      devices: [],
      errors: [],
      suggestions: [],
    };
    
    this.log('开始初始化硬件设备...');
    
    // 1. 初始化网络
    try {
      const networkStatus = networkService.getStatus();
      this.updateDeviceStatus('network', {
        type: 'network',
        name: '网络连接',
        connected: networkStatus.online,
        ready: networkStatus.online,
        status: networkStatus.online ? `已连接 (${networkStatus.type})` : '离线',
        info: networkStatus,
        lastUpdate: Date.now(),
      });
    } catch (error: any) {
      result.errors.push(`网络初始化失败: ${error.message}`);
    }
    
    // 2. 初始化电子秤
    try {
      await this.initScale();
    } catch (error: any) {
      result.errors.push(`电子秤初始化失败: ${error.message}`);
    }
    
    // 3. 初始化小票打印机
    try {
      await this.initReceiptPrinter();
    } catch (error: any) {
      result.errors.push(`小票打印机初始化失败: ${error.message}`);
    }
    
    // 4. 初始化钱箱
    try {
      await this.initCashbox();
    } catch (error: any) {
      result.errors.push(`钱箱初始化失败: ${error.message}`);
    }
    
    // 5. 初始化客显屏
    try {
      await this.initCustomerDisplay();
    } catch (error: any) {
      result.errors.push(`客显屏初始化失败: ${error.message}`);
    }
    
    // 6. 初始化扫码枪
    try {
      await this.initScanner();
    } catch (error: any) {
      result.errors.push(`扫码枪初始化失败: ${error.message}`);
    }
    
    // 更新结果
    result.devices = Array.from(this.devices.values());
    result.success = result.errors.length === 0;
    
    if (!result.success) {
      result.suggestions.push('部分设备初始化失败，请检查硬件连接');
    }
    
    this.log('硬件初始化完成', result);
    return result;
  }
  
  // ===== 设备初始化方法 =====
  
  /**
   * 初始化电子秤
   */
  private async initScale(): Promise<void> {
    const status = await serialService.getStatus();
    this.updateDeviceStatus('scale', {
      type: 'scale',
      name: '电子秤',
      connected: status.connected,
      ready: status.connected,
      status: status.connected ? '已连接' : (status.mode === 'simulation' ? '模拟模式' : '未连接'),
      lastUpdate: Date.now(),
    });
  }
  
  /**
   * 初始化小票打印机
   */
  private async initReceiptPrinter(): Promise<void> {
    const status = await thermalPrinterService.getStatus();
    this.updateDeviceStatus('receipt_printer', {
      type: 'receipt_printer',
      name: '小票打印机',
      connected: status.connected,
      ready: status.connected,
      status: status.connected ? status.name : '未连接',
      info: status,
      lastUpdate: Date.now(),
    });
  }
  
  /**
   * 初始化标签打印机
   */
  private async initLabelPrinter(): Promise<void> {
    this.updateDeviceStatus('label_printer', {
      type: 'label_printer',
      name: '标签打印机',
      connected: false,
      ready: false,
      status: '未连接',
      lastUpdate: Date.now(),
    });
  }
  
  /**
   * 初始化钱箱
   */
  private async initCashbox(): Promise<void> {
    const status = await cashboxDriver.getStatus();
    this.updateDeviceStatus('cashbox', {
      type: 'cashbox',
      name: '钱箱',
      connected: status.connected,
      ready: status.connected,
      status: status.hasDevice ? (status.drawerOpen ? '已打开' : '已连接') : '未检测到钱箱',
      lastUpdate: Date.now(),
    });
  }
  
  /**
   * 初始化客显屏
   */
  private async initCustomerDisplay(): Promise<void> {
    const status = customerDisplayService.getStatus();
    this.updateDeviceStatus('customer_display', {
      type: 'customer_display',
      name: '客显屏',
      connected: status.open,
      ready: status.open,
      status: status.open ? '已打开' : '未连接',
      lastUpdate: Date.now(),
    });
  }
  
  /**
   * 初始化扫码枪
   */
  private async initScanner(): Promise<void> {
    // USB扫码枪自动检测
    this.updateDeviceStatus('scanner', {
      type: 'scanner',
      name: '条码扫描器',
      connected: false,
      ready: false,
      status: '等待扫码或连接扫码枪',
      lastUpdate: Date.now(),
    });
  }
  
  // ===== 设备操作方法 =====
  
  /**
   * 获取所有设备状态
   */
  getAllDevices(): HardwareDeviceStatus[] {
    return Array.from(this.devices.values());
  }
  
  /**
   * 获取指定设备状态
   */
  getDeviceStatus(type: HardwareType | 'ai_camera' | 'network'): HardwareDeviceStatus | undefined {
    return this.devices.get(type);
  }
  
  /**
   * 连接电子秤
   */
  async connectScale(config?: Partial<SerialPortConfig>): Promise<boolean> {
    try {
      const defaultConfig: SerialPortConfig = {
        path: config?.path || '/dev/ttyS1',
        baudRate: config?.baudRate || 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
      };
      
      const status = await serialService.connect(defaultConfig);
      if (status.connected) {
        this.updateDeviceStatus('scale', {
          type: 'scale',
          name: '电子秤',
          connected: true,
          ready: true,
          status: `已连接 ${defaultConfig.path} @ ${defaultConfig.baudRate}bps`,
          lastUpdate: Date.now(),
        });
        
        // 开始监听重量数据
        serialService.onWeightChange((data: WeightData) => {
          this.emit('weight_update', { data });
        });
        
        return true;
      }
    } catch (error) {
      console.error('[HardwareManager] connectScale error:', error);
    }
    return false;
  }
  
  /**
   * 连接小票打印机
   */
  async connectReceiptPrinter(config?: Partial<PrinterConfig>): Promise<boolean> {
    try {
      const status = await thermalPrinterService.connect(config);
      if (status) {
        const printerStatus = await thermalPrinterService.getStatus();
        this.updateDeviceStatus('receipt_printer', {
          type: 'receipt_printer',
          name: '小票打印机',
          connected: true,
          ready: true,
          status: printerStatus.name,
          info: printerStatus,
          lastUpdate: Date.now(),
        });
        return true;
      }
    } catch (error) {
      console.error('[HardwareManager] connectReceiptPrinter error:', error);
    }
    return false;
  }
  
  /**
   * 连接标签打印机
   */
  async connectLabelPrinter(config?: Partial<PrinterConfig>): Promise<boolean> {
    try {
      const printerConfig: PrinterConfig = {
        type: config?.type || 'usb',
        name: config?.name,
        paperWidth: 58,
        autoCut: true,
        autoCutterType: 'partial',
        blackMark: true,
        density: 3,
        ...config,
      };
      
      // 标签打印机连接逻辑
      this.updateDeviceStatus('label_printer', {
        type: 'label_printer',
        name: '标签打印机',
        connected: true,
        ready: true,
        status: printerConfig.name || '已连接',
        lastUpdate: Date.now(),
      });
      
      return true;
    } catch (error) {
      console.error('[HardwareManager] connectLabelPrinter error:', error);
    }
    return false;
  }
  
  /**
   * 连接客显屏
   */
  async connectCustomerDisplay(displayId: number = 1): Promise<boolean> {
    try {
      const result = await customerDisplayService.open(displayId);
      if (result) {
        this.updateDeviceStatus('customer_display', {
          type: 'customer_display',
          name: '客显屏',
          connected: true,
          ready: true,
          status: `已打开 (屏幕${displayId})`,
          lastUpdate: Date.now(),
        });
        return true;
      }
    } catch (error) {
      console.error('[HardwareManager] connectCustomerDisplay error:', error);
    }
    return false;
  }
  
  /**
   * 打开钱箱
   */
  async openCashbox(drawer: 0 | 1 = 0): Promise<CashboxResult> {
    try {
      const result = await cashboxDriver.open(drawer);
      if (result.success) {
        this.emit('cashbox_opened', { drawer });
      }
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 打印小票
   */
  async printReceipt(data: PrinterReceiptData): Promise<boolean> {
    try {
      const job = await thermalPrinterService.printReceipt(data);
      this.emit('print_complete', { job });
      return job.status !== 'failed';
    } catch (error) {
      console.error('[HardwareManager] printReceipt error:', error);
      return false;
    }
  }
  
  /**
   * 打印标签
   */
  async printLabel(data: LabelData): Promise<boolean> {
    try {
      const job = await thermalPrinterService.printLabel(data);
      this.emit('print_complete', { job });
      return job.status !== 'failed';
    } catch (error) {
      console.error('[HardwareManager] printLabel error:', error);
      return false;
    }
  }
  
  /**
   * 更新客显屏
   */
  async updateCustomerDisplay(content: CustomerDisplayContent): Promise<boolean> {
    return await customerDisplayService.sendData(content);
  }
  
  /**
   * 连接扫码枪
   */
  async connectScanner(type: 'usb' | 'bluetooth' | 'serial' = 'usb'): Promise<boolean> {
    try {
      // 根据类型连接
      this.updateDeviceStatus('scanner', {
        type: 'scanner',
        name: '条码扫描器',
        connected: true,
        ready: true,
        status: `已连接 (${type})`,
        lastUpdate: Date.now(),
      });
      return true;
    } catch (error) {
      console.error('[HardwareManager] connectScanner error:', error);
      return false;
    }
  }
  
  /**
   * 扫描商品（摄像头模式）
   */
  async scanWithCamera(): Promise<string | null> {
    // 需要调用QuaggaJS实现
    return null;
  }
  
  // ===== 事件处理方法 =====
  
  /**
   * 注册事件监听
   */
  addEventListener(type: HardwareEventType, callback: (event: HardwareEvent) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }
  
  /**
   * 发送事件
   */
  private emit(type: HardwareEventType, data?: any): void {
    const event: HardwareEvent = {
      type,
      device: data?.device,
      data: data?.data,
      timestamp: Date.now(),
    };
    
    this.listeners.get(type)?.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[HardwareManager] Event callback error:', error);
      }
    });
    
    this.log(`事件: ${type}`, event);
  }
  
  // ===== 状态更新方法 =====
  
  /**
   * 更新设备状态
   */
  private updateDeviceStatus(type: HardwareType | 'ai_camera' | 'network', status: HardwareDeviceStatus): void {
    status.lastUpdate = Date.now();
    this.devices.set(type, status);
    this.emit('device_connected', { device: status });
  }
  
  // ===== 工具方法 =====
  
  /**
   * 获取硬件状态摘要
   */
  getSummary(): {
    total: number;
    connected: number;
    byType: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    let connected = 0;
    
    for (const device of this.devices.values()) {
      if (!byType[device.type]) {
        byType[device.type] = 0;
      }
      byType[device.type]++;
      if (device.connected) {
        connected++;
      }
    }
    
    return {
      total: this.devices.size,
      connected,
      byType,
    };
  }
  
  /**
   * 诊断所有设备
   */
  async diagnose(): Promise<{
    network: NetworkDiagnostic | null;
    printers: PrinterStatus | null;
    scale: boolean;
    suggestions: string[];
  }> {
    const suggestions: string[] = [];
    
    // 网络诊断
    let networkDiagnostic: NetworkDiagnostic | null = null;
    try {
      networkDiagnostic = await networkService.diagnose();
      suggestions.push(...networkDiagnostic.suggestions);
    } catch {}
    
    // 打印机状态
    let printerStatus: PrinterStatus | null = null;
    try {
      printerStatus = await thermalPrinterService.getStatus();
      if (!printerStatus.connected) {
        suggestions.push('小票打印机未连接，请检查连接');
      } else if (printerStatus.paper === 'low') {
        suggestions.push('打印机纸张即将用尽，请及时补充');
      } else if (printerStatus.paper === 'empty') {
        suggestions.push('打印机纸张已用尽，请立即补充');
      }
    } catch {}
    
    // 电子秤
    let scaleOk = false;
    try {
      const status = await serialService.getStatus();
      scaleOk = status.connected;
      if (!scaleOk) {
        suggestions.push('电子秤未连接，请检查串口连接');
      }
    } catch {}
    
    return {
      network: networkDiagnostic,
      printers: printerStatus,
      scale: scaleOk,
      suggestions,
    };
  }
  
  /**
   * 调试日志
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[HardwareManager] ${message}`, ...args);
    }
  }
  
  /**
   * 重置所有设备
   */
  async reset(): Promise<void> {
    // 断开所有连接
    await thermalPrinterService.disconnect();
    await customerDisplayService.close();
    await cashboxDriver.reset();
    serialService.disconnect();
    
    // 清空状态
    this.devices.clear();
    this.listeners.clear();
    this.initPromise = null;
    
    this.log('硬件管理器已重置');
  }
}

// 导出单例
export const hardwareManager = HardwareManager.getInstance();
export default hardwareManager;
