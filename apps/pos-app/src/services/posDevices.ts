/**
 * 收银设备服务 - 统一管理客显屏、小票打印机、标签机、钱箱、电子秤、摄像头
 * 支持 Web API / ESC/POS 协议 / 串口通信
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
              @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
            </style>
          </head>
          <body>
            <div class="scan-line"></div>
            <div class="welcome">欢迎光临</div>
            <div class="amount" id="amount">¥0.00</div>
            <div class="label">请付款</div>
            <script>
              window.updateDisplay = function(data) {
                const amountEl = document.getElementById('amount');
                if (data.amount) amountEl.textContent = '¥' + data.amount.toFixed(2);
                if (data.message) {
                  document.querySelector('.welcome').textContent = data.message;
                }
                if (data.paid) {
                  document.querySelector('.amount').style.color = '#00ff88';
                  document.querySelector('.label').textContent = '支付成功';
                }
              };
            <\/script>
          </body>
          </html>
        `);
        this._status = { connected: true, online: true, lastUpdate: Date.now() };
      } else {
        this._status = { connected: false, online: false, error: '窗口被阻止，请允许弹出窗口' };
      }
    } catch (error) {
      this._status = { connected: false, online: false, error: String(error) };
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
    await this.connect();
    return this._status.connected;
  }
  
  updateDisplay(data: { amount?: number; message?: string; paid?: boolean }) {
    if (this.displayWindow && !this.displayWindow.closed) {
      this.displayWindow.updateDisplay(data);
      this._status.lastUpdate = Date.now();
    }
  }
  
  showWelcome() {
    this.updateDisplay({ message: '欢迎光临海邻到家', amount: 0 });
  }
  
  showAmount(amount: number) {
    this.updateDisplay({ amount, message: '应付金额' });
  }
  
  showPaid(amount: number) {
    this.updateDisplay({ amount, paid: true, message: '谢谢惠顾' });
  }
}

// ============ 小票打印机服务 ============
export class ReceiptPrinterService extends POSDevice {
  private config: PrinterConfig = { type: 'network', width: 58 };
  
  async connect(config?: PrinterConfig): Promise<void> {
    if (config) this.config = config;
    // 模拟连接成功
    this._status = { connected: true, online: true, lastUpdate: Date.now() };
  }
  
  async disconnect(): Promise<void> {
    this._status = { connected: false, online: false };
  }
  
  async test(): Promise<boolean> {
    return this._status.connected;
  }
  
  /**
   * 打印小票
   * @param orderData 订单数据
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
      console.error('打印机未连接');
      return false;
    }
    
    try {
      // ESC/POS 指令构建
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
      
      // 二维码区域（模拟）
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
      
      // 模拟打印成功
      console.log('小票打印完成:', orderData.orderNo);
      this._status.lastUpdate = Date.now();
      
      // 在浏览器中模拟打印
      if (typeof window !== 'undefined') {
        this.simulatePrint(orderData);
      }
      
      return true;
    } catch (error) {
      console.error('打印失败:', error);
      return false;
    }
  }
  
  // 浏览器打印模拟
  private simulatePrint(orderData: any) {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>小票打印</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 180px; margin: 0 auto; padding: 10px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 5px 0; }
            .item { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="center bold">海邻到家</div>
          <div class="line"></div>
          <div>单号: ${orderData.orderNo}</div>
          <div>门店: ${orderData.storeName}</div>
          <div>收银: ${orderData.cashier}</div>
          <div>时间: ${orderData.time}</div>
          <div class="line"></div>
          ${orderData.items.map((item: any) => `
            <div>${item.name}</div>
            <div class="item"><span>x${item.qty}</span><span>¥${(item.price * item.qty).toFixed(2)}</span></div>
          `).join('')}
          <div class="line"></div>
          <div class="item bold"><span>合计</span><span>¥${orderData.total.toFixed(2)}</span></div>
          <div>支付: ${orderData.payMethod}</div>
          <div class="line"></div>
          <div class="center">谢谢惠顾</div>
          <script>window.print();</script>
        </body>
        </html>
      `);
    }
  }
}

// ============ 标签打印机服务 ============
export class LabelPrinterService extends POSDevice {
  async connect(): Promise<void> {
    this._status = { connected: true, online: true, lastUpdate: Date.now() };
  }
  
  async disconnect(): Promise<void> {
    this._status = { connected: false, online: false };
  }
  
  async test(): Promise<boolean> {
    return this._status.connected;
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
    if (!this._status.connected) return false;
    
    console.log('打印标签:', data);
    this._status.lastUpdate = Date.now();
    
    // 模拟打印
    const labelWindow = window.open('', '_blank', 'width=200,height=150');
    if (labelWindow) {
      labelWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>标签打印</title>
          <style>
            body { font-family: Arial; width: 120px; margin: 0 auto; padding: 10px; border: 1px solid #000; }
            .name { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
            .price { font-size: 28px; font-weight: bold; color: red; }
            .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 32px; margin-top: 10px; }
            .info { font-size: 10px; color: #666; margin-top: 5px; }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
        </head>
        <body>
          <div class="name">${data.productName}</div>
          <div class="price">¥${data.price.toFixed(2)}</div>
          ${data.unit ? `<div>/${data.unit}</div>` : ''}
          <div class="barcode">*${data.barcode}*</div>
          <div class="info">${data.date || new Date().toLocaleDateString()}</div>
          <script>window.print();</script>
        </body>
        </html>
      `);
    }
    
    return true;
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
  
  async connect(): Promise<void> {
    this._status = { connected: true, online: true, lastUpdate: Date.now() };
  }
  
  async disconnect(): Promise<void> {
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
      console.error('钱箱未连接');
      return false;
    }
    
    try {
      // ESC p m t1 t2 - 触发钱箱
      // m: 0-255 (通常用0)
      // t1, t2: 脉冲时间 (通常用 25, 250ms)
      const commands = [0x1B, 0x70, 0x00, 0x19, 0xFA];
      
      // 模拟打开
      this.isOpen = true;
      this._status.lastUpdate = Date.now();
      
      console.log('钱箱已打开');
      
      // 模拟钱箱打开动画（网页提示）
      this.showDrawerAnimation();
      
      return true;
    } catch (error) {
      console.error('钱箱打开失败:', error);
      return false;
    }
  }
  
  private showDrawerAnimation() {
    // 创建钱箱打开提示
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 32px;
      border-radius: 12px;
      font-size: 16px;
      z-index: 9999;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      animation: slideUp 0.5s ease;
    `;
    toast.innerHTML = '💰 钱箱已打开，请放入现金';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.5s ease';
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }
  
  /**
   * 检查钱箱状态（需要硬件支持）
   */
  async checkDrawerStatus(): Promise<CashDrawerStatus> {
    // 模拟检查
    return this.getStatus();
  }
}

