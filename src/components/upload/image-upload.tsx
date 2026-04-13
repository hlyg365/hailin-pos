'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import QRCode from 'qrcode';
import { 
  X, 
  Image as ImageIcon, 
  Loader2, 
  QrCode,
  Camera,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;           // 图片URL
  imageKey?: string;        // 图片存储key
  onChange: (url: string, key: string) => void;
  productId?: string;       // 商品ID
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  imageKey,
  onChange,
  productId,
  className,
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [polling, setPolling] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 处理文件上传
  const handleUpload = useCallback(async (file: File) => {
    if (disabled) return;
    
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('不支持的文件类型，仅支持 JPG、PNG、GIF、WebP');
      return;
    }

    // 验证文件大小
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('文件大小不能超过5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (productId) {
        formData.append('productId', productId);
      }

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        onChange(result.data.url, result.data.key);
        toast.success('图片上传成功');
      } else {
        toast.error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      toast.error('上传失败，请稍后重试');
    } finally {
      setUploading(false);
    }
  }, [disabled, productId, onChange]);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // 重置input以允许重复选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleUpload(file);
    }
  };

  // 删除图片
  const handleRemove = async () => {
    if (imageKey) {
      try {
        await fetch(`/api/upload/image?key=${encodeURIComponent(imageKey)}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('删除图片失败:', error);
      }
    }
    onChange('', '');
  };

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    setPolling(false);
    setPollingCount(0);
  }, []);

  // 轮询检查上传状态 - 使用递归setTimeout实现快速响应
  const pollSession = useCallback(async (sid: string, retryCount = 0) => {
    if (retryCount > 1200) { // 最多轮询10分钟 (1200 * 500ms)
      toast.error('上传等待超时');
      stopPolling();
      return;
    }

    try {
      const response = await fetch(`/api/upload/session?sessionId=${sid}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const images = result.data.uploadedImages;
        if (images && images.length > 0) {
          // 有新图片上传完成
          const latestImage = images[images.length - 1];
          onChange(latestImage.url, latestImage.key);
          toast.success('图片上传成功');
          setQrDialogOpen(false);
          stopPolling();
          
          // 完成会话
          fetch('/api/upload/session', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: sid }),
          }).catch(console.error);
          return;
        }
        
        // 检查是否过期
        if (result.data.status === 'expired') {
          toast.error('二维码已过期');
          setQrDialogOpen(false);
          stopPolling();
          return;
        }
      }
    } catch (error) {
      console.error('轮询失败:', error);
    }
    
    // 继续轮询 - 500ms间隔，快速响应
    pollingRef.current = setTimeout(() => pollSession(sid, retryCount + 1), 500);
  }, [onChange, stopPolling]);

  // 生成扫码上传二维码 - 使用本地库生成
  const handleShowQrCode = async () => {
    try {
      // 创建上传会话
      const response = await fetch('/api/upload/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setSessionId(result.data.sessionId);
        
        // 使用本地库生成二维码 - 比第三方API快得多
        const dataUrl = await QRCode.toDataURL(result.data.uploadUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrCodeDataUrl(dataUrl);
        setQrDialogOpen(true);
        
        // 开始轮询检查上传状态
        setPolling(true);
        setPollingCount(0);
        pollSession(result.data.sessionId);
      } else {
        toast.error('生成二维码失败');
      }
    } catch (error) {
      console.error('生成二维码失败:', error);
      toast.error('生成二维码失败');
    }
  };

  // 组件卸载时停止轮询
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // 关闭二维码对话框时停止轮询
  const handleCloseQrDialog = () => {
    setQrDialogOpen(false);
    stopPolling();
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg overflow-hidden transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-gray-200',
          disabled && 'opacity-50 cursor-not-allowed',
          value ? 'border-solid' : ''
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {value ? (
          // 已有图片
          <div className="relative aspect-square w-full max-w-[200px] mx-auto">
            <img
              src={value}
              alt="商品图片"
              className="w-full h-full object-cover rounded-lg"
            />
            {!disabled && (
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-1" />
                  更换
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          // 无图片，显示上传区域
          <div
            className="flex flex-col items-center justify-center py-8 cursor-pointer"
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
            ) : (
              <>
                <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">点击或拖拽上传图片</p>
                <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG、GIF、WebP，最大5MB</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
      />

      {/* 扫码上传按钮 */}
      {!value && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleShowQrCode}
          disabled={disabled || uploading}
        >
          <QrCode className="h-4 w-4 mr-2" />
          扫码上传
        </Button>
      )}

      {/* 扫码上传对话框 */}
      <Dialog open={qrDialogOpen} onOpenChange={handleCloseQrDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>扫码上传图片</DialogTitle>
            <DialogDescription>
              使用微信扫描下方二维码，在手机上上传商品图片
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {qrCodeDataUrl && (
              <>
                {/* 显示二维码 - 本地生成，响应更快 */}
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <img
                    src={qrCodeDataUrl}
                    alt="扫码上传二维码"
                    className="w-[200px] h-[200px]"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  二维码有效期：10分钟
                </p>
                {polling && (
                  <div className="flex items-center gap-2 mt-4 text-sm text-blue-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    等待手机上传...
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
