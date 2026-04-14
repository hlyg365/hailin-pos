/**
 * USB设备管理服务 - 收银机专用
 * 
 * 支持接口：
 * - USB 2.0/3.0 全速/高速
 * - USB HID（扫码枪、键盘、鼠标）
 * - USB CDC（虚拟串口）
 * - USB Mass Storage（U盘）
 * 
 * 用于连接：
 * - 条码扫描器（扫码枪）
 * - 顾客显示屏（USB CDC）
 * - USB读卡器（磁条卡、IC卡、NFC）
 * - U盘（数据导出/导入）
 * - USB打印机
 * - 键盘/鼠标
 */

import { UsbDevice } from './index';

// Web USB API 类型声明
declare global {
  interface Navigator {
    usb?: USB;
  }
  
  interface USB {
    getDevices(): Promise<USBDevice[]>;
    requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>;
    addEventListener(type: 'connect' | 'disconnect', listener: (event: USBConnectionEvent) => void): void;
    removeEventListener(type: 'connect' | 'disconnect', listener: (event: USBConnectionEvent) => void): void;
  }
  
  interface USBDevice {
    deviceClass: number;
    deviceSubclass: number;
    deviceProtocol: number;
    vendorId: number;
    deviceId?: number;
    productId: number;
    manufacturerName?: string;
    productName?: string;
    serialNumber?: string;
    configuration?: USBConfiguration;
    configurations: USBConfiguration[];
    opened: boolean;
    open(): Promise<void>;
    close(): Promise<void>;
    selectConfiguration(configurationValue: number): Promise<void>;
    claimInterface(interfaceNumber: number): Promise<void>;
    releaseInterface(interfaceNumber: number): Promise<void>;
    selectAlternateInterface(interfaceNumber: number, alternateSetting: number): Promise<void>;
    controlTransferIn(setup: USBControlTransferParameters, length: number): Promise<USBInTransferResult>;
    controlTransferOut(setup: USBControlTransferParameters, data?: BufferSource): Promise<USBOutTransferResult>;
    transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult>;
    transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
    isochronousTransferIn(endpointNumber: number, packetLengths: number[]): Promise<USBIsochronousInTransferResult>;
    isochronousTransferOut(endpointNumber: number, data: BufferSource, packetLengths: number[]): Promise<USBIsochronousOutTransferResult>;
    reset(): Promise<void>;
    clearHalt(direction: 'in' | 'out', endpointNumber: number): Promise<void>;
  }
  
  interface USBConfiguration {
    configurationValue: number;
    configurationName?: string;
    interfaces: USBInterface[];
  }
  
  interface USBInterface {
    interfaceNumber: number;
    alternate: USBAlternateInterface;
    alternates: USBAlternateInterface[];
    claimed: boolean;
  }
  
  interface USBAlternateInterface {
    alternateSetting: number;
    interfaceClass: number;
    interfaceSubclass: number;
    interfaceProtocol: number;
    interfaceName?: string;
    endpoints: USBEndpoint[];
  }
  
  interface USBEndpoint {
    endpointNumber: number;
    direction: 'in' | 'out';
    type: 'bulk' | 'interrupt' | 'isochronous';
    packetSize: number;
  }
  
  interface USBDeviceRequestOptions {
    filters: USBDeviceFilter[];
  }
  
  interface USBDeviceFilter {
    vendorId?: number;
    productId?: number;
    classCode?: number;
    subclassCode?: number;
    protocolCode?: number;
    serialNumber?: string;
  }
  
  interface USBConnectionEvent extends Event {
    device: USBDevice;
  }
  
  interface USBControlTransferParameters {
    requestType: 'standard' | 'class' | 'vendor';
    recipient: 'device' | 'interface' | 'endpoint' | 'other';
    request: number;
    value: number;
    index: number;
  }
  
  interface USBInTransferResult {
    data?: DataView;
    status: 'ok' | 'stall' | 'babble';
  }
  
  interface USBOutTransferResult {
    bytesWritten: number;
    status: 'ok' | 'stall';
  }
  
  interface USBIsochronousInTransferResult {
    data?: DataView;
    packets: USBIsochronousInTransferPacket[];
  }
  
  interface USBIsochronousOutTransferResult {
    packets: USBIsochronousOutTransferPacket[];
  }
  
  interface USBIsochronousInTransferPacket {
    data?: DataView;
    status: 'ok' | 'stall' | 'babble';
  }
  
  interface USBIsochronousOutTransferPacket {
    bytesWritten: number;
    status: 'ok' | 'stall';
  }
}

