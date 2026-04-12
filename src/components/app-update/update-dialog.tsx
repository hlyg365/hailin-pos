'use client';

import React from 'react';
import type { VersionInfo } from '@/lib/native/app-update-service';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

interface UpdateDialogProps {
  versionInfo: VersionInfo | null;
  isOpen: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  onDownload: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export function UpdateDialog({
  versionInfo,
  isOpen,
  isDownloading,
  downloadProgress,
  onDownload,
  onSkip,
  onClose,
}: UpdateDialogProps) {
  if (!isOpen || !versionInfo) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[400px] max-w-[90vw] overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="w-6 h-6 text-white" />
              <div>
                <h3 className="text-lg font-bold text-white">
                  发现新版本
                </h3>
                <p className="text-orange-100 text-sm">
                  v{versionInfo.version}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {/* 更新日志 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
            <h4 className="font-medium text-sm mb-2">更新内容：</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {versionInfo.releaseNotes.map((note, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>

          {/* 发布日期 */}
          <p className="text-xs text-gray-400 mb-4">
            发布日期：{versionInfo.releaseDate}
          </p>

          {/* 下载进度 */}
          {isDownloading && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">下载中...</span>
                <span className="text-orange-600 font-medium">{Math.round(downloadProgress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onSkip}
            >
              稍后再说
            </Button>
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              onClick={onDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  下载中... {Math.round(downloadProgress)}%
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  下载安装
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpdateDialog;
