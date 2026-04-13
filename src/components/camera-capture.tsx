'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, SwitchCamera, X, Loader2, Check } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function CameraCapture({ onCapture, onClose, isOpen }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 启动摄像头
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // 停止之前的流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // 获取新的媒体流
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err: any) {
      console.error('摄像头启动失败:', err);
      setError(err.message || '无法访问摄像头，请检查权限设置');
      setIsStreaming(false);
    }
  }, [facingMode]);

  // 停止摄像头
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // 切换前后摄像头
  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // 拍照
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // 设置canvas尺寸
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 绘制当前帧到canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 获取图片数据
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      
      // 停止摄像头
      stopCamera();
    }
  }, [stopCamera]);

  // 重新拍照
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  // 确认使用这张照片
  const confirmPhoto = useCallback(async () => {
    if (!capturedImage) return;
    
    setUploading(true);
    try {
      // 上传图片到服务器
      const response = await fetch('/api/products/upload-image/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: capturedImage }),
      });
      
      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        onCapture(data.imageUrl);
      } else {
        // 如果上传失败，直接使用base64
        onCapture(capturedImage);
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      // 上传失败，直接使用base64
      onCapture(capturedImage);
    } finally {
      setUploading(false);
      onClose();
    }
  }, [capturedImage, onCapture, onClose]);

  // 打开时自动启动摄像头
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    
    return () => {
      if (!isOpen) {
        stopCamera();
        setCapturedImage(null);
      }
    };
  }, [isOpen, capturedImage, startCamera, stopCamera]);

  // 切换摄像头时重新启动
  useEffect(() => {
    if (isOpen && isStreaming) {
      startCamera();
    }
  }, [facingMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 bg-black/50 text-white">
        <h3 className="text-lg font-medium">拍摄商品图片</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
          <X className="h-6 w-6" />
        </Button>
      </div>
      
      {/* 摄像头/预览区域 */}
      <div className="flex-1 relative flex items-center justify-center">
        {error ? (
          <div className="text-white text-center p-8">
            <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={startCamera} variant="outline">
              重试
            </Button>
          </div>
        ) : capturedImage ? (
          <img 
            src={capturedImage} 
            alt="拍摄的照片" 
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-w-full max-h-full object-contain"
          />
        )}
        
        {/* 隐藏的canvas用于拍照 */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      {/* 底部控制区 */}
      <div className="p-6 bg-black/50 flex items-center justify-center gap-6">
        {!capturedImage ? (
          <>
            {/* 切换摄像头按钮 */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleCamera}
              className="rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <SwitchCamera className="h-6 w-6" />
            </Button>
            
            {/* 拍照按钮 */}
            <Button
              onClick={capturePhoto}
              disabled={!isStreaming}
              className="w-20 h-20 rounded-full bg-white text-black hover:bg-gray-200 disabled:opacity-50"
            >
              <Camera className="h-10 w-10" />
            </Button>
            
            {/* 占位 */}
            <div className="w-10" />
          </>
        ) : (
          <>
            {/* 重拍按钮 */}
            <Button
              variant="outline"
              onClick={retakePhoto}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              重新拍摄
            </Button>
            
            {/* 确认按钮 */}
            <Button
              onClick={confirmPhoto}
              disabled={uploading}
              className="bg-green-500 hover:bg-green-600 text-white px-8"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  使用此照片
                </>
              )}
            </Button>
          </>
        )}
      </div>
      
      {/* 提示文字 */}
      {!capturedImage && !error && (
        <div className="absolute bottom-24 left-0 right-0 text-center text-white/70 text-sm">
          请将商品放置在取景框内，确保光线充足
        </div>
      )}
    </div>
  );
}
