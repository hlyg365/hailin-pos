/**
 * 海邻到家 - AI 商品识别集成模块
 * 
 * 用于收银台 APP 与 AI 识别服务、电子秤的集成
 * 
 * @example
 * // 使用 Hook
 * const { isConnected, recognize } = useAIIntegration();
 * 
 * // 手动识别
 * const result = await recognize(imageData);
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ============== 类型定义 ==============

/** 商品信息 */
export interface Product {
  label: string;
  name: string;
  confidence: number;
  price: number;
  weight?: number;
  is_weighted?: boolean;
  unit_price?: number;
  line_total?: number;
}

/** 识别结果 */
export interface RecognitionResult {
  success: boolean;
  count: number;
  products: Product[];
  total_price: number;
  processing_time?: number;
  weight?: number;
  model?: string;
  error?: string;
}

/** 重量数据 */
export interface WeightData {
  weight: number;
  stable: boolean;
  timestamp: number;
}

/** AI 服务健康状态 */
export interface HealthStatus {
  status: string;
  service: string;
  model_loaded: boolean;
  model_type: string;
  timestamp: string;
}

/** AI 服务配置 */
export interface AIServiceConfig {
  baseUrl: string;
  timeout: number;
  confidence: number;
}

// ============== 配置 ==============

const DEFAULT_CONFIG: AIServiceConfig = {
  baseUrl: 'http://127.0.0.1:5000',
  timeout: 10000,
  confidence: 0.75
};

let globalConfig: AIServiceConfig = { ...DEFAULT_CONFIG };

/**
 * 配置 AI 服务
 */
