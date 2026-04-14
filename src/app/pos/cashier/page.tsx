'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, Plus, Minus, Delete, CreditCard, QrCode, User, Wifi, Clock, Printer, Banknote, Percent, Package, Search, X, CheckCircle, LogOut, KeyRound, Store, WifiOff, CloudOff, RefreshCw, TrendingUp, DollarSign, Scale, Monitor, Bot, Tag, MonitorSmartphone, HardDrive, Camera, Settings, Receipt, Ticket, Truck, BarChart3, Gift, Bell, Cuboid, ClipboardList, MinusCircle, Zap
} from 'lucide-react';
import { posStore, Product, Order } from '@/lib/pos-store';
import * as Hardware from '@/lib/pos-hardware-service';

interface CartItem {
  id: string;
  productId: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  isWeighed?: boolean;
  weight?: number;
  tag?: 'hot' | 'new' | 'weigh';
}

interface NavItem {
  id: string;
  title: string;
  icon: React.ComponentType<{className?: string}>;
  path?: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'cashier', title: '收银', icon: ShoppingCart, path: '/pos/cashier' },
  { id: 'inventory', title: '库存', icon: Cuboid, path: '/pos/inventory' },
  { id: 'products', title: '商品', icon: Package, path: '/pos/products' },
  { id: 'orders', title: '订单', icon: ClipboardList, path: '/pos/orders' },
  { id: 'delivery', title: '配送', icon: Truck, path: '/pos/purchase' },
  { id: 'reports', title: '报表', icon: BarChart3, path: '/pos/reports' },
  { id: 'assistant', title: '店长助手', icon: Gift, path: '/assistant' },
  { id: 'service', title: '客服', icon: Bell, path: '/pos/settings' },
];

const categories = [
  { name: '全部', count: 29 },
  { name: '热销', count: 6, color: 'bg-red-500' },
  { name: '标品', count: 15 },
  { name: '称重', count: 8 },
  { name: '计件', count: 6 },
  { name: '饮品', count: 5 },
  { name: '水果', count: 4 },
  { name: '蔬菜', count: 4 },
];

