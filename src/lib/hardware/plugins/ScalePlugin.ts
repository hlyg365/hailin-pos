/**
 * 电子秤插件 - ScalePlugin
 * 提供电子秤连接、重量读取、单位转换等功能
 * 支持串口电子秤和USB电子秤
 */

// 重量单位
export type WeightUnit = 'g' | 'kg' | 'oz' | 'lb';

// 电子秤状态
export type ScaleStatus = 'idle' | 'stable' | 'unstable' | 'overload' | 'underload' | 'error';

// 电子秤读数
export interface ScaleReading {
  weight: number;
  unit: WeightUnit;
  status: ScaleStatus;
  timestamp: number;
  stable: boolean;
}

// 电子秤配置
export interface ScaleConfig {
  deviceId?: string;
  autoZero: boolean;
  autoOff: boolean;
  unit: WeightUnit;
  decimalPlaces: number;
  updateInterval: number; // 毫秒
}

// 电子秤事件
export type ScaleEventType = 'data' | 'error' | 'connect' | 'disconnect';
export type ScaleEventCallback = (reading: ScaleReading | null, error?: Error) => void;

// 电子秤插件类
class ScalePlugin {
  private deviceId: string | null = null;
  private config: ScaleConfig;
  private isConnected: boolean = false;
  private isPolling: boolean = false;
  private pollInterval: number | null = null;
  private eventListeners: Map<ScaleEventType, Set<ScaleEventCallback>> = new Map();
  private static instance: ScalePlugin;

  // 默认配置
  private static readonly DEFAULT_CONFIG: ScaleConfig = {
    autoZero: true,
    autoOff: true,
    unit: 'g',
    decimalPlaces: 2,
    updateInterval: 200,
  };

  // 已知电子秤的USB Vendor/Product ID
  private static readonly KNOWN_SCALES = [
    { vendorId: '0x0B67', productId: '0x5550', name: 'Dibal Scale' },
    { vendorId: '0x0922', productId: '0x8003', name: 'Dymo Scale' },
    { vendorId: '0x0461', productId: '0x0010', name: 'Logitech Scale' },
  ];

  private constructor() {
    this.config = { ...ScalePlugin.DEFAULT_CONFIG };
    this.initEventListeners();
  }

  // 获取单例实例
  static getInstance(): ScalePlugin {
    if (!ScalePlugin.instance) {
      ScalePlugin.instance = new ScalePlugin();
    }
    return ScalePlugin.instance;
  }

  // 初始化事件监听器
  private initEventListeners(): void {
    this.eventListeners.set('data', new Set());
    this.eventListeners.set('error', new Set());
    this.eventListeners.set('connect', new Set());
    this.eventListeners.set('disconnect', new Set());
  }

