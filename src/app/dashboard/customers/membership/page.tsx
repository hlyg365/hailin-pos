'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
  Plus,
  Search,
  Edit,
  Trash2,
  Crown,
  Star,
  TrendingUp,
  Award,
  Calendar,
  Percent,
  Users,
  Coins,
  Settings,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface MemberLevel {
  id: string;
  name: string;
  level: number;
  icon?: string;
  minPoints: number;
  discountRate: number;
  pointsPerYuan: number;
  benefits: string[];
  color: string;
  description: string;
  memberCount: number;
}

interface PointsRule {
  id: string;
  name: string;
  pointsPerYuan: number;
  ruleType: 'earn' | 'redeem';
  minAmount?: number;
  maxPointsPerOrder?: number;
  description: string;
  status: 'active' | 'inactive';
  createTime: string;
}

export default function MembershipPage() {
  const [memberLevels, setMemberLevels] = useState<MemberLevel[]>([
    {
      id: '1',
      name: '普通会员',
      level: 1,
      icon: '👤',
      minPoints: 0,
      discountRate: 100,
      pointsPerYuan: 1,
      benefits: ['生日特权', '积分抵扣'],
      color: '#6B7280',
      description: '所有用户的初始等级',
      memberCount: 1234,
    },
    {
      id: '2',
      name: '银卡会员',
      level: 2,
      icon: '🥈',
      minPoints: 1000,
      discountRate: 98,
      pointsPerYuan: 1.2,
      benefits: ['生日特权', '积分抵扣', '98折优惠', '专属客服'],
      color: '#9CA3AF',
      description: '累计1000积分升级',
      memberCount: 456,
    },
    {
      id: '3',
      name: '金卡会员',
      level: 3,
      icon: '🥇',
      minPoints: 5000,
      discountRate: 95,
      pointsPerYuan: 1.5,
      benefits: ['生日特权', '积分抵扣', '95折优惠', '专属客服', '优先发货', '免费包装'],
      color: '#F59E0B',
      description: '累计5000积分升级',
      memberCount: 123,
    },
    {
      id: '4',
      name: '钻石会员',
      level: 4,
      icon: '💎',
      minPoints: 20000,
      discountRate: 90,
      pointsPerYuan: 2,
      benefits: ['生日特权', '积分抵扣', '9折优惠', '专属客服', '优先发货', '免费包装', '专属礼品', '邀请活动'],
      color: '#3B82F6',
      description: '累计20000积分升级',
      memberCount: 45,
    },
  ]);

  const [pointsRules, setPointsRules] = useState<PointsRule[]>([
    {
      id: '1',
      name: '购物积分规则',
      pointsPerYuan: 1,
      ruleType: 'earn',
      minAmount: 1,
      maxPointsPerOrder: 1000,
      description: '每消费1元获得1积分',
      status: 'active',
      createTime: '2024-01-01 10:00:00',
    },
    {
      id: '2',
      name: '积分抵扣规则',
      pointsPerYuan: 100,
      ruleType: 'redeem',
      minAmount: 100,
      maxPointsPerOrder: 5000,
      description: '100积分抵扣1元',
      status: 'active',
      createTime: '2024-01-01 10:00:00',
    },
    {
      id: '3',
      name: '新用户注册积分',
      pointsPerYuan: 100,
      ruleType: 'earn',
      description: '新用户注册送100积分',
      status: 'active',
      createTime: '2024-01-01 10:00:00',
    },
  ]);

  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 会员等级表单
  const [levelForm, setLevelForm] = useState({
    name: '',
    level: 1,
    minPoints: 0,
    discountRate: 100,
    pointsPerYuan: 1,
    benefits: '',
    color: '#6B7280',
    description: '',
  });

  // 积分规则表单
  const [ruleForm, setRuleForm] = useState({
    name: '',
    pointsPerYuan: 1,
    ruleType: 'earn' as const,
    minAmount: 0,
    maxPointsPerOrder: 0,
    description: '',
  });

  const handleCreateLevel = () => {
    const newLevel: MemberLevel = {
      id: Date.now().toString(),
      ...levelForm,
      benefits: levelForm.benefits.split('\n').filter((b) => b.trim()),
      memberCount: 0,
    };
    setMemberLevels([...memberLevels, newLevel]);
    setLevelDialogOpen(false);
    resetLevelForm();
  };

  const handleCreateRule = () => {
    const newRule: PointsRule = {
      id: Date.now().toString(),
      ...ruleForm,
      status: 'active',
      createTime: new Date().toLocaleString(),
    };
    setPointsRules([...pointsRules, newRule]);
    setRuleDialogOpen(false);
    resetRuleForm();
  };

  const handleToggleLevelStatus = (levelId: string) => {
    // 会员等级不支持启用/停用，这里可以添加其他操作
    alert('会员等级配置已保存');
  };

  const handleDeleteLevel = (levelId: string) => {
    if (window.confirm('确定要删除这个会员等级吗？')) {
      setMemberLevels(memberLevels.filter((level) => level.id !== levelId));
    }
  };

  const handleToggleRuleStatus = (ruleId: string) => {
    setPointsRules(
      pointsRules.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              status: rule.status === 'active' ? 'inactive' : 'active',
            }
          : rule
      )
    );
  };

  const handleDeleteRule = (ruleId: string) => {
    if (window.confirm('确定要删除这个积分规则吗？')) {
      setPointsRules(pointsRules.filter((rule) => rule.id !== ruleId));
    }
  };

  const resetLevelForm = () => {
    setLevelForm({
      name: '',
      level: 1,
      minPoints: 0,
      discountRate: 100,
      pointsPerYuan: 1,
      benefits: '',
      color: '#6B7280',
      description: '',
    });
  };

  const resetRuleForm = () => {
    setRuleForm({
      name: '',
      pointsPerYuan: 1,
      ruleType: 'earn',
      minAmount: 0,
      maxPointsPerOrder: 0,
      description: '',
    });
  };

  const getLevelIcon = (level: number) => {
    switch (level) {
      case 1:
        return <Star className="h-4 w-4" />;
      case 2:
        return <Award className="h-4 w-4" />;
      case 3:
        return <Crown className="h-4 w-4" />;
      case 4:
        return <Crown className="h-4 w-4 text-blue-500" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="会员管理"
        description="设置会员等级和积分规则"
      >
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          会员设置
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="levels" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="levels">会员等级</TabsTrigger>
              <TabsTrigger value="points">积分规则</TabsTrigger>
            </TabsList>

            {/* 会员等级 */}
            <TabsContent value="levels" className="space-y-6">
              {/* 统计卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          会员总数
                        </p>
                        <p className="text-2xl font-bold">
                          {memberLevels.reduce((sum, level) => sum + level.memberCount, 0)}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          等级数量
                        </p>
                        <p className="text-2xl font-bold">{memberLevels.length}</p>
                      </div>
                      <Award className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          最高折扣
                        </p>
                        <p className="text-2xl font-bold">
                          {Math.min(...memberLevels.map((l) => l.discountRate))}折
                        </p>
                      </div>
                      <Percent className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          最高积分倍率
                        </p>
                        <p className="text-2xl font-bold">
                          {Math.max(...memberLevels.map((l) => l.pointsPerYuan))}x
                        </p>
                      </div>
                      <Coins className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 会员等级列表 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>会员等级配置</CardTitle>
                      <CardDescription>
                        设置不同等级的会员权益和升级条件
                      </CardDescription>
                    </div>
                    <Button onClick={() => setLevelDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      添加等级
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {memberLevels.map((level) => (
                      <Card key={level.id} className="overflow-hidden">
                        <div
                          className="h-2"
                          style={{ backgroundColor: level.color }}
                        />
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div
                                className="text-3xl"
                                style={{
                                  backgroundColor: level.color,
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                }}
                              >
                                {level.icon}
                              </div>
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  {getLevelIcon(level.level)}
                                  {level.name}
                                  <Badge variant="outline">LV{level.level}</Badge>
                                </CardTitle>
                                <CardDescription className="mt-2">
                                  {level.description}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                {level.discountRate / 10}折
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {level.memberCount} 会员
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">
                                  升级门槛：
                                </span>
                                <span className="font-medium ml-2">
                                  {level.minPoints} 积分
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  积分倍率：
                                </span>
                                <span className="font-medium ml-2">
                                  {level.pointsPerYuan}x
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  折扣率：
                                </span>
                                <span className="font-medium ml-2">
                                  {level.discountRate / 10}折
                                </span>
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <div className="text-sm font-medium mb-2">
                                会员权益：
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {level.benefits.map((benefit, index) => (
                                  <Badge key={index} variant="secondary">
                                    {benefit}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleLevelStatus(level.id)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                编辑
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteLevel(level.id)}
                              >
                                <Trash2 className="h-4 w-4" />
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

            {/* 积分规则 */}
            <TabsContent value="points" className="space-y-6">
              {/* 统计卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          积分规则数
                        </p>
                        <p className="text-2xl font-bold">{pointsRules.length}</p>
                      </div>
                      <Coins className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          赚积分规则
                        </p>
                        <p className="text-2xl font-bold">
                          {
                            pointsRules.filter((r) => r.ruleType === 'earn')
                              .length
                          }
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          兑积分规则
                        </p>
                        <p className="text-2xl font-bold">
                          {
                            pointsRules.filter((r) => r.ruleType === 'redeem')
                              .length
                          }
                        </p>
                      </div>
                      <Award className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 积分规则列表 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>积分规则配置</CardTitle>
                      <CardDescription>
                        设置积分获取和兑换规则
                      </CardDescription>
                    </div>
                    <Button onClick={() => setRuleDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      添加规则
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>规则名称</TableHead>
                        <TableHead>规则类型</TableHead>
                        <TableHead>积分比例</TableHead>
                        <TableHead>使用条件</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pointsRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{rule.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {rule.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={rule.ruleType === 'earn' ? 'default' : 'secondary'}
                            >
                              {rule.ruleType === 'earn' ? '赚积分' : '兑积分'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {rule.ruleType === 'earn'
                                ? `1元 = ${rule.pointsPerYuan}积分`
                                : `${rule.pointsPerYuan}积分 = 1元`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {rule.minAmount && (
                                <div>最低: ¥{rule.minAmount}</div>
                              )}
                              {rule.maxPointsPerOrder && (
                                <div>最高: {rule.maxPointsPerOrder}积分</div>
                              )}
                              {!rule.minAmount && !rule.maxPointsPerOrder && (
                                <div className="text-muted-foreground">无限制</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {rule.status === 'active' ? (
                              <Badge className="bg-green-500">启用</Badge>
                            ) : (
                              <Badge className="bg-gray-500">停用</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleRuleStatus(rule.id)}
                              >
                                {rule.status === 'active' ? '停用' : '启用'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRule(rule.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

      {/* 添加会员等级对话框 */}
      <Dialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加会员等级</DialogTitle>
            <DialogDescription>
              创建新的会员等级并配置权益
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">等级名称 *</Label>
                <Input
                  id="name"
                  value={levelForm.name}
                  onChange={(e) =>
                    setLevelForm({ ...levelForm, name: e.target.value })
                  }
                  placeholder="例如：金卡会员"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">等级序号 *</Label>
                <Input
                  id="level"
                  type="number"
                  value={levelForm.level}
                  onChange={(e) =>
                    setLevelForm({
                      ...levelForm,
                      level: Number(e.target.value),
                    })
                  }
                  placeholder="1-4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">等级描述</Label>
              <Textarea
                id="description"
                value={levelForm.description}
                onChange={(e) =>
                  setLevelForm({ ...levelForm, description: e.target.value })
                }
                placeholder="描述该等级的特点"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPoints">升级积分 *</Label>
                <Input
                  id="minPoints"
                  type="number"
                  value={levelForm.minPoints}
                  onChange={(e) =>
                    setLevelForm({
                      ...levelForm,
                      minPoints: Number(e.target.value),
                    })
                  }
                  placeholder="累计积分"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountRate">折扣率 *</Label>
                <Input
                  id="discountRate"
                  type="number"
                  value={levelForm.discountRate}
                  onChange={(e) =>
                    setLevelForm({
                      ...levelForm,
                      discountRate: Number(e.target.value),
                    })
                  }
                  placeholder="100表示原价"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pointsPerYuan">积分倍率 *</Label>
                <Input
                  id="pointsPerYuan"
                  type="number"
                  step="0.1"
                  value={levelForm.pointsPerYuan}
                  onChange={(e) =>
                    setLevelForm({
                      ...levelForm,
                      pointsPerYuan: Number(e.target.value),
                    })
                  }
                  placeholder="例如：1.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">会员权益（每行一个）</Label>
              <Textarea
                id="benefits"
                value={levelForm.benefits}
                onChange={(e) =>
                  setLevelForm({ ...levelForm, benefits: e.target.value })
                }
                placeholder="生日特权&#10;积分抵扣&#10;专属客服"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">等级颜色</Label>
              <Input
                id="color"
                type="color"
                value={levelForm.color}
                onChange={(e) =>
                  setLevelForm({ ...levelForm, color: e.target.value })
                }
                className="h-10"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLevelDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleCreateLevel}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加积分规则对话框 */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>添加积分规则</DialogTitle>
            <DialogDescription>
              设置积分获取或兑换规则
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ruleName">规则名称 *</Label>
              <Input
                id="ruleName"
                value={ruleForm.name}
                onChange={(e) =>
                  setRuleForm({ ...ruleForm, name: e.target.value })
                }
                placeholder="例如：购物积分规则"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ruleType">规则类型 *</Label>
              <Select
                value={ruleForm.ruleType}
                onValueChange={(value: any) =>
                  setRuleForm({ ...ruleForm, ruleType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="earn">赚积分</SelectItem>
                  <SelectItem value="redeem">兑积分</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pointsPerYuan">积分比例 *</Label>
              <Input
                id="pointsPerYuan"
                type="number"
                value={ruleForm.pointsPerYuan}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    pointsPerYuan: Number(e.target.value),
                  })
                }
                placeholder={
                  ruleForm.ruleType === 'earn'
                    ? '1元获得的积分'
                    : '1元需要消耗的积分'
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">最低金额（元）</Label>
                <Input
                  id="minAmount"
                  type="number"
                  value={ruleForm.minAmount}
                  onChange={(e) =>
                    setRuleForm({
                      ...ruleForm,
                      minAmount: Number(e.target.value),
                    })
                  }
                  placeholder="0表示不限制"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPointsPerOrder">单次最高积分</Label>
                <Input
                  id="maxPointsPerOrder"
                  type="number"
                  value={ruleForm.maxPointsPerOrder}
                  onChange={(e) =>
                    setRuleForm({
                      ...ruleForm,
                      maxPointsPerOrder: Number(e.target.value),
                    })
                  }
                  placeholder="0表示不限制"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ruleDescription">规则说明</Label>
              <Textarea
                id="ruleDescription"
                value={ruleForm.description}
                onChange={(e) =>
                  setRuleForm({ ...ruleForm, description: e.target.value })
                }
                placeholder="详细描述规则内容"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateRule}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
