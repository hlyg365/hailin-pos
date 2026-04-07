'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Clock,
  User,
  DollarSign,
  Package,
  Trash2,
  Receipt,
  Search,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

interface PendingOrder {
  id: string;
  orderNo: string;
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  hangupTime: string;
  totalAmount: number;
  itemCount: number;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    unit: string;
    subtotal: number;
  }[];
  notes?: string;
}

export default function PendingOrdersPage() {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([
    {
      id: '1',
      orderNo: 'PEND202403150001',
      cashierName: '张三',
      customerName: '李四',
      customerPhone: '138****1234',
      hangupTime: '2024-03-15 14:30:00',
      totalAmount: 45.50,
      itemCount: 4,
      items: [
        {
          id: '1',
          name: '矿泉水 500ml',
          price: 2.00,
          quantity: 5,
          unit: '瓶',
          subtotal: 10.00,
        },
        {
          id: '2',
          name: '薯片 原味',
          price: 8.00,
          quantity: 2,
          unit: '包',
          subtotal: 16.00,
        },
        {
          id: '3',
          name: '可乐 330ml',
          price: 3.50,
          quantity: 3,
          unit: '罐',
          subtotal: 10.50,
        },
        {
          id: '4',
          name: '方便面 桶装',
          price: 3.00,
          quantity: 3,
          unit: '桶',
          subtotal: 9.00,
        },
      ],
      notes: '顾客去结账，等一下回来',
    },
    {
      id: '2',
      orderNo: 'PEND202403150002',
      cashierName: '张三',
      hangupTime: '2024-03-15 15:45:00',
      totalAmount: 32.00,
      itemCount: 3,
      items: [
        {
          id: '1',
          name: '牛奶 250ml',
          price: 4.00,
          quantity: 5,
          unit: '盒',
          subtotal: 20.00,
        },
        {
          id: '2',
          name: '酸奶 原味',
          price: 3.80,
          quantity: 2,
          unit: '杯',
          subtotal: 7.60,
        },
        {
          id: '3',
          name: '饼干 巧克力味',
          price: 4.40,
          quantity: 1,
          unit: '包',
          subtotal: 4.40,
        },
      ],
    },
  ]);

  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    // 加载挂单数据
    const saved = localStorage.getItem('pendingOrders');
    if (saved) {
      setPendingOrders(JSON.parse(saved));
    }
  }, []);

  const handleSearch = () => {
    console.log('Searching for:', searchKeyword);
  };

  const handleTakeOrder = (order: PendingOrder) => {
    if (window.confirm(`确定要取单 ${order.orderNo} 吗？`)) {
      // 将订单恢复到购物车（实际项目中应该跳转到收银台并恢复购物车）
      localStorage.setItem('restoredOrder', JSON.stringify(order));
      alert('订单已恢复到购物车');
      // 删除挂单
      handleDeleteOrder(order.id);
      // 跳转到收银台
      window.location.href = '/pos';
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm('确定要删除这个挂单吗？')) {
      setPendingOrders(pendingOrders.filter((order) => order.id !== orderId));
      localStorage.setItem(
        'pendingOrders',
        JSON.stringify(pendingOrders.filter((order) => order.id !== orderId))
      );
    }
  };

  const handleViewDetail = (order: PendingOrder) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const getTimeDiff = (hangupTime: string) => {
    const hangup = new Date(hangupTime).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - hangup) / 1000 / 60); // 分钟

    if (diff < 60) {
      return `${diff}分钟前`;
    } else if (diff < 1440) {
      return `${Math.floor(diff / 60)}小时前`;
    } else {
      return `${Math.floor(diff / 1440)}天前`;
    }
  };

  const getUrgencyColor = (hangupTime: string) => {
    const hangup = new Date(hangupTime).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - hangup) / 1000 / 60); // 分钟

    if (diff > 120) {
      // 超过2小时
      return 'bg-red-500';
    } else if (diff > 60) {
      // 超过1小时
      return 'bg-orange-500';
    } else {
      return 'bg-green-500';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="挂单管理"
        description="查看和管理所有挂单订单"
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            搜索
          </Button>
          <Button variant="outline" onClick={handleSearch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 搜索栏 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">搜索挂单</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="search"
                      placeholder="输入挂单单号、手机号或顾客姓名"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      挂单总数
                    </p>
                    <p className="text-2xl font-bold">{pendingOrders.length}</p>
                  </div>
                  <Receipt className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      挂单总金额
                    </p>
                    <p className="text-2xl font-bold">
                      ¥
                      {pendingOrders
                        .reduce((sum, order) => sum + order.totalAmount, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      需要催单
                    </p>
                    <p className="text-2xl font-bold">
                      {
                        pendingOrders.filter(
                          (order) =>
                            (new Date().getTime() - new Date(order.hangupTime).getTime()) /
                              1000 /
                              60 >
                            60
                        ).length
                      }
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 挂单列表 */}
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <CardTitle className="flex items-center gap-2">
                          <Receipt className="h-5 w-5" />
                          {order.orderNo}
                        </CardTitle>
                        <Badge className={getUrgencyColor(order.hangupTime)}>
                          {getTimeDiff(order.hangupTime)}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          收银员: {order.cashierName}
                        </div>
                        {order.customerName && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            顾客: {order.customerName}{' '}
                            {order.customerPhone && `(${order.customerPhone})`}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {order.hangupTime}
                        </div>
                      </CardDescription>
                      {order.notes && (
                        <div className="text-sm text-muted-foreground">
                          备注: {order.notes}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ¥{order.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.itemCount} 件商品
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* 商品预览 */}
                    <div className="flex flex-wrap gap-2">
                      {order.items.slice(0, 3).map((item) => (
                        <Badge key={item.id} variant="outline">
                          {item.name} × {item.quantity}
                        </Badge>
                      ))}
                      {order.items.length > 3 && (
                        <Badge variant="outline">
                          +{order.items.length - 3} 更多
                        </Badge>
                      )}
                    </div>

                    <Separator />

                    {/* 操作按钮 */}
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(order)}
                      >
                        查看详情
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleTakeOrder(order)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        取单
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {pendingOrders.length === 0 && (
              <Card>
                <CardContent className="pt-12 text-center">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">暂无挂单</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* 订单详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>挂单详情</DialogTitle>
            <DialogDescription>
              挂单单号: {selectedOrder?.orderNo}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-4">
              {/* 基本信息 */}
              <div className="space-y-2">
                <Label>基本信息</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">收银员：</span>
                    {selectedOrder.cashierName}
                  </div>
                  <div>
                    <span className="text-muted-foreground">挂单时间：</span>
                    {selectedOrder.hangupTime}
                  </div>
                  {selectedOrder.customerName && (
                    <>
                      <div>
                        <span className="text-muted-foreground">顾客：</span>
                        {selectedOrder.customerName}
                      </div>
                      {selectedOrder.customerPhone && (
                        <div>
                          <span className="text-muted-foreground">手机：</span>
                          {selectedOrder.customerPhone}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 商品清单 */}
              <div className="space-y-2">
                <Label>商品清单</Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2">商品名称</th>
                        <th className="text-center p-2">单价</th>
                        <th className="text-center p-2">数量</th>
                        <th className="text-right p-2">小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.name}</td>
                          <td className="text-center p-2">
                            ¥{item.price.toFixed(2)}
                          </td>
                          <td className="text-center p-2">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="text-right p-2">
                            ¥{item.subtotal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="text-right p-2 font-medium">
                          合计：
                        </td>
                        <td className="text-right p-2 font-bold">
                          ¥{selectedOrder.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="space-y-2">
                  <Label>备注</Label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
            {selectedOrder && (
              <Button onClick={() => handleTakeOrder(selectedOrder)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                取单
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
