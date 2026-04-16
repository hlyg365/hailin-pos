import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosAuth } from '@hailin/core';
import { initializeHardware } from '@hailin/hardware';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error } = usePosAuth();
  const [storeCode, setStoreCode] = useState('');
  const [operatorCode, setOperatorCode] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await login({
      storeCode,
      operatorCode,
      password,
    });
    
    if (success) {
      // 初始化硬件
      await initializeHardware();
      navigate('/cashier');
    }
  };

  const handleDemoLogin = async () => {
    const success = await login({
      storeCode: 'STORE001',
      operatorCode: 'OP001',
      password: '123456',
    });
    
    if (success) {
      navigate('/cashier');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <span className="text-3xl text-white font-bold">海</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">海邻到家</h1>
          <p className="text-gray-500 mt-1">智能收银系统</p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              店铺编号
            </label>
            <input
              type="text"
              value={storeCode}
              onChange={(e) => setStoreCode(e.target.value)}
              placeholder="请输入店铺编号"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              操作员编号
            </label>
            <input
              type="text"
              value={operatorCode}
              onChange={(e) => setOperatorCode(e.target.value)}
              placeholder="请输入操作员编号"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        {/* 分隔线 */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="px-4 text-gray-400 text-sm">或</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* 演示登录 */}
        <button
          onClick={handleDemoLogin}
          className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
        >
          演示模式登录
        </button>

        {/* 版本信息 */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          海邻到家收银系统 v3.0
        </div>
      </div>
    </div>
  );
}
