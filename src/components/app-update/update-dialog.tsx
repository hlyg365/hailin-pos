'use client';

import React from 'react';
import { UpdateInfo } from '@/lib/native/app-update-service';
import { Button } from '@/components/ui/button';
import { X, Download, AlertTriangle, CheckCircle } from 'lucide-react';

interface UpdateDialogProps {
  updateInfo: UpdateInfo | null;
  isOpen: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  onDownload: () => void;
  onInstall: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export function UpdateDialog({
  updateInfo,
  isOpen,
  isDownloading,
  downloadProgress,
  onDownload,
  onInstall,
  onSkip,
  onClose,
}: UpdateDialogProps) {
  if (!isOpen || !updateInfo) return null;

  const isDownloaded = !updateInfo.downloadUrl;
  const isForceUpdate = updateInfo.forceUpdate;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[400px] max-w-[90vw] overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isForceUpdate ? (
                <AlertTriangle className="w-6 h-6 text-yellow-300" />
              ) : (
                <Download className="w-6 h-6 text-white" />
              )}
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isForceUpdate ? '强制更新' : '发现新版本'}
                </h3>
                <p className="text-blue-100 text-sm">
                  v{updateInfo.latestVersion}
                </p>
              </div>
            </div>
            {!isForceUpdate && (
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 内容 */}
        <div className="px-6 py-5">
          {/* 更新说明 */}
          <div className="mb-5">
            <h4 className="text-sm font-medium text-gray-500 mb-2">更新内容</h4>
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 max-h-32 overflow-y-auto">
              {updateInfo.releaseNotes || '优化了一些问题，提升了应用稳定性'}
            </div>
          </div>

          {/* 下载进度 */}
          {isDownloading && (
            <div className="mb-5">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">下载中...</span>
                <span className="text-blue-600 font-medium">{downloadProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* 按钮 */}
          <div className="space-y-2">
            {isDownloaded ? (
              // 已下载，显示安装按钮
              <Button
                onClick={onInstall}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                安装更新
              </Button>
            ) : (
              // 未下载，显示下载按钮
              <Button
                onClick={onDownload}
                disabled={isDownloading}
                className="w-full"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                {isDownloading ? `下载中 ${downloadProgress}%` : '立即下载'}
              </Button>
            )}

            {/* 非强制更新时显示跳过按钮 */}
            {!isForceUpdate && (
              <Button
                onClick={onSkip}
                variant="ghost"
                className="w-full text-gray-500"
              >
                稍后提醒我
              </Button>
            )}
          </div>

          {/* 强制更新提示 */}
          {isForceUpdate && (
            <p className="mt-4 text-xs text-center text-red-500">
              此版本包含重要安全更新，必须安装后才能继续使用
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default UpdateDialog;
