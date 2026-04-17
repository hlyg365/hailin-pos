import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hailin.pos',
  appName: '海邻到家',
  webDir: 'dist',
  server: {
    // 如果需要指定服务器地址，取消下面的注释并修改
    // androidScheme: 'https',
  },
  android: {
    backgroundColor: '#1E40AF', // 蓝色背景
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1E40AF',
    },
  },
};

export default config;
