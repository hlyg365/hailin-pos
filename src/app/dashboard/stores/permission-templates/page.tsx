'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  Shield,
  Settings,
  Check,
  X,
  Eye,
  EyeOff,
  Edit,
  Copy,
  ChevronDown,
  ChevronRight,
  Building2,
  Store,
  Users,
  Package,
  Truck,
  Megaphone,
  CreditCard,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';
import {
  storeControlService,
  STORE_TYPE_NAMES,
  type StoreControlTemplate,
  type StoreType,
  type FeatureModule,
  type PermissionConfig,
} from '@/lib/store-control-service';

// 模块名称映射
const MODULE_NAMES: Record<FeatureModule, { name: string; icon: React.ReactNode }> = {
  organization: { name: '组织与人事', icon: <Users className="h-4 w-4" /> },
  products: { name: '商品管理', icon: <Package className="h-4 w-4" /> },
  supply: { name: '供应链与采购', icon: <Truck className="h-4 w-4" /> },
  marketing: { name: '营销促销', icon: <Megaphone className="h-4 w-4" /> },
  members: { name: '会员运营', icon: <Users className="h-4 w-4" /> },
  finance: { name: '财务与分账', icon: <CreditCard className="h-4 w-4" /> },
  compliance: { name: '合规与风控', icon: <AlertTriangle className="h-4 w-4" /> },
  operations: { name: '运营与巡店', icon: <ClipboardList className="h-4 w-4" /> },
};

// 权限级别颜色
const LEVEL_COLORS: Record<string, string> = {
  full: 'bg-green-100 text-green-700',
  standard: 'bg-blue-100 text-blue-700',
  limited: 'bg-yellow-100 text-yellow-700',
  readonly: 'bg-gray-100 text-gray-700',
  none: 'bg-red-100 text-red-700',
};

// 权限级别名称
const LEVEL_NAMES: Record<string, string> = {
  full: '完全权限',
  standard: '标准权限',
  limited: '受限权限',
  readonly: '只读权限',
  none: '无权限',
};

