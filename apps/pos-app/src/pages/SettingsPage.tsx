import { Link } from 'react-router-dom';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/pos/cashier" className="text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <h1 className="text-lg font-semibold">设置</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm divide-y">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="海邻到家" className="w-10 h-10" />
              <div><div className="font-medium">海邻到家</div><div className="text-sm text-gray-500">智慧门店 V6.0</div></div>
            </div>
            <span className="text-gray-400">›</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">🖨️</div>
              <div><div className="font-medium">打印机</div><div className="text-sm text-green-500">已连接</div></div>
            </div>
            <span className="text-gray-400">›</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">📷</div>
              <div><div className="font-medium">扫码枪</div><div className="text-sm text-green-500">USB模式</div></div>
            </div>
            <span className="text-gray-400">›</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">📶</div>
              <div><div className="font-medium">网络状态</div><div className="text-sm text-green-500">在线</div></div>
            </div>
            <span className="text-gray-400">›</span>
          </div>
        </div>

        <div className="mt-6">
          <Link to="/pos/login" className="block w-full py-3 bg-red-50 text-red-500 text-center rounded-xl font-medium">退出登录</Link>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>海邻到家 V2.0</p>
        </div>
      </main>
    </div>
  );
}
