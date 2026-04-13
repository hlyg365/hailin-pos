'use client';

import { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Delete,
  CreditCard,
  QrCode,
  User,
  Wifi,
  Clock,
  Printer,
  Banknote,
  Percent,
  Package,
  Search,
  X,
  CheckCircle,
  ArrowLeft,
  LogOut,
  KeyRound,
  Store
} from 'lucide-react';

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

// 模拟商品数据
const mockProducts: Product[] = [
  { id: '1', barcode: '6901234567890', name: '农夫山泉 550ml', price: 2.00, stock: 100, category: '饮料' },
  { id: '2', barcode: '6901234567891', name: '康师傅红烧牛肉面', price: 4.50, stock: 50, category: '方便食品' },
  { id: '3', barcode: '6901234567892', name: '可口可乐 330ml', price: 3.00, stock: 80, category: '饮料' },
  { id: '4', barcode: '6901234567893', name: '奥利奥夹心饼干', price: 8.50, stock: 30, category: '零食' },
  { id: '5', barcode: '6901234567894', name: '双汇王中王火腿肠', price: 6.00, stock: 40, category: '肉类' },
  { id: '6', barcode: '6901234567895', name: '蒙牛纯牛奶 250ml', price: 3.50, stock: 60, category: '乳品' },
  { id: '7', barcode: '6901234567896', name: '统一冰红茶', price: 3.00, stock: 70, category: '饮料' },
  { id: '8', barcode: '6901234567897', name: '旺旺雪饼', price: 5.00, stock: 45, category: '零食' },
  { id: '9', barcode: '6901234567898', name: '娃哈哈纯净水', price: 1.50, stock: 120, category: '饮料' },
  { id: '10', barcode: '6901234567899', name: '康师傅冰红茶', price: 3.50, stock: 55, category: '饮料' },
  { id: '11', barcode: '6901234567900', name: '德芙巧克力 52g', price: 12.00, stock: 25, category: '零食' },
  { id: '12', barcode: '6901234567901', name: '伊利酸奶', price: 4.00, stock: 35, category: '乳品' },
];

const categories = ['全部', '饮料', '方便食品', '零食', '乳品', '肉类'];

// 模拟员工账号
const mockStaff = [
  { id: '001', name: '收银员小王', pin: '1234', role: 'cashier' },
  { id: '002', name: '店长李明', pin: '5678', role: 'manager' },
];

