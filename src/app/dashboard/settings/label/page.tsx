'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tag,
  Settings,
  Eye,
  Printer,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Barcode,
  QrCode,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 价签模板配置
interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  paperSize: string;
  customWidth?: number;
  customHeight?: number;
  // 显示字段
  showName: boolean;
  showPrice: boolean;
  showBarcode: boolean;
  showSpec: boolean;
  showOrigin: boolean;
  showUnit: boolean;
  showGrade: boolean;
  showMemberPrice: boolean;
  showSupervision: boolean;
  supervisionText: string;
  // 布局设置
  layout: 'standard' | 'member' | 'simple' | 'custom';
  // 打印设置
  printMode: 'content-only' | 'full';
  isDefault: boolean;
  createTime: string;
}

// 预设纸张尺寸（根据图片标准，三种模板）
const paperSizes = [
  { 
    value: '70x38', 
    label: '70mm × 38mm（标准型）', 
    width: 70, 
    height: 38, 
    description: '标准商品价签，左侧商品信息+右侧零售价',
    layout: 'standard'
  },
  { 
    value: '60x40', 
    label: '60mm × 40mm（会员型）', 
    width: 60, 
    height: 40, 
    description: '会员商品价签，含会员价显示',
    layout: 'member'
  },
  { 
    value: '50x30', 
    label: '50mm × 30mm（简洁型）', 
    width: 50, 
    height: 30, 
    description: '简洁价签，仅显示品名、规格和价格',
    layout: 'simple'
  },
];

// 监制信息预设
const supervisionOptions = [
  { value: 'price_bureau', label: '物价局监制', text: '物价局监制 监督电话: 12358' },
  { value: 'market_admin', label: '市场监管总局', text: '市场监督管理总局 12315' },
  { value: 'none', label: '不显示', text: '' },
  { value: 'custom', label: '自定义', text: '' },
];