// ============ 电子秤服务 ============
export class ScaleService extends POSDevice {
  private reading: ScaleReading = { weight: 0, unit: 'kg', stable: false, timestamp: 0 };
  private listeners: Set<(reading: ScaleReading) => void> = new Set();
  private simulationInterval: ReturnType<typeof setInterval> | null = null;
  
  async connect(): Promise<void> {
    this._status = { connected: true, online: true, lastUpdate: Date.now() };
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
   * 开始监听电子秤
   */
  async startListening(): Promise<void> {
    if (this.simulationInterval) return;
    
    // 模拟秤数据
    this.simulationInterval = setInterval(() => {
      // 模拟稳定读数
      const baseWeight = 0.5 + Math.random() * 2; // 0.5-2.5kg
      const noise = (Math.random() - 0.5) * 0.02; // ±10g 噪声
      this.reading = {
        weight: Math.round((baseWeight + noise) * 1000) / 1000,
        unit: 'kg',
        stable: true,
        timestamp: Date.now()
      };
      
      this._status.lastUpdate = Date.now();
      
      // 通知监听器
      this.listeners.forEach(listener => listener(this.reading));
    }, 500);
    
    this._status.online = true;
  }
  
  /**
   * 停止监听
   */
  stopListening(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
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
    this.reading.weight = 0;
    this.listeners.forEach(listener => listener(this.reading));
  }
  
  /**
   * 校准
   */
  calibrate(weight: number): void {
    console.log('电子秤校准:', weight, 'kg');
  }
}

// ============ 扫码枪/摄像头服务 ============
export class ScannerService extends POSDevice {
  private listeners: Set<(result: BarcodeScanResult) => void> = new Set();
  private cameraStream: MediaStream | null = null;
  
  async connect(): Promise<void> {
    this._status = { connected: true, online: true, lastUpdate: Date.now() };
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
      console.error('摄像头启动失败:', error);
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
   * 模拟扫码（手动输入）
   */
  simulateScan(barcode: string): void {
    const result: BarcodeScanResult = {
      barcode,
      format: 'EAN-13',
      timestamp: Date.now()
    };
    this.notifyListeners(result);
  }
  
  /**
   * 添加扫码结果监听器
   */
  addListener(callback: (result: BarcodeScanResult) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  private notifyListeners(result: BarcodeScanResult): void {
    this.listeners.forEach(listener => listener(result));
    this._status.lastUpdate = Date.now();
  }
}

// ============ 设备管理器 ============
export class POSDeviceManager {
  customerDisplay: CustomerDisplayService;
  receiptPrinter: ReceiptPrinterService;
  labelPrinter: LabelPrinterService;
  cashDrawer: CashDrawerService;
  scale: ScaleService;
  scanner: ScannerService;
  
  constructor() {
    this.customerDisplay = new CustomerDisplayService();
    this.receiptPrinter = new ReceiptPrinterService();
    this.labelPrinter = new LabelPrinterService();
    this.cashDrawer = new CashDrawerService();
    this.scale = ScaleService.prototype as any;
    this.scale = new ScaleService();
    this.scanner = new ScannerService();
  }
  
  /**
   * 初始化所有设备
   */
  async initializeAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    const devices = [
      ['customerDisplay', this.customerDisplay],
      ['receiptPrinter', this.receiptPrinter],
      ['labelPrinter', this.labelPrinter],
      ['cashDrawer', this.cashDrawer],
      ['scale', this.scale],
      ['scanner', this.scanner],
    ] as const;
    
    for (const [name, device] of devices) {
      try {
        await device.connect();
        results.set(name, device.status.connected);
      } catch (error) {
        console.error(`${name} 连接失败:`, error);
        results.set(name, false);
      }
    }
    
    return results;
  }
  
  /**
   * 获取所有设备状态
   */
  getAllStatus(): Record<string, DeviceStatus> {
    return {
      customerDisplay: this.customerDisplay.status,
      receiptPrinter: this.receiptPrinter.status,
      labelPrinter: this.labelPrinter.status,
      cashDrawer: this.cashDrawer.status,
      scale: this.scale.status,
      scanner: this.scanner.status,
    };
  }
  
  /**
   * 断开所有设备
   */
  async disconnectAll(): Promise<void> {
    await Promise.all([
      this.customerDisplay.disconnect(),
      this.receiptPrinter.disconnect(),
      this.labelPrinter.disconnect(),
      this.cashDrawer.disconnect(),
      this.scale.disconnect(),
      this.scanner.disconnect(),
    ]);
  }
}

// 导出单例
export const deviceManager = new POSDeviceManager();
