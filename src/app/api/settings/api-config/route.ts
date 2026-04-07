import { NextRequest, NextResponse } from 'next/server';
import {
  getMaskedConfig,
  setShanhaiyunApiKey,
  setRollToolsConfig,
  setTencentConfig,
  setShowapiConfig,
  setShowapiImageConfig,
  getConfigStatus,
} from '@/lib/api-config-store';

export const dynamic = 'force-dynamic';

// GET - 获取API配置状态
export async function GET() {
  try {
    const maskedConfig = await getMaskedConfig();
    return NextResponse.json({
      success: true,
      data: maskedConfig,
    });
  } catch (error) {
    console.error('[api-config] 获取配置失败:', error);
    return NextResponse.json(
      { success: false, error: '获取配置失败' },
      { status: 500 }
    );
  }
}

// POST - 保存API配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 保存山海云端API Key
    if (body.shanhaiyunApiKey !== undefined) {
      await setShanhaiyunApiKey(body.shanhaiyunApiKey || undefined);
    }
    
    // 保存RollTools配置
    if (body.rolltoolsAppId !== undefined || body.rolltoolsAppSecret !== undefined) {
      await setRollToolsConfig(body.rolltoolsAppId, body.rolltoolsAppSecret);
    }
    
    // 保存腾讯云配置
    if (body.tencentSecretId !== undefined || body.tencentSecretKey !== undefined) {
      await setTencentConfig(body.tencentSecretId, body.tencentSecretKey);
    }
    
    // 保存万维易源配置
    if (body.showapiAppKey !== undefined) {
      await setShowapiConfig(body.showapiAppKey || undefined);
    }
    
    // 保存万维易源图像识别配置
    if (body.showapiImageAppKey !== undefined) {
      await setShowapiImageConfig(body.showapiImageAppKey || undefined);
    }
    
    const status = await getConfigStatus();
    console.log('[api-config] 配置已更新:', status);
    
    return NextResponse.json({
      success: true,
      message: '配置保存成功',
      data: status,
    });
  } catch (error) {
    console.error('[api-config] 保存配置失败:', error);
    return NextResponse.json(
      { success: false, error: '保存配置失败' },
      { status: 500 }
    );
  }
}
