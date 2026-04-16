'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

// 购物车商品
const CART_ITEMS = [
  { id: 1, name: '可乐500ml', price: 3.5, quantity: 3, checked: true, category: '烟酒饮料' },
  { id: 2, name: '薯片大包装', price: 9.9, quantity: 1, checked: true, category: '零食冰品' },
  { id: 3, name: '康师傅红烧牛肉面', price: 4.5, quantity: 2, checked: false, category: '零食冰品' },
  { id: 4, name: '农夫山泉550ml', price: 2.0, quantity: 5, checked: true, category: '烟酒饮料' },
];

function CartItem({ item, onQuantityChange, onCheckedChange, onDelete }: {
  item: typeof CART_ITEMS[0];
  onQuantityChange: (id: number, delta: number) => void;
  onCheckedChange: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const getIcon = (category: string) => {
    if (category === '鲜果蔬菜') return '🍎';
    if (category === '零食冰品') return '🍿';
    return '🥤';
  };

  return (
    <div className="flex items-center gap-3 bg-white p-4 rounded-xl">
      {/* 勾选框 */}
      <button
        onClick={() => onCheckedChange(item.id)}
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
          item.checked ? "bg-orange-500 border-orange-500" : "border-gray-300"
        )}
      >
        {item.checked && <span className="text-white text-xs">✓</span>}
      </button>

      {/* 商品图片 */}
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-3xl">{getIcon(item.category)}</span>
      </div>

      {/* 商品信息 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 font-medium truncate">{item.name}</p>
        <p className="text-orange-500 font-bold mt-1">¥{item.price.toFixed(1)}</p>
      </div>

      {/* 数量控制 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onQuantityChange(item.id, -1)}
          className="w-7 h-7 bg-gray-100 rounded-full text-gray-600 flex items-center justify-center text-lg"
        >
          -
        </button>
        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
        <button
          onClick={() => onQuantityChange(item.id, 1)}
          className="w-7 h-7 bg-orange-100 rounded-full text-orange-500 flex items-center justify-center text-lg"
        >
          +
        </button>
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

export default function CartPage() {
  const [activeTab, setActiveTab] = useState('cart');
  const [isEditMode, setIsEditMode] = useState(false);
  const [items, setItems] = useState(CART_ITEMS);

  const allChecked = items.every(item => item.checked);
  const checkedItems = items.filter(item => item.checked);
  const totalPrice = checkedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleQuantityChange = (id: number, delta: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const handleCheckedChange = (id: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, checked: !item.checked };
      }
      return item;
    }));
  };

  const handleAllChecked = () => {
    const newChecked = !allChecked;
    setItems(items.map(item => ({ ...item, checked: newChecked })));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
      {/* 头部 */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b">
        <h1 className="text-lg font-bold text-gray-800">购物车</h1>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className="text-sm text-orange-500"
        >
          {isEditMode ? '完成' : '编辑'}
        </button>
      </div>

      {/* 配送方式 */}
      <div className="bg-white px-4 py-2.5 flex items-center gap-4">
        <span className="text-sm text-gray-600">配送方式</span>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">🚴 同城配送</span>
          <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">🏪 到店自提</span>
        </div>
      </div>

      {/* 购物车商品列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            onQuantityChange={handleQuantityChange}
            onCheckedChange={handleCheckedChange}
            onDelete={(id) => setItems(items.filter(item => item.id !== id))}
          />
        ))}
      </div>

      {/* 空购物车提示 */}
      {items.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <span className="text-6xl mb-4">🛒</span>
          <p className="text-sm">购物车是空的</p>
          <a href="/mini-store/home" className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full text-sm">
            去逛逛
          </a>
        </div>
      )}

      {/* 结算栏 */}
      {items.length > 0 && (
        <div className="bg-white border-t px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 全选 */}
            <button onClick={handleAllChecked} className="flex items-center gap-2">
              <span className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                allChecked ? "bg-orange-500 border-orange-500" : "border-gray-300"
              )}>
                {allChecked && <span className="text-white text-xs">✓</span>}
              </span>
              <span className="text-sm text-gray-600">全选</span>
            </button>

            {/* 合计 */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">合计</p>
                <p className="text-lg font-bold text-orange-500">¥{totalPrice.toFixed(2)}</p>
              </div>
              <button className="px-6 py-2.5 bg-orange-500 text-white rounded-full font-medium text-sm">
                去结算({checkedItems.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部导航 */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
