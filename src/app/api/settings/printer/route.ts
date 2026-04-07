import { NextRequest, NextResponse } from 'next/server';

// 小票打印设置默认值
const defaultPrinterSettings = {
  // 店铺信息
  shopName: '海邻到家便利店天润苑B区店',
  shopAddress: '河南省南阳市宛城区长江路东段与蒲山路宝城天润B区',
  shopPhone: '18637791618',
  
  // 客气语
  thanksText: '多谢惠顾，欢迎下次再来！',
  
  // 打印份数
  printCopies: 1,
  
  // 纸张宽度
  paperWidth: 58, // mm
  
  // 打印选项
  showReceiptNumber: false, // 是否显示小票序号
  showStandardUnit: true, // 标准商品是否打印单位
  showNonStandardUnit: true, // 非标准商品是否打印单位
  showMemberBalance: true, // 是否打印会员储值余额
  showMemberPoints: true, // 是否打印会员积分
  showThanksText: true, // 是否打印客气语
  showShopInfo: true, // 是否打印店铺地址、电话
  
  // 其他设置
  autoPrint: true, // 自动打印小票
  printQrCode: false, // 打印二维码
  printMemberInfo: true, // 打印会员信息
  
  // 欢迎语
  showWelcome: false,
  welcomeText: '欢迎光临',
  
  // 自定义底部文字
  footerLines: [] as string[],
};

// 内存中的设置存储
let printerSettings = { ...defaultPrinterSettings };

// GET - 获取打印设置
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: printerSettings,
    });
  } catch (error) {
    console.error('获取打印设置失败:', error);
    return NextResponse.json(
      { success: false, error: '获取打印设置失败' },
      { status: 500 }
    );
  }
}

// POST - 更新打印设置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 合并设置
    printerSettings = {
      ...printerSettings,
      ...body,
    };

    return NextResponse.json({
      success: true,
      message: '打印设置已保存',
      data: printerSettings,
    });
  } catch (error) {
    console.error('保存打印设置失败:', error);
    return NextResponse.json(
      { success: false, error: '保存打印设置失败' },
      { status: 500 }
    );
  }
}

// DELETE - 重置设置
export async function DELETE() {
  try {
    printerSettings = { ...defaultPrinterSettings };
    
    return NextResponse.json({
      success: true,
      message: '打印设置已重置',
      data: printerSettings,
    });
  } catch (error) {
    console.error('重置打印设置失败:', error);
    return NextResponse.json(
      { success: false, error: '重置打印设置失败' },
      { status: 500 }
    );
  }
}
