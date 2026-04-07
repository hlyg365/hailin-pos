/**
 * 门店管控服务模块 V2.0
 * 实现直营+加盟混合模式的分级权限管控
 * 包含：权限模板、风险预警、权限联动、整改闭环
 */

// ==================== 类型定义 ====================

// 门店类型
export type StoreType = 'direct' | 'franchise_a' | 'franchise_b' | 'franchise_c';

// 门店类型中文名称映射
export const STORE_TYPE_NAMES: Record<StoreType, string> = {
  direct: '直营门店',
  franchise_a: 'A级加盟门店（全托管）',
  franchise_b: 'B级加盟门店（标准）',
  franchise_c: 'C级加盟门店（轻加盟）',
};

// 门店状态
export type StoreStatus = 
  | 'pending'       // 待开业
  | 'active'        // 营业中
  | 'suspended'     // 暂停营业
  | 'closed';       // 已关闭

// 加盟申请状态
export type FranchiseApplicationStatus =
  | 'submitted'     // 已提交
  | 'reviewing'     // 审核中
  | 'approved'      // 已通过
  | 'rejected'      // 已驳回
  | 'contracted'    // 已签约
  | 'cancelled';    // 已取消

// 权限级别
export type PermissionLevel = 
  | 'full'          // 完全权限
  | 'standard'      // 标准权限
  | 'limited'       // 受限权限
  | 'readonly'      // 只读权限
  | 'none';         // 无权限

// 功能模块（8大管控模块）
export type FeatureModule = 
  | 'organization'  // 组织与人事
  | 'products'      // 商品管理
  | 'supply'        // 供应链与采购
  | 'marketing'     // 营销促销
  | 'members'       // 会员运营
  | 'finance'       // 财务与分账
  | 'compliance'    // 合规与风控
  | 'operations';   // 运营与巡店

// 子模块定义
export type SubModule = 
  // 组织与人事
  | 'staff_recruit'      // 人员招聘
  | 'staff_schedule'     // 排班管理
  | 'staff_salary'       // 薪资设置
  | 'store_info'         // 门店信息
  // 商品管理
  | 'product_view'       // 查看商品
  | 'product_add'        // 新增商品
  | 'product_edit'       // 编辑商品
  | 'product_price'      // 调整价格
  | 'product_shelf'      // 上下架
  | 'product_discount'   // 折扣权限
  // 供应链
  | 'supply_request'     // 要货申请
  | 'supply_purchase'    // 自主采购
  | 'supply_transfer'    // 跨店调拨
  | 'supply_settle'      // 供应商结算
  // 营销
  | 'marketing_hq'       // 总部活动
  | 'marketing_store'    // 门店活动
  | 'marketing_coupon'   // 优惠券
  | 'marketing_discount' // 改价抹零
  // 会员
  | 'member_register'    // 会员注册
  | 'member_benefit'     // 会员权益
  | 'member_data'        // 会员数据
  // 财务
  | 'finance_view'       // 查看财务
  | 'finance_settle'     // 资金结算
  | 'finance_export'     // 导出报表
  // 合规
  | 'compliance_check'   // 合规检查
  | 'compliance_upload'  // 证照上传
  | 'compliance_alert'   // 风险预警
  // 运营
  | 'ops_standard'       // 运营标准
  | 'ops_inspection'     // 巡店整改
  | 'ops_activity';      // 邻里活动

// 权限操作
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';

// 风险等级
export type RiskLevel = 'critical' | 'major' | 'minor';

// 风险类型
export type RiskType = 
  | 'expired_product'      // 过期商品
  | 'tobacco_violation'    // 烟草违规
  | 'license_expired'      // 证照过期
  | 'price_violation'      // 价格违规
  | 'brand_damage'         // 品牌损害
  | 'health_cert_expired'  // 健康证过期
  | 'overdue_product'      // 临期商品超标
  | 'high_loss_rate'       // 损耗率超标
  | 'inspection_failed'    // 巡店不合格
  | 'stockout'             // 畅销品断货
  | 'member_decline'       // 会员活跃度下降
  | 'revenue_decline';     // 营收异常下滑

// 权限配置
export interface PermissionConfig {
  module: FeatureModule;
  subModule: SubModule;
  actions: PermissionAction[];
  level: PermissionLevel;
  
  // 数据权限
  dataScope: {
    type: 'all' | 'store' | 'region' | 'own';
    storeIds?: string[];
    regionIds?: string[];
  };
  
  // 限制条件
  restrictions?: {
    maxAmount?: number;        // 最大金额限制
    requireApproval?: boolean; // 需要审批
    approvalLevels?: number;   // 审批层级
    approvalTimeout?: number;  // 审批时效（小时）
    priceRange?: { min: number; max: number }; // 价格浮动范围
    maxDiscount?: number;      // 最大折扣
    maxLocalSkuRatio?: number; // 本地SKU最大占比
  };
}

// 风险预警规则
export interface RiskRule {
  id: string;
  name: string;
  type: RiskType;
  level: RiskLevel;
  
  // 触发条件
  conditions: {
    threshold?: number;      // 阈值
    timeWindow?: number;     // 时间窗口（小时）
    count?: number;          // 次数
  };
  
  // 处理要求
  requirements: {
    responseTime: number;    // 响应时间（小时）
    resolveTime: number;     // 整改时间（小时）
    notifyTargets: string[]; // 通知对象
  };
  
  // 处罚措施
  penalties?: {
    freezePermissions?: SubModule[];  // 冻结权限
    deductPoints?: number;            // 扣除积分
    deductDeposit?: number;           // 扣除保证金
    suspendStore?: boolean;           // 暂停门店
  };
  
  enabled: boolean;
}

// 风险预警记录
export interface RiskAlert {
  id: string;
  alertNo: string;
  storeId: string;
  storeName: string;
  storeType: StoreType;
  
  // 风险信息
  ruleId: string;
  ruleName: string;
  type: RiskType;
  level: RiskLevel;
  
  // 触发详情
  triggerData: {
    description: string;
    value: number;
    threshold: number;
    occurredAt: string;
  };
  
