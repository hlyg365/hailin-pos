import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

// 总部商品库接口
interface HeadquartersProduct {
  id: string;
  barcode: string;
  name: string;
  brand?: string;
  category: string;
  specification?: string;
  unit: string;
  suggested_price: number;
  description?: string;
  manufacturer?: string;
  origin?: string;
  image_url?: string;
  status: 'active' | 'inactive' | 'pending_review';
  created_by: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

// 获取数据库客户端
function getClient() {
  return getSupabaseClient();
}

// GET: 查询商品
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('barcode');
    const name = searchParams.get('name');
    const category = searchParams.get('category');
    
    const client = getClient();
    
    // 按条码精确查询
    if (barcode) {
      const { data, error } = await client
        .from('headquarters_products')
        .select('*')
        .eq('barcode', barcode)
        .maybeSingle();
      
      if (error) {
        console.error('[headquarters-products] Query error:', error.message);
        return NextResponse.json(
          { success: false, error: '查询失败' },
          { status: 500 }
        );
      }
      
      if (data) {
        return NextResponse.json({
          success: true,
          data: data,
        });
      }
      return NextResponse.json({
        success: true,
        data: null,
        message: '商品不存在',
      });
    }
    
    // 构建查询
    let query = client
      .from('headquarters_products')
      .select('*')
      .eq('status', 'active');
    
    // 按名称模糊查询
    if (name) {
      query = query.or(`name.ilike.%${name}%,brand.ilike.%${name}%`);
    }
    
    // 按分类查询
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query.order('usage_count', { ascending: false });
    
    if (error) {
      console.error('[headquarters-products] Query error:', error.message);
      return NextResponse.json(
        { success: false, error: '查询失败' },
        { status: 500 }
      );
    }
    
    // 同条码商品去重：只保留使用次数最多的一个
    const seenBarcodes = new Map<string, number>(); // barcode -> index
    const deduplicatedProducts: HeadquartersProduct[] = [];
    
    for (let i = 0; i < (data?.length || 0); i++) {
      const product = data![i];
      const barcode = product.barcode;
      
      if (barcode) {
        if (seenBarcodes.has(barcode)) {
          // 已存在相同条码，跳过当前商品（保留先遇到的，即使用次数最多的）
          console.log(`[headquarters-products] 跳过重复条码商品: ${product.name}, 条码: ${barcode}`);
          continue;
        }
        seenBarcodes.set(barcode, deduplicatedProducts.length);
      }
      
      deduplicatedProducts.push(product);
    }
    
    console.log(`[headquarters-products] 商品去重: 原始 ${data?.length || 0} 个, 去重后 ${deduplicatedProducts.length} 个`);
    
    return NextResponse.json({
      success: true,
      data: deduplicatedProducts,
      total: deduplicatedProducts.length,
    });
    
  } catch (error) {
    console.error('[headquarters-products] Query error:', error);
    return NextResponse.json(
      { success: false, error: '查询失败' },
      { status: 500 }
    );
  }
}

// POST: 新增商品到总部库
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barcode, name, brand, category, specification, unit, price, storeId, description, manufacturer, imageUrl } = body;
    
    // 验证必填字段
    if (!barcode || !name || !unit) {
      return NextResponse.json(
        { success: false, error: '缺少必要字段：条码、名称、单位' },
        { status: 400 }
      );
    }
    
    const client = getClient();
    
    // 检查是否已存在
    const { data: existing, error: queryError } = await client
      .from('headquarters_products')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle();
    
    if (queryError) {
      console.error('[headquarters-products] Query error:', queryError.message);
      return NextResponse.json(
        { success: false, error: '查询失败' },
        { status: 500 }
      );
    }
    
    if (existing) {
      // 已存在，增加使用计数
      const { data: updated, error: updateError } = await client
        .from('headquarters_products')
        .update({
          usage_count: (existing.usage_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('[headquarters-products] Update error:', updateError.message);
        return NextResponse.json(
          { success: false, error: '更新失败' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: updated,
        message: '商品已存在于总部库，已更新使用计数',
      });
    }
    
    // 创建新商品
    const newProduct = {
      id: `HQ${Date.now()}`,
      barcode,
      name,
      brand: brand || '',
      category: category || '其他',
      specification: specification || '',
      unit,
      suggested_price: price || 0,
      description: description || '',
      manufacturer: manufacturer || '',
      image_url: imageUrl || '',
      status: 'active',
      created_by: storeId || 'UNKNOWN',
      usage_count: 1,
    };
    
    const { data: inserted, error: insertError } = await client
      .from('headquarters_products')
      .insert(newProduct)
      .select()
      .single();
    
    if (insertError) {
      console.error('[headquarters-products] Insert error:', insertError.message);
      return NextResponse.json(
        { success: false, error: '保存失败: ' + insertError.message },
        { status: 500 }
      );
    }
    
    console.log('[headquarters-products] New product added:', barcode, name);
    
    return NextResponse.json({
      success: true,
      data: inserted,
      message: '商品已同步到总部商品库，其他店铺可使用',
    });
    
  } catch (error) {
    console.error('[headquarters-products] Add error:', error);
    return NextResponse.json(
      { success: false, error: '添加失败' },
      { status: 500 }
    );
  }
}

// PUT: 更新商品
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少商品ID' },
        { status: 400 }
      );
    }
    
    const client = getClient();
    
    const { data, error } = await client
      .from('headquarters_products')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('[headquarters-products] Update error:', error.message);
      return NextResponse.json(
        { success: false, error: '更新失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: data,
      message: '商品更新成功',
    });
    
  } catch (error) {
    console.error('[headquarters-products] Update error:', error);
    return NextResponse.json(
      { success: false, error: '更新失败' },
      { status: 500 }
    );
  }
}

// DELETE: 删除商品
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少商品ID' },
        { status: 400 }
      );
    }
    
    const client = getClient();
    
    const { error } = await client
      .from('headquarters_products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('[headquarters-products] Delete error:', error.message);
      return NextResponse.json(
        { success: false, error: '删除失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '商品删除成功',
    });
    
  } catch (error) {
    console.error('[headquarters-products] Delete error:', error);
    return NextResponse.json(
      { success: false, error: '删除失败' },
      { status: 500 }
    );
  }
}
