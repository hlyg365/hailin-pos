// ============================================
// 海邻到家 - 订单服务
// ============================================

import { apiClient, createApiRequest, ApiResponse } from '@hailin/core';

// 订单状态枚举
export enum OrderStatus {
  PENDING = 'pending',           // 待支付
  PAID = 'paid',                // 已支付
  COMPLETED = 'completed',      // 已完成
  CANCELLED = 'cancelled',      // 已取消
  REFUNDING = 'refunding',      // 退款中
  REFUNDED = 'refunded',        // 已退款
  CLOSED = 'closed',            // 已关闭
}

// 订单类型枚举
export enum OrderType {
  POS = 'pos',                  // 收银台订单
  MINIAPP = 'miniapp',          // 小程序订单
  ONLINE = 'online',            // 线上订单
}

// 支付方式枚举
export enum PaymentMethod {
  CASH = 'cash',                // 现金
  WECHAT = 'wechat',            // 微信支付
  ALIPAY = 'alipay',            // 支付宝
  MEMBER_CARD = 'member_card',  // 会员卡
  MIXED = 'mixed',              // 混合支付
}

// 订单项接口
export interface OrderItem {
  productId: string;
  productName: string;
  barcode: string;
  imageUrl?: string;
  price: number;                // 单价
  quantity: number;             // 数量
  unit: string;                // 单位
  discount: number;             // 折扣金额
  subtotal: number;             // 小计
  weight?: number;             // 称重商品重量
}

// 订单接口
export interface Order {
  id: string;
  orderNo: string;              // 订单号
  type: OrderType;
  status: OrderStatus;
  
  // 店铺信息
  storeId: string;
  storeName: string;
  
  // 会员信息
  memberId?: string;
  memberName?: string;
  memberPhone?: string;
  memberLevel?: string;
  
  // 商品信息
  items: OrderItem[];
  totalQuantity: number;
  originalAmount: number;       // 商品总价
  discountAmount: number;       // 整单折扣
  memberDiscount: number;       // 会员折扣
  couponDiscount: number;       // 优惠券折扣
  promotionDiscount: number;    // 促销折扣
  finalAmount: number;          // 应付金额
  
  // 支付信息
  paymentMethod: PaymentMethod;
  paidAmount: number;           // 实付金额
  changeAmount: number;         // 找零金额
  paymentDetails?: PaymentDetail[];
  
  // 积分信息
  points: number;               // 获得积分
  pointsUsed: number;           // 使用积分
  pointsAmount: number;         // 积分抵扣金额
  
  // 其他信息
  remark?: string;              // 订单备注
  operatorId?: string;          // 操作员ID
  operatorName?: string;        // 操作员名称
  terminalNo?: string;          // 收银机编号
  
  // 时间信息
  createdAt: string;
  paidAt?: string;
  completedAt?: string;
  
  // 关联信息
  couponId?: string;
  couponCode?: string;
  promotionId?: string;
  relatedOrderId?: string;      // 关联订单（如退款关联原订单）
  
  // 扩展数据
  metadata?: Record<string, any>;
}

// 支付明细（混合支付）
export interface PaymentDetail {
  method: PaymentMethod;
  amount: number;
  transactionNo?: string;
}

// 创建订单请求
export interface CreateOrderRequest {
  storeId: string;
  type: OrderType;
  memberId?: string;
  items: Omit<OrderItem, 'subtotal'>[];
  paymentMethod: PaymentMethod;
  paymentDetails?: PaymentDetail[];
  couponId?: string;
  promotionId?: string;
  pointsUsed?: number;
  remark?: string;
  operatorId?: string;
  operatorName?: string;
  terminalNo?: string;
}

// 退款请求
export interface RefundRequest {
  orderId: string;
  refundAmount: number;
  reason: string;
  refundMethod?: PaymentMethod;
}

// 订单统计
export interface OrderStatistics {
  totalOrders: number;
  totalAmount: number;
  totalQuantity: number;
  averageAmount: number;
  paymentStats: Record<PaymentMethod, { count: number; amount: number }>;
}

// 订单服务类
export class OrderService {
  
  /** 创建订单 */
  static async create(request: CreateOrderRequest): Promise<ApiResponse<Order>> {
    return createApiRequest(async () => {
      const response = await apiClient.post<Order>('/api/orders', request);
      
      // 保存到本地
      await this.saveLocalOrder(response.data);
      
      return response;
    });
  }
  
  /** 支付订单 */
  static async pay(orderId: string, paymentDetails: PaymentDetail[]): Promise<ApiResponse<Order>> {
    return createApiRequest(async () => {
      const response = await apiClient.post<Order>(`/api/orders/${orderId}/pay`, {
        payments: paymentDetails,
      });
      
      // 更新本地订单
      await this.updateLocalOrder(response.data);
      
      return response;
    });
  }
  
