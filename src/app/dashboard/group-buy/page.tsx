'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { ShoppingCart, Users, TrendingUp, Plus, Award, Calendar, Package, Trash2, Loader2, MessageCircle, ArrowRight, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// 模拟团长数据
const teamLeaders = [
  {
    id: 1,
    name: '张大姐',
    phone: '138****1234',
    community: '阳光小区',
    totalOrders: 156,
    totalSales: 23450,
    commission: 1172.5,
    level: '金牌团长',
    status: 'active',
  },
  {
    id: 2,
    name: '李阿姨',
    phone: '139****5678',
    community: '幸福家园',
    totalOrders: 98,
    totalSales: 15680,
    commission: 784,
    level: '银牌团长',
    status: 'active',
  },
  {
    id: 3,
    name: '王大哥',
    phone: '137****9012',
    community: '锦绣花园',
    totalOrders: 67,
    totalSales: 8900,
    commission: 445,
    level: '铜牌团长',
    status: 'active',
  },
];

// 商品数据类型
interface AvailableProduct {
  id: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
  barcode?: string;
  imageUrl?: string;
}

// 佣金类型
type CommissionType = 'none' | 'percent' | 'fixed';

// 佣金模式
type CommissionMode = 'product' | 'activity';

// 商品佣金配置
interface ProductCommission {
  commissionType: CommissionType;
  commissionValue: number;
}

// 团购商品（包含佣金配置）
interface GroupBuyProduct {
  id: string;
  name: string;
  price: number;
  groupPrice: number;
  quantity: number;
  commissionType: CommissionType;
  commissionValue: number;
}

interface GroupBuyActivity {
  id: number;
  name: string;
  status: string;
  startTime: string;
  endTime: string;
  participants: number;
  orders: number;
  totalAmount: number;
  commission: number;
  description?: string;
  products?: { name: string; price: number; groupPrice: number; commissionType?: CommissionType; commissionValue?: number }[];
  // 佣金配置
  commissionMode: CommissionMode;
  globalCommissionType: CommissionType;
  globalCommissionValue: number;
}

