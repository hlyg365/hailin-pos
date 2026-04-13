import { NextRequest, NextResponse } from 'next/server';
import { SearchClient, Config, HeaderUtils, LLMClient } from 'coze-coding-dev-sdk';
import { getApiConfig } from '@/lib/api-config-store';

export const dynamic = 'force-dynamic';

// 商品信息接口
interface ProductInfo {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  specification?: string;
  unit?: string;
  price?: number;
  description?: string;
  manufacturer?: string;
  origin?: string;
  imageUrl?: string;  // 商品图片URL
  confidence: number;
}

// 本地商品数据库缓存（常见商品，确保准确性）
const localProducts: Record<string, Partial<ProductInfo>> = {
  // 农夫山泉系列
  '6901941950268': { 
    name: '农夫山泉饮用天然水', 
    brand: '农夫山泉', 
    category: '饮品', 
    specification: '550ml', 
    unit: '瓶', 
    price: 2.00,
    imageUrl: 'https://img.alicdn.com/imgextra/i4/2200724907121/O1CN01FJxMQp1h6CgZYViYN_!!2200724907121.jpg'
  },
  '6901941950275': { name: '农夫山泉饮用天然水', brand: '农夫山泉', category: '饮品', specification: '1.5L', unit: '瓶', price: 3.00 },
  '6901941950282': { name: '农夫山泉饮用天然水', brand: '农夫山泉', category: '饮品', specification: '4L', unit: '瓶', price: 6.00 },
  
  // 可口可乐系列
  '6901234567891': { 
    name: '可口可乐', 
    brand: '可口可乐', 
    category: '饮品', 
    specification: '330ml', 
    unit: '罐', 
    price: 3.50,
    imageUrl: 'https://img.alicdn.com/imgextra/i1/2200724907121/O1CN01ZQxXMR1h6Cgb1m3sG_!!2200724907121.jpg'
  },
  '6901234567892': { name: '可口可乐', brand: '可口可乐', category: '饮品', specification: '500ml', unit: '瓶', price: 4.50 },
  '6924187221089': { 
    name: '可口可乐', 
    brand: '可口可乐', 
    category: '饮品', 
    specification: '500ml', 
    unit: '瓶', 
    price: 3.50,
    imageUrl: 'https://img.alicdn.com/imgextra/i3/2200724907121/O1CN01vC5pQZ1h6CgZYz8bQ_!!2200724907121.jpg'
  },
  '6901939621103': { name: '可口可乐', brand: '可口可乐', category: '饮品', specification: '330ml', unit: '罐', price: 2.50 },
  
  // 百事可乐系列
  '6902083881281': { 
    name: '百事可乐', 
    brand: '百事', 
    category: '饮品', 
    specification: '500ml', 
    unit: '瓶', 
    price: 3.50,
    imageUrl: 'https://img.alicdn.com/imgextra/i4/2200724907121/O1CN01Mv5DvS1h6CgWz8MfN_!!2200724907121.jpg'
  },
  '6924187221082': { name: '百事可乐', brand: '百事', category: '饮品', specification: '500ml', unit: '瓶', price: 3.50 },
  
  // 统一系列
  '6921168509256': { 
    name: '统一冰红茶', 
    brand: '统一', 
    category: '饮品', 
    specification: '500ml', 
    unit: '瓶', 
    price: 3.00,
    imageUrl: 'https://img.alicdn.com/imgextra/i2/2200724907121/O1CN01R5vPzK1h6CgVZv3fV_!!2200724907121.jpg'
  },
  '6921168509027': { 
    name: '统一绿茶', 
    brand: '统一', 
    category: '饮品', 
    specification: '500ml', 
    unit: '瓶', 
    price: 3.00,
    imageUrl: 'https://img.alicdn.com/imgextra/i3/2200724907121/O1CN01J7t4tR1h6CgXqR3yP_!!2200724907121.jpg'
  },
  '6921168509287': { name: '统一鲜橙多', brand: '统一', category: '饮品', specification: '500ml', unit: '瓶', price: 3.00 },
  
  // 康师傅系列
  '6920248161223': { 
    name: '康师傅红烧牛肉面', 
    brand: '康师傅', 
    category: '方便食品', 
    specification: '桶装', 
    unit: '桶', 
    price: 4.50,
    imageUrl: 'https://img.alicdn.com/imgextra/i1/2200724907121/O1CN01yZ5YtS1h6CgWz9YdP_!!2200724907121.jpg'
  },
  '6920248161230': { name: '康师傅老坛酸菜牛肉面', brand: '康师傅', category: '方便食品', specification: '桶装', unit: '桶', price: 4.50 },
  '6920248161247': { name: '康师傅香辣牛肉面', brand: '康师傅', category: '方便食品', specification: '桶装', unit: '桶', price: 4.50 },
  
  // 旺旺系列
  '6920734800101': { 
    name: '旺旺雪饼', 
    brand: '旺旺', 
    category: '零食', 
    specification: '150g', 
    unit: '包', 
    price: 8.50,
    imageUrl: 'https://img.alicdn.com/imgextra/i4/2200724907121/O1CN01PKqXMO1h6CgTZRKbN_!!2200724907121.jpg'
  },
  '6920734800118': { name: '旺旺仙贝', brand: '旺旺', category: '零食', specification: '150g', unit: '包', price: 8.50 },
  '6920734800125': { name: '旺旺小小酥', brand: '旺旺', category: '零食', specification: '70g', unit: '包', price: 5.50 },
  
  // 维达纸巾
  '6902367288888': { name: '维达抽纸', brand: '维达', category: '日用品', specification: '100抽', unit: '包', price: 12.90 },
  '6902367288889': { name: '维达抽纸', brand: '维达', category: '日用品', specification: '3包装', unit: '组', price: 35.00 },
  
  // 蒙牛系列
  '6923644210898': { 
    name: '蒙牛纯牛奶', 
    brand: '蒙牛', 
    category: '乳制品', 
    specification: '250ml', 
    unit: '盒', 
    price: 3.50,
    imageUrl: 'https://img.alicdn.com/imgextra/i2/2200724907121/O1CN01F8Y1Pq1h6CgXqQZvS_!!2200724907121.jpg'
  },
  '6923644210904': { name: '蒙牛纯牛奶', brand: '蒙牛', category: '乳制品', specification: '250ml×12', unit: '箱', price: 45.00 },
  
  // 伊利系列
  '6937134300010': { 
    name: '伊利纯牛奶', 
    brand: '伊利', 
    category: '乳制品', 
    specification: '250ml', 
    unit: '盒', 
    price: 3.50,
    imageUrl: 'https://img.alicdn.com/imgextra/i3/2200724907121/O1CN01K5vPzK1h6CgVZv4gV_!!2200724907121.jpg'
  },
  
  // 乐事薯片
  '6925303771038': { 
    name: '乐事薯片原味', 
    brand: '乐事', 
    category: '零食', 
    specification: '70g', 
    unit: '袋', 
    price: 8.00,
    imageUrl: 'https://img.alicdn.com/imgextra/i1/2200724907121/O1CN01ZQxXMS1h6Cgb1m2Yd_!!2200724907121.jpg'
  },
  '6925303771045': { name: '乐事薯片黄瓜味', brand: '乐事', category: '零食', specification: '70g', unit: '袋', price: 8.00 },
  
  // 奥利奥
  '6921168507111': { 
    name: '奥利奥原味饼干', 
    brand: '奥利奥', 
    category: '零食', 
    specification: '116g', 
    unit: '盒', 
    price: 12.90,
    imageUrl: 'https://img.alicdn.com/imgextra/i4/2200724907121/O1CN01PKqXMR1h6CgTZRL3y_!!2200724907121.jpg'
  },
  
  // 红牛
  '6916283800015': { 
    name: '红牛维生素功能饮料', 
    brand: '红牛', 
    category: '饮品', 
    specification: '250ml', 
    unit: '罐', 
    price: 6.00,
    imageUrl: 'https://img.alicdn.com/imgextra/i2/2200724907121/O1CN01R5vPzJ1h6CgVZv2Xq_!!2200724907121.jpg'
  },
  
  // 王老吉
  '6902391921088': { 
    name: '王老吉凉茶', 
    brand: '王老吉', 
    category: '饮品', 
    specification: '310ml', 
    unit: '罐', 
    price: 5.00,
    imageUrl: 'https://img.alicdn.com/imgextra/i3/2200724907121/O1CN01J7t4tQ1h6CgXqR2Xq_!!2200724907121.jpg'
  },
  
  // 加多宝
  '6902083810512': { name: '加多宝凉茶', brand: '加多宝', category: '饮品', specification: '310ml', unit: '罐', price: 5.00 },
  
  // 测试用条码
  '6901234567890': { name: '农夫山泉矿泉水', brand: '农夫山泉', category: '饮品', specification: '550ml', unit: '瓶', price: 2.00 },
  '6901234567893': { name: '康师傅红烧牛肉面', brand: '康师傅', category: '方便食品', specification: '桶装', unit: '桶', price: 4.50 },
  '6901234567894': { name: '乐事薯片原味', brand: '乐事', category: '零食', specification: '70g', unit: '袋', price: 8.00 },
  '6901234567895': { name: '奥利奥饼干', brand: '奥利奥', category: '零食', specification: '116g', unit: '盒', price: 12.90 },
};

