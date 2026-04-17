import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function AuthPage() {
  const [editingRole, setEditingRole] = useState<string | null>(null);

  // 角色定义
  const roles = [
    {
      id: 'admin',
      name: '超级管理员',
      description: '全集团最高权限',
      color: 'red',
      permissions: ['all'],
      users: ['admin@hailin.com'],
    },
    {
      id: 'supervisor',
      name: '区域督导',
      description: '管辖区域内门店',
      color: 'purple',
      permissions: ['store_view', 'store_inspect', 'price_approve', 'finance_view', 'member_view', 'report_view'],
      users: ['zhangsup@hailin.com', 'lisup@hailin.com'],
    },
    {
      id: 'manager',
      name: '门店店长',
      description: '本店所有权限',
      color: 'blue',
      permissions: ['store_view', 'cashier', 'inventory_view', 'inventory_restock', 'member_view', 'deposit', 'report_store'],
      users: ['zhangsan@wj.com', 'lisi@gj.com', 'wangwu@zgc.com'],
    },
    {
      id: 'cashier',
      name: '收银员',
      description: '仅前台收银',
      color: 'green',
      permissions: ['cashier', 'member_scan'],
      users: ['cashier001@wj.com', 'cashier002@wj.com'],
    },
  ];

  // 权限清单
  const permissionList = [
    { id: 'store_view', name: '查看门店数据', category: '门店' },
    { id: 'store_edit', name: '编辑门店信息', category: '门店' },
    { id: 'store_inspect', name: '发起巡店任务', category: '门店' },
    { id: 'cashier', name: '收银操作', category: '收银' },
    { id: 'inventory_view', name: '查看库存', category: '库存' },
    { id: 'inventory_edit', name: '编辑库存', category: '库存' },
    { id: 'inventory_restock', name: '要货申请', category: '库存' },
    { id: 'inventory_check', name: '盘点管理', category: '库存' },
    { id: 'finance_view', name: '查看财务报表', category: '财务' },
    { id: 'finance_audit', name: '财务审核', category: '财务' },
    { id: 'member_view', name: '查看会员', category: '会员' },
    { id: 'member_edit', name: '编辑会员', category: '会员' },
    { id: 'promo_view', name: '查看促销', category: '促销' },
    { id: 'promo_edit', name: '编辑促销', category: '促销' },
    { id: 'price_approve', name: '审批价格', category: '价格' },
    { id: 'report_view', name: '查看报表', category: '报表' },
    { id: 'report_export', name: '导出报表', category: '报表' },
    { id: 'user_view', name: '查看用户', category: '用户' },
    { id: 'user_edit', name: '编辑用户', category: '用户' },
    { id: 'config', name: '系统配置', category: '系统' },
  ];

  const categories = [...new Set(permissionList.map(p => p.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <img src="/logo.png" alt="海邻到家" className="h-10 w-auto" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} />
              <h1 className="text-xl font-bold text-gray-800">权限管理</h1>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加角色
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 角色列表 */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-semibold text-lg">角色列表</h3>
            {roles.map(role => (
              <div
                key={role.id}
                className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer transition-all ${
                  editingRole === role.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                }`}
                onClick={() => setEditingRole(role.id)}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    role.color === 'red' ? 'bg-red-100 text-red-600' :
                    role.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                    role.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {role.id === 'admin' ? '👑' :
                     role.id === 'supervisor' ? '👔' :
                     role.id === 'manager' ? '🏪' : '💁'}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-semibold">{role.name}</h4>
                    <p className="text-sm text-gray-500">{role.description}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-700">{role.users.length}</span> 个用户
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 权限配置 */}
          <div className="lg:col-span-2">
            {editingRole ? (
              <div className="bg-white rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {roles.find(r => r.id === editingRole)?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      配置角色权限
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 border rounded-lg text-sm">
                      取消
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                      保存
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* 快速操作 */}
                  <div className="mb-6 flex items-center gap-4">
                    <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm">
                      全选
                    </button>
                    <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                      全不选
                    </button>
                    {editingRole === 'admin' && (
                      <span className="text-sm text-red-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        管理员拥有所有权限
                      </span>
                    )}
                  </div>

                  {/* 权限分类 */}
                  {categories.map(cat => (
                    <div key={cat} className="mb-6">
                      <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {cat}
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {permissionList
                          .filter(p => p.category === cat)
                          .map(perm => (
                            <label
                              key={perm.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                roles.find(r => r.id === editingRole)?.permissions.includes(perm.id)
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="w-5 h-5 rounded"
                                defaultChecked={
                                  roles.find(r => r.id === editingRole)?.permissions.includes(perm.id)
                                }
                                disabled={editingRole === 'admin'}
                              />
                              <span className="text-sm">{perm.name}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.482-.475-3.655z" />
                  </svg>
                  <p>选择左侧角色进行编辑</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 用户列表 */}
        <div className="mt-8 bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-lg">用户列表</h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
              添加用户
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-sm text-gray-500">
                  <th className="px-6 py-3">用户名</th>
                  <th className="px-6 py-3">姓名</th>
                  <th className="px-6 py-3">角色</th>
                  <th className="px-6 py-3">所属门店</th>
                  <th className="px-6 py-3">状态</th>
                  <th className="px-6 py-3">最后登录</th>
                  <th className="px-6 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { name: 'admin', realName: '系统管理员', role: '超级管理员', store: '总部', status: 'active', lastLogin: '2024-01-17 10:30' },
                  { name: 'zhangsup', realName: '张督导', role: '区域督导', store: '北京朝阳', status: 'active', lastLogin: '2024-01-17 09:15' },
                  
                  { name: 'lisi', realName: '李四', role: '门店店长', store: '国贸店', status: 'active', lastLogin: '2024-01-16 22:30' },
                  
                  
                ].map((user, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono">{user.name}</td>
                    <td className="px-6 py-4">{user.realName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.role === '超级管理员' ? 'bg-red-100 text-red-600' :
                        user.role === '区域督导' ? 'bg-purple-100 text-purple-600' :
                        user.role === '门店店长' ? 'bg-blue-100 text-blue-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{user.store}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.status === 'active' ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{user.lastLogin}</td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:underline text-sm mr-2">编辑</button>
                      <button className="text-red-600 hover:underline text-sm">禁用</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 操作日志 */}
        <div className="mt-6 bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold text-lg">操作日志</h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              
              { time: '2024-01-17 09:15', user: 'admin', action: '添加了新角色：区域督导', type: 'config' },
              { time: '2024-01-17 08:45', user: 'zhangsan', action: '登录系统', type: 'login' },
              { time: '2024-01-16 18:00', user: 'admin', action: '删除了测试账号', type: 'security' },
            ].map((log, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg text-sm">
                <span className="text-gray-400 w-32">{log.time}</span>
                <span className="font-mono w-20">{log.user}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  log.type === 'security' ? 'bg-red-100 text-red-600' :
                  log.type === 'config' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {log.type === 'security' ? '安全' : log.type === 'config' ? '配置' : '登录'}
                </span>
                <span className="text-gray-600">{log.action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
