'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // 检测是否已安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // 监听安装提示事件
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 监听安装成功
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstalling(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // 跳转到安装引导页面
      window.location.href = '/pwa-install';
      return;
    }

    setIsInstalling(true);
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (error) {
      console.error('安装失败:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  // 已安装状态
  if (isInstalled) {
    return (
      <Button 
        variant="outline" 
        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
        disabled
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        已安装
      </Button>
    );
  }

  // 没有安装提示时，显示手动安装入口
  if (!deferredPrompt) {
    return (
      <Button 
        onClick={handleInstall}
        className="bg-orange-600 hover:bg-orange-700"
      >
        <Smartphone className="h-4 w-4 mr-2" />
        手动安装
      </Button>
    );
  }

  // 有安装提示时，显示安装按钮
  return (
    <Button 
      onClick={handleInstall}
      disabled={isInstalling}
      className="bg-orange-600 hover:bg-orange-700"
    >
      <Download className="h-4 w-4 mr-2" />
      {isInstalling ? '安装中...' : '安装到桌面'}
    </Button>
  );
}
