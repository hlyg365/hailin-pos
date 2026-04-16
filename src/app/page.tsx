'use client';

// 强制动态渲染
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ShoppingCart, Smartphone, Store, Users, BarChart3, Settings, Package,
  Monitor, Tablet, Zap, Shield, ArrowRight, Wifi, QrCode, Clock
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  // 检查登录状态并自动跳转
  useEffect(() => {
    // 优先检测收银台登录状态
    const posUser = localStorage.getItem('pos_user');
    if (posUser) {
      router.replace('/pos');
      return;
    }

    const storeAdminUser = localStorage.getItem('store_admin_user');
    if (storeAdminUser) {
      router.replace('/store-admin');
      return;
    }

    const assistantUser = localStorage.getItem('assistant_user');
    if (assistantUser) {
      router.replace('/assistant');
      return;
    }

    const dashboardUser = localStorage.getItem('dashboard_user');
    if (dashboardUser) {
      router.replace('/dashboard');
      return;
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-400 to-pink-500">
      {/* 顶部品牌区域 */}
      <div className="bg-black/10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg">
                <Store className="h-8 w-8 text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">海邻到家</h1>
                <p className="text-white/80 text-sm">社区便利店智能收银系统 V3.0</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-white/80 text-sm">
              <Wifi className="h-4 w-4" />
              <span>系统在线</span>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* 运营人员入口 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Monitor className="h-6 w-6 text-white" />
            <h2 className="text-xl font-semibold text-white">运营人员入口</h2>
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              内部系统
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 收银台 */}
            <Card 
              className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200 bg-white/95 backdrop-blur border-0"
              onClick={() => router.push('/pos/auth/login')}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 mb-3">
                  <ShoppingCart className="h-7 w-7 text-orange-500" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">收银台</h3>
                <p className="text-xs text-gray-500 text-center mb-2">线下门店收银</p>
                <Badge variant="outline" className="text-xs bg-orange-50 border-orange-200 text-orange-600">
                  收银机/PC
                </Badge>
              </CardContent>
            </Card>

            {/* 总部后台 */}
            <Card 
              className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200 bg-white/95 backdrop-blur border-0"
              onClick={() => router.push('/dashboard/auth/login')}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 mb-3">
                  <Monitor className="h-7 w-7 text-blue-500" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">总部后台</h3>
                <p className="text-xs text-gray-500 text-center mb-2">多门店管理</p>
                <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-600">
                  PC浏览器
                </Badge>
              </CardContent>
            </Card>

            {/* 店长助手 */}
            <Card 
              className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200 bg-white/95 backdrop-blur border-0"
              onClick={() => router.push('/assistant/auth/login')}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mb-3">
                  <Tablet className="h-7 w-7 text-green-500" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">店长助手</h3>
                <p className="text-xs text-gray-500 text-center mb-2">移动办公</p>
                <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-600">
                  手机/Pad
                </Badge>
              </CardContent>
            </Card>

            {/* 门店管理 */}
            <Card 
              className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200 bg-white/95 backdrop-blur border-0"
              onClick={() => router.push('/store-admin/auth/login')}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 mb-3">
                  <Store className="h-7 w-7 text-purple-500" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">门店管理</h3>
                <p className="text-xs text-gray-500 text-center mb-2">店长PC端</p>
                <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-600">
                  PC浏览器
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 顾客入口 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="h-6 w-6 text-white" />
            <h2 className="text-xl font-semibold text-white">顾客入口</h2>
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              商城系统
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 小程序商城 */}
            <Card 
              className="cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 bg-white/95 backdrop-blur border-0"
              onClick={() => router.push('/mini-store/home')}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">小程序商城</h3>
                  <p className="text-sm text-gray-500 mb-2">手机下单，配送到家</p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                      微信小程序
                    </Badge>
                    <span className="text-xs text-gray-400">浏览商品 →</span>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-300" />
              </CardContent>
            </Card>

            {/* 扫码购物 */}
            <Card 
              className="cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 bg-white/95 backdrop-blur border-0"
              onClick={() => {
                // 提示用户使用微信扫码
                alert('请使用微信扫描商品二维码进行购物');
              }}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg">
                  <QrCode className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">扫码购物</h3>
                  <p className="text-sm text-gray-500 mb-2">扫描商品二维码直接下单</p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                      微信扫一扫
                    </Badge>
                    <span className="text-xs text-gray-400">快捷购买 →</span>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-300" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 系统特性 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Zap className="h-6 w-6 text-yellow-300 mx-auto mb-2" />
            <p className="text-white/90 text-sm font-medium">极速收银</p>
            <p className="text-white/60 text-xs">扫码即结算</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Users className="h-6 w-6 text-cyan-300 mx-auto mb-2" />
            <p className="text-white/90 text-sm font-medium">会员共享</p>
            <p className="text-white/60 text-xs">线上线下互通</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Shield className="h-6 w-6 text-green-300 mx-auto mb-2" />
            <p className="text-white/90 text-sm font-medium">数据安全</p>
            <p className="text-white/60 text-xs">云端同步</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Clock className="h-6 w-6 text-pink-300 mx-auto mb-2" />
            <p className="text-white/90 text-sm font-medium">全天候运营</p>
            <p className="text-white/60 text-xs">24小时服务</p>
          </div>
        </div>
      </div>

      {/* 底部版权 */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/10 backdrop-blur-sm py-3">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-white/60 text-sm">
            © 2024 海邻到家 · 社区便利店智能收银系统 V3.0
          </p>
        </div>
      </div>
    </div>
  );
}

// Badge组件（内联避免依赖问题）
function Badge({ 
  children, 
  variant = 'default',
  className = '' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
}) {
  const baseClass = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
  const variantClass = {
    default: 'bg-orange-500 text-white',
    secondary: 'bg-gray-100 text-gray-800',
    outline: 'border border-gray-300 bg-transparent',
  }[variant];

  return (
    <span className={`${baseClass} ${variantClass} ${className}`}>
      {children}
    </span>
  );
}
