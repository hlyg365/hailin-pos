'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Award,
  Coins,
  Settings,
  Gift,
  Zap,
} from 'lucide-react';

interface PointsRule {
  id: string;
  name: string;
  pointsPerYuan: number;
  ruleType: 'earn' | 'redeem' | 'bonus';
  minAmount?: number;
  maxPointsPerOrder?: number;
  description: string;
  status: 'active' | 'inactive';
  createTime: string;
}

export default function PointsRulesPage() {
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
      ruleType: 'bonus',
      description: '新用户注册送100积分',
      status: 'active',
      createTime: '2024-01-01 10:00:00',
    },
    {
      id: '4',
      name: '生日双倍积分',
      pointsPerYuan: 2,
      ruleType: 'earn',
      description: '会员生日当天消费双倍积分',
      status: 'active',
      createTime: '2024-01-01 10:00:00',
    },
    {
      id: '5',
      name: '邀请新用户奖励',
      pointsPerYuan: 50,
      ruleType: 'bonus',
      description: '成功邀请新用户注册奖励50积分',
      status: 'active',
      createTime: '2024-01-01 10:00:00',
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PointsRule | null>(null);
  const [form, setForm] = useState<{
    name: string;
    pointsPerYuan: number;
    ruleType: 'earn' | 'redeem' | 'bonus';
    minAmount: number;
    maxPointsPerOrder: number;
    description: string;
  }>({
    name: '',
    pointsPerYuan: 1,
    ruleType: 'earn',
    minAmount: 0,
    maxPointsPerOrder: 0,
    description: '',
  });

  const handleOpenDialog = (rule?: PointsRule) => {
    if (rule) {
      setEditingRule(rule);
      setForm({
        name: rule.name,
        pointsPerYuan: rule.pointsPerYuan,
        ruleType: rule.ruleType,
        minAmount: rule.minAmount || 0,
        maxPointsPerOrder: rule.maxPointsPerOrder || 0,
        description: rule.description,
      });
    } else {
      setEditingRule(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingRule) {
      // 编辑
      setPointsRules(
        pointsRules.map((rule) =>
          rule.id === editingRule.id
            ? { ...rule, ...form }
            : rule
        )
      );
    } else {
      // 新增
      const newRule: PointsRule = {
        id: Date.now().toString(),
        ...form,
        status: 'active',
        createTime: new Date().toLocaleString(),
      };
      setPointsRules([...pointsRules, newRule]);
    }
    setDialogOpen(false);
    resetForm();
  };

  const handleToggleStatus = (ruleId: string) => {
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

  const handleDelete = (ruleId: string) => {
    if (window.confirm('确定要删除这个积分规则吗？')) {
      setPointsRules(pointsRules.filter((rule) => rule.id !== ruleId));
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      pointsPerYuan: 1,
      ruleType: 'earn',
      minAmount: 0,
      maxPointsPerOrder: 0,
      description: '',
    });
  };

  const getRuleTypeBadge = (type: PointsRule['ruleType']) => {
    switch (type) {
      case 'earn':
        return <Badge className="bg-blue-500"><TrendingUp className="h-3 w-3 mr-1" />赚积分</Badge>;
      case 'redeem':
        return <Badge className="bg-orange-500"><Gift className="h-3 w-3 mr-1" />兑积分</Badge>;
      case 'bonus':
        return <Badge className="bg-green-500"><Zap className="h-3 w-3 mr-1" />奖励积分</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="积分规则"
        description="配置会员积分获取和兑换规则"
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      规则总数
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
                      {pointsRules.filter((r) => r.ruleType === 'earn').length}
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
                      {pointsRules.filter((r) => r.ruleType === 'redeem').length}
                    </p>
                  </div>
                  <Gift className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      奖励规则
                    </p>
                    <p className="text-2xl font-bold">
                      {pointsRules.filter((r) => r.ruleType === 'bonus').length}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 规则列表 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>积分规则配置</CardTitle>
                  <CardDescription>
                    设置积分获取和兑换规则，支持多种积分场景
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenDialog()}>
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
                    <TableHead>创建时间</TableHead>
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
                      <TableCell>{getRuleTypeBadge(rule.ruleType)}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {rule.ruleType === 'earn' && `1元 = ${rule.pointsPerYuan}积分`}
                          {rule.ruleType === 'redeem' && `${rule.pointsPerYuan}积分 = 1元`}
                          {rule.ruleType === 'bonus' && `奖励 ${rule.pointsPerYuan} 积分`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {rule.minAmount && rule.minAmount > 0 && (
                            <div>最低: ¥{rule.minAmount}</div>
                          )}
                          {rule.maxPointsPerOrder && rule.maxPointsPerOrder > 0 && (
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
                        <div className="text-sm text-muted-foreground">
                          {rule.createTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(rule.id)}
                          >
                            {rule.status === 'active' ? '停用' : '启用'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rule.id)}
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

          {/* 规则说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">积分规则说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">赚积分</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    消费时获得积分，可设置消费金额与积分的比例关系
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">兑积分</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    使用积分抵扣消费金额，可设置积分与金额的兑换比例
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-green-500" />
                    <span className="font-medium">奖励积分</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    特定场景一次性奖励积分，如注册、邀请好友等
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 添加/编辑规则对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingRule ? '编辑积分规则' : '添加积分规则'}</DialogTitle>
            <DialogDescription>
              {editingRule ? '修改积分规则配置' : '创建新的积分规则'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">规则名称 *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例如：购物积分规则"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ruleType">规则类型 *</Label>
              <Select
                value={form.ruleType}
                onValueChange={(value) => setForm({ ...form, ruleType: value as PointsRule['ruleType'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="earn">赚积分</SelectItem>
                  <SelectItem value="redeem">兑积分</SelectItem>
                  <SelectItem value="bonus">奖励积分</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pointsPerYuan">
                {form.ruleType === 'earn' && '每元积分数量'}
                {form.ruleType === 'redeem' && '兑换1元所需积分'}
                {form.ruleType === 'bonus' && '奖励积分数量'}
              </Label>
              <Input
                id="pointsPerYuan"
                type="number"
                value={form.pointsPerYuan}
                onChange={(e) => setForm({ ...form, pointsPerYuan: Number(e.target.value) })}
                placeholder="输入数值"
              />
            </div>

            {form.ruleType !== 'bonus' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minAmount">最低金额</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    value={form.minAmount}
                    onChange={(e) => setForm({ ...form, minAmount: Number(e.target.value) })}
                    placeholder="0为不限制"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPointsPerOrder">最高积分</Label>
                  <Input
                    id="maxPointsPerOrder"
                    type="number"
                    value={form.maxPointsPerOrder}
                    onChange={(e) => setForm({ ...form, maxPointsPerOrder: Number(e.target.value) })}
                    placeholder="0为不限制"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">规则描述</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="描述该规则的用途"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!form.name}>
              {editingRule ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
