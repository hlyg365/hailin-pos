'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  BarChart3,
  Store,
  Smartphone,
  Users,
  ShoppingCart,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';

export default function MiniStoreSalesAnalysisPage() {
  const [dateRange, setDateRange] = useState('week');

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">小程序销售分析</h2>
          <p className="text-muted-foreground">
            小程序商城销售数据分析，包含各渠道销售情况、店铺排名等
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新数据
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 时间筛选 */}
      <div className="flex items-center gap-2">
        <Tabs value={dateRange} onValueChange={setDateRange}>
          <TabsList>
            <TabsTrigger value="today">今日</TabsTrigger>
            <TabsTrigger value="week">本周</TabsTrigger>
            <TabsTrigger value="month">本月</TabsTrigger>
            <TabsTrigger value="quarter">本季度</TabsTrigger>
            <TabsTrigger value="year">本年</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 总销售概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            总销售概览
          </CardTitle>
          <CardDescription>全部店铺、全渠道销售数据汇总</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
              <p className="text-sm opacity-80">总销售额</p>
              <p className="text-2xl font-bold mt-1">¥326,580.00</p>
              <p className="text-xs mt-2 opacity-80">
                <span className="text-green-300">↑ 12.5%</span> 较上周
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-lg text-white">
              <p className="text-sm opacity-80">总订单数</p>
              <p className="text-2xl font-bold mt-1">4,823</p>
              <p className="text-xs mt-2 opacity-80">
                <span className="text-green-300">↑ 8.3%</span> 较上周
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg text-white">
              <p className="text-sm opacity-80">客单价</p>
              <p className="text-2xl font-bold mt-1">¥67.72</p>
              <p className="text-xs mt-2 opacity-80">
                <span className="text-green-300">↑ 3.8%</span> 较上周
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg text-white">
              <p className="text-sm opacity-80">会员消费占比</p>
              <p className="text-2xl font-bold mt-1">72.3%</p>
              <p className="text-xs mt-2 opacity-80">
                <span className="text-green-300">↑ 5.2%</span> 较上周
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 销售渠道分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            销售渠道分布
          </CardTitle>
          <CardDescription>店内销售、小程序销售、社区团购销售数据对比</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 店内销售 */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Store className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">店内销售</p>
                    <p className="text-sm text-muted-foreground">收银台POS销售</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-600">¥156,280.00</p>
                  <p className="text-sm text-muted-foreground">占比 47.9%</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span>订单: 2,156</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>会员: 1,523</span>
                </div>
                <span className="text-green-500">↑ 10.2%</span>
              </div>
              <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '47.9%' }}></div>
              </div>
            </div>

            {/* 小程序销售 */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">小程序销售</p>
                    <p className="text-sm text-muted-foreground">微信小程序商城订单</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">¥118,450.00</p>
                  <p className="text-sm text-muted-foreground">占比 36.3%</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span>订单: 1,856</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>会员: 1,423</span>
                </div>
                <span className="text-green-500">↑ 18.5%</span>
              </div>
              <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '36.3%' }}></div>
              </div>
            </div>

            {/* 社区团购销售 */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">社区团购销售</p>
                    <p className="text-sm text-muted-foreground">团长团购订单</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-orange-600">¥51,850.00</p>
                  <p className="text-sm text-muted-foreground">占比 15.8%</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span>订单: 811</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>团长: 45</span>
                </div>
                <span className="text-green-500">↑ 25.3%</span>
              </div>
              <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '15.8%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 各店铺销售排名 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                各店铺销售排名
              </CardTitle>
              <CardDescription>各门店销售业绩对比</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/reports/analysis'}>
              查看详细报表
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>排名</TableHead>
                <TableHead>店铺名称</TableHead>
                <TableHead>店内销售</TableHead>
                <TableHead>小程序销售</TableHead>
                <TableHead>团购销售</TableHead>
                <TableHead>总销售额</TableHead>
                <TableHead>环比</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { rank: 1, name: '南山店', inStore: 45680, miniapp: 35230, groupBuy: 15680, total: 96590, change: 15.2 },
                { rank: 2, name: '福田店', inStore: 38920, miniapp: 28450, groupBuy: 12580, total: 79950, change: 12.8 },
                { rank: 3, name: '龙华店', inStore: 32150, miniapp: 24560, groupBuy: 10230, total: 66940, change: 8.5 },
                { rank: 4, name: '宝安店', inStore: 28930, miniapp: 18230, groupBuy: 8560, total: 55720, change: -2.3 },
                { rank: 5, name: '龙岗店', inStore: 10600, miniapp: 11980, groupBuy: 4800, total: 27380, change: 6.7 },
              ].map((store) => (
                <TableRow key={store.rank}>
                  <TableCell>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      store.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      store.rank === 2 ? 'bg-gray-100 text-gray-600' :
                      store.rank === 3 ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {store.rank}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell className="text-blue-600">¥{store.inStore.toLocaleString()}</TableCell>
                  <TableCell className="text-green-600">¥{store.miniapp.toLocaleString()}</TableCell>
                  <TableCell className="text-orange-600">¥{store.groupBuy.toLocaleString()}</TableCell>
                  <TableCell className="font-bold">¥{store.total.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={store.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {store.change >= 0 ? '↑' : '↓'} {Math.abs(store.change)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 快捷入口 */}
      <Card>
        <CardHeader>
          <CardTitle>报表分析入口</CardTitle>
          <CardDescription>点击查看更详细的销售分析报表</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => window.location.href = '/analytics'}
            >
              <BarChart3 className="h-6 w-6" />
              <span>销售分析</span>
              <span className="text-xs text-muted-foreground">详细销售数据分析</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => window.location.href = '/analytics/products'}
            >
              <PieChart className="h-6 w-6" />
              <span>商品分析</span>
              <span className="text-xs text-muted-foreground">商品销售排行</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => window.location.href = '/analytics/members'}
            >
              <Users className="h-6 w-6" />
              <span>会员分析</span>
              <span className="text-xs text-muted-foreground">会员消费分析</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
