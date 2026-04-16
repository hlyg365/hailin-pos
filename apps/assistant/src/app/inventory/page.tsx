'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, Search, Filter, Plus, ChevronRight } from 'lucide-react';

const inventoryData = [
  { id: '1', name: '农夫山泉550ml', barcode: '6921166466888', category: '饮料', stock: 18, minStock: 50, price: 2, lastUpdate: '2024-01-15' },
  { id: '2', name: '可口可乐330ml', barcode: '6921234567890', category: '饮料', stock: 25, minStock: 50, price: 3, lastUpdate: '2024-01-15' },
  { id: '3', name: '康师傅方便面', barcode: '6922345678901', category: '食品', stock: 45, minStock: 30, price: 4.5, lastUpdate: '2024-01-15' },
  { id: '4', name: '双汇火腿肠', barcode: '6923456789012', category: '食品', stock: 12, minStock: 30, price: 5, lastUpdate: '2024-01-15' },
  { id: '5', name: '绿箭口香糖', barcode: '6924567890123', category: '零食', stock: 8, minStock: 20, price: 6, lastUpdate: '2024-01-14' },
  { id: '6', name: '奥利奥饼干', barcode: '6925678901234', category: '零食', stock: 35, minStock: 25, price: 8.5, lastUpdate: '2024-01-14' },
  { id: '7', name: '伊利纯牛奶', barcode: '6926789012345', category: '奶制品', stock: 28, minStock: 20, price: 12, lastUpdate: '2024-01-15' },
  { id: '8', name: '蒙牛酸奶', barcode: '6927890123456', category: '奶制品', stock: 42, minStock: 30, price: 6.5, lastUpdate: '2024-01-15' },
];

const categories = ['全部', '饮料', '食品', '零食', '奶制品', '日用品'];

export default function InventoryPage() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [filterType, setFilterType] = useState<'all' | 'low'>('all');

  const filteredData = inventoryData.filter(item => {
    const matchSearch = item.name.includes(searchValue) || item.barcode.includes(searchValue);
    const matchCategory = selectedCategory === '全部' || item.category === selectedCategory;
    const matchFilter = filterType === 'all' || (filterType === 'low' && item.stock < item.minStock);
    return matchSearch && matchCategory && matchFilter;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部 */}
      <header className="bg-white px-4 pt-12 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/" className="p-2 -ml-2">
            <span className="text-xl">←</span>
          </Link>
          <h1 className="text-xl font-bold flex-1">库存管理</h1>
          <Link href="/inventory/check" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">
            盘点
          </Link>
        </div>

        {/* 搜索 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="搜索商品名称或条码"
            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl outline-none"
          />
        </div>

        {/* 筛选标签 */}
        <div className="flex gap-2 mt-3 overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              filterType === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
          >
            全部商品
          </button>
          <button
            onClick={() => setFilterType('low')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              filterType === 'low' ? 'bg-red-500 text-white' : 'bg-gray-100'
            }`}
          >
            库存不足
          </button>
        </div>
      </header>

      {/* 分类 */}
      <div className="bg-white px-4 py-3 flex gap-2 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
              selectedCategory === cat ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 库存列表 */}
      <div className="px-4 py-4 space-y-3">
        {filteredData.map(item => (
          <div key={item.id} className="bg-white rounded-xl p-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                📦
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.barcode}</p>
                  </div>
                  <span className={`status-badge ${
                    item.stock < item.minStock ? 'status-danger' : 'status-success'
                  }`}>
                    {item.stock < item.minStock ? '库存不足' : '正常'}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="text-sm">
                    <span className="text-gray-500">库存: </span>
                    <span className={`font-bold ${item.stock < item.minStock ? 'text-red-500' : ''}`}>
                      {item.stock}
                    </span>
                    <span className="text-gray-400"> / {item.minStock}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">售价: </span>
                    <span className="font-medium">¥{item.price}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <button className="flex-1 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg">
                调整库存
              </button>
              <button className="flex-1 py-2 text-sm text-green-600 bg-green-50 rounded-lg">
                申请补货
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 底部导航 */}
      <nav className="bottom-nav">
        <Link href="/" className="nav-item">
          <Package className="icon" />
          <span className="label">首页</span>
        </Link>
        <Link href="/inventory" className="nav-item active">
          <Package className="icon" />
          <span className="label">库存</span>
        </Link>
        <Link href="/report" className="nav-item">
          <span className="icon">📊</span>
          <span className="label">报表</span>
        </Link>
        <Link href="/settings" className="nav-item">
          <span className="icon">⚙️</span>
          <span className="label">设置</span>
        </Link>
      </nav>
    </div>
  );
}
