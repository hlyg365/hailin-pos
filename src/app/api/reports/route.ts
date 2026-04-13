import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

// 获取日期范围
function getDateRange(range: string): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      return { start: today, end: now };
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: today };
    }
    case 'week': {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // 本周开始（周日）
      return { start: weekStart, end: now };
    }
    case 'month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: monthStart, end: now };
    }
    default:
      return { start: today, end: now };
  }
}

// 格式化为ISO日期字符串
function formatISODate(date: Date): string {
  return date.toISOString();
}

// 格式化为日期字符串 (YYYY-MM-DD)
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 获取Supabase客户端
function tryGetSupabaseClient() {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
}

// 生成空统计数据
function getEmptyStats() {
  return {
    orders: 0,
    salesAmount: 0,
    profit: 0,
    profitRate: '0.00%',
    netSales: 0,
    netProfit: 0,
    netProfitRate: '0.00%',
    avgOrderValue: 0,
    refunds: 0,
    hourlyData: Array.from({ length: 24 }, (_, i) => ({ hour: i, amount: 0 })),
  };
}

// 生成空收入数据
function getEmptyIncomeData() {
  return {
    netSales: 0,
    refunds: 0,
    yesterdayPayment: 0,
    cashInDrawer: 0,
    payments: [
      { method: '微信支付', amount: 0, percent: 0, orders: 0, color: '#07c160' },
      { method: '支付宝', amount: 0, percent: 0, orders: 0, color: '#1677ff' },
      { method: '现金支付', amount: 0, percent: 0, orders: 0, color: '#f97316' },
      { method: '聚合支付', amount: 0, percent: 0, orders: 0, color: '#ef4444' },
      { method: '会员余额支付', amount: 0, percent: 0, orders: 0, color: '#3b82f6' },
    ],
    refundsData: [
      { method: '微信退款', amount: 0, percent: 0, orders: 0, color: '#07c160' },
      { method: '现金退款', amount: 0, percent: 0, orders: 0, color: '#f97316' },
    ],
    rechargeData: [
      { method: '会员充值', amount: 0, percent: 0, orders: 0, color: '#22c55e' },
    ],
    subsidyData: [
      { method: '平台补贴', amount: 0, percent: 0, orders: 0, color: '#3b82f6' },
    ],
  };
}

// 生成空趋势数据
function getEmptyTrendData() {
  return {
    today: 0,
    yesterday: 0,
    thisWeek: 0,
    thisMonth: 0,
    dailyData: [],
    weeklyData: [],
    monthlyData: [],
  };
}

// GET /api/reports - 获取报表统计数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sales'; // sales, income, trend, inventory
    const range = searchParams.get('range') || 'today';
    const shopId = searchParams.get('shopId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const supabase = tryGetSupabaseClient();

    if (!supabase) {
      console.log('[报表API] 数据库不可用，返回空数据');
      return NextResponse.json({
        success: true,
        data: getEmptyStats(),
        message: '数据库不可用',
      });
    }

    // 计算日期范围
    let dateStart: Date;
    let dateEnd: Date;
    
    if (startDate && endDate) {
      dateStart = new Date(startDate);
      dateEnd = new Date(endDate + 'T23:59:59');
    } else {
      const rangeDates = getDateRange(range);
      dateStart = rangeDates.start;
      dateEnd = rangeDates.end;
    }

    // 构建基础查询
    let baseQuery = supabase
      .from('pos_orders')
      .select('*')
      .gte('created_at', formatISODate(dateStart))
      .lte('created_at', formatISODate(dateEnd));

    // 店铺筛选
    if (shopId && shopId !== 'all') {
      baseQuery = baseQuery.eq('shop_id', parseInt(shopId));
    }

    const { data: orders, error } = await baseQuery;

    if (error) {
      console.error('[报表API] 查询失败:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        data: getEmptyStats(),
      });
    }

    // 根据类型返回不同数据
    switch (type) {
      case 'sales':
        return NextResponse.json({
          success: true,
          data: calculateSalesStats(orders || []),
        });
      case 'income':
        return NextResponse.json({
          success: true,
          data: calculateIncomeData(orders || []),
        });
      case 'trend':
        return NextResponse.json({
          success: true,
          data: await calculateTrendData(supabase, shopId),
        });
      case 'inventory':
        return NextResponse.json({
          success: true,
          data: await calculateInventoryStats(supabase, shopId),
        });
      case 'star-products':
        return NextResponse.json({
          success: true,
          data: calculateStarProducts(orders || []),
        });
      case 'structure':
        return NextResponse.json({
          success: true,
          data: calculateStructureAnalysis(orders || []),
        });
      default:
        return NextResponse.json({
          success: true,
          data: calculateSalesStats(orders || []),
        });
    }
  } catch (error) {
    console.error('[报表API] 处理失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取报表数据失败',
      data: getEmptyStats(),
    }, { status: 500 });
  }
}