export default function CashierPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // 登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<{id: string; name: string; role: string; storeName: string} | null>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // 数据状态
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  
  // 弹窗状态
  const [showPayment, setShowPayment] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showWeighing, setShowWeighing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showHardware, setShowHardware] = useState(false);
  const [showReceiptPrint, setShowReceiptPrint] = useState(false);
  const [showLabelPrint, setShowLabelPrint] = useState(false);
  const [showPendingOrders, setShowPendingOrders] = useState(false);
  const [showPriceAdjust, setShowPriceAdjust] = useState(false);
  const [showMolar, setShowMolar] = useState(false);
  
  // 硬件状态
  const [scaleConnected, setScaleConnected] = useState(false);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [scaleData, setScaleData] = useState<Hardware.ScaleData | null>(null);
  const [aiScanning, setAiScanning] = useState(false);
  
  // 会员和优惠
  const [member, setMember] = useState<{id: string; name: string; level: string; points: number} | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState<'none' | 'member' | 'coupon' | 'manual'>('none');
  const [molarAmount, setMolarAmount] = useState(0);
  
  // 销售数据
  const [todaySales, setTodaySales] = useState({ amount: 0, count: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [total, setTotal] = useState(0);
  
  // 搜索和筛选
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [showNonStandard, setShowNonStandard] = useState(false);
  const [showHotOnly, setShowHotOnly] = useState(false);

  // 当前导航
  const [activeNav, setActiveNav] = useState('cashier');

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
      setPendingOrders(pending);
      
      // 尝试连接硬件
      await connectHardware();
    };
    init();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(timer);
      Hardware.stopAICamera();
    };
  }, []);

  // 网络状态
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); };
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
      if (showLogin || showPayment || showMember || showDiscount || showWeighing || showAI) return;
      
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

  // 连接硬件
  const connectHardware = async () => {
    try {
      await Hardware.connectScale();
      setScaleConnected(true);
    } catch {
      setScaleConnected(false);
    }
    
    try {
      await Hardware.connectReceiptPrinter();
      setPrinterConnected(true);
    } catch {
      setPrinterConnected(false);
    }
  };

  // 扫码处理
  const handleBarcodeSearch = useCallback(async (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      addToCart(product);
      Hardware.showProductOnDisplay(product.name, product.price);
    } else {
      alert('未找到商品: ' + barcode);
    }
  }, [products]);

  // 登录
  const handleLogin = () => {
    if (pin === '1234') {
      setCurrentStaff({ id: '001', name: '李小红', role: 'cashier', storeName: '南山店' });
      setIsLoggedIn(true);
      setShowLogin(false);
      setLoginError('');
    } else if (pin === '5678') {
      setCurrentStaff({ id: '002', name: '店长李明', role: 'manager', storeName: '南山店' });
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
  const finalTotal = Math.max(0, subtotal - discount - molarAmount);

  // 添加到购物车
  const addToCart = (product: Product, weight?: number, unitPrice?: number) => {
    const finalPrice = unitPrice || product.price;
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id && item.isWeighed === !!weight);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id && item.isWeighed === !!weight 
            ? { ...item, quantity: item.quantity + 1, weight: weight ? (item.weight || 0) + weight : item.weight }
            : item
        );
      }
      return [...prev, {
        id: 'ci_' + Date.now(),
        productId: product.id,
        barcode: product.barcode,
        name: product.name,
        price: finalPrice,
        quantity: 1,
        isWeighed: !!weight,
        weight: weight
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
    setCart([]);
    setDiscountAmount(0);
    setDiscountType('none');
    setMolarAmount(0);
    setMember(null);
    Hardware.clearCustomerDisplay();
  };

  // 挂单/取单
  const suspendOrder = async () => {
    if (cart.length === 0) return;
    const suspendedOrder: Order = {
      id: 'suspend_' + Date.now(),
      orderNo: 'SUSPEND_' + Date.now().toString().slice(-8),
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
      paymentMethod: 'cash', // 挂单时使用cash作为占位
      staffId: currentStaff?.id || '',
      staffName: currentStaff?.name || '',
      storeId: 'store_001',
      storeName: currentStaff?.storeName || '',
      createdAt: Date.now(),
      status: 'pending', // 挂单状态
      syncStatus: 'pending' // 待同步
    };
    await posStore.saveOrder(suspendedOrder);
    const pending = await posStore.getPendingOrders();
    setPendingCount(pending.length);
    setPendingOrders(pending);
    clearCart();
    alert('订单已挂起');
  };

  const loadPendingOrder = (order: Order) => {
    const loadedCart: CartItem[] = order.items.map(item => ({
      id: item.id,
      productId: item.productId,
      barcode: item.barcode,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));
    setCart(loadedCart);
    setShowPendingOrders(false);
  };

  // 称重功能
  const startWeighing = async () => {
    setShowWeighing(true);
    if (scaleConnected) {
      const data = await Hardware.readScaleData();
      setScaleData(data);
    }
  };

  const confirmWeighing = () => {
    if (scaleData) {
      const weighedProduct: Product = {
        id: 'weighed_' + Date.now(),
        name: '称重商品',
        barcode: 'WEIGHED001',
        price: scaleData.price,
        cost: scaleData.price * 0.7,
        category: '称重商品',
        stock: 999,
        minStock: 0,
        unit: 'kg',
        imageUrl: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      addToCart(weighedProduct, scaleData.weight, scaleData.unitPrice);
    }
    setShowWeighing(false);
    setScaleData(null);
  };

  // AI识别
  const initAI = async () => {
    setShowAI(true);
    if (videoRef.current) {
      await Hardware.initAICamera(videoRef.current);
    }
  };

  const captureAI = async () => {
    if (!videoRef.current) return;
    setAiScanning(true);
    
    const result = await Hardware.captureAndRecognize(videoRef.current);
    if (result.success && result.products.length > 0) {
      const recognized = result.products[0];
      const product = products.find(p => p.barcode === recognized.barcode) || {
        id: 'ai_' + Date.now(),
        name: recognized.name,
        barcode: recognized.barcode,
        price: recognized.price,
        cost: recognized.price * 0.7,
        category: 'AI识别',
        stock: 100,
        minStock: 10,
        unit: '件',
        imageUrl: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      addToCart(product);
    }
    
    setAiScanning(false);
  };

  // 打印小票
  const handlePrintReceipt = async () => {
    const data: Hardware.ReceiptData = {
      storeName: currentStaff?.storeName || '海邻到家便利店',
      orderNo: orderNumber || 'O' + Date.now().toString().slice(-10),
      cashier: currentStaff?.name || '未知',
      date: new Date().toLocaleString('zh-CN'),
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        weight: item.weight
      })),
      total: finalTotal,
      paymentMethod: '微信支付',
      change: 0
    };
    
    await Hardware.printReceipt(data);
    await Hardware.openCashbox();
    setShowReceiptPrint(false);
  };

  // 完成支付
  const completePayment = async (method: 'wechat' | 'alipay' | 'cash' | 'card', cashReceived?: number) => {
    const orderNo = 'O' + Date.now().toString().slice(-10);
    setOrderNumber(orderNo);
    setTotal(finalTotal);
    
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
      storeName: currentStaff?.storeName || '',
      createdAt: Date.now(),
      status: 'completed',
      syncStatus: 'pending'
    };

    await posStore.saveOrder(order);
    
    for (const item of cart) {
      await posStore.updateStock(item.productId, item.quantity, 'sale');
    }

    const sales = await posStore.getTodaySales();
    setTodaySales({ amount: sales.totalAmount, count: sales.orderCount });
    setPendingCount(await (await posStore.getPendingOrders()).length);
    
    Hardware.updateCustomerDisplay({
      total: finalTotal,
      change: cashReceived ? cashReceived - finalTotal : 0,
      paymentMethod: method === 'cash' ? '现金' : method === 'wechat' ? '微信' : method === 'alipay' ? '支付宝' : '银行卡'
    });

    await Hardware.printReceipt({
      storeName: currentStaff?.storeName || '海邻到家便利店',
      orderNo,
      cashier: currentStaff?.name || '未知',
      date: new Date().toLocaleString('zh-CN'),
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        weight: item.weight
      })),
      total: finalTotal,
      paymentMethod: method === 'cash' ? '现金' : method === 'wechat' ? '微信' : method === 'alipay' ? '支付宝' : '银行卡',
      change: cashReceived ? cashReceived - finalTotal : undefined
    });
    
    await Hardware.openCashbox();

    setOrderSuccess(true);
    
    setTimeout(() => {
      setOrderSuccess(false);
      setCart([]);
      setShowPayment(false);
      setDiscountAmount(0);
      setDiscountType('none');
      setMolarAmount(0);
      setMember(null);
      Hardware.clearCustomerDisplay();
    }, 3000);
  };

  // 同步订单
  const syncOrders = async () => {
    const result = await posStore.syncOrders();
    const pending = await posStore.getPendingOrders();
    setPendingCount(pending.length);
    setPendingOrders(pending);
    alert(`同步完成: 成功 ${result.success}, 失败 ${result.failed}`);
  };

  // 打开钱箱
  const openCashbox = async () => {
    await Hardware.openCashbox();
  };

  // 过滤商品
  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === '全部' || 
      (selectedCategory === '称重' && p.category === '称重商品') ||
      p.category === selectedCategory;
    const matchSearch = !searchKeyword || 
      p.name.includes(searchKeyword) || 
      p.barcode.includes(searchKeyword);
    const matchNonStandard = !showNonStandard || p.category === '称重商品';
    return matchCat && matchSearch && matchNonStandard;
  });

  // 登录页
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 flex flex-col">
        <header className="bg-slate-900/80 backdrop-blur border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏪</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">海邻到家</h1>
                <p className="text-xs text-slate-400">双屏AI收银称重一体机</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-sm font-medium">{isOnline ? '在线' : '离线'}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Store className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800">收银台登录</h2>
              <p className="text-slate-500 mt-2">请输入6位员工密码</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-4 bg-slate-100 rounded-2xl px-6 py-4">
                <KeyRound className="w-6 h-6 text-slate-400" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => { setPin(e.target.value); setLoginError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="请输入6位密码"
                  className="flex-1 bg-transparent outline-none text-2xl tracking-widest"
                  maxLength={6}
                  autoFocus
                />
              </div>
              {loginError && <p className="text-red-500 text-center mt-3 font-medium">{loginError}</p>}
            </div>

            <button
              onClick={handleLogin}
              className="w-full h-16 text-xl font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-2xl shadow-lg shadow-orange-500/30 transition-all active:scale-95"
            >
              登 录
            </button>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500 text-center mb-4">快速登录</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setPin('1234')} className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-orange-50 border-2 border-slate-200 hover:border-orange-300 rounded-xl transition-all">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white text-lg font-bold">李</div>
                  <div className="text-left">
                    <div className="font-bold text-slate-800">收银员李小红</div>
                    <div className="text-xs text-slate-500">密码: 1234</div>
                  </div>
                </button>
                <button onClick={() => setPin('5678')} className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-orange-50 border-2 border-slate-200 hover:border-orange-300 rounded-xl transition-all">
                  <div className="h-12 w-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-bold">李</div>
                  <div className="text-left">
                    <div className="font-bold text-slate-800">店长李明</div>
                    <div className="text-xs text-slate-500">密码: 5678</div>
                  </div>
                </button>
              </div>
            </div>

            <p className="text-xs text-center text-slate-400 mt-6">
              海邻到家智能收银系统 V3.1.0
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 支付成功
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
        <div className="text-center text-white">
          <CheckCircle className="w-24 h-24 mx-auto mb-4 animate-bounce" />
          <h1 className="text-4xl font-bold mb-2">收款成功</h1>
          <p className="text-5xl font-bold mb-4">¥{total.toFixed(2)}</p>
          <p className="text-green-100 text-xl">订单号：{orderNumber}</p>
          <p className="text-green-100 mt-4">正在打印小票...</p>
        </div>
      </div>
    );
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden">
      {/* 左侧导航栏 */}
      <nav className="w-20 bg-slate-800 flex flex-col items-center py-3 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                if (item.path) router.push(item.path);
              }}
              className={`w-full flex flex-col items-center py-3 px-2 gap-1.5 rounded-lg transition-all ${
                isActive 
                  ? 'bg-orange-500 text-white' 
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.title}</span>
              {item.id === 'orders' && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
        
        {/* 底部设置 */}
        <div className="mt-auto">
          <button
            onClick={() => router.push('/pos/settings')}
            className="w-full flex flex-col items-center py-3 px-2 gap-1.5 text-slate-400 hover:bg-slate-700 hover:text-white rounded-lg transition-all"
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">设置</span>
          </button>
        </div>
      </nav>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部状态栏 */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0">
          {/* 左侧店铺信息 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full">
              <Store className="w-4 h-4" />
              <span className="font-medium">{currentStaff?.storeName || '门店'}</span>
              <span className="text-slate-400">|</span>
              <span>{currentStaff?.name || '员工'}</span>
            </div>
            
            {/* 搜索框 */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="扫描条码 / 商品名称 / 拼音首字母"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-80 pl-10 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button 
                onClick={() => setSearchKeyword('')}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                取消
              </button>
              <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showNonStandard}
                  onChange={(e) => setShowNonStandard(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                />
                仅看非标品
              </label>
            </div>
          </div>
          
          {/* 右侧系统功能 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1.5">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-white hover:shadow rounded-lg transition-all">
                <ClipboardList className="w-4 h-4" />
                采购单
              </button>
              <button 
                onClick={() => Hardware.showWelcomeOnDisplay()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-white hover:shadow rounded-lg transition-all"
              >
                <Monitor className="w-4 h-4" />
                客显屏
              </button>
              <button 
                onClick={handlePrintReceipt}
                disabled={cart.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-white hover:shadow rounded-lg transition-all disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                打印
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-white hover:shadow rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                锁屏
              </button>
            </div>
            
            {/* 在线状态 */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-sm ${isOnline ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {isOnline ? '在线' : '离线'}
            </div>
            
            {/* 时间 */}
            <div className="text-sm text-slate-600">
              <span>{currentTime.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</span>
              <span className="mx-2">|</span>
              <span>{currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </header>

        {/* 分类标签栏 */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-all ${
                selectedCategory === cat.name
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.color && (
                <span className={`w-2 h-2 rounded-full ${cat.color}`}></span>
              )}
              {cat.name}
              <span className={`text-xs ${selectedCategory === cat.name ? 'text-orange-200' : 'text-slate-400'}`}>
                ({cat.count})
              </span>
            </button>
          ))}
        </div>

        {/* 商品展示区 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white rounded-xl p-3 text-left hover:ring-2 hover:ring-orange-500 shadow-sm transition-all"
              >
                {/* 商品图片占位 */}
                <div className="w-full aspect-square bg-slate-100 rounded-lg mb-3 flex items-center justify-center relative">
                  <Package className="w-10 h-10 text-slate-300" />
                  {/* 标签 */}
                  <span className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">热</span>
                  {product.category === '称重商品' && (
                    <span className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">称重</span>
                  )}
                </div>
                {/* 商品名称 */}
                <p className="font-medium text-sm text-slate-800 truncate">{product.name}</p>
                {/* 价格 */}
                <p className="text-red-500 font-bold mt-1">¥{product.price.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 底部快捷操作栏 */}
        <div className="h-14 bg-white border-t border-slate-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-200">
              <RefreshCw className="w-4 h-4" />
              上一单
            </button>
            <button 
              onClick={() => setShowPendingOrders(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-200 relative"
            >
              <Clock className="w-4 h-4" />
              待收款
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <button 
              onClick={openCashbox}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-200"
            >
              <DollarSign className="w-4 h-4" />
              开钱箱
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-200">
              <TrendingUp className="w-4 h-4" />
              切换热销品
              <span className="w-8 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">开</span>
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-200">
              <Zap className="w-4 h-4" />
              快速收银
            </button>
            <button 
              onClick={suspendOrder}
              disabled={cart.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-200 disabled:opacity-50"
            >
              <MinusCircle className="w-4 h-4" />
              挂单
            </button>
          </div>
        </div>
      </div>

      {/* 右侧结算区 */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
        {/* 金额显示 */}
        <div className="bg-slate-800 text-white p-4">
          <div className="text-center">
            <p className="text-4xl font-bold">¥{finalTotal.toFixed(2)}</p>
            <p className="text-slate-400 text-sm mt-1">共{totalItems}件</p>
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="p-3 border-b border-slate-100 flex gap-2">
          <button 
            onClick={() => setShowPriceAdjust(true)}
            disabled={cart.length === 0}
            className="flex-1 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-200 disabled:opacity-50"
          >
            整单改价
          </button>
          <button 
            onClick={() => setShowMolar(true)}
            disabled={cart.length === 0}
            className="flex-1 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-200 disabled:opacity-50"
          >
            抹分
          </button>
        </div>
        
        {/* 会员与优惠 */}
        <div className="p-3 border-b border-slate-100 flex gap-2">
          <button 
            onClick={() => setShowMember(true)}
            className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1"
          >
            <User className="w-4 h-4" />
            {member ? `${member.name} (${member.level})` : '会员登录/新增'}
          </button>
          <button 
            onClick={() => setShowDiscount(true)}
            className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1"
          >
            <Ticket className="w-4 h-4" />
            优惠券核销
          </button>
        </div>
        
        {/* 称重提示 */}
        <div className="p-3 bg-slate-50 text-center text-sm text-slate-500">
          <div className="flex items-center justify-center gap-2">
            <Scale className="w-4 h-4" />
            开始称重结账吧
          </div>
        </div>
        
        {/* 购物车列表 */}
        <div className="flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">购物车为空</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-orange-500 text-sm">
                      ¥{item.price.toFixed(2)} × {item.quantity}
                      {item.isWeighed && item.weight && ` (${item.weight}kg)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-white rounded-lg px-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 text-red-500 hover:bg-red-50 rounded flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 结账按钮 */}
        <div className="p-3 border-t border-slate-200">
          <button
            disabled={cart.length === 0}
            onClick={() => setShowPayment(true)}
            className="w-full py-4 bg-pink-500 text-white text-lg font-bold rounded-2xl hover:bg-pink-600 disabled:bg-slate-300 transition-all active:scale-95"
          >
            结账
          </button>
        </div>
      </div>

      {/* 会员弹窗 */}
      {showMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-96 overflow-hidden">
            <div className="bg-orange-500 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">会员识别</h3>
              <button onClick={() => setShowMember(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                <input type="text" placeholder="输入手机号" className="flex-1 border border-slate-200 rounded-lg px-4 py-3 text-lg" />
                <button className="px-6 py-3 bg-orange-500 text-white rounded-lg text-lg font-bold">查询</button>
              </div>
              <button onClick={() => { setMember({ id: 'm1', name: '张会员', level: '金卡', points: 1580 }); setDiscountType('member'); setShowMember(false); }}
                className="w-full py-4 bg-slate-100 rounded-xl text-lg hover:bg-slate-200">
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
              <h3 className="font-bold text-lg">优惠方式</h3>
              <button onClick={() => setShowDiscount(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4 space-y-3">
              <button onClick={() => { setDiscountType('none'); setDiscountAmount(0); setShowDiscount(false); }}
                className="w-full p-4 border-2 border-slate-200 rounded-xl text-left hover:border-orange-500">
                <p className="font-bold text-lg">不使用优惠</p>
              </button>
              {member && (
                <button onClick={() => { setDiscountType('member'); setShowDiscount(false); }}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl text-left hover:border-orange-500">
                  <p className="font-bold text-lg">会员折扣 (95折)</p>
                  <p className="text-sm text-slate-500">节省 ¥{(subtotal * 0.05).toFixed(2)}</p>
                </button>
              )}
              <button onClick={() => { setDiscountType('coupon'); setDiscountAmount(10); setShowDiscount(false); }}
                className="w-full p-4 border-2 border-slate-200 rounded-xl text-left hover:border-orange-500">
                <p className="font-bold text-lg">优惠券 (满50减10)</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 抹零弹窗 */}
      {showMolar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-96 overflow-hidden">
            <div className="bg-slate-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">抹分（抹零）</h3>
              <button onClick={() => setShowMolar(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-orange-500">抹 ¥{molarAmount.toFixed(2)}</p>
                <p className="text-slate-500 text-sm mt-1">应收金额：¥{finalTotal.toFixed(2)}</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[0.01, 0.1, 0.5, 1].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setMolarAmount(Math.min(amount, finalTotal))}
                    className="py-3 bg-slate-100 rounded-lg text-sm hover:bg-slate-200"
                  >
                    抹 ¥{amount}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="输入抹零金额" 
                  value={molarAmount || ''}
                  onChange={(e) => setMolarAmount(parseFloat(e.target.value) || 0)}
                  className="flex-1 border border-slate-200 rounded-lg px-4 py-3" 
                />
                <button 
                  onClick={() => setShowMolar(false)}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg font-bold"
                >
                  确定
                </button>
              </div>
              <button 
                onClick={() => { setMolarAmount(0); setShowMolar(false); }}
                className="w-full py-3 bg-slate-100 rounded-lg text-sm hover:bg-slate-200"
              >
                不抹零
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 待收款订单弹窗 */}
      {showPendingOrders && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[500px] max-h-[600px] overflow-hidden">
            <div className="bg-slate-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">待收款订单</h3>
              <button onClick={() => setShowPendingOrders(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[400px]">
              {pendingOrders.length === 0 ? (
                <p className="text-center text-slate-400 py-8">暂无待收款订单</p>
              ) : (
                <div className="space-y-3">
                  {pendingOrders.map((order) => (
                    <div key={order.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">订单号: {order.orderNo}</span>
                        <span className="text-orange-500 font-bold">¥{order.finalAmount.toFixed(2)}</span>
                      </div>
                      <div className="text-sm text-slate-500 mb-2">
                        {order.items.length}件商品 | {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => loadPendingOrder(order)}
                          className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
                        >
                          加载订单
                        </button>
                        <button 
                          onClick={async () => {
                            const orders = await posStore.getOrders();
                            const filtered = orders.filter(o => o.id !== order.id);
                            localStorage.setItem('pos_orders', JSON.stringify(filtered));
                            const pending = await posStore.getPendingOrders();
                            setPendingOrders(pending);
                            setPendingCount(pending.length);
                          }}
                          className="py-2 px-4 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200"
                        >
                          删除
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

      {/* 整单改价弹窗 */}
      {showPriceAdjust && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-96 overflow-hidden">
            <div className="bg-slate-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">整单改价</h3>
              <button onClick={() => setShowPriceAdjust(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">原金额</p>
                <p className="text-2xl text-slate-400 line-through">¥{subtotal.toFixed(2)}</p>
              </div>
              <input 
                type="number" 
                placeholder="输入新金额" 
                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-lg text-center" 
                autoFocus
              />
              <button 
                onClick={() => setShowPriceAdjust(false)}
                className="w-full py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 支付方式弹窗 */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[500px] overflow-hidden">
            <div className="bg-orange-500 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">选择支付方式</h3>
              <button onClick={() => setShowPayment(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-orange-500">¥{finalTotal.toFixed(2)}</p>
                <p className="text-slate-500 text-sm mt-1">共{totalItems}件商品</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => completePayment('wechat')}
                  className="p-6 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all"
                >
                  <QrCode className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-bold">微信支付</p>
                </button>
                <button 
                  onClick={() => completePayment('alipay')}
                  className="p-6 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-all"
                >
                  <QrCode className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-bold">支付宝</p>
                </button>
                <button 
                  onClick={() => completePayment('card')}
                  className="p-6 bg-purple-500 text-white rounded-2xl hover:bg-purple-600 transition-all"
                >
                  <CreditCard className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-bold">银行卡</p>
                </button>
                <button 
                  onClick={() => {
                    const cash = prompt('请输入收款金额:', finalTotal.toFixed(2));
                    if (cash) {
                      completePayment('cash', parseFloat(cash));
                    }
                  }}
                  className="p-6 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition-all"
                >
                  <Banknote className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-bold">现金</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI识别弹窗 */}
      {showAI && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[700px] overflow-hidden">
            <div className="bg-purple-500 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Camera className="w-6 h-6" />
                AI商品识别
              </h3>
              <button onClick={() => { setShowAI(false); Hardware.stopAICamera(); }}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <div className="bg-slate-900 rounded-xl aspect-video flex items-center justify-center mb-4">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              </div>
              <button 
                onClick={captureAI}
                disabled={aiScanning}
                className="w-full py-4 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 disabled:bg-slate-300"
              >
                {aiScanning ? '识别中...' : '拍照识别'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 称重弹窗 */}
      {showWeighing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[500px] overflow-hidden">
            <div className="bg-blue-500 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2"><Scale className="w-6 h-6" /> 称重</h3>
              <button onClick={() => setShowWeighing(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 text-center">
              <div className="bg-slate-100 rounded-2xl p-8 mb-6">
                <p className="text-6xl font-bold text-blue-500">
                  {scaleData ? scaleData.weight.toFixed(3) : '0.000'} kg
                </p>
                <p className="text-slate-500 mt-2">当前重量</p>
                {scaleData && (
                  <div className="mt-4 text-lg">
                    <p>单价: ¥{scaleData.unitPrice.toFixed(2)}/kg</p>
                    <p className="font-bold text-orange-500">金额: ¥{scaleData.price.toFixed(2)}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button onClick={startWeighing} className="flex-1 py-4 bg-blue-500 text-white rounded-xl text-lg font-bold hover:bg-blue-600">
                  刷新重量
                </button>
                <button onClick={confirmWeighing} disabled={!scaleData} className="flex-1 py-4 bg-orange-500 text-white rounded-xl text-lg font-bold hover:bg-orange-600 disabled:bg-slate-300">
                  确认添加
                </button>
              </div>
              {!scaleConnected && <p className="text-red-500 mt-4">称重器未连接，使用模拟数据</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
