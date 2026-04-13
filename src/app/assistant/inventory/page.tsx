'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ScanLine,
  AlertTriangle,
  Package,
  TrendingDown,
  Clock,
  ChevronRight,
  Filter,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  MinusCircle,
  History,
  ArrowUpDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// 模拟库存数据
const inventoryData = [
  { id: 1, name: '可口可乐500ml', barcode: '6901234567890', stock: 24, unit: '瓶', minStock: 20, price: 3.00, category: '饮料', expiry: '2025-06-15' },
  { id: 2, name: '农夫山泉550ml', barcode: '6901234567891', stock: 48, unit: '瓶', minStock: 30, price: 2.00, category: '饮料', expiry: '2025-08-20' },
  { id: 3, name: '康师傅红烧牛肉面', barcode: '6901234567892', stock: 12, unit: '桶', minStock: 15, price: 4.50, category: '方便食品', expiry: '2025-03-10' },
  { id: 4, name: '双汇王中王火腿肠', barcode: '6901234567893', stock: 36, unit: '根', minStock: 20, price: 2.50, category: '休闲食品', expiry: '2025-05-25' },
  { id: 5, name: '维达抽纸', barcode: '6901234567894', stock: 8, unit: '包', minStock: 10, price: 8.90, category: '日用品', expiry: '2026-01-01' },
  { id: 6, name: '蒙牛纯牛奶250ml', barcode: '6901234567895', stock: 6, unit: '盒', minStock: 15, price: 3.50, category: '乳制品', expiry: '2024-02-28' },
  { id: 7, name: '统一冰红茶', barcode: '6901234567896', stock: 56, unit: '瓶', minStock: 30, price: 3.00, category: '饮料', expiry: '2025-07-15' },
  { id: 8, name: '奥利奥夹心饼干', barcode: '6901234567897', stock: 32, unit: '盒', minStock: 15, price: 8.50, category: '休闲食品', expiry: '2025-09-01' },
];

const stocktakeHistory = [
  { id: 1, date: '2024-01-15 14:30', user: '张店长', items: 156, status: 'completed', discrepancy: 3 },
  { id: 2, date: '2024-01-14 09:15', user: '李员工', items: 142, status: 'completed', discrepancy: 0 },
  { id: 3, date: '2024-01-13 16:45', user: '张店长', items: 138, status: 'completed', discrepancy: -2 },
  { id: 4, date: '2024-01-12 10:00', user: '王店员', items: 120, status: 'pending', discrepancy: null },
];

const categories = ['全部', '饮料', '方便食品', '休闲食品', '日用品', '乳制品'];

