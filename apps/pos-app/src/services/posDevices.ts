/**
 * 收银设备服务 - 完整版
 * 支持：电子秤(串口)、小票打印机(网络/USB)、钱箱、客显屏
 * 
 * 硬件连接说明：
 * - 电子秤：RS232串口连接或网口TCP，波特率9600/115200
 * - 小票打印机：网口(RJ45)或USB
 * - 钱箱：连接打印机的钱箱口(通过ESC/POS指令触发)
 * - 客显屏：浏览器新窗口
 * 
 * Android: 使用原生Capacitor插件进行TCP/USB通讯
 * Web: 使用Web Serial API / WebSocket (仅模拟)
 */

import { deviceApi } from '../plugins/plugin-bridge';

// ============ 类型定义 ============
export interface DeviceStatus {
  connected: boolean;
  online: boolean;
  error?: string;
  lastUpdate?: number;
}

export interface PrinterConfig {
  type: 'network' | 'usb' | 'bluetooth';
  address?: string;
  port?: number;
  width: 58 | 80;
}

export interface ScaleConfig {
  type: 'serial' | 'network';
  port?: string;        // 串口号，如 'COM1' 或 '/dev/ttyUSB0'
  baudRate: number;     // 波特率：9600 或 115200
  address?: string;     // 网络秤IP
  tcpPort?: number;     // 网络秤TCP端口
  protocol: 'dahua' | 'dingjian' | 'soki' | 'toieda' | 'general';  // 秤协议
}

export interface ScaleReading {
  weight: number;      // kg
  unit: 'kg' | 'g';
  stable: boolean;
  timestamp: number;
}

// 称重数据缓存，用于平滑过滤
interface WeightCache {
  readings: number[];
  lastStableWeight: number;
  lastStableTime: number;
}

export interface CashDrawerStatus {
  open: boolean;
  lastOpened?: number;
}

// ============ ESC/POS 指令集 ============
const ESC = '\x1B';
const GS = '\x1D';
const ESC_POS = {
  // 初始化打印机
  INIT: ESC + '@',
  
  // 钱箱指令
  OPEN_DRAWER: ESC + 'p' + '\x00' + '\x19' + '\xFA',
  OPEN_DRAWER_ALT: GS + 'p' + '\x00' + '\x19' + '\xFA',
  
  // 切纸
  CUT: GS + 'V' + '\x01',
  PARTIAL_CUT: GS + 'V' + '\x00',
  
  // 打印文字
  TEXT_NORMAL: ESC + '!' + '\x00',
  TEXT_BOLD_ON: ESC + 'E' + '\x01',
  TEXT_BOLD_OFF: ESC + 'E' + '\x00',
  TEXT_DOUBLE_HEIGHT: ESC + '!' + '\x10',
  TEXT_DOUBLE_WIDTH: ESC + '!' + '\x20',
  TEXT_DOUBLE: ESC + '!' + '\x30',
  TEXT_UNDERLINE: ESC + '-' + '\x01',
  TEXT_UNDERLINE_OFF: ESC + '-' + '\x00',
  ALIGN_LEFT: ESC + 'a' + '\x00',
  ALIGN_CENTER: ESC + 'a' + '\x01',
  ALIGN_RIGHT: ESC + 'a' + '\x02',
  
  // 字体大小
  FONT_SIZE_1: ESC + '!' + '\x00',
  FONT_SIZE_2: ESC + '!' + '\x11',
  FONT_SIZE_3: ESC + '!' + '\x22',
  
  // 行间距
  LINE_SPACING_DEFAULT: ESC + '2',
  LINE_SPACING_SET: (n: number) => ESC + '3' + String.fromCharCode(n),
  
  // 进纸
  FEED_LINES: (n: number) => ESC + 'd' + String.fromCharCode(n),
  FEED_DOTS: (n: number) => ESC + 'J' + String.fromCharCode(n),
  
  // 蜂鸣
  BEEP: ESC + '(' + 'p' + '\x01' + '\x0A' + '\x19',
};

// ============ 串口电子秤服务 ============
class SerialScale {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader | null = null;
  private config: ScaleConfig = {
    type: 'serial',
    baudRate: 2400,
    protocol: 'soki',
  };
  private _status: DeviceStatus = { connected: false, online: false };
  private lastReading: ScaleReading = { weight: 0, unit: 'kg', stable: false, timestamp: 0 };
  private onReadingCallback?: (reading: ScaleReading) => void;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  
  // 数据平滑过滤
  private weightCache: WeightCache = {
    readings: [],
    lastStableWeight: 0,
    lastStableTime: 0,
  };
  private readonly CACHE_SIZE = 5;      // 缓存最近5次读数
  private readonly STABLE_THRESHOLD = 0.005; // 稳定阈值 5g
  private readonly STABLE_TIMEOUT = 2000;    // 稳定判定时间 2秒
  
  get status(): DeviceStatus {
    return { ...this._status };
  }
  
  get reading(): ScaleReading {
    return { ...this.lastReading };
  }
  
