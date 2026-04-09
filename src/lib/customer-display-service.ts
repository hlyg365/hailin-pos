/**
 * 客显屏服务
 * 负责管理客显屏窗口，包括：
 * - 检测多显示器
 * - 打开/关闭客显屏窗口
 * - 将窗口定位到副屏
 * - 数据同步
 */

// 扩展 Screen 类型以支持 Screen Details API
interface ExtendedScreen {
  width: number;
  height: number;
  left?: number;
  top?: number;
  availWidth?: number;
  availHeight?: number;
  availLeft?: number;
  availTop?: number;
  isPrimary?: boolean;
}

export interface CustomerDisplayConfig {
  width: number;
  height: number;
  autoPosition: boolean; // 自动定位到副屏
  stayOnTop: boolean;
  silent: boolean;
}

export interface CustomerDisplayState {
  isOpen: boolean;
  isOnSecondaryScreen: boolean;
  lastSyncTime: number;
}

// 默认配置
const DEFAULT_CONFIG: CustomerDisplayConfig = {
  width: 1280,
  height: 800,
  autoPosition: true,
  stayOnTop: true,
  silent: true,
};

// 服务状态
let customerWindow: Window | null = null;
let config: CustomerDisplayConfig = { ...DEFAULT_CONFIG };
let state: CustomerDisplayState = {
  isOpen: false,
  isOnSecondaryScreen: false,
  lastSyncTime: 0,
};

// 监听器
type StateChangeListener = (state: CustomerDisplayState) => void;
const listeners: Set<StateChangeListener> = new Set();

/**
 * 通知状态变化
 */
function notifyStateChange() {
  state.lastSyncTime = Date.now();
  listeners.forEach(listener => listener({ ...state }));
}

/**
 * 获取显示器信息
 */
async function getScreenInfo(): Promise<{
  screens: ExtendedScreen[];
  primaryScreen: ExtendedScreen;
  secondaryScreens: ExtendedScreen[];
}> {
  if (typeof window === 'undefined') {
    return { screens: [], primaryScreen: { width: 1920, height: 1080 }, secondaryScreens: [] };
  }

  // 尝试使用 Screen Details API (Chrome 100+)
  if ('getScreenDetails' in window) {
    try {
      const screenDetails = await (window as any).getScreenDetails();
      const screens: ExtendedScreen[] = screenDetails.screens;
      const primaryScreen = screens.find((s: ExtendedScreen) => s.isPrimary) || screens[0];
      const secondaryScreens = screens.filter((s: ExtendedScreen) => !s.isPrimary);
      
      return {
        screens,
        primaryScreen,
        secondaryScreens,
      };
    } catch (error) {
      console.warn('[CustomerDisplay] Screen Details API 不可用:', error);
    }
  }

  // 回退方案：使用基本 screen 对象
  const primaryScreen: ExtendedScreen = {
    width: screen.width,
    height: screen.height,
    availWidth: screen.width,
    availHeight: screen.height,
    availLeft: 0,
    availTop: 0,
    isPrimary: true,
  };
  
  return {
    screens: [primaryScreen],
    primaryScreen,
    secondaryScreens: [],
  };
}

/**
 * 获取副屏位置
 */
async function getSecondaryScreenPosition(): Promise<{ left: number; top: number; width: number; height: number } | null> {
  const { secondaryScreens, primaryScreen } = await getScreenInfo();
  
  if (secondaryScreens.length > 0) {
    const secondary = secondaryScreens[0];
    return {
      left: secondary.availLeft ?? secondary.left ?? 0,
      top: secondary.availTop ?? secondary.top ?? 0,
      width: secondary.availWidth ?? secondary.width ?? DEFAULT_CONFIG.width,
      height: secondary.availHeight ?? secondary.height ?? DEFAULT_CONFIG.height,
    };
  }
  
  // 如果没有副屏，将窗口移到主屏右侧
  return {
    left: primaryScreen.availWidth ?? primaryScreen.width,
    top: 0,
    width: DEFAULT_CONFIG.width,
    height: primaryScreen.availHeight ?? primaryScreen.height,
  };
}

