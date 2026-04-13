'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ReportsPage() {
  const router = useRouter();

  useEffect(() => {
    // 默认跳转到数据分析页面
    router.push('/dashboard/reports/analysis');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-slate-500">正在跳转...</p>
      </div>
    </div>
  );
}
