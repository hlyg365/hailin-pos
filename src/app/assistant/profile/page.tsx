'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Store,
  Bell,
  Shield,
  HelpCircle,
  Info,
  ChevronRight,
  LogOut,
  Moon,
  Smartphone,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  action?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; store: string; role: string; phone: string } | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // 从localStorage获取用户信息
    const userData = localStorage.getItem('assistant_user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      setUser({
        name: '张店长',
        store: '海邻到家·阳光店',
        role: '店长',
        phone: '138****8888',
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('assistant_logged_in');
    localStorage.removeItem('assistant_user');
    router.push('/assistant/login');
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: '账户设置',
      items: [
        { icon: User, label: '个人信息', path: '/assistant/profile/info' },
        { icon: Shield, label: '修改密码', path: '/assistant/profile/password' },
        { icon: Smartphone, label: '绑定设备', path: '/assistant/profile/device' },
      ],
    },
    {
      title: '应用设置',
      items: [
        { 
          icon: Bell, 
          label: '消息通知', 
          rightElement: (
            <Switch 
              checked={notifications} 
              onCheckedChange={setNotifications}
            />
          )
        },
        { 
          icon: Moon, 
          label: '深色模式', 
          rightElement: (
            <Switch 
              checked={darkMode} 
              onCheckedChange={setDarkMode}
            />
          )
        },
      ],
    },
    {
      title: '帮助与支持',
      items: [
        { icon: HelpCircle, label: '使用帮助', path: '/assistant/profile/help' },
        { icon: MessageSquare, label: '意见反馈', path: '/assistant/profile/feedback' },
        { icon: Info, label: '关于我们', path: '/assistant/profile/about' },
      ],
    },
    {
      title: '',
      items: [
        { 
          icon: LogOut, 
          label: '退出登录', 
          danger: true,
          action: () => setShowLogoutDialog(true)
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 用户信息卡片 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 pb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 bg-white/20 border-2 border-white/30">
            <AvatarFallback className="bg-transparent text-white text-xl">
              {user?.name?.charAt(0) || '店'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{user?.name || '店长'}</h2>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {user?.role || '店长'}
              </span>
            </div>
            <p className="text-white/80 text-sm mt-1">{user?.store || '海邻到家'}</p>
            <p className="text-white/60 text-xs mt-0.5">{user?.phone || ''}</p>
          </div>
        </div>
      </div>

      {/* 快捷统计 */}
      <div className="px-4 -mt-4">
        <Card>
          <CardContent className="py-3">
            <div className="grid grid-cols-3 divide-x text-center">
              <div>
                <p className="text-xl font-bold text-blue-500">156</p>
                <p className="text-xs text-gray-500">今日订单</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-500">¥12.8K</p>
                <p className="text-xs text-gray-500">今日销售</p>
              </div>
              <div>
                <p className="text-xl font-bold text-orange-500">28</p>
                <p className="text-xs text-gray-500">待处理</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 菜单列表 */}
      <div className="p-4 space-y-4">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.title && (
              <p className="text-sm text-gray-500 mb-2 px-1">{section.title}</p>
            )}
            <Card className="divide-y">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIndex}
                    onClick={() => {
                      if (item.path) router.push(item.path);
                      if (item.action) item.action();
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors",
                      item.danger && "text-red-500"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", item.danger ? "text-red-500" : "text-gray-400")} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.rightElement || (
                      <ChevronRight className="h-5 w-5 text-gray-300" />
                    )}
                  </button>
                );
              })}
            </Card>
          </div>
        ))}
      </div>

      {/* 版本信息 */}
      <div className="text-center text-xs text-gray-400 py-4">
        <p>海邻到家 · 店长助手</p>
        <p className="mt-1">版本 1.0.0</p>
      </div>

      {/* 退出登录确认框 */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认退出</AlertDialogTitle>
            <AlertDialogDescription>
              确定要退出登录吗？退出后需要重新登录才能使用。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={handleLogout}
            >
              退出登录
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
