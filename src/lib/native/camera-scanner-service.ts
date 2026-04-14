/**
 * 摄像头扫码服务 - 基于QuaggaJS
 * 
 * 支持的条码类型：
 * - EAN-13, EAN-8
 * - Code 128, Code 39
 * - UPC-A, UPC-E
 * - QR Code
 * - Data Matrix
 * - PDF 417
 * 
 * 使用场景：
 * - 手机扫码支付
 * - 商品条码扫描
 * - 二维码扫描
 */

import Quagga from '@ericblade/quagga2';
interface QuaggaJSResultObject {
  codeResult?: {
    code?: string;
    format?: string;
    decCodes?: number[];
    decodedCodes?: Array<{ code?: string; error?: number; start?: number; end?: number; codeset?: number }>;
  };
  line?: { x1?: number; y1?: number; x2?: number; y2?: number };
  angle?: number;
  pattern?: number[];
  boxes?: Array<Array<{ x?: number; y?: number }>>;
}

// 支持的条码类型
export type BarcodeType = 
  | 'ean_reader'
  | 'ean_8_reader'
  | 'code_reader'
  | 'code_39_reader'
  | 'upc_reader'
  | 'upc_e_reader'
  | 'code_128_reader'
  | 'i2of5_reader'
  | 'qr_reader'
  | 'dm_reader'
  | 'pdf417_reader';

// 扫码结果
export interface ScanResult {
  code: string;           // 扫描到的条码内容
  format: string;        // 条码格式 (ean_13, code_128, qr_code等)
  type: 'product' | 'payment' | 'member';  // 条码类型推测
  timestamp: number;      // 扫描时间
  quality?: number;       // 识别质量 0-1
}

// 摄像头配置
export interface CameraConfig {
  inputStream: {
    type: 'LiveStream';
    target: HTMLElement | Element | undefined;
    constraints: {
      width?: { min?: number; ideal?: number; max?: number };
      height?: { min?: number; ideal?: number; max?: number };
      facingMode?: string;
      aspectRatio?: { min?: number; max?: number };
    };
  };
  locator: {
    patchSize: 'medium' | 'large' | 'xlarge';
    halfSample: boolean;
  };
  numOfWorkers: number;
  frequency: number;
  decoder: {
    readers: BarcodeType[];
  };
  locate: boolean;
}

// 摄像头状态
export interface CameraStatus {
  active: boolean;
  hasPermission: boolean;
  deviceId?: string;
  deviceName?: string;
  error?: string;
}

// 摄像头信息
export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput';
}

// 回调类型
type ScanCallback = (result: ScanResult) => void;
type ErrorCallback = (error: Error) => void;

// 摄像头扫码服务
export class CameraScannerService {
  private static instance: CameraScannerService;
  private scannerActive: boolean = false;
  private scanCallbacks: Set<ScanCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();
  private status: CameraStatus = {
    active: false,
    hasPermission: false,
  };
  private lastScan: ScanResult | null = null;
  private scanCooldown: number = 1000; // 扫描间隔(ms)
  private lastScanTime: number = 0;
  
  private constructor() {}
  
  public static getInstance(): CameraScannerService {
    if (!CameraScannerService.instance) {
      CameraScannerService.instance = new CameraScannerService();
    }
    return CameraScannerService.instance;
  }
  
  /**
   * 检查摄像头支持
   */
  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
  
