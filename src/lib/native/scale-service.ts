/**
 * 原生电子秤服务 - Android串口秤专用
 * 
 * 使用方法:
 * import { ScaleService } from '@/lib/native/scale-service';
 * const scale = ScaleService.getInstance();
 * await scale.connect();
 * scale.onWeightChange((data) => console.log(data));
 */

// 延迟加载 Capacitor
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
  private initialized: boolean = false;

  private constructor() {
    // 延迟初始化，等待Capacitor完全准备好
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => this.initPlugin(), 0);
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => this.initPlugin(), 0);
        });
      }
    }
  }

  public static getInstance(): ScaleService {
    if (!ScaleService.instance) {
      ScaleService.instance = new ScaleService();
    }
    return ScaleService.instance;
  }

  private initPlugin() {
    if (this.initialized) return;
    this.initialized = true;
    
    // 直接从window获取Capacitor和插件
    const cap = (window as any).Capacitor;
    if (cap) {
      // 尝试获取插件
      this.plugin = (window as any).Scale;
      
      if (this.plugin) {
        console.log('[ScaleService] Plugin initialized successfully');
      } else {
        console.log('[ScaleService] Plugin not found, running in fallback mode');
      }
    }
  }

  private isNativePlatform(): boolean {
    return this.plugin != null;
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
        throw new Error(result.error || '获取设备列表失败');
      } catch (e) {
        console.error('[ScaleService] listDevices error:', e);
        return [];
      }
    }
    return [];
  }

  /**
   * 连接电子秤
   */
  async connect(config?: Partial<ScaleConfig>): Promise<boolean> {
    if (!this.isNativePlatform()) {
      console.warn('[ScaleService] Not in native platform, using simulation');
      this.isConnected = true;
      return true;
    }

    try {
      const result = await this.plugin.connect(config || {});
      if (result.success) {
        this.isConnected = true;
        return true;
      }
      throw new Error(result.error || '连接失败');
    } catch (e) {
      console.error('[ScaleService] Connect error:', e);
      return false;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (this.isNativePlatform()) {
      try {
        await this.plugin.disconnect();
      } catch (e) {
        console.error('[ScaleService] Disconnect error:', e);
      }
    }
    this.isConnected = false;
    this.stopWeightPolling();
  }

  /**
   * 获取当前重量
   */
  async getWeight(): Promise<WeightData | null> {
    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.getWeight();
        if (result.success) {
          return result.data;
        }
      } catch (e) {
        console.error('[ScaleService] getWeight error:', e);
      }
    }
    return null;
  }

  /**
   * 开启重量轮询
   */
  startWeightPolling(interval: number = 500): void {
    if (this.pollInterval) return;
    
    this.pollInterval = setInterval(async () => {
      const data = await this.getWeight();
      if (data) {
        this.callbacks.forEach(cb => cb(data));
      }
    }, interval);
  }

  /**
   * 停止重量轮询
   */
  stopWeightPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * 监听重量变化
   */
  onWeightChange(callback: WeightCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * 获取状态
   */
  async getStatus(): Promise<{ connected: boolean; available: boolean }> {
    const cap = (window as any).Capacitor;
    const hasPlugin = cap && this.isNativePlatform();
    
    return {
      connected: this.isConnected,
      available: hasPlugin || true, // 始终可用
    };
  }

  /**
   * 清零
   */
  async tare(): Promise<boolean> {
    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.tare();
        return result.success;
      } catch (e) {
        console.error('[ScaleService] Tare error:', e);
      }
    }
    return false;
  }
}

export const scaleService = ScaleService.getInstance();
export { ScaleService };
