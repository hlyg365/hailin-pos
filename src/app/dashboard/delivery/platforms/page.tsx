'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
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
  Truck,
  Plus,
  Edit,
  Trash2,
  Settings,
  Link as LinkIcon,
  Unlink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Package,
  ShoppingCart,
  Store,
  Smartphone,
  Wifi,
  WifiOff,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Power,
  PowerOff,
  Copy,
  Download,
  Upload,
  MapPin,
  Phone,
  User,
  DollarSign,
  TrendingUp,
  BarChart3,
  Zap,
  Globe,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// 外卖平台类型 - 扩展支持更多平台
type PlatformType = 'meituan' | 'eleme' | 'jddj' | 'jdwm' | 'taobao' | 'douyin' | 'custom';

// 平台状态
type PlatformStatus = 'connected' | 'disconnected' | 'error' | 'pending';

// 订单状态
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'completed' | 'cancelled';

// 平台配置信息
interface PlatformConfig {
  name: string;
  logo: string;
  color: string;
  bgColor: string;
  description: string;
  features: string[];
  apiDocUrl?: string;
}

// 平台详细配置
const platformConfigs: Record<PlatformType, PlatformConfig> = {
  meituan: {
    name: '美团外卖',
    logo: '🟡',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    description: '中国最大的外卖平台之一',
    features: ['订单同步', '库存同步', '自动接单', '营销活动同步'],
    apiDocUrl: 'https://developer.meituan.com/',
  },
  eleme: {
    name: '饿了么',
    logo: '🔵',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: '阿里巴巴旗下外卖平台',
    features: ['订单同步', '库存同步', '自动接单', '会员打通'],
    apiDocUrl: 'https://open.ele.me/',
  },
  jddj: {
    name: '京东到家',
    logo: '🔴',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: '京东旗下即时零售平台',
    features: ['订单同步', '库存同步', '配送管理', '品质保障'],
    apiDocUrl: 'https://open.jddj.com/',
  },
  jdwm: {
    name: '京东外卖',
    logo: '🟠',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: '京东旗下外卖配送服务',
    features: ['订单同步', '库存同步', '快速配送', '品质外卖'],
    apiDocUrl: 'https://open.jddj.com/',
  },
  taobao: {
    name: '淘宝闪购',
    logo: '🟣',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: '淘宝旗下即时购物服务',
    features: ['订单同步', '库存同步', '直播带货', '社群营销'],
    apiDocUrl: 'https://open.taobao.com/',
  },
  douyin: {
    name: '抖音外卖',
    logo: '⚫',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
    description: '抖音旗下本地生活服务',
    features: ['订单同步', '库存同步', '直播带货', '短视频营销'],
    apiDocUrl: 'https://developer.open-douyin.com/',
  },
  custom: {
    name: '自定义平台',
    logo: '⚪',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: '自定义对接其他外卖平台',
    features: ['自定义API', '灵活配置'],
  },
};

// 外卖平台配置
interface DeliveryPlatform {
  id: string;
  name: string;
  type: PlatformType;
  logo: string;
  status: PlatformStatus;
  // API配置
  appId: string;
  appSecret: string;
  shopId: string;
  shopName: string;
  callbackUrl?: string;
  // 同步设置
  autoSync: boolean;
  syncInterval: number;
  autoPrint: boolean;
  autoAccept: boolean;
  // 库存同步
  syncStock: boolean;
  syncPrice: boolean; // 价格同步
  lowStockThreshold: number;
  // 营销同步
  syncPromotion: boolean;
  // 统计
  todayOrders: number;
  todayAmount: number;
  totalOrders: number;
  totalAmount: number;
  // 时间
  lastSyncTime?: string;
  connectedAt?: string;
  createTime: string;
}

// 外卖订单
interface DeliveryOrder {
  id: string;
  platformOrderNo: string;
  platform: PlatformType;
  platformName: string;
  status: OrderStatus;
  orderType: 'delivery' | 'pickup';
  // 顾客信息
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  remark?: string;
  // 商品信息
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  // 金额
  totalAmount: number;
  deliveryFee: number;
  packageFee: number;
  discount: number;
  payAmount: number;
  // 时间
  orderTime: string;
  expectTime?: string;
  acceptTime?: string;
  completeTime?: string;
  // 配送
  riderName?: string;
  riderPhone?: string;
  // 同步状态
  synced: boolean;
  syncedAt?: string;
}

