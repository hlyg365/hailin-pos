'use client';

import { useState, useEffect } from 'react';
import { AppUpdate, AppUpdateService } from '@/lib/native/app-update-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Download, 
  Check, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Settings as SettingsIcon,
  Monitor,
  Scale,
  Printer,
  HardDrive
} from 'lucide-react';

interface VersionInfo {
  version: string;
  buildNumber: number;
  releaseDate: string;
  releaseNotes: string[];
  downloadUrl: string;
  minVersion: string;
}

export default function SettingsPage() {
  const [currentVersion, setCurrentVersion] = useState({ version: '', buildNumber: 0 });
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [checkResult, setCheckResult] = useState<{ type: 'success' | 'error' | 'none'; message: string }>({ type: 'none', message: '' });
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    // 获取当前版本
    const version = AppUpdate.getCurrentVersion();
    setCurrentVersion(version);
    
    // 启动时自动检查更新
    checkForUpdate();
  }, []);

  // 检查更新
  const checkForUpdate = async () => {
    setIsChecking(true);
    setCheckResult({ type: 'none', message: '' });
    
    try {
      const result = await AppUpdate.checkUpdate();
      
      if (result.hasUpdate) {
        setLatestVersion(result.latestVersion);
        setVersionInfo(result.versionInfo || null);
        setShowUpdateModal(true);
        setCheckResult({ 
          type: 'success', 
          message: `发现新版本 v${result.latestVersion}` 
        });
      } else {
        setCheckResult({ 
          type: 'success', 
          message: `当前已是最新版本 v${result.currentVersion}` 
        });
      }
    } catch (error: any) {
      setCheckResult({ 
        type: 'error', 
        message: error.message || '检查更新失败' 
      });
    } finally {
      setIsChecking(false);
    }
  };

  // 下载并安装
  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      const result = await AppUpdate.downloadAndInstall();
      
      if (result.success) {
        alert(result.message);
      } else {
        alert(result.message);
      }
    } catch (error: any) {
      alert('下载失败: ' + (error.message || '未知错误'));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 头部 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => window.close()}>
              <span className="text-xl">←</span>
            </Button>
            <h1 className="text-lg font-semibold">APP设置</h1>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* 版本信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              版本信息
            </CardTitle>
            <CardDescription>当前APP版本及更新管理</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 当前版本 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">海邻到家收银台</div>
                <div className="text-sm text-gray-500">
                  版本 {currentVersion.version} ({currentVersion.buildNumber})
                </div>
              </div>
              <Badge variant="secondary">当前版本</Badge>
            </div>

            {/* 检查更新按钮 */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={checkForUpdate}
              disabled={isChecking}
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              检查更新
            </Button>

            {/* 检查结果 */}
            {checkResult.type !== 'none' && (
              <div className={`p-3 rounded-lg text-sm ${
                checkResult.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                <div className="flex items-center gap-2">
                  {checkResult.type === 'success' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  {checkResult.message}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 快捷入口 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              快捷入口
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => window.location.href = '/pos/hardware'}
            >
              <HardDrive className="h-6 w-6" />
              <span className="text-sm">外设管理</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => window.location.href = '/pos/customer-display'}
            >
              <Monitor className="h-6 w-6" />
              <span className="text-sm">客显屏</span>
            </Button>
          </CardContent>
        </Card>

        {/* 关于 */}
        <Card>
          <CardHeader>
            <CardTitle>关于</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-500 space-y-2">
            <div>海邻到家便利店智能收银系统</div>
            <div>支持电子秤、打印机、钱箱、客显屏等外设</div>
            <div>专为收银称重一体机设计</div>
          </CardContent>
        </Card>
      </div>

      {/* 更新弹窗 */}
      {showUpdateModal && versionInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-orange-500" />
                发现新版本
              </CardTitle>
              <CardDescription>
                v{currentVersion.version} → v{latestVersion}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 更新日志 */}
              {versionInfo.releaseNotes.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="text-sm font-medium mb-2">更新内容：</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {versionInfo.releaseNotes.map((note, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-orange-500">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 按钮 */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowUpdateModal(false)}
                >
                  稍后再说
                </Button>
                <Button 
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      打开下载...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      下载安装
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
