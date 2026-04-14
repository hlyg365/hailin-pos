'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cameraScanner, ScanResult, CameraStatus, CameraDevice } from '@/lib/native/camera-scanner-service';
import { aiProductRecognition, AIRecognitionResult, AIProductMatch } from '@/lib/native/ai-recognition-service';
import {
  Camera,
  CameraOff,
  X,
  Check,
  RefreshCw,
  Flashlight,
  SwitchCamera,
  Image as ImageIcon,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  Zap,
  Eye,
} from 'lucide-react';

interface CameraScannerProps {
  onScan: (result: ScanResult) => void;
  onClose?: () => void;
  autoStart?: boolean;
  enableAI?: boolean;
  showHistory?: boolean;
  scanCooldown?: number;
}

// 条码格式中文名
const FORMAT_NAMES: Record<string, string> = {
  ean_13: 'EAN-13商品码',
  ean_8: 'EAN-8商品码',
  upc_a: 'UPC-A商品码',
  upc_e: 'UPC-E商品码',
  code_128: 'Code 128',
  code_39: 'Code 39',
  qr_code: '二维码',
  data_matrix: 'Data Matrix',
  pdf_417: 'PDF 417',
};

// 条码类型图标
const getTypeIcon = (type: 'product' | 'payment' | 'member') => {
  switch (type) {
    case 'product': return '🏷️';
    case 'payment': return '💳';
    case 'member': return '👤';
  }
};

