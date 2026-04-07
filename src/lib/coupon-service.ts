// 优惠券服务 - 支持小程序和线下门店核销

// 优惠券类型
export type CouponType = 'discount' | 'full_reduction' | 'cash'; // 折扣券、满减券、代金券

// 优惠券状态
export type CouponStatus = 'active' | 'inactive' | 'expired';

// 使用渠道
export type UseChannel = 'mini_program' | 'offline_store' | 'both';

// 核销状态
export type VerificationStatus = 'unused' | 'used' | 'expired' | 'refunded';

// 优惠券模板
export interface CouponTemplate {
  id: string;
  name: string;
  type: CouponType;
  description: string;
  
  // 优惠规则
  discountRate?: number; // 折扣率 (0.1-1.0)
  fullAmount?: number; // 满X元
  reduceAmount?: number; // 减Y元
  cashAmount?: number; // 代金金额
  
  // 使用条件
  minOrderAmount: number; // 最低订单金额
  maxDiscountAmount?: number; // 最大优惠金额
  applicableCategories?: string[]; // 适用分类
  applicableProducts?: string[]; // 适用商品ID
  
  // 使用渠道
  useChannel: UseChannel;
  
  // 有效期
  validDays: number; // 领取后有效天数
  validStartTime?: string; // 固定开始时间
  validEndTime?: string; // 固定结束时间
  
  // 发放限制
  totalQuantity: number; // 总发放量
  issuedQuantity: number; // 已发放量
  limitPerUser: number; // 每人限领
  pointsRequired: number; // 兑换所需积分
  
  // 状态
  status: CouponStatus;
  createTime: string;
  updateTime: string;
}

// 用户优惠券
export interface UserCoupon {
  id: string;
  templateId: string;
  templateName: string;
  couponCode: string; // 优惠券码（唯一）
  verificationCode: string; // 核销码
  
  // 用户信息
  memberId: string;
  memberName: string;
  memberPhone: string;
  
  // 优惠信息
  type: CouponType;
  discountRate?: number;
  fullAmount?: number;
  reduceAmount?: number;
  cashAmount?: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  
  // 使用渠道
  useChannel: UseChannel;
  
  // 有效期
  validStartTime: string;
  validEndTime: string;
  
  // 状态
  status: VerificationStatus;
  
  // 核销信息
  verificationTime?: string;
  verificationChannel?: 'mini_program' | 'offline_store';
  verificationStoreId?: string;
  verificationStoreName?: string;
  verificationOperatorId?: string;
  verificationOperatorName?: string;
  orderId?: string; // 关联订单号
  
  // 来源
  source: 'points_exchange' | 'promotion' | 'new_member' | 'manual';
  
  createTime: string;
  updateTime: string;
}

// 核销记录
export interface VerificationRecord {
  id: string;
  couponId: string;
  couponCode: string;
  templateName: string;
  
  memberId: string;
  memberName: string;
  memberPhone: string;
  
  verificationCode: string;
  verificationTime: string;
  verificationChannel: 'mini_program' | 'offline_store';
  verificationStoreId?: string;
  verificationStoreName?: string;
  verificationOperatorId?: string;
  verificationOperatorName?: string;
  
  orderId: string;
  orderAmount: number;
  discountAmount: number;
  actualAmount: number;
  
  status: 'success' | 'failed' | 'refunded';
  failReason?: string;
}

// 内存存储（生产环境应使用数据库）
const couponTemplates = new Map<string, CouponTemplate>();
const userCoupons = new Map<string, UserCoupon>();
const verificationRecords = new Map<string, VerificationRecord>();

