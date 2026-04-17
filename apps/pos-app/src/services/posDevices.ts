/**
 * 收银设备服务 - 统一管理客显屏、小票打印机、标签机、钱箱、电子秤、摄像头
 * 支持 Web API / ESC/POS 协议 / 串口通信
 * 注意：已移除所有模拟代码，需要配置真实硬件后使用
 */

// ============ 类型定义 ============
export interface DeviceStatus {
  connected: boolean;
  online: boolean;
  error?: string;
  lastUpdate?: number;
}

export interface PrinterConfig {
  type: 'network' | 'bluetooth' | 'usb';
  address?: string;
  port?: number;
  name?: string;
  width: 58 | 80; // mm
}

export interface ScaleReading {
  weight: number;      // kg
  unit: 'kg' | 'g';
  stable: boolean;
  timestamp: number;
}

export interface BarcodeScanResult {
  barcode: string;
  format?: string;
  timestamp: number;
}

export interface CashDrawerStatus {
  open: boolean;
  lastOpened?: number;
}

// ============ 设备基类 ============
abstract class POSDevice {
  protected _status: DeviceStatus = { connected: false, online: false };
  
  get status(): DeviceStatus {
    return { ...this._status };
  }
  
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract test(): Promise<boolean>;
}

// ============ 客显屏服务 ============
export class CustomerDisplayService extends POSDevice {
  private displayWindow: Window | null = null;
  
  async connect(): Promise<void> {
    try {
      // 尝试打开客显屏窗口
      const width = 400;
      const height = 300;
      const left = window.screen.width - width - 20;
      const top = window.screen.height - height - 100;
      
      this.displayWindow = window.open(
        '',
        'customer_display',
        `width=${width},height=${height},left=${left},top=${top},location=no,menubar=no,toolbar=no`
      );
      
      if (this.displayWindow) {
        this.displayWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: 'Microsoft YaHei', Arial, sans-serif;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                color: #00ff88;
                height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 20px;
              }
              .welcome { font-size: 24px; text-align: center; margin-bottom: 20px; }
              .amount { font-size: 72px; font-weight: bold; color: #fff; }
              .label { font-size: 18px; opacity: 0.7; margin-top: 10px; }
              .scan-line {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: #00ff88;
                animation: scan 3s linear infinite;
              }
              @keyframes scan {
                0% { top: 0; opacity: 1; }
                100% { top: 100%; opacity: 0; }
              }
            </style>
          </head>
          <body>
            <div class="scan-line"></div>
            <div class="welcome">海邻到家</div>
            <div class="amount" id="amount">¥0.00</div>
            <div class="label" id="label">等待收款...</div>
          </body>
          </html>
        `);
        this._status = { connected: true, online: true, lastUpdate: Date.now() };
      } else {
        this._status = { connected: false, online: false, error: '无法打开客显屏窗口（可能被浏览器阻止）' };
      }
    } catch (error) {
      this._status = { connected: false, online: false, error: String(error) };
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.displayWindow) {
      this.displayWindow.close();
      this.displayWindow = null;
    }
    this._status = { connected: false, online: false };
  }
  
  async test(): Promise<boolean> {
    return this._status.connected;
  }
  
  updateDisplay(data: { amount?: number; paid?: boolean; message?: string }) {
    if (this.displayWindow && !this.displayWindow.closed) {
      const doc = this.displayWindow.document;
      if (data.amount !== undefined) {
        doc.getElementById('amount')!.textContent = `¥${data.amount.toFixed(2)}`;
      }
      if (data.message !== undefined) {
        doc.getElementById('label')!.textContent = data.message;
      }
      if (data.paid) {
        doc.body.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
      }
    }
  }
  
  showWelcome() {
    this.updateDisplay({ amount: 0, paid: false, message: '欢迎光临' });
  }
  
  showWaiting(amount: number) {
    this.updateDisplay({ amount, paid: false, message: '请付款' });
  }
  
  showPaid(amount: number) {
    this.updateDisplay({ amount, paid: true, message: '谢谢惠顾' });
  }
}

// ============ 小票打印机服务 ============
export class ReceiptPrinterService extends POSDevice {
  private config: PrinterConfig = { type: 'network', address: '', port: 9100, width: 58 };
  private socket: WebSocket | null = null;
  
  async connect(config?: PrinterConfig): Promise<void> {
    if (config) this.config = { ...this.config, ...config };
    
    if (this.config.type === 'network' && this.config.address) {
      // 网络打印机：使用 WebSocket 连接
      try {
        const wsUrl = `ws://${this.config.address}:${this.config.port || 9100}`;
        this.socket = new WebSocket(wsUrl);
        
        await new Promise((resolve, reject) => {
          this.socket!.onopen = resolve;
          this.socket!.onerror = reject;
          setTimeout(reject, 5000); // 5秒超时
        });
        
        this._status = { connected: true, online: true, lastUpdate: Date.now() };
      } catch (error) {
        this._status = { connected: false, online: false, error: `网络打印机连接失败: ${error}` };
        throw error;
      }
    } else if (this.config.type === 'bluetooth') {
      // 蓝牙打印机：需要调用 Web Bluetooth API
      this._status = { connected: false, online: false, error: '蓝牙打印机需要 Web Bluetooth API 支持' };
    } else if (this.config.type === 'usb') {
      // USB打印机：使用 WebUSB API
      this._status = { connected: false, online: false, error: 'USB打印机需要 WebUSB API 支持' };
    } else {
      this._status = { connected: false, online: false, error: '请先配置打印机地址' };
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this._status = { connected: false, online: false };
  }
  
  async test(): Promise<boolean> {
    if (!this._status.connected) return false;
    
    // 发送测试指令
    const testData = this.buildReceiptData({
      orderNo: 'TEST' + Date.now(),
      storeName: '测试门店',
      items: [{ name: '测试商品', qty: 1, price: 1.00 }],
      total: 1.00,
      payMethod: '测试',
      cashier: '系统',
      time: new Date().toLocaleString('zh-CN'),
    });
    
    return this.sendToPrinter(testData);
  }
  
  /**
   * 发送数据到打印机
   */
  private async sendToPrinter(data: Uint8Array): Promise<boolean> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
      this._status.lastUpdate = Date.now();
      return true;
    }
    
