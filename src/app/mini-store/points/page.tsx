'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

// 会员信息
const MEMBER_INFO = {
  name: '张小明',
  phone: '138****8888',
  level: '金卡会员',
  avatar: '👤',
  points: 2580,
  coupons: 3,
  orders: 45,
  balance: 168.50,
};

// 积分余额卡片
function PointsBalanceCard({ style }: { style: { primaryColor: string; secondaryColor: string; gradientFrom: string; gradientTo: string; accentBg: string } }) {
  const myPoints = MEMBER_INFO.points;
  
  return (
    <div className={cn("p-4", style.gradientFrom, style.gradientTo)}>
      <div className="bg-white rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs">我的积分</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={cn("text-3xl font-bold", style.primaryColor)}>{myPoints}</span>
              <span className="text-gray-400 text-sm">积分</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button className={cn("px-4 py-1.5 rounded-full text-white text-xs font-medium", style.accentBg)}>
              积分规则
            </button>
            <p className="text-xs text-gray-400">每100积分抵1元</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 积分商品列表
function PointsProductList({ style }: { style: { primaryColor: string; secondaryColor: string; gradientFrom: string; gradientTo: string; accentBg: string } }) {
  const categories = ['全部', '美食兑换', '生活用品', '数码配件', '服饰鞋包'];
  const [activeCategory, setActiveCategory] = useState('全部');
  
  const pointsProducts = [
    { id: 1, name: '农夫山泉550ml', points: 100, image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200&h=200&fit=crop', stock: 520, sold: 1280 },
    { id: 2, name: '可口可乐330ml', points: 150, image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=200&h=200&fit=crop', stock: 320, sold: 890 },
    { id: 3, name: '维达抽纸一提', points: 500, image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=200&h=200&fit=crop', stock: 180, sold: 560 },
    { id: 4, name: '蒙牛纯牛奶一箱', points: 800, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&h=200&fit=crop', stock: 95, sold: 420 },
    { id: 5, name: '三只松鼠坚果一袋', points: 1200, image: 'https://images.unsplash.com/photo-1594901852083-c83b4f1ed8c3?w=200&h=200&fit=crop', stock: 68, sold: 310 },
    { id: 6, name: '充电宝5000mAh', points: 2000, image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=200&h=200&fit=crop', stock: 45, sold: 180 },
    { id: 7, name: '蓝牙耳机一副', points: 3000, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&h=200&fit=crop', stock: 30, sold: 120 },
    { id: 8, name: '品牌保温杯一个', points: 1500, image: 'https://images.unsplash.com/photo-1571939768788-64747a4d6b1b?w=200&h=200&fit=crop', stock: 55, sold: 200 },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 积分Banner */}
      <div className="px-4 py-3 bg-white">
        <div className={cn("rounded-xl p-3 bg-gradient-to-r from-yellow-50 to-orange-50 flex items-center justify-between")}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-sm font-bold text-gray-800">积分兑换专区</p>
              <p className="text-xs text-gray-500">更多好物等你来兑</p>
            </div>
          </div>
          <span className={cn("text-xs px-2 py-1 rounded-full", style.primaryColor, style.secondaryColor)}>
            热门
          </span>
        </div>
      </div>

      {/* 分类标签 */}
      <div className="bg-white px-4 py-2 border-b">
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all",
                activeCategory === cat
                  ? `${style.accentBg} text-white`
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 商品列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {pointsProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="aspect-square bg-gray-100 relative">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  售{product.sold}
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm text-gray-800 font-medium truncate">{product.name}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className={cn("text-sm font-bold", style.primaryColor)}>{product.points}</span>
                  <span className="text-xs text-gray-400">积分</span>
                </div>
                <button className={cn("w-full mt-2 py-1.5 rounded-lg text-white text-xs font-medium", style.accentBg)}>
                  立即兑换
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部说明 */}
      <div className="bg-white p-3 border-t">
        <p className="text-xs text-gray-400 text-center">
          兑换商品请到门店自提或联系客服配送
        </p>
      </div>
    </div>
  );
}

// 底部导航栏
function TabBar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const tabs = [
    { id: 'home', icon: '🏠', title: '首页', href: '/mini-store/home' },
    { id: 'categories', icon: '📋', title: '全部分类', href: '/mini-store/categories' },
    { id: 'cart', icon: '🛒', title: '购物车', href: '/mini-store/cart' },
    { id: 'points', icon: '🎁', title: '积分商城', href: '/mini-store/points', active: true },
    { id: 'profile', icon: '👤', title: '我的', href: '/mini-store/profile' },
  ];

  return (
    <div className="bg-white border-t border-gray-200">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={tab.href}
            onClick={(e) => {
              e.preventDefault();
              onTabChange(tab.id);
            }}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-3",
              tab.active ? "text-orange-500" : "text-gray-500"
            )}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs">{tab.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// 主页面
export default function PointsMallPage() {
  const [activeTab, setActiveTab] = useState('points');
  
  const style = {
    primaryColor: 'text-orange-500',
    secondaryColor: 'bg-orange-50',
    gradientFrom: 'from-orange-400',
    gradientTo: 'to-amber-400',
    accentBg: 'bg-orange-500',
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 小程序头部 */}
      <div className={cn("bg-gradient-to-r", style.gradientFrom, style.gradientTo)}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="w-6" />
          <h1 className="text-base font-bold text-white">积分商城</h1>
          <div className="w-6" />
        </div>
      </div>

      {/* 内容区域 */}
      <PointsBalanceCard style={style} />
      <div className="flex-1">
        <PointsProductList style={style} />
      </div>

      {/* 底部导航 */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
