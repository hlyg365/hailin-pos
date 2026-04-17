import { useState } from 'react';
import { Link } from 'react-router-dom';

type Tab = 'promo' | 'price' | 'coupon';

export default function PromotionPage() {
  const [activeTab, setActiveTab] = useState<Tab>('promo');

  // 促销模板
  const promos = [
    { id: 'P001', name: '满50减10', type: '满减', scope: '全部商品', discount: '满50减10', startTime: '2024-01-15', endTime: '2024-01-31', status: 'active', stores: '全部' },
    
    { id: 'P003', name: '第2件半价', type: '买赠', scope: '方便面', discount: '第2件半价', startTime: '2024-01-01', endTime: '2024-01-31', status: 'pending', stores: '全部' },
    { id: 'P004', name: '晚8点清货', type: '时段折扣', scope: '全场', discount: '8折', startTime: '每日20:00', endTime: '每日23:00', status: 'active', stores: '全部' },
    { id: 'P005', name: '会员日专享', type: '会员专享', scope: '全场', discount: '95折', startTime: '每周五', endTime: '长期有效', status: 'active', stores: '全部' },
  ];

  // 价格体系
  const priceLevels = [
    { id: 'L001', name: '统一定价', type: 'base', description: '全部门店统一执行总部定价', count: 120 },
    { id: 'L002', name: '区域定价', type: 'region', description: '按区域（北京/上海）差异化定价', count: 35 },
    { id: 'L003', name: '门店特价', type: 'store', description: '特定门店特殊价格', count: 12 },
    { id: 'L004', name: '时段价格', type: 'time', description: '不同时段执行不同价格', count: 8 },
  ];

  // 优惠券
  const coupons = [
    { id: 'C001', name: '新人券', type: 'new', amount: 5, threshold: 39, total: 1000, used: 328, status: 'active' },
    { id: 'C002', name: '复购券', type: 'return', amount: 10, threshold: 100, total: 500, used: 156, status: 'active' },
    { id: 'C003', name: '节日专享', type: 'festival', amount: 20, threshold: 200, total: 200, used: 45, status: 'pending' },
  ];

  // 商品定价
  const productPrices = [
    
    
    
  ];

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'promo', label: '促销模板', icon: '🎁' },
    { id: 'price', label: '价格体系', icon: '💰' },
    { id: 'coupon', label: '优惠券', icon: '🎟️' },
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
              <img src="/logo.png" alt="海邻到家" className="h-10 w-auto" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} />
              <h1 className="text-xl font-bold text-gray-800">促销与价格管理</h1>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建促销
            </button>
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
        {/* 促销模板 */}
        {activeTab === 'promo' && (
          <div className="space-y-6">
            {/* 促销类型 */}
            <div className="grid grid-cols-5 gap-4">
              {[
                { type: '满减', icon: '💵', desc: '满X减Y', count: 12 },
                { type: '折扣', icon: '🏷️', desc: 'X折起', count: 8 },
                { type: '买赠', icon: '🎁', desc: '买X赠Y', count: 5 },
                { type: '时段', icon: '⏰', desc: '限时优惠', count: 3 },
                { type: '会员', icon: '👑', desc: '会员专享', count: 4 },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md transition-all cursor-pointer">
                  <span className="text-3xl">{item.icon}</span>
                  <p className="font-medium mt-2">{item.type}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                  <p className="text-xs text-blue-600 mt-1">{item.count}个活动中</p>
                </div>
              ))}
            </div>

            {/* 促销列表 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold">促销列表</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left text-sm text-gray-500">
                      <th className="px-6 py-3">促销名称</th>
                      <th className="px-6 py-3">类型</th>
                      <th className="px-6 py-3">范围</th>
                      <th className="px-6 py-3">优惠内容</th>
                      <th className="px-6 py-3">生效时间</th>
                      <th className="px-6 py-3">适用门店</th>
                      <th className="px-6 py-3">状态</th>
                      <th className="px-6 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {promos.map(promo => (
                      <tr key={promo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{promo.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            promo.type === '满减' ? 'bg-blue-100 text-blue-600' :
                            promo.type === '折扣' ? 'bg-green-100 text-green-600' :
                            promo.type === '买赠' ? 'bg-purple-100 text-purple-600' :
                            promo.type === '时段折扣' ? 'bg-orange-100 text-orange-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                            {promo.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{promo.scope}</td>
                        <td className="px-6 py-4 text-red-600 font-semibold">{promo.discount}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          <div>{promo.startTime}</div>
                          <div>至 {promo.endTime}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{promo.stores}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            promo.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {promo.status === 'active' ? '生效中' : '待生效'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-blue-600 hover:underline text-sm mr-2">编辑</button>
                          <button className="text-red-600 hover:underline text-sm">禁用</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 价格体系 */}
        {activeTab === 'price' && (
          <div className="space-y-6">
            {/* 价格层级 */}
            <div className="grid grid-cols-4 gap-4">
              {priceLevels.map(level => (
                <div key={level.id} className="bg-white rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{level.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{level.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      level.type === 'base' ? 'bg-blue-100 text-blue-600' :
                      level.type === 'region' ? 'bg-green-100 text-green-600' :
                      level.type === 'store' ? 'bg-orange-100 text-orange-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {level.type === 'base' ? '总部' :
                       level.type === 'region' ? '区域' :
                       level.type === 'store' ? '门店' : '时段'}
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">包含 <span className="font-semibold text-gray-800">{level.count}</span> 个商品</p>
                  </div>
                  <button className="w-full mt-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100">
                    批量设置
                  </button>
                </div>
              ))}
            </div>

            {/* 商品定价明细 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">商品定价明细</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 border rounded text-sm">导出</button>
                  <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">批量导入</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left text-sm text-gray-500">
                      <th className="px-6 py-3">商品名称</th>
                      <th className="px-6 py-3">条码</th>
                      <th className="px-6 py-3">统一定价</th>
                      <th className="px-6 py-3">北京区域</th>
                      <th className="px-6 py-3">上海区域</th>
                      <th className="px-6 py-3">望京店特价</th>
                      <th className="px-6 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {productPrices.map((product, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{product.name}</td>
                        <td className="px-6 py-4 font-mono text-sm text-gray-500">{product.barcode}</td>
                        <td className="px-6 py-4 text-red-600">¥{product.basePrice}</td>
                        <td className="px-6 py-4">¥{product.beijingPrice}</td>
                        <td className="px-6 py-4">¥{product.shanghaiPrice}</td>
                        <td className="px-6 py-4">
                          <span className="text-green-600 font-semibold">¥{product.wjSpecial}</span>
                          <span className="text-xs text-orange-500 ml-1">(特价)</span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-blue-600 hover:underline text-sm">编辑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 优惠券 */}
        {activeTab === 'coupon' && (
          <div className="space-y-6">
            {/* 优惠券概览 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                <p className="text-sm opacity-80">发放中</p>
                <p className="text-3xl font-bold mt-1">1700</p>
                <p className="text-sm opacity-80 mt-2">张优惠券</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-5 text-white">
                <p className="text-sm opacity-80">已使用</p>
                <p className="text-3xl font-bold mt-1">529</p>
                <p className="text-sm opacity-80 mt-2">张优惠券</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-5 text-white">
                <p className="text-sm opacity-80">使用率</p>
                <p className="text-3xl font-bold mt-1">31.1%</p>
                <p className="text-sm opacity-80 mt-2">核销率</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-semibold">优惠券列表</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                创建优惠券
              </button>
            </div>

            {/* 优惠券列表 */}
            <div className="grid grid-cols-3 gap-4">
              {coupons.map(coupon => (
                <div key={coupon.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className={`p-5 text-center ${
                    coupon.type === 'new' ? 'bg-blue-500 text-white' :
                    coupon.type === 'return' ? 'bg-green-500 text-white' :
                    'bg-orange-500 text-white'
                  }`}>
                    <p className="text-sm opacity-80">{coupon.name}</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <span className="text-3xl font-bold">¥{coupon.amount}</span>
                    </div>
                    <p className="text-sm opacity-80 mt-1">满{coupon.threshold}元可用</p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">已发放</span>
                      <span className="font-semibold">{coupon.total}张</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-500">已使用</span>
                      <span className="font-semibold text-green-600">{coupon.used}张</span>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${(coupon.used / coupon.total) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">使用率 {((coupon.used / coupon.total) * 100).toFixed(0)}%</p>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button className="flex-1 py-2 bg-gray-100 text-gray-600 rounded text-sm">
                        详情
                      </button>
                      <button className="flex-1 py-2 bg-blue-50 text-blue-600 rounded text-sm">
                        发放
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 精准营销 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">精准营销 - 圈选人群</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input type="checkbox" className="w-5 h-5" defaultChecked />
                    <div>
                      <p className="font-medium">近30天未消费会员</p>
                      <p className="text-sm text-gray-500">约 1,280 人</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input type="checkbox" className="w-5 h-5" />
                    <div>
                      <p className="font-medium">高价值会员 (钻石+金卡)</p>
                      <p className="text-sm text-gray-500">约 984 人</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input type="checkbox" className="w-5 h-5" />
                    <div>
                      <p className="font-medium">爱喝饮料标签用户</p>
                      <p className="text-sm text-gray-500">约 2,560 人</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <button className="py-3 bg-blue-600 text-white rounded-lg">
                    发送定向优惠券
                  </button>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    已选人群: 1,280 人
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
