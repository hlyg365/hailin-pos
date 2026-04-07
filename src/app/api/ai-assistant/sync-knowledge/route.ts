/**
 * 知识库同步 API
 * 将商品和促销活动信息同步到知识库
 */

import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeClient, Config, DataSourceType, HeaderUtils } from 'coze-coding-dev-sdk';

export const dynamic = 'force-dynamic';

// 知识库数据集名称
const DATASET_PRODUCTS = 'hailin_products';
const DATASET_PROMOTIONS = 'hailin_promotions';

interface Product {
  id: string;
  name: string;
  barcode?: string;
  price: number;
  originalPrice?: number;
  category: string;
  unit: string;
  stock?: number;
  description?: string;
}

interface Promotion {
  id: string;
  name: string;
  type: string;
  description: string;
  startTime: string;
  endTime: string;
  stores?: string[];
  products?: string[];
  conditions?: {
    minQuantity?: number;
    minAmount?: number;
    buyQuantity?: number;
    getQuantity?: number;
  };
  rewards?: {
    discountPercent?: number;
    discountAmount?: number;
    freeProductId?: string;
  };
}

/**
 * 同步商品到知识库
 */
async function syncProducts(
  knowledgeClient: KnowledgeClient,
  products: Product[],
  storeId?: string
) {
  const documents = products.map(product => {
    const content = `商品名称: ${product.name}
条码: ${product.barcode || '无'}
价格: ¥${product.price.toFixed(2)}${product.originalPrice ? ` (原价: ¥${product.originalPrice.toFixed(2)})` : ''}
分类: ${product.category}
单位: ${product.unit}${product.stock !== undefined ? `\n库存: ${product.stock}` : ''}${product.description ? `\n描述: ${product.description}` : ''}${storeId ? `\n店铺ID: ${storeId}` : ''}`;

    return {
      source: DataSourceType.TEXT,
      raw_data: content,
    };
  });

  const response = await knowledgeClient.addDocuments(
    documents,
    DATASET_PRODUCTS,
    {
      separator: '\n\n',
      max_tokens: 500,
    }
  );

  return response;
}

/**
 * 同步促销活动到知识库
 */
async function syncPromotions(
  knowledgeClient: KnowledgeClient,
  promotions: Promotion[],
  storeId?: string
) {
  const documents = promotions.map(promo => {
    let conditionsText = '';
    if (promo.conditions) {
      const conditions = [];
      if (promo.conditions.minQuantity) conditions.push(`最少购买${promo.conditions.minQuantity}件`);
      if (promo.conditions.minAmount) conditions.push(`最低消费¥${promo.conditions.minAmount}`);
      if (promo.conditions.buyQuantity && promo.conditions.getQuantity) {
        conditions.push(`买${promo.conditions.buyQuantity}送${promo.conditions.getQuantity}`);
      }
      if (conditions.length > 0) conditionsText = `\n活动条件: ${conditions.join('，')}`;
    }

    let rewardsText = '';
    if (promo.rewards) {
      const rewards = [];
      if (promo.rewards.discountPercent) rewards.push(`${promo.rewards.discountPercent / 10}折优惠`);
      if (promo.rewards.discountAmount) rewards.push(`立减¥${promo.rewards.discountAmount}`);
      if (rewards.length > 0) rewardsText = `\n优惠内容: ${rewards.join('，')}`;
    }

    const content = `促销活动: ${promo.name}
活动类型: ${getPromotionTypeName(promo.type)}
活动时间: ${promo.startTime} 至 ${promo.endTime}
活动说明: ${promo.description}${conditionsText}${rewardsText}${storeId ? `\n适用店铺: ${storeId}` : ''}${promo.stores && promo.stores.length > 0 ? `\n适用店铺数量: ${promo.stores.length}家` : ''}${promo.products && promo.products.length > 0 ? `\n适用商品: ${promo.products.length}款` : ''}`;

    return {
      source: DataSourceType.TEXT,
      raw_data: content,
    };
  });

  const response = await knowledgeClient.addDocuments(
    documents,
    DATASET_PROMOTIONS,
    {
      separator: '\n\n',
      max_tokens: 800,
    }
  );

  return response;
}

function getPromotionTypeName(type: string): string {
  const types: Record<string, string> = {
    'discount_percent': '折扣优惠',
    'discount_amount': '满减优惠',
    'buy_x_get_y': '买赠活动',
    'bundle': '组合套餐',
    'flash_sale': '限时秒杀',
    'member_exclusive': '会员专享',
  };
  return types[type] || type;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, storeId } = body as {
      type: 'products' | 'promotions' | 'all';
      data?: {
        products?: Product[];
        promotions?: Promotion[];
      };
      storeId?: string;
    };

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const knowledgeClient = new KnowledgeClient(config, customHeaders);

    const results = {
      products: { success: false, message: '' },
      promotions: { success: false, message: '' },
    };

    // 同步商品
    if ((type === 'products' || type === 'all') && data?.products) {
      try {
        const response = await syncProducts(knowledgeClient, data.products, storeId);
        results.products.success = response.code === 0;
        results.products.message = response.code === 0 
          ? `成功同步 ${data.products.length} 个商品` 
          : response.msg || '同步失败';
      } catch (e) {
        results.products.message = '同步商品时发生错误';
      }
    }

    // 同步促销活动
    if ((type === 'promotions' || type === 'all') && data?.promotions) {
      try {
        const response = await syncPromotions(knowledgeClient, data.promotions, storeId);
        results.promotions.success = response.code === 0;
        results.promotions.message = response.code === 0 
          ? `成功同步 ${data.promotions.length} 个促销活动` 
          : response.msg || '同步失败';
      } catch (e) {
        results.promotions.message = '同步促销活动时发生错误';
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error) {
    console.error('知识库同步错误:', error);
    return NextResponse.json(
      { success: false, error: '同步失败，请稍后再试' },
      { status: 500 }
    );
  }
}

/**
 * 获取知识库同步状态
 */
export async function GET(request: NextRequest) {
  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const knowledgeClient = new KnowledgeClient(config, customHeaders);

    // 测试搜索商品知识库
    const productsTest = await knowledgeClient.search('商品', [DATASET_PRODUCTS], 1);
    // 测试搜索促销知识库
    const promotionsTest = await knowledgeClient.search('促销', [DATASET_PROMOTIONS], 1);

    return NextResponse.json({
      success: true,
      datasets: {
        products: {
          name: DATASET_PRODUCTS,
          available: productsTest.code === 0,
        },
        promotions: {
          name: DATASET_PROMOTIONS,
          available: promotionsTest.code === 0,
        },
      },
    });

  } catch (error) {
    console.error('获取知识库状态错误:', error);
    return NextResponse.json(
      { success: false, error: '获取状态失败' },
      { status: 500 }
    );
  }
}
