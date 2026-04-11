'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 收银台APP专用入口页面
 * 原生APP启动时自动跳转到收银台页面
 */
export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    // 检测是否为原生APP环境
    const isCapacitorApp = !!(window as any).Capacitor;
    
    // 统一跳转到收银台页面
    router.replace('/pos');
  }, [router]);

  // 加载中显示
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold mb-2">海邻收银台</h1>
        <p className="text-orange-100">正在加载收银系统...</p>
      </div>
    </div>
  );
}
