/**
 * 促销活动服务
 * 管理促销活动的创建、验证、同步和执行
 */

// ============== 数据类型定义 ==============

/**
 * 促销活动类型
 */
export type PromotionType = 
  | 'discount_percent'    // 折扣优惠（如：9折、8折）
  | 'discount_amount'     // 满减优惠（如：满100减20）
  | 'buy_x_get_y'         // 买赠活动（如：买2送1）
  | 'flash_sale'          // 限时秒杀（特定时间特价）
  | 'member_exclusive'    // 会员专享（会员专属折扣）
  | 'bundle'              // 组合套餐（如：A+B特价）
  | 'clearance';          // 清货特价（晚8点清货等）

/**
 * 促销活动状态
 */
export type PromotionStatus = 
  | 'draft'     // 草稿
  | 'pending'   // 待发布
  | 'active'    // 进行中
  | 'paused'    // 已暂停
  | 'ended';    // 已结束

/**
 * 商品范围类型
 */
export type ProductScopeType = 
  | 'all'       // 全部商品
  | 'category'  // 按分类
  | 'product';  // 指定商品

/**
 * 店铺范围类型
 */
export type StoreScopeType = 
  | 'all'       // 全部店铺
  | 'selected'; // 指定店铺

/**
 * 促销商品配置
 */
export interface PromotionProductConfig {
  productId: string;
  productName: string;
  barcode: string;
  category: string;
  originalPrice: number;      // 原价
  promotionPrice?: number;    // 促销价（秒杀、清货必填）
  promotionDiscount?: number; // 促销折扣（折扣活动必填，如90表示9折）
  limitQuantity?: number;     // 限购数量
  giftProductId?: string;     // 赠品商品ID（买赠活动）
  giftQuantity?: number;      // 赠品数量
}

/**
 * 促销店铺配置
 */
export interface PromotionStoreConfig {
  storeId: string;
  storeName: string;
  storeAddress: string;
  selected: boolean;
  synced: boolean;            // 是否已同步
  syncTime?: string;          // 同步时间
  syncStatus?: 'pending' | 'success' | 'failed';
  activeProducts?: number;    // 已生效商品数
}

/**
 * 活动条件配置
 */
export interface PromotionConditions {
  minAmount?: number;         // 最低消费金额
  minQuantity?: number;       // 最低购买数量
  buyQuantity?: number;       // 购买数量（买赠活动）
  getQuantity?: number;       // 赠送数量（买赠活动）
  memberLevels?: string[];    // 适用会员等级
  timeSlots?: TimeSlot[];     // 时段限制（秒杀活动）
  firstOrderOnly?: boolean;   // 仅限首单
}

/**
 * 时段配置
 */
export interface TimeSlot {
  startTime: string;  // 开始时间（如：12:00）
  endTime: string;    // 结束时间（如：14:00）
  days?: number[];    // 适用星期（0-6，0表示周日）
}

/**
 * 活动奖励配置
 */
export interface PromotionRewards {
  discountPercent?: number;   // 折扣百分比（如：90表示9折）
  discountAmount?: number;    // 减免金额
  maxDiscount?: number;       // 最高优惠金额
  freeProductId?: string;     // 赠品ID
  freeQuantity?: number;      // 赠品数量
  pointsMultiplier?: number;  // 积分倍数
}

/**
 * 促销活动完整定义
 */
export interface PromotionActivity {
  id: string;
  code: string;
  name: string;
  type: PromotionType;
  status: PromotionStatus;
  description: string;
  
  // 时间设置
  startTime: string;
  endTime: string;
  timeSlots?: TimeSlot[];     // 每日时段限制
  
  // 优先级（数字越小优先级越高）
  priority: number;
  
  // 商品范围
  productScope: ProductScopeType;
  selectedCategories: string[];
  productConfigs: PromotionProductConfig[];
  
  // 店铺范围
  storeScope: StoreScopeType;
  storeConfigs: PromotionStoreConfig[];
  
  // 活动规则
  conditions: PromotionConditions;
  rewards: PromotionRewards;
  
  // 统计数据
  usageCount: number;
  totalSales: number;
  totalDiscount: number;
  
  // 审核信息
  createBy: string;
  createTime: string;
  updateTime: string;
  publishTime?: string;
  auditBy?: string;
  auditTime?: string;
  auditRemark?: string;
}

