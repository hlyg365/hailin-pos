// ============================================
// 海邻到家 - 扫码枪服务
// 支持USB、蓝牙扫码枪
// ============================================

import Taro from '@tarojs/taro';
import type { Device } from '@hailin/core';

/** 扫码枪状态 */
type ScannerStatus = 'disconnected' | 'listening' | 'scanning' | 'error';

/** 扫码回调 */
type ScanCallback = (barcode: string, type: 'product' | 'member' | 'coupon' | 'unknown') => void;

/** 扫码枪服务 */
export class ScannerService {
  private status: ScannerStatus = 'disconnected';
  private callback: ScanCallback | null = null;
  private buffer: string = '';
  private timeout: number | null = null;
  private isListening: boolean = false;
  
  /** 开始监听扫码 */
  startListening(callback: ScanCallback): () => void {
    this.callback = callback;
    this.isListening = true;
    this.status = 'listening';
    
    // USB扫码枪使用键盘事件
    const handleKeyDown = (event: KeyboardEvent) => {
      // 扫码枪通常以Enter结尾
      if (event.key === 'Enter') {
        if (this.buffer.length > 0) {
          const barcode = this.buffer;
          this.buffer = '';
          this.clearTimeout();
          
          // 判断条码类型
          const type = this.identifyBarcodeType(barcode);
          this.status = 'scanning';
          
          try {
            this.callback?.(barcode, type);
          } finally {
            this.status = 'listening';
          }
        }
        return;
      }
      
      // 只接受数字
      if (/^\d$/.test(event.key)) {
        this.buffer += event.key;
        this.resetTimeout();
      }
    };
    
    // 添加事件监听
    document.addEventListener('keydown', handleKeyDown);
    
    // 返回清理函数
    return () => {
      this.isListening = false;
      this.buffer = '';
      this.clearTimeout();
      document.removeEventListener('keydown', handleKeyDown);
      this.status = 'disconnected';
    };
  }
  
  /** 识别条码类型 */
  private identifyBarcodeType(barcode: string): 'product' | 'member' | 'coupon' | 'unknown' {
    // 商品条码: 8-14位数字，常见商品码
    if (/^\d{8,14}$/.test(barcode)) {
      // 会员码: 通常以9开头
      if (barcode.startsWith('9') && barcode.length >= 10) {
        return 'member';
      }
      return 'product';
    }
    
    // 优惠券码: 字母数字组合
    if (/^[A-Z0-9]{6,20}$/i.test(barcode)) {
      return 'coupon';
    }
    
    return 'unknown';
  }
  
  /** 重置超时 */
  private resetTimeout(): void {
    this.clearTimeout();
    this.timeout = window.setTimeout(() => {
      this.buffer = ''; // 超时清除缓冲区
    }, 300);
  }
  
  /** 清除超时 */
  private clearTimeout(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
  
  /** 摄像头扫码（备选方案） */
  async scanWithCamera(): Promise<string | null> {
    try {
      // 使用TarochooseImage会有问题，这里直接用小程序API
      // #ifdef MP-WEIXIN
      const res = await Taro.scanCode({ onlyFromCamera: true });
      return res.result;
      // #endif
      
      // #ifdef H5
      // 使用html5-qrcode库
      return null;
      // #endif
      
      return null;
    } catch (error) {
      console.error('Camera scan failed:', error);
      return null;
    }
  }
  
  /** 获取状态 */
  getStatus(): Device['status'] {
    if (this.isListening) {
      return 'connected';
    }
    return this.status as Device['status'];
  }
  
  /** 停止监听 */
  stopListening(): void {
    this.isListening = false;
    this.buffer = '';
    this.clearTimeout();
    this.status = 'disconnected';
  }
}

export default ScannerService;
