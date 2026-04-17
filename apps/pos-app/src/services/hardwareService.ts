/**
 * 海邻到家 - 硬件服务总模块
 * 
 * 支持设备：
 * - 电子秤（串口）
 * - AI 摄像头（USB）
 * - 小票打印机（串口/USB）
 * - 标签打印机（USB/蓝牙）
 * - 钱箱（串口/USB）
 * - 分屏显示（客显屏）
 */

import { electronScaleService, electronCameraService, type ScaleReading } from './electronAPI';

// ============ 类型定义 ============

export interface PrinterDevice {
  name: string;
  type: 'receipt' | 'label';
  connection: 'usb' | 'serial' | 'bluetooth' | 'network';
  status: 'online' | 'offline' | 'error';
  info?: Record<string, any>;
}

export interface CashDrawerStatus {
  open: boolean;
  reason?: string;
}

export interface CustomerDisplayInfo {
  total: number;
  change: number;
  productCount: number;
  message?: string;
}

export interface HardwareStatus {
  scale: boolean;
  camera: boolean;
  receiptPrinter: boolean;
  labelPrinter: boolean;
  cashDrawer: boolean;
  customerDisplay: boolean;
}

// ============ 小票打印服务 ============

class ReceiptPrinterService {
  private connected: boolean = false;
  private device: PrinterDevice | null = null;

  /**
   * 打印小票
   * @param content 小票内容对象
   */
  async print(content: {
    storeName: string;
    orderNo: string;
    date: string;
    items: Array<{
      name: string;
      qty: number;
      price: number;
      total: number;
    }>;
    total: number;
    paymentMethod: string;
    cashier: string;
    qrCode?: string;
  }): Promise<boolean> {
    if (!this.connected) {
      console.warn('[ReceiptPrinter] 打印机未连接');
      return false;
    }

    try {
      // 构建 ESC/POS 指令
      const commands = this.buildReceiptCommands(content);
      
      // 通过 Electron API 发送打印
      const api = (window as any).electronAPI;
      if (api) {
        await api.printReceipt(commands);
      } else {
        // 模拟打印
        console.log('[ReceiptPrinter] 模拟打印:', content);
      }
      
      return true;
    } catch (err) {
      console.error('[ReceiptPrinter] 打印失败:', err);
      return false;
    }
  }

  private buildReceiptCommands(content: any): number[] {
    const ESC = 0x1B;
    const GS = 0x1D;
    const commands: number[] = [];

    // 初始化打印机
    commands.push(ESC, 0x40);

    // 设置居中
    commands.push(ESC, 0x61, 0x01);

    // 放大字体 (2x2)
    commands.push(GS, 0x21, 0x11);
    commands.push(...this.textToBytes(content.storeName));
    commands.push(0x0A);
    
    // 恢复正常字体
    commands.push(GS, 0x21, 0x00);

    // 设置左对齐
    commands.push(ESC, 0x61, 0x00);

    // 订单号
    commands.push(...this.textToBytes(`单号: ${content.orderNo}`));
    commands.push(0x0A);
    
    // 日期
    commands.push(...this.textToBytes(`时间: ${content.date}`));
    commands.push(0x0A);

    // 分隔线
    commands.push(...this.textToBytes('--------------------------------'));
    commands.push(0x0A);

    // 商品明细
    for (const item of content.items) {
      const line = `${item.name.padEnd(10)} x${item.qty}  ¥${item.total.toFixed(2)}`;
      commands.push(...this.textToBytes(line));
      commands.push(0x0A);
    }

    // 分隔线
    commands.push(...this.textToBytes('--------------------------------'));
    commands.push(0x0A);

    // 总计（放大）
    commands.push(GS, 0x21, 0x10);
    commands.push(...this.textToBytes(`合计: ¥${content.total.toFixed(2)}`));
    commands.push(0x0A);
    commands.push(GS, 0x21, 0x00);

    // 支付方式
    commands.push(...this.textToBytes(`支付: ${content.paymentMethod}`));
    commands.push(0x0A);

    // 收款员
    commands.push(...this.textToBytes(`收银: ${content.cashier}`));
    commands.push(0x0A);

    // 二维码（如果有）
    if (content.qrCode) {
      commands.push(...this.textToBytes(' '));
      commands.push(0x0A);
      // 二维码命令
      commands.push(GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x41, 0x32, 0x00);
    }

    // 切纸
    commands.push(GS, 0x56, 0x00);

    return commands;
  }

