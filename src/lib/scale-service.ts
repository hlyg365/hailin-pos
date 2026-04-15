/**
 * 电子秤服务
 * 提供电子秤连接、称重、数据解析等功能的封装
 */

import { Capacitor } from '@capacitor/core';

// Scale Plugin接口定义
declare global {
  interface Window {
    CapacitorPlugins?: {
      ScalePlugin?: {
        connect: (options: any) => Promise<any>;
        disconnect: () => Promise<void>;
        connectBluetooth: (options: any) => Promise<any>;
        tare: () => Promise<any>;
        zero: () => Promise<any>;
        getWeight: () => Promise<any>;
        addListener: (event: string, callback: (event: any) => void) => void;
        removeAllListeners: () => void;
      };
    };
  }
}

// 获取ScalePlugin
const ScalePlugin = (window as any).CapacitorPlugins?.ScalePlugin;

// 电子秤类型
export type ScaleType = 'topscale' | 'common' | 'bluetooth' | 'usb';

// 电子秤状态
export interface ScaleStatus {
  connected: boolean;
  deviceName: string;
  deviceType: ScaleType;
  battery?: number;
  stable: boolean;
}

// 称重数据
export interface WeightData {
  weight: number;           // 重量（克）
  weightKg: number;         // 重量（千克）
  unit: 'g' | 'kg';         // 单位
  stable: boolean;          // 是否稳定
  timestamp: number;        // 时间戳
  rawData?: string;         // 原始数据
}

// 电子秤配置
export interface ScaleConfig {
  type: ScaleType;
  deviceId?: string;
  deviceName?: string;
  autoReconnect: boolean;
  reconnectInterval: number;  // 重连间隔（毫秒）
}

// 事件回调
export type WeightCallback = (data: WeightData) => void;
export type StatusCallback = (status: ScaleStatus) => void;
export type ErrorCallback = (error: Error) => void;

class ScaleService {
  private static instance: ScaleService;
  
  private currentStatus: ScaleStatus = {
    connected: false,
    deviceName: '',
    deviceType: 'common',
    stable: false,
  };
  
  private config: ScaleConfig = {
    type: 'common',
    autoReconnect: true,
    reconnectInterval: 3000,
  };
  
  private weightCallbacks: WeightCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isListening = false;
  
  private constructor() {
    // 初始化
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(): ScaleService {
    if (!ScaleService.instance) {
      ScaleService.instance = new ScaleService();
    }
    return ScaleService.instance;
  }
  
  /**
   * 获取当前状态
   */
  getStatus(): ScaleStatus {
    return { ...this.currentStatus };
  }
  
  /**
   * 获取当前配置
   */
  getConfig(): ScaleConfig {
    return { ...this.config };
  }
  
  /**
   * 配置电子秤
   */
  async configure(config: Partial<ScaleConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    // 如果已连接，需要重新连接
    if (this.currentStatus.connected) {
      await this.disconnect();
    }
  }
  
  /**
   * 连接电子秤
   */
  async connect(config?: Partial<ScaleConfig>): Promise<boolean> {
    if (config) {
      await this.configure(config);
    }
    
    try {
      // 根据类型选择连接方式
      switch (this.config.type) {
        case 'topscale':
          return await this.connectTopScale();
        case 'usb':
          return await this.connectUsb();
        case 'bluetooth':
          return await this.connectBluetooth();
        default:
          return await this.connectCommon();
      }
    } catch (error) {
      this.handleError(error as Error);
      return false;
    }
  }
  
  /**
   * 连接顶尖电子秤（通过串口）
   */
  private async connectTopScale(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('TopScale requires native platform');
      return false;
    }
    
    try {
      // 调用原生插件连接
      const result = await ScalePlugin.connect({
        type: 'serial',
        deviceId: this.config.deviceId || 'default',
        deviceName: this.config.deviceName || '顶尖电子秤',
      });
      
      if (result.success) {
        this.updateStatus({
          connected: true,
          deviceName: result.deviceName || '顶尖电子秤',
          deviceType: 'topscale',
        });
        
        this.startListening();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to connect TopScale:', error);
      return false;
    }
  }
  
  /**
   * 连接USB电子秤
   */
  private async connectUsb(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('USB Scale requires native platform');
      return false;
    }
    
    try {
      const result = await ScalePlugin.connect({
        type: 'usb',
        deviceId: this.config.deviceId,
        deviceName: this.config.deviceName || 'USB电子秤',
      });
      
      if (result.success) {
        this.updateStatus({
          connected: true,
          deviceName: result.deviceName || 'USB电子秤',
          deviceType: 'usb',
        });
        
        this.startListening();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to connect USB Scale:', error);
      return false;
    }
  }
  
  /**
   * 连接蓝牙电子秤
   */
  private async connectBluetooth(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Bluetooth Scale requires native platform');
      return false;
    }
    
    try {
      const result = await ScalePlugin.connectBluetooth({
        deviceId: this.config.deviceId,
      });
      
      if (result.success) {
        this.updateStatus({
          connected: true,
          deviceName: result.deviceName || '蓝牙电子秤',
          deviceType: 'bluetooth',
        });
        
        this.startListening();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to connect Bluetooth Scale:', error);
      return false;
    }
  }
  
  /**
   * 连接通用电子秤（模拟/测试）
   */
  private async connectCommon(): Promise<boolean> {
    // 模拟连接成功
    this.updateStatus({
      connected: true,
      deviceName: '模拟电子秤',
      deviceType: 'common',
    });
    
    this.startListening();
    return true;
  }
  
  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    this.stopListening();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (Capacitor.isNativePlatform()) {
      try {
        await ScalePlugin.disconnect();
      } catch (error) {
        console.error('Failed to disconnect scale:', error);
      }
    }
    
    this.updateStatus({
      connected: false,
      deviceName: '',
      stable: false,
    });
  }
  
