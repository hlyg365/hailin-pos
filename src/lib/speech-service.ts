/**
 * 语音播报服务
 * 用于客显屏的语音播报功能
 */

// 语音播报配置
interface SpeechConfig {
  enabled: boolean;
  rate: number;      // 语速 0.1-10
  pitch: number;     // 音调 0-2
  volume: number;    // 音量 0-1
  voiceName?: string; // 指定语音
}

// 默认配置
const defaultConfig: SpeechConfig = {
  enabled: true,
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
};

// 语音播报服务类
class SpeechService {
  private config: SpeechConfig;
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private queue: string[] = [];
  private isProcessingQueue: boolean = false;

  constructor(config: Partial<SpeechConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.synthesis = window.speechSynthesis;
  }

  // 更新配置
  updateConfig(config: Partial<SpeechConfig>) {
    this.config = { ...this.config, ...config };
  }

  // 获取可用的中文语音
  getChineseVoice(): SpeechSynthesisVoice | null {
    const voices = this.synthesis.getVoices();
    
    // 优先级：指定语音 > 中文语音 > 默认语音
    if (this.config.voiceName) {
      const voice = voices.find(v => v.name === this.config.voiceName);
      if (voice) return voice;
    }

    // 查找中文语音
    const chineseVoice = voices.find(v => 
      v.lang.includes('zh') || v.lang.includes('CN')
    );
    
    return chineseVoice || voices[0] || null;
  }

  // 播报文本
  speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.config.enabled) {
        resolve();
        return;
      }

      // 取消当前播报
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.config.rate;
      utterance.pitch = this.config.pitch;
      utterance.volume = this.config.volume;

      const voice = this.getChineseVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        reject(event);
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  // 添加到队列
  addToQueue(text: string) {
    this.queue.push(text);
    this.processQueue();
  }

  // 处理队列
  private async processQueue() {
    if (this.isProcessingQueue || this.queue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.queue.length > 0) {
      const text = this.queue.shift();
      if (text) {
        await this.speak(text);
      }
    }
    
    this.isProcessingQueue = false;
  }

  // 停止播报
  stop() {
    this.synthesis.cancel();
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  // 清空队列
  clearQueue() {
    this.queue = [];
  }

  // 停止所有
  stopAll() {
    this.stop();
    this.clearQueue();
  }

  // 是否正在播报
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  // 检查浏览器支持
  static isSupported(): boolean {
    return 'speechSynthesis' in window;
  }
}

// 创建单例
let speechServiceInstance: SpeechService | null = null;

export function getSpeechService(config?: Partial<SpeechConfig>): SpeechService {
  if (!speechServiceInstance) {
    speechServiceInstance = new SpeechService(config);
  } else if (config) {
    speechServiceInstance.updateConfig(config);
  }
  return speechServiceInstance;
}

export { SpeechService };
export type { SpeechConfig };
