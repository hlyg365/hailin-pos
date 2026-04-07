/**
 * 合规风控服务模块
 * 实现合规台账、风险预警、巡店管理
 */

// ==================== 类型定义 ====================

// 风险等级
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

// 预警状态
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'closed';

// 合规检查项类型
export type ComplianceType = 
  | 'food_safety'    // 食品安全
  | 'tobacco'        // 烟草专卖
  | 'license'        // 证照管理
  | 'health_cert'    // 健康证
  | 'fire_safety'    // 消防安全
  | 'pricing';       // 价格合规

// 巡检状态
export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// 整改状态
export type RectificationStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

// 预警信息
export interface ComplianceAlert {
  id: string;
  alertNo: string;
  type: ComplianceType;
  level: RiskLevel;
  title: string;
  description: string;
  
  // 关联信息
  storeId?: string;
  storeName?: string;
  productId?: string;
  productName?: string;
  relatedEntity?: string;
  
  status: AlertStatus;
  
  // 处理信息
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
  
  // 时间信息
  occurredAt: string;
  expiresAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

// 合规台账记录
export interface ComplianceRecord {
  id: string;
  recordNo: string;
  type: ComplianceType;
  storeId: string;
  storeName: string;
  
  // 食品安全台账
  foodSafety?: {
    supplierName: string;
    supplierLicense: string;
    productName: string;
    batchNo: string;
    quantity: number;
    unit: string;
    productionDate?: string;
    expiryDate?: string;
    receiveDate: string;
    inspector: string;
    qualified: boolean;
    photos?: string[];
  };
  
  // 烟草台账
  tobacco?: {
    supplierName: string;
    tobaccoLicense: string;
    productName: string;
    quantity: number;
    unit: string;
    purchaseDate: string;
    invoiceNo: string;
  };
  
  // 证照信息
  license?: {
    licenseType: string;
    licenseNo: string;
    issueDate: string;
    expiryDate: string;
    issuingAuthority: string;
    status: 'valid' | 'expiring' | 'expired';
  };
  
  // 健康证信息
  healthCert?: {
    staffId: string;
    staffName: string;
    certNo: string;
    issueDate: string;
    expiryDate: string;
    status: 'valid' | 'expiring' | 'expired';
  };
  
  createdAt: string;
  updatedAt: string;
}

// 巡检项
export interface InspectionItem {
  id: string;
  category: string;
  name: string;
  description: string;
  standard: string;
  score: number;
  maxScore: number;
  result?: 'pass' | 'fail' | 'na';
  photos?: string[];
  remark?: string;
}

// 巡检报告
export interface InspectionReport {
  id: string;
  reportNo: string;
  storeId: string;
  storeName: string;
  inspectorId: string;
  inspectorName: string;
  
  // 巡检时间
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  
  status: InspectionStatus;
  
  // 巡检结果
  items: InspectionItem[];
  totalScore: number;
  maxScore: number;
  passRate: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  
  // 问题与整改
  issues: {
    id: string;
    itemId: string;
    itemName: string;
    description: string;
    severity: RiskLevel;
    photos?: string[];
    rectificationRequired: boolean;
    rectificationDeadline?: string;
  }[];
  
  // 整改跟踪
  rectifications: RectificationRecord[];
  
  // 签名确认
  inspectorSignature?: string;
  storeManagerSignature?: string;
  
  createdAt: string;
  updatedAt: string;
}

// 整改记录
export interface RectificationRecord {
  id: string;
  reportId: string;
  issueId: string;
  issueDescription: string;
  
  status: RectificationStatus;
  
  // 整改要求
  requirement: string;
  deadline: string;
  
  // 整改执行
  executorId?: string;
  executorName?: string;
  startedAt?: string;
  completedAt?: string;
  photos?: string[];
  remark?: string;
  
  // 审核确认
  reviewerId?: string;
  reviewerName?: string;
  reviewedAt?: string;
  approved: boolean;
  reviewRemark?: string;
  
  createdAt: string;
  updatedAt: string;
}

// 风险规则配置
export interface RiskRule {
  id: string;
  type: ComplianceType;
  name: string;
  description: string;
  level: RiskLevel;
  
  // 触发条件
  conditions: {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';
    value: any;
  }[];
  
  // 自动处理
  autoActions?: {
    type: 'alert' | 'lock' | 'notify' | 'freeze';
    target: string[];
    message: string;
  }[];
  
  enabled: boolean;
}

// ==================== 合规风控服务类 ====================

class ComplianceService {
  private static instance: ComplianceService;
  
