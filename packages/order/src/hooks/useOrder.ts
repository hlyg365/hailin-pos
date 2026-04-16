// ============================================
// 海邻到家 - 订单Hook
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { OrderService, Order, OrderStatus, CreateOrderRequest, PaymentDetail, RefundRequest } from '../services/orderService';
import { useCart } from '@hailin/cart';
import { useMember } from '@hailin/member';
import { useAuthStore } from '@hailin/core';

interface UseOrdersOptions {
  storeId?: string;
  autoLoad?: boolean;
}

interface UseOrdersResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
  load: (params?: any) => Promise<void>;
  refresh: () => Promise<void>;
  create: (items: CreateOrderRequest['items'], paymentMethod: any) => Promise<Order>;
  pay: (orderId: string, payments: PaymentDetail[]) => Promise<Order>;
  cancel: (orderId: string, reason?: string) => Promise<void>;
  refund: (request: RefundRequest) => Promise<Order>;
}

/** 订单列表Hook */
export function useOrders(options: UseOrdersOptions = {}): UseOrdersResult {
  const { storeId, autoLoad = true } = options;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const load = useCallback(async (params: any = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await OrderService.getList({
        storeId,
        page,
        pageSize,
        ...params,
      });
      
      if (response.success) {
        setOrders(response.data.orders);
        setTotal(response.data.total);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeId, page, pageSize]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  const create = useCallback(async (items: CreateOrderRequest['items'], paymentMethod: any): Promise<Order> => {
    const authStore = useAuthStore.getState();
    
    const response = await OrderService.create({
      storeId: storeId || authStore.storeId,
      type: 'pos',
      items,
      paymentMethod,
      operatorId: authStore.operatorId,
      operatorName: authStore.operatorName,
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data;
  }, [storeId]);

  const pay = useCallback(async (orderId: string, payments: PaymentDetail[]): Promise<Order> => {
    const response = await OrderService.pay(orderId, payments);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    // 更新本地列表
    setOrders(prev => prev.map(o => o.id === orderId ? response.data : o));
    
    return response.data;
  }, []);

  const cancel = useCallback(async (orderId: string, reason?: string): Promise<void> => {
    const response = await OrderService.cancel(orderId, reason);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    // 从列表移除
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  const refund = useCallback(async (request: RefundRequest): Promise<Order> => {
    const response = await OrderService.refund(request);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    // 更新本地列表
    setOrders(prev => prev.map(o => o.id === request.orderId ? response.data : o));
    
    return response.data;
  }, []);

  return {
    orders,
    loading,
    error,
    total,
    page,
    pageSize,
    load,
    refresh,
    create,
    pay,
    cancel,
    refund,
  };
}

/** 当前订单Hook */
export function useCurrentOrder() {
  const { cartItems, clearCart, subtotal, discount, finalAmount } = useCart();
  const { currentMember, calculateDiscount } = useMember();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const memberDiscount = currentMember 
    ? calculateDiscount(finalAmount)
    : 0;

  const createOrder = useCallback(async (paymentMethod: any, paymentDetails?: PaymentDetail[]) => {
    if (cartItems.length === 0) {
      throw new Error('购物车为空');
    }

    setLoading(true);

    try {
      const authStore = useAuthStore.getState();
      
      const response = await OrderService.create({
        storeId: authStore.storeId,
        type: 'pos',
        memberId: currentMember?.id,
        items: cartItems.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          barcode: item.product.barcode,
          imageUrl: item.product.imageUrl,
          price: item.product.price,
          quantity: item.quantity,
          unit: item.unit || '件',
          discount: 0,
        })),
        paymentMethod,
        paymentDetails,
        operatorId: authStore.operatorId,
        operatorName: authStore.operatorName,
      });

      if (response.success) {
        setOrder(response.data);
        clearCart();
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } finally {
      setLoading(false);
    }
  }, [cartItems, currentMember, clearCart]);

  const payOrder = useCallback(async (orderId: string, payments: PaymentDetail[]): Promise<Order> => {
    setLoading(true);

    try {
      const response = await OrderService.pay(orderId, payments);
      
      if (response.success) {
        setOrder(response.data);
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    order,
    loading,
    memberDiscount,
    createOrder,
    payOrder,
    setOrder,
    clearOrder: () => setOrder(null),
  };
}

/** 订单统计Hook */
export function useOrderStatistics(storeId?: string) {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (startDate: string, endDate: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await OrderService.getStatistics({
        storeId,
        startDate,
        endDate,
      });

      if (response.success) {
        setStatistics(response.data);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  return { statistics, loading, error, load };
}
