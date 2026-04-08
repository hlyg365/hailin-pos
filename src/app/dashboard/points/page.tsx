'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, TrendingUp, Calendar, Plus, Settings } from 'lucide-react';

// 模拟积分规则数据
const pointRules = [
  {
    id: 1,
    name: '消费积分',
    description: '消费1元获得1积分',
    type: 'earn',
    multiplier: 1,
    status: 'active',
  },
  {
    id: 2,
    name: '签到积分',
    description: '每日签到获得5积分',
    type: 'earn',
    amount: 5,
    status: 'active',
  },
  {
    id: 3,
    name: '生日双倍积分',
    description: '生日当天消费双倍积分',
    type: 'earn',
    multiplier: 2,
    status: 'active',
  },
  {
    id: 4,
    name: '积分抵扣',
    description: '100积分抵扣1元',
    type: 'redeem',
    rate: 100,
    maxDeduction: 50,
    status: 'active',
  },
];

// 模拟积分记录数据
const pointRecords = [
  {
    id: 1,
    memberName: '张三',
    memberNo: 'M001',
    type: 'earn',
    amount: 58,
    reason: '消费',
    balance: 5680,
    createTime: '2024-03-15 14:30',
  },
  {
    id: 2,
    memberName: '李四',
    memberNo: 'M002',
    type: 'redeem',
    amount: -100,
    reason: '积分抵扣',
    balance: 2240,
    createTime: '2024-03-15 13:45',
  },
  {
    id: 3,
    memberName: '王五',
    memberNo: 'M003',
    type: 'earn',
    amount: 5,
    reason: '签到',
    balance: 1560,
    createTime: '2024-03-15 10:00',
  },
  {
    id: 4,
    memberName: '赵六',
    memberNo: 'M004',
    type: 'earn',
    amount: 26,
    reason: '消费',
    balance: 580,
    createTime: '2024-03-15 09:15',
  },
];

export default function PointsPage() {
  return (
    <>
      <PageHeader
        title="积分管理"
        description="管理积分规则、记录和兑换"
      >
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          规则配置
        </Button>
      </PageHeader>

      <div className="flex-1 space-y-6 p-6 overflow-auto">
        {/* 积分统计卡片 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">累计积分</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156,890</div>
              <p className="text-xs text-muted-foreground">历史总发放</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已使用积分</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">52,340</div>
              <p className="text-xs text-muted-foreground">历史总使用</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">剩余积分</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">104,550</div>
              <p className="text-xs text-muted-foreground">当前可用</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今日发放</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,560</div>
              <p className="text-xs text-muted-foreground">今日已发放</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rules" className="space-y-4">
          <TabsList>
            <TabsTrigger value="rules">积分规则</TabsTrigger>
            <TabsTrigger value="records">积分记录</TabsTrigger>
            <TabsTrigger value="mall">积分商城</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>积分获取/使用规则</CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    新增规则
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>规则名称</TableHead>
                      <TableHead>规则描述</TableHead>
                      <TableHead>规则类型</TableHead>
                      <TableHead>规则配置</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pointRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>{rule.description}</TableCell>
                        <TableCell>
                          <Badge variant={rule.type === 'earn' ? 'default' : 'secondary'}>
                            {rule.type === 'earn' ? '获取' : '使用'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {rule.multiplier && `倍率: ${rule.multiplier}`}
                          {rule.amount && `数量: ${rule.amount}`}
                          {rule.rate && `比例: ${rule.rate}积分=1元`}
                        </TableCell>
                        <TableCell>
                          <Badge>启用</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            编辑
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>积分流水记录</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>会员号</TableHead>
                      <TableHead>会员姓名</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>积分变化</TableHead>
                      <TableHead>原因</TableHead>
                      <TableHead>余额</TableHead>
                      <TableHead>时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pointRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.memberNo}</TableCell>
                        <TableCell>{record.memberName}</TableCell>
                        <TableCell>
                          <Badge variant={record.type === 'earn' ? 'default' : 'secondary'}>
                            {record.type === 'earn' ? '获得' : '使用'}
                          </Badge>
                        </TableCell>
                        <TableCell className={record.type === 'earn' ? 'text-green-600' : 'text-red-600'}>
                          {record.type === 'earn' ? '+' : ''}{record.amount}
                        </TableCell>
                        <TableCell>{record.reason}</TableCell>
                        <TableCell>{record.balance}</TableCell>
                        <TableCell>{record.createTime}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mall" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>积分商城商品</CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    添加商品
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { name: '矿泉水（箱）', points: 500, stock: 100 },
                    { name: '洗衣液', points: 800, stock: 50 },
                    { name: '纸巾（提）', points: 300, stock: 200 },
                  ].map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="aspect-square bg-secondary rounded-lg mb-4 flex items-center justify-center text-muted-foreground">
                          商品图片
                        </div>
                        <h3 className="font-semibold mb-2">{item.name}</h3>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{item.points} 积分</Badge>
                          <span className="text-sm text-muted-foreground">库存: {item.stock}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
