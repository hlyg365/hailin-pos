'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingBag,
  Users,
  Wallet,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Activity,
  Store,
  Truck,
  ArrowRightLeft,
  Warehouse,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  ChevronRight,
  Calendar,
} from 'lucide-react';

// 店铺数据
const stores = [
  { id: 'store_001', name: '南山店', status: 'active' },
  { id: 'store_002', name: '福田店', status: 'active' },
  { id: 'store_003', name: '罗湖店', status: 'active' },
  { id: 'store_004', name: '宝安店', status: 'active' },
  { id: 'store_005', name: '龙岗店', status: 'inactive' },
];

// 总部汇总数据
const headquartersStats = {
  totalProducts: 3256,
  totalStock: 156820,
  totalStockValue: 892450.00,
  totalStores: 5,
  activeStores: 4,
  todaySales: 52380.50,
  todayOrders: 526,
  todayCustomers: 186,
  monthPurchase: 158600.00,
  monthOutbound: 32850,
  monthTransfer: 15,
  lowStockProducts: 23,
  outOfStockProducts: 8,
};

// 各店铺销售数据
const storeSalesData = [
  { id: 'store_001', name: '南山店', todaySales: 12580.50, todayOrders: 128, stock: 32560, status: 'active' },
  { id: 'store_002', name: '福田店', todaySales: 15620.00, todayOrders: 156, stock: 28450, status: 'active' },
  { id: 'store_003', name: '罗湖店', todaySales: 9850.30, todayOrders: 98, stock: 35120, status: 'active' },
  { id: 'store_004', name: '宝安店', todaySales: 14329.70, todayOrders: 144, stock: 31200, status: 'active' },
  { id: 'store_005', name: '龙岗店', todaySales: 0, todayOrders: 0, stock: 29490, status: 'inactive' },
];

// 进销存汇总
const inventorySummary = {
  purchase: {
    month: 158600.00,
    pending: 3,
    completed: 45,
    totalItems: 12560,
  },
  outbound: {
    month: 32850,
    sales: 28650,
    transfer: 3200,
    loss: 1000,
  },
  transfer: {
    month: 15,
    pending: 2,
    completed: 13,
  },
};

// 近期采购订单
const recentPurchases = [
  { id: 'PO202503170001', supplier: '可口可乐公司', store: '南山店', amount: 12500.00, status: 'pending', createTime: '2025-03-17 10:30' },
  { id: 'PO202503170002', supplier: '农夫山泉', store: '福田店', amount: 8600.00, status: 'completed', createTime: '2025-03-17 09:15' },
  { id: 'PO202503160001', supplier: '乐事公司', store: '罗湖店', amount: 5280.00, status: 'completed', createTime: '2025-03-16 14:20' },
  { id: 'PO202503160002', supplier: '蒙牛乳业', store: '宝安店', amount: 15800.00, status: 'shipped', createTime: '2025-03-16 11:00' },
];

// 近期调拨单
const recentTransfers = [
  { id: 'TF202503170001', from: '南山店', to: '福田店', items: 5, status: 'pending', createTime: '2025-03-17 11:00' },
  { id: 'TF202503160001', from: '福田店', to: '罗湖店', items: 8, status: 'completed', createTime: '2025-03-16 15:30' },
  { id: 'TF202503160002', from: '宝安店', to: '南山店', items: 3, status: 'completed', createTime: '2025-03-16 10:00' },
];

// 库存预警商品
const lowStockProducts = [
  { id: 'P001', name: '矿泉水 500ml', store: '南山店', stock: 15, minStock: 50, status: 'low' },
  { id: 'P002', name: '可乐 330ml', store: '福田店', stock: 0, minStock: 30, status: 'out' },
  { id: 'P003', name: '苹果 红富士', store: '罗湖店', stock: 8, minStock: 20, status: 'low' },
  { id: 'P004', name: '牛奶 250ml', store: '宝安店', stock: 0, minStock: 40, status: 'out' },
];

