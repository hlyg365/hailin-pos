'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ScanLine,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  QrCode,
  Check,
  X,
  ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// 模拟商品数据
const mockProducts: Record<string, { id: string; name: string; price: number; unit: string }> = {
  '6901234567890': { id: 'p1', name: '可口可乐500ml', price: 3.00, unit: '瓶' },
  '6901234567891': { id: 'p2', name: '农夫山泉550ml', price: 2.00, unit: '瓶' },
  '6901234567892': { id: 'p3', name: '康师傅红烧牛肉面', price: 4.50, unit: '桶' },
  '6901234567893': { id: 'p4', name: '双汇王中王火腿肠', price: 2.50, unit: '根' },
};

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

export default function MobileCashierPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wechat' | 'alipay' | 'card'>('wechat');
  const [showSuccess, setShowSuccess] = useState(false);
  const [memberPhone, setMemberPhone] = useState('');
  const [showMemberInput, setShowMemberInput] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 计算总价
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 扫描商品
  const handleScan = () => {
    if (!barcode.trim()) return;

    const product = mockProducts[barcode.trim()];
    if (product) {
      setCart(prev => {
        const existing = prev.find(item => item.productId === product.id);
        if (existing) {
          return prev.map(item =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [{
          id: `cart-${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          unit: product.unit,
        }, ...prev];
      });
    } else {
      alert('未找到该商品');
    }

    setBarcode('');
    inputRef.current?.focus();
  };

  // 更新数量
  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty === 0) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // 删除商品
  const removeItem = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  // 清空购物车
  const clearCart = () => {
    setCart([]);
  };

  // 处理支付
  const handlePayment = () => {
    if (cart.length === 0) return;
    setShowPayment(true);
  };

  // 确认支付
  const confirmPayment = () => {
    setShowPayment(false);
    setShowSuccess(true);
    
    // 模拟支付成功后清空
    setTimeout(() => {
      setShowSuccess(false);
      setCart([]);
      setMemberPhone('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部栏 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-3 p-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-medium flex-1">移动收银</h1>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart}>
              清空
            </Button>
          )}
        </div>

        {/* 扫码输入 */}
        <div className="px-3 pb-3 flex gap-2">
          <Input
            ref={inputRef}
            placeholder="扫描商品条码"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            className="flex-1"
          />
          <Button onClick={handleScan}>
            <ScanLine className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* 商品列表 */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ShoppingBag className="h-16 w-16 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">购物车为空</p>
            <p className="text-sm mt-1">扫描商品条码开始收银</p>
          </div>
        ) : (
          cart.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-sm text-red-500">¥{item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-red-500"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 底部结算栏 */}
      {cart.length > 0 && (
        <div className="bg-white border-t p-3 space-y-3">
          {/* 会员识别 */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setShowMemberInput(true)}
          >
            <User className="h-4 w-4 mr-2" />
            {memberPhone ? `会员: ${memberPhone}` : '识别会员（可选）'}
          </Button>

          {/* 结算信息 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">共 {totalItems} 件商品</p>
              <p className="text-xl font-bold text-red-500">
                ¥{totalAmount.toFixed(2)}
              </p>
            </div>
            <Button
              className="px-8 bg-green-500 hover:bg-green-600"
              onClick={handlePayment}
            >
              结算
            </Button>
          </div>
        </div>
      )}

      {/* 支付方式选择 */}
      <Sheet open={showPayment} onOpenChange={setShowPayment}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-left">选择支付方式</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            {/* 金额显示 */}
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">应收金额</p>
              <p className="text-3xl font-bold text-red-500">
                ¥{totalAmount.toFixed(2)}
              </p>
            </div>

            {/* 支付方式 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('wechat')}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                  paymentMethod === 'wechat' ? "border-green-500 bg-green-50" : "border-gray-200"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <QrCode className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium">微信支付</span>
              </button>
              <button
                onClick={() => setPaymentMethod('alipay')}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                  paymentMethod === 'alipay' ? "border-blue-500 bg-blue-50" : "border-gray-200"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium">支付宝</span>
              </button>
              <button
                onClick={() => setPaymentMethod('cash')}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                  paymentMethod === 'cash' ? "border-orange-500 bg-orange-50" : "border-gray-200"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                  <Banknote className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium">现金</span>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                  paymentMethod === 'card' ? "border-purple-500 bg-purple-50" : "border-gray-200"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium">银行卡</span>
              </button>
            </div>

            {/* 确认支付 */}
            <Button
              className="w-full h-12 bg-green-500 hover:bg-green-600"
              onClick={confirmPayment}
            >
              确认收款 ¥{totalAmount.toFixed(2)}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* 支付成功 */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-xs text-center">
          <div className="py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium">支付成功</h3>
            <p className="text-2xl font-bold text-green-500 mt-2">
              ¥{totalAmount.toFixed(2)}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* 会员输入 */}
      <Dialog open={showMemberInput} onOpenChange={setShowMemberInput}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>识别会员</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="请输入会员手机号"
              value={memberPhone}
              onChange={(e) => setMemberPhone(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowMemberInput(false)}>
                取消
              </Button>
              <Button className="flex-1" onClick={() => setShowMemberInput(false)}>
                确认
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
