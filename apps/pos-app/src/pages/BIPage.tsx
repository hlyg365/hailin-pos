import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

// 数字滚动动画组件
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <span className="tabular-nums">
      {prefix}{decimals > 0 ? displayValue.toFixed(decimals) : Math.floor(displayValue).toLocaleString()}{suffix}
    </span>
  );
}

// 环形进度图组件
function CircularProgress({ value, size = 120, strokeWidth = 8, color = '#3B82F6' }: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-700"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          opacity={0.2}
        />
        <circle
          className="transition-all duration-1000 ease-out"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{value}%</span>
      </div>
    </div>
  );
}

// 动态柱状图组件
function AnimatedBar({ value, maxValue, label, color, highlight = false }: {
  value: number;
  maxValue: number;
  label: string;
  color: string;
  highlight?: boolean;
}) {
  const [width, setWidth] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth((value / maxValue) * 100);
    }, 100);
    return () => clearTimeout(timer);
  }, [value, maxValue]);
  
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-sm text-gray-400">{label}</span>
      <div className="flex-1 h-8 bg-gray-800 rounded overflow-hidden relative">
        <div
          className="h-full rounded transition-all duration-1000 ease-out relative"
          style={{ width: `${width}%`, backgroundColor: color }}
        >
          {highlight && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          )}
        </div>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold">
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// 雷达图组件（简化版）
function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxValue = Math.max(...data.map(d => d.value));
  const center = 60;
  const radius = 50;
  
  const points = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
    const value = (d.value / maxValue) * radius;
    return {
      x: center + Math.cos(angle) * value,
      y: center + Math.sin(angle) * value,
      labelX: center + Math.cos(angle) * (radius + 15),
      labelY: center + Math.sin(angle) * (radius + 15),
      label: d.label,
    };
  });
  
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');
  
  return (
    <svg width="140" height="140" viewBox="0 0 120 120">
      {/* 背景网格 */}
      {[0.25, 0.5, 0.75, 1].map((scale, i) => (
        <polygon
          key={i}
          points={data.map((_, j) => {
            const angle = (Math.PI * 2 * j) / data.length - Math.PI / 2;
            return `${center + Math.cos(angle) * radius * scale},${center + Math.sin(angle) * radius * scale}`;
          }).join(' ')}
          fill="none"
          stroke="#374151"
          strokeWidth="0.5"
        />
      ))}
      {/* 数据区域 */}
      <polygon
        points={polygonPoints}
        fill="rgba(59, 130, 246, 0.3)"
        stroke="#3B82F6"
        strokeWidth="2"
      />
      {/* 标签 */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.labelX}
          y={p.labelY}
          fill="#9CA3AF"
          fontSize="8"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {p.label}
        </text>
      ))}
      {/* 数据点 */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3B82F6" />
      ))}
    </svg>
  );
}

