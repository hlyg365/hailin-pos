'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, Plus, Send } from 'lucide-react';

// 模拟优惠券模板数据
const couponTemplates = [
  {
    id: 1,
    name: '满100减15',
    type: '满减券',
    minAmount: 100,
    discount: 15,
    total: 10000,
    issued: 3420,
    used: 2156,
    status: 'active',
    validDays: 30,
  },
  {
    id: 2,
    name: '满50减5',
    type: '满减券',
    minAmount: 50,
    discount: 5,
    total: 10000,
    issued: 5620,
    used: 4890,
    status: 'active',
    validDays: 30,
  },
  {
    id: 3,
    name: '全场8折',
    type: '折扣券',
    discountRate: 0.8,
    maxDiscount: 50,
    total: 5000,
    issued: 1890,
    used: 1234,
    status: 'active',
    validDays: 30,
  },
  {
    id: 4,
    name: '免运费券',
    type: '免运费券',
    total: 3000,
    issued: 1560,
    used: 890,
    status: 'active',
    validDays: 15,
  },
];

// 模拟优惠券实例数据
const couponInstances = [
  {
    id: 1,
    code: 'CPN202403150001',
    templateName: '满100减15',
    memberName: '张三',
    memberNo: 'M001',
    status: 'used',
    usedTime: '2024-03-15 14:30',
    validUntil: '2024-04-15',
  },
  {
    id: 2,
    code: 'CPN202403150002',
    templateName: '全场8折',
    memberName: '李四',
    memberNo: 'M002',
    status: 'available',
    issueTime: '2024-03-15 10:00',
    validUntil: '2024-04-15',
  },
  {
    id: 3,
    code: 'CPN202403150003',
    templateName: '满50减5',
    memberName: '王五',
    memberNo: 'M003',
    status: 'expired',
    validUntil: '2024-03-14',
  },
];

export default function CouponsPage() {
  return (
    <>
      <PageHeader
        title="优惠券管理"
        description="创建、发放和管理优惠券"
      >
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          创建优惠券
        </Button>
      </PageHeader>

      <div className="flex-1 space-y-6 p-6 overflow-auto">
        {/* 优惠券统计卡片 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已发放</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,490</div>
              <p className="text-xs text-muted-foreground">张优惠券</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已使用</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">9,170</div>
              <p className="text-xs text-muted-foreground">使用率 73.4%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">可用优惠券</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3,020</div>
              <p className="text-xs text-muted-foreground">张可用</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已过期</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">300</div>
              <p className="text-xs text-muted-foreground">张过期</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="templates">优惠券模板</TabsTrigger>
            <TabsTrigger value="instances">优惠券实例</TabsTrigger>
            <TabsTrigger value="issue">发放管理</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>优惠券模板</CardTitle>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    新建模板
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>优惠规则</TableHead>
                      <TableHead>发行数量</TableHead>
                      <TableHead>已发放</TableHead>
                      <TableHead>已使用</TableHead>
                      <TableHead>使用率</TableHead>
                      <TableHead>有效期</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {couponTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{template.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {template.type === '满减券' && `满${template.minAmount}减${template.discount}`}
                          {template.type === '折扣券' && `${(template.discountRate || 1) * 10}折(最高${template.maxDiscount}元)`}
                          {template.type === '免运费券' && '免运费'}
                        </TableCell>
                        <TableCell>{template.total}</TableCell>
                        <TableCell>{template.issued}</TableCell>
                        <TableCell>{template.used}</TableCell>
                        <TableCell>{((template.used / template.issued) * 100).toFixed(1)}%</TableCell>
                        <TableCell>{template.validDays}天</TableCell>
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

          <TabsContent value="instances" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>优惠券实例</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>优惠券码</TableHead>
                      <TableHead>模板名称</TableHead>
                      <TableHead>会员</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>有效期至</TableHead>
                      <TableHead>使用时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {couponInstances.map((instance) => (
                      <TableRow key={instance.id}>
                        <TableCell className="font-medium">{instance.code}</TableCell>
                        <TableCell>{instance.templateName}</TableCell>
                        <TableCell>{instance.memberName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              instance.status === 'used'
                                ? 'secondary'
                                : instance.status === 'available'
                                ? 'default'
                                : 'outline'
                            }
                          >
                            {instance.status === 'used'
                              ? '已使用'
                              : instance.status === 'available'
                              ? '可用'
                              : '已过期'}
                          </Badge>
                        </TableCell>
                        <TableCell>{instance.validUntil}</TableCell>
                        <TableCell>{instance.usedTime || '-'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            详情
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issue" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>优惠券发放</CardTitle>
                  <Button size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    批量发放
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">选择优惠券模板</label>
                      <div className="p-4 border rounded-lg">
                        <div className="font-semibold">满100减15</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          发行数量: 10000 | 已发放: 3420 | 剩余: 6580
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">发放对象</label>
                      <div className="p-4 border rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input type="radio" name="target" id="all" defaultChecked />
                            <label htmlFor="all" className="text-sm">全体会员</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="radio" name="target" id="silver" />
                            <label htmlFor="silver" className="text-sm">银卡及以上</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="radio" name="target" id="gold" />
                            <label htmlFor="gold" className="text-sm">金卡及以上</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="radio" name="target" id="new" />
                            <label htmlFor="new" className="text-sm">新注册会员</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button size="lg">
                      <Send className="h-4 w-4 mr-2" />
                      立即发放
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
