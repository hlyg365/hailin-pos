import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMember } from '@hailin/member';
import { ArrowLeft, Search, User, Phone, Star, Gift, History, X } from 'lucide-react';
import { formatCurrency } from '@hailin/core';

export default function MemberPage() {
  const navigate = useNavigate();
  const { currentMember, isLoggedIn, quickLogin, verifyCode, logout, levelName, discountRate, isBirthday, calculatePoints } = useMember();
  
  const [searchMode, setSearchMode] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 搜索会员
  const handleSearch = async () => {
    if (!searchValue.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 优先尝试会员码验证
      const member = await verifyCode(searchValue);
      if (member) {
        setSearchMode(false);
        setSearchValue('');
      }
    } catch (err: any) {
      // 尝试手机号
      if (/^1[3-9]\d{9}$/.test(searchValue)) {
        try {
          const member = await quickLogin(searchValue);
          setSearchMode(false);
          setSearchValue('');
        } catch (e: any) {
          setError('会员不存在');
        }
      } else {
        setError('请输入正确的手机号或会员码');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部栏 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate('/cashier')} className="p-2 hover:bg-white/10 rounded-lg">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">会员识别</h1>
        </div>

        {isLoggedIn && currentMember ? (
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {currentMember.name.slice(0, 1)}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold">{currentMember.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-amber-500 rounded-full text-xs">
                    {levelName}
                  </span>
                  <span className="text-white/80">{currentMember.phone}</span>
                </div>
              </div>
              <button onClick={logout} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{currentMember.points}</div>
                <div className="text-xs text-white/70">积分</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">¥{currentMember.balance.toFixed(2)}</div>
                <div className="text-xs text-white/70">储值</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{discountRate === 1 ? '-' : `${(discountRate * 10).toFixed(1)}折`}</div>
                <div className="text-xs text-white/70">折扣</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="w-16 h-16 mx-auto mb-2 opacity-50" />
            <p className="opacity-70">请扫描会员码或输入手机号</p>
          </div>
        )}
      </div>

      {/* 生日提示 */}
      {isBirthday && (
        <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl flex items-center gap-3">
          <span className="text-3xl">🎂</span>
          <div>
            <div className="font-bold">生日快乐！</div>
            <div className="text-sm opacity-80">今日享受双倍积分和额外折扣</div>
          </div>
        </div>
      )}

      {/* 搜索区域 */}
      {searchMode ? (
        <div className="mx-4 mt-4 p-4 bg-white rounded-xl">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="输入会员码或手机号"
              className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg disabled:opacity-50"
            >
              {loading ? '查询中...' : '查询'}
            </button>
          </div>
          {error && (
            <div className="mt-2 text-red-500 text-sm">{error}</div>
          )}
          <button
            onClick={() => setSearchMode(false)}
            className="mt-3 w-full py-2 text-gray-500"
          >
            取消
          </button>
        </div>
      ) : (
        <div className="mx-4 mt-4 space-y-3">
          <button
            onClick={() => setSearchMode(true)}
            className="w-full py-4 bg-white rounded-xl flex items-center justify-center gap-2 text-blue-600 font-medium"
          >
            <Search className="w-5 h-5" />
            扫码/输入会员码
          </button>

          {isLoggedIn && (
            <>
              <button className="w-full py-4 bg-white rounded-xl flex items-center justify-center gap-2 text-gray-700">
                <History className="w-5 h-5" />
                积分记录
              </button>
              <button className="w-full py-4 bg-white rounded-xl flex items-center justify-center gap-2 text-gray-700">
                <Gift className="w-5 h-5" />
                领取优惠券
              </button>
              <button className="w-full py-4 bg-white rounded-xl flex items-center justify-center gap-2 text-gray-700">
                <Star className="w-5 h-5" />
                会员权益
              </button>
            </>
          )}
        </div>
      )}

      {/* 会员权益 */}
      <div className="mx-4 mt-6">
        <h2 className="text-lg font-semibold mb-3">会员权益</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '💰', title: '积分抵现', desc: '100积分=1元' },
            { icon: '🎁', title: '生日礼包', desc: '生日当月专享' },
            { icon: '🏷️', title: '会员折扣', desc: '全场专属价' },
            { icon: '🚀', title: '优先体验', desc: '新品抢先购' },
          ].map((benefit, i) => (
            <div key={i} className="p-4 bg-white rounded-xl">
              <span className="text-2xl">{benefit.icon}</span>
              <div className="font-medium mt-2">{benefit.title}</div>
              <div className="text-xs text-gray-500">{benefit.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
