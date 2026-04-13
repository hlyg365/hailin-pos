'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Bell,
  Search,
  Filter,
  Clock,
  User,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  Ban,
  RefreshCw,
  Settings,
  TrendingUp,
  Store,
} from 'lucide-react';
import {
  storeControlService,
  getRiskLevelColor,
  getRiskLevelName,
  type RiskAlert,
  type RiskRule,
  type RiskLevel,
} from '@/lib/store-control-service';

// 风险类型名称映射
const RISK_TYPE_NAMES: Record<string, string> = {
  expired_product: '售卖过期商品',
  tobacco_violation: '烟草违规售卖',
  license_expired: '证照到期',
  price_violation: '价格违规',
  brand_damage: '损害品牌形象',
  health_cert_expired: '健康证到期',
  overdue_product: '临期商品超标',
  high_loss_rate: '损耗率超标',
  inspection_failed: '巡店不合格',
  stockout: '畅销品断货',
  member_decline: '会员活跃度下降',
  revenue_decline: '营收异常下滑',
};

// 风险状态名称
const RISK_STATUS_NAMES: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  escalated: '已升级',
};

// 风险状态颜色
const RISK_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-red-100 text-red-700',
  processing: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  escalated: 'bg-purple-100 text-purple-700',
};

// 模拟预警数据
const mockAlerts: RiskAlert[] = [
  {
    id: 'alert-001',
    alertNo: 'ALERT20240318001',
    storeId: 'store-001',
    storeName: '海邻到家·阳光小区店',
    storeType: 'franchise_b',
    ruleId: 'risk_expired_product',
    ruleName: '售卖过期商品',
    type: 'expired_product',
    level: 'critical',
    triggerData: {
      description: '检测到过期商品「有机牛奶」仍在销售',
      value: 3,
      threshold: 0,
      occurredAt: '2024-03-18 09:30:00',
    },
    status: 'pending',
    createdAt: '2024-03-18 09:30:00',
    updatedAt: '2024-03-18 09:30:00',
  },
  {
    id: 'alert-002',
    alertNo: 'ALERT20240318002',
    storeId: 'store-002',
    storeName: '海邻到家·翠苑小区店',
    storeType: 'franchise_c',
    ruleId: 'risk_health_cert_expired',
    ruleName: '健康证到期',
    type: 'health_cert_expired',
    level: 'major',
    triggerData: {
      description: '员工张三的健康证将于3天内到期',
      value: 3,
      threshold: 30,
      occurredAt: '2024-03-18 08:00:00',
    },
    status: 'processing',
    rectification: {
      assignee: 'user-002',
      assigneeName: '王店长',
      assignedAt: '2024-03-18 08:30:00',
      deadline: '2024-03-25 08:00:00',
    },
    createdAt: '2024-03-18 08:00:00',
    updatedAt: '2024-03-18 08:30:00',
  },
  {
    id: 'alert-003',
    alertNo: 'ALERT20240318003',
    storeId: 'store-003',
    storeName: '海邻到家·金色家园店',
    storeType: 'direct',
    ruleId: 'risk_stockout',
    ruleName: '畅销品断货',
    type: 'stockout',
    level: 'minor',
    triggerData: {
      description: '畅销品「农夫山泉550ml」库存不足',
      value: 5,
      threshold: 10,
      occurredAt: '2024-03-18 10:00:00',
    },
    status: 'resolved',
    rectification: {
      assignee: 'user-003',
      assigneeName: '李店长',
      assignedAt: '2024-03-18 10:15:00',
      deadline: '2024-03-19 10:00:00',
      submittedAt: '2024-03-18 14:00:00',
      submittedBy: 'user-003',
      reviewResult: 'approved',
      reviewedBy: 'user-hq-001',
      reviewedAt: '2024-03-18 15:00:00',
      reviewComment: '已及时补货，处理得当',
    },
    createdAt: '2024-03-18 10:00:00',
    updatedAt: '2024-03-18 15:00:00',
  },
  {
    id: 'alert-004',
    alertNo: 'ALERT20240318004',
    storeId: 'store-004',
    storeName: '海邻到家·幸福里店',
    storeType: 'franchise_b',
    ruleId: 'risk_high_loss_rate',
    ruleName: '损耗率超标',
    type: 'high_loss_rate',
    level: 'major',
    triggerData: {
      description: '本周生鲜损耗率达到6.2%，超过5%标准',
      value: 6.2,
      threshold: 5,
      occurredAt: '2024-03-18 00:00:00',
    },
    status: 'processing',
    rectification: {
      assignee: 'user-004',
      assigneeName: '赵店长',
      assignedAt: '2024-03-18 09:00:00',
      deadline: '2024-03-25 00:00:00',
    },
    createdAt: '2024-03-18 00:00:00',
    updatedAt: '2024-03-18 09:00:00',
  },
];