// 状态配置
const statusConfigs: Record<string, { label: string; bgClass: string; textClass: string; icon: typeof CheckCircle }> = {
  pending: { label: '待处理', bgClass: 'bg-amber-100', textClass: 'text-amber-700', icon: Clock },
  completed: { label: '已完成', bgClass: 'bg-emerald-100', textClass: 'text-emerald-700', icon: CheckCircle },
  shipped: { label: '配送中', bgClass: 'bg-blue-100', textClass: 'text-blue-700', icon: Truck },
  low: { label: '库存低', bgClass: 'bg-orange-100', textClass: 'text-orange-700', icon: AlertTriangle },
  out: { label: '缺货', bgClass: 'bg-red-100', textClass: 'text-red-700', icon: XCircle },
  active: { label: '营业中', bgClass: 'bg-emerald-100', textClass: 'text-emerald-700', icon: CheckCircle },
  inactive: { label: '已停业', bgClass: 'bg-slate-100', textClass: 'text-slate-500', icon: XCircle },
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  useEffect(() => {
    setMounted(true);
    
    // 检测是否在 Android APP 中运行
    const isAndroidApp = typeof window !== 'undefined' && 
      (window.location.href.includes('localhost:5000') || 
       window.location.protocol === 'capacitor:' ||
       navigator.userAgent.includes('wv') ||
       navigator.userAgent.includes('Android'));
    
    // 如果在 Android APP 中，自动跳转到收银台
    if (isAndroidApp && window.location.pathname === '/') {
      console.log('检测到 Android 环境，跳转到收银台');
      window.location.href = '/pos';
      return;
    }

    const updateTime = () => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      setCurrentTime(`${month}月${day}日 ${weekDays[now.getDay()]} ${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">总部管理看板</h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {mounted ? currentTime : ''}
            </p>
          </div>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32 bg-slate-50 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">今日</SelectItem>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* 核心指标卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg shadow-orange-500/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 opacity-90" />
                <span className="text-sm opacity-90">总商品数</span>
              </div>
              <div className="text-3xl font-bold">{headquartersStats.totalProducts.toLocaleString()}</div>
              <div className="text-xs opacity-75 mt-1">SKU</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg shadow-blue-500/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Warehouse className="h-5 w-5 opacity-90" />
                <span className="text-sm opacity-90">总库存量</span>
              </div>
              <div className="text-3xl font-bold">{headquartersStats.totalStock.toLocaleString()}</div>
              <div className="text-xs opacity-75 mt-1">库存价值 ¥{headquartersStats.totalStockValue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="h-5 w-5 opacity-90" />
                <span className="text-sm opacity-90">今日销售</span>
              </div>
              <div className="text-3xl font-bold">¥{headquartersStats.todaySales.toLocaleString()}</div>
              <div className="text-xs opacity-75 mt-1">{headquartersStats.todayOrders} 订单</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white border-0 shadow-lg shadow-violet-500/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="h-5 w-5 opacity-90" />
                <span className="text-sm opacity-90">本月采购</span>
              </div>
              <div className="text-3xl font-bold">¥{headquartersStats.monthPurchase.toLocaleString()}</div>
              <div className="text-xs opacity-75 mt-1">{inventorySummary.purchase.completed} 单已入库</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0 shadow-lg shadow-cyan-500/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <ArrowRightLeft className="h-5 w-5 opacity-90" />
                <span className="text-sm opacity-90">本月调拨</span>
              </div>
              <div className="text-3xl font-bold">{headquartersStats.monthTransfer}</div>
              <div className="text-xs opacity-75 mt-1">{inventorySummary.transfer.pending} 待处理</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white border-0 shadow-lg shadow-rose-500/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 opacity-90" />
                <span className="text-sm opacity-90">库存预警</span>
              </div>
              <div className="text-3xl font-bold">{headquartersStats.lowStockProducts + headquartersStats.outOfStockProducts}</div>
              <div className="text-xs opacity-75 mt-1">{headquartersStats.outOfStockProducts} 缺货</div>
            </CardContent>
          </Card>
        </div>

        {/* 店铺销售概览 */}
        <Card className="mb-6 shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between bg-white border-b border-slate-100 px-6 py-4">
            <CardTitle className="text-base font-semibold text-slate-800">店铺销售概览</CardTitle>
            <Button variant="outline" size="sm" className="text-slate-600 border-slate-200 hover:bg-slate-50" asChild>
              <a href="/stores/manage">
                <Store className="h-4 w-4 mr-1.5" />
                店铺管理
              </a>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {storeSalesData.map((store) => {
                const statusConfig = statusConfigs[store.status];
                return (
                  <div key={store.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <Store className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{store.name}</div>
                        <div className="text-sm text-slate-500">库存 {store.stock.toLocaleString()}</div>
                      </div>
                    </div>
                    <Badge className={`${statusConfig.bgClass} ${statusConfig.textClass} font-medium px-3 py-1`}>
                      {statusConfig.label}
                    </Badge>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-800">¥{store.todaySales.toLocaleString()}</div>
                      <div className="text-sm text-slate-500">{store.todayOrders} 订单</div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 近期采购单 & 调拨单 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 近期采购单 */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between bg-white border-b border-slate-100 px-6 py-4">
              <CardTitle className="text-base font-semibold text-slate-800">近期采购单</CardTitle>
              <Button variant="link" size="sm" className="text-blue-600 hover:text-blue-700" asChild>
                <a href="/inventory/purchase" className="flex items-center gap-1">
                  查看全部
                  <ChevronRight className="h-4 w-4" />
                </a>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {recentPurchases.map((purchase) => {
                  const statusConfig = statusConfigs[purchase.status];
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div key={purchase.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Truck className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{purchase.supplier}</div>
                          <div className="text-sm text-slate-500">{purchase.id} · {purchase.store}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-slate-800">¥{purchase.amount.toLocaleString()}</div>
                        </div>
                        <Badge className={`${statusConfig.bgClass} ${statusConfig.textClass} font-medium px-3 py-1`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 近期调拨单 */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between bg-white border-b border-slate-100 px-6 py-4">
              <CardTitle className="text-base font-semibold text-slate-800">近期调拨单</CardTitle>
              <Button variant="link" size="sm" className="text-blue-600 hover:text-blue-700" asChild>
                <a href="/inventory/transfer" className="flex items-center gap-1">
                  查看全部
                  <ChevronRight className="h-4 w-4" />
                </a>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {recentTransfers.map((transfer) => {
                  const statusConfig = statusConfigs[transfer.status];
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div key={transfer.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                          <ArrowRightLeft className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{transfer.from} → {transfer.to}</div>
                          <div className="text-sm text-slate-500">{transfer.id} · {transfer.items} 种商品</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-500">{transfer.createTime}</div>
                        <Badge className={`${statusConfig.bgClass} ${statusConfig.textClass} font-medium px-3 py-1`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 库存预警 */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between bg-white border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-base font-semibold text-slate-800">库存预警商品</CardTitle>
            </div>
            <Button variant="link" size="sm" className="text-blue-600 hover:text-blue-700" asChild>
              <a href="/inventory?status=warning" className="flex items-center gap-1">
                查看全部
                <ChevronRight className="h-4 w-4" />
              </a>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {lowStockProducts.map((product) => {
                const statusConfig = statusConfigs[product.status];
                const stockPercent = (product.stock / product.minStock) * 100;
                return (
                  <div key={product.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{product.name}</div>
                        <div className="text-sm text-slate-500">{product.store}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="w-32">
                        <div className="flex justify-between text-sm mb-1">
                          <span className={product.status === 'out' ? 'text-red-600 font-semibold' : 'text-orange-600 font-semibold'}>
                            {product.stock}
                          </span>
                          <span className="text-slate-500">/ {product.minStock}</span>
                        </div>
                        <Progress value={stockPercent} className="h-1.5" />
                      </div>
                      <Badge className={`${statusConfig.bgClass} ${statusConfig.textClass} font-medium px-3 py-1`}>
                        {statusConfig.label}
                      </Badge>
                      <Button variant="outline" size="sm" className="text-slate-600 border-slate-200 hover:bg-slate-50">
                        立即补货
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 快捷入口 */}
        <Card className="mt-6 shadow-sm border-slate-200">
          <CardHeader className="bg-white border-b border-slate-100 px-6 py-4">
            <CardTitle className="text-base font-semibold text-slate-800">快捷入口</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <a href="/inventory/purchase" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <div className="text-sm font-medium text-slate-700">采购管理</div>
              </a>
              <a href="/inventory/transfer" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-violet-50 hover:bg-violet-100 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
                  <ArrowRightLeft className="h-6 w-6 text-white" />
                </div>
                <div className="text-sm font-medium text-slate-700">库存调拨</div>
              </a>
              <a href="/inventory/psa" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="text-sm font-medium text-slate-700">进销存报表</div>
              </a>
              <a href="/products" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div className="text-sm font-medium text-slate-700">商品管理</div>
              </a>
              <a href="/stores/manage" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-cyan-50 hover:bg-cyan-100 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div className="text-sm font-medium text-slate-700">店铺管理</div>
              </a>
              <a href="/pos" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-rose-50 hover:bg-rose-100 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <div className="text-sm font-medium text-slate-700">收银台</div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
