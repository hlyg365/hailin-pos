import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hailin.pos.cashier',
  appName: '海邻到家',
  versionCode: 302,
  versionName: '3.0.4',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // 启动时直接进入收银台
    appStartPath: '/pos/cashier',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    backgroundColor: '#FF6B35',
    // 移除不必要的权限
    overrideUserAgent: 'HaiLinPOS/3.0.4 Android',
  },
  // 关闭Web调试
  debuggingEnabled: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#FF6B35',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    BarcodeScanner: {
      skipPermissions: true,
    },
    Network: {
      // 网络状态监测
    },
  },
};

export default config;
