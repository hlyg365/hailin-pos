/**
 * 收银台语音播报 Hook
 * 提供收银场景下的语音播报功能
 * 
 * 功能：
 * 1. 扫码成功播报
 * 2. 商品加入购物车播报
 * 3. 支付成功播报
 * 4. 会员识别播报
 * 5. 错误提示播报
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// 语音播报配置
interface PosSpeechConfig {
  enabled: boolean;           // 总开关
  scanEnabled: boolean;       // 扫码播报开关
  cartEnabled: boolean;       // 购物车播报开关
  paymentEnabled: boolean;    // 支付播报开关
  memberEnabled: boolean;     // 会员识别播报开关
  errorEnabled: boolean;      // 错误提示播报开关
  meituanEnabled: boolean;    // 美团订单播报开关
  volume: number;             // 音量 0-100
  rate: number;               // 语速 0.5-2
  announceItemCount: boolean; // 是否播报商品件数
}

// 默认配置
const defaultConfig: PosSpeechConfig = {
  enabled: true,
  scanEnabled: true,
  cartEnabled: false,
  paymentEnabled: true,
  memberEnabled: true,
  errorEnabled: true,
  meituanEnabled: true,
  volume: 80,
  rate: 1.0,
  announceItemCount: true,
};

// 从 localStorage 加载配置
function loadConfig(): PosSpeechConfig {
  if (typeof window === 'undefined') {
    return defaultConfig; // 服务端返回默认配置
  }
  try {
    const saved = localStorage.getItem('pos_speech_config');
    if (saved) {
      return { ...defaultConfig, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('加载语音配置失败:', e);
  }
  return defaultConfig;
}

// 保存配置到 localStorage
function saveConfig(config: PosSpeechConfig) {
  if (typeof window === 'undefined') {
    return; // 服务端跳过保存
  }
  try {
    localStorage.setItem('pos_speech_config', JSON.stringify(config));
  } catch (e) {
    console.error('保存语音配置失败:', e);
  }
}

// 金额转中文（用于播报）
function amountToChinese(amount: number): string {
  const yuan = Math.floor(amount);
  const jiao = Math.floor((amount * 10) % 10);
  const fen = Math.floor((amount * 100) % 10);
  
  let result = '';
  if (yuan > 0) {
    result += `${yuan}元`;
  }
  if (jiao > 0) {
    result += `${jiao}角`;
  }
  if (fen > 0) {
    result += `${fen}分`;
  }
  if (!result) {
    result = '0元';
  }
  return result;
}

export function usePosSpeech() {
  const [config, setConfig] = useState<PosSpeechConfig>(loadConfig);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // 初始化语音合成
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      synthesisRef.current = window.speechSynthesis;
      
      // 加载语音列表
      const loadVoices = () => {
        const voices = synthesisRef.current?.getVoices() || [];
        // 优先选择中文女声
        const chineseVoice = voices.find(v => 
          v.lang.includes('zh-CN') && v.name.includes('Female')
        ) || voices.find(v => 
          v.lang.includes('zh-CN')
        ) || voices.find(v => 
          v.lang.includes('zh')
        );
        
        if (chineseVoice) {
          voiceRef.current = chineseVoice;
        }
      };
      
      // 某些浏览器需要等待 voiceschanged 事件
      loadVoices();
      synthesisRef.current.addEventListener('voiceschanged', loadVoices);
      
      return () => {
        synthesisRef.current?.removeEventListener('voiceschanged', loadVoices);
        synthesisRef.current?.cancel();
      };
    }
  }, []);

  // 激活语音（需要用户交互触发）
  const activate = useCallback(() => {
    if (isSupported && !isActivated) {
      // 播放一个静音的语音来激活
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      synthesisRef.current?.speak(utterance);
      setIsActivated(true);
    }
  }, [isSupported, isActivated]);

  // 核心播报函数
  const speak = useCallback((text: string, type: 'scan' | 'cart' | 'payment' | 'member' | 'error' | 'meituan' | 'other' = 'other') => {
    if (!isSupported || !config.enabled) {
      console.log('[语音播报] 功能未启用或不支持');
      return;
    }

    // 检查对应类型的开关
    const typeEnabled = {
      scan: config.scanEnabled,
      cart: config.cartEnabled,
      payment: config.paymentEnabled,
      member: config.memberEnabled,
      error: config.errorEnabled,
      meituan: config.meituanEnabled,
      other: true,
    }[type];

    if (!typeEnabled) {
      console.log(`[语音播报] ${type} 类型播报已关闭`);
      return;
    }

    // 取消当前播报
    synthesisRef.current?.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = config.rate;
    utterance.volume = config.volume / 100;
    utterance.pitch = 1.0;

    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log(`[语音播报] 开始: ${text}`);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      console.error('[语音播报] 错误:', event.error);
    };

    currentUtteranceRef.current = utterance;
    synthesisRef.current?.speak(utterance);
  }, [isSupported, config]);

  // 停止播报
  const stop = useCallback(() => {
    synthesisRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  // 更新配置
  const updateConfig = useCallback((updates: Partial<PosSpeechConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      saveConfig(newConfig);
      return newConfig;
    });
  }, []);

  // ========== 场景化播报方法 ==========

  // 扫码成功播报
  const speakScanSuccess = useCallback((productName: string, price: number) => {
    speak(`${productName}，${price}元`, 'scan');
  }, [speak]);

  // 商品加入购物车播报
  const speakAddToCart = useCallback((productName: string, quantity: number, totalPrice: number) => {
    const text = config.announceItemCount
      ? `${productName}，${quantity}件，共${totalPrice.toFixed(1)}元`
      : `${productName}，${totalPrice.toFixed(1)}元`;
    speak(text, 'cart');
  }, [speak, config.announceItemCount]);

  // 支付成功播报
  const speakPaymentSuccess = useCallback((amount: number, method: string, itemCount?: number) => {
    let text = `收款成功，${amountToChinese(amount)}`;
    
    if (config.announceItemCount && itemCount) {
      text = `收款成功，${itemCount}件商品，共${amountToChinese(amount)}`;
    }
    
    if (method) {
      const methodText = {
        'cash': '现金',
        'wechat': '微信',
        'alipay': '支付宝',
        'card': '银行卡',
      }[method] || method;
      text += `，${methodText}支付`;
    }
    
    speak(text, 'payment');
  }, [speak, config.announceItemCount]);

  // 会员识别播报
  const speakMemberIdentified = useCallback((memberName: string, level: string) => {
    const levelText = {
      '普通': '普通会员',
      '银卡': '银卡会员',
      '金卡': '金卡会员',
      '钻石': '钻石会员',
    }[level] || level;
    
    speak(`${memberName}，${levelText}，欢迎光临`, 'member');
  }, [speak]);

  // 错误提示播报
  const speakError = useCallback((message: string) => {
    speak(message, 'error');
  }, [speak]);

  // 美团订单播报
  const speakMeituanOrder = useCallback((orderNo: string) => {
    speak(`美团订单${orderNo}，请及时处理`, 'meituan');
  }, [speak]);

  // 欢迎语播报
  const speakWelcome = useCallback(() => {
    speak('欢迎光临，请扫描商品', 'other');
  }, [speak]);

  return {
    // 状态
    isSupported,
    isActivated,
    isSpeaking,
    config,
    
    // 方法
    activate,
    speak,
    stop,
    updateConfig,
    
    // 场景化播报
    speakScanSuccess,
    speakAddToCart,
    speakPaymentSuccess,
    speakMemberIdentified,
    speakError,
    speakMeituanOrder,
    speakWelcome,
  };
}

export type { PosSpeechConfig };
