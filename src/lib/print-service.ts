/**
 * 打印服务 - 封装小票打印功能
 * 支持屏幕打印（模拟）、USB打印、蓝牙打印、网络打印
 */

export interface PrintConfig {
  type: 'screen' | 'usb' | 'bluetooth' | 'network';
  paperWidth: 58 | 80;
  autoCut: boolean;
  openCashbox: boolean;
  printerIp?: string;
  printerPort?: number;
}

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
  pointsDiscount?: number;
  couponDiscount?: number;
  promotionDiscount?: number;
  totalAmount: number;
  paymentMethod: string;
  changeAmount?: number; // 找零金额
  memberInfo?: {
    name: string;
    memberNo: string;
    points: number;
    earnedPoints?: number;
  };
  footer?: string;
  isClearanceMode?: boolean; // 晚8点清货模式
}

class PrintService {
  private static instance: PrintService;
  private config: PrintConfig = {
    type: 'screen', // 默认使用屏幕打印
    paperWidth: 80,
    autoCut: true,
    openCashbox: true,
  };
  private isConnected: boolean = false;

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): PrintService {
    if (!PrintService.instance) {
      PrintService.instance = new PrintService();
    }
    return PrintService.instance;
  }

  // 加载配置
  private loadConfig() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_printer_config');
      if (saved) {
        try {
          this.config = { ...this.config, ...JSON.parse(saved) };
        } catch (e) {
          console.error('Failed to load print config:', e);
        }
      }
    }
  }

  // 保存配置
  saveConfig(config: Partial<PrintConfig>) {
    this.config = { ...this.config, ...config };
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_printer_config', JSON.stringify(this.config));
    }
  }

  // 获取配置
  getConfig() {
    return { ...this.config };
  }

  // 检查是否支持硬件打印
  isHardwarePrintSupported(): boolean {
    if (typeof window === 'undefined') return false;
    
    const isSecureContext = window.isSecureContext;
    const hasSerial = 'serial' in navigator;
    const hasBluetooth = 'bluetooth' in navigator;
    
    return isSecureContext && (hasSerial || hasBluetooth);
  }

  // 屏幕打印（模拟打印）
  async printToScreen(data: ReceiptData): Promise<string> {
    const charWidth = this.config.paperWidth === 80 ? 48 : 32;
    
    const lines: string[] = [];
    lines.push('═'.repeat(charWidth));
    lines.push(`  ${data.shopName}`);
    lines.push('═'.repeat(charWidth));
    
    if (data.shopAddress) {
      lines.push(`地址: ${data.shopAddress}`);
    }
    if (data.shopPhone) {
      lines.push(`电话: ${data.shopPhone}`);
    }
    
    lines.push('');
    lines.push(`订单号: ${data.orderNumber}`);
    lines.push(`时间: ${data.timestamp}`);
    if (data.cashier) {
      lines.push(`收银员: ${data.cashier}`);
    }
    
    lines.push('─'.repeat(charWidth));
    
    // 商品列表
    for (const item of data.items) {
      const qtyStr = `${item.quantity}${item.unit || ''}`;
      const priceStr = `¥${item.price.toFixed(2)}`;
      const subStr = `¥${(item.subtotal || item.price * item.quantity).toFixed(2)}`;
      
      lines.push(item.name);
      lines.push(`  ${qtyStr.padEnd(8)} ${priceStr.padStart(10)} ${subStr.padStart(12)}`);
    }
    
    lines.push('─'.repeat(charWidth));
    
    // 金额汇总
    lines.push(`小计:            ¥${data.subtotal.toFixed(2)}`);
    
    if (data.discount && data.discount > 0) {
      lines.push(`优惠:            -¥${data.discount.toFixed(2)}`);
    }
    if (data.memberDiscount && data.memberDiscount > 0) {
      lines.push(`会员优惠:        -¥${data.memberDiscount.toFixed(2)}`);
    }
    if (data.promotionDiscount && data.promotionDiscount > 0) {
      lines.push(`活动优惠:        -¥${data.promotionDiscount.toFixed(2)}`);
    }
    
    lines.push('─'.repeat(charWidth));
    
    // 总计
    lines.push(`合计:            ¥${data.totalAmount.toFixed(2)}`);
    lines.push(`支付方式: ${data.paymentMethod}`);
    
    if (data.changeAmount !== undefined && data.changeAmount > 0) {
      lines.push(`找零:            ¥${data.changeAmount.toFixed(2)}`);
    }
    
    // 会员信息
    if (data.memberInfo) {
      lines.push('');
      lines.push('─'.repeat(charWidth));
      lines.push(`会员: ${data.memberInfo.name} (${data.memberInfo.memberNo})`);
      lines.push(`本次积分: +${data.memberInfo.earnedPoints || 0}`);
      lines.push(`累计积分: ${data.memberInfo.points}`);
    }
    
    // 底部
    lines.push('');
    lines.push('═'.repeat(charWidth));
    lines.push('      感谢您的光临！');
    lines.push('      欢迎再次惠顾');
    
    if (data.isClearanceMode) {
      lines.push('');
      lines.push('  【晚8点清货特价】');
    }
    
    if (data.footer) {
      lines.push(`  ${data.footer}`);
    }
    
    lines.push('═'.repeat(charWidth));
    lines.push('');
    
    return lines.join('\n');
  }

  // 打印小票
  async print(data: ReceiptData): Promise<{ success: boolean; message: string; screenContent?: string }> {
    try {
      // 根据配置选择打印方式
      switch (this.config.type) {
        case 'screen':
          // 屏幕打印 - 始终可用
          const content = await this.printToScreen(data);
          return {
            success: true,
            message: '小票已显示在屏幕上',
            screenContent: content,
          };
          
        case 'usb':
          return await this.printViaUsb(data);
          
        case 'bluetooth':
          return await this.printViaBluetooth(data);
          
        case 'network':
          return await this.printViaNetwork(data);
          
        default:
          return { success: false, message: '未配置打印方式' };
      }
    } catch (error) {
      console.error('Print error:', error);
      // 发生错误时，回退到屏幕打印
      const content = await this.printToScreen(data);
      return {
        success: true,
        message: '打印失败，已显示屏幕小票',
        screenContent: content,
      };
    }
  }

  // USB打印
  private async printViaUsb(data: ReceiptData): Promise<{ success: boolean; message: string }> {
    if (!('serial' in navigator)) {
      return { success: false, message: '浏览器不支持USB打印' };
    }
    
    try {
      // @ts-ignore
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      
      const commands = this.generateEscPosCommands(data);
      const writer = port.writable.getWriter();
      await writer.write(commands);
      writer.releaseLock();
      
      await port.close();
      return { success: true, message: 'USB打印成功' };
    } catch (error) {
      return { success: false, message: `USB打印失败: ${error}` };
    }
  }

  // 蓝牙打印
  private async printViaBluetooth(data: ReceiptData): Promise<{ success: boolean; message: string }> {
    if (!('bluetooth' in navigator)) {
      return { success: false, message: '浏览器不支持蓝牙打印' };
    }
    
    try {
      // @ts-ignore
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['00001101-0000-1000-8000-00805f9b34fb'] }] // 串口服务UUID
      });
      
      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService('00001101-0000-1000-8000-00805f9b34fb');
      const characteristic = await service?.getCharacteristic('00001101-0000-1000-8000-00805f9b34fb');
      
      const commands = this.generateEscPosCommands(data);
      await characteristic?.writeValue(commands);
      
      return { success: true, message: '蓝牙打印成功' };
    } catch (error) {
      return { success: false, message: `蓝牙打印失败: ${error}` };
    }
  }

  // 网络打印
  private async printViaNetwork(data: ReceiptData): Promise<{ success: boolean; message: string }> {
    const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || '';
    
    try {
      const response = await fetch(`${baseUrl}/api/print/network`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: this.config.printerIp,
          port: this.config.printerPort || 9100,
          data: data,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        return { success: true, message: '网络打印成功' };
      } else {
        return { success: false, message: result.error || '网络打印失败' };
      }
    } catch (error) {
      return { success: false, message: `网络打印失败: ${error}` };
    }
  }

  // 生成ESC/POS命令
  private generateEscPosCommands(data: ReceiptData): Uint8Array {
    const commands: number[] = [];
    const charWidth = this.config.paperWidth === 80 ? 48 : 32;
    
    // 初始化打印机
    commands.push(0x1B, 0x40);
    
    // 居中对齐
    commands.push(0x1B, 0x61, 0x01);
    
    // 双倍大小打印店铺名称
    commands.push(0x1D, 0x21, 0x11);
    commands.push(...this.stringToBytes(data.shopName));
    commands.push(0x0A);
    
    // 恢复正常大小
    commands.push(0x1D, 0x21, 0x00);
    
    // 店铺信息
    commands.push(0x0A);
    if (data.shopAddress) {
      commands.push(...this.stringToBytes(data.shopAddress));
      commands.push(0x0A);
    }
    if (data.shopPhone) {
      commands.push(...this.stringToBytes(`电话: ${data.shopPhone}`));
      commands.push(0x0A);
    }
    
    commands.push(0x0A);
    
    // 左对齐
    commands.push(0x1B, 0x61, 0x00);
    
    // 订单信息
    commands.push(...this.stringToBytes(`订单号: ${data.orderNumber}`));
    commands.push(0x0A);
    commands.push(...this.stringToBytes(`时间: ${data.timestamp}`));
    commands.push(0x0A);
    if (data.cashier) {
      commands.push(...this.stringToBytes(`收银员: ${data.cashier}`));
      commands.push(0x0A);
    }
    
    // 分隔线
    commands.push(...this.stringToBytes('─'.repeat(charWidth)));
    commands.push(0x0A);
    
    // 商品列表
    for (const item of data.items) {
      commands.push(...this.stringToBytes(item.name));
      commands.push(0x0A);
      
      const qtyStr = `${item.quantity}${item.unit || ''}`;
      const priceStr = `¥${item.price.toFixed(2)}`;
      const subStr = `¥${(item.subtotal || item.price * item.quantity).toFixed(2)}`;
      commands.push(...this.stringToBytes(`  ${qtyStr}  ${priceStr}  ${subStr}`));
      commands.push(0x0A);
    }
    
    // 分隔线
    commands.push(...this.stringToBytes('─'.repeat(charWidth)));
    commands.push(0x0A);
    
    // 金额汇总
    commands.push(...this.stringToBytes(`小计: ¥${data.subtotal.toFixed(2)}`));
    commands.push(0x0A);
    
    if (data.memberDiscount && data.memberDiscount > 0) {
      commands.push(...this.stringToBytes(`会员优惠: -¥${data.memberDiscount.toFixed(2)}`));
      commands.push(0x0A);
    }
    if (data.promotionDiscount && data.promotionDiscount > 0) {
      commands.push(...this.stringToBytes(`活动优惠: -¥${data.promotionDiscount.toFixed(2)}`));
      commands.push(0x0A);
    }
    
    // 总计（加粗）
    commands.push(0x1B, 0x45, 0x01);
    commands.push(...this.stringToBytes(`合计: ¥${data.totalAmount.toFixed(2)}`));
    commands.push(0x0A);
    commands.push(0x1B, 0x45, 0x00);
    
    // 支付方式
    commands.push(...this.stringToBytes(`支付方式: ${data.paymentMethod}`));
    commands.push(0x0A);
    
    if (data.changeAmount !== undefined && data.changeAmount > 0) {
      commands.push(...this.stringToBytes(`找零: ¥${data.changeAmount.toFixed(2)}`));
      commands.push(0x0A);
    }
    
    // 会员信息
    if (data.memberInfo) {
      commands.push(0x0A);
      commands.push(...this.stringToBytes(`会员: ${data.memberInfo.name}`));
      commands.push(0x0A);
      commands.push(...this.stringToBytes(`本次积分: +${data.memberInfo.earnedPoints || 0}`));
      commands.push(0x0A);
      commands.push(...this.stringToBytes(`累计积分: ${data.memberInfo.points}`));
      commands.push(0x0A);
    }
    
    // 清货模式标记
    if (data.isClearanceMode) {
      commands.push(0x0A);
      commands.push(0x1B, 0x45, 0x01);
      commands.push(...this.stringToBytes('【晚8点清货特价】'));
      commands.push(0x0A);
      commands.push(0x1B, 0x45, 0x00);
    }
    
    commands.push(0x0A);
    
    // 居中对齐
    commands.push(0x1B, 0x61, 0x01);
    commands.push(...this.stringToBytes('感谢您的光临！'));
    commands.push(0x0A);
    commands.push(...this.stringToBytes('欢迎再次惠顾'));
    commands.push(0x0A);
    
    if (data.footer) {
      commands.push(...this.stringToBytes(data.footer));
      commands.push(0x0A);
    }
    
    commands.push(0x0A, 0x0A);
    
    // 切纸
    if (this.config.autoCut) {
      commands.push(0x1D, 0x56, 0x00);
    }
    
    return new Uint8Array(commands);
  }

  // 字符串转字节数组（简化版GBK）
  private stringToBytes(str: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code < 128) {
        bytes.push(code);
      } else {
        // 中文字符高低位
        bytes.push(code >> 8);
        bytes.push(code & 0xFF);
      }
    }
    return bytes;
  }

  // 打开钱箱
  async openCashbox(): Promise<boolean> {
    if (!this.config.openCashbox) {
      return false;
    }
    
    // 如果使用屏幕打印，模拟钱箱打开
    if (this.config.type === 'screen') {
      console.log('[Cashbox] Screen mode: Cashbox opened (simulated)');
      return true;
    }
    
    // 生成开钱箱的ESC/POS命令
    // ESC p m t1 t2 - 发送脉冲到钱箱接口
    const commands = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]);
    
    try {
      switch (this.config.type) {
        case 'usb':
          // @ts-ignore
          const ports = await navigator.serial.getPorts();
          if (ports.length > 0) {
            const port = ports[0];
            await port.open({ baudRate: 9600 });
            const writer = port.writable.getWriter();
            await writer.write(commands);
            writer.releaseLock();
            await port.close();
            return true;
          }
          break;
          
        case 'bluetooth':
          // 蓝牙打印钱箱控制类似
          break;
          
        case 'network':
          // 通过网络发送
          const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || '';
          const response = await fetch(`${baseUrl}/api/print/cashbox`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ip: this.config.printerIp,
              port: this.config.printerPort || 9100,
            }),
          });
          const result = await response.json();
          return result.success;
      }
    } catch (error) {
      console.error('[Cashbox] Open failed:', error);
    }
    
    return false;
  }
}

// 导出单例
export const printService = PrintService.getInstance();
