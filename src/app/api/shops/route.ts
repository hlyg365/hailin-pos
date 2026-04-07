import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

// 模拟店铺数据（当数据库不可用时使用）
const mockShops = [
  {
    id: 1,
    name: '海邻到家总店',
    code: 'HL001',
    address: '北京市朝阳区xxx街道',
    phone: '010-12345678',
    status: 'active',
    shop_type: 'direct',
  },
  {
    id: 2,
    name: '海邻到家分店1',
    code: 'HL002',
    address: '北京市海淀区xxx街道',
    phone: '010-87654321',
    status: 'active',
    shop_type: 'direct',
  },
  {
    id: 3,
    name: '海邻便利加盟店',
    code: 'HL003',
    address: '北京市西城区xxx街道',
    phone: '010-11112222',
    status: 'active',
    shop_type: 'franchise',
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

// 获取店铺列表
export async function GET(request: NextRequest) {
  try {
    const supabase = tryGetSupabaseClient();
    
    // 如果没有数据库连接，返回模拟数据
    if (!supabase) {
      console.log('[店铺API] 数据库不可用，返回模拟数据');
      return NextResponse.json({ shops: mockShops });
    }
    
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('status', 'active')
      .order('id', { ascending: true });

    if (error) {
      // 如果数据库错误，返回模拟数据
      console.log('[店铺API] 数据库查询失败，返回模拟数据:', error.message);
      return NextResponse.json({ shops: mockShops });
    }

    // 如果没有数据，返回模拟数据
    if (!data || data.length === 0) {
      console.log('[店铺API] 数据库无数据，返回模拟数据');
      return NextResponse.json({ shops: mockShops });
    }

    return NextResponse.json({ shops: data });
  } catch (error) {
    console.error('获取店铺列表失败:', error);
    // 出错时返回模拟数据
    return NextResponse.json({ shops: mockShops });
  }
}
