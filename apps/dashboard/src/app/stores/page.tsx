'use client';

import { useState } from 'react';

const stores = [
  { id: '1', name: '望京店', address: '北京市朝阳区望京街道', manager: '张经理', phone: '138****1234', todaySales: 12580, todayOrders: 356, status: '营业中' },
  { id: '2', name: '国贸店', address: '北京市朝阳区国贸CBD', manager: '李经理', phone: '139****5678', todaySales: 18230, todayOrders: 512, status: '营业中' },
  { id: '3', name: '中关村店', address: '北京市海淀区中关村', manager: '王经理', phone: '137****9012', todaySales: 9870, todayOrders: 289, status: '营业中' },
  { id: '4', name: '五道口店', address: '北京市海淀区五道口', manager: '刘经理', phone: '136****3456', todaySales: 11240, todayOrders: 324, status: '休息中' },
  { id: '5', name: '西单店', address: '北京市西城区西单', manager: '陈经理', phone: '135****7890', todaySales: 15670, todayOrders: 445, status: '营业中' },
  { id: '6', name: '王府井店', address: '北京市东城区王府井', manager: '赵经理', phone: '134****2345', todaySales: 14320, todayOrders: 398, status: '营业中' },
];

export default function StoresPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredStores = stores.filter(store => 
    store.name.includes(searchKeyword) || store.address.includes(searchKeyword)
  );

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">门店管理</h1>
          <p className="text-gray-500 mt-1">管理所有门店信息，共 {stores.length} 家门店</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新增门店
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-xl p-4 flex items-center gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索门店名称或地址..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <select className="px-4 py-2 border rounded-lg">
          <option>全部状态</option>
          <option>营业中</option>
          <option>休息中</option>
        </select>
      </div>

      {/* 门店列表 */}
      <div className="grid grid-cols-2 gap-6">
        {filteredStores.map((store) => (
          <div key={store.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{store.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{store.address}</p>
              </div>
              <span className={`px-3 py-1 text-sm rounded-full ${
                store.status === '营业中' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {store.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">今日销售额</p>
                <p className="text-xl font-bold text-primary">¥{store.todaySales.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">今日订单</p>
                <p className="text-xl font-bold text-gray-800">{store.todayOrders}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{store.manager}</span>
                <span className="mx-1">|</span>
                <span>{store.phone}</span>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded-lg">
                  编辑
                </button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                  查看详情
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">显示 1-{filteredStores.length} 条，共 {filteredStores.length} 条</p>
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
            上一页
          </button>
          <button className="px-3 py-1 bg-primary text-white rounded-lg">1</button>
          <button className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
            下一页
          </button>
        </div>
      </div>

      {/* 新增门店弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">新增门店</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">门店名称</label>
                <input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="请输入门店名称" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">门店地址</label>
                <input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="请输入门店地址" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="请输入负责人姓名" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                  <input type="tel" className="w-full px-4 py-2 border rounded-lg" placeholder="请输入联系电话" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  确认添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