  private textToBytes(text: string): number[] {
    return text.split('').map(c => c.charCodeAt(0));
  }

  /**
   * 打印测试页
   */
  async printTest(): Promise<boolean> {
    return this.print({
      storeName: '海邻到家便利店',
      orderNo: 'TEST' + Date.now(),
      date: new Date().toLocaleString('zh-CN'),
      items: [
        { name: '测试商品', qty: 1, price: 9.99, total: 9.99 }
      ],
      total: 9.99,
      paymentMethod: '测试',
      cashier: '系统'
    });
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * 设置连接状态
   */
  setConnected(connected: boolean, device?: PrinterDevice): void {
    this.connected = connected;
    this.device = device || null;
  }
}

// ============ 标签打印服务 ============

class LabelPrinterService {
  private connected: boolean = false;
  private device: PrinterDevice | null = null;

  /**
   * 打印商品标签
   * @param labels 标签数组
   */
  async printLabels(labels: Array<{
    name: string;
    barcode: string;
    price: number;
    unit?: string;
    date?: string;
  }>): Promise<boolean> {
    if (!this.connected) {
      console.warn('[LabelPrinter] 标签打印机未连接');
      return false;
    }

    try {
      // 构建标签指令（TSC指令集）
      const commands = this.buildLabelCommands(labels);
      
      const api = (window as any).electronAPI;
      if (api) {
        await api.printLabel(commands);
      } else {
        console.log('[LabelPrinter] 模拟打印标签:', labels);
      }
      
      return true;
    } catch (err) {
      console.error('[LabelPrinter] 打印失败:', err);
      return false;
    }
  }

  private buildLabelCommands(labels: any[]): number[] {
    const commands: number[] = [];
    
    // TSC 命令前缀
    const SIZE = '40,30';  // 标签尺寸 40x30mm
    const GAP = '2,0';     // 间隙

    for (const label of labels) {
      // 设置标签尺寸
      commands.push(...this.strToBytes(`SIZE ${SIZE}\r\n`));
      // 设置间隙
      commands.push(...this.strToBytes(`GAP ${GAP}\r\n`));
      // 清除缓存
      commands.push(...this.strToBytes('CLS\r\n'));
      
      // 商品名称
      commands.push(...this.strToBytes(`TEXT 50,10,"3",0,1,1,"${label.name}"\r\n`));
      
      // 条码
      commands.push(...this.strToBytes(`BARCODE 50,40,"128",50,1,0,2,2,"${label.barcode}"\r\n`));
      
      // 价格
      const priceText = `¥${label.price.toFixed(2)}`;
      commands.push(...this.strToBytes(`TEXT 50,100,"4",0,2,2,"${priceText}"\r\n`));
      
      // 日期（如果有）
      if (label.date) {
        commands.push(...this.strToBytes(`TEXT 50,130,"2",0,1,1,"${label.date}"\r\n`));
      }
      
      // 打印
      commands.push(...this.strToBytes('PRINT 1\r\n'));
    }

    return commands;
  }

  private strToBytes(str: string): number[] {
    return str.split('').map(c => c.charCodeAt(0));
  }

  /**
   * 打印价格标签（快捷）
   */
  async printPriceTag(name: string, price: number, barcode: string): Promise<boolean> {
    return this.printLabels([{
      name,
      barcode,
      price,
      date: new Date().toLocaleDateString('zh-CN')
    }]);
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * 设置连接状态
   */
  setConnected(connected: boolean, device?: PrinterDevice): void {
    this.connected = connected;
    this.device = device || null;
  }
}

// ============ 钱箱服务 ============

class CashDrawerService {
  private connected: boolean = false;