export default function GroupBuyPage() {
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activities, setActivities] = useState<GroupBuyActivity[]>([]);

  // 从API加载团购活动列表
  useEffect(() => {
    const loadActivities = async () => {
      setLoadingActivities(true);
      try {
        const response = await fetch('/api/group-buy/activities/');
        const result = await response.json();
        
        if (result.success && result.data) {
          setActivities(result.data.map((a: any) => ({
            id: a.id,
            name: a.name,
            status: a.status === 'active' ? 'ongoing' : a.status,
            startTime: a.startTime,
            endTime: a.endTime,
            participants: a.participants || 0,
            orders: a.orders || 0,
            totalAmount: a.totalAmount || 0,
            commission: a.commission || 0,
            description: a.description || '',
            commissionMode: a.commissionMode || 'product',
            globalCommissionType: a.globalCommissionType || 'percent',
            globalCommissionValue: a.globalCommissionValue || 0,
            products: a.products || [],
          })));
          console.log('[团购] 已加载', result.data.length, '个活动');
        }
      } catch (error) {
        console.error('[团购] 加载活动失败:', error);
      } finally {
        setLoadingActivities(false);
      }
    };
    
    loadActivities();
  }, []);

  // 从总部商品库加载商品数据
  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await fetch('/api/store-products');
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          // 将数据库商品转换为前端格式
          const products: AvailableProduct[] = [];
          
          result.data.forEach((p: any) => {
            if (p.specs && p.specs.length > 0) {
              // 每个规格作为一个独立的商品项
              p.specs.forEach((spec: any) => {
                products.push({
                  id: spec.barcode || `spec-${spec.id}`,
                  name: p.name + (p.specs.length > 1 ? ` (${spec.name})` : ''),
                  price: spec.price || 0,
                  unit: spec.unit || '个',
                  stock: spec.stock || 0,
                  barcode: spec.barcode,
                });
              });
            } else {
              // 没有规格的商品
              products.push({
                id: p.id,
                name: p.name,
                price: 0,
                unit: '个',
                stock: 0,
              });
            }
          });
          
          setAvailableProducts(products);
          console.log('[团购] 已加载', products.length, '个商品');
        }
      } catch (error) {
        console.error('[团购] 加载商品失败:', error);
        toast.error('加载商品失败');
      } finally {
        setLoadingProducts(false);
      }
    };
    
    loadProducts();
  }, []);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    description: '',
    selectedProducts: [] as GroupBuyProduct[],
    // 佣金配置
    commissionMode: 'activity' as CommissionMode,
    globalCommissionType: 'percent' as CommissionType,
    globalCommissionValue: 5,
  });

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [groupPrice, setGroupPrice] = useState<string>('');
  const [productQuantity, setProductQuantity] = useState<string>('');
  // 商品佣金设置
  const [productCommissionType, setProductCommissionType] = useState<CommissionType>('percent');
  const [productCommissionValue, setProductCommissionValue] = useState<string>('5');

  // 计算商品佣金
  const calculateCommission = (groupPrice: number, commissionType: CommissionType, commissionValue: number) => {
    if (commissionType === 'none') return 0;
    if (commissionType === 'percent') return groupPrice * (commissionValue / 100);
    return commissionValue; // fixed
  };

  // 添加商品到团购
  const handleAddProduct = () => {
    if (!selectedProductId || !groupPrice) {
      toast.error('请选择商品并填写团购价');
      return;
    }

    const product = availableProducts.find(p => p.id === selectedProductId);
    if (!product) return;

    // 检查是否已添加
    if (formData.selectedProducts.some(p => p.id === product.id)) {
      toast.error('该商品已添加');
      return;
    }

    // 如果是按商品设置佣金，使用商品级佣金；否则使用活动级佣金
    const commissionType = formData.commissionMode === 'product' ? productCommissionType : formData.globalCommissionType;
    const commissionValue = formData.commissionMode === 'product' ? parseFloat(productCommissionValue) || 0 : formData.globalCommissionValue;

    setFormData({
      ...formData,
      selectedProducts: [
        ...formData.selectedProducts,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          groupPrice: parseFloat(groupPrice),
          quantity: parseInt(productQuantity) || 1,
          commissionType,
          commissionValue,
        },
      ],
    });

    setSelectedProductId('');
    setGroupPrice('');
    setProductQuantity('');
  };

  // 移除商品
  const handleRemoveProduct = (productId: string) => {
    setFormData({
      ...formData,
      selectedProducts: formData.selectedProducts.filter(p => p.id !== productId),
    });
  };

  // 创建团购
  const handleCreateActivity = async () => {
    if (!formData.name || !formData.startTime || !formData.endTime) {
      toast.error('请填写完整的团购信息');
      return;
    }

    if (formData.selectedProducts.length === 0) {
      toast.error('请至少添加一个团购商品');
      return;
    }

    try {
      // 调用API保存团购活动
      const response = await fetch('/api/group-buy/activities/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          startTime: formData.startTime,
          endTime: formData.endTime,
          commissionMode: formData.commissionMode,
          globalCommissionType: formData.globalCommissionType,
          globalCommissionValue: formData.globalCommissionValue,
          products: formData.selectedProducts.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            groupPrice: p.groupPrice,
            stock: p.quantity,
            commissionType: p.commissionType,
            commissionValue: p.commissionValue,
          })),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('团购活动创建成功');
        setCreateDialogOpen(false);
        
        // 重新加载活动列表
        const listResponse = await fetch('/api/group-buy/activities/');
        const listResult = await listResponse.json();
        if (listResult.success && listResult.data) {
          setActivities(listResult.data.map((a: any) => ({
            id: a.id,
            name: a.name,
            status: a.status === 'active' ? 'ongoing' : a.status,
            startTime: a.startTime,
            endTime: a.endTime,
            participants: a.participants || 0,
            orders: a.orders || 0,
            totalAmount: a.totalAmount || 0,
            commission: a.commission || 0,
            description: a.description || '',
            commissionMode: a.commissionMode || 'product',
            globalCommissionType: a.globalCommissionType || 'percent',
            globalCommissionValue: a.globalCommissionValue || 0,
            products: a.products || [],
          })));
        }

        // 重置表单
        setFormData({
          name: '',
          startTime: '',
          endTime: '',
          description: '',
          selectedProducts: [],
          commissionMode: 'activity',
          globalCommissionType: 'percent',
          globalCommissionValue: 5,
        });
      } else {
        toast.error(result.error || '创建失败');
      }
    } catch (error) {
      console.error('创建团购活动失败:', error);
      toast.error('创建失败，请重试');
    }
  };

  // 生成接龙
  const handleGenerateDragon = async (activity: GroupBuyActivity) => {
    if (!activity.products || activity.products.length === 0) {
      toast.error('该团购活动没有商品，无法生成接龙');
      return;
    }

    // 导航到接龙创建页面，并传递团购活动ID
    router.push(`/dashboard/group-buy/dragon/create?activityId=${activity.id}`);
  };

  return (
    <>
      <PageHeader
        title="社区团购"
        description="管理团长和团购活动"
      >
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建团购
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>创建团购活动</DialogTitle>
              <DialogDescription>
                填写团购信息，选择商品和团长
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  基本信息
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">团购名称 *</Label>
                    <Input
                      id="name"
                      placeholder="如：新鲜蔬菜团购"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">开始时间 *</Label>
                    <Input
                      id="startTime"
                      type="date"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">结束时间 *</Label>
                    <Input
                      id="endTime"
                      type="date"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">活动描述</Label>
                  <Textarea
                    id="description"
                    placeholder="团购活动描述..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* 佣金设置 */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  佣金设置
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Label className="text-sm">佣金模式</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={formData.commissionMode === 'activity' ? 'default' : 'outline'}
                        onClick={() => setFormData({ ...formData, commissionMode: 'activity' })}
                      >
                        统一活动佣金
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={formData.commissionMode === 'product' ? 'default' : 'outline'}
                        onClick={() => setFormData({ ...formData, commissionMode: 'product' })}
                      >
                        按商品设置
                      </Button>
                    </div>
                  </div>

                  {formData.commissionMode === 'activity' ? (
                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                      <Label className="text-sm text-muted-foreground">活动佣金</Label>
                      <Select
                        value={formData.globalCommissionType}
                        onValueChange={(value: CommissionType) => setFormData({ ...formData, globalCommissionType: value })}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">无佣金</SelectItem>
                          <SelectItem value="percent">按比例</SelectItem>
                          <SelectItem value="fixed">固定金额</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.globalCommissionType !== 'none' && (
                        <>
                          <Input
                            type="number"
                            className="w-24"
                            placeholder="佣金值"
                            value={formData.globalCommissionValue}
                            onChange={(e) => setFormData({ ...formData, globalCommissionValue: parseFloat(e.target.value) || 0 })}
                          />
                          <span className="text-sm text-muted-foreground">
                            {formData.globalCommissionType === 'percent' ? '%' : '元/件'}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded-lg">
                      在添加商品时为每个商品单独设置佣金
                    </div>
                  )}
                </div>
              </div>

              {/* 添加商品 */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-medium">团购商品</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label className="text-xs text-muted-foreground">选择商品</Label>
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={loadingProducts ? "加载中..." : availableProducts.length === 0 ? "暂无商品" : "选择商品"} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingProducts ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm text-muted-foreground">加载商品中...</span>
                          </div>
                        ) : availableProducts.length === 0 ? (
                          <div className="py-4 text-center text-sm text-muted-foreground">
                            暂无商品，请先在总部商品库添加商品
                          </div>
                        ) : (
                          availableProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - ¥{product.price.toFixed(2)}/{product.unit}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">团购价</Label>
                    <Input
                      type="number"
                      placeholder="团购价"
                      value={groupPrice}
                      onChange={(e) => setGroupPrice(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">限购</Label>
                    <Input
                      type="number"
                      placeholder="数量"
                      value={productQuantity}
                      onChange={(e) => setProductQuantity(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  {/* 商品级佣金设置 */}
                  {formData.commissionMode === 'product' && (
                    <>
                      <div>
                        <Label className="text-xs text-muted-foreground">佣金类型</Label>
                        <Select
                          value={productCommissionType}
                          onValueChange={(value: CommissionType) => setProductCommissionType(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">无</SelectItem>
                            <SelectItem value="percent">比例</SelectItem>
                            <SelectItem value="fixed">固定</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {productCommissionType !== 'none' && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            佣金{productCommissionType === 'percent' ? '(%)' : '(元)'}
                          </Label>
                          <Input
                            type="number"
                            placeholder="佣金"
                            value={productCommissionValue}
                            onChange={(e) => setProductCommissionValue(e.target.value)}
                            className="w-full"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <Button type="button" onClick={handleAddProduct} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  添加商品
                </Button>

                {/* 已选商品列表 */}
                {formData.selectedProducts.length > 0 && (
                  <div className="border rounded-lg overflow-hidden mt-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[150px]">商品名称</TableHead>
                            <TableHead className="min-w-[80px]">原价</TableHead>
                            <TableHead className="min-w-[80px]">团购价</TableHead>
                            <TableHead className="min-w-[80px]">折扣</TableHead>
                            <TableHead className="min-w-[100px]">佣金</TableHead>
                            <TableHead className="min-w-[60px]">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.selectedProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>¥{product.price}</TableCell>
                              <TableCell className="text-green-600">¥{product.groupPrice}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {Math.round((1 - product.groupPrice / product.price) * 100)}% OFF
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {product.commissionType === 'none' ? (
                                  <span className="text-muted-foreground">无</span>
                                ) : (
                                  <span className="text-blue-600 font-medium">
                                    {product.commissionType === 'percent'
                                      ? `${product.commissionValue}% (¥${calculateCommission(product.groupPrice, product.commissionType, product.commissionValue).toFixed(2)})`
                                      : `¥${product.commissionValue}/件`}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveProduct(product.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateActivity}>
                创建团购
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex-1 space-y-6 p-6 overflow-auto">
        {/* 团购统计卡片 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">团长数量</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamLeaders.length}</div>
              <p className="text-xs text-muted-foreground">位团长</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">团购订单</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">321</div>
              <p className="text-xs text-muted-foreground">本月订单</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">团购总额</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥48,030</div>
              <p className="text-xs text-muted-foreground">本月销售额</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">团长佣金</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥2,401</div>
              <p className="text-xs text-muted-foreground">本月佣金</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activities" className="space-y-4">
          <TabsList>
            <TabsTrigger value="activities">团购活动</TabsTrigger>
            <TabsTrigger value="leaders">团长管理</TabsTrigger>
            <TabsTrigger value="settlement">佣金结算</TabsTrigger>
          </TabsList>

          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>团购活动</CardTitle>
                  <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    新建团购
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>团购名称</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>佣金模式</TableHead>
                      <TableHead>活动时间</TableHead>
                      <TableHead>参与人数</TableHead>
                      <TableHead>订单数</TableHead>
                      <TableHead>团购金额</TableHead>
                      <TableHead>佣金总额</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">{activity.name}</TableCell>
                        <TableCell>
                          <Badge variant={activity.status === 'ongoing' ? 'default' : 'secondary'}>
                            {activity.status === 'ongoing' ? '进行中' : '已结束'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {activity.commissionMode === 'activity' ? '统一佣金' : '按商品'}
                            {activity.commissionMode === 'activity' && activity.globalCommissionType !== 'none' && (
                              <span className="ml-1">
                                ({activity.globalCommissionType === 'percent'
                                  ? `${activity.globalCommissionValue}%`
                                  : `¥${activity.globalCommissionValue}`})
                              </span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {activity.startTime} ~ {activity.endTime}
                          </div>
                        </TableCell>
                        <TableCell>{activity.participants}</TableCell>
                        <TableCell>{activity.orders}</TableCell>
                        <TableCell>¥{activity.totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-blue-600 font-medium">¥{activity.commission}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleGenerateDragon(activity)}>
                              <MessageCircle className="h-4 w-4 mr-1" />
                              生成接龙
                            </Button>
                            <Button variant="ghost" size="sm">
                              详情
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaders" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>团长列表</CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    招募团长
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>团长姓名</TableHead>
                      <TableHead>手机号</TableHead>
                      <TableHead>所属社区</TableHead>
                      <TableHead>团长等级</TableHead>
                      <TableHead>总订单数</TableHead>
                      <TableHead>总销售额</TableHead>
                      <TableHead>累计佣金</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamLeaders.map((leader) => (
                      <TableRow key={leader.id}>
                        <TableCell className="font-medium">{leader.name}</TableCell>
                        <TableCell>{leader.phone}</TableCell>
                        <TableCell>{leader.community}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              leader.level === '金牌团长'
                                ? 'default'
                                : leader.level === '银牌团长'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {leader.level}
                          </Badge>
                        </TableCell>
                        <TableCell>{leader.totalOrders}</TableCell>
                        <TableCell>¥{leader.totalSales.toLocaleString()}</TableCell>
                        <TableCell>¥{leader.commission.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge>活跃</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            详情
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settlement" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>佣金结算</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamLeaders.map((leader) => (
                    <div key={leader.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold">{leader.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {leader.community} | {leader.level}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">¥{leader.commission.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {leader.totalOrders}单 | ¥{leader.totalSales.toLocaleString()}销售
                        </div>
                      </div>
                      <Button size="sm">结算</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