// 初始化示例数据
const initSampleData = () => {
  // 满减券模板
  const template1: CouponTemplate = {
    id: 'TPL001',
    name: '满50减10优惠券',
    type: 'full_reduction',
    description: '全场通用，满50元减10元',
    fullAmount: 50,
    reduceAmount: 10,
    minOrderAmount: 50,
    useChannel: 'both',
    validDays: 30,
    totalQuantity: 1000,
    issuedQuantity: 356,
    limitPerUser: 10,
    pointsRequired: 200,
    status: 'active',
    createTime: '2024-03-01 10:00:00',
    updateTime: '2024-03-01 10:00:00',
  };
  couponTemplates.set(template1.id, template1);

  // 新人专享券
  const template2: CouponTemplate = {
    id: 'TPL002',
    name: '新人专享满30减15',
    type: 'full_reduction',
    description: '新会员专享，满30元减15元',
    fullAmount: 30,
    reduceAmount: 15,
    minOrderAmount: 30,
    useChannel: 'both',
    validDays: 7,
    totalQuantity: 500,
    issuedQuantity: 128,
    limitPerUser: 1,
    pointsRequired: 0,
    status: 'active',
    createTime: '2024-03-05 14:00:00',
    updateTime: '2024-03-05 14:00:00',
  };
  couponTemplates.set(template2.id, template2);

  // 折扣券
  const template3: CouponTemplate = {
    id: 'TPL003',
    name: '会员专享8折券',
    type: 'discount',
    description: '会员专享，全场商品8折优惠',
    discountRate: 0.8,
    minOrderAmount: 0,
    maxDiscountAmount: 50,
    useChannel: 'both',
    validDays: 30,
    totalQuantity: 2000,
    issuedQuantity: 856,
    limitPerUser: 5,
    pointsRequired: 300,
    status: 'active',
    createTime: '2024-03-10 09:00:00',
    updateTime: '2024-03-10 09:00:00',
  };
  couponTemplates.set(template3.id, template3);

  // 线下门店专属满减券
  const template4: CouponTemplate = {
    id: 'TPL004',
    name: '门店专享满100减20',
    type: 'full_reduction',
    description: '仅限线下门店使用，满100元减20元',
    fullAmount: 100,
    reduceAmount: 20,
    minOrderAmount: 100,
    useChannel: 'offline_store',
    validDays: 15,
    totalQuantity: 500,
    issuedQuantity: 89,
    limitPerUser: 3,
    pointsRequired: 150,
    status: 'active',
    createTime: '2024-03-15 11:00:00',
    updateTime: '2024-03-15 11:00:00',
  };
  couponTemplates.set(template4.id, template4);

  // 小程序专属代金券
  const template5: CouponTemplate = {
    id: 'TPL005',
    name: '小程序专享5元代金券',
    type: 'cash',
    description: '仅限小程序使用，无门槛5元代金券',
    cashAmount: 5,
    minOrderAmount: 0,
    useChannel: 'mini_program',
    validDays: 7,
    totalQuantity: 1000,
    issuedQuantity: 456,
    limitPerUser: 5,
    pointsRequired: 100,
    status: 'active',
    createTime: '2024-03-18 16:00:00',
    updateTime: '2024-03-18 16:00:00',
  };
  couponTemplates.set(template5.id, template5);
};

// 执行初始化
initSampleData();

// 生成优惠券码
export function generateCouponCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CP';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 生成核销码
export function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// 获取所有优惠券模板
export function getCouponTemplates(): CouponTemplate[] {
  return Array.from(couponTemplates.values());
}

// 获取优惠券模板
export function getCouponTemplate(id: string): CouponTemplate | undefined {
  return couponTemplates.get(id);
}

// 创建优惠券模板
export function createCouponTemplate(data: Partial<CouponTemplate>): CouponTemplate {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const template: CouponTemplate = {
    id: `TPL${Date.now()}`,
    name: data.name || '新优惠券',
    type: data.type || 'full_reduction',
    description: data.description || '',
    discountRate: data.discountRate,
    fullAmount: data.fullAmount,
    reduceAmount: data.reduceAmount,
    cashAmount: data.cashAmount,
    minOrderAmount: data.minOrderAmount || 0,
    maxDiscountAmount: data.maxDiscountAmount,
    applicableCategories: data.applicableCategories,
    applicableProducts: data.applicableProducts,
    useChannel: data.useChannel || 'both',
    validDays: data.validDays || 30,
    validStartTime: data.validStartTime,
    validEndTime: data.validEndTime,
    totalQuantity: data.totalQuantity || 100,
    issuedQuantity: 0,
    limitPerUser: data.limitPerUser || 1,
    pointsRequired: data.pointsRequired || 100,
    status: data.status || 'active',
    createTime: now,
    updateTime: now,
  };
  couponTemplates.set(template.id, template);
  return template;
}

