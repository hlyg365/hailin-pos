import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStoreStore, useFinanceStore, useRestockStore, useAlertStore, useProductStore } from '../store';

type Tab = 'dashboard' | 'inventory' | 'restock' | 'deposit' | 'report';

export default function AssistantPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { currentStore } = useStoreStore();
  const { todaySales, todayOrders, todayCash, depositPending } = useFinanceStore();
  const { requests } = useRestockStore();
  const { lowStockAlerts, overdueAlerts } = useAlertStore();
  const { products } = useProductStore();

  const storeRequests = requests.filter(r => r.storeId === 'store001');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: '首页', icon: '📊' },
    { id: 'inventory', label: '库存', icon: '📦' },
    { id: 'restock', label: '要货', icon: '🚚' },
    { id: 'deposit', label: '缴款', icon: '💰' },
    { id: 'report', label: '报表', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部 */}
      <header className="bg-blue-600 text-white">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-white/80">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="font-semibold">店长助手</h1>
                <p className="text-sm text-blue-100">{currentStore?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">📍 {currentStore?.region}</span>
            </div>
          </div>
        </div>
        
        {/* 标签栏 */}
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 flex items-center justify-center gap-1 text-sm ${
                activeTab === tab.id ? 'bg-white/20 border-b-2 border-white' : 'text-blue-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* 内容区 */}
      <div className="p-4 pb-20">
        {/* 首页仪表盘 */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* 今日统计 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">今日销售</p>
                <p className="text-2xl font-bold text-green-600 mt-1">¥{todaySales.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">订单 {todayOrders}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">待缴款</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">¥{depositPending.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">现金收款</p>
              </div>
            </div>

            {/* 待办事项 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3">待办事项</h3>
              <div className="space-y-3">
                {lowStockAlerts.slice(0, 3).map((alert, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📦</span>
                      <div>
                        <p className="font-medium">{alert.productName} 库存不足</p>
                        <p className="text-sm text-gray-500">当前 {alert.current} / 预警 {alert.threshold}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('restock')}
                      className="px-3 py-1 bg-yellow-500 text-white text-sm rounded"
                    >
                      要货
                    </button>
                  </div>
                ))}
                
                {overdueAlerts.map((alert, i) => (
                  <div key={`o-${i}`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⏰</span>
                      <div>
                        <p className="font-medium">{alert.productName} 临期预警</p>
                        <p className="text-sm text-gray-500">剩余 {alert.daysLeft} 天</p>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-red-500 text-white text-sm rounded">
                      处理
                    </button>
                  </div>
                ))}

                {storeRequests.filter(r => r.status === 'pending').length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🚚</span>
                      <div>
                        <p className="font-medium">要货单待审核</p>
                        <p className="text-sm text-gray-500">{storeRequests.filter(r => r.status === 'pending').length} 单</p>
                      </div>
                    </div>
                    <Link to="/dashboard" className="px-3 py-1 bg-blue-500 text-white text-sm rounded">
                      查看
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* 快捷功能 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3">快捷功能</h3>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { icon: '📦', label: '库存查询', action: () => setActiveTab('inventory') },
                  { icon: '🚚', label: '我要要货', action: () => setActiveTab('restock') },
                  { icon: '💰', label: '缴款', action: () => setActiveTab('deposit') },
                  { icon: '📊', label: '销售报表', action: () => setActiveTab('report') },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-2xl mb-1">{item.icon}</span>
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 库存管理 */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">库存概览</h3>
                <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded">
                  盘点
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">85%</p>
                  <p className="text-sm text-gray-500">正常</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">12%</p>
                  <p className="text-sm text-gray-500">预警</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">3%</p>
                  <p className="text-sm text-gray-500">临期</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <input
                  type="text"
                  placeholder="搜索商品"
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg"
                />
              </div>
              <div className="divide-y">
                {products.slice(0, 8).map((product, i) => (
                  <div key={product.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span>📦</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">库存 {Math.floor(Math.random() * 100 + 20)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${Math.random() > 0.3 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.random() > 0.3 ? '充足' : '不足'}
                      </p>
                      <p className="text-xs text-gray-400">预警: 30</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 要货申请 */}
        {activeTab === 'restock' && (
          <div className="space-y-4">
            {/* 快捷要货 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3">快捷要货</h3>
              <p className="text-sm text-gray-500 mb-4">选择要补货的商品并填写数量</p>
              <div className="space-y-3">
                {lowStockAlerts.map((stockAlert, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium">{stockAlert.productName}</p>
                      <p className="text-sm text-gray-500">建议补货 {stockAlert.threshold - stockAlert.current}</p>
                    </div>
                    <button
                      className="px-4 py-2 bg-yellow-500 text-white text-sm rounded"
                      onClick={() => window.alert('要货申请已提交')}
                    >
                      一键要货
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 要货记录 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3">要货记录</h3>
              <div className="space-y-3">
                {storeRequests.map(req => (
                  <div key={req.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm">{req.orderNo || req.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        req.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                        req.status === 'approved' ? 'bg-blue-100 text-blue-600' :
                        req.status === 'shipped' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {req.status === 'pending' ? '待审核' :
                         req.status === 'approved' ? '已审核' :
                         req.status === 'shipped' ? '已发货' : '已拒绝'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{req.items.length}种商品 · ¥{req.totalAmount}</p>
                    <p className="text-xs text-gray-400 mt-1">{req.requestedAt}</p>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full py-4 bg-blue-500 text-white rounded-xl font-medium">
              + 新建要货单
            </button>
          </div>
        )}

        {/* 缴款 */}
        {activeTab === 'deposit' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-5 text-white">
              <p className="text-sm opacity-80">待缴金额</p>
              <p className="text-3xl font-bold mt-1">¥{depositPending.toLocaleString()}</p>
              <p className="text-sm opacity-80 mt-2">今日现金收款累计</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-4">缴款方式</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  <span className="text-2xl">🏦</span>
                  <div className="text-left flex-1">
                    <p className="font-medium">银行转账</p>
                    <p className="text-sm text-gray-500">转账至总公司账户</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button className="w-full flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  <span className="text-2xl">💵</span>
                  <div className="text-left flex-1">
                    <p className="font-medium">现金存款</p>
                    <p className="text-sm text-gray-500">至银行柜台存款</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3">缴款记录</h3>
              <div className="space-y-3">
                {[
                  { date: '2024-01-16', amount: 8500, status: 'confirmed' },
                  { date: '2024-01-15', amount: 9200, status: 'confirmed' },
                  { date: '2024-01-14', amount: 7800, status: 'confirmed' },
                ].map((deposit, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">¥{deposit.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{deposit.date}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                      已确认
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 报表 */}
        {activeTab === 'report' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-4">销售趋势</h3>
              <div className="h-40 flex items-end justify-between gap-2">
                {[65, 80, 45, 90, 75, 85, 95].map((value, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${value}%` }}
                    ></div>
                    <span className="text-xs text-gray-400 mt-1">{['一', '二', '三', '四', '五', '六', '日'][i]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-4">销售统计</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">今日销售</span>
                  <span className="font-semibold">¥{todaySales.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">昨日销售</span>
                  <span className="font-semibold">¥{(todaySales * 0.9).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">本周累计</span>
                  <span className="font-semibold">¥{(todaySales * 7).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">本月累计</span>
                  <span className="font-semibold">¥{(todaySales * 30).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-4">热销商品 TOP5</h3>
              <div className="space-y-3">
                {[
                  { name: '农夫山泉550ml', sales: 156, amount: 312 },
                  { name: '可口可乐330ml', sales: 128, amount: 384 },
                  { name: '康师傅方便面', sales: 95, amount: 427.5 },
                  { name: '双汇火腿肠', sales: 78, amount: 390 },
                  { name: '奥利奥饼干', sales: 65, amount: 552.5 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-yellow-100 text-yellow-600' :
                      i === 1 ? 'bg-gray-100 text-gray-600' :
                      i === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.sales}件</p>
                    </div>
                    <span className="text-red-600 font-semibold">¥{item.amount.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