  // 风险规则
  private riskRules: RiskRule[] = [
    {
      id: 'rule_001',
      type: 'food_safety',
      name: '过期商品预警',
      description: '商品超过保质期，禁止销售',
      level: 'critical',
      conditions: [
        { field: 'expiryDate', operator: 'lt', value: 'today' },
      ],
      autoActions: [
        { type: 'lock', target: ['product'], message: '商品已过期，自动锁定禁止销售' },
        { type: 'alert', target: ['store_manager', 'hq_compliance'], message: '发现过期商品，请立即处理' },
      ],
      enabled: true,
    },
    {
      id: 'rule_002',
      type: 'license',
      name: '证照即将到期预警',
      description: '证照将在30天内到期',
      level: 'high',
      conditions: [
        { field: 'expiryDate', operator: 'lte', value: '30days' },
        { field: 'expiryDate', operator: 'gt', value: 'today' },
      ],
      autoActions: [
        { type: 'alert', target: ['store_manager', 'hq_admin'], message: '证照即将到期，请及时续期' },
      ],
      enabled: true,
    },
    {
      id: 'rule_003',
      type: 'health_cert',
      name: '健康证即将到期预警',
      description: '员工健康证将在30天内到期',
      level: 'medium',
      conditions: [
        { field: 'expiryDate', operator: 'lte', value: '30days' },
        { field: 'expiryDate', operator: 'gt', value: 'today' },
      ],
      autoActions: [
        { type: 'alert', target: ['store_manager'], message: '员工健康证即将到期，请安排体检' },
      ],
      enabled: true,
    },
    {
      id: 'rule_004',
      type: 'tobacco',
      name: '烟草未成年人销售拦截',
      description: '销售烟草时必须确认购买者已满18岁',
      level: 'critical',
      conditions: [
        { field: 'category', operator: 'eq', value: 'tobacco' },
      ],
      autoActions: [
        { type: 'lock', target: ['sale'], message: '请确认购买者已满18周岁' },
      ],
      enabled: true,
    },
    {
      id: 'rule_005',
      type: 'food_safety',
      name: '临期商品预警',
      description: '商品即将在30天内过期',
      level: 'medium',
      conditions: [
        { field: 'expiryDate', operator: 'lte', value: '30days' },
        { field: 'expiryDate', operator: 'gt', value: '7days' },
      ],
      autoActions: [
        { type: 'alert', target: ['store_manager'], message: '商品即将过期，请安排促销清货' },
      ],
      enabled: true,
    },
  ];

  private constructor() {}
  
  public static getInstance(): ComplianceService {
    if (!ComplianceService.instance) {
      ComplianceService.instance = new ComplianceService();
    }
    return ComplianceService.instance;
  }

  // ==================== 预警管理 ====================

