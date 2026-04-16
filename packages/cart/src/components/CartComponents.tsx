// ============================================
// 海邻到家 - 购物车组件
// ============================================

import React from 'react';
import { View, Text, Image, Input, SwipeAction } from '@tarojs/components';
import { useCart, useCartTotal } from '../hooks/useCart';
import { formatPrice } from '@hailin/core';
import './CartComponents.scss';

// ============ 购物车商品项 ============

interface CartItemProps {
  item: any;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItem({ item, onQuantityChange, onRemove }: CartItemProps) {
  return (
    <SwipeAction
      className="cart-item"
      rightActions={[
        {
          text: '删除',
          color: '#ff4d4f',
          onClick: onRemove,
        },
      ]}
    >
      <View className="cart-item-content">
        {/* 商品图片 */}
        <Image
          className="cart-item-image"
          src={item.product.imageUrl || item.product.icon}
          mode="aspectFill"
        />
        
        {/* 商品信息 */}
        <View className="cart-item-info">
          <Text className="cart-item-name">{item.product.name}</Text>
          <Text className="cart-item-spec">
            {item.product.specification || item.unit}
          </Text>
          <Text className="cart-item-price">
            {formatPrice(item.price)}
          </Text>
        </View>
        
        {/* 数量操作 */}
        <View className="cart-item-actions">
          <View
            className="quantity-btn minus"
            onClick={() => item.quantity > 1 && onQuantityChange(item.quantity - 1)}
          >
            <Text>-</Text>
          </View>
          <Input
            className="quantity-input"
            type="number"
            value={String(item.quantity)}
            onChange={(e: any) => {
              const val = parseInt(e.detail.value) || 1;
              if (val > 0) onQuantityChange(val);
            }}
          />
          <View
            className="quantity-btn plus"
            onClick={() => onQuantityChange(item.quantity + 1)}
          >
            <Text>+</Text>
          </View>
        </View>
      </View>
      
      {/* 小计 */}
      <View className="cart-item-footer">
        <Text className="cart-item-subtotal">
          小计: {formatPrice(item.total)}
        </Text>
      </View>
    </SwipeAction>
  );
}

// ============ 购物车列表 ============

interface CartListProps {
  onCheckout?: () => void;
}

export function CartList({ onCheckout }: CartListProps) {
  const { cart, isEmpty, removeItem, updateQuantity, clearAll, loading } = useCart();
  const { originalAmount, discountAmount, finalAmount } = useCartTotal();

  if (isEmpty) {
    return (
      <View className="cart-empty">
        <Text className="cart-empty-icon">🛒</Text>
        <Text className="cart-empty-text">购物车是空的</Text>
        <Text className="cart-empty-hint">快去挑选商品吧</Text>
      </View>
    );
  }

  return (
    <View className="cart-list">
      {/* 头部 */}
      <View className="cart-header">
        <Text className="cart-title">购物车</Text>
        <Text className="cart-clear" onClick={clearAll}>清空</Text>
      </View>
      
      {/* 商品列表 */}
      <View className="cart-items">
        {cart.items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            onQuantityChange={(quantity) => updateQuantity(item.id, quantity)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </View>
      
      {/* 底部汇总 */}
      <View className="cart-footer">
        <View className="cart-summary">
          <View className="summary-row">
            <Text>商品总价</Text>
            <Text>{formatPrice(originalAmount)}</Text>
          </View>
          {discountAmount > 0 && (
            <View className="summary-row discount">
              <Text>优惠</Text>
              <Text>-{formatPrice(discountAmount)}</Text>
            </View>
          )}
          <View className="summary-row total">
            <Text>合计</Text>
            <Text className="total-price">{formatPrice(finalAmount)}</Text>
          </View>
        </View>
        
        {onCheckout && (
          <View className="cart-checkout">
            <View 
              className={`checkout-btn ${loading ? 'disabled' : ''}`}
              onClick={() => !loading && onCheckout()}
            >
              <Text>去结算</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ============ 收银台购物车面板 ============

export function CashierCartPanel() {
  const { cart, isEmpty, removeItem, updateQuantity } = useCart();
  const { finalAmount } = useCartTotal();

  return (
    <View className="cashier-cart-panel">
      {/* 标题 */}
      <View className="panel-header">
        <Text className="panel-title">当前商品</Text>
        <Text className="panel-count">
          {cart?.itemCount || 0} 件
        </Text>
      </View>
      
      {/* 商品列表 */}
      <View className="panel-items">
        {isEmpty ? (
          <View className="panel-empty">
            <Text>扫描商品条码添加</Text>
          </View>
        ) : (
          cart.items.map((item) => (
            <View key={item.id} className="panel-item">
              <View className="panel-item-info">
                <Text className="panel-item-name">{item.product.name}</Text>
                <Text className="panel-item-price">
                  {formatPrice(item.price)} × {item.quantity}
                </Text>
              </View>
              <View className="panel-item-actions">
                <View 
                  className="panel-btn minus"
                  onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                >
                  <Text>-</Text>
                </View>
                <Text className="panel-qty">{item.quantity}</Text>
                <View 
                  className="panel-btn plus"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Text>+</Text>
                </View>
                <View 
                  className="panel-btn remove"
                  onClick={() => removeItem(item.id)}
                >
                  <Text>×</Text>
                </View>
              </View>
              <Text className="panel-item-total">
                {formatPrice(item.total)}
              </Text>
            </View>
          ))
        )}
      </View>
      
      {/* 总计 */}
      <View className="panel-footer">
        <View className="panel-total">
          <Text>合计:</Text>
          <Text className="total-amount">{formatPrice(finalAmount)}</Text>
        </View>
      </View>
    </View>
  );
}