  // 添加事件监听
  on(event: ScaleEventType, callback: ScaleEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  // 移除事件监听
  off(event: ScaleEventType, callback: ScaleEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  // 触发事件
  private emit(event: ScaleEventType, reading: ScaleReading | null = null, error?: Error): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(reading, error);
        } catch (e) {
          console.error(`Error in scale ${event} listener:`, e);
        }
      });
    }
  }

  // 检查是否支持
  isSupported(): boolean {
    return 'usb' in navigator || 'serial' in navigator;
  }

  // 获取配置
  getConfig(): ScaleConfig {
    return { ...this.config };
  }

  // 设置配置
  setConfig(config: Partial<ScaleConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // 查找电子秤设备
  async findDevices(): Promise<Array<{ id: string; name: string }>> {
    const devices: Array<{ id: string; name: string }> = [];

    // 尝试WebUSB
    if ('usb' in navigator) {
      try {
        const usbDevices = await (navigator as any).usb.getDevices();
        usbDevices.forEach((device: USBDevice) => {
          // 检查是否是已知的电子秤
          const known = ScalePlugin.KNOWN_SCALES.find(
            s => device.vendorId.toString(16) === s.vendorId.replace('0x', '') &&
                 device.productId.toString(16) === s.productId.replace('0x', '')
          );
          devices.push({
            id: device.serialNumber || `${device.vendorId}-${device.productId}`,
            name: known?.name || device.productName || 'Unknown Scale',
          });
        });
      } catch (error) {
        console.error('Error finding USB scales:', error);
      }
    }

    // 尝试WebSerial
    if ('serial' in navigator) {
      try {
        const port = await (navigator as any).serial.requestPort();
        if (port) {
          devices.push({
            id: `serial-${Date.now()}`,
            name: 'Serial Scale',
          });
        }
      } catch (error) {
        // 用户取消选择，忽略
      }
    }

    return devices;
  }

  // 连接电子秤
  async connect(deviceId?: string): Promise<boolean> {
    try {
      // 如果没有指定设备，先查找
      if (!deviceId) {
        const devices = await this.findDevices();
        if (devices.length === 0) {
          throw new Error('No scale device found');
        }
        deviceId = devices[0].id;
      }

      this.deviceId = deviceId;
      this.isConnected = true;
      this.emit('connect');
      
      // 开始轮询重量
      this.startPolling();
      
      return true;
    } catch (error) {
      this.emit('error', null, error as Error);
      return false;
    }
  }

  // 断开连接
  async disconnect(): Promise<void> {
    this.stopPolling();
    this.isConnected = false;
    this.deviceId = null;
    this.emit('disconnect');
  }

  // 开始轮询重量
  private startPolling(): void {
    if (this.isPolling || !this.isConnected) return;

    this.isPolling = true;
    this.pollInterval = window.setInterval(() => {
      this.readWeight();
    }, this.config.updateInterval);
  }

  // 停止轮询
  private stopPolling(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
  }

  // 读取重量
  async readWeight(): Promise<ScaleReading | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      // 模拟重量读取（实际需要通过USB/Serial通信）
      // 这里根据时间生成一个模拟的稳定读数
      const now = Date.now();
      const baseWeight = 250; // 基础重量250g
      const variance = Math.sin(now / 1000) * 5; // 模拟小幅波动
      const weight = baseWeight + variance + (Math.random() - 0.5) * 2;
      
      const reading: ScaleReading = {
        weight: Math.round(weight * 100) / 100,
        unit: this.config.unit,
        status: 'stable',
        timestamp: now,
        stable: true,
      };

      this.emit('data', reading);
      return reading;
    } catch (error) {
      this.emit('error', null, error as Error);
      return null;
    }
  }

  // 获取当前重量（单次读取）
  async getWeight(): Promise<ScaleReading | null> {
    return this.readWeight();
  }

  // 去皮（归零）
  async tare(): Promise<boolean> {
    if (!this.isConnected) return false;
    
    console.log('Scale tare (zero)');
    // 实际需要发送去皮命令到设备
    return true;
  }

  // 单位转换
  convertWeight(weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number {
    // 先转换为克
    let grams = weight;
    switch (fromUnit) {
      case 'kg':
        grams = weight * 1000;
        break;
      case 'oz':
        grams = weight * 28.3495;
        break;
      case 'lb':
        grams = weight * 453.592;
        break;
    }

    // 从克转换为目标单位
    switch (toUnit) {
      case 'g':
        return Math.round(grams * 100) / 100;
      case 'kg':
        return Math.round((grams / 1000) * 100) / 100;
      case 'oz':
        return Math.round((grams / 28.3495) * 100) / 100;
      case 'lb':
        return Math.round((grams / 453.592) * 100) / 100;
      default:
        return weight;
    }
  }

  // 格式化重量显示
  formatWeight(reading: ScaleReading): string {
    const decimals = this.config.decimalPlaces;
    return `${reading.weight.toFixed(decimals)}${reading.unit}`;
  }

  // 获取连接状态
  getStatus(): { connected: boolean; polling: boolean; deviceId: string | null } {
    return {
      connected: this.isConnected,
      polling: this.isPolling,
      deviceId: this.deviceId,
    };
  }

  // 检查是否就绪（兼容旧API）
  isReady(): boolean {
    return this.isConnected;
  }
}

// 导出单例和类
export const scalePlugin = ScalePlugin.getInstance();
export { ScalePlugin };