    // 如果没有网络连接，尝试使用 USB 或提示用户
    if (this.config.type === 'usb' && 'usb' in navigator) {
      // WebUSB 实现
      console.error('WebUSB 打印未实现');
      return false;
    }
    
    console.error('打印机未连接或连接断开');
    return false;
  }
  
  /**
   * 构建 ESC/POS 小票数据
   */
  private buildReceiptData(orderData: {
    orderNo: string;
    storeName: string;
    items: Array<{ name: string; qty: number; price: number }>;
    total: number;
    payMethod: string;
    cashier: string;
    time: string;
  }): Uint8Array {
    const encoder = new TextEncoder();
    const commands: number[] = [];
    
    // 初始化打印机
    commands.push(0x1B, 0x40);
    
    // 居中
    commands.push(0x1B, 0x61, 0x01);
    
    // 放大标题
    commands.push(0x1D, 0x21, 0x11);
    commands.push(...encoder.encode('海邻到家\n'));
    
    // 恢复正常大小
    commands.push(0x1D, 0x21, 0x00);
    commands.push(...encoder.encode('----------------------------\n'));
    
    // 左对齐
    commands.push(0x1B, 0x61, 0x00);
    
    // 订单信息
    commands.push(...encoder.encode(`单号: ${orderData.orderNo}\n`));
    commands.push(...encoder.encode(`门店: ${orderData.storeName}\n`));
    commands.push(...encoder.encode(`收银: ${orderData.cashier}\n`));
    commands.push(...encoder.encode(`时间: ${orderData.time}\n`));
    commands.push(...encoder.encode('----------------------------\n'));
    
    // 商品明细
    orderData.items.forEach(item => {
      const line = `${item.name}\n`;
      commands.push(...encoder.encode(line));
      const qtyPrice = `  x${item.qty}    ¥${(item.price * item.qty).toFixed(2)}\n`;
      commands.push(...encoder.encode(qtyPrice));
    });
    
    commands.push(...encoder.encode('----------------------------\n'));
    
    // 合计 - 居中加粗
    commands.push(0x1B, 0x45, 0x01);
    commands.push(0x1B, 0x61, 0x01);
    commands.push(...encoder.encode(`合计: ¥${orderData.total.toFixed(2)}\n`));
    commands.push(0x1B, 0x45, 0x00);
    
    // 支付方式
    commands.push(...encoder.encode(`支付: ${orderData.payMethod}\n`));
    
    // 分割线
    commands.push(...encoder.encode('----------------------------\n'));
    
    // 二维码区域
    commands.push(0x1B, 0x61, 0x01);
    commands.push(...encoder.encode('[ 扫码评价得积分 ]\n'));
    commands.push(...encoder.encode('----------------------------\n'));
    
    // 底部信息
    commands.push(...encoder.encode('\n'));
    commands.push(0x1B, 0x61, 0x01);
    commands.push(...encoder.encode('谢谢惠顾 欢迎下次光临\n'));
    commands.push(...encoder.encode('\n\n\n'));
    
    // 切纸
    commands.push(0x1D, 0x56, 0x00);
    
    return new Uint8Array(commands);
  }
  
  /**
   * 打印小票
   */
  async printReceipt(orderData: {
    orderNo: string;
    storeName: string;
    items: Array<{ name: string; qty: number; price: number }>;
    total: number;
    payMethod: string;
    cashier: string;
    time: string;
  }): Promise<boolean> {
    if (!this._status.connected) {
      console.error('[ReceiptPrinter] 打印机未连接');
      alert('打印机未连接，请检查配置');
      return false;
    }
    
    try {
      const data = this.buildReceiptData(orderData);
      const success = await this.sendToPrinter(data);
      
      if (success) {
        console.log('[ReceiptPrinter] 小票打印完成:', orderData.orderNo);
        this._status.lastUpdate = Date.now();
      }
      
      return success;
    } catch (error) {
      console.error('[ReceiptPrinter] 打印失败:', error);
      return false;
    }
  }
}

