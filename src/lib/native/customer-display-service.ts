/**
 * 客显屏服务 - 收银机专用
 * 
 * 支持接口：
 * - LVDS接口（低压差分信号，内置显示屏）
 * - eDP接口（嵌入式DisplayPort，内置显示屏）
 * - USB CDC（外置USB客显屏）
 * - HDMI/VGA（外接显示器）
 * 
 * 功能：
 * - 双屏异显（主屏+客显屏）
 * - 商品信息展示
 * - 收款信息展示
 * - 二维码展示
 * - 广告轮播
 */

// 屏幕类型
export type DisplayType = 'lvds' | 'edp' | 'usb_cdc' | 'hdmi' | 'built_in';

// 屏幕信息
export interface DisplayInfo {
  id: number;
  name: string;
  type: DisplayType;
  width: number;
  height: number;
  isPrimary: boolean;
  isExternal: boolean;
  available: boolean;
}

// 客显屏显示内容
export interface CustomerDisplayContent {
  // 商品信息
  productName?: string;
  productPrice?: number;
  productQuantity?: number;
  productWeight?: number;
  
  // 金额信息
  subtotal?: number;
  discount?: number;
  total?: number;
  payment?: number;
  change?: number;
  
  // 订单信息
  orderNo?: string;
  shopName?: string;
  
  // 状态信息
  message?: string;
  status?: 'waiting' | 'scanning' | 'payment' | 'success' | 'error';
  
  // 二维码
  qrcodeUrl?: string;
  qrcodeAmount?: number;
  
  // 自定义内容
  customLines?: string[];
}

// 客显屏服务
export class CustomerDisplayService {
  private static instance: CustomerDisplayService;
  private displays: DisplayInfo[] = [];
  private activeDisplay: DisplayInfo | null = null;
  private currentContent: CustomerDisplayContent = {};
  private presentation: any = null; // Android Presentation API
  private webWindow: Window | null = null; // Web双窗口模式
  
  private constructor() {}
  
  public static getInstance(): CustomerDisplayService {
    if (!CustomerDisplayService.instance) {
      CustomerDisplayService.instance = new CustomerDisplayService();
    }
    return CustomerDisplayService.instance;
  }
  
  /**
   * 获取可用屏幕列表
   */
  async getDisplays(): Promise<DisplayInfo[]> {
    // Android原生实现
    const plugin = (window as any).Capacitor?.Plugins?.DualScreen;
    if (plugin) {
      try {
        const result = await plugin.getDisplays();
        if (result.success && result.displays) {
          this.displays = result.displays.map((d: any, index: number) => ({
            id: d.id || index,
            name: d.name || `屏幕 ${index + 1}`,
            type: d.type || 'built_in',
            width: d.width || 1920,
            height: d.height || 1080,
            isPrimary: index === 0,
            isExternal: index > 0,
            available: true,
          }));
          return this.displays;
        }
      } catch (error) {
        console.error('[CustomerDisplayService] getDisplays error:', error);
      }
    }
    
    // Web环境下检测多显示器
    if (typeof screen !== 'undefined' && 'availWidth' in screen) {
      this.displays = [
        {
          id: 0,
          name: '主屏',
          type: 'built_in',
          width: screen.width,
          height: screen.height,
          isPrimary: true,
          isExternal: false,
          available: true,
        },
      ];
    }
    
    return this.displays;
  }
  
  /**
   * 打开客显屏
   * @param displayId 屏幕ID（0=主屏，1+=副屏）
   */
  async open(displayId: number = 1): Promise<boolean> {
    // 获取可用屏幕
    if (this.displays.length === 0) {
      await this.getDisplays();
    }
    
    const display = this.displays.find(d => d.id === displayId) || this.displays[1];
    if (!display) {
      console.warn('[CustomerDisplayService] No secondary display available');
      return false;
    }
    
    // Android Presentation模式
    const plugin = (window as any).Capacitor?.Plugins?.DualScreen;
    if (plugin) {
      try {
        const result = await plugin.open({ displayId: display.id });
        if (result.success) {
          this.activeDisplay = display;
          return true;
        }
      } catch (error) {
        console.error('[CustomerDisplayService] open error:', error);
      }
    }
    
    // Web窗口模式（在新窗口中显示）
    if (typeof window !== 'undefined') {
      try {
        // 尝试打开新窗口作为客显屏
        this.webWindow = window.open(
          '/pos/customer-display',
          'CustomerDisplay',
          'width=400,height=300,left=1000,top=100'
        );
        
        if (this.webWindow) {
          this.activeDisplay = display;
          return true;
        }
      } catch (error) {
        console.error('[CustomerDisplayService] Web window error:', error);
      }
    }
    
    return false;
  }
  
