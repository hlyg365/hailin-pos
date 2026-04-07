'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Search,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 模拟商品列表
const availableProducts = [
  { id: 1, name: '可口可乐500ml', unit: '箱', spec: '24瓶/箱', price: 72.00 },
  { id: 2, name: '农夫山泉550ml', unit: '箱', spec: '24瓶/箱', price: 48.00 },
  { id: 3, name: '康师傅红烧牛肉面', unit: '箱', spec: '12桶/箱', price: 54.00 },
  { id: 4, name: '双汇王中王火腿肠', unit: '箱', spec: '50根/箱', price: 125.00 },
];

// 模拟申请记录
const mockRequests = [
  { id: 1, date: '2024-01-15 10:30', items: 5, total: 1250.00, status: 'pending', remark: '库存补充' },
  { id: 2, date: '2024-01-14 09:15', items: 3, total: 680.00, status: 'approved', remark: '' },
  { id: 3, date: '2024-01-13 14:20', items: 8, total: 2100.00, status: 'rejected', remark: '库存充足' },
  { id: 4, date: '2024-01-12 11:00', items: 2, total: 450.00, status: 'approved', remark: '' },
];

interface PurchaseItem {
  productId: number;
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

export default function PurchaseRequestPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('new');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [remark, setRemark] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<typeof availableProducts[0] | null>(null);
  const [quantity, setQuantity] = useState(1);

  const filteredProducts = availableProducts.filter(p =>
    p.name.includes(searchTerm)
  );

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleAddItem = () => {
    if (!selectedProduct) return;
    
    const existing = items.find(i => i.productId === selectedProduct.id);
    if (existing) {
      setItems(items.map(i =>
        i.productId === selectedProduct.id
          ? { ...i, quantity: i.quantity + quantity }
          : i
      ));
    } else {
      setItems([...items, {
        productId: selectedProduct.id,
        name: selectedProduct.name,
        quantity,
        unit: selectedProduct.unit,
        price: selectedProduct.price,
      }]);
    }
    
    setSelectedProduct(null);
    setQuantity(1);
    setShowAddDialog(false);
  };

  const removeItem = (productId: number) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      alert('请添加采购商品');
      return;
    }
    // 模拟提交
    alert('采购申请已提交');
    router.back();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">待审批</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">已通过</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-700">已驳回</Badge>;
      default:
        return null;
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
          <h1 className="font-medium flex-1">采购申请</h1>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full rounded-none border-b bg-white h-11">
          <TabsTrigger value="new" className="flex-1">新建申请</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">申请记录</TabsTrigger>
        </TabsList>

        {/* 新建申请 */}
        <TabsContent value="new" className="p-4 space-y-4 mt-0">
          {/* 添加商品 */}
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            添加采购商品
          </Button>

          {/* 商品列表 */}
          {items.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">采购清单</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-400">
                        ¥{item.price.toFixed(2)}/{item.unit} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-red-500">
                        ¥{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() => removeItem(item.productId)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-500">合计金额</span>
                  <span className="text-lg font-bold text-red-500">
                    ¥{totalAmount.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 备注 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">申请说明</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="请输入采购原因或备注（选填）"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* 提交按钮 */}
          <Button
            className="w-full h-12"
            disabled={items.length === 0}
            onClick={handleSubmit}
          >
            提交申请
          </Button>
        </TabsContent>

        {/* 申请记录 */}
        <TabsContent value="history" className="p-4 space-y-3 mt-0">
          {mockRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{request.date}</p>
                    <p className="text-xs text-gray-400">共 {request.items} 种商品</p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-red-500">
                    ¥{request.total.toFixed(2)}
                  </span>
                  {request.remark && (
                    <span className="text-xs text-gray-400">备注: {request.remark}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* 添加商品弹窗 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>添加采购商品</DialogTitle>
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
                    {product.spec} · ¥{product.price.toFixed(2)}/{product.unit}
                  </p>
                </button>
              ))}
            </div>
            {selectedProduct && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">数量:</span>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24"
                />
                <span className="text-sm text-gray-500">{selectedProduct.unit}</span>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button disabled={!selectedProduct} onClick={handleAddItem}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
