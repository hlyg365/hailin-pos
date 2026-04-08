'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Leaf,
  AlertTriangle,
  Clock,
  TrendingDown,
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Settings,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  BarChart3,
} from 'lucide-react';

// 损耗类型
interface LossRecord {
  id: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  lossType: 'expired' | 'damaged' | 'quality' | 'other';
  reason: string;
  amount: number;
  operator: string;
  storeId: string;
  createdAt: string;
}

// 分拣任务
interface SortingTask {
  id: string;
  productId: string;
  productName: string;
  category: string;
  totalQuantity: number;
  sortedQuantity: number;
  quality: 'premium' | 'standard' | 'discount';
  status: 'pending' | 'in_progress' | 'completed';
  assignee: string;
  storeId: string;
  createdAt: string;
}

// 清货规则
interface ClearanceRule {
  id: string;
  category: string;
  startTime: string;
  discountRate: number;
  minStock: number;
  enabled: boolean;
  storeId: string;
}

// 模拟数据
const mockLossRecords: LossRecord[] = [
  {
    id: 'loss-001',
    productId: 'prod-001',
    productName: '新鲜蔬菜拼盘',
    category: '蔬菜',
    quantity: 5,
    unit: '份',
    lossType: 'expired',
    reason: '超过保质期',
    amount: 45.00,
    operator: '李店员',
    storeId: 'store-001',
    createdAt: '2024-03-18 09:30:00',
  },
  {
    id: 'loss-002',
    productId: 'prod-002',
    productName: '进口香蕉',
    category: '水果',
    quantity: 3,
    unit: 'kg',
    lossType: 'damaged',
    reason: '运输挤压损坏',
    amount: 36.00,
    operator: '王店员',
    storeId: 'store-001',
    createdAt: '2024-03-18 10:15:00',
  },
  {
    id: 'loss-003',
    productId: 'prod-003',
    productName: '有机牛奶',
    category: '乳制品',
    quantity: 8,
    unit: '盒',
    lossType: 'quality',
    reason: '包装破损',
    amount: 72.00,
    operator: '张店员',
    storeId: 'store-001',
    createdAt: '2024-03-18 11:00:00',
  },
];

const mockSortingTasks: SortingTask[] = [
  {
    id: 'sort-001',
    productId: 'prod-004',
    productName: '新鲜草莓',
    category: '水果',
    totalQuantity: 20,
    sortedQuantity: 15,
    quality: 'premium',
    status: 'in_progress',
    assignee: '张分拣员',
    storeId: 'store-001',
    createdAt: '2024-03-18 06:00:00',
  },
  {
    id: 'sort-002',
    productId: 'prod-005',
    productName: '有机西红柿',
    category: '蔬菜',
    totalQuantity: 30,
    sortedQuantity: 30,
    quality: 'standard',
    status: 'completed',
    assignee: '李分拣员',
    storeId: 'store-001',
    createdAt: '2024-03-18 05:30:00',
  },
];

const mockClearanceRules: ClearanceRule[] = [
  {
    id: 'rule-001',
    category: '蔬菜',
    startTime: '20:00',
    discountRate: 0.5,
    minStock: 1,
    enabled: true,
    storeId: 'store-001',
  },
  {
    id: 'rule-002',
    category: '水果',
    startTime: '20:00',
    discountRate: 0.6,
    minStock: 1,
    enabled: true,
    storeId: 'store-001',
  },
  {
    id: 'rule-003',
    category: '熟食',
    startTime: '19:00',
    discountRate: 0.4,
    minStock: 1,
    enabled: true,
    storeId: 'store-001',
  },
];

