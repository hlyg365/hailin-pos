'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  ArrowUpDown,
  ScanLine,
} from 'lucide-react';

// 商品库存数据
const inventoryData = [
  { id: '1', name: '可口可乐500ml', barcode: '6901234567890', category: '饮料', stock: 24, minStock: 20, unit: '瓶', costPrice: 2.50, sellingPrice: 3.50 },
  { id: '2', name: '农夫山泉550ml', barcode: '6901234567891', category: '饮料', stock: 48, minStock: 30, unit: '瓶', costPrice: 1.50, sellingPrice: 2.00 },
  { id: '3', name: '康师傅红烧牛肉面', barcode: '6901234567892', category: '方便食品', stock: 12, minStock: 15, unit: '桶', costPrice: 3.50, sellingPrice: 4.50 },
  { id: '4', name: '双汇王中王火腿肠', barcode: '6901234567893', category: '休闲食品', stock: 36, minStock: 20, unit: '根', costPrice: 1.80, sellingPrice: 2.50 },
  { id: '5', name: '维达抽纸', barcode: '6901234567894', category: '日用品', stock: 8, minStock: 10, unit: '包', costPrice: 7.50, sellingPrice: 12.90 },
  { id: '6', name: '蒙牛纯牛奶250ml', barcode: '6901234567895', category: '乳制品', stock: 6, minStock: 15, unit: '盒', costPrice: 2.80, sellingPrice: 3.50 },
  { id: '7', name: '百事可乐500ml', barcode: '6901234567896', category: '饮料', stock: 30, minStock: 20, unit: '瓶', costPrice: 2.50, sellingPrice: 3.50 },
  { id: '8', name: '乐事薯片原味', barcode: '6901234567897', category: '休闲食品', stock: 15, minStock: 10, unit: '袋', costPrice: 5.50, sellingPrice: 8.00 },
  { id: '9', name: '统一冰红茶500ml', barcode: '6901234567898', category: '饮料', stock: 25, minStock: 20, unit: '瓶', costPrice: 2.00, sellingPrice: 3.00 },
  { id: '10', name: '旺旺雪饼', barcode: '6901234567899', category: '休闲食品', stock: 5, minStock: 10, unit: '包', costPrice: 6.00, sellingPrice: 8.50 },
];

// 库存变动记录
const stockRecords = [
  { id: '1', productName: '可口可乐500ml', type: 'in', quantity: 50, beforeStock: 24, afterStock: 74, time: '2024-03-18 10:30', operator: '张店长', reason: '采购入库' },
  { id: '2', productName: '农夫山泉550ml', type: 'out', quantity: 10, beforeStock: 58, afterStock: 48, time: '2024-03-18 09:15', operator: '李员工', reason: '销售出库' },
  { id: '3', productName: '康师傅红烧牛肉面', type: 'adjust', quantity: -2, beforeStock: 14, afterStock: 12, time: '2024-03-17 16:00', operator: '张店长', reason: '盘点调整' },
  { id: '4', productName: '维达抽纸', type: 'in', quantity: 20, beforeStock: 8, afterStock: 28, time: '2024-03-17 14:30', operator: '张店长', reason: '采购入库' },
  { id: '5', productName: '蒙牛纯牛奶250ml', type: 'out', quantity: 10, beforeStock: 16, afterStock: 6, time: '2024-03-17 11:20', operator: '王员工', reason: '销售出库' },
];

