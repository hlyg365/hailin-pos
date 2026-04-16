'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

// 门店信息
const STORE_INFO = {
  name: '海邻到家·星火路店',
  distance: '350m',
  address: '星火路128号',
  openTime: '07:00-23:00',
};

// 商品分类
const CATEGORIES = [
  { id: 'fruit', name: '鲜果蔬菜', icon: '🍎', bgColor: 'bg-green-50' },
  { id: 'drinks', name: '烟酒饮料', icon: '🍺', bgColor: 'bg-orange-50' },
  { id: 'snacks', name: '零食冰品', icon: '🍿', bgColor: 'bg-yellow-50' },
  { id: 'daily', name: '日用百货', icon: '🧴', bgColor: 'bg-emerald-50' },
];

// 便民服务
const SERVICES = [
  { id: 'express', name: '快递', icon: '📦', color: '#4CAF50' },
  { id: 'recharge', name: '充值', icon: '📱', color: '#2196F3' },
  { id: 'utility', name: '缴费', icon: '💡', color: '#FF9800' },
  { id: 'laundry', name: '洗衣', icon: '👕', color: '#9C27B0' },
];

// 秒杀商品
const FLASH_SALE_PRODUCTS = [
  { id: 1, name: '可乐500ml', price: 2.5, originalPrice: 3.5, sales: 67, category: '烟酒饮料' },
  { id: 2, name: '康师傅红烧牛肉面', price: 3.9, originalPrice: 4.5, sales: 82, category: '零食冰品' },
  { id: 3, name: '农夫山泉550ml', price: 1.5, originalPrice: 2.0, sales: 45, category: '烟酒饮料' },
  { id: 4, name: '苹果500g', price: 5.9, originalPrice: 6.8, sales: 56, category: '鲜果蔬菜' },
];

// 热门推荐商品
const RECOMMEND_PRODUCTS = [
  { id: 1, name: '可乐500ml', price: 3.5, sales: 1280, category: '烟酒饮料' },
  { id: 2, name: '薯片大包装', price: 9.9, sales: 856, category: '零食冰品' },
  { id: 3, name: '康师傅方便面', price: 4.5, sales: 2100, category: '零食冰品' },
  { id: 4, name: '农夫山泉550ml', price: 2.0, sales: 3200, category: '烟酒饮料' },
  { id: 5, name: '苹果500g', price: 6.8, sales: 680, category: '鲜果蔬菜' },
  { id: 6, name: '维达抽纸10包', price: 29.9, sales: 450, category: '日用百货' },
];

// 轮播图
const BANNERS = [
  { id: 1, image: '/images/hailin-store.jpg', title: '海邻到家便利店' },
  { id: 2, image: '/images/hailin-store.jpg', title: '新鲜水果' },
];

function StoreHeader({ deliveryMode, onDeliveryChange }: { deliveryMode: string; onDeliveryChange: (mode: string) => void }) {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-orange-500 text-lg">📍</span>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-gray-800 text-sm">{STORE_INFO.name}</span>
              <span className="text-orange-500 text-xs">▼</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span>{STORE_INFO.distance}</span>
              <span className="text-gray-300">|</span>
              <span>{STORE_INFO.address}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onDeliveryChange('delivery')}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1",
              deliveryMode === 'delivery' ? "bg-orange-500 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200")}>
            <span>🚴</span><span>配送</span>
          </button>
          <button onClick={() => onDeliveryChange('pickup')}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1",
              deliveryMode === 'pickup' ? "bg-orange-500 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200")}>
            <span>🏪</span><span>自提</span>
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-1.5 pl-6">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span className="text-xs text-green-600 font-medium">营业中</span>
        <span className="text-xs text-gray-400">{STORE_INFO.openTime}</span>
      </div>
    </div>
  );
}

function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  return (
    <div className="relative h-44 overflow-hidden">
      <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${current * 100}%)` }}>
        {BANNERS.map((banner) => (
          <div key={banner.id} className="w-full flex-shrink-0">
            <img src={banner.image} alt={banner.title} className="w-full h-44 object-cover" />
          </div>
        ))}
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {BANNERS.map((_, idx) => (
          <span key={idx} className={cn("w-2 h-2 rounded-full transition-all", idx === current ? "bg-white w-4" : "bg-white/50")} />
        ))}
      </div>
    </div>
  );
}

function SearchBar() {
  return (
    <div className="px-4 py-3 bg-white">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2.5">
          <span className="text-gray-400">🔍</span>
          <input type="text" placeholder="搜索商品" className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400" />
        </div>
        <button className="px-4 py-2.5 bg-orange-500 text-white rounded-full text-sm font-medium">搜索</button>
      </div>
    </div>
  );
}

function CategoryNav() {
  return (
    <div className="px-4 py-4 bg-white">
      <div className="grid grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => (
          <button key={cat.id} className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-transform active:scale-95">
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", cat.bgColor)}>
              <span className="text-2xl">{cat.icon}</span>
            </div>
            <span className="text-xs text-gray-700 font-medium">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ServiceEntry() {
  return (
    <div className="px-4 pb-4 bg-white">
      <a href="/mini-store/services" className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📦</span>
          <div>
            <span className="font-bold text-gray-800">便民服务</span>
            <p className="text-xs text-gray-500 mt-0.5">快递·充值·缴费·洗衣</p>
          </div>
        </div>
        <span className="text-orange-500 text-lg">›</span>
      </a>
      <div className="flex justify-around mt-3">
        {SERVICES.map((service) => (
          <button key={service.id} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${service.color}15` }}>
              <span className="text-xl">{service.icon}</span>
            </div>
            <span className="text-xs text-gray-600">{service.name}</span>
          </button>
        ))}
        <button className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100"><span className="text-xl">➕</span></div>
          <span className="text-xs text-gray-600">更多</span>
        </button>
      </div>
    </div>
  );
}

