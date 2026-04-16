// ============================================
// 海邻到家 - 扫码枪服务
// 支持USB、蓝牙扫码枪
// ============================================

type ScanCallback = (barcode: string, type: 'product' | 'member' | 'coupon' | 'unknown') => void;
type ScannerStatus = 'disconnected' | 'listening' | 'scanning' | 'error';

/** 扫码枪服务 */
export class ScannerService {
  private status: ScannerStatus = 'disconnected';
  private callback: ScanCallback | null = null;
  private buffer: string = '';
  private timeout: number | null = null;
  private isListening: boolean = false;
  private listeners: Set<(status: ScannerStatus) => void> = new Set();
  
  /** 开始监听扫码 */
  startListening(callback?: ScanCallback): () => void {
    if (callback) {
      this.callback = callback;
    }
    
    if (this.isListening) {
      return this.stopListening.bind(this);
    }
    
    this.isListening = true;
    this.setStatus('listening');
    
    // USB扫码枪使用键盘事件
    const handleKeyDown = (event: KeyboardEvent) => {
      // 扫码枪通常以Enter结尾
      if (event.key === 'Enter') {
        if (this.buffer.length > 0) {
          const barcode = this.buffer;
          this.buffer = '';
          this.clearTimeout();
          
          const type = this.identifyBarcodeType(barcode);
          this.setStatus('scanning');
          
          try {
            this.callback?.(barcode, type);
          } finally {
            // 延迟恢复监听状态
            setTimeout(() => {
              if (this.isListening) {
                this.setStatus('listening');
              }
            }, 100);
          }
        }
        return;
      }
      
      // 只接受数字和字母
      if (/^[a-zA-Z0-9]$/.test(event.key)) {
        this.buffer += event.key;
        this.resetTimeout();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      this.stopListening();
    };
  }
  
  /** 识别条码类型 */
  private identifyBarcodeType(barcode: string): 'product' | 'member' | 'coupon' | 'unknown' {
    // 商品条码: 8-14位数字，常见商品码
    if (/^\d{8,14}$/.test(barcode)) {
      return 'product';
    }
    
    // 会员码: 通常以9开头
    if (barcode.startsWith('9') && barcode.length >= 10) {
      return 'member';
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
      this.buffer = '';
    }, 300);
  }
  
  /** 清除超时 */
  private clearTimeout(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
  
  /** 设置状态 */
  private setStatus(status: ScannerStatus): void {
    this.status = status;
    this.listeners.forEach(callback => callback(status));
  }
  
  /** 是否正在监听 */
  isListening(): boolean {
    return this.isListening;
  }
  
  /** 获取状态 */
  getStatus(): ScannerStatus {
    return this.status;
  }
  
  /** 停止监听 */
  stopListening(): void {
    this.isListening = false;
    this.buffer = '';
    this.clearTimeout();
    this.setStatus('disconnected');
  }
  
  /** 添加状态监听 */
  addStatusListener(callback: (status: ScannerStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

export default ScannerService;
