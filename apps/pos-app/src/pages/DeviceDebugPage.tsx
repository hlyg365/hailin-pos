/**
 * 设备调试页面
 * 用于测试和诊断收银设备连接问题
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deviceManager, deviceEvents } from '../services/hardwareService';

export default function DeviceDebugPage() {
  // 连接日志
  const [logs, setLogs] = useState<Array<{time: string; type: 'info' | 'success' | 'error'; message: string}>>([]);
  
  // 设备状态
  const [status, setStatus] = useState({
    scaleConnected: false,
    printerConnected: false,
    labelPrinterConnected: false,
    scannerEnabled: true,
  });
  
  // 配置
  const [scaleIP, setScaleIP] = useState('192.168.1.100');
  const [scalePort, setScalePort] = useState(9101);
  const [printerIP, setPrinterIP] = useState('192.168.1.101');
  const [printerPort, setPrinterPort] = useState(9100);
  
  const [connecting, setConnecting] = useState(false);

  // 添加日志
  const addLog = (type: 'info' | 'success' | 'error', message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, type, message }]);
  };

  // 刷新状态
  const refreshStatus = async () => {
    try {
      const s = await deviceManager.getStatus();
      setStatus(s);
      addLog('info', `状态刷新: 秤=${s.scaleConnected}, 打印=${s.printerConnected}`);
    } catch (e: any) {
      addLog('error', `刷新状态失败: ${e.message}`);
    }
  };

  // 初始化
  useEffect(() => {
    addLog('info', '设备调试页面已加载');
    refreshStatus();
    
    // 监听设备事件
    deviceEvents.on('scaleData', (data) => {
      addLog('success', `秤数据: ${data.weight}${data.unit} ${data.stable ? '(稳定)' : '(不稳定)'}`);
    });
    
    deviceEvents.on('scan', (data) => {
      addLog('info', `扫码: ${data.barcode}`);
    });
    
    return () => {
      deviceEvents.off('scaleData', () => {});
      deviceEvents.off('scan', () => {});
    };
  }, []);

  // 测试连接电子秤
  const testScale = async () => {
    if (!scaleIP) {
      addLog('error', '请输入电子秤IP地址');
      return;
    }
    
    setConnecting(true);
    addLog('info', `正在连接电子秤 ${scaleIP}:${scalePort}...`);
    
    try {
      const connected = await deviceManager.scale.connect({
        port: scaleIP,
        baudRate: scalePort,
        protocol: 'general'
      });
      
      if (connected) {
        addLog('success', '电子秤连接成功！');
        deviceManager.scale.startContinuous(500);
      } else {
        addLog('error', '电子秤连接失败，请检查IP和端口');
      }
    } catch (e: any) {
      addLog('error', `连接异常: ${e.message}`);
    } finally {
      setConnecting(false);
      refreshStatus();
    }
  };

  // 测试连接打印机
  const testPrinter = async () => {
    if (!printerIP) {
      addLog('error', '请输入打印机IP地址');
      return;
    }
    
    setConnecting(true);
    addLog('info', `正在连接打印机 ${printerIP}:${printerPort}...`);
    
    try {
      const connected = await deviceManager.receiptPrinter.connect(printerIP, printerPort);
      
      if (connected) {
        addLog('success', '打印机连接成功！');
        
        // 打印测试页
        await deviceManager.receiptPrinter.init();
        await deviceManager.receiptPrinter.printText('=== 设备调试测试 ===', { bold: true, align: 'center' });
        await deviceManager.receiptPrinter.newLine(1);
        await deviceManager.receiptPrinter.printText(`测试时间: ${new Date().toLocaleString()}`, { align: 'center' });
        await deviceManager.receiptPrinter.newLine(2);
        await deviceManager.receiptPrinter.printDivider('=', 32);
        await deviceManager.receiptPrinter.newLine(1);
        await deviceManager.receiptPrinter.printText('如看到此信息，说明打印机连接正常', { align: 'center' });
        await deviceManager.receiptPrinter.newLine(3);
        await deviceManager.receiptPrinter.cut();
        
        addLog('success', '测试小票已打印');
      } else {
        addLog('error', '打印机连接失败，请检查IP和端口');
      }
    } catch (e: any) {
      addLog('error', `连接异常: ${e.message}`);
    } finally {
      setConnecting(false);
      refreshStatus();
    }
  };

  // 测试钱箱
  const testCashDrawer = async () => {
    addLog('info', '正在打开钱箱...');
    try {
      const opened = await deviceManager.openCashDrawer();
      if (opened) {
        addLog('success', '钱箱已打开！');
      } else {
        addLog('error', '钱箱打开失败，请先连接打印机');
      }
    } catch (e: any) {
      addLog('error', `钱箱异常: ${e.message}`);
    }
  };

  // 测试客显屏
  const testDisplay = async () => {
    addLog('info', '测试客显屏...');
    try {
      await deviceManager.customerDisplay.showWelcome();
      addLog('success', '客显屏显示: 欢迎光临');
      await new Promise(r => setTimeout(r, 1000));
      await deviceManager.customerDisplay.showAmount(99.99, '测试金额');
      addLog('success', '客显屏显示: ¥99.99');
    } catch (e: any) {
      addLog('error', `客显屏异常: ${e.message}`);
    }
  };

  // 蜂鸣测试
  const testBeep = async () => {
    addLog('info', '打印机蜂鸣...');
    try {
      await deviceManager.receiptPrinter.beep(3);
      addLog('success', '蜂鸣完成');
    } catch (e: any) {
      addLog('error', `蜂鸣失败: ${e.message}`);
    }
  };

  // 清除日志
  const clearLogs = () => setLogs([]);

  // 断开所有设备
  const disconnectAll = async () => {
    addLog('info', '断开所有设备...');
    try {
      await deviceManager.disconnectAll();
      addLog('success', '已断开所有设备');
      refreshStatus();
    } catch (e: any) {
      addLog('error', `断开失败: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/pos/cashier" className="text-white">← 返回收银台</Link>
          <span className="text-xl font-bold">设备调试</span>
        </div>
        <button onClick={refreshStatus} className="px-3 py-1 bg-blue-500 rounded">
          刷新状态
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* 状态概览 */}
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="font-bold mb-3">设备状态</h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className={`p-2 rounded ${status.scaleConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
              <div className="text-2xl">⚖️</div>
              <div className="text-xs">电子秤</div>
              <div className={`text-xs font-bold ${status.scaleConnected ? 'text-green-600' : 'text-gray-400'}`}>
                {status.scaleConnected ? '已连接' : '未连接'}
              </div>
            </div>
            <div className={`p-2 rounded ${status.printerConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
              <div className="text-2xl">🖨️</div>
              <div className="text-xs">打印机</div>
              <div className={`text-xs font-bold ${status.printerConnected ? 'text-green-600' : 'text-gray-400'}`}>
                {status.printerConnected ? '已连接' : '未连接'}
              </div>
            </div>
            <div className={`p-2 rounded ${status.labelPrinterConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
              <div className="text-2xl">🏷️</div>
              <div className="text-xs">标签机</div>
              <div className={`text-xs font-bold ${status.labelPrinterConnected ? 'text-green-600' : 'text-gray-400'}`}>
                {status.labelPrinterConnected ? '已连接' : '未连接'}
              </div>
            </div>
            <div className={`p-2 rounded ${status.scannerEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
              <div className="text-2xl">📷</div>
              <div className="text-xs">扫码枪</div>
              <div className={`text-xs font-bold ${status.scannerEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                {status.scannerEnabled ? '启用' : '禁用'}
              </div>
            </div>
          </div>
        </div>

        {/* 电子秤配置 */}
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="font-bold mb-3">⚖️ 电子秤</h3>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <input
              type="text"
              value={scaleIP}
              onChange={(e) => setScaleIP(e.target.value)}
              placeholder="IP地址"
              className="px-3 py-2 border rounded"
            />
            <input
              type="number"
              value={scalePort}
              onChange={(e) => setScalePort(parseInt(e.target.value) || 9101)}
              placeholder="端口"
              className="px-3 py-2 border rounded"
            />
            <button
              onClick={testScale}
              disabled={connecting}
              className="bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {connecting ? '连接中...' : '连接'}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            常见端口: 9101 (网络秤), 8100, 8080
          </p>
        </div>

        {/* 打印机配置 */}
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="font-bold mb-3">🖨️ 小票打印机</h3>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <input
              type="text"
              value={printerIP}
              onChange={(e) => setPrinterIP(e.target.value)}
              placeholder="IP地址"
              className="px-3 py-2 border rounded"
            />
            <input
              type="number"
              value={printerPort}
              onChange={(e) => setPrinterPort(parseInt(e.target.value) || 9100)}
              placeholder="端口"
              className="px-3 py-2 border rounded"
            />
            <button
              onClick={testPrinter}
              disabled={connecting}
              className="bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {connecting ? '连接中...' : '连接并测试'}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            常见端口: 9100 (ESC/POS), 9101, 8100
          </p>
        </div>

        {/* 其他测试 */}
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="font-bold mb-3">其他测试</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={testCashDrawer}
              className="bg-green-500 text-white py-2 rounded hover:bg-green-600"
            >
              💰 打开钱箱
            </button>
            <button
              onClick={testDisplay}
              className="bg-purple-500 text-white py-2 rounded hover:bg-purple-600"
            >
              📺 测试客显屏
            </button>
            <button
              onClick={testBeep}
              className="bg-orange-500 text-white py-2 rounded hover:bg-orange-600"
            >
              🔔 蜂鸣测试
            </button>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={disconnectAll}
              className="bg-red-500 text-white py-2 rounded hover:bg-red-600"
            >
              断开所有设备
            </button>
            <button
              onClick={clearLogs}
              className="bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            >
              清除日志
            </button>
          </div>
        </div>

        {/* 连接日志 */}
        <div className="bg-white rounded-lg p-4 shadow">
          <h3 className="font-bold mb-3">📋 连接日志</h3>
          <div className="bg-black text-green-400 p-3 rounded text-xs font-mono h-48 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">暂无日志...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={`${
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'success' ? 'text-green-400' : 'text-gray-400'
                }`}>
                  [{log.time}] {log.message}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 常见问题 */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <h3 className="font-bold text-yellow-800 mb-2">⚠️ 常见问题</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 确保设备与收银机在同一网络</li>
            <li>• 检查设备电源和网络指示灯</li>
            <li>• 确认设备的IP地址（通常在设备上打印）</li>
            <li>• 网络秤默认端口通常是 9101</li>
            <li>• 打印机默认端口通常是 9100</li>
            <li>• 钱箱需要通过打印机接口控制</li>
            <li>• 客显屏需要设备支持双屏显示</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
