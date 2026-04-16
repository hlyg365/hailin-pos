'use client';

import { useState } from 'react';
import { useHardware, useScanner } from '@/hooks/useHardware';
import { cashboxPlugin, dualScreenPlugin } from '@/lib/hardware';
import { cn } from '@/lib/utils';

// 硬件设备卡片
function DeviceCard({
  name,
  icon,
  connected,
  status,
  onConnect,
  onDisconnect,
  onAction,
  actionLabel,
  children,
}: {
  name: string;
  icon: string;
  connected: boolean;
  status?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onAction?: () => void;
  actionLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn(
      "bg-white rounded-xl p-4 border-2 transition-all",
      connected ? "border-green-200 bg-green-50" : "border-gray-200"
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
          connected ? "bg-green-100" : "bg-gray-100"
        )}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800">{name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn(
              "w-2 h-2 rounded-full",
              connected ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )}></span>
            <span className={cn(
              "text-xs",
              connected ? "text-green-600" : "text-gray-400"
            )}>
              {connected ? (status || '已连接') : '未连接'}
            </span>
          </div>
        </div>
      </div>
      
      {children}
      
      <div className="flex gap-2 mt-3">
        {connected ? (
          <>
            <button
              onClick={onDisconnect}
              className="flex-1 py-2 px-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              断开
            </button>
            {onAction && (
              <button
                onClick={onAction}
                className="flex-1 py-2 px-3 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                {actionLabel || '操作'}
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onConnect}
            className="flex-1 py-2 px-3 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
          >
            连接设备
          </button>
        )}
      </div>
    </div>
  );
}

// 测试小票数据
const TEST_RECEIPT = {
  title: '海邻到家便利店',
  storeName: '星火路店',
  orderId: `ORD${Date.now()}`,
  orderTime: new Date().toLocaleString('zh-CN'),
  cashier: '收银员001',
  items: [
    { name: '可乐500ml', quantity: 2, price: 3.5, total: 7.0 },
    { name: '农夫山泉550ml', quantity: 3, price: 2.0, total: 6.0 },
    { name: '康师傅方便面', quantity: 1, price: 4.5, total: 4.5 },
  ],
  subtotal: 17.5,
  discount: 2.0,
  total: 15.5,
  paymentMethod: '微信支付',
  change: 84.5,
  footer: ['欢迎下次光临', '联系电话: 400-888-8888'],
  barcode: '1234567890123',
};

