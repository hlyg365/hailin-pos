'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  Plus,
  Edit,
  Trash2,
  ArrowDown,
  ArrowUp,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  Truck,
  Calendar,
  User,
  Store,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// 库存记录类型
type StockRecordType = 'in' | 'out' | 'check' | 'loss';

interface StockRecord {
  id: string;
  productId: number;
  productName: string;
  recordType: StockRecordType;
  quantity: number;
  beforeStock: number;
  afterStock: number;
  reason: string;
  operator: string;
  time: string;
  supplier?: string;
  orderNo?: string;
  storeId: string;
  storeName: string;
}

// 供应商信息
interface Supplier {
  id: number;
  name: string;
  contact: string;
  phone: string;
  address: string;
  cooperationDate: string;
}

// 店铺信息
interface Store {
  id: string;
  name: string;
}

// 店铺列表
const stores: Store[] = [
  { id: 'store_001', name: '南山店' },
  { id: 'store_002', name: '福田店' },
  { id: 'store_003', name: '罗湖店' },
];

// 模拟库存记录数据
const mockStockRecords: StockRecord[] = [
  {
    id: 'SR001',
    productId: 1,
    productName: '矿泉水 500ml',
    recordType: 'in',
    quantity: 100,
    beforeStock: 50,
    afterStock: 150,
    reason: '采购入库',
    operator: '管理员',
    time: '2025-03-15 09:30',
    supplier: '可口可乐公司',
    orderNo: 'PO2025031501',
    storeId: 'store_001',
    storeName: '南山店',
  },
  {
    id: 'SR002',
    productId: 2,
    productName: '可乐 330ml',
    recordType: 'out',
    quantity: 50,
    beforeStock: 80,
    afterStock: 30,
    reason: '销售出库',
    operator: '收银员1',
    time: '2025-03-15 10:15',
    orderNo: 'ORD202503150001',
    storeId: 'store_001',
    storeName: '南山店',
  },
  {
    id: 'SR003',
    productId: 3,
    productName: '苹果 红富士',
    recordType: 'loss',
    quantity: 5,
    beforeStock: 20,
    afterStock: 15,
    reason: '损耗登记',
    operator: '管理员',
    time: '2025-03-14 15:20',
    storeId: 'store_002',
    storeName: '福田店',
  },
  {
    id: 'SR004',
    productId: 4,
    productName: '香蕉',
    recordType: 'check',
    quantity: -10,
    beforeStock: 60,
    afterStock: 50,
    reason: '盘点调整',
    operator: '管理员',
    time: '2025-03-14 14:00',
    storeId: 'store_003',
    storeName: '罗湖店',
  },
  {
    id: 'SR005',
    productId: 5,
    productName: '薯片',
    recordType: 'in',
    quantity: 50,
    beforeStock: 20,
    afterStock: 70,
    reason: '采购入库',
    operator: '管理员',
    time: '2025-03-14 11:00',
    supplier: '乐事公司',
    orderNo: 'PO2025031402',
    storeId: 'store_002',
    storeName: '福田店',
  },
];

