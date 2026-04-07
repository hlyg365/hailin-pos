'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  PieChart,
  BarChart3,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Printer,
  Calendar,
  ChevronRight,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';

// 报表视图类型
type ReportView = 
  | 'sales-stats' 
  | 'income-distribution' 
  | 'trend-analysis' 
  | 'structure-analysis' 
  | 'inventory-stats'
  | 'staff-report'
  | 'star-products'
  | 'structure-optimization';

// 时间范围类型
type TimeRange = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

// 趋势分析时间类型
type TrendTimeRange = '7days' | '7weeks' | '6months';

// 收入分布标签类型
type IncomeTab = 'income' | 'refund' | 'recharge' | 'subsidy';

// 销售统计数据类型
interface SalesStats {
  orders: number;
  salesAmount: number;
  profit: number;
  profitRate: string;
  netSales: number;
  netProfit: number;
  netProfitRate: string;
  avgOrderValue: number;
  refunds: number;
  hourlyData: { hour: number; amount: number }[];
}

// 收入数据类型
interface IncomeData {
  netSales: number;
  refunds: number;
  yesterdayPayment: number;
  cashInDrawer: number;
  payments: { method: string; amount: number; percent: number; orders: number; color: string }[];
  refundsData: { method: string; amount: number; percent: number; orders: number; color: string }[];
  rechargeData: { method: string; amount: number; percent: number; orders: number; color: string }[];
  subsidyData: { method: string; amount: number; percent: number; orders: number; color: string }[];
}

// 趋势数据类型
interface TrendData {
  today: number;
  yesterday: number;
  thisWeek: number;
  thisMonth: number;
  dailyData: { date: string; value: number; change: number }[];
  weeklyData: { date: string; value: number; change: number }[];
  monthlyData: { date: string; value: number; change: number }[];
}

// 库存统计数据类型
interface InventoryStats {
  totalQuantity: number;
  totalTypes: number;
  totalValue: number;
  pendingRestock: number;
  pendingInbound: number;
  todayInbound: number;
  todayInboundAmount: number;
  receiveStats: {
    normalOrders: number;
    normalQuantity: number;
    normalAmount: number;
    jdOrders: number;
    jdQuantity: number;
    jdAmount: number;
  };
  inventoryCheck: {
    times: number;
    types: number;
    profitLoss: number;
    profitLossAmount: number;
  };
}

interface ReportsPageProps {
  onBack?: () => void;
  shopId?: string;
}

