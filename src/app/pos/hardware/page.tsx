'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Printer,
  Scale,
  Monitor,
  Camera,
  Box,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Wifi,
  Bluetooth,
  HardDrive,
  Scan,
  Cog,
  ChevronRight,
  AlertTriangle,
  Check,
  X,
  Loader2,
  Plug,
  Unplug,
  FileText,
  Tag,
  DollarSign,
  Usb,
  Zap,
  // 网络图标
  Network
} from 'lucide-react';

// 设备类型
type DeviceType = 'receipt_printer' | 'label_printer' | 'scale' | 'customer_display' | 'scanner' | 'cashbox' | 'ai_camera' | 'network';

// 设备连接状态
type DeviceStatus = 'connected' | 'disconnected' | 'error' | 'connecting';

// 连接方式
type ConnectionType = 'usb' | 'bluetooth' | 'serial' | 'network' | 'builtin' | 'printer';

// 设备接口类型
interface DeviceInterface {
  type: ConnectionType;
  name: string;
  description: string;
  icon: any;
}

interface DeviceConfig {
  type: DeviceType;
  name: string;
  icon: any;
  status: DeviceStatus;
  connectionType?: ConnectionType;
  detail?: string;
  interface?: ConnectionType;
  interfaces: DeviceInterface[];
  settings?: Record<string, any>;
}

// 收银机硬件接口说明
const HARDWARE_INTERFACES = {
  RS232: {
    name: 'RS232串口 (DB9/端子)',
    description: '通常1-2个，用于稳定连接称重模块',
    icon: HardDrive,
    devices: ['电子秤'],
  },
  USB: {
    name: 'USB接口 (4-6个)',
    description: 'USB 2.0/3.0，用于扫码枪、客显屏、键盘、鼠标、U盘等',
    icon: Usb,
    devices: ['条码扫描器', '顾客显示屏', 'USB读卡器', 'USB打印机'],
  },
  ETHERNET: {
    name: '以太网口 (RJ45)',
    description: '1个，用于有线网络接入、数据上传、远程管理',
    icon: Network,
    devices: ['网络打印机', '收银终端'],
  },
  CASHBOX: {
    name: '钱箱驱动接口 (RJ11)',
    description: '1个专用接口，通过ESC/POS指令控制钱箱弹开',
    icon: DollarSign,
    devices: ['钱箱'],
  },
  LVDS_EDP: {
    name: 'LVDS/eDP接口',
    description: '用于驱动内置客显屏（第二屏），实现主客屏异显',
    icon: Monitor,
    devices: ['顾客显示屏'],
  },
  BUILTIN_PRINTER: {
    name: '内置热敏打印机',
    description: '直接打印小票，省去外接打印机',
    icon: Printer,
    devices: ['小票打印机'],
  },
  BUILTIN_SCANNER: {
    name: '内置条码扫描引擎',
    description: '实现商品扫码，部分为可选配置',
    icon: Scan,
    devices: ['条码扫描器'],
  },
  TOUCH: {
    name: '触摸屏控制器',
    description: '集成在显示屏内部',
    icon: Settings,
    devices: ['触摸屏'],
  },
};