export default function InventoryPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [sortBy, setSortBy] = useState<'stock' | 'name' | 'expiry'>('stock');
  const [loading, setLoading] = useState(false);

  // 过滤和排序商品
  const filteredItems = inventoryData
    .filter(item => {
      const matchCat = selectedCategory === '全部' || item.category === selectedCategory;
      const matchSearch = !searchTerm || 
        item.name.includes(searchTerm) || 
        item.barcode.includes(searchTerm) ||
        item.category.includes(searchTerm);
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'stock') return a.stock - b.stock;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'expiry') return new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
      return 0;
    });

  const lowStockItems = inventoryData.filter(item => item.stock <= item.minStock);
  const expiringItems = inventoryData.filter(item => {
    const daysUntilExpiry = Math.ceil((new Date(item.expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });
  const expiredItems = inventoryData.filter(item => new Date(item.expiry) < new Date());

  const getStockStatus = (item: typeof inventoryData[0]) => {
    if (item.stock <= 0) return { label: '售罄', color: 'bg-red-100 text-red-600', icon: XCircle };
    if (item.stock <= item.minStock * 0.5) return { label: '紧急补货', color: 'bg-red-100 text-red-600', icon: AlertTriangle };
    if (item.stock <= item.minStock) return { label: '库存不足', color: 'bg-orange-100 text-orange-600', icon: MinusCircle };
    return { label: '正常', color: 'bg-green-100 text-green-600', icon: CheckCircle };
  };

  const getDaysUntilExpiry = (expiry: string) => {
    return Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = (days: number) => {
    if (days < 0) return { label: '已过期', color: 'bg-red-100 text-red-600' };
    if (days <= 7) return { label: `${days}天后过期`, color: 'bg-red-100 text-red-600' };
    if (days <= 30) return { label: `${days}天后过期`, color: 'bg-orange-100 text-orange-600' };
    return { label: `${days}天后过期`, color: 'bg-green-100 text-green-600' };
  };

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 头部 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/assistant')}>
            <ChevronRight className="h-5 w-5 rotate-180" />
          </Button>
          <h1 className="font-bold text-lg flex-1">库存管理</h1>
          <Button variant="ghost" size="icon" onClick={refresh}>
            <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
          </Button>
        </div>
      </header>

      {/* 搜索栏 */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="搜索商品名称/条码..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <XCircle className="h-4 w-4 text-slate-400" />
              </button>
            )}
          </div>
          <Button 
            variant="outline"
            onClick={() => router.push('/assistant/inventory/scan')}
          >
            <ScanLine className="h-4 w-4" />
          </Button>
        </div>
        
        {/* 分类标签 */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
                selectedCategory === cat 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full rounded-none bg-white border-b h-12">
          <TabsTrigger value="list" className="flex-1">
            <Package className="w-4 h-4 mr-1" />
            库存列表
          </TabsTrigger>
          <TabsTrigger value="low" className="flex-1 relative">
            <AlertTriangle className="w-4 h-4 mr-1" />
            库存预警
            {lowStockItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {lowStockItems.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="expiry" className="flex-1 relative">
            <Clock className="w-4 h-4 mr-1" />
            临期商品
            {expiringItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                {expiringItems.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1">
            <History className="w-4 h-4 mr-1" />
            盘点记录
          </TabsTrigger>
        </TabsList>

        {/* 库存列表 */}
        <TabsContent value="list" className="mt-0">
          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-2 p-4">
            <Card className="text-center">
              <CardContent className="py-3 px-2">
                <p className="text-2xl font-bold text-slate-700">{inventoryData.length}</p>
                <p className="text-xs text-slate-500">商品种类</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="py-3 px-2">
                <p className="text-2xl font-bold text-orange-500">{lowStockItems.length}</p>
                <p className="text-xs text-slate-500">库存预警</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="py-3 px-2">
                <p className="text-2xl font-bold text-red-500">{expiredItems.length + expiringItems.length}</p>
                <p className="text-xs text-slate-500">临期商品</p>
              </CardContent>
            </Card>
          </div>

          {/* 功能入口 */}
          <div className="px-4 pb-4 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => router.push('/assistant/inventory/stocktake')}
            >
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <ScanLine className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-sm">库存盘点</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => router.push('/assistant/inventory/scan')}
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Search className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-sm">扫码查询</span>
            </Button>
          </div>

          {/* 排序选项 */}
          <div className="px-4 pb-2 flex items-center gap-2">
            <span className="text-xs text-slate-500">排序：</span>
            {[
              { key: 'stock', label: '按库存' },
              { key: 'name', label: '按名称' },
              { key: 'expiry', label: '按保质期' },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setSortBy(item.key as typeof sortBy)}
                className={cn(
                  "px-2 py-1 rounded text-xs",
                  sortBy === item.key 
                    ? 'bg-orange-100 text-orange-600' 
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* 商品列表 */}
          <div className="px-4 pb-4 space-y-2">
            {filteredItems.map(item => {
              const status = getStockStatus(item);
              const StatusIcon = status.icon;
              return (
                <div 
                  key={item.id}
                  className="bg-white rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-800">{item.name}</h3>
                        <Badge className={status.color} variant="secondary">
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        条码：{item.barcode} | 分类：{item.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-800">¥{item.price.toFixed(2)}</p>
                      <p className="text-sm text-slate-500">{item.unit}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-slate-400">当前库存</p>
                        <p className={cn(
                          "text-lg font-bold",
                          item.stock <= item.minStock ? "text-red-500" : "text-slate-700"
                        )}>
                          {item.stock}{item.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">最低库存</p>
                        <p className="text-lg font-bold text-slate-500">{item.minStock}{item.unit}</p>
                      </div>
                    </div>
                    {item.expiry && (
                      <div className="text-right">
                        <p className="text-xs text-slate-400">保质期至</p>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className={cn(
                            "text-sm font-medium",
                            getDaysUntilExpiry(item.expiry) <= 30 ? "text-orange-500" : "text-slate-600"
                          )}>
                            {item.expiry}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>未找到相关商品</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 库存预警 */}
        <TabsContent value="low" className="mt-0 p-4">
          {lowStockItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p className="text-lg font-medium">库存充足</p>
              <p className="text-sm">所有商品库存均处于正常水平</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-700">需要补货的商品</h3>
                <Badge className="bg-red-100 text-red-600">{lowStockItems.length}件</Badge>
              </div>
              {lowStockItems.map(item => (
                <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-800">{item.name}</h4>
                      <p className="text-sm text-slate-400">{item.barcode}</p>
                    </div>
                    <Button 
                      size="sm"
                      className="bg-orange-500"
                      onClick={() => router.push('/assistant/purchase')}
                    >
                      申请采购
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                    <div>
                      <p className="text-xs text-slate-400">当前库存</p>
                      <p className="text-xl font-bold text-red-500">{item.stock}{item.unit}</p>
                    </div>
                    <TrendingDown className="w-5 h-5 text-slate-300" />
                    <div>
                      <p className="text-xs text-slate-400">最低库存</p>
                      <p className="text-xl font-bold text-slate-400">{item.minStock}{item.unit}</p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-slate-400">建议补货</p>
                      <p className="text-lg font-bold text-orange-500">{Math.max(0, item.minStock * 2 - item.stock)}{item.unit}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 临期商品 */}
        <TabsContent value="expiry" className="mt-0 p-4">
          {expiredItems.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-red-600 flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5" />
                已过期商品 ({expiredItems.length})
              </h3>
              <div className="space-y-2">
                {expiredItems.map(item => (
                  <div key={item.id} className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-red-800">{item.name}</h4>
                        <p className="text-sm text-red-500">过期日期：{item.expiry}</p>
                      </div>
                      <Badge className="bg-red-500 text-white">已过期</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {expiringItems.length === 0 && expiredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p className="text-lg font-medium">无临期商品</p>
              <p className="text-sm">所有商品保质期均在30天以上</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-medium text-orange-600 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                即将过期商品 ({expiringItems.length})
              </h3>
              {expiringItems.map(item => {
                const days = getDaysUntilExpiry(item.expiry);
                const status = getExpiryStatus(days);
                return (
                  <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800">{item.name}</h4>
                        <p className="text-sm text-slate-400">{item.stock}{item.unit}</p>
                      </div>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">过期日期</p>
                        <p className="text-orange-600 font-medium">{item.expiry}</p>
                      </div>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="border-orange-500 text-orange-500"
                        onClick={() => router.push('/assistant/promotion')}
                      >
                        申请促销
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* 盘点记录 */}
        <TabsContent value="history" className="mt-0 p-4">
          {stocktakeHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-lg">暂无盘点记录</p>
              <p className="text-sm">点击上方"库存盘点"开始盘点</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stocktakeHistory.map(record => (
                <div key={record.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-800">{record.date}</h4>
                        <Badge className={
                          record.status === 'completed' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-yellow-100 text-yellow-600'
                        }>
                          {record.status === 'completed' ? '已完成' : '进行中'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        盘点人：{record.user} | 盘点商品：{record.items}件
                      </p>
                    </div>
                    {record.discrepancy !== null && (
                      <div className={cn(
                        "text-right",
                        record.discrepancy > 0 ? "text-green-500" : 
                        record.discrepancy < 0 ? "text-red-500" : "text-slate-500"
                      )}>
                        <p className="text-xs">差异</p>
                        <p className="text-lg font-bold">
                          {record.discrepancy > 0 ? '+' : ''}{record.discrepancy}件
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
