import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hailin.pos.cashier',
  appName: '海邻到家',
  webDir: 'out',
  server: {
    // 使用本地构建资源
    androidScheme: 'https',
    // 启动时打开的路径（收银台首页）
    appStartPath: '/pos/index',
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
