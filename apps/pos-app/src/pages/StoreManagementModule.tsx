import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Product } from '../types';
import { useProductStore } from '../store';

interface StoreModule {
  id: string;
  label: string;
  icon: string;
}

interface StoreManagementModuleProps {
  module: StoreModule;
  store: any;
  products: Product[];
  members: any[];
  orders: any[];
}

export default function StoreManagementModule({ module, store, products, members, orders }: StoreManagementModuleProps) {
  const { inventories } = useProductStore();
  
  // 缓存管理
  const [cacheSize, setCacheSize] = useState('0 KB');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  
  // 配送管理
  const [deliveryTab, setDeliveryTab] = useState<'store' | 'mini' | 'platform' | 'groupbuy'>('store');
  
  // 计算缓存大小
  const calculateCacheSize = useCallback(() => {
    let total = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
          total += sessionStorage[key].length + key.length;
        }
      }
    } catch (e) {
      console.error('计算缓存大小失败', e);
    }
    // 转换为 KB
    const kb = (total / 1024).toFixed(2);
    setCacheSize(kb);
    return parseFloat(kb);
  }, []);
  
  // 清除缓存
  const clearCache = useCallback(() => {
    try {
      // 清除 localStorage
      localStorage.clear();
      // 清除 sessionStorage
      sessionStorage.clear();
      // 尝试清除 IndexedDB (如果存在)
      if ('indexedDB' in window) {
        const dbs = window.indexedDB.databases();
        dbs.then(dbs => {
          dbs.forEach(db => {
            if (db.name) window.indexedDB.deleteDatabase(db.name);
          });
        }).catch(() => {});
      }
      setCacheSize('0.00');
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 3000);
    } catch (e) {
      console.error('清除缓存失败', e);
    }
  }, []);
  
  // 组件挂载时计算缓存大小
  useEffect(() => {
    if (module === 'settings') {
      calculateCacheSize();
    }
  }, [module, calculateCacheSize]);
  
  // 库存管理
  if (module === 'inventory') {
    const storeInventories = Array.from(inventories.entries())
      .filter(([key]) => key.startsWith(store?.id || 'store001'))
      .map(([key, inv]) => ({
        ...inv,
        product: products.find((p: Product) => p.id === inv.productId),
      }));
    
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">库存概览</h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">盘点</button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: '商品种类', value: storeInventories.length, color: 'blue' },
                { label: '正常库存', value: storeInventories.filter((i: any) => i.status === 'normal').length, color: 'green' },
                { label: '库存预警', value: storeInventories.filter((i: any) => i.status === 'low').length, color: 'yellow' },
                { label: '紧急补货', value: storeInventories.filter((i: any) => i.status === 'critical').length, color: 'red' },
              ].map((item, i) => (
                <div key={i} className={`bg-${item.color}-50 rounded-lg p-3`}>
                  <p className={`text-sm text-${item.color}-600`}>{item.label}</p>
                  <p className={`text-xl font-bold text-${item.color}-800`}>{item.value}</p>
                </div>
              ))}
            </div>
            
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-2">商品</th>
                  <th className="pb-2">分类</th>
                  <th className="pb-2">当前库存</th>
                  <th className="pb-2">预警阈值</th>
                  <th className="pb-2">状态</th>
                </tr>
              </thead>
              <tbody>
                {storeInventories.slice(0, 10).map((inv: any, i: number) => (
                  <tr key={i} className="border-b">
                    <td className="py-3">{inv.product?.name || '未知商品'}</td>
                    <td className="py-3 text-gray-500">{inv.product?.category || '-'}</td>
                    <td className={`py-3 font-medium ${inv.status === 'critical' ? 'text-red-600' : inv.status === 'low' ? 'text-yellow-600' : 'text-gray-800'}`}>
                      {inv.quantity} {inv.product?.unit}
                    </td>
                    <td className="py-3 text-gray-500">{inv.warningThreshold}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        inv.status === 'normal' ? 'bg-green-100 text-green-600' :
                        inv.status === 'low' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {inv.status === 'normal' ? '正常' : inv.status === 'low' ? '预警' : '紧急'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 要货申请 */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">要货申请</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">新建要货</button>
            </div>
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🚚</p>
              <p>暂无要货记录</p>
              <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm">
                发起要货申请
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // 商品管理
  if (module === 'products') {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">本店商品</h3>
            <span className="text-sm text-gray-500">共 {products.length} 种商品</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-2">商品</th>
                <th className="pb-2">条码</th>
                <th className="pb-2">分类</th>
                <th className="pb-2">售价</th>
                <th className="pb-2">状态</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 15).map((product) => (
                <tr key={product.id} className="border-b">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span>{product.isStandard ? '📦' : '🍎'}</span>
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td className="py-3 font-mono text-sm text-gray-500">{product.barcode || '-'}</td>
                  <td className="py-3 text-gray-500">{product.category}</td>
                  <td className="py-3 text-green-600 font-medium">¥{product.retailPrice}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs ${product.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {product.status === 'active' ? '在售' : '停售'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  
  // 订单管理
  if (module === 'orders') {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">今日订单</h3>
            <span className="text-sm text-gray-500">共 {orders.length || 0} 笔</span>
          </div>
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p>暂无订单记录</p>
            <p className="text-sm mt-1">完成收银后将自动生成订单</p>
          </div>
        </div>
      </div>
    );
  }
  
  // 报表中心
  if (module === 'reports') {
    const today = new Date().toLocaleDateString('zh-CN');
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">销售报表</h3>
            <select className="px-3 py-1 border rounded text-sm">
              <option>今日</option>
              <option>本周</option>
              <option>本月</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: '今日销售', value: '¥0.00', icon: '💰', color: 'green' },
              { label: '订单数', value: '0', icon: '🧾', color: 'blue' },
              { label: '客单价', value: '¥0.00', icon: '👤', color: 'purple' },
              { label: '毛利', value: '¥0.00', icon: '📈', color: 'orange' },
            ].map((item, i) => (
              <div key={i} className={`bg-${item.color}-50 rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <span>{item.icon}</span>
                  <span className={`text-sm text-${item.color}-600`}>{item.label}</span>
                </div>
                <p className={`text-xl font-bold text-${item.color}-800`}>{item.value}</p>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">热销商品排行</h4>
            <div className="text-center py-4 text-gray-400">
              <p>暂无销售数据</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // 配送管理
  if (module === 'delivery') {
    const deliveryTabs = [
      { id: 'store', label: '门店配送', icon: '🏪' },
      { id: 'mini', label: '小程序订单', icon: '📱' },
      { id: 'platform', label: '公域平台', icon: '🌐' },
      { id: 'groupbuy', label: '团购接龙', icon: '👥' },
    ];
    
    // 配送订单数据（基于真实订单）
    const deliveryOrders = useMemo(() => ({
      store: orders.filter(o => o.type === 'transfer').map(o => ({
        id: o.id,
        type: o.items?.[0]?.type || '调入',
        from: o.items?.[0]?.fromStore || '',
        to: o.items?.[0]?.toStore || '',
        items: o.items?.length || 0,
        amount: o.finalAmount || 0,
        status: o.status === 'pending' ? 'pending' : o.status === 'shipped' ? 'shipped' : 'preparing',
        time: new Date(o.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      })),
      mini: orders.filter(o => o.type === 'mini').map(o => ({
        id: o.id,
        source: '小程序',
        items: o.items?.length || 0,
        amount: o.finalAmount || 0,
        status: o.status === 'pending' ? 'pending' : o.status === 'shipped' ? 'shipped' : 'preparing',
        time: new Date(o.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      })),
      platform: orders.filter(o => o.type === 'platform').map(o => ({
        id: o.id,
        source: o.platform || '美团',
        items: o.items?.length || 0,
        amount: o.finalAmount || 0,
        status: o.status === 'pending' ? 'pending' : o.status === 'shipped' ? 'shipped' : 'preparing',
        time: new Date(o.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      })),
      groupbuy: orders.filter(o => o.type === 'groupbuy').map(o => ({
        id: o.id,
        group: o.groupName || '社区群',
        leader: o.leader || '',
        items: o.items?.length || 0,
        amount: o.finalAmount || 0,
        status: o.status === 'open' ? 'open' : 'closed',
        time: new Date(o.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      })),
    }), [orders]);

    // 计算配送概览数据
    const deliveryStats = useMemo(() => {
      const today = new Date().toDateString();
      const todayOrders = orders.filter(o => o.createdAt?.startsWith(today));
      return {
        pending: todayOrders.filter(o => o.status === 'pending').length,
        preparing: todayOrders.filter(o => o.status === 'preparing').length,
        shipped: todayOrders.filter(o => o.status === 'shipped' || o.status === 'completed').length,
        todayRevenue: todayOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0),
      };
    }, [orders]);

    
    const getStatusLabel = (status: string) => {
      const map: Record<string, { label: string; color: string }> = {
        pending: { label: '待接单', color: 'yellow' },
        preparing: { label: '备货中', color: 'blue' },
        shipped: { label: '已发货', color: 'green' },
        open: { label: '接龙中', color: 'purple' },
        closed: { label: '已结束', color: 'gray' },
      }

      return map[status] || { label: status, color: 'gray' }

    }

    
    return (
      <div className="flex-1 overflow-auto p-4">
        {/* 配送概览 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[
            { label: '待接单', value: deliveryStats.pending, icon: '⏳', color: 'yellow' },
            { label: '备货中', value: deliveryStats.preparing, icon: '🔄', color: 'blue' },
            { label: '已发货', value: deliveryStats.shipped, icon: '✅', color: 'green' },
            { label: '今日营收', value: `¥${deliveryStats.todayRevenue.toFixed(0)}`, icon: '💰', color: 'purple' },
          ].map((item, i) => (
            <div key={i} className={`bg-${item.color}-50 rounded-lg p-3`}>
              <div className="flex items-center gap-2 mb-1">
                <span>{item.icon}</span>
                <span className={`text-sm text-${item.color}-600`}>{item.label}</span>
              </div>
              <p className={`text-xl font-bold text-${item.color}-800`}>{item.value}</p>
            </div>
          ))}
        </div>
        
        {/* 配送类型切换 */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b px-4">
            <div className="flex gap-1">
              {deliveryTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDeliveryTab(tab.id as typeof deliveryTab)}
                  className={`px-4 py-3 border-b-2 transition-colors flex items-center gap-2 ${
                    deliveryTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* 订单列表 */}
          <div className="p-4">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3">订单号</th>
                  <th className="pb-3">{deliveryTab === 'store' ? '类型' : '来源'}</th>
                  <th className="pb-3">{deliveryTab === 'store' ? '对方门店' : deliveryTab === 'groupbuy' ? '团长' : '商品数'}</th>
                  <th className="pb-3">金额</th>
                  <th className="pb-3">状态</th>
                  <th className="pb-3">时间</th>
                  <th className="pb-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {(deliveryOrders as any)[deliveryTab]?.map((order: any, i: number) => {
                  const status = getStatusLabel(order.status);
                  return (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 font-mono text-sm">{order.id}</td>
                      <td className="py-3">
                        {deliveryTab === 'store' ? (
                          <span className={`px-2 py-1 rounded text-xs ${order.type === '调入' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                            {order.type}
                          </span>
                        ) : (
                          order.source
                        )}
                      </td>
                      <td className="py-3">
                        {deliveryTab === 'store' ? (order.from || order.to) : 
                         deliveryTab === 'groupbuy' ? `${order.group} - ${order.leader}` : 
                         `${order.items}件`}
                      </td>
                      <td className="py-3 text-green-600 font-medium">¥{order.amount.toFixed(1)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs bg-${status.color}-100 text-${status.color}-600`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">{order.time}</td>
                      <td className="py-3">
                        {order.status === 'pending' && (
                          <button className="text-blue-600 hover:underline text-sm mr-2">接单</button>
                        )}
                        {order.status === 'preparing' && (
                          <button className="text-green-600 hover:underline text-sm mr-2">发货</button>
                        )}
                        {order.status === 'open' && (
                          <button className="text-red-600 hover:underline text-sm mr-2">结束</button>
                        )}
                        <button className="text-gray-500 hover:underline text-sm">详情</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {(deliveryOrders as any)[deliveryTab]?.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-2">📦</p>
                <p>暂无{deliveryTabs.find(t => t.id === deliveryTab)?.label}订单</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // 促销管理
  if (module === 'promo') {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">本店促销</h3>
            <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">晚8点清货 8折</span>
          </div>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">晚8点清货模式</span>
                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">自动</span>
              </div>
              <p className="text-sm text-gray-500">每日 20:00 - 23:00 全场商品8折优惠</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">会员折扣</span>
                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded">生效中</span>
              </div>
              <p className="text-sm text-gray-500">钻石会员9折 / 金卡会员95折 / 银卡会员98折</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // 会员管理
  if (module === 'members') {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">本店会员</h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">添加会员</button>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { level: '钻石会员', count: members.filter(m => m.level === 'diamond').length, color: 'purple' },
              { level: '金卡会员', count: members.filter(m => m.level === 'gold').length, color: 'yellow' },
              { level: '银卡会员', count: members.filter(m => m.level === 'silver').length, color: 'gray' },
              { level: '普通会员', count: members.filter(m => m.level === 'normal').length, color: 'blue' },
            ].map((item, i) => (
              <div key={i} className={`bg-${item.color}-50 rounded-lg p-3 text-center`}>
                <p className="text-sm text-gray-500">{item.level}</p>
                <p className={`text-xl font-bold text-${item.color}-600`}>{item.count}</p>
              </div>
            ))}
          </div>
          
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-2">姓名</th>
                <th className="pb-2">手机号</th>
                <th className="pb-2">等级</th>
                <th className="pb-2">积分</th>
                <th className="pb-2">余额</th>
              </tr>
            </thead>
            <tbody>
              {members.slice(0, 10).map((member) => (
                <tr key={member.id} className="border-b">
                  <td className="py-3">{member.name}</td>
                  <td className="py-3 text-gray-500">{member.phone}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      member.level === 'diamond' ? 'bg-purple-100 text-purple-600' :
                      member.level === 'gold' ? 'bg-yellow-100 text-yellow-600' :
                      member.level === 'silver' ? 'bg-gray-100 text-gray-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {member.level === 'diamond' ? '💎钻石' : member.level === 'gold' ? '🥇金卡' : member.level === 'silver' ? '🥈银卡' : '普通'}
                    </span>
                  </td>
                  <td className="py-3">{member.points.toLocaleString()}</td>
                  <td className="py-3 text-green-600">¥{member.balance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  
  // 门店设置
  if (module === 'settings') {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-4">门店设置</h3>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">门店信息</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">门店名称：</span>
                  <span className="ml-2">{store?.name || '望京店'}</span>
                </div>
                <div>
                  <span className="text-gray-500">门店编码：</span>
                  <span className="ml-2">{store?.code || 'WJ001'}</span>
                </div>
                <div>
                  <span className="text-gray-500">门店地址：</span>
                  <span className="ml-2">{store?.address || '北京市朝阳区'}</span>
                </div>
                <div>
                  <span className="text-gray-500">联系电话：</span>
                  <span className="ml-2">{store?.phone || '010-12345678'}</span>
                </div>
              </div>
              <button className="mt-3 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                编辑门店信息
              </button>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">收款账户</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>微信支付</span>
                  <span className="text-green-600">已开通 ✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>支付宝</span>
                  <span className="text-green-600">已开通 ✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>云闪付</span>
                  <span className="text-gray-400">未开通</span>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">系统设置</h4>
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span>晚8点清货模式</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </label>
                <label className="flex items-center justify-between">
                  <span>负库存检查</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </label>
                <label className="flex items-center justify-between">
                  <span>小票打印</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5" />
                </label>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3 text-red-600">危险操作</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">清除缓存</p>
                    <p className="text-xs text-gray-500">当前缓存: {cacheSize}</p>
                  </div>
                  <button 
                    onClick={() => setShowClearConfirm(true)}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    清除
                  </button>
                </div>
                {clearSuccess && (
                  <div className="p-2 bg-green-100 text-green-700 rounded-lg text-sm text-center">
                    缓存清除成功！
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* 清除缓存确认弹窗 */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-80 max-w-[90vw]">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">确认清除缓存？</h3>
                <p className="text-sm text-gray-500 mb-6">
                  将清除所有本地存储数据，包括购物车、历史记录等。<br/>
                  当前缓存: <span className="font-medium">{cacheSize}</span>
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => {
                      clearCache();
                      setShowClearConfirm(false);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    确认清除
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return null;
}

// 客显屏组件 - 渲染在 CashierPage 内部
export const CustomerDisplayOverlay: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
  items: Array<{
    product: {
      id: string;
      name: string;
      retailPrice: number;
      isStandard: boolean;
    }

    quantity: number;
  }>;
  totals: {
    subtotal: number;
    total: number;
    clearanceDiscount: number;
    memberDiscount: number;
  }

  currentMember?: {
    name: string;
    level: string;
    points: number;
  } | null;
}> = ({ isOpen, onClose, storeName, items, totals, currentMember }) => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 广告轮播
  useEffect(() => {
    if (items.length === 0) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % 3);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [items.length]);

  if (!isOpen) return null;

  const hasItems = items.length > 0;
  const adMessages = ['会员卡购物享积分', '晚8点后全场8折', '新会员首单满50减10'];

  return (
    <div
      className={`
        fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900
        flex flex-col transition-all duration-500
        ${isFullscreen ? '' : 'm-4 rounded-2xl overflow-hidden shadow-2xl'}
      `}
    >
      {/* 顶部标题栏 */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <span className="text-2xl font-bold">海</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">{storeName || '海邻到家便利店'}</h1>
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
              onClick={() => setIsFullscreen(!isFullscreen)}
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
                        ¥{(item.product.retailPrice * item.quantity).toFixed(2)}
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
                欢迎光临
              </h2>
              <p className="text-2xl text-blue-200">{storeName || '海邻到家便利店'}</p>
            </div>

            {/* 广告轮播 */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 mb-12 max-w-md w-full">
              <div className="h-16 flex items-center justify-center">
                <p className="text-2xl text-center text-white animate-pulse">
                  {adMessages[currentAdIndex]}
                </p>
              </div>
              <div className="flex justify-center gap-2 mt-6">
                {adMessages.map((_, index) => (
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
}

