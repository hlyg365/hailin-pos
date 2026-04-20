/**
 * 语音播报服务 (TTS - Text-to-Speech)
 * 使用 Android 原生 TextToSpeech API
 */

import { PluginListenerHandle } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

// 定义 TTS 插件接口
interface TTSPlugin {
  speak(options: { text: string; id?: string; rate?: number; pitch?: number }): Promise<{ status: string; data?: string }>;
  stop(): Promise<{ status: string }>;
  getStatus(): Promise<{
    initialized: boolean;
    speaking: boolean;
    language: string;
    speechRate: number;
    pitch: number;
  }>;
  setLanguage(options: { language: string }): Promise<{ status: string }>;
  setSpeechRate(options: { rate: number }): Promise<{ status: string }>;
  setPitch(options: { pitch: number }): Promise<{ status: string }>;
  isLanguageAvailable(options: { language: string }): Promise<{ available: boolean; code: number }>;
}

declare global {
  interface Window {
    TTS?: {
      speak: TTSPlugin['speak'];
      stop: TTSPlugin['stop'];
      getStatus: TTSPlugin['getStatus'];
      setLanguage: TTSPlugin['setLanguage'];
      setSpeechRate: TTSPlugin['setSpeechRate'];
      setPitch: TTSPlugin['setPitch'];
      isLanguageAvailable: TTSPlugin['isLanguageAvailable'];
    };
  }
}

// 获取 TTS 插件实例
function getTTSPlugin(): TTSPlugin | null {
  if (Capacitor.isNativePlatform()) {
    const plugin = window.TTS;
    if (!plugin) {
      console.warn('[TTS] 插件未安装或未初始化');
      return null;
    }
    return plugin;
  }
  // Web 端模拟
  return null;
}

// TTS 事件回调类型
type TTSEventCallback = (event: { status: string; data?: string }) => void;

// TTS 服务类
class TTSService {
  private listeners: PluginListenerHandle[] = [];
  private isReady: boolean = false;
  private onReadyCallback?: () => void;

  constructor() {
    this.init();
  }

  /**
   * 初始化 TTS 服务
   */
  private async init() {
    const plugin = getTTSPlugin();
    if (!plugin) {
      console.warn('[TTS] 当前平台不支持原生 TTS');
      return;
    }

    try {
      // 获取状态
      const status = await plugin.getStatus();
      this.isReady = status.initialized;
      
      if (this.isReady) {
        console.log('[TTS] 初始化成功');
      }
    } catch (error) {
      console.error('[TTS] 初始化失败:', error);
    }
  }

  /**
   * 等待 TTS 准备就绪
   */
  async waitForReady(timeout: number = 5000): Promise<boolean> {
    if (this.isReady) return true;

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(false);
      }, timeout);

      this.onReadyCallback = () => {
        clearTimeout(timeoutId);
        this.isReady = true;
        resolve(true);
      };
    });
  }

  /**
   * 语音播报
   * @param text 要播报的文本
   * @param options 额外选项
   */
  async speak(text: string, options?: { id?: string; rate?: number; pitch?: number }): Promise<boolean> {
    const plugin = getTTSPlugin();
    if (!plugin) {
      // Web 端使用 Web Speech API
      return this.webSpeak(text);
    }

    try {
      await plugin.speak({
        text,
        id: options?.id,
        rate: options?.rate ?? 1.0,
        pitch: options?.pitch ?? 1.0,
      });
      return true;
    } catch (error) {
      console.error('[TTS] 播报失败:', error);
      return false;
    }
  }

  /**
   * Web 端语音播报 (使用 Web Speech API)
   */
  private webSpeak(text: string): Promise<boolean> {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 1.0;
        utterance.onend = () => resolve(true);
        utterance.onerror = () => resolve(false);
        speechSynthesis.speak(utterance);
      } else {
        console.warn('[TTS] 浏览器不支持语音合成');
        resolve(false);
      }
    });
  }

  /**
   * 停止播报
   */
  async stop(): Promise<void> {
    const plugin = getTTSPlugin();
    if (plugin) {
      await plugin.stop();
    } else if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }

  /**
   * 获取 TTS 状态
   */
  async getStatus(): Promise<{
    initialized: boolean;
    speaking: boolean;
    language: string;
    speechRate: number;
    pitch: number;
  } | null> {
    const plugin = getTTSPlugin();
    if (!plugin) return null;

    try {
      return await plugin.getStatus();
    } catch {
      return null;
    }
  }

  /**
   * 设置语言
   */
  async setLanguage(language: 'zh-CN' | 'en-US' | 'en-GB' | 'ja-JP'): Promise<boolean> {
    const plugin = getTTSPlugin();
    if (!plugin) return false;

    try {
      await plugin.setLanguage({ language });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 设置语速 (0.1 - 10.0)
   */
  async setSpeechRate(rate: number): Promise<boolean> {
    const plugin = getTTSPlugin();
    if (!plugin) return false;

    try {
      await plugin.setSpeechRate({ rate });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 设置音调 (0.1 - 10.0)
   */
  async setPitch(pitch: number): Promise<boolean> {
    const plugin = getTTSPlugin();
    if (!plugin) return false;

    try {
      await plugin.setPitch({ pitch });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 销毁服务
   */
  destroy() {
    this.listeners.forEach((listener) => listener.remove());
    this.listeners = [];
  }
}

// 导出单例
export const ttsService = new TTSService();

// 收银场景专用语音播报
export const cashTTS = {
  /**
   * 收款成功播报
   */
  async paymentSuccess(amount: number, paymentMethod: string): Promise<boolean> {
    const amountStr = amount.toFixed(2);
    const methodMap: Record<string, string> = {
      wechat: '微信',
      alipay: '支付宝',
      cash: '现金',
      card: '银行卡',
      member: '会员卡',
    };
    const method = methodMap[paymentMethod] || paymentMethod;
    return ttsService.speak(`收款成功，${amountStr}元，${method}支付`);
  },

  /**
   * 找零播报
   */
  async changeReturned(change: number): Promise<boolean> {
    if (change <= 0) return true;
    return ttsService.speak(`找零${change.toFixed(2)}元，请拿好`);
  },

  /**
   * 欢迎光临
   */
  async welcome(): Promise<boolean> {
    return ttsService.speak('欢迎光临');
  },

  /**
   * 感谢惠顾
   */
  async goodbye(): Promise<boolean> {
    return ttsService.speak('感谢惠顾，欢迎下次光临');
  },

  /**
   * 会员积分播报
   */
  async memberPoints(points: number): Promise<boolean> {
    return ttsService.speak(`获得会员积分${points}分`);
  },

  /**
   * 促销活动播报
   */
  async promotion(message: string): Promise<boolean> {
    return ttsService.speak(message);
  },

  /**
   * 错误提示
   */
  async error(message: string): Promise<boolean> {
    return ttsService.speak(`提示：${message}`);
  },

  /**
   * 电子秤重量播报
   */
  async scaleWeight(weight: number, price: number): Promise<boolean> {
    return ttsService.speak(
      `重量${weight.toFixed(2)}公斤，金额${price.toFixed(2)}元`
    );
  },

  /**
   * 订单取消播报
   */
  async orderCancelled(): Promise<boolean> {
    return ttsService.speak('订单已取消');
  },

  /**
   * 连接断开提示
   */
  async connectionLost(device: string): Promise<boolean> {
    return ttsService.speak(`${device}连接已断开，请检查`);
  },
};

export default ttsService;