// 模拟风险规则数据
const mockRiskRules = storeControlService.getRiskRules();

export default function RiskAlertsPage() {
  const [alerts, setAlerts] = useState<RiskAlert[]>(mockAlerts);
  const [riskRules] = useState<RiskRule[]>(mockRiskRules);
  const [activeTab, setActiveTab] = useState('alerts');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 弹窗状态
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<RiskAlert | null>(null);
  
  // 整改表单
  const [assignForm, setAssignForm] = useState({
    assignee: '',
    deadline: '',
  });
  
  // 审核表单
  const [reviewForm, setReviewForm] = useState({
    result: 'approved' as 'approved' | 'rejected',
    comment: '',
  });

  // 统计数据
  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.level === 'critical').length,
    major: alerts.filter(a => a.level === 'major').length,
    minor: alerts.filter(a => a.level === 'minor').length,
    pending: alerts.filter(a => a.status === 'pending').length,
    processing: alerts.filter(a => a.status === 'processing').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  };

  // 过滤预警
  const filteredAlerts = alerts.filter(alert => {
    if (filterLevel !== 'all' && alert.level !== filterLevel) return false;
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
    if (searchQuery && !alert.storeName.includes(searchQuery) && !alert.alertNo.includes(searchQuery)) return false;
    return true;
  });

  // 查看详情
  const handleViewDetail = (alert: RiskAlert) => {
    setSelectedAlert(alert);
    setShowDetailDialog(true);
  };

  // 分配整改
  const handleAssign = (alert: RiskAlert) => {
    setSelectedAlert(alert);
    setAssignForm({
      assignee: '',
      deadline: '',
    });
    setShowAssignDialog(true);
  };

  // 提交分配
  const submitAssign = () => {
    if (!selectedAlert) return;
    
    // 更新预警状态
    setAlerts(alerts.map(a => {
      if (a.id === selectedAlert.id) {
        return {
          ...a,
          status: 'processing' as const,
          rectification: {
            assignee: assignForm.assignee,
            assigneeName: '指派人员',
            assignedAt: new Date().toISOString(),
            deadline: assignForm.deadline,
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return a;
    }));
    
    setShowAssignDialog(false);
    setSelectedAlert(null);
  };

  // 审核
  const handleReview = (alert: RiskAlert) => {
    setSelectedAlert(alert);
    setReviewForm({
      result: 'approved',
      comment: '',
    });
    setShowReviewDialog(true);
  };

  // 提交审核
  const submitReview = () => {
    if (!selectedAlert) return;
    
    setAlerts(alerts.map(a => {
      if (a.id === selectedAlert.id) {
        return {
          ...a,
          status: reviewForm.result === 'approved' ? 'resolved' as const : a.status,
          rectification: {
            ...a.rectification!,
            reviewResult: reviewForm.result,
            reviewedBy: 'current-user',
            reviewedAt: new Date().toISOString(),
            reviewComment: reviewForm.comment,
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return a;
    }));
    
    setShowReviewDialog(false);
    setSelectedAlert(null);
  };

  // 执行处罚
  const executePenalty = (riskAlert: RiskAlert) => {
    const rule = riskRules.find(r => r.id === riskAlert.ruleId);
    if (!rule?.penalties) return;
    
    console.log('[RiskAlert] Executing penalty:', riskAlert.id, rule.penalties);
    // 显示处罚执行提示
    window.alert('处罚已执行：' + JSON.stringify(rule.penalties));
  };

  // 渲染风险等级图标
  const renderLevelIcon = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return <AlertOctagon className="h-5 w-5 text-red-600" />;
      case 'major':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'minor':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            风险预警管理
          </h1>
          <p className="text-muted-foreground mt-1">
            分级风险预警、整改闭环、权限联动管控
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            预警规则配置
          </Button>
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            通知设置
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              今日预警总数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-red-600">一级 {stats.critical}</span>
              <span className="text-orange-600">二级 {stats.major}</span>
              <span className="text-yellow-600">三级 {stats.minor}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              待处理预警
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.pending}</div>
            <Progress value={stats.total > 0 ? (stats.pending / stats.total) * 100 : 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              处理中
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            <Progress value={stats.total > 0 ? (stats.processing / stats.total) * 100 : 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已解决
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <Progress value={stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="alerts">预警列表</TabsTrigger>
          <TabsTrigger value="rules">预警规则</TabsTrigger>
          <TabsTrigger value="statistics">统计分析</TabsTrigger>
        </TabsList>

        {/* 预警列表 */}
        <TabsContent value="alerts" className="space-y-4">
          {/* 筛选 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索门店名称或预警编号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="风险等级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部等级</SelectItem>
                <SelectItem value="critical">一级风险</SelectItem>
                <SelectItem value="major">二级风险</SelectItem>
                <SelectItem value="minor">三级风险</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="处理状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="processing">处理中</SelectItem>
                <SelectItem value="resolved">已解决</SelectItem>
                <SelectItem value="escalated">已升级</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 预警表格 */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>预警编号</TableHead>
                  <TableHead>门店名称</TableHead>
                  <TableHead>风险类型</TableHead>
                  <TableHead>风险等级</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>触发时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-mono text-sm">{alert.alertNo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        {alert.storeName}
                      </div>
                    </TableCell>
                    <TableCell>{RISK_TYPE_NAMES[alert.type]}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renderLevelIcon(alert.level)}
                        <Badge className={getRiskLevelColor(alert.level)}>
                          {getRiskLevelName(alert.level)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={RISK_STATUS_COLORS[alert.status]}>
                        {RISK_STATUS_NAMES[alert.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {alert.createdAt}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(alert)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {alert.status === 'pending' && (
                          <Button variant="ghost" size="sm" onClick={() => handleAssign(alert)}>
                            <User className="h-4 w-4" />
                          </Button>
                        )}
                        {alert.status === 'processing' && alert.rectification?.submittedAt && (
                          <Button variant="ghost" size="sm" onClick={() => handleReview(alert)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {alert.level === 'critical' && alert.status === 'pending' && (
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => executePenalty(alert)}>
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* 预警规则 */}
        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4">
            {riskRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {renderLevelIcon(rule.level)}
                      {rule.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getRiskLevelColor(rule.level)}>
                        {getRiskLevelName(rule.level)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {rule.enabled ? '已启用' : '已禁用'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">触发条件</p>
                      <p>
                        {rule.conditions.threshold !== undefined && `阈值: ${rule.conditions.threshold}`}
                        {rule.conditions.count !== undefined && ` 次数: ${rule.conditions.count}`}
                        {rule.conditions.timeWindow && ` 时间窗口: ${rule.conditions.timeWindow}小时`}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">处理要求</p>
                      <p>响应时间: {rule.requirements.responseTime}小时</p>
                      <p>整改时间: {rule.requirements.resolveTime}小时</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">处罚措施</p>
                      {rule.penalties ? (
                        <div className="space-y-1">
                          {rule.penalties.freezePermissions && (
                            <p>冻结权限: {rule.penalties.freezePermissions.length}项</p>
                          )}
                          {rule.penalties.deductPoints && (
                            <p>扣除积分: {rule.penalties.deductPoints}分</p>
                          )}
                          {rule.penalties.suspendStore && (
                            <p className="text-red-600">暂停门店</p>
                          )}
                        </div>
                      ) : (
                        <p>无处罚措施</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 统计分析 */}
        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>风险类型分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(RISK_TYPE_NAMES).slice(0, 6).map(([key, name]) => {
                    const count = alerts.filter(a => a.type === key).length;
                    const percentage = alerts.length > 0 ? (count / alerts.length) * 100 : 0;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="w-20 text-sm text-muted-foreground">{name}</span>
                        <Progress value={percentage} className="flex-1" />
                        <span className="text-sm font-medium w-12 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>门店风险排行</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['海邻到家·阳光小区店', '海邻到家·翠苑小区店', '海邻到家·金色家园店', '海邻到家·幸福里店'].map((store, i) => {
                    const riskCounts = [3, 2, 2, 1]; // 预定义的风险数量
                    return (
                      <div key={store} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{i + 1}</span>
                          <span className="text-sm">{store}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-red-600">{riskCounts[i]}</span>
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 详情弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>预警详情</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">预警编号</Label>
                  <p className="font-mono">{selectedAlert.alertNo}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">门店名称</Label>
                  <p>{selectedAlert.storeName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">风险类型</Label>
                  <p>{RISK_TYPE_NAMES[selectedAlert.type]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">风险等级</Label>
                  <Badge className={getRiskLevelColor(selectedAlert.level)}>
                    {getRiskLevelName(selectedAlert.level)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">触发时间</Label>
                  <p>{selectedAlert.triggerData.occurredAt}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">当前状态</Label>
                  <Badge className={RISK_STATUS_COLORS[selectedAlert.status]}>
                    {RISK_STATUS_NAMES[selectedAlert.status]}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">触发详情</Label>
                <p>{selectedAlert.triggerData.description}</p>
              </div>

              {selectedAlert.rectification && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">整改信息</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">负责人</Label>
                      <p>{selectedAlert.rectification.assigneeName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">截止时间</Label>
                      <p>{selectedAlert.rectification.deadline}</p>
                    </div>
                    {selectedAlert.rectification.submittedAt && (
                      <div>
                        <Label className="text-muted-foreground">提交时间</Label>
                        <p>{selectedAlert.rectification.submittedAt}</p>
                      </div>
                    )}
                    {selectedAlert.rectification.reviewResult && (
                      <div>
                        <Label className="text-muted-foreground">审核结果</Label>
                        <Badge className={selectedAlert.rectification.reviewResult === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {selectedAlert.rectification.reviewResult === 'approved' ? '通过' : '驳回'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 分配整改弹窗 */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分配整改任务</DialogTitle>
            <DialogDescription>
              指定整改负责人和截止时间
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>整改负责人</Label>
              <Select value={assignForm.assignee} onValueChange={(v) => setAssignForm({ ...assignForm, assignee: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择负责人" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user-001">张店长</SelectItem>
                  <SelectItem value="user-002">王店长</SelectItem>
                  <SelectItem value="user-003">李店长</SelectItem>
                  <SelectItem value="user-004">赵店长</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>整改截止时间</Label>
              <Input
                type="datetime-local"
                value={assignForm.deadline}
                onChange={(e) => setAssignForm({ ...assignForm, deadline: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              取消
            </Button>
            <Button onClick={submitAssign}>确认分配</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 审核弹窗 */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审核整改结果</DialogTitle>
            <DialogDescription>
              审核门店提交的整改结果
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>审核结果</Label>
              <Select value={reviewForm.result} onValueChange={(v: 'approved' | 'rejected') => setReviewForm({ ...reviewForm, result: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">整改通过</SelectItem>
                  <SelectItem value="rejected">整改驳回</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>审核意见</Label>
              <Textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="输入审核意见..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              取消
            </Button>
            <Button onClick={submitReview}>确认审核</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
