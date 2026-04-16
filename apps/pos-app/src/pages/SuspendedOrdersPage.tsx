import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Trash2, RefreshCw } from 'lucide-react';
import { useCartActions } from '@hailin/cart';

interface SuspendedOrder {
  id: string;
  items: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  createdAt: string;
  memberName?: string;
}

// 模拟挂单数据
const mockOrders: SuspendedOrder[] = [
  {
    id: '1',
    items: [
      { productId: '1', productName: '农夫山泉550ml', price: 2, quantity: 2 },
      { productId: '2', productName: '可口可乐330ml', price: 3, quantity: 1 },
    ],
    totalAmount: 7,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    memberName: '张三',
  },
  {
    id: '2',
    items: [
      { productId: '3', productName: '康师傅方便面', price: 4.5, quantity: 3 },
    ],
    totalAmount: 13.5,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

export default function SuspendedOrdersPage() {
  const navigate = useNavigate();
  const { addItem } = useCartActions();
  const [orders, setOrders] = useState<SuspendedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载
    setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 500);
  }, []);

  // 取单
  const handleRetrieve = (order: SuspendedOrder) => {
    // 将订单商品添加到购物车
    order.items.forEach(item => {
      addItem({
        id: item.productId,
        name: item.productName,
        price: item.price,
        barcode: '',
      } as any, item.quantity);
    });
    
    // 删除挂单
    setOrders(prev => prev.filter(o => o.id !== order.id));
    
    // 返回收银台
    navigate('/cashier');
  };

  // 删除挂单
  const handleDelete = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部栏 */}
      <div className="bg-white px-4 py-4 flex items-center gap-4 border-b">
        <button onClick={() => navigate('/cashier')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">挂单列表</h1>
        <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-sm">
          {orders.length} 单
        </span>
      </div>

      {/* 挂单列表 */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无挂单</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl overflow-hidden">
              {/* 头部 */}
              <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{formatTime(order.createdAt)}</span>
                </div>
                {order.memberName && (
                  <span className="text-sm text-green-600">{order.memberName}</span>
                )}
              </div>

              {/* 商品列表 */}
              <div className="p-4 space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="font-medium">{item.productName}</span>
                      <span className="text-gray-500 ml-2">×{item.quantity}</span>
                    </div>
                    <span className="text-gray-600">¥{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* 金额和操作 */}
              <div className="px-4 py-3 border-t flex items-center justify-between">
                <div className="text-lg font-bold">
                  合计: <span className="text-blue-600">¥{order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleRetrieve(order)}
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                  >
                    取单
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