// 条码长度验证
function isValidBarcode(barcode: string): boolean {
  return /^\d{8}$|^\d{12}$|^\d{13}$/.test(barcode);
}

// ========== 免费条码查询API集成 ==========
// 注意：以下API需要在系统设置页面配置密钥后方可使用
// 配置入口：系统设置 -> AI功能配置 -> 条码识别API
// 山海云端API: https://api.yyy001.com 注册后获取API Key
// RollToolsApi: https://www.mxnzp.com 注册后获取app_id和app_secret
// 万维易源: https://www.showapi.com 注册后获取app_id和app_secret

// 获取API配置（从配置存储读取，优先级高于环境变量）
async function getApiKeyConfig(): Promise<{
  shanhaiyunApiKey?: string;
  rolltoolsAppId?: string;
  rolltoolsAppSecret?: string;
  tencentSecretId?: string;
  tencentSecretKey?: string;
  showapiAppKey?: string;
}> {
  // 从配置存储读取（异步）
  const config = await getApiConfig();
  
  // 如果配置存储有值，使用配置存储的值
  if (config.shanhaiyunApiKey || config.rolltoolsAppId || config.tencentSecretId || config.showapiAppKey) {
    return config;
  }
  
  // 降级到环境变量
  return {
    shanhaiyunApiKey: process.env.SHANHAIYUN_API_KEY,
    rolltoolsAppId: process.env.ROLLTOOLS_APP_ID,
    rolltoolsAppSecret: process.env.ROLLTOOLS_APP_SECRET,
    tencentSecretId: process.env.TENCENT_SECRET_ID,
    tencentSecretKey: process.env.TENCENT_SECRET_KEY,
    showapiAppKey: process.env.SHOWAPI_APP_KEY,
  };
}