  /**
   * 创建预警
   */
  createAlert(alert: Omit<ComplianceAlert, 'id' | 'alertNo' | 'status' | 'createdAt' | 'updatedAt'>): ComplianceAlert {
    const now = new Date().toISOString();
    return {
      ...alert,
      id: `ALR${Date.now()}`,
      alertNo: this.generateAlertNo(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 获取活动预警列表
   */
  getActiveAlerts(storeId?: string, level?: RiskLevel[]): ComplianceAlert[] {
    // TODO: 从API获取数据
    return [];
  }

  /**
   * 确认预警
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): ComplianceAlert | null {
    // TODO: 实现确认逻辑
    console.log('[Compliance] Acknowledging alert:', alertId);
    return null;
  }

  /**
   * 解决预警
   */
  resolveAlert(alertId: string, resolvedBy: string, resolution: string): ComplianceAlert | null {
    // TODO: 实现解决逻辑
    console.log('[Compliance] Resolving alert:', alertId);
    return null;
  }

  /**
   * 检查商品合规性
   */
  checkProductCompliance(product: {
    id: string;
    name: string;
    expiryDate?: string;
    category?: string;
  }): { compliant: boolean; alerts: ComplianceAlert[] } {
    const alerts: ComplianceAlert[] = [];
    let compliant = true;

    // 检查过期
    if (product.expiryDate) {
      const expiryDate = new Date(product.expiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 0) {
        compliant = false;
        alerts.push(this.createAlert({
          type: 'food_safety',
          level: 'critical',
          title: '商品已过期',
          description: `商品"${product.name}"已过期${Math.abs(daysUntilExpiry)}天，禁止销售`,
          productId: product.id,
          productName: product.name,
          occurredAt: new Date().toISOString(),
        }));
      } else if (daysUntilExpiry <= 7) {
        alerts.push(this.createAlert({
          type: 'food_safety',
          level: 'high',
          title: '商品即将过期',
          description: `商品"${product.name}"将在${daysUntilExpiry}天后过期`,
          productId: product.id,
          productName: product.name,
          occurredAt: new Date().toISOString(),
        }));
      } else if (daysUntilExpiry <= 30) {
        alerts.push(this.createAlert({
          type: 'food_safety',
          level: 'medium',
          title: '商品临期提醒',
          description: `商品"${product.name}"将在${daysUntilExpiry}天后过期，建议安排促销`,
          productId: product.id,
          productName: product.name,
          occurredAt: new Date().toISOString(),
        }));
      }
    }

    // 检查烟草销售限制
    if (product.category === 'tobacco') {
      // 烟草需要在销售时进行年龄确认，这里只是标记
      console.log('[Compliance] Tobacco product requires age verification');
    }

    return { compliant, alerts };
  }

  // ==================== 合规台账 ====================

  /**
   * 创建食品安全台账记录
   */
  createFoodSafetyRecord(record: Omit<ComplianceRecord, 'id' | 'recordNo' | 'type' | 'createdAt' | 'updatedAt'> & {
    foodSafety: NonNullable<ComplianceRecord['foodSafety']>;
  }): ComplianceRecord {
    const now = new Date().toISOString();
    return {
      ...record,
      id: `REC${Date.now()}`,
      recordNo: this.generateRecordNo(),
      type: 'food_safety',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 创建烟草台账记录
   */
  createTobaccoRecord(record: Omit<ComplianceRecord, 'id' | 'recordNo' | 'type' | 'createdAt' | 'updatedAt'> & {
    tobacco: NonNullable<ComplianceRecord['tobacco']>;
  }): ComplianceRecord {
    const now = new Date().toISOString();
    return {
      ...record,
      id: `REC${Date.now()}`,
      recordNo: this.generateRecordNo(),
      type: 'tobacco',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 获取门店合规台账
   */
  getStoreComplianceRecords(storeId: string, type?: ComplianceType[]): ComplianceRecord[] {
    // TODO: 从API获取数据
    return [];
  }

  /**
   * 导出台账（用于打印）
   */
  exportComplianceRecords(storeId: string, type: ComplianceType, startDate: string, endDate: string): string {
    // TODO: 实现导出逻辑，生成可打印的HTML或PDF
    console.log('[Compliance] Exporting records:', storeId, type, startDate, endDate);
    return '';
  }

  // ==================== 巡检管理 ====================

  /**
   * 创建巡检报告
   */
  createInspectionReport(report: Omit<InspectionReport, 'id' | 'reportNo' | 'status' | 'createdAt' | 'updatedAt'>): InspectionReport {
    const now = new Date().toISOString();
    return {
      ...report,
      id: `INS${Date.now()}`,
      reportNo: this.generateInspectionNo(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 开始巡检
   */
  startInspection(reportId: string): InspectionReport | null {
    // TODO: 实现开始巡检逻辑
    console.log('[Compliance] Starting inspection:', reportId);
    return null;
  }

  /**
   * 提交巡检结果
   */
  submitInspection(
    reportId: string,
    items: InspectionItem[],
    inspectorSignature: string
  ): InspectionReport | null {
    // TODO: 实现提交巡检结果逻辑
    console.log('[Compliance] Submitting inspection:', reportId);
    return null;
  }

  /**
   * 获取门店巡检报告列表
   */
  getStoreInspectionReports(storeId: string): InspectionReport[] {
    // TODO: 从API获取数据
    return [];
  }

  /**
   * 计算巡检评分等级
   */
  calculateGrade(score: number, maxScore: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  // ==================== 整改管理 ====================

  /**
   * 创建整改记录
   */
  createRectification(
    reportId: string,
    issueId: string,
    requirement: string,
    deadline: string
  ): RectificationRecord {
    const now = new Date().toISOString();
    return {
      id: `RCT${Date.now()}`,
      reportId,
      issueId,
      issueDescription: '',
      status: 'pending',
      requirement,
      deadline,
      approved: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 提交整改结果
   */
  submitRectification(
    rectificationId: string,
    executorId: string,
    executorName: string,
    photos: string[],
    remark: string
  ): RectificationRecord | null {
    // TODO: 实现提交整改逻辑
    console.log('[Compliance] Submitting rectification:', rectificationId);
    return null;
  }

  /**
   * 审核整改结果
   */
  reviewRectification(
    rectificationId: string,
    reviewerId: string,
    reviewerName: string,
    approved: boolean,
    remark: string
  ): RectificationRecord | null {
    // TODO: 实现审核逻辑
    console.log('[Compliance] Reviewing rectification:', rectificationId);
    return null;
  }

  // ==================== 辅助方法 ====================

  private generateAlertNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `ALR${year}${month}${day}${seq}`;
  }

  private generateRecordNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `REC${year}${month}${day}${seq}`;
  }

  private generateInspectionNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `INS${year}${month}${day}${seq}`;
  }
}

// 导出单例
export const complianceService = ComplianceService.getInstance();
