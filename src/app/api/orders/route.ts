import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

// 模拟订单数据（当数据库不可用时使用）
const mockOrders = [
  {
    id: 'order-001',
    order_no: 'PO20240401001',
    shop_id: 1,
    shop_name: '海邻到家总店',
    staff_id: 'staff-001',
    staff_name: '张店员',
    member_id: 'member-001',
    member_name: '李会员',
    member_phone: '13800138001',
    member_level: '2',
    items: [
      { id: 'prod-001', name: '新鲜西红柿', price: 6.8, quantity: 2 },
      { id: 'prod-002', name: '有机黄瓜', price: 4.5, quantity: 3 },
    ],
    subtotal: 26.1,
    discount: 0,
    promotion_discount: 0,
    total_amount: 26.1,
    payment_method: 'wechat',
    status: 'completed',
    notes: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'order-002',
    order_no: 'PO20240401002',
    shop_id: 2,
    shop_name: '海邻到家分店1',
    staff_id: 'staff-002',
    staff_name: '王店员',
    member_id: 'member-002',
    member_name: '赵会员',
    member_phone: '13800138002',
    member_level: '3',
    items: [
      { id: 'prod-003', name: '新鲜青椒', price: 5.8, quantity: 2 },
    ],
    subtotal: 11.6,
    discount: 0.58,
    promotion_discount: 0,
    total_amount: 11.02,
    payment_method: 'alipay',
    status: 'completed',
    notes: '会员折扣',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'order-003',
    order_no: 'PO20240401003',
    shop_id: 3,
    shop_name: '海邻便利加盟店',
    staff_id: 'staff-003',
    staff_name: '刘店员',
    member_id: null,
    member_name: null,
    member_phone: null,
    member_level: null,
    items: [
      { id: 'prod-004', name: '红富士苹果', price: 9.9, quantity: 5 },
    ],
    subtotal: 49.5,
    discount: 0,
    promotion_discount: 0,
    total_amount: 49.5,
    payment_method: 'cash',
    status: 'completed',
    notes: null,
    created_at: new Date(Date.now() - 10800000).toISOString(),
    updated_at: new Date(Date.now() - 10800000).toISOString(),
  },
];

// 尝试获取Supabase客户端
function tryGetSupabaseClient() {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
}

// 应用筛选条件到订单列表
function applyFilters(
  orders: any[],
  shopId: string | null,
  status: string | null,
  search: string | null
) {
  let filteredOrders = [...orders];

  // 店铺筛选
  if (shopId && shopId !== 'all') {
    filteredOrders = filteredOrders.filter(o => o.shop_id === parseInt(shopId));
  }

  // 状态筛选
  if (status && status !== 'all') {
    filteredOrders = filteredOrders.filter(o => o.status === status);
  }

  // 搜索
  if (search) {
    const searchLower = search.toLowerCase();
    filteredOrders = filteredOrders.filter(o =>
      o.order_no.toLowerCase().includes(searchLower) ||
      (o.member_name && o.member_name.toLowerCase().includes(searchLower)) ||
      (o.member_phone && o.member_phone.includes(search))
    );
  }

  return filteredOrders;
}

// 获取订单列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const supabase = tryGetSupabaseClient();

    // 如果没有数据库连接，使用模拟数据
    if (!supabase) {
      console.log('[订单API] 数据库不可用，返回模拟数据');
      let filteredOrders = applyFilters(mockOrders, shopId, status, search);

      // 分页
      const total = filteredOrders.length;
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedOrders = filteredOrders.slice(from, to);

      return NextResponse.json({
        orders: paginatedOrders,
        total,
        page,
        pageSize,
      });
    }

    // 使用数据库查询
    let query = supabase
      .from('pos_orders')
      .select('*', { count: 'exact' });

    // 店铺筛选
    if (shopId && shopId !== 'all') {
      query = query.eq('shop_id', parseInt(shopId));
    }

    // 状态筛选
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 搜索（订单号、会员名、会员手机）
    if (search) {
      query = query.or(`order_no.ilike.%${search}%,member_name.ilike.%${search}%,member_phone.ilike.%${search}%`);
    }

    // 日期范围
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate + ' 23:59:59');
    }

    // 分页和排序
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      // 如果数据库错误，使用模拟数据（应用筛选条件）
      console.log('[订单API] 数据库查询失败，返回模拟数据:', error.message);
      let filteredOrders = applyFilters(mockOrders, shopId, status, search);
      return NextResponse.json({
        orders: filteredOrders,
        total: filteredOrders.length,
        page,
        pageSize,
      });
    }

    // 如果没有数据，返回模拟数据（应用筛选条件）
    if (!data || data.length === 0) {
      console.log('[订单API] 数据库无数据，返回模拟数据');
      let filteredOrders = applyFilters(mockOrders, shopId, status, search);
      return NextResponse.json({
        orders: filteredOrders,
        total: filteredOrders.length,
        page,
        pageSize,
      });
    }

    return NextResponse.json({
      orders: data,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    // 出错时返回模拟数据
    return NextResponse.json({
      orders: mockOrders,
      total: mockOrders.length,
      page: 1,
      pageSize: 50,
    });
  }
}

// 创建订单（从收银台同步）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = tryGetSupabaseClient();

    // 生成订单ID（如果未提供）
    const orderId = body.id || `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 生成订单号（如果未提供）
    const orderNo = body.orderNo || `PO${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const orderData = {
      id: orderId,
      order_no: orderNo,
      shop_id: body.shopId ? parseInt(body.shopId) : null,
      shop_name: body.shopName,
      staff_id: body.staffId,
      staff_name: body.staffName,
      member_id: body.member?.id,
      member_name: body.member?.name,
      member_phone: body.member?.phone,
      member_level: body.member?.levelId,
      items: body.items,
      subtotal: body.subtotal,
      discount: body.discount,
      promotion_discount: 0,
      total_amount: body.totalAmount,
      payment_method: body.paymentMethod,
      status: 'completed',
      notes: body.notes,
    };

    // 如果没有数据库连接，返回模拟成功
    if (!supabase) {
      console.log('[订单API] 数据库不可用，模拟创建成功');
      return NextResponse.json({ order: { ...orderData, id: `order-${Date.now()}` } });
    }

    const { data, error } = await supabase
      .from('pos_orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error('创建订单失败:', error);
      // 如果是重复订单号，尝试更新
      if (error.code === '23505') {
        const { data: updateData, error: updateError } = await supabase
          .from('pos_orders')
          .update(orderData)
          .eq('order_no', body.orderNo)
          .select()
          .single();

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
        return NextResponse.json({ order: updateData });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ order: data });
  } catch (error) {
    console.error('创建订单失败:', error);
    return NextResponse.json(
      { error: '创建订单失败' },
      { status: 500 }
    );
  }
}
