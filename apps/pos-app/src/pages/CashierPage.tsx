import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore, useProductStore, useMemberStore, useOrderStore, useFinanceStore, useOfflineStore, useStoreStore } from '../store';
import ClearanceModeIndicator from '../components/ClearanceModeIndicator';
import OfflineIndicator from '../components/OfflineIndicator';
import type { Product } from '../types';

// 检查清货模式
const isClearanceMode = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 20 && hour < 23;
};

// AI 服务配置
const AI_SERVICE_URL = 'http://127.0.0.1:5000';

// AI条码识别
const aiBarcodeLookup = async (barcode: string): Promise<{ success: boolean; product?: Product; candidates?: Product[] }> => {
  const products = useProductStore.getState().products;
  // 优先本地商品库
  const exact = products.find(p => p.barcode === barcode);
  if (exact) return { success: true, product: exact };
  // 模拟模糊匹配
  const similar = products.filter(p => p.barcode.includes(barcode.slice(-6)));
  return { success: false, candidates: similar.slice(0, 3) };
};

// AI视觉识别（模拟）
const aiVisionRecognize = async (): Promise<{ name: string; confidence: number; estimatedWeight?: number }[]> => {
  await new Promise(r => setTimeout(r, 500));
  return [
    { name: '红富士苹果', confidence: 0.95, estimatedWeight: 0.8 },
    { name: '黄元帅苹果', confidence: 0.72, estimatedWeight: 0.75 },
  ];
};

// 电子秤服务（模拟）
const scaleService = {
  startListeningSimulate: (callback: (reading: { weight: number }) => void) => {
    let weight = 0;
    const interval = setInterval(() => {
      // 模拟秤读数，偶尔有重量变化
      if (Math.random() > 0.98) {
        weight = Math.random() * 2 + 0.1;
      } else if (Math.random() > 0.95) {
        weight = 0;
      }
      callback({ weight });
    }, 1000);
    return () => clearInterval(interval);
  },
  stopListening: () => {},
};

// 模块类型
type StoreModule = 'cashier' | 'inventory' | 'products' | 'orders' | 'delivery' | 'reports' | 'promo' | 'members' | 'settings';

