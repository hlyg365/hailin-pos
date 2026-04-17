import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStoreStore, useRestockStore, useAlertStore } from '../store';

type Tab = 'overview' | 'stores' | 'products' | 'finance' | 'supply' | 'members' | 'orders' | 'staff';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { stores } = useStoreStore();
  const { requests, approveRequest, rejectRequest } = useRestockStore();
  const { lowStockAlerts, overdueAlerts } = useAlertStore();

  // 模拟数据
  const overviewData = {
    totalStores: 3,
    activeOrders: 24,
    todaySales: 12580,
    monthSales: 385600,
    memberCount: 12580,
    pendingRestocks: 5,
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: '工作台', icon: '📊' },
    { id: 'stores', label: '门店管理', icon: '🏪' },
    { id: 'products', label: '商品管理', icon: '📦' },
    { id: 'supply', label: '供应链', icon: '🚚' },
    { id: 'finance', label: '财务中心', icon: '💰' },
    { id: 'members', label: '会员管理', icon: '👥' },
    { id: 'orders', label: '订单管理', icon: '🧾' },
    { id: 'staff', label: '人员管理', icon: '👔' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-800">总部管理后台</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">总部管理员</span>
              <span className="text-gray-500 text-sm">admin@hailin.com</span>
            </div>
          </div>
          
          {/* 标签导航 */}
          <div className="flex gap-1 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 内容区 */}
      <div className="container mx-auto px-4 py-6">
        {/* 工作台 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 核心指标 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: '门店总数', value: overviewData.totalStores, icon: '🏪', color: 'blue' },
                { label: '今日销售', value: `¥${overviewData.todaySales.toLocaleString()}`, icon: '💰', color: 'green' },
                { label: '本月销售', value: `¥${(overviewData.monthSales / 10000).toFixed(1)}万`, icon: '📈', color: 'purple' },
                { label: '会员总数', value: overviewData.memberCount.toLocaleString(), icon: '👥', color: 'orange' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{item.label}</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{item.value}</p>
                    </div>
                    <div className={`w-12 h-12 bg-${item.color}-100 rounded-lg flex items-center justify-center`}>
                      <span className="text-2xl">{item.icon}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 待处理事项 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 待审核要货单 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">待审核要货单</h3>
                  <span className="bg-red-100 text-red-600 text-sm px-2 py-1 rounded-full">{requests.filter(r => r.status === 'pending').length}</span>
                </div>
                <div className="space-y-3">
                  {requests.filter(r => r.status === 'pending').map(req => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{stores.find(s => s.id === req.storeId)?.name}</p>
                        <p className="text-sm text-gray-500">¥{req.totalAmount} · {req.items.length}种商品</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveRequest(req.id)}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                        >
                          审核
                        </button>
                        <button
                          onClick={() => rejectRequest(req.id)}
                          className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded hover:bg-gray-300"
                        >
                          拒绝
                        </button>
                      </div>
                    </div>
                  ))}
                  {requests.filter(r => r.status === 'pending').length === 0 && (
                    <p className="text-center text-gray-400 py-4">暂无待审核</p>
                  )}
                </div>
              </div>

              {/* 库存预警 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">库存预警</h3>
                  <span className="bg-yellow-100 text-yellow-600 text-sm px-2 py-1 rounded-full">{lowStockAlerts.length + overdueAlerts.length}</span>
                </div>
                <div className="space-y-3">
                  {[...lowStockAlerts, ...overdueAlerts].slice(0, 5).map((alert, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          'daysLeft' in alert ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {'daysLeft' in alert ? '⏰' : '📦'}
                        </span>
                        <div>
                          <p className="font-medium">{alert.productName}</p>
                          <p className="text-sm text-gray-500">
                            {'daysLeft' in alert ? `临期 ${alert.daysLeft}天后` : `库存不足 (${alert.current}/${alert.threshold})`}
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/assistant/restock"
                        className="text-blue-600 text-sm hover:underline"
                      >
                        要货
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 门店销售排行 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">门店销售排行</h3>
              <div className="space-y-3">
                {stores.map((store, i) => (
                  <div key={store.id} className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      i === 0 ? 'bg-yellow-100 text-yellow-600' :
                      i === 1 ? 'bg-gray-100 text-gray-600' :
                      i === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{store.name}</p>
                      <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.random() * 60 + 40}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-gray-600">¥{(Math.random() * 5000 + 3000).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 门店管理 */}
        {activeTab === 'stores' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">门店列表</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                添加门店
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.map(store => (
                <div key={store.id} className="bg-white rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{store.name}</h3>
                      <p className="text-sm text-gray-500">{store.code}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      store.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {store.status === 'active' ? '营业中' : '已关闭'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">📍 {store.address}</p>
                    <p className="text-gray-600">📞 {store.phone}</p>
                    <p className="text-gray-600">📊 {store.region}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t flex gap-2">
                    <button className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100">
                      编辑
                    </button>
                    <button className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100">
                      详情
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 供应链 */}
        {activeTab === 'supply' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">供应链管理</h2>
            
            {/* 采购管理 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">总部采购订单</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3">订单号</th>
                      <th className="pb-3">供应商</th>
                      <th className="pb-3">金额</th>
                      <th className="pb-3">状态</th>
                      <th className="pb-3">创建时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { no: 'PO20240117001', supplier: '农夫山泉股份', amount: 15000, status: 'shipped' },
                      { no: 'PO20240117002', supplier: '康师傅集团', amount: 8500, status: 'approved' },
                      { no: 'PO20240116001', supplier: '伊利乳业', amount: 22000, status: 'completed' },
                    ].map((po, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 font-mono">{po.no}</td>
                        <td className="py-3">{po.supplier}</td>
                        <td className="py-3 text-red-600">¥{po.amount.toLocaleString()}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            po.status === 'shipped' ? 'bg-blue-100 text-blue-600' :
                            po.status === 'approved' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {po.status === 'shipped' ? '已发货' : po.status === 'approved' ? '待发货' : '已完成'}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">{po.no.slice(-8)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 配送管理 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">智能配送调度</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { route: '总仓 → 望京店', items: 15, eta: '2小时后' },
                  { route: '总仓 → 国贸店', items: 12, eta: '3小时后' },
                  { route: '总仓 → 中关村店', items: 8, eta: '4小时后' },
                ].map((delivery, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🚚</span>
                      <span className="font-medium">{delivery.route}</span>
                    </div>
                    <p className="text-sm text-gray-500">{delivery.items}件商品 · 预计{delivery.eta}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 财务中心 */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">财务中心</h2>
            
            {/* 对账概览 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: '今日收款', value: '¥21,540', icon: '💰', color: 'green' },
                { label: '待确认缴款', value: '¥8,500', icon: '📮', color: 'yellow' },
                { label: '本月支出', value: '¥156,000', icon: '💸', color: 'red' },
                { label: '账户余额', value: '¥892,500', icon: '🏦', color: 'blue' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{item.value}</p>
                </div>
              ))}
            </div>

            {/* 缴款单管理 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">门店缴款单</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3">门店</th>
                      <th className="pb-3">金额</th>
                      <th className="pb-3">方式</th>
                      <th className="pb-3">状态</th>
                      <th className="pb-3">时间</th>
                      <th className="pb-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { store: '望京店', amount: 8500, method: '银行转账', status: 'pending', time: '10:30' },
                      { store: '国贸店', amount: 6200, method: '银行转账', status: 'confirmed', time: '09:15' },
                      { store: '中关村店', amount: 3800, method: '现金', status: 'pending', time: '08:45' },
                    ].map((deposit, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3">{deposit.store}</td>
                        <td className="py-3 text-red-600">¥{deposit.amount.toLocaleString()}</td>
                        <td className="py-3">{deposit.method}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            deposit.status === 'confirmed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {deposit.status === 'confirmed' ? '已确认' : '待确认'}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">{deposit.time}</td>
                        <td className="py-3">
                          {deposit.status === 'pending' && (
                            <button className="text-blue-600 hover:underline text-sm">确认收款</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 会员管理 */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">会员管理 (CRM)</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="搜索手机号/姓名"
                  className="px-4 py-2 border rounded-lg"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">导出</button>
              </div>
            </div>
            
            {/* 会员等级分布 */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { level: '钻石会员', count: 128, color: 'purple' },
                { level: '金卡会员', count: 856, color: 'yellow' },
                { level: '银卡会员', count: 2350, color: 'gray' },
                { level: '普通会员', count: 9246, color: 'blue' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm text-center">
                  <div className={`w-12 h-12 mx-auto bg-${item.color}-100 rounded-full flex items-center justify-center mb-2`}>
                    <span className="text-2xl">{item.color === 'purple' ? '💎' : item.color === 'yellow' ? '🥇' : item.color === 'gray' ? '🥈' : '👤'}</span>
                  </div>
                  <p className="font-semibold">{item.count.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{item.level}</p>
                </div>
              ))}
            </div>

            {/* 会员列表 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">会员列表</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3">姓名</th>
                      <th className="pb-3">手机号</th>
                      <th className="pb-3">等级</th>
                      <th className="pb-3">积分</th>
                      <th className="pb-3">余额</th>
                      <th className="pb-3">累计消费</th>
                      <th className="pb-3">标签</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: '张伟', phone: '13700137000', level: 'diamond', points: 25000, balance: 500, consume: 35000, tags: ['高频', 'VIP'] },
                      { name: '李明', phone: '13800138000', level: 'gold', points: 5680, balance: 120, consume: 6500, tags: ['高频', '爱喝饮料'] },
                      { name: '王芳', phone: '13900139000', level: 'silver', points: 1200, balance: 50, consume: 1500, tags: ['零食爱好者'] },
                    ].map((member, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 font-medium">{member.name}</td>
                        <td className="py-3">{member.phone}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            member.level === 'diamond' ? 'bg-purple-100 text-purple-600' :
                            member.level === 'gold' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {member.level === 'diamond' ? '💎钻石' : member.level === 'gold' ? '🥇金卡' : '🥈银卡'}
                          </span>
                        </td>
                        <td className="py-3">{member.points.toLocaleString()}</td>
                        <td className="py-3 text-green-600">¥{member.balance}</td>
                        <td className="py-3">¥{member.consume.toLocaleString()}</td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            {member.tags.map((tag, j) => (
                              <span key={j} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">{tag}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 订单管理 */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">订单管理</h2>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  {['全部', 'POS', '小程序', '外卖', '团购'].map((type, i) => (
                    <button
                      key={i}
                      className={`px-3 py-1 rounded-lg text-sm ${i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="搜索订单号"
                  className="px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3">订单号</th>
                      <th className="pb-3">类型</th>
                      <th className="pb-3">门店</th>
                      <th className="pb-3">金额</th>
                      <th className="pb-3">支付方式</th>
                      <th className="pb-3">状态</th>
                      <th className="pb-3">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { no: 'POS20240117001', type: 'POS', store: '望京店', amount: 35.50, pay: '微信', status: 'completed', time: '10:30' },
                      { no: 'MINI20240117002', type: '小程序', store: '国贸店', amount: 128.00, pay: '支付宝', status: 'completed', time: '10:15' },
                      { no: 'DEL20240117003', type: '外卖', store: '中关村店', amount: 45.00, pay: '美团', status: 'completed', time: '09:50' },
                      { no: 'GRP20240117004', type: '团购', store: '望京店', amount: 89.00, pay: '微信', status: 'pending', time: '09:30' },
                    ].map((order, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 font-mono text-sm">{order.no}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            order.type === 'POS' ? 'bg-green-100 text-green-600' :
                            order.type === '小程序' ? 'bg-orange-100 text-orange-600' :
                            order.type === '外卖' ? 'bg-red-100 text-red-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {order.type}
                          </span>
                        </td>
                        <td className="py-3">{order.store}</td>
                        <td className="py-3 text-red-600">¥{order.amount.toFixed(2)}</td>
                        <td className="py-3">{order.pay}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {order.status === 'completed' ? '已完成' : '待处理'}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">{order.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 人员管理 */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">人员管理</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">添加员工</button>
            </div>

            {/* 考勤概览 */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: '今日出勤', value: '95%', icon: '✅' },
                { label: '迟到', value: '3人', icon: '⏰' },
                { label: '早退', value: '1人', icon: '🏃' },
                { label: '请假', value: '2人', icon: '🏥' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-sm text-gray-500">{item.label}</p>
                      <p className="font-semibold">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 员工列表 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">员工列表</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3">姓名</th>
                      <th className="pb-3">手机号</th>
                      <th className="pb-3">角色</th>
                      <th className="pb-3">门店</th>
                      <th className="pb-3">入职时间</th>
                      <th className="pb-3">状态</th>
                      <th className="pb-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: '张三', phone: '13800138000', role: '店长', store: '望京店', date: '2023-01-15', status: 'active' },
                      { name: '李四', phone: '13900139000', role: '收银员', store: '望京店', date: '2023-06-01', status: 'active' },
                      { name: '王五', phone: '13700137000', role: '店长', store: '国贸店', date: '2022-08-20', status: 'active' },
                      { name: '赵六', phone: '13600136000', role: '收银员', store: '中关村店', date: '2023-03-10', status: 'inactive' },
                    ].map((emp, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 font-medium">{emp.name}</td>
                        <td className="py-3">{emp.phone}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            emp.role === '店长' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="py-3">{emp.store}</td>
                        <td className="py-3 text-gray-500">{emp.date}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            emp.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {emp.status === 'active' ? '在职' : '离职'}
                          </span>
                        </td>
                        <td className="py-3">
                          <button className="text-blue-600 hover:underline text-sm mr-3">编辑</button>
                          <button className="text-red-600 hover:underline text-sm">考勤</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
