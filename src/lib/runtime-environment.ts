/**
 * 运行环境管理
 * 检测和提供运行时环境信息，包括平台、设备类型、网络状态等
 */

import { Capacitor } from '@capacitor/core';

// 平台类型
export type PlatformType = 'android' | 'ios' | 'web' | 'electron' | 'unknown';

// 运行环境类型
export type RuntimeType = 'production' | 'development' | 'test';

// 设备类型
export type DeviceType = 'phone' | 'tablet' | 'desktop' | 'unknown';

// 运行环境信息
export interface RuntimeEnvironment {
  // 平台信息
  platform: PlatformType;
  isNative: boolean;
  isWeb: boolean;
  
  // 运行时环境
  runtime: RuntimeType;
  
  // 设备信息
  deviceType: DeviceType;
  deviceId?: string;
  deviceName?: string;
  
  // 应用信息
  appId?: string;
  appName?: string;
  appVersion?: string;
  
  // 系统信息
  osVersion?: string;
  sdkVersion?: string;
  model?: string;
  
  // 浏览器信息（仅Web）
  browser?: {
    name: string;
    version: string;
    engine: string;
    userAgent: string;
  };
  
  // 功能支持
  features: {
    webSerial: boolean;      // Web Serial API
    webBluetooth: boolean;   // Web Bluetooth API
    serviceWorker: boolean;   // Service Worker
    webWorkers: boolean;      // Web Workers
    indexedDB: boolean;      // IndexedDB
    notifications: boolean;   // Notifications API
    vibration: boolean;       // Vibration API
    geolocation: boolean;    // Geolocation API
    camera: boolean;          // Camera API
    microphone: boolean;     // Microphone API
    screenWakeLock: boolean;  // Wake Lock API
    fileSystem: boolean;      // File System Access API
  };
  
  // 网络状态
  network: {
    online: boolean;
    effectiveType?: string;   // '2g', '3g', '4g', 'slow-2g'
    downlink?: number;        // 带宽（Mbps）
    rtt?: number;            // 往返延迟（ms）
  };
}

// 环境变量
interface WindowCapacitor {
  SplashScreen?: {
    hide: () => Promise<void>;
    show: () => Promise<void>;
  };
  CapPlugin?: Record<string, unknown>;
}

declare global {
  interface Window {
    capacitor?: WindowCapacitor;
    require?: (module: string) => unknown;
  }
}

class RuntimeEnvironmentManager {
  private static instance: RuntimeEnvironmentManager;
  
  private environment: RuntimeEnvironment;
  
  private networkListeners: Array<(online: boolean) => void> = [];
  private orientationListeners: Array<(orientation: string) => void> = [];
  
  private constructor() {
    this.environment = this.detectEnvironment();
    this.setupNetworkListener();
    this.setupOrientationListener();
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(): RuntimeEnvironmentManager {
    if (!RuntimeEnvironmentManager.instance) {
      RuntimeEnvironmentManager.instance = new RuntimeEnvironmentManager();
    }
    return RuntimeEnvironmentManager.instance;
  }
  
  /**
   * 检测运行环境
   */
  private detectEnvironment(): RuntimeEnvironment {
    const platform = this.detectPlatform();
    const runtime = this.detectRuntime();
    const deviceType = this.detectDeviceType();
    const features = this.detectFeatures();
    const network = this.detectNetwork();
    
    const env: RuntimeEnvironment = {
      platform,
      isNative: platform === 'android' || platform === 'ios',
      isWeb: platform === 'web',
      runtime,
      deviceType,
      features,
      network,
    };
    
    // 如果是原生平台，获取更多信息
    if (env.isNative) {
      this.enrichNativeInfo(env);
    }
    
    // 如果是Web平台，获取浏览器信息
    if (env.isWeb) {
      this.enrichWebInfo(env);
    }
    
    return env;
  }
  
  /**
   * 检测平台类型
   */
  private detectPlatform(): PlatformType {
    if (Capacitor.isNativePlatform()) {
      if (Capacitor.getPlatform() === 'ios') {
        return 'ios';
      }
      if (Capacitor.getPlatform() === 'android') {
        return 'android';
      }
    }
    
    // 检测Electron
    if (typeof window !== 'undefined' && 
        (window as any).require?.('electron')) {
      return 'electron';
    }
    
    // Web平台
    return 'web';
  }
  
  /**
   * 检测运行时环境
   */
  private detectRuntime(): RuntimeType {
    // 检查环境变量
    const env = process.env.NODE_ENV || process.env.BUILD_ENV;
    if (env === 'production') return 'production';
    if (env === 'development') return 'development';
    if (env === 'test') return 'test';
    
    // 检查URL参数
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('mode')) {
        const mode = params.get('mode');
        if (mode === 'prod') return 'production';
        if (mode === 'dev') return 'development';
        if (mode === 'test') return 'test';
      }
    }
    
