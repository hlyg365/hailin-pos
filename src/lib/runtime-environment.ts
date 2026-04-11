/**
 * 运行环境检测工具
 * 用于准确检测当前是运行在：
 * - 原生APP环境（Capacitor打包的Android/iOS APP）
 * - PWA环境（渐进式Web应用）
 * - Web环境（普通浏览器）
 */

import { Capacitor } from '@capacitor/core';

// 运行环境类型
export type RuntimeEnvironment = 'app' | 'pwa' | 'web';

// 运行环境信息
export interface RuntimeInfo {
  environment: RuntimeEnvironment;
  isNative: boolean;
  platform: string;
  version: string;
}

/**
 * 检测当前运行环境
 * 使用Capacitor.isNativePlatform()判断（最可靠）
 */
export function getRuntimeEnvironment(): RuntimeInfo {
  // 优先使用Capacitor.isNativePlatform()判断
  if (Capacitor.isNativePlatform()) {
    return {
      environment: 'app',
      isNative: true,
      platform: Capacitor.getPlatform(),
      version: '1.0.0',
    };
  }
  
  // 非原生环境，检测PWA或Web
  return detectWebEnvironment();
}

/**
 * 异步检测当前运行环境
 */
export async function getRuntimeEnvironmentAsync(): Promise<RuntimeInfo> {
  // 同步判断优先
  if (Capacitor.isNativePlatform()) {
    return {
      environment: 'app',
      isNative: true,
      platform: Capacitor.getPlatform(),
      version: '1.0.0',
    };
  }
  
  // 非原生，检测PWA
  return detectWebEnvironment();
}

/**
 * 检测Web环境（PWA或普通Web）
 */
function detectWebEnvironment(): RuntimeInfo {
  // 检查是否为PWA（已安装到主屏幕）
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  if (isStandalone || 'serviceWorker' in navigator) {
    return {
      environment: 'pwa',
      isNative: false,
      platform: 'web',
      version: '1.0.0',
    };
  }

  return {
    environment: 'web',
    isNative: false,
    platform: 'web',
    version: '1.0.0',
  };
}

/**
 * 同步检测是否在原生APP中（快速判断）
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * 获取运行环境描述
 */
export function getEnvironmentDisplayName(env: RuntimeEnvironment): string {
  switch (env) {
    case 'app':
      return 'APP环境';
    case 'pwa':
      return 'PWA环境';
    case 'web':
      return 'Web环境';
    default:
      return '未知环境';
  }
}
