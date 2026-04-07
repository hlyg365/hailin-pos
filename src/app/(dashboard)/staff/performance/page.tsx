'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 销售业绩接口
interface SalesPerformance {
  employeeId: number;
  employeeName: string;
  shopName: string;
  role: string;
  orderCount: number;
  totalSales: number;
  avgOrderValue: number;
  todayOrders: number;
  todaySales: number;
  monthOrders: number;
  monthSales: number;
  yesterdaySales: number;
  lastMonthSales: number;
  growthRate: number;
}

// 店铺列表
const shops = [
  { id: 'all', name: '全部店铺' },
  { id: '1', name: '南山店' },
  { id: '2', name: '福田店' },
  { id: '3', name: '龙华店' },
];

// 模拟绩效数据
const mockPerformances: SalesPerformance[] = [
  { employeeId: 1, employeeName: '王小明', shopName: '南山店', role: '店长', orderCount: 456, totalSales: 28560, avgOrderValue: 62.63, todayOrders: 12, todaySales: 780, monthOrders: 156, monthSales: 9820, yesterdaySales: 650, lastMonthSales: 8500, growthRate: 15.5 },
  { employeeId: 2, employeeName: '李小红', shopName: '南山店', role: '店员', orderCount: 328, totalSales: 18650, avgOrderValue: 56.86, todayOrders: 18, todaySales: 1020, monthOrders: 128, monthSales: 7250, yesterdaySales: 880, lastMonthSales: 6200, growthRate: 16.9 },
  { employeeId: 3, employeeName: '张小华', shopName: '南山店', role: '店员', orderCount: 275, totalSales: 15230, avgOrderValue: 55.38, todayOrders: 15, todaySales: 890, monthOrders: 102, monthSales: 5680, yesterdaySales: 720, lastMonthSales: 4800, growthRate: 18.3 },
  { employeeId: 5, employeeName: '刘大伟', shopName: '福田店', role: '店长', orderCount: 389, totalSales: 23450, avgOrderValue: 60.28, todayOrders: 14, todaySales: 920, monthOrders: 142, monthSales: 8650, yesterdaySales: 780, lastMonthSales: 7200, growthRate: 20.1 },
  { employeeId: 6, employeeName: '赵小燕', shopName: '福田店', role: '店员', orderCount: 256, totalSales: 14320, avgOrderValue: 55.94, todayOrders: 12, todaySales: 680, monthOrders: 95, monthSales: 5280, yesterdaySales: 560, lastMonthSales: 4500, growthRate: 17.3 },
  { employeeId: 7, employeeName: '周小强', shopName: '龙华店', role: '店长', orderCount: 412, totalSales: 25680, avgOrderValue: 62.33, todayOrders: 16, todaySales: 1050, monthOrders: 148, monthSales: 9120, yesterdaySales: 920, lastMonthSales: 7800, growthRate: 16.9 },
  { employeeId: 8, employeeName: '吴小梅', shopName: '龙华店', role: '店员', orderCount: 298, totalSales: 16890, avgOrderValue: 56.68, todayOrders: 13, todaySales: 760, monthOrders: 112, monthSales: 6350, yesterdaySales: 680, lastMonthSales: 5200, growthRate: 22.1 },
];

type SortField = 'employeeName' | 'todaySales' | 'monthSales' | 'totalSales' | 'growthRate' | 'avgOrderValue';
type SortOrder = 'asc' | 'desc';

