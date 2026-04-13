'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, Plus, Minus, Delete, CreditCard, QrCode, User, Wifi, Clock, Printer, Banknote, Percent, Package, Search, X, CheckCircle, LogOut, KeyRound, Store, WifiOff, CloudOff, RefreshCw, ArrowUp, ArrowDown, Package2, TrendingUp, DollarSign
} from 'lucide-react';
import { posStore, Product, Order } from '@/lib/pos-store';

interface CartItem {
  id: string;
  productId: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
}

const categories = ['全部', '饮料', '乳品', '方便食品', '零食', '肉类', '日用品'];

export default function CashierPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<{id: string; name: string; role: string} | null>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [total, setTotal] = useState(0);
  const [member, setMember] = useState<{id: string; name: string; level: string; points: number} | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState<'none' | 'member' | 'coupon' | 'manual'>('none');
  const [todaySales, setTodaySales] = useState({ amount: 0, count: 0 });
  const [showSyncTip, setShowSyncTip] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // 初始化
  useEffect(() => {
    const init = async () => {
      await posStore.initDefaultProducts();
      const prods = await posStore.getProducts();
      setProducts(prods);
      const sales = await posStore.getTodaySales();
      setTodaySales({ amount: sales.totalAmount, count: sales.orderCount });
      const pending = await posStore.getPendingOrders();
      setPendingCount(pending.length);
    };
    init();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 网络状态
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setShowSyncTip(true); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 扫码枪监听
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = 0;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      if (now - lastKeyTime > 100) barcodeBuffer = '';
      lastKeyTime = now;
      
      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 8) {
          handleBarcodeSearch(barcodeBuffer);
        }
        barcodeBuffer = '';
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey) {
        barcodeBuffer += e.key;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  // 扫码处理
  const handleBarcodeSearch = useCallback(async (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
    } else {
      alert('未找到商品: ' + barcode);
    }
  }, [products]);

  // 登录
  const handleLogin = () => {
    if (pin === '1234') {
      setCurrentStaff({ id: '001', name: '收银员小王', role: 'cashier' });
      setIsLoggedIn(true);
      setShowLogin(false);
      setLoginError('');
    } else if (pin === '5678') {
      setCurrentStaff({ id: '002', name: '店长李明', role: 'manager' });
      setIsLoggedIn(true);
      setShowLogin(false);
      setLoginError('');
    } else {
      setLoginError('密码错误');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentStaff(null);
    setShowLogin(true);
    setPin('');
    setCart([]);
  };

  // 计算
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = discountType === 'member' ? subtotal * 0.05 : discountType === 'coupon' ? 10 : discountAmount;
  const finalTotal = Math.max(0, subtotal - discount);

  // 添加到购物车
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        id: 'ci_' + Date.now(),
        productId: product.id,
        barcode: product.barcode,
        name: product.name,
        price: product.price,
        quantity: 1
      }];
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

  const clearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      setDiscountAmount(0);
      setDiscountType('none');
      setMember(null);
    }
  };

  // 完成支付
  const completePayment = async (method: 'wechat' | 'alipay' | 'cash' | 'card') => {
    const orderNo = 'O' + Date.now().toString().slice(-10);
    setOrderNumber(orderNo);
    setTotal(finalTotal);
    setOrderSuccess(true);

    // 保存订单
    const order: Order = {
      id: 'order_' + Date.now(),
      orderNo,
      items: cart.map(item => ({
        id: item.id,
        productId: item.productId,
        barcode: item.barcode,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      })),
      totalAmount: subtotal,
      discountAmount: discount,
      finalAmount: finalTotal,
      paymentMethod: method,
      memberId: member?.id,
      memberName: member?.name,
      staffId: currentStaff?.id || '',
      staffName: currentStaff?.name || '',
      storeId: 'store_001',
      storeName: '海邻到家便利店',
      createdAt: Date.now(),
      status: 'completed',
      syncStatus: 'pending'
    };

    await posStore.saveOrder(order);

    // 更新库存
    for (const item of cart) {
      await posStore.updateStock(item.productId, item.quantity, 'sale');
    }

    // 更新今日销售
    const sales = await posStore.getTodaySales();
    setTodaySales({ amount: sales.totalAmount, count: sales.orderCount });
    setPendingCount(await (await posStore.getPendingOrders()).length);

    // 3秒后重置
    setTimeout(() => {
      setOrderSuccess(false);
      setCart([]);
      setShowPayment(false);
      setDiscountAmount(0);
      setDiscountType('none');
      setMember(null);
    }, 3000);
  };

  // 同步订单
  const syncOrders = async () => {
    const result = await posStore.syncOrders();
    setPendingCount(await (await posStore.getPendingOrders()).length);
    alert(`同步完成: 成功 ${result.success}, 失败 ${result.failed}`);
  };

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === '全部' || p.category === selectedCategory;
    const matchSearch = !searchKeyword || p.name.includes(searchKeyword) || p.barcode.includes(searchKeyword);
    return matchCat && matchSearch;
  });

  // 登录页
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 flex flex-col">
        {/* 顶部 */}
        <header className="bg-slate-900/80 backdrop-blur border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏪</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">海邻到家</h1>
                <p className="text-xs text-slate-400">社区便利店智能收银系统</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-sm font-medium">{isOnline ? '在线' : '离线'}</span>
            </div>
          </div>
        </header>

        {/* 登录表单 */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Store className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800">收银台登录</h2>
              <p className="text-slate-500 mt-2">请输入6位员工密码</p>
            </div>

            {/* 密码输入 */}
            <div className="mb-6">
              <div className="flex items-center gap-4 bg-slate-100 rounded-2xl px-6 py-4">
                <KeyRound className="w-6 h-6 text-slate-400" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setLoginError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLogin();
                    }
                  }}
                  placeholder="请输入6位密码"
                  className="flex-1 bg-transparent outline-none text-2xl tracking-widest"
                  maxLength={6}
                  autoFocus
                />
              </div>
              {loginError && (
                <p className="text-red-500 text-center mt-3 font-medium">{loginError}</p>
              )}
            </div>

            {/* 登录按钮 */}
            <button
              onClick={() => handleLogin()}
              className="w-full h-16 text-xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-2xl shadow-lg shadow-orange-500/30 transition-all active:scale-95"
            >
              登 录
            </button>

            {/* 快速登录 */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500 text-center mb-4">快速登录</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPin('1234')}
                  className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-orange-50 border-2 border-slate-200 hover:border-orange-300 rounded-xl transition-all"
                >
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    王
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-800">收银员小王</div>
                    <div className="text-xs text-slate-500">密码: 1234</div>
                  </div>
                </button>
                <button
                  onClick={() => setPin('5678')}
                  className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-orange-50 border-2 border-slate-200 hover:border-orange-300 rounded-xl transition-all"
                >
                  <div className="h-12 w-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    李
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-800">店长李明</div>
                    <div className="text-xs text-slate-500">密码: 5678</div>
                  </div>
                </button>
              </div>
            </div>

            <p className="text-xs text-center text-slate-400 mt-6">
              海邻到家智能收银系统 V3.0.7
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 支付成功
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-green-500 flex items-center justify-center">
        <div className="text-center text-white">
          <CheckCircle className="w-24 h-24 mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-bold mb-2">收款成功</h1>
          <p className="text-2xl mb-2">¥{total.toFixed(2)}</p>
          <p className="text-green-100">订单号：{orderNumber}</p>
          <p className="text-green-100 mt-2">正在打印小票...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* 顶部状态栏 */}
      <header className="bg-orange-500 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg">🏪 收银台</span>
          {currentStaff && (
            <span className="text-sm bg-white/20 px-2 py-0.5 rounded">{currentStaff.name}</span>
          )}
          {member && (
            <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{member.name} ({member.level})</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* 今日销售 */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <span>今日: ¥{todaySales.amount.toFixed(2)}</span>
            <span>{todaySales.count} 笔</span>
          </div>
          {/* 离线提示 */}
          {!isOnline && (
            <span className="flex items-center gap-1 bg-red-500 px-2 py-0.5 rounded text-sm">
              <CloudOff className="w-4 h-4" /> 离线模式
            </span>
          )}
          {/* 待同步 */}
          {pendingCount > 0 && (
            <button onClick={syncOrders} className="flex items-center gap-1 bg-yellow-500 px-2 py-0.5 rounded text-sm">
              <RefreshCw className="w-4 h-4" /> {pendingCount}待同步
            </button>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{currentTime.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-1">
            {isOnline ? <Wifi className="w-4 h-4 text-green-300" /> : <WifiOff className="w-4 h-4 text-red-300" />}
          </div>
          <button onClick={handleLogout} className="hover:bg-orange-600 px-2 py-1 rounded">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3">
        {/* 左侧：商品区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 搜索 */}
          <div className="bg-white rounded-xl p-3 mb-3 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="输入商品名称或条码..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>
            <button onClick={() => router.push('/pos/products')} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">
              <Package className="w-5 h-5" /> 商品
            </button>
            <button onClick={() => router.push('/pos/inventory')} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> 库存
            </button>
          </div>

          {/* 分类 */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
                  selectedCategory === cat ? 'bg-orange-500 text-white' : 'bg-white text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 商品网格 */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white rounded-xl p-2 text-left hover:ring-2 hover:ring-orange-500 shadow-sm"
                >
                  <div className="w-full aspect-square bg-slate-100 rounded-lg mb-2 flex items-center justify-center">
                    <Package className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-orange-500 font-bold">¥{product.price.toFixed(2)}</span>
                    <span className={`text-xs ${product.stock <= product.minStock ? 'text-red-500' : 'text-slate-400'}`}>
                      {product.stock}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：购物车 */}
        <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl shadow overflow-hidden max-h-[calc(100vh-100px)]">
          {/* 会员 */}
          <div className="p-3 border-b border-slate-100">
            <button onClick={() => setShowMember(true)} className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
              <User className="w-5 h-5 text-slate-400" />
              <span className="text-slate-600 flex-1 text-left">
                {member ? `${member.name} · ${member.level} · ${member.points}积分` : '添加会员'}
              </span>
            </button>
          </div>

          {/* 购物车列表 */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold">购物车</h2>
              <span className="text-sm text-slate-500">{cart.length} 件</span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>购物车为空</p>
                <p className="text-sm">点击商品添加到购物车</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-orange-500 text-sm">¥{item.price.toFixed(2)} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white rounded-lg px-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 text-red-500 hover:bg-red-50 rounded flex items-center justify-center">
                      <Delete className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 优惠 */}
          <div className="p-3 border-t border-slate-100">
            <button onClick={() => setShowDiscount(true)} className="w-full flex items-center justify-between p-2 bg-orange-50 rounded-lg hover:bg-orange-100">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-orange-500" />
                <span className="text-sm">
                  {discountType === 'none' ? '添加优惠' : 
                   discountType === 'member' ? '会员95折' : 
                   discountType === 'coupon' ? '优惠券减10' : `减免¥${discountAmount}`}
                </span>
              </div>
              <span className="text-orange-500 text-sm">-¥{discount.toFixed(2)}</span>
            </button>
          </div>

          {/* 结算 */}
          <div className="p-3 border-t border-slate-100 bg-slate-50">
            <div className="flex justify-between mb-3">
              <span className="text-lg">合计</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-orange-500">¥{finalTotal.toFixed(2)}</span>
                {discount > 0 && <p className="text-xs text-slate-400 line-through">¥{subtotal.toFixed(2)}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <button
                disabled={cart.length === 0}
                onClick={() => setShowPayment(true)}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 disabled:bg-slate-300 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" /> 收款 ¥{finalTotal.toFixed(2)}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={clearCart} disabled={cart.length === 0} className="py-2 border border-slate-200 rounded-lg text-sm hover:bg-white disabled:opacity-50">
                  清空
                </button>
                <button className="py-2 border border-slate-200 rounded-lg text-sm hover:bg-white flex items-center justify-center gap-1">
                  <Printer className="w-4 h-4" /> 重打
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 会员弹窗 */}
      {showMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-96 overflow-hidden">
            <div className="bg-orange-500 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold">会员识别</h3>
              <button onClick={() => setShowMember(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                <input type="text" placeholder="输入手机号" className="flex-1 border border-slate-200 rounded-lg px-4 py-2" />
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg">查询</button>
              </div>
              <button onClick={() => { setMember({ id: 'm1', name: '张会员', level: '金卡', points: 1580 }); setDiscountType('member'); setShowMember(false); }}
                className="w-full py-3 bg-slate-100 rounded-lg hover:bg-slate-200">
                测试会员（1234567890）
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 优惠弹窗 */}
      {showDiscount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-96 overflow-hidden">
            <div className="bg-orange-500 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold">优惠方式</h3>
              <button onClick={() => setShowDiscount(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <button onClick={() => { setDiscountType('none'); setDiscountAmount(0); setShowDiscount(false); }}
                className="w-full p-4 border border-slate-200 rounded-xl text-left hover:border-orange-500">
                <p className="font-medium">不使用优惠</p>
              </button>
              {member && (
                <button onClick={() => { setDiscountType('member'); setShowDiscount(false); }}
                  className="w-full p-4 border border-slate-200 rounded-xl text-left hover:border-orange-500">
                  <p className="font-medium">会员折扣 (95折)</p>
                  <p className="text-sm text-slate-500">节省 ¥{(subtotal * 0.05).toFixed(2)}</p>
                </button>
              )}
              <button onClick={() => { setDiscountType('coupon'); setDiscountAmount(10); setShowDiscount(false); }}
                className="w-full p-4 border border-slate-200 rounded-xl text-left hover:border-orange-500">
                <p className="font-medium">优惠券 (满50减10)</p>
              </button>
              <div className="flex gap-2">
                <input type="number" placeholder="手动减免金额" value={discountAmount || ''}
                  onChange={(e) => { setDiscountAmount(parseFloat(e.target.value) || 0); setDiscountType('manual'); }}
                  className="flex-1 border border-slate-200 rounded-lg px-4 py-2" />
                <button onClick={() => setShowDiscount(false)} className="px-4 py-2 bg-orange-500 text-white rounded-lg">确定</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 支付弹窗 */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[400px] overflow-hidden">
            <div className="bg-orange-500 text-white p-4 text-center">
              <p className="text-sm">需支付金额</p>
              <p className="text-4xl font-bold">¥{finalTotal.toFixed(2)}</p>
            </div>
            <div className="p-4 space-y-3">
              <button onClick={() => completePayment('wechat')} className="w-full py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 flex items-center justify-center gap-3">
                <QrCode className="w-8 h-8" /> 微信支付
              </button>
              <button onClick={() => completePayment('alipay')} className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 flex items-center justify-center gap-3">
                <QrCode className="w-8 h-8" /> 支付宝
              </button>
              <button onClick={() => completePayment('cash')} className="w-full py-4 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 flex items-center justify-center gap-3">
                <Banknote className="w-8 h-8" /> 现金支付
              </button>
              <button onClick={() => completePayment('card')} className="w-full py-4 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 flex items-center justify-center gap-3">
                <CreditCard className="w-8 h-8" /> 银行卡
              </button>
              <button onClick={() => setShowPayment(false)} className="w-full py-2 text-slate-500">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
