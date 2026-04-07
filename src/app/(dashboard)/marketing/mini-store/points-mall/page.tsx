'use client';

import { useState, useEffect } from 'react';
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
  Smartphone,
  Gift,
  Star,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  CreditCard,
  TrendingUp,
  Users,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Sparkles,
  Award,
  Crown,
  Zap,
  Database,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// 商品类型
type ProductType = 'physical' | 'virtual' | 'coupon';

// 商品状态
type ProductStatus = 'active' | 'inactive' | 'soldout';

// 兑换订单状态
type ExchangeStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

// 积分商品数据类型
interface PointsProduct {
  id: string;
  name: string;
  image: string;
  description: string;
  type: ProductType;
  points: number; // 所需积分
  originalPrice?: number; // 原价（参考）
  stock: number; // 库存
  totalStock: number; // 总库存
  exchangedCount: number; // 已兑换数量
  status: ProductStatus;
  limitPerUser: number; // 每人限兑数量
  category: string;
  sort: number;
  createTime: string;
}

// 兑换记录数据类型
interface ExchangeRecord {
  id: string;
  orderNo: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  memberLevel: string;
  product: {
    id: string;
    name: string;
    image: string;
    type: ProductType;
  };
  points: number;
  quantity: number;
  totalPoints: number;
  status: ExchangeStatus;
  // 配送信息（实物商品）
  deliveryAddress?: string;
  deliveryTime?: string;
  // 虚拟商品信息
  virtualCode?: string;
  virtualExpiry?: string;
  // 优惠券信息
  couponId?: string;
  couponExpiry?: string;
  remark?: string;
  createTime: string;
  completeTime?: string;
}

// 商品分类
const categories = [
  { id: 'all', name: '全部' },
  { id: 'daily', name: '日用百货' },
  { id: 'food', name: '美食零食' },
  { id: 'electronics', name: '数码小家电' },
  { id: 'coupon', name: '优惠券' },
  { id: 'virtual', name: '虚拟商品' },
];

// 商品类型配置
const productTypeConfig: Record<ProductType, { label: string; color: string }> = {
  physical: { label: '实物商品', color: 'bg-blue-100 text-blue-700' },
  virtual: { label: '虚拟商品', color: 'bg-purple-100 text-purple-700' },
  coupon: { label: '优惠券', color: 'bg-orange-100 text-orange-700' },
};

// 兑换状态配置
const exchangeStatusConfig: Record<ExchangeStatus, { label: string; color: string; icon: any }> = {
  pending: { label: '待处理', color: 'bg-yellow-500', icon: Clock },
  processing: { label: '处理中', color: 'bg-blue-500', icon: RefreshCw },
  completed: { label: '已完成', color: 'bg-green-500', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'bg-gray-500', icon: XCircle },
};

// 总部商品库商品类型
interface HeadquartersProduct {
  id: string;
  barcode: string;
  name: string;
  brand?: string;
  category: string;
  specification?: string;
  unit: string;
  suggested_price: number;
  description?: string;
  manufacturer?: string;
  origin?: string;
  image_url?: string;
  status: string;
  usage_count: number;
}

