// 设置存储 - 使用localStorage持久化

// 外设设备类型
export type DeviceType = 'printer' | 'scanner' | 'scale' | 'cashbox' | 'display' | 'other';

// USB设备信息
export interface USBDevice {
  id: string;
  name: string;
  manufacturer: string;
  serialNumber: string;
  productId: number;
  vendorId: number;
  connectionType: 'USB' | 'Bluetooth' | 'Serial' | 'Network';
  deviceType: DeviceType;
  status: 'connected' | 'disconnected' | 'error';
}

// 系统设置
export interface SystemSettings {
  // 语音设置
  paymentVoiceEnabled: boolean;        // 收款记账语音播报
  scanPaymentVoiceEnabled: boolean;    // 扫描付款码语音播报
  itemCountVoiceEnabled: boolean;      // 收款播报商品件数
  meituanVoiceEnabled: boolean;        // 美团订单语音播报
  cartAddVoiceEnabled: boolean;        // 商品加入购物车语音提醒
  
  // 音量设置
  adVolume: number;                    // 广告音量 0-100
  voiceVolume: number;                 // 语音提示音量 0-100
  
  // 启动设置
  autoStart: boolean;                  // 开机时自动启动
  
  // 功能模式
  shiftMode: boolean;                  // 交接班模式
  freshMode: boolean;                  // 生鲜模式
  takeoutEnabled: boolean;             // 收银机外卖接单
  
  // 电子秤设置
  scalePort: string;                   // 电子秤串口地址
  scaleBaudRate: number;               // 波特率
  
  // 条码秤设置
  barcodeScaleType: 'dahua-ab' | 'dahua-f' | 'topping-ls2zx' | 'none';
  
  // AI秤设置
  aiScaleEnabled: boolean;
  
  // 钱箱设置
  cashboxPassword: string;             // 钱箱密码
  
  // 收银渠道
  paymentChannels: {
    cash: boolean;
    wechat: boolean;
    alipay: boolean;
    card: boolean;
    mixed: boolean;
  };
}

// 默认设置
const defaultSettings: SystemSettings = {
  paymentVoiceEnabled: true,
  scanPaymentVoiceEnabled: true,
  itemCountVoiceEnabled: false,
  meituanVoiceEnabled: true,
  cartAddVoiceEnabled: false,
  adVolume: 30,
  voiceVolume: 100,
  autoStart: true,
  shiftMode: false,
  freshMode: false,
  takeoutEnabled: true,
  scalePort: 'COM1',
  scaleBaudRate: 9600,
  barcodeScaleType: 'none',
  aiScaleEnabled: false,
  cashboxPassword: '',
  paymentChannels: {
    cash: true,
    wechat: true,
    alipay: true,
    card: true,
    mixed: true,
  },
};

// 存储键名
const SETTINGS_KEY = 'hailin_pos_settings';
const DEVICES_KEY = 'hailin_pos_devices';

// 设置存储类
export class SettingsStore {
  // 获取设置
  static getSettings(): SystemSettings {
    if (typeof window === 'undefined') return defaultSettings;
    
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('读取设置失败:', error);
    }
    return defaultSettings;
  }

  // 保存设置
  static saveSettings(settings: Partial<SystemSettings>): void {
    if (typeof window === 'undefined') return;
    
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  }

  // 重置设置
  static resetSettings(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
  }

  // 获取设备列表
  static getDevices(): USBDevice[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(DEVICES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('读取设备列表失败:', error);
    }
    return [];
  }

  // 保存设备列表
  static saveDevices(devices: USBDevice[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(DEVICES_KEY, JSON.stringify(devices));
    } catch (error) {
      console.error('保存设备列表失败:', error);
    }
  }

  // 更新设备类型
  static updateDeviceType(deviceId: string, deviceType: DeviceType): void {
    const devices = this.getDevices();
    const index = devices.findIndex(d => d.id === deviceId);
    if (index !== -1) {
      devices[index].deviceType = deviceType;
      this.saveDevices(devices);
    }
  }

  // 添加设备
  static addDevice(device: USBDevice): void {
    const devices = this.getDevices();
    const existing = devices.findIndex(d => d.id === device.id);
    if (existing === -1) {
      devices.push(device);
    } else {
      devices[existing] = device;
    }
    this.saveDevices(devices);
  }

  // 移除设备
  static removeDevice(deviceId: string): void {
    const devices = this.getDevices().filter(d => d.id !== deviceId);
    this.saveDevices(devices);
  }
}

// 模拟USB设备检测（Web环境下模拟）
export async function detectUSBDevices(): Promise<USBDevice[]> {
  // 在实际环境中，这需要通过WebUSB API或原生应用实现
  // 这里返回模拟数据
  return [
    {
      id: 'usb-001',
      name: 'USB Printer P',
      manufacturer: 'XPrinter',
      serialNumber: 'XP001',
      productId: 8227,
      vendorId: 11575,
      connectionType: 'USB',
      deviceType: 'printer',
      status: 'connected',
    },
    {
      id: 'usb-002',
      name: 'A031-PC2.1-ZC',
      manufacturer: 'Sonix Technology Co., Ltd.',
      serialNumber: 'SN0001',
      productId: 25451,
      vendorId: 3141,
      connectionType: 'USB',
      deviceType: 'other',
      status: 'connected',
    },
    {
      id: 'usb-003',
      name: 'Alipay KD4 2.4G-USB Dongle',
      manufacturer: 'Telink',
      serialNumber: '未知',
      productId: 35280,
      vendorId: 9354,
      connectionType: 'USB',
      deviceType: 'scanner',
      status: 'connected',
    },
    {
      id: 'usb-004',
      name: 'TMS HIDKeyBoard',
      manufacturer: '未知',
      serialNumber: '未知',
      productId: 34817,
      vendorId: 9969,
      connectionType: 'USB',
      deviceType: 'other',
      status: 'connected',
    },
  ];
}