export default function CashierPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<{id: string; name: string; role: string} | null>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
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
  const [member, setMember] = useState<{name: string; level: string; points: number} | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState<'none' | 'member' | 'coupon' | 'manual'>('none');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  // 登录处理
  const handleLogin = () => {
    const staff = mockStaff.find(s => s.pin === pin);
    if (staff) {
      setCurrentStaff(staff);
      setIsLoggedIn(true);
      setShowLogin(false);
      setLoginError('');
    } else {
      setLoginError('工号或密码错误');
    }
  };

  // 登出处理
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentStaff(null);
    setShowLogin(true);
    setPin('');
    setCart([]);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = discountType === 'member' ? subtotal * 0.05 : discountType === 'coupon' ? 10 : discountAmount;
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

  const clearCart = () => {
    if (cart.length > 0 && confirm('确定要清空购物车吗？')) {
      setCart([]);
      setDiscountAmount(0);
      setDiscountType('none');
      setMember(null);
    }
  };

  const completePayment = (method: string) => {
    const orderNum = 'ORD' + Date.now().toString().slice(-10);
    setOrderNumber(orderNum);
    setTotal(finalTotal);
    setOrderSuccess(true);
    
    setTimeout(() => {
      setOrderSuccess(false);
      setCart([]);
      setShowPayment(false);
      setDiscountAmount(0);
      setDiscountType('none');
      setMember(null);
    }, 3000);
  };

  const filteredProducts = mockProducts.filter(p => {
    const matchCat = selectedCategory === '全部' || p.category === selectedCategory;
    const matchSearch = !searchKeyword || p.name.includes(searchKeyword) || p.barcode.includes(searchKeyword);
    return matchCat && matchSearch;
  });

  // 登录页面
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-80 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">海邻到家</h1>
          <p className="text-slate-500 mb-6">收银台登录</p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-slate-100 rounded-xl px-4 py-3">
              <KeyRound className="w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="输入员工密码"
                className="flex-1 bg-transparent outline-none text-lg"
                maxLength={6}
              />
            </div>
            
            {loginError && (
              <p className="text-red-500 text-sm">{loginError}</p>
            )}
            
            <button
              onClick={handleLogin}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
            >
              登录
            </button>
            
            <p className="text-slate-400 text-sm mt-4">
              测试账号: 1234 或 5678
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
          <CheckCircle className="w-24 h-24 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">支付成功</h1>
          <p className="text-2xl mb-4">¥{total.toFixed(2)}</p>
          <p className="text-green-100">订单号：{orderNumber}</p>
          <p className="text-green-100 mt-2">正在打印小票...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* 顶部状态栏 */}
      <header className="bg-orange-500 text-white px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg">收银台</span>
          {currentStaff && (
            <span className="text-sm bg-white/20 px-2 py-0.5 rounded">
              {currentStaff.name}
            </span>
          )}
          {member && (
            <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
              {member.name} ({member.level})
            </span>
          )}
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
          <button onClick={handleLogout} className="flex items-center gap-1 hover:bg-orange-600 px-2 py-1 rounded">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 overflow-hidden">
        {/* 左侧：商品区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 搜索栏 */}
          <div className="bg-white rounded-xl p-3 mb-3 shadow flex gap-2 flex-shrink-0">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索商品名称或扫码..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* 分类 */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-shrink-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
                  selectedCategory === cat 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 商品网格 */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white rounded-xl p-2 text-left hover:ring-2 hover:ring-orange-500 transition-all shadow-sm"
                >
                  <div className="w-full aspect-square bg-slate-100 rounded-lg mb-2 flex items-center justify-center">
                    <Package className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-orange-500 font-bold">¥{product.price.toFixed(2)}</span>
                    <span className="text-xs text-slate-400">{product.stock}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：购物车 */}
        <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl shadow overflow-hidden">
          {/* 会员 */}
          <div className="p-3 border-b border-slate-100 flex-shrink-0">
            <button 
              onClick={() => setShowMember(true)}
              className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100"
            >
              <User className="w-5 h-5 text-slate-400" />
              <span className="text-slate-600 flex-1 text-left">
                {member ? `${member.name} · ${member.level}会员 · ${member.points}积分` : '添加会员'}
              </span>
              {member && (
                <button onClick={(e) => { e.stopPropagation(); setMember(null); }} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              )}
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
                      <p className="text-orange-500 text-sm">¥{item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white rounded-lg px-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded">
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
          <div className="p-3 border-t border-slate-100 flex-shrink-0">
            <button 
              onClick={() => setShowDiscount(true)}
              className="w-full flex items-center justify-between p-2 bg-orange-50 rounded-lg hover:bg-orange-100"
            >
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-orange-500" />
                <span className="text-sm">
                  {discountType === 'none' ? '添加优惠' : 
                   discountType === 'member' ? '会员95折' : 
                   discountType === 'coupon' ? '优惠券减10元' : `手动减免¥${discountAmount}`}
                </span>
              </div>
              <span className="text-orange-500 text-sm">-¥{discount.toFixed(2)}</span>
            </button>
          </div>

          {/* 结算 */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex-shrink-0">
            <div className="flex justify-between mb-3">
              <span className="text-lg">合计</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-orange-500">¥{finalTotal.toFixed(2)}</span>
                {discount > 0 && (
                  <p className="text-xs text-slate-400 line-through">¥{subtotal.toFixed(2)}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <button
                disabled={cart.length === 0}
                onClick={() => setShowPayment(true)}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                收款 ¥{finalTotal.toFixed(2)}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="py-2 border border-slate-200 rounded-lg text-sm hover:bg-white disabled:opacity-50"
                >
                  清空
                </button>
                <button className="py-2 border border-slate-200 rounded-lg text-sm hover:bg-white flex items-center justify-center gap-1">
                  <Printer className="w-4 h-4" />
                  重打
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
                <input
                  type="text"
                  placeholder="输入手机号或会员卡号"
                  className="flex-1 border border-slate-200 rounded-lg px-4 py-2"
                />
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg">查询</button>
              </div>
              <div className="text-center text-slate-400">或</div>
              <button 
                onClick={() => {
                  setMember({ name: '张会员', level: '金卡', points: 1580 });
                  setDiscountType('member');
                  setShowMember(false);
                }}
                className="w-full py-3 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                模拟会员登录（测试用）
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
              <button 
                onClick={() => { setDiscountType('none'); setDiscountAmount(0); setShowDiscount(false); }}
                className="w-full p-4 border border-slate-200 rounded-xl text-left hover:border-orange-500"
              >
                <p className="font-medium">不使用优惠</p>
              </button>
              {member && (
                <button 
                  onClick={() => { setDiscountType('member'); setShowDiscount(false); }}
                  className="w-full p-4 border border-slate-200 rounded-xl text-left hover:border-orange-500"
                >
                  <p className="font-medium">会员折扣 (95折)</p>
                  <p className="text-sm text-slate-500">可节省 ¥{(subtotal * 0.05).toFixed(2)}</p>
                </button>
              )}
              <button 
                onClick={() => { setDiscountType('coupon'); setDiscountAmount(10); setShowDiscount(false); }}
                className="w-full p-4 border border-slate-200 rounded-xl text-left hover:border-orange-500"
              >
                <p className="font-medium">优惠券 (满50减10)</p>
                <p className="text-sm text-slate-500">需订单满50元</p>
              </button>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="输入减免金额"
                  value={discountAmount || ''}
                  onChange={(e) => { setDiscountAmount(parseFloat(e.target.value) || 0); setDiscountType('manual'); }}
                  className="flex-1 border border-slate-200 rounded-lg px-4 py-2"
                />
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
              <button 
                onClick={() => completePayment('wechat')}
                className="w-full py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 flex items-center justify-center gap-3"
              >
                <QrCode className="w-8 h-8" />
                微信支付
              </button>
              <button 
                onClick={() => completePayment('alipay')}
                className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 flex items-center justify-center gap-3"
              >
                <QrCode className="w-8 h-8" />
                支付宝
              </button>
              <button 
                onClick={() => completePayment('cash')}
                className="w-full py-4 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 flex items-center justify-center gap-3"
              >
                <Banknote className="w-8 h-8" />
                现金支付
              </button>
              <button onClick={() => setShowPayment(false)} className="w-full py-3 text-slate-500 hover:text-slate-700">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
