/**
 * 商品生命周期服务模块
 * 实现临期预警、损耗登记、先进先出管理
 */

// ==================== 类型定义 ====================

// 商品状态
export type ProductStatus = 
  | 'normal'        // 正常
  | 'expiring'      // 临期
  | 'expired'       // 过期
  | 'locked'        // 锁定
  | 'discontinued'; // 停售

// 库存预警类型
export type StockAlertType =
  | 'low_stock'     // 低库存
  | 'out_of_stock'  // 缺货
  | 'overstock'     // 滞销积压
  | 'expiring'      // 临期
  | 'expired';      // 过期

// 损耗类型
export type LossType =
  | 'damage'        // 破损
  | 'expired'       // 过期
  | 'theft'         // 丢失
  | 'quality'       // 质量问题
  | 'other';        // 其他

// 批次状态
export type BatchStatus = 
  | 'active'        // 正常销售
  | 'clearance'     // 清货中
  | 'locked'        // 锁定
  | 'disposed';     // 已销毁

// 商品批次（用于先进先出）
export interface ProductBatch {
  id: string;
  batchNo: string;
  productId: string;
  productName: string;
  
  // 数量信息
  quantity: number;
  soldQuantity: number;
  availableQuantity: number;
  
  // 价格信息
  purchasePrice: number;
  salePrice: number;
  clearancePrice?: number;  // 清货价
  
  // 日期信息
  productionDate?: string;
  expiryDate?: string;
  
  // 入库信息
  receivedDate: string;
  supplierId?: string;
  supplierName?: string;
  purchaseOrderId?: string;
  
  // 状态
  status: BatchStatus;
  
  // 存储位置
  location?: string;
  
  createdAt: string;
  updatedAt: string;
}

// 库存预警
export interface StockAlert {
  id: string;
  alertNo: string;
  type: StockAlertType;
  
  // 商品信息
  productId: string;
  productName: string;
  productIcon: string;
  
  // 门店信息
  storeId: string;
  storeName: string;
  
  // 预警详情
  currentStock: number;
  threshold?: number;
  daysUntilExpiry?: number;
  
  // 处理状态
  status: 'active' | 'acknowledged' | 'resolved';
  
  // 处理信息
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
  
  createdAt: string;
  updatedAt: string;
}

// 损耗记录
export interface LossRecord {
  id: string;
  lossNo: string;
  
  // 商品信息
  productId: string;
  productName: string;
  productIcon: string;
  batchId?: string;
  batchNo?: string;
  
  // 门店信息
  storeId: string;
  storeName: string;
  
  // 损耗信息
  type: LossType;
  quantity: number;
  unit: string;
  unitCost: number;
  totalLoss: number;
  
  // 处理方式
  disposal: 'discard' | 'return' | 'donate' | 'other';
  
  // 描述
  description: string;
  
  // 附件
  photos?: string[];
  
  // 审批信息
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: string;
  
  // 经办人
  operatorId: string;
  operatorName: string;
  
  createdAt: string;
  updatedAt: string;
}

// 临期商品处理记录
export interface ExpiryHandlingRecord {
  id: string;
  recordNo: string;
  
  // 商品信息
  productId: string;
  productName: string;
  batchId: string;
  batchNo: string;
  
  // 门店信息
  storeId: string;
  storeName: string;
  
  // 处理信息
  handlingType: 'discount' | 'clearance' | 'disposal' | 'return';
  originalPrice: number;
  handlingPrice?: number;
  quantity: number;
  
  // 时间信息
  expiryDate: string;
  daysUntilExpiry: number;
  handledAt: string;
  
  // 备注
  remark?: string;
  
  // 经办人
  operatorId: string;
  operatorName: string;
  
  createdAt: string;
}

// 库存盘点记录
export interface StocktakeRecord {
  id: string;
  recordNo: string;
  storeId: string;
  storeName: string;
  
  // 盘点类型
  type: 'full' | 'partial' | 'category' | 'random';
  categoryIds?: string[];
  
  // 盘点状态
  status: 'pending' | 'in_progress' | 'completed' | 'adjusted';
  
  // 盘点明细
  items: {
    productId: string;
    productName: string;
    productIcon: string;
    unit: string;
    systemStock: number;    // 系统库存
    actualStock: number;    // 实际库存
    difference: number;     // 差异
    cost: number;           // 成本
    totalDifference: number; // 差异金额
    remark?: string;
  }[];
  
  // 汇总
  totalItems: number;
  totalDifference: number;
  lossAmount: number;       // 损失金额
  gainAmount: number;       // 盘盈金额
  
