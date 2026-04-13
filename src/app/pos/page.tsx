'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, Smartphone, Monitor, ArrowLeft, CheckCircle, SmartphoneIcon, Printer, WifiOff, QrCode } from 'lucide-react';

export default function PosPage() {
  const [currentVersion, setCurrentVersion] = useState('3.0');
  const [fileSize, setFileSize] = useState('');

  useEffect(() => {
    // 获取文件大小
    fetch('/hailin-pos-v3.0.apk')
      .then(res => {
        if (res.ok) {
          const size = res.headers.get('content-length');
          if (size) {
            const mb = (parseInt(size) / 1024 / 1024).toFixed(1);
            setFileSize(mb + ' MB');
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600">
      {/* 顶部导航 */}
      <header className="bg-white/10 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回首页
          </Link>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* 标题区 */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-8 py-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏪</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">海邻到家 收银台</h1>
            <p className="text-orange-100">专为收银场景优化，请下载APP使用</p>
          </div>

          {/* 说明 */}
          <div className="px-8 py-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">为什么需要下载APP？</h2>
            <div className="space-y-3 mb-6">
              {[
                { icon: SmartphoneIcon, text: '扫码枪集成：支持USB扫码枪自动识别' },
                { icon: Printer, text: '小票打印：连接蓝牙或USB打印机' },
                { icon: WifiOff, text: '离线收银：断网也能正常收款' },
                { icon: QrCode, text: '客显支持：连接副屏显示商品信息' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <span className="text-slate-600">{item.text}</span>
                </div>
              ))}
            </div>

            {/* 下载按钮 */}
            <div className="bg-orange-50 rounded-2xl p-6 mb-6">
              <div className="text-center mb-4">
                <p className="text-sm text-slate-500 mb-1">最新版本</p>
                <p className="text-3xl font-bold text-orange-500">v{currentVersion}</p>
                {fileSize && <p className="text-sm text-slate-400 mt-1">大小约 {fileSize}</p>}
              </div>
              
              <a
                href="/hailin-pos-v3.0.apk"
                className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                <Download className="w-6 h-6" />
                <span>下载安装包</span>
              </a>
              
              <p className="text-center text-xs text-slate-400 mt-3">
                点击上方按钮下载 APK 安装包
              </p>
            </div>

            {/* 安装说明 */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-slate-700 mb-3">安装步骤</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>下载 APK 文件到手机</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>打开文件管理，找到下载的 APK</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>点击安装，如有安全提示请允许</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">4</span>
                  <span>安装完成后打开 APP 即可使用</span>
                </div>
              </div>
            </div>

            {/* 其他入口 */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-500 mb-3">其他管理入口</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/store-admin"
                  className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Monitor className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-slate-700">电脑端管理</span>
                </Link>
                <Link
                  href="/assistant"
                  className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Smartphone className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-slate-700">店长助手</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <p className="text-center text-white/60 text-sm mt-6">
          安装后打开 APP 即可使用收银功能
        </p>
      </main>
    </div>
  );
}
