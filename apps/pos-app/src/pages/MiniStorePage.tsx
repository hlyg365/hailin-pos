import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProductStore, useMemberStore } from '../store';

type Tab = 'home' | 'category' | 'cart' | 'orders' | 'my';

// 轮播Banner组件
function BannerCarousel({ banners }: { banners: { image: string; title: string; subtitle: string; color: string }[] }) {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);
  
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div 
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner, i) => (
          <div
            key={i}
            className="w-full flex-shrink-0 p-6 text-white"
            style={{ background: banner.color }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">{banner.title}</h3>
                <p className="text-sm opacity-90 mb-3">{banner.subtitle}</p>
                <button className="px-4 py-2 bg-white rounded-full text-sm font-medium" style={{ color: banner.color }}>
                  立即查看
                </button>
              </div>
              <div className="text-6xl">{banner.image}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
}

// 限时秒杀组件
function FlashSale({ items }: { items: any[] }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 32, seconds: 45 });
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <span className="font-bold text-red-600">限时秒杀</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="bg-red-600 text-white px-1.5 py-0.5 rounded font-mono">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="text-gray-500">:</span>
          <span className="bg-red-600 text-white px-1.5 py-0.5 rounded font-mono">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="text-gray-500">:</span>
          <span className="bg-red-600 text-white px-1.5 py-0.5 rounded font-mono">{String(timeLeft.seconds).padStart(2, '0')}</span>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {items.map((item, i) => (
          <div key={i} className="flex-shrink-0 w-28">
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mb-2">
                <span className="text-4xl">{item.icon}</span>
              </div>
              {item.tag && (
                <span className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded">
                  {item.tag}
                </span>
              )}
            </div>
            <p className="text-sm font-medium truncate">{item.name}</p>
            <div className="flex items-center gap-1">
              <span className="text-red-600 font-bold">¥{item.price}</span>
              <span className="text-xs text-gray-400 line-through">¥{item.original}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 商品卡片组件
function ProductCard({ product, onAdd, size = 'normal' }: { product: any; onAdd: () => void; size?: 'normal' | 'large' }) {
  return (
    <div 
      className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${size === 'large' ? 'p-4' : 'p-3'}`}
      onClick={onAdd}
    >
      <div className={`relative bg-gradient-to-br from-gray-100 to-gray-200 ${size === 'large' ? 'aspect-square' : 'aspect-square'} rounded-xl flex items-center justify-center mb-2`}>
        <span className={`${size === 'large' ? 'text-5xl' : 'text-3xl'}`}>{product.icon || '🛍️'}</span>
        {product.discount && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {product.discount}
          </span>
        )}
      </div>
      <p className={`font-medium truncate ${size === 'large' ? 'text-base' : 'text-sm'}`}>{product.name}</p>
      <p className="text-xs text-gray-500 mt-0.5">{product.spec}</p>
      <div className="flex items-center justify-between mt-2">
        <div>
          <span className="text-red-600 font-bold">{size === 'large' ? '' : '¥'}{product.price}</span>
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through ml-1">¥{product.originalPrice}</span>
          )}
        </div>
        <button className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-110 transition-transform">
          +
        </button>
      </div>
    </div>
  );
}

// 团购卡片组件
function GroupBuyCard({ group, onJoin }: { group: any; onJoin: () => void }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className="relative p-4 pb-2">
        <div className="aspect-video bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
          <span className="text-5xl">{group.icon || '📦'}</span>
        </div>
        <span className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
          社区团购
        </span>
      </div>
      <div className="p-4 pt-2">
        <h4 className="font-semibold truncate">{group.name}</h4>
        <p className="text-xs text-gray-500 mt-1">{group.spec}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-2xl font-bold text-red-600">¥{group.groupPrice}</span>
          <span className="text-sm text-gray-400 line-through">¥{group.originalPrice}</span>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>已团 {group.current}/{group.target}</span>
            <span>剩余 {group.left}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all"
              style={{ width: `${(group.current / group.target) * 100}%` }}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-2">
            {group.members?.slice(0, 3).map((m: string, i: number) => (
              <div key={i} className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs">
                {m}
              </div>
            ))}
            {group.current > 3 && (
              <div className="w-7 h-7 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center text-gray-500 text-xs">
                +{group.current - 3}
              </div>
            )}
          </div>
          <button 
            onClick={onJoin}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-medium shadow-lg shadow-orange-500/30"
          >
            参与团购
          </button>
        </div>
      </div>
    </div>
  );
}

// 商品详情弹窗
function ProductDetailModal({ product, onClose, onAdd }: { product: any; onClose: () => void; onAdd: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div 
        className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">商品详情</h3>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            ✕
          </button>
        </div>
        <div className="p-4">
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-8xl">{product.icon}</span>
          </div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{product.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{product.spec}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-600">¥{product.price}</p>
              {product.originalPrice && (
                <p className="text-sm text-gray-400 line-through">¥{product.originalPrice}</p>
              )}
            </div>
          </div>
          <div className="space-y-3 mb-6">
            <h4 className="font-medium">商品介绍</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description || `${product.name}，优质商品，放心购买。本品由海邻到家精选供货，品质保证。`}
            </p>
          </div>
          <div className="space-y-2 mb-6">
            <h4 className="font-medium">配送信息</h4>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>📍</span>
              <span>配送至：本门店（预计30分钟内送达）</span>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white p-4 border-t">
          <button 
            onClick={onAdd}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-blue-500/30"
          >
            加入购物车
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MiniStorePage() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [cartItems, setCartItems] = useState<{ product: any; quantity: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderFilter, setOrderFilter] = useState('全部');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMemberCode, setShowMemberCode] = useState(false);
  
  const { products } = useProductStore();
  const { currentMember } = useMemberStore();

  // 分类数据
  const categories = [
    { id: 0, name: '推荐', icon: '✨' },
    { id: 1, name: '饮料', icon: '🥤' },
    { id: 2, name: '零食', icon: '🍪' },
    { id: 3, name: '食品', icon: '🍜' },
    { id: 4, name: '奶制品', icon: '🥛' },
    { id: 5, name: '生鲜', icon: '🥬' },
    { id: 6, name: '烘焙', icon: '🍞' },
    { id: 7, name: '日用品', icon: '🧴' },
  ];

  // Banner数据
  const banners = [
    { image: '🎁', title: '新人专属福利', subtitle: '首单满39减5元', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { image: '⚡', title: '限时秒杀', subtitle: '每日10点准时开抢', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { image: '🚚', title: '30分钟送达', subtitle: '足不出户送到家', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  ];

  // 秒杀商品
  const flashSaleItems = [
    { name: '农夫山泉', price: 1.5, original: 2, icon: '💧', tag: '热卖' },
    { name: '可口可乐', price: 2.5, original: 3, icon: '🥤', tag: '特价' },
    { name: '康师傅面', price: 3.9, original: 5, icon: '🍜', tag: '5折' },
    { name: '奥利奥', price: 5.9, original: 8, icon: '🍪', tag: '新品' },
  ];

  // 团购数据
  const groupBuys = [
    { 
      id: 1, 
      name: '农夫山泉24瓶装', 
      spec: '550ml x 24瓶/箱', 
      originalPrice: 48, 
      groupPrice: 35, 
      current: 18, 
      target: 20, 
      left: '12小时',
      icon: '💧',
      members: ['张', '李', '王'],
    },
    { 
      id: 2, 
      name: '蒙牛纯牛奶整箱', 
      spec: '250ml x 24盒/箱', 
      originalPrice: 65, 
      groupPrice: 45, 
      current: 25, 
      target: 30, 
      left: '明天12:00',
      icon: '🥛',
      members: ['赵', '钱', '孙'],
    },
    { 
      id: 3, 
      name: '金龙鱼食用油', 
      spec: '5L/桶', 
      originalPrice: 78, 
      groupPrice: 55, 
      current: 12, 
      target: 15, 
      left: '3天',
      icon: '🫒',
      members: ['周', '吴'],
    },
  ];

  // 热门商品
  const hotProducts = products.slice(0, 8).map((p: any) => ({
    ...p,
    icon: ['💧', '🥤', '🍪', '🍜', '🥛', '🍎', '🧴', '🍞'][products.indexOf(p) % 8],
    spec: '500ml',
    discount: p.category === '饮料' ? '热卖' : null,
  }));

  // 订单数据
  const orders = [
    { id: 1, no: 'MINI20240118001', items: [{ name: '农夫山泉', qty: 2 }, { name: '可口可乐', qty: 1 }], amount: 6.5, status: '待取货', time: '10:30', store: '望京店' },
    { id: 2, no: 'MINI20240118002', items: [{ name: '康师傅方便面', qty: 3 }], amount: 13.5, status: '配送中', time: '11:15', store: '望京店' },
    { id: 3, no: 'MINI20240117001', items: [{ name: '蒙牛酸奶', qty: 1 }], amount: 8.0, status: '已完成', time: '昨天', store: '望京店' },
  ];

  const orderStatus = ['全部', '待付款', '待取货', '配送中', '已完成'];
  
  // 外卖待接单
  const deliveryOrders = [
    { platform: '美团', pending: 3, processing: 1, color: '#07C160' },
    { platform: '饿了么', pending: 2, processing: 0, color: '#FF6B00' },
  ];

  // 添加到购物车
  const addToCart = (product: any) => {
    const cartProduct = {
      id: product.id || `product_${Date.now()}`,
      name: product.name,
      retailPrice: product.price || product.retailPrice,
      barcode: '',
      category: product.category || '商品',
      unit: '件',
      costPrice: 0,
      wholesalePrice: 0,
      isStandard: true,
      status: 'active' as const,
    };
    
    const existing = cartItems.find(item => item.product.id === cartProduct.id);
    if (existing) {
      setCartItems(cartItems.map(item =>
        item.product.id === cartProduct.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCartItems([...cartItems, { product: cartProduct, quantity: 1 }]);
    }
    
    // 关闭详情弹窗
    setSelectedProduct(null);
  };

  // 快捷加购
  const quickAdd = (product: any) => {
    addToCart(product);
  };

  // 计算购物车总价
  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.retailPrice * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // 筛选商品
  const filteredProducts = activeTab === 'category' 
    ? products.filter((p: any) => {
        const matchCategory = selectedCategory === 0 || p.category === categories[selectedCategory].name;
        const matchSearch = !searchQuery || p.name.includes(searchQuery);
        return matchCategory && matchSearch;
      }).map((p: any, i: number) => ({
        ...p,
        icon: categories[selectedCategory].icon,
        spec: '500ml',
        price: p.retailPrice,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      {/* 顶部 - 固定定位 */}
      <header className="bg-white sticky top-0 z-30 shadow-sm">
        {/* 搜索栏 */}
        {showSearch ? (
          <div className="p-3 bg-white">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="搜索商品..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-100 rounded-full text-sm"
                  autoFocus
                />
                <svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button 
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="px-3 py-2 text-gray-600"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 flex items-center justify-between">
            <Link to="/" className="w-10 h-10 flex items-center justify-center text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1 flex justify-center">
              <button 
                onClick={() => setShowSearch(true)}
                className="w-full max-w-xs px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-400 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                搜索商品
              </button>
            </div>
            {currentMember && (
              <button 
                onClick={() => setShowMemberCode(true)}
                className="w-10 h-10 flex items-center justify-center"
              >
                <span className="text-xl">💳</span>
              </button>
            )}
          </div>
        )}

        {/* 标签栏 */}
        <div className="flex border-t">
          {[
            { id: 'home', label: '首页', icon: '🏠' },
            { id: 'category', label: '分类', icon: '📂' },
            { id: 'cart', label: '购物车', icon: '🛒' },
            { id: 'orders', label: '订单', icon: '📋' },
            { id: 'my', label: '我的', icon: '👤' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex-1 py-3 flex items-center justify-center gap-1 text-sm transition-colors ${
                activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'cart' && cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* 首页 */}
        {activeTab === 'home' && (
          <div className="p-4 space-y-5">
            {/* Banner轮播 */}
            <BannerCarousel banners={banners} />

            {/* 快捷服务入口 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="grid grid-cols-5 gap-4">
                {[
                  { icon: '🍜', label: '到店自取', color: 'from-orange-400 to-orange-500' },
                  { icon: '🚚', label: '配送到家', color: 'from-blue-400 to-blue-500' },
                  { icon: '👥', label: '社区团购', color: 'from-purple-400 to-purple-500' },
                  { icon: '🎫', label: '优惠券', color: 'from-pink-400 to-pink-500' },
                  { icon: '💰', label: '会员码', color: 'from-green-400 to-green-500' },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => item.label === '社区团购' && setActiveTab('category')}
                    className="flex flex-col items-center"
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl shadow-lg mb-1`}>
                      {item.icon}
                    </div>
                    <span className="text-xs text-gray-600">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 限时秒杀 */}
            <FlashSale items={flashSaleItems} />

            {/* 社区团购 */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👥</span>
                  <h3 className="font-bold">社区团购</h3>
                  <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">团长火热招募中</span>
                </div>
                <button className="text-sm text-gray-500">更多团购</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {groupBuys.slice(0, 2).map(group => (
                  <GroupBuyCard 
                    key={group.id} 
                    group={group} 
                    onJoin={() => quickAdd({
                      id: `group_${group.id}`,
                      name: group.name,
                      price: group.groupPrice,
                      category: '团购',
                    })}
                  />
                ))}
              </div>
            </section>

            {/* 外卖待接单入口 */}
            {deliveryOrders.some(o => o.pending > 0) && (
              <section className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🛵</span>
                    <div>
                      <h3 className="font-semibold">外卖待接单</h3>
                      <p className="text-sm opacity-80">您有 {deliveryOrders.reduce((sum, o) => sum + o.pending, 0)} 单待处理</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-white text-green-600 rounded-full text-sm font-medium">
                    立即处理
                  </button>
                </div>
                <div className="flex gap-3">
                  {deliveryOrders.map((order, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                      <span style={{ color: order.color }}>{order.platform}</span>
                      <span className="font-bold">{order.pending}单</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 猜你喜欢 */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">❤️</span>
                  <h3 className="font-bold">猜你喜欢</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {hotProducts.map((product, i) => (
                  <ProductCard 
                    key={i} 
                    product={product}
                    onAdd={() => {
                      setSelectedProduct(product);
                    }}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* 分类 */}
        {activeTab === 'category' && (
          <div className="flex h-full" style={{ height: 'calc(100vh - 120px)' }}>
            {/* 左侧分类 */}
            <div className="w-24 bg-gray-50 overflow-y-auto">
              {categories.map((cat, i) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(i)}
                  className={`w-full p-4 flex flex-col items-center gap-1 transition-colors ${
                    selectedCategory === i 
                      ? 'bg-white text-blue-600 border-l-4 border-blue-600' 
                      : 'text-gray-600'
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs">{cat.name}</span>
                </button>
              ))}
            </div>
            
            {/* 右侧商品 */}
            <div className="flex-1 p-4 overflow-y-auto bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{categories[selectedCategory].name}</h3>
                <span className="text-sm text-gray-500">{filteredProducts.length}件商品</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product: any, i: number) => (
                  <ProductCard 
                    key={i} 
                    product={product}
                    size="large"
                    onAdd={() => setSelectedProduct(product)}
                  />
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <span className="text-5xl mb-3 block">📦</span>
                  <p>该分类暂无商品</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 购物车 */}
        {activeTab === 'cart' && (
          <div className="p-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-7xl mb-4 block">🛒</span>
                <p className="text-gray-500 text-lg">购物车是空的</p>
                <p className="text-gray-400 text-sm mt-1">快去挑选心仪的商品吧</p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-medium shadow-lg shadow-blue-500/30"
                >
                  去逛逛
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 门店信息 */}
                <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                  <span className="text-2xl">🏪</span>
                  <div className="flex-1">
                    <p className="font-medium">望京店</p>
                    <p className="text-sm text-gray-500">望京SOHO T3 B1层</p>
                  </div>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">营业中</span>
                </div>

                {/* 商品列表 */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                  {cartItems.map(item => (
                    <div key={item.product.id} className="p-4 flex items-center gap-3 border-b last:border-0">
                      <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center">
                        <span className="text-3xl">🛍️</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product.name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">¥{item.product.retailPrice.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (item.quantity === 1) {
                              setCartItems(cartItems.filter(c => c.product.id !== item.product.id));
                            } else {
                              setCartItems(cartItems.map(c =>
                                c.product.id === item.product.id ? { ...c, quantity: c.quantity - 1 } : c
                              ));
                            }
                          }}
                          className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => setCartItems(cartItems.map(c =>
                            c.product.id === item.product.id ? { ...c, quantity: c.quantity + 1 } : c
                          ))}
                          className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 配送方式 */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🚚</span>
                    <div className="flex-1">
                      <p className="font-medium">配送到家</p>
                      <p className="text-sm text-gray-500">预计30分钟内送达</p>
                    </div>
                    <span className="text-sm text-blue-600">修改</span>
                  </div>
                </div>

                {/* 优惠券 */}
                <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎫</span>
                    <span className="font-medium">优惠券</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600">2张可用</span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* 会员折扣提示 */}
                {currentMember && currentMember.level !== 'normal' && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 flex items-center gap-3 border border-blue-200">
                    <span className="text-xl">
                      {currentMember.level === 'diamond' ? '💎' : currentMember.level === 'gold' ? '🥇' : '🥈'}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-blue-600">
                        {currentMember.level === 'diamond' ? '钻石会员' : currentMember.level === 'gold' ? '金卡会员' : '银卡会员'}专享折扣
                      </p>
                      <p className="text-sm text-blue-500">
                        已为您节省 ¥{(cartTotal * (currentMember.level === 'diamond' ? 0.1 : currentMember.level === 'gold' ? 0.05 : 0.02)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {/* 结算栏 */}
                <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto bg-white border-t shadow-lg">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-500">合计</p>
                        <p className="text-2xl font-bold text-red-600">¥{cartTotal.toFixed(2)}</p>
                      </div>
                      <button 
                        onClick={() => setShowCheckout(true)}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-semibold shadow-lg shadow-blue-500/30"
                      >
                        去结算 ({cartCount})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 订单 */}
        {activeTab === 'orders' && (
          <div className="p-4">
            {/* 筛选标签 */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {orderStatus.map(status => (
                <button
                  key={status}
                  onClick={() => setOrderFilter(status)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                    orderFilter === status 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            
            {/* 订单列表 */}
            <div className="space-y-4">
              {orders.filter(o => orderFilter === '全部' || o.status === orderFilter).length === 0 ? (
                <div className="text-center py-16">
                  <span className="text-6xl mb-3 block">📋</span>
                  <p className="text-gray-500">暂无订单</p>
                </div>
              ) : (
                orders.filter(o => orderFilter === '全部' || o.status === orderFilter).map(order => (
                  <div key={order.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 flex items-center justify-between border-b">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏪</span>
                        <span className="font-medium">{order.store}</span>
                      </div>
                      <span className={`text-sm font-medium ${
                        order.status === '已完成' ? 'text-gray-500' :
                        order.status === '待取货' ? 'text-orange-600' :
                        'text-blue-600'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.name} x{item.qty}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div>
                          <p className="text-xs text-gray-500">{order.no}</p>
                          <p className="text-xs text-gray-400">{order.time}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">¥{order.amount.toFixed(2)}</p>
                          {order.status === '待取货' && (
                            <button className="mt-2 px-4 py-1.5 bg-orange-500 text-white rounded-full text-sm">
                              确认取货
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 我的 */}
        {activeTab === 'my' && (
          <div className="p-4 space-y-4">
            {/* 会员卡片 */}
            <div 
              className="bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 rounded-2xl p-5 text-white relative overflow-hidden cursor-pointer"
              onClick={() => !currentMember && setShowMemberCode(true)}
            >
              {/* 背景装饰 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              {currentMember ? (
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80">欢迎回来</p>
                      <p className="text-xl font-bold mt-1">{currentMember.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          currentMember.level === 'diamond' ? 'bg-gradient-to-r from-cyan-300 to-purple-400' :
                          currentMember.level === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                          currentMember.level === 'silver' ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                          'bg-white/20'
                        }`}>
                          {currentMember.level === 'diamond' ? '💎 钻石会员' :
                           currentMember.level === 'gold' ? '🥇 金卡会员' :
                           currentMember.level === 'silver' ? '🥈 银卡会员' : '普通会员'}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowMemberCode(true)}
                      className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center"
                    >
                      <span className="text-2xl">💳</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/20">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{currentMember.points.toLocaleString()}</p>
                      <p className="text-xs opacity-80 mt-1">积分</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">¥{currentMember.balance}</p>
                      <p className="text-xs opacity-80 mt-1">余额</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">¥{(currentMember.totalConsume / 1000).toFixed(1)}k</p>
                      <p className="text-xs opacity-80 mt-1">累计消费</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">登录享受更多优惠</p>
                    <p className="text-lg font-bold mt-1">点击登录</p>
                  </div>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>

            {/* 功能列表 */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {[
                { icon: '💳', label: '我的会员卡', desc: '查看会员权益', color: 'text-blue-500', bg: 'bg-blue-50' },
                { icon: '🎟️', label: '优惠券', desc: '查看可用优惠券', color: 'text-orange-500', bg: 'bg-orange-50', badge: 2 },
                { icon: '📍', label: '收货地址', desc: '管理收货地址', color: 'text-green-500', bg: 'bg-green-50' },
                { icon: '🏪', label: '常用门店', desc: '望京店等3家', color: 'text-purple-500', bg: 'bg-purple-50' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center`}>
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{item.badge}张</span>
                  )}
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>

            {/* 其他功能 */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {[
                { icon: '🔔', label: '消息通知', color: 'text-gray-500' },
                { icon: '❓', label: '帮助与客服', color: 'text-gray-500' },
                { icon: '⚙️', label: '设置', color: 'text-gray-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <span className="text-lg">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>

            {/* 客服电话 */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 text-center">
              <p className="text-sm text-gray-500 mb-2">客服热线</p>
              <p className="text-xl font-bold text-blue-600">400-888-8888</p>
              <p className="text-xs text-gray-400 mt-1">工作日 9:00-18:00</p>
            </div>
          </div>
        )}
      </div>

      {/* 商品详情弹窗 */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={() => addToCart(selectedProduct)}
        />
      )}

      {/* 会员码弹窗 */}
      {showMemberCode && currentMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowMemberCode(false)}>
          <div 
            className="bg-white rounded-2xl p-6 w-80 text-center"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-4">会员码</h3>
            <div className="bg-gray-100 rounded-xl p-4 mb-4">
              <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <span className="text-4xl">
                    {currentMember.level === 'diamond' ? '💎' : 
                     currentMember.level === 'gold' ? '🥇' : 
                     currentMember.level === 'silver' ? '🥈' : '👤'}
                  </span>
                  <p className="text-sm text-gray-600 mt-2">{currentMember.name}</p>
                  <p className="text-xs text-gray-400">{currentMember.phone}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">出示此码给店员扫描享受会员价</p>
            <button 
              onClick={() => setShowMemberCode(false)}
              className="mt-4 w-full py-2 bg-gray-100 rounded-lg text-gray-600"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 结算确认弹窗 */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowCheckout(false)}>
          <div 
            className="w-full bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">确认订单</h3>
              <button onClick={() => setShowCheckout(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                ✕
              </button>
            </div>
            
            {/* 收货信息 */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📍</span>
                <div className="flex-1">
                  <p className="font-medium">配送至门店自取</p>
                  <p className="text-sm text-gray-500">望京SOHO T3 B1层 望京店</p>
                </div>
              </div>
            </div>

            {/* 商品清单 */}
            <div className="mb-4">
              <h4 className="font-medium mb-2">商品清单</h4>
              {cartItems.map(item => (
                <div key={item.product.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.product.name}</span>
                    <span className="text-sm text-gray-500">x{item.quantity}</span>
                  </div>
                  <span className="text-red-600 font-medium">¥{(item.product.retailPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* 支付方式 */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">支付方式</h4>
              <div className="space-y-2">
                {[
                  { id: 'wechat', name: '微信支付', icon: '💳', color: '#07C160' },
                  { id: 'alipay', name: '支付宝', icon: '💰', color: '#1677FF' },
                  { id: 'balance', name: '余额支付', icon: '💵', color: '#722ED1', disabled: currentMember && currentMember.balance < cartTotal },
                ].map(pay => (
                  <div 
                    key={pay.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${pay.disabled ? 'opacity-50' : ''}`}
                  >
                    <span style={{ color: pay.color }} className="text-xl">{pay.icon}</span>
                    <span className="flex-1">{pay.name}</span>
                    {pay.disabled && <span className="text-xs text-red-500">余额不足</span>}
                    <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => {
                setShowCheckout(false);
                setCartItems([]);
                alert('订单提交成功！');
              }}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-blue-500/30"
            >
              确认支付 ¥{cartTotal.toFixed(2)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
