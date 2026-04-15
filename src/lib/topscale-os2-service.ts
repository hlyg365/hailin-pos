/**
 * 顶尖OS2电子秤服务
 * 专门处理顶尖OS2协议的电子秤通讯
 * 
 * 协议说明：
 * - 通讯方式：RS232串口
 * - 波特率：9600
 * - 数据位：8位
 * - 停止位：1位
 * - 校验位：无
 * - 流控制：无
 * 
 * 数据格式：
 * - 稳定数据：STX + 'S' + 重量值 + 单位 + ETX + CR
 * - 不稳定数据：STX + 'U' + 重量值 + 单位 + ETX + CR
 * 
 * 控制字符：
 * - STX (0x02): 开始标志
 * - ETX (0x03): 结束标志
 * - CR (0x0D): 回车符
 * 
 * 命令：
 * - 去皮：ESC + 'T' + CR
 * - 归零：ESC + 'Z' + CR
 * - 打印：ESC + 'P' + CR
 */

import { Capacitor } from '@capacitor/core';

// 协议常量
const PROTOCOL = {
  STX: 0x02,
  ETX: 0x03,
  CR: 0x0D,
  ESC: 0x1B,
  
  // 命令
  CMD_TARE: [0x1B, 0x54, 0x0D],      // 去皮
  CMD_ZERO: [0x1B, 0x5A, 0x0D],      // 归零
  CMD_PRINT: [0x1B, 0x50, 0x0D],     // 打印
  CMD_CLEAR: [0x1B, 0x63, 0x0D],    // 清除显示
  
  // 波特率
  BAUD_RATE: 9600,
  
  // 数据位、停止位、校验
  DATA_BITS: 8,
  STOP_BITS: 1,
  PARITY: 'none' as const,
};

// 称重数据
export interface TopScaleWeight {
  weight: number;           // 重量（克）
  weightKg: number;          // 重量（千克）
  stable: boolean;           // 是否稳定
  timestamp: number;         // 时间戳
  rawData: string;           // 原始数据（十六进制）
  rawString: string;         // 原始字符串
}

// 连接配置
export interface TopScaleConfig {
  portPath: string;          // 串口路径
  baudRate?: number;         // 波特率，默认9600
  dataBits?: number;         // 数据位，默认8
  stopBits?: number;         // 停止位，默认1
  parity?: 'none' | 'even' | 'odd';  // 校验位
  autoReconnect?: boolean;   // 自动重连
  reconnectInterval?: number; // 重连间隔（毫秒）
}

// 设备状态
export interface TopScaleStatus {
  connected: boolean;
  portPath: string;
  lastWeight: TopScaleWeight | null;
  batteryLevel?: number;
  error?: string;
}

// 回调类型
export type WeightCallback = (data: TopScaleWeight) => void;
export type StatusCallback = (status: TopScaleStatus) => void;
export type ErrorCallback = (error: Error) => void;

/**
 * 顶尖OS2电子秤服务类
 */
class TopScaleOS2Service {
  private static instance: TopScaleOS2Service;
  
  private config: Required<TopScaleConfig>;
  private status: TopScaleStatus = {
    connected: false,
    portPath: '',
    lastWeight: null,
  };
  
  private weightCallbacks: Set<WeightCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();
  
  private readStream: ReadableStream<Uint8Array> | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private isReading = false;
  
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  // 数据缓冲区
  private dataBuffer: number[] = [];
  
