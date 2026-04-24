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
        listSerialPorts: () => Promise.reject(new Error('插件未就绪')),
        addListener: () => ({ remove: () => {} }),
      };
    }
  }
});

export { HailinHardware };
export default HailinHardware;
