'use client';

import { useState } from 'react';

const products = [
  { id: '1', name: '农夫山泉550ml', barcode: '6921166466888', category: '饮料', price: 2, stock: 500, sales: 1250, status: '在售' },
  { id: '2', name: '可口可乐330ml', barcode: '6921234567890', category: '饮料', price: 3, stock: 450, sales: 980, status: '在售' },
  { id: '3', name: '康师傅方便面', barcode: '6922345678901', category: '食品', price: 4.5, stock: 300, sales: 756, status: '在售' },
  { id: '4', name: '双汇火腿肠', barcode: '6923456789012', category: '食品', price: 5, stock: 200, sales: 534, status: '在售' },
  { id: '5', name: '绿箭口香糖', barcode: '6924567890123', category: '零食', price: 6, stock: 180, sales: 321, status: '在售' },
  { id: '6', name: '奥利奥饼干', barcode: '6925678901234', category: '零食', price: 8.5, stock: 150, sales: 298, status: '在售' },
  { id: '7', name: '伊利纯牛奶', barcode: '6926789012345', category: '奶制品', price: 12, stock: 100, sales: 234, status: '在售' },
  { id: '8', name: '蒙牛酸奶', barcode: '6927890123456', category: '奶制品', price: 6.5, stock: 120, sales: 198, status: '在售' },
];

const categories = ['全部', '饮料', '食品', '零食', '奶制品', '日用品'];

export default function ProductsPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredProducts = products.filter(product => {
    const matchSearch = product.name.includes(searchKeyword) || product.barcode.includes(searchKeyword);
    const matchCategory = selectedCategory === '全部' || product.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">商品管理</h1>
          <p className="text-gray-500 mt-1">管理商品信息，共 {products.length} 件商品</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新增商品
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
            placeholder="搜索商品名称或条码..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm ${
                selectedCategory === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 商品列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>商品信息</th>
              <th>条码</th>
              <th>分类</th>
              <th>售价</th>
              <th>库存</th>
              <th>销量</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="font-medium">{product.name}</div>
                </td>
                <td className="font-mono text-sm text-gray-500">{product.barcode}</td>
                <td>{product.category}</td>
                <td className="font-medium text-primary">¥{product.price}</td>
                <td>
                  <span className={product.stock < 50 ? 'text-red-500' : ''}>
                    {product.stock}
                  </span>
                </td>
                <td>{product.sales}</td>
                <td>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                    {product.status}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button className="text-sm text-primary hover:underline">编辑</button>
                    <button className="text-sm text-gray-500 hover:underline">调价</button>
                    <button className="text-sm text-red-500 hover:underline">删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">显示 1-{filteredProducts.length} 条，共 {filteredProducts.length} 条</p>
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

      {/* 新增商品弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">新增商品</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品名称</label>
                <input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="请输入商品名称" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品条码</label>
                <input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="请输入或扫描条码" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品分类</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option>饮料</option>
                    <option>食品</option>
                    <option>零食</option>
                    <option>奶制品</option>
                    <option>日用品</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品单位</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option>件</option>
                    <option>瓶</option>
                    <option>盒</option>
                    <option>袋</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">售价</label>
                  <input type="number" step="0.01" className="w-full px-4 py-2 border rounded-lg" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">成本价</label>
                  <input type="number" step="0.01" className="w-full px-4 py-2 border rounded-lg" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">初始库存</label>
                <input type="number" className="w-full px-4 py-2 border rounded-lg" placeholder="0" />
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
