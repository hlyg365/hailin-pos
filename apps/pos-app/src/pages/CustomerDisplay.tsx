/**
 * 客显屏组件
 * 用于分屏显示的顾客端屏幕
 */

import { useState, useEffect } from 'react';

interface DisplayData {
  line1: string;
  line2: string;
  line3: string;
  line4: string;
}

export default function CustomerDisplay() {
  const [data, setData] = useState<DisplayData>({
    line1: '欢迎光临',
    line2: '请扫描商品',
    line3: '',
    line4: ''
  });
  const [scaleWeight, setScaleWeight] = useState<number>(0);

  useEffect(() => {
    // 监听 Electron 消息
    const api = (window as any).electronAPI;
    
    if (api) {
      // 监听显示更新
      api.onDisplayUpdate?.((update: DisplayData) => {
        setData(update);
      });
      
      // 监听秤数据
      api.onScaleData?.((reading: { weight: number }) => {
        if (reading.weight > 0.01) {
          setScaleWeight(reading.weight);
        }
      });
    }

    // 监听来自主窗口的消息
    window.addEventListener('message', (event) => {
      if (event.data.type === 'display-update') {
        setData(event.data.payload);
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 flex flex-col justify-center items-center p-8 text-white">
      {/* 品牌标识 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-wider">海邻到家</h1>
        <p className="text-blue-300 text-sm mt-1">智能便利店</p>
      </div>

      {/* 主显示区 */}
      <div className="w-full max-w-md bg-blue-800/50 rounded-2xl p-6 shadow-2xl border border-blue-700/50">
        {/* 第一行 - 总计 */}
        <div className="text-center mb-6">
          <p className="text-blue-300 text-sm uppercase tracking-wider">应付金额</p>
          <p className="text-5xl font-bold text-yellow-400 mt-2">
            ¥{data.line1.replace('总计: ¥', '').replace('¥', '') || '0.00'}
          </p>
        </div>

        {/* 第二行 - 商品信息 */}
        <div className="text-center mb-4 py-3 border-y border-blue-600/50">
          <p className="text-xl text-blue-100">{data.line2}</p>
        </div>

        {/* 第三行 - 提示信息 */}
        <div className="text-center py-3">
          <p className="text-lg text-green-400 font-medium">{data.line3}</p>
        </div>

        {/* 第四行 - 附加信息 */}
        {data.line4 && (
          <div className="text-center py-2">
            <p className="text-blue-300">{data.line4}</p>
          </div>
        )}
      </div>

      {/* 称重显示（如果有） */}
      {scaleWeight > 0 && (
        <div className="mt-6 bg-green-600/20 border border-green-500/50 rounded-xl px-6 py-3">
          <p className="text-green-400 text-sm">当前重量</p>
          <p className="text-3xl font-bold text-green-300">{scaleWeight.toFixed(3)} kg</p>
        </div>
      )}

      {/* 二维码区域 */}
      <div className="mt-8 text-center">
        <div className="w-32 h-32 bg-white rounded-lg mx-auto flex items-center justify-center">
          <div className="w-24 h-24 bg-gray-200 rounded border-2 border-dashed"></div>
        </div>
        <p className="text-blue-300 text-sm mt-3">扫码享优惠</p>
      </div>

      {/* 底部信息 */}
      <div className="mt-auto pt-8 text-center">
        <p className="text-blue-500 text-xs">
          海邻到家智慧收银系统 v1.0
        </p>
      </div>
    </div>
  );
}
