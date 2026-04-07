'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  Tag,
  Percent,
  DollarSign,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 促销申请状态类型
type PromotionStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'ended';

// 促销申请数据接口
interface PromotionRequest {
  id: string;
  shop_id: string;
  shop_name: string;
  name: string;
  type: 'discount' | 'gift' | 'full_reduce' | 'seckill';
  start_date: string;
  end_date: string;
  products: Array<{
    productId: string;
    name: string;
    originalPrice: number;
    promotionPrice: number;
  }>;
  remark?: string;
  status: PromotionStatus;
  reject_reason?: string;
  created_at: string;
}

// 商品列表接口
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

// 促销商品接口
interface PromotionProduct {
  productId: string;
  name: string;
  originalPrice: number;
  promotionPrice: number;
}

export default function PromotionRequestPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('new');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<PromotionProduct[]>([]);
  
  // 促销信息
  const [promoName, setPromoName] = useState('');
  const [promoType, setPromoType] = useState('discount');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remark, setRemark] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [promoPrice, setPromoPrice] = useState('');
  
  // 状态
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [promotionHistory, setPromotionHistory] = useState<PromotionRequest[]>([]);

  // 获取商品列表
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products/?pageSize=100');
      const result = await response.json();
      
      if (result.success && result.data) {
        const products: Product[] = result.data.map((p: any) => ({
          id: p.id || p.productId,
          name: p.name || p.productName,
          price: p.price || p.salePrice || 0,
          stock: p.stock || 0,
        }));
        setAvailableProducts(products.length > 0 ? products : getDefaultProducts());
      } else {
        setAvailableProducts(getDefaultProducts());
      }
    } catch (err) {
      console.error('获取商品失败:', err);
      setAvailableProducts(getDefaultProducts());
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取促销历史
  const fetchPromotionHistory = useCallback(async () => {
    setLoading(true);
    try {
      // 获取用户信息
      const userData = localStorage.getItem('store_admin_user');
      const user = userData ? JSON.parse(userData) : null;

      const response = await fetch(`/api/approvals?userId=${user?.id}&status=all`);
      const result = await response.json();

      if (result.success && result.data) {
        // 过滤出促销相关的申请
        const promotionRequests = result.data
          .filter((item: any) => item.request_type === 'promotion')
          .map((item: any) => ({
            ...item,
            // 兼容旧的字段名
            name: item.title?.replace('店铺促销申请: ', ''),
            type: item.request_data?.type || 'discount',
            start_date: item.request_data?.start_date,
            end_date: item.request_data?.end_date,
            products: item.request_data?.products || [],
            remark: item.request_data?.remark,
            status: item.status,
            shop_id: item.store_id,
            shop_name: item.store_name,
          }));
        setPromotionHistory(promotionRequests);
      }
    } catch (err) {
      console.error('获取促销历史失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    fetchProducts();
    fetchPromotionHistory();
  }, [fetchProducts, fetchPromotionHistory]);

  // 默认商品列表
  const getDefaultProducts = (): Product[] => [
    { id: 'prod-001', name: '可口可乐500ml', price: 3.00, stock: 24 },
    { id: 'prod-002', name: '农夫山泉550ml', price: 2.00, stock: 48 },
    { id: 'prod-003', name: '康师傅红烧牛肉面', price: 4.50, stock: 12 },
    { id: 'prod-004', name: '双汇王中王火腿肠', price: 2.50, stock: 36 },
    { id: 'prod-005', name: '百事可乐500ml', price: 3.00, stock: 30 },
    { id: 'prod-006', name: '统一冰红茶500ml', price: 3.00, stock: 20 },
  ];

  const filteredProducts = availableProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = () => {
    if (!selectedProduct || !promoPrice) return;
    
    const existing = items.find(i => i.productId === selectedProduct.id);
    if (existing) {
      setItems(items.map(i =>
        i.productId === selectedProduct.id
          ? { ...i, promotionPrice: parseFloat(promoPrice) }
          : i
      ));
    } else {
      setItems([...items, {
        productId: selectedProduct.id,
        name: selectedProduct.name,
        originalPrice: selectedProduct.price,
        promotionPrice: parseFloat(promoPrice),
      }]);
    }
    
    setSelectedProduct(null);
    setPromoPrice('');
    setShowAddDialog(false);
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  // 提交促销申请
  const handleSubmit = async () => {
    if (!promoName || items.length === 0 || !startDate || !endDate) {
      setError('请填写完整的促销信息');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 获取用户信息
      const userData = localStorage.getItem('store_admin_user');
      const user = userData ? JSON.parse(userData) : null;

      const response = await fetch('/api/promotion-requests/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: promoName,
          type: promoType,
          start_date: startDate,
          end_date: endDate,
          products: items,
          remark: remark,
          shopId: user?.storeId || 'store-001',
          shopName: user?.storeName || '示例店铺',
          applicantId: user?.id || 'store-001',
          applicantName: user?.name || '示例用户',
          isHeadquarters: false, // 店铺促销
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('店铺促销申请已提交，等待运营经理审批');
        // 重置表单
        setPromoName('');
        setPromoType('discount');
        setStartDate('');
        setEndDate('');
        setRemark('');
        setItems([]);
        // 切换到历史记录
        setActiveTab('history');
        fetchPromotionHistory();
      } else {
        setError(result.error || '提交失败，请重试');
      }
    } catch (err) {
      console.error('提交促销申请失败:', err);
      setError('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">进行中</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">待审批</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500">已通过</Badge>;
      case 'rejected':
        return <Badge variant="destructive">已拒绝</Badge>;
      case 'ended':
        return <Badge variant="outline">已结束</Badge>;
      default:
        return null;
    }
  };

  const getPromoTypeLabel = (type: string) => {
    switch (type) {
      case 'discount': return '折扣促销';
      case 'gift': return '买赠活动';
      case 'full_reduce': return '满减活动';
      case 'seckill': return '秒杀活动';
      default: return '其他';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部栏 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-3 p-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-medium flex-1">促销申请</h1>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full rounded-none border-b bg-white h-11">
          <TabsTrigger value="new" className="flex-1">新建申请</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">促销记录</TabsTrigger>
        </TabsList>

        {/* 新建申请 */}
        <TabsContent value="new" className="p-4 space-y-4 mt-0">
          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-600 text-sm">{error}</span>
            </div>
          )}

          {/* 基本信息 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">促销信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>促销名称</Label>
                <Input
                  placeholder="请输入促销名称"
                  value={promoName}
                  onChange={(e) => setPromoName(e.target.value)}
                />
              </div>
              <div>
                <Label>促销类型</Label>
                <Select value={promoType} onValueChange={setPromoType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">折扣促销</SelectItem>
                    <SelectItem value="gift">买赠活动</SelectItem>
                    <SelectItem value="full_reduce">满减活动</SelectItem>
                    <SelectItem value="seckill">秒杀活动</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>开始日期</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>结束日期</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 促销商品 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>促销商品</span>
                <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-center py-4 text-gray-400 text-sm">暂无促销商品</p>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-400">
                          原价 ¥{item.originalPrice.toFixed(2)} → 
                          <span className="text-red-500 ml-1">¥{item.promotionPrice.toFixed(2)}</span>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() => removeItem(item.productId)}
                      >
                        删除
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 申请说明 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">申请说明</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="请输入促销原因或说明（选填）"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* 提交按钮 */}
          <Button
            className="w-full h-12"
            disabled={!promoName || items.length === 0 || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                提交中...
              </>
            ) : (
              '提交申请'
            )}
          </Button>
        </TabsContent>

        {/* 促销记录 */}
        <TabsContent value="history" className="p-4 space-y-3 mt-0">
          {/* 刷新按钮 */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={fetchPromotionHistory}>
              <RefreshCw className="h-4 w-4 mr-1" />
              刷新
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-500">加载中...</span>
            </div>
          ) : promotionHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              暂无促销记录
            </div>
          ) : (
            promotionHistory.map((promo) => (
              <Card key={promo.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{promo.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {getPromoTypeLabel(promo.type)}
                      </p>
                    </div>
                    {getStatusBadge(promo.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <Calendar className="h-3 w-3" />
                    <span>{promo.start_date} 至 {promo.end_date}</span>
                  </div>
                  {promo.products && promo.products.length > 0 && (
                    <div className="text-xs text-gray-500">
                      商品：{promo.products.map(p => p.name).join('、')}
                    </div>
                  )}
                  {promo.reject_reason && (
                    <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                      审批备注：{promo.reject_reason}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* 添加商品弹窗 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>添加促销商品</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索商品"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-48 overflow-auto space-y-1">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedProduct?.id === product.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-gray-400">
                    原价 ¥{product.price.toFixed(2)} · 库存 {product.stock}
                  </p>
                </button>
              ))}
            </div>
            {selectedProduct && (
              <div className="space-y-2">
                <Label>促销价</Label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">¥</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={promoPrice}
                    onChange={(e) => setPromoPrice(e.target.value)}
                    placeholder="请输入促销价"
                  />
                </div>
                {promoPrice && parseFloat(promoPrice) < selectedProduct.price && (
                  <p className="text-xs text-green-500">
                    折扣率: {((parseFloat(promoPrice) / selectedProduct.price) * 10).toFixed(1)}折
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button disabled={!selectedProduct || !promoPrice} onClick={handleAddItem}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
