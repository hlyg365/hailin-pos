import { View, Text, ScrollView, Image } from '@tarojs/components';
import { useState } from 'react';
import { AtSearchBar, AtTag, AtBadge } from 'taro-ui';
import { useNavigate } from '@tarojs/runtime';
import './index.scss';

// 模拟商品数据
const products = [
  { id: '1', name: '农夫山泉550ml', price: 2, originalPrice: 2.5, image: '/assets/water.png', sales: 1250 },
  { id: '2', name: '可口可乐330ml', price: 3, originalPrice: 3.5, image: '/assets/coke.png', sales: 980 },
  { id: '3', name: '康师傅方便面', price: 4.5, originalPrice: 5, image: '/assets/noodles.png', sales: 756 },
  { id: '4', name: '双汇火腿肠', price: 5, originalPrice: 6, image: '/assets/ham.png', sales: 534 },
  { id: '5', name: '绿箭口香糖', price: 6, originalPrice: 7, image: '/assets/gum.png', sales: 321 },
  { id: '6', name: '奥利奥饼干', price: 8.5, originalPrice: 10, image: '/assets/cookie.png', sales: 298 },
  { id: '7', name: '伊利纯牛奶', price: 12, originalPrice: 14, image: '/assets/milk.png', sales: 234 },
  { id: '8', name: '蒙牛酸奶', price: 6.5, originalPrice: 8, image: '/assets/yogurt.png', sales: 198 },
];

// 团购接龙数据
const groupBuys = [
  { 
    id: '1', 
    title: '新鲜水果拼盘团购', 
    price: 29.9, 
    originalPrice: 49.9,
    headImg: '/assets/fruit.jpg',
    participants: 45,
    maxParticipants: 50,
    endTime: '2024-01-15 20:00',
    storeName: '海邻到家-望京店'
  },
  { 
    id: '2', 
    title: '早餐套餐团购', 
    price: 9.9, 
    originalPrice: 19.9,
    headImg: '/assets/breakfast.jpg',
    participants: 128,
    maxParticipants: 200,
    endTime: '2024-01-16 08:00',
    storeName: '海邻到家-国贸店'
  },
];

const categories = ['全部', '饮料', '食品', '零食', '奶制品', '日用品', '水果'];

export default function Index() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [currentTab, setCurrentTab] = useState<'products' | 'groupBuy'>('products');

  return (
    <View className="mini-store">
      {/* 顶部店铺信息 */}
      <View className="store-header">
        <View className="store-info">
          <View className="store-avatar">海</View>
          <View className="store-detail">
            <Text className="store-name">海邻到家-望京店</Text>
            <Text className="store-desc">社区便利店 · 营业中 08:00-23:00</Text>
          </View>
        </View>
        <View className="header-actions">
          <View className="action-btn">
            <Text className="icon">📍</Text>
            <Text className="text">门店</Text>
          </View>
          <View className="action-btn" onClick={() => navigate('/pages/order/list')}>
            <Text className="icon">📋</Text>
            <Text className="text">订单</Text>
          </View>
        </View>
      </View>

      {/* Tab切换 */}
      <View className="tab-bar">
        <View 
          className={`tab-item ${currentTab === 'products' ? 'active' : ''}`}
          onClick={() => setCurrentTab('products')}
        >
          <Text>商品</Text>
        </View>
        <View 
          className={`tab-item ${currentTab === 'groupBuy' ? 'active' : ''}`}
          onClick={() => setCurrentTab('groupBuy')}
        >
          <Text>🏆 团购接龙</Text>
        </View>
      </View>

      {/* 商品列表 */}
      {currentTab === 'products' && (
        <>
          {/* 搜索栏 */}
          <View className="search-section">
            <AtSearchBar
              value={searchValue}
              onChange={(value: string) => setSearchValue(value)}
              placeholder="搜索商品"
              className="search-bar"
            />
          </View>

          {/* 分类标签 */}
          <ScrollView className="category-scroll" scrollX>
            <View className="category-list">
              {categories.map(cat => (
                <View 
                  key={cat}
                  className={`category-item ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  <Text>{cat}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* 商品网格 */}
          <ScrollView className="product-scroll" scrollY>
            <View className="product-grid">
              {products.map(product => (
                <View 
                  key={product.id}
                  className="product-card"
                  onClick={() => navigate(`/pages/product/detail?id=${product.id}`)}
                >
                  <View className="product-image">
                    <View className="placeholder-icon">📦</View>
                  </View>
                  <View className="product-info">
                    <Text className="product-name">{product.name}</Text>
                    <View className="product-price">
                      <Text className="price">¥{product.price}</Text>
                      <Text className="original-price">¥{product.originalPrice}</Text>
                    </View>
                    <View className="product-footer">
                      <Text className="sales">已售{product.sales}</Text>
                      <View className="add-btn">+</View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      {/* 团购接龙 */}
      {currentTab === 'groupBuy' && (
        <ScrollView className="group-buy-scroll" scrollY>
          <View className="group-buy-section">
            <View className="section-title">
              <Text className="title">🔥 正在进行的团购</Text>
            </View>
            
            {groupBuys.map(item => (
              <View key={item.id} className="group-buy-card">
                <View className="gb-header">
                  <Image className="gb-image" src={item.headImg} mode="aspectFill" />
                  <View className="gb-overlay">
                    <Text className="gb-title">{item.title}</Text>
                  </View>
                </View>
                
                <View className="gb-content">
                  <View className="gb-price">
                    <Text className="current-price">¥{item.price}</Text>
                    <Text className="original-price">¥{item.originalPrice}</Text>
                  </View>
                  
                  <View className="gb-progress">
                    <View className="progress-bar">
                      <View className="progress-fill" style={{ width: `${(item.participants / item.maxParticipants) * 100}%` }} />
                    </View>
                    <Text className="progress-text">已拼 {item.participants}/{item.maxParticipants}</Text>
                  </View>
                  
                  <View className="gb-info">
                    <Text className="store-name">🏪 {item.storeName}</Text>
                    <Text className="end-time">⏰ {item.endTime} 截止</Text>
                  </View>
                  
                  <View className="gb-actions">
                    <View className="join-btn">立即参与</View>
                    <View className="share-btn">分享</View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* 发起团购 */}
          <View className="create-group-section">
            <View className="create-card">
              <Text className="icon">📝</Text>
              <View className="create-info">
                <Text className="title">发起团购</Text>
                <Text className="desc">成为团长，享受更多优惠</Text>
              </View>
              <View className="arrow">→</View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* 底部购物车 */}
      <View className="cart-bar" onClick={() => navigate('/pages/cart/index')}>
        <View className="cart-icon">
          <Text className="cart-badge">3</Text>
          <Text className="icon">🛒</Text>
        </View>
        <View className="cart-info">
          <Text className="total-label">合计</Text>
          <Text className="total-price">¥58.50</Text>
        </View>
        <View className="checkout-btn">去结算</View>
      </View>
    </View>
  );
}
