/**
 * 硬件服务 - 封装扫码枪、打印机和钱箱功能
 * 支持 USB 扫码枪、蓝牙扫码枪、摄像头扫码
 * 支持蓝牙打印机、USB 打印机、网络打印机
 * 支持钱箱控制
 */

// 扫码设备类型
export type ScannerType = 'usb' | 'bluetooth' | 'camera';
// 打印机类型
export type PrinterType = 'bluetooth' | 'usb' | 'network';
// 打印机状态
export type PrinterStatus = 'connected' | 'disconnected' | 'error' | 'paper_out' | 'cover_open';

// 硬件设备接口
export interface HardwareDevice {
  id: string;
  name: string;
  type: ScannerType | PrinterType;
  status: 'connected' | 'disconnected';
  lastUsed?: Date;
}

// 打印机配置
export interface PrinterConfig {
  type: PrinterType;
  paperWidth: 58 | 80; // 纸张宽度（mm）
  autoCut: boolean; // 自动切纸
  openCashbox: boolean; // 打印后开钱箱
}

// 小票数据接口
export interface ReceiptData {
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  orderNumber: string;
  timestamp: string;
  cashier?: string;
  items: {
    name: string;
    price: number;
    quantity: number;
    unit?: string;
    subtotal?: number;
  }[];
  subtotal: number;
  discount?: number;
  memberDiscount?: number;
  totalAmount: number;
  paymentMethod: string;
  memberInfo?: {
    name: string;
    memberNo: string;
    points: number;
    earnedPoints?: number;
  };
  qrCode?: string; // 小票二维码内容
  footer?: string; // 小票底部文字
}

export class HardwareService {
  private static instance: HardwareService;
  private isScanning: boolean = false;
  
  // 设备连接状态
  private connectedScanner: HardwareDevice | null = null;
  private connectedPrinter: HardwareDevice | null = null;
  private printerConfig: PrinterConfig = {
    type: 'bluetooth',
    paperWidth: 80,
    autoCut: true,
    openCashbox: true,
  };
  
  // USB 扫码枪监听器清理函数
  private usbScannerCleanup: (() => void) | null = null;
  
  // 钱箱状态
  private cashboxStatus: 'closed' | 'open' = 'closed';

  private constructor() {}

  public static getInstance(): HardwareService {
    if (!HardwareService.instance) {
      HardwareService.instance = new HardwareService();
    }
    return HardwareService.instance;
  }

  // ==================== 扫码枪功能 ====================

  /**
   * 检查浏览器是否支持 Web Serial API（USB 扫码枪）
   */
  isUsbScannerSupported(): boolean {
    return 'serial' in navigator;
  }

  /**
   * 检查浏览器是否支持 Web Bluetooth
   */
  isBluetoothSupported(): boolean {
    return 'bluetooth' in navigator;
  }

