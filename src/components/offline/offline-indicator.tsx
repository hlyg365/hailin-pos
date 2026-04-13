'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, WifiOff, CloudOff, Cloud, RefreshCw, 
  CheckCircle, AlertCircle, Clock 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOfflineStatus, formatOfflineDuration } from '@/hooks/useOffline';

interface OfflineIndicatorProps {
  onSync?: () => void;
  isSyncing?: boolean;
  pendingOrdersCount?: number;
}

export function OfflineIndicator({ 
  onSync, 
  isSyncing = false,
  pendingOrdersCount = 0,
}: OfflineIndicatorProps) {
  const { isOnline, isOffline, offlineDuration } = useOfflineStatus();
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  // 网络恢复时自动同步
  useEffect(() => {
    if (isOnline && pendingOrdersCount > 0 && onSync && !isSyncing) {
      // 延迟一下再同步，避免刚连接时网络不稳定
      const timer = setTimeout(() => {
        onSync();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingOrdersCount, onSync, isSyncing]);

  // 同步成功提示
  useEffect(() => {
    if (!isSyncing && showSyncSuccess) {
      const timer = setTimeout(() => {
        setShowSyncSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSyncing, showSyncSuccess]);

  // 在线状态
  if (isOnline) {
    if (showSyncSuccess) {
      return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">数据已同步</span>
          </div>
        </div>
      );
    }

    if (pendingOrdersCount > 0) {
      return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
          <Alert className="bg-amber-50 border-amber-200 shadow-lg">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center gap-2 text-amber-800">
              <span>有 {pendingOrdersCount} 笔订单待同步</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 bg-amber-100 border-amber-300 hover:bg-amber-200"
                onClick={() => {
                  onSync?.();
                  setShowSyncSuccess(true);
                }}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Cloud className="h-3 w-3 mr-1" />
                )}
                {isSyncing ? '同步中...' : '立即同步'}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return null;
  }

  // 离线状态
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* 顶部离线提示条 */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span className="font-medium">网络已断开，正在使用离线模式</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>已离线 {formatOfflineDuration(offlineDuration)}</span>
            </div>
            {pendingOrdersCount > 0 && (
              <div className="bg-white/20 px-2 py-0.5 rounded-full">
                {pendingOrdersCount} 笔待同步
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 迷你离线状态指示器（用于角落显示）
 */
export function OfflineMiniIndicator() {
  const { isOnline, isOffline } = useOfflineStatus();

  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        isOnline 
          ? "bg-green-100 text-green-700" 
          : "bg-orange-100 text-orange-700"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          在线
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          离线
        </>
      )}
    </div>
  );
}

/**
 * 离线模式警告弹窗
 */
interface OfflineWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export function OfflineWarningDialog({ 
  isOpen, 
  onClose, 
  onContinue 
}: OfflineWarningDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <CloudOff className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg">离线模式提醒</h3>
            <p className="text-sm text-muted-foreground">当前网络不可用</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground mb-6">
          <p>系统将使用离线模式运行，您可以：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>继续收银操作（使用本地缓存的商品数据）</li>
            <li>订单将保存在本地，网络恢复后自动同步</li>
            <li>部分功能可能受限（如会员查询）</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onClose}
          >
            等待网络
          </Button>
          <Button 
            className="flex-1 bg-orange-500 hover:bg-orange-600"
            onClick={onContinue}
          >
            继续使用
          </Button>
        </div>
      </div>
    </div>
  );
}
