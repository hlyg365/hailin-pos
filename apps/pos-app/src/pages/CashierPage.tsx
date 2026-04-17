import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const storeModules = [
  { id: 'cashier', label: '收银', icon: '💰' },
  { id: 'inventory', label: '库存', icon: '📦' },
  { id: 'orders', label: '订单', icon: '📋' },
  { id: 'settings', label: '设置', icon: '⚙️' },
];

export default function CashierPage() {
  const [activeModule, setActiveModule] = useState('cashier');
  const [testMessage, setTestMessage] = useState('组件已加载');

  useEffect(() => {
    console.log('[CashierPage] 组件挂载完成');
    console.log('[CashierPage] storeModules:', storeModules);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 顶部状态栏 */}
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-white hover:text-blue-200">
            ← 返回
          </Link>
          <h1 className="text-xl font-bold">收银台</h1>
        </div>
        <span className="text-sm">V6.0</span>
      </div>

      {/* 主体区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧侧边栏 - 固定80px宽度 */}
        <aside className="w-20 bg-gray-800 text-white flex flex-col">
          {/* Logo 区域 */}
          <div className="p-3 border-b border-gray-700">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-lg font-bold">
                HL
              </div>
              <p className="text-xs mt-2">门店</p>
            </div>
          </div>

          {/* 模块导航 */}
          <nav className="flex-1 py-3">
            {storeModules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => {
                  console.log('[CashierPage] 切换模块:', mod.id);
                  setActiveModule(mod.id);
                }}
                className={`w-full flex flex-col items-center py-3 px-1 transition-colors ${
                  activeModule === mod.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="text-2xl">{mod.icon}</span>
                <span className="text-xs mt-1">{mod.label}</span>
              </button>
            ))}
          </nav>

          {/* 底部版本 */}
          <div className="p-3 border-t border-gray-700 text-center">
            <p className="text-xs text-gray-500">V6.0</p>
          </div>
        </aside>

        {/* 右侧主内容 */}
        <main className="flex-1 bg-white p-6 overflow-auto">
          <h2 className="text-2xl font-bold mb-4">当前模块: {activeModule}</h2>
          <p className="text-gray-600 mb-4">{testMessage}</p>
          <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded">
            <p className="font-bold">✅ 收银台组件加载成功</p>
            <p className="text-sm mt-2">如果看到这条消息，说明侧边栏已正确渲染。</p>
            <p className="text-sm mt-1">左侧深灰色区域（80px宽）为侧边栏导航区。</p>
          </div>
          
          {/* 功能按钮测试 */}
          <div className="mt-6 space-y-2">
            <p className="font-medium">侧边栏模块：</p>
            {storeModules.map((mod) => (
              <div key={mod.id} className="flex items-center gap-2 text-sm">
                <span>{mod.icon}</span>
                <span>{mod.label}</span>
                <span className={activeModule === mod.id ? 'text-green-600' : 'text-gray-400'}>
                  {activeModule === mod.id ? '(当前)' : ''}
                </span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
