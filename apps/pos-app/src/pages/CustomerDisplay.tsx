/**
 * 客显屏组件
 * 用于分屏显示的顾客端屏幕
 * 支持多种显示模式：欢迎语、等待付款、付款成功、付款失败、二维码、谢谢惠顾
 */

import { useState, useEffect, useCallback } from 'react';

// 显示模式
type DisplayMode = 'welcome' | 'waiting' | 'success' | 'failed' | 'qrcode' | 'thankyou';

// API 基础 URL
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '' 
  : 'http://localhost:5001';

export default function CustomerDisplay() {
  const [mode, setMode] = useState<DisplayMode>('welcome');
  const [amount, setAmount] = useState<number>(0);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [connected, setConnected] = useState<boolean>(false);

  // 连接状态检查
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`);
        setConnected(res.ok);
      } catch {
        setConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  // 监听显示更新
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource(`${API_BASE}/api/display/stream`);
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.mode) {
              setMode(data.mode as DisplayMode);
              setAmount(data.amount || 0);
              setQrCodeUrl(data.qrCode || '');
            }
          } catch (e) {
            console.error('Failed to parse display data', e);
          }
        };

        eventSource.onerror = () => {
          eventSource?.close();
          // 5秒后重连
          setTimeout(connectSSE, 5000);
        };
      } catch (e) {
        console.log('SSE not available');
      }
    };

    connectSSE();

    return () => {
      eventSource?.close();
    };
  }, []);

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-950 flex flex-col justify-center items-center p-8 text-white relative cursor-pointer"
      onClick={toggleFullscreen}
    >
      {/* 品牌标识 */}
      <div className="absolute top-6 left-8">
        <p className="text-white/60 text-sm">海邻到家 · 客显屏</p>
      </div>

      {/* 连接状态 */}
      <div className="absolute top-6 right-8 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <span className="text-white/60 text-sm">{connected ? '已连接' : '未连接'}</span>
      </div>

      {/* 内容区域 */}
      <div className="flex flex-col items-center justify-center flex-1 w-full">
        {/* 欢迎模式 */}
        {mode === 'welcome' && (
          <div className="text-center">
            <h1 className="text-8xl font-bold text-white mb-6 animate-pulse">
              欢迎光临
            </h1>
            <p className="text-3xl text-blue-200">
              海邻到家便利店
            </p>
          </div>
        )}

        {/* 等待付款模式 */}
        {mode === 'waiting' && (
          <div className="text-center">
            <p className="text-3xl text-blue-200 mb-4">应付金额</p>
            <p className="text-8xl font-bold text-yellow-400 mb-8">
              ¥{amount.toFixed(2)}
            </p>
            <p className="text-4xl text-white">请扫码支付</p>
          </div>
        )}

        {/* 付款成功模式 */}
        {mode === 'success' && (
          <div className="text-center">
            <h1 className="text-6xl font-bold text-green-400 mb-6">
              付款成功
            </h1>
            <p className="text-4xl text-yellow-400">
              ¥{amount.toFixed(2)}
            </p>
          </div>
        )}

        {/* 付款失败模式 */}
        {mode === 'failed' && (
          <div className="text-center">
            <h1 className="text-6xl font-bold text-red-400 mb-6">
              付款失败
            </h1>
            <p className="text-3xl text-white/80">请重试</p>
          </div>
        )}

        {/* 二维码模式 */}
        {mode === 'qrcode' && (
          <div className="text-center">
            <div className="bg-white rounded-2xl p-6 shadow-2xl mb-6">
              {qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="支付二维码" 
                  className="w-80 h-80 object-contain"
                />
              ) : (
                <div className="w-80 h-80 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  等待二维码...
                </div>
              )}
            </div>
            <p className="text-2xl text-white">请使用微信/支付宝扫码支付</p>
          </div>
        )}

        {/* 谢谢惠顾模式 */}
        {mode === 'thankyou' && (
          <div className="text-center">
            <h1 className="text-7xl font-bold text-green-400 mb-6">
              谢谢惠顾
            </h1>
            <p className="text-3xl text-white mb-4">欢迎您再次光临</p>
            <p className="text-2xl text-blue-200">海邻到家便利店</p>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="absolute bottom-6 text-center">
        <p className="text-white/40 text-sm">点击屏幕进入全屏模式</p>
      </div>
    </div>
  );
}