export default function HardwarePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'devices' | 'interfaces' | 'advanced'>('devices');
  const [devices, setDevices] = useState<DeviceConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState<string | null>(null);
  const [showInterfaceInfo, setShowInterfaceInfo] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<{
    online: boolean;
    type: string;
    signal?: number;
  }>({ online: true, type: 'ethernet' });

  // 初始化设备列表
  useEffect(() => {
    initializeDevices();
  }, []);

  const initializeDevices = () => {
    setDevices([
      {
        type: 'receipt_printer',
        name: '小票打印机',
        icon: Printer,
        status: 'connected',
        connectionType: 'usb',
        detail: '内置热敏打印机 80mm',
        interface: 'builtin',
        settings: { copies: 1, density: 3, autoCut: true },
        interfaces: [
          { type: 'builtin', name: '内置打印机', description: '热敏打印 80mm', icon: Printer },
          { type: 'usb', name: 'USB', description: 'USB 2.0/3.0', icon: Usb },
          { type: 'bluetooth', name: '蓝牙', description: '蓝牙 4.0+', icon: Bluetooth },
          { type: 'network', name: '网络', description: '以太网 TCP/IP', icon: Network },
        ],
      },
      {
        type: 'label_printer',
        name: '标签打印机',
        icon: Tag,
        status: 'disconnected',
        interface: 'usb',
        settings: { width: 40, height: 30, copies: 1 },
        interfaces: [
          { type: 'usb', name: 'USB', description: 'USB 2.0', icon: Usb },
          { type: 'bluetooth', name: '蓝牙', description: '蓝牙打印', icon: Bluetooth },
          { type: 'serial', name: '串口', description: 'RS232 DB9', icon: HardDrive },
        ],
      },
      {
        type: 'scale',
        name: '电子秤',
        icon: Scale,
        status: 'disconnected',
        interface: 'serial',
        settings: { baudRate: 9600, protocol: 'OS2', dataBits: 8, stopBits: 1, parity: 'none' },
        interfaces: [
          { type: 'serial', name: 'RS232串口', description: 'DB9或端子排', icon: HardDrive },
          { type: 'usb', name: 'USB转串口', description: 'CH340/FTDI', icon: Usb },
        ],
      },
      {
        type: 'customer_display',
        name: '顾客显示屏',
        icon: Monitor,
        status: 'connected',
        connectionType: 'builtin',
        detail: 'LVDS/eDP 内置双屏',
        interface: 'builtin',
        interfaces: [
          { type: 'builtin', name: '内置客显', description: 'LVDS/eDP接口', icon: Monitor },
          { type: 'usb', name: 'USB客显', description: 'USB CDC虚拟串口', icon: Usb },
          { type: 'network', name: '网络客显', description: 'TCP/IP', icon: Network },
        ],
      },
      {
        type: 'scanner',
        name: '条码扫描器',
        icon: Scan,
        status: 'connected',
        connectionType: 'usb',
        detail: 'USB HID模式',
        interface: 'usb',
        interfaces: [
          { type: 'usb', name: 'USB HID', description: '即插即用', icon: Usb },
          { type: 'bluetooth', name: '蓝牙扫描器', description: '无线扫码', icon: Bluetooth },
          { type: 'builtin', name: '内置扫描引擎', description: 'MIPI/USB摄像头', icon: Scan },
        ],
      },
      {
        type: 'cashbox',
        name: '钱箱',
        icon: Box,
        status: 'connected',
        connectionType: 'printer',
        detail: '通过打印机触发 (RJ11)',
        interface: 'usb',
        interfaces: [
          { type: 'usb', name: 'USB钱箱', description: 'USB接口钱箱', icon: Usb },
          { type: 'serial', name: '串口钱箱', description: 'RS232控制', icon: HardDrive },
          { type: 'printer', name: '打印机接口', description: 'ESC/POS指令', icon: Printer },
        ],
      },
      {
        type: 'ai_camera',
        name: 'AI摄像头',
        icon: Camera,
        status: 'disconnected',
        interface: 'usb',
        settings: { recognitionMode: 'product', sensitivity: 0.8 },
        interfaces: [
          { type: 'usb', name: 'USB摄像头', description: 'UVC协议', icon: Usb },
          { type: 'builtin', name: '内置MIPI', description: 'MIPI CSI接口', icon: Camera },
        ],
      },
      {
        type: 'network',
        name: '网络连接',
        icon: Wifi,
        status: networkStatus.online ? 'connected' : 'disconnected',
        detail: networkStatus.online ? `已连接 (${networkStatus.type})` : '离线',
        interface: 'usb',
        interfaces: [
          { type: 'builtin', name: '以太网', description: 'RJ45 100M/1000M', icon: Network },
          { type: 'bluetooth', name: 'WiFi', description: '802.11 b/g/n/ac', icon: Wifi },
        ],
      },
    ]);
  };

  // 连接设备
  const connectDevice = async (device: DeviceConfig) => {
    setScanning(device.type);
    
    // 模拟连接过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setDevices(devices.map(d => {
      if (d.type === device.type) {
        return { ...d, status: 'connected' as DeviceStatus, connectionType: d.interface };
      }
      return d;
    }));
    setScanning(null);
  };

  // 断开设备
  const disconnectDevice = async (device: DeviceConfig) => {
    setDevices(devices.map(d => {
      if (d.type === device.type) {
        return { ...d, status: 'disconnected' as DeviceStatus, connectionType: undefined };
      }
      return d;
    }));
  };

  // 测试设备
  const testDevice = async (device: DeviceConfig) => {
    switch (device.type) {
      case 'receipt_printer':
        alert('正在打印测试页...');
        break;
      case 'label_printer':
        alert('正在打印标签测试页...');
        break;
      case 'scale':
        alert('正在读取秤数据...\n当前重量: 0.000 kg');
        break;
      case 'cashbox':
        alert('正在打开钱箱...');
        break;
      case 'customer_display':
        alert('正在刷新客显屏...');
        break;
      case 'ai_camera':
        alert('正在测试AI识别...');
        break;
      default:
        alert(`测试 ${device.name}...`);
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: DeviceStatus) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'connecting': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <XCircle className="w-5 h-5 text-slate-300" />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-700';
      case 'error': return 'bg-red-100 text-red-700';
      case 'connecting': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  // 获取状态文本
  const getStatusText = (status: DeviceStatus) => {
    switch (status) {
      case 'connected': return '已连接';
      case 'error': return '连接异常';
      case 'connecting': return '连接中...';
      default: return '未连接';
    }
  };

  // 获取连接类型图标
  const getConnectionIcon = (type?: ConnectionType) => {
    switch (type) {
      case 'usb': return <Usb className="w-4 h-4" />;
      case 'bluetooth': return <Bluetooth className="w-4 h-4" />;
      case 'serial': return <HardDrive className="w-4 h-4" />;
      case 'network': return <Network className="w-4 h-4" />;
      case 'builtin': return <Settings className="w-4 h-4" />;
      default: return null;
    }
  };

  // 获取接口图标
  const getInterfaceIcon = (interfaceKey: string) => {
    const info = HARDWARE_INTERFACES[interfaceKey as keyof typeof HARDWARE_INTERFACES];
    if (info) {
      const Icon = info.icon;
      return <Icon className="w-5 h-5 text-slate-600" />;
    }
    return <Cog className="w-5 h-5 text-slate-600" />;
  };

  const connectedCount = devices.filter(d => d.status === 'connected').length;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 头部 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 px-4 py-3">
          <button onClick={() => router.push('/pos')} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">硬件设置</h1>
        </div>
        
        {/* 标签页 */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex-1 py-3 text-sm font-medium text-center ${
              activeTab === 'devices' 
                ? 'text-orange-500 border-b-2 border-orange-500' 
                : 'text-slate-500'
            }`}
          >
            设备管理
          </button>
          <button
            onClick={() => setActiveTab('interfaces')}
            className={`flex-1 py-3 text-sm font-medium text-center ${
              activeTab === 'interfaces' 
                ? 'text-orange-500 border-b-2 border-orange-500' 
                : 'text-slate-500'
            }`}
          >
            接口说明
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex-1 py-3 text-sm font-medium text-center ${
              activeTab === 'advanced' 
                ? 'text-orange-500 border-b-2 border-orange-500' 
                : 'text-slate-500'
            }`}
          >
            高级设置
          </button>
        </div>
      </header>

      <main className="p-4">
        {activeTab === 'devices' && (
          <>
            {/* 设备概览 */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-5 text-white mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">设备状态</p>
                  <p className="text-3xl font-bold">{connectedCount}/{devices.length}</p>
                  <p className="text-orange-100 text-xs mt-1">
                    {connectedCount === devices.length ? '全部设备已就绪' : `${devices.length - connectedCount}个设备待连接`}
                  </p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Settings className="w-8 h-8" />
                </div>
              </div>
              
              {/* 连接状态指示 */}
              <div className="mt-4 flex flex-wrap gap-2">
                {devices.map(d => {
                  const Icon = d.icon;
                  return (
                    <div 
                      key={d.type}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                        d.status === 'connected' ? 'bg-white/20' : 'bg-black/20'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{d.name}</span>
                      {d.status === 'connected' ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 设备列表 */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
              {devices.map((device) => {
                const Icon = device.icon;
                const isScanning = scanning === device.type;
                
                return (
                  <div key={device.type} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                        device.status === 'connected' ? 'bg-green-100' : 
                        device.status === 'error' ? 'bg-red-100' : 'bg-slate-100'
                      }`}>
                        <Icon className={`w-7 h-7 ${
                          device.status === 'connected' ? 'text-green-600' : 
                          device.status === 'error' ? 'text-red-600' : 'text-slate-400'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800">{device.name}</h3>
                          {getStatusIcon(device.status)}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(device.status)}`}>
                            {getStatusText(device.status)}
                          </span>
                          {device.connectionType && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              {getConnectionIcon(device.connectionType)}
                              {device.connectionType === 'builtin' ? '内置' : 
                               device.connectionType === 'usb' ? 'USB' :
                               device.connectionType === 'bluetooth' ? '蓝牙' :
                               device.connectionType === 'serial' ? '串口' : '网络'}
                            </span>
                          )}
                        </div>
                        {device.detail && (
                          <p className="text-xs text-slate-500 mt-1">{device.detail}</p>
                        )}
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="flex gap-2">
                        {device.status === 'connected' ? (
                          <>
                            <button 
                              onClick={() => testDevice(device)}
                              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm flex items-center gap-1"
                            >
                              <Zap className="w-4 h-4" />
                              测试
                            </button>
                            <button 
                              onClick={() => disconnectDevice(device)}
                              className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm"
                            >
                              <Unplug className="w-4 h-4" />
                            </button>
                          </>
                        ) : device.status === 'connecting' ? (
                          <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 rounded-lg text-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            连接中
                          </button>
                        ) : (
                          <button 
                            onClick={() => connectDevice(device)}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm flex items-center gap-1"
                          >
                            <Plug className="w-4 h-4" />
                            连接
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* 接口选择 */}
                    {device.status !== 'connected' && device.interfaces.length > 1 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-2">选择连接方式:</p>
                        <div className="flex flex-wrap gap-2">
                          {device.interfaces.map(iface => {
                            const Icon = iface.icon;
                            return (
                              <button
                                key={iface.type}
                                onClick={() => {
                                  setDevices(devices.map(d => 
                                    d.type === device.type ? { ...d, interface: iface.type } : d
                                  ));
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${
                                  device.interface === iface.type 
                                    ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                                    : 'bg-slate-100 text-slate-600 border border-transparent'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {iface.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'interfaces' && (
          <>
            {/* 接口说明标题 */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-400 rounded-2xl p-5 text-white mb-6">
              <h2 className="text-xl font-bold mb-2">收银机硬件接口说明</h2>
              <p className="text-blue-100 text-sm">
                了解收银机各硬件接口的用途和所支持的设备类型
              </p>
            </div>

            {/* 接口列表 */}
            <div className="space-y-4">
              {Object.entries(HARDWARE_INTERFACES).map(([key, info]) => {
                const Icon = info.icon;
                return (
                  <div key={key} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800">{info.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">{info.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {info.devices.map((device, i) => (
                            <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                              {device}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 接口汇总表 */}
            <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-slate-800">接口与设备对照表</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-3 font-medium text-slate-600">接口类型</th>
                      <th className="text-left p-3 font-medium text-slate-600">支持设备</th>
                      <th className="text-left p-3 font-medium text-slate-600">数量</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 text-slate-800">RS232串口 (DB9/端子)</td>
                      <td className="p-3 text-slate-600">电子秤、钱箱(串口)</td>
                      <td className="p-3 text-slate-600">1-2个</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-800">USB接口</td>
                      <td className="p-3 text-slate-600">扫码枪、客显屏、键盘、鼠标、U盘、读卡器、打印机</td>
                      <td className="p-3 text-slate-600">4-6个</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-800">以太网口 (RJ45)</td>
                      <td className="p-3 text-slate-600">网络打印机、收银终端</td>
                      <td className="p-3 text-slate-600">1个</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-800">钱箱接口 (RJ11)</td>
                      <td className="p-3 text-slate-600">钱箱 (ESC/POS指令)</td>
                      <td className="p-3 text-slate-600">1个</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-800">LVDS/eDP接口</td>
                      <td className="p-3 text-slate-600">内置客显屏</td>
                      <td className="p-3 text-slate-600">1个</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-800">内置热敏打印机</td>
                      <td className="p-3 text-slate-600">小票打印</td>
                      <td className="p-3 text-slate-600">可选</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-800">内置条码扫描引擎</td>
                      <td className="p-3 text-slate-600">商品扫码</td>
                      <td className="p-3 text-slate-600">可选</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'advanced' && (
          <>
            {/* 高级设置 */}
            <div className="space-y-4">
              {/* 打印机设置 */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Printer className="w-5 h-5 text-slate-600" />
                    <h3 className="font-bold text-slate-800">小票打印机设置</h3>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">已连接</span>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-slate-700">打印联数</span>
                      <p className="text-xs text-slate-500">连续打印的小票份数</p>
                    </div>
                    <select className="p-2 bg-slate-100 rounded-lg">
                      <option>1联</option>
                      <option selected>2联</option>
                      <option>3联</option>
                    </select>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-slate-700">打印浓度</span>
                      <p className="text-xs text-slate-500">调整打印深浅程度</p>
                    </div>
                    <select className="p-2 bg-slate-100 rounded-lg">
                      <option>淡</option>
                      <option selected>中</option>
                      <option>浓</option>
                    </select>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-slate-700">自动切纸</span>
                      <p className="text-xs text-slate-500">打印完成后自动切纸</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-slate-700">纸宽选择</span>
                      <p className="text-xs text-slate-500">热敏纸宽度</p>
                    </div>
                    <select className="p-2 bg-slate-100 rounded-lg">
                      <option>58mm</option>
                      <option selected>80mm</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 标签打印机设置 */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-slate-600" />
                    <h3 className="font-bold text-slate-800">标签打印机设置</h3>
                  </div>
                  <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs">未连接</span>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-slate-700">标签尺寸</span>
                      <p className="text-xs text-slate-500">标签纸宽 x 高 (mm)</p>
                    </div>
                    <select className="p-2 bg-slate-100 rounded-lg">
                      <option selected>40 x 30</option>
                      <option>50 x 30</option>
                      <option>60 x 40</option>
                      <option>70 x 50</option>
                    </select>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-slate-700">黑标检测</span>
                      <p className="text-xs text-slate-500">启用黑标定位</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* 电子秤设置 */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Scale className="w-5 h-5 text-slate-600" />
                    <h3 className="font-bold text-slate-800">电子秤设置</h3>
                  </div>
                  <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs">未连接</span>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-slate-700">串口波特率</span>
                      <p className="text-xs text-slate-500">RS232通信速率</p>
                    </div>
                    <select className="p-2 bg-slate-100 rounded-lg">
                      <option>1200</option>
                      <option>2400</option>
                      <option>4800</option>
                      <option selected>9600</option>
                      <option>19200</option>
                      <option>38400</option>
                    </select>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-slate-700">通信协议</span>
                      <p className="text-xs text-slate-500">电子秤通信协议</p>
                    </div>
                    <select className="p-2 bg-slate-100 rounded-lg">
                      <option>自动检测</option>
                      <option selected>顶尖OS2</option>
                      <option>顶尖OS3</option>
                      <option>大华</option>
                      <option>迪宝</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 快捷操作 */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800">快捷操作</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Box className="w-5 h-5 text-orange-500" />
                      <span className="text-slate-700">打开钱箱</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                  <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Printer className="w-5 h-5 text-blue-500" />
                      <span className="text-slate-700">打印测试页</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                  <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-green-500" />
                      <span className="text-slate-700">打印标签样张</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                  <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-purple-500" />
                      <span className="text-slate-700">重新检测设备</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 提示信息 */}
        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <h4 className="font-bold text-amber-700 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            使用提示
          </h4>
          <ul className="text-sm text-amber-600 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>RS232串口（DB9/端子）用于稳定连接称重模块，是获取重量数据的关键通道</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>USB接口通常4-6个，用于连接扫码枪、顾客显示屏、键盘、鼠标、U盘等</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>钱箱通过RJ11接口连接，使用ESC/POS指令控制弹开</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>客显屏通过LVDS/eDP接口实现双屏异显</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
              <span>扫码枪建议设置为USB HID模式，支持即插即用</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
