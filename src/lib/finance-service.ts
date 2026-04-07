/**
 * 财务分账服务模块
 * 实现收支管理、自动分账、财务报表
 */

// ==================== 类型定义 ====================

// 门店类型
export type StoreType = 'direct' | 'franchise_a' | 'franchise_b' | 'franchise_c';

// 分账规则类型
export type SplitRuleType = 
  | 'revenue'        // 营收分成
  | 'supply'         // 货款结算
  | 'brand_fee'      // 品牌管理费
  | 'service_fee'    // 服务费
  | 'deposit';       // 保证金

// 结算状态
export type SettlementStatus = 
  | 'pending'        // 待结算
  | 'processing'     // 处理中
  | 'completed'      // 已完成
  | 'failed';        // 失败

// 支出类型
export type ExpenseType = 
  | 'rent'           // 房租
  | 'utilities'      // 水电费
  | 'salary'         // 人员工资
  | 'purchase'       // 采购货款
  | 'marketing'      // 营销费用
  | 'maintenance'    // 维修费用
  | 'other';         // 其他

// 收入类型
export type IncomeType =
  | 'sales'          // 销售收入
  | 'service'        // 服务收入
  | 'other';         // 其他收入

// 分账规则
export interface SplitRule {
  id: string;
  name: string;
  storeType: StoreType;
  ruleType: SplitRuleType;
  
  // 计算方式
  calculation: {
    type: 'percentage' | 'fixed' | 'tiered';
    value: number;         // 百分比或固定金额
    minValue?: number;     // 最小金额
    maxValue?: number;     // 最大金额
  };
  
  // 阶梯规则（适用于tiered类型）
  tiers?: {
    minAmount: number;
    maxAmount: number;
    value: number;
  }[];
  
  // 结算周期
  settlementPeriod: 'realtime' | 'daily' | 'weekly' | 'monthly';
  
  // 生效时间
  effectiveFrom: string;
  effectiveTo?: string;
  
  enabled: boolean;
}

// 分账明细
export interface SplitDetail {
  id: string;
  transactionId: string;
  storeId: string;
  storeName: string;
  storeType: StoreType;
  
  // 原始交易
  originalAmount: number;
  
  // 分账明细
  splits: {
    ruleType: SplitRuleType;
    ruleName: string;
    amount: number;
    recipient: {
      type: 'headquarters' | 'store' | 'supplier';
      id: string;
      name: string;
    };
  }[];
  
  // 门店实际收入
  storeIncome: number;
  
  // 总部收入
  headquartersIncome: number;
  
  createdAt: string;
}

// 结算记录
export interface SettlementRecord {
  id: string;
  settlementNo: string;
  storeId: string;
  storeName: string;
  storeType: StoreType;
  
  // 结算周期
  periodStart: string;
  periodEnd: string;
  
  // 汇总金额
  totalRevenue: number;
  totalSplits: number;
  storeNetIncome: number;
  
  // 分项明细
  details: {
    type: SplitRuleType;
    description: string;
    amount: number;
  }[];
  
  // 跨店消费结算
  crossStoreSettlements?: {
    fromStoreId: string;
    fromStoreName: string;
    amount: number;
  }[];
  
  status: SettlementStatus;
  
  // 结算时间
  settledAt?: string;
  
  // 支付信息
  paymentMethod?: string;
  paymentReference?: string;
  
  createdAt: string;
  updatedAt: string;
}

// 收支记录
export interface TransactionRecord {
  id: string;
  transactionNo: string;
  storeId: string;
  storeName: string;
  
  // 交易类型
  type: 'income' | 'expense';
  category: IncomeType | ExpenseType;
  subCategory?: string;
  
  // 金额
  amount: number;
  
  // 关联信息
  relatedType?: 'order' | 'purchase' | 'transfer' | 'settlement';
  relatedId?: string;
  relatedNo?: string;
  
  // 描述
  description: string;
  
  // 支付方式
  paymentMethod?: 'cash' | 'wechat' | 'alipay' | 'card' | 'transfer';
  
  // 时间
  transactionAt: string;
  
  // 经办人
  operatorId?: string;
  operatorName?: string;
  
  // 附件
  attachments?: string[];
  
  createdAt: string;
}

// 财务报表
export interface FinancialReport {
  id: string;
  reportNo: string;
  storeId?: string;      // 不填表示总部合并报表
  storeName?: string;
  
  // 报表类型
  reportType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  
  // 报表周期
  periodStart: string;
  periodEnd: string;
  
  // 收入汇总
  income: {
    sales: number;
    service: number;
    other: number;
    total: number;
  };
  
  // 支出汇总
  expenses: {
    cost: number;          // 商品成本
    rent: number;
    utilities: number;
    salary: number;
    marketing: number;
    maintenance: number;
    other: number;
    total: number;
  };
  
  // 利润
  profit: {
    gross: number;         // 毛利润
    operating: number;     // 营业利润
    net: number;           // 净利润
  };
  
