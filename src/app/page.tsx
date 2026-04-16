'use client';

// 强制动态渲染
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart, Smartphone, Store, Users, BarChart3, Settings, Package } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  // 检查是否已登录收银台，如果是则直接跳转
  useEffect(() => {
    const posUser = localStorage.getItem('pos_user');
    if (posUser) {
      // 已登录，直接跳转到收银台
      router.replace('/pos');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl">
              <Store className="h-12 w-12 text-orange-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">海邻到家</h1>
          <p className="text-white/80 text-lg">社区便利店智能收银系统</p>
        </div>

        {/* 快速入口卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {/* 收银台 */}
          <Card 
            className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200 bg-white/95 backdrop-blur"
            onClick={() => router.push('/pos/auth/login')}
          >
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 mb-3">
                <ShoppingCart className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="font-semibold text-gray-800">收银台</h3>
              <p className="text-xs text-gray-500 mt-1">快速收银</p>
            </CardContent>
          </Card>

          {/* 小程序商城 */}
          <Card 
            className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200 bg-white/95 backdrop-blur"
            onClick={() => router.push('/mini-store/home')}
          >
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mb-3">
                <Smartphone className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-semibold text-gray-800">小程序商城</h3>
              <p className="text-xs text-gray-500 mt-1">线上下单</p>
            </CardContent>
          </Card>

          {/* 会员管理 */}
          <Card 
            className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200 bg-white/95 backdrop-blur"
            onClick={() => router.push('/pos/members')}
          >
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 mb-3">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="font-semibold text-gray-800">会员管理</h3>
              <p className="text-xs text-gray-500 mt-1">会员信息</p>
            </CardContent>
          </Card>

          {/* 商品管理 */}
          <Card 
            className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200 bg-white/95 backdrop-blur"
            onClick={() => router.push('/pos/products')}
          >
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 mb-3">
                <Package className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="font-semibold text-gray-800">商品管理</h3>
              <p className="text-xs text-gray-500 mt-1">商品列表</p>
            </CardContent>
          </Card>

          {/* 销售报表 */}
          <Card 
            className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200 bg-white/95 backdrop-blur"
            onClick={() => router.push('/assistant/reports')}
          >
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-3">
                <BarChart3 className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="font-semibold text-gray-800">销售报表</h3>
              <p className="text-xs text-gray-500 mt-1">数据统计</p>
            </CardContent>
          </Card>

          {/* 硬件设置 */}
          <Card 
            className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200 bg-white/95 backdrop-blur"
            onClick={() => router.push('/pos/hardware')}
          >
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-3">
                <Settings className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="font-semibold text-gray-800">硬件设置</h3>
              <p className="text-xs text-gray-500 mt-1">打印机/钱箱</p>
            </CardContent>
          </Card>
        </div>

        {/* 底部信息 */}
        <div className="text-center">
          <p className="text-white/60 text-sm">© 2024 海邻到家 · 社区便利店智能收银系统 V3.0</p>
        </div>
      </div>
    </div>
  );
}
