'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Ticket,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  Store,
  RefreshCw,
  Eye,
  Gift,
  Percent,
  DollarSign,
  Users,
  QrCode,
  Scan,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// 类型定义
type CouponType = 'discount' | 'full_reduction' | 'cash';
type UseChannel = 'mini_program' | 'offline_store' | 'both';
type VerificationStatus = 'unused' | 'used' | 'expired' | 'refunded';

interface CouponTemplate {
  id: string;
  name: string;
  type: CouponType;
  description: string;
  discountRate?: number;
  fullAmount?: number;
  reduceAmount?: number;
  cashAmount?: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  useChannel: UseChannel;
  validDays: number;
  totalQuantity: number;
  issuedQuantity: number;
  limitPerUser: number;
  pointsRequired: number;
  status: 'active' | 'inactive' | 'expired';
  createTime: string;
  updateTime: string;
}

interface UserCoupon {
  id: string;
  templateId: string;
  templateName: string;
  couponCode: string;
  verificationCode: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  type: CouponType;
  discountRate?: number;
  fullAmount?: number;
  reduceAmount?: number;
  cashAmount?: number;
  minOrderAmount: number;
  useChannel: UseChannel;
  validStartTime: string;
  validEndTime: string;
  status: VerificationStatus;
  verificationTime?: string;
  verificationChannel?: 'mini_program' | 'offline_store';
  verificationStoreName?: string;
  orderId?: string;
  source: string;
  createTime: string;
}

// 优惠券类型配置
const couponTypeConfig: Record<CouponType, { label: string; color: string; icon: any }> = {
  full_reduction: { label: '满减券', color: 'bg-orange-100 text-orange-700', icon: Gift },
  discount: { label: '折扣券', color: 'bg-blue-100 text-blue-700', icon: Percent },
  cash: { label: '代金券', color: 'bg-green-100 text-green-700', icon: DollarSign },
};

// 使用渠道配置
const useChannelConfig: Record<UseChannel, { label: string; color: string; icon: any }> = {
  both: { label: '通用', color: 'bg-purple-100 text-purple-700', icon: Ticket },
  mini_program: { label: '小程序', color: 'bg-green-100 text-green-700', icon: Smartphone },
  offline_store: { label: '线下门店', color: 'bg-blue-100 text-blue-700', icon: Store },
};

// 优惠券状态配置
const couponStatusConfig: Record<VerificationStatus, { label: string; color: string }> = {
  unused: { label: '未使用', color: 'bg-green-500' },
  used: { label: '已使用', color: 'bg-gray-500' },
  expired: { label: '已过期', color: 'bg-red-500' },
  refunded: { label: '已退款', color: 'bg-yellow-500' },
};

