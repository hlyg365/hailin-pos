import { registerPlugin } from '@capacitor/core';
import type { HailinHardwarePlugin } from './definitions';

const HailinHardware = registerPlugin<HailinHardwarePlugin>('HailinHardware', {
  web: {
    loadPlugin() {
      // 尝试加载 cordova.js 中的桥接
      if (typeof window !== 'undefined' && (window as any).HailinHardware) {
        console.log('[Capacitor] 从 cordova.js 加载 HailinHardware');
        return (window as any).HailinHardware;
      }
      
      // 如果 cordova.js 未加载，返回一个模拟对象用于调试提示
      console.warn('[Capacitor] HailinHardware 未就绪，请检查 cordova.js 是否加载');
      return {
        scaleConnect: () => Promise.reject(new Error('插件未就绪，请检查APP版本或cordova.js是否加载')),
        scaleDisconnect: () => Promise.reject(new Error('插件未就绪')),
        scaleReadWeight: () => Promise.reject(new Error('插件未就绪')),
        scaleTare: () => Promise.reject(new Error('插件未就绪')),
        scaleZero: () => Promise.reject(new Error('插件未就绪')),
        listSerialPorts: () => Promise.reject(new Error('插件未就绪，请检查APP版本或cordova.js是否加载')),
        scaleConnectTcp: () => Promise.reject(new Error('插件未就绪')),
        printerConnect: () => Promise.reject(new Error('插件未就绪')),
        printerInit: () => Promise.reject(new Error('插件未就绪')),
        printerPrintText: () => Promise.reject(new Error('插件未就绪')),
        printerNewLine: () => Promise.reject(new Error('插件未就绪')),
        printerPrintQRCode: () => Promise.reject(new Error('插件未就绪')),
        printerPrintBarcode: () => Promise.reject(new Error('插件未就绪')),
        printerBeep: () => Promise.reject(new Error('插件未就绪')),
        printerCut: () => Promise.reject(new Error('插件未就绪')),
        printerPrintReceipt: () => Promise.reject(new Error('插件未就绪')),
        printerDisconnect: () => Promise.reject(new Error('插件未就绪')),
        openCashDrawer: () => Promise.reject(new Error('插件未就绪')),
        showOnCustomerDisplay: () => Promise.reject(new Error('插件未就绪')),
        dismissCustomerDisplay: () => Promise.reject(new Error('插件未就绪')),
        enableBarcodeScanner: () => Promise.reject(new Error('插件未就绪')),
        disableBarcodeScanner: () => Promise.reject(new Error('插件未就绪')),
        getLastScan: () => Promise.reject(new Error('插件未就绪')),
        captureAndRecognize: () => Promise.reject(new Error('插件未就绪')),
        getDeviceStatus: () => Promise.reject(new Error('插件未就绪')),
        disconnectAll: () => Promise.reject(new Error('插件未就绪')),
        labelPrinterConnect: () => Promise.reject(new Error('插件未就绪')),
        labelInit: () => Promise.reject(new Error('插件未就绪')),
        labelPrint: () => Promise.reject(new Error('插件未就绪')),
        detectScale: () => Promise.reject(new Error('插件未就绪')),
        addListener: () => ({ remove: () => {} }),
        removeAllListeners: () => Promise.reject(new Error('插件未就绪')),
      };
    }
  }
});

export { HailinHardware };
export default HailinHardware;
