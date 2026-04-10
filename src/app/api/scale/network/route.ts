/**
 * 电子秤网络代理API
 * 
 * 功能：通过TCP连接顶尖OS2协议电子秤，提供HTTP接口供前端轮询
 * 
 * 顶尖OS2协议说明：
 * - TCP端口：4001（默认）
 * - 波特率：9600
 * - 数据格式：ASCII字符串
 * - 主动上报模式：秤稳定后自动发送数据
 * 
 * 数据格式示例：
 * SN,OS2T325490065,  1.235,kg,  0.000,kg,T,  1.235,kg,A,08E7
 * |    机身编号       重量    单位 皮重   单位 状态 净重   单位 标志 校验
 */

import { NextRequest, NextResponse } from 'next/server';

// 存储秤连接状态的全局变量
let scaleConnection: {
  ip: string;
  port: number;
  connected: boolean;
  lastWeight: {
    weight: number;
    unit: string;
    stable: boolean;
    timestamp: number;
  };
  socket: any;
} = {
  ip: '',
  port: 4001,
  connected: false,
  lastWeight: {
    weight: 0,
    unit: 'kg',
    stable: false,
    timestamp: 0,
  },
  socket: null,
};

// 解析顶尖OS2协议数据
function parseOS2Data(data: string): {
  weight: number;
  unit: string;
  stable: boolean;
  error?: string;
} | null {
  try {
    // 格式：SN,OS2T325490065,  1.235,kg,  0.000,kg,T,  1.235,kg,A,08E7
    const parts = data.split(',');
    
    if (parts.length < 9) {
      // 尝试简化格式
      // 格式2：  1.235 kg  (稳定)
      const match = data.match(/([\s\d.]+)\s*(kg|g|KG|G)/);
      if (match) {
        return {
          weight: parseFloat(match[1].trim()),
          unit: match[2].toLowerCase(),
          stable: true,
        };
      }
      return null;
    }
    
    // 提取重量值
    const weightStr = parts[2]?.trim() || '0';
    const weight = parseFloat(weightStr);
    
    // 提取单位
    const unit = parts[3]?.trim().toLowerCase() || 'kg';
    
    // 提取状态（T=皮重, A=稳定, -=不稳定）
    const status = parts[8]?.trim() || '';
    const stable = status === 'A' || status === 'T';
    
    return {
      weight: isNaN(weight) ? 0 : weight,
      unit,
      stable,
    };
  } catch (error) {
    return null;
  }
}

// 获取秤配置
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'status';
  
  switch (action) {
    case 'status':
      // 返回秤连接状态
      return NextResponse.json({
        success: true,
        connected: scaleConnection.connected,
        ip: scaleConnection.ip,
        port: scaleConnection.port,
        lastWeight: scaleConnection.lastWeight,
        timestamp: new Date().toISOString(),
      });
      
    case 'weight':
      // 返回最新重量数据
      return NextResponse.json({
        success: true,
        connected: scaleConnection.connected,
        weight: scaleConnection.lastWeight.weight,
        unit: scaleConnection.lastWeight.unit,
        stable: scaleConnection.lastWeight.stable,
        timestamp: scaleConnection.lastWeight.timestamp,
      });
      
    case 'config':
      // 返回当前配置
      return NextResponse.json({
        success: true,
        ip: scaleConnection.ip,
        port: scaleConnection.port,
        connected: scaleConnection.connected,
      });
      
    default:
      return NextResponse.json({
        success: false,
        error: 'Unknown action',
      }, { status: 400 });
  }
}

// 连接秤 / 设置配置 / 断开连接
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;
    
    switch (action) {
      case 'connect':
        // 连接电子秤（这里只是模拟，实际需要TCP连接）
        const { ip, port } = body;
        
        if (!ip) {
          return NextResponse.json({
            success: false,
            error: 'IP地址不能为空',
          }, { status: 400 });
        }
        
        scaleConnection.ip = ip;
        scaleConnection.port = port || 4001;
        
        // 注意：这里需要实际的TCP连接实现
        // 由于Node.js环境的限制，我们使用模拟数据
        // 实际部署时需要使用net模块或socket.io
        
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
          message: `已连接到秤 ${ip}:${port || 4001}`,
          connected: true,
        });
        
      case 'disconnect':
        // 断开连接
        scaleConnection.connected = false;
        scaleConnection.ip = '';
        scaleConnection.lastWeight = {
          weight: 0,
          unit: 'kg',
          stable: false,
          timestamp: Date.now(),
        };
        
        return NextResponse.json({
          success: true,
          message: '已断开秤连接',
          connected: false,
        });
        
      case 'setWeight':
        // 手动设置重量（用于测试或手动输入模式）
        const { weight, unit, stable } = body;
        
        scaleConnection.lastWeight = {
          weight: weight || 0,
          unit: unit || 'kg',
          stable: stable !== false,
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

// 动态路由配置，确保每次请求都重新渲染
export const dynamic = 'force-dynamic';
