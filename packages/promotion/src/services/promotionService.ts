// ============================================
// 海邻到家 - 促销服务
// ============================================

import { apiClient, createApiRequest, ApiResponse } from '@hailin/core';

// 促销类型枚举
export enum PromotionType {
  DISCOUNT = 'discount',           // 折扣促销
  FULL_REDUCE = 'full_reduce',     // 满减促销
  FLASH_SALE = 'flash_sale',       // 限时秒杀
  POINTS_MULTIPLE = 'points_multiple', // 积分翻倍
  MEMBER_EXCLUSIVE = 'member_exclusive', // 会员专享
  BIRTHDAY_GIFT = 'birthday_gift', // 生日礼包
  NEW_MEMBER = 'new_member',       // 新客专享
  CLEARANCE = 'clearance',         // 清仓特卖
}

// 促销状态枚举
export enum PromotionStatus {
  DRAFT = 'draft',                 // 草稿
  PENDING = 'pending',             // 待审核
  APPROVED = 'approved',           // 已审核
  REJECTED = 'rejected',           // 已驳回
  RUNNING = 'running',             // 进行中
  PAUSED = 'paused',               // 已暂停
  ENDED = 'ended',                 // 已结束
  CANCELLED = 'cancelled',         // 已取消
}

// 促销规则接口
export interface PromotionRule {
  type: 'fixed_discount' | 'percentage_discount' | 'fixed_reduce' | 'gift' | 'points_multi';
  value: number;                   // 折扣值/减价金额/倍数
  condition?: {
    minAmount?: number;            // 最低消费金额
    minQuantity?: number;          // 最低购买数量
    productIds?: string[];         // 指定商品
    categoryIds?: string[];        // 指定分类
    memberLevels?: string[];       // 限定会员等级
  };
}

// 促销时段
export interface PromotionTimeSlot {
  startTime: string;              // HH:mm
  endTime: string;                // HH:mm
}

// 促销基本信息
export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  status: PromotionStatus;
  
  // 关联信息
  storeId?: string;               // 适用店铺，空则全部
  storeName?: string;
  
  // 规则
  rules: PromotionRule[];
  
  // 时间
  startDate: string;
  endDate: string;
  timeSlots?: PromotionTimeSlot[]; // 限时时段
  
  // 限制
  maxUsage?: number;               // 总使用次数限制
  maxUsagePerUser?: number;        // 每人限用次数
  currentUsage: number;            // 已使用次数
  
  // 设置
  priority: number;                // 优先级
  autoApply: boolean;              // 是否自动应用
  canCombine: boolean;             // 是否可与其他优惠叠加
  
  // 标签
  tags?: string[];
  
  // 审核信息
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  rejectReason?: string;
  
  // 创建信息
  creatorId: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
}

// 促销计算结果
export interface PromotionResult {
  promotionId: string;
  promotionName: string;
  type: PromotionType;
  discountAmount: number;
  pointsBonus?: number;
  giftItems?: { productId: string; quantity: number }[];
  message?: string;
}

// 促销申请请求
export interface CreatePromotionRequest {
  name: string;
  type: PromotionType;
  storeId?: string;
  rules: PromotionRule[];
  startDate: string;
  endDate: string;
  timeSlots?: PromotionTimeSlot[];
  maxUsage?: number;
  maxUsagePerUser?: number;
  priority?: number;
  autoApply?: boolean;
  canCombine?: boolean;
  tags?: string[];
}

// 促销计算请求
export interface CalculatePromotionRequest {
  storeId: string;
  memberId?: string;
  memberLevel?: string;
  items: { productId: string; quantity: number; price: number; categoryId?: string }[];
  totalAmount: number;
  isBirthday?: boolean;
}

// 促销服务类
export class PromotionService {
  
  /** 创建促销 */
  static async create(request: CreatePromotionRequest): Promise<ApiResponse<Promotion>> {
    return createApiRequest(() => apiClient.post<Promotion>('/api/promotions', request));
  }
  
