'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// 轮播图/店铺头图数据
const STORE_BANNERS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=750&h=400&fit=crop',
    title: '多多生活馆',
    subtitle: '社区便利 就近选择',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=750&h=400&fit=crop',
    title: '新鲜水果',
    subtitle: '时令水果 每日配送',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=750&h=400&fit=crop',
    title: '优惠活动',
    subtitle: '限时特惠 满50减10',
  },
];

// 功能按钮数据
const SERVICE_CARDS = [
  {
    id: 1,
    title: '同城配送',
    subtitle: '省心到家',
    gradient: 'from-cyan-500 to-teal-400',
    icon: '🚴',
    description: '戴着头盔的骑手骑着电动车',
    href: '/mini-store/delivery',
  },
  {
    id: 2,
    title: '到店自提',
    subtitle: '方便快捷',
    gradient: 'from-cyan-400 to-blue-400',
    icon: '📱',
    description: '手持手机展示取货码',
    href: '/mini-store/pickup',
  },
];

// 快捷服务入口
const QUICK_SERVICES = [
  { id: 1, icon: '充', iconBg: 'bg-purple-500', title: '在线充值', color: 'text-orange-500', href: '/mini-store/recharge' },
  { id: 2, icon: '✓', iconBg: 'bg-orange-500', title: '会员中心', color: 'text-orange-500', href: '/mini-store/member' },
  { id: 3, icon: '礼', iconBg: 'bg-red-500', title: '邀请有奖', color: 'text-orange-500', href: '/mini-store/invite' },
];

// 商品分类
const CATEGORIES = [
  { id: 1, icon: '🗂️', name: '生活日用', desc: '收纳清洁' },
  { id: 2, icon: '🍳', name: '家居厨具', desc: '锅碗瓢盆' },
  { id: 3, icon: '🍲', name: '熟食速食', desc: '即食美味' },
  { id: 4, icon: '🥤', name: '夏日饮品', desc: '清凉一夏' },
  { id: 5, icon: '🔧', name: '五金文具', desc: '工具用品' },
  { id: 6, icon: '🧴', name: '个人护理', desc: '护肤洗护' },
];

