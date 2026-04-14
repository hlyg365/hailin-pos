'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Package, TrendingUp, TrendingDown, ArrowUpDown, AlertTriangle, Plus, Minus, X, Save, RefreshCw, History } from 'lucide-react';
import { posStore, Product, StockRecord } from '@/lib/pos-store';

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [records, setRecords] = useState<StockRecord[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<'stock' | 'records'>('stock');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'purchase' | 'sale' | 'adjust' | 'loss'>('purchase');
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const prods = await posStore.getProducts();
    setProducts(prods);
    const recs = await posStore.getStockRecords();
    setRecords(recs);
  };

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const filteredProducts = products.filter(p => 
    !searchKeyword || p.name.includes(searchKeyword) || p.barcode.includes(searchKeyword)
  );

  const totalStockValue = products.reduce((sum, p) => sum + p.cost * p.stock, 0);
  const totalSaleValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  const openAdjustModal = (product: Product, type: 'purchase' | 'sale' | 'adjust' | 'loss') => {
    setAdjustProduct(product);
    setAdjustType(type);
    setAdjustQuantity(0);
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const handleAdjust = async () => {
    if (!adjustProduct || adjustQuantity <= 0) {
      alert('请输入正确的数量');
      return;
    }

    if (adjustType === 'adjust' && !adjustReason) {
      alert('调整库存请填写原因');
      return;
    }

    await posStore.updateStock(
      adjustProduct.id, 
      adjustQuantity, 
      adjustType, 
      adjustReason || undefined
    );

    await loadData();
    setShowAdjustModal(false);
  };

  const getRecordTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase': return { label: '采购入库', color: 'text-green-600 bg-green-100' };
      case 'sale': return { label: '销售出库', color: 'text-blue-600 bg-blue-100' };
      case 'adjust': return { label: '库存调整', color: 'text-orange-600 bg-orange-100' };
      case 'loss': return { label: '损耗登记', color: 'text-red-600 bg-red-100' };
      default: return { label: type, color: 'text-slate-600 bg-slate-100' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 顶部 */}
      <header className="bg-white px-4 py-3 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.push('/pos/cashier')} className="flex items-center gap-1 text-slate-600 hover:text-orange-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-lg">库存管理</h1>
      </header>

      {/* 统计卡片 */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp className="w-4 h-4" /> 库存成本
          </div>
          <p className="text-xl font-bold text-slate-800">¥{totalStockValue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Package className="w-4 h-4" /> 库存价值
          </div>
          <p className="text-xl font-bold text-orange-500">¥{totalSaleValue.toFixed(2)}</p>
        </div>
      </div>

      {/* 低库存预警 */}
      {lowStockProducts.length > 0 && (
        <div className="px-4 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="flex items-center gap-2 text-red-600 font-medium mb-2">
              <AlertTriangle className="w-4 h-4" /> 低库存预警 ({lowStockProducts.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.slice(0, 5).map(p => (
                <span key={p.id} className="text-sm bg-white px-2 py-1 rounded text-red-600">
                  {p.name}: {p.stock}{p.unit}
                </span>
              ))}
              {lowStockProducts.length > 5 && (
                <span className="text-sm text-red-500">等{lowStockProducts.length}个商品</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab切换 */}
      <div className="px-4 flex gap-2">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'stock' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600'}`}
        >
          库存列表
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'records' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600'}`}
        >
          变动记录
        </button>
      </div>

      {activeTab === 'stock' ? (
        <>
          {/* 搜索 */}
          <div className="p-4">
            <div className="bg-white rounded-xl p-3 flex gap-2">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索商品..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="flex-1 outline-none"
              />
            </div>
          </div>

          {/* 商品列表 */}
          <div className="px-4 pb-4 space-y-2">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{product.name}</p>
                      {product.stock <= product.minStock && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{product.barcode} · {product.category}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className={product.stock <= product.minStock ? 'text-red-500' : 'text-slate-600'}>
                        库存: {product.stock}{product.unit}
                      </span>
                      <span className="text-slate-400">
                        成本: ¥{product.cost.toFixed(2)}
                      </span>
                      <span className="text-orange-500">
                        售价: ¥{product.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => openAdjustModal(product, 'purchase')}
                      className="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100" title="采购入库"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openAdjustModal(product, 'adjust')}
                      className="p-2 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100" title="调整库存"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openAdjustModal(product, 'loss')}
                      className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100" title="损耗登记"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* 变动记录 */
        <div className="px-4 pb-4 space-y-2">
          {records.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无变动记录</p>
            </div>
          ) : (
            records.map(record => {
              const typeInfo = getRecordTypeLabel(record.type);
              return (
                <div key={record.id} className="bg-white rounded-xl p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    record.type === 'purchase' ? 'bg-green-100' :
                    record.type === 'sale' ? 'bg-blue-100' :
                    record.type === 'adjust' ? 'bg-orange-100' : 'bg-red-100'
                  }`}>
                    {record.type === 'purchase' ? <TrendingUp className="w-5 h-5 text-green-600" /> :
                     record.type === 'sale' ? <TrendingDown className="w-5 h-5 text-blue-600" /> :
                     <ArrowUpDown className="w-5 h-5 text-orange-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{record.productName}</p>
                    <p className="text-sm text-slate-500">
                      {record.beforeStock} → {record.afterStock} · {record.reason || typeInfo.label}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-sm ${typeInfo.color}`}>
                      {record.quantity > 0 ? '+' : ''}{record.quantity}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(record.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 库存调整弹窗 */}
      {showAdjustModal && adjustProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="bg-orange-500 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold">库存操作</h3>
              <button onClick={() => setShowAdjustModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="font-medium">{adjustProduct.name}</p>
                <p className="text-sm text-slate-500">当前库存: {adjustProduct.stock}{adjustProduct.unit}</p>
              </div>

              <div className="flex gap-2">
                {(['purchase', 'sale', 'adjust', 'loss'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setAdjustType(type)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      adjustType === type 
                        ? type === 'purchase' ? 'bg-green-500 text-white' :
                          type === 'sale' ? 'bg-blue-500 text-white' :
                          type === 'adjust' ? 'bg-orange-500 text-white' :
                          'bg-red-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {type === 'purchase' ? '入库' : type === 'sale' ? '出库' : type === 'adjust' ? '调整' : '损耗'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">数量</label>
                <input
                  type="number"
                  value={adjustQuantity || ''}
                  onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2 text-lg"
                  min="0"
                />
              </div>

              {(adjustType === 'adjust' || adjustType === 'loss') && (
                <div>
                  <label className="block text-sm text-slate-600 mb-1">原因</label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2"
                    placeholder="输入原因"
                  />
                </div>
              )}

              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-600">操作后库存</p>
                <p className="text-xl font-bold">
                  {adjustType === 'purchase' ? adjustProduct.stock + adjustQuantity :
                   adjustType === 'sale' ? adjustProduct.stock - adjustQuantity :
                   adjustQuantity}
                  {adjustProduct.unit}
                </p>
              </div>

              <button 
                onClick={handleAdjust}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" /> 确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
