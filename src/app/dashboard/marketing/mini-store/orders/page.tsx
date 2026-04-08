'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  ShoppingBag,
  Phone,
  MapPin,
  User,
  Calendar,
  CreditCard,
  Package,
  AlertCircle,
  Store,
  Navigation,
  RefreshCw,
  Box,
  TrendingDown,
} from 'lucide-react';

// 订单状态类型
type OrderStatus = 'pending' | 'paid' | 'preparing' | 'delivering' | 'completed' | 'cancelled' | 'refunded';

// 库存扣减记录
interface StockDeduction {
  productId: string;
  productName: string;
  quantity: number;
  beforeStock: number;
  afterStock: number;
  deductedAt: string;
}

// 订单数据类型
interface Order {
  id: string;
  orderNo: string;
  customer: {
    name: string;
    phone: string;
    avatar: string;
    latitude?: number;
    longitude?: number;
  };
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  payAmount: number;
  discount: number;
  status: OrderStatus;
  paymentMethod: string;
  // 关联店铺
  storeId: string;
  storeName: string;
  storeAddress: string;
  distance?: number; // 距离店铺距离（公里）
  // 配送信息
  deliveryAddress: string;
  deliveryFee: number;
  estimatedTime: number; // 预计送达时间（分钟）
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  remark: string;
  // 时间记录
  createTime: string;
  payTime?: string;
  preparingTime?: string;
  deliveryTime?: string;
  completeTime?: string;
  // 库存扣减
  stockDeducted: boolean;
  stockDeductions?: StockDeduction[];
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待付款', color: 'bg-yellow-500', icon: <Clock className="h-4 w-4" /> },
  paid: { label: '已付款', color: 'bg-blue-500', icon: <CreditCard className="h-4 w-4" /> },
  preparing: { label: '备货中', color: 'bg-purple-500', icon: <Package className="h-4 w-4" /> },
  delivering: { label: '配送中', color: 'bg-orange-500', icon: <Truck className="h-4 w-4" /> },
  completed: { label: '已完成', color: 'bg-green-500', icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: '已取消', color: 'bg-gray-500', icon: <XCircle className="h-4 w-4" /> },
  refunded: { label: '已退款', color: 'bg-red-500', icon: <RefreshCw className="h-4 w-4" /> },
};

// 模拟店铺库存
const storeInventory: Record<string, Record<string, number>> = {
  'store_001': {
    'prod_001': 50, // 进口香蕉 500g
    'prod_002': 30, // 纯牛奶 250ml*12
    'prod_003': 25, // 有机西红柿 500g
    'prod_004': 40, // 土鸡蛋 30枚
    'prod_005': 20, // 精选五花肉 500g
  },
  'store_002': {
    'prod_001': 45,
    'prod_002': 35,
    'prod_003': 20,
    'prod_004': 30,
    'prod_005': 25,
  },
};

