import { NextResponse } from 'next/server';

/**
 * 健康检查 API
 * 用于 APP 测试服务器连接
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'hailin-pos-api',
    version: '1.0.0',
  });
}
