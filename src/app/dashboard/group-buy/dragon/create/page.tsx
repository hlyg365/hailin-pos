'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  ArrowLeft, Package, Share2, Copy, Check, Loader2, MessageCircle, QrCode, Users, Send, Store, Target
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// 商品接口
interface DragonProduct {
  id: string;
  name: string;
  price: number;
  groupPrice: number;
  stock: number;
  commissionType: 'none' | 'percent' | 'fixed';
  commissionValue: number;
  commission: number;
  selected: boolean;
}

// 团长接口
interface TeamLeader {
  id: string;
  name: string;
  phone: string;
  community: string;
}

// 店铺接口
interface Store {
  id: string;
  name: string;
  address: string;
  leaders: TeamLeader[];
}

// 目标群接口
interface TargetGroup {
  id: string;
  name: string;
  memberCount: number;
}

// 从团购活动创建接龙
function CreateDragonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activityId = searchParams.get('activityId');
  
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // 团购活动信息
  const [activityName, setActivityName] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityStartTime, setActivityStartTime] = useState('');
  const [activityEndTime, setActivityEndTime] = useState('');
  const [products, setProducts] = useState<DragonProduct[]>([]);
  
  // 接龙信息
  const [dragonName, setDragonName] = useState('');
  const [description, setDescription] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // 关联信息
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [selectedLeaderIds, setSelectedLeaderIds] = useState<string[]>([]);
  const [targetGroups, setTargetGroups] = useState<TargetGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  
  const [createdDragonId, setCreatedDragonId] = useState<string>('');
  
  // 分享链接相关
  const [shareLinks, setShareLinks] = useState<{ leaderId: string; leaderName: string; storeName: string; shareUrl: string }[]>([]);
  const [copiedLeaderId, setCopiedLeaderId] = useState<string>('');
  const [qrCodeLeader, setQrCodeLeader] = useState<{ id: string; name: string; url: string } | null>(null);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 获取店铺列表（包含团长）
        console.log('[create-dragon] 开始获取店铺列表...');
        const storesRes = await fetch('/api/group-buy/stores/');
        if (storesRes.ok) {
          const storesData = await storesRes.json();
          console.log('[create-dragon] 店铺数据:', storesData);
          if (storesData.success && storesData.data) {
            setStores(storesData.data);
            console.log('[create-dragon] 设置店铺数量:', storesData.data.length);
          }
        } else {
          console.error('[create-dragon] 获取店铺列表失败:', storesRes.status);
        }
        
        // 获取目标群列表
        console.log('[create-dragon] 开始获取目标群列表...');
        const groupsRes = await fetch('/api/group-buy/target-groups/');
        if (groupsRes.ok) {
          const groupsData = await groupsRes.json();
          console.log('[create-dragon] 目标群数据:', groupsData);
          if (groupsData.success && groupsData.data) {
            setTargetGroups(groupsData.data);
            console.log('[create-dragon] 设置目标群数量:', groupsData.data.length);
          }
        } else {
          console.error('[create-dragon] 获取目标群列表失败:', groupsRes.status);
        }
        
        // 如果有activityId，从团购活动加载数据
        if (activityId) {
          const activityRes = await fetch(`/api/group-buy/activities/?id=${activityId}`);
          if (activityRes.ok) {
            const activityData = await activityRes.json();
            if (activityData.success && activityData.data) {
              const activity = activityData.data;
              setActivityName(activity.name);
              setActivityDescription(activity.description || '');
              setActivityStartTime(activity.startTime);
              setActivityEndTime(activity.endTime);
              
              // 接龙名称延续活动名称
              setDragonName(`${activity.name.replace('团购活动', '接龙')}接龙`);
              setDescription(activity.description || '');
              
              // 加载商品列表
              if (activity.products && activity.products.length > 0) {
                setProducts(activity.products.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                  price: p.price,
                  groupPrice: p.groupPrice,
                  stock: p.stock,
                  commissionType: p.commissionType || 'none',
                  commissionValue: p.commissionValue || 0,
                  commission: calculateCommission(p),
                  selected: true,
                })));
              }
            }
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        toast.error('加载数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [activityId]);
  
  // 计算佣金
  const calculateCommission = (product: any): number => {
    if (!product.commissionType || product.commissionType === 'none') return 0;
    if (product.commissionType === 'fixed') return product.commissionValue || 0;
    if (product.commissionType === 'percent') {
      return Math.round(product.groupPrice * (product.commissionValue || 0) / 100 * 100) / 100;
    }
    return 0;
  };

  // 切换商品选择
  const toggleProduct = (productId: string) => {
    setProducts(products.map(p => 
      p.id === productId ? { ...p, selected: !p.selected } : p
    ));
  };

  // 全选/取消全选商品
  const toggleAllProducts = (selected: boolean) => {
    setProducts(products.map(p => ({ ...p, selected })));
  };

  // 切换店铺选择
  const toggleStore = (storeId: string) => {
    setSelectedStoreIds(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  // 切换团长选择
  const toggleLeader = (leaderId: string) => {
    setSelectedLeaderIds(prev => 
      prev.includes(leaderId) 
        ? prev.filter(id => id !== leaderId)
        : [...prev, leaderId]
    );
  };

  // 切换目标群选择
  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // 计算选中商品数量
  const selectedCount = products.filter(p => p.selected).length;

  // 创建接龙
  const handleCreateDragon = async () => {
    if (!dragonName.trim()) {
      toast.error('请输入接龙名称');
      return;
    }
    
    if (selectedCount === 0) {
      toast.error('请至少选择一个商品');
      return;
    }
    
    if (!endTime) {
      toast.error('请选择截止时间');
      return;
    }
    
    if (selectedLeaderIds.length === 0) {
      toast.error('请至少选择一个团长');
      return;
    }
    
    try {
      setCreating(true);
      
      // 调用API创建接龙
      const response = await fetch('/api/group-buy/dragon/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: dragonName,
          description,
          activityId,
          products: products.filter(p => p.selected).map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            groupPrice: p.groupPrice,
            stock: p.stock,
            commissionType: p.commissionType,
            commissionValue: p.commissionValue,
          })),
          storeIds: selectedStoreIds,
          leaderIds: selectedLeaderIds,
          targetGroupIds: selectedGroupIds,
          endTime,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCreatedDragonId(result.data.id);
        
        // 生成每个团长的专属分享链接
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
        const links: { leaderId: string; leaderName: string; storeName: string; shareUrl: string }[] = [];
        
        selectedLeaderIds.forEach(leaderId => {
          const store = stores.find(s => s.leaders?.some((l: TeamLeader) => l.id === leaderId));
          const leader = store?.leaders?.find((l: TeamLeader) => l.id === leaderId);
          if (leader) {
            links.push({
              leaderId: leader.id,
              leaderName: leader.name,
              storeName: store?.name || '',
              shareUrl: `${baseUrl}/dragon/${result.data.id}?leaderId=${leader.id}`,
            });
          }
        });
        
        setShareLinks(links);
        toast.success('接龙创建成功');
      } else {
        toast.error(result.error || '创建失败');
      }
    } catch (error) {
      console.error('创建接龙失败:', error);
      toast.error('创建接龙失败');
    } finally {
      setCreating(false);
    }
  };

  // 复制团长分享链接
  const handleCopyLink = async (leaderId: string, shareUrl: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLeaderId(leaderId);
      toast.success('链接已复制');
      setTimeout(() => setCopiedLeaderId(''), 2000);
    } catch {
      toast.error('复制失败，请手动复制');
    }
  };

  // 显示团长二维码
  const handleShowQrCode = (leaderId: string, leaderName: string, shareUrl: string) => {
    setQrCodeLeader({ id: leaderId, name: leaderName, url: shareUrl });
  };

  // 一键通知所有团长
  const handleNotifyAllLeaders = async () => {
    try {
      const response = await fetch('/api/group-buy/dragon/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dragonId: createdDragonId,
          message: `新接龙【${dragonName}】已发布，请点击链接分享到社区群！`,
          links: shareLinks,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`已通知 ${result.notified} 个团长`);
      } else {
        toast.error('通知失败');
      }
    } catch (error) {
      console.error('通知失败:', error);
      toast.error('通知失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 创建成功后的团长分享页面
  if (createdDragonId && shareLinks.length > 0) {
    const selectedProducts = products.filter(p => p.selected);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="接龙创建成功" description="团长专属分享链接已生成，可分享至社区群">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleNotifyAllLeaders}>
              <Send className="h-4 w-4 mr-2" />
              一键通知团长
            </Button>
            <Button variant="outline" asChild>
              <Link href="/group-buy/dragon">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回列表
              </Link>
            </Button>
          </div>
        </PageHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 max-w-6xl">
            {/* 接龙信息概览 */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-600 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-green-900">{dragonName}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-green-700">
                      <span>截止时间：{new Date(endTime).toLocaleString('zh-CN')}</span>
                      <span>•</span>
                      <span>共 {selectedCount} 个商品</span>
                      <span>•</span>
                      <span>{shareLinks.length} 个团长可分享</span>
                    </div>
                    {description && <p className="text-sm text-green-600">{description}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 商品详情展示 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  接龙商品详情
                </CardTitle>
                <CardDescription>
                  顾客下单时可选择的商品列表
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {selectedProducts.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h4 className="font-medium mb-1">{product.name}</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-red-500">¥{product.groupPrice}</span>
                        <span className="text-sm text-muted-foreground line-through">¥{product.price}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>库存: {product.stock}</span>
                        {product.commissionType !== 'none' && (
                          <span className="text-blue-600">佣金: ¥{product.commission}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 接龙订单链接 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  接龙订单链接
                </CardTitle>
                <CardDescription>
                  顾客通过此链接下单，订单归属对应团长
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={`${baseUrl}/dragon/${createdDragonId}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`${baseUrl}/dragon/${createdDragonId}`);
                      toast.success('接龙链接已复制');
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    复制链接
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  提示：此链接为接龙主页，顾客可选择团长后下单。如需指定团长，请使用下方的团长专属链接。
                </p>
              </CardContent>
            </Card>

            {/* 团长专属分享链接 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  团长专属分享链接
                </CardTitle>
                <CardDescription>
                  每个团长有专属链接，顾客下单后订单自动归属该团长
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px]">团长姓名</TableHead>
                        <TableHead className="min-w-[100px]">所属店铺</TableHead>
                        <TableHead className="min-w-[200px]">专属分享链接</TableHead>
                        <TableHead className="min-w-[80px] text-center">二维码</TableHead>
                        <TableHead className="min-w-[60px] text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shareLinks.map((link) => (
                        <TableRow key={link.leaderId}>
                          <TableCell className="font-medium">{link.leaderName}</TableCell>
                          <TableCell>{link.storeName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input
                                value={link.shareUrl}
                                readOnly
                                className="text-xs h-8 min-w-0"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShowQrCode(link.leaderId, link.leaderName, link.shareUrl)}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(link.leaderId, link.shareUrl)}
                            >
                              {copiedLeaderId === link.leaderId ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* 分佣说明 */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Share2 className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-blue-900">分佣规则说明</p>
                    <ul className="text-blue-700 space-y-1 list-disc list-inside">
                      <li>团长通过专属链接分享，顾客下单后订单自动归属该团长</li>
                      <li>订单佣金按团购活动的佣金设置计算</li>
                      <li>可直接复制链接发送给团长，或生成二维码让团长扫码分享</li>
                      <li>顾客扫描二维码后可直接进入接龙下单页面</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* 二维码弹窗 - 包含商品详情 */}
        <Dialog open={!!qrCodeLeader} onOpenChange={() => setQrCodeLeader(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{qrCodeLeader?.name} 的接龙二维码</DialogTitle>
              <DialogDescription>
                团长扫码后可直接分享接龙给顾客
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* 二维码区域 */}
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <QrCode className="h-20 w-20 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">扫码下单</p>
                  </div>
                </div>
              </div>
              
              {/* 接龙信息 */}
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <h4 className="font-medium">{dragonName}</h4>
                <p className="text-sm text-muted-foreground">截止：{new Date(endTime).toLocaleString('zh-CN')}</p>
                <div className="text-sm">
                  <span className="text-muted-foreground">商品：</span>
                  <span>{selectedProducts.length} 款</span>
                </div>
              </div>
              
              {/* 商品列表 */}
              <div className="max-h-40 overflow-y-auto space-y-2">
                {selectedProducts.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span>{p.name}</span>
                    <span className="text-red-500 font-medium">¥{p.groupPrice}</span>
                  </div>
                ))}
                {selectedProducts.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    还有 {selectedProducts.length - 5} 个商品...
                  </p>
                )}
              </div>
              
              {/* 链接和操作 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={qrCodeLeader?.url || ''}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleCopyLink(qrCodeLeader!.id, qrCodeLeader!.url)}
                  >
                    {copiedLeaderId === qrCodeLeader?.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // 创建接龙表单
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="创建接龙" description={`从团购活动「${activityName || '未选择'}」创建接龙`}>
        <Button variant="outline" asChild>
          <Link href="/group-buy">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回团购列表
          </Link>
        </Button>
      </PageHeader>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 max-w-6xl">
          {/* 活动信息 */}
          {activityName && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-green-900">关联团购活动：{activityName}</p>
                    <p className="text-green-700">活动时间：{activityStartTime} ~ {activityEndTime}</p>
                    {activityDescription && <p className="text-green-700">{activityDescription}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* 左侧：商品选择 */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      选择商品
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">已选择 {selectedCount} 个</span>
                      <Button variant="outline" size="sm" onClick={() => toggleAllProducts(true)}>
                        全选
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleAllProducts(false)}>
                        取消全选
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">选择</TableHead>
                          <TableHead className="min-w-[150px]">商品名称</TableHead>
                          <TableHead className="min-w-[80px]">原价</TableHead>
                          <TableHead className="min-w-[80px]">团购价</TableHead>
                          <TableHead className="min-w-[60px]">库存</TableHead>
                          <TableHead className="min-w-[80px]">佣金</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id} className={product.selected ? 'bg-muted/50' : ''}>
                            <TableCell>
                              <Checkbox
                                checked={product.selected}
                                onCheckedChange={() => toggleProduct(product.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>
                              <span className="text-muted-foreground line-through">¥{product.price}</span>
                            </TableCell>
                            <TableCell className="text-red-500 font-medium">¥{product.groupPrice}</TableCell>
                            <TableCell>{product.stock}</TableCell>
                            <TableCell className="text-blue-600">
                              {product.commissionType === 'none' ? '无' : `¥${product.commission}`}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* 关联店铺和团长 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        关联店铺和团长
                      </CardTitle>
                      <CardDescription>
                        选择参与此接龙的店铺和团长，订单将归属对应团长
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // 选择全部店铺
                          const allStoreIds = stores.map(s => s.id);
                          setSelectedStoreIds(allStoreIds);
                          // 选择全部团长
                          const allLeaderIds = stores.flatMap(s => s.leaders?.map(l => l.id) || []);
                          setSelectedLeaderIds(allLeaderIds);
                        }}
                      >
                        全选店铺和团长
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedStoreIds([]);
                          setSelectedLeaderIds([]);
                        }}
                      >
                        清空选择
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {stores.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Store className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>暂无可用店铺</p>
                      <p className="text-xs mt-1">请先在门店管理中添加店铺和团长</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* 统计信息 */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                        <span>已选择 <strong className="text-foreground">{selectedStoreIds.length}</strong> 个店铺</span>
                        <span>•</span>
                        <span>已选择 <strong className="text-foreground">{selectedLeaderIds.length}</strong> 个团长</span>
                      </div>
                      
                      {stores.map((store) => (
                        <div key={store.id} className="border rounded-lg p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Checkbox
                                checked={selectedStoreIds.includes(store.id)}
                                onCheckedChange={() => toggleStore(store.id)}
                              />
                              <span className="font-medium">{store.name}</span>
                              <span className="text-sm text-muted-foreground">{store.address}</span>
                            </div>
                            {store.leaders && store.leaders.length > 0 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  // 选择该店铺的所有团长
                                  const storeLeaderIds = store.leaders?.map(l => l.id) || [];
                                  setSelectedLeaderIds(prev => {
                                    const newSet = new Set([...prev, ...storeLeaderIds]);
                                    return Array.from(newSet);
                                  });
                                  // 同时选中该店铺
                                  if (!selectedStoreIds.includes(store.id)) {
                                    setSelectedStoreIds(prev => [...prev, store.id]);
                                  }
                                }}
                              >
                                选择全部团长
                              </Button>
                            )}
                          </div>
                          {store.leaders && store.leaders.length > 0 ? (
                            <div className="ml-6 space-y-2">
                              {store.leaders.map((leader) => (
                                <div key={leader.id} className="flex flex-wrap items-center gap-2">
                                  <Checkbox
                                    checked={selectedLeaderIds.includes(leader.id)}
                                    onCheckedChange={() => toggleLeader(leader.id)}
                                  />
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span>{leader.name}</span>
                                  <span className="text-sm text-muted-foreground">{leader.community}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="ml-6 text-sm text-muted-foreground">该店铺暂无团长</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 目标群 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    目标群
                  </CardTitle>
                  <CardDescription>
                    选择要推送的目标群，可多选
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {targetGroups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>暂无可用目标群</p>
                      <p className="text-xs mt-1">请先添加社区群组</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {targetGroups.map((group) => (
                        <Badge
                          key={group.id}
                          variant={selectedGroupIds.includes(group.id) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleGroup(group.id)}
                        >
                          {group.name} ({group.memberCount}人)
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 右侧：接龙信息 */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    接龙信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dragonName">接龙名称 *</Label>
                    <Input
                      id="dragonName"
                      value={dragonName}
                      onChange={(e) => setDragonName(e.target.value)}
                      placeholder="输入接龙名称"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">截止时间 *</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">接龙说明</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="输入接龙说明，如配送时间、取货地点等"
                      rows={3}
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleCreateDragon}
                    disabled={creating || selectedCount === 0}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        创建中...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        创建接龙并生成分享链接
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* 分佣说明 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">分佣说明</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>• 创建成功后为每个团长生成专属分享链接</p>
                  <p>• 团长分享后，顾客订单自动归属该团长</p>
                  <p>• 订单佣金按团购活动的佣金设置计算</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default function CreateDragonPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <CreateDragonContent />
    </Suspense>
  );
}
