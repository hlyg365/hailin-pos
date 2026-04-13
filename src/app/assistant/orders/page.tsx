'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Search, 
  ShoppingCart,
  Clock,
  CheckCircle,
  Printer,
  RefreshCw,
  Filter,
  ChevronRight
} from 'lucide-react';

interface OrderRecord {
  id: string;
  items: Array<{name: string; quantity: number; price: number; subtotal: number}>;
  subtotal: number;
  discount: number;
  finalTotal: number;
  paymentMethod: string;
  paidAmount: number;
  change: number;
  member?: { name: string };
  createdAt: number;
  syncStatus: string;
}

export default function AssistantOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    setLoading(true);
    const savedOrders = JSON.parse(localStorage.getItem('pos_orders') || '[]');
    setOrders(savedOrders);
    setLoading(false);
  };

  const filteredOrders = orders.filter(order => {
    const matchSearch = !searchKeyword || 
      order.id.includes(searchKeyword) ||
      order.items.some(item => item.name.includes(searchKeyword));
    const matchStatus = filterStatus === 'all' || 
      (filterStatus === 'completed' && order.syncStatus === 'synced') ||
      (filterStatus === 'pending' && order.syncStatus === 'pending');
    return matchSearch && matchStatus;
  });

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'wechat': return '微信';
      case 'alipay': return '支付宝';
      case 'cash': return '现金';
      case 'card': return '银行卡';
      default: return method;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 头部 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 px-4 py-3">
          <button onClick={() => router.push('/assistant')} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">订单查询</h1>
          <button onClick={loadOrders} className="ml-auto p-2 hover:bg-slate-100 rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        
        {/* 搜索和筛选 */}
        <div className="px-4 pb-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索订单号..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'completed', label: '已同步' },
              { key: 'pending', label: '待同步' },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setFilterStatus(item.key as any)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  filterStatus === item.key 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>加载中...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">暂无订单记录</p>
            <p className="text-sm mt-2">请先进行收银操作</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => (
              <div 
                key={order.id} 
                className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-800">{order.id}</p>
                    <p className="text-sm text-slate-500">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-orange-500">¥{order.finalTotal.toFixed(2)}</p>
                    <p className="text-sm text-slate-500">{getPaymentIcon(order.paymentMethod)}</p>
                  </div>
                </div>
                
                <div className="text-sm text-slate-600 mb-3">
                  {order.items.slice(0, 3).map((item, i) => (
                    <span key={i}>{item.name}×{item.quantity}{i < Math.min(order.items.length, 3) - 1 ? '、' : ''}</span>
                  ))}
                  {order.items.length > 3 && <span className="text-slate-400">...</span>}
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {order.syncStatus === 'pending' ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                        待同步
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        已同步
                      </span>
                    )}
                    {order.member && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {order.member.name}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 统计信息 */}
        {orders.length > 0 && (
          <div className="mt-6 bg-white rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-800">{orders.length}</p>
                <p className="text-sm text-slate-500">总订单</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  ¥{orders.reduce((sum, o) => sum + o.finalTotal, 0).toFixed(2)}
                </p>
                <p className="text-sm text-slate-500">总金额</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {orders.filter(o => o.syncStatus === 'pending').length}
                </p>
                <p className="text-sm text-slate-500">待同步</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 订单详情弹窗 */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full max-h-[90vh] overflow-hidden rounded-t-3xl">
            <div className="bg-orange-500 text-white px-4 py-3 flex items-center justify-between">
              <h2 className="font-bold text-lg">订单详情</h2>
              <button onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-500 mb-1">订单号</p>
                  <p className="font-bold">{selectedOrder.id}</p>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-500 mb-1">订单时间</p>
                  <p className="font-bold">{formatDateTime(selectedOrder.createdAt)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-500 mb-2">商品明细</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-slate-500">¥{item.price} × {item.quantity}</p>
                        </div>
                        <p className="font-bold">¥{item.subtotal.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">商品金额</span>
                    <span>¥{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-orange-500">
                      <span>优惠</span>
                      <span>-¥{selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>实付金额</span>
                    <span className="text-orange-500">¥{selectedOrder.finalTotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.paymentMethod === 'cash' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">实收</span>
                        <span>¥{selectedOrder.paidAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">找零</span>
                        <span className="text-green-500">¥{selectedOrder.change.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-500 mb-1">支付方式</p>
                  <p className="font-bold">{getPaymentIcon(selectedOrder.paymentMethod)}</p>
                </div>
                
                {selectedOrder.member && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-blue-500 mb-1">会员</p>
                    <p className="font-bold text-blue-700">{selectedOrder.member.name}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="w-full py-3 text-slate-500"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
