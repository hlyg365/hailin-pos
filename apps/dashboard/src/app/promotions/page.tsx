'use client';

import { useState } from 'react';

const promotions = [
  { id: '1', name: '晚8点清货特卖', type: '清仓特卖', discount: '8折', startDate: '2024-01-01', endDate: '2024-01-31', status: '进行中', usage: 1256 },
  { id: '2', name: '会员日双倍积分', type: '积分翻倍', discount: '2倍积分', startDate: '2024-01-01', endDate: '2024-12-31', status: '进行中', usage: 8965 },
  { id: '3', name: '满50减10', type: '满减促销', discount: '满50减10', startDate: '2024-01-10', endDate: '2024-02-10', status: '进行中', usage: 2341 },
  { id: '4', name: '生日专属折扣', type: '会员专享', discount: '9折', startDate: '2024-01-01', endDate: '2024-12-31', status: '进行中', usage: 456 },
  { id: '5', name: '新品尝鲜价', type: '折扣促销', discount: '7.5折', startDate: '2024-01-05', endDate: '2024-01-20', status: '已结束', usage: 789 },
];

const statusMap = {
  '进行中': { bg: 'bg-green-100', text: 'text-green-700' },
  '未开始': { bg: 'bg-blue-100', text: 'text-blue-700' },
  '已结束': { bg: 'bg-gray-100', text: 'text-gray-700' },
  '已暂停': { bg: 'bg-amber-100', text: 'text-amber-700' },
};

export default function PromotionsPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">促销管理</h1>
          <p className="text-gray-500 mt-1">创建和管理促销活动，共 {promotions.length} 个促销</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          创建促销
        </button>
      </div>

      {/* 促销卡片 */}
      <div className="grid grid-cols-2 gap-6">
        {promotions.map((promo) => (
          <div key={promo.id} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{promo.name}</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${statusMap[promo.status as keyof typeof statusMap].bg} ${statusMap[promo.status as keyof typeof statusMap].text}`}>
                  {promo.status}
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{promo.discount}</div>
                <div className="text-sm text-gray-500">{promo.type}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-500">开始日期</p>
                <p className="font-medium">{promo.startDate}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-500">结束日期</p>
                <p className="font-medium">{promo.endDate}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-500">已使用</p>
                <p className="font-medium text-green-600">{promo.usage}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded-lg">
                编辑
              </button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                查看详情
              </button>
              {promo.status === '进行中' && (
                <button className="px-3 py-1 text-sm text-amber-600 hover:bg-amber-50 rounded-lg">
                  暂停
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 新增促销弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">创建促销活动</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">促销名称</label>
                <input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="请输入促销名称" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">促销类型</label>
                <select className="w-full px-4 py-2 border rounded-lg">
                  <option>折扣促销</option>
                  <option>满减促销</option>
                  <option>积分翻倍</option>
                  <option>会员专享</option>
                  <option>清仓特卖</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                  <input type="date" className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                  <input type="date" className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">优惠内容</label>
                <input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="如：满100减20 或 8折" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  创建促销
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