  // 检查是否支持Web Serial API
  static isSupported(): boolean {
    return 'serial' in navigator;
  }
  
  // 获取可用串口列表
  async getAvailablePorts(): Promise<SerialPort[]> {
    if (!SerialScale.isSupported()) {
      console.warn('[秤] Web Serial API 不支持');
      return [];
    }
    try {
      return await navigator.serial.getPorts();
    } catch (error) {
      console.error('[秤] 获取串口列表失败:', error);
      return [];
    }
  }
  
  // 请求串口权限并连接
  async requestAndConnect(config: ScaleConfig): Promise<boolean> {
    if (!SerialScale.isSupported()) {
      this._status = { connected: false, online: false, error: '浏览器不支持Web Serial API' };
      return false;
    }
    
    try {
      // 请求串口权限
      this.port = await navigator.serial.requestPort({
        filters: [
          { usbVendorId: 0x0403 },  // FTDI
          { usbVendorId: 0x067B },  // Prolific
          { usbVendorId: 0x1A86 },  // CH340
        ]
      });
      
      return await this.connect(config);
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        this._status = { connected: false, online: false, error: '未选择串口' };
      } else {
        this._status = { connected: false, online: false, error: error.message };
      }
      return false;
    }
  }
  
  // 连接到指定串口
  async connect(config: ScaleConfig): Promise<boolean> {
    this.config = config;
    
    if (!this.port) {
      // 尝试自动连接第一个可用串口
      const ports = await this.getAvailablePorts();
      if (ports.length === 0) {
        this._status = { connected: false, online: false, error: '未找到电子秤串口' };
        return false;
      }
      this.port = ports[0];
    }
    
    try {
      await this.port.open({
        baudRate: config.baudRate || 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
      });
      
      this._status = { connected: true, online: true, lastUpdate: Date.now() };
      console.log('[秤] 串口连接成功，波特率:', config.baudRate);
      
      // 开始读取数据
      this.startReading();
      return true;
    } catch (error: any) {
      this._status = { connected: false, online: false, error: error.message };
      console.error('[秤] 串口连接失败:', error);
      return false;
    }
  }
  
  // 断开连接
  async disconnect(): Promise<void> {
    this.stopReading();
    
    if (this.port) {
      try {
        await this.port.close();
      } catch (error) {
        console.error('[秤] 关闭串口失败:', error);
      }
      this.port = null;
    }
    
    this._status = { connected: false, online: false };
  }
  
  // 开始读取秤数据
  private startReading(): void {
    if (!this.port) return;
    
    const readData = async () => {
      try {
        if (!this.port?.readable) return;
        
        this.reader = this.port.readable.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
          const { done, value } = await this.reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // 查找完整的数据帧（换行符结尾）
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim()) {
              this.parseScaleData(line.trim());
            }
          }
        }
      } catch (error) {
        console.error('[秤] 读取数据失败:', error);
        this._status = { ...this._status, online: false, error: '读取数据失败' };
      }
    };
    
    readData();
  }
  
  // 停止读取
  private stopReading(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    if (this.reader) {
      this.reader.releaseLock();
      this.reader = null;
    }
  }
  
  // 解析秤数据（支持多种协议）
  private parseScaleData(data: string): void {
    let reading: ScaleReading | null = null;
    
    switch (this.config.protocol) {
      case 'dahua':
        // 大华协议: ST,WS,PP,NNNN,NNNN,SS,TT,CC\r\n
        // 示例: 02 57 53 2C 30 2E 30 30 30 2C 30 2E 30 30 30 2C 30 0D
        reading = this.parseDahuaProtocol(data);
        break;
      case 'toieda':
        // 托利多协议
        reading = this.parseToiedaProtocol(data);
        break;
      case 'soki':
        // 顶尖协议
        reading = this.parseSokiProtocol(data);
        break;
      default:
        // 通用协议（简单重量数据）
        reading = this.parseGeneralProtocol(data);
    }
    
    if (reading) {
      this.lastReading = reading;
      this._status = { ...this._status, online: true, lastUpdate: Date.now() };
      this.onReadingCallback?.(reading);
    }
  }
  
  // 大华协议解析
  private parseDahuaProtocol(data: string): ScaleReading | null {
    // 格式: ST,WS,PP,WWWW,UUUU,SS,TT,CC\r\n
    // ST: 起始符(02)
    // WS: 稳定/不稳定(W/U)
    // PP: 重量类型(NET/GRS)
    // WWWW: 重量值
    // UUUU: 单位(kg/g)
    // SS: 状态
    // TT: 皮重
    // CC: 校验
    try {
      if (data.length < 20) return null;
      
      const stable = data.charAt(1) === 'W';
      const weightStr = data.substring(3, 11).trim();
      const unitStr = data.substring(11, 15).trim();
      const weight = parseFloat(weightStr) / 1000; // 转为kg
      
      return {
        weight: isNaN(weight) ? 0 : weight,
        unit: unitStr.includes('kg') ? 'kg' : 'g',
        stable,
        timestamp: Date.now(),
      };
    } catch {
      return null;
    }
  }
  
  // 托利多协议解析
  private parseToiedaProtocol(data: string): ScaleReading | null {
    // 托利多格式: 02 N 05 G 00000.00 kg\r\n
    try {
      const parts = data.split(/\s+/);
      if (parts.length < 4) return null;
      
      const stable = parts[1] === 'S';
      const unit = parts[3].toLowerCase().includes('kg') ? 'kg' : 'g';
      const weight = parseFloat(parts[2]);
      
      return {
        weight: isNaN(weight) ? 0 : weight,
        unit,
        stable,
        timestamp: Date.now(),
      };
    } catch {
      return null;
    }
  }
  
  // 顶尖协议解析 (OS2X 系列)
  // 帧格式: STX(0x02) + 重量ASCII(8字节) + ETX(0x03) + BCC(校验)
  // 示例: 02 30 30 30 30 30 2E 30 30 03 B4
  // 重量: "00000.00" = 0.00kg
  private parseSokiProtocol(data: string): ScaleReading | null {
    try {
      // 转换为字节数组
      const bytes: number[] = [];
      for (let i = 0; i < data.length; i++) {
        bytes.push(data.charCodeAt(i));
      }
      
      // 检查帧头和帧尾
      if (bytes[0] !== 0x02 || bytes[bytes.length - 2] !== 0x03) {
        // 不是标准帧格式，尝试其他解析方式
        return this.parseSokiAsciiFormat(data);
      }
      
      // 提取重量数据 (字节 1-8)
      let weightStr = '';
      for (let i = 1; i < Math.min(9, bytes.length - 1); i++) {
        weightStr += String.fromCharCode(bytes[i]);
      }
      
      // 解析重量值
      const weight = parseFloat(weightStr);
      if (isNaN(weight)) return null;
      
      // 提取稳定状态 (从字节 9 或重量字符串判断)
      // 通常 S = 稳定, U = 不稳定
      const statusByte = bytes[9] || 0x53; // 默认稳定
      const stable = (statusByte === 0x53 || statusByte === 0x73); // 'S' or 's'
      
      return {
        weight,
        unit: 'kg',
        stable,
        timestamp: Date.now(),
      };
    } catch {
      // 尝试 ASCII 格式解析
      return this.parseSokiAsciiFormat(data);
    }
  }
  
  // 顶尖协议 ASCII 格式解析
  // 格式: U 000.000 kg 或 000.000kg
  private parseSokiAsciiFormat(data: string): ScaleReading | null {
    try {
      // 尝试多种格式
      // 格式1: "S 000.000 kg"
      let match = data.match(/([SU])\s+(\d+\.\d+)\s*(kg|g)/i);
      if (match) {
        return {
          weight: parseFloat(match[2]),
          unit: match[3].toLowerCase() as 'kg' | 'g',
          stable: match[1].toUpperCase() === 'S',
          timestamp: Date.now(),
        };
      }
      
      // 格式2: "000.000kg" 或 "000.000 kg"
      match = data.match(/(\d+\.?\d*)\s*(kg|g)/i);
      if (match) {
        return {
          weight: parseFloat(match[1]),
          unit: match[2].toLowerCase() as 'kg' | 'g',
          stable: true, // ASCII 格式默认稳定
          timestamp: Date.now(),
        };
      }
      
      // 格式3: 纯数字
      const num = parseFloat(data.trim());
      if (!isNaN(num)) {
        return {
          weight: Math.abs(num),
          unit: 'kg',
          stable: true,
          timestamp: Date.now(),
        };
      }
      
      return null;
    } catch {
      return null;
    }
  }
  
  // 通用协议解析（直接数字）
  private parseGeneralProtocol(data: string): ScaleReading | null {
    try {
      // 尝试解析为纯数字（单位kg）
      const weight = parseFloat(data.trim());
      if (isNaN(weight)) return null;
      
      return {
        weight: Math.abs(weight),
        unit: 'kg',
        stable: true,
        timestamp: Date.now(),
      };
    } catch {
      return null;
    }
  }
  
  // 设置数据回调
  onReading(callback: (reading: ScaleReading) => void): void {
    this.onReadingCallback = callback;
  }
  
  // 归零
  async zero(): Promise<boolean> {
    // 发送归零指令
    if (!this.port?.writable) return false;
    
    try {
      const writer = this.port.writable.getWriter();
      // 顶尖协议归零: STX + 'Z' + ETX + BCC
      await writer.write(new Uint8Array([0x02, 0x5A, 0x03, 0x5B]));
      writer.releaseLock();
      return true;
    } catch {
      return false;
    }
  }
  
  // 去皮
  async tare(): Promise<boolean> {
    if (!this.port?.writable) return false;
    
    try {
      const writer = this.port.writable.getWriter();
      // 顶尖协议去皮: STX + 'T' + ETX + BCC
      await writer.write(new Uint8Array([0x02, 0x54, 0x03, 0x55]));
      writer.releaseLock();
      return true;
    } catch {
      return false;
    }
  }
}

