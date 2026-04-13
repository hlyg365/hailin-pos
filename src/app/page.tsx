'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  Smartphone, 
  Monitor, 
  Building2,
  Package,
  Users,
  BarChart3,
  Wifi,
  Clock,
  Zap,
  Shield,
  Cloud,
  WifiOff,
  Settings,
  Headphones,
  Download
} from 'lucide-react';

/**
 * 根页面 - 综合管理首页
 * 
 * 访问策略：
 * - 浏览器访问 → 显示综合首页
 * - APP环境访问 → 自动跳转到收银台
 */

/**
 * 检测是否在APP环境中运行
 * 支持：Capacitor原生APP、扣子平台WebView、Android WebView
 */
function detectAppPlatform(): boolean {
  if (typeof window === 'undefined') return false;
  
  // 1. 检测 Capacitor
  const capacitor = (window as any).Capacitor;
  if (capacitor?.isNativePlatform?.()) {
    return true;
  }
  
  // 2. 增强 Android WebView 检测（包含扣子平台）
  const ua = navigator.userAgent || '';
  if (ua.includes('Android')) {
    if (ua.includes('coze') || ua.includes('webview') || ua.includes('wv')) {
      return true;
    }
  }
  
  // 3. 检测 Capacitor 环境变量
  if ((window as any).__CAPACITOR__ || (window as any).capacitor) {
    return true;
  }
  
  // 4. 检测文件协议（Capacitor APP本地加载）
  if (window.location.protocol === 'file:') {
    return true;
  }
  
  return false;
}

// APK配置 - 每次更新APP后手动递增版本号
const APK_CONFIG = {
  fileName: 'hailin-pos-v3.0.6.apk',  // ← 更新APK时修改文件名（递增版本号）
  version: '3.0.6',                    // ← 更新APK时同步修改版本号（递增）
  buildDate: '2026-04-13',             // ← 构建日期
};

const quickEntries = [
  {
    id: 'pos-app',
    title: '收银台APP',
    subtitle: `下载 v${APK_CONFIG.version}`,
    icon: Download,
    href: `/${APK_CONFIG.fileName}?v=${Date.now()}`,
    color: 'bg-gradient-to-br from-orange-500 to-orange-600',
    hoverColor: 'hover:from-orange-600 hover:to-orange-700',
    isExternal: true,
    badge: APK_CONFIG.buildDate,
  },
  {
    id: 'pos',
    title: '收银台',
    subtitle: '快速收银结账',
    icon: ShoppingCart,
    href: '/pos',
    color: 'bg-orange-400',
    hoverColor: 'hover:bg-orange-500',
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

const features = [
  {
    icon: Zap,
    title: '闪电收银',
    desc: '扫码即结，3秒完成交易',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    icon: WifiOff,
    title: '离线运行',
    desc: '断网不断电，收银不中断',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    icon: Cloud,
    title: '云端同步',
    desc: '数据实时备份，永不丢失',
    color: 'text-green-500',
    bg: 'bg-green-50',
  },
  {
    icon: Shield,
    title: '安全可靠',
    desc: '金融级加密，守护每一笔交易',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    icon: Settings,
    title: '灵活配置',
    desc: '商品、促销、会员一键管理',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50',
  },
  {
    icon: Headphones,
    title: '7x24服务',
    desc: '专属客服，随时响应',
    color: 'text-pink-500',
    bg: 'bg-pink-50',
  },
];

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

export default function HomePage() {
  const router = useRouter();
  const [isApp, setIsApp] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 检测APP环境并自动跳转
  useEffect(() => {
    setMounted(true);
    
    // 延迟检测，等待 Capacitor 初始化
    const detectAndRedirect = () => {
      if (detectAppPlatform()) {
        setIsApp(true);
        // APP环境：自动跳转到收银台
        window.location.href = '/pos/cashier';
        return;
      }
      setIsApp(false);
    };
    
    // 立即检测一次
    detectAndRedirect();
    
    // 延迟500ms再次检测（等待 Capacitor 完全初始化）
    const timer = setTimeout(detectAndRedirect, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // 加载状态（防止闪烁）
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl">🏪</span>
          </div>
          <p className="text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }
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

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 系统介绍 */}
        <section className="mb-10 bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-5xl">🏪</span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">专为社区便利店打造</h2>
              <p className="text-orange-100 leading-relaxed">
                海邻到家是面向社区便利店的智能收银与营销管理系统，集成收银、会员、供应链、财务等核心功能，
                支持离线运行、PWA安装、硬件设备集成，帮助便利店实现数字化运营，提升经营效率。
              </p>
            </div>
          </div>
        </section>

        {/* 核心优势 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">核心优势</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-lg transition-all text-center"
              >
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">{feature.title}</h3>
                <p className="text-xs text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 快速入口 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-800 mb-4">快速入口</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {quickEntries.map((entry) => (
              entry.isExternal ? (
                <a
                  key={entry.id}
                  href={entry.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${entry.color} ${entry.hoverColor} rounded-2xl p-6 text-white transition-all duration-200 hover:scale-105 hover:shadow-xl group relative`}
                >
                  {entry.badge && (
                    <span className="absolute top-2 right-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {entry.badge}
                    </span>
                  )}
                  <entry.icon className="w-10 h-10 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-bold mb-1">{entry.title}</h3>
                  <p className="text-sm opacity-80">{entry.subtitle}</p>
                </a>
              ) : (
                <Link
                  key={entry.id}
                  href={entry.href}
                  className={`${entry.color} ${entry.hoverColor} rounded-2xl p-6 text-white transition-all duration-200 hover:scale-105 hover:shadow-xl group`}
                >
                  <entry.icon className="w-10 h-10 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-bold mb-1">{entry.title}</h3>
                  <p className="text-sm opacity-80">{entry.subtitle}</p>
                </Link>
              )
            ))}
          </div>
        </section>

        {/* 功能模块 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-800 mb-4">功能模块</h2>
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

        {/* 功能列表 */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4">更多功能</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              '收银台独立APP', '离线收银运行', '扫码枪集成', '小票打印',
              '钱箱控制', '客显屏支持', '会员四级体系', '积分规则',
              '优惠券系统', '满减促销', '晚8点清货', '便民服务',
              '库存管理', '供应链协同', '财务分账', '合规风控'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-600">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                {item}
              </div>
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