  /**
   * 打开钱箱
   */
  async open(reason: 'sale' | 'manual' | 'shift' = 'sale'): Promise<boolean> {
    try {
      // ESC/POS 钱箱打开指令
      const commands = [0x1B, 0x70, 0x00, 0x19, 0xFA];
      
      const api = (window as any).electronAPI;
      if (api) {
        await api.openCashDrawer(commands);
        console.log('[CashDrawer] 钱箱已打开');
        return true;
      } else {
        console.log('[CashDrawer] 模拟打开钱箱');
        return true;
      }
    } catch (err) {
      console.error('[CashDrawer] 打开失败:', err);
      return false;
    }
  }

  /**
   * 获取钱箱状态
   */
  getStatus(): CashDrawerStatus {
    // 钱箱状态需要硬件支持检测
    // 这里返回模拟状态
    return {
      open: false,
      reason: 'ready'
    };
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.connected;
  }
}

// ============ 客显屏服务 ============

class CustomerDisplayService {
  private connected: boolean = false;
  private display: Electron.CustomerDisplay | null = null;

  /**
   * 初始化客显屏
   */
  async init(): Promise<boolean> {
    try {
      const api = (window as any).electronAPI;
      if (api && api.initCustomerDisplay) {
        this.display = await api.initCustomerDisplay();
        this.connected = true;
      } else {
        console.log('[CustomerDisplay] 模拟客显屏');
        this.connected = true; // 模拟连接
      }
      return true;
    } catch (err) {
      console.error('[CustomerDisplay] 初始化失败:', err);
      return false;
    }
  }

  /**
   * 显示商品总价
   */
  async showTotal(total: number, productCount: number): Promise<void> {
    if (!this.connected) return;
    
    const api = (window as any).electronAPI;
    if (api && api.updateCustomerDisplay) {
      await api.updateCustomerDisplay({
        line1: `总计: ¥${total.toFixed(2)}`,
        line2: `共 ${productCount} 件商品`,
        line3: '请付款',
        line4: ''
      });
    } else {
      console.log(`[CustomerDisplay] 总计: ¥${total.toFixed(2)}, 件数: ${productCount}`);
    }
  }

  /**
   * 显示找零
   */
  async showChange(change: number): Promise<void> {
    if (!this.connected) return;
    
    const api = (window as any).electronAPI;
    if (api && api.updateCustomerDisplay) {
      await api.updateCustomerDisplay({
        line1: '交易完成',
        line2: `找零: ¥${change.toFixed(2)}`,
        line3: '谢谢惠顾',
        line4: ''
      });
    } else {
      console.log(`[CustomerDisplay] 找零: ¥${change.toFixed(2)}`);
    }
  }

  /**
   * 显示自定义信息
   */
  async showMessage(message: string, subMessage?: string): Promise<void> {
    if (!this.connected) return;
    
    const api = (window as any).electronAPI;
    if (api && api.updateCustomerDisplay) {
      await api.updateCustomerDisplay({
        line1: message,
        line2: subMessage || '',
        line3: '',
        line4: ''
      });
    }
  }

  /**
   * 清屏
   */
  async clear(): Promise<void> {
    if (!this.connected) return;
    
    const api = (window as any).electronAPI;
    if (api && api.updateCustomerDisplay) {
      await api.updateCustomerDisplay({
        line1: '欢迎光临',
        line2: '请扫描商品',
        line3: '',
        line4: ''
      });
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.connected;
  }
}

// ============ 分屏管理 ============

class MultiDisplayService {
  private mainWindow: Electron.BrowserWindow | null = null;
  private customerWindow: Electron.BrowserWindow | null = null;

