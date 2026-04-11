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
 * 使用多种方法综合判断
 */
export function getRuntimeEnvironment(): RuntimeInfo {
  // 方法1：检查Capacitor.isNativePlatform()
  if (Capacitor.isNativePlatform()) {
    return {
      environment: 'app',
      isNative: true,
      platform: Capacitor.getPlatform(),
      version: '1.0.0',
    };
  }
  
  // 方法2：检查Android WebView (包含 "wv" 或 "Android")
  if (typeof navigator !== 'undefined' && typeof window !== 'undefined') {
    const ua = navigator.userAgent || '';
    const isAndroidWebView = 
      ua.includes('Android') && 
      (ua.includes('wv') || ua.includes('WebView') || ua.includes('Mobile Safari');
    
    if (isAndroidWebView) {
      return {
        environment: 'app',
        isNative: true,
        platform: 'android',
        version: '1.0.0',
      };
    }
    
    // 方法3：检查Capacitor对象
    const cap = (window as any).Capacitor;
    if (cap && (cap.isNativePlatform || cap.Plugins || cap.platform)) {
      return {
        environment: 'app',
        isNative: true,
        platform: cap.getPlatform ? cap.getPlatform() : 'android',
        version: '1.0.0',
      };
    }
    
    // 方法4：检查是否为PWA
    if ('serviceWorker' in navigator || window.matchMedia('(display-mode: standalone)').matches) {
      return {
        environment: 'pwa',
        isNative: false,
        platform: 'web',
        version: '1.0.0',
      };
    }
  }
  
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
 * 同步检测是否在原生APP中
 */
export function isNativeApp(): boolean {
  // 方法1：Capacitor
  if (Capacitor.isNativePlatform()) {
    return true;
  }
  
  // 方法2：Android WebView
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    if (ua.includes('Android') && (ua.includes('wv') || ua.includes('WebView'))) {
      return true;
    }
  }
  
  // 方法3：Capacitor对象
  const cap = (window as any).Capacitor;
  if (cap && (cap.isNativePlatform || cap.Plugins)) {
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
