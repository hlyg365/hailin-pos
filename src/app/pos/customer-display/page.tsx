'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { QrCode, Volume2, VolumeX } from 'lucide-react';
import { getSpeechService, SpeechService } from '@/lib/speech-service';
import QRCode from 'qrcode';

// 商品类型
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  isWeighted: boolean;
  discount: number;
  imageUrl?: string;
  icon?: string;
}

// 店铺配置
interface ShopConfig {
  name: string;
  address: string;
}

// 广告内容类型
interface Advertisement {
  id: string;
  type: 'image' | 'video' | 'promotion' | 'text' | 'member';
  title: string;
  subtitle?: string;
  content?: string;
  image?: string;
  backgroundColor?: string;
  textColor?: string;
  duration: number; // 显示时长（秒）
  enabled?: boolean;
  order?: number;
  // 会员专属字段
  showQrCode?: boolean;
  qrCodeUrl?: string;
  miniProgramLink?: string;
  qrCodePosition?: 'left' | 'right' | 'bottom';
}

// 默认店铺配置
const defaultShopConfig: ShopConfig = {
  name: '海邻到家便利店',
  address: '南阳天润苑B区店',
};

// 默认广告内容
const defaultAdvertisements: Advertisement[] = [
  {
    id: 'ad1',
    type: 'promotion',
    title: '新鲜水果',
    subtitle: '每日直采 品质保证',
    content: '🍎 香蕉 6.00元/斤\n🍊 橙子 5.50元/斤\n🍇 葡萄 12.00元/斤',
    backgroundColor: 'from-green-500 to-emerald-600',
    textColor: 'text-white',
    duration: 8,
    enabled: true,
    order: 1,
  },
  {
    id: 'ad2',
    type: 'member',
    title: '会员专享',
    subtitle: '扫码注册 立享优惠',
    content: '🎁 新会员注册送50积分\n💳 会员购物95折\n🏆 积分可抵现金',
    backgroundColor: 'from-purple-500 to-indigo-600',
    textColor: 'text-white',
    duration: 10,
    enabled: true,
    order: 2,
    showQrCode: true,
    qrCodePosition: 'right',
  },
  {
    id: 'ad3',
    type: 'promotion',
    title: '限时特惠',
    subtitle: '今日特价 限量抢购',
    content: '🥛 纯牛奶 买二送一\n🍪 进口饼干 7折\n🧃 鲜榨果汁 买一送一',
    backgroundColor: 'from-orange-500 to-red-500',
    textColor: 'text-white',
    duration: 8,
    enabled: true,
    order: 3,
  },
  {
    id: 'ad4',
    type: 'promotion',
    title: '海邻到家',
    subtitle: '社区便利店 品质生活',
    content: '📱 扫码下单 30分钟送达\n🏠 满额免运费\n💚 新鲜直达 品质保障',
    backgroundColor: 'from-blue-500 to-cyan-500',
    textColor: 'text-white',
    duration: 8,
    enabled: true,
    order: 4,
  },
];

// 从 localStorage 获取购物车数据
const getCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('pos_cart');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// 从 localStorage 获取店铺配置
const getShopConfigFromStorage = (): ShopConfig => {
  if (typeof window === 'undefined') return defaultShopConfig;
  try {
    const data = localStorage.getItem('pos_shop_config');
    return data ? JSON.parse(data) : defaultShopConfig;
  } catch {
    return defaultShopConfig;
  }
};

// 从 localStorage 获取会员信息
const getMemberFromStorage = (): { name: string; points: number } | null => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem('pos_member');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

// 从 localStorage 获取优惠信息
const getDiscountFromStorage = (): {
  memberDiscount: number;
  pointsDiscount: number;
  couponDiscount: number;
  promotionDiscount: number;
} => {
  if (typeof window === 'undefined') return { memberDiscount: 0, pointsDiscount: 0, couponDiscount: 0, promotionDiscount: 0 };
  try {
    const data = localStorage.getItem('pos_discount');
    return data ? JSON.parse(data) : { memberDiscount: 0, pointsDiscount: 0, couponDiscount: 0, promotionDiscount: 0 };
  } catch {
    return { memberDiscount: 0, pointsDiscount: 0, couponDiscount: 0, promotionDiscount: 0 };
  }
};

