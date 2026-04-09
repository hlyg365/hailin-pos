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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { usePosAuth } from '@/contexts/PosAuthContext';
import { useHardware, isHardwareSupported, getSupportedHardwareFeatures } from '@/hooks/useHardware';
import {
  Printer,
  Barcode,
  Scale,
  Wallet,
  Monitor,
  HardDrive,
  Usb,
  Bluetooth,
  Wifi,
  Check,
  X,
  RefreshCw,
  Settings,
  TestTube,
  Power,
  AlertCircle,
  Info,
  ChevronRight,
  FileText,
  Tag,
  Volume2,
  ShoppingCart,
} from 'lucide-react';

// 设备类型定义
interface DeviceInfo {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  manufacturer?: string;
  productId?: string;
  vendorId?: string;
  lastConnected?: Date;
}

// 打印机配置
interface PrinterSettings {
  paperWidth: 58 | 80;
  autoCut: boolean;
  openCashboxAfterPrint: boolean;
  printCopies: 1 | 2;
  printSpeed: 'normal' | 'fast';
  density: number;
}

// 价签打印配置
interface LabelSettings {
  paperSize: '70x38' | '60x40' | '50x30';
  showName: boolean;
  showPrice: boolean;
  showBarcode: boolean;
  showSpec: boolean;
  showUnit: boolean;
  showMemberPrice: boolean;
}

// 电子秤配置
interface ScaleSettings {
  port: string;
  baudRate: number;
  barcodeScaleType: 'none' | 'tm-ab' | 'tm-f' | 'ls2zx';
  autoTare: boolean;
  unit: 'kg' | 'jin';
}

// 钱箱配置
interface CashboxSettings {
  enabled: boolean;
  autoOpen: boolean;
  pulseWidth: number;
  openDelay: number;
}

// 客显屏配置
interface CustomerDisplaySettings {
  enabled: boolean;
  showAds: boolean;
  volume: number;
  brightness: number;
}

