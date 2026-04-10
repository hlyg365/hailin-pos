/**
 * 客显屏服务 v2.0
 * 负责管理客显屏窗口，包括：
 * - 多显示器检测（自动+手动）
 * - 打开/关闭客显屏窗口
 * - 将窗口定位到副屏
 * - 数据同步
 * - 支持Edge和安卓浏览器
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
  autoPosition: boolean;
  stayOnTop: boolean;
  silent: boolean;
  // 手动设置的副屏位置
  manualSecondaryPosition?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export interface CustomerDisplayState {
  isOpen: boolean;
  isOnSecondaryScreen: boolean;
  lastSyncTime: number;
  secondaryScreenInfo: {
    detected: boolean;
    method: 'auto' | 'manual' | 'default' | 'none';
    left: number;
    top: number;
    width: number;
    height: number;
  };
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
  secondaryScreenInfo: {
    detected: false,
    method: 'none',
    left: 1920, // 默认副屏在主屏右侧
    top: 0,
    width: 1280,
    height: 800,
  },
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
 * 检测是否为安卓/iOS设备
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 获取显示器信息（支持Edge和安卓）
 */
async function getScreenInfo(): Promise<{
  screens: ExtendedScreen[];
  primaryScreen: ExtendedScreen;
  secondaryScreens: ExtendedScreen[];
  detectionMethod: 'screen-details-api' | 'manual-config' | 'fallback';
}> {
  if (typeof window === 'undefined') {
    return { 
      screens: [], 
      primaryScreen: { width: 1920, height: 1080 }, 
      secondaryScreens: [],
      detectionMethod: 'fallback'
    };
  }

  // 尝试使用 Screen Details API (Chrome 100+, Edge 100+)
  if ('getScreenDetails' in window) {
    try {
      const screenDetails = await (window as any).getScreenDetails();
      const screens: ExtendedScreen[] = screenDetails.screens;
      const primaryScreen = screens.find((s: ExtendedScreen) => s.isPrimary) || screens[0];
      const secondaryScreens = screens.filter((s: ExtendedScreen) => !s.isPrimary);
      
      console.log('[CustomerDisplay] Screen Details API 检测到屏幕:', {
        total: screens.length,
        primary: primaryScreen.width + 'x' + primaryScreen.height,
        secondary: secondaryScreens.length,
      });
      
      return {
        screens,
        primaryScreen,
        secondaryScreens,
        detectionMethod: 'screen-details-api',
      };
    } catch (error) {
      console.warn('[CustomerDisplay] Screen Details API 不可用:', error);
    }
  }

  // 回退方案：使用 localStorage 中手动配置的副屏位置
  const manualConfig = localStorage.getItem('secondary_screen_config');
  if (manualConfig) {
    try {
      const parsed = JSON.parse(manualConfig);
      console.log('[CustomerDisplay] 使用手动配置的副屏位置:', parsed);
      return {
        screens: [
          { width: screen.width, height: screen.height, isPrimary: true },
          { ...parsed, isPrimary: false }
        ],
        primaryScreen: { width: screen.width, height: screen.height, isPrimary: true },
        secondaryScreens: [{ ...parsed, isPrimary: false }],
        detectionMethod: 'manual-config',
      };
    } catch (e) {
      console.warn('[CustomerDisplay] 手动配置解析失败:', e);
    }
  }

  // 最后的回退方案：假设副屏在主屏右侧
  const primaryScreen: ExtendedScreen = {
    width: screen.width,
    height: screen.height,
    left: 0,
    top: 0,
    availWidth: screen.width,
    availHeight: screen.height,
    availLeft: 0,
    availTop: 0,
    isPrimary: true,
  };
  
  // 保存默认副屏位置
  const defaultSecondary: ExtendedScreen = {
    width: 1280,
    height: 800,
    left: primaryScreen.width,
    top: 0,
    availWidth: 1280,
    availHeight: 800,
    availLeft: primaryScreen.width,
    availTop: 0,
    isPrimary: false,
  };
  
  console.log('[CustomerDisplay] 使用默认副屏位置（主屏右侧）:', defaultSecondary);
  
  return {
    screens: [primaryScreen, defaultSecondary],
    primaryScreen,
    secondaryScreens: [defaultSecondary],
    detectionMethod: 'fallback',
  };
}

/**
 * 获取副屏位置
 */