/**
 * 活动验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

/**
 * 同步结果
 */
export interface SyncResult {
  success: boolean;
  storeId: string;
  storeName: string;
  message?: string;
  syncedAt?: string;
}

// ============== 活动类型配置 ==============

export const PROMOTION_TYPE_CONFIG: Record<PromotionType, {
  name: string;
  icon: string;
  description: string;
  requiresProductPrice: boolean;  // 是否需要设置促销价
  requiresDiscountPercent: boolean; // 是否需要设置折扣
  requiresBuyGet: boolean;  // 是否需要买赠配置
  requiresTimeSlots: boolean; // 是否需要时段配置
}> = {
  discount_percent: {
    name: '折扣优惠',
    icon: 'Percent',
    description: '设置商品折扣，如9折、8折等',
    requiresProductPrice: false,
    requiresDiscountPercent: true,
    requiresBuyGet: false,
    requiresTimeSlots: false,
  },
  discount_amount: {
    name: '满减优惠',
    icon: 'Gift',
    description: '满指定金额减指定金额',
    requiresProductPrice: false,
    requiresDiscountPercent: false,
    requiresBuyGet: false,
    requiresTimeSlots: false,
  },
  buy_x_get_y: {
    name: '买赠活动',
    icon: 'Package',
    description: '买N件送M件同款或指定商品',
    requiresProductPrice: false,
    requiresDiscountPercent: false,
    requiresBuyGet: true,
    requiresTimeSlots: false,
  },
  flash_sale: {
    name: '限时秒杀',
    icon: 'TrendingUp',
    description: '指定时段内商品特价销售',
    requiresProductPrice: true,
    requiresDiscountPercent: false,
    requiresBuyGet: false,
    requiresTimeSlots: true,
  },
  member_exclusive: {
    name: '会员专享',
    icon: 'Users',
    description: '特定会员等级专属优惠',
    requiresProductPrice: false,
    requiresDiscountPercent: true,
    requiresBuyGet: false,
    requiresTimeSlots: false,
  },
  bundle: {
    name: '组合套餐',
    icon: 'Tag',
    description: '多件商品组合特价',
    requiresProductPrice: true,
    requiresDiscountPercent: false,
    requiresBuyGet: false,
    requiresTimeSlots: false,
  },
  clearance: {
    name: '清货特价',
    icon: 'Clock',
    description: '临期商品或晚8点清货特价',
    requiresProductPrice: true,
    requiresDiscountPercent: false,
    requiresBuyGet: false,
    requiresTimeSlots: true,
  },
};

// ============== 验证函数 ==============

/**
 * 验证促销活动
 */
