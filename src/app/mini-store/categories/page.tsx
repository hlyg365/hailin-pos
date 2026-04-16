'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

// 左侧分类
const CATEGORIES = [
  { id: 'featured', name: '精选', icon: '⭐' },
  { id: 'fruit', name: '鲜果蔬菜', icon: '🍎' },
  { id: 'drinks', name: '烟酒饮料', icon: '🍺' },
  { id: 'snacks', name: '零食冰品', icon: '🍿' },
  { id: 'daily', name: '日用百货', icon: '🧴' },
  { id: 'meat', name: '肉禽蛋奶', icon: '🥩' },
  { id: 'grain', name: '粮油调味', icon: '🌾' },
  { id: 'frozen', name: '冷冻食品', icon: '🧊' },
];

// 分类商品
const PRODUCTS: Record<string, Array<{id: number; name: string; price: number; sales: number; category: string}>> = {
  featured: [
    { id: 1, name: '可乐500ml', price: 3.5, sales: 1280, category: '烟酒饮料' },
    { id: 2, name: '农夫山泉550ml', price: 2.0, sales: 3200, category: '烟酒饮料' },
    { id: 3, name: '康师傅方便面', price: 4.5, sales: 2100, category: '零食冰品' },
    { id: 4, name: '苹果500g', price: 6.8, sales: 680, category: '鲜果蔬菜' },
  ],
  fruit: [
    { id: 5, name: '苹果500g', price: 6.8, sales: 680, category: '鲜果蔬菜' },
    { id: 6, name: '香蕉500g', price: 4.5, sales: 980, category: '鲜果蔬菜' },
    { id: 7, name: '橙子500g', price: 5.9, sales: 560, category: '鲜果蔬菜' },
    { id: 8, name: '时令蔬菜份', price: 3.0, sales: 320, category: '鲜果蔬菜' },
  ],
  drinks: [
    { id: 9, name: '可乐500ml', price: 3.5, sales: 1280, category: '烟酒饮料' },
    { id: 10, name: '雪碧500ml', price: 3.5, sales: 980, category: '烟酒饮料' },
    { id: 11, name: '农夫山泉550ml', price: 2.0, sales: 3200, category: '烟酒饮料' },
    { id: 12, name: '红牛250ml', price: 6.5, sales: 450, category: '烟酒饮料' },
    { id: 13, name: '啤酒罐装', price: 5.0, sales: 520, category: '烟酒饮料' },
  ],
  snacks: [
    { id: 14, name: '乐事薯片', price: 8.5, sales: 680, category: '零食冰品' },
    { id: 15, name: '康师傅红烧牛肉面', price: 4.5, sales: 2100, category: '零食冰品' },
    { id: 16, name: '好丽友派', price: 9.5, sales: 320, category: '零食冰品' },
    { id: 17, name: '辣条', price: 3.0, sales: 890, category: '零食冰品' },
    { id: 18, name: '冰淇淋', price: 5.0, sales: 450, category: '零食冰品' },
  ],
  daily: [
    { id: 19, name: '维达抽纸10包', price: 29.9, sales: 450, category: '日用百货' },
    { id: 20, name: '蓝月亮洗衣液', price: 18.0, sales: 380, category: '日用百货' },
    { id: 21, name: '云南白药牙膏', price: 12.0, sales: 520, category: '日用百货' },
    { id: 22, name: '洗洁精', price: 8.0, sales: 680, category: '日用百货' },
  ],
};

function ProductCard({ product }: { product: {id: number; name: string; price: number; sales: number; category: string} }) {
  const getIcon = (category: string) => {
    if (category === '鲜果蔬菜') return '🍎';
    if (category === '零食冰品') return '🍿';
    return '🥤';
  };

  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden flex">
      <div className="w-24 h-24 bg-gray-100 flex items-center justify-center flex-shrink-0">
        <span className="text-4xl">{getIcon(product.category)}</span>
      </div>
      <div className="flex-1 p-3 flex flex-col justify-between">
        <div>
          <p className="text-sm text-gray-800 font-medium line-clamp-2 leading-tight">{product.name}</p>
          <p className="text-xs text-gray-400 mt-1">月销{product.sales}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-orange-500 font-bold">¥{product.price.toFixed(1)}</span>
          <button className="w-7 h-7 bg-orange-500 text-white rounded-full text-sm flex items-center justify-center">
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function TabBar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const tabs: Array<{ id: string; icon: string; title: string; href: string; badge?: number }> = [
    { id: 'home', icon: '🏠', title: '首页', href: '/mini-store/home' },
    { id: 'categories', icon: '📋', title: '分类', href: '/mini-store/categories' },
    { id: 'cart', icon: '🛒', title: '购物车', href: '/mini-store/cart', badge: 3 },
    { id: 'points', icon: '🎁', title: '积分', href: '/mini-store/points' },
    { id: 'profile', icon: '👤', title: '我的', href: '/mini-store/profile' },
  ];
  return (
    <div className="bg-white border-t border-gray-200">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => (
          <a key={tab.id} href={tab.href} onClick={(e) => { e.preventDefault(); onTabChange(tab.id); }}
            className={cn("flex flex-col items-center gap-0.5 py-1 px-3 relative", tab.id === activeTab ? "text-orange-500" : "text-gray-500")}>
            <span className="text-xl relative">
              {tab.icon}
              {tab.badge && <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{tab.badge}</span>}
            </span>
            <span className="text-[10px]">{tab.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');

  const products = PRODUCTS[selectedCategory] || PRODUCTS.featured;

  return (
    <div className="min-h-screen bg-gray-50 pb-16 flex flex-col">
      {/* 搜索栏 */}
      <div className="bg-white px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2.5">
            <span className="text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="搜索商品"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* 分类+商品列表 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧分类导航 */}
        <div className="w-24 bg-gray-100 overflow-y-auto flex-shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "w-full px-2 py-3 text-center border-l-2 transition-all",
                selectedCategory === cat.id
                  ? "bg-white border-orange-500"
                  : "border-transparent hover:bg-gray-50"
              )}
            >
              <span className="text-lg">{cat.icon}</span>
              <p className={cn("text-xs mt-1", selectedCategory === cat.id ? "text-orange-500 font-medium" : "text-gray-600")}>
                {cat.name}
              </p>
            </button>
          ))}
        </div>

        {/* 右侧商品列表 */}
        <div className="flex-1 overflow-y-auto p-3 bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-800">
              {CATEGORIES.find(c => c.id === selectedCategory)?.name}
            </span>
            <span className="text-xs text-gray-400">共{products.length}件商品</span>
          </div>
          <div className="space-y-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>

      {/* 底部导航 */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
