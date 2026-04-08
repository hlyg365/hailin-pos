'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Plus, 
  Pencil, 
  Trash2, 
  GripVertical, 
  Play, 
  Pause,
  Image as ImageIcon,
  Video,
  Megaphone,
  FileText,
  Eye,
  Save,
  Monitor,
  ExternalLink,
  QrCode,
  Upload,
  Link,
  Users,
  Gift,
  X,
} from 'lucide-react';

// 广告类型
interface Advertisement {
  id: string;
  type: 'image' | 'video' | 'promotion' | 'text' | 'member';
  title: string;
  subtitle?: string;
  content?: string;
  image?: string;
  backgroundColor?: string;
  textColor?: string;
  duration: number; // 显示时长（秒）
  enabled: boolean;
  order: number;
  // 会员专属字段
  showQrCode?: boolean;
  qrCodeUrl?: string;
  miniProgramLink?: string;
  qrCodePosition?: 'left' | 'right' | 'bottom';
}

// 预设背景色
const backgroundColors = [
  { label: '绿色渐变', value: 'from-green-500 to-emerald-600' },
  { label: '紫色渐变', value: 'from-purple-500 to-indigo-600' },
  { label: '橙色渐变', value: 'from-orange-500 to-red-500' },
  { label: '蓝色渐变', value: 'from-blue-500 to-cyan-500' },
  { label: '红色渐变', value: 'from-red-500 to-pink-500' },
  { label: '黄色渐变', value: 'from-yellow-500 to-orange-500' },
  { label: '青色渐变', value: 'from-teal-500 to-cyan-600' },
  { label: '靛蓝渐变', value: 'from-indigo-500 to-purple-600' },
];

// 默认广告列表
const defaultAdvertisements: Advertisement[] = [
  {
    id: 'ad1',
    type: 'promotion',
    title: '新鲜水果',
    subtitle: '每日直采 品质保证',
    content: '🍎 香蕉 6.00元/斤\n🍊 橙子 5.50元/斤\n🍇 葡萄 12.00元/斤',
    backgroundColor: 'from-green-500 to-emerald-600',
    textColor: 'text-white',
    duration: 8,
    enabled: true,
    order: 1,
  },
  {
    id: 'ad2',
    type: 'member',
    title: '会员专享',
    subtitle: '扫码注册 立享优惠',
    content: '🎁 新会员注册送50积分\n💳 会员购物95折\n🏆 积分可抵现金',
    backgroundColor: 'from-purple-500 to-indigo-600',
    textColor: 'text-white',
    duration: 10,
    enabled: true,
    order: 2,
    showQrCode: true,
    qrCodePosition: 'right',
  },
  {
    id: 'ad3',
    type: 'promotion',
    title: '限时特惠',
    subtitle: '今日特价 限量抢购',
    content: '🥛 纯牛奶 买二送一\n🍪 进口饼干 7折\n🧃 鲜榨果汁 买一送一',
    backgroundColor: 'from-orange-500 to-red-500',
    textColor: 'text-white',
    duration: 8,
    enabled: true,
    order: 3,
  },
  {
    id: 'ad4',
    type: 'promotion',
    title: '海邻到家',
    subtitle: '社区便利店 品质生活',
    content: '📱 扫码下单 30分钟送达\n🏠 满额免运费\n💚 新鲜直达 品质保障',
    backgroundColor: 'from-blue-500 to-cyan-500',
    textColor: 'text-white',
    duration: 8,
    enabled: true,
    order: 4,
  },
];

