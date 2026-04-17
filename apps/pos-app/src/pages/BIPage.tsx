import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function BIPage() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [realtimeData, setRealtimeData] = useState({
    totalSales: 125680,
    orderCount: 356,
    avgOrderValue: 352.3,
    customers: 289,
  });

  // 模拟实时数据跳动
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeData(prev => ({
        totalSales: prev.totalSales + Math.floor(Math.random() * 100),
        orderCount: prev.orderCount + 1,
        avgOrderValue: (prev.totalSales + 80) / (prev.orderCount + 1),
        customers: prev.customers + Math.floor(Math.random() * 2),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 时段分析数据
  const hourlyData = [
    { hour: '06-08', sales: 8500, orders: 45 },
    { hour: '08-10', sales: 15600, orders: 89 },
    { hour: '10-12', sales: 12300, orders: 67 },
    { hour: '12-14', sales: 18900, orders: 112 },
    { hour: '14-16', sales: 9800, orders: 52 },
    { hour: '16-18', sales: 14200, orders: 78 },
    { hour: '18-20', sales: 22500, orders: 128 },
    { hour: '20-22', sales: 31800, orders: 186 },
  ];

  // ABC分析数据
  const abcProducts = [
    { name: '农夫山泉550ml', sales: 1560, ratio: 0.12, type: 'A' },
    { name: '可口可乐330ml', sales: 1280, ratio: 0.10, type: 'A' },
    { name: '康师傅方便面', sales: 980, ratio: 0.08, type: 'A' },
    { name: '双汇火腿肠', sales: 750, ratio: 0.06, type: 'B' },
    { name: '奥利奥饼干', sales: 620, ratio: 0.05, type: 'B' },
    { name: '伊利纯牛奶', sales: 580, ratio: 0.04, type: 'B' },
    { name: '蒙牛酸奶', sales: 420, ratio: 0.03, type: 'C' },
    { name: '绿箭口香糖', sales: 350, ratio: 0.03, type: 'C' },
    { name: '散装面包', sales: 280, ratio: 0.02, type: 'C' },
    { name: '红富士苹果', sales: 220, ratio: 0.02, type: 'C' },
  ];

  // 毛利分析
  const profitData = {
    totalRevenue: 125680,
    totalCost: 78650,
    grossProfit: 47030,
    grossMargin: 37.4,
    categoryProfit: [
      { category: '饮料', revenue: 45600, cost: 28400, margin: 37.7 },
      { category: '食品', revenue: 35200, cost: 21800, margin: 38.1 },
      { category: '零食', revenue: 21800, cost: 13200, margin: 39.4 },
      { category: '奶制品', revenue: 15600, cost: 9800, margin: 37.2 },
      { category: '生鲜', revenue: 7480, cost: 5450, margin: 27.1 },
    ],
  };

  // 预警数据
  const alerts = [
    { type: 'inventory', level: 'critical', message: '望京店：红富士苹果库存不足', time: '10分钟前' },
    { type: 'inventory', level: 'warning', message: '国贸店：蒙牛酸奶临期3天', time: '30分钟前' },
    { type: 'order', level: 'warning', message: '异常退单：订单#MINI20240117005', time: '1小时前' },
    { type: 'finance', level: 'info', message: '中关村店：日结单待审核', time: '2小时前' },
    { type: 'inventory', level: 'critical', message: '中关村店：散装面包已售罄', time: '2小时前' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-800">BI 数据分析中心</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['today', 'week', 'month'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    className={`px-4 py-1.5 rounded-md text-sm ${
                      timeRange === t ? 'bg-white shadow text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {t === 'today' ? '今日' : t === 'week' ? '本周' : '本月'}
                  </button>
                ))}
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出报表
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 实时大屏 */}
        <section className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
              实时数据 (每3秒刷新)
            </h2>
            <span className="text-sm opacity-80">{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm opacity-80">实时营收</p>
              <p className="text-3xl font-bold mt-1">¥{realtimeData.totalSales.toLocaleString()}</p>
              <p className="text-xs opacity-60 mt-1">较昨日 +12.5%</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-80">订单数</p>
              <p className="text-3xl font-bold mt-1">{realtimeData.orderCount}</p>
              <p className="text-xs opacity-60 mt-1">较昨日 +8.3%</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-80">客单价</p>
              <p className="text-3xl font-bold mt-1">¥{realtimeData.avgOrderValue.toFixed(1)}</p>
              <p className="text-xs opacity-60 mt-1">较昨日 +3.8%</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-80">顾客数</p>
              <p className="text-3xl font-bold mt-1">{realtimeData.customers}</p>
              <p className="text-xs opacity-60 mt-1">较昨日 +5.2%</p>
            </div>
          </div>
        </section>

        {/* 门店对比 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 时段分析 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="text-xl">📊</span> 时段分析
            </h3>
            <p className="text-sm text-gray-500 mb-4">识别高峰低谷，优化排班</p>
            <div className="flex items-end justify-between gap-2 h-40">
              {hourlyData.map((item, i) => {
                const maxSales = Math.max(...hourlyData.map(d => d.sales));
                const height = (item.sales / maxSales) * 100;
                const isPeak = item.sales === Math.max(...hourlyData.map(d => d.sales));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full rounded-t transition-all ${
                        isPeak ? 'bg-orange-500' : 'bg-blue-400'
                      }`}
                      style={{ height: `${height}%` }}
                      title={`¥${item.sales.toLocaleString()}`}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">{item.hour}</span>
                    {isPeak && <span className="text-xs text-orange-500 font-medium">高峰</span>}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-orange-500 rounded"></span>
                <span className="text-gray-600">高峰时段</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-400 rounded"></span>
                <span className="text-gray-600">正常时段</span>
              </div>
            </div>
          </div>

          {/* ABC分析 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="text-xl">🏆</span> 商品ABC分析
            </h3>
            <p className="text-sm text-gray-500 mb-4">识别畅销品与滞销品，优化库存结构</p>
            <div className="space-y-2">
              {abcProducts.slice(0, 8).map((product, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    product.type === 'A' ? 'bg-green-100 text-green-600' :
                    product.type === 'B' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {product.type}
                  </span>
                  <span className="flex-1 text-sm truncate">{product.name}</span>
                  <div className="w-24 h-2 bg-gray-100 rounded-full">
                    <div
                      className={`h-2 rounded-full ${
                        product.type === 'A' ? 'bg-green-500' :
                        product.type === 'B' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`}
                      style={{ width: `${(product.ratio / 0.12) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-16 text-right">{product.sales}件</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> A类 (畅销)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> B类 (平稳)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400"></span> C类 (滞销)</span>
            </div>
          </div>
        </section>

        {/* 毛利分析 */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="text-xl">💰</span> 毛利分析
          </h3>
          
          {/* 整体毛利 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">营收</p>
              <p className="text-2xl font-bold text-green-600">¥{profitData.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">成本</p>
              <p className="text-2xl font-bold text-red-600">¥{profitData.totalCost.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">毛利</p>
              <p className="text-2xl font-bold text-blue-600">¥{profitData.grossProfit.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">毛利率</p>
              <p className="text-2xl font-bold text-purple-600">{profitData.grossMargin}%</p>
            </div>
          </div>

          {/* 分类毛利 */}
          <h4 className="font-medium mb-3">分类毛利对比</h4>
          <div className="space-y-3">
            {profitData.categoryProfit.map((cat, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-20 text-sm">{cat.category}</span>
                <div className="flex-1 flex gap-4">
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(cat.revenue / 45600) * 100}%` }}></div>
                  </div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${(cat.cost / 28400) * 100}%` }}></div>
                  </div>
                </div>
                <span className={`w-16 text-right font-semibold ${
                  cat.margin > 38 ? 'text-green-600' : cat.margin > 35 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {cat.margin}%
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-2 bg-blue-500 rounded"></span>
              <span className="text-gray-600">营收占比</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-2 bg-red-400 rounded"></span>
              <span className="text-gray-600">成本占比</span>
            </div>
          </div>
        </section>

        {/* 预警中心 */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="text-xl">🔔</span> 预警中心
            </h3>
            <div className="flex gap-2">
              {[
                { label: '全部', count: alerts.length, active: true },
                { label: '库存', count: 3, active: false },
                { label: '订单', count: 1, active: false },
                { label: '财务', count: 1, active: false },
              ].map((filter, i) => (
                <button
                  key={i}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter.active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {filter.label} {filter.count}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  alert.level === 'critical' ? 'bg-red-50 border border-red-200' :
                  alert.level === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    alert.level === 'critical' ? 'bg-red-100 text-red-600' :
                    alert.level === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {alert.type === 'inventory' ? '📦' : alert.type === 'order' ? '🧾' : '💰'}
                  </span>
                  <div>
                    <p className={`font-medium ${
                      alert.level === 'critical' ? 'text-red-800' :
                      alert.level === 'warning' ? 'text-yellow-800' :
                      'text-blue-800'
                    }`}>
                      {alert.message}
                    </p>
                    <p className="text-sm text-gray-500">{alert.time}</p>
                  </div>
                </div>
                <button className={`px-3 py-1 rounded text-sm ${
                  alert.level === 'critical' ? 'bg-red-500 text-white hover:bg-red-600' :
                  alert.level === 'warning' ? 'bg-yellow-500 text-white hover:bg-yellow-600' :
                  'bg-blue-500 text-white hover:bg-blue-600'
                }`}>
                  处理
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 门店排名 */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="text-xl">🏪</span> 门店经营排行
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="pb-3">排名</th>
                  <th className="pb-3">门店</th>
                  <th className="pb-3">营收</th>
                  <th className="pb-3">订单</th>
                  <th className="pb-3">客单价</th>
                  <th className="pb-3">毛利</th>
                  <th className="pb-3">趋势</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { rank: 1, store: '望京店', sales: 45680, orders: 128, avgPrice: 356.8, margin: 38.2, trend: '+15%' },
                  { rank: 2, store: '国贸店', sales: 38920, orders: 112, avgPrice: 347.5, margin: 36.8, trend: '+12%' },
                  { rank: 3, store: '中关村店', sales: 32450, orders: 96, avgPrice: 338.0, margin: 35.5, trend: '+8%' },
                  { rank: 4, store: '五道口店', sales: 28900, orders: 85, avgPrice: 340.0, margin: 37.0, trend: '+5%' },
                  { rank: 5, store: '亚运村店', sales: 24560, orders: 72, avgPrice: 341.1, margin: 34.2, trend: '-2%' },
                ].map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        row.rank === 1 ? 'bg-yellow-100 text-yellow-600' :
                        row.rank === 2 ? 'bg-gray-100 text-gray-600' :
                        row.rank === 3 ? 'bg-orange-100 text-orange-600' :
                        'bg-gray-50 text-gray-400'
                      }`}>
                        {row.rank}
                      </span>
                    </td>
                    <td className="py-3 font-medium">{row.store}</td>
                    <td className="py-3 text-red-600 font-semibold">¥{row.sales.toLocaleString()}</td>
                    <td className="py-3">{row.orders}</td>
                    <td className="py-3">¥{row.avgPrice.toFixed(1)}</td>
                    <td className="py-3">
                      <span className={`${
                        row.margin > 37 ? 'text-green-600' : row.margin > 35 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {row.margin}%
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={row.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                        {row.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
