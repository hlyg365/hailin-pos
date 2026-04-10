/**
 * 客显屏服务 v4.0
 * 修复问题：跨域窗口移动被阻止
 * 解决方案：
 * 1. 在URL中传递目标位置参数
 * 2. 客显屏自己检测位置并自动调整
 * 3. 不依赖从外部调用window.moveTo()
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
  secondaryPosition?: {
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
      
      // 找到主屏（包含当前窗口的屏幕）
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
  const pos = {
    width: position.width || DEFAULT_CONFIG.width,
    height: position.height || DEFAULT_CONFIG.height,
    left: position.left,
    top: position.top,
  };
  config.secondaryPosition = pos;
  localStorage.setItem('secondary_screen_config', JSON.stringify(pos));
  console.log('[CustomerDisplay] 已设置手动副屏位置:', pos);
}

/**
 * 打开客显屏窗口 - v4.0 修复跨域问题
 * 关键改进：通过URL参数传递位置信息，让客显屏自己定位
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
    // 检测屏幕信息
    const screenInfo = await detectScreensInfo();
    
    // 确定副屏位置
    let targetLeft = 0;
    let targetTop = 0;
    let targetWidth = config.width;
    let targetHeight = config.height;
    let isOnSecondary = false;

    if (screenInfo.secondaryScreen) {
      targetLeft = screenInfo.secondaryScreen.left;
      targetTop = screenInfo.secondaryScreen.top;
      targetWidth = screenInfo.secondaryScreen.width || config.width;
      targetHeight = screenInfo.secondaryScreen.height || config.height;
      isOnSecondary = targetLeft !== 0 || targetTop !== 0;
    }

    state.secondaryScreenInfo = {
      detected: screenInfo.secondaryScreen !== null,
      method: screenInfo.detectionMethod,
      left: targetLeft,
      top: targetTop,
      width: targetWidth,
      height: targetHeight,
    };

    console.log('[CustomerDisplay] 打开客显屏，目标位置:', { left: targetLeft, top: targetTop, width: targetWidth, height: targetHeight });

    // 构建URL，传递位置参数（客显屏会自己定位）
    const displayUrl = new URL(`${window.location.origin}/pos/customer-display`);
    displayUrl.searchParams.set('left', String(targetLeft));
    displayUrl.searchParams.set('top', String(targetTop));
    displayUrl.searchParams.set('width', String(targetWidth));
    displayUrl.searchParams.set('height', String(targetHeight));
    
    // 构建窗口特性
    const windowFeatures: string[] = [];
    windowFeatures.push(`width=${config.width}`);
    windowFeatures.push(`height=${config.height}`);
    windowFeatures.push(`left=${targetLeft}`);
    windowFeatures.push(`top=${targetTop}`);
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

    // 使用随机窗口名称确保打开新窗口
    const windowName = 'hailin_pos_customer_display_' + Math.random().toString(36).substr(2, 9);
    
    // 打开新窗口
    customerWindow = window.open(displayUrl.toString(), windowName, featuresString);

    if (!customerWindow) {
      // 被阻止了，尝试备用方式
      console.warn('[CustomerDisplay] 标准窗口打开失败，尝试备用方式');
      
      customerWindow = window.open(displayUrl.toString(), '_blank', featuresString);
      
      if (!customerWindow) {
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
    state.isOnSecondaryScreen = isOnSecondary;
    notifyStateChange();
    localStorage.setItem('customer_display_open', 'true');
    localStorage.setItem('customer_display_position', JSON.stringify({
      left: targetLeft,
      top: targetTop,
      width: targetWidth,
      height: targetHeight,
    }));

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
      isOnSecondaryScreen: isOnSecondary,
      windowName,
      targetPosition: { left: targetLeft, top: targetTop },
    });

    return {
      success: true,
      message: isOnSecondary 
        ? '客显屏已打开到副屏！' 
        : '客显屏已打开',
      isOnSecondaryScreen: isOnSecondary,
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
 * 刷新客显屏显示内容
 */
export function refreshCustomerDisplay(): void {
  if (customerWindow && !customerWindow.closed) {
    customerWindow.location.reload();
  }
}

/**
 * 移动客显屏到指定位置 - v4.0 不再使用跨域调用
 * 改为发送消息让客显屏自己移动
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
      screenInfo.secondaryScreen = {
        width: DEFAULT_CONFIG.width,
        height: DEFAULT_CONFIG.height,
        left: screenInfo.primaryScreen.width,
        top: 0,
      };
    }
    
    // 通过 postMessage 发送移动指令
    customerWindow?.postMessage({
      type: 'MOVE_TO',
      left: screenInfo.secondaryScreen.left,
      top: screenInfo.secondaryScreen.top,
      width: DEFAULT_CONFIG.width,
      height: DEFAULT_CONFIG.height,
    }, '*');
    
    state.isOnSecondaryScreen = true;
    state.secondaryScreenInfo = {
      detected: true,
      method: screenInfo.detectionMethod,
      ...screenInfo.secondaryScreen,
    };
    notifyStateChange();
    
    console.log('[CustomerDisplay] 已发送移动指令到客显屏', screenInfo.secondaryScreen);
    
    return {
      success: true,
      message: `已发送移动指令到副屏 (${screenInfo.secondaryScreen.left}, ${screenInfo.secondaryScreen.top})`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '移动失败',
    };
  }
}

/**
 * 移动到指定位置 - 通过 postMessage 发送指令
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
    
    // 通过 postMessage 发送移动指令
    customerWindow?.postMessage({
      type: 'MOVE_TO',
      left: x,
      top: y,
      width: width || DEFAULT_CONFIG.width,
      height: height || DEFAULT_CONFIG.height,
    }, '*');
    
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
    
    console.log('[CustomerDisplay] 已发送移动指令', { x, y, width, height });
    
    return {
      success: true,
      message: `已发送移动指令到 (${x}, ${y})`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '移动失败',
    };
  }
}

/**
 * 订阅状态变化
 */
