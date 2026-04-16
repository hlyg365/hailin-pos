// ============================================
// 海邻到家 - 支付服务
// ============================================

import { apiClient, createApiRequest, ApiResponse } from '@hailin/core';
import type { PaymentMethod } from '@hailin/order';

// 支付状态枚举
export enum PaymentStatus {
  PENDING = 'pending',         // 待支付
  PROCESSING = 'processing',   // 支付中
  SUCCESS = 'success',         // 支付成功
  FAILED = 'failed',           // 支付失败
  CANCELLED = 'cancelled',     // 已取消
  REFUNDED = 'refunded',       // 已退款
}

// 支付渠道枚举
export enum PaymentChannel {
  CASH = 'cash',               // 现金
  WECHAT_NATIVE = 'wechat_native',     // 微信扫码付
  WECHAT_JSAPI = 'wechat_jsapi',       // 微信JSAPI
  WECHAT_H5 = 'wechat_h5',             // 微信H5
  ALIPAY_NATIVE = 'alipay_native',     // 支付宝扫码付
  ALIPAY_WAP = 'alipay_wap',           // 支付宝手机网站
  UNION_NATIVE = 'union_native',       // 银联扫码付
  MEMBERS_CARD = 'member_card',       // 会员卡
  POINTS = 'points',                 // 积分
  MIXED = 'mixed',                    // 混合支付
}

// 支付请求接口
export interface PaymentRequest {
  orderId: string;
  orderNo: string;
  amount: number;
  channel: PaymentChannel;
  subject: string;
  description?: string;
  operatorId?: string;
  operatorName?: string;
  terminalNo?: string;
}

// 支付响应接口
export interface PaymentResponse {
  orderId: string;
  orderNo: string;
  transactionNo: string;
  amount: number;
  channel: PaymentChannel;
  status: PaymentStatus;
  paidAt?: string;
  qrcode?: string;           // 扫码支付二维码
  qrcodeUrl?: string;        // 扫码支付链接
}

// 退款请求接口
export interface RefundRequest {
  orderId: string;
  transactionNo: string;
  refundAmount: number;
  refundReason: string;
  operatorId?: string;
}

// 退款响应接口
export interface RefundResponse {
  refundNo: string;
  refundAmount: number;
  refundStatus: 'pending' | 'processing' | 'success' | 'failed';
  refundTime?: string;
}

// 支付记录接口
export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNo: string;
  transactionNo: string;
  channel: PaymentChannel;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
  operatorId?: string;
  operatorName?: string;
  remark?: string;
}

// 对账记录
export interface ReconciliationRecord {
  date: string;
  channel: PaymentChannel;
  totalCount: number;
  totalAmount: number;
  successCount: number;
  successAmount: number;
  refundCount: number;
  refundAmount: number;
  failCount: number;
  failAmount: number;
}

// 支付服务类
export class PaymentService {
  
  /** 创建支付 */
  static async createPayment(request: PaymentRequest): Promise<ApiResponse<PaymentResponse>> {
    return createApiRequest(() => apiClient.post<PaymentResponse>('/api/payments/create', request));
  }
  
  /** 查询支付状态 */
  static async queryPayment(orderId: string): Promise<ApiResponse<PaymentResponse>> {
    return createApiRequest(() => apiClient.get<PaymentResponse>(`/api/payments/query/${orderId}`));
  }
  
  /** 取消支付 */
  static async cancelPayment(orderId: string): Promise<ApiResponse<void>> {
    return createApiRequest(() => apiClient.post<void>(`/api/payments/cancel/${orderId}`));
  }
  
  /** 申请退款 */
  static async refund(request: RefundRequest): Promise<ApiResponse<RefundResponse>> {
    return createApiRequest(() => apiClient.post<RefundResponse>('/api/payments/refund', request));
  }
  
  /** 查询退款状态 */
  static async queryRefund(refundNo: string): Promise<ApiResponse<RefundResponse>> {
    return createApiRequest(() => apiClient.get<RefundResponse>(`/api/payments/refund/query/${refundNo}`));
  }
  