export default function PointsMallPage() {
  // 积分商品数据
  const [products, setProducts] = useState<PointsProduct[]>([
    {
      id: 'pp_001',
      name: '洗衣液 3kg装',
      image: '🧴',
      description: '高品质洗衣液，温和不伤手',
      type: 'physical',
      points: 500,
      originalPrice: 39.9,
      stock: 150,
      totalStock: 200,
      exchangedCount: 50,
      status: 'active',
      limitPerUser: 5,
      category: 'daily',
      sort: 1,
      createTime: '2026-03-01 10:00:00',
    },
    {
      id: 'pp_002',
      name: '进口零食大礼包',
      image: '🎁',
      description: '精选进口零食，美味共享',
      type: 'physical',
      points: 800,
      originalPrice: 68.0,
      stock: 80,
      totalStock: 100,
      exchangedCount: 20,
      status: 'active',
      limitPerUser: 3,
      category: 'food',
      sort: 2,
      createTime: '2026-03-05 14:30:00',
    },
    {
      id: 'pp_003',
      name: '满50减10优惠券',
      image: '🎫',
      description: '全场通用，满50元减10元',
      type: 'coupon',
      points: 200,
      originalPrice: 10,
      stock: 999,
      totalStock: 999,
      exchangedCount: 356,
      status: 'active',
      limitPerUser: 10,
      category: 'coupon',
      sort: 3,
      createTime: '2026-03-10 09:00:00',
    },
    {
      id: 'pp_004',
      name: '视频会员月卡',
      image: '📱',
      description: '爱奇艺/腾讯视频会员月卡任选',
      type: 'virtual',
      points: 600,
      originalPrice: 25,
      stock: 50,
      totalStock: 100,
      exchangedCount: 50,
      status: 'active',
      limitPerUser: 2,
      category: 'virtual',
      sort: 4,
      createTime: '2026-03-08 11:20:00',
    },
    {
      id: 'pp_005',
      name: '便携蓝牙音箱',
      image: '🔊',
      description: '迷你便携，音质出色',
      type: 'physical',
      points: 1500,
      originalPrice: 129,
      stock: 30,
      totalStock: 50,
      exchangedCount: 20,
      status: 'active',
      limitPerUser: 1,
      category: 'electronics',
      sort: 5,
      createTime: '2026-03-12 16:45:00',
    },
    {
      id: 'pp_006',
      name: '新鲜水果券',
      image: '🍎',
      description: '店内任意水果满30减15',
      type: 'coupon',
      points: 300,
      originalPrice: 15,
      stock: 200,
      totalStock: 300,
      exchangedCount: 100,
      status: 'active',
      limitPerUser: 5,
      category: 'coupon',
      sort: 6,
      createTime: '2026-03-15 08:00:00',
    },
  ]);

  // 兑换记录数据
  const [exchangeRecords, setExchangeRecords] = useState<ExchangeRecord[]>([
    {
      id: 'er_001',
      orderNo: 'EX202603170001',
      memberId: 'M001',
      memberName: '张三',
      memberPhone: '138****8001',
      memberLevel: 'diamond',
      product: { id: 'pp_001', name: '洗衣液 3kg装', image: '🧴', type: 'physical' },
      points: 500,
      quantity: 2,
      totalPoints: 1000,
      status: 'completed',
      deliveryAddress: '深圳市南山区海邻小区A栋301',
      deliveryTime: '2026-03-17 15:30:00',
      createTime: '2026-03-17 10:23:45',
      completeTime: '2026-03-17 15:30:00',
    },
    {
      id: 'er_002',
      orderNo: 'EX202603170002',
      memberId: 'M002',
      memberName: '李四',
      memberPhone: '139****8002',
      memberLevel: 'silver',
      product: { id: 'pp_003', name: '满50减10优惠券', image: '🎫', type: 'coupon' },
      points: 200,
      quantity: 1,
      totalPoints: 200,
      status: 'completed',
      couponId: 'CPN202603170001',
      couponExpiry: '2026-04-17',
      createTime: '2026-03-17 11:15:20',
      completeTime: '2026-03-17 11:15:20',
    },
    {
      id: 'er_003',
      orderNo: 'EX202603170003',
      memberId: 'M001',
      memberName: '张三',
      memberPhone: '138****8001',
      memberLevel: 'diamond',
      product: { id: 'pp_004', name: '视频会员月卡', image: '📱', type: 'virtual' },
      points: 600,
      quantity: 1,
      totalPoints: 600,
      status: 'processing',
      virtualCode: '待生成',
      createTime: '2026-03-17 14:20:00',
    },
    {
      id: 'er_004',
      orderNo: 'EX202603170004',
      memberId: 'M003',
      memberName: '王五',
      memberPhone: '137****8003',
      memberLevel: 'gold',
      product: { id: 'pp_002', name: '进口零食大礼包', image: '🎁', type: 'physical' },
      points: 800,
      quantity: 1,
      totalPoints: 800,
      status: 'pending',
      deliveryAddress: '深圳市南山区海邻小区C栋502',
      createTime: '2026-03-17 14:45:30',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<PointsProduct | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ExchangeRecord | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<PointsProduct>>({});
  
  // 总部商品库相关状态
  const [productLibraryOpen, setProductLibraryOpen] = useState(false);
  const [headquartersProducts, setHeadquartersProducts] = useState<HeadquartersProduct[]>([]);
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [libraryLoading, setLibraryLoading] = useState(false);

  // 获取总部商品库数据
  const fetchHeadquartersProducts = async (searchName?: string) => {
    setLibraryLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchName) {
        params.append('name', searchName);
      }
      const response = await fetch(`/api/headquarters/products?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setHeadquartersProducts(result.data || []);
      } else {
        toast.error('获取商品库失败');
      }
    } catch (error) {
      console.error('获取总部商品库失败:', error);
      toast.error('获取商品库失败');
    } finally {
      setLibraryLoading(false);
    }
  };

  // 从商品库选择商品
  const handleSelectFromLibrary = (hqProduct: HeadquartersProduct) => {
    setFormData({
      name: hqProduct.name,
      image: '📦',
      description: hqProduct.description || `${hqProduct.brand || ''} ${hqProduct.specification || ''}`.trim(),
      type: 'physical',
      points: Math.round((hqProduct.suggested_price || 10) * 10), // 按价格估算积分
      originalPrice: hqProduct.suggested_price,
      stock: 100,
      totalStock: 100,
      status: 'active',
      limitPerUser: 5,
      category: 'daily',
      sort: 0,
    });
    setProductLibraryOpen(false);
    setProductDialogOpen(true);
    toast.success(`已选择: ${hqProduct.name}`, { description: '请补充积分和库存信息' });
  };

  // 打开商品库选择对话框
  const handleOpenProductLibrary = () => {
    setProductLibraryOpen(true);
    fetchHeadquartersProducts();
  };

  // 统计数据
  const stats = {
    totalProducts: products.filter(p => p.status === 'active').length,
    totalExchanged: products.reduce((sum, p) => sum + p.exchangedCount, 0),
    todayExchanged: exchangeRecords.filter(r => r.createTime.startsWith('2026-03-17')).length,
    pendingRecords: exchangeRecords.filter(r => r.status === 'pending' || r.status === 'processing').length,
  };

  // 过滤商品
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.includes(searchQuery);
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // 过滤记录
  const filteredRecords = exchangeRecords.filter(record => {
    const matchesSearch = record.orderNo.includes(searchQuery) ||
      record.memberName.includes(searchQuery) ||
      record.memberPhone.includes(searchQuery);
    return matchesSearch;
  });

  // 打开商品编辑对话框
  const handleEditProduct = (product: PointsProduct | null) => {
    setSelectedProduct(product);
    if (product) {
      setFormData({ ...product });
    } else {
      setFormData({
        name: '',
        image: '🎁',
        description: '',
        type: 'physical',
        points: 100,
        stock: 100,
        totalStock: 100,
        status: 'active',
        limitPerUser: 5,
        category: 'daily',
        sort: 0,
      });
    }
    setProductDialogOpen(true);
  };

  // 保存商品
  const handleSaveProduct = () => {
    if (selectedProduct) {
      setProducts(products.map(p => 
        p.id === selectedProduct.id ? { ...p, ...formData } as PointsProduct : p
      ));
    } else {
      const newProduct: PointsProduct = {
        id: `pp_${Date.now()}`,
        name: formData.name || '',
        image: formData.image || '🎁',
        description: formData.description || '',
        type: formData.type as ProductType || 'physical',
        points: formData.points || 100,
        originalPrice: formData.originalPrice,
        stock: formData.stock || 100,
        totalStock: formData.totalStock || 100,
        exchangedCount: 0,
        status: formData.status as ProductStatus || 'active',
        limitPerUser: formData.limitPerUser || 5,
        category: formData.category || 'daily',
        sort: formData.sort || 0,
        createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
      setProducts([...products, newProduct]);
    }
    setProductDialogOpen(false);
  };

  // 处理兑换记录
  const handleProcessRecord = (record: ExchangeRecord) => {
    setExchangeRecords(exchangeRecords.map(r => 
      r.id === record.id 
        ? { 
            ...r, 
            status: 'processing' as ExchangeStatus,
          } 
        : r
    ));
  };

  // 完成兑换
  const handleCompleteRecord = (record: ExchangeRecord) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setExchangeRecords(exchangeRecords.map(r => 
      r.id === record.id 
        ? { 
            ...r, 
            status: 'completed' as ExchangeStatus,
            completeTime: now,
            // 如果是虚拟商品，生成兑换码
            ...(r.product.type === 'virtual' && { virtualCode: `VC${Date.now()}` }),
            // 如果是优惠券，生成优惠券ID
            ...(r.product.type === 'coupon' && { couponId: `CPN${Date.now()}`, couponExpiry: '2026-04-17' }),
          } 
        : r
    ));
  };

  // 查看记录详情
  const handleViewRecord = (record: ExchangeRecord) => {
    setSelectedRecord(record);
    setRecordDialogOpen(true);
  };

  // 获取商品类型徽章
  const getProductTypeBadge = (type: ProductType) => {
    const config = productTypeConfig[type];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // 获取兑换状态徽章
  const getExchangeStatusBadge = (status: ExchangeStatus) => {
    const config = exchangeStatusConfig[status];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="积分商城" description="管理积分兑换商品和兑换记录">
        <Button variant="outline">
          <Package className="h-4 w-4 mr-2" />
          导出记录
        </Button>
        <Button variant="outline" onClick={handleOpenProductLibrary}>
          <Database className="h-4 w-4 mr-2" />
          从商品库选择
        </Button>
        <Button onClick={() => handleEditProduct(null)}>
          <Plus className="h-4 w-4 mr-2" />
          手动添加
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Gift className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalProducts}</p>
                    <p className="text-sm text-muted-foreground">可兑换商品</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalExchanged}</p>
                    <p className="text-sm text-muted-foreground">累计兑换</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.todayExchanged}</p>
                    <p className="text-sm text-muted-foreground">今日兑换</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pendingRecords}</p>
                    <p className="text-sm text-muted-foreground">待处理</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="products" className="space-y-4">
            <TabsList>
              <TabsTrigger value="products">
                <Gift className="h-4 w-4 mr-2" />
                兑换商品
              </TabsTrigger>
              <TabsTrigger value="records">
                <ShoppingCart className="h-4 w-4 mr-2" />
                兑换记录
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Smartphone className="h-4 w-4 mr-2" />
                商城预览
              </TabsTrigger>
            </TabsList>

            {/* 商品管理 */}
            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>兑换商品列表</CardTitle>
                  <CardDescription>管理可用积分兑换的商品</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* 筛选条件 */}
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="搜索商品名称..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="分类" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="active">上架中</SelectItem>
                        <SelectItem value="inactive">已下架</SelectItem>
                        <SelectItem value="soldout">已售罄</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>商品信息</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>所需积分</TableHead>
                        <TableHead>库存</TableHead>
                        <TableHead>已兑换</TableHead>
                        <TableHead>限兑数量</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map(product => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{product.image}</span>
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-xs text-muted-foreground">{product.description}</p>
                                {product.originalPrice && (
                                  <p className="text-xs text-muted-foreground">参考价：¥{product.originalPrice}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getProductTypeBadge(product.type)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-orange-500" />
                              <span className="font-bold text-orange-600">{product.points}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${product.stock / product.totalStock > 0.3 ? 'bg-green-500' : product.stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`}
                                  style={{ width: `${(product.stock / product.totalStock) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm">{product.stock}</span>
                            </div>
                          </TableCell>
                          <TableCell>{product.exchangedCount}</TableCell>
                          <TableCell>{product.limitPerUser} 件</TableCell>
                          <TableCell>
                            <Badge className={
                              product.status === 'active' ? 'bg-green-500' : 
                              product.status === 'soldout' ? 'bg-red-500' : 'bg-gray-500'
                            }>
                              {product.status === 'active' ? '上架中' : 
                               product.status === 'soldout' ? '已售罄' : '已下架'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 兑换记录 */}
            <TabsContent value="records">
              <Card>
                <CardHeader>
                  <CardTitle>兑换记录</CardTitle>
                  <CardDescription>查看所有会员的积分兑换记录</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="搜索订单号、会员姓名或手机号..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>订单信息</TableHead>
                        <TableHead>兑换商品</TableHead>
                        <TableHead>消耗积分</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>兑换时间</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map(record => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{record.orderNo}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{record.memberName}</span>
                                <span>{record.memberPhone}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {record.memberLevel === 'diamond' ? '💎钻石会员' :
                                 record.memberLevel === 'gold' ? '👑黄金会员' :
                                 record.memberLevel === 'silver' ? '🥈白银会员' : '普通会员'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{record.product.image}</span>
                              <div>
                                <p className="font-medium">{record.product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {record.product.type === 'physical' ? '实物商品' :
                                   record.product.type === 'virtual' ? '虚拟商品' : '优惠券'}
                                  × {record.quantity}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-orange-500" />
                              <span className="font-bold text-orange-600">{record.totalPoints}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{record.points} × {record.quantity}</p>
                          </TableCell>
                          <TableCell>{getExchangeStatusBadge(record.status)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm">{record.createTime}</p>
                              {record.completeTime && (
                                <p className="text-xs text-muted-foreground">完成：{record.completeTime}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleViewRecord(record)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {record.status === 'pending' && (
                                <Button size="sm" onClick={() => handleProcessRecord(record)}>
                                  处理
                                </Button>
                              )}
                              {record.status === 'processing' && (
                                <Button size="sm" onClick={() => handleCompleteRecord(record)}>
                                  完成
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

            {/* 商城预览 */}
            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>积分商城预览</CardTitle>
                  <CardDescription>查看小程序端积分商城展示效果</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    {/* 手机模拟器 */}
                    <div className="relative w-[320px] h-[640px] bg-gray-900 rounded-[40px] p-2 shadow-2xl">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />
                      <div className="relative w-full h-full bg-white rounded-[32px] overflow-hidden">
                        {/* 状态栏 */}
                        <div className="h-6 bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center text-white text-xs">
                          积分商城
                        </div>

                        {/* 内容区 */}
                        <div className="h-full overflow-y-auto pb-14">
                          {/* 积分信息 */}
                          <div className="p-4 bg-gradient-to-r from-orange-400 to-red-400 text-white">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm">我的积分</span>
                              <span className="text-xs opacity-80">积分规则 ›</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-bold">5,680</span>
                              <span className="text-xs opacity-80">明日到期：50</span>
                            </div>
                          </div>

                          {/* 分类导航 */}
                          <div className="flex gap-2 px-4 py-3 overflow-x-auto">
                            {categories.slice(1).map(cat => (
                              <div key={cat.id} className="flex-shrink-0 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs">
                                {cat.name}
                              </div>
                            ))}
                          </div>

                          {/* 热门兑换 */}
                          <div className="px-4 mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-sm">🔥 热门兑换</span>
                              <span className="text-xs text-gray-400">更多 ›</span>
                            </div>
                          </div>

                          {/* 商品列表 */}
                          <div className="px-4 grid grid-cols-2 gap-2">
                            {products.filter(p => p.status === 'active').slice(0, 4).map(product => (
                              <div key={product.id} className="bg-white rounded-lg border p-2">
                                <div className="aspect-square bg-gray-50 rounded flex items-center justify-center text-4xl mb-2">
                                  {product.image}
                                </div>
                                <div className="text-xs truncate font-medium">{product.name}</div>
                                <div className="flex items-center justify-between mt-1">
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-orange-500" />
                                    <span className="text-orange-600 text-sm font-bold">{product.points}</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">库存{product.stock}</span>
                                </div>
                                <Button size="sm" className="w-full mt-2 h-7 text-xs bg-orange-500 hover:bg-orange-600">
                                  立即兑换
                                </Button>
                              </div>
                            ))}
                          </div>

                          {/* 兑换排行 */}
                          <div className="px-4 mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-sm">🏆 兑换排行</span>
                            </div>
                            <div className="space-y-2">
                              {['洗衣液 3kg装', '满50减10优惠券', '新鲜水果券'].map((name, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                  <span className="text-lg">{['🥇', '🥈', '🥉'][idx]}</span>
                                  <span className="text-sm flex-1">{name}</span>
                                  <span className="text-xs text-muted-foreground">{[50, 356, 100][idx]}人兑换</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 底部导航 */}
                        <div className="absolute bottom-0 left-0 right-0 h-14 bg-white border-t flex items-center justify-around">
                          {[
                            { icon: '🏠', name: '商城首页', active: false },
                            { icon: '🎁', name: '积分商城', active: true },
                            { icon: '📋', name: '我的兑换', active: false },
                            { icon: '👤', name: '我的', active: false },
                          ].map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-0.5">
                              <span className="text-lg">{item.icon}</span>
                              <span className={`text-xs ${item.active ? 'text-orange-500 font-medium' : 'text-gray-500'}`}>
                                {item.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 商品编辑对话框 */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? '编辑商品' : '添加商品'}</DialogTitle>
            <DialogDescription>
              {selectedProduct ? '修改商品信息' : '添加新的积分兑换商品'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>商品名称</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="输入商品名称"
                />
              </div>
              <div className="space-y-2">
                <Label>商品图标</Label>
                <Input
                  value={formData.image || ''}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="表情符号"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>商品描述</Label>
              <Input
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="简短描述商品特点"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>商品类型</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as ProductType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">实物商品</SelectItem>
                    <SelectItem value="virtual">虚拟商品</SelectItem>
                    <SelectItem value="coupon">优惠券</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>商品分类</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as ProductStatus })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">上架中</SelectItem>
                    <SelectItem value="inactive">已下架</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>所需积分</Label>
                <Input
                  type="number"
                  value={formData.points || ''}
                  onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>参考价格</Label>
                <Input
                  type="number"
                  value={formData.originalPrice || ''}
                  onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                  placeholder="选填"
                />
              </div>
              <div className="space-y-2">
                <Label>库存数量</Label>
                <Input
                  type="number"
                  value={formData.stock || ''}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value), totalStock: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>每人限兑</Label>
                <Input
                  type="number"
                  value={formData.limitPerUser || ''}
                  onChange={(e) => setFormData({ ...formData, limitPerUser: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveProduct}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 兑换记录详情对话框 */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>兑换详情</DialogTitle>
            <DialogDescription>
              订单号：{selectedRecord?.orderNo}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4 py-4">
              {/* 商品信息 */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <span className="text-4xl">{selectedRecord.product.image}</span>
                <div className="flex-1">
                  <p className="font-medium">{selectedRecord.product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRecord.product.type === 'physical' ? '实物商品' :
                     selectedRecord.product.type === 'virtual' ? '虚拟商品' : '优惠券'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-orange-500" />
                    <span className="font-bold text-orange-600">{selectedRecord.totalPoints}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedRecord.quantity}件</p>
                </div>
              </div>

              {/* 会员信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">会员信息</Label>
                  <div className="mt-2 space-y-1">
                    <p className="font-medium">{selectedRecord.memberName}</p>
                    <p className="text-sm text-muted-foreground">{selectedRecord.memberPhone}</p>
                    <Badge variant="outline" className="text-xs">
                      {selectedRecord.memberLevel === 'diamond' ? '💎钻石会员' :
                       selectedRecord.memberLevel === 'gold' ? '👑黄金会员' :
                       selectedRecord.memberLevel === 'silver' ? '🥈白银会员' : '普通会员'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">兑换状态</Label>
                  <div className="mt-2">
                    {getExchangeStatusBadge(selectedRecord.status)}
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>兑换时间：{selectedRecord.createTime}</p>
                    {selectedRecord.completeTime && (
                      <p>完成时间：{selectedRecord.completeTime}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 配送/兑换信息 */}
              {selectedRecord.product.type === 'physical' && selectedRecord.deliveryAddress && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Label className="text-muted-foreground">配送地址</Label>
                  <p className="mt-1 text-sm">{selectedRecord.deliveryAddress}</p>
                  {selectedRecord.deliveryTime && (
                    <p className="text-xs text-muted-foreground mt-1">
                      配送时间：{selectedRecord.deliveryTime}
                    </p>
                  )}
                </div>
              )}

              {selectedRecord.product.type === 'virtual' && selectedRecord.virtualCode && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Label className="text-muted-foreground">兑换码</Label>
                  <p className="mt-1 font-mono font-bold">{selectedRecord.virtualCode}</p>
                  {selectedRecord.virtualExpiry && (
                    <p className="text-xs text-muted-foreground mt-1">
                      有效期至：{selectedRecord.virtualExpiry}
                    </p>
                  )}
                </div>
              )}

              {selectedRecord.product.type === 'coupon' && selectedRecord.couponId && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Label className="text-muted-foreground">优惠券信息</Label>
                  <p className="mt-1">优惠券ID：{selectedRecord.couponId}</p>
                  {selectedRecord.couponExpiry && (
                    <p className="text-xs text-muted-foreground mt-1">
                      有效期至：{selectedRecord.couponExpiry}
                    </p>
                  )}
                </div>
              )}

              {selectedRecord.remark && (
                <div>
                  <Label className="text-muted-foreground">备注</Label>
                  <p className="mt-1 text-sm">{selectedRecord.remark}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordDialogOpen(false)}>关闭</Button>
            {selectedRecord && selectedRecord.status === 'pending' && (
              <Button onClick={() => {
                handleProcessRecord(selectedRecord);
                setRecordDialogOpen(false);
              }}>
                开始处理
              </Button>
            )}
            {selectedRecord && selectedRecord.status === 'processing' && (
              <Button onClick={() => {
                handleCompleteRecord(selectedRecord);
                setRecordDialogOpen(false);
              }}>
                标记完成
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 总部商品库选择对话框 */}
      <Dialog open={productLibraryOpen} onOpenChange={setProductLibraryOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              从总部商品库选择
            </DialogTitle>
            <DialogDescription>
              选择商品后将自动填充商品信息，您可以再调整积分和库存
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 搜索栏 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索商品名称或品牌..."
                value={librarySearchQuery}
                onChange={(e) => {
                  setLibrarySearchQuery(e.target.value);
                  // 防抖搜索
                  setTimeout(() => {
                    if (e.target.value.length >= 2 || e.target.value.length === 0) {
                      fetchHeadquartersProducts(e.target.value);
                    }
                  }, 300);
                }}
                className="pl-10"
              />
            </div>

            {/* 商品列表 */}
            <div className="border rounded-lg overflow-hidden">
              {libraryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">加载中...</span>
                </div>
              ) : headquartersProducts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>暂无商品数据</p>
                  <p className="text-sm mt-1">请尝试其他搜索条件</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品名称</TableHead>
                      <TableHead>品牌</TableHead>
                      <TableHead>规格</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead>参考价</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {headquartersProducts.slice(0, 50).map((product) => (
                      <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {product.barcode && (
                              <p className="text-xs text-muted-foreground">条码: {product.barcode}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.brand || '-'}</TableCell>
                        <TableCell>{product.specification || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-orange-600 font-medium">
                            ¥{product.suggested_price?.toFixed(2) || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm"
                            onClick={() => handleSelectFromLibrary(product)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            选择
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* 提示信息 */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>共 {headquartersProducts.length} 个商品</span>
              <span>选择商品后可调整积分和库存</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProductLibraryOpen(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
