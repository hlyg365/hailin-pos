/**
 * 离线数据存储模块
 * 使用 IndexedDB 存储商品、订单等数据，支持断网运行
 */

// 数据库配置
const DB_NAME = 'hailin_pos_offline';
const DB_VERSION = 1;

// 存储表名
const STORES = {
  PRODUCTS: 'products',
  ORDERS: 'orders',
  MEMBERS: 'members',
  SYNC_QUEUE: 'sync_queue',
  SETTINGS: 'settings',
};

// 商品类型
export interface OfflineProduct {
  id: number;
  barcode?: string;
  name: string;
  price: number;
  originalPrice?: number;
  icon: string;
  images?: string[];
  stock: number;
  unit: string;
  type: 'standard' | 'weighted' | 'counted';
  hasBarcode: boolean;
  isWeighted: boolean;
  isCounted: boolean;
  isHot?: boolean;
  isNew?: boolean;
  category: string;
  imageUrl?: string;
  originalProductId?: string;
  updatedAt: number;
}

// 订单类型
export interface OfflineOrder {
  id: string;
  orderNo: string;
  createdAt: number;
  items: any[];
  member?: any;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  status: 'pending' | 'synced' | 'failed';
  shopId: string;
  shopName?: string;
  staffId: string;
  staffName: string;
  syncAttempts: number;
  lastSyncAttempt?: number;
}

// 同步队列项
export interface SyncQueueItem {
  id: string;
  type: 'order' | 'stock' | 'member';
  action: 'create' | 'update' | 'delete';
  data: any;
  createdAt: number;
  attempts: number;
  lastAttempt?: number;
}

// 数据库实例缓存
let dbInstance: IDBDatabase | null = null;

/**
 * 打开数据库
 */
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('打开数据库失败:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建商品存储
      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        const productStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
        productStore.createIndex('barcode', 'barcode', { unique: false });
        productStore.createIndex('category', 'category', { unique: false });
        productStore.createIndex('name', 'name', { unique: false });
      }

      // 创建订单存储
      if (!db.objectStoreNames.contains(STORES.ORDERS)) {
        const orderStore = db.createObjectStore(STORES.ORDERS, { keyPath: 'id' });
        orderStore.createIndex('orderNo', 'orderNo', { unique: true });
        orderStore.createIndex('status', 'status', { unique: false });
        orderStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 创建会员存储
      if (!db.objectStoreNames.contains(STORES.MEMBERS)) {
        const memberStore = db.createObjectStore(STORES.MEMBERS, { keyPath: 'id' });
        memberStore.createIndex('phone', 'phone', { unique: false });
        memberStore.createIndex('memberNo', 'memberNo', { unique: false });
      }

      // 创建同步队列存储
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        syncStore.createIndex('type', 'type', { unique: false });
      }

      // 创建设置存储
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };
  });
}

/**
 * 通用数据操作
 */
async function getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

/**
 * 商品操作
 */
