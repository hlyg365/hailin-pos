// ============================================
// 海邻到家 V6.0 - 全局状态管理
// ============================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Store, Employee, Product, Inventory, Order, Member
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
  checkInventory: (storeId: string, productId: string, requiredQty: number) => { available: boolean; currentQty: number };
  deductInventory: (storeId: string, productId: string, quantity: number) => boolean;
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
  checkInventory: (storeId, productId, requiredQty) => {
    const inv = get().inventories.get(`${storeId}-${productId}`);
    const currentQty = inv?.quantity ?? 0;
    return { available: currentQty >= requiredQty, currentQty };
  },
  deductInventory: (storeId, productId, quantity) => {
    const key = `${storeId}-${productId}`;
    const inv = get().inventories.get(key);
    if (!inv || inv.quantity < quantity) {
      return false; // 库存不足，严禁负库存
    }
    set((state) => {
      const newInventories = new Map(state.inventories);
      newInventories.set(key, { ...inv, quantity: inv.quantity - quantity });
      return { inventories: newInventories };
    });
    return true;
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
  deleteSuspendedOrder: (orderId: string) => void;
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
        suspendedOrders: [{ ...order, status: 'pending' as const }, ...state.suspendedOrders],
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
  deleteSuspendedOrder: (orderId) => set((state) => ({
    suspendedOrders: state.suspendedOrders.filter(o => o.id !== orderId),
  })),
}));

// ============ 财务状态 ============
interface FinanceState {
  todaySales: number;
  todayCash: number;
  todayOnline: number;
  todayOrders: number;
  depositPending: number;
  addSales: (amount: number, method: 'cash' | 'online') => void;
  resetDaily: () => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  todaySales: 21540,
  todayCash: 12580,
  todayOnline: 8960,
  todayOrders: 356,
  depositPending: 8500,
  addSales: (amount, method) => set((state) => ({
    todaySales: state.todaySales + amount,
    todayOrders: state.todayOrders + 1,
    todayCash: method === 'cash' ? state.todayCash + amount : state.todayCash,
    todayOnline: method === 'online' ? state.todayOnline + amount : state.todayOnline,
    depositPending: method === 'cash' ? state.depositPending + amount : state.depositPending,
  })),
  resetDaily: () => set({ todaySales: 0, todayCash: 0, todayOnline: 0, todayOrders: 0, depositPending: 0 }),
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
    // 离线订单同步到服务器（实际部署时调用后端API）
    console.log('Syncing orders to server:', pendingOrders);
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

// ============ 系统设置状态（持久化） ============
interface SystemSettings {
  // 基础设置
  storeName: string;
  storeCode: string;
  storeAddress: string;
  storePhone: string;
  storeManager: string;
  
  // 营业时间
  businessStartTime: string;
  businessEndTime: string;
  is24Hours: boolean;
  
  // 支付设置
  enableWechatPay: boolean;
  enableAlipay: boolean;
  enableUnionPay: boolean;
  enableCash: boolean;
  enableMemberCard: boolean;
  enableDigitalRMB: boolean;
  
  // 促销设置
  enableClearanceMode: boolean;
  clearanceDiscount: number;
  enableMemberDiscount: boolean;
  enablePointSystem: boolean;
  
  // 打印设置
  printerEnabled: boolean;
  printerName: string;
  autoPrintReceipt: boolean;
  
