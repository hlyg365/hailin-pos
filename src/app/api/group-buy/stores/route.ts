import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

// 模拟数据（当数据库不可用时使用）
const mockStoresWithLeaders = [
  {
    id: 'store-1',
    name: '阳光小区店',
    address: '阳光小区1号楼底商',
    leaders: [
      { id: 'leader-1', name: '张大姐', phone: '138****1234', community: '阳光小区A区' },
      { id: 'leader-2', name: '王阿姨', phone: '139****5678', community: '阳光小区B区' },
    ],
  },
  {
    id: 'store-2',
    name: '幸福家园店',
    address: '幸福家园东门',
    leaders: [
      { id: 'leader-3', name: '李大姐', phone: '137****9012', community: '幸福家园' },
    ],
  },
  {
    id: 'store-3',
    name: '和谐花园店',
    address: '和谐花园南门',
    leaders: [
      { id: 'leader-4', name: '赵妈妈', phone: '136****3456', community: '和谐花园' },
      { id: 'leader-5', name: '孙阿姨', phone: '135****7890', community: '和谐花园二期' },
    ],
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

// GET - 获取店铺列表（包含团长）
export async function GET(request: NextRequest) {
  try {
    const supabase = tryGetSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json({ success: true, data: mockStoresWithLeaders });
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // 获取店铺列表
    let storeQuery = supabase
      .from('shops')
      .select('*')
      .order('id', { ascending: true });
    
    if (status) {
      storeQuery = storeQuery.eq('status', status);
    }
    
    const { data: stores, error: storeError } = await storeQuery;
    
    if (storeError) {
      // 如果表不存在或查询失败，使用模拟数据
      if (storeError.code === '42P01') {
        return NextResponse.json({ success: true, data: mockStoresWithLeaders });
      }
      console.error('获取店铺列表失败:', storeError);
      return NextResponse.json({ success: false, error: storeError.message }, { status: 500 });
    }
    
    // 为每个店铺添加模拟团长数据
    const storesWithLeaders = (stores || []).map((store, index) => ({
      id: store.id?.toString() || `store-${index}`,
      name: store.name,
      address: store.address || '',
      leaders: mockStoresWithLeaders[index % mockStoresWithLeaders.length]?.leaders || [],
    }));
    
    return NextResponse.json({ success: true, data: storesWithLeaders });
  } catch (error) {
    console.error('获取店铺列表失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
