'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePosAuth } from '@/contexts/PosAuthContext';
import {
  Scale,
  Printer,
  CustomerDisplay,
  getDebugInfo,
  type ScaleDevice,
  type PrinterDevice,
} from '@/lib/native/index';
import {
  Scale as ScaleIcon,
  Printer as PrinterIcon,
  Monitor,
  Usb,
  Bluetooth,
  RefreshCw,
  Power,
  Check,
  X,
  Loader2,
  AlertCircle,
  Wifi,
  Plug,
  Unplug,
} from 'lucide-react';

// 设备类型定义
interface DeviceInfo {
  id: string;
  name: string;
  type: 'scale' | 'printer' | 'cashbox' | 'display';
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  address?: string;
  lastConnected?: Date;
  error?: string;
}

// 保存的设备配置
interface SavedDeviceConfig {
  scales: Array<{ address: string; name: string; lastUsed: Date }>;
  printers: Array<{ address: string; name: string; lastUsed: Date }>;
  autoConnect: boolean;
}

const STORAGE_KEY = 'hardware_device_config';

export default function HardwarePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = usePosAuth();
  
  // 运行环境检测
  const [isNative, setIsNative] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // 设备状态
  const [devices, setDevices] = useState<{
    scale: DeviceInfo | null;
    printer: DeviceInfo | null;
    display: DeviceInfo | null;
    cashbox: DeviceInfo | null;
  }>({
    scale: null,
    printer: null,
    display: null,
    cashbox: null,
  });
  
  // 可用设备列表
  const [availableScales, setAvailableScales] = useState<ScaleDevice[]>([]);
  const [availablePrinters, setAvailablePrinters] = useState<PrinterDevice[]>([]);
  
  // 连接中状态
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  
  // 测试结果
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  
  // 设备变化监听
  const [deviceChangeCount, setDeviceChangeCount] = useState(0);
  
  // 自动重连状态
  const [autoReconnect, setAutoReconnect] = useState(true);
  
  // 保存的配置
  const [savedConfig, setSavedConfig] = useState<SavedDeviceConfig>({
    scales: [],
    printers: [],
    autoConnect: true,
  });
  
  // 上次检测时间
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  
  // 刷新锁，防止频繁刷新
  const refreshLock = useRef(false);

  // 加载保存的配置
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSavedConfig(JSON.parse(saved));
      } catch (e) {
        console.error('[Hardware] Load config error:', e);
      }
    }
  }, []);

  // 保存配置
  const saveConfig = useCallback((config: SavedDeviceConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setSavedConfig(config);
  }, []);

  // 检查登录状态
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push('/pos/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  // 初始化硬件检测
  useEffect(() => {
    const info = getDebugInfo();
    setDebugInfo(info);
    setIsNative(info.isNativeApp);
    
    console.log('[Hardware] Debug info:', info);
    
    // 如果是原生APP，初始化设备检测
    if (info.isNativeApp) {
      initDeviceDetection();
    }
  }, []);

  // 设备变化时自动重新检测
  useEffect(() => {
    if (deviceChangeCount > 0 && isNative) {
      console.log('[Hardware] Device changed, re-scanning...');
      initDeviceDetection();
    }
  }, [deviceChangeCount, isNative]);

  // 监听设备连接状态变化
  useEffect(() => {
    if (!isNative) return;

    let intervalId: NodeJS.Timeout;
    
    const checkDeviceStatus = async () => {
      try {
        // 检查电子秤状态
        const scaleStatus = await Scale.getStatus();
        setDevices(prev => {
          if (scaleStatus.connected && !prev.scale) {
            console.log('[Hardware] Scale auto-connected');
            return {
              ...prev,
              scale: {
                id: 'scale-usb-1',
                name: 'USB电子秤',
                type: 'scale',
                status: 'connected',
                address: 'USB',
              },
            };
          } else if (!scaleStatus.connected && prev.scale && prev.scale.status === 'connected') {
            console.log('[Hardware] Scale disconnected');
            // 自动重连
            if (autoReconnect) {
              handleConnectScaleWithConfig();
            }
            return {
              ...prev,
              scale: prev.scale ? { ...prev.scale, status: 'disconnected' } : null,
            };
          }
          return prev;
        });

        // 检查打印机状态
        const printerStatus = await Printer.getStatus();
        setDevices(prev => {
          if (printerStatus.connected && !prev.printer) {
            console.log('[Hardware] Printer auto-connected');
            return {
              ...prev,
              printer: {
                id: 'printer-bt-1',
                name: '蓝牙打印机',
                type: 'printer',
                status: 'connected',
              },
              cashbox: {
                id: 'cashbox-1',
                name: '钱箱',
                type: 'cashbox',
                status: 'connected',
              },
            };
          } else if (!printerStatus.connected && prev.printer && prev.printer.status === 'connected') {
            console.log('[Hardware] Printer disconnected');
            return {
              ...prev,
              printer: prev.printer ? { ...prev.printer, status: 'disconnected' } : null,
              cashbox: { id: 'cashbox-1', name: '钱箱', type: 'cashbox', status: 'disconnected' },
            };
          }
          return prev;
        });
      } catch (e) {
        // 忽略错误
      }
    };

    // 每5秒检查一次设备状态
    intervalId = setInterval(checkDeviceStatus, 5000);
    
    return () => clearInterval(intervalId);
  }, [isNative, autoReconnect]);

  // 初始化设备检测
  const initDeviceDetection = async () => {
    if (refreshLock.current) {
      console.log('[Hardware] Refresh locked, skipping...');
      return;
    }
    
    refreshLock.current = true;
    
    try {
      // 检测电子秤
      await detectScales();
      
      // 检测打印机
      await detectPrinters();
      
      // 检测客显屏
      await detectDisplay();
      
      setLastScanTime(new Date());
      setDeviceChangeCount(prev => prev + 1);
    } finally {
      // 延迟解锁，防止频繁刷新
      setTimeout(() => {
        refreshLock.current = false;
      }, 2000);
    }
  };

  // 检测电子秤设备
  const detectScales = async () => {
    try {
      const scales = await Scale.listDevices();
      setAvailableScales(scales);
      console.log('[Hardware] Found scales:', scales.length);
      
      // 检查是否已连接
      const status = await Scale.getStatus();
      if (status.connected) {
        setDevices(prev => ({
          ...prev,
          scale: {
            id: scales[0]?.address || 'scale-usb-1',
            name: scales[0]?.name || 'USB电子秤',
            type: 'scale',
            status: 'connected',
            address: scales[0]?.address,
            lastConnected: new Date(),
          },
        }));
      } else {
        // 尝试从保存的配置自动连接
        if (savedConfig.autoConnect && savedConfig.scales.length > 0) {
          const lastUsed = savedConfig.scales[0];
          const scale = scales.find(s => s.address === lastUsed.address);
          if (scale) {
            console.log('[Hardware] Auto-connecting to saved scale:', scale.name);
            await handleConnectScaleWithConfig(scale);
          }
        }
      }
    } catch (e) {
      console.error('[Hardware] Detect scales error:', e);
    }
  };

  // 检测打印机设备
  const detectPrinters = async () => {
    try {
      const printers = await Printer.listDevices();
      setAvailablePrinters(printers);
      console.log('[Hardware] Found printers:', printers.length);
      
      // 检查是否已连接
      const status = await Printer.getStatus();
      if (status.connected) {
        setDevices(prev => ({
          ...prev,
          printer: {
            id: printers[0]?.address || 'printer-bt-1',
            name: printers[0]?.name || '蓝牙打印机',
            type: 'printer',
            status: 'connected',
            address: printers[0]?.address,
            lastConnected: new Date(),
          },
          cashbox: {
            id: 'cashbox-1',
            name: '钱箱',
            type: 'cashbox',
            status: 'connected',
          },
        }));
      } else {
        // 尝试从保存的配置自动连接
        if (savedConfig.autoConnect && savedConfig.printers.length > 0) {
          const lastUsed = savedConfig.printers[0];
          const printer = printers.find(p => p.address === lastUsed.address);
          if (printer) {
            console.log('[Hardware] Auto-connecting to saved printer:', printer.name);
            await handleConnectPrinterWithConfig(printer);
          }
        }
      }
    } catch (e) {
      console.error('[Hardware] Detect printers error:', e);
    }
  };

  // 检测客显屏
  const detectDisplay = async () => {
    try {
      const displays = await CustomerDisplay.getDisplays();
      console.log('[Hardware] Found displays:', displays.length);
      
      if (displays.length > 1) {
        const secondaryDisplay = displays.find(d => !d.isPrimary);
        if (secondaryDisplay) {
          setDevices(prev => ({
            ...prev,
            display: {
              id: `display-${secondaryDisplay.id}`,
              name: secondaryDisplay.name || `屏幕 ${secondaryDisplay.id}`,
              type: 'display',
              status: 'disconnected',
              address: String(secondaryDisplay.id),
            },
          }));
        }
      }
    } catch (e) {
      console.error('[Hardware] Detect display error:', e);
    }
  };

  // 连接电子秤（带配置保存）
  const handleConnectScaleWithConfig = async (scale?: ScaleDevice) => {
    const targetScale = scale || availableScales[0];
    if (!targetScale) return;

    setIsConnecting('scale');
    setTestResult(null);
    
    try {
      const result = await Scale.connect({ port: targetScale.address });
      
      if (result.success) {
        // 保存到配置
        const newConfig = {
          ...savedConfig,
          scales: [
            { address: targetScale.address, name: targetScale.name, lastUsed: new Date() },
            ...savedConfig.scales.filter(s => s.address !== targetScale.address).slice(0, 4),
          ],
        };
        saveConfig(newConfig);
        
        setDevices(prev => ({
          ...prev,
          scale: {
            id: targetScale.address,
            name: targetScale.name,
            type: 'scale',
            status: 'connected',
            address: targetScale.address,
            lastConnected: new Date(),
          },
        }));
        setTestResult({ success: true, message: `已连接: ${targetScale.name}` });
      } else {
        setTestResult({ success: false, message: result.message });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || '连接失败' });
    } finally {
      setIsConnecting(null);
    }
  };

  // 断开电子秤
  const handleDisconnectScale = async () => {
    await Scale.disconnect();
    setDevices(prev => ({ ...prev, scale: null }));
    setTestResult({ success: true, message: '电子秤已断开' });
  };

  // 连接打印机（带配置保存）
  const handleConnectPrinterWithConfig = async (printer: PrinterDevice) => {
    setIsConnecting('printer');
    setTestResult(null);
    
    try {
      const result = await Printer.connect(printer.address, printer.name);
      
      if (result.success) {
        // 保存到配置
        const newConfig = {
          ...savedConfig,
          printers: [
            { address: printer.address, name: printer.name, lastUsed: new Date() },
            ...savedConfig.printers.filter(p => p.address !== printer.address).slice(0, 4),
          ],
        };
        saveConfig(newConfig);
        
        setDevices(prev => ({
          ...prev,
          printer: {
            id: printer.address,
            name: printer.name,
            type: 'printer',
            status: 'connected',
            address: printer.address,
            lastConnected: new Date(),
          },
          cashbox: {
            id: 'cashbox-1',
            name: '钱箱',
            type: 'cashbox',
            status: 'connected',
          },
        }));
        setTestResult({ success: true, message: `已连接: ${printer.name}` });
      } else {
        setTestResult({ success: false, message: result.message });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || '连接失败' });
    } finally {
      setIsConnecting(null);
    }
  };

  // 断开打印机
  const handleDisconnectPrinter = async () => {
    await Printer.disconnect();
    setDevices(prev => ({ ...prev, printer: null, cashbox: null }));
    setTestResult({ success: true, message: '打印机已断开' });
  };

  // 打开钱箱
  const handleOpenCashbox = async () => {
    setTestLoading(true);
    setTestResult(null);
    
    try {
      const result = await Printer.openCashbox();
      setTestResult({
        success: result.success,
        message: result.success ? '钱箱已打开' : result.message,
      });
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || '打开失败' });
    } finally {
      setTestLoading(false);
    }
  };

  // 测试打印
  const handleTestPrint = async () => {
    setTestLoading(true);
    setTestResult(null);
    
    try {
      const testData = {
        shopName: '海邻到家',
        orderNo: 'TEST' + Date.now(),
        date: new Date().toLocaleString('zh-CN'),
        cashier: '系统测试',
        items: [{ name: '测试商品', quantity: '1', price: '99.00' }],
        total: 99,
        payment: 100,
        change: 1,
      };
      
      const result = await Printer.printReceipt(testData);
      setTestResult({
        success: result.success,
        message: result.success ? '打印成功' : result.message,
      });
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || '打印失败' });
    } finally {
      setTestLoading(false);
    }
  };

  // 打开客显屏
  const handleOpenDisplay = async () => {
    setIsConnecting('display');
    setTestResult(null);
    
    try {
      const displays = await CustomerDisplay.getDisplays();
      const secondaryDisplay = displays.find(d => !d.isPrimary);
      
      const result = await CustomerDisplay.open(secondaryDisplay?.id);
      
      if (result.success) {
        setDevices(prev => ({
          ...prev,
          display: {
            id: `display-${secondaryDisplay?.id || 1}`,
            name: secondaryDisplay?.name || '客显屏',
            type: 'display',
            status: 'connected',
            address: String(secondaryDisplay?.id || 1),
            lastConnected: new Date(),
          },
        }));
        setTestResult({ success: true, message: '客显屏已打开' });
      } else {
        setTestResult({ success: false, message: result.message });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || '打开失败' });
    } finally {
      setIsConnecting(null);
    }
  };

  // 关闭客显屏
  const handleCloseDisplay = async () => {
    await CustomerDisplay.close();
    setDevices(prev => ({ ...prev, display: null }));
    setTestResult({ success: true, message: '客显屏已关闭' });
  };

  // 渲染设备状态
  const renderStatusBadge = (status: DeviceInfo['status']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" />已连接</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />连接中...</Badge>;
      case 'disconnected':
        return <Badge variant="outline"><Unplug className="h-3 w-3 mr-1" />未连接</Badge>;
      case 'error':
        return <Badge className="bg-red-500"><AlertCircle className="h-3 w-3 mr-1" />错误</Badge>;
    }
  };

  // 格式化时间
  const formatTime = (date: Date | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 头部 */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Plug className="h-5 w-5" />
              外设管理
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              管理收银机外设设备
              {isNative && <Badge className="bg-green-500">原生APP</Badge>}
              {!isNative && <Badge className="bg-amber-500">Web模式</Badge>}
              {lastScanTime && (
                <span className="text-xs text-gray-400">
                  上次扫描: {formatTime(lastScanTime)}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoReconnect}
                onChange={(e) => setAutoReconnect(e.target.checked)}
                className="rounded"
              />
              自动重连
            </label>
            <Button variant="outline" size="sm" onClick={initDeviceDetection}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新设备
            </Button>
          </div>
        </div>
      </div>

      {/* 调试信息 */}
      {debugInfo && (
        <div className="bg-gray-800 text-gray-300 px-6 py-2 text-xs font-mono">
          <div className="flex gap-4">
            <span>isNative: {String(debugInfo.isNativeApp)}</span>
            <span>plugins: {debugInfo.plugins?.join(', ') || 'none'}</span>
          </div>
        </div>
      )}

      {/* 测试结果 */}
      {testResult && (
        <div className={`mx-6 mt-4 p-4 rounded-lg flex items-center gap-2 ${
          testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          {testResult.success ? <Check className="h-5 w-5 text-green-600" /> : <X className="h-5 w-5 text-red-600" />}
          <span className={testResult.success ? 'text-green-700' : 'text-red-700'}>{testResult.message}</span>
        </div>
      )}

      {/* 设备列表 */}
      <div className="p-6 grid gap-4">
        {/* 电子秤 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ScaleIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    电子秤
                    {devices.scale && <Wifi className="h-4 w-4 text-green-500" />}
                  </CardTitle>
                  <CardDescription>USB串口电子秤（顶尖OS2协议）</CardDescription>
                </div>
              </div>
              {renderStatusBadge(devices.scale?.status || 'disconnected')}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devices.scale ? (
                // 已连接状态
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {devices.scale.name}
                        {devices.scale.lastConnected && (
                          <span className="text-xs text-gray-500">
                            连接于 {formatTime(devices.scale.lastConnected)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Usb className="h-3 w-3" />
                        {devices.scale.address || 'USB'}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDisconnectScale}>
                      断开
                    </Button>
                  </div>
                </div>
              ) : null}
              
              {/* 可用设备列表 */}
              {availableScales.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 font-medium">
                    可用设备 ({availableScales.length})
                  </div>
                  {availableScales.map((scale, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        devices.scale?.address === scale.address
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Usb className="h-4 w-4 text-gray-400" />
                        <span>{scale.name}</span>
                      </div>
                      {devices.scale?.address === scale.address ? (
                        <Badge variant="outline" className="bg-green-50">已连接</Badge>
                      ) : (
                        <Button size="sm" onClick={() => handleConnectScaleWithConfig(scale)}>
                          连接
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <Button
                className="w-full"
                onClick={() => handleConnectScaleWithConfig()}
                disabled={isConnecting === 'scale' || availableScales.length === 0}
              >
                {isConnecting === 'scale' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plug className="h-4 w-4 mr-2" />
                )}
                {devices.scale ? '重新连接' : '连接电子秤'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 小票打印机 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PrinterIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    小票打印机
                    {devices.printer && <Wifi className="h-4 w-4 text-green-500" />}
                  </CardTitle>
                  <CardDescription>蓝牙打印机（ESC/POS协议）</CardDescription>
                </div>
              </div>
              {renderStatusBadge(devices.printer?.status || 'disconnected')}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devices.printer ? (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {devices.printer.name}
                        {devices.printer.lastConnected && (
                          <span className="text-xs text-gray-500">
                            连接于 {formatTime(devices.printer.lastConnected)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Bluetooth className="h-3 w-3" />
                        {devices.printer.address}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDisconnectPrinter}>
                      断开
                    </Button>
                  </div>
                </div>
              ) : null}
              
              {/* 可用设备列表 */}
              {availablePrinters.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 font-medium">
                    可用设备 ({availablePrinters.length})
                  </div>
                  {availablePrinters.map((printer, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        devices.printer?.address === printer.address
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Bluetooth className="h-4 w-4 text-blue-400" />
                        <span>{printer.name}</span>
                      </div>
                      {devices.printer?.address === printer.address ? (
                        <Badge variant="outline" className="bg-green-50">已连接</Badge>
                      ) : (
                        <Button size="sm" onClick={() => handleConnectPrinterWithConfig(printer)}>
                          连接
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <Button
                className="w-full"
                onClick={() => availablePrinters[0] && handleConnectPrinterWithConfig(availablePrinters[0])}
                disabled={isConnecting === 'printer' || availablePrinters.length === 0}
              >
                {isConnecting === 'printer' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Bluetooth className="h-4 w-4 mr-2" />
                )}
                {devices.printer ? '重新连接' : '连接打印机'}
              </Button>
              
              {devices.printer && (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={handleTestPrint} disabled={testLoading}>
                    测试打印
                  </Button>
                  <Button variant="outline" onClick={handleOpenCashbox} disabled={testLoading}>
                    打开钱箱
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 客显屏 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Monitor className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">客显屏</CardTitle>
                  <CardDescription>双屏收银机副屏</CardDescription>
                </div>
              </div>
              {renderStatusBadge(devices.display?.status || 'disconnected')}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devices.display && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{devices.display.name}</div>
                      <div className="text-sm text-gray-500">屏幕 {devices.display.address}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCloseDisplay}>
                      关闭
                    </Button>
                  </div>
                </div>
              )}
              
              <Button
                className="w-full"
                onClick={handleOpenDisplay}
                disabled={isConnecting === 'display'}
              >
                {isConnecting === 'display' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Monitor className="h-4 w-4 mr-2" />
                )}
                {devices.display ? '重新打开' : '打开客显屏'}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('/pos/customer-display', '_blank')}
              >
                预览客显内容
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 钱箱 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Power className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">钱箱</CardTitle>
                  <CardDescription>通过打印机端口控制</CardDescription>
                </div>
              </div>
              {renderStatusBadge(devices.cashbox?.status || 'disconnected')}
            </div>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={handleOpenCashbox}
              disabled={!devices.printer || testLoading}
            >
              {testLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Power className="h-4 w-4 mr-2" />
              )}
              打开钱箱
            </Button>
            {!devices.printer && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                请先连接打印机以控制钱箱
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
