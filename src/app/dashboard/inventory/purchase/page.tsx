'use client';

import { useState, useEffect } from 'react';
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
  Truck,
  Plus,
  Search,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  DollarSign,
  FileText,
  Warehouse,
  ArrowDown,
  Building2,
  Phone,
  User,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// 供应商列表
const suppliers = [
  { id: 'SUP001', name: '可口可乐公司', contact: '张经理', phone: '13800138001' },
  { id: 'SUP002', name: '农夫山泉', contact: '李经理', phone: '13800138002' },
  { id: 'SUP003', name: '蒙牛乳业', contact: '王经理', phone: '13800138003' },
  { id: 'SUP004', name: '乐事公司', contact: '赵经理', phone: '13800138004' },
  { id: 'SUP005', name: '统一企业', contact: '钱经理', phone: '13800138005' },
];

// 商品数据类型
interface ProductItem {
  id: string;
  productId: string;
  name: string;
  icon: string;
  unit: string;
  purchasePrice: number;
  stock: number;
  supplierId?: string;
  barcode?: string;
}

// 采购单接口
interface PurchaseOrder {
  id: string;
  orderNo: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  totalQuantity: number;
  status: 'draft' | 'pending' | 'approved' | 'received' | 'completed';
  remark?: string;
  createTime: string;
  receiveTime?: string;
  completeTime?: string;
  operator: string;
}

interface PurchaseItem {
  productId: string;
  productName: string;
  productIcon: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  amount: number;
  receivedQuantity?: number;
}

// 模拟采购单数据
const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO001',
    orderNo: 'PO202503170001',
    supplierId: 'SUP001',
    supplierName: '可口可乐公司',
    items: [
      { productId: 'P002', productName: '可乐 330ml', productIcon: '🥤', quantity: 100, unit: '罐', purchasePrice: 2.20, amount: 220 },
      { productId: 'P003', productName: '雪碧 330ml', productIcon: '🧃', quantity: 100, unit: '罐', purchasePrice: 2.20, amount: 220 },
    ],
    totalAmount: 440,
    totalQuantity: 200,
    status: 'completed',
    createTime: '2025-03-15 09:00',
    receiveTime: '2025-03-16 14:00',
    completeTime: '2025-03-16 14:30',
    operator: '采购员A',
  },
  {
    id: 'PO002',
    orderNo: 'PO202503170002',
    supplierId: 'SUP002',
    supplierName: '农夫山泉',
    items: [
      { productId: 'P001', productName: '矿泉水 500ml', productIcon: '💧', quantity: 200, unit: '瓶', purchasePrice: 1.50, amount: 300 },
    ],
    totalAmount: 300,
    totalQuantity: 200,
    status: 'approved',
    createTime: '2025-03-17 10:00',
    operator: '采购员A',
  },
  {
    id: 'PO003',
    orderNo: 'PO202503170003',
    supplierId: 'SUP003',
    supplierName: '蒙牛乳业',
    items: [
      { productId: 'P004', productName: '牛奶 250ml', productIcon: '🥛', quantity: 50, unit: '盒', purchasePrice: 2.80, amount: 140 },
      { productId: 'P005', productName: '酸奶 200ml', productIcon: '🥛', quantity: 50, unit: '盒', purchasePrice: 3.20, amount: 160 },
    ],
    totalAmount: 300,
    totalQuantity: 100,
    status: 'pending',
    createTime: '2025-03-17 11:00',
    operator: '采购员B',
  },
];

// 总仓库存接口
interface CentralStockItem {
  productId: string;
  productName: string;
  icon: string;
  stock: number;
  unit: string;
}

