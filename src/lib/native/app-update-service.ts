/**
 * APP 更新服务
 * 
 * 功能：
 * 1. 检查更新 - 从服务器获取最新版本信息
 * 2. 下载更新 - 下载新版本APK
 * 3. 安装更新 - 安装下载的APK
 * 
 * 使用方法:
 * import { AppUpdateService } from '@/lib/native/app-update-service';
 * 
 * const update = AppUpdateService.getInstance();
 * 
 * // 检查更新
 * const result = await update.checkUpdate();
 * if (result.hasUpdate) {
 *   console.log('有新版本:', result.latestVersion);
 *   // 显示更新弹窗
 * }
 * 
 * // 下载并安装
 * await update.downloadAndInstall();
 */

// 当前APP版本
const CURRENT_VERSION = {
  version: '3.0.0',
  buildNumber: 20260412,
};

// 版本信息接口
export interface VersionInfo {
  version: string;
  buildNumber: number;
  releaseDate: string;
  releaseNotes: string[];
  downloadUrl: string;
  minVersion: string;
}

// 更新检查结果
export interface UpdateCheckResult {
  hasUpdate: boolean;
  isForced: boolean;
  currentVersion: string;
  latestVersion: string;
  versionInfo?: VersionInfo;
}

// 下载进度回调
export type ProgressCallback = (progress: number, downloaded: number, total: number) => void;

class AppUpdateService {
  private static instance: AppUpdateService;
  private progressCallback: ProgressCallback | null = null;

  private constructor() {}

  public static getInstance(): AppUpdateService {
    if (!AppUpdateService.instance) {
      AppUpdateService.instance = new AppUpdateService();
    }
    return AppUpdateService.instance;
  }

  /**
   * 获取当前版本信息
   */
  getCurrentVersion(): { version: string; buildNumber: number } {
    return { ...CURRENT_VERSION };
  }

  /**
   * 设置下载进度回调
   */
  onProgress(callback: ProgressCallback | null) {
    this.progressCallback = callback;
  }

  /**
   * 比较版本号
   * 返回: 1 新版本, 0 相同, -1 旧版本
   */
  compareVersion(current: string, latest: string): number {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const a = currentParts[i] || 0;
      const b = latestParts[i] || 0;
      if (a > b) return -1;
      if (a < b) return 1;
    }
    return 0;
  }

  /**
   * 检查更新
   */
  async checkUpdate(): Promise<UpdateCheckResult> {
    try {
      // 调用版本检查API
      const response = await fetch('/api/app-info');
      if (!response.ok) {
        throw new Error('获取版本信息失败');
      }
      
      const serverInfo = await response.json();
      
      const hasUpdate = this.compareVersion(
        CURRENT_VERSION.version, 
        serverInfo.version
      ) === 1;
      
      // 是否强制更新（当前版本低于最低版本）
      const isForced = this.compareVersion(
        CURRENT_VERSION.version,
        serverInfo.minVersion
      ) === -1;
      
      return {
        hasUpdate,
        isForced,
        currentVersion: CURRENT_VERSION.version,
        latestVersion: serverInfo.version,
        versionInfo: {
          version: serverInfo.version,
          buildNumber: serverInfo.buildNumber,
          releaseDate: serverInfo.releaseDate,
          releaseNotes: serverInfo.releaseNotes || [],
          downloadUrl: serverInfo.downloadUrl,
          minVersion: serverInfo.minVersion,
        },
      };
    } catch (error) {
      console.error('[AppUpdate] checkUpdate error:', error);
      return {
        hasUpdate: false,
        isForced: false,
        currentVersion: CURRENT_VERSION.version,
        latestVersion: CURRENT_VERSION.version,
      };
    }
  }

  /**
   * 检查更新（别名）
   */
  async checkForUpdate(): Promise<UpdateCheckResult> {
    return this.checkUpdate();
  }

  /**
   * 下载并安装更新（原生APP）
   */
  async downloadAndInstall(): Promise<{ success: boolean; message: string }> {
    try {
      const updateInfo = await this.checkUpdate();
      
      if (!updateInfo.hasUpdate || !updateInfo.versionInfo?.downloadUrl) {
        return { success: false, message: '没有可用更新' };
      }

      const downloadUrl = updateInfo.versionInfo.downloadUrl;
      
      // 在原生APP中，打开下载链接
      // Capacitor会处理下载和安装
      if (typeof window !== 'undefined') {
        // 方式1: 打开外部浏览器下载
        window.open(downloadUrl, '_blank');
        
        return { 
          success: true, 
          message: `已在浏览器中打开下载页面，请下载后手动安装` 
        };
      }
      
      return { success: false, message: '非原生环境' };
    } catch (error: any) {
      console.error('[AppUpdate] downloadAndInstall error:', error);
      return { success: false, message: error.message || '下载失败' };
    }
  }

  /**
   * 获取更新设置
   */
  getSettings(): { autoUpdate: boolean; wifiOnly: boolean; skipVersion?: string } {
    if (typeof window === 'undefined') {
      return { autoUpdate: true, wifiOnly: true };
    }
    
    const settings = localStorage.getItem('app-update-settings');
    if (settings) {
      return JSON.parse(settings);
    }
    
    return { autoUpdate: true, wifiOnly: true };
  }

  /**
   * 保存更新设置
   */
  saveSettings(settings: { autoUpdate: boolean; wifiOnly: boolean; skipVersion?: string }) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-update-settings', JSON.stringify(settings));
    }
  }
}

// 导出单例
export const AppUpdate = AppUpdateService.getInstance();

// 导出类供直接使用
export { AppUpdateService };
