'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 店铺信息接口
interface ShopInfo {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  status: 'open' | 'closed';
  businessHours: {
    open: string;
    close: string;
  };
}

// 员工信息接口
interface PosUser {
  id: number;
  name: string;
  role: '店长' | '营业员';
  phone: string;
  shopId: number;
  shopName: string;
  loginTime: string;
}

// Context 类型
interface PosAuthContextType {
  user: PosUser | null;
  shop: ShopInfo | null;
  isAuthenticated: boolean;
  login: (user: PosUser) => void;
  logout: () => void;
  loading: boolean;
}

const PosAuthContext = createContext<PosAuthContextType | undefined>(undefined);

// 模拟店铺数据
const mockShops: Record<number, ShopInfo> = {
  1: {
    id: 1,
    name: '南山店',
    code: 'NS001',
    address: '深圳市南山区科技园南路88号',
    phone: '0755-8888-0001',
    status: 'open',
    businessHours: { open: '08:00', close: '22:00' },
  },
  2: {
    id: 2,
    name: '福田店',
    code: 'FT001',
    address: '深圳市福田区华强北路66号',
    phone: '0755-8888-0002',
    status: 'open',
    businessHours: { open: '08:00', close: '22:00' },
  },
  3: {
    id: 3,
    name: '龙华店',
    code: 'LH001',
    address: '深圳市龙华区民治大道128号',
    phone: '0755-8888-0003',
    status: 'open',
    businessHours: { open: '07:30', close: '23:00' },
  },
};

// 生成简单的 token（实际项目中应使用 JWT）
function generateToken(userId: number, shopId: number): string {
  const payload = `${userId}:${shopId}:${Date.now()}`;
  return btoa(payload);
}

// 设置 cookie
function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

// 删除 cookie
function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

export function PosAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PosUser | null>(null);
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化时检查登录状态
  useEffect(() => {
    const storedUser = localStorage.getItem('pos_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser) as PosUser;
        setUser(userData);
        // 根据店铺ID获取店铺信息
        const shopInfo = mockShops[userData.shopId];
        if (shopInfo) {
          setShop(shopInfo);
        }
      } catch {
        localStorage.removeItem('pos_user');
        deleteCookie('pos_token');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: PosUser) => {
    setUser(userData);
    localStorage.setItem('pos_user', JSON.stringify(userData));
    
    // 生成并设置 token cookie（用于中间件认证）
    const token = generateToken(userData.id, userData.shopId);
    setCookie('pos_token', token, 7);
    
    // 设置店铺信息
    const shopInfo = mockShops[userData.shopId];
    if (shopInfo) {
      setShop(shopInfo);
    }
  };

  const logout = () => {
    setUser(null);
    setShop(null);
    localStorage.removeItem('pos_user');
    deleteCookie('pos_token');
  };

  return (
    <PosAuthContext.Provider value={{ 
      user, 
      shop,
      isAuthenticated: !!user, 
      login, 
      logout, 
      loading 
    }}>
      {children}
    </PosAuthContext.Provider>
  );
}

export function usePosAuth() {
  const context = useContext(PosAuthContext);
  if (context === undefined) {
    throw new Error('usePosAuth must be used within a PosAuthProvider');
  }
  return context;
}

// 获取店铺列表（用于登录选择）
export function getShopList(): ShopInfo[] {
  return Object.values(mockShops);
}
