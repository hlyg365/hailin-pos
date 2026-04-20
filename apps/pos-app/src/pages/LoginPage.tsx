import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeStore, useStoreStore } from '../store';
import { TEST_ACCOUNTS, getRoleColor } from '../config/testAccounts';

interface LoginPageProps {
  isCashier?: boolean;  // 是否为收银台登录页
}

export default function LoginPage({ isCashier = false }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useEmployeeStore();
  const { stores } = useStoreStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username) {
      setError('请输入工号');
      return;
    }

    // 演示模式：任意输入即可登录
    const account = TEST_ACCOUNTS.find(a => a.operatorId === username || a.phone === username);
    
    if (account) {
      login({
        id: account.operatorId,
        name: account.name,
        phone: account.phone,
        role: account.role as 'admin' | 'manager' | 'cashier',
        storeId: account.storeId,
        status: 'active',
        hiredAt: new Date().toISOString(),
      });
      
      // 收银台登录直接进入收银台
      if (isCashier) {
        navigate('/pos/cashier');
      } else {
        navigate(account.loginPath);
      }
    } else {
      // 通用登录演示
      login({
        id: username,
        name: username,
        phone: '13800000000',
        role: username.includes('admin') ? 'admin' : username.includes('cashier') ? 'cashier' : 'manager',
        storeId: 'WJ001',
        status: 'active',
        hiredAt: new Date().toISOString(),
      });
      
      // 收银台登录直接进入收银台
      if (isCashier) {
        navigate('/pos/cashier');
      } else if (username.includes('cashier')) {
        navigate('/pos/cashier');
      } else if (username.includes('admin')) {
        navigate('/dashboard');
      } else {
        navigate('/assistant');
      }
    }
  };

  const handleQuickLogin = (account: typeof TEST_ACCOUNTS[0]) => {
    login({
      id: account.operatorId,
      name: account.name,
      phone: account.phone,
      role: account.role as 'admin' | 'manager' | 'cashier',
      storeId: account.storeId,
      status: 'active',
      hiredAt: new Date().toISOString(),
    });
    // 收银台登录直接进入收银台
    if (isCashier) {
      navigate('/pos/cashier');
    } else {
      navigate(account.loginPath);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isCashier ? 'bg-gradient-to-br from-green-600 to-green-800' : 'bg-gradient-to-br from-blue-600 to-blue-800'}`}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          {!isCashier && (
            <>
              <div className="w-24 h-24 bg-white rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg p-2">
                <img src="/logo.png" alt="海邻到家" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-3xl font-bold text-white">海邻到家</h1>
              <p className="text-blue-200 mt-2">连锁便利店智慧收银系统 V6.0</p>
            </>
          )}
          {isCashier && (
            <>
              <h1 className="text-4xl font-bold text-white">智慧收银</h1>
              <p className="text-green-100 mt-2">海邻到家 · 请刷员工卡或输入工号</p>
            </>
          )}
        </div>

        {/* 登录表单 */}
        <div className={`rounded-2xl shadow-2xl p-8 ${isCashier ? 'bg-white' : ''}`}>
          <h2 className={`text-xl font-semibold mb-6 ${isCashier ? 'text-green-800' : 'text-gray-800'}`}>
            {isCashier ? '收银员登录' : '员工登录'}
          </h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isCashier ? 'text-green-700' : 'text-gray-700'}`}>
                操作员编号 / 手机号
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入操作员编号"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  isCashier ? 'border-green-300 focus:ring-green-500' : 'focus:ring-blue-500'
                }`}
              />
            </div>
            
            {!isCashier && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              type="submit"
              className={`w-full py-3 text-white rounded-lg font-medium hover:opacity-90 transition-colors ${
                isCashier ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              登录
            </button>
          </form>

          {/* 测试账号入口 */}
          {!isCashier && (
            <div className="mt-6 pt-6 border-t">
              <button
                onClick={() => setShowTestAccounts(!showTestAccounts)}
                className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-blue-600"
              >
                <span>👈 测试账号快速登录</span>
                <span>{showTestAccounts ? '▲ 收起' : '▼ 展开'}</span>
              </button>

              {showTestAccounts && (
                <div className="mt-4 space-y-3">
                  {TEST_ACCOUNTS.map((account) => (
                    <button
                      key={account.operatorId}
                      onClick={() => handleQuickLogin(account)}
                      className="w-full p-4 bg-gray-50 hover:bg-blue-50 rounded-lg text-left transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{account.name}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${getRoleColor(account.role)}`}>
                              {account.roleName}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {account.storeName} · {account.operatorId}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">快速登录 →</span>
                      </div>
                    </button>
                  ))}
                  
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-yellow-700">
                      <strong>💡 提示：</strong>测试模式下，密码可随意输入。建议使用上方测试账号快速体验不同角色功能。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className={`text-center mt-6 text-sm ${isCashier ? 'text-green-200' : 'text-blue-200'}`}>
          <p>© 2024 海邻到家 · 云端连锁收银系统</p>
          {!isCashier && <p className="mt-1">支持 PC收银 | POS一体机 | 平板 | 自助收银</p>}
        </div>
      </div>
    </div>
  );
}