async function getSecondaryScreenPosition(): Promise<{
  left: number;
  top: number;
  width: number;
  height: number;
  method: 'auto' | 'manual' | 'default';
}> {
  const { secondaryScreens, primaryScreen, detectionMethod } = await getScreenInfo();
  
  // 1. 如果有检测到的副屏
  if (secondaryScreens.length > 0) {
    const secondary = secondaryScreens[0];
    return {
      left: secondary.availLeft ?? secondary.left ?? primaryScreen.width,
      top: secondary.availTop ?? secondary.top ?? 0,
      width: secondary.availWidth ?? secondary.width ?? DEFAULT_CONFIG.width,
      height: secondary.availHeight ?? secondary.height ?? DEFAULT_CONFIG.height,
      method: detectionMethod === 'manual-config' ? 'manual' : 'auto',
    };
  }
  
  // 2. 如果有手动配置的副屏位置
  if (config.manualSecondaryPosition) {
    return {
      ...config.manualSecondaryPosition,
      method: 'manual',
    };
  }
  
  // 3. 默认位置：主屏右侧
  return {
    left: primaryScreen.availWidth ?? primaryScreen.width,
    top: 0,
    width: DEFAULT_CONFIG.width,
    height: primaryScreen.availHeight ?? primaryScreen.height,
    method: 'default',
  };
}

/**
 * 设置手动副屏位置
 */
export function setManualSecondaryPosition(position: {
  left: number;
  top: number;
  width?: number;
  height?: number;
}): void {
  config.manualSecondaryPosition = {
    width: position.width || DEFAULT_CONFIG.width,
    height: position.height || DEFAULT_CONFIG.height,
    left: position.left,
    top: position.top,
  };
  
  // 保存到 localStorage
  localStorage.setItem('secondary_screen_config', JSON.stringify(config.manualSecondaryPosition));
  
  console.log('[CustomerDisplay] 已设置手动副屏位置:', config.manualSecondaryPosition);
}

/**
 * 获取当前副屏位置
 */
export async function getCurrentSecondaryPosition(): Promise<{
  left: number;
  top: number;
  width: number;
  height: number;
  method: 'auto' | 'manual' | 'default';
}> {
  return getSecondaryScreenPosition();
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
    const displayUrl = `${window.location.origin}/pos/customer-display`;
    
    // 获取副屏位置
    const position = await getSecondaryScreenPosition();
    state.secondaryScreenInfo = {
      detected: position.method !== 'default',
      method: position.method,
      left: position.left,
      top: position.top,
      width: position.width,
      height: position.height,
    };
    
    console.log('[CustomerDisplay] 准备打开客显屏:', {
      position,
      url: displayUrl,
      isMobile: isMobileDevice(),
    });
    
    // 构建窗口特性字符串
    let windowFeatures = `width=${config.width},height=${config.height}`;
    
    if (config.autoPosition && position) {
      windowFeatures += `,left=${position.left},top=${position.top}`;
      state.isOnSecondaryScreen = position.left > 0;
    }
    
    windowFeatures += ',menubar=no,toolbar=no,location=no,status=no,resizable=yes';
    
    // 打开新窗口
    customerWindow = window.open(displayUrl, 'customerDisplay', windowFeatures);
    
    if (!customerWindow) {
      // 被阻止了
      console.warn('[CustomerDisplay] 窗口被阻止');
      customerWindow = window.open(displayUrl, 'customerDisplay', 'width=1280,height=800');
      
      if (!customerWindow) {
        state.isOpen = false;
        state.isOnSecondaryScreen = false;
        notifyStateChange();
        return { success: false, message: '窗口被浏览器阻止，请允许弹出窗口', isOnSecondaryScreen: false };
      }
      
      // 窗口打开了但没有定位成功
      state.isOpen = true;
      state.isOnSecondaryScreen = false;
      notifyStateChange();
      
      return {
        success: true,
        message: '客显屏已打开（请手动拖动到副屏）',
        isOnSecondaryScreen: false,
      };
    }
    
    // 窗口已打开
    state.isOpen = true;
    notifyStateChange();
    
    // 保存状态
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
      position,
    });
    
    return {
      success: true,
      message: state.isOnSecondaryScreen ? '客显屏已打开到副屏' : '客显屏已打开（请手动拖动到副屏）',
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
    
    // 移动窗口
    customerWindow?.moveTo(position.left, position.top);
    customerWindow?.resizeTo(DEFAULT_CONFIG.width, DEFAULT_CONFIG.height);
    customerWindow?.focus();
    
    state.isOnSecondaryScreen = position.method !== 'default';
    state.secondaryScreenInfo = {
      detected: position.method !== 'default',
      ...position,
    };
    notifyStateChange();
    
    console.log('[CustomerDisplay] 窗口已移到副屏', position);
    
    return {
      success: true,
      message: position.method !== 'default' ? '窗口已移到副屏' : '窗口已移动（请确认位置是否正确）',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '移动窗口失败',
    };
  }
}

/**
 * 手动设置并移动到指定位置
 */
