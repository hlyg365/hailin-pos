/**
 * 原生电子秤服务 - Android串口秤专用
 * 
 * 使用方法:
 * import { ScaleService } from '@/lib/native/scale-service';
 * const scale = ScaleService.getInstance();
 * await scale.connect();
 * scale.onWeightChange((data) => console.log(data));
 */

import { Capacitor } from '@capacitor/core';

// 类型定义
export interface ScaleDevice {
  name: string;
  vendorId: number;
  productId: number;
  deviceId: number;
  productName: string;
}

export interface WeightData {
  weight: number;
  unit: 'kg' | 'g';
  stable: boolean;
  timestamp: number;
}

export interface ScaleConfig {
  port?: string;
  baudRate: number;
  protocol: 'OS2' | 'TM' | 'DIANSHAN';
}

export type WeightCallback = (data: WeightData) => void;

class ScaleService {
  private static instance: ScaleService;
  private plugin: any = null;
  private isConnected: boolean = false;
  private callbacks: Set<WeightCallback> = new Set();
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.initPlugin();
  }

  public static getInstance(): ScaleService {
    if (!ScaleService.instance) {
      ScaleService.instance = new ScaleService();
    }
    return ScaleService.instance;
  }

  private initPlugin() {
    if (Capacitor.isNativePlatform()) {
      // @ts-ignore
      this.plugin = (window as any).Scale;
    }
  }

  private isNativePlatform(): boolean {
    return Capacitor.isNativePlatform() && this.plugin != null;
  }

  /**
   * 列出可用的USB设备
   */
  async listDevices(): Promise<ScaleDevice[]> {
    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.listDevices();
        if (result.success) {
          const devices: ScaleDevice[] = [];
          const deviceMap = result.devices || {};
          for (const key in deviceMap) {
            devices.push(deviceMap[key]);
          }
          return devices;
        }
      } catch (e) {
        console.error('[ScaleService] listDevices error:', e);
      }
    }
    return [];
  }

  /**
   * 连接到电子秤
   */
  async connect(config?: Partial<ScaleConfig>): Promise<{ success: boolean; message: string; mode?: string }> {
    const baudRate = config?.baudRate || 9600;
    const protocol = config?.protocol || 'OS2';
    const port = config?.port || '';

    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.connect({
          port,
          baudRate,
          protocol,
        });
        
        if (result.success) {
          this.isConnected = true;
          this.startPolling();
        }
        
        return {
          success: result.success,
          message: result.message || (result.success ? '连接成功' : '连接失败'),
          mode: result.mode,
        };
      } catch (e: any) {
        return { success: false, message: e.message || '连接失败' };
      }
    }

    // 非原生平台，使用模拟模式
    console.warn('[ScaleService] Running in browser, using simulation mode');
    this.isConnected = true;
    this.startSimulationMode();
    
    return {
      success: true,
      message: '模拟模式（仅用于测试）',
      mode: 'simulation',
    };
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    this.stopPolling();
    this.isConnected = false;

    if (this.isNativePlatform()) {
      try {
        await this.plugin.disconnect();
      } catch (e) {
        console.error('[ScaleService] disconnect error:', e);
      }
    }
  }

  /**
   * 获取当前重量
   */
  async getWeight(): Promise<WeightData> {
    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.getWeight();
        return {
          weight: result.weight || 0,
          unit: (result.unit as 'kg' | 'g') || 'kg',
          stable: result.stable || false,
          timestamp: result.timestamp || Date.now(),
        };
      } catch (e) {
        console.error('[ScaleService] getWeight error:', e);
      }
    }

    return {
      weight: 0,
      unit: 'kg',
      stable: false,
      timestamp: Date.now(),
    };
  }

  /**
   * 获取连接状态
   */
  async getStatus(): Promise<{ connected: boolean; polling: boolean; mode: string }> {
    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.getStatus();
        return {
          connected: result.connected || false,
          polling: result.polling || false,
          mode: result.mode || 'unknown',
        };
      } catch (e) {
        console.error('[ScaleService] getStatus error:', e);
      }
    }

    return {
      connected: this.isConnected,
      polling: this.pollInterval !== null,
      mode: this.isNativePlatform() ? 'native' : 'simulation',
    };
  }

  /**
   * 设置手动重量（用于测试）
   */
  async setWeight(weight: number, unit: 'kg' | 'g' = 'kg', stable: boolean = true): Promise<void> {
    if (this.isNativePlatform()) {
      try {
        await this.plugin.setWeight({ weight, unit, stable });
      } catch (e) {
        console.error('[ScaleService] setWeight error:', e);
      }
    }
  }

  /**
   * 订阅重量变化
   */
  onWeightChange(callback: WeightCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * 开始轮询重量
   */
  private startPolling() {
    if (this.pollInterval) return;

    this.pollInterval = setInterval(async () => {
      if (!this.isConnected) return;

      const weight = await this.getWeight();
      this.callbacks.forEach(cb => cb(weight));
    }, 200);
  }

  /**
   * 停止轮询
   */
  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * 模拟模式 - 生成随机重量
   */
  private startSimulationMode() {
    this.startPolling();
    
    // 模拟重量变化
    setInterval(async () => {
      if (!this.isConnected) return;

      const base = 1.5 + Math.sin(Date.now() / 2000) * 0.5;
      const noise = (Math.random() - 0.5) * 0.02;
      const weight = Math.round((base + noise) * 1000) / 1000;
      
      const data: WeightData = {
        weight,
        unit: 'kg',
        stable: Math.random() > 0.1,
        timestamp: Date.now(),
      };

      this.callbacks.forEach(cb => cb(data));
    }, 500);
  }

  /**
   * 清除手动重量
   */
  clearManualWeight(): void {
    this.setWeight(0, 'kg', false);
  }

  /**
   * 设置手动重量
   */
  setManualWeight(weight: number): void {
    this.setWeight(weight, 'kg', true);
  }
}

export const scaleService = ScaleService.getInstance();
export { ScaleService };
export default ScaleService;
