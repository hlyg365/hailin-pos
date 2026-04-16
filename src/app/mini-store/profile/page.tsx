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
  return (
    <div className="relative overflow-hidden px-4 pt-4 pb-12 bg-gradient-to-br from-orange-400 to-amber-400">
      {/* 装饰圆形 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute top-8 right-8 w-16 h-16 bg-white/10 rounded-full"></div>
      <div className="absolute bottom-4 left-4 w-20 h-20 bg-white/5 rounded-full"></div>
      
      {/* 会员等级标识 */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="px-3 py-1 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full text-xs font-medium text-yellow-900 shadow-sm flex items-center gap-1">
          <span className="text-sm">👑</span>
          <span>金卡会员</span>
        </div>
      </div>

      {/* 浮动用户卡片 */}
      <div className="relative z-10 bg-white rounded-2xl p-4 shadow-xl -mt-2">
        <div className="flex items-center gap-4">
          {/* 头像区域 */}
          <div className="relative">
            <div className="w-18 h-18 rounded-full bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center border-4 border-white shadow-lg">
              <span className="text-4xl">{MEMBER_INFO.avatar}</span>
            </div>
            {/* VIP标识 */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-white text-xs font-bold">V</span>
            </div>
          </div>
          
          {/* 用户信息 */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-800 font-bold text-lg">{MEMBER_INFO.name}</span>
            </div>
            <p className="text-gray-500 text-xs mt-0.5">{MEMBER_INFO.phone}</p>
          </div>
          
          {/* 设置入口 */}
          <button className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
            <span className="text-xl">⚙️</span>
          </button>
        </div>
        
        {/* 会员资产数据可视化 */}
        <div className="flex justify-around mt-4 pt-4 border-t border-gray-100">
          <div className="text-center flex-1">
            <div className="w-10 h-10 mx-auto mb-1 bg-blue-50 rounded-xl flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <p className="text-lg font-bold text-gray-800">¥{MEMBER_INFO.balance.toFixed(2)}</p>
            <p className="text-xs text-gray-400">余额</p>
          </div>
          <div className="w-px bg-gray-100"></div>
          <div className="text-center flex-1">
            <div className="w-10 h-10 mx-auto mb-1 bg-orange-50 rounded-xl flex items-center justify-center">
              <span className="text-xl">🎫</span>
            </div>
            <p className="text-lg font-bold text-orange-500">{MEMBER_INFO.points}</p>
            <p className="text-xs text-gray-400">积分</p>
          </div>
          <div className="w-px bg-gray-100"></div>
          <div className="text-center flex-1">
            <div className="w-10 h-10 mx-auto mb-1 bg-red-50 rounded-xl flex items-center justify-center">
              <span className="text-xl">🎟️</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{MEMBER_INFO.coupons}</p>
            <p className="text-xs text-gray-400">优惠券</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 订单统计卡片
function OrderStatsCard() {
  return (
    <div className="px-4 -mt-6 relative z-20">
      <div className="bg-white rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📦</span>
            <span className="font-bold text-gray-800">我的订单</span>
          </div>
          <span className="text-gray-400 text-xs flex items-center gap-1">
            查看全部 <span>›</span>
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: '💳', title: '待支付', count: 0, bg: 'bg-blue-50', color: 'text-blue-500' },
            { icon: '📦', title: '待发货', count: 1, bg: 'bg-orange-50', color: 'text-orange-500' },
            { icon: '🚚', title: '待收货', count: 2, bg: 'bg-green-50', color: 'text-green-500' },
            { icon: '⭐', title: '待评价', count: 3, bg: 'bg-purple-50', color: 'text-purple-500' },
          ].map((item, idx) => (
            <button key={idx} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 transition-colors">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center relative", item.bg)}>
                <span className="text-2xl">{item.icon}</span>
                {item.count > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {item.count}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-600">{item.title}</span>
            </button>
          ))}
        </div>
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
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {menuItems.map((item, idx) => (
          <div key={idx} className={cn("flex items-center gap-4 p-4", idx < menuItems.length - 1 && "border-b border-gray-50")}>
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
              <span className="text-lg">{item.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-800 font-medium">{item.title}</p>
              <p className="text-xs text-gray-400">{item.sub}</p>
            </div>
            <span className="text-gray-300">›</span>
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
    <div className="min-h-screen bg-gray-100 pb-16">
      {/* 小程序头部 */}
      <div className="bg-gradient-to-br from-orange-400 to-amber-400">
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

      {/* 联系客服 */}
      <div className="px-4 pb-4">
        <button className="w-full py-3 bg-white rounded-xl text-gray-600 text-sm flex items-center justify-center gap-2 shadow-sm">
          <span>📞</span>
          <span>联系客服</span>
        </button>
      </div>

      {/* 底部导航 */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
