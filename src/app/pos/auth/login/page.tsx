'use client';

// 强制动态渲染
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Store,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// 模拟员工数据（按店铺分组）
const employeesByShop: Record<number, Array<{id: number; name: string; role: '店长' | '营业员'; phone: string; password: string}>> = {
  1: [ // 南山店
    { id: 1, name: '王小明', role: '店长', phone: '13800138001', password: '123456' },
    { id: 2, name: '李小红', role: '营业员', phone: '13800138002', password: '123456' },
    { id: 3, name: '张小华', role: '营业员', phone: '13800138003', password: '123456' },
  ],
  2: [ // 福田店
    { id: 4, name: '刘大伟', role: '店长', phone: '13800138004', password: '123456' },
    { id: 5, name: '赵小燕', role: '营业员', phone: '13800138005', password: '123456' },
  ],
  3: [ // 龙华店
    { id: 6, name: '周小强', role: '店长', phone: '13800138006', password: '123456' },
    { id: 7, name: '吴小梅', role: '营业员', phone: '13800138007', password: '123456' },
  ],
};

// 店铺数据
const shops = [
  { id: 1, name: '南山店', code: 'NS001', address: '深圳市南山区科技园南路88号' },
  { id: 2, name: '福田店', code: 'FT001', address: '深圳市福田区华强北路66号' },
  { id: 3, name: '龙华店', code: 'LH001', address: '深圳市龙华区民治大道128号' },
];

// 生成简单的 token
function generateToken(userId: number, shopId: number): string {
  const payload = `${userId}:${shopId}:${Date.now()}`;
  return btoa(payload);
}

// 设置 cookie
function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export default function PosLoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  const [selectedShopId, setSelectedShopId] = useState<string>('1');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 确保组件只在客户端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedShop = shops.find(s => s.id === parseInt(selectedShopId));
  const currentEmployees = employeesByShop[parseInt(selectedShopId)] || [];

  const handleLogin = () => {
    setError('');
    setLoading(true);

    // 模拟登录验证
    setTimeout(() => {
      const employee = currentEmployees.find(
        e => e.phone === phone && e.password === password
      );

      if (employee) {
        // 构建用户数据
        const userData = {
          id: employee.id,
          name: employee.name,
          role: employee.role,
          phone: employee.phone,
          shopId: parseInt(selectedShopId),
          shopName: selectedShop?.name || '',
          loginTime: new Date().toISOString(),
        };
        
        // 保存到 localStorage
        localStorage.setItem('pos_user', JSON.stringify(userData));
        
        // 设置 cookie（用于可能的中间件检查）
        const token = generateToken(employee.id, parseInt(selectedShopId));
        setCookie('pos_token', token, 7);
        
        console.log('登录成功，准备跳转到 /pos');
        
        // 跳转到收银台 - 使用 window.location 确保完全刷新页面
        window.location.href = '/pos';
      } else {
        setError('手机号或密码错误，请检查输入');
        setLoading(false);
      }
    }, 500);
  };

  // 快速登录（演示用）
  const quickLogin = (employee: typeof currentEmployees[0]) => {
    setPhone(employee.phone);
    setPassword(employee.password);
  };

  // 在客户端渲染之前显示加载状态
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <Store className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">海邻到家</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">收银台登录</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* 店铺选择 */}
          <div className="space-y-2">
            <Label htmlFor="shop">选择店铺</Label>
            <Select value={selectedShopId} onValueChange={setSelectedShopId}>
              <SelectTrigger className="h-11">
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="选择店铺" />
              </SelectTrigger>
              <SelectContent>
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{shop.name}</span>
                      <Badge variant="outline" className="text-[10px]">{shop.code}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedShop && (
              <p className="text-xs text-muted-foreground">{selectedShop.address}</p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                placeholder="请输入手机号"
                className="pl-10"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                className="pl-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button 
            className="w-full bg-orange-500 hover:bg-orange-600 h-11"
            onClick={handleLogin}
            disabled={loading || !phone || !password}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                登录中...
              </>
            ) : '登录'}
          </Button>

          {/* 快速登录（演示用） */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center mb-3">
              快速登录（{selectedShop?.name || '当前店铺'}）
            </p>
            <div className="grid grid-cols-2 gap-2">
              {currentEmployees.map((emp) => (
                <Button
                  key={emp.id}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => quickLogin(emp)}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs text-orange-600">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-medium">{emp.name}</div>
                      <div className="text-[10px] text-muted-foreground">{emp.role}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
          
          {/* 测试提示 */}
          <div className="text-xs text-center text-muted-foreground pt-2 border-t">
            测试账号：点击下方快速登录按钮自动填充
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
