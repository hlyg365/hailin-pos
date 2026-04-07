'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Smartphone,
  QrCode,
  Check,
  Download,
  Share2,
  Plus,
  Wifi,
  WifiOff,
  Monitor,
  ChevronRight,
} from 'lucide-react';

// 设备类型
type DeviceType = 'ios' | 'android' | 'desktop';

// 检测设备类型
function detectDevice(): DeviceType {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

// 检测是否已安装PWA
function isPWAInstalled() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

// 检测是否支持PWA
function isPWASupported() {
  if (typeof navigator === 'undefined') return false;
  return 'serviceWorker' in navigator;
}

export default function DownloadPage() {
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [installed, setInstalled] = useState(false);
  const [supported, setSupported] = useState(true);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setDevice(detectDevice());
    setInstalled(isPWAInstalled());
    setSupported(isPWASupported());
    setOnline(navigator.onLine);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 获取收银台URL
  const getPosUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/pos`;
    }
    return '/pos';
  };

  // 生成二维码
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getPosUrl())}`;

  // 安装指引步骤
  const installSteps: Record<DeviceType, Array<{ icon: typeof Share2; text: string; sub: string }>> = {
    ios: [
      { icon: Share2, text: '点击底部"分享"按钮', sub: '向上滑动或点击分享图标' },
      { icon: Plus, text: '选择"添加到主屏幕"', sub: '在菜单中找到此选项' },
      { icon: Check, text: '点击"添加"确认安装', sub: '图标将出现在桌面' },
    ],
    android: [
      { icon: Monitor, text: '点击浏览器菜单', sub: '右上角三点图标' },
      { icon: Plus, text: '选择"添加到主屏幕"', sub: '或"安装应用"' },
      { icon: Check, text: '确认安装', sub: '图标将出现在桌面' },
    ],
    desktop: [
      { icon: Monitor, text: '点击地址栏右侧安装图标', sub: '或浏览器菜单中的"安装"' },
      { icon: Check, text: '确认安装', sub: '应用将作为独立窗口运行' },
    ],
  };

  const steps = installSteps[device] || installSteps.desktop;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 状态栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {online ? (
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                <Wifi className="w-3 h-3 mr-1" />
                在线
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                <WifiOff className="w-3 h-3 mr-1" />
                离线
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
              v1.0.0
            </Badge>
          </div>
        </div>

        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl shadow-lg mb-4">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">海邻收银台</h1>
          <p className="text-gray-500 mt-2">PWA 版本 - 无需下载安装</p>

          {/* 状态提示 */}
          {installed && (
            <Alert className="mt-4 max-w-md mx-auto bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                您已安装海邻收银台，可直接从桌面启动
              </AlertDescription>
            </Alert>
          )}

          {!supported && (
            <Alert className="mt-4 max-w-md mx-auto bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-800">
                当前浏览器不支持PWA，建议使用 Chrome、Safari 或 Edge
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 左侧：扫码访问 */}
          <Card className="shadow-lg border-2 border-orange-100">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                扫码访问
              </CardTitle>
              <CardDescription className="text-orange-100">
                用手机扫描二维码打开收银台
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <div className="inline-block p-4 bg-white rounded-xl border shadow-sm mb-4">
                <img src={qrCodeUrl} alt="收银台二维码" className="w-48 h-48" />
              </div>
              <p className="text-sm text-gray-500">
                使用手机浏览器扫描
              </p>
              <Separator className="my-4" />
              <p className="text-xs text-gray-400 break-all">
                {getPosUrl()}
              </p>
            </CardContent>
          </Card>

          {/* 右侧：安装步骤 */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-orange-500" />
                安装到主屏幕
              </CardTitle>
              <CardDescription>
                {device === 'ios' && 'iOS Safari 安装步骤'}
                {device === 'android' && 'Android Chrome 安装步骤'}
                {device === 'desktop' && '桌面浏览器安装步骤'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step: { icon: typeof Share2; text: string; sub: string }, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <step.icon className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">{step.text}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{step.sub}</p>
                    </div>
                    {index < steps.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <Button
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                onClick={() => window.location.href = '/pos'}
              >
                打开收银台
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* PWA 优势 */}
        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">PWA 版本优势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '🚀', title: '无需下载', desc: '直接添加到桌面' },
                { icon: '📶', title: '离线支持', desc: '断网也能收银' },
                { icon: '⚡', title: '秒速启动', desc: '像原生APP一样快' },
                { icon: '🔄', title: '自动更新', desc: '无需手动升级' },
                { icon: '💾', title: '节省空间', desc: '不占用存储' },
                { icon: '🔒', title: '安全可靠', desc: 'HTTPS加密传输' },
                { icon: '📱', title: '跨平台', desc: 'iOS/Android/PC' },
                { icon: '🎯', title: '全屏运行', desc: '沉浸式体验' },
              ].map((item, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 设备检测提示 */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>
            当前设备：
            <Badge variant="outline" className="ml-2">
              {device === 'ios' && 'iOS 设备'}
              {device === 'android' && 'Android 设备'}
              {device === 'desktop' && '桌面设备'}
            </Badge>
          </p>
          <p className="mt-2">
            {installed
              ? '✅ 已安装PWA版本'
              : '💡 安装后可离线使用，体验更佳'}
          </p>
        </div>
      </div>
    </div>
  );
}
