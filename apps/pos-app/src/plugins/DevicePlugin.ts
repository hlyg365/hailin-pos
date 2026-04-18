/**
 * 海邻到家设备通讯插件
 * 桥接原生Android与Web前端
 */

import { Plugin, callPluginMethod } from './plugin-bridge';

export interface TcpConnectionOptions {
  id?: string;
  host: string;
  port: number;
  timeout?: number;
}

export interface UsbConnectionOptions {
  vendorId?: string;
  baudRate?: number;
}

export interface SendOptions {
  id: string;
  data: string;
  encoding?: 'UTF-8' | 'GBK' | 'hex';
}

export interface DeviceInfo {
  id: string;
  connected: boolean;
}

export interface DeviceDataEvent {
  id: string;
  data: string;
  hexData: string;
  timestamp: number;
}

export interface DevicePlugin {
  /**
   * 连接到TCP网络设备
   */
  connectTcp(options: TcpConnectionOptions): Promise<{ success: boolean; id: string; message: string }>;
  
  /**
   * 断开连接
   */
  disconnect(options: { id: string }): Promise<{ success: boolean; id: string }>;
  
  /**
   * 发送数据
   */
  send(options: SendOptions): Promise<{ success: boolean; sent: number }>;
  
  /**
   * 连接USB设备
   */
  connectUsb(options: UsbConnectionOptions): Promise<{ success: boolean; message: string }>;
  
  /**
   * 列出已连接设备
   */
  listDevices(): Promise<{ devices: Record<string, DeviceInfo> }>;
  
  /**
   * 检查连接状态
   */
  isConnected(options: { id: string }): Promise<{ connected: boolean }>;
  
  // 事件监听
  addListener(event: 'deviceData', callback: (event: DeviceDataEvent) => void): void;
  addListener(event: 'deviceDisconnected', callback: (event: { id: string }) => void): void;
}

// 全局变量声明
declare global {
  interface Window {
    DevicePlugin?: DevicePlugin;
  }
}
