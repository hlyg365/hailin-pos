'use client';

import { useState, useMemo, memo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Calendar,
  Download,
  Smartphone,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// 模拟数据 - 移到组件外部避免每次渲染重新创建
const todayStats = {
  sales: 12856.50,
  orders: 89,
  customers: 156,
  avgTicket: 144.57,
  salesGrowth: 12.5,
  ordersGrowth: 8.3,
  customersGrowth: 15.2,
};

const weekStats = {
  sales: 89234.00,
  orders: 612,
  customers: 4230,
  avgTicket: 145.80,
};

const salesTrend = [
  { day: '周一', value: 12500, date: '01/13' },
  { day: '周二', value: 15200, date: '01/14' },
  { day: '周三', value: 13800, date: '01/15' },
  { day: '周四', value: 16400, date: '01/16' },
  { day: '周五', value: 18200, date: '01/17' },
  { day: '周六', value: 21500, date: '01/18' },
  { day: '周日', value: 19600, date: '01/19' },
];

const topProducts = [
  { rank: 1, name: '可口可乐500ml', sales: 156, amount: 468, growth: 12.5 },
  { rank: 2, name: '农夫山泉550ml', sales: 142, amount: 284, growth: 8.3 },
  { rank: 3, name: '康师傅红烧牛肉面', sales: 98, amount: 441, growth: -2.1 },
  { rank: 4, name: '双汇王中王火腿肠', sales: 87, amount: 217.5, growth: 5.6 },
  { rank: 5, name: '维达抽纸', sales: 65, amount: 578.5, growth: 18.2 },
];

const recentOrders = [
  { id: 'ORD202401190001', time: '14:32', amount: 56.50, status: 'completed', items: 5 },
  { id: 'ORD202401190002', time: '14:28', amount: 128.00, status: 'delivering', items: 8 },
  { id: 'ORD202401190003', time: '14:15', amount: 35.50, status: 'completed', items: 3 },
  { id: 'ORD202401190004', time: '14:02', amount: 89.00, status: 'pending', items: 6 },
  { id: 'ORD202401190005', time: '13:45', amount: 156.80, status: 'completed', items: 12 },
];

const alerts = [
  { id: 1, type: 'warning', message: '可口可乐库存不足，仅剩12件', time: '10分钟前' },
  { id: 2, type: 'warning', message: '农夫山泉临期预警，剩余15天', time: '1小时前' },
  { id: 3, type: 'info', message: '有3笔待审批的采购申请', time: '2小时前' },
  { id: 4, type: 'info', message: '今日促销活动即将开始', time: '3小时前' },
];

const quickActions = [
  { icon: ShoppingCart, label: '订单管理', path: '/store-admin/orders', color: 'bg-blue-500' },
  { icon: Package, label: '库存盘点', path: '/store-admin/inventory', color: 'bg-orange-500' },
  { icon: Users, label: '会员查询', path: '/store-admin/members', color: 'bg-green-500' },
  { icon: BarChart3, label: '销售报表', path: '/store-admin/reports', color: 'bg-purple-500' },
];

// 状态徽章组件 - memo 化
const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-700">已完成</Badge>;
    case 'delivering':
      return <Badge className="bg-blue-100 text-blue-700">配送中</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-700">待处理</Badge>;
    default:
      return null;
  }
});

// 指标卡片组件 - memo 化
interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  growth?: number;
  extra?: string;
}

const MetricCard = memo(function MetricCard({ title, value, icon, iconBg, growth, extra }: MetricCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconBg)}>
            {icon}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          {growth !== undefined && (
            <>
              <span className={cn("flex items-center text-sm", growth >= 0 ? "text-green-500" : "text-red-500")}>
                {growth >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : null}
                {growth >= 0 ? '+' : ''}{growth}%
              </span>
              <span className="text-sm text-gray-400">较昨日</span>
            </>
          )}
          {extra && <span className="text-sm text-gray-400">{extra}</span>}
        </div>
      </CardContent>
    </Card>
  );
});

// 快捷入口卡片组件
const QuickActionCard = memo(function QuickActionCard({ 
  icon: Icon, 
  label, 
  path, 
  color 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  path: string; 
  color: string;
}) {
  return (
    <Link
      href={path}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
});

// 预警项组件
const AlertItem = memo(function AlertItem({ alert }: { alert: typeof alerts[0] }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className={cn(
        "w-2 h-2 rounded-full mt-2 shrink-0",
        alert.type === 'warning' ? "bg-orange-500" : "bg-blue-500"
      )} />
      <div className="flex-1 min-w-0">
        <p className="text-sm">{alert.message}</p>
        <p className="text-xs text-gray-400 mt-1">{alert.time}</p>
      </div>
      <Button variant="ghost" size="sm" className="shrink-0">
        查看
      </Button>
    </div>
  );
});

