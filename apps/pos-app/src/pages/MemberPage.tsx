import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function MemberPage() {
  const [phone, setPhone] = useState('');
  const [member, setMember] = useState<any>(null);

  const handleSearch = () => {
    if (phone === '13800138000') {
      setMember({ name: '张三', phone: '138****8000', level: '金卡会员', points: 5680, balance: 120.50, discount: '95折' });
    } else {
      setMember(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/pos/cashier" className="text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <h1 className="text-lg font-semibold">会员识别</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">👤</div>
            <h2 className="text-lg font-semibold">扫描会员码或输入手机号</h2>
          </div>
          <div className="flex gap-3 mb-6">
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入手机号" className="flex-1 px-4 py-3 border border-gray-300 rounded-lg outline-none" />
            <button onClick={handleSearch} className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium">查询</button>
          </div>
          <div className="text-center text-gray-500">
            <p className="mb-2">或使用扫码枪扫描会员码</p>
            <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
            </div>
          </div>
        </div>

        {member && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">{member.name[0]}</div>
              <div>
                <div className="font-semibold text-lg">{member.name}</div>
                <div className="text-gray-500 text-sm">{member.phone}</div>
              </div>
              <div className="ml-auto px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-sm font-medium">{member.level}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center"><div className="text-2xl font-bold text-blue-500">{member.points}</div><div className="text-sm text-gray-500">积分</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-green-500">¥{member.balance}</div><div className="text-sm text-gray-500">余额</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-purple-500">{member.discount}</div><div className="text-sm text-gray-500">折扣</div></div>
            </div>
            <button onClick={() => window.history.back()} className="w-full mt-4 py-3 bg-blue-500 text-white rounded-lg font-medium">确认使用此会员</button>
          </div>
        )}
      </main>
    </div>
  );
}
