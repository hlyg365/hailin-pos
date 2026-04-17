import { useState } from 'react';
import { Link } from 'react-router-dom';

const categories = [
  { id: '1', name: '饮料', icon: '🧃' },
  { id: '2', name: '食品', icon: '🍜' },
  { id: '3', name: '日用品', icon: '🧴' },
  { id: '4', name: '零食', icon: '🍪' },
];

const products = [
  { id: '1', name: '农夫山泉', price: 2.5, originalPrice: 3, image: '💧', category: '饮料', sales: 1234 },
  { id: '2', name: '可口可乐', price: 3, originalPrice: 3.5, image: '🥤', category: '饮料', sales: 980 },
  { id: '3', name: '康师傅方便面', price: 4.5, originalPrice: 5, image: '🍜', category: '食品', sales: 2100 },
  { id: '4', name: '奥利奥饼干', price: 8.9, originalPrice: 12, image: '🍪', category: '零食', sales: 890 },
];

const groupBuys = [
  { id: '1', name: '农夫山泉整箱', price: 48, originalPrice: 60, current: 8, target: 20, image: '💧' },
  { id: '2', name: '蒙牛纯奶特惠', price: 99, originalPrice: 120, current: 15, target: 30, image: '🥛' },
];

export default function MiniStorePage() {
  const [activeTab, setActiveTab] = useState<'home' | 'cart' | 'user'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  const filteredProducts = selectedCategory ? products.filter(p => p.category === selectedCategory) : products;
  const addToCart = (productId: string) => setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = products.find(p => p.id === id);
    return sum + (product?.price || 0) * qty;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></Link>
            <h1 className="text-lg font-semibold text-gray-800">海邻商城</h1>
            <div className="relative">
              <button onClick={() => setActiveTab('cart')} className="text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{cartCount}</span>}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {activeTab === 'home' && (
          <>
            <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="搜索商品" className="flex-1 bg-transparent outline-none text-gray-700" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 mb-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><span className="text-xl">🔥</span><span className="font-semibold">团购接龙</span></div>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">进行中</span>
              </div>
              <div className="space-y-3">
                {groupBuys.map(group => (
                  <div key={group.id} className="bg-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">{group.image}</div>
                      <div className="flex-1"><div className="font-medium">{group.name}</div></div>
                      <div className="text-right"><div className="font-bold">¥{group.price}</div><div className="text-xs line-through opacity-60">¥{group.originalPrice}</div></div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-white/20 rounded-full h-2"><div className="bg-white rounded-full h-2" style={{ width: `${(group.current / group.target) * 100}%` }}></div></div>
                      <span className="text-xs">{group.current}/{group.target}人</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <div className="flex gap-3 overflow-x-auto pb-2">
                <button onClick={() => setSelectedCategory(null)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${!selectedCategory ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>全部</button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.name)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${selectedCategory === cat.name ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{cat.icon} {cat.name}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center text-5xl">{product.image}</div>
                  <div className="p-3">
                    <div className="font-medium text-gray-800 mb-1">{product.name}</div>
                    <div className="flex items-center justify-between">
                      <div><span className="text-green-500 font-bold">¥{product.price}</span><span className="text-gray-400 text-xs line-through ml-1">¥{product.originalPrice}</span></div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">已售 {product.sales}</span>
                      <button onClick={() => addToCart(product.id)} className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'cart' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">购物车</h2>
            {cartCount === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center"><div className="text-5xl mb-4">🛒</div><div className="text-gray-500 mb-4">购物车是空的</div><button onClick={() => setActiveTab('home')} className="px-6 py-2 bg-green-500 text-white rounded-lg">去逛逛</button></div>
            ) : (
              <>
                {Object.entries(cart).map(([id, qty]) => {
                  const product = products.find(p => p.id === id);
                  if (!product) return null;
                  return (
                    <div key={id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">{product.image}</div>
                      <div className="flex-1"><div className="font-medium">{product.name}</div><div className="text-green-500 font-bold">¥{product.price}</div></div>
                      <div className="flex items-center gap-2"><span className="w-8 text-center">{qty}</span></div>
                    </div>
                  );
                })}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4"><span className="text-gray-600">合计</span><span className="text-2xl font-bold text-green-500">¥{cartTotal.toFixed(2)}</span></div>
                  <button className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold">去结算 ({cartCount})</button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'user' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">👤</div>
              <div className="font-semibold text-gray-800 mb-1">未登录</div>
              <div className="text-sm text-gray-500 mb-4">登录后享受更多权益</div>
              <button className="px-8 py-2 bg-green-500 text-white rounded-lg">登录/注册</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm divide-y">
              <div className="flex items-center justify-between p-4"><div className="flex items-center gap-3"><span className="text-xl">📋</span><span>我的订单</span></div><span className="text-gray-400">›</span></div>
              <div className="flex items-center justify-between p-4"><div className="flex items-center gap-3"><span className="text-xl">🎫</span><span>优惠券</span></div><span className="text-gray-400">›</span></div>
              <div className="flex items-center justify-between p-4"><div className="flex items-center gap-3"><span className="text-xl">📍</span><span>收货地址</span></div><span className="text-gray-400">›</span></div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="max-w-lg mx-auto flex">
          <button onClick={() => setActiveTab('home')} className={`flex-1 py-3 flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-green-500' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-xs">首页</span>
          </button>
          <button onClick={() => setActiveTab('cart')} className={`flex-1 py-3 flex flex-col items-center gap-1 ${activeTab === 'cart' ? 'text-green-500' : 'text-gray-400'}`}>
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{cartCount}</span>}
            </div>
            <span className="text-xs">购物车</span>
          </button>
          <button onClick={() => setActiveTab('user')} className={`flex-1 py-3 flex flex-col items-center gap-1 ${activeTab === 'user' ? 'text-green-500' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-xs">我的</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
