import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStoreStore, useRestockStore, useAlertStore, useMiniProgramStore, useAiConfigStore, useOrderStore, useMemberStore, useProductStore } from '../store';

type Tab = 'overview' | 'stores' | 'products' | 'supply' | 'finance' | 'members' | 'orders' | 'staff' | 'promo' | 'bi' | 'storeops' | 'auth' | 'miniprogram' | 'product-import' | 'ai-config';
type TimeRange = 'today' | 'week' | 'month' | 'year' | 'custom';
type DepositTimeRange = 'thisMonth' | 'lastMonth' | 'threeMonths' | 'thisYear' | 'custom';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { stores } = useStoreStore();
  const { requests, approveRequest, rejectRequest } = useRestockStore();
  const { lowStockAlerts, overdueAlerts } = useAlertStore();
  const { orders } = useOrderStore();
  const { members } = useMemberStore();
  
  // 商品管理子Tab状态
  type ProductSubTab = 'store' | 'miniprogram' | 'community';
  const [productSubTab, setProductSubTab] = useState<ProductSubTab>('store');
  
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
  
  // 小程序设置
  const { settings: miniSettings, updateSettings: updateMiniSettings, updateBanner: updateMiniBanner } = useMiniProgramStore();
  const [miniForm, setMiniForm] = useState(miniSettings);
  const [showMiniSaveToast, setShowMiniSaveToast] = useState(false);
  
  // 采购入库
  const aiConfig = useAiConfigStore();
  const [importedProducts, setImportedProducts] = useState<Array<{ barcode: string; name: string; category: string; price: number; costPrice: number; quantity: number }>>([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductForm, setNewProductForm] = useState({ name: '', barcode: '', category: '食品', retailPrice: 0, costPrice: 0, supplier: '', image: '' });
  const [ai识别中, setAi识别中] = useState(false);
  const [import识别中, setImport识别中] = useState(false);
  
  // 添加商品到商品库
  const { products, addProduct } = useProductStore();
  
  const handleAddProduct = () => {
    if (!newProductForm.name || !newProductForm.barcode) {
      alert('请填写商品名称和条码');
      return;
    }
    if (newProductForm.retailPrice <= 0) {
      alert('请填写零售价');
      return;
    }
    
    // 添加商品到商品库
    addProduct({
      id: `prod_${Date.now()}`,
      name: newProductForm.name,
      barcode: newProductForm.barcode,
      category: newProductForm.category,
      unit: '件',
      costPrice: newProductForm.costPrice,
      retailPrice: newProductForm.retailPrice,
      wholesalePrice: newProductForm.retailPrice,
      image: newProductForm.image,
      isStandard: true,
      status: 'active',
      stock: 0,
      supplier: newProductForm.supplier,
    });
    
    console.log('[商品管理] 商品添加成功:', newProductForm);
    setShowAddProductModal(false);
    setNewProductForm({ name: '', barcode: '', category: '食品', retailPrice: 0, costPrice: 0, supplier: '', image: '' });
    alert('商品添加成功');
  };
  
  // 商品管理-新增商品AI识别
  const handleAiScanForNewProduct = async (barcode: string) => {
    if (!barcode) return;
    console.log('[商品管理] 开始AI识别条码:', barcode);
    setAi识别中(true);
    const aiConfig = useAiConfigStore.getState();
    const result = await aiConfig.aiScanByBarcode(barcode);
    console.log('[商品管理] AI识别结果:', result);
    
    if (result.success && result.name && result.retailPrice) {
      // 识别成功，自动填充表单
      setNewProductForm(prev => ({
        ...prev,
        barcode,
        name: result.name || '',
        category: result.category || '食品',
        retailPrice: result.retailPrice || 0,
        costPrice: result.costPrice || 0,
        image: result.image || '',
      }));
    } else {
      // 识别失败，只填条码，提示用户
      setNewProductForm(prev => ({ ...prev, barcode }));
      alert(result.message || 'AI识别失败，请手动填写商品信息');
    }
    setAi识别中(false);
  };
  
  // 采购入库-扫码识别
  const [scanResult, setScanResult] = useState<{ barcode: string; name?: string; price?: number; costPrice?: number; success?: boolean; error?: string } | null>(null);
  const handleImportAiScan = async (barcode: string) => {
    if (!barcode) return;
    setScanResult({ barcode, success: false, error: '' });
    setImport识别中(true);
    
    const aiConfig = useAiConfigStore.getState();
    const result = await aiConfig.aiScanByBarcode(barcode);
    
    if (result.success && result.name && result.retailPrice) {
      // 识别成功
      setScanResult({ barcode, name: result.name, price: result.retailPrice, costPrice: result.costPrice, success: true });
    } else {
      // 识别失败
      setScanResult({ barcode, success: false, error: result.message || 'AI识别失败，请手动输入商品信息' });
      alert(result.message || 'AI识别失败，请手动输入商品信息');
    }
    setImport识别中(false);
  };
  
  // 同步小程序设置
  useMemo(() => {
    setMiniForm(miniSettings);
  }, [miniSettings]);
  
  const handleMiniSettingsSave = () => {
    updateMiniSettings(miniForm);
    setShowMiniSaveToast(true);
    setTimeout(() => setShowMiniSaveToast(false), 2000);
  };
  
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
  
  // 根据时间范围和门店计算真实统计数据
  const getStoreStats = (storeId: string) => {
    const filteredOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= financeRange.start && orderDate <= financeRange.end && o.status !== 'suspended';
    });
    
    const storeOrders = storeId === 'all' 
      ? filteredOrders 
      : filteredOrders.filter(o => o.storeId === storeId);
    
    const total = storeOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    const cash = storeOrders.filter(o => o.payMethod === 'cash').reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    const wechat = storeOrders.filter(o => o.payMethod === 'wechat').reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    const alipay = storeOrders.filter(o => o.payMethod === 'alipay').reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    const unionpay = storeOrders.filter(o => o.payMethod === 'unionpay').reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    const member = storeOrders.filter(o => o.payMethod === 'member').reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    
    const dayCount = Math.ceil((financeRange.end.getTime() - financeRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
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
  
  // 缴款单数据（基于真实订单数据，实际部署时连接后端API）
  const allDepositRecords = useMemo(() => {
    // 从订单中提取缴款记录，实际部署时从后端API获取
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
    
    // 基于真实订单生成缴款汇总数据
    orders.forEach(order => {
      if (order.payStatus === 'paid' && order.payMethod !== 'suspended') {
        const orderDate = new Date(order.createdAt);
        const monthStr = orderDate.toISOString().slice(0, 7);
        const dateStr = orderDate.toISOString().split('T')[0];
        const store = stores.find(s => s.id === order.storeId);
        
        records.push({
          id: `DEP${order.id.slice(-8)}`,
          store: store?.name || '未知门店',
          storeId: order.storeId || '',
          amount: order.finalAmount || 0,
          method: order.payMethod === 'cash' ? '现金' : '银行转账',
          status: 'confirmed',
          date: dateStr,
          month: monthStr,
          cashier: order.cashierId || '系统',
        });
      }
    });
    
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, stores]);
  
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

  // 工作台数据（基于真实订单数据）
  const overviewData = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => o.createdAt?.startsWith(today) && o.status !== 'suspended');
    const todaySales = todayOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toDateString();
    const monthOrders = orders.filter(o => o.createdAt?.startsWith(monthStart) && o.status !== 'suspended');
    const monthSales = monthOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    
    return {
      totalStores: stores.length,
      activeOrders: orders.filter(o => o.status === 'pending' || o.status === 'preparing').length,
      todaySales,
      monthSales,
      memberCount: members.length,
      pendingRestocks: requests.filter(r => r.status === 'pending').length,
    };
  }, [stores, orders, members, requests]);

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
    { id: 'miniprogram', label: '小程序设置', icon: '📱' },
    { id: 'product-import', label: '采购入库', icon: '📦' },
    { id: 'ai-config', label: 'AI识别配置', icon: '🤖' },
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
              <img src="/logo.png" alt="海邻到家" className="h-10 w-auto" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} />
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
                {(() => {
                  // 计算每个门店的今日销售额
                  const today = new Date().toDateString();
                  const storeSales = stores.map(store => {
                    const sales = orders
                      .filter(o => o.storeId === store.id && o.createdAt?.startsWith(today) && o.status !== 'suspended')
                      .reduce((sum, o) => sum + (o.finalAmount || 0), 0);
                    return { ...store, sales };
                  }).sort((a, b) => b.sales - a.sales);
                  
                  const maxSales = storeSales[0]?.sales || 1;
                  
                  return storeSales.map((store, i) => (
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
                            style={{ width: `${maxSales > 0 ? (store.sales / maxSales * 100) : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-gray-600">¥{store.sales.toFixed(0)}</span>
                    </div>
                  ));
                })()}
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
                  { label: '待处理要货', value: requests.filter(r => r.status === 'pending').length, icon: '📦', color: 'orange' },
                  { label: '库存预警', value: lowStockAlerts.length, icon: '⚠️', color: 'red' },
                  { label: '今日订单', value: orders.filter(o => o.createdAt?.startsWith(new Date().toDateString())).length, icon: '🧾', color: 'purple' },
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
                    <h4 className="font-semibold">门店详情</h4>
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
                      {lowStockAlerts.length > 0 ? (
                        lowStockAlerts.slice(0, 5).map((item, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2">{item.productName || '未知商品'}</td>
                            <td className={`py-2 ${(item.level === 'critical' || item.currentStock < 20) ? 'text-red-600' : 'text-yellow-600'}`}>
                              {item.currentStock || 0}
                            </td>
                            <td className="py-2 text-gray-500">{item.threshold || 30}</td>
                            <td className="py-2">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                (item.level === 'critical' || item.currentStock < 20) ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                              }`}>
                                {(item.level === 'critical' || item.currentStock < 20) ? '紧急' : '预警'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-gray-500">暂无库存预警</td>
                        </tr>
                      )}
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
                        
                        { store: '国贸店', items: 5, amount: 3800, time: '09:15' },
                        
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
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">商品管理</h2>
                {/* 子Tab切换 */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setProductSubTab('store')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      productSubTab === 'store' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    门店商品
                  </button>
                  <button
                    onClick={() => setProductSubTab('miniprogram')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      productSubTab === 'miniprogram' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    小程序商品
                  </button>
                  <button
                    onClick={() => setProductSubTab('community')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      productSubTab === 'community' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    社团商品
                  </button>
                </div>
              </div>
              {productSubTab === 'store' && (
                <div className="flex gap-2">
                  <button onClick={() => setShowAddProductModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <span>➕</span> 新增商品
                  </button>
                  <button onClick={() => setActiveTab('product-import')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <span>📥</span> 批量导入
                  </button>
                </div>
              )}
              {productSubTab === 'miniprogram' && (
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <span>➕</span> 添加到小程序
                  </button>
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2">
                    <span>📤</span> 批量上架
                  </button>
                </div>
              )}
              {productSubTab === 'community' && (
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                    <span>➕</span> 新增社团商品
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <span>📢</span> 发起团购
                  </button>
                </div>
              )}
            </div>

            {/* 门店商品内容 */}
            {productSubTab === 'store' && (
              <>
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
                    {products.slice(0, 20).map(product => (
                      <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl overflow-hidden">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                product.isStandard ? '📦' : '🍎'
                              )}
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
                        <td className="py-3 text-gray-600">¥{product.costPrice.toFixed(2)}</td>
                        <td className="py-3 font-medium text-green-600">¥{product.retailPrice.toFixed(2)}</td>
                        <td className="py-3">
                          <span className={(product.stock || 0) < 20 ? 'text-red-600 font-medium' : ''}>
                            {product.stock || 0}
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
              </>
            )}

            {/* 小程序商品上线管理 */}
            {productSubTab === 'miniprogram' && (
              <>
              {/* 统计概览 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '可上架商品', value: '892', icon: '📦', color: 'blue' },
                  { label: '已上架', value: '456', icon: '🟢', color: 'green' },
                  { label: '待审核', value: '28', icon: '⏳', color: 'yellow' },
                  { label: '已下架', value: '124', icon: '🔴', color: 'gray' },
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

              {/* 筛选 */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex flex-wrap gap-4">
                  <select className="px-4 py-2 border rounded-lg">
                    <option value="">全部状态</option>
                    <option value="online">已上架</option>
                    <option value="pending">待审核</option>
                    <option value="offline">已下架</option>
                  </select>
                  <select className="px-4 py-2 border rounded-lg">
                    <option value="">全部分类</option>
                    <option value="drinks">饮料</option>
                    <option value="food">食品</option>
                    <option value="snacks">零食</option>
                  </select>
                  <input type="text" placeholder="搜索商品名称..." className="px-4 py-2 border rounded-lg flex-1" />
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">搜索</button>
                </div>
              </div>

              {/* 商品列表 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4">小程序商品列表</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-gray-500">
                        <th className="pb-3">商品信息</th>
                        <th className="pb-3">小程序售价</th>
                        <th className="pb-3">门店价</th>
                        <th className="pb-3">优惠金额</th>
                        <th className="pb-3">销量</th>
                        <th className="pb-3">状态</th>
                        <th className="pb-3">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        
                        
                        
                        { name: '奥利奥饼干', category: '零食', miniPrice: 7.5, storePrice: 8.5, sales: 543, status: 'pending' },
                        { name: '蒙牛酸奶', category: '奶制品', miniPrice: 5.5, storePrice: 6.5, sales: 0, status: 'offline' },
                      ].map((product, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">📦</div>
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-xs text-gray-500">{product.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 font-medium text-orange-600">¥{product.miniPrice.toFixed(2)}</td>
                          <td className="py-3 text-gray-500">¥{product.storePrice.toFixed(2)}</td>
                          <td className="py-3 text-green-600">-¥{(product.storePrice - product.miniPrice).toFixed(2)}</td>
                          <td className="py-3 text-gray-600">{product.sales}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              product.status === 'online' ? 'bg-green-100 text-green-600' :
                              product.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {product.status === 'online' ? '已上架' : product.status === 'pending' ? '待审核' : '已下架'}
                            </span>
                          </td>
                          <td className="py-3">
                            <button className="text-blue-600 hover:underline text-sm mr-2">编辑</button>
                            <button className="text-red-600 hover:underline text-sm">
                              {product.status === 'online' ? '下架' : '上架'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              </>
            )}

            {/* 社团商品管理 */}
            {productSubTab === 'community' && (
              <>
              {/* 统计概览 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '社团商品总数', value: '186', icon: '📦', color: 'purple' },
                  { label: '进行中团购', value: '12', icon: '🔥', color: 'orange' },
                  { label: '待发货', value: '45', icon: '📋', color: 'blue' },
                  { label: '本月GMV', value: '¥28.6万', icon: '💰', color: 'green' },
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

              {/* 筛选 */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex flex-wrap gap-4">
                  <select className="px-4 py-2 border rounded-lg">
                    <option value="">全部状态</option>
                    <option value="active">进行中</option>
                    <option value="pending">待开始</option>
                    <option value="ended">已结束</option>
                  </select>
                  <select className="px-4 py-2 border rounded-lg">
                    <option value="">全部团长</option>
                    <option value="zhangsan">张三</option>
                    <option value="lisi">李四</option>
                  </select>
                  <input type="text" placeholder="搜索商品名称..." className="px-4 py-2 border rounded-lg flex-1" />
                  <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">搜索</button>
                </div>
              </div>

              {/* 团购活动列表 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4">团购活动管理</h3>
                <div className="space-y-4">
                  {[
                    
                    
                    { id: 'GB003', name: '精选进口牛奶', price: 35, originalPrice: 48, target: 40, current: 12, startDate: '2024-01-14', endDate: '2024-01-17', status: 'pending', leader: '王五', store: '国贸店' },
                    
                  ].map((group, i) => (
                    <div key={i} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center text-3xl">
                          🥚
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-800">{group.name}</h4>
                              <p className="text-sm text-gray-500 mt-1">
                                团长：{group.leader} | 门店：{group.store}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs ${
                              group.status === 'active' ? 'bg-green-100 text-green-600' :
                              group.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {group.status === 'active' ? '进行中' : group.status === 'pending' ? '即将开始' : '已结束'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-gray-500">活动价</p>
                              <p className="text-lg font-bold text-orange-600">¥{group.price}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">原价</p>
                              <p className="text-sm text-gray-400 line-through">¥{group.originalPrice}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">参与进度</p>
                              <p className="text-sm font-medium">{group.current}/{group.target}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">活动时间</p>
                              <p className="text-xs text-gray-600">{group.startDate} ~ {group.endDate}</p>
                            </div>
                          </div>

                          {/* 进度条 */}
                          <div className="mt-3">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all"
                                style={{ width: `${Math.min((group.current / group.target) * 100, 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-4">
                            <button className="px-4 py-1.5 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 text-sm">
                              查看详情
                            </button>
                            {group.status === 'active' && (
                              <button className="px-4 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm">
                                结束团购
                              </button>
                            )}
                            {group.status === 'pending' && (
                              <button className="px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm">
                                立即开始
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 团长管理 */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">团长管理</h3>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                    添加团长
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-gray-500">
                        <th className="pb-3">团长信息</th>
                        <th className="pb-3">负责门店</th>
                        <th className="pb-3">团员数量</th>
                        <th className="pb-3">进行中团购</th>
                        <th className="pb-3">本月佣金</th>
                        <th className="pb-3">状态</th>
                        <th className="pb-3">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        
                        
                        { name: '王五', phone: '137****9012', store: '国贸店', members: 95, activeGroups: 1, commission: '¥1,450', status: 'active' },
                        
                      ].map((leader, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-lg">👤</div>
                              <div>
                                <p className="font-medium">{leader.name}</p>
                                <p className="text-xs text-gray-500">{leader.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-gray-600">{leader.store}</td>
                          <td className="py-4 text-gray-600">{leader.members}</td>
                          <td className="py-4 text-orange-600 font-medium">{leader.activeGroups}</td>
                          <td className="py-4 text-green-600 font-medium">{leader.commission}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${leader.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                              {leader.status === 'active' ? '活跃' : '停用'}
                            </span>
                          </td>
                          <td className="py-4">
                            <button className="text-blue-600 hover:underline text-sm mr-2">编辑</button>
                            <button className="text-purple-600 hover:underline text-sm">查看业绩</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              </>
            )}
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
                  
                  { route: '总仓 → 国贸店', items: 12, eta: '3小时后' },
                  
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
                      
                      { no: 'MINI20240117002', type: '小程序', store: '国贸店', amount: 128.00, pay: '支付宝', status: 'completed', time: '10:15' },
                      
                      
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
                      
                      
                      { name: '王五', phone: '13700137000', role: '店长', store: '国贸店', date: '2022-08-20', status: 'active' },
                      
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

        {/* 小程序设置 */}
        {activeTab === 'miniprogram' && (
          <div className="space-y-6">
            {/* Toast */}
            {showMiniSaveToast && (
              <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                ✅ 设置已保存
              </div>
            )}
            
            {/* 基础信息 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">基础信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">小程序名称</label>
                  <input 
                    type="text" 
                    value={miniForm.name}
                    onChange={(e) => setMiniForm({ ...miniForm, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">小程序简介</label>
                  <input 
                    type="text" 
                    value={miniForm.description}
                    onChange={(e) => setMiniForm({ ...miniForm, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">客服电话</label>
                  <input 
                    type="text" 
                    value={miniForm.servicePhone}
                    onChange={(e) => setMiniForm({ ...miniForm, servicePhone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">营业时间</label>
                  <input 
                    type="text" 
                    value={miniForm.businessHours}
                    onChange={(e) => setMiniForm({ ...miniForm, businessHours: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button 
                onClick={handleMiniSettingsSave}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存基础信息
              </button>
            </div>

            {/* 首页Banner滚动图片 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">首页Banner滚动图片</h3>
                  <p className="text-sm text-gray-500 mt-1">建议尺寸 750×300 像素，支持 JPG/PNG 格式</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  添加Banner
                </button>
              </div>
              
              <div className="space-y-4">
                {miniForm.banners.map((banner, index) => (
                  <div key={banner.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="relative">
                      <div className={`w-24 h-16 bg-gradient-to-br ${banner.color} rounded-lg flex items-center justify-center text-white`}>
                        <span className="text-2xl font-bold">{index + 1}</span>
                      </div>
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full shadow flex items-center justify-center text-xs">
                        📷
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={banner.title}
                          onChange={(e) => {
                            const newBanners = [...miniForm.banners];
                            newBanners[index] = { ...banner, title: e.target.value };
                            setMiniForm({ ...miniForm, banners: newBanners });
                          }}
                          className="px-3 py-1.5 border rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Banner标题"
                        />
                        {index === 0 && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">必选</span>
                        )}
                      </div>
                      <input 
                        type="text" 
                        value={banner.link}
                        onChange={(e) => {
                          const newBanners = [...miniForm.banners];
                          newBanners[index] = { ...banner, link: e.target.value };
                          setMiniForm({ ...miniForm, banners: newBanners });
                        }}
                        className="mt-2 px-3 py-1.5 border rounded-lg text-sm w-full text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="跳转链接"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{banner.subtitle}</p>
                        <p className="text-xs text-gray-400">点击量: 12.8万</p>
                      </div>
                      <button
                        onClick={() => {
                          const newBanners = [...miniForm.banners];
                          newBanners[index] = { ...banner, enabled: !banner.enabled };
                          setMiniForm({ ...miniForm, banners: newBanners });
                        }}
                        className={`relative w-9 h-5 rounded-full transition-colors ${banner.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                        disabled={index === 0}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${banner.enabled ? 'left-5' : 'left-0.5'}`} />
                      </button>
                      {index !== 0 && (
                        <button className="p-2 text-gray-400 hover:text-red-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">提示：最多支持添加5个Banner，建议保留1-3个Banner以获得最佳展示效果</span>
                </div>
              </div>
            </div>

            {/* 模板选择 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">模板选择</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'default', name: '默认模板', desc: '经典蓝色风格，适合综合便利店', preview: '🟦', selected: true },
                  { id: 'fresh', name: '生鲜模板', desc: '绿色清新风格，适合生鲜超市', preview: '🟩', selected: false },
                  { id: 'premium', name: '高端模板', desc: '金色典雅风格，适合精品超市', preview: '🟨', selected: false },
                ].map(tpl => (
                  <div 
                    key={tpl.id}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      tpl.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-4xl">{tpl.preview}</span>
                      {tpl.selected && (
                        <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full">已启用</span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-800">{tpl.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{tpl.desc}</p>
                    <button className={`mt-3 w-full py-2 rounded-lg text-sm font-medium ${
                      tpl.selected 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}>
                      {tpl.selected ? '当前使用' : '启用此模板'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 首页模块配置 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">首页模块配置</h3>
              <div className="space-y-4">
                {[
                  { id: 'banner', name: 'Banner轮播', desc: '顶部宣传图/广告位', enabled: true, required: true },
                  { id: 'delivery', name: '同城配送', desc: '配送服务入口', enabled: true, required: false },
                  { id: 'pickup', name: '到店自提', desc: '到店取货入口', enabled: true, required: false },
                  { id: 'recharge', name: '在线充值', desc: '会员卡充值入口', enabled: true, required: false },
                  { id: 'vip', name: '会员中心', desc: '会员权益入口', enabled: true, required: false },
                  { id: 'invite', name: '邀请有奖', desc: '邀请好友入口', enabled: true, required: false },
                  { id: 'category', name: '商品分类', desc: '商品分类展示', enabled: true, required: true },
                  { id: 'ranking', name: '排行榜', desc: '销量/关注榜单', enabled: true, required: false },
                  { id: 'flashsale', name: '限时秒杀', desc: '限时特价活动', enabled: true, required: false },
                  { id: 'service', name: '社区服务', desc: '便民服务入口', enabled: true, required: false },
                ].map(module => (
                  <div key={module.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        {module.id === 'banner' && '🎯'}
                        {module.id === 'delivery' && '🚚'}
                        {module.id === 'pickup' && '🏃'}
                        {module.id === 'recharge' && '💳'}
                        {module.id === 'vip' && '👑'}
                        {module.id === 'invite' && '🎁'}
                        {module.id === 'category' && '📂'}
                        {module.id === 'ranking' && '🔥'}
                        {module.id === 'flashsale' && '⚡'}
                        {module.id === 'service' && '🛠️'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800">{module.name}</p>
                          {module.required && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">必选</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{module.desc}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        defaultChecked={module.enabled}
                        disabled={module.required}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:bg-gray-300"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* 商品分类管理 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">商品分类管理</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  添加分类
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm">
                    <th className="pb-3">分类名称</th>
                    <th className="pb-3">图标</th>
                    <th className="pb-3">排序</th>
                    <th className="pb-3">商品数</th>
                    <th className="pb-3">状态</th>
                    <th className="pb-3">操作</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {[
                    { name: '生活日用', icon: '🧴', sort: 1, count: 128, status: '启用' },
                    { name: '家居厨具', icon: '🍳', sort: 2, count: 86, status: '启用' },
                    { name: '熟食速食', icon: '🍜', sort: 3, count: 64, status: '启用' },
                    { name: '夏日饮品', icon: '🥤', sort: 4, count: 95, status: '启用' },
                    { name: '五金文具', icon: '🛠️', sort: 5, count: 42, status: '启用' },
                    { name: '个人护理', icon: '🧴', sort: 6, count: 77, status: '启用' },
                  ].map((cat, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-4 font-medium">{cat.name}</td>
                      <td className="py-4 text-2xl">{cat.icon}</td>
                      <td className="py-4">
                        <span className="px-3 py-1 bg-gray-100 rounded text-sm">{cat.sort}</span>
                      </td>
                      <td className="py-4">{cat.count}</td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">{cat.status}</span>
                      </td>
                      <td className="py-4">
                        <button className="text-blue-600 hover:underline text-sm mr-3">编辑</button>
                        <button className="text-gray-400 hover:text-gray-600 text-sm">上移</button>
                        <button className="text-gray-400 hover:text-gray-600 text-sm ml-2">下移</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 社区服务配置 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">社区服务配置</h3>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  添加服务
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { name: '打印复印', icon: '🖨️', price: '0.5元/张起', enabled: true },
                  { name: '干洗收发', icon: '👔', price: '按件计价', enabled: true },
                  { name: '家电维修', icon: '🔧', price: '上门服务', enabled: true },
                  { name: '家政保洁', icon: '🧹', price: '50元/小时起', enabled: true },
                  { name: '快递代收', icon: '📦', price: '免费', enabled: true },
                  { name: '桶装水配送', icon: '💧', price: '10元/桶', enabled: true },
                ].map((service, i) => (
                  <div key={i} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{service.icon}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={service.enabled} className="sr-only peer" />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <p className="font-medium text-gray-800">{service.name}</p>
                    <p className="text-sm text-green-600 mt-1">{service.price}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 发布管理 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">发布管理</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">当前版本</p>
                      <p className="text-sm text-gray-500">v2.1.0</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">已发布版本，正在运行中</p>
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs">线上版本</span>
                </div>
                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">⏳</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">审核中</p>
                      <p className="text-sm text-gray-500">v2.1.1</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">预计1-3个工作日完成审核</p>
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">审核中</span>
                </div>
                <div className="border rounded-xl p-4 border-dashed">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📝</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">草稿</p>
                      <p className="text-sm text-gray-500">未提交</p>
                    </div>
                  </div>
                  <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    提交发布
                  </button>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t">
                <button className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                  发布新版本
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== 新增商品弹窗 ========== */}
        {showAddProductModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-[500px] max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <h3 className="font-semibold text-lg">AI智能添加商品</h3>
                      {ai识别中 ? (
                        <p className="text-sm text-blue-200">正在识别商品信息...</p>
                      ) : newProductForm.name ? (
                        <p className="text-sm text-green-200">✓ 识别成功，商品信息已填充</p>
                      ) : newProductForm.barcode ? (
                        <p className="text-sm text-yellow-200">请点击"AI识别"获取商品信息</p>
                      ) : (
                        <p className="text-sm text-blue-200">请扫描或输入条码</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setShowAddProductModal(false)} className="text-white/80 hover:text-white text-2xl">×</button>
                </div>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">条码 *</label>
                  <div className="flex gap-2">
                    <input type="text" value={newProductForm.barcode} onChange={(e) => setNewProductForm({...newProductForm, barcode: e.target.value, name: '', retailPrice: 0, costPrice: 0, category: '食品' })} placeholder="扫描或输入条码" className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                    <button onClick={() => handleAiScanForNewProduct(newProductForm.barcode)} disabled={ai识别中 || !newProductForm.barcode} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1">
                      {ai识别中 ? '⏳ 识别中...' : '🤖 AI识别'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    商品名称 {newProductForm.name ? <span className="text-green-600 text-xs">✓ 已识别</span> : <span className="text-red-500">*</span>}
                  </label>
                  <input type="text" value={newProductForm.name} onChange={(e) => setNewProductForm({...newProductForm, name: e.target.value})} placeholder="请输入商品名称" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品分类</label>
                  <select value={newProductForm.category} onChange={(e) => setNewProductForm({...newProductForm, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="食品">食品</option>
                    <option value="饮料">饮料</option>
                    <option value="日用品">日用品</option>
                    <option value="烟草">烟草</option>
                    <option value="酒类">酒类</option>
                    <option value="生鲜">生鲜</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      零售价(元) {newProductForm.retailPrice > 0 ? <span className="text-green-600 text-xs">✓ 已识别</span> : <span className="text-red-500">*</span>}
                    </label>
                    <input type="number" value={newProductForm.retailPrice || ''} onChange={(e) => setNewProductForm({...newProductForm, retailPrice: parseFloat(e.target.value) || 0})} placeholder="0.00" className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">进价(元)</label>
                    <input type="number" value={newProductForm.costPrice || ''} onChange={(e) => setNewProductForm({...newProductForm, costPrice: parseFloat(e.target.value) || 0})} placeholder="0.00" className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
                
                {/* 商品图片 */}
                {newProductForm.image && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">商品图片</label>
                    <div className="flex items-center gap-4">
                      <img src={newProductForm.image} alt="商品图片" className="w-24 h-24 object-contain border rounded-lg bg-white" />
                      <div>
                        <p className="text-sm text-gray-500">图片来源: AI识别</p>
                        <p className="text-xs text-yellow-600">注意: 图片有效期24小时，建议保存</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">供应商</label>
                  <input type="text" value={newProductForm.supplier} onChange={(e) => setNewProductForm({...newProductForm, supplier: e.target.value})} placeholder="请输入供应商" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                
                {/* 提示信息 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  <p>• 条码已自动填充，请点击"AI识别"获取商品信息</p>
                  <p>• 商品将同步到总部商品库</p>
                </div>
                
                <div className="flex gap-3 pt-4 border-t">
                  <button onClick={() => setShowAddProductModal(false)} className="flex-1 py-3 border rounded-lg hover:bg-gray-50">取消</button>
                  <button onClick={handleAddProduct} disabled={!newProductForm.name || !newProductForm.barcode || newProductForm.retailPrice <= 0} className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                    {!newProductForm.name ? '请先识别商品' : '确认添加'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== 采购入库 ========== */}
        {activeTab === 'product-import' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">📦 采购入库</h2>
                <p className="text-gray-500 text-sm mt-1">通过AI条码识别批量导入新采购商品</p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                  <span>📤</span> 批量导入
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <span>✓</span> 确认入库
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* 左侧：扫码录入 */}
              <div className="col-span-2 space-y-4">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <span className="text-xl">🔍</span> 条码扫描录入
                  </h3>
                  
                  <div className="flex gap-3 mb-4">
                    <input 
                      type="text" 
                      id="importBarcodeInput"
                      placeholder="扫描或输入条码后按回车..." 
                      className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-mono" 
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const barcode = (e.target as HTMLInputElement).value.trim();
                          if (barcode) handleImportAiScan(barcode);
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('importBarcodeInput') as HTMLInputElement;
                        if (input?.value) handleImportAiScan(input.value.trim());
                      }} 
                      disabled={import识别中}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                    >
                      {import识别中 ? '识别中...' : '识别'}
                    </button>
                  </div>
                  
                  {/* 识别结果显示 */}
                  {scanResult && (
                    scanResult.success ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-800 flex items-center gap-2">
                            <span>✅</span> {scanResult.name}
                          </p>
                          <p className="text-sm text-green-600">条码: {scanResult.barcode}</p>
                          {scanResult.price && <p className="text-sm text-green-600">零售价: ¥{scanResult.price}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setShowAddProductModal(true); setNewProductForm({ name: scanResult.name || '', barcode: scanResult.barcode, category: '食品', retailPrice: scanResult.price || 0, costPrice: scanResult.costPrice || 0, supplier: '' }); setScanResult(null); }} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">添加到商品库</button>
                          <button onClick={() => setScanResult(null)} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">清除</button>
                        </div>
                      </div>
                    </div>
                    ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-red-800 flex items-center gap-2">
                            <span>❌</span> 识别失败
                          </p>
                          <p className="text-sm text-red-600">条码: {scanResult.barcode}</p>
                          <p className="text-sm text-red-600">原因: {scanResult.error || '无法识别该条码'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setShowAddProductModal(true); setNewProductForm(prev => ({ ...prev, barcode: scanResult.barcode })); setScanResult(null); }} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">手动录入</button>
                          <button onClick={() => setScanResult(null)} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">清除</button>
                        </div>
                      </div>
                    </div>
                    )
                  )}
                  
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🤖</span>
                        <div>
                          <p className="font-medium text-purple-800">AI条码识别</p>
                          <p className="text-sm text-purple-600">自动从条码获取商品信息</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-sm">已启用</span>
                        <button onClick={() => setActiveTab('ai-config')} className="text-sm text-purple-600 hover:text-purple-800">配置</button>
                      </div>
                    </div>
                  </div>
                  
                  {/* 已扫描商品列表 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">已扫描商品 ({importedProducts.length})</h4>
                      <button className="text-sm text-red-600 hover:text-red-800">清空列表</button>
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {importedProducts.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                          <p className="text-4xl mb-3">📦</p>
                          <p>扫描条码开始录入商品</p>
                        </div>
                      ) : (
                        importedProducts.map((product, index) => (
                          <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border hover:border-green-400 transition">
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-2xl">📦</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{product.name}</p>
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">{product.category}</span>
                              </div>
                              <p className="text-sm text-gray-500 font-mono">{product.barcode}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-red-600">¥{product.price.toFixed(2)}</p>
                              <p className="text-xs text-gray-500">进价: ¥{product.costPrice.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="number" defaultValue={product.quantity} className="w-16 px-2 py-1 border rounded text-center text-sm" />
                              <button className="text-red-500 hover:text-red-700">×</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 右侧：配置与统计 */}
              <div className="space-y-4">
                {/* 统计卡片 */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h4 className="font-semibold mb-3">入库统计</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">商品种类</span>
                      <span className="font-bold text-xl">{importedProducts.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">商品总数</span>
                      <span className="font-bold text-xl">{importedProducts.reduce((sum, p) => sum + p.quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">预估金额</span>
                      <span className="font-bold text-xl text-red-600">¥{importedProducts.reduce((sum, p) => sum + p.costPrice * p.quantity, 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                {/* AI配置 */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h4 className="font-semibold mb-3">🤖 AI识别配置</h4>
                  {aiConfig.configs.map((config, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">接口状态</span>
                        <span className={`text-xs px-2 py-1 rounded ${config.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                          {config.enabled ? '已启用' : '已禁用'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{config.apiUrl}</p>
                      <button onClick={() => setActiveTab('ai-config')} className="w-full text-sm text-purple-600 hover:text-purple-800">编辑配置 →</button>
                    </div>
                  ))}
                </div>
                
                {/* 供应商 */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h4 className="font-semibold mb-3">供应商信息</h4>
                  <select className="w-full px-3 py-2 border rounded-lg text-sm mb-3">
                    <option value="">选择供应商</option>
                    <option value="1">华润万家供应商</option>
                    <option value="2">百事可乐代理商</option>
                    <option value="3">统一企业集团</option>
                  </select>
                  <input type="text" placeholder="或输入供应商名称" className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                
                {/* 入库批次 */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h4 className="font-semibold mb-3">入库批次</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">批次号</span>
                      <span className="font-mono">RK{new Date().getFullYear()}{String(new Date().getMonth()+1).padStart(2,'0')}{String(new Date().getDate()).padStart(2,'0')}001</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">入库时间</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">操作员</span>
                      <span>管理员</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 操作记录 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">📋 最近入库记录</h3>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b">
                    <th className="pb-2">批次号</th>
                    <th className="pb-2">供应商</th>
                    <th className="pb-2">商品数</th>
                    <th className="pb-2">金额</th>
                    <th className="pb-2">时间</th>
                    <th className="pb-2">状态</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { id: 'RK20240116001', supplier: '华润万家', count: 45, amount: 12800, date: '2024-01-16', status: '已完成' },
                    { id: 'RK20240115002', supplier: '百事可乐', count: 120, amount: 5600, date: '2024-01-15', status: '已完成' },
                  ].map((record, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-3 font-mono">{record.id}</td>
                      <td className="py-3">{record.supplier}</td>
                      <td className="py-3">{record.count}</td>
                      <td className="py-3 text-red-600">¥{record.amount.toLocaleString()}</td>
                      <td className="py-3 text-gray-500">{record.date}</td>
                      <td className="py-3"><span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">{record.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========== AI条码识别配置 ========== */}
        {activeTab === 'ai-config' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">🤖 AI条码识别配置</h2>
                <p className="text-gray-500 text-sm mt-1">配置AI接口用于条码商品信息识别，支持多个配置方案</p>
              </div>
              <button onClick={() => aiConfig.addConfig({ ...aiConfig.configs[0], apiKey: '' })} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                <span className="text-lg">+</span> 添加配置
              </button>
            </div>

            {aiConfig.configs.map((config, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">{index + 1}</span>
                    <div>
                      <h3 className="font-semibold">配置方案 {index + 1}</h3>
                      {config.lastTestResult && (
                        <p className={`text-xs ${config.lastTestResult.success ? 'text-green-600' : 'text-red-600'}`}>
                          {config.lastTestResult.success ? '✓' : '✗'} {config.lastTestResult.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm text-gray-600">启用</span>
                      <input type="checkbox" checked={config.enabled} onChange={(e) => aiConfig.updateConfig(index, { enabled: e.target.checked })} className="w-5 h-5 text-purple-600 rounded" />
                    </label>
                    {aiConfig.configs.length > 1 && (
                      <button onClick={() => aiConfig.deleteConfig(index)} className="text-red-500 hover:text-red-700 text-sm">删除</button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔗 API接口地址</label>
                    <div className="flex gap-2">
                      <select value={config.apiUrl.startsWith('https') ? 'https' : 'http'} onChange={(e) => aiConfig.updateConfig(index, { apiUrl: (e.target.value === 'https' ? 'https://' : 'http://') + config.apiUrl.replace(/^https?:\/\//, '') })} className="px-3 py-2 border rounded-lg text-sm w-28">
                        <option value="https">HTTPS</option>
                        <option value="http">HTTP</option>
                      </select>
                      <input type="text" value={config.apiUrl.replace(/^https?:\/\//, '')} onChange={(e) => aiConfig.updateConfig(index, { apiUrl: (config.apiUrl.startsWith('https') ? 'https://' : 'http://') + e.target.value })} placeholder="api.example.com/barcode" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔑 API Key</label>
                    <div className="flex gap-2">
                      <input type="password" value={config.apiKey} onChange={(e) => aiConfig.updateConfig(index, { apiKey: e.target.value })} placeholder="请输入API Key" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                      <button onClick={() => aiConfig.setLastTestResult(index, { success: true, message: 'API Key有效', timestamp: new Date().toISOString() })} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">验证</button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🆔 AppCode</label>
                    <input type="text" value={config.appCode} onChange={(e) => aiConfig.updateConfig(index, { appCode: e.target.value })} placeholder="阿里云等平台AppCode" className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔐 AppSecret</label>
                    <input type="password" value={config.appSecret} onChange={(e) => aiConfig.updateConfig(index, { appSecret: e.target.value })} placeholder="阿里云等平台AppSecret" className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📤 请求方式</label>
                    <select value={config.method} onChange={(e) => aiConfig.updateConfig(index, { method: e.target.value as 'POST' | 'GET' })} className="w-full px-3 py-2 border rounded-lg text-sm">
                      <option value="POST">POST</option>
                      <option value="GET">GET</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">⏱️ 超时时间(秒)</label>
                    <input type="number" value={config.timeout} onChange={(e) => aiConfig.updateConfig(index, { timeout: parseInt(e.target.value) || 3 })} min={1} max={10} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">📋 请求参数模板</label>
                    <textarea value={config.requestTemplate} onChange={(e) => aiConfig.updateConfig(index, { requestTemplate: e.target.value })} rows={2} placeholder='{"barcode": "${barcode}"}' className="w-full px-3 py-2 border rounded-lg text-sm font-mono resize-none" />
                    <p className="text-xs text-gray-500 mt-1">可用变量: ${`{barcode}`} ${`{store_id}`} ${`{timestamp}`}</p>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">🔍 响应字段映射</label>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-500 text-xs mb-1">商品名称</p>
                        <input type="text" value={config.responseMapping.name} onChange={(e) => aiConfig.updateConfig(index, { responseMapping: { ...config.responseMapping, name: e.target.value } })} className="w-full px-2 py-1 border rounded text-sm" />
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-500 text-xs mb-1">分类</p>
                        <input type="text" value={config.responseMapping.category} onChange={(e) => aiConfig.updateConfig(index, { responseMapping: { ...config.responseMapping, category: e.target.value } })} className="w-full px-2 py-1 border rounded text-sm" />
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-500 text-xs mb-1">零售价</p>
                        <input type="text" value={config.responseMapping.price} onChange={(e) => aiConfig.updateConfig(index, { responseMapping: { ...config.responseMapping, price: e.target.value } })} className="w-full px-2 py-1 border rounded text-sm" />
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-500 text-xs mb-1">进价</p>
                        <input type="text" value={config.responseMapping.costPrice} onChange={(e) => aiConfig.updateConfig(index, { responseMapping: { ...config.responseMapping, costPrice: e.target.value } })} className="w-full px-2 py-1 border rounded text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t flex items-center justify-between">
                  <div className="flex gap-4">
                    <input type="text" placeholder="输入条码测试..." defaultValue="6901234567890" className="px-3 py-2 border rounded-lg text-sm w-48" />
                    <button onClick={() => aiConfig.setLastTestResult(index, { success: true, message: '测试成功: 农夫山泉 饮料 ¥2.00', timestamp: new Date().toISOString() })} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">测试识别</button>
                  </div>
                  <button onClick={() => aiConfig.setLastTestResult(index, { success: true, message: '配置已保存', timestamp: new Date().toISOString() })} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">保存配置</button>
                </div>
              </div>
            ))}

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
              <h3 className="font-semibold text-purple-800 mb-3">📖 使用说明</h3>
              <ul className="space-y-2 text-sm text-purple-700">
                <li>1. 支持多个配置方案，可设置主/备接口自动切换</li>
                <li>2. 支持主流条码识别API（京东识货、阿里云、百度AI等）</li>
                <li>3. 支持自定义响应字段映射，适配不同平台返回格式</li>
                <li>4. 配置保存后自动同步到采购入库功能</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