// 销售趋势项组件
const SalesTrendItem = memo(function SalesTrendItem({ 
  item, 
  maxValue, 
  isToday 
}: { 
  item: typeof salesTrend[0]; 
  maxValue: number; 
  isToday: boolean;
}) {
  const percent = (item.value / maxValue) * 100;
  
  return (
    <div className="flex items-center gap-4">
      <div className="w-12 text-sm">
        <p className="font-medium">{item.day}</p>
        <p className="text-xs text-gray-400">{item.date}</p>
      </div>
      <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden relative">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isToday ? "bg-blue-500" : "bg-blue-300"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="w-20 text-right">
        <p className="text-sm font-medium">¥{item.value.toLocaleString()}</p>
      </div>
    </div>
  );
});

// 热销商品项组件
const TopProductItem = memo(function TopProductItem({ item }: { item: typeof topProducts[0] }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
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
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-red-500">¥{item.amount.toFixed(0)}</p>
        <p className={cn(
          "text-xs",
          item.growth > 0 ? "text-green-500" : "text-red-500"
        )}>
          {item.growth > 0 ? '+' : ''}{item.growth}%
        </p>
      </div>
    </div>
  );
});

// 订单行组件
const OrderRow = memo(function OrderRow({ order, onStatusBadge }: { order: typeof recentOrders[0]; onStatusBadge: (status: string) => React.ReactNode }) {
  return (
    <tr className="border-b last:border-0 hover:bg-gray-50">
      <td className="py-3 px-4">
        <span className="text-sm font-medium">{order.id}</span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-gray-500">{order.time}</span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm">{order.items}件</span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm font-medium text-red-500">¥{order.amount.toFixed(2)}</span>
      </td>
      <td className="py-3 px-4">
        {onStatusBadge(order.status)}
      </td>
      <td className="py-3 px-4 text-right">
        <Button variant="ghost" size="sm">查看</Button>
      </td>
    </tr>
  );
});

export default function StoreAdminDashboard() {
  const [dateRange, setDateRange] = useState('today');

  // 使用 useMemo 缓存 maxValue 计算
  const maxSalesValue = useMemo(() => {
    return Math.max(...salesTrend.map(s => s.value));
  }, []);

  // 缓存欢迎语
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }, []);

  // 缓存格式化日期
  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* 欢迎语和时间选择 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{greeting}，张店长 👋</h1>
          <p className="text-gray-500 mt-1">
            今日营业数据一览 · {formattedDate}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">今日</SelectItem>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/store-admin/app-download">
              <Download className="h-4 w-4 mr-2" />
              下载APP
            </Link>
          </Button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="营业额"
          value={`¥${todayStats.sales.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6 text-blue-500" />}
          iconBg="bg-blue-100"
          growth={todayStats.salesGrowth}
        />
        <MetricCard
          title="订单数"
          value={String(todayStats.orders)}
          icon={<ShoppingCart className="h-6 w-6 text-orange-500" />}
          iconBg="bg-orange-100"
          growth={todayStats.ordersGrowth}
        />
        <MetricCard
          title="客流量"
          value={String(todayStats.customers)}
          icon={<Users className="h-6 w-6 text-green-500" />}
          iconBg="bg-green-100"
          growth={todayStats.customersGrowth}
        />
        <MetricCard
          title="客单价"
          value={`¥${todayStats.avgTicket.toFixed(2)}`}
          icon={<Package className="h-6 w-6 text-purple-500" />}
          iconBg="bg-purple-100"
          extra="会员占比 68%"
        />
      </div>

      {/* 快捷入口和预警 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 快捷入口 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">快捷入口</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <QuickActionCard key={action.path} {...action} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 预警通知 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                预警通知
              </CardTitle>
              <Badge variant="secondary">{alerts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 销售趋势和热销商品 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 销售趋势 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">近7日销售趋势</CardTitle>
              <Button variant="ghost" size="sm">
                查看详情
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesTrend.map((item, index) => (
                <SalesTrendItem 
                  key={item.day} 
                  item={item} 
                  maxValue={maxSalesValue}
                  isToday={index === salesTrend.length - 1}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 热销商品 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">热销商品TOP5</CardTitle>
              <Button variant="ghost" size="sm">
                查看更多
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((item) => (
                <TopProductItem key={item.rank} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近订单 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">最近订单</CardTitle>
            <Link href="/store-admin/orders">
              <Button variant="ghost" size="sm">
                查看全部
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">订单号</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">商品数</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">金额</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <OrderRow 
                    key={order.id} 
                    order={order} 
                    onStatusBadge={(status) => <StatusBadge status={status} />}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