  // 时间信息
  startedAt?: string;
  completedAt?: string;
  
  // 参与人员
  operatorId: string;
  operatorName: string;
  reviewerId?: string;
  reviewerName?: string;
  
  createdAt: string;
  updatedAt: string;
}

// ==================== 商品生命周期服务类 ====================

class ProductLifecycleService {
  private static instance: ProductLifecycleService;
  
  // 预警阈值配置
  private alertThresholds = {
    lowStock: 10,           // 低库存阈值
    outOfStock: 0,          // 缺货阈值
    overstockDays: 60,      // 滞销天数
    expiringDays: [30, 15, 7, 3], // 临期预警天数
  };

  private constructor() {}
  
  public static getInstance(): ProductLifecycleService {
    if (!ProductLifecycleService.instance) {
      ProductLifecycleService.instance = new ProductLifecycleService();
    }
    return ProductLifecycleService.instance;
  }

  // ==================== 批次管理（先进先出） ====================

  /**
   * 创建商品批次
   */
  createBatch(batch: Omit<ProductBatch, 'id' | 'batchNo' | 'soldQuantity' | 'availableQuantity' | 'status' | 'createdAt' | 'updatedAt'>): ProductBatch {
    const now = new Date().toISOString();
    return {
      ...batch,
      id: `BAT${Date.now()}`,
      batchNo: this.generateBatchNo(),
      soldQuantity: 0,
      availableQuantity: batch.quantity,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 按先进先出原则获取销售批次
   */
  getBatchesForSale(productId: string, quantity: number, storeId: string): ProductBatch[] {
    // TODO: 实现先进先出逻辑
    // 1. 获取该商品所有可用批次（按过期日期升序）
    // 2. 优先销售即将过期的批次
    // 3. 返回需要扣减的批次列表
    console.log('[ProductLifecycle] Getting batches for sale:', productId, quantity);
    return [];
  }

  /**
   * 扣减批次库存
   */
  deductBatchStock(batchId: string, quantity: number): ProductBatch | null {
    // TODO: 实现扣减逻辑
    console.log('[ProductLifecycle] Deducting batch stock:', batchId, quantity);
    return null;
  }

  /**
   * 获取商品的所有批次
   */
  getProductBatches(productId: string, storeId: string): ProductBatch[] {
    // TODO: 从API获取数据
    return [];
  }

  // ==================== 临期预警 ====================

  /**
   * 检查临期状态
   */
  checkExpiryStatus(expiryDate: string): {
    status: ProductStatus;
    daysUntilExpiry: number;
    alertLevel: 'none' | 'warning' | 'critical';
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) {
      return { status: 'expired', daysUntilExpiry, alertLevel: 'critical' };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'expiring', daysUntilExpiry, alertLevel: 'critical' };
    } else if (daysUntilExpiry <= 15) {
      return { status: 'expiring', daysUntilExpiry, alertLevel: 'warning' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', daysUntilExpiry, alertLevel: 'warning' };
    }
    
    return { status: 'normal', daysUntilExpiry, alertLevel: 'none' };
  }

  /**
   * 获取临期商品列表
   */
  getExpiringProducts(storeId: string, days?: number): StockAlert[] {
    // TODO: 从API获取数据
    // 返回指定天数内即将过期的商品
    return [];
  }

  /**
   * 创建临期预警
   */
  createExpiryAlert(
    productId: string,
    productName: string,
    productIcon: string,
    storeId: string,
    storeName: string,
    currentStock: number,
    daysUntilExpiry: number
  ): StockAlert {
    const now = new Date().toISOString();
    const type = daysUntilExpiry <= 0 ? 'expired' : 'expiring';
    
    return {
      id: `ALR${Date.now()}`,
      alertNo: this.generateAlertNo(),
      type,
      productId,
      productName,
      productIcon,
      storeId,
      storeName,
      currentStock,
      daysUntilExpiry,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 处理临期商品
   */
  handleExpiringProduct(
    productId: string,
    batchId: string,
    storeId: string,
    handlingType: ExpiryHandlingRecord['handlingType'],
    quantity: number,
    handlingPrice?: number,
    remark?: string,
    operatorId?: string,
    operatorName?: string
  ): ExpiryHandlingRecord {
    return {
      id: `EXH${Date.now()}`,
      recordNo: this.generateHandlingNo(),
      productId,
      productName: '',
      batchId,
      batchNo: '',
      storeId,
      storeName: '',
      handlingType,
      originalPrice: 0,
      handlingPrice,
      quantity,
      expiryDate: '',
      daysUntilExpiry: 0,
      handledAt: new Date().toISOString(),
      remark,
      operatorId: operatorId || '',
      operatorName: operatorName || '',
      createdAt: new Date().toISOString(),
    };
  }

  // ==================== 损耗管理 ====================

  /**
   * 登记损耗
   */
  registerLoss(
    productId: string,
    productName: string,
    productIcon: string,
    storeId: string,
    storeName: string,
    type: LossType,
    quantity: number,
    unit: string,
    unitCost: number,
    disposal: LossRecord['disposal'],
    description: string,
    photos: string[],
    operatorId: string,
    operatorName: string
  ): LossRecord {
    const now = new Date().toISOString();
    const totalLoss = quantity * unitCost;
    
    // 根据损耗金额判断是否需要审批
    const approvalRequired = totalLoss >= 100;
    
    return {
      id: `LOS${Date.now()}`,
      lossNo: this.generateLossNo(),
      productId,
      productName,
      productIcon,
      storeId,
      storeName,
      type,
      quantity,
      unit,
      unitCost,
      totalLoss,
      disposal,
      description,
      photos,
      approvalRequired,
      operatorId,
      operatorName,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 审批损耗记录
   */
  approveLossRecord(
    lossId: string,
    approvedBy: string
  ): LossRecord | null {
    // TODO: 实现审批逻辑
    console.log('[ProductLifecycle] Approving loss record:', lossId);
    return null;
  }

  /**
   * 获取损耗记录
   */
  getLossRecords(storeId: string, startDate?: string, endDate?: string): LossRecord[] {
    // TODO: 从API获取数据
    return [];
  }

  /**
   * 计算损耗率
   */
  calculateLossRate(storeId: string, period: 'week' | 'month' | 'year'): number {
    // TODO: 实现损耗率计算
    // 损耗率 = 损耗金额 / 销售额 * 100%
    return 0;
  }

  // ==================== 库存预警 ====================

  /**
   * 检查库存预警
   */
  checkStockAlert(
    productId: string,
    productName: string,
    productIcon: string,
    currentStock: number,
    safetyStock: number,
    storeId: string,
    storeName: string
  ): StockAlert | null {
    if (currentStock <= 0) {
      return {
        id: `ALR${Date.now()}`,
        alertNo: this.generateAlertNo(),
        type: 'out_of_stock',
        productId,
        productName,
        productIcon,
        storeId,
        storeName,
        currentStock,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    
    if (currentStock <= safetyStock) {
      return {
        id: `ALR${Date.now()}`,
        alertNo: this.generateAlertNo(),
        type: 'low_stock',
        productId,
        productName,
        productIcon,
        storeId,
        storeName,
        currentStock,
        threshold: safetyStock,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    
    return null;
  }

  /**
   * 获取活动预警列表
   */
  getActiveAlerts(storeId: string): StockAlert[] {
    // TODO: 从API获取数据
    return [];
  }

  // ==================== 盘点管理 ====================

  /**
   * 创建盘点记录
   */
  createStocktake(
    storeId: string,
    storeName: string,
    type: StocktakeRecord['type'],
    categoryIds: string[] | undefined,
    operatorId: string,
    operatorName: string
  ): StocktakeRecord {
    const now = new Date().toISOString();
    
    return {
      id: `STK${Date.now()}`,
      recordNo: this.generateStocktakeNo(),
      storeId,
      storeName,
      type,
      categoryIds,
      status: 'pending',
      items: [],
      totalItems: 0,
      totalDifference: 0,
      lossAmount: 0,
      gainAmount: 0,
      operatorId,
      operatorName,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 提交盘点结果
   */
  submitStocktake(
    stocktakeId: string,
    items: StocktakeRecord['items']
  ): StocktakeRecord | null {
    // TODO: 实现提交逻辑
    console.log('[ProductLifecycle] Submitting stocktake:', stocktakeId);
    return null;
  }

  /**
   * 调整库存（基于盘点结果）
   */
  adjustStock(stocktakeId: string): boolean {
    // TODO: 实现库存调整逻辑
    console.log('[ProductLifecycle] Adjusting stock based on stocktake:', stocktakeId);
    return true;
  }

  // ==================== 辅助方法 ====================

  private generateBatchNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `BAT${year}${month}${day}${seq}`;
  }

  private generateAlertNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `ALR${year}${month}${day}${seq}`;
  }

  private generateLossNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `LOS${year}${month}${day}${seq}`;
  }

  private generateHandlingNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `EXH${year}${month}${day}${seq}`;
  }

  private generateStocktakeNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `STK${year}${month}${day}${seq}`;
  }
}

// 导出单例
export const productLifecycleService = ProductLifecycleService.getInstance();