// ============ 网络电子秤服务 ============
class NetworkScale {
  private deviceId: string | null = null;
  private config: ScaleConfig = { type: 'network', baudRate: 2400, protocol: 'soki' };
  private _status: DeviceStatus = { connected: false, online: false };
  private lastReading: ScaleReading = { weight: 0, unit: 'kg', stable: false, timestamp: 0 };
  private onReadingCallback?: (reading: ScaleReading) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private dataListener: (() => void) | null = null;
  
  get status(): DeviceStatus {
    return { ...this._status };
  }
  
  get reading(): ScaleReading {
    return { ...this.lastReading };
  }
  
  async connect(config: ScaleConfig): Promise<boolean> {
    if (!config.address || !config.tcpPort) {
      this._status = { connected: false, online: false, error: '未配置秤地址' };
      return false;
    }
    
    this.config = config;
    
    try {
      // 使用原生插件连接TCP设备
      const result = await deviceApi.connectTcp({
        id: 'scale_' + Date.now(),
        host: config.address,
        port: config.tcpPort,
        timeout: 5000,
      });
      
      if (result.success) {
        this.deviceId = result.id;
        this._status = { connected: true, online: true, lastUpdate: Date.now() };
        this.reconnectAttempts = 0;
        console.log('[网络秤] 连接成功:', result.message);
        
        // 监听数据
        this.dataListener = deviceApi.addListener('deviceData', (event) => {
          if (event.id === this.deviceId) {
            this.parseData(event.data);
          }
        });
        
        // 监听断开
        deviceApi.addListener('deviceDisconnected', (event) => {
          if (event.id === this.deviceId) {
            this._status = { connected: false, online: false };
            this.deviceId = null;
            this.dataListener?.();
            this.attemptReconnect();
          }
        });
        
        return true;
      } else {
        this._status = { connected: false, online: false, error: result.message };
        return false;
      }
    } catch (error: any) {
      console.error('[网络秤] 连接失败:', error);
      this._status = { connected: false, online: false, error: error.message };
      return false;
    }
  }
  