/**
 * 打开客显屏窗口
 */
export async function openCustomerDisplay(customConfig?: Partial<CustomerDisplayConfig>): Promise<{
  success: boolean;
  message: string;
  isOnSecondaryScreen: boolean;
}> {
  if (typeof window === 'undefined') {
    return { success: false, message: '非浏览器环境', isOnSecondaryScreen: false };
  }

  // 合并配置
  config = { ...config, ...customConfig };

  // 如果窗口已存在，先关闭
  if (customerWindow && !customerWindow.closed) {
    customerWindow.close();
    customerWindow = null;
  }

  try {
    // 获取客显屏URL
    const displayUrl = `${window.location.origin}/pos/customer-display`;
    
    // 构建窗口特性字符串
    let windowFeatures = `width=${config.width},height=${config.height}`;
    
    if (config.autoPosition) {
      // 尝试定位到副屏
      const position = await getSecondaryScreenPosition();
      if (position) {
        windowFeatures += `,left=${position.left},top=${position.top}`;
        state.isOnSecondaryScreen = position.left > 0;
      }
    }
    
    windowFeatures += ',menubar=no,toolbar=no,location=no,status=no';
    
    if (config.stayOnTop) {
      windowFeatures += ',alwaysRaised=yes';
    }
    
    if (config.silent) {
      windowFeatures += ',silent=yes';
    }
    
    // 打开新窗口
    customerWindow = window.open(displayUrl, 'customerDisplay', windowFeatures);
    
    if (!customerWindow) {
      // 可能是被浏览器阻止了
      console.warn('[CustomerDisplay] 窗口被阻止，尝试不带位置信息');
      customerWindow = window.open(displayUrl, 'customerDisplay', 'width=1280,height=800');
      
      if (!customerWindow) {
        state.isOpen = false;
        state.isOnSecondaryScreen = false;
        notifyStateChange();
        return { success: false, message: '窗口被浏览器阻止，请允许弹出窗口', isOnSecondaryScreen: false };
      }
    }
    
    // 窗口已打开
    state.isOpen = true;
    notifyStateChange();
    
    // 保存状态到 localStorage
    localStorage.setItem('customer_display_open', 'true');
    
    // 监听窗口关闭
    customerWindow.addEventListener('unload', () => {
      state.isOpen = false;
      state.isOnSecondaryScreen = false;
      customerWindow = null;
      localStorage.setItem('customer_display_open', 'false');
      notifyStateChange();
    });
    
    console.log('[CustomerDisplay] 客显屏已打开', {
      isOnSecondaryScreen: state.isOnSecondaryScreen,
      url: displayUrl,
    });
    
    return {
      success: true,
      message: state.isOnSecondaryScreen ? '客显屏已打开到副屏' : '客显屏已打开',
      isOnSecondaryScreen: state.isOnSecondaryScreen,
    };
    
  } catch (error: any) {
    console.error('[CustomerDisplay] 打开客显屏失败:', error);
    state.isOpen = false;
    state.isOnSecondaryScreen = false;
    notifyStateChange();
    
    return {
      success: false,
      message: error.message || '打开客显屏失败',
      isOnSecondaryScreen: false,
    };
  }
}

/**
 * 关闭客显屏窗口
 */
export function closeCustomerDisplay(): void {
  if (customerWindow && !customerWindow.closed) {
    customerWindow.close();
    customerWindow = null;
  }
  
  state.isOpen = false;
  state.isOnSecondaryScreen = false;
  localStorage.setItem('customer_display_open', 'false');
  notifyStateChange();
  
  console.log('[CustomerDisplay] 客显屏已关闭');
}

/**
 * 获取客显屏状态
 */
export function getCustomerDisplayState(): CustomerDisplayState {
  return { ...state };
}

/**
 * 检查客显屏窗口是否存在
 */
export function isCustomerDisplayOpen(): boolean {
  return customerWindow !== null && !customerWindow.closed;
}

/**
 * 将客显屏窗口移到副屏
 */
