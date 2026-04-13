'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  Download,
  RefreshCw
} from 'lucide-react';
import { posStore, Order } from '@/lib/pos-store';

interface SalesReport {
  totalAmount: number;
  totalOrders: number;
  avgOrderAmount: number;
  totalItems: number;
  cashAmount: number;
  wechatAmount: number;
  alipayAmount: number;
  cardAmount: number;
  memberAmount: number;
  topProducts: Array<{name: string; quantity: number; amount: number}>;
}

export default function ReportsPage() {
  const router = useRouter();
  const [report, setReport] = useState<SalesReport | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [dateRange]);

  const loadReport = async () => {
    setLoading(true);
    try {
      // 获取今日销售数据
      const sales = await posStore.getTodaySales();
      const allOrders = await posStore.getOrders();
      
      // 按日期筛选
      const now = Date.now();
      const dayStart = new Date().setHours(0, 0, 0, 0);
      const weekStart = dayStart - 7 * 86400000;
      const monthStart = dayStart - 30 * 86400000;
      
      let filteredOrders = allOrders;
      if (dateRange === 'today') {
        filteredOrders = allOrders.filter(o => o.createdAt >= dayStart);
      } else if (dateRange === 'week') {
        filteredOrders = allOrders.filter(o => o.createdAt >= weekStart);
      } else {
        filteredOrders = allOrders.filter(o => o.createdAt >= monthStart);
      }
      
      setOrders(filteredOrders);
      
      // 计算报表数据
      const totalAmount = filteredOrders.reduce((sum, o) => sum + o.finalAmount, 0);
      const totalOrders = filteredOrders.length;
      const totalItems = filteredOrders.reduce((sum, o) => 
        sum + o.items.reduce((s, i) => s + i.quantity, 0), 0
      );
      
      // 按支付方式统计
      const cashAmount = filteredOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.finalAmount, 0);
      const wechatAmount = filteredOrders.filter(o => o.paymentMethod === 'wechat').reduce((sum, o) => sum + o.finalAmount, 0);
      const alipayAmount = filteredOrders.filter(o => o.paymentMethod === 'alipay').reduce((sum, o) => sum + o.finalAmount, 0);
      const cardAmount = filteredOrders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.finalAmount, 0);
      const memberAmount = filteredOrders.filter(o => o.memberId).reduce((sum, o) => sum + o.finalAmount, 0);
      
      // 商品销量排行
      const productSales: Record<string, {name: string; quantity: number; amount: number}> = {};
      filteredOrders.forEach(order => {
        order.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { name: item.name, quantity: 0, amount: 0 };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].amount += item.subtotal;
        });
      });
      
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);
      
      setReport({
        totalAmount,
        totalOrders,
        avgOrderAmount: totalOrders > 0 ? totalAmount / totalOrders : 0,
        totalItems,
        cashAmount,
        wechatAmount,
        alipayAmount,
        cardAmount,
        memberAmount,
        topProducts
      });
    } catch (e) {
      console.error('加载报表失败', e);
    }
    setLoading(false);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 头部 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/pos')} className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-800">销售报表</h1>
          </div>
          <button onClick={loadReport} className="p-2 hover:bg-slate-100 rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        
        {/* 日期筛选 */}
        <div className="flex px-4 pb-3 gap-2">
          {[
            { key: 'today', label: '今日' },
            { key: 'week', label: '近7天' },
            { key: 'month', label: '近30天' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setDateRange(item.key as any)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                dateRange === item.key 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>加载中...</p>
          </div>
        ) : report ? (
          <>
            {/* 核心指标 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 opacity-80" />
                  <span className="text-orange-100 text-sm">销售额</span>
                </div>
                <p className="text-3xl font-bold">¥{report.totalAmount.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-2 text-orange-100 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>同比昨日 +12.5%</span>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-5 h-5 text-blue-500" />
                  <span className="text-slate-500 text-sm">订单数</span>
                </div>
                <p className="text-3xl font-bold text-slate-800">{report.totalOrders}</p>
                <p className="text-sm text-slate-500 mt-2">平均 ¥{report.avgOrderAmount.toFixed(2)}/单</p>
              </div>
            </div>

            {/* 商品数量 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">商品销量</p>
                    <p className="text-2xl font-bold text-slate-800">{report.totalItems} 件</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 支付方式 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-slate-400" />
                支付方式
              </h3>
              <div className="space-y-3">
                {[
                  { label: '微信支付', amount: report.wechatAmount, color: 'bg-green-500' },
                  { label: '支付宝', amount: report.alipayAmount, color: 'bg-blue-500' },
                  { label: '现金', amount: report.cashAmount, color: 'bg-orange-500' },
                  { label: '银行卡', amount: report.cardAmount, color: 'bg-purple-500' },
                  { label: '会员支付', amount: report.memberAmount, color: 'bg-pink-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="flex-1 text-slate-600">{item.label}</span>
                    <span className="font-bold text-slate-800">¥{item.amount.toFixed(2)}</span>
                    <span className="text-sm text-slate-400 w-16 text-right">
                      {report.totalAmount > 0 ? ((item.amount / report.totalAmount) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 商品销量排行 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-slate-400" />
                商品销量排行
              </h3>
              {report.topProducts.length === 0 ? (
                <p className="text-slate-400 text-center py-4">暂无销售数据</p>
              ) : (
                <div className="space-y-3">
                  {report.topProducts.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-yellow-400 text-white' :
                        i === 1 ? 'bg-slate-300 text-white' :
                        i === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="flex-1 text-slate-700 truncate">{item.name}</span>
                      <span className="text-slate-500 text-sm">{item.quantity}件</span>
                      <span className="font-bold text-orange-500">¥{item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 订单记录 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                订单记录
              </h3>
              {orders.length === 0 ? (
                <p className="text-slate-400 text-center py-4">暂无订单</p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 10).map(order => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="font-medium text-slate-800">{order.orderNo}</p>
                        <p className="text-sm text-slate-500">{formatDate(order.createdAt)} {formatTime(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-500">¥{order.finalAmount.toFixed(2)}</p>
                        <p className="text-sm text-slate-500">{order.items.length}件 · {order.paymentMethod}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>加载报表失败</p>
          </div>
        )}
      </main>
    </div>
  );
}
