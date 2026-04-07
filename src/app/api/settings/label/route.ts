import { NextRequest, NextResponse } from 'next/server';

// 价签打印设置默认值
const defaultLabelSettings = {
  // 纸张设置（三种标准模板）
  paperSize: '70x38', // 70x38（标准签）, 60x40（会员签）, 50x30（简洁签）
  
  // 字体设置
  fontSize: 'medium', // small, medium, large
  
  // 显示内容
  showName: true,
  showPrice: true,
  showBarcode: true,
  showSpec: true,
  showOrigin: true,
  showUnit: true,
  showGrade: true,
  showMemberPrice: false,
  showSupervision: true,
  supervisionText: '物价局监制 监督电话: 12358',
  
  // 打印设置
  autoPrint: false,
  printCopies: 1,
};

// 内存中的设置存储
let labelSettings = { ...defaultLabelSettings };

// GET - 获取价签打印设置
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: labelSettings,
    });
  } catch (error) {
    console.error('获取价签打印设置失败:', error);
    return NextResponse.json(
      { success: false, error: '获取价签打印设置失败' },
      { status: 500 }
    );
  }
}

// POST - 更新价签打印设置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 处理打印测试
    if (body.action === 'test') {
      return NextResponse.json({
        success: true,
        message: '测试价签已发送到打印机',
      });
    }
    
    // 处理批量打印
    if (body.action === 'print') {
      const { products } = body;
      
      if (!products || !Array.isArray(products) || products.length === 0) {
        return NextResponse.json({
          success: false,
          error: '请选择要打印价签的商品',
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        message: `已发送 ${products.length} 个价签到打印机`,
        data: {
          printedCount: products.length,
        },
      });
    }
    
    // 合并设置
    labelSettings = {
      ...labelSettings,
      ...body,
    };

    return NextResponse.json({
      success: true,
      message: '价签打印设置已保存',
      data: labelSettings,
    });
  } catch (error) {
    console.error('保存价签打印设置失败:', error);
    return NextResponse.json(
      { success: false, error: '保存价签打印设置失败' },
      { status: 500 }
    );
  }
}

// DELETE - 重置设置
export async function DELETE() {
  try {
    labelSettings = { ...defaultLabelSettings };
    
    return NextResponse.json({
      success: true,
      message: '价签打印设置已重置',
      data: labelSettings,
    });
  } catch (error) {
    console.error('重置价签打印设置失败:', error);
    return NextResponse.json(
      { success: false, error: '重置价签打印设置失败' },
      { status: 500 }
    );
  }
}
