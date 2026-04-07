'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Camera, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle, 
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileUploadPage() {
  const [session, setSession] = useState<{
    sessionId: string;
    productId: string;
    status: string;
    expiresAt: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{ key: string; url: string }>>([]);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(600);

  // 从URL获取会话ID
  const getSessionId = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('session');
  }, []);

  // 加载会话信息
  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) {
      setError('无效的上传链接');
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/upload/session?sessionId=${sessionId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setSession({
            sessionId: result.data.sessionId,
            productId: result.data.productId,
            status: result.data.status,
            expiresAt: result.data.expiresAt,
          });
          
          // 计算剩余时间
          const remaining = Math.max(0, Math.floor((result.data.expiresAt - Date.now()) / 1000));
          setCountdown(remaining);
        } else {
          setError(result.error || '会话不存在或已过期');
        }
      } catch (err) {
        setError('加载失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [getSessionId]);

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) {
      setError('上传时间已过期');
      return;
    }
    
    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown]);

  // 格式化倒计时
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 处理文件上传
  const handleUpload = async (file: File) => {
    if (!session || uploading) return;
    
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('不支持的文件类型，仅支持 JPG、PNG、GIF、WebP');
      return;
    }

    // 验证文件大小
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('文件大小不能超过5MB');
      return;
    }

    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', session.sessionId); // 用于自动更新会话
      if (session.productId) {
        formData.append('productId', session.productId);
      }

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        // 图片上传成功，会话已在上传API中自动更新
        setUploadedImages(prev => [...prev, { key: result.data.key, url: result.data.url }]);
      } else {
        setError(result.error || '上传失败');
      }
    } catch (err) {
      setError('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 选择文件
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  // 拍照上传
  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  // 完成上传
  const handleFinish = async () => {
    if (!session) return;
    
    try {
      await fetch('/api/upload/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId }),
      });
      
      // 显示成功提示
      setError('');
      setSession(prev => prev ? { ...prev, status: 'completed' } : null);
    } catch (err) {
      console.error('完成上传失败:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">无法上传</h2>
            <p className="text-gray-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session?.status === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">上传成功</h2>
            <p className="text-gray-500">图片已成功上传，请在电脑端查看</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* 头部 */}
        <div className="text-center py-4">
          <h1 className="text-xl font-bold text-gray-800">上传商品图片</h1>
          <p className="text-sm text-gray-500 mt-1">
            剩余时间：<span className={countdown < 60 ? 'text-red-500 font-bold' : ''}>{formatCountdown(countdown)}</span>
          </p>
        </div>

        {/* 上传按钮 */}
        <Card>
          <CardContent className="py-6">
            <div className="grid grid-cols-2 gap-4">
              {/* 拍照上传 */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCapture}
                  disabled={uploading}
                  className="hidden"
                  id="camera-input"
                />
                <label htmlFor="camera-input">
                  <div className={cn(
                    "flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 hover:bg-blue-50'
                  )}>
                    <Camera className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium">拍照上传</span>
                  </div>
                </label>
              </div>

              {/* 相册选择 */}
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                  id="gallery-input"
                />
                <label htmlFor="gallery-input">
                  <div className={cn(
                    "flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 hover:bg-blue-50'
                  )}>
                    <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium">从相册选择</span>
                  </div>
                </label>
              </div>
            </div>

            {uploading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-blue-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>上传中...</span>
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm text-center mt-4">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* 已上传的图片 */}
        {uploadedImages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">已上传图片</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((img, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden border">
                    <img src={img.url} alt={`上传图片 ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              
              <Button 
                className="w-full mt-4" 
                onClick={handleFinish}
                disabled={uploading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                完成上传
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 提示 */}
        <div className="text-center text-xs text-gray-400">
          <p>支持 JPG、PNG、GIF、WebP 格式</p>
          <p>单张图片最大 5MB</p>
        </div>
      </div>
    </div>
  );
}
