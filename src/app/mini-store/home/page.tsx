'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// 轮播图数据
const SWIPER_IMAGES = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-156 Util-1574-2023-8a5b8f4f1c8a?w=750&h=400&fit=crop',
    title: '新人专享优惠',
    subtitle: '首单满50减10',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=750&h=400&fit=crop',
    title: '夏日清凉季',
    subtitle: '饮料5折起',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=750&h=400&fit=crop',
    title: '社区便利就近选',
    subtitle: '千款商品任你挑',
  },
];

// 功能按钮数据
const FUNCTION_BUTTONS = [
  {
    id: 1,
    icon: '🚚',
    title: '同城配送',
    subtitle: '省心到家',
    color: 'bg-blue-500',
    href: '/mini-store/delivery',
  },
  {
    id: 2,
    icon: '🏃',
    title: '到店自提',
    subtitle: '方便快捷',
    color: 'bg-green-500',
    href: '/mini-store/pickup',
  },
];

// 快捷入口数据
const QUICK_ENTRIES = [
  { id: 1, icon: '💳', title: '在线充值', color: '#8E24AA', href: '/mini-store/recharge' },
  { id: 2, icon: '👥', title: '会员中心', color: '#F57C00', href: '/mini-store/member' },
  { id: 3, icon: '🎁', title: '邀请有奖', color: '#D32F2F', href: '/mini-store/invite' },
  { id: 4, icon: '📦', title: '我的订单', color: '#1976D2', href: '/mini-store/orders' },
  { id: 5, icon: '💰', title: '我的积分', color: '#388E3C', href: '/mini-store/points' },
  { id: 6, icon: '🎟️', title: '优惠券', color: '#C2185B', href: '/mini-store/coupons' },
];

// 商品分类数据
const CATEGORIES = [
  { id: 1, icon: '🧴', name: '生活日用', count: 128 },
  { id: 2, icon: '🍳', name: '家居厨具', count: 96 },
  { id: 3, icon: '🍜', name: '熟食速食', count: 64 },
  { id: 4, icon: '🥤', name: '夏日饮品', count: 52 },
  { id: 5, icon: '✏️', name: '五金文具', count: 88 },
  { id: 6, icon: '🧴', name: '个人护理', count: 76 },
  { id: 7, icon: '🍎', name: '新鲜水果', count: 45 },
  { id: 8, icon: '🥚', name: '蛋奶卤味', count: 38 },
];

