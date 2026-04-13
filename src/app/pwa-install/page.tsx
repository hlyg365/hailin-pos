'use client';

import { useState, useEffect } from 'react';
import { InstallButton } from '@/components/pwa-install-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Monitor, Chrome, Apple, Info } from 'lucide-react';

export default function PWAInstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // 检测是否已安装
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    
    // 检测 iOS
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    
    // 监听安装提示
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowInstructions(true);
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-orange-600">海邻收银台</h1>
          <p className="text-gray-500">智能便利店收银管理系统</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 已安装提示 */}
        {isStandalone && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <div>
                <p className="font-medium text-green-800">应用已安装</p>
                <p className="text-sm text-green-600">您正在使用海邻收银台应用</p>
              </div>
              <Button 
                variant="outline" 
                className="ml-auto"
                onClick={() => window.location.href = '/pos'}
              >
                打开收银台
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 主安装卡片 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-orange-500" />
              安装收银台应用
            </CardTitle>
            <CardDescription>
              安装后可离线使用，无需网络连接
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 自动安装按钮 */}
            {(deferredPrompt || isStandalone) && !isIOS && (
              <div className="text-center py-4">
                <InstallButton />
              </div>
            )}

            {/* 无法自动安装时显示手动引导 */}
            {((!deferredPrompt && !isStandalone) || isIOS || showInstructions) && (
              <IOSInstallGuide />
            )}
          </CardContent>
        </Card>

        {/* 其他访问方式 */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-5 w-5 text-blue-500" />
                电脑端访问
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                使用 Windows、Mac 或其他电脑浏览器打开以下地址：
              </p>
              <div className="bg-gray-100 rounded-lg p-3 font-mono text-sm break-all">
                {typeof window !== 'undefined' ? window.location.origin : ''}/pos
              </div>
              <Button 
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => window.open('/pos', '_blank')}
              >
                打开收银台
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Chrome className="h-5 w-5 text-orange-500" />
                Chrome 浏览器
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                推荐使用 Chrome 浏览器获得最佳体验
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>✓ 支持扫码枪</li>
                <li>✓ 支持小票打印机</li>
                <li>✓ 支持钱箱</li>
                <li>✓ 支持离线使用</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* 提示信息 */}
        <Card className="mt-6 bg-amber-50 border-amber-200">
          <CardContent className="flex items-start gap-3 py-4">
            <Info className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">使用提示</p>
              <ul className="list-disc list-inside space-y-1">
                <li>收银台支持扫码枪自动识别商品</li>
                <li>首次使用需联网下载，之后可离线收银</li>
                <li>建议使用 10 寸以上平板或电脑</li>
                <li>浏览器地址栏输入 <code className="bg-amber-100 px-1 rounded">chrome://flags/#enable-app-banners</code> 可开启更多 PWA 功能</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// iOS 安装引导组件
function IOSInstallGuide() {
  return (
    <div className="space-y-4">
      <h3 className="font-medium flex items-center gap-2">
        <Apple className="h-5 w-5" />
        iPhone / iPad 安装方法
      </h3>
      
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
            1
          </div>
          <div>
            <p className="font-medium">用 Safari 打开</p>
            <p className="text-sm text-gray-500">确保使用 Safari 浏览器，不是 Chrome</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
            2
          </div>
          <div>
            <p className="font-medium">点击分享按钮</p>
            <p className="text-sm text-gray-500">Safari 底部中间的分享图标 ↑</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
            3
          </div>
          <div>
            <p className="font-medium">选择"添加到主屏幕"</p>
            <p className="text-sm text-gray-500">向下滚动找到并点击"添加到主屏幕"</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
            4
          </div>
          <div>
            <p className="font-medium">点击"添加"</p>
            <p className="text-sm text-gray-500">完成后桌面会出现海邻收银台图标</p>
          </div>
        </div>
      </div>

      <h3 className="font-medium flex items-center gap-2 mt-6">
        <Smartphone className="h-5 w-5" />
        Android 安装方法
      </h3>
      
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold shrink-0">
            1
          </div>
          <div>
            <p className="font-medium">用 Chrome 打开</p>
            <p className="text-sm text-gray-500">确保使用 Chrome 浏览器</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold shrink-0">
            2
          </div>
          <div>
            <p className="font-medium">等待安装提示</p>
            <p className="text-sm text-gray-500">首次访问时，Chrome 会显示安装提示</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold shrink-0">
            3
          </div>
          <div>
            <p className="font-medium">点击"安装"或菜单按钮</p>
            <p className="text-sm text-gray-500">如没看到提示，点击右上角菜单 → "添加到主屏幕"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
