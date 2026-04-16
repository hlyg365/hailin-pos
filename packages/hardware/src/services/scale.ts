// ============================================
// 海邻到家 - 电子秤服务
// 支持USB、电子秤设备
// ============================================

import type { Device, ScaleConfig, ScaleReading } from '@hailin/core';

/** 秤状态 */
type ScaleStatus = 'disconnected' | 'connected' | 'weighing' | 'stable' | 'error';

/** 电子秤服务 */
export class ScaleService {
  private status: ScaleStatus = 'disconnected';
  private config: ScaleConfig | null = null;
  private device: any = null;
  private currentReading: ScaleReading | null = null;
  private pollingInterval: number | null = null;
  
  /** 连接电子秤 */
  async connect(config: ScaleConfig): Promise<boolean> {
    try {
      this.status = 'connecting';
      this.config = config;
      
      switch (config.type) {
        case 'usb':
          return await this.connectUSB(config);
        case 'bluetooth':
          return await this.connectBluetooth(config);
        default:
          throw new Error('不支持的秤类型');
      }
    } catch (error) {
      console.error('Scale connect error:', error);
      this.status = 'error';
      return false;
    }
  }
  
  /** USB连接 */
  private async connectUSB(config: ScaleConfig): Promise<boolean> {
    try {
      if ('serial' in navigator) {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });
        this.device = port;
        
        // 开始轮询读取
        this.startPolling();
        
        this.status = 'connected';
        return true;
      }
      
      throw new Error('浏览器不支持Web Serial API');
    } catch (error) {
      console.error('USB connect failed:', error);
      this.status = 'error';
      return false;
    }
  }
  
  /** 蓝牙连接 */
  private async connectBluetooth(config: ScaleConfig): Promise<boolean> {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['00001811-0000-1000-8000-00805f9b34fb'] }], // 体重秤服务
      });
      
      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService('00001811-0000-1000-8000-00805f9b34fb');
      const characteristic = await service?.getCharacteristic('00002A9D-0000-1000-8000-00805f9b34fb');
      
      this.device = { device, server, service, characteristic };
      
      // 监听数据变化
      characteristic?.addEventListener('characteristicvaluechanged', (event: any) => {
        this.handleWeightData(event.target.value);
      });
      await characteristic?.startNotifications();
      
      this.status = 'connected';
      return true;
    } catch (error) {
      console.error('Bluetooth connect failed:', error);
      this.status = 'error';
      return false;
    }
  }
  
  /** 开始轮询 */
  private startPolling(): void {
    if (this.pollingInterval) return;
    
    this.pollingInterval = window.setInterval(async () => {
      if (!this.device) return;
      
      try {
        this.status = 'weighing';
        const data = await this.readUSB();
        this.handleWeightData(data);
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 500);
  }
  
  /** 读取USB数据 */
  private async readUSB(): Promise<Uint8Array> {
    if (!this.device?.readable) {
      throw new Error('Device not readable');
    }
    
    const reader = this.device.readable.getReader();
    const { value } = await reader.read();
    reader.releaseLock();
    
    return value;
  }
  
  /** 处理称重数据 */
  private handleWeightData(data: DataView | Uint8Array): void {
    // 解析秤数据（具体格式根据秤型号）
    // 这里假设是常见的GS1协议
    
    let weight = 0;
    let unit: 'g' | 'kg' | 'oz' | 'lb' = 'kg';
    let stable = false;
    
    if (data instanceof DataView) {
      // 解析数据
      // 实际解析逻辑根据具体秤的协议
      weight = data.getFloat32(1, true); // 小端序
      stable = (data.getUint8(5) & 0x40) !== 0; // 稳定位
    }
    
    // 单位转换
    const displayWeight = this.convertWeight(weight, unit, this.config?.unit || 'kg');
    
    this.currentReading = {
      weight: displayWeight,
      unit: this.config?.unit || 'kg',
      stable,
      timestamp: Date.now(),
    };
    
    this.status = stable ? 'stable' : 'weighing';
  }
  
  /** 单位转换 */
  private convertWeight(value: number, from: string, to: string): number {
    if (from === to) return value;
    
    const toKg: Record<string, number> = {
      g: 0.001,
      kg: 1,
      oz: 0.0283495,
      lb: 0.453592,
    };
    
    return value * toKg[from] / toKg[to];
  }
  
  /** 获取当前读数 */
  async getWeight(): Promise<ScaleReading | null> {
    return this.currentReading;
  }
  
  /** 去皮（清零） */
  async tare(): Promise<boolean> {
    // 发送去皮指令
    // ESC t - 去皮
    const commands = new Uint8Array([0x1B, 0x74]);
    
    if (this.device?.writable) {
      const writer = this.device.writable.getWriter();
      await writer.write(commands);
      writer.releaseLock();
      return true;
    }
    
    return false;
  }
  
  /** 获取状态 */
  getStatus(): Device['status'] {
    return this.status as Device['status'];
  }
  
  /** 断开连接 */
  async disconnect(): Promise<void> {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    if (this.device) {
      if (this.device.gatt?.connected) {
        this.device.gatt.disconnect();
      }
      if (this.device.close) {
        await this.device.close();
      }
      this.device = null;
    }
    
    this.status = 'disconnected';
    this.currentReading = null;
  }
}

export default ScaleService;
