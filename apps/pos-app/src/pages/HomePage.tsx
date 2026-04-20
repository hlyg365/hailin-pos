import { Link, useNavigate } from 'react-router-dom';
import { useStoreStore, useFinanceStore, useAlertStore, useEmployeeStore } from '../store';

export default function HomePage() {
  const navigate = useNavigate();
  const { currentStore } = useStoreStore();
  const { todaySales, todayOrders, todayCash, depositPending } = useFinanceStore();
  const { lowStockAlerts } = useAlertStore();
  const { currentEmployee, logout } = useEmployeeStore();

  const isClearanceMode = () => {
    const hour = new Date().getHours();
    return hour >= 20 && hour < 23;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="海邻到家" className="h-14 w-auto" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
              <div>
                <h1 className="text-xl font-bold">海邻到家</h1>
                <p className="text-sm text-blue-100">连锁便利店智慧收银系统 V6.0</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isClearanceMode() && (
                <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full animate-pulse">
                  清货模式 8折
                </span>
              )}
              <div className="text-right">
                <p className="text-sm text-blue-100">当前门店</p>
                <p className="font-semibold">{currentStore?.name || '未选择'}</p>
              </div>
              {currentEmployee ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm bg-blue-800 px-2 py-1 rounded">
                    {currentEmployee.name} ({currentEmployee.role === 'admin' ? '管理员' : currentEmployee.role === 'manager' ? '店长' : '收银员'})
                  </span>
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="text-sm text-blue-200 hover:text-white underline"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  登录
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 今日概览 */}
      <section className="container mx-auto px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">今日概览</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">今日销售</p>
                <p className="text-xl font-bold text-gray-800">¥{(todaySales).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🧾</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">订单数</p>
                <p className="text-xl font-bold text-gray-800">{todayOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💵</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">现金收款</p>
                <p className="text-xl font-bold text-gray-800">¥{todayCash.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📮</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">待缴款</p>
                <p className="text-xl font-bold text-purple-600">¥{depositPending.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 预警信息 */}
      {lowStockAlerts.length > 0 && (
        <section className="container mx-auto px-4 py-2">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">库存预警</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {lowStockAlerts.map(alert => (
                <span key={alert.productId} className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
                  {alert.productName} (剩余{alert.current})
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 四端入口 */}
      <section className="container mx-auto px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">业务入口</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/pos/cashier" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🛒</span>
            </div>
            <h3 className="font-semibold text-gray-800">收银台</h3>
            <p className="text-sm text-gray-500 mt-1">AI智慧收银 · 聚合支付</p>
            <div className="mt-3 flex flex-wrap gap-1">
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">AI识码</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">AI视觉</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">离线收银</span>
            </div>
          </Link>

          <Link to="/dashboard" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="font-semibold text-gray-800">总部后台</h3>
            <p className="text-sm text-gray-500 mt-1">供应链 · 财务 · 人员</p>
            <div className="mt-3 flex flex-wrap gap-1">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">多门店</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">数据看板</span>
            </div>
          </Link>

          <Link to="/mini" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🛍️</span>
            </div>
            <h3 className="font-semibold text-gray-800">小程序商城</h3>
            <p className="text-sm text-gray-500 mt-1">线上销售 · 团购接龙</p>
            <div className="mt-3 flex flex-wrap gap-1">
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">外卖对接</span>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">社群团购</span>
            </div>
          </Link>

          <Link to="/assistant" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-3xl">📱</span>
            </div>
            <h3 className="font-semibold text-gray-800">店长助手</h3>
            <p className="text-sm text-gray-500 mt-1">门店管理 · 库存盘点</p>
            <div className="mt-3 flex flex-wrap gap-1">
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">要货申请</span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">缴款</span>
            </div>
          </Link>
        </div>
      </section>

      {/* 快捷功能 */}
      <section className="container mx-auto px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">快捷功能</h2>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {[
            { icon: '📋', label: '挂单列表', to: '/pos/suspended' },
            { icon: '👥', label: '会员管理', to: '/pos/member' },
            { icon: '🎫', label: '会员识别', to: '/pos/member' },
            { icon: '📦', label: '商品管理', to: '/dashboard/products' },
            { icon: '📈', label: 'BI分析', to: '/dashboard/bi' },
            { icon: '🚚', label: '要货申请', to: '/assistant/restock' },
            { icon: '💳', label: '缴款单', to: '/assistant/deposit' },
            { icon: '🎁', label: '促销管理', to: '/dashboard/promotion' },
            { icon: '🔄', label: '门店调拨', to: '/dashboard/store-ops' },
            { icon: '📋', label: '巡店管理', to: '/dashboard/store-ops' },
            { icon: '📨', label: '电子工单', to: '/dashboard/store-ops' },
            { icon: '🔐', label: '权限管理', to: '/dashboard/auth' },
            { icon: '⚙️', label: '系统设置', to: '/settings' },
          ].map((item, i) => (
            <Link
              key={i}
              to={item.to}
              className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center"
            >
              <span className="text-2xl mb-2">{item.icon}</span>
              <span className="text-sm text-gray-600">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 系统信息 */}
      <footer className="container mx-auto px-4 py-6 text-center text-sm text-gray-400">
        <p>海邻到家智慧收银系统 V6.0 · 云原生 SaaS 架构</p>
        <p className="mt-1">© 2024 Hailin Technology. All rights reserved.</p>
      </footer>
    </div>
  );
}