  // 关键指标
  metrics: {
    grossMargin: number;   // 毛利率
    netMargin: number;     // 净利率
    avgDailySales: number; // 日均销售
    avgOrderAmount: number; // 客单价
    transactionCount: number; // 交易笔数
  };
  
  // 对比数据
  comparison?: {
    previousPeriod: {
      revenue: number;
      profit: number;
      growth: number;
    };
  };
  
  createdAt: string;
}

// ==================== 财务分账服务类 ====================

class FinanceService {
  private static instance: FinanceService;
  
  // 默认分账规则
  private defaultSplitRules: SplitRule[] = [
    // 直营门店：全额归集总部
    {
      id: 'rule_direct_001',
      name: '直营门店营收归集',
      storeType: 'direct',
      ruleType: 'revenue',
      calculation: { type: 'percentage', value: 100 },
      settlementPeriod: 'realtime',
      effectiveFrom: '2024-01-01',
      enabled: true,
    },
    // A级加盟：品牌管理费
    {
      id: 'rule_franchise_a_001',
      name: 'A级加盟品牌管理费',
      storeType: 'franchise_a',
      ruleType: 'brand_fee',
      calculation: { type: 'percentage', value: 5 },
      settlementPeriod: 'monthly',
      effectiveFrom: '2024-01-01',
      enabled: true,
    },
    // B级加盟：品牌管理费
    {
      id: 'rule_franchise_b_001',
      name: 'B级加盟品牌管理费',
      storeType: 'franchise_b',
      ruleType: 'brand_fee',
      calculation: { type: 'percentage', value: 3 },
      settlementPeriod: 'monthly',
      effectiveFrom: '2024-01-01',
      enabled: true,
    },
    // C级加盟：品牌管理费
    {
      id: 'rule_franchise_c_001',
      name: 'C级加盟品牌管理费',
      storeType: 'franchise_c',
      ruleType: 'brand_fee',
      calculation: { type: 'fixed', value: 500 },
      settlementPeriod: 'monthly',
      effectiveFrom: '2024-01-01',
      enabled: true,
    },
    // 供应链货款结算
    {
      id: 'rule_supply_001',
      name: '供应链货款结算',
      storeType: 'franchise_a',
      ruleType: 'supply',
      calculation: { type: 'percentage', value: 100 },
      settlementPeriod: 'daily',
      effectiveFrom: '2024-01-01',
      enabled: true,
    },
  ];

  private constructor() {}
  
  public static getInstance(): FinanceService {
    if (!FinanceService.instance) {
      FinanceService.instance = new FinanceService();
    }
    return FinanceService.instance;
  }

  // ==================== 分账规则管理 ====================

  /**
   * 获取门店类型的分账规则
   */
  getSplitRules(storeType: StoreType): SplitRule[] {
    return this.defaultSplitRules.filter(rule => rule.storeType === storeType && rule.enabled);
  }

  /**
   * 计算分账金额
   */
  calculateSplit(
    amount: number,
    storeType: StoreType,
    ruleType: SplitRuleType
  ): number {
    const rules = this.getSplitRules(storeType);
    const rule = rules.find(r => r.ruleType === ruleType);
    
    if (!rule) return 0;
    
    const { calculation } = rule;
    
    switch (calculation.type) {
      case 'percentage':
        let result = amount * (calculation.value / 100);
        if (calculation.minValue) result = Math.max(result, calculation.minValue);
        if (calculation.maxValue) result = Math.min(result, calculation.maxValue);
        return Math.round(result * 100) / 100;
        
      case 'fixed':
        return calculation.value;
        
      case 'tiered':
        if (!rule.tiers) return 0;
        for (const tier of rule.tiers) {
          if (amount >= tier.minAmount && amount < tier.maxAmount) {
            return tier.value;
          }
        }
        return 0;
        
      default:
        return 0;
    }
  }

  /**
   * 执行自动分账
   */
  executeSplit(
    transactionId: string,
    storeId: string,
    storeName: string,
    storeType: StoreType,
    amount: number
  ): SplitDetail {
    const rules = this.getSplitRules(storeType);
    const splits: SplitDetail['splits'] = [];
    let headquartersIncome = 0;
    let storeIncome = amount;

    for (const rule of rules) {
      const splitAmount = this.calculateSplit(amount, storeType, rule.ruleType);
      
      if (splitAmount > 0) {
        splits.push({
          ruleType: rule.ruleType,
          ruleName: rule.name,
          amount: splitAmount,
          recipient: {
            type: rule.ruleType === 'supply' ? 'headquarters' : 'headquarters',
            id: 'hq_001',
            name: '总部',
          },
        });
        
        headquartersIncome += splitAmount;
        storeIncome -= splitAmount;
      }
    }

    return {
      id: `SPL${Date.now()}`,
      transactionId,
      storeId,
      storeName,
      storeType,
      originalAmount: amount,
      splits,
      storeIncome: Math.max(0, storeIncome),
      headquartersIncome,
      createdAt: new Date().toISOString(),
    };
  }

