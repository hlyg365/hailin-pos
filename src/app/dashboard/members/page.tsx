'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  Plus,
  Gift,
  Phone,
  DollarSign,
  TrendingUp,
  Crown,
  Shield,
  Award,
  Mail,
  Cake,
  MessageSquare,
  Calendar,
  Tag,
  Star,
  Users,
} from 'lucide-react';

// 会员等级
type MemberLevel = 'normal' | 'silver' | 'gold' | 'diamond';

// 会员消费偏好
type ConsumptionPreference = 'snacks' | 'drinks' | 'fresh' | 'daily' | 'other';

interface Member {
  id: number;
  memberNo: string;
  name: string;
  phone: string;
  level: MemberLevel;
  points: number;
  totalAmount: number;
  orderCount: number;
  registeredDate: string;
  lastVisit: string;
  birthday?: string;
  preferences?: ConsumptionPreference[];
  description?: string;
}

// 积分兑换规则
interface PointsRule {
  id: number;
  name: string;
  points: number;
  reward: string;
  description: string;
}

// 会员等级配置
const memberLevels: Record<MemberLevel, { 
  label: string; 
  icon: any; 
  color: string; 
  bgColor: string; 
  minAmount: number;
  discount: number;
  pointsMultiplier: number;
}> = {
  normal: { 
    label: '普通会员', 
    icon: Shield, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100', 
    minAmount: 0,
    discount: 0,
    pointsMultiplier: 1,
  },
  silver: { 
    label: '白银会员', 
    icon: Award, 
    color: 'text-gray-400', 
    bgColor: 'bg-gray-200', 
    minAmount: 1000,
    discount: 0.95,
    pointsMultiplier: 1.2,
  },
  gold: { 
    label: '黄金会员', 
    icon: Crown, 
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-100', 
    minAmount: 5000,
    discount: 0.9,
    pointsMultiplier: 1.5,
  },
  diamond: { 
    label: '钻石会员', 
    icon: Crown, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-100', 
    minAmount: 20000,
    discount: 0.85,
    pointsMultiplier: 2,
  },
};

// 模拟会员数据
const mockMembers: Member[] = [
  {
    id: 1,
    memberNo: 'M001',
    name: '张三',
    phone: '13800138001',
    level: 'diamond',
    points: 5680,
    totalAmount: 25680,
    orderCount: 128,
    registeredDate: '2024-01-15',
    lastVisit: '2025-03-14',
    birthday: '1990-05-20',
    preferences: ['drinks', 'snacks'],
    description: 'VIP客户，常客',
  },
  {
    id: 2,
    memberNo: 'M002',
    name: '李四',
    phone: '13800138002',
    level: 'normal',
    points: 580,
    totalAmount: 680,
    orderCount: 8,
    registeredDate: '2024-06-20',
    lastVisit: '2025-03-13',
    birthday: '1988-12-10',
    preferences: ['daily'],
    description: '新客户',
  },
  {
    id: 3,
    memberNo: 'M003',
    name: '王五',
    phone: '13800138003',
    level: 'gold',
    points: 3250,
    totalAmount: 8900,
    orderCount: 56,
    registeredDate: '2023-11-08',
    lastVisit: '2025-03-14',
    birthday: '1985-08-15',
    preferences: ['fresh', 'daily'],
    description: '老客户，经常买菜',
  },
];

// 模拟积分兑换规则
const mockPointsRules: PointsRule[] = [
  {
    id: 1,
    name: '满减优惠',
    points: 100,
    reward: '立减5元',
    description: '100积分可抵扣5元',
  },
  {
    id: 2,
    name: '商品兑换',
    points: 200,
    reward: '免费商品',
    description: '200积分可兑换指定商品',
  },
  {
    id: 3,
    name: '会员升级',
    points: 500,
    reward: '升级会员等级',
    description: '500积分可享受更高会员等级',
  },
];

// 模拟营销活动
const mockCampaigns = [
  {
    id: 1,
    name: '生日特惠',
    type: 'birthday',
    description: '生日当天消费双倍积分',
    status: 'active',
  },
  {
    id: 2,
    name: '会员日促销',
    type: 'member',
    description: '每周三会员日全场9折',
    status: 'active',
  },
  {
    id: 3,
    name: '新会员注册送礼',
    type: 'register',
    description: '新会员注册送50积分',
    status: 'active',
  },
];

