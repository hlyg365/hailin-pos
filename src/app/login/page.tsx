'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Store, 
  Smartphone,
  LayoutDashboard,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function UnifiedLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLogin = async (system: 'headquarters' | 'pos' | 'assistant' | 'store-admin') => {
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError('');

    // 模拟登录验证
    setTimeout(() => {
      setLoading(false);
      
      // 简单的验证逻辑
      if (username.length < 3) {
        setError('用户名至少3个字符');
        return;
      }
      
      if (password.length < 4) {
        setError('密码至少4个字符');
        return;
      }

      // 登录成功
      setSuccess(true);
      localStorage.setItem('logged_in', 'true');
      localStorage.setItem('user', JSON.stringify({
        id: `user-${Date.now()}`,
        name: username,
        system: system,
        loginTime: new Date().toISOString(),
      }));

      // 根据系统跳转到不同页面
      setTimeout(() => {
        switch (system) {
          case 'headquarters':
            router.push('/auth/login');
            break;
          case 'pos':
            router.push('/pos/auth/login');
            break;
          case 'assistant':
            router.push('/assistant/auth/login');
            break;
          case 'store-admin':
            router.push('/store-admin/auth/login');
            break;
        }
      }, 1000);
    }, 1000);
  };

  const systemConfigs = {
    headquarters: {
      icon: Building2,
      title: '总部管理',
      description: '管理所有门店、库存、财务和报表',
      color: 'blue',
      testAccount: 'superadmin / admin888',
      tip: '总部运营人员使用'
    },
    pos: {
      icon: Store,
      title: '收银台',
      description: '门店收银、商品管理、订单处理',
      color: 'orange',
      testAccount: 'cashier / 123456',
      tip: '门店收银员使用，需固定电脑'
    },
    assistant: {
      icon: Smartphone,
      title: '店长助手',
      description: '移动端管理、库存盘点、移动收银',
      color: 'green',
      testAccount: 'manager / 123456',
      tip: '手机端使用，适合移动场景'
    },
    'store-admin': {
      icon: LayoutDashboard,
      title: '店长管理',
      description: 'PC端门店管理、员工管理、促销申请',
      color: 'purple',
      testAccount: 'admin / 123456',
      tip: '电脑端使用，功能更全面'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4 shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">海邻到家 - 智能收银系统</h1>
          <p className="text-gray-600">请选择登录系统</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">系统登录</CardTitle>
            <CardDescription className="text-center">
              输入用户名和密码登录系统
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 用户名和密码 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    用户名
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && setLoading(false)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    密码
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="请输入密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && setLoading(false)}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* 成功提示 */}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  登录成功，正在跳转...
                </div>
              )}

              {/* 系统选择 */}
              <div className="space-y-3">
                <Label>选择登录系统</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(systemConfigs).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <Button
                        key={key}
                        variant="outline"
                        className="h-auto flex-col gap-2 py-4 hover:border-orange-500 hover:bg-orange-50 transition-colors"
                        onClick={() => !loading && !success && handleLogin(key as any)}
                        disabled={loading || success}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          config.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                          config.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                          config.color === 'green' ? 'bg-green-100 text-green-600' :
                          config.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-sm">{config.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {config.testAccount}
                          </div>
                          {config.tip && (
                            <div className="text-xs text-blue-600 mt-0.5">
                              {config.tip}
                            </div>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* 记住我 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600">
                  记住登录状态
                </Label>
              </div>

              {/* 加载状态 */}
              {loading && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 text-orange-600">
                    <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">登录中...</span>
                  </div>
                </div>
              )}

              {/* 提示信息 */}
              <div className="text-center text-xs text-gray-500 space-y-2">
                <p>测试账号已在按钮上标注</p>
                <p>首次登录可以使用任意用户名和密码（长度分别≥3和4）</p>
              </div>

              {/* 系统说明 */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
                <h3 className="font-medium text-blue-900 mb-2">💡 系统说明</h3>
                <ul className="space-y-1 text-blue-700 text-xs">
                  <li>• <strong>总部管理</strong>：总部运营人员使用，管理所有门店</li>
                  <li>• <strong>收银台</strong>：门店收银员使用，需固定电脑</li>
                  <li>• <strong>店长助手</strong>：手机端使用，适合移动场景（库存盘点、移动收银）</li>
                  <li>• <strong>店长管理</strong>：电脑端使用，功能更全面（员工管理、促销管理等）</li>
                  <li className="text-blue-600 mt-2">💡 建议日常办公使用「店长管理」，移动场景使用「店长助手」</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 页脚 */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2024 海邻到家 - 社区便利店智能收银系统</p>
        </div>
      </div>
    </div>
  );
}
