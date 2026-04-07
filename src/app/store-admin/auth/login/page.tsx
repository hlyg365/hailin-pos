'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Lock, User, Eye, EyeOff, Smartphone, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function StoreAdminLoginPage() {
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
      if (username === 'admin' && password === '123456') {
        localStorage.setItem('store_admin_logged_in', 'true');
        localStorage.setItem('store_admin_user', JSON.stringify({
          id: '1',
          name: '张店长',
          storeId: 'store-001',
          storeName: '海邻到家·阳光店',
          role: 'store_manager',
          avatar: '',
        }));
        router.push('/store-admin');
      } else if (username === 'clerk' && password === '123456') {
        localStorage.setItem('store_admin_logged_in', 'true');
        localStorage.setItem('store_admin_user', JSON.stringify({
          id: '2',
          name: '李店员',
          storeId: 'store-001',
          storeName: '海邻到家·阳光店',
          role: 'clerk',
          avatar: '',
        }));
        router.push('/store-admin');
      } else {
        setError('用户名或密码错误');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex">
      {/* 左侧品牌区域 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-700 text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Store className="h-7 w-7" />
            </div>
            <span className="text-2xl font-bold">海邻到家</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">店长管理中心</h1>
          <p className="text-xl text-blue-100 mb-8">
            一站式店铺经营管理平台
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">数据看板</h3>
              <p className="text-blue-100 text-sm">实时掌握店铺经营数据</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-xl">📦</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">库存管理</h3>
              <p className="text-blue-100 text-sm">智能库存预警与盘点</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-xl">👥</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">会员运营</h3>
              <p className="text-blue-100 text-sm">会员数据精准营销</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-xl">📱</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1">移动办公</h3>
              <p className="text-blue-100 text-sm">店长助手APP随时管理</p>
            </div>
          </div>
        </div>

        <div className="text-blue-200 text-sm">
          © 2024 海邻到家 · 让社区生活更美好
        </div>
      </div>

      {/* 右侧登录区域 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* 移动端Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Store className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">海邻到家</span>
            </div>
            <h1 className="text-2xl font-bold">店长管理中心</h1>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">登录账号</CardTitle>
              <CardDescription>使用店长账号或员工账号登录</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="password" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="password">账号密码</TabsTrigger>
                  <TabsTrigger value="qrcode">扫码登录</TabsTrigger>
                </TabsList>

                {/* 账号密码登录 */}
                <TabsContent value="password" className="space-y-4">
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
                    <button className="text-sm text-blue-600 hover:underline">
                      忘记密码？
                    </button>
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg text-center">
                      {error}
                    </div>
                  )}

                  <Button
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                    onClick={handleLogin}
                    disabled={loading}
                  >
                    {loading ? '登录中...' : '登录'}
                  </Button>

                  <div className="text-center text-xs text-gray-400">
                    <p>店长账号: admin / 123456</p>
                    <p>员工账号: clerk / 123456</p>
                  </div>
                </TabsContent>

                {/* 扫码登录 */}
                <TabsContent value="qrcode">
                  <div className="text-center py-6">
                    <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center mb-4 border-2 border-dashed border-gray-200">
                      <div className="text-center">
                        <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">打开店长助手APP</p>
                        <p className="text-sm text-gray-400">扫码登录</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      请使用店长助手APP扫描二维码登录
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="link" className="text-blue-600 mt-2">
                          没有APP？立即下载
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>下载店长助手APP</DialogTitle>
                          <DialogDescription>
                            扫描下方二维码下载店长助手APP
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center py-4">
                          <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                            <div className="text-center">
                              <QrCode className="h-20 w-20 text-blue-500 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">APP下载二维码</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 text-center">
                            使用微信或浏览器扫描二维码<br />下载店长助手APP
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* APP下载入口 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-3">还没有店长助手APP？</p>
            <Button variant="outline" asChild>
              <a href="/store-admin/app-download">
                <Smartphone className="h-4 w-4 mr-2" />
                下载APP
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
