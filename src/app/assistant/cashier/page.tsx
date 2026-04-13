'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Delete,
  CreditCard,
  QrCode,
  User,
  Clock,
  Printer,
  Banknote,
  Percent,
  Package,
  Search,
  X,
  CheckCircle,
  ArrowLeft,
  Wifi,
  Barcode,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CartItem {
  id: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
}

interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

const mockProducts: Product[] = [
  { id: '1', barcode: '6901234567890', name: '农夫山泉 550ml', price: 2.00, stock: 100, category: '饮料' },
  { id: '2', barcode: '6901234567891', name: '康师傅红烧牛肉面', price: 4.50, stock: 50, category: '方便食品' },
  { id: '3', barcode: '6901234567892', name: '可口可乐 330ml', price: 3.00, stock: 80, category: '饮料' },
  { id: '4', barcode: '6901234567893', name: '奥利奥夹心饼干', price: 8.50, stock: 30, category: '零食' },
  { id: '5', barcode: '6901234567894', name: '双汇王中王火腿肠', price: 6.00, stock: 40, category: '肉类' },
  { id: '6', barcode: '6901234567895', name: '蒙牛纯牛奶 250ml', price: 3.50, stock: 60, category: '乳品' },
];

const categories = ['全部', '饮料', '方便食品', '零食', '乳品', '肉类'];

export default function QuickCashierPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [total, setTotal] = useState(0);
  const [member, setMember] = useState<{name: string; level: string; points: number} | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = member ? subtotal * 0.05 : 0;
  const finalTotal = Math.max(0, subtotal - discount);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product.id, barcode: product.barcode, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const completePayment = (method: string) => {
    const orderNum = 'Q' + Date.now().toString().slice(-8);
    setOrderNumber(orderNum);
    setTotal(finalTotal);
    setOrderSuccess(true);
    
    setTimeout(() => {
      setOrderSuccess(false);
      setCart([]);
      setMember(null);
      setShowPayment(false);
    }, 3000);
  };

  const filteredProducts = mockProducts.filter(p => {
    const matchCat = selectedCategory === '全部' || p.category === selectedCategory;
    const matchSearch = !searchKeyword || p.name.includes(searchKeyword) || p.barcode.includes(searchKeyword);
    return matchCat && matchSearch;
  });

  // 支付成功
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-green-500 flex items-center justify-center">
        <div className="text-center text-white">
          <CheckCircle className="w-20 h-20 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold mb-2">收款成功</h1>
          <p className="text-3xl font-bold mb-4">¥{total.toFixed(2)}</p>
          <p className="text-green-100">订单号：{orderNumber}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <header className="bg-orange-500 text-white px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/assistant" className="flex items-center gap-1 hover:bg-orange-600 px-2 py-1 rounded">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-bold text-lg">快速收银</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm">{currentTime.toLocaleTimeString()}</span>
            {isOnline ? (
              <span className="text-xs bg-green-400 px-2 py-0.5 rounded">在线</span>
            ) : (
              <span className="text-xs bg-red-400 px-2 py-0.5 rounded">离线</span>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-3 p-3">
        {/* 商品区域 */}
        <div className="flex-1">
          {/* 搜索 */}
          <div className="bg-white rounded-xl p-3 mb-3 shadow-sm flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索商品..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* 分类 */}
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                  selectedCategory === cat ? 'bg-orange-500 text-white' : 'bg-white text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 商品列表 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white rounded-xl p-3 text-left shadow-sm hover:ring-2 hover:ring-orange-500 active:scale-95 transition-all"
              >
                <div className="w-full aspect-square bg-slate-100 rounded-lg mb-2 flex items-center justify-center">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
                <p className="font-medium text-sm truncate">{product.name}</p>
                <p className="text-orange-500 font-bold">¥{product.price.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 购物车 */}
        <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
          {/* 会员 */}
          <div className="p-3 border-b border-slate-100">
            <button 
              onClick={() => setMember(member ? null : { name: '张会员', level: '金卡', points: 1580 })}
              className="w-full flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600 flex-1 text-left">
                {member ? `${member.name} · ${member.level}` : '添加会员'}
              </span>
            </button>
          </div>

          {/* 列表 */}
          <div className="flex-1 overflow-y-auto p-3">
            {cart.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">点击商品添加到购物车</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-orange-500 text-sm">¥{item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white rounded-lg px-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 text-red-400">
                      <Delete className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 结算 */}
          <div className="p-3 border-t border-slate-100 bg-slate-50">
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 mb-2">
                <span>会员95折</span>
                <span>-¥{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">合计</span>
              <span className="text-xl font-bold text-orange-500">¥{finalTotal.toFixed(2)}</span>
            </div>
            <Button
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
              className="w-full bg-orange-500 hover:bg-orange-600"
              size="lg"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              收款 ¥{finalTotal.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>

      {/* 支付弹窗 */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-orange-500 text-white p-6 text-center">
              <p className="text-sm opacity-80">需支付</p>
              <p className="text-4xl font-bold">¥{finalTotal.toFixed(2)}</p>
            </div>
            <div className="p-4 space-y-3">
              <button 
                onClick={() => completePayment('wechat')}
                className="w-full py-4 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-3"
              >
                <QrCode className="w-6 h-6" />
                微信支付
              </button>
              <button 
                onClick={() => completePayment('alipay')}
                className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-3"
              >
                <QrCode className="w-6 h-6" />
                支付宝
              </button>
              <button 
                onClick={() => completePayment('cash')}
                className="w-full py-4 bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-3"
              >
                <Banknote className="w-6 h-6" />
                现金支付
              </button>
              <button onClick={() => setShowPayment(false)} className="w-full py-2 text-slate-500">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