// 获取广告内容
const getAdvertisements = (): Advertisement[] => {
  if (typeof window === 'undefined') return defaultAdvertisements;
  try {
    const data = localStorage.getItem('pos_advertisements');
    if (data) {
      const ads = JSON.parse(data);
      // 过滤启用的广告并按顺序排序
      return ads.filter((ad: Advertisement) => ad.enabled !== false).sort((a: Advertisement, b: Advertisement) => (a.order || 0) - (b.order || 0));
    }
    return defaultAdvertisements;
  } catch {
    return defaultAdvertisements;
  }
};

// 商品图标映射
const productIcons: Record<string, string> = {
  '矿泉水': '💧', '可乐': '🥤', '方便面': '🍜', '薯片': '🥔',
  '巧克力': '🍫', '酸奶': '🥛', '香蕉': '🍌', '苹果': '🍎',
  '西红柿': '🍅', '土豆': '🥔', '大白菜': '🥬', '馒头': '🥟',
  '鸡蛋': '🥚', '玉米': '🌽', '红薯': '🍠', '牛奶': '🥛',
  '面包': '🍞', '饼干': '🍪', '果汁': '🧃', '啤酒': '🍺',
  '香烟': '🚬', '纸巾': '🧻', '洗衣液': '🧴', '牙膏': '🪥',
  '洗发水': '🧴', '沐浴露': '🧴', '酱油': '🍶', '醋': '🍶',
  '食用油': '🫒', '大米': '🍚', '面粉': '🌾', '猪肉': '🥩',
  '牛肉': '🥩', '鸡肉': '🍗', '鱼': '🐟', '虾': '🦐',
  '蟹': '🦀', '鳄鱼钳': '🔧', '黄金叶': '📦',
};

// 获取商品图标
const getProductIcon = (name: string): string => {
  for (const key of Object.keys(productIcons)) {
    if (name.includes(key)) return productIcons[key];
  }
  return '📦';
};

