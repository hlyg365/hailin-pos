'use client';

import { useState, useEffect } from 'react';
import {
  Smartphone,
  Monitor,
  Download,
  CheckCircle,
  Apple,
  Chrome,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Globe,
  Wifi,
  Bell,
  Shield,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function PWAInstallGuide() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // 检测设备类型
    const userAgent = navigator.userAgent;
    setIsIOS(/iPhone|iPad|iPod/i.test(userAgent));
    setIsAndroid(/Android/i.test(userAgent));

    // 检测是否已安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // 监听安装提示
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // 监听安装完成
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // PWA 功能特性
  const pwaFeatures = [
    {
      icon: Globe,
      title: '即开即用',
      description: '无需下载安装，点击即可使用',
    },
    {
      icon: Download,
      title: '添加到桌面',
      description: '一键安装到手机桌面，体验如原生APP',
    },
    {
      icon: Wifi,
      title: '离线可用',
      description: '支持离线使用，网络不佳也能正常操作',
    },
    {
      icon: RefreshCw,
      title: '自动更新',
      description: '有新版本时自动更新，无需手动升级',
    },
    {
      icon: Shield,
      title: '安全可靠',
      description: '数据传输加密，保护您的数据安全',
    },
    {
      icon: Bell,
      title: '消息推送',
      description: '及时接收订单和促销通知',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
            <Smartphone className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">安装店长助手</h1>
          <p className="text-gray-500">选择适合您设备的安装方式</p>
        </div>

        {/* 已安装提示 */}
        {isInstalled && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">APP已安装</h3>
                  <p className="text-sm text-green-700">
                    您可以在主屏幕找到并打开店长助手
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 安装按钮（Android Chrome） */}
        {deferredPrompt && !isInstalled && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Download className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">可安装到设备</h3>
                    <p className="text-sm text-gray-500">点击安装店长助手</p>
                  </div>
                </div>
                <Button onClick={handleInstall} className="bg-blue-600 hover:bg-blue-700">
                  安装
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 功能特性 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              PWA 特性
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {pwaFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{feature.title}</p>
                      <p className="text-xs text-gray-500">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 安装指南 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-500" />
              安装指南
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Android Chrome */}
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setShowAndroidGuide(!showAndroidGuide)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Chrome className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Android 设备</p>
                    <p className="text-sm text-gray-500">使用 Chrome 浏览器安装</p>
                  </div>
                </div>
                {showAndroidGuide ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>
              
              {showAndroidGuide && (
                <div className="p-4 border-t space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-600 font-semibold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">打开 Chrome 浏览器</h4>
                      <p className="text-sm text-gray-500">
                        使用 Chrome 浏览器打开应用链接
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-600 font-semibold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">点击安装按钮</h4>
                      <p className="text-sm text-gray-500">
                        在页面顶部会出现安装提示，或点击右上角菜单
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-600 font-semibold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">确认安装</h4>
                      <p className="text-sm text-gray-500">
                        点击"安装"或"添加到主屏幕"，确认后即可使用
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">小提示</p>
                        <p className="text-sm text-green-700">
                          如果没有看到安装提示，可以尝试：<br />
                          1. 点击浏览器右上角菜单（⋮）<br />
                          2. 选择"安装店长助手"或"添加到主屏幕"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* iOS Safari */}
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setShowIOSGuide(!showIOSGuide)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Apple className="h-5 w-5 text-gray-700" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">iPhone / iPad</p>
                    <p className="text-sm text-gray-500">使用 Safari 浏览器安装</p>
                  </div>
                </div>
                {showIOSGuide ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>
              
              {showIOSGuide && (
                <div className="p-4 border-t space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-600 font-semibold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">打开 Safari 浏览器</h4>
                      <p className="text-sm text-gray-500">
                        iOS 上请务必使用 Safari 浏览器
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-600 font-semibold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">点击分享按钮</h4>
                      <p className="text-sm text-gray-500">
                        点击Safari底部中间的分享按钮（方框带箭头）
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-600 font-semibold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">选择"添加到主屏幕"</h4>
                      <p className="text-sm text-gray-500">
                        在分享菜单中向下滚动，找到"添加到主屏幕"选项
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0 text-green-600 font-semibold">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">确认添加</h4>
                      <p className="text-sm text-gray-500">
                        点击右上角"添加"按钮，即可在主屏幕看到应用图标
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">iOS 注意事项</p>
                        <p className="text-sm text-yellow-700">
                          • 必须是 Safari 浏览器，Chrome 不支持此功能<br />
                          • 首次打开可能需要信任证书（在设置 → 通用 → 设备管理）
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 电脑端 */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Monitor className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">电脑端使用</p>
                  <p className="text-sm text-gray-500">直接使用浏览器访问即可</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                电脑端可以直接通过浏览器使用，无需安装。建议使用 Chrome 或 Edge 浏览器以获得最佳体验。
              </p>
              <Button 
                variant="outline" 
                className="mt-3 w-full"
                onClick={() => window.open('/pos', '_blank')}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                打开收银台
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 快捷入口 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">快捷入口</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => window.open('/pos', '_blank')}
              >
                <Smartphone className="h-5 w-5" />
                <span className="text-sm">收银台</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => window.open('/assistant', '_blank')}
              >
                <Monitor className="h-5 w-5" />
                <span className="text-sm">店长助手</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => window.open('/store-admin', '_blank')}
              >
                <Globe className="h-5 w-5" />
                <span className="text-sm">管理后台</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => window.open('/store-admin/app-download', '_blank')}
              >
                <Download className="h-5 w-5" />
                <span className="text-sm">APP下载</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 底部说明 */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>如遇安装问题，请联系技术支持获取帮助</p>
        </div>
      </div>
    </div>
  );
}
