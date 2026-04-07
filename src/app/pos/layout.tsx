'use client';

import { usePathname } from 'next/navigation';
import { PosAuthProvider } from '@/contexts/PosAuthContext';

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // 登录页面不显示侧边栏
  const isLoginPage = pathname === '/pos/login' || pathname === '/pos/login/';
  
  if (isLoginPage) {
    return (
      <PosAuthProvider>
        {children}
      </PosAuthProvider>
    );
  }
  
  // 其他收银台页面 - 页面内部已有导航栏
  return (
    <PosAuthProvider>
      {children}
    </PosAuthProvider>
  );
}
