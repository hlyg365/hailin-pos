'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  Monitor,
  Printer,
  Wifi,
  Cpu,
  Shield,
  Zap,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Percent,
  Truck,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  Clock,
  Store,
  Cloud,
  CloudOff
} from 'lucide-react';
import { posStore } from '@/lib/pos-store';

export default function PosHomePage() {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrders: 0,
    pendingSync: 0,
    lowStock: 0
  });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadStats();
    
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

  const loadStats = async () => {
    try {
      const sales = await posStore.getTodaySales();
      const pending = await posStore.getPendingOrders();
      const products = await posStore.getProducts();
      const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
      
      setStats({
        todaySales: sales.totalAmount,
        todayOrders: sales.orderCount,
        pendingSync: pending.length,
        lowStock: lowStockCount
      });
    } catch (e) {
      console.error('加载数据失败', e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
      {/* 顶部状态栏 */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Store className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">海邻到家 收银台</h1>
                <p className="text-slate-400 text-sm">智能零售收银系统 V3.1.0</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {isOnline ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
                <span className="text-sm font-medium">{isOnline ? '在线' : '离线'}</span>
              </div>
              
              {stats.pendingSync > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-full">
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm font-medium">{stats.pendingSync} 待同步</span>
                </div>
              )}
              
              <Link 
                href="/pos/settings"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">今日销售额</p>
                <p className="text-white font-bold text-lg">¥{stats.todaySales.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">今日订单</p>
                <p className="text-white font-bold text-lg">{stats.todayOrders} 笔</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">库存预警</p>
                <p className="text-white font-bold text-lg">{stats.lowStock} 个</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">待同步</p>
                <p className="text-white font-bold text-lg">{stats.pendingSync} 条</p>
              </div>
            </div>
          </div>
        </div>

        {/* 核心功能区 */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-5 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">快速收银</h2>
                <p className="text-orange-100">扫码添加商品，一键结算，支持多种支付方式</p>
              </div>
              <Link 
                href="/pos/cashier"
                className="bg-white text-orange-500 font-bold px-6 py-3 rounded-xl hover:bg-orange-50 flex items-center gap-2 transition-colors"
              >
                <Zap className="w-5 h-5" />
                开始收银
              </Link>
            </div>
          </div>
        </div>

        {/* 功能网格 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <Link href="/pos/products" className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100">
                <Package className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1">商品管理</h3>
                <p className="text-sm text-slate-500">商品信息维护</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
            </div>
          </Link>

          <Link href="/pos/inventory" className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1">库存管理</h3>
                <p className="text-sm text-slate-500">库存查询调整</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
            </div>
          </Link>

          <Link href="/pos/purchase" className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100">
                <Truck className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1">采购申请</h3>
                <p className="text-sm text-slate-500">向总部申请要货</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
            </div>
          </Link>

          <Link href="/pos/promotions" className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100">
                <Percent className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1">促销管理</h3>
                <p className="text-sm text-slate-500">折扣优惠活动</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
            </div>
          </Link>

          <Link href="/pos/reports" className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100">
                <BarChart3 className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1">销售报表</h3>
                <p className="text-sm text-slate-500">经营数据分析</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
            </div>
          </Link>

          <Link href="/pos/orders" className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center group-hover:bg-cyan-100">
                <ShoppingCart className="w-6 h-6 text-cyan-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1">订单查询</h3>
                <p className="text-sm text-slate-500">历史订单记录</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
            </div>
          </Link>

          <Link href="/pos/members" className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center group-hover:bg-pink-100">
                <Users className="w-6 h-6 text-pink-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1">会员管理</h3>
                <p className="text-sm text-slate-500">会员信息积分</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
            </div>
          </Link>

          <Link href="/pos/hardware" className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center group-hover:bg-teal-100">
                <Printer className="w-6 h-6 text-teal-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1">硬件设置</h3>
                <p className="text-sm text-slate-500">打印机钱箱</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
            </div>
          </Link>
        </div>

        {/* 底部 */}
        <div className="text-center mt-8 flex items-center justify-center gap-4">
          <Link href="/pos/cashier" className="text-orange-400 hover:text-orange-300 text-sm">
            收银台
          </Link>
          <span className="text-slate-600">|</span>
          <Link href="/" className="text-slate-400 hover:text-slate-300 text-sm">
            返回管理后台
          </Link>
        </div>
      </main>
    </div>
  );
}
