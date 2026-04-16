// ============================================
// 海邻到家 - 购物车服务
// ============================================

import { apiClient } from '@hailin/core';
import type { Cart, AddToCartParams, UpdateCartParams } from '@hailin/core';

// 添加商品到购物车
export async function addToCart(params: AddToCartParams): Promise<{ success: boolean; cart?: Cart; message?: string }> {
  try {
    const response = await apiClient.post<Cart>('/cart/items', params);
    
    if (response.success && response.data) {
      // 同步到本地存储
      saveCartToLocal(response.data);
      return { success: true, cart: response.data };
    }
    
    return { success: false, message: response.message || '添加失败' };
  } catch (error: any) {
    // 离线模式：保存到本地队列
    if (!navigator.onLine) {
      return addToCartOffline(params);
    }
    return { success: false, message: error.message || '添加失败' };
  }
}

// 更新商品数量
export async function updateCartItem(params: UpdateCartParams): Promise<{ success: boolean; cart?: Cart; message?: string }> {
  try {
    const response = await apiClient.put<Cart>('/cart/items/' + params.itemId, {
      quantity: params.quantity,
    });
    
    if (response.success && response.data) {
      saveCartToLocal(response.data);
      return { success: true, cart: response.data };
    }
    
    return { success: false, message: response.message || '更新失败' };
  } catch (error: any) {
    return { success: false, message: error.message || '更新失败' };
  }
}

// 移除商品
export async function removeFromCart(itemId: string): Promise<{ success: boolean; cart?: Cart; message?: string }> {
  try {
    const response = await apiClient.delete<Cart>('/cart/items/' + itemId);
    
    if (response.success && response.data) {
      saveCartToLocal(response.data);
      return { success: true, cart: response.data };
    }
    
    return { success: false, message: response.message || '移除失败' };
  } catch (error: any) {
    return { success: false, message: error.message || '移除失败' };
  }
}

// 清空购物车
export async function clearCart(): Promise<{ success: boolean; cart?: Cart; message?: string }> {
  try {
    const response = await apiClient.delete<Cart>('/cart');
    
    if (response.success) {
      saveCartToLocal(response.data || createEmptyCart());
      return { success: true, cart: response.data || createEmptyCart() };
    }
    
    return { success: false, message: response.message || '清空失败' };
  } catch (error: any) {
    return { success: false, message: error.message || '清空失败' };
  }
}

// 获取购物车
export async function getCart(): Promise<Cart | null> {
  try {
    const response = await apiClient.get<Cart>('/cart');
    
    if (response.success && response.data) {
      saveCartToLocal(response.data);
      return response.data;
    }
    
    // 返回本地缓存
    return getLocalCart();
  } catch (error) {
    return getLocalCart();
  }
}

// 应用优惠券
export async function applyCoupon(couponId: string): Promise<{ success: boolean; cart?: Cart; message?: string }> {
  try {
    const response = await apiClient.post<Cart>('/cart/apply-coupon', { couponId });
    
    if (response.success && response.data) {
      saveCartToLocal(response.data);
      return { success: true, cart: response.data };
    }
    
    return { success: false, message: response.message || '优惠券不可用' };
  } catch (error: any) {
    return { success: false, message: error.message || '优惠券不可用' };
  }
}

// 本地存储
const CART_KEY = 'hailin_cart';

function saveCartToLocal(cart: Cart): void {
  try {
    wx?.setStorageSync?.(CART_KEY, cart);
  } catch {}
}

function getLocalCart(): Cart | null {
  try {
    return wx?.getStorageSync?.(CART_KEY) || null;
  } catch {
    return null;
  }
}

// 离线模式添加
async function addToCartOffline(params: AddToCartParams): Promise<{ success: boolean; cart?: Cart; message?: string }> {
  // 保存到离线队列
  try {
    const queue = wx?.getStorageSync?.('cart_offline_queue') || [];
    queue.push({ ...params, timestamp: Date.now() });
    wx?.setStorageSync?.('cart_offline_queue', queue);
    return { success: true, message: '已加入离线购物车' };
  } catch {
    return { success: false, message: '离线添加失败' };
  }
}

// 创建空购物车
function createEmptyCart(): Cart {
  return {
    id: '',
    items: [],
    itemCount: 0,
    originalAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    finalAmount: 0,
  };
}

// 导出服务
export const cartService = {
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCart,
  applyCoupon,
};

export default cartService;
