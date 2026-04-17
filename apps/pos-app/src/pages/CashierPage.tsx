import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const products = [
  { id: '1', name: '农夫山泉550ml', barcode: '6921166466888', price: 2, categoryId: 'drink' },
  { id: '2', name: '可口可乐330ml', barcode: '6921234567890', price: 3, categoryId: 'drink' },
  { id: '3', name: '康师傅方便面', barcode: '6922345678901', price: 4.5, categoryId: 'food' },
  { id: '4', name: '双汇火腿肠', barcode: '6923456789012', price: 5, categoryId: 'food' },
  { id: '5', name: '绿箭口香糖', barcode: '6924567890123', price: 6, categoryId: 'snack' },
  { id: '6', name: '奥利奥饼干', barcode: '6925678901234', price: 8.5, categoryId: 'snack' },
  { id: '7', name: '伊利纯牛奶', barcode: '6926789012345', price: 12, categoryId: 'dairy' },
  { id: '8', name: '蒙牛酸奶', barcode: '6927890123456', price: 6.5, categoryId: 'dairy' },
];

const categories = [
  { id: 'drink', name: '饮料', icon: '🧃' },
  { id: 'food', name: '食品', icon: '🍜' },
  { id: 'snack', name: '零食', icon: '🍪' },
  { id: 'dairy', name: '奶制品', icon: '🥛' },
];

interface CartItem {
  product: typeof products[0];
  quantity: number;
}

export default function CashierPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const isClearanceMode = currentTime.getHours() >= 20 && currentTime.getHours() < 23;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredProducts = products.filter(p => {
    if (searchKeyword && !p.name.includes(searchKeyword) && !p.barcode.includes(searchKeyword)) return false;
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    return true;
  });

  const addToCart = (product: typeof products[0]) => {
    const price = isClearanceMode ? product.price * 0.8 : product.price;
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product: { ...product, price }, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const discount = isClearanceMode ? subtotal * 0.2 : 0;
  const total = subtotal - discount;

  const handlePayment = (method: string) => {
    alert(`使用${method}支付 ¥${total.toFixed(2)}`);
    setCart([]);
    setShowPayment(false);
  };

  const getProductEmoji = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.icon || '📦';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-lg font-semibold text-gray-800">收银台</h1>
              {isClearanceMode && (
                <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full animate-pulse">
                  🔥 清货模式 8折
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{currentTime.toLocaleTimeString()}</span>
              <Link to="/pos/member" className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm">会员</Link>
              <Link to="/pos/settings" className="text-gray-500 text-sm">设置</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        <div className="flex-1 p-4">
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="搜索商品名称或扫码" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} className="flex-1 bg-transparent outline-none" />
              </div>
              <Link to="/pos/suspended" className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">📋 挂单</Link>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button onClick={() => setSelectedCategory(null)} className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${!selectedCategory ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>全部</button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${selectedCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} onClick={() => addToCart(product)} className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition active:scale-95">
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-4xl mb-3">{getProductEmoji(product.categoryId)}</div>
                <div className="font-medium text-gray-800 text-sm mb-1 truncate">{product.name}</div>
                <div className="flex items-center justify-between">
                  <span className="text-orange-500 font-bold">¥{isClearanceMode ? (product.price * 0.8).toFixed(1) : product.price}</span>
                  {isClearanceMode && <span className="text-gray-400 line-through text-xs">¥{product.price}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-96 bg-white shadow-lg border-l flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">购物车</h2>
              <span className="text-sm text-gray-500">{itemCount} 件</span>
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-5xl mb-4">🛒</div>
                <div>购物车是空的</div>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl">{getProductEmoji(item.product.categoryId)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.product.name}</div>
                      <div className="text-orange-500 text-sm">¥{item.product.price}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">-</button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center">+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-gray-400 hover:text-red-500">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t space-y-3">
            <div className="flex items-center justify-between text-sm"><span className="text-gray-500">小计</span><span className="font-medium">¥{subtotal.toFixed(2)}</span></div>
            {isClearanceMode && <div className="flex items-center justify-between text-sm"><span className="text-red-500">清货折扣</span><span className="text-red-500">-¥{discount.toFixed(2)}</span></div>}
            <div className="flex items-center justify-between text-lg font-bold"><span>合计</span><span className="text-orange-500">¥{total.toFixed(2)}</span></div>
            <div className="flex gap-2">
              <button onClick={clearCart} disabled={cart.length === 0} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-lg disabled:opacity-50">清空</button>
              <button onClick={() => setShowPayment(true)} disabled={cart.length === 0} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg disabled:bg-gray-300 font-semibold">结算</button>
            </div>
          </div>
        </div>
      </div>

      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">选择支付方式</h3>
              <button onClick={() => setShowPayment(false)} className="text-gray-400">✕</button>
            </div>
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-orange-500">¥{total.toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handlePayment('现金')} className="p-4 border-2 rounded-xl hover:border-orange-500 flex flex-col items-center gap-2"><span className="text-3xl">💵</span><span>现金</span></button>
              <button onClick={() => handlePayment('微信支付')} className="p-4 border-2 rounded-xl hover:border-green-500 flex flex-col items-center gap-2"><span className="text-3xl">💚</span><span>微信</span></button>
              <button onClick={() => handlePayment('支付宝')} className="p-4 border-2 rounded-xl hover:border-blue-500 flex flex-col items-center gap-2"><span className="text-3xl">💙</span><span>支付宝</span></button>
              <button onClick={() => handlePayment('会员卡')} className="p-4 border-2 rounded-xl hover:border-purple-500 flex flex-col items-center gap-2"><span className="text-3xl">💳</span><span>会员卡</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
