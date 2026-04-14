'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Delete,
  CreditCard,
  QrCode,
  User,
  Printer,
  Banknote,
  Package,
  Search,
  X,
  CheckCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  History,
  ScanLine,
  Percent,
  Gift,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

interface CartItem {
  id: string;
  productId: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  unit: string;
}

interface PendingOrder {
  id: string;
  items: CartItem[];
  total: number;
  createdAt: number;
  note?: string;
}

interface Member {
  name: string;
  phone: string;
  level: string;
  points: number;
  discount: number;
}

// 默认商品数据
const defaultProducts: Product[] = [
  { id: '1', barcode: '6901234567890', name: '农夫山泉 550ml', price: 2.00, stock: 100, category: '饮料', unit: '瓶' },
  { id: '2', barcode: '6901234567891', name: '可口可乐 330ml', price: 3.00, stock: 80, category: '饮料', unit: '罐' },
  { id: '3', barcode: '6901234567892', name: '统一冰红茶', price: 3.00, stock: 70, category: '饮料', unit: '瓶' },
  { id: '4', barcode: '6901234567893', name: '康师傅冰红茶', price: 3.50, stock: 55, category: '饮料', unit: '瓶' },
  { id: '5', barcode: '6901234567894', name: '娃哈哈纯净水', price: 1.50, stock: 120, category: '饮料', unit: '瓶' },
  { id: '6', barcode: '6901234567895', name: '蒙牛纯牛奶 250ml', price: 3.50, stock: 60, category: '乳品', unit: '盒' },
  { id: '7', barcode: '6901234567896', name: '伊利酸奶', price: 4.00, stock: 35, category: '乳品', unit: '杯' },
  { id: '8', barcode: '6901234567897', name: '康师傅红烧牛肉面', price: 4.50, stock: 50, category: '方便食品', unit: '袋' },
  { id: '9', barcode: '6901234567898', name: '统一老坛酸菜面', price: 4.00, stock: 40, category: '方便食品', unit: '袋' },
  { id: '10', barcode: '6901234567899', name: '奥利奥夹心饼干', price: 8.50, stock: 30, category: '零食', unit: '盒' },
  { id: '11', barcode: '6901234567900', name: '旺旺雪饼', price: 5.00, stock: 45, category: '零食', unit: '袋' },
  { id: '12', barcode: '6901234567901', name: '德芙巧克力 52g', price: 12.00, stock: 25, category: '零食', unit: '块' },
  { id: '13', barcode: '6901234567902', name: '双汇王中王火腿肠', price: 6.00, stock: 40, category: '肉类', unit: '根' },
  { id: '14', barcode: '6901234567903', name: '雨润火腿肠', price: 5.00, stock: 35, category: '肉类', unit: '根' },
  { id: '15', barcode: '6901234567904', name: '清风抽纸 3层', price: 5.00, stock: 50, category: '日用品', unit: '包' },
  { id: '16', barcode: '6901234567905', name: '雕牌洗衣皂', price: 4.50, stock: 40, category: '日用品', unit: '块' },
];

const categories = ['全部', '饮料', '乳品', '方便食品', '零食', '肉类', '日用品'];