  /**
   * 关闭客显屏
   */
  async close(): Promise<void> {
    const plugin = (window as any).Capacitor?.Plugins?.DualScreen;
    if (plugin) {
      try {
        await plugin.close();
      } catch (error) {
        console.error('[CustomerDisplayService] close error:', error);
      }
    }
    
    if (this.webWindow) {
      this.webWindow.close();
      this.webWindow = null;
    }
    
    this.activeDisplay = null;
    this.currentContent = {};
  }
  
  /**
   * 发送数据到客显屏
   */
  async sendData(content: CustomerDisplayContent): Promise<boolean> {
    this.currentContent = { ...this.currentContent, ...content };
    
    const plugin = (window as any).Capacitor?.Plugins?.DualScreen;
    if (plugin) {
      try {
        const result = await plugin.sendData(this.currentContent);
        return result.success;
      } catch (error) {
        console.error('[CustomerDisplayService] sendData error:', error);
      }
    }
    
    // Web模式：通过postMessage发送到客显窗口
    if (this.webWindow && !this.webWindow.closed) {
      this.webWindow.postMessage({ type: 'display-update', data: this.currentContent }, '*');
      return true;
    }
    
    // 模拟模式：记录日志
    console.log('[CustomerDisplayService] Display update:', this.currentContent);
    return true;
  }
  
  /**
   * 显示等待付款界面
   */
  async showWaitingPayment(total: number, shopName?: string): Promise<boolean> {
    return this.sendData({
      total,
      shopName,
      status: 'waiting',
      message: '请付款',
    });
  }
  
  /**
   * 显示收款信息
   */
  async showPayment(total: number, payment: number): Promise<boolean> {
    return this.sendData({
      total,
      payment,
      status: 'payment',
      message: '收款中',
    });
  }
  
  /**
   * 显示付款成功界面
   */
  async showPaymentSuccess(total: number, payment: number, change: number): Promise<boolean> {
    return this.sendData({
      total,
      payment,
      change,
      status: 'success',
      message: '付款成功',
    });
  }
  
  /**
   * 显示商品信息
   */
  async showProduct(name: string, price: number, quantity?: number, weight?: number): Promise<boolean> {
    return this.sendData({
      productName: name,
      productPrice: price,
      productQuantity: quantity,
      productWeight: weight,
      status: 'scanning',
      message: '扫码商品',
    });
  }
  
  /**
   * 显示二维码
   */
  async showQRCode(url: string, amount: number): Promise<boolean> {
    return this.sendData({
      qrcodeUrl: url,
      qrcodeAmount: amount,
      status: 'waiting',
      message: '扫码支付',
    });
  }
  
  /**
   * 显示错误信息
   */
  async showError(message: string): Promise<boolean> {
    return this.sendData({
      status: 'error',
      message,
    });
  }
  
  /**
   * 显示自定义内容
   */
  async showCustom(lines: string[]): Promise<boolean> {
    return this.sendData({
      customLines: lines,
    });
  }
  
  /**
   * 清除显示内容
   */
  async clear(): Promise<boolean> {
    this.currentContent = {};
    return this.sendData({});
  }
  
  /**
   * 获取当前显示内容
   */
  getCurrentContent(): CustomerDisplayContent {
    return { ...this.currentContent };
  }
  
  /**
   * 获取客显屏状态
   */
  getStatus(): { open: boolean; display?: DisplayInfo; content?: CustomerDisplayContent } {
    return {
      open: this.activeDisplay !== null,
      display: this.activeDisplay || undefined,
      content: Object.keys(this.currentContent).length > 0 ? this.currentContent : undefined,
    };
  }
  
  /**
   * 刷新客显屏
   */
  async refresh(): Promise<void> {
    if (this.activeDisplay) {
      await this.sendData(this.currentContent);
    }
  }
}

// 导出单例
export const customerDisplayService = CustomerDisplayService.getInstance();
export default customerDisplayService;
