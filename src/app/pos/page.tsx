'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Smartphone, Monitor, ArrowLeft, QrCode } from 'lucide-react';

export default function PosPage() {
  const [isApp, setIsApp] = useState<boolean | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    // 检测是否为原生APP环境
    const checkPlatform = () => {
      if (typeof window === 'undefined') return false;
      
      const capacitor = (window as any).Capacitor;
      if (capacitor?.isNativePlatform?.()) return true;
      
      const ua = navigator.userAgent || '';
      if (ua.includes('Android') && (ua.includes('wv') || ua.includes('WebView'))) return true;
      
      return false;
    };

    const isNative = checkPlatform();
    setIsApp(isNative);

    // 如果是APP，直接跳转到收银台
    if (isNative) {
      window.location.href = '/pos/cashier';
    }
  }, []);

  // 显示加载中
  if (isApp === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🛒</div>
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 浏览器环境显示下载引导
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600">
      {/* 顶部导航 */}
      <header className="bg-white/10 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回首页
          </Link>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* 标题区 */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-8 py-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏪</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">海邻到家 收银台</h1>
            <p className="text-orange-100">专为收银场景优化，请下载APP使用</p>
          </div>

          {/* 说明 */}
          <div className="px-8 py-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">为什么需要下载APP？</h2>
            <div className="space-y-3 mb-8">
              {[
                { icon: '🔒', text: '硬件集成：支持扫码枪、打印机、钱箱等外设' },
                { icon: '⚡', text: '离线收银：断网也能正常收款' },
                { icon: '📱', text: '流畅体验：原生应用，响应更快' },
                { icon: '🖥️', text: '客显支持：连接副屏显示商品信息' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-slate-600">{item.text}</span>
                </div>
              ))}
            </div>

            {/* 下载按钮 */}
            <div className="space-y-4">
              <a
                href="/hailin-pos-v3.0.apk"
                className="flex items-center justify-center gap-3 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
              >
                <Download className="w-6 h-6" />
                <span>下载安装包 (Android APK)</span>
              </a>
              
              <p className="text-center text-sm text-slate-400">
                版本 3.0.0 | 大小约 109MB
              </p>
            </div>

            {/* 其他入口 */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-500 mb-3">其他管理入口</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/store-admin"
                  className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Monitor className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-slate-700">电脑端管理</span>
                </Link>
                <Link
                  href="/assistant"
                  className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Smartphone className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-slate-700">店长助手</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <p className="text-center text-white/60 text-sm mt-6">
          安装后打开APP即可使用收银功能
        </p>
      </main>
    </div>
  );
}