export default function FreshControlPage() {
  const [activeTab, setActiveTab] = useState('loss');
  const [lossRecords, setLossRecords] = useState<LossRecord[]>(mockLossRecords);
  const [sortingTasks, setSortingTasks] = useState<SortingTask[]>(mockSortingTasks);
  const [clearanceRules, setClearanceRules] = useState<ClearanceRule[]>(mockClearanceRules);
  
  // 新增损耗弹窗状态
  const [showAddLoss, setShowAddLoss] = useState(false);
  const [newLoss, setNewLoss] = useState<{
    productName: string;
    category: string;
    quantity: string;
    unit: string;
    lossType: 'expired' | 'damaged' | 'quality' | 'other';
    reason: string;
  }>({
    productName: '',
    category: '',
    quantity: '',
    unit: '份',
    lossType: 'expired',
    reason: '',
  });

  // 新增分拣任务弹窗状态
  const [showAddSorting, setShowAddSorting] = useState(false);
  const [newSorting, setNewSorting] = useState<{
    productName: string;
    category: string;
    totalQuantity: string;
    quality: 'premium' | 'standard' | 'discount';
    assignee: string;
  }>({
    productName: '',
    category: '',
    totalQuantity: '',
    quality: 'standard',
    assignee: '',
  });

  // 新增清货规则弹窗状态
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    category: '',
    startTime: '20:00',
    discountRate: '50',
    minStock: '1',
    enabled: true,
  });

  // 计算损耗统计
  const lossStats = {
    totalAmount: lossRecords.reduce((sum, r) => sum + r.amount, 0),
    totalCount: lossRecords.length,
    byType: {
      expired: lossRecords.filter(r => r.lossType === 'expired').reduce((sum, r) => sum + r.amount, 0),
      damaged: lossRecords.filter(r => r.lossType === 'damaged').reduce((sum, r) => sum + r.amount, 0),
      quality: lossRecords.filter(r => r.lossType === 'quality').reduce((sum, r) => sum + r.amount, 0),
      other: lossRecords.filter(r => r.lossType === 'other').reduce((sum, r) => sum + r.amount, 0),
    },
  };

  // 计算分拣统计
  const sortingStats = {
    total: sortingTasks.length,
    completed: sortingTasks.filter(t => t.status === 'completed').length,
    inProgress: sortingTasks.filter(t => t.status === 'in_progress').length,
    pending: sortingTasks.filter(t => t.status === 'pending').length,
  };

  // 获取损耗类型标签
  const getLossTypeBadge = (type: string) => {
    const config: Record<string, { label: string; className: string }> = {
      expired: { label: '过期损耗', className: 'bg-red-100 text-red-700' },
      damaged: { label: '损坏损耗', className: 'bg-orange-100 text-orange-700' },
      quality: { label: '质量问题', className: 'bg-yellow-100 text-yellow-700' },
      other: { label: '其他损耗', className: 'bg-gray-100 text-gray-700' },
    };
    const { label, className } = config[type] || config.other;
    return <Badge className={className}>{label}</Badge>;
  };

  // 获取分拣状态标签
  const getSortingStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: '待分拣', className: 'bg-gray-100 text-gray-700' },
      in_progress: { label: '分拣中', className: 'bg-blue-100 text-blue-700' },
      completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
    };
    const { label, className } = config[status] || config.pending;
    return <Badge className={className}>{label}</Badge>;
  };

  // 获取品质标签
  const getQualityBadge = (quality: string) => {
    const config: Record<string, { label: string; className: string }> = {
      premium: { label: '精品', className: 'bg-purple-100 text-purple-700' },
      standard: { label: '标准', className: 'bg-blue-100 text-blue-700' },
      discount: { label: '特价', className: 'bg-orange-100 text-orange-700' },
    };
    const { label, className } = config[quality] || config.standard;
    return <Badge className={className}>{label}</Badge>;
  };

  // 添加损耗记录
  const handleAddLoss = () => {
    const record: LossRecord = {
      id: `loss-${Date.now()}`,
      productId: `prod-${Date.now()}`,
      productName: newLoss.productName,
      category: newLoss.category,
      quantity: parseFloat(newLoss.quantity) || 0,
      unit: newLoss.unit,
      lossType: newLoss.lossType,
      reason: newLoss.reason,
      amount: parseFloat(newLoss.quantity) * 10, // 模拟金额计算
      operator: '当前用户',
      storeId: 'store-001',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setLossRecords([record, ...lossRecords]);
    setShowAddLoss(false);
    setNewLoss({
      productName: '',
      category: '',
      quantity: '',
      unit: '份',
      lossType: 'expired',
      reason: '',
    });
  };

  // 添加分拣任务
  const handleAddSorting = () => {
    const task: SortingTask = {
      id: `sort-${Date.now()}`,
      productId: `prod-${Date.now()}`,
      productName: newSorting.productName,
      category: newSorting.category,
      totalQuantity: parseFloat(newSorting.totalQuantity) || 0,
      sortedQuantity: 0,
      quality: newSorting.quality,
      status: 'pending',
      assignee: newSorting.assignee,
      storeId: 'store-001',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setSortingTasks([task, ...sortingTasks]);
    setShowAddSorting(false);
    setNewSorting({
      productName: '',
      category: '',
      totalQuantity: '',
      quality: 'standard',
      assignee: '',
    });
  };

  // 添加清货规则
  const handleAddRule = () => {
    const rule: ClearanceRule = {
      id: `rule-${Date.now()}`,
      category: newRule.category,
      startTime: newRule.startTime,
      discountRate: parseFloat(newRule.discountRate) / 100,
      minStock: parseInt(newRule.minStock),
      enabled: newRule.enabled,
      storeId: 'store-001',
    };
    setClearanceRules([...clearanceRules, rule]);
    setShowAddRule(false);
    setNewRule({
      category: '',
      startTime: '20:00',
      discountRate: '50',
      minStock: '1',
      enabled: true,
    });
  };

  // 切换清货规则状态
  const toggleRuleEnabled = (ruleId: string) => {
    setClearanceRules(clearanceRules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Leaf className="h-8 w-8 text-green-600" />
            生鲜专项管控
          </h1>
          <p className="text-muted-foreground mt-1">
            生鲜商品损耗管理、分拣流程、晚8点清货专项管控
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出报表
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            配置设置
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              今日损耗金额
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ¥{lossStats.totalAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              共 {lossStats.totalCount} 笔损耗记录
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              分拣完成率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {sortingStats.total > 0 
                ? Math.round((sortingStats.completed / sortingStats.total) * 100) 
                : 0}%
            </div>
            <Progress 
              value={sortingStats.total > 0 
                ? (sortingStats.completed / sortingStats.total) * 100 
                : 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              清货规则数量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {clearanceRules.filter(r => r.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              已启用 / 共 {clearanceRules.length} 条规则
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              晚8点清货状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-lg font-semibold">已开启</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              清货折扣已自动应用
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 损耗类型分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">损耗类型分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">过期损耗</p>
                <p className="text-lg font-semibold">¥{lossStats.byType.expired.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">损坏损耗</p>
                <p className="text-lg font-semibold">¥{lossStats.byType.damaged.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">质量问题</p>
                <p className="text-lg font-semibold">¥{lossStats.byType.quality.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">其他损耗</p>
                <p className="text-lg font-semibold">¥{lossStats.byType.other.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主要内容标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="loss" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            损耗管控
          </TabsTrigger>
          <TabsTrigger value="sorting" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            分拣管理
          </TabsTrigger>
          <TabsTrigger value="clearance" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            晚8点清货
          </TabsTrigger>
        </TabsList>

        {/* 损耗管控 */}
        <TabsContent value="loss" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="搜索商品名称..." className="pl-8 w-64" />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                筛选
              </Button>
            </div>
            <Dialog open={showAddLoss} onOpenChange={setShowAddLoss}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  登记损耗
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>登记损耗</DialogTitle>
                  <DialogDescription>
                    登记生鲜商品损耗信息，用于统计分析和成本控制
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="productName">商品名称</Label>
                    <Input
                      id="productName"
                      value={newLoss.productName}
                      onChange={(e) => setNewLoss({ ...newLoss, productName: e.target.value })}
                      placeholder="输入商品名称"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">商品分类</Label>
                      <Select
                        value={newLoss.category}
                        onValueChange={(v) => setNewLoss({ ...newLoss, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择分类" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="蔬菜">蔬菜</SelectItem>
                          <SelectItem value="水果">水果</SelectItem>
                          <SelectItem value="肉类">肉类</SelectItem>
                          <SelectItem value="水产">水产</SelectItem>
                          <SelectItem value="乳制品">乳制品</SelectItem>
                          <SelectItem value="熟食">熟食</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lossType">损耗类型</Label>
                      <Select
                        value={newLoss.lossType}
                        onValueChange={(v) => 
                          setNewLoss({ ...newLoss, lossType: v as 'expired' | 'damaged' | 'quality' | 'other' })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expired">过期损耗</SelectItem>
                          <SelectItem value="damaged">损坏损耗</SelectItem>
                          <SelectItem value="quality">质量问题</SelectItem>
                          <SelectItem value="other">其他损耗</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="quantity">损耗数量</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={newLoss.quantity}
                        onChange={(e) => setNewLoss({ ...newLoss, quantity: e.target.value })}
                        placeholder="输入数量"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="unit">单位</Label>
                      <Select
                        value={newLoss.unit}
                        onValueChange={(v) => setNewLoss({ ...newLoss, unit: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择单位" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="份">份</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="盒">盒</SelectItem>
                          <SelectItem value="袋">袋</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reason">损耗原因</Label>
                    <Textarea
                      id="reason"
                      value={newLoss.reason}
                      onChange={(e) => setNewLoss({ ...newLoss, reason: e.target.value })}
                      placeholder="详细描述损耗原因..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddLoss(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddLoss}>确认登记</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品名称</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>数量</TableHead>
                  <TableHead>损耗类型</TableHead>
                  <TableHead>损耗原因</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>操作人</TableHead>
                  <TableHead>登记时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lossRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.productName}</TableCell>
                    <TableCell>{record.category}</TableCell>
                    <TableCell>{record.quantity} {record.unit}</TableCell>
                    <TableCell>{getLossTypeBadge(record.lossType)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{record.reason}</TableCell>
                    <TableCell className="text-red-600 font-medium">
                      ¥{record.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{record.operator}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {record.createdAt}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* 分拣管理 */}
        <TabsContent value="sorting" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                待分拣: {sortingStats.pending}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                分拣中: {sortingStats.inProgress}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                已完成: {sortingStats.completed}
              </Badge>
            </div>
            <Dialog open={showAddSorting} onOpenChange={setShowAddSorting}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  新增分拣任务
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新增分拣任务</DialogTitle>
                  <DialogDescription>
                    创建生鲜商品分拣任务，指定分拣员和品质标准
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sortingProductName">商品名称</Label>
                    <Input
                      id="sortingProductName"
                      value={newSorting.productName}
                      onChange={(e) => setNewSorting({ ...newSorting, productName: e.target.value })}
                      placeholder="输入商品名称"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="sortingCategory">商品分类</Label>
                      <Select
                        value={newSorting.category}
                        onValueChange={(v) => setNewSorting({ ...newSorting, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择分类" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="蔬菜">蔬菜</SelectItem>
                          <SelectItem value="水果">水果</SelectItem>
                          <SelectItem value="肉类">肉类</SelectItem>
                          <SelectItem value="水产">水产</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="totalQuantity">总数量</Label>
                      <Input
                        id="totalQuantity"
                        type="number"
                        value={newSorting.totalQuantity}
                        onChange={(e) => setNewSorting({ ...newSorting, totalQuantity: e.target.value })}
                        placeholder="输入数量"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="quality">品质标准</Label>
                      <Select
                        value={newSorting.quality}
                        onValueChange={(v) => 
                          setNewSorting({ ...newSorting, quality: v as 'premium' | 'standard' | 'discount' })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择标准" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="premium">精品</SelectItem>
                          <SelectItem value="standard">标准</SelectItem>
                          <SelectItem value="discount">特价</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="assignee">分拣员</Label>
                      <Select
                        value={newSorting.assignee}
                        onValueChange={(v) => setNewSorting({ ...newSorting, assignee: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择分拣员" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="张分拣员">张分拣员</SelectItem>
                          <SelectItem value="李分拣员">李分拣员</SelectItem>
                          <SelectItem value="王分拣员">王分拣员</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddSorting(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddSorting}>创建任务</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {sortingTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">{task.productName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{task.category}</Badge>
                          {getQualityBadge(task.quality)}
                          {getSortingStatusBadge(task.status)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">分拣进度</p>
                        <p className="text-lg font-semibold">
                          {task.sortedQuantity} / {task.totalQuantity}
                        </p>
                        <Progress 
                          value={(task.sortedQuantity / task.totalQuantity) * 100} 
                          className="w-24 mt-1" 
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">分拣员</p>
                        <p className="font-medium">{task.assignee}</p>
                      </div>
                      <div className="flex gap-2">
                        {task.status === 'pending' && (
                          <Button size="sm" variant="outline">
                            开始分拣
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button size="sm">
                            完成分拣
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 晚8点清货 */}
        <TabsContent value="clearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                晚8点清货规则
              </CardTitle>
              <CardDescription>
                配置各品类清货时间和折扣规则，系统将自动在指定时间应用清货价格
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  清货规则将自动应用于收银台，收银员可看到清货价格标识
                </div>
                <Dialog open={showAddRule} onOpenChange={setShowAddRule}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      新增规则
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>新增清货规则</DialogTitle>
                      <DialogDescription>
                        为特定品类配置晚8点清货规则
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="ruleCategory">适用品类</Label>
                        <Select
                          value={newRule.category}
                          onValueChange={(v) => setNewRule({ ...newRule, category: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择品类" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="蔬菜">蔬菜</SelectItem>
                            <SelectItem value="水果">水果</SelectItem>
                            <SelectItem value="熟食">熟食</SelectItem>
                            <SelectItem value="烘焙">烘焙</SelectItem>
                            <SelectItem value="肉类">肉类</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="startTime">开始时间</Label>
                          <Input
                            id="startTime"
                            type="time"
                            value={newRule.startTime}
                            onChange={(e) => setNewRule({ ...newRule, startTime: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="discountRate">折扣率 (%)</Label>
                          <Input
                            id="discountRate"
                            type="number"
                            min="10"
                            max="90"
                            value={newRule.discountRate}
                            onChange={(e) => setNewRule({ ...newRule, discountRate: e.target.value })}
                            placeholder="50"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="minStock">最低库存</Label>
                          <Input
                            id="minStock"
                            type="number"
                            min="1"
                            value={newRule.minStock}
                            onChange={(e) => setNewRule({ ...newRule, minStock: e.target.value })}
                            placeholder="1"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>是否启用</Label>
                          <div className="flex items-center gap-2 pt-2">
                            <Switch
                              checked={newRule.enabled}
                              onCheckedChange={(checked) => setNewRule({ ...newRule, enabled: checked })}
                            />
                            <span className="text-sm">{newRule.enabled ? '已启用' : '已禁用'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddRule(false)}>
                        取消
                      </Button>
                      <Button onClick={handleAddRule}>保存规则</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>适用品类</TableHead>
                    <TableHead>开始时间</TableHead>
                    <TableHead>折扣率</TableHead>
                    <TableHead>最低库存</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clearanceRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.category}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {rule.startTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-orange-600 font-semibold">
                          {(rule.discountRate * 100).toFixed(0)}%
                        </span>
                      </TableCell>
                      <TableCell>{rule.minStock}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => toggleRuleEnabled(rule.id)}
                          />
                          <span className="text-sm">
                            {rule.enabled ? '已启用' : '已禁用'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 清货统计 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">今日清货销售</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">清货销售额</span>
                    <span className="text-2xl font-bold text-orange-600">¥568.50</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">清货商品数</span>
                    <span className="text-xl font-semibold">47件</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">减少损耗</span>
                    <span className="text-lg font-semibold text-green-600">¥284.25</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">本周损耗趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, i) => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="w-8 text-sm text-muted-foreground">{day}</span>
                      <Progress 
                        value={[85, 72, 65, 58, 45, 38, 30][i]} 
                        className="flex-1" 
                      />
                      <span className="text-sm font-medium w-12 text-right">
                        {[85, 72, 65, 58, 45, 38, 30][i]}%
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  * 损耗率自启用晚8点清货后持续下降
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
