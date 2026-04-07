'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Calendar,
  Download,
  Percent,
  Smartphone,
  Store,
  RefreshCw,
} from 'lucide-react';

// 模拟销售数据
const salesData = {
  daily: [
    { date: '03-10', amount: 8200, orders: 85, customers: 38 },
    { date: '03-11', amount: 9500, orders: 98, customers: 42 },
    { date: '03-12', amount: 7800, orders: 82, customers: 36 },
    { date: '03-13', amount: 10200, orders: 105, customers: 45 },
    { date: '03-14', amount: 8900, orders: 92, customers: 40 },
    { date: '03-15', amount: 12580, orders: 128, customers: 52 },
  ],
  weekly: [
    { week: '第10周', amount: 45800, orders: 470, customers: 201 },
    { week: '第11周', amount: 52100, orders: 535, customers: 228 },
    { week: '第12周', amount: 48900, orders: 502, customers: 215 },
  ],
};

// 畅销商品
const topProducts = [
  { rank: 1, name: '矿泉水 500ml', sales: 580, amount: 1160.00, growth: 15.2 },
  { rank: 2, name: '可乐 330ml', sales: 465, amount: 1627.50, growth: 12.8 },
  { rank: 3, name: '苹果 红富士', sales: 420, amount: 3360.00, growth: 8.5 },
  { rank: 4, name: '香蕉 香蕉', sales: 380, amount: 2280.00, growth: -5.2 },
  { rank: 5, name: '牛奶 250ml', sales: 356, amount: 1424.00, growth: 3.2 },
];

// 员工绩效
const staffPerformance = [
  { name: '收银员1', orders: 256, amount: 25680, avgTicket: 100.31 },
  { name: '收银员2', orders: 198, amount: 19800, avgTicket: 100.00 },
  { name: '收银员3', orders: 165, amount: 18250, avgTicket: 110.61 },
];

// 毛利率分析
const marginAnalysis = [
  { category: '饮品', sales: 25680, cost: 15300, margin: 40.4 },
  { category: '零食', sales: 18900, cost: 11340, margin: 40.0 },
  { category: '水果', sales: 15200, cost: 9120, margin: 40.0 },
  { category: '生鲜', sales: 9850, cost: 6400, margin: 35.0 },
  { category: '日用品', sales: 8200, cost: 5700, margin: 30.5 },
];

