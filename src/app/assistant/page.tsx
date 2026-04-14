'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ScanLine,
  ShoppingCart,
  BarChart3,
  Package,
  FileText,
  Megaphone,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  Bell,
  QrCode,
  ClipboardList,
  ShoppingBag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// 快捷功能配置
const quickActions = [
  { icon: ScanLine, label: '库存盘点', path: '/assistant/inventory/stocktake', color: 'bg-orange-500' },
  { icon: QrCode, label: '扫码查询', path: '/assistant/inventory/scan', color: 'bg-blue-500' },
  { icon: FileText, label: '采购申请', path: '/assistant/purchase', color: 'bg-green-500' },
  { icon: Megaphone, label: '促销申请', path: '/assistant/promotion', color: 'bg-purple-500' },
];

// 管理功能配置
const managementItems = [
  { icon: ShoppingCart, label: '移动收银', path: '/assistant/cashier', desc: '快速收银结账' },
  { icon: BarChart3, label: '数据报表', path: '/assistant/reports', desc: '销售、客流分析' },
  { icon: Package, label: '库存管理', path: '/assistant/inventory', desc: '库存查询、预警' },
  { icon: ClipboardList, label: '订单查询', path: '/assistant/orders', desc: '销售订单记录' },
  { icon: ShoppingBag, label: '商品管理', path: '/assistant/products', desc: '商品信息维护' },
  { icon: Users, label: '会员管理', path: '/assistant/members', desc: '会员信息查询' },
];

// 模拟数据
const todayData = {
  sales: 12856.50,
  orders: 89,
  customers: 156,
  avgTicket: 144.57,
  growth: 12.5,
};

const alerts = [
  { id: 1, type: 'warning', message: '可口可乐库存不足，仅剩12件', time: '10分钟前' },
  { id: 2, type: 'info', message: '有3笔待审批的采购申请', time: '1小时前' },
  { id: 3, type: 'warning', message: '农夫山泉临期预警，剩余15天', time: '2小时前' },
];

export default function AssistantHomePage() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '上午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  return (
    <div className="p-4 space-y-4">
      {/* 今日数据概览 */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>今日营业数据</span>
            <span className="text-xs font-normal text-white/80">
              {currentTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/60 text-xs">营业额</p>
              <p className="text-2xl font-bold">¥{todayData.sales.toLocaleString()}</p>
              <div className="flex items-center gap-1 text-xs text-green-300">
                <TrendingUp className="h-3 w-3" />
                <span>较昨日 +{todayData.growth}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-white/60 text-xs">订单数</p>
                <p className="text-lg font-bold">{todayData.orders}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">客流量</p>
                <p className="text-lg font-bold">{todayData.customers}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">客单价</p>
                <p className="text-lg font-bold">¥{todayData.avgTicket.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">会员占比</p>
                <p className="text-lg font-bold">68%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 快捷功能 */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">快捷功能</h3>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => router.push(action.path)}
                className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg shadow-sm hover:shadow transition-shadow"
              >
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white", action.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs text-gray-600">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 预警通知 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-500" />
              预警通知
            </span>
            <Badge variant="secondary" className="text-xs">{alerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-2 rounded-lg bg-gray-50"
            >
              <AlertTriangle className={cn(
                "h-4 w-4 mt-0.5 shrink-0",
                alert.type === 'warning' ? "text-orange-500" : "text-blue-500"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{alert.message}</p>
                <p className="text-xs text-gray-400">{alert.time}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 管理功能 */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">管理功能</h3>
        <Card className="divide-y">
          {managementItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </button>
            );
          })}
        </Card>
      </div>

      {/* 底部安全提示 */}
      <p className="text-center text-xs text-gray-400 py-2">
        海邻到家 · 安全可信赖的社区便利店
      </p>
    </div>
  );
}
