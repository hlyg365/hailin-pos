/**
 * AI 客服聊天 API
 * 支持流式输出，整合商品和促销活动知识库
 */

import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export const dynamic = 'force-dynamic';

// AI 客服系统提示词
const SYSTEM_PROMPT = `你是海邻到家社区便利店的智能客服助手，你的职责是帮助顾客和店员解答问题。

## 关于收银系统功能
你可以帮助解答以下问题：

### 收银台功能
- 商品扫码/搜索：支持条码扫描、名称搜索
- 购物车管理：添加、删除、修改商品数量
- 会员识别：通过手机号或会员卡识别会员，自动应用折扣
- 支付方式：支持现金、微信、支付宝
- 小票打印：支持蓝牙/USB打印机
- 挂单/取单：临时保存订单，后续继续处理
- 离线收银：断网时仍可正常收银，联网后自动同步

### 会员体系
- 四级会员：普通会员、银卡会员（98折）、金卡会员（95折）、钻石会员（90折）
- 积分规则：消费积分，不同等级积分倍数不同
- 会员权益：生日优惠、专属折扣等

### 促销活动
- 总部统一促销：所有店铺同步的促销活动
- 店铺自主促销：单个店铺可以创建独立促销
- 晚8点清货：每天20:00后临期商品特价
- 会员专享：银卡及以上会员专属优惠

### 便民服务
- 话费充值：移动/联通/电信
- 水电缴费：水电费代缴
- 快递代收：快递代收发服务

### 库存管理
- 商品入库/出库
- 库存盘点
- 临期预警
- 要货申请

## 回答原则
1. 热情友好，使用礼貌用语
2. 回答简洁明了，突出重点
3. 对于商品和促销相关问题，优先使用知识库中的信息
4. 如果不确定某个问题，建议用户咨询门店工作人员
5. 对于价格、库存等实时信息，提醒用户以实际为准

## 注意事项
- 不讨论竞争对手
- 不泄露内部管理信息
- 对于投诉或复杂问题，建议联系店长处理`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, storeId } = body as {
      messages: ChatMessage[];
      storeId?: string;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const llmClient = new LLMClient(config, customHeaders);

    // 构建完整的消息列表
    const fullMessages = [
      { 
        role: 'system' as const, 
        content: SYSTEM_PROMPT + (storeId ? `\n\n当前店铺ID: ${storeId}` : '')
      },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      }))
    ];

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const llmStream = llmClient.stream(fullMessages, {
            model: 'doubao-seed-1-6-lite-251015',
            temperature: 0.7,
          });

          for await (const chunk of llmStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
            }
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (streamError) {
          console.error('流式输出错误:', streamError);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '生成回复时发生错误' })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('AI 客服 API 错误:', error);
    return NextResponse.json({ error: '服务暂时不可用，请稍后再试' }, { status: 500 });
  }
}
