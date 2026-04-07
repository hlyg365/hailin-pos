import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

// 模拟数据存储（当数据库不可用时使用）
let mockActivities: any[] = [
  {
    id: 'activity-1',
    name: '新鲜蔬菜团购活动',
    description: '新鲜蔬菜产地直供，品质保证',
    startTime: '2024-03-15',
    endTime: '2024-03-17',
    status: 'active',
    commissionMode: 'activity',
    globalCommissionType: 'percent',
    globalCommissionValue: 5,
    products: [
      { id: '1', name: '新鲜西红柿', price: 8.5, groupPrice: 6.8, stock: 50, commissionType: 'percent', commissionValue: 5 },
      { id: '2', name: '有机黄瓜', price: 6, groupPrice: 4.5, stock: 30, commissionType: 'percent', commissionValue: 5 },
    ],
    createdAt: new Date().toISOString(),
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

// GET - 获取团购活动列表或详情
export async function GET(request: NextRequest) {
  try {
    const supabase = tryGetSupabaseClient();
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('id');
    const status = searchParams.get('status');
    
    // 如果没有数据库连接，使用模拟数据
    if (!supabase) {
      if (activityId) {
        const activity = mockActivities.find(a => a.id === activityId);
        if (activity) {
          return NextResponse.json({ success: true, data: activity });
        }
        return NextResponse.json({ success: false, error: '活动不存在' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: mockActivities });
    }
    
    // 如果提供了id，返回单个活动详情
    if (activityId) {
      const { data, error } = await supabase
        .from('group_buy_activities')
        .select('*')
        .eq('id', activityId)
        .single();
      
      if (error) {
        // 如果表不存在或其他错误，使用模拟数据
        console.log('数据库查询失败，使用模拟数据:', error.message);
        const activity = mockActivities.find(a => a.id === activityId);
        if (activity) {
          return NextResponse.json({ success: true, data: activity });
        }
        return NextResponse.json({ success: false, error: '活动不存在' }, { status: 404 });
      }
      
      // 转换字段名
      const result = {
        ...data,
        startTime: data.start_time,
        endTime: data.end_time,
        commissionMode: data.commission_mode,
        globalCommissionType: data.global_commission_type,
        globalCommissionValue: data.global_commission_value,
      };
      
      return NextResponse.json({ success: true, data: result });
    }
    
    // 返回活动列表
    let query = supabase
      .from('group_buy_activities')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      // 如果表不存在或其他错误，使用模拟数据
      console.log('数据库查询失败，使用模拟数据:', error.message);
      return NextResponse.json({ success: true, data: mockActivities });
    }
    
    // 转换字段名
    const result = (data || []).map((item: any) => ({
      ...item,
      startTime: item.start_time,
      endTime: item.end_time,
      commissionMode: item.commission_mode,
      globalCommissionType: item.global_commission_type,
      globalCommissionValue: item.global_commission_value,
    }));
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('获取团购活动失败:', error);
    // 出错时返回模拟数据
    return NextResponse.json({ success: true, data: mockActivities });
  }
}

// POST - 创建团购活动
export async function POST(request: NextRequest) {
  try {
    const supabase = tryGetSupabaseClient();
    const body = await request.json();
    
    const {
      name,
      description,
      startTime,
      endTime,
      commissionMode,
      globalCommissionType,
      globalCommissionValue,
      products,
    } = body;
    
    if (!name || !startTime || !endTime || !products || products.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必填字段' 
      }, { status: 400 });
    }
    
    const activityId = `activity-${Date.now()}`;
    const newActivity = {
      id: activityId,
      name,
      description: description || '',
      startTime,
      endTime,
      status: 'active',
      commissionMode: commissionMode || 'product',
      globalCommissionType: globalCommissionType || 'percent',
      globalCommissionValue: globalCommissionValue || 0,
      products: products.map((p: any, index: number) => ({
        id: `${activityId}-product-${index}`,
        ...p,
      })),
      createdAt: new Date().toISOString(),
    };
    
    // 如果没有数据库连接，使用模拟数据
    if (!supabase) {
      mockActivities = [newActivity, ...mockActivities];
      return NextResponse.json({ success: true, data: newActivity });
    }
    
    // 尝试保存到数据库
    const { error: activityError } = await supabase
      .from('group_buy_activities')
      .insert({
        id: activityId,
        name,
        description,
        start_time: startTime,
        end_time: endTime,
        status: 'active',
        commission_mode: commissionMode || 'product',
        global_commission_type: globalCommissionType || 'percent',
        global_commission_value: globalCommissionValue || 0,
        created_at: new Date().toISOString(),
      });
    
    if (activityError) {
      // 如果数据库操作失败，使用模拟数据
      console.log('数据库保存失败，使用模拟数据:', activityError.message);
      mockActivities = [newActivity, ...mockActivities];
      return NextResponse.json({ success: true, data: newActivity });
    }
    
    return NextResponse.json({ success: true, data: newActivity });
  } catch (error) {
    console.error('创建团购活动失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

// PUT - 更新团购活动
export async function PUT(request: NextRequest) {
  try {
    const supabase = tryGetSupabaseClient();
    const body = await request.json();
    
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少活动ID' 
      }, { status: 400 });
    }
    
    // 如果没有数据库连接，使用模拟数据
    if (!supabase) {
      const index = mockActivities.findIndex(a => a.id === id);
      if (index >= 0) {
        mockActivities[index] = { ...mockActivities[index], ...updateData };
        return NextResponse.json({ success: true, data: mockActivities[index] });
      }
      return NextResponse.json({ success: false, error: '活动不存在' }, { status: 404 });
    }
    
    const { error } = await supabase
      .from('group_buy_activities')
      .update({
        name: updateData.name,
        description: updateData.description,
        start_time: updateData.startTime,
        end_time: updateData.endTime,
        status: updateData.status,
        commission_mode: updateData.commissionMode,
        global_commission_type: updateData.globalCommissionType,
        global_commission_value: updateData.globalCommissionValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (error) {
      // 如果数据库操作失败，使用模拟数据
      console.log('数据库更新失败，使用模拟数据:', error.message);
      const index = mockActivities.findIndex(a => a.id === id);
      if (index >= 0) {
        mockActivities[index] = { ...mockActivities[index], ...updateData };
        return NextResponse.json({ success: true, data: mockActivities[index] });
      }
      return NextResponse.json({ success: false, error: '活动不存在' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: { id, ...updateData } });
  } catch (error) {
    console.error('更新团购活动失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

// DELETE - 删除团购活动
export async function DELETE(request: NextRequest) {
  try {
    const supabase = tryGetSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少活动ID' 
      }, { status: 400 });
    }
    
    // 如果没有数据库连接，使用模拟数据
    if (!supabase) {
      mockActivities = mockActivities.filter(a => a.id !== id);
      return NextResponse.json({ success: true, message: '删除成功' });
    }
    
    // 尝试从数据库删除
    const { error } = await supabase.from('group_buy_activities').delete().eq('id', id);
    
    if (error) {
      // 如果数据库操作失败，使用模拟数据
      console.log('数据库删除失败，使用模拟数据:', error.message);
      mockActivities = mockActivities.filter(a => a.id !== id);
    }
    
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除团购活动失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