export function validatePromotion(promotion: Partial<PromotionActivity>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 必填字段验证
  if (!promotion.name?.trim()) {
    errors.push({ field: 'name', message: '活动名称不能为空' });
  }

  if (!promotion.type) {
    errors.push({ field: 'type', message: '请选择活动类型' });
  }

  if (!promotion.startTime) {
    errors.push({ field: 'startTime', message: '请设置开始时间' });
  }

  if (!promotion.endTime) {
    errors.push({ field: 'endTime', message: '请设置结束时间' });
  }

  // 时间验证
  if (promotion.startTime && promotion.endTime) {
    const start = new Date(promotion.startTime);
    const end = new Date(promotion.endTime);
    if (start >= end) {
      errors.push({ field: 'endTime', message: '结束时间必须晚于开始时间' });
    }
    if (end < new Date()) {
      warnings.push({ field: 'endTime', message: '结束时间已过，活动将不会生效' });
    }
  }

  // 商品验证 - 必须选择商品
  if (!promotion.productScope) {
    errors.push({ field: 'productScope', message: '请选择商品范围' });
  } else if (promotion.productScope === 'category' && (!promotion.selectedCategories || promotion.selectedCategories.length === 0)) {
    errors.push({ field: 'selectedCategories', message: '请至少选择一个商品分类' });
  } else if (promotion.productScope === 'product' && (!promotion.productConfigs || promotion.productConfigs.length === 0)) {
    errors.push({ field: 'productConfigs', message: '请至少选择一个商品' });
  }

  // 店铺验证
  if (!promotion.storeScope) {
    errors.push({ field: 'storeScope', message: '请选择店铺范围' });
  } else if (promotion.storeScope === 'selected' && (!promotion.storeConfigs || promotion.storeConfigs.filter(s => s.selected).length === 0)) {
    errors.push({ field: 'storeConfigs', message: '请至少选择一个店铺' });
  }

  // 根据活动类型验证
  const typeConfig = promotion.type ? PROMOTION_TYPE_CONFIG[promotion.type] : null;

  if (typeConfig) {
    // 折扣验证
    if (typeConfig.requiresDiscountPercent) {
      if (!promotion.rewards?.discountPercent || promotion.rewards.discountPercent <= 0 || promotion.rewards.discountPercent >= 100) {
        errors.push({ field: 'rewards.discountPercent', message: '请设置有效的折扣（1-99之间）' });
      }
    }

    // 促销价验证
    if (typeConfig.requiresProductPrice && promotion.productScope === 'product') {
      if (promotion.productConfigs) {
        const invalidProducts = promotion.productConfigs.filter(p => !p.promotionPrice || p.promotionPrice >= p.originalPrice);
        if (invalidProducts.length > 0) {
          errors.push({ field: 'productConfigs', message: `以下商品未设置有效的促销价：${invalidProducts.map(p => p.productName).join('、')}` });
        }
      }
    }

    // 买赠配置验证
    if (typeConfig.requiresBuyGet) {
      if (!promotion.conditions?.buyQuantity || promotion.conditions.buyQuantity < 1) {
        errors.push({ field: 'conditions.buyQuantity', message: '请设置购买数量' });
      }
      if (!promotion.rewards?.freeQuantity || promotion.rewards.freeQuantity < 1) {
        errors.push({ field: 'rewards.freeQuantity', message: '请设置赠送数量' });
      }
    }

    // 时段验证
    if (typeConfig.requiresTimeSlots) {
      if (!promotion.timeSlots || promotion.timeSlots.length === 0) {
        warnings.push({ field: 'timeSlots', message: '建议设置活动时段，否则全天有效' });
      }
    }

    // 满减验证
    if (promotion.type === 'discount_amount') {
      if (!promotion.conditions?.minAmount || promotion.conditions.minAmount <= 0) {
        errors.push({ field: 'conditions.minAmount', message: '请设置最低消费金额' });
      }
      if (!promotion.rewards?.discountAmount || promotion.rewards.discountAmount <= 0) {
        errors.push({ field: 'rewards.discountAmount', message: '请设置减免金额' });
      }
      if (promotion.conditions?.minAmount && promotion.rewards?.discountAmount) {
        if (promotion.rewards.discountAmount >= promotion.conditions.minAmount) {
          errors.push({ field: 'rewards.discountAmount', message: '减免金额不能大于等于最低消费金额' });
        }
      }
    }

    // 会员专享验证
    if (promotion.type === 'member_exclusive') {
      if (!promotion.conditions?.memberLevels || promotion.conditions.memberLevels.length === 0) {
        errors.push({ field: 'conditions.memberLevels', message: '请至少选择一个会员等级' });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============== 价格计算函数 ==============

/**
 * 计算促销价格
 */
export function calculatePromotionPrice(
  originalPrice: number,
  promotion: PromotionActivity,
  quantity: number = 1
): {
  finalPrice: number;
  discount: number;
  giftQuantity: number;
  description: string;
} {
  let finalPrice = originalPrice * quantity;
  let discount = 0;
  let giftQuantity = 0;
  let description = '';

  switch (promotion.type) {
    case 'discount_percent':
      discount = originalPrice * quantity * (1 - (promotion.rewards.discountPercent || 100) / 100);
      finalPrice = originalPrice * quantity - discount;
      if (promotion.rewards.maxDiscount && discount > promotion.rewards.maxDiscount) {
        discount = promotion.rewards.maxDiscount;
        finalPrice = originalPrice * quantity - discount;
      }
      description = `${(promotion.rewards.discountPercent || 100) / 10}折优惠`;
      break;

    case 'discount_amount':
      if (originalPrice * quantity >= (promotion.conditions.minAmount || 0)) {
        discount = promotion.rewards.discountAmount || 0;
        finalPrice = originalPrice * quantity - discount;
        description = `满${promotion.conditions.minAmount}减${promotion.rewards.discountAmount}`;
      }
      break;

    case 'buy_x_get_y':
      const buyQuantity = promotion.conditions.buyQuantity || 1;
      const freeQuantity = promotion.rewards.freeQuantity || 1;
      if (quantity >= buyQuantity) {
        const groups = Math.floor(quantity / buyQuantity);
        giftQuantity = groups * freeQuantity;
        description = `买${buyQuantity}送${freeQuantity}`;
      }
      break;

    case 'flash_sale':
    case 'clearance':
      // 使用配置的促销价
      finalPrice = originalPrice * quantity; // 实际价格从商品配置中获取
      discount = originalPrice * quantity - finalPrice;
      description = promotion.type === 'flash_sale' ? '限时秒杀价' : '清货特价';
      break;

    case 'member_exclusive':
      discount = originalPrice * quantity * (1 - (promotion.rewards.discountPercent || 100) / 100);
      finalPrice = originalPrice * quantity - discount;
      description = `会员专享${(promotion.rewards.discountPercent || 100) / 10}折`;
      break;
  }

  return {
    finalPrice: Math.max(0, finalPrice),
    discount: Math.max(0, discount),
    giftQuantity,
    description,
  };
}

// ============== 同步函数 ==============

/**
 * 同步促销活动到店铺
 */
export async function syncPromotionToStores(
  promotion: PromotionActivity
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  
  const targetStores = promotion.storeScope === 'all'
    ? promotion.storeConfigs
    : promotion.storeConfigs.filter(s => s.selected);

  for (const store of targetStores) {
    try {
      // 模拟同步操作
      // 实际应用中，这里会调用店铺API或写入店铺数据库
      await new Promise(resolve => setTimeout(resolve, 100));
      
      results.push({
        success: true,
        storeId: store.storeId,
        storeName: store.storeName,
        message: '同步成功',
        syncedAt: new Date().toISOString(),
      });
    } catch (error) {
      results.push({
        success: false,
        storeId: store.storeId,
        storeName: store.storeName,
        message: error instanceof Error ? error.message : '同步失败',
      });
    }
  }

  return results;
}

// ============== 辅助函数 ==============

/**
 * 生成活动编码
 */
export function generatePromotionCode(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PROMO-${dateStr}-${randomStr}`;
}

/**
 * 获取活动状态文本
 */
export function getStatusText(status: PromotionStatus): string {
  const statusMap: Record<PromotionStatus, string> = {
    draft: '草稿',
    pending: '待发布',
    active: '进行中',
    paused: '已暂停',
    ended: '已结束',
  };
  return statusMap[status] || '未知';
}

/**
 * 获取活动状态样式
 */
export function getStatusStyle(status: PromotionStatus): string {
  const styleMap: Record<PromotionStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-orange-100 text-orange-700',
    ended: 'bg-red-100 text-red-700',
  };
  return styleMap[status] || 'bg-gray-100 text-gray-700';
}

/**
 * 检查活动是否在有效时段内
 */
export function isPromotionActive(promotion: PromotionActivity): boolean {
  const now = new Date();
  const start = new Date(promotion.startTime);
  const end = new Date(promotion.endTime);

  if (now < start || now > end) {
    return false;
  }

  // 检查时段限制
  if (promotion.timeSlots && promotion.timeSlots.length > 0) {
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay();

    const inTimeSlot = promotion.timeSlots.some(slot => {
      const inTime = currentTime >= slot.startTime && currentTime <= slot.endTime;
      const inDay = !slot.days || slot.days.length === 0 || slot.days.includes(currentDay);
      return inTime && inDay;
    });

    if (!inTimeSlot) {
      return false;
    }
  }

  return true;
}

/**
 * 获取商品适用的促销活动
 */
export function getApplicablePromotions(
  productId: string,
  promotions: PromotionActivity[]
): PromotionActivity[] {
  return promotions.filter(promo => {
    if (promo.status !== 'active') return false;
    if (!isPromotionActive(promo)) return false;

    // 检查商品是否在活动范围内
    if (promo.productScope === 'all') return true;
    if (promo.productScope === 'product') {
      return promo.productConfigs.some(p => p.productId === productId);
    }
    // category 范围需要外部传入分类信息判断
    return false;
  }).sort((a, b) => a.priority - b.priority); // 按优先级排序
}
