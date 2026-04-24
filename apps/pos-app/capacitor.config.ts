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
    webContentsDebuggingEnabled: true, // 调试模式开启，方便排查问题
  },
  // 自定义插件声明
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1E40AF',
    },
    HailinHardware: {
      // 硬件插件配置
      enabled: true,
      scaleHost: '192.168.1.100',
      scalePort: 9101,
      printerHost: '192.168.1.101',
      printerPort: 9100,
      labelPrinterHost: '192.168.1.102',
      labelPrinterPort: 9100,
    },
    TTS: {
      // TTS 语音插件配置
      enabled: true,
      defaultRate: 1.0,
      defaultPitch: 1.0,
      defaultLanguage: 'zh-CN',
    },
  },
};

// 导出自定义插件的 JS API 类型声明
declare module '@capacitor/core' {
  interface PluginRegistry {
    HailinHardware: {
      // 枚举可用串口设备
      listSerialPorts(): Promise<{ success: boolean; ports: Array<{ path: string; name: string; readable: boolean; writable: boolean }>; count: number; error?: string }>;
      // 电子秤
      scaleConnect(options: { port: string; baudRate: number; protocol: string }): Promise<{ success: boolean; connectionId?: string }>;
      scaleDisconnect(options: { connectionId: string }): Promise<{ success: boolean }>;
      scaleReadWeight(options: { connectionId: string }): Promise<{ weight: number; unit: string; stable: boolean }>;
      scaleTare(options: { connectionId: string }): Promise<{ success: boolean }>;
      scaleClearTare(options: { connectionId: string }): Promise<{ success: boolean }>;
      scaleCalibrate(options: { connectionId: string; weight: number }): Promise<{ success: boolean }>;
      detectScale(options: { port: string; baudRate: number }): Promise<{ success: boolean; detected: boolean; port?: string; baudRate?: number }>;
      // 打印机
      printerConnect(options: { type: string; host?: string; port?: number }): Promise<{ success: boolean; connectionId?: string }>;
      printerDisconnect(options: { connectionId: string }): Promise<{ success: boolean }>;
      printerPrint(options: { connectionId: string; content: string; copies?: number }): Promise<{ success: boolean }>;
      printerCut(options: { connectionId: string }): Promise<{ success: boolean }>;
      // 钱箱
      openCashDrawer(options: { connectionId?: string }): Promise<{ success: boolean }>;
      // 客显屏
      customerDisplayShow(options: { connectionId?: string; text: string; type?: string }): Promise<{ success: boolean }>;
      customerDisplayClear(options: { connectionId?: string }): Promise<{ success: boolean }>;
      // 扫码枪
      startScanListen(): Promise<{ success: boolean }>;
      stopScanListen(): Promise<{ success: boolean }>;
      // AI 识别
      aiRecognize(options: { imageData: string; type: string }): Promise<{ success: boolean; result: any }>;
      // 设备状态
      getDeviceStatus(): Promise<{ devices: any }>;
    };
    TTS: {
      speak(options: { text: string; id?: string; rate?: number; pitch?: number }): Promise<{ status: string; data?: string }>;
      stop(): Promise<{ status: string }>;
      getStatus(): Promise<{ initialized: boolean; speaking: boolean; language: string; speechRate: number; pitch: number }>;
      setLanguage(options: { language: string }): Promise<{ status: string }>;
      setSpeechRate(options: { rate: number }): Promise<{ status: string }>;
      setPitch(options: { pitch: number }): Promise<{ status: string }>;
      isLanguageAvailable(options: { language: string }): Promise<{ available: boolean; code: number }>;
    };
  }
}

export default config;
