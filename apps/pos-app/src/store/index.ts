// ============================================
// 海邻到家 V6.0 - 全局状态管理
// ============================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Store, Employee, Product, Inventory, Order, Member,
  MEMBER_BENEFITS, CLEARANCE_HOUR_START, CLEARANCE_HOUR_END, CLEARANCE_DISCOUNT
} from '../types';

// ============ 门店状态 ============
interface StoreState {
  currentStore: Store | null;
  stores: Store[];
  setCurrentStore: (store: Store) => void;
  setStores: (stores: Store[]) => void;
}

export const useStoreStore = create<StoreState>((set) => ({
  currentStore: {
    id: 'store001',
    name: '望京店',
    code: 'WJ001',
    address: '北京市朝阳区望京街道',
    phone: '010-12345678',
    status: 'active',
    region: '北京朝阳',
    managerId: 'emp001',
    createdAt: new Date().toISOString(),
  },
  stores: [
    { id: 'store001', name: '望京店', code: 'WJ001', address: '北京市朝阳区望京街道', phone: '010-12345678', status: 'active', region: '北京朝阳', managerId: 'emp001', createdAt: new Date().toISOString() },
    { id: 'store002', name: '国贸店', code: 'GJ001', address: '北京市朝阳区国贸CBD', phone: '010-23456789', status: 'active', region: '北京朝阳', managerId: 'emp002', createdAt: new Date().toISOString() },
    { id: 'store003', name: '中关村店', code: 'ZGC001', address: '北京市海淀区中关村', phone: '010-34567890', status: 'active', region: '北京海淀', managerId: 'emp003', createdAt: new Date().toISOString() },
  ],
  setCurrentStore: (store) => set({ currentStore: store }),
  setStores: (stores) => set({ stores }),
}));

// ============ 员工状态 ============
interface EmployeeState {
  currentEmployee: Employee | null;
  isAuthenticated: boolean;
  login: (employee: Employee) => void;
  logout: () => void;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  currentEmployee: {
    id: 'emp001',
    name: '张三',
    phone: '13800138000',
    role: 'cashier',
    storeId: 'store001',
    status: 'active',
    hiredAt: new Date().toISOString(),
  },
  isAuthenticated: true,
  login: (employee) => set({ currentEmployee: employee, isAuthenticated: true }),
  logout: () => set({ currentEmployee: null, isAuthenticated: false }),
}));

// ============ 商品状态 ============
interface ProductState {
  products: Product[];
  inventories: Map<string, Inventory>;
  setProducts: (products: Product[]) => void;
  updateInventory: (storeId: string, productId: string, quantity: number) => void;
  getInventory: (storeId: string, productId: string) => Inventory | undefined;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [
    { id: 'p001', barcode: '6921166466888', name: '农夫山泉550ml', category: '饮料', unit: '瓶', costPrice: 1.5, retailPrice: 2, wholesalePrice: 1.8, isStandard: true, status: 'active' },
    { id: 'p002', barcode: '6921234567890', name: '可口可乐330ml', category: '饮料', unit: '罐', costPrice: 2.2, retailPrice: 3, wholesalePrice: 2.5, isStandard: true, status: 'active' },
    { id: 'p003', barcode: '6922345678901', name: '康师傅方便面', category: '食品', unit: '袋', costPrice: 3.5, retailPrice: 4.5, wholesalePrice: 4, isStandard: true, status: 'active' },
    { id: 'p004', barcode: '6923456789012', name: '双汇火腿肠', category: '食品', unit: '根', costPrice: 3.8, retailPrice: 5, wholesalePrice: 4.2, isStandard: true, status: 'active' },
    { id: 'p005', barcode: '6924567890123', name: '绿箭口香糖', category: '零食', unit: '条', costPrice: 4.5, retailPrice: 6, wholesalePrice: 5, isStandard: true, status: 'active' },
    { id: 'p006', barcode: '6925678901234', name: '奥利奥饼干', category: '零食', unit: '盒', costPrice: 6.5, retailPrice: 8.5, wholesalePrice: 7.5, isStandard: true, status: 'active' },
    { id: 'p007', barcode: '6926789012345', name: '伊利纯牛奶', category: '奶制品', unit: '盒', costPrice: 9, retailPrice: 12, wholesalePrice: 10, isStandard: true, status: 'active' },
    { id: 'p008', barcode: '6927890123456', name: '蒙牛酸奶', category: '奶制品', unit: '杯', costPrice: 5, retailPrice: 6.5, wholesalePrice: 5.5, isStandard: true, status: 'active' },
    { id: 'p009', barcode: '', name: '红富士苹果', category: '生鲜', unit: 'kg', costPrice: 6, retailPrice: 9.9, wholesalePrice: 7.5, isStandard: false, status: 'active' },
    { id: 'p010', barcode: '', name: '散装面包', category: '烘焙', unit: 'kg', costPrice: 15, retailPrice: 25, wholesalePrice: 18, isStandard: false, status: 'active' },
  ],
  inventories: new Map([
    ['store001-p001', { id: 'inv001', storeId: 'store001', productId: 'p001', quantity: 120, warningThreshold: 50, lastRestockAt: new Date().toISOString(), status: 'normal' }],
    ['store001-p002', { id: 'inv002', storeId: 'store001', productId: 'p002', quantity: 85, warningThreshold: 50, lastRestockAt: new Date().toISOString(), status: 'normal' }],
    ['store001-p003', { id: 'inv003', storeId: 'store001', productId: 'p003', quantity: 200, warningThreshold: 100, lastRestockAt: new Date().toISOString(), status: 'normal' }],
    ['store001-p009', { id: 'inv009', storeId: 'store001', productId: 'p009', quantity: 15, warningThreshold: 30, lastRestockAt: new Date().toISOString(), status: 'low' }],
    ['store001-p010', { id: 'inv010', storeId: 'store001', productId: 'p010', quantity: 5, warningThreshold: 20, lastRestockAt: new Date().toISOString(), status: 'critical' }],
  ]),
  setProducts: (products) => set({ products }),
  updateInventory: (storeId, productId, quantity) => set((state) => {
    const key = `${storeId}-${productId}`;
    const newInventories = new Map(state.inventories);
    const existing = newInventories.get(key);
    if (existing) {
      newInventories.set(key, { ...existing, quantity: existing.quantity + quantity });
    }
    return { inventories: newInventories };
  }),
  getInventory: (storeId, productId) => {
    return get().inventories.get(`${storeId}-${productId}`);
  },
}));

