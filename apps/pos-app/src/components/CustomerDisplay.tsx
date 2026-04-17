import React, { useEffect, useState } from 'react';
import { useOrderStore } from '../store';

interface CustomerDisplayProps {
  storeName?: string;
  items: Array<{
    product: {
      id: string;
      name: string;
      retailPrice: number;
      isStandard: boolean;
    };
    quantity: number;
  }>;
  totals: {
    subtotal: number;
    total: number;
    clearanceDiscount: number;
    memberDiscount: number;
  };
  currentMember?: {
    name: string;
    level: string;
    points: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onFullscreen?: () => void;
}

// 总部配置的客显屏内容
const displaySettings = {
  welcomeTitle: '欢迎光临',
  welcomeSubtitle: '海邻到家便利店',
  logoText: '海邻',
  adMessages: [
    '会员卡购物享积分',
    '晚8点后全场8折',
    '新会员首单满50减10',
  ],
  thankYouMessage: '感谢惠顾，欢迎下次光临',
};

export const CustomerDisplay: React.FC<CustomerDisplayProps> = ({
  storeName = displaySettings.welcomeSubtitle,
  items,
  totals,
  currentMember,
  isOpen,
  onClose,
  onFullscreen,
}) => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 广告轮播
  useEffect(() => {
    if (items.length === 0) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % displaySettings.adMessages.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [items.length]);

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    onFullscreen?.();
  };

  if (!isOpen) return null;

  const hasItems = items.length > 0;

  return (
    <div
      className={`
        fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900
        flex flex-col transition-all duration-500
        ${isFullscreen ? '' : 'm-4 rounded-2xl overflow-hidden shadow-2xl'}
      `}
    >
      {/* 顶部标题栏 */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <span className="text-2xl font-bold">{displaySettings.logoText[0]}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">{storeName}</h1>
              <p className="text-sm text-white/80">AI智慧收银系统</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentMember && (
              <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
                <p className="text-sm">会员：{currentMember.name}</p>
                <p className="text-xs text-white/80">
                  {currentMember.level === 'diamond' ? '💎 钻石会员' :
                   currentMember.level === 'gold' ? '🥇 金卡会员' : '🥈 银卡会员'}
                </p>
              </div>
            )}
            <button
              onClick={handleFullscreen}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title={isFullscreen ? '退出全屏' : '全屏显示'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isFullscreen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                )}
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {hasItems ? (
          <>
            {/* 左侧商品列表 */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                当前商品 ({items.length}件)
              </h2>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.product.id + index}
                    className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center gap-4 hover:bg-white/15 transition-colors"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center text-2xl">
                      {!item.product.isStandard ? '🍎' : '📦'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{item.product.name}</h3>
                      <p className="text-sm text-blue-200">
                        {item.product.isStandard ? (
                          <>× {item.quantity} 件</>
                        ) : (
                          <>重量 {item.quantity.toFixed(3)} kg</>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">
                        ¥{item.product.isStandard 
                          ? (item.product.retailPrice * item.quantity).toFixed(2)
                          : (item.product.retailPrice * item.quantity).toFixed(2)
                        }
                      </p>
                      <p className="text-sm text-blue-200">
                        ¥{item.product.retailPrice.toFixed(2)}/件
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧结算区 */}
            <div className="w-full lg:w-96 bg-white/5 backdrop-blur p-6 flex flex-col">
              {/* 价格明细 */}
              <div className="bg-white/10 rounded-2xl p-6 mb-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  价格明细
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-blue-100">
                    <span>商品小计</span>
                    <span>¥{totals.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {totals.clearanceDiscount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span className="flex items-center gap-1">
                        <span className="px-2 py-0.5 bg-green-500/30 rounded text-xs">清货</span>
                        清货8折优惠
                      </span>
                      <span>-¥{totals.clearanceDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {totals.memberDiscount > 0 && (
                    <div className="flex justify-between text-blue-400">
                      <span>会员折扣</span>
                      <span>-¥{totals.memberDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-white/20 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">应付金额</span>
                      <span className="text-3xl font-bold text-yellow-400">
                        ¥{totals.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 促销信息 */}
              {totals.clearanceDiscount === 0 && totals.memberDiscount === 0 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 mb-6 border border-amber-500/30">
                  <p className="text-amber-200 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    晚8点后全场8折优惠
                  </p>
                </div>
              )}

              {/* 会员提示 */}
              {!currentMember && (
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 mb-6 border border-blue-500/30">
                  <p className="text-blue-200 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    刷会员卡享更多优惠
                  </p>
                </div>
              )}

              {/* 支付引导 */}
              <div className="mt-auto">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-center">
                  <p className="text-white font-semibold text-lg">请选择支付方式</p>
                  <p className="text-white/80 text-sm mt-1">微信 / 支付宝 / 现金 / 会员卡</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* 待机画面 */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                {displaySettings.welcomeTitle}
              </h2>
              <p className="text-2xl text-blue-200">{storeName}</p>
            </div>

            {/* 广告轮播 */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 mb-12 max-w-md w-full">
              <div className="h-16 flex items-center justify-center">
                <p className="text-2xl text-center text-white animate-pulse">
                  {displaySettings.adMessages[currentAdIndex]}
                </p>
              </div>
              <div className="flex justify-center gap-2 mt-6">
                {displaySettings.adMessages.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentAdIndex ? 'bg-white w-6' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 功能介绍 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl w-full">
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-4xl mb-3">💳</div>
                <p className="text-white font-medium">聚合支付</p>
                <p className="text-blue-200 text-sm">微信/支付宝/云闪付</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-4xl mb-3">💰</div>
                <p className="text-white font-medium">会员积分</p>
                <p className="text-blue-200 text-sm">消费攒积分</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-4xl mb-3">🏷️</div>
                <p className="text-white font-medium">会员折扣</p>
                <p className="text-blue-200 text-sm">最高享9折</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-4xl mb-3">📱</div>
                <p className="text-white font-medium">扫码购物</p>
                <p className="text-blue-200 text-sm">AI智能识别</p>
              </div>
            </div>

            <p className="text-blue-300/60 text-sm mt-12">
              海邻到家 V6.0 AI智慧收银系统
            </p>
          </div>
        )}
      </div>

      {/* 底部 */}
      <div className="bg-black/30 text-center py-3">
        <p className="text-blue-200/60 text-sm">
          {hasItems ? '收银完成请出示付款码' : '如有疑问请联系店员'}
        </p>
      </div>
    </div>
  );
};

export default CustomerDisplay;
