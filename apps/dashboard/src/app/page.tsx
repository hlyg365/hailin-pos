'use client';

import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 模拟数据
const salesData = [
  { name: '周一', sales: 4200, orders: 120 },
  { name: '周二', sales: 3800, orders: 98 },
  { name: '周三', sales: 5100, orders: 145 },
  { name: '周四', sales: 4600, orders: 132 },
  { name: '周五', sales: 6200, orders: 178 },
  { name: '周六', sales: 7800, orders: 220 },
  { name: '周日', sales: 6900, orders: 195 },
];

const categoryData = [
  { name: '饮料', value: 35 },
  { name: '食品', value: 28 },
  { name: '日用品', value: 18 },
  { name: '零食', value: 12 },
  { name: '其他', value: 7 },
];

const storeData = [
  { id: '1', name: '海邻到家-望京店', address: '北京市朝阳区望京街道', todaySales: 12580, todayOrders: 356, status: '营业中' },
  { id: '2', name: '海邻到家-国贸店', address: '北京市朝阳区国贸CBD', todaySales: 18230, todayOrders: 512, status: '营业中' },
  { id: '3', name: '海邻到家-中关村店', address: '北京市海淀区中关村', todaySales: 9870, todayOrders: 289, status: '营业中' },
  { id: '4', name: '海邻到家-五道口店', address: '北京市海淀区五道口', todaySales: 11240, todayOrders: 324, status: '休息中' },
  { id: '5', name: '海邻到家-西单店', address: '北京市西城区西单', todaySales: 15670, todayOrders: 445, status: '营业中' },
];

const recentOrders = [
  { id: 'POS20240115001', store: '望京店', amount: 86.5, member: '张先生', status: '已完成', time: '10:35' },
  { id: 'POS20240115002', store: '国贸店', amount: 125.0, member: '李女士', status: '已完成', time: '10:42' },
  { id: 'POS20240115003', store: '中关村店', amount: 45.5, member: '-', status: '已完成', time: '10:58' },
  { id: 'POS20240115004', store: '西单店', amount: 268.0, member: '王先生', status: '已完成', time: '11:15' },
  { id: 'POS20240115005', store: '望京店', amount: 32.0, member: '-', status: '已完成', time: '11:28' },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">今日销售额</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">¥67,520</p>
              <p className="text-sm text-green-600 mt-1">↑ 12.5% 较昨日</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">今日订单数</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">1,926</p>
              <p className="text-sm text-green-600 mt-1">↑ 8.3% 较昨日</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">会员总数</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">48,256</p>
              <p className="text-sm text-blue-600 mt-1">↑ 156 今日新增</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">门店总数</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">12</p>
              <p className="text-sm text-gray-500 mt-1">全部营业中</p>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 销售趋势 */}
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">销售趋势</h3>
            <div className="flex gap-2">
              {['day', 'week', 'month'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    selectedPeriod === period ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {period === 'day' ? '今日' : period === 'week' ? '本周' : '本月'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} name="销售额(元)" />
              <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} name="订单数" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 销售占比 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">商品分类占比</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-sm text-gray-600">{item.name}</span>
                <span className="text-sm font-medium ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 门店和订单 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 门店销售排行 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">门店销售排行</h3>
            <a href="/dashboard/stores" className="text-sm text-primary hover:underline">查看全部</a>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>门店</th>
                <th>今日销售额</th>
                <th>订单数</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {storeData.slice(0, 5).map((store) => (
                <tr key={store.id}>
                  <td>
                    <div className="font-medium">{store.name}</div>
                    <div className="text-xs text-gray-400">{store.address}</div>
                  </td>
                  <td className="font-medium text-primary">¥{store.todaySales.toLocaleString()}</td>
                  <td>{store.todayOrders}</td>
                  <td>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      store.status === '营业中' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {store.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 最新订单 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">最新订单</h3>
            <a href="/dashboard/orders" className="text-sm text-primary hover:underline">查看全部</a>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>门店</th>
                <th>金额</th>
                <th>会员</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="font-mono text-sm">{order.id}</td>
                  <td>{order.store}</td>
                  <td className="font-medium">¥{order.amount.toFixed(2)}</td>
                  <td>{order.member}</td>
                  <td className="text-gray-500">{order.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
