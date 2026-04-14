'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Lock, User, Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function HeadquarterLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError('');

    // 模拟登录验证
    setTimeout(() => {
      if (username === 'superadmin' && password === 'admin888') {
        localStorage.setItem('hq_logged_in', 'true');
        localStorage.setItem('hq_user', JSON.stringify({
          id: 'hq-001',
          name: '超级管理员',
          role: 'superadmin',
          department: '总部',
          permissions: ['all'],
          avatar: '',
        }));
        router.push('/dashboard');
      } else if (username === 'manager' && password === 'manager123') {
        localStorage.setItem('hq_logged_in', 'true');
        localStorage.setItem('hq_user', JSON.stringify({
          id: 'hq-002',
          name: '运营经理',
          role: 'manager',
          department: '运营部',
          permissions: ['inventory', 'promotion', 'report', 'store'],
          avatar: '',
        }));
        router.push('/dashboard');
      } else if (username === 'finance' && password === 'finance123') {
        localStorage.setItem('hq_logged_in', 'true');
        localStorage.setItem('hq_user', JSON.stringify({
          id: 'hq-003',
          name: '财务主管',
          role: 'finance',
          department: '财务部',
          permissions: ['finance', 'report'],
          avatar: '',
        }));
        router.push('/dashboard');
      } else if (username === 'supply' && password === 'supply123') {
        localStorage.setItem('hq_logged_in', 'true');
        localStorage.setItem('hq_user', JSON.stringify({
          id: 'hq-004',
          name: '供应链专员',
          role: 'supply',
          department: '供应链部',
          permissions: ['supply', 'inventory'],
          avatar: '',
        }));
        router.push('/dashboard');
      } else {
        setError('用户名或密码错误');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex">
      {/* 左侧品牌区域 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 className="h-7 w-7" />
            </div>
            <span className="text-2xl font-bold">海邻到家</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">总部管理后台</h1>
          <p className="text-xl text-purple-100 mb-8">
            统一管控 · 数据驱动 · 智能决策
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-xl">🏪</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">门店管理</h3>
              <p className="text-purple-100 text-sm">多门店统一管控与分级权限</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">数据看板</h3>
              <p className="text-purple-100 text-sm">全链路经营数据实时监控</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-xl">🚚</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">供应链协同</h3>
              <p className="text-purple-100 text-sm">采购配送一体化管理</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">财务分账</h3>
              <p className="text-purple-100 text-sm">自动分账与财务报表</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-xl">🛡️</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">合规风控</h3>
              <p className="text-purple-100 text-sm">临期预警与巡店管理</p>
            </div>
          </div>
        </div>

        <div className="text-purple-200 text-sm">
          © 2024 海邻到家 · 让社区生活更美好
        </div>
      </div>

      {/* 右侧登录区域 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* 移动端Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">海邻到家</span>
            </div>
            <h1 className="text-2xl font-bold">总部管理后台</h1>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">登录总部账号</CardTitle>
              <CardDescription>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Shield className="h-4 w-4" />
                  使用总部管理员账号登录
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-500 cursor-pointer">
                    记住我
                  </Label>
                </div>
                <button className="text-sm text-purple-600 hover:underline">
                  忘记密码？
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg text-center">
                  {error}
                </div>
              )}

              <Button
                className="w-full h-11 bg-purple-600 hover:bg-purple-700"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? '登录中...' : '登录'}
              </Button>

              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
                <p className="font-medium text-gray-700 mb-2">测试账号：</p>
                <p>超级管理员: superadmin / admin888</p>
                <p>运营经理: manager / manager123</p>
                <p>财务主管: finance / finance123</p>
                <p>供应链专员: supply / supply123</p>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-gray-500 text-center">
                  总部后台与店长后台使用独立账号体系
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 返回统一登录页面 */}
          <div className="mt-6 text-center">
            <Button variant="ghost" asChild>
              <a href="/login">
                ← 返回系统选择
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