export default function CameraScanner({
  onScan,
  onClose,
  autoStart = true,
  enableAI = true,
  showHistory = true,
  scanCooldown = 1000,
}: CameraScannerProps) {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [status, setStatus] = useState<CameraStatus>({ active: false, hasPermission: false });
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [currentCamera, setCurrentCamera] = useState<string>('environment');
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [aiResult, setAiResult] = useState<AIRecognitionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(true);
  
  const viewportRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // 初始化
  useEffect(() => {
    if (autoStart) {
      startScanner();
    }
    
    // 获取可用摄像头
    loadCameras();
    
    return () => {
      stopScanner();
    };
  }, []);
  
  // 加载摄像头列表
  const loadCameras = async () => {
    try {
      const devs = await cameraScanner.getCameras();
      setCameras(devs);
    } catch (err) {
      console.error('Failed to load cameras:', err);
    }
  };
  
  // 启动扫码
  const startScanner = useCallback(async () => {
    if (!viewportRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 设置扫描间隔
      cameraScanner.setCooldown(scanCooldown);
      
      // 启动摄像头扫码
      const success = await cameraScanner.start(viewportRef.current, {
        facingMode: currentCamera as 'environment' | 'user',
      });
      
      if (success) {
        setIsActive(true);
        setStatus(cameraScanner.getStatus());
        
        // 注册扫码回调
        unsubscribeRef.current = cameraScanner.onScan((result) => {
          handleScanResult(result);
        });
      } else {
        setError('无法启动摄像头，请检查权限设置');
      }
    } catch (err: any) {
      setError(err.message || '启动失败');
      console.error('Scanner start error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentCamera, scanCooldown]);
  
  // 停止扫码
  const stopScanner = useCallback(() => {
    cameraScanner.stop();
    setIsActive(false);
    setStatus({ active: false, hasPermission: false });
    
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);
  
  // 处理扫码结果
  const handleScanResult = useCallback(async (result: ScanResult) => {
    setLastScan(result);
    setScanHistory(prev => [result, ...prev.slice(0, 9)]);
    
    // 回调
    onScan(result);
    
    // AI识别（如果启用）
    if (enableAI && result.type === 'product') {
      performAIRecognition();
    }
  }, [onScan, enableAI]);
  
  // 执行AI识别
  const performAIRecognition = async () => {
    // 从视频帧截图
    const imageData = cameraScanner.captureImage();
    if (!imageData) return;
    
    setIsLoading(true);
    try {
      const img = new (window.Image || HTMLImageElement)();
      img.src = imageData;
      await new Promise((resolve) => { img.onload = resolve; });
      
      const result = await aiProductRecognition.recognize({ image: img });
      setAiResult(result);
      
      console.log('AI Recognition result:', result);
    } catch (err) {
      console.error('AI recognition error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 切换摄像头
  const toggleCamera = async () => {
    stopScanner();
    setCurrentCamera(prev => prev === 'environment' ? 'user' : 'environment');
    await new Promise(resolve => setTimeout(resolve, 300));
    startScanner();
  };
  
  // 重新扫码
  const rescan = () => {
    setLastScan(null);
    setAiResult(null);
    setError(null);
    startScanner();
  };
  
  // 关闭
  const handleClose = () => {
    stopScanner();
    onClose?.();
  };
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* 头部 */}
      <div className="bg-black/80 backdrop-blur-sm text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isActive ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-400">扫码中</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CameraOff className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">已停止</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <button
              onClick={toggleCamera}
              className="p-2 hover:bg-white/20 rounded-full transition"
              title="切换摄像头"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* 扫码区域 */}
      <div className="flex-1 relative">
        {showScanner && (
          <div 
            ref={viewportRef} 
            className="absolute inset-0"
          >
            {/* QuaggaJS 会在这里渲染视频 */}
          </div>
        )}
        
        {/* 扫描框 */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-white/50 rounded-2xl relative">
              {/* 四角标记 */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-lg" />
              
              {/* 扫描线动画 */}
              <div className="absolute left-2 right-2 h-0.5 bg-orange-500 animate-pulse top-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}
        
        {/* 加载状态 */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <span className="text-slate-700">处理中...</span>
            </div>
          </div>
        )}
        
        {/* 错误提示 */}
        {error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl p-6 max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <h3 className="font-bold text-slate-800">扫码失败</h3>
              </div>
              <p className="text-slate-600 text-sm mb-4">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={rescan}
                  className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-medium"
                >
                  重试
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 底部信息 */}
      <div className="bg-black/80 backdrop-blur-sm p-4">
        {/* 最后扫描结果 */}
        {lastScan && (
          <div className="bg-white/10 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">扫码成功</span>
            </div>
            <div className="text-white font-mono text-lg mb-1">{lastScan.code}</div>
            <div className="flex items-center gap-3 text-white/60 text-xs">
              <span>{FORMAT_NAMES[lastScan.format] || lastScan.format}</span>
              <span>{getTypeIcon(lastScan.type)} {lastScan.type === 'product' ? '商品' : lastScan.type === 'payment' ? '支付' : '会员'}</span>
            </div>
            
            {/* AI识别结果 */}
            {aiResult && aiResult.success && aiResult.products.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 text-xs">AI识别结果</span>
                </div>
                <div className="space-y-2">
                  {aiResult.products.slice(0, 3).map((product, index) => (
                    <div 
                      key={index}
                      className={`bg-white/10 rounded-lg p-2 ${index === 0 ? 'ring-2 ring-orange-500' : ''}`}
                    >
                      <div className="text-white text-sm font-medium">{product.productName}</div>
                      <div className="flex items-center justify-between text-white/60 text-xs mt-1">
                        <span>{product.category}</span>
                        <span className="text-orange-400">¥{product.price?.toFixed(2)}</span>
                        <span>{Math.round(product.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 操作按钮 */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={rescan}
                className="flex-1 py-2 bg-white text-slate-800 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                继续扫码
              </button>
              <button
                onClick={performAIRecognition}
                disabled={isLoading}
                className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
                AI识别
              </button>
            </div>
          </div>
        )}
        
        {/* 历史记录 */}
        {showHistory && scanHistory.length > 0 && !lastScan && (
          <div>
            <h4 className="text-white/60 text-xs mb-2">最近扫码</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {scanHistory.map((scan, index) => (
                <button
                  key={scan.timestamp}
                  onClick={() => onScan(scan)}
                  className="w-full bg-white/10 hover:bg-white/20 rounded-lg p-3 text-left"
                >
                  <div className="text-white font-mono text-sm truncate">{scan.code}</div>
                  <div className="flex items-center gap-2 text-white/40 text-xs mt-1">
                    <span>{FORMAT_NAMES[scan.format] || scan.format}</span>
                    <span>•</span>
                    <span>{new Date(scan.timestamp).toLocaleTimeString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* 提示 */}
        {!lastScan && scanHistory.length === 0 && (
          <div className="text-center text-white/60 text-sm">
            <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>将商品条码或二维码对准扫描框</p>
            <p className="text-xs mt-1">支持 EAN-13、Code 128、QR码等</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 简化版扫码按钮组件
interface ScanButtonProps {
  onScan: (result: ScanResult) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
}

export function ScanButton({ onScan, size = 'md', variant = 'primary' }: ScanButtonProps) {
  const [showScanner, setShowScanner] = useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  
  const variantClasses = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white',
    secondary: 'bg-white hover:bg-slate-100 text-slate-700',
  };
  
  if (!showScanner) {
    return (
      <button
        onClick={() => setShowScanner(true)}
        className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full flex items-center justify-center shadow-lg transition`}
      >
        <Camera className={iconSizes[size]} />
      </button>
    );
  }
  
  return (
    <CameraScanner
      onScan={(result) => {
        setShowScanner(false);
        onScan(result);
      }}
      onClose={() => setShowScanner(false)}
    />
  );
}
