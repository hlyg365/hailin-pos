'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Search,
  Eye,
  Link as LinkIcon,
  Unlink,
  Smartphone,
  Store,
  Gift,
  TrendingUp,
  Crown,
  Shield,
  Award,
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Users,
  CreditCard,
  ShoppingCart,
  Package,
  CheckCircle,
  AlertCircle,
  History,
  Plus,
  Minus,
} from 'lucide-react';

// 会员等级
type MemberLevel = 'normal' | 'silver' | 'gold' | 'diamond';

// 积分来源
type PointsSource = 'pos' | 'miniapp' | 'system' | 'manual';

// 会员来源
type MemberSource = 'pos' | 'miniapp' | 'import';

// 统一会员数据类型
interface UnifiedMember {
  id: string;
  memberNo: string;
  name: string;
  phone: string;
  avatar: string;
  level: MemberLevel;
  // 积分信息
  points: number;
  totalPoints: number; // 累计获得积分
  usedPoints: number; // 已使用积分
  // 消费信息
  totalAmount: number; // 累计消费金额
  orderCount: number; // 累计订单数
  posAmount: number; // 线下消费金额
  posOrderCount: number; // 线下订单数
  miniappAmount: number; // 小程序消费金额
  miniappOrderCount: number; // 小程序订单数
  // 关联状态
  linked: boolean; // 是否已关联小程序
  miniappOpenId?: string; // 小程序 OpenID
  miniappUnionId?: string; // 微信 UnionID
  miniappNickname?: string; // 小程序昵称
  linkedAt?: string; // 关联时间
  // 基本信息
  birthday?: string;
  gender?: 'male' | 'female';
  address?: string;
  email?: string;
  // 时间信息
  registeredSource: MemberSource; // 注册来源
  registeredAt: string; // 注册时间
  registeredStore?: string; // 注册店铺
  lastVisit: string; // 最后访问时间
  lastVisitSource: 'pos' | 'miniapp'; // 最后访问来源
  // 标签和备注
  tags: string[];
  remark?: string;
}

