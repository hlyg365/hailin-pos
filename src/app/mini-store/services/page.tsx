'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const SERVICES = [
  { id: 'express', name: '快递代收', icon: '📦', color: '#4CAF50', desc: '代收暂存快递', available: true },
  { id: 'recharge', name: '手机充值', icon: '📱', color: '#2196F3', desc: '话费流量充值', available: true },
  { id: 'utility', name: '水电缴费', icon: '💡', color: '#FF9800', desc: '水电燃气缴费', available: true },
  { id: 'laundry', name: '洗衣服务', icon: '👕', color: '#9C27B0', desc: '代办洗衣服务', available: true },
  { id: 'repair', name: '家电维修', icon: '🔧', color: '#795548', desc: '小家电维修', available: false },
  { id: 'print', name: '打印复印', icon: '🖨️', color: '#607D8B', desc: '文件打印复印', available: true },
  { id: 'parcel', name: '快递寄件', icon: '📮', color: '#E91E63', desc: '代寄快递服务', available: true },
  { id: 'more', name: '更多服务', icon: '➕', color: '#9E9E9E', desc: '敬请期待', available: false },
];

function ServiceCard({ service }: { service: typeof SERVICES[0] }) {
  return (
    <div className={cn("bg-white rounded-xl p-4 text-center", service.available ? "cursor-pointer active:scale-95" : "opacity-50")}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${service.color}15` }}>
        <span className="text-3xl">{service.icon}</span>
      </div>
      <p className="font-medium text-gray-800 text-sm">{service.name}</p>
      <p className="text-xs text-gray-400 mt-0.5">{service.desc}</p>
      {!service.available && <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-full">即将上线</span>}
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
            <span className="text-xl relative">{tab.icon}{tab.badge && <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{tab.badge}</span>}</span>
            <span className="text-[10px]">{tab.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState('home');
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-gradient-to-br from-orange-400 to-amber-400 px-4 py-3">
        <div className="flex items-center justify-between">
          <a href="/mini-store/home" className="text-white text-xl">‹</a>
          <h1 className="text-base font-bold text-white">便民服务</h1>
          <div className="w-6" />
        </div>
      </div>
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏪</span>
          <div>
            <p className="font-bold text-gray-800">海邻到家·便民服务站</p>
            <p className="text-xs text-gray-500 mt-0.5">服务周边社区便捷生活</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-4 gap-3">{SERVICES.map((service) => (<ServiceCard key={service.id} service={service} />))}</div>
      </div>
      <div className="px-4">
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><span>📋</span>服务须知</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• <strong>快递代收</strong>：24小时内免费存放</p>
            <p>• <strong>手机充值</strong>：支持三网，话费实时到账</p>
            <p>• <strong>水电缴费</strong>：绑定户号即时生效</p>
          </div>
        </div>
      </div>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
