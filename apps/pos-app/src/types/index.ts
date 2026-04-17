// ============================================
// 海邻到家 V6.0 - 核心类型定义
// ============================================

// ============ 基础类型 ============
export type ID = string;
export type DateTime = string;
export type Money = number;

// ============ 门店相关 ============
export interface Store {
  id: ID;
  name: string;
  code: string;
  address: string;
  phone: string;
  status: 'active' | 'inactive' | 'closed';
  region: string;
  managerId: ID;
  createdAt: DateTime;
}

export interface StoreStats {
  storeId: ID;
  todaySales: Money;
  todayOrders: number;
  todayCash: Money;
  todayOnline: Money;
  inventoryValue: Money;
  memberCount: number;
}

// ============ 员工相关 ============
export interface Employee {
  id: ID;
  name: string;
  phone: string;
  role: 'admin' | 'manager' | 'cashier';
  storeId: ID;
  status: 'active' | 'inactive';
  hiredAt: DateTime;
}

export interface Attendance {
  id: ID;
  employeeId: ID;
  storeId: ID;
  checkIn: DateTime;
  checkOut?: DateTime;
  status: 'normal' | 'late' | 'early' | 'absent';
}

// ============ 商品相关 ============
export interface Product {
  id: ID;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  costPrice: Money;
  retailPrice: Money;
  wholesalePrice: Money;
  image?: string;
  isStandard: boolean; // 是否标品（标品有条码）
  status: 'active' | 'inactive';
  supplier?: string; // 供应商
  stock?: number; // 库存
}

export interface Inventory {
  id: ID;
  storeId: ID;
  productId: ID;
  quantity: number;
  warningThreshold: number;
  lastRestockAt: DateTime;
  status: 'normal' | 'low' | 'critical' | 'overdue';
}

// ============ 订单相关 ============
export type OrderType = 'pos' | 'mini' | 'delivery' | 'groupbuy';
export type PayMethod = 'cash' | 'wechat' | 'alipay' | 'unionpay' | 'member';
export type OrderStatus = 'pending' | 'paid' | 'completed' | 'refunded' | 'cancelled';

export interface Order {
  id: ID;
  orderNo: string;
  type: OrderType;
  storeId: ID;
  memberId?: ID;
  items: OrderItem[];
  totalAmount: Money;
  discountAmount: Money;
  finalAmount: Money;
  payMethod: PayMethod;
  payStatus: 'unpaid' | 'paid' | 'refunded';
  status: OrderStatus;
  cashierId: ID;
  createdAt: DateTime;
  paidAt?: DateTime;
}

export interface OrderItem {
  productId: ID;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: Money;
  discount: Money;
  subtotal: Money;
}

// ============ 会员相关 ============
export type MemberLevel = 'normal' | 'silver' | 'gold' | 'diamond';

export interface Member {
  id: ID;
  phone: string;
  name: string;
  level: MemberLevel;
  points: number;
  balance: Money;
  totalConsume: Money;
  tags: string[];
  createdAt: DateTime;
}

export interface MemberBenefit {
  level: MemberLevel;
  discount: number;
  pointsRate: number;
  threshold: Money;
}

// ============ 供应链相关 ============
export type PurchaseStatus = 'pending' | 'approved' | 'shipped' | 'received' | 'completed';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'shipped' | 'received';

export interface PurchaseOrder {
  id: ID;
  orderNo: string;
  supplierId: ID;
  items: PurchaseItem[];
  totalAmount: Money;
  status: PurchaseStatus;
  expectedAt: DateTime;
  createdAt: DateTime;
}

export interface PurchaseItem {
  productId: ID;
  quantity: number;
  unitPrice: Money;
  subtotal: Money;
}

export interface RestockRequest {
  id: ID;
  orderNo: string;
  storeId: ID;
  items: RestockItem[];
  totalAmount: Money;
  status: RequestStatus;
  requestedBy: ID;
  requestedAt: DateTime;
  approvedBy?: ID;
  approvedAt?: DateTime;
}

export interface RestockItem {
  productId: ID;
  quantity: number;
  currentStock: number;
}

// ============ 财务相关 ============
export type FundType = 'sales' | 'restock' | 'refund' | 'deposit' | 'withdraw';

export interface FundFlow {
  id: ID;
  storeId: ID;
  type: FundType;
  amount: Money;
  method: PayMethod;
  orderId?: ID;
  description: string;
  createdAt: DateTime;
}

export interface DepositSlip {
  id: ID;
  storeId: ID;
  employeeId: ID;
  amount: Money;
  bankReceipt?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: DateTime;
  confirmedAt?: DateTime;
}

export interface DayStatement {
  id: ID;
  storeId: ID;
  date: DateTime;
  cashSales: Money;
  onlineSales: Money;
  cashDeposit: Money;
  expectedDeposit: Money;
  difference: Money;
  orderCount: number;
  status: 'pending' | 'confirmed' | ' discrepancy';
}

// ============ 团购相关 ============
export type GroupBuyStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface GroupBuy {
  id: ID;
  title: string;
  productId: ID;
  originalPrice: Money;
  groupPrice: Money;
  minPeople: number;
  currentPeople: number;
  startTime: DateTime;
  endTime: DateTime;
  status: GroupBuyStatus;
  storeId: ID;
  createdAt: DateTime;
}

export interface GroupBuyParticipant {
  id: ID;
  groupBuyId: ID;
  memberId?: ID;
  nickname: string;
  phone: string;
  quantity: number;
  joinedAt: DateTime;
}

// ============ AI 相关 ============
export interface AIBarcodeResult {
  barcode: string;
  confidence: number;
  product?: Product;
  candidates: Product[];
}

export interface AIVisionResult {
  productName: string;
  confidence: number;
  estimatedWeight?: number;
  candidates: Array<{ name: string; confidence: number }>;
}

// ============ 导出常量 ============
export const MEMBER_BENEFITS: Record<MemberLevel, MemberBenefit> = {
  normal: { level: 'normal', discount: 1.0, pointsRate: 1.0, threshold: 0 },
  silver: { level: 'silver', discount: 0.98, pointsRate: 1.2, threshold: 1000 },
  gold: { level: 'gold', discount: 0.95, pointsRate: 1.5, threshold: 5000 },
  diamond: { level: 'diamond', discount: 0.9, pointsRate: 2.0, threshold: 20000 },
};

export const CLEARANCE_HOUR_START = 20;
export const CLEARANCE_HOUR_END = 23;
export const CLEARANCE_DISCOUNT = 0.8;
