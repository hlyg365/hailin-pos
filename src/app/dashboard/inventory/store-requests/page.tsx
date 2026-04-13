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
  Search,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Store,
  FileText,
  ShoppingCart,
  Truck,
  ArrowRight,
  Warehouse,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// 店铺列表
const stores = [
  { id: 'store_001', name: '南山店', address: '深圳市南山区科技园' },
  { id: 'store_002', name: '福田店', address: '深圳市福田区华强北' },
  { id: 'store_003', name: '罗湖店', address: '深圳市罗湖区东门' },
  { id: 'store_004', name: '宝安店', address: '深圳市宝安区西乡' },
];

// 总仓库存接口
interface CentralStockItem {
  productId: string;
  productName: string;
  icon: string;
  stock: number;
  unit: string;
}

// 店铺采购申请接口
interface StorePurchaseRequest {
  id: string;
  requestNo: string;
  storeId: string;
  storeName: string;
  items: RequestItem[];
  totalQuantity: number;
  status: 'pending' | 'approved' | 'processing' | 'shipped' | 'received' | 'rejected' | 'purchase_pending';
  remark?: string;
  createTime: string;
  approveTime?: string;
  shipTime?: string;
  receiveTime?: string;
  relatedSalesOrder?: string;  // 关联的销售单/调拨单
  relatedDeliveryOrder?: string; // 关联的送货单
}

interface RequestItem {
  productId: string;
  productName: string;
  productIcon: string;
  quantity: number;
  unit: string;
  approvedQuantity?: number;
  shippedQuantity?: number;
  receivedQuantity?: number;
}

// 销售单/调拨单接口
interface SalesOrder {
  id: string;
  orderNo: string;
  type: 'sales' | 'transfer';
  storeId: string;
  storeName: string;
  items: OrderItem[];
  totalQuantity: number;
  status: 'pending' | 'confirmed' | 'outbound' | 'shipped';
  relatedRequest?: string;
  createTime: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  productIcon: string;
  quantity: number;
  unit: string;
}

// 送货单接口
interface DeliveryOrder {
  id: string;
  deliveryNo: string;
  storeId: string;
  storeName: string;
  items: OrderItem[];
  totalQuantity: number;
  status: 'pending' | 'in_transit' | 'delivered';
  driver?: string;
  driverPhone?: string;
  createTime: string;
  deliveryTime?: string;
}

// 模拟销售单数据
const mockSalesOrders: SalesOrder[] = [
  {
    id: 'SO001',
    orderNo: 'SO202503170001',
    type: 'sales',
    storeId: 'store_002',
    storeName: '福田店',
    items: [
      { productId: 'P003', productName: '雪碧 330ml', productIcon: '🧃', quantity: 40, unit: '罐' },
      { productId: 'P004', productName: '牛奶 250ml', productIcon: '🥛', quantity: 20, unit: '盒' },
    ],
    totalQuantity: 60,
    status: 'confirmed',
    relatedRequest: 'REQ202503170002',
    createTime: '2025-03-17 10:30',
  },
  {
    id: 'SO002',
    orderNo: 'SO202503160001',
    type: 'sales',
    storeId: 'store_003',
    storeName: '罗湖店',
    items: [
      { productId: 'P005', productName: '酸奶 200ml', productIcon: '🥛', quantity: 30, unit: '盒' },
    ],
    totalQuantity: 30,
    status: 'shipped',
    relatedRequest: 'REQ202503170003',
    createTime: '2025-03-16 14:30',
  },
];

// 模拟送货单数据
const mockDeliveryOrders: DeliveryOrder[] = [
  {
    id: 'DLV001',
    deliveryNo: 'DLV202503160001',
    storeId: 'store_003',
    storeName: '罗湖店',
    items: [
      { productId: 'P005', productName: '酸奶 200ml', productIcon: '🥛', quantity: 30, unit: '盒' },
    ],
    totalQuantity: 30,
    status: 'in_transit',
    driver: '张师傅',
    driverPhone: '13900139000',
    createTime: '2025-03-16 16:00',
  },
];

