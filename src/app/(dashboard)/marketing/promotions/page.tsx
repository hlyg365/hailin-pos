'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Plus, Search, Edit, Trash2, Gift, Percent, Calendar,
  TrendingUp, Package, CheckCircle, XCircle, Clock, Store,
  Send, Eye, Copy, ArrowRight, Tag, Users, Filter, MoreHorizontal,
  AlertCircle, Play, Pause, RefreshCw, Settings, Calculator, Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  PromotionActivity,
  PromotionType,
  PromotionStatus,
  PromotionProductConfig,
  PromotionStoreConfig,
  PROMOTION_TYPE_CONFIG,
  validatePromotion,
  generatePromotionCode,
  getStatusText,
  getStatusStyle,
} from '@/lib/promotion-service';

// ============== 模拟数据 ==============

const mockStores: PromotionStoreConfig[] = [
  { storeId: 'store-001', storeName: '南山店', storeAddress: '深圳市南山区科技园南路88号', selected: false, synced: true, syncTime: '2024-03-18 10:00:00' },
  { storeId: 'store-002', storeName: '福田店', storeAddress: '深圳市福田区福华路168号', selected: false, synced: true, syncTime: '2024-03-18 09:30:00' },
  { storeId: 'store-003', storeName: '龙华店', storeAddress: '深圳市龙华区民治大道666号', selected: false, synced: false },
  { storeId: 'store-004', storeName: '宝安店', storeAddress: '深圳市宝安区新安街道45号', selected: false, synced: true, syncTime: '2024-03-18 08:45:00' },
  { storeId: 'store-005', storeName: '龙岗店', storeAddress: '深圳市龙岗区龙城街道128号', selected: false, synced: false },
];

const mockCategories = [
  { id: 'cat-001', name: '饮料' },
  { id: 'cat-002', name: '零食' },
  { id: 'cat-003', name: '日用品' },
  { id: 'cat-004', name: '方便食品' },
  { id: 'cat-005', name: '乳制品' },
  { id: 'cat-006', name: '生鲜果蔬' },
];

const mockProducts: PromotionProductConfig[] = [
  { productId: 'prod-001', productName: '可口可乐500ml', barcode: '6901939621103', category: '饮料', originalPrice: 3.5 },
  { productId: 'prod-002', productName: '农夫山泉550ml', barcode: '6921168509256', category: '饮料', originalPrice: 2.0 },
  { productId: 'prod-003', productName: '康师傅红烧牛肉面', barcode: '6920507111888', category: '方便食品', originalPrice: 4.5 },
  { productId: 'prod-004', productName: '乐事薯片原味', barcode: '6924187221089', category: '零食', originalPrice: 8.0 },
  { productId: 'prod-005', productName: '维达抽纸100抽', barcode: '6902367288888', category: '日用品', originalPrice: 12.9 },
  { productId: 'prod-006', productName: '蒙牛纯牛奶250ml', barcode: '6902048011111', category: '乳制品', originalPrice: 3.0 },
  { productId: 'prod-007', productName: '百事可乐500ml', barcode: '6901939622222', category: '饮料', originalPrice: 3.5 },
  { productId: 'prod-008', productName: '统一冰红茶500ml', barcode: '6902083883333', category: '饮料', originalPrice: 3.0 },
  { productId: 'prod-009', productName: '香蕉', barcode: '', category: '生鲜果蔬', originalPrice: 6.0 },
  { productId: 'prod-010', productName: '苹果', barcode: '', category: '生鲜果蔬', originalPrice: 8.0 },
];

const initialPromotions: PromotionActivity[] = [
  {
    id: 'promo-001',
    code: 'PROMO-20240318-AB12',
    name: '周末饮料买二送一',
    type: 'buy_x_get_y',
    status: 'active',
    description: '周末购买任意饮料，买2瓶送1瓶同款',
    startTime: '2024-03-20 00:00:00',
    endTime: '2024-03-24 23:59:59',
    priority: 1,
    productScope: 'category',
    selectedCategories: ['cat-001'],
    productConfigs: mockProducts.filter(p => p.category === '饮料').map(p => ({
      ...p,
      limitQuantity: 10,
    })),
    storeScope: 'all',
    storeConfigs: mockStores.map(s => ({ ...s, selected: true, synced: true })),
    conditions: { buyQuantity: 2 },
    rewards: { freeQuantity: 1 },
    usageCount: 156,
    totalSales: 2340,
    totalDiscount: 468,
    createBy: 'admin',
    createTime: '2024-03-18 14:00:00',
    updateTime: '2024-03-18 14:30:00',
    publishTime: '2024-03-18 14:30:00',
  },
  {
    id: 'promo-002',
    code: 'PROMO-20240301-CD34',
    name: '整点秒杀-方便面',
    type: 'flash_sale',
    status: 'active',
    description: '每天12点-14点，方便面半价优惠',
    startTime: '2024-03-01 00:00:00',
    endTime: '2024-03-31 23:59:59',
    timeSlots: [{ startTime: '12:00', endTime: '14:00' }],
    priority: 2,
    productScope: 'product',
    selectedCategories: [],
    productConfigs: [{
      ...mockProducts.find(p => p.productId === 'prod-003')!,
      promotionPrice: 2.25,
      limitQuantity: 5,
    }],
    storeScope: 'all',
    storeConfigs: mockStores.map(s => ({ ...s, selected: true, synced: true })),
    conditions: {},
    rewards: {},
    usageCount: 324,
    totalSales: 3240,
    totalDiscount: 1620,
    createBy: 'admin',
    createTime: '2024-02-28 10:30:00',
    updateTime: '2024-02-28 11:00:00',
    publishTime: '2024-02-28 11:00:00',
  },
];

