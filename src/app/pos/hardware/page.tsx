'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { usePosAuth } from '@/contexts/PosAuthContext';
import {
  isNativeApp,
  Scale,
  Printer,
  CustomerDisplay,
  getDebugInfo,
  type ScaleDevice,
  type PrinterDevice,
} from '@/lib/native/index';
import {
  Printer,
  Scale,
  Monitor,
  Usb,
  Bluetooth,
  Wifi,
  Check,
  X,
  RefreshCw,
  Power,
  AlertCircle,
  Info,
  Loader2,
  ChevronDown,
} from 'lucide-react';

// 设备类型定义
interface DeviceInfo {
  id: string;
  name: string;
  type: 'scale' | 'printer' | 'cashbox' | 'display';
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  address?: string;
  manufacturer?: string;
  lastConnected?: Date;
  error?: string;
}

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
  
  // 电子秤设置
  const [scaleSettings, setScaleSettings] = useState({
    baudRate: 9600,
    port: 'USB',
  });
  
  // 打印机设置
  const [printerSettings, setPrinterSettings] = useState({
    paperWidth: 80,
    autoCut: true,
  });

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

  // 初始化设备检测
  const initDeviceDetection = async () => {
    // 检测电子秤
    await detectScales();
    
    // 检测打印机
    await detectPrinters();
    
    // 检测客显屏
    await detectDisplay();
  };

  // 检测电子秤设备
  const detectScales = async () => {
    try {
      const scales = await Scale.listDevices();
      setAvailableScales(scales);
      
      // 检查是否已连接
      const status = await Scale.getStatus();
      if (status.connected) {
        setDevices(prev => ({
          ...prev,
          scale: {
            id: 'scale-usb-1',
            name: 'USB电子秤',
            type: 'scale',
            status: 'connected',
            address: 'USB',
          },
        }));
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
      
      // 检查是否已连接
      const status = await Printer.getStatus();
      if (status.connected) {
        setDevices(prev => ({
          ...prev,
          printer: {
            id: 'printer-bt-1',
            name: printers[0]?.name || '蓝牙打印机',
            type: 'printer',
            status: 'connected',
            address: printers[0]?.address,
          },
          cashbox: {
            id: 'cashbox-1',
            name: '钱箱',
            type: 'cashbox',
            status: status.connected ? 'connected' : 'disconnected',
          },
        }));
      }
    } catch (e) {
      console.error('[Hardware] Detect printers error:', e);
    }
  };

  // 检测客显屏
  const detectDisplay = async () => {
    try {
      const displays = await CustomerDisplay.getDisplays();
      
      if (displays.length > 1) {
        // 有多个屏幕，客显屏可能是第二个
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

  // 连接电子秤
  const handleConnectScale = async () => {
    setIsConnecting('scale');
    setTestResult(null);
    
    try {
      // 如果有可用设备，连接第一个
      if (availableScales.length > 0) {
        const scale = availableScales[0];
        const result = await Scale.connect({ port: scale.address });
        
        if (result.success) {
          setDevices(prev => ({
            ...prev,
            scale: {
              id: scale.address || 'scale-1',
              name: scale.name || 'USB电子秤',
              type: 'scale',
              status: 'connected',
              address: scale.address,
            },
          }));
          setTestResult({ success: true, message: `已连接: ${scale.name}` });
        } else {
          setTestResult({ success: false, message: result.message });
        }
      } else {
        // 没有可用设备，尝试自动连接
        const result = await Scale.connect({ baudRate: scaleSettings.baudRate });
        
        if (result.success) {
          setDevices(prev => ({
            ...prev,
            scale: {
              id: 'scale-usb-1',
              name: 'USB电子秤',
              type: 'scale',
              status: 'connected',
              address: 'USB',
            },
          }));
          setTestResult({ success: true, message: '电子秤连接成功' });
        } else {
          setTestResult({ success: false, message: result.message });
        }
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

  // 连接打印机
  const handleConnectPrinter = async (address: string, name?: string) => {
    setIsConnecting('printer');
    setTestResult(null);
    
    try {
      const result = await Printer.connect(address, name);
      
      if (result.success) {
        setDevices(prev => ({
          ...prev,
          printer: {
            id: address,
            name: name || '蓝牙打印机',
            type: 'printer',
            status: 'connected',
            address,
          },
          cashbox: {
            id: 'cashbox-1',
            name: '钱箱',
            type: 'cashbox',
            status: 'connected',
          },
        }));
        setTestResult({ success: true, message: `已连接: ${name || address}` });
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
      // 获取显示列表
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
        return <Badge className="bg-green-500">已连接</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500">连接中...</Badge>;
      case 'disconnected':
        return <Badge variant="outline">未连接</Badge>;
      case 'error':
        return <Badge className="bg-red-500">错误</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 头部 */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">外设管理</h1>
          <p className="text-sm text-gray-500">
            管理收银机外设设备
            {isNative && <Badge className="ml-2 bg-green-500">原生APP</Badge>}
            {!isNative && <Badge className="ml-2 bg-amber-500">Web模式</Badge>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={initDeviceDetection}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新设备
        </Button>
      </div>

      {/* 调试信息 */}
      {debugInfo && (
        <div className="bg-gray-800 text-gray-300 px-6 py-3 text-xs font-mono">
          <div>isNativeApp: {String(debugInfo.isNativeApp)}</div>
          <div>platform: {debugInfo.platform}</div>
          <div>plugins: {debugInfo.plugins?.join(', ') || 'none'}</div>
          <div>UA: {debugInfo.userAgent?.substring(0, 80)}...</div>
        </div>
      )}

      {/* 测试结果 */}
      {testResult && (
        <div className={`mx-6 mt-4 p-4 rounded-lg ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            {testResult.success ? <Check className="h-5 w-5 text-green-600" /> : <X className="h-5 w-5 text-red-600" />}
            <span className={testResult.success ? 'text-green-700' : 'text-red-700'}>{testResult.message}</span>
          </div>
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
                  <Scale className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">电子秤</CardTitle>
                  <CardDescription>USB串口电子秤（顶尖OS2协议）</CardDescription>
                </div>
              </div>
              {devices.scale && renderStatusBadge(devices.scale.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devices.scale ? (
                // 已连接状态
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <div className="font-medium">{devices.scale.name}</div>
                      <div className="text-sm text-gray-500">{devices.scale.address}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDisconnectScale}>
                      断开
                    </Button>
                  </div>
                  <Button className="w-full" variant="outline" onClick={handleOpenCashbox} disabled={testLoading}>
                    {testLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    测试称重
                  </Button>
                </div>
              ) : (
                // 未连接状态
                <div className="space-y-3">
                  <div className="text-sm text-gray-500">
                    {availableScales.length > 0 ? `发现 ${availableScales.length} 个电子秤设备` : '未发现电子秤设备'}
                  </div>
                  {availableScales.map((scale, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Usb className="h-4 w-4 text-gray-400" />
                        <span>{scale.name}</span>
                      </div>
                      <Button size="sm" onClick={() => handleConnectScale()}>
                        连接
                      </Button>
                    </div>
                  ))}
                  <Button 
                    className="w-full" 
                    onClick={handleConnectScale}
                    disabled={isConnecting === 'scale'}
                  >
                    {isConnecting === 'scale' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {availableScales.length > 0 ? '连接第一个设备' : '自动检测并连接'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 小票打印机 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Printer className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">小票打印机</CardTitle>
                  <CardDescription>蓝牙打印机（ESC/POS协议）</CardDescription>
                </div>
              </div>
              {devices.printer && renderStatusBadge(devices.printer.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devices.printer ? (
                // 已连接状态
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <div className="font-medium">{devices.printer.name}</div>
                      <div className="text-sm text-gray-500">{devices.printer.address}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDisconnectPrinter}>
                      断开
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={handleTestPrint} disabled={testLoading}>
                      测试打印
                    </Button>
                    <Button variant="outline" onClick={handleOpenCashbox} disabled={testLoading}>
                      打开钱箱
                    </Button>
                  </div>
                </div>
              ) : (
                // 未连接状态
                <div className="space-y-3">
                  <div className="text-sm text-gray-500">
                    {availablePrinters.length > 0 ? `发现 ${availablePrinters.length} 个蓝牙设备` : '未发现蓝牙打印机'}
                  </div>
                  {availablePrinters.map((printer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Bluetooth className="h-4 w-4 text-blue-400" />
                        <span>{printer.name}</span>
                      </div>
                      <Button size="sm" onClick={() => handleConnectPrinter(printer.address, printer.name)}>
                        连接
                      </Button>
                    </div>
                  ))}
                  <Button 
                    className="w-full" 
                    onClick={() => availablePrinters[0] && handleConnectPrinter(availablePrinters[0].address, availablePrinters[0].name)}
                    disabled={isConnecting === 'printer' || availablePrinters.length === 0}
                  >
                    {isConnecting === 'printer' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bluetooth className="h-4 w-4 mr-2" />}
                    {availablePrinters.length > 0 ? '连接第一个设备' : '请先配对蓝牙打印机'}
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
              {devices.display && renderStatusBadge(devices.display.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devices.display ? (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <div className="font-medium">{devices.display.name}</div>
                    <div className="text-sm text-gray-500">ID: {devices.display.address}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCloseDisplay}>
                    关闭
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={handleOpenDisplay}
                  disabled={isConnecting === 'display'}
                >
                  {isConnecting === 'display' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Monitor className="h-4 w-4 mr-2" />}
                  打开客显屏
                </Button>
              )}
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

        {/* 钱箱状态 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="h-6 w-6 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-lg">钱箱</CardTitle>
                  <CardDescription>通过打印机端口控制</CardDescription>
                </div>
              </div>
              {devices.cashbox && renderStatusBadge(devices.cashbox.status)}
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={handleOpenCashbox}
              disabled={!devices.printer || testLoading}
            >
              {testLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Power className="h-4 w-4 mr-2" />}
              打开钱箱
            </Button>
            {!devices.printer && (
              <p className="text-sm text-gray-500 mt-2 text-center">请先连接打印机以控制钱箱</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
