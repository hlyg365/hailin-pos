'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Clock,
} from 'lucide-react';

// 模拟数据
const salesData = {
  totalSales: 125678.50,
  totalOrders: 1523,
  avgOrderAmount: 82.56,
  todaySales: 8567.00,
  yesterdaySales: 7892.00,
  growthRate: 8.56,
};

const topProducts = [
  { rank: 1, name: '可乐 330ml', sales: 1256, amount: 4396.00, growth: 15.2 },
  { rank: 2, name: '矿泉水 500ml', sales: 1089, amount: 2178.00, growth: 8.5 },
  { rank: 3, name: '薯片 原味', sales: 756, amount: 6048.00, growth: -2.3 },
  { rank: 4, name: '方便面 桶装', sales: 654, amount: 1962.00, growth: 5.8 },
  { rank: 5, name: '牛奶 250ml', sales: 523, amount: 2092.00, growth: 12.1 },
];

const topCategories = [
  { name: '饮料', sales: 54230.00, percentage: 43.2, growth: 10.5 },
  { name: '零食', sales: 31245.00, percentage: 24.9, growth: 5.2 },
  { name: '日化', sales: 18956.00, percentage: 15.1, growth: -3.1 },
  { name: '乳制品', sales: 15678.00, percentage: 12.5, growth: 8.7 },
  { name: '其他', sales: 5569.50, percentage: 4.4, growth: 2.3 },
];

const memberStats = {
  totalMembers: 3456,
  newMembersToday: 23,
  activeMembers: 2156,
  memberSales: 85678.00,
  memberPercentage: 68.2,
};

const topMembers = [
  { rank: 1, name: '张先生', phone: '138****1234', points: 5680, amount: 8567.00, level: '钻石会员' },
  { rank: 2, name: '李女士', phone: '139****5678', points: 4523, amount: 7234.00, level: '钻石会员' },
  { rank: 3, name: '王先生', phone: '137****9012', points: 3890, amount: 6123.00, level: '金卡会员' },
  { rank: 4, name: '赵女士', phone: '136****3456', points: 3210, amount: 5456.00, level: '金卡会员' },
  { rank: 5, name: '钱先生', phone: '135****7890', points: 2890, amount: 4890.00, level: '银卡会员' },
];

const inventoryStats = {
  totalProducts: 567,
  lowStock: 23,
  outOfStock: 5,
  turnover: 2.3,
};

const lowStockProducts = [
  { name: '薯片 原味', stock: 8, minStock: 20, salesLast7Days: 45 },
  { name: '方便面 桶装', stock: 12, minStock: 30, salesLast7Days: 52 },
  { name: '酸奶 原味', stock: 5, minStock: 15, salesLast7Days: 38 },
  { name: '饼干 巧克力味', stock: 10, minStock: 25, salesLast7Days: 32 },
  { name: '牛奶 250ml', stock: 15, minStock: 40, salesLast7Days: 65 },
];

const salesTrend = [
  { date: '03-15', sales: 8567, orders: 105 },
  { date: '03-16', sales: 9234, orders: 112 },
  { date: '03-17', sales: 7890, orders: 96 },
  { date: '03-18', sales: 10567, orders: 128 },
  { date: '03-19', sales: 11234, orders: 137 },
  { date: '03-20', sales: 9876, orders: 121 },
  { date: '03-21', sales: 8567, orders: 105 },
];

