/**
 * 运行环境检测工具
 * 用于准确检测当前是运行在：
 * - 原生APP环境（Capacitor打包的Android/iOS APP）
 * - PWA环境（渐进式Web应用）
 * - Web环境（普通浏览器）
 */

// 延迟加载 Capacitor
let Capacitor: any = null;
function getCapacitor() {
  if (Capacitor === null && typeof window !== 'undefined') {
    Capacitor = (window as any).Capacitor;
  }
  return Capacitor;
}

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
 * 使用多种方法综合判断，确保在Android WebView中能正确识别
 */
export function getRuntimeEnvironment(): RuntimeInfo {
  if (typeof window === 'undefined') {
    return { environment: 'web', isNative: false, platform: 'web', version: '1.0.0' };
  }

  const cap = getCapacitor();
  
  // 获取userAgent
  const ua = navigator.userAgent || '';
  
  // 方法1：检查Capacitor.isNativePlatform()
  if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
    return {
      environment: 'app',
      isNative: true,
      platform: cap.getPlatform ? cap.getPlatform() : 'android',
      version: '1.0.0',
    };
  }
  
  // 方法2：检查Android WebView特征
  // Android WebView的UA通常包含 "Android" 和 "wv" 或 "WebView"
  const isAndroidWebView = 
    ua.includes('Android') && 
    (ua.includes('wv') || ua.includes('WebView'));
  
  if (isAndroidWebView) {
    return {
      environment: 'app',
      isNative: true,
      platform: 'android',
      version: '1.0.0',
    };
  }
  
  // 方法3：检查Capacitor对象存在且有插件
  if (cap && (cap.Plugins || cap.platform)) {
    // 检查是否有原生插件
    const hasPlugins = cap.Plugins && Object.keys(cap.Plugins).length > 0;
    if (hasPlugins || cap.isNative) {
      return {
        environment: 'app',
        isNative: true,
        platform: cap.getPlatform ? cap.getPlatform() : 'android',
        version: '1.0.0',
      };
    }
  }
  
  // 方法4：检查是否为PWA（已安装到主屏幕或有ServiceWorker）
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  if (isStandalone || 'serviceWorker' in navigator) {
    return {
      environment: 'pwa',
      isNative: false,
      platform: 'web',
      version: '1.0.0',
    };
  }
  
  // 默认Web环境
  return {
    environment: 'web',
    isNative: false,
    platform: 'web',
    version: '1.0.0',
  };
}

/**
 * 异步检测当前运行环境
 */
export async function getRuntimeEnvironmentAsync(): Promise<RuntimeInfo> {
  return getRuntimeEnvironment();
}

/**
 * 同步检测是否在原生APP中（快速判断）
 * 这是最常用的方法
 */
export function isNativeApp(): boolean {
  const c = getCapacitor();
  
  // 方法1：Capacitor.isNativePlatform()
  if (c && c.isNativePlatform && c.isNativePlatform()) {
    return true;
  }
  
  // 方法2：Android WebView
  const ua = navigator.userAgent || '';
  if (ua.includes('Android') && (ua.includes('wv') || ua.includes('WebView'))) {
    return true;
  }
  
  // 方法3：Capacitor对象有插件
  if (c && c.Plugins && Object.keys(c.Plugins).length > 0) {
    return true;
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
