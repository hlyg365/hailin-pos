import React, { useState, useEffect, useCallback } from 'react';
import {
  deviceManager,
  POSDeviceManager,
  DeviceStatus,
} from '../services/posDevices';

interface DeviceCardProps {
  name: string;
  icon: string;
  status: DeviceStatus;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onTest: () => Promise<boolean>;
  description?: string;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  name,
  icon,
  status,
  onConnect,
  onDisconnect,
  onTest,
  description,
}) => {
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      await onTest();
    } finally {
      setTimeout(() => setTesting(false), 1000);
    }
  };

  const statusColor = status.connected
    ? status.online
      ? 'bg-green-500'
      : 'bg-yellow-500'
    : 'bg-gray-400';

  const statusText = status.connected
    ? status.online
      ? '在线'
      : '离线'
    : '未连接';

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${status.connected ? 'bg-blue-50' : 'bg-gray-100'} rounded-xl flex items-center justify-center text-2xl`}>
            {icon}
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
              <span className="text-xs text-gray-500">{statusText}</span>
            </div>
            {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
          </div>
        </div>
      </div>

      {status.error && (
        <div className="mt-3 p-2 bg-red-50 rounded-lg text-xs text-red-600">
          {status.error}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        {status.connected ? (
          <>
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50"
            >
              {testing ? '测试中...' : '测试'}
            </button>
            <button
              onClick={onDisconnect}
              className="flex-1 py-2 px-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
            >
              断开
            </button>
          </>
        ) : (
          <button
            onClick={onConnect}
            className="flex-1 py-2 px-3 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
          >
            连接
          </button>
        )}
      </div>
    </div>
  );
};

interface DeviceStatusPanelProps {
  isOpen: boolean;
  onClose: () => void;
  deviceManager: POSDeviceManager;
  onOpenDrawer?: () => void;
  onOpenCustomerDisplay?: () => void;
}

export const DeviceStatusPanel: React.FC<DeviceStatusPanelProps> = ({
  isOpen,
  onClose,
  deviceManager: manager,
  onOpenDrawer,
  onOpenCustomerDisplay,
}) => {
  const [devices, setDevices] = useState(() => manager.getAllStatus());
  const [initLoading, setInitLoading] = useState(false);

  // 刷新设备状态
  const refreshStatus = useCallback(() => {
    setDevices(manager.getAllStatus());
  }, [manager]);

  // 初始化所有设备
  const handleInitAll = async () => {
    setInitLoading(true);
    try {
      await manager.initializeAll();
      refreshStatus();
    } finally {
      setInitLoading(false);
    }
  };

  // 初始化时自动连接
  useEffect(() => {
    if (isOpen && !devices.customerDisplay.connected) {
      handleInitAll();
    }
  }, [isOpen]);

  // 定时刷新状态
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
  }, [isOpen, refreshStatus]);

  if (!isOpen) return null;

  const deviceList = [
    {
      key: 'customerDisplay',
      name: '客显屏',
      icon: '🖥️',
      description: '顾客显示屏',
      device: manager.customerDisplay,
    },
    {
      key: 'receiptPrinter',
      name: '小票打印机',
      icon: '🧾',
      description: '58mm/80mm热敏打印机',
      device: manager.receiptPrinter,
    },
    {
      key: 'labelPrinter',
      name: '标签打印机',
      icon: '🏷️',
      description: '价格标签打印',
      device: manager.labelPrinter,
    },
    {
      key: 'cashDrawer',
      name: '钱箱',
      icon: '💰',
      description: '现金收款抽屉',
      device: manager.cashDrawer,
    },
    {
      key: 'scale',
      name: '电子秤',
      icon: '⚖️',
      description: '联网电子秤',
      device: manager.scale,
    },
    {
      key: 'scanner',
      name: '扫码枪',
      icon: '📷',
      description: '条码扫描/摄像头',
      device: manager.scanner,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-800">收银设备管理</h2>
            <p className="text-sm text-gray-500 mt-1">管理客显屏、打印机、钱箱等设备</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition"
          >
            ✕
          </button>
        </div>

        {/* 快捷操作 */}
        <div className="px-6 py-3 bg-blue-50 flex gap-3">
          <button
            onClick={onOpenCustomerDisplay}
            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition flex items-center justify-center gap-2"
          >
            🖥️ 打开客显屏
          </button>
          <button
            onClick={onOpenDrawer}
            className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition flex items-center justify-center gap-2"
          >
            💰 打开钱箱
          </button>
        </div>

        {/* 设备列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deviceList.map(({ key, name, icon, description, device }) => (
              <DeviceCard
                key={key}
                name={name}
                icon={icon}
                description={description}
                status={devices[key as keyof typeof devices]}
                onConnect={() => device.connect()}
                onDisconnect={() => device.disconnect()}
                onTest={() => device.test()}
              />
            ))}
          </div>

          {/* 初始化按钮 */}
          <button
            onClick={handleInitAll}
            disabled={initLoading}
            className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {initLoading ? '初始化中...' : '🔄 初始化所有设备'}
          </button>
        </div>

        {/* 底部提示 */}
        <div className="px-6 py-3 bg-gray-50 border-t">
          <p className="text-xs text-gray-400 text-center">
            设备状态会自动刷新，如有问题请检查硬件连接
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeviceStatusPanel;
