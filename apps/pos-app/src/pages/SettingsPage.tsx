import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosAuth, useStoreInfo } from '@hailin/core';
import { useHardware, useScanner, usePrinter, useScale } from '@hailin/hardware';
import { ArrowLeft, Wifi, WifiOff, Printer, Scan, Scale, Bluetooth, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { operator, store } = usePosAuth();
  const { 
    printerConnected, scannerConnected, scaleConnected, 
    initialize, loading: hwLoading, error: hwError 
  } = useHardware();
  const { status: printerStatus } = usePrinter();
  const { status: scannerStatus } = useScanner();
  const { status: scaleStatus } = useScale();

  const [testingPrinter, setTestingPrinter] = useState(false);

  const handleReconnect = async () => {
    await initialize();
  };

  const testPrint = async () => {
    setTestingPrinter(true);
    try {
      // 模拟打印测试
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('打印测试成功！');
    } catch (error) {
      alert('打印测试失败');
    } finally {
      setTestingPrinter(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部栏 */}
      <div className="bg-white px-4 py-4 flex items-center gap-4 border-b">
        <button onClick={() => navigate('/cashier')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">系统设置</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* 店铺信息 */}
        <div className="bg-white rounded-xl p-4">
          <h2 className="font-semibold mb-3">店铺信息</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">店铺名称</span>
              <span>{store?.name || '海邻到家'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">店铺编号</span>
              <span>{store?.id || 'STORE001'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">操作员</span>
              <span>{operator?.name || 'Admin'}</span>
            </div>
          </div>
        </div>

        {/* 硬件状态 */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">硬件设备</h2>
            <button
              onClick={handleReconnect}
              disabled={hwLoading}
              className="flex items-center gap-1 text-blue-600 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${hwLoading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
          
          {hwError && (
            <div className="mb-3 p-2 bg-red-50 text-red-600 rounded-lg text-sm">
              {hwError}
            </div>
          )}

          <div className="space-y-3">
            {/* 打印机 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Printer className={`w-5 h-5 ${printerConnected ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <div className="font-medium">小票打印机</div>
                  <div className="text-xs text-gray-500">
                    {printerStatus === 'connected' ? '已连接' : 
                     printerStatus === 'connecting' ? '连接中...' : '未连接'}
                  </div>
                </div>
              </div>
              <button
                onClick={testPrint}
                disabled={!printerConnected || testingPrinter}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg disabled:opacity-50"
              >
                {testingPrinter ? '测试中...' : '测试'}
              </button>
            </div>

            {/* 扫码枪 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Scan className={`w-5 h-5 ${scannerConnected ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <div className="font-medium">扫码枪</div>
                  <div className="text-xs text-gray-500">
                    {scannerStatus === 'listening' ? '就绪' :
                     scannerStatus === 'scanning' ? '扫描中...' : '未连接'}
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${
                scannerConnected ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {scannerConnected ? '已连接' : '未连接'}
              </div>
            </div>

            {/* 电子秤 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Scale className={`w-5 h-5 ${scaleConnected ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <div className="font-medium">电子秤</div>
                  <div className="text-xs text-gray-500">
                    {scaleStatus === 'connected' ? '已连接' :
                     scaleStatus === 'weighing' ? '称量中...' :
                     scaleStatus === 'stable' ? '已稳定' : '未连接'}
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${
                scaleConnected ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {scaleConnected ? '已连接' : '未连接'}
              </div>
            </div>
          </div>
        </div>

        {/* 网络状态 */}
        <div className="bg-white rounded-xl p-4">
          <h2 className="font-semibold mb-3">网络状态</h2>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {navigator.onLine ? (
              <>
                <Wifi className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-600">在线</div>
                  <div className="text-xs text-gray-500">所有数据将实时同步</div>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-medium text-amber-600">离线模式</div>
                  <div className="text-xs text-gray-500">订单将在恢复网络后同步</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 版本信息 */}
        <div className="bg-white rounded-xl p-4">
          <h2 className="font-semibold mb-3">关于</h2>
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex justify-between">
              <span>应用版本</span>
              <span>v3.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>构建日期</span>
              <span>2024-01-15</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
