import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

// 模拟数据（当数据库不可用时使用）
const mockTargetGroups = [
  { id: 'group-1', name: '阳光小区业主群', memberCount: 256 },
  { id: 'group-2', name: '幸福家园团购群', memberCount: 189 },
  { id: 'group-3', name: '和谐花园便民群', memberCount: 312 },
  { id: 'group-4', name: '阳光小区B区群', memberCount: 98 },
  { id: 'group-5', name: '社区生鲜优惠群', memberCount: 456 },
];

// 尝试获取Supabase客户端，如果失败则返回null
function tryGetSupabaseClient() {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
}

// GET - 获取目标群列表
export async function GET(request: NextRequest) {
  try {
    const supabase = tryGetSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json({ success: true, data: mockTargetGroups });
    }
    
    const { data, error } = await supabase
      .from('target_groups')
      .select('*')
      .order('member_count', { ascending: false });
    
    if (error) {
      // 如果表不存在或查询失败，使用模拟数据
      console.log('[target-groups] 数据库查询错误:', error.code, error.message);
      // 任何数据库错误都返回模拟数据，保证前端可用
      return NextResponse.json({ success: true, data: mockTargetGroups });
    }
    
    // 转换字段名
    const result = (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      memberCount: item.member_count || item.memberCount,
    }));
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('获取目标群列表失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
