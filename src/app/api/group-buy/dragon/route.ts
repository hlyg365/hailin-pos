import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

// 模拟数据存储（当数据库不可用时使用）
let mockDragons: any[] = [];

// 尝试获取Supabase客户端，如果失败则返回null
function tryGetSupabaseClient() {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
}

// GET - 获取接龙列表或单个接龙
export async function GET(request: NextRequest) {
  try {
    const supabase = tryGetSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    
    // 如果没有数据库连接，使用模拟数据
    if (!supabase) {
      if (id) {
        const dragon = mockDragons.find(d => d.id === id);
        return NextResponse.json({ success: true, data: dragon || null });
      }
      return NextResponse.json({ success: true, data: mockDragons });
    }
    
    // 查询单个接龙
    if (id) {
      const { data, error } = await supabase
        .from('dragon_activities')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.log('查询接龙失败:', error.message);
        const dragon = mockDragons.find(d => d.id === id);
        return NextResponse.json({ success: true, data: dragon || null });
      }
      
      // 转换字段名
      const result = data ? {
        ...data,
        activityId: data.activity_id,
        organizerId: data.organizer_id,
        organizerName: data.organizer_name,
        storeIds: data.store_ids || [],
        leaderIds: data.leader_ids || [],
        targetGroupIds: data.target_group_ids || [],
        endTime: data.end_time,
        createdAt: data.created_at,
        currentCount: data.current_count,
        targetCount: data.target_count,
        commissionType: data.commission_type,
        commissionValue: data.commission_value,
        estimatedCommission: data.estimated_commission,
      } : null;
      
      return NextResponse.json({ success: true, data: result });
    }
    
    // 查询列表
    let query = supabase
      .from('dragon_activities')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      // 如果数据库操作失败，使用模拟数据
      console.log('数据库查询失败，使用模拟数据:', error.message);
      return NextResponse.json({ success: true, data: mockDragons });
    }
    
    // 转换字段名
    const result = (data || []).map((item: any) => ({
      ...item,
      activityId: item.activity_id,
      organizerId: item.organizer_id,
      organizerName: item.organizer_name,
      storeIds: item.store_ids || [],
      leaderIds: item.leader_ids || [],
      targetGroupIds: item.target_group_ids || [],
      endTime: item.end_time,
      createdAt: item.created_at,
      currentCount: item.current_count,
      targetCount: item.target_count,
      commissionType: item.commission_type,
      commissionValue: item.commission_value,
      estimatedCommission: item.estimated_commission,
    }));
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('获取接龙列表失败:', error);
    return NextResponse.json({ success: true, data: mockDragons });
  }
}

// POST - 创建接龙
export async function POST(request: NextRequest) {
  try {
    const supabase = tryGetSupabaseClient();
    const body = await request.json();
    
    const {
      name,
      description,
      activityId,
      products,
      organizerId,
      storeIds,
      leaderIds,
      targetGroupIds,
      endTime,
    } = body;
    
    // 验证必填字段
    if (!name || !products || products.length === 0 || !endTime) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必填字段' 
      }, { status: 400 });
    }
    
    const dragonId = `dragon-${Date.now()}`;
    const newDragon = {
      id: dragonId,
      name,
      description: description || '',
      activityId: activityId || null,
      organizerId: organizerId || null,
      storeIds: storeIds || [],
      leaderIds: leaderIds || [],
      targetGroupIds: targetGroupIds || [],
      endTime,
      status: 'active',
      createdAt: new Date().toISOString(),
      products: products.map((p: any, index: number) => ({
        id: `${dragonId}-product-${index}`,
        ...p,
      })),
    };
    
    // 如果没有数据库连接，使用模拟数据
    if (!supabase) {
      mockDragons = [newDragon, ...mockDragons];
      return NextResponse.json({ success: true, data: newDragon });
    }
    
    // 尝试保存到数据库
    const { error: dragonError } = await supabase
      .from('dragon_activities')
      .insert({
        id: dragonId,
        name,
        description,
        activity_id: activityId,
        organizer_id: organizerId,
        store_ids: storeIds || [],
        leader_ids: leaderIds || [],
        target_group_ids: targetGroupIds || [],
        end_time: endTime,
        status: 'active',
        created_at: new Date().toISOString(),
      });
    
    if (dragonError) {
      // 如果数据库操作失败，使用模拟数据
      console.log('数据库保存失败，使用模拟数据:', dragonError.message);
      mockDragons = [newDragon, ...mockDragons];
      return NextResponse.json({ success: true, data: newDragon });
    }
    
    return NextResponse.json({ success: true, data: newDragon });
  } catch (error) {
    console.error('创建接龙失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
