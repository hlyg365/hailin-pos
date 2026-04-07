'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Switch } from '@/components/ui/switch';
import {
  Smartphone,
  Image as ImageIcon,
  Edit,
  Plus,
  Trash2,
  Save,
  QrCode,
  Share2,
  MapPin,
  ChevronRight,
  Store,
  Truck,
  Megaphone,
  Settings,
  Palette,
  LayoutGrid,
  Navigation,
  Upload,
  Eye,
  RefreshCw,
  Check,
  Sparkles,
  Ticket,
  Gift,
  Percent,
  Users,
  Crown,
  Star,
  CheckCircle,
  Clock,
  Database,
  Package,
  Loader2,
  Tag,
  Zap,
  TrendingUp,
  BarChart3,
  ShoppingCart,
  PieChart,
} from 'lucide-react';
import { toast } from 'sonner';

// 模板类型定义
interface StoreTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  style: {
    primaryColor: string;
    secondaryColor: string;
    gradientFrom: string;
    gradientTo: string;
    navStyle: 'default' | 'center' | 'float';
    headerStyle: 'simple' | 'banner' | 'gradient';
  };
  config: {
    showStoreLocation: boolean;  // 门店定位
    showSearchBar: boolean;
    showBanner: boolean;
    showServiceTags: boolean;
    showNotice: boolean;
    showDeliveryPromise: boolean;
    showQuickCategories: boolean;
    categoryGrid: '4x2' | '5x2' | '4x4';
    showRecommendations: boolean;
  };
}

// 预设模板数据
const STORE_TEMPLATES: StoreTemplate[] = [
  {
    id: 'fresh-green',
    name: '清新生鲜',
    description: '清新绿色主题，适合生鲜超市，突出新鲜、快捷的购物体验',
    preview: '🥬',
    style: {
      primaryColor: 'bg-green-500',
      secondaryColor: 'bg-green-100',
      gradientFrom: 'from-green-400',
      gradientTo: 'to-green-500',
      navStyle: 'center',
      headerStyle: 'gradient',
    },
    config: {
      showStoreLocation: true,
      showSearchBar: true,
      showBanner: true,
      showServiceTags: true,
      showNotice: true,
      showDeliveryPromise: true,
      showQuickCategories: true,
      categoryGrid: '5x2',
      showRecommendations: true,
    },
  },
  {
    id: 'vibrant-orange',
    name: '活力橙风',
    description: '活力橙色主题，适合社区便利店，温馨亲民的购物氛围',
    preview: '🍊',
    style: {
      primaryColor: 'bg-orange-500',
      secondaryColor: 'bg-orange-100',
      gradientFrom: 'from-orange-400',
      gradientTo: 'to-orange-500',
      navStyle: 'default',
      headerStyle: 'banner',
    },
    config: {
      showStoreLocation: true,
      showSearchBar: true,
      showBanner: true,
      showServiceTags: true,
      showNotice: true,
      showDeliveryPromise: false,
      showQuickCategories: true,
      categoryGrid: '4x2',
      showRecommendations: true,
    },
  },
  {
    id: 'professional-blue',
    name: '商务蓝调',
    description: '专业蓝色主题，适合高端超市，简洁大气的界面风格',
    preview: '🏪',
    style: {
      primaryColor: 'bg-blue-600',
      secondaryColor: 'bg-blue-100',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-600',
      navStyle: 'float',
      headerStyle: 'simple',
    },
    config: {
      showStoreLocation: true,
      showSearchBar: true,
      showBanner: true,
      showServiceTags: false,
      showNotice: true,
      showDeliveryPromise: true,
      showQuickCategories: false,
      categoryGrid: '4x4',
      showRecommendations: true,
    },
  },
  {
    id: 'classic-red',
    name: '经典红韵',
    description: '经典红色主题，适合促销活动，热情醒目的视觉效果',
    preview: '🔴',
    style: {
      primaryColor: 'bg-red-500',
      secondaryColor: 'bg-red-100',
      gradientFrom: 'from-red-400',
      gradientTo: 'to-red-500',
      navStyle: 'center',
      headerStyle: 'gradient',
    },
    config: {
      showStoreLocation: true,
      showSearchBar: true,
      showBanner: true,
      showServiceTags: true,
      showNotice: true,
      showDeliveryPromise: true,
      showQuickCategories: true,
      categoryGrid: '5x2',
      showRecommendations: true,
    },
  },
];

// 品牌配置类型
interface BrandConfig {
  storeName: string;
  distance: string;
  backgroundImage: string;
  logoUrl: string;
  slogan: {
    title: string;
    subtitle: string;
    description: string;
  };
}

// 快速分类按钮类型
interface QuickCategory {
  id: string;
  name: string;
  enabled: boolean;
  icon: string;
  color: string;
}

// 品类图标类型
interface CategoryIcon {
  id: string;
  name: string;
  icon: string;
  bgColor: string;
  enabled: boolean;
  link?: string;
}

// 底部导航项类型
interface BottomNavItem {
  id: string;
  name: string;
  icon: string;
  activeIcon: string;
  enabled: boolean;
  isCenter?: boolean;
  link: string;
}

// 店铺公告类型
interface StoreNotice {
  enabled: boolean;
  content: string;
}

// 优惠券配置类型
interface CouponConfig {
  id: string;
  name: string;
  type: 'discount' | 'cash' | 'free_shipping';
  value: number;
  minAmount: number;
  enabled: boolean;
  expireDays: number;
}