export default function MembersPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<MemberLevel | 'all'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);

  // 筛选数据
  const filteredMembers = mockMembers.filter(member => {
    const matchesSearch = member.name.includes(searchTerm) || 
                         member.phone.includes(searchTerm) ||
                         member.memberNo.includes(searchTerm);
    const matchesLevel = filterLevel === 'all' || member.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  // 获取会员等级标签
  const getLevelBadge = (level: MemberLevel) => {
    const config = memberLevels[level];
    const Icon = config.icon;
    return (
      <Badge className={config.bgColor + ' ' + config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // 检查生日特权
  const checkBirthdayPrivilege = (birthday?: string) => {
    if (!birthday) return false;
    const today = new Date();
    const birthDate = new Date(birthday);
    return today.getMonth() === birthDate.getMonth() && 
           today.getDate() === birthDate.getDate();
  };

  // 获取消费偏好标签
  const getPreferenceBadges = (preferences?: ConsumptionPreference[]) => {
    if (!preferences) return null;
    const preferenceMap = {
      snacks: { label: '零食', icon: Tag, color: 'bg-orange-500' },
      drinks: { label: '饮品', icon: Tag, color: 'bg-blue-500' },
      fresh: { label: '生鲜', icon: Tag, color: 'bg-green-500' },
      daily: { label: '日用品', icon: Tag, color: 'bg-purple-500' },
      other: { label: '其他', icon: Tag, color: 'bg-gray-500' },
    };
    
    return (
      <div className="flex gap-1 flex-wrap">
        {preferences.map((pref) => {
          const config = preferenceMap[pref];
          const Icon = config.icon;
          return (
            <Badge key={pref} className={config.color + ' text-white'}>
              <Icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          );
        })}
      </div>
    );
  };

  const stats = {
    total: mockMembers.length,
    diamond: mockMembers.filter(m => m.level === 'diamond').length,
    gold: mockMembers.filter(m => m.level === 'gold').length,
    silver: mockMembers.filter(m => m.level === 'silver').length,
    normal: mockMembers.filter(m => m.level === 'normal').length,
    totalPoints: mockMembers.reduce((sum, m) => sum + m.points, 0),
    totalAmount: mockMembers.reduce((sum, m) => sum + m.totalAmount, 0),
    birthdayToday: mockMembers.filter(m => checkBirthdayPrivilege(m.birthday)).length,
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader title="会员管理" description="管理会员信息、等级体系、积分规则与营销活动" />

      <div className="flex-1 overflow-auto p-6">
        {/* 统一会员管理提示 */}
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">统一会员管理</p>
                  <p className="text-sm text-green-600">线下收银台与小程序会员互通，积分统一累计</p>
                </div>
              </div>
              <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100" onClick={() => window.location.href = '/members/unified'}>
                前往统一会员管理 →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Shield className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">会员总数</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Crown className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.diamond + stats.gold}</div>
                  <div className="text-xs text-muted-foreground">高端会员</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <Gift className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalPoints}</div>
                  <div className="text-xs text-muted-foreground">总积分</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">¥{stats.totalAmount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">总消费</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
                  <Cake className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.birthdayToday}</div>
                  <div className="text-xs text-muted-foreground">今日生日</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 生日特权提醒 */}
        {stats.birthdayToday > 0 && (
          <Card className="mb-6 border-pink-200 bg-pink-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Cake className="h-5 w-5 text-pink-600" />
                <div className="flex-1">
                  <div className="font-medium text-pink-900">
                    今天有 {stats.birthdayToday} 位会员过生日
                  </div>
                  <div className="text-sm text-pink-700">
                    已自动激活生日特权：双倍积分
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  发送祝福
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 功能标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-4 pt-4">
            <TabsList>
              <TabsTrigger value="list">会员列表</TabsTrigger>
              <TabsTrigger value="levels">等级管理</TabsTrigger>
              <TabsTrigger value="points">积分规则</TabsTrigger>
              <TabsTrigger value="campaign">营销活动</TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-4">
            <TabsContent value="list">
              {/* 操作栏 */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="搜索会员姓名、手机号或会员号"
                          className="pl-9"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={filterLevel === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterLevel('all')}
                      >
                        全部
                      </Button>
                      <Button
                        variant={filterLevel === 'diamond' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterLevel('diamond')}
                      >
                        钻石
                      </Button>
                      <Button
                        variant={filterLevel === 'gold' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterLevel('gold')}
                      >
                        黄金
                      </Button>
                      <Button
                        variant={filterLevel === 'silver' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterLevel('silver')}
                      >
                        白银
                      </Button>
                      <Button
                        variant={filterLevel === 'normal' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterLevel('normal')}
                      >
                        普通
                      </Button>
                    </div>

                    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          新增会员
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>新增会员</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>会员姓名</Label>
                            <Input className="mt-2" placeholder="请输入会员姓名" />
                          </div>
                          <div>
                            <Label>手机号码</Label>
                            <Input className="mt-2" placeholder="请输入手机号码" />
                          </div>
                          <div>
                            <Label>会员等级</Label>
                            <Select>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="请选择会员等级" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">普通会员</SelectItem>
                                <SelectItem value="silver">白银会员</SelectItem>
                                <SelectItem value="gold">黄金会员</SelectItem>
                                <SelectItem value="diamond">钻石会员</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>生日</Label>
                            <Input type="date" className="mt-2" />
                          </div>
                          <div>
                            <Label>消费偏好</Label>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="cursor-pointer">零食</Badge>
                              <Badge variant="outline" className="cursor-pointer">饮品</Badge>
                              <Badge variant="outline" className="cursor-pointer">生鲜</Badge>
                              <Badge variant="outline" className="cursor-pointer">日用品</Badge>
                            </div>
                          </div>
                          <Button className="w-full">确认添加</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* 会员表格 */}
              <Card>
                <CardContent className="p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>会员信息</TableHead>
                        <TableHead>会员等级</TableHead>
                        <TableHead>生日</TableHead>
                        <TableHead>消费偏好</TableHead>
                        <TableHead>积分</TableHead>
                        <TableHead>消费总额</TableHead>
                        <TableHead>订单数</TableHead>
                        <TableHead>注册时间</TableHead>
                        <TableHead>最近消费</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="font-medium">{member.name}</div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{member.phone}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getLevelBadge(member.level)}
                          </TableCell>
                          <TableCell>
                            {member.birthday ? (
                              <div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">{member.birthday}</span>
                                </div>
                                {checkBirthdayPrivilege(member.birthday) && (
                                  <Badge className="bg-pink-500 text-xs mt-1">
                                    <Cake className="h-3 w-3 mr-1" />
                                    今日生日
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">未设置</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getPreferenceBadges(member.preferences)}
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-orange-600">{member.points}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">¥{member.totalAmount.toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{member.orderCount}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{member.registeredDate}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{member.lastVisit}</div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="levels">
              <Card>
                <CardHeader>
                  <CardTitle>会员等级体系</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(memberLevels).map(([level, config]) => {
                      const count = mockMembers.filter(m => m.level === level).length;
                      const Icon = config.icon;
                      return (
                        <Card key={level} className={config.bgColor}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <Icon className={`h-8 w-8 ${config.color}`} />
                              <span className="text-3xl font-bold">{count}</span>
                            </div>
                            <div className="text-lg font-bold mb-2">{config.label}</div>
                            <div className="space-y-1 text-sm">
                              <div>消费门槛: ¥{config.minAmount}</div>
                              <div>优惠折扣: {config.discount > 0 ? `${(config.discount * 10).toFixed(1)}折` : '无'}</div>
                              <div>积分倍数: ×{config.pointsMultiplier}</div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="points">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>积分兑换规则</CardTitle>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      新增规则
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockPointsRules.map((rule) => (
                      <Card key={rule.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Star className="h-5 w-5 text-orange-500" />
                                <h4 className="font-semibold">{rule.name}</h4>
                                <Badge className="bg-orange-500">{rule.points}积分</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {rule.description}
                              </div>
                            </div>
                            <div className="font-bold text-green-600">
                              {rule.reward}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campaign">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>营销活动</CardTitle>
                    <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          新建活动
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>新建营销活动</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>活动名称</Label>
                            <Input className="mt-2" placeholder="请输入活动名称" />
                          </div>
                          <div>
                            <Label>活动类型</Label>
                            <Select>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="请选择活动类型" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="birthday">生日特权</SelectItem>
                                <SelectItem value="member">会员日</SelectItem>
                                <SelectItem value="register">新会员</SelectItem>
                                <SelectItem value="points">积分兑换</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>活动描述</Label>
                            <Textarea className="mt-2" placeholder="请输入活动描述" />
                          </div>
                          <Button className="w-full">创建活动</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockCampaigns.map((campaign) => (
                      <Card key={campaign.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                                <MessageSquare className="h-6 w-6 text-orange-500" />
                              </div>
                              <div>
                                <h4 className="font-semibold">{campaign.name}</h4>
                                <p className="text-sm text-muted-foreground">{campaign.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-500">进行中</Badge>
                              <Button variant="ghost" size="sm">
                                编辑
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive">
                                停止
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </CardContent>
        </Tabs>
      </div>
    </div>
  );
}
