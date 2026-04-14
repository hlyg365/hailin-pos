'use client';

import { useState } from 'react';
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
  Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// 模拟库存数据
const inventoryData = [
  { id: 1, name: '可口可乐500ml', barcode: '6901234567890', stock: 24, unit: '瓶', minStock: 20, price: 3.00, category: '饮料' },
  { id: 2, name: '农夫山泉550ml', barcode: '6901234567891', stock: 48, unit: '瓶', minStock: 30, price: 2.00, category: '饮料' },
  { id: 3, name: '康师傅红烧牛肉面', barcode: '6901234567892', stock: 12, unit: '桶', minStock: 15, price: 4.50, category: '方便食品' },
  { id: 4, name: '双汇王中王火腿肠', barcode: '6901234567893', stock: 36, unit: '根', minStock: 20, price: 2.50, category: '休闲食品' },
  { id: 5, name: '维达抽纸', barcode: '6901234567894', stock: 8, unit: '包', minStock: 10, price: 8.90, category: '日用品' },
  { id: 6, name: '蒙牛纯牛奶250ml', barcode: '6901234567895', stock: 6, unit: '盒', minStock: 15, price: 3.50, category: '乳制品' },
];

const stocktakeHistory = [
  { id: 1, date: '2024-01-15 14:30', user: '张店长', items: 156, status: 'completed' },
  { id: 2, date: '2024-01-14 09:15', user: '李员工', items: 142, status: 'completed' },
  { id: 3, date: '2024-01-13 16:45', user: '张店长', items: 138, status: 'completed' },
];

export default function InventoryPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list');

  const filteredItems = inventoryData.filter(item =>
    item.name.includes(searchTerm) || item.barcode.includes(searchTerm)
  );

  const lowStockItems = inventoryData.filter(item => item.stock <= item.minStock);

  return (
    <div className="p-4 space-y-4">
      {/* 搜索栏 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索商品名称/条码"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button 
          variant="outline"
          onClick={() => router.push('/assistant/inventory/scan')}
        >
          <ScanLine className="h-4 w-4" />
        </Button>
      </div>

      {/* 快捷统计 */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="py-3">
            <p className="text-2xl font-bold text-blue-500">{inventoryData.length}</p>
            <p className="text-xs text-gray-500">商品种类</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="py-3">
            <p className="text-2xl font-bold text-orange-500">{lowStockItems.length}</p>
            <p className="text-xs text-gray-500">库存预警</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="py-3">
            <p className="text-2xl font-bold text-green-500">3</p>
            <p className="text-xs text-gray-500">临期商品</p>
          </CardContent>
        </Card>
      </div>

      {/* 功能入口 */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2"
          onClick={() => router.push('/assistant/inventory/stocktake')}
        >
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Package className="h-5 w-5 text-orange-500" />
          </div>
          <span>库存盘点</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2"
          onClick={() => router.push('/assistant/inventory/scan')}
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <ScanLine className="h-5 w-5 text-blue-500" />
          </div>
          <span>扫码查询</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="list" className="flex-1">库存列表</TabsTrigger>
          <TabsTrigger value="warning" className="flex-1">库存预警</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">盘点记录</TabsTrigger>
        </TabsList>

        {/* 库存列表 */}
        <TabsContent value="list" className="space-y-2 mt-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="flex items-center p-3 gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  <Package className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    {item.stock <= item.minStock && (
                      <Badge variant="destructive" className="text-[10px]">库存不足</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{item.barcode}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-blue-500 font-medium">
                      库存: {item.stock}{item.unit}
                    </span>
                    <span className="text-sm text-gray-400">
                      ¥{item.price.toFixed(2)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* 库存预警 */}
        <TabsContent value="warning" className="space-y-2 mt-4">
          {lowStockItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>暂无库存预警</p>
            </div>
          ) : (
            lowStockItems.map((item) => (
              <Card key={item.id} className="border-orange-200 bg-orange-50/50">
                <div className="flex items-center p-3 gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-orange-600">
                      当前库存 {item.stock}{item.unit}，低于安全库存 {item.minStock}{item.unit}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0">
                    补货
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* 盘点记录 */}
        <TabsContent value="history" className="space-y-2 mt-4">
          {stocktakeHistory.map((record) => (
            <Card key={record.id}>
              <div className="flex items-center p-3 gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{record.date}</p>
                  <p className="text-xs text-gray-400">
                    {record.user} · 盘点 {record.items} 项
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-600">
                  已完成
                </Badge>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
