import { NextResponse } from 'next/server';

// 当前APP版本信息
const APP_VERSION = {
  version: '3.0.0',
  buildNumber: 20260412,
  releaseDate: '2024-04-12',
  downloadUrl: process.env.APP_DOWNLOAD_URL || 'https://coze-coding-project.tos.coze.site/coze_storage_7617372917596323890/hailin-pos-v3.0-final_b6b027c7.apk',
  minVersion: '2.0.0', // 最低支持的版本，低于此版本强制更新
  releaseNotes: [
    '修复电子秤连接问题',
    '优化客显屏检测功能',
    '修复钱箱控制',
    '优化小票打印',
    '支持APP自动更新',
  ],
};

// 设备信息
const DEVICE_INFO = {
  appName: '海邻到家收银台',
  packageName: 'com.hailin.pos.cashier',
  platform: 'android',
};

export async function GET() {
  return NextResponse.json({
    success: true,
    ...APP_VERSION,
    ...DEVICE_INFO,
  });
}