export default function LabelSettingsPage() {
  // 价签模板列表（根据图片设计预设三种标准模板）
  const [templates, setTemplates] = useState<LabelTemplate[]>([
    {
      id: 'tpl_standard_70x38',
      name: '标准商品价签（70×38mm）',
      description: '左侧商品信息+右侧零售价，适用于一般商品',
      paperSize: '70x38',
      layout: 'standard',
      showName: true,
      showPrice: true,
      showBarcode: true,
      showSpec: true,
      showOrigin: true,
      showUnit: true,
      showGrade: true,
      showMemberPrice: false,
      showSupervision: true,
      supervisionText: '物价局监制 监督电话: 12358',
      printMode: 'content-only',
      isDefault: true,
      createTime: '2025-01-15 10:00:00',
    },
    {
      id: 'tpl_member_60x40',
      name: '会员商品价签（60×40mm）',
      description: '含会员价显示，适用于会员商品',
      paperSize: '60x40',
      layout: 'member',
      showName: true,
      showPrice: true,
      showBarcode: true,
      showSpec: true,
      showOrigin: true,
      showUnit: true,
      showGrade: true,
      showMemberPrice: true,
      showSupervision: true,
      supervisionText: '市场监督管理总局 12315',
      printMode: 'content-only',
      isDefault: false,
      createTime: '2025-02-20 14:30:00',
    },
    {
      id: 'tpl_simple_50x30',
      name: '简洁商品价签（50×30mm）',
      description: '仅显示品名、规格和价格，适用于小商品',
      paperSize: '50x30',
      layout: 'simple',
      showName: true,
      showPrice: true,
      showBarcode: false,
      showSpec: true,
      showOrigin: false,
      showUnit: false,
      showGrade: false,
      showMemberPrice: false,
      showSupervision: false,
      supervisionText: '',
      printMode: 'content-only',
      isDefault: false,
      createTime: '2025-03-10 09:00:00',
    },
  ]);

  // 当前编辑的模板
  const [currentTemplate, setCurrentTemplate] = useState<LabelTemplate>(templates[0]);
  const [isEditing, setIsEditing] = useState(false);

  // 自定义尺寸
  const [customWidth, setCustomWidth] = useState(70);
  const [customHeight, setCustomHeight] = useState(38);

  // 全局设置
  const [globalSettings, setGlobalSettings] = useState({
    autoPrintOnPriceChange: true,
    defaultCopies: 1,
    printSpeed: 'normal',
    darkness: 8,
  });

  // 保存模板
  const handleSaveTemplate = () => {
    setTemplates(templates.map(t => 
      t.id === currentTemplate.id ? currentTemplate : t
    ));
    setIsEditing(false);
    alert('价签模板已保存');
  };

  // 设为默认模板
  const handleSetDefault = (template: LabelTemplate) => {
    setTemplates(templates.map(t => ({
      ...t,
      isDefault: t.id === template.id,
    })));
    setCurrentTemplate({ ...currentTemplate, isDefault: currentTemplate.id === template.id });
  };

  // 删除模板
  const handleDeleteTemplate = (template: LabelTemplate) => {
    if (template.isDefault) {
      alert('默认模板不能删除');
      return;
    }
    if (confirm(`确定要删除模板 "${template.name}" 吗？`)) {
      setTemplates(templates.filter(t => t.id !== template.id));
    }
  };

  // 新建模板
  const handleCreateTemplate = () => {
    const newTemplate: LabelTemplate = {
      id: `tpl_${Date.now()}`,
      name: '新价签模板',
      description: '自定义价签模板',
      paperSize: '70x38',
      layout: 'custom',
      showName: true,
      showPrice: true,
      showBarcode: true,
      showSpec: true,
      showOrigin: true,
      showUnit: true,
      showGrade: false,
      showMemberPrice: false,
      showSupervision: true,
      supervisionText: '物价局监制 监督电话: 12358',
      printMode: 'content-only',
      isDefault: false,
      createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setTemplates([...templates, newTemplate]);
    setCurrentTemplate(newTemplate);
    setIsEditing(true);
  };

  // 更新模板设置
  const updateTemplate = (key: keyof LabelTemplate, value: any) => {
    setCurrentTemplate({ ...currentTemplate, [key]: value });
    setIsEditing(true);
  };

  // 根据纸张尺寸自动设置布局
  const handlePaperSizeChange = (value: string) => {
    const size = paperSizes.find(s => s.value === value);
    if (size) {
      // 自动应用预设布局
      if (size.layout === 'standard') {
        setCurrentTemplate({
          ...currentTemplate,
          paperSize: value,
          layout: 'standard',
          showName: true,
          showPrice: true,
          showBarcode: true,
          showSpec: true,
          showOrigin: true,
          showUnit: true,
          showGrade: true,
          showMemberPrice: false,
          showSupervision: true,
          supervisionText: '物价局监制 监督电话: 12358',
        });
      } else if (size.layout === 'member') {
        setCurrentTemplate({
          ...currentTemplate,
          paperSize: value,
          layout: 'member',
          showName: true,
          showPrice: true,
          showBarcode: true,
          showSpec: true,
          showOrigin: true,
          showUnit: true,
          showGrade: true,
          showMemberPrice: true,
          showSupervision: true,
          supervisionText: '市场监督管理总局 12315',
        });
      } else if (size.layout === 'simple') {
        setCurrentTemplate({
          ...currentTemplate,
          paperSize: value,
          layout: 'simple',
          showName: true,
          showPrice: true,
          showBarcode: false,
          showSpec: true,
          showOrigin: false,
          showUnit: false,
          showGrade: false,
          showMemberPrice: false,
          showSupervision: false,
          supervisionText: '',
        });
      }
    }
    setIsEditing(true);
  };

  // 获取纸张尺寸
  const getPaperSize = () => {
    if (currentTemplate.paperSize === 'custom') {
      return { width: customWidth, height: customHeight };
    }
    const size = paperSizes.find(s => s.value === currentTemplate.paperSize);
    return { width: size?.width || 70, height: size?.height || 38 };
  };

  // 获取纸张尺寸标签
  const getPaperSizeLabel = (value: string) => {
    const size = paperSizes.find(s => s.value === value);
    return size ? size.label : value;
  };

  // 渲染价签预览（模拟标准价签样式）
  const renderLabelPreview = () => {
    const { width, height } = getPaperSize();
    const scale = 2.5; // 放大比例便于预览
    
    if (currentTemplate.layout === 'standard' || currentTemplate.paperSize === '70x38') {
      // 标准商品价签布局（70×38mm）- 对应第一张图
      return (
        <div 
          className="bg-white shadow-lg relative overflow-hidden mx-auto"
          style={{
            width: `${width * scale}px`,
            height: `${height * scale}px`,
            border: '2px solid #dc2626',
          }}
        >
          {/* 标题栏 */}
          <div className="bg-white px-1 py-0.5 border-b border-red-600 flex items-center">
            <span className="text-red-600 font-bold text-xs">商品标价签</span>
          </div>

          {/* 主内容区 */}
          <div className="flex h-full">
            {/* 左侧白色区域 - 商品信息 */}
            <div className="flex-1 bg-white p-1.5 text-[10px] space-y-0.5">
              {currentTemplate.showName && (
                <div className="flex">
                  <span className="text-gray-600 w-8">品名：</span>
                  <span className="flex-1 border-b border-dotted border-gray-300 min-w-12">农夫山泉矿泉水</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-1">
                {currentTemplate.showOrigin && (
                  <div className="flex">
                    <span className="text-gray-600">产地：</span>
                    <span className="flex-1 border-b border-dotted border-gray-300">浙江杭州</span>
                  </div>
                )}
                {currentTemplate.showUnit && (
                  <div className="flex">
                    <span className="text-gray-600">单位：</span>
                    <span className="flex-1 border-b border-dotted border-gray-300">瓶</span>
                  </div>
                )}
                {currentTemplate.showSpec && (
                  <div className="flex">
                    <span className="text-gray-600">规格：</span>
                    <span className="flex-1 border-b border-dotted border-gray-300">550ml</span>
                  </div>
                )}
                {currentTemplate.showGrade && (
                  <div className="flex">
                    <span className="text-gray-600">等级：</span>
                    <span className="flex-1 border-b border-dotted border-gray-300">一等品</span>
                  </div>
                )}
              </div>
              {currentTemplate.showBarcode && (
                <div className="mt-1">
                  <span className="text-gray-600">条码：</span>
                  <span className="text-[8px]">6901234567890</span>
                  <div className="flex mt-0.5">
                    {Array.from({ length: 35 }, (_, i) => (
                      <div
                        key={i}
                        className="bg-black"
                        style={{
                          width: Math.random() > 0.5 ? '1px' : '0.5px',
                          height: '10px',
                          margin: '0 0.2px'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 右侧黄色区域 - 价格 */}
            <div className="w-16 bg-yellow-100 p-1 flex flex-col items-center justify-center border-l border-red-600">
              <span className="text-[8px] text-gray-600">零售价</span>
              {currentTemplate.showPrice && (
                <div className="text-center">
                  <span className="text-red-600 font-bold text-sm">¥</span>
                  <span className="text-red-600 font-bold text-lg">1.50</span>
                </div>
              )}
            </div>
          </div>

          {/* 底部监制信息 */}
          {currentTemplate.showSupervision && currentTemplate.supervisionText && (
            <div className="absolute bottom-0 left-0 right-0 bg-white text-center py-0.5 border-t border-red-600">
              <span className="text-gray-500 text-[8px]">{currentTemplate.supervisionText}</span>
            </div>
          )}

          {/* 尺寸标注 */}
          <div className="absolute -right-12 top-1/2 transform -translate-y-1/2 text-[10px] text-gray-400">
            {height}mm
          </div>
          <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400">
            {width}mm
          </div>
        </div>
      );
    } else if (currentTemplate.layout === 'member' || currentTemplate.paperSize === '60x40') {
      // 会员商品价签布局（60×40mm）- 对应第二张图
      return (
        <div 
          className="bg-white shadow-lg relative overflow-hidden mx-auto"
          style={{
            width: `${width * scale}px`,
            height: `${height * scale}px`,
            border: '2px solid #dc2626',
          }}
        >
          {/* 标题栏 */}
          <div className="bg-white px-1 py-0.5 border-b border-red-600 flex items-center justify-end">
            <span className="text-gray-800 font-bold text-xs">商品标价签</span>
          </div>

          {/* 主内容区 */}
          <div className="flex h-full">
            {/* 左侧白色区域 - 商品信息 */}
            <div className="flex-1 bg-white p-1.5 text-[10px] space-y-0.5">
              {currentTemplate.showName && (
                <div className="font-bold text-xs">
                  品名：农夫山泉矿泉水
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-1 text-[9px]">
                {currentTemplate.showOrigin && (
                  <div>产地：浙江杭州</div>
                )}
                {currentTemplate.showUnit && (
                  <div>单位：瓶</div>
                )}
                {currentTemplate.showSpec && (
                  <div>规格：550ml</div>
                )}
                {currentTemplate.showGrade && (
                  <div>等级：一等品</div>
                )}
              </div>
              {currentTemplate.showBarcode && (
                <div className="mt-0.5">
                  <span className="text-gray-600 text-[8px]">条码：</span>
                  <span className="text-[7px]">6901234567890</span>
                  <div className="flex mt-0.5">
                    {Array.from({ length: 30 }, (_, i) => (
                      <div
                        key={i}
                        className="bg-black"
                        style={{
                          width: Math.random() > 0.5 ? '1px' : '0.5px',
                          height: '8px',
                          margin: '0 0.2px'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 右侧黄色区域 - 价格 */}
            <div className="w-14 bg-yellow-100 p-1 flex flex-col items-center justify-center border-l border-red-600">
              <span className="text-[8px] text-gray-600">零售价</span>
              {currentTemplate.showPrice && (
                <div className="text-center">
                  <span className="text-red-600 font-bold text-xs">¥</span>
                  <span className="text-red-600 font-bold text-base">1.50</span>
                </div>
              )}
              {currentTemplate.showMemberPrice && (
                <div className="mt-0.5 text-center">
                  <span className="text-[7px] text-orange-600">会员价</span>
                  <div className="text-orange-600 font-bold text-[10px]">¥1.35</div>
                </div>
              )}
            </div>
          </div>

          {/* 底部监制信息 */}
          {currentTemplate.showSupervision && currentTemplate.supervisionText && (
            <div className="absolute bottom-0 left-0 right-0 bg-white text-center py-0.5 border-t border-red-600">
              <span className="text-gray-500 text-[8px]">{currentTemplate.supervisionText}</span>
            </div>
          )}

          {/* 尺寸标注 */}
          <div className="absolute -right-12 top-1/2 transform -translate-y-1/2 text-[10px] text-gray-400">
            {height}mm
          </div>
          <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400">
            {width}mm
          </div>
        </div>
      );
    } else if (currentTemplate.layout === 'simple' || currentTemplate.paperSize === '50x30') {
      // 简洁商品价签布局（50×30mm）- 简洁样式
      return (
        <div 
          className="bg-white shadow-lg relative overflow-hidden mx-auto"
          style={{
            width: `${width * scale}px`,
            height: `${height * scale}px`,
            border: '2px solid #dc2626',
          }}
        >
          {/* 主内容区 - 居中布局 */}
          <div className="flex flex-col items-center justify-center h-full p-2 text-center">
            {currentTemplate.showName && (
              <div className="font-bold text-xs mb-0.5">
                农夫山泉矿泉水
              </div>
            )}
            {currentTemplate.showSpec && (
              <div className="text-[9px] text-gray-500 mb-0.5">
                550ml
              </div>
            )}
            {currentTemplate.showPrice && (
              <div className="text-red-600 font-bold text-base">
                ¥1.50
              </div>
            )}
          </div>

          {/* 尺寸标注 */}
          <div className="absolute -right-12 top-1/2 transform -translate-y-1/2 text-[10px] text-gray-400">
            {height}mm
          </div>
          <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400">
            {width}mm
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="价签打印设置" description="配置商品价签的打印格式和内容">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          测试打印
        </Button>
        <Button onClick={handleCreateTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          新建模板
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 预设模板说明 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">预设模板说明</p>
                  <p>系统预设三种标准价签模板：</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                    <li><strong>70×38mm 标准商品价签</strong>：左侧显示品名、产地、单位、规格、等级、条码，右侧黄色区域显示零售价</li>
                    <li><strong>60×40mm 会员商品价签</strong>：左侧显示品名和基本信息，右侧黄色区域显示零售价和会员价</li>
                    <li><strong>50×30mm 简洁商品价签</strong>：仅显示品名、规格和价格，适用于小商品</li>
                  </ul>
                  <p className="mt-1 text-xs text-blue-600">打印模式：仅打印空白填写区域内容，不打印边框和背景</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="template" className="space-y-4">
            <TabsList>
              <TabsTrigger value="template">
                <Tag className="h-4 w-4 mr-2" />
                价签模板
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                打印预览
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                全局设置
              </TabsTrigger>
            </TabsList>

            {/* 价签模板 */}
            <TabsContent value="template">
              <div className="grid grid-cols-3 gap-6">
                {/* 模板列表 */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>模板列表</CardTitle>
                    <CardDescription>选择或管理价签模板</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {templates.map(template => (
                        <div
                          key={template.id}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-all",
                            currentTemplate.id === template.id
                              ? "border-red-500 bg-red-50"
                              : "hover:bg-gray-50"
                          )}
                          onClick={() => {
                            setCurrentTemplate(template);
                            setIsEditing(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium flex items-center gap-2 text-sm">
                                {template.name}
                                {template.isDefault && (
                                  <Badge className="bg-red-500 text-[10px] px-1">默认</Badge>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {getPaperSizeLabel(template.paperSize)}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {template.description}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {!template.isDefault && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetDefault(template);
                                  }}
                                  title="设为默认"
                                  className="h-6 w-6 p-0"
                                >
                                  <Settings className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTemplate(template);
                                }}
                                className="text-red-600 h-6 w-6 p-0"
                                disabled={template.isDefault}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 模板配置 */}
                <Card className="col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>模板配置</CardTitle>
                        <CardDescription>设置价签显示内容和格式</CardDescription>
                      </div>
                      {isEditing && (
                        <Badge className="bg-orange-500">已修改</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 基本信息 */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2 text-red-600">
                        <FileText className="h-4 w-4" />
                        基本信息
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>模板名称</Label>
                          <Input
                            value={currentTemplate.name}
                            onChange={(e) => updateTemplate('name', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>模板描述</Label>
                          <Input
                            value={currentTemplate.description}
                            onChange={(e) => updateTemplate('description', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>纸张尺寸（选择尺寸会自动应用对应布局）</Label>
                        <Select
                          value={currentTemplate.paperSize}
                          onValueChange={handlePaperSizeChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {paperSizes.map(size => (
                              <SelectItem key={size.value} value={size.value}>
                                <div>
                                  <span>{size.label}</span>
                                  <span className="text-xs text-gray-400 ml-2">{size.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* 自定义尺寸 */}
                      {currentTemplate.paperSize === 'custom' && (
                        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="space-y-2">
                            <Label>宽度 (mm)</Label>
                            <Input
                              type="number"
                              value={customWidth}
                              onChange={(e) => setCustomWidth(parseInt(e.target.value) || 70)}
                              min={30}
                              max={100}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>高度 (mm)</Label>
                            <Input
                              type="number"
                              value={customHeight}
                              onChange={(e) => setCustomHeight(parseInt(e.target.value) || 38)}
                              min={20}
                              max={60}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 显示内容 */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2 text-red-600">
                        <Eye className="h-4 w-4" />
                        显示内容
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                          <span className="text-sm">品名</span>
                          <Switch
                            checked={currentTemplate.showName}
                            onCheckedChange={(checked) => updateTemplate('showName', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center gap-2">
                            <span className="text-red-500 font-bold">¥</span>
                            <span className="text-sm">零售价</span>
                          </div>
                          <Switch
                            checked={currentTemplate.showPrice}
                            onCheckedChange={(checked) => updateTemplate('showPrice', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                          <span className="text-sm">产地</span>
                          <Switch
                            checked={currentTemplate.showOrigin}
                            onCheckedChange={(checked) => updateTemplate('showOrigin', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                          <span className="text-sm">单位</span>
                          <Switch
                            checked={currentTemplate.showUnit}
                            onCheckedChange={(checked) => updateTemplate('showUnit', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                          <span className="text-sm">规格</span>
                          <Switch
                            checked={currentTemplate.showSpec}
                            onCheckedChange={(checked) => updateTemplate('showSpec', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                          <span className="text-sm">等级</span>
                          <Switch
                            checked={currentTemplate.showGrade}
                            onCheckedChange={(checked) => updateTemplate('showGrade', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Barcode className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">条形码</span>
                          </div>
                          <Switch
                            checked={currentTemplate.showBarcode}
                            onCheckedChange={(checked) => updateTemplate('showBarcode', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center gap-2">
                            <span className="text-orange-500 font-bold text-xs">VIP</span>
                            <span className="text-sm">会员价</span>
                          </div>
                          <Switch
                            checked={currentTemplate.showMemberPrice}
                            onCheckedChange={(checked) => updateTemplate('showMemberPrice', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg col-span-2">
                          <span className="text-sm">监制信息</span>
                          <Switch
                            checked={currentTemplate.showSupervision}
                            onCheckedChange={(checked) => updateTemplate('showSupervision', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 监制信息配置 */}
                    {currentTemplate.showSupervision && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-red-600 text-sm">监制信息内容</h4>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            {supervisionOptions.filter(s => s.value !== 'none').map(option => (
                              <button
                                key={option.value}
                                className={cn(
                                  "py-2 px-3 text-xs border rounded transition-all text-left",
                                  currentTemplate.supervisionText === option.text
                                    ? "border-red-500 bg-red-50 text-red-500"
                                    : "hover:bg-gray-50"
                                )}
                                onClick={() => updateTemplate('supervisionText', option.text)}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                          <Input
                            value={currentTemplate.supervisionText}
                            onChange={(e) => updateTemplate('supervisionText', e.target.value)}
                            placeholder="自定义监制信息"
                          />
                        </div>
                      </div>
                    )}

                    {/* 打印模式 */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-red-600 text-sm">打印模式</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          className={cn(
                            "py-3 px-4 border rounded-lg text-left transition-all",
                            currentTemplate.printMode === 'content-only'
                              ? "border-red-500 bg-red-50"
                              : "hover:bg-gray-50"
                          )}
                          onClick={() => updateTemplate('printMode', 'content-only')}
                        >
                          <div className="font-medium text-sm">仅打印内容</div>
                          <div className="text-xs text-gray-500 mt-1">只打印空白填写区域，不打印边框和背景</div>
                        </button>
                        <button
                          className={cn(
                            "py-3 px-4 border rounded-lg text-left transition-all",
                            currentTemplate.printMode === 'full'
                              ? "border-red-500 bg-red-50"
                              : "hover:bg-gray-50"
                          )}
                          onClick={() => updateTemplate('printMode', 'full')}
                        >
                          <div className="font-medium text-sm">完整打印</div>
                          <div className="text-xs text-gray-500 mt-1">打印完整价签，包括边框</div>
                        </button>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        取消修改
                      </Button>
                      <Button onClick={handleSaveTemplate} disabled={!isEditing} className="bg-red-500 hover:bg-red-600">
                        <Save className="h-4 w-4 mr-2" />
                        保存模板
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 打印预览 */}
            <TabsContent value="preview">
              <div className="grid grid-cols-3 gap-6">
                {/* 预览区域 */}
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>价签预览</CardTitle>
                    <CardDescription>
                      当前模板的实际打印效果
                      {currentTemplate.printMode === 'content-only' && (
                        <span className="text-blue-500 ml-2">（仅显示内容区域）</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center p-8 bg-gray-200 rounded-lg">
                      {renderLabelPreview()}
                    </div>
                  </CardContent>
                </Card>

                {/* 示例数据 */}
                <Card>
                  <CardHeader>
                    <CardTitle>预览数据</CardTitle>
                    <CardDescription>模拟商品信息</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">商品名称</span>
                        <span className="font-medium">农夫山泉矿泉水</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">商品条码</span>
                        <span>6901234567890</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">商品规格</span>
                        <span>550ml</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">产地</span>
                        <span>浙江杭州</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">单位</span>
                        <span>瓶</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">等级</span>
                        <span>一等品</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">销售价格</span>
                        <span className="text-red-500 font-bold">¥1.50</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">会员价格</span>
                        <span className="text-orange-500">¥1.35</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t space-y-2">
                      <div className="flex gap-2">
                        <Input type="number" min={1} defaultValue={1} className="w-20" />
                        <Button className="flex-1 bg-red-500 hover:bg-red-600">
                          <Printer className="h-4 w-4 mr-2" />
                          打印价签
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 text-center">
                        当前：{currentTemplate.name}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 全局设置 */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>全局打印设置</CardTitle>
                  <CardDescription>配置价签打印的通用参数</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">改价自动打印</p>
                        <p className="text-sm text-gray-500">商品改价后自动打印新价签</p>
                      </div>
                      <Switch
                        checked={globalSettings.autoPrintOnPriceChange}
                        onCheckedChange={(checked) => 
                          setGlobalSettings({ ...globalSettings, autoPrintOnPriceChange: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>默认打印份数</Label>
                      <Select
                        value={String(globalSettings.defaultCopies)}
                        onValueChange={(value) => 
                          setGlobalSettings({ ...globalSettings, defaultCopies: parseInt(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map(num => (
                            <SelectItem key={num} value={String(num)}>
                              {num} 份
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>打印速度</Label>
                      <Select
                        value={globalSettings.printSpeed}
                        onValueChange={(value) => 
                          setGlobalSettings({ ...globalSettings, printSpeed: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slow">慢速（高质量）</SelectItem>
                          <SelectItem value="normal">正常</SelectItem>
                          <SelectItem value="fast">快速</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>打印浓度</Label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="1"
                          max="15"
                          value={globalSettings.darkness}
                          onChange={(e) => 
                            setGlobalSettings({ ...globalSettings, darkness: parseInt(e.target.value) })
                          }
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-500 w-8">{globalSettings.darkness}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button className="bg-red-500 hover:bg-red-600">
                      <Save className="h-4 w-4 mr-2" />
                      保存设置
                    </Button>
                    <Button variant="outline">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      恢复默认
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
