'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ScanLine,
  Plus,
  Minus,
  Trash2,
  Check,
  X,
  Package,
  AlertCircle,
  Keyboard,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';

// 模拟商品数据
const mockProducts = [
  { id: 1, name: '可口可乐500ml', barcode: '6901234567890', systemStock: 24, unit: '瓶', price: 3.00 },
  { id: 2, name: '农夫山泉550ml', barcode: '6901234567891', systemStock: 48, unit: '瓶', price: 2.00 },
  { id: 3, name: '康师傅红烧牛肉面', barcode: '6901234567892', systemStock: 12, unit: '桶', price: 4.50 },
  { id: 4, name: '双汇王中王火腿肠', barcode: '6901234567893', systemStock: 36, unit: '根', price: 2.50 },
];

interface StocktakeItem {
  id: string;
  productId: number;
  name: string;
  barcode: string;
  systemStock: number;
  actualStock: number;
  unit: string;
  price: number;
  note?: string;
}

export default function StocktakePage() {
  const router = useRouter();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  const [items, setItems] = useState<StocktakeItem[]>([]);
  const [barcode, setBarcode] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [note, setNote] = useState('');

  // 自动聚焦到条码输入框
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // 处理条码扫描
  const handleBarcodeScan = () => {
    if (!barcode.trim()) return;

    // 查找商品
    const product = mockProducts.find(p => p.barcode === barcode.trim());
    
    if (product) {
      // 检查是否已添加
      const existingIndex = items.findIndex(item => item.barcode === product.barcode);
      
      if (existingIndex >= 0) {
        // 已存在，增加实盘数量
        setItems(prev => prev.map((item, idx) => 
          idx === existingIndex 
            ? { ...item, actualStock: item.actualStock + 1 }
            : item
        ));
      } else {
        // 新增
        const newItem: StocktakeItem = {
          id: `item-${Date.now()}`,
          productId: product.id,
          name: product.name,
          barcode: product.barcode,
          systemStock: product.systemStock,
          actualStock: 1,
          unit: product.unit,
          price: product.price,
        };
        setItems(prev => [newItem, ...prev]);
      }
    } else {
      alert('未找到该商品，请检查条码是否正确');
    }

    setBarcode('');
    barcodeInputRef.current?.focus();
  };

  // 手动添加商品
  const handleAddItem = (product: typeof mockProducts[0], quantity: number) => {
    const existingIndex = items.findIndex(item => item.barcode === product.barcode);
    
    if (existingIndex >= 0) {
      setItems(prev => prev.map((item, idx) => 
        idx === existingIndex 
          ? { ...item, actualStock: quantity }
          : item
      ));
    } else {
      const newItem: StocktakeItem = {
        id: `item-${Date.now()}`,
        productId: product.id,
        name: product.name,
        barcode: product.barcode,
        systemStock: product.systemStock,
        actualStock: quantity,
        unit: product.unit,
        price: product.price,
      };
      setItems(prev => [newItem, ...prev]);
    }
    setShowAddDialog(false);
  };

  // 更新实盘数量
  const updateActualStock = (itemId: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newStock = Math.max(0, item.actualStock + delta);
        return { ...item, actualStock: newStock };
      }
      return item;
    }));
  };

  // 删除商品
  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  // 完成盘点
  const handleComplete = () => {
    if (items.length === 0) {
      alert('请先扫描或添加商品');
      return;
    }
    setShowCompleteDialog(true);
  };

  // 计算差异
  const getDifference = (systemStock: number, actualStock: number) => {
    const diff = actualStock - systemStock;
    return {
      value: diff,
      text: diff > 0 ? `+${diff}` : `${diff}`,
      color: diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-gray-400',
    };
  };

  // 统计数据
  const stats = {
    total: items.length,
    matched: items.filter(item => item.systemStock === item.actualStock).length,
    surplus: items.filter(item => item.actualStock > item.systemStock).length,
    shortage: items.filter(item => item.actualStock < item.systemStock).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部栏 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-3 p-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-medium flex-1">库存盘点</h1>
          <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            手动添加
          </Button>
        </div>

        {/* 扫码输入 */}
        <div className="px-3 pb-3">
          <div className="flex gap-2">
            <Input
              ref={barcodeInputRef}
              placeholder="扫描或输入条码"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBarcodeScan()}
              className="flex-1"
            />
            <Button onClick={handleBarcodeScan}>
              <ScanLine className="h-4 w-4 mr-1" />
              确定
            </Button>
          </div>
        </div>
      </header>

      {/* 统计信息 */}
      {items.length > 0 && (
        <div className="bg-white border-b p-3">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">已盘点</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-500">{stats.matched}</p>
              <p className="text-xs text-gray-500">账实相符</p>
            </div>
            <div>
              <p className="text-xl font-bold text-blue-500">{stats.surplus}</p>
              <p className="text-xs text-gray-500">盘盈</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-500">{stats.shortage}</p>
              <p className="text-xs text-gray-500">盘亏</p>
            </div>
          </div>
        </div>
      )}

      {/* 商品列表 */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ScanLine className="h-16 w-16 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">开始盘点</p>
            <p className="text-sm mt-1">扫描商品条码或手动添加商品</p>
          </div>
        ) : (
          items.map((item) => {
            const diff = getDifference(item.systemStock, item.actualStock);
            return (
              <Card key={item.id} className={cn(
                "overflow-hidden",
                diff.value !== 0 && "border-orange-200 bg-orange-50/30"
              )}>
                <div className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.barcode}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500">账面: {item.systemStock}{item.unit}</span>
                      <span className={cn("font-medium", diff.color)}>
                        差异: {diff.text}{item.unit}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateActualStock(item.id, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.actualStock}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setItems(prev => prev.map(i => 
                            i.id === item.id ? { ...i, actualStock: Math.max(0, val) } : i
                          ));
                        }}
                        className="w-16 h-8 text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateActualStock(item.id, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* 底部操作栏 */}
      {items.length > 0 && (
        <div className="bg-white border-t p-3 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setItems([])}
          >
            清空
          </Button>
          <Button
            className="flex-1 bg-green-500 hover:bg-green-600"
            onClick={handleComplete}
          >
            完成盘点
          </Button>
        </div>
      )}

      {/* 手动添加商品弹窗 */}
      <AddItemDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        products={mockProducts}
        onAdd={handleAddItem}
      />

      {/* 完成盘点确认弹窗 */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认完成盘点</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">盘点商品</span>
                <span className="font-medium">{stats.total} 种</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">账实相符</span>
                <span className="font-medium text-green-500">{stats.matched} 种</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">盘盈</span>
                <span className="font-medium text-blue-500">{stats.surplus} 种</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">盘亏</span>
                <span className="font-medium text-red-500">{stats.shortage} 种</span>
              </div>
            </div>
            <Input
              placeholder="备注（可选）"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              取消
            </Button>
            <Button 
              className="bg-green-500 hover:bg-green-600"
              onClick={() => {
                // 提交盘点数据
                alert('盘点已提交');
                router.back();
              }}
            >
              确认提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 手动添加商品弹窗组件
function AddItemDialog({
  open,
  onOpenChange,
  products,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: typeof mockProducts;
  onAdd: (product: typeof mockProducts[0], quantity: number) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<typeof mockProducts[0] | null>(null);
  const [quantity, setQuantity] = useState(1);

  const filteredProducts = products.filter(p => 
    p.name.includes(searchTerm) || p.barcode.includes(searchTerm)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>手动添加商品</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="搜索商品名称或条码"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="max-h-48 overflow-auto space-y-1">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={cn(
                  "w-full text-left p-2 rounded-lg text-sm transition-colors",
                  selectedProduct?.id === product.id 
                    ? "bg-blue-50 border-blue-200 border" 
                    : "hover:bg-gray-50"
                )}
              >
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-gray-400">{product.barcode}</p>
              </button>
            ))}
          </div>
          {selectedProduct && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">数量:</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 h-8 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(q => q + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            disabled={!selectedProduct}
            onClick={() => selectedProduct && onAdd(selectedProduct, quantity)}
          >
            添加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