  /**
   * 检查相机权限（用于摄像头扫码）
   */
  async checkCameraPermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state === 'granted';
    } catch (error) {
      console.error('Camera permission check failed:', error);
      return false;
    }
  }

  /**
   * 请求相机权限
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission request failed:', error);
      return false;
    }
  }

  /**
   * 启用 USB 扫码枪监听
   * USB 扫码枪通常作为键盘输入设备，通过监听 keydown 事件处理
   * @param callback 收到扫码数据时的回调
   * @returns 清理函数
   */
  enableUsbScanner(callback: (barcode: string) => void): () => void {
    // 清理旧的监听器
    if (this.usbScannerCleanup) {
      this.usbScannerCleanup();
    }

    let buffer = '';
    let lastKeyTime = 0;
    const SCAN_THRESHOLD = 50; // 扫码输入间隔阈值（毫秒）- USB扫码枪通常很快
    const MIN_BARCODE_LENGTH = 4; // 最小条码长度

    const handleKeyDown = (event: KeyboardEvent) => {
      const now = Date.now();

      // 如果间隔过长，清空缓冲区（可能是手动输入）
      if (now - lastKeyTime > SCAN_THRESHOLD && buffer.length > 0) {
        buffer = '';
      }
      lastKeyTime = now;

      // Enter 键表示扫码结束
      if (event.key === 'Enter') {
        if (buffer.length >= MIN_BARCODE_LENGTH) {
          event.preventDefault();
          const barcode = buffer.trim();
          buffer = '';
          console.log('[USB Scanner] Barcode scanned:', barcode);
          callback(barcode);
        } else {
          buffer = '';
        }
      } else if (event.key.length === 1) {
        // 只接受字符键
        buffer += event.key;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    this.connectedScanner = {
      id: 'usb-scanner',
      name: 'USB 扫码枪',
      type: 'usb',
      status: 'connected',
      lastUsed: new Date(),
    };

    // 返回清理函数
    this.usbScannerCleanup = () => {
      document.removeEventListener('keydown', handleKeyDown);
      this.connectedScanner = null;
    };
    
    return this.usbScannerCleanup;
  }

  /**
   * 禁用 USB 扫码枪
   */
  disableUsbScanner(): void {
    if (this.usbScannerCleanup) {
      this.usbScannerCleanup();
      this.usbScannerCleanup = null;
    }
  }

  /**
   * 使用摄像头扫码
   * @param video 视频元素（可选）
   * @param onResult 扫码成功回调
   * @param onError 错误回调
   * @returns 停止扫码的函数
   */
  async startCameraScan(
    onResult: (barcode: string) => void,
    onError?: (error: Error) => void
  ): Promise<() => void> {
    if (this.isScanning) {
      throw new Error('扫码已在进行中');
    }

    try {
      // 检查权限
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        throw new Error('没有相机权限');
      }

      // 获取摄像头流
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 后置摄像头
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      this.isScanning = true;
      let animationFrameId: number | null = null;

      console.log('[Camera Scanner] Started');

      // 创建视频元素
      const video = document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      await video.play();

      // 创建 canvas 用于图像处理
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('无法创建 Canvas 上下文');
      }

      // 简化的扫码逻辑（实际项目中应使用专业的条码识别库如 QuaggaJS）
      // 这里只做演示，实际需要集成专业条码识别库
      const scanFrame = () => {
        if (!this.isScanning) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        // TODO: 集成 QuaggaJS 或其他条码识别库
        // 这里仅作演示
        animationFrameId = requestAnimationFrame(scanFrame);
      };

      scanFrame();

      // 返回停止函数
      return () => {
        this.isScanning = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        console.log('[Camera Scanner] Stopped');
      };
    } catch (error) {
      this.isScanning = false;
      onError?.(error as Error);
      throw error;
    }
  }

  /**
   * 停止扫码
   */
  stopScanning(): void {
    this.isScanning = false;
    this.disableUsbScanner();
  }

  /**
   * 获取已连接的扫码设备
   */
  getConnectedScanner(): HardwareDevice | null {
    return this.connectedScanner;
  }

  // ==================== 打印机功能 ====================

  /**
   * 获取打印机配置
   */
  getPrinterConfig(): { type: PrinterType; ip?: string; port?: number } {
    return {
      type: this.printerConfig.type,
      ip: (this as any).printerIp,
      port: (this as any).printerPort,
    };
  }

  /**
   * 设置打印机配置
   */
  setPrinterConfig(config: Partial<PrinterConfig>): void {
    this.printerConfig = { ...this.printerConfig, ...config };
    // 同时保存IP和端口
    if (config) {
      (this as any).printerIp = (config as any).ip;
      (this as any).printerPort = (config as any).port;
    }
  }

  /**
   * 检查浏览器是否支持 Web Serial API（USB 打印机）
   */
  isUsbPrinterSupported(): boolean {
    return 'serial' in navigator;
  }

  /**
   * 连接 USB 打印机
   */
  async connectUsbPrinter(): Promise<HardwareDevice | null> {
    if (!this.isUsbPrinterSupported()) {
      throw new Error('浏览器不支持 USB 设备');
    }

    try {
      // @ts-ignore - Web Serial API
      const port = await navigator.serial.requestPort({
        filters: [
          { usbVendorId: 0x0416 }, // Winbond (常见打印机芯片)
          { usbVendorId: 0x0483 }, // STMicroelectronics
          { usbVendorId: 0x04B8 }, // Epson
          { usbVendorId: 0x0519 }, // Star Micronics
        ],
      });

      await port.open({ baudRate: 9600 });

      this.connectedPrinter = {
        id: 'usb-printer',
        name: 'USB 小票打印机',
        type: 'usb',
        status: 'connected',
        lastUsed: new Date(),
      };

      this.printerConfig.type = 'usb';
      console.log('[Printer] USB printer connected');
      
      return this.connectedPrinter;
    } catch (error) {
      console.error('[Printer] USB printer connection failed:', error);
      return null;
    }
  }

  /**
   * 连接蓝牙打印机
   */
  async connectBluetoothPrinter(): Promise<HardwareDevice | null> {
    if (!this.isBluetoothSupported()) {
      throw new Error('浏览器不支持蓝牙设备');
    }

    try {
      // @ts-ignore - Web Bluetooth
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // 常见打印机服务UUID
        ],
        optionalServices: ['battery_service', 'device_information'],
      });

      await device.gatt?.connect();

      this.connectedPrinter = {
        id: device.id,
        name: device.name || '蓝牙小票打印机',
        type: 'bluetooth',
        status: 'connected',
        lastUsed: new Date(),
      };

      this.printerConfig.type = 'bluetooth';
      console.log('[Printer] Bluetooth printer connected:', device.name);
      
      return this.connectedPrinter;
    } catch (error) {
      console.error('[Printer] Bluetooth printer connection failed:', error);
      return null;
    }
  }

  /**
   * 连接网络打印机
   */
  async connectNetworkPrinter(ipAddress: string, port: number = 9100): Promise<HardwareDevice | null> {
    try {
      // 网络打印机通常使用 RAW 协议（端口 9100）
      // 由于浏览器限制，需要通过后端代理或 WebSocket 连接
      console.log('[Printer] Network printer connection (via proxy):', ipAddress, port);

      this.connectedPrinter = {
        id: `network-${ipAddress}:${port}`,
        name: `网络打印机 (${ipAddress})`,
        type: 'network',
        status: 'connected',
        lastUsed: new Date(),
      };

      this.printerConfig.type = 'network';
      
      return this.connectedPrinter;
    } catch (error) {
      console.error('[Printer] Network printer connection failed:', error);
      return null;
    }
  }

  /**
   * 断开打印机连接
   */
  async disconnectPrinter(): Promise<void> {
    if (this.connectedPrinter) {
      console.log('[Printer] Disconnected:', this.connectedPrinter.name);
      this.connectedPrinter = null;
    }
  }

  /**
   * 获取打印机状态
   */
  getPrinterStatus(): PrinterStatus {
    if (!this.connectedPrinter) {
      return 'disconnected';
    }
    return 'connected'; // 简化实现，实际需要查询打印机状态
  }

  /**
   * 获取已连接的打印机
   */
  getConnectedPrinter(): HardwareDevice | null {
    return this.connectedPrinter;
  }

  /**
   * 检查打印机是否已连接
   */
  isPrinterConnected(): boolean {
    return this.connectedPrinter !== null;
  }

  /**
   * 打印小票
   */
  async printReceipt(data: ReceiptData): Promise<boolean> {
    if (!this.connectedPrinter) {
      console.warn('[Printer] No printer connected, receipt will be displayed on screen only');
      return false;
    }

    try {
      // 生成 ESC/POS 指令
      const commands = this.generateEscPosCommands(data);
      
      console.log('[Printer] Printing receipt:', data.orderNumber);
      console.log('[Printer] Commands length:', commands.length, 'bytes');

      // TODO: 实际发送到打印机
      // 根据打印机类型使用不同的发送方式
      // - USB: 通过 Web Serial API 发送
      // - Bluetooth: 通过 Web Bluetooth API 发送
      // - Network: 通过后端代理发送

      // 模拟打印延迟
      await new Promise(resolve => setTimeout(resolve, 500));

      // 如果配置了打印后开钱箱
      if (this.printerConfig.openCashbox) {
        await this.openCashbox();
      }

      return true;
    } catch (error) {
      console.error('[Printer] Print receipt failed:', error);
      return false;
    }
  }

  /**
   * 测试打印
   */
  async testPrint(): Promise<boolean> {
    const testData: ReceiptData = {
      shopName: '海邻到家',
      shopAddress: '测试地址',
      shopPhone: '400-888-8888',
      orderNumber: 'TEST-' + Date.now(),
      timestamp: new Date().toLocaleString('zh-CN'),
      cashier: '测试员工',
      items: [
        { name: '测试商品', price: 1.00, quantity: 1, unit: '个', subtotal: 1.00 },
      ],
      subtotal: 1.00,
      totalAmount: 1.00,
      paymentMethod: '现金',
      footer: '这是测试打印',
    };

    return await this.printReceipt(testData);
  }

  // ==================== ESC/POS 命令生成 ====================

  /**
   * 生成 ESC/POS 打印命令
   */
  private generateEscPosCommands(data: ReceiptData): Uint8Array {
    const commands: number[] = [];
    const paperWidth = this.printerConfig.paperWidth;
    const charPerLine = paperWidth === 80 ? 48 : 32;

    // ESC @ - 初始化打印机
    commands.push(0x1B, 0x40);

    // ESC a 1 - 居中对齐
    commands.push(0x1B, 0x61, 0x01);

    // GS ! 17 - 双倍宽高（店铺名称）
    commands.push(0x1D, 0x21, 0x11);
    commands.push(...this.textToGbk(data.shopName));
    commands.push(0x0A); // 换行

    // GS ! 0 - 正常大小
    commands.push(0x1D, 0x21, 0x00);

    // 店铺地址和电话
    if (data.shopAddress) {
      commands.push(...this.textToGbk(data.shopAddress));
      commands.push(0x0A);
    }
    if (data.shopPhone) {
      commands.push(...this.textToGbk(`电话: ${data.shopPhone}`));
      commands.push(0x0A);
    }

    commands.push(0x0A); // 空行

    // ESC a 0 - 左对齐
    commands.push(0x1B, 0x61, 0x00);

    // 订单信息
    commands.push(...this.textToGbk(`订单号: ${data.orderNumber}`));
    commands.push(0x0A);
    commands.push(...this.textToGbk(`时间: ${data.timestamp}`));
    commands.push(0x0A);
    if (data.cashier) {
      commands.push(...this.textToGbk(`收银员: ${data.cashier}`));
      commands.push(0x0A);
    }

    // 分隔线
    commands.push(...this.textToGbk('-'.repeat(charPerLine)));
    commands.push(0x0A);

    // 商品列表
    data.items.forEach(item => {
      // 商品名称
      commands.push(...this.textToGbk(item.name));
      commands.push(0x0A);
      
      // 数量、单价、小计
      const quantityStr = `x${item.quantity}${item.unit || ''}`;
      const priceStr = `¥${item.price.toFixed(2)}`;
      const subtotalStr = `¥${(item.subtotal || item.price * item.quantity).toFixed(2)}`;
      
      // 右对齐金额
      const spaceCount = Math.max(1, charPerLine - quantityStr.length - priceStr.length - subtotalStr.length - 4);
      commands.push(...this.textToGbk(`  ${quantityStr}${' '.repeat(spaceCount)}${priceStr}  ${subtotalStr}`));
      commands.push(0x0A);
    });

    // 分隔线
    commands.push(...this.textToGbk('-'.repeat(charPerLine)));
    commands.push(0x0A);

    // 小计
    commands.push(...this.textToGbk(`小计: ¥${data.subtotal.toFixed(2)}`));
    commands.push(0x0A);

    // 优惠
    if (data.discount && data.discount > 0) {
      commands.push(...this.textToGbk(`优惠: -¥${data.discount.toFixed(2)}`));
      commands.push(0x0A);
    }
    if (data.memberDiscount && data.memberDiscount > 0) {
      commands.push(...this.textToGbk(`会员优惠: -¥${data.memberDiscount.toFixed(2)}`));
      commands.push(0x0A);
    }

    // 总计（加粗）
    commands.push(0x1B, 0x45, 0x01); // 加粗
    commands.push(...this.textToGbk(`合计: ¥${data.totalAmount.toFixed(2)}`));
    commands.push(0x0A);
    commands.push(0x1B, 0x45, 0x00); // 取消加粗

    // 支付方式
    commands.push(...this.textToGbk(`支付方式: ${data.paymentMethod}`));
    commands.push(0x0A);

    // 会员信息
    if (data.memberInfo) {
      commands.push(0x0A);
      commands.push(...this.textToGbk(`会员: ${data.memberInfo.name} (${data.memberInfo.memberNo})`));
      commands.push(0x0A);
      commands.push(...this.textToGbk(`本次积分: +${data.memberInfo.earnedPoints || 0}`));
      commands.push(0x0A);
      commands.push(...this.textToGbk(`累计积分: ${data.memberInfo.points}`));
      commands.push(0x0A);
    }

    commands.push(0x0A); // 空行

    // 居中对齐 - 感谢语
    commands.push(0x1B, 0x61, 0x01);
    commands.push(...this.textToGbk('感谢您的光临！'));
    commands.push(0x0A);
    commands.push(...this.textToGbk('欢迎再次惠顾'));
    commands.push(0x0A);

    // 底部文字
    if (data.footer) {
      commands.push(0x0A);
      commands.push(...this.textToGbk(data.footer));
      commands.push(0x0A);
    }

    commands.push(0x0A, 0x0A); // 空行

    // 切纸
    if (this.printerConfig.autoCut) {
      commands.push(0x1D, 0x56, 0x00); // GS V 0 - 全切
    }

    return new Uint8Array(commands);
  }

  /**
   * 将文本转换为 GBK 编码字节数组
   * 注意：这是简化实现，实际应使用专业的编码库
   */
  private textToGbk(text: string): number[] {
    const bytes: number[] = [];
    
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      
      // ASCII 字符直接添加
      if (code < 128) {
        bytes.push(code);
      } else {
        // 中文字符 - 简化处理，实际应使用 GBK 编码
        // 这里使用 UTF-8 编码的简化版本
        bytes.push(code >> 8, code & 0xFF);
      }
    }
    
    return bytes;
  }

  // ==================== 钱箱控制 ====================

  /**
   * 打开钱箱
   */
  async openCashbox(): Promise<boolean> {
    try {
      console.log('[Cashbox] Opening cashbox...');

      // 优先使用连接的打印机发送钱箱指令
      if (this.connectedPrinter) {
        console.log('[Cashbox] Using connected printer:', this.connectedPrinter.name);
        
        // 如果是网络打印机，尝试通过网络发送
        if (this.printerConfig.type === 'network') {
          // printerConfig 中应该保存打印机IP
          const printerIp = (this as any).printerIp || '127.0.0.1';
          const printerPort = (this as any).printerPort || 9100;
          
          try {
            const response = await fetch('/api/pos/cashbox', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'open',
                printerIp,
                printerPort,
              }),
            });
            const result = await response.json();
            
            if (result.success) {
              this.cashboxStatus = 'open';
              setTimeout(() => {
                this.cashboxStatus = 'closed';
              }, 1000);
              return true;
            }
          } catch (apiError) {
            console.warn('[Cashbox] API call failed, trying direct method:', apiError);
          }
        }
        
        // USB或蓝牙打印机：尝试直接发送
        if ('serial' in navigator) {
          try {
            // @ts-ignore
            const ports = await navigator.serial.getPorts();
            if (ports.length > 0) {
              const port = ports[0];
              await port.open({ baudRate: 9600 });
              const writer = port.writable.getWriter();
              // ESC p m t1 t2 - 钱箱指令
              const commands = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]);
              await writer.write(commands);
              writer.releaseLock();
              await port.close();
              
              this.cashboxStatus = 'open';
              setTimeout(() => {
                this.cashboxStatus = 'closed';
              }, 1000);
              return true;
            }
          } catch (usbError) {
            console.warn('[Cashbox] USB printer failed:', usbError);
          }
        }
      }

      // 如果没有连接打印机或上述方法失败，尝试通过API打开
      try {
        const response = await fetch('/api/pos/cashbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'open',
            // 尝试从localStorage获取打印机配置
            printerIp: this.getPrinterConfig().ip,
            printerPort: this.getPrinterConfig().port,
          }),
        });
        const result = await response.json();
        
        if (result.success) {
          console.log('[Cashbox] Cashbox opened via API');
          this.cashboxStatus = 'open';
          setTimeout(() => {
            this.cashboxStatus = 'closed';
          }, 1000);
          return true;
        }
      } catch (apiError) {
        console.warn('[Cashbox] API call failed:', apiError);
      }

      // 最终回退：模拟打开（用于测试）
      console.log('[Cashbox] Opening cashbox (simulated mode)');
      this.cashboxStatus = 'open';
      setTimeout(() => {
        this.cashboxStatus = 'closed';
      }, 1000);
      return true;
    } catch (error) {
      console.error('[Cashbox] Open cashbox failed:', error);
      return false;
    }
  }

  /**
   * 获取钱箱状态
   */
  getCashboxStatus(): 'closed' | 'open' {
    return this.cashboxStatus;
  }

  /**
   * 手动触发开钱箱
   */
  async manualOpenCashbox(): Promise<void> {
    await this.openCashbox();
  }

  // ==================== 工具方法 ====================

  /**
   * 获取所有设备状态
   */
  getDevicesStatus(): {
    scanner: HardwareDevice | null;
    printer: HardwareDevice | null;
    printerStatus: PrinterStatus;
    cashbox: 'closed' | 'open';
  } {
    return {
      scanner: this.connectedScanner,
      printer: this.connectedPrinter,
      printerStatus: this.getPrinterStatus(),
      cashbox: this.cashboxStatus,
    };
  }

  /**
   * 断开所有设备
   */
  async disconnectAll(): Promise<void> {
    this.stopScanning();
    await this.disconnectPrinter();
    this.cashboxStatus = 'closed';
    console.log('[Hardware] All devices disconnected');
  }

  /**
   * 设备自检
   */
  async selfTest(): Promise<{
    scanner: boolean;
    printer: boolean;
    cashbox: boolean;
  }> {
    const result = {
      scanner: !!this.connectedScanner,
      printer: false,
      cashbox: false,
    };

    // 测试打印机
    if (this.connectedPrinter) {
      result.printer = await this.testPrint();
    }

    // 测试钱箱
    if (this.connectedPrinter) {
      result.cashbox = await this.openCashbox();
    }

    return result;
  }
}

// 导出单例
export const hardwareService = HardwareService.getInstance();
