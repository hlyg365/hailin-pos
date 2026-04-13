/**
 * 版本更新检查API
 * 
 * 提供App版本检查和更新下载服务
 */

import { NextRequest, NextResponse } from 'next/server';

// 最新版本信息（实际部署时从数据库或配置读取）
const LATEST_VERSION = {
  version: '3.0.0',
  versionCode: 30,
  buildId: 'latest',
  buildTime: '2024-04-11T00:00:00Z',
  downloadUrl: '/api/update/download',
  releaseNotes: '支持双屏收银机，优化电子秤连接',
  minVersion: '2.0.0', // 最低支持版本，低于此版本需要强制更新
  forceUpdate: false,
  apkSize: 0, // APK大小（字节）
  apkMd5: '', // APK MD5校验
};

// 历史版本列表（用于增量更新）
const VERSION_HISTORY = [
  {
    version: '3.0.0',
    versionCode: 30,
    buildTime: '2024-04-11T00:00:00Z',
    releaseNotes: '支持双屏收银机，优化电子秤连接',
    forceUpdate: false,
  },
  {
    version: '2.5.0',
    versionCode: 25,
    buildTime: '2024-03-20T00:00:00Z',
    releaseNotes: '新增会员积分抵扣，优化打印功能',
    forceUpdate: false,
  },
  {
    version: '2.0.0',
    versionCode: 20,
    buildTime: '2024-02-15T00:00:00Z',
    releaseNotes: '全新UI设计，支持离线收银',
    forceUpdate: false,
  },
];

// 解析版本号
function parseVersion(version: string): number[] {
  return version.split('.').map(v => parseInt(v, 10) || 0);
}

// 比较版本号
function compareVersion(current: string, latest: string): 'lt' | 'eq' | 'gt' {
  const currentParts = parseVersion(current);
  const latestParts = parseVersion(latest);
  
  const maxLen = Math.max(currentParts.length, latestParts.length);
  
  for (let i = 0; i < maxLen; i++) {
    const c = currentParts[i] || 0;
    const l = latestParts[i] || 0;
    
    if (c < l) return 'lt';
    if (c > l) return 'gt';
  }
  
  return 'eq';
}

// 检查版本更新
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const currentVersion = searchParams.get('version') || '0.0.0';
  const platform = searchParams.get('platform') || 'android';
  
  // 只支持Android平台
  if (platform !== 'android') {
    return NextResponse.json({
      success: false,
      error: '仅支持Android平台',
    }, { status: 400 });
  }
  
  const comparison = compareVersion(currentVersion, LATEST_VERSION.version);
  
  // 检查是否需要更新
  const needsUpdate = comparison === 'lt';
  const isForceUpdate = comparison === 'lt' && compareVersion(currentVersion, LATEST_VERSION.minVersion) === 'lt';
  
  const response = {
    success: true,
    update: needsUpdate,
    forceUpdate: isForceUpdate,
    currentVersion,
    latestVersion: LATEST_VERSION.version,
    versionCode: LATEST_VERSION.versionCode,
    releaseNotes: LATEST_VERSION.releaseNotes,
    downloadUrl: needsUpdate ? `${LATEST_VERSION.downloadUrl}?v=${LATEST_VERSION.version}` : null,
    buildTime: LATEST_VERSION.buildTime,
    // APK信息（实际部署时从存储获取）
    apkInfo: needsUpdate ? {
      size: LATEST_VERSION.apkSize || 0,
      md5: LATEST_VERSION.apkMd5 || '',
      minSdkVersion: 22,
      targetSdkVersion: 34,
    } : null,
  };
  
  return NextResponse.json(response);
}

// 获取版本历史
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const action = body.action || 'history';
  
  switch (action) {
    case 'history':
      // 获取版本历史
      return NextResponse.json({
        success: true,
        versions: VERSION_HISTORY,
      });
      
    case 'check':
      // 检查特定版本
      const targetVersion = body.version;
      if (!targetVersion) {
        return NextResponse.json({
          success: false,
          error: '缺少版本号',
        }, { status: 400 });
      }
      
      const versionInfo = VERSION_HISTORY.find(v => v.version === targetVersion);
      if (!versionInfo) {
        return NextResponse.json({
          success: false,
          error: '版本不存在',
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        version: versionInfo,
      });
      
    default:
      return NextResponse.json({
        success: false,
        error: '未知操作',
      }, { status: 400 });
  }
}

export const dynamic = 'force-dynamic';