// 计算销售统计
function calculateSalesStats(orders: any[]) {
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  const totalSales = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalSubtotal = completedOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const totalDiscount = completedOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
  
  // 计算利润（假设平均利润率为30%）
  const avgProfitRate = 0.30;
  const profit = totalSales * avgProfitRate;
  const profitRate = totalSales > 0 ? (profit / totalSales * 100).toFixed(2) + '%' : '0.00%';
  
  // 计算退款
  const refundedOrders = orders.filter(o => o.status === 'refunded');
  const refunds = refundedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  
  // 按小时统计
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourOrders = completedOrders.filter(o => {
      const orderHour = new Date(o.created_at).getHours();
      return orderHour === hour;
    });
    const amount = hourOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    return { hour, amount };
  });

  return {
    orders: completedOrders.length,
    salesAmount: totalSales,
    profit: profit,
    profitRate: profitRate,
    netSales: totalSales - refunds,
    netProfit: profit,
    netProfitRate: profitRate,
    avgOrderValue: completedOrders.length > 0 ? totalSales / completedOrders.length : 0,
    refunds: refunds,
    hourlyData: hourlyData,
  };
}

// 计算收入分布
function calculateIncomeData(orders: any[]) {
  const completedOrders = orders.filter(o => o.status === 'completed');
  const refundedOrders = orders.filter(o => o.status === 'refunded');
  
  const totalSales = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalRefunds = refundedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  
  // 按支付方式统计
  const paymentMethods: Record<string, { amount: number; orders: number; color: string; label: string }> = {
    wechat: { amount: 0, orders: 0, color: '#07c160', label: '微信支付' },
    alipay: { amount: 0, orders: 0, color: '#1677ff', label: '支付宝' },
    cash: { amount: 0, orders: 0, color: '#f97316', label: '现金支付' },
    aggregated: { amount: 0, orders: 0, color: '#ef4444', label: '聚合支付' },
    member_balance: { amount: 0, orders: 0, color: '#3b82f6', label: '会员余额支付' },
  };
  
  completedOrders.forEach(order => {
    const method = order.payment_method || 'cash';
    if (paymentMethods[method]) {
      paymentMethods[method].amount += order.total_amount || 0;
      paymentMethods[method].orders += 1;
    }
  });
  
  const payments = Object.entries(paymentMethods).map(([key, value]) => ({
    method: value.label,
    amount: value.amount,
    percent: totalSales > 0 ? Math.round(value.amount / totalSales * 100) : 0,
    orders: value.orders,
    color: value.color,
  })).filter(p => p.orders > 0);

  return {
    netSales: totalSales - totalRefunds,
    refunds: totalRefunds,
    yesterdayPayment: 0, // 需要单独查询昨日数据
    cashInDrawer: paymentMethods.cash.amount,
    payments: payments.length > 0 ? payments : [
      { method: '暂无支付记录', amount: 0, percent: 0, orders: 0, color: '#ccc' },
    ],
    refundsData: [
      { method: '微信退款', amount: 0, percent: 0, orders: 0, color: '#07c160' },
      { method: '现金退款', amount: 0, percent: 0, orders: 0, color: '#f97316' },
    ],
    rechargeData: [
      { method: '会员充值', amount: 0, percent: 0, orders: 0, color: '#22c55e' },
    ],
    subsidyData: [
      { method: '平台补贴', amount: 0, percent: 0, orders: 0, color: '#3b82f6' },
    ],
  };
}

