/**
 * AI 服务通信模块
 * 用于与本地 AI 推理服务（Python Flask）通信
 * 
 * 适用场景：称重收银一体机 (Android/Linux)
 * 通信协议：HTTP REST API
 */

export interface AIRecognitionResult {
  status: 'success' | 'failed';
  product?: string;
  all_detected?: Array<{
    name: string;
    confidence: number;
  }>;
  message?: string;
  error?: string;
}

export interface ScaleReading {
  weight: number;      // 重量 (kg)
  stable: boolean;     // 是否稳定
  unit: string;        // 单位
  timestamp: number;   // 时间戳
}

export interface AIServiceConfig {
  baseUrl: string;     // AI 服务地址，如 http://127.0.0.1:5000
  confidenceThreshold: number;  // 置信度阈值，默认 0.85
  timeout: number;      // 请求超时(ms)
}

const DEFAULT_CONFIG: AIServiceConfig = {
  baseUrl: 'http://127.0.0.1:5000',
  confidenceThreshold: 0.85,
  timeout: 5000,
};

class AIServiceClient {
  private config: AIServiceConfig;
  private serviceAvailable: boolean = false;
  private lastCheckTime: number = 0;

  constructor(config: Partial<AIServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 检查 AI 服务是否可用
   */
  async checkHealth(): Promise<boolean> {
    const now = Date.now();
    // 缓存结果，5秒内不重复检查
    if (now - this.lastCheckTime < 5000 && this.serviceAvailable) {
      return this.serviceAvailable;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.serviceAvailable = response.ok;
      this.lastCheckTime = Date.now();
      return this.serviceAvailable;
    } catch {
      this.serviceAvailable = false;
      return false;
    }
  }

  /**
   * 发送图片进行 AI 识别
   * @param imageBase64 图片的 Base64 编码（不含 data:image/...;base64, 前缀）
   */
  async recognize(imageBase64: string): Promise<AIRecognitionResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.baseUrl}/recognize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageBase64 }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          status: 'failed',
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const result = await response.json();
      return result as AIRecognitionResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'failed',
        error: errorMessage,
      };
    }
  }

  /**
   * 识别并返回最高置信度结果
   */
  async recognizeTopProduct(imageBase64: string): Promise<{
    name: string;
    confidence: number;
  } | null> {
    const result = await this.recognize(imageBase64);

    if (result.status === 'success' && result.all_detected && result.all_detected.length > 0) {
      const sorted = [...result.all_detected].sort((a, b) => b.confidence - a.confidence);
      const top = sorted.find(item => item.confidence >= this.config.confidenceThreshold);
      
      if (top) {
        return {
          name: top.name,
          confidence: top.confidence,
        };
      }
    }

    return null;
  }

  /**
   * 获取当前配置
   */
  getConfig(): AIServiceConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取服务可用状态
   */
  isAvailable(): boolean {
    return this.serviceAvailable;
  }
}

// 单例实例
export const aiService = new AIServiceClient();

// ============ 称重服务模块 ============

export interface ScaleServiceConfig {
  port: string;           // 串口端口，如 'COM3' 或 '/dev/ttyUSB0'
  baudRate: number;       // 波特率，默认 9600
  triggerWeight: number;  // 触发识别重量阈值(kg)，默认 0.01kg
  stableThreshold: number; // 稳定判定时间(ms)
}

const DEFAULT_SCALE_CONFIG: ScaleServiceConfig = {
  port: 'COM3',
  baudRate: 9600,
  triggerWeight: 0.01,
  stableThreshold: 500,
};

type ScaleCallback = (reading: ScaleReading) => void;

class ScaleService {
  private config: ScaleServiceConfig;
  private isListening: boolean = false;
  private listeners: ScaleCallback[] = [];
  private lastWeight: number = 0;
  private stableStartTime: number = 0;
  private simulateInterval?: ReturnType<typeof setInterval>;

  constructor(config: Partial<ScaleServiceConfig> = {}) {
    this.config = { ...DEFAULT_SCALE_CONFIG, ...config };
  }

