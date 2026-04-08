'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Key,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  History,
  Calendar,
  AlertCircle,
  FileText,
  Store,
  User,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import {
  type TemporaryPermissionRequest,
  type FeatureModule,
  type SubModule,
  type PermissionAction,
  STORE_TYPE_NAMES,
} from '@/lib/store-control-service';

// 模块名称映射
const MODULE_NAMES: Record<FeatureModule, string> = {
  organization: '组织与人事',
  products: '商品管理',
  supply: '供应链与采购',
  marketing: '营销促销',
  members: '会员运营',
  finance: '财务与分账',
  compliance: '合规与风控',
  operations: '运营与巡店',
};

// 子模块名称映射
const SUB_MODULE_NAMES: Record<SubModule, string> = {
  staff_recruit: '人员招聘',
  staff_schedule: '排班管理',
  staff_salary: '薪资设置',
  store_info: '门店信息',
  product_view: '查看商品',
  product_add: '新增商品',
  product_edit: '编辑商品',
  product_price: '调整价格',
  product_shelf: '上下架',
  product_discount: '折扣权限',
  supply_request: '要货申请',
  supply_purchase: '自主采购',
  supply_transfer: '跨店调拨',
  supply_settle: '供应商结算',
  marketing_hq: '总部活动',
  marketing_store: '门店活动',
  marketing_coupon: '优惠券',
  marketing_discount: '改价抹零',
  member_register: '会员注册',
  member_benefit: '会员权益',
  member_data: '会员数据',
  finance_view: '查看财务',
  finance_settle: '资金结算',
  finance_export: '导出报表',
  compliance_check: '合规检查',
  compliance_upload: '证照上传',
  compliance_alert: '风险预警',
  ops_standard: '运营标准',
  ops_inspection: '巡店整改',
  ops_activity: '邻里活动',
};

// 申请原因类型
const REASON_TYPE_NAMES: Record<string, string> = {
  group_purchase: '大型团购',
  emergency: '突发应急',
  special_event: '特殊活动',
  other: '其他原因',
};

// 状态名称
const STATUS_NAMES: Record<string, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  expired: '已过期',
  cancelled: '已取消',
};

// 状态颜色
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

