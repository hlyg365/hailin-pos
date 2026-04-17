import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStoreStore, useRestockStore, useAlertStore } from '../store';

type Tab = 'overview' | 'stores' | 'products' | 'supply' | 'finance' | 'members' | 'orders' | 'staff' | 'promo' | 'bi' | 'storeops' | 'auth';
type TimeRange = 'today' | 'week' | 'month' | 'year' | 'custom';
type DepositTimeRange = 'thisMonth' | 'lastMonth' | 'threeMonths' | 'thisYear' | 'custom';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { stores } = useStoreStore();
  const { requests, approveRequest, rejectRequest } = useRestockStore();
  const { lowStockAlerts, overdueAlerts } = useAlertStore();
  
  // 财务中心-收银明细时间筛选状态
  const [financeTimeRange, setFinanceTimeRange] = useState<TimeRange>('today');
  const [financeDateStart, setFinanceDateStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [financeDateEnd, setFinanceDateEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // 财务中心-缴款单时间筛选状态
  const [depositTimeRange, setDepositTimeRange] = useState<DepositTimeRange>('thisMonth');
  const [depositDateStart, setDepositDateStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [depositDateEnd, setDepositDateEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // 缴款单月份选择
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  
  // 计算时间范围
  const financeRange = useMemo(() => {
    const today = new Date();
    let start: Date, end: Date = today;
    
    switch (financeTimeRange) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'week':
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start = new Date(today);
        start.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        start = new Date(today);
        start.setFullYear(today.getFullYear() - 1);
        break;
      case 'custom':
        start = new Date(financeDateStart);
        end = new Date(financeDateEnd);
        break;
    }
    
    return { start, end };
  }, [financeTimeRange, financeDateStart, financeDateEnd]);
  
  // 根据时间范围计算统计数据
  const getStoreStats = (storeId: string) => {
    const dayCount = Math.ceil((financeRange.end.getTime() - financeRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const baseDaily = Math.round(Math.random() * 5000 + 3000);
    const total = baseDaily * dayCount;
    const cash = Math.round(total * (0.15 + Math.random() * 0.1));
    const wechat = Math.round(total * (0.35 + Math.random() * 0.1));
    const alipay = Math.round(total * (0.3 + Math.random() * 0.1));
    const unionpay = Math.round(total * (0.05 + Math.random() * 0.05));
    const member = total - cash - wechat - alipay - unionpay;
    return { total, cash, wechat, alipay, unionpay, member, dayCount };
  };
  
  const formatDateRange = () => {
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (financeTimeRange === 'today') return '今日';
    if (financeTimeRange === 'week') return `近7天`;
    if (financeTimeRange === 'month') return `近30天`;
    if (financeTimeRange === 'year') return `近1年`;
    return `${financeRange.start.toLocaleDateString('zh-CN', opts)} ~ ${financeRange.end.toLocaleDateString('zh-CN', opts)}`;
  };
  
  // 缴款单计算逻辑
  const depositRange = useMemo(() => {
    const today = new Date();
    let start: Date, end: Date = today;
    
    switch (depositTimeRange) {
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'threeMonths':
        start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        end = today;
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
        break;
      case 'custom':
        start = new Date(depositDateStart);
        end = new Date(depositDateEnd);
        break;
    }
    
    return { start, end };
  }, [depositTimeRange, depositDateStart, depositDateEnd]);
  
  // 生成模拟缴款单数据
  const generateDepositRecords = () => {
    const records: Array<{
      id: string;
      store: string;
      storeId: string;
      amount: number;
      method: string;
      status: 'pending' | 'confirmed';
      date: string;
      month: string;
      cashier: string;
    }> = [];
    
    const methods = ['银行转账', '现金', '支付宝', '微信'];
    const statuses: Array<'pending' | 'confirmed'> = ['pending', 'confirmed'];
    const cashiers = ['张三', '李四', '王五', '赵六'];
    
    // 生成近6个月的缴款记录
    const today = new Date();
    for (let m = 0; m < 6; m++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      
      // 每月每个门店生成3-8条缴款记录
      stores.forEach(store => {
        const recordCount = Math.floor(Math.random() * 6) + 3;
        for (let i = 0; i < recordCount; i++) {
          const day = Math.floor(Math.random() * daysInMonth) + 1;
          const recordDate = `${monthStr}-${String(day).padStart(2, '0')}`;
          records.push({
            id: `DEP${monthStr.replace('-', '')}${store.code}${String(i + 1).padStart(2, '0')}`,
            store: store.name,
            storeId: store.id,
            amount: Math.round((Math.random() * 8000 + 2000) * 100) / 100,
            method: methods[Math.floor(Math.random() * methods.length)],
            status: m === 0 && Math.random() > 0.6 ? 'pending' : 'confirmed',
            date: recordDate,
            month: monthStr,
            cashier: cashiers[Math.floor(Math.random() * cashiers.length)],
          });
        }
      });
    }
    
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };
  
  const allDepositRecords = useMemo(() => generateDepositRecords(), [stores]);
  
  // 根据时间范围筛选缴款记录
  const filteredDeposits = useMemo(() => {
    if (depositTimeRange === 'custom') {
      return allDepositRecords.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= depositRange.start && recordDate <= depositRange.end;
      });
    }
    
    const targetMonth = depositRange.start.toISOString().slice(0, 7);
    return allDepositRecords.filter(r => r.month === targetMonth);
  }, [depositTimeRange, depositRange, allDepositRecords]);
  
  // 按月汇总缴款数据
  const monthlySummary = useMemo(() => {
    const summary: Record<string, { total: number; confirmed: number; pending: number; count: number }> = {};
    
    allDepositRecords.forEach(record => {
      if (!summary[record.month]) {
        summary[record.month] = { total: 0, confirmed: 0, pending: 0, count: 0 };
      }
      summary[record.month].total += record.amount;
      if (record.status === 'confirmed') {
        summary[record.month].confirmed += record.amount;
      } else {
        summary[record.month].pending += record.amount;
      }
      summary[record.month].count += 1;
    });
    
    return Object.entries(summary)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, data]) => ({
        month,
        ...data,
        label: `${month.slice(0, 4)}年${parseInt(month.slice(5))}月`,
      }));
  }, [allDepositRecords]);
  
  // 当前选中月份的统计
  const currentMonthStats = useMemo(() => {
    const targetMonth = depositRange.start.toISOString().slice(0, 7);
    const monthData = monthlySummary.find(m => m.month === targetMonth);
    return monthData || { total: 0, confirmed: 0, pending: 0, count: 0 };
  }, [depositRange, monthlySummary]);
  
  const formatDepositRange = () => {
    if (depositTimeRange === 'thisMonth') return '本月';
    if (depositTimeRange === 'lastMonth') return '上月';
    if (depositTimeRange === 'threeMonths') return '近3月';
    if (depositTimeRange === 'thisYear') return '本年';
    return `${depositDateStart} ~ ${depositDateEnd}`;
  };

  // 模拟数据
  const overviewData = {
    totalStores: 3,
    activeOrders: 24,
    todaySales: 12580,
    monthSales: 385600,
    memberCount: 12580,
    pendingRestocks: 5,
  };

  const tabs: { id: Tab; label: string; icon: string; link?: string }[] = [
    { id: 'overview', label: '工作台', icon: '📊' },
    { id: 'stores', label: '门店管理', icon: '🏪' },
    { id: 'products', label: '商品管理', icon: '📦' },
    { id: 'supply', label: '供应链', icon: '🚚' },
    { id: 'finance', label: '财务中心', icon: '💰' },
    { id: 'members', label: '会员管理', icon: '👥' },
    { id: 'orders', label: '订单管理', icon: '🧾' },
    { id: 'staff', label: '人员管理', icon: '👔' },
    { id: 'promo', label: '促销管理', icon: '🎁', link: '/dashboard/promotion' },
    { id: 'bi', label: 'BI分析', icon: '📈', link: '/dashboard/bi' },
    { id: 'storeops', label: '门店运营', icon: '🔧', link: '/dashboard/store-ops' },
    { id: 'auth', label: '权限管理', icon: '🔐', link: '/dashboard/auth' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-800">总部管理后台</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">总部管理员</span>
              <span className="text-gray-500 text-sm">admin@hailin.com</span>
            </div>
          </div>
          
          {/* 标签导航 */}
          <div className="flex gap-1 overflow-x-auto pb-2">
            {tabs.map(tab => (
              tab.link ? (
                <Link
                  key={tab.id}
                  to={tab.link}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors text-gray-600 hover:bg-gray-100"
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              ) : (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              )
            ))}
          </div>
        </div>
      </header>

      {/* 内容区 */}
      <div className="container mx-auto px-4 py-6">
        {/* 工作台 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 核心指标 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: '门店总数', value: overviewData.totalStores, icon: '🏪', color: 'blue' },
                { label: '今日销售', value: `¥${overviewData.todaySales.toLocaleString()}`, icon: '💰', color: 'green' },
                { label: '本月销售', value: `¥${(overviewData.monthSales / 10000).toFixed(1)}万`, icon: '📈', color: 'purple' },
                { label: '会员总数', value: overviewData.memberCount.toLocaleString(), icon: '👥', color: 'orange' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{item.label}</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{item.value}</p>
                    </div>
                    <div className={`w-12 h-12 bg-${item.color}-100 rounded-lg flex items-center justify-center`}>
                      <span className="text-2xl">{item.icon}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 待处理事项 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 待审核要货单 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">待审核要货单</h3>
                  <span className="bg-red-100 text-red-600 text-sm px-2 py-1 rounded-full">{requests.filter(r => r.status === 'pending').length}</span>
                </div>
                <div className="space-y-3">
                  {requests.filter(r => r.status === 'pending').map(req => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{stores.find(s => s.id === req.storeId)?.name}</p>
                        <p className="text-sm text-gray-500">¥{req.totalAmount} · {req.items.length}种商品</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveRequest(req.id)}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                        >
                          审核
                        </button>
                        <button
                          onClick={() => rejectRequest(req.id)}
                          className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded hover:bg-gray-300"
                        >
                          拒绝
                        </button>
                      </div>
                    </div>
                  ))}
                  {requests.filter(r => r.status === 'pending').length === 0 && (
                    <p className="text-center text-gray-400 py-4">暂无待审核</p>
                  )}
                </div>
              </div>

              {/* 库存预警 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">库存预警</h3>
                  <span className="bg-yellow-100 text-yellow-600 text-sm px-2 py-1 rounded-full">{lowStockAlerts.length + overdueAlerts.length}</span>
                </div>
                <div className="space-y-3">
                  {[...lowStockAlerts, ...overdueAlerts].slice(0, 5).map((alert, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          'daysLeft' in alert ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {'daysLeft' in alert ? '⏰' : '📦'}
                        </span>
                        <div>
                          <p className="font-medium">{alert.productName}</p>
                          <p className="text-sm text-gray-500">
                            {'daysLeft' in alert ? `临期 ${alert.daysLeft}天后` : `库存不足 (${alert.current}/${alert.threshold})`}
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/assistant/restock"
                        className="text-blue-600 text-sm hover:underline"
                      >
                        要货
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 门店销售排行 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">门店销售排行</h3>
              <div className="space-y-3">
                {stores.map((store, i) => (
                  <div key={store.id} className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      i === 0 ? 'bg-yellow-100 text-yellow-600' :
                      i === 1 ? 'bg-gray-100 text-gray-600' :
                      i === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{store.name}</p>
                      <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.random() * 60 + 40}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-gray-600">¥{(Math.random() * 5000 + 3000).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 门店管理 */}
        {activeTab === 'stores' && (
          <div className="space-y-6">
            {/* 门店管控概览 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">门店管控中心</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: '门店总数', value: stores.length, icon: '🏪', color: 'blue' },
                  { label: '营业中', value: stores.filter(s => s.status === 'active').length, icon: '✅', color: 'green' },
                  { label: '待处理要货', value: 5, icon: '📦', color: 'orange' },
                  { label: '库存预警', value: 3, icon: '⚠️', color: 'red' },
                  { label: '今日订单', value: 128, icon: '🧾', color: 'purple' },
                ].map((item, i) => (
                  <div key={i} className={`bg-${item.color}-50 rounded-lg p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{item.icon}</span>
                      <span className={`text-sm text-${item.color}-600`}>{item.label}</span>
                    </div>
                    <p className={`text-2xl font-bold text-${item.color}-800`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 门店列表和详情 */}
            <div className="flex gap-4">
              {/* 左侧门店列表 */}
              <div className="w-1/3">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h4 className="font-semibold mb-3">门店列表</h4>
                  <div className="space-y-2">
                    {stores.map(store => (
                      <button
                        key={store.id}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          store.id === 'store001' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{store.name}</p>
                            <p className="text-xs text-gray-500">{store.code}</p>
                          </div>
                          <span className={`w-2 h-2 rounded-full ${
                            store.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                          }`}></span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 右侧门店详情 */}
              <div className="flex-1 space-y-4">
                {/* 基本信息 */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">望京店 (WJ001)</h4>
                    <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">营业中</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="text-gray-500">店长：</span>张三</div>
                    <div><span className="text-gray-500">电话：</span>010-12345678</div>
                    <div><span className="text-gray-500">区域：</span>北京朝阳</div>
                  </div>
                </div>

                {/* 今日经营数据 */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h4 className="font-semibold mb-3">今日经营数据</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: '销售额', value: '¥8,520', icon: '💰', color: 'green' },
                      { label: '订单数', value: '42', icon: '🧾', color: 'blue' },
                      { label: '客单价', value: '¥202.86', icon: '👤', color: 'purple' },
                      { label: '毛利', value: '¥1,704', icon: '📈', color: 'orange' },
                    ].map((item, i) => (
                      <div key={i} className={`bg-${item.color}-50 rounded-lg p-3`}>
                        <div className="flex items-center gap-1 mb-1">
                          <span>{item.icon}</span>
                          <span className={`text-xs text-${item.color}-600`}>{item.label}</span>
                        </div>
                        <p className={`font-bold text-${item.color}-800`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 库存预警 */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">库存预警</h4>
                    <button className="text-blue-600 text-sm hover:underline">查看全部</button>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b">
                        <th className="pb-2">商品</th>
                        <th className="pb-2">当前库存</th>
                        <th className="pb-2">预警值</th>
                        <th className="pb-2">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: '红富士苹果', stock: 15, threshold: 30, status: 'low' },
                        { name: '散装面包', stock: 5, threshold: 20, status: 'critical' },
                        { name: '伊利纯牛奶', stock: 45, threshold: 50, status: 'low' },
                      ].map((item, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2">{item.name}</td>
                          <td className={`py-2 ${item.status === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}>
                            {item.stock}
                          </td>
                          <td className="py-2 text-gray-500">{item.threshold}</td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              item.status === 'critical' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                              {item.status === 'critical' ? '紧急' : '预警'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 待审批要货 */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">待审批要货</h4>
                    <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">5笔</span>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b">
                        <th className="pb-2">门店</th>
                        <th className="pb-2">商品种类</th>
                        <th className="pb-2">金额</th>
                        <th className="pb-2">申请时间</th>
                        <th className="pb-2">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { store: '望京店', items: 8, amount: 5200, time: '10:30' },
                        { store: '国贸店', items: 5, amount: 3800, time: '09:15' },
                        { store: '中关村店', items: 12, amount: 7500, time: '08:45' },
                      ].map((item, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2">{item.store}</td>
                          <td className="py-2">{item.items}种</td>
                          <td className="py-2 text-red-600">¥{item.amount.toLocaleString()}</td>
                          <td className="py-2 text-gray-500">{item.time}</td>
                          <td className="py-2">
                            <button className="text-green-600 text-sm hover:underline mr-2">批准</button>
                            <button className="text-gray-500 text-sm hover:underline">拒绝</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 近期订单 */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">近期订单</h4>
                    <button className="text-blue-600 text-sm hover:underline">查看全部</button>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b">
                        <th className="pb-2">订单号</th>
                        <th className="pb-2">门店</th>
                        <th className="pb-2">金额</th>
                        <th className="pb-2">支付方式</th>
                        <th className="pb-2">时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: 'ORD20240117001', store: '望京店', amount: 128.5, pay: '微信', time: '14:32' },
                        { id: 'ORD20240117002', store: '望京店', amount: 56.0, pay: '现金', time: '14:28' },
                        { id: 'ORD20240117003', store: '国贸店', amount: 238.0, pay: '支付宝', time: '14:15' },
                      ].map((item, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 font-mono text-xs">{item.id}</td>
                          <td className="py-2">{item.store}</td>
                          <td className="py-2 text-green-600">¥{item.amount}</td>
                          <td className="py-2">{item.pay}</td>
                          <td className="py-2 text-gray-500">{item.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 商品管理 */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">商品管理</h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <span>➕</span> 新增商品
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <span>📥</span> 批量导入
                </button>
              </div>
            </div>

            {/* 商品统计概览 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: '商品总数', value: '1,256', icon: '📦', color: 'blue' },
                { label: '在售商品', value: '1,180', icon: '✅', color: 'green' },
                { label: '待上架', value: '52', icon: '⏳', color: 'yellow' },
                { label: '已停售', value: '24', icon: '❌', color: 'gray' },
                { label: '库存预警', value: '38', icon: '⚠️', color: 'red' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm text-gray-500">{item.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>

            {/* 搜索和筛选 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="搜索商品名称/条码/助记码..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select className="px-4 py-2 border rounded-lg">
                  <option value="">全部分类</option>
                  <option value="drinks">饮料</option>
                  <option value="food">食品</option>
                  <option value="snacks">零食</option>
                  <option value="dairy">奶制品</option>
                  <option value="fresh">生鲜</option>
                  <option value="bakery">烘焙</option>
                </select>
                <select className="px-4 py-2 border rounded-lg">
                  <option value="">全部状态</option>
                  <option value="active">在售</option>
                  <option value="pending">待上架</option>
                  <option value="inactive">已停售</option>
                </select>
                <select className="px-4 py-2 border rounded-lg">
                  <option value="">全部类型</option>
                  <option value="standard">标品</option>
                  <option value="nonstandard">非标品</option>
                </select>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  搜索
                </button>
              </div>
            </div>

            {/* 商品分类管理 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">商品分类</h3>
                <button className="text-blue-600 hover:underline text-sm">管理分类</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { name: '饮料', count: 186, color: 'blue' },
                  { name: '食品', count: 245, color: 'orange' },
                  { name: '零食', count: 198, color: 'pink' },
                  { name: '奶制品', count: 92, color: 'purple' },
                  { name: '生鲜', count: 68, color: 'green' },
                  { name: '烘焙', count: 45, color: 'yellow' },
                  { name: '日用品', count: 156, color: 'gray' },
                  { name: '酒类', count: 78, color: 'red' },
                ].map((cat, i) => (
                  <button
                    key={i}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors flex items-center gap-2"
                  >
                    <span>{cat.name}</span>
                    <span className="bg-white px-2 py-0.5 rounded text-xs">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 商品列表 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">商品列表</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3">商品信息</th>
                      <th className="pb-3">分类</th>
                      <th className="pb-3">进价</th>
                      <th className="pb-3">售价</th>
                      <th className="pb-3">库存</th>
                      <th className="pb-3">状态</th>
                      <th className="pb-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 'p001', barcode: '6921166466888', name: '农夫山泉550ml', category: '饮料', cost: 1.5, price: 2, stock: 120, status: 'active', isStandard: true },
                      { id: 'p002', barcode: '6921234567890', name: '可口可乐330ml', category: '饮料', cost: 2.2, price: 3, stock: 85, status: 'active', isStandard: true },
                      { id: 'p003', barcode: '6922345678901', name: '康师傅方便面', category: '食品', cost: 3.5, price: 4.5, stock: 200, status: 'active', isStandard: true },
                      { id: 'p004', barcode: '6923456789012', name: '双汇火腿肠', category: '食品', cost: 3.8, price: 5, stock: 150, status: 'active', isStandard: true },
                      { id: 'p005', barcode: '6924567890123', name: '绿箭口香糖', category: '零食', cost: 4.5, price: 6, stock: 80, status: 'active', isStandard: true },
                      { id: 'p006', barcode: '6925678901234', name: '奥利奥饼干', category: '零食', cost: 6.5, price: 8.5, stock: 65, status: 'active', isStandard: true },
                      { id: 'p007', barcode: '6926789012345', name: '伊利纯牛奶', category: '奶制品', cost: 9, price: 12, stock: 45, status: 'active', isStandard: true },
                      { id: 'p008', barcode: '6927890123456', name: '蒙牛酸奶', category: '奶制品', cost: 5, price: 6.5, stock: 72, status: 'active', isStandard: true },
                      { id: 'p009', barcode: '', name: '红富士苹果', category: '生鲜', cost: 6, price: 9.9, stock: 15, status: 'active', isStandard: false },
                      { id: 'p010', barcode: '', name: '散装面包', category: '烘焙', cost: 15, price: 25, stock: 5, status: 'warning', isStandard: false },
                    ].map(product => (
                      <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                              {product.isStandard ? '📦' : '🍎'}
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-gray-500">
                                {product.barcode || '非标品'}
                                {!product.isStandard && <span className="ml-2 text-orange-500">非标品</span>}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-1 bg-gray-100 rounded text-sm">{product.category}</span>
                        </td>
                        <td className="py-3 text-gray-600">¥{product.cost.toFixed(2)}</td>
                        <td className="py-3 font-medium text-green-600">¥{product.price.toFixed(2)}</td>
                        <td className="py-3">
                          <span className={product.stock < 20 ? 'text-red-600 font-medium' : ''}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            product.status === 'active' ? 'bg-green-100 text-green-600' :
                            product.status === 'warning' ? 'bg-red-100 text-red-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {product.status === 'active' ? '在售' : product.status === 'warning' ? '库存预警' : '已停售'}
                          </span>
                        </td>
                        <td className="py-3">
                          <button className="text-blue-600 hover:underline text-sm mr-2">编辑</button>
                          <button className="text-gray-600 hover:underline text-sm mr-2">调价</button>
                          <button className="text-red-600 hover:underline text-sm">停售</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 分页 */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">共 10 条记录，每页显示 20 条</p>
                <div className="flex gap-2">
                  <button className="px-3 py-1 border rounded hover:bg-gray-50" disabled>上一页</button>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded">1</button>
                  <button className="px-3 py-1 border rounded hover:bg-gray-50">2</button>
                  <button className="px-3 py-1 border rounded hover:bg-gray-50">3</button>
                  <button className="px-3 py-1 border rounded hover:bg-gray-50">下一页</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 供应链 */}
        {activeTab === 'supply' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">供应链管理</h2>
            
            {/* 采购管理 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">总部采购订单</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3">订单号</th>
                      <th className="pb-3">供应商</th>
                      <th className="pb-3">金额</th>
                      <th className="pb-3">状态</th>
                      <th className="pb-3">创建时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { no: 'PO20240117001', supplier: '农夫山泉股份', amount: 15000, status: 'shipped' },
                      { no: 'PO20240117002', supplier: '康师傅集团', amount: 8500, status: 'approved' },
                      { no: 'PO20240116001', supplier: '伊利乳业', amount: 22000, status: 'completed' },
                    ].map((po, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 font-mono">{po.no}</td>
                        <td className="py-3">{po.supplier}</td>
                        <td className="py-3 text-red-600">¥{po.amount.toLocaleString()}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            po.status === 'shipped' ? 'bg-blue-100 text-blue-600' :
                            po.status === 'approved' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {po.status === 'shipped' ? '已发货' : po.status === 'approved' ? '待发货' : '已完成'}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">{po.no.slice(-8)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 配送管理 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">智能配送调度</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { route: '总仓 → 望京店', items: 15, eta: '2小时后' },
                  { route: '总仓 → 国贸店', items: 12, eta: '3小时后' },
                  { route: '总仓 → 中关村店', items: 8, eta: '4小时后' },
                ].map((delivery, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🚚</span>
                      <span className="font-medium">{delivery.route}</span>
                    </div>
                    <p className="text-sm text-gray-500">{delivery.items}件商品 · 预计{delivery.eta}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 财务中心 */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">财务中心</h2>
            
            {/* 对账概览 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: '今日收款', value: '¥21,540', icon: '💰', color: 'green' },
                { label: '待确认缴款', value: '¥8,500', icon: '📮', color: 'yellow' },
                { label: '本月支出', value: '¥156,000', icon: '💸', color: 'red' },
                { label: '账户余额', value: '¥892,500', icon: '🏦', color: 'blue' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{item.value}</p>
                </div>
              ))}
            </div>

            {/* 门店收银明细 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              {/* 标题和时间筛选 */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="font-semibold">门店收银明细</h3>
                
                {/* 时间范围选择 */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { key: 'today', label: '今日' },
                    { key: 'week', label: '近7天' },
                    { key: 'month', label: '近30天' },
                    { key: 'year', label: '近1年' },
                    { key: 'custom', label: '自定义' },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => setFinanceTimeRange(item.key as TimeRange)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        financeTimeRange === item.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                  
                  {/* 自定义日期选择 */}
                  {financeTimeRange === 'custom' && (
                    <div className="flex items-center gap-2 ml-2">
                      <input
                        type="date"
                        value={financeDateStart}
                        onChange={(e) => setFinanceDateStart(e.target.value)}
                        className="px-3 py-1.5 border rounded-lg text-sm"
                      />
                      <span className="text-gray-400">至</span>
                      <input
                        type="date"
                        value={financeDateEnd}
                        onChange={(e) => setFinanceDateEnd(e.target.value)}
                        className="px-3 py-1.5 border rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* 当前时间范围提示 */}
              <div className="mb-4 px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700">
                📅 当前查询：<span className="font-medium">{formatDateRange()}</span>
                {financeTimeRange !== 'today' && financeTimeRange !== 'custom' && (
                  <span className="ml-2 text-blue-500">
                    ({financeRange.start.toLocaleDateString('zh-CN')} ~ {financeRange.end.toLocaleDateString('zh-CN')})
                  </span>
                )}
                {financeTimeRange === 'custom' && (
                  <span className="ml-2 text-blue-500">
                    ({financeDateStart} ~ {financeDateEnd})
                  </span>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3">门店</th>
                      <th className="pb-3">收银总数</th>
                      <th className="pb-3">现金收款</th>
                      <th className="pb-3">微信支付</th>
                      <th className="pb-3">支付宝</th>
                      <th className="pb-3">云闪付</th>
                      <th className="pb-3">会员卡</th>
                      <th className="pb-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.map(store => {
                      const stats = getStoreStats(store.id);
                      return (
                        <tr key={store.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🏪</span>
                              <div>
                                <p className="font-medium">{store.name}</p>
                                <p className="text-xs text-gray-500">{store.code}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="text-lg font-bold text-green-600">¥{stats.total.toLocaleString()}</span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              <span>💵</span>
                              <span className="text-orange-600">¥{stats.cash.toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              <span className="text-green-500">💚</span>
                              <span className="text-green-600">¥{stats.wechat.toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              <span className="text-blue-500">💙</span>
                              <span className="text-blue-600">¥{stats.alipay.toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              <span className="text-red-400">💳</span>
                              <span className="text-gray-600">¥{stats.unionpay.toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              <span>👤</span>
                              <span className="text-purple-600">¥{stats.member.toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <button className="text-blue-600 hover:underline text-sm">查看详情</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const totals = stores.reduce((acc, store) => {
                        const stats = getStoreStats(store.id);
                        return {
                          total: acc.total + stats.total,
                          cash: acc.cash + stats.cash,
                          wechat: acc.wechat + stats.wechat,
                          alipay: acc.alipay + stats.alipay,
                          unionpay: acc.unionpay + stats.unionpay,
                          member: acc.member + stats.member,
                        };
                      }, { total: 0, cash: 0, wechat: 0, alipay: 0, unionpay: 0, member: 0 });
                      return (
                        <tr className="bg-gray-50 font-semibold">
                          <td className="py-3">合计</td>
                          <td className="py-3 text-lg text-green-600">¥{totals.total.toLocaleString()}</td>
                          <td className="py-3 text-orange-600">¥{totals.cash.toLocaleString()}</td>
                          <td className="py-3 text-green-600">¥{totals.wechat.toLocaleString()}</td>
                          <td className="py-3 text-blue-600">¥{totals.alipay.toLocaleString()}</td>
                          <td className="py-3 text-gray-600">¥{totals.unionpay.toLocaleString()}</td>
                          <td className="py-3 text-purple-600">¥{totals.member.toLocaleString()}</td>
                          <td></td>
                        </tr>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>
              
              {/* 支付方式图例 */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">支付方式说明：</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <span>💵</span> 现金：门店收取的现金，需缴款至总部
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-green-500">💚</span> 微信支付：直连总部账户
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-blue-500">💙</span> 支付宝：直连总部账户
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-red-400">💳</span> 云闪付/数字人民币：直连总部账户
                  </span>
                  <span className="flex items-center gap-1">
                    <span>👤</span> 会员卡：会员余额/积分抵扣
                  </span>
                </div>
              </div>
            </div>

            {/* 缴款单管理 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="font-semibold">门店缴款单</h3>
                
                {/* 时间范围选择 */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { key: 'thisMonth', label: '本月' },
                    { key: 'lastMonth', label: '上月' },
                    { key: 'threeMonths', label: '近3月' },
                    { key: 'thisYear', label: '本年' },
                    { key: 'custom', label: '自定义' },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => setDepositTimeRange(item.key as DepositTimeRange)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        depositTimeRange === item.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                  
                  {/* 自定义日期选择 */}
                  {depositTimeRange === 'custom' && (
                    <div className="flex items-center gap-2 ml-2">
                      <input
                        type="date"
                        value={depositDateStart}
                        onChange={(e) => setDepositDateStart(e.target.value)}
                        className="px-3 py-1.5 border rounded-lg text-sm"
                      />
                      <span className="text-gray-400">至</span>
                      <input
                        type="date"
                        value={depositDateEnd}
                        onChange={(e) => setDepositDateEnd(e.target.value)}
                        className="px-3 py-1.5 border rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* 月度汇总统计 */}
              <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-600">查询区间</p>
                  <p className="text-lg font-bold text-blue-800">{formatDepositRange()}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm text-green-600">已确认金额</p>
                  <p className="text-lg font-bold text-green-800">¥{currentMonthStats.confirmed.toLocaleString()}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-sm text-yellow-600">待确认金额</p>
                  <p className="text-lg font-bold text-yellow-800">¥{currentMonthStats.pending.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-sm text-purple-600">记录总数</p>
                  <p className="text-lg font-bold text-purple-800">{currentMonthStats.count} 笔</p>
                </div>
              </div>
              
              {/* 历史月度汇总 */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">历史月度汇总：</p>
                <div className="flex flex-wrap gap-2">
                  {monthlySummary.slice(0, 6).map(item => (
                    <button
                      key={item.month}
                      onClick={() => {
                        setDepositTimeRange('custom');
                        const [year, month] = item.month.split('-');
                        const startDate = `${year}-${month}-01`;
                        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
                        setDepositDateStart(startDate);
                        setDepositDateEnd(endDate);
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="ml-2 text-green-600">¥{item.confirmed.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 缴款记录列表 */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3">单号</th>
                      <th className="pb-3">门店</th>
                      <th className="pb-3">金额</th>
                      <th className="pb-3">方式</th>
                      <th className="pb-3">状态</th>
                      <th className="pb-3">日期</th>
                      <th className="pb-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeposits.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400">
                          暂无缴款记录
                        </td>
                      </tr>
                    ) : (
                      filteredDeposits.map(deposit => (
                        <tr key={deposit.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 font-mono text-sm text-gray-600">{deposit.id}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span>🏪</span>
                              <span>{deposit.store}</span>
                            </div>
                          </td>
                          <td className="py-3 text-red-600 font-medium">¥{deposit.amount.toLocaleString()}</td>
                          <td className="py-3">{deposit.method}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              deposit.status === 'confirmed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                              {deposit.status === 'confirmed' ? '已确认' : '待确认'}
                            </span>
                          </td>
                          <td className="py-3 text-gray-500">{deposit.date}</td>
                          <td className="py-3">
                            <button className="text-blue-600 hover:underline text-sm mr-2">查看</button>
                            {deposit.status === 'pending' && (
                              <button className="text-green-600 hover:underline text-sm">确认收款</button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* 导出按钮 */}
              <div className="mt-4 pt-4 border-t flex justify-end">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <span>📥</span> 导出{formatDepositRange()}缴款记录
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 会员管理 */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">会员管理 (CRM)</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="搜索手机号/姓名"
                  className="px-4 py-2 border rounded-lg"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">导出</button>
              </div>
            </div>
            
            {/* 会员等级分布 */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { level: '钻石会员', count: 128, color: 'purple' },
                { level: '金卡会员', count: 856, color: 'yellow' },
                { level: '银卡会员', count: 2350, color: 'gray' },
                { level: '普通会员', count: 9246, color: 'blue' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm text-center">
                  <div className={`w-12 h-12 mx-auto bg-${item.color}-100 rounded-full flex items-center justify-center mb-2`}>
                    <span className="text-2xl">{item.color === 'purple' ? '💎' : item.color === 'yellow' ? '🥇' : item.color === 'gray' ? '🥈' : '👤'}</span>
                  </div>
                  <p className="font-semibold">{item.count.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{item.level}</p>
                </div>
              ))}
            </div>

            {/* 会员列表 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">会员列表</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3">姓名</th>
                      <th className="pb-3">手机号</th>
                      <th className="pb-3">等级</th>
                      <th className="pb-3">积分</th>
                      <th className="pb-3">余额</th>
                      <th className="pb-3">累计消费</th>
                      <th className="pb-3">标签</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: '张伟', phone: '13700137000', level: 'diamond', points: 25000, balance: 500, consume: 35000, tags: ['高频', 'VIP'] },
                      { name: '李明', phone: '13800138000', level: 'gold', points: 5680, balance: 120, consume: 6500, tags: ['高频', '爱喝饮料'] },
                      { name: '王芳', phone: '13900139000', level: 'silver', points: 1200, balance: 50, consume: 1500, tags: ['零食爱好者'] },
                    ].map((member, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 font-medium">{member.name}</td>
                        <td className="py-3">{member.phone}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            member.level === 'diamond' ? 'bg-purple-100 text-purple-600' :
                            member.level === 'gold' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {member.level === 'diamond' ? '💎钻石' : member.level === 'gold' ? '🥇金卡' : '🥈银卡'}
                          </span>
                        </td>
                        <td className="py-3">{member.points.toLocaleString()}</td>
                        <td className="py-3 text-green-600">¥{member.balance}</td>
                        <td className="py-3">¥{member.consume.toLocaleString()}</td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            {member.tags.map((tag, j) => (
                              <span key={j} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">{tag}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 订单管理 */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">订单管理</h2>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  {['全部', 'POS', '小程序', '外卖', '团购'].map((type, i) => (
                    <button
                      key={i}
                      className={`px-3 py-1 rounded-lg text-sm ${i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="搜索订单号"
                  className="px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3">订单号</th>
                      <th className="pb-3">类型</th>
                      <th className="pb-3">门店</th>
                      <th className="pb-3">金额</th>
                      <th className="pb-3">支付方式</th>
                      <th className="pb-3">状态</th>
                      <th className="pb-3">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { no: 'POS20240117001', type: 'POS', store: '望京店', amount: 35.50, pay: '微信', status: 'completed', time: '10:30' },
                      { no: 'MINI20240117002', type: '小程序', store: '国贸店', amount: 128.00, pay: '支付宝', status: 'completed', time: '10:15' },
                      { no: 'DEL20240117003', type: '外卖', store: '中关村店', amount: 45.00, pay: '美团', status: 'completed', time: '09:50' },
                      { no: 'GRP20240117004', type: '团购', store: '望京店', amount: 89.00, pay: '微信', status: 'pending', time: '09:30' },
                    ].map((order, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 font-mono text-sm">{order.no}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            order.type === 'POS' ? 'bg-green-100 text-green-600' :
                            order.type === '小程序' ? 'bg-orange-100 text-orange-600' :
                            order.type === '外卖' ? 'bg-red-100 text-red-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {order.type}
                          </span>
                        </td>
                        <td className="py-3">{order.store}</td>
                        <td className="py-3 text-red-600">¥{order.amount.toFixed(2)}</td>
                        <td className="py-3">{order.pay}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {order.status === 'completed' ? '已完成' : '待处理'}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">{order.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 人员管理 */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">人员管理</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">添加员工</button>
            </div>

            {/* 考勤概览 */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: '今日出勤', value: '95%', icon: '✅' },
                { label: '迟到', value: '3人', icon: '⏰' },
                { label: '早退', value: '1人', icon: '🏃' },
                { label: '请假', value: '2人', icon: '🏥' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-sm text-gray-500">{item.label}</p>
                      <p className="font-semibold">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 员工列表 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">员工列表</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3">姓名</th>
                      <th className="pb-3">手机号</th>
                      <th className="pb-3">角色</th>
                      <th className="pb-3">门店</th>
                      <th className="pb-3">入职时间</th>
                      <th className="pb-3">状态</th>
                      <th className="pb-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: '张三', phone: '13800138000', role: '店长', store: '望京店', date: '2023-01-15', status: 'active' },
                      { name: '李四', phone: '13900139000', role: '收银员', store: '望京店', date: '2023-06-01', status: 'active' },
                      { name: '王五', phone: '13700137000', role: '店长', store: '国贸店', date: '2022-08-20', status: 'active' },
                      { name: '赵六', phone: '13600136000', role: '收银员', store: '中关村店', date: '2023-03-10', status: 'inactive' },
                    ].map((emp, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 font-medium">{emp.name}</td>
                        <td className="py-3">{emp.phone}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            emp.role === '店长' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="py-3">{emp.store}</td>
                        <td className="py-3 text-gray-500">{emp.date}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            emp.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {emp.status === 'active' ? '在职' : '离职'}
                          </span>
                        </td>
                        <td className="py-3">
                          <button className="text-blue-600 hover:underline text-sm mr-3">编辑</button>
                          <button className="text-red-600 hover:underline text-sm">考勤</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
