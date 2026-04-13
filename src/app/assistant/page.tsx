'use client';

import { useState, useEffect, useCallback } from 'react';
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
  ShoppingBag,
  RefreshCw,
  Clock,
  Wifi,
  WifiOff,
  LogOut,
  Settings,
  HelpCircle,
  Info,
  Sun,
  Moon,
  ChevronLeft,
  WifiOffIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// 快捷功能配置
const quickActions = [
  { icon: ScanLine, label: '库存盘点', path: '/assistant/inventory/stocktake', color: 'from-orange-400 to-orange-500' },
  { icon: QrCode, label: '扫码查询', path: '/assistant/inventory/scan', color: 'from-blue-400 to-blue-500' },
  { icon: FileText, label: '采购申请', path: '/assistant/purchase', color: 'from-green-400 to-green-500' },
  { icon: Megaphone, label: '促销申请', path: '/assistant/promotion', color: 'from-purple-400 to-purple-500' },
];

// 管理功能配置
const managementItems = [
  { icon: ShoppingCart, label: '移动收银', path: '/assistant/cashier', desc: '快速收银结账', badge: '常用', badgeColor: 'bg-orange-500' },
  { icon: BarChart3, label: '数据报表', path: '/assistant/reports', desc: '销售、客流分析', badge: '新', badgeColor: 'bg-green-500' },
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
  { id: 1, type: 'warning', message: '可口可乐库存不足，仅剩12件', time: '10分钟前', category: '库存' },
  { id: 2, type: 'info', message: '有3笔待审批的采购申请', time: '1小时前', category: '审批' },
  { id: 3, type: 'warning', message: '农夫山泉临期预警，剩余15天', time: '2小时前', category: '临期' },
  { id: 4, type: 'success', message: '昨日促销申请已通过', time: '3小时前', category: '促销' },
];

export default function AssistantHomePage() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [showMoreAlerts, setShowMoreAlerts] = useState(false);
  const [user, setUser] = useState({ name: '张店长', store: '海邻到家·阳光店' });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    // 网络状态检测
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getGreeting = useCallback(() => {
    const hour = currentTime.getHours();
    if (hour < 9) return { text: '早上好', icon: Moon };
    if (hour < 12) return { text: '上午好', icon: Sun };
    if (hour < 14) return { text: '中午好', icon: Sun };
    if (hour < 18) return { text: '下午好', icon: Sun };
    return { text: '晚上好', icon: Moon };
  }, [currentTime]);

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 顶部背景 */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 px-4 pb-8 pt-12">
        {/* 状态栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-white">
              <AvatarFallback className="bg-white text-orange-500 font-bold text-lg">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="text-white">
              <p className="text-sm opacity-80">{greeting.text}，</p>
              <h1 className="font-bold text-lg">{user.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 网络状态 */}
            <div className={cn(
              "px-2 py-1 rounded-full text-xs flex items-center gap-1",
              isOnline ? "bg-white/20 text-white" : "bg-red-500/80 text-white"
            )}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? '在线' : '离线'}
            </div>
            {/* 设置按钮 */}
            <button 
              onClick={() => router.push('/assistant/profile')}
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* 店铺信息 */}
        <div className="flex items-center gap-2 text-white/90 text-sm">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Package className="w-3 h-3" />
          </div>
          <span>{user.store}</span>
        </div>

        {/* 今日数据概览 */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/15 backdrop-blur rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/70 text-xs">今日营业额</span>
              <TrendingUp className="w-4 h-4 text-green-300" />
            </div>
            <p className="text-2xl font-bold text-white">¥{todayData.sales.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-green-300 text-xs">↑ {todayData.growth}%</span>
              <span className="text-white/60 text-xs">较昨日</span>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/70 text-xs">订单数</span>
              <ShoppingCart className="w-4 h-4 text-white/70" />
            </div>
            <p className="text-2xl font-bold text-white">{todayData.orders}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-white/60 text-xs">客单价 ¥{todayData.avgTicket.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="px-4 -mt-4">
        {/* 快捷功能 */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-1 h-4 bg-orange-500 rounded-full" />
              快捷功能
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.path}
                    onClick={() => router.push(action.path)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all"
                  >
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-md",
                      action.color
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-slate-700 font-medium">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 预警通知 */}
        <Card className="mt-4 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-orange-500 rounded-full" />
                <span>预警通知</span>
                <Badge className="bg-red-500 text-white text-xs">{alerts.length}</Badge>
              </div>
              <button 
                onClick={() => setShowMoreAlerts(true)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                查看全部
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 3).map((alert) => (
              <div 
                key={alert.id} 
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl",
                  alert.type === 'warning' ? 'bg-orange-50' : 
                  alert.type === 'success' ? 'bg-green-50' : 'bg-blue-50'
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  alert.type === 'warning' ? 'bg-orange-100 text-orange-500' : 
                  alert.type === 'success' ? 'bg-green-100 text-green-500' : 'bg-blue-100 text-blue-500'
                )}>
                  {alert.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                   alert.type === 'success' ? <TrendingUp className="w-4 h-4" /> :
                   <Bell className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    alert.type === 'warning' ? 'text-orange-700' : 
                    alert.type === 'success' ? 'text-green-700' : 'text-blue-700'
                  )}>
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className="text-[10px] py-0 px-1.5" variant="outline">{alert.category}</Badge>
                    <span className="text-[10px] text-slate-400">{alert.time}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 管理功能 */}
        <Card className="mt-4 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-1 h-4 bg-orange-500 rounded-full" />
              日常管理
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {managementItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{item.label}</span>
                      {item.badge && (
                        <Badge className={cn("text-[10px] py-0 text-white", item.badgeColor)}>
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* 底部留白 */}
        <div className="h-6" />
      </div>

      {/* 预警通知弹窗 */}
      <Dialog open={showMoreAlerts} onOpenChange={setShowMoreAlerts}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              预警通知 ({alerts.length})
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 -mx-4 px-4">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl",
                  alert.type === 'warning' ? 'bg-orange-50' : 
                  alert.type === 'success' ? 'bg-green-50' : 'bg-blue-50'
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  alert.type === 'warning' ? 'bg-orange-100 text-orange-500' : 
                  alert.type === 'success' ? 'bg-green-100 text-green-500' : 'bg-blue-100 text-blue-500'
                )}>
                  {alert.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                   alert.type === 'success' ? <TrendingUp className="w-5 h-5" /> :
                   <Bell className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "font-medium",
                    alert.type === 'warning' ? 'text-orange-800' : 
                    alert.type === 'success' ? 'text-green-800' : 'text-blue-800'
                  )}>
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="text-[10px] py-0" variant="outline">{alert.category}</Badge>
                    <span className="text-xs text-slate-400">{alert.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
