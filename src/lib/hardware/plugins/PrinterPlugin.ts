/**
 * 打印机插件 - PrinterPlugin
 * 提供打印机连接、小票打印、图片打印等功能
 * 支持ESC/POS指令的热敏打印机
 */

// WebUSB类型声明
declare global {
  interface Navigator {
    usb: USB;
  }
  interface USB {
    getDevices(): Promise<USBDevice[]>;
    requestDevice(options?: USBDeviceRequestOptions): Promise<USBDevice>;
  }
  interface USBDevice {
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
    clearHalt(direction: USBDirection, endpointNumber: number): Promise<void>;
    reset(): Promise<void>;
    vendorId: number;
    productId: number;
    deviceClass: number;
    deviceSubclass: number;
    deviceProtocol: number;
    vendorName?: string;
    productName?: string;
    serialNumber?: string;
    configuration?: USBConfiguration;
    configurations: USBConfiguration[];
    opened: boolean;
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
    direction: USBDirection;
    type: USBEndpointType;
    packetSize: number;
  }
  type USBDirection = 'in' | 'out';
  type USBEndpointType = 'bulk' | 'interrupt' | 'isochronous';
  interface USBControlTransferParameters {
    requestType: USBRequestType;
    recipient: USBRecipient;
    request: number;
    value: number;
    index: number;
  }
  type USBRequestType = 'standard' | 'class' | 'vendor';
  type USBRecipient = 'device' | 'interface' | 'endpoint' | 'other';
  interface USBInTransferResult {
    data?: DataView;
    status: USBTransferStatus;
  }
  interface USBOutTransferResult {
    bytesWritten: number;
    status: USBTransferStatus;
  }
  type USBTransferStatus = 'ok' | 'stall' | 'babble';
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
}

// 打印机对齐方式
export type PrintAlign = 'left' | 'center' | 'right';

// 打印机字体样式
export interface PrintStyle {
  bold?: boolean;
  underline?: boolean;
  doubleHeight?: boolean;
  doubleWidth?: boolean;
}

// 小票内容类型
export type PrintContentType = 'text' | 'barcode' | 'qrcode' | 'image' | 'line' | 'space';

// 小票行内容
export interface PrintLine {
  type: PrintContentType;
  content?: string;
  align?: PrintAlign;
  style?: PrintStyle;
  width?: number; // 用于条码
  height?: number; // 用于条码/图片
}

// 小票数据
export interface ReceiptData {
  title?: string;
  storeName?: string;
  orderId?: string;
  orderTime?: string;
  cashier?: string;
  customer?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    total?: number; // 小计（可选，兼容 subtotal）
    subtotal?: number; // 小计（兼容 total）
    unit?: string; // 单位（可选）
  }>;
  subtotal?: number;
  discount?: number;
  total?: number;
  paymentMethod?: string;
  change?: number;
  footer?: string | string[]; // 页脚，支持单个字符串或字符串数组
  barcode?: string;
}

// 打印机状态
export type PrinterStatus = 'idle' | 'printing' | 'error' | 'outOfPaper' | 'offline';

// 打印机事件类型
export type PrinterEventType = 'statusChange' | 'error' | 'complete';
export type PrinterEventCallback = (status?: PrinterStatus, error?: Error) => void;

// ESC/POS指令常量
const ESC = 0x1B;
const GS = 0x1D;

// 打印机插件类
class PrinterPlugin {
  private device: USBDevice | null = null;
  private isConnected: boolean = false;
  private status: PrinterStatus = 'idle';
  private eventListeners: Map<PrinterEventType, Set<PrinterEventCallback>> = new Map();
  private static instance: PrinterPlugin;

  // 58mm纸宽度字符数
  private static readonly LINE_WIDTH = 32;

  private constructor() {
    this.initEventListeners();
  }

  // 获取单例实例
  static getInstance(): PrinterPlugin {
    if (!PrinterPlugin.instance) {
      PrinterPlugin.instance = new PrinterPlugin();
    }
    return PrinterPlugin.instance;
  }