export default function CustomerDisplaySettingsPage() {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [previewAd, setPreviewAd] = useState<Advertisement | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 加载广告数据
  useEffect(() => {
    const savedAds = localStorage.getItem('pos_advertisements');
    if (savedAds) {
      setAdvertisements(JSON.parse(savedAds));
    } else {
      setAdvertisements(defaultAdvertisements);
      localStorage.setItem('pos_advertisements', JSON.stringify(defaultAdvertisements));
    }
  }, []);

  // 保存广告数据
  const saveAdvertisements = async (ads: Advertisement[]) => {
    setIsSaving(true);
    try {
      localStorage.setItem('pos_advertisements', JSON.stringify(ads));
      setAdvertisements(ads);
      // 触发 storage 事件通知客显屏
      window.dispatchEvent(new StorageEvent('storage', { 
        key: 'pos_advertisements', 
        newValue: JSON.stringify(ads) 
      }));
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsSaving(false);
    }
  };

  // 添加/编辑广告
  const handleSaveAd = async (ad: Advertisement) => {
    let newAds: Advertisement[];
    if (editingAd) {
      // 编辑模式
      newAds = advertisements.map(a => a.id === ad.id ? ad : a);
    } else {
      // 添加模式
      const maxOrder = Math.max(...advertisements.map(a => a.order), 0);
      newAds = [...advertisements, { ...ad, order: maxOrder + 1 }];
    }
    await saveAdvertisements(newAds);
    setIsEditing(false);
    setEditingAd(null);
  };

  // 删除广告
  const handleDeleteAd = async (id: string) => {
    if (!confirm('确定要删除这条广告吗？')) return;
    const newAds = advertisements.filter(a => a.id !== id);
    await saveAdvertisements(newAds);
  };

  // 切换广告启用状态
  const toggleAdEnabled = async (id: string) => {
    const newAds = advertisements.map(a => 
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );
    await saveAdvertisements(newAds);
  };

  // 移动广告顺序
  const moveAd = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = advertisements.findIndex(a => a.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === advertisements.length - 1)
    ) {
      return;
    }

    const newAds = [...advertisements];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // 交换顺序
    [newAds[currentIndex], newAds[targetIndex]] = [newAds[targetIndex], newAds[currentIndex]];
    
    // 更新 order 字段
    newAds.forEach((ad, index) => {
      ad.order = index + 1;
    });

    await saveAdvertisements(newAds);
  };

  // 获取广告类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'promotion': return <Megaphone className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      case 'member': return <Users className="h-4 w-4" />;
      default: return <Megaphone className="h-4 w-4" />;
    }
  };

  // 获取广告类型标签
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'image': return '图片广告';
      case 'video': return '视频广告';
      case 'promotion': return '促销活动';
      case 'text': return '文字广告';
      case 'member': return '会员推广';
      default: return '未知类型';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader 
        title="客显屏管理" 
        description="管理客显屏广告内容，设置轮播顺序"
      >
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('/pos/customer-display', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            预览客显屏
          </Button>
          <Button 
            size="sm"
            onClick={() => {
              setEditingAd(null);
              setIsEditing(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            添加广告
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* 说明卡片 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Monitor className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">客显屏广告管理</p>
                  <p className="text-blue-600">
                    设置的广告将在门店收银台的客显屏上轮播展示。当顾客购物时，客显屏会自动切换为显示购物内容；空闲时则播放广告。
                    <span className="font-medium"> 会员推广类广告支持展示小程序二维码，顾客扫码即可开通会员。</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 广告列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                广告列表
              </CardTitle>
              <CardDescription>
                拖拽或使用上下按钮调整广告显示顺序
              </CardDescription>
            </CardHeader>
            <CardContent>
              {advertisements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>暂无广告内容</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setEditingAd(null);
                      setIsEditing(true);
                    }}
                  >
                    添加第一条广告
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {advertisements.sort((a, b) => a.order - b.order).map((ad, index) => (
                    <div 
                      key={ad.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                        ad.enabled ? 'bg-white' : 'bg-gray-50 opacity-60'
                      }`}
                    >
                      {/* 拖拽手柄和序号 */}
                      <div className="flex flex-col items-center gap-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <span className="text-xs text-muted-foreground">{index + 1}</span>
                      </div>

                      {/* 预览缩略图 */}
                      <div 
                        className={`w-24 h-16 rounded-md flex items-center justify-center bg-gradient-to-br ${ad.backgroundColor || 'from-gray-200 to-gray-300'} relative`}
                      >
                        <span className="text-white text-xs font-medium truncate px-2">
                          {ad.title}
                        </span>
                        {ad.showQrCode && (
                          <div className="absolute bottom-1 right-1 bg-white rounded p-0.5">
                            <QrCode className="h-3 w-3 text-gray-600" />
                          </div>
                        )}
                      </div>

                      {/* 广告信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{ad.title}</span>
                          <Badge variant="outline" className="shrink-0">
                            {getTypeIcon(ad.type)}
                            <span className="ml-1">{getTypeLabel(ad.type)}</span>
                          </Badge>
                          {ad.showQrCode && (
                            <Badge variant="secondary" className="shrink-0 bg-purple-100 text-purple-700">
                              <QrCode className="h-3 w-3 mr-1" />
                              含二维码
                            </Badge>
                          )}
                          {!ad.enabled && (
                            <Badge variant="secondary" className="shrink-0">已禁用</Badge>
                          )}
                        </div>
                        {ad.subtitle && (
                          <p className="text-sm text-muted-foreground truncate">{ad.subtitle}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          显示时长: {ad.duration}秒
                        </p>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveAd(ad.id, 'up')}
                          disabled={index === 0}
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 15l-6-6-6 6" />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveAd(ad.id, 'down')}
                          disabled={index === advertisements.length - 1}
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </Button>
                        
                        <div className="w-px h-6 bg-border mx-1" />

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPreviewAd(ad)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleAdEnabled(ad.id)}
                        >
                          {ad.enabled ? (
                            <Pause className="h-4 w-4 text-orange-500" />
                          ) : (
                            <Play className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingAd(ad);
                            setIsEditing(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAd(ad.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 使用说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">使用说明</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>1. 客显屏是收银台面向顾客的第二块屏幕，用于展示购物信息和广告内容</p>
              <p>2. 当收银台有商品时，客显屏显示当前购物清单；空闲时自动播放广告</p>
              <p>3. 广告类型支持：促销活动、会员推广、图片广告、视频广告、纯文字广告</p>
              <p>4. <strong>会员推广</strong>类型支持显示小程序二维码，顾客扫码即可开通会员</p>
              <p>5. 建议设置 3-5 条广告，每条时长 5-10 秒，保持内容简洁吸引人</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 编辑/添加广告对话框 */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAd ? '编辑广告' : '添加广告'}</DialogTitle>
            <DialogDescription>
              设置广告内容，配置显示样式和时长
            </DialogDescription>
          </DialogHeader>
          
          <AdEditForm 
            ad={editingAd}
            onSave={handleSaveAd}
            onCancel={() => {
              setIsEditing(false);
              setEditingAd(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 预览对话框 */}
      <Dialog open={!!previewAd} onOpenChange={() => setPreviewAd(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>广告预览</DialogTitle>
          </DialogHeader>
          {previewAd && (
            <AdPreview ad={previewAd} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 广告预览组件
function AdPreview({ ad }: { ad: Advertisement }) {
  return (
    <div className="aspect-video rounded-lg overflow-hidden">
      <div className={`h-full w-full bg-gradient-to-br ${ad.backgroundColor || 'from-blue-500 to-cyan-500'} flex flex-col items-center justify-center p-8 ${ad.showQrCode ? 'flex-row gap-8' : ''}`}>
        {/* 内容区域 */}
        <div className={`${ad.showQrCode && ad.qrCodePosition !== 'bottom' ? 'flex-1' : ''}`}>
          <h1 className="text-4xl font-bold text-white mb-4 text-center animate-pulse">
            {ad.title}
          </h1>
          {ad.subtitle && (
            <p className="text-xl text-white opacity-90 mb-6 text-center">{ad.subtitle}</p>
          )}
          {ad.content && (
            <div className="text-white text-lg whitespace-pre-line text-center leading-relaxed">
              {ad.content}
            </div>
          )}
        </div>
        
        {/* 二维码区域 */}
        {ad.showQrCode && (
          <div className={`${ad.qrCodePosition === 'bottom' ? 'mt-6' : 'flex flex-col items-center'}`}>
            <div className="bg-white rounded-xl p-4 shadow-lg">
              {ad.qrCodeUrl ? (
                <img 
                  src={ad.qrCodeUrl} 
                  alt="会员二维码" 
                  className="w-32 h-32 object-contain"
                />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded">
                  <QrCode className="w-20 h-20 text-gray-400" />
                </div>
              )}
            </div>
            <p className="text-white text-sm mt-2 text-center">扫码开通会员</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 广告编辑表单组件
function AdEditForm({ 
  ad, 
  onSave, 
  onCancel 
}: { 
  ad: Advertisement | null; 
  onSave: (ad: Advertisement) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Advertisement>(() => ad || {
    id: `ad_${Date.now()}`,
    type: 'promotion',
    title: '',
    subtitle: '',
    content: '',
    backgroundColor: 'from-green-500 to-emerald-600',
    textColor: 'text-white',
    duration: 8,
    enabled: true,
    order: 0,
    showQrCode: false,
    qrCodePosition: 'right',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('请输入广告标题');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：表单配置 */}
        <div className="space-y-4">
          {/* 广告类型 */}
          <div className="space-y-2">
            <Label>广告类型</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData({ 
                ...formData, 
                type: value as Advertisement['type'],
                // 切换到会员推广时自动开启二维码
                showQrCode: value === 'member' ? true : formData.showQrCode,
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="promotion">促销活动</SelectItem>
                <SelectItem value="member">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    会员推广
                    <Badge variant="secondary" className="ml-1 text-xs">含二维码</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="image">图片广告</SelectItem>
                <SelectItem value="video">视频广告</SelectItem>
                <SelectItem value="text">文字广告</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="请输入广告标题"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">建议不超过10个字</p>
          </div>

          {/* 副标题 */}
          <div className="space-y-2">
            <Label htmlFor="subtitle">副标题</Label>
            <Input
              id="subtitle"
              value={formData.subtitle || ''}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="请输入副标题（可选）"
              maxLength={30}
            />
          </div>

          {/* 内容 */}
          {formData.type !== 'image' && formData.type !== 'video' && (
            <div className="space-y-2">
              <Label htmlFor="content">广告内容</Label>
              <Textarea
                id="content"
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="请输入广告内容，每行显示一项"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">建议使用 emoji 增加视觉效果</p>
            </div>
          )}

          {/* 二维码配置（会员推广类型） */}
          {(formData.type === 'member' || formData.showQrCode) && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-purple-600" />
                  小程序二维码设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 显示二维码开关 */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="showQrCode">显示小程序二维码</Label>
                  <Switch
                    id="showQrCode"
                    checked={formData.showQrCode}
                    onCheckedChange={(checked) => setFormData({ ...formData, showQrCode: checked })}
                  />
                </div>

                {formData.showQrCode && (
                  <>
                    {/* 二维码位置 */}
                    <div className="space-y-2">
                      <Label>二维码位置</Label>
                      <Select 
                        value={formData.qrCodePosition || 'right'} 
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          qrCodePosition: value as 'left' | 'right' | 'bottom' 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="right">右侧显示</SelectItem>
                          <SelectItem value="left">左侧显示</SelectItem>
                          <SelectItem value="bottom">底部显示</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 二维码图片 */}
                    <div className="space-y-2">
                      <Label>二维码图片</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.qrCodeUrl || ''}
                          onChange={(e) => setFormData({ ...formData, qrCodeUrl: e.target.value })}
                          placeholder="输入二维码图片URL"
                          className="flex-1"
                        />
                        <Button type="button" variant="outline" size="icon">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        上传小程序码或小程序二维码图片，建议尺寸 200x200px
                      </p>
                    </div>

                    {/* 小程序链接（可选） */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Link className="h-3 w-3" />
                        小程序链接（可选）
                      </Label>
                      <Input
                        value={formData.miniProgramLink || ''}
                        onChange={(e) => setFormData({ ...formData, miniProgramLink: e.target.value })}
                        placeholder="例如：pages/member/register"
                      />
                      <p className="text-xs text-muted-foreground">
                        设置小程序页面路径，方便后台追踪
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* 背景色 */}
          <div className="space-y-2">
            <Label>背景颜色</Label>
            <div className="grid grid-cols-4 gap-2">
              {backgroundColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`h-10 rounded-md bg-gradient-to-r ${color.value} transition-all ${
                    formData.backgroundColor === color.value 
                      ? 'ring-2 ring-offset-2 ring-blue-500' 
                      : ''
                  }`}
                  onClick={() => setFormData({ ...formData, backgroundColor: color.value })}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* 显示时长 */}
          <div className="space-y-2">
            <Label htmlFor="duration">显示时长（秒）</Label>
            <Input
              id="duration"
              type="number"
              min={3}
              max={60}
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 8 })}
            />
          </div>

          {/* 启用状态 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">启用广告</Label>
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
          </div>
        </div>

        {/* 右侧：实时预览 */}
        <div className="space-y-2">
          <Label>预览效果</Label>
          <div className="sticky top-4">
            <div className="aspect-video rounded-lg overflow-hidden border shadow-lg">
              <div className={`h-full w-full bg-gradient-to-br ${formData.backgroundColor || 'from-blue-500 to-cyan-500'} flex ${
                formData.showQrCode && formData.qrCodePosition !== 'bottom' 
                  ? 'flex-row items-center justify-center gap-6 p-6' 
                  : 'flex-col items-center justify-center p-6'
              }`}>
                {/* 内容区域 */}
                <div className={formData.showQrCode && formData.qrCodePosition !== 'bottom' ? 'flex-1' : ''}>
                  <h1 className={`font-bold text-white mb-2 text-center ${
                    formData.showQrCode ? 'text-xl' : 'text-2xl'
                  }`}>
                    {formData.title || '广告标题'}
                  </h1>
                  {formData.subtitle && (
                    <p className={`text-white opacity-90 mb-4 text-center ${
                      formData.showQrCode ? 'text-sm' : 'text-lg'
                    }`}>
                      {formData.subtitle}
                    </p>
                  )}
                  {formData.content && (
                    <div className={`text-white whitespace-pre-line text-center leading-relaxed ${
                      formData.showQrCode ? 'text-xs' : 'text-sm'
                    }`}>
                      {formData.content}
                    </div>
                  )}
                </div>

                {/* 二维码区域 */}
                {formData.showQrCode && (
                  <div className={`flex flex-col items-center ${
                    formData.qrCodePosition === 'bottom' ? 'mt-4' : ''
                  }`}>
                    <div className="bg-white rounded-lg p-2 shadow-lg">
                      {formData.qrCodeUrl ? (
                        <img 
                          src={formData.qrCodeUrl} 
                          alt="二维码" 
                          className="w-24 h-24 object-contain"
                        />
                      ) : (
                        <div className="w-24 h-24 flex items-center justify-center bg-gray-50 rounded">
                          <QrCode className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <p className="text-white text-xs mt-2 text-center font-medium">
                      扫码开通会员
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* 提示信息 */}
            {formData.showQrCode && (
              <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-700">
                  <Gift className="h-3 w-3 inline mr-1" />
                  会员推广广告将在客显屏上显示小程序二维码，顾客扫码即可开通会员
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-1" />
          保存
        </Button>
      </DialogFooter>
    </form>
  );
}
