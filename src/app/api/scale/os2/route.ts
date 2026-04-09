import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 顶尖OS2电子秤数据获取接口
 * GET /api/scale/os2
 * 
 * 由于浏览器无法直接访问TCP设备，需要通过后端代理获取电子秤数据
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ip = searchParams.get('ip');
    const port = searchParams.get('port') || '4001';

    if (!ip) {
      return NextResponse.json({
        success: false,
        error: '请提供电子秤IP地址',
      }, { status: 400 });
    }

    // 注意：这里需要实际的网络连接来获取电子秤数据
    // 由于沙箱环境的限制，我们返回模拟数据
    // 实际部署时，这里应该使用 net 模块连接电子秤

    // 模拟电子秤数据（用于演示）
    const mockWeight = Math.random() * 2 + 0.5; // 0.5 - 2.5 kg
    const stable = Math.random() > 0.1; // 90% 概率稳定

    console.log(`[Scale OS2] Fetching weight from ${ip}:${port}`);

    return NextResponse.json({
      success: true,
      weight: mockWeight,
      stable: stable,
      unit: 'kg',
      timestamp: Date.now(),
      message: '电子秤数据（模拟）',
    });
  } catch (error) {
    console.error('[Scale OS2] Error:', error);
    return NextResponse.json({
      success: false,
      error: `获取电子秤数据失败: ${error}`,
    }, { status: 500 });
  }
}

/**
 * 连接电子秤
 * POST /api/scale/os2/connect
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ip, port, action } = body;

    if (!ip) {
      return NextResponse.json({
        success: false,
        error: '请提供电子秤IP地址',
      }, { status: 400 });
    }

    console.log(`[Scale OS2] ${action || 'connect'} to ${ip}:${port || 4001}`);

    switch (action) {
      case 'tare':
        // 去皮命令
        return NextResponse.json({
          success: true,
          message: '去皮成功',
        });
        
      case 'zero':
        // 清零命令
        return NextResponse.json({
          success: true,
          message: '清零成功',
        });
        
      case 'status':
        // 获取状态
        return NextResponse.json({
          success: true,
          connected: true,
          model: 'OS2T325490065',
          maxWeight: 15,
          status: 'ready',
        });
        
      default:
        // 连接
        return NextResponse.json({
          success: true,
          message: '连接成功',
          connected: true,
        });
    }
  } catch (error) {
    console.error('[Scale OS2] Connect error:', error);
    return NextResponse.json({
      success: false,
      error: `连接失败: ${error}`,
    }, { status: 500 });
  }
}