// 计算趋势数据
async function calculateTrendData(supabase: any, shopId: string | null) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // 获取今日数据
  const todayStart = formatISODate(today);
  const todayEnd = formatISODate(now);
  
  let todayQuery = supabase
    .from('pos_orders')
    .select('total_amount')
    .eq('status', 'completed')
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd);
  
  if (shopId && shopId !== 'all') {
    todayQuery = todayQuery.eq('shop_id', parseInt(shopId));
  }
  
  const { data: todayOrders } = await todayQuery;
  const todaySales = (todayOrders || []).reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

  // 获取昨日数据
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStart = formatISODate(yesterday);
  const yesterdayEnd = formatISODate(today);
  
  let yesterdayQuery = supabase
    .from('pos_orders')
    .select('total_amount')
    .eq('status', 'completed')
    .gte('created_at', yesterdayStart)
    .lte('created_at', yesterdayEnd);
  
  if (shopId && shopId !== 'all') {
    yesterdayQuery = yesterdayQuery.eq('shop_id', parseInt(shopId));
  }
  
  const { data: yesterdayOrders } = await yesterdayQuery;
  const yesterdaySales = (yesterdayOrders || []).reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

  // 获取本周数据
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartISO = formatISODate(weekStart);
  
  let weekQuery = supabase
    .from('pos_orders')
    .select('total_amount')
    .eq('status', 'completed')
    .gte('created_at', weekStartISO)
    .lte('created_at', todayEnd);
  
  if (shopId && shopId !== 'all') {
    weekQuery = weekQuery.eq('shop_id', parseInt(shopId));
  }
  
  const { data: weekOrders } = await weekQuery;
  const weekSales = (weekOrders || []).reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

  // 获取本月数据
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStartISO = formatISODate(monthStart);
  
  let monthQuery = supabase
    .from('pos_orders')
    .select('total_amount')
    .eq('status', 'completed')
    .gte('created_at', monthStartISO)
    .lte('created_at', todayEnd);
  
  if (shopId && shopId !== 'all') {
    monthQuery = monthQuery.eq('shop_id', parseInt(shopId));
  }
  
  const { data: monthOrders } = await monthQuery;
  const monthSales = (monthOrders || []).reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

  // 获取过去7天的每日数据
  const dailyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStart = formatISODate(date);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const dateEnd = formatISODate(nextDate);
    
    let dayQuery = supabase
      .from('pos_orders')
      .select('total_amount')
      .eq('status', 'completed')
      .gte('created_at', dateStart)
      .lt('created_at', dateEnd);
    
    if (shopId && shopId !== 'all') {
      dayQuery = dayQuery.eq('shop_id', parseInt(shopId));
    }
    
    const { data: dayOrders } = await dayQuery;
    const daySales = (dayOrders || []).reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
    
    dailyData.push({
      date: `${(date.getMonth() + 1).toString().padStart(2, '0')}月${date.getDate().toString().padStart(2, '0')}日`,
      value: daySales,
      change: 0, // 需要对比前一天计算
    });
  }
  
  // 计算环比变化
  for (let i = dailyData.length - 1; i > 0; i--) {
    const prevValue = dailyData[i - 1].value;
    const currValue = dailyData[i].value;
    if (prevValue > 0) {
      dailyData[i].change = Math.round((currValue - prevValue) / prevValue * 100);
    }
  }

  return {
    today: todaySales,
    yesterday: yesterdaySales,
    thisWeek: weekSales,
    thisMonth: monthSales,
    dailyData: dailyData,
    weeklyData: [],
    monthlyData: [],
  };
}

