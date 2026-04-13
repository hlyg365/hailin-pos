'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PosPage() {
  const router = useRouter();

  useEffect(() => {
    // 自动跳转到收银台首页
    router.replace('/pos/index');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg">正在加载收银台...</p>
      </div>
    </div>
  );
}
