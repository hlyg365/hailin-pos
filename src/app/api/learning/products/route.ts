import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

/**
 * 商品识别自我学习系统
 * 
 * 功能：
 * 1. 存储AI识别的商品图片和识别结果
 * 2. 通过图片URL哈希快速匹配
 * 3. 记录学习命中统计，减少第三方AI调用
 */

// 学习商品接口
interface LearnedProduct {
  id: string;
  image_url: string;
  image_hash: string;
  name: string;
  brand?: string;
  category: string;
  specification?: string;
  unit: string;
  price?: number;
  description?: string;
  match_count: number;
  last_matched_at?: string;
  created_at: string;
  updated_at: string;
  source: string;
  original_method?: string;
  confidence: number;
}

// 学习统计接口
interface LearningStats {
  totalLearned: number;
  totalMatches: number;
  aiCallsSaved: number;
  hitRate: number;
  lastLearningAt?: string;
  topMatchedProducts: Array<{
    name: string;
    match_count: number;
  }>;
}

// 获取数据库客户端
function getClient() {
  return getSupabaseClient();
}

// 生成图片URL的简单哈希（用于快速匹配）
function generateImageHash(imageUrl: string): string {
  let hash = 0;
  for (let i = 0; i < imageUrl.length; i++) {
    const char = imageUrl.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// GET: 查询学习库
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('imageUrl');
    const stats = searchParams.get('stats');
    const client = getClient();
    
    // 获取统计信息
    if (stats === 'true') {
      const { data: products, error } = await client
        .from('learned_products')
        .select('name, match_count');
      
      if (error) {
        console.error('[learning-products] Query stats error:', error.message);
        return NextResponse.json({ success: false, error: '查询统计失败' }, { status: 500 });
      }
      
      const totalLearned = products?.length || 0;
      const totalMatches = products?.reduce((sum, p) => sum + (p.match_count || 0), 0) || 0;
      
      const statsData: LearningStats = {
        totalLearned,
        totalMatches,
        aiCallsSaved: totalMatches,
        hitRate: totalLearned > 0 ? (totalMatches / (totalLearned + totalMatches)) * 100 : 0,
        topMatchedProducts: (products || [])
          .sort((a, b) => (b.match_count || 0) - (a.match_count || 0))
          .slice(0, 10)
          .map(p => ({ name: p.name, match_count: p.match_count || 0 })),
      };
      
      return NextResponse.json({ success: true, data: statsData });
    }
    
    // 按图片URL查询
    if (imageUrl) {
      const imageHash = generateImageHash(imageUrl);
      
      const { data, error } = await client
        .from('learned_products')
        .select('*')
        .eq('image_hash', imageHash)
        .maybeSingle();
      
      if (error) {
        console.error('[learning-products] Query error:', error.message);
        return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
      }
      
      if (data) {
        // 增加命中计数
        await client
          .from('learned_products')
          .update({
            match_count: (data.match_count || 0) + 1,
            last_matched_at: new Date().toISOString(),
          })
          .eq('id', data.id);
        
        console.log('[learning-products] 学习库命中:', data.name);
        return NextResponse.json({ success: true, data: { ...data, match_count: data.match_count + 1 } });
      }
      
      return NextResponse.json({ success: true, data: null });
    }
    
    // 查询所有学习商品
    const { data, error } = await client
      .from('learned_products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[learning-products] Query all error:', error.message);
      return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: data || [] });
    
  } catch (error) {
    console.error('[learning-products] GET error:', error);
    return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
  }
}

// POST: 添加学习商品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, name, brand, category, specification, unit, price, description, source, originalMethod, confidence } = body;
    
    if (!imageUrl || !name) {
      return NextResponse.json({ success: false, error: '缺少必要字段' }, { status: 400 });
    }
    
    const imageHash = generateImageHash(imageUrl);
    const client = getClient();
    
    // 检查是否已存在
    const { data: existing, error: queryError } = await client
      .from('learned_products')
      .select('*')
      .eq('image_hash', imageHash)
      .maybeSingle();
    
    if (queryError) {
      console.error('[learning-products] Query error:', queryError.message);
      return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
    }
    
    if (existing) {
      // 已存在，更新命中计数
      const { data: updated, error: updateError } = await client
        .from('learned_products')
        .update({
          match_count: (existing.match_count || 0) + 1,
          last_matched_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('[learning-products] Update error:', updateError.message);
      }
      
      return NextResponse.json({ success: true, data: updated || existing, message: '商品已存在，已更新命中计数' });
    }
    
    // 创建新学习商品
    const newProduct = {
      id: `LP${Date.now()}`,
      image_url: imageUrl,
      image_hash: imageHash,
      name,
      brand: brand || '',
      category: category || '其他',
      specification: specification || '',
      unit: unit || '个',
      price: price || 0,
      description: description || '',
      match_count: 1,
      source: source || 'ai_recognition',
      original_method: originalMethod || '',
      confidence: confidence || 0,
    };
    
    const { data: inserted, error: insertError } = await client
      .from('learned_products')
      .insert(newProduct)
      .select()
      .single();
    
    if (insertError) {
      console.error('[learning-products] Insert error:', insertError.message);
      return NextResponse.json({ success: false, error: '保存失败' }, { status: 500 });
    }
    
    console.log('[learning-products] 新商品已学习:', name);
    
    return NextResponse.json({ success: true, data: inserted, message: '商品已添加到学习库' });
    
  } catch (error) {
    console.error('[learning-products] POST error:', error);
    return NextResponse.json({ success: false, error: '添加失败' }, { status: 500 });
  }
}

// DELETE: 删除学习商品
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少商品ID' }, { status: 400 });
    }
    
    const client = getClient();
    
    const { error } = await client
      .from('learned_products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('[learning-products] Delete error:', error.message);
      return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: '删除成功' });
    
  } catch (error) {
    console.error('[learning-products] DELETE error:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
