'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Settings, HelpCircle, LogOut, Store, Printer, User, RefreshCw } from 'lucide-react';

interface ShopConfig {
  name: string;
  logo: string;
  address: string;
  phone: string;
  businessHours: string;
  description: string;
}

interface CurrentStaff {
  id: number;
  name: string;
  username: string;
  role: string;
  loginTime?: string;
}

export function PosNavbar() {
  const pathname = usePathname();
  const [shopConfig, setShopConfig] = useState<ShopConfig>({
    name: '海邻到家',
    logo: '',
    address: '',
    phone: '',
    businessHours: '',
    description: '',
  });
  const [currentStaff, setCurrentStaff] = useState<CurrentStaff | null>(null);

  useEffect(() => {
    // 加载店铺配置
    const savedConfig = localStorage.getItem('shopConfig');
    if (savedConfig) {
      setShopConfig(JSON.parse(savedConfig));
    }

    // 加载当前营业员
    const savedStaff = localStorage.getItem('currentStaff');
    if (savedStaff) {
      setCurrentStaff(JSON.parse(savedStaff));
    }
  }, []);

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      localStorage.removeItem('currentStaff');
      setCurrentStaff(null);
      window.location.href = '/pos/shift';
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white border-b z-50 shadow-sm">
      <div className="h-full px-4 flex items-center justify-between">
        {/* 左侧：返回和店铺信息 */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回后台
            </Button>
          </Link>
          <div className="flex items-center gap-2 border-l pl-4">
            <Avatar className="h-8 w-8 border-2 border-orange-200">
              <AvatarImage src={shopConfig.logo} alt="店铺Logo" />
              <AvatarFallback className="bg-orange-500 text-white">
                <Store className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-bold">{shopConfig.name}</div>
              <div className="text-xs text-muted-foreground">
                {pathname === '/pos/hardware'
                  ? '硬件配置'
                  : pathname === '/pos/shift'
                  ? '交接班'
                  : '收银台操作'}
              </div>
            </div>
          </div>
        </div>

        {/* 中间：营业员信息 */}
        <div className="flex items-center gap-3">
          {currentStaff ? (
            <Link href="/pos/shift">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-orange-500 text-white text-xs">
                    {currentStaff.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{currentStaff.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {currentStaff.role === 'admin' ? '管理员' : '收银员'}
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <Link href="/pos/shift">
              <Button variant="outline" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                登录
              </Button>
            </Link>
          )}
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2">
          {pathname === '/pos' && (
            <>
              <Link href="/pos/shift">
                <Button variant="ghost" size="icon" title="交接班">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pos/hardware">
                <Button variant="ghost" size="icon" title="硬件配置">
                  <Printer className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
          {pathname === '/pos/hardware' && (
            <Link href="/pos">
              <Button variant="ghost" size="icon" title="返回收银台">
                <Store className="h-4 w-4" />
              </Button>
            </Link>
          )}
          {pathname === '/pos/shift' && (
            <Link href="/pos">
              <Button variant="ghost" size="icon" title="返回收银台">
                <Store className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          {currentStaff && (
            <Button variant="ghost" size="icon" onClick={handleLogout} title="退出登录">
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