    // 检查原生插件
    if (Capacitor.isNativePlatform()) {
      return 'production'; // 原生平台默认为生产环境
    }
    
    // Web平台检查localhost
    if (typeof window !== 'undefined' && 
        window.location?.hostname === 'localhost') {
      return 'development';
    }
    
    return 'production';
  }
  
  /**
   * 检测设备类型
   */
  private detectDeviceType(): DeviceType {
    if (typeof window === 'undefined') {
      return 'unknown';
    }
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = height / width;
    
    // 检测是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    if (!isMobile) {
      return 'desktop';
    }
    
    // 根据屏幕尺寸判断
    // 平板通常宽度 > 600px 或宽高比接近4:3
    if (width > 600 || (aspectRatio > 1.2 && aspectRatio < 1.6 && width > 500)) {
      return 'tablet';
    }
    
    return 'phone';
  }
  
  /**
   * 检测功能支持
   */
  private detectFeatures(): RuntimeEnvironment['features'] {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    
    return {
      // Web Serial API
      webSerial: 'serial' in (navigator || {}),
      
      // Web Bluetooth API
      webBluetooth: 'bluetooth' in (navigator || {}),
      
      // Service Worker
      serviceWorker: 'serviceWorker' in (nav?.serviceWorker?.constructor ? nav : {}),
      
      // Web Workers
      webWorkers: typeof Worker !== 'undefined',
      
      // IndexedDB
      indexedDB: typeof indexedDB !== 'undefined',
      
      // Notifications
      notifications: 'Notification' in (typeof window !== 'undefined' ? window : {}),
      
      // Vibration
      vibration: 'vibrate' in (nav || {}),
      
      // Geolocation
      geolocation: 'geolocation' in (nav || {}),
      
      // Camera
      camera: !!(nav?.mediaDevices?.getUserMedia),
      
      // Microphone
      microphone: !!(nav?.mediaDevices?.getUserMedia),
      
      // Wake Lock
      screenWakeLock: 'wakeLock' in (navigator || {}),
      
      // File System Access
      fileSystem: 'showOpenFilePicker' in (typeof window !== 'undefined' ? window : {}),
    };
  }
  
  /**
   * 检测网络状态
   */
  private detectNetwork(): RuntimeEnvironment['network'] {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    
    return {
      online: nav?.onLine ?? true,
      effectiveType: (nav as any)?.connection?.effectiveType,
      downlink: (nav as any)?.connection?.downlink,
      rtt: (nav as any)?.connection?.rtt,
    };
  }
  
  /**
   * 补充原生平台信息
   */
  private async enrichNativeInfo(env: RuntimeEnvironment): Promise<void> {
    try {
      // 获取设备信息 - 使用any类型绕过TypeScript检查
      const plugins = (Capacitor as any).Plugins;
      if (plugins?.Device) {
        const deviceInfo = await plugins.Device.getInfo();
        env.osVersion = deviceInfo.osVersion;
        env.sdkVersion = deviceInfo.sdkVersion;
        env.model = deviceInfo.model;
      }
      
      // 获取App信息
      if (plugins?.App) {
        const appInfo = await plugins.App.getInfo();
        env.appId = appInfo.id;
        env.appName = appInfo.name;
        env.appVersion = appInfo.version;
      }
    } catch (error) {
      console.error('Failed to get native info:', error);
    }
  }
  
  /**
   * 补充Web平台信息
   */
  private enrichWebInfo(env: RuntimeEnvironment): void {
    if (typeof navigator === 'undefined') return;
    
    // 浏览器信息
    const ua = navigator.userAgent;
    const browser = this.parseBrowser(ua);
    
    env.browser = {
      name: browser.name,
      version: browser.version,
      engine: browser.engine,
      userAgent: ua,
    };
  }
  
  /**
   * 解析浏览器信息
   */
  private parseBrowser(ua: string): { name: string; version: string; engine: string } {
    let name = 'Unknown';
    let version = '';
    let engine = 'Unknown';
    
    // 检测Chrome
    if (ua.includes('Chrome')) {
      name = 'Chrome';
      engine = 'Blink';
      const match = ua.match(/Chrome\/(\d+)/);
      version = match ? match[1] : '';
    }
    // 检测Firefox
    else if (ua.includes('Firefox')) {
      name = 'Firefox';
      engine = 'Gecko';
      const match = ua.match(/Firefox\/(\d+)/);
      version = match ? match[1] : '';
    }
    // 检测Safari
    else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      name = 'Safari';
      engine = 'WebKit';
      const match = ua.match(/Version\/(\d+)/);
      version = match ? match[1] : '';
    }
    // 检测Edge
    else if (ua.includes('Edg')) {
      name = 'Edge';
      engine = 'Blink';
      const match = ua.match(/Edg\/(\d+)/);
      version = match ? match[1] : '';
    }
    // 检测Opera
    else if (ua.includes('Opera') || ua.includes('OPR')) {
      name = 'Opera';
      engine = 'Blink';
      const match = ua.match(/(?:Opera|OPR)\/(\d+)/);
      version = match ? match[1] : '';
    }
    
    return { name, version, engine };
  }
  
  /**
   * 设置网络状态监听
   */
  private setupNetworkListener(): void {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('online', () => {
      this.updateNetworkStatus(true);
    });
    
    window.addEventListener('offline', () => {
      this.updateNetworkStatus(false);
    });
    
    // 监听网络信息变化
    const connection = (navigator as any)?.connection;
    if (connection) {
      connection.addEventListener('change', () => {
        this.environment.network = this.detectNetwork();
      });
    }
  }
  
  /**
   * 设置屏幕方向监听
   */
  private setupOrientationListener(): void {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('orientationchange', () => {
      const orientation = screen.orientation?.type || 
        (window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
      
      this.orientationListeners.forEach(callback => {
        callback(orientation);
      });
    });
  }
  
  /**
   * 更新网络状态
   */
  private updateNetworkStatus(online: boolean): void {
    this.environment.network.online = online;
    this.networkListeners.forEach(callback => callback(online));
  }
  
  /**
   * 获取完整环境信息
   */
  getEnvironment(): RuntimeEnvironment {
    return { ...this.environment };
  }
  
  /**
   * 获取平台类型
   */
  getPlatform(): PlatformType {
    return this.environment.platform;
  }
  
  /**
   * 检查是否为原生平台
   */
  isNative(): boolean {
    return this.environment.isNative;
  }
  
  /**
   * 检查是否为Web平台
   */
  isWeb(): boolean {
    return this.environment.isWeb;
  }
  
  /**
   * 检查是否为生产环境
   */
  isProduction(): boolean {
    return this.environment.runtime === 'production';
  }
  
  /**
   * 检查是否为开发环境
   */
  isDevelopment(): boolean {
    return this.environment.runtime === 'development';
  }
  
  /**
   * 检查是否支持特定功能
   */
  hasFeature(feature: keyof RuntimeEnvironment['features']): boolean {
    return this.environment.features[feature];
  }
  
  /**
   * 获取网络状态
   */
  isOnline(): boolean {
    return this.environment.network.online;
  }
  
  /**
   * 获取设备ID
   */
  async getDeviceId(): Promise<string | undefined> {
    if (this.environment.deviceId) {
      return this.environment.deviceId;
    }
    
    const plugins = (Capacitor as any).Plugins;
    if (Capacitor.isNativePlatform() && plugins?.Device) {
      try {
        const deviceInfo = await plugins.Device.getInfo();
        this.environment.deviceId = deviceInfo.uuid;
        return this.environment.deviceId;
      } catch (error) {
        console.error('Failed to get device ID:', error);
      }
    }
    
    return undefined;
  }
  
  /**
   * 注册网络状态变化监听
   */
  onNetworkChange(callback: (online: boolean) => void): () => void {
    this.networkListeners.push(callback);
    return () => {
      this.networkListeners = this.networkListeners.filter(cb => cb !== callback);
    };
  }
  
  /**
   * 注册屏幕方向变化监听
   */
  onOrientationChange(callback: (orientation: string) => void): () => void {
    const listeners = this.orientationListeners;
    listeners.push(callback);
    
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * 刷新环境信息
   */
  refresh(): void {
    this.environment = this.detectEnvironment();
  }
  
  /**
   * 输出环境信息到控制台
   */
  logInfo(): void {
    console.group('Runtime Environment');
    console.log('Platform:', this.environment.platform);
    console.log('Runtime:', this.environment.runtime);
    console.log('Device Type:', this.environment.deviceType);
    console.log('Is Native:', this.environment.isNative);
    console.log('Is Web:', this.environment.isWeb);
    console.log('Network:', this.environment.network);
    console.log('Features:', this.environment.features);
    if (this.environment.browser) {
      console.log('Browser:', this.environment.browser);
    }
    console.groupEnd();
  }
}

// 导出单例
export const runtimeEnvironment = RuntimeEnvironmentManager.getInstance();

// 导出类
export { RuntimeEnvironmentManager };
