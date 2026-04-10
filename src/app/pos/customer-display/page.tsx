'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { QrCode, Volume2, VolumeX, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { getSpeechService, SpeechService } from '@/lib/speech-service';
import QRCode from 'qrcode';

// 检测是否为移动设备
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

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
  duration: number;
  enabled?: boolean;
  order?: number;
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
    content: '香蕉 6.00元/斤\n橙子 5.50元/斤\n葡萄 12.00元/斤',
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
    content: '新会员注册送50积分\n会员购物95折\n积分可抵现金',
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
    content: '纯牛奶 买二送一\n进口饼干 7折\n鲜榨果汁 买一送一',
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
    content: '扫码下单 30分钟送达\n满额免运费\n新鲜直达 品质保障',
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
const getDiscountFromStorage = () => {
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
};

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
    QRCode.toDataURL(window.location.origin + '/register?store=hailin', {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(url => setMemberQrCodeUrl(url)).catch(() => {});
  }, []);

  useEffect(() => {
    if (advertisements.length === 0) return;
    
    const currentAd = advertisements[currentIndex];
    const duration = currentAd?.duration || 8;
    
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (100 / (duration * 10));
      });
    }, 100);
    
    const timer = setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % advertisements.length);
    }, duration * 1000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [currentIndex, advertisements]);

  const currentAd = advertisements[currentIndex] || advertisements[0];
  if (!currentAd) return null;

  return (
    <div className={`relative min-h-screen bg-gradient-to-br ${currentAd.backgroundColor || 'from-blue-500 to-purple-600'} flex items-center justify-center p-8`}>
      {/* 进度条 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
        <div className="h-full bg-white/80 transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>
      
      {/* 内容区域 */}
      <div className={`text-center text-white max-w-4xl ${currentAd.qrCodePosition === 'right' ? 'flex items-center justify-center gap-16' : ''}`}>
        <div className={currentAd.qrCodePosition === 'right' ? 'text-left' : ''}>
          <div className="text-6xl mb-6">{currentAd.title}</div>
          <div className="text-3xl mb-8 opacity-90">{currentAd.subtitle}</div>
          
          {currentAd.type === 'member' && currentAd.showQrCode && (
            <div className="mb-8">
              <img src={memberQrCodeUrl} alt="会员注册" className="w-48 h-48 mx-auto bg-white p-2 rounded-lg" />
              <div className="mt-4 text-xl">扫码注册会员</div>
            </div>
          )}
          
          <div className="text-xl whitespace-pre-line opacity-80 bg-black/20 rounded-xl p-6 backdrop-blur-sm">
            {currentAd.content}
          </div>
        </div>
        
        {currentAd.type === 'member' && currentAd.showQrCode && currentAd.qrCodePosition === 'right' && (
          <div className="text-center">
            <img src={memberQrCodeUrl} alt="会员注册" className="w-64 h-64 bg-white p-4 rounded-2xl shadow-2xl" />
            <div className="mt-6 text-2xl">扫码注册会员</div>
          </div>
        )}
      </div>
      
      {/* 指示器 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {advertisements.map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i === currentIndex ? 'bg-white' : 'bg-white/30'}`} />
        ))}
      </div>
    </div>
  );
}

// 获取广告语音文本
const getAdSpeechText = (ad: Advertisement): string => {
  if (ad.type === 'member') {
    return `欢迎光临海邻到家便利店，新会员注册即送50积分，会员购物享受95折优惠，积分可直接抵现`;
  }
  if (ad.type === 'promotion') {
    return `${ad.title}，${ad.subtitle || ''}，${(ad.content || '').replace(/\n/g, '，')}`;
  }
  return `${ad.title}，${ad.subtitle || ''}`;
};

export default function CustomerDisplayPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shopConfig, setShopConfig] = useState<ShopConfig>(defaultShopConfig);
  const [member, setMember] = useState<{ name: string; points: number } | null>(null);
  const [discount, setDiscount] = useState({ memberDiscount: 0, pointsDiscount: 0, couponDiscount: 0, promotionDiscount: 0 });
  const [advertisements, setAdvertisements] = useState<Advertisement[]>(defaultAdvertisements);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isIdle, setIsIdle] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // 语音播报相关状态
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const speechServiceRef = useRef<SpeechService | null>(null);
  const lastPaymentRef = useRef<number>(0);
  const adIndexRef = useRef<number>(0);
  const isSpeakingRef = useRef<boolean>(false);

  // 客户端挂载
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    
    // 检测网络状态
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // 初始化语音服务
    if (SpeechService.isSupported()) {
      speechServiceRef.current = getSpeechService({
        enabled: true,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
      });
    }
    
    console.log('[CustomerDisplay] 客显屏已启动（独立设备模式）');
    
    return () => {
      if (speechServiceRef.current) {
        speechServiceRef.current.stopAll();
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
        speechServiceRef.current.stopAll();
        speechServiceRef.current.speak(`收款成功，${amount.toFixed(2)}元`);
      }
    };

    const checkPaymentEvent = () => {
      try {
        const paymentData = localStorage.getItem('pos_payment_event');
        if (paymentData) {
          const payment = JSON.parse(paymentData);
          if (payment.timestamp > lastPaymentRef.current) {
            lastPaymentRef.current = payment.timestamp;
            if (speechEnabled && speechServiceRef.current && payment.amount > 0) {
              speechServiceRef.current.stopAll();
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
      
      adIndexRef.current = (adIndexRef.current + 1) % enabledAds.length;
      isSpeakingRef.current = false;
    };

    adTimer = setTimeout(() => {
      speakAd();
    }, 2000);

    const interval = setInterval(() => {
      if (!isIdle || !speechEnabled) {
        clearInterval(interval);
        return;
      }
      speakAd();
    }, 15000);

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

  // 手动刷新数据
  const refreshData = () => {
    syncData();
  };

  // 计算金额
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDiscount = discount.memberDiscount + discount.pointsDiscount + discount.couponDiscount + discount.promotionDiscount;
  const finalAmount = subtotal - totalDiscount;
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const earnedPoints = Math.floor(finalAmount);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* 顶部状态栏 - 简化版 */}
      <div className="bg-black/80 text-white px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg">客显屏</span>
          <span className={`px-2 py-0.5 rounded text-xs ${isOnline ? 'bg-green-600' : 'bg-red-600'}`}>
            {isOnline ? '在线' : '离线'}
          </span>
          <span className="text-gray-400">
            {currentTime?.toLocaleTimeString('zh-CN')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="刷新数据"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleSpeech}
            className={`p-2 rounded transition-colors ${speechEnabled ? 'hover:bg-gray-700' : 'bg-gray-700 opacity-50'}`}
            title={speechEnabled ? '关闭语音' : '开启语音'}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* 空闲状态：全屏显示广告 */}
      {isIdle ? (
        <div className="flex-1">
          <AdCarousel advertisements={advertisements} />
        </div>
      ) : (
        /* 购物状态：显示购物内容 */
        <div className="flex-1 flex">
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
              <button
                onClick={toggleSpeech}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  speechEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-white/10 opacity-60'
                }`}
              >
                {speechEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                <span>{speechEnabled ? '语音开' : '语音关'}</span>
              </button>
            </div>

            {/* 购物车列表 */}
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr className="text-gray-600 text-sm">
                    <th className="text-left py-2 px-2">商品</th>
                    <th className="text-center py-2 px-2 w-20">数量</th>
                    <th className="text-right py-2 px-2 w-24">单价</th>
                    <th className="text-right py-2 px-2 w-24">小计</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-gray-100">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{item.icon || getProductIcon(item.name)}</span>
                          <div>
                            <div className="font-medium text-gray-800">{item.name}</div>
                            {item.isWeighted && <span className="text-xs text-orange-500">称重商品</span>}
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className="bg-gray-100 px-3 py-1 rounded">{item.quantity}{item.unit}</span>
                      </td>
                      <td className="text-right py-3 px-2 text-gray-600">
                        ¥{item.price.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-2 font-bold text-gray-800">
                        ¥{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 金额汇总 */}
            <div className="bg-white border-t">
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>商品数量</span>
                  <span>{totalQuantity} 件</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>小计</span>
                  <span>¥{subtotal.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>优惠</span>
                    <span>-¥{totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-2xl font-bold text-red-600 pt-2 border-t">
                  <span>应付</span>
                  <span>¥{finalAmount.toFixed(2)}</span>
                </div>
                {member && (
                  <div className="flex justify-between text-blue-600 text-sm">
                    <span>本次积分</span>
                    <span>+{earnedPoints} 积分</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