  // 处理状态
  status: 'pending' | 'processing' | 'resolved' | 'escalated';
  
  // 整改信息
  rectification?: {
    assignee: string;
    assigneeName: string;
    assignedAt: string;
    deadline: string;
    submittedAt?: string;
    submittedBy?: string;
    evidence?: string[];
    reviewResult?: 'approved' | 'rejected';
    reviewedBy?: string;
    reviewedAt?: string;
    reviewComment?: string;
  };
  
  // 处罚执行
  penaltyExecuted?: {
    frozenPermissions?: SubModule[];
    deductedPoints?: number;
    deductedDeposit?: number;
    suspendedAt?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

// 门店档案
export interface StoreProfile {
  id: string;
  code: string;
  name: string;
  type: StoreType;
  status: StoreStatus;
  
  // 基本信息
  address: string;
  province: string;
  city: string;
  district: string;
  area: number;           // 面积（平方米）
  phone: string;
  
  // 负责人信息
  managerId?: string;
  managerName: string;
  managerPhone: string;
  
  // 营业信息
  businessHours: {
    open: string;
    close: string;
  };
  openDate?: string;
  closeDate?: string;
  
  // 区域归属
  regionId?: string;
  regionName?: string;
  
  // 合同信息（加盟店）
  contract?: {
    id: string;
    no: string;
    startDate: string;
    endDate: string;
    franchiseFee: number;
    deposit: number;
    brandFee: number;
  };
  
  // 证照信息
  licenses: {
    type: string;
    name: string;
    number: string;
    issueDate: string;
    expiryDate: string;
    status: 'valid' | 'expiring' | 'expired';
  }[];
  
  // 当前权限状态
  currentPermissions: {
    templateId: string;
    appliedAt: string;
    customPermissions?: PermissionConfig[];
    frozenPermissions?: SubModule[];
  };
  
  // 风控积分
  riskScore: number;
  riskHistory: {
    date: string;
    score: number;
    reason: string;
  }[];
  
  // 统计数据
  stats: {
    totalStaff: number;
    totalMembers: number;
    totalProducts: number;
    monthlySales: number;
    monthlyOrders: number;
    localSkuRatio: number; // 本地SKU占比
  };
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

// 门店管控模板
export interface StoreControlTemplate {
  id: string;
  name: string;
  storeType: StoreType;
  description: string;
  
  // 权限配置（按8大模块）
  permissions: PermissionConfig[];
  
  // 管控规则
  controlRules: {
    // 商品管控
    productControl: {
      mustCarryCoreProducts: boolean;   // 必须上架核心商品
      coreProductRatio: number;         // 核心商品占比要求
      canAddLocalProduct: boolean;      // 可新增本地商品
      localProductRequireApproval: boolean; // 本地商品需审批
      maxLocalSkuRatio: number;         // 本地SKU最大占比
      canEditPrice: boolean;            // 可调价
      priceRange?: { min: number; max: number }; // 价格浮动范围
      canShelf: boolean;                // 可上下架
    };
    
    // 供应链管控
    supplyControl: {
      canRequest: boolean;              // 可提报要货
      canDirectPurchase: boolean;       // 可自主采购
      coreProductMustHQ: boolean;       // 核心商品必须总部采购
      approvedSuppliersOnly: boolean;   // 仅限认证供应商
      canTransfer: boolean;             // 可跨店调拨
      transferRequireApproval: boolean; // 调拨需审批
      canSettle: boolean;               // 可供应商结算
    };
    
    // 营销管控
    marketingControl: {
      mustExecuteHQPromo: boolean;      // 必须执行总部活动
      canCreateStorePromo: boolean;     // 可创建门店活动
      storePromoRequireApproval: boolean; // 门店活动需审批
      approvalTimeout: number;          // 审批时效（小时）
      canIssueCoupon: boolean;          // 可发放优惠券
      canDiscount: boolean;             // 可改价抹零
      maxDiscount: number;              // 最大抹零金额
    };
    
    // 会员管控
    memberControl: {
      mustFollowHQRules: boolean;       // 必须执行总部规则
      canSetLocalBenefit: boolean;      // 可设置本地权益
      localBenefitRequireApproval: boolean; // 本地权益需审批
      canViewAllData: boolean;          // 可查看全量数据
    };
    
    // 财务管控
    financeControl: {
      revenueToHQ: boolean;             // 营收归集总部
      autoSettle: boolean;              // 自动分账
      canViewFinance: boolean;          // 可查看财务
      canExport: boolean;               // 可导出报表
      canSettleSupplier: boolean;       // 可供应商结算
    };
    
    // 合规管控
    complianceControl: {
      enforceRules: boolean;            // 强制合规规则
      requireHealthCert: boolean;       // 需健康证
      requireLicenseCheck: boolean;     // 需证照检查
      autoBlockViolation: boolean;      // 自动拦截违规
    };
    
    // 运营管控
    operationsControl: {
      mustFollowStandards: boolean;     // 必须执行标准
      canAdjustProcess: boolean;        // 可调整流程
      inspectionFrequency: 'weekly' | 'monthly' | 'quarterly';
      rectificationRequired: boolean;   // 整改必须执行
    };
  };
  
  // 分账规则
  settlementRules?: {
    brandFeeRate: number;           // 品牌费比例
    managementFeeRate: number;      // 管理费比例
    supplyPaymentFirst: boolean;    // 优先扣除货款
    dailySettle: boolean;           // 日清日结
  };
  
  // 是否默认模板
  isDefault: boolean;
  
  createdAt: string;
  updatedAt: string;
}

// 加盟申请
export interface FranchiseApplication {
  id: string;
  applicationNo: string;
  
  // 申请人信息
  applicantName: string;
  applicantPhone: string;
  applicantEmail?: string;
  applicantIdCard: string;
  
  // 申请门店类型
  intendedStoreType: StoreType;
  
  // 意向门店信息
  intendedStoreName: string;
  intendedAddress: string;
  intendedArea: number;
  propertyOwnership: 'owned' | 'leased';
  leaseExpiry?: string;
  
  // 经营计划
  businessPlan?: string;
  expectedOpenDate?: string;
  
  // 资质文件
  documents: {
    type: string;
    name: string;
    url: string;
    uploadedAt: string;
  }[];
  
  // 审核流程
  status: FranchiseApplicationStatus;
  reviews: {
    reviewerId: string;
    reviewerName: string;
    reviewedAt: string;
    result: 'approved' | 'rejected';
    comment: string;
  }[];
  
  // 合同信息
  contractId?: string;
  contractNo?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  
  // 费用信息
  franchiseFee?: number;
  deposit?: number;
  brandFee?: number;
  
  createdAt: string;
  updatedAt: string;
}

// 临时权限申请
export interface TemporaryPermissionRequest {
  id: string;
  requestNo: string;
  storeId: string;
  storeName: string;
  storeType: StoreType;
  
  // 申请人信息
  applicantId: string;
  applicantName: string;
  
  // 申请权限
  requestedPermissions: PermissionConfig[];
  
  // 申请原因
  reason: string;
  reasonType: 'group_purchase' | 'emergency' | 'special_event' | 'other';
  
  // 有效期
  validFrom: string;
  validTo: string;
  
  // 审批状态
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
  
  // 审批信息
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectReason?: string;
  
  // 操作记录
  operationLogs: {
    action: string;
    operatorId: string;
    operatorName: string;
    operatedAt: string;
    details?: string;
  }[];
  
  createdAt: string;
  updatedAt: string;
}

// 数据权限配置
export interface DataPermissionConfig {
  roleId: string;
  roleName: string;
  roleType: 'hq_admin' | 'hq_dept' | 'region_manager' | 'store_manager' | 'franchisee';
  
  // 数据范围
  dataScope: {
    stores: 'all' | 'region' | 'own';
    modules: FeatureModule[];
    sensitiveFields: string[]; // 敏感字段
    exportAllowed: boolean;
    exportRequireApproval: boolean;
  };
  
  // 禁止查看
  restrictions: {
    otherStoreData: boolean;
    hqFinanceData: boolean;
    franchiseeSensitiveData: boolean;
    corePurchaseCost: boolean;
  };
}

// ==================== 默认管控模板 ====================

const DEFAULT_TEMPLATES: StoreControlTemplate[] = [
  // 直营门店：全环节强管控
  {
    id: 'template_direct',
    name: '直营门店标准模板',
    storeType: 'direct',
    description: '直营门店全环节强管控，无自主操作权限，总部统一管理',
    permissions: [
      // 组织与人事 - 仅查看
      { module: 'organization', subModule: 'staff_recruit', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'organization', subModule: 'staff_schedule', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'organization', subModule: 'staff_salary', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'organization', subModule: 'store_info', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      // 商品管理 - 仅查看和售卖
      { module: 'products', subModule: 'product_view', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'products', subModule: 'product_add', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'products', subModule: 'product_edit', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'products', subModule: 'product_price', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'products', subModule: 'product_shelf', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'products', subModule: 'product_discount', actions: [], level: 'none', dataScope: { type: 'store' } },
      // 供应链 - 仅可提报要货
      { module: 'supply', subModule: 'supply_request', actions: ['view', 'create'], level: 'limited', dataScope: { type: 'store' } },
      { module: 'supply', subModule: 'supply_purchase', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'supply', subModule: 'supply_transfer', actions: ['view', 'create'], level: 'limited', dataScope: { type: 'store' }, restrictions: { requireApproval: true } },
      { module: 'supply', subModule: 'supply_settle', actions: [], level: 'none', dataScope: { type: 'store' } },
      // 营销 - 仅执行总部活动
      { module: 'marketing', subModule: 'marketing_hq', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'marketing', subModule: 'marketing_store', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'marketing', subModule: 'marketing_coupon', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'marketing', subModule: 'marketing_discount', actions: [], level: 'none', dataScope: { type: 'store' } },
      // 会员 - 仅注册和查看
      { module: 'members', subModule: 'member_register', actions: ['view', 'create'], level: 'standard', dataScope: { type: 'store' } },
      { module: 'members', subModule: 'member_benefit', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'members', subModule: 'member_data', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      // 财务 - 仅查看本店
      { module: 'finance', subModule: 'finance_view', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'finance', subModule: 'finance_settle', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'finance', subModule: 'finance_export', actions: [], level: 'none', dataScope: { type: 'store' } },
      // 合规 - 执行总部规则
      { module: 'compliance', subModule: 'compliance_check', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'compliance', subModule: 'compliance_upload', actions: ['create', 'edit'], level: 'standard', dataScope: { type: 'store' } },
      { module: 'compliance', subModule: 'compliance_alert', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      // 运营 - 执行总部标准
      { module: 'operations', subModule: 'ops_standard', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'operations', subModule: 'ops_inspection', actions: ['view', 'edit'], level: 'limited', dataScope: { type: 'store' } },
      { module: 'operations', subModule: 'ops_activity', actions: [], level: 'none', dataScope: { type: 'store' } },
    ],
    controlRules: {
      productControl: {
        mustCarryCoreProducts: true,
        coreProductRatio: 1.0,
        canAddLocalProduct: false,
        localProductRequireApproval: true,
        maxLocalSkuRatio: 0,
        canEditPrice: false,
        canShelf: false,
      },
      supplyControl: {
        canRequest: true,
        canDirectPurchase: false,
        coreProductMustHQ: true,
        approvedSuppliersOnly: true,
        canTransfer: true,
        transferRequireApproval: true,
        canSettle: false,
      },
      marketingControl: {
        mustExecuteHQPromo: true,
        canCreateStorePromo: false,
        storePromoRequireApproval: true,
        approvalTimeout: 0,
        canIssueCoupon: false,
        canDiscount: false,
        maxDiscount: 0,
      },
      memberControl: {
        mustFollowHQRules: true,
        canSetLocalBenefit: false,
        localBenefitRequireApproval: true,
        canViewAllData: false,
      },
      financeControl: {
        revenueToHQ: true,
        autoSettle: false,
        canViewFinance: true,
        canExport: false,
        canSettleSupplier: false,
      },
      complianceControl: {
        enforceRules: true,
        requireHealthCert: true,
        requireLicenseCheck: true,
        autoBlockViolation: true,
      },
      operationsControl: {
        mustFollowStandards: true,
        canAdjustProcess: false,
        inspectionFrequency: 'weekly',
        rectificationRequired: true,
      },
    },
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // A级加盟：全托管
  {
    id: 'template_franchise_a',
    name: 'A级加盟门店模板（全托管）',
    storeType: 'franchise_a',
    description: 'A级加盟门店，总部全托管运营，加盟商仅查看收益',
    permissions: [
      // 组织与人事 - 无权限
      { module: 'organization', subModule: 'staff_recruit', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'organization', subModule: 'staff_schedule', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'organization', subModule: 'staff_salary', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'organization', subModule: 'store_info', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      // 商品管理 - 仅查看
      { module: 'products', subModule: 'product_view', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'products', subModule: 'product_add', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'products', subModule: 'product_edit', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'products', subModule: 'product_price', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'products', subModule: 'product_shelf', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'products', subModule: 'product_discount', actions: [], level: 'none', dataScope: { type: 'store' } },
      // 供应链 - 无权限
      { module: 'supply', subModule: 'supply_request', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'supply', subModule: 'supply_purchase', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'supply', subModule: 'supply_transfer', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'supply', subModule: 'supply_settle', actions: [], level: 'none', dataScope: { type: 'store' } },
      // 营销 - 仅查看
      { module: 'marketing', subModule: 'marketing_hq', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'marketing', subModule: 'marketing_store', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'marketing', subModule: 'marketing_coupon', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'marketing', subModule: 'marketing_discount', actions: [], level: 'none', dataScope: { type: 'store' } },
      // 会员 - 仅注册
      { module: 'members', subModule: 'member_register', actions: ['view', 'create'], level: 'standard', dataScope: { type: 'store' } },
      { module: 'members', subModule: 'member_benefit', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'members', subModule: 'member_data', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      // 财务 - 仅查看收益
      { module: 'finance', subModule: 'finance_view', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'finance', subModule: 'finance_settle', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'finance', subModule: 'finance_export', actions: [], level: 'none', dataScope: { type: 'store' } },
      // 合规 - 执行总部规则
      { module: 'compliance', subModule: 'compliance_check', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'compliance', subModule: 'compliance_upload', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'compliance', subModule: 'compliance_alert', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      // 运营 - 仅查看
      { module: 'operations', subModule: 'ops_standard', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'operations', subModule: 'ops_inspection', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'operations', subModule: 'ops_activity', actions: [], level: 'none', dataScope: { type: 'store' } },
    ],
    controlRules: {
      productControl: {
        mustCarryCoreProducts: true,
        coreProductRatio: 1.0,
        canAddLocalProduct: false,
        localProductRequireApproval: true,
        maxLocalSkuRatio: 0,
        canEditPrice: false,
        canShelf: false,
      },
      supplyControl: {
        canRequest: false,
        canDirectPurchase: false,
        coreProductMustHQ: true,
        approvedSuppliersOnly: true,
        canTransfer: false,
        transferRequireApproval: true,
        canSettle: false,
      },
      marketingControl: {
        mustExecuteHQPromo: true,
        canCreateStorePromo: false,
        storePromoRequireApproval: true,
        approvalTimeout: 0,
        canIssueCoupon: false,
        canDiscount: false,
        maxDiscount: 0,
      },
      memberControl: {
        mustFollowHQRules: true,
        canSetLocalBenefit: false,
        localBenefitRequireApproval: true,
        canViewAllData: false,
      },
      financeControl: {
        revenueToHQ: true,
        autoSettle: true,
        canViewFinance: true,
        canExport: false,
        canSettleSupplier: false,
      },
      complianceControl: {
        enforceRules: true,
        requireHealthCert: true,
        requireLicenseCheck: true,
        autoBlockViolation: true,
      },
      operationsControl: {
        mustFollowStandards: true,
        canAdjustProcess: false,
        inspectionFrequency: 'weekly',
        rectificationRequired: true,
      },
    },
    settlementRules: {
      brandFeeRate: 0.02,
      managementFeeRate: 0.05,
      supplyPaymentFirst: true,
      dailySettle: true,
    },
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // B级加盟：标准管控
  {
    id: 'template_franchise_b',
    name: 'B级加盟门店模板（标准）',
    storeType: 'franchise_b',
    description: 'B级加盟门店，核心环节统一管控，非核心环节审批制授权',
    permissions: [
      // 组织与人事 - 需备案
      { module: 'organization', subModule: 'staff_recruit', actions: ['view', 'create'], level: 'standard', dataScope: { type: 'store' }, restrictions: { requireApproval: false } },
      { module: 'organization', subModule: 'staff_schedule', actions: ['view', 'create', 'edit'], level: 'standard', dataScope: { type: 'store' } },
      { module: 'organization', subModule: 'staff_salary', actions: ['view', 'create', 'edit'], level: 'standard', dataScope: { type: 'store' } },
      { module: 'organization', subModule: 'store_info', actions: ['view', 'edit'], level: 'limited', dataScope: { type: 'store' }, restrictions: { requireApproval: true } },
      // 商品管理 - 可申请本地商品
      { module: 'products', subModule: 'product_view', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'products', subModule: 'product_add', actions: ['create'], level: 'limited', dataScope: { type: 'store' }, restrictions: { requireApproval: true, maxLocalSkuRatio: 0.3 } },
      { module: 'products', subModule: 'product_edit', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'products', subModule: 'product_price', actions: ['edit'], level: 'limited', dataScope: { type: 'store' }, restrictions: { requireApproval: true, priceRange: { min: 0.95, max: 1.05 } } },
      { module: 'products', subModule: 'product_shelf', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'products', subModule: 'product_discount', actions: ['create'], level: 'limited', dataScope: { type: 'store' }, restrictions: { requireApproval: true } },
      // 供应链 - 核心商品必须总部采购
      { module: 'supply', subModule: 'supply_request', actions: ['view', 'create', 'edit'], level: 'standard', dataScope: { type: 'store' } },
      { module: 'supply', subModule: 'supply_purchase', actions: ['view', 'create'], level: 'limited', dataScope: { type: 'store' }, restrictions: { requireApproval: true } },
      { module: 'supply', subModule: 'supply_transfer', actions: ['view', 'create'], level: 'standard', dataScope: { type: 'region' }, restrictions: { requireApproval: true } },
      { module: 'supply', subModule: 'supply_settle', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      // 营销 - 可申请门店活动
      { module: 'marketing', subModule: 'marketing_hq', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'marketing', subModule: 'marketing_store', actions: ['view', 'create'], level: 'limited', dataScope: { type: 'store' }, restrictions: { requireApproval: true, approvalTimeout: 2 } },
      { module: 'marketing', subModule: 'marketing_coupon', actions: ['view', 'create'], level: 'limited', dataScope: { type: 'store' }, restrictions: { requireApproval: true } },
      { module: 'marketing', subModule: 'marketing_discount', actions: ['create'], level: 'limited', dataScope: { type: 'store' }, restrictions: { maxDiscount: 1 } },
      // 会员 - 可设置本地权益
      { module: 'members', subModule: 'member_register', actions: ['view', 'create', 'edit'], level: 'standard', dataScope: { type: 'store' } },
      { module: 'members', subModule: 'member_benefit', actions: ['view', 'create'], level: 'limited', dataScope: { type: 'store' }, restrictions: { requireApproval: false } },
      { module: 'members', subModule: 'member_data', actions: ['view'], level: 'standard', dataScope: { type: 'store' } },
      // 财务 - 可查看全量数据
      { module: 'finance', subModule: 'finance_view', actions: ['view'], level: 'standard', dataScope: { type: 'store' } },
      { module: 'finance', subModule: 'finance_settle', actions: [], level: 'none', dataScope: { type: 'store' } },
      { module: 'finance', subModule: 'finance_export', actions: [], level: 'none', dataScope: { type: 'store' } },
      // 合规 - 需上传证照
      { module: 'compliance', subModule: 'compliance_check', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'compliance', subModule: 'compliance_upload', actions: ['view', 'create', 'edit'], level: 'standard', dataScope: { type: 'store' } },
      { module: 'compliance', subModule: 'compliance_alert', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      // 运营 - 可调整部分流程
      { module: 'operations', subModule: 'ops_standard', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'operations', subModule: 'ops_inspection', actions: ['view', 'edit'], level: 'standard', dataScope: { type: 'store' } },
      { module: 'operations', subModule: 'ops_activity', actions: ['view', 'create'], level: 'limited', dataScope: { type: 'store' }, restrictions: { requireApproval: false } },
    ],
    controlRules: {
      productControl: {
        mustCarryCoreProducts: true,
        coreProductRatio: 1.0,
        canAddLocalProduct: true,
        localProductRequireApproval: true,
        maxLocalSkuRatio: 0.3,
        canEditPrice: true,
        priceRange: { min: 0.95, max: 1.05 },
        canShelf: false,
      },
      supplyControl: {
        canRequest: true,
        canDirectPurchase: true,
        coreProductMustHQ: true,
        approvedSuppliersOnly: true,
        canTransfer: true,
        transferRequireApproval: true,
        canSettle: true,
      },
      marketingControl: {
        mustExecuteHQPromo: true,
        canCreateStorePromo: true,
        storePromoRequireApproval: true,
        approvalTimeout: 2,
        canIssueCoupon: true,
        canDiscount: true,
        maxDiscount: 1,
      },
      memberControl: {
        mustFollowHQRules: true,
        canSetLocalBenefit: true,
        localBenefitRequireApproval: false,
        canViewAllData: false,
      },
      financeControl: {
        revenueToHQ: false,
        autoSettle: true,
        canViewFinance: true,
        canExport: false,
        canSettleSupplier: true,
      },
      complianceControl: {
        enforceRules: true,
        requireHealthCert: true,
        requireLicenseCheck: true,
        autoBlockViolation: true,
      },
      operationsControl: {
        mustFollowStandards: true,
        canAdjustProcess: true,
        inspectionFrequency: 'monthly',
        rectificationRequired: true,
      },
    },
    settlementRules: {
      brandFeeRate: 0.02,
      managementFeeRate: 0.03,
      supplyPaymentFirst: true,
      dailySettle: true,
    },
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // C级加盟：轻加盟
  {
    id: 'template_franchise_c',
    name: 'C级加盟门店模板（轻加盟）',
    storeType: 'franchise_c',
    description: 'C级加盟门店，核心合规与品牌底线管控，最大化经营灵活度',
    permissions: [
      // 组织与人事 - 完全自主
      { module: 'organization', subModule: 'staff_recruit', actions: ['view', 'create', 'edit', 'delete'], level: 'full', dataScope: { type: 'store' } },
      { module: 'organization', subModule: 'staff_schedule', actions: ['view', 'create', 'edit', 'delete'], level: 'full', dataScope: { type: 'store' } },
      { module: 'organization', subModule: 'staff_salary', actions: ['view', 'create', 'edit', 'delete'], level: 'full', dataScope: { type: 'store' } },
      { module: 'organization', subModule: 'store_info', actions: ['view', 'edit'], level: 'standard', dataScope: { type: 'store' } },
      // 商品管理 - 可自主新增，有价格底线
      { module: 'products', subModule: 'product_view', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'products', subModule: 'product_add', actions: ['view', 'create'], level: 'standard', dataScope: { type: 'store' }, restrictions: { maxLocalSkuRatio: 0.7 } },
      { module: 'products', subModule: 'product_edit', actions: ['view', 'edit'], level: 'standard', dataScope: { type: 'store' } },
      { module: 'products', subModule: 'product_price', actions: ['view', 'edit'], level: 'standard', dataScope: { type: 'store' }, restrictions: { priceRange: { min: 0.9, max: 1.1 } } },
      { module: 'products', subModule: 'product_shelf', actions: ['view', 'edit'], level: 'standard', dataScope: { type: 'store' } },
      { module: 'products', subModule: 'product_discount', actions: ['view', 'create', 'edit'], level: 'standard', dataScope: { type: 'store' } },
      // 供应链 - 可自主采购
      { module: 'supply', subModule: 'supply_request', actions: ['view', 'create', 'edit'], level: 'standard', dataScope: { type: 'store' } },
      { module: 'supply', subModule: 'supply_purchase', actions: ['view', 'create', 'edit'], level: 'full', dataScope: { type: 'store' } },
      { module: 'supply', subModule: 'supply_transfer', actions: ['view', 'create', 'edit'], level: 'standard', dataScope: { type: 'region' } },
      { module: 'supply', subModule: 'supply_settle', actions: ['view', 'create', 'edit'], level: 'full', dataScope: { type: 'store' } },
      // 营销 - 完全自主
      { module: 'marketing', subModule: 'marketing_hq', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'marketing', subModule: 'marketing_store', actions: ['view', 'create', 'edit'], level: 'full', dataScope: { type: 'store' } },
      { module: 'marketing', subModule: 'marketing_coupon', actions: ['view', 'create', 'edit'], level: 'full', dataScope: { type: 'store' } },
      { module: 'marketing', subModule: 'marketing_discount', actions: ['view', 'create', 'edit'], level: 'standard', dataScope: { type: 'store' } },
      // 会员 - 可自主设置权益
      { module: 'members', subModule: 'member_register', actions: ['view', 'create', 'edit'], level: 'full', dataScope: { type: 'store' } },
      { module: 'members', subModule: 'member_benefit', actions: ['view', 'create', 'edit'], level: 'full', dataScope: { type: 'store' } },
      { module: 'members', subModule: 'member_data', actions: ['view'], level: 'standard', dataScope: { type: 'store' } },
      // 财务 - 可自主管理
      { module: 'finance', subModule: 'finance_view', actions: ['view'], level: 'standard', dataScope: { type: 'store' } },
      { module: 'finance', subModule: 'finance_settle', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'finance', subModule: 'finance_export', actions: ['view', 'export'], level: 'standard', dataScope: { type: 'store' } },
      // 合规 - 需遵守底线
      { module: 'compliance', subModule: 'compliance_check', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'compliance', subModule: 'compliance_upload', actions: ['view', 'create', 'edit'], level: 'standard', dataScope: { type: 'store' } },
      { module: 'compliance', subModule: 'compliance_alert', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      // 运营 - 完全自主
      { module: 'operations', subModule: 'ops_standard', actions: ['view'], level: 'readonly', dataScope: { type: 'store' } },
      { module: 'operations', subModule: 'ops_inspection', actions: ['view', 'edit'], level: 'limited', dataScope: { type: 'store' } },
      { module: 'operations', subModule: 'ops_activity', actions: ['view', 'create', 'edit'], level: 'full', dataScope: { type: 'store' } },
    ],
    controlRules: {
      productControl: {
        mustCarryCoreProducts: true,
        coreProductRatio: 0.3,
        canAddLocalProduct: true,
        localProductRequireApproval: false,
        maxLocalSkuRatio: 0.7,
        canEditPrice: true,
        priceRange: { min: 0.9, max: 1.1 },
        canShelf: true,
      },
      supplyControl: {
        canRequest: true,
        canDirectPurchase: true,
        coreProductMustHQ: false,
        approvedSuppliersOnly: false,
        canTransfer: true,
        transferRequireApproval: false,
        canSettle: true,
      },
      marketingControl: {
        mustExecuteHQPromo: false,
        canCreateStorePromo: true,
        storePromoRequireApproval: false,
        approvalTimeout: 0,
        canIssueCoupon: true,
        canDiscount: true,
        maxDiscount: 999,
      },
      memberControl: {
        mustFollowHQRules: true,
        canSetLocalBenefit: true,
        localBenefitRequireApproval: false,
        canViewAllData: false,
      },
      financeControl: {
        revenueToHQ: false,
        autoSettle: true,
        canViewFinance: true,
        canExport: true,
        canSettleSupplier: true,
      },
      complianceControl: {
        enforceRules: true,
        requireHealthCert: true,
        requireLicenseCheck: true,
        autoBlockViolation: true,
      },
      operationsControl: {
        mustFollowStandards: false,
        canAdjustProcess: true,
        inspectionFrequency: 'quarterly',
        rectificationRequired: false,
      },
    },
    settlementRules: {
      brandFeeRate: 0.01,
      managementFeeRate: 0,
      supplyPaymentFirst: false,
      dailySettle: true,
    },
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// 默认风险规则
const DEFAULT_RISK_RULES: RiskRule[] = [
  // 一级风险（重大违规）
  {
    id: 'risk_expired_product',
    name: '售卖过期商品',
    type: 'expired_product',
    level: 'critical',
    conditions: { count: 1 },
    requirements: {
      responseTime: 2,
      resolveTime: 24,
      notifyTargets: ['hq_risk', 'region_manager', 'store_manager'],
    },
    penalties: {
      freezePermissions: ['product_view', 'product_shelf'],
      deductPoints: 50,
      suspendStore: true,
    },
    enabled: true,
  },
  {
    id: 'risk_tobacco_violation',
    name: '烟草违规售卖',
    type: 'tobacco_violation',
    level: 'critical',
    conditions: { count: 1 },
    requirements: {
      responseTime: 1,
      resolveTime: 24,
      notifyTargets: ['hq_risk', 'region_manager', 'store_manager'],
    },
    penalties: {
      freezePermissions: ['product_view'],
      deductPoints: 100,
      suspendStore: true,
    },
    enabled: true,
  },
  {
    id: 'risk_brand_damage',
    name: '损害品牌形象',
    type: 'brand_damage',
    level: 'critical',
    conditions: { count: 1 },
    requirements: {
      responseTime: 2,
      resolveTime: 24,
      notifyTargets: ['hq_risk', 'region_manager', 'store_manager'],
    },
    penalties: {
      freezePermissions: ['marketing_store', 'marketing_coupon'],
      deductPoints: 80,
      suspendStore: true,
    },
    enabled: true,
  },
  // 二级风险（合规隐患）
  {
    id: 'risk_license_expired',
    name: '证照到期',
    type: 'license_expired',
    level: 'major',
    conditions: { timeWindow: 720 }, // 30天内
    requirements: {
      responseTime: 24,
      resolveTime: 72,
      notifyTargets: ['region_manager', 'store_manager'],
    },
    penalties: {
      deductPoints: 20,
    },
    enabled: true,
  },
  {
    id: 'risk_health_cert_expired',
    name: '健康证到期',
    type: 'health_cert_expired',
    level: 'major',
    conditions: { timeWindow: 720 },
    requirements: {
      responseTime: 48,
      resolveTime: 168, // 7天
      notifyTargets: ['region_manager', 'store_manager'],
    },
    penalties: {
      deductPoints: 10,
    },
    enabled: true,
  },
  {
    id: 'risk_high_loss_rate',
    name: '损耗率超标',
    type: 'high_loss_rate',
    level: 'major',
    conditions: { threshold: 0.05 }, // 5%
    requirements: {
      responseTime: 48,
      resolveTime: 168,
      notifyTargets: ['region_manager', 'store_manager'],
    },
    penalties: {
      deductPoints: 15,
    },
    enabled: true,
  },
  // 三级风险（运营提醒）
  {
    id: 'risk_stockout',
    name: '畅销品断货',
    type: 'stockout',
    level: 'minor',
    conditions: { count: 3, timeWindow: 24 },
    requirements: {
      responseTime: 4,
      resolveTime: 168,
      notifyTargets: ['store_manager', 'region_supervisor'],
    },
    enabled: true,
  },
  {
    id: 'risk_member_decline',
    name: '会员活跃度下降',
    type: 'member_decline',
    level: 'minor',
    conditions: { threshold: -0.2, timeWindow: 168 },
    requirements: {
      responseTime: 72,
      resolveTime: 168,
      notifyTargets: ['store_manager'],
    },
    enabled: true,
  },
];

// ==================== 门店管控服务类 ====================

class StoreControlService {
  private static instance: StoreControlService;
  private templates: StoreControlTemplate[] = DEFAULT_TEMPLATES;
  private riskRules: RiskRule[] = DEFAULT_RISK_RULES;
  
  private constructor() {}
  
  public static getInstance(): StoreControlService {
    if (!StoreControlService.instance) {
      StoreControlService.instance = new StoreControlService();
    }
    return StoreControlService.instance;
  }

  // ==================== 门店管理 ====================

  /**
   * 获取门店列表
   */
  getStores(type?: StoreType, status?: StoreStatus): StoreProfile[] {
    // TODO: 从API获取数据
    return [];
  }

  /**
   * 获取门店详情
   */
  getStore(storeId: string): StoreProfile | null {
    // TODO: 从API获取数据
    return null;
  }

  /**
   * 创建门店并应用权限模板
   */
  createStore(store: Omit<StoreProfile, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'currentPermissions' | 'riskScore' | 'riskHistory'>): StoreProfile {
    const now = new Date().toISOString();
    const template = this.getTemplateByStoreType(store.type);
    
    return {
      ...store,
      id: `STORE${Date.now()}`,
      code: this.generateStoreCode(store.type),
      currentPermissions: {
        templateId: template?.id || '',
        appliedAt: now,
      },
      riskScore: 100,
      riskHistory: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 更新门店状态
   */
  updateStoreStatus(storeId: string, status: StoreStatus): StoreProfile | null {
    console.log('[StoreControl] Updating store status:', storeId, status);
    return null;
  }

  /**
   * 切换门店类型（升级/降级）
   */
  changeStoreType(storeId: string, newType: StoreType): StoreProfile | null {
    const template = this.getTemplateByStoreType(newType);
    console.log('[StoreControl] Changing store type:', storeId, newType, template?.id);
    return null;
  }

  // ==================== 管控模板管理 ====================

  /**
   * 获取管控模板列表
   */
  getTemplates(): StoreControlTemplate[] {
    return this.templates;
  }

  /**
   * 获取门店类型的默认模板
   */
  getTemplateByStoreType(storeType: StoreType): StoreControlTemplate | undefined {
    return this.templates.find(t => t.storeType === storeType && t.isDefault);
  }

  /**
   * 获取模板详情
   */
  getTemplate(templateId: string): StoreControlTemplate | undefined {
    return this.templates.find(t => t.id === templateId);
  }

  /**
   * 应用管控模板到门店
   */
  applyTemplateToStore(storeId: string, templateId: string): boolean {
    console.log('[StoreControl] Applying template to store:', storeId, templateId);
    return true;
  }

  // ==================== 权限检查 ====================

  /**
   * 检查权限
   */
  checkPermission(
    storeType: StoreType,
    module: FeatureModule,
    subModule: SubModule,
    action: PermissionAction
  ): boolean {
    const template = this.getTemplateByStoreType(storeType);
    if (!template) return false;
    
    const permission = template.permissions.find(
      p => p.module === module && p.subModule === subModule
    );
    if (!permission) return false;
    
    return permission.actions.includes(action);
  }

  /**
   * 获取门店的权限配置
   */
  getStorePermissions(storeType: StoreType): PermissionConfig[] {
    const template = this.getTemplateByStoreType(storeType);
    return template?.permissions || [];
  }

  /**
   * 检查权限是否被冻结
   */
  isPermissionFrozen(storeId: string, subModule: SubModule): boolean {
    // TODO: 检查门店的冻结权限列表
    return false;
  }

  /**
   * 冻结门店权限
   */
  freezePermissions(storeId: string, subModules: SubModule[]): boolean {
    console.log('[StoreControl] Freezing permissions:', storeId, subModules);
    return true;
  }

  /**
   * 解冻门店权限
   */
  unfreezePermissions(storeId: string, subModules: SubModule[]): boolean {
    console.log('[StoreControl] Unfreezing permissions:', storeId, subModules);
    return true;
  }

  // ==================== 风险预警管理 ====================

  /**
   * 获取风险规则列表
   */
  getRiskRules(): RiskRule[] {
    return this.riskRules;
  }

  /**
   * 获取风险规则
   */
  getRiskRule(ruleId: string): RiskRule | undefined {
    return this.riskRules.find(r => r.id === ruleId);
  }

  /**
   * 创建风险预警
   */
  createRiskAlert(
    storeId: string,
    ruleId: string,
    triggerData: RiskAlert['triggerData']
  ): RiskAlert {
    const rule = this.getRiskRule(ruleId);
    const now = new Date().toISOString();
    
    return {
      id: `ALERT${Date.now()}`,
      alertNo: this.generateAlertNo(),
      storeId,
      storeName: '',
      storeType: 'direct',
      ruleId,
      ruleName: rule?.name || '',
      type: rule?.type || 'expired_product',
      level: rule?.level || 'major',
      triggerData,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 获取风险预警列表
   */
  getRiskAlerts(storeId?: string, level?: RiskLevel, status?: RiskAlert['status']): RiskAlert[] {
    // TODO: 从API获取数据
    return [];
  }

  /**
   * 分配整改任务
   */
  assignRectification(
    alertId: string,
    assigneeId: string,
    assigneeName: string,
    deadline: string
  ): RiskAlert | null {
    console.log('[StoreControl] Assigning rectification:', alertId, assigneeId, deadline);
    return null;
  }

  /**
   * 提交整改结果
   */
  submitRectification(
    alertId: string,
    submittedBy: string,
    evidence: string[]
  ): RiskAlert | null {
    console.log('[StoreControl] Submitting rectification:', alertId, submittedBy);
    return null;
  }

  /**
   * 审核整改结果
   */
  reviewRectification(
    alertId: string,
    reviewerId: string,
    result: 'approved' | 'rejected',
    comment: string
  ): RiskAlert | null {
    console.log('[StoreControl] Reviewing rectification:', alertId, result);
    return null;
  }

  /**
   * 执行处罚措施
   */
  executePenalty(alertId: string): boolean {
    console.log('[StoreControl] Executing penalty:', alertId);
    return true;
  }

  // ==================== 临时权限管理 ====================

  /**
   * 申请临时权限
   */
  requestTemporaryPermission(
    request: Omit<TemporaryPermissionRequest, 'id' | 'requestNo' | 'status' | 'operationLogs' | 'createdAt' | 'updatedAt'>
  ): TemporaryPermissionRequest {
    const now = new Date().toISOString();
    return {
      ...request,
      id: `TPR${Date.now()}`,
      requestNo: this.generateRequestNo(),
      status: 'pending',
      operationLogs: [{
        action: 'created',
        operatorId: request.applicantId,
        operatorName: request.applicantName,
        operatedAt: now,
        details: request.reason,
      }],
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 审批临时权限
   */
  approveTemporaryPermission(
    requestId: string,
    approved: boolean,
    approverId: string,
    approverName: string,
    rejectReason?: string
  ): TemporaryPermissionRequest | null {
    console.log('[StoreControl] Approving temporary permission:', requestId, approved);
    return null;
  }

  /**
   * 获取临时权限申请列表
   */
  getTemporaryPermissionRequests(storeId?: string, status?: TemporaryPermissionRequest['status']): TemporaryPermissionRequest[] {
    // TODO: 从API获取数据
    return [];
  }

  /**
   * 检查临时权限是否有效
   */
  isTemporaryPermissionValid(storeId: string, module: FeatureModule, subModule: SubModule): boolean {
    // TODO: 检查有效临时权限
    return false;
  }

  // ==================== 加盟申请管理 ====================

  /**
   * 创建加盟申请
   */
  createFranchiseApplication(
    application: Omit<FranchiseApplication, 'id' | 'applicationNo' | 'status' | 'reviews' | 'createdAt' | 'updatedAt'>
  ): FranchiseApplication {
    const now = new Date().toISOString();
    return {
      ...application,
      id: `FAP${Date.now()}`,
      applicationNo: this.generateApplicationNo(),
      status: 'submitted',
      reviews: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 审核加盟申请
   */
  reviewFranchiseApplication(
    applicationId: string,
    reviewerId: string,
    reviewerName: string,
    result: 'approved' | 'rejected',
    comment: string
  ): FranchiseApplication | null {
    console.log('[StoreControl] Reviewing application:', applicationId, result);
    return null;
  }

  /**
   * 获取加盟申请列表
   */
  getFranchiseApplications(status?: FranchiseApplicationStatus): FranchiseApplication[] {
    // TODO: 从API获取数据
    return [];
  }

  // ==================== 数据权限管理 ====================

  /**
   * 获取数据权限配置
   */
  getDataPermissionConfig(roleId: string): DataPermissionConfig | null {
    // TODO: 从API获取数据
    return null;
  }

  /**
   * 检查数据访问权限
   */
  checkDataAccess(
    roleId: string,
    targetStoreId: string,
    module: FeatureModule
  ): boolean {
    // TODO: 实现数据访问权限检查
    return true;
  }

  // ==================== 辅助方法 ====================

  private generateStoreCode(type: StoreType): string {
    const prefix = type === 'direct' ? 'D' : 'F';
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `${prefix}${seq}`;
  }

  private generateApplicationNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `FAP${year}${month}${day}${seq}`;
  }

  private generateRequestNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `TPR${year}${month}${day}${seq}`;
  }

  private generateAlertNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `ALERT${year}${month}${day}${seq}`;
  }
}

// 导出单例
export const storeControlService = StoreControlService.getInstance();

// 导出工具函数
export function getStoreTypeName(type: StoreType): string {
  return STORE_TYPE_NAMES[type];
}

export function getRiskLevelColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    critical: 'text-red-600 bg-red-50',
    major: 'text-orange-600 bg-orange-50',
    minor: 'text-yellow-600 bg-yellow-50',
  };
  return colors[level];
}

export function getRiskLevelName(level: RiskLevel): string {
  const names: Record<RiskLevel, string> = {
    critical: '一级风险',
    major: '二级风险',
    minor: '三级风险',
  };
  return names[level];
}
