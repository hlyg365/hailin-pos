'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, BarChart3, Settings, Plus } from 'lucide-react';
import DashboardContent from './components/DashboardContent';

export default function AssistantPage() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('home');

  const navItems = [
    { id: 'home', label: '首页', icon: Home, href: '/' },
    { id: 'inventory', label: '库存', icon: Package, href: '/inventory' },
    { id: 'report', label: '报表', icon: BarChart3, href: '/report' },
    { id: 'settings', label: '设置', icon: Settings, href: '/settings' },
  ];

  return (
    <div className="min-h-screen">
      {/* 顶部状态栏 */}
      <header className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">欢迎回来</p>
            <h1 className="text-xl font-bold">张店长的助手</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm">今日销售</p>
              <p className="text-xl font-bold">¥12,580</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-lg">📊</span>
            </div>
          </div>
        </div>
      </header>

      {/* 快捷操作 */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="grid grid-cols-4 gap-4">
            <Link href="/cashier" className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl">
                💰
              </div>
              <span className="text-sm">收银</span>
            </Link>
            <Link href="/inventory/check" className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl">
                📦
              </div>
              <span className="text-sm">盘点</span>
            </Link>
            <Link href="/order" className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
                📝
              </div>
              <span className="text-sm">订货</span>
            </Link>
            <Link href="/promotion" className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl">
                🎁
              </div>
              <span className="text-sm">促销</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="px-4 mt-4">
        <DashboardContent />
      </div>

      {/* 底部导航 */}
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <Link 
            key={item.id}
            href={item.href}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon className="icon" />
            <span className="label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
