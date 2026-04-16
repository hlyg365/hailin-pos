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

// ============ 商品类型 ============

export interface Product {
  id: string;
  barcode?: string;
  name: string;
  price: number;
  originalPrice?: number;
  icon: string;
  imageUrl?: string;
  images?: string[];
  stock: number;
  unit: string;
  category: string;
  categoryName?: string;
  brand?: string;
  specification?: string;
  tags?: string[];
  isHot?: boolean;
  isNew?: boolean;
  status: 'active' | 'inactive' | 'deleted';
}

export interface ProductSearchParams extends PaginationParams {
  keyword?: string;
  barcode?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
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

export interface Order {
  id: string;
  orderNo: string;
  memberId?: string;
  memberName?: string;
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

export interface MemberSearchParams extends PaginationParams {
  keyword?: string;
  phone?: string;
  level?: MemberLevel;
  storeId?: string;
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

// ============ 促销类型 ============

export type PromotionType = 'discount' | 'fullreduce' | 'coupon' | 'points';

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  description: string;
  startTime: string;
  endTime: string;
  rules: PromotionRule[];
  status: 'active' | 'paused' | 'ended';
}

export interface PromotionRule {
  type: 'threshold' | 'percentage' | 'fixed';
  condition?: number;      // 满减条件
  discount: number;         // 折扣值
  maxDiscount?: number;     // 最大优惠
}

// ============ 优惠券类型 ============

export type CouponStatus = 'unused' | 'used' | 'expired';

export interface Coupon {
  id: string;
  name: string;
  type: 'fullreduce' | 'discount' | 'cash';
  value: number;            // 优惠金额或折扣
  minAmount?: number;       // 最低消费
  maxDiscount?: number;
  validDays: number;
  useChannels: ('miniapp' | 'offline' | 'web')[];
  status: CouponStatus;
  memberId: string;
  memberName: string;
  receivedAt: string;
  usedAt?: string;
  expiredAt: string;
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
}

// ============ 员工类型 ============

export type StaffRole = 'admin' | 'manager' | 'cashier';

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

// ============ 报表类型 ============

export interface SalesReport {
  date: string;
  orderCount: number;
  totalAmount: number;
  avgOrderAmount: number;
  topProducts: { productId: string; name: string; count: number; amount: number }[];
}

export interface InventoryReport {
  totalProducts: number;
  totalStock: number;
  lowStockProducts: { productId: string; name: string; stock: number }[];
  expiringProducts: { productId: string; name: string; expireDate: string }[];
}

// ============ 硬件设备类型 ============

export type DeviceType = 'printer' | 'scanner' | 'cashbox' | 'scale' | 'display';

export interface Device {
  id: string;
  type: DeviceType;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  config?: Record<string, any>;
}

export interface PrinterConfig {
  type: 'usb' | 'bluetooth' | 'network';
  address?: string;
  width?: number;  // 纸宽，58mm或80mm
}

export interface ScaleConfig {
  type: 'usb' | 'bluetooth';
  address?: string;
  unit?: 'g' | 'kg';
}
