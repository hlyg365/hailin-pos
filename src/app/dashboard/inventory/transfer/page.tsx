'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowRightLeft,
  Plus,
  Search,
  Store,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertTriangle,
  Eye,
  Trash2,
  Minus,
} from 'lucide-react';

// 店铺列表
const stores = [
  { id: 'store_001', name: '南山店', stock: 32560 },
  { id: 'store_002', name: '福田店', stock: 28450 },
  { id: 'store_003', name: '罗湖店', stock: 35120 },
  { id: 'store_004', name: '宝安店', stock: 31200 },
];

// 可调拨商品
const availableProducts = [
  { id: 'P001', name: '矿泉水 500ml', icon: '💧', stock: 150, unit: '瓶', store: 'store_001' },
  { id: 'P002', name: '可乐 330ml', icon: '🥤', stock: 80, unit: '罐', store: 'store_001' },
  { id: 'P003', name: '苹果 红富士', icon: '🍎', stock: 50, unit: '个', store: 'store_002' },
  { id: 'P004', name: '香蕉', icon: '🍌', stock: 60, unit: '根', store: 'store_002' },
  { id: 'P005', name: '薯片', icon: '🍟', stock: 40, unit: '袋', store: 'store_003' },
  { id: 'P006', name: '牛奶 250ml', icon: '🥛', stock: 100, unit: '盒', store: 'store_003' },
  { id: 'P007', name: '面包', icon: '🍞', stock: 30, unit: '个', store: 'store_004' },
  { id: 'P008', name: '鸡蛋', icon: '🥚', stock: 200, unit: '个', store: 'store_004' },
];

// 调拨单接口
interface TransferOrder {
  id: string;
  fromStore: string;
  fromStoreName: string;
  toStore: string;
  toStoreName: string;
  items: TransferItem[];
  totalQuantity: number;
  status: 'pending' | 'in_transit' | 'completed' | 'rejected';
  remark?: string;
  createTime: string;
  completeTime?: string;
  operator: string;
}

interface TransferItem {
  productId: string;
  productName: string;
  productIcon: string;
  quantity: number;
  unit: string;
}

// 模拟调拨单数据
const mockTransferOrders: TransferOrder[] = [
  {
    id: 'TF202503170001',
    fromStore: 'store_001',
    fromStoreName: '南山店',
    toStore: 'store_002',
    toStoreName: '福田店',
    items: [
      { productId: 'P001', productName: '矿泉水 500ml', productIcon: '💧', quantity: 20, unit: '瓶' },
      { productId: 'P002', productName: '可乐 330ml', productIcon: '🥤', quantity: 15, unit: '罐' },
    ],
    totalQuantity: 35,
    status: 'pending',
    remark: '福田店库存不足，紧急调拨',
    createTime: '2025-03-17 11:00',
    operator: '管理员',
  },
  {
    id: 'TF202503160001',
    fromStore: 'store_002',
    fromStoreName: '福田店',
    toStore: 'store_003',
    toStoreName: '罗湖店',
    items: [
      { productId: 'P003', productName: '苹果 红富士', productIcon: '🍎', quantity: 30, unit: '个' },
      { productId: 'P004', productName: '香蕉', productIcon: '🍌', quantity: 25, unit: '根' },
    ],
    totalQuantity: 55,
    status: 'completed',
    createTime: '2025-03-16 15:30',
    completeTime: '2025-03-16 17:00',
    operator: '管理员',
  },
  {
    id: 'TF202503160002',
    fromStore: 'store_004',
    fromStoreName: '宝安店',
    toStore: 'store_001',
    toStoreName: '南山店',
    items: [
      { productId: 'P007', productName: '面包', productIcon: '🍞', quantity: 10, unit: '个' },
    ],
    totalQuantity: 10,
    status: 'in_transit',
    createTime: '2025-03-16 10:00',
    operator: '管理员',
  },
  {
    id: 'TF202503150001',
    fromStore: 'store_003',
    fromStoreName: '罗湖店',
    toStore: 'store_004',
    toStoreName: '宝安店',
    items: [
      { productId: 'P005', productName: '薯片', productIcon: '🍟', quantity: 15, unit: '袋' },
      { productId: 'P006', productName: '牛奶 250ml', productIcon: '🥛', quantity: 20, unit: '盒' },
    ],
    totalQuantity: 35,
    status: 'completed',
    createTime: '2025-03-15 14:00',
    completeTime: '2025-03-15 16:30',
    operator: '管理员',
  },
];