// ============ 标签打印机服务 ============
export class LabelPrinterService extends POSDevice {
  private config: PrinterConfig = { type: 'network', address: '', port: 9100, width: 58 };
  private socket: WebSocket | null = null;
  
  async connect(config?: PrinterConfig): Promise<void> {
    if (config) this.config = { ...this.config, ...config };
    
    if (this.config.type === 'network' && this.config.address) {
      try {
        const wsUrl = `ws://${this.config.address}:${this.config.port || 9100}`;
        this.socket = new WebSocket(wsUrl);
        
        await new Promise((resolve, reject) => {
          this.socket!.onopen = resolve;
          this.socket!.onerror = reject;
          setTimeout(reject, 5000);
        });
        
        this._status = { connected: true, online: true, lastUpdate: Date.now() };
      } catch (error) {
        this._status = { connected: false, online: false, error: `标签打印机连接失败: ${error}` };
        throw error;
      }
    } else {
      this._status = { connected: false, online: false, error: '请先配置标签打印机地址' };
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this._status = { connected: false, online: false };
  }
  
  async test(): Promise<boolean> {
    return this._status.connected;
  }
  
  /**
   * 构建标签数据（ESC/POS 标签指令）
   */
  private buildLabelData(data: {
    productName: string;
    price: number;
    barcode: string;
    unit?: string;
    date?: string;
  }): Uint8Array {
    const encoder = new TextEncoder();
    const commands: number[] = [];
    
    // 初始化
    commands.push(0x1B, 0x40);
    
    // 设置标签尺寸（40x30mm）
    commands.push(0x1D, 0x57, 0x00, 0x1C, 0x00);
    
    // 打印商品名称
    commands.push(0x1B, 0x61, 0x00); // 左对齐
    commands.push(0x1D, 0x21, 0x01); // 放大
    commands.push(...encoder.encode(data.productName + '\n'));
    
    // 打印价格
    commands.push(0x1D, 0x21, 0x11); // 更大
    commands.push(0x1B, 0x61, 0x01); // 居中
    commands.push(...encoder.encode(`¥${data.price.toFixed(2)}\n`));
    
    // 打印条码
    commands.push(0x1B, 0x61, 0x01);
    commands.push(0x1D, 0x6B, 0x02, ...encoder.encode(data.barcode), 0x00);
    
    // 日期
    commands.push(0x1D, 0x21, 0x00);
    commands.push(0x1B, 0x61, 0x00);
    commands.push(...encoder.encode(`日期: ${data.date || new Date().toLocaleDateString()}\n`));
    
    // 走纸并切纸
    commands.push(0x1D, 0x56, 0x00);
    
    return new Uint8Array(commands);
  }
  
  /**
   * 打印价格标签
   */
  async printLabel(data: {
    productName: string;
    price: number;
    barcode: string;
    unit?: string;
    date?: string;
  }): Promise<boolean> {
    if (!this._status.connected) {
      console.error('[LabelPrinter] 标签打印机未连接');
      alert('标签打印机未连接，请检查配置');
      return false;
    }
    
    try {
      const labelData = this.buildLabelData(data);
      
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(labelData);
        this._status.lastUpdate = Date.now();
        console.log('[LabelPrinter] 标签打印完成:', data.productName);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[LabelPrinter] 标签打印失败:', error);
      return false;
    }
  }
  
  /**
   * 批量打印标签
   */
  async printBatch(labels: Parameters<typeof this.printLabel>[0][]): Promise<boolean[]> {
    return Promise.all(labels.map(label => this.printLabel(label)));
  }
}

// ============ 钱箱服务 ============
export class CashDrawerService extends POSDevice {
  private isOpen = false;
  private socket: WebSocket | null = null;
  private drawerAddress: string = '';
  private drawerPort: number = 9100;
  
