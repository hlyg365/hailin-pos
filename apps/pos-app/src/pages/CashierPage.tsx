import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore, useProductStore, useMemberStore, useOrderStore, useFinanceStore, useOfflineStore, useStoreStore } from '../store';
import ClearanceModeIndicator from '../components/ClearanceModeIndicator';
import OfflineIndicator from '../components/OfflineIndicator';
import { deviceManager } from '../services/posDevices';
import type { Product } from '../types';

// 检查清货模式
const isClearanceMode = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 20 && hour < 23;
}

// 门店模块配置
const storeModules = [
  { id: 'cashier', label: '收银', icon: '💰' },
  { id: 'inventory', label: '库存', icon: '📦' },
  { id: 'orders', label: '订单', icon: '📋' },
  { id: 'settings', label: '设置', icon: '⚙️' },
];

export default function CashierPage() {
  const [activeModule, setActiveModule] = useState('cashier');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberPhone, setMemberPhone] = useState('');
  const [memberError, setMemberError] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPay, setSelectedPay] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const [showDevicePanel, setShowDevicePanel] = useState(false);
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [aiScanResult, setAiScanResult] = useState<{ barcode?: string; loading?: boolean; product?: Product; candidates?: Product[] } | null>(null);
  const [aiVisionResult, setAiVisionResult] = useState<{ loading?: boolean; candidates?: { name: string; confidence: number; estimatedWeight?: number }[] } | null>(null);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [showMemberInput, setShowMemberInput] = useState(false);
  const [memberInput, setMemberInput] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const isOnline = useOfflineStore(state => state.isOnline);
  const clearanceMode = isClearanceMode();

  const { items, addItem, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
  const products = useProductStore(state => state.products);
  const currentMember = useMemberStore(state => state.currentMember);
  const { orders, createOrder, suspendOrder, resumeOrder } = useOrderStore();
  const currentStore = useStoreStore(state => state.currentStore);
  const { totals, hasItems } = useMemo(() => {
    const result = getTotal();
    const items = useCartStore.getState().items;
    const clearanceDiscount = isClearanceMode() ? 0.8 : 1;
    const memberDiscount = currentMember ? (currentMember.level === 'diamond' ? 0.9 : currentMember.level === 'gold' ? 0.95 : currentMember.level === 'silver' ? 0.98 : 1) : 1;
    const finalDiscount = clearanceDiscount * memberDiscount;
    return {
      totals: {
        subtotal: result.subtotal,
        clearanceDiscount: isClearanceMode() ? result.subtotal * 0.2 : 0,
        memberDiscount: result.subtotal * (1 - memberDiscount),
        total: result.subtotal * finalDiscount,
      },
      hasItems: items.length > 0,
    };
  }, [getTotal, currentMember]);

  const categories = useMemo(() => {
    return ['all', ...new Set(products.map(p => p.category))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch = p.name.includes(searchQuery) || p.barcode.includes(searchQuery);
      return matchCategory && matchSearch && p.status === 'active';
    });
  }, [products, activeCategory, searchQuery]);

  const suspendedOrders = useMemo(() => {
    return orders.filter(o => o.status === 'suspended');
  }, [orders]);

  // 聚焦输入框
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // 扫描条码处理
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    setAiScanResult({ barcode, loading: true });
    const result = await aiBarcodeLookup(barcode);
    if (result.success && result.product) {
      addItem(result.product, 1);
      setAiScanResult(null);
      deviceManager.customerDisplay.showWaiting(result.product.retailPrice);
    } else {
      setAiScanResult({ barcode, candidates: result.candidates });
    }
  }, [addItem]);

  const aiBarcodeLookup = async (barcode: string): Promise<{ success: boolean; product?: Product; candidates?: Product[] }> => {
    const exact = products.find(p => p.barcode === barcode);
    if (exact) return { success: true, product: exact };
    const similar = products.filter(p => p.barcode.includes(barcode.slice(-6)));
    return { success: false, candidates: similar.slice(0, 3) };
  };

  const handleAiVision = useCallback(async () => {
    setAiVisionResult({ loading: true });
    const results = await aiVisionRecognize();
    setAiVisionResult({ candidates: results, loading: false });
  }, []);

  const aiVisionRecognize = async (): Promise<{ name: string; confidence: number; estimatedWeight?: number }[]> => {
    await new Promise(r => setTimeout(r, 500));
    return [
      { name: '红富士苹果', confidence: 0.95, estimatedWeight: 0.8 },
      { name: '黄元帅苹果', confidence: 0.72, estimatedWeight: 0.75 },
    ];
  };

  const handleSelectAiCandidate = (product: Product, weight?: number) => {
    addItem(product, weight || 1);
    setAiVisionResult(null);
  };

  const handleOpenDrawer = () => {
    deviceManager.cashDrawer.open();
  };

  const handleOpenCustomerDisplay = () => {
    deviceManager.customerDisplay.showWelcome();
  };

  const handlePay = async () => {
    if (!selectedPay || isProcessing) return;
    setIsProcessing(true);

    const payMethod = selectedPay;
    const order = {
      id: `order_${Date.now()}`,
      orderNo: `POS${Date.now()}`,
      type: 'pos' as const,
      storeId: currentStore?.id || 'store001',
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

  const addSales = useFinanceStore.getState().addSales;

  const handleMemberSearch = () => {
    const member = useMemberStore.getState().members.find(m => 
      m.phone === memberInput || m.cardNumber === memberInput
    );
    if (member) {
      useMemberStore.getState().setCurrentMember(member);
      setShowMemberInput(false);
      setMemberInput('');
    } else {
      alert('未找到该会员');
    }
  };

  const handleSuspend = () => {
    if (items.length === 0) return;
    const order = {
      id: `order_${Date.now()}`,
      orderNo: `POS${Date.now()}`,
      type: 'pos' as const,
      storeId: currentStore?.id || 'store001',
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
      payMethod: 'suspended' as const,
      payStatus: 'unpaid' as const,
      status: 'suspended' as const,
      cashierId: 'emp001',
      createdAt: new Date().toISOString(),
    };

    createOrder(order);
    suspendOrder(order.id);
    clearCart();
  };

  const handleResumeOrder = (orderId: string) => {
    const order = resumeOrder(orderId);
    if (order) {
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
          <button
            onClick={() => setShowDevicePanel(true)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            设备
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
              <img src="/logo.png" alt="海邻到家" className="h-10 w-auto rounded" style={{ background: 'rgba(255,255,255,0.1)', padding: '2px' }} />
              <p className="text-xs mt-1 truncate max-w-full text-center leading-tight">{currentStore?.name || '门店'}</p>
            </div>
          </div>

          {/* 模块导航 */}
          <nav className="flex-1 py-2 overflow-y-auto">
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

        {/* 右侧主内容区 */}
        <main className="flex-1 flex overflow-hidden">
          {/* 左侧内容区 */}
          <div className="flex-1 flex flex-col overflow-hidden">
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
                        <p className="text-2xl font-bold text-yellow-200">¥{(currentProduct.retailPrice * currentWeight).toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            // 确认添加称重商品到购物车
                            if (currentWeight > 0) {
                              addItem(currentProduct, currentWeight);
                              deviceManager.customerDisplay.showWaiting(totals.total + currentProduct.retailPrice * currentWeight);
                              setCurrentProduct(null);
                              setCurrentWeight(0);
                            }
                          }}
                          className="px-4 py-2 bg-yellow-400 text-green-800 rounded-lg font-medium hover:bg-yellow-300"
                        >
                          加入购物车
                        </button>
                        <button
                          onClick={() => {
                            setCurrentProduct(null);
                            setCurrentWeight(0);
                          }}
                          className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI识别结果面板 */}
                {aiScanResult && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <p className="text-blue-700 font-medium mb-2">
                      {aiScanResult.loading ? '正在查询商品...' : `未找到商品: ${aiScanResult.barcode}`}
                    </p>
                    {aiScanResult.candidates && aiScanResult.candidates.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">您是否在找：</p>
                        {aiScanResult.candidates.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectAiCandidate(p)}
                            className="w-full flex items-center justify-between bg-white rounded-lg p-3 border hover:border-blue-400"
                          >
                            <div>
                              <p className="font-medium">{p.name}</p>
                              <p className="text-sm text-gray-500">{p.barcode}</p>
                            </div>
                            <p className="text-red-600 font-semibold">¥{p.retailPrice.toFixed(2)}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AI视觉识别结果 */}
                {aiVisionResult && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
                    <p className="text-purple-700 font-medium mb-2">
                      {aiVisionResult.loading ? '正在识别商品...' : '识别到以下商品：'}
                    </p>
                    {aiVisionResult.candidates && aiVisionResult.candidates.length > 0 && (
                      <div className="space-y-2">
                        {aiVisionResult.candidates.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              const product = products.find(p => p.name === c.name);
                              if (product) {
                                handleSelectAiCandidate(product, c.estimatedWeight);
                              }
                            }}
                            className="w-full flex items-center justify-between bg-white rounded-lg p-3 border hover:border-purple-400"
                          >
                            <div>
                              <p className="font-medium">{c.name}</p>
                              <p className="text-sm text-gray-500">
                                置信度: {(c.confidence * 100).toFixed(0)}%
                                {c.estimatedWeight && ` | 预估重量: ${c.estimatedWeight}kg`}
                              </p>
                            </div>
                            {c.estimatedWeight && (
                              <p className="text-purple-600 font-semibold">约 ¥{((products.find(p => p.name === c.name)?.retailPrice || 0) * (c.estimatedWeight || 0)).toFixed(2)}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 扫描输入 */}
                <div className="bg-white rounded-xl p-4 mb-4 flex gap-3">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="扫描或输入条码"
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const barcode = (e.target as HTMLInputElement).value;
                        if (barcode) handleBarcodeScan(barcode);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    onClick={handleAiVision}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <span>👁️</span>
                    AI视觉
                  </button>
                  <button
                    onClick={() => setShowSuspendedModal(true)}
                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 relative"
                  >
                    挂单/取单
                    {suspendedOrders.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {suspendedOrders.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* 分类筛选 */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-full whitespace-nowrap ${
                        activeCategory === cat
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {cat === 'all' ? '全部' : cat}
                    </button>
                  ))}
                  <input
                    type="text"
                    placeholder="搜索商品..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 border rounded-full bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 商品网格 */}
                <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-3 p-1">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => {
                        if (!product.isStandard) {
                          // 称重商品：先设置当前商品，开始称重
                          setCurrentProduct(product);
                          // 模拟从电子秤读取重量
                          setCurrentWeight(Math.random() * 2 + 0.3);
                        } else {
                          // 标准商品：直接添加到购物车
                          addItem(product, 1);
                          deviceManager.customerDisplay.showWaiting(totals.total + product.retailPrice);
                        }
                      }}
                      className="bg-white rounded-xl p-3 text-left hover:shadow-md transition-shadow relative"
                    >
                      {/* 称重商品标记 */}
                      {!product.isStandard && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center">
                          <span className="text-xs">⚖️</span>
                        </div>
                      )}
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
                        {product.isStandard && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">标准</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 其他管理模块 */}
            {activeModule !== 'cashier' && (
              <div className="flex-1 overflow-auto p-4">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">{storeModules.find(m => m.id === activeModule)?.label}</h2>
                  <p className="text-gray-500">该模块功能开发中...</p>
                </div>
              </div>
            )}
          </div>

          {/* 右侧购物车 */}
          <div className="w-96 bg-white border-l flex flex-col">
            {/* 会员信息 */}
            {currentMember && (
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{currentMember.name}</p>
                    <p className="text-sm opacity-80">{currentMember.level === 'diamond' ? '💎 钻石会员' : currentMember.level === 'gold' ? '🥇 金卡会员' : currentMember.level === 'silver' ? '🥈 银卡会员' : '普通会员'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">积分</p>
                    <p className="font-bold">{currentMember.points.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 设备状态 */}
            <div className="bg-gray-50 px-4 py-2 flex items-center gap-3 text-xs border-b">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${deviceManager.printer.isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                打印机
              </span>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${deviceManager.scale.isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                电子秤
              </span>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${deviceManager.customerDisplay.isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                客显屏
              </span>
            </div>

            {/* 待称重提示 */}
            {currentProduct && !currentProduct.isStandard && (
              <div className="bg-orange-100 border-b border-orange-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl animate-pulse">⚖️</span>
                    <div>
                      <p className="text-sm font-medium text-orange-800">正在称重</p>
                      <p className="text-xs text-orange-600">{currentProduct.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-700">{currentWeight.toFixed(3)}kg</p>
                    <p className="text-xs text-orange-600">¥{(currentProduct.retailPrice * currentWeight).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 购物车列表 */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <p className="text-4xl mb-4">🛒</p>
                  <p>购物车是空的</p>
                  <p className="text-sm mt-1">扫描条码添加商品</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.product.id} className={`flex gap-3 rounded-lg p-3 ${!item.product.isStandard ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{item.product.name}</p>
                          {!item.product.isStandard && (
                            <span className="text-xs bg-orange-500 text-white px-1 rounded">称重</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          ¥{item.product.retailPrice.toFixed(2)} × {item.product.isStandard ? item.quantity : `${item.quantity.toFixed(3)}kg`}
                        </p>
                        {!item.product.isStandard && (
                          <p className="text-xs text-orange-600 mt-1">
                            实时重量: {item.quantity.toFixed(3)}kg | 金额: ¥{(item.product.retailPrice * item.quantity).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">¥{(item.product.retailPrice * item.quantity).toFixed(2)}</p>
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - (item.product.isStandard ? 1 : 0.1))}
                            className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-xs"
                          >
                            -
                          </button>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + (item.product.isStandard ? 1 : 0.1))}
                            className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-xs"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="w-6 h-6 rounded bg-red-100 hover:bg-red-200 text-red-600 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 优惠明细 */}
            {(totals.clearanceDiscount > 0 || totals.memberDiscount > 0) && (
              <div className="px-4 py-2 bg-green-50 text-sm">
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
            <div className="p-4 border-t">
              <div className="flex justify-between items-center mb-4">
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
        </main>
      </div>

      {/* 底部 */}
      <div className="bg-black/30 text-center py-3">
        <p className="text-blue-200/60 text-sm">
          {hasItems ? '收银完成请出示付款码' : '如有疑问请联系店员'}
        </p>
      </div>

      {/* 设备状态面板 */}
      {showDevicePanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[500px] max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">收银设备管理</h3>
              <button onClick={() => setShowDevicePanel(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="p-4 space-y-4">
              {/* 客显屏 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📺</span>
                  <div>
                    <p className="font-medium">客显屏</p>
                    <p className="text-xs text-gray-500">{deviceManager.customerDisplay.isConnected ? '已连接' : '未连接'}</p>
                  </div>
                </div>
                <button
                  onClick={handleOpenCustomerDisplay}
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200"
                >
                  测试
                </button>
              </div>

              {/* 小票打印机 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🖨️</span>
                  <div>
                    <p className="font-medium">小票打印机</p>
                    <p className="text-xs text-gray-500">{deviceManager.printer.isConnected ? '已连接' : '未连接'}</p>
                  </div>
                </div>
                <button
                  onClick={() => deviceManager.receiptPrinter.printReceipt({ orderNo: 'TEST001', storeName: currentStore?.name || '门店', items: [], total: 0, payMethod: 'cash' })}
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200"
                >
                  测试
                </button>
              </div>

              {/* 标签打印机 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏷️</span>
                  <div>
                    <p className="font-medium">标签打印机</p>
                    <p className="text-xs text-gray-500">{deviceManager.labelPrinter.isConnected ? '已连接' : '未连接'}</p>
                  </div>
                </div>
                <button
                  onClick={() => deviceManager.labelPrinter.printLabel({ barcode: '1234567890123', name: '测试商品', price: 9.99 })}
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200"
                >
                  测试
                </button>
              </div>

              {/* 钱箱 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="font-medium">钱箱</p>
                    <p className="text-xs text-gray-500">{deviceManager.cashDrawer.isConnected ? '已连接' : '未连接'}</p>
                  </div>
                </div>
                <button
                  onClick={handleOpenDrawer}
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200"
                >
                  打开
                </button>
              </div>

              {/* 电子秤 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚖️</span>
                  <div>
                    <p className="font-medium">电子秤</p>
                    <p className="text-xs text-gray-500">{deviceManager.scale.isConnected ? '已连接' : '未连接'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentWeight(Math.random() * 2 + 0.5)}
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200"
                >
                  模拟读数
                </button>
              </div>

              {/* 扫码枪 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📷</span>
                  <div>
                    <p className="font-medium">扫码枪/摄像头</p>
                    <p className="text-xs text-gray-500">就绪</p>
                  </div>
                </div>
                <button
                  onClick={() => barcodeInputRef.current?.focus()}
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200"
                >
                  聚焦输入
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 挂单取单弹窗 */}
      {showSuspendedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[500px] max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">挂单/取单</h3>
              <button onClick={() => setShowSuspendedModal(false)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="p-4">
              {suspendedOrders.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <p className="text-4xl mb-4">📋</p>
                  <p>暂无挂单</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {suspendedOrders.map(order => (
                    <button
                      key={order.id}
                      onClick={() => handleResumeOrder(order.id)}
                      className="w-full p-3 bg-gray-50 rounded-lg text-left hover:bg-gray-100"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{order.orderNo}</span>
                        <span className="text-red-600">¥{order.finalAmount.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {order.items.length}件商品 | {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 会员识别弹窗 */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-96 p-6">
            <h3 className="text-lg font-semibold mb-4">会员识别</h3>
            <input
              type="text"
              placeholder="输入手机号或会员卡号"
              value={memberPhone}
              onChange={(e) => { setMemberPhone(e.target.value); setMemberError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleMemberSearch()}
              className="w-full px-4 py-3 border rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {memberError && (
              <p className="text-red-500 text-sm mb-4">{memberError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowMemberModal(false)}
                className="flex-1 py-2 bg-gray-100 rounded-xl"
              >
                取消
              </button>
              <button
                onClick={handleMemberSearch}
                className="flex-1 py-2 bg-blue-500 text-white rounded-xl"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

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
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition ${
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
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-green-600">支付成功</h3>
            <p className="text-gray-500 mt-2 text-2xl font-bold">¥{totals.total.toFixed(2)}</p>
            <p className="text-sm text-gray-400 mt-1">{selectedPay === 'cash' ? '现金' : selectedPay === 'wechat' ? '微信' : selectedPay === 'alipay' ? '支付宝' : selectedPay === 'member' ? '会员卡' : selectedPay}</p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={async () => {
                  try {
                    await deviceManager.receiptPrinter.printReceipt({
                      orderNo: `ORD${Date.now()}`,
                      storeName: currentStore?.name || '门店',
                      items: items.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.product.retailPrice })),
                      total: totals.total,
                      payMethod: selectedPay as 'cash' | 'wechat' | 'alipay' | 'unionpay' | 'member',
                    });
                  } catch (e) {
                    console.error('打印失败', e);
                  }
                }}
                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
              >
                🧾 打印小票
              </button>
              <button
                onClick={() => {
                  deviceManager.customerDisplay.showPaid(totals.total);
                  if (selectedPay === 'cash') {
                    deviceManager.cashDrawer.open();
                  }
                }}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
