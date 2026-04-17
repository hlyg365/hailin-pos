import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore, useProductStore, useMemberStore, useOrderStore, useFinanceStore, useOfflineStore } from '../store';
import type { Product } from '../types';

// AI条码识别模拟
const aiBarcodeLookup = async (barcode: string): Promise<{ success: boolean; product?: Product; candidates?: Product[] }> => {
  await new Promise(r => setTimeout(r, 300));
  const products = useProductStore.getState().products;
  const exact = products.find(p => p.barcode === barcode);
  if (exact) return { success: true, product: exact };
  
  // 模拟模糊匹配
  const similar = products.filter(p => p.barcode.includes(barcode.slice(-6)));
  return { success: false, candidates: similar.slice(0, 3) };
};

// AI视觉识别模拟
const aiVisionRecognize = async (): Promise<{ name: string; confidence: number; estimatedWeight?: number }[]> => {
  await new Promise(r => setTimeout(r, 500));
  return [
    { name: '红富士苹果', confidence: 0.95, estimatedWeight: 0.8 },
    { name: '黄元帅苹果', confidence: 0.72, estimatedWeight: 0.75 },
    { name: '嘎啦苹果', confidence: 0.58, estimatedWeight: 0.7 },
  ];
};

// 检查清货模式
const isClearanceMode = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 20 && hour < 23;
};

export default function CashierPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberPhone, setMemberPhone] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiMode, setAiMode] = useState<'barcode' | 'vision'>('barcode');
  const [aiInput, setAiInput] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPay, setSelectedPay] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { items, addItem, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const { products } = useProductStore();
  const { currentMember, scanMember, members } = useMemberStore();
  const { createOrder, suspendOrder } = useOrderStore();
  const { addSales } = useFinanceStore();
  const { isOnline } = useOfflineStore();

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

  // 处理扫码
  const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && aiInput) {
      setAiResult({ barcode: aiInput, loading: true });
      aiBarcodeLookup(aiInput).then(result => {
        setAiResult({ ...result, loading: false });
      });
    }
  };

  // 处理AI视觉识别
  const handleVisionRecognize = async () => {
    setAiResult({ loading: true, candidates: [] });
    const results = await aiVisionRecognize();
    setAiResult({ candidates: results, loading: false });
  };

  // 添加商品
  const handleAddProduct = (product: Product, quantity: number = 1) => {
    addItem(product, quantity);
  };

  // 会员识别
  const handleMemberScan = () => {
    const member = scanMember(memberPhone);
    if (member) {
      setShowMemberModal(false);
      setMemberPhone('');
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
    
    await new Promise(r => setTimeout(r, 1000));
    
    const payMethod = selectedPay === 'cash' ? 'cash' : 
                      selectedPay === 'wechat' ? 'wechat' :
                      selectedPay === 'alipay' ? 'alipay' : 'member';
    
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
      payMethod,
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
          <h1 className="text-lg font-semibold">收银台</h1>
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
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧商品区 */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* 工具栏 */}
          <div className="flex items-center gap-3 mb-4">
            {/* AI功能按钮 */}
            <button
              onClick={() => { setAiMode('barcode'); setShowAIModal(true); setAiInput(''); setAiResult(null); }}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              AI识码
            </button>
            <button
              onClick={() => { setAiMode('vision'); setShowAIModal(true); setAiResult(null); handleVisionRecognize(); }}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              AI视觉
            </button>
            
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
                onChange={(e) => setMemberPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMemberScan()}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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

      {/* AI识别弹窗 */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[500px] p-6">
            <h3 className="text-lg font-semibold mb-4">
              {aiMode === 'barcode' ? 'AI 条码识别' : 'AI 视觉识别'}
            </h3>
            
            {aiMode === 'barcode' ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="输入或扫描条码"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={handleScan}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => aiInput && aiBarcodeLookup(aiInput).then(r => setAiResult({ ...r, loading: false }))}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg"
                  >
                    识别
                  </button>
                </div>
                
                {aiResult?.loading && (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-gray-500">AI识别中...</p>
                  </div>
                )}
                
                {aiResult?.product && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-medium text-green-800">识别成功</p>
                    <p className="text-green-600">{aiResult.product.name}</p>
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-500">零售价</span>
                      <span className="font-semibold">¥{aiResult.product.retailPrice}</span>
                    </div>
                    <button
                      onClick={() => { handleAddProduct(aiResult.product); setShowAIModal(false); }}
                      className="w-full mt-3 py-2 bg-green-600 text-white rounded-lg"
                    >
                      加入购物车
                    </button>
                  </div>
                )}
                
                {aiResult?.candidates && aiResult.candidates.length > 0 && !aiResult.product && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-medium text-yellow-800 mb-3">未找到精确匹配，以下是候选商品：</p>
                    <div className="space-y-2">
                      {aiResult.candidates.map((p: Product, i: number) => (
                        <div key={i} className="flex items-center justify-between bg-white p-2 rounded">
                          <span>{p.name}</span>
                          <button
                            onClick={() => handleAddProduct(p)}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            添加
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-gray-400 mt-2">将商品置于摄像头下</p>
                  </div>
                </div>
                
                <button
                  onClick={handleVisionRecognize}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg"
                >
                  开始识别
                </button>
                
                {aiResult?.loading && (
                  <div className="text-center py-4">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-gray-500">AI视觉识别中...</p>
                  </div>
                )}
                
                {aiResult?.candidates && aiResult.candidates.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-medium text-blue-800 mb-3">识别结果（置信度）：</p>
                    <div className="space-y-2">
                      {aiResult.candidates.map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between bg-white p-3 rounded-lg">
                          <div>
                            <span className="font-medium">{c.name}</span>
                            {i === 0 && <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded">最高</span>}
                            {c.estimatedWeight && <span className="ml-2 text-gray-500">约 {c.estimatedWeight}kg</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`font-semibold ${c.confidence > 0.9 ? 'text-green-600' : 'text-yellow-600'}`}>
                              {(c.confidence * 100).toFixed(0)}%
                            </span>
                            {i === 0 && (
                              <button
                                onClick={() => {
                                  const product = products.find(p => p.name === c.name);
                                  if (product && c.estimatedWeight) {
                                    handleAddProduct(product, c.estimatedWeight);
                                    setShowAIModal(false);
                                  }
                                }}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                添加
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={() => setShowAIModal(false)}
              className="w-full mt-4 py-2 border rounded-lg"
            >
              关闭
            </button>
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
    </div>
  );
}
