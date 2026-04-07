'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// 模拟数据
const todayStats = {
  sales: 12856.50,
  orders: 89,
  customers: 156,
  avgTicket: 144.57,
  growth: 12.5,
};

const weekStats = {
  sales: 89234.00,
  orders: 612,
  customers: 4230,
  avgTicket: 145.80,
  growth: 8.3,
};

const monthStats = {
  sales: 356789.00,
  orders: 2456,
  customers: 16890,
  avgTicket: 145.33,
  growth: 15.2,
};

const salesTrend = [
  { day: '周一', value: 12500 },
  { day: '周二', value: 15200 },
  { day: '周三', value: 13800 },
  { day: '周四', value: 16400 },
  { day: '周五', value: 18200 },
  { day: '周六', value: 21500 },
  { day: '周日', value: 19600 },
];

const topProducts = [
  { rank: 1, name: '可口可乐500ml', sales: 156, amount: 468 },
  { rank: 2, name: '农夫山泉550ml', sales: 142, amount: 284 },
  { rank: 3, name: '康师傅红烧牛肉面', sales: 98, amount: 441 },
  { rank: 4, name: '双汇王中王火腿肠', sales: 87, amount: 217.5 },
  { rank: 5, name: '维达抽纸', sales: 65, amount: 578.5 },
];

const categorySales = [
  { name: '饮料', amount: 12580, percent: 35 },
  { name: '方便食品', amount: 8960, percent: 25 },
  { name: '休闲食品', amount: 7240, percent: 20 },
  { name: '日用品', amount: 5430, percent: 15 },
  { name: '其他', amount: 1646, percent: 5 },
];

export default function ReportsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [activeTab, setActiveTab] = useState('overview');

  const currentStats = period === 'today' ? todayStats : period === 'week' ? weekStats : monthStats;
  const periodLabel = period === 'today' ? '今日' : period === 'week' ? '本周' : '本月';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部栏 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-3 p-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-medium flex-1">数据报表</h1>
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">今日</SelectItem>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full rounded-none border-b bg-white h-11">
          <TabsTrigger value="overview" className="flex-1">数据概览</TabsTrigger>
          <TabsTrigger value="sales" className="flex-1">销售分析</TabsTrigger>
          <TabsTrigger value="products" className="flex-1">商品分析</TabsTrigger>
        </TabsList>

        {/* 数据概览 */}
        <TabsContent value="overview" className="p-4 space-y-4 mt-0">
          {/* 核心指标 */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="py-4">
              <div className="text-center">
                <p className="text-white/60 text-sm">{periodLabel}营业额</p>
                <p className="text-3xl font-bold mt-1">
                  ¥{currentStats.sales.toLocaleString()}
                </p>
                <div className="flex items-center justify-center gap-1 text-green-300 text-sm mt-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>较上期 +{currentStats.growth}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 指标卡片 */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">订单数</p>
                    <p className="text-lg font-bold">{currentStats.orders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">客流量</p>
                    <p className="text-lg font-bold">{currentStats.customers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">客单价</p>
                    <p className="text-lg font-bold">¥{currentStats.avgTicket.toFixed(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Package className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">会员占比</p>
                    <p className="text-lg font-bold">68%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 销售趋势 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">近7日销售趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {salesTrend.map((item) => {
                  const maxValue = Math.max(...salesTrend.map(s => s.value));
                  const percent = (item.value / maxValue) * 100;
                  return (
                    <div key={item.day} className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-8">{item.day}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        ¥{item.value.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 销售分析 */}
        <TabsContent value="sales" className="p-4 space-y-4 mt-0">
          {/* 品类销售 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">品类销售分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categorySales.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-medium">¥{item.amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 时段分析 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">销售时段分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">早晨</p>
                  <p className="font-bold">18%</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500">上午</p>
                  <p className="font-bold text-blue-500">28%</p>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <p className="text-xs text-gray-500">下午</p>
                  <p className="font-bold text-orange-500">32%</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-500">晚间</p>
                  <p className="font-bold text-purple-500">22%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 商品分析 */}
        <TabsContent value="products" className="p-4 space-y-4 mt-0">
          {/* 热销商品 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">热销商品TOP5</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topProducts.map((item) => (
                <div key={item.rank} className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    item.rank === 1 ? "bg-yellow-400 text-white" :
                    item.rank === 2 ? "bg-gray-300 text-white" :
                    item.rank === 3 ? "bg-orange-400 text-white" :
                    "bg-gray-100 text-gray-500"
                  )}>
                    {item.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">销量 {item.sales}</p>
                  </div>
                  <p className="text-sm font-bold text-red-500">
                    ¥{item.amount.toFixed(0)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 商品指标 */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-2xl font-bold text-blue-500">1,256</p>
                <p className="text-xs text-gray-500">商品种类</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 text-center">
                <p className="text-2xl font-bold text-green-500">89.2%</p>
                <p className="text-xs text-gray-500">动销率</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
