import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

/**
 * 非标品商品管理API
 * 
 * 非标品定义：没有标准条码的商品，如散装食品、生鲜、自制商品等
 * 
 * 功能：
 * 1. 添加非标品（带图片）
 * 2. 通过图片相似度匹配非标品
 * 3. 自动学习到学习库
 */

// 非标品商品接口
interface NonStandardProduct {
  id: string;
  name: string;
  brand?: string;
  category: string;
  sub_category?: string;
  specification?: string;
  unit: string;
  price: number;
  pricing_unit: string;
  description?: string;
  image_url: string;
  image_hash: string;
  thumbnail_url?: string;
  tags: string[];
  keywords: string[];
  match_count: number;
  last_matched_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: string;
}

// 获取数据库客户端
function getClient() {
  return getSupabaseClient();
}

// 生成简单的图片标识符
function generateImageIdentifier(imageUrl: string): string {
  let hash = 0;
  for (let i = 0; i < imageUrl.length; i++) {
    const char = imageUrl.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `NS${Math.abs(hash).toString(36)}`;
}

// 插入初始数据
async function ensureInitialData() {
  const client = getClient();
  
  // 检查是否已有数据
  const { data: existing } = await client
    .from('non_standard_products')
    .select('id')
    .limit(1);
  
  if (existing && existing.length > 0) return;
  
  // 插入初始数据
  const initialProducts = [
    {
      id: 'NS001',
      name: '红富士苹果',
      category: '生鲜',
      sub_category: '水果',
      unit: '斤',
      price: 5.8,
      pricing_unit: '斤',
      image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
      image_hash: 'apple_red_001',
      tags: ['红色', '圆形', '水果', '苹果'],
      keywords: ['苹果', '红富士', '水果'],
      match_count: 50,
      created_by: 'HEADQUARTERS',
      status: 'active',
    },
    {
      id: 'NS002',
      name: '新鲜香蕉',
      category: '生鲜',
      sub_category: '水果',
      unit: '斤',
      price: 3.5,
      pricing_unit: '斤',
      image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
      image_hash: 'banana_001',
      tags: ['黄色', '长形', '水果', '香蕉'],
      keywords: ['香蕉', '水果'],
      match_count: 45,
      created_by: 'HEADQUARTERS',
      status: 'active',
    },
    {
      id: 'NS003',
      name: '西红柿',
      category: '生鲜',
      sub_category: '蔬菜',
      unit: '斤',
      price: 4.5,
      pricing_unit: '斤',
      image_url: 'https://images.unsplash.com/photo-1546470427-227c7369a9b0?w=400',
      image_hash: 'tomato_001',
      tags: ['红色', '圆形', '蔬菜', '番茄'],
      keywords: ['西红柿', '番茄', '蔬菜'],
      match_count: 38,
      created_by: 'HEADQUARTERS',
      status: 'active',
    },
  ];
  
  for (const product of initialProducts) {
    await client.from('non_standard_products').insert(product);
  }
}

// GET: 查询非标品
export async function GET(request: NextRequest) {
  try {
    await ensureInitialData();
    
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const category = searchParams.get('category');
    const imageUrl = searchParams.get('imageUrl');
    const client = getClient();
    
    // 按图片URL查询
    if (imageUrl) {
      const imageHash = generateImageIdentifier(imageUrl);
      
      const { data, error } = await client
        .from('non_standard_products')
        .select('*')
        .or(`image_hash.eq.${imageHash},image_url.eq.${imageUrl}`)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) {
        console.error('[non-standard-products] Query error:', error.message);
        return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
      }
      
      if (data) {
        // 更新匹配计数
        await client
          .from('non_standard_products')
          .update({
            match_count: (data.match_count || 0) + 1,
            last_matched_at: new Date().toISOString(),
          })
          .eq('id', data.id);
        
        return NextResponse.json({
          success: true,
          data: { ...data, match_count: data.match_count + 1 },
          matched: true,
        });
      }
      
      return NextResponse.json({
        success: true,
        data: null,
        matched: false,
      });
    }
    
    // 按名称模糊查询
    if (name) {
      const { data, error } = await client
        .from('non_standard_products')
        .select('*')
        .eq('status', 'active')
        .or(`name.ilike.%${name}%,keywords.cs.{${name}}`);
      
      if (error) {
        console.error('[non-standard-products] Query error:', error.message);
        return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: data || [],
        total: data?.length || 0,
      });
    }
    
    // 按分类查询
    if (category) {
      const { data, error } = await client
        .from('non_standard_products')
        .select('*')
        .eq('status', 'active')
        .eq('category', category);
      
      if (error) {
        console.error('[non-standard-products] Query error:', error.message);
        return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: data || [],
        total: data?.length || 0,
      });
    }
    
    // 查询所有非标品
    const { data, error } = await client
      .from('non_standard_products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[non-standard-products] Query all error:', error.message);
      return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0,
    });
    
  } catch (error) {
    console.error('[non-standard-products] GET error:', error);
    return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
  }
}