  private constructor() {
    this.config = {
      portPath: '',
      baudRate: PROTOCOL.BAUD_RATE,
      dataBits: PROTOCOL.DATA_BITS,
      stopBits: PROTOCOL.STOP_BITS,
      parity: PROTOCOL.PARITY,
      autoReconnect: true,
      reconnectInterval: 3000,
    };
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(): TopScaleOS2Service {
    if (!TopScaleOS2Service.instance) {
      TopScaleOS2Service.instance = new TopScaleOS2Service();
    }
    return TopScaleOS2Service.instance;
  }
  
  /**
   * 获取当前状态
   */
  getStatus(): TopScaleStatus {
    return { ...this.status };
  }
  
  /**
   * 获取配置
   */
  getConfig(): TopScaleConfig {
    return { ...this.config };
  }
  
  /**
   * 连接到电子秤
   */
  async connect(config: TopScaleConfig): Promise<boolean> {
    this.config = {
      ...this.config,
      ...config,
    };
    
    try {
      // 在Web Serial API环境中连接
      if ('serial' in navigator) {
        return await this.connectWebSerial();
      }
      
      // 在原生平台中连接
      if (Capacitor.isNativePlatform()) {
        return await this.connectNative();
      }
      
      // 模拟连接
      return this.simulateConnect();
      
    } catch (error) {
      this.handleError(error as Error);
      return false;
    }
  }
  
  /**
   * Web Serial API连接
   */
  private async connectWebSerial(): Promise<boolean> {
    try {
      // @ts-ignore - Web Serial API
      const port = await navigator.serial.requestPort();
      
      await port.connect({
        baudRate: this.config.baudRate,
        dataBits: this.config.dataBits,
        stopBits: this.config.stopBits,
        parity: this.config.parity,
      });
      
      this.readStream = port.readable;
      
      if (this.readStream) {
        this.reader = this.readStream.getReader();
        this.startReading();
      }
      
      this.updateStatus({
        connected: true,
        portPath: port.path || 'unknown',
      });
      
      return true;
    } catch (error) {
      console.error('Web Serial connect failed:', error);
      return false;
    }
  }
  
  /**
   * 原生平台连接
   */
  private async connectNative(): Promise<boolean> {
    // 调用原生插件
    try {
      const result = await (window as any).Capacitor.Plugins.ScalePlugin?.connectSerial({
        path: this.config.portPath,
        baudRate: this.config.baudRate,
      });
      
      if (result?.success) {
        this.updateStatus({
          connected: true,
          portPath: this.config.portPath,
        });
        
        this.startNativeListening();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Native connect failed:', error);
      return false;
    }
  }
  
  /**
   * 模拟连接
   */
  private simulateConnect(): boolean {
    this.updateStatus({
      connected: true,
      portPath: '/dev模拟串口',
    });
    
    // 模拟读取数据
    this.simulateRead();
    return true;
  }
  
  /**
   * 开始读取数据
   */
  private startReading(): void {
    if (this.isReading || !this.reader) return;
    this.isReading = true;
    
    this.readLoop();
  }
  
  /**
   * 读取循环
   */
  private async readLoop(): Promise<void> {
    while (this.isReading && this.reader) {
      try {
        const { value, done } = await this.reader.read();
        
        if (done) {
          break;
        }
        
        if (value) {
          this.processData(new Uint8Array(value));
        }
      } catch (error) {
        console.error('Read error:', error);
        this.handleError(error as Error);
        break;
      }
    }
  }
  
  /**
   * 停止读取
   */
  private stopReading(): void {
    this.isReading = false;
    
    if (this.reader) {
      this.reader.cancel();
      this.reader = null;
    }
  }
  
  /**
   * 处理接收到的数据
   */
  private processData(data: Uint8Array): void {
    for (const byte of data) {
      this.dataBuffer.push(byte);
      
      // 查找完整的数据包
      const startIndex = this.dataBuffer.indexOf(PROTOCOL.STX);
      const endIndex = this.dataBuffer.indexOf(PROTOCOL.ETX);
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        // 提取数据包（包含STX和ETX）
        const packet = this.dataBuffer.slice(startIndex, endIndex + 2);
        
        // 解析数据
        const weightData = this.parsePacket(packet);
        
        if (weightData) {
          this.notifyWeightCallbacks(weightData);
          this.updateStatus({ lastWeight: weightData });
        }
        
        // 清除已处理的数据
        this.dataBuffer = this.dataBuffer.slice(endIndex + 2);
      }
      
      // 防止缓冲区溢出
      if (this.dataBuffer.length > 100) {
        this.dataBuffer = this.dataBuffer.slice(-50);
      }
    }
  }
  
  /**
   * 解析数据包
   */
  private parsePacket(packet: number[]): TopScaleWeight | null {
    if (packet.length < 5) {
      return null;
    }
    
    try {
      // 转换为字符串（去掉控制字符）
      const cleanData = packet
        .filter(b => b >= 0x20 && b < 0x7F)  // 只保留可打印ASCII
        .map(b => String.fromCharCode(b))
        .join('');
      
      // 解析稳定标志
      const stable = cleanData.includes('S') || cleanData.includes('ST');
      
      // 解析单位和重量
      let weight = 0;
      let unit = 'g';
      
      // 匹配千克格式
      const kgMatch = cleanData.match(/([0-9.]+)\s*(KG|kg|Kilo)/i);
      if (kgMatch) {
        weight = parseFloat(kgMatch[1]) * 1000;
        unit = 'kg';
      } else {
        // 匹配克格式
        const gMatch = cleanData.match(/([0-9.]+)\s*G/i);
        if (gMatch) {
          weight = parseFloat(gMatch[1]);
          unit = 'g';
        } else {
          // 尝试直接解析数字
          const numMatch = cleanData.match(/([0-9.]+)/);
          if (numMatch) {
            weight = parseFloat(numMatch[1]);
          }
        }
      }
      
      // 转换为十六进制字符串
      const rawHex = Array.from(packet)
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ');
      
      return {
        weight: Math.round(weight * 10) / 10,
        weightKg: Math.round(weight / 1000 * 100) / 100,
        stable,
        timestamp: Date.now(),
        rawData: rawHex,
        rawString: cleanData,
      };
    } catch (error) {
      console.error('Parse packet error:', error);
      return null;
    }
  }
  
  /**
   * 模拟读取数据
   */
  private simulateRead(): void {
    if (!this.status.connected) return;
    
    // 模拟随机重量
    const baseWeight = 100 + Math.random() * 900;
    const stable = Math.random() > 0.2;
    
    const weightData: TopScaleWeight = {
      weight: Math.round(baseWeight * 10) / 10,
      weightKg: Math.round(baseWeight / 1000 * 100) / 100,
      stable,
      timestamp: Date.now(),
      rawData: '',
      rawString: `STX ${stable ? 'S' : 'U'} ${(baseWeight / 1000).toFixed(3)} KG ETX CR`,
    };
    
    this.notifyWeightCallbacks(weightData);
    this.updateStatus({ lastWeight: weightData });
    
    // 每500ms更新一次
    setTimeout(() => this.simulateRead(), 500);
  }
  
  /**
   * 开始原生平台监听
   */
  private startNativeListening(): void {
    // 实现原生事件监听
    document.addEventListener('topscale-data', ((event: CustomEvent) => {
      const weightData = event.detail as TopScaleWeight;
      this.notifyWeightCallbacks(weightData);
      this.updateStatus({ lastWeight: weightData });
    }) as EventListener);
  }
  
  /**
   * 发送命令
   */
  async sendCommand(command: number[]): Promise<boolean> {
    if (!this.status.connected) {
      console.warn('Scale not connected');
      return false;
    }
    
    try {
      // Web Serial
      if ('serial' in navigator && (window as any).serialPort) {
        const writer = (window as any).serialPort.writable.getWriter();
        await writer.write(new Uint8Array(command));
        writer.releaseLock();
        return true;
      }
      
      // 原生平台
      if (Capacitor.isNativePlatform()) {
        const result = await (window as any).Capacitor.Plugins.ScalePlugin?.sendCommand({
          command: Array.from(command),
        });
        return result?.success;
      }
      
      return true; // 模拟成功
    } catch (error) {
      console.error('Send command failed:', error);
      return false;
    }
  }
  
  /**
   * 去皮
   */
  async tare(): Promise<boolean> {
    return this.sendCommand(PROTOCOL.CMD_TARE);
  }
  
  /**
   * 归零
   */
  async zero(): Promise<boolean> {
    return this.sendCommand(PROTOCOL.CMD_ZERO);
  }
  
  /**
   * 打印
   */
  async print(): Promise<boolean> {
    return this.sendCommand(PROTOCOL.CMD_PRINT);
  }
  
  /**
   * 清除显示
   */
  async clear(): Promise<boolean> {
    return this.sendCommand(PROTOCOL.CMD_CLEAR);
  }
  
  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    this.stopReading();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Web Serial
    if ('serial' in navigator && (window as any).serialPort) {
      try {
        await (window as any).serialPort.close();
      } catch (error) {
        console.error('Close port failed:', error);
      }
    }
    
    // 原生平台
    if (Capacitor.isNativePlatform()) {
      try {
        await (window as any).Capacitor.Plugins.ScalePlugin?.disconnect();
      } catch (error) {
        console.error('Native disconnect failed:', error);
      }
    }
    
    this.updateStatus({
      connected: false,
      portPath: '',
      lastWeight: null,
    });
  }
  
