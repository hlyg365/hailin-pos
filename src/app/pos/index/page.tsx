'use client';

import Link from 'next/link';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  Monitor,
  Smartphone,
  Printer,
  Wifi,
  Cpu,
  Clock,
  Shield,
  Zap,
  ArrowRight,
  Download
} from 'lucide-react';

export default function PosHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600">
      {/* 顶部品牌 */}
      <header className="bg-white/10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🏪</span>
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">海邻到家 收银台</h1>
              <p className="text-orange-100 text-sm">智能零售收银系统</p>
            </div>
          </div>
        </div>
      </header>

      {/* 核心功能区 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 快速收银 - 核心入口 */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-8 py-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                <ShoppingCart className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">快速收银</h2>
                <p className="text-orange-100">扫码添加商品，一键结算</p>
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

        {/* 辅助功能区 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* 商品管理 */}
          <Link 
            href="/pos/products"
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Package className="w-7 h-7 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1">商品管理</h3>
                <p className="text-sm text-slate-500">商品信息维护</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
          </Link>

          {/* 会员管理 */}
          <Link 
            href="/pos/members"
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <Users className="w-7 h-7 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1">会员管理</h3>
                <p className="text-sm text-slate-500">会员信息查询</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
          </Link>

          {/* 硬件设置 */}
          <Link 
            href="/pos/hardware"
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <Printer className="w-7 h-7 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1">硬件设置</h3>
                <p className="text-sm text-slate-500">外设连接配置</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
          </Link>

          {/* 系统设置 */}
          <Link 
            href="/pos/settings"
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                <Settings className="w-7 h-7 text-slate-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1">系统设置</h3>
                <p className="text-sm text-slate-500">店铺基础配置</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
          </Link>
        </div>

        {/* 功能特性 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4">收银台核心功能</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Monitor, label: '客显屏支持', desc: '副屏显示商品' },
              { icon: Wifi, label: '离线收银', desc: '断网也能用' },
              { icon: Cpu, label: '扫码枪集成', desc: 'USB自动识别' },
              { icon: Shield, label: '数据安全', desc: '本地加密存储' },
            ].map((feature, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-white text-sm font-medium">{feature.label}</p>
                <p className="text-orange-200 text-xs">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 底部 */}
        <div className="text-center mt-8">
          <Link 
            href="/"
            className="text-orange-100 hover:text-white text-sm transition-colors"
          >
            返回管理后台
          </Link>
        </div>
      </main>
    </div>
  );
}
