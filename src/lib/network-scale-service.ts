/**
 * 网络电子秤服务 v2.0
 * 通过后端API代理连接电子秤
 * 
 * 适用场景：
 * - PWA环境（浏览器无法直接访问TCP/串口）
 * - 称重一体收银机（内置网络电子秤）
 * - 安卓收银机
 * 
 * 使用方式：
 * 1. 后端通过TCP连接电子秤
 * 2. 前端通过HTTP轮询获取重量数据
 */

// 秤配置
export interface NetworkScaleConfig {
  ip: string;      // 秤IP地址
  port: number;     // 秤端口（默认4001）
  maxWeight: number; // 最大称重（kg）
  enabled: boolean;
}

// 重量数据
export interface NetworkWeightData {
  weight: number;   // 重量 (kg)
  unit: string;     // 单位
  stable: boolean;   // 是否稳定
  timestamp: number; // 时间戳
  error?: string;
}

// 网络秤服务类
export class NetworkScaleService {
  private static instance: NetworkScaleService;
  private config: NetworkScaleConfig = {
    ip: '',        // 需要配置
    port: 4001,    // 顶尖OS2默认端口
    maxWeight: 15,
    enabled: false,
  };
  private isConnected: boolean = false;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private callback: ((data: NetworkWeightData) => void) | null = null;
  private lastWeight: NetworkWeightData = {
    weight: 0,
    unit: 'kg',
    stable: false,
    timestamp: 0,
  };
  private baseUrl: string = '';
  private pollIntervalMs: number = 500; // 轮询间隔

  private constructor() {
    if (typeof window !== 'undefined') {
      this.baseUrl = this.getBaseUrl();
      this.loadConfig();
    }
  }

  // 获取API基础URL
  private getBaseUrl(): string {
    if (typeof window === 'undefined') return '';
    
    // 从环境变量获取
    const env = (window as any).__NEXT_DATA__?.env;
    if (env?.COZE_PROJECT_DOMAIN_DEFAULT) {
      return `https://${env.COZE_PROJECT_DOMAIN_DEFAULT}`;
    }
    
    // 从当前页面获取
    return `${window.location.protocol}//${window.location.host}`;
  }

  // 获取单例实例
  public static getInstance(): NetworkScaleService {
    if (!NetworkScaleService.instance) {
      NetworkScaleService.instance = new NetworkScaleService();
    }
    return NetworkScaleService.instance;
  }

  // 从localStorage加载配置
  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('pos_scale_config');
      if (saved) {
        const config = JSON.parse(saved);
        this.config = { ...this.config, ...config };
      }
    } catch (e) {
      console.warn('[NetworkScale] 加载配置失败:', e);
    }
  }

  // 保存配置到localStorage
  private saveConfig(): void {
    try {
      localStorage.setItem('pos_scale_config', JSON.stringify(this.config));
    } catch (e) {
      console.warn('[NetworkScale] 保存配置失败:', e);
    }
  }

  // 设置配置
  public setConfig(config: Partial<NetworkScaleConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
  }

  // 获取配置
  public getConfig(): NetworkScaleConfig {
    return { ...this.config };
  }

  // 获取当前重量
  public getCurrentWeight(): NetworkWeightData {
    return { ...this.lastWeight };
  }

  // 连接秤
  public async connect(ip: string, port: number = 4001): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!ip) {
      return { success: false, message: 'IP地址不能为空' };
    }

    // 保存配置
    this.config.ip = ip;
    this.config.port = port;
    this.config.enabled = true;
    this.saveConfig();

    try {
      // 调用后端API连接秤
      const response = await fetch(`${this.baseUrl}/api/scale/network/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          ip,
          port,
        }),
      });

      const result = await response.json();

      if (result.success) {
        this.isConnected = true;
        
        // 开始轮询获取重量数据
        this.startPolling();
        
        console.log('[NetworkScale] 连接成功:', ip, port);
        return { success: true, message: result.message };
      } else {
        this.isConnected = false;
        return { success: false, message: result.error || '连接失败' };
      }
    } catch (error: any) {
      this.isConnected = false;
      console.error('[NetworkScale] 连接失败:', error);
      return { success: false, message: error.message || '网络错误' };
    }
  }

  // 断开连接
  public async disconnect(): Promise<void> {
    this.stopPolling();
    this.isConnected = false;

    try {
      await fetch(`${this.baseUrl}/api/scale/network/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
    } catch (e) {
      console.warn('[NetworkScale] 断开连接失败:', e);
    }

    this.lastWeight = {
      weight: 0,
      unit: 'kg',
      stable: false,
      timestamp: Date.now(),
    };

    if (this.callback) {
      this.callback(this.lastWeight);
    }

    console.log('[NetworkScale] 已断开连接');
  }

  // 是否已连接
  public isActive(): boolean {
    return this.isConnected;
  }

  // 订阅重量数据
  public subscribe(callback: (data: NetworkWeightData) => void): () => void {
    this.callback = callback;
    return () => {
      this.callback = null;
    };
  }

  // 开始轮询
  private startPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    // 立即获取一次
    this.pollWeight();

    // 定时轮询
    this.pollInterval = setInterval(() => {
      this.pollWeight();
    }, this.pollIntervalMs);
  }

  // 停止轮询
  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // 轮询获取重量
  private async pollWeight(): Promise<void> {
    if (!this.isConnected) return;

    try {
      const response = await fetch(`${this.baseUrl}/api/scale/network/?action=weight`);
      const result = await response.json();

      if (result.success && result.connected) {
        this.lastWeight = {
          weight: result.weight || 0,
          unit: result.unit || 'kg',
          stable: result.stable || false,
          timestamp: result.timestamp || Date.now(),
        };

        // 同步到localStorage供客显屏使用
        this.syncToStorage();

        // 通知回调
        if (this.callback) {
          this.callback(this.lastWeight);
        }
      } else if (!result.connected) {
        this.isConnected = false;
        this.stopPolling();
      }
    } catch (error) {
      console.warn('[NetworkScale] 轮询失败:', error);
    }
  }

  // 同步到localStorage（供客显屏使用）
  private syncToStorage(): void {
    try {
      localStorage.setItem('pos_scale_weight', JSON.stringify(this.lastWeight));
    } catch (e) {
      console.warn('[NetworkScale] 同步到localStorage失败:', e);
    }
  }

  // 手动设置重量（用于手动输入模式）
  public setManualWeight(weight: number, unit: string = 'kg'): void {
    this.isConnected = true; // 模拟连接状态
    
    this.lastWeight = {
      weight,
      unit,
      stable: true,
      timestamp: Date.now(),
    };

    // 同步到localStorage
    this.syncToStorage();

    // 通知回调
    if (this.callback) {
      this.callback(this.lastWeight);
    }

    console.log('[NetworkScale] 手动设置重量:', this.lastWeight);
  }

  // 清除重量
  public clearWeight(): void {
    this.lastWeight = {
      weight: 0,
      unit: 'kg',
      stable: false,
      timestamp: Date.now(),
    };

    this.syncToStorage();

    if (this.callback) {
      this.callback(this.lastWeight);
    }
  }

  // 清零
  public zero(): void {
    this.setManualWeight(0);
  }
}

// 导出单例
export const networkScaleService = NetworkScaleService.getInstance();
