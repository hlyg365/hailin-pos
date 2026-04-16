// ============================================
// 海邻到家 - 会员服务
// ============================================

import { apiClient, createApiRequest, ApiResponse } from '@hailin/core';

// 会员等级枚举
export enum MemberLevel {
  NORMAL = 'normal',           // 普通会员
  SILVER = 'silver',           // 银卡会员
  GOLD = 'gold',               // 金卡会员
  DIAMOND = 'diamond',        // 钻石会员
}

// 会员状态枚举
export enum MemberStatus {
  ACTIVE = 'active',           // 正常
  FROZEN = 'frozen',           // 冻结
  CANCELLED = 'cancelled',     // 已注销
}

// 会员等级配置
export const MEMBER_LEVEL_CONFIG: Record<MemberLevel, {
  name: string;
  discount: number;            // 折扣率 (0.9 = 9折)
  pointsMultiplier: number;    // 积分倍率
  minAmount: number;           // 升级所需消费金额
}> = {
  [MemberLevel.NORMAL]: {
    name: '普通会员',
    discount: 1.0,
    pointsMultiplier: 1.0,
    minAmount: 0,
  },
  [MemberLevel.SILVER]: {
    name: '银卡会员',
    discount: 0.98,
    pointsMultiplier: 1.2,
    minAmount: 1000,
  },
  [MemberLevel.GOLD]: {
    name: '金卡会员',
    discount: 0.95,
    pointsMultiplier: 1.5,
    minAmount: 5000,
  },
  [MemberLevel.DIAMOND]: {
    name: '钻石会员',
    discount: 0.9,
    pointsMultiplier: 2.0,
    minAmount: 20000,
  },
};

// 会员信息接口
export interface Member {
  id: string;
  memberNo: string;            // 会员编号
  name: string;
  phone: string;
  avatar?: string;
  level: MemberLevel;
  status: MemberStatus;
  
  // 账户信息
  points: number;              // 当前积分
  totalPoints: number;         // 累计积分
  balance: number;              // 储值余额
  
  // 生日信息
  birthday?: string;
  birthdayCoupon: boolean;      // 是否已领生日券
  
  // 标签
  tags?: string[];
  
  // 来源信息
  sourceStoreId?: string;
  sourceStoreName?: string;
  
  // 时间信息
  createdAt: string;
  updatedAt: string;
  lastVisitAt?: string;
}

// 会员注册请求
export interface RegisterMemberRequest {
  name: string;
  phone: string;
  birthday?: string;
  password?: string;
}

// 会员信息更新请求
export interface UpdateMemberRequest {
  name?: string;
  avatar?: string;
  birthday?: string;
  password?: string;
}

// 会员登录响应
export interface MemberLoginResponse {
  member: Member;
  token: string;
}

// 积分记录
export interface PointsRecord {
  id: string;
  memberId: string;
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  points: number;
  balance: number;
  source: string;
  orderId?: string;
  remark?: string;
  createdAt: string;
}

// 会员服务类
export class MemberService {
  
  /** 注册会员 */
  static async register(request: RegisterMemberRequest): Promise<ApiResponse<Member>> {
    return createApiRequest(() => apiClient.post<Member>('/api/members/register', request));
  }
  
  /** 会员登录 */
  static async login(phone: string, password?: string): Promise<ApiResponse<MemberLoginResponse>> {
    return createApiRequest(() => apiClient.post<MemberLoginResponse>('/api/members/login', {
      phone,
      password,
    }));
  }
  
  /** 手机号快捷登录/注册 */
  static async quickLogin(phone: string): Promise<ApiResponse<MemberLoginResponse>> {
    return createApiRequest(() => apiClient.post<MemberLoginResponse>('/api/members/quick-login', {
      phone,
    }));
  }
  
  /** 验证会员码 */
  static async verifyMemberCode(code: string): Promise<ApiResponse<Member>> {
    return createApiRequest(() => apiClient.post<Member>('/api/members/verify-code', { code }));
  }
  
  /** 根据ID获取会员信息 */
  static async getById(memberId: string): Promise<ApiResponse<Member>> {
    return createApiRequest(() => apiClient.get<Member>(`/api/members/${memberId}`));
  }
  
  /** 根据手机号获取会员信息 */
  static async getByPhone(phone: string): Promise<ApiResponse<Member>> {
    return createApiRequest(() => apiClient.get<Member>('/api/members/by-phone', { phone }));
  }
  
