// ============================================
// 海邻到家 - 打印机服务
// 支持USB、蓝牙、网络打印机
// ============================================

import Taro from '@tarojs/taro';
import type { PrinterConfig, ReceiptData, Device } from '@hailin/core';

/** 设备连接状态 */
type PrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'printing' | 'error';

/** 打印服务类 */
export class PrinterService {
  private status: PrinterStatus = 'disconnected';
  private config: PrinterConfig | null = null;
  private device: any = null;
  
  /** 连接打印机 */
  async connect(config: PrinterConfig): Promise<boolean> {
    try {
      this.status = 'connecting';
      this.config = config;
      
      switch (config.type) {
        case 'usb':
          return await this.connectUSB(config);
        case 'bluetooth':
          return await this.connectBluetooth(config);
        case 'network':
          return await this.connectNetwork(config);
        default:
          throw new Error('不支持的打印机类型');
      }
    } catch (error) {
      console.error('Printer connect error:', error);
      this.status = 'error';
      return false;
    }
  }
  
  /** USB连接 */
  private async connectUSB(config: PrinterConfig): Promise<boolean> {
    try {
      // 使用Web Serial API
      if ('serial' in navigator) {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });
        this.device = port;
        this.status = 'connected';
        return true;
      }
      
      // 降级：使用后端API打印
      this.status = 'connected';
      return true;
    } catch (error) {
      console.error('USB connect failed:', error);
      this.status = 'error';
      return false;
    }
  }
  
  /** 蓝牙连接 */
  private async connectBluetooth(config: PrinterConfig): Promise<boolean> {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['00001101-0000-1000-8000-00805f9b34fb'] }], // 蓝牙打印机服务UUID
      });
      
      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService('00001101-0000-1000-8000-00805f9b34fb');
      const characteristic = await service?.getCharacteristic('00001101-0000-1000-8000-00805f9b34fb');
      
      this.device = { device, server, service, characteristic };
      this.status = 'connected';
      return true;
    } catch (error) {
      console.error('Bluetooth connect failed:', error);
      this.status = 'error';
      return false;
    }
  }
  
  /** 网络连接 */
  private async connectNetwork(config: PrinterConfig): Promise<boolean> {
    // 网络打印机通过后端API打印
    this.status = 'connected';
    return true;
  }
  
  /** 打印小票 */
  async printReceipt(data: ReceiptData): Promise<boolean> {
    if (this.status !== 'connected') {
      throw new Error('打印机未连接');
    }
    
    this.status = 'printing';
    
    try {
      // 生成ESC/POS指令
      const commands = this.generateReceiptCommands(data);
      
      switch (this.config?.type) {
        case 'usb':
          await this.printUSB(commands);
          break;
        case 'bluetooth':
          await this.printBluetooth(commands);
          break;
        case 'network':
          await this.printViaAPI(data);
          break;
      }
      
      this.status = 'connected';
      return true;
    } catch (error) {
      console.error('Print failed:', error);
      this.status = 'error';
      return false;
    }
  }
  
  /** 生成ESC/POS打印指令 */
  private generateReceiptCommands(data: ReceiptData): Uint8Array {
    const encoder = new TextEncoder();
    const commands: number[] = [];
    
    // 初始化打印机
    commands.push(0x1B, 0x40); // ESC @
    
    // 设置居中
    commands.push(0x1B, 0x61, 0x01); // ESC a 1
    
    // 打印标题
    commands.push(0x1B, 0x21, 0x08); // 粗体开启
    commands.push(...encoder.encode(data.storeName || '海邻到家'));
    commands.push(0x0A); // 换行
    commands.push(0x1B, 0x21, 0x00); // 粗体关闭
    
    // 打印订单信息
    commands.push(0x0A);
    commands.push(0x1B, 0x61, 0x00); // 左对齐
    commands.push(...encoder.encode(`单号: ${data.orderNo}`));
    commands.push(0x0A);
    commands.push(...encoder.encode(`时间: ${new Date(data.timestamp).toLocaleString()}`));
    commands.push(0x0A);
    
    // 分隔线
    commands.push(...encoder.encode('--------------------------------'));
    commands.push(0x0A);
    
    // 打印商品明细
    commands.push(...encoder.encode('商品名          数量   金额'));
    commands.push(0x0A);
    
    data.items.forEach(item => {
      const name = item.name.substring(0, 12).padEnd(12);
      const qty = item.quantity.toString().padStart(3);
      const price = item.total.toFixed(2).padStart(8);
      commands.push(...encoder.encode(`${name}${qty}   ¥${price}`));
      commands.push(0x0A);
    });
    
    // 分隔线
    commands.push(...encoder.encode('--------------------------------'));
    commands.push(0x0A);
    
    // 打印总计
    commands.push(0x1B, 0x21, 0x08); // 粗体开启
    commands.push(...encoder.encode(`合计: ¥${data.total.toFixed(2)}`));
    commands.push(0x0A);
    
    if (data.discount > 0) {
      commands.push(...encoder.encode(`优惠: -¥${data.discount.toFixed(2)}`));
      commands.push(0x0A);
    }
    
    commands.push(...encoder.encode(`实付: ¥${data.paidAmount.toFixed(2)}`));
    commands.push(0x0A);
    commands.push(0x1B, 0x21, 0x00); // 粗体关闭
    
    // 打印支付信息
    commands.push(0x0A);
    commands.push(...encoder.encode(`支付方式: ${data.paymentMethod}`));
    commands.push(0x0A);
    
    // 打印底部信息
    commands.push(0x0A);
    commands.push(0x1B, 0x61, 0x01); // 居中
    commands.push(...encoder.encode('谢谢惠顾，欢迎下次光临！'));
    commands.push(0x0A);
    commands.push(...encoder.encode(data.storePhone || '服务热线: 400-888-8888'));
    commands.push(0x0A);
    
    // 切纸
    commands.push(0x1D, 0x56, 0x00); // GS V 0
    
    return new Uint8Array(commands);
  }
  
  /** USB打印 */
  private async printUSB(data: Uint8Array): Promise<void> {
    if (this.device?.writable) {
      const writer = this.device.writable.getWriter();
      await writer.write(data);
      writer.releaseLock();
    }
  }
  
  /** 蓝牙打印 */
  private async printBluetooth(data: Uint8Array): Promise<void> {
    if (this.device?.characteristic) {
      await this.device.characteristic.writeValue(data);
    }
  }
  
  /** 通过API打印 */
  private async printViaAPI(data: ReceiptData): Promise<void> {
    // 调用后端API打印
    const response = await Taro.request({
      url: `${process.env.API_BASE_URL}/print/receipt`,
      method: 'POST',
      data,
    });
    
    if (!response.data?.success) {
      throw new Error(response.data?.message || '打印失败');
    }
  }
  
  /** 获取状态 */
  getStatus(): Device['status'] {
    return this.status as Device['status'];
  }
  
  /** 断开连接 */
  async disconnect(): Promise<void> {
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
  }
  
  /** 自检 */
  async selfTest(): Promise<boolean> {
    if (this.status !== 'connected') {
      return false;
    }
    
    try {
      const testCommands = new Uint8Array([0x1B, 0x40, 0x1D, 0x28, 0x41, 0x02, 0x00, 0x00, 0x30]);
      await this.printUSB(testCommands);
      return true;
    } catch {
      return false;
    }
  }
}

export default PrinterService;
