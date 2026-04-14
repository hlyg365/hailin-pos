'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Search, 
  Users,
  Plus,
  Phone,
  Star,
  Gift,
  History,
  CreditCard,
  Crown,
  Shield,
  Award
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  phone: string;
  level: 'normal' | 'silver' | 'gold' | 'diamond';
  points: number;
  totalAmount: number;
  createdAt: number;
  lastVisit: number;
}

const levelConfig = {
  normal: { label: '普通会员', color: 'bg-slate-200 text-slate-600', icon: Award, discount: 1 },
  silver: { label: '银卡会员', color: 'bg-slate-300 text-slate-700', icon: Shield, discount: 0.98 },
  gold: { label: '金卡会员', color: 'bg-yellow-400 text-yellow-800', icon: Crown, discount: 0.95 },
  diamond: { label: '钻石会员', color: 'bg-purple-500 text-white', icon: Star, discount: 0.9 },
};

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = () => {
    // 模拟会员数据
    const mockMembers: Member[] = [
      { id: 'm1', name: '张伟', phone: '13800138001', level: 'diamond', points: 15800, totalAmount: 25800, createdAt: Date.now() - 365 * 86400000, lastVisit: Date.now() - 86400000 },
      { id: 'm2', name: '李娜', phone: '13800138002', level: 'gold', points: 8800, totalAmount: 12800, createdAt: Date.now() - 200 * 86400000, lastVisit: Date.now() - 3 * 86400000 },
      { id: 'm3', name: '王芳', phone: '13800138003', level: 'silver', points: 3200, totalAmount: 5800, createdAt: Date.now() - 150 * 86400000, lastVisit: Date.now() - 7 * 86400000 },
      { id: 'm4', name: '刘洋', phone: '13800138004', level: 'normal', points: 800, totalAmount: 1200, createdAt: Date.now() - 30 * 86400000, lastVisit: Date.now() - 86400000 * 15 },
      { id: 'm5', name: '陈明', phone: '13800138005', level: 'normal', points: 150, totalAmount: 320, createdAt: Date.now() - 10 * 86400000, lastVisit: Date.now() - 86400000 * 5 },
    ];
    
    localStorage.setItem('members', JSON.stringify(mockMembers));
    setMembers(mockMembers);
  };

  const filteredMembers = members.filter(m => 
    !searchKeyword || 
    m.name.includes(searchKeyword) || 
    m.phone.includes(searchKeyword)
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  };

  const addPoints = (memberId: string, points: number) => {
    setMembers(members.map(m => {
      if (m.id === memberId) {
        const newPoints = m.points + points;
        let newLevel: Member['level'] = m.level;
        if (newPoints >= 10000 && m.level !== 'diamond') newLevel = 'diamond';
        else if (newPoints >= 5000 && m.level === 'normal') newLevel = 'silver';
        else if (newPoints >= 5000 && m.level === 'silver') newLevel = 'gold';
        else if (newPoints >= 2000 && m.level === 'normal') newLevel = 'silver';
        return { ...m, points: newPoints, level: newLevel };
      }
      return m;
    }));
  };

  const getLevelIcon = (level: Member['level']) => {
    const config = levelConfig[level];
    const Icon = config.icon;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 头部 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/pos')} className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-800">会员管理</h1>
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600"
          >
            <Plus className="w-5 h-5" />
            新增会员
          </button>
        </div>
        
        {/* 搜索 */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索会员姓名或手机号..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl"
            />
          </div>
        </div>
      </header>

      <main className="p-4">
        {/* 会员统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { level: 'diamond', label: '钻石会员' },
            { level: 'gold', label: '金卡会员' },
            { level: 'silver', label: '银卡会员' },
            { level: 'normal', label: '普通会员' },
          ].map(item => {
            const count = members.filter(m => m.level === item.level).length;
            const config = levelConfig[item.level as keyof typeof levelConfig];
            return (
              <div key={item.level} className={`${config.color} rounded-xl p-3 text-center`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm opacity-80">{item.label}</p>
              </div>
            );
          })}
        </div>

        {/* 会员列表 */}
        <div className="space-y-3">
          {filteredMembers.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">暂无会员</p>
              <p className="text-sm">点击右上角「新增会员」添加</p>
            </div>
          ) : (
            filteredMembers.map(member => {
              const config = levelConfig[member.level];
              return (
                <div 
                  key={member.id} 
                  className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 ${config.color} rounded-full flex items-center justify-center`}>
                      <span className="text-2xl font-bold text-white">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-800">{member.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${config.color}`}>
                          {getLevelIcon(member.level)}
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {member.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-orange-500">{member.points.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">积分</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-3 pt-3 border-t border-slate-100 text-sm text-slate-500">
                    <span>累计消费: ¥{member.totalAmount.toLocaleString()}</span>
                    <span>最近: {formatDate(member.lastVisit)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* 会员详情弹窗 */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden rounded-t-3xl sm:rounded-2xl">
            <div className="bg-gradient-to-r from-orange-500 to-orange-400 text-white px-4 py-6 text-center">
              <div className={`w-20 h-20 ${levelConfig[selectedMember.level].color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <span className="text-3xl font-bold text-white">{selectedMember.name.charAt(0)}</span>
              </div>
              <h2 className="text-xl font-bold">{selectedMember.name}</h2>
              <p className="opacity-80">{levelConfig[selectedMember.level].label}</p>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* 积分和权益 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-orange-500">{selectedMember.points.toLocaleString()}</p>
                  <p className="text-sm text-slate-500">可用积分</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-500">{Math.floor(selectedMember.points / 100)}</p>
                  <p className="text-sm text-slate-500">可抵金额</p>
                </div>
              </div>

              {/* 会员权益 */}
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <h4 className="font-bold text-blue-700 mb-2 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  会员权益
                </h4>
                <p className="text-blue-600">
                  享受{levelConfig[selectedMember.level].discount * 100}折优惠
                </p>
                <p className="text-sm text-blue-500 mt-1">
                  升级还需 {selectedMember.level === 'diamond' ? 0 : selectedMember.level === 'gold' ? 10000 - selectedMember.points : selectedMember.level === 'silver' ? 5000 - selectedMember.points : 2000 - selectedMember.points} 积分
                </p>
              </div>

              {/* 信息 */}
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500">手机号</span>
                  <span className="font-medium">{selectedMember.phone}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500">累计消费</span>
                  <span className="font-medium text-orange-500">¥{selectedMember.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500">注册时间</span>
                  <span className="font-medium">{formatDate(selectedMember.createdAt)}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500">最近消费</span>
                  <span className="font-medium">{formatDate(selectedMember.lastVisit)}</span>
                </div>
              </div>

              {/* 快捷操作 */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button className="p-3 bg-green-500 text-white rounded-xl flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  充值
                </button>
                <button className="p-3 bg-orange-500 text-white rounded-xl flex items-center justify-center gap-2">
                  <Gift className="w-5 h-5" />
                  积分兑换
                </button>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200">
              <button 
                onClick={() => setSelectedMember(null)}
                className="w-full py-3 text-slate-500"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增会员弹窗 */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl">
            <div className="bg-orange-500 text-white px-4 py-3 flex items-center justify-between">
              <h2 className="font-bold text-lg">新增会员</h2>
              <button onClick={() => setShowAdd(false)}>✕</button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">姓名</label>
                <input type="text" placeholder="请输入姓名" className="w-full p-3 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">手机号</label>
                <input type="tel" placeholder="请输入手机号" className="w-full p-3 border border-slate-200 rounded-xl" />
              </div>
              <button className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600">
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
