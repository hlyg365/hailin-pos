'use client';

import { useState, useEffect } from 'react';
import { useHqAuth } from '@/contexts/HqAuthContext';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ShoppingBag,
  Package,
  RefreshCw,
  Filter,
  Eye,
  ChevronRight,
  AlertCircle,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

// 审批进度计算（本地实现，避免服务端依赖）
const getApprovalProgress = (record: ApprovalRecord): number => {
  const totalSteps = record.flow_config?.approval_steps?.length || 1;
  if (totalSteps === 0) return 0;
  const currentStepIndex = record.flow_config?.approval_steps?.findIndex(
    (step: any) => step.step_order === record.current_step
  ) ?? 0;

  if (record.status === 'approved') return 100;
  if (record.status === 'rejected' || record.status === 'cancelled') {
    return Math.round(((currentStepIndex + 1) / totalSteps) * 100);
  }
  return Math.round((currentStepIndex / totalSteps) * 100);
};

// 权限检查（本地实现，避免服务端依赖）
const canUserApprove = (record: ApprovalRecord, userRole: string): boolean => {
  if (record.status !== 'pending') return false;
  const currentStepConfig = record.flow_config?.approval_steps?.find(
    (step: any) => step.step_order === record.current_step
  );
  return currentStepConfig?.role === userRole;
};

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
type FlowType = 'store_promotion' | 'hq_promotion' | 'store_purchase' | 'hq_purchase';