// ============ 购物车状态 ============
interface CartItem {
  product: Product;
  quantity: number;
  actualPrice: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getTotal: () => { subtotal: number; discount: number; total: number; };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (product, quantity = 1) => set((state) => {
    const existing = state.items.find(item => item.product.id === product.id);
    if (existing) {
      return {
        items: state.items.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
      };
    }
    return { items: [...state.items, { product, quantity, actualPrice: product.retailPrice }] };
  }),
  updateQuantity: (productId, quantity) => set((state) => ({
    items: quantity > 0
      ? state.items.map(item => item.product.id === productId ? { ...item, quantity } : item)
      : state.items.filter(item => item.product.id !== productId),
  })),
  removeItem: (productId) => set((state) => ({
    items: state.items.filter(item => item.product.id !== productId),
  })),
  clearCart: () => set({ items: [] }),
  getTotal: () => {
    const { items } = get();
    const subtotal = items.reduce((sum, item) => sum + item.product.retailPrice * item.quantity, 0);
    const discount = 0;
    const total = subtotal - discount;
    return { subtotal, discount, total };
  },
}));

// ============ 会员状态 ============
interface MemberState {
  currentMember: Member | null;
  members: Member[];
  scanMember: (code: string) => Member | null;
  addPoints: (memberId: string, points: number) => void;
}

export const useMemberStore = create<MemberState>((set, get) => ({
  currentMember: null,
  members: [
    { id: 'm001', phone: '13800138000', name: '李明', level: 'gold', points: 5680, balance: 120.50, totalConsume: 6500, tags: ['高频', '爱喝饮料'], createdAt: new Date().toISOString() },
    { id: 'm002', phone: '13900139000', name: '王芳', level: 'silver', points: 1200, balance: 50, totalConsume: 1500, tags: ['零食爱好者'], createdAt: new Date().toISOString() },
    { id: 'm003', phone: '13700137000', name: '张伟', level: 'diamond', points: 25000, balance: 500, totalConsume: 35000, tags: ['高频', 'VIP'], createdAt: new Date().toISOString() },
  ],
  scanMember: (code) => {
    const member = get().members.find(m => m.phone === code || m.id === code);
    if (member) {
      set({ currentMember: member });
    }
    return member || null;
  },
  addPoints: (memberId, points) => set((state) => ({
    members: state.members.map(m =>
      m.id === memberId ? { ...m, points: m.points + points } : m
    ),
    currentMember: state.currentMember?.id === memberId
      ? { ...state.currentMember, points: state.currentMember.points + points }
      : state.currentMember,
  })),
}));

