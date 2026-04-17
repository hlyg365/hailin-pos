import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      if (storeId && operatorId && password) {
        navigate('/pos/cashier');
      } else {
        setError('请填写完整信息');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl font-bold">邻</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">海邻到家</h1>
          <p className="text-gray-500 mt-2">智能便利店管理系统</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">门店编号</label>
            <input type="text" value={storeId} onChange={(e) => setStoreId(e.target.value)} placeholder="请输入门店编号" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">操作员编号</label>
            <input type="text" value={operatorId} onChange={(e) => setOperatorId(e.target.value)} placeholder="请输入操作员编号" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50">
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>演示: 任意输入即可登录</p>
        </div>
      </div>
    </div>
  );
}