interface ApprovalRecord {
  id: string;
  request_id: string;
  request_type: 'promotion' | 'purchase';
  title: string;
  applicant_id: string;
  applicant_name: string;
  store_id?: string;
  store_name?: string;
  flow_type: FlowType;
  flow_config: any;
  current_step: number;
  status: ApprovalStatus;
  request_data: Record<string, any>;
  approval_history: Array<{
    step_order: number;
    step_name: string;
    approver_id: string;
    approver_name: string;
    action: 'approved' | 'rejected' | 'cancelled';
    comment?: string;
    timestamp: string;
  }>;
  approver_id?: string;
  approver_name?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export default function ApprovalCenterPage() {
  const { user } = useHqAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [records, setRecords] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ApprovalRecord | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 获取审批记录
  const fetchRecords = async (status: ApprovalStatus | 'all' = 'all') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        role: user?.role || '',
        status: status === 'all' ? 'all' : status,
      });

      if (filterType !== 'all') {
        params.append('flowType', filterType);
      }

      const response = await fetch(`/api/approvals?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        // 过滤出当前用户可以审批的记录
        const filtered = result.data.filter((record: ApprovalRecord) =>
          canUserApprove(record, user?.role || '')
        );
        setRecords(filtered);
      } else {
        toast.error(result.error || '获取审批记录失败');
      }
    } catch (error) {
      console.error('获取审批记录失败:', error);
      toast.error('获取审批记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchRecords('pending');
  }, [user?.role, filterType]);

  // 切换标签页
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const status: ApprovalStatus | 'all' = tab === 'all' ? 'all' : tab as ApprovalStatus;
    fetchRecords(status);
  };

  // 审批操作
  const handleApprove = async (action: 'approved' | 'rejected') => {
    if (!selectedRecord || !user) return;

    try {
      const response = await fetch(`/api/approvals/${selectedRecord.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          approverId: user.id,
          approverName: user.name,
          comment: action === 'rejected' ? comment : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || '操作成功');
        setApproveDialogOpen(false);
        setComment('');
        setSelectedRecord(null);
        fetchRecords(activeTab === 'all' ? 'all' : activeTab as ApprovalStatus);
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (error) {
      console.error('审批操作失败:', error);
      toast.error('审批操作失败');
    }
  };

  // 获取状态图标和样式
  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" />
            待审批
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            已通过
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            已拒绝
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline">
            <XCircle className="h-3 w-3 mr-1" />
            已取消
          </Badge>
        );
      default:
        return null;
    }
  };

  // 获取申请类型图标
  const getRequestIcon = (type: string) => {
    switch (type) {
      case 'promotion':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'purchase':
        return <Package className="h-5 w-5 text-blue-500" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // 获取流程类型标签
  const getFlowTypeLabel = (flowType: string) => {
    switch (flowType) {
      case 'store_promotion':
        return '店铺促销';
      case 'hq_promotion':
        return '总部促销';
      case 'store_purchase':
        return '店铺采购';
      case 'hq_purchase':
        return '总部采购';
      default:
        return flowType;
    }
  };

  // 过滤记录
  const filteredRecords = records.filter(record =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.applicant_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">审批中心</h1>
          <p className="text-gray-500">管理和处理各类审批申请</p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchRecords(activeTab === 'all' ? 'all' : activeTab as ApprovalStatus)}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="搜索申请..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="store_promotion">店铺促销</SelectItem>
                <SelectItem value="hq_promotion">总部促销</SelectItem>
                <SelectItem value="store_purchase">店铺采购</SelectItem>
                <SelectItem value="hq_purchase">总部采购</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            待审批
            {records.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {records.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">已通过</TabsTrigger>
          <TabsTrigger value="rejected">已拒绝</TabsTrigger>
          <TabsTrigger value="all">全部记录</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 mx-auto animate-spin text-gray-400 mb-4" />
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">暂无审批记录</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRecords.map((record) => (
                <Card key={record.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getRequestIcon(record.request_type)}
                        <div className="flex-1">
                          <CardTitle className="text-lg">{record.title}</CardTitle>
                          <CardDescription className="mt-1">
                            <div className="flex items-center gap-4">
                              <span>{getFlowTypeLabel(record.flow_type)}</span>
                              <span>•</span>
                              <span>申请人: {record.applicant_name}</span>
                              {record.store_name && (
                                <>
                                  <span>•</span>
                                  <span>{record.store_name}</span>
                                </>
                              )}
                            </div>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(record.status)}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedRecord(record);
                            setApproveDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* 审批进度 */}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>审批进度:</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${getApprovalProgress(record)}%` }}
                          />
                        </div>
                        <span>{getApprovalProgress(record)}%</span>
                      </div>

                      {/* 时间信息 */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>创建时间: {new Date(record.created_at).toLocaleString('zh-CN')}</span>
                        {record.completed_at && (
                          <span>
                            完成时间: {new Date(record.completed_at).toLocaleString('zh-CN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 审批详情弹窗 */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>审批详情</DialogTitle>
            <DialogDescription>查看申请详情并处理审批</DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  基本信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">申请标题:</span>
                    <p className="font-medium mt-1">{selectedRecord.title}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">申请类型:</span>
                    <p className="font-medium mt-1">{getFlowTypeLabel(selectedRecord.flow_type)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">申请人:</span>
                    <p className="font-medium mt-1">{selectedRecord.applicant_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">创建时间:</span>
                    <p className="font-medium mt-1">
                      {new Date(selectedRecord.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 申请内容 */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  申请内容
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(selectedRecord.request_data, null, 2)}
                  </pre>
                </div>
              </div>

              {/* 审批历史 */}
              {selectedRecord.approval_history.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    审批历史
                  </h3>
                  <div className="space-y-2">
                    {selectedRecord.approval_history.map((history, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {history.approver_name?.charAt(0) || '审'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{history.approver_name}</span>
                            <Badge
                              variant={history.action === 'approved' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {history.action === 'approved' ? '通过' : '拒绝'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{history.step_name}</p>
                          {history.comment && (
                            <p className="text-sm mt-2 bg-white p-2 rounded border">
                              {history.comment}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(history.timestamp).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 审批操作 */}
              {selectedRecord.status === 'pending' && canUserApprove(selectedRecord, user?.role || '') && (
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    审批操作
                  </h3>
                  {comment ? (
                    <div>
                      <Label>审批意见（拒绝时必填）</Label>
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="请输入审批意见..."
                        rows={3}
                      />
                    </div>
                  ) : null}

                  <DialogFooter className="gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (!comment.trim()) {
                          toast.error('拒绝时必须填写审批意见');
                          return;
                        }
                        handleApprove('rejected');
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      拒绝
                    </Button>
                    <Button
                      onClick={() => handleApprove('approved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      通过
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