export async function moveToPosition(x: number, y: number, width?: number, height?: number): Promise<{
  success: boolean;
  message: string;
}> {
  if (!isCustomerDisplayOpen()) {
    return { success: false, message: '客显屏未打开' };
  }
  
  try {
    // 设置手动位置
    setManualSecondaryPosition({ left: x, top: y, width, height });
    
    // 移动窗口
    customerWindow?.moveTo(x, y);
    customerWindow?.resizeTo(width || DEFAULT_CONFIG.width, height || DEFAULT_CONFIG.height);
    customerWindow?.focus();
    
    state.isOnSecondaryScreen = true;
    state.secondaryScreenInfo = {
      detected: true,
      method: 'manual',
      left: x,
      top: y,
      width: width || DEFAULT_CONFIG.width,
      height: height || DEFAULT_CONFIG.height,
    };
    notifyStateChange();
    
    console.log('[CustomerDisplay] 窗口已移动到指定位置', { x, y, width, height });
    
    return {
      success: true,
      message: `窗口已移动到 (${x}, ${y})`,
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
    customerWindow?.postMessage({
      type: 'cart_update',
      data: cart,
      timestamp: Date.now(),
    }, '*');
  }
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
export function syncShopConfigToDisplay(shopConfig: unknown): void {
  if (isCustomerDisplayOpen()) {
    customerWindow?.postMessage({
      type: 'shop_config_update',
      data: shopConfig,
      timestamp: Date.now(),
    }, '*');
  }
  localStorage.setItem('pos_shop_config', JSON.stringify(shopConfig));
}

/**
 * 触发收款播报到客显屏
 */
export function announcePaymentToDisplay(amount: number, method: string): void {
  const paymentEvent = { amount, method, timestamp: Date.now() };
  
  if (isCustomerDisplayOpen()) {
    customerWindow?.postMessage({
      type: 'payment_announce',
      data: paymentEvent,
      timestamp: Date.now(),
    }, '*');
  }
  localStorage.setItem('pos_payment_event', JSON.stringify(paymentEvent));
}

/**
 * 请求客显屏权限（Screen Details API）
 */
export async function requestScreenPermission(): Promise<{
  success: boolean;
  method: string;
}> {
  if (typeof window === 'undefined') {
    return { success: false, method: 'none' };
  }
  
  // 检查是否支持 Screen Details API
  if (!('getScreenDetails' in window)) {
    console.warn('[CustomerDisplay] 浏览器不支持 Screen Details API');
    return { success: false, method: 'unsupported' };
  }
  
  try {
    await (window as any).getScreenDetails();
    console.log('[CustomerDisplay] Screen Details API 权限已获取');
    return { success: true, method: 'screen-details-api' };
  } catch (error: any) {
    console.error('[CustomerDisplay] Screen Details API 权限获取失败:', error);
    return { success: false, method: 'permission-denied' };
  }
}

/**
 * 检测屏幕信息
 */
export async function detectScreens(): Promise<{
  primaryScreen: { width: number; height: number };
  secondaryScreen: { width: number; height: number; left: number; top: number } | null;
  detectionMethod: 'auto' | 'manual' | 'default';
}> {
  const { primaryScreen, secondaryScreens, detectionMethod } = await getScreenInfo();
  
  // 转换检测方法到统一格式
  const methodMap: Record<string, 'auto' | 'manual' | 'default'> = {
    'screen-details-api': 'auto',
    'manual-config': 'manual',
    'fallback': 'default',
  };
  const normalizedMethod = methodMap[detectionMethod] || 'default';
  
  return {
    primaryScreen: {
      width: primaryScreen.width,
      height: primaryScreen.height,
    },
    secondaryScreen: secondaryScreens.length > 0 ? {
      width: secondaryScreens[0].width || DEFAULT_CONFIG.width,
      height: secondaryScreens[0].height || DEFAULT_CONFIG.height,
      left: secondaryScreens[0].left || primaryScreen.width,
      top: secondaryScreens[0].top || 0,
    } : null,
    detectionMethod: normalizedMethod,
  };
}

/**
 * 检查是否有副屏
 */
export async function hasSecondaryScreen(): Promise<boolean> {
  const { secondaryScreens } = await getScreenInfo();
  return secondaryScreens.length > 0;
}

/**
 * 获取主屏幕信息
 */
export function getPrimaryScreenInfo(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1920, height: 1080 };
  }
  return { width: screen.width, height: screen.height };
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
  moveToPosition: moveToPosition,
  setManualPosition: setManualSecondaryPosition,
  getCurrentPosition: getCurrentSecondaryPosition,
  syncCart: syncCartToDisplay,
  syncMember: syncMemberToDisplay,
  syncShopConfig: syncShopConfigToDisplay,
  announcePayment: announcePaymentToDisplay,
  requestPermission: requestScreenPermission,
  detectScreens,
  hasSecondary: hasSecondaryScreen,
  getPrimaryScreen: getPrimaryScreenInfo,
  addStateListener: addStateChangeListener,
};

export default customerDisplayService;
