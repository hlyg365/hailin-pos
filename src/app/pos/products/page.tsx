'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Search, Edit, Trash2, Package, X, Save, Barcode, AlertTriangle } from 'lucide-react';
import { posStore, Product } from '@/lib/pos-store';

const units = ['瓶', '罐', '袋', '盒', '杯', '根', '包', '个', '箱'];
const categories = ['饮料', '乳品', '方便食品', '零食', '肉类', '日用品', '粮油', '调味品', '其他'];

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const prods = await posStore.getProducts();
    setProducts(prods);
  };

  const filteredProducts = products.filter(p => 
    !searchKeyword || p.name.includes(searchKeyword) || p.barcode.includes(searchKeyword)
  );

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      barcode: '',
      name: '',
      price: 0,
      cost: 0,
      stock: 0,
      minStock: 10,
      category: '饮料',
      unit: '瓶'
    });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.barcode) {
      alert('请填写商品名称和条码');
      return;
    }

    if (editingProduct) {
      await posStore.updateProduct(editingProduct.id, formData);
    } else {
      const newProduct: Product = {
        id: 'p_' + Date.now(),
        barcode: formData.barcode || '',
        name: formData.name || '',
        price: formData.price || 0,
        cost: formData.cost || 0,
        stock: formData.stock || 0,
        minStock: formData.minStock || 10,
        category: formData.category || '其他',
        unit: formData.unit || '个',
        supplier: formData.supplier,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await posStore.addProduct(newProduct);
    }

    await loadProducts();
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个商品吗？')) {
      await posStore.deleteProduct(id);
      await loadProducts();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 顶部 */}
      <header className="bg-white px-4 py-3 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.push('/pos/cashier')} className="flex items-center gap-1 text-slate-600 hover:text-orange-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-lg flex-1">商品管理</h1>
        <span className="text-sm text-slate-500">{products.length} 个商品</span>
        <button onClick={openAddModal} className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600">
          <Plus className="w-4 h-4" /> 添加商品
        </button>
      </header>

      {/* 搜索 */}
      <div className="p-4">
        <div className="bg-white rounded-xl p-3 flex gap-2">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索商品名称或条码..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="flex-1 outline-none"
          />
        </div>
      </div>

      {/* 商品列表 */}
      <div className="px-4 pb-4 space-y-2">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{product.name}</p>
                {product.stock <= product.minStock && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> 低库存
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">条码: {product.barcode}</p>
              <div className="flex gap-4 mt-1 text-sm">
                <span className="text-orange-500">售价: ¥{product.price.toFixed(2)}</span>
                <span className="text-slate-400">成本: ¥{product.cost.toFixed(2)}</span>
                <span className={product.stock <= product.minStock ? 'text-red-500' : 'text-slate-400'}>
                  库存: {product.stock}{product.unit}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEditModal(product)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                <Edit className="w-5 h-5" />
              </button>
              <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 添加/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-orange-500 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold">{editingProduct ? '编辑商品' : '添加商品'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">商品条码 *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.barcode || ''}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="flex-1 border border-slate-200 rounded-lg px-4 py-2"
                    placeholder="输入条码"
                  />
                  <button className="px-4 py-2 bg-slate-100 rounded-lg">
                    <Barcode className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">商品名称 *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2"
                  placeholder="输入商品名称"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">售价 *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">成本价</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost || ''}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">库存</label>
                  <input
                    type="number"
                    value={formData.stock || ''}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">最低库存</label>
                  <input
                    type="number"
                    value={formData.minStock || ''}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">分类</label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">单位</label>
                  <select
                    value={formData.unit || ''}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2"
                  >
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">供应商</label>
                <input
                  type="text"
                  value={formData.supplier || ''}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2"
                  placeholder="可选"
                />
              </div>
              <button onClick={handleSave} className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> 保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