// 积分记录类型
interface PointsRecord {
  id: string;
  memberId: string;
  memberName: string;
  type: 'earn' | 'use' | 'expire' | 'adjust' | 'system';
  points: number; // 正数为获得，负数为使用
  balance: number; // 变动后余额
  source: PointsSource;
  sourceName: string;
  description: string;
  orderId?: string;
  orderAmount?: number;
  storeId?: string;
  storeName?: string;
  createdAt: string;
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

// 积分来源配置
const pointsSourceConfig: Record<PointsSource, { label: string; icon: any; color: string }> = {
  pos: { label: '线下消费', icon: Store, color: 'text-blue-600' },
  miniapp: { label: '小程序消费', icon: Smartphone, color: 'text-green-600' },
  system: { label: '系统赠送', icon: Gift, color: 'text-purple-600' },
  manual: { label: '手动调整', icon: RefreshCw, color: 'text-orange-600' },
};

export default function UnifiedMembersPage() {
  // 统一会员数据
  const [members, setMembers] = useState<UnifiedMember[]>([
    {
      id: '1',
      memberNo: 'M001',
      name: '张三',
      phone: '138****8001',
      avatar: '👨',
      level: 'diamond',
      points: 5680,
      totalPoints: 12580,
      usedPoints: 6900,
      totalAmount: 25680,
      orderCount: 128,
      posAmount: 15680,
      posOrderCount: 78,
      miniappAmount: 10000,
      miniappOrderCount: 50,
      linked: true,
      miniappOpenId: 'oXXXX-xxxxxxxxxxxxxxxx',
      miniappUnionId: 'o6_bmasdasdsad6_2sgVt7hMZOPfL',
      miniappNickname: '张三丰',
      linkedAt: '2024-06-15 10:23:45',
      birthday: '1990-05-20',
      gender: 'male',
      address: '深圳市南山区海邻小区A栋301',
      registeredSource: 'pos',
      registeredAt: '2024-01-15 14:30:00',
      registeredStore: '南山店',
      lastVisit: '2026-03-17 10:23:45',
      lastVisitSource: 'miniapp',
      tags: ['VIP', '常客', '水果爱好者'],
      remark: 'VIP客户，经常购买水果',
    },
    {
      id: '2',
      memberNo: 'M002',
      name: '李四',
      phone: '139****8002',
      avatar: '👩',
      level: 'silver',
      points: 580,
      totalPoints: 1200,
      usedPoints: 620,
      totalAmount: 1680,
      orderCount: 18,
      posAmount: 680,
      posOrderCount: 8,
      miniappAmount: 1000,
      miniappOrderCount: 10,
      linked: true,
      miniappOpenId: 'oYYYY-yyyyyyyyyyyyyyyy',
      miniappUnionId: 'o6_bmasdasdsad6_2sgVt7hMZOPgM',
      miniappNickname: '美丽人生',
      linkedAt: '2024-08-20 16:45:30',
      registeredSource: 'miniapp',
      registeredAt: '2024-06-20 09:15:00',
      lastVisit: '2026-03-16 15:30:00',
      lastVisitSource: 'pos',
      tags: ['新客户'],
    },
    {
      id: '3',
      memberNo: 'M003',
      name: '王五',
      phone: '137****8003',
      avatar: '👴',
      level: 'gold',
      points: 3250,
      totalPoints: 6890,
      usedPoints: 3640,
      totalAmount: 8900,
      orderCount: 56,
      posAmount: 8900,
      posOrderCount: 56,
      miniappAmount: 0,
      miniappOrderCount: 0,
      linked: false,
      birthday: '1985-08-15',
      registeredSource: 'pos',
      registeredAt: '2023-11-08 11:20:00',
      registeredStore: '南山店',
      lastVisit: '2026-03-14 09:45:00',
      lastVisitSource: 'pos',
      tags: ['老客户', '日用品'],
      remark: '经常购买日用品和蔬菜',
    },
    {
      id: '4',
      memberNo: 'M004',
      name: '赵六',
      phone: '136****8004',
      avatar: '👨‍💼',
      level: 'normal',
      points: 120,
      totalPoints: 120,
      usedPoints: 0,
      totalAmount: 320,
      orderCount: 3,
      posAmount: 0,
      posOrderCount: 0,
      miniappAmount: 320,
      miniappOrderCount: 3,
      linked: true,
      miniappOpenId: 'oZZZZ-zzzzzzzzzzzzzzzz',
      miniappNickname: '小赵',
      linkedAt: '2026-03-10 20:15:00',
      registeredSource: 'miniapp',
      registeredAt: '2026-03-10 20:10:00',
      lastVisit: '2026-03-15 14:20:00',
      lastVisitSource: 'miniapp',
      tags: ['新用户'],
    },
  ]);

  // 积分记录数据
  const [pointsRecords, setPointsRecords] = useState<PointsRecord[]>([
    {
      id: 'pr_001',
      memberId: '1',
      memberName: '张三',
      type: 'earn',
      points: 120,
      balance: 5680,
      source: 'miniapp',
      sourceName: '小程序消费',
      description: '小程序订单积分',
      orderId: 'WX202603170001',
      orderAmount: 54.2,
      storeId: 'store_001',
      storeName: '南山店',
      createdAt: '2026-03-17 10:23:45',
    },
    {
      id: 'pr_002',
      memberId: '1',
      memberName: '张三',
      type: 'earn',
      points: 85,
      balance: 5560,
      source: 'pos',
      sourceName: '线下消费',
      description: '收银台消费积分',
      orderId: 'POS20260316008',
      orderAmount: 42.5,
      storeId: 'store_001',
      storeName: '南山店',
      createdAt: '2026-03-16 15:30:00',
    },
    {
      id: 'pr_003',
      memberId: '1',
      memberName: '张三',
      type: 'use',
      points: -100,
      balance: 5475,
      source: 'pos',
      sourceName: '线下消费',
      description: '积分抵扣',
      orderId: 'POS20260316007',
      orderAmount: 35.0,
      storeId: 'store_001',
      storeName: '南山店',
      createdAt: '2026-03-16 11:20:00',
    },
    {
      id: 'pr_004',
      memberId: '2',
      memberName: '李四',
      type: 'earn',
      points: 35,
      balance: 580,
      source: 'pos',
      sourceName: '线下消费',
      description: '收银台消费积分',
      orderId: 'POS20260316005',
      orderAmount: 28.0,
      storeId: 'store_001',
      storeName: '南山店',
      createdAt: '2026-03-16 15:30:00',
    },
    {
      id: 'pr_005',
      memberId: '1',
      memberName: '张三',
      type: 'system',
      points: 50,
      balance: 5575,
      source: 'system',
      sourceName: '系统赠送',
      description: '生日特别积分',
      createdAt: '2026-03-15 00:00:00',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [linkFilter, setLinkFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<UnifiedMember | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
  const [pointsRecordsDialogOpen, setPointsRecordsDialogOpen] = useState(false);
  const [adjustPointsData, setAdjustPointsData] = useState({ points: 0, remark: '' });

  // 统计数据
  const stats = {
    total: members.length,
    linked: members.filter(m => m.linked).length,
    unlinked: members.filter(m => !m.linked).length,
    posOnly: members.filter(m => m.miniappOrderCount === 0).length,
    miniappOnly: members.filter(m => m.posOrderCount === 0).length,
    totalPoints: members.reduce((sum, m) => sum + m.points, 0),
    totalAmount: members.reduce((sum, m) => sum + m.totalAmount, 0),
  };

  // 过滤会员
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.memberNo.includes(searchQuery) ||
      member.name.includes(searchQuery) ||
      member.phone.includes(searchQuery);
    const matchesLink = linkFilter === 'all' ||
      (linkFilter === 'linked' && member.linked) ||
      (linkFilter === 'unlinked' && !member.linked);
    const matchesLevel = levelFilter === 'all' || member.level === levelFilter;
    const matchesSource = sourceFilter === 'all' ||
      (sourceFilter === 'pos' && member.registeredSource === 'pos') ||
      (sourceFilter === 'miniapp' && member.registeredSource === 'miniapp');
    return matchesSearch && matchesLink && matchesLevel && matchesSource;
  });

  // 查看会员详情
  const handleViewDetail = (member: UnifiedMember) => {
    setSelectedMember(member);
    setDetailDialogOpen(true);
  };

  // 关联小程序
  const handleLinkMiniapp = (member: UnifiedMember) => {
    // 模拟关联流程
    setMembers(members.map(m => 
      m.id === member.id 
        ? { 
            ...m, 
            linked: true, 
            miniappOpenId: `oNEW-newid${Date.now()}`,
            miniappNickname: m.name,
            linkedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          } 
        : m
    ));
  };

  // 取消关联
  const handleUnlinkMiniapp = (member: UnifiedMember) => {
    setMembers(members.map(m => 
      m.id === member.id 
        ? { 
            ...m, 
            linked: false, 
            miniappOpenId: undefined,
            miniappUnionId: undefined,
            miniappNickname: undefined,
            linkedAt: undefined,
          } 
        : m
    ));
  };

  // 打开积分调整对话框
  const handleOpenPointsDialog = (member: UnifiedMember) => {
    setSelectedMember(member);
    setAdjustPointsData({ points: 0, remark: '' });
    setPointsDialogOpen(true);
  };

  // 调整积分
  const handleAdjustPoints = () => {
    if (!selectedMember || adjustPointsData.points === 0) return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newPoints = selectedMember.points + adjustPointsData.points;
    
    // 添加积分记录
    const record: PointsRecord = {
      id: `pr_${Date.now()}`,
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      type: adjustPointsData.points > 0 ? 'earn' : 'use',
      points: adjustPointsData.points,
      balance: newPoints,
      source: 'manual',
      sourceName: '手动调整',
      description: adjustPointsData.remark || (adjustPointsData.points > 0 ? '手动增加积分' : '手动扣减积分'),
      createdAt: now,
    };
    
    setPointsRecords([record, ...pointsRecords]);
    setMembers(members.map(m => 
      m.id === selectedMember.id 
        ? { 
            ...m, 
            points: newPoints,
            totalPoints: adjustPointsData.points > 0 ? m.totalPoints + adjustPointsData.points : m.totalPoints,
            usedPoints: adjustPointsData.points < 0 ? m.usedPoints - adjustPointsData.points : m.usedPoints,
          } 
        : m
    ));
    
    setPointsDialogOpen(false);
  };

  // 查看积分记录
  const handleViewPointsRecords = (member: UnifiedMember) => {
    setSelectedMember(member);
    setPointsRecordsDialogOpen(true);
  };

  // 获取等级徽章
  const getLevelBadge = (level: MemberLevel) => {
    const config = memberLevels[level];
    const Icon = config.icon;
    return (
      <Badge className={`${config.bgColor} ${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="统一会员管理" description="管理店铺会员和小程序会员，实现积分统一累计">
        <Button variant="outline">
          <Users className="h-4 w-4 mr-2" />
          导入会员
        </Button>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          新增会员
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">会员总数</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <LinkIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.linked}</p>
                    <p className="text-sm text-muted-foreground">已关联小程序</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Gift className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">积分余额</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">¥{stats.totalAmount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">累计消费</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 筛选条件 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索会员号、姓名或手机号..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={linkFilter} onValueChange={setLinkFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="关联状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="linked">已关联</SelectItem>
                    <SelectItem value="unlinked">未关联</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="会员等级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部等级</SelectItem>
                    <SelectItem value="normal">普通会员</SelectItem>
                    <SelectItem value="silver">白银会员</SelectItem>
                    <SelectItem value="gold">黄金会员</SelectItem>
                    <SelectItem value="diamond">钻石会员</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="注册来源" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部来源</SelectItem>
                    <SelectItem value="pos">线下注册</SelectItem>
                    <SelectItem value="miniapp">小程序注册</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 会员列表 */}
          <Card>
            <CardHeader>
              <CardTitle>会员列表</CardTitle>
              <CardDescription>
                统一管理线下收银台会员和小程序会员，积分累计互通
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>会员信息</TableHead>
                    <TableHead>会员等级</TableHead>
                    <TableHead>积分余额</TableHead>
                    <TableHead>消费统计</TableHead>
                    <TableHead>小程序关联</TableHead>
                    <TableHead>最后访问</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map(member => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{member.avatar}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.name}</p>
                              {member.registeredSource === 'miniapp' && (
                                <Badge variant="outline" className="text-xs">
                                  <Smartphone className="h-3 w-3 mr-1" />
                                  小程序
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{member.memberNo}</p>
                            <p className="text-xs text-muted-foreground">{member.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getLevelBadge(member.level)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-bold text-orange-600">{member.points.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            累计 {member.totalPoints.toLocaleString()} | 已用 {member.usedPoints.toLocaleString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Store className="h-3 w-3 text-blue-600" />
                            <span>¥{member.posAmount.toLocaleString()}</span>
                            <span className="text-muted-foreground">({member.posOrderCount}单)</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Smartphone className="h-3 w-3 text-green-600" />
                            <span>¥{member.miniappAmount.toLocaleString()}</span>
                            <span className="text-muted-foreground">({member.miniappOrderCount}单)</span>
                          </div>
                          <p className="text-xs font-medium">合计 ¥{member.totalAmount.toLocaleString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.linked ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">已关联</span>
                            </div>
                            <p className="text-xs text-muted-foreground">@{member.miniappNickname}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">未关联</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{member.lastVisit}</p>
                          <Badge variant="outline" className="text-xs">
                            {member.lastVisitSource === 'pos' ? (
                              <><Store className="h-3 w-3 mr-1" />线下</>
                            ) : (
                              <><Smartphone className="h-3 w-3 mr-1" />小程序</>
                            )}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(member)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleViewPointsRecords(member)}>
                            <History className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenPointsDialog(member)}>
                            <Gift className="h-4 w-4" />
                          </Button>
                          {member.linked ? (
                            <Button variant="ghost" size="sm" onClick={() => handleUnlinkMiniapp(member)}>
                              <Unlink className="h-4 w-4 text-orange-600" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => handleLinkMiniapp(member)}>
                              <LinkIcon className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 会员详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>会员详情</DialogTitle>
            <DialogDescription>
              会员号：{selectedMember?.memberNo}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-6 py-4">
              {/* 基本信息 */}
              <div className="flex items-start gap-4">
                <span className="text-5xl">{selectedMember.avatar}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">{selectedMember.name}</h3>
                    {getLevelBadge(selectedMember.level)}
                    {selectedMember.linked && (
                      <Badge className="bg-green-500">
                        <LinkIcon className="h-3 w-3 mr-1" />
                        已关联小程序
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedMember.phone}</span>
                    </div>
                    {selectedMember.birthday && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedMember.birthday}</span>
                      </div>
                    )}
                    {selectedMember.address && (
                      <div className="flex items-center gap-2 col-span-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedMember.address}</span>
                      </div>
                    )}
                  </div>
                  {selectedMember.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {selectedMember.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 积分信息 */}
              <Card className="bg-gradient-to-r from-orange-50 to-yellow-50">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-bold text-orange-600">{selectedMember.points.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">当前积分</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-green-600">{selectedMember.totalPoints.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">累计获得</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-blue-600">{selectedMember.usedPoints.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">已使用</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 消费统计 */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Store className="h-4 w-4 text-blue-600" />
                      线下消费
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">¥{selectedMember.posAmount.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">{selectedMember.posOrderCount} 笔订单</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-green-600" />
                      小程序消费
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">¥{selectedMember.miniappAmount.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">{selectedMember.miniappOrderCount} 笔订单</p>
                  </CardContent>
                </Card>
              </div>

              {/* 关联信息 */}
              {selectedMember.linked && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-green-600" />
                      小程序关联信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">微信昵称</span>
                        <span>@{selectedMember.miniappNickname}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">OpenID</span>
                        <span className="font-mono text-xs">{selectedMember.miniappOpenId?.slice(0, 20)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">关联时间</span>
                        <span>{selectedMember.linkedAt}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 注册信息 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">注册信息</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">注册来源</span>
                      <Badge variant="outline">
                        {selectedMember.registeredSource === 'pos' ? (
                          <><Store className="h-3 w-3 mr-1" />线下收银台</>
                        ) : (
                          <><Smartphone className="h-3 w-3 mr-1" />小程序</>
                        )}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">注册时间</span>
                      <span>{selectedMember.registeredAt}</span>
                    </div>
                    {selectedMember.registeredStore && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">注册店铺</span>
                        <span>{selectedMember.registeredStore}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>关闭</Button>
            {selectedMember && !selectedMember.linked && (
              <Button onClick={() => {
                handleLinkMiniapp(selectedMember);
                setDetailDialogOpen(false);
              }}>
                <LinkIcon className="h-4 w-4 mr-2" />
                关联小程序
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 积分调整对话框 */}
      <Dialog open={pointsDialogOpen} onOpenChange={setPointsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>调整积分</DialogTitle>
            <DialogDescription>
              为会员 {selectedMember?.name} 调整积分
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">当前积分</span>
                <span className="text-xl font-bold text-orange-600">{selectedMember?.points.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>调整数量</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAdjustPointsData({ ...adjustPointsData, points: adjustPointsData.points - 10 })}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={adjustPointsData.points}
                  onChange={(e) => setAdjustPointsData({ ...adjustPointsData, points: Number(e.target.value) })}
                  className="text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAdjustPointsData({ ...adjustPointsData, points: adjustPointsData.points + 10 })}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                正数为增加积分，负数为扣减积分
              </p>
            </div>

            <div className="space-y-2">
              <Label>调整原因</Label>
              <Input
                value={adjustPointsData.remark}
                onChange={(e) => setAdjustPointsData({ ...adjustPointsData, remark: e.target.value })}
                placeholder="请输入调整原因"
              />
            </div>

            {adjustPointsData.points !== 0 && (
              <div className={`p-3 rounded-lg ${adjustPointsData.points > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex justify-between items-center">
                  <span className={adjustPointsData.points > 0 ? 'text-green-600' : 'text-red-600'}>
                    {adjustPointsData.points > 0 ? '增加后余额' : '扣减后余额'}
                  </span>
                  <span className="text-xl font-bold">
                    {((selectedMember?.points || 0) + adjustPointsData.points).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPointsDialogOpen(false)}>取消</Button>
            <Button onClick={handleAdjustPoints} disabled={adjustPointsData.points === 0}>
              确认调整
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 积分记录对话框 */}
      <Dialog open={pointsRecordsDialogOpen} onOpenChange={setPointsRecordsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>积分记录</DialogTitle>
            <DialogDescription>
              会员 {selectedMember?.name} 的积分变动记录
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {pointsRecords
              .filter(r => r.memberId === selectedMember?.id)
              .map(record => {
                const sourceConfig = pointsSourceConfig[record.source];
                return (
                  <Card key={record.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${record.points > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            {record.points > 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{record.description}</p>
                              <Badge variant="outline" className="text-xs">
                                <sourceConfig.icon className="h-3 w-3 mr-1" />
                                {sourceConfig.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{record.createdAt}</p>
                            {record.orderId && (
                              <p className="text-xs text-muted-foreground">
                                订单号：{record.orderId}
                                {record.orderAmount && ` | 金额：¥${record.orderAmount}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${record.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {record.points > 0 ? '+' : ''}{record.points}
                          </p>
                          <p className="text-xs text-muted-foreground">余额：{record.balance}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPointsRecordsDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
