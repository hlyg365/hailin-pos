/**
 * 称重服务 - 电子秤集成
 * 支持串口电子秤和AI视觉称重
 */

export interface WeightData {
  weight: number;
  unit: 'kg' | 'jin';
  stable: boolean;
  timestamp: number;
  productName?: string;
  confidence?: number;
}

export interface ScaleConfig {
  type: 'serial' | 'ai';
  port?: string;
  baudRate: number;
  autoTare: boolean;
  unit: 'kg' | 'jin';
  // AI称重配置
  aiModel?: string;
  aiConfidence?: number;
}

export type WeightCallback = (data: WeightData) => void;

class ScaleService {
  private static instance: ScaleService;
  private config: ScaleConfig = {
    type: 'serial',
    baudRate: 9600,
    autoTare: false,
    unit: 'jin',
  };
  private isConnected: boolean = false;
  private serialPort: any = null;
  private weightCallback: WeightCallback | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  
  // 最后称重数据
  private lastWeight: WeightData = {
    weight: 0,
    unit: 'jin',
    stable: false,
    timestamp: 0,
  };

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): ScaleService {
    if (!ScaleService.instance) {
      ScaleService.instance = new ScaleService();
    }
    return ScaleService.instance;
  }

  // 加载配置
  private loadConfig() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_scale_config');
      if (saved) {
        try {
          this.config = { ...this.config, ...JSON.parse(saved) };
        } catch (e) {
          console.error('Failed to load scale config:', e);
        }
      }
    }
  }

  // 保存配置
  saveConfig(config: Partial<ScaleConfig>) {
    this.config = { ...this.config, ...config };
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_scale_config', JSON.stringify(this.config));
    }
  }

  // 获取配置
  getConfig() {
    return { ...this.config };
  }

  // 获取最后称重数据
  getLastWeight(): WeightData {
    return { ...this.lastWeight };
  }

  // 检查是否支持串口
  isSerialSupported(): boolean {
    if (typeof window === 'undefined') return false;
    // @ts-ignore - serial API 尚未完全标准化
    return 'serial' in navigator;
  }

  // 检查是否支持AI称重
  isAISupported(): boolean {
    return true; // 始终支持AI称重
  }

  // 连接电子秤（串口）
  async connectSerial(port?: string): Promise<boolean> {
    if (!this.isSerialSupported()) {
      console.error('[Scale] Serial not supported');
      return false;
    }

    try {
      // @ts-ignore - serial API 尚未完全标准化
      const serial = navigator.serial;
      const selectedPort = port 
        ? await serial.getPort(port)
        : await serial.requestPort();
      
      await selectedPort.open({ baudRate: this.config.baudRate });
      
      this.serialPort = selectedPort;
      this.isConnected = true;
      
      // 开始轮询读取
      this.startPolling();
      
      return true;
    } catch (error) {
      console.error('[Scale] Serial connection failed:', error);
      return false;
    }
  }

  // 断开连接
  async disconnect(): Promise<void> {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    
    if (this.serialPort) {
      try {
        await this.serialPort.close();
      } catch (e) {
        console.error('[Scale] Close failed:', e);
      }
      this.serialPort = null;
    }
    
    this.isConnected = false;
  }

  // 开始轮询读取
  private startPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    
    this.pollInterval = setInterval(async () => {
      if (!this.serialPort) return;
      
      try {
        const reader = this.serialPort.readable.getReader();
        const { value } = await reader.read();
        reader.releaseLock();
        
        if (value) {
          const weight = this.parseWeightData(value);
          if (weight !== null) {
            this.lastWeight = {
              weight,
              unit: this.config.unit,
              stable: true,
              timestamp: Date.now(),
            };
            
            // 同步到 localStorage
            this.syncToStorage();
            
            // 触发回调
            if (this.weightCallback) {
              this.weightCallback(this.lastWeight);
            }
          }
        }
      } catch (e) {
        // 读取错误，忽略
      }
    }, 500);
  }

  // 解析称重数据
  private parseWeightData(data: Uint8Array): number | null {
    // 不同品牌的电子秤协议不同，这里是简化实现
    // 实际需要根据具体电子秤型号调整解析逻辑
    
    if (data.length < 8) return null;
    
    // 尝试解析常见的固定重量格式
    // 格式: ST,GS,+001.250,kg (稳定重量，单位kg)
    const str = new TextDecoder().decode(data);
    
    // 解析带单位的数据
    const match = str.match(/([+-]?\d+\.?\d*)\s*(kg|jin|lb)?/);
    if (match) {
      let weight = parseFloat(match[1]);
      
      // 转换为统一单位
      const unit = match[2] || 'kg';
      if (unit === 'kg') {
        weight = weight * 2; // kg -> jin
      }
      
      return weight;
    }
    
    return null;
  }

  // 设置称重回调
  setCallback(callback: WeightCallback) {
    this.weightCallback = callback;
  }

  // 同步到 localStorage（供客显屏使用）
  private syncToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_scale_data', JSON.stringify(this.lastWeight));
    }
  }

  // AI称重识别
  async recognizeWithAI(imageData: string): Promise<{
    success: boolean;
    product?: {
      name: string;
      confidence: number;
      category?: string;
    };
    weight?: number;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/ai-scale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recognize',
          image: imageData,
          settings: {
            model: this.config.aiModel || 'doubao-seed-1-6-vision-250815',
            temperature: 0.3,
          },
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        return {
          success: true,
          product: {
            name: result.data.product?.name || '未知商品',
            confidence: result.data.product?.confidence || 0,
            category: result.data.product?.category,
          },
          weight: this.lastWeight.weight,
        };
      } else {
        return {
          success: false,
          error: result.error || 'AI识别失败',
        };
      }
    } catch (error) {
      console.error('[Scale] AI recognition failed:', error);
      return {
        success: false,
        error: `AI识别异常: ${error}`,
      };
    }
  }

  // 获取连接状态
  isScaleConnected(): boolean {
    return this.isConnected;
  }

  // 模拟称重（开发测试用）
  simulateWeight(weight: number): void {
    this.lastWeight = {
      weight,
      unit: this.config.unit,
      stable: true,
      timestamp: Date.now(),
    };
    
    this.syncToStorage();
    
    if (this.weightCallback) {
      this.weightCallback(this.lastWeight);
    }
  }

  // 去皮
  tare(): void {
    this.lastWeight.weight = 0;
    this.syncToStorage();
    
    if (this.weightCallback) {
      this.weightCallback(this.lastWeight);
    }
  }
}

// 导出单例
export const scaleService = ScaleService.getInstance();

// 从 localStorage 获取最后称重数据（用于客显屏等）
export function getScaleDataFromStorage(): WeightData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const data = localStorage.getItem('pos_scale_data');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}
