'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Download,
  BarChart3,
  Crown,
  Star,
  Gift,
  DollarSign,
  ShoppingBag,
  Clock,
} from 'lucide-react';

// 模拟数据
const memberStats = {
  totalMembers: 3456,
  newMembersToday: 23,
  activeMembers: 2156,
  memberSales: 85678.00,
  memberPercentage: 68.2,
  avgPoints: 1250,
};

const levelStats = [
  { level: '普通会员', count: 1523, percentage: 44.1, avgSpent: 256.00, color: 'bg-gray-500' },
  { level: '银卡会员', count: 856, percentage: 24.8, avgSpent: 580.00, color: 'bg-slate-400' },
  { level: '金卡会员', count: 678, percentage: 19.6, avgSpent: 1250.00, color: 'bg-yellow-500' },
  { level: '钻石会员', count: 399, percentage: 11.5, avgSpent: 2580.00, color: 'bg-purple-500' },
];

const topMembers = [
  { rank: 1, name: '张先生', phone: '138****1234', points: 5680, amount: 8567.00, orders: 56, level: 'diamond', levelName: '钻石会员' },
  { rank: 2, name: '李女士', phone: '139****5678', points: 4523, amount: 7234.00, orders: 48, level: 'diamond', levelName: '钻石会员' },
  { rank: 3, name: '王先生', phone: '137****9012', points: 3890, amount: 6123.00, orders: 42, level: 'gold', levelName: '金卡会员' },
  { rank: 4, name: '赵女士', phone: '136****3456', points: 3210, amount: 5456.00, orders: 38, level: 'gold', levelName: '金卡会员' },
  { rank: 5, name: '钱先生', phone: '135****7890', points: 2890, amount: 4890.00, orders: 35, level: 'silver', levelName: '银卡会员' },
  { rank: 6, name: '孙女士', phone: '134****2345', points: 2456, amount: 4123.00, orders: 32, level: 'silver', levelName: '银卡会员' },
  { rank: 7, name: '周先生', phone: '133****6789', points: 2123, amount: 3789.00, orders: 28, level: 'silver', levelName: '银卡会员' },
  { rank: 8, name: '吴女士', phone: '132****0123', points: 1890, amount: 3456.00, orders: 25, level: 'silver', levelName: '银卡会员' },
  { rank: 9, name: '郑先生', phone: '131****4567', points: 1650, amount: 3123.00, orders: 23, level: 'normal', levelName: '普通会员' },
  { rank: 10, name: '王女士', phone: '130****8901', points: 1420, amount: 2890.00, orders: 21, level: 'normal', levelName: '普通会员' },
];

const consumptionStats = [
  { range: '0-100元', count: 856, percentage: 24.8 },
  { range: '100-300元', count: 1023, percentage: 29.6 },
  { range: '300-500元', count: 789, percentage: 22.8 },
  { range: '500-1000元', count: 523, percentage: 15.1 },
  { range: '1000元以上', count: 265, percentage: 7.7 },
];

const recentMembers = [
  { name: '张小明', phone: '139****8888', registeredAt: '2024-03-15 14:32', source: '扫码注册' },
  { name: '李小红', phone: '138****6666', registeredAt: '2024-03-15 11:28', source: '小程序' },
  { name: '王小华', phone: '137****4444', registeredAt: '2024-03-14 16:45', source: '扫码注册' },
  { name: '赵小丽', phone: '136****2222', registeredAt: '2024-03-14 09:12', source: '推荐' },
  { name: '钱小刚', phone: '135****0000', registeredAt: '2024-03-13 15:36', source: '小程序' },
];

const getLevelColor = (level: string) => {
  switch (level) {
    case 'diamond': return 'bg-purple-100 text-purple-700';
    case 'gold': return 'bg-yellow-100 text-yellow-700';
    case 'silver': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-50 text-gray-600';
  }
};

export default function MembersAnalysisPage() {
  const [period, setPeriod] = useState('week');

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="会员分析"
        description="会员数据统计与消费分析"
      >
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">今日</SelectItem>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季度</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出报表
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">会员概览</TabsTrigger>
          <TabsTrigger value="level">等级分布</TabsTrigger>
          <TabsTrigger value="ranking">消费排行</TabsTrigger>
          <TabsTrigger value="consumption">消费分析</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* 会员概览卡片 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总会员数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{memberStats.totalMembers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  今日新增 <span className="text-green-500">+{memberStats.newMembersToday}</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">活跃会员</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{memberStats.activeMembers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  活跃率 {((memberStats.activeMembers / memberStats.totalMembers) * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">会员消费额</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥{memberStats.memberSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  占总消费 {memberStats.memberPercentage}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均积分</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{memberStats.avgPoints.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">↑ 12.5%</span> 较上月
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 最新注册会员 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                最新注册会员
              </CardTitle>
              <CardDescription>最近注册的会员列表</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>会员姓名</TableHead>
                    <TableHead>手机号</TableHead>
                    <TableHead>注册时间</TableHead>
                    <TableHead>注册来源</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMembers.map((member, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>{member.registeredAt}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.source}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="level" className="space-y-4">
          {/* 会员等级分布 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                会员等级分布
              </CardTitle>
              <CardDescription>各等级会员数量与消费情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {levelStats.map((level) => (
                  <div key={level.level} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${level.color} rounded-lg flex items-center justify-center`}>
                          <Crown className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{level.level}</p>
                          <p className="text-sm text-muted-foreground">
                            {level.count} 人
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">
                          ¥{level.avgSpent.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          人均消费
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        占比 {level.percentage}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${level.color} rounded-full`}
                        style={{ width: `${level.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking" className="space-y-4">
          {/* 会员消费排行 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                会员消费排行
              </CardTitle>
              <CardDescription>按消费金额排序的会员排行</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">排名</TableHead>
                    <TableHead>会员姓名</TableHead>
                    <TableHead>手机号</TableHead>
                    <TableHead>会员等级</TableHead>
                    <TableHead className="text-right">积分</TableHead>
                    <TableHead className="text-right">消费金额</TableHead>
                    <TableHead className="text-right">订单数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topMembers.map((member) => (
                    <TableRow key={member.rank}>
                      <TableCell>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          member.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                          member.rank === 2 ? 'bg-gray-100 text-gray-600' :
                          member.rank === 3 ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {member.rank}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>
                        <Badge className={getLevelColor(member.level)}>
                          {member.levelName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{member.points.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        ¥{member.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{member.orders}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consumption" className="space-y-4">
          {/* 消费区间分布 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                消费区间分布
              </CardTitle>
              <CardDescription>会员消费金额区间统计</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consumptionStats.map((stat, index) => (
                  <div key={stat.range} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{stat.range}</p>
                          <p className="text-sm text-muted-foreground">
                            {stat.count} 人
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">
                          {stat.percentage}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${stat.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