export default function TransferManagementPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<TransferOrder[]>(mockTransferOrders);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<TransferOrder | null>(null);

  // 新建调拨单表单
  const [formData, setFormData] = useState({
    fromStore: '',
    toStore: '',
    items: [] as { productId: string; productName: string; productIcon: string; quantity: number; unit: string }[],
    remark: '',
  });

  // 筛选调拨单
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.fromStoreName.includes(searchTerm) ||
                         order.toStoreName.includes(searchTerm);
    const matchesStatus = activeTab === 'all' || order.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string; icon: typeof Clock }> = {
      pending: { label: '待处理', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
      in_transit: { label: '配送中', className: 'bg-blue-100 text-blue-700', icon: Truck },
      completed: { label: '已完成', className: 'bg-green-100 text-green-700', icon: CheckCircle },
      rejected: { label: '已拒绝', className: 'bg-red-100 text-red-700', icon: XCircle },
    };
    return configs[status] || configs.pending;
  };

  // 打开新建对话框
  const handleCreate = () => {
    setFormData({
      fromStore: '',
      toStore: '',
      items: [],
      remark: '',
    });
    setDialogOpen(true);
  };

  // 添加商品项
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', productName: '', productIcon: '', quantity: 1, unit: '' }],
    });
  };

  // 更新商品项
  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    if (field === 'productId') {
      const product = availableProducts.find(p => p.id === value);
      if (product) {
        newItems[index] = {
          productId: product.id,
          productName: product.name,
          productIcon: product.icon,
          quantity: 1,
          unit: product.unit,
        };
      }
    } else {
      (newItems[index] as any)[field] = value;
    }
    setFormData({ ...formData, items: newItems });
  };

  // 删除商品项
  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  // 提交调拨单
  const handleSubmit = () => {
    if (!formData.fromStore || !formData.toStore || formData.items.length === 0) {
      return;
    }

    const fromStoreName = stores.find(s => s.id === formData.fromStore)?.name || '';
    const toStoreName = stores.find(s => s.id === formData.toStore)?.name || '';

    const newOrder: TransferOrder = {
      id: `TF${Date.now()}`,
      fromStore: formData.fromStore,
      fromStoreName,
      toStore: formData.toStore,
      toStoreName,
      items: formData.items,
      totalQuantity: formData.items.reduce((sum, item) => sum + item.quantity, 0),
      status: 'pending',
      remark: formData.remark,
      createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      operator: '管理员',
    };

    setOrders([newOrder, ...orders]);
    setDialogOpen(false);
  };

  // 查看详情
  const handleViewDetail = (order: TransferOrder) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  // 更新状态
  const updateOrderStatus = (orderId: string, newStatus: TransferOrder['status']) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus, completeTime: newStatus === 'completed' ? new Date().toISOString().replace('T', ' ').slice(0, 19) : order.completeTime }
        : order
    ));
    setDetailDialogOpen(false);
  };

  // 根据调出店铺筛选商品
  const getProductsByStore = (storeId: string) => {
    return availableProducts.filter(p => p.store === storeId);
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="库存调拨"
        description="管理各店铺间的库存调拨"
        showStoreSelector={false}
      >
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1" />
          新建调拨单
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <ArrowRightLeft className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">调拨总数</div>
                  <div className="text-xl font-bold">{orders.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">待处理</div>
                  <div className="text-xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Truck className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">配送中</div>
                  <div className="text-xl font-bold text-blue-600">{orders.filter(o => o.status === 'in_transit').length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">已完成</div>
                  <div className="text-xl font-bold text-green-600">{orders.filter(o => o.status === 'completed').length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 调拨单列表 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">调拨单列表</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索调拨单号、店铺"
                    className="pl-9 w-48"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="pending">待处理</TabsTrigger>
                <TabsTrigger value="in_transit">配送中</TabsTrigger>
                <TabsTrigger value="completed">已完成</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>调拨单号</TableHead>
                      <TableHead>调出店铺</TableHead>
                      <TableHead>调入店铺</TableHead>
                      <TableHead className="text-right">商品种类</TableHead>
                      <TableHead className="text-right">总数量</TableHead>
                      <TableHead className="text-center">状态</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-center">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map(order => {
                      const statusConfig = getStatusConfig(order.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">{order.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Store className="h-4 w-4 text-muted-foreground" />
                              {order.fromStoreName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <ArrowRightLeft className="h-4 w-4 text-purple-500" />
                              {order.toStoreName}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{order.items.length}</TableCell>
                          <TableCell className="text-right font-medium">{order.totalQuantity}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={statusConfig.className}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{order.createTime}</TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetail(order)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* 新建调拨单对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新建调拨单</DialogTitle>
            <DialogDescription>
              创建店铺间库存调拨单
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>调出店铺</Label>
                <Select value={formData.fromStore} onValueChange={(value) => setFormData({ ...formData, fromStore: value, items: [] })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择调出店铺" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>调入店铺</Label>
                <Select value={formData.toStore} onValueChange={(value) => setFormData({ ...formData, toStore: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择调入店铺" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.filter(s => s.id !== formData.fromStore).map(store => (
                      <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 商品列表 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>调拨商品</Label>
                <Button variant="outline" size="sm" onClick={addItem} disabled={!formData.fromStore}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加商品
                </Button>
              </div>
              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  请添加调拨商品
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                      <Select value={item.productId} onValueChange={(value) => updateItem(index, 'productId', value)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="选择商品" />
                        </SelectTrigger>
                        <SelectContent>
                          {getProductsByStore(formData.fromStore).map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.icon} {product.name} (库存: {product.stock}{product.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className="w-20"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        min={1}
                      />
                      <span className="text-sm text-muted-foreground w-8">{item.unit}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                placeholder="调拨原因、备注信息"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={!formData.fromStore || !formData.toStore || formData.items.length === 0}>
              创建调拨单
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>调拨单详情</DialogTitle>
            <DialogDescription>
              {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground">调出店铺</div>
                  <div className="font-medium flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    {selectedOrder.fromStoreName}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground">调入店铺</div>
                  <div className="font-medium flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    {selectedOrder.toStoreName}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>调拨商品</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品</TableHead>
                      <TableHead className="text-right">数量</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{item.productIcon}</span>
                            <span>{item.productName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.quantity} {item.unit}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedOrder.remark && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground">备注</div>
                  <div className="text-sm">{selectedOrder.remark}</div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>创建时间: {selectedOrder.createTime}</span>
                <span>操作员: {selectedOrder.operator}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedOrder?.status === 'pending' && (
              <>
                <Button variant="outline" onClick={() => updateOrderStatus(selectedOrder.id, 'rejected')}>
                  <XCircle className="h-4 w-4 mr-1" />
                  拒绝
                </Button>
                <Button onClick={() => updateOrderStatus(selectedOrder.id, 'in_transit')}>
                  <Truck className="h-4 w-4 mr-1" />
                  开始配送
                </Button>
              </>
            )}
            {selectedOrder?.status === 'in_transit' && (
              <Button onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}>
                <CheckCircle className="h-4 w-4 mr-1" />
                确认入库
              </Button>
            )}
            {(selectedOrder?.status === 'completed' || selectedOrder?.status === 'rejected') && (
              <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>关闭</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
