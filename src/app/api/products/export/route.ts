import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

// 商品导出API - Excel格式
// GET /api/products/export?storeId=xxx

interface ExportProduct {
  id: string;
  name: string;
  category: string;
  type: string;
  status: string;
  cost_price: number;
  min_stock: number;
  max_stock: number;
  limit_quantity?: number;
  description?: string;
  specs: Array<{
    id: string;
    name: string;
    barcode: string;
    price: number;
    stock: number;
    unit: string;
    costPrice?: number;
  }>;
  create_time: string;
  update_time: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'default';

    const client = getSupabaseClient();

    // 查询商品数据
    const { data, error } = await client
      .from('store_products')
      .select('*')
      .eq('store_id', storeId)
      .order('create_time', { ascending: false });

    if (error) {
      console.error('[products-export] Query error:', error.message);
      return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, error: '没有可导出的商品数据' }, { status: 400 });
    }

    // 准备Excel数据
    const excelData: Record<string, unknown>[] = [];

    // 表头
    const headers = [
      '商品名称',
      '分类',
      '商品类型',
      '状态',
      '规格名称',
      '条码',
      '单位',
      '进货价',
      '售价',
      '库存',
      '最低库存',
      '最高库存',
      '限购数量',
      '描述',
    ];

    // 数据行 - 展开规格，每行一个规格
    for (const product of data) {
      const productType = product.type === 'standard' ? '标品' : product.type === 'weighted' ? '称重' : '计件';
      const productStatus = product.status === 'active' ? '上架' : '下架';
      
      if (product.specs && product.specs.length > 0) {
        for (const spec of product.specs) {
          excelData.push({
            '商品名称': product.name,
            '分类': product.category,
            '商品类型': productType,
            '状态': productStatus,
            '规格名称': spec.name || '',
            '条码': spec.barcode || '',
            '单位': spec.unit || '个',
            '进货价': spec.costPrice || product.cost_price || 0,
            '售价': spec.price || 0,
            '库存': spec.stock || 0,
            '最低库存': product.min_stock,
            '最高库存': product.max_stock,
            '限购数量': product.limit_quantity || '',
            '描述': product.description || '',
          });
        }
      } else {
        // 无规格商品
        excelData.push({
          '商品名称': product.name,
          '分类': product.category,
          '商品类型': productType,
          '状态': productStatus,
          '规格名称': '',
          '条码': '',
          '单位': '',
          '进货价': product.cost_price,
          '售价': '',
          '库存': '',
          '最低库存': product.min_stock,
          '最高库存': product.max_stock,
          '限购数量': product.limit_quantity || '',
          '描述': product.description || '',
        });
      }
    }

    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData, { header: headers });

    // 设置列宽
    worksheet['!cols'] = [
      { wch: 20 }, // 商品名称
      { wch: 10 }, // 分类
      { wch: 10 }, // 商品类型
      { wch: 8 },  // 状态
      { wch: 15 }, // 规格名称
      { wch: 15 }, // 条码
      { wch: 8 },  // 单位
      { wch: 10 }, // 进货价
      { wch: 10 }, // 售价
      { wch: 8 },  // 库存
      { wch: 10 }, // 最低库存
      { wch: 10 }, // 最高库存
      { wch: 10 }, // 限购数量
      { wch: 30 }, // 描述
    ];

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '商品列表');

    // 生成Excel文件buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 返回Excel文件
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="products_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('[products-export] Error:', error);
    return NextResponse.json({ success: false, error: '导出失败' }, { status: 500 });
  }
}
