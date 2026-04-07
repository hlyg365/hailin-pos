/**
 * 离线状态管理 Hook
 * 检测网络状态，管理离线模式
 */

import { useState, useEffect, useCallback } from 'react';

export interface OfflineState {
  isOnline: boolean;
  isOffline: boolean;
  lastOnlineTime: Date | null;
  lastOfflineTime: Date | null;
  offlineDuration: number; // 离线时长（毫秒）
}

export function useOfflineStatus() {
  // 初始状态统一使用 true，避免 SSR 和 CSR 不一致导致的 Hydration 错误
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    isOffline: false,
    lastOnlineTime: null,
    lastOfflineTime: null,
    offlineDuration: 0,
  });

  useEffect(() => {
    // 仅在客户端执行，初始化时同步真实网络状态
    const updateOnlineStatus = () => {
      setState(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        isOffline: !navigator.onLine,
        lastOnlineTime: navigator.onLine ? new Date() : prev.lastOnlineTime,
        lastOfflineTime: !navigator.onLine ? new Date() : prev.lastOfflineTime,
      }));
    };

    // 首次挂载时同步状态
    updateOnlineStatus();

    // 上线事件
    const handleOnline = () => {
      setState(prev => ({
        isOnline: true,
        isOffline: false,
        lastOnlineTime: new Date(),
        lastOfflineTime: prev.lastOfflineTime,
        offlineDuration: prev.lastOfflineTime 
          ? Date.now() - prev.lastOfflineTime.getTime() 
          : 0,
      }));
    };

    // 离线事件
    const handleOffline = () => {
      setState(prev => ({
        isOnline: false,
        isOffline: true,
        lastOnlineTime: prev.lastOnlineTime,
        lastOfflineTime: new Date(),
        offlineDuration: 0,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 更新离线时长
  useEffect(() => {
    if (!state.isOffline) return;

    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        offlineDuration: prev.lastOfflineTime 
          ? Date.now() - prev.lastOfflineTime.getTime() 
          : 0,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isOffline, state.lastOfflineTime]);

  return state;
}

/**
 * 格式化离线时长
 */
export function formatOfflineDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  }
  if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  }
  return `${seconds}秒`;
}

/**
 * 手动检查网络连接
 */
export async function checkNetworkConnection(): Promise<boolean> {
  try {
    // 尝试请求一个轻量级端点
    const response = await fetch('/api/health', {
      method: 'HEAD',
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 数据同步 Hook
 */
export function useDataSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const { isOnline } = useOfflineStatus();

  // 同步离线订单
  const syncOfflineOrders = useCallback(async () => {
    if (!isOnline) {
      return { success: false, message: '网络未连接' };
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      // 调用同步API
      const response = await fetch('/api/orders/sync', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('同步失败');
      }

      const result = await response.json();
      setLastSyncTime(new Date());
      return { success: true, ...result };
    } catch (error: any) {
      setSyncError(error.message);
      return { success: false, message: error.message };
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);

  // 同步商品数据
  const syncProducts = useCallback(async () => {
    if (!isOnline) {
      return { success: false, message: '网络未连接' };
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const response = await fetch('/api/products/sync');
      
      if (!response.ok) {
        throw new Error('同步商品失败');
      }

      const result = await response.json();
      setLastSyncTime(new Date());
      return { success: true, ...result };
    } catch (error: any) {
      setSyncError(error.message);
      return { success: false, message: error.message };
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);

  return {
    isSyncing,
    lastSyncTime,
    syncError,
    syncOfflineOrders,
    syncProducts,
  };
}