export function configureAIService(config: Partial<AIServiceConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

// ============== API 客户端 ==============

/**
 * AI 服务客户端
 */
export class AIServiceClient {
  private baseUrl: string;
  private timeout: number;
  private confidence: number;

  constructor(config?: Partial<AIServiceConfig>) {
    const cfg = { ...globalConfig, ...config };
    this.baseUrl = cfg.baseUrl;
    this.timeout = cfg.timeout;
    this.confidence = cfg.confidence;
  }

  /**
   * 检查服务健康状态
   */
  async checkHealth(): Promise<HealthStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('[AI Service] Health check failed:', error);
      return null;
    }
  }

  /**
   * 获取支持的商品列表
   */
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${this.baseUrl}/products`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.products || [];
      }
      return [];
    } catch (error) {
      console.error('[AI Service] Get products failed:', error);
      return [];
    }
  }

  /**
   * 识别图片中的商品
   */
  async recognize(
    imageData: Blob | ArrayBuffer | string,
    options?: { confidence?: number; weight?: number }
  ): Promise<RecognitionResult> {
    try {
      const endpoint = options?.weight 
        ? `${this.baseUrl}/recognize_with_weight`
        : `${this.baseUrl}/recognize`;
      
      let body: FormData | string;
      let headers: Record<string, string> = {};

      if (typeof imageData === 'string') {
        // Base64 编码的图片
        const payload: Record<string, unknown> = {
          image: imageData,
          confidence: options?.confidence ?? this.confidence
        };
        
        if (options?.weight) {
          payload.weight = options.weight;
        }
        
        body = JSON.stringify(payload);
        headers['Content-Type'] = 'application/json';
      } else {
        // 文件数据
        const formData = new FormData();
        
        // 转换 ArrayBuffer 为 Blob
        let blob: Blob;
        if (imageData instanceof ArrayBuffer) {
          blob = new Blob([imageData], { type: 'image/jpeg' });
        } else {
          blob = imageData;
        }
        
        formData.append('image', blob, 'image.jpg');
        formData.append('confidence', String(options?.confidence ?? this.confidence));
        
        if (options?.weight) {
          formData.append('weight', String(options.weight));
        }
        
        body = formData;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(this.timeout)
      });

      if (response.ok) {
        return await response.json();
      }

      return {
        success: false,
        error: `HTTP ${response.status}`,
        count: 0,
        products: [],
        total_price: 0
      };
    } catch (error) {
      console.error('[AI Service] Recognition failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0,
        products: [],
        total_price: 0
      };
    }
  }

  /**
   * 从摄像头捕获图片并识别
   */
  async recognizeFromCamera(
    videoElement: HTMLVideoElement,
    options?: { confidence?: number; weight?: number }
  ): Promise<RecognitionResult> {
    try {
      // 从 video 元素捕获当前帧
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return {
          success: false,
          error: '无法获取 Canvas 上下文',
          count: 0,
          products: [],
          total_price: 0
        };
      }
      
      ctx.drawImage(videoElement, 0, 0);
      
      // 转换为 Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Canvas to Blob failed'))),
          'image/jpeg',
          0.85
        );
      });
      
      return this.recognize(blob, options);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Camera capture failed',
        count: 0,
        products: [],
        total_price: 0
      };
    }
  }
}

// ============== React Hook ==============

/** AI 集成 Hook 返回值 */
export interface UseAIIntegrationReturn {
  /** AI 服务是否已连接 */
  isConnected: boolean;
  /** 是否正在识别 */
  isRecognizing: boolean;
  /** 最新识别结果 */
  latestResult: RecognitionResult | null;
  /** 当前重量（如果有电子秤） */
  currentWeight: number;
  /** 电子秤状态 */
  scaleStatus: 'connected' | 'disconnected' | 'simulated';
  /** 手动识别 */
  recognize: (imageData?: Blob | HTMLVideoElement, weight?: number) => Promise<RecognitionResult | null>;
  /** 清除识别结果 */
  clearResult: () => void;
  /** 健康状态 */
  healthStatus: HealthStatus | null;
}

/**
 * AI 集成 Hook
 * 
 * @example
 * ```tsx
 * function CashierPage() {
 *   const { 
 *     isConnected, 
 *     isRecognizing, 
 *     recognize, 
 *     latestResult 
 *   } = useAIIntegration();
 * 
 *   const handleAIButton = async () => {
 *     const result = await recognize(videoRef.current);
 *     if (result?.success) {
 *       // 添加商品到购物车
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleAIButton} disabled={isRecognizing}>
 *         {isRecognizing ? '识别中...' : 'AI识别'}
 *       </button>
 *     </div>
 *   );
 * };
 * ```
 */
export function useAIIntegration(): UseAIIntegrationReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [latestResult, setLatestResult] = useState<RecognitionResult | null>(null);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [scaleStatus, setScaleStatus] = useState<'connected' | 'disconnected' | 'simulated'>('disconnected');
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  
  const clientRef = useRef<AIServiceClient | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化客户端
  useEffect(() => {
    clientRef.current = new AIServiceClient();
    
    // 检查健康状态
    const checkHealth = async () => {
      if (clientRef.current) {
        const status = await clientRef.current.checkHealth();
        setIsConnected(status !== null);
        setHealthStatus(status);
        
        // 模拟模式检测
        if (status?.model_type === 'simulated') {
          setScaleStatus('simulated');
        }
      }
    };
    
    checkHealth();
    
    // 定期检查
    pollingRef.current = setInterval(checkHealth, 30000);
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  /**
   * 执行识别
   */
  const recognize = useCallback(async (
    imageData?: Blob | HTMLVideoElement,
    weight?: number
  ): Promise<RecognitionResult | null> => {
    if (!clientRef.current) {
      console.error('[AI Integration] Client not initialized');
      return null;
    }
    
    if (isRecognizing) {
      console.warn('[AI Integration] Already recognizing');
      return null;
    }
    
    setIsRecognizing(true);
    
    try {
      let result: RecognitionResult;
      
      if (imageData instanceof HTMLVideoElement) {
        // 从视频元素捕获
        result = await clientRef.current.recognizeFromCamera(
          imageData,
          { weight: weight ?? currentWeight }
        );
      } else if (imageData) {
        // 直接传入图片数据
        result = await clientRef.current.recognize(
          imageData,
          { weight: weight ?? currentWeight }
        );
      } else {
        // 无图片数据时的错误处理
        setIsRecognizing(false);
        return null;
      }
      
      setLatestResult(result);
      
      if (result.success) {
        console.log('[AI Integration] Recognition success:', result);
      } else {
        console.warn('[AI Integration] Recognition failed:', result.error);
      }
      
      return result;
    } finally {
      setIsRecognizing(false);
    }
  }, [isRecognizing, currentWeight]);

  /**
   * 清除识别结果
   */
  const clearResult = useCallback(() => {
    setLatestResult(null);
  }, []);

  /**
   * 更新重量（供外部调用）
   */
  const updateWeight = useCallback((weight: number, stable: boolean) => {
    setCurrentWeight(weight);
    if (stable) {
      setScaleStatus('connected');
    }
  }, []);

  return {
    isConnected,
    isRecognizing,
    latestResult,
    currentWeight,
    scaleStatus,
    recognize,
    clearResult,
    healthStatus
  };
}

// ============== WebSocket 监听器 ==============

/**
 * 重量变化回调
 */
type WeightChangeCallback = (weight: number, stable: boolean) => void;

/**
 * 识别结果回调
 */
type RecognitionCallback = (result: RecognitionResult, weight: number) => void;

/**
 * 创建 WebSocket 连接监听电子秤
 * 
 * 注意：需要后端支持 WebSocket
 */
export function createScaleListener(
  onWeightChange?: WeightChangeCallback,
  onRecognition?: RecognitionCallback
): { connect: () => void; disconnect: () => void } {
  let ws: WebSocket | null = null;
  
  const connect = () => {
    const wsUrl = globalConfig.baseUrl.replace('http', 'ws') + '/ws/scale';
    
    try {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('[Scale Listener] Connected');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'weight') {
            onWeightChange?.(data.weight, data.stable);
          } else if (data.type === 'recognition') {
            onRecognition?.(data.result, data.weight);
          }
        } catch (e) {
          console.error('[Scale Listener] Parse error:', e);
        }
      };
      
      ws.onclose = () => {
        console.log('[Scale Listener] Disconnected');
      };
      
      ws.onerror = (error) => {
        console.error('[Scale Listener] Error:', error);
      };
    } catch (e) {
      console.error('[Scale Listener] Connection failed:', e);
    }
  };
  
  const disconnect = () => {
    if (ws) {
      ws.close();
      ws = null;
    }
  };
  
  return { connect, disconnect };
}

// ============== 导出默认客户端实例 ==============

export const aiService = new AIServiceClient();
