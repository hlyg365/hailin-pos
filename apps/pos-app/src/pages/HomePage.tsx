import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-bold">邻</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">海邻到家</h1>
                <p className="text-xs text-gray-500">智能便利店管理系统 V2.0</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">欢迎使用海邻到家管理系统</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">选择一个入口进入对应的功能模块</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/pos/cashier" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-orange-500">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">收银台</h3>
              <p className="text-gray-500 text-sm mb-4">快速收银、会员识别、多种支付</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">快速收银</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">晚8清货</span>
              </div>
            </div>
          </Link>

          <Link to="/dashboard" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-purple-500">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">管理后台</h3>
              <p className="text-gray-500 text-sm mb-4">门店管理、商品管理、数据报表</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">多门店</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">数据报表</span>
              </div>
            </div>
          </Link>

          <Link to="/mini" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-green-500">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">小程序商城</h3>
              <p className="text-gray-500 text-sm mb-4">商品浏览、购物车、团购接龙</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">商品浏览</span>
                <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">团购接龙</span>
              </div>
            </div>
          </Link>

          <Link to="/assistant" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-blue-500">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">店长助手</h3>
              <p className="text-gray-500 text-sm mb-4">库存盘点、数据报表、移动管理</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">库存管理</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">PWA</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-16">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">快捷功能</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/pos/cashier" className="flex items-center gap-3 p-4 bg-white rounded-xl shadow hover:shadow-md transition">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <span className="text-sm font-medium text-gray-700">快速收银</span>
            </Link>
            <Link to="/dashboard/members" className="flex items-center gap-3 p-4 bg-white rounded-xl shadow hover:shadow-md transition">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
              <span className="text-sm font-medium text-gray-700">会员管理</span>
            </Link>
            <Link to="/dashboard/products" className="flex items-center gap-3 p-4 bg-white rounded-xl shadow hover:shadow-md transition">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📦</span>
              </div>
              <span className="text-sm font-medium text-gray-700">商品管理</span>
            </Link>
            <Link to="/assistant/inventory" className="flex items-center gap-3 p-4 bg-white rounded-xl shadow hover:shadow-md transition">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
              <span className="text-sm font-medium text-gray-700">库存盘点</span>
            </Link>
          </div>
        </div>

        <div className="mt-12 p-6 bg-white rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">系统运行正常</span>
            </div>
            <div className="text-sm text-gray-400">V2.0 Build</div>
          </div>
        </div>
      </main>
    </div>
  );
}
