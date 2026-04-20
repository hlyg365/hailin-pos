import { useState, useEffect, useRef } from 'react';
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
  
  // 连接日志
  const [logs, setLogs] = useState<Array<{ time: string; type: 'info' | 'success' | 'error' | 'warn'; message: string }>>([]);
  const logRef = useRef<HTMLDivElement>(null);
  
  // 连接中状态
  const [connecting, setConnecting] = useState<string | null>(null);
  
  // 秤协议选项
  const scaleProtocols = [
    { value: 'soki', label: '顶尖协议 (OS2系列)' },
    { value: 'toieda', label: '托利多协议' },
    { value: 'dahua', label: '大华协议' },
    { value: 'general', label: '通用协议' },
  ];
  
  // 波特率选项
  const baudRates = [1200, 2400, 4800, 9600, 19200, 38400];
  
  // 添加日志
  const addLog = (type: 'info' | 'success' | 'error' | 'warn', message: string) => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setLogs(prev => [...prev.slice(-49), { time, type, message }]);
    setTimeout(() => {
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    }, 100);
  };
  
  // 刷新设备状态
  useEffect(() => {
    const updateStatus = () => {
      const status = deviceManager.getAllStatus();
      setDeviceStatuses(status);
      
      // 更新秤读数
      const scaleStatus = status.networkScale || status.serialScale;
      if (scaleStatus?.connected) {
        const currentWeight = deviceManager.scale?.currentWeight;
        if (currentWeight) {
          setScaleReading({
            weight: currentWeight.weight,
            unit: currentWeight.unit,
            stable: currentWeight.stable,
          });
        }
      }
    };
    
    updateStatus();
    addLog('info', '页面初始化，开始监控设备状态');
    
    const interval = setInterval(updateStatus, 1000);
    return () => {
      clearInterval(interval);
      addLog('info', '页面关闭，停止监控');
    };
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
  
  // 连接电子秤
  const connectScale = async () => {
    setConnecting('scale');
    addLog('info', `开始连接电子秤... 配置: ${deviceConfig.scale.type === 'network' ? '网口' : '串口'}`);
    
    try {
      let success = false;
      
      if (deviceConfig.scale.type === 'network') {
        // 网络秤
        if (!deviceConfig.scale.address) {
          addLog('error', 'IP地址不能为空');
          setConnecting(null);
          return;
        }
        
        addLog('info', `连接 ${deviceConfig.scale.address}:${deviceConfig.scale.port || 8080}`);
        
        const config: ScaleConfig = {
          type: 'network',
          address: deviceConfig.scale.address,
          port: deviceConfig.scale.port || 8080,
          protocol: deviceConfig.scale.protocol as ScaleConfig['protocol'] || 'soki',
        };
        
        success = await deviceManager.connectScale(config);
        
        if (success) {
          deviceConfig.updateConfig('scale', { enabled: true });
          addLog('success', '网络秤连接成功！');
        } else {
          addLog('error', '网络秤连接失败，请检查IP地址和端口');
        }
      } else {
        // 串口秤
        addLog('info', `使用串口连接，波特率: ${deviceConfig.scale.baudRate || 2400}`);
        
        const config: ScaleConfig = {
          type: 'serial',
          baudRate: deviceConfig.scale.baudRate || 2400,
          protocol: deviceConfig.scale.protocol as ScaleConfig['protocol'] || 'soki',
        };
        
        success = await deviceManager.serialScale.requestAndConnect(config);
        
        if (success) {
          deviceConfig.updateConfig('scale', { enabled: true });
          addLog('success', '串口秤连接成功！');
        } else {
          addLog('error', '串口秤连接失败，请检查串口线连接');
        }
      }
      
      // 更新状态
      setTimeout(() => {
        setDeviceStatuses(deviceManager.getAllStatus());
      }, 500);
      
    } catch (error: any) {
      addLog('error', `连接异常: ${error.message}`);
    } finally {
      setConnecting(null);
    }
  };
  
  // 断开电子秤
  const disconnectScale = async () => {
    addLog('info', '正在断开电子秤...');
    await deviceManager.disconnectScale();
    deviceConfig.updateConfig('scale', { enabled: false });
    setDeviceStatuses(deviceManager.getAllStatus());
    addLog('warn', '电子秤已断开');
  };
  
  // 连接打印机
  const connectPrinter = async () => {
    if (!deviceConfig.receiptPrinter.address) {
      addLog('error', '打印机IP地址不能为空');
      return;
    }
    
    setConnecting('printer');
    addLog('info', `连接打印机 ${deviceConfig.receiptPrinter.address}:${deviceConfig.receiptPrinter.port || 9100}`);
    
    try {
      const config: PrinterConfig = {
        type: 'network',
        address: deviceConfig.receiptPrinter.address,
        port: deviceConfig.receiptPrinter.port || 9100,
        width: deviceConfig.receiptPrinter.width || 58,
      };
      
      const success = await deviceManager.connectPrinter(config);
      
      if (success) {
        deviceConfig.updateConfig('receiptPrinter', { enabled: true });
        addLog('success', '打印机连接成功！');
      } else {
        addLog('error', '打印机连接失败');
      }
      
      setDeviceStatuses(deviceManager.getAllStatus());
    } catch (error: any) {
      addLog('error', `打印机连接异常: ${error.message}`);
    } finally {
      setConnecting(null);
    }
  };
  
  // 断开打印机
  const disconnectPrinter = async () => {
    addLog('info', '正在断开打印机...');
    await deviceManager.disconnectPrinter();
    deviceConfig.updateConfig('receiptPrinter', { enabled: false });
    setDeviceStatuses(deviceManager.getAllStatus());
    addLog('warn', '打印机已断开');
  };
  
  // 测试打印
  const testPrint = async () => {
    setPrinting(true);
    addLog('info', '正在测试打印...');
    
    try {
      const success = await deviceManager.printTest();
      
      if (success) {
        addLog('success', '打印测试成功！');
        setPrintResult('success');
      } else {
        addLog('error', '打印测试失败');
        setPrintResult('error');
      }
    } catch (error: any) {
      addLog('error', `打印异常: ${error.message}`);
      setPrintResult('error');
    } finally {
      setPrinting(false);
      setTimeout(() => setPrintResult(''), 3000);
    }
  };
  
  // 秤操作
  const handleScaleZero = () => {
    addLog('info', '执行归零操作');
    deviceManager.scaleZero();
  };
  
  const handleScaleTare = () => {
    addLog('info', '执行去皮操作');
    deviceManager.scaleTare();
  };
  
  // 清空日志
  const clearLogs = () => setLogs([]);
  
  const isScaleConnected = deviceStatuses.serialScale?.connected || deviceStatuses.networkScale?.connected;
  const isPrinterConnected = deviceStatuses.printer?.connected;
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold">设备设置</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs ${isScaleConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {isScaleConnected ? '✅ 秤已连接' : '⚪ 秤未连接'}
            </span>
            <span className={`px-2 py-1 rounded text-xs ${isPrinterConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {isPrinterConnected ? '✅ 打印已连接' : '⚪ 打印未连接'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* 电子秤设置 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-2xl">⚖️</span> 电子秤设置
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm ${isScaleConnected ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {isScaleConnected ? '已连接' : '未连接'}
            </span>
          </div>
          
          <div className="space-y-4">
            {/* 连接方式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">连接方式</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={deviceConfig.scale.type === 'serial'}
                    onChange={() => {
                      deviceConfig.updateConfig('scale', { type: 'serial' });
                      addLog('info', '切换为串口连接模式');
                    }}
                    className="text-blue-600"
                  />
                  <span>串口 (USB/RS232)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={deviceConfig.scale.type === 'network'}
                    onChange={() => {
                      deviceConfig.updateConfig('scale', { type: 'network' });
                      addLog('info', '切换为网口连接模式');
                    }}
                    className="text-blue-600"
                  />
                  <span>网口 (TCP/IP)</span>
                </label>
              </div>
            </div>
            
            {/* 串口配置 */}
            {deviceConfig.scale.type === 'serial' && (
              <>
                {/* 串口选择 - 自动检测可用设备 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择串口设备</label>
                  <div className="flex gap-2">
                    <select
                      value={deviceConfig.scale.address || '/dev/ttyS0'}
                      onChange={(e) => {
                        deviceConfig.updateConfig('scale', { address: e.target.value, port: 0 });
                        addLog('info', `选择串口: ${e.target.value}`);
                      }}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {/* 动态设备列表将通过自动检测填充 */}
                      <option value="/dev/ttyS4">串口4 (ttyS4) - 推荐</option>
                      <option value="/dev/ttyS5">串口5 (ttyS5)</option>
                      <option value="/dev/ttyS6">串口6 (ttyS6)</option>
                      <option value="/dev/ttyS0">串口0 (ttyS0)</option>
                      <option value="/dev/ttyS1">串口1 (ttyS1)</option>
                      <option value="/dev/ttyUSB0">USB转串口0 (ttyUSB0)</option>
                      <option value="/dev/ttyUSB1">USB转串口1 (ttyUSB1)</option>
                      <option value="/dev/ttyUSB2">USB转串口2 (ttyUSB2)</option>
                      <option value="/dev/ttyACM0">ACM串口0 (ttyACM0)</option>
                      <option value="/dev/ttyACM1">ACM串口1 (ttyACM1)</option>
                    </select>
                    <button
                      onClick={async () => {
                        addLog('info', '正在自动检测可用串口...');
                        
                        // 获取Android原生插件（带重试）
                        const getPlugin = (retries = 3): Promise<any> => {
                          return new Promise((resolve) => {
                            const tryGet = (r: number) => {
                              const capacitorPlugins = (window as any).Capacitor?.Plugins;
                              if (capacitorPlugins?.HailinHardware) {
                                resolve(capacitorPlugins.HailinHardware);
                                return;
                              }
                              const hw = (window as any).HailinHardware;
                              if (hw) {
                                if (!(window as any).Capacitor) (window as any).Capacitor = {};
                                if (!(window as any).Capacitor.Plugins) (window as any).Capacitor.Plugins = {};
                                (window as any).Capacitor.Plugins.HailinHardware = hw;
                                resolve(hw);
                                return;
                              }
                              if (r > 0) {
                                addLog('info', `等待插件加载... 剩余: ${r}`);
                                setTimeout(() => tryGet(r - 1), 500);
                              } else {
                                resolve(null);
                              }
                            };
                            tryGet(retries);
                          });
                        };
                        
                        const hailin = await getPlugin();
                        
                        if (hailin && hailin.listTtyDevices) {
                          try {
                            addLog('info', '正在列出可用串口设备...');
                            const result = await hailin.listTtyDevices();
                            if (result.count > 0) {
                              addLog('success', `发现 ${result.count} 个串口设备:`);
                              // 解析设备列表 { "ttyS4": "可读写", "ttyS5": "可读写", ... }
                              const devs = JSON.parse(JSON.stringify(result.devices));
                              const deviceList: { name: string; permission: string }[] = [];
                              
                              Object.entries(devs).forEach(([name, perm]: [string, any]) => {
                                deviceList.push({ name, permission: perm });
                                addLog('info', `  /dev/${name} - ${perm}`);
                              });
                              
                              // 过滤出可读写的设备
                              const writableDevices = deviceList.filter(d => 
                                d.permission.includes('可读写') || d.permission.includes('读写')
                              );
                              
                              if (writableDevices.length > 0) {
                                // 优先选择ttyS开头的设备
                                const preferredDevice = writableDevices.find(d => d.name.startsWith('ttyS')) || writableDevices[0];
                                deviceConfig.updateConfig('scale', { address: `/dev/${preferredDevice.name}` });
                                addLog('success', `已自动选择: /dev/${preferredDevice.name}`);
                              } else {
                                addLog('warn', '未发现可读写的串口设备');
                              }
                            } else {
                              addLog('warn', '未发现串口设备，请检查电子秤连接');
                            }
                          } catch (e: any) {
                            addLog('error', `检测失败: ${e.message}`);
                          }
                        } else {
                          addLog('error', '插件未就绪，请等待几秒后重试');
                        }
                      }}
                      className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                    >
                      自动检测
                    </button>
                    <button
                      onClick={async () => {
                        addLog('info', '正在检测电子秤...');
                        
                        // 获取Android原生插件（带重试）
                        const getPlugin = (retries = 3): Promise<any> => {
                          return new Promise((resolve) => {
                            const tryGet = (r: number) => {
                              const capacitorPlugins = (window as any).Capacitor?.Plugins;
                              if (capacitorPlugins?.HailinHardware) {
                                resolve(capacitorPlugins.HailinHardware);
                                return;
                              }
                              const hw = (window as any).HailinHardware;
                              if (hw) {
                                if (!(window as any).Capacitor) (window as any).Capacitor = {};
                                if (!(window as any).Capacitor.Plugins) (window as any).Capacitor.Plugins = {};
                                (window as any).Capacitor.Plugins.HailinHardware = hw;
                                resolve(hw);
                                return;
                              }
                              if (r > 0) {
                                addLog('info', `等待插件加载... 剩余: ${r}`);
                                setTimeout(() => tryGet(r - 1), 500);
                              } else {
                                resolve(null);
                              }
                            };
                            tryGet(retries);
                          });
                        };
                        
                        const hailin = await getPlugin();
                        
                        if (hailin) {
                          addLog('info', 'Android原生插件已就绪');
                          try {
                            const result = await hailin.detectScale({
                              port: deviceConfig.scale.address || '/dev/ttyS0',
                              baudRate: deviceConfig.scale.baudRate || 2400,
                              protocol: deviceConfig.scale.protocol || 'soki',
                            });
                            if (result.success) {
                              addLog('success', `检测到电子秤: ${result.deviceInfo || '顶尖OS2'}`);
                            } else {
                              addLog('error', `检测失败: ${result.error || '未找到设备'}`);
                            }
                          } catch (e: any) {
                            addLog('error', `检测异常: ${e.message}`);
                          }
                        } else {
                          addLog('error', 'Android原生插件未加载，请确保APP已更新');
                          addLog('info', '提示：完全关闭APP后重新打开，等待插件加载');
                        }
                      }}
                      className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
                    >
                      检测
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    常用串口: ttyS0(主板串口)、ttyUSB0(CH340)、ttyACM0(USB Modem)
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">通讯协议</label>
                    <select
                      value={deviceConfig.scale.protocol || 'soki'}
                      onChange={(e) => {
                        deviceConfig.updateConfig('scale', { protocol: e.target.value });
                        addLog('info', `协议改为: ${e.target.value}`);
                      }}
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
                      value={deviceConfig.scale.baudRate || 2400}
                      onChange={(e) => {
                        deviceConfig.updateConfig('scale', { baudRate: parseInt(e.target.value) });
                        addLog('info', `波特率改为: ${e.target.value}`);
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {baudRates.map((rate) => (
                        <option key={rate} value={rate}>{rate} bps</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                  💡 顶尖OS2系列: 协议=soki, 波特率=2400
                </p>
                
                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700 mb-4">
                  <div className="font-medium mb-2">🔍 设备检测工具</div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        addLog('info', '正在列出设备...');
                        
                        // 获取Android原生插件（带重试）
                        const getPlugin = (retries = 3): Promise<any> => {
                          return new Promise((resolve) => {
                            const tryGet = (r: number) => {
                              const capacitorPlugins = (window as any).Capacitor?.Plugins;
                              if (capacitorPlugins?.HailinHardware) {
                                resolve(capacitorPlugins.HailinHardware);
                                return;
                              }
                              const hw = (window as any).HailinHardware;
                              if (hw) {
                                if (!(window as any).Capacitor) (window as any).Capacitor = {};
                                if (!(window as any).Capacitor.Plugins) (window as any).Capacitor.Plugins = {};
                                (window as any).Capacitor.Plugins.HailinHardware = hw;
                                resolve(hw);
                                return;
                              }
                              if (r > 0) {
                                addLog('info', `等待插件... ${r}`);
                                setTimeout(() => tryGet(r - 1), 500);
                              } else {
                                resolve(null);
                              }
                            };
                            tryGet(retries);
                          });
                        };
                        
                        const hailin = await getPlugin();
                        
                        if (!hailin) {
                          addLog('error', 'Android原生插件未加载');
                          return;
                        }
                        
                        // 先列出tty设备
                        if (hailin?.listTtyDevices) {
                          try {
                            const result = await hailin.listTtyDevices();
                            if (result.count > 0) {
                              addLog('success', `发现 ${result.count} 个串口设备`);
                              // 解析设备信息
                              try {
                                const devs = JSON.parse(JSON.stringify(result.devices));
                                Object.values(devs).forEach((d: any) => {
                                  addLog('info', `  /dev/${d}`);
                                });
                              } catch (e) {
                                addLog('info', JSON.stringify(result.devices));
                              }
                            } else {
                              addLog('warn', '未发现串口设备');
                            }
                          } catch (e: any) {
                            addLog('error', `列出串口失败: ${e.message}`);
                          }
                        } else {
                          addLog('warn', '串口列表功能不可用');
                        }
                        
                        // 列出USB设备
                        if (hailin?.listUsbDevices) {
                          try {
                            const result = await hailin.listUsbDevices();
                            if (result.count > 0) {
                              addLog('success', `发现 ${result.count} 个USB设备`);
                              try {
                                const devs = JSON.parse(JSON.stringify(result.devices));
                                Object.values(devs).forEach((d: any) => {
                                  addLog('info', `  USB: ${d.name || '未知'} [${d.chipType || '?'}]`);
                                });
                              } catch (e) {
                                // ignore
                              }
                            } else {
                              addLog('info', '未发现USB设备');
                            }
                          } catch (e: any) {
                            addLog('error', `列出USB失败: ${e.message}`);
                          }
                        }
                      }}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                    >
                      📋 列出设备
                    </button>
                    
                    <button
                      onClick={async () => {
                        addLog('info', '正在检测电子秤...');
                        
                        // 获取Android原生插件（带重试）
                        const getPlugin = (retries = 3): Promise<any> => {
                          return new Promise((resolve) => {
                            const tryGet = (r: number) => {
                              const capacitorPlugins = (window as any).Capacitor?.Plugins;
                              if (capacitorPlugins?.HailinHardware) {
                                resolve(capacitorPlugins.HailinHardware);
                                return;
                              }
                              const hw = (window as any).HailinHardware;
                              if (hw) {
                                if (!(window as any).Capacitor) (window as any).Capacitor = {};
                                if (!(window as any).Capacitor.Plugins) (window as any).Capacitor.Plugins = {};
                                (window as any).Capacitor.Plugins.HailinHardware = hw;
                                resolve(hw);
                                return;
                              }
                              if (r > 0) {
                                addLog('info', `等待插件... ${r}`);
                                setTimeout(() => tryGet(r - 1), 500);
                              } else {
                                resolve(null);
                              }
                            };
                            tryGet(retries);
                          });
                        };
                        
                        const hailin = await getPlugin();
                        
                        if (!hailin) {
                          addLog('error', 'Android原生插件未加载');
                          return;
                        }
                        
                        if (hailin?.detectScale) {
                          try {
                            const result = await hailin.detectScale({
                              port: deviceConfig.scale.address || '/dev/ttyS0',
                              baudRate: deviceConfig.scale.baudRate || 2400,
                              protocol: deviceConfig.scale.protocol || 'soki',
                            });
                            if (result.success) {
                              addLog('success', `检测到电子秤: ${result.deviceInfo || '顶尖OS2'}`);
                            } else {
                              addLog('error', `检测失败: ${result.error || '未找到设备'}`);
                            }
                          } catch (e: any) {
                            addLog('error', `检测异常: ${e.message}`);
                          }
                        } else {
                          addLog('warn', '检测功能不可用，请更新APP');
                        }
                      }}
                      className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    >
                      ⚖️ 检测秤
                    </button>
                  </div>
                </div>
                
                {!('serial' in navigator) && (
                  <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                    ℹ️ 将使用Android原生USB Serial插件连接
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
                      onChange={(e) => {
                        deviceConfig.updateConfig('scale', { address: e.target.value });
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">端口</label>
                    <input
                      type="number"
                      placeholder="8080"
                      value={deviceConfig.scale.port || 8080}
                      onChange={(e) => {
                        deviceConfig.updateConfig('scale', { port: parseInt(e.target.value) || 8080 });
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">通讯协议</label>
                  <select
                    value={deviceConfig.scale.protocol || 'soki'}
                    onChange={(e) => {
                      deviceConfig.updateConfig('scale', { protocol: e.target.value });
                      addLog('info', `协议改为: ${e.target.value}`);
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {scaleProtocols.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            
            {/* 连接/断开按钮 */}
            <div className="flex gap-3">
              {isScaleConnected ? (
                <>
                  <button
                    onClick={disconnectScale}
                    className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    断开连接
                  </button>
                  <button
                    onClick={connectScale}
                    disabled={connecting === 'scale'}
                    className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {connecting === 'scale' ? '连接中...' : '重新连接'}
                  </button>
                </>
              ) : (
                <button
                  onClick={connectScale}
                  disabled={connecting === 'scale'}
                  className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {connecting === 'scale' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      连接中...
                    </>
                  ) : (
                    <>🔗 连接电子秤</>
                  )}
                </button>
              )}
            </div>
            
            {/* 秤读数显示 */}
            {isScaleConnected && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium">实时重量</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${scaleReading.stable ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {scaleReading.stable ? '✓ 稳定' : '⏳ 不稳定'}
                  </span>
                </div>
                <div className="text-5xl font-bold text-center mb-4 text-gray-800">
                  {scaleReading.weight.toFixed(3)} <span className="text-2xl text-gray-500">kg</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleScaleZero} 
                    className="py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    🎯 归零
                  </button>
                  <button 
                    onClick={handleScaleTare} 
                    className="py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    ⚖️ 去皮
                  </button>
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
            <span className={`px-3 py-1 rounded-full text-sm ${isPrinterConnected ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {isPrinterConnected ? '已连接' : '未连接'}
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
                  onChange={(e) => deviceConfig.updateConfig('receiptPrinter', { port: parseInt(e.target.value) || 9100 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">纸宽</label>
              <select
                value={deviceConfig.receiptPrinter.width || 58}
                onChange={(e) => deviceConfig.updateConfig('receiptPrinter', { width: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={58}>58mm (小票)</option>
                <option value={80}>80mm (宽行)</option>
              </select>
            </div>
            
            <div className="flex gap-3">
              {isPrinterConnected ? (
                <>
                  <button
                    onClick={disconnectPrinter}
                    className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    断开连接
                  </button>
                  <button
                    onClick={testPrint}
                    disabled={printing}
                    className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {printing ? '打印中...' : '🧪 测试打印'}
                  </button>
                </>
              ) : (
                <button
                  onClick={connectPrinter}
                  disabled={connecting === 'printer'}
                  className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {connecting === 'printer' ? '连接中...' : '🔗 连接打印机'}
                </button>
              )}
            </div>
            
            {printResult && (
              <div className={`p-3 rounded-lg text-center ${printResult === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {printResult === 'success' ? '✓ 打印测试成功！' : '✗ 打印测试失败'}
              </div>
            )}
          </div>
        </div>
        
        {/* 连接日志 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-2xl">📋</span> 连接日志
            </h2>
            <button
              onClick={clearLogs}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 border rounded"
            >
              清空
            </button>
          </div>
          
          <div 
            ref={logRef}
            className="bg-gray-900 text-gray-100 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm"
          >
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                暂无日志
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex gap-2 mb-1">
                  <span className="text-gray-500">[{log.time}]</span>
                  <span className={
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'warn' ? 'text-yellow-400' : 'text-gray-300'
                  }>
                    {log.type === 'success' ? '✅' :
                     log.type === 'error' ? '❌' :
                     log.type === 'warn' ? '⚠️' : 'ℹ️'} {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* 保存提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-medium text-blue-800">配置自动保存</p>
              <p className="text-sm text-blue-600 mt-1">
                所有设备配置会自动保存，下次打开应用时会自动尝试连接已保存的设备。
                如需更换设备，请先断开当前连接再重新配置。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