export default function MiniStoreOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      orderNo: 'WX202603170001',
      customer: { name: '张三', phone: '138****1234', avatar: '👨', latitude: 22.5325, longitude: 113.9460 },
      items: [
        { id: 'prod_001', name: '进口香蕉 500g', quantity: 2, price: 5.9 },
        { id: 'prod_003', name: '有机西红柿 500g', quantity: 1, price: 6.5 },
        { id: 'prod_002', name: '纯牛奶 250ml*12', quantity: 1, price: 35.9 },
      ],
      totalAmount: 54.2,
      payAmount: 49.2,
      discount: 5.0,
      status: 'delivering',
      paymentMethod: '微信支付',
      storeId: 'store_001',
      storeName: '海邻到家南山店',
      storeAddress: '深圳市南山区科技园南区海邻大厦1楼',
      distance: 0.8,
      deliveryAddress: '深圳市南山区科技园南区海邻小区A栋301',
      deliveryFee: 0,
      estimatedTime: 25,
      riderId: 'rider_001',
      riderName: '张三',
      riderPhone: '138****1234',
      remark: '请放门口，谢谢',
      createTime: '2026-03-17 10:23:45',
      payTime: '2026-03-17 10:24:12',
      preparingTime: '2026-03-17 10:25:00',
      deliveryTime: '2026-03-17 10:35:00',
      stockDeducted: true,
      stockDeductions: [
        { productId: 'prod_001', productName: '进口香蕉 500g', quantity: 2, beforeStock: 52, afterStock: 50, deductedAt: '2026-03-17 10:25:00' },
        { productId: 'prod_003', productName: '有机西红柿 500g', quantity: 1, beforeStock: 26, afterStock: 25, deductedAt: '2026-03-17 10:25:00' },
        { productId: 'prod_002', productName: '纯牛奶 250ml*12', quantity: 1, beforeStock: 31, afterStock: 30, deductedAt: '2026-03-17 10:25:00' },
      ],
    },
    {
      id: '2',
      orderNo: 'WX202603170002',
      customer: { name: '李四', phone: '139****5678', avatar: '👩', latitude: 22.5330, longitude: 113.9470 },
      items: [
        { id: 'prod_004', name: '土鸡蛋 30枚', quantity: 1, price: 28.0 },
        { id: 'prod_005', name: '精选五花肉 500g', quantity: 2, price: 32.0 },
      ],
      totalAmount: 92.0,
      payAmount: 87.4,
      discount: 4.6,
      status: 'preparing',
      paymentMethod: '微信支付',
      storeId: 'store_001',
      storeName: '海邻到家南山店',
      storeAddress: '深圳市南山区科技园南区海邻大厦1楼',
      distance: 1.2,
      deliveryAddress: '深圳市南山区科技园南区海邻小区B栋502',
      deliveryFee: 0,
      estimatedTime: 30,
      remark: '',
      createTime: '2026-03-17 10:45:20',
      payTime: '2026-03-17 10:45:55',
      preparingTime: '2026-03-17 10:46:30',
      stockDeducted: true,
      stockDeductions: [
        { productId: 'prod_004', productName: '土鸡蛋 30枚', quantity: 1, beforeStock: 41, afterStock: 40, deductedAt: '2026-03-17 10:46:30' },
        { productId: 'prod_005', productName: '精选五花肉 500g', quantity: 2, beforeStock: 22, afterStock: 20, deductedAt: '2026-03-17 10:46:30' },
      ],
    },
    {
      id: '3',
      orderNo: 'WX202603170003',
      customer: { name: '王五', phone: '137****9012', avatar: '👴', latitude: 22.5315, longitude: 113.9450 },
      items: [
        { id: 'prod_006', name: '可乐 330ml', quantity: 6, price: 3.5 },
        { id: 'prod_007', name: '薯片原味 100g', quantity: 2, price: 8.9 },
      ],
      totalAmount: 38.8,
      payAmount: 38.8,
      discount: 0,
      status: 'paid',
      paymentMethod: '支付宝',
      storeId: 'store_001',
      storeName: '海邻到家南山店',
      storeAddress: '深圳市南山区科技园南区海邻大厦1楼',
      distance: 0.5,
      deliveryAddress: '深圳市南山区科技园南区海邻小区C栋102',
      deliveryFee: 5,
      estimatedTime: 20,
      remark: '快点送，孩子等着吃',
      createTime: '2026-03-17 11:02:33',
      payTime: '2026-03-17 11:03:01',
      stockDeducted: false,
    },
    {
      id: '4',
      orderNo: 'WX202603170004',
      customer: { name: '赵六', phone: '136****3456', avatar: '👨‍💼', latitude: 22.5340, longitude: 113.9480 },
      items: [
        { id: 'prod_008', name: '进口橙子 1kg', quantity: 2, price: 15.9 },
        { id: 'prod_009', name: '酸奶原味 450g', quantity: 3, price: 12.5 },
      ],
      totalAmount: 69.3,
      payAmount: 69.3,
      discount: 0,
      status: 'pending',
      paymentMethod: '待支付',
      storeId: 'store_002',
      storeName: '海邻到家福田店',
      storeAddress: '深圳市福田区华强北路赛格广场1楼',
      distance: 2.1,
      deliveryAddress: '深圳市南山区科技园南区海邻小区D栋201',
      deliveryFee: 5,
      estimatedTime: 35,
      remark: '',
      createTime: '2026-03-17 11:15:20',
      stockDeducted: false,
    },
    {
      id: '5',
      orderNo: 'WX202603170005',
      customer: { name: '钱七', phone: '135****7890', avatar: '👩‍💼', latitude: 22.5320, longitude: 113.9465 },
      items: [
        { id: 'prod_010', name: '精品苹果 1kg', quantity: 1, price: 18.9 },
        { id: 'prod_011', name: '有机青菜 500g', quantity: 2, price: 4.5 },
      ],
      totalAmount: 27.9,
      payAmount: 25.1,
      discount: 2.8,
      status: 'completed',
      paymentMethod: '微信支付',
      storeId: 'store_001',
      storeName: '海邻到家南山店',
      storeAddress: '深圳市南山区科技园南区海邻大厦1楼',
      distance: 0.6,
      deliveryAddress: '深圳市南山区科技园南区海邻小区E栋808',
      deliveryFee: 0,
      estimatedTime: 20,
      riderId: 'rider_002',
      riderName: '李四',
      riderPhone: '139****5678',
      remark: '',
      createTime: '2026-03-17 09:30:15',
      payTime: '2026-03-17 09:30:45',
      preparingTime: '2026-03-17 09:31:00',
      deliveryTime: '2026-03-17 09:40:00',
      completeTime: '2026-03-17 10:18:33',
      stockDeducted: true,
      stockDeductions: [
        { productId: 'prod_010', productName: '精品苹果 1kg', quantity: 1, beforeStock: 35, afterStock: 34, deductedAt: '2026-03-17 09:31:00' },
        { productId: 'prod_011', productName: '有机青菜 500g', quantity: 2, beforeStock: 42, afterStock: 40, deductedAt: '2026-03-17 09:31:00' },
      ],
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 查看订单详情
  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  // 更新订单状态
  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        const updates: Partial<Order> = { status: newStatus };
        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
        
        // 状态流转时记录时间
        if (newStatus === 'preparing' && !order.preparingTime) {
          updates.preparingTime = now;
        }
        if (newStatus === 'delivering' && !order.deliveryTime) {
          updates.deliveryTime = now;
        }
        if (newStatus === 'completed' && !order.completeTime) {
          updates.completeTime = now;
        }
        
        return { ...order, ...updates };
      }
      return order;
    }));
  };

  // 开始备货（扣减库存）
  const handleStartPreparing = (order: Order) => {
    // 模拟扣减库存
    const stockDeductions: StockDeduction[] = order.items.map(item => {
      const currentStock = storeInventory[order.storeId]?.[item.id] || 100;
      const beforeStock = currentStock;
      const afterStock = Math.max(0, beforeStock - item.quantity);
      
      // 更新库存
      if (!storeInventory[order.storeId]) {
        storeInventory[order.storeId] = {};
      }
      storeInventory[order.storeId][item.id] = afterStock;
      
      return {
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        beforeStock,
        afterStock,
        deductedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
    });

    setOrders(orders.map(o => 
      o.id === order.id 
        ? { 
            ...o, 
            status: 'preparing' as OrderStatus, 
            preparingTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
            stockDeducted: true,
            stockDeductions,
          } 
        : o
    ));
  };

  // 分配配送员
  const handleAssignRider = (order: Order) => {
    const riders = [
      { id: 'rider_001', name: '张三', phone: '138****1234' },
      { id: 'rider_002', name: '李四', phone: '139****5678' },
      { id: 'rider_003', name: '王五', phone: '137****9012' },
    ];
    const randomRider = riders[Math.floor(Math.random() * riders.length)];
    
    setOrders(orders.map(o => 
      o.id === order.id 
        ? { 
            ...o, 
            status: 'delivering' as OrderStatus, 
            deliveryTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
            riderId: randomRider.id,
            riderName: randomRider.name,
            riderPhone: randomRider.phone,
          } 
        : o
    ));
  };

  // 确认送达
  const handleConfirmDelivery = (order: Order) => {
    setOrders(orders.map(o => 
      o.id === order.id 
        ? { 
            ...o, 
            status: 'completed' as OrderStatus, 
            completeTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
          } 
        : o
    ));
  };

  // 过滤订单
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNo.includes(searchQuery) || 
      order.customer.name.includes(searchQuery) ||
      order.customer.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesStore = storeFilter === 'all' || order.storeId === storeFilter;
    return matchesSearch && matchesStatus && matchesStore;
  });

  // 获取状态徽章
  const getStatusBadge = (status: OrderStatus) => {
    const config = statusConfig[status];
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  // 订单统计
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    delivering: orders.filter(o => o.status === 'delivering').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  // 店铺列表
  const stores = [
    { id: 'store_001', name: '海邻到家南山店' },
    { id: 'store_002', name: '海邻到家福田店' },
    { id: 'store_003', name: '海邻到家罗湖店' },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="小程序订单" description="管理小程序商城订单，配送完成自动扣减关联店铺库存">
        <Button variant="outline">
          <Package className="h-4 w-4 mr-2" />
          导出订单
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 订单统计 */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('all')}>
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold">{orderStats.total}</p>
                  <p className="text-xs text-muted-foreground">全部订单</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('pending')}>
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{orderStats.pending}</p>
                  <p className="text-xs text-muted-foreground">待付款</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('paid')}>
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{orderStats.paid}</p>
                  <p className="text-xs text-muted-foreground">已付款</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('preparing')}>
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{orderStats.preparing}</p>
                  <p className="text-xs text-muted-foreground">备货中</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('delivering')}>
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{orderStats.delivering}</p>
                  <p className="text-xs text-muted-foreground">配送中</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('completed')}>
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{orderStats.completed}</p>
                  <p className="text-xs text-muted-foreground">已完成</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 筛选条件 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索订单号、客户姓名或手机号..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="订单状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">待付款</SelectItem>
                    <SelectItem value="paid">已付款</SelectItem>
                    <SelectItem value="preparing">备货中</SelectItem>
                    <SelectItem value="delivering">配送中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="配送店铺" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部店铺</SelectItem>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 订单列表 */}
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单信息</TableHead>
                    <TableHead>配送店铺</TableHead>
                    <TableHead>商品</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>配送信息</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{order.orderNo}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{order.customer.avatar}</span>
                            <span>{order.customer.name}</span>
                            <span className="text-xs">{order.customer.phone}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{order.createTime}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Store className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium text-sm">{order.storeName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Navigation className="h-3 w-3" />
                            <span>{order.distance} 公里</span>
                            <span className="mx-1">|</span>
                            <Clock className="h-3 w-3" />
                            <span>{order.estimatedTime}分钟</span>
                          </div>
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
                          <p className="font-medium">¥{order.payAmount.toFixed(1)}</p>
                          {order.discount > 0 && (
                            <p className="text-xs text-green-600">优惠 ¥{order.discount}</p>
                          )}
                          {order.deliveryFee > 0 && (
                            <p className="text-xs text-muted-foreground">配送费 ¥{order.deliveryFee}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-32">{order.deliveryAddress}</span>
                          </div>
                          {order.riderName && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Truck className="h-3 w-3" />
                              <span>{order.riderName} {order.riderPhone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {getStatusBadge(order.status)}
                          {order.stockDeducted && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <Box className="h-3 w-3" />
                              已扣库存
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(order)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === 'paid' && !order.stockDeducted && (
                            <Button size="sm" onClick={() => handleStartPreparing(order)}>
                              开始备货
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button size="sm" onClick={() => handleAssignRider(order)}>
                              分配配送
                            </Button>
                          )}
                          {order.status === 'delivering' && (
                            <Button size="sm" onClick={() => handleConfirmDelivery(order)}>
                              确认送达
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 订单详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              订单详情
              {selectedOrder && getStatusBadge(selectedOrder.status)}
            </DialogTitle>
            <DialogDescription>
              订单号：{selectedOrder?.orderNo}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* 配送店铺信息 */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">配送店铺</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{selectedOrder.storeName}</p>
                  <p className="text-muted-foreground">{selectedOrder.storeAddress}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Navigation className="h-4 w-4" />
                      距离：{selectedOrder.distance} 公里
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      预计：{selectedOrder.estimatedTime} 分钟
                    </span>
                  </div>
                </div>
              </div>

              {/* 客户信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">客户信息</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{selectedOrder.customer.avatar}</span>
                      <div>
                        <p className="font-medium">{selectedOrder.customer.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedOrder.customer.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">配送地址</Label>
                  <div className="mt-2 flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm">{selectedOrder.deliveryAddress}</p>
                  </div>
                </div>
              </div>

              {/* 商品列表 */}
              <div>
                <Label className="text-muted-foreground">商品明细</Label>
                <div className="mt-2 space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">¥{item.price} × {item.quantity}</p>
                      </div>
                      <p className="font-medium">¥{(item.price * item.quantity).toFixed(1)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 费用明细 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>商品总额</span>
                    <span>¥{selectedOrder.totalAmount.toFixed(1)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>优惠金额</span>
                      <span>-¥{selectedOrder.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>配送费</span>
                    <span>{selectedOrder.deliveryFee === 0 ? '免配送费' : `¥${selectedOrder.deliveryFee}`}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>实付金额</span>
                    <span className="text-red-600">¥{selectedOrder.payAmount.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* 配送员信息 */}
              {selectedOrder.riderName && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-5 w-5 text-green-600" />
                    <span className="font-medium">配送员</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedOrder.riderName}</span>
                      <span className="text-muted-foreground">{selectedOrder.riderPhone}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 库存扣减记录 */}
              {selectedOrder.stockDeducted && selectedOrder.stockDeductions && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">库存扣减记录</span>
                  </div>
                  <div className="space-y-2">
                    {selectedOrder.stockDeductions.map((deduction, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{deduction.productName}</span>
                          <span className="text-muted-foreground ml-2">x{deduction.quantity}</span>
                        </div>
                        <div className="text-muted-foreground">
                          <span className="text-red-500">{deduction.beforeStock}</span>
                          <span className="mx-1">→</span>
                          <span className="text-green-600">{deduction.afterStock}</span>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground mt-2">
                      扣减时间：{selectedOrder.stockDeductions[0]?.deductedAt}
                    </p>
                  </div>
                </div>
              )}

              {/* 时间轴 */}
              <div>
                <Label className="text-muted-foreground">订单进度</Label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">订单创建</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.createTime}</p>
                    </div>
                  </div>
                  {selectedOrder.payTime && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">支付完成 - {selectedOrder.paymentMethod}</p>
                        <p className="text-sm text-muted-foreground">{selectedOrder.payTime}</p>
                      </div>
                    </div>
                  )}
                  {selectedOrder.preparingTime && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Package className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">开始备货（库存已扣减）</p>
                        <p className="text-sm text-muted-foreground">{selectedOrder.preparingTime}</p>
                      </div>
                    </div>
                  )}
                  {selectedOrder.deliveryTime && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <Truck className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">开始配送</p>
                        <p className="text-sm text-muted-foreground">{selectedOrder.deliveryTime}</p>
                      </div>
                    </div>
                  )}
                  {selectedOrder.completeTime && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">配送完成</p>
                        <p className="text-sm text-muted-foreground">{selectedOrder.completeTime}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 备注 */}
              {selectedOrder.remark && (
                <div>
                  <Label className="text-muted-foreground">订单备注</Label>
                  <p className="mt-2 text-sm p-3 bg-yellow-50 rounded-lg">{selectedOrder.remark}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>关闭</Button>
            {selectedOrder && selectedOrder.status === 'paid' && !selectedOrder.stockDeducted && (
              <Button onClick={() => {
                handleStartPreparing(selectedOrder);
                setDetailDialogOpen(false);
              }}>
                开始备货
              </Button>
            )}
            {selectedOrder && selectedOrder.status === 'preparing' && (
              <Button onClick={() => {
                handleAssignRider(selectedOrder);
                setDetailDialogOpen(false);
              }}>
                分配配送员
              </Button>
            )}
            {selectedOrder && selectedOrder.status === 'delivering' && (
              <Button onClick={() => {
                handleConfirmDelivery(selectedOrder);
                setDetailDialogOpen(false);
              }}>
                确认送达
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
