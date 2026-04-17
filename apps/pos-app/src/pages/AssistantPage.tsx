import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useStoreStore, useFinanceStore, useRestockStore, useAlertStore, useProductStore, useCartStore, useOrderStore, useMemberStore, useOfflineStore } from '../store';
import type { Product } from '../types';

// AI条码查询模拟函数
const aiBarcodeLookup = async (barcode: string): Promise<{ success: boolean; product?: Product; candidates?: Product[] }> => {
  // 模拟AI查询
  await new Promise(resolve => setTimeout(resolve, 300));
  return { success: false };
};

// 收银台组件
function MobileCashierTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberPhone, setMemberPhone] = useState('');
  const [memberError, setMemberError] = useState('');
  const [selectedPay, setSelectedPay] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [aiScanResult, setAiScanResult] = useState<{ barcode?: string; loading?: boolean; success?: boolean; product?: Product }>({});
  const [currentWeight, setCurrentWeight] = useState(0);

  const { items, addItem, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const { products, checkInventory, deductInventory } = useProductStore();
  const { currentStore } = useStoreStore();
  const { currentMember, scanMember, members } = useMemberStore();
  const { createOrder } = useOrderStore();
  const { addSales } = useFinanceStore();
  const { isOnline } = useOfflineStore();

  // 清货模式检查
  const isClearanceMode = () => {
    const hour = new Date().getHours();
    return hour >= 20 && hour < 23;
  };

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

  // 添加商品
  const handleAddProduct = (product: Product, quantity: number = 1) => {
    const storeId = currentStore?.id || 'store001';
    const existing = items.find(i => i.product.id === product.id);
    const currentCartQty = existing?.quantity || 0;
    const totalRequired = currentCartQty + quantity;
    
    const { available, currentQty } = checkInventory(storeId, product.id, totalRequired);
    if (!available) {
      alert(`库存不足！当前库存: ${currentQty}`);
      return;
    }
    addItem(product, quantity);
  };

  // 扫码识别
  const handleScan = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    setAiScanResult({ barcode, loading: true });
    const result = await aiBarcodeLookup(barcode);
    if (result.success && result.product) {
      addItem(result.product, 1);
    }
    setAiScanResult({ ...result, loading: false });
  }, [addItem]);

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

  // 支付
  const handlePay = async () => {
    if (!selectedPay || items.length === 0) return;
    setIsProcessing(true);
    
    const storeId = currentStore?.id || 'store001';
    
    // 扣减库存
    for (const item of items) {
      deductInventory(storeId, item.product.id, item.quantity);
    }
    
    // 创建订单
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
      payMethod: selectedPay as 'wechat' | 'alipay' | 'unionpay' | 'cash' | 'member',
      payStatus: 'paid' as const,
      status: 'completed' as const,
      cashierId: 'emp001',
      createdAt: new Date().toISOString(),
    };
    
    createOrder(order);
    addSales(totals.total, selectedPay === 'cash' ? 'cash' : 'online');
    
    // 模拟支付延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsProcessing(false);
    setShowPayModal(false);
    setShowSuccess(true);
    clearCart();
    
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  const clearanceMode = isClearanceMode();

  return (
    <div className="space-y-3">
      {/* 清货模式提示 */}
      {clearanceMode && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg text-center text-sm font-medium">
          清货模式 · 全场8折
        </div>
      )}

      {/* 搜索栏 */}
      <div className="bg-white rounded-xl p-3 shadow-sm">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="搜索商品或扫码"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-100 rounded-lg text-sm"
            />
            <svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={() => setShowMemberModal(true)}
            className="px-4 py-2.5 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium"
          >
            会员
          </button>
        </div>
        
        {/* 分类导航 */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap text-sm ${
                activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {cat === 'all' ? '全部' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 商品网格 */}
      <div className="bg-white rounded-xl p-3 shadow-sm">
        <div className="grid grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto">
          {filteredProducts.slice(0, 15).map(product => (
            <button
              key={product.id}
              onClick={() => handleAddProduct(product)}
              className="bg-gray-50 rounded-lg p-2 text-center hover:bg-gray-100 active:bg-gray-200"
            >
              <div className="w-12 h-12 mx-auto bg-gray-200 rounded-lg flex items-center justify-center mb-1">
                <span className="text-xl">📦</span>
              </div>
              <p className="text-xs font-medium truncate">{product.name}</p>
              <p className="text-sm text-red-600 font-bold">¥{product.retailPrice}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 购物车 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="font-semibold">购物车 ({items.length})</span>
          {items.length > 0 && (
            <button onClick={clearCart} className="text-sm text-red-500">清空</button>
          )}
        </div>
        <div className="max-h-[20vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <p className="text-4xl mb-2">🛒</p>
              <p className="text-sm">点击商品添加到购物车</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map(item => (
                <div key={item.product.id} className="p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <p className="text-red-600 text-sm">¥{item.product.retailPrice}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full bg-gray-100 text-lg"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full bg-gray-100 text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 结算栏 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {currentMember && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 rounded-lg">
            <span className="text-blue-600">👤</span>
            <span className="text-sm text-blue-600">{currentMember.name} ({currentMember.level})</span>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-500">应付金额</span>
          <span className="text-2xl font-bold text-red-600">¥{totals.total.toFixed(2)}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={clearCart}
            disabled={items.length === 0}
            className="py-3 bg-gray-100 text-gray-700 rounded-lg text-sm disabled:opacity-50"
          >
            清空
          </button>
          <button
            onClick={() => setShowPayModal(true)}
            disabled={items.length === 0}
            className="py-3 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            收款 ¥{totals.total.toFixed(2)}
          </button>
        </div>
      </div>

      {/* 会员识别弹窗 */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full p-6">
            <h3 className="text-lg font-semibold mb-4">会员识别</h3>
            <input
              type="text"
              placeholder="输入手机号"
              value={memberPhone}
              onChange={(e) => { setMemberPhone(e.target.value); setMemberError(''); }}
              className="w-full px-4 py-3 border rounded-lg mb-3"
            />
            {memberError && <p className="text-red-500 text-sm mb-3">{memberError}</p>}
            <div className="text-sm text-gray-500 mb-4">
              <p className="mb-2">快速识别：</p>
              <div className="flex gap-2">
                {members.slice(0, 3).map(m => (
                  <button
                    key={m.id}
                    onClick={() => { scanMember(m.phone); setShowMemberModal(false); }}
                    className="px-4 py-2 bg-gray-100 rounded-full text-sm"
                  >
                    {m.phone.slice(-4)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowMemberModal(false); setMemberPhone(''); }}
                className="flex-1 py-3 border rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleMemberScan}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 支付弹窗 */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">选择支付方式</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { id: 'wechat', name: '微信支付', icon: '💳', color: 'bg-green-500' },
                { id: 'alipay', name: '支付宝', icon: '💰', color: 'bg-blue-500' },
                { id: 'cash', name: '现金', icon: '💵', color: 'bg-yellow-500' },
                { id: 'member', name: '会员卡', icon: '👤', color: 'bg-purple-500' },
              ].map(pay => (
                <button
                  key={pay.id}
                  onClick={() => setSelectedPay(pay.id)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center ${
                    selectedPay === pay.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <span className={`w-12 h-12 ${pay.color} rounded-full flex items-center justify-center text-2xl mb-2`}>
                    {pay.icon}
                  </span>
                  <span className="text-sm font-medium">{pay.name}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPayModal(false)}
                className="flex-1 py-3 border rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handlePay}
                disabled={!selectedPay || isProcessing}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg disabled:opacity-50"
              >
                {isProcessing ? '处理中...' : `确认收款 ¥${totals.total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 支付成功 */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-64 p-8 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-green-600">支付成功</h3>
            <p className="text-gray-500 mt-2">¥{totals.total.toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

type Tab = 'dashboard' | 'inventory' | 'restock' | 'deposit' | 'report';

export default function AssistantPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { currentStore } = useStoreStore();
  const { todaySales, todayOrders, todayCash, depositPending } = useFinanceStore();
  const { requests } = useRestockStore();
  const { lowStockAlerts, overdueAlerts } = useAlertStore();
  const { products } = useProductStore();

  const storeRequests = requests.filter(r => r.storeId === 'store001');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: '首页', icon: '📊' },
    { id: 'cashier', label: '收银', icon: '💰' },
    { id: 'inventory', label: '库存', icon: '📦' },
    { id: 'restock', label: '要货', icon: '🚚' },
    { id: 'deposit', label: '缴款', icon: '🏦' },
    { id: 'report', label: '报表', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部 */}
      <header className="bg-blue-600 text-white">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-white/80">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="font-semibold">店长助手</h1>
                <p className="text-sm text-blue-100">{currentStore?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">📍 {currentStore?.region}</span>
            </div>
          </div>
        </div>
        
        {/* 标签栏 */}
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 flex items-center justify-center gap-1 text-sm ${
                activeTab === tab.id ? 'bg-white/20 border-b-2 border-white' : 'text-blue-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* 内容区 */}
      <div className="p-4 pb-20">
        {/* 首页仪表盘 */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* 今日统计 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">今日销售</p>
                <p className="text-2xl font-bold text-green-600 mt-1">¥{todaySales.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">订单 {todayOrders}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">待缴款</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">¥{depositPending.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">现金收款</p>
              </div>
            </div>

            {/* 待办事项 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3">待办事项</h3>
              <div className="space-y-3">
                {lowStockAlerts.slice(0, 3).map((alert, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📦</span>
                      <div>
                        <p className="font-medium">{alert.productName} 库存不足</p>
                        <p className="text-sm text-gray-500">当前 {alert.current} / 预警 {alert.threshold}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('restock')}
                      className="px-3 py-1 bg-yellow-500 text-white text-sm rounded"
                    >
                      要货
                    </button>
                  </div>
                ))}
                
                {overdueAlerts.map((alert, i) => (
                  <div key={`o-${i}`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⏰</span>
                      <div>
                        <p className="font-medium">{alert.productName} 临期预警</p>
                        <p className="text-sm text-gray-500">剩余 {alert.daysLeft} 天</p>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-red-500 text-white text-sm rounded">
                      处理
                    </button>
                  </div>
                ))}

                {storeRequests.filter(r => r.status === 'pending').length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🚚</span>
                      <div>
                        <p className="font-medium">要货单待审核</p>
                        <p className="text-sm text-gray-500">{storeRequests.filter(r => r.status === 'pending').length} 单</p>
                      </div>
                    </div>
                    <Link to="/dashboard" className="px-3 py-1 bg-blue-500 text-white text-sm rounded">
                      查看
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* 快捷功能 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3">快捷功能</h3>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { icon: '💰', label: '快速收银', action: () => setActiveTab('cashier') },
                  { icon: '📦', label: '库存查询', action: () => setActiveTab('inventory') },
                  { icon: '🚚', label: '我要要货', action: () => setActiveTab('restock') },
                  { icon: '📊', label: '销售报表', action: () => setActiveTab('report') },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-2xl mb-1">{item.icon}</span>
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 快速收银 */}
        {activeTab === 'cashier' && (
          <MobileCashierTab />
        )}

        {/* 库存管理 */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">库存概览</h3>
                <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded">
                  盘点
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">85%</p>
                  <p className="text-sm text-gray-500">正常</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">12%</p>
                  <p className="text-sm text-gray-500">预警</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">3%</p>
                  <p className="text-sm text-gray-500">临期</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <input
                  type="text"
                  placeholder="搜索商品"
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg"
                />
              </div>
              <div className="divide-y">
                {products.slice(0, 8).map((product, i) => (
                  <div key={product.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span>📦</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">库存 {Math.floor(Math.random() * 100 + 20)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${Math.random() > 0.3 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.random() > 0.3 ? '充足' : '不足'}
                      </p>
                      <p className="text-xs text-gray-400">预警: 30</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 要货申请 */}
        {activeTab === 'restock' && (
          <div className="space-y-4">
            {/* 快捷要货 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3">快捷要货</h3>
              <p className="text-sm text-gray-500 mb-4">选择要补货的商品并填写数量</p>
              <div className="space-y-3">
                {lowStockAlerts.map((stockAlert, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium">{stockAlert.productName}</p>
                      <p className="text-sm text-gray-500">建议补货 {stockAlert.threshold - stockAlert.current}</p>
                    </div>
                    <button
                      className="px-4 py-2 bg-yellow-500 text-white text-sm rounded"
                      onClick={() => window.alert('要货申请已提交')}
                    >
                      一键要货
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 要货记录 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3">要货记录</h3>
              <div className="space-y-3">
                {storeRequests.map(req => (
                  <div key={req.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm">{req.orderNo || req.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        req.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                        req.status === 'approved' ? 'bg-blue-100 text-blue-600' :
                        req.status === 'shipped' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {req.status === 'pending' ? '待审核' :
                         req.status === 'approved' ? '已审核' :
                         req.status === 'shipped' ? '已发货' : '已拒绝'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{req.items.length}种商品 · ¥{req.totalAmount}</p>
                    <p className="text-xs text-gray-400 mt-1">{req.requestedAt}</p>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full py-4 bg-blue-500 text-white rounded-xl font-medium">
              + 新建要货单
            </button>
          </div>
        )}

        {/* 缴款 */}
        {activeTab === 'deposit' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-5 text-white">
              <p className="text-sm opacity-80">待缴金额</p>
              <p className="text-3xl font-bold mt-1">¥{depositPending.toLocaleString()}</p>
              <p className="text-sm opacity-80 mt-2">今日现金收款累计</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-4">缴款方式</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  <span className="text-2xl">🏦</span>
                  <div className="text-left flex-1">
                    <p className="font-medium">银行转账</p>
                    <p className="text-sm text-gray-500">转账至总公司账户</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button className="w-full flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  <span className="text-2xl">💵</span>
                  <div className="text-left flex-1">
                    <p className="font-medium">现金存款</p>
                    <p className="text-sm text-gray-500">至银行柜台存款</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3">缴款记录</h3>
              <div className="space-y-3">
                {[
                  { date: '2024-01-16', amount: 8500, status: 'confirmed' },
                  { date: '2024-01-15', amount: 9200, status: 'confirmed' },
                  { date: '2024-01-14', amount: 7800, status: 'confirmed' },
                ].map((deposit, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">¥{deposit.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{deposit.date}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                      已确认
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 报表 */}
        {activeTab === 'report' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-4">销售趋势</h3>
              <div className="h-40 flex items-end justify-between gap-2">
                {[65, 80, 45, 90, 75, 85, 95].map((value, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${value}%` }}
                    ></div>
                    <span className="text-xs text-gray-400 mt-1">{['一', '二', '三', '四', '五', '六', '日'][i]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-4">销售统计</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">今日销售</span>
                  <span className="font-semibold">¥{todaySales.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">昨日销售</span>
                  <span className="font-semibold">¥{(todaySales * 0.9).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">本周累计</span>
                  <span className="font-semibold">¥{(todaySales * 7).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">本月累计</span>
                  <span className="font-semibold">¥{(todaySales * 30).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-4">热销商品 TOP5</h3>
              <div className="space-y-3">
                {[
                  { name: '农夫山泉550ml', sales: 156, amount: 312 },
                  { name: '可口可乐330ml', sales: 128, amount: 384 },
                  { name: '康师傅方便面', sales: 95, amount: 427.5 },
                  { name: '双汇火腿肠', sales: 78, amount: 390 },
                  { name: '奥利奥饼干', sales: 65, amount: 552.5 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-yellow-100 text-yellow-600' :
                      i === 1 ? 'bg-gray-100 text-gray-600' :
                      i === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.sales}件</p>
                    </div>
                    <span className="text-red-600 font-semibold">¥{item.amount.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
