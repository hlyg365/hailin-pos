'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Package, 
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  RefreshCw
} from 'lucide-react';
import { posStore, Product } from '@/lib/pos-store';

interface PurchaseRequest {
  id: string;
  requestNo: string;
  products: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
  }>;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'shipped' | 'received';
  createdAt: number;
  updatedAt: number;
  notes?: string;
}

const statusMap = {
  pending: { label: '待审批', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { label: '已批准', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700', icon: XCircle },
  shipped: { label: '已发货', color: 'bg-purple-100 text-purple-700', icon: Truck },
  received: { label: '已收货', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

export default function PurchasePage() {
  const router = useRouter();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Array<{
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
  }>>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 加载采购申请
      const stored = localStorage.getItem('purchase_requests');
      if (stored) {
        setRequests(JSON.parse(stored));
      }
      // 加载商品
      const prods = await posStore.getProducts();
      setProducts(prods);
    } catch (e) {
      console.error('加载数据失败', e);
    }
  };

  const saveRequests = (newRequests: PurchaseRequest[]) => {
    localStorage.setItem('purchase_requests', JSON.stringify(newRequests));
    setRequests(newRequests);
  };

  const createRequest = async () => {
    if (selectedProducts.length === 0) {
      alert('请选择商品');
      return;
    }

    setLoading(true);
    
    const totalAmount = selectedProducts.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product?.price || 0) * item.quantity;
    }, 0);

    const newRequest: PurchaseRequest = {
      id: 'pr_' + Date.now(),
      requestNo: 'PR' + Date.now().toString().slice(-10),
      products: selectedProducts,
      totalAmount,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      notes
    };

    saveRequests([newRequest, ...requests]);
    setShowCreate(false);
    setSelectedProducts([]);
    setNotes('');
    setLoading(false);
    
    // 模拟发送到总部
    alert('采购申请已提交，等待总部审批');
  };

  const addProduct = (product: Product) => {
    const existing = selectedProducts.find(p => p.productId === product.id);
    if (existing) {
      setSelectedProducts(selectedProducts.map(p => 
        p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unit: product.unit || '件'
      }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.productId === productId 
        ? { ...p, quantity: Math.max(1, p.quantity + delta) }
        : p
    ));
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
  };

  const filteredProducts = products.filter(p => 
    !searchKeyword || 
    p.name.includes(searchKeyword) || 
    p.barcode.includes(searchKeyword)
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 头部 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/pos')} className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-800">采购申请</h1>
          </div>
          <button 
            onClick={() => setShowCreate(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600"
          >
            <Plus className="w-5 h-5" />
            新建申请
          </button>
        </div>
      </header>

      <main className="p-4">
        {/* 申请列表 */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">暂无采购申请</p>
              <p className="text-sm">点击右上角「新建申请」向总部提交要货</p>
            </div>
          ) : (
            requests.map(request => {
              const Status = statusMap[request.status];
              return (
                <div key={request.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-slate-800">{request.requestNo}</p>
                      <p className="text-sm text-slate-500">{formatDate(request.createdAt)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${Status.color}`}>
                      <Status.icon className="w-4 h-4" />
                      {Status.label}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    {request.products.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-slate-600">{item.productName}</span>
                        <span className="text-slate-800">× {item.quantity} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <span className="text-orange-500 font-bold">合计: ¥{request.totalAmount.toFixed(2)}</span>
                    {request.notes && (
                      <span className="text-sm text-slate-500">备注: {request.notes}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* 新建申请弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-t-3xl sm:rounded-2xl">
            <div className="bg-orange-500 text-white px-4 py-3 flex items-center justify-between">
              <h2 className="font-bold text-lg">新建采购申请</h2>
              <button onClick={() => setShowCreate(false)}><XCircle className="w-6 h-6" /></button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* 搜索商品 */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="搜索商品..." 
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl"
                />
              </div>
              
              {/* 商品列表 */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {filteredProducts.slice(0, 10).map(product => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-orange-50 text-left"
                  >
                    <Package className="w-8 h-8 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-orange-500">¥{product.price.toFixed(2)}</p>
                    </div>
                    <Plus className="w-5 h-5 text-slate-400" />
                  </button>
                ))}
              </div>
              
              {/* 已选商品 */}
              {selectedProducts.length > 0 && (
                <div className="border-t border-slate-200 pt-4">
                  <p className="font-bold text-slate-800 mb-2">已选商品 ({selectedProducts.length})</p>
                  <div className="space-y-2">
                    {selectedProducts.map(item => (
                      <div key={item.productId} className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg">
                        <span className="flex-1 text-sm">{item.productName}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.productId, -1)} className="w-7 h-7 bg-white rounded flex items-center justify-center">-</button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, 1)} className="w-7 h-7 bg-white rounded flex items-center justify-center">+</button>
                        </div>
                        <button onClick={() => removeProduct(item.productId)} className="text-red-500 p-1">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 备注 */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="填写备注信息（可选）"
                  className="w-full p-3 border border-slate-200 rounded-xl"
                  rows={2}
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200">
              <button 
                onClick={createRequest}
                disabled={selectedProducts.length === 0 || loading}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 disabled:bg-slate-300 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