// 模拟临时权限申请数据
const mockRequests: TemporaryPermissionRequest[] = [
  {
    id: 'tpr-001',
    requestNo: 'TPR20240318001',
    storeId: 'store-002',
    storeName: '海邻到家·翠苑小区店',
    storeType: 'franchise_b',
    applicantId: 'user-002',
    applicantName: '王店长',
    requestedPermissions: [
      { module: 'marketing', subModule: 'marketing_discount', actions: ['create', 'edit'], level: 'limited', dataScope: { type: 'store' }, restrictions: { maxDiscount: 50 } },
      { module: 'marketing', subModule: 'marketing_store', actions: ['create', 'edit'], level: 'standard', dataScope: { type: 'store' } },
    ],
    reason: '小区举办业主答谢活动，需要临时提高折扣权限',
    reasonType: 'special_event',
    validFrom: '2024-03-20 08:00:00',
    validTo: '2024-03-20 22:00:00',
    status: 'pending',
    operationLogs: [
      { action: 'created', operatorId: 'user-002', operatorName: '王店长', operatedAt: '2024-03-18 10:00:00', details: '小区举办业主答谢活动，需要临时提高折扣权限' },
    ],
    createdAt: '2024-03-18 10:00:00',
    updatedAt: '2024-03-18 10:00:00',
  },
  {
    id: 'tpr-002',
    requestNo: 'TPR20240317002',
    storeId: 'store-003',
    storeName: '海邻到家·金色家园店',
    storeType: 'franchise_c',
    applicantId: 'user-003',
    applicantName: '李店长',
    requestedPermissions: [
      { module: 'supply', subModule: 'supply_purchase', actions: ['create', 'edit'], level: 'full', dataScope: { type: 'store' } },
    ],
    reason: '小区团购大米50袋，需从本地供应商采购',
    reasonType: 'group_purchase',
    validFrom: '2024-03-18 00:00:00',
    validTo: '2024-03-19 23:59:59',
    status: 'approved',
    approvedBy: 'user-hq-001',
    approvedAt: '2024-03-17 15:30:00',
    operationLogs: [
      { action: 'created', operatorId: 'user-003', operatorName: '李店长', operatedAt: '2024-03-17 14:00:00', details: '小区团购大米50袋，需从本地供应商采购' },
      { action: 'approved', operatorId: 'user-hq-001', operatorName: '张区域经理', operatedAt: '2024-03-17 15:30:00', details: '批准临时采购权限' },
    ],
    createdAt: '2024-03-17 14:00:00',
    updatedAt: '2024-03-17 15:30:00',
  },
  {
    id: 'tpr-003',
    requestNo: 'TPR20240316003',
    storeId: 'store-004',
    storeName: '海邻到家·幸福里店',
    storeType: 'franchise_b',
    applicantId: 'user-004',
    applicantName: '赵店长',
    requestedPermissions: [
      { module: 'products', subModule: 'product_price', actions: ['edit'], level: 'limited', dataScope: { type: 'store' }, restrictions: { priceRange: { min: 0.8, max: 1.0 } } },
    ],
    reason: '竞争对手促销，需要临时降价应对',
    reasonType: 'emergency',
    validFrom: '2024-03-16 18:00:00',
    validTo: '2024-03-16 22:00:00',
    status: 'rejected',
    rejectedBy: 'user-hq-002',
    rejectedAt: '2024-03-16 17:45:00',
    rejectReason: '不符合价格底线要求，建议通过其他营销方式应对',
    operationLogs: [
      { action: 'created', operatorId: 'user-004', operatorName: '赵店长', operatedAt: '2024-03-16 17:30:00', details: '竞争对手促销，需要临时降价应对' },
      { action: 'rejected', operatorId: 'user-hq-002', operatorName: '李运营总监', operatedAt: '2024-03-16 17:45:00', details: '不符合价格底线要求' },
    ],
    createdAt: '2024-03-16 17:30:00',
    updatedAt: '2024-03-16 17:45:00',
  },
];