// 山海云端API - 完全免费（需要apikey）
// 文档：https://api.yyy001.com 或 https://apione.apibyte.cn
// API Key通过URL参数key传入，或通过Header Authorization: Bearer {key}传入
async function queryShanhaiyunAPI(barcode: string, apiKey: string): Promise<Partial<ProductInfo> | null> {
  if (!apiKey || apiKey === 'your_api_key_here' || apiKey === '') {
    console.log('[scan-barcode] 山海云端API未配置apikey，跳过');
    return null;
  }
  
  try {
    // 打印调试信息（隐藏部分key）
    const maskedKey = apiKey.length > 6 ? `${apiKey.substring(0, 4)}***${apiKey.substring(apiKey.length - 2)}` : '***';
    console.log(`[scan-barcode] 准备调用山海云端API, barcode: ${barcode}, apiKey: ${maskedKey}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    // 优先使用新API地址 apione.apibyte.cn（响应格式更规范）
    // 支持两种认证方式：URL参数key 或 Header Authorization
    const apiUrl = `https://apione.apibyte.cn/api/barcode?barcode=${barcode}&key=${apiKey}`;
    console.log(`[scan-barcode] 山海云端请求URL: https://apione.apibyte.cn/api/barcode?barcode=${barcode}&key=${maskedKey}`);
    
    const startTime = Date.now();
    let response = await fetch(apiUrl, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    let elapsed = Date.now() - startTime;
    
    console.log(`[scan-barcode] 山海云端API(apibyte)响应状态: ${response.status}, 耗时: ${elapsed}ms`);
    
    // 如果新地址失败，降级到旧地址
    if (!response.ok) {
      console.log('[scan-barcode] 新API地址失败，尝试旧地址 api.yyy001.com...');
      const oldUrl = `https://api.yyy001.com/api/barcode?barcode=${barcode}&apikey=${apiKey}`;
      const startTime2 = Date.now();
      response = await fetch(oldUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      elapsed = Date.now() - startTime2;
      console.log(`[scan-barcode] 山海云端API(yyy001)响应状态: ${response.status}, 耗时: ${elapsed}ms`);
    }
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log('[scan-barcode] 山海云端API响应失败:', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('[scan-barcode] 山海云端API响应:', JSON.stringify(data));
    
    // 解析新API响应格式 (apibyte.cn)
    // 成功: { "code": 200, "msg": "success", "data": { "found": true, "goods_name": "...", ... } }
    if (data && data.code === 200 && data.data) {
      const productData = data.data;
      if (productData.found && productData.goods_name) {
        console.log('[scan-barcode] 山海云端API识别成功:', productData.goods_name);
        return {
          name: productData.goods_name || '',
          brand: productData.brand || '',
          category: productData.category || '其他',
          specification: productData.specification || '',
          unit: '个',
          price: parseFloat(productData.price) || 0,
          manufacturer: productData.company || '',
          imageUrl: productData.image || '',
          description: productData.description || '',
        };
      }
    }
    
    // 解析旧API响应格式 (yyy001.com)
    // 成功: { "code": 200, "msg": "success", "data": {...} }
    if (data && data.data) {
      const productData = data.data;
      if (productData && (productData.name || productData.goodsName || productData.goods_name || productData.productName)) {
        console.log('[scan-barcode] 山海云端API识别成功:', productData.name || productData.goodsName || productData.goods_name);
        return {
          name: productData.name || productData.goodsName || productData.goods_name || productData.productName || '',
          brand: productData.brand || productData.manufacturer || '',
          category: productData.category || '其他',
          specification: productData.specification || productData.spec || productData.standard || '',
          unit: productData.unit || '个',
          price: parseFloat(productData.price) || 0,
          manufacturer: productData.manufacturer || productData.factory || productData.company || '',
          imageUrl: productData.image || productData.imageUrl || '',
        };
      }
    }
    
    // 检查API返回的错误
    if (data.code !== 200 && data.code !== '200') {
      console.log('[scan-barcode] 山海云端API返回错误:', data.msg || data.code, '(code:', data.code, ')');
    }
    
    return null;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('[scan-barcode] 山海云端API超时');
    } else {
      console.log('[scan-barcode] 山海云端API调用失败:', error.message);
    }
    return null;
  }
}

// RollToolsApi - 免费使用（需要app_id和app_secret）
async function queryRollToolsAPI(barcode: string, appId: string, appSecret: string): Promise<Partial<ProductInfo> | null> {
  if (!appId || !appSecret || appId === 'test') {
    console.log('[scan-barcode] RollToolsAPI未配置密钥，跳过');
    return null;
  }
  
  try {
    const url = `https://www.mxnzp.com/api/barcode/details?barcode=${barcode}&app_id=${appId}&app_secret=${appSecret}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    console.log('[scan-barcode] RollToolsAPI响应:', JSON.stringify(data).substring(0, 200));
    
    if (data && data.code === 1 && data.data) {
      const productData = data.data;
      return {
        name: productData.goodsName || productData.name || '',
        brand: productData.brand || '',
        category: productData.category || '其他',
        specification: productData.specification || productData.standard || '',
        unit: productData.unit || '个',
        price: parseFloat(productData.price) || 0,
      };
    }
    
    return null;
  } catch (error: any) {
    console.log('[scan-barcode] RollToolsAPI调用失败:', error.message);
    return null;
  }
}

// 万维易源API - 免费使用（需要AppKey）
// 文档：https://www.showapi.com/apiGateway/view/3125
async function queryShowapiAPI(barcode: string, appKey: string): Promise<Partial<ProductInfo> | null> {
  if (!appKey) {
    console.log('[scan-barcode] 万维易源未配置AppKey，跳过');
    return null;
  }
  
  try {
    // 万维易源商品条码查询接口 - API 3125
    const url = `https://route.showapi.com/3125-1?showapi_appid=${appKey}&code=${barcode}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    console.log('[scan-barcode] 万维易源API响应:', JSON.stringify(data).substring(0, 300));
    
    // 解析万维易源响应格式
    // 成功: { "showapi_res_code": 0, "showapi_res_body": { ... } }
    if (data && data.showapi_res_code === 0 && data.showapi_res_body) {
      const productData = data.showapi_res_body;
      if (productData.ret_code === 0 || productData.data) {
        const item = productData.data || productData;
        return {
          name: item.goodsName || item.name || item.title || '',
          brand: item.brand || item.manufacturer || '',
          category: item.category || item.type || '其他',
          specification: item.spec || item.specification || '',
          unit: item.unit || '个',
          price: parseFloat(item.price) || 0,
          manufacturer: item.manufacturer || item.factory || '',
          imageUrl: item.img || item.image || item.pic || '',
        };
      }
    }
    
    return null;
  } catch (error: any) {
    console.log('[scan-barcode] 万维易源API调用失败:', error.message);
    return null;
  }
}

// ========== 腾讯云AI商品识别 ==========
// 使用腾讯云图像分析API识别商品
// 文档：https://cloud.tencent.com/document/product/865

// 生成腾讯云签名
function generateTencentSignature(secretKey: string, payload: string, timestamp: number): string {
  const crypto = require('crypto');
  const date = new Date(timestamp * 1000).toISOString().split('T')[0];
  const stringToSign = `POST\ntiia.tencentcloudapi.com/\n\n\n${payload}`;
  
  // 计算签名
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(date + stringToSign);
  return hmac.digest('hex');
}

// 腾讯云AI图像识别 - 通过商品图片识别商品信息
async function queryTencentAI(
  imageUrl: string,
  secretId: string,
  secretKey: string
): Promise<Partial<ProductInfo> | null> {
  if (!secretId || !secretKey) {
    console.log('[scan-barcode] 腾讯云未配置密钥，跳过');
    return null;
  }
  
  try {
    console.log('[scan-barcode] 腾讯云AI识别中...');
    
    const crypto = require('crypto');
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.floor(Math.random() * 100000);
    
    // 构建请求体
    const requestBody = {
      ImageUrl: imageUrl,
    };
    const payload = JSON.stringify(requestBody);
    
    // 生成签名
    const date = new Date(timestamp * 1000).toISOString().split('T')[0];
    const stringToSign = `POST\ntiia.tencentcloudapi.com/\n\n\n${payload}`;
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(date + stringToSign);
    const signature = hmac.digest('hex');
    
    // 构建Authorization
    const authorization = `TC3-HMAC-SHA256 Credential=${secretId}/${date}/tiia/tc3_request, SignedHeaders=content-type;host, Signature=${signature}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch('https://tiia.tencentcloudapi.com/', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Host': 'tiia.tencentcloudapi.com',
        'X-TC-Action': 'RecognizeProduct',
        'X-TC-Version': '2019-05-29',
        'X-TC-Region': 'ap-guangzhou',
        'X-TC-Timestamp': timestamp.toString(),
        'X-TC-Nonce': nonce.toString(),
        'Authorization': authorization,
      },
      body: payload,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log('[scan-barcode] 腾讯云API响应失败:', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('[scan-barcode] 腾讯云API响应:', JSON.stringify(data).substring(0, 500));
    
    // 解析腾讯云响应
    if (data.Response && data.Response.Products && data.Response.Products.length > 0) {
      const product = data.Response.Products[0];
      return {
        name: product.Name || product.ProductName || '',
        brand: product.Brand || '',
        category: product.Category || '其他',
        confidence: product.Confidence || 0.8,
        imageUrl: imageUrl,
      };
    }
    
    return null;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('[scan-barcode] 腾讯云API超时');
    } else {
      console.log('[scan-barcode] 腾讯云API调用失败:', error.message);
    }
    return null;
  }
}

// 检查腾讯云是否配置
async function hasTencentConfig(): Promise<boolean> {
  const config = await getApiKeyConfig();
  return !!(config.tencentSecretId && config.tencentSecretKey);
}

// 并行调用多个免费条码API，取最佳结果
async function queryFreeBarcodeAPIs(barcode: string): Promise<{ data: Partial<ProductInfo> | null; source: string }> {
  console.log('[scan-barcode] 检查是否配置了免费条码API...');
  
  // 从配置存储读取API密钥（异步）
  const config = await getApiKeyConfig();
  
  const hasShanhaiyun = !!(config.shanhaiyunApiKey && config.shanhaiyunApiKey !== 'your_api_key_here' && config.shanhaiyunApiKey !== '');
  const hasRollTools = !!(config.rolltoolsAppId && config.rolltoolsAppSecret && config.rolltoolsAppId !== 'test');
  const hasShowapi = !!config.showapiAppKey;
  
  console.log('[scan-barcode] API密钥配置状态:', { 
    hasShanhaiyun, 
    hasRollTools, 
    hasShowapi,
    shanhaiyunKeyLength: config.shanhaiyunApiKey?.length || 0 
  });
  
  if (!hasShanhaiyun && !hasRollTools && !hasShowapi) {
    console.log('[scan-barcode] 未配置有效的免费条码API密钥，跳过此阶段');
    return { data: null, source: '' };
  }
  
  console.log('[scan-barcode] 开始查询免费条码API...', { hasShanhaiyun, hasRollTools, hasShowapi });
  
  // 并行调用配置了密钥的API
  const apiCalls: Promise<Partial<ProductInfo> | null>[] = [];
  const apiNames: string[] = [];
  
  if (hasShanhaiyun) {
    apiCalls.push(queryShanhaiyunAPI(barcode, config.shanhaiyunApiKey!));
    apiNames.push('山海云端API');
  }
  
  if (hasRollTools) {
    apiCalls.push(queryRollToolsAPI(barcode, config.rolltoolsAppId!, config.rolltoolsAppSecret!));
    apiNames.push('RollToolsAPI');
  }
  
  if (hasShowapi) {
    apiCalls.push(queryShowapiAPI(barcode, config.showapiAppKey!));
    apiNames.push('万维易源');
  }
  
  const results = await Promise.allSettled(apiCalls);
  
  // 返回第一个成功的结果
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled' && result.value) {
      console.log(`[scan-barcode] ${apiNames[i]}命中`);
      return { data: result.value, source: apiNames[i] };
    }
  }
  
  console.log('[scan-barcode] 免费条码API均未命中');
  return { data: null, source: '' };
}

// 搜索商品图片
async function searchProductImage(productName: string, brand: string, searchClient: SearchClient): Promise<string | undefined> {
  try {
    const imageQuery = `${brand} ${productName} 商品图片`;
    const response = await searchClient.webSearch(imageQuery, 3, false);
    
    if (response.web_items && response.web_items.length > 0) {
      // 尝试从搜索结果中提取图片URL
      for (const item of response.web_items) {
        // 检查是否有图片URL字段（使用类型断言）
        const anyItem = item as any;
        const imageUrl = anyItem.image_url || anyItem.imageUrl || anyItem.pic_url || anyItem.img;
        if (imageUrl) {
          return imageUrl;
        }
        // 检查snippet中是否有图片URL
        if (item.snippet) {
          const imgMatch = item.snippet.match(/https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/i);
          if (imgMatch) {
            return imgMatch[0];
          }
        }
      }
    }
    
    return undefined;
  } catch (error) {
    console.log('[scan-barcode] Image search failed:', error);
    return undefined;
  }
}

// 使用LLM解析搜索结果
async function parseWithLLM(barcode: string, searchResults: any[], customHeaders: Record<string, string>): Promise<Partial<ProductInfo>> {
  try {
    const config = new Config();
    const llmClient = new LLMClient(config, customHeaders);
    
    // 构建搜索结果摘要
    const resultsText = searchResults
      .slice(0, 5)
      .map((item, i) => `${i + 1}. 标题: ${item.title}\n   摘要: ${item.snippet || '无'}`)
      .join('\n\n');
    
    const systemPrompt = `你是商品条码识别助手。根据网页搜索结果，提取商品真实信息。

重要提示：
- 搜索结果可能不包含具体商品信息，只是条码相关知识文章
- 如果搜索结果的标题或摘要中没有提到具体商品名称、品牌，请直接返回空值
- 不要猜测或编造商品信息

规则：
1. 仔细阅读搜索结果的标题和摘要
2. 如果搜索结果提到条码${barcode}对应的具体商品（如"农夫山泉"、"可口可乐"等），请提取出来
3. 如果搜索结果只是关于条码知识的通用文章，没有具体商品信息，name返回空字符串
4. 商品名称要简洁，去掉无关词（如"价格"、"查询"、"购买"等）
5. 品牌要准确，如果不确定则留空
6. 规格格式如：500ml、100g、500ml×12等
7. 单位是单个商品的单位：瓶、罐、袋、盒、桶等
8. 分类只能是：饮品、零食、日用品、生鲜、方便食品、乳制品、其他

返回JSON格式：
{
  "name": "商品名称（找不到留空）",
  "brand": "品牌",
  "category": "分类",
  "specification": "规格",
  "unit": "单位",
  "price": 参考价格(数字),
  "manufacturer": "生产厂家"
}

只返回JSON，不要其他文字。`;

    const userPrompt = `条码: ${barcode}

搜索结果：
${resultsText}

请提取商品信息。`;

    const response = await llmClient.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      model: 'doubao-seed-2-0-lite-260215',
      temperature: 0.1,
    });
    
    console.log('[scan-barcode] LLM response:', response.content);
    
    // 解析JSON
    const content = response.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        name: parsed.name || '',
        brand: parsed.brand || '',
        category: parsed.category || '其他',
        specification: parsed.specification || '',
        unit: parsed.unit || '个',
        price: parsed.price || 0,
        manufacturer: parsed.manufacturer || '',
      };
    }
    
    return {};
  } catch (error) {
    console.error('[scan-barcode] LLM parse error:', error);
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const { barcode } = await request.json();

    if (!barcode) {
      return NextResponse.json(
        { error: '请提供商品条码' },
        { status: 400 }
      );
    }

    // 验证条码格式
    if (!isValidBarcode(barcode)) {
      return NextResponse.json({
        success: true,
        data: {
          barcode,
          name: '',
          category: '其他',
          unit: '个',
          confidence: 0,
        },
      });
    }

    // ========== 第一阶段：查询本系统商品库 ==========
    let libraryProduct: Partial<ProductInfo> | null = null;
    let librarySource: string | null = null;
    
    // 1.1 检查本地缓存
    const cachedProduct = localProducts[barcode];
    if (cachedProduct && cachedProduct.name) {
      console.log('[scan-barcode] 本地商品库命中:', barcode);
      libraryProduct = cachedProduct;
      librarySource = 'local';
    }
    
    // 1.2 查询总部商品库
    if (!libraryProduct) {
      try {
        const baseUrl = process.env.DEPLOY_RUN_PORT ? 'http://localhost:5000' : '';
        const headquartersResponse = await fetch(`${baseUrl}/api/headquarters/products/?barcode=${barcode}`);
        if (headquartersResponse.ok) {
          const headquartersData = await headquartersResponse.json();
          if (headquartersData.success && headquartersData.data) {
            console.log('[scan-barcode] 总部商品库命中:', barcode);
            libraryProduct = {
              name: headquartersData.data.name,
              brand: headquartersData.data.brand,
              category: headquartersData.data.category,
              specification: headquartersData.data.specification,
              unit: headquartersData.data.unit,
              price: headquartersData.data.suggestedPrice,
              imageUrl: headquartersData.data.imageUrl,
              manufacturer: headquartersData.data.manufacturer,
            };
            librarySource = 'headquarters';
          }
        }
      } catch (e) {
        console.log('[scan-barcode] 总部商品库查询失败:', e);
      }
    }

    // ========== 第二阶段：检查商品库信息是否完整 ==========
    // 完整性检查：核心字段是否齐全（名称、品牌、规格、图片）
    const checkCompleteness = (product: Partial<ProductInfo> | null): { isComplete: boolean; missingFields: string[] } => {
      if (!product || !product.name) {
        return { isComplete: false, missingFields: ['name'] };
      }
      
      const missingFields: string[] = [];
      if (!product.brand) missingFields.push('brand');
      if (!product.specification) missingFields.push('specification');
      if (!product.imageUrl) missingFields.push('imageUrl');
      if (!product.category) missingFields.push('category');
      
      return { 
        isComplete: missingFields.length === 0, 
        missingFields 
      };
    };

    const completeness = checkCompleteness(libraryProduct);
    
    // 如果商品库信息完整，直接返回
    if (completeness.isComplete && libraryProduct) {
      console.log('[scan-barcode] 商品库信息完整，直接返回');
      return NextResponse.json({
        success: true,
        data: {
          barcode,
          name: libraryProduct.name,
          brand: libraryProduct.brand,
          category: libraryProduct.category,
          specification: libraryProduct.specification,
          unit: libraryProduct.unit || '个',
          price: libraryProduct.price || 0,
          imageUrl: libraryProduct.imageUrl,
          manufacturer: libraryProduct.manufacturer || '',
          confidence: 0.95,
          source: librarySource,
          sourceLabel: librarySource === 'local' ? '本地商品库' : '总部商品库',
        },
      });
    }

    // ========== 第三阶段：商品库未命中，查询免费条码API ==========
    let apiProduct: Partial<ProductInfo> | null = null;
    let apiSource: string = '';
    
    if (!libraryProduct?.name) {
      console.log('[scan-barcode] 商品库未命中，查询免费条码API...');
      const apiResult = await queryFreeBarcodeAPIs(barcode);
      apiProduct = apiResult.data;
      apiSource = apiResult.source;
    }

    // 获取自定义headers和搜索客户端（用于后续阶段）
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const searchClient = new SearchClient(config, customHeaders);

    // ========== 第四阶段：腾讯云AI识别（补充图片信息） ==========
    // 如果已有商品信息但没有图片，且配置了腾讯云，尝试AI识别获取图片
    const tencentConfig = await getApiKeyConfig();
    const hasTencent = !!(tencentConfig.tencentSecretId && tencentConfig.tencentSecretKey);
    
    if (hasTencent && libraryProduct?.name && !libraryProduct.imageUrl) {
      console.log('[scan-barcode] 尝试腾讯云AI识别获取商品图片...');
      try {
        // 先搜索商品图片
        const searchImageUrl = await searchProductImage(
          libraryProduct.name,
          libraryProduct.brand || '',
          searchClient
        );
        
        if (searchImageUrl) {
          const tencentResult = await queryTencentAI(
            searchImageUrl,
            tencentConfig.tencentSecretId!,
            tencentConfig.tencentSecretKey!
          );
          
          if (tencentResult) {
            libraryProduct = {
              ...libraryProduct,
              imageUrl: searchImageUrl,
              confidence: tencentResult.confidence,
            };
            console.log('[scan-barcode] 腾讯云AI识别成功，补充图片信息');
          }
        }
      } catch (e) {
        console.log('[scan-barcode] 腾讯云AI识别失败:', e);
      }
    }

    // ========== 第五阶段：免费API也未命中，调用大数据识别 ==========
    let bigDataResult: Partial<ProductInfo> = {};
    
    // 如果商品库和免费API都没有有效结果，才调用大数据搜索
    if (!libraryProduct?.name && !apiProduct?.name) {
      console.log('[scan-barcode] 免费API未命中，启动大数据识别...');
      
      // 多种搜索策略查询大数据，使用更精确的关键词
      // 策略说明：不同的搜索词可能返回不同的结果
      const searchQueries = [
        `"${barcode}"`,  // 精确匹配条码
        `${barcode} 商品`,  // 条码+商品
        `${barcode} 价格`,  // 条码+价格（购物网站常见）
      ];

      let allResults: any[] = [];

      for (const query of searchQueries) {
        try {
          console.log(`[scan-barcode] 搜索关键词: ${query}`);
          const response = await searchClient.webSearch(query, 5, false);
          if (response.web_items && response.web_items.length > 0) {
            console.log(`[scan-barcode] 搜索 ${query} 返回 ${response.web_items.length} 条`);
            allResults = [...allResults, ...response.web_items];
          }
        } catch (e) {
          console.log('[scan-barcode] 大数据搜索失败:', query, e);
        }
      }

      // 去重，优先保留包含条码的结果
      const seen = new Set<string>();
      const uniqueResults = allResults.filter((item) => {
        const key = item.title || item.url;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).sort((a, b) => {
        // 包含条码的结果排在前面
        const aHasBarcode = `${a.title} ${a.snippet}`.includes(barcode) ? 1 : 0;
        const bHasBarcode = `${b.title} ${b.snippet}`.includes(barcode) ? 1 : 0;
        return bHasBarcode - aHasBarcode;
      }).slice(0, 8);

      console.log('[scan-barcode] 大数据搜索结果数量:', uniqueResults.length);
      
      // 打印搜索结果详情用于调试
      uniqueResults.forEach((item, i) => {
        console.log(`[scan-barcode] 搜索结果${i + 1}:`, JSON.stringify({
          title: item.title?.substring(0, 100),
          snippet: item.snippet?.substring(0, 150),
          url: item.url?.substring(0, 80)
        }));
      });

      // 使用LLM解析大数据结果
      if (uniqueResults.length > 0) {
        bigDataResult = await parseWithLLM(barcode, uniqueResults, customHeaders);
        console.log('[scan-barcode] LLM解析结果:', JSON.stringify(bigDataResult));
      } else {
        console.log('[scan-barcode] 没有找到搜索结果');
      }
    }

    // ========== 第五阶段：合并所有来源信息 ==========
    // 优先级：商品库 > 免费API > 大数据识别
    const mergedProduct: ProductInfo = {
      barcode,
      name: libraryProduct?.name || apiProduct?.name || bigDataResult.name || '',
      brand: libraryProduct?.brand || apiProduct?.brand || bigDataResult.brand || '',
      category: libraryProduct?.category || apiProduct?.category || bigDataResult.category || '其他',
      specification: libraryProduct?.specification || apiProduct?.specification || bigDataResult.specification || '',
      unit: libraryProduct?.unit || apiProduct?.unit || bigDataResult.unit || '个',
      price: libraryProduct?.price || apiProduct?.price || bigDataResult.price || 0,
      manufacturer: libraryProduct?.manufacturer || apiProduct?.manufacturer || bigDataResult.manufacturer || '',
      imageUrl: libraryProduct?.imageUrl || '',
      confidence: 0,
    };

    // 如果没有图片，尝试搜索
    if (!mergedProduct.imageUrl && mergedProduct.name && mergedProduct.brand) {
      console.log('[scan-barcode] 搜索商品图片...');
      mergedProduct.imageUrl = await searchProductImage(mergedProduct.name, mergedProduct.brand, searchClient);
    }

    // 计算置信度和来源标签
    const sourceLabels: string[] = [];
    let confidence = 0;

    if (libraryProduct?.name) {
      sourceLabels.push(librarySource === 'local' ? '本地商品库' : '总部商品库');
      confidence = 0.95;
      // 有补充信息则略降置信度但增加来源
      if (apiProduct?.name || bigDataResult.name) {
        confidence = 0.90;
      }
    } else if (apiProduct?.name) {
      sourceLabels.push(apiSource);
      confidence = 0.85;
      if (bigDataResult.name) {
        confidence = 0.80;
      }
    } else if (bigDataResult.name) {
      sourceLabels.push('大数据识别');
      confidence = 0.70;
    }

    // 补充来源标签
    if (!libraryProduct?.name && !apiProduct?.name && bigDataResult.name) {
      sourceLabels.push('大数据识别');
    } else if (!libraryProduct?.name && apiProduct?.name && bigDataResult.name) {
      sourceLabels.push('大数据识别');
    }

    const sourceLabel = sourceLabels.length > 0 ? sourceLabels.join(' + ') : '未知';

    console.log('[scan-barcode] 最终识别结果:', {
      name: mergedProduct.name,
      brand: mergedProduct.brand,
      specification: mergedProduct.specification,
      hasImage: !!mergedProduct.imageUrl,
      confidence,
      sourceLabel,
    });

    return NextResponse.json({
      success: true,
      data: {
        barcode: mergedProduct.barcode,
        name: mergedProduct.name,
        brand: mergedProduct.brand,
        category: mergedProduct.category,
        specification: mergedProduct.specification,
        unit: mergedProduct.unit,
        price: mergedProduct.price,
        manufacturer: mergedProduct.manufacturer,
        imageUrl: mergedProduct.imageUrl,
        confidence,
        source: librarySource || (apiSource ? 'barcode_api' : 'bigdata'),
        sourceLabel,
      },
    });

  } catch (error) {
    console.error('[scan-barcode] Error:', error);
    
    // 返回空结构，让用户手动填写
    return NextResponse.json({
      success: true,
      data: {
        barcode: 'unknown',
        name: '',
        category: '其他',
        unit: '个',
        confidence: 0,
      },
    });
  }
}
