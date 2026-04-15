'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// AI识别配置
export interface AIRecognitionSettings {
  enabled: boolean;
  brand: 'aibao' | 'youyou' | 'shifang' | 'custom';
  triggerWeight: number; // 触发重量（克）
  triggerMode: 'immediate' | 'stable'; // 触发模式
  similarityThreshold: number; // 相似度阈值 0-100
  customApiUrl?: string; // 自定义API地址
  customApiKey?: string; // 自定义API密钥
}

// 识别结果
export interface RecognitionResult {
  productId: string;
  productName: string;
  confidence: number; // 置信度 0-100
  alternatives?: Array<{
    productId: string;
    productName: string;
    confidence: number;
  }>;
  error?: string;
}

// 商品学习样本
export interface ProductSample {
  id: string;
  productId: string;
  productName: string;
  imageData: string; // Base64 图片数据
  angle: 'front' | 'left' | 'right' | 'top' | 'back';
  createdAt: Date;
}

// 默认设置
const DEFAULT_SETTINGS: AIRecognitionSettings = {
  enabled: false,
  brand: 'custom',
  triggerWeight: 100, // 100克
  triggerMode: 'stable',
  similarityThreshold: 75,
};

// 从 localStorage 加载设置
function loadSettings(): AIRecognitionSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  try {
    const saved = localStorage.getItem('ai_recognition_settings');
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load AI settings:', e);
  }
  return DEFAULT_SETTINGS;
}

// 保存设置到 localStorage
function saveSettingsToStorage(settings: AIRecognitionSettings): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('ai_recognition_settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save AI settings:', e);
  }
}

// 从 localStorage 加载样本
function loadSamples(): ProductSample[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const saved = localStorage.getItem('ai_product_samples');
    if (saved) {
      const samples = JSON.parse(saved);
      return samples.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
      }));
    }
  } catch (e) {
    console.error('Failed to load product samples:', e);
  }
  return [];
}

// 保存样本到 localStorage
function saveSamplesToStorage(samples: ProductSample[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('ai_product_samples', JSON.stringify(samples));
  } catch (e) {
    console.error('Failed to save product samples:', e);
  }
}

// Capacitor Camera 类型声明
interface CapacitorCameraModule {
  getPhoto(options: {
    quality?: number;
    allowEditing?: boolean;
    resultType: string;
    source?: string;
    width?: number;
    height?: number;
    correctOrientation?: boolean;
  }): Promise<{ base64String?: string }>;
}

declare global {
  interface Window {
    Capacitor?: {
      Plugins?: {
        Camera?: CapacitorCameraModule;
      };
    };
  }
}

// 获取 Camera 插件
function getCameraPlugin(): CapacitorCameraModule | null {
  if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.Camera) {
    return window.Capacitor.Plugins.Camera;
  }
  return null;
}

// Hook 配置
interface UseAIRecognitionOptions {
  settings: AIRecognitionSettings;
  onRecognition?: (result: RecognitionResult) => void;
  onWeightChange?: (weight: number) => void;
}