// 科技感大屏组件
function TechDashboard({ data, onExit }: { data: any; onExit: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onExit();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [onExit]);
  
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-gray-950 overflow-auto"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      }}
    >
      {/* 网格背景 */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }} />
      </div>
      
      {/* 发光效果 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* 顶部标题栏 */}
      <div className="relative z-10 bg-gradient-to-r from-blue-900/80 via-purple-900/80 to-blue-900/80 border-b border-blue-500/30 py-4">
        <div className="container mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="海邻到家" className="h-12 w-auto" />
            <h1 className="text-2xl font-bold text-white tracking-wider">
              · 智慧门店数据中心
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-blue-300 font-mono text-lg">
              {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="text-cyan-400 font-mono text-2xl">
              {new Date().toLocaleTimeString()}
            </span>
            <button
              onClick={onExit}
              className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              退出全屏
            </button>
          </div>
        </div>
      </div>
      
      {/* 主要内容区 */}
      <div className="relative z-10 container mx-auto px-8 py-8">
        {/* 核心指标卡片 */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* 营收 */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-2xl p-6 backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <span className="text-blue-400 text-sm">实时营收</span>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-4xl font-bold text-white mb-2">
              ¥<AnimatedNumber value={data.totalSales} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-sm">↑ 12.5%</span>
              <span className="text-gray-500 text-sm">较昨日</span>
            </div>
            <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full animate-pulse" style={{ width: '75%' }} />
            </div>
          </div>
          
          {/* 订单 */}
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-2xl p-6 backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <span className="text-green-400 text-sm">订单数</span>
              <span className="text-2xl">🧾</span>
            </div>
            <div className="text-4xl font-bold text-white mb-2">
              <AnimatedNumber value={data.orderCount} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-sm">↑ 8.3%</span>
              <span className="text-gray-500 text-sm">较昨日</span>
            </div>
            <div className="mt-3 flex justify-center">
              <CircularProgress value={Math.min((data.orderCount / 500) * 100, 100)} size={80} strokeWidth={6} color="#22C55E" />
            </div>
          </div>
          
          {/* 客单价 */}
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-2xl p-6 backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <span className="text-purple-400 text-sm">客单价</span>
              <span className="text-2xl">👤</span>
            </div>
            <div className="text-4xl font-bold text-white mb-2">
              ¥<AnimatedNumber value={data.avgOrderValue} decimals={1} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-sm">↑ 3.8%</span>
              <span className="text-gray-500 text-sm">较昨日</span>
            </div>
            <div className="mt-3 flex justify-center">
              <RadarChart data={[
                { label: '早', value: 65 },
                { label: '午', value: 85 },
                { label: '晚', value: 95 },
                { label: '夜', value: 45 },
              ]} />
            </div>
          </div>
          
          {/* 完成率 */}
          <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-500/30 rounded-2xl p-6 backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <span className="text-orange-400 text-sm">日目标完成</span>
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-4xl font-bold text-white mb-2">
              <AnimatedNumber value={Math.min((data.totalSales / 150000) * 100, 100)} suffix="%" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-orange-400 text-sm">¥{data.totalSales.toLocaleString()} / ¥150,000</span>
            </div>
            <div className="mt-3 flex justify-center">
              <CircularProgress value={Math.min((data.totalSales / 150000) * 100, 100)} size={80} strokeWidth={6} color="#F97316" />
            </div>
          </div>
        </div>
        
        {/* 图表区域 */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* 时段分析 */}
          <div className="col-span-2 bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              24小时销售趋势
            </h3>
            <div className="flex items-end justify-between gap-2 h-48">
              {data.hourlyData.map((item: any, i: number) => {
                const maxSales = Math.max(...data.hourlyData.map((d: any) => d.sales));
                const height = (item.sales / maxSales) * 100;
                const isPeak = item.sales === maxSales;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <div
                      className={`w-full rounded-t transition-all duration-500 cursor-pointer relative ${
                        isPeak 
                          ? 'bg-gradient-to-t from-orange-500 to-yellow-400 shadow-lg shadow-orange-500/50' 
                          : 'bg-gradient-to-t from-blue-500 to-cyan-400'
                      }`}
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ¥{item.sales.toLocaleString()}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 mt-2">{item.hour}</span>
                    {isPeak && <span className="text-xs text-orange-400">高峰</span>}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* 支付方式 */}
          <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
              支付方式占比
            </h3>
            <div className="space-y-4">
              {[
                { name: '微信支付', value: 45, color: '#22C55E' },
                { name: '支付宝', value: 35, color: '#3B82F6' },
                { name: '现金', value: 12, color: '#F59E0B' },
                { name: '会员卡', value: 8, color: '#8B5CF6' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-400 text-sm w-16">{item.name}</span>
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${item.value}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <span className="text-white text-sm font-semibold w-10 text-right">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 门店排行 */}
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            门店经营排行榜
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {data.storeRanking.map((store: any, i: number) => (
              <div
                key={i}
                className={`rounded-xl p-4 ${
                  i === 0 ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' :
                  i === 1 ? 'bg-gradient-to-br from-gray-400/20 to-gray-600/20 border border-gray-400/30' :
                  i === 2 ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30' :
                  'bg-gray-800/50 border border-gray-700/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-500 text-white' :
                    i === 1 ? 'bg-gray-400 text-white' :
                    i === 2 ? 'bg-orange-500 text-white' :
                    'bg-gray-600 text-gray-300'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-white font-semibold text-sm truncate">{store.store}</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  ¥{(store.sales / 1000).toFixed(1)}k
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{store.orders}单</span>
                  <span className={store.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
                    {store.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BIPage() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [realtimeData, setRealtimeData] = useState({
    totalSales: 125680,
    orderCount: 356,
    avgOrderValue: 352.3,
    customers: 289,
  });

  // 模拟实时数据跳动
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeData(prev => ({
        totalSales: prev.totalSales + Math.floor(Math.random() * 100),
        orderCount: prev.orderCount + 1,
        avgOrderValue: (prev.totalSales + 80) / (prev.orderCount + 1),
        customers: prev.customers + Math.floor(Math.random() * 2),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 时段分析数据
  const hourlyData = [
    { hour: '06-08', sales: 8500, orders: 45 },
    { hour: '08-10', sales: 15600, orders: 89 },
    { hour: '10-12', sales: 12300, orders: 67 },
    { hour: '12-14', sales: 18900, orders: 112 },
    { hour: '14-16', sales: 9800, orders: 52 },
    { hour: '16-18', sales: 14200, orders: 78 },
    { hour: '18-20', sales: 22500, orders: 128 },
    { hour: '20-22', sales: 31800, orders: 186 },
  ];

  // 门店排行
  const storeRanking = [
    { rank: 1, store: '望京店', sales: 45680, orders: 128, avgPrice: 356.8, margin: 38.2, trend: '+15%' },
    { rank: 2, store: '国贸店', sales: 38920, orders: 112, avgPrice: 347.5, margin: 36.8, trend: '+12%' },
    { rank: 3, store: '中关村店', sales: 32450, orders: 96, avgPrice: 338.0, margin: 35.5, trend: '+8%' },
    { rank: 4, store: '五道口店', sales: 28900, orders: 85, avgPrice: 340.0, margin: 37.0, trend: '+5%' },
    { rank: 5, store: '亚运村店', sales: 24560, orders: 72, avgPrice: 341.1, margin: 34.2, trend: '-2%' },
  ];

  // ABC分析数据
  const abcProducts = [
    { name: '农夫山泉550ml', sales: 1560, ratio: 0.12, type: 'A' },
    { name: '可口可乐330ml', sales: 1280, ratio: 0.10, type: 'A' },
    { name: '康师傅方便面', sales: 980, ratio: 0.08, type: 'A' },
    { name: '双汇火腿肠', sales: 750, ratio: 0.06, type: 'B' },
    { name: '奥利奥饼干', sales: 620, ratio: 0.05, type: 'B' },
    { name: '伊利纯牛奶', sales: 580, ratio: 0.04, type: 'B' },
    { name: '蒙牛酸奶', sales: 420, ratio: 0.03, type: 'C' },
    { name: '绿箭口香糖', sales: 350, ratio: 0.03, type: 'C' },
  ];

  // 毛利分析
  const profitData = {
    totalRevenue: 125680,
    totalCost: 78650,
    grossProfit: 47030,
    grossMargin: 37.4,
    categoryProfit: [
      { category: '饮料', revenue: 45600, cost: 28400, margin: 37.7 },
      { category: '食品', revenue: 35200, cost: 21800, margin: 38.1 },
      { category: '零食', revenue: 21800, cost: 13200, margin: 39.4 },
      { category: '奶制品', revenue: 15600, cost: 9800, margin: 37.2 },
      { category: '生鲜', revenue: 7480, cost: 5450, margin: 27.1 },
    ],
  };

  // 预警数据
  const alerts = [
    { type: 'inventory', level: 'critical', message: '望京店：红富士苹果库存不足', time: '10分钟前' },
    { type: 'inventory', level: 'warning', message: '国贸店：蒙牛酸奶临期3天', time: '30分钟前' },
    { type: 'order', level: 'warning', message: '异常退单：订单#MINI20240117005', time: '1小时前' },
    { type: 'finance', level: 'info', message: '中关村店：日结单待审核', time: '2小时前' },
    { type: 'inventory', level: 'critical', message: '中关村店：散装面包已售罄', time: '2小时前' },
  ];

  // 投屏功能
  const handleFullscreen = useCallback(async () => {
    const dashboardData = {
      totalSales: realtimeData.totalSales,
      orderCount: realtimeData.orderCount,
      avgOrderValue: realtimeData.avgOrderValue,
      customers: realtimeData.customers,
      hourlyData,
      storeRanking,
    };
    
    setIsFullscreen(true);
    
    // 延迟进入全屏，确保状态更新
    setTimeout(() => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
    }, 100);
  }, [realtimeData, hourlyData, storeRanking]);

  const handleExitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, []);

  // 如果是全屏模式，显示科技大屏
  if (isFullscreen) {
    return (
      <TechDashboard 
        data={{
          totalSales: realtimeData.totalSales,
          orderCount: realtimeData.orderCount,
          avgOrderValue: realtimeData.avgOrderValue,
          customers: realtimeData.customers,
          hourlyData,
          storeRanking,
        }} 
        onExit={handleExitFullscreen} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <img src="/logo.png" alt="海邻到家" className="h-10 w-auto" />
              <h1 className="text-xl font-bold text-gray-800">BI 数据分析中心</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['today', 'week', 'month'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    className={`px-4 py-1.5 rounded-md text-sm ${
                      timeRange === t ? 'bg-white shadow text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {t === 'today' ? '今日' : t === 'week' ? '本周' : '本月'}
                  </button>
                ))}
              </div>
              {/* 投屏按钮 */}
              <button 
                onClick={handleFullscreen}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm flex items-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                投屏展示
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出报表
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 实时大屏 */}
        <section className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
          {/* 背景动效 */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
                实时数据 (每3秒刷新)
              </h2>
              <span className="text-sm opacity-80 font-mono">{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center relative">
                <p className="text-sm opacity-80">实时营收</p>
                <p className="text-3xl font-bold mt-1">¥{realtimeData.totalSales.toLocaleString()}</p>
                <p className="text-xs opacity-60 mt-1 flex items-center justify-center gap-1">
                  <span className="text-green-300">↑ 12.5%</span> 较昨日
                </p>
              </div>
              <div className="text-center relative">
                <p className="text-sm opacity-80">订单数</p>
                <p className="text-3xl font-bold mt-1">{realtimeData.orderCount}</p>
                <p className="text-xs opacity-60 mt-1 flex items-center justify-center gap-1">
                  <span className="text-green-300">↑ 8.3%</span> 较昨日
                </p>
              </div>
              <div className="text-center relative">
                <p className="text-sm opacity-80">客单价</p>
                <p className="text-3xl font-bold mt-1">¥{realtimeData.avgOrderValue.toFixed(1)}</p>
                <p className="text-xs opacity-60 mt-1 flex items-center justify-center gap-1">
                  <span className="text-green-300">↑ 3.8%</span> 较昨日
                </p>
              </div>
              <div className="text-center relative">
                <p className="text-sm opacity-80">顾客数</p>
                <p className="text-3xl font-bold mt-1">{realtimeData.customers}</p>
                <p className="text-xs opacity-60 mt-1 flex items-center justify-center gap-1">
                  <span className="text-green-300">↑ 5.2%</span> 较昨日
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 门店对比 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 时段分析 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="text-xl">📊</span> 时段分析
            </h3>
            <p className="text-sm text-gray-500 mb-4">识别高峰低谷，优化排班</p>
            <div className="flex items-end justify-between gap-2 h-40">
              {hourlyData.map((item, i) => {
                const maxSales = Math.max(...hourlyData.map(d => d.sales));
                const height = (item.sales / maxSales) * 100;
                const isPeak = item.sales === maxSales;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <div
                      className={`w-full rounded-t transition-all ${
                        isPeak ? 'bg-gradient-to-t from-orange-500 to-yellow-400 shadow-lg shadow-orange-500/30' : 'bg-gradient-to-t from-blue-400 to-blue-500'
                      }`}
                      style={{ height: `${height}%` }}
                      title={`¥${item.sales.toLocaleString()}`}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">{item.hour}</span>
                    {isPeak && <span className="text-xs text-orange-500 font-medium">高峰</span>}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-gradient-to-t from-orange-500 to-yellow-400 rounded"></span>
                <span className="text-gray-600">高峰时段</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-gradient-to-t from-blue-400 to-blue-500 rounded"></span>
                <span className="text-gray-600">正常时段</span>
              </div>
            </div>
          </div>

          {/* ABC分析 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="text-xl">🏆</span> 商品ABC分析
            </h3>
            <p className="text-sm text-gray-500 mb-4">识别畅销品与滞销品，优化库存结构</p>
            <div className="space-y-2">
              {abcProducts.slice(0, 8).map((product, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    product.type === 'A' ? 'bg-green-100 text-green-600' :
                    product.type === 'B' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {product.type}
                  </span>
                  <span className="flex-1 text-sm truncate">{product.name}</span>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        product.type === 'A' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                        product.type === 'B' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                        'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}
                      style={{ width: `${(product.ratio / 0.12) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-16 text-right">{product.sales}件</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-500"></span> A类 (畅销)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500"></span> B类 (平稳)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-400 to-gray-500"></span> C类 (滞销)</span>
            </div>
          </div>
        </section>

        {/* 毛利分析 */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="text-xl">💰</span> 毛利分析
          </h3>
          
          {/* 整体毛利 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center border border-green-200">
              <p className="text-sm text-gray-600">营收</p>
              <p className="text-2xl font-bold text-green-600">¥{profitData.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 text-center border border-red-200">
              <p className="text-sm text-gray-600">成本</p>
              <p className="text-2xl font-bold text-red-600">¥{profitData.totalCost.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-200">
              <p className="text-sm text-gray-600">毛利</p>
              <p className="text-2xl font-bold text-blue-600">¥{profitData.grossProfit.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center border border-purple-200">
              <p className="text-sm text-gray-600">毛利率</p>
              <p className="text-2xl font-bold text-purple-600">{profitData.grossMargin}%</p>
            </div>
          </div>

          {/* 分类毛利 */}
          <h4 className="font-medium mb-3">分类毛利对比</h4>
          <div className="space-y-3">
            {profitData.categoryProfit.map((cat, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-20 text-sm font-medium">{cat.category}</span>
                <div className="flex-1 flex gap-4">
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500" 
                      style={{ width: `${(cat.revenue / 45600) * 100}%` }} 
                    />
                  </div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-300 to-red-400 rounded-full transition-all duration-500" 
                      style={{ width: `${(cat.cost / 28400) * 100}%` }} 
                    />
                  </div>
                </div>
                <span className={`w-16 text-right font-semibold ${
                  cat.margin > 38 ? 'text-green-600' : cat.margin > 35 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {cat.margin}%
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded"></span>
              <span className="text-gray-600">营收占比</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-2 bg-gradient-to-r from-red-300 to-red-400 rounded"></span>
              <span className="text-gray-600">成本占比</span>
            </div>
          </div>
        </section>

        {/* 预警中心 */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="text-xl">🔔</span> 预警中心
            </h3>
            <div className="flex gap-2">
              {[
                { label: '全部', count: alerts.length, active: true },
                { label: '库存', count: 3, active: false },
                { label: '订单', count: 1, active: false },
                { label: '财务', count: 1, active: false },
              ].map((filter, i) => (
                <button
                  key={i}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filter.active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} {filter.count}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-4 rounded-lg transition-all hover:scale-[1.01] ${
                  alert.level === 'critical' ? 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200' :
                  alert.level === 'warning' ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200' :
                  'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    alert.level === 'critical' ? 'bg-red-100 text-red-600' :
                    alert.level === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {alert.type === 'inventory' ? '📦' : alert.type === 'order' ? '🧾' : '💰'}
                  </span>
                  <div>
                    <p className={`font-medium ${
                      alert.level === 'critical' ? 'text-red-800' :
                      alert.level === 'warning' ? 'text-yellow-800' :
                      'text-blue-800'
                    }`}>
                      {alert.message}
                    </p>
                    <p className="text-sm text-gray-500">{alert.time}</p>
                  </div>
                </div>
                <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  alert.level === 'critical' ? 'bg-red-500 text-white hover:bg-red-600' :
                  alert.level === 'warning' ? 'bg-yellow-500 text-white hover:bg-yellow-600' :
                  'bg-blue-500 text-white hover:bg-blue-600'
                }`}>
                  处理
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 门店排名 */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="text-xl">🏪</span> 门店经营排行
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="pb-3">排名</th>
                  <th className="pb-3">门店</th>
                  <th className="pb-3">营收</th>
                  <th className="pb-3">订单</th>
                  <th className="pb-3">客单价</th>
                  <th className="pb-3">毛利</th>
                  <th className="pb-3">趋势</th>
                </tr>
              </thead>
              <tbody>
                {storeRanking.map((row, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                        row.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-lg' :
                        row.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                        row.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {row.rank}
                      </span>
                    </td>
                    <td className="py-3 font-medium">{row.store}</td>
                    <td className="py-3 text-red-600 font-semibold">¥{row.sales.toLocaleString()}</td>
                    <td className="py-3">{row.orders}</td>
                    <td className="py-3">¥{row.avgPrice.toFixed(1)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        row.margin > 37 ? 'bg-green-100 text-green-600' : row.margin > 35 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {row.margin}%
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`flex items-center gap-1 ${row.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {row.trend.startsWith('+') ? '↑' : '↓'} {row.trend.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