  // 初始化事件监听器
  private initEventListeners(): void {
    this.eventListeners.set('statusChange', new Set());
    this.eventListeners.set('error', new Set());
    this.eventListeners.set('complete', new Set());
  }

  // 添加事件监听
  on(event: PrinterEventType, callback: PrinterEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  // 移除事件监听
  off(event: PrinterEventType, callback: PrinterEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  // 触发事件
  private emit(event: PrinterEventType, status?: PrinterStatus, error?: Error): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(status, error);
        } catch (e) {
          console.error(`Error in printer ${event} listener:`, e);
        }
      });
    }
  }

  // 更新状态
  private setStatus(status: PrinterStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.emit('statusChange', status);
    }
  }

  // 检查支持
  isSupported(): boolean {
    return 'usb' in navigator || 'bluetooth' in navigator;
  }

  // 获取状态
  getStatus(): PrinterStatus {
    return this.status;
  }

  // 获取连接状态
  isReady(): boolean {
    return this.isConnected;
  }

  // 查找打印机
  async findPrinters(): Promise<Array<{ id: string; name: string }>> {
    const printers: Array<{ id: string; name: string }> = [];

    // WebUSB
    if ('usb' in navigator) {
      try {
        const devices = await (navigator as any).usb.getDevices();
        devices.forEach((device: USBDevice) => {
          const productName = device.productName || '';
          if (productName.toLowerCase().includes('print') || 
              productName.includes('打印机') ||
              device.vendorId.toString(16) === '04b8') { // Epson
            printers.push({
              id: device.serialNumber || `${device.vendorId}-${device.productId}`,
              name: productName || 'USB Printer',
            });
          }
        });
      } catch (error) {
        console.error('Error finding USB printers:', error);
      }
    }

    return printers;
  }

  // 连接打印机
  async connect(deviceId?: string): Promise<boolean> {
    if (!('usb' in navigator)) {
      this.emit('error', undefined, new Error('WebUSB not supported'));
      return false;
    }

    try {
      this.setStatus('idle');

      let device: USBDevice | null = null;

      if (deviceId) {
        // 连接到指定设备
        const devices = await (navigator as any).usb.getDevices();
        device = devices.find((d: USBDevice) => 
          (d.serialNumber || `${d.vendorId}-${d.productId}`) === deviceId
        );
      }

      if (!device) {
        // 请求选择设备
        device = await (navigator as any).usb.requestDevice({
          filters: [
            { vendorId: 0x04B8 }, // Epson
            { vendorId: 0x04A9 }, // Canon
            { vendorId: 0x0483 }, // STMicroelectronics (常见打印机芯片)
          ]
        });
      }

      if (!device) {
        throw new Error('No printer selected');
      }

      // 连接设备
      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      this.device = device;
      this.isConnected = true;

      console.log('Printer connected:', device.productName);
      return true;
    } catch (error) {
      this.setStatus('error');
      this.emit('error', undefined, error as Error);
      return false;
    }
  }

  // 断开连接
  async disconnect(): Promise<void> {
    if (this.device) {
      try {
        await this.device.close();
      } catch (error) {
        console.error('Error disconnecting printer:', error);
      }
      this.device = null;
    }
    this.isConnected = false;
    this.setStatus('idle');
  }

  // 发送原始数据
  private async sendData(data: Uint8Array): Promise<boolean> {
    if (!this.device || !this.isConnected) {
      console.error('Printer not connected');
      return false;
    }

    try {
      await this.device.transferOut(1, data.buffer as ArrayBuffer);
      return true;
    } catch (error) {
      console.error('Failed to send data to printer:', error);
      this.setStatus('error');
      return false;
    }
  }

  // 初始化打印机
  private initPrinter(): Uint8Array {
    const commands = new Uint8Array([
      ESC, 0x40, // 初始化打印机
    ]);
    return commands;
  }

  // 设置对齐
  private align(direction: PrintAlign): Uint8Array {
    const alignMap = { left: 0, center: 1, right: 2 };
    return new Uint8Array([ESC, 0x61, alignMap[direction]]);
  }

  // 设置字体样式
  private fontStyle(style: PrintStyle): Uint8Array {
    const commands: number[] = [];
    
    // 加粗
    commands.push(ESC, 0x45, style.bold ? 1 : 0);
    
    // 下划线
    commands.push(ESC, 0x2D, style.underline ? 1 : 0);
    
    // 字体大小
    const size = (style.doubleHeight ? 2 : 1) << 4 | (style.doubleWidth ? 2 : 1);
    commands.push(GS, 0x21, size);

    return new Uint8Array(commands);
  }

  // 打印文本行
  private printText(text: string, align: PrintAlign = 'left', style: PrintStyle = {}): Uint8Array {
    const commands: number[] = [];
    
    // 设置对齐
    commands.push(...this.align(align));
    
    // 设置字体
    commands.push(...this.fontStyle(style));
    
    // 文本内容
    const encoder = new TextEncoder();
    commands.push(...encoder.encode(text));
    
    // 换行
    commands.push(0x0A);

    return new Uint8Array(commands);
  }

  // 打印分隔线
  private printLine(char: string = '-'): Uint8Array {
    const line = char.repeat(PrinterPlugin.LINE_WIDTH);
    return this.printText(line, 'left', {});
  }

  // 打印空白行
  private printSpace(lines: number = 1): Uint8Array {
    return new Uint8Array(new Array(lines).fill(0x0A));
  }

  // 打印条码
  private printBarcode(data: string, width: number = 2, height: number = 60): Uint8Array {
    const commands: number[] = [];
    
    // 设置条码宽度
    commands.push(GS, 0x77, width);
    
    // 设置条码高度
    commands.push(GS, 0x68, height);
    
    // 打印条码 (CODE39)
    commands.push(GS, 0x6B, 0x04); // CODE39
    const encoder = new TextEncoder();
    commands.push(...encoder.encode(`$${data}$`));
    commands.push(0x00);

    return new Uint8Array(commands);
  }

  // 打印二维码
  private printQRCode(data: string, size: number = 6): Uint8Array {
    const commands: number[] = [];
    
    // 设置二维码大小
    commands.push(GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x49, 0x31, size);
    
    // 打印二维码
    commands.push(GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30);
    const encoder = new TextEncoder();
    commands.push(...encoder.encode(data));
    commands.push(0x00);

    return new Uint8Array(commands);
  }

  // 打印小票
  async printReceipt(receipt: ReceiptData): Promise<boolean> {
    if (!this.isConnected) {
      console.error('Printer not connected');
      return false;
    }

    this.setStatus('printing');

    try {
      const allCommands: number[] = [];

      // 初始化
      allCommands.push(...this.initPrinter());

      // 打印标题
      if (receipt.title) {
        allCommands.push(...this.printText(receipt.title, 'center', { bold: true, doubleHeight: true }));
      }

      // 打印店名
      if (receipt.storeName) {
        allCommands.push(...this.printText(receipt.storeName, 'center', { bold: true }));
      }

      allCommands.push(...this.printSpace(1));

      // 打印订单信息
      if (receipt.orderId) {
        allCommands.push(...this.printText(`单号: ${receipt.orderId}`));
      }
      if (receipt.orderTime) {
        allCommands.push(...this.printText(`时间: ${receipt.orderTime}`));
      }
      if (receipt.cashier) {
        allCommands.push(...this.printText(`收银: ${receipt.cashier}`));
      }
      if (receipt.customer) {
        allCommands.push(...this.printText(`顾客: ${receipt.customer}`));
      }

      allCommands.push(...this.printLine());
      allCommands.push(...this.printSpace(1));

      // 打印商品明细
      if (receipt.items && receipt.items.length > 0) {
        // 表头
        allCommands.push(...this.printText('商品名称        数   单价   小计'));
        allCommands.push(...this.printLine('-'));

        // 商品列表
        receipt.items.forEach(item => {
          const name = item.name.substring(0, 12);
          const qty = item.quantity.toString().padStart(2);
          const price = item.price.toFixed(2);
          const itemTotal = item.total ?? item.subtotal ?? (item.price * item.quantity);
          const total = itemTotal.toFixed(2);
          const line = `${name.padEnd(12)} ${qty} ${price.padStart(6)} ${total.padStart(7)}`;
          allCommands.push(...this.printText(line));
        });

        allCommands.push(...this.printLine());
        allCommands.push(...this.printSpace(1));
      }

      // 金额汇总
      if (receipt.subtotal !== undefined) {
        allCommands.push(...this.printText(`小计: ¥${receipt.subtotal.toFixed(2)}`, 'right'));
      }
      if (receipt.discount !== undefined && receipt.discount > 0) {
        allCommands.push(...this.printText(`优惠: -¥${receipt.discount.toFixed(2)}`, 'right'));
      }
      if (receipt.total !== undefined) {
        allCommands.push(...this.printText(`合计: ¥${receipt.total.toFixed(2)}`, 'right', { bold: true, doubleHeight: true }));
      }

      allCommands.push(...this.printSpace(1));

      // 支付信息
      if (receipt.paymentMethod) {
        allCommands.push(...this.printText(`支付方式: ${receipt.paymentMethod}`));
      }
      if (receipt.change !== undefined) {
        allCommands.push(...this.printText(`找零: ¥${receipt.change.toFixed(2)}`));
      }

      allCommands.push(...this.printSpace(1));
      allCommands.push(...this.printLine());

      // 页脚信息
      if (receipt.footer) {
        const footerLines = typeof receipt.footer === 'string' ? [receipt.footer] : receipt.footer;
        footerLines.forEach(line => {
          allCommands.push(...this.printText(line, 'center'));
        });
        allCommands.push(...this.printSpace(1));
      }

      // 打印条码
      if (receipt.barcode) {
        allCommands.push(...this.printSpace(1));
        allCommands.push(...this.printBarcode(receipt.barcode));
      }

      // 切纸
      allCommands.push(...this.printSpace(3));
      allCommands.push(GS, 0x56, 0x00); // 全切
      allCommands.push(ESC, 0x40); // 复位

      // 发送所有命令
      const result = await this.sendData(new Uint8Array(allCommands));

      if (result) {
        this.setStatus('idle');
        this.emit('complete');
      } else {
        this.setStatus('error');
      }

      return result;
    } catch (error) {
      console.error('Failed to print receipt:', error);
      this.setStatus('error');
      this.emit('error', undefined, error as Error);
      return false;
    }
  }

  // 打印文本内容
  async printContent(lines: PrintLine[]): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    this.setStatus('printing');

    try {
      const allCommands: number[] = [];
      allCommands.push(...this.initPrinter());

      for (const line of lines) {
        switch (line.type) {
          case 'text':
            allCommands.push(...this.printText(
              line.content || '',
              line.align || 'left',
              line.style || {}
            ));
            break;
          case 'line':
            allCommands.push(...this.printLine(line.content || '-'));
            break;
          case 'space':
            allCommands.push(...this.printSpace(line.height || 1));
            break;
          case 'barcode':
            allCommands.push(...this.printBarcode(
              line.content || '',
              line.width || 2,
              line.height || 60
            ));
            break;
          case 'qrcode':
            allCommands.push(...this.printQRCode(line.content || '', line.width || 6));
            break;
        }
      }

      // 切纸
      allCommands.push(...this.printSpace(3));
      allCommands.push(GS, 0x56, 0x00);

      const result = await this.sendData(new Uint8Array(allCommands));
      this.setStatus(result ? 'idle' : 'error');
      
      if (result) {
        this.emit('complete');
      }

      return result;
    } catch (error) {
      this.setStatus('error');
      this.emit('error', undefined, error as Error);
      return false;
    }
  }

  // 打开钱箱
  async openCashbox(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    // ESC/POS钱箱指令
    const commands = new Uint8Array([
      ESC, 0x70, 0x00, 0x19, 0xFA // 钱箱引脚2
    ]);

    return this.sendData(commands);
  }

  // 自检
  async selfTest(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    const commands = new Uint8Array([ESC, 0x40, 0x12]); // 初始化 + 自检

    return this.sendData(commands);
  }
}

// 导出单例和类
export const printerPlugin = PrinterPlugin.getInstance();
export { PrinterPlugin };
