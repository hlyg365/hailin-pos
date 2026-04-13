'use client';

// 强制动态渲染
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import {
  Store,
  Lock,
  User,
  AlertCircle,
  Building2,
  Loader2,
  Wifi,
  WifiOff,
  Clock,
} from 'lucide-react';

// 模拟员工数据（按店铺分组）
const employeesByShop: Record<number, Array<{id: number; name: string; role: '店长' | '营业员'; phone: string; password: string}>> = {
  1: [
    { id: 1, name: '王小明', role: '店长', phone: '13800138001', password: '123456' },
    { id: 2, name: '李小红', role: '营业员', phone: '13800138002', password: '123456' },
    { id: 3, name: '张小华', role: '营业员', phone: '13800138003', password: '123456' },
  ],
  2: [
    { id: 4, name: '刘大伟', role: '店长', phone: '13800138004', password: '123456' },
    { id: 5, name: '赵小燕', role: '营业员', phone: '13800138005', password: '123456' },
  ],
  3: [
    { id: 6, name: '周小强', role: '店长', phone: '13800138006', password: '123456' },
    { id: 7, name: '吴小梅', role: '营业员', phone: '13800138007', password: '123456' },
  ],
};

const shops = [
  { id: 1, name: '南山店', code: 'NS001', address: '深圳市南山区科技园南路88号' },
  { id: 2, name: '福田店', code: 'FT001', address: '深圳市福田区华强北路66号' },
  { id: 3, name: '龙华店', code: 'LH001', address: '深圳市龙华区民治大道128号' },
];

function generateToken(userId: number, shopId: number): string {
  const payload = `${userId}:${shopId}:${Date.now()}`;
  return btoa(payload);
}

function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function CurrentTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="text-lg font-medium">
      {time.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })} &nbsp;
      {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

export default function PosLoginPage() {
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState('1');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const selectedShop = shops.find(s => s.id === parseInt(selectedShopId));
  const currentEmployees = employeesByShop[parseInt(selectedShopId)] || [];

  const handleLogin = useCallback(() => {
    console.log('handleLogin called', { phone, password });
    setError('');
    setLoading(true);

    setTimeout(() => {
      const employee = currentEmployees.find(
        e => e.phone === phone && e.password === password
      );

      if (employee) {
        const userData = {
          id: employee.id,
          name: employee.name,
          role: employee.role,
          phone: employee.phone,
          shopId: parseInt(selectedShopId),
          shopName: selectedShop?.name || '',
          loginTime: new Date().toISOString(),
        };
        
        localStorage.setItem('pos_user', JSON.stringify(userData));
        const token = generateToken(employee.id, parseInt(selectedShopId));
        setCookie('pos_token', token, 7);
        
        console.log('登录成功，跳转到收银台');
        window.location.href = '/pos';
      } else {
        setError('手机号或密码错误');
        setLoading(false);
      }
    }, 500);
  }, [phone, password, currentEmployees, selectedShopId, selectedShop]);

  const quickLogin = (emp: typeof currentEmployees[0]) => {
    setPhone(emp.phone);
    setPassword(emp.password);
    setError('');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" />
          <p className="text-lg">系统加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 flex flex-col">
      {/* 顶部状态栏 */}
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-700 px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🏪</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">海邻到家</h1>
              <p className="text-xs text-slate-400">社区便利店智能收银系统</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-5 h-5" />
              <CurrentTime />
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-sm font-medium">{isOnline ? '在线' : '离线'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 flex">
        {/* 左侧：登录表单 */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8">
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="h-20 w-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
                <Store className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800">收银台登录</h2>
              <p className="text-slate-500 mt-1">请输入账号信息登录系统</p>
            </div>

            {/* 店铺选择 */}
            <div className="mb-5">
              <label className="block text-base font-medium text-slate-700 mb-2">选择门店</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <select
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 text-lg bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none appearance-none"
                >
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id.toString()}>
                      {shop.name} ({shop.code})
                    </option>
                  ))}
                </select>
              </div>
              {selectedShop && (
                <p className="text-sm text-slate-500 mt-1">{selectedShop.address}</p>
              )}
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 mb-4">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            {/* 手机号 */}
            <div className="mb-4">
              <label className="block text-base font-medium text-slate-700 mb-2">手机号</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={11}
                  className="w-full h-14 pl-12 pr-4 text-lg bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 密码 */}
            <div className="mb-6">
              <label className="block text-base font-medium text-slate-700 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-12 pr-12 text-lg bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* 登录按钮 */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-14 text-lg font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  登录中...
                </span>
              ) : '登 录'}
            </button>

            {/* 快速登录 */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500 text-center mb-3">
                快速登录 - {selectedShop?.name}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {currentEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => quickLogin(emp)}
                    className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-orange-50 border-2 border-slate-200 hover:border-orange-300 rounded-xl transition-all"
                  >
                    <div className="h-10 w-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-slate-800">{emp.name}</div>
                      <div className="text-xs text-slate-500">{emp.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-center text-slate-400 mt-4">
              测试模式：点击快速登录按钮自动填充
            </p>
          </div>
        </div>

        {/* 右侧：品牌展示 */}
        <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-orange-500 via-orange-600 to-pink-600 p-12">
          <div className="text-center text-white max-w-lg">
            <div className="text-8xl mb-8">🏪</div>
            <h2 className="text-4xl font-bold mb-4">海邻到家</h2>
            <p className="text-xl text-orange-100 mb-8">社区便利店智能收银系统</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-3xl font-bold mb-1">3秒</div>
                <div className="text-sm text-orange-100">快速收银</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-3xl font-bold mb-1">离线</div>
                <div className="text-sm text-orange-100">正常运行</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-3xl font-bold mb-1">云端</div>
                <div className="text-sm text-orange-100">数据同步</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-3xl font-bold mb-1">安全</div>
                <div className="text-sm text-orange-100">稳定可靠</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900/80 backdrop-blur border-t border-slate-700 px-6 py-3">
        <div className="text-center text-slate-400 text-sm">
          海邻到家智能收银系统 V3.0.6 &nbsp;|&nbsp; 版权所有
        </div>
      </footer>
    </div>
  );
}