export default function PurchasePage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders);
  const [centralStock, setCentralStock] = useState<CentralStockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // 商品库数据（从API加载）
  const [productCatalog, setProductCatalog] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // 加载总仓库存
  useEffect(() => {
    const loadStock = async () => {
      setLoadingStock(true);
      try {
        const response = await fetch('/api/central-stock');
        const result = await response.json();
        
        if (result.success && result.data) {
          setCentralStock(result.data);
          console.log('[采购管理] 已加载', result.data.length, '个库存商品');
        }
      } catch (error) {
        console.error('[采购管理] 加载库存失败:', error);
      } finally {
        setLoadingStock(false);
      }
    };
    
    loadStock();
  }, []);
  
  // 从API加载商品数据
  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await fetch('/api/store-products');
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          const products: ProductItem[] = [];
          
          result.data.forEach((p: any) => {
            if (p.specs && p.specs.length > 0) {
              p.specs.forEach((spec: any) => {
                products.push({
                  id: spec.barcode || `spec-${spec.id}`,
                  productId: p.id,
                  name: p.name + (p.specs.length > 1 ? ` (${spec.name})` : ''),
                  icon: '📦',
                  unit: spec.unit || '个',
                  purchasePrice: spec.costPrice || spec.price * 0.6, // 默认成本价为售价的60%
                  stock: spec.stock || 0,
                  barcode: spec.barcode,
                });
              });
            } else {
              products.push({
                id: p.id,
                productId: p.id,
                name: p.name,
                icon: '📦',
                unit: '个',
                purchasePrice: p.costPrice || 0,
                stock: 0,
              });
            }
          });
          
          setProductCatalog(products);
          console.log('[采购管理] 已加载', products.length, '个商品');
        }
      } catch (error) {
        console.error('[采购管理] 加载商品失败:', error);
        toast.error('加载商品失败');
      } finally {
        setLoadingProducts(false);
      }
    };
    
    loadProducts();
  }, []);
  
  // 新建采购单对话框
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderItems, setOrderItems] = useState<PurchaseItem[]>([]);
  const [orderRemark, setOrderRemark] = useState('');
  
  // 详情对话框
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  
  // 入库对话框
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [receiveOrder, setReceiveOrder] = useState<PurchaseOrder | null>(null);
  const [receiveItems, setReceiveItems] = useState<{ productId: string; quantity: number }[]>([]);

  // 待采购的要货申请
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // 加载待采购的要货申请
  useEffect(() => {
    const loadPendingRequests = async () => {
      setLoadingRequests(true);
      try {
        const response = await fetch('/api/store-requests?needsPurchase=true');
        const result = await response.json();
        
        if (result.success && result.data) {
          setPendingRequests(result.data);
        }
      } catch (error) {
        console.error('加载待采购申请失败:', error);
      } finally {
        setLoadingRequests(false);
      }
    };
    
    loadPendingRequests();
  }, []);

  // 筛选采购单
  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.orderNo.includes(searchTerm) || 
                         order.supplierName.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      draft: { label: '草稿', className: 'bg-gray-100 text-gray-600' },
      pending: { label: '待审核', className: 'bg-yellow-100 text-yellow-600' },
      approved: { label: '已审核', className: 'bg-blue-100 text-blue-600' },
      received: { label: '已收货', className: 'bg-purple-100 text-purple-600' },
      completed: { label: '已完成', className: 'bg-green-100 text-green-600' },
    };
    const { label, className } = config[status] || { label: status, className: '' };
    return <Badge className={className}>{label}</Badge>;
  };

  // 添加商品到采购单
  const addOrderItem = (productId: string) => {
    const product = productCatalog.find(p => p.id === productId);
    if (product && !orderItems.find(item => item.productId === productId)) {
      setOrderItems([...orderItems, {
        productId: product.id,
        productName: product.name,
        productIcon: product.icon,
        quantity: 1,
        unit: product.unit,
        purchasePrice: product.purchasePrice,
        amount: product.purchasePrice,
      }]);
    }
  };

  // 更新商品数量
  const updateItemQuantity = (productId: string, quantity: number) => {
    setOrderItems(orderItems.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity,
          amount: item.purchasePrice * quantity,
        };
      }
      return item;
    }));
  };

  // 移除商品
  const removeOrderItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  // 计算总金额
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.amount, 0);
  };

  // 提交采购单
  const submitPurchaseOrder = () => {
    if (!selectedSupplier || orderItems.length === 0) {
      alert('请选择供应商并添加商品');
      return;
    }

    const supplier = suppliers.find(s => s.id === selectedSupplier);
    const newOrder: PurchaseOrder = {
      id: `PO${Date.now()}`,
      orderNo: `PO${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(purchaseOrders.length + 1).padStart(4, '0')}`,
      supplierId: selectedSupplier,
      supplierName: supplier?.name || '',
      items: orderItems,
      totalAmount: calculateTotal(),
      totalQuantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      status: 'pending',
      remark: orderRemark,
      createTime: new Date().toLocaleString(),
      operator: '当前用户',
    };

    setPurchaseOrders([newOrder, ...purchaseOrders]);
    setShowCreateDialog(false);
    resetCreateForm();
  };

  // 重置表单
  const resetCreateForm = () => {
    setSelectedSupplier('');
    setOrderItems([]);
    setOrderRemark('');
  };

  // 审核采购单
  const approveOrder = (orderId: string) => {
    setPurchaseOrders(purchaseOrders.map(order => 
      order.id === orderId ? { ...order, status: 'approved' } : order
    ));
  };

  // 打开入库对话框
  const openReceiveDialog = (order: PurchaseOrder) => {
    setReceiveOrder(order);
    setReceiveItems(order.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
    })));
    setShowReceiveDialog(true);
  };

  // 更新收货数量
  const updateReceiveQuantity = (productId: string, quantity: number) => {
    setReceiveItems(receiveItems.map(item => 
      item.productId === productId ? { ...item, quantity } : item
    ));
  };

  // 确认入库
  const confirmReceive = async () => {
    if (!receiveOrder) return;

    try {
      // 准备入库数据
      const stockItems = receiveOrder.items.map(item => {
        const received = receiveItems.find(r => r.productId === item.productId);
        return {
          productId: item.productId,
          productName: item.productName,
          productIcon: item.productIcon || '📦',
          quantity: received?.quantity || item.quantity,
          unit: item.unit,
        };
      });

      // 调用API入库
      const response = await fetch('/api/central-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: stockItems }),
      });

      const result = await response.json();

      if (result.success) {
        // 更新本地库存状态
        const updatedStock = [...centralStock];
        
        receiveOrder.items.forEach(item => {
          const received = receiveItems.find(r => r.productId === item.productId);
          const receivedQty = received?.quantity || item.quantity;
          
          const existingIndex = updatedStock.findIndex(s => s.productId === item.productId);
          
          if (existingIndex >= 0) {
            updatedStock[existingIndex] = {
              ...updatedStock[existingIndex],
              stock: updatedStock[existingIndex].stock + receivedQty,
            };
          } else {
            updatedStock.push({
              productId: item.productId,
              productName: item.productName,
              icon: item.productIcon || '📦',
              stock: receivedQty,
              unit: item.unit,
            });
          }
        });
        
        setCentralStock(updatedStock);

        // 更新采购单状态
        setPurchaseOrders(purchaseOrders.map(order => {
          if (order.id === receiveOrder.id) {
            return {
              ...order,
              status: 'completed',
              receiveTime: new Date().toLocaleString(),
              completeTime: new Date().toLocaleString(),
              items: order.items.map(item => {
                const received = receiveItems.find(r => r.productId === item.productId);
                return { ...item, receivedQuantity: received?.quantity || item.quantity };
              }),
            };
          }
          return order;
        }));

        setShowReceiveDialog(false);
        setReceiveOrder(null);
        
        toast.success('入库成功，库存已更新');
      } else {
        toast.error(result.error || '入库失败');
      }
    } catch (error) {
      console.error('入库失败:', error);
      toast.error('入库失败');
    }
  };

  // 从要货申请创建采购单
  const handleCreatePurchaseFromRequest = (request: any) => {
    // 将申请的商品添加到采购单
    const newItems: PurchaseItem[] = request.items.map((item: any) => {
      const product = productCatalog.find(p => p.productId === item.productId || p.id === item.productId);
      return {
        productId: item.productId,
        productName: item.productName,
        productIcon: item.productIcon || '📦',
        quantity: item.quantity,
        unit: item.unit,
        purchasePrice: product?.purchasePrice || 0,
        amount: (product?.purchasePrice || 0) * item.quantity,
      };
    });

    setOrderItems(newItems);
    setOrderRemark(`来自要货申请: ${request.requestNo} (${request.storeName})`);
    setShowCreateDialog(true);
    
    // 更新申请状态为处理中
    setPendingRequests(pendingRequests.filter(r => r.id !== request.id));
    toast.success(`已加载申请 ${request.requestNo} 的商品到采购单`);
  };

  // 根据供应商筛选可采购商品（如果商品没有供应商信息，则全部显示）
  const availableProducts = selectedSupplier 
    ? productCatalog.filter(p => p.supplierId === selectedSupplier || !p.supplierId)
    : productCatalog;

  // 统计数据
  const stats = {
    total: purchaseOrders.length,
    pending: purchaseOrders.filter(o => o.status === 'pending').length,
    approved: purchaseOrders.filter(o => o.status === 'approved').length,
    completed: purchaseOrders.filter(o => o.status === 'completed').length,
    totalAmount: purchaseOrders.reduce((sum, o) => sum + o.totalAmount, 0),
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader 
        title="总部采购管理" 
        description="向供应商采购进货，入库到总仓（中心仓库）" 
      />

      <div className="flex-1 overflow-auto p-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">采购单总数</div>
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
                  <div className="text-2xl font-bold">{stats.pending}</div>
                  <div className="text-xs text-muted-foreground">待审核</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.approved}</div>
                  <div className="text-xs text-muted-foreground">已审核待收货</div>
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
                  <div className="text-xs text-muted-foreground">已完成入库</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <DollarSign className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">¥{stats.totalAmount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">采购总金额</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="mb-4">
            <TabsTrigger value="orders">采购单管理</TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              待采购申请
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="stock">总仓库存</TabsTrigger>
          </TabsList>

          {/* 采购单管理 */}
          <TabsContent value="orders">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="搜索单号/供应商"
                        className="pl-9 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="状态筛选" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="pending">待审核</SelectItem>
                        <SelectItem value="approved">已审核</SelectItem>
                        <SelectItem value="completed">已完成</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    新建采购单
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>采购单号</TableHead>
                      <TableHead>供应商</TableHead>
                      <TableHead>商品数</TableHead>
                      <TableHead>总数量</TableHead>
                      <TableHead>总金额</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">{order.orderNo}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {order.supplierName}
                          </div>
                        </TableCell>
                        <TableCell>{order.items.length} 种</TableCell>
                        <TableCell>{order.totalQuantity}</TableCell>
                        <TableCell className="font-medium">¥{order.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{order.createTime}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowDetailDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {order.status === 'pending' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-blue-600"
                                onClick={() => approveOrder(order.id)}
                              >
                                审核
                              </Button>
                            )}
                            {order.status === 'approved' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-green-600"
                                onClick={() => openReceiveDialog(order)}
                              >
                                <ArrowDown className="h-4 w-4 mr-1" />
                                入库
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
          </TabsContent>

          {/* 待采购申请 */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">待采购的店铺要货申请</CardTitle>
                  <Badge variant="secondary">{pendingRequests.length} 条待处理</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingRequests ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-muted-foreground">加载中...</span>
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无待采购的申请
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>申请单号</TableHead>
                        <TableHead>申请店铺</TableHead>
                        <TableHead>商品明细</TableHead>
                        <TableHead>申请数量</TableHead>
                        <TableHead>申请时间</TableHead>
                        <TableHead>备注</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">{req.requestNo}</TableCell>
                          <TableCell>{req.storeName}</TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              {req.items.map((item: any, idx: number) => (
                                <div key={idx} className="text-sm">
                                  {item.productIcon} {item.productName} x {item.quantity}{item.unit}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{req.totalQuantity}</TableCell>
                          <TableCell>{req.createTime}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {req.remark || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleCreatePurchaseFromRequest(req)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              创建采购单
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 总仓库存 */}
          <TabsContent value="stock">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">总仓（中心仓库）库存</CardTitle>
                  <Badge variant="secondary">共 {centralStock.length} 种商品</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品</TableHead>
                      <TableHead>库存数量</TableHead>
                      <TableHead>单位</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {centralStock.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{item.icon}</span>
                            <span className="font-medium">{item.productName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-lg">{item.stock}</span>
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 新建采购单对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>新建采购单</DialogTitle>
            <DialogDescription>向供应商采购商品，入库到总仓</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>供应商</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择供应商" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {s.name}
                          <span className="text-muted-foreground text-xs">({s.contact})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>添加商品</Label>
                <Select onValueChange={addOrderItem}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingProducts ? "加载中..." : availableProducts.length === 0 ? "暂无商品" : "选择商品添加到采购单"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingProducts ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">加载中...</span>
                      </div>
                    ) : availableProducts.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        暂无商品，请先在总部商品库添加
                      </div>
                    ) : (
                      availableProducts
                        .filter(p => !orderItems.find(item => item.productId === p.id))
                        .map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            <div className="flex items-center gap-2">
                              <span>{p.icon}</span>
                              {p.name}
                              <span className="text-muted-foreground text-xs">(¥{p.purchasePrice.toFixed(2)}/{p.unit})</span>
                            </div>
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {orderItems.length > 0 && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品</TableHead>
                      <TableHead>单价</TableHead>
                      <TableHead>数量</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{item.productIcon}</span>
                            {item.productName}
                          </div>
                        </TableCell>
                        <TableCell>¥{item.purchasePrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            className="w-20"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">¥{item.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeOrderItem(item.productId)}>
                            ×
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-lg">
                合计：<span className="font-bold text-xl">¥{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <div>
              <Label>备注</Label>
              <Textarea
                placeholder="采购备注..."
                value={orderRemark}
                onChange={(e) => setOrderRemark(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetCreateForm(); }}>
              取消
            </Button>
            <Button onClick={submitPurchaseOrder}>
              提交采购单
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>采购单详情</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">采购单号</Label>
                  <div className="font-mono">{selectedOrder.orderNo}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">状态</Label>
                  <div>{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">供应商</Label>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {selectedOrder.supplierName}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">创建时间</Label>
                  <div>{selectedOrder.createTime}</div>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品</TableHead>
                      <TableHead>数量</TableHead>
                      <TableHead>单价</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>实收数量</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{item.productIcon}</span>
                            {item.productName}
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity} {item.unit}</TableCell>
                        <TableCell>¥{item.purchasePrice.toFixed(2)}</TableCell>
                        <TableCell>¥{item.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          {item.receivedQuantity !== undefined ? (
                            <span className="text-green-600 font-medium">{item.receivedQuantity}</span>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between text-lg">
                <span>合计金额：</span>
                <span className="font-bold">¥{selectedOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 入库对话框 */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>确认入库</DialogTitle>
            <DialogDescription>确认收货数量后入库到总仓</DialogDescription>
          </DialogHeader>
          
          {receiveOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>采购单号：{receiveOrder.orderNo}</span>
                <span>供应商：{receiveOrder.supplierName}</span>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品</TableHead>
                      <TableHead>采购数量</TableHead>
                      <TableHead>实收数量</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receiveOrder.items.map((item) => {
                      const received = receiveItems.find(r => r.productId === item.productId);
                      return (
                        <TableRow key={item.productId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{item.productIcon}</span>
                              {item.productName}
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity} {item.unit}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={item.quantity}
                              className="w-24"
                              value={received?.quantity || 0}
                              onChange={(e) => updateReceiveQuantity(item.productId, parseInt(e.target.value) || 0)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiveDialog(false)}>
              取消
            </Button>
            <Button onClick={confirmReceive}>
              <ArrowDown className="h-4 w-4 mr-2" />
              确认入库
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
