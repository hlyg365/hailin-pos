import { NextRequest, NextResponse } from 'next/server';

// 电子秤设置默认值
const defaultScaleSettings = {
  // 串口设置
  serialPort: 'COM1',
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none' as 'none' | 'even' | 'odd',
  
  // 条码秤类型
  barcodeScaleType: 'none' as 'none' | 'tm-ab' | 'tm-f' | 'ls2zx',
  
  // AI秤设置
  aiScaleEnabled: false,
  aiModelType: 'standard' as 'standard' | 'advanced',
  
  // 称重设置
  autoTare: false, // 自动去皮
  unit: 'kg' as 'kg' | 'g' | 'lb',
  decimalPlaces: 2,
  
  // 打印设置（条码秤）
  autoPrintLabel: true,
  labelTemplate: 'standard',
  
  // 连接状态
  isConnected: false,
  lastConnected: null as string | null,
};

// 内存中的设置存储
let scaleSettings = { ...defaultScaleSettings };

// GET - 获取电子秤设置
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: scaleSettings,
    });
  } catch (error) {
    console.error('获取电子秤设置失败:', error);
    return NextResponse.json(
      { success: false, error: '获取电子秤设置失败' },
      { status: 500 }
    );
  }
}

// POST - 更新电子秤设置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 处理连接测试
    if (body.action === 'test') {
      // 模拟连接测试
      const isConnected = Math.random() > 0.3; // 模拟70%成功率
      
      return NextResponse.json({
        success: true,
        message: isConnected ? '连接成功' : '连接失败，请检查串口设置',
        data: {
          ...scaleSettings,
          isConnected,
          lastConnected: isConnected ? new Date().toISOString() : null,
        },
      });
    }
    
    // 处理读取重量
    if (body.action === 'read') {
      // 模拟读取重量
      const weight = (Math.random() * 10).toFixed(2);
      
      return NextResponse.json({
        success: true,
        data: {
          weight: parseFloat(weight),
          unit: scaleSettings.unit,
          stable: true,
        },
      });
    }
    
    // 合并设置
    scaleSettings = {
      ...scaleSettings,
      ...body,
    };

    return NextResponse.json({
      success: true,
      message: '电子秤设置已保存',
      data: scaleSettings,
    });
  } catch (error) {
    console.error('保存电子秤设置失败:', error);
    return NextResponse.json(
      { success: false, error: '保存电子秤设置失败' },
      { status: 500 }
    );
  }
}

// DELETE - 重置设置
export async function DELETE() {
  try {
    scaleSettings = { ...defaultScaleSettings };
    
    return NextResponse.json({
      success: true,
      message: '电子秤设置已重置',
      data: scaleSettings,
    });
  } catch (error) {
    console.error('重置电子秤设置失败:', error);
    return NextResponse.json(
      { success: false, error: '重置电子秤设置失败' },
      { status: 500 }
    );
  }
}
