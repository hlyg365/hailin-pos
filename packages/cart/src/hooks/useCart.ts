// ============================================
// 海邻到家 - 购物车Hooks
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { cartService } from '../services';
import { useCartStore } from '@hailin/core';
import type { Cart, AddToCartParams, Product } from '@hailin/core';

// ============ 主购物车Hook ============

export function useCart() {
  const { cart, setCart, isLoading, setLoading } = useCartStore();
  const [error, setError] = useState<string | null>(null);

  // 加载购物车
  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 优先从API获取，如果离线则用本地
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (err: any) {
      // 获取本地购物车作为兜底
      const localCart = cartService.getLocalCart();
      setCart(localCart);
      if (localCart) {
        setError('已加载本地购物车');
      }
    } finally {
      setLoading(false);
    }
  }, [setCart, setLoading]);

  // 初始化加载
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // 添加商品
  const addItem = useCallback(async (productId: string, quantity: number = 1, remark?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const params: AddToCartParams = { productId, quantity, remark };
      const result = await cartService.addItem(params);
      
      if (result.success && result.cart) {
        setCart(result.cart);
        return { success: true };
      }
      
      setError(result.message || '添加失败');
      return { success: false, message: result.message };
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [setCart, setLoading]);

  // 添加商品对象（方便使用）
  const addProduct = useCallback(async (product: Product, quantity: number = 1) => {
    return addItem(product.id, quantity);
  }, [addItem]);

  // 更新数量
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    // 乐观更新UI
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
      
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      const originalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      
      return {
        ...prev,
        items,
        itemCount,
        originalAmount,
        totalAmount,
        finalAmount: totalAmount - prev.couponDiscount,
      };
    });
    
    // 发送到服务器
    try {
      const result = await cartService.updateItem({ itemId, quantity });
      if (!result.success) {
        loadCart(); // 失败则回滚
        return { success: false, message: result.message };
      }
      return { success: true };
    } catch {
      loadCart();
      return { success: false };
    }
  }, [setCart, loadCart]);

  // 移除商品
  const removeItem = useCallback(async (itemId: string) => {
    // 乐观更新UI
    setCart(prev => {
      if (!prev) return prev;
      
      const items = prev.items.filter(item => item.id !== itemId);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      const originalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
      
      return {
        ...prev,
        items,
        itemCount,
        originalAmount,
        totalAmount,
        finalAmount: totalAmount - prev.couponDiscount,
      };
    });
    
    try {
      const result = await cartService.removeItem(itemId);
      if (!result.success) {
        loadCart();
        return { success: false };
      }
      return { success: true };
    } catch {
      loadCart();
      return { success: false };
    }
  }, [setCart, loadCart]);

  // 清空购物车
  const clearAll = useCallback(async () => {
    setLoading(true);
    
    try {
      const result = await cartService.clearCart();
      
      if (result.success && result.cart) {
        setCart(result.cart);
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch {
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [setCart, setLoading]);

  // 应用优惠券
  const applyCoupon = useCallback(async (couponId: string) => {
    setLoading(true);
    
    try {
      const result = await cartService.applyCoupon(couponId);
      
      if (result.success && result.cart) {
        setCart(result.cart);
        return { success: true };
      }
      
      return { success: false, message: result.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [setCart, setLoading]);

  // 取消优惠券
  const removeCoupon = useCallback(async () => {
    setLoading(true);
    
    try {
      const result = await cartService.removeCoupon();
      
      if (result.success && result.cart) {
        setCart(result.cart);
        return { success: true };
      }
      return { success: false };
    } catch {
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [setCart, setLoading]);

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
    return (cart?.originalAmount || 0) - (cart?.totalAmount || 0) + (cart?.couponDiscount || 0);
  }, [cart]);

  return {
    cart,
    loading: isLoading,
    error,
    itemCount,
    totalAmount,
    originalAmount,
    discountAmount,
    isEmpty: !cart?.items.length,
    loadCart,
    addItem,
    addProduct,
    updateQuantity,
    removeItem,
    clearAll,
    applyCoupon,
    removeCoupon,
  };
}

// ============ 轻量级Hook ============

/** 购物车数量Hook */
export function useCartCount() {
  const { cart } = useCart();
  return {
    count: cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0,
    isEmpty: !cart?.items.length,
  };
}

/** 购物车总计Hook */
export function useCartTotal() {
  const { cart } = useCart();
  
  return {
    originalAmount: cart?.originalAmount || 0,
    discountAmount: (cart?.originalAmount || 0) - (cart?.totalAmount || 0),
    couponDiscount: cart?.couponDiscount || 0,
    totalAmount: cart?.totalAmount || 0,
    finalAmount: cart?.finalAmount || 0,
  };
}

/** 离线同步Hook */
export function useCartSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  const sync = useCallback(async () => {
    if (syncing) return;
    
    setSyncing(true);
    try {
      const syncResult = await cartService.syncOfflineQueue();
      setResult(syncResult);
      setLastSync(new Date());
      return syncResult;
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  const pendingCount = cartService.getOfflineQueueCount();

  return {
    syncing,
    lastSync,
    result,
    pendingCount,
    sync,
  };
}
