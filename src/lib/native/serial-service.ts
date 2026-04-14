/**
 * RS232串口通信服务 - 收银机专用
 * 
 * 支持接口：
 * - DB9串口（RS232）
 * - 端子排（RS232/RS485）
 * - USB转串口（CH340/FTDI/PL2303）
 * 
 * 用于连接：
 * - 电子秤/计价秤
 * - 钱箱（RJ11转串口）
 * - 其他串口设备
 */

import { WeightData, BAUD_RATES, SCALE_PROTOCOLS } from './index';

// 串口配置接口
export interface SerialPortConfig {
  path: string;
  baudRate: number;
  dataBits: 5 | 6 | 7 | 8;
  stopBits: 1 | 2;
  parity: 'none' | 'even' | 'odd';
  flowControl: 'none' | 'hardware' | 'software';
}

// 串口设备信息
export interface SerialDevice {
  path: string;
  name: string;
  type: 'db9' | 'usb_to_serial' | 'terminal' | 'builtin';
  description: string;
  vendorId?: number;
  productId?: number;
  driver?: string; // CH340, FTDI, PL2303, CP2102
  available: boolean;
}

// 串口连接状态
export interface SerialConnectionStatus {
  connected: boolean;
  config?: SerialPortConfig;
  mode: 'native' | 'web_serial' | 'simulation';
  lastData?: string;
  error?: string;
}

// Web Serial API 类型（避免与其他声明冲突）
export interface SerialDeviceFilter {
  usbVendorId?: number;
  usbProductId?: number;
}

export interface SerialRequestOptions {
  filters?: SerialDeviceFilter[];
}

export interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

// USB转串口芯片VID/PID
export const USB_SERIAL_CHIPS = {
  CH340: { vendorId: 0x1a86, productId: 0x7523, name: 'CH340' },
  FTDI_FT232: { vendorId: 0x0403, productId: 0x6001, name: 'FTDI FT232' },
  FTDI_FT232R: { vendorId: 0x0403, productId: 0x6001, name: 'FTDI FT232R' },
  PL2303: { vendorId: 0x067b, productId: 0x2303, name: 'PL2303' },
  PL2303GC: { vendorId: 0x067b, productId: 0x23a3, name: 'PL2303GC' },
  PL2303GB: { vendorId: 0x067b, productId: 0x23b3, name: 'PL2303GB' },
  CP2102: { vendorId: 0x10c4, productId: 0xea60, name: 'CP2102' },
  CP2104: { vendorId: 0x10c4, productId: 0xea71, name: 'CP2104' },
  ATMEL: { vendorId: 0x03eb, productId: 0x2004, name: 'Atmel' },
  SILABS: { vendorId: 0x10c4, productId: 0xea71, name: 'Silicon Labs' },
};

// 电子秤协议解析器
export class ScaleProtocolParser {
  /**
   * 顶尖OS2协议解析
   * 格式: ST,GS,+001.250,kg (稳定毛重)
   *       US,GS,+001.250,kg (不稳定毛重)
   *       ST,NT,+000.500,kg (稳定净重)
   */
  static parseOS2(data: Uint8Array): WeightData | null {
    const text = new TextDecoder('ascii').decode(data);
    // 匹配: ST,GS,+001.250,kg 或 US,GS,+001.250,kg
    const match = text.match(/^([SU]T),GS,([+-]?\d+\.\d+),kg/);
    if (match) {
      return {
        weight: parseFloat(match[2]),
        unit: 'kg',
        stable: match[1] === 'ST',
        timestamp: Date.now(),
        protocol: 'OS2'
      };
    }
    
    // 匹配克单位: ST,GS,+00125,g
    const matchG = text.match(/^([SU]T),GS,([+-]?\d+),g/);
    if (matchG) {
      return {
        weight: parseFloat(matchG[2]) / 1000,
        unit: 'g',
        stable: matchG[1] === 'ST',
        timestamp: Date.now(),
        protocol: 'OS2'
      };
    }
    
    return null;
  }
  