export const ProductsStore = {
  // 保存所有商品（批量）
  async saveAll(products: OfflineProduct[]): Promise<void> {
    const store = await getStore(STORES.PRODUCTS, 'readwrite');
    const timestamp = Date.now();
    
    for (const product of products) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put({ ...product, updatedAt: timestamp });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  },

  // 获取所有商品
  async getAll(): Promise<OfflineProduct[]> {
    const store = await getStore(STORES.PRODUCTS);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // 根据ID获取商品
  async getById(id: number): Promise<OfflineProduct | undefined> {
    const store = await getStore(STORES.PRODUCTS);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // 根据条码搜索
  async findByBarcode(barcode: string): Promise<OfflineProduct | undefined> {
    const store = await getStore(STORES.PRODUCTS);
    const index = store.index('barcode');
    return new Promise((resolve, reject) => {
      const request = index.get(barcode);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // 根据名称搜索
  async searchByName(name: string): Promise<OfflineProduct[]> {
    const store = await getStore(STORES.PRODUCTS);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const products = request.result.filter((p: OfflineProduct) => 
          p.name.toLowerCase().includes(name.toLowerCase())
        );
        resolve(products);
      };
      request.onerror = () => reject(request.error);
    });
  },

  // 清空商品
  async clear(): Promise<void> {
    const store = await getStore(STORES.PRODUCTS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // 获取商品数量
  async count(): Promise<number> {
    const store = await getStore(STORES.PRODUCTS);
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
};

/**
 * 订单操作
 */
export const OrdersStore = {
  // 保存订单
  async save(order: OfflineOrder): Promise<void> {
    const store = await getStore(STORES.ORDERS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(order);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // 获取所有待同步订单
  async getPendingOrders(): Promise<OfflineOrder[]> {
    const store = await getStore(STORES.ORDERS);
    const index = store.index('status');
    return new Promise((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // 获取所有订单
  async getAll(): Promise<OfflineOrder[]> {
    const store = await getStore(STORES.ORDERS);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // 更新订单状态
  async updateStatus(id: string, status: OfflineOrder['status']): Promise<void> {
    const store = await getStore(STORES.ORDERS, 'readwrite');
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const order = getRequest.result;
        if (order) {
          order.status = status;
          if (status === 'failed') {
            order.syncAttempts++;
            order.lastSyncAttempt = Date.now();
          }
          store.put(order);
        }
        resolve();
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  },

  // 删除订单
  async delete(id: string): Promise<void> {
    const store = await getStore(STORES.ORDERS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // 清空所有订单
  async clear(): Promise<void> {
    const store = await getStore(STORES.ORDERS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // 获取待同步订单数量
  async getPendingCount(): Promise<number> {
    const orders = await this.getPendingOrders();
    return orders.length;
  },
};

/**
 * 会员操作
 */
export const MembersStore = {
  // 保存会员
  async save(member: any): Promise<void> {
    const store = await getStore(STORES.MEMBERS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(member);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // 保存所有会员
  async saveAll(members: any[]): Promise<void> {
    const store = await getStore(STORES.MEMBERS, 'readwrite');
    for (const member of members) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(member);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  },

  // 获取所有会员
  async getAll(): Promise<any[]> {
    const store = await getStore(STORES.MEMBERS);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // 根据手机号搜索
  async findByPhone(phone: string): Promise<any | undefined> {
    const store = await getStore(STORES.MEMBERS);
    const index = store.index('phone');
    return new Promise((resolve, reject) => {
      const request = index.get(phone);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // 清空会员
  async clear(): Promise<void> {
    const store = await getStore(STORES.MEMBERS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};

/**
 * 同步队列操作
 */
export const SyncQueueStore = {
  // 添加到同步队列
  async add(item: SyncQueueItem): Promise<void> {
    const store = await getStore(STORES.SYNC_QUEUE, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // 获取所有待同步项
  async getAll(): Promise<SyncQueueItem[]> {
    const store = await getStore(STORES.SYNC_QUEUE);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // 删除同步项
  async delete(id: string): Promise<void> {
    const store = await getStore(STORES.SYNC_QUEUE, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // 清空队列
  async clear(): Promise<void> {
    const store = await getStore(STORES.SYNC_QUEUE, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};

/**
 * 设置操作
 */
export const SettingsStore = {
  // 保存设置
  async set(key: string, value: any): Promise<void> {
    const store = await getStore(STORES.SETTINGS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value, updatedAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // 获取设置
  async get(key: string): Promise<any | undefined> {
    const store = await getStore(STORES.SETTINGS);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  },

  // 获取最后同步时间
  async getLastSyncTime(): Promise<number | null> {
    const time = await this.get('lastSyncTime');
    return time || null;
  },

  // 设置最后同步时间
  async setLastSyncTime(time: number): Promise<void> {
    await this.set('lastSyncTime', time);
  },
};

/**
 * 清空所有数据
 */
export async function clearAllData(): Promise<void> {
  await Promise.all([
    ProductsStore.clear(),
    OrdersStore.clear(),
    MembersStore.clear(),
    SyncQueueStore.clear(),
  ]);
}

/**
 * 导出所有数据（用于调试或备份）
 */
export async function exportAllData(): Promise<{
  products: OfflineProduct[];
  orders: OfflineOrder[];
  members: any[];
  settings: any;
}> {
  const [products, orders, members] = await Promise.all([
    ProductsStore.getAll(),
    OrdersStore.getAll(),
    MembersStore.getAll(),
  ]);
  
  const lastSyncTime = await SettingsStore.getLastSyncTime();

  return {
    products,
    orders,
    members,
    settings: { lastSyncTime },
  };
}