// 菜品映射 - 支持一对多
interface DishMapping {
  id: string;
  // 本地商品信息
  localProductId: string;
  localProductName: string;
  localPrice: number;
  localStock: number;
  // 平台映射信息（一个商品可映射到多个平台）
  platformMappings: {
    platform: PlatformType;
    platformDishId: string;
    platformDishName: string;
    platformPrice: number;
    platformStock: number;
    stockDiff: number;
    syncStock: boolean;
    syncPrice: boolean;
    status: 'mapped' | 'unmapped' | 'error' | 'pending';
  }[];
  // 统计
  totalPlatforms: number;
  mappedPlatforms: number;
}

// 订单状态配置
const orderStatusConfig: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: '待接单', color: 'bg-yellow-500' },
  confirmed: { label: '已接单', color: 'bg-blue-500' },
  preparing: { label: '备货中', color: 'bg-purple-500' },
  delivering: { label: '配送中', color: 'bg-orange-500' },
  completed: { label: '已完成', color: 'bg-green-500' },
  cancelled: { label: '已取消', color: 'bg-gray-500' },
};

export default function DeliveryPlatformsPage() {
  // 外卖平台列表
  const [platforms, setPlatforms] = useState<DeliveryPlatform[]>([
    {
      id: 'plat_001',
      name: '美团外卖',
      type: 'meituan',
      logo: '🟡',
      status: 'connected',
      appId: 'mt_app_12345',
      appSecret: '************',
      shopId: 'mt_shop_001',
      shopName: '海邻到家南山店',
      callbackUrl: 'https://api.hailin.com/callback/meituan',
      autoSync: true,
      syncInterval: 30,
      autoPrint: true,
      autoAccept: false,
      syncStock: true,
      syncPrice: true,
      lowStockThreshold: 5,
      syncPromotion: true,
      todayOrders: 28,
      todayAmount: 1856.50,
      totalOrders: 1256,
      totalAmount: 89560.00,
      lastSyncTime: '2026-03-17 11:45:30',
      connectedAt: '2025-01-15 10:00:00',
      createTime: '2025-01-15 09:00:00',
    },
    {
      id: 'plat_002',
      name: '饿了么',
      type: 'eleme',
      logo: '🔵',
      status: 'connected',
      appId: 'el_app_67890',
      appSecret: '************',
      shopId: 'el_shop_001',
      shopName: '海邻到家南山店',
      callbackUrl: 'https://api.hailin.com/callback/eleme',
      autoSync: true,
      syncInterval: 30,
      autoPrint: true,
      autoAccept: true,
      syncStock: true,
      syncPrice: true,
      lowStockThreshold: 5,
      syncPromotion: true,
      todayOrders: 15,
      todayAmount: 980.30,
      totalOrders: 623,
      totalAmount: 45230.00,
      lastSyncTime: '2026-03-17 11:44:15',
      connectedAt: '2025-02-20 14:30:00',
      createTime: '2025-02-20 14:00:00',
    },
    {
      id: 'plat_003',
      name: '京东到家',
      type: 'jddj',
      logo: '🔴',
      status: 'connected',
      appId: 'jd_app_11111',
      appSecret: '************',
      shopId: 'jd_shop_001',
      shopName: '海邻到家南山店',
      autoSync: true,
      syncInterval: 60,
      autoPrint: true,
      autoAccept: false,
      syncStock: true,
      syncPrice: false,
      lowStockThreshold: 5,
      syncPromotion: false,
      todayOrders: 8,
      todayAmount: 526.80,
      totalOrders: 234,
      totalAmount: 15680.00,
      lastSyncTime: '2026-03-17 11:40:00',
      connectedAt: '2025-03-01 09:00:00',
      createTime: '2025-03-01 08:00:00',
    },
    {
      id: 'plat_004',
      name: '京东外卖',
      type: 'jdwm',
      logo: '🟠',
      status: 'pending',
      appId: '',
      appSecret: '',
      shopId: '',
      shopName: '',
      autoSync: false,
      syncInterval: 60,
      autoPrint: false,
      autoAccept: false,
      syncStock: false,
      syncPrice: false,
      lowStockThreshold: 5,
      syncPromotion: false,
      todayOrders: 0,
      todayAmount: 0,
      totalOrders: 0,
      totalAmount: 0,
      createTime: '2026-03-17 10:00:00',
    },
    {
      id: 'plat_005',
      name: '淘宝闪购',
      type: 'taobao',
      logo: '🟣',
      status: 'disconnected',
      appId: '',
      appSecret: '',
      shopId: '',
      shopName: '',
      autoSync: false,
      syncInterval: 60,
      autoPrint: false,
      autoAccept: false,
      syncStock: false,
      syncPrice: false,
      lowStockThreshold: 5,
      syncPromotion: false,
      todayOrders: 0,
      todayAmount: 0,
      totalOrders: 0,
      totalAmount: 0,
      createTime: '2026-03-17 10:00:00',
    },
    {
      id: 'plat_006',
      name: '抖音外卖',
      type: 'douyin',
      logo: '⚫',
      status: 'disconnected',
      appId: '',
      appSecret: '',
      shopId: '',
      shopName: '',
      autoSync: false,
      syncInterval: 60,
      autoPrint: false,
      autoAccept: false,
      syncStock: false,
      syncPrice: false,
      lowStockThreshold: 5,
      syncPromotion: false,
      todayOrders: 0,
      todayAmount: 0,
      totalOrders: 0,
      totalAmount: 0,
      createTime: '2026-03-17 10:00:00',
    },
  ]);

  // 菜品映射列表
  const [dishMappings, setDishMappings] = useState<DishMapping[]>([
    {
      id: 'map_001',
      localProductId: 'prod_001',
      localProductName: '进口香蕉 500g',
      localPrice: 5.9,
      localStock: 50,
      platformMappings: [
        { platform: 'meituan', platformDishId: 'mt_001', platformDishName: '进口香蕉 500g', platformPrice: 8.9, platformStock: 48, stockDiff: 2, syncStock: true, syncPrice: true, status: 'mapped' },
        { platform: 'eleme', platformDishId: 'el_001', platformDishName: '进口香蕉', platformPrice: 7.5, platformStock: 50, stockDiff: 0, syncStock: true, syncPrice: true, status: 'mapped' },
        { platform: 'jddj', platformDishId: 'jd_001', platformDishName: '进口香蕉500g', platformPrice: 6.9, platformStock: 45, stockDiff: 5, syncStock: true, syncPrice: false, status: 'mapped' },
      ],
      totalPlatforms: 3,
      mappedPlatforms: 3,
    },
    {
      id: 'map_002',
      localProductId: 'prod_002',
      localProductName: '纯牛奶 250ml*12',
      localPrice: 35.9,
      localStock: 30,
      platformMappings: [
        { platform: 'meituan', platformDishId: 'mt_002', platformDishName: '纯牛奶整箱装', platformPrice: 42.0, platformStock: 28, stockDiff: 2, syncStock: true, syncPrice: true, status: 'mapped' },
        { platform: 'eleme', platformDishId: 'el_002', platformDishName: '纯牛奶250ml*12', platformPrice: 39.9, platformStock: 30, stockDiff: 0, syncStock: true, syncPrice: true, status: 'mapped' },
      ],
      totalPlatforms: 2,
      mappedPlatforms: 2,
    },
    {
      id: 'map_003',
      localProductId: 'prod_003',
      localProductName: '有机西红柿 500g',
      localPrice: 6.5,
      localStock: 25,
      platformMappings: [
        { platform: 'meituan', platformDishId: 'mt_003', platformDishName: '有机西红柿 500g', platformPrice: 8.5, platformStock: 25, stockDiff: 0, syncStock: true, syncPrice: true, status: 'mapped' },
        { platform: 'eleme', platformDishId: 'el_003', platformDishName: '有机西红柿', platformPrice: 8.5, platformStock: 22, stockDiff: -3, syncStock: true, syncPrice: true, status: 'mapped' },
        { platform: 'jddj', platformDishId: 'jd_003', platformDishName: '有机西红柿500g', platformPrice: 7.9, platformStock: 25, stockDiff: 0, syncStock: true, syncPrice: false, status: 'mapped' },
        { platform: 'taobao', platformDishId: '', platformDishName: '', platformPrice: 0, platformStock: 0, stockDiff: 0, syncStock: false, syncPrice: false, status: 'pending' },
      ],
      totalPlatforms: 4,
      mappedPlatforms: 3,
    },
    {
      id: 'map_004',
      localProductId: 'prod_004',
      localProductName: '土鸡蛋 30枚',
      localPrice: 28.0,
      localStock: 20,
      platformMappings: [
        { platform: 'meituan', platformDishId: 'mt_004', platformDishName: '土鸡蛋30枚装', platformPrice: 32.0, platformStock: 20, stockDiff: 0, syncStock: true, syncPrice: false, status: 'mapped' },
        { platform: 'eleme', platformDishId: '', platformDishName: '', platformPrice: 0, platformStock: 0, stockDiff: 0, syncStock: false, syncPrice: false, status: 'unmapped' },
      ],
      totalPlatforms: 2,
      mappedPlatforms: 1,
    },
  ]);

  const [selectedPlatform, setSelectedPlatform] = useState<DeliveryPlatform | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<DishMapping | null>(null);
  const [platformDialogOpen, setPlatformDialogOpen] = useState(false);
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<DeliveryPlatform>>({});
  const [expandedMapping, setExpandedMapping] = useState<string | null>(null);

  // 统计数据
  const stats = {
    connectedPlatforms: platforms.filter(p => p.status === 'connected').length,
    pendingPlatforms: platforms.filter(p => p.status === 'pending').length,
    todayOrders: platforms.reduce((sum, p) => sum + p.todayOrders, 0),
    todayAmount: platforms.reduce((sum, p) => sum + p.todayAmount, 0),
    totalMappings: dishMappings.length,
    mappedRate: dishMappings.length > 0 
      ? Math.round(dishMappings.reduce((sum, m) => sum + m.mappedPlatforms, 0) / dishMappings.reduce((sum, m) => sum + m.totalPlatforms, 0) * 100)
      : 0,
  };

  // 打开平台配置对话框
  const handleEditPlatform = (platform: DeliveryPlatform | null) => {
    setSelectedPlatform(platform);
    if (platform) {
      setFormData({ ...platform });
    } else {
      setFormData({
        name: '',
        type: 'meituan',
        status: 'disconnected',
        autoSync: true,
        syncInterval: 30,
        autoPrint: true,
        autoAccept: false,
        syncStock: true,
        syncPrice: true,
        lowStockThreshold: 5,
        syncPromotion: true,
        todayOrders: 0,
        todayAmount: 0,
        totalOrders: 0,
        totalAmount: 0,
        createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      });
    }
    setPlatformDialogOpen(true);
  };

  // 保存平台配置
  const handleSavePlatform = () => {
    if (selectedPlatform) {
      setPlatforms(platforms.map(p => 
        p.id === selectedPlatform.id ? { ...p, ...formData } as DeliveryPlatform : p
      ));
    } else {
      const config = platformConfigs[formData.type as PlatformType];
      const newPlatform: DeliveryPlatform = {
        id: `plat_${Date.now()}`,
        name: formData.name || config.name,
        type: formData.type as PlatformType,
        logo: config.logo,
        status: 'disconnected',
        appId: formData.appId || '',
        appSecret: formData.appSecret || '',
        shopId: formData.shopId || '',
        shopName: formData.shopName || '',
        autoSync: formData.autoSync ?? true,
        syncInterval: formData.syncInterval || 30,
        autoPrint: formData.autoPrint ?? true,
        autoAccept: formData.autoAccept ?? false,
        syncStock: formData.syncStock ?? true,
        syncPrice: formData.syncPrice ?? true,
        lowStockThreshold: formData.lowStockThreshold || 5,
        syncPromotion: formData.syncPromotion ?? true,
        todayOrders: 0,
        todayAmount: 0,
        totalOrders: 0,
        totalAmount: 0,
        createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
      setPlatforms([...platforms, newPlatform]);
    }
    setPlatformDialogOpen(false);
  };

  // 连接平台
  const handleConnect = (platform: DeliveryPlatform) => {
    setPlatforms(platforms.map(p => 
      p.id === platform.id 
        ? { 
            ...p, 
            status: 'connected' as PlatformStatus,
            connectedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
            lastSyncTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
          } 
        : p
    ));
    alert(`已成功连接 ${platform.name}`);
  };

  // 断开连接
  const handleDisconnect = (platform: DeliveryPlatform) => {
    setPlatforms(platforms.map(p => 
      p.id === platform.id 
        ? { ...p, status: 'disconnected' as PlatformStatus } 
        : p
    ));
  };

  // 同步订单
  const handleSyncOrders = (platform: DeliveryPlatform) => {
    setPlatforms(platforms.map(p => 
      p.id === platform.id 
        ? { ...p, lastSyncTime: new Date().toISOString().replace('T', ' ').slice(0, 19) } 
        : p
    ));
    alert(`正在同步 ${platform.name} 订单...`);
  };

  // 批量同步库存
  const handleBatchSyncStock = () => {
    const connectedPlatforms = platforms.filter(p => p.status === 'connected' && p.syncStock);
    if (connectedPlatforms.length === 0) {
      alert('没有需要同步库存的平台');
      return;
    }
    alert(`正在向 ${connectedPlatforms.length} 个平台同步库存...`);
  };

  // 批量同步价格
  const handleBatchSyncPrice = () => {
    const connectedPlatforms = platforms.filter(p => p.status === 'connected' && p.syncPrice);
    if (connectedPlatforms.length === 0) {
      alert('没有需要同步价格的平台');
      return;
    }
    alert(`正在向 ${connectedPlatforms.length} 个平台同步价格...`);
  };

  // 获取状态徽章
  const getStatusBadge = (status: PlatformStatus) => {
    const config = {
      connected: { label: '已连接', color: 'bg-green-500', icon: CheckCircle },
      disconnected: { label: '未连接', color: 'bg-gray-500', icon: WifiOff },
      error: { label: '连接异常', color: 'bg-red-500', icon: AlertCircle },
      pending: { label: '待审核', color: 'bg-yellow-500', icon: Clock },
    };
    const { label, color, icon: Icon } = config[status];
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // 获取映射状态徽章
  const getMappingStatusBadge = (status: 'mapped' | 'unmapped' | 'error' | 'pending') => {
    const config = {
      mapped: { label: '已映射', color: 'bg-green-500' },
      unmapped: { label: '未映射', color: 'bg-yellow-500' },
      error: { label: '异常', color: 'bg-red-500' },
      pending: { label: '待审核', color: 'bg-blue-500' },
    };
    const { label, color } = config[status];
    return <Badge className={color}>{label}</Badge>;
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="外卖对接" description="管理多外卖平台对接、订单同步、菜品映射和库存价格同步">
        <Button variant="outline" onClick={handleBatchSyncPrice}>
          <DollarSign className="h-4 w-4 mr-2" />
          同步价格
        </Button>
        <Button variant="outline" onClick={handleBatchSyncStock}>
          <Package className="h-4 w-4 mr-2" />
          同步库存
        </Button>
        <Button onClick={() => handleEditPlatform(null)}>
          <Plus className="h-4 w-4 mr-2" />
          添加平台
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <LinkIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.connectedPlatforms}</p>
                    <p className="text-sm text-muted-foreground">已连接</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pendingPlatforms}</p>
                    <p className="text-sm text-muted-foreground">待审核</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.todayOrders}</p>
                    <p className="text-sm text-muted-foreground">今日订单</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">¥{stats.todayAmount.toFixed(0)}</p>
                    <p className="text-sm text-muted-foreground">今日销售</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Copy className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalMappings}</p>
                    <p className="text-sm text-muted-foreground">商品映射</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Check className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.mappedRate}%</p>
                    <p className="text-sm text-muted-foreground">映射率</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="platforms" className="space-y-4">
            <TabsList>
              <TabsTrigger value="platforms">
                <Store className="h-4 w-4 mr-2" />
                平台管理
              </TabsTrigger>
              <TabsTrigger value="mapping">
                <Copy className="h-4 w-4 mr-2" />
                菜品映射
              </TabsTrigger>
            </TabsList>

            {/* 平台管理 */}
            <TabsContent value="platforms">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platforms.map(platform => {
                  const config = platformConfigs[platform.type];
                  return (
                    <Card key={platform.id} className={`relative ${platform.status === 'connected' ? 'border-green-200' : platform.status === 'pending' ? 'border-yellow-200' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-4xl">{platform.logo}</span>
                            <div>
                              <CardTitle className="text-lg">{platform.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{platform.shopName || '未配置店铺'}</p>
                            </div>
                          </div>
                          {getStatusBadge(platform.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* 今日统计 */}
                        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-xl font-bold">{platform.todayOrders}</p>
                            <p className="text-xs text-muted-foreground">今日订单</p>
                          </div>
                          <div>
                            <p className="text-xl font-bold">¥{platform.todayAmount.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground">今日销售</p>
                          </div>
                        </div>

                        {/* 同步设置 */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">订单同步</span>
                            <span>{platform.autoSync ? '✓' : '✗'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">库存同步</span>
                            <span>{platform.syncStock ? '✓' : '✗'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">价格同步</span>
                            <span>{platform.syncPrice ? '✓' : '✗'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">自动打印</span>
                            <span>{platform.autoPrint ? '✓' : '✗'}</span>
                          </div>
                        </div>

                        {platform.lastSyncTime && (
                          <div className="text-xs text-muted-foreground">
                            最后同步：{platform.lastSyncTime}
                          </div>
                        )}

                        {/* 操作按钮 */}
                        <div className="flex gap-2">
                          {platform.status === 'connected' ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleSyncOrders(platform)}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                同步
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleEditPlatform(platform)}
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                设置
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDisconnect(platform)}
                              >
                                <Unlink className="h-4 w-4" />
                              </Button>
                            </>
                          ) : platform.status === 'pending' ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                disabled
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                审核中
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleEditPlatform(platform)}
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                配置
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleConnect(platform)}
                              >
                                <LinkIcon className="h-4 w-4 mr-1" />
                                连接
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleEditPlatform(platform)}
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                配置
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* 可对接平台提示 */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base">支持对接的平台</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Object.entries(platformConfigs).filter(([key]) => key !== 'custom').map(([key, config]) => (
                      <div key={key} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <span className="text-2xl">{config.logo}</span>
                        <div>
                          <p className="font-medium text-sm">{config.name}</p>
                          <p className="text-xs text-muted-foreground">{config.features.length} 项功能</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 菜品映射 */}
            <TabsContent value="mapping">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>菜品映射管理</CardTitle>
                      <CardDescription>将店铺商品与各外卖平台菜品关联，支持一对多映射</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        导入映射
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        导出映射
                      </Button>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        添加映射
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>本地商品</TableHead>
                        <TableHead>本地价格</TableHead>
                        <TableHead>本地库存</TableHead>
                        <TableHead>平台映射</TableHead>
                        <TableHead>映射率</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dishMappings.map(mapping => (
                        <TableRow key={mapping.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{mapping.localProductName}</p>
                                <p className="text-xs text-muted-foreground">ID: {mapping.localProductId}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">¥{mapping.localPrice.toFixed(2)}</TableCell>
                          <TableCell>{mapping.localStock}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {mapping.platformMappings.map(pm => (
                                <Badge 
                                  key={pm.platform} 
                                  variant="outline" 
                                  className={`${platformConfigs[pm.platform].bgColor} ${platformConfigs[pm.platform].color}`}
                                >
                                  {platformConfigs[pm.platform].logo} {platformConfigs[pm.platform].name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500" 
                                  style={{ width: `${(mapping.mappedPlatforms / mapping.totalPlatforms) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm">{mapping.mappedPlatforms}/{mapping.totalPlatforms}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setExpandedMapping(expandedMapping === mapping.id ? null : mapping.id)}
                            >
                              {expandedMapping === mapping.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* 展开的详细映射信息 */}
                  {expandedMapping && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      {dishMappings.filter(m => m.id === expandedMapping).map(mapping => (
                        <div key={mapping.id}>
                          <h4 className="font-medium mb-3">{mapping.localProductName} - 平台映射详情</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>平台</TableHead>
                                <TableHead>平台菜品ID</TableHead>
                                <TableHead>平台菜品名称</TableHead>
                                <TableHead>平台价格</TableHead>
                                <TableHead>平台库存</TableHead>
                                <TableHead>库存差异</TableHead>
                                <TableHead>同步设置</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {mapping.platformMappings.map(pm => (
                                <TableRow key={pm.platform}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <span>{platformConfigs[pm.platform].logo}</span>
                                      <span>{platformConfigs[pm.platform].name}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">{pm.platformDishId || '-'}</TableCell>
                                  <TableCell>{pm.platformDishName || '-'}</TableCell>
                                  <TableCell>{pm.platformPrice > 0 ? `¥${pm.platformPrice.toFixed(2)}` : '-'}</TableCell>
                                  <TableCell>{pm.platformStock}</TableCell>
                                  <TableCell>
                                    {pm.syncStock ? (
                                      <div className="flex items-center gap-1">
                                        {pm.stockDiff > 0 ? (
                                          <><ArrowUpRight className="h-4 w-4 text-red-500" />+{pm.stockDiff}</>
                                        ) : pm.stockDiff < 0 ? (
                                          <><ArrowDownRight className="h-4 w-4 text-green-500" />{pm.stockDiff}</>
                                        ) : (
                                          <span className="text-green-600">同步</span>
                                        )}
                                      </div>
                                    ) : '-'}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Badge variant={pm.syncStock ? 'default' : 'outline'} className="text-xs">
                                        库存{pm.syncStock ? '✓' : '✗'}
                                      </Badge>
                                      <Badge variant={pm.syncPrice ? 'default' : 'outline'} className="text-xs">
                                        价格{pm.syncPrice ? '✓' : '✗'}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell>{getMappingStatusBadge(pm.status)}</TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 平台配置对话框 */}
      <Dialog open={platformDialogOpen} onOpenChange={setPlatformDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPlatform ? '编辑平台配置' : '添加外卖平台'}</DialogTitle>
            <DialogDescription>
              配置外卖平台API参数和同步设置
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h4 className="font-medium">基本信息</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>平台类型</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => {
                      const config = platformConfigs[value as PlatformType];
                      setFormData({ 
                        ...formData, 
                        type: value as PlatformType,
                        name: config.name,
                      });
                    }}
                    disabled={!!selectedPlatform}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(platformConfigs).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span>{config.logo}</span>
                            <span>{config.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>平台名称</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="显示名称"
                  />
                </div>
              </div>
            </div>

            {/* API配置 */}
            <div className="space-y-4">
              <h4 className="font-medium">API配置</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>App ID</Label>
                  <Input
                    value={formData.appId || ''}
                    onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                    placeholder="平台分配的App ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label>App Secret</Label>
                  <Input
                    type="password"
                    value={formData.appSecret || ''}
                    onChange={(e) => setFormData({ ...formData, appSecret: e.target.value })}
                    placeholder="平台分配的App Secret"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>店铺ID</Label>
                  <Input
                    value={formData.shopId || ''}
                    onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                    placeholder="平台店铺ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label>店铺名称</Label>
                  <Input
                    value={formData.shopName || ''}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                    placeholder="店铺显示名称"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>回调地址</Label>
                <Input
                  value={formData.callbackUrl || ''}
                  onChange={(e) => setFormData({ ...formData, callbackUrl: e.target.value })}
                  placeholder="https://api.yourdomain.com/callback/platform"
                />
              </div>
            </div>

            {/* 同步设置 */}
            <div className="space-y-4">
              <h4 className="font-medium">同步设置</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>自动同步订单</Label>
                  <Switch
                    checked={formData.autoSync}
                    onCheckedChange={(checked) => setFormData({ ...formData, autoSync: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>自动打印配送单</Label>
                  <Switch
                    checked={formData.autoPrint}
                    onCheckedChange={(checked) => setFormData({ ...formData, autoPrint: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>自动接单</Label>
                  <Switch
                    checked={formData.autoAccept}
                    onCheckedChange={(checked) => setFormData({ ...formData, autoAccept: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>同步库存</Label>
                  <Switch
                    checked={formData.syncStock}
                    onCheckedChange={(checked) => setFormData({ ...formData, syncStock: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>同步价格</Label>
                  <Switch
                    checked={formData.syncPrice}
                    onCheckedChange={(checked) => setFormData({ ...formData, syncPrice: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>同步营销活动</Label>
                  <Switch
                    checked={formData.syncPromotion}
                    onCheckedChange={(checked) => setFormData({ ...formData, syncPromotion: checked })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>同步间隔（秒）</Label>
                  <Input
                    type="number"
                    value={formData.syncInterval || 30}
                    onChange={(e) => setFormData({ ...formData, syncInterval: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>低库存阈值</Label>
                  <Input
                    type="number"
                    value={formData.lowStockThreshold || 5}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPlatformDialogOpen(false)}>取消</Button>
            <Button onClick={handleSavePlatform}>保存配置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