// 模拟供应商数据
const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: '可口可乐公司',
    contact: '张经理',
    phone: '13800138001',
    address: '深圳市南山区',
    cooperationDate: '2023-01-01',
  },
  {
    id: 2,
    name: '农夫山泉',
    contact: '李经理',
    phone: '13800138002',
    address: '深圳市福田区',
    cooperationDate: '2023-03-15',
  },
];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<StockRecordType | 'all'>('all');
  const [filterStore, setFilterStore] = useState<string>('all');
  const [showInDialog, setShowInDialog] = useState(false);
  const [showOutDialog, setShowOutDialog] = useState(false);
  const [showLossDialog, setShowLossDialog] = useState(false);
  
  // 商品数据（从API加载）
  const [products, setProducts] = useState<{ id: string; name: string; stock: number; unit: string }[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  
  // 从API加载商品数据
  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await fetch('/api/store-products');
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          const productList: { id: string; name: string; stock: number; unit: string }[] = [];
          
          result.data.forEach((p: any) => {
            if (p.specs && p.specs.length > 0) {
              p.specs.forEach((spec: any) => {
                productList.push({
                  id: spec.barcode || `spec-${spec.id}`,
                  name: p.name + (p.specs.length > 1 ? ` (${spec.name})` : ''),
                  stock: spec.stock || 0,
                  unit: spec.unit || '个',
                });
              });
            } else {
              productList.push({
                id: p.id,
                name: p.name,
                stock: 0,
                unit: '个',
              });
            }
          });
          
          setProducts(productList);
          console.log('[库存管理] 已加载', productList.length, '个商品');
        }
      } catch (error) {
        console.error('[库存管理] 加载商品失败:', error);
      } finally {
        setLoadingProducts(false);
      }
    };
    
    loadProducts();
  }, []);

  // 筛选库存记录
  const filteredRecords = mockStockRecords.filter(record => {
    const matchesSearch = record.productName.includes(searchTerm) ||
                         record.operator.includes(searchTerm) ||
                         (record.orderNo && record.orderNo.includes(searchTerm));
    const matchesType = filterType === 'all' || record.recordType === filterType;
    const matchesStore = filterStore === 'all' || record.storeId === filterStore;
    return matchesSearch && matchesType && matchesStore;
  });

  // 获取记录类型标签
  const getRecordTypeBadge = (type: StockRecordType) => {
    const typeConfig = {
      in: { label: '入库', className: 'bg-green-500', icon: ArrowDown },
      out: { label: '出库', className: 'bg-blue-500', icon: ArrowUp },
      check: { label: '盘点', className: 'bg-purple-500', icon: ClipboardList },
      loss: { label: '损耗', className: 'bg-red-500', icon: AlertTriangle },
    };
    const config = typeConfig[type];
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // 统计数据
  const recordsForStats = filterStore === 'all' 
    ? mockStockRecords 
    : mockStockRecords.filter(r => r.storeId === filterStore);
    
  const stats = {
    totalRecords: recordsForStats.length,
    inRecords: recordsForStats.filter(r => r.recordType === 'in').length,
    outRecords: recordsForStats.filter(r => r.recordType === 'out').length,
    lossRecords: recordsForStats.filter(r => r.recordType === 'loss').length,
    totalSuppliers: mockSuppliers.length,
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader title="库存管理" description="管理商品库存、出入库记录、盘点与损耗" showStoreSelector={false}>
        <div className="flex items-center gap-2">
          <Select value={filterStore} onValueChange={setFilterStore}>
            <SelectTrigger className="w-32">
              <Store className="h-4 w-4 mr-1" />
              <SelectValue placeholder="选择店铺" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部店铺</SelectItem>
              {stores.map(store => (
                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalRecords}</div>
                  <div className="text-xs text-muted-foreground">库存记录</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <ArrowDown className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.inRecords}</div>
                  <div className="text-xs text-muted-foreground">入库次数</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <ArrowUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.outRecords}</div>
                  <div className="text-xs text-muted-foreground">出库次数</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.lossRecords}</div>
                  <div className="text-xs text-muted-foreground">损耗次数</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <Truck className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
                  <div className="text-xs text-muted-foreground">供应商</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 功能标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-4 pt-4">
            <TabsList>
              <TabsTrigger value="overview">库存记录</TabsTrigger>
              <TabsTrigger value="suppliers">供应商管理</TabsTrigger>
              <TabsTrigger value="check">盘点管理</TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-4">
            <TabsContent value="overview">
              {/* 操作栏 */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="搜索商品名称、操作员或单号"
                          className="pl-9"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={filterType === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('all')}
                      >
                        全部
                      </Button>
                      <Button
                        variant={filterType === 'in' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('in')}
                      >
                        入库
                      </Button>
                      <Button
                        variant={filterType === 'out' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('out')}
                      >
                        出库
                      </Button>
                      <Button
                        variant={filterType === 'check' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('check')}
                      >
                        盘点
                      </Button>
                      <Button
                        variant={filterType === 'loss' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('loss')}
                      >
                        损耗
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Dialog open={showInDialog} onOpenChange={setShowInDialog}>
                        <DialogTrigger asChild>
                          <Button>
                            <ArrowDown className="h-4 w-4 mr-2" />
                            入库
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>商品入库</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>选择商品</Label>
                              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                <SelectTrigger className="mt-2">
                                  <SelectValue placeholder={loadingProducts ? "加载中..." : products.length === 0 ? "暂无商品" : "请选择商品"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {loadingProducts ? (
                                    <div className="flex items-center justify-center py-4">
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      <span className="text-sm text-muted-foreground">加载中...</span>
                                    </div>
                                  ) : products.length === 0 ? (
                                    <div className="py-4 text-center text-sm text-muted-foreground">
                                      暂无商品，请先在总部商品库添加
                                    </div>
                                  ) : (
                                    products.map((product) => (
                                      <SelectItem key={product.id} value={product.id}>
                                        {product.name} (库存: {product.stock}{product.unit})
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>入库数量</Label>
                              <Input type="number" className="mt-2" placeholder="请输入入库数量" />
                            </div>
                            <div>
                              <Label>选择供应商</Label>
                              <Select>
                                <SelectTrigger className="mt-2">
                                  <SelectValue placeholder="请选择供应商" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">可口可乐公司</SelectItem>
                                  <SelectItem value="2">农夫山泉</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>入库原因</Label>
                              <Textarea className="mt-2" placeholder="请输入入库原因" />
                            </div>
                            <Button className="w-full">确认入库</Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showOutDialog} onOpenChange={setShowOutDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <ArrowUp className="h-4 w-4 mr-2" />
                            出库
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>商品出库</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>选择商品</Label>
                              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                <SelectTrigger className="mt-2">
                                  <SelectValue placeholder={loadingProducts ? "加载中..." : products.length === 0 ? "暂无商品" : "请选择商品"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {loadingProducts ? (
                                    <div className="flex items-center justify-center py-4">
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      <span className="text-sm text-muted-foreground">加载中...</span>
                                    </div>
                                  ) : products.length === 0 ? (
                                    <div className="py-4 text-center text-sm text-muted-foreground">
                                      暂无商品，请先在总部商品库添加
                                    </div>
                                  ) : (
                                    products.map((product) => (
                                      <SelectItem key={product.id} value={product.id}>
                                        {product.name} (库存: {product.stock}{product.unit})
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>出库数量</Label>
                              <Input type="number" className="mt-2" placeholder="请输入出库数量" />
                            </div>
                            <div>
                              <Label>出库原因</Label>
                              <Textarea className="mt-2" placeholder="请输入出库原因" />
                            </div>
                            <Button className="w-full">确认出库</Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showLossDialog} onOpenChange={setShowLossDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="text-red-500">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            损耗登记
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>损耗登记</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>选择商品</Label>
                              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                <SelectTrigger className="mt-2">
                                  <SelectValue placeholder={loadingProducts ? "加载中..." : products.length === 0 ? "暂无商品" : "请选择商品"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {loadingProducts ? (
                                    <div className="flex items-center justify-center py-4">
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      <span className="text-sm text-muted-foreground">加载中...</span>
                                    </div>
                                  ) : products.length === 0 ? (
                                    <div className="py-4 text-center text-sm text-muted-foreground">
                                      暂无商品，请先在总部商品库添加
                                    </div>
                                  ) : (
                                    products.map((product) => (
                                      <SelectItem key={product.id} value={product.id}>
                                        {product.name} (库存: {product.stock}{product.unit})
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>损耗数量</Label>
                              <Input type="number" className="mt-2" placeholder="请输入损耗数量" />
                            </div>
                            <div>
                              <Label>损耗原因</Label>
                              <Select>
                                <SelectTrigger className="mt-2">
                                  <SelectValue placeholder="请选择损耗原因" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="expired">过期</SelectItem>
                                  <SelectItem value="damaged">损坏</SelectItem>
                                  <SelectItem value="lost">丢失</SelectItem>
                                  <SelectItem value="other">其他</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>备注</Label>
                              <Textarea className="mt-2" placeholder="请输入备注信息" />
                            </div>
                            <Button className="w-full">确认登记</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 库存记录表格 */}
              <Card>
                <CardContent className="p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>商品</TableHead>
                        <TableHead>店铺</TableHead>
                        <TableHead>记录类型</TableHead>
                        <TableHead>变动数量</TableHead>
                        <TableHead>变动前库存</TableHead>
                        <TableHead>变动后库存</TableHead>
                        <TableHead>原因</TableHead>
                        <TableHead>供应商/单号</TableHead>
                        <TableHead>操作员</TableHead>
                        <TableHead>时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.productName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {record.storeName}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getRecordTypeBadge(record.recordType)}
                          </TableCell>
                          <TableCell>
                            <span className={record.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                              {record.quantity > 0 ? '+' : ''}{record.quantity}
                            </span>
                          </TableCell>
                          <TableCell>{record.beforeStock}</TableCell>
                          <TableCell className="font-bold">{record.afterStock}</TableCell>
                          <TableCell>{record.reason}</TableCell>
                          <TableCell>
                            <div>
                              {record.supplier && (
                                <div className="text-sm font-medium">{record.supplier}</div>
                              )}
                              {record.orderNo && (
                                <code className="text-xs bg-muted px-1 rounded">{record.orderNo}</code>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{record.operator}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{record.time}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suppliers">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>供应商管理</CardTitle>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      新增供应商
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>供应商名称</TableHead>
                        <TableHead>联系人</TableHead>
                        <TableHead>联系电话</TableHead>
                        <TableHead>地址</TableHead>
                        <TableHead>合作日期</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockSuppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>{supplier.contact}</TableCell>
                          <TableCell>{supplier.phone}</TableCell>
                          <TableCell>{supplier.address}</TableCell>
                          <TableCell>{supplier.cooperationDate}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="check">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <ClipboardList className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">盘点管理</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      支持全盘、抽盘、动态盘点等多种盘点方式
                    </p>
                    <div className="flex justify-center gap-4">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        开始盘点
                      </Button>
                      <Button variant="outline">
                        查看盘点记录
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </CardContent>
        </Tabs>
      </div>
    </div>
  );
}
