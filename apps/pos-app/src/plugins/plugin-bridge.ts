/**
 * 插件桥接层
 * 优先使用原生Capacitor插件，回退到模拟实现
 */

import { TcpConnectionOptions, UsbConnectionOptions, SendOptions, DeviceInfo, DeviceDataEvent } from './DevicePlugin';

// 原生插件引用
declare global {
  interface Window {
    DevicePlugin?: {
      connectTcp(options: TcpConnectionOptions): Promise<{ success: boolean; id: string; message: string }>;
      disconnect(options: { id: string }): Promise<{ success: boolean; id: string }>;
      send(options: SendOptions): Promise<{ success: boolean; sent: number }>;
      connectUsb(options: UsbConnectionOptions): Promise<{ success: boolean; message: string }>;
      listDevices(): Promise<{ devices: Record<string, DeviceInfo> }>;
      isConnected(options: { id: string }): Promise<{ connected: boolean }>;
      addListener(event: string, callback: (event: any) => void): { remove: () => void };
    };
  }
}

// 检查是否在Capacitor环境中
const isCapacitor = typeof window !== 'undefined' && window.DevicePlugin !== undefined;

// 事件监听器存储
const eventListeners: Map<string, Set<(data: any) => void>> = new Map();

/**
 * 设备插件API
 */
export const deviceApi = {
  /**
   * 连接TCP设备
   */
  async connectTcp(options: TcpConnectionOptions): Promise<{ success: boolean; id: string; message: string }> {
    if (isCapacitor) {
      return window.DevicePlugin!.connectTcp(options);
    }
    
    // 模拟实现 - 在浏览器环境模拟连接
    const id = options.id || `tcp_${Date.now()}`;
    console.log(`[模拟] TCP连接: ${options.host}:${options.port}`);
    
    return {
      success: true,
      id,
      message: `已连接到 ${options.host}:${options.port}`
    };
  },
  
  /**
   * 断开连接
   */
  async disconnect(options: { id: string }): Promise<{ success: boolean; id: string }> {
    if (isCapacitor) {
      return window.DevicePlugin!.disconnect(options);
    }
    
    console.log(`[模拟] 断开连接: ${options.id}`);
    return { success: true, id: options.id };
  },
  
  /**
   * 发送数据
   */
  async send(options: SendOptions): Promise<{ success: boolean; sent: number }> {
    if (isCapacitor) {
      return window.DevicePlugin!.send(options);
    }
    
    console.log(`[模拟] 发送数据:`, options.data.substring(0, 50) + (options.data.length > 50 ? '...' : ''));
    return { success: true, sent: options.data.length };
  },
  
  /**
   * 连接USB设备
   */
  async connectUsb(options: UsbConnectionOptions): Promise<{ success: boolean; message: string }> {
    if (isCapacitor) {
      return window.DevicePlugin!.connectUsb(options);
    }
    
    console.log(`[模拟] USB连接:`, options);
    return {
      success: false,
      message: 'USB需要原生插件支持，请使用网络连接'
    };
  },
  
  /**
   * 列出设备
   */
  async listDevices(): Promise<{ devices: Record<string, DeviceInfo> }> {
    if (isCapacitor) {
      return window.DevicePlugin!.listDevices();
    }
    
    return { devices: {} };
  },
  
  /**
   * 检查连接
   */
  async isConnected(options: { id: string }): Promise<{ connected: boolean }> {
    if (isCapacitor) {
      return window.DevicePlugin!.isConnected(options);
    }
    
    return { connected: true };
  },
  
  /**
   * 添加事件监听
   */
  addListener(event: string, callback: (data: any) => void): () => void {
    if (isCapacitor) {
      const listener = window.DevicePlugin!.addListener(event, callback);
      return () => listener.remove();
    }
    
    // 模拟实现
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event)!.add(callback);
    
    return () => {
      eventListeners.get(event)?.delete(callback);
    };
  },
  
  /**
   * 触发事件
   */
  emit(event: string, data: any): void {
    eventListeners.get(event)?.forEach(callback => callback(data));
  },
  
  /**
   * 是否为原生环境
   */
  isNative(): boolean {
    return isCapacitor;
  }
};

export default deviceApi;
