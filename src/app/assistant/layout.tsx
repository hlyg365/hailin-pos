'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  ScanLine,
  ShoppingCart,
  BarChart3,
  Package,
  FileText,
  Megaphone,
  User,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// 底部导航配置
const bottomNavItems = [
  { path: '/assistant', icon: Home, label: '首页' },
  { path: '/assistant/inventory', icon: Package, label: '库存' },
  { path: '/assistant/cashier', icon: ShoppingCart, label: '收银' },
  { path: '/assistant/reports', icon: BarChart3, label: '报表' },
  { path: '/assistant/profile', icon: User, label: '我的' },
];

export default function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; store: string; role: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // 模拟用户数据
    setUser({
      name: '张店长',
      store: '海邻到家·阳光店',
      role: '店长',
    });

    // 更新时间
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // 检查登录状态
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('assistant_logged_in');
    const currentPath = pathname.replace('/assistant', '');
    if (!isLoggedIn && currentPath !== '/auth/login' && currentPath !== '/login') {
      router.push('/assistant/auth/login');
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('assistant_logged_in');
    router.push('/assistant/auth/login');
  };

  // 登录页面直接返回（处理带斜杠和不带斜杠的路径）
  if (pathname.startsWith('/assistant/auth/login') || pathname.startsWith('/assistant/login')) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部状态栏 */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 bg-white/20">
              <AvatarFallback className="bg-transparent text-white text-sm">
                {user?.name?.charAt(0) || '店'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{user?.name || '店长'}</span>
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
                  {user?.role || '店长'}
                </span>
              </div>
              <p className="text-xs text-white/80">{user?.store || '海邻到家'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/80">
              {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => router.push('/assistant/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  设置
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                  <LogOut className="h-4 w-4 mr-2" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto pb-16">
        {children}
      </main>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-14 z-50">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                isActive ? "text-blue-500" : "text-gray-500"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