// 硬件管理面板
export default function HardwarePanel() {
  const {
    status,
    loading,
    error,
    connectScale,
    disconnectScale,
    readScale,
    connectPrinter,
    disconnectPrinter,
    printReceipt,
    openCashbox,
    openDualScreen,
    showWelcome,
    showProduct,
    showPrice,
    showQRCode,
    showIdle,
    initialize,
  } = useHardware();

  const [scaleReading, setScaleReading] = useState<string>('--');
  const [testBarcode, setTestBarcode] = useState('');

  // 扫码枪回调
  const handleScan = (barcode: string) => {
    console.log('Scanned barcode:', barcode);
    setTestBarcode(barcode);
  };

  const { isListening, startListening, stopListening } = useScanner(handleScan);

  // 读取重量
  const handleReadScale = async () => {
    const reading = await readScale();
    if (reading) {
      setScaleReading(`${reading.weight.toFixed(2)}${reading.unit}`);
    }
  };

  // 测试打印
  const handleTestPrint = async () => {
    try {
      await printReceipt(TEST_RECEIPT);
      alert('小票打印成功！');
    } catch (err) {
      alert('打印失败: ' + (err as Error).message);
    }
  };

  // 测试双屏
  const handleTestDualScreen = async () => {
    await showWelcome();
    setTimeout(() => showProduct('测试商品', 19.9), 2000);
    setTimeout(() => showPrice(19.9, 80.1), 4000);
    setTimeout(() => showQRCode('https://example.com/pay/123', '扫码支付'), 6000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="bg-white rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">硬件设备管理</h1>
              <p className="text-sm text-gray-500 mt-1">收银台硬件插件配置面板</p>
            </div>
            <button
              onClick={initialize}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? '初始化中...' : '初始化所有设备'}
            </button>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* 扫码枪测试 */}
        <div className="bg-white rounded-xl p-4 mb-4">
          <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>📡</span> 扫码枪
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={isListening ? stopListening : startListening}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isListening ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600"
              )}
            >
              {isListening ? '监听中...' : '开始监听'}
            </button>
            <div className="flex-1">
              <input
                type="text"
                value={testBarcode}
                readOnly
                placeholder="扫码结果将显示在这里"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            提示：USB扫码枪会自动作为键盘输入，请确保焦点在页面上
          </p>
        </div>

        {/* 硬件设备网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 电子秤 */}
          <DeviceCard
            name="电子秤"
            icon="⚖️"
            connected={status.scale.connected}
            status={scaleReading !== '--' ? scaleReading : undefined}
            onConnect={() => connectScale()}
            onDisconnect={disconnectScale}
            onAction={handleReadScale}
            actionLabel="读取重量"
          >
            <div className="text-sm text-gray-600">
              <p>当前重量：<span className="font-bold text-lg text-orange-500">{scaleReading}</span></p>
            </div>
          </DeviceCard>

          {/* 打印机 */}
          <DeviceCard
            name="小票打印机"
            icon="🖨️"
            connected={status.printer.connected}
            status={status.printer.status === 'printing' ? '打印中...' : status.printer.status}
            onConnect={() => connectPrinter()}
            onDisconnect={disconnectPrinter}
            onAction={handleTestPrint}
            actionLabel="打印测试"
          >
            <div className="text-sm text-gray-600">
              <p>状态：{status.printer.status === 'idle' ? '空闲' : status.printer.status}</p>
            </div>
          </DeviceCard>

          {/* 钱箱 */}
          <DeviceCard
            name="钱箱"
            icon="💰"
            connected={status.cashbox.connected}
            status={status.cashbox.status === 'open' ? '已打开' : '已关闭'}
            onConnect={() => cashboxPlugin.initialize()}
            onDisconnect={() => {}}
            onAction={openCashbox}
            actionLabel="打开钱箱"
          >
            <div className="text-sm text-gray-600">
              <p>状态：{status.cashbox.status === 'closed' ? '关闭' : status.cashbox.status}</p>
            </div>
          </DeviceCard>

          {/* 双屏 */}
          <DeviceCard
            name="客显屏"
            icon="🖥️"
            connected={status.dualScreen.active}
            onConnect={openDualScreen}
            onDisconnect={() => dualScreenPlugin.closeScreen()}
            onAction={handleTestDualScreen}
            actionLabel="测试显示"
          >
            <div className="text-sm text-gray-600">
              <p>当前屏幕：{status.dualScreen.screen === 'customer' ? '客显屏' : '导购屏'}</p>
            </div>
          </DeviceCard>
        </div>

        {/* 快捷操作 */}
        <div className="bg-white rounded-xl p-4 mt-4">
          <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>⚡</span> 快捷操作
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={async () => {
                await showWelcome();
              }}
              className="py-3 px-4 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              显示欢迎
            </button>
            <button
              onClick={async () => {
                await showProduct('农夫山泉', 2.0);
              }}
              className="py-3 px-4 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
            >
              显示商品
            </button>
            <button
              onClick={async () => {
                await showPrice(25.5, 74.5);
              }}
              className="py-3 px-4 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors"
            >
              显示价格
            </button>
            <button
              onClick={async () => {
                await showQRCode('https://pay.example.com/123');
              }}
              className="py-3 px-4 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
            >
              显示二维码
            </button>
          </div>
        </div>

        {/* 设备状态总览 */}
        <div className="bg-white rounded-xl p-4 mt-4">
          <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>📊</span> 设备状态总览
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className={cn(
              "p-3 rounded-lg",
              status.scale.connected ? "bg-green-100" : "bg-gray-100"
            )}>
              <p className="text-2xl">⚖️</p>
              <p className="text-sm font-medium mt-1">电子秤</p>
              <p className={cn("text-xs mt-0.5", status.scale.connected ? "text-green-600" : "text-gray-400")}>
                {status.scale.connected ? '在线' : '离线'}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-lg",
              status.printer.connected ? "bg-green-100" : "bg-gray-100"
            )}>
              <p className="text-2xl">🖨️</p>
              <p className="text-sm font-medium mt-1">打印机</p>
              <p className={cn("text-xs mt-0.5", status.printer.connected ? "text-green-600" : "text-gray-400")}>
                {status.printer.connected ? '在线' : '离线'}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-lg",
              status.cashbox.connected ? "bg-green-100" : "bg-gray-100"
            )}>
              <p className="text-2xl">💰</p>
              <p className="text-sm font-medium mt-1">钱箱</p>
              <p className={cn("text-xs mt-0.5", status.cashbox.connected ? "text-green-600" : "text-gray-400")}>
                {status.cashbox.connected ? '就绪' : '未连接'}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-lg",
              status.dualScreen.active ? "bg-green-100" : "bg-gray-100"
            )}>
              <p className="text-2xl">🖥️</p>
              <p className="text-sm font-medium mt-1">客显屏</p>
              <p className={cn("text-xs mt-0.5", status.dualScreen.active ? "text-green-600" : "text-gray-400")}>
                {status.dualScreen.active ? '已打开' : '未打开'}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-lg",
              status.initialized ? "bg-green-100" : "bg-gray-100"
            )}>
              <p className="text-2xl">✅</p>
              <p className="text-sm font-medium mt-1">系统状态</p>
              <p className={cn("text-xs mt-0.5", status.initialized ? "text-green-600" : "text-gray-400")}>
                {status.initialized ? '就绪' : '未初始化'}
              </p>
            </div>
          </div>
        </div>

        {/* 技术说明 */}
        <div className="bg-gray-50 rounded-xl p-4 mt-4">
          <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>📖</span> 技术说明
          </h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>电子秤 (ScalePlugin)</strong>：通过WebUSB/WebSerial连接电子秤，支持实时读取重量、单位转换、去皮归零</p>
            <p><strong>打印机 (PrinterPlugin)</strong>：通过WebUSB连接热敏打印机，支持ESC/POS指令，可打印小票、条码、二维码</p>
            <p><strong>双屏 (DualScreenPlugin)</strong>：通过Window.postMessage实现主屏与客显屏通信，支持商品展示、支付二维码</p>
            <p><strong>钱箱 (CashboxPlugin)</strong>：通过打印机接口或USB直接控制钱箱，支持打开脉冲和状态检测</p>
            <p><strong>USB设备 (UsbDeviceService)</strong>：统一管理USB设备，提供设备枚举、连接、断开、事件监听</p>
          </div>
        </div>
      </div>
    </div>
  );
}
