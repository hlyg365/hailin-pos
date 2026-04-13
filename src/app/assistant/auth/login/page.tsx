'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AssistantLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      if (username === 'admin' && password === '123456') {
        localStorage.setItem('assistant_logged_in', 'true');
        localStorage.setItem('assistant_user', JSON.stringify({
          name: '张店长',
          store: '海邻到家·阳光店',
          role: '店长',
        }));
        router.push('/assistant');
      } else {
        setError('用户名或密码错误');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Store className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl">店长助手</CardTitle>
          <CardDescription>海邻到家社区便利店管理系统</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 用户名输入 */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          {/* 密码输入 */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          {/* 登录按钮 */}
          <Button
            className="w-full h-11 bg-blue-500 hover:bg-blue-600"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </Button>

          {/* 提示信息 */}
          <div className="text-center text-xs text-gray-400">
            <p>测试账号: admin / 123456</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