  /**
   * 获取可用摄像头列表
   */
  async getCameras(): Promise<CameraDevice[]> {
    if (!this.isSupported()) {
      console.warn('[CameraScanner] MediaDevices not supported');
      return [];
    }
    
    try {
      // 先请求权限以获取设备标签
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `摄像头 ${device.deviceId.slice(0, 8)}`,
          kind: device.kind as 'videoinput',
        }));
      
      return cameras;
    } catch (error) {
      console.error('[CameraScanner] getCameras error:', error);
      return [];
    }
  }
  
  /**
   * 请求摄像头权限
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      // 释放临时stream
      stream.getTracks().forEach(track => track.stop());
      this.status.hasPermission = true;
      return true;
    } catch (error: any) {
      console.error('[CameraScanner] Permission denied:', error);
      this.status.hasPermission = false;
      this.status.error = error.message;
      return false;
    }
  }
  
  /**
   * 获取默认配置
   */
  getDefaultConfig(target: HTMLElement | null): CameraConfig {
    return {
      inputStream: {
        type: 'LiveStream',
        target: target as Element,
        constraints: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          facingMode: 'environment', // 后置摄像头
          aspectRatio: { min: 1, max: 2 },
        },
      },
      locator: {
        patchSize: 'medium',
        halfSample: true,
      },
      numOfWorkers: navigator.hardwareConcurrency || 4,
      frequency: 10,
      decoder: {
        readers: [
          'ean_reader',
          'ean_8_reader',
          'code_reader',
          'code_39_reader',
          'upc_reader',
          'upc_e_reader',
          'code_128_reader',
        ],
      },
      locate: true,
    };
  }
  
  /**
   * 启动扫码
   */
  async start(target: HTMLElement, options?: {
    barcodeTypes?: BarcodeType[];
    facingMode?: 'environment' | 'user';
  }): Promise<boolean> {
    if (this.scannerActive) {
      console.warn('[CameraScanner] Scanner already active');
      return true;
    }
    
    if (!this.isSupported()) {
      console.error('[CameraScanner] Not supported in this browser');
      return false;
    }
    
    // 请求权限
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      this.notifyError(new Error('摄像头权限被拒绝'));
      return false;
    }
    
    try {
      const config = this.getDefaultConfig(target);
      
      // 自定义条码类型
      if (options?.barcodeTypes) {
        config.decoder.readers = options.barcodeTypes;
      }
      
      // 自定义摄像头方向
      if (options?.facingMode) {
        config.inputStream.constraints.facingMode = options.facingMode;
      }
      
      // 监听扫码结果
      Quagga.onDetected(this.handleDetected.bind(this));
      
      // 监听错误
      Quagga.onProcessed(this.handleProcessed.bind(this));
      
      // 启动
      await Quagga.init(config);
      await Quagga.start();
      
      this.scannerActive = true;
      this.status.active = true;
      
      console.log('[CameraScanner] Started successfully');
      return true;
    } catch (error: any) {
      console.error('[CameraScanner] Start error:', error);
      this.status.error = error.message;
      this.notifyError(error);
      return false;
    }
  }
  
  /**
   * 停止扫码
   */
  async stop(): Promise<void> {
    if (!this.scannerActive) {
      return;
    }
    
    try {
      await Quagga.stop();
      Quagga.offDetected(this.handleDetected.bind(this));
      Quagga.offProcessed(this.handleProcessed.bind(this));
      
      this.scannerActive = false;
      this.status.active = false;
      
      console.log('[CameraScanner] Stopped');
    } catch (error: any) {
      console.error('[CameraScanner] Stop error:', error);
    }
  }
  
  /**
   * 暂停扫码
   */
  pause(): void {
    if (this.scannerActive) {
      Quagga.stop();
      this.status.active = false;
    }
  }
  
  /**
   * 恢复扫码
   */
  async resume(): Promise<void> {
    if (this.scannerActive && !this.status.active) {
      await Quagga.start();
      this.status.active = true;
    }
  }
  
  /**
   * 处理扫码结果
   */
  private handleDetected(result: QuaggaJSResultObject): void {
    const now = Date.now();
    
    // 防重复扫描
    if (now - this.lastScanTime < this.scanCooldown) {
      return;
    }
    
    const code = result.codeResult?.code;
    const format = result.codeResult?.format;
    
    if (!code || !format) {
      return;
    }
    
    // 判断条码类型
    const type = this.identifyBarcodeType(code, format);
    
    const scanResult: ScanResult = {
      code,
      format,
      type,
      timestamp: now,
      quality: result.codeResult?.decodedCodes?.reduce?.((acc: number, d: { error?: number }) => acc + (d.error || 0), 0) || undefined,
    };
    
    this.lastScan = scanResult;
    this.lastScanTime = now;
    
    console.log('[CameraScanner] Scanned:', scanResult);
    
    // 通知所有回调
    this.scanCallbacks.forEach(callback => {
      try {
        callback(scanResult);
      } catch (error) {
        console.error('[CameraScanner] Callback error:', error);
      }
    });
  }
  
  /**
   * 处理处理结果（用于调试/预览）
   */
  private handleProcessed(result: QuaggaJSResultObject): void {
    // 可以在这里绘制覆盖层等
  }
  
  /**
   * 识别条码类型
   */
  private identifyBarcodeType(code: string, format: string): 'product' | 'payment' | 'member' {
    // 支付二维码/条码
    if (format === 'qr_code') {
      if (code.startsWith('https://wx.wxpay.com/') || 
          code.startsWith('weixin://') ||
          code.startsWith('alipays://')) {
        return 'payment';
      }
      if (code.startsWith('{') || code.startsWith('[')) {
        try {
          JSON.parse(code);
          return 'payment';
        } catch {}
      }
    }
    
    // EAN-13/UPC 商品条码
    if (['ean_13', 'upc_a', 'upc_e'].includes(format)) {
      return 'product';
    }
    
    // 会员卡条码
    if (code.startsWith('MEMBER:') || code.startsWith('VIP:')) {
      return 'member';
    }
    
    // 默认商品
    return 'product';
  }
  
  /**
   * 注册扫码回调
   */
  onScan(callback: ScanCallback): () => void {
    this.scanCallbacks.add(callback);
    return () => this.scanCallbacks.delete(callback);
  }
  
  /**
   * 注册错误回调
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }
  
  /**
   * 通知错误
   */
  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (e) {
        console.error('[CameraScanner] Error callback error:', e);
      }
    });
  }
  
  /**
   * 获取状态
   */
  getStatus(): CameraStatus {
    return { ...this.status };
  }
  
  /**
   * 获取最后扫描结果
   */
  getLastScan(): ScanResult | null {
    return this.lastScan;
  }
  
  /**
   * 设置扫描间隔
   */
  setCooldown(ms: number): void {
    this.scanCooldown = ms;
  }
  
  /**
   * 切换摄像头
   */
  async switchCamera(facingMode: 'environment' | 'user'): Promise<boolean> {
    if (!this.scannerActive) {
      return false;
    }
    
    await this.stop();
    // 重新启动时会使用新的facingMode
    return true;
  }
  
  /**
   * 截图当前画面
   */
  captureImage(): string | null {
    try {
      const canvas = document.querySelector('.viewport canvas') as HTMLCanvasElement;
      if (canvas) {
        return canvas.toDataURL('image/png');
      }
    } catch (error) {
      console.error('[CameraScanner] Capture error:', error);
    }
    return null;
  }
  
  /**
   * 解析URL中的扫码参数（用于从其他应用跳转）
   */
  parseScanUrl(url: string): ScanResult | null {
    try {
      const params = new URLSearchParams(url.split('?')[1]);
      const code = params.get('code') || params.get('barcode');
      const format = params.get('format') || 'unknown';
      
      if (code) {
        return {
          code,
          format,
          type: this.identifyBarcodeType(code, format),
          timestamp: Date.now(),
        };
      }
    } catch {}
    return null;
  }
}

// 导出单例
export const cameraScanner = CameraScannerService.getInstance();
export default cameraScanner;
