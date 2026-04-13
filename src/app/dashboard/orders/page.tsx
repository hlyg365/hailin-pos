'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Download,
  Eye,
  Package,
  DollarSign,
  ShoppingCart,
  Receipt,
  RotateCcw,
  ClipboardList,
  Store,
  RefreshCw,
  Loader2,
} from 'lucide-react';

// 订单状态
type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded' | 'suspended';

// 支付方式
type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'card' | 'mixed' | 'points';

// 店铺信息
interface Shop {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  status: string;
  shop_type: string;
}

interface Order {
  id: string;
  order_no: string;
  shop_id: number | null;
  shop_name: string | null;
  staff_name: string | null;
  member_name: string | null;
  member_phone: string | null;
  member_level: string | null;
  items: OrderProduct[];
  subtotal: number;
  discount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
}

interface OrderProduct {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  icon?: string;
  unit?: string;
}

export default function OrdersPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState<string>('all'); // 默认显示所有店铺
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);

  // 加载店铺列表
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await fetch('/api/shops/');
        const data = await response.json();
        if (data.shops) {
          setShops(data.shops);
        }
      } catch (error) {
        console.error('加载店铺列表失败:', error);
      }
    };
    fetchShops();
  }, []);

  // 加载订单列表
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedShopId && selectedShopId !== 'all') {
        params.append('shopId', selectedShopId);
      }
      if (filterStatus && filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/orders/?${params.toString()}`);
      const data = await response.json();
      if (data.orders) {
        setOrders(data.orders);
        setTotalOrders(data.total || data.orders.length);
      }
    } catch (error) {
      console.error('加载订单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和筛选条件变化时重新加载
  useEffect(() => {
    fetchOrders();
  }, [selectedShopId, filterStatus]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2 || searchTerm.length === 0) {
        fetchOrders();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 获取订单状态标签
  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      pending: { label: '待处理', className: 'bg-yellow-500' },
      completed: { label: '已完成', className: 'bg-green-500' },
      cancelled: { label: '已取消', className: 'bg-gray-500' },
      refunded: { label: '已退款', className: 'bg-red-500' },
      suspended: { label: '已挂起', className: 'bg-orange-500' },
    };
    const config = statusConfig[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // 获取支付方式标签
  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const labels: Record<PaymentMethod, string> = {
      cash: '现金',
      wechat: '微信支付',
      alipay: '支付宝',
      card: '刷卡',
      mixed: '混合支付',
      points: '积分支付',
    };
    return labels[method] || method;
  };

  // 获取会员等级标签
  const getMemberLevelLabel = (level: string | null) => {
    if (!level) return null;
    const levelMap: Record<string, string> = {
      '1': '普通会员',
      '2': '银卡会员',
      '3': '金卡会员',
      '4': '钻石会员',
    };
    return levelMap[level] || level;
  };

  // 查看订单详情
  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  // 订单退款
  const handleRefund = (orderId: string) => {
    console.log('订单退款:', orderId);
  };

  // 取单
  const handleResumeOrder = (orderId: string) => {
    console.log('取单:', orderId);
  };

  // 格式化时间
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const datePart = date.toLocaleDateString('zh-CN');
    const timePart = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    return { date: datePart, time: timePart, full: `${datePart} ${timePart}` };
  };

  // 统计数据
  const stats = {
    total: totalOrders,
    completed: orders.filter(o => o.status === 'completed').length,
    suspended: orders.filter(o => o.status === 'suspended').length,
    refunded: orders.filter(o => o.status === 'refunded').length,
    totalAmount: orders
      .filter(o => o.status !== 'refunded')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0),
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader title="订单管理" description="查看和管理所有店铺订单，支持按店铺筛选">
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchOrders}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">订单总数</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Package className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.completed}</div>
                  <div className="text-xs text-muted-foreground">已完成</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <ClipboardList className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.suspended}</div>
                  <div className="text-xs text-muted-foreground">挂单</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <DollarSign className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">¥{stats.totalAmount.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">总金额</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <RotateCcw className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.refunded}</div>
                  <div className="text-xs text-muted-foreground">已退款</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 操作栏 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-1">
                {/* 店铺筛选 */}
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="选择店铺" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部店铺</SelectItem>
                      {shops.map((shop) => (
                        <SelectItem key={shop.id} value={String(shop.id)}>
                          {shop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 搜索框 */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索订单号/会员姓名/手机号"
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* 状态筛选 */}
              <div className="flex items-center gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  全部
                </Button>
                <Button
                  variant={filterStatus === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('completed')}
                >
                  已完成
                </Button>
                <Button
                  variant={filterStatus === 'suspended' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('suspended')}
                >
                  挂单
                </Button>
                <Button
                  variant={filterStatus === 'refunded' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('refunded')}
                >
                  已退款
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 订单表格 */}
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">加载中...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">暂无订单数据</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedShopId === 'all' ? '所有店铺暂无订单' : '当前店铺暂无订单'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单号</TableHead>
                    <TableHead>店铺</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>会员</TableHead>
                    <TableHead>商品数</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>支付方式</TableHead>
                    <TableHead>收银员</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const { date, time } = formatDateTime(order.created_at);
                    const itemsCount = order.items?.reduce((sum: number, item: OrderProduct) => sum + item.quantity, 0) || 0;
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {order.order_no}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{order.shop_name || '未知店铺'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{time}</div>
                          <div className="text-xs text-muted-foreground">{date}</div>
                        </TableCell>
                        <TableCell>
                          {order.member_name ? (
                            <div>
                              <div className="font-medium">{order.member_name}</div>
                              {order.member_level && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {getMemberLevelLabel(order.member_level)}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">散客</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{itemsCount}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-orange-600">
                            ¥{(order.total_amount || 0).toFixed(2)}
                          </div>
                          {order.discount > 0 && (
                            <div className="text-xs text-muted-foreground line-through">
                              ¥{(order.subtotal || 0).toFixed(2)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{getPaymentMethodLabel(order.payment_method)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{order.staff_name || '-'}</div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetail(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {order.status === 'completed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRefund(order.id)}
                                className="text-orange-500"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            {order.status === 'suspended' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResumeOrder(order.id)}
                                className="text-blue-500"
                              >
                                <ClipboardList className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* 订单详情弹窗 */}
        {showDetail && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">订单详情</h3>
                    <code className="text-sm text-muted-foreground">{selectedOrder.order_no}</code>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowDetail(false)}>
                    ✕
                  </Button>
                </div>

                <div className="mb-4">
                  {getStatusBadge(selectedOrder.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">店铺</div>
                    <div className="font-medium flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      {selectedOrder.shop_name || '未知店铺'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">下单时间</div>
                    <div className="font-medium">{formatDateTime(selectedOrder.created_at).full}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">会员</div>
                    <div className="font-medium">
                      {selectedOrder.member_name || '散客'}
                      {selectedOrder.member_level && (
                        <Badge variant="outline" className="ml-2">
                          {getMemberLevelLabel(selectedOrder.member_level)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">支付方式</div>
                    <div className="font-medium">
                      {getPaymentMethodLabel(selectedOrder.payment_method)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">收银员</div>
                    <div className="font-medium">{selectedOrder.staff_name || '-'}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-3">商品清单</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            ¥{product.price.toFixed(2)} × {product.quantity}{product.unit || '件'}
                          </div>
                        </div>
                        <div className="font-medium text-sm">
                          ¥{(product.price * product.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">商品总额</span>
                    <span>¥{(selectedOrder.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>优惠金额</span>
                      <span>-¥{selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>实付金额</span>
                      <span className="text-orange-600">
                        ¥{(selectedOrder.total_amount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedOrder.status === 'completed' && (
                  <div className="mt-6 flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      申请退款
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