  // 系统设置
  voiceEnabled: boolean;
  darkMode: boolean;
  autoSync: boolean;
  offlineMode: boolean;
}

interface SettingsState {
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: SystemSettings = {
  storeName: '望京店',
  storeCode: 'WJ001',
  storeAddress: '北京市朝阳区望京街道',
  storePhone: '010-12345678',
  storeManager: '张三',
  businessStartTime: '08:00',
  businessEndTime: '23:00',
  is24Hours: false,
  enableWechatPay: true,
  enableAlipay: true,
  enableUnionPay: true,
  enableCash: true,
  enableMemberCard: true,
  enableDigitalRMB: true,
  enableClearanceMode: true,
  clearanceDiscount: 0.8,
  enableMemberDiscount: true,
  enablePointSystem: true,
  printerEnabled: true,
  printerName: '58mm热敏打印机',
  autoPrintReceipt: true,
  voiceEnabled: true,
  darkMode: false,
  autoSync: true,
  offlineMode: true,
};

// ============ 小程序设置状态（持久化） ============
interface MiniProgramSettings {
  name: string;
  description: string;
  servicePhone: string;
  businessHours: string;
  banners: Array<{
    id: string;
    title: string;
    subtitle: string;
    link: string;
    color: string;
    enabled: boolean;
  }>;
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    enabled: boolean;
  }>;
}

interface MiniProgramState {
  settings: MiniProgramSettings;
  updateSettings: (updates: Partial<MiniProgramSettings>) => void;
  updateBanner: (id: string, updates: Partial<MiniProgramSettings['banners'][0]>) => void;
  resetSettings: () => void;
}

const defaultMiniProgramSettings: MiniProgramSettings = {
  name: '海邻到家便利店',
  description: '24小时便利店，便利生活每一天',
  servicePhone: '400-888-6666',
  businessHours: '24小时营业',
  banners: [
    { id: '1', title: '海邻到家便利店', subtitle: '便利生活每一天', link: '/mini', color: 'from-red-400 to-orange-500', enabled: true },
    { id: '2', title: '新人专属福利', subtitle: '首单满39减5元', link: '/mini/promo', color: 'from-purple-400 to-pink-500', enabled: true },
    { id: '3', title: '限时秒杀', subtitle: '每日10点准时开抢', link: '/mini/flashsale', color: 'from-yellow-400 to-red-500', enabled: true },
  ],
  categories: [
    { id: '1', name: '饮料', icon: '🥤', enabled: true },
    { id: '2', name: '零食', icon: '🍪', enabled: true },
    { id: '3', name: '生鲜', icon: '🥬', enabled: true },
    { id: '4', name: '日用品', icon: '🧴', enabled: true },
    { id: '5', name: '烘焙', icon: '🍞', enabled: true },
    { id: '6', name: '奶制品', icon: '🥛', enabled: true },
  ],
};

export const useMiniProgramStore = create<MiniProgramState>()(
  persist(
    (set) => ({
      settings: defaultMiniProgramSettings,
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),
      updateBanner: (id, updates) => set((state) => ({
        settings: {
          ...state.settings,
          banners: state.settings.banners.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        },
      })),
      resetSettings: () => set({ settings: defaultMiniProgramSettings }),
    }),
    {
      name: 'hailin-miniprogram',
    }
  )
);

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'hailin-settings',
    }
  )
);

// ============ AI条码识别配置（总部后台配置，收银台调用） ============
interface AiBarcodeConfig {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  appCode: string;
  appSecret: string;
  method: 'POST' | 'GET';
  timeout: number;
  requestTemplate: string;
  responseMapping: {
    name: string;
    category: string;
    price: string;
    costPrice: string;
  };
  lastTestResult: {
    success: boolean;
    message: string;
    timestamp: string;
  } | null;
}

interface AiConfigState {
  configs: AiBarcodeConfig[];
  addConfig: (config: AiBarcodeConfig) => void;
  updateConfig: (index: number, updates: Partial<AiBarcodeConfig>) => void;
  deleteConfig: (index: number) => void;
  setLastTestResult: (index: number, result: AiBarcodeConfig['lastTestResult']) => void;
  // AI条码识别 - 返回商品信息
  aiScanByBarcode: (barcode: string) => Promise<{
    success: boolean;
    name?: string;
    category?: string;
    retailPrice?: number;
    costPrice?: number;
    message?: string;
  }>;
}