export default function CouponManagementPage() {
  // 状态
  const [templates, setTemplates] = useState<CouponTemplate[]>([]);
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(false);

  // 对话框状态
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CouponTemplate | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null);

  // 表单状态
  const [templateForm, setTemplateForm] = useState<Partial<CouponTemplate>>({
    name: '',
    type: 'full_reduction',
    description: '',
    fullAmount: 50,
    reduceAmount: 10,
    minOrderAmount: 50,
    useChannel: 'both',
    validDays: 30,
    totalQuantity: 100,
    limitPerUser: 5,
    pointsRequired: 200,
    status: 'active',
  });

  // 核销表单状态
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyChannel, setVerifyChannel] = useState<'mini_program' | 'offline_store'>('offline_store');
  const [verifyOrderId, setVerifyOrderId] = useState('');
  const [verifyOrderAmount, setVerifyOrderAmount] = useState('');
  const [verifyPreview, setVerifyPreview] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('');

  // 加载数据
  useEffect(() => {
    fetchTemplates();
    fetchUserCoupons();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/coupon/templates');
      const result = await response.json();
      if (result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('加载优惠券模板失败:', error);
    }
  };

  const fetchUserCoupons = async () => {
    try {
      const response = await fetch('/api/coupon/user?all=true');
      const result = await response.json();
      if (result.success) {
        setUserCoupons(result.data);
      }
    } catch (error) {
      console.error('加载用户优惠券失败:', error);
    }
  };

  // 打开创建/编辑模板对话框
  const handleOpenTemplateDialog = (template?: CouponTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      setTemplateForm({ ...template });
    } else {
      setSelectedTemplate(null);
      setTemplateForm({
        name: '',
        type: 'full_reduction',
        description: '',
        fullAmount: 50,
        reduceAmount: 10,
        minOrderAmount: 50,
        useChannel: 'both',
        validDays: 30,
        totalQuantity: 100,
        limitPerUser: 5,
        pointsRequired: 200,
        status: 'active',
      });
    }
    setTemplateDialogOpen(true);
  };

  // 保存模板
  const handleSaveTemplate = async () => {
    if (!templateForm.name) {
      toast.error('请输入优惠券名称');
      return;
    }

    try {
      const url = '/api/coupon/templates';
      const method = selectedTemplate ? 'PUT' : 'POST';
      const body = selectedTemplate
        ? { id: selectedTemplate.id, ...templateForm }
        : templateForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(selectedTemplate ? '优惠券更新成功' : '优惠券创建成功');
        setTemplateDialogOpen(false);
        fetchTemplates();
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 查询优惠券信息
  const handleQueryCoupon = async () => {
    if (!verifyCode) {
      toast.error('请输入优惠券码或核销码');
      return;
    }

    try {
      const response = await fetch('/api/coupon/verify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode }),
      });

      const result = await response.json();
      if (result.success) {
        setVerifyPreview(result.data);
      } else {
        toast.error(result.error || '查询失败');
        setVerifyPreview(null);
      }
    } catch (error) {
      toast.error('查询失败');
    }
  };

  // 核销优惠券
  const handleVerifyCoupon = async () => {
    if (!verifyPreview) {
      toast.error('请先查询优惠券');
      return;
    }
    if (!verifyOrderId || !verifyOrderAmount) {
      toast.error('请填写订单信息');
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch('/api/coupon/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: verifyCode,
          channel: verifyChannel,
          orderId: verifyOrderId,
          orderAmount: parseFloat(verifyOrderAmount),
          storeId: 'store_001',
          storeName: '海邻到家总店',
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`核销成功！优惠金额：¥${result.discountAmount.toFixed(2)}`);
        setVerifyDialogOpen(false);
        setVerifyCode('');
        setVerifyPreview(null);
        setVerifyOrderId('');
        setVerifyOrderAmount('');
        fetchUserCoupons();
      } else {
        toast.error(result.error || '核销失败');
      }
    } catch (error) {
      toast.error('核销失败');
    } finally {
      setVerifying(false);
    }
  };

  // 过滤优惠券
  const filteredUserCoupons = userCoupons.filter(c =>
    c.couponCode.includes(searchQuery) ||
    c.verificationCode.includes(searchQuery) ||
    c.memberName.includes(searchQuery) ||
    c.memberPhone.includes(searchQuery)
  );

  // 统计
  const stats = {
    totalTemplates: templates.filter(t => t.status === 'active').length,
    totalIssued: templates.reduce((sum, t) => sum + t.issuedQuantity, 0),
    unusedCoupons: userCoupons.filter(c => c.status === 'unused').length,
    usedCoupons: userCoupons.filter(c => c.status === 'used').length,
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="优惠券管理" description="管理优惠券模板、发放和核销">
        <Button variant="outline" onClick={() => setVerifyDialogOpen(true)}>
          <Scan className="h-4 w-4 mr-2" />
          核销优惠券
        </Button>
        <Button onClick={() => handleOpenTemplateDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          创建优惠券
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Ticket className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalTemplates}</p>
                    <p className="text-sm text-muted-foreground">优惠券模板</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Gift className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalIssued}</p>
                    <p className="text-sm text-muted-foreground">已发放</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.unusedCoupons}</p>
                    <p className="text-sm text-muted-foreground">未使用</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <RefreshCw className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.usedCoupons}</p>
                    <p className="text-sm text-muted-foreground">已核销</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="templates" className="space-y-4">
            <TabsList>
              <TabsTrigger value="templates">优惠券模板</TabsTrigger>
              <TabsTrigger value="coupons">用户优惠券</TabsTrigger>
              <TabsTrigger value="records">核销记录</TabsTrigger>
            </TabsList>

            {/* 优惠券模板 */}
            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>优惠券模板</CardTitle>
                    <Button size="sm" onClick={() => handleOpenTemplateDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      新建模板
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>优惠券名称</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>优惠内容</TableHead>
                        <TableHead>使用渠道</TableHead>
                        <TableHead>所需积分</TableHead>
                        <TableHead>发放/总量</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((template) => {
                        const typeConfig = couponTypeConfig[template.type];
                        const channelConfig = useChannelConfig[template.useChannel];
                        const TypeIcon = typeConfig.icon;
                        const ChannelIcon = channelConfig.icon;

                        return (
                          <TableRow key={template.id}>
                            <TableCell className="font-medium">{template.name}</TableCell>
                            <TableCell>
                              <Badge className={typeConfig.color}>
                                <TypeIcon className="h-3 w-3 mr-1" />
                                {typeConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {template.type === 'full_reduction' && `满${template.fullAmount}减${template.reduceAmount}`}
                              {template.type === 'discount' && `${(template.discountRate || 0) * 10}折`}
                              {template.type === 'cash' && `无门槛${template.cashAmount}元`}
                            </TableCell>
                            <TableCell>
                              <Badge className={channelConfig.color}>
                                <ChannelIcon className="h-3 w-3 mr-1" />
                                {channelConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>{template.pointsRequired}</TableCell>
                            <TableCell>{template.issuedQuantity}/{template.totalQuantity}</TableCell>
                            <TableCell>
                              <Badge className={template.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                                {template.status === 'active' ? '启用' : '禁用'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => handleOpenTemplateDialog(template)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 用户优惠券 */}
            <TabsContent value="coupons" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>用户优惠券</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="搜索优惠券码/会员..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>优惠券码</TableHead>
                        <TableHead>核销码</TableHead>
                        <TableHead>优惠券</TableHead>
                        <TableHead>会员</TableHead>
                        <TableHead>使用渠道</TableHead>
                        <TableHead>有效期</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>核销信息</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUserCoupons.map((coupon) => {
                        const channelConfig = useChannelConfig[coupon.useChannel];
                        const statusConfig = couponStatusConfig[coupon.status];
                        const ChannelIcon = channelConfig.icon;

                        return (
                          <TableRow key={coupon.id}>
                            <TableCell className="font-mono text-sm">{coupon.couponCode}</TableCell>
                            <TableCell className="font-mono font-bold text-blue-600">{coupon.verificationCode}</TableCell>
                            <TableCell>{coupon.templateName}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{coupon.memberName}</div>
                                <div className="text-xs text-muted-foreground">{coupon.memberPhone}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={channelConfig.color}>
                                <ChannelIcon className="h-3 w-3 mr-1" />
                                {channelConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{coupon.validStartTime}</div>
                                <div className="text-muted-foreground">至 {coupon.validEndTime}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                            </TableCell>
                            <TableCell>
                              {coupon.status === 'used' && (
                                <div className="text-sm">
                                  <div>{coupon.verificationTime}</div>
                                  <div className="text-muted-foreground">
                                    {coupon.verificationChannel === 'mini_program' ? '小程序' : coupon.verificationStoreName}
                                  </div>
                                </div>
                              )}
                              {coupon.status === 'unused' && (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 核销记录 */}
            <TabsContent value="records" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>核销记录</CardTitle>
                  <CardDescription>查看优惠券核销历史</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>核销时间</TableHead>
                        <TableHead>优惠券</TableHead>
                        <TableHead>会员</TableHead>
                        <TableHead>核销渠道</TableHead>
                        <TableHead>订单号</TableHead>
                        <TableHead>优惠金额</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userCoupons
                        .filter(c => c.status === 'used')
                        .map((coupon) => (
                          <TableRow key={coupon.id}>
                            <TableCell>{coupon.verificationTime}</TableCell>
                            <TableCell>{coupon.templateName}</TableCell>
                            <TableCell>{coupon.memberName}</TableCell>
                            <TableCell>
                              <Badge variant={coupon.verificationChannel === 'mini_program' ? 'default' : 'secondary'}>
                                {coupon.verificationChannel === 'mini_program' ? '小程序' : '线下门店'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">{coupon.orderId}</TableCell>
                            <TableCell className="text-red-600 font-medium">
                              {coupon.type === 'full_reduction' && `-¥${coupon.reduceAmount}`}
                              {coupon.type === 'discount' && `${(coupon.discountRate || 0) * 10}折`}
                              {coupon.type === 'cash' && `-¥${coupon.cashAmount}`}
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

      {/* 创建/编辑优惠券模板对话框 */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-orange-500" />
              {selectedTemplate ? '编辑优惠券' : '创建优惠券'}
            </DialogTitle>
            <DialogDescription>
              填写优惠券信息，设置使用渠道和优惠规则
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">基本信息</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>优惠券名称 *</Label>
                  <Input
                    placeholder="如：满50减10优惠券"
                    value={templateForm.name || ''}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>优惠券类型 *</Label>
                  <Select
                    value={templateForm.type}
                    onValueChange={(v) => setTemplateForm({ ...templateForm, type: v as CouponType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_reduction">满减券</SelectItem>
                      <SelectItem value="discount">折扣券</SelectItem>
                      <SelectItem value="cash">代金券</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>优惠券描述</Label>
                <Textarea
                  placeholder="优惠券使用说明..."
                  value={templateForm.description || ''}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                />
              </div>
            </div>

            {/* 优惠规则 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">优惠规则</h4>
              
              {templateForm.type === 'full_reduction' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>满X元</Label>
                    <Input
                      type="number"
                      placeholder="50"
                      value={templateForm.fullAmount || ''}
                      onChange={(e) => setTemplateForm({ ...templateForm, fullAmount: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>减Y元</Label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={templateForm.reduceAmount || ''}
                      onChange={(e) => setTemplateForm({ ...templateForm, reduceAmount: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              {templateForm.type === 'discount' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>折扣率 (0.1-1)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0.8"
                      value={templateForm.discountRate || ''}
                      onChange={(e) => setTemplateForm({ ...templateForm, discountRate: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>最大优惠金额</Label>
                    <Input
                      type="number"
                      placeholder="不限"
                      value={templateForm.maxDiscountAmount || ''}
                      onChange={(e) => setTemplateForm({ ...templateForm, maxDiscountAmount: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              {templateForm.type === 'cash' && (
                <div className="space-y-2">
                  <Label>代金金额</Label>
                  <Input
                    type="number"
                    placeholder="5"
                    value={templateForm.cashAmount || ''}
                    onChange={(e) => setTemplateForm({ ...templateForm, cashAmount: parseFloat(e.target.value) })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>最低订单金额</Label>
                <Input
                  type="number"
                  placeholder="0 表示无门槛"
                  value={templateForm.minOrderAmount || 0}
                  onChange={(e) => setTemplateForm({ ...templateForm, minOrderAmount: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            {/* 使用渠道 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">使用渠道</h4>
              <div className="space-y-2">
                <Label>可用渠道 *</Label>
                <Select
                  value={templateForm.useChannel}
                  onValueChange={(v) => setTemplateForm({ ...templateForm, useChannel: v as UseChannel })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">通用（小程序+线下门店）</SelectItem>
                    <SelectItem value="mini_program">仅小程序</SelectItem>
                    <SelectItem value="offline_store">仅线下门店</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  选择"通用"可在小程序和线下门店同时使用
                </p>
              </div>
            </div>

            {/* 发放设置 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">发放设置</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>总发放量</Label>
                  <Input
                    type="number"
                    value={templateForm.totalQuantity || 100}
                    onChange={(e) => setTemplateForm({ ...templateForm, totalQuantity: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>每人限领</Label>
                  <Input
                    type="number"
                    value={templateForm.limitPerUser || 1}
                    onChange={(e) => setTemplateForm({ ...templateForm, limitPerUser: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>兑换积分</Label>
                  <Input
                    type="number"
                    value={templateForm.pointsRequired || 100}
                    onChange={(e) => setTemplateForm({ ...templateForm, pointsRequired: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>有效天数</Label>
                  <Input
                    type="number"
                    value={templateForm.validDays || 30}
                    onChange={(e) => setTemplateForm({ ...templateForm, validDays: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>状态</Label>
                  <Select
                    value={templateForm.status}
                    onValueChange={(v) => setTemplateForm({ ...templateForm, status: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">启用</SelectItem>
                      <SelectItem value="inactive">禁用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveTemplate}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 核销优惠券对话框 */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-blue-500" />
              核销优惠券
            </DialogTitle>
            <DialogDescription>
              输入优惠券码或核销码进行核销
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>优惠券码/核销码 *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="输入优惠券码或核销码"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                <Button onClick={handleQueryCoupon}>查询</Button>
              </div>
            </div>

            {verifyPreview && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{verifyPreview.templateName}</span>
                  <Badge className={couponStatusConfig[verifyPreview.status as VerificationStatus].color}>
                    {couponStatusConfig[verifyPreview.status as VerificationStatus].label}
                  </Badge>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">会员</span>
                    <span>{verifyPreview.memberName} ({verifyPreview.memberPhone})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">使用渠道</span>
                    <Badge className={useChannelConfig[verifyPreview.useChannel as UseChannel].color}>
                      {useChannelConfig[verifyPreview.useChannel as UseChannel].label}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">有效期</span>
                    <span>{verifyPreview.validEndTime}</span>
                  </div>
                </div>

                {verifyPreview.status === 'unused' && (
                  <>
                    <div className="pt-2 border-t space-y-2">
                      <div className="space-y-2">
                        <Label>核销渠道</Label>
                        <Select
                          value={verifyChannel}
                          onValueChange={(v) => setVerifyChannel(v as any)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="offline_store">线下门店</SelectItem>
                            <SelectItem value="mini_program">小程序</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>订单号</Label>
                        <Input
                          placeholder="输入订单号"
                          value={verifyOrderId}
                          onChange={(e) => setVerifyOrderId(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>订单金额</Label>
                        <Input
                          type="number"
                          placeholder="输入订单金额"
                          value={verifyOrderAmount}
                          onChange={(e) => setVerifyOrderAmount(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {verifyPreview.status !== 'unused' && (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    该优惠券不可使用
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
              取消
            </Button>
            {verifyPreview && verifyPreview.status === 'unused' && (
              <Button onClick={handleVerifyCoupon} disabled={verifying}>
                {verifying ? '核销中...' : '确认核销'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
