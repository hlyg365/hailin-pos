import { Link } from 'react-router-dom';

const storeData = [
  { id: '1', name: '望京店', todaySales: 12580, todayOrders: 356, status: '营业中' },
  { id: '2', name: '国贸店', todaySales: 18230, todayOrders: 512, status: '营业中' },
  { id: '3', name: '中关村店', todaySales: 9870, todayOrders: 289, status: '营业中' },
];

const recentOrders = [
  { id: 'POS001', store: '望京店', amount: 86.5, member: '张先生', status: '已完成' },
  { id: 'POS002', store: '国贸店', amount: 125.0, member: '李女士', status: '已完成' },
  { id: 'POS003', store: '中关村店', amount: 45.5, member: '-', status: '已完成' },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                <span>返回首页</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-lg font-semibold text-gray-800">总部管理后台</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{new Date().toLocaleDateString('zh-CN')}</span>
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center"><span className="text-white text-sm font-medium">管</span></div>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 py-2">
            <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg">工作台</Link>
            <Link to="/dashboard/stores" className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">门店管理</Link>
            <Link to="/dashboard/products" className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">商品管理</Link>
            <Link to="/dashboard/orders" className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">订单管理</Link>
            <Link to="/dashboard/members" className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">会员管理</Link>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">今日销售额</p><p className="text-3xl font-bold text-gray-800 mt-1">¥67,520</p><p className="text-sm text-green-600 mt-1">↑ 12.5%</p></div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center"><span className="text-2xl">💰</span></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">今日订单数</p><p className="text-3xl font-bold text-gray-800 mt-1">1,926</p><p className="text-sm text-green-600 mt-1">↑ 8.3%</p></div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><span className="text-2xl">📋</span></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">会员总数</p><p className="text-3xl font-bold text-gray-800 mt-1">48,256</p><p className="text-sm text-blue-600 mt-1">↑ 156 今日</p></div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><span className="text-2xl">👥</span></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">门店总数</p><p className="text-3xl font-bold text-gray-800 mt-1">12</p><p className="text-sm text-gray-500 mt-1">全部营业中</p></div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center"><span className="text-2xl">🏪</span></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">门店实时数据</h3>
            <div className="space-y-3">
              {storeData.map(store => (
                <div key={store.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div><div className="font-medium text-gray-800">{store.name}</div></div>
                  <div className="text-right"><div className="font-medium text-gray-800">¥{store.todaySales.toLocaleString()}</div><div className="text-xs text-gray-500">{store.todayOrders} 单</div></div>
                  <div className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">{store.status}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">最近订单</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="text-left text-sm text-gray-500 border-b"><th className="pb-3">订单号</th><th className="pb-3">门店</th><th className="pb-3">金额</th><th className="pb-3">状态</th></tr></thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className="text-sm border-b last:border-0">
                      <td className="py-3 font-mono">{order.id}</td>
                      <td className="py-3">{order.store}</td>
                      <td className="py-3 font-medium">¥{order.amount}</td>
                      <td className="py-3"><span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">{order.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
