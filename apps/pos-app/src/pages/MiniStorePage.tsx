import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProductStore, useMemberStore } from '../store';

type Tab = 'home' | 'category' | 'cart' | 'orders' | 'my';

export default function MiniStorePage() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [cartItems, setCartItems] = useState<{ product: any; quantity: number }[]>([]);
  const { products } = useProductStore();
  const { currentMember } = useMemberStore();

  // 团购活动
  const groupBuys = [
    { id: 1, name: '农夫山泉24瓶装', originalPrice: 48, groupPrice: 35, minPeople: 20, currentPeople: 15, endTime: '明天12:00' },
    { id: 2, name: '蒙牛纯牛奶整箱', originalPrice: 65, groupPrice: 45, minPeople: 30, currentPeople: 22, endTime: '后天18:00' },
  ];

  // 外卖订单状态
  const deliveryOrders = [
    { platform: '美团', pending: 3, processing: 1 },
    { platform: '饿了么', pending: 2, processing: 0 },
  ];

  // 添加到购物车
  const addToCart = (product: any) => {
    const existing = cartItems.find(item => item.product.id === product.id);
    if (existing) {
      setCartItems(cartItems.map(item =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCartItems([...cartItems, { product, quantity: 1 }]);
    }
  };

  // 计算购物车总价
  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.retailPrice * item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold">海邻商城</h1>
          </div>
          <div className="flex items-center gap-2">
            {currentMember && (
              <span className="text-sm text-orange-600">
                {currentMember.name} ({currentMember.level === 'diamond' ? '💎' : currentMember.level === 'gold' ? '🥇' : '🥈'})
              </span>
            )}
          </div>
        </div>
        
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
              className={`flex-1 py-3 flex items-center justify-center gap-1 text-sm ${
                activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'cart' && cartItems.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 rounded-full">{cartItems.length}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* 首页 */}
        {activeTab === 'home' && (
          <div className="p-4 space-y-6">
            {/* 横幅 */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <h2 className="text-lg font-semibold">新人专享福利</h2>
              <p className="text-sm text-blue-100 mt-1">首单满39元减5元</p>
              <button className="mt-3 bg-white text-blue-600 px-4 py-1.5 rounded-full text-sm font-medium">
                立即领取
              </button>
            </div>

            {/* 团购接龙 */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">🔥 社区团购</h3>
                <span className="text-sm text-gray-500">更多</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {groupBuys.map(group => (
                  <div key={group.id} className="bg-white rounded-xl p-3 shadow-sm">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                      <span className="text-4xl">📦</span>
                    </div>
                    <p className="font-medium text-sm truncate">{group.name}</p>
                    <div className="flex items-end gap-2 mt-1">
                      <span className="text-red-600 font-bold">¥{group.groupPrice}</span>
                      <span className="text-gray-400 text-xs line-through">¥{group.originalPrice}</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>已团 {group.currentPeople}/{group.minPeople}</span>
                        <span>剩余 {group.endTime}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${(group.currentPeople / group.minPeople) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart({ id: `group_${group.id}`, name: group.name, retailPrice: group.groupPrice, barcode: '', category: '团购', unit: '件', costPrice: 0, wholesalePrice: 0, isStandard: true, status: 'active' })}
                      className="w-full mt-2 bg-orange-500 text-white py-2 rounded-lg text-sm"
                    >
                      立即参团
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* 热门商品 */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">🏆 热门商品</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {products.slice(0, 6).map(product => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl p-3 shadow-sm"
                    onClick={() => addToCart(product)}
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                      <span className="text-3xl">🛍️</span>
                    </div>
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <div className="flex items-end justify-between mt-1">
                      <span className="text-red-600 font-bold">¥{product.retailPrice}</span>
                      <button className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 外卖接单入口 */}
            <section className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">🛵 外卖待接单</h3>
                <span className="text-sm text-blue-600">查看全部</span>
              </div>
              <div className="space-y-3">
                {deliveryOrders.map((order, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{order.platform === '美团' ? '🟢' : '🟠'}</span>
                      <div>
                        <p className="font-medium">{order.platform}</p>
                        <p className="text-sm text-gray-500">{order.pending} 单待处理</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">
                      接单
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* 分类 */}
        {activeTab === 'category' && (
          <div className="p-4">
            <div className="flex gap-4">
              <div className="w-24 space-y-2">
                {['饮料', '食品', '零食', '奶制品', '生鲜', '烘焙'].map((cat, i) => (
                  <button
                    key={cat}
                    className={`w-full py-2 text-sm rounded-lg ${i === 0 ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                {products.filter(p => p.category === '饮料').map(product => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl p-3 shadow-sm"
                    onClick={() => addToCart(product)}
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                      <span className="text-3xl">🥤</span>
                    </div>
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <div className="flex items-end justify-between mt-1">
                      <span className="text-red-600 font-bold">¥{product.retailPrice}</span>
                      <button className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 购物车 */}
        {activeTab === 'cart' && (
          <div className="p-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-6xl">🛒</span>
                <p className="text-gray-500 mt-4">购物车是空的</p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg"
                >
                  去逛逛
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map(item => (
                  <div key={item.product.id} className="bg-white rounded-xl p-4 flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-3xl">🛍️</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-red-600 mt-1">¥{item.product.retailPrice}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCartItems(cartItems.map(c =>
                          c.product.id === item.product.id
                            ? { ...c, quantity: c.quantity - 1 }
                            : c
                        ).filter(c => c.quantity > 0))}
                        className="w-8 h-8 bg-gray-100 rounded-full"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => setCartItems(cartItems.map(c =>
                          c.product.id === item.product.id
                            ? { ...c, quantity: c.quantity + 1 }
                            : c
                        ))}
                        className="w-8 h-8 bg-gray-100 rounded-full"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* 结算 */}
                <div className="bg-white rounded-xl p-4 sticky bottom-20 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600">合计</span>
                    <span className="text-2xl font-bold text-red-600">¥{cartTotal.toFixed(2)}</span>
                  </div>
                  <button className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium">
                    去结算 ({cartItems.length})
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 订单 */}
        {activeTab === 'orders' && (
          <div className="p-4">
            <div className="flex gap-2 mb-4">
              {['全部', '待付款', '待发货', '待收货', '已完成'].map((status, i) => (
                <button
                  key={status}
                  className={`px-3 py-1 rounded-lg text-sm ${i === 4 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
                >
                  {status}
                </button>
              ))}
            </div>
            
            {/* 订单列表 */}
            <div className="space-y-4">
              {[
                { no: 'MINI20240117001', items: '农夫山泉x2, 可口可乐x1', amount: 8.5, status: '待收货' },
                { no: 'MINI20240117002', items: '康师傅方便面x3', amount: 13.5, status: '已完成' },
              ].map((order, i) => (
                <div key={i} className="bg-white rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-gray-500">{order.no}</span>
                    <span className="text-sm text-orange-500">{order.status}</span>
                  </div>
                  <p className="text-sm text-gray-600">{order.items}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-gray-500">实付</span>
                    <span className="font-bold text-red-600">¥{order.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 我的 */}
        {activeTab === 'my' && (
          <div className="p-4 space-y-4">
            {/* 会员卡 */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">会员卡</p>
                  <p className="text-xl font-bold mt-1">{currentMember?.name || '点击登录'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">会员等级</p>
                  <p className="font-bold">
                    {currentMember?.level === 'diamond' ? '💎 钻石' :
                     currentMember?.level === 'gold' ? '🥇 金卡' :
                     currentMember?.level === 'silver' ? '🥈 银卡' : '普通会员'}
                  </p>
                </div>
              </div>
              {currentMember && (
                <div className="flex gap-6 mt-4 pt-4 border-t border-white/20">
                  <div>
                    <p className="text-sm opacity-80">积分</p>
                    <p className="font-semibold">{currentMember.points.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">余额</p>
                    <p className="font-semibold">¥{currentMember.balance}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">累计消费</p>
                    <p className="font-semibold">¥{currentMember.totalConsume.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 功能列表 */}
            <div className="bg-white rounded-xl">
              {[
                { icon: '💳', label: '我的会员卡', arrow: true },
                { icon: '🎟️', label: '优惠券', arrow: true },
                { icon: '📍', label: '收货地址', arrow: true },
                { icon: '🔔', label: '消息通知', arrow: true },
                { icon: '⚙️', label: '设置', arrow: true },
                { icon: '📞', label: '联系客服', arrow: true },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
