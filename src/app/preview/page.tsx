'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, QrCode, ExternalLink, Copy, Check, Monitor, Tablet, SmartphoneIcon, Download } from 'lucide-react';
import Link from 'next/link';

export default function PreviewPage() {
  const [previewUrl, setPreviewUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [deviceType, setDeviceType] = useState<'phone' | 'tablet' | 'desktop'>('phone');

  useEffect(() => {
    // 获取当前页面的基础URL
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      setPreviewUrl(`${baseUrl}/pos`);
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(previewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 设备尺寸配置
  const deviceSizes = {
    phone: { width: 375, height: 812, name: 'iPhone' },
    tablet: { width: 768, height: 1024, name: 'iPad' },
    desktop: { width: '100%', height: '100%', name: '桌面' },
  };

  const pages = [
    { name: '收银台主页', path: '/pos', desc: '收银、购物车、结算', icon: '🛒' },
    { name: '收银台登录', path: '/pos/auth/login', desc: '员工登录页面', icon: '🔐' },
    { name: '商品管理', path: '/pos/products', desc: '商品列表、新增、编辑', icon: '📦' },
    { name: '订单管理', path: '/pos/orders', desc: '订单列表、详情', icon: '📋' },
    { name: '会员管理', path: '/pos/members', desc: '会员列表、信息', icon: '👥' },
    { name: '促销管理', path: '/pos/promotions', desc: '促销活动', icon: '🏷️' },
    { name: '员工绩效', path: '/pos/staff', desc: '员工统计', icon: '📊' },
  ];

  // 生成二维码URL (使用第三方服务)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(previewUrl)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">海邻收银台 - 移动端预览</h1>
          <p className="text-gray-500 mt-2">扫码或在手机浏览器中打开预览</p>
        </div>

        {/* APP下载入口 */}
        <Card className="mb-6 shadow-lg border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-pink-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">下载收银台APP</h3>
                  <p className="text-sm text-gray-500">安装到收银机，体验更佳</p>
                </div>
              </div>
              <Link href="/download">
                <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
                  <Download className="w-4 h-4 mr-2" />
                  下载APP
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 左侧：二维码和链接 */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <QrCode className="w-5 h-5 text-blue-500" />
                <h2 className="font-semibold">扫码预览</h2>
              </div>
              
              {/* 二维码 */}
              <div className="bg-white p-4 rounded-lg border mb-4 flex justify-center">
                {previewUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="预览二维码" 
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 flex items-center justify-center">
                    <span className="text-gray-400">加载中...</span>
                  </div>
                )}
              </div>

              {/* 链接 */}
              <div className="bg-slate-50 rounded-lg p-3 mb-4">
                <div className="text-xs text-gray-500 mb-1">预览链接：</div>
                <code className="text-sm text-blue-600 break-all">{previewUrl}</code>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-green-500" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      复制链接
                    </>
                  )}
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => window.open(previewUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  新窗口打开
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 右侧：页面列表 */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h2 className="font-semibold mb-4">可预览页面</h2>
              <div className="space-y-2">
                {pages.map((page) => (
                  <div 
                    key={page.path}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => window.open(`${previewUrl.replace('/pos', '')}${page.path}`, '_blank')}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{page.icon}</span>
                      <div>
                        <div className="font-medium text-sm">{page.name}</div>
                        <div className="text-xs text-gray-500">{page.desc}</div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 内嵌预览 */}
        <Card className="mt-6 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">内嵌预览</h2>
              <div className="flex gap-2">
                <Button 
                  variant={deviceType === 'phone' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDeviceType('phone')}
                >
                  <SmartphoneIcon className="w-4 h-4 mr-1" />
                  手机
                </Button>
                <Button 
                  variant={deviceType === 'tablet' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDeviceType('tablet')}
                >
                  <Tablet className="w-4 h-4 mr-1" />
                  平板
                </Button>
                <Button 
                  variant={deviceType === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDeviceType('desktop')}
                >
                  <Monitor className="w-4 h-4 mr-1" />
                  桌面
                </Button>
              </div>
            </div>
            
            <div className="flex justify-center bg-slate-900 rounded-lg p-4 overflow-hidden">
              {deviceType === 'desktop' ? (
                <iframe 
                  src={previewUrl}
                  className="w-full h-[600px] bg-white rounded"
                  title="预览"
                />
              ) : (
                <div 
                  className="bg-white rounded-2xl overflow-hidden shadow-2xl"
                  style={{ 
                    width: deviceSizes[deviceType].width,
                    height: 600,
                  }}
                >
                  <div className="h-6 bg-slate-100 flex items-center justify-center">
                    <div className="w-16 h-1 bg-slate-300 rounded-full"></div>
                  </div>
                  <iframe 
                    src={previewUrl}
                    className="w-full bg-white"
                    style={{ height: 'calc(100% - 24px)' }}
                    title="预览"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 提示：扫码后可在手机上体验真实的收银台界面</p>
        </div>
      </div>
    </div>
  );
}
