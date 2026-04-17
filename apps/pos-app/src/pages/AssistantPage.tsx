import { Link } from 'react-router-dom';

const todayStats = { sales: 12580, orders: 356, customers: 289, clearanceItems: 45 };

const alerts = [
  { id: '1', type: 'warning', message: '农夫山泉库存不足，仅剩 10 箱', time: '10分钟前' },
  { id: '2', type: 'info', message: '晚8清货模式将在 20:00 开启', time: '2小时前' },
  { id: '3', type: 'success', message: '昨日销售突破历史新高', time: '昨天' },
];

const inventoryItems = [
  { id: '1', name: '农夫山泉', stock: 10, threshold: 50, unit: '箱', status: 'warning' },
  { id: '2', name: '可口可乐', stock: 85, threshold: 50, unit: '箱', status: 'normal' },
  { id: '3', name: '康师傅方便面', stock: 120, threshold: 100, unit: '箱', status: 'normal' },
  { id: '4', name: '蒙牛纯牛奶', stock: 8, threshold: 30, unit: '箱', status: 'danger' },
];

const salesTrend = [
  { time: '08:00', amount: 1250 }, { time: '09:00', amount: 2100 }, { time: '10:00', amount: 1850 },
  { time: '11:00', amount: 2400 }, { time: '12:00', amount: 1680 }, { time: '13:00', amount: 980 },
];

export default function AssistantPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-white/80"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></Link>
              <h1 className="text-lg font-semibold">店长助手</h1>
            </div>
            <div className="text-sm bg-white/20 px-3 py-1 rounded-full">望京店</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4"><div className="text-sm text-white/70">今日销售额</div><div className="text-2xl font-bold mt-1">¥{todayStats.sales.toLocaleString()}</div></div>
            <div className="bg-white/10 rounded-xl p-4"><div className="text-sm text-white/70">今日订单</div><div className="text-2xl font-bold mt-1">{todayStats.orders} 单</div></div>
            <div className="bg-white/10 rounded-xl p-4"><div className="text-sm text-white/70">客流量</div><div className="text-2xl font-bold mt-1">{todayStats.customers} 人</div></div>
            <div className="bg-white/10 rounded-xl p-4"><div className="text-sm text-white/70">清货商品</div><div className="text-2xl font-bold mt-1">{todayStats.clearanceItems} 件</div></div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-4 gap-3">
          <Link to="/assistant/inventory" className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 bg-blue-100 rounded-full mx-auto mb-2 flex items-center justify-center"><span className="text-xl">📦</span></div>
            <div className="text-xs font-medium text-gray-700">库存</div>
          </Link>
          <Link to="/assistant/check" className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 bg-green-100 rounded-full mx-auto mb-2 flex items-center justify-center"><span className="text-xl">✓</span></div>
            <div className="text-xs font-medium text-gray-700">盘点</div>
          </Link>
          <Link to="/assistant/purchase" className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 bg-orange-100 rounded-full mx-auto mb-2 flex items-center justify-center"><span className="text-xl">+</span></div>
            <div className="text-xs font-medium text-gray-700">采购</div>
          </Link>
          <Link to="/assistant/report" className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="w-10 h-10 bg-purple-100 rounded-full mx-auto mb-2 flex items-center justify-center"><span className="text-xl">📊</span></div>
            <div className="text-xs font-medium text-gray-700">报表</div>
          </Link>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">待办提醒</h3>
            <span className="text-sm text-gray-500">{alerts.length} 条</span>
          </div>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg ${alert.type === 'warning' ? 'bg-amber-50' : alert.type === 'danger' ? 'bg-red-50' : 'bg-blue-50'}`}>
                <div className={`w-2 h-2 rounded-full mt-2 ${alert.type === 'warning' ? 'bg-amber-500' : alert.type === 'danger' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                <div className="flex-1"><div className="text-sm text-gray-800">{alert.message}</div><div className="text-xs text-gray-500 mt-1">{alert.time}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">库存预警</h3>
            <Link to="/assistant/inventory" className="text-sm text-blue-500">查看全部</Link>
          </div>
          <div className="space-y-3">
            {inventoryItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.status === 'danger' ? 'bg-red-500' : item.status === 'warning' ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                  <div><div className="font-medium text-gray-800">{item.name}</div><div className="text-xs text-gray-500">预警值: {item.threshold}{item.unit}</div></div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${item.status === 'danger' ? 'text-red-500' : item.status === 'warning' ? 'text-amber-500' : 'text-gray-800'}`}>{item.stock}{item.unit}</div>
                  <button className="text-xs text-blue-500">补货</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">今日销售趋势</h3>
            <Link to="/assistant/report" className="text-sm text-blue-500">详细报表</Link>
          </div>
          <div className="h-40 flex items-end justify-between gap-2">
            {salesTrend.map((item, index) => (
              <div key={index} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t" style={{ height: `${(item.amount / 2500) * 120}px` }}></div>
                <span className="text-xs text-gray-500">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
