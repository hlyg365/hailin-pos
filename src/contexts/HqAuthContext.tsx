'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// 总部用户信息接口
export interface HqUser {
  id: string;
  name: string;
  role: 'superadmin' | 'manager' | 'finance' | 'supply' | 'compliance';
  department: string;
  permissions: string[];
  avatar?: string;
}

// Context 类型
interface HqAuthContextType {
  user: HqUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (user: HqUser) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

// 创建 Context（初始值为 undefined）
const HqAuthContext = createContext<HqAuthContextType | undefined>(undefined);

// 权限定义
export const PERMISSIONS = {
  // 门店管理
  STORE_VIEW: 'store:view',
  STORE_CREATE: 'store:create',
  STORE_EDIT: 'store:edit',
  STORE_DELETE: 'store:delete',
  STORE_FINANCE: 'store:finance',
  STORE_COMPLIANCE: 'store:compliance',

  // 库存管理
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_MANAGE: 'inventory:manage',
  INVENTORY_REQUEST: 'inventory:request',
  INVENTORY_PURCHASE: 'inventory:purchase',

  // 供应链管理
  SUPPLY_VIEW: 'supply:view',
  SUPPLY_MANAGE: 'supply:manage',
  SUPPLY_PURCHASE: 'supply:purchase',
  SUPPLY_DELIVERY: 'supply:delivery',

  // 财务管理
  FINANCE_VIEW: 'finance:view',
  FINANCE_MANAGE: 'finance:manage',
  FINANCE_SETTLEMENT: 'finance:settlement',
  FINANCE_REPORT: 'finance:report',

  // 营销管理
  PROMOTION_VIEW: 'promotion:view',
  PROMOTION_CREATE: 'promotion:create',
  PROMOTION_MANAGE: 'promotion:manage',

  // 报表分析
  REPORT_VIEW: 'report:view',
  REPORT_EXPORT: 'report:export',
  REPORT_ANALYSIS: 'report:analysis',

  // 系统管理
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_USER: 'system:user',
} as const;

// 角色权限映射
const ROLE_PERMISSIONS: Record<string, string[]> = {
  superadmin: ['all'], // 超级管理员拥有所有权限
  manager: [
    'store:view', 'store:edit',
    'inventory:view', 'inventory:manage',
    'promotion:view', 'promotion:create', 'promotion:manage',
    'report:view', 'report:export',
  ],
  finance: [
    'finance:view', 'finance:manage', 'finance:settlement', 'finance:report',
    'store:finance',
    'report:view', 'report:export',
  ],
  supply: [
    'supply:view', 'supply:manage', 'supply:purchase', 'supply:delivery',
    'inventory:view', 'inventory:purchase',
    'inventory:request',
  ],
  compliance: [
    'store:compliance',
    'inventory:view',
    'report:view',
  ],
};

// 从 localStorage 同步获取用户信息
function getStoredUser(): HqUser | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const isLoggedIn = localStorage.getItem('hq_logged_in');
    const userData = localStorage.getItem('hq_user');
    
    if (isLoggedIn === 'true' && userData) {
      return JSON.parse(userData) as HqUser;
    }
  } catch (error) {
    console.error('Failed to parse stored user data:', error);
    localStorage.removeItem('hq_logged_in');
    localStorage.removeItem('hq_user');
  }
  return null;
}

// 判断是否为登录页面路径
function isLoginPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard/auth/login') || 
         pathname.startsWith('/dashboard/login') ||
         pathname.startsWith('/store-admin/auth/login') ||
         pathname.startsWith('/store-admin/login') ||
         pathname.startsWith('/assistant/auth/login') ||
         pathname.startsWith('/assistant/login');
}

// 登录页面使用的简化 Provider
function LoginAuthProvider({ children }: { children: ReactNode }) {
  return (
    <HqAuthContext.Provider
      value={{
        user: null,
        isAuthenticated: false,
        loading: false,
        login: () => {},
        logout: () => {},
        hasPermission: () => false,
      }}
    >
      {children}
    </HqAuthContext.Provider>
  );
}

export function HqAuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // 登录页面使用简化 Provider，避免不必要的逻辑
  if (isLoginPath(pathname)) {
    return <LoginAuthProvider>{children}</LoginAuthProvider>;
  }

  // 初始化时同步获取用户状态，避免闪烁
  const [user, setUser] = useState<HqUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(false); // 改为 false，因为已同步获取
  const router = useRouter();

  // 页面可见性变化时检查登录状态（处理标签页切换等）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const storedUser = getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        } else if (user) {
          // 本地状态有用户，但 localStorage 没有，说明被清除了
          setUser(null);
          router.replace('/auth/login');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, router]);

  const login = useCallback((userData: HqUser) => {
    setUser(userData);
    localStorage.setItem('hq_logged_in', 'true');
    localStorage.setItem('hq_user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('hq_logged_in');
    localStorage.removeItem('hq_user');
    router.push('/dashboard/auth/login');
  }, [router]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('all')) return true;
    return user.permissions.includes(permission);
  }, [user]);

  return (
    <HqAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </HqAuthContext.Provider>
  );
}

export function useHqAuth() {
  const context = useContext(HqAuthContext);
  if (context === undefined) {
    throw new Error('useHqAuth must be used within a HqAuthProvider');
  }
  return context;
}

// 权限检查组件（用于权限保护）
interface PermissionGuardProps {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({ permission, fallback = null, children }: PermissionGuardProps) {
  const { hasPermission } = useHqAuth();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
