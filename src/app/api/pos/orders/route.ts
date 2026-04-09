import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 本地订单数据API
 * 用于获取收银台本地保存的订单数据
 * GET /api/pos/orders
 */

// 获取订单列表（支持筛选）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all'; // all, pending, synced, failed
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // 在实际环境中，这里应该从数据库读取
    // 但在PWA环境中，我们需要从客户端获取数据
    // 这里返回模拟数据供演示使用
    
    const mockOrders = generateMockOrders(50);
    
    // 根据类型筛选
    let filteredOrders = mockOrders;
    if (type === 'pending') {
      filteredOrders = mockOrders.filter(o => o.syncStatus === 'pending');
    } else if (type === 'synced') {
      filteredOrders = mockOrders.filter(o => o.syncStatus === 'synced');
    } else if (type === 'failed') {
      filteredOrders = mockOrders.filter(o => o.syncStatus === 'failed');
    }
    
    // 分页
    const paginatedOrders = filteredOrders.slice(offset, offset + limit);
    
    return NextResponse.json({
      success: true,
      data: {
        orders: paginatedOrders,
        total: filteredOrders.length,
        offset,
        limit,
      },
    });
  } catch (error) {
    console.error('[POS Orders API] Error:', error);
    return NextResponse.json({
      success: false,
      error: `获取订单失败: ${error}`,
    }, { status: 500 });
  }
}

// 生成模拟订单数据（用于演示）
function generateMockOrders(count: number) {
  const orders = [];
  const now = new Date();
  const paymentMethods = ['现金', '微信支付', '支付宝', '银行卡', '会员余额'];
  const cashiers = ['张三', '李四', '王五', '赵六'];
  
  for (let i = 0; i < count; i++) {
    const createdAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const items = generateMockItems(Math.floor(Math.random() * 5) + 1);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = Math.random() > 0.7 ? Math.floor(subtotal * 0.1) : 0;
    const total = subtotal - discount;
    
    orders.push({
      id: `order-${Date.now()}-${i}`,
      orderNo: `D${Date.now().toString().slice(-10)}${String(i).padStart(4, '0')}`,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      status: 'completed',
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      cashier: cashiers[Math.floor(Math.random() * cashiers.length)],
      items,
      subtotal,
      discount,
      total,
      profit: total * (0.15 + Math.random() * 0.1), // 模拟毛利
      syncStatus: Math.random() > 0.2 ? 'synced' : 'pending',
      memberInfo: Math.random() > 0.6 ? {
        name: '会员' + (i % 100),
        memberNo: `M${String(i % 100).padStart(6, '0')}`,
        points: Math.floor(total),
      } : null,
    });
  }
  
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// 生成模拟订单项
function generateMockItems(count: number) {
  const products = [
    { name: '农夫山泉550ml', price: 2, unit: '瓶' },
    { name: '康师傅方便面', price: 4.5, unit: '包' },
    { name: '可口可乐330ml', price: 3, unit: '罐' },
    { name: '奥利奥饼干', price: 8.5, unit: '盒' },
    { name: '伊利纯牛奶', price: 6, unit: '盒' },
    { name: '双汇火腿肠', price: 5, unit: '根' },
    { name: '蒙牛酸奶', price: 5.5, unit: '杯' },
    { name: '旺旺雪饼', price: 4, unit: '袋' },
    { name: '薯片', price: 6.5, unit: '袋' },
    { name: '口香糖', price: 7, unit: '瓶' },
  ];
  
  const items = [];
  for (let i = 0; i < count; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    items.push({
      id: `item-${Date.now()}-${i}`,
      productId: `prod-${i}`,
      name: product.name,
      barcode: `69${Math.floor(Math.random() * 10000000000)}`,
      price: product.price,
      quantity: Math.floor(Math.random() * 3) + 1,
      unit: product.unit,
      subtotal: product.price * (Math.floor(Math.random() * 3) + 1),
    });
  }
  
  return items;
}
