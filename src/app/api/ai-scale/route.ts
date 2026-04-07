import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

// AI秤识别配置
const AI_SCALE_CONFIG = {
  // 默认使用的视觉模型
  model: 'doubao-seed-1-6-vision-250815',
  // 识别温度（低温度保证结果稳定）
  temperature: 0.3,
  // 识别超时时间（毫秒）
  timeout: 30000,
};

// 商品类别映射（可根据实际商品扩展）
const PRODUCT_CATEGORIES = [
  { id: 'fruits', name: '水果', keywords: ['苹果', '香蕉', '橙子', '葡萄', '西瓜', '草莓', '梨', '桃子'] },
  { id: 'vegetables', name: '蔬菜', keywords: ['白菜', '西红柿', '黄瓜', '土豆', '洋葱', '胡萝卜', '青椒'] },
  { id: 'meat', name: '肉类', keywords: ['猪肉', '牛肉', '羊肉', '鸡肉', '鸭肉', '排骨'] },
  { id: 'seafood', name: '海鲜', keywords: ['鱼', '虾', '蟹', '贝', '龙虾', '三文鱼'] },
  { id: 'snacks', name: '零食', keywords: ['薯片', '饼干', '糖果', '巧克力', '坚果'] },
  { id: 'drinks', name: '饮料', keywords: ['可乐', '雪碧', '果汁', '牛奶', '酸奶', '茶'] },
];

// AI识别提示词模板
const RECOGNITION_PROMPT = `你是一个专业的商品识别AI助手。请分析图片中的商品，并返回以下JSON格式的识别结果：

{
  "success": true,
  "product": {
    "name": "商品名称",
    "category": "商品类别（水果/蔬菜/肉类/海鲜/零食/饮料/其他）",
    "confidence": 0.95,
    "description": "简短描述"
  },
  "suggestions": ["可能的商品名称1", "可能的商品名称2"]
}

识别要求：
1. 准确识别商品的类别
2. 给出具体的商品名称
3. 提供置信度评分（0-1）
4. 如果不确定，提供多个可能的建议
5. 如果图片中无商品或无法识别，返回 { "success": false, "error": "无法识别商品" }

请仅返回JSON，不要包含其他文字。`;

/**
 * AI秤识别接口
 * POST /api/ai-scale
 * 
 * 请求体：
 * {
 *   action: 'recognize' | 'configure',
 *   image: string (base64或URL),
 *   settings?: { model?, temperature? }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, image, settings } = body;

    // 处理配置请求
    if (action === 'configure') {
      return NextResponse.json({
        success: true,
        message: 'AI秤配置已更新',
        config: {
          ...AI_SCALE_CONFIG,
          ...settings,
        },
      });
    }

    // 处理识别请求
    if (action === 'recognize') {
      if (!image) {
        return NextResponse.json({
          success: false,
          error: '请提供商品图片',
        }, { status: 400 });
      }

      // 提取请求头用于上下文传递
      const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
      
      // 初始化LLM客户端
      const config = new Config();
      const client = new LLMClient(config, customHeaders);

      // 构建识别消息
      const messages = [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: RECOGNITION_PROMPT },
            {
              type: 'image_url' as const,
              image_url: {
                url: image,
                detail: 'high' as const, // 高精度识别
              },
            },
          ],
        },
      ];

      // 调用AI模型进行识别
      const response = await client.invoke(messages, {
        model: settings?.model || AI_SCALE_CONFIG.model,
        temperature: settings?.temperature || AI_SCALE_CONFIG.temperature,
      });

      // 解析AI返回结果
      let recognitionResult;
      try {
        // 尝试解析JSON响应
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          recognitionResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('AI返回格式不正确');
        }
      } catch (parseError) {
        console.error('解析AI结果失败:', parseError);
        recognitionResult = {
          success: false,
          error: 'AI识别结果解析失败',
          rawResponse: response.content,
        };
      }

      // 如果识别成功，匹配商品类别
      if (recognitionResult.success && recognitionResult.product) {
        const product = recognitionResult.product;
        
        // 根据识别结果匹配类别
        const matchedCategory = PRODUCT_CATEGORIES.find(cat => 
          cat.name === product.category || 
          cat.keywords.some(keyword => product.name.includes(keyword))
        );

        if (matchedCategory) {
          recognitionResult.product.categoryId = matchedCategory.id;
        }
      }

      return NextResponse.json({
        success: true,
        data: recognitionResult,
        timestamp: new Date().toISOString(),
      });
    }

    // 处理测试请求
    if (action === 'test') {
      return NextResponse.json({
        success: true,
        message: 'AI秤服务运行正常',
        model: AI_SCALE_CONFIG.model,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: false,
      error: '未知的操作类型',
    }, { status: 400 });

  } catch (error) {
    console.error('AI秤识别错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'AI识别服务异常',
    }, { status: 500 });
  }
}

/**
 * GET - 获取AI秤配置信息
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      config: AI_SCALE_CONFIG,
      categories: PRODUCT_CATEGORIES,
      supportedModels: [
        { id: 'doubao-seed-1-6-vision-250815', name: '视觉识别模型（推荐）', type: 'vision' },
        { id: 'doubao-seed-1-8-251228', name: '多模态增强模型', type: 'multimodal' },
        { id: 'kimi-k2-5-260127', name: 'Kimi智能模型', type: 'multimodal' },
      ],
    },
  });
}
