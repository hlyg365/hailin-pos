'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Receipt,
  Calendar,
  DollarSign,
  User,
  Package,
  Printer,
  Download,
} from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  createTime: string;
  totalAmount: number;
  paymentMethod: string;
  status: 'completed' | 'refunded' | 'partial_refunded';
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
}

export default function RefundPage() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      orderNo: 'ORD202403150001',
      customerName: '张三',
      customerPhone: '138****1234',
      createTime: '2024-03-15 14:30:00',
      totalAmount: 58.50,
      paymentMethod: '微信支付',
      status: 'completed',
      items: [
        {
          id: '1',
          name: '矿泉水 500ml',
          price: 2.00,
          quantity: 2,
          subtotal: 4.00,
        },
        {
          id: '2',
          name: '薯片 原味',
          price: 8.00,
          quantity: 1,
          subtotal: 8.00,
        },
        {
          id: '3',
          name: '苹果 红富士',
          price: 8.00,
          quantity: 0.75,
          subtotal: 6.00,
        },
        {
          id: '4',
          name: '可乐 330ml',
          price: 3.50,
          quantity: 3,
          subtotal: 10.50,
        },
        {
          id: '5',
          name: '方便面 桶装',
          price: 3.00,
          quantity: 10,
          subtotal: 30.00,
        },
      ],
    },
    {
      id: '2',
      orderNo: 'ORD202403150002',
      customerName: '李四',
      customerPhone: '139****5678',
      createTime: '2024-03-15 15:45:00',
      totalAmount: 25.00,
      paymentMethod: '支付宝',
      status: 'refunded',
      items: [
        {
          id: '1',
          name: '牛奶 250ml',
          price: 4.00,
          quantity: 5,
          subtotal: 20.00,
        },
        {
          id: '2',
          name: '酸奶 原味',
          price: 3.80,
          quantity: 1,
          subtotal: 3.80,
        },
        {
          id: '3',
          name: '饼干 巧克力味',
          price: 1.20,
          quantity: 1,
          subtotal: 1.20,
        },
      ],
    },
  ]);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleSearch = () => {
    // 实际项目中这里应该调用API搜索
    console.log('Searching for:', searchKeyword);
  };

  const handleRefund = (order: Order) => {
    if (order.status !== 'completed') {
      alert('该订单已退款，无法重复操作');
      return;
    }
    setSelectedOrder(order);
    setRefundAmount(order.totalAmount);
    setRefundDialogOpen(true);
  };

  const handleRefundSubmit = () => {
    if (!refundReason) {
      alert('请填写退款原因');
      return;
    }

    if (refundType === 'partial' && refundAmount <= 0) {
      alert('请填写退款金额');
      return;
    }

    // 更新订单状态
    if (selectedOrder) {
      setOrders(
        orders.map((order) =>
          order.id === selectedOrder.id
            ? {
                ...order,
                status:
                  refundType === 'full' ? 'refunded' : 'partial_refunded',
              }
            : order
        )
      );
      alert('退款申请已提交');
      setRefundDialogOpen(false);
      setSelectedOrder(null);
      setRefundReason('');
      setRefundAmount(0);
      setSelectedItems(new Set());
    }
  };

  const handleItemSelect = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);

    // 计算退款金额
    if (selectedOrder) {
      const newAmount = selectedOrder.items
        .filter((item) => newSelected.has(item.id))
        .reduce((sum, item) => sum + item.subtotal, 0);
      setRefundAmount(newAmount);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">已完成</Badge>;
      case 'refunded':
        return <Badge className="bg-red-500">已退款</Badge>;
      case 'partial_refunded':
        return <Badge className="bg-orange-500">部分退款</Badge>;
      default:
        return <Badge>未知</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="退货退款"
        description="处理顾客退货退款申请"
      >
        <Button variant="outline" onClick={handleSearch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 搜索栏 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">搜索订单</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="search"
                      placeholder="输入订单号、手机号或顾客姓名"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch}>
                      <Search className="h-4 w-4 mr-2" />
                      搜索
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 订单列表 */}
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <CardTitle className="flex items-center gap-2">
                          <Receipt className="h-5 w-5" />
                          {order.orderNo}
                        </CardTitle>
                        {getStatusBadge(order.status)}
                      </div>
                      <CardDescription className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {order.customerName} {order.customerPhone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {order.createTime}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          支付方式: {order.paymentMethod}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ¥{order.totalAmount.toFixed(2)}
                      </div>
                      {order.status === 'completed' && (
                        <Button
                          onClick={() => handleRefund(order)}
                          variant="destructive"
                          size="sm"
                          className="mt-2"
                        >
                          退款
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium mb-3">商品清单</div>
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ¥{item.price.toFixed(2)} × {item.quantity}
                            </div>
                          </div>
                        </div>
                        <div className="font-medium">
                          ¥{item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {orders.length === 0 && (
              <Card>
                <CardContent className="pt-12 text-center">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    暂无订单，请搜索订单号或手机号
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* 退款对话框 */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>申请退款</DialogTitle>
            <DialogDescription>
              订单号: {selectedOrder?.orderNo}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 退款类型 */}
            <div className="space-y-2">
              <Label>退款类型</Label>
              <Select
                value={refundType}
                onValueChange={(value: any) => setRefundType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">全额退款</SelectItem>
                  <SelectItem value="partial">部分退款</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 部分退款 - 选择商品 */}
            {refundType === 'partial' && selectedOrder && (
              <div className="space-y-2">
                <Label>选择退款的商品</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleItemSelect(item.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          ¥{item.price.toFixed(2)} × {item.quantity}
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        ¥{item.subtotal.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 退款金额 */}
            <div className="space-y-2">
              <Label>退款金额</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  disabled={refundType === 'full'}
                  min={0}
                  max={selectedOrder?.totalAmount}
                  step={0.01}
                />
                <span className="text-sm text-muted-foreground">
                  订单总额: ¥{selectedOrder?.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 退款原因 */}
            <div className="space-y-2">
              <Label htmlFor="reason">退款原因 *</Label>
              <Textarea
                id="reason"
                placeholder="请详细描述退款原因"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* 注意事项 */}
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-start gap-2 text-sm text-yellow-800">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <div className="font-medium">注意事项</div>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• 退款金额将原路返回到顾客支付账户</li>
                    <li>• 退款后订单状态将变更，无法再次操作</li>
                    <li>• 请仔细核对退款商品和金额</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleRefundSubmit} variant="destructive">
              确认退款
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
