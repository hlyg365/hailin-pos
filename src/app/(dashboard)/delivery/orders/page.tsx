'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  Settings,
  Link as LinkIcon,
  Unlink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Package,
  ShoppingCart,
  Store,
  Smartphone,
  Wifi,
  WifiOff,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Power,
  PowerOff,
  Copy,
  Download,
  Upload,
  MapPin,
  Phone,
  User,
  DollarSign,
  TrendingUp,
  BarChart3,
  Printer,
  MessageSquare,
  PhoneCall,
  AlertTriangle,
  Check,
  X,
  Zap,
} from 'lucide-react';

// 外卖平台类型 - 扩展支持更多平台
type PlatformType = 'meituan' | 'eleme' | 'jddj' | 'jdwm' | 'taobao' | 'douyin' | 'custom';

// 订单状态
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'completed' | 'cancelled';

// 外卖订单
interface DeliveryOrder {
  id: string;
  platformOrderNo: string;
  platform: PlatformType;
  platformName: string;
  status: OrderStatus;
  orderType: 'delivery' | 'pickup';
  // 顾客信息
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  remark?: string;
  // 商品信息
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  // 金额
  totalAmount: number;
  deliveryFee: number;
  packageFee: number;
  discount: number;
  payAmount: number;
  // 时间
  orderTime: string;
  expectTime?: string;
  acceptTime?: string;
  completeTime?: string;
  // 配送
  riderName?: string;
  riderPhone?: string;
  // 同步状态
  synced: boolean;
  syncedAt?: string;
  // 打印状态
  printed: boolean;
  printTime?: string;
}

// 平台配置
const platformConfigs: Record<PlatformType, { name: string; logo: string; color: string }> = {
  meituan: { name: '美团外卖', logo: '🟡', color: 'text-yellow-600' },
  eleme: { name: '饿了么', logo: '🔵', color: 'text-blue-600' },
  jddj: { name: '京东到家', logo: '🔴', color: 'text-red-600' },
  jdwm: { name: '京东外卖', logo: '🟠', color: 'text-orange-600' },
  taobao: { name: '淘宝闪购', logo: '🟣', color: 'text-purple-600' },
  douyin: { name: '抖音外卖', logo: '⚫', color: 'text-gray-800' },
  custom: { name: '自定义平台', logo: '⚪', color: 'text-gray-600' },
};

// 订单状态配置
const orderStatusConfig: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: '待接单', color: 'bg-yellow-500' },
  confirmed: { label: '已接单', color: 'bg-blue-500' },
  preparing: { label: '备货中', color: 'bg-purple-500' },
  delivering: { label: '配送中', color: 'bg-orange-500' },
  completed: { label: '已完成', color: 'bg-green-500' },
  cancelled: { label: '已取消', color: 'bg-gray-500' },
};

