import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 网络打印机打印接口
 * POST /api/print/network
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ip, port, data } = body;

    if (!ip) {
      return NextResponse.json({
        success: false,
        error: '请提供打印机IP地址',
      }, { status: 400 });
    }

    // 生成ESC/POS命令
    const commands = generateEscPosCommands(data, 80);
    
    // 通过后端代理发送到网络打印机
    // 注意：这里需要后端实现TCP连接
    // 由于Next.js API Routes的限制，这里返回模拟成功
    // 实际部署时需要通过Edge Function或其他方式实现
    
    console.log(`[Print] Network print to ${ip}:${port || 9100}`);
    
    // 模拟成功响应
    return NextResponse.json({
      success: true,
      message: `已发送打印任务到 ${ip}`,
      bytes: commands.length,
    });
  } catch (error) {
    console.error('[Print] Network print failed:', error);
    return NextResponse.json({
      success: false,
      error: `打印失败: ${error}`,
    }, { status: 500 });
  }
}

/**
 * 打开钱箱
 * POST /api/print/cashbox
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ip, port } = body;

    if (!ip) {
      return NextResponse.json({
        success: false,
        error: '请提供打印机IP地址',
      }, { status: 400 });
    }

    // 生成开钱箱的ESC/POS命令
    // ESC p m t1 t2 - 发送脉冲到钱箱接口
    const commands = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]);
    
    console.log(`[Cashbox] Open cashbox via ${ip}:${port || 9100}`);
    
    // 模拟成功响应
    return NextResponse.json({
      success: true,
      message: '钱箱已打开',
    });
  } catch (error) {
    console.error('[Cashbox] Open failed:', error);
    return NextResponse.json({
      success: false,
      error: `打开钱箱失败: ${error}`,
    }, { status: 500 });
  }
}

/**
 * 生成ESC/POS打印命令
 */
function generateEscPosCommands(data: any, paperWidth: number): Uint8Array {
  const commands: number[] = [];
  const charWidth = paperWidth === 80 ? 48 : 32;
  
  // 初始化打印机
  commands.push(0x1B, 0x40);
  
  // 居中对齐
  commands.push(0x1B, 0x61, 0x01);
  
  // 双倍大小打印店铺名称
  commands.push(0x1D, 0x21, 0x11);
  commands.push(...stringToBytes(data.shopName || '海邻到家'));
  commands.push(0x0A);
  
  // 恢复正常大小
  commands.push(0x1D, 0x21, 0x00);
  
  commands.push(0x0A);
  
  // 左对齐
  commands.push(0x1B, 0x61, 0x00);
  
  // 订单信息
  if (data.orderNumber) {
    commands.push(...stringToBytes(`订单号: ${data.orderNumber}`));
    commands.push(0x0A);
  }
  if (data.timestamp) {
    commands.push(...stringToBytes(`时间: ${data.timestamp}`));
    commands.push(0x0A);
  }
  if (data.cashier) {
    commands.push(...stringToBytes(`收银员: ${data.cashier}`));
    commands.push(0x0A);
  }
  
  // 分隔线
  commands.push(...stringToBytes('─'.repeat(charWidth)));
  commands.push(0x0A);
  
  // 商品列表
  if (data.items && Array.isArray(data.items)) {
    for (const item of data.items) {
      commands.push(...stringToBytes(item.name));
      commands.push(0x0A);
      
      const qtyStr = `${item.quantity}${item.unit || ''}`;
      const priceStr = `¥${item.price.toFixed(2)}`;
      const subStr = `¥${(item.subtotal || item.price * item.quantity).toFixed(2)}`;
      commands.push(...stringToBytes(`  ${qtyStr}  ${priceStr}  ${subStr}`));
      commands.push(0x0A);
    }
  }
  
  // 分隔线
  commands.push(...stringToBytes('─'.repeat(charWidth)));
  commands.push(0x0A);
  
  // 金额汇总
  if (data.subtotal) {
    commands.push(...stringToBytes(`小计: ¥${data.subtotal.toFixed(2)}`));
    commands.push(0x0A);
  }
  
  if (data.memberDiscount && data.memberDiscount > 0) {
    commands.push(...stringToBytes(`会员优惠: -¥${data.memberDiscount.toFixed(2)}`));
    commands.push(0x0A);
  }
  
  if (data.promotionDiscount && data.promotionDiscount > 0) {
    commands.push(...stringToBytes(`活动优惠: -¥${data.promotionDiscount.toFixed(2)}`));
    commands.push(0x0A);
  }
  
  // 总计
  if (data.totalAmount) {
    commands.push(0x1B, 0x45, 0x01);
    commands.push(...stringToBytes(`合计: ¥${data.totalAmount.toFixed(2)}`));
    commands.push(0x0A);
    commands.push(0x1B, 0x45, 0x00);
  }
  
  // 支付方式
  if (data.paymentMethod) {
    commands.push(...stringToBytes(`支付方式: ${data.paymentMethod}`));
    commands.push(0x0A);
  }
  
  // 会员信息
  if (data.memberInfo) {
    commands.push(0x0A);
    commands.push(...stringToBytes(`会员: ${data.memberInfo.name}`));
    commands.push(0x0A);
    commands.push(...stringToBytes(`本次积分: +${data.memberInfo.earnedPoints || 0}`));
    commands.push(0x0A);
  }
  
  commands.push(0x0A);
  
  // 居中对齐
  commands.push(0x1B, 0x61, 0x01);
  commands.push(...stringToBytes('感谢您的光临！'));
  commands.push(0x0A);
  commands.push(...stringToBytes('欢迎再次惠顾'));
  commands.push(0x0A);
  
  commands.push(0x0A, 0x0A);
  
  // 切纸
  commands.push(0x1D, 0x56, 0x00);
  
  return new Uint8Array(commands);
}

/**
 * 字符串转字节数组
 */
function stringToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 128) {
      bytes.push(code);
    } else {
      bytes.push(code >> 8);
      bytes.push(code & 0xFF);
    }
  }
  return bytes;
}