export default function TemporaryPermissionPage() {
  const [requests, setRequests] = useState<TemporaryPermissionRequest[]>(mockRequests);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TemporaryPermissionRequest | null>(null);
  
  // 申请表单
  const [applyForm, setApplyForm] = useState({
    storeId: '',
    reasonType: '' as TemporaryPermissionRequest['reasonType'],
    reason: '',
    validFrom: '',
    validTo: '',
    permissions: [] as { module: FeatureModule; subModule: SubModule; actions: PermissionAction[] }[],
  });

  // 统计数据
  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    active: requests.filter(r => r.status === 'approved' && new Date(r.validTo) > new Date()).length,
  };

  // 过滤申请
  const filteredRequests = activeTab === 'pending' 
    ? requests.filter(r => r.status === 'pending')
    : requests;

  // 查看详情
  const handleViewDetail = (request: TemporaryPermissionRequest) => {
    setSelectedRequest(request);
    setShowDetailDialog(true);
  };

  // 审批通过
  const handleApprove = (requestId: string) => {
    setRequests(requests.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'approved' as const,
          approvedBy: 'current-user',
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          operationLogs: [
            ...r.operationLogs,
            {
              action: 'approved',
              operatorId: 'current-user',
              operatorName: '当前管理员',
              operatedAt: new Date().toISOString(),
              details: '审批通过',
            },
          ],
        };
      }
      return r;
    }));
  };

  // 审批驳回
  const handleReject = (requestId: string, reason: string) => {
    setRequests(requests.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'rejected' as const,
          rejectedBy: 'current-user',
          rejectedAt: new Date().toISOString(),
          rejectReason: reason,
          updatedAt: new Date().toISOString(),
          operationLogs: [
            ...r.operationLogs,
            {
              action: 'rejected',
              operatorId: 'current-user',
              operatorName: '当前管理员',
              operatedAt: new Date().toISOString(),
              details: reason,
            },
          ],
        };
      }
      return r;
    }));
  };

  // 取消申请
  const handleCancel = (requestId: string) => {
    setRequests(requests.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'cancelled' as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    }));
  };

  // 提交申请
  const submitApply = () => {
    const newRequest: TemporaryPermissionRequest = {
      id: `tpr-${Date.now()}`,
      requestNo: `TPR${new Date().toISOString().slice(0,10).replace(/-/g,'')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      storeId: applyForm.storeId,
      storeName: '选择门店',
      storeType: 'franchise_b',
      applicantId: 'current-user',
      applicantName: '当前用户',
      requestedPermissions: applyForm.permissions.map(p => ({
        ...p,
        level: 'limited' as const,
        dataScope: { type: 'store' as const },
      })),
      reason: applyForm.reason,
      reasonType: applyForm.reasonType,
      validFrom: applyForm.validFrom,
      validTo: applyForm.validTo,
      status: 'pending',
      operationLogs: [
        {
          action: 'created',
          operatorId: 'current-user',
          operatorName: '当前用户',
          operatedAt: new Date().toISOString(),
          details: applyForm.reason,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setRequests([newRequest, ...requests]);
    setShowApplyDialog(false);
    setApplyForm({
      storeId: '',
      reasonType: '' as TemporaryPermissionRequest['reasonType'],
      reason: '',
      validFrom: '',
      validTo: '',
      permissions: [],
    });
  };

  // 判断是否在有效期内
  const isValidNow = (request: TemporaryPermissionRequest) => {
    if (request.status !== 'approved') return false;
    const now = new Date();
    return new Date(request.validFrom) <= now && now <= new Date(request.validTo);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Key className="h-8 w-8 text-purple-600" />
            临时权限申请
          </h1>
          <p className="text-muted-foreground mt-1">
            针对特殊经营需求的临时权限申请通道，到期自动收回
          </p>
        </div>
        <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增申请
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>申请临时权限</DialogTitle>
              <DialogDescription>
                为门店申请临时权限，审批通过后在有效期内生效
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>申请门店</Label>
                  <Select value={applyForm.storeId} onValueChange={(v) => setApplyForm({ ...applyForm, storeId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择门店" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="store-001">海邻到家·阳光小区店</SelectItem>
                      <SelectItem value="store-002">海邻到家·翠苑小区店</SelectItem>
                      <SelectItem value="store-003">海邻到家·金色家园店</SelectItem>
                      <SelectItem value="store-004">海邻到家·幸福里店</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>申请原因类型</Label>
                  <Select value={applyForm.reasonType} onValueChange={(v) => setApplyForm({ ...applyForm, reasonType: v as TemporaryPermissionRequest['reasonType'] })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择原因类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="group_purchase">大型团购</SelectItem>
                      <SelectItem value="emergency">突发应急</SelectItem>
                      <SelectItem value="special_event">特殊活动</SelectItem>
                      <SelectItem value="other">其他原因</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>申请原因</Label>
                <Textarea
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  placeholder="详细描述申请原因和需求..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>生效时间</Label>
                  <Input
                    type="datetime-local"
                    value={applyForm.validFrom}
                    onChange={(e) => setApplyForm({ ...applyForm, validFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>失效时间</Label>
                  <Input
                    type="datetime-local"
                    value={applyForm.validTo}
                    onChange={(e) => setApplyForm({ ...applyForm, validTo: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>申请权限</Label>
                <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                  {Object.entries(MODULE_NAMES).map(([moduleKey, moduleName]) => (
                    <div key={moduleKey} className="space-y-2">
                      <div className="font-medium text-sm">{moduleName}</div>
                      <div className="grid grid-cols-3 gap-2 pl-4">
                        {Object.entries(SUB_MODULE_NAMES)
                          .filter(([subKey]) => subKey.startsWith(moduleKey.split('_')[0]))
                          .slice(0, 3)
                          .map(([subKey, subName]) => (
                            <div key={subKey} className="flex items-center gap-2">
                              <Checkbox
                                id={subKey}
                                checked={applyForm.permissions.some(p => p.subModule === subKey)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setApplyForm({
                                      ...applyForm,
                                      permissions: [...applyForm.permissions, {
                                        module: moduleKey as FeatureModule,
                                        subModule: subKey as SubModule,
                                        actions: ['view', 'create'] as PermissionAction[],
                                      }],
                                    });
                                  } else {
                                    setApplyForm({
                                      ...applyForm,
                                      permissions: applyForm.permissions.filter(p => p.subModule !== subKey),
                                    });
                                  }
                                }}
                              />
                              <label htmlFor={subKey} className="text-sm">{subName}</label>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
                取消
              </Button>
              <Button onClick={submitApply}>提交申请</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              待审批
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已通过
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已驳回
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              当前生效
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      {/* 标签切换 */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'pending' ? 'default' : 'outline'}
          onClick={() => setActiveTab('pending')}
        >
          待审批 ({stats.pending})
        </Button>
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveTab('all')}
        >
          全部记录
        </Button>
      </div>

      {/* 申请列表 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>申请编号</TableHead>
              <TableHead>门店名称</TableHead>
              <TableHead>申请原因</TableHead>
              <TableHead>申请权限</TableHead>
              <TableHead>有效期</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-mono text-sm">{request.requestNo}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    {request.storeName}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{REASON_TYPE_NAMES[request.reasonType]}</Badge>
                    <span className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {request.reason}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {request.requestedPermissions.slice(0, 2).map((p, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {SUB_MODULE_NAMES[p.subModule]}
                      </Badge>
                    ))}
                    {request.requestedPermissions.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{request.requestedPermissions.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{request.validFrom.slice(0, 10)}</div>
                    <div className="text-muted-foreground">{request.validFrom.slice(11, 16)} - {request.validTo.slice(11, 16)}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[request.status]}>
                    {STATUS_NAMES[request.status]}
                  </Badge>
                  {isValidNow(request) && (
                    <div className="text-xs text-green-600 mt-1">生效中</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetail(request)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {request.status === 'pending' && (
                      <>
                        <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleApprove(request.id)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleReject(request.id, '不符合申请条件')}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {request.status === 'approved' && isValidNow(request) && (
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleCancel(request.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>临时权限申请详情</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">申请编号</Label>
                  <p className="font-mono">{selectedRequest.requestNo}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">门店名称</Label>
                  <p>{selectedRequest.storeName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">申请人</Label>
                  <p>{selectedRequest.applicantName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">申请时间</Label>
                  <p>{selectedRequest.createdAt}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">原因类型</Label>
                  <p>{REASON_TYPE_NAMES[selectedRequest.reasonType]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">当前状态</Label>
                  <Badge className={STATUS_COLORS[selectedRequest.status]}>
                    {STATUS_NAMES[selectedRequest.status]}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">申请原因</Label>
                <p>{selectedRequest.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">生效时间</Label>
                  <p>{selectedRequest.validFrom}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">失效时间</Label>
                  <p>{selectedRequest.validTo}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">申请权限</Label>
                <div className="mt-2 space-y-2">
                  {selectedRequest.requestedPermissions.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm border rounded p-2">
                      <span className="font-medium">{MODULE_NAMES[p.module]}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{SUB_MODULE_NAMES[p.subModule]}</span>
                      <div className="flex gap-1 ml-auto">
                        {p.actions.map((a, j) => (
                          <Badge key={j} variant="outline" className="text-xs">{a}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRequest.rejectReason && (
                <div className="bg-red-50 p-3 rounded">
                  <Label className="text-red-600">驳回原因</Label>
                  <p className="text-red-700">{selectedRequest.rejectReason}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="text-muted-foreground">操作记录</Label>
                <div className="mt-2 space-y-2">
                  {selectedRequest.operationLogs.map((log, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-muted-foreground">{log.operatedAt}</span>
                      <span className="font-medium">{log.operatorName}</span>
                      <span>{log.action}</span>
                      {log.details && <span className="text-muted-foreground">({log.details})</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