export function useAIRecognition(options: UseAIRecognitionOptions) {
  const { settings, onRecognition, onWeightChange } = options;
  
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [lastResult, setLastResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [samples, setSamples] = useState<ProductSample[]>([]);
  
  // 检查相机可用性
  useEffect(() => {
    const camera = getCameraPlugin();
    setCameraAvailable(!!camera);
    
    // 加载已有样本
    setSamples(loadSamples());
  }, []);
  
  // 拍照
  const captureImage = useCallback(async (): Promise<string | null> => {
    const camera = getCameraPlugin();
    
    if (!camera) {
      // 尝试使用浏览器 API
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        // 返回一个占位符，实际应用中需要从视频流中捕获帧
        stream.getTracks().forEach(track => track.stop());
        setError('请使用实体设备进行拍照');
        return null;
      } catch (e) {
        setError('相机不可用');
        return null;
      }
    }
    
    try {
      const photo = await camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: 'Base64',
        source: 'Camera',
        width: 800,
        height: 600,
        correctOrientation: true,
      });
      
      return photo.base64String || null;
    } catch (e) {
      console.error('Failed to capture image:', e);
      setError('拍照失败：' + (e as Error).message);
      return null;
    }
  }, []);
  
  // 识别商品（模拟AI识别）
  const recognizeProduct = useCallback(async (imageBase64: string): Promise<RecognitionResult | null> => {
    if (!settings.enabled) {
      setError('AI识别功能未启用');
      return null;
    }
    
    setIsRecognizing(true);
    setError(null);
    
    try {
      // TODO: 根据选择的品牌调用不同的AI识别API
      // 这里先使用模拟数据，实际需要对接真实的AI识别服务
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 模拟识别结果
      const mockResult: RecognitionResult = {
        productId: 'PROD_' + Math.random().toString(36).substr(2, 9),
        productName: '识别商品-' + Math.floor(Math.random() * 100),
        confidence: 75 + Math.floor(Math.random() * 20),
        alternatives: [
          {
            productId: 'PROD_ALT1',
            productName: '备选商品1',
            confidence: 65 + Math.floor(Math.random() * 10),
          },
          {
            productId: 'PROD_ALT2',
            productName: '备选商品2',
            confidence: 50 + Math.floor(Math.random() * 10),
          },
        ],
      };
      
      setLastResult(mockResult);
      onRecognition?.(mockResult);
      
      return mockResult;
    } catch (e) {
      const errorMsg = '识别失败：' + (e as Error).message;
      setError(errorMsg);
      
      const errorResult: RecognitionResult = {
        productId: '',
        productName: '',
        confidence: 0,
        error: errorMsg,
      };
      
      setLastResult(errorResult);
      return null;
    } finally {
      setIsRecognizing(false);
    }
  }, [settings, onRecognition]);
  
  // 完整流程：拍照+识别
  const recognizeWithCapture = useCallback(async (): Promise<RecognitionResult | null> => {
    const imageBase64 = await captureImage();
    if (!imageBase64) return null;
    
    return recognizeProduct(imageBase64);
  }, [captureImage, recognizeProduct]);
  
  // 调用自定义API识别
  const recognizeWithCustomAPI = useCallback(async (imageData: string | Blob): Promise<RecognitionResult | null> => {
    if (!settings.customApiUrl) {
      setError('未配置自定义API地址');
      return null;
    }
    
    setIsRecognizing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      if (typeof imageData === 'string') {
        // Base64 字符串
        formData.append('image', imageData);
      } else {
        // Blob 文件
        formData.append('image', imageData, 'image.jpg');
      }
      
      if (settings.triggerWeight > 0) {
        formData.append('weight', String(settings.triggerWeight / 1000)); // 克转千克
      }
      
      const response = await fetch(settings.customApiUrl, {
        method: 'POST',
        body: formData,
        headers: settings.customApiKey ? {
          'Authorization': `Bearer ${settings.customApiKey}`
        } : {},
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      const result: RecognitionResult = {
        productId: data.productId || data.label || '',
        productName: data.name || data.productName || '',
        confidence: data.confidence || data.price || 0,
        alternatives: data.products?.map((p: any) => ({
          productId: p.label || '',
          productName: p.name || '',
          confidence: p.confidence || 0,
        })),
      };
      
      setLastResult(result);
      onRecognition?.(result);
      
      return result;
    } catch (e) {
      const errorMsg = 'API调用失败：' + (e as Error).message;
      setError(errorMsg);
      return null;
    } finally {
      setIsRecognizing(false);
    }
  }, [settings, onRecognition]);
  
  // 保存设置
  const saveSettings = useCallback((newSettings: AIRecognitionSettings) => {
    saveSettingsToStorage(newSettings);
  }, []);
  
  // 学习商品样本
  const learnProductSample = useCallback((
    productId: string,
    productName: string,
    imageData: string,
    angle: 'front' | 'left' | 'right' | 'top' | 'back'
  ) => {
    const newSample: ProductSample = {
      id: 'SAMPLE_' + Date.now(),
      productId,
      productName,
      imageData,
      angle,
      createdAt: new Date(),
    };
    
    const updatedSamples = [...samples, newSample];
    setSamples(updatedSamples);
    saveSamplesToStorage(updatedSamples);
    
    return newSample;
  }, [samples]);
  
  // 获取商品的所有样本
  const getProductSamples = useCallback((productId: string): ProductSample[] => {
    return samples.filter(s => s.productId === productId);
  }, [samples]);
  
  // 删除样本
  const deleteProductSample = useCallback((sampleId: string) => {
    const updatedSamples = samples.filter(s => s.id !== sampleId);
    setSamples(updatedSamples);
    saveSamplesToStorage(updatedSamples);
  }, [samples]);
  
  // 清除结果
  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);
  
  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    // 识别状态
    isRecognizing,
    lastResult,
    error,
    cameraAvailable,
    settings,
    saveSettings,
    
    // 识别方法
    recognizeProduct,
    recognizeWithCapture,
    recognizeWithCustomAPI,
    
    // 拍照
    captureImage,
    
    // 样本管理
    samples,
    learnProductSample,
    getProductSamples,
    deleteProductSample,
    
    // 清除
    clearResult,
    clearError,
  };
}