export function ReportsPage({ onBack, shopId }: ReportsPageProps) {
  const [currentView, setCurrentView] = useState<ReportView>('sales-stats');
  const [dateRange, setDateRange] = useState<TimeRange>('today');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // 趋势分析状态
  const [trendTimeRange, setTrendTimeRange] = useState<TrendTimeRange>('7days');
  const [trendMetric, setTrendMetric] = useState<'netSales' | 'quantity' | 'netProfit' | 'sales'>('netSales');
  
  // 收入分布状态
  const [incomeTab, setIncomeTab] = useState<IncomeTab>('income');
  
  // 库存统计状态
  const [receiveTimeRange, setReceiveTimeRange] = useState<'today' | 'yesterday' | 'month'>('today');
  const [checkTimeRange, setCheckTimeRange] = useState<'thisMonth' | 'lastMonth'>('thisMonth');
  
  // 数据状态
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [incomeData, setIncomeData] = useState<IncomeData | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [starProductsData, setStarProductsData] = useState<{
    products: Array<{
      rank: number;
      id: string;
      name: string;
      salesCount: number;
      salesAmount: number;
      profit: number;
    }>;
    totalProducts: number;
  } | null>(null);
  const [structureData, setStructureData] = useState<{
    categories: Array<{
      category: string;
      salesCount: number;
      salesAmount: number;
      percent: number;
    }>;
    totalCategories: number;
    totalSales: number;
  } | null>(null);
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取销售统计数据
  const fetchSalesStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        type: 'sales',
        range: dateRange,
      });
      if (shopId) params.append('shopId', shopId);
      if (dateRange === 'custom') {
        params.set('startDate', customStartDate);
        params.set('endDate', customEndDate);
      }
      
      const response = await fetch(`/api/reports/?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setSalesStats(result.data);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      console.error('获取销售统计失败:', err);
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }, [dateRange, shopId, customStartDate, customEndDate]);

  // 获取收入分布数据
  const fetchIncomeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        type: 'income',
        range: dateRange,
      });
      if (shopId) params.append('shopId', shopId);
      if (dateRange === 'custom') {
        params.set('startDate', customStartDate);
        params.set('endDate', customEndDate);
      }
      
      const response = await fetch(`/api/reports/?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setIncomeData(result.data);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      console.error('获取收入数据失败:', err);
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }, [dateRange, shopId, customStartDate, customEndDate]);

  // 获取趋势数据
  const fetchTrendData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        type: 'trend',
        range: 'month', // 趋势分析固定查一个月
      });
      if (shopId) params.append('shopId', shopId);
      
      const response = await fetch(`/api/reports/?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setTrendData(result.data);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      console.error('获取趋势数据失败:', err);
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  // 获取库存统计
  const fetchInventoryStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        type: 'inventory',
        range: 'today',
      });
      if (shopId) params.append('shopId', shopId);
      
      const response = await fetch(`/api/reports/?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setInventoryStats(result.data);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      console.error('获取库存统计失败:', err);
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  // 获取明星商品排行
  const fetchStarProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        type: 'star-products',
        range: dateRange,
      });
      if (shopId) params.append('shopId', shopId);
      
      const response = await fetch(`/api/reports/?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setStarProductsData(result.data);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      console.error('获取明星商品排行失败:', err);
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }, [dateRange, shopId]);

  // 获取结构分析数据
  const fetchStructureData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        type: 'structure',
        range: dateRange,
      });
      if (shopId) params.append('shopId', shopId);
      
      const response = await fetch(`/api/reports/?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setStructureData(result.data);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      console.error('获取结构分析失败:', err);
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }, [dateRange, shopId]);

  // 根据当前视图获取数据
  useEffect(() => {
    switch (currentView) {
      case 'sales-stats':
        fetchSalesStats();
        break;
      case 'income-distribution':
        fetchIncomeData();
        break;
      case 'trend-analysis':
        fetchTrendData();
        break;
      case 'inventory-stats':
        fetchInventoryStats();
        break;
      case 'star-products':
        fetchStarProducts();
        break;
      case 'structure-analysis':
        fetchStructureData();
        break;
      default:
        break;
    }
  }, [currentView, fetchSalesStats, fetchIncomeData, fetchTrendData, fetchInventoryStats, fetchStarProducts, fetchStructureData]);

  // 获取日期范围显示文本
  const getDateRangeText = () => {
    switch (dateRange) {
      case 'today':
        return '今日';
      case 'yesterday':
        return '昨日';
      case 'week':
        return '本周';
      case 'month':
        return '本月';
      case 'custom':
        return `${customStartDate} 至 ${customEndDate}`;
      default:
        return '今日';
    }
  };

  // 渲染核心指标卡片
  const renderMetricCard = (
    label: string, 
    value: string | number, 
    subText?: string, 
    hasDetail?: boolean,
    valueColor?: string
  ) => (
    <div className="bg-white rounded-lg border p-4 flex-1 min-w-[140px]">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={cn("text-xl font-bold mb-1", valueColor || "text-red-500")}>
        {typeof value === 'number' ? value.toFixed(2) : value}
      </div>
      {subText && <div className="text-xs text-gray-400">{subText}</div>}
      {hasDetail && (
        <button className="text-xs text-blue-500 mt-1">详情</button>
      )}
    </div>
  );

  // 渲染加载状态
  const renderLoading = () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <span className="ml-2 text-gray-500">加载数据中...</span>
    </div>
  );

  // 渲染错误状态
  const renderError = () => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
      <AlertCircle className="h-5 w-5 text-red-500" />
      <span className="text-red-600">{error}</span>
      <Button size="sm" variant="outline" onClick={() => {
        setError(null);
        switch (currentView) {
          case 'sales-stats': fetchSalesStats(); break;
          case 'income-distribution': fetchIncomeData(); break;
          case 'trend-analysis': fetchTrendData(); break;
          case 'inventory-stats': fetchInventoryStats(); break;
        }
      }}>
        <RefreshCw className="h-3 w-3 mr-1" />
        重试
      </Button>
    </div>
  );

  // 销售统计页面
  const renderSalesStats = () => {
    if (loading) return renderLoading();
    if (error) return renderError();
    if (!salesStats) return <div className="text-center text-gray-400 py-12">暂无数据</div>;
    
    const maxAmount = Math.max(...salesStats.hourlyData.map(d => d.amount), 100);

    return (
      <div className="space-y-4">
        {/* 核心指标卡片 */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {renderMetricCard('订单量', salesStats.orders, undefined, true)}
          {renderMetricCard('销售额(元)', salesStats.salesAmount, undefined, true)}
          {renderMetricCard('利润(元)', salesStats.profit, `利润率${salesStats.profitRate}`, true)}
          {renderMetricCard('净销售额', salesStats.netSales, undefined, true)}
          {renderMetricCard('净利润', salesStats.netProfit, `净利润率${salesStats.netProfitRate}`, true)}
          {renderMetricCard('平均客单价', salesStats.avgOrderValue, undefined, true)}
          {renderMetricCard('顾客退款(元)', salesStats.refunds, undefined, true)}
        </div>

        {/* 时段销售图表 */}
        <div className="bg-white rounded-lg border p-4">
          <h4 className="text-sm font-medium mb-4">时段销售 ({getDateRangeText()})</h4>
          <div className="h-48 flex items-end gap-1">
            {salesStats.hourlyData.map((data, i) => {
              const height = data.amount ? (data.amount / maxAmount) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-orange-400 rounded-t transition-all hover:bg-orange-500 cursor-pointer"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${i}时: ¥${data.amount.toFixed(2)}`}
                  />
                  {i % 4 === 0 && (
                    <span className="text-[10px] text-gray-400 mt-1">{i}</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>时</span>
            <span>销售额(元)</span>
          </div>
        </div>

        {/* 数据为空提示 */}
        {salesStats.orders === 0 && (
          <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
            <div className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{getDateRangeText()}暂无销售数据</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              完成收银后，数据将自动统计到报表中
            </div>
          </div>
        )}
      </div>
    );
  };

  // 收入分布页面
  const renderIncomeDistribution = () => {
    if (loading) return renderLoading();
    if (error) return renderError();
    if (!incomeData) return <div className="text-center text-gray-400 py-12">暂无数据</div>;
    
    const currentData = incomeTab === 'income' ? incomeData.payments :
                       incomeTab === 'refund' ? incomeData.refundsData :
                       incomeTab === 'recharge' ? incomeData.rechargeData :
                       incomeData.subsidyData;
    const total = currentData.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    return (
      <div className="space-y-4">
        {/* 收入概览 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-xs text-gray-500">净销售额(收入-退款)</div>
            <div className="text-xl font-bold text-red-500">¥{incomeData.netSales.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-xs text-gray-500">退款金额</div>
            <div className="text-xl font-bold">¥{incomeData.refunds.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-xs text-gray-500">昨日聚合支付实际到账</div>
            <div className="text-xl font-bold">¥{incomeData.yesterdayPayment.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-xs text-gray-500">钱箱内剩余现金</div>
            <div className="text-xl font-bold">¥{incomeData.cashInDrawer.toFixed(2)}</div>
            <div className="text-xs text-gray-400">现金支付-现金退款，不含初始现金</div>
          </div>
        </div>

        {/* 收入明细 */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex gap-4 mb-4 border-b">
            {[
              { key: 'income', label: '收入' },
              { key: 'refund', label: '退款' },
              { key: 'recharge', label: '会员充值' },
              { key: 'subsidy', label: '补贴收入' },
            ].map((tab) => (
              <button 
                key={tab.key}
                onClick={() => setIncomeTab(tab.key as IncomeTab)}
                className={cn(
                  "text-sm pb-2 transition-colors",
                  incomeTab === tab.key 
                    ? "font-medium text-red-500 border-b-2 border-red-500" 
                    : "text-gray-500"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="text-sm text-gray-500 mb-3">
            {incomeTab === 'income' ? '收入' : incomeTab === 'refund' ? '退款' : incomeTab === 'recharge' ? '会员充值' : '补贴收入'}总和：¥{total.toFixed(2)}
          </div>
          
          {/* 支付方式列表 */}
          <div className="space-y-3">
            {currentData.length > 0 ? currentData.map((payment, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: payment.color }}
                  />
                  <span className="text-sm">{payment.method}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">¥{payment.amount.toFixed(2)}</span>
                  <span className="text-xs text-gray-400">占比{payment.percent}%</span>
                  <span className="text-xs text-gray-400">共{payment.orders}单</span>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-400 py-4">暂无数据</div>
            )}
          </div>
        </div>

        {/* 饼图 */}
        {total > 0 && (
          <div className="bg-white rounded-lg border p-4">
            <h4 className="text-sm font-medium mb-4">{incomeTab === 'income' ? '收入' : incomeTab === 'refund' ? '退款' : incomeTab === 'recharge' ? '会员充值' : '补贴收入'}占比</h4>
            <div className="flex justify-center">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {currentData.filter(p => p.percent > 0).map((payment, index, arr) => {
                    const totalPercent = arr.reduce((sum, p) => sum + p.percent, 0);
                    if (totalPercent === 0) return null;
                    
                    let startAngle = 0;
                    for (let i = 0; i < index; i++) {
                      startAngle += ((arr[i].percent || 0) / totalPercent) * 360;
                    }
                    const endAngle = startAngle + ((payment.percent || 0) / totalPercent) * 360;
                    
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;
                    
                    const x1 = 50 + 40 * Math.cos(startRad);
                    const y1 = 50 + 40 * Math.sin(startRad);
                    const x2 = 50 + 40 * Math.cos(endRad);
                    const y2 = 50 + 40 * Math.sin(endRad);
                    
                    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                    
                    return (
                      <path
                        key={index}
                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={payment.color}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">
                      {incomeTab === 'income' ? '收入' : incomeTab === 'refund' ? '退款' : incomeTab === 'recharge' ? '充值' : '补贴'}
                    </div>
                    <div className="text-lg font-bold">¥{total.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {currentData.filter(p => p.percent > 0).map((payment, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payment.color }} />
                  <span className="text-xs">{payment.method} {payment.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 趋势分析页面
  const renderTrendAnalysis = () => {
    if (loading) return renderLoading();
    if (error) return renderError();
    if (!trendData) return <div className="text-center text-gray-400 py-12">暂无数据</div>;
    
    const currentData = trendTimeRange === '7days' ? trendData.dailyData :
                       trendTimeRange === '7weeks' ? trendData.weeklyData :
                       trendData.monthlyData;
    const maxValue = Math.max(...currentData.map(d => d.value), 100);
    
    return (
      <div className="space-y-4">
        {/* 概览数据 */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border p-3">
            <div className="text-xs text-gray-500">今日销售额</div>
            <div className="text-lg font-bold text-red-500">¥{trendData.today.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg border p-3">
            <div className="text-xs text-gray-500">昨日销售额</div>
            <div className="text-lg font-bold">¥{trendData.yesterday.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg border p-3">
            <div className="text-xs text-gray-500">本周累计</div>
            <div className="text-lg font-bold">¥{trendData.thisWeek.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg border p-3">
            <div className="text-xs text-gray-500">本月累计</div>
            <div className="text-lg font-bold">¥{trendData.thisMonth.toFixed(2)}</div>
          </div>
        </div>

        {/* 时间和指标选择 */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex gap-4 mb-4">
            <div className="flex gap-2">
              {[
                { key: '7days', label: '过去7天' },
                { key: '7weeks', label: '过去7周' },
                { key: '6months', label: '过去6个月' },
              ].map((item) => (
                <button 
                  key={item.key}
                  onClick={() => setTrendTimeRange(item.key as TrendTimeRange)}
                  className={cn(
                    "px-3 py-1 text-sm rounded transition-colors",
                    trendTimeRange === item.key 
                      ? "bg-red-500 text-white" 
                      : "border hover:bg-gray-50"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <select 
              className="px-3 py-1 text-sm border rounded"
              value={trendMetric}
              onChange={(e) => setTrendMetric(e.target.value as any)}
            >
              <option value="netSales">净销售额</option>
              <option value="sales">销售商品数量</option>
              <option value="netProfit">净利润</option>
              <option value="quantity">销售额</option>
            </select>
          </div>

          {/* 折线图 */}
          {currentData.length > 0 ? (
            <div className="h-48 relative">
              <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-400">
                <span>{(maxValue * 1.0).toFixed(0)}</span>
                <span>{(maxValue * 0.75).toFixed(0)}</span>
                <span>{(maxValue * 0.5).toFixed(0)}</span>
                <span>{(maxValue * 0.25).toFixed(0)}</span>
                <span>0</span>
              </div>
              <div className="ml-12 h-40 relative border-l border-b border-gray-200">
                <svg className="w-full h-full" viewBox="0 0 700 160" preserveAspectRatio="none">
                  <polyline
                    points={currentData.map((d, i) => {
                      const x = (i / (currentData.length - 1)) * 700;
                      const y = 160 - (d.value / maxValue) * 160;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2"
                  />
                </svg>
                {currentData.map((d, i) => {
                  const x = (i / (currentData.length - 1)) * 100;
                  return (
                    <div 
                      key={i} 
                      className="absolute bottom-0 transform -translate-x-1/2"
                      style={{ left: `${x}%` }}
                    >
                      <span className="text-[10px] text-gray-400">{d.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              暂无趋势数据
            </div>
          )}
        </div>

        {/* 数据列表 */}
        {currentData.length > 0 && (
          <div className="bg-white rounded-lg border p-4">
            <h4 className="text-sm font-medium mb-3">详细数据</h4>
            <div className="space-y-2">
              {currentData.map((d, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{d.date}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">¥{d.value.toFixed(2)}</span>
                    <span className={cn(
                      "text-xs flex items-center gap-1",
                      d.change >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {d.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(d.change).toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 结构分析页面
  const renderStructureAnalysis = () => {
    if (loading) return renderLoading();
    if (error) return renderError();
    
    return (
      <div className="space-y-4">
        {/* 品类销售概览 */}
        <div className="bg-white rounded-lg border p-4">
          <h4 className="text-sm font-medium mb-4">品类销售分析</h4>
          
          {structureData && structureData.categories.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500">品类数量</div>
                  <div className="text-xl font-bold">{structureData.totalCategories}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">总销售额</div>
                  <div className="text-xl font-bold text-red-500">¥{structureData.totalSales.toFixed(2)}</div>
                </div>
              </div>
              
              {/* 品类列表 */}
              <div className="space-y-2">
                {structureData.categories.map((cat, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm">{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">¥{cat.salesAmount.toFixed(2)}</span>
                      <span className="text-xs text-gray-400">{cat.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 饼图 */}
              <div className="mt-4 flex justify-center">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {structureData.categories.map((cat, index, arr) => {
                      const totalPercent = arr.reduce((sum, c) => sum + c.percent, 0);
                      if (totalPercent === 0) return null;
                      
                      let startAngle = 0;
                      for (let i = 0; i < index; i++) {
                        startAngle += (arr[i].percent / totalPercent) * 360;
                      }
                      const endAngle = startAngle + (cat.percent / totalPercent) * 360;
                      
                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;
                      
                      const x1 = 50 + 40 * Math.cos(startRad);
                      const y1 = 50 + 40 * Math.sin(startRad);
                      const x2 = 50 + 40 * Math.cos(endRad);
                      const y2 = 50 + 40 * Math.sin(endRad);
                      
                      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                      
                      const colors = ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#ec4899'];
                      
                      return (
                        <path
                          key={index}
                          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={colors[index % colors.length]}
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">品类</div>
                      <div className="text-lg font-bold">{structureData.totalCategories}</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <PieChart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>暂无品类分析数据</p>
              <p className="text-xs mt-1">完成收银后，系统将自动分析商品结构</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 库存统计页面
  const renderInventoryStats = () => {
    if (loading) return renderLoading();
    if (error) return renderError();
    if (!inventoryStats) return <div className="text-center text-gray-400 py-12">暂无数据</div>;

    return (
      <div className="space-y-4">
        {/* 库存概览 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">库存总量(件)</span>
              <span className="text-xs text-gray-400">商品品类：全部</span>
            </div>
            <div className="text-xl font-bold text-red-500">{inventoryStats.totalQuantity}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-xs text-gray-500">库存种类(种)</div>
            <div className="text-xl font-bold">{inventoryStats.totalTypes}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-xs text-gray-500">库存总价值(元)</div>
            <div className="text-xl font-bold text-red-500">¥{inventoryStats.totalValue.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">待补货商品</span>
              <Button size="sm" className="h-6 text-xs bg-red-500 hover:bg-red-600">补货</Button>
            </div>
            <div className="text-xl font-bold">{inventoryStats.pendingRestock}种</div>
            <div className="text-xs text-gray-400">补货未入库：{inventoryStats.pendingInbound}件</div>
          </div>
          <div className="bg-white rounded-lg border p-4 col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">今日入库量</div>
                <div className="text-lg font-medium">{inventoryStats.todayInbound}件</div>
                <div className="text-xs text-gray-400">今日入库额：¥{inventoryStats.todayInboundAmount.toFixed(2)}</div>
              </div>
              <Button size="sm" className="bg-red-500 hover:bg-red-600">入库</Button>
            </div>
          </div>
        </div>

        {/* 收货单统计 */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">收货单统计</h4>
            <div className="flex gap-2">
              {[
                { key: 'today', label: '今日' },
                { key: 'yesterday', label: '昨日' },
                { key: 'month', label: '本月' },
              ].map((item) => (
                <button 
                  key={item.key}
                  onClick={() => setReceiveTimeRange(item.key as any)}
                  className={cn(
                    "px-2 py-1 text-xs rounded transition-colors",
                    receiveTimeRange === item.key 
                      ? "bg-red-500 text-white" 
                      : "border hover:bg-gray-50"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">普通收货(单)</div>
              <div className="text-lg font-medium">{inventoryStats.receiveStats.normalOrders}</div>
              <div className="text-xs text-gray-400">
                普通商品收货量：{inventoryStats.receiveStats.normalQuantity}件
              </div>
              <div className="text-xs text-gray-400">
                普通商品进货额：¥{inventoryStats.receiveStats.normalAmount.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">京东收货(单)</div>
              <div className="text-lg font-medium">{inventoryStats.receiveStats.jdOrders}</div>
              <div className="text-xs text-gray-400">
                京东收货量：{inventoryStats.receiveStats.jdQuantity}件
              </div>
              <div className="text-xs text-gray-400">
                京东进货额：¥{inventoryStats.receiveStats.jdAmount.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm">导出</Button>
            <Button variant="outline" size="sm">更多</Button>
          </div>
        </div>

        {/* 盘点统计 */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">盘点统计</h4>
            <div className="flex gap-2">
              {[
                { key: 'thisMonth', label: '本月' },
                { key: 'lastMonth', label: '上月' },
              ].map((item) => (
                <button 
                  key={item.key}
                  onClick={() => setCheckTimeRange(item.key as any)}
                  className={cn(
                    "px-2 py-1 text-xs rounded transition-colors",
                    checkTimeRange === item.key 
                      ? "bg-red-500 text-white" 
                      : "border hover:bg-gray-50"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">盘点次数</div>
              <div className="text-lg font-medium">{inventoryStats.inventoryCheck.times}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">盘点商品种类</div>
              <div className="text-lg font-medium">{inventoryStats.inventoryCheck.types}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">盈亏数</div>
              <div className="text-lg font-medium">{inventoryStats.inventoryCheck.profitLoss}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">盈亏额(元)</div>
              <div className="text-lg font-medium">¥{inventoryStats.inventoryCheck.profitLossAmount.toFixed(2)}</div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm">导出</Button>
            <Button variant="outline" size="sm">盘点记录</Button>
          </div>
        </div>
      </div>
    );
  };

  // 店员报表页面
  const renderStaffReport = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border p-4">
        <h4 className="text-sm font-medium mb-4">店员业绩排行</h4>
        <div className="text-center text-gray-400 py-8">
          暂无店员数据
        </div>
      </div>
    </div>
  );

  // 明星商品排行
  const renderStarProducts = () => {
    if (loading) return renderLoading();
    if (error) return renderError();
    
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg border p-4">
          <h4 className="text-sm font-medium mb-4">明星商品排行</h4>
          <div className="text-sm text-gray-500 mb-4">
            根据销售额、销量、利润等维度综合分析的商品排行
          </div>
          
          {starProductsData && starProductsData.products.length > 0 ? (
            <>
              <div className="text-xs text-gray-400 mb-2">
                共 {starProductsData.totalProducts} 种商品
              </div>
              <div className="space-y-2">
                {starProductsData.products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                        product.rank === 1 ? "bg-yellow-500" :
                        product.rank === 2 ? "bg-gray-400" :
                        product.rank === 3 ? "bg-amber-600" : "bg-gray-300"
                      )}>
                        {product.rank}
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-gray-400">
                          销量: {product.salesCount}件 | 利润: ¥{product.profit.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-500">¥{product.salesAmount.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">销售额</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>暂无商品销售数据</p>
              <p className="text-xs mt-1">完成收银后，系统将自动生成商品排行</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 商品结构优化
  const renderStructureOptimization = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border p-4">
        <h4 className="text-sm font-medium mb-4">商品结构优化建议</h4>
        <div className="text-sm text-gray-500 mb-4">
          基于销售数据和库存周转率的智能分析建议
        </div>
        <div className="text-center text-gray-400 py-8">
          <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>暂无优化建议</p>
          <p className="text-xs mt-1">积累更多销售数据后，系统将提供优化建议</p>
        </div>
      </div>
    </div>
  );

  // 渲染内容
  const renderContent = () => {
    switch (currentView) {
      case 'sales-stats':
        return renderSalesStats();
      case 'income-distribution':
        return renderIncomeDistribution();
      case 'trend-analysis':
        return renderTrendAnalysis();
      case 'structure-analysis':
        return renderStructureAnalysis();
      case 'inventory-stats':
        return renderInventoryStats();
      case 'staff-report':
        return renderStaffReport();
      case 'star-products':
        return renderStarProducts();
      case 'structure-optimization':
        return renderStructureOptimization();
      default:
        return renderSalesStats();
    }
  };

  // 打印报表
  const handlePrint = () => {
    const data = salesStats || { orders: 0, salesAmount: 0, profit: 0, profitRate: '0%' };
    const printContent = `
海邻到家便利店 - 经营日报

日期: ${getDateRangeText()}

销售统计:
- 订单量: ${data.orders}
- 销售额: ¥${data.salesAmount.toFixed(2)}
- 利润: ¥${data.profit.toFixed(2)}
- 利润率: ${data.profitRate}

打印时间: ${new Date().toLocaleString('zh-CN')}
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>经营日报打印</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              h1 { font-size: 16px; }
              pre { font-size: 12px; line-height: 1.6; }
            </style>
          </head>
          <body>
            <pre>${printContent}</pre>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // 导出报表
  const handleExport = () => {
    const data = salesStats || { 
      orders: 0, 
      salesAmount: 0, 
      profit: 0, 
      profitRate: '0%',
      netSales: 0,
      netProfit: 0,
      netProfitRate: '0%',
      avgOrderValue: 0,
      refunds: 0
    };
    const csvContent = `
指标,数值
日期范围,${getDateRangeText()}
订单量,${data.orders}
销售额(元),${data.salesAmount.toFixed(2)}
利润(元),${data.profit.toFixed(2)}
利润率,${data.profitRate}
净销售额(元),${data.netSales.toFixed(2)}
净利润(元),${data.netProfit.toFixed(2)}
净利润率,${data.netProfitRate}
平均客单价(元),${data.avgOrderValue.toFixed(2)}
退款金额(元),${data.refunds.toFixed(2)}
导出时间,${new Date().toLocaleString('zh-CN')}
    `.trim();
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `经营报表_${getDateRangeText()}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('报表导出成功！');
  };

  return (
    <div className="flex h-[calc(100vh-140px)]">
      {/* 左侧导航 */}
      <div className="w-48 shrink-0 bg-slate-50 border-r border-slate-200 overflow-y-auto">
        {/* 生意现状 */}
        <div className="overflow-hidden">
          <div className="px-3 py-2.5 bg-slate-100 text-xs font-medium text-slate-500 border-b border-slate-200">
            生意现状
          </div>
          {[
            { view: 'sales-stats' as ReportView, label: '销售统计', icon: BarChart3 },
            { view: 'income-distribution' as ReportView, label: '收入分布', icon: PieChart },
            { view: 'trend-analysis' as ReportView, label: '趋势分析', icon: TrendingUp },
            { view: 'structure-analysis' as ReportView, label: '结构分析', icon: PieChart },
            { view: 'inventory-stats' as ReportView, label: '库存统计', icon: Package },
            { view: 'staff-report' as ReportView, label: '店员报表', icon: TrendingUp },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm transition-all border-l-2",
                  isActive 
                    ? "bg-blue-50 text-blue-600 font-medium border-blue-500" 
                    : "text-slate-600 hover:bg-slate-100 border-transparent"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
        
        {/* 生意优化 */}
        <div className="overflow-hidden mt-1 border-t border-slate-200">
          <div className="px-3 py-2.5 bg-slate-100 text-xs font-medium text-slate-500 border-b border-slate-200">
            生意优化
          </div>
          <button 
            onClick={() => setCurrentView('star-products')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-sm transition-all border-l-2",
              currentView === 'star-products' 
                ? "bg-blue-50 text-blue-600 font-medium border-blue-500" 
                : "text-slate-600 hover:bg-slate-100 border-transparent"
            )}
          >
            <TrendingUp className="h-4 w-4" />
            明星商品排行
          </button>
          <button 
            onClick={() => setCurrentView('structure-optimization')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-sm transition-all border-l-2",
              currentView === 'structure-optimization' 
                ? "bg-blue-50 text-blue-600 font-medium border-blue-500" 
                : "text-slate-600 hover:bg-slate-100 border-transparent"
            )}
          >
            <PieChart className="h-4 w-4" />
            商品结构优化
          </button>
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1 min-w-0 overflow-y-auto p-4 bg-white">
        {/* 日期切换和功能按钮 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 items-center relative">
            {[
              { key: 'today', label: '今日' },
              { key: 'yesterday', label: '昨日' },
              { key: 'week', label: '本周' },
              { key: 'month', label: '本月' },
            ].map((range) => (
              <button
                key={range.key}
                onClick={() => setDateRange(range.key as TimeRange)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded transition-all",
                  dateRange === range.key 
                    ? "bg-red-500 text-white" 
                    : "border hover:bg-gray-50"
                )}
              >
                {range.label}
              </button>
            ))}
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={cn(
                "px-3 py-1.5 text-sm border rounded flex items-center gap-1 transition-all",
                dateRange === 'custom' ? "bg-red-500 text-white border-red-500" : "hover:bg-gray-50"
              )}
            >
              <Calendar className="h-3 w-3" />
              日期选择
            </button>
            
            {/* 日期选择器弹窗 */}
            {showDatePicker && (
              <div className="absolute top-10 left-0 bg-white border rounded-lg shadow-lg p-4 z-50 min-w-[300px]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">选择日期范围</span>
                  <button onClick={() => setShowDatePicker(false)}>
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
                <div className="flex gap-3 items-center">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">开始日期</label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-36"
                    />
                  </div>
                  <span className="text-gray-400 mt-5">至</span>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">结束日期</label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-36"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <Button 
                    size="sm"
                    onClick={() => {
                      setDateRange('custom');
                      setShowDatePicker(false);
                    }}
                  >
                    确定
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              经营日报打印
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              导出数据报表
            </Button>
          </div>
        </div>

        {/* 当前日期范围显示 */}
        {dateRange === 'custom' && (
          <div className="text-sm text-gray-500 mb-2">
            当前选择: {customStartDate} 至 {customEndDate}
          </div>
        )}

        {/* 内容区 */}
        <div className="bg-white rounded-lg shadow p-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