export default function PerformancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShop, setSelectedShop] = useState('all');
  const [sortField, setSortField] = useState<SortField>('monthSales');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 筛选和排序后的数据
  const filteredAndSortedData = useMemo(() => {
    let data = [...mockPerformances];

    // 店铺筛选
    if (selectedShop !== 'all') {
      const shopName = shops.find(s => s.id === selectedShop)?.name;
      data = data.filter(p => p.shopName === shopName);
    }

    // 搜索筛选
    if (searchTerm) {
      data = data.filter(p => 
        p.employeeName.includes(searchTerm) || 
        p.shopName.includes(searchTerm)
      );
    }

    // 排序
    data.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue as string) 
          : (bValue as string).localeCompare(aValue as string);
      }
      return sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number) 
        : (bValue as number) - (aValue as number);
    });

    return data;
  }, [searchTerm, selectedShop, sortField, sortOrder]);

  // 统计汇总
  const summary = useMemo(() => {
    const data = selectedShop === 'all' 
      ? mockPerformances 
      : mockPerformances.filter(p => p.shopName === shops.find(s => s.id === selectedShop)?.name);
    
    return {
      totalEmployees: data.length,
      totalTodaySales: data.reduce((sum, p) => sum + p.todaySales, 0),
      totalMonthSales: data.reduce((sum, p) => sum + p.monthSales, 0),
      totalOrders: data.reduce((sum, p) => sum + p.monthOrders, 0),
      avgGrowth: (data.reduce((sum, p) => sum + p.growthRate, 0) / data.length).toFixed(1),
    };
  }, [selectedShop]);

  // 排序切换
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // 排序图标
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-gray-300" />;
    return sortOrder === 'asc' 
      ? <TrendingUp className="h-4 w-4 text-blue-500" />
      : <TrendingDown className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">绩效统计</h1>
          <p className="text-muted-foreground mt-1">查看员工销售业绩和工作表现</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            本月
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">在职员工</p>
                <p className="text-2xl font-bold">{summary.totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">今日销售</p>
                <p className="text-2xl font-bold">¥{summary.totalTodaySales.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">本月销售</p>
                <p className="text-2xl font-bold">¥{summary.totalMonthSales.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">本月订单</p>
                <p className="text-2xl font-bold">{summary.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">平均增长</p>
                <p className="text-2xl font-bold">{summary.avgGrowth}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选条件 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索员工姓名或店铺..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedShop} onValueChange={setSelectedShop}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="选择店铺" />
              </SelectTrigger>
              <SelectContent>
                {shops.map(shop => (
                  <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 绩效表格 */}
      <Card>
        <CardHeader>
          <CardTitle>员工绩效明细</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSort('employeeName')}
                  >
                    <div className="flex items-center gap-2">
                      员工姓名
                      <SortIcon field="employeeName" />
                    </div>
                  </TableHead>
                  <TableHead>店铺</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSort('todaySales')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      今日销售
                      <SortIcon field="todaySales" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSort('monthSales')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      本月销售
                      <SortIcon field="monthSales" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">本月订单</TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSort('avgOrderValue')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      客单价
                      <SortIcon field="avgOrderValue" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSort('growthRate')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      环比增长
                      <SortIcon field="growthRate" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.map((perf) => (
                  <TableRow key={perf.employeeId}>
                    <TableCell className="font-medium">{perf.employeeName}</TableCell>
                    <TableCell>{perf.shopName}</TableCell>
                    <TableCell>
                      <Badge variant={perf.role === '店长' ? 'default' : 'secondary'}>
                        {perf.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ¥{perf.todaySales.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium text-blue-600">
                      ¥{perf.monthSales.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {perf.monthOrders} 单
                    </TableCell>
                    <TableCell className="text-right">
                      ¥{perf.avgOrderValue.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "flex items-center justify-end gap-1",
                        perf.growthRate >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {perf.growthRate >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {perf.growthRate >= 0 ? '+' : ''}{perf.growthRate}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 排行榜 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 本月销售TOP3 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              本月销售TOP3
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAndSortedData
                .sort((a, b) => b.monthSales - a.monthSales)
                .slice(0, 3)
                .map((perf, index) => (
                  <div key={perf.employeeId} className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-white",
                      index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-400"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{perf.employeeName}</p>
                      <p className="text-sm text-gray-500">{perf.shopName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">¥{perf.monthSales.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{perf.monthOrders} 单</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* 增长最快TOP3 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              增长最快TOP3
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAndSortedData
                .sort((a, b) => b.growthRate - a.growthRate)
                .slice(0, 3)
                .map((perf, index) => (
                  <div key={perf.employeeId} className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-white",
                      index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-400"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{perf.employeeName}</p>
                      <p className="text-sm text-gray-500">{perf.shopName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">+{perf.growthRate}%</p>
                      <p className="text-sm text-gray-500">环比增长</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