export default function DeliveryOrdersPage() {
  // 外卖订单列表
  const [orders, setOrders] = useState<DeliveryOrder[]>([
    // 美团外卖订单
    {
      id: 'order_001',
      platformOrderNo: 'MT2026031700001',
      platform: 'meituan',
      platformName: '美团外卖',
      status: 'preparing',
      orderType: 'delivery',
      customerName: '张先生',
      customerPhone: '138****8001',
      deliveryAddress: '深圳市南山区海邻小区A栋301',
      remark: '请放门口，谢谢',
      items: [
        { name: '进口香蕉 500g', quantity: 2, price: 5.9 },
        { name: '纯牛奶 250ml*12', quantity: 1, price: 35.9 },
      ],
      totalAmount: 47.70,
      deliveryFee: 0,
      packageFee: 2,
      discount: 5,
      payAmount: 44.70,
      orderTime: '2026-03-17 11:30:45',
      expectTime: '2026-03-17 12:15:00',
      acceptTime: '2026-03-17 11:31:20',
      synced: true,
      syncedAt: '2026-03-17 11:30:46',
      printed: true,
      printTime: '2026-03-17 11:31:25',
    },
    {
      id: 'order_002',
      platformOrderNo: 'MT2026031700002',
      platform: 'meituan',
      platformName: '美团外卖',
      status: 'delivering',
      orderType: 'delivery',
      customerName: '王先生',
      customerPhone: '137****8003',
      deliveryAddress: '深圳市南山区海邻小区C栋102',
      remark: '',
      items: [
        { name: '可乐 330ml', quantity: 6, price: 3.5 },
        { name: '薯片原味 100g', quantity: 2, price: 8.9 },
      ],
      totalAmount: 38.80,
      deliveryFee: 5,
      packageFee: 0,
      discount: 3,
      payAmount: 40.80,
      orderTime: '2026-03-17 10:15:30',
      expectTime: '2026-03-17 11:00:00',
      acceptTime: '2026-03-17 10:16:00',
      riderName: '赵师傅',
      riderPhone: '136****9001',
      synced: true,
      syncedAt: '2026-03-17 10:15:31',
      printed: true,
      printTime: '2026-03-17 10:16:05',
    },
    // 饿了么订单
    {
      id: 'order_003',
      platformOrderNo: 'EL2026031700123',
      platform: 'eleme',
      platformName: '饿了么',
      status: 'pending',
      orderType: 'delivery',
      customerName: '李女士',
      customerPhone: '139****8002',
      deliveryAddress: '深圳市南山区科技园B栋502',
      remark: '不要辣',
      items: [
        { name: '有机西红柿 500g', quantity: 1, price: 6.5 },
        { name: '土鸡蛋 30枚', quantity: 1, price: 28.0 },
        { name: '精选五花肉 500g', quantity: 1, price: 32.0 },
      ],
      totalAmount: 66.50,
      deliveryFee: 3,
      packageFee: 2,
      discount: 0,
      payAmount: 71.50,
      orderTime: '2026-03-17 11:42:10',
      expectTime: '2026-03-17 12:30:00',
      synced: true,
      syncedAt: '2026-03-17 11:42:11',
      printed: false,
    },
    {
      id: 'order_004',
      platformOrderNo: 'EL2026031700124',
      platform: 'eleme',
      platformName: '饿了么',
      status: 'pending',
      orderType: 'delivery',
      customerName: '刘女士',
      customerPhone: '135****8005',
      deliveryAddress: '深圳市南山区海邻小区D栋201',
      remark: '尽快送达',
      items: [
        { name: '新鲜草莓 500g', quantity: 1, price: 25.0 },
        { name: '酸奶 200ml*6', quantity: 1, price: 18.0 },
      ],
      totalAmount: 43.00,
      deliveryFee: 0,
      packageFee: 2,
      discount: 5,
      payAmount: 40.00,
      orderTime: '2026-03-17 11:48:00',
      expectTime: '2026-03-17 12:35:00',
      synced: true,
      syncedAt: '2026-03-17 11:48:01',
      printed: false,
    },
    // 京东到家订单
    {
      id: 'order_005',
      platformOrderNo: 'JDDJ2026031700089',
      platform: 'jddj',
      platformName: '京东到家',
      status: 'completed',
      orderType: 'pickup',
      customerName: '陈女士',
      customerPhone: '136****8004',
      remark: '到店自取',
      items: [
        { name: '精品苹果 1kg', quantity: 2, price: 18.9 },
      ],
      totalAmount: 37.80,
      deliveryFee: 0,
      packageFee: 0,
      discount: 2,
      payAmount: 35.80,
      orderTime: '2026-03-17 09:20:00',
      expectTime: '2026-03-17 09:45:00',
      acceptTime: '2026-03-17 09:20:30',
      completeTime: '2026-03-17 09:42:15',
      synced: true,
      syncedAt: '2026-03-17 09:20:01',
      printed: true,
      printTime: '2026-03-17 09:20:35',
    },
    // 京东外卖订单
    {
      id: 'order_006',
      platformOrderNo: 'JDWM2026031700012',
      platform: 'jdwm',
      platformName: '京东外卖',
      status: 'confirmed',
      orderType: 'delivery',
      customerName: '周先生',
      customerPhone: '134****8006',
      deliveryAddress: '深圳市南山区海邻小区E栋1501',
      remark: '按门铃',
      items: [
        { name: '进口橙子 1kg', quantity: 1, price: 22.0 },
        { name: '面包 2个', quantity: 2, price: 8.5 },
      ],
      totalAmount: 39.00,
      deliveryFee: 0,
      packageFee: 1,
      discount: 0,
      payAmount: 40.00,
      orderTime: '2026-03-17 11:35:00',
      expectTime: '2026-03-17 12:20:00',
      acceptTime: '2026-03-17 11:35:30',
      synced: true,
      syncedAt: '2026-03-17 11:35:01',
      printed: true,
      printTime: '2026-03-17 11:35:35',
    },
    // 淘宝闪购订单
    {
      id: 'order_007',
      platformOrderNo: 'TB2026031700567',
      platform: 'taobao',
      platformName: '淘宝闪购',
      status: 'pending',
      orderType: 'delivery',
      customerName: '吴女士',
      customerPhone: '133****8007',
      deliveryAddress: '深圳市南山区科技园E栋303',
      remark: '下午3点后配送',
      items: [
        { name: '有机蔬菜套餐', quantity: 1, price: 45.0 },
        { name: '鸡蛋 30枚', quantity: 1, price: 28.0 },
      ],
      totalAmount: 73.00,
      deliveryFee: 0,
      packageFee: 2,
      discount: 8,
      payAmount: 67.00,
      orderTime: '2026-03-17 11:50:00',
      expectTime: '2026-03-17 15:30:00',
      synced: true,
      syncedAt: '2026-03-17 11:50:01',
      printed: false,
    },
    // 抖音外卖订单
    {
      id: 'order_008',
      platformOrderNo: 'DY2026031700089',
      platform: 'douyin',
      platformName: '抖音外卖',
      status: 'preparing',
      orderType: 'delivery',
      customerName: '郑先生',
      customerPhone: '132****8008',
      deliveryAddress: '深圳市南山区海邻小区F栋801',
      remark: '看直播下单',
      items: [
        { name: '网红零食大礼包', quantity: 1, price: 68.0 },
      ],
      totalAmount: 68.00,
      deliveryFee: 5,
      packageFee: 0,
      discount: 10,
      payAmount: 63.00,
      orderTime: '2026-03-17 10:45:00',
      expectTime: '2026-03-17 11:30:00',
      acceptTime: '2026-03-17 10:45:30',
      synced: true,
      syncedAt: '2026-03-17 10:45:01',
      printed: true,
      printTime: '2026-03-17 10:45:35',
    },
  ]);

  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 当前时间状态（用于计算超时状态，避免在渲染期间调用Date.now()）
  const [currentTime, setCurrentTime] = useState(0);
  
  // 初始化和定时更新当前时间
  useEffect(() => {
    // 立即更新时间
    const updateTime = () => setCurrentTime(Date.now());
    updateTime();
    const timer = setInterval(updateTime, 60000); // 每分钟更新一次
    return () => clearInterval(timer);
  }, []);

  // 统计数据
  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing' || o.status === 'confirmed').length,
    delivering: orders.filter(o => o.status === 'delivering').length,
    today: orders.filter(o => o.status !== 'cancelled').length,
    todayAmount: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.payAmount, 0),
    // 按平台统计
    byPlatform: {
      meituan: orders.filter(o => o.platform === 'meituan' && o.status !== 'cancelled').length,
      eleme: orders.filter(o => o.platform === 'eleme' && o.status !== 'cancelled').length,
      jddj: orders.filter(o => o.platform === 'jddj' && o.status !== 'cancelled').length,
      jdwm: orders.filter(o => o.platform === 'jdwm' && o.status !== 'cancelled').length,
      taobao: orders.filter(o => o.platform === 'taobao' && o.status !== 'cancelled').length,
      douyin: orders.filter(o => o.platform === 'douyin' && o.status !== 'cancelled').length,
    },
  };

  // 过滤订单
  const filteredOrders = orders.filter(order => {
    const matchesPlatform = platformFilter === 'all' || order.platform === platformFilter;
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = !searchKeyword || 
      order.platformOrderNo.includes(searchKeyword) ||
      order.customerName.includes(searchKeyword) ||
      order.customerPhone.includes(searchKeyword);
    return matchesPlatform && matchesStatus && matchesSearch;
  });

  // 查看订单详情
  const handleViewOrder = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setOrderDialogOpen(true);
  };

  // 接单
  const handleAcceptOrder = (order: DeliveryOrder) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setOrders(orders.map(o => 
      o.id === order.id 
        ? { ...o, status: 'confirmed' as OrderStatus, acceptTime: now, printed: true, printTime: now } 
        : o
    ));
    setOrderDialogOpen(false);
    alert(`已接单，配送单已自动打印`);
  };

  // 拒绝订单
  const handleRejectOrder = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setRejectDialogOpen(true);
  };

  // 确认拒绝
  const confirmReject = () => {
    if (selectedOrder) {
      setOrders(orders.map(o => 
        o.id === selectedOrder.id 
          ? { ...o, status: 'cancelled' as OrderStatus } 
          : o
      ));
    }
    setRejectDialogOpen(false);
    setRejectReason('');
  };

  // 开始备货
  const handleStartPreparing = (order: DeliveryOrder) => {
    setOrders(orders.map(o => 
      o.id === order.id 
        ? { ...o, status: 'preparing' as OrderStatus } 
        : o
    ));
    setOrderDialogOpen(false);
  };

  // 开始配送
  const handleStartDelivery = (order: DeliveryOrder) => {
    setOrders(orders.map(o => 
      o.id === order.id 
        ? { ...o, status: 'delivering' as OrderStatus } 
        : o
    ));
    setOrderDialogOpen(false);
  };

  // 完成订单
  const handleCompleteOrder = (order: DeliveryOrder) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setOrders(orders.map(o => 
      o.id === order.id 
        ? { ...o, status: 'completed' as OrderStatus, completeTime: now } 
        : o
    ));
    setOrderDialogOpen(false);
  };

  // 打印配送单
  const handlePrintOrder = (order: DeliveryOrder) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setOrders(orders.map(o => 
      o.id === order.id 
        ? { ...o, printed: true, printTime: now } 
        : o
    ));
    alert('配送单已发送到打印机');
  };

  // 批量接单
  const handleBatchAccept = () => {
    const pendingOrders = orders.filter(o => o.status === 'pending');
    if (pendingOrders.length === 0) {
      alert('没有待接单的订单');
      return;
    }
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setOrders(orders.map(o => 
      o.status === 'pending' 
        ? { ...o, status: 'confirmed' as OrderStatus, acceptTime: now, printed: true, printTime: now } 
        : o
    ));
    alert(`已批量接单 ${pendingOrders.length} 个订单`);
  };

  // 刷新订单
  const handleRefresh = () => {
    alert('正在同步各平台最新订单...');
  };

  // 获取订单状态徽章
  const getOrderStatusBadge = (status: OrderStatus) => {
    const config = orderStatusConfig[status];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // 计算超时状态
  const getOrderTimeout = (order: DeliveryOrder) => {
    if (order.status !== 'pending') return null;
    const orderTime = new Date(order.orderTime).getTime();
    const diffMinutes = Math.floor((currentTime - orderTime) / 1000 / 60);
    if (diffMinutes > 10) return { status: 'danger', text: '超时' };
    if (diffMinutes > 5) return { status: 'warning', text: '即将超时' };
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="外卖订单" description="管理来自各外卖平台的订单">
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新订单
        </Button>
        {stats.pending > 0 && (
          <Button onClick={handleBatchAccept}>
            <Check className="h-4 w-4 mr-2" />
            批量接单 ({stats.pending})
          </Button>
        )}
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                    <p className="text-sm text-yellow-600">待接单</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.preparing}</p>
                    <p className="text-sm text-muted-foreground">备货中</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Truck className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.delivering}</p>
                    <p className="text-sm text-muted-foreground">配送中</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.today}</p>
                    <p className="text-sm text-muted-foreground">今日订单</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">¥{stats.todayAmount.toFixed(0)}</p>
                    <p className="text-sm text-muted-foreground">今日销售额</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 各平台订单统计 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">各平台今日订单</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {Object.entries(stats.byPlatform).map(([platform, count]) => {
                  const config = platformConfigs[platform as PlatformType];
                  return (
                    <div key={platform} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-2xl">{config.logo}</span>
                      <div>
                        <p className="font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground">{config.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 订单列表 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>订单列表</CardTitle>
                  <CardDescription>来自各外卖平台的订单，支持接单、备货、配送管理</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 筛选条件 */}
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="搜索订单号/顾客/电话"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="max-w-64"
                />
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="选择平台" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部平台</SelectItem>
                    {Object.entries(platformConfigs).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{config.logo}</span>
                          <span>{config.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="订单状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">待接单</SelectItem>
                    <SelectItem value="confirmed">已接单</SelectItem>
                    <SelectItem value="preparing">备货中</SelectItem>
                    <SelectItem value="delivering">配送中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单信息</TableHead>
                    <TableHead>顾客信息</TableHead>
                    <TableHead>商品</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>下单时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => {
                    const timeout = getOrderTimeout(order);
                    const platformConfig = platformConfigs[order.platform];
                    return (
                      <TableRow key={order.id} className={timeout?.status === 'danger' ? 'bg-red-50' : ''}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{platformConfig.logo}</span>
                              <span className="font-medium">{order.platformOrderNo}</span>
                              {timeout && (
                                <Badge className={timeout.status === 'danger' ? 'bg-red-500' : 'bg-orange-500'}>
                                  {timeout.text}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{order.platformName}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {order.orderType === 'delivery' ? '配送' : '自取'}
                              </Badge>
                              {order.printed && (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                                  已打印
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span>{order.customerName}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{order.customerPhone}</span>
                            </div>
                            {order.deliveryAddress && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-32">{order.deliveryAddress}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {order.items.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="text-sm">
                                {item.name} x{item.quantity}
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{order.items.length - 2} 件商品
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-bold">¥{order.payAmount.toFixed(2)}</p>
                            {order.discount > 0 && (
                              <p className="text-xs text-green-600">优惠 ¥{order.discount}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">{order.orderTime}</p>
                            {order.expectTime && (
                              <p className="text-xs text-muted-foreground">
                                预计：{order.expectTime.split(' ')[1]}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {order.status === 'pending' && (
                              <>
                                <Button size="sm" onClick={() => handleAcceptOrder(order)}>
                                  接单
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleRejectOrder(order)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {order.status === 'confirmed' && (
                              <Button size="sm" onClick={() => handleStartPreparing(order)}>
                                备货
                              </Button>
                            )}
                            {order.status === 'preparing' && (
                              <Button size="sm" onClick={() => handleStartDelivery(order)}>
                                配送
                              </Button>
                            )}
                            {order.status === 'delivering' && (
                              <Button size="sm" onClick={() => handleCompleteOrder(order)}>
                                完成
                              </Button>
                            )}
                            {!order.printed && order.status !== 'cancelled' && order.status !== 'completed' && (
                              <Button variant="outline" size="sm" onClick={() => handlePrintOrder(order)}>
                                <Printer className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 订单详情对话框 */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedOrder && platformConfigs[selectedOrder.platform].logo}</span>
              外卖订单详情
              {selectedOrder && getOrderStatusBadge(selectedOrder.status)}
            </DialogTitle>
            <DialogDescription>
              订单号：{selectedOrder?.platformOrderNo} ({selectedOrder?.platformName})
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4 py-4">
              {/* 顾客信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">顾客信息</Label>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedOrder.customerPhone}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">配送方式</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {selectedOrder.orderType === 'delivery' ? '配送上门' : '到店自取'}
                    </Badge>
                    {selectedOrder.printed && (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        已打印
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {selectedOrder.deliveryAddress && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">配送地址</Label>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{selectedOrder.deliveryAddress}</span>
                  </div>
                </div>
              )}

              {/* 商品列表 */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">商品明细</Label>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span>{item.name} x{item.quantity}</span>
                      <span>¥{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 金额明细 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>商品总额</span>
                    <span>¥{selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                  {selectedOrder.deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span>配送费</span>
                      <span>¥{selectedOrder.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.packageFee > 0 && (
                    <div className="flex justify-between">
                      <span>包装费</span>
                      <span>¥{selectedOrder.packageFee.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>优惠</span>
                      <span>-¥{selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>实付金额</span>
                    <span className="text-red-600">¥{selectedOrder.payAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* 时间信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">下单时间：</span>
                  <span>{selectedOrder.orderTime}</span>
                </div>
                {selectedOrder.expectTime && (
                  <div>
                    <span className="text-muted-foreground">预计送达：</span>
                    <span>{selectedOrder.expectTime}</span>
                  </div>
                )}
              </div>

              {/* 配送员信息 */}
              {selectedOrder.riderName && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Label className="text-muted-foreground">配送员</Label>
                  <div className="flex items-center justify-between mt-1">
                    <span>{selectedOrder.riderName} {selectedOrder.riderPhone}</span>
                    <Button variant="outline" size="sm">联系配送员</Button>
                  </div>
                </div>
              )}

              {/* 备注 */}
              {selectedOrder.remark && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <Label className="text-muted-foreground">备注</Label>
                  <p className="mt-1 text-orange-700">{selectedOrder.remark}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>关闭</Button>
            {selectedOrder && !selectedOrder.printed && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
              <Button variant="outline" onClick={() => selectedOrder && handlePrintOrder(selectedOrder)}>
                <Printer className="h-4 w-4 mr-2" />
                打印配送单
              </Button>
            )}
            {selectedOrder?.status === 'pending' && (
              <>
                <Button variant="outline" onClick={() => selectedOrder && handleRejectOrder(selectedOrder)}>
                  拒绝
                </Button>
                <Button onClick={() => selectedOrder && handleAcceptOrder(selectedOrder)}>
                  接单
                </Button>
              </>
            )}
            {selectedOrder?.status === 'confirmed' && (
              <Button onClick={() => selectedOrder && handleStartPreparing(selectedOrder)}>
                开始备货
              </Button>
            )}
            {selectedOrder?.status === 'preparing' && (
              <Button onClick={() => selectedOrder && handleStartDelivery(selectedOrder)}>
                开始配送
              </Button>
            )}
            {selectedOrder?.status === 'delivering' && (
              <Button onClick={() => selectedOrder && handleCompleteOrder(selectedOrder)}>
                确认完成
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 拒绝订单对话框 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝订单</DialogTitle>
            <DialogDescription>
              请选择拒绝原因，平台将通知顾客
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>拒绝原因</Label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger>
                  <SelectValue placeholder="选择拒绝原因" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="out_of_stock">商品库存不足</SelectItem>
                  <SelectItem value="shop_busy">店铺繁忙</SelectItem>
                  <SelectItem value="area_unavailable">超出配送范围</SelectItem>
                  <SelectItem value="weather">天气原因</SelectItem>
                  <SelectItem value="other">其他原因</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={confirmReject}>确认拒绝</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