export default function PermissionTemplatesPage() {
  const templates = storeControlService.getTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<StoreControlTemplate>(templates[0]);
  const [expandedModules, setExpandedModules] = useState<Set<FeatureModule>>(new Set());
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionConfig | null>(null);

  // 切换模块展开状态
  const toggleModule = (module: FeatureModule) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  // 获取模块权限统计
  const getModuleStats = (template: StoreControlTemplate, module: FeatureModule) => {
    const permissions = template.permissions.filter(p => p.module === module);
    const total = permissions.length;
    const enabled = permissions.filter(p => p.level !== 'none' && p.actions.length > 0).length;
    return { total, enabled };
  };

  // 渲染权限开关
  const renderPermissionToggle = (permission: PermissionConfig) => {
    const hasPermission = permission.level !== 'none' && permission.actions.length > 0;
    
    if (hasPermission) {
      return (
        <div className="flex items-center gap-2">
          <Badge className={LEVEL_COLORS[permission.level]}>
            {LEVEL_NAMES[permission.level]}
          </Badge>
          {permission.restrictions?.requireApproval && (
            <Badge variant="outline" className="text-xs">
              需审批
            </Badge>
          )}
        </div>
      );
    }
    
    return (
      <Badge className={LEVEL_COLORS.none}>
        <X className="h-3 w-3 mr-1" />
        无权限
      </Badge>
    );
  };

  // 渲染管控规则
  const renderControlRules = (template: StoreControlTemplate) => {
    const rules = template.controlRules;
    
    return (
      <div className="grid grid-cols-2 gap-4 mt-4">
        {/* 商品管控 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              商品管控
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">必须上架核心商品</span>
              {rules.productControl.mustCarryCoreProducts ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">核心商品占比要求</span>
              <span className="font-medium">{(rules.productControl.coreProductRatio * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">可新增本地商品</span>
              {rules.productControl.canAddLocalProduct ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            {rules.productControl.canAddLocalProduct && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">本地SKU最大占比</span>
                <span className="font-medium">{(rules.productControl.maxLocalSkuRatio * 100)}%</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">可调整价格</span>
              {rules.productControl.canEditPrice ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            {rules.productControl.priceRange && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">价格浮动范围</span>
                <span className="font-medium">
                  {(rules.productControl.priceRange.min * 100)}% ~ {(rules.productControl.priceRange.max * 100)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 供应链管控 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Truck className="h-4 w-4" />
              供应链管控
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">可提报要货</span>
              {rules.supplyControl.canRequest ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">可自主采购</span>
              {rules.supplyControl.canDirectPurchase ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">核心商品必须总部采购</span>
              {rules.supplyControl.coreProductMustHQ ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">仅限认证供应商</span>
              {rules.supplyControl.approvedSuppliersOnly ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">可跨店调拨</span>
              {rules.supplyControl.canTransfer ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* 营销管控 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              营销管控
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">必须执行总部活动</span>
              {rules.marketingControl.mustExecuteHQPromo ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">可创建门店活动</span>
              {rules.marketingControl.canCreateStorePromo ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            {rules.marketingControl.canCreateStorePromo && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">需审批</span>
                  {rules.marketingControl.storePromoRequireApproval ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                {rules.marketingControl.approvalTimeout > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">审批时效</span>
                    <span className="font-medium">{rules.marketingControl.approvalTimeout}小时</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">可发放优惠券</span>
              {rules.marketingControl.canIssueCoupon ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">可改价抹零</span>
              {rules.marketingControl.canDiscount ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* 财务管控 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              财务管控
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">营收归集总部</span>
              {rules.financeControl.revenueToHQ ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">自动分账</span>
              {rules.financeControl.autoSettle ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">可查看财务</span>
              {rules.financeControl.canViewFinance ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">可导出报表</span>
              {rules.financeControl.canExport ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* 合规管控 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              合规管控
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">强制合规规则</span>
              {rules.complianceControl.enforceRules ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">需要健康证</span>
              {rules.complianceControl.requireHealthCert ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">需要证照检查</span>
              {rules.complianceControl.requireLicenseCheck ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">自动拦截违规</span>
              {rules.complianceControl.autoBlockViolation ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* 运营管控 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              运营管控
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">必须执行标准</span>
              {rules.operationsControl.mustFollowStandards ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">可调整流程</span>
              {rules.operationsControl.canAdjustProcess ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">巡店频率</span>
              <span className="font-medium">
                {rules.operationsControl.inspectionFrequency === 'weekly' && '每周'}
                {rules.operationsControl.inspectionFrequency === 'monthly' && '每月'}
                {rules.operationsControl.inspectionFrequency === 'quarterly' && '每季度'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">整改必须执行</span>
              {rules.operationsControl.rectificationRequired ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            权限模板配置
          </h1>
          <p className="text-muted-foreground mt-1">
            预设4套标准权限模板，新开门店一键下发权限配置
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            复制模板
          </Button>
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            新建自定义模板
          </Button>
        </div>
      </div>

      {/* 模板选择标签 */}
      <div className="flex gap-4 border-b pb-4">
        {templates.map((template) => (
          <Button
            key={template.id}
            variant={selectedTemplate.id === template.id ? 'default' : 'outline'}
            onClick={() => setSelectedTemplate(template)}
            className="flex items-center gap-2"
          >
            {template.storeType === 'direct' && <Building2 className="h-4 w-4" />}
            {template.storeType === 'franchise_a' && <Store className="h-4 w-4 text-yellow-600" />}
            {template.storeType === 'franchise_b' && <Store className="h-4 w-4 text-blue-600" />}
            {template.storeType === 'franchise_c' && <Store className="h-4 w-4 text-green-600" />}
            {STORE_TYPE_NAMES[template.storeType]}
          </Button>
        ))}
      </div>

      {/* 模板详情 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：模板信息 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedTemplate.storeType === 'direct' && <Building2 className="h-5 w-5" />}
                {selectedTemplate.storeType === 'franchise_a' && <Store className="h-5 w-5 text-yellow-600" />}
                {selectedTemplate.storeType === 'franchise_b' && <Store className="h-5 w-5 text-blue-600" />}
                {selectedTemplate.storeType === 'franchise_c' && <Store className="h-5 w-5 text-green-600" />}
                {selectedTemplate.name}
              </CardTitle>
              <CardDescription>{selectedTemplate.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">门店类型</span>
                <Badge>{STORE_TYPE_NAMES[selectedTemplate.storeType]}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">默认模板</span>
                <Switch checked={selectedTemplate.isDefault} disabled />
              </div>
              
              {/* 分账规则 */}
              {selectedTemplate.settlementRules && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">分账规则</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">品牌费率</span>
                      <span>{(selectedTemplate.settlementRules.brandFeeRate * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">管理费率</span>
                      <span>{(selectedTemplate.settlementRules.managementFeeRate * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">日清日结</span>
                      {selectedTemplate.settlementRules.dailySettle ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：权限详情 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>权限配置详情</CardTitle>
              <CardDescription>
                按8大模块配置功能操作权限和数据查看权限
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(MODULE_NAMES).map(([moduleKey, moduleInfo]) => {
                  const module = moduleKey as FeatureModule;
                  const stats = getModuleStats(selectedTemplate, module);
                  const isExpanded = expandedModules.has(module);
                  const permissions = selectedTemplate.permissions.filter(p => p.module === module);
                  
                  return (
                    <div key={moduleKey} className="border rounded-lg">
                      {/* 模块头部 */}
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleModule(module)}
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          {moduleInfo.icon}
                          <span className="font-medium">{moduleInfo.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {stats.enabled}/{stats.total} 项已启用
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            // 编辑模块权限
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* 权限详情 */}
                      {isExpanded && (
                        <div className="border-t p-3 space-y-2 bg-muted/30">
                          {permissions.map((permission, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between py-2 px-3 bg-background rounded"
                            >
                              <span className="text-sm">{permission.subModule}</span>
                              {renderPermissionToggle(permission)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 管控规则 */}
      <Card>
        <CardHeader>
          <CardTitle>管控规则配置</CardTitle>
          <CardDescription>
            配置商品、供应链、营销、财务、合规、运营等管控规则
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderControlRules(selectedTemplate)}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">重置为默认</Button>
        <Button>保存修改</Button>
      </div>
    </div>
  );
}
