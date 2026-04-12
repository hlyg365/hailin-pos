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
  Cashbox,
  getDebugInfo,
  type ScaleDevice,
  type PrinterDevice,
  type UsbDevice,
  BAUD_RATES,
  SCALE_PROTOCOLS,
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
  Settings2,
  Zap,
} from 'lucide-react';

// 串口设备类型
interface SerialPort {
  path: string;
  name: string;
  type: string;
  description: string;
  readable?: boolean;
  writable?: boolean;
}

// 钱箱设备类型
interface CashboxDevice {
  name: string;
  path: string;
  type: 'usb' | 'serial' | 'printer';
  interface: string;
  description: string;
}

// 设备类型定义
interface DeviceInfo {
  id: string;
  name: string;
  type: 'scale' | 'printer' | 'cashbox' | 'display';
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  address?: string;
  portType?: 'usb' | 'serial' | 'bluetooth' | 'printer';
  baudRate?: number;
  protocol?: string;
  lastConnected?: Date;
  error?: string;
}

// 保存的设备配置
interface SavedDeviceConfig {
  scales: Array<{
    address: string;
    name: string;
    portType: string;
    baudRate: number;
    protocol: string;
    lastUsed: Date;
  }>;
  printers: Array<{ address: string; name: string; lastUsed: Date }>;
  cashboxes: Array<{ address: string; name: string; interface: string; lastUsed: Date }>;
  autoConnect: boolean;
}

const STORAGE_KEY = 'hardware_device_config';