export default function StoreRequestPage() {
  const [requests, setRequests] = useState<StorePurchaseRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(mockSalesOrders);
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>(mockDeliveryOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // 总仓库存（从API加载）
  const [centralStock, setCentralStock] = useState<CentralStockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  
  // 详情对话框
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StorePurchaseRequest | null>(null);
  
  // 审核对话框
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approveRequest, setApproveRequest] = useState<StorePurchaseRequest | null>(null);
  const [approveItems, setApproveItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [orderType, setOrderType] = useState<'sales' | 'transfer'>('sales');

  // 加载采购申请数据
  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await fetch('/api/store-requests');
      const result = await response.json();
      
      if (result.success && result.data) {
        // 转换数据库格式为前端格式
        const formattedRequests: StorePurchaseRequest[] = result.data.map((req: any) => ({
          id: req.id,
          requestNo: req.request_no || req.requestNo,
          storeId: req.store_id || req.storeId,
          storeName: req.store_name || req.storeName,
          items: (req.items || []).map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            productIcon: item.productIcon || '',
            quantity: item.quantity,
            unit: item.unit,
            approvedQuantity: item.approvedQuantity,
            shippedQuantity: item.shippedQuantity,
            receivedQuantity: item.receivedQuantity,
          })),
          totalQuantity: req.total_quantity || req.totalQuantity || 0,
          status: req.status,
          remark: req.remark,
          createTime: req.create_time || req.createTime,
          approveTime: req.approve_time || req.approveTime,
          shipTime: req.ship_time || req.shipTime,
          receiveTime: req.receive_time || req.receiveTime,
          relatedSalesOrder: req.related_sales_order || req.relatedSalesOrder,
          relatedDeliveryOrder: req.related_delivery_order || req.relatedDeliveryOrder,
        }));
        setRequests(formattedRequests);
        console.log('[要货申请] 已加载', formattedRequests.length, '条申请记录');
      }
    } catch (error) {
      console.error('[要货申请] 加载失败:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // 加载总仓库存
  useEffect(() => {
    const loadStock = async () => {
      setLoadingStock(true);
      try {
        const response = await fetch('/api/central-stock');
        const result = await response.json();
        
        if (result.success && result.data) {
          setCentralStock(result.data);
          console.log('[要货申请] 已加载', result.data.length, '个库存商品');
        }
      } catch (error) {
        console.error('[要货申请] 加载库存失败:', error);
      } finally {
        setLoadingStock(false);
      }
    };
    
    loadStock();
  }, []);

  // 初始加载采购申请
  useEffect(() => {
    loadRequests();
  }, []);

  // 筛选采购申请
  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.requestNo.includes(searchTerm) || 
                         req.storeName.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: '待审核', className: 'bg-yellow-100 text-yellow-600' },
      approved: { label: '已审核', className: 'bg-blue-100 text-blue-600' },
      processing: { label: '处理中', className: 'bg-purple-100 text-purple-600' },
      shipped: { label: '已发货', className: 'bg-cyan-100 text-cyan-600' },
      received: { label: '已收货', className: 'bg-green-100 text-green-600' },
      rejected: { label: '已拒绝', className: 'bg-red-100 text-red-600' },
      purchase_pending: { label: '待采购', className: 'bg-orange-100 text-orange-600' },
    };
    const { label, className } = config[status] || { label: status, className: '' };
    return <Badge className={className}>{label}</Badge>;
  };

  // 打开审核对话框
  const openApproveDialog = (request: StorePurchaseRequest) => {
    setApproveRequest(request);
    setApproveItems(request.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
    })));
    setOrderType('sales');
    setShowApproveDialog(true);
  };

  // 更新审核数量
  const updateApproveQuantity = (productId: string, quantity: number) => {
    setApproveItems(approveItems.map(item => 
      item.productId === productId ? { ...item, quantity } : item
    ));
  };

  // 确认审核 - 生成销售单/调拨单
  const confirmApprove = async () => {
    if (!approveRequest) return;

    try {
      // 准备出库数据
      const stockItems = approveRequest.items.map(item => {
        const approved = approveItems.find(a => a.productId === item.productId);
        return {
          productId: item.productId,
          productName: item.productName,
          quantity: approved?.quantity || item.quantity,
        };
      }).filter(item => item.quantity > 0);

      // 调用API出库
      const response = await fetch('/api/central-stock', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: stockItems }),
      });

      const result = await response.json();

      if (result.success) {
        // 更新本地库存状态
        const updatedStock = centralStock.map(item => {
          const stockItem = stockItems.find(s => s.productId === item.productId);
          if (stockItem) {
            return { ...item, stock: Math.max(0, item.stock - stockItem.quantity) };
          }
          return item;
        });
        setCentralStock(updatedStock);

        // 创建销售单/调拨单
        const salesOrderNo = `SO${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(salesOrders.length + 1).padStart(4, '0')}`;
        const newSalesOrder: SalesOrder = {
          id: `SO${Date.now()}`,
          orderNo: salesOrderNo,
          type: orderType,
          storeId: approveRequest.storeId,
          storeName: approveRequest.storeName,
          items: approveRequest.items.map(item => {
            const approved = approveItems.find(a => a.productId === item.productId);
            return {
              ...item,
              quantity: approved?.quantity || item.quantity,
            };
          }).filter(item => item.quantity > 0),
          totalQuantity: approveItems.reduce((sum, item) => sum + item.quantity, 0),
          status: 'confirmed',
          relatedRequest: approveRequest.requestNo,
          createTime: new Date().toLocaleString(),
        };

        setSalesOrders([newSalesOrder, ...salesOrders]);

        // 更新采购申请状态到数据库
        await fetch('/api/store-requests', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId: approveRequest.id,
            status: 'approved',
            approvedItems: approveRequest.items.map(item => {
              const approved = approveItems.find(a => a.productId === item.productId);
              return {
                ...item,
                approvedQuantity: approved?.quantity || 0,
              };
            }),
          }),
        });

        // 更新本地状态
        setRequests(requests.map(req => 
          req.id === approveRequest.id 
            ? { 
                ...req, 
                status: 'approved',
                approveTime: new Date().toLocaleString(),
                relatedSalesOrder: salesOrderNo,
                items: req.items.map(item => {
                  const approved = approveItems.find(a => a.productId === item.productId);
                  return { ...item, approvedQuantity: approved?.quantity || 0 };
                }),
              } 
            : req
        ));

        setShowApproveDialog(false);
        setApproveRequest(null);
        
        toast.success('审核通过，库存已扣减');
      } else {
        toast.error(result.error || '出库失败');
      }
    } catch (error) {
      console.error('审核失败:', error);
      toast.error('审核失败');
    }
  };

  // 转采购 - 标记为需要采购
  const handleTransferToPurchase = async () => {
    if (!approveRequest) return;

    try {
      // 调用API更新状态
      await fetch('/api/store-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: approveRequest.id,
          status: 'purchase_pending',
        }),
      });

      // 更新本地状态
      setRequests(requests.map(req => 
        req.id === approveRequest.id 
          ? { 
              ...req, 
              status: 'purchase_pending' as const,
              remark: '总仓库存不足，需要向供应商采购',
              approveTime: new Date().toLocaleString(),
            } 
          : req
      ));

      setShowApproveDialog(false);
      setApproveRequest(null);
      
      toast.success(`申请 ${approveRequest.requestNo} 已转至采购管理`);
    } catch (error) {
      console.error('转采购失败:', error);
      toast.error('操作失败');
    }
  };

  // 拒绝采购申请
  const rejectRequest = async (requestId: string) => {
    try {
      // 调用API更新状态
      const response = await fetch('/api/store-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          status: 'rejected',
        }),
      });
      
      if (response.ok) {
        setRequests(requests.map(req => 
          req.id === requestId ? { ...req, status: 'rejected' } : req
        ));
        toast.success('已拒绝该申请');
      } else {
        toast.error('操作失败');
      }
    } catch (error) {
      console.error('拒绝申请失败:', error);
      toast.error('操作失败');
    }
  };

  // 统计数据
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    shipped: requests.filter(r => r.status === 'shipped').length,
    received: requests.filter(r => r.status === 'received').length,
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader 
        title="店铺采购申请" 
        description="审核店铺采购申请，生成销售单或调拨单，安排配送" 
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
                  <div className="text-xs text-muted-foreground">申请总数</div>
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
                  <div className="text-xs text-muted-foreground">已审核待发货</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100">
                  <Truck className="h-5 w-5 text-cyan-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.shipped}</div>
                  <div className="text-xs text-muted-foreground">配送中</div>
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
                  <div className="text-2xl font-bold">{stats.received}</div>
                  <div className="text-xs text-muted-foreground">已完成</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests">
          <TabsList className="mb-4">
            <TabsTrigger value="requests">采购申请</TabsTrigger>
            <TabsTrigger value="sales">销售/调拨单</TabsTrigger>
            <TabsTrigger value="delivery">送货单</TabsTrigger>
          </TabsList>

          {/* 采购申请列表 */}
          <TabsContent value="requests">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索单号/店铺"
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
                      <SelectItem value="shipped">已发货</SelectItem>
                      <SelectItem value="received">已收货</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>申请单号</TableHead>
                      <TableHead>申请店铺</TableHead>
                      <TableHead>商品数</TableHead>
                      <TableHead>总数量</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>关联单据</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono">{request.requestNo}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            {request.storeName}
                          </div>
                        </TableCell>
                        <TableCell>{request.items.length} 种</TableCell>
                        <TableCell>{request.totalQuantity}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          {request.relatedSalesOrder && (
                            <div className="text-xs">
                              <Badge variant="outline">{request.relatedSalesOrder}</Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{request.createTime}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDetailDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {request.status === 'pending' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-blue-600"
                                  onClick={() => openApproveDialog(request)}
                                >
                                  审核
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => rejectRequest(request.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
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

          {/* 销售/调拨单列表 */}
          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">销售/调拨单</CardTitle>
                  <Badge variant="secondary">共 {salesOrders.length} 单</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>单号</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>目标店铺</TableHead>
                      <TableHead>商品数</TableHead>
                      <TableHead>总数量</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>关联申请</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">{order.orderNo}</TableCell>
                        <TableCell>
                          <Badge variant={order.type === 'sales' ? 'default' : 'secondary'}>
                            {order.type === 'sales' ? '销售单' : '调拨单'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            {order.storeName}
                          </div>
                        </TableCell>
                        <TableCell>{order.items.length} 种</TableCell>
                        <TableCell>{order.totalQuantity}</TableCell>
                        <TableCell>
                          <Badge className={
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-600' :
                            order.status === 'outbound' ? 'bg-purple-100 text-purple-600' :
                            'bg-green-100 text-green-600'
                          }>
                            {order.status === 'confirmed' ? '已确认' : 
                             order.status === 'outbound' ? '已出库' : '已发货'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.relatedRequest && (
                            <code className="text-xs bg-muted px-2 py-1 rounded">{order.relatedRequest}</code>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{order.createTime}</TableCell>
                        <TableCell>
                          {order.status === 'confirmed' && (
                            <Button variant="outline" size="sm" className="text-green-600">
                              <Warehouse className="h-4 w-4 mr-1" />
                              出库
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 送货单列表 */}
          <TabsContent value="delivery">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">送货单</CardTitle>
                  <Badge variant="secondary">共 {deliveryOrders.length} 单</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>送货单号</TableHead>
                      <TableHead>目标店铺</TableHead>
                      <TableHead>商品数</TableHead>
                      <TableHead>总数量</TableHead>
                      <TableHead>配送员</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>创建时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveryOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">{order.deliveryNo}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            {order.storeName}
                          </div>
                        </TableCell>
                        <TableCell>{order.items.length} 种</TableCell>
                        <TableCell>{order.totalQuantity}</TableCell>
                        <TableCell>
                          {order.driver && (
                            <div className="text-sm">
                              {order.driver}
                              <div className="text-xs text-muted-foreground">{order.driverPhone}</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                            order.status === 'in_transit' ? 'bg-cyan-100 text-cyan-600' :
                            'bg-green-100 text-green-600'
                          }>
                            {order.status === 'pending' ? '待配送' : 
                             order.status === 'in_transit' ? '配送中' : '已送达'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{order.createTime}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>采购申请详情</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">申请单号</Label>
                  <div className="font-mono">{selectedRequest.requestNo}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">状态</Label>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">申请店铺</Label>
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    {selectedRequest.storeName}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">创建时间</Label>
                  <div>{selectedRequest.createTime}</div>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品</TableHead>
                      <TableHead>申请数量</TableHead>
                      <TableHead>审核数量</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRequest.items.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{item.productIcon}</span>
                            {item.productName}
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity} {item.unit}</TableCell>
                        <TableCell>
                          {item.approvedQuantity !== undefined ? (
                            <span className="font-medium">{item.approvedQuantity}</span>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedRequest.remark && (
                <div>
                  <Label className="text-muted-foreground">备注</Label>
                  <div className="text-sm bg-muted/50 p-2 rounded">{selectedRequest.remark}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 审核对话框 */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>审核采购申请</DialogTitle>
            <DialogDescription>确认商品数量后生成销售单或调拨单</DialogDescription>
          </DialogHeader>
          
          {approveRequest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-muted-foreground">申请店铺</Label>
                  <div className="flex items-center gap-2 font-medium">
                    <Store className="h-4 w-4" />
                    {approveRequest.storeName}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">单据类型</Label>
                  <Select value={orderType} onValueChange={(v) => setOrderType(v as 'sales' | 'transfer')}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">销售单</SelectItem>
                      <SelectItem value="transfer">调拨单</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品</TableHead>
                      <TableHead>总仓库存</TableHead>
                      <TableHead>申请数量</TableHead>
                      <TableHead>审核数量</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approveRequest.items.map((item) => {
                      const stock = centralStock.find(s => s.productId === item.productId);
                      const approved = approveItems.find(a => a.productId === item.productId);
                      return (
                        <TableRow key={item.productId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{item.productIcon}</span>
                              {item.productName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={stock && stock.stock < item.quantity ? 'text-red-500' : 'text-green-600'}>
                              {stock?.stock || 0}
                            </span>
                          </TableCell>
                          <TableCell>{item.quantity} {item.unit}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={item.quantity}
                              className="w-24"
                              value={approved?.quantity || 0}
                              onChange={(e) => updateApproveQuantity(item.productId, parseInt(e.target.value) || 0)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="text-sm text-muted-foreground">
                <ArrowRight className="h-4 w-4 inline mr-1" />
                审核通过后将生成{orderType === 'sales' ? '销售单' : '调拨单'}，并从总仓扣减库存
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              取消
            </Button>
            <Button variant="secondary" onClick={handleTransferToPurchase}>
              <Package className="h-4 w-4 mr-2" />
              转采购
            </Button>
            <Button onClick={confirmApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              确认审核
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