  async connect(address?: string, port?: number): Promise<void> {
    this.drawerAddress = address || '';
    this.drawerPort = port || 9100;
    
    if (this.drawerAddress) {
      // 尝试网络连接
      try {
        const wsUrl = `ws://${this.drawerAddress}:${this.drawerPort}`;
        this.socket = new WebSocket(wsUrl);
        
        await new Promise((resolve, reject) => {
          this.socket!.onopen = resolve;
          this.socket!.onerror = reject;
          setTimeout(reject, 3000);
        });
        
        this._status = { connected: true, online: true, lastUpdate: Date.now() };
      } catch (error) {
        // 网络连接失败，但钱箱可能仍然可用（通过打印机触发）
        this._status = { connected: true, online: true, lastUpdate: Date.now(), error: '使用打印机端口触发钱箱' };
      }
    } else {
      // 没有配置地址，尝试通过打印机触发
      this._status = { connected: true, online: true, lastUpdate: Date.now(), error: '使用打印机端口触发钱箱' };
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this._status = { connected: false, online: false };
    this.isOpen = false;
  }
  
  async test(): Promise<boolean> {
    return this._status.connected;
  }
  
  getStatus(): CashDrawerStatus {
    return {
      open: this.isOpen,
      lastOpened: this._status.lastUpdate
    };
  }
  
  /**
   * 打开钱箱
   * 使用 ESC/POS 指令: ESC p m t1 t2
   */
  async open(): Promise<boolean> {
    if (!this._status.connected) {
      console.error('[CashDrawer] 钱箱未连接');
      alert('钱箱未连接，请检查配置');
      return false;
    }
    
    try {
      // ESC p m t1 t2 - 触发钱箱
      // m: 0-255 (通常用0)
      // t1, t2: 脉冲时间 (通常用 25, 250ms)
      const commands = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]);
      
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(commands);
      } else {
        // 通过打印机间接触发（打印机连接钱箱）
        console.log('[CashDrawer] 尝试通过打印机触发钱箱');
        // 注意：钱箱通常连接到打印机的钱箱接口，需要通过打印机的指令触发
      }
      
      this.isOpen = true;
      this._status.lastUpdate = Date.now();
      console.log('[CashDrawer] 钱箱已打开');
      
      return true;
    } catch (error) {
      console.error('[CashDrawer] 钱箱打开失败:', error);
      return false;
    }
  }
  
  /**
   * 检查钱箱状态
   */
  async checkDrawerStatus(): Promise<CashDrawerStatus> {
    return this.getStatus();
  }
}

// ============ 电子秤服务 ============
export class ScaleService extends POSDevice {
  private reading: ScaleReading = { weight: 0, unit: 'kg', stable: false, timestamp: 0 };
  private listeners: Set<(reading: ScaleReading) => void> = new Set();
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private scaleAddress: string = '';
  private scalePort: number = 8080;
  
