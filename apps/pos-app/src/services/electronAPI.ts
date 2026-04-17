/**
 * Electron 硬件服务模块
 * 封装与 Electron 主进程的 IPC 通信
 */

export interface SerialPort {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  vendorId?: string;
  productId?: string;
}

export interface ScaleReading {
  weight: number;
  unit: string;
  stable: boolean;
  raw: string;
}

export interface AppInfo {
  version: string;
  platform: string;
  arch: string;
  electron: string;
  node: string;
}

// 检查是否为 Electron 环境
const isElectron = () => {
  return typeof window !== 'undefined' && !!(window as any).electronAPI;
};

// 获取 Electron API
const getElectronAPI = () => {
  if (!isElectron()) {
    console.warn('[ElectronAPI] 非 Electron 环境');
    return null;
  }
  return (window as any).electronAPI;
};

// ============ 电子秤服务 ============

class ElectronScaleService {
  private listeners: ((data: ScaleReading) => void)[] = [];
  private connectedListener?: () => void;
  private disconnectedListener?: () => void;
  private errorListener?: (error: { message: string }) => void;

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    const api = getElectronAPI();
    if (!api) return;

    api.onScaleData((data: ScaleReading) => {
      this.listeners.forEach(cb => cb(data));
    });

    api.onScaleConnected(() => {
      console.log('[Scale] 已连接');
      this.connectedListener?.();
    });

    api.onScaleDisconnected(() => {
      console.log('[Scale] 已断开');
      this.disconnectedListener?.();
    });

    api.onScaleError((error: { message: string }) => {
      console.error('[Scale] 错误:', error);
      this.errorListener?.(error);
    });
  }

  /**
   * 列出可用串口
   */
  async listPorts(): Promise<SerialPort[]> {
    const api = getElectronAPI();
    if (!api) return [];
    return api.listSerialPorts();
  }

  /**
   * 连接电子秤
   */
  async connect(portPath?: string, options?: { baudRate?: number }): Promise<boolean> {
    const api = getElectronAPI();
    if (!api) return false;

    // 如果未指定端口，列出并选择第一个
    if (!portPath) {
      const ports = await this.listPorts();
      if (ports.length === 0) {
        console.error('[Scale] 未找到可用串口');
        return false;
      }
      portPath = ports[0].path;
    }

    console.log('[Scale] 正在连接:', portPath);
    const result = await api.connectScale(portPath, options);
    return result.success;
  }

  /**
   * 断开电子秤
   */
  async disconnect(): Promise<void> {
    const api = getElectronAPI();
    if (!api) return;
    await api.disconnectScale();
  }

  /**
   * 监听重量数据
   */
  onData(callback: (data: ScaleReading) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * 监听连接状态
   */
  onConnected(callback: () => void): () => void {
    this.connectedListener = callback;
    return () => { this.connectedListener = undefined; };
  }

  /**
   * 监听断开状态
   */
  onDisconnected(callback: () => void): () => void {
    this.disconnectedListener = callback;
    return () => { this.disconnectedListener = undefined; };
  }

  /**
   * 监听错误
   */
  onError(callback: (error: { message: string }) => void): () => void {
    this.errorListener = callback;
    return () => { this.errorListener = undefined; };
  }
}

// ============ 应用服务 ============

class ElectronAppService {
  private listeners: (() => void)[] = [];

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    const api = getElectronAPI();
    if (!api) return;

    api.onShowReport(() => {
      this.listeners.forEach(cb => cb());
    });
  }

  /**
   * 获取应用信息
   */
  async getInfo(): Promise<AppInfo | null> {
    const api = getElectronAPI();
    if (!api) return null;
    return api.getAppInfo();
  }

  /**
   * 监听显示日报事件
   */
  onShowReport(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * 窗口控制
   */
  minimize() { getElectronAPI()?.minimize(); }
  maximize() { getElectronAPI()?.maximize(); }
  close() { getElectronAPI()?.close(); }
  toggleFullscreen() { getElectronAPI()?.toggleFullscreen(); }
}

// ============ 摄像头服务（ Electron 下更稳定）============

class ElectronCameraService {
  private stream: MediaStream | null = null;

  /**
   * 打开摄像头
   */
  async open(constraints?: MediaTrackConstraints): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment',
          ...constraints,
        },
        audio: false,
      });
      return true;
    } catch (err) {
      console.error('[Camera] 打开失败:', err);
      return false;
    }
  }

  /**
   * 关闭摄像头
   */
  close() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  /**
   * 获取视频轨道
   */
  getVideoTrack(): MediaStreamTrack | null {
    return this.stream?.getVideoTracks()[0] || null;
  }

  /**
   * 截图并返回 Base64
   */
  captureImage(videoElement: HTMLVideoElement, format: 'jpeg' | 'png' = 'jpeg', quality = 0.9): string | null {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(videoElement, 0, 0);
    return canvas.toDataURL(`image/${format}`, quality);
  }
}

// ============ 导出单例 ============

export const electronScaleService = new ElectronScaleService();
export const electronAppService = new ElectronAppService();
export const electronCameraService = new ElectronCameraService();

// 导出类供高级用法
export { ElectronScaleService, ElectronAppService, ElectronCameraService };