// 排行榜数据
const RANKING_DATA = {
  sales: [
    { id: 1, name: '农夫山泉550ml', price: 2.00, sales: 1568, image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=100&h=100&fit=crop' },
    { id: 2, name: '康师傅红烧牛肉面', price: 4.50, sales: 1234, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=100&h=100&fit=crop' },
    { id: 3, name: '维达抽纸超韧系列', price: 12.80, sales: 986, image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=100&h=100&fit=crop' },
  ],
  attention: [
    { id: 1, name: '元气森林气泡水', price: 5.00, attention: 2568, image: 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=100&h=100&fit=crop' },
    { id: 2, name: '三只松鼠坚果礼盒', price: 68.00, attention: 1890, image: 'https://images.unsplash.com/photo-1594901852083-c83b4f1ed8c3?w=100&h=100&fit=crop' },
    { id: 3, name: '蒙牛纯牛奶24盒装', price: 45.90, attention: 1456, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100&h=100&fit=crop' },
  ],
};

// 底部导航数据
const TAB_BAR = [
  { id: 1, icon: '🏠', title: '首页', active: true, href: '/mini-home' },
  { id: 2, icon: '📋', title: '分类', active: false, href: '/mini-store/categories' },
  { id: 3, icon: '🛒', title: '购物车', active: false, href: '/mini-store/cart' },
  { id: 4, icon: '👤', title: '我的', active: false, href: '/mini-store/profile' },
];

// 商品项组件
function ProductItem({ product, rank }: { product: any; rank: number }) {
  return (
    <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <span className={cn(
          "absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white",
          rank === 1 && "bg-yellow-500",
          rank === 2 && "bg-gray-400",
          rank === 3 && "bg-amber-600"
        )}>
          {rank}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
        <p className="text-red-500 font-bold">¥{product.price.toFixed(2)}</p>
        <p className="text-xs text-gray-400">
          {product.sales ? `已售 ${product.sales}` : `关注 ${product.attention}`}
        </p>
      </div>
    </div>
  );
}

// 轮播图组件
function Swiper() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SWIPER_IMAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  return (
    <div 
      className="relative h-48 overflow-hidden rounded-xl"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div 
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {SWIPER_IMAGES.map((item) => (
          <div key={item.id} className="relative flex-shrink-0 w-full h-full">
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h3 className="text-lg font-bold">{item.title}</h3>
              <p className="text-sm opacity-90">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* 指示器 */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {SWIPER_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              current === index ? "bg-white w-6" : "bg-white/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// 搜索栏组件
function SearchBar() {
  const [keyword, setKeyword] = useState('');
  
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2">
        <span className="text-gray-400">🔍</span>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索商品名称"
          className="flex-1 bg-transparent outline-none text-sm"
        />
        {keyword && (
          <button 
            onClick={() => setKeyword('')}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// 功能按钮组件
function FunctionButtons() {
  return (
    <div className="flex justify-center gap-6 py-3">
      {FUNCTION_BUTTONS.map((btn) => (
        <a
          key={btn.id}
          href={btn.href}
          className="flex flex-col items-center gap-1"
        >
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md", btn.color)}>
            {btn.icon}
          </div>
          <span className="text-sm font-medium text-gray-800">{btn.title}</span>
          <span className="text-xs text-gray-500">{btn.subtitle}</span>
        </a>
      ))}
    </div>
  );
}

// 快捷入口组件
function QuickEntries() {
  return (
    <div className="px-4 py-3">
      <div className="grid grid-cols-6 gap-2">
        {QUICK_ENTRIES.map((entry) => (
          <a
            key={entry.id}
            href={entry.href}
            className="flex flex-col items-center gap-1"
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: entry.color + '15' }}
            >
              <span style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }}>{entry.icon}</span>
            </div>
            <span className="text-xs text-gray-700">{entry.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// 商品分类组件
function CategoryGrid() {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-gray-900">商品分类</h3>
        <a href="/mini-store/categories" className="text-sm text-orange-500 flex items-center gap-1">
          查看全部
          <span className="text-xs">›</span>
        </a>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {CATEGORIES.slice(0, 8).map((cat) => (
          <a
            key={cat.id}
            href={`/mini-store/categories/${cat.id}`}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-2xl shadow-sm">
              {cat.icon}
            </div>
            <span className="text-xs text-gray-700 text-center">{cat.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// 限时抢购组件
function FlashSale() {
  return (
    <div className="px-4 py-3">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-3 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <span className="font-bold">限时抢购</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
            <span className="text-xs">距离结束</span>
            <Countdown />
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[
            { id: 1, name: '可口可乐330ml', price: 1.99, original: 3.50, image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=120&h=120&fit=crop' },
            { id: 2, name: '奥利奥夹心饼干', price: 6.99, original: 12.00, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=120&h=120&fit=crop' },
            { id: 3, name: '农夫山泉5L装', price: 7.50, original: 12.00, image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=120&h=120&fit=crop' },
          ].map((item) => (
            <div key={item.id} className="flex-shrink-0 bg-white rounded-lg p-2 text-gray-800">
              <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
              <p className="text-xs font-medium mt-1 truncate w-20">{item.name}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-red-500 font-bold">¥{item.price}</span>
              </div>
              <p className="text-xs text-gray-400 line-through">¥{item.original}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 倒计时组件
function Countdown() {
  const [time, setTime] = useState({ hours: 2, minutes: 45, seconds: 30 });
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
          if (minutes < 0) {
            minutes = 59;
            hours--;
            if (hours < 0) {
              hours = 23;
              minutes = 59;
              seconds = 59;
            }
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');
  
  return (
    <div className="flex gap-0.5 text-xs font-mono">
      <span>{pad(time.hours)}</span>
      <span>:</span>
      <span>{pad(time.minutes)}</span>
      <span>:</span>
      <span>{pad(time.seconds)}</span>
    </div>
  );
}

// 排行榜组件
function RankingSection() {
  const [activeTab, setActiveTab] = useState<'sales' | 'attention'>('sales');
  
  return (
    <div className="px-4 py-3">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <span className="font-bold text-green-700">排行榜</span>
          </div>
          <a href="/mini-store/ranking" className="text-xs text-green-600 flex items-center">
            更多
            <span>›</span>
          </a>
        </div>
        
        {/* Tab切换 */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab('sales')}
            className={cn(
              "px-4 py-1 rounded-full text-sm font-medium transition-all",
              activeTab === 'sales' 
                ? "bg-red-500 text-white" 
                : "bg-white text-gray-600"
            )}
          >
            销量榜
          </button>
          <button
            onClick={() => setActiveTab('attention')}
            className={cn(
              "px-4 py-1 rounded-full text-sm font-medium transition-all",
              activeTab === 'attention' 
                ? "bg-red-500 text-white" 
                : "bg-white text-gray-600"
            )}
          >
            关注榜
          </button>
        </div>
        
        {/* 榜单内容 */}
        <div className="space-y-2">
          {RANKING_DATA[activeTab].map((product, index) => (
            <ProductItem key={product.id} product={product} rank={index + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

// 推荐商品组件
function RecommendedProducts() {
  const [products] = useState([
    { id: 1, name: '蒙牛特仑苏有机纯牛奶250ml*12', price: 58.00, original: 68.00, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&h=200&fit=crop', sales: 856 },
    { id: 2, name: '三只松鼠零食大礼包约1418g', price: 68.00, original: 98.00, image: 'https://images.unsplash.com/photo-1594901852083-c83b4f1ed8c3?w=200&h=200&fit=crop', sales: 1234 },
    { id: 3, name: '金龙鱼黄金比例食用调和油5L', price: 49.90, original: 69.90, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&h=200&fit=crop', sales: 567 },
    { id: 4, name: '立白超浓缩洗衣液3kg套装', price: 39.90, original: 59.90, image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=200&h=200&fit=crop', sales: 432 },
  ]);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-gray-900">为你推荐</h3>
        <span className="text-xs text-gray-400">根据你的浏览记录</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => (
          <a
            key={product.id}
            href={`/mini-store/product/${product.id}`}
            className="bg-white rounded-xl overflow-hidden shadow-sm"
          >
            <div className="relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-32 object-cover"
              />
              <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                精选
              </span>
            </div>
            <div className="p-2">
              <p className="text-sm text-gray-800 line-clamp-2 h-10">{product.name}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-red-500 font-bold">¥{product.price}</span>
                <span className="text-xs text-gray-400 line-through">¥{product.original}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">已售 {product.sales}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// 底部导航栏组件
function TabBar() {
  const [activeTab, setActiveTab] = useState('/mini-home');

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50">
      <div className="flex justify-around py-2">
        {TAB_BAR.map((tab) => (
          <a
            key={tab.id}
            href={tab.href}
            onClick={() => setActiveTab(tab.href)}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-3",
              activeTab === tab.href ? "text-red-500" : "text-gray-500"
            )}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs">{tab.title}</span>
          </a>
        ))}
      </div>
      {/* iPhone安全区域 */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </div>
  );
}

// 主页面组件
export default function MiniStoreHomePage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部状态栏 */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏪</span>
            <span className="font-bold">海邻到家·生活馆</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm bg-white/20 rounded-full px-3 py-1">
              🌤️ 28°C
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="bg-gradient-to-b from-green-600/10 to-transparent pb-4">
        {/* 轮播图 */}
        <div className="px-4 pt-3">
          <Swiper />
        </div>

        {/* 搜索栏 */}
        <SearchBar />

        {/* 功能按钮 */}
        <FunctionButtons />
      </div>

      {/* 快捷入口 */}
      <div className="bg-white mx-4 rounded-xl shadow-sm -mt-2">
        <QuickEntries />
      </div>

      {/* 商品分类 */}
      <div className="bg-white mx-4 mt-3 rounded-xl shadow-sm">
        <CategoryGrid />
      </div>

      {/* 限时抢购 */}
      <div className="mt-3">
        <FlashSale />
      </div>

      {/* 排行榜 */}
      <div className="mt-3">
        <RankingSection />
      </div>

      {/* 推荐商品 */}
      <div className="mt-3">
        <RecommendedProducts />
      </div>

      {/* 底部导航 */}
      <TabBar />
    </div>
  );
}