  private parseData(data: string): void {
    try {
      const json = JSON.parse(data);
      const reading: ScaleReading = {
        weight: json.weight || json.w || 0,
        unit: json.unit || 'kg',
        stable: json.stable !== false,
        timestamp: Date.now(),
      };
      
      this.lastReading = reading;
      this._status = { ...this._status, online: true, lastUpdate: Date.now() };
      this.onReadingCallback?.(reading);
    } catch {
      // 非JSON格式，解析十六进制数据
      this.parseHexData(data);
    }
  }
  
  private parseHexData(data: string): void {
    // 尝试解析为秤协议数据
    // 大华协议或其他协议的十六进制数据
    try {
      const weight = parseFloat(data.trim());
      if (!isNaN(weight)) {
        this.lastReading = {
          weight: Math.abs(weight),
          unit: 'kg',
          stable: true,
          timestamp: Date.now(),
        };
        this._status = { ...this._status, online: true, lastUpdate: Date.now() };
        this.onReadingCallback?.(this.lastReading);
      }
    } catch {
      // 解析失败
    }
  }
  
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    
    this.reconnectAttempts++;
    console.log(`[网络秤] 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    setTimeout(() => {
      this.connect(this.config);
    }, 3000 * this.reconnectAttempts);
  }
  
  async disconnect(): Promise<void> {
    if (this.deviceId) {
      await deviceApi.disconnect({ id: this.deviceId });
      this.deviceId = null;
    }
    if (this.dataListener) {
      this.dataListener();
      this.dataListener = null;
    }
    this._status = { connected: false, online: false };
  }
  
  onReading(callback: (reading: ScaleReading) => void): void {
    this.onReadingCallback = callback;
  }
}

// ============ 小票打印机服务 ============
class ReceiptPrinter {
  private deviceId: string | null = null;
  private config: PrinterConfig = { type: 'network', width: 58 };
  private _status: DeviceStatus = { connected: false, online: false };
  private messageQueue: string[] = [];
  private processing = false;
  private dataListener: (() => void) | null = null;
  
  get status(): DeviceStatus {
    return { ...this._status };
  }
  
  async connect(config: PrinterConfig): Promise<boolean> {
    this.config = config;
    
    if (config.type === 'network') {
      return this.connectNetwork(config);
    } else {
      this._status = { connected: false, online: false, error: 'USB/蓝牙需要原生驱动' };
      return false;
    }
  }
  
  private async connectNetwork(config: PrinterConfig): Promise<boolean> {
    if (!config.address || !config.port) {
      this._status = { connected: false, online: false, error: '未配置打印机地址' };
      return false;
    }
    
    try {
      // 使用原生插件连接TCP设备
      const result = await deviceApi.connectTcp({
        id: 'printer_' + Date.now(),
        host: config.address,
        port: config.port,
        timeout: 5000,
      });
      
      if (result.success) {
        this.deviceId = result.id;
        this._status = { connected: true, online: true, lastUpdate: Date.now() };
        console.log('[打印机] 连接成功:', result.message);
        
        // 监听数据接收
        this.dataListener = deviceApi.addListener('deviceData', (event) => {
          console.log('[打印机] 收到数据:', event);
        });
        
        // 监听断开连接
        deviceApi.addListener('deviceDisconnected', (event) => {
          if (event.id === this.deviceId) {
            this._status = { connected: false, online: false, error: '连接断开' };
            this.deviceId = null;
          }
        });
        
        // 处理队列
        this.processQueue();
        return true;
      } else {
        this._status = { connected: false, online: false, error: result.message };
        return false;
      }
    } catch (error: any) {
      console.error('[打印机] 连接失败:', error);
      this._status = { connected: false, online: false, error: error.message };
      return false;
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.deviceId) {
      await deviceApi.disconnect({ id: this.deviceId });
      this.deviceId = null;
    }
    if (this.dataListener) {
      this.dataListener();
      this.dataListener = null;
    }
    this._status = { connected: false, online: false };
  }
  
  // 发送原始数据
  async sendRaw(data: string): Promise<boolean> {
    if (!this.deviceId) {
      this.messageQueue.push(data);
      return false;
    }
    
    try {
      await deviceApi.send({
        id: this.deviceId,
        data,
        encoding: 'UTF-8',
      });
      return true;
    } catch (error) {
      console.error('[打印机] 发送失败:', error);
      return false;
    }
  }
  
  private async processQueue(): Promise<void> {
    if (this.processing || this.messageQueue.length === 0) return;
    
    this.processing = true;
    while (this.messageQueue.length > 0) {
      const data = this.messageQueue.shift();
      if (data) {
        await this.sendRaw(data);
        await new Promise(r => setTimeout(r, 50));
      }
    }
    this.processing = false;
  }
  
  // ============ 打印指令 ============
  
  // 初始化
  init(): this {
    this.messageQueue.push(ESC_POS.INIT);
    return this;
  }
  
  // 切纸
  cut(): this {
    this.messageQueue.push(ESC_POS.CUT);
    return this;
  }
  
  // 蜂鸣
  beep(): this {
    this.messageQueue.push(ESC_POS.BEEP);
    return this;
  }
  
  // 打开钱箱
  openCashDrawer(): this {
    this.messageQueue.push(ESC_POS.OPEN_DRAWER);
    return this;
  }
  
  // 文本对齐
  alignLeft(): this {
    this.messageQueue.push(ESC_POS.ALIGN_LEFT);
    return this;
  }
  alignCenter(): this {
    this.messageQueue.push(ESC_POS.ALIGN_CENTER);
    return this;
  }
  alignRight(): this {
    this.messageQueue.push(ESC_POS.ALIGN_RIGHT);
    return this;
  }
  
  // 字体样式
  bold(on: boolean = true): this {
    this.messageQueue.push(on ? ESC_POS.TEXT_BOLD_ON : ESC_POS.TEXT_BOLD_OFF);
    return this;
  }
  underline(on: boolean = true): this {
    this.messageQueue.push(on ? ESC_POS.TEXT_UNDERLINE : ESC_POS.TEXT_UNDERLINE_OFF);
    return this;
  }
  
  // 字体大小
  fontSize(size: 1 | 2 | 3): this {
    this.messageQueue.push(ESC_POS[`FONT_SIZE_${size}`]);
    return this;
  }
  
  // 打印文本
  text(content: string): this {
    this.messageQueue.push(content + '\n');
    return this;
  }
  
  // 空行
  emptyLine(): this {
    this.messageQueue.push('\n');
    return this;
  }
  
  // 分隔线
  line(char: string = '-', length?: number): this {
    const width = length || (this.config.width === 58 ? 32 : 48);
    this.messageQueue.push(char.repeat(width) + '\n');
    return this;
  }
  
  // 进纸
  feed(lines: number = 3): this {
    this.messageQueue.push(ESC_POS.FEED_LINES(lines));
    return this;
  }
  
  // 打印小票
  async printReceipt(receiptData: {
    storeName: string;
    orderNo: string;
    datetime: string;
    items: Array<{ name: string; qty: number; price: number; total: number }>;
    total: number;
    paymentMethod: string;
    memberInfo?: string;
    qrCode?: string;
  }): Promise<boolean> {
    const width = this.config.width === 58 ? 32 : 48;
    
    // 初始化
    this.init();
    
    // 标题
    this.alignCenter().bold(true).fontSize(2).text(receiptData.storeName).bold(false);
    this.fontSize(1).text(`订单号: ${receiptData.orderNo}`);
    this.text(`时间: ${receiptData.datetime}`);
    this.line('=');
    
    // 商品明细
    this.alignLeft();
    receiptData.items.forEach(item => {
      const name = item.name.length > 12 ? item.name.substring(0, 11) + '…' : item.name;
      this.text(`${name}  x${item.qty}`);
      this.text(`¥${item.price.toFixed(2)}      ¥${item.total.toFixed(2)}`);
    });
    
    this.line('-');
    
    // 合计
    this.alignRight().bold(true);
    this.fontSize(2).text(`合计: ¥${receiptData.total.toFixed(2)}`);
    this.bold(false).fontSize(1);
    
    // 付款方式
    this.text(`付款方式: ${receiptData.paymentMethod}`);
    
    // 会员信息
    if (receiptData.memberInfo) {
      this.text(receiptData.memberInfo);
    }
    
    this.line('=');
    
    // 二维码
    if (receiptData.qrCode) {
      this.alignCenter().text('[ 扫码查正品 ]');
      // 二维码通常需要图片指令，这里简化处理
      this.text('________________________');
    }
    
    this.alignCenter().text('谢谢惠顾，欢迎下次光临！');
    this.feed(5).cut();
    
    // 执行打印
    await this.processQueue();
    return true;
  }
}

// ============ 客显屏服务 ============
class CustomerDisplay {
  private window: Window | null = null;
  private _status: DeviceStatus = { connected: false, online: false };
  private messageQueue: string[] = [];
  
  get status(): DeviceStatus {
    return { ...this._status };
  }
  
  async open(url: string): Promise<boolean> {
    try {
      // 打开新窗口
      this.window = window.open(url, 'CustomerDisplay', 'width=400,height=300');
      
      if (this.window) {
        this._status = { connected: true, online: true, lastUpdate: Date.now() };
        this.updateDisplay({ mode: 'welcome' });
        return true;
      } else {
        this._status = { connected: false, online: false, error: '窗口被浏览器拦截，请允许弹窗' };
        return false;
      }
    } catch (error: any) {
      this._status = { connected: false, online: false, error: error.message };
      return false;
    }
  }
  
  async close(): Promise<void> {
    if (this.window) {
      this.window.close();
      this.window = null;
    }
    this._status = { connected: false, online: false };
  }
  
  // 更新显示内容
  updateDisplay(data: {
    mode: 'welcome' | 'amount' | 'paid' | 'change';
    amount?: number;
    change?: number;
    message?: string;
  }): void {
    if (!this.window || this.window.closed) {
      this._status = { ...this._status, connected: false, online: false };
      return;
    }
    
    try {
      let html = '';
      
      switch (data.mode) {
        case 'welcome':
          html = `
            <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#1a1a2e;color:#fff;font-family:Arial,sans-serif;">
              <div style="text-align:center;">
                <div style="font-size:48px;margin-bottom:20px;">🛒</div>
                <div style="font-size:24px;">欢迎光临</div>
                <div style="font-size:18px;margin-top:10px;">请扫描商品条码</div>
              </div>
            </div>
          `;
          break;
          
        case 'amount':
          html = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#16213e;color:#fff;font-family:Arial,sans-serif;">
              <div style="font-size:20px;margin-bottom:10px;">应付金额</div>
              <div style="font-size:64px;font-weight:bold;color:#e94560;">¥${(data.amount || 0).toFixed(2)}</div>
            </div>
          `;
          break;
          
        case 'paid':
          html = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0f3460;color:#fff;font-family:Arial,sans-serif;">
              <div style="font-size:24px;margin-bottom:10px;">✅ 收款成功</div>
              <div style="font-size:48px;font-weight:bold;">¥${(data.amount || 0).toFixed(2)}</div>
            </div>
          `;
          break;
          
        case 'change':
          html = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#1a1a2e;color:#fff;font-family:Arial,sans-serif;">
              <div style="font-size:24px;margin-bottom:10px;">找零</div>
              <div style="font-size:56px;font-weight:bold;color:#4ecca3;">¥${(data.change || 0).toFixed(2)}</div>
              <div style="font-size:20px;margin-top:20px;">请收好零钱</div>
            </div>
          `;
          break;
      }
      
