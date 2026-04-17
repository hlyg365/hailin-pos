import { useState } from 'react';
import { Link } from 'react-router-dom';

const suspendedOrders = [
  { id: 'ORD001', time: '10:30', items: 3, amount: 45.5, note: '王先生' },
  { id: 'ORD002', time: '10:45', items: 5, amount: 128.0, note: '李女士' },
];

export default function SuspendedOrdersPage() {
  const [orders, setOrders] = useState(suspendedOrders);

  const resumeOrder = (orderId: string) => {
    alert(`取回订单 ${orderId}`);
    setOrders(orders.filter(o => o.id !== orderId));
  };

  const deleteOrder = (orderId: string) => {
    if (confirm('确定删除此挂单?')) {
      setOrders(orders.filter(o => o.id !== orderId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/pos/cashier" className="text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <h1 className="text-lg font-semibold">挂单列表</h1>
            <div className="text-sm text-gray-500">{orders.length} 单</div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <div className="text-gray-500 mb-4">暂无挂单</div>
            <Link to="/pos/cashier" className="px-6 py-2 bg-orange-500 text-white rounded-lg">去收银</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div><span className="font-mono font-semibold">{order.id}</span><span className="text-gray-500 text-sm ml-3">{order.time}</span></div>
                  <span className="text-orange-500 font-bold">¥{order.amount}</span>
                </div>
                <div className="text-sm text-gray-500 mb-3">{order.items} 件商品 {order.note && `• ${order.note}`}</div>
                <div className="flex gap-3">
                  <button onClick={() => resumeOrder(order.id)} className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-medium">取回</button>
                  <button onClick={() => deleteOrder(order.id)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">删除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