// 更新优惠券模板
export function updateCouponTemplate(id: string, data: Partial<CouponTemplate>): CouponTemplate | undefined {
  const template = couponTemplates.get(id);
  if (!template) return undefined;
  
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const updated = {
    ...template,
    ...data,
    id: template.id,
    createTime: template.createTime,
    updateTime: now,
  };
  couponTemplates.set(id, updated);
  return updated;
}

// 发放优惠券给用户
export function issueCouponToUser(
  templateId: string,
  memberId: string,
  memberName: string,
  memberPhone: string,
  source: UserCoupon['source'] = 'points_exchange'
): UserCoupon | { error: string } {
  const template = couponTemplates.get(templateId);
  if (!template) {
    return { error: '优惠券模板不存在' };
  }
  
  if (template.status !== 'active') {
    return { error: '优惠券已下架' };
  }
  
  if (template.issuedQuantity >= template.totalQuantity) {
    return { error: '优惠券已发完' };
  }
  
  // 检查用户领取数量
  const userCouponCount = Array.from(userCoupons.values())
    .filter(c => c.templateId === templateId && c.memberId === memberId).length;
  if (userCouponCount >= template.limitPerUser) {
    return { error: '已达到领取上限' };
  }
  
  const now = new Date();
  const validStartTime = template.validStartTime || now.toISOString().replace('T', ' ').slice(0, 19);
  const validEndTime = template.validEndTime || new Date(now.getTime() + template.validDays * 24 * 60 * 60 * 1000)
    .toISOString().replace('T', ' ').slice(0, 19);
  
  const couponCode = generateCouponCode();
  const verificationCode = generateVerificationCode();
  
  const userCoupon: UserCoupon = {
    id: `UC${Date.now()}`,
    templateId: template.id,
    templateName: template.name,
    couponCode,
    verificationCode,
    memberId,
    memberName,
    memberPhone,
    type: template.type,
    discountRate: template.discountRate,
    fullAmount: template.fullAmount,
    reduceAmount: template.reduceAmount,
    cashAmount: template.cashAmount,
    minOrderAmount: template.minOrderAmount,
    maxDiscountAmount: template.maxDiscountAmount,
    useChannel: template.useChannel,
    validStartTime,
    validEndTime,
    status: 'unused',
    source,
    createTime: now.toISOString().replace('T', ' ').slice(0, 19),
    updateTime: now.toISOString().replace('T', ' ').slice(0, 19),
  };
  
  userCoupons.set(userCoupon.id, userCoupon);
  
  // 更新已发放量
  template.issuedQuantity++;
  
  return userCoupon;
}

// 获取用户优惠券列表
export function getUserCoupons(memberId: string): UserCoupon[] {
  return Array.from(userCoupons.values()).filter(c => c.memberId === memberId);
}

// 根据核销码获取优惠券
export function getCouponByVerificationCode(code: string): UserCoupon | undefined {
  return Array.from(userCoupons.values()).find(c => c.verificationCode === code);
}

// 根据优惠券码获取优惠券
export function getCouponByCouponCode(code: string): UserCoupon | undefined {
  return Array.from(userCoupons.values()).find(c => c.couponCode === code);
}

