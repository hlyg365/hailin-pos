/**
 * 会员服务模块
 * 管理会员等级、积分规则、会员权益
 */

// 会员等级配置
export const MEMBER_LEVELS = {
  normal: {
    id: 'normal',
    name: '普通会员',
    icon: '👤',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    gradient: 'from-gray-400 to-gray-500',
    minPoints: 0,
    discount: 1.00, // 无折扣
    pointRate: 1, // 积分比例：消费1元得1积分
    benefits: [
      '生日当天双倍积分',
      '会员专属商品',
    ],
  },
  silver: {
    id: 'silver',
    name: '银卡会员',
    icon: '⭐',
    color: 'bg-slate-100 text-slate-700 border-slate-400',
    gradient: 'from-slate-400 to-slate-500',
    minPoints: 1000,
    discount: 0.98, // 98折
    pointRate: 1.2, // 积分比例：消费1元得1.2积分
    benefits: [
      '全场98折优惠',
      '生日当天双倍积分',
      '会员专属商品',
      '每月1张优惠券',
    ],
  },
  gold: {
    id: 'gold',
    name: '金卡会员',
    icon: '👑',
    color: 'bg-amber-100 text-amber-700 border-amber-400',
    gradient: 'from-amber-400 to-amber-500',
    minPoints: 5000,
    discount: 0.95, // 95折
    pointRate: 1.5, // 积分比例：消费1元得1.5积分
    benefits: [
      '全场95折优惠',
      '生日当天三倍积分',
      '会员专属商品',
      '每月2张优惠券',
      '优先客服服务',
    ],
  },
  diamond: {
    id: 'diamond',
    name: '钻石会员',
    icon: '💎',
    color: 'bg-purple-100 text-purple-700 border-purple-400',
    gradient: 'from-purple-500 to-pink-500',
    minPoints: 10000,
    discount: 0.90, // 9折
    pointRate: 2.0, // 积分比例：消费1元得2积分
    benefits: [
      '全场9折优惠',
      '生日当天三倍积分',
      '会员专属商品',
      '每月3张优惠券',
      '优先客服服务',
      '专属生日礼',
      '免排队特权',
    ],
  },
} as const;

export type MemberLevelId = keyof typeof MEMBER_LEVELS;

// 积分规则
export const POINT_RULES = {
  // 消费积分：消费金额 * 等级积分比例
  consumption: (amount: number, level: MemberLevelId): number => {
    const rate = MEMBER_LEVELS[level].pointRate;
    return Math.floor(amount * rate);
  },
  
  // 生日双倍/三倍积分
  birthday: (basePoints: number, level: MemberLevelId): number => {
    if (level === 'gold' || level === 'diamond') {
      return basePoints * 3;
    }
    return basePoints * 2;
  },
  
  // 评价积分：评价商品得5积分
  review: 5,
  
  // 邀请好友：好友注册并消费得50积分
  referral: 50,
  
  // 积分过期时间（年）
  expiryYears: 2,
};

// 会员权益计算
export const MEMBER_BENEFITS = {
  // 计算折扣金额
  calculateDiscount: (amount: number, level: MemberLevelId): number => {
    const discount = MEMBER_LEVELS[level].discount;
    return Math.round(amount * (1 - discount) * 100) / 100;
  },
  
  // 计算实付金额
  calculateFinalAmount: (amount: number, level: MemberLevelId): number => {
    const discount = MEMBER_LEVELS[level].discount;
    return Math.round(amount * discount * 100) / 100;
  },
  
  // 判断是否可使用优惠券
  canUseCoupon: (level: MemberLevelId): boolean => {
    return true; // 所有会员都可以使用优惠券
  },
  
  // 获取每月优惠券数量
  getMonthlyCoupons: (level: MemberLevelId): number => {
    switch (level) {
      case 'diamond': return 3;
      case 'gold': return 2;
      case 'silver': return 1;
      default: return 0;
    }
  },
};

