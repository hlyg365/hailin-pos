// ============================================
// 海邻到家 - 购物车服务
// ============================================

import { apiClient } from '@hailin/core';
import type { Cart, AddToCartParams, UpdateCartParams, Product } from '@hailin/core';
import { generateId } from '@hailin/core';

// 本地购物车存储键
const CART_STORAGE_KEY = 'hailin_cart';

/**
 * 创建本地购物车项
 */
function createLocalCartItem(product: Product, quantity: number): any {
  const total = product.price * quantity;
  return {
    id: generateId('item'),
    productId: product.id,
    product,
    quantity,
    price: product.price,
    discount: 0,
    total,
    isWeighted: false,
    unit: product.unit,
  };
}

/**
 * 计算购物车金额
 */
function calculateCartAmount(items: any[]): {
  itemCount: number;
  originalAmount: number;
  discountAmount: number;
  totalAmount: number;
  finalAmount: number;
} {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const originalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = items.reduce((sum, item) => sum + item.discount, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
  const finalAmount = totalAmount;
  
  return {
    itemCount,
    originalAmount,
    discountAmount,
    totalAmount,
    finalAmount,
  };
}

// ============ 购物车API服务 ============

export const cartApi = {
  /**
   * 获取购物车
   */
  async getCart(): Promise<Cart | null> {
    const response = await apiClient.get<Cart>('/cart');
    return response.success ? response.data! : null;
  },

  /**
   * 添加商品到购物车
   */
  async addItem(params: AddToCartParams): Promise<{ success: boolean; cart?: Cart; message?: string }> {
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
        return addToLocalCart(params);
      }
      return { success: false, message: error.message || '添加失败' };
    }
  },

  /**
   * 更新商品数量
   */
  async updateItem(params: UpdateCartParams): Promise<{ success: boolean; cart?: Cart; message?: string }> {
    try {
      const response = await apiClient.put<Cart>(`/cart/items/${params.itemId}`, {
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
  },

  /**
   * 移除商品
   */
  async removeItem(itemId: string): Promise<{ success: boolean; cart?: Cart; message?: string }> {
    try {
      const response = await apiClient.delete<Cart>(`/cart/items/${itemId}`);
      
      if (response.success && response.data) {
        saveCartToLocal(response.data);
        return { success: true, cart: response.data };
      }
      
      return { success: false, message: response.message || '移除失败' };
    } catch (error: any) {
      return { success: false, message: error.message || '移除失败' };
    }
  },

  /**
   * 清空购物车
   */
  async clearCart(): Promise<{ success: boolean; cart?: Cart; message?: string }> {
    try {
      const response = await apiClient.delete<Cart>('/cart');
      
      if (response.success) {
        const emptyCart = createEmptyCart();
        saveCartToLocal(emptyCart);
        return { success: true, cart: emptyCart };
      }
      
      return { success: false, message: response.message || '清空失败' };
    } catch (error: any) {
      return { success: false, message: error.message || '清空失败' };
    }
  },

  /**
   * 应用优惠券
   */
  async applyCoupon(couponId: string): Promise<{ success: boolean; cart?: Cart; message?: string }> {
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
  },

  /**
   * 取消优惠券
   */
  async removeCoupon(): Promise<{ success: boolean; cart?: Cart }> {
    try {
      const response = await apiClient.delete<Cart>('/cart/coupon');
      
      if (response.success && response.data) {
        saveCartToLocal(response.data);
        return { success: true, cart: response.data };
      }
      
      return { success: false };
    } catch {
      return { success: false };
    }
  },
};

// ============ 本地购物车操作 ============

/**
 * 添加到本地购物车（离线模式）
 */
async function addToLocalCart(params: AddToCartParams): Promise<{ success: boolean; cart?: Cart; message?: string }> {
  try {
    // 获取当前本地购物车
    let cart = getLocalCart() || createEmptyCart();
    
    // 检查商品是否已存在
    const existingItem = cart.items.find(item => item.productId === params.productId);
    
    if (existingItem) {
      // 更新数量
      existingItem.quantity += params.quantity;
      existingItem.total = existingItem.price * existingItem.quantity;
    } else {
      // 获取商品信息（这里简化处理，实际应该调用商品API）
      const product = await getProductById(params.productId);
      if (!product) {
        return { success: false, message: '商品不存在' };
      }
      
      // 添加新项
      cart.items.push(createLocalCartItem(product, params.quantity));
    }
    
    // 重新计算金额
    const amounts = calculateCartAmount(cart.items);
    cart = { ...cart, ...amounts };
    
    // 保存
    saveCartToLocal(cart);
    
    // 保存到离线队列
    saveToOfflineQueue('add', params);
    
    return { success: true, cart };
  } catch (error) {
    return { success: false, message: '离线添加失败' };
  }
}

/**
 * 获取商品信息
 */
async function getProductById(productId: string): Promise<Product | null> {
  try {
    const response = await apiClient.get<Product>(`/products/${productId}`);
    return response.success ? response.data! : null;
  } catch {
    return null;
  }
}

/**
 * 创建空购物车
 */
function createEmptyCart(): Cart {
  return {
    id: generateId('cart'),
    items: [],
    itemCount: 0,
    originalAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    finalAmount: 0,
  };
}

/**
 * 保存到本地存储
 */
function saveCartToLocal(cart: Cart): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Failed to save cart to local:', error);
  }
}

/**
 * 获取本地购物车
 */
function getLocalCart(): Cart | null {
  try {
    const str = localStorage.getItem(CART_STORAGE_KEY);
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
}

/**
 * 保存到离线队列
 */
function saveToOfflineQueue(action: string, params: any): void {
  try {
    const queue = JSON.parse(localStorage.getItem('hailin_offline_cart_queue') || '[]');
    queue.push({ action, params, timestamp: Date.now() });
    localStorage.setItem('hailin_offline_cart_queue', JSON.stringify(queue));
  } catch {
    // 忽略
  }
}

/**
 * 同步离线队列
 */
export async function syncOfflineQueue(): Promise<{ success: number; failed: number }> {
  try {
    const queue = JSON.parse(localStorage.getItem('hailin_offline_cart_queue') || '[]');
    if (queue.length === 0) {
      return { success: 0, failed: 0 };
    }
    
    let success = 0;
    let failed = 0;
    const remaining: any[] = [];
    
    for (const item of queue) {
      try {
        switch (item.action) {
          case 'add':
            await apiClient.post('/cart/items', item.params);
            success++;
            break;
          case 'update':
            await apiClient.put(`/cart/items/${item.params.itemId}`, { quantity: item.params.quantity });
            success++;
            break;
          case 'remove':
            await apiClient.delete(`/cart/items/${item.params.itemId}`);
            success++;
            break;
          default:
            remaining.push(item);
        }
      } catch {
        failed++;
        remaining.push(item);
      }
    }
    
    // 保存剩余项
    localStorage.setItem('hailin_offline_cart_queue', JSON.stringify(remaining));
    
    return { success, failed };
  } catch {
    return { success: 0, failed: 0 };
  }
}

/**
 * 获取离线队列数量
 */
export function getOfflineQueueCount(): number {
  try {
    const queue = JSON.parse(localStorage.getItem('hailin_offline_cart_queue') || '[]');
    return queue.length;
  } catch {
    return 0;
  }
}

// 导出
export const cartService = {
  ...cartApi,
  syncOfflineQueue,
  getOfflineQueueCount,
  getLocalCart,
};

export default cartService;
