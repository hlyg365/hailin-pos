// ============================================
// 海邻到家 - 购物车Hooks
// React/Taro 组件中使用购物车
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import Taro from '@tarojs/taro';
import { cartService } from '../services';
import type { Cart, AddToCartParams, UpdateCartParams } from '@hailin/core';

/** 购物车状态Hook */
export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载购物车
  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // 添加商品
  const addItem = useCallback(async (params: AddToCartParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await cartService.addToCart(params);
      
      if (result.success && result.cart) {
        setCart(result.cart);
        Taro.showToast({ title: '已加入购物车', icon: 'success' });
        return true;
      } else {
        setError(result.message || '添加失败');
        return false;
      }
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新数量
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    // 先乐观更新UI
    setCart(prev => {
      if (!prev) return prev;
      
      const items = prev.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity,
            total: item.price * quantity - item.discount,
          };
        }
        return item;
      });
      
      return {
        ...prev,
        items,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: items.reduce((sum, item) => sum + item.total, 0),
        finalAmount: items.reduce((sum, item) => sum + item.total, 0),
      };
    });
    
    // 发送到服务器
    try {
      const result = await cartService.updateCartItem({ itemId, quantity });
      if (!result.success) {
        // 失败则回滚
        loadCart();
      }
      return result.success;
    } catch {
      loadCart();
      return false;
    }
  }, [loadCart]);

  // 移除商品
  const removeItem = useCallback(async (itemId: string) => {
    // 先乐观更新UI
    setCart(prev => {
      if (!prev) return prev;
      
      const items = prev.items.filter(item => item.id !== itemId);
      return {
        ...prev,
        items,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: items.reduce((sum, item) => sum + item.total, 0),
        finalAmount: items.reduce((sum, item) => sum + item.total, 0),
      };
    });
    
    try {
      const result = await cartService.removeFromCart(itemId);
      if (!result.success) {
        loadCart();
      }
      return result.success;
    } catch {
      loadCart();
      return false;
    }
  }, [loadCart]);

  // 清空购物车
  const clearAll = useCallback(async () => {
    setLoading(true);
    
    try {
      const result = await cartService.clearCart();
      
      if (result.success && result.cart) {
        setCart(result.cart);
        Taro.showToast({ title: '购物车已清空', icon: 'success' });
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 计算属性
  const itemCount = useMemo(() => {
    return cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }, [cart?.items]);

  const totalAmount = useMemo(() => {
    return cart?.finalAmount || 0;
  }, [cart?.finalAmount]);

  const originalAmount = useMemo(() => {
    return cart?.originalAmount || 0;
  }, [cart?.originalAmount]);

  const discountAmount = useMemo(() => {
    return cart?.discountAmount || 0;
  }, [cart?.discountAmount]);

  return {
    cart,
    loading,
    error,
    itemCount,
    totalAmount,
    originalAmount,
    discountAmount,
    isEmpty: !cart?.items.length,
    loadCart,
    addItem,
    updateQuantity,
    removeItem,
    clearAll,
  };
}

/** 购物车数量Hook（轻量版） */
export function useCartCount() {
  const { itemCount, isEmpty } = useCart();
  return { count: isEmpty ? 0 : itemCount };
}

/** 购物车总计Hook */
export function useCartTotal() {
  const { totalAmount, originalAmount, discountAmount, cart } = useCart();
  
  return {
    originalAmount,
    discountAmount,
    totalAmount,
    couponDiscount: cart?.couponDiscount || 0,
    finalAmount: cart?.finalAmount || 0,
  };
}
