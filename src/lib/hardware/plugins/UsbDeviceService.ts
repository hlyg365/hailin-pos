/**
 * USB设备服务 - USB设备管理
 * 提供USB设备的枚举、连接、断开、事件监听等功能
 * 支持USB扫码枪、打印机、钱箱等设备
 */

// USB设备类型
export type UsbDeviceType = 'scanner' | 'printer' | 'cashbox' | 'scale' | 'unknown';

// USB设备信息
export interface UsbDevice {
  id: string;
  name: string;
  type: UsbDeviceType;
  vendorId: string;
  productId: string;
  serialNumber?: string;
  status: 'connected' | 'disconnected' | 'error';
  device?: USBDevice;
}

// USB设备事件类型
export type UsbDeviceEventType = 'connect' | 'disconnect' | 'error';

// USB设备事件回调
export type UsbDeviceEventCallback = (device: UsbDevice) => void;

// USB设备服务类
class UsbDeviceService {
  private devices: Map<string, UsbDevice> = new Map();
  private eventListeners: Map<UsbDeviceEventType, Set<UsbDeviceEventCallback>> = new Map();
  private static instance: UsbDeviceService;

  private constructor() {
    // 初始化事件监听器
    this.eventListeners.set('connect', new Set());
    this.eventListeners.set('disconnect', new Set());
    this.eventListeners.set('error', new Set());
  }

  // 获取单例实例
  static getInstance(): UsbDeviceService {
    if (!UsbDeviceService.instance) {
      UsbDeviceService.instance = new UsbDeviceService();
    }
    return UsbDeviceService.instance;
  }

  // 添加事件监听器
  addEventListener(event: UsbDeviceEventType, callback: UsbDeviceEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  // 移除事件监听器
  removeEventListener(event: UsbDeviceEventType, callback: UsbDeviceEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  // 触发事件
  private emitEvent(event: UsbDeviceEventType, device: UsbDevice): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(device);
        } catch (error) {
          console.error(`Error in USB ${event} event listener:`, error);
        }
      });
    }
  }

  // 判断设备类型
  private determineDeviceType(device: USBDevice): UsbDeviceType {
    const productName = (device.productName || '').toLowerCase();
    const vendorId = device.vendorId.toString(16).toLowerCase();

    // 根据产品名称判断
    if (productName.includes('scanner') || productName.includes('扫码')) {
      return 'scanner';
    }
    if (productName.includes('print') || productName.includes('printer') || productName.includes('打印机')) {
      return 'printer';
    }
    if (productName.includes('cash') || productName.includes('钱箱') || productName.includes('drawer')) {
      return 'cashbox';
    }
    if (productName.includes('scale') || productName.includes('秤') || productName.includes('weight')) {
      return 'scale';
    }

    // 根据Vendor ID判断（常见厂商）
    const knownVendors: Record<string, UsbDeviceType> = {
      '04b8': 'printer', // Epson
      '04a9': 'printer', // Canon
      '067b': 'printer', // Prolific (串口转USB)
      '1d6b': 'unknown', // Linux Foundation
      '046d': 'scanner', // Logitech (扫码枪)
    };

    if (knownVendors[vendorId]) {
      return knownVendors[vendorId];
    }

    return 'unknown';
  }

  // 获取设备列表
  async getDevices(): Promise<UsbDevice[]> {
    if (!('usb' in navigator)) {
      console.warn('WebUSB API not supported');
      return [];
    }

    try {
      // 请求访问USB设备
      const device = await (navigator as any).usb.requestDevice({ filters: [] });
      
      if (device) {
        const usbDevice: UsbDevice = {
          id: device.serialNumber || `${device.vendorId}-${device.productId}`,
          name: device.productName || 'Unknown Device',
          type: this.determineDeviceType(device),
          vendorId: device.vendorId.toString(16),
          productId: device.productId.toString(16),
          serialNumber: device.serialNumber,
          status: 'disconnected',
          device: device,
        };

        this.devices.set(usbDevice.id, usbDevice);
        return Array.from(this.devices.values());
      }
    } catch (error) {
      if ((error as Error).name !== 'NotFoundError') {
        console.error('Failed to request USB device:', error);
      }
    }

    return Array.from(this.devices.values());
  }

  // 连接设备
  async connect(deviceId: string): Promise<boolean> {
    const deviceInfo = this.devices.get(deviceId);
    if (!deviceInfo || !deviceInfo.device) {
      console.error('Device not found or not initialized');
      return false;
    }

    try {
      await deviceInfo.device.open();
      await deviceInfo.device.selectConfiguration(1);
      await deviceInfo.device.claimInterface(0);

      deviceInfo.status = 'connected';
      this.devices.set(deviceId, deviceInfo);
      this.emitEvent('connect', deviceInfo);

      console.log(`Connected to device: ${deviceInfo.name}`);
      return true;
    } catch (error) {
      deviceInfo.status = 'error';
      this.devices.set(deviceId, deviceInfo);
      this.emitEvent('error', deviceInfo);
      console.error('Failed to connect to device:', error);
      return false;
    }
  }

  // 断开设备
  async disconnect(deviceId: string): Promise<boolean> {
    const deviceInfo = this.devices.get(deviceId);
    if (!deviceInfo || !deviceInfo.device) {
      return false;
    }

    try {
      await deviceInfo.device.close();
      deviceInfo.status = 'disconnected';
      this.devices.set(deviceId, deviceInfo);
      this.emitEvent('disconnect', deviceInfo);

      console.log(`Disconnected from device: ${deviceInfo.name}`);
      return true;
    } catch (error) {
      console.error('Failed to disconnect device:', error);
      return false;
    }
  }

  // 获取已连接的设备
  getConnectedDevices(): UsbDevice[] {
    return Array.from(this.devices.values()).filter(d => d.status === 'connected');
  }

  // 获取所有设备
  getAllDevices(): UsbDevice[] {
    return Array.from(this.devices.values());
  }

  // 获取设备类型
  getDevicesByType(type: UsbDeviceType): UsbDevice[] {
    return Array.from(this.devices.values()).filter(d => d.type === type);
  }

  // 检查USB支持
  isSupported(): boolean {
    return 'usb' in navigator;
  }

  // 发送数据到设备
  async sendData(deviceId: string, data: Uint8Array): Promise<boolean> {
    const deviceInfo = this.devices.get(deviceId);
    if (!deviceInfo || !deviceInfo.device || deviceInfo.status !== 'connected') {
      console.error('Device not connected');
      return false;
    }

    try {
      await deviceInfo.device.transferOut(1, data.buffer as ArrayBuffer);
      return true;
    } catch (error) {
      console.error('Failed to send data to device:', error);
      return false;
    }
  }

  // 从设备接收数据
  async receiveData(deviceId: string, length: number): Promise<Uint8Array | null> {
    const deviceInfo = this.devices.get(deviceId);
    if (!deviceInfo || !deviceInfo.device || deviceInfo.status !== 'connected') {
      console.error('Device not connected');
      return null;
    }

    try {
      const result = await deviceInfo.device.transferIn(1, length);
      if (result.data) {
        return new Uint8Array(result.data.buffer);
      }
      return null;
    } catch (error) {
      console.error('Failed to receive data from device:', error);
      return null;
    }
  }
}

// 导出单例
export const usbService = UsbDeviceService.getInstance();

// 导出类
export { UsbDeviceService };
