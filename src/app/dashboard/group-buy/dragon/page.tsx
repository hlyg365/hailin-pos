'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
import {
  MessageCircle,
  Users,
  Package,
  TrendingUp,
  Clock,
  Plus,
  Edit,
  Trash2,
  Share2,
  QrCode,
  Eye,
  CheckCircle,
  XCircle,
  Copy,
  Link as LinkIcon,
  ShoppingCart,
  Timer,
  Gift,
  AlertCircle,
  Download,
  Loader2,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';

// 接龙活动状态
type DragonStatus = 'draft' | 'active' | 'completed' | 'cancelled';

// 佣金类型
type CommissionType = 'none' | 'percent' | 'fixed';

// 商品数据类型
interface AvailableProduct {
  id: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
  barcode?: string;
  imageUrl?: string;
}

// 接龙活动类型
interface DragonActivity {
  id: string;
  title: string;
  description: string;
  product: {
    name: string;
    image: string;
    originalPrice: number;
    groupPrice: number;
  };
  targetCount: number;
  currentCount: number;
  status: DragonStatus;
  startTime: string;
  endTime: string;
  // 关联信息
  storeId: string;
  storeName: string;
  leaderId: string;
  leaderName: string;
  leaderAvatar: string;
  groupId: string;
  groupName: string;
  orders: DragonOrder[];
  createTime: string;
  // 佣金配置
  commissionType: CommissionType;
  commissionValue: number;
  estimatedCommission: number;
}

// 接龙订单类型
interface DragonOrder {
  id: string;
  orderNo: string;
  customer: {
    name: string;
    avatar: string;
    phone: string;
  };
  quantity: number;
  amount: number;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  remark: string;
  createTime: string;
  payTime?: string;
}

export default function GroupDragonPage() {
  const [activities, setActivities] = useState<DragonActivity[]>([
    {
      id: '1',
      title: '新鲜草莓 3斤装',
      description: '产地直发，新鲜美味，限时不限量！',
      product: {
        name: '丹东99草莓 3斤装',
        image: '🍓',
        originalPrice: 89,
        groupPrice: 59,
      },
      targetCount: 50,
      currentCount: 38,
      status: 'active',
      startTime: '2026-03-17 08:00:00',
      endTime: '2026-03-17 20:00:00',
      storeId: 'store_001',
      storeName: '南山店',
      leaderId: 'leader_001',
      leaderName: '张美丽',
      leaderAvatar: '👩',
      groupId: 'group_001',
      groupName: '海邻小区业主群',
      orders: [
        {
          id: '1',
          orderNo: 'JL202603170001',
          customer: { name: '张三', avatar: '👨', phone: '138****1234' },
          quantity: 2,
          amount: 118,
          status: 'paid',
          remark: '',
          createTime: '2026-03-17 08:15:23',
          payTime: '2026-03-17 08:15:45',
        },
        {
          id: '2',
          orderNo: 'JL202603170002',
          customer: { name: '李四', avatar: '👩', phone: '139****5678' },
          quantity: 1,
          amount: 59,
          status: 'paid',
          remark: '尽量挑选大一点的',
          createTime: '2026-03-17 08:20:12',
          payTime: '2026-03-17 08:20:35',
        },
        {
          id: '3',
          orderNo: 'JL202603170003',
          customer: { name: '王五', avatar: '👴', phone: '137****9012' },
          quantity: 3,
          amount: 177,
          status: 'pending',
          remark: '',
          createTime: '2026-03-17 08:35:44',
        },
      ],
      createTime: '2026-03-16 20:00:00',
      commissionType: 'percent',
      commissionValue: 5,
      estimatedCommission: 147.5,
    },
    {
      id: '2',
      title: '进口车厘子 2斤装',
      description: '智利进口，颗颗饱满，甜度爆表！',
      product: {
        name: '智利车厘子 JJ级 2斤装',
        image: '🍒',
        originalPrice: 128,
        groupPrice: 88,
      },
      targetCount: 30,
      currentCount: 30,
      status: 'completed',
      startTime: '2026-03-16 08:00:00',
      endTime: '2026-03-16 18:00:00',
      storeId: 'store_001',
      storeName: '南山店',
      leaderId: 'leader_001',
      leaderName: '张美丽',
      leaderAvatar: '👩',
      groupId: 'group_001',
      groupName: '海邻小区业主群',
      orders: [],
      createTime: '2026-03-15 20:00:00',
      commissionType: 'fixed',
      commissionValue: 3,
      estimatedCommission: 90,
    },
    {
      id: '3',
      title: '有机蔬菜礼盒',
      description: '农场直供，新鲜健康，8种蔬菜组合',
      product: {
        name: '有机蔬菜礼盒 5kg',
        image: '🥬',
        originalPrice: 99,
        groupPrice: 68,
      },
      targetCount: 40,
      currentCount: 0,
      status: 'draft',
      startTime: '2026-03-18 08:00:00',
      endTime: '2026-03-18 20:00:00',
      storeId: 'store_002',
      storeName: '福田店',
      leaderId: 'leader_003',
      leaderName: '李小华',
      leaderAvatar: '👩‍💼',
      groupId: 'group_005',
      groupName: '翠苑社区团购群',
      orders: [],
      createTime: '2026-03-17 10:00:00',
      commissionType: 'percent',
      commissionValue: 4,
      estimatedCommission: 108.8,
    },
  ]);

  // 获取当前域名
  const [domain, setDomain] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 优先使用环境变量，否则使用当前域名
      const projectDomain = process.env.NEXT_PUBLIC_COZE_PROJECT_DOMAIN_DEFAULT;
      if (projectDomain) {
        setDomain(projectDomain);
      } else {
        setDomain(window.location.origin);
      }
    }
  }, []);

  // 总部商品库数据
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // 从总部商品库加载商品数据
  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await fetch('/api/store-products');
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          const products: AvailableProduct[] = [];
          
          result.data.forEach((p: any) => {
            if (p.specs && p.specs.length > 0) {
              p.specs.forEach((spec: any) => {
                products.push({
                  id: spec.barcode || `spec-${spec.id}`,
                  name: p.name + (p.specs.length > 1 ? ` (${spec.name})` : ''),
                  price: spec.price || 0,
                  unit: spec.unit || '个',
                  stock: spec.stock || 0,
                  barcode: spec.barcode,
                });
              });
            } else {
              products.push({
                id: p.id,
                name: p.name,
                price: 0,
                unit: '个',
                stock: 0,
              });
            }
          });
          
          setAvailableProducts(products);
        }
      } catch (error) {
        console.error('[接龙] 加载商品失败:', error);
      } finally {
        setLoadingProducts(false);
      }
    };
    
    loadProducts();
  }, []);

  // 从商品库选择商品时自动填充
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = availableProducts.find(p => p.id === productId);
    if (product) {
      setFormData({
        ...formData,
        productName: product.name,
        originalPrice: product.price,
        productImage: '📦', // 默认图标
      });
    }
  };

  const [selectedActivity, setSelectedActivity] = useState<DragonActivity | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    productName: '',
    productImage: '📦',
    originalPrice: 0,
    groupPrice: 0,
    targetCount: 10,
    startTime: '',
    endTime: '',
    storeId: '',
    leaderId: '',
    groupId: '',
    // 佣金配置
    commissionType: 'percent' as CommissionType,
    commissionValue: 5,
  });

  // 店铺数据
  const stores = [
    { id: 'store_001', name: '南山店' },
    { id: 'store_002', name: '福田店' },
    { id: 'store_003', name: '罗湖店' },
  ];

  // 团长数据
  const leaders = [
    { id: 'leader_001', name: '张美丽', avatar: '👩' },
    { id: 'leader_002', name: '王建国', avatar: '👨' },
    { id: 'leader_003', name: '李小华', avatar: '👩‍💼' },
  ];

  // 团购群数据
  const groupList = [
    { id: 'group_001', name: '海邻小区业主群', leaderId: 'leader_001' },
    { id: 'group_002', name: '海邻团购2群', leaderId: 'leader_001' },
    { id: 'group_003', name: '海邻VIP群', leaderId: 'leader_001' },
    { id: 'group_004', name: '阳光小区团购群', leaderId: 'leader_002' },
    { id: 'group_005', name: '翠苑社区团购群', leaderId: 'leader_003' },
  ];

  const handleCreateActivity = () => {
    setFormData({
      title: '',
      description: '',
      productName: '',
      productImage: '📦',
      originalPrice: 0,
      groupPrice: 0,
      targetCount: 10,
      startTime: '',
      endTime: '',
      storeId: '',
      leaderId: '',
      groupId: '',
      commissionType: 'percent',
      commissionValue: 5,
    });
    setCreateDialogOpen(true);
  };

  const handleSaveActivity = () => {
    const store = stores.find(s => s.id === formData.storeId);
    const leader = leaders.find(l => l.id === formData.leaderId);
    const group = groupList.find(g => g.id === formData.groupId);

    // 计算预估佣金
    const estimatedCommission = formData.commissionType === 'none' ? 0 :
      formData.commissionType === 'percent'
        ? formData.groupPrice * formData.targetCount * (formData.commissionValue / 100)
        : formData.commissionValue * formData.targetCount;
    
    const newActivity: DragonActivity = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      product: {
        name: formData.productName,
        image: formData.productImage,
        originalPrice: formData.originalPrice,
        groupPrice: formData.groupPrice,
      },
      targetCount: formData.targetCount,
      currentCount: 0,
      status: 'draft',
      startTime: formData.startTime,
      endTime: formData.endTime,
      storeId: formData.storeId,
      storeName: store?.name || '',
      leaderId: formData.leaderId,
      leaderName: leader?.name || '',
      leaderAvatar: leader?.avatar || '👤',
      groupId: formData.groupId,
      groupName: group?.name || '',
      orders: [],
      createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      commissionType: formData.commissionType,
      commissionValue: formData.commissionValue,
      estimatedCommission,
    };
    setActivities([newActivity, ...activities]);
    setCreateDialogOpen(false);
  };

  const handleViewDetail = (activity: DragonActivity) => {
    setSelectedActivity(activity);
    setDetailDialogOpen(true);
  };

  const handleShare = (activity: DragonActivity) => {
    setSelectedActivity(activity);
    setShareDialogOpen(true);
  };

  // 生成团长专属分享链接（谁组织谁分享谁收益）
  const generateShareLink = (activity: DragonActivity, leaderId?: string) => {
    const effectiveLeaderId = leaderId || activity.leaderId;
    return domain 
      ? `${domain}/dragon/${activity.id}?leader=${effectiveLeaderId}` 
      : `/dragon/${activity.id}?leader=${effectiveLeaderId}`;
  };

  const handleCopyText = () => {
    // 生成包含组织者ID的专属分享链接
    const shareLink = generateShareLink(selectedActivity!);
    const text = `🔥【群接龙】${selectedActivity?.title}
📦 商品：${selectedActivity?.product.name}
💰 原价：¥${selectedActivity?.product.originalPrice}
🎉 接龙价：¥${selectedActivity?.product.groupPrice}
⏰ 截止时间：${selectedActivity?.endTime}
📝 已接龙：${selectedActivity?.currentCount}/${selectedActivity?.targetCount}件

${selectedActivity?.description}

👇 点击链接参与接龙：
${shareLink}`;
    
    navigator.clipboard.writeText(text);
    alert('接龙文案已复制到剪贴板！');
  };

  // 生成二维码
  const handleGenerateQrCode = () => {
    setQrCodeDialogOpen(true);
  };

  // 下载二维码
  const handleDownloadQrCode = () => {
    if (!qrCodeRef.current) return;
    
    const svg = qrCodeRef.current.querySelector('svg');
    if (!svg) return;
    
    // 创建canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 设置canvas尺寸
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    
    // 绘制白色背景
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);
    
    // 将SVG转换为图片
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      
      // 下载图片
      const link = document.createElement('a');
      link.download = `接龙二维码_${selectedActivity?.title || 'share'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  };

  const handleUpdateOrderStatus = (orderId: string, status: 'paid' | 'completed' | 'cancelled') => {
    if (selectedActivity) {
      const updatedOrders = selectedActivity.orders.map(order =>
        order.id === orderId ? { ...order, status } : order
      );
      const updatedActivity = { ...selectedActivity, orders: updatedOrders };
      setSelectedActivity(updatedActivity);
      setActivities(activities.map(a => a.id === selectedActivity.id ? updatedActivity : a));
    }
  };

  const getStatusBadge = (status: DragonStatus) => {
    const config: Record<DragonStatus, { label: string; className: string }> = {
      draft: { label: '草稿', className: 'bg-gray-500' },
      active: { label: '进行中', className: 'bg-green-500' },
      completed: { label: '已完成', className: 'bg-blue-500' },
      cancelled: { label: '已取消', className: 'bg-red-500' },
    };
    return <Badge className={config[status].className}>{config[status].label}</Badge>;
  };

  const getOrderStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: '待付款', className: 'bg-yellow-500' },
      paid: { label: '已付款', className: 'bg-blue-500' },
      completed: { label: '已完成', className: 'bg-green-500' },
      cancelled: { label: '已取消', className: 'bg-red-500' },
    };
    return <Badge className={config[status].className}>{config[status].label}</Badge>;
  };

  const activeCount = activities.filter(a => a.status === 'active').length;
  const completedCount = activities.filter(a => a.status === 'completed').length;
  const totalOrders = activities.reduce((sum, a) => sum + a.orders.length, 0);
  const totalAmount = activities.reduce((sum, a) => 
    sum + a.orders.reduce((s, o) => s + o.amount, 0), 0
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="群接龙管理" description="管理微信群接龙活动和订单">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShareDialogOpen(true)}>
            <LinkIcon className="h-4 w-4 mr-2" />
            接龙链接
          </Button>
          <Button onClick={handleCreateActivity}>
            <Plus className="h-4 w-4 mr-2" />
            创建接龙
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">进行中</p>
                    <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                  </div>
                  <Timer className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">已完成</p>
                    <p className="text-2xl font-bold text-blue-600">{completedCount}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总订单</p>
                    <p className="text-2xl font-bold">{totalOrders}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总金额</p>
                    <p className="text-2xl font-bold">¥{totalAmount.toFixed(0)}</p>
                  </div>
                  <Gift className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 接龙活动列表 */}
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">全部活动</TabsTrigger>
              <TabsTrigger value="active">进行中</TabsTrigger>
              <TabsTrigger value="completed">已完成</TabsTrigger>
              <TabsTrigger value="draft">草稿</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activities.map((activity) => (
                  <Card key={activity.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-40 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                      <span className="text-7xl">{activity.product.image}</span>
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(activity.status)}
                      </div>
                      {activity.status === 'active' && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                          <div className="flex items-center justify-between text-white text-sm">
                            <span>进度: {activity.currentCount}/{activity.targetCount}</span>
                            <span>{Math.round((activity.currentCount / activity.targetCount) * 100)}%</span>
                          </div>
                          <Progress 
                            value={(activity.currentCount / activity.targetCount) * 100} 
                            className="h-1.5 mt-1"
                          />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2 truncate">{activity.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl font-bold text-red-500">
                          ¥{activity.product.groupPrice}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          ¥{activity.product.originalPrice}
                        </span>
                        <Badge variant="outline" className="ml-auto">
                          省¥{activity.product.originalPrice - activity.product.groupPrice}
                        </Badge>
                      </div>
                      {/* 佣金显示 */}
                      {activity.commissionType !== 'none' && (
                        <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 rounded-lg">
                          <Award className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-blue-600">
                            佣金: {activity.commissionType === 'percent'
                              ? `${activity.commissionValue}%`
                              : `¥${activity.commissionValue}/件`}
                            {activity.estimatedCommission > 0 && (
                              <span className="ml-2 font-medium">
                                (预估 ¥{activity.estimatedCommission.toFixed(2)})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Clock className="h-4 w-4" />
                        <span>{activity.endTime} 截止</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Users className="h-4 w-4" />
                        <span>{activity.groupName}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {activity.orders.length} 单
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleViewDetail(activity)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          详情
                        </Button>
                        {activity.status === 'active' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleShare(activity)}
                          >
                            <Share2 className="h-4 w-4 mr-1" />
                            分享
                          </Button>
                        )}
                        {activity.status === 'draft' && (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => setActivities(activities.map(a => 
                              a.id === activity.id ? { ...a, status: 'active' } : a
                            ))}
                          >
                            发布
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="active">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activities.filter(a => a.status === 'active').map((activity) => (
                  <Card key={activity.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-40 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                      <span className="text-7xl">{activity.product.image}</span>
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(activity.status)}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                        <div className="flex items-center justify-between text-white text-sm">
                          <span>进度: {activity.currentCount}/{activity.targetCount}</span>
                          <span>{Math.round((activity.currentCount / activity.targetCount) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(activity.currentCount / activity.targetCount) * 100} 
                          className="h-1.5 mt-1"
                        />
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2 truncate">{activity.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl font-bold text-red-500">
                          ¥{activity.product.groupPrice}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          ¥{activity.product.originalPrice}
                        </span>
                        <Badge variant="outline" className="ml-auto">
                          省¥{activity.product.originalPrice - activity.product.groupPrice}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Clock className="h-4 w-4" />
                        <span>{activity.endTime} 截止</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Users className="h-4 w-4" />
                        <span>{activity.groupName}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {activity.orders.length} 单
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleViewDetail(activity)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          详情
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleShare(activity)}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          分享
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activities.filter(a => a.status === 'completed').map((activity) => (
                  <Card key={activity.id} className="overflow-hidden hover:shadow-lg transition-shadow opacity-75">
                    <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-7xl">{activity.product.image}</span>
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2 truncate">{activity.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl font-bold text-gray-500">
                          ¥{activity.product.groupPrice}
                        </span>
                        <Badge variant="outline" className="ml-auto">
                          已成交 {activity.currentCount} 件
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Users className="h-4 w-4" />
                        <span>{activity.groupName}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {activity.orders.length} 单
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleViewDetail(activity)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          详情
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="draft">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activities.filter(a => a.status === 'draft').map((activity) => (
                  <Card key={activity.id} className="overflow-hidden hover:shadow-lg transition-shadow border-dashed border-2 border-gray-300">
                    <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                      <span className="text-7xl">{activity.product.image}</span>
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2 truncate">{activity.title || '未设置标题'}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {activity.description || '暂无描述'}
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-gray-600">
                          {activity.product.name || '未选择商品'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl font-bold text-red-500">
                          ¥{activity.product.groupPrice || 0}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          ¥{activity.product.originalPrice || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Package className="h-4 w-4" />
                        <span>目标: {activity.targetCount} 件</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleViewDetail(activity)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          详情
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setActivities(activities.map(a => 
                            a.id === activity.id ? { ...a, status: 'active' } : a
                          ))}
                        >
                          发布
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {activities.filter(a => a.status === 'draft').length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无草稿接龙</p>
                    <Button variant="outline" className="mt-4" onClick={handleCreateActivity}>
                      <Plus className="h-4 w-4 mr-2" />
                      创建接龙
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 创建接龙对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>创建群接龙</DialogTitle>
            <DialogDescription>
              创建新的微信群接龙活动
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>接龙标题</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例如：新鲜草莓 3斤装"
                />
              </div>
              <div className="space-y-2">
                <Label>目标数量</Label>
                <Input
                  type="number"
                  value={formData.targetCount}
                  onChange={(e) => setFormData({ ...formData, targetCount: Number(e.target.value) })}
                  placeholder="接龙目标数量"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>接龙描述</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="描述商品特点和优惠信息"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>关联店铺</Label>
                <Select value={formData.storeId} onValueChange={(value) => setFormData({ ...formData, storeId: value, leaderId: '', groupId: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择店铺" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>关联团长</Label>
                <Select 
                  value={formData.leaderId} 
                  onValueChange={(value) => setFormData({ ...formData, leaderId: value, groupId: '' })}
                  disabled={!formData.storeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.storeId ? "选择团长" : "请先选择店铺"} />
                  </SelectTrigger>
                  <SelectContent>
                    {leaders.filter(l => {
                      // 根据店铺过滤团长（这里可以添加更复杂的过滤逻辑）
                      return formData.storeId;
                    }).map(leader => (
                      <SelectItem key={leader.id} value={leader.id}>
                        {leader.avatar} {leader.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
                <Label>从商品库选择（可选）</Label>
                <Select 
                  value={selectedProductId} 
                  onValueChange={handleProductSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingProducts ? "加载中..." : "选择商品自动填充信息"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingProducts ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">加载中...</span>
                      </div>
                    ) : availableProducts.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        暂无商品，请先在总部商品库添加
                      </div>
                    ) : (
                      availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - ¥{product.price.toFixed(2)}/{product.unit}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>商品名称 *</Label>
                <Input
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="商品名称"
                />
              </div>
              <div className="space-y-2">
                <Label>商品图标</Label>
                <Input
                  value={formData.productImage}
                  onChange={(e) => setFormData({ ...formData, productImage: e.target.value })}
                  placeholder="表情符号"
                />
              </div>
              <div className="space-y-2">
                <Label>目标群</Label>
                <Select 
                  value={formData.groupId} 
                  onValueChange={(value) => setFormData({ ...formData, groupId: value })}
                  disabled={!formData.leaderId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.leaderId ? "选择群" : "请先选择团长"} />
                  </SelectTrigger>
                  <SelectContent>
                    {groupList.filter(g => {
                      // 根据团长过滤群组
                      return formData.leaderId === g.leaderId;
                    }).map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>原价（元） *</Label>
                <Input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                  placeholder="商品原价"
                />
              </div>
              <div className="space-y-2">
                <Label>接龙价（元） *</Label>
                <Input
                  type="number"
                  value={formData.groupPrice}
                  onChange={(e) => setFormData({ ...formData, groupPrice: Number(e.target.value) })}
                  placeholder="接龙优惠价"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始时间</Label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>截止时间</Label>
                <Input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            {/* 佣金设置 */}
            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4" />
                佣金设置
              </h4>
              <div className="flex items-center gap-4">
                <div className="w-32">
                  <Label className="text-xs text-muted-foreground">佣金类型</Label>
                  <Select
                    value={formData.commissionType}
                    onValueChange={(value: CommissionType) => setFormData({ ...formData, commissionType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无佣金</SelectItem>
                      <SelectItem value="percent">按比例</SelectItem>
                      <SelectItem value="fixed">固定金额</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.commissionType !== 'none' && (
                  <>
                    <div className="w-28">
                      <Label className="text-xs text-muted-foreground">
                        佣金{formData.commissionType === 'percent' ? '(%)' : '(元/件)'}
                      </Label>
                      <Input
                        type="number"
                        placeholder="佣金值"
                        value={formData.commissionValue}
                        onChange={(e) => setFormData({ ...formData, commissionValue: Number(e.target.value) })}
                      />
                    </div>
                    <div className="flex-1 text-sm text-muted-foreground">
                      {formData.groupPrice > 0 && formData.targetCount > 0 && (
                        <span className="text-blue-600">
                          预估佣金：¥{formData.commissionType === 'percent'
                            ? (formData.groupPrice * formData.targetCount * formData.commissionValue / 100).toFixed(2)
                            : (formData.commissionValue * formData.targetCount).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button variant="secondary" onClick={handleSaveActivity}>
              保存草稿
            </Button>
            <Button onClick={() => { handleSaveActivity(); setCreateDialogOpen(false); }}>
              创建并发布
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 接龙详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>接龙详情 - {selectedActivity?.title}</DialogTitle>
            <DialogDescription>
              查看接龙订单和进度
            </DialogDescription>
          </DialogHeader>
          
          {selectedActivity && (
            <div className="space-y-4">
              {/* 活动信息 */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <span className="text-5xl">{selectedActivity.product.image}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{selectedActivity.product.name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-2xl font-bold text-red-500">
                      ¥{selectedActivity.product.groupPrice}
                    </span>
                    <span className="text-muted-foreground line-through">
                      ¥{selectedActivity.product.originalPrice}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">接龙进度</div>
                  <div className="text-2xl font-bold">
                    {selectedActivity.currentCount}/{selectedActivity.targetCount}
                  </div>
                  <Progress 
                    value={(selectedActivity.currentCount / selectedActivity.targetCount) * 100}
                    className="w-24 h-2 mt-2"
                  />
                </div>
              </div>

              {/* 佣金信息 */}
              {selectedActivity.commissionType !== 'none' && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">团长佣金</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {selectedActivity.commissionType === 'percent'
                        ? `${selectedActivity.commissionValue}%`
                        : `¥${selectedActivity.commissionValue}/件`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      预估: ¥{selectedActivity.estimatedCommission.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* 订单列表 */}
              <div>
                <h4 className="font-medium mb-3">接龙订单 ({selectedActivity.orders.length})</h4>
                {selectedActivity.orders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>订单信息</TableHead>
                        <TableHead>客户</TableHead>
                        <TableHead>数量</TableHead>
                        <TableHead>金额</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedActivity.orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.orderNo}</div>
                              <div className="text-xs text-muted-foreground">{order.createTime}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{order.customer.avatar}</span>
                              <div>
                                <div className="font-medium">{order.customer.name}</div>
                                <div className="text-xs text-muted-foreground">{order.customer.phone}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{order.quantity}件</TableCell>
                          <TableCell className="font-bold">¥{order.amount}</TableCell>
                          <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {order.status === 'pending' && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleUpdateOrderStatus(order.id, 'paid')}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                  >
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  </Button>
                                </>
                              )}
                              {order.status === 'paid' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无接龙订单
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
            <Button onClick={() => { setDetailDialogOpen(false); handleShare(selectedActivity!); }}>
              <Share2 className="h-4 w-4 mr-2" />
              分享到群
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 分享对话框 */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分享到微信群</DialogTitle>
            <DialogDescription>
              复制接龙文案分享到微信群
            </DialogDescription>
          </DialogHeader>
          
          {selectedActivity && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap font-mono">
                {`🔥【群接龙】${selectedActivity.title}
