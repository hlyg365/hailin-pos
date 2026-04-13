import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

// 模拟数据（当数据库不可用时使用）
const mockLeaders = [
  {
    id: 'leader-1',
    name: '张大姐',
    phone: '138****1234',
    community: '阳光小区',
    status: 'active',
    totalOrders: 156,
    totalSales: 23450,
    commission: 1172.5,
    level: 'gold',
  },
  {
    id: 'leader-2',
    name: '李阿姨',
    phone: '139****5678',
    community: '幸福家园',
    status: 'active',
    totalOrders: 98,
    totalSales: 15800,
    commission: 790,
    level: 'silver',
  },
  {
    id: 'leader-3',
    name: '王妈妈',
    phone: '137****9012',
    community: '和谐花园',
    status: 'active',
    totalOrders: 67,
    totalSales: 9200,
    commission: 460,
    level: 'bronze',
  },
];

// 尝试获取Supabase客户端，如果失败则返回null
function tryGetSupabaseClient() {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
}

// GET - 获取团长列表
export async function GET(request: NextRequest) {
  try {
    const supabase = tryGetSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json({ success: true, data: mockLeaders });
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let query = supabase
      .from('team_leaders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      // 如果表不存在，使用模拟数据
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, data: mockLeaders });
      }
      console.error('获取团长列表失败:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('获取团长列表失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
