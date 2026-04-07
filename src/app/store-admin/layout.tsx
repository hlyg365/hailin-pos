'use client';

import { useState, useEffect, useMemo, memo, useSyncExternalStore } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Store,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  FileText,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  Smartphone,
  HelpCircle,
  Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// 侧边栏菜单配置 - 移到组件外部避免重复创建
const sidebarMenus = [
  {
    title: '工作台',
    items: [
      { icon: LayoutDashboard, label: '数据看板', path: '/store-admin' },
      { icon: Bell, label: '消息通知', path: '/store-admin/notifications', badge: 3 },
    ],
  },
  {
    title: '经营管理',
    items: [
      { icon: ShoppingCart, label: '订单管理', path: '/store-admin/orders' },
      { icon: Package, label: '库存管理', path: '/store-admin/inventory' },
      { icon: Users, label: '会员管理', path: '/store-admin/members' },
      { icon: BarChart3, label: '销售报表', path: '/store-admin/reports' },
    ],
  },
  {
    title: '营销活动',
    items: [
      { icon: Megaphone, label: '促销管理', path: '/store-admin/promotions' },
      { icon: FileText, label: '采购申请', path: '/store-admin/purchase' },
    ],
  },
  {
    title: '系统设置',
    items: [
      { icon: Settings, label: '店铺设置', path: '/store-admin/settings' },
      { icon: Smartphone, label: 'APP下载', path: '/store-admin/app-download' },
      { icon: HelpCircle, label: '帮助中心', path: '/store-admin/help' },
    ],
  },
];

interface UserInfo {
  id: string;
  name: string;
  storeId: string;
  storeName: string;
  role: string;
  avatar?: string;
}

// 侧边栏内容组件 - 提取到外部并 memo 化
interface SidebarContentProps {
  user: UserInfo | null;
  sidebarCollapsed: boolean;
  pathname: string;
  onNavigate: () => void;
}

const SidebarContent = memo(function SidebarContent({ 
  user, 
  sidebarCollapsed, 
  pathname, 
  onNavigate 
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 border-b">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <Store className="h-5 w-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate">海邻到家</h1>
            <p className="text-xs text-gray-500 truncate">{user?.storeName}</p>
          </div>
        )}
      </div>

      {/* 菜单 */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-6">
          {sidebarMenus.map((group) => (
            <div key={group.title}>
              {!sidebarCollapsed && (
                <h3 className="px-3 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* 底部用户信息 */}
      <div className="p-4 border-t">
        <div className={cn(
          "flex items-center gap-3",
          sidebarCollapsed && "justify-center"
        )}>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {user?.name?.charAt(0) || '店'}
            </AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role === 'store_manager' ? '店长' : '店员'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// 简单的加载状态 - SSR 和 CSR 保持一致
function SimpleLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">加载中...</p>
      </div>
    </div>
  );
}

// 客户端检测 hook - 使用 useSyncExternalStore 确保 SSR 一致性
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function StoreAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isClient = useIsClient();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 登录页面不需要布局
  const isLoginPage = pathname === '/store-admin/auth/login' || pathname === '/store-admin/login';

  // 初始化认证状态 - 只在客户端执行
  useEffect(() => {
    // 登录页面跳过检查
    if (isLoginPage) {
      setIsInitialized(true);
      return;
    }

    // 直接读取 localStorage（浏览器环境下）
    try {
      const isLoggedIn = localStorage.getItem('store_admin_logged_in');
      const userData = localStorage.getItem('store_admin_user');

      if (!isLoggedIn) {
        router.replace('/store-admin/auth/login');
        return;
      }

      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch {
      // SSR 环境下 localStorage 不可用，忽略错误
    }
    
    setIsInitialized(true);
  }, [isLoginPage, router]);

  // 登录页面直接返回
  if (isLoginPage) {
    return children;
  }

  // 服务端渲染时显示简单加载状态（与客户端初始状态一致）
  if (!isClient || !isInitialized) {
    return <SimpleLoading />;
  }

  // 未登录时等待重定向
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">正在跳转...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('store_admin_logged_in');
    localStorage.removeItem('store_admin_user');
    router.push('/store-admin/auth/login');
  };

  // 使用 useMemo 缓存当前页面标题
  const currentPageTitle = useMemo(() => {
    return sidebarMenus.flatMap(g => g.items).find(item => item.path === pathname)?.label || '店长管理';
  }, [pathname]);

  return (
    <div className="h-screen flex bg-gray-50">
      {/* 桌面端侧边栏 */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-white border-r transition-all duration-300 relative",
          sidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent 
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          pathname={pathname}
          onNavigate={() => setMobileMenuOpen(false)}
        />
        
        {/* 折叠按钮 */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute top-20 -right-3 w-6 h-6 bg-white border rounded-full shadow flex items-center justify-center hover:bg-gray-50 z-10"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform",
              sidebarCollapsed && "rotate-180"
            )}
          />
        </button>
      </aside>

      {/* 移动端侧边栏 */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent 
            user={user}
            sidebarCollapsed={false}
            pathname={pathname}
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-6 shrink-0">
          {/* 移动端菜单按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* 店铺名称 - 移动端 */}
          <div className="lg:hidden flex-1 text-center">
            <span className="font-medium">{user?.storeName}</span>
          </div>

          {/* 搜索栏 - 桌面端 */}
          <div className="hidden lg:flex items-center gap-4 flex-1">
            <h2 className="text-lg font-semibold">{currentPageTitle}</h2>
          </div>

          {/* 右侧操作区 */}
          <div className="flex items-center gap-3">
            {/* 消息通知 */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            {/* 用户下拉菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                      {user?.name?.charAt(0) || '店'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline text-sm">{user?.name}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.name}</span>
                    <span className="text-xs text-gray-500 font-normal">{user?.storeName}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/store-admin/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    店铺设置
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/store-admin/app-download">
                    <Smartphone className="h-4 w-4 mr-2" />
                    下载APP
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/store-admin/help">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    帮助中心
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
