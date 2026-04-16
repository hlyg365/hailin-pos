'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// 模板样式接口
interface TemplateStyle {
  primaryColor: string;
  secondaryColor: string;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  accentBg: string;
}

interface TemplateConfig {
  showStoreLocation: boolean;
  showSearchBar: boolean;
  showBanner: boolean;
  showServiceTags: boolean;
  showQuickServices: boolean;
  showCategories: boolean;
  showRankings: boolean;
}

interface Template {
  id: string;
  name: string;
  style: TemplateStyle;
  config: TemplateConfig;
}

// 轮播图数据
const STORE_BANNERS = [
  { id: 1, image: '/images/hailin-store.jpg', title: '海邻到家', subtitle: '新鲜到家 实惠到家' },
  { id: 2, image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=750&h=400&fit=crop', title: '新鲜水果', subtitle: '时令水果 每日配送' },
  { id: 3, image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=750&h=400&fit=crop', title: '优惠活动', subtitle: '限时特惠 满50减10' },
];

// 服务卡片数据
const SERVICE_CARDS = [
  { id: 1, title: '同城配送', subtitle: '省心到家', gradient: 'from-orange-400 to-amber-400', icon: '🛵' },
  { id: 2, title: '到店自提', subtitle: '方便快捷', gradient: 'from-cyan-400 to-blue-400', icon: '📦' },
];

// 快捷服务入口
const QUICK_SERVICES = [
  { id: 1, icon: '充', iconBg: 'bg-purple-500', title: '在线充值', color: 'text-orange-500' },
  { id: 2, icon: '✓', iconBg: 'bg-orange-500', title: '会员中心', color: 'text-orange-500' },
  { id: 3, icon: '礼', iconBg: 'bg-red-500', title: '邀请有奖', color: 'text-orange-500' },
];

// 商品分类（与系统分类同步）
const ALL_CATEGORIES = [
  { id: 'drinks', icon: '🥤', name: '饮品', products: 126 },
  { id: 'fruits', icon: '🍎', name: '水果', products: 89 },
  { id: 'vegetables', icon: '🥬', name: '蔬菜', products: 67 },
  { id: 'snacks', icon: '🍪', name: '零食', products: 234 },
  { id: 'fresh', icon: '🥩', name: '生鲜', products: 45 },
  { id: 'daily', icon: '🏠', name: '日用品', products: 178 },
  { id: 'dairy', icon: '🥛', name: '乳品', products: 56 },
  { id: 'wine', icon: '🍺', name: '酒水', products: 78 },
  { id: 'tobacco', icon: '🚬', name: '烟草', products: 32 },
  { id: 'cosmetics', icon: '💄', name: '美妆', products: 89 },
  { id: 'medicine', icon: '💊', name: '药品', products: 45 },
  { id: 'stationery', icon: '📚', name: '文具', products: 67 },
];

// 排行榜数据
const RANKING_DATA = {
  sales: [
    { id: 1, name: '农夫山泉550ml', price: 2.00, sales: 1568, image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=100&h=100&fit=crop' },
    { id: 2, name: '康师傅红烧牛肉面', price: 4.50, sales: 1234, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=100&h=100&fit=crop' },
    { id: 3, name: '维达抽纸超韧系列', price: 12.80, sales: 986, image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=100&h=100&fit=crop' },
    { id: 4, name: '可口可乐330ml', price: 2.50, sales: 876, image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=100&h=100&fit=crop' },
  ],
  attention: [
    { id: 1, name: '元气森林气泡水', price: 5.00, attention: 2568, image: 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=100&h=100&fit=crop' },
    { id: 2, name: '三只松鼠坚果礼盒', price: 68.00, attention: 1890, image: 'https://images.unsplash.com/photo-1594901852083-c83b4f1ed8c3?w=100&h=100&fit=crop' },
    { id: 3, name: '蒙牛纯牛奶24盒装', price: 45.90, attention: 1456, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100&h=100&fit=crop' },
    { id: 4, name: '奥利奥夹心饼干', price: 8.90, attention: 1234, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=100&h=100&fit=crop' },
  ],
};

// 购物车商品数据
const CART_ITEMS = [
  { id: 1, name: '农夫山泉550ml', price: 2.00, quantity: 2, image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=100&h=100&fit=crop', selected: true },
  { id: 2, name: '康师傅红烧牛肉面', price: 4.50, quantity: 1, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=100&h=100&fit=crop', selected: true },
  { id: 3, name: '维达抽纸超韧系列', price: 12.80, quantity: 1, image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=100&h=100&fit=crop', selected: true },
];

// 会员信息
const MEMBER_INFO = {
  name: '张小明',
  phone: '138****8888',
  level: '金卡会员',
  avatar: '👤',
  points: 2580,
  coupons: 3,
  orders: 45,
  balance: 168.50,
};

// 附近门店数据
const NEARBY_STORES = [
  { id: 1, name: '海邻到家(星火路店)', distance: '350m', address: '星火路128号一层106室' },
  { id: 2, name: '海邻到家(科技园店)', distance: '680m', address: '科技园南区A栋104室' },
  { id: 3, name: '海邻到家(步行街店)', distance: '1.2km', address: '步行街商业广场B1层' },
  { id: 4, name: '海邻到家(地铁站店)', distance: '1.5km', address: '地铁站C出口商业街' },
];

const DEFAULT_STORE = NEARBY_STORES[0];

// 店铺头图轮播组件
function StoreBannerSwiper({ current, setCurrent, style }: { current: number; setCurrent: React.Dispatch<React.SetStateAction<number>>; style: TemplateStyle }) {
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % STORE_BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [setCurrent]);

  return (
    <div className="relative w-full h-44 overflow-hidden">
      <div className="flex transition-transform duration-500 h-full" style={{ transform: `translateX(-${current * 100}%)` }}>
        {STORE_BANNERS.map((banner) => (
          <div key={banner.id} className="relative flex-shrink-0 w-full h-full">
            <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h2 className="text-white font-bold text-lg">{banner.title}</h2>
              <p className="text-white/80 text-xs">{banner.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {STORE_BANNERS.map((_, index) => (
          <div key={index} className={cn("w-2 h-2 rounded-full transition-all", current === index ? "bg-white" : "bg-white/50")} />
        ))}
      </div>
    </div>
  );
}

// 首页内容
function HomePage({ template }: { template: Template }) {
  const [current, setCurrent] = useState(0);
  const [activeTab, setActiveTab] = useState<'sales' | 'attention'>('sales');
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [currentStore, setCurrentStore] = useState(DEFAULT_STORE);
  const { style, config } = template;

  const handleStoreSelect = (store: typeof NEARBY_STORES[0]) => {
    setCurrentStore(store);
    setShowStoreSelector(false);
  };

  return (
    <>
      {/* 门店定位选择 */}
      {config.showStoreLocation && (
        <div className="px-3 py-2 bg-white border-b border-gray-100">
          <button onClick={() => setShowStoreSelector(true)} className={cn("w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors", style.secondaryColor)}>
            <div className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", style.accentBg)}><span>📍</span></div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-800 text-sm">{currentStore.name}</span>
                  <span className={cn("text-xs", style.primaryColor)}>▾</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-gray-500 text-xs">{currentStore.distance}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-400 text-xs truncate max-w-[120px]">{currentStore.address}</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* 门店选择弹窗 */}
      {showStoreSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl max-h-[70vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-800 text-lg">选择门店</h3>
              <button onClick={() => setShowStoreSelector(false)} className="w-8 h-8 flex items-center justify-center text-gray-400">✕</button>
            </div>
            <div className="px-5 py-3 space-y-3 max-h-[50vh] overflow-y-auto">
              {NEARBY_STORES.map((store) => (
                <button key={store.id} onClick={() => handleStoreSelect(store)} className={cn("w-full flex items-center gap-3 p-4 rounded-2xl", currentStore.id === store.id ? `${style.secondaryColor} border-2 ${style.primaryColor.replace('text-', 'border-')}` : "bg-gray-50 border-2 border-transparent")}>
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", currentStore.id === store.id ? style.accentBg : "bg-gray-200")}><span className="text-2xl">🏪</span></div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-semibold text-sm", currentStore.id === store.id ? style.primaryColor : "text-gray-800")}>{store.name}</span>
                      {currentStore.id === store.id && <span className={cn("text-xs px-1.5 py-0.5 rounded", style.primaryColor, style.secondaryColor)}>当前</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{store.address}</div>
                  </div>
                  <span className={cn("text-sm px-3 py-1 rounded-full", currentStore.id === store.id ? `${style.accentBg} text-white` : "bg-gray-200 text-gray-600")}>{store.distance}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 店铺头图轮播 */}
      {config.showBanner && <StoreBannerSwiper current={current} setCurrent={setCurrent} style={style} />}

      {/* 搜索栏 */}
      {config.showSearchBar && (
        <div className="px-3 py-2 bg-white">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
            <span className="text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="搜索商品" className="flex-1 bg-transparent outline-none text-sm text-gray-700" />
            <button className={cn("text-xs font-medium", style.primaryColor)}>搜索</button>
          </div>
        </div>
      )}

      {/* 服务卡片 */}
      {config.showServiceTags && (
        <div className="px-3 py-2 bg-white">
          <div className="flex gap-3">
            {SERVICE_CARDS.map((card) => (
              <div key={card.id} className={cn("flex-1 relative overflow-hidden rounded-xl p-3 bg-gradient-to-br", card.gradient)}>
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-sm">{card.title}</h3>
                  <p className="text-white/80 text-xs">{card.subtitle}</p>
                </div>
                <div className="absolute right-1 bottom-1 text-3xl opacity-30">{card.icon}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-2 bg-gray-100" />

      {/* 快捷服务 */}
      {config.showQuickServices && (
        <div className="px-3 py-2 bg-white">
          <div className="flex justify-around">
            {QUICK_SERVICES.map((service) => (
              <div key={service.id} className="flex flex-col items-center gap-1">
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold", service.iconBg)}>{service.icon}</div>
                <span className={cn("text-xs font-medium", service.color)}>{service.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {config.showQuickServices && <div className="h-2 bg-gray-100" />}

      {/* 商品分类 */}
      {config.showCategories && (
        <div className="px-3 py-2 bg-white">
          <div className="grid grid-cols-3 gap-2">
            {ALL_CATEGORIES.slice(0, 6).map((cat) => (
              <div key={cat.id} className="flex flex-col items-center gap-0.5 py-1">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl">{cat.icon}</div>
                <span className="text-xs text-gray-700 font-medium">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {config.showCategories && <div className="h-2 bg-gray-100" />}

      {/* 排行榜 */}
      {config.showRankings && (
        <div className="px-3 py-2">
          <div className={cn("rounded-t-xl p-2 bg-gradient-to-r", style.gradientFrom, style.gradientTo)}>
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-sm">排行榜</span>
              <span className="text-white/80 text-xs">更多 ›</span>
            </div>
          </div>
          <div className="bg-white rounded-b-xl px-2 pb-2">
            <div className="flex gap-1 py-2">
              <button onClick={() => setActiveTab('sales')} className={cn("flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all", activeTab === 'sales' ? `bg-white ${style.primaryColor} shadow-sm border border-gray-200` : "bg-gray-100 text-gray-500")}>
                {activeTab === 'sales' && <span className="text-red-500">🔥</span>}销量榜
              </button>
              <button onClick={() => setActiveTab('attention')} className={cn("flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all", activeTab === 'attention' ? `bg-white ${style.primaryColor} shadow-sm border border-gray-200` : "bg-gray-100 text-gray-500")}>
                {activeTab === 'attention' && <span className="text-red-500">🔥</span>}关注榜
              </button>
            </div>
            <div className="space-y-1">
              {RANKING_DATA[activeTab].slice(0, 4).map((product, index) => (
                <div key={product.id} className="flex items-center gap-2 py-1">
                  <span className={cn("w-4 h-4 rounded flex items-center justify-center text-xs font-bold", index < 3 ? "bg-red-500 text-white" : "bg-gray-200 text-gray-500")}>{index + 1}</span>
                  <img src={product.image} alt={product.name} className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-800 truncate">{product.name}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-red-500 font-medium text-xs">¥{product.price.toFixed(2)}</span>
                      <span className="text-xs text-gray-400">{'sales' in product ? `售${product.sales}` : `关${product.attention}`}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 全部分类页面
function CategoriesPage({ template }: { template: Template }) {
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES[0]);
  const { style } = template;

  return (
    <div className="flex h-full">
      {/* 左侧分类导航 */}
      <div className="w-24 bg-gray-100 overflow-y-auto">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "w-full py-3 px-2 flex flex-col items-center gap-1 border-l-2 transition-all",
              selectedCategory.id === cat.id
                ? `${style.primaryColor.replace('text-', 'bg-')} ${style.primaryColor} border-orange-500 bg-white`
                : "text-gray-500 border-transparent bg-gray-50"
            )}
          >
            <span className="text-xl">{cat.icon}</span>
            <span className="text-xs">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* 右侧分类商品 */}
      <div className="flex-1 bg-white p-3 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">{selectedCategory.name}</h3>
          <span className="text-xs text-gray-400">{selectedCategory.products}件商品</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: `${selectedCategory.name}精选`, price: 9.90, image: `https://images.unsplash.com/photo-1506617420156-8e4536971650?w=200&h=200&fit=crop` },
            { name: `${selectedCategory.name}特惠装`, price: 19.90, image: `https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop` },
            { name: `${selectedCategory.name}爆款`, price: 15.80, image: `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop` },
            { name: `${selectedCategory.name}新品`, price: 12.50, image: `https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop` },
          ].map((item, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-2">
              <div className="aspect-square bg-gray-200 rounded-lg mb-2 overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-gray-800 truncate">{item.name}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-red-500 font-bold text-sm">¥{item.price.toFixed(2)}</span>
                <button className={cn("w-6 h-6 rounded-full text-white text-xs flex items-center justify-center", style.accentBg)}>+</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 购物车页面
function CartPage({ template }: { template: Template }) {
  const [cartItems, setCartItems] = useState(CART_ITEMS);
  const { style } = template;
  
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 店铺信息 */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", style.accentBg)}><span>🏪</span></div>
        <span className="font-medium text-gray-800 text-sm">海邻到家(星火路店)</span>
      </div>

      {/* 购物车列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cartItems.map((item) => (
          <div key={item.id} className="bg-white rounded-xl p-3 flex gap-3">
            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-800 font-medium">{item.name}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-red-500 font-bold">¥{item.price.toFixed(2)}</span>
                <div className="flex items-center gap-2">
                  <button className="w-6 h-6 rounded bg-gray-100 text-gray-600 flex items-center justify-center">-</button>
                  <span className="text-sm">{item.quantity}</span>
                  <button className="w-6 h-6 rounded bg-gray-100 text-gray-600 flex items-center justify-center">+</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部结算栏 */}
      <div className="bg-white border-t px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">共{totalItems}件</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-500 text-xs">合计:</span>
            <span className="text-red-500 font-bold text-lg">¥{totalPrice.toFixed(2)}</span>
          </div>
        </div>
        <button className={cn("w-full py-3 rounded-xl text-white font-bold text-center", style.gradientFrom, style.gradientTo)}>
          去结算({totalItems})
        </button>
      </div>
    </div>
  );
}

// 我的页面
// 我的页面 - 优化版
function ProfilePage({ template }: { template: Template }) {
  const { style } = template;
  
  const menuItems = [
    { icon: '📋', title: '我的订单', sub: '查看全部订单' },
    { icon: '🎫', title: '优惠券', sub: `${MEMBER_INFO.coupons}张可用` },
    { icon: '⭐', title: '我的收藏', sub: '收藏的商品' },
    { icon: '📍', title: '收货地址', sub: '管理收货地址' },
    { icon: '💰', title: '余额', sub: `¥${MEMBER_INFO.balance.toFixed(2)}` },
    { icon: '🎁', title: '积分', sub: `${MEMBER_INFO.points}积分` },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* 顶部渐变背景+装饰 */}
      <div className={cn("relative overflow-hidden px-4 pt-4 pb-12", style.gradientFrom, style.gradientTo)}>
        {/* 装饰圆形 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute top-8 right-8 w-16 h-16 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-4 left-4 w-20 h-20 bg-white/5 rounded-full"></div>
        
        {/* 会员等级标识 */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="px-3 py-1 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full text-xs font-medium text-yellow-900 shadow-sm flex items-center gap-1">
            <span className="text-sm">👑</span>
            <span>金卡会员</span>
          </div>
        </div>

        {/* 浮动用户卡片 */}
        <div className="relative z-10 bg-white rounded-2xl p-4 shadow-xl -mt-2">
          <div className="flex items-center gap-4">
            {/* 头像区域 */}
            <div className="relative">
              <div className="w-18 h-18 rounded-full bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center border-4 border-white shadow-lg">
                <span className="text-4xl">{MEMBER_INFO.avatar}</span>
              </div>
              {/* VIP标识 */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-white text-xs font-bold">V</span>
              </div>
            </div>
            
            {/* 用户信息 */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-800 font-bold text-lg">{MEMBER_INFO.name}</span>
              </div>
              <p className="text-gray-500 text-xs mt-0.5">{MEMBER_INFO.phone}</p>
            </div>
            
            {/* 设置入口 */}
            <button className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
              <span className="text-xl">⚙️</span>
            </button>
          </div>
          
          {/* 会员资产数据可视化 */}
          <div className="flex justify-around mt-4 pt-4 border-t border-gray-100">
            <div className="text-center flex-1">
              <div className="w-10 h-10 mx-auto mb-1 bg-blue-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <p className="text-lg font-bold text-gray-800">¥{MEMBER_INFO.balance.toFixed(2)}</p>
              <p className="text-xs text-gray-400">余额</p>
            </div>
            <div className="w-px bg-gray-100"></div>
            <div className="text-center flex-1">
              <div className="w-10 h-10 mx-auto mb-1 bg-orange-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">🎫</span>
              </div>
              <p className="text-lg font-bold text-orange-500">{MEMBER_INFO.points}</p>
              <p className="text-xs text-gray-400">积分</p>
            </div>
            <div className="w-px bg-gray-100"></div>
            <div className="text-center flex-1">
              <div className="w-10 h-10 mx-auto mb-1 bg-red-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">🎟️</span>
              </div>
              <p className="text-lg font-bold text-gray-800">{MEMBER_INFO.coupons}</p>
              <p className="text-xs text-gray-400">优惠券</p>
            </div>
          </div>
        </div>
      </div>

      {/* 订单统计 - 精修版 */}
      <div className="px-4 -mt-6 relative z-20">
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">📦</span>
              <span className="font-bold text-gray-800">我的订单</span>
            </div>
            <span className="text-gray-400 text-xs flex items-center gap-1">
              查看全部 <span>›</span>
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: '💳', title: '待支付', count: 0, color: 'bg-blue-50 text-blue-500' },
              { icon: '📦', title: '待发货', count: 1, color: 'bg-orange-50 text-orange-500' },
              { icon: '🚚', title: '待收货', count: 2, color: 'bg-green-50 text-green-500' },
              { icon: '⭐', title: '待评价', count: 3, color: 'bg-purple-50 text-purple-500' },
            ].map((item, idx) => (
              <button key={idx} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center relative", item.color)}>
                  <span className="text-2xl">{item.icon}</span>
                  {item.count > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {item.count}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {menuItems.map((item, idx) => (
            <div key={idx} className={cn("flex items-center gap-4 p-4", idx < menuItems.length - 1 && "border-b border-gray-50")}>
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                <span className="text-lg">{item.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800 font-medium">{item.title}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
              <span className="text-gray-300">›</span>
            </div>
          ))}
        </div>
      </div>

      {/* 联系客服 */}
      <div className="px-4 pb-4">
        <button className="w-full py-3 bg-white rounded-xl text-gray-600 text-sm flex items-center justify-center gap-2 shadow-sm">
          <span>📞</span>
          <span>联系客服</span>
        </button>
      </div>
    </div>
  );
}

// 积分商城页面
function PointsMallPage({ template }: { template: Template }) {
  const { style } = template;
  
  // 积分余额
  const myPoints = MEMBER_INFO.points;
  
  // 积分商品分类
  const categories = ['全部', '美食兑换', '生活用品', '数码配件', '服饰鞋包'];
  const [activeCategory, setActiveCategory] = useState('全部');
  
  // 积分商品列表
  const pointsProducts = [
    { id: 1, name: '农夫山泉550ml', points: 100, image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=200&h=200&fit=crop', stock: 520, sold: 1280 },
    { id: 2, name: '可口可乐330ml', points: 150, image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=200&h=200&fit=crop', stock: 320, sold: 890 },
    { id: 3, name: '维达抽纸一提', points: 500, image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=200&h=200&fit=crop', stock: 180, sold: 560 },
    { id: 4, name: '蒙牛纯牛奶一箱', points: 800, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&h=200&fit=crop', stock: 95, sold: 420 },
    { id: 5, name: '三只松鼠坚果一袋', points: 1200, image: 'https://images.unsplash.com/photo-1594901852083-c83b4f1ed8c3?w=200&h=200&fit=crop', stock: 68, sold: 310 },
    { id: 6, name: '充电宝5000mAh', points: 2000, image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=200&h=200&fit=crop', stock: 45, sold: 180 },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 积分余额卡片 */}
      <div className={cn("p-4 bg-gradient-to-r", style.gradientFrom, style.gradientTo)}>
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs">我的积分</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={cn("text-3xl font-bold", style.primaryColor)}>{myPoints}</span>
                <span className="text-gray-400 text-sm">积分</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button className={cn("px-4 py-1.5 rounded-full text-white text-xs font-medium", style.accentBg)}>
                积分规则
              </button>
              <p className="text-xs text-gray-400">每100积分抵1元</p>
            </div>
          </div>
        </div>
      </div>

      {/* 积分Banner */}
      <div className="px-4 py-3 bg-white">
        <div className={cn("rounded-xl p-3 bg-gradient-to-r from-yellow-50 to-orange-50 flex items-center justify-between")}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-sm font-bold text-gray-800">积分兑换专区</p>
              <p className="text-xs text-gray-500">更多好物等你来兑</p>
            </div>
          </div>
          <span className={cn("text-xs px-2 py-1 rounded-full", style.primaryColor, style.secondaryColor)}>
            热门
          </span>
        </div>
      </div>

      {/* 分类标签 */}
      <div className="bg-white px-4 py-2 border-b">
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all",
                activeCategory === cat
                  ? `${style.accentBg} text-white`
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 商品列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {pointsProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="aspect-square bg-gray-100 relative">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  售{product.sold}
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm text-gray-800 font-medium truncate">{product.name}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className={cn("text-sm font-bold", style.primaryColor)}>{product.points}</span>
                  <span className="text-xs text-gray-400">积分</span>
                </div>
                <button className={cn("w-full mt-2 py-1.5 rounded-lg text-white text-xs font-medium", style.accentBg)}>
                  立即兑换
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部说明 */}
      <div className="bg-white p-3 border-t">
        <p className="text-xs text-gray-400 text-center">
          兑换商品请到门店自提或联系客服配送
        </p>
      </div>
    </div>
  );
}

// 底部导航栏
function TabBar({ activeTab, onTabChange, template }: { activeTab: string; onTabChange: (tab: string) => void; template: Template }) {
  const { style } = template;
  
  const tabs = [
    { id: 'home', icon: '🏠', title: '首页' },
    { id: 'categories', icon: '📋', title: '全部分类' },
    { id: 'cart', icon: '🛒', title: '购物车', badge: 3 },
    { id: 'points', icon: '🎁', title: '积分商城' },
    { id: 'profile', icon: '👤', title: '我的' },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200">
      <div className="flex justify-around py-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn("flex flex-col items-center gap-0.5 py-0.5 px-2 relative", activeTab === tab.id ? style.primaryColor : "text-gray-500")}
          >
            <div className="relative text-lg">
              {tab.icon}
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{tab.badge}</span>
              )}
            </div>
            <span className="text-xs">{tab.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// 主页面组件
export default function MiniStorePreview({ template }: { template?: Template }) {
  const [activeTab, setActiveTab] = useState('home');
  
  // 默认模板
  const defaultTemplate: Template = {
    id: 'vibrant-orange',
    name: '活力橙风',
    style: {
      primaryColor: 'text-orange-500',
      secondaryColor: 'bg-orange-50',
      gradientFrom: 'from-orange-400',
      gradientTo: 'to-amber-400',
      accentColor: 'text-orange-600',
      accentBg: 'bg-orange-500',
    },
    config: {
      showStoreLocation: true,
      showSearchBar: true,
      showBanner: true,
      showServiceTags: true,
      showQuickServices: true,
      showCategories: true,
      showRankings: true,
    },
  };

  const activeTemplate = template || defaultTemplate;
  const { style } = activeTemplate;

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage template={activeTemplate} />;
      case 'categories':
        return <CategoriesPage template={activeTemplate} />;
      case 'cart':
        return <CartPage template={activeTemplate} />;
      case 'points':
        return <PointsMallPage template={activeTemplate} />;
      case 'profile':
        return <ProfilePage template={activeTemplate} />;
      default:
        return <HomePage template={activeTemplate} />;
    }
  };

  return (
    <div className="w-[320px] h-[650px] bg-gray-50 rounded-[40px] overflow-hidden border-4 border-gray-800 shadow-2xl relative">
      {/* 手机状态栏 */}
      <div className="h-7 bg-gray-900 flex items-center justify-between px-4 text-white text-xs">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <span>📶</span>
          <span>📡</span>
          <span>🔋 100%</span>
        </div>
      </div>

      {/* 小程序头部 */}
      <div className={cn("bg-gradient-to-r", style.gradientFrom, style.gradientTo)}>
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="w-6" />
          <h1 className="text-base font-bold text-white">
            {activeTab === 'home' && '首页'}
            {activeTab === 'categories' && '全部分类'}
            {activeTab === 'cart' && '购物车'}
            {activeTab === 'points' && '积分商城'}
            {activeTab === 'profile' && '我的'}
          </h1>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center text-white/80">⋯</div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="h-[calc(100%-120px)] overflow-hidden">
        {renderContent()}
      </div>

      {/* 底部导航栏 */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} template={activeTemplate} />
    </div>
  );
}
