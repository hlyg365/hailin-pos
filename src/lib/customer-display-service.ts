/**
 * 客显屏服务 v3.0
 * 修复问题：
 * 1. 主屏副屏数据检测问题
 * 2. 窗口打开覆盖收银台问题
 * 3. 增强UI交互
 */

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

export interface ScreenInfo {
  primaryScreen: {
    width: number;
    height: number;
    left: number;
    top: number;
  };
  secondaryScreen: {
    width: number;
    height: number;
    left: number;
    top: number;
  } | null;
  detectionMethod: 'auto' | 'manual' | 'default';
}

const DEFAULT_CONFIG: CustomerDisplayConfig = {
  width: 1280,
  height: 800,
  autoPosition: true,
  stayOnTop: true,
  silent: true,
};

// 使用唯一ID避免窗口被替换
const CUSTOMER_DISPLAY_WINDOW_ID = 'hailin_customer_display_' + Date.now();

let customerWindow: Window | null = null;
let config: CustomerDisplayConfig = { ...DEFAULT_CONFIG };
let state: CustomerDisplayState = {
  isOpen: false,
  isOnSecondaryScreen: false,
  lastSyncTime: 0,
  secondaryScreenInfo: {
    detected: false,
    method: 'none',
    left: 0,
    top: 0,
    width: 1280,
    height: 800,
  },
};

type StateChangeListener = (state: CustomerDisplayState) => void;
const listeners: Set<StateChangeListener> = new Set();

function notifyStateChange() {
  state.lastSyncTime = Date.now();
  listeners.forEach(listener => listener({ ...state }));
}

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 检测屏幕信息
 */