  /**
   * 顶尖OS3协议解析
   * 格式: @022.50kg (稳定毛重)
   */
  static parseOS3(data: Uint8Array): WeightData | null {
    const text = new TextDecoder('ascii').decode(data);
    // 匹配: @022.50kg 或 #022.50kg
    const match = text.match(/[@#](\d+\.\d+)(kg|g)/);
    if (match) {
      const unit = match[2];
      const weight = unit === 'g' ? parseFloat(match[1]) / 1000 : parseFloat(match[1]);
      return {
        weight,
        unit: 'kg',
        stable: text.startsWith('@'),
        timestamp: Date.now(),
        protocol: 'OS3'
      };
    }
    return null;
  }
  
  /**
   * 大华协议解析
   * 格式: 02 30 30 30 31 2E 32 35 30 (ASCⅡ: 0001.250)
   */
  static parseDahua(data: Uint8Array): WeightData | null {
    if (data.length < 10) return null;
    
    try {
      // 提取重量部分 (字节2-8)
      const weightStr = String.fromCharCode(...Array.from(data.slice(2, 9)));
      const weight = parseFloat(weightStr);
      
      if (!isNaN(weight)) {
        return {
          weight: weight / 1000, // 转换为kg
          unit: 'kg',
          stable: (data[0] & 0x40) !== 0,
          timestamp: Date.now(),
          protocol: 'DAHUA'
        };
      }
    } catch (e) {
      // 解析失败
    }
    return null;
  }
  
  /**
   * 迪宝协议解析
   * 格式: =0001.250kg
   */
  static parseDibo(data: Uint8Array): WeightData | null {
    const text = new TextDecoder('ascii').decode(data);
    const match = text.match(/=(\d+\.\d+)(kg|g)/);
    if (match) {
      const unit = match[2];
      const weight = unit === 'g' ? parseFloat(match[1]) / 1000 : parseFloat(match[1]);
      return {
        weight,
        unit: 'kg',
        stable: true,
        timestamp: Date.now(),
        protocol: 'DIBO'
      };
    }
    return null;
  }
  
  /**
   * 自动检测协议
   */
  static parseAuto(data: Uint8Array): WeightData | null {
    // 按优先级尝试各协议
    return (
      this.parseOS2(data) ||
      this.parseOS3(data) ||
      this.parseDahua(data) ||
      this.parseDibo(data)
    );
  }
}

// 串口通信服务类
export class SerialService {
  private static instance: SerialService;
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private status: SerialConnectionStatus = { connected: false, mode: 'simulation' };
  private weightCallbacks: Set<(data: WeightData) => void> = new Set();
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  
  private constructor() {}
  
  public static getInstance(): SerialService {
    if (!SerialService.instance) {
      SerialService.instance = new SerialService();
    }
    return SerialService.instance;
  }
  
  /**
   * 检查Web Serial API支持
   */
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }
  
  /**
   * 获取可用串口列表
   */
  async listPorts(): Promise<SerialDevice[]> {
    if (!this.isSupported()) {
      console.warn('[SerialService] Web Serial API not supported');
      return this.getSimulatedPorts();
    }
    
    try {
      const ports = await (navigator.serial as any).getPorts();
      const devices: SerialDevice[] = [];
      
      for (const port of ports) {
        const info = port.getInfo();
        const device = this.createDeviceFromInfo((port as any).path || 'unknown', info);
        devices.push(device);
      }
      
      return devices;
    } catch (error) {
      console.error('[SerialService] listPorts error:', error);
      return this.getSimulatedPorts();
    }
  }
  
  /**
   * 请求连接串口
   */
  async requestPort(filters?: SerialDeviceFilter[]): Promise<SerialPort | null> {
    if (!this.isSupported()) {
      console.warn('[SerialService] Web Serial API not supported, using simulation');
      return null;
    }
    
    try {
      const options = filters ? { filters } : undefined;
      this.port = await (navigator.serial as any).requestPort(options);
      return this.port;
    } catch (error) {
      console.error('[SerialService] requestPort error:', error);
      return null;
    }
  }
  
  /**
   * 连接到串口
   */
  async connect(config: SerialPortConfig): Promise<SerialConnectionStatus> {
    if (!this.isSupported()) {
      console.warn('[SerialService] Web Serial API not supported, using simulation mode');
      this.status = {
        connected: true,
        config,
        mode: 'simulation',
      };
      return this.status;
    }
    
    try {
      if (!this.port) {
        // 自动请求端口
        const filters = this.getScaleFilters();
        this.port = await (navigator.serial as any).requestPort({ filters });
      }
      
      if (this.port) {
        await this.port.open({
          baudRate: config.baudRate,
          dataBits: config.dataBits,
          stopBits: config.stopBits,
          parity: config.parity,
        });
        
        this.status = {
          connected: true,
          config,
          mode: 'web_serial',
        };
        
        console.log('[SerialService] Connected to', config.path);
        return this.status;
      }
      
      // 如果无法连接，返回失败状态
      this.status = {
        connected: false,
        mode: 'simulation',
        error: 'Failed to connect',
      };
      return this.status;
    } catch (error: any) {
      console.error('[SerialService] Connect error:', error);
      this.status = {
        connected: false,
        mode: 'simulation',
        error: error.message,
      };
      return this.status;
    }
  }
  
  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    this.stopReading();
    
    if (this.port) {
      try {
        await this.port.close();
      } catch (error) {
        console.error('[SerialService] Close error:', error);
      }
      this.port = null;
    }
    
    this.status = { connected: false, mode: 'simulation' };
    console.log('[SerialService] Disconnected');
  }
  