  /** 更新促销 */
  static async update(promotionId: string, request: Partial<CreatePromotionRequest>): Promise<ApiResponse<Promotion>> {
    return createApiRequest(() => apiClient.put<Promotion>(`/api/promotions/${promotionId}`, request));
  }
  
  /** 删除促销 */
  static async delete(promotionId: string): Promise<ApiResponse<void>> {
    return createApiRequest(() => apiClient.delete<void>(`/api/promotions/${promotionId}`));
  }
  
  /** 获取促销详情 */
  static async getById(promotionId: string): Promise<ApiResponse<Promotion>> {
    return createApiRequest(() => apiClient.get<Promotion>(`/api/promotions/${promotionId}`));
  }
  
  /** 获取促销列表 */
  static async getList(params: {
    storeId?: string;
    type?: PromotionType;
    status?: PromotionStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<{ promotions: Promotion[]; total: number }>> {
    return createApiRequest(() => apiClient.get('/api/promotions', params));
  }
  
  /** 获取当前可用促销 */
  static async getAvailable(params: {
    storeId: string;
    memberId?: string;
    memberLevel?: string;
    totalAmount?: number;
  }): Promise<ApiResponse<Promotion[]>> {
    return createApiRequest(() => apiClient.get('/api/promotions/available', params));
  }
  
  /** 计算促销优惠 */
  static async calculate(request: CalculatePromotionRequest): Promise<ApiResponse<PromotionResult[]>> {
    return createApiRequest(() => apiClient.post<PromotionResult[]>('/api/promotions/calculate', request));
  }
  
  /** 应用促销 */
  static async apply(promotionId: string, orderId: string): Promise<ApiResponse<void>> {
    return createApiRequest(() => apiClient.post<void>(`/api/promotions/${promotionId}/apply`, { orderId }));
  }
  
  /** 取消应用促销 */
  static async cancelApply(promotionId: string, orderId: string): Promise<ApiResponse<void>> {
    return createApiRequest(() => apiClient.delete<void>(`/api/promotions/${promotionId}/apply/${orderId}`));
  }
  
  /** 提交审核 */
  static async submitForApproval(promotionId: string): Promise<ApiResponse<void>> {
    return createApiRequest(() => apiClient.post<void>(`/api/promotions/${promotionId}/submit`));
  }
  
  /** 审核促销 */
  static async approve(promotionId: string, approved: boolean, reason?: string): Promise<ApiResponse<void>> {
    return createApiRequest(() => apiClient.post<void>(`/api/promotions/${promotionId}/approve`, {
      approved,
      reason,
    }));
  }
  
  /** 暂停促销 */
  static async pause(promotionId: string): Promise<ApiResponse<void>> {
    return createApiRequest(() => apiClient.post<void>(`/api/promotions/${promotionId}/pause`));
  }
  
  /** 恢复促销 */
  static async resume(promotionId: string): Promise<ApiResponse<void>> {
    return createApiRequest(() => apiClient.post<void>(`/api/promotions/${promotionId}/resume`));
  }
  
  /** 结束促销 */
  static async end(promotionId: string): Promise<ApiResponse<void>> {
    return createApiRequest(() => apiClient.post<void>(`/api/promotions/${promotionId}/end`));
  }
  
  /** 获取促销统计 */
  static async getStatistics(promotionId: string): Promise<ApiResponse<{
    totalOrders: number;
    totalDiscount: number;
    avgDiscount: number;
    usageRate: number;
  }>> {
    return createApiRequest(() => apiClient.get(`/api/promotions/${promotionId}/statistics`));
  }
  
  /** 本地计算促销（离线使用） */
  static calculateLocal(
    promotions: Promotion[],
    request: CalculatePromotionRequest
  ): PromotionResult[] {
    const results: PromotionResult[] = [];
    const now = new Date();
    const nowTime = now.getHours() * 60 + now.getMinutes();
    const nowDate = now.toISOString().slice(0, 10);
    
    for (const promo of promotions) {
      // 检查状态
      if (promo.status !== PromotionStatus.RUNNING && promo.status !== PromotionStatus.APPROVED) {
        continue;
      }
      
      // 检查时间
      if (promo.startDate > nowDate || promo.endDate < nowDate) {
        continue;
      }
      
      // 检查时段
      if (promo.timeSlots?.length) {
        const inTimeSlot = promo.timeSlots.some(slot => {
          const [sh, sm] = slot.startTime.split(':').map(Number);
          const [eh, em] = slot.endTime.split(':').map(Number);
          const start = sh * 60 + sm;
          const end = eh * 60 + em;
          return nowTime >= start && nowTime <= end;
        });
        if (!inTimeSlot) continue;
      }
      
      // 检查店铺
      if (promo.storeId && promo.storeId !== request.storeId) {
        continue;
      }
      
      // 检查会员等级
      for (const rule of promo.rules) {
        if (rule.condition?.memberLevels?.length) {
          if (!request.memberLevel || !rule.condition.memberLevels.includes(request.memberLevel)) {
            continue;
          }
        }
      }
      
      // 计算优惠
      for (const rule of promo.rules) {
        const result = this.calculateRule(rule, request);
        if (result) {
          results.push({
            promotionId: promo.id,
            promotionName: promo.name,
            type: promo.type,
            ...result,
          });
        }
      }
    }
    
    // 按优先级排序
    results.sort((a, b) => b.discountAmount - a.discountAmount);
    
    return results;
  }
  
  /** 计算单条规则 */
  private static calculateRule(
    rule: PromotionRule,
    request: CalculatePromotionRequest
  ): Omit<PromotionResult, 'promotionId' | 'promotionName' | 'type'> | null {
    const { condition, type, value } = rule;
    
    // 检查条件
    if (condition) {
      if (condition.minAmount && request.totalAmount < condition.minAmount) {
        return null;
      }
      
      if (condition.minQuantity) {
        const totalQty = request.items.reduce((sum, item) => sum + item.quantity, 0);
        if (totalQty < condition.minQuantity) {
          return null;
        }
      }
      
      if (condition.productIds?.length) {
        const hasProducts = request.items.some(item => condition.productIds!.includes(item.productId));
        if (!hasProducts) {
          return null;
        }
      }
    }
    
    switch (type) {
      case 'fixed_discount':
        return { discountAmount: value };
        
      case 'percentage_discount':
        return { discountAmount: request.totalAmount * (value / 100) };
        
      case 'fixed_reduce':
        return { discountAmount: value };
        
      case 'points_multi':
        return { discountAmount: 0, pointsBonus: value };
        
      default:
        return null;
    }
  }
  
  /** 判断是否可叠加 */
  static canCombineWith(promo1: Promotion, promo2: Promotion): boolean {
    // 检查是否设置了不可叠加
    if (!promo1.canCombine || !promo2.canCombine) {
      return false;
    }
    
    // 同类型促销通常不可叠加
    if (promo1.type === promo2.type) {
      return false;
    }
    
    return true;
  }
  
  /** 获取促销类型名称 */
  static getTypeName(type: PromotionType): string {
    const names: Record<PromotionType, string> = {
      [PromotionType.DISCOUNT]: '折扣促销',
      [PromotionType.FULL_REDUCE]: '满减促销',
      [PromotionType.FLASH_SALE]: '限时秒杀',
      [PromotionType.POINTS_MULTIPLE]: '积分翻倍',
      [PromotionType.MEMBER_EXCLUSIVE]: '会员专享',
      [PromotionType.BIRTHDAY_GIFT]: '生日礼包',
      [PromotionType.NEW_MEMBER]: '新客专享',
      [PromotionType.CLEARANCE]: '清仓特卖',
    };
    return names[type] || '其他促销';
  }
}

export default PromotionService;