// 小程序销售数据
const miniStoreData = {
  overview: {
    totalSales: 118450,
    totalOrders: 1856,
    avgTicket: 63.86,
    memberRate: 76.8,
    salesGrowth: 18.5,
    ordersGrowth: 15.2,
    ticketGrowth: 2.8,
  },
  channels: [
    { name: '店内销售', sales: 156280, orders: 2156, members: 1523, rate: 47.9, growth: 10.2, icon: Store, color: 'blue' },
    { name: '小程序销售', sales: 118450, orders: 1856, members: 1423, rate: 36.3, growth: 18.5, icon: Smartphone, color: 'green' },
    { name: '社区团购', sales: 51850, orders: 811, members: 45, rate: 15.8, growth: 25.3, icon: Users, color: 'orange' },
  ],
  topStores: [
    { rank: 1, name: '南山店', inStore: 45680, miniapp: 35230, groupBuy: 15680, total: 96590, change: 15.2 },
    { rank: 2, name: '福田店', inStore: 38920, miniapp: 28450, groupBuy: 12580, total: 79950, change: 12.8 },
    { rank: 3, name: '龙华店', inStore: 32150, miniapp: 24560, groupBuy: 10230, total: 66940, change: 8.5 },
    { rank: 4, name: '宝安店', inStore: 28930, miniapp: 18230, groupBuy: 8560, total: 55720, change: -2.3 },
    { rank: 5, name: '罗湖店', inStore: 10600, miniapp: 11980, groupBuy: 4800, total: 27380, change: 5.6 },
  ],
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('daily');
  const [activeTab, setActiveTab] = useState('sales');

  const currentData = salesData[timeRange as keyof typeof salesData] || salesData.daily;

  const totalSales = currentData.reduce((sum, item) => sum + item.amount, 0);
  const totalOrders = currentData.reduce((sum, item) => sum + item.orders, 0);
  const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader title="数据报表" description="销售趋势、商品分析、员工绩效、毛利率分析" />

      <div className="flex-1 overflow-auto p-6">
        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                总销售额
              </CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{totalSales.toLocaleString()}</div>
              <div className="flex items-center text-xs mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-500">+12.5%</span>
                <span className="text-muted-foreground ml-1">较上期</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                订单总数
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <div className="flex items-center text-xs mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-500">+8.3%</span>
                <span className="text-muted-foreground ml-1">较上期</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                平均客单价
              </CardTitle>
              <Package className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{avgTicket.toFixed(2)}</div>
              <div className="flex items-center text-xs mt-1">
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                <span className="text-red-500">-2.1%</span>
                <span className="text-muted-foreground ml-1">较上期</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                顾客数
              </CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentData.reduce((sum, item) => sum + item.customers, 0)}
              </div>
              <div className="flex items-center text-xs mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-500">+5.6%</span>
                <span className="text-muted-foreground ml-1">较上期</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 时间范围选择 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">按日</SelectItem>
                <SelectItem value="weekly">按周</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出报表
          </Button>
        </div>

        {/* 分析标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-4 pt-4">
            <TabsList>
              <TabsTrigger value="sales">销售趋势</TabsTrigger>
              <TabsTrigger value="products">商品分析</TabsTrigger>
              <TabsTrigger value="staff">员工绩效</TabsTrigger>
              <TabsTrigger value="margin">毛利率分析</TabsTrigger>
              <TabsTrigger value="ministore">小程序销售</TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-4">
            <TabsContent value="sales">
              <Card>
                <CardHeader>
                  <CardTitle>销售趋势图</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-end justify-between gap-4 px-4">
                    {currentData.map((item, index) => {
                      const maxAmount = Math.max(...currentData.map(d => d.amount));
                      const height = (item.amount / maxAmount) * 250;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                          <div className="text-xs font-medium text-muted-foreground text-center">
                            <div>¥{item.amount.toLocaleString()}</div>
                            <div className="text-xs">{item.orders}单</div>
                          </div>
                          <div className="w-full bg-orange-100 rounded-t-lg transition-all duration-300 relative">
                            <div
                              className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-300 bg-orange-500`}
                              style={{ height: `${height}px` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {timeRange === 'daily' && 'date' in item ? item.date : 'week' in item ? item.week : item.date}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>畅销商品 TOP 5</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProducts.map((product) => (
                      <div key={product.rank} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${product.rank <= 3 ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'}`}>
                            {product.rank}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              销售 {product.sales} | ¥{product.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`flex items-center gap-1 ${product.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {product.growth >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span className="font-medium">
                              {product.growth >= 0 ? '+' : ''}{product.growth}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff">
              <Card>
                <CardHeader>
                  <CardTitle>员工绩效</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {staffPerformance.map((staff, index) => (
                      <div key={index} className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{staff.name}</h4>
                          <Badge>第 {index + 1} 名</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">订单数</div>
                            <div className="text-lg font-bold">{staff.orders}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">销售额</div>
                            <div className="text-lg font-bold">¥{staff.amount.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">客单价</div>
                            <div className="text-lg font-bold">¥{staff.avgTicket.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="margin">
              <Card>
                <CardHeader>
                  <CardTitle>毛利率分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marginAnalysis.map((item, index) => {
                      const marginBarWidth = item.margin;
                      return (
                        <div key={index} className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{item.category}</h4>
                            <div className="flex items-center gap-2">
                              <Percent className="h-4 w-4 text-muted-foreground" />
                              <span className="font-bold text-orange-600">{item.margin}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                            <div
                              className={`h-full transition-all ${
                                item.margin >= 40 ? 'bg-green-500' :
                                item.margin >= 35 ? 'bg-blue-500' :
                                'bg-yellow-500'
                              }`}
                              style={{ width: `${marginBarWidth}%` }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">销售额: </span>
                              <span className="font-medium">¥{item.sales.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">成本: </span>
                              <span className="font-medium">¥{item.cost.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">毛利: </span>
                              <span className="font-medium text-green-600">
                                ¥{(item.sales - item.cost).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ministore">
              <div className="space-y-4">
                {/* 小程序销售概览 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      小程序销售概览
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-lg text-white">
                        <p className="text-sm opacity-80">小程序销售额</p>
                        <p className="text-2xl font-bold mt-1">¥{miniStoreData.overview.totalSales.toLocaleString()}</p>
                        <p className="text-xs mt-2 opacity-80">
                          <span className="text-green-300">↑ {miniStoreData.overview.salesGrowth}%</span> 较上周
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
                        <p className="text-sm opacity-80">订单数</p>
                        <p className="text-2xl font-bold mt-1">{miniStoreData.overview.totalOrders.toLocaleString()}</p>
                        <p className="text-xs mt-2 opacity-80">
                          <span className="text-green-300">↑ {miniStoreData.overview.ordersGrowth}%</span> 较上周
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg text-white">
                        <p className="text-sm opacity-80">客单价</p>
                        <p className="text-2xl font-bold mt-1">¥{miniStoreData.overview.avgTicket.toFixed(2)}</p>
                        <p className="text-xs mt-2 opacity-80">
                          <span className="text-green-300">↑ {miniStoreData.overview.ticketGrowth}%</span> 较上周
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg text-white">
                        <p className="text-sm opacity-80">会员消费占比</p>
                        <p className="text-2xl font-bold mt-1">{miniStoreData.overview.memberRate}%</p>
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
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {miniStoreData.channels.map((channel, index) => {
                        const IconComponent = channel.icon;
                        const colorClasses: Record<string, string> = {
                          blue: 'bg-blue-100 text-blue-600',
                          green: 'bg-green-100 text-green-600',
                          orange: 'bg-orange-100 text-orange-600',
                        };
                        const barColors: Record<string, string> = {
                          blue: 'bg-blue-500',
                          green: 'bg-green-500',
                          orange: 'bg-orange-500',
                        };
                        return (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[channel.color]}`}>
                                  <IconComponent className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-medium">{channel.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {channel.name === '社区团购' ? `团长: ${channel.members}` : `会员: ${channel.members}`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold">¥{channel.sales.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">占比 {channel.rate}%</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                <span>订单: {channel.orders.toLocaleString()}</span>
                              </div>
                              <span className="text-green-500">↑ {channel.growth}%</span>
                            </div>
                            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${barColors[channel.color]} rounded-full`} style={{ width: `${channel.rate}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* 各店铺销售排名 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      各店铺销售排名
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2">排名</th>
                            <th className="text-left py-3 px-2">店铺名称</th>
                            <th className="text-right py-3 px-2">店内销售</th>
                            <th className="text-right py-3 px-2">小程序</th>
                            <th className="text-right py-3 px-2">团购</th>
                            <th className="text-right py-3 px-2">总销售额</th>
                            <th className="text-right py-3 px-2">环比</th>
                          </tr>
                        </thead>
                        <tbody>
                          {miniStoreData.topStores.map((store) => (
                            <tr key={store.rank} className="border-b">
                              <td className="py-3 px-2">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                  store.rank <= 3 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {store.rank}
                                </span>
                              </td>
                              <td className="py-3 px-2 font-medium">{store.name}</td>
                              <td className="py-3 px-2 text-right">¥{store.inStore.toLocaleString()}</td>
                              <td className="py-3 px-2 text-right">¥{store.miniapp.toLocaleString()}</td>
                              <td className="py-3 px-2 text-right">¥{store.groupBuy.toLocaleString()}</td>
                              <td className="py-3 px-2 text-right font-bold">¥{store.total.toLocaleString()}</td>
                              <td className="py-3 px-2 text-right">
                                <span className={store.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {store.change >= 0 ? '↑' : '↓'} {Math.abs(store.change)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </div>
    </div>
  );
}