export default function MobileCashierPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [isOnline, setIsOnline] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showDiscount, setShowDiscount] = useState(false);

  // 加载挂单数据
  useEffect(() => {
    const saved = localStorage.getItem('pending_orders');
    if (saved) setPendingOrders(JSON.parse(saved));
    
    // 加载自定义商品
    const savedProducts = localStorage.getItem('pos_products');
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch {}
    }
  }, []);

  // 网络状态检测
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

  // 计算金额
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = member ? subtotal * member.discount : 0;
  const couponDiscount = 0;
  const finalTotal = Math.max(0, subtotal - discount - couponDiscount);

  // 添加商品到购物车
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price } 
            : item
        );
      }
      return [...prev, { 
        id: product.id, 
        productId: product.id, 
        barcode: product.barcode, 
        name: product.name, 
        price: product.price, 
        quantity: 1, 
        subtotal: product.price 
      }];
    });
  };

  // 修改数量
  const updateQuantity = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 
            ? { ...item, quantity: newQty, subtotal: newQty * item.price } 
            : item;
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
    setCart([]);
    setMember(null);
  };

  // 挂单
  const suspendOrder = () => {
    if (cart.length === 0) return;
    const order: PendingOrder = {
      id: 'PO_' + Date.now(),
      items: [...cart],
      total: finalTotal,
      createdAt: Date.now(),
    };
    const updated = [order, ...pendingOrders].slice(0, 10); // 最多保存10单
    setPendingOrders(updated);
    localStorage.setItem('pending_orders', JSON.stringify(updated));
    clearCart();
    alert('已挂单');
  };

  // 取单
  const resumeOrder = (order: PendingOrder) => {
    setCart(order.items);
    setPendingOrders(pendingOrders.filter(o => o.id !== order.id));
    localStorage.setItem('pending_orders', JSON.stringify(pendingOrders.filter(o => o.id !== order.id)));
    setShowPending(false);
  };

  // 完成支付
  const completePayment = (method: string, amount?: number) => {
    let paymentAmount = finalTotal;
    if (method === 'cash' && amount) {
      paymentAmount = amount;
    }
    
    const orderNo = 'M' + Date.now().toString().slice(-8);
    setOrderNumber(orderNo);
    setPaidAmount(paymentAmount);
    setOrderSuccess(true);
    
    // 保存订单记录
    const orderRecord = {
      id: orderNo,
      items: cart,
      subtotal,
      discount,
      finalTotal,
      paymentMethod: method,
      paidAmount: paymentAmount,
      change: paymentAmount - finalTotal,
      member: member,
      createdAt: Date.now(),
      syncStatus: isOnline ? 'synced' : 'pending',
    };
    const savedOrders = JSON.parse(localStorage.getItem('pos_orders') || '[]');
    savedOrders.unshift(orderRecord);
    localStorage.setItem('pos_orders', JSON.stringify(savedOrders.slice(0, 100)));
    
    setTimeout(() => {
      setOrderSuccess(false);
      clearCart();
      setShowPayment(false);
    }, 3000);
  };

  // 搜索商品
  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === '全部' || p.category === selectedCategory;
    const matchSearch = !searchKeyword || 
      p.name.includes(searchKeyword) || 
      p.barcode.includes(searchKeyword) ||
      p.barcode.startsWith(searchKeyword);
    return matchCat && matchSearch;
  });

  // 扫码输入处理
  const handleBarcodeScan = useCallback((code: string) => {
    const product = products.find(p => p.barcode === code);
    if (product) {
      addToCart(product);
    } else {
      alert('未找到商品: ' + code);
    }
    setBarcodeInput('');
    setShowBarcode(false);
  }, [products]);

  // 会员折扣显示
  const getMemberDiscountText = () => {
    if (!member) return '';
    switch (member.level) {
      case 'diamond': return '钻石会员 9折';
      case 'gold': return '金卡会员 95折';
      case 'silver': return '银卡会员 98折';
      default: return '普通会员 无折扣';
    }
  };

  // 支付成功页面
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center p-6">
        <CheckCircle className="w-24 h-24 text-white mb-6" />
        <h1 className="text-3xl font-bold text-white mb-2">收款成功</h1>
        <p className="text-5xl font-bold text-white mb-4">¥{finalTotal.toFixed(2)}</p>
        <p className="text-green-100 mb-2">订单号：{orderNumber}</p>
        {paidAmount > finalTotal && (
          <p className="text-green-100">找零：¥{(paidAmount - finalTotal).toFixed(2)}</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* 顶部状态栏 */}
      <div className="bg-white px-4 py-2 flex items-center justify-between border-b">
        <button onClick={() => router.push('/assistant')} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="font-bold text-slate-800">移动收银</h1>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-500" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      {/* 商品区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 搜索栏 */}
        <div className="p-3 bg-white">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="搜索商品名称/条码..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg text-sm"
              />
            </div>
            <button 
              onClick={() => setShowBarcode(true)}
              className="p-2 bg-blue-500 text-white rounded-lg"
            >
              <ScanLine className="w-5 h-5" />
            </button>
          </div>
          
          {/* 分类标签 */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  selectedCategory === cat 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 商品列表 */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-3 gap-2">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white rounded-xl p-2 text-left shadow-sm active:bg-slate-50"
              >
                <div className="w-full h-16 bg-slate-100 rounded-lg mb-2 flex items-center justify-center">
                  <Package className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                <p className="text-orange-500 font-bold">¥{product.price.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 底部购物车 */}
      <div className="bg-white border-t shadow-lg">
        {/* 会员信息 */}
        {member && (
          <div className="px-4 py-2 bg-blue-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-700">{member.name}</span>
              <span className="text-xs text-blue-500">({getMemberDiscountText()})</span>
            </div>
            <button onClick={() => setMember(null)} className="text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 金额汇总 */}
        <div className="px-4 py-3 border-b">
          <div className="flex justify-between text-sm text-slate-500">
            <span>共 {cart.reduce((s, i) => s + i.quantity, 0)} 件</span>
            {member && <span className="text-orange-500">已享{getMemberDiscountText()}</span>}
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-lg text-slate-600">合计</span>
            <span className="text-2xl font-bold text-orange-500">¥{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="px-4 py-3 flex gap-3">
          <button 
            onClick={() => setShowPending(true)}
            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <History className="w-5 h-5" />
            挂单
          </button>
          <button 
            onClick={() => setShowMember(true)}
            className="flex-1 py-3 bg-blue-100 text-blue-700 rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <User className="w-5 h-5" />
            会员
          </button>
          <button 
            onClick={() => cart.length > 0 && setShowPayment(true)}
            disabled={cart.length === 0}
            className={`flex-[2] py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${
              cart.length > 0 ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-400'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            结算 ¥{finalTotal.toFixed(2)}
          </button>
        </div>
      </div>

      {/* 支付弹窗 */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[80vh] overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">选择支付方式</h2>
              <button onClick={() => setShowPayment(false)}>
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* 金额显示 */}
              <div className="text-center py-4">
                <p className="text-slate-500">应收金额</p>
                <p className="text-4xl font-bold text-orange-500">¥{finalTotal.toFixed(2)}</p>
              </div>

              {/* 支付方式 */}
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => completePayment('wechat')}
                  className="flex flex-col items-center p-4 bg-green-50 rounded-xl"
                >
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-2">
                    <QrCode className="w-8 h-8 text-white" />
                  </div>
                  <span className="font-medium text-green-700">微信</span>
                </button>
                
                <button 
                  onClick={() => completePayment('alipay')}
                  className="flex flex-col items-center p-4 bg-blue-50 rounded-xl"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-2">
                    <QrCode className="w-8 h-8 text-white" />
                  </div>
                  <span className="font-medium text-blue-700">支付宝</span>
                </button>
                
                <button 
                  onClick={() => completePayment('cash')}
                  className="flex flex-col items-center p-4 bg-orange-50 rounded-xl"
                >
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-2">
                    <Banknote className="w-8 h-8 text-white" />
                  </div>
                  <span className="font-medium text-orange-700">现金</span>
                </button>
                
                <button 
                  onClick={() => completePayment('card')}
                  className="flex flex-col items-center p-4 bg-purple-50 rounded-xl"
                >
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-2">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <span className="font-medium text-purple-700">银行卡</span>
                </button>

                <button 
                  onClick={() => setShowDiscount(true)}
                  className="flex flex-col items-center p-4 bg-pink-50 rounded-xl"
                >
                  <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center mb-2">
                    <Percent className="w-8 h-8 text-white" />
                  </div>
                  <span className="font-medium text-pink-700">优惠券</span>
                </button>

                <button 
                  onClick={() => {
                    if (confirm('是否使用组合支付？')) {
                      // 模拟组合支付
                      completePayment('wechat', finalTotal * 0.5);
                    }
                  }}
                  className="flex flex-col items-center p-4 bg-indigo-50 rounded-xl"
                >
                  <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-2">
                    <ShoppingCart className="w-8 h-8 text-white" />
                  </div>
                  <span className="font-medium text-indigo-700">组合支付</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 会员弹窗 */}
      {showMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">会员识别</h2>
              <button onClick={() => setShowMember(false)}>
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">手机号</label>
                <input 
                  type="tel" 
                  placeholder="输入手机号"
                  className="w-full p-3 border border-slate-200 rounded-xl"
                />
              </div>
              
              <div className="text-center text-slate-400 py-4">
                <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>输入手机号查询会员信息</p>
              </div>

              {/* 模拟会员列表 */}
              <div className="space-y-2">
                {[
                  { name: '张伟', phone: '138****8001', level: 'diamond', discount: 0.1 },
                  { name: '李娜', phone: '138****8002', level: 'gold', discount: 0.05 },
                  { name: '王芳', phone: '138****8003', level: 'silver', discount: 0.02 },
                ].map((m, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setMember({ ...m, points: 1000 });
                      setShowMember(false);
                    }}
                    className="w-full p-3 bg-slate-50 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                        m.level === 'diamond' ? 'bg-purple-500' :
                        m.level === 'gold' ? 'bg-yellow-500' :
                        m.level === 'silver' ? 'bg-slate-400' : 'bg-slate-300'
                      }`}>
                        {m.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{m.name}</p>
                        <p className="text-sm text-slate-500">{m.phone}</p>
                      </div>
                    </div>
                    <span className={`text-sm ${
                      m.level === 'diamond' ? 'text-purple-500' :
                      m.level === 'gold' ? 'text-yellow-600' :
                      m.level === 'silver' ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {m.level === 'diamond' ? '钻石' : m.level === 'gold' ? '金卡' : m.level === 'silver' ? '银卡' : '普通'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 挂单列表弹窗 */}
      {showPending && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[70vh] overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">挂单列表</h2>
              <button onClick={() => setShowPending(false)}>
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {pendingOrders.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无挂单</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingOrders.map(order => (
                    <div 
                      key={order.id}
                      className="p-3 bg-slate-50 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{order.items.length}件商品</p>
                        <p className="text-sm text-slate-500">
                          {new Date(order.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-orange-500">¥{order.total.toFixed(2)}</span>
                        <button 
                          onClick={() => resumeOrder(order)}
                          className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm"
                        >
                          取单
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 扫码弹窗 */}
      {showBarcode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">条码输入</h2>
              <button onClick={() => setShowBarcode(false)}>
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">输入条码</label>
                <input 
                  type="text" 
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && barcodeInput.length > 0) {
                      handleBarcodeScan(barcodeInput);
                    }
                  }}
                  placeholder="扫描或输入条码后按回车"
                  className="w-full p-3 border border-slate-200 rounded-xl text-lg tracking-widest"
                  autoFocus
                />
              </div>
              
              <button 
                onClick={() => barcodeInput && handleBarcodeScan(barcodeInput)}
                disabled={!barcodeInput}
                className={`w-full py-3 rounded-xl font-bold ${
                  barcodeInput ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-400'
                }`}
              >
                添加商品
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 优惠券弹窗 */}
      {showDiscount && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">优惠券</h2>
              <button onClick={() => setShowDiscount(false)}>
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-4 text-center text-slate-400 py-8">
              <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无可用优惠券</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
