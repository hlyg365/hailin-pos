import { NextResponse } from 'next/server';
import { getApiConfig } from '@/lib/api-config-store';

export const dynamic = 'force-dynamic';

// GET - 获取原始API配置（仅供内部调用）
export async function GET() {
  try {
    const config = await getApiConfig();
    return NextResponse.json({
      success: true,
      data: {
        shanhaiyunApiKey: config.shanhaiyunApiKey || '',
        rolltoolsAppId: config.rolltoolsAppId || '',
        rolltoolsAppSecret: config.rolltoolsAppSecret || '',
        tencentSecretId: config.tencentSecretId || '',
        tencentSecretKey: config.tencentSecretKey || '',
        showapiAppKey: config.showapiAppKey || '',
      },
    });
  } catch (error) {
    console.error('[api-config] 获取原始配置失败:', error);
    return NextResponse.json(
      { success: false, error: '获取配置失败' },
      { status: 500 }
    );
  }
}
