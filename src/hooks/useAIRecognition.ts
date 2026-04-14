import { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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
  timestamp: Date;
  imageBase64?: string;
}

// 商品学习样本
export interface ProductSample {
  id: string;
  productId: string;
  imagePath: string;
  angle: 'front' | 'back' | 'side' | 'top' | 'other';
  status: 'pending' | 'trained' | 'failed';
  createdAt: Date;
}

// AI识别Hook
export function useAIRecognition() {
  const [settings, setSettings] = useState<AIRecognitionSettings>({
    enabled: false,
    brand: 'aibao',
    triggerWeight: 20,
    triggerMode: 'stable',
    similarityThreshold: 60,
  });

  const [isRecognizing, setIsRecognizing] = useState(false);
  const [lastResult, setLastResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 从本地存储加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('ai_recognition_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to load AI recognition settings:', e);
      }
    }
  }, []);

  // 保存设置到本地存储
  const saveSettings = useCallback((newSettings: AIRecognitionSettings) => {
    setSettings(newSettings);
    localStorage.setItem('ai_recognition_settings', JSON.stringify(newSettings));
  }, []);

  // 拍照
  const captureImage = useCallback(async (): Promise<string | null> => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
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
            confidence: 55 + Math.floor(Math.random() * 10),
          },
        ],
        timestamp: new Date(),
        imageBase64: imageBase64,
      };

      setLastResult(mockResult);
      return mockResult;
    } catch (e) {
      console.error('Recognition failed:', e);
      setError('识别失败：' + (e as Error).message);
      return null;
    } finally {
      setIsRecognizing(false);
    }
  }, [settings.enabled]);

  // 学习商品样本
  const learnProductSample = useCallback(async (
    productId: string,
    angle: ProductSample['angle']
  ): Promise<ProductSample | null> => {
    try {
      const imageBase64 = await captureImage();
      if (!imageBase64) {
        return null;
      }

      // TODO: 将样本上传到AI训练服务器
      // 这里先保存到本地存储
      const sample: ProductSample = {
        id: 'SAMPLE_' + Date.now(),
        productId,
        imagePath: 'data:image/jpeg;base64,' + imageBase64,
        angle,
        status: 'pending',
        createdAt: new Date(),
      };

      // 获取现有样本
      const samplesKey = `ai_samples_${productId}`;
      const existingSamples = localStorage.getItem(samplesKey);
      const samples: ProductSample[] = existingSamples ? JSON.parse(existingSamples) : [];
      
      // 添加新样本
      samples.push(sample);
      localStorage.setItem(samplesKey, JSON.stringify(samples));

      return sample;
    } catch (e) {
      console.error('Failed to learn product sample:', e);
      setError('学习样本失败：' + (e as Error).message);
      return null;
    }
  }, [captureImage]);

  // 获取商品样本列表
  const getProductSamples = useCallback((productId: string): ProductSample[] => {
    const samplesKey = `ai_samples_${productId}`;
    const samples = localStorage.getItem(samplesKey);
    return samples ? JSON.parse(samples) : [];
  }, []);

  // 删除商品样本
  const deleteProductSample = useCallback((productId: string, sampleId: string): boolean => {
    try {
      const samplesKey = `ai_samples_${productId}`;
      const existingSamples = localStorage.getItem(samplesKey);
      if (!existingSamples) return false;

      const samples: ProductSample[] = JSON.parse(existingSamples);
      const filteredSamples = samples.filter(s => s.id !== sampleId);
      localStorage.setItem(samplesKey, JSON.stringify(filteredSamples));
      
      return true;
    } catch (e) {
      console.error('Failed to delete product sample:', e);
      return false;
    }
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    settings,
    saveSettings,
    isRecognizing,
    lastResult,
    error,
    captureImage,
    recognizeProduct,
    learnProductSample,
    getProductSamples,
    deleteProductSample,
    clearError,
  };
}