// ============ 订单状态 ============
interface OrderState {
  orders: Order[];
  suspendedOrders: Order[];
  createOrder: (order: Order) => void;
  suspendOrder: (orderId: string) => void;
  resumeOrder: (orderId: string) => Order | null;
  cancelOrder: (orderId: string) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  suspendedOrders: [],
  createOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  suspendOrder: (orderId) => set((state) => {
    const order = state.orders.find(o => o.id === orderId);
    if (order) {
      return {
        orders: state.orders.filter(o => o.id !== orderId),
        suspendedOrders: [...state.suspendedOrders, order],
      };
    }
    return state;
  }),
  resumeOrder: (orderId) => {
    const { orders, suspendedOrders } = get();
    const order = suspendedOrders.find(o => o.id === orderId);
    if (order) {
      set({
        orders: [order, ...orders],
        suspendedOrders: suspendedOrders.filter(o => o.id !== orderId),
      });
    }
    return order || null;
  },
  cancelOrder: (orderId) => set((state) => ({
    orders: state.orders.filter(o => o.id !== orderId),
  })),
}));

// ============ 财务状态 ============
interface FinanceState {
  todayCash: number;
  todayOnline: number;
  todayOrders: number;
  depositPending: number;
  addSales: (amount: number, method: 'cash' | 'online') => void;
  resetDaily: () => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  todayCash: 12580,
  todayOnline: 8960,
  todayOrders: 356,
  depositPending: 8500,
  addSales: (amount, method) => set((state) => ({
    todayOrders: state.todayOrders + 1,
    todayCash: method === 'cash' ? state.todayCash + amount : state.todayCash,
    todayOnline: method === 'online' ? state.todayOnline + amount : state.todayOnline,
    depositPending: method === 'cash' ? state.depositPending + amount : state.depositPending,
  })),
  resetDaily: () => set({ todayCash: 0, todayOnline: 0, todayOrders: 0, depositPending: 0 }),
}));

// ============ 离线状态 ============
interface OfflineState {
  isOnline: boolean;
  pendingOrders: Order[];
  addPendingOrder: (order: Order) => void;
  syncOrders: () => Promise<void>;
  setOnline: (status: boolean) => void;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: navigator.onLine,
  pendingOrders: [],
  addPendingOrder: (order) => set((state) => ({
    pendingOrders: [...state.pendingOrders, order],
  })),
  syncOrders: async () => {
    const { pendingOrders } = get();
    // 模拟同步
    console.log('Syncing orders:', pendingOrders);
    set({ pendingOrders: [] });
  },
  setOnline: (status) => set({ isOnline: status }),
}));

// ============ 要货申请状态 ============
interface RestockState {
  requests: any[];
  createRequest: (request: any) => void;
  approveRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
}

export const useRestockStore = create<RestockState>((set) => ({
  requests: [
    { id: 'req001', storeId: 'store001', items: [{ productId: 'p009', quantity: 50 }], totalAmount: 450, status: 'pending', requestedBy: 'emp001', requestedAt: new Date().toISOString() },
    { id: 'req002', storeId: 'store002', items: [{ productId: 'p001', quantity: 100 }], totalAmount: 150, status: 'approved', requestedBy: 'emp002', requestedAt: new Date().toISOString() },
  ],
  createRequest: (request) => set((state) => ({ requests: [...state.requests, request] })),
  approveRequest: (id) => set((state) => ({
    requests: state.requests.map(r => r.id === id ? { ...r, status: 'shipped' } : r),
  })),
  rejectRequest: (id) => set((state) => ({
    requests: state.requests.map(r => r.id === id ? { ...r, status: 'rejected' } : r),
  })),
}));

// ============ 库存预警状态 ============
interface AlertState {
  lowStockAlerts: Array<{ productId: string; productName: string; current: number; threshold: number }>;
  overdueAlerts: Array<{ productId: string; productName: string; daysLeft: number }>;
  restockRequests: any[];
}

export const useAlertStore = create<AlertState>((set) => ({
  lowStockAlerts: [
    { productId: 'p009', productName: '红富士苹果', current: 15, threshold: 30 },
    { productId: 'p010', productName: '散装面包', current: 5, threshold: 20 },
  ],
  overdueAlerts: [
    { productId: 'p004', productName: '双汇火腿肠', daysLeft: 3 },
  ],
  restockRequests: [],
}));
