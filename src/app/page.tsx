'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 根页面 - 智能路由分发
 * 
 * 访问策略：
 * - 原生APP（Capacitor/Android WebView）→ 收银台 /pos
 * - 浏览器访问 → 总部后台 /dashboard
 * 
 * 说明：
 * - 收银台APP已安装到收银机上，直接打开APP进入收银台
 * - 管理员在电脑浏览器访问后台管理系统
 */
export default function HomePage() {
  const router = useRouter();
  const [platform, setPlatform] = useState<'app' | 'browser' | 'checking'>('checking');

  useEffect(() => {
    // 检测平台类型
    const detectPlatform = () => {
      if (typeof window === 'undefined') {
        return 'browser'; // SSR 默认为浏览器
      }

      const capacitor = (window as any).Capacitor;

      // 1. Capacitor 原生平台
      if (capacitor && capacitor.isNativePlatform && capacitor.isNativePlatform()) {
        console.log('[Platform] 检测到: 原生APP');
        return 'app';
      }

      // 2. Android WebView
      const ua = navigator.userAgent || '';
      if (ua.includes('Android') && (ua.includes('wv') || ua.includes('WebView'))) {
        console.log('[Platform] 检测到: Android WebView');
        return 'app';
      }

      // 3. 检查 URL 参数
      const params = new URLSearchParams(window.location.search);
      if (params.get('app') === 'true') {
        console.log('[Platform] 检测到: URL强制APP模式');
        return 'app';
      }

      console.log('[Platform] 检测到: 浏览器');
      return 'browser';
    };

    // 平台检测和跳转（仅在客户端执行）
    const result = detectPlatform();
    setPlatform(result);

    // 根据平台类型跳转（延迟到客户端渲染后再跳转）
    const timer = setTimeout(() => {
      if (result === 'app') {
        router.replace('/pos');
      } else {
        router.replace('/dashboard');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  // 显示加载页面（服务端和客户端初始渲染一致）
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold mb-2">海邻到家</h1>
        <p className="text-orange-100">正在启动...</p>
      </div>
    </div>
  );
}
