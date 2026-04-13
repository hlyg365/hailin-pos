// 收银台离线数据存储服务
// 使用 localStorage + IndexedDB 实现离线支持

export interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  cost: number;        // 进货价
  stock: number;       // 库存
  minStock: number;    // 最低库存
  category: string;
  unit: string;        // 单位
  supplier?: string;  // 供应商
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CartItem {
  id: string;
  productId: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNo: string;
  items: CartItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: 'wechat' | 'alipay' | 'cash' | 'card';
  memberId?: string;
  memberName?: string;
  staffId: string;
  staffName: string;
  storeId: string;
  storeName: string;
  createdAt: number;
  status: 'pending' | 'completed' | 'refunded';
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface StockRecord {
  id: string;
  productId: string;
  productName: string;
  type: 'purchase' | 'sale' | 'adjust' | 'loss';
  quantity: number;      // 正数入库，负数出库
  beforeStock: number;
  afterStock: number;
  reason?: string;
  createdAt: number;
  syncStatus: 'pending' | 'synced';
}

class OfflineStore {
  private prefix = 'pos_';

  // 初始化默认商品
  async initDefaultProducts(): Promise<void> {
    const existing = localStorage.getItem(this.prefix + 'products');
    if (existing) return;

    const defaultProducts: Product[] = [
      // 饮料类
      { id: '1', barcode: '6901234567890', name: '农夫山泉 550ml', price: 2.00, cost: 1.20, stock: 100, minStock: 20, category: '饮料', unit: '瓶', createdAt: Date.now(), updatedAt: Date.now() },
      { id: '2', barcode: '6901234567891', name: '可口可乐 330ml', price: 3.00, cost: 1.80, stock: 80, minStock: 15, category: '饮料', unit: '罐', createdAt: Date.now(), updatedAt: Date.now() },
      { id: '3', barcode: '6901234567892', name: '统一冰红茶', price: 3.00, cost: 1.80, stock: 70, minStock: 15, category: '饮料', unit: '瓶', createdAt: Date.now(), updatedAt: Date.now() },
      { id: '4', barcode: '6901234567893', name: '康师傅冰红茶', price: 3.50, cost: 2.00, stock: 55, minStock: 15, category: '饮料', unit: '瓶', createdAt: Date.now(), updatedAt: Date.now() },
      { id: '5', barcode: '6901234567894', name: '娃哈哈纯净水', price: 1.50, cost: 0.80, stock: 120, minStock: 30, category: '饮料', unit: '瓶', createdAt: Date.now(), updatedAt: Date.now() },
      { id: '6', barcode: '6901234567895', name: '蒙牛纯牛奶 250ml', price: 3.50, cost: 2.20, stock: 60, minStock: 20, category: '乳品', unit: '盒', createdAt: Date.now(), updatedAt: Date.now() },
      { id: '7', barcode: '6901234567896', name: '伊利酸奶', price: 4.00, cost: 2.50, stock: 35, minStock: 10, category: '乳品', unit: '杯', createdAt: Date.now(), updatedAt: Date.now() },
      // 方便食品
      { id: '8', barcode: '6901234567897', name: '康师傅红烧牛肉面', price: 4.50, cost: 2.80, stock: 50, minStock: 15, category: '方便食品', unit: '袋', createdAt: Date.now(), updatedAt: Date.now() },
      { id: '9', barcode: '6901234567898', name: '统一老坛酸菜面', price: 4.00, cost: 2.50, stock: 40, minStock: 10, category: '方便食品', unit: '袋', createdAt: Date.now(), updatedAt: Date.now() },
      // 零食
      { id: '10', barcode: '6901234567899', name: '奥利奥夹心饼干', price: 8.50, cost: 5.50, stock: 30, minStock: 10, category: '零食', unit: '盒', createdAt: Date.now(), updatedAt: Date.now() },
      { id: '11', barcode: '6901234567900', name: '旺旺雪饼', price: 5.00, cost: 3.00, stock: 45, minStock: 10, category: '零食', unit: '袋', createdAt: Date.now(), updatedAt: Date.now() },
      { id: '12', barcode: '6901234567901', name: '德芙巧克力 52g', price: 12.00, cost: 7.50, stock: 25, minStock: 5, category: '零食', unit: '块', createdAt: Date.now(), updatedAt: Date.now() },
      // 肉类
      { id: '13', barcode: '6901234567902', name: '双汇王中王火腿肠', price: 6.00, cost: 3.80, stock: 40, minStock: 10, category: '肉类', unit: '根', createdAt: Date.now(), updatedAt: Date.now() },
      { id: '14', barcode: '6901234567903', name: '雨润火腿肠', price: 5.00, cost: 3.00, stock: 35, minStock: 10, category: '肉类', unit: '根', createdAt: Date.now(), updatedAt: Date.now() },
      // 日用品
      { id: '15', barcode: '6901234567904', name: '清风抽纸 3层', price: 5.00, cost: 3.20, stock: 50, minStock: 15, category: '日用品', unit: '包', createdAt: Date.now(), updatedAt: Date.now() },
      { id: '16', barcode: '6901234567905', name: '雕牌洗衣皂', price: 4.50, cost: 2.80, stock: 40, minStock: 10, category: '日用品', unit: '块', createdAt: Date.now(), updatedAt: Date.now() },
    ];

    await this.saveProducts(defaultProducts);
  }

  // 商品操作
  async saveProducts(products: Product[]): Promise<void> {
    localStorage.setItem(this.prefix + 'products', JSON.stringify(products));
  }

  async getProducts(): Promise<Product[]> {
    const data = localStorage.getItem(this.prefix + 'products');
    return data ? JSON.parse(data) : [];
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find(p => p.barcode === barcode) || null;
  }

  async addProduct(product: Product): Promise<void> {
    const products = await this.getProducts();
    products.push(product);
    await this.saveProducts(products);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates, updatedAt: Date.now() };
      await this.saveProducts(products);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const products = await this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    await this.saveProducts(filtered);
  }

  // 库存操作
  async updateStock(productId: string, quantity: number, type: 'purchase' | 'sale' | 'adjust' | 'loss', reason?: string): Promise<void> {
    const products = await this.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const beforeStock = product.stock;
    let afterStock: number;

    switch (type) {
      case 'purchase':
        afterStock = beforeStock + quantity;
        break;
      case 'sale':
        afterStock = beforeStock - quantity;
        break;
      case 'adjust':
      case 'loss':
        afterStock = quantity;
        break;
      default:
        afterStock = beforeStock;
    }

    // 更新库存
    product.stock = Math.max(0, afterStock);
    product.updatedAt = Date.now();
    await this.saveProducts(products);

    // 记录库存变动
    const record: StockRecord = {
      id: 'sr_' + Date.now(),
      productId,
      productName: product.name,
      type,
      quantity: type === 'purchase' ? quantity : type === 'sale' ? -quantity : quantity - beforeStock,
      beforeStock,
      afterStock,
      reason,
      createdAt: Date.now(),
      syncStatus: 'pending'
    };
    await this.addStockRecord(record);
  }

  // 库存记录
  async addStockRecord(record: StockRecord): Promise<void> {
    const records = await this.getStockRecords();
    records.unshift(record);
    // 只保留最近100条
    const trimmed = records.slice(0, 100);
    localStorage.setItem(this.prefix + 'stock_records', JSON.stringify(trimmed));
  }

  async getStockRecords(): Promise<StockRecord[]> {
    const data = localStorage.getItem(this.prefix + 'stock_records');
    return data ? JSON.parse(data) : [];
  }

  // 订单操作
  async saveOrder(order: Order): Promise<void> {
    const orders = await this.getOrders();
    orders.unshift(order);
    localStorage.setItem(this.prefix + 'orders', JSON.stringify(orders));
  }

  async getOrders(): Promise<Order[]> {
    const data = localStorage.getItem(this.prefix + 'orders');
    return data ? JSON.parse(data) : [];
  }

  async getPendingOrders(): Promise<Order[]> {
    const orders = await this.getOrders();
    return orders.filter(o => o.syncStatus === 'pending');
  }

  // 获取今日销售数据
  async getTodaySales(): Promise<{ orders: Order[]; totalAmount: number; orderCount: number }> {
    const orders = await this.getOrders();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const todayOrders = orders.filter(o => o.createdAt >= todayStart && o.status === 'completed');
    const totalAmount = todayOrders.reduce((sum, o) => sum + o.finalAmount, 0);

    return {
      orders: todayOrders,
      totalAmount,
      orderCount: todayOrders.length
    };
  }

  // 同步订单到服务器
  async syncOrders(): Promise<{ success: number; failed: number }> {
    const pendingOrders = await this.getPendingOrders();
    let success = 0;
    let failed = 0;

    for (const order of pendingOrders) {
      try {
        // TODO: 调用真实API
        // const response = await fetch('/api/orders', { method: 'POST', body: JSON.stringify(order) });
        // if (response.ok) {
        //   order.syncStatus = 'synced';
        //   success++;
        // } else {
        //   failed++;
        // }
        
        // 模拟同步成功
        order.syncStatus = 'synced';
        success++;
      } catch {
        failed++;
      }
    }

    // 保存更新后的订单
    const allOrders = await this.getOrders();
    const updatedOrders = allOrders.map(o => {
      const pending = pendingOrders.find(p => p.id === o.id);
      return pending || o;
    });
    localStorage.setItem(this.prefix + 'orders', JSON.stringify(updatedOrders));

    return { success, failed };
  }
}

export const posStore = new OfflineStore();