// AI条码识别函数
const aiScanByBarcode = async (barcode: string, configs: AiBarcodeConfig[]): Promise<{
  success: boolean;
  name?: string;
  category?: string;
  retailPrice?: number;
  costPrice?: number;
  message?: string;
}> => {
  // 找到已启用的配置
  const enabledConfig = configs.find(c => c.enabled);
  if (!enabledConfig) {
    return { success: false, message: '请先配置并启用AI识别接口' };
  }
  
  // 检查是否配置了必要的认证信息
  if (!enabledConfig.apiUrl) {
    return { success: false, message: '请先配置API接口地址' };
  }
  
  if (!enabledConfig.apiKey && !enabledConfig.appCode) {
    return { success: false, message: '请先配置API Key或AppCode' };
  }

  try {
    // 构建请求体
    let requestBody: Record<string, any> = {};
    try {
      const template = enabledConfig.requestTemplate
        .replace(/\${barcode}/g, barcode)
        .replace(/\${store_id}/g, 'STORE001')
        .replace(/\${timestamp}/g, Date.now().toString());
      requestBody = JSON.parse(template);
    } catch {
      requestBody = { barcode };
    }

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (enabledConfig.apiKey) {
      headers['Authorization'] = `Bearer ${enabledConfig.apiKey}`;
    }
    if (enabledConfig.appCode) {
      headers['X-App-Code'] = enabledConfig.appCode;
    }
    if (enabledConfig.appSecret) {
      headers['X-App-Secret'] = enabledConfig.appSecret;
    }

    // 调用API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), enabledConfig.timeout * 1000);

    const response = await fetch(enabledConfig.apiUrl, {
      method: enabledConfig.method,
      headers,
      body: enabledConfig.method === 'POST' ? JSON.stringify(requestBody) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, message: `API请求失败: ${response.status}` };
    }

    const data = await response.json();
    
    // 根据字段映射提取数据
    const getNestedValue = (obj: any, path: string): any => {
      return path.split('.').reduce((acc, part) => acc?.[part], obj);
    };

    const name = getNestedValue(data, enabledConfig.responseMapping.name) || `商品(${barcode})`;
    const category = getNestedValue(data, enabledConfig.responseMapping.category) || '食品';
    const retailPrice = parseFloat(getNestedValue(data, enabledConfig.responseMapping.price)) || 0;
    const costPrice = parseFloat(getNestedValue(data, enabledConfig.responseMapping.costPrice)) || 0;

    return {
      success: true,
      name,
      category,
      retailPrice,
      costPrice,
      message: '识别成功',
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, message: '请求超时，请检查网络或调整超时时间' };
    }
    return { success: false, message: `识别失败: ${error.message}` };
  }
};

const defaultAiConfig: AiBarcodeConfig = {
  enabled: true,
  apiUrl: 'https://api.hailin.com/ai/barcode',
  apiKey: '',
  appCode: '',
  appSecret: '',
  method: 'POST',
  timeout: 3,
  requestTemplate: '{"barcode": "${barcode}", "store_id": "${store_id}"}',
  responseMapping: {
    name: 'name',
    category: 'category',
    price: 'price',
    costPrice: 'cost_price',
  },
  lastTestResult: null,
};

export const useAiConfigStore = create<AiConfigState>()(
  persist(
    (set, get) => ({
      configs: [defaultAiConfig],
      addConfig: (config) => set((state) => ({ configs: [...state.configs, config] })),
      updateConfig: (index, updates) => set((state) => ({
        configs: state.configs.map((c, i) => i === index ? { ...c, ...updates } : c),
      })),
      deleteConfig: (index) => set((state) => ({
        configs: state.configs.filter((_, i) => i !== index),
      })),
      setLastTestResult: (index, result) => set((state) => ({
        configs: state.configs.map((c, i) => i === index ? { ...c, lastTestResult: result } : c),
      })),
      // AI条码识别
      aiScanByBarcode: async (barcode: string) => {
        const configs = get().configs;
        return aiScanByBarcode(barcode, configs);
      },
    }),
    {
      name: 'hailin-ai-config',
    }
  )
);
