/**
 * 供应链服务模块
 * 实现要货申请、集中采购、配送签收全流程管理
 */

// ==================== 类型定义 ====================

// 要货申请状态
export type RequestStatus = 
  | 'draft'      // 草稿
  | 'submitted'  // 已提交
  | 'approved'   // 已审批
  | 'rejected'   // 已驳回
  | 'processing' // 处理中
  | 'shipped'    // 已发货
  | 'received'   // 已签收
  | 'completed'; // 已完成

// 采购订单状态
export type PurchaseStatus =
  | 'draft'      // 草稿
  | 'pending'    // 待审批
  | 'approved'   // 已审批
  | 'ordered'    // 已下单
  | 'partial'    // 部分到货
  | 'received'   // 已到货
  | 'completed'; // 已完成

// 配送状态
export type DeliveryStatus =
  | 'preparing'  // 备货中
  | 'ready'      // 待配送
  | 'delivering' // 配送中
  | 'delivered'  // 已送达
  | 'received'   // 已签收
  | 'exception'; // 异常

// 门店类型
export type StoreType = 'direct' | 'franchise_a' | 'franchise_b' | 'franchise_c';

// 要货申请明细
export interface RequestItem {
  id: string;
  productId: string;
  productName: string;
  productIcon: string;
  unit: string;
  requestQuantity: number;    // 申请数量
  approvedQuantity?: number;  // 审批数量
  shippedQuantity?: number;   // 发货数量
  receivedQuantity?: number;  // 签收数量
  unitPrice?: number;         // 单价
  totalPrice?: number;        // 总价
  remark?: string;
}

// 要货申请单
export interface PurchaseRequest {
  id: string;
  requestNo: string;          // 申请单号
  storeId: string;            // 门店ID
  storeName: string;          // 门店名称
  storeType: StoreType;       // 门店类型
  items: RequestItem[];       // 申请明细
  totalItems: number;         // 总品种数
  totalQuantity: number;      // 总数量
  totalAmount?: number;       // 总金额
  status: RequestStatus;
  urgency: 'normal' | 'urgent' | 'emergency'; // 紧急程度
  expectedDate?: string;      // 期望到货日期
  remark?: string;            // 申请备注
  rejectReason?: string;      // 驳回原因
  
  // 审批信息
  approvedBy?: string;
  approvedAt?: string;
  
  // 配送信息
  deliveryId?: string;
  deliveryNo?: string;
  
  // 签收信息
  receivedBy?: string;
  receivedAt?: string;
  receiveRemark?: string;
  
  // 时间戳
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 采购订单明细
export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  productIcon: string;
  unit: string;
  orderQuantity: number;      // 订货数量
  unitPrice: number;          // 单价
  totalPrice: number;         // 总价
  receivedQuantity: number;   // 已到货数量
  pendingQuantity: number;    // 待到货数量
  
  // 关联的要货申请
  relatedRequests: {
    requestId: string;
    storeId: string;
    storeName: string;
    quantity: number;
  }[];
}

// 采购订单
export interface PurchaseOrder {
  id: string;
  orderNo: string;            // 采购单号
  supplierId: string;         // 供应商ID
  supplierName: string;       // 供应商名称
  items: PurchaseOrderItem[]; // 采购明细
  totalItems: number;         // 总品种数
  totalQuantity: number;      // 总数量
  totalAmount: number;        // 总金额
  status: PurchaseStatus;
  
  // 配送方式
  deliveryType: 'central' | 'direct'; // 总仓配送/供应商直配
  warehouseId?: string;       // 配送仓库ID
  
  // 时间信息
  expectedDate?: string;      // 预计到货日期
  orderedAt?: string;         // 下单时间
  
  // 审批信息
  approvedBy?: string;
  approvedAt?: string;
  
  // 时间戳
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 配送单明细
export interface DeliveryItem {
  id: string;
  productId: string;
  productName: string;
  productIcon: string;
  unit: string;
  quantity: number;           // 配送数量
  receivedQuantity?: number;  // 签收数量
  lossQuantity?: number;      // 损耗数量
  lossReason?: string;        // 损耗原因
}

// 配送单
export interface DeliveryOrder {
  id: string;
  deliveryNo: string;         // 配送单号
  purchaseOrderId?: string;   // 关联采购单ID
  purchaseOrderNo?: string;   // 关联采购单号
  
  // 发货方
  fromType: 'warehouse' | 'supplier';
  fromId: string;
  fromName: string;
  
  // 收货方
  toType: 'store' | 'warehouse';
  toId: string;
  toName: string;
  toAddress: string;
  toContact: string;
  toPhone: string;
  
  items: DeliveryItem[];
  totalItems: number;
  totalQuantity: number;
  
  status: DeliveryStatus;
  
