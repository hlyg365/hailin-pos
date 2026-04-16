import { View, Text, ScrollView, Image } from '@tarojs/components';
import { useState } from 'react';
import './index.scss';

// 购物车商品
const cartItems = [
  { id: '1', name: '农夫山泉550ml', price: 2, quantity: 2, image: '/assets/water.png' },
  { id: '2', name: '可口可乐330ml', price: 3, quantity: 1, image: '/assets/coke.png' },
  { id: '3', name: '康师傅方便面', price: 4.5, quantity: 3, image: '/assets/noodles.png' },
];

export default function Cart() {
  const [items, setItems] = useState(cartItems);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = subtotal * 0.1;
  const total = subtotal - discount;

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <View className="cart-page">
      <ScrollView className="cart-scroll" scrollY>
        {/* 门店信息 */}
        <View className="store-bar">
          <Text className="store-icon">🏪</Text>
          <Text className="store-name">海邻到家-望京店</Text>
          <Text className="arrow">›</Text>
        </View>

        {/* 商品列表 */}
        <View className="cart-items">
          {items.map(item => (
            <View key={item.id} className="cart-item">
              <View className="item-image">
                <View className="placeholder">📦</View>
              </View>
              <View className="item-info">
                <Text className="item-name">{item.name}</Text>
                <Text className="item-price">¥{item.price}</Text>
              </View>
              <View className="item-actions">
                <View 
                  className="qty-btn minus"
                  onClick={() => updateQuantity(item.id, -1)}
                >
                  -
                </View>
                <Text className="qty">{item.quantity}</Text>
                <View 
                  className="qty-btn plus"
                  onClick={() => updateQuantity(item.id, 1)}
                >
                  +
                </View>
              </View>
              <View 
                className="delete-btn"
                onClick={() => removeItem(item.id)}
              >
                🗑️
              </View>
            </View>
          ))}
        </View>

        {/* 推荐商品 */}
        <View className="recommend-section">
          <View className="section-title">
            <Text className="title">👀 猜你喜欢</Text>
          </View>
          <View className="recommend-list">
            {[1, 2, 3, 4].map(i => (
              <View key={i} className="recommend-item">
                <View className="rec-image">
                  <View className="placeholder">📦</View>
                </View>
                <Text className="rec-name">商品名称</Text>
                <Text className="rec-price">¥{i + 5}.9</Text>
                <View className="rec-add">+</View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 底部结算 */}
      <View className="checkout-bar">
        <View className="coupon-section">
          <Text className="icon">🎫</Text>
          <Text className="text">使用优惠券</Text>
          <Text className="arrow">›</Text>
        </View>
        
        <View className="summary-section">
          <View className="summary-row">
            <Text className="label">商品总价</Text>
            <Text className="value">¥{subtotal.toFixed(2)}</Text>
          </View>
          <View className="summary-row discount">
            <Text className="label">优惠</Text>
            <Text className="value">-¥{discount.toFixed(2)}</Text>
          </View>
          <View className="summary-row total">
            <Text className="label">合计</Text>
            <Text className="value">¥{total.toFixed(2)}</Text>
          </View>
        </View>

        <View className="checkout-btn">
          提交订单 ¥{total.toFixed(2)}
        </View>
      </View>
    </View>
  );
}
