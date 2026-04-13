'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Trash2,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  FileText,
  Package,
  Minus,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// 可采购商品列表
const availableProducts = [
  { id: '1', name: '可口可乐500ml', spec: '24瓶/箱', unit: '箱', price: 72.00, category: '饮料' },
  { id: '2', name: '农夫山泉550ml', spec: '24瓶/箱', unit: '箱', price: 48.00, category: '饮料' },
  { id: '3', name: '康师傅红烧牛肉面', spec: '12桶/箱', unit: '箱', price: 54.00, category: '方便食品' },
  { id: '4', name: '双汇王中王火腿肠', spec: '50根/箱', unit: '箱', price: 125.00, category: '休闲食品' },
  { id: '5', name: '维达抽纸', spec: '10包/箱', unit: '箱', price: 89.00, category: '日用品' },
  { id: '6', name: '蒙牛纯牛奶250ml', spec: '24盒/箱', unit: '箱', price: 84.00, category: '乳制品' },
];

// 采购申请记录
interface PurchaseRequest {
  id: string;
  requestNo: string;
  items: RequestItem[];
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'purchased' | 'processing' | 'shipped';
  remark: string;
  createTime: string;
  approveTime?: string;
  rejectReason?: string;
}

interface RequestItem {
  productId: string;
  productName: string;
  spec: string;
  quantity: number;
  unit: string;
  price: number;
}

// 店铺信息（实际应从登录状态获取）
const STORE_INFO = {
  id: 'store_001',
  name: '南山店',
};

