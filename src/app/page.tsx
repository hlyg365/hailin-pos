'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Smartphone, 
  Monitor, 
  Building2,
  Package,
  Users,
  BarChart3,
  Wifi,
  Clock
} from 'lucide-react';

/**
 * 根页面 - 综合管理首页
 * 
 * 访问策略：
 * - 原生APP（Capacitor/Android WebView）→ 收银台 /pos
 * - 浏览器访问 → 显示综合首页
 * 
 * 说明：
 * - 收银台APP已安装到收银机上，直接打开APP进入收银台
 * - 管理员在电脑浏览器访问此页面选择功能入口
 */

// 快速入口配置
const quickEntries = [
  {
    id: 'pos',
    title: '收银台',
    subtitle: '快速收银结账',
    icon: ShoppingCart,
    href: '/pos',
    color: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600',
  },
  {
    id: 'assistant',
    title: '店长助手',
    subtitle: '移动端管理',
    icon: Smartphone,
    href: '/assistant',
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
  },
  {
    id: 'store-admin',
    title: '管理后台',
    subtitle: '电脑端管理',
    icon: Monitor,
    href: '/store-admin',
    color: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
  },
  {
    id: 'dashboard',
    title: '总部系统',
    subtitle: '多门店管理',
    icon: Building2,
    href: '/dashboard',
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
  },
];

// 功能模块配置
const modules = [
  {
    id: 'products',
    title: '商品管理',
    subtitle: '商品上架、编辑、价格调整',
    icon: Package,
    href: '/dashboard/products',
  },
  {
    id: 'members',
    title: '会员管理',
    subtitle: '会员注册、积分、等级',
    icon: Users,
    href: '/dashboard/members',
  },
  {
    id: 'reports',
    title: '数据报表',
    subtitle: '销售统计、经营分析',
    icon: BarChart3,
    href: '/dashboard/reports/analysis',
  },
];

function CurrentTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="text-sm">
      {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

function HomePageContent() {
  const [platform, setPlatform] = useState<'app' | 'browser'>('browser');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 检测平台类型
    const detectPlatform = () => {
      if (typeof window === 'undefined') {
        return 'browser';
      }

      const capacitor = (window as any).Capacitor;

      // 1. Capacitor 原生平台
      if (capacitor && capacitor.isNativePlatform && capacitor.isNativePlatform()) {
        return 'app';
      }

      // 2. Android WebView
      const ua = navigator.userAgent || '';
      if (ua.includes('Android') && (ua.includes('wv') || ua.includes('WebView'))) {
        return 'app';
      }

      // 3. URL 参数强制APP模式
      const params = new URLSearchParams(window.location.search);
      if (params.get('app') === 'true') {
        return 'app';
      }

      return 'browser';
    };

    const result = detectPlatform();
    setPlatform(result);
    setIsChecking(false);
  }, []);

  // 原生APP直接跳转到收银台
  if (platform === 'app') {
    // 使用 window.location 强制跳转，避免 Next.js 路由
    if (typeof window !== 'undefined') {
      window.location.href = '/pos';
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold mb-2">海邻到家</h1>
          <p className="text-orange-100">正在启动收银台...</p>
        </div>
      </div>
    );
  }

  // 浏览器显示综合首页
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* 顶部标题栏 */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🏪</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">海邻到家</h1>
                <p className="text-sm text-slate-500">社区便利店智能管理系统</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <CurrentTime />
              </div>
              <div className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1 rounded-full">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">在线</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 快速入口 */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">快速入口</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickEntries.map((entry) => (
              <Link
                key={entry.id}
                href={entry.href}
                className={`${entry.color} ${entry.hoverColor} rounded-2xl p-6 text-white transition-all duration-200 hover:scale-105 hover:shadow-xl group`}
              >
                <entry.icon className="w-10 h-10 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold mb-1">{entry.title}</h3>
                <p className="text-sm opacity-80">{entry.subtitle}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* 功能模块 */}
        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">功能模块</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modules.map((module) => (
              <Link
                key={module.id}
                href={module.href}
                className="bg-white rounded-xl p-5 border border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                    <module.icon className="w-6 h-6 text-slate-600 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 mb-1">{module.title}</h3>
                    <p className="text-sm text-slate-500">{module.subtitle}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 底部信息 */}
        <footer className="mt-12 text-center text-sm text-slate-400">
          <p>海邻到家 · 社区便利店智能管理系统 V3.0</p>
          <p className="mt-1">让零售更简单</p>
        </footer>
      </main>
    </div>
  );
}

export default function HomePage() {
  return <HomePageContent />;
}
