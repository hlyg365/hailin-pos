'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { HqAuthProvider, useHqAuth } from '@/contexts/HqAuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// 判断是否为登录页面路径
function isLoginPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.startsWith('/auth/login');
}

// 内部布局组件，使用认证 Hook
function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user, loading } = useHqAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // 用于修复水合错误 - 确保首次渲染与服务端一致
  const [mounted, setMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // 登录页面不需要认证保护
  if (isLoginPath(pathname)) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  // SSR和首次渲染时显示一致的加载状态
  // 这样可以避免hydration mismatch
  if (!mounted || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">正在加载...</p>
        </div>
      </div>
    );
  }

  // 已登录，显示主布局
  if (isAuthenticated && user) {
    return (
      <div className="h-screen overflow-hidden flex">
        <AppSidebar />
        <main className="flex-1 overflow-auto bg-slate-100">
          {children}
        </main>
      </div>
    );
  }

  // 未登录且不在登录页，重定向
  if (!isRedirecting) {
    setIsRedirecting(true);
    router.replace('/auth/login');
  }

  // 显示加载状态（等待重定向）
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">正在跳转登录页...</p>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HqAuthProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </HqAuthProvider>
  );
}
