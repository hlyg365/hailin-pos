/**
 * 设备调试页面
 * 用于测试和诊断收银设备连接问题
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deviceManager, deviceEvents, enumerateSerialPorts } from '../services/hardwareService';
import { getHardwarePlugin } from '../services/hardwareService';

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
  
  // 秤连接类型：serial, network, usb
  const [scaleType, setScaleType] = useState<'serial' | 'network' | 'usb'>('serial');
  
  // 串口配置 - 顶尖OS2X-15 电子秤默认参数
  const [serialConfig, setSerialConfig] = useState({
    port: '/dev/ttyS0',  // 主板串口0（根据实测记录）
    baudRate: 9600,      // 用户实测稳定的波特率
    protocol: 'soki',     // 顶尖OS2专用协议
  });
  
  // 网络秤配置
  const [scaleIP, setScaleIP] = useState('192.168.1.100');
  const [scalePort, setScalePort] = useState(9101);
  
  // USB配置
  const [usbConfig, setUSBConfig] = useState({
    vendorId: 0,
    productId: 0,
  });
  
  // 打印机配置
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
    setConnecting(true);
    
    try {
      let connected = false;
      
      if (scaleType === 'serial') {
        // 串口模式
        addLog('info', `连接串口秤: ${serialConfig.port} @ ${serialConfig.baudRate}bps, 协议: ${serialConfig.protocol}`);
        
        connected = await deviceManager.scale.connect({
          port: serialConfig.port,
          baudRate: serialConfig.baudRate,
          protocol: serialConfig.protocol,
          type: 'serial'
        });
      } else if (scaleType === 'usb') {
        // USB HID模式
        addLog('info', `连接USB HID秤: VID=${usbConfig.vendorId.toString(16)}, PID=${usbConfig.productId.toString(16)}`);
        
        connected = await deviceManager.scale.connect({
          type: 'usb',
          vendorId: usbConfig.vendorId,
          productId: usbConfig.productId,
          protocol: 'soki'
        });
      } else {
        // 网络模式
        if (!scaleIP) {
          addLog('error', '请输入电子秤IP地址');
          setConnecting(false);
          return;
        }
        
        addLog('info', `连接网络秤: ${scaleIP}:${scalePort}`);
        
        connected = await deviceManager.scale.connect({
          port: scaleIP,
          baudRate: scalePort,
          protocol: 'soki',
          type: 'network'
        });
      }
      
      if (connected) {
        addLog('success', '电子秤连接成功！');
        deviceManager.scale.startContinuous(500);
      } else {
        addLog('error', '电子秤连接失败，请检查配置');
      }
    } catch (e: any) {
      addLog('error', `连接异常: ${e.message}`);
    } finally {
      setConnecting(false);
      refreshStatus();
    }
  };
  // 枚举可用串口设备
  const enumeratePorts = async () => {
    setConnecting(true);
    addLog('info', '========================================');
    addLog('info', '🔍 正在枚举串口设备...');
    addLog('info', '========================================');
    
    try {
      // 方式0: 首先尝试调用已注册的 HailinHardware 插件（如果 listSerialPorts 方法存在）
      addLog('info', '方式0: 检查已注册的 HailinHardware 插件...');
      const registeredPlugin = (window as any).Capacitor?.Plugins?.HailinHardware;
      if (registeredPlugin && typeof registeredPlugin.listSerialPorts === 'function') {
        addLog('info', '✅ 方式0: 已注册的 HailinHardware.listSerialPorts 存在');
        try {
          const result = await registeredPlugin.listSerialPorts();
          addLog('info', `结果: ${JSON.stringify(result)}`);
          if (result?.success && result?.ports) {
            addLog('info', `找到 ${result.ports.length} 个串口`);
            result.ports.forEach((port: any) => {
              addLog('info', `  ${port.path} (r=${port.readable}, w=${port.writable})`);
            });
            setConnecting(false);
            return;
          } else if (result?.error) {
            addLog('error', `枚举失败: ${result.error}`);
          }
        } catch (e: any) {
          addLog('error', `方式0 调用异常: ${e.message}`);
        }
      } else {
        addLog('info', '⚠️ 方式0: listSerialPorts 方法不可用，尝试其他方式');
      }
      
      // 方式1: 尝试 Capacitor.nativeCallback
      addLog('info', '方式1: 尝试 Capacitor.nativeCallback...');
      try {
        const cap = (window as any).Capacitor;
        if (cap && typeof cap.nativeCallback === 'function') {
          addLog('info', 'Capacitor.nativeCallback 存在');
          // 直接调用原生方法
          const result = await cap.nativeCallback('HailinHardware', 'listSerialPorts', {});
          addLog('info', `原生返回: ${JSON.stringify(result)}`);
          
          // 处理结果
          if (typeof result === 'string') {
            // 如果返回的是 callbackId，说明调用没有完成
            addLog('warn', `⚠️ 返回了 callbackId: ${result}，原生方法可能未执行`);
            // 尝试作为成功结果解析
            try {
              const parsed = JSON.parse(result);
              if (parsed.success !== undefined) {
                const ports = parsed.ports || [];
                addLog('info', `找到 ${ports.length} 个串口`);
                ports.forEach((port: any) => {
                  addLog('info', `  ${port.path || port}`);
                });
                setConnecting(false);
                return;
              }
            } catch {}
          } else if (result?.success !== undefined) {
            // 标准结果格式
            if (result.success && result.ports) {
              addLog('info', `✅ 枚举成功，找到 ${result.ports.length} 个串口`);
              result.ports.forEach((port: any) => {
                addLog('info', `  ${port.path} (r=${port.readable}, w=${port.writable})`);
              });
              setConnecting(false);
              return;
            } else {
              addLog('warn', `⚠️ 枚举失败: ${result.error || '未知错误'}`);
            }
          }
        } else {
          addLog('info', '⚠️ 方式1: Capacitor.nativeCallback 不可用');
        }
      } catch (e: any) {
        addLog('error', `方式1 异常: ${e.message}`);
      }
      
      // 方式2: 尝试 window.HailinHardware.listSerialPorts (Cordova 兼容)
      addLog('info', '方式2: 尝试 window.HailinHardware.listSerialPorts()...');
      const hailin = (window as any).HailinHardware;
      if (hailin && typeof hailin.listSerialPorts === 'function') {
        addLog('info', '✅ 方式2: HailinHardware.listSerialPorts 存在');
        try {
          const result = await hailin.listSerialPorts();
          addLog('info', `结果: ${JSON.stringify(result)}`);
          if (result?.ports) {
            addLog('info', `找到 ${result.ports.length} 个串口`);
            result.ports.forEach((port: any) => {
              addLog('info', `  ${port.path || port}`);
            });
          }
          setConnecting(false);
          return;
        } catch (e: any) {
          addLog('error', `方式2 异常: ${e.message}`);
        }
      } else {
        addLog('info', '⚠️ 方式2: window.HailinHardware.listSerialPorts 不可用');
      }
      
      // 所有方式都失败
      addLog('error', '❌ 所有调用方式均失败');
      addLog('info', '可能原因:');
      addLog('info', '1. 原生插件未正确编译到 APK');
      addLog('info', '2. listSerialPorts 方法未在 @PluginMethod 中定义');
      addLog('info', '3. 请检查 Android Studio 日志中的 [枚举串口] 标签');
      
    } catch (e: any) {
      addLog('error', `❌ 异常: ${e.message}`);
    }
    
    setConnecting(false);
  };

  // 自动检测电子秤（协议握手法）
  // 自动检测电子秤（协议握手法）
  const detectScale = async () => {
    setConnecting(true);
    addLog('info', '🔍 开始自动检测电子秤...');
    addLog('info', `使用串口: ${serialConfig.port}, 波特率: ${serialConfig.baudRate}`);
    
    try {
      // 调用原生检测方法
      const result = await (deviceManager.scale as any).detect?.(
        serialConfig.port,
        serialConfig.baudRate
      );
      
      if (result?.success && result?.detected) {
        addLog('success', `✅ 检测到电子秤！`);
        addLog('success', `设备信息: ${result.deviceInfo}`);
        addLog('success', `协议: ${result.protocol}`);
        addLog('info', `波特率: ${result.baudRate}`);
        
        // 根据检测结果自动配置
        setSerialConfig(prev => ({
          ...prev,
          protocol: result.protocol || 'general',
          baudRate: result.baudRate || prev.baudRate
        }));
        setScaleType('serial');
        
        // 询问是否连接
        const confirmed = window.confirm(
          `检测到 ${result.deviceInfo}\n协议: ${result.protocol}\n是否现在连接？`
        );
        
        if (confirmed) {
          addLog('info', '正在建立连接...');
          // 触发连接
          const connected = await deviceManager.scale.connect({
            port: serialConfig.port,
            baudRate: result.baudRate || serialConfig.baudRate,
            protocol: result.protocol || 'general',
            type: 'serial'
          });
          
          if (connected) {
            addLog('success', '电子秤连接成功！');
            deviceManager.scale.startContinuous(500);
          } else {
            addLog('error', '连接失败');
          }
        }
      } else {
        addLog('error', '❌ 未检测到电子秤');
        addLog('info', '请检查:');
        addLog('info', '1. 电子秤是否已开机');
        addLog('info', '2. 串口线是否连接正确');
        addLog('info', `3. 波特率是否匹配 (${serialConfig.baudRate || 9600})`);
        addLog('info', '4. 是否使用了正确的串口号');
        addLog('info', '5. 尝试点击下方"🔄 扫描所有串口"按钮');
      }
    } catch (e: any) {
      addLog('error', `检测异常: ${e.message}`);
    } finally {
      setConnecting(false);
      refreshStatus();
    }
  };

    // 扫描所有常见串口
  const scanAllPorts = async () => {
    setConnecting(true);
    addLog('info', '========================================');
    addLog('info', '🔍 正在枚举串口设备...');
    addLog('info', '========================================');
    
    try {
      // Capacitor 插件的正确访问方式
      addLog('info', '检查 Capacitor.Plugins.HailinHardware...');
      
      // 使用 try-catch 包裹可能触发栈溢出的访问
      let hailin: any = null;
      try {
        hailin = (window as any).Capacitor?.Plugins?.HailinHardware;
      } catch (e) {
        addLog('error', `❌ 访问 Capacitor.Plugins 异常: ${e}`);
      }
      
      if (!hailin) {
        // 尝试备用方式
        try {
          hailin = (window as any).HailinHardware;
        } catch (e) {
          addLog('error', `❌ 访问 HailinHardware 异常: ${e}`);
        }
      }
      
      if (!hailin) {
        addLog('error', '❌ 插件未加载');
        addLog('info', '尝试通过 Capacitor.nativeCallback 直接调用...');
        
        // 最后尝试：直接通过 Capacitor.nativeCallback 调用
        try {
          const cap = (window as any).Capacitor;
          if (cap) {
            addLog('info', 'Capacitor 存在，尝试 nativeCallback...');
            const result = await cap.nativeCallback('HailinHardware', 'listSerialPorts', {});
            addLog('info', `结果: ${JSON.stringify(result)}`);
            setConnecting(false);
            return;
          }
        } catch (e: any) {
          addLog('error', `nativeCallback 失败: ${e.message}`);
        }
        
        setConnecting(false);
        return;
      }
      
      addLog('info', '✅ 插件存在，调用 listSerialPorts...');
      
      // 调用插件方法
      try {
        const result = await hailin.listSerialPorts();
        addLog('info', '✅ 枚举成功');
        addLog('info', `结果: ${JSON.stringify(result)}`);
        
        const ports = result?.ports || result?.serialPorts || [];
        addLog('info', `找到 ${ports.length} 个串口设备`);
        ports.forEach((port: any) => {
          addLog('info', `  ${port.path || port}`);
        });
      } catch (e: any) {
        addLog('error', `❌ 调用失败: ${e.message}`);
      }
      
    } catch (e: any) {
      addLog('error', `❌ 异常: ${e.message}`);
    }
    
    setConnecting(false);
  };

  // 快速连接 - 跳过枚举，直接尝试连接常用端口
  const quickConnectScale = async () => {
    setConnecting(true);
    addLog('info', '========================================');
    addLog('info', '⚡ 快速连接 - 直接尝试常用端口');
    addLog('info', '========================================');
    
    // 常用端口组合（顶尖秤：波特率2400，协议soki）
    const commonPorts = [
      { port: '/dev/ttyUSB0', baudRate: 2400, name: 'USB转串口0' },
      { port: '/dev/ttyUSB1', baudRate: 2400, name: 'USB转串口1' },
      { port: '/dev/ttyUSB2', baudRate: 2400, name: 'USB转串口2' },
      { port: '/dev/ttyS0', baudRate: 2400, name: '串口0' },
      { port: '/dev/ttyS1', baudRate: 2400, name: '串口1' },
      { port: '/dev/ttyS3', baudRate: 2400, name: '串口3' },
      // 9600波特率也试试
      { port: '/dev/ttyUSB0', baudRate: 9600, name: 'USB转串口0 (9600)' },
      { port: '/dev/ttyS0', baudRate: 9600, name: '串口0 (9600)' },
    ];
    
    // 获取原生插件
    const getPlugin = () => {
      try {
        return (window as any).Capacitor?.Plugins?.HailinHardware;
      } catch {
        return null;
      }
    };
    
    let plugin = getPlugin();
    if (!plugin) {
      addLog('error', '❌ 原生插件未加载');
      addLog('info', '请确认APK已正确安装');
      setConnecting(false);
      return;
    }
    
    addLog('info', '✅ 原生插件就绪');
    addLog('info', `将依次尝试 ${commonPorts.length} 个端口配置...`);
    
    let found = false;
    
    for (let i = 0; i < commonPorts.length; i++) {
      const config = commonPorts[i];
      addLog('info', `----------------------------------------`);
      addLog('info', `尝试 ${i + 1}/${commonPorts.length}: ${config.name}`);
      addLog('info', `  端口: ${config.port}`);
      addLog('info', `  波特率: ${config.baudRate}`);
      
      try {
        // 调用 scaleConnect
        const connectResult = await plugin.scaleConnect({
          port: config.port,
          baudRate: config.baudRate,
          protocol: 'soki',
          connectionId: 'quick-' + i
        });
        
        addLog('info', `  连接结果: ${JSON.stringify(connectResult)}`);
        
        if (connectResult?.success) {
          addLog('success', `✅ 可能找到了电子秤！`);
          found = true;
          
          // 尝试读取重量
          addLog('info', `  正在读取重量...`);
          await new Promise(r => setTimeout(r, 1000)); // 等待1秒
          
          try {
            const weightResult = await plugin.scaleReadWeight({
              connectionId: 'quick-' + i
            });
            addLog('info', `  重量结果: ${JSON.stringify(weightResult)}`);
            
            if (weightResult?.success && weightResult.weight !== undefined) {
              addLog('success', `✅ 连接成功！重量: ${weightResult.weight} ${weightResult.unit}`);
              addLog('info', `----------------------------------------`);
              addLog('info', `📌 请记下这个配置:`);
              addLog('info', `   端口: ${config.port}`);
              addLog('info', `   波特率: ${config.baudRate}`);
              
              // 更新配置
              setSerialConfig(prev => ({
                ...prev,
                port: config.port,
                baudRate: config.baudRate,
                protocol: 'soki'
              }));
              
              setConnecting(false);
              return;
            }
          } catch (e: any) {
            addLog('warn', `  读取重量失败: ${e.message}`);
          }
          
          // 连接成功但无重量数据，继续尝试其他端口
          try {
            await plugin.scaleDisconnect({ connectionId: 'quick-' + i });
          } catch {}
        }
        
      } catch (e: any) {
        addLog('warn', `  异常: ${e.message}`);
      }
      
      // 每个端口间隔500ms
      await new Promise(r => setTimeout(r, 500));
    }
    
    addLog('error', '❌ 所有端口都尝试完毕，未找到电子秤');
    addLog('info', '----------------------------------------');
    addLog('info', '可能原因:');
    addLog('info', '1. 电子秤未连接或未开启');
    addLog('info', '2. USB转串口驱动未安装');
    addLog('info', '3. 串口线接触不良');
    addLog('info', '4. 波特率配置不正确 (顶尖秤默认2400)');
    
    setConnecting(false);
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
          
          {/* 连接类型选择 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setScaleType('serial')}
              className={`px-3 py-1 rounded text-sm ${scaleType === 'serial' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              串口 (RS232)
            </button>
            <button
              onClick={() => setScaleType('network')}
              className={`px-3 py-1 rounded text-sm ${scaleType === 'network' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              网络秤 (TCP)
            </button>
            <button
              onClick={() => setScaleType('usb')}
              className={`px-3 py-1 rounded text-sm ${scaleType === 'usb' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              USB HID
            </button>
          </div>
          
          {scaleType === 'serial' && (
            /* 串口配置 */
            <div className="space-y-3 mb-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">串口路径</label>
                  <select
                    value={serialConfig.port}
                    onChange={(e) => setSerialConfig({...serialConfig, port: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="/dev/ttyS0">/dev/ttyS0 (串口0)</option>
                    <option value="/dev/ttyS1">/dev/ttyS1 (串口1)</option>
                    <option value="/dev/ttyS2">/dev/ttyS2 (串口2)</option>
                    <option value="/dev/ttyS3">/dev/ttyS3 (串口3)</option>
                    <option value="/dev/ttyS4">/dev/ttyS4 (串口4)</option>
                    <option value="/dev/ttyS5">/dev/ttyS5 (串口5)</option>
                    <option value="/dev/ttyS6">/dev/ttyS6 (串口6)</option>
                    <option value="/dev/ttyS7">/dev/ttyS7 (串口7)</option>
                    <option value="/dev/ttyS8">/dev/ttyS8 (串口8)</option>
                    <option value="/dev/ttyS9">/dev/ttyS9 (串口9)</option>
                    <option value="/dev/ttyACM0">/dev/ttyACM0 (USB ACM)</option>
                    <option value="/dev/ttyUSB0">/dev/ttyUSB0 (USB转串口)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">波特率</label>
                  <select
                    value={serialConfig.baudRate}
                    onChange={(e) => setSerialConfig({...serialConfig, baudRate: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="9600">9600 (顶尖OS2 推荐)</option>
                    <option value="2400">2400</option>
                    <option value="4800">4800</option>
                    <option value="1200">1200</option>
                    <option value="600">600</option>
                    <option value="19200">19200</option>
                    <option value="38400">38400</option>
                    <option value="57600">57600</option>
                    <option value="115200">115200</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">协议</label>
                <select
                  value={serialConfig.protocol}
                  onChange={(e) => setSerialConfig({...serialConfig, protocol: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="soki">顶尖 OS2 协议 (推荐)</option>
                  <option value="general">通用协议</option>
                  <option value="aclss">顶尖 ACLaS 协议</option>
                  <option value="dahua">大华协议</option>
                  <option value="toieda">托利多协议</option>
                </select>
              </div>
            </div>
          )}
          
          {scaleType === 'network' && (
            /* 网络秤配置 */
            <div className="grid grid-cols-3 gap-2 mb-3">
              <input
                type="text"
                value={scaleIP}
                onChange={(e) => setScaleIP(e.target.value)}
                placeholder="IP地址 (192.168.1.100)"
                className="px-3 py-2 border rounded"
              />
              <input
                type="number"
                value={scalePort}
                onChange={(e) => setScalePort(parseInt(e.target.value) || 9101)}
                placeholder="端口 (9101)"
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
          )}
          
          {scaleType === 'usb' && (
            /* USB HID配置 */
            <div className="grid grid-cols-3 gap-2 mb-3">
              <input
                type="text"
                value={usbConfig.vendorId ? `0x${usbConfig.vendorId.toString(16)}` : ''}
                onChange={(e) => setUSBConfig({...usbConfig, vendorId: parseInt(e.target.value.replace('0x', ''), 16) || 0})}
                placeholder="厂商ID (0x1234)"
                className="px-3 py-2 border rounded"
              />
              <input
                type="text"
                value={usbConfig.productId ? `0x${usbConfig.productId.toString(16)}` : ''}
                onChange={(e) => setUSBConfig({...usbConfig, productId: parseInt(e.target.value.replace('0x', ''), 16) || 0})}
                placeholder="产品ID (0x5678)"
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
          )}
          
          {(scaleType === 'serial') && (
            <button
              onClick={testScale}
              disabled={connecting}
              className="w-full bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 py-2"
            >
              {connecting ? '连接中...' : '连接串口秤'}
            </button>
          )}
          
          {/* 枚举串口设备按钮 */}
          <button
            onClick={enumeratePorts}
            disabled={connecting}
            className="w-full bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 py-2 mt-2"
          >
            {connecting ? '枚举中...' : '📋 枚举串口设备'}
          </button>
          
          {/* 检测设备按钮 */}
          <button
            onClick={detectScale}
            disabled={connecting}
            className="w-full bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 py-2 mt-2"
          >
            {connecting ? '检测中...' : '🔍 自动检测电子秤'}
          </button>
          
          {/* 扫描所有串口按钮 */}
          <button
            onClick={scanAllPorts}
            disabled={connecting}
            className="w-full bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 py-2 mt-2"
          >
            {connecting ? '扫描中...' : '🔄 扫描所有串口 + USB设备'}
          </button>
          
          {/* 快速连接按钮 - 跳过枚举，直接尝试连接 */}
          <button
            onClick={quickConnectScale}
            disabled={connecting}
            className="w-full bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 py-2 mt-2"
          >
            ⚡ 快速连接 (跳过枚举，直接尝试)
          </button>
          
          {/* 枚举USB设备按钮 */}
          <button
            onClick={async () => {
              const hailin = (window as any).HailinHardware;
              if (hailin?.listUsbDevices) {
                addLog('info', '正在枚举USB设备...');
                try {
                  const result = await hailin.listUsbDevices();
                  addLog('info', `USB设备数量: ${result.count || 0}`);
                  if (result.devices) {
                    const devs = JSON.parse(JSON.stringify(result.devices));
                    Object.values(devs).forEach((d: any) => {
                      addLog('info', `设备: ${d.name || '未知'} [${d.chipType || '?'}]`);
                      addLog('info', `  VID:${d.vendorId?.toString(16)?.toUpperCase()} PID:${d.productId?.toString(16)?.toUpperCase()}`);
                      if (d.serialPort) addLog('info', `  串口路径: ${d.serialPort}`);
                    });
                  }
                } catch (e: any) {
                  addLog('error', `枚举失败: ${e.message}`);
                }
              } else {
                addLog('error', 'listUsbDevices 方法不可用');
              }
            }}
            className="w-full bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 py-2 mt-2"
          >
            📋 枚举USB设备
          </button>
          
          <div className="mt-2 text-xs text-gray-500">
            {scaleType === 'serial' && '提示: 顶尖OS2电子秤使用 /dev/ttyS1 或 /dev/ttyS3，波特率多为 2400'}
            {scaleType === 'network' && '提示: 网络秤默认端口通常为 9101'}
            {scaleType === 'usb' && '提示: USB HID秤通过USB连接，模拟键盘输入'}
          </div>
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
            <li>• 网络秤默认端口: 9101，打印机默认端口: 9100</li>
            <li>• 串口模式: /dev/ttyS1，顶尖OS2波特率: 2400</li>
            <li>• 钱箱需要通过打印机接口控制</li>
            <li>• 客显屏需要设备支持双屏显示</li>
            <li>• 串口权限问题: 需要系统签名或 Root</li>
          </ul>
        </div>
        
        {/* 权限说明 */}
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <h3 className="font-bold text-red-800 mb-2">🔒 串口权限说明</h3>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• 串口设备（如 /dev/ttyS1）需要系统级权限</li>
            <li>• 普通 APK 无法直接访问串口</li>
            <li>• 解决方案:</li>
            <li className="ml-4">1. 联系设备厂商获取系统签名</li>
            <li className="ml-4">2. 使用 Root 权限</li>
            <li className="ml-4">3. 使用厂商提供的 SDK</li>
            <li>• 网络模式不需要特殊权限，推荐使用</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
