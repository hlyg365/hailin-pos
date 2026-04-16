'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart3, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

const periodData = [
  { label: '今日', sales: 12580, orders: 356, customers: 892 },
  { label: '昨日', sales: 11200, orders: 328, customers: 856 },
  { label: '本周', sales: 78200, orders: 2340, customers: 5620 },
  { label: '本月', sales: 298000, orders: 8920, customers: 21450 },
];

const hourlyData = [
  { hour: '08:00', sales: 1200 },
  { hour: '09:00', sales: 1800 },
  { hour: '10:00', sales: 2100 },
  { hour: '11:00', sales: 1650 },
  { hour: '12:00', sales: 980 },
  { hour: '13:00', sales: 1100 },
  { hour: '14:00', sales: 1400 },
  { hour: '15:00', sales: 1580 },
  { hour: '16:00', sales: 1720 },
  { hour: '17:00', sales: 2100 },
  { hour: '18:00', sales: 1850 },
  { hour: '19:00', sales: 2200 },
  { hour: '20:00', sales: 1950 },
  { hour: '21:00', sales: 1450 },
];

const topProducts = [
  { name: '农夫山泉550ml', sales: 1250, amount: 2500 },
  { name: '可口可乐330ml', sales: 980, amount: 2940 },
  { name: '康师傅方便面', sales: 756, amount: 3402 },
  { name: '双汇火腿肠', sales: 534, amount: 2670 },
];

export default function ReportPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('今日');
  const currentData = periodData.find(p => p.label === selectedPeriod) || periodData[0];
  const maxSales = Math.max(...hourlyData.map(h => h.sales));

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部 */}
      <header className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/" className="p-2 -ml-2">
            <span className="text-xl">←</span>
          </Link>
          <h1 className="text-xl font-bold flex-1">数据报表</h1>
          <button className="p-2">
            <Calendar className="w-5 h-5" />
          </button>
        </div>

        {/* 时间选择 */}
        <div className="flex gap-2">
          {periodData.map(period => (
            <button
              key={period.label}
              onClick={() => setSelectedPeriod(period.label)}
              className={`px-4 py-2 rounded-full text-sm ${
                selectedPeriod === period.label ? 'bg-white text-blue-600' : 'bg-white/20'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </header>

      {/* 核心数据 */}
      <div className="px-4 -mt-3">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="grid grid-cols-3 divide-x">
            <div className="text-center px-2">
              <p className="text-xs text-gray-500">销售额</p>
              <p className="text-xl font-bold text-blue-600 mt-1">¥{currentData.sales.toLocaleString()}</p>
              <div className="flex items-center justify-center gap-1 mt-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                +12.5%
              </div>
            </div>
            <div className="text-center px-2">
              <p className="text-xs text-gray-500">订单数</p>
              <p className="text-xl font-bold mt-1">{currentData.orders}</p>
              <div className="flex items-center justify-center gap-1 mt-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                +8.3%
              </div>
            </div>
            <div className="text-center px-2">
              <p className="text-xs text-gray-500">客流量</p>
              <p className="text-xl font-bold mt-1">{currentData.customers}</p>
              <div className="flex items-center justify-center gap-1 mt-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                +5.2%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 销售趋势 */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-semibold mb-4">销售趋势</h3>
          <div className="flex items-end gap-1 h-32">
            {hourlyData.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t transition-all"
                  style={{ height: `${(item.sales / maxSales) * 100}%` }}
                />
                <span className="text-xs text-gray-400 mt-1">{item.hour}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 热销商品 */}
      <div className="px-4 mt-4 pb-20">
        <div className="bg-white rounded-xl p-4">
          <h3 className="font-semibold mb-4">热销商品 TOP4</h3>
          <div className="space-y-3">
            {topProducts.map((product, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i === 0 ? 'bg-amber-500 text-white' :
                  i === 1 ? 'bg-gray-400 text-white' :
                  i === 2 ? 'bg-amber-700 text-white' :
                  'bg-gray-200'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-gray-500">销量 {product.sales}</p>
                </div>
                <p className="font-bold text-blue-600">¥{product.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部导航 */}
      <nav className="bottom-nav">
        <Link href="/" className="nav-item">
          <span className="icon">🏠</span>
          <span className="label">首页</span>
        </Link>
        <Link href="/inventory" className="nav-item">
          <span className="icon">📦</span>
          <span className="label">库存</span>
        </Link>
        <Link href="/report" className="nav-item active">
          <BarChart3 className="icon" />
          <span className="label">报表</span>
        </Link>
        <Link href="/settings" className="nav-item">
          <span className="icon">⚙️</span>
          <span className="label">设置</span>
        </Link>
      </nav>
    </div>
  );
}