  /**
   * 更新状态
   */
  private updateStatus(partial: Partial<TopScaleStatus>): void {
    this.status = { ...this.status, ...partial };
    this.notifyStatusCallbacks();
  }
  
  /**
   * 处理错误
   */
  private handleError(error: Error): void {
    console.error('TopScale error:', error);
    
    this.errorCallbacks.forEach(callback => callback(error));
    
    // 更新错误状态
    this.updateStatus({ error: error.message });
    
    // 自动重连
    if (this.config.autoReconnect && this.status.connected) {
      this.scheduleReconnect();
    }
  }
  
  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(async () => {
      if (this.config.autoReconnect && !this.status.connected) {
        console.log('Attempting to reconnect TopScale...');
        await this.connect(this.config);
      }
    }, this.config.reconnectInterval);
  }
  
  /**
   * 通知称重数据回调
   */
  private notifyWeightCallbacks(data: TopScaleWeight): void {
    this.weightCallbacks.forEach(callback => callback(data));
  }
  
  /**
   * 通知状态变化回调
   */
  private notifyStatusCallbacks(): void {
    const status = this.getStatus();
    this.statusCallbacks.forEach(callback => callback(status));
  }
  
  /**
   * 注册称重数据回调
   */
  onWeight(callback: WeightCallback): () => void {
    this.weightCallbacks.add(callback);
    return () => this.weightCallbacks.delete(callback);
  }
  
  /**
   * 注册状态变化回调
   */
  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    callback(this.getStatus()); // 立即发送当前状态
    return () => this.statusCallbacks.delete(callback);
  }
  
  /**
   * 注册错误回调
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }
}

// 导出单例
export const topScaleOS2Service = TopScaleOS2Service.getInstance();

// 导出类和常量
export { TopScaleOS2Service, PROTOCOL };
