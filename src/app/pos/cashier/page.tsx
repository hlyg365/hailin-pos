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
  ArrowLeft,
  Wifi,
  Clock,
  Printer,
  Trash2,
  Banknote
} from 'lucide-react';

interface CartItem {
  id: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
}

// 模拟商品数据
const mockProducts = [
  { id: '1', barcode: '6901234567890', name: '农夫山泉 550ml', price: 2.00 },
  { id: '2', barcode: '6901234567891', name: '康师傅方便面', price: 4.50 },
  { id: '3', barcode: '6901234567892', name: '可口可乐 330ml', price: 3.00 },
  { id: '4', barcode: '6901234567893', name: '奥利奥饼干', price: 8.50 },
  { id: '5', barcode: '6901234567894', name: '双汇火腿肠', price: 6.00 },
];

export default function CashierPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [searchBarcode, setSearchBarcode] = useState('');

  // 更新时钟
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 计算总价
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 添加商品到购物车
  const addToCart = (product: typeof mockProducts[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // 根据条码搜索
  const handleBarcodeSearch = () => {
    if (!searchBarcode.trim()) return;
    const product = mockProducts.find(p => p.barcode === searchBarcode);
    if (product) {
      addToCart(product);
      setSearchBarcode('');
    } else {
      alert('商品未找到');
    }
  };

  // 数量加减
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

  // 删除商品
  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // 清空购物车
  const clearCart = () => {
    if (confirm('确定要清空购物车吗？')) {
      setCart([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 顶部状态栏 */}
      <header className="bg-orange-500 text-white px-4 py-2 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/pos" className="flex items-center gap-1 hover:bg-orange-600 px-2 py-1 rounded">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">返回</span>
          </Link>
          <span className="font-bold">收银台</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{currentTime.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-1">
            {isOnline ? (
              <><Wifi className="w-4 h-4 text-green-300" /><span className="text-xs">在线</span></>
            ) : (
              <><Wifi className="w-4 h-4 text-red-300" /><span className="text-xs">离线</span></>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 p-4">
        {/* 左侧：商品区域 */}
        <div className="flex-1">
          {/* 扫码搜索 */}
          <div className="bg-white rounded-xl p-4 mb-4 shadow">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="请输入商品条码..."
                value={searchBarcode}
                onChange={(e) => setSearchBarcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                className="flex-1 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={handleBarcodeSearch}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
              >
                添加
              </button>
            </div>
          </div>

          {/* 商品列表 */}
          <div className="bg-white rounded-xl p-4 shadow">
            <h2 className="font-bold text-lg mb-4">商品</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {mockProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="border border-slate-200 rounded-xl p-3 text-left hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <div className="w-full h-16 bg-slate-100 rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-3xl">📦</span>
                  </div>
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-orange-500 font-bold">¥{product.price.toFixed(2)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：购物车 */}
        <div className="w-full lg:w-96">
          <div className="bg-white rounded-xl shadow sticky top-20">
            {/* 会员 */}
            <div className="p-4 border-b border-slate-100">
              <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                <User className="w-5 h-5 text-slate-400" />
                <span className="text-slate-600">添加会员</span>
              </button>
            </div>

            {/* 购物车列表 */}
            <div className="p-4 max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold">购物车</h2>
                <span className="text-sm text-slate-500">{cart.length} 件商品</span>
              </div>

              {cart.length === 0 ? (
                <p className="text-center text-slate-400 py-8">购物车为空</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-orange-500 text-sm">¥{item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 bg-slate-200 rounded flex items-center justify-center hover:bg-slate-300"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 bg-slate-200 rounded flex items-center justify-center hover:bg-slate-300"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 text-red-500 hover:bg-red-50 rounded flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 结算 */}
            <div className="p-4 border-t border-slate-100">
              <div className="flex justify-between mb-4">
                <span className="text-lg">合计</span>
                <span className="text-2xl font-bold text-orange-500">¥{total.toFixed(2)}</span>
              </div>

              <div className="space-y-2">
                <button
                  disabled={cart.length === 0}
                  onClick={() => setShowPayment(true)}
                  className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  收款 ¥{total.toFixed(2)}
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <button className="py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
                    挂单
                  </button>
                  <button
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
                  >
                    清空
                  </button>
                  <button className="py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 flex items-center justify-center gap-1">
                    <Printer className="w-4 h-4" />
                    重打
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 支付弹窗 */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-96 overflow-hidden">
            <div className="bg-orange-500 text-white p-4 text-center">
              <p className="text-sm">需支付金额</p>
              <p className="text-3xl font-bold">¥{total.toFixed(2)}</p>
            </div>
            <div className="p-4 space-y-3">
              <button className="w-full py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 flex items-center justify-center gap-2">
                <QrCode className="w-6 h-6" />
                微信支付
              </button>
              <button className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 flex items-center justify-center gap-2">
                <QrCode className="w-6 h-6" />
                支付宝
              </button>
              <button className="w-full py-4 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 flex items-center justify-center gap-2">
                <Banknote className="w-6 h-6" />
                现金支付
              </button>
              <button
                onClick={() => setShowPayment(false)}
                className="w-full py-3 text-slate-500 hover:text-slate-700"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