// 等级晋升规则
export const LEVEL_UPGRADE = {
  // 根据积分判断会员等级
  getLevelByPoints: (points: number): MemberLevelId => {
    if (points >= MEMBER_LEVELS.diamond.minPoints) return 'diamond';
    if (points >= MEMBER_LEVELS.gold.minPoints) return 'gold';
    if (points >= MEMBER_LEVELS.silver.minPoints) return 'silver';
    return 'normal';
  },
  
  // 计算距离下一等级还需积分
  pointsToNextLevel: (currentPoints: number, currentLevel: MemberLevelId): { points: number; level: MemberLevelId | null } => {
    const levels: MemberLevelId[] = ['normal', 'silver', 'gold', 'diamond'];
    const currentIndex = levels.indexOf(currentLevel);
    
    if (currentIndex === levels.length - 1) {
      return { points: 0, level: null }; // 已是最高等级
    }
    
    const nextLevel = levels[currentIndex + 1];
    const nextLevelPoints = MEMBER_LEVELS[nextLevel].minPoints;
    const needed = nextLevelPoints - currentPoints;
    
    return { points: Math.max(0, needed), level: nextLevel };
  },
  
  // 等级保级规则
  downgradeRule: {
    periodMonths: 12, // 12个月为一个保级周期
    minPoints: {
      diamond: 5000, // 钻石会员需在12个月内累积5000积分
      gold: 2000,
      silver: 500,
    },
  },
};

// 积分兑换规则
export const POINT_EXCHANGE = {
  // 积分兑换优惠券
  coupons: [
    { id: 'coupon_5', name: '5元优惠券', points: 500, value: 5 },
    { id: 'coupon_10', name: '10元优惠券', points: 900, value: 10 },
    { id: 'coupon_20', name: '20元优惠券', points: 1700, value: 20 },
    { id: 'coupon_50', name: '50元优惠券', points: 4000, value: 50 },
  ],
  
  // 积分兑换商品
  products: [
    { id: 'prod_1', name: '矿泉水', points: 100 },
    { id: 'prod_2', name: '纸巾', points: 200 },
    { id: 'prod_3', name: '洗衣液', points: 500 },
    { id: 'prod_4', name: '食用油', points: 1000 },
  ],
  
  // 积分兑换比例（积分:元）
  exchangeRate: 100, // 100积分 = 1元
};

// 优惠券类型
export interface Coupon {
  id: string;
  name: string;
  type: 'discount' | 'cash' | 'product'; // 折扣券、现金券、商品券
  value: number; // 折扣比例或金额
  minAmount?: number; // 最低消费金额
  validFrom: string;
  validTo: string;
  status: 'active' | 'used' | 'expired';
  description?: string;
}

// 会员营销活动
export const MEMBER_PROMOTIONS = {
  // 新会员专享
  newMember: {
    name: '新会员专享礼包',
    benefits: [
      '注册即送100积分',
      '首单满50减10元',
      '首月双倍积分',
    ],
  },
  
  // 会员日
  memberDay: {
    name: '每月8号会员日',
    benefits: [
      '全场商品会员价',
      '积分兑换双倍额度',
      '抽奖活动',
    ],
  },
  
  // 生日特权
  birthday: {
    name: '生日特权',
    benefits: [
      '生日当天双倍/三倍积分',
      '生日专属优惠券',
      '生日礼（钻石会员）',
    ],
  },
};

/**
 * 获取会员等级信息
 */
export function getMemberLevelInfo(levelId: MemberLevelId) {
  return MEMBER_LEVELS[levelId];
}

/**
 * 获取所有会员等级
 */
export function getAllMemberLevels() {
  return Object.values(MEMBER_LEVELS);
}

/**
 * 计算订单积分
 */
export function calculateOrderPoints(
  amount: number,
  level: MemberLevelId,
  isBirthday: boolean = false
): number {
  // 基础积分
  let points = POINT_RULES.consumption(amount, level);
  
  // 生日加成
  if (isBirthday) {
    points = POINT_RULES.birthday(points, level);
  }
  
  return points;
}

/**
 * 计算会员折扣
 */
export function calculateMemberDiscount(
  amount: number,
  level: MemberLevelId
): { discount: number; finalAmount: number } {
  const discount = MEMBER_BENEFITS.calculateDiscount(amount, level);
  const finalAmount = MEMBER_BENEFITS.calculateFinalAmount(amount, level);
  
  return { discount, finalAmount };
}

/**
 * 检查等级是否需要保级
 */
export function checkLevelDowngrade(
  level: MemberLevelId,
  pointsInPeriod: number
): { needsDowngrade: boolean; targetLevel?: MemberLevelId } {
  if (level === 'normal') {
    return { needsDowngrade: false };
  }
  
  const minPoints = LEVEL_UPGRADE.downgradeRule.minPoints[level];
  if (pointsInPeriod < minPoints) {
    // 降一级
    const levels: MemberLevelId[] = ['normal', 'silver', 'gold', 'diamond'];
    const currentIndex = levels.indexOf(level);
    const targetLevel = levels[Math.max(0, currentIndex - 1)];
    
    return { needsDowngrade: true, targetLevel };
  }
  
  return { needsDowngrade: false };
}
