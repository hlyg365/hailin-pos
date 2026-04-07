import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

interface ImportRow {
  商品名称: string;
  分类: string;
  商品类型: string;
  状态: string;
  规格名称: string;
  条码: string;
  单位: string;
  进货价: number;
  售价: number;
  库存: number;
  最低库存: number;
  最高库存: number;
  限购数量?: number;
  描述?: string;
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

interface Product {
  id: string;
  name: string;
  category: string;
  type: 'standard' | 'weighted' | 'counted';
  status: 'active' | 'inactive';
  cost_price: number;
  min_stock: number;
  max_stock: number;
  limit_quantity?: number;
  description?: string;
  specs: ProductSpec[];
  store_id: string;
  create_time: string;
  update_time: string;
}

// 商品导入API - 支持Excel格式
// POST /api/products/import

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const storeId = formData.get('storeId') as string || 'default';

    if (!file) {
      return NextResponse.json({ success: false, error: '请选择文件' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let rows: ImportRow[] = [];

    if (isExcel) {
      // 解析Excel文件
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json<ImportRow>(worksheet);
    } else if (fileName.endsWith('.csv')) {
      // 解析CSV文件
      const text = buffer.toString('utf-8');
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return NextResponse.json({ success: false, error: 'CSV文件格式错误，至少需要表头和一行数据' }, { status: 400 });
      }

      // 解析表头
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

      // 解析数据行
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: Record<string, string | number> = {};
        headers.forEach((header, index) => {
          const value = values[index] || '';
          // 尝试转换为数字
          if (!isNaN(Number(value)) && value !== '') {
            row[header] = Number(value);
          } else {
            row[header] = value;
          }
        });
        rows.push(row as unknown as ImportRow);
      }
    } else {
      return NextResponse.json({ success: false, error: '不支持的文件格式，请使用Excel(.xlsx/.xls)或CSV文件' }, { status: 400 });
    }

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: '文件中没有数据' }, { status: 400 });
    }

    // 按商品名称分组，合并规格
    const productMap = new Map<string, Product>();

    for (const row of rows) {
      const productName = row['商品名称'];
      if (!productName) continue;

      // 商品类型映射
      let productType: 'standard' | 'weighted' | 'counted' = 'standard';
      const typeStr = row['商品类型'] || '';
      if (typeStr.includes('称重')) {
        productType = 'weighted';
      } else if (typeStr.includes('计件')) {
        productType = 'counted';
      }

      // 状态映射
      const status: 'active' | 'inactive' = row['状态']?.includes('下架') ? 'inactive' : 'active';

      if (!productMap.has(productName)) {
        // 新商品
        const product: Product = {
          id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: productName,
          category: row['分类'] || '其他',
          type: productType,
          status,
          cost_price: Number(row['进货价']) || 0,
          min_stock: Number(row['最低库存']) || 0,
          max_stock: Number(row['最高库存']) || 0,
          limit_quantity: row['限购数量'] ? Number(row['限购数量']) : undefined,
          description: row['描述'] || '',
          specs: [],
          store_id: storeId,
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString(),
        };
        productMap.set(productName, product);
      }

      const product = productMap.get(productName)!;

      // 添加规格
      if (row['条码']) {
        product.specs.push({
          id: `spec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: row['规格名称'] || '',
          barcode: row['条码'],
          price: Number(row['售价']) || 0,
          stock: Number(row['库存']) || 0,
          unit: row['单位'] || '个',
          costPrice: Number(row['进货价']) || undefined,
        });
      }
    }

    const products = Array.from(productMap.values());

    if (products.length === 0) {
      return NextResponse.json({ success: false, error: '没有有效的商品数据' }, { status: 400 });
    }

    // 保存到数据库
    const client = getSupabaseClient();
    const insertPromises = products.map(product => 
      client.from('store_products').insert({
        id: product.id,
        name: product.name,
        category: product.category,
        type: product.type,
        status: product.status,
        cost_price: product.cost_price,
        min_stock: product.min_stock,
        max_stock: product.max_stock,
        limit_quantity: product.limit_quantity,
        description: product.description,
        specs: product.specs,
        store_id: product.store_id,
        create_time: product.create_time,
        update_time: product.update_time,
      })
    );

    const results = await Promise.allSettled(insertPromises);
    
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        failCount++;
        errors.push(`商品 ${products[index].name}: ${(result as PromiseRejectedResult).reason}`);
      }
    });

    // 同时保存到总部商品库（不含库存信息）
    const headquartersProducts = products.map(p => ({
      id: `hq_${p.id}`,
      name: p.name,
      category: p.category,
      type: p.type,
      status: p.status,
      cost_price: p.cost_price,
      min_stock: p.min_stock,
      max_stock: p.max_stock,
      limit_quantity: p.limit_quantity,
      description: p.description,
      specs: p.specs.map(s => ({
        id: s.id,
        name: s.name,
        barcode: s.barcode,
        price: s.price,
        unit: s.unit,
        costPrice: s.costPrice,
      })),
      store_id: 'headquarters',
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
    }));

    await Promise.all(
      headquartersProducts.map(product =>
        client.from('store_products').insert(product)
      )
    );

    return NextResponse.json({
      success: true,
      data: {
        total: products.length,
        success: successCount,
        failed: failCount,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      },
    });
  } catch (error) {
    console.error('[products-import] Error:', error);
    return NextResponse.json({ success: false, error: '导入失败，请检查文件格式' }, { status: 500 });
  }
}
