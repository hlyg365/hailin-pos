/**
 * API适配器 - 将API调用重定向到原生插件
 * 
 * 在原生APP环境中，这些API调用会被拦截并转发到原生插件
 * 在非原生环境中，保持原有API调用逻辑
 */

import { NextRequest, NextResponse } from 'next/server';
import { isNativeApp, Scale, Printer, CustomerDisplay } from '@/lib/native/index';

// 检查是否为原生APP环境
function checkNative(): boolean {
  // 由于这是服务端代码，我们需要从请求头中检测
  // Capacitor会在请求头中添加特定标识
  return false; // 默认返回false，让客户端处理
}

// ==================== 电子秤API适配 ====================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;
    
    switch (action) {
      case 'connect':
        const { port, baudRate } = body;
        
        // 尝试调用原生插件
        const scaleResult = await Scale.connect({ port, baudRate });
        if (scaleResult.success) {
          return NextResponse.json({
            success: true,
            message: scaleResult.message,
            mode: scaleResult.mode,
          });
        }
        
        // 原生插件不可用，返回友好提示
        return NextResponse.json({
          success: false,
          error: scaleResult.message,
          hint: '请在APP中使用电子秤功能',
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: '未知操作',
        }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || '服务器错误',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'status';
  
  switch (action) {
    case 'status':
      const status = await Scale.getStatus();
      return NextResponse.json({
        success: true,
        connected: status.connected,
        available: status.available,
      });
      
    case 'weight':
      const weight = await Scale.getWeight();
      if (weight) {
        return NextResponse.json({
          success: true,
          weight: weight.weight,
          unit: weight.unit,
          stable: weight.stable,
          timestamp: weight.timestamp,
        });
      }
      return NextResponse.json({
        success: false,
        error: '无法获取重量',
      });
      
    default:
      return NextResponse.json({
        success: false,
        error: '未知操作',
      }, { status: 400 });
  }
}
