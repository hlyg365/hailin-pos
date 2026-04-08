'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InstallButton } from '@/components/pwa-install-button';
import { 
  Smartphone, 
  Monitor, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  Package,
  ChevronRight,
  Wifi,
  WifiOff,
  Download
} from 'lucide-react';

export default function HomePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-600">海邻到家</h1>
            <p className="text-sm text-gray-500">社区便利店智能管理系统</p>
          </div>
          <div className="flex items-center gap-3">
            {/* 网络状态 */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? '在线' : '离线'}
            </div>
            {/* 安装按钮 */}
            {!isStandalone && <InstallButton />}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 快捷入口 */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">快速入口</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAccessCard
              title="收银台"
              description="快速收银结账"
              href="/pos"
              icon={<ShoppingCart className="h-8 w-8" />}
              color="bg-orange-500"
            />
            <QuickAccessCard
              title="店长助手"
              description="移动端管理"
              href="/assistant"
              icon={<Smartphone className="h-8 w-8" />}
              color="bg-blue-500"
            />
            <QuickAccessCard
              title="管理后台"
              description="电脑端管理"
              href="/store-admin"
              icon={<Monitor className="h-8 w-8" />}
              color="bg-purple-500"
            />
            <QuickAccessCard
              title="总部系统"
              description="多门店管理"
              href="/dashboard"
              icon={<BarChart3 className="h-8 w-8" />}
              color="bg-green-500"
            />
          </div>
        </section>

        {/* 功能模块 */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">功能模块</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <FeatureCard
              title="商品管理"
              description="商品上架、编辑、价格调整"
              icon={<Package className="h-5 w-5" />}
            />
            <FeatureCard
              title="会员管理"
              description="会员注册、积分、等级"
              icon={<Users className="h-5 w-5" />}
            />
            <FeatureCard
              title="数据报表"
              description="销售统计、经营分析"
              icon={<BarChart3 className="h-5 w-5" />}
            />
          </div>
        </section>

        {/* PWA 安装提示 */}
        {!isStandalone && (
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Download className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">安装到桌面</h3>
                    <p className="text-sm text-gray-600">
                      添加到主屏幕，像原生APP一样使用
                    </p>
                  </div>
                </div>
                <Link href="/pwa-install">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    立即安装
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 离线模式提示 */}
        <Card className="mt-4 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <WifiOff className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">离线使用说明</p>
                <p className="text-blue-600">
                  安装应用后，即使断网也能正常收银。订单数据将在网络恢复后自动同步。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>海邻到家社区便利店智能管理系统 V3.0</p>
          <p className="mt-1">技术支持与持续迭代中</p>
        </div>
      </footer>
    </div>
  );
}

// 快捷入口卡片
function QuickAccessCard({ 
  title, 
  description, 
  href, 
  icon, 
  color 
}: { 
  title: string; 
  description: string; 
  href: string; 
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
        <CardContent className="p-6 text-center">
          <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

// 功能卡片
function FeatureCard({ 
  title, 
  description, 
  icon 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="text-orange-500">{icon}</span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
