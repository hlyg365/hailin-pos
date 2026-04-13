import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getApiConfig } from '@/lib/api-config-store';

export const dynamic = 'force-dynamic';

// 商品识别结果接口
interface RecognizedProduct {
  name: string;
  confidence: number;
  category?: string;
  price?: number;
  unit?: string;
  description?: string;
  brand?: string;
  source?: string;  // 数据来源：学习库 / 总部商品库 / AI识别
  matchedFromLibrary?: boolean;  // 是否从商品库匹配
  matchedFromLearning?: boolean; // 是否从学习库匹配
}

// 总部商品库商品接口
interface HeadquartersProduct {
  id: string;
  barcode: string;
  name: string;
  brand?: string;
  category: string;
  specification?: string;
  unit: string;
  suggestedPrice: number;
  description?: string;
  manufacturer?: string;
  status: 'active' | 'inactive' | 'pending_review';
}

// 学习库商品接口
interface LearnedProduct {
  id: string;
  imageUrl: string;
  imageHash: string;
  name: string;
  brand?: string;
  category: string;
  specification?: string;
  unit: string;
  price?: number;
  description?: string;
  matchCount: number;
  source: string;
  originalMethod?: string;
  confidence: number;
}

// 非标品商品接口
interface NonStandardProduct {
  id: string;
  name: string;
  brand?: string;
  category: string;
  subCategory?: string;
  unit: string;
  price: number;
  pricingUnit: string;
  imageUrl: string;
  imageHash: string;
  tags: string[];
  keywords: string[];
  matchCount: number;
  status: string;
}

// ========== 非标品匹配 ==========

// 查询非标品库（按图片URL或名称匹配）
async function searchNonStandardProducts(imageUrl: string, productName?: string): Promise<NonStandardProduct | null> {
  try {
    const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'http://localhost:5000';
    
    // 先按图片URL查询
    const imageResponse = await fetch(`${baseUrl}/api/products/non-standard/?imageUrl=${encodeURIComponent(imageUrl)}`);
    const imageData = await imageResponse.json();
    
    if (imageData.success && imageData.matched && imageData.data) {
      console.log(`[recognize-image] 非标品库命中(图片): ${imageData.data.name}`);
      return imageData.data;
    }
    
    // 如果有商品名称，按名称查询
    if (productName) {
      const nameResponse = await fetch(`${baseUrl}/api/products/non-standard/?name=${encodeURIComponent(productName)}`);
      const nameData = await nameResponse.json();
      
      if (nameData.success && nameData.data && nameData.data.length > 0) {
        // 返回匹配度最高的
        const matched = nameData.data[0];
        console.log(`[recognize-image] 非标品库命中(名称): ${matched.name}`);
        return matched;
      }
    }
    
    return null;
  } catch (error) {
    console.log('[recognize-image] 查询非标品库失败:', error);
    return null;
  }
}

// ========== 自我学习系统 ==========

// 查询学习库（按图片URL匹配）
async function searchLearningLibrary(imageUrl: string): Promise<LearnedProduct | null> {
  try {
    const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'http://localhost:5000';
    const response = await fetch(`${baseUrl}/api/learning/products/?imageUrl=${encodeURIComponent(imageUrl)}`);
    const data = await response.json();
    
    if (data.success && data.matched && data.data) {
      console.log(`[recognize-image] 学习库命中: ${data.data.name} (已匹配${data.data.matchCount}次)`);
      return data.data;
    }
    return null;
  } catch (error) {
    console.log('[recognize-image] 查询学习库失败:', error);
    return null;
  }
}

