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

// 模板配置
const TEMPLATES: Template[] = [
  {
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
  },
  {
    id: 'fresh-green',
    name: '清新绿色',
    style: {
      primaryColor: 'text-green-600',
      secondaryColor: 'bg-green-50',
      gradientFrom: 'from-green-500',
      gradientTo: 'to-emerald-400',
      accentColor: 'text-green-600',
      accentBg: 'bg-green-500',
    },
    config: {
      showStoreLocation: true,
      showSearchBar: true,
      showBanner: true,
      showServiceTags: true,
      showQuickServices: false,
      showCategories: true,
      showRankings: true,
    },
  },
  {
    id: 'professional-blue',
    name: '商务蓝调',
    style: {
      primaryColor: 'text-blue-600',
      secondaryColor: 'bg-blue-50',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-600',
      accentColor: 'text-blue-600',
      accentBg: 'bg-blue-500',
    },
    config: {
      showStoreLocation: true,
      showSearchBar: true,
      showBanner: true,
      showServiceTags: false,
      showQuickServices: false,
      showCategories: true,
      showRankings: false,
    },
  },
  {
    id: 'classic-red',
    name: '经典红韵',
    style: {
      primaryColor: 'text-red-500',
      secondaryColor: 'bg-red-50',
      gradientFrom: 'from-red-400',
      gradientTo: 'to-red-500',
      accentColor: 'text-red-500',
      accentBg: 'bg-red-500',
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
  },
];

// 轮播图数据
const STORE_BANNERS = [
  {
    id: 1,
    image: '/images/hailin-store.jpg',
    title: '海邻到家',
    subtitle: '新鲜到家 实惠到家',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=750&h=400&fit=crop',
    title: '新鲜水果',
    subtitle: '时令水果 每日配送',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=750&h=400&fit=crop',
    title: '优惠活动',
    subtitle: '限时特惠 满50减10',
  },
];

// 服务卡片数据
const SERVICE_CARDS = [
  {
    id: 1,
    title: '同城配送',
    subtitle: '省心到家',
    gradient: 'from-orange-400 to-amber-400',
    icon: '🛵',
  },
  {
    id: 2,
    title: '到店自提',
    subtitle: '方便快捷',
    gradient: 'from-cyan-400 to-blue-400',
    icon: '📦',
  },
];

// 快捷服务入口
const QUICK_SERVICES = [
  { id: 1, icon: '充', iconBg: 'bg-purple-500', title: '在线充值', color: 'text-orange-500' },
  { id: 2, icon: '✓', iconBg: 'bg-orange-500', title: '会员中心', color: 'text-orange-500' },
  { id: 3, icon: '礼', iconBg: 'bg-red-500', title: '邀请有奖', color: 'text-orange-500' },
];

// 商品分类（与系统分类同步）
const CATEGORIES = [
  { id: 'drinks', icon: '🥤', name: '饮品' },
  { id: 'fruits', icon: '🍎', name: '水果' },
  { id: 'vegetables', icon: '🥬', name: '蔬菜' },
  { id: 'snacks', icon: '🍪', name: '零食' },
  { id: 'fresh', icon: '🥩', name: '生鲜' },
  { id: 'daily', icon: '🏠', name: '日用品' },
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

// 底部导航数据
const TAB_BAR = [
  { id: 1, icon: '🏠', title: '首页', active: true },
  { id: 2, icon: '📋', title: '全部分类', active: false },
  { id: 3, icon: '🛒', title: '购物车', active: false, badge: 0 },
  { id: 4, icon: '👤', title: '我的', active: false },
];

// 附近门店数据
const NEARBY_STORES = [
  { id: 1, name: '海邻到家(星火路店)', distance: '350m', address: '星火路128号一层106室' },
  { id: 2, name: '海邻到家(科技园店)', distance: '680m', address: '科技园南区A栋104室' },
  { id: 3, name: '海邻到家(步行街店)', distance: '1.2km', address: '步行街商业广场B1层' },
  { id: 4, name: '海邻到家(地铁站店)', distance: '1.5km', address: '地铁站C出口商业街' },
];

const DEFAULT_STORE = NEARBY_STORES[0];

// 店铺头图轮播组件
function StoreBannerSwiper({ current, setCurrent }: { current: number; setCurrent: React.Dispatch<React.SetStateAction<number>> }) {
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % STORE_BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [setCurrent]);

  return (
    <div className="relative w-full h-44 overflow-hidden">
      <div 
        className="flex transition-transform duration-500 h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {STORE_BANNERS.map((banner) => (
          <div key={banner.id} className="relative flex-shrink-0 w-full h-full">
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
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
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              current === index ? "bg-white" : "bg-white/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// 模板预览组件属性
interface MiniStorePreviewProps {
  template?: Template;
}

// 主页面组件
export default function MiniStorePreview({ template }: MiniStorePreviewProps) {
  const [current, setCurrent] = useState(0);
  const [activeTab, setActiveTab] = useState<'sales' | 'attention'>('sales');
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [currentStore, setCurrentStore] = useState(DEFAULT_STORE);

  // 使用传入的模板或默认活力橙风
  const activeTemplate = template || TEMPLATES[0];
  const { style, config } = activeTemplate;

  const handleStoreSelect = (store: typeof NEARBY_STORES[0]) => {
    setCurrentStore(store);
    setShowStoreSelector(false);
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
          <h1 className="text-base font-bold text-white">首页</h1>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center text-white/80">⋯</div>
            <div className="w-6 h-6 flex items-center justify-center text-white/80">⏺</div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="h-[calc(100%-120px)] overflow-y-auto">
        {/* 门店定位选择 */}
        {config.showStoreLocation && (
          <div className="px-3 py-2 bg-white border-b border-gray-100">
            <button 
              onClick={() => setShowStoreSelector(true)}
              className={cn(
                "w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors",
                style.secondaryColor
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", style.accentBg)}>
                  <span>📍</span>
                </div>
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
              <div className="flex items-center gap-1">
                <span className={cn("text-xs px-1.5 py-0.5 rounded", style.primaryColor, style.secondaryColor)}>切换</span>
              </div>
            </button>
          </div>
        )}

        {/* 门店选择弹窗 */}
        {showStoreSelector && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
            <div className="w-[320px] bg-white rounded-t-3xl p-4 pb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">选择门店</h3>
                <button 
                  onClick={() => setShowStoreSelector(false)}
                  className="w-6 h-6 flex items-center justify-center text-gray-400"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                {NEARBY_STORES.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => handleStoreSelect(store)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                      currentStore.id === store.id 
                        ? `${style.secondaryColor} border-2 ${style.primaryColor.replace('text-', 'border-')}` 
                        : "bg-gray-50 border-2 border-transparent active:bg-gray-100"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      currentStore.id === store.id ? style.accentBg : "bg-gray-200"
                    )}>
                      <span className="text-lg">🏪</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          "font-medium text-sm",
                          currentStore.id === store.id ? style.primaryColor : "text-gray-800"
                        )}>
                          {store.name}
                        </span>
                        {currentStore.id === store.id && (
                          <span className={cn("text-xs px-1.5 py-0.5 rounded", style.primaryColor, style.secondaryColor)}>当前</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{store.address}</div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        currentStore.id === store.id ? `${style.accentBg} text-white` : "bg-gray-200 text-gray-600"
                      )}>
                        {store.distance}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button className={cn("w-full py-2 text-center text-sm active:text-orange-600", style.primaryColor)}>
                  🗺️ 查看全部门店地图
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 店铺头图轮播 */}
        {config.showBanner && <StoreBannerSwiper current={current} setCurrent={setCurrent} />}

        {/* 搜索栏 */}
        {config.showSearchBar && (
          <div className="px-3 py-2 bg-white">
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
              <span className="text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="搜索商品"
                className="flex-1 bg-transparent outline-none text-sm text-gray-700"
              />
              <button className={cn("text-xs font-medium", style.primaryColor)}>搜索</button>
            </div>
          </div>
        )}

        {/* 服务标签 */}
        {config.showServiceTags && (
          <div className="px-3 py-2 bg-white">
            <div className="flex gap-3">
              {SERVICE_CARDS.map((card) => (
                <div
                  key={card.id}
                  className={cn(
                    "flex-1 relative overflow-hidden rounded-xl p-3 bg-gradient-to-br",
                    card.gradient
                  )}
                >
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

        {/* 分隔线 */}
        <div className="h-2 bg-gray-100" />

        {/* 快捷服务 */}
        {config.showQuickServices && (
          <div className="px-3 py-2 bg-white">
            <div className="flex justify-around">
              {QUICK_SERVICES.map((service) => (
                <div key={service.id} className="flex flex-col items-center gap-1">
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold", service.iconBg)}>
                    {service.icon}
                  </div>
                  <span className={cn("text-xs font-medium", service.color)}>{service.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 分隔线 */}
        {config.showQuickServices && <div className="h-2 bg-gray-100" />}

        {/* 商品分类 */}
        {config.showCategories && (
          <div className="px-3 py-2 bg-white">
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <div key={cat.id} className="flex flex-col items-center gap-0.5 py-1">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl">
                    {cat.icon}
                  </div>
                  <span className="text-xs text-gray-700 font-medium">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 分隔线 */}
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
                <button
                  onClick={() => setActiveTab('sales')}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all",
                    activeTab === 'sales' 
                      ? `bg-white ${style.primaryColor} shadow-sm border border-gray-200` 
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {activeTab === 'sales' && <span className="text-red-500">🔥</span>}
                  销量榜
                </button>
                <button
                  onClick={() => setActiveTab('attention')}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all",
                    activeTab === 'attention' 
                      ? `bg-white ${style.primaryColor} shadow-sm border border-gray-200` 
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {activeTab === 'attention' && <span className="text-red-500">🔥</span>}
                  关注榜
                </button>
              </div>
              <div className="space-y-1">
                {RANKING_DATA[activeTab].slice(0, 4).map((product, index) => (
                  <div key={product.id} className="flex items-center gap-2 py-1">
                    <span className={cn(
                      "w-4 h-4 rounded flex items-center justify-center text-xs font-bold",
                      index < 3 ? "bg-red-500 text-white" : "bg-gray-200 text-gray-500"
                    )}>
                      {index + 1}
                    </span>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-8 h-8 rounded-lg object-cover bg-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 truncate">{product.name}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-red-500 font-medium text-xs">¥{product.price.toFixed(2)}</span>
                        <span className="text-xs text-gray-400">
                          {'sales' in product ? `售${product.sales}` : `关${product.attention}`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部导航栏 */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200">
        <div className="flex justify-around py-1.5">
          {TAB_BAR.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "flex flex-col items-center gap-0.5 py-0.5 px-2",
                tab.active ? style.primaryColor : "text-gray-500"
              )}
            >
              <div className="relative text-lg">{tab.icon}</div>
              <span className="text-xs">{tab.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 导出模板供外部使用
export { TEMPLATES };
