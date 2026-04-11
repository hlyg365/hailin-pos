'use client';

/**
 * APP版本检查Hook
 * 
 * 提供版本检查和自动更新功能
 */

import { useState, useEffect, useCallback } from 'react';
import { AppUpdate } from '@/lib/native/index';

export interface VersionInfo {
  currentVersion: string;
  latestVersion: string | null;
  hasUpdate: boolean;
  downloadProgress: number;
  isDownloading: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  error: string | null;
}

export interface UpdateStatus {
  available: boolean;
  downloading: boolean;
  progress: number;
  error: string | null;
}

export function useAppUpdate() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo>({
    currentVersion: '1.0.0',
    latestVersion: null,
    hasUpdate: false,
    downloadProgress: 0,
    isDownloading: false,
    isChecking: false,
    lastChecked: null,
    error: null,
  });

  // 加载保存的版本信息
  useEffect(() => {
    const savedVersion = localStorage.getItem('app_version');
    if (savedVersion) {
      try {
        const info = JSON.parse(savedVersion);
        setVersionInfo(prev => ({
          ...prev,
          currentVersion: info.currentVersion || prev.currentVersion,
        }));
      } catch (e) {
        // ignore
      }
    }

    // 从原生获取当前版本
    const getCurrentVersion = async () => {
      try {
        const cap = (window as any).Capacitor;
        if (cap?.Plugins?.App) {
          const info = await cap.Plugins.App.getInfo();
          setVersionInfo(prev => ({
            ...prev,
            currentVersion: info.version || prev.currentVersion,
          }));
          // 保存
          localStorage.setItem('app_version', JSON.stringify({
            currentVersion: info.version || '1.0.0',
          }));
        }
      } catch (e) {
        console.log('[AppUpdate] Could not get current version:', e);
      }
    };

    getCurrentVersion();
  }, []);

  // 检查更新
  const checkForUpdate = useCallback(async () => {
    setVersionInfo(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const result = await AppUpdate.checkUpdate();

      setVersionInfo(prev => ({
        ...prev,
        latestVersion: result.latestVersion || prev.currentVersion,
        hasUpdate: result.hasUpdate,
        isChecking: false,
        lastChecked: new Date(),
      }));

      return result;
    } catch (e: any) {
      setVersionInfo(prev => ({
        ...prev,
        isChecking: false,
        error: e.message || '检查更新失败',
      }));
      return { hasUpdate: false, latestVersion: null };
    }
  }, []);

  // 下载并安装
  const downloadAndInstall = useCallback(async () => {
    setVersionInfo(prev => ({ ...prev, isDownloading: true, downloadProgress: 0, error: null }));

    try {
      // 模拟下载进度
      const progressInterval = setInterval(() => {
        setVersionInfo(prev => ({
          ...prev,
          downloadProgress: Math.min(prev.downloadProgress + 10, 90),
        }));
      }, 500);

      const result = await AppUpdate.downloadAndInstall();

      clearInterval(progressInterval);

      if (result.success) {
        setVersionInfo(prev => ({
          ...prev,
          downloadProgress: 100,
          isDownloading: false,
        }));
      } else {
        setVersionInfo(prev => ({
          ...prev,
          isDownloading: false,
          error: result.message || '下载失败',
        }));
      }

      return result;
    } catch (e: any) {
      setVersionInfo(prev => ({
        ...prev,
        isDownloading: false,
        error: e.message || '下载失败',
      }));
      return { success: false, message: e.message };
    }
  }, []);

  return {
    ...versionInfo,
    checkForUpdate,
    downloadAndInstall,
  };
}

// 独立的版本检查函数
export async function checkAppUpdate(): Promise<{
  hasUpdate: boolean;
  latestVersion?: string;
  currentVersion?: string;
}> {
  try {
    const cap = (window as any).Capacitor;
    let currentVersion = '1.0.0';

    // 获取当前版本
    if (cap?.Plugins?.App) {
      const info = await cap.Plugins.App.getInfo();
      currentVersion = info.version || '1.0.0';
    }

    // 检查更新
    const result = await AppUpdate.checkUpdate();

    return {
      hasUpdate: result.hasUpdate,
      latestVersion: result.latestVersion,
      currentVersion,
    };
  } catch (e) {
    console.error('[AppUpdate] Check failed:', e);
    return { hasUpdate: false };
  }
}