  /**
   * 初始化分屏
   */
  async init(): Promise<boolean> {
    try {
      const api = (window as any).electronAPI;
      if (api && api.initMultiDisplay) {
        const displays = await api.initMultiDisplay();
        console.log('[MultiDisplay] 检测到显示器:', displays.length);
        return displays.length >= 2;
      } else {
        console.log('[MultiDisplay] 模拟分屏模式');
        return true;
      }
    } catch (err) {
      console.error('[MultiDisplay] 初始化失败:', err);
      return false;
    }
  }

  /**
   * 获取显示器列表
   */
  async getDisplays(): Promise<Array<{ id: number; name: string; bounds: any }>> {
    const api = (window as any).electronAPI;
    if (api && api.getDisplays) {
      return api.getDisplays();
    }
    return [{ id: 1, name: '主屏', bounds: { width: 1280, height: 800 } }];
  }

  /**
   * 打开客显屏窗口
   */
  async openCustomerDisplay(url: string): Promise<boolean> {
    try {
      const api = (window as any).electronAPI;
      if (api && api.openCustomerWindow) {
        this.customerWindow = await api.openCustomerWindow(url);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[MultiDisplay] 打开客显屏失败:', err);
      return false;
    }
  }

  /**
   * 关闭客显屏窗口
   */
  async closeCustomerDisplay(): Promise<void> {
    const api = (window as any).electronAPI;
    if (api && api.closeCustomerWindow) {
      await api.closeCustomerWindow();
    }
    this.customerWindow = null;
  }

  /**
   * 发送消息到客显屏
   */
  async sendToCustomerDisplay(data: any): Promise<void> {
    const api = (window as any).electronAPI;
    if (api && api.sendToCustomerWindow) {
      await api.sendToCustomerWindow(data);
    }
  }
}

// ============ AI 视觉服务（增强版）============

class AIVisionService {
  private cameraStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private aiServiceUrl: string = 'http://127.0.0.1:5000';

  /**
   * 打开摄像头
   */
  async openCamera(videoElement: HTMLVideoElement): Promise<boolean> {
    try {
      this.videoElement = videoElement;
      
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment',
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      videoElement.srcObject = this.cameraStream;
      await videoElement.play();
      
      console.log('[AIVision] 摄像头已打开');
      return true;
    } catch (err) {
      console.error('[AIVision] 摄像头打开失败:', err);
      return false;
    }
  }

  /**
   * 关闭摄像头
   */
  closeCamera(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  /**
   * 截图并识别
   */
  async captureAndRecognize(): Promise<{
    success: boolean;
    product?: string;
    confidence?: number;
    weight?: number;
    error?: string;
  }> {
    if (!this.videoElement) {
      return { success: false, error: '摄像头未打开' };
    }

    try {
      // 截图
      const imageBase64 = this.captureFrame();
      
      // 调用 AI 服务
      const api = (window as any).electronAPI;
      if (api && api.aiRecognize) {
        return await api.aiRecognize(imageBase64);
      }
      
      // 模拟识别（开发用）
      return {
        success: true,
        product: '红富士苹果',
        confidence: 0.95,
        weight: 0.8
      };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  /**
   * 截图
   */
  captureFrame(): string {
    if (!this.videoElement) return '';

    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    ctx.drawImage(this.videoElement, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  }

  /**
   * 设置 AI 服务地址
   */
  setAIServiceUrl(url: string): void {
    this.aiServiceUrl = url;
  }

  /**
   * 检查摄像头状态
   */
  isCameraOpen(): boolean {
    return this.cameraStream !== null && this.cameraStream.active;
  }
}

// ============ 导出单例 ============

export const receiptPrinter = new ReceiptPrinterService();
export const labelPrinter = new LabelPrinterService();
export const cashDrawer = new CashDrawerService();
export const customerDisplay = new CustomerDisplayService();
export const multiDisplay = new MultiDisplayService();
export const aiVision = new AIVisionService();

// 导出类
export {
  ReceiptPrinterService,
  LabelPrinterService,
  CashDrawerService,
  CustomerDisplayService,
  MultiDisplayService,
  AIVisionService
};

// 重新导出
export { electronScaleService, electronCameraService, type ScaleReading };