  /**
   * 解析电子秤串口数据
   * 不同品牌秤的协议可能不同，这里提供一个通用解析示例
   */
  parseScaleData(data: string): ScaleReading | null {
    try {
      // 示例格式: "0.000kg" 或 "1.250 kg" 或 "+1.250kg"
      const cleanData = data.replace(/[\r\n]/g, '').trim();
      const match = cleanData.match(/[-+]?(\d+\.?\d*)\s*kg?/i);
      
      if (match) {
        const weight = parseFloat(match[1]);
        if (!isNaN(weight)) {
          return {
            weight,
            stable: true,
            unit: 'kg',
            timestamp: Date.now(),
          };
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * 启动监听（模拟模式，用于开发调试）
   * 实际部署时替换为真实串口通信
   */
  startListeningSimulate(onReading: ScaleCallback): void {
    if (this.isListening) return;

    this.isListening = true;
    console.log('[ScaleService] 启动模拟监听模式');

    // 模拟电子秤每2秒更新一次数据
    this.simulateInterval = setInterval(() => {
      // 模拟随机重量 0 ~ 2kg
      const weight = Math.random() * 2;
      const reading: ScaleReading = {
        weight,
        stable: weight > 0.01,
        unit: 'kg',
        timestamp: Date.now(),
      };

      // 检查是否触发识别
      if (weight >= this.config.triggerWeight && !this.lastWeight) {
        this.stableStartTime = Date.now();
      }

      // 重量稳定后触发回调
      if (this.lastWeight >= this.config.triggerWeight && weight < this.config.triggerWeight) {
        const stableDuration = Date.now() - this.stableStartTime;
        if (stableDuration >= this.config.stableThreshold) {
          onReading({
            ...reading,
            stable: true,
          });
        }
      }

      this.lastWeight = weight;
    }, 500);
  }

  /**
   * 启动真实串口监听
   * 需要安装 pyserial 或类似库
   */
  async startListeningReal(onReading: ScaleCallback): Promise<void> {
    if (this.isListening) return;

    // 注意：这是 Web 应用，无法直接访问串口
    // 需要通过 Electron/Capacitor 等桥接方式调用本地服务
    console.warn('[ScaleService] Web 环境不支持直接串口通信，请使用模拟模式');
    this.isListening = true;
  }

  /**
   * 停止监听
   */
  stopListening(): void {
    if (this.simulateInterval) {
      clearInterval(this.simulateInterval);
      this.simulateInterval = undefined;
    }
    this.isListening = false;
    console.log('[ScaleService] 监听已停止');
  }

  /**
   * 注册重量变化回调
   */
  onWeightChange(callback: ScaleCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * 获取配置
   */
  getConfig(): ScaleServiceConfig {
    return { ...this.config };
  }
}

// 导出单例
export const scaleService = new ScaleService();

// ============ 组合服务：AI视觉称重 ============

export interface VisionScaleConfig {
  aiServiceUrl: string;
  scaleConfig: Partial<ScaleServiceConfig>;
  autoCapture: boolean;  // 取下商品时自动拍照
}

export class VisionScaleController {
  private ai: AIServiceClient;
  private scale: ScaleService;
  private isRunning: boolean = false;
  private onRecognition?: (result: AIRecognitionResult, weight: number) => void;
  private unsubscribeScale?: () => void;

  constructor(config: Partial<VisionScaleConfig> = {}) {
    this.ai = new AIServiceClient({
      baseUrl: config.aiServiceUrl || 'http://127.0.0.1:5000',
    });
    this.scale = new ScaleService(config.scaleConfig);
  }

  /**
   * 启动视觉称重联动
   * @param onRecognition 识别结果回调
   */
  async start(onRecognition?: (result: AIRecognitionResult, weight: number) => void): Promise<boolean> {
    if (this.isRunning) return true;

    this.onRecognition = onRecognition;

    // 检查 AI 服务
    const aiAvailable = await this.ai.checkHealth();
    if (!aiAvailable) {
      console.warn('[VisionScale] AI 服务不可用，将使用模拟模式');
    }

    // 启动秤监听
    this.scale.startListeningSimulate(async (reading) => {
      if (reading.weight >= 0.01 && reading.stable) {
        console.log(`[VisionScale] 检测到稳定重量: ${reading.weight.toFixed(3)}kg`);
        
        // 触发拍照识别（实际项目中需要调用摄像头）
        // 这里触发外部的拍照回调
        this.triggerCapture(reading.weight);
      }
    });

    this.isRunning = true;
    return true;
  }

  /**
   * 触发拍照识别
   * 由外部调用，传入 Base64 图片
   */
  async triggerCapture(weight: number): Promise<AIRecognitionResult> {
    console.log('[VisionScale] 触发拍照识别...');
    
    // 如果需要自动拍照，这里调用摄像头
    // const imageBase64 = await this.captureImage();
    
    // 演示模式：直接返回模拟结果
    const mockResult: AIRecognitionResult = {
      status: 'success',
      product: '红富士苹果',
      all_detected: [
        { name: '红富士苹果', confidence: 0.95 },
        { name: '黄元帅苹果', confidence: 0.72 },
      ],
    };

    if (this.onRecognition) {
      this.onRecognition(mockResult, weight);
    }

    return mockResult;
  }

  /**
   * 手动发送图片识别
   */
  async recognize(imageBase64: string): Promise<AIRecognitionResult> {
    return this.ai.recognize(imageBase64);
  }

  /**
   * 停止服务
   */
  stop(): void {
    this.scale.stopListening();
    if (this.unsubscribeScale) {
      this.unsubscribeScale();
    }
    this.isRunning = false;
  }

  /**
   * 检查服务状态
   */
  async checkStatus(): Promise<{ ai: boolean; scale: boolean }> {
    const aiAvailable = await this.ai.checkHealth();
    return {
      ai: aiAvailable,
      scale: this.isRunning,
    };
  }
}

export default AIServiceClient;