// 常用波特率
const DEFAULT_BAUD_RATES = BAUD_RATES;

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
  const [availableSerialPorts, setAvailableSerialPorts] = useState<SerialPort[]>([]);
  const [availableUsbDevices, setAvailableUsbDevices] = useState<UsbDevice[]>([]);
  const [availableCashboxes, setAvailableCashboxes] = useState<CashboxDevice[]>([]);
  
  // 波特率选择
  const [selectedBaudRate, setSelectedBaudRate] = useState(9600);
  
  // 协议选择
  const [selectedProtocol, setSelectedProtocol] = useState('OS2');
  
  // 连接中状态
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  
  // 测试结果
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  
  // 设备变化监听
  const [deviceChangeCount, setDeviceChangeCount] = useState(0);
  
  // 自动重连状态
  const [autoReconnect, setAutoReconnect] = useState(true);
  
  // 当前连接信息
  const [connectionInfo, setConnectionInfo] = useState<{
    mode?: string;
    protocol?: string;
    baudRate?: number;
  }>({});
  
  // 保存的配置
  const [savedConfig, setSavedConfig] = useState<SavedDeviceConfig>({
    scales: [],
    printers: [],
    cashboxes: [],
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
            // 获取真实设备信息
            const realDevices = [...(availableScales || []), ...(availableSerialPorts || []).map(sp => ({ name: sp.name || sp.path, address: sp.path }))];
            const connectedScale = realDevices.find(d => 
              d.address === scaleStatus.address || 
              (d as any).path === scaleStatus.address
            );
            return {
              ...prev,
              scale: {
                id: scaleStatus.address || `scale-${Date.now()}`,
                name: connectedScale?.name || scaleStatus.name || scaleStatus.deviceName || '电子秤',
                type: 'scale',
                status: 'connected',
                address: scaleStatus.address || scaleStatus.device,
                portType: scaleStatus.mode as 'usb' | 'serial' | 'bluetooth' || 'serial',
                baudRate: scaleStatus.baudRate || 9600,
                protocol: scaleStatus.protocol || selectedProtocol,
                lastConnected: new Date(),
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
        const rawCashboxStatus = printerStatus.connected && Cashbox ? await Cashbox.getStatus() : null;
        const cashboxStatus = rawCashboxStatus || { connected: false, drawerOpen: false, hasDevice: false };
        
        setDevices(prev => {
          if (printerStatus.connected && !prev.printer) {
            console.log('[Hardware] Printer auto-connected');
            // 获取真实打印机设备信息
            const connectedPrinter = availablePrinters?.find(p => 
              p.address === printerStatus.address || 
              p.name === printerStatus.printerName
            );
            
            return {
              ...prev,
              printer: {
                id: printerStatus.address || `printer-${Date.now()}`,
                name: connectedPrinter?.name || printerStatus.printerName || printerStatus.name || '小票打印机',
                type: 'printer',
                status: 'connected',
                address: printerStatus.address,
                lastConnected: new Date(),
              },
              cashbox: cashboxStatus.connected ? {
                id: `cashbox-${Date.now()}`,
                name: cashboxStatus.deviceName || '钱箱',
                type: 'cashbox' as const,
                status: 'connected',
                address: cashboxStatus.address || printerStatus.address || 'via-printer',
                portType: cashboxStatus.mode as 'usb' | 'serial' | 'bluetooth' | 'printer' || 'printer',
              } : (prev.cashbox?.status === 'connected' ? prev.cashbox : null),
            };
          } else if (!printerStatus.connected && prev.printer && prev.printer.status === 'connected') {
            console.log('[Hardware] Printer disconnected');
            return {
              ...prev,
              printer: prev.printer ? { ...prev.printer, status: 'disconnected' } : null,
              cashbox: { id: prev.cashbox?.id || 'cashbox-1', name: prev.cashbox?.name || '钱箱', type: 'cashbox' as const, status: 'disconnected', address: prev.cashbox?.address },
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
      // 检测电子秤（包括串口和USB）
      await detectScales();
      
      // 检测打印机
      await detectPrinters();
      
      // 检测钱箱
      await detectCashboxes();
      
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
      // 获取串口列表和USB设备
      const serialInfo = await Scale.listSerialPorts();
      setAvailableSerialPorts(serialInfo.serialPorts || []);
      setAvailableUsbDevices(serialInfo.usbDevices || []);
      console.log('[Hardware] Found serial ports:', serialInfo.serialPorts);
      console.log('[Hardware] Found USB devices:', serialInfo.usbDevices);
      
      // 获取USB电子秤设备
      const scales = await Scale.listDevices();
      setAvailableScales(scales);
      console.log('[Hardware] Found scales:', scales.length);
      
      // 合并设备列表
      const allDevices = [
        ...(serialInfo.serialPorts || []).map(sp => ({
          name: `${sp.name} (${sp.type})`,
          address: sp.path,
          portType: 'serial' as const,
          description: sp.description,
        })),
        ...(scales.map(s => ({
          name: s.name,
          address: s.address,
          portType: 'usb' as const,
        }))),
      ];
      
      // 检查是否已连接
      const status = await Scale.getStatus();
      if (status.connected) {
        const connectedDevice = allDevices.find(d => 
          d.address === devices.scale?.address
        );
        setDevices(prev => ({
          ...prev,
          scale: {
            id: connectedDevice?.address || 'scale-1',
            name: connectedDevice?.name || '电子秤',
            type: 'scale',
            status: 'connected',
            address: connectedDevice?.address,
            portType: connectedDevice?.portType || 'serial',
            baudRate: status.baudRate || selectedBaudRate,
            protocol: status.protocol || selectedProtocol,
            lastConnected: new Date(),
          },
        }));
        setConnectionInfo({
          mode: status.mode,
          protocol: status.protocol,
          baudRate: status.baudRate,
        });
      } else {
        // 尝试从保存的配置自动连接
        if (savedConfig.autoConnect && savedConfig.scales.length > 0) {
          const lastUsed = savedConfig.scales[0];
          const scale = allDevices.find(d => d.address === lastUsed.address);
          if (scale) {
            console.log('[Hardware] Auto-connecting to saved scale:', scale.name);
            setSelectedBaudRate(lastUsed.baudRate);
            setSelectedProtocol(lastUsed.protocol);
            await handleConnectScaleWithConfig(scale as any);
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
        const connectedPrinter = printers.find(p => 
          p.address === status.address || 
          p.name === status.printerName
        );
        setDevices(prev => ({
          ...prev,
          printer: {
            id: status.address || connectedPrinter?.address || `printer-${Date.now()}`,
            name: connectedPrinter?.name || status.printerName || '小票打印机',
            type: 'printer',
            status: 'connected',
            address: status.address || connectedPrinter?.address,
            lastConnected: new Date(),
          },
          cashbox: {
            id: prev.cashbox?.id || `cashbox-${Date.now()}`,
            name: prev.cashbox?.name || '钱箱',
            type: 'cashbox',
            status: 'connected',
            address: status.address || 'via-printer',
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
      const result = await CustomerDisplay.getDisplays();
      const displays = result.displays || [];
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

  // 检测钱箱设备
  const detectCashboxes = async () => {
    try {
      const cashboxes = await Cashbox.listDevices();
      // 规范化类型
      const normalizedBoxes: CashboxDevice[] = cashboxes.map(c => ({
        name: c.name,
        path: c.path,
        type: (c.type || 'printer') as 'usb' | 'serial' | 'printer',
        interface: c.interface || 'ESC/POS',
        description: c.description || '',
      }));
      setAvailableCashboxes(normalizedBoxes);
      console.log('[Hardware] Found cashboxes:', normalizedBoxes.length);
      
      // 检查钱箱状态
      const status = await Cashbox.getStatus();
      if (status.connected) {
        // 获取真实钱箱设备信息
        const connectedBox = normalizedBoxes.find(c => 
          c.path === status.address || 
          c.name.toLowerCase().includes('cash') ||
          c.name.toLowerCase().includes('drawer')
        );
        setDevices(prev => ({
          ...prev,
          cashbox: {
            id: status.address || connectedBox?.path || `cashbox-${Date.now()}`,
            name: connectedBox?.name || status.deviceName || `钱箱 (${status.interface || 'USB'})`,
            type: 'cashbox',
            status: 'connected',
            address: status.address || connectedBox?.path,
            portType: connectedBox?.type as 'usb' | 'serial' | 'printer' || 'printer',
          },
        }));
      }
    } catch (e) {
      console.error('[Hardware] Detect cashboxes error:', e);
    }
  };

  // 连接电子秤（带配置保存）
  const handleConnectScaleWithConfig = async (scale?: { name: string; address: string; portType?: string }) => {
    const targetScale = scale || (availableScales.length > 0 ? {
      name: availableScales[0].name,
      address: availableScales[0].address,
      portType: 'usb' as string,
    } : availableSerialPorts.length > 0 ? {
      name: availableSerialPorts[0].name,
      address: availableSerialPorts[0].path,
      portType: 'serial' as string,
    } : null);
    
    if (!targetScale) {
      setTestResult({ success: false, message: '未检测到电子秤设备，请先刷新设备列表' });
      return;
    }

    setIsConnecting('scale');
    setTestResult(null);
    
    try {
      const result = await Scale.connect({ 
        port: targetScale.address,
        baudRate: selectedBaudRate,
        protocol: selectedProtocol,
      });
      
      if (result.success) {
        // 保存到配置
        const newConfig = {
          ...savedConfig,
          scales: [
            { 
              address: targetScale.address, 
              name: targetScale.name, 
              portType: targetScale.portType || 'serial', 
              baudRate: result.baudRate || selectedBaudRate,
              protocol: result.protocol || selectedProtocol,
              lastUsed: new Date() 
            },
            ...savedConfig.scales.filter(s => s.address !== targetScale.address).slice(0, 4),
          ],
        };
        saveConfig(newConfig);
        
        // 获取最新状态
        const status = await Scale.getStatus();
        
        setDevices(prev => ({
          ...prev,
          scale: {
            id: targetScale.address,
            name: targetScale.name,
            type: 'scale',
            status: 'connected',
            address: targetScale.address,
            portType: targetScale.portType as any || 'serial',
            baudRate: result.baudRate || selectedBaudRate,
            protocol: result.protocol || selectedProtocol,
            lastConnected: new Date(),
          },
        }));
        
        setConnectionInfo({
          mode: result.mode,
          protocol: result.protocol || selectedProtocol,
          baudRate: result.baudRate || selectedBaudRate,
        });
        
        let message = `已连接: ${targetScale.name}`;
        if (result.detectedBaudRate) {
          message += ` (自动检测波特率: ${result.detectedBaudRate})`;
        }
        message += ` [${result.protocol || selectedProtocol}]`;
        
        setTestResult({ success: true, message });
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
            id: `cashbox-${printer.address}`,
            name: `钱箱 (via ${printer.name})`,
            type: 'cashbox',
            status: 'connected',
            address: printer.address,
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

  // 打开钱箱（支持打印机模式和钱箱模式）
  const handleOpenCashbox = async () => {
    setTestLoading(true);
    setTestResult(null);
    
    try {
      // 优先使用独立钱箱接口
      if (devices.cashbox?.status === 'connected' && devices.cashbox) {
        const result = await Cashbox.open(0);
        setTestResult({
          success: result.success,
          message: result.success ? '钱箱已打开' : (result.message || '打开失败'),
        });
      } else if (devices.printer) {
        // 通过打印机控制钱箱
        const result = await Printer.openCashbox();
        setTestResult({
          success: result.success,
          message: result.success ? '钱箱已打开（打印机模式）' : (result.message || '打开失败'),
        });
      } else {
        // 尝试直接打开
        const result = await Cashbox.open(0);
        setTestResult({
          success: result.success,
          message: result.success ? '钱箱已打开' : (result.message || '打开失败'),
        });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || '打开失败' });
    } finally {
      setTestLoading(false);
    }
  };

  // 连接钱箱
  const handleConnectCashbox = async (cashbox?: CashboxDevice) => {
    const targetBox = cashbox || availableCashboxes[0];
    if (!targetBox) return;

    setIsConnecting('cashbox');
    setTestResult(null);
    
    try {
      const result = await Cashbox.connect(targetBox.path);
      
      if (result.success) {
        // 保存到配置
        const newConfig = {
          ...savedConfig,
          cashboxes: [
            { address: targetBox.path, name: targetBox.name, interface: targetBox.interface, lastUsed: new Date() },
            ...savedConfig.cashboxes.filter(c => c.address !== targetBox.path).slice(0, 4),
          ],
        };
        saveConfig(newConfig);
        
        setDevices(prev => ({
          ...prev,
          cashbox: {
            id: targetBox.path,
            name: targetBox.name,
            type: 'cashbox',
            status: 'connected',
            address: targetBox.path,
            lastConnected: new Date(),
          },
        }));
        setTestResult({ success: true, message: `钱箱已连接: ${targetBox.name}` });
      } else {
        setTestResult({ success: false, message: result.message || '连接失败' });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || '连接失败' });
    } finally {
      setIsConnecting(null);
    }
  };

  // 断开钱箱
  const handleDisconnectCashbox = async () => {
    await Cashbox.disconnect();
    setDevices(prev => ({ ...prev, cashbox: null }));
    setTestResult({ success: true, message: '钱箱已断开' });
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
      const displayResult = await CustomerDisplay.getDisplays();
	      const displays = displayResult.displays || [];
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
                  <CardDescription>支持 RS232 串口和多种协议</CardDescription>
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
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {devices.scale.name}
                        {devices.scale.lastConnected && (
                          <span className="text-xs text-gray-500">
                            {formatTime(devices.scale.lastConnected)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span className="flex items-center gap-1">
                          <Plug className="h-3 w-3" />
                          {devices.scale.portType === 'serial' ? '串口' : 'USB'}: {devices.scale.address || '未知'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          协议: {devices.scale.protocol || selectedProtocol}
                        </span>
                        <span className="flex items-center gap-1">
                          <Settings2 className="h-3 w-3" />
                          {devices.scale.baudRate || selectedBaudRate} bps
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDisconnectScale}>
                      断开
                    </Button>
                  </div>
                </div>
              ) : null}
              
              {/* 连接参数设置 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-sm text-gray-500 font-medium flex items-center gap-1">
                    <Settings2 className="h-3 w-3" />
                    波特率
                  </label>
                  <select
                    className="w-full p-2 border rounded-lg text-sm"
                    value={selectedBaudRate}
                    onChange={(e) => setSelectedBaudRate(Number(e.target.value))}
                    disabled={devices.scale?.status === 'connected'}
                  >
                    {DEFAULT_BAUD_RATES.map(rate => (
                      <option key={rate} value={rate}>{rate} bps</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm text-gray-500 font-medium flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    协议
                  </label>
                  <select
                    className="w-full p-2 border rounded-lg text-sm"
                    value={selectedProtocol}
                    onChange={(e) => setSelectedProtocol(e.target.value)}
                    disabled={devices.scale?.status === 'connected'}
                  >
                    {SCALE_PROTOCOLS.map(p => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* 协议说明 */}
              {selectedProtocol !== 'AUTO' && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  {SCALE_PROTOCOLS.find(p => p.code === selectedProtocol)?.description || ''}
                </div>
              )}
              
              {/* 可用设备列表 */}
              {availableSerialPorts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 font-medium">
                    RS232 串口 ({availableSerialPorts.length})
                  </div>
                  {availableSerialPorts.map((port, index) => (
                    <div
                      key={`serial-${index}`}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        devices.scale?.address === port.path
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium flex items-center gap-2">
                          <Plug className="h-4 w-4 text-gray-400" />
                          {port.name}
                        </span>
                        <span className="text-xs text-gray-500">{port.description}</span>
                      </div>
                      {devices.scale?.address === port.path ? (
                        <Badge variant="outline" className="bg-green-50">已连接</Badge>
                      ) : (
                        <Button size="sm" onClick={() => handleConnectScaleWithConfig({
                          name: port.name,
                          address: port.path,
                          portType: 'serial',
                        })}>
                          连接
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* USB设备列表 */}
              {availableScales.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 font-medium">
                    USB 设备 ({availableScales.length})
                  </div>
                  {availableScales.map((scale, index) => (
                    <div
                      key={`usb-${index}`}
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
                        <Button size="sm" onClick={() => handleConnectScaleWithConfig({
                          name: scale.name,
                          address: scale.address,
                          portType: 'usb',
                        })}>
                          连接
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {availableSerialPorts.length === 0 && availableScales.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  未检测到电子秤设备
                </p>
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
                variant="outline"
                className="w-full"
                onClick={async () => {
                  try {
                    const result = await CustomerDisplay.getDisplays();
                    const displayCount = result.count || 0;
                    const isDual = result.isDualScreen;
                    
                    let message = `检测到 ${displayCount} 个显示器\n`;
                    message += `双屏模式: ${isDual ? '已启用' : '未启用'}\n\n`;
                    
                    if (result.displays && result.displays.length > 0) {
                      message += '显示器列表:\n';
                      result.displays.forEach((d, i) => {
                        message += `${i + 1}. ${d.name} ${d.isPrimary ? '(主屏)' : '(副屏)'}\n`;
                      });
                    }
                    
                    message += '\n提示: ';
                    if (displayCount <= 1) {
                      message += '如果只检测到1个显示器，请检查:\n';
                      message += '1. 收银机是否支持双屏输出\n';
                      message += '2. HDMI/外接显示器是否已连接\n';
                      message += '3. 外接显示器是否已开启';
                    } else {
                      message += '双屏硬件已就绪，可以正常使用';
                    }
                    
                    alert(message);
                  } catch (e: any) {
                    alert('检测失败: ' + e.message);
                  }
                }}
              >
                检测显示器
              </Button>
              
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
                  <CardDescription>RJ11/RJ12 接口或打印机端口</CardDescription>
                </div>
              </div>
              {renderStatusBadge(devices.cashbox?.status || 'disconnected')}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devices.cashbox ? (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {devices.cashbox.name}
                        {devices.cashbox.lastConnected && (
                          <span className="text-xs text-gray-500">
                            {formatTime(devices.cashbox.lastConnected)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span className="flex items-center gap-1">
                          <Plug className="h-3 w-3" />
                          接口: {devices.cashbox.address || '未知'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Settings2 className="h-3 w-3" />
                          类型: {devices.cashbox.portType === 'serial' ? 'RJ11/RJ12串口' : devices.cashbox.portType === 'usb' ? 'USB' : '打印机'}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDisconnectCashbox}>
                      断开
                    </Button>
                  </div>
                </div>
              ) : null}
              
              {/* 可用钱箱设备列表 */}
              {availableCashboxes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 font-medium">
                    可用接口 ({availableCashboxes.length})
                  </div>
                  {availableCashboxes.map((box, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        devices.cashbox?.address === box.path
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{box.name}</span>
                        <span className="text-xs text-gray-500">
                          {box.interface} - {box.description}
                        </span>
                      </div>
                      {devices.cashbox?.address === box.path ? (
                        <Badge variant="outline" className="bg-green-50">已连接</Badge>
                      ) : (
                        <Button size="sm" onClick={() => handleConnectCashbox(box)}>
                          连接
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <Button
                className="w-full"
                onClick={handleOpenCashbox}
                disabled={(!devices.cashbox && !devices.printer) || testLoading}
              >
                {testLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Power className="h-4 w-4 mr-2" />
                )}
                打开钱箱
              </Button>
              {!devices.cashbox && !devices.printer && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  请先连接钱箱或打印机以控制钱箱
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
