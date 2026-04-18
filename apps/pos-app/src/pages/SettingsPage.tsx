import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDeviceConfigStore, useStoreStore, useAiConfigStore } from '../store';
import { deviceManager, type ScaleConfig, type PrinterConfig } from '../services/posDevices';

export default function SettingsPage() {
  const currentStore = useStoreStore(state => state.currentStore);
  const storeSettings = useStoreStore(state => state.storeSettings);
  const updateStoreSettings = useStoreStore(state => state.updateStoreSettings);
  
  const deviceConfig = useDeviceConfigStore();
  const aiConfig = useAiConfigStore();
  
  // 设备状态
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, { connected: boolean; online: boolean; error?: string }>>({
    serialScale: { connected: false, online: false },
    networkScale: { connected: false, online: false },
    printer: { connected: false, online: false },
    customerDisplay: { connected: false, online: false },
  });
  
  // 秤实时读数
  const [scaleReading, setScaleReading] = useState<{ weight: number; unit: string; stable: boolean }>({
    weight: 0, unit: 'kg', stable: false
  });
  
  // 测试打印状态
  const [printing, setPrinting] = useState(false);
  const [printResult, setPrintResult] = useState<string>('');
  
  // 秤协议选项
  const scaleProtocols = [
    { value: 'general', label: '通用协议' },
    { value: 'dahua', label: '大华协议' },
    { value: 'toieda', label: '托利多协议' },
    { value: 'soki', label: '顶尖协议' },
  ];
  
  // 波特率选项
  const baudRates = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];
  
  // 刷新设备状态
  useEffect(() => {
    const updateStatus = () => {
      setDeviceStatuses(deviceManager.getAllStatus());
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 3000);
    return () => clearInterval(interval);
  }, []);
  
  // 秤数据监听
  useEffect(() => {
    deviceManager.onScaleReading((reading) => {
      setScaleReading({
        weight: reading.weight,
        unit: reading.unit,
        stable: reading.stable,
      });
    });
  }, []);
  
  // 连接串口秤
  const connectSerialScale = async () => {
    try {
      const config: ScaleConfig = {
        type: 'serial',
        baudRate: deviceConfig.scale.baudRate || 9600,
        protocol: deviceConfig.scale.protocol as ScaleConfig['protocol'] || 'general',
      };
      
      const success = await deviceManager.serialScale.requestAndConnect(config);
      
      if (success) {
        deviceConfig.updateConfig('scale', { enabled: true });
        setDeviceStatuses(deviceManager.getAllStatus());
      } else {
        alert('连接电子秤失败，请检查串口连接');
      }
    } catch (error: any) {
      alert('连接失败: ' + error.message);
    }
  };
  
  // 连接网络秤
  const connectNetworkScale = async () => {
    const config: ScaleConfig = {
      type: 'network',
      address: deviceConfig.scale.address,
      port: deviceConfig.scale.port || 8080,
      protocol: deviceConfig.scale.protocol as ScaleConfig['protocol'] || 'general',
    };
    
    const success = await deviceManager.connectScale(config);
    
    if (success) {
      deviceConfig.updateConfig('scale', { enabled: true });
      setDeviceStatuses(deviceManager.getAllStatus());
    } else {
      alert('连接网络秤失败，请检查IP地址');
    }
  };
  
  // 连接打印机
  const connectPrinter = async () => {
    const config: PrinterConfig = {
      type: 'network',
      address: deviceConfig.receiptPrinter.address,
      port: deviceConfig.receiptPrinter.port || 9100,
      width: deviceConfig.receiptPrinter.width || 58,
    };
    
    const success = await deviceManager.connectPrinter(config);
    
    if (success) {
      deviceConfig.updateConfig('receiptPrinter', { enabled: true });
      setDeviceStatuses(deviceManager.getAllStatus());
    } else {
      alert('连接打印机失败，请检查IP地址');
    }
  };
  
  // 打开客显屏
  const openCustomerDisplay = async () => {
    const success = await deviceManager.openCustomerDisplay();
    
    if (success) {
      deviceConfig.updateConfig('customerDisplay', { enabled: true });
      setDeviceStatuses(deviceManager.getAllStatus());
    } else {
      alert('打开客显屏失败，请允许浏览器弹窗');
    }
  };
  
  // 打开钱箱
  const testOpenCashDrawer = async () => {
    const success = await deviceManager.openCashDrawer();
    setPrintResult(success ? '钱箱已打开' : '钱箱打开失败');
    setTimeout(() => setPrintResult(''), 3000);
  };
  
  // 测试打印
  const testPrint = async () => {
    setPrinting(true);
    setPrintResult('正在打印...');
    
    try {
      await deviceManager.printReceipt({
        storeName: currentStore?.name || '海邻到家',
        orderNo: 'TEST' + Date.now().toString().slice(-8),
        datetime: new Date().toLocaleString('zh-CN'),
        items: [
          { name: '测试商品', qty: 1, price: 9.9, total: 9.9 },
          { name: '农夫山泉', qty: 2, price: 2.0, total: 4.0 },
        ],
        total: 13.9,
        paymentMethod: '测试',
        memberInfo: '会员享98折优惠',
      });
      setPrintResult('打印成功！');
    } catch (error) {
      setPrintResult('打印失败');
    }
    
    setPrinting(false);
    setTimeout(() => setPrintResult(''), 3000);
  };
  
  // 秤操作
  const handleScaleZero = () => deviceManager.scaleZero();
  const handleScaleTare = () => deviceManager.scaleTare();
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-blue-600 hover:text-blue-700">← 返回</Link>
            <h1 className="text-lg font-semibold">收银设备设置</h1>
          </div>
          <div className="text-sm text-gray-500">{currentStore?.name || '未选择门店'}</div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 设备概览 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">设备连接状态</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: '电子秤', icon: '⚖️', status: deviceStatuses.serialScale.connected || deviceStatuses.networkScale.connected },
              { name: '小票打印机', icon: '🖨️', status: deviceStatuses.printer.connected },
              { name: '客显屏', icon: '📺', status: deviceStatuses.customerDisplay.connected },
              { name: '钱箱', icon: '💰', status: deviceStatuses.printer.connected },
            ].map((device) => (
              <div key={device.name} className={`p-4 rounded-lg ${device.status ? 'bg-green-50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{device.icon}</span>
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className={`text-sm ${device.status ? 'text-green-600' : 'text-gray-400'}`}>
                      {device.status ? '已连接' : '未连接'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 电子秤设置 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-2xl">⚖️</span> 电子秤设置
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm ${deviceStatuses.serialScale.connected || deviceStatuses.networkScale.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {deviceStatuses.serialScale.connected || deviceStatuses.networkScale.connected ? '已连接' : '未连接'}
            </span>
          </div>
          
          <div className="space-y-4">
            {/* 连接方式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">连接方式</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={deviceConfig.scale.type === 'serial'}
                    onChange={() => deviceConfig.updateConfig('scale', { type: 'serial' })}
                    className="text-blue-600"
                  />
                  <span>串口 (USB/RS232)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={deviceConfig.scale.type === 'network'}
                    onChange={() => deviceConfig.updateConfig('scale', { type: 'network' })}
                    className="text-blue-600"
                  />
                  <span>网口 (TCP/IP)</span>
                </label>
              </div>
            </div>
            
            {/* 串口配置 */}
            {deviceConfig.scale.type === 'serial' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">通讯协议</label>
                  <select
                    value={deviceConfig.scale.protocol || 'general'}
                    onChange={(e) => deviceConfig.updateConfig('scale', { protocol: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {scaleProtocols.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">波特率</label>
                  <select
                    value={deviceConfig.scale.baudRate || 9600}
                    onChange={(e) => deviceConfig.updateConfig('scale', { baudRate: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {baudRates.map((rate) => (
                      <option key={rate} value={rate}>{rate} bps</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">请确保与电子秤本机设置一致（常用9600或115200）</p>
                </div>
                
                <button
                  onClick={connectSerialScale}
                  disabled={!('serial' in navigator)}
                  className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {'serial' in navigator ? '选择串口并连接' : '浏览器不支持串口'}
                </button>
                
                {!('serial' in navigator) && (
                  <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                    ⚠️ Web Serial API 需要Chrome/Edge等现代浏览器支持。请使用Chrome、Edge或Opera浏览器。
                  </div>
                )}
              </>
            )}
            
            {/* 网络秤配置 */}
            {deviceConfig.scale.type === 'network' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">IP地址</label>
                    <input
                      type="text"
                      placeholder="192.168.1.100"
                      value={deviceConfig.scale.address || ''}
                      onChange={(e) => deviceConfig.updateConfig('scale', { address: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">端口</label>
                    <input
                      type="number"
                      placeholder="8080"
                      value={deviceConfig.scale.port || 8080}
                      onChange={(e) => deviceConfig.updateConfig('scale', { port: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">通讯协议</label>
                  <select
                    value={deviceConfig.scale.protocol || 'general'}
                    onChange={(e) => deviceConfig.updateConfig('scale', { protocol: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {scaleProtocols.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={connectNetworkScale}
                  className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  连接网络秤
                </button>
              </>
            )}
            
            {/* 秤读数显示 */}
            {(deviceStatuses.serialScale.connected || deviceStatuses.networkScale.connected) && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium">实时重量</span>
                  <span className={`px-2 py-1 rounded text-sm ${scaleReading.stable ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {scaleReading.stable ? '稳定' : '不稳定'}
                  </span>
                </div>
                <div className="text-4xl font-bold text-center mb-4">
                  {scaleReading.weight.toFixed(3)} {scaleReading.unit}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleScaleZero} className="flex-1 py-2 bg-gray-200 rounded hover:bg-gray-300">归零</button>
                  <button onClick={handleScaleTare} className="flex-1 py-2 bg-gray-200 rounded hover:bg-gray-300">去皮</button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 小票打印机设置 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-2xl">🖨️</span> 小票打印机设置
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm ${deviceStatuses.printer.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {deviceStatuses.printer.connected ? '已连接' : '未连接'}
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IP地址</label>
                <input
                  type="text"
                  placeholder="192.168.1.200"
                  value={deviceConfig.receiptPrinter.address || ''}
                  onChange={(e) => deviceConfig.updateConfig('receiptPrinter', { address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">端口</label>
                <input
                  type="number"
                  placeholder="9100"
                  value={deviceConfig.receiptPrinter.port || 9100}
                  onChange={(e) => deviceConfig.updateConfig('receiptPrinter', { port: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">纸张宽度</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={deviceConfig.receiptPrinter.width === 58}
                    onChange={() => deviceConfig.updateConfig('receiptPrinter', { width: 58 })}
                    className="text-blue-600"
                  />
                  <span>58mm (小票)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={deviceConfig.receiptPrinter.width === 80}
                    onChange={() => deviceConfig.updateConfig('receiptPrinter', { width: 80 })}
                    className="text-blue-600"
                  />
                  <span>80mm (长票)</span>
                </label>
              </div>
            </div>
            
            <button
              onClick={connectPrinter}
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              连接打印机
            </button>
            
            {/* 测试按钮 */}
            {deviceStatuses.printer.connected && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={testPrint}
                  disabled={printing}
                  className="py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {printing ? '打印中...' : '测试打印'}
                </button>
                <button
                  onClick={testOpenCashDrawer}
                  className="py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  弹出钱箱
                </button>
              </div>
            )}
            
            {printResult && (
              <div className="p-3 bg-blue-50 rounded-lg text-center text-blue-700">{printResult}</div>
            )}
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">打印机连接说明</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 网络打印机：确保打印机与收银机在同一网络，填写打印机IP地址</li>
                <li>• 默认端口：9100（大多数网络打印机标准端口）</li>
                <li>• 钱箱：钱箱连接到打印机的钱箱口，打开钱箱即触发打印</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* 客显屏设置 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-2xl">📺</span> 客显屏设置
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm ${deviceStatuses.customerDisplay.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {deviceStatuses.customerDisplay.connected ? '已打开' : '未打开'}
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-4">
                客显屏会在新窗口中显示商品信息和金额，顾客可以看到购买详情。
              </p>
              <button
                onClick={openCustomerDisplay}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {deviceStatuses.customerDisplay.connected ? '重新打开客显屏' : '打开客显屏'}
              </button>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">分屏设置说明</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Windows: 系统设置 → 显示 → 选择"扩展这些显示器"</li>
                <li>• Mac: 系统设置 → 显示器 →  arrangement → 勾选"镜像内建显示器"</li>
                <li>• 客显屏会自动在新窗口中显示</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* 保存设置 */}
        <div className="flex gap-4">
          <button
            onClick={() => deviceConfig.setAutoConnect(true)}
            className={`flex-1 py-3 rounded-lg font-medium ${
              deviceConfig.autoConnect 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            自动连接设备
          </button>
          <Link
            to="/pos/cashier"
            className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium text-center hover:bg-green-600"
          >
            返回收银台测试
          </Link>
        </div>
      </main>
    </div>
  );
}
