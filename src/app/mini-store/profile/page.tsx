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

// 会员信息卡片
function ProfileCard() {
  const style = {
    primaryColor: 'text-orange-500',
    secondaryColor: 'bg-orange-50',
    gradientFrom: 'from-orange-400',
    gradientTo: 'to-amber-400',
    accentBg: 'bg-orange-500',
  };
  
  return (
    <div className={cn("p-5", style.gradientFrom, style.gradientTo)}>
      <div className="bg-white rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-4">
          {/* 头像区域 */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-3xl border-2 border-white shadow-md">
              {MEMBER_INFO.avatar}
            </div>
            {/* 在线状态标识 */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          
          {/* 用户信息 */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-800 font-bold text-lg">{MEMBER_INFO.name}</span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full text-white font-medium", style.accentBg)}>
                {MEMBER_INFO.level}
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-1">{MEMBER_INFO.phone}</p>
            
            {/* 会员权益入口 */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                享专属折扣
              </span>
              <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                积分加倍
              </span>
            </div>
          </div>
          
          {/* 设置入口 */}
          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-xl">⚙️</span>
            </div>
            <span className="text-xs text-gray-500">设置</span>
          </button>
        </div>
        
        {/* 会员资产概览 */}
        <div className="flex justify-around mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{MEMBER_INFO.balance.toFixed(2)}</p>
            <p className="text-xs text-gray-500">余额(元)</p>
          </div>
          <div className="w-px bg-gray-200"></div>
          <div className="text-center">
            <p className="text-lg font-bold text-orange-500">{MEMBER_INFO.points}</p>
            <p className="text-xs text-gray-500">积分</p>
          </div>
          <div className="w-px bg-gray-200"></div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{MEMBER_INFO.coupons}</p>
            <p className="text-xs text-gray-500">优惠券</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 订单统计卡片
function OrderStatsCard() {
  return (
    <div className="bg-white mx-3 -mt-2 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-bold text-gray-800">我的订单</span>
        <span className="text-gray-400 text-xs">全部订单 ›</span>
      </div>
      <div className="flex justify-around mt-4">
        {[
          { icon: '💳', title: '待支付', count: 0 },
          { icon: '📦', title: '待发货', count: 1 },
          { icon: '🚚', title: '待收货', count: 2 },
          { icon: '⭐', title: '待评价', count: 3 },
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <div className="relative">
              <span className="text-2xl">{item.icon}</span>
              {item.count > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{item.count}</span>
              )}
            </div>
            <span className="text-xs text-gray-600">{item.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 功能菜单
function MenuSection() {
  const menuItems = [
    { icon: '🎫', title: '优惠券', sub: `${MEMBER_INFO.coupons}张可用` },
    { icon: '⭐', title: '我的收藏', sub: '收藏的商品' },
    { icon: '📍', title: '收货地址', sub: '管理收货地址' },
    { icon: '🏪', title: '门店收藏', sub: '收藏的门店' },
    { icon: '📝', title: '意见反馈', sub: '您的建议' },
    { icon: 'ℹ️', title: '关于我们', sub: '了解更多' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="bg-white rounded-xl overflow-hidden">
        {menuItems.map((item, idx) => (
          <div key={idx} className={cn("flex items-center gap-3 p-4", idx < menuItems.length - 1 && "border-b border-gray-100")}>
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1">
              <p className="text-sm text-gray-800 font-medium">{item.title}</p>
              <p className="text-xs text-gray-400">{item.sub}</p>
            </div>
            <span className="text-gray-400">›</span>
          </div>
        ))}
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
    { id: 'points', icon: '🎁', title: '积分商城', href: '/mini-store/points' },
    { id: 'profile', icon: '👤', title: '我的', href: '/mini-store/profile', active: true },
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
export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 小程序头部 */}
      <div className="bg-orange-400">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="w-6" />
          <h1 className="text-base font-bold text-white">我的</h1>
          <div className="w-6" />
        </div>
      </div>

      {/* 内容区域 */}
      <ProfileCard />
      <OrderStatsCard />
      <MenuSection />

      {/* 底部导航 */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
