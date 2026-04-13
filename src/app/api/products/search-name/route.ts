import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils, ImageGenerationClient, S3Storage } from 'coze-coding-dev-sdk';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { name, type } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: '请输入商品名称' },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const llmClient = new LLMClient(config, customHeaders);

    // 构建提示词，让AI根据商品名称推测商品信息
    const systemPrompt = `你是一个便利店商品信息助手。当用户提供商品名称时，你需要推测该商品的相关信息。

你需要返回以下信息的JSON格式：
{
  "name": "规范的商品名称",
  "category": "分类(drinks/fruits/vegetables/snacks/fresh/daily)",
  "unit": "常用单位(个/斤/包/盒/瓶/罐)",
  "suggestedPrice": 建议零售价(数字，单位元),
  "costPrice": 预估成本价(数字，单位元),
  "brand": "常见品牌(可选)",
  "specification": "常见规格说明",
  "icon": "合适的emoji图标",
  "storageCondition": "存储条件(常温/冷藏/冷冻)",
  "shelfLife": "保质期说明",
  "imagePrompt": "商品图片生成提示词(英文，用于AI生成商品图片，描述商品外观特征，如：A fresh red apple on white background, product photography, clean and simple)"
}

分类说明：
- drinks: 饮品（水、饮料、牛奶、果汁、酸奶等）
- fruits: 水果（苹果、香蕉、橙子、葡萄等）
- vegetables: 蔬菜（西红柿、土豆、黄瓜、白菜等）
- snacks: 零食（薯片、饼干、糖果、巧克力等）
- fresh: 生鲜（鸡蛋、豆腐、馒头、包子等）
- daily: 日用品（洗护用品、纸巾等）

价格参考（便利店零售价）：
- 矿泉水: 2-3元
- 可乐/雪碧: 3-4元
- 牛奶: 4-6元
- 饼干/薯片: 5-10元
- 水果（斤）: 5-15元
- 蔬菜（斤）: 3-8元
- 鸡蛋（个）: 1-1.5元
- 馒头（个）: 1-2元

请根据商品类型和常见情况，返回合理的商品信息。只返回JSON，不要有其他说明文字。`;

    const typeHint = type === 'weighted' ? '（称重商品，通常按斤计价）' : 
                      type === 'counted' ? '（计件商品，按个/包等计价）' : '';
    
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `请推测商品"${name}"${typeHint}的相关信息` }
    ];

    const response = await llmClient.invoke(messages, { temperature: 0.3 });
    
    // 解析AI返回的JSON
    let productInfo;
    try {
      // 清理可能的markdown代码块标记
      let content = response.content.trim();
      if (content.startsWith('```json')) {
        content = content.slice(7);
      }
      if (content.startsWith('```')) {
        content = content.slice(3);
      }
      if (content.endsWith('```')) {
        content = content.slice(0, -3);
      }
      content = content.trim();
      
      productInfo = JSON.parse(content);
    } catch (e) {
      console.error('解析AI返回失败:', response.content);
      // 如果解析失败，返回默认信息
      productInfo = {
        name: name,
        category: 'daily',
        unit: type === 'weighted' ? '斤' : '个',
        suggestedPrice: 10.00,
        costPrice: 6.00,
        icon: '📦',
        storageCondition: '常温',
        shelfLife: '请核实',
        imagePrompt: `A ${name} product on white background, product photography, clean and simple`
      };
    }

    // 生成商品图片
    let imageUrl = '';
    try {
      const imageClient = new ImageGenerationClient(config, customHeaders);
      
      // 使用AI返回的图片提示词，或使用默认提示词
      const imagePrompt = productInfo.imagePrompt || 
        `A fresh ${productInfo.name || name} on white background, product photography, clean and simple, high quality`;
      
      const imageResponse = await imageClient.generate({
        prompt: imagePrompt,
        size: '2K',
        watermark: false,
      });

      const helper = imageClient.getResponseHelper(imageResponse);
      
      if (helper.success && helper.imageUrls.length > 0) {
        const generatedImageUrl = helper.imageUrls[0];
        
        // 下载图片并上传到对象存储
        const imageBuffer = await axios.get(generatedImageUrl, { 
          responseType: 'arraybuffer',
          timeout: 30000 
        });
        
        // 初始化对象存储
        const storage = new S3Storage({
          endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
          accessKey: "",
          secretKey: "",
          bucketName: process.env.COZE_BUCKET_NAME,
          region: "cn-beijing",
        });
        
        // 生成文件名
        const fileName = `products/${productInfo.name || name}_${Date.now()}.png`;
        
        // 上传到对象存储
        const fileKey = await storage.uploadFile({
          fileContent: Buffer.from(imageBuffer.data),
          fileName: fileName,
          contentType: 'image/png',
        });
        
        // 生成签名URL（有效期7天）
        imageUrl = await storage.generatePresignedUrl({
          key: fileKey,
          expireTime: 604800, // 7天
        });
      }
    } catch (imageError) {
      console.error('生成商品图片失败:', imageError);
      // 图片生成失败不影响返回商品信息
    }

    return NextResponse.json({
      success: true,
      data: {
        ...productInfo,
        imageUrl: imageUrl || undefined,
      }
    });

  } catch (error) {
    console.error('商品名称搜索失败:', error);
    return NextResponse.json(
      { success: false, error: '搜索失败，请稍后重试' },
      { status: 500 }
    );
  }
}
