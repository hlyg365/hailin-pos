import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 顶尖OS2电子秤连接接口
 * POST /api/scale/os2/connect
 * 
 * 用于建立与电子秤的连接
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ip, port, serialPort, baudRate, action } = body;

    console.log(`[Scale OS2 Connect] Action: ${action || 'connect'}, Type: ${type}`);

    // 处理不同动作
    if (action === 'status') {
      return NextResponse.json({
        success: true,
        connected: true,
        model: 'OS2T325490065',
        maxWeight: 15,
        status: 'ready',
        type: type || 'serial',
      });
    }

    if (action === 'tare') {
      console.log('[Scale OS2] Tare command');
      return NextResponse.json({
        success: true,
        message: '去皮成功',
      });
    }

    if (action === 'zero') {
      console.log('[Scale OS2] Zero command');
      return NextResponse.json({
        success: true,
        message: '清零成功',
      });
    }

    // 连接动作
    const connectionType = type || 'serial';
    
    if (connectionType === 'serial') {
      // 串口连接
      console.log(`[Scale OS2] Connecting serial: ${serialPort} @ ${baudRate}bps`);
      
      // 在真实环境中，这里应该：
      // 1. 通过 USB Serial API 与串口通信
      // 2. 或通过后端代理连接串口设备
      
      return NextResponse.json({
        success: true,
        message: `串口 ${serialPort} @ ${baudRate}bps 连接成功`,
        connected: true,
        mode: 'simulation',
        type: 'serial',
      });
    } else {
      // 网络连接
      console.log(`[Scale OS2] Connecting network: ${ip}:${port}`);
      
      // 在真实环境中，这里应该：
      // 1. 建立 TCP 连接到电子秤
      // 2. 使用 OS2 协议通信
      
      return NextResponse.json({
        success: true,
        message: `网络 ${ip}:${port} 连接成功`,
        connected: true,
        mode: 'simulation',
        type: 'network',
      });
    }
  } catch (error) {
    console.error('[Scale OS2 Connect] Error:', error);
    return NextResponse.json({
      success: false,
      error: `连接失败: ${error}`,
    }, { status: 500 });
  }
}

/**
 * 获取连接状态
 * GET /api/scale/os2/connect
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    connected: false,
    mode: 'disconnected',
    message: '未连接电子秤',
  });
}