export default function MiniStorePage() {
  // 当前选择的模板
  const [selectedTemplate, setSelectedTemplate] = useState<string>('fresh-green');
  const currentTemplate = STORE_TEMPLATES.find(t => t.id === selectedTemplate) || STORE_TEMPLATES[0];

  // 品牌配置
  const [brandConfig, setBrandConfig] = useState<BrandConfig>({
    storeName: '海邻到家（南阳宛城店）',
    distance: '315m',
    backgroundImage: '/mini-store-bg.jpg',
    logoUrl: '/logo.png',
    slogan: {
      title: '生鲜超市',
      subtitle: '1小时极速送达',
      description: '有机新鲜 质量保证',
    },
  });

  // 快速分类按钮
  const [quickCategories, setQuickCategories] = useState<QuickCategory[]>([
    { id: '1', name: '水果', enabled: true, icon: '🍎', color: 'bg-red-100' },
    { id: '2', name: '蔬菜', enabled: true, icon: '🥬', color: 'bg-green-100' },
    { id: '3', name: '生鲜', enabled: true, icon: '🥩', color: 'bg-orange-100' },
    { id: '4', name: '其他', enabled: true, icon: '📦', color: 'bg-blue-100' },
  ]);

  // 全品类图标
  const [categoryIcons, setCategoryIcons] = useState<CategoryIcon[]>([
    { id: '1', name: '果蔬生鲜', icon: '🥬', bgColor: 'bg-blue-100', enabled: true },
    { id: '2', name: '粮油调味', icon: '🍚', bgColor: 'bg-green-100', enabled: true },
    { id: '3', name: '休闲零食', icon: '🍪', bgColor: 'bg-yellow-100', enabled: true },
    { id: '4', name: '饮料乳品', icon: '🥛', bgColor: 'bg-pink-100', enabled: true },
    { id: '5', name: '中外名酒', icon: '🍷', bgColor: 'bg-blue-100', enabled: true },
    { id: '6', name: '品质茗茶', icon: '🍵', bgColor: 'bg-orange-100', enabled: true },
    { id: '7', name: '礼品特产', icon: '🎁', bgColor: 'bg-orange-100', enabled: true },
    { id: '8', name: '护理洗化', icon: '🧴', bgColor: 'bg-blue-100', enabled: true },
  ]);

  // 店铺公告
  const [storeNotice, setStoreNotice] = useState<StoreNotice>({
    enabled: true,
    content: '新鲜水果今日特价，欢迎选购！',
  });

  // 底部导航
  const [bottomNav, setBottomNav] = useState<BottomNavItem[]>([
    { id: '1', name: '首页', icon: '🏠', activeIcon: '🏠', enabled: true, link: '/pages/index' },
    { id: '2', name: '社区服务', icon: '🏘️', activeIcon: '🏘️', enabled: true, link: '/pages/community' },
    { id: '3', name: '商品分类', icon: '📊', activeIcon: '📊', enabled: true, isCenter: true, link: '/pages/category' },
    { id: '4', name: '购物车', icon: '🛒', activeIcon: '🛒', enabled: true, link: '/pages/cart' },
    { id: '5', name: '我的', icon: '👤', activeIcon: '👤', enabled: true, link: '/pages/mine' },
  ]);

  // 活动标签
  const [activityTag, setActivityTag] = useState({
    enabled: true,
    text: '定金预售',
  });

  // 优惠券配置
  const [coupons, setCoupons] = useState<CouponConfig[]>([
    { id: '1', name: '新人专享券', type: 'cash', value: 10, minAmount: 50, enabled: true, expireDays: 30 },
    { id: '2', name: '满减优惠券', type: 'cash', value: 20, minAmount: 100, enabled: true, expireDays: 7 },
    { id: '3', name: '会员折扣券', type: 'discount', value: 9, minAmount: 0, enabled: false, expireDays: 15 },
  ]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingType, setEditingType] = useState<string>('');
  
  // 添加分类对话框状态
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '📦',
    bgColor: 'bg-blue-100',
  });

  // 添加快速分类对话框状态
  const [addQuickCategoryOpen, setAddQuickCategoryOpen] = useState(false);
  const [newQuickCategory, setNewQuickCategory] = useState({
    name: '',
    icon: '📦',
    color: 'bg-blue-100',
  });

  // 添加优惠券对话框状态
  const [addCouponOpen, setAddCouponOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState<Partial<CouponConfig>>({
    name: '',
    type: 'cash',
    value: 10,
    minAmount: 50,
    expireDays: 30,
  });

  // 预览中的点击反馈
  const [clickedButton, setClickedButton] = useState<string | null>(null);

  // 小程序码对话框状态
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);

  // 总部商品库相关状态
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSelectDialogOpen, setProductSelectDialogOpen] = useState(false);
  const [onShelfProducts, setOnShelfProducts] = useState<any[]>([]);

  // 从总部商品库加载商品数据
  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await fetch('/api/store-products');
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          const products: any[] = [];
          
          result.data.forEach((p: any) => {
            if (p.specs && p.specs.length > 0) {
              p.specs.forEach((spec: any, specIndex: number) => {
                // 使用 spec.id 作为唯一标识，避免 barcode 为空或不规范的问题
                const specId = spec.id || `spec-${p.id}-${specIndex}`;
                products.push({
                  id: specId,
                  productId: p.id,
                  name: p.name + (p.specs.length > 1 ? ` (${spec.name})` : ''),
                  price: spec.price || 0,
                  unit: spec.unit || '个',
                  stock: spec.stock || 0,
                  category: p.category || '其他',
                  barcode: spec.barcode || '',
                  specName: spec.name,
                });
              });
            } else {
              // 没有规格的商品
              products.push({
                id: p.id,
                productId: p.id,
                name: p.name,
                price: 0,
                unit: '个',
                stock: 0,
                category: p.category || '其他',
                barcode: '',
                specName: '标准装',
              });
            }
          });
          
          console.log('[小程序商城] 加载商品成功，共', products.length, '个商品');
          setAvailableProducts(products);
        } else {
          console.log('[小程序商城] 未加载到商品数据');
        }
      } catch (error) {
        console.error('[小程序商城] 加载商品失败:', error);
      } finally {
        setLoadingProducts(false);
      }
    };
    
    loadProducts();
  }, []);

  // 从商品库上架商品
  const handleAddToShelf = (product: any) => {
    // 检查是否已上架（使用 id 和 productId 双重检查）
    const alreadyOnShelf = onShelfProducts.some(p => p.id === product.id || p.productId === product.productId);
    if (alreadyOnShelf) {
      toast.error('该商品已上架');
      return;
    }
    
    const newProduct = {
      ...product,
      status: 'on_sale',
      shelfTime: new Date().toISOString(),
    };
    
    setOnShelfProducts(prev => [...prev, newProduct]);
    console.log('[小程序商城] 上架商品:', product.name, 'ID:', product.id);
    toast.success(`已上架: ${product.name}`);
  };

  // 下架商品
  const handleRemoveFromShelf = (productId: string) => {
    setOnShelfProducts(onShelfProducts.filter(p => p.id !== productId));
    toast.success('商品已下架');
  };

  const handleEditItem = (type: string, item: any) => {
    setEditingType(type);
    setEditingItem({ ...item });
    setEditDialogOpen(true);
  };

  const handleSaveItem = () => {
    if (!editingItem) return;
    
    switch (editingType) {
      case 'quickCategory':
        setQuickCategories(quickCategories.map(c => c.id === editingItem.id ? editingItem : c));
        break;
      case 'categoryIcon':
        setCategoryIcons(categoryIcons.map(c => c.id === editingItem.id ? editingItem : c));
        break;
      case 'bottomNav':
        setBottomNav(bottomNav.map(n => n.id === editingItem.id ? editingItem : n));
        break;
      case 'coupon':
        setCoupons(coupons.map(c => c.id === editingItem.id ? editingItem : c));
        break;
    }
    setEditDialogOpen(false);
    toast.success('保存成功', { description: '配置已更新' });
  };

  // 删除分类
  const handleDeleteCategory = (type: 'quick' | 'category', id: string) => {
    if (type === 'quick') {
      setQuickCategories(quickCategories.filter(c => c.id !== id));
    } else {
      setCategoryIcons(categoryIcons.filter(c => c.id !== id));
    }
    toast.success('删除成功', { description: '分类已移除' });
  };

  // 删除优惠券
  const handleDeleteCoupon = (id: string) => {
    setCoupons(coupons.filter(c => c.id !== id));
    toast.success('删除成功', { description: '优惠券已移除' });
  };

  // 添加品类图标
  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast.error('请填写分类名称');
      return;
    }
    const newCat: CategoryIcon = {
      id: Date.now().toString(),
      name: newCategory.name,
      icon: newCategory.icon,
      bgColor: newCategory.bgColor,
      enabled: true,
    };
    setCategoryIcons([...categoryIcons, newCat]);
    setAddCategoryOpen(false);
    setNewCategory({ name: '', icon: '📦', bgColor: 'bg-blue-100' });
    toast.success('添加成功', { description: '品类图标已添加' });
  };

  // 添加快速分类
  const handleAddQuickCategory = () => {
    if (!newQuickCategory.name.trim()) {
      toast.error('请填写分类名称');
      return;
    }
    const newCat: QuickCategory = {
      id: Date.now().toString(),
      name: newQuickCategory.name,
      icon: newQuickCategory.icon,
      color: newQuickCategory.color,
      enabled: true,
    };
    setQuickCategories([...quickCategories, newCat]);
    setAddQuickCategoryOpen(false);
    setNewQuickCategory({ name: '', icon: '📦', color: 'bg-blue-100' });
    toast.success('添加成功', { description: '快速分类已添加' });
  };

  // 添加优惠券
  const handleAddCoupon = () => {
    if (!newCoupon.name?.trim()) {
      toast.error('请填写优惠券名称');
      return;
    }
    const coupon: CouponConfig = {
      id: Date.now().toString(),
      name: newCoupon.name || '',
      type: newCoupon.type || 'cash',
      value: newCoupon.value || 10,
      minAmount: newCoupon.minAmount || 0,
      expireDays: newCoupon.expireDays || 30,
      enabled: true,
    };
    setCoupons([...coupons, coupon]);
    setAddCouponOpen(false);
    setNewCoupon({ name: '', type: 'cash', value: 10, minAmount: 50, expireDays: 30 });
    toast.success('添加成功', { description: '优惠券已添加' });
  };

  // 预览按钮点击反馈
  const handlePreviewClick = (buttonId: string, name: string) => {
    setClickedButton(buttonId);
    setTimeout(() => setClickedButton(null), 200);
    toast.info('点击了: ' + name, { 
      description: '在实际小程序中将跳转到对应页面',
      duration: 1500,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="小程序商城" description="配置和管理社区便利店小程序商城首页模板">
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            重置默认
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            保存配置
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 左侧：小程序预览 */}
          <div className="xl:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  实时预览
                </CardTitle>
                <CardDescription>
                  小程序首页效果预览
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* 手机模拟器 */}
                <div className="relative mx-auto w-[280px] h-[580px] bg-gray-900 rounded-[40px] p-2 shadow-2xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />
                  <div className="relative w-full h-full bg-white rounded-[32px] overflow-hidden">
                    {/* 状态栏 - 根据模板颜色 */}
                    <div className={`h-7 bg-gradient-to-r ${currentTemplate.style.gradientFrom} ${currentTemplate.style.gradientTo} flex items-center justify-between px-4 text-white text-xs`}>
                      <span>15:49</span>
                      <div className="flex items-center gap-1">
                        <span>4.9K/s</span>
                        <span>5G</span>
                        <span>📶</span>
                        <span>71%</span>
                      </div>
                    </div>
                    
                    {/* 内容区 */}
                    <div className="h-full overflow-y-auto pb-20">
                      {/* 门店定位栏 - 根据模板配置 */}
                      {currentTemplate.config.showStoreLocation && (
                        <button
                          onClick={() => handlePreviewClick('location', brandConfig.storeName)}
                          className="w-full px-3 py-2 bg-white flex items-center justify-between border-b transition-colors active:bg-gray-50"
                        >
                          <div className="flex items-center gap-1.5">
                            <MapPin className={`h-4 w-4 ${currentTemplate.style.primaryColor.replace('bg-', 'text-')}`} />
                            <span className="font-medium text-gray-800 text-sm truncate max-w-[160px]">
                              {brandConfig.storeName}
                            </span>
                            <ChevronRight className="h-3 w-3 text-gray-400" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{brandConfig.distance}</span>
                            <span className="text-xs text-gray-400">|</span>
                            <span className="text-xs text-blue-500">导航</span>
                          </div>
                        </button>
                      )}
                      
                      {/* 搜索栏 - 根据模板配置 */}
                      {currentTemplate.config.showSearchBar && (
                        <div className="px-3 py-2 bg-white border-b">
                          <button
                            onClick={() => handlePreviewClick('search', '搜索')}
                            className="w-full flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 transition-colors active:bg-gray-200"
                          >
                            <span className="text-gray-400 text-sm">🔍</span>
                            <span className="text-gray-400 text-xs">搜索商品</span>
                          </button>
                        </div>
                      )}
                      
                      {/* 轮播图区域 - 根据模板配置 */}
                      {currentTemplate.config.showBanner && (
                        <div className={`relative h-32 bg-gradient-to-br ${currentTemplate.style.gradientFrom} ${currentTemplate.style.gradientTo} overflow-hidden`}>
                          <div className="absolute inset-0 flex items-center justify-center text-white">
                            <div className="text-center">
                              <div className="text-lg font-bold">优质新鲜 实惠放心</div>
                              <div className="text-sm opacity-80 mt-1">下单可送货上门</div>
                            </div>
                          </div>
                          {/* 轮播指示器 */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            <div className="w-4 h-1 bg-white rounded"></div>
                            <div className="w-1 h-1 bg-white/50 rounded"></div>
                            <div className="w-1 h-1 bg-white/50 rounded"></div>
                          </div>
                        </div>
                      )}

                      {/* 服务标签 - 根据模板配置 */}
                      {currentTemplate.config.showServiceTags && (
                        <div className="flex items-center justify-around py-2 bg-white border-b">
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-green-500">✓</span>
                            <span>满10元减配送费</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-orange-500">⚡</span>
                            <span>最快20分钟送达</span>
                          </div>
                        </div>
                      )}

                      {/* 配送承诺 - 根据模板配置 */}
                      {currentTemplate.config.showDeliveryPromise && (
                        <div className="mx-3 mt-2 bg-yellow-50 rounded-lg px-3 py-2 flex items-center justify-between">
                          <span className="text-xs text-yellow-700">🚚 平均30分钟送达·慢必赔</span>
                          <span className="text-xs text-yellow-600">→</span>
                        </div>
                      )}

                      {/* 公告栏 */}
                      {storeNotice.enabled && (
                        <div className="mx-3 mt-2 flex items-center bg-gray-50 rounded-lg overflow-hidden">
                          <div className={`${currentTemplate.style.primaryColor} text-white text-xs px-2 py-2 font-medium`}>
                            <Megaphone className="h-3 w-3 inline mr-1" />
                            公告
                          </div>
                          <div className="flex-1 px-3 py-2 text-xs text-gray-600 truncate">
                            {storeNotice.content || '请输入公告内容'}
                          </div>
                        </div>
                      )}
                      
                      {/* 品牌背景图区域 - 当没有轮播图时显示 */}
                      {!currentTemplate.config.showBanner && (
                        <div className={`relative h-32 bg-gradient-to-br ${currentTemplate.style.gradientFrom} ${currentTemplate.style.gradientTo} overflow-hidden`}>
                          {/* Logo */}
                          <div className="absolute top-3 left-3 bg-white/90 rounded-lg px-2 py-1 flex items-center gap-1">
                            <div className={`w-6 h-6 ${currentTemplate.style.primaryColor} rounded flex items-center justify-center`}>
                              <Store className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xs font-bold text-gray-700">海邻到家</span>
                          </div>
                          
                          {/* 宣传弹窗 */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                            bg-white/95 rounded-lg px-4 py-2 text-center shadow-lg">
                            <div className="text-red-500 font-bold">
                              {brandConfig.slogan.title}
                            </div>
                            <div className="text-gray-600 text-xs mt-1">
                              {brandConfig.slogan.subtitle}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 快速分类按钮 - 根据模板配置 */}
                      {currentTemplate.config.showQuickCategories && (
                        <div className="px-3 py-3">
                          <div className={`grid ${currentTemplate.config.categoryGrid === '5x2' ? 'grid-cols-5' : 'grid-cols-4'} gap-2`}>
                            {quickCategories.filter(c => c.enabled).map((cat) => (
                              <button
                                key={cat.id}
                                onClick={() => handlePreviewClick(`quick-${cat.id}`, cat.name)}
                                className={`${currentTemplate.style.secondaryColor} rounded-lg py-2 text-xs font-medium flex flex-col items-center gap-1 transition-all duration-150 ${clickedButton === `quick-${cat.id}` ? 'scale-95 opacity-70' : 'active:scale-95'}`}
                              >
                                <span className="text-lg">{cat.icon}</span>
                                <span>{cat.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 商品推荐 - 根据模板配置 */}
                      {currentTemplate.config.showRecommendations && (
                        <div className="mx-3 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">新品推荐</span>
                            <button 
                              onClick={() => handlePreviewClick('more-products', '更多商品')}
                              className="text-xs text-gray-400 active:text-gray-600"
                            >
                              更多 →
                            </button>
                          </div>
                          {onShelfProducts.length === 0 ? (
                            <div className="py-6 text-center text-gray-400 text-xs">
                              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>暂无上架商品</p>
                              <p className="mt-1">请在商品管理中上架商品</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {onShelfProducts.slice(0, 4).map((product) => (
                                <button 
                                  key={product.id}
                                  onClick={() => handlePreviewClick(`product-${product.id}`, product.name)}
                                  className="bg-gray-50 rounded-lg p-2 text-left transition-colors active:bg-gray-100"
                                >
                                  <div className="h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center text-2xl">
                                    {product.category?.includes('水果') ? '🍎' :
                                     product.category?.includes('蔬菜') ? '🥬' :
                                     product.category?.includes('生鲜') ? '🥩' :
                                     product.category?.includes('饮料') ? '🥛' :
                                     product.category?.includes('零食') ? '🍪' :
                                     product.category?.includes('粮油') ? '🍚' :
                                     product.category?.includes('酒') ? '🍷' :
                                     product.category?.includes('茶') ? '🍵' :
                                     '📦'}
                                  </div>
                                  <div className="mt-1 text-xs truncate">{product.name}</div>
                                  <div className="text-red-500 text-xs font-bold">¥{product.price?.toFixed(2) || '0.00'}</div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* 底部导航 - 根据模板样式 */}
                    <div className={`absolute bottom-0 left-0 right-0 h-16 bg-white ${currentTemplate.style.navStyle === 'float' ? 'rounded-t-3xl shadow-lg' : 'border-t'} flex items-center justify-around px-2`}>
                      {bottomNav.filter(n => n.enabled).map((item, idx) => (
                        <button
                          key={item.id}
                          onClick={() => handlePreviewClick(`nav-${item.id}`, item.name)}
                          className="flex flex-col items-center gap-0.5 relative transition-transform active:scale-90"
                        >
                          {item.isCenter && currentTemplate.style.navStyle === 'center' ? (
                            <div className={`absolute -top-6 w-12 h-12 ${currentTemplate.style.primaryColor} rounded-full flex items-center justify-center shadow-lg ${clickedButton === `nav-${item.id}` ? 'scale-90' : ''}`}>
                              <span className="text-white text-xl">{item.icon}</span>
                            </div>
                          ) : item.isCenter ? (
                            <div className={`w-10 h-10 ${currentTemplate.style.primaryColor} rounded-xl flex items-center justify-center ${clickedButton === `nav-${item.id}` ? 'scale-90' : ''}`}>
                              <span className="text-white text-lg">{item.icon}</span>
                            </div>
                          ) : (
                            <>
                              <span className="text-lg">{item.icon}</span>
                              <span className="text-xs text-gray-500">{item.name}</span>
                            </>
                          )}
                          {item.isCenter && currentTemplate.style.navStyle === 'center' && (
                            <span className="text-xs text-gray-500 mt-6">{item.name}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm" onClick={() => {
                    const miniAppUrl = `pages/index/index?storeId=${encodeURIComponent(brandConfig.storeName)}`;
                    navigator.clipboard.writeText(miniAppUrl);
                    toast.success('小程序链接已复制', { description: miniAppUrl });
                  }}>
                    <Share2 className="h-4 w-4 mr-1" />
                    分享链接
                  </Button>
                  <Button className="flex-1" size="sm" onClick={() => setQrCodeDialogOpen(true)}>
                    <QrCode className="h-4 w-4 mr-1" />
                    生成小程序码
                  </Button>
                </div>
                
                {/* 小程序码信息 */}
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <QrCode className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">小程序码信息</span>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>小程序路径：</span>
                      <code className="text-xs bg-background px-2 py-0.5 rounded">pages/index/index</code>
                    </div>
                    <div className="flex justify-between">
                      <span>店铺参数：</span>
                      <code className="text-xs bg-background px-2 py-0.5 rounded truncate max-w-[120px]">{brandConfig.storeName}</code>
                    </div>
                    <p className="text-xs mt-2 text-blue-600">
                      💡 请在微信小程序后台使用以上路径生成小程序码
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：配置区域 */}
          <div className="xl:col-span-2 space-y-6">
            <Tabs defaultValue="template" className="w-full">
              <TabsList className="grid w-full grid-cols-11 h-auto">
                <TabsTrigger value="template" className="text-xs py-2">模板选择</TabsTrigger>
                <TabsTrigger value="brand" className="text-xs py-2">品牌配置</TabsTrigger>
                <TabsTrigger value="quick" className="text-xs py-2">快速分类</TabsTrigger>
                <TabsTrigger value="categories" className="text-xs py-2">品类导航</TabsTrigger>
                <TabsTrigger value="notice" className="text-xs py-2">公告设置</TabsTrigger>
                <TabsTrigger value="nav" className="text-xs py-2">底部导航</TabsTrigger>
                <TabsTrigger value="products" className="text-xs py-2">商品管理</TabsTrigger>
                <TabsTrigger value="member" className="text-xs py-2">会员管理</TabsTrigger>
                <TabsTrigger value="marketing" className="text-xs py-2">营销管理</TabsTrigger>
                <TabsTrigger value="other" className="text-xs py-2">其他设置</TabsTrigger>
              </TabsList>

              {/* 模板选择 */}
              <TabsContent value="template" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      选择商城模板
                    </CardTitle>
                    <CardDescription>选择适合您店铺风格的小程序首页模板</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {STORE_TEMPLATES.map((template) => (
                        <div
                          key={template.id}
                          className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            selectedTemplate === template.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedTemplate(template.id)}
                        >
                          {/* 选中标记 */}
                          {selectedTemplate === template.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                          
                          {/* 预览区 */}
                          <div className={`h-32 rounded-lg ${template.style.gradientFrom} ${template.style.gradientTo} bg-gradient-to-br mb-3 flex items-center justify-center relative overflow-hidden`}>
                            <div className="text-5xl">{template.preview}</div>
                            {/* 模拟元素 */}
                            <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                              <div className="flex-1 h-2 bg-white/50 rounded"></div>
                              <div className="flex-1 h-2 bg-white/50 rounded"></div>
                              <div className="flex-1 h-2 bg-white/50 rounded"></div>
                            </div>
                          </div>
                          
                          {/* 模板信息 */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{template.preview}</span>
                            <span className="font-medium">{template.name}</span>
                          </div>
                          <p className="text-sm text-gray-500">{template.description}</p>
                          
                          {/* 功能标签 */}
                          <div className="flex flex-wrap gap-1 mt-3">
                            {template.config.showStoreLocation && (
                              <Badge variant="secondary" className="text-xs">门店定位</Badge>
                            )}
                            {template.config.showBanner && (
                              <Badge variant="secondary" className="text-xs">轮播图</Badge>
                            )}
                            {template.config.showServiceTags && (
                              <Badge variant="secondary" className="text-xs">服务标签</Badge>
                            )}
                            {template.config.showDeliveryPromise && (
                              <Badge variant="secondary" className="text-xs">配送承诺</Badge>
                            )}
                            {template.config.showQuickCategories && (
                              <Badge variant="secondary" className="text-xs">快捷分类</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      模板详情
                    </CardTitle>
                    <CardDescription>当前选中模板的详细配置信息</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">样式配置</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">主色调</span>
                            <div className={`w-6 h-6 rounded ${currentTemplate.style.primaryColor}`}></div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">辅助色</span>
                            <div className={`w-6 h-6 rounded ${currentTemplate.style.secondaryColor}`}></div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">导航样式</span>
                            <span className="font-medium">
                              {currentTemplate.style.navStyle === 'default' ? '默认' : 
                               currentTemplate.style.navStyle === 'center' ? '中间突出' : '悬浮式'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">头部样式</span>
                            <span className="font-medium">
                              {currentTemplate.style.headerStyle === 'simple' ? '简洁' : 
                               currentTemplate.style.headerStyle === 'banner' ? '横幅' : '渐变'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">功能模块</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">门店定位</span>
                            <Badge variant={currentTemplate.config.showStoreLocation ? 'default' : 'outline'} className="text-xs">
                              {currentTemplate.config.showStoreLocation ? '开启' : '关闭'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">搜索栏</span>
                            <Badge variant={currentTemplate.config.showSearchBar ? 'default' : 'outline'} className="text-xs">
                              {currentTemplate.config.showSearchBar ? '开启' : '关闭'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">轮播图</span>
                            <Badge variant={currentTemplate.config.showBanner ? 'default' : 'outline'} className="text-xs">
                              {currentTemplate.config.showBanner ? '开启' : '关闭'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">服务标签</span>
                            <Badge variant={currentTemplate.config.showServiceTags ? 'default' : 'outline'} className="text-xs">
                              {currentTemplate.config.showServiceTags ? '开启' : '关闭'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">配送承诺</span>
                            <Badge variant={currentTemplate.config.showDeliveryPromise ? 'default' : 'outline'} className="text-xs">
                              {currentTemplate.config.showDeliveryPromise ? '开启' : '关闭'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">快捷分类</span>
                            <Badge variant={currentTemplate.config.showQuickCategories ? 'default' : 'outline'} className="text-xs">
                              {currentTemplate.config.showQuickCategories ? '开启' : '关闭'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">商品推荐</span>
                            <Badge variant={currentTemplate.config.showRecommendations ? 'default' : 'outline'} className="text-xs">
                              {currentTemplate.config.showRecommendations ? '开启' : '关闭'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 品牌配置 */}
              <TabsContent value="brand" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      顶部定位栏
                    </CardTitle>
                    <CardDescription>配置小程序顶部显示的店铺名称和距离信息</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>店铺名称</Label>
                        <Input
                          value={brandConfig.storeName}
                          onChange={(e) => setBrandConfig({ ...brandConfig, storeName: e.target.value })}
                          placeholder="海邻到家（南阳宛城店）"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>距离显示</Label>
                        <Input
                          value={brandConfig.distance}
                          onChange={(e) => setBrandConfig({ ...brandConfig, distance: e.target.value })}
                          placeholder="315m"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      品牌背景图
                    </CardTitle>
                    <CardDescription>配置首页顶部的品牌背景图和Logo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>背景图</Label>
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">点击上传背景图</p>
                          <p className="text-xs text-gray-400 mt-1">建议尺寸: 750x400px</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>品牌Logo</Label>
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                          <div className="w-16 h-16 mx-auto bg-green-100 rounded-lg flex items-center justify-center mb-2">
                            <Store className="h-8 w-8 text-green-600" />
                          </div>
                          <p className="text-sm text-gray-500">点击更换Logo</p>
                          <p className="text-xs text-gray-400 mt-1">建议尺寸: 200x200px</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5" />
                      核心宣传弹窗
                    </CardTitle>
                    <CardDescription>配置首页中央的宣传弹窗内容</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>主标题</Label>
                        <Input
                          value={brandConfig.slogan.title}
                          onChange={(e) => setBrandConfig({
                            ...brandConfig,
                            slogan: { ...brandConfig.slogan, title: e.target.value }
                          })}
                          placeholder="生鲜超市"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>副标题</Label>
                        <Input
                          value={brandConfig.slogan.subtitle}
                          onChange={(e) => setBrandConfig({
                            ...brandConfig,
                            slogan: { ...brandConfig.slogan, subtitle: e.target.value }
                          })}
                          placeholder="1小时极速送达"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>描述文字</Label>
                        <Input
                          value={brandConfig.slogan.description}
                          onChange={(e) => setBrandConfig({
                            ...brandConfig,
                            slogan: { ...brandConfig.slogan, description: e.target.value }
                          })}
                          placeholder="有机新鲜 质量保证"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-600">
                        <strong>预览效果：</strong>
                        <span className="ml-2 font-bold">{brandConfig.slogan.title}</span>
                        <span className="ml-2">{brandConfig.slogan.subtitle}</span>
                        <span className="ml-2 text-gray-500">{brandConfig.slogan.description}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 快速分类按钮 */}
              <TabsContent value="quick" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <LayoutGrid className="h-5 w-5" />
                          快速分类按钮
                        </CardTitle>
                        <CardDescription>配置首页背景图下方的快速分类入口按钮</CardDescription>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => setAddQuickCategoryOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        添加分类
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {quickCategories.map((cat) => (
                        <div key={cat.id} className="p-4 border rounded-lg group relative">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl">{cat.icon}</span>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={cat.enabled}
                                onCheckedChange={(checked) => 
                                  setQuickCategories(quickCategories.map(c => 
                                    c.id === cat.id ? { ...c, enabled: checked } : c
                                  ))
                                }
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteCategory('quick', cat.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="font-medium text-sm">{cat.name}</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => handleEditItem('quickCategory', cat)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            编辑
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 品类图标导航 */}
              <TabsContent value="categories" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <LayoutGrid className="h-5 w-5" />
                          全品类图标导航
                        </CardTitle>
                        <CardDescription>配置首页的品类图标入口（最多8个）</CardDescription>
                      </div>
                      <Button 
                        size="sm" 
                        disabled={categoryIcons.length >= 8}
                        onClick={() => setAddCategoryOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        添加品类
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {categoryIcons.map((cat) => (
                        <div key={cat.id} className="p-4 border rounded-lg group relative">
                          <div className="flex items-center justify-between mb-3">
                            <div className={`w-12 h-12 ${cat.bgColor} rounded-full flex items-center justify-center text-2xl`}>
                              {cat.icon}
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={cat.enabled}
                                onCheckedChange={(checked) => 
                                  setCategoryIcons(categoryIcons.map(c => 
                                    c.id === cat.id ? { ...c, enabled: checked } : c
                                  ))
                                }
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteCategory('category', cat.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="font-medium text-sm">{cat.name}</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => handleEditItem('categoryIcon', cat)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            编辑
                          </Button>
                        </div>
                      ))}
                    </div>
                    {categoryIcons.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        暂无品类图标，点击上方"添加品类"按钮添加
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 公告设置 */}
              <TabsContent value="notice" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5" />
                      店铺公告
                    </CardTitle>
                    <CardDescription>配置首页显示的店铺公告内容</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>启用公告</Label>
                      <Switch
                        checked={storeNotice.enabled}
                        onCheckedChange={(checked) => setStoreNotice({ ...storeNotice, enabled: checked })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>公告内容</Label>
                      <Textarea
                        value={storeNotice.content}
                        onChange={(e) => setStoreNotice({ ...storeNotice, content: e.target.value })}
                        placeholder="请输入公告内容..."
                        rows={3}
                        disabled={!storeNotice.enabled}
                      />
                    </div>
                    {storeNotice.enabled && storeNotice.content && (
                      <div className="flex items-center bg-gray-50 rounded-lg overflow-hidden">
                        <div className="bg-red-500 text-white text-xs px-2 py-2 font-medium">
                          <Megaphone className="h-3 w-3 inline mr-1" />
                          公告
                        </div>
                        <div className="flex-1 px-3 py-2 text-xs text-gray-600">
                          {storeNotice.content}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 底部导航 */}
              <TabsContent value="nav" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Navigation className="h-5 w-5" />
                      底部导航栏
                    </CardTitle>
                    <CardDescription>配置小程序底部导航栏（最多5个入口）</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {bottomNav.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className={`text-2xl ${item.isCenter ? 'bg-red-500 rounded-full p-2' : ''}`}>
                            <span className={item.isCenter ? 'text-white' : ''}>{item.icon}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.link}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.isCenter && (
                              <Badge variant="secondary">中央突出</Badge>
                            )}
                            <Switch
                              checked={item.enabled}
                              onCheckedChange={(checked) => 
                                setBottomNav(bottomNav.map(n => 
                                  n.id === item.id ? { ...n, enabled: checked } : n
                                ))
                              }
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditItem('bottomNav', item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 商品管理 */}
              <TabsContent value="products" className="space-y-4">
                {/* 商品管理说明 */}
                <Card className="bg-gradient-to-r from-blue-50 to-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      小程序商品管理
                    </CardTitle>
                    <CardDescription>
                      小程序商品由总部商品库选择上架，价格默认与店铺相同，可通过促销活动实现优惠
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-white/80 rounded-lg">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Database className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">总部商品库</p>
                          <p className="text-sm text-muted-foreground">统一商品数据来源</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white/80 rounded-lg">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <RefreshCw className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">价格同步</p>
                          <p className="text-sm text-muted-foreground">价格默认与店铺相同</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white/80 rounded-lg">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <Tag className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">促销优惠</p>
                          <p className="text-sm text-muted-foreground">支持多种营销活动</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 已上架商品 */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>已上架商品</CardTitle>
                        <CardDescription>管理小程序商城上架的商品</CardDescription>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => setProductSelectDialogOpen(true)}
                      >
                        <Database className="h-4 w-4 mr-1" />
                        从商品库上架
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* 已上架商品列表 */}
                      {onShelfProducts.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>暂无上架商品</p>
                          <p className="text-sm mt-1">点击上方"从商品库上架"添加商品</p>
                        </div>
                      ) : (
                        onShelfProducts.map((product) => (
                          <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{product.name}</span>
                                <Badge variant="outline" className="text-xs">{product.category}</Badge>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span>售价: <span className="text-red-500 font-medium">¥{product.price?.toFixed(2) || '0.00'}</span></span>
                                <span>库存: {product.stock}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="bg-green-500">上架中</Badge>
                              <Switch 
                                checked={product.status === 'on_sale'} 
                                onCheckedChange={(checked) => {
                                  if (!checked) {
                                    handleRemoveFromShelf(product.id);
                                  }
                                }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 商品选择对话框 */}
                <Dialog open={productSelectDialogOpen} onOpenChange={setProductSelectDialogOpen}>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>从商品库选择商品</DialogTitle>
                      <DialogDescription>
                        选择要上架到小程序商城的商品
                      </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                      {loadingProducts ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>加载商品中...</span>
                        </div>
                      ) : availableProducts.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>暂无商品</p>
                          <p className="text-sm mt-1">请先在总部商品库添加商品</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {availableProducts.map((product) => (
                            <div 
                              key={product.id} 
                              className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{product.name}</span>
                                  <Badge variant="outline" className="text-xs">{product.category}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ¥{product.price?.toFixed(2) || '0.00'} / {product.unit} | 库存: {product.stock}
                                </div>
                              </div>
                              <Button 
                                size="sm"
                                onClick={() => handleAddToShelf(product)}
                                disabled={onShelfProducts.some(p => p.id === product.id)}
                              >
                                {onShelfProducts.some(p => p.id === product.id) ? '已上架' : '上架'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setProductSelectDialogOpen(false)}>
                        完成
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* 促销活动入口 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      促销活动
                    </CardTitle>
                    <CardDescription>通过促销活动实现商品优惠，支持打折、优惠券、买赠、秒杀等</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-24 flex flex-col gap-2"
                        onClick={() => window.location.href = '/marketing/promotions'}
                      >
                        <Percent className="h-8 w-8 text-purple-500" />
                        <span>打折促销</span>
                        <span className="text-xs text-muted-foreground">设置商品折扣</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-24 flex flex-col gap-2"
                        onClick={() => window.location.href = '/marketing/coupons'}
                      >
                        <Ticket className="h-8 w-8 text-orange-500" />
                        <span>优惠券</span>
                        <span className="text-xs text-muted-foreground">发放优惠券</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-24 flex flex-col gap-2"
                        onClick={() => window.location.href = '/marketing/promotions'}
                      >
                        <Gift className="h-8 w-8 text-pink-500" />
                        <span>买赠活动</span>
                        <span className="text-xs text-muted-foreground">买X送Y</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-24 flex flex-col gap-2"
                        onClick={() => window.location.href = '/marketing/promotions'}
                      >
                        <Zap className="h-8 w-8 text-yellow-500" />
                        <span>限时秒杀</span>
                        <span className="text-xs text-muted-foreground">限时特价</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 会员管理 */}
              <TabsContent value="member" className="space-y-4">
                {/* 会员体系说明 */}
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      总部统一会员管理
                    </CardTitle>
                    <CardDescription>
                      会员体系支持全店通用，会员积分可在所有门店和小程序商城使用
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-white/80 rounded-lg">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Store className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">全店通用</p>
                          <p className="text-sm text-muted-foreground">会员在所有门店均可使用</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white/80 rounded-lg">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Star className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">积分互通</p>
                          <p className="text-sm text-muted-foreground">线上线下积分统一累计</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white/80 rounded-lg">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <Crown className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">等级统一</p>
                          <p className="text-sm text-muted-foreground">会员等级全平台统一</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 快捷操作 */}
                <Card>
                  <CardHeader>
                    <CardTitle>会员管理入口</CardTitle>
                    <CardDescription>点击下方按钮进入总部统一会员管理系统</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col gap-2"
                        onClick={() => window.location.href = '/members/unified'}
                      >
                        <Users className="h-6 w-6" />
                        <span>会员列表管理</span>
                        <span className="text-xs text-muted-foreground">查看、编辑、导入会员</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col gap-2"
                        onClick={() => window.location.href = '/members/unified'}
                      >
                        <Gift className="h-6 w-6" />
                        <span>积分管理</span>
                        <span className="text-xs text-muted-foreground">积分发放、调整、查询</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 会员等级配置 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5" />
                      会员等级体系
                    </CardTitle>
                    <CardDescription>四级会员体系，等级越高权益越多</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { level: 'diamond', name: '钻石会员', icon: '💎', color: 'bg-purple-500', points: '10000+', discount: '9折', rate: '2倍积分', benefits: ['全场9折', '生日三倍积分', '每月3张优惠券', '专属生日礼'] },
                        { level: 'gold', name: '金卡会员', icon: '👑', color: 'bg-amber-500', points: '5000-9999', discount: '95折', rate: '1.5倍积分', benefits: ['全场95折', '生日三倍积分', '每月2张优惠券'] },
                        { level: 'silver', name: '银卡会员', icon: '⭐', color: 'bg-slate-400', points: '1000-4999', discount: '98折', rate: '1.2倍积分', benefits: ['全场98折', '生日双倍积分', '每月1张优惠券'] },
                        { level: 'normal', name: '普通会员', icon: '👤', color: 'bg-gray-400', points: '0-999', discount: '无折扣', rate: '1倍积分', benefits: ['生日双倍积分'] },
                      ].map((item) => (
                        <div key={item.level} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center text-white text-xl`}>
                            {item.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.name}</span>
                              <Badge variant="outline" className="text-xs">{item.points}积分</Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span>折扣: {item.discount}</span>
                              <span>积分比例: {item.rate}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.benefits.map((b, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{b}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 积分规则 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      积分规则
                    </CardTitle>
                    <CardDescription>会员积分获取和使用规则</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-3 text-green-600">积分获取</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            消费获得积分（按会员等级比例）
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            生日当天双倍/三倍积分
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            评价商品获得5积分
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            邀请好友获得50积分
                          </li>
                        </ul>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-3 text-orange-600">积分使用</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-orange-500" />
                            积分商城兑换商品
                          </li>
                          <li className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-orange-500" />
                            积分抵扣现金（100积分=1元）
                          </li>
                          <li className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-orange-500" />
                            积分兑换优惠券
                          </li>
                          <li className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            积分有效期为2年
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 营销管理 */}
              <TabsContent value="marketing" className="space-y-4">
                {/* 促销活动入口 */}
                <Card className="bg-gradient-to-r from-orange-50 to-yellow-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      促销活动管理
                    </CardTitle>
                    <CardDescription>
                      通过促销活动实现商品优惠，支持打折、优惠券、买赠、秒杀等多种营销方式
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-24 flex flex-col gap-2 bg-white"
                        onClick={() => window.location.href = '/marketing/promotions'}
                      >
                        <Percent className="h-8 w-8 text-purple-500" />
                        <span>打折促销</span>
                        <span className="text-xs text-muted-foreground">设置商品折扣</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-24 flex flex-col gap-2 bg-white"
                        onClick={() => window.location.href = '/marketing/coupons'}
                      >
                        <Ticket className="h-8 w-8 text-orange-500" />
                        <span>优惠券</span>
                        <span className="text-xs text-muted-foreground">发放优惠券</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-24 flex flex-col gap-2 bg-white"
                        onClick={() => window.location.href = '/marketing/promotions'}
                      >
                        <Gift className="h-8 w-8 text-pink-500" />
                        <span>买赠活动</span>
                        <span className="text-xs text-muted-foreground">买X送Y</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-24 flex flex-col gap-2 bg-white"
                        onClick={() => window.location.href = '/marketing/promotions'}
                      >
                        <Zap className="h-8 w-8 text-yellow-500" />
                        <span>限时秒杀</span>
                        <span className="text-xs text-muted-foreground">限时特价</span>
                      </Button>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        已有促销活动 3 个进行中
                      </span>
                      <Button 
                        variant="link" 
                        onClick={() => window.location.href = '/marketing/promotions'}
                      >
                        查看全部促销 →
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 优惠券配置 */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Ticket className="h-5 w-5" />
                          优惠券配置
                        </CardTitle>
                        <CardDescription>配置小程序商城的优惠券活动</CardDescription>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => setAddCouponOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        添加优惠券
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {coupons.map((coupon) => (
                        <div key={coupon.id} className="flex items-center gap-4 p-4 border rounded-lg group">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            coupon.type === 'discount' ? 'bg-purple-100' : 
                            coupon.type === 'cash' ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            {coupon.type === 'discount' ? (
                              <Percent className={`h-6 w-6 ${coupon.type === 'discount' ? 'text-purple-600' : 'text-red-600'}`} />
                            ) : (
                              <Gift className="h-6 w-6 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{coupon.name}</div>
                            <div className="text-sm text-gray-500">
                              {coupon.type === 'discount' ? `${coupon.value}折优惠` : `满${coupon.minAmount}减${coupon.value}`}
                              {' · '}{coupon.expireDays}天内有效
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={coupon.enabled}
                              onCheckedChange={(checked) => 
                                setCoupons(coupons.map(c => 
                                  c.id === coupon.id ? { ...c, enabled: checked } : c
                                ))
                              }
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditItem('coupon', coupon)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteCoupon(coupon.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {coupons.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          暂无优惠券，点击上方"添加优惠券"按钮添加
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 活动标签 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      活动标签
                    </CardTitle>
                    <CardDescription>配置底部导航栏左上角的活动标签</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>启用活动标签</Label>
                      <Switch
                        checked={activityTag.enabled}
                        onCheckedChange={(checked) => setActivityTag({ ...activityTag, enabled: checked })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>标签文字</Label>
                      <Input
                        value={activityTag.text}
                        onChange={(e) => setActivityTag({ ...activityTag, text: e.target.value })}
                        placeholder="定金预售"
                        disabled={!activityTag.enabled}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 其他设置 */}
              <TabsContent value="other" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>配色方案</CardTitle>
                    <CardDescription>自定义小程序的主题颜色</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { name: '经典红', primary: 'bg-red-500', bg: 'bg-red-50' },
                        { name: '清新绿', primary: 'bg-green-500', bg: 'bg-green-50' },
                        { name: '活力橙', primary: 'bg-orange-500', bg: 'bg-orange-50' },
                        { name: '商务蓝', primary: 'bg-blue-500', bg: 'bg-blue-50' },
                      ].map((color, idx) => (
                        <div key={idx} className="p-4 border rounded-lg cursor-pointer hover:border-gray-400">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-6 h-6 ${color.primary} rounded`} />
                            <div className={`w-6 h-6 ${color.bg} rounded border`} />
                          </div>
                          <div className="text-sm font-medium">{color.name}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* 编辑对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑配置</DialogTitle>
            <DialogDescription>
              修改各项配置信息
            </DialogDescription>
          </DialogHeader>
          
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>名称</Label>
                <Input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>图标</Label>
                <Input
                  value={editingItem.icon}
                  onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                />
              </div>

              {editingType === 'categoryIcon' && (
                <div className="space-y-2">
                  <Label>背景色</Label>
                  <Select
                    value={editingItem.bgColor}
                    onValueChange={(value) => setEditingItem({ ...editingItem, bgColor: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bg-blue-100">蓝色</SelectItem>
                      <SelectItem value="bg-green-100">绿色</SelectItem>
                      <SelectItem value="bg-yellow-100">黄色</SelectItem>
                      <SelectItem value="bg-orange-100">橙色</SelectItem>
                      <SelectItem value="bg-pink-100">粉色</SelectItem>
                      <SelectItem value="bg-purple-100">紫色</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editingType === 'bottomNav' && (
                <div className="space-y-2">
                  <Label>跳转链接</Label>
                  <Input
                    value={editingItem.link}
                    onChange={(e) => setEditingItem({ ...editingItem, link: e.target.value })}
                  />
                </div>
              )}

              {editingType === 'coupon' && (
                <>
                  <div className="space-y-2">
                    <Label>优惠券类型</Label>
                    <Select
                      value={editingItem.type}
                      onValueChange={(value) => setEditingItem({ ...editingItem, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">满减券</SelectItem>
                        <SelectItem value="discount">折扣券</SelectItem>
                        <SelectItem value="free_shipping">免运费券</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{editingItem.type === 'discount' ? '折扣(折)' : '金额(元)'}</Label>
                      <Input
                        type="number"
                        value={editingItem.value}
                        onChange={(e) => setEditingItem({ ...editingItem, value: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>最低消费(元)</Label>
                      <Input
                        type="number"
                        value={editingItem.minAmount}
                        onChange={(e) => setEditingItem({ ...editingItem, minAmount: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>有效期(天)</Label>
                    <Input
                      type="number"
                      value={editingItem.expireDays}
                      onChange={(e) => setEditingItem({ ...editingItem, expireDays: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveItem}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加品类图标对话框 */}
      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加品类图标</DialogTitle>
            <DialogDescription>
              添加新的品类图标到导航栏
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>品类名称</Label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="如：水果蔬菜"
              />
            </div>
            
            <div className="space-y-2">
              <Label>图标 (Emoji)</Label>
              <div className="flex gap-2 flex-wrap">
                {['🥬', '🍚', '🍪', '🥛', '🍷', '🍵', '🎁', '🧴', '🍎', '🍊', '🥩', '📦', '🧹', '🧸', '📱', '💄'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewCategory({ ...newCategory, icon: emoji })}
                    className={`w-10 h-10 text-xl rounded-lg border transition-colors ${
                      newCategory.icon === emoji ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>背景色</Label>
              <Select
                value={newCategory.bgColor}
                onValueChange={(value) => setNewCategory({ ...newCategory, bgColor: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bg-blue-100">蓝色</SelectItem>
                  <SelectItem value="bg-green-100">绿色</SelectItem>
                  <SelectItem value="bg-yellow-100">黄色</SelectItem>
                  <SelectItem value="bg-orange-100">橙色</SelectItem>
                  <SelectItem value="bg-pink-100">粉色</SelectItem>
                  <SelectItem value="bg-purple-100">紫色</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCategoryOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddCategory}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加快速分类对话框 */}
      <Dialog open={addQuickCategoryOpen} onOpenChange={setAddQuickCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加快速分类</DialogTitle>
            <DialogDescription>
              添加新的快速分类按钮
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>分类名称</Label>
              <Input
                value={newQuickCategory.name}
                onChange={(e) => setNewQuickCategory({ ...newQuickCategory, name: e.target.value })}
                placeholder="如：热销"
              />
            </div>
            
            <div className="space-y-2">
              <Label>图标 (Emoji)</Label>
              <div className="flex gap-2 flex-wrap">
                {['🍎', '🥬', '🥩', '📦', '🔥', '⭐', '🎁', '💎', '🛒', '🏠', '☕', '🍞', '🧀', '🥤', '🍭', '🧁'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewQuickCategory({ ...newQuickCategory, icon: emoji })}
                    className={`w-10 h-10 text-xl rounded-lg border transition-colors ${
                      newQuickCategory.icon === emoji ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>背景色</Label>
              <Select
                value={newQuickCategory.color}
                onValueChange={(value) => setNewQuickCategory({ ...newQuickCategory, color: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bg-blue-100">蓝色</SelectItem>
                  <SelectItem value="bg-green-100">绿色</SelectItem>
                  <SelectItem value="bg-yellow-100">黄色</SelectItem>
                  <SelectItem value="bg-orange-100">橙色</SelectItem>
                  <SelectItem value="bg-pink-100">粉色</SelectItem>
                  <SelectItem value="bg-red-100">红色</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddQuickCategoryOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddQuickCategory}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加优惠券对话框 */}
      <Dialog open={addCouponOpen} onOpenChange={setAddCouponOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加优惠券</DialogTitle>
            <DialogDescription>
              创建新的优惠券活动
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>优惠券名称</Label>
              <Input
                value={newCoupon.name}
                onChange={(e) => setNewCoupon({ ...newCoupon, name: e.target.value })}
                placeholder="如：新用户专享券"
              />
            </div>
            
            <div className="space-y-2">
              <Label>优惠券类型</Label>
              <Select
                value={newCoupon.type}
                onValueChange={(value: 'cash' | 'discount' | 'free_shipping') => 
                  setNewCoupon({ ...newCoupon, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">满减券</SelectItem>
                  <SelectItem value="discount">折扣券</SelectItem>
                  <SelectItem value="free_shipping">免运费券</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{newCoupon.type === 'discount' ? '折扣(折)' : '金额(元)'}</Label>
                <Input
                  type="number"
                  value={newCoupon.value}
                  onChange={(e) => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>最低消费(元)</Label>
                <Input
                  type="number"
                  value={newCoupon.minAmount}
                  onChange={(e) => setNewCoupon({ ...newCoupon, minAmount: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>有效期(天)</Label>
              <Input
                type="number"
                value={newCoupon.expireDays}
                onChange={(e) => setNewCoupon({ ...newCoupon, expireDays: Number(e.target.value) })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCouponOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddCoupon}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 小程序码生成对话框 */}
      <Dialog open={qrCodeDialogOpen} onOpenChange={setQrCodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              小程序码生成
            </DialogTitle>
            <DialogDescription>
              生成小程序码，顾客扫码即可进入店铺小程序
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 小程序码预览 */}
            <div className="flex justify-center">
              <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg flex flex-col items-center justify-center p-4">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                  <QrCode className="h-16 w-16 text-gray-300" />
                </div>
                <p className="text-xs text-gray-400 text-center">小程序码预览</p>
              </div>
            </div>
            
            {/* 小程序信息 */}
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">店铺名称</span>
                  <span className="text-sm font-medium">{brandConfig.storeName}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">小程序路径</span>
                  <code className="text-xs bg-background px-2 py-0.5 rounded">pages/index/index</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">已上架商品</span>
                  <Badge variant="secondary">{onShelfProducts.length} 个</Badge>
                </div>
              </div>
            </div>
            
            {/* 操作提示 */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>操作步骤：</strong>
              </p>
              <ol className="text-sm text-blue-600 mt-2 space-y-1 list-decimal list-inside">
                <li>复制小程序路径</li>
                <li>登录微信小程序后台</li>
                <li>进入"工具" → "生成小程序码"</li>
                <li>粘贴路径并生成</li>
              </ol>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => {
              const miniAppPath = 'pages/index/index';
              navigator.clipboard.writeText(miniAppPath);
              toast.success('小程序路径已复制');
            }}>
              复制路径
            </Button>
            <Button onClick={() => {
              setQrCodeDialogOpen(false);
              toast.success('请在微信小程序后台生成小程序码');
            }}>
              我知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