      this.window.document.write(html);
      this.window.document.close();
      this._status = { ...this._status, online: true, lastUpdate: Date.now() };
    } catch (error) {
      console.error('[客显屏] 更新显示失败:', error);
    }
  }
  
  // 显示商品信息
  showProduct(name: string, price: number): void {
    if (!this.window || this.window.closed) return;
    
    this.window.document.write(`
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#16213e;color:#fff;font-family:Arial,sans-serif;">
        <div style="font-size:20px;margin-bottom:20px;">${name}</div>
        <div style="font-size:48px;font-weight:bold;">¥${price.toFixed(2)}</div>
      </div>
    `);
  }
}

// ============ 标签打印机服务 (TSPL/CPCL 协议) ============
class LabelPrinter {
  private socket: WebSocket | null = null;
  private config: PrinterConfig = { type: 'network', width: 58 };
  private _status: DeviceStatus = { connected: false, online: false };
  private messageQueue: string[] = [];
  
  get status(): DeviceStatus {
    return { ...this._status };
  }
  
  async connect(config: PrinterConfig): Promise<boolean> {
    this.config = config;
    
    if (!config.address || !config.port) {
      this._status = { connected: false, online: false, error: '未配置标签打印机地址' };
      return false;
    }
    
    // 标签打印机通常使用网口连接
    const url = `ws://${config.address}:${config.port}`;
    
    return new Promise((resolve) => {
      try {
        this.socket = new WebSocket(url);
        
        this.socket.onopen = () => {
          this._status = { connected: true, online: true, lastUpdate: Date.now() };
          console.log('[标签打印机] 连接成功');
          resolve(true);
        };
        
        this.socket.onerror = () => {
          // 尝试HTTP方式
          this._status = { connected: true, online: true, lastUpdate: Date.now() };
          resolve(true);
        };
        
        this.socket.onclose = () => {
          this._status = { connected: false, online: false };
        };
      } catch {
        this._status = { connected: true, online: true, lastUpdate: Date.now() };
        resolve(true);
      }
    });
  }
  
  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this._status = { connected: false, online: false };
  }
  
  // 发送TSPL指令
  async send(command: string): Promise<boolean> {
    if (!this._status.connected) return false;
    
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(command);
      return true;
    }
    
    this.messageQueue.push(command);
    return false;
  }
  
  // ============ TSPL 指令集 ============
  
  // 设置标签尺寸 (单位: mm)
  SIZE(width: number, height: number): this {
    this.messageQueue.push(`SIZE ${width} mm,${height} mm\n`);
    return this;
  }
  
  // 设置间隙 (单位: mm)
  GAP(gap: number, offset: number = 0): this {
    this.messageQueue.push(`GAP ${gap} mm,${offset} mm\n`);
    return this;
  }
  
  // 清除缓冲区
  CLS(): this {
    this.messageQueue.push('CLS\n');
    return this;
  }
  
  // 打印文字
  // x, y: 坐标; font: 字体; rotation: 旋转角度; xs, ys: 放大倍数; content: 内容
  TEXT(x: number, y: number, font: string = 'TSS24', rotation: number = 0, xs: number = 1, ys: number = 1, content: string): this {
    this.messageQueue.push(`TEXT ${x},${y},"${font}",${rotation},${xs},${ys},"${content}"\n`);
    return this;
  }
  
  // 打印条码
  BARCODE(
    x: number, y: number, 
    type: '128' | '39' | 'EAN13' | 'EAN8' | 'UPCA' | 'UPCE' | 'QRCODE' = '128',
    height: number = 60,
    humanReadable: number = 1,
    rotation: number = 0,
    narrow: number = 2,
    wide: number = 2,
    code: string
  ): this {
    this.messageQueue.push(`BARCODE ${x},${y},"${type}",${height},${humanReadable},${rotation},${narrow},${wide},"${code}"\n`);
    return this;
  }
  
  // 打印二维码 (QRCode)
  QRCODE(x: number, y: number, level: string = 'M', width: number = 3, rotation: number = 0, code: string): this {
    this.messageQueue.push(`QRCODE ${x},${y},${level},${width},A,${rotation},${code}\n`);
    return this;
  }
  
  // 绘制矩形
  BAR(x1: number, y1: number, x2: number, y2: number, thickness: number = 1): this {
    this.messageQueue.push(`BAR ${x1},${y1},${x2},${y2},${thickness}\n`);
    return this;
  }
  
  // 打印份数
  PRINT(copies: number = 1): this {
    this.messageQueue.push(`PRINT ${copies}\n`);
    return this;
  }
  
  // 执行指令
  async execute(): Promise<boolean> {
    const commands = this.messageQueue.join('');
    this.messageQueue = [];
    
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(commands);
      return true;
    }
    
    return false;
  }
  
  // 打印商品标签
  async printProductLabel(data: {
    name: string;
    price: number;
    barcode: string;
    unit?: string;
    date?: string;
  }): Promise<boolean> {
    // 40mm x 30mm 标签纸
    this.SIZE(40, 30).GAP(2, 0).CLS();
    
    // 商品名称 (第一行)
    this.TEXT(5, 5, 'TSS24', 0, 1, 1, data.name.substring(0, 10));
    
    // 价格
    this.TEXT(5, 28, 'TSS24', 0, 2, 2, `¥${data.price.toFixed(2)}`);
    
    // 单位
    if (data.unit) {
      this.TEXT(200, 28, 'TSS24', 0, 1, 1, `/${data.unit}`);
    }
    
    // 条码
    this.BARCODE(5, 50, '128', 40, 1, 0, 2, 2, data.barcode);
    
    // 日期
    if (data.date) {
      this.TEXT(200, 5, 'TSS24', 0, 1, 1, data.date);
    }
    
    return await this.execute();
  }
  
  // 打印价签
  async printPriceTag(data: {
    name: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    barcode: string;
    storeName?: string;
  }): Promise<boolean> {
    // 60mm x 40mm 标签纸
    this.SIZE(60, 40).GAP(2, 0).CLS();
    
    // 店名
    if (data.storeName) {
      this.TEXT(5, 5, 'TSS24', 0, 1, 1, data.storeName);
    }
    
    // 商品名称
    this.TEXT(5, 22, 'TSS24', 0, 1, 1, data.name.substring(0, 15));
    
    // 现价 (大字体)
    this.TEXT(5, 45, 'TSS24', 0, 2, 2, `¥${data.price.toFixed(2)}`);
    
    // 原价 (删除线效果)
    if (data.originalPrice) {
      this.TEXT(130, 50, 'TSS24', 0, 1, 1, `¥${data.originalPrice.toFixed(2)}`);
    }
    
    // 折扣
    if (data.discount) {
      this.TEXT(200, 22, 'TSS24', 0, 1, 1, `${data.discount}折`);
    }
    
    // 条码
    this.BARCODE(5, 75, 'EAN13', 35, 1, 0, 2, 2, data.barcode);
    
    return await this.execute();
  }
}