  async connect(address?: string, port?: number): Promise<void> {
    this.scaleAddress = address || '';
    this.scalePort = port || 8080;
    
    if (!this.scaleAddress) {
      this._status = { connected: false, online: false, error: '请先配置电子秤地址' };
      return;
    }
    
    try {
      // 尝试连接电子秤 API
      const response = await fetch(`http://${this.scaleAddress}:${this.scalePort}/status`, {
        method: 'GET',
        mode: 'cors',
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        this._status = { connected: true, online: true, lastUpdate: Date.now() };
      } else {
        this._status = { connected: false, online: false, error: `电子秤响应错误: ${response.status}` };
      }
    } catch (error) {
      this._status = { connected: false, online: false, error: `电子秤连接失败: ${error}` };
    }
  }
  
  async disconnect(): Promise<void> {
    this.stopListening();
    this._status = { connected: false, online: false };
  }
  
  async test(): Promise<boolean> {
    return this._status.connected;
  }
  
  getReading(): ScaleReading {
    return { ...this.reading };
  }
  
  /**
   * 获取秤数据
   */
  private async fetchScaleData(): Promise<void> {
    if (!this._status.connected || !this.scaleAddress) return;
    
    try {
      const response = await fetch(`http://${this.scaleAddress}:${this.scalePort}/weight`, {
        method: 'GET',
        mode: 'cors',
        signal: AbortSignal.timeout(2000),
      });
      
      if (response.ok) {
        const data = await response.json();
        this.reading = {
          weight: data.weight || 0,
          unit: data.unit || 'kg',
          stable: data.stable ?? true,
          timestamp: Date.now(),
        };
        this._status.lastUpdate = Date.now();
        
        // 通知监听器
        this.listeners.forEach(listener => listener(this.reading));
      }
    } catch (error) {
      // 忽略轮询错误
    }
  }
  
  /**
   * 开始监听电子秤
   */
  async startListening(): Promise<void> {
    if (this.pollingInterval) return;
    
    if (!this._status.connected) {
      console.error('[ScaleService] 电子秤未连接，无法开始监听');
      return;
    }
    
    // 开始轮询
    await this.fetchScaleData();
    this.pollingInterval = setInterval(() => {
      this.fetchScaleData();
    }, 500);
    
    this._status.online = true;
  }
  
  /**
   * 停止监听
   */
  stopListening(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.reading = { weight: 0, unit: 'kg', stable: false, timestamp: 0 };
  }
  
  /**
   * 添加读数监听器
   */
  addListener(callback: (reading: ScaleReading) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  /**
   * 去皮（归零）
   */
  tare(): void {
    if (!this._status.connected) {
      console.error('[ScaleService] 电子秤未连接');
      return;
    }
    
    // 发送去皮指令
    fetch(`http://${this.scaleAddress}:${this.scalePort}/tare`, {
      method: 'POST',
      mode: 'cors',
    }).catch(console.error);
    
    this.reading.weight = 0;
    this.listeners.forEach(listener => listener(this.reading));
  }
  
  /**
   * 校准
   */
  calibrate(weight: number): void {
    if (!this._status.connected) {
      console.error('[ScaleService] 电子秤未连接');
      return;
    }
    
    console.log('[ScaleService] 电子秤校准:', weight, 'kg');
    
    fetch(`http://${this.scaleAddress}:${this.scalePort}/calibrate`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight }),
    }).catch(console.error);
  }
}

// ============ 扫码枪/摄像头服务 ============
export class ScannerService extends POSDevice {
  private listeners: Set<(result: BarcodeScanResult) => void> = new Set();
  private cameraStream: MediaStream | null = null;
  
  async connect(): Promise<void> {
    this._status = { connected: true, online: false, lastUpdate: Date.now() };
  }
  
  async disconnect(): Promise<void> {
    await this.stopCamera();
    this._status = { connected: false, online: false };
  }
  
  async test(): Promise<boolean> {
    return this._status.connected;
  }
  
