/**
 * 运行环境检测工具
 * 用于准确检测当前是运行在：
 * - 原生APP环境（Capacitor打包的Android/iOS APP）
 * - PWA环境（渐进式Web应用）
 * - Web环境（普通浏览器）
 */

import { App } from '@capacitor/app';

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
 * 使用Capacitor App插件判断（最准确）
 */
export async function getRuntimeEnvironment(): Promise<RuntimeInfo> {
  try {
    // 尝试使用Capacitor App获取信息
    const info = await App.getInfo();
    return {
      environment: 'app',
      isNative: true,
      platform: info.platform,
      version: info.version,
    };
  } catch {
    // Capacitor不可用，检测PWA或Web
    return detectWebEnvironment();
  }
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
 * 使用Platform API
 */
export function isNativeApp(): boolean {
  try {
    // Capacitor core会抛出错误如果在非原生环境
    const Capacitor = (window as any).Capacitor;
    if (Capacitor && Capacitor.Plugins && Capacitor.Plugins.App) {
      return true;
    }
  } catch {
    // ignore
  }
  
  // 备选方案：检查userAgent
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    // Capacitor Android APP的UA通常包含特定标识
    if (ua.includes('hailin-pos') || ua.includes('capacitor')) {
      return true;
    }
  }
  
  return false;
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