export default function HardwarePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = usePosAuth();
  
  // 硬件Hook
  const {
    scanner,
    printer,
    printerStatus,
    cashboxStatus,
    isConnecting,
    error,
    connectPrinter,
    disconnectPrinter,
    printReceipt,
    testPrint,
    openCashbox,
  } = useHardware();
  
  // 当前选中的设备类型
  const [activeDevice, setActiveDevice] = useState<string>('printer');
  
  // 设备列表
  const [connectedDevices, setConnectedDevices] = useState<DeviceInfo[]>([]);
  
  // 打印机设置
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>({
    paperWidth: 80,
    autoCut: true,
    openCashboxAfterPrint: true,
    printCopies: 1,
    printSpeed: 'normal',
    density: 50,
  });
  
  // 价签设置
  const [labelSettings, setLabelSettings] = useState<LabelSettings>({
    paperSize: '70x38',
    showName: true,
    showPrice: true,
    showBarcode: true,
    showSpec: true,
    showUnit: true,
    showMemberPrice: false,
  });
  
  // 电子秤设置
  const [scaleSettings, setScaleSettings] = useState<ScaleSettings>({
    port: 'COM1',
    baudRate: 9600,
    barcodeScaleType: 'none',
    autoTare: false,
    unit: 'jin',
  });
  
  // 钱箱设置
  const [cashboxSettings, setCashboxSettings] = useState<CashboxSettings>({
    enabled: true,
    autoOpen: true,
    pulseWidth: 50,
    openDelay: 100,
  });
  
  // 客显屏设置
  const [customerDisplaySettings, setCustomerDisplaySettings] = useState<CustomerDisplaySettings>({
    enabled: true,
    showAds: true,
    volume: 50,
    brightness: 80,
  });
  
  // 扫码结果
  const [scanResult, setScanResult] = useState<string>('');
  
  // 称重结果
  const [weightResult, setWeightResult] = useState<number | null>(null);
  
  // 测试状态
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // 保存提示
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // 串口列表（电子秤）
  const [availablePorts, setAvailablePorts] = useState<string[]>(['COM1', 'COM2', 'COM3', 'COM4', 'COM5']);
  
  // 硬件支持状态
  const [hardwareFeatures, setHardwareFeatures] = useState({
    usb: false,
    bluetooth: false,
    camera: false,
  });

  // 检查登录状态
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push('/pos/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  // 初始化硬件支持检测
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHardwareFeatures(getSupportedHardwareFeatures());
    }
  }, []);

  // 更新连接设备列表
  useEffect(() => {
    const devices: DeviceInfo[] = [];
    
    if (scanner) {
      devices.push({
        id: scanner.id,
        name: scanner.name,
        type: 'scanner',
        status: scanner.status,
        lastConnected: new Date(),
      });
    }
    
    if (printer) {
      devices.push({
        id: printer.id,
        name: printer.name,
        type: 'printer',
        status: printer.status,
        lastConnected: new Date(),
      });
    }
    
    setConnectedDevices(devices);
  }, [scanner, printer]);

  // 显示保存提示
  const showSaveMessage = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(null), 2000);
  };

  // 连接打印机
  const handleConnectPrinter = async (type: 'usb' | 'bluetooth' | 'network', ipAddress?: string) => {
    try {
      const device = await connectPrinter(type, ipAddress ? { ipAddress } : undefined);
      if (device) {
        showSaveMessage(`已连接: ${device.name}`);
      }
    } catch (err) {
      console.error('连接打印机失败:', err);
    }
  };

  // 断开打印机
  const handleDisconnectPrinter = async () => {
    await disconnectPrinter();
    showSaveMessage('打印机已断开');
  };

  // 测试打印
  const handleTestPrint = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const success = await testPrint();
      setTestResult({
        success,
        message: success ? '测试打印成功' : '测试打印失败',
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: '测试打印失败: ' + (err instanceof Error ? err.message : '未知错误'),
      });
    } finally {
      setIsTesting(false);
    }
  };

  // 打开钱箱
  const handleOpenCashbox = async () => {
    setIsTesting(true);
    try {
      const { cashboxService } = await import('@/lib/cashbox-service');
      const result = await cashboxService.open();
      
      setTestResult({
        success: result.success,
        message: result.message,
      });
    } catch (err) {
      console.error('[Hardware] Open cashbox error:', err);
      setTestResult({
        success: false,
        message: '打开钱箱失败',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // 连接电子秤
  const handleConnectScale = async () => {
    if (!hardwareFeatures.usb) {
      setTestResult({
        success: false,
        message: '浏览器不支持USB设备，请使用Chrome或Edge浏览器',
      });
      return;
    }
    
    setIsTesting(true);
    try {
      // 请求用户选择串口
      // @ts-ignore - Web Serial API
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: scaleSettings.baudRate });
      
      setTestResult({
        success: true,
        message: `已连接电子秤 (${scaleSettings.port})`,
      });
      
      // 模拟读取重量
      setTimeout(() => {
        setWeightResult(1.25 + Math.random() * 0.5);
      }, 500);
    } catch (err) {
      setTestResult({
        success: false,
        message: '连接电子秤失败: ' + (err instanceof Error ? err.message : '未知错误'),
      });
    } finally {
      setIsTesting(false);
    }
  };

  // 测试扫码枪
  const handleTestScanner = () => {
    setIsTesting(true);
    setScanResult('等待扫码...');
    
    // 设置一个超时
    const timeout = setTimeout(() => {
      setScanResult('未检测到扫码输入');
      setIsTesting(false);
    }, 10000);
    
    // 监听键盘输入（模拟扫码枪）
    let buffer = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        clearTimeout(timeout);
        if (buffer.length > 0) {
          setScanResult(buffer);
          setTestResult({
            success: true,
            message: '扫码测试成功',
          });
        }
        buffer = '';
        setIsTesting(false);
        document.removeEventListener('keydown', handleKeyDown);
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
  };

  // 打开客显屏窗口
  const handleOpenCustomerDisplay = () => {
    const url = '/pos/customer-display';
    window.open(url, 'customerDisplay', 'width=800,height=600,menubar=no,toolbar=no,location=no,status=no');
  };

  // 渲染设备状态徽章
  const renderStatusBadge = (status: 'connected' | 'disconnected' | 'error') => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500 hover:bg-green-600">已连接</Badge>;
      case 'disconnected':
        return <Badge variant="outline" className="text-gray-500">未连接</Badge>;
      case 'error':
        return <Badge variant="destructive">错误</Badge>;
    }
  };

  // 渲染打印机设置面板
  const renderPrinterSettings = () => (
    <div className="space-y-6">
      {/* 设备连接状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            打印机连接
          </CardTitle>
          <CardDescription>
            连接小票打印机，支持USB、蓝牙和网络打印机
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {printer && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Printer className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{printer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {printer.type === 'usb' ? 'USB连接' : printer.type === 'bluetooth' ? '蓝牙连接' : '网络连接'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {renderStatusBadge(printer.status)}
                <Button variant="outline" size="sm" onClick={handleDisconnectPrinter}>
                  断开
                </Button>
              </div>
            </div>
          )}
          
          {!printer && (
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handleConnectPrinter('usb')}
                disabled={isConnecting || !hardwareFeatures.usb}
              >
                <Usb className="h-6 w-6" />
                <span>USB打印机</span>
                {!hardwareFeatures.usb && (
                  <span className="text-xs text-muted-foreground">浏览器不支持</span>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handleConnectPrinter('bluetooth')}
                disabled={isConnecting || !hardwareFeatures.bluetooth}
              >
                <Bluetooth className="h-6 w-6" />
                <span>蓝牙打印机</span>
                {!hardwareFeatures.bluetooth && (
                  <span className="text-xs text-muted-foreground">浏览器不支持</span>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => {
                  const ip = prompt('请输入打印机IP地址');
                  if (ip) handleConnectPrinter('network', ip);
                }}
                disabled={isConnecting}
              >
                <Wifi className="h-6 w-6" />
                <span>网络打印机</span>
              </Button>
            </div>
          )}
          
          {isConnecting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              正在连接...
            </div>
          )}
          
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 打印设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            打印设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>纸张宽度</Label>
              <Select
                value={String(printerSettings.paperWidth)}
                onValueChange={(v) => setPrinterSettings({ ...printerSettings, paperWidth: Number(v) as 58 | 80 })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58">58mm</SelectItem>
                  <SelectItem value="80">80mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>打印份数</Label>
              <Select
                value={String(printerSettings.printCopies)}
                onValueChange={(v) => setPrinterSettings({ ...printerSettings, printCopies: Number(v) as 1 | 2 })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1份</SelectItem>
                  <SelectItem value="2">2份</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoCut">自动切纸</Label>
              <Switch
                id="autoCut"
                checked={printerSettings.autoCut}
                onCheckedChange={(checked) => setPrinterSettings({ ...printerSettings, autoCut: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="openCashbox">打印后开钱箱</Label>
              <Switch
                id="openCashbox"
                checked={printerSettings.openCashboxAfterPrint}
                onCheckedChange={(checked) => setPrinterSettings({ ...printerSettings, openCashboxAfterPrint: checked })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>打印浓度: {printerSettings.density}%</Label>
            <input
              type="range"
              min="30"
              max="100"
              value={printerSettings.density}
              onChange={(e) => setPrinterSettings({ ...printerSettings, density: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* 价签打印设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            价签打印
          </CardTitle>
          <CardDescription>
            配置商品价签打印格式
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>价签尺寸</Label>
            <Select
              value={labelSettings.paperSize}
              onValueChange={(v) => setLabelSettings({ ...labelSettings, paperSize: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="70x38">70mm x 38mm (标准)</SelectItem>
                <SelectItem value="60x40">60mm x 40mm</SelectItem>
                <SelectItem value="50x30">50mm x 30mm (小号)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="showName">显示商品名称</Label>
              <Switch
                id="showName"
                checked={labelSettings.showName}
                onCheckedChange={(checked) => setLabelSettings({ ...labelSettings, showName: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showPrice">显示价格</Label>
              <Switch
                id="showPrice"
                checked={labelSettings.showPrice}
                onCheckedChange={(checked) => setLabelSettings({ ...labelSettings, showPrice: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showBarcode">显示条码</Label>
              <Switch
                id="showBarcode"
                checked={labelSettings.showBarcode}
                onCheckedChange={(checked) => setLabelSettings({ ...labelSettings, showBarcode: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showSpec">显示规格</Label>
              <Switch
                id="showSpec"
                checked={labelSettings.showSpec}
                onCheckedChange={(checked) => setLabelSettings({ ...labelSettings, showSpec: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 测试打印 */}
      <Card>
        <CardHeader>
          <CardTitle>测试打印</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={handleTestPrint} disabled={!printer || isTesting}>
              {isTesting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              测试小票打印
            </Button>
            <Button variant="outline" disabled={!printer || isTesting}>
              <Tag className="h-4 w-4 mr-2" />
              测试价签打印
            </Button>
          </div>
          
          {testResult && (
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-lg",
              testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            )}>
              {testResult.success ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              {testResult.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // 渲染扫码枪设置面板
  const renderScannerSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Barcode className="h-5 w-5" />
            扫码枪连接
          </CardTitle>
          <CardDescription>
            USB扫码枪通常作为键盘设备，无需特殊配置即可使用
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {scanner && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Barcode className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{scanner.name}</p>
                  <p className="text-sm text-muted-foreground">USB键盘模式</p>
                </div>
              </div>
              {renderStatusBadge(scanner.status)}
            </div>
          )}
          
          {!scanner && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-700">扫码枪使用说明</p>
                  <ul className="mt-2 space-y-1 text-blue-600">
                    <li>• USB扫码枪会自动识别为键盘设备</li>
                    <li>• 将光标放在输入框中，扫码即可输入</li>
                    <li>• 扫码结束后会自动触发Enter键</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>扫码测试</Label>
            <div className="flex gap-2">
              <Input
                placeholder="将光标放在这里，然后扫码..."
                value={scanResult}
                onChange={(e) => setScanResult(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={handleTestScanner} disabled={isTesting}>
                {isTesting ? '等待扫码...' : '开始测试'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            扫码设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>扫码语音播报</Label>
                <p className="text-sm text-muted-foreground">扫码成功后语音播报商品信息</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>支付码语音播报</Label>
                <p className="text-sm text-muted-foreground">扫码支付时语音提示</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>扫码后自动清空</Label>
                <p className="text-sm text-muted-foreground">扫码后自动清空输入框</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // 渲染电子秤设置面板
  const renderScaleSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            电子秤连接
          </CardTitle>
          <CardDescription>
            连接电子秤用于称重商品计价
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>串口</Label>
              <Select
                value={scaleSettings.port}
                onValueChange={(v) => setScaleSettings({ ...scaleSettings, port: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePorts.map((port) => (
                    <SelectItem key={port} value={port}>{port}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>波特率</Label>
              <Select
                value={String(scaleSettings.baudRate)}
                onValueChange={(v) => setScaleSettings({ ...scaleSettings, baudRate: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9600">9600</SelectItem>
                  <SelectItem value="19200">19200</SelectItem>
                  <SelectItem value="38400">38400</SelectItem>
                  <SelectItem value="57600">57600</SelectItem>
                  <SelectItem value="115200">115200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={handleConnectScale} disabled={isTesting}>
            {isTesting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Usb className="h-4 w-4 mr-2" />
            )}
            连接电子秤
          </Button>
          
          {weightResult !== null && (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">当前重量</span>
                <span className="text-2xl font-bold text-green-600">
                  {weightResult.toFixed(2)} {scaleSettings.unit === 'jin' ? '斤' : 'kg'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            电子秤设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>条码秤类型</Label>
            <Select
              value={scaleSettings.barcodeScaleType}
              onValueChange={(v) => setScaleSettings({ ...scaleSettings, barcodeScaleType: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不使用条码秤</SelectItem>
                <SelectItem value="tm-ab">大华TM-AB系列</SelectItem>
                <SelectItem value="tm-f">大华TM-F系列</SelectItem>
                <SelectItem value="ls2zx">顶尖LS2ZX系列</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              条码秤可以打印带有商品信息和条码的标签
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoTare">自动去皮</Label>
              <Switch
                id="autoTare"
                checked={scaleSettings.autoTare}
                onCheckedChange={(checked) => setScaleSettings({ ...scaleSettings, autoTare: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label>计重单位</Label>
              <Select
                value={scaleSettings.unit}
                onValueChange={(v) => setScaleSettings({ ...scaleSettings, unit: v as 'kg' | 'jin' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">公斤 (kg)</SelectItem>
                  <SelectItem value="jin">斤</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // 渲染钱箱设置面板
  const renderCashboxSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            钱箱控制
          </CardTitle>
          <CardDescription>
            钱箱通过打印机接口控制，需要先连接打印机
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">钱箱状态</p>
                  <p className="text-sm text-muted-foreground">
                    {printer ? '已连接打印机' : '未连接打印机'}
                  </p>
                </div>
              </div>
              <Badge variant={cashboxStatus === 'open' ? 'default' : 'outline'}>
                {cashboxStatus === 'open' ? '已打开' : '已关闭'}
              </Badge>
            </div>
            
            <Button
              onClick={handleOpenCashbox}
              disabled={isTesting}
              className="w-full"
            >
              <Power className="h-4 w-4 mr-2" />
              手动打开钱箱
            </Button>
            
            {!printer && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                当前为模拟模式（无打印机连接）
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            钱箱设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>启用钱箱</Label>
                <p className="text-sm text-muted-foreground">开启钱箱控制功能</p>
              </div>
              <Switch
                checked={cashboxSettings.enabled}
                onCheckedChange={(checked) => setCashboxSettings({ ...cashboxSettings, enabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>收款后自动打开</Label>
                <p className="text-sm text-muted-foreground">现金收款后自动弹开钱箱</p>
              </div>
              <Switch
                checked={cashboxSettings.autoOpen}
                onCheckedChange={(checked) => setCashboxSettings({ ...cashboxSettings, autoOpen: checked })}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>脉冲宽度 (ms)</Label>
              <Input
                type="number"
                value={cashboxSettings.pulseWidth}
                onChange={(e) => setCashboxSettings({ ...cashboxSettings, pulseWidth: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>打开延迟 (ms)</Label>
              <Input
                type="number"
                value={cashboxSettings.openDelay}
                onChange={(e) => setCashboxSettings({ ...cashboxSettings, openDelay: Number(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // 渲染客显屏设置面板
  const renderCustomerDisplaySettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            客显屏管理
          </CardTitle>
          <CardDescription>
            打开客显屏窗口，面向顾客展示购物信息和广告
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">客显屏窗口</p>
                <p className="text-sm text-muted-foreground">
                  点击按钮打开独立窗口，拖动到第二块屏幕
                </p>
              </div>
              <Button onClick={handleOpenCustomerDisplay}>
                <Monitor className="h-4 w-4 mr-2" />
                打开客显屏
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-700">使用说明</p>
                <ul className="mt-2 space-y-1 text-blue-600">
                  <li>• 客显屏会在独立窗口中打开</li>
                  <li>• 将窗口拖动到面向顾客的屏幕</li>
                  <li>• 收银时自动显示购物清单</li>
                  <li>• 空闲时自动播放广告内容</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            客显屏设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>启用客显屏</Label>
                <p className="text-sm text-muted-foreground">开启客显屏功能</p>
              </div>
              <Switch
                checked={customerDisplaySettings.enabled}
                onCheckedChange={(checked) => setCustomerDisplaySettings({ ...customerDisplaySettings, enabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>显示广告</Label>
                <p className="text-sm text-muted-foreground">空闲时播放广告内容</p>
              </div>
              <Switch
                checked={customerDisplaySettings.showAds}
                onCheckedChange={(checked) => setCustomerDisplaySettings({ ...customerDisplaySettings, showAds: checked })}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                广告音量: {customerDisplaySettings.volume}%
              </Label>
              <input
                type="range"
                min="0"
                max="100"
                value={customerDisplaySettings.volume}
                onChange={(e) => setCustomerDisplaySettings({ ...customerDisplaySettings, volume: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>屏幕亮度: {customerDisplaySettings.brightness}%</Label>
              <input
                type="range"
                min="30"
                max="100"
                value={customerDisplaySettings.brightness}
                onChange={(e) => setCustomerDisplaySettings({ ...customerDisplaySettings, brightness: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏占位 */}
      <div className="h-14" />
      
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex gap-6">
          {/* 左侧设备列表 */}
          <div className="w-48 shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-2 sticky top-20">
              <p className="text-sm font-medium text-muted-foreground px-3 py-2">设备类型</p>
              <div className="space-y-1">
                {[
                  { id: 'printer', name: '打印机', icon: Printer },
                  { id: 'scanner', name: '扫码枪', icon: Barcode },
                  { id: 'scale', name: '电子秤', icon: Scale },
                  { id: 'cashbox', name: '钱箱', icon: Wallet },
                  { id: 'customer-display', name: '客显屏', icon: Monitor },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveDevice(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                      activeDevice === item.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* 右侧设置区域 */}
          <div className="flex-1">
            {/* 保存提示 */}
            {saveMessage && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                <Check className="h-4 w-4" />
                {saveMessage}
              </div>
            )}
            
            {/* 硬件支持提示 */}
            {!isHardwareSupported() && (
              <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                部分硬件功能需要HTTPS或localhost环境才能使用
              </div>
            )}
            
            {/* 根据选中设备显示不同设置 */}
            {activeDevice === 'printer' && renderPrinterSettings()}
            {activeDevice === 'scanner' && renderScannerSettings()}
            {activeDevice === 'scale' && renderScaleSettings()}
            {activeDevice === 'cashbox' && renderCashboxSettings()}
            {activeDevice === 'customer-display' && renderCustomerDisplaySettings()}
          </div>
        </div>
      </div>
    </div>
  );
}
