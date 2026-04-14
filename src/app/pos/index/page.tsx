'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PosHomePage() {
  const router = useRouter();

  useEffect(() => {
    // 直接跳转到收银台页面
    router.replace('/pos/cashier');
  }, [router]);

  return null;
}