  // ==================== 跨店消费结算 ====================

  /**
   * 计算跨店消费分账
   */
  calculateCrossStoreSettlement(
    orderStoreId: string,      // 下单门店
    memberRegisterStoreId: string, // 会员注册门店
    amount: number
  ): { orderStoreAmount: number; registerStoreAmount: number } {
    // 默认规则：
    // - 下单门店获得70%
    // - 会员注册门店获得30%（用于会员维护成本）
    const orderStoreAmount = Math.round(amount * 0.7 * 100) / 100;
    const registerStoreAmount = Math.round(amount * 0.3 * 100) / 100;
    
    return { orderStoreAmount, registerStoreAmount };
  }

  // ==================== 结算管理 ====================

  /**
   * 创建结算记录
   */
  createSettlement(
    storeId: string,
    storeName: string,
    storeType: StoreType,
    periodStart: string,
    periodEnd: string,
    transactions: TransactionRecord[]
  ): SettlementRecord {
    const totalRevenue = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const splitDetails = transactions.map(t => 
      this.executeSplit(t.id, storeId, storeName, storeType, t.amount)
    );
    
    const totalSplits = splitDetails.reduce((sum, d) => sum + d.headquartersIncome, 0);
    const storeNetIncome = totalRevenue - totalSplits;

    return {
      id: `SET${Date.now()}`,
      settlementNo: this.generateSettlementNo(),
      storeId,
      storeName,
      storeType,
      periodStart,
      periodEnd,
      totalRevenue,
      totalSplits,
      storeNetIncome,
      details: [
        { type: 'revenue', description: '本期营业收入', amount: totalRevenue },
        { type: 'brand_fee', description: '品牌管理费', amount: this.calculateSplit(totalRevenue, storeType, 'brand_fee') },
      ],
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 执行结算
   */
  executeSettlement(settlementId: string): SettlementRecord | null {
    // TODO: 实现结算逻辑
    console.log('[Finance] Executing settlement:', settlementId);
    return null;
  }

  /**
   * 获取门店结算记录
   */
  getStoreSettlements(storeId: string): SettlementRecord[] {
    // TODO: 从API获取数据
    return [];
  }

  // ==================== 收支管理 ====================

  /**
   * 记录收入
   */
  recordIncome(record: Omit<TransactionRecord, 'id' | 'transactionNo' | 'type' | 'createdAt'>): TransactionRecord {
    return {
      ...record,
      id: `TRX${Date.now()}`,
      transactionNo: this.generateTransactionNo(),
      type: 'income',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 记录支出
   */
  recordExpense(record: Omit<TransactionRecord, 'id' | 'transactionNo' | 'type' | 'createdAt'>): TransactionRecord {
    return {
      ...record,
      id: `TRX${Date.now()}`,
      transactionNo: this.generateTransactionNo(),
      type: 'expense',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 获取门店收支记录
   */
  getStoreTransactions(storeId: string, startDate?: string, endDate?: string): TransactionRecord[] {
    // TODO: 从API获取数据
    return [];
  }

  // ==================== 财务报表 ====================

  /**
   * 生成财务报表
   */
  generateFinancialReport(
    storeId: string | undefined,
    storeName: string | undefined,
    reportType: FinancialReport['reportType'],
    periodStart: string,
    periodEnd: string
  ): FinancialReport {
    // TODO: 实现报表生成逻辑
    // 这里返回模拟数据
    const totalRevenue = 56800;
    const totalCost = 32000;
    const totalExpenses = 8500;
    
    return {
      id: `RPT${Date.now()}`,
      reportNo: this.generateReportNo(),
      storeId,
      storeName,
      reportType,
      periodStart,
      periodEnd,
      income: {
        sales: totalRevenue,
        service: 1200,
        other: 300,
        total: totalRevenue + 1200 + 300,
      },
      expenses: {
        cost: totalCost,
        rent: 4500,
        utilities: 800,
        salary: 12000,
        marketing: 500,
        maintenance: 200,
        other: 500,
        total: totalCost + 18500,
      },
      profit: {
        gross: totalRevenue - totalCost,
        operating: totalRevenue - totalCost - 8500,
        net: totalRevenue - totalCost - 18500,
      },
      metrics: {
        grossMargin: ((totalRevenue - totalCost) / totalRevenue) * 100,
        netMargin: ((totalRevenue - totalCost - 18500) / totalRevenue) * 100,
        avgDailySales: totalRevenue / 30,
        avgOrderAmount: 45.5,
        transactionCount: 1250,
      },
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 获取财务报表列表
   */
  getFinancialReports(storeId?: string): FinancialReport[] {
    // TODO: 从API获取数据
    return [];
  }

  // ==================== 辅助方法 ====================

  private generateSettlementNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `SET${year}${month}${day}${seq}`;
  }

  private generateTransactionNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `TRX${year}${month}${day}${seq}`;
  }

  private generateReportNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `RPT${year}${month}${day}${seq}`;
  }
}

// 导出单例
export const financeService = FinanceService.getInstance();