  /** 更新会员信息 */
  static async update(memberId: string, request: UpdateMemberRequest): Promise<ApiResponse<Member>> {
    return createApiRequest(() => apiClient.put<Member>(`/api/members/${memberId}`, request));
  }
  
  /** 获取会员列表 */
  static async getList(params: {
    storeId?: string;
    level?: MemberLevel;
    status?: MemberStatus;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<{ members: Member[]; total: number }>> {
    return createApiRequest(() => apiClient.get('/api/members', params));
  }
  
  /** 获取积分记录 */
  static async getPointsHistory(params: {
    memberId: string;
    type?: 'earn' | 'redeem' | 'expire' | 'adjust';
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<{ records: PointsRecord[]; total: number }>> {
    return createApiRequest(() => apiClient.get(`/api/members/${params.memberId}/points`, {
      type: params.type,
      startDate: params.startDate,
      endDate: params.endDate,
      page: params.page,
      pageSize: params.pageSize,
    }));
  }
  
  /** 增加积分 */
  static async addPoints(memberId: string, points: number, source: string, orderId?: string): Promise<ApiResponse<Member>> {
    return createApiRequest(() => apiClient.post<Member>(`/api/members/${memberId}/points/add`, {
      points,
      source,
      orderId,
    }));
  }
  
  /** 扣减积分 */
  static async deductPoints(memberId: string, points: number, source: string): Promise<ApiResponse<Member>> {
    return createApiRequest(() => apiClient.post<Member>(`/api/members/${memberId}/points/deduct`, {
      points,
      source,
    }));
  }
  
  /** 储值 */
  static async recharge(memberId: string, amount: number, paymentMethod: string): Promise<ApiResponse<Member>> {
    return createApiRequest(() => apiClient.post<Member>(`/api/members/${memberId}/recharge`, {
      amount,
      paymentMethod,
    }));
  }
  
  /** 消费 */
  static async consume(memberId: string, amount: number, orderId: string): Promise<ApiResponse<Member>> {
    return createApiRequest(() => apiClient.post<Member>(`/api/members/${memberId}/consume`, {
      amount,
      orderId,
    }));
  }
  
  /** 计算会员折扣 */
  static calculateDiscount(amount: number, level: MemberLevel, isBirthday: boolean = false): number {
    const config = MEMBER_LEVEL_CONFIG[level];
    let discount = config.discount;
    
    // 生日双倍折扣
    if (isBirthday) {
      discount = Math.min(discount, discount - 0.05); // 额外95折
    }
    
    return amount * discount;
  }
  
  /** 计算订单积分 */
  static calculatePoints(
    amount: number,
    level: MemberLevel,
    isBirthday: boolean = false,
    specialPromo: boolean = false
  ): number {
    let multiplier = MEMBER_LEVEL_CONFIG[level].pointsMultiplier;
    
    // 生日双倍积分
    if (isBirthday) {
      multiplier *= 2;
    }
    
    // 特殊活动
    if (specialPromo) {
      multiplier *= 2;
    }
    
    // 每消费1元得1积分
    return Math.floor(amount * multiplier);
  }
  
  /** 计算升级所需金额 */
  static getUpgradeAmount(currentLevel: MemberLevel, totalSpent: number): {
    nextLevel: MemberLevel | null;
    amountNeeded: number;
  } {
    const levels = [MemberLevel.NORMAL, MemberLevel.SILVER, MemberLevel.GOLD, MemberLevel.DIAMOND];
    const currentIndex = levels.indexOf(currentLevel);
    
    if (currentIndex === levels.length - 1) {
      return { nextLevel: null, amountNeeded: 0 };
    }
    
    const nextLevel = levels[currentIndex + 1];
    const nextConfig = MEMBER_LEVEL_CONFIG[nextLevel];
    const amountNeeded = Math.max(0, nextConfig.minAmount - totalSpent);
    
    return { nextLevel, amountNeeded };
  }
  
  /** 会员码验证（本地） */
  static parseMemberCode(code: string): { type: 'phone' | 'memberNo' | 'invalid'; value: string } {
    // 手机号格式
    if (/^1[3-9]\d{9}$/.test(code)) {
      return { type: 'phone', value: code };
    }
    
    // 会员编号格式
    if (/^M\d{10}$/.test(code)) {
      return { type: 'memberNo', value: code };
    }
    
    return { type: 'invalid', value: code };
  }
}

export default MemberService;
