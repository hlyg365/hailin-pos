/**
 * App更新服务 - 原生Android自动更新
 * 
 * 使用方法:
 * import { AppUpdateService } from '@/lib/native/app-update-service';
 * 
 * const update = AppUpdateService.getInstance();
 * 
 * // 检查更新
 * const result = await update.checkUpdate();
 * 
 * // 下载更新
 * if (result.hasUpdate) {
 *   await update.downloadUpdate(result.downloadUrl);
 * }
 * 
 * // 安装更新
 * await update.installUpdate();
 */

import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Network } from '@capacitor/network';

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  versionCode: number;
  releaseNotes: string;
  forceUpdate: boolean;
  downloadUrl: string;
  skipped?: boolean;
}

export interface UpdateSettings {
  autoUpdate: boolean;
  wifiOnly: boolean;
  skipVersion: string;
  checkInterval: number;
}

export interface DownloadProgress {
  progress: number;
  downloading: boolean;
}

type UpdateCheckCallback = (info: UpdateInfo) => void;
type DownloadProgressCallback = (progress: DownloadProgress) => void;
type DownloadCompleteCallback = (filePath: string) => void;
type ErrorCallback = (error: string) => void;

class AppUpdateService {
  private static instance: AppUpdateService;
  private plugin: any = null;
  private isListening: boolean = false;
  
  // 回调
  private onUpdateCheckCallbacks: Set<UpdateCheckCallback> = new Set();
  private onDownloadProgressCallbacks: Set<DownloadProgressCallback> = new Set();
  private onDownloadCompleteCallbacks: Set<DownloadCompleteCallback> = new Set();
  private onErrorCallbacks: Set<ErrorCallback> = new Set();
  
  // 网络监听
  private networkListener: any = null;

  private constructor() {
    this.initPlugin();
  }

  public static getInstance(): AppUpdateService {
    if (!AppUpdateService.instance) {
      AppUpdateService.instance = new AppUpdateService();
    }
    return AppUpdateService.instance;
  }

  private initPlugin() {
    if (Capacitor.isNativePlatform()) {
      // @ts-ignore
      this.plugin = (window as any).AppUpdate;
    }
  }

  private isNativePlatform(): boolean {
    return Capacitor.isNativePlatform() && this.plugin != null;
  }

  /**
   * 初始化更新服务
   */
  async initialize(): Promise<void> {
    if (!this.isListening && this.isNativePlatform()) {
      this.isListening = true;
      
      // 监听来自原生插件的事件
      // Capacitor会自动将这些事件转发到这里
      // 我们需要在UI层面订阅这些事件
    }
  }