export default function StoreInventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low' | 'normal' | 'over'>('all');
  const [activeTab, setActiveTab] = useState('list');

  // 筛选库存
  const filteredInventory = useMemo(() => {
    return inventoryData.filter(item => {
      const matchesSearch = item.name.includes(searchTerm) || item.barcode.includes(searchTerm);
      const matchesFilter = filterType === 'all' ||
        (filterType === 'low' && item.stock <= item.minStock) ||
        (filterType === 'normal' && item.stock > item.minStock && item.stock <= item.minStock * 2) ||
        (filterType === 'over' && item.stock > item.minStock * 2);
      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, filterType]);

  // 统计数据
  const stats = useMemo(() => ({
    total: inventoryData.length,
    lowStock: inventoryData.filter(i => i.stock <= i.minStock).length,
    totalValue: inventoryData.reduce((sum, i) => sum + i.stock * i.costPrice, 0),
    totalSellingValue: inventoryData.reduce((sum, i) => sum + i.stock * i.sellingPrice, 0),
  }), []);

  // 获取库存状态
  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { label: '缺货', className: 'bg-red-100 text-red-700' };
    if (stock <= minStock) return { label: '库存不足', className: 'bg-orange-100 text-orange-700' };
    if (stock <= minStock * 2) return { label: '正常', className: 'bg-green-100 text-green-700' };
    return { label: '充足', className: 'bg-blue-100 text-blue-700' };
  };

  // 获取变动类型样式
  const getRecordTypeStyle = (type: string) => {
    switch (type) {
      case 'in': return { label: '入库', className: 'bg-green-100 text-green-700', icon: Plus };
      case 'out': return { label: '出库', className: 'bg-red-100 text-red-700', icon: Minus };
      case 'adjust': return { label: '调整', className: 'bg-blue-100 text-blue-700', icon: ArrowUpDown };
      default: return { label: '未知', className: 'bg-gray-100 text-gray-700', icon: Package };
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="库存管理" description="查看店铺商品库存情况，管理库存变动" />

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">商品种类</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
                <p className="text-xs text-muted-foreground">库存预警</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">¥{stats.totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">库存成本</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">¥{stats.totalSellingValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">库存货值</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主内容区 */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b px-4 pt-4">
            <TabsList>
              <TabsTrigger value="list">库存列表</TabsTrigger>
              <TabsTrigger value="records">变动记录</TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-4">
            <TabsContent value="list" className="mt-0">
              {/* 搜索和筛选 */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索商品名称或条码..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('all')}
                  >
                    全部
                  </Button>
                  <Button
                    variant={filterType === 'low' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('low')}
                    className="text-orange-600"
                  >
                    库存不足
                  </Button>
                  <Button
                    variant={filterType === 'normal' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('normal')}
                  >
                    正常
                  </Button>
                  <Button
                    variant={filterType === 'over' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('over')}
                  >
                    充足
                  </Button>
                </div>
              </div>

              {/* 库存表格 */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品信息</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead>库存数量</TableHead>
                      <TableHead>成本价</TableHead>
                      <TableHead>售价</TableHead>
                      <TableHead>库存价值</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => {
                      const status = getStockStatus(item.stock, item.minStock);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-gray-500">{item.barcode}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.stock} {item.unit}</div>
                            <div className="text-xs text-gray-500">预警: {item.minStock}</div>
                          </TableCell>
                          <TableCell>¥{item.costPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-green-600">¥{item.sellingPrice.toFixed(2)}</TableCell>
                          <TableCell>¥{(item.stock * item.costPrice).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge className={status.className}>{status.label}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {filteredInventory.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">暂无库存数据</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="records" className="mt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品名称</TableHead>
                      <TableHead>变动类型</TableHead>
                      <TableHead>变动数量</TableHead>
                      <TableHead>变动前</TableHead>
                      <TableHead>变动后</TableHead>
                      <TableHead>原因</TableHead>
                      <TableHead>操作人</TableHead>
                      <TableHead>时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockRecords.map((record) => {
                      const typeStyle = getRecordTypeStyle(record.type);
                      const Icon = typeStyle.icon;
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.productName}</TableCell>
                          <TableCell>
                            <Badge className={typeStyle.className}>
                              <Icon className="h-3 w-3 mr-1" />
                              {typeStyle.label}
                            </Badge>
                          </TableCell>
                          <TableCell className={record.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                            {record.quantity > 0 ? '+' : ''}{record.quantity}
                          </TableCell>
                          <TableCell>{record.beforeStock}</TableCell>
                          <TableCell>{record.afterStock}</TableCell>
                          <TableCell className="text-gray-500">{record.reason}</TableCell>
                          <TableCell>{record.operator}</TableCell>
                          <TableCell className="text-gray-500 text-sm">{record.time}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {stockRecords.length === 0 && (
                <div className="text-center py-12">
                  <ArrowUpDown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">暂无变动记录</p>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
