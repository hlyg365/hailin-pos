'use client';

import { useState } from 'react';

const orders = [
  { id: '1', orderNo: 'POS20240115001', store: '望京店', amount: 86.5, payment: '微信支付', member: '张先生', status: '已完成', createdAt: '2024-01-15 10:35' },
  { id: '2', orderNo: 'POS20240115002', store: '国贸店', amount: 125.0, payment: '支付宝', member: '李女士', status: '已完成', createdAt: '2024-01-15 10:42' },
  { id: '3', orderNo: 'POS20240115003', store: '中关村店', amount: 45.5, payment: '现金', member: '-', status: '已完成', createdAt: '2024-01-15 10:58' },
  { id: '4', orderNo: 'POS20240115004', store: '西单店', amount: 268.0, payment: '微信支付', member: '王先生', status: '已完成', createdAt: '2024-01-15 11:15' },
  { id: '5', orderNo: 'POS20240115005', store: '望京店', amount: 32.0, payment: '现金', member: '-', status: '已完成', createdAt: '2024-01-15 11:28' },
  { id: '6', orderNo: 'POS20240115006', store: '王府井店', amount: 156.5, payment: '会员卡', member: '赵女士', status: '已完成', createdAt: '2024-01-15 11:45' },
  { id: '7', orderNo: 'POS20240115007', store: '国贸店', amount: 89.0, payment: '支付宝', member: '刘先生', status: '退款中', createdAt: '2024-01-15 12:00' },
  { id: '8', orderNo: 'POS20240115008', store: '五道口店', amount: 210.5, payment: '微信支付', member: '-', status: '已完成', createdAt: '2024-01-15 12:15' },
];

const statusMap = {
  '已完成': { bg: 'bg-green-100', text: 'text-green-700' },
  '退款中': { bg: 'bg-amber-100', text: 'text-amber-700' },
  '已退款': { bg: 'bg-gray-100', text: 'text-gray-700' },
};

export default function OrdersPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');

  const filteredOrders = orders.filter(order => {
    const matchSearch = order.orderNo.includes(searchKeyword) || order.member.includes(searchKeyword);
    const matchStatus = statusFilter === '全部' || order.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmount = filteredOrders.reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">订单管理</h1>
          <p className="text-gray-500 mt-1">管理所有订单，共 {orders.length} 笔订单</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 px-4 py-2 rounded-lg">
            <span className="text-sm text-gray-600">今日销售 </span>
            <span className="text-xl font-bold text-primary">¥{totalAmount.toFixed(2)}</span>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导出报表
          </button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-xl p-4 flex items-center gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索订单号或会员..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option>全部</option>
          <option>已完成</option>
          <option>退款中</option>
          <option>已退款</option>
        </select>
        <input type="date" className="px-4 py-2 border rounded-lg" />
        <span className="text-gray-400">至</span>
        <input type="date" className="px-4 py-2 border rounded-lg" />
      </div>

      {/* 订单列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>门店</th>
              <th>支付方式</th>
              <th>会员</th>
              <th>金额</th>
              <th>状态</th>
              <th>下单时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td className="font-mono text-sm">{order.orderNo}</td>
                <td>{order.store}</td>
                <td>{order.payment}</td>
                <td>{order.member}</td>
                <td className="font-medium text-primary">¥{order.amount.toFixed(2)}</td>
                <td>
                  <span className={`px-2 py-1 text-xs rounded-full ${statusMap[order.status as keyof typeof statusMap].bg} ${statusMap[order.status as keyof typeof statusMap].text}`}>
                    {order.status}
                  </span>
                </td>
                <td className="text-gray-500">{order.createdAt}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="text-sm text-primary hover:underline">详情</button>
                    {order.status === '已完成' && (
                      <button className="text-sm text-amber-600 hover:underline">退款</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">显示 1-{filteredOrders.length} 条，共 {filteredOrders.length} 条</p>
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>上一页</button>
          <button className="px-3 py-1 bg-primary text-white rounded-lg">1</button>
          <button className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>下一页</button>
        </div>
      </div>
    </div>
  );
}