export async function moveToSecondaryScreen(): Promise<{
  success: boolean;
  message: string;
}> {
  if (!isCustomerDisplayOpen()) {
    return { success: false, message: '客显屏未打开' };
  }
  
  try {
    const position = await getSecondaryScreenPosition();
    if (!position) {
      return { success: false, message: '未检测到副屏' };
    }
    
    customerWindow?.moveTo(position.left, position.top);
    customerWindow?.resizeTo(DEFAULT_CONFIG.width, DEFAULT_CONFIG.height);
    
    state.isOnSecondaryScreen = true;
    notifyStateChange();
    
    console.log('[CustomerDisplay] 窗口已移到副屏', position);
    
    return {
      success: true,
      message: '窗口已移到副屏',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '移动窗口失败',
    };
  }
}

/**
 * 同步购物车数据到客显屏
 */
export function syncCartToDisplay(cart: unknown[]): void {
  if (isCustomerDisplayOpen()) {
    // 通过 postMessage 发送数据
    customerWindow?.postMessage({
      type: 'cart_update',
      data: cart,
      timestamp: Date.now(),
    }, '*');
  }
  
  // 同时保存到 localStorage 作为备用
  localStorage.setItem('pos_cart', JSON.stringify(cart));
}

/**
 * 同步会员数据到客显屏
 */
export function syncMemberToDisplay(member: unknown): void {
  if (isCustomerDisplayOpen()) {
    customerWindow?.postMessage({
      type: 'member_update',
      data: member,
      timestamp: Date.now(),
    }, '*');
  }
  
  localStorage.setItem('pos_member', JSON.stringify(member));
}

/**
 * 同步店铺配置到客显屏
 */
export function syncShopConfigToDisplay(config: unknown): void {
  if (isCustomerDisplayOpen()) {
    customerWindow?.postMessage({
      type: 'shop_config_update',
      data: config,
      timestamp: Date.now(),
    }, '*');
  }
  
  localStorage.setItem('pos_shop_config', JSON.stringify(config));
}

/**
 * 触发收款播报到客显屏
 */
export function announcePaymentToDisplay(amount: number, method: string): void {
  const paymentEvent = {
    amount,
    method,
    timestamp: Date.now(),
  };
  
  if (isCustomerDisplayOpen()) {
    customerWindow?.postMessage({
      type: 'payment_announce',
      data: paymentEvent,
      timestamp: Date.now(),
    }, '*');
  }
  
  // 同时保存到 localStorage
  localStorage.setItem('pos_payment_event', JSON.stringify(paymentEvent));
}

/**
 * 请求客显屏权限（Screen Details API）
 */
export async function requestScreenPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  // 检查是否支持 Screen Details API
  if (!('getScreenDetails' in window)) {
    console.warn('[CustomerDisplay] 浏览器不支持 Screen Details API');
    return false;
  }
  
  try {
    await (window as any).getScreenDetails();
    console.log('[CustomerDisplay] Screen Details API 权限已获取');
    return true;
  } catch (error) {
    console.error('[CustomerDisplay] Screen Details API 权限获取失败:', error);
    return false;
  }
}

/**
 * 检查是否有副屏
 */
export async function hasSecondaryScreen(): Promise<boolean> {
  const { secondaryScreens } = await getScreenInfo();
  return secondaryScreens.length > 0;
}

/**
 * 监听状态变化
 */
export function addStateChangeListener(listener: StateChangeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * 导出单例对象
 */
export const customerDisplayService = {
  open: openCustomerDisplay,
  close: closeCustomerDisplay,
  getState: getCustomerDisplayState,
  isOpen: isCustomerDisplayOpen,
  moveToSecondary: moveToSecondaryScreen,
  syncCart: syncCartToDisplay,
  syncMember: syncMemberToDisplay,
  syncShopConfig: syncShopConfigToDisplay,
  announcePayment: announcePaymentToDisplay,
  requestPermission: requestScreenPermission,
  hasSecondary: hasSecondaryScreen,
  addStateListener: addStateChangeListener,
};

export default customerDisplayService;