  /** 取消订单 */
  static async cancel(orderId: string, reason?: string): Promise<ApiResponse<void>> {
    return createApiRequest(async () => {
      const response = await apiClient.post<void>(`/api/orders/${orderId}/cancel`, { reason });
      await this.deleteLocalOrder(orderId);
      return response;
    });
  }
  
  /** 退款 */
  static async refund(request: RefundRequest): Promise<ApiResponse<Order>> {
    return createApiRequest(async () => {
      const response = await apiClient.post<Order>(`/api/orders/${request.orderId}/refund`, {
        refundAmount: request.refundAmount,
        reason: request.reason,
        refundMethod: request.refundMethod,
      });
      
      await this.updateLocalOrder(response.data);
      return response;
    });
  }
  
  /** 获取订单详情 */
  static async getById(orderId: string): Promise<ApiResponse<Order>> {
    return createApiRequest(() => apiClient.get<Order>(`/api/orders/${orderId}`));
  }
  
  /** 根据订单号获取 */
  static async getByOrderNo(orderNo: string): Promise<ApiResponse<Order>> {
    return createApiRequest(() => apiClient.get<Order>(`/api/orders/by-no/${orderNo}`));
  }
  
  /** 获取订单列表 */
  static async getList(params: {
    storeId?: string;
    memberId?: string;
    status?: OrderStatus;
    type?: OrderType;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<{ orders: Order[]; total: number; page: number; pageSize: number }>> {
    return createApiRequest(() => apiClient.get('/api/orders', params));
  }
  
  /** 获取订单统计 */
  static async getStatistics(params: {
    storeId?: string;
    startDate: string;
    endDate: string;
  }): Promise<ApiResponse<OrderStatistics>> {
    return createApiRequest(() => apiClient.get('/api/orders/statistics', params));
  }
  
  /** 获取待同步订单 */
  static async getPendingOrders(): Promise<Order[]> {
    // 从本地存储获取
    if (typeof window === 'undefined') return [];
    
    const pending = localStorage.getItem('hailin_pending_orders');
    return pending ? JSON.parse(pending) : [];
  }
  
  /** 保存订单到本地 */
  static async saveLocalOrder(order: Order): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const orders = await this.getPendingOrders();
    orders.push(order);
    localStorage.setItem('hailin_pending_orders', JSON.stringify(orders));
  }
  
  /** 更新本地订单 */
  static async updateLocalOrder(order: Order): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const orders = await this.getPendingOrders();
    const index = orders.findIndex(o => o.id === order.id);
    if (index >= 0) {
      orders[index] = order;
      localStorage.setItem('hailin_pending_orders', JSON.stringify(orders));
    }
  }
  
  /** 删除本地订单 */
  static async deleteLocalOrder(orderId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const orders = await this.getPendingOrders();
    const filtered = orders.filter(o => o.id !== orderId);
    localStorage.setItem('hailin_pending_orders', JSON.stringify(filtered));
  }
  
  /** 同步待处理订单 */
  static async syncPendingOrders(): Promise<{ success: number; failed: number }> {
    const pending = await this.getPendingOrders();
    let success = 0;
    let failed = 0;
    
    for (const order of pending) {
      try {
        if (order.status === OrderStatus.PENDING) {
          // 未支付订单，尝试重新提交
          await this.create({
            storeId: order.storeId,
            type: order.type,
            memberId: order.memberId,
            items: order.items,
            paymentMethod: order.paymentMethod,
            paymentDetails: order.paymentDetails,
            remark: order.remark,
            operatorId: order.operatorId,
            operatorName: order.operatorName,
          });
        }
        success++;
      } catch (error) {
        console.error('Sync order failed:', order.id, error);
        failed++;
      }
    }
    
    // 清除已同步的订单
    if (success > 0) {
      const failedOrders = pending.slice(-failed);
      localStorage.setItem('hailin_pending_orders', JSON.stringify(failedOrders));
    }
    
    return { success, failed };
  }
  
  /** 生成订单号 */
  static generateOrderNo(type: OrderType, storeId: string): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const time = now.getTime().toString().slice(-6);
    const random = Math.random().toString(36).slice(2, 4).toUpperCase();
    
    const prefix = {
      [OrderType.POS]: 'POS',
      [OrderType.MINIAPP]: 'MIN',
      [OrderType.ONLINE]: 'WEB',
    }[type];
    
    return `${prefix}${storeId.slice(0, 4)}${date}${time}${random}`;
  }
}

export default OrderService;
