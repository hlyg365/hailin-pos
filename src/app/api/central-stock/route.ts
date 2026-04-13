import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// 初始化Supabase客户端
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// 全局库存数据（模拟数据库）
let globalStock: any[] = [
  { productId: 'P001', productName: '矿泉水 500ml', icon: '💧', stock: 500, unit: '瓶' },
  { productId: 'P002', productName: '可乐 330ml', icon: '🥤', stock: 300, unit: '罐' },
  { productId: 'P003', productName: '雪碧 330ml', icon: '🧃', stock: 250, unit: '罐' },
  { productId: 'P004', productName: '牛奶 250ml', icon: '🥛', stock: 180, unit: '盒' },
  { productId: 'P005', productName: '酸奶 200ml', icon: '🥛', stock: 120, unit: '盒' },
  { productId: 'P006', productName: '薯片 原味70g', icon: '🍟', stock: 80, unit: '袋' },
];

// GET - 获取总仓库存
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    
    if (!supabase) {
      // 返回模拟数据
      if (productId) {
        const item = globalStock.find(s => s.productId === productId);
        return NextResponse.json({ success: true, data: item || null });
      }
      return NextResponse.json({ success: true, data: globalStock });
    }
    
    // 从数据库获取
    let query = supabase
      .from('central_stock')
      .select('*')
      .order('product_name', { ascending: true });
    
    if (productId) {
      query = query.eq('product_id', productId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('获取库存失败:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: productId ? data[0] : data });
  } catch (error) {
    console.error('获取库存失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

// POST - 入库（增加库存）
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    
    const { items } = body;
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少入库商品数据' 
      }, { status: 400 });
    }
    
    if (!supabase) {
      // 更新模拟数据
      items.forEach((item: any) => {
        const existingIndex = globalStock.findIndex(s => s.productId === item.productId);
        
        if (existingIndex >= 0) {
          // 已有商品，增加库存
          globalStock[existingIndex].stock += item.quantity;
        } else {
          // 新商品，添加到库存
          globalStock.push({
            productId: item.productId,
            productName: item.productName,
            icon: item.productIcon || '📦',
            stock: item.quantity,
            unit: item.unit,
          });
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        data: globalStock,
        message: `已入库 ${items.length} 种商品` 
      });
    }
    
    // 更新数据库库存
    for (const item of items) {
      // 检查商品是否存在
      const { data: existing } = await supabase
        .from('central_stock')
        .select('*')
        .eq('product_id', item.productId)
        .single();
      
      if (existing) {
        // 更新库存
        await supabase
          .from('central_stock')
          .update({ 
            stock: existing.stock + item.quantity,
            updated_at: new Date().toISOString(),
          })
          .eq('product_id', item.productId);
      } else {
        // 新增商品
        await supabase
          .from('central_stock')
          .insert({
            product_id: item.productId,
            product_name: item.productName,
            icon: item.productIcon || '📦',
            stock: item.quantity,
            unit: item.unit,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `已入库 ${items.length} 种商品` 
    });
  } catch (error) {
    console.error('入库失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

// PUT - 出库（减少库存）
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    
    const { items } = body;
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少出库商品数据' 
      }, { status: 400 });
    }
    
    if (!supabase) {
      // 更新模拟数据
      items.forEach((item: any) => {
        const existingIndex = globalStock.findIndex(s => s.productId === item.productId);
        
        if (existingIndex >= 0) {
          const newStock = Math.max(0, globalStock[existingIndex].stock - item.quantity);
          globalStock[existingIndex].stock = newStock;
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        data: globalStock,
        message: `已出库 ${items.length} 种商品` 
      });
    }
    
    // 更新数据库库存
    for (const item of items) {
      const { data: existing } = await supabase
        .from('central_stock')
        .select('*')
        .eq('product_id', item.productId)
        .single();
      
      if (existing) {
        const newStock = Math.max(0, existing.stock - item.quantity);
        await supabase
          .from('central_stock')
          .update({ 
            stock: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq('product_id', item.productId);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `已出库 ${items.length} 种商品` 
    });
  } catch (error) {
    console.error('出库失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