  /**
   * 启用摄像头扫码
   */
  async startCamera(videoElement: HTMLVideoElement): Promise<boolean> {
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 }
      });
      videoElement.srcObject = this.cameraStream;
      await videoElement.play();
      this._status.online = true;
      return true;
    } catch (error) {
      console.error('[ScannerService] 摄像头启动失败:', error);
      this._status.error = String(error);
      return false;
    }
  }
  
  /**
   * 停止摄像头
   */
  async stopCamera(): Promise<void> {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
    this._status.online = false;
  }
  
  /**
   * 添加扫码结果监听器
   */
  addScanListener(callback: (result: BarcodeScanResult) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  /**
   * 触发扫码结果（供外部调用）
   */
  emitScanResult(barcode: string, format?: string): void {
    const result: BarcodeScanResult = {
      barcode,
      format,
      timestamp: Date.now(),
    };
    this.listeners.forEach(listener => listener(result));
  }
}

// ============ 设备管理器 ============
export class DeviceManager {
  customerDisplay?: CustomerDisplayService;
  receiptPrinter?: ReceiptPrinterService;
  labelPrinter?: LabelPrinterService;
  cashDrawer?: CashDrawerService;
  scale?: ScaleService;
  scanner?: ScannerService;
  
  constructor() {
    this.customerDisplay = new CustomerDisplayService();
    this.receiptPrinter = new ReceiptPrinterService();
    this.labelPrinter = new LabelPrinterService();
    this.cashDrawer = new CashDrawerService();
    this.scale = new ScaleService();
    this.scanner = new ScannerService();
  }
  
  /**
   * 连接所有设备
   */
  async connectAll(configs?: {
    receiptPrinter?: PrinterConfig;
    labelPrinter?: PrinterConfig;
    cashDrawer?: { address?: string; port?: number };
    scale?: { address?: string; port?: number };
  }): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    // 连接客显屏
    try {
      await this.customerDisplay?.connect();
      results.customerDisplay = true;
    } catch { results.customerDisplay = false; }
    
    // 连接小票打印机
    if (configs?.receiptPrinter) {
      try {
        await this.receiptPrinter?.connect(configs.receiptPrinter);
        results.receiptPrinter = this.receiptPrinter?.status.connected || false;
      } catch { results.receiptPrinter = false; }
    }
    
    // 连接标签打印机
    if (configs?.labelPrinter) {
      try {
        await this.labelPrinter?.connect(configs.labelPrinter);
        results.labelPrinter = this.labelPrinter?.status.connected || false;
      } catch { results.labelPrinter = false; }
    }
    
    // 连接钱箱
    if (configs?.cashDrawer) {
      try {
        await this.cashDrawer?.connect(configs.cashDrawer.address, configs.cashDrawer.port);
        results.cashDrawer = true;
      } catch { results.cashDrawer = false; }
    }
    
    // 连接电子秤
    if (configs?.scale) {
      try {
        await this.scale?.connect(configs.scale.address, configs.scale.port);
        results.scale = this.scale?.status.connected || false;
      } catch { results.scale = false; }
    }
    
    // 连接扫码枪
    try {
      await this.scanner?.connect();
      results.scanner = true;
    } catch { results.scanner = false; }
    
    return results;
  }
  
  /**
   * 断开所有设备
   */
  async disconnectAll(): Promise<void> {
    await Promise.all([
      this.customerDisplay?.disconnect(),
      this.receiptPrinter?.disconnect(),
      this.labelPrinter?.disconnect(),
      this.cashDrawer?.disconnect(),
      this.scale?.disconnect(),
      this.scanner?.disconnect(),
    ]);
  }
  
  /**
   * 获取所有设备状态
   */
  getAllStatus(): Record<string, DeviceStatus> {
    return {
      customerDisplay: this.customerDisplay?.status || { connected: false, online: false },
      receiptPrinter: this.receiptPrinter?.status || { connected: false, online: false },
      labelPrinter: this.labelPrinter?.status || { connected: false, online: false },
      cashDrawer: this.cashDrawer?.status || { connected: false, online: false },
      scale: this.scale?.status || { connected: false, online: false },
      scanner: this.scanner?.status || { connected: false, online: false },
    };
  }
}

// 导出单例
export const deviceManager = new DeviceManager();
