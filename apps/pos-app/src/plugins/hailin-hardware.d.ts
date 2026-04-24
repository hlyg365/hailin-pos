/**
 * HailinHardware 插件 TypeScript 声明
 * 确保 Capacitor 能正确识别插件
 */
import '@capacitor/core';

declare module '@capacitor/core' {
  interface PluginRegistry {
    HailinHardware: {
      // 电子秤
      scaleConnect(options: { port: string; baudRate: number; protocol?: string }): Promise<{ success: boolean; connectionId?: string }>;
      scaleConnectTcp(options: { host: string; port: number; protocol?: string }): Promise<{ success: boolean; connectionId?: string }>;
      scaleDisconnect(options?: { connectionId?: string }): Promise<{ success: boolean }>;
      scaleReadWeight(options?: { connectionId?: string }): Promise<{ weight: number; unit: string; stable: boolean; raw?: string }>;
      scaleTare(options?: { connectionId?: string }): Promise<{ success: boolean }>;
      scaleZero(options?: { connectionId?: string }): Promise<{ success: boolean }>;
      scaleClearTare(options?: { connectionId?: string }): Promise<{ success: boolean }>;
      detectScale(options: { port: string; baudRate: number }): Promise<{ success: boolean; detected: boolean; port?: string; baudRate?: number }>;
      
      // 枚举可用串口设备
      listSerialPorts(): Promise<{ success: boolean; ports: Array<{ path: string; name: string; readable: boolean; writable: boolean }>; count: number; error?: string }>;
      
      // 打印机
      printerConnect(options: { host: string; port: number }): Promise<{ success: boolean; connectionId?: string }>;
      printerInit(): Promise<{ success: boolean }>;
      printerPrintText(options: { text: string; align?: string; bold?: boolean }): Promise<{ success: boolean }>;
      printerNewLine(options?: { lines: number }): Promise<{ success: boolean }>;
      printerPrintDivider(options?: { type?: string }): Promise<{ success: boolean }>;
      printerPrintQRCode(options: { data: string; size?: number }): Promise<{ success: boolean }>;
      printerPrintBarcode(options: { data: string; type?: string; height?: number }): Promise<{ success: boolean }>;
      printerBeep(options?: { count?: number }): Promise<{ success: boolean }>;
      printerCut(options?: { full?: boolean }): Promise<{ success: boolean }>;
      printerPrintReceipt(options: { receiptData: string }): Promise<{ success: boolean }>;
      printerDisconnect(): Promise<{ success: boolean }>;
      
      // 钱箱
      openCashDrawer(options?: { connectionId?: string }): Promise<{ success: boolean }>;
      
      // 客显屏
      showOnCustomerDisplay(options: { mode: string; title?: string; amount?: number }): Promise<{ success: boolean }>;
      dismissCustomerDisplay(): Promise<{ success: boolean }>;
      
      // 扫码枪
      enableBarcodeScanner(): Promise<{ success: boolean }>;
      disableBarcodeScanner(): Promise<{ success: boolean }>;
      getLastScan(): Promise<{ barcode: string; timestamp: number }>;
      
      // AI 识别
      captureAndRecognize(options: { imageData: string; type?: string }): Promise<{ success: boolean; result?: any }>;
      
      // 设备状态
      getDeviceStatus(): Promise<{ scaleConnected: boolean; printerConnected: boolean }>;
      disconnectAll(): Promise<{ success: boolean }>;
      
      // 事件监听
      addListener(eventName: string, callback: (data: any) => void): Promise<{ remove: () => void }>;
      removeAllListeners(): Promise<{ success: boolean }>;
    };
    
    TTS: {
      speak(options: { text: string; id?: string; rate?: number; pitch?: number }): Promise<{ status: string }>;
      stop(): Promise<{ status: string }>;
      getStatus(): Promise<{ initialized: boolean; speaking: boolean }>;
      setSpeechRate(options: { rate: number }): Promise<{ status: string }>;
      isLanguageAvailable(options: { language: string }): Promise<{ available: boolean }>;
    };
  }
}
