import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProductStore, useMemberStore } from '../store';

type Tab = 'home' | 'category' | 'cart' | 'orders' | 'my' | 'service';

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
  const [activeServiceTab, setActiveServiceTab] = useState(0);
  const [showServiceDetail, setShowServiceDetail] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  
  const { products } = useProductStore();
  const { currentMember } = useMemberStore();
  
  // 团长身份状态（模拟：当前用户是否是团长）
  const [isGroupLeader, setIsGroupLeader] = useState(false);
  
  // 门店选择功能
  const [selectedStore, setSelectedStore] = useState({
    id: 'store001',
    name: '望京店',
    address: '北京市朝阳区望京SOHO T1-B座',
    distance: '350m',
    phone: '010-64781234',
    businessHours: '24小时营业',
    isOpen: true,
  });
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  
  // 门店列表
  const storeList = [
    { id: 'store001', name: '望京店', address: '北京市朝阳区望京SOHO T1-B座', distance: '350m', phone: '010-64781234', businessHours: '24小时营业', isOpen: true },
    { id: 'store002', name: '中关村店', address: '北京市海淀区中关村大街1号', distance: '1.2km', phone: '010-62561234', businessHours: '07:00-23:00', isOpen: true },
    { id: 'store003', name: '国贸店', address: '北京市朝阳区国贸CBD核心区', distance: '2.5km', phone: '010-65881234', businessHours: '08:00-22:00', isOpen: true },
    { id: 'store004', name: '三里屯店', address: '北京市朝阳区三里屯太古里', distance: '3.1km', phone: '010-64181234', businessHours: '10:00-24:00', isOpen: true },
    { id: 'store005', name: '五道口店', address: '北京市海淀区五道口购物中心', distance: '4.8km', phone: '010-62681234', businessHours: '09:00-22:00', isOpen: false },
  ];
  // 团长数据
  const groupLeaderData = {
    groupName: '望京社区团购群',
    memberCount: 156,
    activeOrders: 12,
    todayEarnings: 328.5,
    totalEarnings: 5680,
    pendingOrders: [
      { id: 'GB001', product: '新鲜土鸡蛋30枚', quantity: 8, amount: 184, status: '待发货' },
      { id: 'GB002', product: '有机蔬菜套餐', quantity: 5, amount: 245, status: '待发货' },
    ],
  };

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

  // Banner数据 - 优化为更丰富的店铺展示
  const banners = [
    { image: '🏪', title: '海邻到家便利店', subtitle: '便利生活每一天', color: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)' },
    { image: '🎁', title: '新人专属福利', subtitle: '首单满39减5元', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { image: '⚡', title: '限时秒杀', subtitle: '每日10点准时开抢', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  ];

  // 排行榜数据
  const [rankType, setRankType] = useState<'sales' | 'follow'>('sales');
  const rankProducts = {
    sales: [
      { name: '农夫山泉', sales: 9999, icon: '💧' },
      { name: '可口可乐', sales: 8566, icon: '🥤' },
      { name: '康师傅方便面', sales: 7234, icon: '🍜' },
    ],
    follow: [
      { name: '蒙牛纯牛奶', follow: 5666, icon: '🥛' },
      { name: '奥利奥饼干', follow: 4333, icon: '🍪' },
      { name: '统一冰红茶', follow: 3222, icon: '🧃' },
    ],
  };

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

  // 社区服务分类
  const serviceCategories = [
    { id: 0, name: '全部', icon: '🏪' },
    { id: 1, name: '打印复印', icon: '🖨️' },
    { id: 2, name: '家电维修', icon: '🔧' },
    { id: 3, name: '洗衣干洗', icon: '👔' },
    { id: 4, name: '家政保洁', icon: '🧹' },
    { id: 5, name: '快递服务', icon: '📦' },
  ];

  // 社区服务项目
  const services = [
    { id: 1, category: 1, name: '黑白打印', icon: '📄', price: 0.2, unit: '元/张', desc: 'A4纸黑白打印', tag: '热门', provider: '海邻快印' },
    { id: 2, category: 1, name: '彩色打印', icon: '🌈', price: 1.5, unit: '元/张', desc: 'A4纸彩色打印', tag: '高清', provider: '海邻快印' },
    { id: 3, category: 1, name: '复印', icon: '📋', price: 0.1, unit: '元/张', desc: 'A4纸单面复印', provider: '海邻快印' },
    { id: 4, category: 1, name: '身份证复印', icon: '🪪', price: 1, unit: '元/张', desc: '正反两面复印', provider: '海邻快印' },
    { id: 5, category: 2, name: '小家电检修', icon: '🔌', price: 30, unit: '次', desc: '电饭煲、电水壶等', tag: '上门', provider: '邻家维修' },
    { id: 6, category: 2, name: '空调清洗', icon: '❄️', price: 80, unit: '台', desc: '挂机/柜机深度清洗', tag: '优惠', provider: '邻家维修' },
    { id: 7, category: 2, name: '油烟机清洗', icon: '🍳', price: 100, unit: '台', desc: '拆机深度清洁', provider: '邻家维修' },
    { id: 8, category: 3, name: '普通水洗', icon: '👕', price: 8, unit: '元/件', desc: '衣物水洗甩干', provider: '洁净干洗' },
    { id: 9, category: 3, name: '干洗', icon: '🎩', price: 25, unit: '元/件', desc: '西装大衣干洗', tag: '精洗', provider: '洁净干洗' },
    { id: 10, category: 3, name: '鞋类清洗', icon: '👟', price: 20, unit: '双', desc: '运动鞋清洗保养', provider: '洁净干洗' },
    { id: 11, category: 4, name: '日常保洁', icon: '✨', price: 50, unit: '小时', desc: '地面擦拭家具清洁', tag: '推荐', provider: '洁伴家政' },
    { id: 12, category: 4, name: '深度保洁', icon: '🌟', price: 100, unit: '次', desc: '全屋深度清洁', provider: '洁伴家政' },
    { id: 13, category: 5, name: '快递代收', icon: '📮', price: 0, unit: '免费', desc: '暂存24小时内取件', provider: '门店服务' },
    { id: 14, category: 5, name: '快递寄件', icon: '✉️', price: 5, unit: '元起', desc: '多家快递可选', provider: '门店服务' },
  ];

  // 筛选服务
  const filteredServices = services.filter(s => activeServiceTab === 0 || s.category === activeServiceTab);

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
        {/* 小程序标题栏 */}
        <div className="bg-white px-4 py-3 flex items-center justify-between">
          <div className="w-8"></div>
          <h1 className="text-base font-bold text-black">首页</h1>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            <button className="w-8 h-8 flex items-center justify-center text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>
        </div>

        {/* 搜索栏 - 白色圆角矩形风格 + 门店选择 */}
        <div className="px-4 pb-3 bg-white">
          <div className="flex items-center gap-3">
            {/* 门店选择 */}
            <button 
              onClick={() => setShowStoreSelector(true)}
              className="flex items-center gap-1 text-orange-500 shrink-0"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span className="text-sm font-medium max-w-[60px] truncate">{selectedStore.name}</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 搜索框 */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="搜索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearch(true)}
                className="w-full px-4 py-2.5 bg-gray-100 rounded-lg text-sm text-center"
              />
              <svg className="w-4 h-4 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-gray-400" style={{ left: '50%' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* 首页 */}
        {activeTab === 'home' && (
          <div className="p-4 space-y-5">
            {/* Banner轮播 */}
            <BannerCarousel banners={banners} />

            {/* 服务入口 - 两张大卡片+三个小图标 */}
            <div className="space-y-3">
              {/* 两张大卡片 */}
              <div className="grid grid-cols-2 gap-3">
                {/* 同城配送 */}
                <div 
                  className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl p-4 text-white relative overflow-hidden cursor-pointer"
                  onClick={() => {}}
                >
                  <div className="relative z-10">
                    <p className="text-2xl font-bold">同城配送</p>
                    <p className="text-sm opacity-90 mt-1">省心到家</p>
                  </div>
                  <div className="absolute right-2 bottom-2 text-6xl opacity-30">🛵</div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
                </div>
                
                {/* 到店自提 */}
                <div 
                  className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-4 text-white relative overflow-hidden cursor-pointer"
                  onClick={() => {}}
                >
                  <div className="relative z-10">
                    <p className="text-2xl font-bold">到店自提</p>
                    <p className="text-sm opacity-90 mt-1">方便快捷</p>
                  </div>
                  <div className="absolute right-2 bottom-2 text-6xl opacity-30">📱</div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
                </div>
              </div>

              {/* 三个功能图标 */}
              <div className="bg-white rounded-2xl p-4">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: '充', label: '在线充值', color: 'bg-purple-500', textColor: 'text-purple-500', bgColor: 'bg-purple-50' },
                    { icon: 'V', label: '会员中心', color: 'bg-orange-500', textColor: 'text-orange-500', bgColor: 'bg-orange-50' },
                    { icon: '🎁', label: '邀请有奖', color: 'bg-red-500', textColor: 'text-red-500', bgColor: 'bg-red-50' },
                  ].map((item, i) => (
                    <button key={i} className="flex flex-col items-center gap-2" onClick={() => item.label === '会员中心' && setShowMemberCode(true)}>
                      <div className={`w-12 h-12 ${item.bgColor} rounded-2xl flex items-center justify-center ${item.color === 'bg-purple-500' ? 'rotate-45' : item.color === 'bg-orange-500' ? 'rotate-45' : ''}`}>
                        {item.icon === 'V' || item.icon === '充' ? (
                          <span className={`text-xl font-bold ${item.textColor}`}>{item.icon}</span>
                        ) : (
                          <span className="text-2xl">{item.icon}</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 商品分类 - 3×2 图标矩阵 */}
            <div className="bg-white rounded-2xl p-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: '🧴', label: '生活日用', color: 'from-pink-100 to-pink-200' },
                  { icon: '🍳', label: '家居厨具', color: 'from-amber-100 to-amber-200' },
                  { icon: '🍜', label: '熟食速食', color: 'from-orange-100 to-orange-200' },
                  { icon: '🥤', label: '夏日饮品', color: 'from-cyan-100 to-cyan-200' },
                  { icon: '🛠️', label: '五金文具', color: 'from-gray-100 to-gray-200' },
                  { icon: '🧴', label: '个人护理', color: 'from-rose-100 to-rose-200' },
                ].map((cat, i) => (
                  <button 
                    key={i} 
                    className="flex flex-col items-center gap-2"
                    onClick={() => { setActiveTab('category'); setSelectedCategory(i + 1); }}
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                      <span className="text-3xl">{cat.icon}</span>
                    </div>
                    <span className="text-sm text-gray-700">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 排行榜模块 - 绿色主题 */}
            <div className="bg-white rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 flex items-center justify-between">
                <span className="text-white font-bold text-lg">排行榜</span>
                <button className="text-white/80 text-sm flex items-center gap-1">
                  更多
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {/* 排行榜标签 */}
              <div className="px-4 pt-3 pb-2 flex gap-3">
                <button
                  onClick={() => setRankType('sales')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all ${
                    rankType === 'sales' 
                      ? 'bg-green-50 text-green-600 border-2 border-green-500' 
                      : 'bg-gray-100 text-gray-500 border-2 border-transparent'
                  }`}
                >
                  🔥 销量榜
                </button>
                <button
                  onClick={() => setRankType('follow')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all ${
                    rankType === 'follow' 
                      ? 'bg-green-50 text-green-600 border-2 border-green-500' 
                      : 'bg-gray-100 text-gray-500 border-2 border-transparent'
                  }`}
                >
                  🔥 关注榜
                </button>
              </div>
              {/* 排行榜列表 */}
              <div className="px-4 pb-4 space-y-2">
                {rankProducts[rankType].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-red-500 text-white' : i === 1 ? 'bg-orange-500 text-white' : i === 2 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">{item.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400">{rankType === 'sales' ? `销量 ${item.sales.toLocaleString()}` : `关注 ${item.follow.toLocaleString()}`}</p>
                    </div>
                  </div>
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

        {/* 服务 */}
        {activeTab === 'service' && (
          <div className="p-4 space-y-4">
            {/* 服务头部 */}
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <h2 className="text-xl font-bold mb-1">社区便民服务</h2>
                <p className="text-sm opacity-90">打印复印 · 家电维修 · 洗衣干洗 · 家政保洁</p>
              </div>
            </div>

            {/* 服务分类 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="grid grid-cols-3 gap-3">
                {serviceCategories.slice(1).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveServiceTab(cat.id)}
                    className={`p-3 rounded-xl flex flex-col items-center transition-all ${
                      activeServiceTab === cat.id 
                        ? 'bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-400' 
                        : 'bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <span className="text-2xl mb-1">{cat.icon}</span>
                    <span className={`text-xs font-medium ${activeServiceTab === cat.id ? 'text-teal-600' : 'text-gray-600'}`}>
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 服务项目列表 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">服务项目</h3>
                <span className="text-sm text-gray-500">{filteredServices.length}项服务</span>
              </div>
              
              {filteredServices.map(service => (
                <div 
                  key={service.id}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                  onClick={() => { setSelectedService(service); setShowServiceDetail(true); }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl flex items-center justify-center text-2xl">
                      {service.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{service.name}</h4>
                        {service.tag && (
                          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                            {service.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{service.desc}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-teal-600">¥{service.price}</span>
                          <span className="text-xs text-gray-400 ml-1">{service.unit}</span>
                        </div>
                        <button 
                          className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full text-sm font-medium"
                          onClick={(e) => { e.stopPropagation(); setSelectedService(service); setShowServiceDetail(true); }}
                        >
                          立即预约
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 服务须知 */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span>📋</span> 服务须知
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>1. 部分服务需提前预约，门店会与您确认</p>
                <p>2. 家电维修上门费需额外支付</p>
                <p>3. 洗衣干洗预计2-3个工作日完成</p>
              </div>
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

            {/* 团长功能（仅团长可见） */}
            {isGroupLeader && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-4 text-white shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">👑</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg">团长工作台</p>
                      <p className="text-sm opacity-80">{groupLeaderData.groupName}</p>
                    </div>
                    <button 
                      onClick={() => setIsGroupLeader(false)}
                      className="text-xs bg-white/20 px-2 py-1 rounded"
                    >
                      退出团长
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/20 rounded-lg p-2 text-center">
                      <p className="text-xl font-bold">{groupLeaderData.memberCount}</p>
                      <p className="text-xs opacity-80">团员数</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2 text-center">
                      <p className="text-xl font-bold">{groupLeaderData.activeOrders}</p>
                      <p className="text-xs opacity-80">进行中</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2 text-center">
                      <p className="text-xl font-bold">¥{groupLeaderData.todayEarnings.toFixed(0)}</p>
                      <p className="text-xs opacity-80">今日收益</p>
                    </div>
                  </div>
                </div>

                {/* 待处理订单 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold">待处理订单</p>
                    <span className="text-sm text-orange-500">{groupLeaderData.pendingOrders.length} 单</span>
                  </div>
                  <div className="space-y-2">
                    {groupLeaderData.pendingOrders.map((order, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <span>📦</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{order.product}</p>
                          <p className="text-xs text-gray-500">{order.quantity}份 · ¥{order.amount}</p>
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-3 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium">
                    查看全部订单
                  </button>
                </div>

                {/* 团长功能菜单 */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  {[
                    { icon: '📢', label: '发起团购', desc: '创建新的团购活动', color: 'from-purple-500 to-pink-500' },
                    { icon: '📊', label: '业绩统计', desc: '查看佣金和业绩', color: 'from-blue-500 to-cyan-500' },
                    { icon: '👥', label: '我的团员', desc: '管理团购成员', color: 'from-green-500 to-emerald-500' },
                    { icon: '💰', label: '提现记录', desc: '佣金提现明细', color: 'from-amber-500 to-orange-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center text-white`}>
                        <span className="text-lg">{item.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 成为团长入口（非团长可见） */}
            {!isGroupLeader && (
              <div 
                className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200 cursor-pointer hover:border-amber-300 transition-colors"
                onClick={() => setIsGroupLeader(true)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">👑</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-800">申请成为团长</p>
                    <p className="text-sm text-amber-600">分享商品赚取佣金，轻松副业增收</p>
                  </div>
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            )}

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

      {/* 服务预约弹窗 */}
      {showServiceDetail && selectedService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowServiceDetail(false)}>
          <div 
            className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">服务详情</h3>
              <button onClick={() => setShowServiceDetail(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl flex items-center justify-center text-4xl">
                  {selectedService.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedService.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-teal-600">¥{selectedService.price}</span>
                    <span className="text-sm text-gray-500">{selectedService.unit}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <h4 className="font-medium mb-2">服务说明</h4>
                <p className="text-sm text-gray-600">{selectedService.desc}</p>
              </div>
              <div className="bg-teal-50 rounded-xl p-4 mb-4">
                <h4 className="font-medium mb-2">服务商</h4>
                <p className="text-teal-600">{selectedService.provider}</p>
              </div>
              <div className="mb-6">
                <h4 className="font-medium mb-2">预约时间</h4>
                <div className="grid grid-cols-4 gap-2">
                  {['今天 14:00-16:00', '今天 16:00-18:00', '明天 10:00-12:00', '明天 14:00-16:00'].map((time, i) => (
                    <button
                      key={i}
                      className={`p-2 rounded-lg text-xs text-center border ${
                        i === 0 ? 'border-teal-500 bg-teal-50 text-teal-600' : 'border-gray-200'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white p-4 border-t flex gap-3">
              <button 
                onClick={() => setShowServiceDetail(false)}
                className="flex-1 py-4 border rounded-2xl font-medium text-gray-600"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  setServiceOrders([...serviceOrders, { ...selectedService, status: '待确认', orderNo: `SRV${Date.now()}` }]);
                  setShowServiceDetail(false);
                  alert('预约成功！服务商会尽快与您联系确认。');
                }}
                className="flex-1 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-2xl font-semibold"
              >
                确认预约
              </button>
            </div>
          </div>
        </div>
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

      {/* 门店选择弹窗 */}
      {showStoreSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowStoreSelector(false)}>
          <div 
            className="w-full bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">选择门店</h3>
              <button onClick={() => setShowStoreSelector(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                ✕
              </button>
            </div>
            
            {/* 定位按钮 */}
            <button 
              onClick={() => {
                // 模拟重新定位
                const randomStore = storeList[Math.floor(Math.random() * storeList.length)];
                setSelectedStore(randomStore);
                setShowStoreSelector(false);
              }}
              className="w-full py-3 mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              重新定位获取附近门店
            </button>

            {/* 门店列表 */}
            <div className="space-y-3">
              {storeList.map(store => (
                <div
                  key={store.id}
                  onClick={() => {
                    setSelectedStore(store);
                    setShowStoreSelector(false);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedStore.id === store.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedStore.id === store.id ? 'bg-blue-500 text-white' : 'bg-gray-100'
                    }`}>
                      <span className="text-2xl">🏪</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{store.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          store.isOpen ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {store.isOpen ? '营业中' : '已打烊'}
                        </span>
                        {selectedStore.id === store.id && (
                          <span className="text-xs text-blue-500">✓ 已选择</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-1">{store.address}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          距您 {store.distance}
                        </span>
                        <span>📞 {store.phone}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">🕐 {store.businessHours}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 底部导航栏 - 参考图风格 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t z-40 safe-area-inset-bottom">
        <div className="flex">
          {/* 首页 */}
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-2.5 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'home' ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">首页</span>
          </button>

          {/* 全部分类 */}
          <button
            onClick={() => setActiveTab('category')}
            className={`flex-1 py-2.5 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'category' ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill={activeTab === 'category' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-xs">全部分类</span>
          </button>

          {/* 购物车 */}
          <button
            onClick={() => setActiveTab('cart')}
            className={`relative flex-1 py-2.5 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'cart' ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill={activeTab === 'cart' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute top-1 right-6 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
            <span className="text-xs">购物车</span>
          </button>

          {/* 我的 */}
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-2.5 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'my' ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill={activeTab === 'my' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs">我的</span>
          </button>
        </div>
      </div>
    </div>
  );
}