export async function detectScreensInfo(): Promise<ScreenInfo> {
  if (typeof window === 'undefined') {
    return {
      primaryScreen: { width: 1920, height: 1080, left: 0, top: 0 },
      secondaryScreen: null,
      detectionMethod: 'default',
    };
  }

  let primary: ExtendedScreen = { width: screen.width, height: screen.height, left: 0, top: 0, isPrimary: true };
  let secondary: ExtendedScreen | null = null;
  let method: 'auto' | 'manual' | 'default' = 'default';

  // 1. 尝试 Screen Details API
  if ('getScreenDetails' in window) {
    try {
      const screenDetails = await (window as any).getScreenDetails();
      const screens: ExtendedScreen[] = screenDetails.screens;
      
      // 找到主屏（通常是包含当前窗口的屏幕）
      const currentScreen = screens.find(s => {
        const left = s.availLeft ?? s.left ?? 0;
        const top = s.availTop ?? s.top ?? 0;
        return window.screenX >= left && window.screenX < left + s.width &&
               window.screenY >= top && window.screenY < top + s.height;
      }) || screens.find(s => s.isPrimary);
      
      primary = currentScreen || screens[0];
      primary.isPrimary = true;
      
      // 其他屏幕都是副屏
      secondary = screens.find(s => s !== primary && !s.isPrimary) || null;
      
      // 如果只有一个屏幕，创建一个虚拟副屏
      if (!secondary && screens.length === 1) {
        secondary = {
          width: DEFAULT_CONFIG.width,
          height: DEFAULT_CONFIG.height,
          left: (primary.availWidth ?? primary.width) || 1920,
          top: 0,
          isPrimary: false,
        };
      }
      
      method = 'auto';
      console.log('[CustomerDisplay] Screen Details API 检测结果:', {
        primary: `${primary.width}x${primary.height} @ (${primary.left}, ${primary.top})`,
        secondary: secondary ? `${secondary.width}x${secondary.height} @ (${secondary.left}, ${secondary.top})` : 'null',
      });
      
      return {
        primaryScreen: {
          width: primary.width,
          height: primary.height,
          left: primary.left ?? primary.availLeft ?? 0,
          top: primary.top ?? primary.availTop ?? 0,
        },
        secondaryScreen: secondary ? {
          width: secondary.width || DEFAULT_CONFIG.width,
          height: secondary.height || DEFAULT_CONFIG.height,
          left: secondary.left ?? secondary.availLeft ?? ((primary.availWidth ?? primary.width) || 1920),
          top: secondary.top ?? secondary.availTop ?? 0,
        } : null,
        detectionMethod: method,
      };
    } catch (error) {
      console.warn('[CustomerDisplay] Screen Details API 失败:', error);
    }
  }

  // 2. 检查手动配置的副屏
  const manualConfig = localStorage.getItem('secondary_screen_config');
  if (manualConfig) {
    try {
      const parsed = JSON.parse(manualConfig);
      secondary = { ...parsed, isPrimary: false };
      method = 'manual';
      console.log('[CustomerDisplay] 使用手动配置的副屏:', secondary);
    } catch (e) {
      console.warn('[CustomerDisplay] 手动配置解析失败');
    }
  }

  // 3. 默认副屏位置（主屏右侧）
  if (!secondary) {
    const primaryWidth = primary.availWidth ?? primary.width;
    secondary = {
      width: DEFAULT_CONFIG.width,
      height: DEFAULT_CONFIG.height,
      left: primaryWidth,
      top: 0,
      isPrimary: false,
    };
    console.log('[CustomerDisplay] 使用默认副屏位置:', secondary);
  }

  return {
    primaryScreen: {
      width: primary.width,
      height: primary.height,
      left: primary.left ?? primary.availLeft ?? 0,
      top: primary.top ?? primary.availTop ?? 0,
    },
    secondaryScreen: {
      width: secondary.width,
      height: secondary.height,
      left: secondary.left ?? secondary.availLeft ?? ((primary.availWidth ?? primary.width) || 1920),
      top: secondary.top ?? secondary.availTop ?? 0,
    },
    detectionMethod: method,
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
  localStorage.setItem('secondary_screen_config', JSON.stringify(config.manualSecondaryPosition));
  console.log('[CustomerDisplay] 已设置手动副屏位置:', config.manualSecondaryPosition);
}

/**
 * 打开客显屏窗口 - 关键修复：确保在新窗口/新标签页中打开
 */
export async function openCustomerDisplay(customConfig?: Partial<CustomerDisplayConfig>): Promise<{
  success: boolean;
  message: string;
  isOnSecondaryScreen: boolean;
}> {
  if (typeof window === 'undefined') {
    return { success: false, message: '非浏览器环境', isOnSecondaryScreen: false };
  }

  config = { ...config, ...customConfig };

  // 如果窗口已存在，先关闭
  if (customerWindow && !customerWindow.closed) {
    customerWindow.close();
    customerWindow = null;
  }

  try {
    const displayUrl = `${window.location.origin}/pos/customer-display`;
    
    // 检测屏幕信息
    const screenInfo = await detectScreensInfo();
    state.secondaryScreenInfo = {
      detected: screenInfo.secondaryScreen !== null,
      method: screenInfo.detectionMethod,
      left: screenInfo.secondaryScreen?.left || 0,
      top: screenInfo.secondaryScreen?.top || 0,
      width: screenInfo.secondaryScreen?.width || DEFAULT_CONFIG.width,
      height: screenInfo.secondaryScreen?.height || DEFAULT_CONFIG.height,
    };

    console.log('[CustomerDisplay] 打开客显屏，屏幕信息:', screenInfo);
    console.log('[CustomerDisplay] 目标副屏位置:', state.secondaryScreenInfo);

    // 构建窗口特性
    const windowFeatures: string[] = [];
    windowFeatures.push(`width=${config.width}`);
    windowFeatures.push(`height=${config.height}`);
    
    // 设置窗口位置到副屏
    if (screenInfo.secondaryScreen) {
      windowFeatures.push(`left=${screenInfo.secondaryScreen.left}`);
      windowFeatures.push(`top=${screenInfo.secondaryScreen.top}`);
      state.isOnSecondaryScreen = screenInfo.secondaryScreen.left !== 0 || screenInfo.secondaryScreen.top !== 0;
    }
    
    // 其他窗口特性
    windowFeatures.push('menubar=no');
    windowFeatures.push('toolbar=no');
    windowFeatures.push('location=no');
    windowFeatures.push('status=no');
    windowFeatures.push('resizable=yes');
    windowFeatures.push('scrollbars=no');
    
    if (config.stayOnTop) {
      windowFeatures.push('alwaysRaised=yes');
    }

    const featuresString = windowFeatures.join(',');
    
    console.log('[CustomerDisplay] 窗口特性:', featuresString);

    // 使用随机窗口名称确保打开新窗口，而不是替换已有窗口
    const windowName = 'hailin_pos_customer_display_' + Math.random().toString(36).substr(2, 9);
    
    // 打开新窗口
    customerWindow = window.open(displayUrl, windowName, featuresString);

    if (!customerWindow) {
      // 被阻止了，尝试更简单的方式
      console.warn('[CustomerDisplay] 标准窗口打开失败，尝试备用方式');
      
      // 使用 _blank 强制在新标签页打开
      customerWindow = window.open(displayUrl, '_blank', featuresString);
      
      if (!customerWindow) {
        // 完全被阻止
        state.isOpen = false;
        state.isOnSecondaryScreen = false;
        notifyStateChange();
        
        return { 
          success: false, 
          message: '窗口被浏览器阻止！请允许弹出窗口，然后重试。\n\n如果浏览器弹出拦截，请点击地址栏的"始终允许"选项。', 
          isOnSecondaryScreen: false 
        };
      }
    }

    // 窗口已打开
    state.isOpen = true;
    notifyStateChange();
    localStorage.setItem('customer_display_open', 'true');

    // 监听窗口关闭
    const checkClosed = setInterval(() => {
      if (customerWindow?.closed) {
        clearInterval(checkClosed);
        state.isOpen = false;
        state.isOnSecondaryScreen = false;
        customerWindow = null;
        localStorage.setItem('customer_display_open', 'false');
        notifyStateChange();
        console.log('[CustomerDisplay] 客显屏窗口已关闭');
      }
    }, 500);

    console.log('[CustomerDisplay] 客显屏已打开', {
      isOnSecondaryScreen: state.isOnSecondaryScreen,
      windowName,
    });

    return {
      success: true,
      message: state.isOnSecondaryScreen 
        ? '客显屏已打开到副屏！' 
        : '客显屏已打开（请使用下方的"移到副屏"按钮定位）',
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
  }
  customerWindow = null;
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
 * 移动客显屏到副屏
 */
export async function moveToSecondaryScreen(): Promise<{
  success: boolean;
  message: string;
}> {
  if (!isCustomerDisplayOpen()) {
    return { success: false, message: '请先打开客显屏！' };
  }
  
  try {
    const screenInfo = await detectScreensInfo();
    
    if (!screenInfo.secondaryScreen) {
      // 没有检测到副屏，使用默认位置
      screenInfo.secondaryScreen = {
        width: DEFAULT_CONFIG.width,
        height: DEFAULT_CONFIG.height,
        left: screenInfo.primaryScreen.width,
        top: 0,
      };
    }
    
    // 移动并调整窗口大小
    customerWindow?.moveTo(screenInfo.secondaryScreen.left, screenInfo.secondaryScreen.top);
    customerWindow?.resizeTo(DEFAULT_CONFIG.width, DEFAULT_CONFIG.height);
    customerWindow?.focus();
    
    state.isOnSecondaryScreen = true;
    state.secondaryScreenInfo = {
      detected: true,
      method: screenInfo.detectionMethod,
      ...screenInfo.secondaryScreen,
    };
    notifyStateChange();
    
    console.log('[CustomerDisplay] 窗口已移到副屏', screenInfo.secondaryScreen);
    
    return {
      success: true,
      message: `已移动到副屏 (${screenInfo.secondaryScreen.left}, ${screenInfo.secondaryScreen.top})`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '移动失败',
    };
  }
}

/**
 * 移动到指定位置
 */
export async function moveToPosition(x: number, y: number, width?: number, height?: number): Promise<{
  success: boolean;
  message: string;
}> {
  if (!isCustomerDisplayOpen()) {
    return { success: false, message: '请先打开客显屏！' };
  }
  
  try {
    setManualSecondaryPosition({ left: x, top: y, width, height });
    
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
    
    console.log('[CustomerDisplay] 窗口已移动到', { x, y, width, height });
    
    return {
      success: true,
      message: `已移动到 (${x}, ${y})`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '移动失败',
    };
  }
}

/**
 * 获取主屏信息
 */
export function getPrimaryScreen(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1920, height: 1080 };
  }
  return { 
    width: screen.width, 
    height: screen.height 
  };
}

/**
 * 同步购物车数据
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
 * 同步会员数据
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
 * 同步店铺配置
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
 * 收款播报
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
 * 请求屏幕权限
 */
export async function requestScreenPermission(): Promise<{
  success: boolean;
  method: string;
}> {
  if (typeof window === 'undefined') {
    return { success: false, method: 'none' };
  }
  
  if (!('getScreenDetails' in window)) {
    return { success: false, method: 'unsupported' };
  }
  
  try {
    await (window as any).getScreenDetails();
    return { success: true, method: 'screen-details-api' };
  } catch (error: any) {
    return { success: false, method: 'permission-denied' };
  }
}

/**
 * 监听状态变化
 */
export function addStateChangeListener(listener: StateChangeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * 导出单例
 */
export const customerDisplayService = {
  open: openCustomerDisplay,
  close: closeCustomerDisplay,
  getState: getCustomerDisplayState,
  isOpen: isCustomerDisplayOpen,
  moveToSecondary: moveToSecondaryScreen,
  moveToPosition: moveToPosition,
  setManualPosition: setManualSecondaryPosition,
  detectScreens: detectScreensInfo,
  getPrimaryScreen,
  syncCart: syncCartToDisplay,
  syncMember: syncMemberToDisplay,
  syncShopConfig: syncShopConfigToDisplay,
  announcePayment: announcePaymentToDisplay,
  requestPermission: requestScreenPermission,
  addStateListener: addStateChangeListener,
};

export default customerDisplayService;
