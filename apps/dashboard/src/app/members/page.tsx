'use client';

import { useState } from 'react';

const members = [
  { id: '1', name: '张伟', phone: '138****1234', level: '钻石会员', points: 12580, totalSpent: 25800, lastVisit: '2024-01-15', status: '正常' },
  { id: '2', name: '李娜', phone: '139****5678', level: '金卡会员', points: 8560, totalSpent: 15600, lastVisit: '2024-01-14', status: '正常' },
  { id: '3', name: '王芳', phone: '137****9012', level: '银卡会员', points: 3200, totalSpent: 5800, lastVisit: '2024-01-15', status: '正常' },
  { id: '4', name: '刘强', phone: '136****3456', level: '普通会员', points: 1200, totalSpent: 1200, lastVisit: '2024-01-13', status: '正常' },
  { id: '5', name: '陈静', phone: '135****7890', level: '钻石会员', points: 15680, totalSpent: 35600, lastVisit: '2024-01-15', status: '正常' },
  { id: '6', name: '赵磊', phone: '134****2345', level: '金卡会员', points: 7200, totalSpent: 12800, lastVisit: '2024-01-12', status: '冻结' },
  { id: '7', name: '周梅', phone: '133****6789', level: '银卡会员', points: 2800, totalSpent: 4200, lastVisit: '2024-01-11', status: '正常' },
  { id: '8', name: '吴涛', phone: '132****0123', level: '普通会员', points: 800, totalSpent: 800, lastVisit: '2024-01-10', status: '正常' },
];

const levelMap = {
  '钻石会员': { bg: 'bg-purple-100', text: 'text-purple-700', icon: '💎' },
  '金卡会员': { bg: 'bg-amber-100', text: 'text-amber-700', icon: '🥇' },
  '银卡会员': { bg: 'bg-gray-100', text: 'text-gray-700', icon: '🥈' },
  '普通会员': { bg: 'bg-blue-100', text: 'text-blue-700', icon: '👤' },
};

export default function MembersPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState('全部');

  const filteredMembers = members.filter(member => {
    const matchSearch = member.name.includes(searchKeyword) || member.phone.includes(searchKeyword);
    const matchLevel = levelFilter === '全部' || member.level === levelFilter;
    return matchSearch && matchLevel;
  });

  const totalMembers = members.length;
  const totalPoints = members.reduce((sum, m) => sum + m.points, 0);

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-6">
        <div className="stat-card">
          <p className="text-sm text-gray-500">会员总数</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{totalMembers.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">本月新增</p>
          <p className="text-3xl font-bold text-green-600 mt-1">+156</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">积分总量</p>
          <p className="text-3xl font-bold text-primary mt-1">{totalPoints.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">活跃会员</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">89%</p>
        </div>
      </div>

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">会员管理</h1>
        <button className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新增会员
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-xl p-4 flex items-center gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索姓名或手机号..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['全部', '钻石会员', '金卡会员', '银卡会员', '普通会员'].map((level) => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`px-4 py-2 rounded-lg text-sm ${
                levelFilter === level ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* 会员列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>会员信息</th>
              <th>会员等级</th>
              <th>积分</th>
              <th>累计消费</th>
              <th>最近消费</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-medium">{member.name.slice(0, 1)}</span>
                    </div>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.phone}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${levelMap[member.level as keyof typeof levelMap].bg} ${levelMap[member.level as keyof typeof levelMap].text}`}>
                    {levelMap[member.level as keyof typeof levelMap].icon}
                    {member.level}
                  </span>
                </td>
                <td className="font-medium text-amber-600">{member.points.toLocaleString()}</td>
                <td className="text-gray-600">¥{member.totalSpent.toLocaleString()}</td>
                <td className="text-gray-500">{member.lastVisit}</td>
                <td>
                  <span className={`px-2 py-1 text-xs rounded-full ${member.status === '正常' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {member.status}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button className="text-sm text-primary hover:underline">详情</button>
                    <button className="text-sm text-gray-500 hover:underline">积分</button>
                    <button className="text-sm text-gray-500 hover:underline">消费记录</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">显示 1-{filteredMembers.length} 条，共 {filteredMembers.length} 条</p>
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>上一页</button>
          <button className="px-3 py-1 bg-primary text-white rounded-lg">1</button>
          <button className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>下一页</button>
        </div>
      </div>
    </div>
  );
}