export default function CashierPage() {
  // 门店管理模块状态
  const [activeModule, setActiveModule] = useState<StoreModule>('cashier');
  
  // 收银相关状态
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberPhone, setMemberPhone] = useState('');
  const [memberError, setMemberError] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPay, setSelectedPay] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // 电子秤状态
  const [scaleStatus, setScaleStatus] = useState<'idle' | 'listening' | 'triggered'>('idle');
  const [currentWeight, setCurrentWeight] = useState<number>(0);

  // AI识别结果（隐藏，不显示按钮但保留功能）
  const [aiScanResult, setAiScanResult] = useState<{ barcode?: string; loading?: boolean; product?: Product; candidates?: Product[] } | null>(null);
  const [aiVisionResult, setAiVisionResult] = useState<{ loading?: boolean; candidates?: { name: string; confidence: number; estimatedWeight?: number }[] } | null>(null);
  
  // 当前称重商品（AI视觉识别后设置）
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  
  // 门店模块配置
  const storeModules: { id: StoreModule; label: string; icon: string }[] = [
    { id: 'cashier', label: '收银', icon: '💰' },
    { id: 'inventory', label: '库存', icon: '📦' },
    { id: 'products', label: '商品', icon: '🏷️' },
    { id: 'orders', label: '订单', icon: '🧾' },
    { id: 'delivery', label: '配送', icon: '🚚' },
    { id: 'reports', label: '报表', icon: '📊' },
    { id: 'promo', label: '促销', icon: '🎁' },
    { id: 'members', label: '会员', icon: '👥' },
    { id: 'settings', label: '设置', icon: '⚙️' },
  ];

  const { items, addItem, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const { products, checkInventory, deductInventory } = useProductStore();
  const { currentStore } = useStoreStore();
  const { currentMember, scanMember, members } = useMemberStore();
  const { createOrder, suspendOrder, resumeOrder, suspendedOrders } = useOrderStore();
  const { addSales } = useFinanceStore();
  const { isOnline } = useOfflineStore();

  // 挂单列表弹窗
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);

  // 客显屏状态
  const [showCustomerDisplay, setShowCustomerDisplay] = useState(false);



  // 处理扫码识别
  const handleScan = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    setAiScanResult({ barcode, loading: true });
    const result = await aiBarcodeLookup(barcode);
    if (result.success && result.product) {
      addItem(result.product, 1);
    }
    setAiScanResult({ ...result, loading: false });
  }, [addItem]);

  // 处理视觉识别
  const handleVisionRecognize = useCallback(async () => {
    setAiVisionResult({ loading: true, candidates: [] });
    const results = await aiVisionRecognize();
    // 自动添加最高置信度的商品
    if (results.length > 0 && results[0].confidence > 0.8) {
      const matched = products.find(p => p.name.includes(results[0].name) || results[0].name.includes(p.name));
      if (matched) {
        setCurrentProduct(matched);
        addItem(matched, results[0].estimatedWeight || 0.5);
      }
    }
    setAiVisionResult({ candidates: results, loading: false });
  }, [products, addItem]);

  // 电子秤监听
  useEffect(() => {
    const cleanup = scaleService.startListeningSimulate((reading) => {
      setCurrentWeight(reading.weight);
      if (reading.weight > 0.01) {
        setScaleStatus(reading.weight > 0.01 ? 'triggered' : 'idle');
      }
    });
    setScaleStatus('listening');
    return () => {
      cleanup();
      scaleService.stopListening();
    };
  }, []);

  // 分类列表
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(products.map(p => p.category))];
    return cats;
  }, [products]);

  // 过滤商品
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch = p.name.includes(searchQuery) || p.barcode.includes(searchQuery);
      return matchCategory && matchSearch && p.status === 'active';
    });
  }, [products, activeCategory, searchQuery]);

  // 计算总价
  const totals = useMemo(() => {
    const result = getTotal();
    const clearanceDiscount = isClearanceMode() ? 0.8 : 1;
    const memberDiscount = currentMember ? (currentMember.level === 'diamond' ? 0.9 : currentMember.level === 'gold' ? 0.95 : currentMember.level === 'silver' ? 0.98 : 1) : 1;
    const finalDiscount = clearanceDiscount * memberDiscount;
    return {
      subtotal: result.subtotal,
      clearanceDiscount: isClearanceMode() ? result.subtotal * 0.2 : 0,
      memberDiscount: result.subtotal * (1 - memberDiscount),
      total: result.subtotal * finalDiscount,
    };
  }, [items, currentMember, getTotal]);

  // 清货模式提示
  const clearanceMode = isClearanceMode();

  // 添加商品
  const handleAddProduct = (product: Product, quantity: number = 1) => {
    const storeId = currentStore?.id || 'store001';
    // 库存检查
    const existing = items.find(i => i.product.id === product.id);
    const currentCartQty = existing?.quantity || 0;
    const totalRequired = currentCartQty + quantity;
    
    const { available, currentQty } = checkInventory(storeId, product.id, totalRequired);
    if (!available) {
      alert(`库存不足！当前库存: ${currentQty}，无法添加 ${quantity} 件`);
      return;
    }
    addItem(product, quantity);
    // 添加成功后清除当前称重商品（如果是称重商品）
    if (!product.isStandard) {
      setCurrentProduct(null);
    }
  };
  
  // 添加称重商品到购物车（从称重面板）
  const handleAddToCart = () => {
    if (currentProduct && currentWeight > 0) {
      handleAddProduct(currentProduct, currentWeight);
    }
  };

  // 会员识别
  const handleMemberScan = () => {
    setMemberError('');
    if (!memberPhone.trim()) {
      setMemberError('请输入手机号');
      return;
    }
    const member = scanMember(memberPhone);
    if (member) {
      setShowMemberModal(false);
      setMemberPhone('');
      setMemberError('');
    } else {
      setMemberError('未找到该会员');
    }
  };

  // 挂单
  const handleSuspend = () => {
    if (items.length === 0) return;
    const order = {
      id: `order_${Date.now()}`,
      orderNo: `POS${Date.now()}`,
      type: 'pos' as const,
      storeId: 'store001',
      memberId: currentMember?.id,
      items: items.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        barcode: i.product.barcode,
        quantity: i.quantity,
        unitPrice: i.product.retailPrice,
        discount: 0,
        subtotal: i.product.retailPrice * i.quantity,
      })),
      totalAmount: totals.subtotal,
      discountAmount: totals.clearanceDiscount + totals.memberDiscount,
      finalAmount: totals.total,
      payMethod: 'cash' as const,
      payStatus: 'unpaid' as const,
      status: 'pending' as const,
      cashierId: 'emp001',
      createdAt: new Date().toISOString(),
    };
    createOrder(order);
    suspendOrder(order.id);
    clearCart();
  };

  // 取单
  const handleResumeOrder = (orderId: string) => {
    const order = resumeOrder(orderId);
    if (order) {
      // 将订单商品恢复到购物车
      clearCart();
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          addItem(product, item.quantity);
        }
      });
      setShowSuspendedModal(false);
    }
  };

  // 支付
  const handlePay = async () => {
    if (!selectedPay || items.length === 0) return;
    setIsProcessing(true);
    
    const storeId = currentStore?.id || 'store001';
    
    // 扣减库存（V6.0严禁负库存销售）
    for (const item of items) {
      const success = deductInventory(storeId, item.product.id, item.quantity);
      if (!success) {
        setIsProcessing(false);
        alert(`库存不足：${item.product.name}，无法完成支付`);
        return;
      }
    }
    
    await new Promise(r => setTimeout(r, 1000));
    
    const payMethod = selectedPay === 'cash' ? 'cash' : 
                      selectedPay === 'wechat' ? 'wechat' :
                      selectedPay === 'alipay' ? 'alipay' : 'member';
    
    const order = {
      id: `order_${Date.now()}`,
      orderNo: `POS${Date.now()}`,
      type: 'pos' as const,
      storeId,
      memberId: currentMember?.id,
      items: items.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        barcode: i.product.barcode,
        quantity: i.quantity,
        unitPrice: i.product.retailPrice,
        discount: 0,
        subtotal: i.product.retailPrice * i.quantity,
      })),
      totalAmount: totals.subtotal,
      discountAmount: totals.clearanceDiscount + totals.memberDiscount,
      finalAmount: totals.total,
      payMethod: payMethod as 'cash' | 'wechat' | 'alipay' | 'unionpay' | 'member',
      payStatus: 'paid' as const,
      status: 'paid' as const,
      cashierId: 'emp001',
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    };
    
    createOrder(order);
    addSales(totals.total, payMethod === 'cash' ? 'cash' : 'online');
    
    setIsProcessing(false);
    setShowPayModal(false);
    setShowSuccess(true);
    clearCart();
    
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部状态栏 */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold">
            {storeModules.find(m => m.id === activeModule)?.label || '收银台'}
          </h1>
          {clearanceMode && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              清货模式 8折
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* 电子秤状态 */}
          <div className="flex items-center gap-2 text-xs px-2 py-1 bg-gray-100 rounded">
            <span className={`w-2 h-2 rounded-full ${
              scaleStatus === 'triggered' ? 'bg-green-500 animate-pulse' : 
              scaleStatus === 'listening' ? 'bg-blue-500' : 'bg-gray-400'
            }`}></span>
            <span className="text-gray-600">
              {scaleStatus === 'triggered' ? `称重中 ${currentWeight.toFixed(3)}kg` : '秤就绪'}
            </span>
          </div>
          
          {!isOnline && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              离线模式
            </span>
          )}
          <button
            onClick={() => setShowMemberModal(true)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {currentMember ? `${currentMember.name} (${currentMember.level === 'diamond' ? '钻石' : currentMember.level === 'gold' ? '金卡' : currentMember.level === 'silver' ? '银卡' : '普通'})` : '会员识别'}
          </button>
        </div>
      </div>
      
      {/* 主体区域：侧边栏 + 内容 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧侧边栏 */}
        <aside className="w-20 bg-gray-800 text-white flex flex-col">
          {/* 侧边栏头部 */}
          <div className="p-2 border-b border-gray-700">
            <div className="flex flex-col items-center">
              <img src="/logo.png" alt="海邻到家" className="h-10 w-auto" />
              <p className="text-xs mt-1 truncate max-w-full text-center leading-tight">{currentStore?.name || '门店'}</p>
            </div>
          </div>
          
          {/* 模块导航 */}
          <nav className="flex-1 py-2">
            {storeModules.map(mod => (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`w-full flex flex-col items-center py-2 px-1 mb-1 transition-colors ${
                  activeModule === mod.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="text-xl">{mod.icon}</span>
                <span className="text-xs mt-1">{mod.label}</span>
              </button>
            ))}
          </nav>
          
          {/* 侧边栏底部 */}
          <div className="p-2 border-t border-gray-700 text-center">
            <p className="text-xs text-gray-500">V6.0</p>
          </div>
        </aside>
        
        {/* 全局状态指示器 */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
          <ClearanceModeIndicator />
          <OfflineIndicator />
        </div>
        
        {/* 右侧主内容区 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 管理模块内容 */}
          {activeModule !== 'cashier' && (
            <StoreManagementModule 
              module={activeModule} 
              store={currentStore}
              products={products}
              members={members}
              orders={useOrderStore.getState().orders}
            />
          )}

          {/* 收银台界面 */}
          {activeModule === 'cashier' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 称重信息面板 - 称重商品时显示 */}
            {currentProduct && !currentProduct.isStandard && (
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 mb-4 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-3xl">🍎</span>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">当前称重商品</p>
                      <p className="text-xl font-bold">{currentProduct.name}</p>
                      <p className="text-sm opacity-80 mt-1">
                        零售价：<span className="font-semibold">¥{currentProduct.retailPrice.toFixed(2)}</span>/kg
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-80">当前重量</p>
                    <p className="text-4xl font-bold">{currentWeight.toFixed(3)}</p>
                    <p className="text-sm opacity-80">kg</p>
                  </div>
                  <div className="text-right border-l border-white/30 pl-6">
                    <p className="text-sm opacity-80">商品金额</p>
                    <p className="text-4xl font-bold text-yellow-300">
                      ¥{(currentWeight * currentProduct.retailPrice).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="px-6 py-3 bg-white text-green-600 rounded-xl font-semibold hover:bg-green-50 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    加入购物车
                  </button>
                </div>
              </div>
            )}

            {/* 左侧商品区 */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* 工具栏 */}
          <div className="flex items-center gap-3 mb-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="搜索商品名称或条码..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {/* 客显屏按钮 */}
            <button
              onClick={() => setShowCustomerDisplay(!showCustomerDisplay)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                showCustomerDisplay 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
              title="客显屏"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="hidden md:inline">客显屏</span>
              {showCustomerDisplay && (
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              )}
            </button>
          </div>

          {/* 分类导航 */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full whitespace-nowrap ${
                  activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat === 'all' ? '全部' : cat}
              </button>
            ))}
          </div>

          {/* 商品网格 */}
          <div className="flex-1 overflow-y-auto grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => handleAddProduct(product)}
                className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md cursor-pointer transition-all active:scale-95"
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                  {!product.isStandard && (
                    <span className="text-2xl">🍎</span>
                  )}
                  {product.isStandard && (
                    <span className="text-xs text-gray-400">{product.name.slice(0, 2)}</span>
                  )}
                </div>
                <p className="text-sm font-medium truncate">{product.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-red-600 font-semibold">¥{product.retailPrice.toFixed(2)}</span>
                  {!product.isStandard && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-1 rounded">称重</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧购物车 */}
        <div className="w-96 bg-white border-l flex flex-col">
          {/* 会员信息 */}
          {currentMember && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{currentMember.name}</p>
                  <p className="text-sm opacity-80">{currentMember.level === 'diamond' ? '💎 钻石会员' : currentMember.level === 'gold' ? '🥇 金卡会员' : '🥈 银卡会员'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">积分</p>
                  <p className="font-bold">{currentMember.points.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* 购物车标题 */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-medium">购物车 ({items.length})</span>
            <button onClick={clearCart} className="text-sm text-gray-500 hover:text-red-500">
              清空
            </button>
          </div>

          {/* 购物车列表 */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p>购物车是空的</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.product.id} className={`flex items-center gap-3 p-3 border-b ${!item.product.isStandard ? 'bg-orange-50 -mx-2 px-2' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {!item.product.isStandard && (
                        <span className="text-lg">🍎</span>
                      )}
                      <p className="font-medium text-sm">{item.product.name}</p>
                      {!item.product.isStandard && (
                        <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded">称重</span>
                      )}
                    </div>
                    
                    {/* 称重商品详细信息 */}
                    {!item.product.isStandard ? (
                      <div className="mt-2 p-2 bg-white rounded-lg border border-orange-200">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <p className="text-gray-500">单价</p>
                            <p className="font-medium text-gray-800">¥{item.product.retailPrice.toFixed(2)}<span className="text-gray-500">/kg</span></p>
                          </div>
                          <div className="text-center border-l border-r border-gray-200">
                            <p className="text-gray-500">重量</p>
                            <p className="font-bold text-orange-600">{item.quantity.toFixed(3)}<span className="text-gray-500 font-normal"> kg</span></p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-500">金额</p>
                            <p className="font-bold text-green-600">¥{(item.quantity * item.product.retailPrice).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-orange-100 text-center text-xs text-gray-500">
                          ¥{item.product.retailPrice.toFixed(2)} × {item.quantity.toFixed(3)}kg = ¥{(item.quantity * item.product.retailPrice).toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-red-600 text-sm">¥{item.product.retailPrice.toFixed(2)}</p>
                        <span className="text-gray-500 text-xs">× {item.quantity}</span>
                        <span className="text-gray-400 text-xs">= ¥{(item.product.retailPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.product.isStandard ? (
                      <>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          +
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => updateQuantity(item.product.id, Math.max(0.1, item.quantity - 0.1))}
                          className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="w-14 text-center text-sm bg-orange-100 px-1 py-0.5 rounded font-medium">
                          {item.quantity.toFixed(2)}kg
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 0.1)}
                          className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 结算 */}
          <div className="border-t p-4 space-y-3">
            {/* 优惠明细 */}
            {(totals.clearanceDiscount > 0 || totals.memberDiscount > 0) && (
              <div className="text-sm space-y-1">
                {totals.clearanceDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>清货8折优惠</span>
                    <span>-¥{totals.clearanceDiscount.toFixed(2)}</span>
                  </div>
                )}
                {totals.memberDiscount > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>会员折扣</span>
                    <span>-¥{totals.memberDiscount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* 总计 */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">应付金额</span>
              <span className="text-2xl font-bold text-red-600">¥{totals.total.toFixed(2)}</span>
            </div>

            {/* 操作按钮 */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleSuspend}
                disabled={items.length === 0}
                className="py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                挂单
              </button>
              <button
                onClick={() => setShowSuspendedModal(true)}
                className="py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 relative text-sm"
              >
                取单
                {suspendedOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {suspendedOrders.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowPayModal(true)}
                disabled={items.length === 0}
                className="py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                收款
              </button>
            </div>
          </div>
        </div>
      </div>

          )}
      {/* 会员识别弹窗 */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-96 p-6">
            <h3 className="text-lg font-semibold mb-4">会员识别</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="输入手机号"
                value={memberPhone}
                onChange={(e) => { setMemberPhone(e.target.value); setMemberError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleMemberScan()}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {memberError && (
                <p className="text-red-500 text-sm mt-1">{memberError}</p>
              )}
              <div className="text-sm text-gray-500">
                <p className="mb-2">快速识别：</p>
                <div className="flex flex-wrap gap-2">
                  {members.slice(0, 3).map(m => (
                    <button
                      key={m.id}
                      onClick={() => { scanMember(m.phone); setShowMemberModal(false); }}
                      className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                    >
                      {m.phone.slice(-4)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => { setShowMemberModal(false); setMemberPhone(''); }}
                className="flex-1 py-2 border rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleMemberScan}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 挂单列表弹窗 */}
      {showSuspendedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[480px] max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">挂单列表</h3>
              <button
                onClick={() => setShowSuspendedModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {suspendedOrders.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>暂无挂单</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suspendedOrders.map(order => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 hover:border-blue-400 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="text-lg font-semibold text-red-600">
                          ¥{order.finalAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        {order.items.length} 件商品
                        {order.items.slice(0, 2).map(item => (
                          <span key={item.productId} className="inline-block mr-2">
                            {item.productName}
                          </span>
                        ))}
                        {order.items.length > 2 && `...`}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResumeOrder(order.id)}
                          disabled={items.length > 0}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          取单
                        </button>
                        <button
                          onClick={() => {
                            const { deleteSuspendedOrder } = useOrderStore.getState();
                            deleteSuspendedOrder(order.id);
                          }}
                          className="py-2 px-4 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 text-sm"
                        >
                          删除
                        </button>
                      </div>
                      {items.length > 0 && (
                        <p className="text-xs text-orange-500 mt-2">
                          当前购物车有商品，请先结算或清空后再取单
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 客显屏 */}
      <CustomerDisplayOverlay
        isOpen={showCustomerDisplay}
        onClose={() => setShowCustomerDisplay(false)}
        storeName={currentStore?.name}
        items={items}
        totals={totals}
        currentMember={currentMember}
      />

      {/* 支付弹窗 */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-96 p-6">
            <h3 className="text-lg font-semibold mb-4">选择支付方式</h3>
            
            <div className="space-y-3">
              {[
                { id: 'wechat', name: '微信支付', icon: '💳', color: 'bg-green-500' },
                { id: 'alipay', name: '支付宝', icon: '💰', color: 'bg-blue-500' },
                { id: 'unionpay', name: '云闪付', icon: '🏦', color: 'bg-red-500' },
                { id: 'cash', name: '现金', icon: '💵', color: 'bg-yellow-500' },
                ...(currentMember && currentMember.balance > 0 ? [{ id: 'member', name: `会员卡 (余额¥${currentMember.balance})`, icon: '👤', color: 'bg-purple-500' }] : []),
              ].map(pay => (
                <button
                  key={pay.id}
                  onClick={() => setSelectedPay(pay.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    selectedPay === pay.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`w-10 h-10 ${pay.color} rounded-lg flex items-center justify-center text-xl`}>
                    {pay.icon}
                  </span>
                  <span className="font-medium">{pay.name}</span>
                  {selectedPay === pay.id && (
                    <svg className="w-6 h-6 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowPayModal(false)}
                className="flex-1 py-3 border rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handlePay}
                disabled={!selectedPay || isProcessing}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    处理中...
                  </>
                ) : (
                  <>确认收款 ¥{totals.total.toFixed(2)}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 支付成功 */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-80 p-8 text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-green-600">支付成功</h3>
            <p className="text-gray-500 mt-2">¥{totals.total.toFixed(2)}</p>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
}

// ============ 门店管理模块组件 ============
interface StoreManagementModuleProps {
  module: StoreModule;
  store: any;
  products: Product[];
  members: any[];
  orders: any[];
}

function StoreManagementModule({ module, store, products, members, orders }: StoreManagementModuleProps) {
  const { inventories } = useProductStore();
  
  // 缓存管理
  const [cacheSize, setCacheSize] = useState('0 KB');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  
  // 配送管理
  const [deliveryTab, setDeliveryTab] = useState<'store' | 'mini' | 'platform' | 'groupbuy'>('store');
  
  // 计算缓存大小
  const calculateCacheSize = useCallback(() => {
    let total = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
          total += sessionStorage[key].length + key.length;
        }
      }
    } catch (e) {
      console.error('计算缓存大小失败', e);
    }
    // 转换为 KB
    const kb = (total / 1024).toFixed(2);
    setCacheSize(kb);
    return parseFloat(kb);
  }, []);
  
  // 清除缓存
  const clearCache = useCallback(() => {
    try {
      // 清除 localStorage
      localStorage.clear();
      // 清除 sessionStorage
      sessionStorage.clear();
      // 尝试清除 IndexedDB (如果存在)
      if ('indexedDB' in window) {
        const dbs = window.indexedDB.databases();
        dbs.then(dbs => {
          dbs.forEach(db => {
            if (db.name) window.indexedDB.deleteDatabase(db.name);
          });
        }).catch(() => {});
      }
      setCacheSize('0.00');
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 3000);
    } catch (e) {
      console.error('清除缓存失败', e);
    }
  }, []);
  
  // 组件挂载时计算缓存大小
  useEffect(() => {
    if (module === 'settings') {
      calculateCacheSize();
    }
  }, [module, calculateCacheSize]);
  
  // 库存管理
  if (module === 'inventory') {
    const storeInventories = Array.from(inventories.entries())
      .filter(([key]) => key.startsWith(store?.id || 'store001'))
      .map(([key, inv]) => ({
        ...inv,
        product: products.find((p: Product) => p.id === inv.productId),
      }));
    
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">库存概览</h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">盘点</button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: '商品种类', value: storeInventories.length, color: 'blue' },
                { label: '正常库存', value: storeInventories.filter((i: any) => i.status === 'normal').length, color: 'green' },
                { label: '库存预警', value: storeInventories.filter((i: any) => i.status === 'low').length, color: 'yellow' },
                { label: '紧急补货', value: storeInventories.filter((i: any) => i.status === 'critical').length, color: 'red' },
              ].map((item, i) => (
                <div key={i} className={`bg-${item.color}-50 rounded-lg p-3`}>
                  <p className={`text-sm text-${item.color}-600`}>{item.label}</p>
                  <p className={`text-xl font-bold text-${item.color}-800`}>{item.value}</p>
                </div>
              ))}
            </div>
            
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-2">商品</th>
                  <th className="pb-2">分类</th>
                  <th className="pb-2">当前库存</th>
                  <th className="pb-2">预警阈值</th>
                  <th className="pb-2">状态</th>
                </tr>
              </thead>
              <tbody>
                {storeInventories.slice(0, 10).map((inv: any, i: number) => (
                  <tr key={i} className="border-b">
                    <td className="py-3">{inv.product?.name || '未知商品'}</td>
                    <td className="py-3 text-gray-500">{inv.product?.category || '-'}</td>
                    <td className={`py-3 font-medium ${inv.status === 'critical' ? 'text-red-600' : inv.status === 'low' ? 'text-yellow-600' : 'text-gray-800'}`}>
                      {inv.quantity} {inv.product?.unit}
                    </td>
                    <td className="py-3 text-gray-500">{inv.warningThreshold}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        inv.status === 'normal' ? 'bg-green-100 text-green-600' :
                        inv.status === 'low' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {inv.status === 'normal' ? '正常' : inv.status === 'low' ? '预警' : '紧急'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 要货申请 */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">要货申请</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">新建要货</button>
            </div>
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🚚</p>
              <p>暂无要货记录</p>
              <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm">
                发起要货申请
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // 商品管理
  if (module === 'products') {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">本店商品</h3>
            <span className="text-sm text-gray-500">共 {products.length} 种商品</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-2">商品</th>
                <th className="pb-2">条码</th>
                <th className="pb-2">分类</th>
                <th className="pb-2">售价</th>
                <th className="pb-2">状态</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 15).map((product) => (
                <tr key={product.id} className="border-b">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span>{product.isStandard ? '📦' : '🍎'}</span>
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td className="py-3 font-mono text-sm text-gray-500">{product.barcode || '-'}</td>
                  <td className="py-3 text-gray-500">{product.category}</td>
                  <td className="py-3 text-green-600 font-medium">¥{product.retailPrice}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs ${product.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {product.status === 'active' ? '在售' : '停售'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  
  // 订单管理
  if (module === 'orders') {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">今日订单</h3>
            <span className="text-sm text-gray-500">共 {orders.length || 0} 笔</span>
          </div>
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p>暂无订单记录</p>
            <p className="text-sm mt-1">完成收银后将自动生成订单</p>
          </div>
        </div>
      </div>
    );
  }
  
  // 报表中心
  if (module === 'reports') {
    const today = new Date().toLocaleDateString('zh-CN');
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">销售报表</h3>
            <select className="px-3 py-1 border rounded text-sm">
              <option>今日</option>
              <option>本周</option>
              <option>本月</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: '今日销售', value: '¥0.00', icon: '💰', color: 'green' },
              { label: '订单数', value: '0', icon: '🧾', color: 'blue' },
              { label: '客单价', value: '¥0.00', icon: '👤', color: 'purple' },
              { label: '毛利', value: '¥0.00', icon: '📈', color: 'orange' },
            ].map((item, i) => (
              <div key={i} className={`bg-${item.color}-50 rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <span>{item.icon}</span>
                  <span className={`text-sm text-${item.color}-600`}>{item.label}</span>
                </div>
                <p className={`text-xl font-bold text-${item.color}-800`}>{item.value}</p>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">热销商品排行</h4>
            <div className="text-center py-4 text-gray-400">
              <p>暂无销售数据</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // 配送管理
  if (module === 'delivery') {
    const deliveryTabs = [
      { id: 'store', label: '门店配送', icon: '🏪' },
      { id: 'mini', label: '小程序订单', icon: '📱' },
      { id: 'platform', label: '公域平台', icon: '🌐' },
      { id: 'groupbuy', label: '团购接龙', icon: '👥' },
    ];
    
    // 模拟配送订单数据
    const deliveryOrders = {
      store: [
        { id: 'D20240117001', type: '调入', from: '国贸店', items: 12, amount: 2800, status: 'pending', time: '14:30' },
        { id: 'D20240117002', type: '调出', to: '中关村店', items: 8, amount: 1560, status: 'shipped', time: '13:20' },
      ],
      mini: [
        { id: 'MINI20240117001', source: '小程序', items: 5, amount: 89.5, status: 'pending', time: '14:25' },
        { id: 'MINI20240117002', source: '小程序', items: 3, amount: 45.0, status: 'preparing', time: '14:10' },
        { id: 'MINI20240117003', source: '小程序', items: 8, amount: 156.0, status: 'shipped', time: '13:50' },
      ],
      platform: [
        { id: 'MT20240117001', source: '美团', items: 4, amount: 68.0, status: 'pending', time: '14:20' },
        { id: 'ELE20240117001', source: '饿了么', items: 6, amount: 92.0, status: 'preparing', time: '14:05' },
        { id: 'MT20240117002', source: '美团', items: 3, amount: 45.0, status: 'shipped', time: '13:40' },
      ],
      groupbuy: [
        { id: 'GB20240117001', group: '望京社区群', leader: '张阿姨', items: 25, amount: 680.0, status: 'open', time: '08:00' },
        { id: 'GB20240117002', group: '国贸业主群', leader: '李叔叔', items: 18, amount: 420.0, status: 'closed', time: '07:30' },
      ],
    };
    
    const getStatusLabel = (status: string) => {
      const map: Record<string, { label: string; color: string }> = {
        pending: { label: '待接单', color: 'yellow' },
        preparing: { label: '备货中', color: 'blue' },
        shipped: { label: '已发货', color: 'green' },
        open: { label: '接龙中', color: 'purple' },
        closed: { label: '已结束', color: 'gray' },
      };
      return map[status] || { label: status, color: 'gray' };
    };
    
    return (
      <div className="flex-1 overflow-auto p-4">
        {/* 配送概览 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[
            { label: '待接单', value: 4, icon: '⏳', color: 'yellow' },
            { label: '备货中', value: 2, icon: '🔄', color: 'blue' },
            { label: '已发货', value: 3, icon: '✅', color: 'green' },
            { label: '今日营收', value: '¥1,485', icon: '💰', color: 'purple' },
          ].map((item, i) => (
            <div key={i} className={`bg-${item.color}-50 rounded-lg p-3`}>
              <div className="flex items-center gap-2 mb-1">
                <span>{item.icon}</span>
                <span className={`text-sm text-${item.color}-600`}>{item.label}</span>
              </div>
              <p className={`text-xl font-bold text-${item.color}-800`}>{item.value}</p>
            </div>
          ))}
        </div>
        
        {/* 配送类型切换 */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b px-4">
            <div className="flex gap-1">
              {deliveryTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDeliveryTab(tab.id as typeof deliveryTab)}
                  className={`px-4 py-3 border-b-2 transition-colors flex items-center gap-2 ${
                    deliveryTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* 订单列表 */}
          <div className="p-4">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3">订单号</th>
                  <th className="pb-3">{deliveryTab === 'store' ? '类型' : '来源'}</th>
                  <th className="pb-3">{deliveryTab === 'store' ? '对方门店' : deliveryTab === 'groupbuy' ? '团长' : '商品数'}</th>
                  <th className="pb-3">金额</th>
                  <th className="pb-3">状态</th>
                  <th className="pb-3">时间</th>
                  <th className="pb-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {(deliveryOrders as any)[deliveryTab]?.map((order: any, i: number) => {
                  const status = getStatusLabel(order.status);
                  return (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 font-mono text-sm">{order.id}</td>
                      <td className="py-3">
                        {deliveryTab === 'store' ? (
                          <span className={`px-2 py-1 rounded text-xs ${order.type === '调入' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                            {order.type}
                          </span>
                        ) : (
                          order.source
                        )}
                      </td>
                      <td className="py-3">
                        {deliveryTab === 'store' ? (order.from || order.to) : 
                         deliveryTab === 'groupbuy' ? `${order.group} - ${order.leader}` : 
                         `${order.items}件`}
                      </td>
                      <td className="py-3 text-green-600 font-medium">¥{order.amount.toFixed(1)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs bg-${status.color}-100 text-${status.color}-600`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">{order.time}</td>
                      <td className="py-3">
                        {order.status === 'pending' && (
                          <button className="text-blue-600 hover:underline text-sm mr-2">接单</button>
                        )}
                        {order.status === 'preparing' && (
                          <button className="text-green-600 hover:underline text-sm mr-2">发货</button>
                        )}
                        {order.status === 'open' && (
                          <button className="text-red-600 hover:underline text-sm mr-2">结束</button>
                        )}
                        <button className="text-gray-500 hover:underline text-sm">详情</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {(deliveryOrders as any)[deliveryTab]?.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-2">📦</p>
                <p>暂无{deliveryTabs.find(t => t.id === deliveryTab)?.label}订单</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // 促销管理
  if (module === 'promo') {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">本店促销</h3>
            <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">晚8点清货 8折</span>
          </div>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">晚8点清货模式</span>
                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">自动</span>
              </div>
              <p className="text-sm text-gray-500">每日 20:00 - 23:00 全场商品8折优惠</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">会员折扣</span>
                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded">生效中</span>
              </div>
              <p className="text-sm text-gray-500">钻石会员9折 / 金卡会员95折 / 银卡会员98折</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // 会员管理
  if (module === 'members') {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">本店会员</h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">添加会员</button>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { level: '钻石会员', count: members.filter(m => m.level === 'diamond').length, color: 'purple' },
              { level: '金卡会员', count: members.filter(m => m.level === 'gold').length, color: 'yellow' },
              { level: '银卡会员', count: members.filter(m => m.level === 'silver').length, color: 'gray' },
              { level: '普通会员', count: members.filter(m => m.level === 'normal').length, color: 'blue' },
            ].map((item, i) => (
              <div key={i} className={`bg-${item.color}-50 rounded-lg p-3 text-center`}>
                <p className="text-sm text-gray-500">{item.level}</p>
                <p className={`text-xl font-bold text-${item.color}-600`}>{item.count}</p>
              </div>
            ))}
          </div>
          
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-2">姓名</th>
                <th className="pb-2">手机号</th>
                <th className="pb-2">等级</th>
                <th className="pb-2">积分</th>
                <th className="pb-2">余额</th>
              </tr>
            </thead>
            <tbody>
              {members.slice(0, 10).map((member) => (
                <tr key={member.id} className="border-b">
                  <td className="py-3">{member.name}</td>
                  <td className="py-3 text-gray-500">{member.phone}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      member.level === 'diamond' ? 'bg-purple-100 text-purple-600' :
                      member.level === 'gold' ? 'bg-yellow-100 text-yellow-600' :
                      member.level === 'silver' ? 'bg-gray-100 text-gray-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {member.level === 'diamond' ? '💎钻石' : member.level === 'gold' ? '🥇金卡' : member.level === 'silver' ? '🥈银卡' : '普通'}
                    </span>
                  </td>
                  <td className="py-3">{member.points.toLocaleString()}</td>
                  <td className="py-3 text-green-600">¥{member.balance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  
  // 门店设置
  if (module === 'settings') {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-4">门店设置</h3>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">门店信息</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">门店名称：</span>
                  <span className="ml-2">{store?.name || '望京店'}</span>
                </div>
                <div>
                  <span className="text-gray-500">门店编码：</span>
                  <span className="ml-2">{store?.code || 'WJ001'}</span>
                </div>
                <div>
                  <span className="text-gray-500">门店地址：</span>
                  <span className="ml-2">{store?.address || '北京市朝阳区'}</span>
                </div>
                <div>
                  <span className="text-gray-500">联系电话：</span>
                  <span className="ml-2">{store?.phone || '010-12345678'}</span>
                </div>
              </div>
              <button className="mt-3 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                编辑门店信息
              </button>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">收款账户</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>微信支付</span>
                  <span className="text-green-600">已开通 ✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>支付宝</span>
                  <span className="text-green-600">已开通 ✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>云闪付</span>
                  <span className="text-gray-400">未开通</span>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">系统设置</h4>
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span>晚8点清货模式</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </label>
                <label className="flex items-center justify-between">
                  <span>负库存检查</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </label>
                <label className="flex items-center justify-between">
                  <span>小票打印</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </label>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3 text-red-600">危险操作</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">清除缓存</p>
                    <p className="text-xs text-gray-500">当前缓存: {cacheSize}</p>
                  </div>
                  <button 
                    onClick={() => setShowClearConfirm(true)}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    清除
                  </button>
                </div>
                {clearSuccess && (
                  <div className="p-2 bg-green-100 text-green-700 rounded-lg text-sm text-center">
                    缓存清除成功！
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* 清除缓存确认弹窗 */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-80 max-w-[90vw]">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">确认清除缓存？</h3>
                <p className="text-sm text-gray-500 mb-6">
                  将清除所有本地存储数据，包括购物车、历史记录等。<br/>
                  当前缓存: <span className="font-medium">{cacheSize}</span>
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => {
                      clearCache();
                      setShowClearConfirm(false);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    确认清除
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return null;
}

// 客显屏组件 - 渲染在 CashierPage 内部
export const CustomerDisplayOverlay: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
  items: Array<{
    product: {
      id: string;
      name: string;
      retailPrice: number;
      isStandard: boolean;
    };
    quantity: number;
  }>;
  totals: {
    subtotal: number;
    total: number;
    clearanceDiscount: number;
    memberDiscount: number;
  };
  currentMember?: {
    name: string;
    level: string;
    points: number;
  } | null;
}> = ({ isOpen, onClose, storeName, items, totals, currentMember }) => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 广告轮播
  useEffect(() => {
    if (items.length === 0) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % 3);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [items.length]);

  if (!isOpen) return null;

  const hasItems = items.length > 0;
  const adMessages = ['会员卡购物享积分', '晚8点后全场8折', '新会员首单满50减10'];

  return (
    <div
      className={`
        fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900
        flex flex-col transition-all duration-500
        ${isFullscreen ? '' : 'm-4 rounded-2xl overflow-hidden shadow-2xl'}
      `}
    >
      {/* 顶部标题栏 */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <span className="text-2xl font-bold">海</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">{storeName || '海邻到家便利店'}</h1>
              <p className="text-sm text-white/80">AI智慧收银系统</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentMember && (
              <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
                <p className="text-sm">会员：{currentMember.name}</p>
                <p className="text-xs text-white/80">
                  {currentMember.level === 'diamond' ? '💎 钻石会员' :
                   currentMember.level === 'gold' ? '🥇 金卡会员' : '🥈 银卡会员'}
                </p>
              </div>
            )}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title={isFullscreen ? '退出全屏' : '全屏显示'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isFullscreen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                )}
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {hasItems ? (
          <>
            {/* 左侧商品列表 */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                当前商品 ({items.length}件)
              </h2>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.product.id + index}
                    className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center gap-4 hover:bg-white/15 transition-colors"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center text-2xl">
                      {!item.product.isStandard ? '🍎' : '📦'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{item.product.name}</h3>
                      <p className="text-sm text-blue-200">
                        {item.product.isStandard ? (
                          <>× {item.quantity} 件</>
                        ) : (
                          <>重量 {item.quantity.toFixed(3)} kg</>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">
                        ¥{(item.product.retailPrice * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-blue-200">
                        ¥{item.product.retailPrice.toFixed(2)}/件
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧结算区 */}
            <div className="w-full lg:w-96 bg-white/5 backdrop-blur p-6 flex flex-col">
              {/* 价格明细 */}
              <div className="bg-white/10 rounded-2xl p-6 mb-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  价格明细
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-blue-100">
                    <span>商品小计</span>
                    <span>¥{totals.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {totals.clearanceDiscount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span className="flex items-center gap-1">
                        <span className="px-2 py-0.5 bg-green-500/30 rounded text-xs">清货</span>
                        清货8折优惠
                      </span>
                      <span>-¥{totals.clearanceDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {totals.memberDiscount > 0 && (
                    <div className="flex justify-between text-blue-400">
                      <span>会员折扣</span>
                      <span>-¥{totals.memberDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-white/20 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">应付金额</span>
                      <span className="text-3xl font-bold text-yellow-400">
                        ¥{totals.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 促销信息 */}
              {totals.clearanceDiscount === 0 && totals.memberDiscount === 0 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 mb-6 border border-amber-500/30">
                  <p className="text-amber-200 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    晚8点后全场8折优惠
                  </p>
                </div>
              )}

              {/* 会员提示 */}
              {!currentMember && (
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 mb-6 border border-blue-500/30">
                  <p className="text-blue-200 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    刷会员卡享更多优惠
                  </p>
                </div>
              )}

              {/* 支付引导 */}
              <div className="mt-auto">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-center">
                  <p className="text-white font-semibold text-lg">请选择支付方式</p>
                  <p className="text-white/80 text-sm mt-1">微信 / 支付宝 / 现金 / 会员卡</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* 待机画面 */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                欢迎光临
              </h2>
              <p className="text-2xl text-blue-200">{storeName || '海邻到家便利店'}</p>
            </div>

            {/* 广告轮播 */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 mb-12 max-w-md w-full">
              <div className="h-16 flex items-center justify-center">
                <p className="text-2xl text-center text-white animate-pulse">
                  {adMessages[currentAdIndex]}
                </p>
              </div>
              <div className="flex justify-center gap-2 mt-6">
                {adMessages.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentAdIndex ? 'bg-white w-6' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 功能介绍 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl w-full">
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-4xl mb-3">💳</div>
                <p className="text-white font-medium">聚合支付</p>
                <p className="text-blue-200 text-sm">微信/支付宝/云闪付</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-4xl mb-3">💰</div>
                <p className="text-white font-medium">会员积分</p>
                <p className="text-blue-200 text-sm">消费攒积分</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-4xl mb-3">🏷️</div>
                <p className="text-white font-medium">会员折扣</p>
                <p className="text-blue-200 text-sm">最高享9折</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-4xl mb-3">📱</div>
                <p className="text-white font-medium">扫码购物</p>
                <p className="text-blue-200 text-sm">AI智能识别</p>
              </div>
            </div>

            <p className="text-blue-300/60 text-sm mt-12">
              海邻到家 V6.0 AI智慧收银系统
            </p>
          </div>
        )}
      </div>

      {/* 底部 */}
      <div className="bg-black/30 text-center py-3">
        <p className="text-blue-200/60 text-sm">
          {hasItems ? '收银完成请出示付款码' : '如有疑问请联系店员'}
        </p>
      </div>
    </div>
  );
};