// 排行榜数据
const RANKING_DATA = {
  sales: [
    { id: 1, name: '农夫山泉550ml', price: 2.00, sales: 1568, image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=100&h=100&fit=crop' },
    { id: 2, name: '康师傅红烧牛肉面', price: 4.50, sales: 1234, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=100&h=100&fit=crop' },
    { id: 3, name: '维达抽纸超韧系列', price: 12.80, sales: 986, image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=100&h=100&fit=crop' },
    { id: 4, name: '可口可乐330ml', price: 2.50, sales: 876, image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=100&h=100&fit=crop' },
  ],
  attention: [
    { id: 1, name: '元气森林气泡水', price: 5.00, attention: 2568, image: 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=100&h=100&fit=crop' },
    { id: 2, name: '三只松鼠坚果礼盒', price: 68.00, attention: 1890, image: 'https://images.unsplash.com/photo-1594901852083-c83b4f1ed8c3?w=100&h=100&fit=crop' },
    { id: 3, name: '蒙牛纯牛奶24盒装', price: 45.90, attention: 1456, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100&h=100&fit=crop' },
    { id: 4, name: '奥利奥夹心饼干', price: 8.90, attention: 1234, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=100&h=100&fit=crop' },
  ],
};

// 底部导航数据
const TAB_BAR = [
  { id: 1, icon: '🏠', title: '首页', active: true, href: '/mini-store/home' },
  { id: 2, icon: '📋', title: '全部分类', active: false, href: '/mini-store/categories' },
  { id: 3, icon: '🛒', title: '购物车', active: false, badge: 0, href: '/mini-store/cart' },
  { id: 4, icon: '👤', title: '我的', active: false, href: '/mini-store/profile' },
];

// 店铺头图轮播组件
function StoreBannerSwiper() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % STORE_BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-44 overflow-hidden">
      <div 
        className="flex transition-transform duration-500 h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {STORE_BANNERS.map((banner) => (
          <div key={banner.id} className="relative flex-shrink-0 w-full h-full">
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
            {/* 渐变遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            {/* 店铺名称 */}
            <div className="absolute bottom-4 left-4">
              <h2 className="text-white font-bold text-lg">{banner.title}</h2>
              <p className="text-white/80 text-xs">{banner.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
      {/* 轮播指示器 */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {STORE_BANNERS.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              current === index ? "bg-white" : "bg-white/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// 搜索栏组件
function SearchBar() {
  return (
    <div className="px-4 py-3 bg-white">
      <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
        <span className="text-gray-400">🔍</span>
        <input
          type="text"
          placeholder="搜索"
          className="flex-1 bg-transparent outline-none text-sm text-gray-700"
        />
        <button className="text-gray-400 text-sm">搜索</button>
      </div>
    </div>
  );
}

// 服务卡片组件
function ServiceCards() {
  return (
    <div className="px-4 py-3 bg-white">
      <div className="flex gap-3">
        {SERVICE_CARDS.map((card) => (
          <a
            key={card.id}
            href={card.href}
            className={cn(
              "flex-1 relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br",
              card.gradient
            )}
          >
            <div className="relative z-10">
              <h3 className="text-white font-bold text-base">{card.title}</h3>
              <p className="text-white/80 text-xs mt-0.5">{card.subtitle}</p>
            </div>
            {/* 装饰图标 */}
            <div className="absolute right-2 bottom-2 text-5xl opacity-30">
              {card.id === 1 ? '🛵' : '📦'}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// 快捷服务入口
function QuickServices() {
  return (
    <div className="px-4 py-3 bg-white">
      <div className="flex justify-around">
        {QUICK_SERVICES.map((service) => (
          <a
            key={service.id}
            href={service.href}
            className="flex flex-col items-center gap-1.5"
          >
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold", service.iconBg)}>
              {service.icon}
            </div>
            <span className={cn("text-xs font-medium", service.color)}>{service.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// 商品分类网格
function CategoryGrid() {
  return (
    <div className="px-4 py-3 bg-white">
      <div className="grid grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => (
          <a
            key={cat.id}
            href={`/mini-store/category/${cat.id}`}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center text-2xl">
              {cat.icon}
            </div>
            <span className="text-xs text-gray-700 font-medium">{cat.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// 排行榜商品项
function RankingItem({ product, rank }: { product: any; rank: number }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <span className={cn(
        "w-5 h-5 rounded flex items-center justify-center text-xs font-bold",
        rank <= 3 ? "bg-red-500 text-white" : "bg-gray-200 text-gray-500"
      )}>
        {rank}
      </span>
      <img
        src={product.image}
        alt={product.name}
        className="w-10 h-10 rounded-lg object-cover bg-gray-100"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 truncate">{product.name}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-red-500 font-medium text-sm">¥{product.price.toFixed(2)}</span>
          {product.sales && <span className="text-xs text-gray-400">已售{product.sales}</span>}
          {product.attention && <span className="text-xs text-gray-400">关注{product.attention}</span>}
        </div>
      </div>
    </div>
  );
}

// 排行榜组件
function RankingSection() {
  const [activeTab, setActiveTab] = useState<'sales' | 'attention'>('sales');

  return (
    <div className="px-4 py-3">
      <div className="bg-gradient-to-r from-green-500 to-emerald-400 rounded-t-xl p-3">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-base">排行榜</span>
          <a href="/mini-store/ranking" className="text-white/80 text-xs flex items-center gap-0.5">
            更多 <span>›</span>
          </a>
        </div>
      </div>
      <div className="bg-white rounded-b-xl px-3 pb-3">
        {/* Tab切换 */}
        <div className="flex gap-2 py-3">
          <button
            onClick={() => setActiveTab('sales')}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              activeTab === 'sales' 
                ? "bg-white text-gray-800 shadow-sm border border-gray-200" 
                : "bg-gray-100 text-gray-500"
            )}
          >
            {activeTab === 'sales' && <span className="text-red-500">🔥</span>}
            销量榜
          </button>
          <button
            onClick={() => setActiveTab('attention')}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              activeTab === 'attention' 
                ? "bg-white text-gray-800 shadow-sm border border-gray-200" 
                : "bg-gray-100 text-gray-500"
            )}
          >
            {activeTab === 'attention' && <span className="text-red-500">🔥</span>}
            关注榜
          </button>
        </div>
        {/* 榜单内容 */}
        <div className="space-y-1">
          {RANKING_DATA[activeTab].slice(0, 4).map((product, index) => (
            <RankingItem key={product.id} product={product} rank={index + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

// 底部导航栏
function TabBar() {
  const [activeTab, setActiveTab] = useState('/mini-store/home');
  const [cartCount] = useState(0);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around py-2">
        {TAB_BAR.map((tab) => (
          <a
            key={tab.id}
            href={tab.href}
            onClick={() => setActiveTab(tab.href)}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-4",
              activeTab === tab.href ? "text-red-500" : "text-gray-500"
            )}
          >
            <div className="relative">
              <span className="text-xl">{tab.icon}</span>
              {tab.id === 3 && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-xs">{tab.title}</span>
          </a>
        ))}
      </div>
      {/* iPhone安全区域 */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </div>
  );
}

// 微信小程序头部
function MiniAppHeader() {
  return (
    <div className="bg-white sticky top-0 z-40">
      {/* 微信小程序顶部栏 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-4">
          {/* 更多按钮 */}
          <button className="w-6 h-6 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </div>
        <h1 className="text-base font-bold text-gray-900 absolute left-1/2 -translate-x-1/2">首页</h1>
        <div className="flex items-center gap-3">
          {/* 客服/反馈按钮 */}
          <button className="w-6 h-6 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// 主页面组件
export default function MiniStoreHomePage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 小程序头部 */}
      <MiniAppHeader />

      {/* 店铺头图轮播 */}
      <StoreBannerSwiper />

      {/* 搜索栏 */}
      <SearchBar />

      {/* 服务卡片 */}
      <ServiceCards />

      {/* 分隔线 */}
      <div className="h-2 bg-gray-100" />

      {/* 快捷服务 */}
      <QuickServices />

      {/* 分隔线 */}
      <div className="h-2 bg-gray-100" />

      {/* 商品分类 */}
      <CategoryGrid />

      {/* 分隔线 */}
      <div className="h-2 bg-gray-100" />

      {/* 排行榜 */}
      <RankingSection />

      {/* 底部导航 */}
      <TabBar />
    </div>
  );
}