  /**
   * 开始监听称重数据
   */
  private startListening(): void {
    if (this.isListening) return;
    this.isListening = true;
    
    if (Capacitor.isNativePlatform()) {
      // 监听原生事件
      ScalePlugin.addListener('onWeightData', (event: any) => {
        const weightData = this.parseWeightData(event.data);
        this.notifyWeightCallbacks(weightData);
      });
      
      ScalePlugin.addListener('onScaleStatus', (event: any) => {
        this.updateStatus({
          ...this.currentStatus,
          ...event.status,
        });
      });
      
      ScalePlugin.addListener('onScaleError', (event: any) => {
        this.handleError(new Error(event.error));
      });
    } else {
      // 模拟数据（Web环境）
      this.simulateWeightData();
    }
  }
  
  /**
   * 停止监听
   */
  private stopListening(): void {
    this.isListening = false;
    
    if (Capacitor.isNativePlatform()) {
      ScalePlugin.removeAllListeners();
    }
  }
  
  /**
   * 模拟称重数据（Web环境测试用）
   */
  private simulateWeightData(): void {
    if (!this.isListening) return;
    
    // 模拟随机重量
    const baseWeight = 100 + Math.random() * 900; // 100-1000g
    const stable = Math.random() > 0.2;
    
    const weightData: WeightData = {
      weight: Math.round(baseWeight * 10) / 10,
      weightKg: Math.round(baseWeight * 100) / 100000,
      unit: 'g',
      stable,
      timestamp: Date.now(),
    };
    
    this.notifyWeightCallbacks(weightData);
    
    // 每500ms更新一次
    setTimeout(() => this.simulateWeightData(), 500);
  }
  
  /**
   * 解析称重数据
   */
  private parseWeightData(rawData: string | any): WeightData {
    if (typeof rawData === 'string') {
      // 尝试解析顶尖OS2协议
      try {
        return this.parseTopScaleOS2(rawData);
      } catch {
        // 解析失败，返回默认值
        return {
          weight: 0,
          weightKg: 0,
          unit: 'g',
          stable: false,
          timestamp: Date.now(),
          rawData,
        };
      }
    }
    
    // 直接是对象
    return {
      weight: rawData.weight || 0,
      weightKg: rawData.weightKg || 0,
      unit: rawData.unit || 'g',
      stable: rawData.stable || false,
      timestamp: rawData.timestamp || Date.now(),
      rawData: JSON.stringify(rawData),
    };
  }
  
