'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
  QrCode,
  Banknote,
  FileText,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Edit,
  GripVertical,
  RefreshCw,
  Building2,
  Settings2,
  Shield,
  AlertCircle,
} from 'lucide-react';

interface SubPaymentMethod {
  id: string;
  payment_config_id: string;
  method_id: string;
  name: string;
  icon: string;
  enabled: boolean;
  merchant_id?: string;
  api_key?: string;
  callback_url?: string;
  is_headquarters_account: boolean;
  account_info?: any;
}

interface PaymentConfig {
  id: string;
  category: string;
  name: string;
  icon: string;
  enabled: boolean;
  priority: number;
  is_headquarters_account: boolean;
  account_info?: any;
  subMethods: SubPaymentMethod[];
}

const iconMap: Record<string, any> = {
  QrCode,
  Banknote,
  FileText,
  MoreHorizontal,
};

export default function PaymentConfigPage() {
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [addSubDialogOpen, setAddSubDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<PaymentConfig | null>(null);
  const [selectedSubMethod, setSelectedSubMethod] = useState<SubPaymentMethod | null>(null);
  const [formData, setFormData] = useState<{ name: string; icon: string }>({ name: '', icon: '' });
  const [accountFormData, setAccountFormData] = useState({
    merchant_id: '',
    api_key: '',
    callback_url: '',
    is_headquarters_account: true,
  });
  const [saving, setSaving] = useState(false);

  // 加载支付配置
  const loadPaymentConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/payment/');
      const result = await response.json();
      if (result.success) {
        setPaymentConfigs(result.data);
      }
    } catch (error) {
      console.error('加载支付配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentConfigs();
  }, []);

  // 切换主支付方式启用状态
  const toggleMainPayment = async (configId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/settings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleMain', configId, data: { enabled: !enabled } }),
      });
      const result = await response.json();
      if (result.success) {
        setPaymentConfigs(result.data);
      }
    } catch (error) {
      console.error('切换支付方式失败:', error);
    }
  };

  // 切换子支付方式启用状态
  const toggleSubPayment = async (configId: string, subMethodId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/settings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleSub', configId, subMethodId, data: { enabled: !enabled } }),
      });
      const result = await response.json();
      if (result.success) {
        setPaymentConfigs(result.data);
      }
    } catch (error) {
      console.error('切换子支付方式失败:', error);
    }
  };

  // 打开编辑子支付方式对话框
  const openEditDialog = (config: PaymentConfig, subMethod: SubPaymentMethod) => {
    setSelectedConfig(config);
    setSelectedSubMethod(subMethod);
    setFormData({ name: subMethod.name, icon: subMethod.icon });
    setEditDialogOpen(true);
  };

  // 打开账户配置对话框
  const openAccountDialog = (config: PaymentConfig, subMethod: SubPaymentMethod) => {
    setSelectedConfig(config);
    setSelectedSubMethod(subMethod);
    setAccountFormData({
      merchant_id: subMethod.merchant_id || '',
      api_key: subMethod.api_key || '',
      callback_url: subMethod.callback_url || '',
      is_headquarters_account: subMethod.is_headquarters_account,
    });
    setAccountDialogOpen(true);
  };

  // 打开添加子支付方式对话框
  const openAddDialog = (config: PaymentConfig) => {
    setSelectedConfig(config);
    setFormData({ name: '', icon: '💳' });
    setAddSubDialogOpen(true);
  };

  // 更新子支付方式
  const updateSubMethod = async () => {
    if (!selectedConfig || !selectedSubMethod) return;
    try {
      setSaving(true);
      const response = await fetch('/api/settings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSub',
          configId: selectedConfig.id,
          subMethodId: selectedSubMethod.id,
          data: formData,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setPaymentConfigs(result.data);
        setEditDialogOpen(false);
      }
    } catch (error) {
      console.error('更新子支付方式失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 保存账户配置
  const saveAccountConfig = async () => {
    if (!selectedConfig || !selectedSubMethod) return;
    try {
      setSaving(true);
      const response = await fetch('/api/settings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSubAccount',
          configId: selectedConfig.id,
          subMethodId: selectedSubMethod.id,
          data: accountFormData,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setPaymentConfigs(result.data);
        setAccountDialogOpen(false);
      }
    } catch (error) {
      console.error('保存账户配置失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 添加子支付方式
  const addSubMethod = async () => {
    if (!selectedConfig) return;
    try {
      setSaving(true);
      const response = await fetch('/api/settings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addSub',
          configId: selectedConfig.id,
          data: formData,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setPaymentConfigs(result.data);
        setAddSubDialogOpen(false);
      }
    } catch (error) {
      console.error('添加子支付方式失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 删除子支付方式
  const deleteSubMethod = async (configId: string, subMethodId: string) => {
    if (!confirm('确定要删除这个支付方式吗？')) return;
    try {
      const response = await fetch('/api/settings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteSub', configId, subMethodId }),
      });
      const result = await response.json();
      if (result.success) {
        setPaymentConfigs(result.data);
      }
    } catch (error) {
      console.error('删除子支付方式失败:', error);
    }
  };

  // 获取主支付方式图标
  const getMainIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || MoreHorizontal;
    return <Icon className="h-6 w-6" />;
  };

  const enabledCount = paymentConfigs.filter((c) => c.enabled).length;
  const totalSubCount = paymentConfigs.reduce((sum, c) => sum + c.subMethods.filter((s) => s.enabled).length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="支付方式配置" description="配置收银台显示的支付方式，设置收款账户">
        <Button variant="outline" onClick={loadPaymentConfigs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 重要提示 */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">资金归集说明</p>
                  <p className="mt-1">
                    除现金收款外，其他支付方式默认收款到总部账户。各店铺现金收入留在店铺账户，其他收入每日自动归集到总部账户。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{paymentConfigs.length}</p>
                  <p className="text-sm text-muted-foreground">主支付方式</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{enabledCount}</p>
                  <p className="text-sm text-muted-foreground">已启用</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{totalSubCount}</p>
                  <p className="text-sm text-muted-foreground">子支付方式</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 支付方式配置 */}
          {paymentConfigs.map((config) => (
            <Card key={config.id} className={!config.enabled ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.enabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <div className={config.enabled ? 'text-blue-600' : 'text-gray-400'}>
                        {getMainIcon(config.icon)}
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {config.name}
                        <Badge variant="outline" className="text-xs">
                          优先级 {config.priority}
                        </Badge>
                        {config.category !== 'cash' && config.is_headquarters_account && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                            <Building2 className="h-3 w-3 mr-1" />
                            总部账户
                          </Badge>
                        )}
                        {config.category === 'cash' && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            店铺账户
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {config.subMethods.filter((s) => s.enabled).length}/{config.subMethods.length} 个子支付方式已启用
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={() => toggleMainPayment(config.id, config.enabled)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {config.enabled ? '已启用' : '已禁用'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">子支付方式</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAddDialog(config)}
                      disabled={!config.enabled}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      添加
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {config.subMethods.map((subMethod) => (
                      <div
                        key={subMethod.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          subMethod.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{subMethod.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${subMethod.enabled ? '' : 'text-gray-400'}`}>
                                {subMethod.name}
                              </span>
                              {subMethod.is_headquarters_account ? (
                                <Badge variant="outline" className="text-[10px] h-5 bg-purple-50 text-purple-600 border-purple-200">
                                  <Building2 className="h-2.5 w-2.5 mr-0.5" />
                                  总部
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] h-5 bg-green-50 text-green-600 border-green-200">
                                  店铺
                                </Badge>
                              )}
                            </div>
                            {subMethod.merchant_id && (
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                商户号: {subMethod.merchant_id.substring(0, 8)}...
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="账户配置"
                            onClick={() => openAccountDialog(config, subMethod)}
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditDialog(config, subMethod)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Switch
                            checked={subMethod.enabled}
                            onCheckedChange={() => toggleSubPayment(config.id, subMethod.id, subMethod.enabled)}
                            className="data-[state=checked]:bg-green-500"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-700"
                            onClick={() => deleteSubMethod(config.id, subMethod.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* 说明 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm text-blue-700">
                <p className="font-medium">配置说明：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>启用/禁用主支付方式会控制收银台是否显示该支付分类</li>
                  <li>启用/禁用子支付方式会控制收银台是否显示具体支付选项</li>
                  <li>点击设置图标可配置商户号、API密钥等账户信息</li>
                  <li><strong>现金收款</strong>默认收款到店铺账户，其他支付方式默认收款到总部账户</li>
                  <li>配置修改后会立即同步到所有店铺收银台</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 编辑子支付方式对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>编辑支付方式</DialogTitle>
            <DialogDescription>修改子支付方式的名称和图标</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">支付方式名称</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：微信支付"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-icon">图标</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="如：💚"
                  className="w-20"
                />
                <div className="flex gap-1 flex-wrap">
                  {['💚', '💙', '🔴', '💵', '🎫', '💳', '📝', '⭐', '💰', '🏦'].map((emoji) => (
                    <Button
                      key={emoji}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={updateSubMethod} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 账户配置对话框 */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              账户配置 - {selectedSubMethod?.name}
            </DialogTitle>
            <DialogDescription>
              配置支付商户信息和收款账户
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 收款账户选择 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                收款账户
              </Label>
              <Select
                value={accountFormData.is_headquarters_account ? 'headquarters' : 'store'}
                onValueChange={(value) => setAccountFormData({
                  ...accountFormData,
                  is_headquarters_account: value === 'headquarters'
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="headquarters">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-purple-600" />
                      总部账户（资金自动归集）
                    </div>
                  </SelectItem>
                  <SelectItem value="store">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-green-600" />
                      店铺账户（资金留在店铺）
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {accountFormData.is_headquarters_account
                  ? '收款将直接进入总部账户，各店铺销售额每日汇总'
                  : '收款将留在店铺账户，适用于现金等场景'}
              </p>
            </div>

            <Separator />

            {/* 商户号 */}
            <div className="space-y-2">
              <Label htmlFor="merchant-id">商户号</Label>
              <Input
                id="merchant-id"
                value={accountFormData.merchant_id}
                onChange={(e) => setAccountFormData({ ...accountFormData, merchant_id: e.target.value })}
                placeholder="请输入商户号"
              />
            </div>

            {/* API密钥 */}
            <div className="space-y-2">
              <Label htmlFor="api-key">API密钥</Label>
              <Input
                id="api-key"
                type="password"
                value={accountFormData.api_key}
                onChange={(e) => setAccountFormData({ ...accountFormData, api_key: e.target.value })}
                placeholder="请输入API密钥（安全存储）"
              />
              <p className="text-xs text-gray-500">
                密钥将加密存储，仅用于发起支付请求
              </p>
            </div>

            {/* 回调地址 */}
            <div className="space-y-2">
              <Label htmlFor="callback-url">回调地址</Label>
              <Input
                id="callback-url"
                value={accountFormData.callback_url}
                onChange={(e) => setAccountFormData({ ...accountFormData, callback_url: e.target.value })}
                placeholder="支付结果回调地址（可选）"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={saveAccountConfig} disabled={saving}>
              {saving ? '保存中...' : '保存配置'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加子支付方式对话框 */}
      <Dialog open={addSubDialogOpen} onOpenChange={setAddSubDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>添加支付方式</DialogTitle>
            <DialogDescription>为 {selectedConfig?.name} 添加新的子支付方式</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">支付方式名称</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：微信支付"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-icon">图标</Label>
              <div className="flex gap-2">
                <Input
                  id="add-icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="如：💚"
                  className="w-20"
                />
                <div className="flex gap-1 flex-wrap">
                  {['💚', '💙', '🔴', '💵', '🎫', '💳', '📝', '⭐', '💰', '🏦'].map((emoji) => (
                    <Button
                      key={emoji}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSubDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={addSubMethod} disabled={saving}>
              {saving ? '添加中...' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
