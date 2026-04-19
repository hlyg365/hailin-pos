/**
 * 收银台设备设置面板组件
 * 用于配置和管理电子秤、小票打印机、标签打印机、钱箱、客显屏
 */
import { useState, useEffect } from 'react';
import { deviceManager, deviceEvents, type DeviceStatus } from '../services/hardwareService';

interface DeviceFormData {
  address: string;
  port: number;
}

export function DeviceSetupPanel() {
  // 设备状态
  const [status, setStatus] = useState<DeviceStatus>({
    scaleConnected: false,
    printerConnected: false,
    labelPrinterConnected: false,
    scannerEnabled: true,
  });
  
  // 连接中状态
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 设备配置表单
  const [scaleConfig, setScaleConfig] = useState<DeviceFormData>({ address: '192.168.1.100', port: 9101 });
  const [printerConfig, setPrinterConfig] = useState<DeviceFormData>({ address: '192.168.1.101', port: 9100 });
  const [labelConfig, setLabelConfig] = useState<DeviceFormData>({ address: '192.168.1.102', port: 9100 });
  
  // 设备启用状态
  const [scaleEnabled, setScaleEnabled] = useState(false);
  const [printerEnabled, setPrinterEnabled] = useState(false);
  const [labelEnabled, setLabelEnabled] = useState(false);

  // 刷新设备状态
  const refreshStatus = async () => {
    try {
      const s = await deviceManager.getStatus();
      setStatus(s);
    } catch (e) {
      console.error('获取设备状态失败:', e);
    }
  };

  // 初始化
  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // 测试连接电子秤
  const testScaleConnection = async () => {
    setConnecting(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('[设备设置] 尝试连接电子秤:', scaleConfig);
      
      const connected = await deviceManager.scale.connect({
        port: scaleConfig.address,
        baudRate: scaleConfig.port,
        protocol: 'general'
      });
      
      if (connected) {
        setSuccess('电子秤连接成功！');
        setScaleEnabled(true);
      } else {
        setError('电子秤连接失败，请检查IP地址和端口');
      }
    } catch (e: any) {
      console.error('[设备设置] 电子秤连接异常:', e);
      setError(`电子秤连接失败: ${e.message || '请检查网络连接'}`);
    } finally {
      setConnecting(false);
      refreshStatus();
    }
  };

  // 测试连接小票打印机
  const testPrinterConnection = async () => {
    setConnecting(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('[设备设置] 尝试连接打印机:', printerConfig);
      
      const connected = await deviceManager.receiptPrinter.connect(
        printerConfig.address,
        printerConfig.port
      );
      
      if (connected) {
        setSuccess('小票打印机连接成功！');
        setPrinterEnabled(true);
        
        // 测试打印
        await deviceManager.receiptPrinter.beep(2);
        await deviceManager.receiptPrinter.printText('=== 打印机测试成功 ===', { bold: true, align: 'center' });
        await deviceManager.receiptPrinter.newLine(2);
      } else {
        setError('打印机连接失败，请检查IP地址和端口');
      }
    } catch (e: any) {
      console.error('[设备设置] 打印机连接异常:', e);
      setError(`打印机连接失败: ${e.message || '请检查网络连接'}`);
    } finally {
      setConnecting(false);
      refreshStatus();
    }
  };

  // 测试打开钱箱
  const testCashDrawer = async () => {
    setError(null);
    try {
      const opened = await deviceManager.openCashDrawer();
      if (opened) {
        setSuccess('钱箱已打开！');
      } else {
        setError('钱箱打开失败，请确保打印机已连接');
      }
    } catch (e: any) {
      setError(`钱箱控制失败: ${e.message}`);
    }
  };

  // 测试客显屏
  const testCustomerDisplay = async () => {
    setError(null);
    try {
      await deviceManager.customerDisplay.showAmount(99.99, '测试金额');
      setSuccess('客显屏显示测试成功！');
      setTimeout(() => {
        deviceManager.customerDisplay.showWelcome();
      }, 3000);
    } catch (e: any) {
      setError(`客显屏测试失败: ${e.message}`);
    }
  };

  // 连接所有设备
  const connectAllDevices = async () => {
    setConnecting(true);
    setError(null);
    setSuccess(null);
    
    const results: string[] = [];
    
    try {
      // 连接电子秤
      if (scaleEnabled && scaleConfig.address) {
        const scaleOk = await deviceManager.scale.connect({
          port: scaleConfig.address,
          baudRate: scaleConfig.port,
          protocol: 'general'
        });
        results.push(`电子秤: ${scaleOk ? '✓' : '✗'}`);
      }
      
      // 连接打印机
      if (printerEnabled && printerConfig.address) {
        const printerOk = await deviceManager.receiptPrinter.connect(
          printerConfig.address,
          printerConfig.port
        );
        results.push(`打印机: ${printerOk ? '✓' : '✗'}`);
      }
      
      setSuccess(`连接完成: ${results.join(', ')}`);
    } catch (e: any) {
      setError(`连接失败: ${e.message}`);
    } finally {
      setConnecting(false);
      refreshStatus();
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">收银设备设置</h2>
      
      {/* 状态概览 */}
      <div className="grid grid-cols-4 gap-2">
        <StatusCard name="电子秤" icon="⚖️" connected={status.scaleConnected} />
        <StatusCard name="打印机" icon="🖨️" connected={status.printerConnected} />
        <StatusCard name="标签机" icon="🏷️" connected={status.labelPrinterConnected} />
        <StatusCard name="扫码枪" icon="📷" connected={status.scannerEnabled} />
      </div>
      
      {/* 提示消息 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">错误</p>
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p className="font-bold">成功</p>
          <p>{success}</p>
        </div>
      )}
      
      {/* 电子秤配置 */}
      <DeviceCard 
        title="电子秤" 
        icon="⚖️" 
        enabled={scaleEnabled}
        connected={status.scaleConnected}
        onToggle={() => setScaleEnabled(!scaleEnabled)}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">IP地址</label>
            <input
              type="text"
              value={scaleConfig.address}
              onChange={(e) => setScaleConfig({...scaleConfig, address: e.target.value})}
              placeholder="192.168.1.100"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">端口</label>
            <input
              type="number"
              value={scaleConfig.port}
              onChange={(e) => setScaleConfig({...scaleConfig, port: parseInt(e.target.value)})}
              placeholder="9101"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={testScaleConnection}
            disabled={connecting || !scaleConfig.address}
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {connecting ? '连接中...' : '测试连接'}
          </button>
        </div>
      </DeviceCard>
      
      {/* 小票打印机配置 */}
      <DeviceCard 
        title="小票打印机" 
        icon="🖨️" 
        enabled={printerEnabled}
        connected={status.printerConnected}
        onToggle={() => setPrinterEnabled(!printerEnabled)}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">IP地址</label>
            <input
              type="text"
              value={printerConfig.address}
              onChange={(e) => setPrinterConfig({...printerConfig, address: e.target.value})}
              placeholder="192.168.1.101"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">端口</label>
            <input
              type="number"
              value={printerConfig.port}
              onChange={(e) => setPrinterConfig({...printerConfig, port: parseInt(e.target.value)})}
              placeholder="9100"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={testPrinterConnection}
            disabled={connecting || !printerConfig.address}
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {connecting ? '连接中...' : '测试连接'}
          </button>
        </div>
      </DeviceCard>
      
      {/* 钱箱测试 */}
      <DeviceCard title="钱箱" icon="💰" enabled={true} connected={status.printerConnected}>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">钱箱通过打印机接口控制，需先连接打印机</p>
          <button
            onClick={testCashDrawer}
            disabled={!status.printerConnected}
            className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            打开钱箱
          </button>
        </div>
      </DeviceCard>
      
      {/* 客显屏测试 */}
      <DeviceCard title="客显屏" icon="📺" enabled={true} connected={true}>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">客显屏使用Android多屏功能</p>
          <button
            onClick={testCustomerDisplay}
            className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            测试显示
          </button>
        </div>
      </DeviceCard>
      
      {/* 一键连接 */}
      <button
        onClick={connectAllDevices}
        disabled={connecting}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-bold"
      >
        {connecting ? '连接中...' : '连接所有已启用设备'}
      </button>
      
      {/* 刷新状态按钮 */}
      <button
        onClick={refreshStatus}
        className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        刷新设备状态
      </button>
    </div>
  );
}

// 状态卡片组件
function StatusCard({ name, icon, connected }: { name: string; icon: string; connected: boolean }) {
  return (
    <div className={`p-3 rounded-lg text-center ${connected ? 'bg-green-100' : 'bg-gray-100'}`}>
      <div className="text-2xl">{icon}</div>
      <div className="text-xs mt-1">{name}</div>
      <div className={`text-xs font-bold ${connected ? 'text-green-600' : 'text-gray-400'}`}>
        {connected ? '已连接' : '未连接'}
      </div>
    </div>
  );
}

// 设备卡片组件
function DeviceCard({ 
  title, 
  icon, 
  enabled, 
  connected, 
  onToggle, 
  children 
}: { 
  title: string; 
  icon: string; 
  enabled: boolean; 
  connected: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`border rounded-lg p-4 ${connected ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="font-bold">{title}</span>
          <span className={`px-2 py-0.5 text-xs rounded ${connected ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
            {connected ? '已连接' : '未连接'}
          </span>
        </div>
        {onToggle && (
          <button
            onClick={onToggle}
            className={`w-12 h-6 rounded-full transition ${enabled ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export default DeviceSetupPanel;
