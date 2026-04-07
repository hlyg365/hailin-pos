import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hailin.pos.cashier',
  appName: '海邻收银台',
  webDir: '.next',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // 开发环境：指向本地服务器
    // url: 'http://192.168.1.100:5000',
    // 生产环境：指向已部署的服务器
    url: 'https://hldj365.coze.site',
    // 允许导航到所有URL
    allowNavigation: ['*'],
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
