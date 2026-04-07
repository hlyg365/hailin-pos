import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

// 店铺商品接口
interface StoreProduct {
  id: string;
  store_id: string;
  name: string;
  category: string;
  type: 'standard' | 'weighted' | 'counted';
  has_barcode: boolean;
  is_weighted: boolean;
  is_counted: boolean;
  status: 'active' | 'inactive';
  cost_price: number;
  min_stock: number;
  max_stock: number;
  limit_quantity?: number;
  description?: string;
  specs: ProductSpec[];
  create_time: string;
  update_time: string;
}

interface ProductSpec {
  id: string;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  unit: string;
  costPrice?: number;
}

// 获取数据库客户端
function getClient() {
  return getSupabaseClient();
}

// 生成ID
function generateId(): string {
  return `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// GET: 查询商品列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    
    const client = getClient();
    
    let query = client
      .from('store_products')
      .select('*')
      .eq('store_id', storeId)
      .order('create_time', { ascending: false });
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[store-products] Query error:', error.message);
      return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
    }
    
    // 转换数据格式（将数据库字段转换为前端期望的格式）
    const products = (data || []).map(p => ({
      ...p,
      hasBarcode: p.has_barcode,
      isWeighted: p.is_weighted,
      isCounted: p.is_counted,
      costPrice: p.cost_price,
      minStock: p.min_stock,
      maxStock: p.max_stock,
      limitQuantity: p.limit_quantity,
      createTime: p.create_time,
      updateTime: p.update_time,
    }));
    
    // 同条码商品去重：只保留最新的一个
    const seenBarcodes = new Map<string, number>(); // barcode -> index
    const deduplicatedProducts: typeof products = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const specs = product.specs || [];
      
      // 获取商品的主要条码（第一个规格的条码或商品本身的条码）
      const mainBarcode = specs.length > 0 && specs[0]?.barcode 
        ? specs[0].barcode 
        : null;
      
      if (mainBarcode) {
        if (seenBarcodes.has(mainBarcode)) {
          // 已存在相同条码，跳过当前商品（保留先遇到的，即最新的）
          console.log(`[store-products] 跳过重复条码商品: ${product.name}, 条码: ${mainBarcode}`);
          continue;
        }
        seenBarcodes.set(mainBarcode, deduplicatedProducts.length);
      }
      
      deduplicatedProducts.push(product);
    }
    
    console.log(`[store-products] 商品去重: 原始 ${products.length} 个, 去重后 ${deduplicatedProducts.length} 个`);
    
    return NextResponse.json({
      success: true,
      data: deduplicatedProducts,
      total: deduplicatedProducts.length,
    });
    
  } catch (error) {
    console.error('[store-products] GET error:', error);
    return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
  }
}

// POST: 新增商品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeId = 'default',
      name,
      category,
      type,
      hasBarcode,
      isWeighted,
      isCounted,
      status,
      costPrice,
      minStock,
      maxStock,
      limitQuantity,
      description,
      specs,
    } = body;
    
    if (!name) {
      return NextResponse.json({ success: false, error: '商品名称不能为空' }, { status: 400 });
    }
    
    const client = getClient();
    
    // 检查条码是否已存在
    const mainBarcode = specs && specs.length > 0 && specs[0]?.barcode 
      ? specs[0].barcode.trim() 
      : null;
    
    if (mainBarcode) {
      // 查询是否存在相同条码的商品
      const { data: existingProducts, error: queryError } = await client
        .from('store_products')
        .select('*')
        .eq('store_id', storeId);
      
      if (!queryError && existingProducts) {
        const duplicate = existingProducts.find(p => {
          const pSpecs = p.specs || [];
          return pSpecs.some((s: ProductSpec) => s.barcode === mainBarcode);
        });
        
        if (duplicate) {
          console.log(`[store-products] 条码已存在，更新商品: ${duplicate.name}, 条码: ${mainBarcode}`);
          // 更新现有商品
          const updatedProduct = {
            name,
            category: category || duplicate.category,
            type: type || duplicate.type,
            has_barcode: hasBarcode ?? duplicate.has_barcode,
            is_weighted: isWeighted ?? duplicate.is_weighted,
            is_counted: isCounted ?? duplicate.is_counted,
            status: status || duplicate.status,
            cost_price: costPrice ?? duplicate.cost_price,
            min_stock: minStock ?? duplicate.min_stock,
            max_stock: maxStock ?? duplicate.max_stock,
            limit_quantity: limitQuantity ?? duplicate.limit_quantity,
            description: description || duplicate.description,
            specs: specs || duplicate.specs,
            update_time: new Date().toISOString(),
          };
          
          const { data, error } = await client
            .from('store_products')
            .update(updatedProduct)
            .eq('id', duplicate.id)
            .select()
            .single();
          
          if (error) {
            console.error('[store-products] Update error:', error.message);
            return NextResponse.json({ success: false, error: '更新失败: ' + error.message }, { status: 500 });
          }
          
          return NextResponse.json({ 
            success: true, 
            data: { ...data, updated: true, message: '条码已存在，已更新商品信息' } 
          });
        }
      }
    }
    
    const newProduct = {
      id: generateId(),
      store_id: storeId,
      name,
      category: category || '其他',
      type: type || 'standard',
      has_barcode: hasBarcode ?? true,
      is_weighted: isWeighted ?? false,
      is_counted: isCounted ?? false,
      status: status || 'active',
      cost_price: costPrice || 0,
      min_stock: minStock || 10,
      max_stock: maxStock || 100,
      limit_quantity: limitQuantity,
      description: description || '',
      specs: specs || [],
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
    };
    
    const { data, error } = await client
      .from('store_products')
      .insert(newProduct)
      .select()
      .single();
    
    if (error) {
      console.error('[store-products] Insert error:', error.message);
      return NextResponse.json({ success: false, error: '保存失败: ' + error.message }, { status: 500 });
    }
    
    // 同步到总部商品库（如果有条码）
    if (specs && specs.length > 0) {
      for (const spec of specs) {
        if (spec.barcode && spec.barcode.trim()) {
          try {
            await fetch(`${process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'http://localhost:5000'}/api/headquarters/products/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                barcode: spec.barcode,
                name: `${name} ${spec.name}`,
                brand: '',
                category,
                specification: spec.name,
                unit: spec.unit,
                price: spec.price,
                storeId,
              }),
            });
          } catch (e) {
            console.log('[store-products] 同步到总部库失败:', e);
          }
        }
      }
    }
    
    console.log('[store-products] 新商品已保存:', name);
    
    // 返回转换后的数据
    const result = {
      ...data,
      hasBarcode: data.has_barcode,
      isWeighted: data.is_weighted,
      isCounted: data.is_counted,
      costPrice: data.cost_price,
      minStock: data.min_stock,
      maxStock: data.max_stock,
      limitQuantity: data.limit_quantity,
      createTime: data.create_time,
      updateTime: data.update_time,
    };
    
    return NextResponse.json({
      success: true,
      data: result,
      message: '商品保存成功',
    });
    
  } catch (error) {
    console.error('[store-products] POST error:', error);
    const errorMessage = error instanceof Error ? error.message : '保存失败';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// PUT: 更新商品
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: '商品ID不能为空' }, { status: 400 });
    }
    
    const client = getClient();
    
    // 转换字段名
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.hasBarcode !== undefined) dbUpdates.has_barcode = updates.hasBarcode;
    if (updates.isWeighted !== undefined) dbUpdates.is_weighted = updates.isWeighted;
    if (updates.isCounted !== undefined) dbUpdates.is_counted = updates.isCounted;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
    if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock;
    if (updates.maxStock !== undefined) dbUpdates.max_stock = updates.maxStock;
    if (updates.limitQuantity !== undefined) dbUpdates.limit_quantity = updates.limitQuantity;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.specs !== undefined) dbUpdates.specs = updates.specs;
    
    dbUpdates.update_time = new Date().toISOString();
    
    const { data, error } = await client
      .from('store_products')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('[store-products] Update error:', error.message);
      return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
    }
    
    const result = {
      ...data,
      hasBarcode: data.has_barcode,
      isWeighted: data.is_weighted,
      isCounted: data.is_counted,
      costPrice: data.cost_price,
      minStock: data.min_stock,
      maxStock: data.max_stock,
      limitQuantity: data.limit_quantity,
      createTime: data.create_time,
      updateTime: data.update_time,
    };
    
    return NextResponse.json({
      success: true,
      data: result,
      message: '商品更新成功',
    });
    
  } catch (error) {
    console.error('[store-products] PUT error:', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}

// DELETE: 删除商品
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: '商品ID不能为空' }, { status: 400 });
    }
    
    const client = getClient();
    
    const { error } = await client
      .from('store_products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('[store-products] Delete error:', error.message);
      return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '商品删除成功',
    });
    
  } catch (error) {
    console.error('[store-products] DELETE error:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
