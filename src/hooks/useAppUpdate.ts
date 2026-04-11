/**
 * App更新检查Hook
 * 
 * 在收银台应用启动时自动检查更新
 */

import { useEffect, useState, useCallback } from 'react';
import { appUpdateService, UpdateInfo } from '@/lib/native/app-update-service';

interface UseAppUpdateReturn {
  updateInfo: UpdateInfo | null;
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  checkUpdate: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  skipVersion: () => Promise<void>;
  dismissUpdate: () => void;
  showUpdateModal: boolean;
  showUpdateDialog: UpdateInfo | null;
}

export function useAppUpdate(): UseAppUpdateReturn {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState<UpdateInfo | null>(null);

  // 检查更新
  const checkUpdate = useCallback(async () => {
    setIsChecking(true);
    try {
      const info = await appUpdateService.checkUpdate();
      setUpdateInfo(info);
      
      if (info.hasUpdate && !info.skipped) {
        setShowUpdateDialog(info);
        setShowUpdateModal(true);
      }
    } catch (error) {
      console.error('[useAppUpdate] checkUpdate error:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // 下载更新
  const downloadUpdate = useCallback(async () => {
    if (!updateInfo) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      // 订阅下载进度
      const unsubscribeProgress = appUpdateService.onDownloadProgress((progress) => {
        setDownloadProgress(progress.progress);
      });
      
      const result = await appUpdateService.downloadUpdate(updateInfo.downloadUrl);
      
      if (result.success) {
        // 下载完成，等待安装
        setIsDownloading(false);
        setShowUpdateModal(false);
        // 显示安装提示
        setShowUpdateDialog({
          ...updateInfo,
          downloadUrl: '', // 清除下载URL，表示已下载
        });
        setShowUpdateModal(true);
      } else {
        console.error('[useAppUpdate] download failed:', result.message);
      }
      
      unsubscribeProgress();
    } catch (error) {
      console.error('[useAppUpdate] downloadUpdate error:', error);
      setIsDownloading(false);
    }
  }, [updateInfo]);

  // 安装更新
  const installUpdate = useCallback(async () => {
    try {
      await appUpdateService.installUpdate();
    } catch (error) {
      console.error('[useAppUpdate] installUpdate error:', error);
    }
  }, []);

  // 跳过版本
  const skipVersion = useCallback(async () => {
    if (!updateInfo) return;
    
    await appUpdateService.skipVersion(updateInfo.latestVersion);
    setShowUpdateModal(false);
    setShowUpdateDialog(null);
  }, [updateInfo]);

  // 关闭更新提示
  const dismissUpdate = useCallback(() => {
    setShowUpdateModal(false);
  }, []);

  // 初始化时检查更新
  useEffect(() => {
    // 延迟检查，避免影响应用启动
    const timer = setTimeout(() => {
      checkUpdate();
    }, 3000);

    return () => clearTimeout(timer);
  }, [checkUpdate]);

  // 监听下载完成事件
  useEffect(() => {
    const unsubscribe = appUpdateService.onDownloadComplete((filePath) => {
      setIsDownloading(false);
      setShowUpdateModal(false);
      
      // 显示安装确认
      if (updateInfo) {
        setShowUpdateDialog({
          ...updateInfo,
          downloadUrl: filePath,
        });
        setShowUpdateModal(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [updateInfo]);

  return {
    updateInfo,
    isChecking,
    isDownloading,
    downloadProgress,
    checkUpdate,
    downloadUpdate,
    installUpdate,
    skipVersion,
    dismissUpdate,
    showUpdateModal,
    showUpdateDialog,
  };
}