  // 物流信息
  driverName?: string;
  driverPhone?: string;
  vehicleNo?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  
  // 签收信息
  receivedBy?: string;
  receivedAt?: string;
  receiveSignature?: string;  // 签收签名图片
  receivePhotos?: string[];   // 签收照片
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

// ==================== 供应链服务类 ====================

class SupplyChainService {
  private static instance: SupplyChainService;
  
  private constructor() {}
  
  public static getInstance(): SupplyChainService {
    if (!SupplyChainService.instance) {
      SupplyChainService.instance = new SupplyChainService();
    }
    return SupplyChainService.instance;
  }

  // ==================== 要货申请 ====================

  /**
   * 创建要货申请
   */
  createPurchaseRequest(request: Omit<PurchaseRequest, 'id' | 'requestNo' | 'status' | 'createdAt' | 'updatedAt'>): PurchaseRequest {
    const now = new Date().toISOString();
    return {
      ...request,
      id: `REQ${Date.now()}`,
      requestNo: this.generateRequestNo(),
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 提交要货申请
   */
  submitPurchaseRequest(requestId: string): PurchaseRequest | null {
    // TODO: 实现提交逻辑
    console.log('[SupplyChain] Submitting request:', requestId);
    return null;
  }

  /**
   * 审批要货申请
   */
  approvePurchaseRequest(
    requestId: string,
    approved: boolean,
    approvedBy: string,
    items: { itemId: string; approvedQuantity: number }[],
    rejectReason?: string
  ): PurchaseRequest | null {
    // TODO: 实现审批逻辑
    console.log('[SupplyChain] Approving request:', requestId, approved);
    return null;
  }

  /**
   * 获取门店的要货申请列表
   */
  getStoreRequests(storeId: string, status?: RequestStatus[]): PurchaseRequest[] {
    // TODO: 从API获取数据
    return [];
  }

  /**
   * 获取待审批的要货申请
   */
  getPendingRequests(): PurchaseRequest[] {
    // TODO: 从API获取数据
    return [];
  }

  // ==================== 集中采购 ====================

  /**
   * 汇总要货申请，生成采购订单
   */
  aggregateRequestsToPurchaseOrder(requestIds: string[]): PurchaseOrder | null {
    // TODO: 实现汇总逻辑
    console.log('[SupplyChain] Aggregating requests:', requestIds);
    return null;
  }

  /**
   * 创建采购订单
   */
  createPurchaseOrder(order: Omit<PurchaseOrder, 'id' | 'orderNo' | 'status' | 'createdAt' | 'updatedAt'>): PurchaseOrder {
    const now = new Date().toISOString();
    return {
      ...order,
      id: `PO${Date.now()}`,
      orderNo: this.generatePurchaseOrderNo(),
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 向供应商下单
   */
  placeOrderToSupplier(orderId: string): PurchaseOrder | null {
    // TODO: 实现下单逻辑
    console.log('[SupplyChain] Placing order to supplier:', orderId);
    return null;
  }

  /**
   * 获取采购订单列表
   */
  getPurchaseOrders(status?: PurchaseStatus[]): PurchaseOrder[] {
    // TODO: 从API获取数据
    return [];
  }

  // ==================== 配送管理 ====================

  /**
   * 创建配送单
   */
  createDeliveryOrder(delivery: Omit<DeliveryOrder, 'id' | 'deliveryNo' | 'status' | 'createdAt' | 'updatedAt'>): DeliveryOrder {
    const now = new Date().toISOString();
    return {
      ...delivery,
      id: `DLV${Date.now()}`,
      deliveryNo: this.generateDeliveryNo(),
      status: 'preparing',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 更新配送状态
   */
  updateDeliveryStatus(deliveryId: string, status: DeliveryStatus): DeliveryOrder | null {
    // TODO: 实现状态更新逻辑
    console.log('[SupplyChain] Updating delivery status:', deliveryId, status);
    return null;
  }

  /**
   * 签收配送单
   */
  receiveDelivery(
    deliveryId: string,
    receivedBy: string,
    items: { itemId: string; receivedQuantity: number; lossQuantity?: number; lossReason?: string }[],
    signature?: string,
    photos?: string[]
  ): DeliveryOrder | null {
    // TODO: 实现签收逻辑
    console.log('[SupplyChain] Receiving delivery:', deliveryId);
    return null;
  }

  /**
   * 获取门店待签收的配送单
   */
  getStorePendingDeliveries(storeId: string): DeliveryOrder[] {
    // TODO: 从API获取数据
    return [];
  }

  // ==================== 辅助方法 ====================

  private generateRequestNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `REQ${year}${month}${day}${seq}`;
  }

  private generatePurchaseOrderNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `PO${year}${month}${day}${seq}`;
  }

  private generateDeliveryNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `DLV${year}${month}${day}${seq}`;
  }
}

// 导出单例
export const supplyChainService = SupplyChainService.getInstance();
