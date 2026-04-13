/**
 * APP 配置管理
 * 管理不同环境下的服务器连接地址
 */

// 环境类型
type Environment = 'development' | 'staging' | 'production';

// 配置接口
interface AppConfig {
  env: Environment;
  apiBaseUrl: string;
  wsBaseUrl: string;
  enableDebug: boolean;
}

// 环境配置
const configs: Record<Environment, AppConfig> = {
  development: {
    env: 'development',
    // 开发环境使用本地服务器
    apiBaseUrl: 'http://10.0.2.2:5000', // Android 模拟器访问本机
    wsBaseUrl: 'ws://10.0.2.2:5000',
    enableDebug: true,
  },
  staging: {
    env: 'staging',
    // 测试环境
    apiBaseUrl: 'https://staging.hailin-pos.com',
    wsBaseUrl: 'wss://staging.hailin-pos.com',
    enableDebug: true,
  },
  production: {
    env: 'production',
    // 生产环境 - 使用环境变量或默认值
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://pos.hailin-pos.com',
    wsBaseUrl: process.env.NEXT_PUBLIC_WS_URL || 'wss://pos.hailin-pos.com',
    enableDebug: false,
  },
};

// 获取当前环境
function getEnvironment(): Environment {
  // 优先使用环境变量
  const env = process.env.NODE_ENV;
  if (env === 'production') return 'production';
  if (env === 'test') return 'staging';
  return 'development';
}

// 获取当前配置
export function getAppConfig(): AppConfig {
  const env = getEnvironment();
  return configs[env];
}

// 导出配置
export const appConfig = getAppConfig();

// API 请求基础 URL
export const API_BASE_URL = appConfig.apiBaseUrl;

// WebSocket 基础 URL
export const WS_BASE_URL = appConfig.wsBaseUrl;

// 是否启用调试
export const IS_DEBUG = appConfig.enableDebug;

/**
 * 构建完整的 API URL
 */
export function buildApiUrl(path: string): string {
  const baseUrl = API_BASE_URL;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * 获取当前店铺的 API URL
 */
export function getShopApiUrl(shopId: string): string {
  return buildApiUrl(`/api/shops/${shopId}`);
}

/**
 * APP 信息
 */
export const APP_INFO = {
  appId: 'com.hailin.pos.cashier',
  appName: '海邻收银台',
  version: '1.0.0',
  buildNumber: 1,
};

/**
 * 存储/获取服务器地址（用于运行时配置）
 */
const SERVER_URL_KEY = 'hailin_server_url';

export function setServerUrl(url: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SERVER_URL_KEY, url);
  }
}

export function getServerUrl(): string | null {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(SERVER_URL_KEY);
  }
  return null;
}

export function getEffectiveApiUrl(): string {
  // 优先使用运行时配置的服务器地址
  const runtimeUrl = getServerUrl();
  if (runtimeUrl) {
    return runtimeUrl;
  }
  return API_BASE_URL;
}