export function subscribe(listener: StateChangeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export default {
  openCustomerDisplay,
  closeCustomerDisplay,
  moveToSecondaryScreen,
  moveToPosition,
  refreshCustomerDisplay,
  detectScreensInfo,
  setManualSecondaryPosition,
  getCustomerDisplayState,
  isCustomerDisplayOpen,
  subscribe,
};

// ============================================
// 以下是兼容层方法（与收银台页面使用的API保持一致）
// ============================================

// 添加状态监听器
export function addStateListener(listener: StateChangeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// 获取状态
export function getState(): CustomerDisplayState {
  return { ...state };
}

// 请求屏幕权限（用于检测多显示器）
export async function requestPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  if ('getScreenDetails' in window) {
    try {
      await (window as any).getScreenDetails();
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// 检测屏幕
export async function detectScreens(): Promise<ScreenInfo> {
  return detectScreensInfo();
}

// 获取主屏信息
export function getPrimaryScreen(): { width: number; height: number; left: number; top: number } {
  return {
    width: screen.width,
    height: screen.height,
    left: 0,
    top: 0,
  };
}

// 打开客显屏（兼容方法）
export async function open(customConfig?: Partial<CustomerDisplayConfig>): Promise<{
  success: boolean;
  message: string;
  isOnSecondaryScreen: boolean;
}> {
  return openCustomerDisplay(customConfig);
}

// 关闭客显屏（兼容方法）
export function close(): void {
  closeCustomerDisplay();
}

// 刷新客显屏
export function refresh(): void {
  refreshCustomerDisplay();
}

// ============================================
// 数据同步方法（通过 localStorage 与客显屏页面通信）
// ============================================

// 同步购物车数据
export function syncCart(cartItems: any[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('pos_cart', JSON.stringify(cartItems));
    localStorage.setItem('pos_cart_timestamp', String(Date.now()));
  } catch (e) {
    console.warn('[CustomerDisplay] 同步购物车失败:', e);
  }
}

// 同步会员信息
export function syncMember(member: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('pos_member', JSON.stringify(member));
    localStorage.setItem('pos_member_timestamp', String(Date.now()));
  } catch (e) {
    console.warn('[CustomerDisplay] 同步会员信息失败:', e);
  }
}

// 同步店铺配置
export function syncShopConfig(shopConfig: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('pos_shop_config', JSON.stringify(shopConfig));
    localStorage.setItem('pos_shop_config_timestamp', String(Date.now()));
  } catch (e) {
    console.warn('[CustomerDisplay] 同步店铺配置失败:', e);
  }
}

// 同步优惠信息
export function syncDiscount(discount: {
  memberDiscount: number;
  pointsDiscount: number;
  couponDiscount: number;
  promotionDiscount: number;
}): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('pos_discount', JSON.stringify(discount));
    localStorage.setItem('pos_discount_timestamp', String(Date.now()));
  } catch (e) {
    console.warn('[CustomerDisplay] 同步优惠信息失败:', e);
  }
}

// 播报收款
export function announcePayment(amount: number, method: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('pos_payment_event', JSON.stringify({
      amount,
      method,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('[CustomerDisplay] 播报收款失败:', e);
  }
}

// 同步广告内容
export function syncAdvertisements(advertisements: any[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('pos_advertisements', JSON.stringify(advertisements));
    localStorage.setItem('pos_advertisements_timestamp', String(Date.now()));
  } catch (e) {
    console.warn('[CustomerDisplay] 同步广告内容失败:', e);
  }
}

// 导出完整的 customerDisplayService 对象（与收银台页面使用的 API 一致）
export const customerDisplayService = {
  // 状态管理
  addStateListener,
  getState,
  subscribe,
  getCustomerDisplayState,
  isCustomerDisplayOpen,
  
  // 屏幕检测
  requestPermission,
  detectScreens,
  detectScreensInfo,
  getPrimaryScreen,
  
  // 窗口控制
  open,
  openCustomerDisplay,
  close,
  closeCustomerDisplay,
  refresh,
  refreshCustomerDisplay,
  moveToSecondaryScreen,
  moveToPosition,
  setManualSecondaryPosition,
  
  // 数据同步
  syncCart,
  syncMember,
  syncShopConfig,
  syncDiscount,
  syncAdvertisements,
  announcePayment,
};