// 核销优惠券
export function verifyCoupon(
  couponCodeOrVerificationCode: string,
  channel: 'mini_program' | 'offline_store',
  orderId: string,
  orderAmount: number,
  storeId?: string,
  storeName?: string,
  operatorId?: string,
  operatorName?: string
): { success: boolean; discountAmount: number; error?: string } {
  // 尝试通过核销码或优惠券码查找
  let coupon = getCouponByVerificationCode(couponCodeOrVerificationCode);
  if (!coupon) {
    coupon = getCouponByCouponCode(couponCodeOrVerificationCode);
  }
  
  if (!coupon) {
    return { success: false, discountAmount: 0, error: '优惠券不存在' };
  }
  
  if (coupon.status !== 'unused') {
    return { success: false, discountAmount: 0, error: '优惠券已使用或已过期' };
  }
  
  // 检查使用渠道
  if (coupon.useChannel !== 'both' && coupon.useChannel !== channel) {
    const channelName = channel === 'mini_program' ? '小程序' : '线下门店';
    const allowedChannel = coupon.useChannel === 'mini_program' ? '小程序' : '线下门店';
    return { success: false, discountAmount: 0, error: `此优惠券仅限${allowedChannel}使用` };
  }
  
  // 检查有效期
  const now = new Date();
  const validEnd = new Date(coupon.validEndTime);
  if (now > validEnd) {
    coupon.status = 'expired';
    return { success: false, discountAmount: 0, error: '优惠券已过期' };
  }
  
  // 检查订单金额
  if (orderAmount < coupon.minOrderAmount) {
    return { success: false, discountAmount: 0, error: `订单金额需满${coupon.minOrderAmount}元` };
  }
  
  // 计算优惠金额
  let discountAmount = 0;
  
  switch (coupon.type) {
    case 'full_reduction':
      if (orderAmount >= (coupon.fullAmount || 0)) {
        discountAmount = coupon.reduceAmount || 0;
      }
      break;
    case 'discount':
      discountAmount = orderAmount * (1 - (coupon.discountRate || 1));
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
      break;
    case 'cash':
      discountAmount = coupon.cashAmount || 0;
      break;
  }
  
  // 确保优惠金额不超过订单金额
  discountAmount = Math.min(discountAmount, orderAmount);
  
  // 更新优惠券状态
  const nowStr = now.toISOString().replace('T', ' ').slice(0, 19);
  coupon.status = 'used';
  coupon.verificationTime = nowStr;
  coupon.verificationChannel = channel;
  coupon.verificationStoreId = storeId;
  coupon.verificationStoreName = storeName;
  coupon.verificationOperatorId = operatorId;
  coupon.verificationOperatorName = operatorName;
  coupon.orderId = orderId;
  coupon.updateTime = nowStr;
  
  // 创建核销记录
  const record: VerificationRecord = {
    id: `VR${Date.now()}`,
    couponId: coupon.id,
    couponCode: coupon.couponCode,
    templateName: coupon.templateName,
    memberId: coupon.memberId,
    memberName: coupon.memberName,
    memberPhone: coupon.memberPhone,
    verificationCode: coupon.verificationCode,
    verificationTime: nowStr,
    verificationChannel: channel,
    verificationStoreId: storeId,
    verificationStoreName: storeName,
    verificationOperatorId: operatorId,
    verificationOperatorName: operatorName,
    orderId,
    orderAmount,
    discountAmount,
    actualAmount: orderAmount - discountAmount,
    status: 'success',
  };
  verificationRecords.set(record.id, record);
  
  return { success: true, discountAmount };
}

// 获取核销记录
export function getVerificationRecords(
  storeId?: string,
  startDate?: string,
  endDate?: string
): VerificationRecord[] {
  let records = Array.from(verificationRecords.values());
  
  if (storeId) {
    records = records.filter(r => r.verificationStoreId === storeId);
  }
  
  if (startDate) {
    records = records.filter(r => r.verificationTime >= startDate);
  }
  
  if (endDate) {
    records = records.filter(r => r.verificationTime <= endDate);
  }
  
  return records.sort((a, b) => b.verificationTime.localeCompare(a.verificationTime));
}

// 获取所有用户优惠券（管理端用）
export function getAllUserCoupons(): UserCoupon[] {
  return Array.from(userCoupons.values()).sort((a, b) => b.createTime.localeCompare(a.createTime));
}