  /**
   * 检查更新
   */
  async checkUpdate(): Promise<UpdateInfo> {
    // 首先检查网络
    const networkStatus = await Network.getStatus();
    if (!networkStatus.connected) {
      return {
        hasUpdate: false,
        latestVersion: '',
        versionCode: 0,
        releaseNotes: '',
        forceUpdate: false,
        downloadUrl: '',
      };
    }

    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.checkUpdate();
        return {
          hasUpdate: result.hasUpdate || false,
          latestVersion: result.latestVersion || '',
          versionCode: result.versionCode || 0,
          releaseNotes: result.releaseNotes || '',
          forceUpdate: result.forceUpdate || false,
          downloadUrl: result.downloadUrl || '',
          skipped: result.skipped || false,
        };
      } catch (e: any) {
        console.error('[AppUpdate] checkUpdate error:', e);
        // 返回无更新，避免阻塞应用
        return {
          hasUpdate: false,
          latestVersion: '',
          versionCode: 0,
          releaseNotes: '',
          forceUpdate: false,
          downloadUrl: '',
        };
      }
    }

    // 非原生平台，调用API检查
    try {
      const response = await fetch('/api/update?platform=android');
      const data = await response.json();
      
      return {
        hasUpdate: data.update || false,
        latestVersion: data.latestVersion || '',
        versionCode: data.versionCode || 0,
        releaseNotes: data.releaseNotes || '',
        forceUpdate: data.forceUpdate || false,
        downloadUrl: data.downloadUrl || '',
      };
    } catch (e) {
      console.error('[AppUpdate] API check failed:', e);
      return {
        hasUpdate: false,
        latestVersion: '',
        versionCode: 0,
        releaseNotes: '',
        forceUpdate: false,
        downloadUrl: '',
      };
    }
  }

  /**
   * 下载更新
   */
  async downloadUpdate(url?: string): Promise<{ success: boolean; message: string; filePath?: string }> {
    if (!this.isNativePlatform()) {
      return { success: false, message: '非原生环境无法下载更新' };
    }

    try {
      const result = await this.plugin.downloadUpdate({
        url: url || '/api/update/download',
      });
      
      return {
        success: result.success,
        message: result.message || (result.success ? '下载成功' : '下载失败'),
        filePath: result.filePath,
      };
    } catch (e: any) {
      return { success: false, message: e.message || '下载失败' };
    }
  }

  /**
   * 安装更新
   */
  async installUpdate(): Promise<{ success: boolean; message: string }> {
    if (!this.isNativePlatform()) {
      return { success: false, message: '非原生环境无法安装更新' };
    }

    try {
      await this.plugin.installUpdate();
      return { success: true, message: '开始安装' };
    } catch (e: any) {
      return { success: false, message: e.message || '安装失败' };
    }
  }

  /**
   * 获取更新设置
   */
  async getSettings(): Promise<UpdateSettings> {
    if (!this.isNativePlatform()) {
      return {
        autoUpdate: true,
        wifiOnly: true,
        skipVersion: '',
        checkInterval: 4 * 60 * 60 * 1000,
      };
    }

    try {
      const result = await this.plugin.getUpdateSettings();
      return {
        autoUpdate: result.autoUpdate ?? true,
        wifiOnly: result.wifiOnly ?? true,
        skipVersion: result.skipVersion || '',
        checkInterval: result.checkInterval || 4 * 60 * 60 * 1000,
      };
    } catch (e) {
      return {
        autoUpdate: true,
        wifiOnly: true,
        skipVersion: '',
        checkInterval: 4 * 60 * 60 * 1000,
      };
    }
  }

  /**
   * 保存更新设置
   */
  async setSettings(settings: Partial<UpdateSettings>): Promise<void> {
    if (!this.isNativePlatform()) {
      // 保存到本地存储
      const current = await this.getSettings();
      localStorage.setItem('app_update_settings', JSON.stringify({ ...current, ...settings }));
      return;
    }

    try {
      await this.plugin.setUpdateSettings(settings);
    } catch (e) {
      console.error('[AppUpdate] setSettings error:', e);
    }
  }

  /**
   * 获取本地版本
   */
  async getLocalVersion(): Promise<{ versionCode: number; versionName: string }> {
    if (this.isNativePlatform()) {
      try {
        const result = await this.plugin.getLocalVersion();
        return {
          versionCode: result.versionCode || 0,
          versionName: result.versionName || '0.0.0',
        };
      } catch (e) {
        console.error('[AppUpdate] getLocalVersion error:', e);
      }
    }

    return {
      versionCode: 0,
      versionName: 'Web Preview',
    };
  }

  /**
   * 取消下载
   */
  async cancelDownload(): Promise<void> {
    if (!this.isNativePlatform()) return;

    try {
      await this.plugin.cancelDownload();
    } catch (e) {
      console.error('[AppUpdate] cancelDownload error:', e);
    }
  }

  /**
   * 跳过此版本
   */
  async skipVersion(version: string): Promise<void> {
    await this.setSettings({ skipVersion: version });
  }

  /**
   * 订阅更新检查结果
   */
  onUpdateCheck(callback: UpdateCheckCallback): () => void {
    this.onUpdateCheckCallbacks.add(callback);
    return () => {
      this.onUpdateCheckCallbacks.delete(callback);
    };
  }

  /**
   * 订阅下载进度
   */
  onDownloadProgress(callback: DownloadProgressCallback): () => void {
    this.onDownloadProgressCallbacks.add(callback);
    return () => {
      this.onDownloadProgressCallbacks.delete(callback);
    };
  }

  /**
   * 订阅下载完成
   */
  onDownloadComplete(callback: DownloadCompleteCallback): () => void {
    this.onDownloadCompleteCallbacks.add(callback);
    return () => {
      this.onDownloadCompleteCallbacks.delete(callback);
    };
  }

  /**
   * 订阅错误
   */
  onError(callback: ErrorCallback): () => void {
    this.onErrorCallbacks.add(callback);
    return () => {
      this.onErrorCallbacks.delete(callback);
    };
  }

  /**
   * 自动检查更新（定时）
   */
  startAutoCheck(intervalMs: number = 4 * 60 * 60 * 1000): () => void {
    const settings = this.getSettings();
    
    const timer = setInterval(async () => {
      const currentSettings = await this.getSettings();
      if (currentSettings.autoUpdate) {
        await this.checkUpdate();
      }
    }, intervalMs);

    // 立即检查一次
    this.checkUpdate();

    return () => {
      clearInterval(timer);
    };
  }
}

export const appUpdateService = AppUpdateService.getInstance();
export default AppUpdateService;
