import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore, useProductStore, useMemberStore, useOrderStore, useFinanceStore, useOfflineStore, useStoreStore } from '../store';
import type { Product } from '../types';

// 检查清货模式
const isClearanceMode = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 20 && hour < 23;
};

// 模块类型
type StoreModule = 'cashier' | 'inventory' | 'products' | 'orders' | 'reports' | 'promo' | 'members' | 'settings';

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
  
  // 门店模块配置
  const storeModules: { id: StoreModule; label: string; icon: string }[] = [
    { id: 'cashier', label: '收银', icon: '💰' },
    { id: 'inventory', label: '库存', icon: '📦' },
    { id: 'products', label: '商品', icon: '🏷️' },
    { id: 'orders', label: '订单', icon: '🧾' },
    { id: 'reports', label: '报表', icon: '📊' },
    { id: 'promo', label: '促销', icon: '🎁' },
    { id: 'members', label: '会员', icon: '👥' },
    { id: 'settings', label: '设置', icon: '⚙️' },
  ];

  const { items, addItem, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const { products, checkInventory, deductInventory } = useProductStore();
  const { currentStore } = useStoreStore();
  const { currentMember, scanMember, members } = useMemberStore();
  const { createOrder, suspendOrder } = useOrderStore();
  const { addSales } = useFinanceStore();
  const { isOnline } = useOfflineStore();

  // AI 服务状态检查
  useEffect(() => {
    const checkAIService = async () => {
      setAiServiceStatus('checking');
      const available = await aiService.checkHealth();
      setAiServiceStatus(available ? 'online' : 'offline');
    };
    
    checkAIService();
    const interval = setInterval(checkAIService, 30000); // 每30秒检查一次
    
    return () => clearInterval(interval);
  }, []);

  // 启动秤监听（模拟模式）
  useEffect(() => {
    const controller = new VisionScaleController({
      aiServiceUrl: AI_SERVICE_URL,
      autoCapture: true,
    });

    const startScale = async () => {
      await controller.start((result, weight) => {
        if (result.status === 'success' && result.product) {
          const matched = products.find(p => p.name === result.product);
          if (matched) {
            handleAddProduct(matched, weight);
          }
        }
      });
      setScaleStatus('listening');
    };

    // 模拟模式
    scaleService.startListeningSimulate((reading) => {
      setCurrentWeight(reading.weight);
      if (reading.weight > 0.01) {
        setScaleStatus('triggered');
        // 自动触发识别
        handleVisionRecognize();
      }
    });

    return () => {
      scaleService.stopListening();
      controller.stop();
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
        <aside className="w-56 bg-gray-800 text-white flex flex-col overflow-y-auto">
          {/* 侧边栏头部 */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏪</span>
              <div>
                <p className="font-semibold text-sm">{currentStore?.name || '门店'}</p>
                <p className="text-xs text-gray-400">{currentStore?.code || 'WJ001'}</p>
              </div>
            </div>
          </div>
          
          {/* 模块导航 */}
          <nav className="flex-1 p-2">
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2">功能模块</p>
              {storeModules.map(mod => (
                <button
                  key={mod.id}
                  onClick={() => setActiveModule(mod.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                    activeModule === mod.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{mod.icon}</span>
                  <span className="text-sm font-medium">{mod.label}</span>
                </button>
              ))}
            </div>
          </nav>
          
          {/* 侧边栏底部 */}
          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-500">
              <p>版本：V6.0</p>
              <p className="mt-1">© 2024 海邻到家</p>
            </div>
          </div>
        </aside>
        
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
          <div className="flex-1 flex overflow-hidden">
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
                <div key={item.product.id} className="flex items-center gap-3 p-3 border-b">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product.name}</p>
                    <p className="text-red-600 text-sm">¥{item.product.retailPrice.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
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
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSuspend}
                disabled={items.length === 0}
                className="py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                挂单
              </button>
              <button
                onClick={() => setShowPayModal(true)}
                disabled={items.length === 0}
                className="py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                收款
              </button>
            </div>
          </div>
        </div>
      </div>

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
              <button className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200">
                清空本地数据
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}
