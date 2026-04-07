import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { barcode } = await request.json();
    
    if (!barcode) {
      return NextResponse.json(
        { success: false, error: '请输入条码' },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建提示词，让AI根据条码搜索商品信息
    const systemPrompt = `你是一个商品信息查询助手。当用户提供商品条码时，你需要根据条码信息推测或查询可能的商品信息。

你需要返回以下信息的JSON格式：
{
  "name": "商品名称",
  "category": "分类(drinks/fruits/vegetables/snacks/fresh/daily)",
  "unit": "单位(个/瓶/包/盒/斤/罐)",
  "suggestedPrice": 建议零售价(数字),
  "brand": "品牌",
  "specification": "规格说明",
  "icon": "合适的emoji图标"
}

分类说明：
- drinks: 饮品（水、饮料、牛奶、果汁等）
- fruits: 水果
- vegetables: 蔬菜
- snacks: 零食（薯片、饼干、糖果等）
- fresh: 生鲜（鸡蛋、豆腐、面点等）
- daily: 日用品

如果无法确定条码对应的商品，请根据条码规则推测一个合理的商品信息。
条码规则参考：
- 690-699开头：中国商品
- 6901234开头常见于饮料类
- 6905678开头常见于零食类

请只返回JSON，不要有其他说明文字。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `请查询条码 "${barcode}" 对应的商品信息` }
    ];

    const response = await client.invoke(messages, { temperature: 0.3 });
    
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
        name: `商品-${barcode.slice(-4)}`,
        category: 'daily',
        unit: '个',
        suggestedPrice: 10.00,
        brand: '未知品牌',
        specification: '请手动填写',
        icon: '📦'
      };
    }

    // 添加条码信息
    productInfo.barcode = barcode;

    return NextResponse.json({
      success: true,
      data: productInfo
    });

  } catch (error) {
    console.error('条码搜索失败:', error);
    return NextResponse.json(
      { success: false, error: '搜索失败，请稍后重试' },
      { status: 500 }
    );
  }
}
