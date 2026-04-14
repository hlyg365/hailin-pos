'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { RecognitionResult } from '@/hooks/useAIRecognition';

interface CameraPreviewProps {
  onCapture?: (imageBase64: string) => void;
  onRecognize?: (result: RecognitionResult | null) => void;
  isRecognizing?: boolean;
  lastResult?: RecognitionResult | null;
  error?: string | null;
  className?: string;
}

export function CameraPreview({
  onCapture,
  onRecognize,
  isRecognizing = false,
  lastResult,
  error,
  className,
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // 启动摄像头
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 后置摄像头
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      setStream(mediaStream);
      setIsActive(true);
    } catch (e) {
      console.error('Failed to start camera:', e);
    }
  };

  // 停止摄像头
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsActive(false);
    }
  };

  // 拍照
  const capturePhoto = () => {
    if (!videoRef.current || !isActive) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
      setCapturedImage('data:image/jpeg;base64,' + imageBase64);
      
      if (onCapture) {
        onCapture(imageBase64);
      }
    }
  };

  // 重置
  const reset = () => {
    setCapturedImage(null);
    if (onRecognize) {
      onRecognize(null);
    }
  };

  // 清理
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-black flex items-center justify-center">
          {/* 视频预览 */}
          {!capturedImage && (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
          )}

          {/* 拍摄的照片 */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          )}

          {/* 未启动提示 */}
          {!isActive && !capturedImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
              <Camera className="w-16 h-16 mb-4" />
              <p className="text-sm">点击下方按钮启动摄像头</p>
            </div>
          )}

          {/* 识别中覆盖层 */}
          {isRecognizing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
              <RefreshCw className="w-12 h-12 animate-spin mb-4" />
              <p className="text-sm">正在识别...</p>
            </div>
          )}

          {/* 识别结果覆盖层 */}
          {lastResult && !isRecognizing && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{lastResult.productName}</span>
                <Badge variant={lastResult.confidence > 80 ? 'success' : 'warning'}>
                  {lastResult.confidence}% 匹配
                </Badge>
              </div>
              {lastResult.alternatives && lastResult.alternatives.length > 0 && (
                <div className="text-xs text-gray-300">
                  <p className="mb-1">其他可能：</p>
                  {lastResult.alternatives.map((alt, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1">
                      <span>{alt.productName}</span>
                      <span>{alt.confidence}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="absolute top-0 left-0 right-0 bg-red-500/90 text-white p-3 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-center gap-2 p-4 bg-gray-100">
          {!isActive ? (
            <Button onClick={startCamera} className="gap-2">
              <Camera className="w-4 h-4" />
              启动摄像头
            </Button>
          ) : !capturedImage ? (
            <>
              <Button onClick={capturePhoto} className="gap-2">
                <Camera className="w-4 h-4" />
                拍照识别
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                关闭
              </Button>
            </>
          ) : (
            <>
              <Button onClick={reset} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                重新拍摄
              </Button>
              {lastResult && (
                <Button className="gap-2">
                  <Check className="w-4 h-4" />
                  确认
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