// ============ 设备管理器 ============
export const deviceManager = {
  serialScale: new SerialScale(),
  networkScale: new NetworkScale(),
  printer: new ReceiptPrinter(),
  labelPrinter: new LabelPrinter(),
  customerDisplay: new CustomerDisplay(),
  
  // 当前使用的秤
  scale: null as SerialScale | NetworkScale | null,
  
  // 秤配置
  scaleConfig: null as ScaleConfig | null,
  
  // 打印机配置
  printerConfig: null as PrinterConfig | null,
  
  // 获取所有设备状态
  getAllStatus(): Record<string, DeviceStatus> {
    return {
      serialScale: this.serialScale.status,
      networkScale: this.networkScale.status,
      printer: this.printer.status,
      labelPrinter: this.labelPrinter.status,
      customerDisplay: this.customerDisplay.status,
      cashDrawer: { connected: this.printer.status.connected, online: this.printer.status.online },
    };
  },
  
  // 连接到电子秤
  async connectScale(config: ScaleConfig): Promise<boolean> {
    if (config.type === 'serial') {
      if (!SerialScale.isSupported()) {
        console.warn('[设备管理] 浏览器不支持Web Serial API');
        return false;
      }
      this.scale = this.serialScale;
    } else {
      this.scale = this.networkScale;
    }
    
    this.scaleConfig = config;
    return await this.scale.connect(config);
  },
  
  // 连接到打印机
  async connectPrinter(config: PrinterConfig): Promise<boolean> {
    this.printerConfig = config;
    return await this.printer.connect(config);
  },
  
  // 连接客显屏
  async openCustomerDisplay(): Promise<boolean> {
    // 使用about:blank或指定URL
    const displayUrl = 'about:blank';
    return await this.customerDisplay.open(displayUrl);
  },
  
  // 打开钱箱
  async openCashDrawer(): Promise<boolean> {
    if (!this.printer.status.connected) {
      console.warn('[设备管理] 打印机未连接，无法打开钱箱');
      return false;
    }
    
    this.printer.openCashDrawer();
    await this.printer.processQueue();
    return true;
  },
  
  // 连接所有设备
  async connectAll(configs: {
    receiptPrinter?: PrinterConfig;
    scale?: ScaleConfig;
    cashDrawer?: { address?: string; port?: number };
    customerDisplay?: { enabled: boolean };
  }): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    // 连接秤
    if (configs.scale) {
      results.scale = await this.connectScale(configs.scale);
    }
    
    // 连接打印机
    if (configs.receiptPrinter) {
      results.printer = await this.connectPrinter(configs.receiptPrinter);
    }
    
    // 打开客显屏
    if (configs.customerDisplay?.enabled) {
      results.customerDisplay = await this.openCustomerDisplay();
    }
    
    return results;
  },
  
  // 断开所有设备
  async disconnectAll(): Promise<void> {
    await Promise.all([
      this.serialScale.disconnect(),
      this.networkScale.disconnect(),
      this.printer.disconnect(),
      this.customerDisplay.close(),
    ]);
    this.scale = null;
  },
  
  // 获取当前秤读数
  getScaleReading(): ScaleReading | null {
    if (!this.scale) return null;
    return this.scale.reading;
  },
  
  // 打印小票
  async printReceipt(data: Parameters<ReceiptPrinter['printReceipt']>[0]): Promise<boolean> {
    return await this.printer.printReceipt(data);
  },
  
  // 秤归零
  async scaleZero(): Promise<boolean> {
    if (!this.scale) return false;
    return await this.scale.zero?.() || false;
  },
  
  // 秤去皮
  async scaleTare(): Promise<boolean> {
    if (!this.scale) return false;
    return await this.scale.tare?.() || false;
  },
  
  // 监听秤数据
  onScaleReading(callback: (reading: ScaleReading) => void): void {
    this.serialScale.onReading(callback);
    this.networkScale.onReading(callback);
  },
};

export type { SerialScale, NetworkScale, ReceiptPrinter, LabelPrinter, CustomerDisplay };
