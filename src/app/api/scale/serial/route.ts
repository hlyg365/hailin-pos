/**
 * 电子秤串口API
 * 
 * 功能：通过后端串口模块连接电子秤
 * 注意：PWA环境下前端无法直接访问串口，需要后端代理
 */

import { NextRequest, NextResponse } from 'next/server';

// 存储秤连接状态的全局变量
let scaleConnection: {
  connected: boolean;
  port: string;
  baudRate: number;
  lastWeight: {
    weight: number;
    unit: string;
    stable: boolean;
    timestamp: number;
  };
} = {
  connected: false,
  port: '',
  baudRate: 9600,
  lastWeight: {
    weight: 0,
    unit: 'kg',
    stable: false,
    timestamp: 0,
  },
};

// 获取秤状态
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'status';
  
  switch (action) {
    case 'status':
      return NextResponse.json({
        success: true,
        connected: scaleConnection.connected,
        port: scaleConnection.port,
        baudRate: scaleConnection.baudRate,
        timestamp: new Date().toISOString(),
      });
      
    case 'weight':
      return NextResponse.json({
        success: true,
        connected: scaleConnection.connected,
        weight: scaleConnection.lastWeight.weight,
        unit: scaleConnection.lastWeight.unit,
        stable: scaleConnection.lastWeight.stable,
        timestamp: scaleConnection.lastWeight.timestamp,
      });
      
    default:
      return NextResponse.json({
        success: false,
        error: 'Unknown action',
      }, { status: 400 });
  }
}

// 连接/断开/配置串口
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;
    
    switch (action) {
      case 'connect':
        const { port, baudRate } = body;
        
        if (!port) {
          return NextResponse.json({
            success: false,
            error: '串口号不能为空',
          }, { status: 400 });
        }
        
        scaleConnection.port = port;
        scaleConnection.baudRate = baudRate || 9600;
        
        // 注意：这里需要实际的串口连接实现
        // 实际部署时需要使用 serialport 等 npm 包
        // 由于环境限制，这里使用模拟数据
        
        // 模拟连接成功
        scaleConnection.connected = true;
        scaleConnection.lastWeight = {
          weight: 0,
          unit: 'kg',
          stable: false,
          timestamp: Date.now(),
        };
        
        return NextResponse.json({
          success: true,
          message: `已连接到 ${port} @ ${baudRate || 9600}bps`,
          connected: true,
        });
        
      case 'disconnect':
        scaleConnection.connected = false;
        scaleConnection.port = '';
        scaleConnection.lastWeight = {
          weight: 0,
          unit: 'kg',
          stable: false,
          timestamp: Date.now(),
        };
        
        return NextResponse.json({
          success: true,
          message: '已断开串口连接',
          connected: false,
        });
        
      case 'setWeight':
        // 手动设置重量
        scaleConnection.lastWeight = {
          weight: body.weight || 0,
          unit: body.unit || 'kg',
          stable: body.stable !== false,
          timestamp: Date.now(),
        };
        
        return NextResponse.json({
          success: true,
          weight: scaleConnection.lastWeight,
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action',
        }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || '请求处理失败',
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
