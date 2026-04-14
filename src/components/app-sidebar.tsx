'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Gift,
  Wallet,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Store,
  Package,
  Shield,
  Smartphone,
  UsersRound,
  Truck,
  ArrowRightLeft,
  Warehouse,
  ChevronDown,
  ChevronRight,
  Monitor,
  User,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useHqAuth } from '@/contexts/HqAuthContext';

const navigation = [
  {
    title: '总部看板',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: '审批中心',
    href: '/dashboard/approvals',
    icon: Shield,
    badge: '待办',
  },
  {
    title: '收银台',
    href: '/pos',
    icon: ShoppingBag,
    isHighlighted: true,
    isExternal: true,
  },
  {
    title: '进销存管理',
    icon: Warehouse,
    items: [
      { title: '进销存报表', href: '/dashboard/inventory/psa' },
      { title: '总部采购入库', href: '/dashboard/inventory/purchase' },
      { title: '店铺采购申请', href: '/dashboard/inventory/store-requests' },
      { title: '库存调拨', href: '/dashboard/inventory/transfer' },
      { title: '库存记录', href: '/dashboard/inventory' },
      { title: '供应商管理', href: '/dashboard/inventory/suppliers' },
      { title: '库存盘点', href: '/dashboard/inventory/stocktakes' },
    ],
  },
  {
    title: '商品管理',
    icon: Package,
    items: [
      { title: '商品列表', href: '/dashboard/products' },
      { title: '分类管理', href: '/dashboard/categories' },
    ],
  },
  {
    title: '订单管理',
    icon: ClipboardList,
    items: [
      { title: '订单列表', href: '/dashboard/orders' },
      { title: '退款订单', href: '/dashboard/orders/refunds' },
      { title: '挂单记录', href: '/dashboard/orders/pending' },
    ],
  },
  {
    title: '会员管理',
    icon: Users,
    items: [
      { title: '统一会员管理', href: '/dashboard/members/unified' },
      { title: '会员列表', href: '/dashboard/members' },
      { title: '会员等级', href: '/dashboard/customers/membership' },
      { title: '积分规则', href: '/dashboard/members/points' },
    ],
  },
  {
    title: '员工管理',
    icon: Users,
    items: [
      { title: '员工列表', href: '/dashboard/staff' },
      { title: '绩效统计', href: '/dashboard/staff/performance' },
    ],
  },
  {
    title: '营销管理',
    icon: Gift,
    items: [
      { title: '优惠券', href: '/dashboard/marketing/coupons' },
      { title: '促销活动', href: '/dashboard/marketing/promotions' },
    ],
  },
  {
    title: '社区团购',
    icon: UsersRound,
    items: [
      { title: '团购活动', href: '/dashboard/group-buy' },
      { title: '群接龙', href: '/dashboard/group-buy/dragon' },
    ],
  },
  {
    title: '外卖对接',
    icon: Truck,
    items: [
      { title: '平台管理', href: '/dashboard/delivery/platforms' },
      { title: '外卖订单', href: '/dashboard/delivery/orders' },
    ],
  },
  {
    title: '小程序商城',
    icon: Smartphone,
    items: [
      { title: '商城首页', href: '/dashboard/marketing/mini-store' },
      { title: '分类管理', href: '/dashboard/marketing/mini-store/categories' },
      { title: '商品图片', href: '/dashboard/marketing/mini-store/product-images' },
      { title: '小程序订单', href: '/dashboard/marketing/mini-store/orders' },
      { title: '配送管理', href: '/dashboard/marketing/mini-store/delivery' },
      { title: '积分商城', href: '/dashboard/marketing/mini-store/points-mall' },
    ],
  },
  {
    title: '数据报表',
    icon: BarChart3,
    items: [
      { title: '销售分析', href: '/dashboard/analytics' },
      { title: '商品分析', href: '/dashboard/analytics/products' },
      { title: '会员分析', href: '/dashboard/analytics/members' },
      { title: '数据报表', href: '/dashboard/reports/analysis' },
    ],
  },
  {
    title: '多店管理',
    icon: Store,
    items: [
      { title: '店铺管理', href: '/dashboard/stores/manage' },
    ],
  },
  {
    title: '系统设置',
    icon: Settings,
    items: [
      { title: '店铺设置', href: '/dashboard/settings/shop' },
      { title: '店长账号管理', href: '/dashboard/settings/store-managers' },
      { title: '收银员管理', href: '/dashboard/settings/staff' },
      { title: '打印设置', href: '/dashboard/settings/printer' },
      { title: '价签打印设置', href: '/dashboard/settings/label' },
      { title: '支付配置', href: '/dashboard/settings/payment' },
      { title: '客显屏管理', href: '/dashboard/settings/customer-display' },
      { title: 'AI功能配置', href: '/dashboard/settings/ai-config' },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useHqAuth();
  // 默认展开的菜单项
  const defaultExpandedItems = ['进销存管理', '商品管理', '数据报表', '系统设置'];
  const [expandedItems, setExpandedItems] = useState<string[]>(defaultExpandedItems);
  const [mounted, setMounted] = useState(false);

  // 仅在客户端初始化
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取当前路径是否匹配
  const getIsActive = (href: string) => {
    return pathname === href;
  };

  // 检查菜单是否展开
  const isExpanded = (title: string) => {
    return expandedItems.includes(title);
  };

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  // 子菜单列表组件 - 使用 CSS 过渡而非条件渲染
  const SubMenuList = ({ item }: { item: typeof navigation[0] }) => {
    if (!item.items) return null;
    const expanded = isExpanded(item.title);
    
    return (
      <div 
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{ 
          maxHeight: expanded ? `${item.items.length * 44}px` : '0px',
          opacity: expanded ? 1 : 0 
        }}
      >
        <ul className="ml-3 mt-1 space-y-0.5 border-l-2 border-slate-200 pl-3">
          {item.items.map((subItem) => {
            const isActive = getIsActive(subItem.href);
            return (
              <li key={subItem.href}>
                <Link
                  href={subItem.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                    isActive
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                  )}
                >
                  {subItem.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <aside className="w-64 h-full flex-col border-r border-slate-200 bg-slate-50 flex shrink-0">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
            <Store className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-base text-slate-800">海邻到家</div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-blue-500" />
              <div className="text-xs text-blue-600 font-medium">总部管理后台</div>
            </div>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {navigation.map((item) => (
            <li key={item.title}>
              {item.items ? (
                <div>
                  <button
                    onClick={() => toggleExpand(item.title)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all duration-150"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </div>
                    {isExpanded(item.title) ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                  <SubMenuList item={item} />
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    getIsActive(item.href)
                      ? 'bg-blue-500 text-white shadow-sm'
                      : item.isHighlighted && item.isExternal
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                  {item.isExternal && (
                    <Shield className="h-3 w-3 ml-auto opacity-70" />
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* 用户信息 */}
      <div className="border-t border-slate-200 bg-white p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-2 h-auto py-2 hover:bg-slate-50">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  {user?.name?.charAt(0) || '总'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium text-slate-800 truncate">{user?.name || '总部管理员'}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {user?.department || '总部'} · {getRoleName(user?.role)}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{user?.name}</span>
                <span className="text-xs text-slate-500 font-normal">{user?.department}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/shop">
                <Settings className="h-4 w-4 mr-2" />
                系统设置
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

// 角色名称映射
function getRoleName(role?: string): string {
  const roleMap: Record<string, string> = {
    superadmin: '超级管理员',
    manager: '运营经理',
    finance: '财务主管',
    supply: '供应链专员',
    compliance: '合规专员',
  };
  return roleMap[role || ''] || '员工';
}
