'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  Settings, 
  Wifi,
  Clock,
  LogOut,
  QrCode,
  Barcode
} from 'lucide-react';

// 收银台主页面组件
export default function PosPage() {
  const router = useRouter();
  const [isApp, setIsApp] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // 检测是否为原生APP环境
    const checkPlatform = () => {
      if (typeof window === 'undefined') return false;
      
      const capacitor = (window as any).Capacitor;
      if (capacitor?.isNativePlatform?.()) return true;
      
      const ua = navigator.userAgent || '';
      return ua.includes('Android') && (ua.includes('wv') || ua.includes('WebView'));
    };

    if (checkPlatform()) {
      setIsApp(true);
      // APP环境跳转到收银台主界面
      router.replace('/pos/cashier');
    }
  }, [router]);

  // 更新时钟
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 网络状态检测
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 如果是APP，跳转到收银台
  if (isApp) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600">
      {/* 顶部状态栏 */}
      <header className="bg-white/10 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-white">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-300" />
                <span className="text-xs">在线</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-red-300" />
                <span className="text-xs">离线</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Logo区域 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🏪</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">海邻到家 收银台</h1>
          <p className="text-orange-100 text-sm">请在收银机上打开此应用</p>
        </div>

        {/* 功能入口 */}
        <div className="space-y-4">
          {/* 快速收银 */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-orange-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800">快速收银</h2>
                <p className="text-sm text-slate-500">扫码添加商品，一键结算</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/pos/cashier')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              开始收银
            </button>
          </div>

          {/* 其他功能 */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/pos/products"
              className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <Package className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-slate-800 text-center">商品管理</h3>
            </Link>

            <Link
              href="/pos/members"
              className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-slate-800 text-center">会员管理</h3>
            </Link>

            <Link
              href="/pos/hardware"
              className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <Barcode className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-slate-800 text-center">硬件设置</h3>
            </Link>

            <Link
              href="/pos/settings"
              className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <Settings className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="font-semibold text-slate-800 text-center">系统设置</h3>
            </Link>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="mt-8 p-4 bg-white/10 rounded-xl">
          <h3 className="text-white font-semibold mb-2">使用提示</h3>
          <ul className="text-orange-100 text-sm space-y-1">
            <li>• 确保收银机已安装扫码枪</li>
            <li>• 连接小票打印机和钱箱</li>
            <li>• 首次使用请先完成硬件设置</li>
          </ul>
        </div>

        {/* 返回首页 */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-white/70 hover:text-white text-sm">
            返回管理系统首页
          </Link>
        </div>
      </main>
    </div>
  );
}
