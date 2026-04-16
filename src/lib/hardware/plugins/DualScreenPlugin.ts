/**
 * 双屏插件 - DualScreenPlugin
 * 提供收银双屏显示控制
 * 客显屏显示商品信息和价格，导购屏显示广告和促销
 */

// 双屏类型
export type ScreenType = 'customer' | 'merchant' | 'advertisement';

// 显示内容类型
export type DisplayContentType = 
  | 'welcome' 
  | 'product' 
  | 'price' 
  | 'qrcode' 
  | 'advertisement' 
  | 'message'
  | 'idle';

// 双屏配置
export interface DualScreenConfig {
  enabled: boolean;
  defaultScreen: ScreenType;
  brightness: number; // 0-100
  autoRotate: boolean;
  rotateInterval: number; // 秒
}

// 双屏显示内容
export interface DisplayContent {
  type: DisplayContentType;
  title?: string;
  subtitle?: string;
  lines?: string[];
  amount?: number;
  qrcodeData?: string;
  imageUrl?: string;
  duration?: number; // 显示时长，毫秒
}

// 双屏插件类
class DualScreenPlugin {
  private config: DualScreenConfig;
  private isActive: boolean = false;
  private currentScreen: ScreenType = 'customer';
  private messageChannel: MessageChannel | null = null;
  private static instance: DualScreenPlugin;

  private constructor() {
    this.config = {
      enabled: false,
      defaultScreen: 'customer',
      brightness: 100,
      autoRotate: false,
      rotateInterval: 10,
    };
  }

  // 获取单例实例
  static getInstance(): DualScreenPlugin {
    if (!DualScreenPlugin.instance) {
      DualScreenPlugin.instance = new DualScreenPlugin();
    }
    return DualScreenPlugin.instance;
  }

  // 检查是否支持
  isSupported(): boolean {
    // 检查是否支持双屏API或有多屏幕
    if ('getScreenDetails' in window) {
      return true;
    }
    // 模拟支持（开发环境）
    return true;
  }

  // 获取配置
  getConfig(): DualScreenConfig {
    return { ...this.config };
  }

  // 设置配置
  async setConfig(config: Partial<DualScreenConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    if (config.brightness !== undefined) {
      // 设置屏幕亮度（如果支持）
      this.setBrightness(config.brightness);
    }
  }

  // 获取当前屏幕
  getCurrentScreen(): ScreenType {
    return this.currentScreen;
  }

  // 设置当前屏幕
  setCurrentScreen(screen: ScreenType): void {
    this.currentScreen = screen;
    console.log(`DualScreen: Switched to ${screen} screen`);
  }

  // 设置屏幕亮度
  private setBrightness(brightness: number): void {
    // 实际需要通过原生插件或WebAPI设置
    console.log(`DualScreen: Setting brightness to ${brightness}%`);
  }

  // 初始化双屏
  async initialize(): Promise<boolean> {
    try {
      // 尝试获取多屏幕信息
      if ('getScreenDetails' in window) {
        try {
          const screens = await (window as any).getScreenDetails();
          console.log('Available screens:', screens.screens.length);
          
          // 检查是否有多个屏幕
          if (screens.screens.length < 2) {
            console.warn('DualScreen: Only one screen available');
          }
        } catch (e) {
          console.warn('DualScreen: Could not get screen details');
        }
      }

      // 创建消息通道用于双屏通信
      this.messageChannel = new MessageChannel();
      
      this.isActive = true;
      console.log('DualScreen: Initialized successfully');
      return true;
    } catch (error) {
      console.error('DualScreen: Failed to initialize', error);
      return false;
    }
  }

  // 打开双屏窗口
  async openScreen(screenType: ScreenType = 'customer'): Promise<Window | null> {
    if (!this.isSupported()) {
      console.error('DualScreen: Not supported');
      return null;
    }

    try {
      // 打开客显屏窗口
      const screenWindow = window.open(
        `/pos/dual-screen?type=${screenType}`,
        'CustomerDisplay',
        'width=400,height=300,left=100,top=100,menubar=no,toolbar=no'
      );

      if (screenWindow) {
        this.currentScreen = screenType;
        this.isActive = true;
        return screenWindow;
      }

      return null;
    } catch (error) {
      console.error('DualScreen: Failed to open screen', error);
      return null;
    }
  }

  // 关闭双屏窗口
  closeScreen(): void {
    // 关闭通过openScreen打开的窗口
    // 实际需要保存窗口引用
    this.isActive = false;
    console.log('DualScreen: Screen closed');
  }

  // 显示欢迎信息
  async showWelcome(): Promise<void> {
    await this.display({
      type: 'welcome',
      title: '欢迎光临',
      subtitle: '海邻到家便利店',
      lines: ['请扫描商品', '或输入条码'],
    });
  }

  // 显示商品信息
  async showProduct(name: string, price: number): Promise<void> {
    await this.display({
      type: 'product',
      title: name,
      amount: price,
      lines: [
        `单价: ¥${price.toFixed(2)}`,
        '请放置商品',
      ],
    });
  }

  // 显示价格
  async showPrice(amount: number, change?: number): Promise<void> {
    const content: DisplayContent = {
      type: 'price',
      title: '应付金额',
      amount: amount,
    };

    if (change !== undefined) {
      content.lines = [`找零: ¥${change.toFixed(2)}`];
    }

    await this.display(content);
  }

  // 显示二维码
  async showQRCode(data: string, title: string = '扫码支付'): Promise<void> {
    await this.display({
      type: 'qrcode',
      title: title,
      qrcodeData: data,
      lines: ['请使用微信/支付宝', '扫描二维码支付'],
    });
  }

  // 显示广告
  async showAdvertisement(imageUrl?: string): Promise<void> {
    await this.display({
      type: 'advertisement',
      imageUrl: imageUrl || '/images/promotion-default.jpg',
    });
  }

  // 显示消息
  async showMessage(title: string, message: string, duration?: number): Promise<void> {
    await this.display({
      type: 'message',
      title,
      subtitle: message,
      duration,
    });
  }

  // 显示闲置画面
  async showIdle(): Promise<void> {
    await this.display({
      type: 'idle',
      title: '海邻到家',
      subtitle: '便民服务就在身边',
      lines: ['扫码支付', '方便快捷'],
    });
  }

  // 通用显示方法
  async display(content: DisplayContent): Promise<void> {
    if (!this.isActive) {
      console.warn('DualScreen: Not active');
      return;
    }

    // 通过postMessage发送到双屏窗口
    // 实际需要保存窗口引用
    if (this.messageChannel) {
      // 如果有打开的双屏窗口，发送消息
      // window.postMessage({ type: 'dualScreen', content }, '*');
    }

    console.log('DualScreen: Displaying', content.type, content);
  }

  // 清屏
  async clear(): Promise<void> {
    await this.showIdle();
  }

  // 获取状态
  getStatus(): { active: boolean; screen: ScreenType; config: DualScreenConfig } {
    return {
      active: this.isActive,
      screen: this.currentScreen,
      config: this.config,
    };
  }

  // 销毁
  destroy(): void {
    this.closeScreen();
    if (this.messageChannel) {
      this.messageChannel.port1.close();
      this.messageChannel.port2.close();
      this.messageChannel = null;
    }
    this.isActive = false;
  }
}

// 导出单例和类
export const dualScreenPlugin = DualScreenPlugin.getInstance();
export { DualScreenPlugin };