📦 商品：${selectedActivity.product.name}
💰 原价：¥${selectedActivity.product.originalPrice}
🎉 接龙价：¥${selectedActivity.product.groupPrice}
⏰ 截止时间：${selectedActivity.endTime}
📝 已接龙：${selectedActivity.currentCount}/${selectedActivity.targetCount}件

${selectedActivity.description}

👇 点击链接参与接龙：
${domain ? `${domain}/dragon/${selectedActivity.id}` : `/dragon/${selectedActivity.id}`}`}
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleCopyText}>
                  <Copy className="h-4 w-4 mr-2" />
                  复制文案
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleGenerateQrCode}>
                  <QrCode className="h-4 w-4 mr-2" />
                  生成二维码
                </Button>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  复制文案后，打开微信群粘贴发送即可
                </span>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 二维码对话框 */}
      <Dialog open={qrCodeDialogOpen} onOpenChange={setQrCodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>接龙二维码</DialogTitle>
            <DialogDescription>
              扫描二维码参与接龙，订单自动归属组织者
            </DialogDescription>
          </DialogHeader>
          
          {selectedActivity && (
            <div className="flex flex-col items-center gap-4 py-4">
              {/* 组织者信息 */}
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg w-full">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                  {selectedActivity.leaderAvatar}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedActivity.leaderName}</p>
                  <p className="text-xs text-muted-foreground">组织者 · 分享接龙</p>
                </div>
                {selectedActivity.commissionType !== 'none' && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">收益</p>
                    <p className="text-sm font-medium text-blue-600">
                      {selectedActivity.commissionType === 'percent' 
                        ? `${selectedActivity.commissionValue}%` 
                        : `¥${selectedActivity.commissionValue}/件`}
                    </p>
                  </div>
                )}
              </div>

              {/* 二维码 */}
              <div 
                ref={qrCodeRef}
                className="p-4 bg-white border rounded-lg shadow-sm"
              >
                <QRCodeSVG
                  value={generateShareLink(selectedActivity)}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              {/* 活动信息 */}
              <div className="text-center">
                <div className="font-medium text-lg">{selectedActivity.title}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  接龙价：¥{selectedActivity.product.groupPrice}
                </div>
              </div>
              
              {/* 下载按钮 */}
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1" onClick={() => setQrCodeDialogOpen(false)}>
                  关闭
                </Button>
                <Button className="flex-1" onClick={handleDownloadQrCode}>
                  <Download className="h-4 w-4 mr-2" />
                  下载二维码
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
