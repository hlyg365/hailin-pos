'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Camera,
  CameraOff,
  RefreshCw,
  History,
  Settings,
  Zap,
  Image,
  Barcode,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  ChevronRight,
} from 'lucide-react';
import { ScanButton } from '@/components/pos/camera-scanner';

interface ScanRecord {
  id: string;
  code: string;
  format: string;
  type: 'product' | 'payment' | 'member';
  timestamp: number;
  productName?: string;
  productPrice?: number;
}

// 条码格式名称
const FORMAT_NAMES: Record<string, string> = {
  ean_13: 'EAN-13',
  ean_8: 'EAN-8',
  upc_a: 'UPC-A',
  upc_e: 'UPC-E',
  code_128: 'Code 128',
  code_39: 'Code 39',
  qr_code: '二维码',
};

export default function CameraScanPage() {
  const router = useRouter();
  const [scanMode, setScanMode] = useState<'camera' | 'history' | 'settings'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanRecord | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [showScanner, setShowScanner] = useState(false);

  // 加载历史记录
  useEffect(() => {
    const saved = localStorage.getItem('pos_scan_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load scan history');
      }
    }
  }, []);

  // 保存历史记录
  const saveToHistory = (record: ScanRecord) => {
    const newHistory = [record, ...history.filter(h => h.code !== record.code)].slice(0, 100);
    setHistory(newHistory);
    localStorage.setItem('pos_scan_history', JSON.stringify(newHistory));
  };

  // 清除历史
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('pos_scan_history');
  };

  // 处理扫码结果
  const handleScan = (result: any) => {
    const record: ScanRecord = {
      id: Date.now().toString(),
      code: result.code,
      format: result.format,
      type: result.type || 'product',
      timestamp: Date.now(),
    };
    
    setLastScan(record);
    saveToHistory(record);
    setShowResult(true);
    
    // 提示音
    if (soundEnabled) {
      const audio = new Audio('/sounds/beep.mp3');
      audio.play().catch(() => {});
    }
    
    // 震动
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  // 关闭结果
  const closeResult = () => {
    setShowResult(false);
    setLastScan(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800">扫码识别</h1>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScanMode('history')}
            className={`p-2 rounded-lg ${scanMode === 'history' ? 'bg-orange-100 text-orange-600' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={() => setScanMode('settings')}
            className={`p-2 rounded-lg ${scanMode === 'settings' ? 'bg-orange-100 text-orange-600' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 摄像头扫码模式 */}
      {scanMode === 'camera' && !showScanner && (
        <div className="p-4">
          {/* 扫码入口卡片 */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <Camera className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">摄像头扫码</h2>
              <p className="text-slate-500 text-sm">使用摄像头识别商品条码、二维码</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowScanner(true)}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30"
              >
                <Camera className="w-5 h-5" />
                开始扫码
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <Barcode className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">商品条码</p>
                  <p className="text-xs text-slate-400 mt-1">EAN-13/Code128</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className="w-6 h-6 mx-auto mb-1">
                    <svg viewBox="0 0 24 24" className="text-slate-600">
                      <path fill="currentColor" d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h1v1h-1v-1zm-3 3h1v1h-1v-1zm2 0h1v1h-1v-1zm2 0h1v1h-1v-1zm-3 3h1v1h-1v-1zm2 0h1v1h-1v-1zm2 0h1v1h-1v-1z"/>
                    </svg>
                  </div>
                  <p className="text-xs text-slate-500">支付二维码</p>
                  <p className="text-xs text-slate-400 mt-1">微信/支付宝</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* AI识别功能 */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800">AI智能识别</h3>
                  <p className="text-xs text-slate-500">拍照识别商品信息</p>
                </div>
              </div>
              <button
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`relative w-12 h-6 rounded-full transition ${aiEnabled ? 'bg-orange-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition ${aiEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
          
          {/* 最近扫码 */}
          {history.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-700">最近扫码</h3>
                <button
                  onClick={() => setScanMode('history')}
                  className="text-xs text-orange-500"
                >
                  查看全部
                </button>
              </div>
              <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
                {history.slice(0, 3).map((scan) => (
                  <div key={scan.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm text-slate-800">{scan.code}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {FORMAT_NAMES[scan.format] || scan.format} • {new Date(scan.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 历史记录模式 */}
      {scanMode === 'history' && (
        <div className="p-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {history.length === 0 ? (
              <div className="p-8 text-center">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">暂无扫码记录</p>
              </div>
            ) : (
              <>
                <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm text-slate-500">共 {history.length} 条记录</span>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-red-500"
                  >
                    清空记录
                  </button>
                </div>
                <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                  {history.map((scan) => (
                    <div key={scan.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-mono text-sm text-slate-800 break-all">{scan.code}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {FORMAT_NAMES[scan.format] || scan.format}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(scan.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ml-2 ${
                          scan.type === 'product' ? 'bg-green-500' :
                          scan.type === 'payment' ? 'bg-blue-500' :
                          'bg-purple-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 设置模式 */}
      {scanMode === 'settings' && (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm divide-y divide-slate-100">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-purple-600" />
                <span className="text-slate-800">AI智能识别</span>
              </div>
              <button
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`relative w-12 h-6 rounded-full transition ${aiEnabled ? 'bg-orange-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition ${aiEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                </svg>
                <span className="text-slate-800">扫码提示音</span>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`relative w-12 h-6 rounded-full transition ${soundEnabled ? 'bg-orange-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition ${soundEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                </svg>
                <span className="text-slate-800">扫码震动</span>
              </div>
              <button
                onClick={() => setVibrationEnabled(!vibrationEnabled)}
                className={`relative w-12 h-6 rounded-full transition ${vibrationEnabled ? 'bg-orange-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition ${vibrationEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">支持的条码格式</h3>
            <div className="grid grid-cols-2 gap-2">
              {['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E', 'Code 128', 'Code 39', 'QR Code', 'Data Matrix'].map((format) => (
                <div key={format} className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                  {format}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 摄像头扫码 */}
      {showScanner && (
        <div className="fixed inset-0 bg-black z-50">
          <div className="absolute inset-0" id="scanner-viewport">
            {/* QuaggaJS will render here */}
          </div>
          
          {/* 顶部控制栏 */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
            <button
              onClick={() => setShowScanner(false)}
              className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center ${
                  aiEnabled ? 'bg-purple-500' : 'bg-black/50'
                }`}
              >
                <Zap className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          
          {/* 扫描框 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 relative">
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-orange-500 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-orange-500 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-orange-500 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-orange-500 rounded-br-2xl" />
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse top-1/2 -translate-y-1/2" />
            </div>
          </div>
          
          {/* 底部提示 */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-center text-sm mb-4">
              将条码对准扫描框
            </p>
            <button
              onClick={() => {
                // 模拟扫码成功
                handleScan({
                  code: '6901234567890',
                  format: 'ean_13',
                  type: 'product',
                });
                setShowScanner(false);
              }}
              className="w-full py-4 bg-orange-500 text-white rounded-xl font-semibold"
            >
              模拟扫码（测试用）
            </button>
          </div>
        </div>
      )}

      {/* 扫码结果弹窗 */}
      {showResult && lastScan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  lastScan.type === 'product' ? 'bg-green-100' :
                  lastScan.type === 'payment' ? 'bg-blue-100' :
                  'bg-purple-100'
                }`}>
                  <CheckCircle className={`w-8 h-8 ${
                    lastScan.type === 'product' ? 'text-green-500' :
                    lastScan.type === 'payment' ? 'text-blue-500' :
                    'text-purple-500'
                  }`} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">扫码成功</h3>
                <p className="font-mono text-2xl text-orange-600">{lastScan.code}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                    {FORMAT_NAMES[lastScan.format] || lastScan.format}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    lastScan.type === 'product' ? 'bg-green-100 text-green-600' :
                    lastScan.type === 'payment' ? 'bg-blue-100 text-blue-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {lastScan.type === 'product' ? '商品' : lastScan.type === 'payment' ? '支付' : '会员'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                {lastScan.type === 'product' && (
                  <button
                    onClick={closeResult}
                    className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold"
                  >
                    加入购物车
                  </button>
                )}
                <button
                  onClick={() => {
                    closeResult();
                    setShowScanner(true);
                  }}
                  className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-medium"
                >
                  继续扫码
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
