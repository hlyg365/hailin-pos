/**
 * DevicePlugin 桥接
 * 将 DevicePlugin API 桥接到 HailinHardware 原生插件
 */
import { Capacitor } from '@capacitor/core';

// DevicePlugin 接口定义
interface DevicePluginAPI {
  connectTcp(options: { id?: string; host: string; port: number }): Promise<{ success: boolean; id: string; message: string }>;
  disconnect(options: { id: string }): Promise<{ success: boolean; id: string }>;
  send(options: { id: string; data: string }): Promise<{ success: boolean; sent: number }>;
  connectUsb(options: { vendorId?: number; productId?: number }): Promise<{ success: boolean; message: string }>;
  listDevices(): Promise<{ devices: Record<string, any> }>;
  isConnected(options: { id: string }): Promise<{ connected: boolean }>;
  addListener(event: string, callback: (data: any) => void): { remove: () => void };
}

// HailinHardware 插件引用
let hailinHardware: any = null;

// 连接存储
const connections: Map<string, { type: 'tcp' | 'usb'; host?: string; port?: number }> = new Map();

// 初始化时注册 DevicePlugin 到 window
function registerDevicePlugin() {
  if (typeof window === 'undefined') return;
  
  // 检查是否已经注册
  if ((window as any).DevicePlugin) return;
  
  console.log('[DevicePlugin桥接] 正在注册...');
  
  // 尝试获取 HailinHardware 插件
  const getHailinHardware = (): any => {
    // 方式1: Capacitor.Plugins
    if ((Capacitor as any).Plugins?.HailinHardware) {
      return (Capacitor as any).Plugins.HailinHardware;
    }
    // 方式2: Capacitor.getPlugin
    if ((Capacitor as any).getPlugin?.('HailinHardware')) {
      return (Capacitor as any).getPlugin('HailinHardware');
    }
    // 方式3: window.HailinHardware (Cordova)
    if ((window as any).HailinHardware) {
      return (window as any).HailinHardware;
    }
    return null;
  };
  
  // 创建一个 DevicePlugin 实现，桥接到 HailinHardware
  const devicePlugin: DevicePluginAPI = {
    async connectTcp(options) {
      console.log('[DevicePlugin] connectTcp:', options);
      const hw = getHailinHardware();
      if (hw) {
        try {
          const result = await hw.printerConnect({ host: options.host, port: options.port });
          if (result.success) {
            const id = options.id || `tcp_${options.host}_${options.port}`;
            connections.set(id, { type: 'tcp', host: options.host, port: options.port });
            return { success: true, id, message: '连接成功' };
          }
          return { success: false, id: '', message: result.error || '连接失败' };
        } catch (e: any) {
          return { success: false, id: '', message: e.message };
        }
      }
      // 模拟
      const id = options.id || `tcp_${Date.now()}`;
      connections.set(id, { type: 'tcp', host: options.host, port: options.port });
      return { success: true, id, message: '模拟连接' };
    },
    
    async disconnect(options) {
      console.log('[DevicePlugin] disconnect:', options.id);
      connections.delete(options.id);
      const hw = getHailinHardware();
      if (hw && hw.printerDisconnect) {
        try {
          await hw.printerDisconnect();
        } catch (e) {}
      }
      return { success: true, id: options.id };
    },
    
    async send(options) {
      console.log('[DevicePlugin] send to', options.id, ':', options.data.substring(0, 30));
      // 在实际实现中，这里需要调用原生插件发送数据
      // 目前 HailinHardware 没有直接的 send 方法，需要添加
      return { success: true, sent: options.data.length };
    },
    
    async connectUsb(options) {
      console.log('[DevicePlugin] connectUsb:', options);
      // USB 串口连接暂不支持
      return { success: false, message: 'USB连接请使用串口模式' };
    },
    
    async listDevices() {
      console.log('[DevicePlugin] listDevices');
      // 返回已建立的连接
      const devices: Record<string, any> = {};
      connections.forEach((conn, id) => {
        devices[id] = conn;
      });
      return { devices };
    },
    
    async isConnected(options) {
      return { connected: connections.has(options.id) };
    },
    
    addListener(event, callback) {
      console.log('[DevicePlugin] addListener:', event);
      const hw = getHailinHardware();
      if (hw && hw.addListener) {
        hw.addListener(event, callback);
      }
      return { remove: () => {} };
    }
  };
  
  // 注册到 window
  (window as any).DevicePlugin = devicePlugin;
  console.log('[DevicePlugin桥接] 注册完成');
}

// 页面加载后注册
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(registerDevicePlugin, 100);
    });
  } else {
    setTimeout(registerDevicePlugin, 100);
  }
}

// 延迟重试注册
let retryCount = 0;
const maxRetries = 10;
const retryInterval = setInterval(() => {
  if (!(window as any).DevicePlugin) {
    registerDevicePlugin();
    retryCount++;
    if (retryCount >= maxRetries) {
      clearInterval(retryInterval);
      console.warn('[DevicePlugin桥接] 注册超时');
    }
  } else {
    clearInterval(retryInterval);
  }
}, 500);

// 导出
export { registerDevicePlugin };
