// ============================================
// 海邻到家 - 核心模块导出
// ============================================

// 类型导出
export * from './types';

// API导出
export { apiClient, authApi, setLoginType, getTokenKey } from './api/client';

// 状态管理导出
export { 
  useAuthStore, 
  useCartStore, 
  useMemberStore, 
  useDeviceStore, 
  useAppStore,
  stores 
} from './store';

// 工具函数
export { formatPrice, formatDate, formatPhone, debounce, throttle } from './utils';

// PosAuth hook 简化实现
export function usePosAuth() {
  return {
    operator: { id: '1', name: '收银员', storeId: 'store1' },
    logout: () => {},
    isAuthenticated: true,
  };
}

// StoreInfo hook 简化实现
export function useStoreInfo() {
  return {
    store: { id: 'store1', name: '望京店', address: '北京市朝阳区' },
  };
}

// 格式化函数
export function formatCurrency(value: number): string {
  return `¥${value.toFixed(2)}`;
}

export function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}
