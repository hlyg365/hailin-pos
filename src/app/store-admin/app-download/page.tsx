'use client';

import { useState, useEffect } from 'react';
import {
  Smartphone,
  QrCode,
  Download,
  CheckCircle,
  Apple,
  PlayIcon,
  Monitor,
  Star,
  Users,
  Package,
  BarChart3,
  Shield,
  FileText,
  ExternalLink,
  RefreshCw,
  Server,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// APP功能特性
const appFeatures = [
  {
    icon: Package,
    title: '库存盘点',
    description: '扫码盘点，实时库存对比',
  },
  {
    icon: BarChart3,
    title: '数据报表',
    description: '销售数据，一目了然',
  },
  {
    icon: Users,
    title: '会员管理',
    description: '会员信息，随时查询',
  },
  {
    icon: Smartphone,
    title: '移动收银',
    description: '随时随地，快速收银',
  },
];

// APP截图展示
const appScreenshots = [
  { title: '首页', desc: '数据概览' },
  { title: '库存', desc: '库存管理' },
  { title: '收银', desc: '移动收银' },
  { title: '报表', desc: '数据分析' },
];

// 版本更新日志
const updateLogs = [
  {
    version: 'v1.0.0',
    date: '2024-04-07',
    changes: [
      '初始版本发布',
      '支持库存盘点功能',
      '支持数据报表查看',
      '支持会员管理',
    ],
  },
];

export default function AppDownloadPage() {
  const [copied, setCopied] = useState(false);
  const [apkReady, setApkReady] = useState(false);
  const [domain, setDomain] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDomain(window.location.origin);
    }
  }, []);

  // 检测是否为移动设备
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const copyToClipboard = () => {
    const text = `${domain}/assistant.apk`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold">下载店长助手APP</h1>
            <p className="text-gray-500">随时随地管理您的店铺</p>
          </div>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          最新版本 v1.0.0
        </Badge>
      </div>

      {/* APK构建状态 */}
      {!apkReady && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                <Server className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800 mb-2">APK尚未构建</h3>
                <p className="text-sm text-orange-700 mb-4">
                  当前APP尚未构建为安装包。请先构建APK，然后上传到服务器或对象存储。
                </p>
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <h4 className="font-medium text-sm mb-2">构建步骤：</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>在项目目录执行：<code className="bg-gray-100 px-1 rounded">cd android && ./gradlew assembleDebug</code></li>
                    <li>APK文件位置：<code className="bg-gray-100 px-1 rounded">android/app/build/outputs/apk/debug/app-debug.apk</code></li>
                    <li>上传APK到对象存储或服务器</li>
                    <li>更新下方下载链接</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 主要下载区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 扫码下载 */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              扫码下载
            </CardTitle>
            <CardDescription className="text-blue-100">
              使用手机扫描二维码下载APP
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="android">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="ios" disabled>
                  <Apple className="h-4 w-4 mr-2" />
                  iOS
                </TabsTrigger>
                <TabsTrigger value="android">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Android
                </TabsTrigger>
              </TabsList>

              <TabsContent value="android" className="text-center">
                {apkReady ? (
                  <>
                    <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                      {/* 实际二维码 */}
                      <QrCode className="h-24 w-24 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      使用微信或浏览器扫描二维码下载
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-48 h-48 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center mb-4">
                      <div className="text-center text-gray-400">
                        <QrCode className="h-16 w-16 mx-auto mb-2" />
                        <p className="text-xs">APK未构建</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      构建APK后自动生成二维码
                    </p>
                  </>
                )}
              </TabsContent>

              <TabsContent value="ios" className="text-center">
                <div className="py-8">
                  <Apple className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="font-medium mb-2">iOS APP正在开发中</h4>
                  <p className="text-sm text-gray-500">
                    iOS版本需要 Apple Developer 账号<br />
                    如需iOS版本，请联系技术支持
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* APP介绍 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              店长助手
            </CardTitle>
            <CardDescription>
              海邻到家官方店长管理工具
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 功能特性 */}
              <div className="grid grid-cols-2 gap-4">
                {appFeatures.map((feature) => {
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

              {/* APP截图预览 */}
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">应用预览</h4>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {appScreenshots.map((screen, index) => (
                    <div
                      key={index}
                      className="w-24 h-44 bg-gradient-to-b from-blue-100 to-blue-200 rounded-xl flex flex-col items-center justify-center shrink-0"
                    >
                      <Smartphone className="h-8 w-8 text-blue-400 mb-2" />
                      <p className="text-xs font-medium text-blue-600">{screen.title}</p>
                      <p className="text-[10px] text-blue-400">{screen.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 版本信息 */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>版本 v1.0.0</span>
                  <span>·</span>
                  <span>Android 5.0+</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 下载方式 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            下载方式
          </CardTitle>
          <CardDescription>
            选择适合您的下载方式
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 直接下载 */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">直接下载APK</h4>
                  <p className="text-xs text-gray-500">推荐方式，快速安装</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700" 
                  disabled={!apkReady}
                  onClick={() => window.open('/assistant.apk', '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  下载APK
                </Button>
                <Button variant="outline" onClick={copyToClipboard}>
                  {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {apkReady ? `下载地址：${domain}/assistant.apk` : '请先构建APK文件'}
              </p>
            </div>

            {/* 扫码下载 */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <QrCode className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">扫码下载</h4>
                  <p className="text-xs text-gray-500">用手机浏览器扫码</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" disabled={!apkReady}>
                <QrCode className="h-4 w-4 mr-2" />
                {apkReady ? '扫码下载' : '等待APK构建'}
              </Button>
              <p className="text-xs text-gray-400 mt-2">
                电脑端打开链接，手机扫码下载
              </p>
            </div>

            {/* 应用商店 */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <PlayIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium">应用商店</h4>
                  <p className="text-xs text-gray-500">后续上线</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" disabled>
                <ExternalLink className="h-4 w-4 mr-2" />
                即将上线
              </Button>
            </div>

            {/* 电脑端管理 */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Monitor className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">使用网页版</h4>
                  <p className="text-xs text-gray-500">无需下载，直接使用</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => window.open('/store-admin', '_blank')}
              >
                <Monitor className="h-4 w-4 mr-2" />
                打开网页版
              </Button>
              <p className="text-xs text-gray-400 mt-2">
                推荐使用Chrome/Safari浏览器
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 安装说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            安装说明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-600 font-semibold">
                1
              </div>
              <div>
                <h4 className="font-medium mb-1">允许安装未知来源应用</h4>
                <p className="text-sm text-gray-500">
                  在手机设置 → 安全 → 允许未知来源应用安装
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-600 font-semibold">
                2
              </div>
              <div>
                <h4 className="font-medium mb-1">下载APK文件</h4>
                <p className="text-sm text-gray-500">
                  点击上方下载按钮，下载到手机
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-600 font-semibold">
                3
              </div>
              <div>
                <h4 className="font-medium mb-1">安装APP</h4>
                <p className="text-sm text-gray-500">
                  点击下载的APK文件，按照提示完成安装
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0 text-green-600 font-semibold">
                4
              </div>
              <div>
                <h4 className="font-medium mb-1">开始使用</h4>
                <p className="text-sm text-gray-500">
                  打开APP，使用店长账号登录即可
                </p>
              </div>
            </div>
          </div>

          {/* 安全提示 */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 mb-1">安全提示</h4>
                <p className="text-sm text-green-700">
                  本APP已获得安全认证，所有数据传输采用HTTPS加密，保护您的账号和数据安全。
                  请勿从非官方渠道下载APP。
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 版本更新 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            更新日志
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {updateLogs.map((log) => (
              <div key={log.version} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-600">v{log.version}</Badge>
                  <span className="text-sm text-gray-500">{log.date}</span>
                </div>
                <ul className="space-y-1">
                  {log.changes.map((change, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