function FlashSale() {
  const [timeLeft] = useState({ hours: 2, minutes: 30, seconds: 45 });
  return (
    <div className="px-4 pb-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><span className="text-xl">🔥</span><span className="font-bold text-gray-800">限时秒杀</span></div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <span className="bg-red-500 text-white px-1.5 py-0.5 rounded font-mono">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-gray-400">:</span>
            <span className="bg-red-500 text-white px-1.5 py-0.5 rounded font-mono">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-gray-400">:</span>
            <span className="bg-red-500 text-white px-1.5 py-0.5 rounded font-mono">{String(timeLeft.seconds).padStart(2, '0')}</span>
          </div>
          <span className="text-gray-400 text-xs">更多 ›</span>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
        {FLASH_SALE_PRODUCTS.map((product) => (
          <div key={product.id} className="flex-shrink-0 w-28">
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <div className="h-28 bg-gray-100 flex items-center justify-center">
                <span className="text-4xl">{product.category === '鲜果蔬菜' ? '🍎' : product.category === '零食冰品' ? '🍿' : '🥤'}</span>
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-700 truncate font-medium">{product.name}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-red-500 font-bold text-sm">¥{product.price.toFixed(1)}</span>
                  <span className="text-xs text-gray-400 line-through">¥{product.originalPrice.toFixed(1)}</span>
                </div>
                <div className="mt-1.5">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full" style={{ width: `${product.sales}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">已抢{product.sales}%</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HotRecommend() {
  return (
    <div className="px-4 pb-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><span className="text-xl">⭐</span><span className="font-bold text-gray-800">热门推荐</span></div>
        <span className="text-gray-400 text-xs">更多 ›</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {RECOMMEND_PRODUCTS.map((product) => (
          <div key={product.id} className="bg-gray-50 rounded-xl overflow-hidden">
            <div className="h-32 bg-gray-100 flex items-center justify-center">
              <span className="text-5xl">{product.category === '鲜果蔬菜' ? '🍎' : product.category === '零食冰品' ? '🍿' : '🥤'}</span>
            </div>
            <div className="p-2.5">
              <p className="text-sm text-gray-800 font-medium line-clamp-2 leading-tight">{product.name}</p>
              <div className="flex items-baseline gap-1 mt-1.5"><span className="text-orange-500 font-bold">¥{product.price.toFixed(1)}</span></div>
              <p className="text-xs text-gray-400 mt-1">月销{product.sales}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabBar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const tabs = [
    { id: 'home', icon: '🏠', title: '首页', href: '/mini-store/home' },
    { id: 'categories', icon: '📋', title: '分类', href: '/mini-store/categories' },
    { id: 'cart', icon: '🛒', title: '购物车', href: '/mini-store/cart', badge: 3 },
    { id: 'points', icon: '🎁', title: '积分', href: '/mini-store/points' },
    { id: 'profile', icon: '👤', title: '我的', href: '/mini-store/profile' },
  ];
  return (
    <div className="bg-white border-t border-gray-200">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => (
          <a key={tab.id} href={tab.href} onClick={(e) => { e.preventDefault(); onTabChange(tab.id); }}
            className={cn("flex flex-col items-center gap-0.5 py-1 px-3 relative", tab.id === activeTab ? "text-orange-500" : "text-gray-500")}>
            <span className="text-xl relative">
              {tab.icon}
              {tab.badge && <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{tab.badge}</span>}
            </span>
            <span className="text-[10px]">{tab.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('home');
  const [deliveryMode, setDeliveryMode] = useState('delivery');
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <StoreHeader deliveryMode={deliveryMode} onDeliveryChange={setDeliveryMode} />
      <BannerCarousel />
      <SearchBar />
      <CategoryNav />
      <ServiceEntry />
      <FlashSale />
      <HotRecommend />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
