import { useState } from 'react';
import { Link } from 'react-router-dom';

type Tab = 'overview' | 'transfer' | 'inspect' | 'workorder';

export default function StoreOpsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // 调拨数据
  const transferRequests = [
    { id: 'TR001', from: '望京店', to: '国贸店', product: '农夫山泉550ml', quantity: 20, status: 'pending', createdAt: '2024-01-17 10:30' },
    { id: 'TR002', from: '中关村店', to: '望京店', product: '可口可乐330ml', quantity: 30, status: 'approved', createdAt: '2024-01-17 09:15' },
    { id: 'TR003', from: '国贸店', to: '中关村店', product: '康师傅方便面', quantity: 15, status: 'completed', createdAt: '2024-01-16 14:20' },
  ];

  // 巡店数据
  const inspections = [
    { id: 'INS001', store: '望京店', inspector: '张督导', score: 92, date: '2024-01-16', status: 'completed', issues: 2 },
    { id: 'INS002', store: '国贸店', inspector: '李督导', score: 85, date: '2024-01-15', status: 'pending', issues: 0 },
    { id: 'INS003', store: '中关村店', inspector: '张督导', score: 78, date: '2024-01-14', status: 'rejected', issues: 5 },
  ];

  // 电子工单
  const workOrders = [
    { id: 'WO001', type: 'notice', title: '春节假期营业时间调整通知', target: '全部门店', status: 'published', createdAt: '2024-01-17' },
    { id: 'WO002', type: 'training', title: '新品上架培训资料', target: '望京店,国贸店', status: 'published', createdAt: '2024-01-16' },
    { id: 'WO003', type: 'repair', title: 'POS机故障维修 - 望京店#2', target: '望京店', status: 'processing', createdAt: '2024-01-15' },
  ];

  // 门店档案
  const storeProfiles = [
    { id: 'S001', name: '望京店', code: 'WJ001', address: '朝阳区望京街道', manager: '张三', area: '北京朝阳', status: 'active', openHours: '07:00-23:00' },
    { id: 'S002', name: '国贸店', code: 'GJ001', address: '朝阳区国贸CBD', manager: '李四', area: '北京朝阳', status: 'active', openHours: '08:00-22:00' },
    { id: 'S003', name: '中关村店', code: 'ZGC001', address: '海淀区中关村', manager: '王五', area: '北京海淀', status: 'active', openHours: '08:00-22:00' },
    { id: 'S004', name: '五道口店', code: 'WDK001', address: '海淀区五道口', manager: '赵六', area: '北京海淀', status: 'active', openHours: '07:30-23:00' },
  ];

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: '门店档案', icon: '🏪' },
    { id: 'transfer', label: '调拨管理', icon: '🔄' },
    { id: 'inspect', label: '巡店管理', icon: '📋' },
    { id: 'workorder', label: '电子工单', icon: '📨' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-800">门店运营中心</h1>
            </div>
          </div>
          
          {/* 标签栏 */}
          <div className="flex gap-1 pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
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

      <div className="container mx-auto px-4 py-6">
        {/* 门店档案 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">门店档案管理</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加门店
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {storeProfiles.map(store => (
                <div key={store.id} className="bg-white rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
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
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-16">地址</span>
                      <span className="flex-1">{store.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-16">店长</span>
                      <span className="flex-1">{store.manager}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-16">区域</span>
                      <span className="flex-1">{store.area}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-16">营业</span>
                      <span className="flex-1">{store.openHours}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex gap-2">
                    <button className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100">
                      编辑
                    </button>
                    <button className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100">
                      查看详情
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 调拨管理 */}
        {activeTab === 'transfer' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">门店调拨管理</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新建调拨
              </button>
            </div>

            {/* 调拨流程说明 */}
            <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
                <span className="text-blue-800">发起调拨</span>
              </div>
              <div className="w-12 h-0.5 bg-blue-300"></div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-400 text-white rounded-full flex items-center justify-center font-bold">2</span>
                <span className="text-blue-800">总部审批</span>
              </div>
              <div className="w-12 h-0.5 bg-blue-300"></div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-300 text-white rounded-full flex items-center justify-center font-bold">3</span>
                <span className="text-blue-800">调出门店发货</span>
              </div>
              <div className="w-12 h-0.5 bg-blue-300"></div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center font-bold">4</span>
                <span className="text-gray-600">调入门店收货</span>
              </div>
            </div>

            {/* 调拨列表 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left text-sm text-gray-500">
                      <th className="px-6 py-3">调拨单号</th>
                      <th className="px-6 py-3">调出门店</th>
                      <th className="px-6 py-3">调入门店</th>
                      <th className="px-6 py-3">商品</th>
                      <th className="px-6 py-3">数量</th>
                      <th className="px-6 py-3">状态</th>
                      <th className="px-6 py-3">时间</th>
                      <th className="px-6 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transferRequests.map(req => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-sm">{req.id}</td>
                        <td className="px-6 py-4">{req.from}</td>
                        <td className="px-6 py-4">{req.to}</td>
                        <td className="px-6 py-4">{req.product}</td>
                        <td className="px-6 py-4">{req.quantity}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            req.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                            req.status === 'approved' ? 'bg-blue-100 text-blue-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {req.status === 'pending' ? '待审批' : req.status === 'approved' ? '已批准' : '已完成'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{req.createdAt}</td>
                        <td className="px-6 py-4">
                          {req.status === 'pending' && (
                            <div className="flex gap-2">
                              <button className="text-blue-600 hover:underline text-sm">批准</button>
                              <button className="text-red-600 hover:underline text-sm">拒绝</button>
                            </div>
                          )}
                          {req.status === 'approved' && (
                            <button className="text-blue-600 hover:underline text-sm">确认发货</button>
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

        {/* 巡店管理 */}
        {activeTab === 'inspect' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">巡店管理</h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                  发起巡店
                </button>
                <button className="px-4 py-2 border rounded-lg text-sm">
                  巡店模板
                </button>
              </div>
            </div>

            {/* 巡店统计 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-blue-600">12</p>
                <p className="text-sm text-gray-500">本月巡店次数</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-green-600">86.5</p>
                <p className="text-sm text-gray-500">平均得分</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-orange-600">3</p>
                <p className="text-sm text-gray-500">待整改项</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-red-600">1</p>
                <p className="text-sm text-gray-500">整改超期</p>
              </div>
            </div>

            {/* 巡店记录 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left text-sm text-gray-500">
                      <th className="px-6 py-3">巡店单号</th>
                      <th className="px-6 py-3">门店</th>
                      <th className="px-6 py-3">督导</th>
                      <th className="px-6 py-3">得分</th>
                      <th className="px-6 py-3">问题数</th>
                      <th className="px-6 py-3">日期</th>
                      <th className="px-6 py-3">状态</th>
                      <th className="px-6 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {inspections.map(ins => (
                      <tr key={ins.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-sm">{ins.id}</td>
                        <td className="px-6 py-4">{ins.store}</td>
                        <td className="px-6 py-4">{ins.inspector}</td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${
                            ins.score >= 90 ? 'text-green-600' :
                            ins.score >= 80 ? 'text-blue-600' :
                            ins.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {ins.score}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {ins.issues > 0 ? (
                            <span className="text-orange-600">{ins.issues}项待整改</span>
                          ) : (
                            <span className="text-green-600">无问题</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500">{ins.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            ins.status === 'completed' ? 'bg-green-100 text-green-600' :
                            ins.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {ins.status === 'completed' ? '已完成' : ins.status === 'pending' ? '待整改' : '已驳回'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-blue-600 hover:underline text-sm">查看详情</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 电子工单 */}
        {activeTab === 'workorder' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">电子工单</h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  发送通知
                </button>
              </div>
            </div>

            {/* 工单类型 */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { type: 'notice', icon: '📢', label: '通知公告', count: 5 },
                { type: 'training', icon: '📚', label: '培训资料', count: 3 },
                { type: 'repair', icon: '🔧', label: '设备维修', count: 2 },
                { type: 'task', icon: '📋', label: '任务下达', count: 4 },
              ].map(item => (
                <button
                  key={item.type}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
                >
                  <span className="text-3xl">{item.icon}</span>
                  <div className="text-left">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.count}条</p>
                  </div>
                </button>
              ))}
            </div>

            {/* 工单列表 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left text-sm text-gray-500">
                      <th className="px-6 py-3">工单编号</th>
                      <th className="px-6 py-3">类型</th>
                      <th className="px-6 py-3">标题</th>
                      <th className="px-6 py-3">目标门店</th>
                      <th className="px-6 py-3">状态</th>
                      <th className="px-6 py-3">创建时间</th>
                      <th className="px-6 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {workOrders.map(wo => (
                      <tr key={wo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-sm">{wo.id}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            wo.type === 'notice' ? 'bg-blue-100 text-blue-600' :
                            wo.type === 'training' ? 'bg-green-100 text-green-600' :
                            wo.type === 'repair' ? 'bg-orange-100 text-orange-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {wo.type === 'notice' ? '通知' : wo.type === 'training' ? '培训' : wo.type === 'repair' ? '维修' : '任务'}
                          </span>
                        </td>
                        <td className="px-6 py-4">{wo.title}</td>
                        <td className="px-6 py-4 text-gray-500">{wo.target}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            wo.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {wo.status === 'published' ? '已发布' : '处理中'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{wo.createdAt}</td>
                        <td className="px-6 py-4">
                          <button className="text-blue-600 hover:underline text-sm">查看</button>
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
