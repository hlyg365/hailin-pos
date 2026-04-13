'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Printer,
  Scale,
  Monitor,
  Camera,
  CreditCard,
  Box,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Wifi,
  Bluetooth
} from 'lucide-react';

interface DeviceStatus {
  name: string;
  type: 'printer' | 'scale' | 'display' | 'camera' | 'cashbox' | 'scanner';
  status: 'connected' | 'disconnected' | 'error';
  icon: any;
  detail?: string;
}

export default function HardwarePage() {
  const router = useRouter();
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    loadDeviceStatus();
  }, []);

  const loadDeviceStatus = () => {
    // 模拟设备状态
    const mockDevices: DeviceStatus[] = [
      { name: '小票打印机', type: 'printer', status: 'connected', icon: Printer, detail: 'USB: COM3' },
      { name: '电子秤', type: 'scale', status: 'disconnected', icon: Scale },
      { name: '客显屏', type: 'display', status: 'connected', icon: Monitor, detail: '双屏异显' },
      { name: 'AI摄像头', type: 'camera', status: 'disconnected', icon: Camera },
      { name: '钱箱', type: 'cashbox', status: 'connected', icon: Box, detail: '通过打印机触发' },
      { name: '扫码枪', type: 'scanner', status: 'connected', icon: Settings, detail: 'USB HID模式' },
    ];
    setDevices(mockDevices);
  };

  const connectDevice = async (type: DeviceStatus['type']) => {
    setScanning(true);
    // 模拟连接过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setDevices(devices.map(d => {
      if (d.type === type) {
        return { ...d, status: 'connected' as const };
      }
      return d;
    }));
    setScanning(false);
  };

  const testPrint = async () => {
    alert('正在打印测试页...');
  };

  const testScale = async () => {
    alert('正在读取秤数据...');
  };

  const testCashbox = async () => {
    alert('正在打开钱箱...');
  };

  const getStatusIcon = (status: DeviceStatus['status']) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <XCircle className="w-5 h-5 text-slate-300" />;
    }
  };

  const getStatusText = (status: DeviceStatus['status']) => {
    switch (status) {
      case 'connected': return '已连接';
      case 'error': return '连接异常';
      default: return '未连接';
    }
  };

  const getActionButton = (device: DeviceStatus) => {
    if (device.status === 'disconnected') {
      return (
        <button 
          onClick={() => connectDevice(device.type)}
          disabled={scanning}
          className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm"
        >
          {scanning ? '连接中...' : '连接'}
        </button>
      );
    }
    switch (device.type) {
      case 'printer':
        return (
          <button onClick={testPrint} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm">
            测试打印
          </button>
        );
      case 'scale':
        return (
          <button onClick={testScale} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm">
            测试称重
          </button>
        );
      case 'cashbox':
        return (
          <button onClick={testCashbox} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm">
            测试开箱
          </button>
        );
      default:
        return null;
    }
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
      </header>

      <main className="p-4">
        {/* 设备概览 */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-5 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">设备状态</p>
              <p className="text-3xl font-bold">{connectedCount}/{devices.length}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Settings className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* 设备列表 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {devices.map((device, index) => {
            const Icon = device.icon;
            return (
              <div 
                key={device.type}
                className={`p-4 ${index > 0 ? 'border-t border-slate-100' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    device.status === 'connected' ? 'bg-green-100' : 
                    device.status === 'error' ? 'bg-red-100' : 'bg-slate-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      device.status === 'connected' ? 'text-green-600' : 
                      device.status === 'error' ? 'text-red-600' : 'text-slate-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">{device.name}</h3>
                      {getStatusIcon(device.status)}
                    </div>
                    <p className="text-sm text-slate-500">
                      {getStatusText(device.status)}
                      {device.detail && ` · ${device.detail}`}
                    </p>
                  </div>
                  {getActionButton(device)}
                </div>
              </div>
            );
          })}
        </div>

        {/* 连接方式 */}
        <div className="mt-6">
          <h3 className="font-bold text-slate-800 mb-3">连接方式</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Wifi className="w-6 h-6 text-blue-500" />
              </div>
              <p className="font-medium text-slate-800">网络连接</p>
              <p className="text-xs text-slate-500 mt-1">通过局域网连接设备</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Bluetooth className="w-6 h-6 text-purple-500" />
              </div>
              <p className="font-medium text-slate-800">蓝牙连接</p>
              <p className="text-xs text-slate-500 mt-1">通过蓝牙配对设备</p>
            </div>
          </div>
        </div>

        {/* USB设备 */}
        <div className="mt-6">
          <h3 className="font-bold text-slate-800 mb-3">USB设备</h3>
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Printer className="w-6 h-6 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-800">USB打印机</p>
                  <p className="text-sm text-slate-500">USB</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">已识别</span>
            </div>
          </div>
        </div>

        {/* 提示 */}
        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <h4 className="font-bold text-amber-700 mb-2">使用提示</h4>
          <ul className="text-sm text-amber-600 space-y-1">
            <li>• 小票打印机使用ESC/POS协议</li>
            <li>• AI摄像头用于商品识别</li>
            <li>• 电子秤需支持串口通信</li>
            <li>• 扫码枪设置为USB HID模式</li>
            <li>• 钱箱通过打印机接口触发</li>
          </ul>
        </div>

        {/* 高级设置 */}
        <div className="mt-6">
          <h3 className="font-bold text-slate-800 mb-3">高级设置</h3>
          <div className="bg-white rounded-xl divide-y divide-slate-100">
            <div className="p-4 flex items-center justify-between">
              <span className="text-slate-700">打印联数</span>
              <select className="p-2 bg-slate-100 rounded-lg">
                <option>1联</option>
                <option>2联</option>
                <option>3联</option>
              </select>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-slate-700">打印浓度</span>
              <select className="p-2 bg-slate-100 rounded-lg">
                <option>淡</option>
                <option>中</option>
                <option>浓</option>
              </select>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-slate-700">钱箱弹出</span>
              <button className="px-4 py-2 bg-orange-500 text-white rounded-lg">
                打开钱箱
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
