// ============================================
// 海邻到家 - 统一类型定义
// 所有业务类型的集中定义
// ============================================

// ============ 通用类型 ============

/** 基础实体 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** 分页结果 */
export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 分页请求 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/** API响应 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

// ============ 门店类型 ============

export type StoreType = 'direct' | 'franchise_a' | 'franchise_b' | 'franchise_c';
export type StoreStatus = 'open' | 'closed' | 'suspended';

export interface Store {
  id: string;
  name: string;
  code: string;
  type: StoreType;
  address: string;
  phone: string;
  managerId?: string;
  managerName?: string;
  status: StoreStatus;
  businessHours: {
    open: string;
    close: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  logo?: string;
}

// ============ 商品类型 ============

export type ProductStatus = 'active' | 'inactive' | 'deleted';

export interface Product {
  id: string;
  barcode?: string;
  name: string;
  price: number;
  originalPrice?: number;
  icon: string;
  imageUrl?: string;
  images?: ProductImage[];
  stock: number;
  unit: string;
  category: string;
  categoryName?: string;
  brand?: string;
  specification?: string;
  tags?: string[];
  isHot?: boolean;
  isNew?: boolean;
  status: ProductStatus;
  cost?: number;
  profit?: number;
}

export interface ProductImage {
  id: string;
  type: 'main' | 'detail';
  url: string;
  channel: 'pos' | 'miniapp' | 'groupbuy' | 'all';
  sort: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  sort: number;
  children?: ProductCategory[];
}

export interface ProductSearchParams extends PaginationParams {
  keyword?: string;
  barcode?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  storeId?: string;
}

// ============ 购物车类型 ============

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  isWeighted: boolean;
  unit: string;
  remark?: string;
}

export interface Cart {
  id: string;
  memberId?: string;
  items: CartItem[];
  itemCount: number;
  originalAmount: number;
  discountAmount: number;
  totalAmount: number;
  couponDiscount?: number;
  finalAmount: number;
}

export interface AddToCartParams {
  productId: string;
  quantity: number;
  remark?: string;
}

export interface UpdateCartParams {
  itemId: string;
  quantity: number;
}

// ============ 会员类型 ============

export type MemberLevel = 'normal' | 'silver' | 'gold' | 'diamond';

export interface Member {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  level: MemberLevel;
  levelName: string;
  points: number;
  balance: number;
  totalSpent: number;
  orderCount: number;
  birthday?: string;
  tags?: string[];
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface MemberLevelInfo {
  level: MemberLevel;
  name: string;
  discount: number;        // 折扣率，如 0.98
  pointsMultiplier: number; // 积分倍数
  benefits: string[];      // 会员权益
}

export const MEMBER_LEVELS: Record<MemberLevel, MemberLevelInfo> = {
  normal: {
    level: 'normal',
    name: '普通会员',
    discount: 1,
    pointsMultiplier: 1,
    benefits: ['1倍积分', '生日双倍积分'],
  },
  silver: {
    level: 'silver',
    name: '银卡会员',
    discount: 0.98,
    pointsMultiplier: 1.2,
    benefits: ['98折优惠', '1.2倍积分', '生日双倍积分'],
  },
  gold: {
    level: 'gold',
    name: '金卡会员',
    discount: 0.95,
    pointsMultiplier: 1.5,
    benefits: ['95折优惠', '1.5倍积分', '生日三倍积分', '专属客服'],
  },
  diamond: {
    level: 'diamond',
    name: '钻石会员',
    discount: 0.9,
    pointsMultiplier: 2,
    benefits: ['9折优惠', '2倍积分', '生日五倍积分', '专属客服', '优先配送'],
  },
};

// ============ 订单类型 ============

export type OrderStatus = 
  | 'pending'      // 待支付
  | 'paid'         // 已支付
  | 'processing'   // 处理中
  | 'shipped'      // 已发货
  | 'delivered'    // 已送达
  | 'completed'    // 已完成
  | 'cancelled'    // 已取消
  | 'refunded';    // 已退款

export type OrderType = 'offline' | 'online' | 'delivery';

export interface Order {
  id: string;
  orderNo: string;
  type: OrderType;
  memberId?: string;
  memberName?: string;
  memberPhone?: string;
  items: OrderItem[];
  itemCount: number;
  originalAmount: number;
  discountAmount: number;
  couponDiscount: number;
  totalAmount: number;
  finalAmount: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentTime?: string;
  paymentNo?: string;
  storeId?: string;
  storeName?: string;
  operatorId?: string;
  operatorName?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface CreateOrderParams {
  cartId?: string;
  items?: Omit<OrderItem, 'id'>[];
  memberId?: string;
  couponId?: string;
  paymentMethod: PaymentMethod;
  storeId?: string;
  remark?: string;
}

// ============ 支付类型 ============

export type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'member_card' | 'mixed';

export interface PaymentInfo {
  method: PaymentMethod;
  amount: number;
  transactionNo?: string;
}

export interface PaymentRequest {
  orderId: string;
  payments: PaymentInfo[];
  operatorId?: string;
}

export interface PaymentResult {
  success: boolean;
  orderId: string;
  paidAmount: number;
  paymentTime: string;
  changeAmount?: number;
}

// ============ 优惠券类型 ============

export type CouponType = 'fullreduce' | 'discount' | 'cash';
export type CouponStatus = 'unused' | 'used' | 'expired';
export type UseChannel = 'miniapp' | 'offline' | 'web';

export interface CouponTemplate {
  id: string;
  name: string;
  type: CouponType;
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  validDays: number;
  totalQuantity: number;
  remainQuantity: number;
  useChannels: UseChannel[];
  status: 'active' | 'paused' | 'ended';
  startTime?: string;
  endTime?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  templateId: string;
  name: string;
  type: CouponType;
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  memberId: string;
  memberName: string;
  memberPhone: string;
  status: CouponStatus;
  source: 'manual' | 'register' | 'order' | 'promotion';
  receivedAt: string;
  usedAt?: string;
  expiredAt: string;
}

export interface VerifyCouponParams {
  code?: string;
  couponId?: string;
  channel: UseChannel;
  orderId?: string;
  orderAmount: number;
  storeId: string;
  storeName: string;
  operatorId?: string;
  operatorName?: string;
}

// ============ 促销类型 ============

export type PromotionType = 'discount' | 'fullreduce' | 'coupon' | 'points' | 'flash_sale';

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  description: string;
  startTime: string;
  endTime: string;
  rules: PromotionRule[];
  status: 'active' | 'paused' | 'ended';
  storeIds?: string[];
  createdBy?: string;
}

export interface PromotionRule {
  type: 'threshold' | 'percentage' | 'fixed' | 'flash';
  condition?: number;
  discount: number;
  maxDiscount?: number;
  quantity?: number;
}

// ============ 员工类型 ============

export type StaffRole = 'admin' | 'manager' | 'cashier' | 'operator';

export interface Staff {
  id: string;
  name: string;
  phone: string;
  role: StaffRole;
  roleName: string;
  storeId: string;
  storeName?: string;
  avatar?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface LoginParams {
  phone: string;
  password: string;
  storeId?: string;
}

export interface LoginResult {
  token: string;
  user: Staff;
  store: Store;
}

// ============ 硬件设备类型 ============

export type DeviceType = 'printer' | 'scanner' | 'cashbox' | 'scale' | 'display';
export type DeviceStatus = 'connected' | 'disconnected' | 'error';

export interface Device {
  id: string;
  type: DeviceType;
  name: string;
  status: DeviceStatus;
  config?: Record<string, any>;
}

export interface PrinterConfig {
  type: 'usb' | 'bluetooth' | 'network';
  address?: string;
  width?: 58 | 80;
  name?: string;
}

export interface ScaleConfig {
  type: 'usb' | 'bluetooth';
  address?: string;
  unit?: 'g' | 'kg';
}

export interface ReceiptData {
  storeName: string;
  storePhone?: string;
  orderNo: string;
  operatorName?: string;
  memberName?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  total: number;
  discount: number;
  paidAmount: number;
  paymentMethod: string;
  timestamp: number;
}

export interface ScaleReading {
  weight: number;
  unit: string;
  stable: boolean;
  timestamp: number;
}

// ============ 报表类型 ============

export interface SalesReport {
  date: string;
  orderCount: number;
  totalAmount: number;
  avgOrderAmount: number;
  cashAmount: number;
  wechatAmount: number;
  alipayAmount: number;
  memberAmount: number;
  topProducts: TopProduct[];
  topMembers: TopMember[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  quantity: number;
  amount: number;
}

export interface TopMember {
  memberId: string;
  memberName: string;
  phone: string;
  orderCount: number;
  amount: number;
}

export interface InventoryReport {
  storeId: string;
  storeName: string;
  totalProducts: number;
  totalStock: number;
  totalValue: number;
  lowStockProducts: LowStockProduct[];
  expiringProducts: ExpiringProduct[];
}

export interface LowStockProduct {
  productId: string;
  productName: string;
  barcode: string;
  stock: number;
  minStock: number;
}

export interface ExpiringProduct {
  productId: string;
  productName: string;
  barcode: string;
  stock: number;
  expireDate: string;
  daysLeft: number;
}

// ============ 供应链类型 ============

export type SupplyRequestStatus = 'pending' | 'approved' | 'rejected' | 'shipped' | 'received';

export interface SupplyRequest {
  id: string;
  requestNo: string;
  storeId: string;
  storeName: string;
  requesterId: string;
  requesterName: string;
  items: SupplyRequestItem[];
  totalAmount: number;
  status: SupplyRequestStatus;
  remark?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  receivedAt?: string;
}

export interface SupplyRequestItem {
  productId: string;
  productName: string;
  barcode: string;
  requestQuantity: number;
  approvedQuantity?: number;
  price: number;
}

export type PurchaseOrderStatus = 'pending' | 'confirmed' | 'shipped' | 'received' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  orderNo: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: PurchaseOrderStatus;
  expectedDelivery?: string;
  actualDelivery?: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  price: number;
  receivedQuantity?: number;
}