export default function StorePurchasePage() {
  const [activeTab, setActiveTab] = useState('new');
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 新建申请相关状态
  const [cartItems, setCartItems] = useState<RequestItem[]>([]);
  const [remark, setRemark] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  // 加载采购申请记录
  const loadRequests = async () => {
    setLoading(true);
    try {
      // 获取用户信息
      const userData = localStorage.getItem('store_admin_user');
      const user = userData ? JSON.parse(userData) : null;

      // 从审批系统获取采购申请记录
      const response = await fetch(`/api/approvals?userId=${user?.id}&status=all`);
      const result = await response.json();

      if (result.success && result.data) {
        // 过滤出采购相关的申请
        const purchaseRequests = result.data
          .filter((item: any) => item.request_type === 'purchase' && item.flow_type === 'store_purchase')
          .map((item: any) => ({
            id: item.id,
            requestNo: item.request_id,
            items: (item.request_data?.items || []).map((reqItem: any) => ({
              productId: reqItem.productId,
              productName: reqItem.productName,
              spec: reqItem.spec || '',
              quantity: reqItem.quantity,
              unit: reqItem.unit,
              price: reqItem.price || 0,
            })),
            totalAmount: item.request_data?.totalAmount || 0,
            status: item.status,
            remark: item.request_data?.remark || '',
            createTime: item.created_at,
            approveTime: item.completed_at,
          }));
        setRequests(purchaseRequests);
      }
    } catch (error) {
      console.error('加载采购申请记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadRequests();
  }, []);

  // 筛选商品
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return availableProducts;
    return availableProducts.filter(p =>
      p.name.includes(searchTerm) || p.category.includes(searchTerm)
    );
  }, [searchTerm]);

  // 计算总金额
  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  // 添加商品到购物车
  const handleAddToCart = () => {
    const product = availableProducts.find(p => p.id === selectedProduct);
    if (!product) return;

    const existing = cartItems.find(i => i.productId === product.id);
    if (existing) {
      setCartItems(cartItems.map(i =>
        i.productId === product.id
          ? { ...i, quantity: i.quantity + quantity }
          : i
      ));
    } else {
      setCartItems([...cartItems, {
        productId: product.id,
        productName: product.name,
        spec: product.spec,
        quantity,
        unit: product.unit,
        price: product.price,
      }]);
    }

    setSelectedProduct('');
    setQuantity(1);
    setAddDialogOpen(false);
  };

  // 从购物车移除商品
  const handleRemoveFromCart = (productId: string) => {
    setCartItems(cartItems.filter(i => i.productId !== productId));
  };

  // 更新购物车商品数量
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems(cartItems.map(i =>
      i.productId === productId ? { ...i, quantity: newQuantity } : i
    ));
  };

  // 提交采购申请
  const handleSubmit = async () => {
    if (cartItems.length === 0) return;

    setSubmitting(true);
    try {
      // 获取用户信息
      const userData = localStorage.getItem('store_admin_user');
      const user = userData ? JSON.parse(userData) : null;

      // 转换商品格式为API需要的格式
      const apiItems = cartItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productIcon: '',
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        spec: item.spec,
      }));

      // 创建审批记录
      const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const response = await fetch('/api/purchase-requests/approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId: user?.storeId || STORE_INFO.id,
          storeName: user?.storeName || STORE_INFO.name,
          items: apiItems,
          totalAmount,
          remark: remark,
          applicantId: user?.id || 'store-001',
          applicantName: user?.name || '示例用户',
          isHeadquarters: false, // 店铺采购
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('店铺采购申请已提交，等待运营经理审批');
        setCartItems([]);
        setRemark('');
        setSubmitDialogOpen(false);
        setActiveTab('history');
        // 重新加载列表
        loadRequests();
      } else {
        toast.error(result.error || '提交失败');
      }
    } catch (error) {
      console.error('提交采购申请失败:', error);
      toast.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return { label: '待审批', className: 'bg-yellow-100 text-yellow-700', icon: Clock };
      case 'approved': return { label: '已通过', className: 'bg-green-100 text-green-700', icon: CheckCircle };
      case 'rejected': return { label: '已拒绝', className: 'bg-red-100 text-red-700', icon: XCircle };
      case 'processing': return { label: '处理中', className: 'bg-blue-100 text-blue-700', icon: ShoppingCart };
      case 'shipped': return { label: '已发货', className: 'bg-purple-100 text-purple-700', icon: Package };
      case 'purchased': return { label: '已采购', className: 'bg-indigo-100 text-indigo-700', icon: CheckCircle };
      default: return { label: '未知', className: 'bg-gray-100 text-gray-700', icon: Clock };
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="采购申请" description="向总部提交采购需求，等待审批通过后统一采购配送" />

      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b px-4 pt-4">
            <TabsList>
              <TabsTrigger value="new">新建申请</TabsTrigger>
              <TabsTrigger value="history">申请记录</TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-4">
            <TabsContent value="new" className="mt-0 space-y-4">
              {/* 添加商品按钮 */}
              <div className="flex justify-between items-center">
                <h3 className="font-medium">采购商品列表</h3>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加商品
                </Button>
              </div>

              {/* 购物车商品 */}
              {cartItems.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>商品名称</TableHead>
                        <TableHead>规格</TableHead>
                        <TableHead>单价</TableHead>
                        <TableHead>数量</TableHead>
                        <TableHead>小计</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell>{item.spec}</TableCell>
                          <TableCell>¥{item.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">¥{(item.price * item.quantity).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleRemoveFromCart(item.productId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg bg-gray-50">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">暂无采购商品，请点击"添加商品"</p>
                </div>
              )}

              {/* 备注 */}
              <div className="space-y-2">
                <Label>备注说明</Label>
                <Textarea
                  placeholder="请填写采购原因或其他说明..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                />
              </div>

              {/* 总计和提交 */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <span className="text-gray-500">共 {cartItems.length} 种商品，</span>
                  <span className="text-gray-500">总计：</span>
                  <span className="text-xl font-bold text-orange-600">¥{totalAmount.toFixed(2)}</span>
                </div>
                <Button
                  disabled={cartItems.length === 0}
                  onClick={() => setSubmitDialogOpen(true)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  提交申请
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>申请单号</TableHead>
                        <TableHead>商品数量</TableHead>
                        <TableHead>总金额</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>申请时间</TableHead>
                        <TableHead>备注</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => {
                        const statusStyle = getStatusStyle(request.status);
                        const Icon = statusStyle.icon;
                        return (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.requestNo}</TableCell>
                            <TableCell>{request.items.length} 种</TableCell>
                            <TableCell className="font-medium">¥{request.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge className={statusStyle.className}>
                                <Icon className="h-3 w-3 mr-1" />
                                {statusStyle.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-500">{request.createTime}</TableCell>
                            <TableCell className="text-gray-500">{request.remark || '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!loading && requests.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">暂无采购申请记录</p>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* 添加商品对话框 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>添加采购商品</DialogTitle>
            <DialogDescription>选择需要采购的商品和数量</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索商品名称或分类..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>选择商品</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择商品" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.spec}) - ¥{product.price}/{product.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>采购数量</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddToCart} disabled={!selectedProduct || quantity < 1}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 提交确认对话框 */}
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认提交采购申请</AlertDialogTitle>
            <AlertDialogDescription>
              您即将提交包含 {cartItems.length} 种商品、总金额 ¥{totalAmount.toFixed(2)} 的采购申请。
              提交后将发送至总部审批，请确认信息无误。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                '确认提交'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