  /**
   * 解析顶尖OS2协议数据
   */
  private parseTopScaleOS2(data: string): WeightData {
    // 顶尖OS2协议格式：STX + 数据 + ETX + CR
    // 数据格式：稳定标志 + 重量值 + 单位
    // 例如: 02 S 0.520 KG 03 0D
    
    let weight = 0;
    let stable = false;
    let unit: 'g' | 'kg' = 'g';
    
    // 移除控制字符
    const cleanData = data.replace(/[\x02\x03\x0D]/g, '');
    
    // 解析稳定标志
    if (cleanData.includes('S') || cleanData.includes('ST')) {
      stable = true;
    } else if (cleanData.includes('U') || cleanData.includes('US')) {
      stable = false;
    }
    
    // 解析单位和重量
    const kgMatch = cleanData.match(/([0-9.]+)\s*(KG|kg)/);
    if (kgMatch) {
      weight = parseFloat(kgMatch[1]) * 1000; // 转换为克
      unit = 'kg';
    } else {
      const gMatch = cleanData.match(/([0-9.]+)\s*(G|g)/);
      if (gMatch) {
        weight = parseFloat(gMatch[1]);
        unit = 'g';
      } else {
        // 尝试直接解析数字
        const numMatch = cleanData.match(/([0-9.]+)/);
        if (numMatch) {
          weight = parseFloat(numMatch[1]);
        }
      }
    }
    
    return {
      weight: Math.round(weight * 10) / 10,
      weightKg: Math.round(weight / 1000 * 100) / 100,
      unit,
      stable,
      timestamp: Date.now(),
      rawData: data,
    };
  }
  
  /**
   * 去皮操作
   */
  async tare(): Promise<boolean> {
    if (!this.currentStatus.connected) {
      console.warn('Scale not connected');
      return false;
    }
    
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await ScalePlugin.tare();
        return result.success;
      } catch (error) {
        console.error('Tare failed:', error);
        return false;
      }
    }
    
    return true; // 模拟成功
  }
  
  /**
   * 归零操作
   */
  async zero(): Promise<boolean> {
    if (!this.currentStatus.connected) {
      console.warn('Scale not connected');
      return false;
    }
    
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await ScalePlugin.zero();
        return result.success;
      } catch (error) {
        console.error('Zero failed:', error);
        return false;
      }
    }
    
    return true; // 模拟成功
  }
  
  /**
   * 获取当前重量
   */
  async getWeight(): Promise<WeightData | null> {
    if (!this.currentStatus.connected) {
      return null;
    }
    
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await ScalePlugin.getWeight();
        return this.parseWeightData(result.data);
      } catch (error) {
        console.error('Get weight failed:', error);
        return null;
      }
    }
    
    // 模拟返回
    return {
      weight: Math.round((100 + Math.random() * 900) * 10) / 10,
      weightKg: 0,
      unit: 'g',
      stable: true,
      timestamp: Date.now(),
    };
  }
  
  /**
   * 更新状态
   */
  private updateStatus(status: Partial<ScaleStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...status };
    this.notifyStatusCallbacks();
  }
  
  /**
   * 处理错误
   */
  private handleError(error: Error): void {
    console.error('Scale error:', error);
    
    this.errorCallbacks.forEach(callback => callback(error));
    
    // 自动重连
    if (this.config.autoReconnect && this.currentStatus.connected) {
      this.scheduleReconnect();
    }
  }
  
  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(async () => {
      if (this.config.autoReconnect) {
        console.log('Attempting to reconnect scale...');
        await this.connect();
      }
    }, this.config.reconnectInterval);
  }
  
  /**
   * 注册称重数据回调
   */
  onWeight(callback: WeightCallback): () => void {
    this.weightCallbacks.push(callback);
    return () => {
      this.weightCallbacks = this.weightCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * 注册状态变化回调
   */
  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.push(callback);
    // 立即发送当前状态
    callback(this.getStatus());
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * 注册错误回调
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * 通知称重数据回调
   */
  private notifyWeightCallbacks(data: WeightData): void {
    this.weightCallbacks.forEach(callback => callback(data));
  }
  
  /**
   * 通知状态变化回调
   */
  private notifyStatusCallbacks(): void {
    const status = this.getStatus();
    this.statusCallbacks.forEach(callback => callback(status));
  }
}

// 导出单例
export const scaleService = ScaleService.getInstance();

// 导出类
export { ScaleService };