// USB设备类型
export type UsbDeviceType = 
  | 'scanner'        // 条码扫描器
  | 'display'        // 顾客显示屏
  | 'card_reader'   // 读卡器
  | 'printer'       // 打印机
  | 'keyboard'       // 键盘
  | 'mouse'          // 鼠标
  | 'storage'        // U盘
  | 'other';         // 其他

// USB设备分类
export const USB_CLASS_CODES = {
  AUDIO: 0x01,
  COMMUNICATIONS: 0x02,
  HID: 0x03,
  PHYSICAL: 0x05,
  IMAGE: 0x06,
  PRINTER: 0x07,
  MASS_STORAGE: 0x08,
  HUB: 0x09,
  CDC_DATA: 0x0A,
  SMART_CARD: 0x0B,
  CONTENT_SECURITY: 0x0D,
  VIDEO: 0x0E,
  PERSONAL_HEALTHCARE: 0x0F,
  DIAGNOSTIC: 0xDC,
  WIRELESS: 0xE0,
  APPLICATION: 0xFE,
  VENDOR: 0xFF,
};

// 常见收银设备VID/PID
export const COMMON_POS_DEVICES = {
  // 条码扫描器
  HONEYWELL_SCANNER: { vendorId: 0x0c2e, name: 'Honeywell条码扫描器' },
  ZEBRA_SCANNER: { vendorId: 0x0a5f, name: 'Zebra条码扫描器' },
  DATALOGIC_SCANNER: { vendorId: 0x05f9, name: 'Datalogic条码扫描器' },
  NEWLAND_SCANNER: { vendorId: 0x1fc9, name: '新大陆条码扫描器' },
  HIKVISION_SCANNER: { vendorId: 0x2b57, name: '海康条码扫描器' },
  
  // 顾客显示屏
  TRIPLE_WIN_DISPLAY: { vendorId: 0x0416, productId: 0x5011, name: '三合一顾客显示屏' },
  PD765_DISPLAY: { vendorId: 0x0416, productId: 0xffff, name: 'PD765顾客显示屏' },
  
  // USB转虚拟串口
  PROLIFIC_2303: { vendorId: 0x067b, productId: 0x2303, name: 'Prolific USB转串口' },
  
  // 打印机
  EPSON_TM: { vendorId: 0x04b8, name: 'Epson TM打印机' },
  STAR_TSP: { vendorId: 0x0519, name: 'Star TSP打印机' },
};

// HID设备信息
export interface HidDeviceInfo {
  vendorId: number;
  productId: number;
  productName: string;
  usagePage?: number;
  usage?: number;
}

// USB设备包装类
export interface UsbDeviceWrapper {
  device: USBDevice;
  type: UsbDeviceType;
  name: string;
  description: string;
  connected: boolean;
  interfaces: string[];
}

// USB设备管理服务
export class UsbService {
  private static instance: UsbService;
  private devices: Map<string, UsbDeviceWrapper> = new Map();
  private listeners: Set<(event: { type: 'connect' | 'disconnect'; device: UsbDeviceWrapper }) => void> = new Set();
  
  private constructor() {
    this.initListeners();
  }
  
  public static getInstance(): UsbService {
    if (!UsbService.instance) {
      UsbService.instance = new UsbService();
    }
    return UsbService.instance;
  }
  
