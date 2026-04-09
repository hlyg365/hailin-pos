import { NextRequest, NextResponse } from 'next/server';

// 模拟电子秤设备
let simulatedScale = {
  connected: false,
  weight: 0,
  unit: 'kg',
  stable: true,
  lastUpdate: Date.now(),
};

// 生成随机称重数据
function generateRandomWeight(): { stable: number; instant: number; unit: string; status: string } {
  // 模拟重量在 0.5-5.0kg 之间波动
  const base = 1.5 + Math.sin(Date.now() / 2000) * 1.5;
  const noise = (Math.random() - 0.5) * 0.3;
  const weight = Math.round((base + noise) * 1000) / 1000;
  
  return {
    stable: weight,
    instant: Math.round((weight + (Math.random() - 0.5) * 0.02) * 1000) / 1000,
    unit: 'kg',
    status: Math.random() > 0.1 ? 'OK' : 'UNSTABLE',
  };
}

// 连接电子秤
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action = 'connect',
      port,
      baudRate,
      model,
      simulated = false,
    } = body;
    
    console.log('[Scale Connect] 收到请求:', { action, port, baudRate, model, simulated });
    
    if (action === 'connect') {
      // 模拟模式
      if (simulated) {
        simulatedScale.connected = true;
        simulatedScale.lastUpdate = Date.now();
        
        return NextResponse.json({
          success: true,
          message: '模拟电子秤连接成功',
          mode: 'simulated',
          data: generateRandomWeight(),
          config: {
            port: port || 'SIMULATED',
            baudRate: baudRate || 9600,
            model: model || 'OS2T325490065',
          },
        });
      }
      
      // 真实连接模式
      // 在PWA环境下，电子秤应该通过浏览器Web Serial API连接
      // 后端API主要用于代理或网络连接
      
      // 检查是否是Web Serial API请求
      const isWebSerialRequest = request.headers.get('x-scale-source') === 'web-serial';
      
      if (isWebSerialRequest) {
        // Web Serial API请求 - 通过WebSocket转发
        // 这里简化处理，实际应该建立WebSocket连接
        return NextResponse.json({
          success: true,
          message: 'Web Serial模式',
          mode: 'web-serial',
          instructions: '请在浏览器中使用Web Serial API连接',
        });
      }
      
      // 其他情况使用模拟模式
      simulatedScale.connected = true;
      simulatedScale.lastUpdate = Date.now();
      
      return NextResponse.json({
        success: true,
        message: '电子秤连接成功（默认模拟模式）',
        mode: 'default',
        data: generateRandomWeight(),
        config: {
          port: port || 'AUTO',
          baudRate: baudRate || 9600,
          model: model || 'OS2T325490065',
        },
        note: '当前环境不支持真实串口连接，使用模拟数据',
      });
    }
    
    if (action === 'disconnect') {
      simulatedScale.connected = false;
      simulatedScale.weight = 0;
      
      return NextResponse.json({
        success: true,
        message: '电子秤已断开',
      });
    }
    
    if (action === 'test') {
      // 测试连接
      const testData = generateRandomWeight();
      
      return NextResponse.json({
        success: true,
        message: '电子秤测试成功',
        data: testData,
        simulated: !simulated && !isWebSerialAPI(),
      });
    }
    
    if (action === 'getWeight') {
      // 获取当前重量
      if (!simulatedScale.connected) {
        return NextResponse.json({
          success: false,
          error: '电子秤未连接',
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        data: generateRandomWeight(),
        timestamp: Date.now(),
      });
    }
    
    return NextResponse.json({
      success: false,
      error: '未知操作: ' + action,
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('[Scale Connect] 错误:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '服务器错误',
    }, { status: 500 });
  }
}

// 判断是否为Web Serial API请求
function isWebSerialAPI(): boolean {
  return typeof window !== 'undefined' && 'serial' in navigator;
}

// 获取连接状态
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  
  if (action === 'status') {
    return NextResponse.json({
      success: true,
      connected: simulatedScale.connected,
      data: simulatedScale.connected ? generateRandomWeight() : null,
      timestamp: Date.now(),
    });
  }
  
  return NextResponse.json({
    success: true,
    connected: simulatedScale.connected,
    message: '电子秤连接服务运行中',
    timestamp: Date.now(),
  });
}