  /** 获取支付记录 */
  static async getPaymentRecords(params: {
    storeId?: string;
    channel?: PaymentChannel;
    status?: PaymentStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<{ records: PaymentRecord[]; total: number }>> {
    return createApiRequest(() => apiClient.get('/api/payments/records', params));
  }
  
  /** 日结对账 */
  static async dailyReconciliation(storeId: string, date: string): Promise<ApiResponse<{
    orders: number;
    amount: number;
    payments: ReconciliationRecord[];
  }>> {
    return createApiRequest(() => apiClient.get(`/api/payments/reconciliation/${storeId}`, { date }));
  }
  
  /** 现金找零计算 */
  static calculateChange(amount: number, received: number): number {
    return Math.max(0, received - amount);
  }
  
  /** 现金找零最优组合 */
  static calculateChangeBreakdown(amount: number, received: number): Record<string, number> {
    const change = this.calculateChange(amount, received);
    if (change <= 0) return {};
    
    // 纸币找零配置（单位：元）
    const bills = [100, 50, 20, 10, 5, 1];
    const coins = [0.5, 0.1, 0.05];
    
    const breakdown: Record<string, number> = {};
    let remaining = change;
    
    for (const bill of bills) {
      if (remaining >= bill) {
        const count = Math.floor(remaining / bill);
        breakdown[`${bill}元纸币`] = count;
        remaining = Math.round((remaining - bill * count) * 100) / 100;
      }
    }
    
    for (const coin of coins) {
      if (remaining >= coin) {
        const count = Math.floor(remaining / coin);
        breakdown[`${coin}元硬币`] = count;
        remaining = Math.round((remaining - coin * count) * 100) / 100;
      }
    }
    
    return breakdown;
  }
  
  /** 检验支付密码 */
  static async verifyPayPassword(memberId: string, password: string): Promise<ApiResponse<boolean>> {
    return createApiRequest(() => apiClient.post<boolean>('/api/payments/verify-password', {
      memberId,
      password,
    }));
  }
  
  /** 会员卡支付 */
  static async memberCardPay(orderId: string, memberId: string, password: string, amount: number): Promise<ApiResponse<PaymentResponse>> {
    return createApiRequest(() => apiClient.post<PaymentResponse>('/api/payments/member-card', {
      orderId,
      memberId,
      password,
      amount,
    }));
  }
  
  /** 积分支付 */
  static async pointsPay(orderId: string, memberId: string, points: number): Promise<ApiResponse<PaymentResponse>> {
    return createApiRequest(() => apiClient.post<PaymentResponse>('/api/payments/points', {
      orderId,
      memberId,
      points,
    }));
  }
  
  /** 获取支付渠道图标 */
  static getChannelIcon(channel: PaymentChannel): string {
    const icons: Record<PaymentChannel, string> = {
      [PaymentChannel.CASH]: '💵',
      [PaymentChannel.WECHAT_NATIVE]: '💚',
      [PaymentChannel.WECHAT_JSAPI]: '💚',
      [PaymentChannel.WECHAT_H5]: '💚',
      [PaymentChannel.ALIPAY_NATIVE]: '💙',
      [PaymentChannel.ALIPAY_WAP]: '💙',
      [PaymentChannel.UNION_NATIVE]: '💳',
      [PaymentChannel.MEMBERS_CARD]: '🎫',
      [PaymentChannel.POINTS]: '⭐',
      [PaymentChannel.MIXED]: '🔄',
    };
    return icons[channel] || '💰';
  }
  
  /** 获取支付渠道名称 */
  static getChannelName(channel: PaymentChannel): string {
    const names: Record<PaymentChannel, string> = {
      [PaymentChannel.CASH]: '现金',
      [PaymentChannel.WECHAT_NATIVE]: '微信支付',
      [PaymentChannel.WECHAT_JSAPI]: '微信支付',
      [PaymentChannel.WECHAT_H5]: '微信支付',
      [PaymentChannel.ALIPAY_NATIVE]: '支付宝',
      [PaymentChannel.ALIPAY_WAP]: '支付宝',
      [PaymentChannel.UNION_NATIVE]: '云闪付',
      [PaymentChannel.MEMBERS_CARD]: '会员卡',
      [PaymentChannel.POINTS]: '积分',
      [PaymentChannel.MIXED]: '混合支付',
    };
    return names[channel] || '其他支付';
  }
}

export default PaymentService;