  /**
   * 获取连接状态
   */
  getStatus(): SerialConnectionStatus {
    return this.status;
  }
  
  /**
   * 读取串口数据（单次）
   */
  async read(): Promise<Uint8Array | null> {
    if (!this.port || !this.port.readable) {
      return null;
    }
    
    try {
      if (!this.reader) {
        this.reader = this.port.readable.getReader();
      }
      
      const { value } = await this.reader.read();
      if (value) {
        return value;
      }
    } catch (error) {
      console.error('[SerialService] Read error:', error);
    }
    
    return null;
  }
  
  /**
   * 写入串口数据
   */
  async write(data: Uint8Array): Promise<boolean> {
    if (!this.port || !this.port.writable) {
      console.warn('[SerialService] Port not writable');
      return false;
    }
    
    try {
      if (!this.writer) {
        this.writer = this.port.writable.getWriter();
      }
      
      await this.writer.write(data);
      return true;
    } catch (error) {
      console.error('[SerialService] Write error:', error);
      return false;
    }
  }
  
  /**
   * 开始读取电子秤数据流
   */
  startReading(protocol: string = 'AUTO'): void {
    if (this.pollInterval) {
      return; // 已在运行
    }
    
    const readWeight = async () => {
      const data = await this.read();
      if (data) {
        let weightData: WeightData | null = null;
        
        switch (protocol) {
          case 'OS2':
            weightData = ScaleProtocolParser.parseOS2(data);
            break;
          case 'OS3':
            weightData = ScaleProtocolParser.parseOS3(data);
            break;
          case 'DAHUA':
            weightData = ScaleProtocolParser.parseDahua(data);
            break;
          case 'DIBO':
            weightData = ScaleProtocolParser.parseDibo(data);
            break;
          default:
            weightData = ScaleProtocolParser.parseAuto(data);
        }
        
        if (weightData) {
          this.weightCallbacks.forEach(cb => cb(weightData!));
        }
      }
    };
    
    // 轮询读取
    this.pollInterval = setInterval(readWeight, 200);
  }
  
  /**
   * 停止读取
   */
  stopReading(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    
    if (this.reader) {
      this.reader.releaseLock();
      this.reader = null;
    }
    
    if (this.writer) {
      this.writer.releaseLock();
      this.writer = null;
    }
  }
  
  /**
   * 注册重量变化回调
   */
  onWeightChange(callback: (data: WeightData) => void): () => void {
    this.weightCallbacks.add(callback);
    return () => this.weightCallbacks.delete(callback);
  }
  
  /**
   * 获取电子秤USB过滤器
   */
  private getScaleFilters(): SerialDeviceFilter[] {
    const chips = Object.values(USB_SERIAL_CHIPS);
    return chips.map(chip => ({
      usbVendorId: chip.vendorId,
      usbProductId: chip.productId,
    }));
  }
  
  /**
   * 识别USB转串口芯片
   */
  private identifyChip(vendorId?: number, productId?: number) {
    if (!vendorId || !productId) return null;
    
    for (const chip of Object.values(USB_SERIAL_CHIPS)) {
      if (chip.vendorId === vendorId && chip.productId === productId) {
        return chip;
      }
    }
    return null;
  }
  
  /**
   * 从设备信息创建设备对象
   */
  private createDeviceFromInfo(path: string, info: SerialPortInfo): SerialDevice {
    const chip = this.identifyChip(info.usbVendorId, info.usbProductId);
    
    return {
      path,
      name: chip?.name || 'USB Serial Device',
      type: 'usb_to_serial',
      description: chip ? `USB转串口 (${chip.name})` : 'USB转串口设备',
      vendorId: info.usbVendorId,
      productId: info.usbProductId,
      driver: chip?.name,
      available: true,
    };
  }
  
  /**
   * 获取模拟串口列表（Web环境）
   */
  private getSimulatedPorts(): SerialDevice[] {
    return [
      {
        path: '/dev/ttyS0',
        name: '串口0 (DB9)',
        type: 'db9',
        description: 'RS232 串口端口',
        available: false,
      },
      {
        path: '/dev/ttyUSB0',
        name: 'USB转串口',
        type: 'usb_to_serial',
        description: 'USB转串口设备 (CH340)',
        vendorId: 0x1a86,
        productId: 0x7523,
        driver: 'CH340',
        available: false,
      },
    ];
  }
}

// 导出单例
export const serialService = SerialService.getInstance();
export default serialService;