// 计算库存统计
async function calculateInventoryStats(supabase: any, shopId: string | null) {
  // 获取库存数据
  let inventoryQuery = supabase
    .from('store_inventory')
    .select('*');
  
  if (shopId && shopId !== 'all') {
    inventoryQuery = inventoryQuery.eq('shop_id', parseInt(shopId));
  }
  
  const { data: inventory, error } = await inventoryQuery;
  
  if (error || !inventory) {
    return {
      totalQuantity: 0,
      totalTypes: 0,
      totalValue: 0,
      pendingRestock: 0,
      pendingInbound: 0,
      todayInbound: 0,
      todayInboundAmount: 0,
      receiveStats: {
        normalOrders: 0,
        normalQuantity: 0,
        normalAmount: 0,
        jdOrders: 0,
        jdQuantity: 0,
        jdAmount: 0,
      },
      inventoryCheck: {
        times: 0,
        types: 0,
        profitLoss: 0,
        profitLossAmount: 0,
      },
    };
  }

  const totalQuantity = inventory.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
  const totalValue = inventory.reduce((sum: number, item: any) => sum + (item.quantity || 0) * (item.cost_price || 0), 0);
  const pendingRestock = inventory.filter((item: any) => item.quantity <= (item.min_stock || 10)).length;

  return {
    totalQuantity,
    totalTypes: inventory.length,
    totalValue,
    pendingRestock,
    pendingInbound: 0,
    todayInbound: 0,
    todayInboundAmount: 0,
    receiveStats: {
      normalOrders: 0,
      normalQuantity: 0,
      normalAmount: 0,
      jdOrders: 0,
      jdQuantity: 0,
      jdAmount: 0,
    },
    inventoryCheck: {
      times: 0,
      types: 0,
      profitLoss: 0,
      profitLossAmount: 0,
    },
  };
}

// 计算明星商品排行
function calculateStarProducts(orders: any[]) {
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  // 统计每个商品的销售数据
  const productStats: Record<string, {
    id: string;
    name: string;
    salesCount: number;
    salesAmount: number;
    profit: number;
  }> = {};
  
  completedOrders.forEach(order => {
    const items = order.items || [];
    items.forEach((item: any) => {
      const id = item.id || 'unknown';
      if (!productStats[id]) {
        productStats[id] = {
          id,
          name: item.name || '未知商品',
          salesCount: 0,
          salesAmount: 0,
          profit: 0,
        };
      }
      productStats[id].salesCount += item.quantity || 0;
      productStats[id].salesAmount += (item.price || 0) * (item.quantity || 0);
      // 假设利润率为30%
      productStats[id].profit += (item.price || 0) * (item.quantity || 0) * 0.3;
    });
  });
  
  // 按销售额排序
  const sortedProducts = Object.values(productStats)
    .sort((a, b) => b.salesAmount - a.salesAmount)
    .slice(0, 10);
  
  return {
    products: sortedProducts.map((p, index) => ({
      rank: index + 1,
      id: p.id,
      name: p.name,
      salesCount: p.salesCount,
      salesAmount: p.salesAmount,
      profit: p.profit,
    })),
    totalProducts: Object.keys(productStats).length,
  };
}

// 计算商品结构分析
function calculateStructureAnalysis(orders: any[]) {
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  // 按品类统计
  const categoryStats: Record<string, {
    category: string;
    salesCount: number;
    salesAmount: number;
    percent: number;
  }> = {};
  
  let totalAmount = 0;
  
  completedOrders.forEach(order => {
    const items = order.items || [];
    items.forEach((item: any) => {
      const category = item.category || '其他';
      if (!categoryStats[category]) {
        categoryStats[category] = {
          category,
          salesCount: 0,
          salesAmount: 0,
          percent: 0,
        };
      }
      const itemAmount = (item.price || 0) * (item.quantity || 0);
      categoryStats[category].salesCount += item.quantity || 0;
      categoryStats[category].salesAmount += itemAmount;
      totalAmount += itemAmount;
    });
  });
  
  // 计算占比
  Object.values(categoryStats).forEach(stat => {
    stat.percent = totalAmount > 0 ? Math.round(stat.salesAmount / totalAmount * 100) : 0;
  });
  
  // 按销售额排序
  const sortedCategories = Object.values(categoryStats)
    .sort((a, b) => b.salesAmount - a.salesAmount);
  
  return {
    categories: sortedCategories,
    totalCategories: Object.keys(categoryStats).length,
    totalSales: totalAmount,
  };
}