const hourlySales = [
  { hour: '8:00', sales: 234, orders: 3 },
  { hour: '9:00', sales: 567, orders: 7 },
  { hour: '10:00', sales: 890, orders: 11 },
  { hour: '11:00', sales: 1234, orders: 15 },
  { hour: '12:00', sales: 1567, orders: 19 },
  { hour: '13:00', sales: 1890, orders: 23 },
  { hour: '14:00', sales: 1456, orders: 18 },
  { hour: '15:00', sales: 1123, orders: 14 },
  { hour: '16:00', sales: 890, orders: 11 },
  { hour: '17:00', sales: 1345, orders: 16 },
  { hour: '18:00', sales: 1678, orders: 20 },
  { hour: '19:00', sales: 2012, orders: 24 },
  { hour: '20:00', sales: 1789, orders: 22 },
  { hour: '21:00', sales: 1456, orders: 18 },
  { hour: '22:00', sales: 890, orders: 11 },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('7d');

  const StatCard = ({
    title,
    value,
    icon: Icon,
    change,
    changeType,
  }: {
    title: string;
    value: string | number;
    icon: any;
    change?: number;
    changeType?: 'up' | 'down';
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change !== undefined && (
              <p
                className={`text-sm mt-2 flex items-center ${
                  changeType === 'up' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {changeType === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                {change > 0 ? '+' : ''}
                {change}%
              </p>
            )}
          </div>
          <Icon className="h-8 w-8 text-blue-500" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="数据报表"
        description="销售、商品、会员、库存数据分析"
      >
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">今日</SelectItem>
              <SelectItem value="7d">近7天</SelectItem>
              <SelectItem value="30d">近30天</SelectItem>
              <SelectItem value="90d">近90天</SelectItem>
              <SelectItem value="custom">自定义</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出报表
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="sales" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sales">销售分析</TabsTrigger>
              <TabsTrigger value="products">商品分析</TabsTrigger>
              <TabsTrigger value="members">会员分析</TabsTrigger>
              <TabsTrigger value="inventory">库存分析</TabsTrigger>
            </TabsList>

            {/* 销售分析 */}
            <TabsContent value="sales" className="space-y-6">
              {/* 关键指标 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  title="总销售额"
                  value={`¥${salesData.totalSales.toLocaleString()}`}
                  icon={DollarSign}
                  change={salesData.growthRate}
                  changeType="up"
                />
                <StatCard
                  title="订单数"
                  value={salesData.totalOrders}
                  icon={ShoppingBag}
                  change={5.2}
                  changeType="up"
                />
                <StatCard
                  title="客单价"
                  value={`¥${salesData.avgOrderAmount.toFixed(2)}`}
                  icon={Users}
                  change={2.1}
                  changeType="up"
                />
                <StatCard
                  title="今日销售额"
                  value={`¥${salesData.todaySales.toLocaleString()}`}
                  icon={TrendingUp}
                  change={(salesData.todaySales - salesData.yesterdaySales) / salesData.yesterdaySales * 100}
                  changeType="up"
                />
              </div>

              {/* 销售趋势 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>销售趋势（近7天）</CardTitle>
                    <CardDescription>
                      每日销售额和订单数变化
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {salesTrend.map((item) => (
                        <div key={item.date} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{item.date}</span>
                            <div className="flex gap-4">
                              <span>¥{item.sales.toLocaleString()}</span>
                              <span>{item.orders}单</span>
                            </div>
                          </div>
                          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="absolute h-full bg-blue-500 rounded-full transition-all"
                              style={{
                                width: `${(item.sales / Math.max(...salesTrend.map(d => d.sales))) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>时段销售分布</CardTitle>
                    <CardDescription>
                      今日各时段销售额
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {hourlySales.map((item) => (
                        <div key={item.hour} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{item.hour}</span>
                            <span>¥{item.sales.toLocaleString()}</span>
                          </div>
                          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="absolute h-full bg-green-500 rounded-full transition-all"
                              style={{
                                width: `${(item.sales / Math.max(...hourlySales.map(d => d.sales))) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 分类占比 */}
              <Card>
                <CardHeader>
                  <CardTitle>分类销售占比</CardTitle>
                  <CardDescription>
                    各商品分类销售额占比
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topCategories.map((category) => (
                      <div key={category.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{category.name}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              ¥{category.sales.toLocaleString()}
                            </span>
                            <Badge variant="outline">{category.percentage}%</Badge>
                            <span
                              className={`text-sm ${
                                category.growth >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}
                            >
                              {category.growth >= 0 ? '+' : ''}
                              {category.growth}%
                            </span>
                          </div>
                        </div>
                        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="absolute h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 商品分析 */}
            <TabsContent value="products" className="space-y-6">
              {/* 销量排行 */}
              <Card>
                <CardHeader>
                  <CardTitle>商品销量排行</CardTitle>
                  <CardDescription>
                    销量最高的商品
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>排名</TableHead>
                        <TableHead>商品名称</TableHead>
                        <TableHead>销量</TableHead>
                        <TableHead>销售额</TableHead>
                        <TableHead>增长率</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProducts.map((product) => (
                        <TableRow key={product.rank}>
                          <TableCell>
                            <Badge variant="outline">{product.rank}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.sales}</TableCell>
                          <TableCell>¥{product.amount.toLocaleString()}</TableCell>
                          <TableCell
                            className={
                              product.growth >= 0 ? 'text-green-500' : 'text-red-500'
                            }
                          >
                            {product.growth >= 0 ? '+' : ''}
                            {product.growth}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* 分类统计 */}
              <Card>
                <CardHeader>
                  <CardTitle>分类销售统计</CardTitle>
                  <CardDescription>
                    各分类的销售情况
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>分类名称</TableHead>
                        <TableHead>销售额</TableHead>
                        <TableHead>占比</TableHead>
                        <TableHead>增长率</TableHead>
                        <TableHead>趋势</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCategories.map((category) => (
                        <TableRow key={category.name}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>¥{category.sales.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500"
                                  style={{ width: `${category.percentage}%` }}
                                />
                              </div>
                              <span>{category.percentage}%</span>
                            </div>
                          </TableCell>
                          <TableCell
                            className={
                              category.growth >= 0 ? 'text-green-500' : 'text-red-500'
                            }
                          >
                            {category.growth >= 0 ? '+' : ''}
                            {category.growth}%
                          </TableCell>
                          <TableCell>
                            {category.growth >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 会员分析 */}
            <TabsContent value="members" className="space-y-6">
              {/* 会员统计 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  title="会员总数"
                  value={memberStats.totalMembers}
                  icon={Users}
                  change={12.5}
                  changeType="up"
                />
                <StatCard
                  title="今日新增"
                  value={memberStats.newMembersToday}
                  icon={Users}
                  change={8.3}
                  changeType="up"
                />
                <StatCard
                  title="活跃会员"
                  value={memberStats.activeMembers}
                  icon={TrendingUp}
                  change={5.2}
                  changeType="up"
                />
                <StatCard
                  title="会员消费占比"
                  value={`${memberStats.memberPercentage}%`}
                  icon={Percent}
                  change={2.1}
                  changeType="up"
                />
              </div>

              {/* 会员消费排行 */}
              <Card>
                <CardHeader>
                  <CardTitle>会员消费排行</CardTitle>
                  <CardDescription>
                    消费最高的会员
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>排名</TableHead>
                        <TableHead>会员信息</TableHead>
                        <TableHead>会员等级</TableHead>
                        <TableHead>积分</TableHead>
                        <TableHead>消费金额</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topMembers.map((member) => (
                        <TableRow key={member.rank}>
                          <TableCell>
                            <Badge variant="outline">{member.rank}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {member.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge>{member.level}</Badge>
                          </TableCell>
                          <TableCell>{member.points.toLocaleString()}</TableCell>
                          <TableCell>¥{member.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 库存分析 */}
            <TabsContent value="inventory" className="space-y-6">
              {/* 库存统计 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  title="商品总数"
                  value={inventoryStats.totalProducts}
                  icon={Package}
                />
                <StatCard
                  title="库存不足"
                  value={inventoryStats.lowStock}
                  icon={Clock}
                  changeType="down"
                />
                <StatCard
                  title="缺货商品"
                  value={inventoryStats.outOfStock}
                  icon={Package}
                  changeType="down"
                />
                <StatCard
                  title="库存周转率"
                  value={`${inventoryStats.turnover}次`}
                  icon={BarChart3}
                />
              </div>

              {/* 库存预警 */}
              <Card>
                <CardHeader>
                  <CardTitle>库存预警</CardTitle>
                  <CardDescription>
                    库存不足或即将缺货的商品
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>商品名称</TableHead>
                        <TableHead>当前库存</TableHead>
                        <TableHead>最低库存</TableHead>
                        <TableHead>近7天销量</TableHead>
                        <TableHead>状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockProducts.map((product) => (
                        <TableRow key={product.name}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>{product.minStock}</TableCell>
                          <TableCell>{product.salesLast7Days}</TableCell>
                          <TableCell>
                            {product.stock === 0 ? (
                              <Badge className="bg-red-500">缺货</Badge>
                            ) : product.stock < product.minStock ? (
                              <Badge className="bg-orange-500">库存不足</Badge>
                            ) : (
                              <Badge className="bg-yellow-500">即将缺货</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