// 广告轮播组件
function AdCarousel({ advertisements }: { advertisements: Advertisement[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [memberQrCodeUrl, setMemberQrCodeUrl] = useState<string>('');
  
  // 生成会员注册二维码
  useEffect(() => {
    const generateMemberQrCode = async () => {
      try {
        // 获取当前域名，生成会员注册链接
        const domain = process.env.NEXT_PUBLIC_COZE_PROJECT_DOMAIN_DEFAULT || 
          (typeof window !== 'undefined' ? window.location.origin : '');
        const registerUrl = `${domain}/member/register`;
        
        // 使用 QRCode 库生成二维码
        const qrDataUrl = await QRCode.toDataURL(registerUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        
        setMemberQrCodeUrl(qrDataUrl);
      } catch (error) {
        console.error('生成会员注册二维码失败:', error);
      }
    };
    
    generateMemberQrCode();
  }, []);

  useEffect(() => {
    const currentAd = advertisements[currentIndex];
    const duration = currentAd?.duration || 8;
    const interval = 100; // 每100ms更新一次进度

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + (100 / (duration * 10));
      });
    }, interval);

    const slideTimer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % advertisements.length);
      setProgress(0);
    }, duration * 1000);

    return () => {
      clearInterval(progressTimer);
      clearInterval(slideTimer);
    };
  }, [currentIndex, advertisements]);

  const currentAd = advertisements[currentIndex];

  if (!currentAd) return null;

  // 判断是否显示二维码以及布局
  const showQrCode = currentAd.showQrCode;
  const qrPosition = currentAd.qrCodePosition || 'right';
  const isHorizontalLayout = showQrCode && qrPosition !== 'bottom';

  return (
    <div className={`h-full w-full bg-gradient-to-br ${currentAd.backgroundColor} flex flex-col`}>
      {/* 广告内容 */}
      <div className={`flex-1 flex items-center justify-center p-8 ${
        isHorizontalLayout ? 'flex-row gap-12' : 'flex-col'
      }`}>
        {/* 文字内容区域 */}
        <div className={isHorizontalLayout ? 'flex-1' : ''}>
          <h1 className={`font-bold ${currentAd.textColor} mb-4 text-center animate-pulse ${
            showQrCode ? 'text-4xl' : 'text-5xl'
          }`}>
            {currentAd.title}
          </h1>
          {currentAd.subtitle && (
            <p className={`${currentAd.textColor} opacity-90 mb-6 text-center ${
              showQrCode ? 'text-xl' : 'text-2xl'
            }`}>
              {currentAd.subtitle}
            </p>
          )}
          {currentAd.content && (
            <div className={`${currentAd.textColor} whitespace-pre-line text-center leading-relaxed ${
              showQrCode ? 'text-lg' : 'text-xl'
            }`}>
              {currentAd.content}
            </div>
          )}
        </div>

        {/* 二维码区域 */}
        {showQrCode && (
          <div className={`flex flex-col items-center ${
            qrPosition === 'bottom' ? 'mt-8' : ''
          }`}>
            <div className="bg-white rounded-2xl p-4 shadow-2xl">
              {currentAd.qrCodeUrl ? (
                <img 
                  src={currentAd.qrCodeUrl} 
                  alt="扫码开通会员" 
                  className="w-40 h-40 object-contain"
                />
              ) : memberQrCodeUrl ? (
                <img 
                  src={memberQrCodeUrl} 
                  alt="扫码注册会员" 
                  className="w-40 h-40 object-contain"
                />
              ) : (
                <div className="w-40 h-40 flex flex-col items-center justify-center bg-gray-50 rounded-xl">
                  <QrCode className="w-24 h-24 text-gray-300" />
                  <span className="text-xs text-gray-400 mt-2">加载中...</span>
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <p className={`${currentAd.textColor} text-lg font-medium`}>
                扫码开通会员
              </p>
              <p className={`${currentAd.textColor} text-sm opacity-80 mt-1`}>
                享受更多优惠
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 进度指示器 */}
      <div className="p-4">
        <div className="flex items-center justify-center gap-2">
          {advertisements.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? `w-8 ${currentAd.textColor?.replace('text-', 'bg-')} opacity-100` 
                  : 'w-4 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// 获取广告播报文本
const getAdSpeechText = (ad: Advertisement): string => {
  let text = '';
  if (ad.title) text += ad.title + '。';
  if (ad.subtitle) text += ad.subtitle + '。';
  if (ad.content) {
    // 移除表情符号
    const cleanContent = ad.content.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s,.!?，。！？]/g, '');
    text += cleanContent;
  }
  return text;
};

export default function CustomerDisplayPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shopConfig, setShopConfig] = useState<ShopConfig>(defaultShopConfig);
  const [member, setMember] = useState<{ name: string; points: number } | null>(null);
  const [discount, setDiscount] = useState({
    memberDiscount: 0,
    pointsDiscount: 0,
    couponDiscount: 0,
    promotionDiscount: 0,
  });
  const [advertisements, setAdvertisements] = useState<Advertisement[]>(defaultAdvertisements);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isIdle, setIsIdle] = useState(true); // 是否处于空闲状态（显示广告）
  const [mounted, setMounted] = useState(false);
  
  // 语音播报相关状态
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const speechServiceRef = useRef<SpeechService | null>(null);
  const lastPaymentRef = useRef<number>(0);
  const adIndexRef = useRef<number>(0);
  const isSpeakingRef = useRef<boolean>(false);

  // 客户端挂载
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    
    // 初始化语音服务
    if (SpeechService.isSupported()) {
      speechServiceRef.current = getSpeechService({
        enabled: true,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
      });
    }
    
    return () => {
      // 清理
      if (speechServiceRef.current) {
        speechServiceRef.current.stopAll();
      }
    };
  }, []);

  // 更新时间
  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [mounted]);

  // 同步数据
  const syncData = useCallback(() => {
    const newCart = getCartFromStorage();
    setCart(newCart);
    setShopConfig(getShopConfigFromStorage());
    setMember(getMemberFromStorage());
    setDiscount(getDiscountFromStorage());
    setAdvertisements(getAdvertisements());
    
    // 判断是否空闲：购物车为空时显示广告
    setIsIdle(newCart.length === 0);
  }, []);

  // 初始化和监听 storage 变化
  useEffect(() => {
    syncData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('pos_')) {
        syncData();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const pollInterval = setInterval(syncData, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [syncData]);

  // 监听收款事件
  useEffect(() => {
    const handlePaymentAnnounce = (e: CustomEvent) => {
      if (!speechEnabled || !speechServiceRef.current) return;
      
      const { amount, method } = e.detail;
      if (amount && amount > 0) {
        // 停止广告播报
        speechServiceRef.current.stopAll();
        
        // 播报收款金额
        const text = `收款成功，${amount.toFixed(2)}元`;
        speechServiceRef.current.speak(text);
      }
    };

    // 监听 localStorage 中的收款事件
    const checkPaymentEvent = () => {
      try {
        const paymentData = localStorage.getItem('pos_payment_event');
        if (paymentData) {
          const payment = JSON.parse(paymentData);
          if (payment.timestamp > lastPaymentRef.current) {
            lastPaymentRef.current = payment.timestamp;
            
            if (speechEnabled && speechServiceRef.current && payment.amount > 0) {
              // 停止广告播报
              speechServiceRef.current.stopAll();
              
              // 播报收款金额
              let text = `收款成功，${payment.amount.toFixed(2)}元`;
              if (payment.method) {
                text = `${payment.method}收款成功，${payment.amount.toFixed(2)}元`;
              }
              speechServiceRef.current.speak(text);
            }
          }
        }
      } catch (err) {
        // 忽略错误
      }
    };

    window.addEventListener('paymentAnnounce', handlePaymentAnnounce as EventListener);
    const paymentCheckInterval = setInterval(checkPaymentEvent, 1000);

    return () => {
      window.removeEventListener('paymentAnnounce', handlePaymentAnnounce as EventListener);
      clearInterval(paymentCheckInterval);
    };
  }, [speechEnabled]);

  // 空闲时广告播报
  useEffect(() => {
    if (!mounted || !speechEnabled || !isIdle || !speechServiceRef.current) return;
    
    // 检查是否正在播报
    if (isSpeakingRef.current) return;
    
    const enabledAds = advertisements.filter(ad => ad.enabled !== false);
    if (enabledAds.length === 0) return;

    let adTimer: NodeJS.Timeout;
    
    const speakAd = async () => {
      if (!speechServiceRef.current || !speechEnabled || !isIdle) return;
      
      isSpeakingRef.current = true;
      
      const currentAd = enabledAds[adIndexRef.current];
      const text = getAdSpeechText(currentAd);
      
      if (text) {
        await speechServiceRef.current.speak(text);
      }
      
      // 移动到下一个广告
      adIndexRef.current = (adIndexRef.current + 1) % enabledAds.length;
      isSpeakingRef.current = false;
    };

    // 延迟开始播报（等待广告切换）
    adTimer = setTimeout(() => {
      speakAd();
    }, 2000);

    // 每隔一段时间播报下一个广告
    const interval = setInterval(() => {
      if (!isIdle || !speechEnabled) {
        clearInterval(interval);
        return;
      }
      speakAd();
    }, 15000); // 每15秒播报一次

    return () => {
      clearTimeout(adTimer);
      clearInterval(interval);
    };
  }, [mounted, speechEnabled, isIdle, advertisements]);

  // 购物时停止广告播报
  useEffect(() => {
    if (!isIdle && speechServiceRef.current) {
      speechServiceRef.current.stopAll();
      isSpeakingRef.current = false;
    }
  }, [isIdle]);

  // 切换语音播报开关
  const toggleSpeech = () => {
    setSpeechEnabled(prev => {
      if (prev && speechServiceRef.current) {
        speechServiceRef.current.stopAll();
      }
      return !prev;
    });
  };

  // 计算金额
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDiscount = discount.memberDiscount + discount.pointsDiscount + discount.couponDiscount + discount.promotionDiscount;
  const finalAmount = subtotal - totalDiscount;
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const earnedPoints = Math.floor(finalAmount);

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* 空闲状态：全屏显示广告 */}
      {isIdle ? (
        <div className="w-full h-screen">
          <AdCarousel advertisements={advertisements} />
        </div>
      ) : (
        /* 购物状态：显示购物内容 */
        <div className="w-full flex">
          {/* 左侧品牌展示区 */}
          <div className="w-2/5 flex flex-col items-center justify-center p-8 text-white relative overflow-hidden bg-gradient-to-br from-red-600 via-red-500 to-orange-500">
            {/* 装饰背景 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full"></div>
              <div className="absolute bottom-20 right-10 w-24 h-24 border-4 border-white rounded-full"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 border-2 border-white rotate-45"></div>
            </div>

            {/* 品牌内容 */}
            <div className="relative z-10 text-center">
              <div className="mb-6">
                <h1 className="text-8xl font-bold tracking-wider" style={{ fontFamily: 'serif' }}>
                  <span className="inline-block transform -rotate-3">海</span>
                  <span className="inline-block transform rotate-3">邻</span>
                </h1>
                <div className="text-3xl font-light mt-2 tracking-widest">到家</div>
              </div>

              <div className="text-xl mb-8 tracking-widest border-t border-white/30 pt-6">
                社区便利店 · 品质生活
              </div>

              <div className="bg-white/20 rounded-lg px-6 py-3 backdrop-blur-sm">
                {currentTime && (
                  <>
                    <div className="text-4xl font-mono font-bold">
                      {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div className="text-sm mt-1 opacity-80">
                      {currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 text-center text-sm opacity-60">
              欢迎光临 · 祝您购物愉快
            </div>
          </div>

          {/* 右侧购物车显示区 */}
          <div className="w-3/5 bg-gray-50 flex flex-col">
            {/* 顶部店铺信息 */}
            <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{shopConfig.name} {shopConfig.address} 欢迎您！</h2>
                {member && (
                  <p className="text-sm opacity-80 mt-1">会员：{member.name} · 积分：{member.points}</p>
                )}
              </div>
              {/* 语音播报开关 */}
              <button
                onClick={toggleSpeech}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  speechEnabled 
                    ? 'bg-white/20 hover:bg-white/30' 
                    : 'bg-white/10 hover:bg-white/20 opacity-60'
                }`}
                title={speechEnabled ? '点击关闭语音播报' : '点击开启语音播报'}
              >
                {speechEnabled ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    <span className="text-sm">播报中</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                    <span className="text-sm">已静音</span>
                  </>
                )}
              </button>
            </div>

            {/* 商品列表区域 */}
            <div className="flex-1 overflow-auto p-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-xl">等待商品录入...</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  {/* 表头 */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-100 font-medium text-gray-600 text-sm">
                    <div className="col-span-1"></div>
                    <div className="col-span-5">商品名称</div>
                    <div className="col-span-2 text-center">数量/重量</div>
                    <div className="col-span-2 text-right">单价</div>
                    <div className="col-span-2 text-right">小计</div>
                  </div>

                  {/* 商品行 */}
                  <div className="divide-y divide-gray-100">
                    {cart.map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 transition-colors"
                      >
                        <div className="col-span-1">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="w-8 h-8 object-cover rounded-lg"
                              onError={(e) => {
                                // 图片加载失败时显示图标
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div className={`w-8 h-8 flex items-center justify-center text-xl ${item.imageUrl ? 'hidden' : ''}`}>
                            {item.icon || getProductIcon(item.name)}
                          </div>
                        </div>
                        <div className="col-span-5 font-medium text-gray-800 truncate">{item.name}</div>
                        <div className="col-span-2 text-center text-gray-600">
                          {item.isWeighted ? `${item.quantity}斤` : item.quantity}
                        </div>
                        <div className="col-span-2 text-right text-gray-600">¥{item.price.toFixed(2)}</div>
                        <div className="col-span-2 text-right font-medium text-gray-800">
                          ¥{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 底部结算区域 */}
            <div className="bg-white border-t shadow-lg">
              {/* 优惠信息 */}
              {cart.length > 0 && (
                <div className="px-6 py-3 border-b bg-gray-50">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">商品合计：</span>
                      <span className="font-medium">¥{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">获得积分：</span>
                      <span className="font-medium text-orange-500">{earnedPoints}</span>
                    </div>
                    {discount.promotionDiscount > 0 && (
                      <div className="flex justify-between text-orange-500">
                        <span>活动优惠：</span>
                        <span>-¥{discount.promotionDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {discount.memberDiscount > 0 && (
                      <div className="flex justify-between text-orange-500">
                        <span>会员优惠：</span>
                        <span>-¥{discount.memberDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {discount.pointsDiscount > 0 && (
                      <div className="flex justify-between text-orange-500">
                        <span>积分抵扣：</span>
                        <span>-¥{discount.pointsDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {discount.couponDiscount > 0 && (
                      <div className="flex justify-between text-orange-500">
                        <span>优惠券抵扣：</span>
                        <span>-¥{discount.couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 总计 */}
              <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50">
                <div className="flex items-center justify-between">
                  <div className="text-gray-600">
                    共 <span className="font-bold text-gray-800">{totalQuantity}</span> 件商品
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-gray-600 text-lg">应付金额</span>
                    <span className="text-red-600 text-3xl font-bold">¥{finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部品牌 */}
            <div className="bg-red-600 text-white text-center py-2 text-sm">
              海邻收银 · 智慧零售
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
