import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hailin.pos.cashier',
  appName: '海邻到家',
  webDir: '.next',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // 收银台APP专用域名 - 应用启动时页面会自动跳转
    url: 'https://hldj365.coze.site',
    // 允许导航到收银台相关页面
    allowNavigation: [
      'https://hldj365.coze.site/*',
      'https://*.coze.site/*',
    ],
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    backgroundColor: '#FF6B35',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#FF6B35',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    BarcodeScanner: {
      skipPermissions: false,
      cameraAccessBackground: false,
    },
  },
};

export default config;