// POST: 添加非标品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, brand, category, subCategory, specification, unit, price, pricingUnit, description, imageUrl, tags, keywords, storeId } = body;
    
    if (!name || !unit || !price) {
      return NextResponse.json({ success: false, error: '缺少必要字段：名称、单位、价格' }, { status: 400 });
    }
    
    const client = getClient();
    
    const imageHash = imageUrl ? generateImageIdentifier(imageUrl) : '';
    
    const newProduct = {
      id: `NS${Date.now()}`,
      name,
      brand: brand || '',
      category: category || '其他',
      sub_category: subCategory || '',
      specification: specification || '',
      unit,
      price,
      pricing_unit: pricingUnit || unit,
      description: description || '',
      image_url: imageUrl || '',
      image_hash: imageHash,
      tags: tags || [],
      keywords: keywords || [name],
      match_count: 0,
      created_by: storeId || 'UNKNOWN',
      status: 'active',
    };
    
    const { data, error } = await client
      .from('non_standard_products')
      .insert(newProduct)
      .select()
      .single();
    
    if (error) {
      console.error('[non-standard-products] Insert error:', error.message);
      return NextResponse.json({ success: false, error: '保存失败: ' + error.message }, { status: 500 });
    }
    
    // 同时添加到学习库
    try {
      await fetch(`${process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'http://localhost:5000'}/api/learning/products/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          name,
          brand,
          category,
          specification,
          unit,
          price,
          description,
          source: 'non_standard',
        }),
      });
    } catch (e) {
      console.log('[non-standard-products] 同步到学习库失败:', e);
    }
    
    console.log('[non-standard-products] 新非标品已添加:', name);
    
    return NextResponse.json({
      success: true,
      data: data,
      message: '非标品添加成功',
    });
    
  } catch (error) {
    console.error('[non-standard-products] POST error:', error);
    return NextResponse.json({ success: false, error: '添加失败' }, { status: 500 });
  }
}

// PUT: 更新非标品
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少商品ID' }, { status: 400 });
    }
    
    const client = getClient();
    
    // 转换字段名
    const dbUpdates: Record<string, unknown> = { ...updates };
    if (updates.subCategory) {
      dbUpdates.sub_category = updates.subCategory;
      delete dbUpdates.subCategory;
    }
    if (updates.pricingUnit) {
      dbUpdates.pricing_unit = updates.pricingUnit;
      delete dbUpdates.pricingUnit;
    }
    if (updates.imageUrl) {
      dbUpdates.image_url = updates.imageUrl;
      delete dbUpdates.imageUrl;
    }
    if (updates.thumbnailUrl) {
      dbUpdates.thumbnail_url = updates.thumbnailUrl;
      delete dbUpdates.thumbnailUrl;
    }
    dbUpdates.updated_at = new Date().toISOString();
    
    const { data, error } = await client
      .from('non_standard_products')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('[non-standard-products] Update error:', error.message);
      return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: data,
      message: '更新成功',
    });
    
  } catch (error) {
    console.error('[non-standard-products] PUT error:', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}

// DELETE: 删除非标品
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少商品ID' }, { status: 400 });
    }
    
    const client = getClient();
    
    const { error } = await client
      .from('non_standard_products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('[non-standard-products] Delete error:', error.message);
      return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
    
  } catch (error) {
    console.error('[non-standard-products] DELETE error:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