// 学习新商品（添加到学习库）
async function learnProduct(imageUrl: string, product: RecognizedProduct, method: string): Promise<void> {
  try {
    // 只学习非商品库匹配的结果
    if (product.matchedFromLibrary) {
      return;
    }
    
    const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'http://localhost:5000';
    await fetch(`${baseUrl}/api/learning/products/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl,
        name: product.name,
        brand: product.brand,
        category: product.category,
        unit: product.unit,
        price: product.price,
        description: product.description,
        source: 'ai_recognition',
        originalMethod: method,
        confidence: product.confidence,
      }),
    });
    
    console.log(`[recognize-image] 商品已学习: ${product.name}`);
  } catch (error) {
    console.log('[recognize-image] 学习商品失败:', error);
  }
}

// 获取学习统计
async function getLearningStats(): Promise<{
  totalLearned: number;
  totalMatches: number;
  aiCallsSaved: number;
}> {
  try {
    const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'http://localhost:5000';
    const response = await fetch(`${baseUrl}/api/learning/products/?stats=true`);
    const data = await response.json();
    
    if (data.success && data.data) {
      return {
        totalLearned: data.data.totalLearned || 0,
        totalMatches: data.data.totalMatches || 0,
        aiCallsSaved: data.data.aiCallsSaved || 0,
      };
    }
    return { totalLearned: 0, totalMatches: 0, aiCallsSaved: 0 };
  } catch (error) {
    return { totalLearned: 0, totalMatches: 0, aiCallsSaved: 0 };
  }
}

// ========== 总部商品库匹配 ==========

// 查询总部商品库（按名称模糊匹配）
async function searchHeadquartersProducts(name: string): Promise<HeadquartersProduct[]> {
  try {
    const response = await fetch(`${process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'http://localhost:5000'}/api/headquarters/products?name=${encodeURIComponent(name)}`);
    const data = await response.json();
    
    if (data.success && data.data) {
      // 返回的是数组（模糊查询结果）
      return Array.isArray(data.data) ? data.data : [data.data];
    }
    return [];
  } catch (error) {
    console.log('[recognize-image] 查询总部商品库失败:', error);
    return [];
  }
}

// 用AI识别结果匹配总部商品库
async function matchWithLibrary(aiResults: RecognizedProduct[]): Promise<RecognizedProduct[]> {
  const matchedResults: RecognizedProduct[] = [];
  
  for (const product of aiResults) {
    // 优先用品牌名称搜索（更准确）
    let libraryProducts: HeadquartersProduct[] = [];
    
    if (product.brand) {
      // 先用品牌搜索
      libraryProducts = await searchHeadquartersProducts(product.brand);
    }
    
    // 如果品牌没匹配到，用商品名称搜索
    if (libraryProducts.length === 0) {
      // 尝试用名称的前几个关键词搜索
      const nameParts = product.name.split(/[\s-]/);
      for (const part of nameParts) {
        if (part.length >= 2) {  // 至少2个字符的关键词
          libraryProducts = await searchHeadquartersProducts(part);
          if (libraryProducts.length > 0) break;
        }
      }
    }
    
    // 如果还是没有结果，用完整名称搜索
    if (libraryProducts.length === 0 && product.name.length >= 2) {
      libraryProducts = await searchHeadquartersProducts(product.name);
    }
    
    if (libraryProducts.length > 0) {
      // 找到匹配的商品，使用总部商品库的信息
      const matched = libraryProducts[0];  // 取第一个匹配结果
      matchedResults.push({
        name: matched.name,
        confidence: 0.98,  // 商品库匹配置信度高
        category: matched.category,
        price: matched.suggestedPrice,
        unit: matched.unit,
        brand: matched.brand,
        description: matched.description,
        source: '总部商品库',
        matchedFromLibrary: true,
      });
      console.log(`[recognize-image] 商品库匹配成功: ${product.name} -> ${matched.name}`);
    } else {
      // 没有匹配，使用AI识别结果
      matchedResults.push({
        ...product,
        source: 'AI识别',
        matchedFromLibrary: false,
      });
    }
  }
  
  return matchedResults;
}

// 万维易源图像识别API（API 1847 - 通用图像打标）
// 文档：https://www.showapi.com/apiGateway/view/1847
async function recognizeByShowapi(imageUrl: string, appKey: string): Promise<RecognizedProduct[]> {
  if (!appKey) {
    console.log('[recognize-image] 万维易源未配置AppKey，跳过');
    return [];
  }

  try {
    console.log('[recognize-image] 万维易源AI识别中...');
    
    // 万维易源图像识别API - API 1847
    const url = `https://route.showapi.com/1847-1?showapi_appid=${appKey}&url=${encodeURIComponent(imageUrl)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log('[recognize-image] 万维易源API响应失败:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('[recognize-image] 万维易源API响应:', JSON.stringify(data).substring(0, 500));
    
    // 解析万维易源响应格式
    // 成功: { "showapi_res_code": 0, "showapi_res_body": { "labels": [...] } }
    if (data && data.showapi_res_code === 0 && data.showapi_res_body) {
      const labels = data.showapi_res_body.labels || [];
      
      // 转换为商品识别结果
      const products: RecognizedProduct[] = labels.map((label: any, index: number) => ({
        name: label.name || label.label || '未知商品',
        confidence: label.score || label.confidence || (1 - index * 0.1),
        category: label.category || getCategoryFromLabel(label.name || label.label || ''),
        description: label.description || '',
      }));
      
      // 过滤低置信度结果
      return products.filter(p => p.confidence >= 0.3);
    }
    
    return [];
  } catch (error: any) {
    console.log('[recognize-image] 万维易源API调用失败:', error.message);
    return [];
  }
}

// 万维易源商品识别API（API 1754-16 - 商品识别标准版）
// 文档：https://www.showapi.com/apiGateway/view/1754
async function recognizeByShowapiProduct(imageUrl: string, appKey: string, imageBase64?: string): Promise<RecognizedProduct[]> {
  if (!appKey) {
    console.log('[recognize-image] 万维易源商品识别未配置AppKey，跳过');
    return [];
  }

  try {
    console.log('[recognize-image] 万维易源商品识别AI识别中...');
    
    // 万维易源商品识别API - API 1754-16
    const url = `https://route.showapi.com/1754-16?appKey=${appKey}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    // 构建请求体
    const formData = new URLSearchParams();
    if (imageBase64) {
      formData.append('img_base64', imageBase64);
    } else if (imageUrl) {
      formData.append('img_url', imageUrl);
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log('[recognize-image] 万维易源商品识别API响应失败:', response.status);
      return [];
    }
    
    const data = await response.json();
    console.log('[recognize-image] 万维易源商品识别API响应:', JSON.stringify(data).substring(0, 500));
    
    // 解析万维易源商品识别响应格式
    // 成功: { "showapi_res_code": 0, "showapi_res_body": { "list": [...] } }
    if (data && data.showapi_res_code === 0 && data.showapi_res_body) {
      const list = data.showapi_res_body.list || [];
      
      // 转换为商品识别结果
      const products: RecognizedProduct[] = list.map((item: any, index: number) => ({
        name: item.name || item.goods_name || '未知商品',
        confidence: item.score || item.confidence || (1 - index * 0.1),
        category: item.category || getCategoryFromLabel(item.name || ''),
        description: item.description || '',
        brand: item.brand || '',
      }));
      
      // 过滤低置信度结果
      return products.filter(p => p.confidence >= 0.3);
    }
    
    // 如果返回错误码，记录详细信息
    if (data && data.showapi_res_code !== 0) {
      console.log('[recognize-image] 万维易源商品识别API错误:', data.showapi_res_error || data.showapi_res_code);
    }
    
    return [];
  } catch (error: any) {
    console.log('[recognize-image] 万维易源商品识别API调用失败:', error.message);
    return [];
  }
}

// 根据标签名称推断商品分类
function getCategoryFromLabel(label: string): string {
  const categoryMap: Record<string, string> = {
    '饮料': '饮品',
    '水': '饮品',
    '可乐': '饮品',
    '茶': '饮品',
    '咖啡': '饮品',
    '牛奶': '饮品',
    '酸奶': '饮品',
    '零食': '零食',
    '饼干': '零食',
    '薯片': '零食',
    '巧克力': '零食',
    '糖果': '零食',
    '面包': '烘焙',
    '蛋糕': '烘焙',
    '水果': '生鲜',
    '蔬菜': '生鲜',
    '肉': '生鲜',
    '鱼': '生鲜',
    '洗发水': '日用品',
    '牙膏': '日用品',
    '纸巾': '日用品',
    '洗衣液': '日用品',
  };
  
  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (label.includes(keyword)) {
      return category;
    }
  }
  
  return '其他';
}

// 使用LLM视觉模型识别（豆包）
async function recognizeByLLM(image: string, customHeaders: Record<string, string>): Promise<RecognizedProduct[]> {
  // 初始化LLM客户端
  const config = new Config();
  const client = new LLMClient(config, customHeaders);

  // 构建多模态消息
  const systemPrompt = `你是一个专业的便利店商品识别助手。你需要识别图片中的商品，并返回商品信息。
你需要返回JSON数组格式，每个识别到的商品包含以下字段：
- name: 商品名称（尽量详细，包含品牌和规格）
- confidence: 识别置信度（0-1之间的数字）
- category: 商品分类（如：饮品、零食、日用品、生鲜、水果等）
- price: 预估价格（元，数字）
- unit: 单位（如：瓶、袋、盒、个、斤等）
- brand: 品牌名称
- description: 简短描述

注意事项：
1. 尽可能识别图片中所有可见的商品
2. 如果无法确定价格，根据市场行情合理预估
3. 按识别置信度从高到低排序
4. 只返回JSON数组，不要有其他文字说明
5. 如果识别不到商品，返回空数组 []`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    {
      role: 'user' as const,
      content: [
        { 
          type: 'text' as const, 
          text: '请识别这张图片中的商品，返回商品列表信息。' 
        },
        {
          type: 'image_url' as const,
          image_url: {
            url: image,
            detail: 'high' as const,
          },
        },
      ],
    },
  ];

  // 调用视觉模型
  const response = await client.invoke(messages, {
    model: 'doubao-seed-1-6-vision-250815',
    temperature: 0.3,
  });

  // 解析返回的JSON
  let products: RecognizedProduct[] = [];
  try {
    const content = response.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      products = JSON.parse(jsonMatch[0]);
    }
  } catch (parseError) {
    console.error('解析商品识别结果失败:', parseError);
    products = [];
  }

  return products;
}

export async function POST(request: NextRequest) {
  try {
    const { image, useShowapi, skipLibrary, skipLearning, includeNonStandard } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: '请提供商品图片' },
        { status: 400 }
      );
    }

    // 获取API配置
    const apiConfig = await getApiConfig();
    const hasShowapi = !!apiConfig.showapiAppKey;
    const hasShowapiImage = !!apiConfig.showapiImageAppKey;
    
    // 获取自定义headers
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    
    let finalResults: RecognizedProduct[] = [];
    let usedMethod = '';
    let learningMatched = false;
    let nonStandardMatched = false;
    let aiCalled = false;
    
    // ========== 第一步：查询学习库（图片URL匹配）==========
    if (!skipLearning) {
      console.log('[recognize-image] 第一步：查询学习库...');
      const learnedProduct = await searchLearningLibrary(image);
      
      if (learnedProduct) {
        // 学习库命中，直接返回结果，不需要调用AI
        finalResults = [{
          name: learnedProduct.name,
          confidence: 0.99,  // 学习库匹配置信度最高
          category: learnedProduct.category,
          price: learnedProduct.price,
          unit: learnedProduct.unit,
          brand: learnedProduct.brand,
          description: learnedProduct.description,
          source: '学习库',
          matchedFromLearning: true,
          matchedFromLibrary: false,
        }];
        usedMethod = '自我学习库';
        learningMatched = true;
        
        console.log(`[recognize-image] 学习库命中！节省一次AI调用`);
      }
    }
    
    // ========== 第一步半：查询非标品库（可选）==========
    if (!learningMatched && includeNonStandard !== false) {
      console.log('[recognize-image] 查询非标品库...');
      const nonStandardProduct = await searchNonStandardProducts(image);
      
      if (nonStandardProduct) {
        // 非标品库命中
        finalResults = [{
          name: nonStandardProduct.name,
          confidence: 0.95,
          category: nonStandardProduct.category,
          price: nonStandardProduct.price,
          unit: nonStandardProduct.unit,
          brand: nonStandardProduct.brand,
          source: '非标品库',
          matchedFromLearning: false,
          matchedFromLibrary: false,
        }];
        usedMethod = '非标品库';
        nonStandardMatched = true;
        
        console.log(`[recognize-image] 非标品库命中！节省一次AI调用`);
      }
    }
    
    // ========== 第二步：AI识别商品（学习库和非标品库均未命中时）==========
    if (!learningMatched && !nonStandardMatched) {
      let aiResults: RecognizedProduct[] = [];
      
      // 优先使用万维易源商品识别API（1754-16）
      if (hasShowapiImage) {
        console.log('[recognize-image] 第二步：使用万维易源商品识别AI');
        aiResults = await recognizeByShowapiProduct(image, apiConfig.showapiImageAppKey!);
        usedMethod = '万维易源商品识别';
        aiCalled = true;
        
        // 如果万维易源商品识别结果不理想，降级到通用图像识别
        if (aiResults.length === 0 && hasShowapi) {
          console.log('[recognize-image] 万维易源商品识别结果为空，降级到通用图像识别');
          aiResults = await recognizeByShowapi(image, apiConfig.showapiAppKey!);
          usedMethod = '万维易源通用识别';
        }
      }
      // 如果配置了万维易源通用识别且请求指定使用
      else if (hasShowapi && (useShowapi === true || useShowapi === 'true')) {
        console.log('[recognize-image] 第二步：使用万维易源通用AI识别');
        aiResults = await recognizeByShowapi(image, apiConfig.showapiAppKey!);
        usedMethod = '万维易源AI';
        aiCalled = true;
        if (aiResults.length === 0) {
          console.log('[recognize-image] 万维易源识别结果为空，降级到LLM');
          aiResults = await recognizeByLLM(image, customHeaders);
          usedMethod = '豆包视觉模型';
        }
      } else {
        // 默认使用LLM视觉模型
        console.log('[recognize-image] 第二步：使用LLM视觉模型识别');
        aiResults = await recognizeByLLM(image, customHeaders);
        usedMethod = '豆包视觉模型';
        aiCalled = true;
      }

      // 过滤掉低置信度的结果
      aiResults = aiResults.filter(p => p.confidence >= 0.3);

      // ========== 第三步：优先匹配总部商品库 ==========
      // 如果没有指定跳过商品库匹配
      if (!skipLibrary && aiResults.length > 0) {
        console.log('[recognize-image] 第三步：匹配总部商品库...');
        finalResults = await matchWithLibrary(aiResults);
        
        // 统计匹配结果
        const libraryMatched = finalResults.filter(p => p.matchedFromLibrary).length;
        console.log(`[recognize-image] 商品库匹配完成: ${libraryMatched}/${finalResults.length} 商品来自总部商品库`);
      } else {
        finalResults = aiResults.map(p => ({
          ...p,
          source: 'AI识别',
          matchedFromLibrary: false,
        }));
      }

      // ========== 第四步：学习新商品 ==========
      // 将AI识别结果添加到学习库（异步，不阻塞响应）
      if (!skipLearning && finalResults.length > 0 && aiCalled) {
        // 只学习第一个识别结果（最主要的商品）
        const productToLearn = finalResults[0];
        
        // 异步学习，不阻塞响应
        learnProduct(image, productToLearn, usedMethod).catch(e => 
          console.error('[recognize-image] 学习失败:', e)
        );
      }
    }

    // 获取学习统计
    const learningStats = await getLearningStats();

    return NextResponse.json({
      success: true,
      data: finalResults,
      method: usedMethod,
      libraryMatched: finalResults.filter(p => p.matchedFromLibrary).length,
      learningMatched: learningMatched,
      nonStandardMatched: nonStandardMatched,
      learningStats: {
        totalLearned: learningStats.totalLearned,
        totalMatches: learningStats.totalMatches,
        aiCallsSaved: learningStats.aiCallsSaved,
      },
    });

  } catch (error) {
    console.error('图像识别错误:', error);
    return NextResponse.json(
      { error: '识别失败，请稍后重试', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