// 店铺促销申请接口
interface ShopPromotionRequest {
  id: string;
  shop_id: string;
  shop_name: string;
  staff_id: string;
  staff_name: string;
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
  status: 'pending' | 'approved' | 'rejected';
  reject_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

// ============== 主页面组件 ==============

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionActivity[]>(initialPromotions);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionActivity | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<string | null>(null);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncingPromotion, setSyncingPromotion] = useState<PromotionActivity | null>(null);
  
  // 店铺促销申请状态
  const [shopRequests, setShopRequests] = useState<ShopPromotionRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ShopPromotionRequest | null>(null);
  const [requestDetailOpen, setRequestDetailOpen] = useState(false);
  const [approving, setApproving] = useState(false);

  // 获取店铺促销申请
  const fetchShopRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const response = await fetch('/api/promotion-requests/?status=pending');
      const result = await response.json();
      if (result.success) {
        setShopRequests(result.data || []);
      }
    } catch (error) {
      console.error('获取促销申请失败:', error);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    fetchShopRequests();
  }, [fetchShopRequests]);

  // 审批促销申请
  const handleApproveRequest = async (requestId: string, status: 'approved' | 'rejected', remark: string = '') => {
    setApproving(true);
    try {
      const response = await fetch('/api/promotion-requests/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: requestId,
          status,
          reject_reason: remark,
          reviewed_by: '管理员',
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert(status === 'approved' ? '促销申请已通过' : '促销申请已拒绝');
        setRequestDetailOpen(false);
        setSelectedRequest(null);
        fetchShopRequests();
      } else {
        alert(result.error || '操作失败');
      }
    } catch (error) {
      console.error('审批失败:', error);
      alert('审批失败，请重试');
    } finally {
      setApproving(false);
    }
  };

  // 筛选后的活动列表
  const filteredPromotions = useMemo(() => {
    return promotions.filter((p) => {
      const matchesSearch = p.name.includes(searchKeyword) || p.code.includes(searchKeyword);
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesType = typeFilter === 'all' || p.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [promotions, searchKeyword, statusFilter, typeFilter]);

  // 统计数据
  const stats = useMemo(() => ({
    total: promotions.length,
    active: promotions.filter(p => p.status === 'active').length,
    pending: promotions.filter(p => p.status === 'pending').length,
    totalUsage: promotions.reduce((sum, p) => sum + p.usageCount, 0),
    totalSales: promotions.reduce((sum, p) => sum + p.totalSales, 0),
    totalDiscount: promotions.reduce((sum, p) => sum + p.totalDiscount, 0),
  }), [promotions]);

  // 创建活动
  const handleCreatePromotion = () => {
    setSelectedPromotion(null);
    setCreateDialogOpen(true);
  };

  // 编辑活动
  const handleEditPromotion = (promotion: PromotionActivity) => {
    setSelectedPromotion(promotion);
    setCreateDialogOpen(true);
  };

  // 查看详情
  const handleViewDetail = (promotion: PromotionActivity) => {
    setSelectedPromotion(promotion);
    setDetailDialogOpen(true);
  };

  // 复制活动
  const handleCopyPromotion = (promotion: PromotionActivity) => {
    const now = new Date().toLocaleString();
    const newPromotion: PromotionActivity = {
      ...promotion,
      id: `promo-${Date.now()}`,
      code: generatePromotionCode(),
      name: `${promotion.name}（复制）`,
      status: 'draft',
      usageCount: 0,
      totalSales: 0,
      totalDiscount: 0,
      createTime: now,
      updateTime: now,
      publishTime: undefined,
    };
    setPromotions([...promotions, newPromotion]);
  };

  // 删除活动
  const handleDeletePromotion = () => {
    if (promotionToDelete) {
      setPromotions(promotions.filter(p => p.id !== promotionToDelete));
      setDeleteDialogOpen(false);
      setPromotionToDelete(null);
    }
  };

  // 保存活动
  const handleSavePromotion = (promotion: PromotionActivity) => {
    const now = new Date().toLocaleString();
    if (selectedPromotion) {
      setPromotions(promotions.map(p => 
        p.id === promotion.id 
          ? { ...promotion, updateTime: now }
          : p
      ));
    } else {
      setPromotions([...promotions, { ...promotion, createTime: now, updateTime: now }]);
    }
    setCreateDialogOpen(false);
  };

  // 发布活动
  const handlePublishPromotion = (promotionId: string) => {
    const now = new Date().toLocaleString();
    setPromotions(promotions.map(p => {
      if (p.id === promotionId && p.status === 'draft') {
        return { ...p, status: 'pending' as const, publishTime: now, updateTime: now };
      }
      return p;
    }));
  };

  // 启用/暂停活动
  const handleToggleStatus = (promotionId: string) => {
    setPromotions(promotions.map(p => {
      if (p.id === promotionId) {
        const now = new Date().toLocaleString();
        if (p.status === 'pending') return { ...p, status: 'active' as const, updateTime: now };
        if (p.status === 'active') return { ...p, status: 'paused' as const, updateTime: now };
        if (p.status === 'paused') return { ...p, status: 'active' as const, updateTime: now };
      }
      return p;
    }));
  };

  // 同步到店铺
  const handleSyncToStores = (promotion: PromotionActivity) => {
    setSyncingPromotion(promotion);
    setSyncDialogOpen(true);
  };

  // 确认同步
  const handleConfirmSync = () => {
    if (syncingPromotion) {
      const now = new Date().toLocaleString();
      setPromotions(promotions.map(p => {
        if (p.id === syncingPromotion.id) {
          return {
            ...p,
            storeConfigs: p.storeConfigs.map(s => ({
              ...s,
              synced: s.selected,
              syncTime: s.selected ? now : undefined,
              syncStatus: 'success' as const,
            })),
            updateTime: now,
          };
        }
        return p;
      }));
    }
    setSyncDialogOpen(false);
    setSyncingPromotion(null);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="总部促销活动" description="创建和管理总部统一促销活动，配置商品价格，同步到各店铺收银台">
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
        <Button onClick={handleCreatePromotion}>
          <Plus className="h-4 w-4 mr-2" />
          创建活动
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">活动总数</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">进行中</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">待发布</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">使用次数</p>
                  <p className="text-2xl font-bold">{stats.totalUsage}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">销售总额</p>
                  <p className="text-2xl font-bold">¥{stats.totalSales.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">优惠金额</p>
                  <p className="text-2xl font-bold text-orange-600">¥{stats.totalDiscount.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 店铺促销申请 */}
          {shopRequests.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-orange-700">
                  <AlertCircle className="h-5 w-5" />
                  店铺促销申请待审批
                  <Badge className="bg-orange-500">{shopRequests.length} 条</Badge>
                </CardTitle>
                <CardDescription>以下店铺提交的促销活动需要您审批</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shopRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{request.shop_name}</span>
                          <Badge variant="outline">{request.staff_name}</Badge>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">{request.name}</span>
                          <span className="mx-2">·</span>
                          <span className="text-gray-400">{request.start_date} 至 {request.end_date}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          {request.products?.length || 0} 个商品 · {request.type === 'discount' ? '折扣促销' : request.type === 'gift' ? '买赠活动' : request.type === 'full_reduce' ? '满减活动' : '秒杀活动'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setRequestDetailOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          查看
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setSelectedRequest(request);
                            handleApproveRequest(request.id, 'approved', '');
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          通过
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            setSelectedRequest(request);
                            setRequestDetailOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          拒绝
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 搜索和筛选 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索活动名称或编号..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="活动状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="pending">待发布</SelectItem>
                    <SelectItem value="active">进行中</SelectItem>
                    <SelectItem value="paused">已暂停</SelectItem>
                    <SelectItem value="ended">已结束</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="活动类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    {Object.entries(PROMOTION_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 活动列表 */}
          <Card>
            <CardHeader>
              <CardTitle>活动列表</CardTitle>
              <CardDescription>共 {filteredPromotions.length} 个活动</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>活动信息</TableHead>
                      <TableHead>活动类型</TableHead>
                      <TableHead>商品范围</TableHead>
                      <TableHead>店铺同步</TableHead>
                      <TableHead>活动时间</TableHead>
                      <TableHead>效果数据</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPromotions.map((promotion) => {
                      const typeConfig = PROMOTION_TYPE_CONFIG[promotion.type];
                      const syncedCount = promotion.storeConfigs.filter(s => s.synced).length;
                      const totalCount = promotion.storeConfigs.length;
                      
                      return (
                        <TableRow key={promotion.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{promotion.name}</div>
                              <div className="text-xs text-gray-500">{promotion.code}</div>
                              <div className="text-xs text-gray-400 mt-1 line-clamp-1">{promotion.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{typeConfig.name}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {promotion.productScope === 'all' ? (
                                <Badge className="bg-blue-50 text-blue-700">全部商品</Badge>
                              ) : promotion.productScope === 'category' ? (
                                <Badge className="bg-purple-50 text-purple-700">
                                  {promotion.selectedCategories.length} 个分类
                                </Badge>
                              ) : (
                                <Badge className="bg-green-50 text-green-700">
                                  {promotion.productConfigs.length} 款商品
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-gray-400" />
                              <span className={cn(
                                "text-sm",
                                syncedCount === totalCount ? "text-green-600" : "text-orange-600"
                              )}>
                                {syncedCount}/{totalCount}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{promotion.startTime.split(' ')[0]}</div>
                              <div className="text-gray-500 text-xs">至 {promotion.endTime.split(' ')[0]}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{promotion.usageCount} 次</div>
                              <div className="text-gray-500 text-xs">¥{promotion.totalSales.toLocaleString()}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusStyle(promotion.status)}>
                              {getStatusText(promotion.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetail(promotion)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  查看详情
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditPromotion(promotion)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  编辑活动
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCopyPromotion(promotion)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  复制活动
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {promotion.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handlePublishPromotion(promotion.id)}>
                                    <Send className="h-4 w-4 mr-2" />
                                    发布活动
                                  </DropdownMenuItem>
                                )}
                                {(promotion.status === 'pending' || promotion.status === 'active' || promotion.status === 'paused') && (
                                  <DropdownMenuItem onClick={() => handleToggleStatus(promotion.id)}>
                                    {promotion.status === 'active' ? (
                                      <>
                                        <Pause className="h-4 w-4 mr-2" />
                                        暂停活动
                                      </>
                                    ) : (
                                      <>
                                        <Play className="h-4 w-4 mr-2" />
                                        启用活动
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleSyncToStores(promotion)}>
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  同步到店铺
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    setPromotionToDelete(promotion.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  删除活动
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {filteredPromotions.length === 0 && (
                  <div className="text-center py-12">
                    <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">暂无活动</p>
                    <Button className="mt-4" onClick={handleCreatePromotion}>
                      <Plus className="h-4 w-4 mr-2" />
                      创建活动
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 创建/编辑活动对话框 */}
      <PromotionFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        promotion={selectedPromotion}
        stores={mockStores}
        categories={mockCategories}
        products={mockProducts}
        onSave={handleSavePromotion}
      />

      {/* 活动详情对话框 */}
      <PromotionDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        promotion={selectedPromotion}
        categories={mockCategories}
      />

      {/* 店铺促销申请详情弹窗 */}
      <ShopRequestDetailDialog
        open={requestDetailOpen}
        onOpenChange={setRequestDetailOpen}
        request={selectedRequest}
        onApprove={handleApproveRequest}
        approving={approving}
      />

      {/* 同步确认对话框 */}
      <AlertDialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认同步到店铺</AlertDialogTitle>
            <AlertDialogDescription>
              将活动「{syncingPromotion?.name}」同步到 {syncingPromotion?.storeScope === 'all' ? '所有店铺' : `选中的 ${syncingPromotion?.storeConfigs.filter(s => s.selected).length} 家店铺`}？
              <br />
              同步后，店铺收银台将自动应用该活动到对应商品。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSync}>
              确认同步
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个促销活动吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePromotion} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============== 活动表单对话框组件 ==============

interface PromotionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion: PromotionActivity | null;
  stores: PromotionStoreConfig[];
  categories: { id: string; name: string }[];
  products: PromotionProductConfig[];
  onSave: (promotion: PromotionActivity) => void;
}

function PromotionFormDialog({ open, onOpenChange, promotion, stores, categories, products, onSave }: PromotionFormDialogProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<Partial<PromotionActivity>>({});
  const [productConfigs, setProductConfigs] = useState<PromotionProductConfig[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ field: string; message: string }[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // 初始化
  useEffect(() => {
    if (open) {
      if (promotion) {
        setFormData(promotion);
        setProductConfigs(promotion.productConfigs);
        setSelectedStores(promotion.storeConfigs.filter(s => s.selected).map(s => s.storeId));
      } else {
        setFormData({
          type: 'discount_percent',
          productScope: 'all',
          storeScope: 'all',
          status: 'draft',
          priority: 1,
          conditions: {},
          rewards: {},
        });
        setProductConfigs([]);
        setSelectedStores([]);
      }
      setValidationErrors([]);
      setActiveTab('basic');
    }
  }, [open, promotion]);

  // 获取当前活动类型配置
  const typeConfig = formData.type ? PROMOTION_TYPE_CONFIG[formData.type] : null;

  // 筛选商品
  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    const search = productSearch.toLowerCase();
    return products.filter(p => 
      p.productName.toLowerCase().includes(search) ||
      p.barcode.includes(search) ||
      p.category.toLowerCase().includes(search)
    );
  }, [products, productSearch]);

  // 切换商品选择
  const toggleProductSelection = (productId: string) => {
    const existingIndex = productConfigs.findIndex(p => p.productId === productId);
    if (existingIndex >= 0) {
      setProductConfigs(productConfigs.filter((_, i) => i !== existingIndex));
    } else {
      const product = products.find(p => p.productId === productId);
      if (product) {
        setProductConfigs([...productConfigs, { ...product }]);
      }
    }
  };

  // 更新商品配置
  const updateProductConfig = (productId: string, updates: Partial<PromotionProductConfig>) => {
    setProductConfigs(productConfigs.map(p => 
      p.productId === productId ? { ...p, ...updates } : p
    ));
  };

  // 根据分类批量选择商品
  const selectProductsByCategory = (categoryId: string, selected: boolean) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    if (selected) {
      const categoryProducts = products.filter(p => p.category === category.name);
      const newProducts = categoryProducts.filter(p => 
        !productConfigs.some(pc => pc.productId === p.productId)
      );
      setProductConfigs([...productConfigs, ...newProducts]);
    } else {
      setProductConfigs(productConfigs.filter(p => p.category !== category.name));
    }
  };

  // 验证并保存
  const handleSave = () => {
    const now = new Date().toLocaleString();
    
    const promotionData: PromotionActivity = {
      id: promotion?.id || `promo-${Date.now()}`,
      code: promotion?.code || generatePromotionCode(),
      name: formData.name || '',
      type: formData.type || 'discount_percent',
      status: formData.status || 'draft',
      description: formData.description || '',
      startTime: formData.startTime || '',
      endTime: formData.endTime || '',
      timeSlots: formData.timeSlots,
      priority: formData.priority || 1,
      productScope: formData.productScope || 'all',
      selectedCategories: formData.selectedCategories || [],
      productConfigs: productConfigs,
      storeScope: formData.storeScope || 'all',
      storeConfigs: stores.map(s => ({
        ...s,
        selected: formData.storeScope === 'all' || selectedStores.includes(s.storeId),
      })),
      conditions: formData.conditions || {},
      rewards: formData.rewards || {},
      usageCount: promotion?.usageCount || 0,
      totalSales: promotion?.totalSales || 0,
      totalDiscount: promotion?.totalDiscount || 0,
      createBy: promotion?.createBy || 'admin',
      createTime: promotion?.createTime || now,
      updateTime: now,
      publishTime: promotion?.publishTime,
    };

    // 验证
    const result = validatePromotion(promotionData);
    if (!result.valid) {
      setValidationErrors(result.errors);
      // 跳转到第一个错误的标签页
      const firstError = result.errors[0];
      if (firstError.field.includes('product') || firstError.field.includes('category')) {
        setActiveTab('products');
      } else if (firstError.field.includes('store')) {
        setActiveTab('stores');
      } else if (firstError.field.includes('condition') || firstError.field.includes('reward')) {
        setActiveTab('rules');
      }
      return;
    }

    onSave(promotionData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose => { if (!onClose) onOpenChange(false); }}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{promotion ? '编辑活动' : '创建促销活动'}</DialogTitle>
          <DialogDescription>
            设置活动基本信息、商品价格、活动规则和店铺分配
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="products">商品配置 *</TabsTrigger>
            <TabsTrigger value="rules">活动规则</TabsTrigger>
            <TabsTrigger value="stores">店铺分配 *</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* 基本信息 */}
            <TabsContent value="basic" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>活动名称 *</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：周末买二送一"
                  />
                </div>
                <div className="space-y-2">
                  <Label>活动类型 *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v as PromotionType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROMOTION_TYPE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div>
                            <div>{config.name}</div>
                            <div className="text-xs text-gray-500">{config.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>活动说明</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述活动的详细内容和规则，此说明将显示在收银台"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>开始时间 *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.startTime || ''}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>结束时间 *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.endTime || ''}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>活动优先级</Label>
                  <Input
                    type="number"
                    value={formData.priority || 1}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    placeholder="数字越小优先级越高"
                  />
                  <p className="text-xs text-gray-500">当多个活动冲突时，优先级高的活动先生效</p>
                </div>
              </div>
            </TabsContent>

            {/* 商品配置 - 必须选择商品 */}
            <TabsContent value="products" className="space-y-4 mt-0">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">商品选择说明</p>
                    <p className="text-sm text-blue-700 mt-1">
                      促销活动必须关联商品。您可以选择全部商品、按分类选择或指定具体商品。
                      {typeConfig?.requiresProductPrice && ' 当前活动类型需要为每个商品设置促销价格。'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>商品范围 *</Label>
                <Select
                  value={formData.productScope}
                  onValueChange={(v) => setFormData({ ...formData, productScope: v as 'all' | 'category' | 'product' })}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部商品</SelectItem>
                    <SelectItem value="category">按分类选择</SelectItem>
                    <SelectItem value="product">指定商品</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 按分类选择 */}
              {formData.productScope === 'category' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">选择商品分类</CardTitle>
                    <CardDescription>选择分类后，该分类下所有商品都参与活动</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {categories.map((category) => {
                        const isSelected = formData.selectedCategories?.includes(category.id);
                        return (
                          <div
                            key={category.id}
                            className={cn(
                              "border-2 rounded-lg p-4 cursor-pointer transition-all min-w-[120px] text-center",
                              isSelected
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                            onClick={() => {
                              const current = formData.selectedCategories || [];
                              const updated = isSelected
                                ? current.filter(id => id !== category.id)
                                : [...current, category.id];
                              setFormData({ ...formData, selectedCategories: updated });
                            }}
                          >
                            <div className="font-medium">{category.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {products.filter(p => p.category === category.name).length} 款商品
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 指定商品选择 */}
              {formData.productScope === 'product' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">选择商品并设置价格</CardTitle>
                        <CardDescription>
                          已选择 {productConfigs.length} 款商品
                          {typeConfig?.requiresProductPrice && '，请为每款商品设置促销价'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="搜索商品名称/条码..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-48"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProductConfigs(products.map(p => ({ ...p })))}
                        >
                          全选
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProductConfigs([])}
                        >
                          清空
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                      {filteredProducts.map((product) => {
                        const isSelected = productConfigs.some(p => p.productId === product.productId);
                        const config = productConfigs.find(p => p.productId === product.productId);
                        
                        return (
                          <div
                            key={product.productId}
                            className={cn(
                              "border rounded-lg p-4 transition-all",
                              isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleProductSelection(product.productId)}
                                />
                                <div>
                                  <div className="font-medium">{product.productName}</div>
                                  <div className="text-sm text-gray-500">
                                    {product.barcode && `条码: ${product.barcode} · `}
                                    分类: {product.category} · 原价: ¥{product.originalPrice}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {isSelected && typeConfig?.requiresProductPrice && (
                              <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-xs">促销价 *</Label>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500">¥</span>
                                    <Input
                                      type="number"
                                      value={config?.promotionPrice || ''}
                                      onChange={(e) => updateProductConfig(product.productId, {
                                        promotionPrice: Number(e.target.value)
                                      })}
                                      className="w-24"
                                      placeholder="0.00"
                                    />
                                  </div>
                                  {config?.promotionPrice && config.promotionPrice < product.originalPrice && (
                                    <div className="text-xs text-green-600">
                                      降价 {((1 - config.promotionPrice / product.originalPrice) * 100).toFixed(1)}%
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">限购数量</Label>
                                  <Input
                                    type="number"
                                    value={config?.limitQuantity || ''}
                                    onChange={(e) => updateProductConfig(product.productId, {
                                      limitQuantity: Number(e.target.value) || undefined
                                    })}
                                    className="w-24"
                                    placeholder="不限"
                                  />
                                </div>
                                {formData.type === 'buy_x_get_y' && (
                                  <div className="space-y-1">
                                    <Label className="text-xs">赠品数量</Label>
                                    <Input
                                      type="number"
                                      value={config?.giftQuantity || ''}
                                      onChange={(e) => updateProductConfig(product.productId, {
                                        giftQuantity: Number(e.target.value) || undefined
                                      })}
                                      className="w-24"
                                      placeholder="1"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 全部商品 */}
              {formData.productScope === 'all' && (
                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">活动将应用到所有商品</p>
                      <p className="text-sm text-gray-500 mt-1">共 {products.length} 款商品</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 活动规则 */}
            <TabsContent value="rules" className="space-y-4 mt-0">
              {typeConfig && (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>活动类型：</strong>{typeConfig.name} - {typeConfig.description}
                  </p>
                </div>
              )}

              {/* 折扣设置 */}
              {typeConfig?.requiresDiscountPercent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">折扣设置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>折扣百分比（%）*</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={formData.rewards?.discountPercent || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              rewards: { ...formData.rewards, discountPercent: Number(e.target.value) }
                            })}
                            placeholder="例如：90表示9折"
                          />
                          <span className="text-gray-500">%</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formData.rewards?.discountPercent && (
                            <>相当于 {(formData.rewards.discountPercent / 10).toFixed(1)} 折</>
                          )}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>最高优惠金额（可选）</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">¥</span>
                          <Input
                            type="number"
                            value={formData.rewards?.maxDiscount || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              rewards: { ...formData.rewards, maxDiscount: Number(e.target.value) || undefined }
                            })}
                            placeholder="不限制则留空"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 满减设置 */}
              {formData.type === 'discount_amount' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">满减设置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>最低消费金额 *</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">¥</span>
                          <Input
                            type="number"
                            value={formData.conditions?.minAmount || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              conditions: { ...formData.conditions, minAmount: Number(e.target.value) }
                            })}
                            placeholder="如：100"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>减免金额 *</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">¥</span>
                          <Input
                            type="number"
                            value={formData.rewards?.discountAmount || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              rewards: { ...formData.rewards, discountAmount: Number(e.target.value) }
                            })}
                            placeholder="如：20"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 买赠设置 */}
              {typeConfig?.requiresBuyGet && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">买赠设置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>购买数量 *</Label>
                        <Input
                          type="number"
                          value={formData.conditions?.buyQuantity || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            conditions: { ...formData.conditions, buyQuantity: Number(e.target.value) }
                          })}
                          placeholder="如：2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>赠送数量 *</Label>
                        <Input
                          type="number"
                          value={formData.rewards?.freeQuantity || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            rewards: { ...formData.rewards, freeQuantity: Number(e.target.value) }
                          })}
                          placeholder="如：1"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      买赠规则：购买{formData.conditions?.buyQuantity || 'N'}件，赠送{formData.rewards?.freeQuantity || 'M'}件同款商品
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 会员专享设置 */}
              {formData.type === 'member_exclusive' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">会员专享设置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>适用会员等级 *</Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'silver', name: '银卡会员' },
                          { id: 'gold', name: '金卡会员' },
                          { id: 'diamond', name: '钻石会员' },
                        ].map((level) => (
                          <Badge
                            key={level.id}
                            variant={formData.conditions?.memberLevels?.includes(level.id) ? 'default' : 'outline'}
                            className="cursor-pointer px-4 py-2"
                            onClick={() => {
                              const levels = formData.conditions?.memberLevels || [];
                              const newLevels = levels.includes(level.id)
                                ? levels.filter(l => l !== level.id)
                                : [...levels, level.id];
                              setFormData({
                                ...formData,
                                conditions: { ...formData.conditions, memberLevels: newLevels }
                              });
                            }}
                          >
                            {level.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>会员折扣 *</Label>
                      <Input
                        type="number"
                        value={formData.rewards?.discountPercent || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          rewards: { ...formData.rewards, discountPercent: Number(e.target.value) }
                        })}
                        placeholder="如：90表示9折"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 时段设置（秒杀/清货） */}
              {typeConfig?.requiresTimeSlots && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">时段设置</CardTitle>
                    <CardDescription>设置活动有效时段，不设置则全天有效</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(formData.timeSlots || []).map((slot, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">开始</Label>
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => {
                              const newSlots = [...(formData.timeSlots || [])];
                              newSlots[index] = { ...newSlots[index], startTime: e.target.value };
                              setFormData({ ...formData, timeSlots: newSlots });
                            }}
                            className="w-32"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">结束</Label>
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => {
                              const newSlots = [...(formData.timeSlots || [])];
                              newSlots[index] = { ...newSlots[index], endTime: e.target.value };
                              setFormData({ ...formData, timeSlots: newSlots });
                            }}
                            className="w-32"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newSlots = (formData.timeSlots || []).filter((_, i) => i !== index);
                            setFormData({ ...formData, timeSlots: newSlots });
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newSlots = [...(formData.timeSlots || []), { startTime: '12:00', endTime: '14:00' }];
                        setFormData({ ...formData, timeSlots: newSlots });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      添加时段
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* 其他条件 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">其他条件（可选）</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>最低购买数量</Label>
                      <Input
                        type="number"
                        value={formData.conditions?.minQuantity || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          conditions: { ...formData.conditions, minQuantity: Number(e.target.value) || undefined }
                        })}
                        placeholder="不限制则留空"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>积分倍数</Label>
                      <Input
                        type="number"
                        value={formData.rewards?.pointsMultiplier || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          rewards: { ...formData.rewards, pointsMultiplier: Number(e.target.value) || undefined }
                        })}
                        placeholder="如：2表示双倍积分"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 店铺分配 */}
            <TabsContent value="stores" className="space-y-4 mt-0">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Store className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">店铺分配说明</p>
                    <p className="text-sm text-blue-700 mt-1">
                      选择参与活动的店铺。同步后，店铺收银台将自动应用活动到对应商品，收银时会自动计算优惠。
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>店铺范围 *</Label>
                <Select
                  value={formData.storeScope}
                  onValueChange={(v) => setFormData({ ...formData, storeScope: v as 'all' | 'selected' })}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部店铺</SelectItem>
                    <SelectItem value="selected">指定店铺</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.storeScope === 'selected' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">选择店铺</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStores(stores.map(s => s.storeId))}
                        >
                          全选
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStores([])}
                        >
                          清空
                        </Button>
                      </div>
                    </div>
                    <CardDescription>已选择 {selectedStores.length} 家店铺</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {stores.map((store) => (
                        <div
                          key={store.storeId}
                          className={cn(
                            "border rounded-lg p-4 cursor-pointer transition-all",
                            selectedStores.includes(store.storeId)
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          onClick={() => {
                            setSelectedStores(prev =>
                              prev.includes(store.storeId)
                                ? prev.filter(id => id !== store.storeId)
                                : [...prev, store.storeId]
                            );
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedStores.includes(store.storeId)}
                              className="mt-1"
                            />
                            <div>
                              <div className="font-medium">{store.storeName}</div>
                              <div className="text-xs text-gray-500 mt-1">{store.storeAddress}</div>
                              {store.synced && (
                                <div className="text-xs text-green-600 mt-1">
                                  <CheckCircle className="h-3 w-3 inline mr-1" />
                                  已同步 {store.syncTime}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {formData.storeScope === 'all' && (
                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Store className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">活动将自动应用到所有店铺</p>
                      <p className="text-sm text-gray-500 mt-1">共 {stores.length} 家店铺</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* 验证错误提示 */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            <div className="flex items-center gap-2 text-red-700 font-medium">
              <AlertCircle className="h-4 w-4" />
              请修正以下问题
            </div>
            <ul className="mt-2 text-sm text-red-600 space-y-1">
              {validationErrors.map((error, i) => (
                <li key={i}>{error.message}</li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            {promotion ? '保存修改' : '创建活动'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============== 活动详情对话框组件 ==============

interface PromotionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion: PromotionActivity | null;
  categories: { id: string; name: string }[];
}

function PromotionDetailDialog({ open, onOpenChange, promotion, categories }: PromotionDetailDialogProps) {
  if (!promotion) return null;

  const typeConfig = PROMOTION_TYPE_CONFIG[promotion.type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{promotion.name}</DialogTitle>
          <DialogDescription>{promotion.code}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">活动类型</p>
                  <Badge variant="outline" className="mt-1">{typeConfig.name}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">活动状态</p>
                  <Badge className={cn("mt-1", getStatusStyle(promotion.status))}>
                    {getStatusText(promotion.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">活动时间</p>
                  <p className="mt-1">{promotion.startTime.split(' ')[0]} 至 {promotion.endTime.split(' ')[0]}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">优先级</p>
                  <p className="mt-1">{promotion.priority}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">活动说明</p>
                <p className="mt-1">{promotion.description || '暂无'}</p>
              </div>
            </CardContent>
          </Card>

          {/* 商品范围 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">商品范围</CardTitle>
            </CardHeader>
            <CardContent>
              {promotion.productScope === 'all' ? (
                <p className="text-gray-600">全部商品</p>
              ) : promotion.productScope === 'category' ? (
                <div className="flex flex-wrap gap-2">
                  {promotion.selectedCategories.map((catId) => {
                    const cat = categories.find(c => c.id === catId);
                    return <Badge key={catId} variant="outline">{cat?.name || catId}</Badge>;
                  })}
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {promotion.productConfigs.map((product) => (
                    <div key={product.productId} className="flex items-center justify-between text-sm border-b pb-2">
                      <div>
                        <span className="font-medium">{product.productName}</span>
                        <span className="text-gray-500 ml-2">原价 ¥{product.originalPrice}</span>
                      </div>
                      <div className="text-right">
                        {product.promotionPrice && (
                          <span className="text-red-600 font-medium">促销价 ¥{product.promotionPrice}</span>
                        )}
                        {product.limitQuantity && (
                          <span className="text-gray-500 ml-2">限购{product.limitQuantity}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 店铺同步状态 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">店铺同步</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {promotion.storeConfigs.map((store) => (
                  <Badge key={store.storeId} variant={store.synced ? 'default' : 'outline'}>
                    {store.storeName}
                    {store.synced && <CheckCircle className="h-3 w-3 ml-1" />}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-3">
                已同步 {promotion.storeConfigs.filter(s => s.synced).length}/{promotion.storeConfigs.length} 家店铺
              </p>
            </CardContent>
          </Card>

          {/* 效果数据 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">效果数据</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{promotion.usageCount}</p>
                  <p className="text-sm text-gray-500">使用次数</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">¥{promotion.totalSales.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">销售金额</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">¥{promotion.totalDiscount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">优惠金额</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============== 店铺促销申请详情弹窗组件 ==============

interface ShopRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ShopPromotionRequest | null;
  onApprove: (requestId: string, status: 'approved' | 'rejected', remark: string) => void;
  approving: boolean;
}

function ShopRequestDetailDialog({ open, onOpenChange, request, onApprove, approving }: ShopRequestDialogProps) {
  const [approveRemark, setApproveRemark] = useState('');

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>促销申请详情</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-500">申请店铺</Label>
              <p className="font-medium">{request.shop_name}</p>
            </div>
            <div>
              <Label className="text-gray-500">申请人</Label>
              <p className="font-medium">{request.staff_name}</p>
            </div>
            <div>
              <Label className="text-gray-500">促销名称</Label>
              <p className="font-medium">{request.name}</p>
            </div>
            <div>
              <Label className="text-gray-500">促销类型</Label>
              <p className="font-medium">
                {request.type === 'discount' ? '折扣促销' : 
                 request.type === 'gift' ? '买赠活动' : 
                 request.type === 'full_reduce' ? '满减活动' : '秒杀活动'}
              </p>
            </div>
            <div>
              <Label className="text-gray-500">开始日期</Label>
              <p className="font-medium">{request.start_date}</p>
            </div>
            <div>
              <Label className="text-gray-500">结束日期</Label>
              <p className="font-medium">{request.end_date}</p>
            </div>
          </div>

          {/* 申请说明 */}
          {request.remark && (
            <div>
              <Label className="text-gray-500">申请说明</Label>
              <p className="mt-1 p-3 bg-gray-50 rounded-lg">{request.remark}</p>
            </div>
          )}

          {/* 促销商品 */}
          <div>
            <Label className="text-gray-500">促销商品 ({request.products?.length || 0} 个)</Label>
            <div className="mt-2 border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品名称</TableHead>
                    <TableHead className="text-right">原价</TableHead>
                    <TableHead className="text-right">促销价</TableHead>
                    <TableHead className="text-right">折扣</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {request.products?.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell className="text-right">¥{product.originalPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-red-600 font-medium">¥{product.promotionPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {((product.promotionPrice / product.originalPrice) * 10).toFixed(1)}折
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* 审批备注 */}
          <div>
            <Label>审批备注</Label>
            <Textarea
              placeholder="请输入审批备注（选填）"
              value={approveRemark}
              onChange={(e) => setApproveRemark(e.target.value)}
              rows={3}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button 
              variant="destructive"
              disabled={approving}
              onClick={() => onApprove(request.id, 'rejected', approveRemark)}
            >
              {approving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
              拒绝申请
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              disabled={approving}
              onClick={() => onApprove(request.id, 'approved', approveRemark)}
            >
              {approving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              通过申请
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