  /**
   * 检查Web USB支持
   */
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'usb' in navigator;
  }
  
  /**
   * 初始化USB事件监听
   */
  private initListeners(): void {
    if (!this.isSupported()) return;
    
    navigator.usb?.addEventListener('connect', async (event: USBConnectionEvent) => {
      const wrapper = await this.wrapDevice(event.device);
      this.devices.set(wrapper.device.serialNumber || wrapper.device.productName || 'unknown', wrapper);
      this.notifyListeners({ type: 'connect', device: wrapper });
    });
    
    navigator.usb?.addEventListener('disconnect', async (event: USBConnectionEvent) => {
      const key = event.device.serialNumber || event.device.productName || 'unknown';
      const wrapper = this.devices.get(key);
      this.devices.delete(key);
      if (wrapper) {
        this.notifyListeners({ type: 'disconnect', device: wrapper });
      }
    });
  }
  
  /**
   * 获取已连接的USB设备
   */
  async getDevices(): Promise<UsbDeviceWrapper[]> {
    if (!this.isSupported()) {
      console.warn('[UsbService] Web USB not supported');
      return [];
    }
    
    try {
      const devices = await navigator.usb!.getDevices();
      const wrappers: UsbDeviceWrapper[] = [];
      
      for (const device of devices) {
        const wrapper = await this.wrapDevice(device);
        this.devices.set(device.serialNumber || device.productName || 'unknown', wrapper);
        wrappers.push(wrapper);
      }
      
      return wrappers;
    } catch (error) {
      console.error('[UsbService] getDevices error:', error);
      return [];
    }
  }
  
  /**
   * 请求连接USB设备
   */
  async requestDevice(type?: UsbDeviceType): Promise<UsbDeviceWrapper | null> {
    if (!this.isSupported()) {
      console.warn('[UsbService] Web USB not supported');
      return null;
    }
    
    try {
      const filters = this.getDeviceFilters(type);
      const device = await navigator.usb!.requestDevice({ filters });
      return await this.wrapDevice(device);
    } catch (error) {
      console.error('[UsbService] requestDevice error:', error);
      return null;
    }
  }
  
  /**
   * 连接到设备
   */
  async connect(device: USBDevice): Promise<boolean> {
    try {
      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }
      
      // 遍历接口并claim
      for (const config of device.configurations) {
        for (const iface of config.interfaces) {
          if (!iface.claimed) {
            await device.claimInterface(iface.interfaceNumber);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('[UsbService] connect error:', error);
      return false;
    }
  }
  
  /**
   * 断开设备连接
   */
  async disconnect(device: USBDevice): Promise<void> {
    try {
      // 释放所有接口
      for (const config of device.configurations) {
        for (const iface of config.interfaces) {
          if (iface.claimed) {
            await device.releaseInterface(iface.interfaceNumber);
          }
        }
      }
      await device.close();
    } catch (error) {
      console.error('[UsbService] disconnect error:', error);
    }
  }
  
  /**
   * 读取HID报告（用于扫码枪）
   */
  async readHIDReport(device: USBDevice, interfaceNumber: number, endpointNumber: number): Promise<Uint8Array | null> {
    try {
      const result = await device.transferIn(endpointNumber, 64);
      if (result.data && result.status === 'ok') {
        return new Uint8Array(result.data.buffer);
      }
    } catch (error) {
      console.error('[UsbService] readHIDReport error:', error);
    }
    return null;
  }
  
  /**
   * 获取设备过滤器
   */
  private getDeviceFilters(type?: UsbDeviceType): USBDeviceFilter[] {
    if (type) {
      switch (type) {
        case 'scanner':
          return [
            { classCode: USB_CLASS_CODES.HID },
            { vendorId: COMMON_POS_DEVICES.NEWLAND_SCANNER.vendorId },
            { vendorId: COMMON_POS_DEVICES.HONEYWELL_SCANNER.vendorId },
            { vendorId: COMMON_POS_DEVICES.ZEBRA_SCANNER.vendorId },
          ];
        case 'display':
          return [
            { vendorId: COMMON_POS_DEVICES.TRIPLE_WIN_DISPLAY.vendorId },
          ];
        case 'printer':
          return [
            { classCode: USB_CLASS_CODES.PRINTER },
            { vendorId: COMMON_POS_DEVICES.EPSON_TM.vendorId },
            { vendorId: COMMON_POS_DEVICES.STAR_TSP.vendorId },
          ];
        case 'storage':
          return [
            { classCode: USB_CLASS_CODES.MASS_STORAGE },
          ];
      }
    }
    
    // 返回所有常见设备
    return Object.values(COMMON_POS_DEVICES).map(d => ({
      vendorId: d.vendorId,
      productId: (d as any).productId,
    }));
  }
  
  /**
   * 识别设备类型
   */
  private identifyDeviceType(device: USBDevice): UsbDeviceType {
    // 按设备类识别
    for (const config of device.configurations) {
      for (const iface of config.interfaces) {
        const ifaceClass = iface.alternate.interfaceClass;
        
        if (ifaceClass === USB_CLASS_CODES.HID) {
          // HID设备判断 - 检查usagePage/usage
          const alt = iface.alternate;
          const usages = (alt as any).usages || [];
          const usagePage = usages[0]?.usagePage;
          const usage = usages[0]?.usage;
          
          if (usagePage === 0x01 && usage === 0x06) {
            return 'keyboard';
          }
          if (usagePage === 0x01 && usage === 0x02) {
            return 'mouse';
          }
          return 'scanner'; // HID默认当扫码枪处理
        }
        
        if (ifaceClass === USB_CLASS_CODES.PRINTER) {
          return 'printer';
        }
        
        if (ifaceClass === USB_CLASS_CODES.MASS_STORAGE) {
          return 'storage';
        }
        
        if (ifaceClass === USB_CLASS_CODES.CDC_DATA) {
          return 'display';
        }
      }
    }
    
    // 按VID/PID识别
    for (const [key, info] of Object.entries(COMMON_POS_DEVICES)) {
      if (device.vendorId === info.vendorId) {
        if (key.includes('SCANNER')) return 'scanner';
        if (key.includes('DISPLAY')) return 'display';
        if (key.includes('PRINTER')) return 'printer';
      }
    }
    
    return 'other';
  }
  
  /**
   * 包装设备
   */
  private async wrapDevice(device: USBDevice): Promise<UsbDeviceWrapper> {
    const type = this.identifyDeviceType(device);
    const name = device.productName || 'USB设备';
    const description = this.getDeviceDescription(device);
    const interfaces = this.getInterfaceNames(device);
    
    return {
      device,
      type,
      name,
      description,
      connected: device.opened,
      interfaces,
    };
  }
  
  /**
   * 获取设备描述
   */
  private getDeviceDescription(device: USBDevice): string {
    const parts: string[] = [];
    
    if (device.manufacturerName) {
      parts.push(device.manufacturerName);
    }
    
    if (device.productName) {
      parts.push(device.productName);
    }
    
    if (device.serialNumber) {
      parts.push(`S/N: ${device.serialNumber}`);
    }
    
    parts.push(`VID:0x${device.vendorId.toString(16).toUpperCase()}`);
    parts.push(`PID:0x${device.productId.toString(16).toUpperCase()}`);
    
    return parts.join(' ');
  }
  
  /**
   * 获取接口名称列表
   */
  private getInterfaceNames(device: USBDevice): string[] {
    const names: string[] = [];
    
    for (const config of device.configurations) {
      for (const iface of config.interfaces) {
        const alt = iface.alternate;
        const className = this.getClassName(alt.interfaceClass);
        names.push(`${className} (Interface ${iface.interfaceNumber})`);
      }
    }
    
    return names;
  }
  
  /**
   * 获取USB类名
   */
  private getClassName(classCode: number): string {
    const entries = Object.entries(USB_CLASS_CODES);
    for (const [name, code] of entries) {
      if (code === classCode) {
        return name.replace(/_/g, ' ');
      }
    }
    return `Class 0x${classCode.toString(16).toUpperCase()}`;
  }
  
  /**
   * 注册设备变化监听
   */
  addEventListener(callback: (event: { type: 'connect' | 'disconnect'; device: UsbDeviceWrapper }) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  /**
   * 通知监听器
   */
  private notifyListeners(event: { type: 'connect' | 'disconnect'; device: UsbDeviceWrapper }): void {
    this.listeners.forEach(listener => listener(event));
  }
  
  /**
   * 获取设备状态摘要
   */
  getStatusSummary(): {
    total: number;
    byType: Record<UsbDeviceType, number>;
  } {
    const byType: Record<UsbDeviceType, number> = {
      scanner: 0,
      display: 0,
      card_reader: 0,
      printer: 0,
      keyboard: 0,
      mouse: 0,
      storage: 0,
      other: 0,
    };
    
    for (const wrapper of this.devices.values()) {
      byType[wrapper.type]++;
    }
    
    return {
      total: this.devices.size,
      byType,
    };
  }
}

// 导出单例
export const usbService = UsbService.getInstance();
export default usbService;
