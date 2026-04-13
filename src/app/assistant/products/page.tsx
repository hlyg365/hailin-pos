'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Search, 
  Package,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Filter,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  category: string;
  unit: string;
  updatedAt: number;
}

export default function AssistantProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const categories = ['全部', '饮料', '乳品', '方便食品', '零食', '肉类', '日用品'];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    setLoading(true);
    const saved = localStorage.getItem('pos_products');
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch {
        setProducts([]);
      }
    }
    setLoading(false);
  };

  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('pos_products', JSON.stringify(newProducts));
  };

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === '全部' || p.category === selectedCategory;
    const matchSearch = !searchKeyword || 
      p.name.includes(searchKeyword) || 
      p.barcode.includes(searchKeyword);
    return matchCat && matchSearch;
  });

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  const deleteProduct = (id: string) => {
    if (confirm('确定删除该商品？')) {
      saveProducts(products.filter(p => p.id !== id));
    }
  };

  const updatePrice = (id: string, newPrice: number) => {
    saveProducts(products.map(p => 
      p.id === id ? { ...p, price: newPrice, updatedAt: Date.now() } : p
    ));
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 头部 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 px-4 py-3">
          <button onClick={() => router.push('/assistant')} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">商品管理</h1>
          <button onClick={() => setShowAdd(true)} className="ml-auto p-2 bg-orange-500 text-white rounded-lg">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        {/* 搜索 */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索商品名称/条码..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl"
            />
          </div>
          
          {/* 分类标签 */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  selectedCategory === cat 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-4">
        {/* 低库存预警 */}
        {lowStockProducts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-yellow-700 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">库存预警</span>
            </div>
            <div className="space-y-1">
              {lowStockProducts.slice(0, 3).map(p => (
                <p key={p.id} className="text-sm text-yellow-600">
                  {p.name}：剩余{p.stock}件（最低{p.minStock}件）
                </p>
              ))}
              {lowStockProducts.length > 3 && (
                <p className="text-sm text-yellow-600">还有{lowStockProducts.length - 3}个商品...</p>
              )}
            </div>
          </div>
        )}

        {/* 商品统计 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-800">{products.length}</p>
            <p className="text-sm text-slate-500">商品总数</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-green-600">{products.filter(p => p.stock > p.minStock).length}</p>
            <p className="text-sm text-slate-500">库存充足</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-red-600">{lowStockProducts.length}</p>
            <p className="text-sm text-slate-500">库存不足</p>
          </div>
        </div>

        {/* 商品列表 */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>加载中...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">暂无商品</p>
            <p className="text-sm mt-2">点击右上角添加商品</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">{product.name}</h3>
                    <p className="text-sm text-slate-500">{product.barcode}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-orange-500 font-bold">¥{product.price.toFixed(2)}</span>
                      <span className={`text-sm ${product.stock <= product.minStock ? 'text-red-500' : 'text-slate-500'}`}>
                        库存: {product.stock}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => setSelectedProduct(product)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteProduct(product.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 新增商品弹窗 */}
      {showAdd && (
        <AddProductModal 
          onClose={() => setShowAdd(false)} 
          onAdd={(product) => {
            saveProducts([...products, { ...product, id: 'P' + Date.now(), updatedAt: Date.now() }]);
            setShowAdd(false);
          }}
        />
      )}

      {/* 编辑商品弹窗 */}
      {selectedProduct && (
        <EditProductModal 
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)} 
          onSave={(updated) => {
            saveProducts(products.map(p => p.id === updated.id ? updated : p));
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}

// 新增商品弹窗组件
function AddProductModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: Omit<Product, 'id' | 'updatedAt'>) => void }) {
  const [form, setForm] = useState({
    barcode: '',
    name: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    category: '饮料',
    unit: '件',
  });

  const handleSubmit = () => {
    if (!form.name || !form.price) {
      alert('请填写必填项');
      return;
    }
    onAdd({
      barcode: form.barcode || 'P' + Date.now(),
      name: form.name,
      price: parseFloat(form.price),
      cost: parseFloat(form.cost) || 0,
      stock: parseInt(form.stock) || 0,
      minStock: parseInt(form.minStock) || 10,
      category: form.category,
      unit: form.unit,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-hidden">
        <div className="bg-orange-500 text-white px-4 py-3 flex items-center justify-between">
          <h2 className="font-bold text-lg">新增商品</h2>
          <button onClick={onClose}>✕</button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">商品名称 *</label>
            <input 
              type="text" 
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              placeholder="输入商品名称"
              className="w-full p-3 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">条码</label>
            <input 
              type="text" 
              value={form.barcode}
              onChange={(e) => setForm({...form, barcode: e.target.value})}
              placeholder="扫描或输入条码"
              className="w-full p-3 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">售价 *</label>
              <input 
                type="number" 
                value={form.price}
                onChange={(e) => setForm({...form, price: e.target.value})}
                placeholder="0.00"
                className="w-full p-3 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">进价</label>
              <input 
                type="number" 
                value={form.cost}
                onChange={(e) => setForm({...form, cost: e.target.value})}
                placeholder="0.00"
                className="w-full p-3 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">库存</label>
              <input 
                type="number" 
                value={form.stock}
                onChange={(e) => setForm({...form, stock: e.target.value})}
                placeholder="0"
                className="w-full p-3 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">最低库存</label>
              <input 
                type="number" 
                value={form.minStock}
                onChange={(e) => setForm({...form, minStock: e.target.value})}
                placeholder="10"
                className="w-full p-3 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">分类</label>
              <select 
                value={form.category}
                onChange={(e) => setForm({...form, category: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-xl"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">单位</label>
              <input 
                type="text" 
                value={form.unit}
                onChange={(e) => setForm({...form, unit: e.target.value})}
                placeholder="件"
                className="w-full p-3 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          
          <button 
            onClick={handleSubmit}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold"
          >
            确认添加
          </button>
        </div>
      </div>
    </div>
  );
}

// 编辑商品弹窗组件
function EditProductModal({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (p: Product) => void }) {
  const [form, setForm] = useState({ ...product });

  const handleSubmit = () => {
    if (!form.name || !form.price) {
      alert('请填写必填项');
      return;
    }
    onSave({ ...form, updatedAt: Date.now() });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-hidden">
        <div className="bg-blue-500 text-white px-4 py-3 flex items-center justify-between">
          <h2 className="font-bold text-lg">编辑商品</h2>
          <button onClick={onClose}>✕</button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">商品名称 *</label>
            <input 
              type="text" 
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full p-3 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">条码</label>
            <input 
              type="text" 
              value={form.barcode}
              onChange={(e) => setForm({...form, barcode: e.target.value})}
              className="w-full p-3 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">售价 *</label>
              <input 
                type="number" 
                value={form.price}
                onChange={(e) => setForm({...form, price: parseFloat(e.target.value)})}
                className="w-full p-3 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">进价</label>
              <input 
                type="number" 
                value={form.cost}
                onChange={(e) => setForm({...form, cost: parseFloat(e.target.value) || 0})}
                className="w-full p-3 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">库存</label>
              <input 
                type="number" 
                value={form.stock}
                onChange={(e) => setForm({...form, stock: parseInt(e.target.value) || 0})}
                className="w-full p-3 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">最低库存</label>
              <input 
                type="number" 
                value={form.minStock}
                onChange={(e) => setForm({...form, minStock: parseInt(e.target.value) || 10})}
                className="w-full p-3 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          
          <button 
            onClick={handleSubmit}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold"
          >
            保存修改
          </button>
        </div>
      </div>
    </div>
  );
}
