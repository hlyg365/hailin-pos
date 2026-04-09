'use client';

// 强制动态渲染，因为页面依赖客户端认证
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { usePosAuth } from '@/contexts/PosAuthContext';
import { useOfflineStatus } from '@/hooks/useOffline';
import { useHardware } from '@/hooks/useHardware';
import { usePosSpeech } from '@/hooks/usePosSpeech';
import { 
  ProductsStore, OrdersStore, OfflineProduct, OfflineOrder 
} from '@/lib/offline-db';
import { 
  calculateOrderPoints,
  calculateMemberDiscount,
  getMemberLevelInfo,
  type MemberLevelId
} from '@/lib/member-service';
import ReportsPage from '@/components/reports-page';
import { 
  Search, Plus, Minus, User, Gift, Ticket, Store, 
  Wallet, Smartphone, X, Printer, Clipboard, 
  ShoppingBag, Menu, LayoutGrid, List, BookMarked,
  Scale, Keyboard, Calculator, Percent, Eraser, Package,
  CreditCard, Banknote, QrCode, Clock, Users, Tag,
  Settings, LogOut, Bell, Sun, Moon, ChevronRight, ChevronDown, ChevronUp,
  Sparkles, Zap, ArrowRight, Check, AlertCircle,
  HandCoins, Receipt, ShoppingCart, RefreshCw, MoreHorizontal,
  Truck, Camera, Loader2, WifiOff, Cloud, CloudOff,
  UserPlus, Barcode, Edit, Volume2, HardDrive, TrendingUp,
  PieChart, BarChart3, ArrowUpRight, ArrowDownRight, Download,
  FileText, Calendar, MapPin, Phone, RotateCcw, Lock, Send, Monitor,
  MessageCircle, Bot, Box,
} from 'lucide-react';
import { AiAssistantButton } from '@/components/ai-assistant-chat';
import { QRCodeSVG } from 'qrcode.react';

// 从字符串生成稳定的数字ID（用于条码转ID）
function generateStableId(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// 商品类型定义
type ProductType = 'standard' | 'weighted' | 'counted';

interface Product {
  id: number;
  barcode?: string;
  name: string;
  price: number;
  originalPrice?: number;
  icon: string;
  images?: string[]; // 商品图片数组，第一张为主图
  stock: number;
  unit: string;
  type: ProductType;
  hasBarcode: boolean;
  isWeighted: boolean;
  isCounted: boolean;
  isHot?: boolean;
  isNew?: boolean;
  category: string;
  brand?: string;
  specification?: string;
  imageUrl?: string;
  originalProductId?: string; // 原始商品ID（用于获取图片）
}

// 购物车项目类型定义
interface CartItem {
  id: number;
  barcode?: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  unit: string;
  discount: number;
  isWeighted: boolean;
  isCounted: boolean;
  hasBarcode: boolean;
  remark?: string;
  imageUrl?: string;
  icon?: string;
}

// 挂单类型定义
interface SuspendedOrder {
  id: string;
  createdAt: Date;
  items: CartItem[];
  member: any;
  priceAdjustment: number;
  isFractionRemoved: boolean;
  itemCount: number;
  totalAmount: number;
}

// 快捷支付方式
interface PaymentMethod {
  id: string;
  name: string;
  icon: any;
  color: string;
  bgColor: string;
}

// 后台配置的支付方式
interface SubPaymentMethod {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  is_headquarters_account?: boolean; // 是否收款到总部账户
  merchant_id?: string;
}

interface PaymentConfig {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  priority: number;
  is_headquarters_account?: boolean; // 是否收款到总部账户
  subMethods: SubPaymentMethod[];
}

// 商品数据
const productsByCategory: Record<string, Product[]> = {
  all: [
    // 标品
    { id: 1, barcode: '6901234567890', name: '矿泉水', price: 2.00, icon: '💧', stock: 150, unit: '瓶', type: 'standard', hasBarcode: true, isWeighted: false, isCounted: false, isHot: true, category: 'drinks' },
    { id: 2, barcode: '6901234567891', name: '可乐', price: 3.50, icon: '🥤', stock: 80, unit: '罐', type: 'standard', hasBarcode: true, isWeighted: false, isCounted: false, isHot: true, category: 'drinks' },
    { id: 3, barcode: '6901234567892', name: '方便面', price: 3.00, icon: '🍜', stock: 200, unit: '桶', type: 'standard', hasBarcode: true, isWeighted: false, isCounted: false, category: 'snacks' },
    { id: 4, barcode: '6901234567893', name: '薯片', price: 8.00, icon: '🥔', stock: 45, unit: '包', type: 'standard', hasBarcode: true, isWeighted: false, isCounted: false, category: 'snacks' },
    { id: 5, barcode: '6901234567894', name: '巧克力', price: 6.00, icon: '🍫', stock: 40, unit: '盒', type: 'standard', hasBarcode: true, isWeighted: false, isCounted: false, isNew: true, category: 'snacks' },
    { id: 6, barcode: '6901234567895', name: '饼干', price: 4.50, icon: '🍪', stock: 55, unit: '包', type: 'standard', hasBarcode: true, isWeighted: false, isCounted: false, category: 'snacks' },
    { id: 7, barcode: '6901234567896', name: '纯牛奶', price: 4.00, originalPrice: 5.00, icon: '🥛', stock: 60, unit: '盒', type: 'standard', hasBarcode: true, isWeighted: false, isCounted: false, isHot: true, category: 'drinks' },
    { id: 8, barcode: '6901234567897', name: '果汁', price: 5.50, icon: '🧃', stock: 70, unit: '盒', type: 'standard', hasBarcode: true, isWeighted: false, isCounted: false, category: 'drinks' },
    { id: 9, barcode: '6901234567898', name: '酸奶', price: 3.80, icon: '🥛', stock: 90, unit: '杯', type: 'standard', hasBarcode: true, isWeighted: false, isCounted: false, category: 'drinks' },
    // 称重商品
    { id: 10, name: '香蕉', price: 6.00, icon: '🍌', stock: 50, unit: '斤', type: 'weighted', hasBarcode: false, isWeighted: true, isCounted: false, isHot: true, category: 'fruits' },
    { id: 11, name: '苹果', price: 8.00, icon: '🍎', stock: 60, unit: '斤', type: 'weighted', hasBarcode: false, isWeighted: true, isCounted: false, category: 'fruits' },
    { id: 12, name: '西红柿', price: 4.50, icon: '🍅', stock: 40, unit: '斤', type: 'weighted', hasBarcode: false, isWeighted: true, isCounted: false, category: 'vegetables' },
    { id: 13, name: '土豆', price: 3.00, icon: '🥔', stock: 55, unit: '斤', type: 'weighted', hasBarcode: false, isWeighted: true, isCounted: false, category: 'vegetables' },
    { id: 14, name: '橙子', price: 7.00, icon: '🍊', stock: 70, unit: '斤', type: 'weighted', hasBarcode: false, isWeighted: true, isCounted: false, isNew: true, category: 'fruits' },
    { id: 15, name: '葡萄', price: 12.00, icon: '🍇', stock: 30, unit: '斤', type: 'weighted', hasBarcode: false, isWeighted: true, isCounted: false, category: 'fruits' },
    { id: 16, name: '黄瓜', price: 5.00, icon: '🥒', stock: 45, unit: '斤', type: 'weighted', hasBarcode: false, isWeighted: true, isCounted: false, category: 'vegetables' },
    { id: 17, name: '大白菜', price: 2.50, icon: '🥬', stock: 35, unit: '斤', type: 'weighted', hasBarcode: false, isWeighted: true, isCounted: false, category: 'vegetables' },
    // 计件商品
    { id: 18, name: '馒头', price: 1.50, icon: '🍞', stock: 100, unit: '个', type: 'counted', hasBarcode: false, isWeighted: false, isCounted: true, isHot: true, category: 'fresh' },
    { id: 19, name: '鸡蛋', price: 1.20, icon: '🥚', stock: 200, unit: '个', type: 'counted', hasBarcode: false, isWeighted: false, isCounted: true, category: 'fresh' },
    { id: 20, name: '玉米', price: 2.50, icon: '🌽', stock: 80, unit: '根', type: 'counted', hasBarcode: false, isWeighted: false, isCounted: true, isNew: true, category: 'fresh' },
    { id: 21, name: '红薯', price: 2.00, icon: '🍠', stock: 60, unit: '个', type: 'counted', hasBarcode: false, isWeighted: false, isCounted: true, category: 'fresh' },
    { id: 22, name: '豆腐', price: 3.00, icon: '🥜', stock: 50, unit: '块', type: 'counted', hasBarcode: false, isWeighted: false, isCounted: true, category: 'fresh' },
    { id: 23, name: '包子', price: 2.00, icon: '🥟', stock: 80, unit: '个', type: 'counted', hasBarcode: false, isWeighted: false, isCounted: true, isHot: true, category: 'fresh' },
  ],
};

// 分类定义
const categories = [
  { id: 'all', name: '全部', icon: LayoutGrid },
  { id: 'hot', name: '热销', icon: Zap },
  { id: 'standard', name: '标品', icon: Tag },
  { id: 'weighted', name: '称重', icon: Scale },
  { id: 'counted', name: '计件', icon: Package },
  { id: 'drinks', name: '饮品', icon: '🥤' },
  { id: 'fruits', name: '水果', icon: '🍎' },
  { id: 'vegetables', name: '蔬菜', icon: '🥬' },
  { id: 'snacks', name: '零食', icon: '🍪' },
  { id: 'fresh', name: '生鲜', icon: '🥖' },
];

// 支付方式
const paymentMethods: PaymentMethod[] = [
  { id: 'cash', name: '现金', icon: Banknote, color: 'text-green-600', bgColor: 'bg-green-50 hover:bg-green-100' },
  { id: 'wechat', name: '微信', icon: QrCode, color: 'text-green-500', bgColor: 'bg-green-50 hover:bg-green-100' },
  { id: 'alipay', name: '支付宝', icon: Smartphone, color: 'text-blue-500', bgColor: 'bg-blue-50 hover:bg-blue-100' },
  { id: 'card', name: '银行卡', icon: CreditCard, color: 'text-purple-500', bgColor: 'bg-purple-50 hover:bg-purple-100' },
  { id: 'mixed', name: '混合', icon: HandCoins, color: 'text-orange-500', bgColor: 'bg-orange-50 hover:bg-orange-100' },
];

export default function PosPage() {
  const router = useRouter();
  const { user, shop, isAuthenticated, logout, loading } = usePosAuth();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [member, setMember] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardInput, setKeyboardInput] = useState('');
  const [weightInfo, setWeightInfo] = useState<any>(null);
  const [priceAdjustment, setPriceAdjustment] = useState(0);
  const [isManualPrice, setIsManualPrice] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [paymentTab, setPaymentTab] = useState<'scan' | 'cash' | 'record' | 'other'>('scan');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [showCashKeyboard, setShowCashKeyboard] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFractionRemoved, setIsFractionRemoved] = useState(false); // 抹分状态
  
  // 挂单相关状态
  const [suspendedOrders, setSuspendedOrders] = useState<SuspendedOrder[]>([]);
  const [showSuspendedOrders, setShowSuspendedOrders] = useState(false);
  
  // 离线相关状态
  const { isOnline, isOffline, offlineDuration } = useOfflineStatus();
  const [offlineProducts, setOfflineProducts] = useState<OfflineProduct[]>([]);
  const [isLoadingOffline, setIsLoadingOffline] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);
  
  // 当前视图状态 - 用于在同一页面切换不同功能
  const [currentView, setCurrentView] = useState<string>('cashier');
  
  // 配送订单相关状态
  const [deliveryOrderType, setDeliveryOrderType] = useState<'miniprogram' | 'groupbuy'>('miniprogram');
  const [selectedGroupBuyBatch, setSelectedGroupBuyBatch] = useState<string>('B003');
  
  // 弹窗状态
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [showMemberListDialog, setShowMemberListDialog] = useState(false);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [showProcurementDialog, setShowProcurementDialog] = useState(false);
  
  // 整单改价弹窗状态
  const [showOrderPriceDialog, setShowOrderPriceDialog] = useState(false);
  const [orderPriceInput, setOrderPriceInput] = useState('');
  const [orderPriceReason, setOrderPriceReason] = useState('');
  
  // 打印弹窗状态
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  
  // 锁屏状态
  const [isLocked, setIsLocked] = useState(false);
  const [lockPassword, setLockPassword] = useState('');
  const [lockError, setLockError] = useState('');
  
  // 会员搜索状态
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [showMemberSearchResults, setShowMemberSearchResults] = useState(false);
  const [memberSearchResults, setMemberSearchResults] = useState<Array<{
    id: string;
    phone: string;
    name: string;
    level: string;
    points: number;
    registerDate: string;
  }>>([]);
  
  // 会员登录弹窗状态
  const [showMemberLoginDialog, setShowMemberLoginDialog] = useState(false);
  const [memberLoginSearch, setMemberLoginSearch] = useState('');
  
  // 会员数据列表
  const [memberList, setMemberList] = useState<Array<{
    id: string;
    phone: string;
    name: string;
    level: string;
    points: number;
    registerDate: string;
  }>>([
    { id: 'M001', phone: '13812341234', name: '张先生', level: '金卡', points: 2580, registerDate: '2024-01-15' },
    { id: 'M002', phone: '13956785678', name: '李女士', level: '银卡', points: 1260, registerDate: '2024-02-20' },
    { id: 'M003', phone: '13790129012', name: '王先生', level: '普通', points: 350, registerDate: '2024-03-10' },
    { id: 'M004', phone: '13611112222', name: '赵女士', level: '钻石', points: 5200, registerDate: '2023-12-01' },
    { id: 'M005', phone: '13533334444', name: '刘先生', level: '普通', points: 180, registerDate: '2024-03-25' },
  ]);
  
  // 库存详情展开状态
  const [expandedInventory, setExpandedInventory] = useState<string | null>(null);
  const [showProductSelectDialog, setShowProductSelectDialog] = useState(false);
  
  // 要货申请相关状态
  const [procurementItems, setProcurementItems] = useState<Array<{
    id: number;
    name: string;
    stock: number;
    request: number;
  }>>([
    { id: 1, name: '农夫山泉 550ml', stock: 12, request: 50 },
    { id: 2, name: '康师傅红烧牛肉面', stock: 8, request: 30 },
    { id: 3, name: '鸡蛋', stock: 20, request: 100 },
  ]);
  const [procurementUrgency, setProcurementUrgency] = useState<'normal' | 'urgent' | 'very-urgent'>('normal');
  const [procurementRemark, setProcurementRemark] = useState('');
  const [productSelectSearch, setProductSelectSearch] = useState('');
  
  // 商品管理相关状态
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  
  // 报表日期状态
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // 会员表单状态
  const [memberForm, setMemberForm] = useState({
    phone: '',
    name: '',
    birthday: '',
    gender: 'male',
  });

  // 会员注册模式状态
  const [memberRegisterMode, setMemberRegisterMode] = useState<'manual' | 'qrcode'>('manual');
  const [memberRegisterQrCode, setMemberRegisterQrCode] = useState('');
  const [memberRegisterSessionId, setMemberRegisterSessionId] = useState('');
  const [isPollingRegister, setIsPollingRegister] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  
  // 非标品筛选状态
  const [showOnlyNonStandard, setShowOnlyNonStandard] = useState(false);
  
  // 订单管理相关状态
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderFilterType, setOrderFilterType] = useState<'all' | 'pos' | 'app' | 'self'>('all');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [expandedOrderStats, setExpandedOrderStats] = useState(true);
  const [posOrders, setPosOrders] = useState<OfflineOrder[]>([]);  // 从 IndexedDB 加载的真实订单
  
  // 退货弹窗相关状态
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundOrderData, setRefundOrderData] = useState<{
    id: string;
    time: string;
    cashier: string;
    paymentMethod: string;
    totalAmount: number;
    paidAmount: number;
    discount: number;
  } | null>(null);
  const [refundItems, setRefundItems] = useState<Array<{
    id: number;
    name: string;
    image: string;
    price: number;
    quantity: number;
    maxQuantity: number;
    amount: number;
    selected: boolean;
  }>>([]);
  const [refundType, setRefundType] = useState<'refund-return' | 'refund-only'>('refund-return');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'original' | 'wechat' | 'alipay'>('original');
  const [refundReason, setRefundReason] = useState<string>('顾客不想要了');
  const [refundRemark, setRefundRemark] = useState('');
  
  // 优惠券核销相关状态
  const [showCouponVerifyDialog, setShowCouponVerifyDialog] = useState(false);
  const [couponVerifyCode, setCouponVerifyCode] = useState('');
  const [couponVerifyLoading, setCouponVerifyLoading] = useState(false);
  const [couponVerifyResult, setCouponVerifyResult] = useState<{
    success: boolean;
    message: string;
    coupon?: {
      id: string;
      code: string;
      templateName: string;
      couponType: string;
      discountAmount?: number;
      discountRate?: number;
      minAmount?: number;
    };
  } | null>(null);
  
  // 促销表单状态
  const [promotionForm, setPromotionForm] = useState({
    type: 'discount' as 'discount' | 'fullreduce' | 'special',
    name: '',
    discount: 0.9,
    fullAmount: 100,
    reduceAmount: 10,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    applyScope: 'all' as 'all' | 'selected',  // all=全场, selected=指定商品
    selectedProductIds: [] as number[],  // 选中的商品ID列表
    specialPrices: {} as Record<number, number>,  // 特价商品的价格映射 {商品ID: 特价}
  });
  
  // 促销商品选择弹窗搜索
  const [promotionProductSearch, setPromotionProductSearch] = useState('');
  
  // 促销活动列表状态
  // status: pending(待审批), approved(已通过/进行中), rejected(已拒绝), ended(已结束)
  // applyScope: all(全场), selected(指定商品)
  const [promotionList, setPromotionList] = useState<Array<{
    id: string;
    type: 'discount' | 'fullreduce' | 'special';
    name: string;
    discount?: number;
    fullAmount?: number;
    reduceAmount?: number;
    startDate: string;
    endDate: string;
    status: 'pending' | 'approved' | 'rejected' | 'ended';
    createTime: string;
    approveTime?: string;
    rejectReason?: string;
    applyScope: 'all' | 'selected';
    productIds?: number[];
    specialPrices?: Record<number, number>;  // 特价商品的价格映射 {商品ID: 特价}
    source: 'headquarters' | 'store';  // 促销来源：总部/本店
  }>>([
    {
      id: 'P001',
      type: 'fullreduce',
      name: '满减活动',
      fullAmount: 50,
      reduceAmount: 5,
      startDate: '2024-03-01',
      endDate: '2024-03-31',
      status: 'approved',
      createTime: '2024-02-28 10:00',
      approveTime: '2024-02-28 14:00',
      applyScope: 'all',
      source: 'headquarters',  // 总部促销
    },
    {
      id: 'P002',
      type: 'discount',
      name: '饮料9折',
      discount: 0.9,
      startDate: '2024-03-15',
      endDate: '2024-03-20',
      status: 'approved',
      createTime: '2024-03-10 09:00',
      approveTime: '2024-03-10 15:00',
      applyScope: 'selected',
      productIds: [1, 2, 7, 8, 9],  // 饮料类商品
      source: 'store',  // 本店促销
    },
    {
      id: 'P003',
      type: 'special',
      name: '农夫山泉特价',
      discount: 1.5,
      startDate: '2024-03-18',
      endDate: '2024-03-25',
      status: 'pending',
      createTime: '2024-03-17 16:00',
      applyScope: 'selected',
      productIds: [1],
      source: 'store',  // 本店促销
    },
    {
      id: 'P004',
      type: 'fullreduce',
      name: '春节特惠',
      fullAmount: 100,
      reduceAmount: 15,
      startDate: '2024-02-01',
      endDate: '2024-02-15',
      status: 'ended',
      createTime: '2024-01-25 10:00',
      approveTime: '2024-01-26 09:00',
      applyScope: 'all',
      source: 'headquarters',  // 总部促销
    },
    {
      id: 'P005',
      type: 'discount',
      name: '零食85折',
      discount: 0.85,
      startDate: '2024-03-20',
      endDate: '2024-03-30',
      status: 'rejected',
      createTime: '2024-03-15 11:00',
      rejectReason: '折扣力度过大，影响毛利',
      applyScope: 'selected',
      productIds: [3, 4, 5, 6],  // 零食类商品
      source: 'store',  // 本店促销
    },
  ]);
  
  // 获取当前有效的促销活动
  const getActivePromotions = () => {
    const today = new Date().toISOString().split('T')[0];
    return promotionList.filter(p => 
      p.status === 'approved' && 
      p.startDate <= today && 
      p.endDate >= today
    );
  };
  
  // 计算购物车促销折扣
  const calculatePromotionDiscount = () => {
    const activePromotions = getActivePromotions();
    if (activePromotions.length === 0) return 0;
    
    let totalDiscount = 0;
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    activePromotions.forEach(promo => {
      if (promo.type === 'fullreduce' && promo.fullAmount && promo.reduceAmount) {
        // 满减活动
        if (subtotal >= promo.fullAmount) {
          // 计算可以减多少次（满100减10，满200减20...）
          const times = Math.floor(subtotal / promo.fullAmount);
          totalDiscount += promo.reduceAmount * times;
        }
      }
    });
    
    return totalDiscount;
  };
  
  // 新商品表单状态
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    barcode: '',
    brand: '',         // 品牌
    specification: '', // 规格
    price: '',
    category: 'snacks',
    unit: '个',
    stock: '',
    imageUrl: '',      // 商品图片URL
  });
  
  // AI条码识别状态
  const [aiRecognizing, setAiRecognizing] = useState(false);
  const [aiRecognized, setAiRecognized] = useState(false);
  
  // 设置状态管理
  const [settings, setSettings] = useState({
    // 系统设置
    paymentVoiceEnabled: true,
    scanPaymentVoiceEnabled: true,
    itemCountVoiceEnabled: false,
    meituanVoiceEnabled: true,
    cartAddVoiceEnabled: false,
    autoStart: true,
    adVolume: 30,
    voiceVolume: 100,
    
    // 其他功能设置
    shiftModeEnabled: false,
    takeawayEnabled: true,
    freshModeEnabled: true,
    
    // 小票打印设置
    receiptShopName: '海邻到家便利店天润苑B区店',
    receiptAddress: '河南省南阳市宛城区长江路东段与蒲山路宝城天润B区',
    receiptPhone: '18637791618',
    thanksText: '多谢惠顾，欢迎下次再来！',
    printCopies: 1,
    showReceiptNumber: false,
    showStandardUnit: true,
    showNonStandardUnit: true,
    showMemberBalance: true,
    showMemberPoints: true,
    showThanksText: true,
    showShopInfo: true,
    
    // 电子秤设置
    scalePort: 'COM1',
    scaleBaudRate: 9600,
    barcodeScaleType: 'none' as 'none' | 'tm-ab' | 'tm-f' | 'ls2zx',
    aiScaleEnabled: false,
    aiScaleModel: 'doubao-seed-1-6-vision-250815',
    aiScaleTemperature: 0.3,
    aiScaleAutoRecognize: true,
    aiScaleConfidence: 0.8,
    
    // 价签打印设置（三种标准模板）
    labelPaperSize: '70x38' as '70x38' | '60x40' | '50x30',
    labelShowName: true,
    labelShowPrice: true,
    labelShowBarcode: true,
    labelShowSpec: true,
    labelShowOrigin: true,
    labelShowUnit: true,
    labelShowGrade: true,
    labelShowMemberPrice: false,
    labelShowSupervision: true,
    labelSupervisionText: '物价局监制 监督电话: 12358',
    labelAutoPrintOnPriceChange: true,
    
    // 钱箱设置
    cashDrawerEnabled: true,
    cashDrawerPassword: '',
    cashDrawerAutoOpen: true,
    cashDrawerOpenDelay: 100, // 打开延迟（毫秒）
    cashDrawerPulseWidth: 50, // 脉冲宽度（毫秒）
  });
  
  // 更新设置的帮助函数
  const updateSetting = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  // 保存设置的提示
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const showSaveMessage = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(null), 2000);
  };
  
  // 硬件设备相关
  const {
    scanner,
    printer,
    printerStatus,
    enableScanner,
    printReceipt,
    openCashbox,
    updateDeviceStatus,
  } = useHardware();
  
  // 语音播报
  const {
    isSupported: speechSupported,
    isActivated: speechActivated,
    isSpeaking,
    config: speechConfig,
    activate: activateSpeech,
    speak,
    speakScanSuccess,
    speakAddToCart,
    speakPaymentSuccess,
    speakMemberIdentified,
    speakError,
    updateConfig: updateSpeechConfig,
  } = usePosSpeech();
  
  // 晚8点清货状态
  const [clearanceMode, setClearanceMode] = useState(false);
  const [clearanceDiscount, setClearanceDiscount] = useState(0.5); // 默认5折
  
  // 称重相关状态
  const [currentWeight, setCurrentWeight] = useState(0);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'jin'>('jin');
  const [scaleConnected, setScaleConnected] = useState(false);
  
  // 激活语音播报（需要在用户交互后调用）
  useEffect(() => {
    // 页面加载后自动激活语音
    const timer = setTimeout(() => {
      if (speechSupported && !speechActivated) {
        activateSpeech();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [speechSupported, speechActivated, activateSpeech]);
  
  // AI识别相关状态
  const [showAIRecognize, setShowAIRecognize] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [recognizedProducts, setRecognizedProducts] = useState<any[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // 支付配置状态
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>([]);
  const [loadingPaymentConfigs, setLoadingPaymentConfigs] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 检查登录状态
  useEffect(() => {
    // 等待 loading 完成
    if (loading) return;
    
    // 如果未认证，跳转到登录页
    if (!isAuthenticated) {
      console.log('[POS] 未登录，跳转到登录页');
      router.push('/pos/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  // 从上下文获取店铺配置
  const shopConfig = {
    id: shop?.id ? String(shop.id) : '',
    name: shop?.name || '海邻到家',
    code: shop?.code || '',
    logo: '',
    address: shop?.address || '',
    phone: shop?.phone || '',
  };

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 加载支付配置
  useEffect(() => {
    const loadPaymentConfigs = async () => {
      try {
        setLoadingPaymentConfigs(true);
        const response = await fetch('/api/settings/payment/?type=enabled');
        const result = await response.json();
        if (result.success && result.data) {
          setPaymentConfigs(result.data);
        }
      } catch (error) {
        console.error('加载支付配置失败:', error);
      } finally {
        setLoadingPaymentConfigs(false);
      }
    };
    loadPaymentConfigs();
  }, []);

  // 晚8点自动开启清货模式
  useEffect(() => {
    const checkClearanceTime = () => {
      const hour = currentTime.getHours();
      // 晚上20:00后自动开启清货模式
      if (hour >= 20 && hour < 24) {
        setClearanceMode(true);
      } else {
        setClearanceMode(false);
      }
    };
    
    checkClearanceTime();
  }, [currentTime]);

  // 初始化扫码枪
  useEffect(() => {
    // 启用 USB 扫码枪监听
    const cleanup = enableScanner('usb', async (barcode) => {
      console.log('[POS] Barcode scanned:', barcode);
      
      // 1. 优先搜索本地商品库
      const allProducts = Object.values(productsByCategory).flat();
      const localProduct = allProducts.find(p => p.barcode === barcode);
      
      if (localProduct) {
        // 找到本地商品，直接添加到购物车
        console.log('[POS] Found in local product library:', localProduct.name);
        addToCart(localProduct, 1);
        return;
      }
      
      // 2. 搜索总部商品库
      try {
        const hqResponse = await fetch(`/api/headquarters/products/?barcode=${barcode}`);
        if (hqResponse.ok) {
          const hqData = await hqResponse.json();
          if (hqData.success && hqData.data) {
            console.log('[POS] Found in headquarters product library:', hqData.data.name);
            // 找到总部商品，创建本地商品并加入购物车
            const newProduct: Product = {
              id: generateStableId(barcode), // 使用条码生成稳定ID
              barcode: barcode,
              name: hqData.data.name,
              price: hqData.data.suggestedPrice || 0,
              icon: '📦',
              stock: 0,
              unit: hqData.data.unit || '个',
              type: 'standard',
              hasBarcode: true,
              isWeighted: false,
              isCounted: false,
              category: hqData.data.category || 'other',
            };
            // 检查是否已存在相同商品（ID或条码重复）
            const existingIds = new Set(productsByCategory.all.map(p => p.id));
            const existingBarcodes = new Set(productsByCategory.all.filter(p => p.barcode).map(p => p.barcode));
            const isDuplicate = existingIds.has(newProduct.id) || 
                               (newProduct.barcode && existingBarcodes.has(newProduct.barcode));
            
            if (!isDuplicate) {
              // 添加到本地商品列表
              productsByCategory.all = [...productsByCategory.all, newProduct];
            }
            
            // 保存到离线存储（检查重复）
            const existingProducts = await ProductsStore.getAll();
            const productExists = existingProducts.some(p => 
              p.id === newProduct.id || (newProduct.barcode && p.barcode === newProduct.barcode)
            );
            let updatedProducts: OfflineProduct[];
            if (productExists) {
              updatedProducts = existingProducts.map(p => 
                (p.id === newProduct.id || (newProduct.barcode && p.barcode === newProduct.barcode))
                  ? { ...newProduct, updatedAt: Date.now() }
                  : p
              );
            } else {
              updatedProducts = [...existingProducts, { ...newProduct, updatedAt: Date.now() }];
            }
            await ProductsStore.saveAll(updatedProducts);
            // 加入购物车
            addToCart(newProduct, 1);
            return;
          }
        }
      } catch (err) {
        console.log('[POS] Headquarters search failed:', err);
      }
      
      // 3. 商品库未找到，打开新增商品对话框，AI搜索外部网络
      console.log('[POS] Product not found in any library, opening new product dialog with AI search');
      setNewProductForm({ 
        barcode: barcode,
        name: '',
        brand: '',
        specification: '',
        price: '',
        stock: '',
        category: 'snacks',
        unit: '个',
        imageUrl: '',
      });
      setAiRecognized(false);
      setShowProductDialog(true);
      
      // 调用AI识别API搜索外部网络
      setAiRecognizing(true);
      fetch('/api/products/scan-barcode/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode }),
      })
        .then(res => res.json())
        .then(data => {
          console.log('[POS] AI recognition result:', data);
          if (data.success && data.data) {
            const productData = data.data;
            // 只有当识别到有效商品名称时才自动创建商品
            if (productData.name && productData.name.length > 0) {
              // 分类映射：中文 -> 英文选项值
              const categoryMap: Record<string, string> = {
                '饮品': 'drinks',
                '饮料': 'drinks',
                '零食': 'snacks',
                '生鲜': 'fresh',
                '水果': 'fruits',
                '蔬菜': 'vegetables',
                '日用品': 'other',
                '方便食品': 'snacks',
                '乳制品': 'drinks',
                '其他': 'other',
              };
              const mappedCategory = categoryMap[productData.category] || productData.category || 'other';
              
              // 自动创建新商品
              const newProduct: Product = {
                id: generateStableId(barcode), // 使用条码生成稳定ID
                barcode: barcode,
                name: productData.name,
                brand: productData.brand || '',
                specification: productData.specification || '',
                price: productData.price || 0,
                icon: '📦',
                stock: 0,
                unit: productData.unit || '个',
                type: 'standard',
                hasBarcode: true,
                isWeighted: false,
                isCounted: false,
                category: mappedCategory,
                imageUrl: productData.imageUrl || '',
              };
              
              // 检查是否已存在相同商品（ID或条码重复）
              const existingIds = new Set(productsByCategory.all.map(p => p.id));
              const existingBarcodes = new Set(productsByCategory.all.filter(p => p.barcode).map(p => p.barcode));
              const isDuplicate = existingIds.has(newProduct.id) || 
                                 (newProduct.barcode && existingBarcodes.has(newProduct.barcode));
              
              if (!isDuplicate) {
                // 添加到本地商品列表
                productsByCategory.all = [...productsByCategory.all, newProduct];
              }
              
              // 保存到离线存储（检查重复）
              ProductsStore.getAll().then(existingProducts => {
                const productExists = existingProducts.some(p => 
                  p.id === newProduct.id || (newProduct.barcode && p.barcode === newProduct.barcode)
                );
                let updatedProducts: OfflineProduct[];
                if (productExists) {
                  updatedProducts = existingProducts.map(p => 
                    (p.id === newProduct.id || (newProduct.barcode && p.barcode === newProduct.barcode))
                      ? { ...newProduct, updatedAt: Date.now() }
                      : p
                  );
                } else {
                  updatedProducts = [...existingProducts, { ...newProduct, updatedAt: Date.now() }];
                }
                return ProductsStore.saveAll(updatedProducts);
              }).catch(err => {
                console.log('[POS] Failed to save product to offline store:', err);
              });
              
              // 直接加入购物车
              addToCart(newProduct, 1);
              
              console.log('[POS] Auto-created product from AI recognition:', newProduct.name);
            } else {
              // 未识别到商品，打开新增商品对话框让用户手动填写
              console.log('[POS] No product name found, opening dialog for manual entry');
              setNewProductForm({ 
                barcode: barcode,
                name: '',
                brand: '',
                specification: '',
                price: '',
                stock: '',
                category: 'snacks',
                unit: '个',
                imageUrl: '',
              });
              setAiRecognized(false);
              setShowProductDialog(true);
            }
          } else {
            // API返回失败，打开对话框让用户手动填写
            setNewProductForm({ 
              barcode: barcode,
              name: '',
              brand: '',
              specification: '',
              price: '',
              stock: '',
              category: 'snacks',
              unit: '个',
              imageUrl: '',
            });
            setAiRecognized(false);
            setShowProductDialog(true);
          }
        })
        .catch(err => {
          console.log('[POS] AI barcode recognition failed:', err);
        })
        .finally(() => {
          setAiRecognizing(false);
        });
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [enableScanner]);

  // 清理摄像头流
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 加载离线商品数据
  useEffect(() => {
    const loadOfflineProducts = async () => {
      setIsLoadingOffline(true);
      try {
        // 优先从API加载商品数据（总部后台新增的商品）
        if (isOnline) {
          try {
            const response = await fetch('/api/store-products');
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data && result.data.length > 0) {
                // 将数据库商品转换为前端格式
                // 注意：一个商品可能有多个规格，每个规格有不同的条码和价格
                const dbProducts: Product[] = [];
                const productIds: string[] = []; // 收集原始商品ID用于获取图片
                
                result.data.forEach((p: any) => {
                  productIds.push(p.id); // 收集原始商品ID
                  
                  if (p.specs && p.specs.length > 0) {
                    // 每个规格作为一个独立的商品项
                    p.specs.forEach((spec: any, index: number) => {
                      // 使用条码生成稳定的ID（确保同一商品每次加载ID相同）
                      const stableId = spec.barcode 
                        ? generateStableId(spec.barcode)
                        : generateStableId(`${p.id}-${index}`);
                      
                      dbProducts.push({
                        id: stableId,
                        barcode: spec.barcode || '',
                        name: p.name + (p.specs.length > 1 ? ` (${spec.name})` : ''),
                        price: spec.price || 0,
                        icon: '📦',
                        stock: spec.stock || 0,
                        unit: spec.unit || '个',
                        type: p.type || 'standard',
                        hasBarcode: p.hasBarcode ?? true,
                        isWeighted: p.isWeighted ?? false,
                        isCounted: p.isCounted ?? false,
                        category: p.category || 'other',
                        originalProductId: p.id, // 保留原始商品ID
                      });
                    });
                  } else {
                    // 没有规格的商品
                    dbProducts.push({
                      id: generateStableId(p.id),
                      barcode: '',
                      name: p.name,
                      price: 0,
                      icon: '📦',
                      stock: 0,
                      unit: '个',
                      type: p.type || 'standard',
                      hasBarcode: p.hasBarcode ?? true,
                      isWeighted: p.isWeighted ?? false,
                      isCounted: p.isCounted ?? false,
                      category: p.category || 'other',
                      originalProductId: p.id, // 保留原始商品ID
                    });
                  }
                });
                
                // 批量获取商品图片
                try {
                  const imagePromises = [...new Set(productIds)].map(async (productId) => {
                    try {
                      const imgResponse = await fetch(`/api/products/images?productId=${productId}`);
                      const imgResult = await imgResponse.json();
                      if (imgResult.success && imgResult.data?.mainImage?.imageUrl) {
                        return { productId, imageUrl: imgResult.data.mainImage.imageUrl };
                      }
                    } catch (e) {
                      console.log('[POS] 获取商品图片失败:', productId, e);
                    }
                    return null;
                  });
                  
                  const imageResults = await Promise.all(imagePromises);
                  const imageMap = new Map<string, string>();
                  imageResults.forEach((result) => {
                    if (result) {
                      imageMap.set(result.productId, result.imageUrl);
                    }
                  });
                  
                  // 将图片URL设置到商品中
                  dbProducts.forEach((product) => {
                    if (product.originalProductId && imageMap.has(product.originalProductId)) {
                      product.imageUrl = imageMap.get(product.originalProductId);
                    }
                  });
                  
                  console.log('[POS] 已加载', imageMap.size, '个商品图片');
                } catch (imgError) {
                  console.error('[POS] 批量获取商品图片失败:', imgError);
                }
                
                // 保存到离线存储（需要添加updatedAt字段）
                const offlineProducts: OfflineProduct[] = dbProducts.map(p => ({
                  ...p,
                  updatedAt: Date.now(),
                }));
                await ProductsStore.saveAll(offlineProducts);
                setOfflineProducts(offlineProducts);
                
                // 同时更新内存中的商品列表（使用ID和条码双重去重）
                const existingIds = new Set(productsByCategory.all.map(p => p.id));
                const existingBarcodes = new Set(productsByCategory.all.filter(p => p.barcode).map(p => p.barcode));
                dbProducts.forEach((dbP) => {
                  const isDuplicate = existingIds.has(dbP.id) || 
                                     (dbP.barcode && existingBarcodes.has(dbP.barcode));
                  if (!isDuplicate) {
                    productsByCategory.all.push(dbP);
                    existingIds.add(dbP.id);
                    if (dbP.barcode) {
                      existingBarcodes.add(dbP.barcode);
                    }
                  }
                });
                
                console.log('[POS] 已从数据库加载', dbProducts.length, '个商品');
              }
            }
          } catch (err) {
            console.error('[POS] 从API加载商品失败:', err);
          }
        }
        
        // 从离线存储加载商品
        const products = await ProductsStore.getAll();
        if (products.length > 0) {
          // 更新内存中的商品列表（使用ID和条码双重去重）
          const existingIds = new Set(productsByCategory.all.map(p => p.id));
          const existingBarcodes = new Set(productsByCategory.all.filter(p => p.barcode).map(p => p.barcode));
          
          products.forEach((p) => {
            const productId = p.id;
            const productBarcode = p.barcode;
            
            // 使用ID去重，如果有条码也检查条码
            const isDuplicate = existingIds.has(productId) || 
                               (productBarcode && existingBarcodes.has(productBarcode));
            
            if (!isDuplicate) {
              productsByCategory.all.push(p as unknown as Product);
              existingIds.add(productId);
              if (productBarcode) {
                existingBarcodes.add(productBarcode);
              }
            }
          });
          
          // 更新offlineProducts为合并后的完整商品列表
          setOfflineProducts([...productsByCategory.all] as OfflineProduct[]);
        } else {
          // 如果本地没有商品数据，保存默认商品
          const defaultProducts = Object.values(productsByCategory).flat();
          await ProductsStore.saveAll(defaultProducts as OfflineProduct[]);
          setOfflineProducts(defaultProducts as OfflineProduct[]);
        }
      } catch (error) {
        console.error('加载离线商品失败:', error);
      } finally {
        setIsLoadingOffline(false);
      }
    };

    loadOfflineProducts();
  }, [isOnline]);

  // 加载待同步订单数量
  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const count = await OrdersStore.getPendingCount();
        setPendingOrdersCount(count);
      } catch (error) {
        console.error('加载待同步订单数量失败:', error);
      }
    };

    loadPendingCount();
    // 每分钟刷新一次
    const interval = setInterval(loadPendingCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // 加载收银台订单（从 IndexedDB）
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const orders = await OrdersStore.getAll();
        // 按创建时间倒序排列
        orders.sort((a, b) => b.createdAt - a.createdAt);
        setPosOrders(orders);
      } catch (error) {
        console.error('加载订单失败:', error);
      }
    };

    loadOrders();
    // 每30秒刷新一次
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // 网络恢复时自动同步
  useEffect(() => {
    if (isOnline && pendingOrdersCount > 0 && !isSyncing) {
      syncOfflineOrders();
    }
  }, [isOnline, pendingOrdersCount]);

  // 首次离线时显示警告
  useEffect(() => {
    if (isOffline && !showOfflineWarning) {
      // 检查是否已经提示过
      const hasShownWarning = sessionStorage.getItem('offline_warning_shown');
      if (!hasShownWarning) {
        setShowOfflineWarning(true);
        sessionStorage.setItem('offline_warning_shown', 'true');
      }
    }
  }, [isOffline, showOfflineWarning]);

  // 格式化时间
  const formatTime = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return { date: `${month}月${day}日`, time: `${hours}:${minutes}` };
  };

  // 计算金额
  const getSubtotal = () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const getDiscount = () => cartItems.reduce((sum, item) => sum + ((item.originalPrice || item.price) - item.price) * item.quantity, 0);
  
  // 获取促销折扣金额
  const getPromotionDiscount = () => {
    const activePromotions = getActivePromotions();
    if (activePromotions.length === 0) return 0;
    
    let totalDiscount = 0;
    const subtotal = getSubtotal();
    
    activePromotions.forEach(promo => {
      if (promo.type === 'fullreduce' && promo.fullAmount && promo.reduceAmount) {
        // 满减活动：满X减Y
        if (subtotal >= promo.fullAmount) {
          const times = Math.floor(subtotal / promo.fullAmount);
          totalDiscount += promo.reduceAmount * times;
        }
      }
      // 折扣和特价活动在商品价格中体现
    });
    
    return totalDiscount;
  };
  
  const getFinalAmount = () => {
    const promotionDiscount = getPromotionDiscount();
    const amount = Math.max(0, getSubtotal() + priceAdjustment - promotionDiscount);
    // 抹分：去掉分位（小数点后第二位），只保留到角（小数点后第一位）
    // 例如：12.34元 -> 12.30元，12.35元 -> 12.30元
    return isFractionRemoved ? Math.floor(amount * 10) / 10 : amount;
  };
  // 获取抹分的金额（分位部分）
  const getRemovedFraction = () => {
    const promotionDiscount = getPromotionDiscount();
    const amount = Math.max(0, getSubtotal() + priceAdjustment - promotionDiscount);
    // 抹掉的是分位部分，例如 12.34元抹掉 0.04元
    return amount - Math.floor(amount * 10) / 10;
  };
  const getEarnedPoints = () => Math.floor(getFinalAmount());
  
  // 同步购物车数据到 localStorage（供客显屏使用）
  // 注意：storage 事件只会在其他同源窗口触发，不会在当前窗口触发
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_cart', JSON.stringify(cartItems));
    }
  }, [cartItems]);

  // 同步会员信息到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_member', JSON.stringify(member));
    }
  }, [member]);

  // 同步店铺配置到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_shop_config', JSON.stringify(shopConfig));
    }
  }, [shopConfig]);

  // 同步优惠信息到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const discountInfo = {
        memberDiscount: member ? getSubtotal() * 0.05 : 0, // 示例：会员95折
        pointsDiscount: 0,
        couponDiscount: 0,
        promotionDiscount: getDiscount(),
      };
      localStorage.setItem('pos_discount', JSON.stringify(discountInfo));
    }
  }, [cartItems, member, getDiscount, getSubtotal]);

  const getTotalQuantity = () => cartItems.reduce((sum, item) => sum + (item.isWeighted ? 1 : item.quantity), 0);

  // 购物车操作
  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems(items => {
      // 对于有条码的商品，用条码来识别是否是同一商品（更可靠）
      // 对于没有条码的商品，用ID来识别
      const existingItem = product.barcode 
        ? items.find(item => item.barcode === product.barcode)
        : items.find(item => item.id === product.id);
        
      if (existingItem) {
        if (product.barcode) {
          return items.map(item =>
            item.barcode === product.barcode
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          return items.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
      }
      return [...items, {
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        quantity,
        unit: product.unit,
        discount: 0,
        isWeighted: product.isWeighted,
        isCounted: product.isCounted,
        hasBarcode: product.hasBarcode,
        imageUrl: product.imageUrl,
        icon: product.icon,
      }];
    });
    
    // 语音播报：商品加入购物车
    if (settings.cartAddVoiceEnabled) {
      speakAddToCart(product.name, quantity, product.price * quantity);
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(items =>
      items.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
    setPriceAdjustment(0);
    setIsManualPrice(false);
    setIsFractionRemoved(false);
  };

  // 挂单功能
  const suspendOrder = () => {
    if (cartItems.length === 0) {
      alert('购物车为空，无法挂单');
      return;
    }

    const newSuspendedOrder: SuspendedOrder = {
      id: `suspend_${Date.now()}`,
      createdAt: new Date(),
      items: [...cartItems],
      member: member,
      priceAdjustment: priceAdjustment,
      isFractionRemoved: isFractionRemoved,
      itemCount: getTotalQuantity(),
      totalAmount: getFinalAmount(),
    };

    setSuspendedOrders(prev => [...prev, newSuspendedOrder]);
    
    // 清空当前购物车，准备接待下一位顾客
    setCartItems([]);
    setMember(null);
    setPriceAdjustment(0);
    setIsManualPrice(false);
    setIsFractionRemoved(false);
    
    alert(`挂单成功！已保存 ${newSuspendedOrder.itemCount} 件商品，金额 ¥${newSuspendedOrder.totalAmount.toFixed(2)}`);
  };

  // 取单功能
  const resumeOrder = (order: SuspendedOrder) => {
    // 检查当前购物车是否为空
    if (cartItems.length > 0) {
      if (!confirm('当前购物车有商品，取单将清空当前购物车，是否继续？')) {
        return;
      }
    }

    // 恢复挂单数据
    setCartItems(order.items);
    setMember(order.member);
    setPriceAdjustment(order.priceAdjustment);
    setIsFractionRemoved(order.isFractionRemoved);
    
    // 从挂单列表中移除
    setSuspendedOrders(prev => prev.filter(o => o.id !== order.id));
    setShowSuspendedOrders(false);
    
    alert(`取单成功！已恢复 ${order.itemCount} 件商品`);
  };

  // 删除挂单
  const deleteSuspendedOrder = (orderId: string) => {
    if (confirm('确定要删除这个挂单吗？')) {
      setSuspendedOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  // 格式化挂单时间
  const formatSuspendTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 同步离线订单
  const syncOfflineOrders = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const pendingOrders = await OrdersStore.getPendingOrders();
      
      for (const order of pendingOrders) {
        try {
          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...order,
              shopName: shopConfig.name, // 添加店铺名称
            }),
          });

          if (response.ok) {
            // 同步成功，删除本地订单
            await OrdersStore.delete(order.id);
          } else {
            // 同步失败，更新状态
            await OrdersStore.updateStatus(order.id, 'failed');
          }
        } catch (error) {
          console.error('同步订单失败:', order.id, error);
          await OrdersStore.updateStatus(order.id, 'failed');
        }
      }

      // 更新待同步数量
      const newCount = await OrdersStore.getPendingCount();
      setPendingOrdersCount(newCount);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, shopConfig.name]);

  // 创建离线订单
  const createOfflineOrder = async (paymentMethod: string) => {
    const order: OfflineOrder = {
      id: `order_${Date.now()}`,
      orderNo: `PO${Date.now().toString().slice(-10)}`,
      createdAt: Date.now(),
      items: cartItems,
      member: member,
      subtotal: getSubtotal(),
      discount: getDiscount(),
      totalAmount: getFinalAmount(),
      paymentMethod,
      status: 'pending',
      shopId: String(shop?.id || ''),
      shopName: shopConfig.name || '', // 添加店铺名称
      staffId: String(user?.id || ''),
      staffName: user?.name || '',
      syncAttempts: 0,
    };

    // 保存到本地
    await OrdersStore.save(order);
    
    // 如果在线，立即尝试同步
    if (isOnline) {
      syncOfflineOrders();
    } else {
      setPendingOrdersCount(prev => prev + 1);
    }

    return order;
  };

  // AI识别功能
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 640, height: 480 } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsStreaming(true);
        };
      }
    } catch (error) {
      console.error('无法访问摄像头:', error);
      alert('无法访问摄像头，请确保已授权摄像头权限');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.videoWidth === 0) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      return imageData;
    }
    return null;
  };

  const recognizeImage = async () => {
    const imageData = captureImage();
    if (!imageData) return;

    setAiLoading(true);
    try {
      const response = await fetch('/api/products/recognize-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        setRecognizedProducts(data.data);
      }
    } catch (error) {
      console.error('识别失败:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const addRecognizedProductToCart = (product: any) => {
    // 根据识别结果查找匹配的商品
    const matchedProduct = Object.values(productsByCategory).flat().find(p => 
      p.name.includes(product.name) || product.name.includes(p.name)
    );
    
    if (matchedProduct) {
      addToCart(matchedProduct);
    } else {
      // 如果没有匹配的商品，创建一个临时商品
      const tempProduct: Product = {
        id: generateStableId(product.name + Date.now()), // 使用名字+时间戳生成唯一ID
        name: product.name,
        price: product.price || 0,
        icon: '📦',
        stock: 999,
        unit: product.unit || '个',
        type: 'standard',
        hasBarcode: false,
        isWeighted: false,
        isCounted: false,
        category: 'other',
      };
      addToCart(tempProduct);
    }
  };

  // 关闭AI识别对话框时清理
  const closeAIRecognize = () => {
    stopCamera();
    setShowAIRecognize(false);
    setCapturedImage(null);
    setRecognizedProducts([]);
  };


  // 商品点击处理
  const handleProductClick = (product: Product) => {
    if (product.isWeighted) {
      setWeightInfo({ product, weight: 0 });
      setShowKeyboard(true);
    } else {
      addToCart(product, 1);
    }
  };

  // 键盘输入
  const handleKeyboardInput = (value: string) => {
    if (value === 'DEL') {
      setKeyboardInput(prev => prev.slice(0, -1));
    } else if (value === 'OK') {
      if (weightInfo) {
        const weight = parseFloat(keyboardInput) || 0;
        if (weight > 0) {
          addToCart(weightInfo.product, weight);
          setWeightInfo(null);
          setShowKeyboard(false);
          setKeyboardInput('');
        }
      }
    } else {
      setKeyboardInput(prev => prev + value);
    }
  };

  // 获取商品列表（支持离线）
  const getCurrentProducts = () => {
    // 使用 productsByCategory.all 作为唯一数据源
    // 它已经包含了：默认商品 + API加载的商品 + IndexedDB加载的商品
    let products = productsByCategory.all || [];
    
    // 仅看非标品筛选
    if (showOnlyNonStandard) {
      products = products.filter(p => p.type === 'weighted' || p.type === 'counted');
    }
    
    if (activeCategory === 'hot') {
      products = products.filter(p => p.isHot);
    } else if (activeCategory === 'standard') {
      products = products.filter(p => p.type === 'standard');
    } else if (activeCategory === 'weighted') {
      products = products.filter(p => p.type === 'weighted');
    } else if (activeCategory === 'counted') {
      products = products.filter(p => p.type === 'counted');
    } else if (activeCategory !== 'all') {
      products = products.filter(p => p.category === activeCategory);
    }
    
    if (searchTerm) {
      products = products.filter(p => 
        p.name.includes(searchTerm) || (p.barcode && p.barcode.includes(searchTerm))
      );
    }
    return products;
  };

  // 会员搜索 - 输入后4位自动搜索
  const handleMemberSearch = (value: string) => {
    setMemberSearchTerm(value);
    
    if (value.length >= 4) {
      // 搜索手机号后4位匹配的会员
      const results = memberList.filter(m => 
        m.phone.endsWith(value) || m.phone.includes(value)
      );
      setMemberSearchResults(results);
      setShowMemberSearchResults(true);
    } else {
      setShowMemberSearchResults(false);
      setMemberSearchResults([]);
    }
  };
  
  // 选择会员
  const selectMember = (selectedMember: typeof memberList[0]) => {
    const levelMap: Record<string, MemberLevelId> = {
      '钻石': 'diamond',
      '金卡': 'gold',
      '银卡': 'silver',
      '普通': 'normal',
    };
    
    setMember({
      id: selectedMember.id,
      name: selectedMember.name,
      memberNo: selectedMember.id,
      phone: selectedMember.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      levelId: levelMap[selectedMember.level] || 'normal' as MemberLevelId,
      level: selectedMember.level + '会员',
      levelColor: selectedMember.level === '钻石' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                  selectedMember.level === '金卡' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                  selectedMember.level === '银卡' ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                  'bg-gray-400',
      points: selectedMember.points,
      totalSpent: 0,
      orderCount: 0,
    });
    setMemberSearchTerm('');
    setShowMemberSearchResults(false);
    
    // 语音播报：会员识别成功
    if (settings.paymentVoiceEnabled) {
      speakMemberIdentified(selectedMember.name, selectedMember.level);
    }
  };

  // 会员识别 - 打开会员登录弹窗
  const identifyMember = () => {
    setShowMemberLoginDialog(true);
    setMemberLoginSearch('');
  };
  
  // 会员登录搜索
  const handleMemberLoginSearch = (value: string) => {
    setMemberLoginSearch(value);
    
    if (value.length >= 4) {
      const results = memberList.filter(m => 
        m.phone.endsWith(value) || m.phone.includes(value) || m.id.toLowerCase().includes(value.toLowerCase())
      );
      setMemberSearchResults(results);
    } else {
      setMemberSearchResults([]);
    }
  };
  
  // 选择会员登录
  const selectMemberToLogin = (selectedMember: typeof memberList[0]) => {
    const levelMap: Record<string, MemberLevelId> = {
      '钻石': 'diamond',
      '金卡': 'gold',
      '银卡': 'silver',
      '普通': 'normal',
    };
    
    setMember({
      id: selectedMember.id,
      name: selectedMember.name,
      memberNo: selectedMember.id,
      phone: selectedMember.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      levelId: levelMap[selectedMember.level] || 'normal' as MemberLevelId,
      level: selectedMember.level + '会员',
      levelColor: selectedMember.level === '钻石' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                  selectedMember.level === '金卡' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                  selectedMember.level === '银卡' ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                  'bg-gray-400',
      points: selectedMember.points,
      totalSpent: 0,
      orderCount: 0,
    });
    setShowMemberLoginDialog(false);
    setMemberLoginSearch('');
    setMemberSearchResults([]);
    
    // 语音播报：会员识别成功
    if (settings.paymentVoiceEnabled) {
      speakMemberIdentified(selectedMember.name, selectedMember.level);
    }
  };

  // 计算会员折扣
  const getMemberDiscount = () => {
    if (!member?.levelId) return 0;
    const amount = getSubtotal();
    const { discount } = calculateMemberDiscount(amount, member.levelId);
    return discount;
  };

  // 计算最终金额（含会员折扣）
  const getFinalAmountWithMemberDiscount = () => {
    const baseAmount = getSubtotal() + priceAdjustment - getMemberDiscount();
    // 抹分：去掉分位（小数点后第二位），只保留到角（小数点后第一位）
    return isFractionRemoved ? Math.floor(Math.max(0, baseAmount) * 10) / 10 : Math.max(0, baseAmount);
  };

  // 结算
  const handleCheckout = () => {
    if (cartItems.length > 0) {
      setShowPayment(true);
    }
  };

  // 确认支付
  const confirmPayment = async () => {
    try {
      // 计算本次订单获得的积分
      const earnedPoints = member?.levelId 
        ? calculateOrderPoints(getFinalAmount(), member.levelId, false)
        : Math.floor(getFinalAmount());

      // 创建订单（离线时保存到本地，在线时同步到服务器）
      const order = await createOfflineOrder(selectedPayment || 'cash');
      
      // 打印小票（使用打印服务）
      try {
        const memberDiscount = getMemberDiscount();
        const receiptData = {
          shopName: shopConfig.name,
          shopAddress: shopConfig.address,
          shopPhone: shopConfig.phone,
          orderNumber: order.orderNo,
          timestamp: new Date(order.createdAt).toLocaleString('zh-CN'),
          cashier: user?.name,
          items: cartItems.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            unit: item.unit,
            subtotal: item.price * item.quantity,
          })),
          subtotal: getSubtotal(),
          discount: getDiscount(),
          memberDiscount: memberDiscount > 0 ? memberDiscount : undefined,
          totalAmount: getFinalAmount(),
          paymentMethod: selectedPayment === 'cash' ? '现金' : 
                        selectedPayment === 'wechat' ? '微信支付' :
                        selectedPayment === 'alipay' ? '支付宝' :
                        selectedPayment === 'card' ? '银行卡' : '混合支付',
          changeAmount: (typeof cashReceived === 'number' ? cashReceived : parseFloat(cashReceived) || 0) > getFinalAmount() ? 
            (typeof cashReceived === 'number' ? cashReceived : parseFloat(cashReceived) || 0) - getFinalAmount() : undefined,
          memberInfo: member ? {
            name: member.name,
            memberNo: member.memberNo,
            points: member.points + earnedPoints,
            earnedPoints: earnedPoints,
          } : undefined,
          footer: clearanceMode ? '【晚8点清货特价】' : undefined,
          isClearanceMode: clearanceMode,
        };
        
        // 使用打印服务
        const { printService } = await import('@/lib/print-service');
        const printResult = await printService.print(receiptData);
        
        if (printResult.success) {
          // 打印成功，静默完成
          console.log('[POS] 打印成功:', printResult.message);
        } else {
          console.warn('[POS] 打印失败:', printResult.message);
        }
        
        // 打开钱箱（现金支付时）
        if (selectedPayment === 'cash') {
          await printService.openCashbox();
        }
      } catch (printError) {
        console.error('打印小票失败:', printError);
        // 打印失败不影响支付成功
      }
      
      // 显示成功提示
      let successMsg = isOnline 
        ? '支付成功！' 
        : `支付成功！订单已保存到本地，将在网络恢复后自动同步。\n订单号：${order.orderNo}`;
      
      if (member) {
        successMsg += `\n\n本次获得 ${earnedPoints} 积分`;
        successMsg += `\n累计积分：${member.points + earnedPoints}`;
      }
      
      alert(successMsg);
      
      // 刷新订单列表
      try {
        const orders = await OrdersStore.getAll();
        orders.sort((a, b) => b.createdAt - a.createdAt);
        setPosOrders(orders);
      } catch (e) {
        console.error('刷新订单列表失败:', e);
      }
      
      // 触发客显屏语音播报
      try {
        const paymentMethod = selectedPayment === 'cash' ? '现金' : 
                              selectedPayment === 'wechat' ? '微信' :
                              selectedPayment === 'alipay' ? '支付宝' :
                              selectedPayment === 'card' ? '银行卡' : '';
        localStorage.setItem('pos_payment_event', JSON.stringify({
          amount: getFinalAmount(),
          method: paymentMethod,
          timestamp: Date.now(),
        }));
        
        // 收银台语音播报支付成功
        if (settings.paymentVoiceEnabled) {
          speakPaymentSuccess(getFinalAmount(), selectedPayment || 'cash', cartItems.length);
        }
      } catch (e) {
        console.error('触发语音播报失败:', e);
      }
      
      setShowPayment(false);
      clearCart();
      setSelectedPayment(null);
    } catch (error) {
      console.error('创建订单失败:', error);
      alert('订单创建失败，请重试');
    }
  };

  // 渲染侧边面板内容
  const renderSidePanelContent = () => {
    switch (currentView) {
      case 'inventory':
        return (
          <div className="space-y-3">
            {/* 库存概况概览 */}
            <div className="bg-white rounded-lg border p-3">
              <h3 className="font-medium mb-2 flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-orange-500" />
                当前库存概况
              </h3>
              <div className="text-xs text-gray-500">
                点击下方卡片查看详情
              </div>
            </div>

            {/* 低库存商品 - 可点击展开 */}
            <div className="bg-white rounded-lg border overflow-hidden">
              <div 
                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                onClick={() => setExpandedInventory(expandedInventory === 'lowStock' ? null : 'lowStock')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">低库存预警</p>
                    <p className="text-xs text-gray-400">需要补货的商品</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-red-500">3</span>
                  {expandedInventory === 'lowStock' ? 
                    <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  }
                </div>
              </div>
              {expandedInventory === 'lowStock' && (
                <div className="border-t px-3 py-2 bg-red-50/30">
                  {[
                    { name: '农夫山泉 550ml', stock: 8, minStock: 20, sales: 45 },
                    { name: '康师傅红烧牛肉面', stock: 5, minStock: 15, sales: 32 },
                    { name: '维他柠檬茶', stock: 12, minStock: 25, sales: 28 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 border-red-100">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-gray-400">近7天销售: {item.sales}件</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-red-500 font-medium">{item.stock}/{item.minStock}</p>
                        <p className="text-xs text-gray-400">当前/最低</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 临期商品 - 可点击展开 */}
            <div className="bg-white rounded-lg border overflow-hidden">
              <div 
                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                onClick={() => setExpandedInventory(expandedInventory === 'expiring' ? null : 'expiring')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">临期商品</p>
                    <p className="text-xs text-gray-400">即将到期的商品</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-amber-500">5</span>
                  {expandedInventory === 'expiring' ? 
                    <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  }
                </div>
              </div>
              {expandedInventory === 'expiring' && (
                <div className="border-t px-3 py-2 bg-amber-50/30">
                  {[
                    { name: '鲜牛奶 250ml', expireDays: 1, stock: 15, discount: '7折' },
                    { name: '酸奶 原味', expireDays: 2, stock: 8, discount: '8折' },
                    { name: '面包 全麦', expireDays: 3, stock: 5, discount: '5折' },
                    { name: '酸奶 草莓味', expireDays: 3, stock: 12, discount: '6折' },
                    { name: '蛋糕 奶油', expireDays: 1, stock: 3, discount: '5折' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 border-amber-100">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-gray-400">剩余{item.expireDays}天到期</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-amber-600 font-medium">{item.discount}</p>
                        <p className="text-xs text-gray-400">库存: {item.stock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 今日销售 - 可点击展开 */}
            <div className="bg-white rounded-lg border overflow-hidden">
              <div 
                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                onClick={() => setExpandedInventory(expandedInventory === 'todaySales' ? null : 'todaySales')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">今日销售</p>
                    <p className="text-xs text-gray-400">点击查看TOP商品</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-green-500">¥2,850</span>
                  {expandedInventory === 'todaySales' ? 
                    <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  }
                </div>
              </div>
              {expandedInventory === 'todaySales' && (
                <div className="border-t px-3 py-2 bg-green-50/30">
                  {[
                    { name: '可乐 330ml', quantity: 156, amount: 546.00 },
                    { name: '矿泉水 500ml', quantity: 128, amount: 256.00 },
                    { name: '薯片 原味', quantity: 89, amount: 712.00 },
                    { name: '方便面 桶装', quantity: 67, amount: 201.00 },
                    { name: '苹果 红富士', quantity: 45, amount: 360.00 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 border-green-100">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs flex items-center justify-center font-medium">{i + 1}</span>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-600 font-medium">¥{item.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">销量: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={() => setShowProcurementDialog(true)}
            >
              <Package className="h-4 w-4 mr-2" />
              发起要货申请
            </Button>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-4">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="搜索商品..." 
                className="pl-9"
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
              />
            </div>
            
            {/* 商品统计 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-blue-600">{Object.values(productsByCategory).flat().length}</p>
                <p className="text-xs text-gray-500">总商品</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-green-600">156</p>
                <p className="text-xs text-gray-500">在售</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-red-600">3</p>
                <p className="text-xs text-gray-500">缺货</p>
              </div>
            </div>
            
            {/* 商品分类 */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-3">商品分类</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', name: '全部' },
                  { id: 'drinks', name: '饮料' },
                  { id: 'snacks', name: '零食' },
                  { id: 'fresh', name: '生鲜' },
                  { id: 'fruits', name: '水果' },
                  { id: 'vegetables', name: '蔬菜' },
                ].map((cat) => (
                  <Button 
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'} 
                    className={`text-xs ${selectedCategory === cat.id ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* 商品列表 */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-3">
                {selectedCategory === 'all' ? '全部商品' : 
                 selectedCategory === 'drinks' ? '饮料' :
                 selectedCategory === 'snacks' ? '零食' :
                 selectedCategory === 'fresh' ? '生鲜' :
                 selectedCategory === 'fruits' ? '水果' : '蔬菜'}
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {productsByCategory.all
                  .filter(p => selectedCategory === 'all' || p.category === selectedCategory)
                  .filter(p => productSearchTerm === '' || p.name.includes(productSearchTerm))
                  .slice(0, 10)
                  .map((product) => (
                  <div key={product.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{product.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-gray-400">库存: {product.stock}{product.unit}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">¥{product.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">/{product.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 商品操作 */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-3">商品操作</h3>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowProductDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" /> 新增商品
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowPriceDialog(true)}
                >
                  <Edit className="h-4 w-4 mr-2" /> 修改价格
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowLabelDialog(true)}
                >
                  <Barcode className="h-4 w-4 mr-2" /> 打印价签
                </Button>
                <Separator className="my-2" />
                <a href="/pos/products" target="_blank" rel="noopener noreferrer">
                  <Button 
                    variant="default" 
                    className="w-full justify-start bg-orange-500 hover:bg-orange-600"
                  >
                    <Settings className="h-4 w-4 mr-2" /> 高级管理（支持条码扫描）
                  </Button>
                </a>
              </div>
            </div>
          </div>
        );

      case 'procurement':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-3">采购状态</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">待审批</p>
                    <p className="text-sm text-muted-foreground">要货申请</p>
                  </div>
                  <Badge className="bg-blue-500">2</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <p className="font-medium">配送中</p>
                    <p className="text-sm text-muted-foreground">预计今日到达</p>
                  </div>
                  <Badge className="bg-amber-500">1</Badge>
                </div>
              </div>
            </div>
            
            {/* 快捷操作 */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-3">快捷操作</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => setShowProcurementDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  发起要货
                </Button>
                <Button variant="outline">
                  <Clipboard className="h-4 w-4 mr-2" />
                  申请记录
                </Button>
              </div>
            </div>
            
            {/* 最近申请 */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-3">最近申请</h3>
              <div className="space-y-2">
                {[
                  { id: 'CG20260331001', items: '矿泉水×50, 方便面×30', status: '待审批', time: '2小时前' },
                  { id: 'CG20260330002', items: '鸡蛋×100, 大米×20', status: '已发货', time: '昨天' },
                  { id: 'CG20260329003', items: '食用油×10, 面粉×15', status: '已完成', time: '3天前' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.id}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.items}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={item.status === '待审批' ? 'destructive' : item.status === '已发货' ? 'default' : 'secondary'} className="text-xs">
                        {item.status}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'orders':
        // 将 IndexedDB 中的订单转换为显示格式
        const ordersData = posOrders.map(order => ({
          id: order.id,
          orderNo: order.orderNo,
          time: new Date(order.createdAt).toLocaleString('zh-CN', { 
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          }).replace(/\//g, '-'),
          cashier: order.staffName || '收银员',
          paymentMethod: order.paymentMethod === 'cash' ? '现金' : 
                          order.paymentMethod === 'wechat' ? '微信支付' :
                          order.paymentMethod === 'alipay' ? '支付宝' :
                          order.paymentMethod === 'card' ? '银行卡' : order.paymentMethod,
          items: order.items.map(item => ({
            id: item.id,
            name: item.name,
            image: item.icon || '📦',
            price: item.price,
            quantity: item.quantity,
            amount: item.price * item.quantity,
            profit: item.price * item.quantity * 0.3, // 模拟利润率
            profitRate: 30,
          })),
          totalAmount: order.totalAmount,
          paidAmount: order.totalAmount - order.discount,
          discount: order.discount || 0,
          profit: order.totalAmount * 0.3, // 模拟利润
          type: 'pos' as const, // 收银台订单都是 pos 类型
          status: order.status, // 订单同步状态
          member: order.member, // 会员信息
        }));

        // 计算今日统计数据
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayOrders = ordersData.filter(o => {
          const orderDate = new Date(posOrders.find(p => p.id === o.id)?.createdAt || 0);
          return orderDate >= todayStart;
        });
        
        const todayStats = {
          totalOrders: todayOrders.length,
          totalAmount: todayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
          totalPaid: todayOrders.reduce((sum, o) => sum + o.paidAmount, 0),
          totalDiscount: todayOrders.reduce((sum, o) => sum + o.discount, 0),
          totalProfit: todayOrders.reduce((sum, o) => sum + o.profit, 0),
          cashOrders: todayOrders.filter(o => o.paymentMethod === '现金').length,
          cashAmount: todayOrders.filter(o => o.paymentMethod === '现金').reduce((sum, o) => sum + o.paidAmount, 0),
          wechatOrders: todayOrders.filter(o => o.paymentMethod === '微信支付').length,
          wechatAmount: todayOrders.filter(o => o.paymentMethod === '微信支付').reduce((sum, o) => sum + o.paidAmount, 0),
          alipayOrders: todayOrders.filter(o => o.paymentMethod === '支付宝').length,
          alipayAmount: todayOrders.filter(o => o.paymentMethod === '支付宝').reduce((sum, o) => sum + o.paidAmount, 0),
          otherOrders: todayOrders.filter(o => !['现金', '微信支付', '支付宝'].includes(o.paymentMethod)).length,
          otherAmount: todayOrders.filter(o => !['现金', '微信支付', '支付宝'].includes(o.paymentMethod)).reduce((sum, o) => sum + o.paidAmount, 0),
        };

        const filteredOrders = ordersData.filter(order => {
          // 按类型筛选
          if (orderFilterType === 'pos') return order.type === 'pos';
          if (orderFilterType === 'app' || orderFilterType === 'self') return false; // 暂不支持
          // 按搜索词筛选
          if (orderSearchTerm) {
            const searchLower = orderSearchTerm.toLowerCase();
            return order.orderNo.toLowerCase().includes(searchLower) ||
                   order.items.some(item => item.name.toLowerCase().includes(searchLower));
          }
          return true;
        });

        const selectedOrder = selectedOrderId ? ordersData.find(o => o.id === selectedOrderId) : filteredOrders[0];

        return (
          <div className="flex flex-col h-full">
            {/* 今日销售统计 */}
            <div className="mb-3">
              {/* 统计概览 */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <Receipt className="h-4 w-4 opacity-80" />
                    <span className="text-xs opacity-80">今日</span>
                  </div>
                  <p className="text-xl font-bold">{todayStats.totalOrders}</p>
                  <p className="text-xs opacity-80">总订单数</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <TrendingUp className="h-4 w-4 opacity-80" />
                    <span className="text-xs opacity-80">今日</span>
                  </div>
                  <p className="text-xl font-bold">¥{todayStats.totalPaid.toFixed(0)}</p>
                  <p className="text-xs opacity-80">实收金额</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-3 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <Percent className="h-4 w-4 opacity-80" />
                    <span className="text-xs opacity-80">今日</span>
                  </div>
                  <p className="text-xl font-bold">¥{todayStats.totalDiscount.toFixed(2)}</p>
                  <p className="text-xs opacity-80">优惠合计</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <HandCoins className="h-4 w-4 opacity-80" />
                    <span className="text-xs opacity-80">今日</span>
                  </div>
                  <p className="text-xl font-bold">¥{todayStats.totalProfit.toFixed(2)}</p>
                  <p className="text-xs opacity-80">利润合计</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg p-3 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <ShoppingBag className="h-4 w-4 opacity-80" />
                    <span className="text-xs opacity-80">今日</span>
                  </div>
                  <p className="text-xl font-bold">{ordersData.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)}</p>
                  <p className="text-xs opacity-80">销售商品数</p>
                </div>
              </div>

              {/* 支付方式统计 */}
              <div className="bg-white rounded-lg border p-3">
                <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-500" />
                  支付方式统计
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Banknote className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-green-600">¥{todayStats.cashAmount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">现金 ({todayStats.cashOrders}笔)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <QrCode className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-emerald-600">¥{todayStats.wechatAmount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">微信 ({todayStats.wechatOrders}笔)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-blue-600">¥{todayStats.alipayAmount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">支付宝 ({todayStats.alipayOrders}笔)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-600">¥{todayStats.otherAmount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">其他 ({todayStats.otherOrders}笔)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 订单列表与详情 */}
            <div className="flex gap-4 flex-1 min-h-0">
              {/* 左侧订单列表 */}
              <div className="w-[400px] shrink-0 flex flex-col bg-white rounded-lg border overflow-hidden">
                {/* 筛选标签 */}
                <div className="flex items-center gap-1 p-2 border-b bg-gray-50 overflow-x-auto">
                  {[
                    { key: 'all', label: '全部' },
                    { key: 'pos', label: '收银台收银' },
                    { key: 'app', label: 'APP收银' },
                    { key: 'self', label: '自助收银' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setOrderFilterType(tab.key as any)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                        orderFilterType === tab.key
                          ? "bg-red-500 text-white"
                          : "bg-white border text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                
                {/* 搜索栏 */}
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      placeholder="搜索订单号/商品名称"
                      className="pl-8 h-8 text-xs"
                      value={orderSearchTerm}
                      onChange={(e) => setOrderSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* 订单列表 */}
                <div className="flex-1 overflow-y-auto">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={cn(
                        "p-3 border-b cursor-pointer transition-colors",
                        selectedOrderId === order.id ? "bg-red-50 border-l-2 border-l-red-500" : "hover:bg-gray-50"
                      )}
                    >
                      {/* 订单时间和金额 */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">{order.time}</span>
                        <span className="text-sm font-bold text-orange-500">¥{order.paidAmount.toFixed(2)}</span>
                      </div>
                      
                      {/* 商品信息 */}
                      <div className="flex items-center gap-2">
                        {/* 商品缩略图 */}
                        <div className="flex -space-x-1">
                          {order.items.slice(0, 3).map((item, i) => (
                            <div key={i} className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-sm border-2 border-white">
                              {item.image}
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-500 border-2 border-white">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>
                        
                        {/* 商品名称 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 truncate">{order.items[0]?.name}</p>
                          <p className="text-xs text-gray-400">共{order.items.reduce((sum, item) => sum + item.quantity, 0)}件商品</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 右侧订单详情 */}
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                {selectedOrder ? (
                  <>
                    {/* 订单统计区 - 紧凑布局 */}
                    <div className="bg-white rounded-lg border overflow-hidden shrink-0">
                      <div 
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandedOrderStats(!expandedOrderStats)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <p className="text-base font-medium">订单统计</p>
                            <p className="text-xs text-gray-400">{selectedOrder.id} · {selectedOrder.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-orange-500">¥{selectedOrder.paidAmount.toFixed(2)}</span>
                          {expandedOrderStats ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                        </div>
                      </div>
                      
                      {expandedOrderStats && (
                        <div className="border-t px-4 py-3 bg-gray-50">
                          {/* 基础信息 - 横向排列 */}
                          <div className="flex items-center gap-6 mb-3 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-500">收银员:</span>
                              <span className="font-medium">{selectedOrder.cashier}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-500">支付:</span>
                              <span className="font-medium">{selectedOrder.paymentMethod}</span>
                            </div>
                          </div>
                          
                          {/* 金额统计 - 紧凑横向 */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-white rounded px-3 py-2 text-center border">
                              <p className="text-base font-bold text-gray-700">¥{selectedOrder.totalAmount.toFixed(2)}</p>
                              <p className="text-xs text-gray-400">应收</p>
                            </div>
                            <div className="flex-1 bg-white rounded px-3 py-2 text-center border">
                              <p className="text-base font-bold text-green-600">¥{selectedOrder.paidAmount.toFixed(2)}</p>
                              <p className="text-xs text-gray-400">实收</p>
                            </div>
                            <div className="flex-1 bg-white rounded px-3 py-2 text-center border">
                              <p className="text-base font-bold text-red-500">¥{selectedOrder.discount.toFixed(2)}</p>
                              <p className="text-xs text-gray-400">优惠</p>
                            </div>
                            <div className="flex-1 bg-white rounded px-3 py-2 text-center border">
                              <p className="text-base font-bold text-orange-500">¥{selectedOrder.profit.toFixed(2)}</p>
                              <p className="text-xs text-gray-400">利润</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 商品明细列表 - 扩展高度 */}
                    <div className="flex-1 bg-white rounded-lg border overflow-hidden flex flex-col min-h-0">
                      <div className="px-4 py-3 border-b bg-gray-50 shrink-0">
                        <h3 className="font-medium text-base flex items-center gap-2">
                          <ShoppingBag className="h-5 w-5 text-orange-500" />
                          商品明细
                          <span className="text-sm text-gray-400 font-normal">({selectedOrder.items.length}件)</span>
                        </h3>
                      </div>
                      
                      {/* 表头 */}
                      <div className="grid grid-cols-12 gap-3 px-4 py-2 border-b bg-gray-50 text-sm text-gray-500 shrink-0">
                        <div className="col-span-5">商品</div>
                        <div className="col-span-2 text-center">单价×数量</div>
                        <div className="col-span-2 text-right">金额</div>
                        <div className="col-span-3 text-right">利润</div>
                      </div>
                      
                      {/* 商品列表 */}
                      <div className="flex-1 overflow-y-auto">
                        {selectedOrder.items.map((item, index) => (
                          <div key={index} className="grid grid-cols-12 gap-3 px-4 py-3 border-b hover:bg-gray-50 items-center">
                            {/* 商品信息 */}
                            <div className="col-span-5 flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-lg shrink-0">
                                {item.image}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{item.name}</p>
                              </div>
                            </div>
                            
                            {/* 单价×数量 */}
                            <div className="col-span-2 text-center">
                              <p className="text-sm text-gray-600">¥{item.price.toFixed(2)}×{item.quantity}</p>
                            </div>
                            
                            {/* 金额 */}
                            <div className="col-span-2 text-right">
                              <p className="text-sm font-medium text-gray-700">¥{item.amount.toFixed(2)}</p>
                            </div>
                            
                            {/* 利润 */}
                            <div className="col-span-3 text-right">
                              <p className="text-sm font-medium text-red-500">¥{item.profit.toFixed(2)}</p>
                              <p className="text-xs text-gray-400">{item.profitRate}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 底部操作按钮 */}
                    <div className="flex gap-3 shrink-0">
                      <Button 
                        variant="outline" 
                        className="flex-1 h-10"
                        onClick={() => {
                          if (selectedOrder) {
                            // 存储订单数据
                            setRefundOrderData({
                              id: selectedOrder.id,
                              time: selectedOrder.time,
                              cashier: selectedOrder.cashier,
                              paymentMethod: selectedOrder.paymentMethod,
                              totalAmount: selectedOrder.totalAmount,
                              paidAmount: selectedOrder.paidAmount,
                              discount: selectedOrder.discount,
                            });
                            // 初始化退货商品列表
                            setRefundItems(selectedOrder.items.map(item => ({
                              id: item.id,
                              name: item.name,
                              image: item.image,
                              price: item.price,
                              quantity: item.quantity,
                              maxQuantity: item.quantity,
                              amount: item.amount,
                              selected: true,
                            })));
                            setRefundType('refund-return');
                            setRefundMethod(selectedOrder.paymentMethod === '现金' ? 'cash' : 'original');
                            setRefundReason('顾客不想要了');
                            setRefundRemark('');
                            setShowRefundDialog(true);
                          }
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        退货
                      </Button>
                      <Button 
                        className="flex-1 h-10 bg-red-500 hover:bg-red-600"
                        onClick={async () => {
                          if (selectedOrder) {
                            try {
                              const receiptData = {
                                shopName: shopConfig.name,
                                shopAddress: shopConfig.address,
                                shopPhone: shopConfig.phone,
                                orderNumber: selectedOrder.id,
                                timestamp: selectedOrder.time,
                                cashier: selectedOrder.cashier,
                                items: selectedOrder.items.map(item => ({
                                  name: item.name,
                                  price: item.price,
                                  quantity: item.quantity,
                                  unit: '件',
                                  subtotal: item.amount,
                                })),
                                subtotal: selectedOrder.totalAmount,
                                discount: selectedOrder.discount,
                                totalAmount: selectedOrder.paidAmount,
                                paymentMethod: selectedOrder.paymentMethod,
                                footer: '感谢您的光临！',
                              };
                              await printReceipt(receiptData);
                              alert('小票打印成功！');
                            } catch (error) {
                              console.error('打印小票失败:', error);
                              alert('打印小票失败，请检查打印机连接');
                            }
                          }
                        }}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        打印小票
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-white rounded-lg border">
                    <div className="text-center text-gray-400">
                      <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>请选择一个订单查看详情</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'delivery':
        return (
          <div className="space-y-4">
            {/* 订单类型切换 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  deliveryOrderType === 'miniprogram' 
                    ? 'bg-white shadow text-gray-900' 
                    : 'text-gray-600'
                }`}
                onClick={() => setDeliveryOrderType('miniprogram')}
              >
                <Smartphone className="h-4 w-4 inline mr-1" />
                小程序订单
              </button>
              <button
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  deliveryOrderType === 'groupbuy' 
                    ? 'bg-white shadow text-gray-900' 
                    : 'text-gray-600'
                }`}
                onClick={() => setDeliveryOrderType('groupbuy')}
              >
                <Users className="h-4 w-4 inline mr-1" />
                接龙订单
              </button>
            </div>

            {/* 小程序配送订单 */}
            {deliveryOrderType === 'miniprogram' && (
              <>
                {/* 配送订单统计 */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-4 text-white">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    小程序配送订单
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-white/20 rounded-lg p-2 text-center">
                      <p className="text-xl font-bold">5</p>
                      <p className="text-xs text-white/80">待配货</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2 text-center">
                      <p className="text-xl font-bold">3</p>
                      <p className="text-xs text-white/80">配货中</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2 text-center">
                      <p className="text-xl font-bold">8</p>
                      <p className="text-xs text-white/80">待配送</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2 text-center">
                      <p className="text-xl font-bold">156</p>
                      <p className="text-xs text-white/80">已完成</p>
                    </div>
                  </div>
                </div>

                {/* 订单状态筛选 */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {[
                    { key: 'pending', label: '待配货', count: 5, color: 'bg-red-500' },
                    { key: 'picking', label: '配货中', count: 3, color: 'bg-orange-500' },
                    { key: 'ready', label: '待配送', count: 8, color: 'bg-blue-500' },
                    { key: 'delivering', label: '配送中', count: 2, color: 'bg-purple-500' },
                    { key: 'completed', label: '已完成', count: 156, color: 'bg-green-500' },
                  ].map((tab) => (
                    <Button
                      key={tab.key}
                      variant="outline"
                      size="sm"
                      className="shrink-0 relative"
                    >
                      {tab.label}
                      <span className={`ml-1 px-1.5 py-0.5 ${tab.color} text-white text-[10px] rounded-full`}>
                        {tab.count}
                      </span>
                    </Button>
                  ))}
                </div>

                {/* 小程序订单列表 */}
                <div className="space-y-3">
                  {[
                    {
                      id: 'DD202603310001',
                      customer: '张先生',
                      phone: '138****1234',
                      address: '天润苑B区3栋1单元801',
                      distance: '0.8km',
                      items: [
                        { name: '农夫山泉 550ml', qty: 6, price: 12.00 },
                        { name: '康师傅红烧牛肉面', qty: 3, price: 13.50 },
                        { name: '苹果 红富士', qty: 2, weight: '3.5斤', price: 28.00 },
                      ],
                      total: 53.50,
                      status: 'pending',
                      time: '10分钟前',
                      remark: '苹果要新鲜的，不要磕碰',
                    },
                    {
                      id: 'DD202603310002',
                      customer: '李女士',
                      phone: '139****5678',
                      address: '天润苑A区5栋2单元1203',
                      distance: '1.2km',
                      items: [
                        { name: '纯牛奶 250ml', qty: 12, price: 48.00 },
                        { name: '鸡蛋', qty: 30, price: 36.00 },
                      ],
                      total: 84.00,
                      status: 'pending',
                      time: '25分钟前',
                      remark: '',
                    },
                    {
                      id: 'DD202603310003',
                      customer: '王先生',
                      phone: '137****9012',
                      address: '阳光花园8栋3单元502',
                      distance: '1.5km',
                      items: [
                        { name: '可乐 330ml', qty: 12, price: 42.00 },
                        { name: '薯片 原味', qty: 3, price: 24.00 },
                        { name: '酸奶', qty: 6, price: 22.80 },
                      ],
                      total: 88.80,
                      status: 'picking',
                      time: '35分钟前',
                      remark: '尽快配送',
                    },
                  ].map((order) => (
                    <div key={order.id} className="bg-white rounded-lg border overflow-hidden">
                      {/* 订单头部 */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">{order.id}</span>
                          <Badge variant={order.status === 'pending' ? 'destructive' : 'default'} className="text-xs">
                            {order.status === 'pending' ? '待配货' : '配货中'}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-400">{order.time}</span>
                      </div>
                      
                      {/* 客户信息 */}
                      <div className="p-3 border-b">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{order.customer}</span>
                            <span className="text-sm text-gray-500">{order.phone}</span>
                          </div>
                          <span className="text-xs text-blue-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {order.distance}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                          <span>{order.address}</span>
                        </div>
                        {order.remark && (
                          <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-600">
                            备注：{order.remark}
                          </div>
                        )}
                      </div>
                      
                      {/* 商品列表 */}
                      <div className="p-3 border-b">
                        <div className="text-xs text-gray-500 mb-2">商品清单</div>
                        <div className="space-y-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span>{item.name} {item.weight ? `(${item.weight})` : `×${item.qty}`}</span>
                              <span className="text-gray-600">¥{item.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between mt-2 pt-2 border-t font-medium">
                          <span>合计</span>
                          <span className="text-green-600">¥{order.total.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="p-3 flex gap-2">
                        {order.status === 'pending' && (
                          <>
                            <Button 
                              className="flex-1 bg-orange-500 hover:bg-orange-600"
                              onClick={() => {
                                alert(`开始配货：${order.id}\n\n请按商品清单配货，完成后点击"配货完成"`);
                              }}
                            >
                              <Package className="h-4 w-4 mr-1" />
                              开始配货
                            </Button>
                            <Button variant="outline" size="icon">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {order.status === 'picking' && (
                          <>
                            <Button 
                              className="flex-1 bg-green-500 hover:bg-green-600"
                              onClick={() => {
                                alert(`配货完成：${order.id}\n\n商品已配齐，等待配送员取货`);
                              }}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              配货完成
                            </Button>
                            <Button variant="outline" size="icon">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 接龙订单 */}
            {deliveryOrderType === 'groupbuy' && (
              <>
                {/* 接龙订单统计 */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-4 text-white">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    接龙配送订单
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-white/20 rounded-lg p-2 text-center">
                      <p className="text-xl font-bold">2</p>
                      <p className="text-xs text-white/80">待接单</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2 text-center">
                      <p className="text-xl font-bold">4</p>
                      <p className="text-xs text-white/80">配货中</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2 text-center">
                      <p className="text-xl font-bold">6</p>
                      <p className="text-xs text-white/80">待配送</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2 text-center">
                      <p className="text-xl font-bold">89</p>
                      <p className="text-xs text-white/80">已完成</p>
                    </div>
                  </div>
                </div>

                {/* 接龙批次筛选 */}
                <div className="bg-white rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">今日接龙批次</span>
                    <Button variant="ghost" size="sm" className="text-xs text-orange-500">
                      查看历史
                    </Button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {[
                      { id: 'B001', name: '早市接龙', time: '08:00', orders: 12, status: '已完成' },
                      { id: 'B002', name: '午间接龙', time: '11:30', orders: 8, status: '配送中' },
                      { id: 'B003', name: '下午接龙', time: '15:00', orders: 15, status: '配货中' },
                      { id: 'B004', name: '晚间接龙', time: '18:00', orders: 6, status: '待接单' },
                    ].map((batch) => (
                      <button
                        key={batch.id}
                        className={`shrink-0 px-3 py-2 rounded-lg border text-left transition-all ${
                          selectedGroupBuyBatch === batch.id 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedGroupBuyBatch(batch.id)}
                      >
                        <div className="text-sm font-medium">{batch.name}</div>
                        <div className="text-xs text-gray-500">{batch.time} · {batch.orders}单</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 接龙订单列表 */}
                <div className="space-y-3">
                  {/* 接龙订单卡片 - 批量配送模式 */}
                  <div className="bg-white rounded-lg border overflow-hidden">
                    <div className="bg-orange-50 p-3 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-orange-500">待配送</Badge>
                          <span className="text-sm font-medium">下午接龙 · 共15单</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Printer className="h-3 w-3 mr-1" />
                            打印配货单
                          </Button>
                          <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                            <Truck className="h-3 w-3 mr-1" />
                            批量配送
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* 接龙订单详情 */}
                    <div className="divide-y">
                      {[
                        {
                          id: 'JL20260331001',
                          customer: '陈阿姨',
                          phone: '136****2345',
                          address: '天润苑B区2栋1单元502',
                          distance: '0.5km',
                          items: [
                            { name: '土鸡蛋 30枚', qty: 1, price: 38.00 },
                            { name: '有机蔬菜礼包', qty: 1, price: 45.00 },
                          ],
                          total: 83.00,
                          time: '14:32',
                        },
                        {
                          id: 'JL20260331002',
                          customer: '刘大姐',
                          phone: '135****6789',
                          address: '天润苑B区5栋3单元1101',
                          distance: '0.8km',
                          items: [
                            { name: '东北大米 10kg', qty: 1, price: 68.00 },
                            { name: '金龙鱼调和油 5L', qty: 1, price: 75.00 },
                            { name: '土鸡蛋 30枚', qty: 1, price: 38.00 },
                          ],
                          total: 181.00,
                          time: '14:45',
                        },
                        {
                          id: 'JL20260331003',
                          customer: '张大爷',
                          phone: '138****3456',
                          address: '阳光花园3栋2单元201',
                          distance: '1.2km',
                          items: [
                            { name: '新鲜猪肉 2斤', qty: 1, price: 45.00 },
                            { name: '有机蔬菜礼包', qty: 2, price: 90.00 },
                          ],
                          total: 135.00,
                          time: '15:01',
                          remark: '猪肉要肥瘦相间的',
                        },
                      ].map((order, index) => (
                        <div key={order.id} className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-medium">
                                {index + 1}
                              </span>
                              <span className="font-medium">{order.customer}</span>
                              <span className="text-sm text-gray-500">{order.phone}</span>
                            </div>
                            <span className="text-xs text-gray-400">{order.time}</span>
                          </div>
                          
                          <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                            <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                            <span className="flex-1">{order.address}</span>
                            <Badge variant="outline" className="text-xs text-blue-500 border-blue-200">
                              {order.distance}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {order.items.map((item, i) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                {item.name} ×{item.qty}
                              </span>
                            ))}
                          </div>
                          
                          {order.remark && (
                            <div className="text-xs text-orange-600 mb-2">
                              备注：{order.remark}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-600">
                              ¥{order.total.toFixed(2)}
                            </span>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 text-xs">
                                <Phone className="h-3 w-3 mr-1" />
                                联系
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                已送达
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* 加载更多 */}
                    <div className="p-3 border-t bg-gray-50 text-center">
                      <Button variant="ghost" size="sm" className="text-gray-500">
                        查看更多订单 (还有12单)
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>

                  {/* 接龙商品汇总 */}
                  <div className="bg-white rounded-lg border p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4 text-orange-500" />
                      本次接龙商品汇总
                    </h4>
                    <div className="space-y-2">
                      {[
                        { name: '土鸡蛋 30枚', total: 28, unit: '盒' },
                        { name: '有机蔬菜礼包', total: 35, unit: '份' },
                        { name: '东北大米 10kg', total: 12, unit: '袋' },
                        { name: '金龙鱼调和油 5L', total: 8, unit: '桶' },
                        { name: '新鲜猪肉', total: 15, unit: '斤' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>{item.name}</span>
                          <span className="font-medium">{item.total}{item.unit}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <Button variant="outline" className="w-full">
                        <Printer className="h-4 w-4 mr-2" />
                        打印采购清单
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 底部操作 */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-12">
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新订单
              </Button>
              <Button variant="outline" className="h-12">
                <Receipt className="h-4 w-4 mr-2" />
                配送记录
              </Button>
            </div>
          </div>
        );

      case 'members':
        return (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="输入手机号后4位搜索..." 
                className="pl-9" 
                value={memberSearchTerm}
                onChange={(e) => handleMemberSearch(e.target.value)}
              />
              
              {/* 搜索结果下拉 */}
              {showMemberSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {memberSearchResults.length > 0 ? (
                    memberSearchResults.map((m) => (
                      <button
                        key={m.id}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-0 text-left"
                        onClick={() => selectMember(m)}
                      >
                        <div>
                          <p className="text-sm font-medium">{m.name}</p>
                          <p className="text-xs text-gray-400">{m.phone}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={m.level === '金卡' || m.level === '钻石' ? 'default' : 'outline'} className="text-xs">
                            {m.level}
                          </Badge>
                          <p className="text-xs text-gray-400 mt-1">{m.points}积分</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      未找到匹配的会员
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* 会员统计 */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-3">今日会员</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">{memberList.filter(m => m.registerDate === new Date().toISOString().split('T')[0]).length || 12}</p>
                  <p className="text-xs text-muted-foreground">新增会员</p>
                </div>
                <div className="bg-pink-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-pink-600">38</p>
                  <p className="text-xs text-muted-foreground">会员消费</p>
                </div>
              </div>
            </div>
            
            {/* 会员列表 */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-3">最近会员</h3>
              <div className="space-y-2">
                {memberList.slice(0, 3).map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-gray-400">{m.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={m.level === '金卡' || m.level === '钻石' ? 'default' : 'outline'} className="text-xs">
                        {m.level}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">{m.points}积分</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="space-y-2">
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={() => setShowMemberDialog(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                注册新会员
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowMemberListDialog(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                会员列表
              </Button>
            </div>
          </div>
        );

      case 'promotions':
        // 按状态分组促销活动
        const pendingPromotions = promotionList.filter(p => p.status === 'pending');
        const approvedPromotions = promotionList.filter(p => p.status === 'approved');
        const rejectedPromotions = promotionList.filter(p => p.status === 'rejected');
        const endedPromotions = promotionList.filter(p => p.status === 'ended');
        
        return (
          <div className="space-y-4">
            {/* 促销效果统计 */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-4 text-white">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Gift className="h-4 w-4" />
                促销效果
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-sm text-white/80">活动参与</p>
                  <p className="text-2xl font-bold">156单</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-sm text-white/80">优惠金额</p>
                  <p className="text-2xl font-bold">¥1,280</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-sm text-white/80">进行中</p>
                  <p className="text-2xl font-bold">{approvedPromotions.length}</p>
                </div>
              </div>
            </div>
            
            {/* 待审批促销 */}
            {pendingPromotions.length > 0 && (
              <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2 text-amber-700">
                  <Clock className="h-4 w-4" />
                  待总部审批 ({pendingPromotions.length})
                </h3>
                <div className="space-y-2">
                  {pendingPromotions.map((promo) => (
                    <div key={promo.id} className="bg-white rounded-lg p-3 border border-amber-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${promo.source === 'headquarters' ? 'bg-blue-500' : 'bg-green-500'}`}>
                            {promo.source === 'headquarters' ? '总部' : '本店'}
                          </Badge>
                          <Badge className="bg-amber-500">待审批</Badge>
                          <span className="font-medium">{promo.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">{promo.createTime}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {promo.type === 'discount' && (promo.applyScope === 'all' ? '全场' : '指定商品') + (promo.discount! * 10).toFixed(0) + '折'}
                        {promo.type === 'fullreduce' && `满${promo.fullAmount}减${promo.reduceAmount}`}
                        {promo.type === 'special' && `特价商品`}
                      </p>
                      <p className="text-xs text-gray-400">
                        活动时间：{promo.startDate} ~ {promo.endDate}
                      </p>
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        等待总部审批，审批通过后将自动生效
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 已拒绝促销 */}
            {rejectedPromotions.length > 0 && (
              <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2 text-red-700">
                  <X className="h-4 w-4" />
                  已拒绝 ({rejectedPromotions.length})
                </h3>
                <div className="space-y-2">
                  {rejectedPromotions.map((promo) => (
                    <div key={promo.id} className="bg-white rounded-lg p-3 border border-red-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${promo.source === 'headquarters' ? 'bg-blue-500' : 'bg-green-500'}`}>
                            {promo.source === 'headquarters' ? '总部' : '本店'}
                          </Badge>
                          <span className="font-medium">{promo.name}</span>
                        </div>
                        <Badge variant="destructive" className="text-xs">已拒绝</Badge>
                      </div>
                      <p className="text-sm text-red-600 mb-1">
                        拒绝原因：{promo.rejectReason}
                      </p>
                      <p className="text-xs text-gray-400">
                        提交时间：{promo.createTime}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
                          // 重新提报
                          setPromotionList(prev => prev.map(p => 
                            p.id === promo.id ? { ...p, status: 'pending', rejectReason: undefined } : p
                          ));
                          alert('已重新提交审批！');
                        }}>
                          重新提报
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-7 text-gray-400" onClick={() => {
                          if (confirm('确定删除该促销活动吗？')) {
                            setPromotionList(prev => prev.filter(p => p.id !== promo.id));
                          }
                        }}>
                          删除
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 进行中的促销 */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-green-500" />
                进行中的促销 ({approvedPromotions.length})
              </h3>
              {approvedPromotions.length > 0 ? (
                <div className="space-y-3">
                  {approvedPromotions.map((promo) => (
                    <div key={promo.id} className={`p-3 rounded-lg border ${promo.source === 'headquarters' ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge className={`${promo.source === 'headquarters' ? 'bg-blue-500' : 'bg-green-500'}`}>
                            {promo.source === 'headquarters' ? '总部' : '本店'}
                          </Badge>
                          <span className="font-medium">{promo.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {promo.startDate} ~ {promo.endDate}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {promo.type === 'discount' && (promo.applyScope === 'all' ? '全场' : '指定商品') + (promo.discount! * 10).toFixed(0) + '折'}
                        {promo.type === 'fullreduce' && `满${promo.fullAmount}减${promo.reduceAmount}`}
                        {promo.type === 'special' && `特价商品`}
                      </p>
                      <p className={`text-xs mt-1 ${promo.source === 'headquarters' ? 'text-blue-600' : 'text-green-600'}`}>
                        ✓ 审批通过时间：{promo.approveTime}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <Gift className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>暂无进行中的促销活动</p>
                </div>
              )}
            </div>
            
            {/* 已结束促销 */}
            {endedPromotions.length > 0 && (
              <div className="bg-gray-50 rounded-lg border p-4">
                <h3 className="font-medium mb-3 text-gray-500">已结束促销</h3>
                <div className="space-y-2">
                  {endedPromotions.map((promo) => (
                    <div key={promo.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${promo.source === 'headquarters' ? 'text-blue-400 border-blue-300' : 'text-green-400 border-green-300'}`}>
                          {promo.source === 'headquarters' ? '总部' : '本店'}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium text-gray-600">{promo.name}</p>
                          <p className="text-xs text-gray-400">{promo.startDate} ~ {promo.endDate}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-gray-400 border-gray-300">已结束</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 创建促销按钮 */}
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={() => setShowPromotionDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              创建促销活动并提报审批
            </Button>
          </div>
        );

      case 'services':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-3">便民服务</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '📱', name: '手机充值' },
                  { icon: '💡', name: '电费缴纳' },
                  { icon: '💧', name: '水费缴纳' },
                  { icon: '⛽', name: '加油卡' },
                  { icon: '🎮', name: '游戏充值' },
                  { icon: '📺', name: '视频会员' },
                ].map((service, i) => (
                  <Button key={i} variant="outline" className="h-16 flex flex-col">
                    <span className="text-xl mb-1">{service.icon}</span>
                    <span className="text-xs">{service.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'prints':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-3">打印任务</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">今日小票</span>
                  <span className="font-medium">56 张</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">打印纸剩余</span>
                  <Badge className="bg-green-500">充足</Badge>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-3">快速操作</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  <Printer className="h-4 w-4 mr-2" />
                  重打上一张小票
                </Button>
                <Button variant="outline" className="w-full">
                  <Receipt className="h-4 w-4 mr-2" />
                  打印交接班报表
                </Button>
              </div>
            </div>
          </div>
        );

      case 'shift':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-3">当前班次</h3>
              <div className="text-center py-4">
                <Avatar className="h-16 w-16 mx-auto mb-3">
                  <AvatarFallback className="text-lg">{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-muted-foreground">上班时间：08:00</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xl font-bold text-green-600">¥8,520</p>
                  <p className="text-xs text-muted-foreground">营业额</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xl font-bold text-blue-600">56</p>
                  <p className="text-xs text-muted-foreground">订单数</p>
                </div>
              </div>
            </div>
            <Button className="w-full bg-orange-500 hover:bg-orange-600">
              <Clock className="h-4 w-4 mr-2" />
              交接班
            </Button>
          </div>
        );

      case 'settings':
        // 设置页面在外部渲染，这里返回null
        return null;

      case 'system-settings':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-4 text-lg">系统设置</h3>
              
              {/* 语音播报设置 */}
              <div className="space-y-1 mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-3">语音播报设置</h4>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm">收款记账语音播报开关</span>
                  <Switch 
                    checked={settings.paymentVoiceEnabled}
                    onCheckedChange={(checked) => updateSetting('paymentVoiceEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm">扫描付款码语音播报开关</span>
                  <Switch 
                    checked={settings.scanPaymentVoiceEnabled}
                    onCheckedChange={(checked) => updateSetting('scanPaymentVoiceEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm">收款播报商品件数开关</span>
                  <Switch 
                    checked={settings.itemCountVoiceEnabled}
                    onCheckedChange={(checked) => updateSetting('itemCountVoiceEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm">美团订单语音播报开关</span>
                  <Switch 
                    checked={settings.meituanVoiceEnabled}
                    onCheckedChange={(checked) => updateSetting('meituanVoiceEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm">商品加入购物车语音提醒开关</span>
                  <Switch 
                    checked={settings.cartAddVoiceEnabled}
                    onCheckedChange={(checked) => updateSetting('cartAddVoiceEnabled', checked)}
                  />
                </div>
              </div>

              {/* 启动设置 */}
              <div className="space-y-1 mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-3">启动设置</h4>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm">开机时自动启动</span>
                  <Switch 
                    checked={settings.autoStart}
                    onCheckedChange={(checked) => updateSetting('autoStart', checked)}
                  />
                </div>
              </div>

              {/* 声音设置 */}
              <div className="space-y-1 mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-3">声音设置</h4>
                <div className="py-3 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">广告音量</span>
                    <span className="text-xs text-gray-400">{settings.adVolume}%</span>
                  </div>
                  <input 
                    type="range" 
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                    value={settings.adVolume}
                    onChange={(e) => updateSetting('adVolume', parseInt(e.target.value))}
                  />
                </div>
                <div className="py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">语音提示音量</span>
                    <span className="text-xs text-gray-400">{settings.voiceVolume}%</span>
                  </div>
                  <input 
                    type="range" 
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                    value={settings.voiceVolume}
                    onChange={(e) => updateSetting('voiceVolume', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <Button 
                className="w-full bg-red-500 hover:bg-red-600"
                onClick={() => showSaveMessage('系统设置已保存')}
              >
                保存设置
              </Button>
            </div>
          </div>
        );

      case 'devices':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-lg">外设管理</h3>
              <Button variant="outline" size="sm" className="text-xs">
                <RefreshCw className="h-3 w-3 mr-1" />
                刷新设备
              </Button>
            </div>
            
            {/* 设备列表 */}
            {[
              { id: 'usb-001', name: 'USB Printer P', manufacturer: 'XPrinter', productId: 8227, vendorId: 11575, type: 'printer', typeLabel: '打印机' },
              { id: 'usb-002', name: 'A031-PC2.1-ZC', manufacturer: 'Sonix Technology', productId: 25451, vendorId: 3141, type: 'other', typeLabel: '其它类型' },
              { id: 'usb-003', name: 'Alipay KD4 2.4G-USB Dongle', manufacturer: 'Telink', productId: 35280, vendorId: 9354, type: 'scanner', typeLabel: '扫码枪' },
              { id: 'usb-004', name: 'TMS HIDKeyBoard', manufacturer: '未知', productId: 34817, vendorId: 9969, type: 'other', typeLabel: '其它类型' },
            ].map((device) => (
              <div key={device.id} className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-xs text-gray-400">制造商: {device.manufacturer}</p>
                  </div>
                  <Badge variant={device.type === 'printer' || device.type === 'scanner' ? 'default' : 'outline'} className="text-xs">
                    {device.typeLabel}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                  <div>产品ID: {device.productId}</div>
                  <div>厂商ID: {device.vendorId}</div>
                  <div>连接方式: USB</div>
                  <div>状态: <span className="text-green-500">已连接</span></div>
                </div>
                <Button variant="outline" size="sm" className="w-full text-red-500 border-red-200 hover:bg-red-50">
                  更改设备类型
                </Button>
              </div>
            ))}
          </div>
        );

      case 'other-settings':
        return (
          <div className="space-y-2">
            <h3 className="font-medium text-lg mb-4">其他功能设置</h3>
            
            {/* 功能开关 */}
            <div className="bg-white rounded-lg border">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <p className="text-sm font-medium">交接班模式开关</p>
                </div>
                <Switch 
                  checked={settings.shiftModeEnabled}
                  onCheckedChange={(checked) => updateSetting('shiftModeEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <p className="text-sm font-medium">收银机外卖接单</p>
                  <p className="text-xs text-gray-400">
                    {settings.takeawayEnabled ? '已开启，关闭后左侧菜单中"外卖"模块将隐藏' : '已关闭'}
                  </p>
                </div>
                <Switch 
                  checked={settings.takeawayEnabled}
                  onCheckedChange={(checked) => updateSetting('takeawayEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">生鲜模式</p>
                  <p className="text-xs text-gray-400">开启后，收银页面切换成生鲜称重品为主</p>
                </div>
                <Switch 
                  checked={settings.freshModeEnabled}
                  onCheckedChange={(checked) => updateSetting('freshModeEnabled', checked)}
                />
              </div>
            </div>

            {/* 硬件设置入口 */}
            <div className="bg-white rounded-lg border">
              <button 
                className="w-full flex items-center justify-between p-4 border-b hover:bg-gray-50"
                onClick={() => setCurrentView('scale-settings')}
              >
                <div>
                  <p className="text-sm font-medium">电子秤设置</p>
                  <p className="text-xs text-gray-400">设置电子秤串口地址和波特率</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
              <button 
                className="w-full flex items-center justify-between p-4 border-b hover:bg-gray-50"
                onClick={() => alert('条码秤设置功能开发中')}
              >
                <div>
                  <p className="text-sm font-medium">条码秤设置</p>
                  <p className="text-xs text-gray-400">支持大华TM-AB、TM-F条码打印计价秤，顶尖LS2ZX条码标签秤</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
              <button 
                className="w-full flex items-center justify-between p-4 border-b hover:bg-gray-50"
                onClick={() => setCurrentView('scale-settings')}
              >
                <div>
                  <p className="text-sm font-medium">AI秤设置</p>
                  <p className="text-xs text-gray-400">AI智能识别商品配置</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
              <button 
                className="w-full flex items-center justify-between p-4 border-b hover:bg-gray-50"
                onClick={() => alert('收银渠道设置功能开发中')}
              >
                <div>
                  <p className="text-sm font-medium">收银渠道设置</p>
                  <p className="text-xs text-red-400">请谨慎操作</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
              <button 
                className="w-full flex items-center justify-between p-4 border-b hover:bg-gray-50"
                onClick={() => window.open('https://www.jd.com', '_blank')}
              >
                <div>
                  <p className="text-sm font-medium">收银配件购买</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
              <button 
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                onClick={() => setCurrentView('cash-drawer-settings')}
              >
                <div>
                  <p className="text-sm font-medium">钱箱设置</p>
                  <p className="text-xs text-gray-400">配置钱箱密码和自动打开</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        );

      case 'ad-settings':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-lg">客显屏广告管理</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                由总部统一管理
              </div>
            </div>
            
            {/* 广告预览 */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-sm mb-3">广告预览</h4>
              <div className="aspect-video bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">会员专享</div>
                  <div className="text-lg opacity-80">扫码注册 立享优惠</div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">广告将在客显屏空闲时轮播展示</p>
            </div>

            {/* 广告状态 */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">广告轮播状态</h4>
                <Badge className="bg-green-500">运行中</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">当前广告数</p>
                  <p className="text-xl font-bold">5 条</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">轮播间隔</p>
                  <p className="text-xl font-bold">8 秒</p>
                </div>
              </div>
            </div>

            {/* 广告列表 */}
            <div className="bg-white rounded-lg border">
              <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                <h4 className="font-medium text-sm">当前广告内容</h4>
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  同步最新
                </Button>
              </div>
              <div className="divide-y">
                {[
                  { id: 'ad1', title: '新鲜水果', subtitle: '每日直采 品质保证', status: 'active', color: 'from-green-500 to-emerald-600' },
                  { id: 'ad2', title: '会员专享', subtitle: '扫码注册 立享优惠', status: 'active', color: 'from-purple-500 to-indigo-600' },
                  { id: 'ad3', title: '限时特惠', subtitle: '今日特价 限量抢购', status: 'active', color: 'from-orange-500 to-red-500' },
                  { id: 'ad4', title: '海邻到家', subtitle: '社区便利店 品质生活', status: 'active', color: 'from-blue-500 to-cyan-500' },
                  { id: 'ad5', title: '生活好物', subtitle: '精选好货 品质生活', status: 'active', color: 'from-pink-500 to-rose-500' },
                ].map((ad) => (
                  <div key={ad.id} className="flex items-center gap-3 p-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${ad.color} flex items-center justify-center text-white text-xs font-bold`}>
                      {ad.title.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{ad.title}</p>
                      <p className="text-xs text-gray-500">{ad.subtitle}</p>
                    </div>
                    <Badge variant="outline" className="text-green-500 border-green-200 text-xs">展示中</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* 操作说明 */}
            <div className="bg-blue-50 rounded-lg p-4 text-sm">
              <h4 className="font-medium text-blue-700 mb-2">说明</h4>
              <ul className="text-blue-600 space-y-1 text-xs">
                <li>• 客显屏广告由总部统一管理，门店无需操作</li>
                <li>• 广告在客显屏空闲（无购物）时自动轮播展示</li>
                <li>• 有购物时自动切换显示购物内容</li>
                <li>• 如需自定义广告内容，请联系总部运营</li>
              </ul>
            </div>
          </div>
        );

      case 'printer-settings':
        return (
          <div className="flex gap-6">
            {/* 左侧：小票预览区 */}
            <div className="w-72 shrink-0">
              <div className="bg-gray-100 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-3 text-center">小票预览</h4>
                <div className="bg-white rounded shadow-sm p-3 font-mono text-xs leading-relaxed">
                  {/* 店铺名称 */}
                  <div className="text-center font-bold text-sm mb-1">
                    海邻到家便利店天润苑B区店
                  </div>
                  
                  {/* 单号和时间 */}
                  <div className="text-gray-600">
                    <div>单号：520329143937491618</div>
                    <div>下单时间：2026-03-29 14:39:37</div>
                    <div>打印时间：2026-03-29 14:39:47</div>
                  </div>
                  
                  {/* 分隔线 */}
                  <div className="border-t border-dashed border-gray-300 my-2"></div>
                  
                  {/* 商品明细 */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>商品</span>
                      <span>单价</span>
                      <span>数量</span>
                      <span>小计</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>百事可乐</span>
                      <span>2.50</span>
                      <span>50罐</span>
                      <span>125.00</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>大白菜</span>
                      <span>3.00</span>
                      <span>5kg</span>
                      <span>15.00</span>
                    </div>
                  </div>
                  
                  {/* 分隔线 */}
                  <div className="border-t border-dashed border-gray-300 my-2"></div>
                  
                  {/* 合计 */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>购买合计</span>
                      <span>55</span>
                      <span className="font-bold">140.00</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>微信支付</span>
                      <span></span>
                      <span>140.00</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>找零</span>
                      <span></span>
                      <span>0.00</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>抹零</span>
                      <span></span>
                      <span>0.00</span>
                    </div>
                  </div>
                  
                  {/* 分隔线 */}
                  <div className="border-t border-dashed border-gray-300 my-2"></div>
                  
                  {/* 会员信息 */}
                  <div className="text-gray-600 space-y-1">
                    <div>会员手机号：176****1210</div>
                    <div>本次消费会员储值余额：20.00</div>
                    <div>当前会员储值余额：200.00</div>
                    <div>本次消费获得积分：20</div>
                    <div>当前积分账户剩余：500</div>
                  </div>
                  
                  {/* 分隔线 */}
                  <div className="border-t border-dashed border-gray-300 my-2"></div>
                  
                  {/* 底部信息 */}
                  <div className="text-center text-gray-600">
                    <div className="mb-1">多谢惠顾，欢迎下次再来！</div>
                    <div className="text-[10px]">河南省南阳市宛城区长江路东段</div>
                    <div className="text-[10px]">电话：18637791618</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 右侧：设置配置区 */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-lg border p-4 mb-4">
                <h4 className="text-sm font-medium mb-4">基础信息设置</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">客气语</label>
                    <Input defaultValue="多谢惠顾，欢迎下次再来！" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">店铺地址</label>
                    <Input defaultValue={shopConfig.address} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">店铺电话</label>
                    <Input defaultValue={shopConfig.phone} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">结账时打印份数</label>
                    <select className="w-full h-10 px-3 border rounded-md text-sm">
                      <option>1份</option>
                      <option>2份</option>
                      <option>3份</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border p-4 mb-4">
                <h4 className="text-sm font-medium mb-4">打印选项</h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <span className="text-sm">是否显示小票序号</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">不打印</span>
                      <Switch />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <span className="text-sm">标准商品是否打印单位</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500">打印</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <span className="text-sm">非标准商品是否打印单位</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500">打印</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <span className="text-sm">是否打印会员储值余额</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500">打印</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <span className="text-sm">是否打印会员积分</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500">打印</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <span className="text-sm">是否打印客气语</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500">打印</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <span className="text-sm">是否打印店铺地址、电话</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500">打印</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  打印测试
                </Button>
                <Button className="flex-1 bg-red-500 hover:bg-red-600">
                  保存
                </Button>
              </div>
            </div>
          </div>
        );

      case 'scale-settings':
        return (
          <div className="space-y-6">
            <h3 className="font-medium text-lg">电子秤设置</h3>
            
            {/* 基础串口设置 */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="text-sm font-medium mb-4 text-gray-700">串口设置</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">串口地址</label>
                  <Input 
                    value={settings.scalePort}
                    onChange={(e) => updateSetting('scalePort', e.target.value)}
                    placeholder="如：COM1 或 /dev/ttyUSB0"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">波特率</label>
                  <select 
                    className="w-full h-10 px-3 border rounded-md text-sm"
                    value={settings.scaleBaudRate}
                    onChange={(e) => updateSetting('scaleBaudRate', parseInt(e.target.value))}
                  >
                    <option value={9600}>9600</option>
                    <option value={19200}>19200</option>
                    <option value={38400}>38400</option>
                    <option value={115200}>115200</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 条码秤设置 */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="text-sm font-medium mb-4 text-gray-700">条码秤设置</h4>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">条码秤类型</label>
                <select 
                  className="w-full h-10 px-3 border rounded-md text-sm"
                  value={settings.barcodeScaleType}
                  onChange={(e) => updateSetting('barcodeScaleType', e.target.value)}
                >
                  <option value="none">不使用条码秤</option>
                  <option value="tm-ab">大华 TM-AB</option>
                  <option value="tm-f">大华 TM-F</option>
                  <option value="ls2zx">顶尖 LS2ZX</option>
                </select>
              </div>
            </div>

            {/* AI秤设置 */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">AI智能识别</h4>
                  <p className="text-xs text-gray-500 mt-0.5">使用AI视觉模型自动识别商品</p>
                </div>
                <Switch 
                  checked={settings.aiScaleEnabled}
                  onCheckedChange={(checked) => updateSetting('aiScaleEnabled', checked)}
                />
              </div>

              {settings.aiScaleEnabled && (
                <div className="space-y-4 mt-4 pt-4 border-t border-purple-200">
                  {/* AI模型选择 */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">识别模型</label>
                    <select 
                      className="w-full h-10 px-3 border rounded-md text-sm bg-white"
                      value={settings.aiScaleModel}
                      onChange={(e) => updateSetting('aiScaleModel', e.target.value)}
                    >
                      <option value="doubao-seed-1-6-vision-250815">视觉识别模型（推荐）</option>
                      <option value="doubao-seed-1-8-251228">多模态增强模型</option>
                      <option value="kimi-k2-5-260127">Kimi智能模型</option>
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1">
                      视觉模型识别速度快、准确率高；多模态模型适合复杂场景
                    </p>
                  </div>

                  {/* 识别精度设置 */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">
                      识别精度（温度）：{settings.aiScaleTemperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.aiScaleTemperature}
                      onChange={(e) => updateSetting('aiScaleTemperature', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      <span>精确（0）</span>
                      <span>平衡（0.5）</span>
                      <span>灵活（1）</span>
                    </div>
                  </div>

                  {/* 置信度阈值 */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">
                      置信度阈值：{Math.round(settings.aiScaleConfidence * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1"
                      step="0.05"
                      value={settings.aiScaleConfidence}
                      onChange={(e) => updateSetting('aiScaleConfidence', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      低于此阈值的识别结果将提示用户手动确认
                    </p>
                  </div>

                  {/* 自动识别开关 */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm">自动识别</span>
                      <p className="text-xs text-gray-400">检测到商品后自动启动识别</p>
                    </div>
                    <Switch 
                      checked={settings.aiScaleAutoRecognize}
                      onCheckedChange={(checked) => updateSetting('aiScaleAutoRecognize', checked)}
                    />
                  </div>

                  {/* 接口状态提示 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                        <span className="text-white text-[10px]">i</span>
                      </div>
                      <div className="text-xs text-blue-700">
                        <p className="font-medium">AI接口已配置</p>
                        <p className="mt-0.5">识别接口：<code className="bg-blue-100 px-1 rounded">POST /api/ai-scale</code></p>
                        <p className="mt-0.5">无需额外配置API密钥，系统自动管理</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 测试按钮 */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/ai-scale?action=test');
                    const data = await response.json();
                    if (data.success) {
                      alert('AI秤服务运行正常！\n模型：' + data.model);
                    } else {
                      alert('AI秤服务异常：' + data.error);
                    }
                  } catch (error) {
                    alert('测试失败，请检查网络连接');
                  }
                }}
              >
                测试AI服务
              </Button>
              <Button 
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={() => showSaveMessage('电子秤设置已保存')}
              >
                保存设置
              </Button>
            </div>
          </div>
        );

      case 'cash-drawer-settings':
        return (
          <div className="space-y-6">
            <h3 className="font-medium text-lg">钱箱设置</h3>
            
            {/* 钱箱状态 */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">启用钱箱</h4>
                  <p className="text-xs text-gray-500 mt-0.5">开启后可在收款时自动打开钱箱</p>
                </div>
                <Switch 
                  checked={settings.cashDrawerEnabled}
                  onCheckedChange={(checked) => updateSetting('cashDrawerEnabled', checked)}
                />
              </div>
              
              {settings.cashDrawerEnabled && (
                <div className="space-y-4 pt-4 border-t">
                  {/* 自动打开设置 */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm font-medium">收款时自动打开</span>
                      <p className="text-xs text-gray-400">现金收款时自动弹开钱箱</p>
                    </div>
                    <Switch 
                      checked={settings.cashDrawerAutoOpen}
                      onCheckedChange={(checked) => updateSetting('cashDrawerAutoOpen', checked)}
                    />
                  </div>
                  
                  {/* 钱箱密码 */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">钱箱密码（可选）</label>
                    <Input 
                      type="password"
                      value={settings.cashDrawerPassword}
                      onChange={(e) => updateSetting('cashDrawerPassword', e.target.value)}
                      placeholder="设置密码后需输入密码才能打开钱箱"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      留空表示无需密码，设置后每次打开钱箱需验证密码
                    </p>
                  </div>
                  
                  {/* 打开延迟 */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">
                      打开延迟：{settings.cashDrawerOpenDelay}ms
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="500"
                      step="10"
                      value={settings.cashDrawerOpenDelay}
                      onChange={(e) => updateSetting('cashDrawerOpenDelay', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      <span>立即（0ms）</span>
                      <span>延迟500ms</span>
                    </div>
                  </div>
                  
                  {/* 脉冲宽度 */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">
                      脉冲宽度：{settings.cashDrawerPulseWidth}ms
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      step="10"
                      value={settings.cashDrawerPulseWidth}
                      onChange={(e) => updateSetting('cashDrawerPulseWidth', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      控制钱箱电磁铁的通电时间，不同型号钱箱可能需要不同设置
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* 钱箱连接说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-sm">i</span>
                </div>
                <div className="text-xs text-blue-700">
                  <p className="font-medium">连接方式说明</p>
                  <ul className="mt-2 space-y-1.5 list-disc list-inside">
                    <li>通过打印机连接：钱箱连接到小票打印机的钱箱接口</li>
                    <li>通过USB连接：钱箱直接连接到电脑USB端口</li>
                    <li>通过网络连接：部分智能钱箱支持网络控制</li>
                  </ul>
                  <p className="mt-2 text-blue-600">当前连接方式：通过打印机控制</p>
                </div>
              </div>
            </div>
            
            {/* 测试按钮 */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={async () => {
                  // 如果设置了密码，需要验证
                  if (settings.cashDrawerPassword) {
                    const password = prompt('请输入钱箱密码：');
                    if (password !== settings.cashDrawerPassword) {
                      alert('密码错误');
                      return;
                    }
                  }
                  
                  try {
                    await openCashbox();
                    alert('钱箱已打开');
                  } catch (error) {
                    alert('打开钱箱失败：' + (error as Error).message);
                  }
                }}
              >
                测试打开钱箱
              </Button>
              <Button 
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={() => {
                  // 保存设置到本地存储
                  localStorage.setItem('cashDrawerSettings', JSON.stringify({
                    enabled: settings.cashDrawerEnabled,
                    password: settings.cashDrawerPassword,
                    autoOpen: settings.cashDrawerAutoOpen,
                    openDelay: settings.cashDrawerOpenDelay,
                    pulseWidth: settings.cashDrawerPulseWidth,
                  }));
                  showSaveMessage('钱箱设置已保存');
                }}
              >
                保存设置
              </Button>
            </div>
          </div>
        );

      case 'label-settings':
        return (
          <div className="space-y-6">
            {/* 版本标识 - 用于确认用户看到的是最新版本 */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 rounded-lg font-bold shadow-lg">
              ✨ 价签设置 V2.0 - 新版界面 (2024-03-30 更新) ✨
            </div>
            
            {/* 当前选择指示 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-blue-700">当前选择的模板：</span>
                  <span className="font-bold text-blue-800 ml-2">
                    {settings.labelPaperSize === '70x38' ? '标准签 (70×38mm)' : 
                     settings.labelPaperSize === '60x40' ? '会员签 (60×40mm)' : 
                     '简洁签 (50×30mm)'}
                  </span>
                </div>
                <span className="text-xs text-blue-500">点击下方卡片切换模板</span>
              </div>
            </div>

            {/* 模板选择卡片 */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="text-sm font-medium mb-4 text-gray-700">选择价签模板</h4>
              <div className="grid grid-cols-3 gap-4">
                {/* 标准签模板卡片 */}
                <div 
                  className={cn(
                    "border-2 rounded-lg p-4 cursor-pointer transition-all",
                    settings.labelPaperSize === '70x38' 
                      ? "border-red-500 bg-red-50 shadow-lg scale-105" 
                      : "border-gray-200 hover:border-gray-300 hover:shadow"
                  )}
                  onClick={() => {
                    setSettings(prev => ({
                      ...prev,
                      labelPaperSize: '70x38',
                      labelShowName: true,
                      labelShowPrice: true,
                      labelShowBarcode: true,
                      labelShowSpec: true,
                      labelShowOrigin: true,
                      labelShowUnit: true,
                      labelShowGrade: true,
                      labelShowMemberPrice: false,
                      labelShowSupervision: true,
                      labelSupervisionText: '物价局监制 监督电话: 12358',
                    }));
                  }}
                >
                  {/* 选中标记 */}
                  {settings.labelPaperSize === '70x38' && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✓</div>
                  )}
                  {/* 模板预览图 */}
                  <div className="bg-gray-50 rounded p-3 mb-3 flex justify-center relative">
                    <div className="bg-white shadow rounded overflow-hidden border-2 border-red-600" style={{ width: '140px' }}>
                      <div className="bg-white px-1.5 py-0.5 border-b border-red-600">
                        <span className="text-red-600 font-bold text-[10px]">商品标价签</span>
                      </div>
                      <div className="flex">
                        <div className="flex-1 bg-white p-1.5 text-[8px]">
                          <div className="flex"><span className="text-gray-500">品名：</span><span className="border-b border-dotted border-gray-300 flex-1">商品名称</span></div>
                          <div className="grid grid-cols-2 gap-x-0.5 text-[7px] mt-0.5">
                            <div>产地：XX</div>
                            <div>单位：个</div>
                            <div>规格：XX</div>
                            <div>等级：X等</div>
                          </div>
                          <div className="flex mt-0.5 justify-center">
                            {Array.from({ length: 20 }, (_, i) => (
                              <div key={i} className="bg-black" style={{ width: i % 2 === 0 ? '1px' : '0.5px', height: '6px', margin: '0 0.1px' }} />
                            ))}
                          </div>
                        </div>
                        <div className="w-10 bg-yellow-100 p-1 flex flex-col items-center justify-center border-l border-red-600">
                          <span className="text-[6px] text-gray-600">零售价</span>
                          <span className="text-red-600 font-bold text-[10px]">¥X.XX</span>
                        </div>
                      </div>
                      <div className="bg-white text-center py-0.5 border-t border-red-600">
                        <span className="text-gray-400 text-[6px]">监制信息</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={cn(
                      "font-medium text-sm",
                      settings.labelPaperSize === '70x38' ? "text-red-600" : "text-gray-700"
                    )}>标准签</div>
                    <div className="text-xs text-gray-500">70×38mm</div>
                    <div className="text-[10px] text-gray-400 mt-1">完整商品信息</div>
                  </div>
                </div>

                {/* 会员签模板卡片 */}
                <div 
                  className={cn(
                    "border-2 rounded-lg p-4 cursor-pointer transition-all",
                    settings.labelPaperSize === '60x40' 
                      ? "border-red-500 bg-red-50 shadow-lg scale-105" 
                      : "border-gray-200 hover:border-gray-300 hover:shadow"
                  )}
                  onClick={() => {
                    setSettings(prev => ({
                      ...prev,
                      labelPaperSize: '60x40',
                      labelShowName: true,
                      labelShowPrice: true,
                      labelShowBarcode: true,
                      labelShowSpec: true,
                      labelShowOrigin: true,
                      labelShowUnit: true,
                      labelShowGrade: true,
                      labelShowMemberPrice: true,
                      labelShowSupervision: true,
                      labelSupervisionText: '市场监督管理总局 12315',
                    }));
                  }}
                >
                  {/* 选中标记 */}
                  {settings.labelPaperSize === '60x40' && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✓</div>
                  )}
                  {/* 模板预览图 */}
                  <div className="bg-gray-50 rounded p-3 mb-3 flex justify-center relative">
                    <div className="bg-white shadow rounded overflow-hidden border-2 border-red-600" style={{ width: '120px' }}>
                      <div className="bg-white px-1.5 py-0.5 border-b border-red-600 flex justify-end">
                        <span className="text-gray-700 font-bold text-[10px]">商品标价签</span>
                      </div>
                      <div className="flex">
                        <div className="flex-1 bg-white p-1.5 text-[8px]">
                          <div className="font-bold text-[9px]">品名：商品名称</div>
                          <div className="grid grid-cols-2 gap-x-0.5 text-[7px] mt-0.5">
                            <div>产地：XX</div>
                            <div>单位：个</div>
                            <div>规格：XX</div>
                            <div>等级：X等</div>
                          </div>
                          <div className="flex mt-0.5 justify-center">
                            {Array.from({ length: 18 }, (_, i) => (
                              <div key={i} className="bg-black" style={{ width: i % 2 === 0 ? '1px' : '0.5px', height: '5px', margin: '0 0.1px' }} />
                            ))}
                          </div>
                        </div>
                        <div className="w-9 bg-yellow-100 p-1 flex flex-col items-center justify-center border-l border-red-600">
                          <span className="text-[6px] text-gray-600">零售价</span>
                          <span className="text-red-600 font-bold text-[9px]">¥X.XX</span>
                          <span className="text-[5px] text-orange-600">会员价</span>
                          <span className="text-orange-600 font-bold text-[7px]">¥X.XX</span>
                        </div>
                      </div>
                      <div className="bg-white text-center py-0.5 border-t border-red-600">
                        <span className="text-gray-400 text-[6px]">监制信息</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={cn(
                      "font-medium text-sm",
                      settings.labelPaperSize === '60x40' ? "text-red-600" : "text-gray-700"
                    )}>会员签</div>
                    <div className="text-xs text-gray-500">60×40mm</div>
                    <div className="text-[10px] text-gray-400 mt-1">含会员价信息</div>
                  </div>
                </div>

                {/* 简洁签模板卡片 */}
                <div 
                  className={cn(
                    "border-2 rounded-lg p-4 cursor-pointer transition-all",
                    settings.labelPaperSize === '50x30' 
                      ? "border-red-500 bg-red-50 shadow-lg scale-105" 
                      : "border-gray-200 hover:border-gray-300 hover:shadow"
                  )}
                  onClick={() => {
                    setSettings(prev => ({
                      ...prev,
                      labelPaperSize: '50x30',
                      labelShowName: true,
                      labelShowPrice: true,
                      labelShowBarcode: false,
                      labelShowSpec: true,
                      labelShowOrigin: false,
                      labelShowUnit: false,
                      labelShowGrade: false,
                      labelShowMemberPrice: false,
                      labelShowSupervision: false,
                    }));
                  }}
                >
                  {/* 选中标记 */}
                  {settings.labelPaperSize === '50x30' && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✓</div>
                  )}
                  {/* 模板预览图 */}
                  <div className="bg-gray-50 rounded p-3 mb-3 flex justify-center relative">
                    <div className="bg-white shadow rounded p-2 border-2 border-red-600 text-center" style={{ width: '100px' }}>
                      <div className="font-bold text-xs">商品名称</div>
                      <div className="text-[9px] text-gray-500">规格</div>
                      <div className="text-red-600 font-bold text-sm">¥X.XX</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={cn(
                      "font-medium text-sm",
                      settings.labelPaperSize === '50x30' ? "text-red-600" : "text-gray-700"
                    )}>简洁签</div>
                    <div className="text-xs text-gray-500">50×30mm</div>
                    <div className="text-[10px] text-gray-400 mt-1">仅基本信息</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 打印预览 */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="text-sm font-medium mb-4 text-gray-700">打印预览</h4>
              <div className="bg-gray-100 rounded-lg p-8 flex justify-center min-h-[250px] items-center">
                {/* 标准商品价签布局（70×38mm） */}
                {settings.labelPaperSize === '70x38' && (
                  <div className="bg-white shadow-lg rounded overflow-hidden border-2 border-red-600" style={{ width: '175px' }}>
                    <div className="bg-white px-2 py-1 border-b border-red-600 flex items-center">
                      <span className="text-red-600 font-bold text-xs">商品标价签</span>
                    </div>
                    <div className="flex">
                      <div className="flex-1 bg-white p-2 text-xs space-y-0.5">
                        <div className="flex">
                          <span className="text-gray-600 w-8">品名：</span>
                          <span className="flex-1 border-b border-dotted border-gray-300">农夫山泉矿泉水</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-1 text-[10px]">
                          <div><span className="text-gray-600">产地：</span>浙江杭州</div>
                          <div><span className="text-gray-600">单位：</span>瓶</div>
                          <div><span className="text-gray-600">规格：</span>550ml</div>
                          <div><span className="text-gray-600">等级：</span>一等品</div>
                        </div>
                        <div className="mt-1">
                          <span className="text-gray-600 text-[10px]">条码：</span>
                          <span className="text-[8px]">6901234567890</span>
                          <div className="flex mt-0.5 justify-center">
                            {Array.from({ length: 30 }, (_, i) => (
                              <div key={i} className="bg-black" style={{ width: i % 2 === 0 ? '1px' : '0.5px', height: '10px', margin: '0 0.2px' }} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="w-14 bg-yellow-100 p-1.5 flex flex-col items-center justify-center border-l border-red-600">
                        <span className="text-[8px] text-gray-600">零售价</span>
                        <div className="text-center">
                          <span className="text-red-600 font-bold text-sm">¥</span>
                          <span className="text-red-600 font-bold text-lg">1.50</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white text-center py-0.5 border-t border-red-600">
                      <span className="text-gray-500 text-[8px]">物价局监制 监督电话: 12358</span>
                    </div>
                  </div>
                )}

                {/* 会员商品价签布局（60×40mm） */}
                {settings.labelPaperSize === '60x40' && (
                  <div className="bg-white shadow-lg rounded overflow-hidden border-2 border-red-600" style={{ width: '150px' }}>
                    <div className="bg-white px-2 py-1 border-b border-red-600 flex items-center justify-end">
                      <span className="text-gray-800 font-bold text-xs">商品标价签</span>
                    </div>
                    <div className="flex">
                      <div className="flex-1 bg-white p-2 text-xs space-y-0.5">
                        <div className="font-bold text-xs">品名：农夫山泉矿泉水</div>
                        <div className="grid grid-cols-2 gap-x-1 text-[9px]">
                          <div>产地：浙江杭州</div>
                          <div>单位：瓶</div>
                          <div>规格：550ml</div>
                          <div>等级：一等品</div>
                        </div>
                        <div className="mt-0.5">
                          <span className="text-gray-600 text-[8px]">条码：</span>
                          <div className="flex mt-0.5 justify-center">
                            {Array.from({ length: 25 }, (_, i) => (
                              <div key={i} className="bg-black" style={{ width: i % 2 === 0 ? '1px' : '0.5px', height: '8px', margin: '0 0.2px' }} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="w-12 bg-yellow-100 p-1 flex flex-col items-center justify-center border-l border-red-600">
                        <span className="text-[8px] text-gray-600">零售价</span>
                        <div className="text-center">
                          <span className="text-red-600 font-bold text-xs">¥</span>
                          <span className="text-red-600 font-bold text-sm">1.50</span>
                        </div>
                        <div className="mt-0.5 text-center">
                          <span className="text-[7px] text-orange-600">会员价</span>
                          <div className="text-orange-600 font-bold text-[10px]">¥1.35</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white text-center py-0.5 border-t border-red-600">
                      <span className="text-gray-500 text-[8px]">市场监督管理总局 12315</span>
                    </div>
                  </div>
                )}

                {/* 简洁商品价签布局（50×30mm） */}
                {settings.labelPaperSize === '50x30' && (
                  <div className="bg-white shadow-lg rounded p-3 border-2 border-red-600 text-center" style={{ width: '125px' }}>
                    <div className="font-bold text-sm">农夫山泉矿泉水</div>
                    <div className="text-xs text-gray-500">550ml</div>
                    <div className="text-red-600 font-bold text-lg">¥1.50</div>
                  </div>
                )}
              </div>
              <div className="mt-3 text-center text-xs text-gray-500">
                当前模板：{settings.labelPaperSize === '70x38' ? '70mm × 38mm（标准签）' : settings.labelPaperSize === '60x40' ? '60mm × 40mm（会员签）' : '50mm × 30mm（简洁签）'} 
                <span className="mx-2">|</span>
                打印模式：仅打印内容区域
              </div>
            </div>

            {/* 显示内容设置 */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="text-sm font-medium mb-4 text-gray-700">显示内容（可根据需要调整）</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">品名</span>
                  <Switch 
                    checked={settings.labelShowName}
                    onCheckedChange={(checked) => updateSetting('labelShowName', checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b bg-yellow-50 px-2 -mx-2">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 font-bold">¥</span>
                    <span className="text-sm">零售价</span>
                  </div>
                  <Switch 
                    checked={settings.labelShowPrice}
                    onCheckedChange={(checked) => updateSetting('labelShowPrice', checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">产地</span>
                  <Switch 
                    checked={settings.labelShowOrigin}
                    onCheckedChange={(checked) => updateSetting('labelShowOrigin', checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">单位</span>
                  <Switch 
                    checked={settings.labelShowUnit}
                    onCheckedChange={(checked) => updateSetting('labelShowUnit', checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">规格</span>
                  <Switch 
                    checked={settings.labelShowSpec}
                    onCheckedChange={(checked) => updateSetting('labelShowSpec', checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">等级</span>
                  <Switch 
                    checked={settings.labelShowGrade}
                    onCheckedChange={(checked) => updateSetting('labelShowGrade', checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Barcode className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">条形码</span>
                  </div>
                  <Switch 
                    checked={settings.labelShowBarcode}
                    onCheckedChange={(checked) => updateSetting('labelShowBarcode', checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b bg-orange-50 px-2 -mx-2">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 font-bold text-xs">VIP</span>
                    <span className="text-sm">会员价</span>
                  </div>
                  <Switch 
                    checked={settings.labelShowMemberPrice}
                    onCheckedChange={(checked) => updateSetting('labelShowMemberPrice', checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b col-span-2">
                  <span className="text-sm">监制信息</span>
                  <Switch 
                    checked={settings.labelShowSupervision}
                    onCheckedChange={(checked) => updateSetting('labelShowSupervision', checked)}
                  />
                </div>
              </div>
            </div>

            {/* 监制信息设置 */}
            {settings.labelShowSupervision && (
              <div className="bg-white rounded-lg border p-4">
                <h4 className="text-sm font-medium mb-3 text-gray-700">监制信息内容</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={cn(
                      "py-2 px-3 text-xs border rounded transition-all text-left",
                      settings.labelSupervisionText === '物价局监制 监督电话: 12358'
                        ? "border-red-500 bg-red-50 text-red-500"
                        : "hover:bg-gray-50"
                    )}
                    onClick={() => updateSetting('labelSupervisionText', '物价局监制 监督电话: 12358')}
                  >
                    物价局监制
                  </button>
                  <button
                    className={cn(
                      "py-2 px-3 text-xs border rounded transition-all text-left",
                      settings.labelSupervisionText === '市场监督管理总局 12315'
                        ? "border-red-500 bg-red-50 text-red-500"
                        : "hover:bg-gray-50"
                    )}
                    onClick={() => updateSetting('labelSupervisionText', '市场监督管理总局 12315')}
                  >
                    市场监管总局
                  </button>
                </div>
              </div>
            )}

            {/* 打印设置 */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="text-sm font-medium mb-3 text-gray-700">打印设置</h4>
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm">改价自动打印</span>
                  <p className="text-xs text-gray-400">商品改价后自动打印新价签</p>
                </div>
                <Switch 
                  checked={settings.labelAutoPrintOnPriceChange}
                  onCheckedChange={(checked) => updateSetting('labelAutoPrintOnPriceChange', checked)}
                />
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => alert('请先选择要打印价签的商品')}
              >
                <Printer className="h-4 w-4 mr-2" />
                打印测试
              </Button>
              <Button 
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={() => showSaveMessage('价签打印设置已保存')}
              >
                保存
              </Button>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-4">
            {/* 日期选择器 */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">选择日期：</span>
                </div>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex gap-2 ml-auto">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setReportDate(new Date().toISOString().split('T')[0])}
                  >
                    今日
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      setReportDate(yesterday.toISOString().split('T')[0]);
                    }}
                  >
                    昨日
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      setReportDate(weekAgo.toISOString().split('T')[0]);
                    }}
                  >
                    近7天
                  </Button>
                </div>
              </div>
            </div>
            
            {/* 今日销售概览 */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-4 text-white">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {reportDate === new Date().toISOString().split('T')[0] ? '今日销售概览' : `${reportDate} 销售概览`}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-sm text-white/80">销售额</p>
                  <p className="text-2xl font-bold">¥{reportDate === new Date().toISOString().split('T')[0] ? '12,580' : '10,250'}</p>
                  <p className="text-xs text-white/60 mt-1">同比昨日 +15%</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-sm text-white/80">订单数</p>
                  <p className="text-2xl font-bold">{reportDate === new Date().toISOString().split('T')[0] ? '86' : '72'}</p>
                  <p className="text-xs text-white/60 mt-1">同比昨日 +8</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-sm text-white/80">客单价</p>
                  <p className="text-2xl font-bold">¥146</p>
                  <p className="text-xs text-white/60 mt-1">环比持平</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-sm text-white/80">毛利率</p>
                  <p className="text-2xl font-bold">28.5%</p>
                  <p className="text-xs text-white/60 mt-1">目标 30%</p>
                </div>
              </div>
            </div>

            {/* 收款方式统计 */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-3">收款方式统计</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                      <span className="text-green-600 text-sm font-bold">微</span>
                    </div>
                    <span className="text-sm">微信支付</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">¥7,850</p>
                    <p className="text-xs text-gray-400">52笔</p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">支</span>
                    </div>
                    <span className="text-sm">支付宝</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">¥3,980</p>
                    <p className="text-xs text-gray-400">28笔</p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 rounded flex items-center justify-center">
                      <span className="text-amber-600 text-sm font-bold">现</span>
                    </div>
                    <span className="text-sm">现金</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">¥750</p>
                    <p className="text-xs text-gray-400">6笔</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 热销商品排行 */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-3">热销商品 TOP 5</h3>
              <div className="space-y-2">
                {[
                  { rank: 1, name: '农夫山泉 550ml', sales: 86, amount: '¥129.00' },
                  { rank: 2, name: '康师傅红烧牛肉面', sales: 45, amount: '¥225.00' },
                  { rank: 3, name: '维他柠檬茶', sales: 38, amount: '¥152.00' },
                  { rank: 4, name: '百事可乐', sales: 32, amount: '¥80.00' },
                  { rank: 5, name: '旺旺雪饼', sales: 28, amount: '¥140.00' },
                ].map((item) => (
                  <div key={item.rank} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      item.rank === 1 ? "bg-yellow-100 text-yellow-600" :
                      item.rank === 2 ? "bg-gray-100 text-gray-600" :
                      item.rank === 3 ? "bg-orange-100 text-orange-600" :
                      "bg-gray-50 text-gray-400"
                    )}>
                      {item.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">销量: {item.sales}</p>
                    </div>
                    <span className="text-sm font-medium text-green-600">{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 时段分析 */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-3">时段销售分析</h3>
              <div className="space-y-2">
                {[
                  { time: '08:00-10:00', label: '早高峰', amount: '¥2,150', percent: 17 },
                  { time: '10:00-12:00', label: '上午', amount: '¥1,850', percent: 15 },
                  { time: '12:00-14:00', label: '午间', amount: '¥2,480', percent: 20 },
                  { time: '14:00-17:00', label: '下午', amount: '¥1,920', percent: 15 },
                  { time: '17:00-20:00', label: '晚高峰', amount: '¥3,280', percent: 26 },
                  { time: '20:00-22:00', label: '晚间', amount: '¥900', percent: 7 },
                ].map((slot, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{slot.time} {slot.label}</span>
                      <span className="font-medium">{slot.amount}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                        style={{ width: `${slot.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 快捷操作 */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-16 flex flex-col">
                <FileText className="h-5 w-5 mb-1 text-blue-500" />
                <span className="text-xs">日报表</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col">
                <Calendar className="h-5 w-5 mb-1 text-purple-500" />
                <span className="text-xs">月报表</span>
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // 格式化时间
  const { date, time } = formatTime(currentTime);

  // 如果正在加载认证状态，显示加载界面
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  // 如果未认证，不渲染内容（等待跳转）
  if (!isAuthenticated) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
        <p className="text-gray-500">正在跳转到登录页...</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
        {/* 顶部栏 */}
        <header className="h-12 bg-white border-b flex items-center justify-between px-4 shrink-0">
        {/* 左侧店铺信息 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-orange-500" />
            <span className="font-medium text-sm">{shopConfig.name}</span>
            <span className="text-xs text-gray-500">|</span>
            <span className="text-xs text-gray-600">{user?.name || '收银员'}</span>
          </div>
        </div>
        
        {/* 中间快捷工具 */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs"
            onClick={() => setCurrentView('procurement')}
          >
            <Truck className="h-4 w-4 mr-1" />
            采购单
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs"
            onClick={() => {
              // 打开客显屏窗口
              const displayUrl = `${window.location.origin}/pos/customer-display`;
              window.open(displayUrl, 'customerDisplay', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
            }}
          >
            <Smartphone className="h-4 w-4 mr-1" />
            客显屏
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowPrintDialog(true)}>
            <Printer className="h-4 w-4 mr-1" />
            打印
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setIsLocked(true)}>
            <Settings className="h-4 w-4 mr-1" />
            锁屏
          </Button>
        </div>
        
        {/* 右侧系统状态 */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {isOnline ? (
            <span className="flex items-center gap-1 text-green-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              在线
            </span>
          ) : (
            <span className="flex items-center gap-1 text-orange-500">
              <WifiOff className="h-3 w-3" />
              离线
            </span>
          )}
          <span>{date}</span>
          <span className="font-medium text-gray-700">{time}</span>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="flex-1 flex min-h-0">
        {/* 左侧功能导航栏 - 深灰色背景 */}
        <aside className="w-[72px] bg-[#2c3e50] flex flex-col shrink-0">
          {/* Logo区域 */}
          <div className="h-14 flex items-center justify-center border-b border-white/10">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
          </div>
          
          {/* 导航菜单 */}
          <nav className="flex-1 py-2 overflow-y-auto">
            {[
              { icon: ShoppingCart, label: '收银', view: 'cashier' },
              { icon: Package, label: '库存', view: 'inventory' },
              { icon: BookMarked, label: '商品', view: 'products' },
              { icon: Receipt, label: '订单', view: 'orders' },
              { icon: Truck, label: '配送', view: 'delivery' },
              { icon: Calculator, label: '报表', view: 'reports' },
              { icon: Gift, label: '促销', view: 'promotions' },
              { icon: Users, label: '会员', view: 'members' },
              { icon: Settings, label: '设置', view: 'settings' },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => setCurrentView(item.view)}
                  className={cn(
                    "w-full flex flex-col items-center py-3 transition-all relative",
                    isActive 
                      ? "text-white bg-white/10" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-red-500 rounded-r" />
                  )}
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-[10px]">{item.label}</span>
                </button>
              );
            })}
          </nav>
          
          {/* 底部店长管理助手入口 */}
          <div className="border-t border-white/10">
            <a
              href="/store-admin"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex flex-col items-center py-3 text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <Monitor className="h-5 w-5 mb-1" />
              <span className="text-[10px]">店长助手</span>
            </a>
          </div>
          
          {/* 底部客服 */}
          <div className="border-t border-white/10">
            <button className="w-full flex flex-col items-center py-3 text-white/60 hover:text-white hover:bg-white/5 transition-all">
              <Bell className="h-5 w-5 mb-1" />
              <span className="text-[10px]">客服</span>
            </button>
          </div>
        </aside>

        {/* 非收银功能页面 */}
        {currentView !== 'cashier' && (
          <div className="flex-1 overflow-auto bg-gray-50">
            {/* 报表页面 - 全宽显示 */}
            {currentView === 'reports' && (
              <ReportsPage onBack={() => setCurrentView('cashier')} />
            )}
            
            {/* 其他页面 - 限制宽度 */}
            {currentView !== 'reports' && (
            <div className="p-6">
              <div className="max-w-5xl mx-auto">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  {currentView === 'inventory' && '库存管理'}
                  {currentView === 'products' && '商品管理'}
                  {currentView === 'procurement' && '采购管理'}
                  {currentView === 'orders' && '订单管理'}
                  {currentView === 'delivery' && '配送订单'}
                  {currentView === 'members' && '会员管理'}
                  {currentView === 'promotions' && '促销管理'}
                  {currentView === 'services' && '便民服务'}
                  {currentView === 'prints' && '打印管理'}
                  {currentView === 'shift' && '交接班'}
                  {currentView === 'settings' && '设置'}
                  {currentView === 'system-settings' && '系统设置'}
                  {currentView === 'devices' && '外设管理'}
                  {currentView === 'other-settings' && '其他功能设置'}
                  {currentView === 'ad-settings' && '客显屏广告'}
                  {currentView === 'printer-settings' && '小票打印设置'}
                  {currentView === 'scale-settings' && '电子秤设置'}
                  {currentView === 'label-settings' && '价签打印设置'}
                  {currentView === 'cash-drawer-settings' && '钱箱设置'}
                </h2>
                <Button variant="outline" size="sm" onClick={() => setCurrentView('cashier')}>
                  返回收银
                </Button>
              </div>
              
              {/* 订单页面 - 特殊布局 */}
              {currentView === 'orders' && (
                <div className="h-[calc(100vh-100px)]">
                  {renderSidePanelContent()}
                </div>
              )}
              
              {/* 设置页面 - 左右布局 */}
              {['settings', 'system-settings', 'devices', 'other-settings', 'printer-settings', 'scale-settings', 'label-settings', 'ad-settings', 'cash-drawer-settings'].includes(currentView) && (
                <div className="flex h-[calc(100vh-140px)]">
                  {/* 左侧菜单 - 延伸到底部 */}
                  <div className="w-52 shrink-0 flex flex-col bg-slate-50 border-r border-slate-200">
                    {/* 设置菜单 */}
                    <div className="flex-1 overflow-y-auto py-2">
                      {[
                        { view: 'system-settings', label: '系统设置', icon: Volume2 },
                        { view: 'devices', label: '外设管理', icon: HardDrive },
                        { view: 'printer-settings', label: '小票打印', icon: Printer },
                        { view: 'label-settings', label: '价签打印', icon: Tag },
                        { view: 'scale-settings', label: '电子秤', icon: Scale },
                        { view: 'cash-drawer-settings', label: '钱箱设置', icon: Wallet },
                        { view: 'ad-settings', label: '客显屏广告', icon: Sparkles },
                        { view: 'other-settings', label: '其他功能', icon: MoreHorizontal },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.view;
                        return (
                          <button
                            key={item.view}
                            onClick={() => setCurrentView(item.view)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3 text-sm transition-all border-l-2",
                              isActive 
                                ? "bg-blue-50 text-blue-600 font-medium border-blue-500" 
                                : "text-slate-600 hover:bg-slate-100 border-transparent"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* 底部区域 - 快捷开关和退出 */}
                    <div className="border-t border-slate-200 p-4 bg-white">
                      {/* 快捷开关 */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">语音播报</span>
                          <Switch 
                            checked={settings.paymentVoiceEnabled}
                            onCheckedChange={(checked) => updateSetting('paymentVoiceEnabled', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">开机自启</span>
                          <Switch 
                            checked={settings.autoStart}
                            onCheckedChange={(checked) => updateSetting('autoStart', checked)}
                          />
                        </div>
                      </div>
                      
                      {/* 退出登录按钮 */}
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={() => {
                          if (confirm('确定要退出登录吗？')) {
                            logout();
                            router.push('/pos/auth/login');
                          }
                        }}
                      >
                        退出登录
                      </Button>
                    </div>
                  </div>
                  
                  {/* 右侧内容区 */}
                  <div className="flex-1 min-w-0 overflow-auto p-4 bg-white">
                    {saveMessage && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center text-green-600 text-sm mb-4">
                        {saveMessage}
                      </div>
                    )}
                    {renderSidePanelContent()}
                  </div>
                </div>
              )}
              
              {/* 普通页面 */}
              {!['settings', 'system-settings', 'devices', 'other-settings', 'printer-settings', 'scale-settings', 'label-settings', 'ad-settings', 'reports', 'orders'].includes(currentView) && (
                <div className="bg-white rounded-lg shadow p-4">
                  {renderSidePanelContent()}
                </div>
              )}
              </div>
            </div>
            )}
          </div>
        )}

        {/* 收银界面 */}
        {currentView === 'cashier' && (
          <>
            {/* 左侧商品选择区 */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#f5f7fa]">
              {/* 搜索栏 */}
              <div className="bg-white border-b p-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      ref={searchInputRef}
                      placeholder="扫描条码 / 商品名称 / 拼音首字母"
                      className="pl-9 h-10 bg-gray-50 border-gray-200"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        onClick={() => setSearchTerm('')}
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="h-10 text-gray-600">
                    取消
                  </Button>
                  <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded" 
                      checked={showOnlyNonStandard}
                      onChange={(e) => setShowOnlyNonStandard(e.target.checked)}
                    />
                    仅看非标品
                  </label>
                </div>
                
                {/* 分类标签 */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const count = category.id === 'all' ? productsByCategory.all.length :
                                  category.id === 'hot' ? productsByCategory.all.filter(p => p.isHot).length :
                                  category.id === 'standard' ? productsByCategory.all.filter(p => p.type === 'standard').length :
                                  category.id === 'weighted' ? productsByCategory.all.filter(p => p.type === 'weighted').length :
                                  category.id === 'counted' ? productsByCategory.all.filter(p => p.type === 'counted').length :
                                  productsByCategory.all.filter(p => p.category === category.id).length;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm whitespace-nowrap transition-all",
                          activeCategory === category.id
                            ? "text-red-500 font-medium"
                            : "text-gray-600 hover:text-gray-800"
                        )}
                      >
                        {typeof Icon === 'string' ? (
                          <span>{Icon}</span>
                        ) : (
                          <Icon className="h-3.5 w-3.5" />
                        )}
                        {category.name}
                        <span className="text-xs text-gray-400">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 商品网格 */}
              <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                  {getCurrentProducts().map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className={cn(
                        "bg-white rounded-lg p-3 text-left transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] border",
                        product.isWeighted ? "border-orange-200" :
                        product.isCounted ? "border-blue-200" :
                        "border-gray-100"
                      )}
                    >
                      {/* 标签 */}
                      <div className="flex gap-1 mb-2">
                        {product.isHot && (
                          <span className="px-1 py-0.5 bg-red-500 text-white text-[10px] rounded">热</span>
                        )}
                        {product.isNew && (
                          <span className="px-1 py-0.5 bg-green-500 text-white text-[10px] rounded">新</span>
                        )}
                        {product.isWeighted && (
                          <span className="px-1 py-0.5 bg-orange-100 text-orange-600 text-[10px] rounded">称重</span>
                        )}
                        {product.isCounted && (
                          <span className="px-1 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded">计件</span>
                        )}
                      </div>
                      
                      {/* 图标/图片 */}
                      <div className="flex items-center justify-center h-16 mb-2">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="h-14 w-14 object-cover rounded-lg shadow-sm"
                            onError={(e) => {
                              // 图片加载失败时显示图标
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                              }
                            }}
                          />
                        ) : null}
                        <span className={`text-4xl ${product.imageUrl ? 'hidden' : ''}`}>{product.icon}</span>
                      </div>
                      
                      {/* 名称和价格 */}
                      <p className="text-xs font-medium text-gray-800 truncate mb-1">{product.name}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-red-500">¥{product.price.toFixed(2)}</span>
                        {product.originalPrice && (
                          <span className="text-[10px] text-gray-400 line-through">¥{product.originalPrice.toFixed(2)}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 底部快捷操作 */}
              <div className="bg-white border-t p-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-9 text-xs text-gray-600">
                    上一单
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 text-xs text-gray-600">
                    待收款
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 text-xs text-gray-600">
                    开钱箱
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    切换热销品
                    <Switch checked={activeCategory === 'hot'} onCheckedChange={(checked) => setActiveCategory(checked ? 'hot' : 'all')} />
                  </label>
                  <Button variant="outline" size="sm" className="h-9 text-xs text-gray-600">
                    快速收银
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 text-xs text-gray-600" onClick={() => suspendOrder()}>
                    <ShoppingBag className="h-4 w-4 mr-1" />
                    挂单
                  </Button>
                  {suspendedOrders.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
                      onClick={() => setShowSuspendedOrders(true)}
                    >
                      <ShoppingBag className="h-4 w-4 mr-1" />
                      取单
                      <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-orange-500 text-white text-xs">
                        {suspendedOrders.length}
                      </Badge>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧购物车/结算区 */}
            <div className="w-[340px] bg-white border-l flex flex-col shrink-0">
              {/* 称重数据显示区 */}
              <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-3 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    <span className="text-sm font-medium">称重数据</span>
                  </div>
                  <Badge variant="secondary" className={`text-xs ${scaleConnected ? 'bg-green-400' : 'bg-gray-400'}`}>
                    {scaleConnected ? '已连接' : '未连接'}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/20 rounded-lg p-2">
                    <p className="text-xs text-green-100">重量</p>
                    <p className="text-lg font-bold">{currentWeight.toFixed(2)}</p>
                    <p className="text-xs text-green-100">{weightUnit}</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-2">
                    <p className="text-xs text-green-100">单价</p>
                    <p className="text-lg font-bold">
                      {weightInfo?.price ? `¥${weightInfo.price.toFixed(2)}` : '¥0.00'}
                    </p>
                    <p className="text-xs text-green-100">/500g</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-2">
                    <p className="text-xs text-green-100">小计</p>
                    <p className="text-lg font-bold">
                      ¥{weightInfo?.subtotal ? weightInfo.subtotal.toFixed(2) : '0.00'}
                    </p>
                    <p className="text-xs text-green-100">元</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="secondary"
                  className="w-full mt-2 h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => {
                    // 连接电子秤
                    setScaleConnected(!scaleConnected);
                    if (!scaleConnected) {
                      setCurrentWeight(Math.random() * 2 + 0.5); // 模拟数据
                    } else {
                      setCurrentWeight(0);
                    }
                  }}
                >
                  {scaleConnected ? '断开电子秤' : '连接电子秤'}
                </Button>
              </div>
              
              {/* 金额显示区 - 深色背景 */}
              <div className="bg-[#3a3f47] text-white p-4 shrink-0">
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold">¥{getFinalAmount().toFixed(2)}</p>
                  <p className="text-sm text-gray-300 mt-1">共 {getTotalQuantity()} 件</p>
                </div>
                
                {/* 改价调整显示 */}
                {priceAdjustment !== 0 && (
                  <div className="bg-blue-500/20 rounded-lg p-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-blue-300">
                        <Calculator className="h-4 w-4" />
                        整单改价
                      </span>
                      <span className="text-blue-300 font-medium">
                        {priceAdjustment > 0 ? '+' : ''}¥{priceAdjustment.toFixed(2)}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-blue-200 hover:text-white mt-1 h-6 px-2"
                      onClick={() => {
                        setPriceAdjustment(0);
                        setIsManualPrice(false);
                      }}
                    >
                      取消改价
                    </Button>
                  </div>
                )}
                
                {/* 促销折扣显示 */}
                {getPromotionDiscount() > 0 && (
                  <div className="bg-orange-500/20 rounded-lg p-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-orange-300">
                        <Gift className="h-4 w-4" />
                        促销优惠
                      </span>
                      <span className="text-orange-300 font-medium">-¥{getPromotionDiscount().toFixed(2)}</span>
                    </div>
                    {getActivePromotions().map(p => (
                      <p key={p.id} className="text-xs text-orange-200/70 mt-1">
                        {p.name}: {p.type === 'fullreduce' ? `满${p.fullAmount}减${p.reduceAmount}` : ''}
                      </p>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 h-8 text-xs bg-transparent border-gray-500 text-white hover:bg-white/10"
                    onClick={() => {
                      setOrderPriceInput(getSubtotal().toFixed(2));
                      setOrderPriceReason('');
                      setShowOrderPriceDialog(true);
                    }}
                  >
                    整单改价
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className={`flex-1 h-8 text-xs bg-transparent border-gray-500 text-white hover:bg-white/10 ${isFractionRemoved ? 'border-green-400 text-green-300' : ''}`}
                    onClick={() => setIsFractionRemoved(!isFractionRemoved)}
                  >
                    {isFractionRemoved ? `取消抹分 (-¥${getRemovedFraction().toFixed(2)})` : `抹分 (抹¥${getRemovedFraction().toFixed(2)})`}
                  </Button>
                </div>
              </div>

              {/* 会员区 */}
              <div className="p-3 border-b shrink-0">
                {member ? (
                  <div className="flex items-center justify-between bg-purple-50 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-gray-500">积分 {member.points}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setMember(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full h-10 justify-between text-gray-600"
                    onClick={identifyMember}
                  >
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      会员登录/新增
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* 优惠券核销入口 */}
              <div className="p-3 border-b shrink-0">
                <Button 
                  variant="outline" 
                  className="w-full h-10 justify-between text-orange-600 border-orange-200 hover:bg-orange-50"
                  onClick={() => setShowCouponVerifyDialog(true)}
                >
                  <span className="flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    优惠券核销
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* 商品列表 */}
              <div className="flex-1 overflow-auto min-h-0">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Scale className="h-16 w-16 mb-3 text-gray-200" />
                    <p className="text-base">开始称重结账吧</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate text-xs">{item.name}</p>
                          <p className="text-xs text-gray-400">¥{item.price.toFixed(2)}/{item.unit}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            className="w-6 h-6 rounded bg-white border flex items-center justify-center hover:bg-gray-100"
                            onClick={() => updateQuantity(item.id, item.isWeighted ? -0.1 : -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-10 text-center text-xs font-medium">
                            {item.isWeighted ? item.quantity.toFixed(2) : item.quantity}
                          </span>
                          <button
                            className="w-6 h-6 rounded bg-white border flex items-center justify-center hover:bg-gray-100"
                            onClick={() => updateQuantity(item.id, item.isWeighted ? 0.1 : 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            className="w-6 h-6 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 ml-1"
                            onClick={() => removeItem(item.id)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 底部结算按钮 */}
              <div className="p-3 border-t bg-white shrink-0">
                <Button 
                  className="w-full h-14 bg-red-500 hover:bg-red-600 text-white text-lg font-medium"
                  disabled={cartItems.length === 0}
                  onClick={handleCheckout}
                >
                  结账
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 结算弹窗 */}
      <Dialog open={showPayment} onOpenChange={(open) => {
        setShowPayment(open);
        if (!open) {
          setPaymentTab('scan');
          setCashReceived('');
          setShowCashKeyboard(false);
          setSelectedPayment(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          {/* 顶部深蓝色区域 */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">请选择结账方式</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-blue-600 h-8 w-8"
                onClick={() => setShowPayment(false)}
              >
                ✕
              </Button>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">¥{getFinalAmount().toFixed(2)}</div>
              <div className="text-blue-100 text-sm flex items-center justify-center gap-2">
                <span>(共{cartItems.reduce((sum, item) => sum + item.quantity, 0)}件)</span>
                <span>优惠合计:¥{getDiscount().toFixed(2)}</span>
                <button className="underline hover:text-white">查看</button>
              </div>
            </div>
          </div>

          {/* 支付方式选项卡 */}
          <div className="grid border-b bg-gray-50" style={{ gridTemplateColumns: `repeat(${Math.min(paymentConfigs.length || 4, 4)}, 1fr)` }}>
            {paymentConfigs.length > 0 ? (
              paymentConfigs.map((config) => {
                const IconComponent = config.icon === 'QrCode' ? QrCode : 
                                     config.icon === 'Banknote' ? Banknote : 
                                     config.icon === 'FileText' ? FileText : MoreHorizontal;
                return (
                  <button
                    key={config.id}
                    className={`py-3 px-2 text-center transition-colors ${
                      paymentTab === config.id 
                        ? 'bg-white border-b-2 border-blue-500' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setPaymentTab(config.id as any)}
                  >
                    <IconComponent className={`h-6 w-6 mx-auto mb-1 ${paymentTab === config.id ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className={`text-xs ${paymentTab === config.id ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                      {config.name}
                    </span>
                  </button>
                );
              })
            ) : (
              // 默认支付方式（后台配置加载前或失败时使用）
              [
                { id: 'scan', name: '扫码支付', icon: QrCode },
                { id: 'cash', name: '现金支付', icon: Banknote },
                { id: 'record', name: '收款记账', icon: FileText },
                { id: 'other', name: '其他支付', icon: MoreHorizontal },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`py-3 px-2 text-center transition-colors ${
                    paymentTab === tab.id 
                      ? 'bg-white border-b-2 border-blue-500' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setPaymentTab(tab.id as any)}
                >
                  <tab.icon className={`h-6 w-6 mx-auto mb-1 ${paymentTab === tab.id ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className={`text-xs ${paymentTab === tab.id ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                    {tab.name}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* 支付内容区域 */}
          <div className="p-4 min-h-[300px]">
            {/* 根据后台配置动态渲染支付方式 */}
            {paymentConfigs.length > 0 ? (
              paymentConfigs.map((config) => {
                if (paymentTab !== config.id) return null;
                
                // 扫码支付 - 特殊处理
                if (config.id === 'scan') {
                  const scanMethods = config.subMethods.filter(s => s.enabled);
                  return (
                    <div key={config.id} className="space-y-4">
                      {/* 资金归集提示 */}
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-center">
                        <p className="text-xs text-purple-700">
                          扫码支付收款将直接进入总部账户
                        </p>
                      </div>
                      {scanMethods.length > 0 ? (
                        <div className="grid grid-cols-3 gap-4">
                          {scanMethods.map((method) => (
                            <div key={method.id} className="text-center">
                              <div className="w-16 h-16 mx-auto rounded-lg bg-blue-500 flex items-center justify-center text-2xl text-white mb-2">
                                {method.icon}
                              </div>
                              <p className="text-sm font-medium mb-2">{method.name}</p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={() => {
                                  setSelectedPayment(method.id);
                                  confirmPayment();
                                }}
                              >
                                点我结账
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <div className="w-32 h-32 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                            <svg className="w-20 h-20 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                          </div>
                          <p className="text-gray-800 font-medium mb-2">请扫描顾客付款码</p>
                          <p className="text-gray-500 text-sm mb-6">支持微信支付、京东支付、云闪付等</p>
                          <Button 
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 text-lg"
                            onClick={() => {
                              setSelectedPayment('scan');
                              confirmPayment();
                            }}
                          >
                            扫码结账
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                }
                
                // 现金支付 - 保持原有逻辑
                if (config.id === 'cash') {
                  return (
                    <div key={config.id} className="space-y-4">
                      {/* 现金收款提示 */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                        <p className="text-xs text-green-700">
                          现金收款将留在店铺账户，不归集到总部
                        </p>
                      </div>
                      <div className="flex justify-between items-center text-lg px-2">
                        <div>
                          <span className="text-gray-600">实收: </span>
                          <span className="font-bold text-xl">{cashReceived || '0.00'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">找零: </span>
                          <span className="font-bold text-xl text-green-600">
                            {cashReceived ? Math.max(0, parseFloat(cashReceived) - getFinalAmount()).toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2">
                        {[10, 20, 50, 100].map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            className="h-12 text-red-500 font-bold hover:bg-red-50"
                            onClick={() => setCashReceived(amount.toString())}
                          >
                            ¥{amount}
                          </Button>
                        ))}
                        {['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0'].map((key) => (
                          <Button
                            key={key}
                            variant="outline"
                            className="h-12 text-lg font-medium"
                            onClick={() => {
                              if (key === '.') {
                                if (!cashReceived.includes('.')) {
                                  setCashReceived(prev => prev + '.');
                                }
                              } else {
                                setCashReceived(prev => prev + key);
                              }
                            }}
                          >
                            {key}
                          </Button>
                        ))}
                        <Button variant="outline" className="h-12" onClick={() => setCashReceived(prev => prev.slice(0, -1))}>✕</Button>
                        <Button variant="outline" className="h-12" onClick={() => setCashReceived('')}>清空</Button>
                        <Button variant="outline" className="h-12" onClick={() => setShowPayment(false)}>取消</Button>
                        <Button
                          className="h-12 bg-orange-500 hover:bg-orange-600 col-span-1"
                          disabled={!cashReceived || parseFloat(cashReceived) < getFinalAmount()}
                          onClick={() => {
                            setSelectedPayment('cash');
                            confirmPayment();
                          }}
                        >
                          确定
                        </Button>
                      </div>
                    </div>
                  );
                }
                
                // 其他支付方式 - 动态渲染子支付方式
                const enabledSubMethods = config.subMethods.filter(s => s.enabled);
                const colors = ['bg-red-500', 'bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'];
                
                return (
                  <div key={config.id} className="space-y-4">
                    {config.id === 'record' && (
                      <div className="text-center text-gray-600 mb-4">
                        <p className="font-medium">请选择收款记账方式:</p>
                        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                          个人转账码指微信或支付宝的个人收款码；<br/>
                          聚合固定码指掌柜宝或哆啦宝的收款二维码；<br/>
                          请确认顾客付款成功再让其离开
                        </p>
                      </div>
                    )}
                    
                    {enabledSubMethods.length > 0 ? (
                      <div className="grid grid-cols-3 gap-4">
                        {enabledSubMethods.map((method, idx) => (
                          <div key={method.id} className="text-center">
                            <div className={`w-16 h-16 mx-auto rounded-lg ${colors[idx % colors.length]} flex items-center justify-center text-2xl text-white mb-2`}>
                              {method.icon}
                            </div>
                            <p className="text-sm font-medium mb-2">{method.name}</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => {
                                setSelectedPayment(method.id);
                                confirmPayment();
                              }}
                            >
                              点我结账
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        暂无可用支付方式
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // 默认支付内容（后台配置加载前或失败时使用）
              <>
                {/* 扫码支付 */}
                {paymentTab === 'scan' && (
                  <div className="text-center py-6">
                    <div className="w-32 h-32 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                      <svg className="w-20 h-20 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <p className="text-gray-800 font-medium mb-2">请扫描顾客付款码</p>
                    <p className="text-gray-500 text-sm mb-6">支持微信支付、京东支付、云闪付等</p>
                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 text-lg"
                      onClick={() => {
                        setSelectedPayment('scan');
                        confirmPayment();
                      }}
                    >
                      扫码结账
                    </Button>
                  </div>
                )}

                {/* 现金支付 */}
                {paymentTab === 'cash' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-lg px-2">
                      <div>
                        <span className="text-gray-600">实收: </span>
                        <span className="font-bold text-xl">{cashReceived || '0.00'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">找零: </span>
                        <span className="font-bold text-xl text-green-600">
                          {cashReceived ? Math.max(0, parseFloat(cashReceived) - getFinalAmount()).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                      {[10, 20, 50, 100].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          className="h-12 text-red-500 font-bold hover:bg-red-50"
                          onClick={() => setCashReceived(amount.toString())}
                        >
                          ¥{amount}
                        </Button>
                      ))}
                      {['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0'].map((key) => (
                        <Button
                          key={key}
                          variant="outline"
                          className="h-12 text-lg font-medium"
                          onClick={() => {
                            if (key === '.') {
                              if (!cashReceived.includes('.')) {
                                setCashReceived(prev => prev + '.');
                              }
                            } else {
                              setCashReceived(prev => prev + key);
                            }
                          }}
                        >
                          {key}
                        </Button>
                      ))}
                      <Button variant="outline" className="h-12" onClick={() => setCashReceived(prev => prev.slice(0, -1))}>✕</Button>
                      <Button variant="outline" className="h-12" onClick={() => setCashReceived('')}>清空</Button>
                      <Button variant="outline" className="h-12" onClick={() => setShowPayment(false)}>取消</Button>
                      <Button
                        className="h-12 bg-orange-500 hover:bg-orange-600 col-span-1"
                        disabled={!cashReceived || parseFloat(cashReceived) < getFinalAmount()}
                        onClick={() => {
                          setSelectedPayment('cash');
                          confirmPayment();
                        }}
                      >
                        确定
                      </Button>
                    </div>
                  </div>
                )}

                {/* 收款记账 */}
                {paymentTab === 'record' && (
                  <div className="space-y-4">
                    <div className="text-center text-gray-600 mb-4">
                      <p className="font-medium">请选择收款记账方式:</p>
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                        个人转账码指微信或支付宝的个人收款码；<br/>
                        聚合固定码指掌柜宝或哆啦宝的收款二维码；<br/>
                        请确认顾客付款成功再让其离开
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'personal', name: '个人转账码', icon: '💸', color: 'bg-red-500' },
                        { id: 'aggregate', name: '聚合固定码', icon: '📱', color: 'bg-orange-500' },
                        { id: 'other_record', name: '其他支付', icon: '💰', color: 'bg-blue-500' },
                      ].map((item) => (
                        <div key={item.id} className="text-center">
                          <div className={`w-16 h-16 mx-auto rounded-lg ${item.color} flex items-center justify-center text-2xl text-white mb-2`}>
                            {item.icon}
                          </div>
                          <p className="text-sm font-medium mb-2">{item.name}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                              setSelectedPayment(item.id);
                              confirmPayment();
                            }}
                          >
                            点我结账
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 其他支付 */}
                {paymentTab === 'other' && (
                  <div className="grid grid-cols-3 gap-4 py-4">
                    {[
                      { id: 'qrcode', name: '二维码支付', icon: '🔲', color: 'bg-red-500' },
                      { id: 'member_balance', name: '会员余额支付', icon: '✅', color: 'bg-orange-500' },
                      { id: 'combined', name: '组合支付', icon: '➕', color: 'bg-blue-500' },
                    ].map((item) => (
                      <div key={item.id} className="text-center">
                        <div className={`w-16 h-16 mx-auto rounded-lg ${item.color} flex items-center justify-center text-2xl text-white mb-2`}>
                          {item.icon}
                        </div>
                        <p className="text-sm font-medium mb-2">{item.name}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            setSelectedPayment(item.id);
                            confirmPayment();
                          }}
                        >
                          点我结账
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI识别弹窗 */}
      <Dialog open={showAIRecognize} onOpenChange={closeAIRecognize}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-purple-500" />
              AI智能识别商品
            </DialogTitle>
            <DialogDescription>
              将商品放在摄像头前，系统将自动识别商品类型
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
              {!isStreaming ? (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-2 text-slate-500" />
                    <p className="text-sm text-slate-400">点击下方按钮启动摄像头</p>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/90 hover:bg-white"
                  onClick={stopCamera}
                >
                  关闭摄像头
                </Button>
              </div>
            </div>

            {aiLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-muted-foreground">正在识别...</span>
              </div>
            ) : recognizedProducts.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">识别结果 ({recognizedProducts.length})</h4>
                  <Button variant="ghost" size="sm" onClick={() => setRecognizedProducts([])}>
                    清空结果
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {recognizedProducts.map((product, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded-lg border bg-white hover:border-purple-300 cursor-pointer transition-all"
                      onClick={() => addRecognizedProductToCart(product)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium truncate">{product.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{product.category}</span>
                        <span className="font-medium text-green-600">
                          ¥{product.price?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full mt-2 bg-purple-500 hover:bg-purple-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          addRecognizedProductToCart(product);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        加入购物车
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                <p>点击下方按钮开始识别商品</p>
                <Button 
                  className="mt-4 bg-purple-500 hover:bg-purple-600"
                  onClick={() => {
                    startCamera();
                    // 模拟识别结果
                    setTimeout(() => {
                      setRecognizedProducts([
                        { name: '苹果', price: 8.0, category: '水果', confidence: 0.95 },
                        { name: '香蕉', price: 6.0, category: '水果', confidence: 0.88 },
                      ]);
                      setAiLoading(false);
                    }, 1500);
                    setAiLoading(true);
                  }}
                  disabled={!isStreaming}
                >
                  开始识别
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAIRecognize}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 离线警告弹窗 */}
      <Dialog open={showOfflineWarning} onOpenChange={setShowOfflineWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <WifiOff className="h-5 w-5 text-orange-600" />
              </div>
              离线模式提醒
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              当前网络不可用，系统将使用离线模式运行。
            </p>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">可以继续收银</p>
                  <p className="text-sm text-muted-foreground">使用本地缓存的商品数据</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">订单自动保存</p>
                  <p className="text-sm text-muted-foreground">网络恢复后自动同步到服务器</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium">部分功能受限</p>
                  <p className="text-sm text-muted-foreground">会员查询、实时库存更新等需要网络</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm bg-orange-50 p-3 rounded-lg">
              <span className="text-orange-700">本地商品缓存：</span>
              <span className="font-bold text-orange-600">{offlineProducts.length} 种商品可用</span>
            </div>
            {/* 商品图片预览 */}
            {newProductForm.imageUrl && (
              <div className="space-y-2">
                <label className="text-sm font-medium">商品图片</label>
                <div className="flex items-center gap-3">
                  <img 
                    src={newProductForm.imageUrl} 
                    alt={newProductForm.name || '商品图片'}
                    className="w-20 h-20 object-cover rounded-lg border"
                    onError={(e) => {
                      // 图片加载失败时隐藏
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="text-xs text-gray-500">AI识别获取</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={() => setShowOfflineWarning(false)}
            >
              知道了，继续使用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 注册会员弹窗 */}
      <Dialog open={showMemberDialog} onOpenChange={(open) => {
        setShowMemberDialog(open);
        if (!open) {
          // 关闭时清理状态
          setMemberRegisterMode('manual');
          setMemberRegisterQrCode('');
          setMemberRegisterSessionId('');
          setIsPollingRegister(false);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-purple-500" />
              注册新会员
            </DialogTitle>
            <DialogDescription>
              选择注册方式完成会员注册
            </DialogDescription>
          </DialogHeader>

          <Tabs value={memberRegisterMode} onValueChange={(v) => setMemberRegisterMode(v as 'manual' | 'qrcode')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">手动录入</TabsTrigger>
              <TabsTrigger value="qrcode">扫码注册</TabsTrigger>
            </TabsList>

            {/* 手动录入模式 */}
            <TabsContent value="manual" className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">手机号 *</label>
                <Input
                  placeholder="请输入手机号"
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">姓名</label>
                <Input
                  placeholder="请输入姓名"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">生日</label>
                <Input
                  type="date"
                  value={memberForm.birthday}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, birthday: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">性别</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={memberForm.gender === 'male'}
                      onChange={() => setMemberForm(prev => ({ ...prev, gender: 'male' }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">男</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={memberForm.gender === 'female'}
                      onChange={() => setMemberForm(prev => ({ ...prev, gender: 'female' }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">女</span>
                  </label>
                </div>
              </div>
            </TabsContent>

            {/* 二维码扫码模式 */}
            <TabsContent value="qrcode" className="py-4">
              <div className="flex flex-col items-center space-y-4">
                {memberRegisterQrCode ? (
                  <>
                    <div className="p-4 bg-white rounded-xl shadow-lg border">
                      <QRCodeSVG
                        value={memberRegisterQrCode}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        请客户使用微信扫描二维码自助填写信息
                      </p>
                      <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                        {isPollingRegister && (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>等待客户扫码填写...</span>
                          </>
                        )}
                        {!isPollingRegister && (
                          <span>点击"生成二维码"开始</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          // 发送到客显屏
                          if (typeof window !== 'undefined') {
                            const event = new CustomEvent('showMemberRegisterQrCode', {
                              detail: { qrCodeUrl: memberRegisterQrCode }
                            });
                            window.dispatchEvent(event);
                          }
                        }}
                      >
                        <Monitor className="h-4 w-4 mr-2" />
                        显示到客显屏
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={async () => {
                          // 生成新的注册会话
                          const sessionId = `REG${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
                          setMemberRegisterSessionId(sessionId);

                          // 获取当前域名
                          const domain = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
                          const registerUrl = `${domain}/member/register?session=${sessionId}`;
                          setMemberRegisterQrCode(registerUrl);
                          setIsPollingRegister(true);

                          // 开始轮询检查注册状态
                          if (pollingRef.current) {
                            clearInterval(pollingRef.current);
                          }

                          pollingRef.current = setInterval(async () => {
                            try {
                              const response = await fetch(`/api/member/register-session?session=${sessionId}`);
                              if (response.ok) {
                                const data = await response.json();
                                if (data.status === 'completed' && data.member) {
                                  // 注册完成
                                  clearInterval(pollingRef.current!);
                                  pollingRef.current = null;
                                  setIsPollingRegister(false);

                                  // 添加新会员
                                  const newMember = {
                                    id: data.member.id || `M${String(memberList.length + 1).padStart(3, '0')}`,
                                    phone: data.member.phone,
                                    name: data.member.name || '新会员',
                                    level: '普通',
                                    points: 0,
                                    registerDate: new Date().toISOString().split('T')[0],
                                  };
                                  setMemberList(prev => [newMember, ...prev]);
                                  setShowMemberDialog(false);
                                  alert(`会员注册成功！\n\n会员号：${newMember.id}\n手机号：${newMember.phone}\n姓名：${newMember.name}`);
                                }
                              }
                            } catch (error) {
                              console.error('轮询注册状态失败:', error);
                            }
                          }, 2000);

                          // 5分钟后自动停止轮询
                          setTimeout(() => {
                            if (pollingRef.current) {
                              clearInterval(pollingRef.current);
                              pollingRef.current = null;
                              setIsPollingRegister(false);
                            }
                          }, 5 * 60 * 1000);
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        刷新二维码
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      生成二维码让客户扫码自助注册
                    </p>
                    <Button
                      onClick={async () => {
                        // 生成注册会话ID
                        const sessionId = `REG${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
                        setMemberRegisterSessionId(sessionId);

                        // 获取当前域名
                        const domain = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
                        const registerUrl = `${domain}/member/register?session=${sessionId}`;
                        setMemberRegisterQrCode(registerUrl);
                        setIsPollingRegister(true);

                        // 开始轮询检查注册状态
                        if (pollingRef.current) {
                          clearInterval(pollingRef.current);
                        }

                        pollingRef.current = setInterval(async () => {
                          try {
                            const response = await fetch(`/api/member/register-session?session=${sessionId}`);
                            if (response.ok) {
                              const data = await response.json();
                              if (data.status === 'completed' && data.member) {
                                // 注册完成
                                clearInterval(pollingRef.current!);
                                pollingRef.current = null;
                                setIsPollingRegister(false);

                                // 添加新会员
                                const newMember = {
                                  id: data.member.id || `M${String(memberList.length + 1).padStart(3, '0')}`,
                                  phone: data.member.phone,
                                  name: data.member.name || '新会员',
                                  level: '普通',
                                  points: 0,
                                  registerDate: new Date().toISOString().split('T')[0],
                                };
                                setMemberList(prev => [newMember, ...prev]);
                                setShowMemberDialog(false);
                                alert(`会员注册成功！\n\n会员号：${newMember.id}\n手机号：${newMember.phone}\n姓名：${newMember.name}`);
                              }
                            }
                          } catch (error) {
                            console.error('轮询注册状态失败:', error);
                          }
                        }, 2000);

                        // 5分钟后自动停止轮询
                        setTimeout(() => {
                          if (pollingRef.current) {
                            clearInterval(pollingRef.current);
                            pollingRef.current = null;
                            setIsPollingRegister(false);
                          }
                        }, 5 * 60 * 1000);
                      }}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      生成二维码
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            {memberRegisterMode === 'manual' && (
              <>
                <Button variant="outline" onClick={() => setShowMemberDialog(false)}>
                  取消
                </Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => {
                    if (!memberForm.phone) {
                      alert('请输入手机号');
                      return;
                    }
                    if (!/^1[3-9]\d{9}$/.test(memberForm.phone)) {
                      alert('请输入正确的手机号');
                      return;
                    }

                    // 创建新会员
                    const newMember = {
                      id: `M${String(memberList.length + 1).padStart(3, '0')}`,
                      phone: memberForm.phone,
                      name: memberForm.name || '新会员',
                      level: '普通',
                      points: 0,
                      registerDate: new Date().toISOString().split('T')[0],
                    };

                    // 添加到会员列表
                    setMemberList(prev => [newMember, ...prev]);

                    // 清空表单并关闭弹窗
                    setMemberForm({ phone: '', name: '', birthday: '', gender: 'male' });
                    setShowMemberDialog(false);

                    // 显示成功提示
                    alert(`会员注册成功！\n\n会员号：${newMember.id}\n手机号：${newMember.phone}\n姓名：${newMember.name}\n\n已自动加入会员列表`);
                  }}
                >
                  确认注册
                </Button>
              </>
            )}
            {memberRegisterMode === 'qrcode' && (
              <Button variant="outline" onClick={() => setShowMemberDialog(false)}>
                关闭
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 会员列表弹窗 */}
      <Dialog open={showMemberListDialog} onOpenChange={setShowMemberListDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              会员列表
            </DialogTitle>
            <DialogDescription>
              共 {memberList.length} 位会员
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {memberList.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.phone}</p>
                  <p className="text-xs text-gray-400">会员号: {m.id} | 注册: {m.registerDate}</p>
                </div>
                <div className="text-right">
                  <Badge variant={m.level === '金卡' || m.level === '钻石' ? 'default' : 'outline'} className="text-xs">
                    {m.level}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">{m.points} 积分</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMemberListDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 会员登录弹窗 */}
      <Dialog open={showMemberLoginDialog} onOpenChange={setShowMemberLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-500" />
              会员登录
            </DialogTitle>
            <DialogDescription>
              输入手机号后4位或会员号搜索会员
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="输入手机号后4位或会员号..." 
                className="pl-9" 
                value={memberLoginSearch}
                onChange={(e) => handleMemberLoginSearch(e.target.value)}
                autoFocus
              />
            </div>
            
            {/* 搜索结果 */}
            {memberLoginSearch.length >= 4 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {memberSearchResults.length > 0 ? (
                  memberSearchResults.map((m) => (
                    <button
                      key={m.id}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      onClick={() => selectMemberToLogin(m)}
                    >
                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.phone}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={m.level === '金卡' || m.level === '钻石' ? 'default' : 'outline'} className="text-xs">
                          {m.level}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{m.points} 积分</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-4">
                    未找到匹配的会员
                  </div>
                )}
              </div>
            )}
            
            {/* 快捷操作 */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowMemberLoginDialog(false);
                  setShowMemberDialog(true);
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                注册新会员
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowMemberLoginDialog(false);
                  setShowMemberListDialog(true);
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                查看列表
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMemberLoginDialog(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 创建促销活动弹窗 */}
      <Dialog open={showPromotionDialog} onOpenChange={setShowPromotionDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-orange-500" />
              创建促销活动
            </DialogTitle>
            <DialogDescription>
              创建促销活动并提报总部审批，审批通过后自动执行
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">活动类型</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'discount', name: '折扣', desc: '打折促销' },
                  { id: 'fullreduce', name: '满减', desc: '满额立减' },
                  { id: 'special', name: '特价', desc: '商品特价' },
                ].map((type) => (
                  <Button
                    key={type.id}
                    variant={promotionForm.type === type.id ? 'default' : 'outline'}
                    className={`h-auto py-2 flex-col ${promotionForm.type === type.id ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                    onClick={() => setPromotionForm(prev => ({ ...prev, type: type.id as any }))}
                  >
                    <span className="text-sm font-medium">{type.name}</span>
                    <span className="text-xs opacity-70">{type.desc}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">活动名称</label>
              <Input 
                placeholder="请输入活动名称，如：五一特惠"
                value={promotionForm.name}
                onChange={(e) => setPromotionForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            {promotionForm.type === 'discount' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">折扣力度</label>
                <div className="flex items-center gap-3">
                  <Input 
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="0.99"
                    value={promotionForm.discount}
                    onChange={(e) => setPromotionForm(prev => ({ ...prev, discount: parseFloat(e.target.value) }))}
                    className="w-24"
                  />
                  <span className="text-sm">折</span>
                  <span className="text-sm text-gray-500">
                    (如0.9表示9折，即{(promotionForm.discount * 10).toFixed(0)}折)
                  </span>
                </div>
              </div>
            )}
            
            {promotionForm.type === 'fullreduce' && (
              <div className="space-y-3">
                <label className="text-sm font-medium">满减规则</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">满额（元）</label>
                    <Input 
                      type="number"
                      value={promotionForm.fullAmount}
                      onChange={(e) => setPromotionForm(prev => ({ ...prev, fullAmount: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">减额（元）</label>
                    <Input 
                      type="number"
                      value={promotionForm.reduceAmount}
                      onChange={(e) => setPromotionForm(prev => ({ ...prev, reduceAmount: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  例：满{promotionForm.fullAmount}减{promotionForm.reduceAmount}，满{promotionForm.fullAmount! * 2}减{promotionForm.reduceAmount! * 2}...
                </p>
              </div>
            )}
            
            {promotionForm.type === 'special' && promotionForm.applyScope === 'all' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">特价金额</label>
                <div className="flex items-center gap-3">
                  <Input 
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={promotionForm.discount || 0}
                    onChange={(e) => setPromotionForm(prev => ({ ...prev, discount: parseFloat(e.target.value) }))}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-500">元（全场商品统一特价）</span>
                </div>
              </div>
            )}
            
            {promotionForm.type === 'special' && promotionForm.applyScope === 'selected' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-600">
                  ⚠️ 特价商品需单独设置价格
                </label>
                <p className="text-xs text-gray-500">
                  请在下方"指定商品"区域选择商品后，为每个商品设置特价金额
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">开始日期</label>
                <Input 
                  type="date"
                  value={promotionForm.startDate}
                  onChange={(e) => setPromotionForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">结束日期</label>
                <Input 
                  type="date"
                  value={promotionForm.endDate}
                  onChange={(e) => setPromotionForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            
            {/* 适用范围选择 */}
            <div className="space-y-3">
              <label className="text-sm font-medium">适用范围</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={promotionForm.applyScope === 'all' ? 'default' : 'outline'}
                  className={`h-auto py-3 flex-col ${promotionForm.applyScope === 'all' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                  onClick={() => setPromotionForm(prev => ({ ...prev, applyScope: 'all', selectedProductIds: [] }))}
                >
                  <span className="text-sm font-medium">全场商品</span>
                  <span className="text-xs opacity-70">所有商品参与活动</span>
                </Button>
                <Button
                  variant={promotionForm.applyScope === 'selected' ? 'default' : 'outline'}
                  className={`h-auto py-3 flex-col ${promotionForm.applyScope === 'selected' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                  onClick={() => setPromotionForm(prev => ({ ...prev, applyScope: 'selected' }))}
                >
                  <span className="text-sm font-medium">指定商品</span>
                  <span className="text-xs opacity-70">选择部分商品参与</span>
                </Button>
              </div>
            </div>
            
            {/* 商品选择区域 */}
            {promotionForm.applyScope === 'selected' && (
              <div className="space-y-3 border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    选择商品 
                    {promotionForm.selectedProductIds.length > 0 && (
                      <span className="text-orange-500 ml-1">({promotionForm.selectedProductIds.length}件已选)</span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-7"
                      onClick={() => {
                        const allIds = productsByCategory.all.map(p => p.id);
                        setPromotionForm(prev => ({ ...prev, selectedProductIds: allIds }));
                      }}
                    >
                      全选
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-7"
                      onClick={() => {
                        setPromotionForm(prev => ({ ...prev, selectedProductIds: [] }));
                      }}
                    >
                      清空
                    </Button>
                  </div>
                </div>
                
                {/* 搜索框 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="搜索商品名称或条码..."
                    className="pl-9"
                    value={promotionProductSearch}
                    onChange={(e) => setPromotionProductSearch(e.target.value)}
                  />
                </div>
                
                {/* 商品列表 - 只有搜索时才显示 */}
                {promotionProductSearch.trim() ? (
                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {productsByCategory.all
                      .filter(p => 
                        p.name.toLowerCase().includes(promotionProductSearch.toLowerCase()) ||
                        p.barcode?.toLowerCase().includes(promotionProductSearch.toLowerCase())
                      )
                      .map((product) => {
                        const isSelected = promotionForm.selectedProductIds.includes(product.id);
                        return (
                          <div
                            key={product.id}
                            onClick={() => {
                              setPromotionForm(prev => ({
                                ...prev,
                                selectedProductIds: isSelected 
                                  ? prev.selectedProductIds.filter(id => id !== product.id)
                                  : [...prev.selectedProductIds, product.id]
                              }));
                            }}
                            className={`p-2 rounded-lg border cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' 
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-lg">
                                {product.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{product.name}</p>
                                <p className="text-xs text-gray-400">¥{product.price.toFixed(2)}</p>
                              </div>
                              {isSelected && (
                                <Check className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    {productsByCategory.all.filter(p => 
                      p.name.toLowerCase().includes(promotionProductSearch.toLowerCase()) ||
                      p.barcode?.toLowerCase().includes(promotionProductSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="col-span-3 text-center py-4 text-gray-400 text-sm">
                        未找到匹配的商品
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm border rounded-lg bg-gray-50">
                    <Search className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    请输入商品名称或条码搜索
                  </div>
                )}
                
                {/* 已选商品预览 */}
                {promotionForm.selectedProductIds.length > 0 && (
                  <div className="bg-white rounded-lg p-2 border">
                    <p className="text-xs text-gray-500 mb-2">
                      已选商品 ({promotionForm.selectedProductIds.length}件)：
                    </p>
                    
                    {/* 特价类型：显示商品列表和价格输入 */}
                    {promotionForm.type === 'special' ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {promotionForm.selectedProductIds.map(id => {
                          const product = productsByCategory.all.find(p => p.id === id);
                          if (!product) return null;
                          const currentPrice = promotionForm.specialPrices[id] || '';
                          return (
                            <div key={id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-lg">
                                {product.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{product.name}</p>
                                <p className="text-xs text-gray-400">原价：¥{product.price.toFixed(2)}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">特价：</span>
                                <Input 
                                  type="number"
                                  step="0.1"
                                  min="0.1"
                                  placeholder="0.00"
                                  value={currentPrice}
                                  onChange={(e) => {
                                    const price = parseFloat(e.target.value);
                                    setPromotionForm(prev => ({
                                      ...prev,
                                      specialPrices: {
                                        ...prev.specialPrices,
                                        [id]: price || 0
                                      }
                                    }));
                                  }}
                                  className="w-20 h-7 text-sm"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  setPromotionForm(prev => {
                                    const newPrices = { ...prev.specialPrices };
                                    delete newPrices[id];
                                    return {
                                      ...prev,
                                      selectedProductIds: prev.selectedProductIds.filter(pid => pid !== id),
                                      specialPrices: newPrices
                                    };
                                  });
                                }}
                                className="text-gray-400 hover:text-red-500 p-1"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* 非特价类型：显示标签 */
                      <div className="flex flex-wrap gap-1">
                        {promotionForm.selectedProductIds.slice(0, 10).map(id => {
                          const product = productsByCategory.all.find(p => p.id === id);
                          return product ? (
                            <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                              {product.name}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPromotionForm(prev => ({
                                    ...prev,
                                    selectedProductIds: prev.selectedProductIds.filter(pid => pid !== id)
                                  }));
                                }}
                                className="hover:text-red-500"
                              >
                                ×
                              </button>
                            </span>
                          ) : null;
                        })}
                        {promotionForm.selectedProductIds.length > 10 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{promotionForm.selectedProductIds.length - 10}件
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* 提报说明 */}
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-sm text-amber-700">
                <strong>提报说明：</strong>
              </p>
              <ul className="text-xs text-amber-600 mt-1 space-y-1">
                <li>• 促销活动创建后需提交总部审批</li>
                <li>• 总部审批通过后，活动将自动生效</li>
                <li>• 如被拒绝，可修改后重新提报</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t pt-3">
            <Button variant="outline" onClick={() => setShowPromotionDialog(false)}>
              取消
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => {
                if (!promotionForm.name) {
                  alert('请输入活动名称');
                  return;
                }
                if (promotionForm.type === 'fullreduce' && (!promotionForm.fullAmount || !promotionForm.reduceAmount)) {
                  alert('请填写完整的满减规则');
                  return;
                }
                if (promotionForm.applyScope === 'selected' && promotionForm.selectedProductIds.length === 0) {
                  alert('请至少选择一个商品');
                  return;
                }
                // 特价商品验证：每个商品都需要设置价格
                if (promotionForm.type === 'special' && promotionForm.applyScope === 'selected') {
                  const missingPrices = promotionForm.selectedProductIds.filter(
                    id => !promotionForm.specialPrices[id] || promotionForm.specialPrices[id] <= 0
                  );
                  if (missingPrices.length > 0) {
                    alert(`还有 ${missingPrices.length} 件商品未设置特价，请为所有已选商品设置特价金额`);
                    return;
                  }
                }
                
                // 创建新促销活动
                const newPromo = {
                  id: `P${Date.now().toString().slice(-6)}`,
                  type: promotionForm.type,
                  name: promotionForm.name,
                  discount: promotionForm.type === 'discount' ? promotionForm.discount : promotionForm.type === 'special' && promotionForm.applyScope === 'all' ? promotionForm.discount : undefined,
                  fullAmount: promotionForm.type === 'fullreduce' ? promotionForm.fullAmount : undefined,
                  reduceAmount: promotionForm.type === 'fullreduce' ? promotionForm.reduceAmount : undefined,
                  startDate: promotionForm.startDate,
                  endDate: promotionForm.endDate,
                  status: 'pending' as const,
                  createTime: new Date().toLocaleString('zh-CN'),
                  applyScope: promotionForm.applyScope,
                  productIds: promotionForm.applyScope === 'selected' ? promotionForm.selectedProductIds : undefined,
                  specialPrices: promotionForm.type === 'special' && promotionForm.applyScope === 'selected' ? promotionForm.specialPrices : undefined,
                  source: 'store' as const,  // 本店创建的促销
                };
                
                setPromotionList(prev => [newPromo, ...prev]);
                
                const typeText = promotionForm.type === 'discount' ? `${(promotionForm.discount * 10).toFixed(0)}折优惠` :
                                promotionForm.type === 'fullreduce' ? `满${promotionForm.fullAmount}减${promotionForm.reduceAmount}` :
                                promotionForm.applyScope === 'all' ? `特价¥${promotionForm.discount}` : `${promotionForm.selectedProductIds.length}件商品特价`;
                const scopeText = promotionForm.applyScope === 'all' ? '全场商品' : `指定${promotionForm.selectedProductIds.length}件商品`;
                
                alert(`促销活动已提交审批！\n\n活动名称：${promotionForm.name}\n活动类型：${typeText}\n适用范围：${scopeText}\n活动时间：${promotionForm.startDate} ~ ${promotionForm.endDate}\n\n请等待总部审批，审批通过后将自动生效。`);
                
                setPromotionForm({
                  type: 'discount',
                  name: '',
                  discount: 0.9,
                  fullAmount: 100,
                  reduceAmount: 10,
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  applyScope: 'all',
                  selectedProductIds: [],
                  specialPrices: {},
                });
                setPromotionProductSearch('');
                setShowPromotionDialog(false);
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              提交审批
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增商品弹窗 */}
      <Dialog open={showProductDialog} onOpenChange={(open) => {
        setShowProductDialog(open);
        if (!open) {
          // 关闭时重置AI识别状态
          setAiRecognizing(false);
          setAiRecognized(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-500" />
              新增商品
            </DialogTitle>
            <DialogDescription>
              填写商品信息，条码已自动填充
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* AI识别状态提示 */}
            {newProductForm.barcode && (
              <div className={`rounded-lg p-3 ${aiRecognized ? 'bg-green-50 border border-green-200' : aiRecognizing ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border'}`}>
                <div className="flex items-center gap-2">
                  {aiRecognizing ? (
                    <>
                      <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                      <span className="text-sm text-blue-700">AI正在识别条码信息...</span>
                    </>
                  ) : aiRecognized ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-700">AI识别成功，已自动填充商品信息</span>
                    </>
                  ) : (
                    <>
                      <Barcode className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">条码: {newProductForm.barcode}</span>
                    </>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">商品名称 *</label>
              <Input 
                placeholder="请输入商品名称"
                value={newProductForm.name}
                onChange={(e) => setNewProductForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">品牌</label>
                <Input 
                  placeholder="如：农夫山泉"
                  value={newProductForm.brand}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, brand: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">规格</label>
                <Input 
                  placeholder="如：550ml"
                  value={newProductForm.specification}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, specification: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">条形码</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="扫码或手动输入"
                  value={newProductForm.barcode}
                  onChange={(e) => {
                    setNewProductForm(prev => ({ ...prev, barcode: e.target.value }));
                    setAiRecognized(false);
                  }}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={async () => {
                    if (!newProductForm.barcode) return;
                    setAiRecognizing(true);
                    setAiRecognized(false);
                    try {
                      const res = await fetch('/api/products/scan-barcode/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ barcode: newProductForm.barcode }),
                      });
                      const data = await res.json();
                      console.log('[POS] Dialog AI recognition result:', data);
                      if (data.success && data.data) {
                        const productData = data.data;
                        // 只有当识别到有效商品名称时才填充
                        if (productData.name && productData.name.length > 0) {
                          // 分类映射：中文 -> 英文选项值
                          const categoryMap: Record<string, string> = {
                            '饮品': 'drinks',
                            '饮料': 'drinks',
                            '零食': 'snacks',
                            '生鲜': 'fresh',
                            '水果': 'fruits',
                            '蔬菜': 'vegetables',
                            '日用品': 'other',
                            '方便食品': 'snacks',
                            '乳制品': 'drinks',
                            '其他': 'other',
                          };
                          const mappedCategory = categoryMap[productData.category] || productData.category;
                          
                          setNewProductForm(prev => ({
                            ...prev,
                            name: productData.name,
                            brand: productData.brand || '',
                            specification: productData.specification || '',
                            price: productData.price ? productData.price.toString() : prev.price,
                            unit: productData.unit || prev.unit,
                            category: mappedCategory,
                            imageUrl: productData.imageUrl || '',
                          }));
                          setAiRecognized(true);
                          console.log('[POS] Dialog form updated with:', {
                            name: productData.name,
                            brand: productData.brand,
                            specification: productData.specification,
                            price: productData.price,
                            unit: productData.unit,
                            category: mappedCategory,
                            imageUrl: productData.imageUrl,
                          });
                        } else {
                          console.log('[POS] No product name found in dialog');
                        }
                      }
                    } catch (err) {
                      console.log('AI recognition failed:', err);
                    } finally {
                      setAiRecognizing(false);
                    }
                  }}
                  disabled={aiRecognizing || !newProductForm.barcode}
                  title="AI识别商品信息"
                >
                  {aiRecognizing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">售价 *</label>
                <Input 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newProductForm.price}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">库存</label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={newProductForm.stock}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, stock: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">分类</label>
                <select 
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  value={newProductForm.category}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="drinks">饮料</option>
                  <option value="snacks">零食</option>
                  <option value="fresh">生鲜</option>
                  <option value="fruits">水果</option>
                  <option value="vegetables">蔬菜</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">单位</label>
                <Input 
                  placeholder="个/瓶/斤"
                  value={newProductForm.unit}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, unit: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>
              取消
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={async () => {
                if (!newProductForm.name || !newProductForm.price) {
                  alert('请填写商品名称和售价');
                  return;
                }
                
                try {
                  // 1. 同步到总部商品库
                  if (newProductForm.barcode) {
                    const syncResponse = await fetch('/api/headquarters/products/', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        barcode: newProductForm.barcode,
                        name: newProductForm.name,
                        category: newProductForm.category,
                        unit: newProductForm.unit,
                        price: parseFloat(newProductForm.price),
                        brand: newProductForm.brand,
                        specification: newProductForm.specification,
                        imageUrl: newProductForm.imageUrl,
                        storeId: 'POS_STORE',
                      }),
                    });
                    
                    const syncResult = await syncResponse.json();
                    if (syncResult.success) {
                      console.log('[POS] Product synced to headquarters:', syncResult.data);
                    }
                  }
                  
                  // 2. 添加到本地商品列表
                  const newProduct: Product = {
                    id: newProductForm.barcode 
                      ? generateStableId(newProductForm.barcode) 
                      : generateStableId(newProductForm.name + Date.now()),
                    barcode: newProductForm.barcode,
                    name: newProductForm.name,
                    price: parseFloat(newProductForm.price),
                    icon: '📦',
                    stock: parseInt(newProductForm.stock) || 0,
                    unit: newProductForm.unit,
                    type: 'standard',
                    hasBarcode: !!newProductForm.barcode,
                    isWeighted: false,
                    isCounted: false,
                    category: newProductForm.category,
                    brand: newProductForm.brand,
                    specification: newProductForm.specification,
                    imageUrl: newProductForm.imageUrl,
                  };
                  
                  // 检查是否已存在相同商品（ID或条码重复）
                  const existingIds = new Set(productsByCategory.all.map(p => p.id));
                  const existingBarcodes = new Set(productsByCategory.all.filter(p => p.barcode).map(p => p.barcode));
                  const isDuplicate = existingIds.has(newProduct.id) || 
                                     (newProduct.barcode && existingBarcodes.has(newProduct.barcode));
                  
                  if (!isDuplicate) {
                    // 更新商品列表
                    productsByCategory.all = [...productsByCategory.all, newProduct];
                  }
                  
                  // 保存到离线存储（追加或更新）
                  const existingProducts = await ProductsStore.getAll();
                  const productExists = existingProducts.some(p => 
                    p.id === newProduct.id || (newProduct.barcode && p.barcode === newProduct.barcode)
                  );
                  let updatedProducts: OfflineProduct[];
                  if (productExists) {
                    // 更新已存在的商品
                    updatedProducts = existingProducts.map(p => 
                      (p.id === newProduct.id || (newProduct.barcode && p.barcode === newProduct.barcode))
                        ? { ...newProduct, updatedAt: Date.now() }
                        : p
                    );
                  } else {
                    // 追加新商品
                    updatedProducts = [...existingProducts, { ...newProduct, updatedAt: Date.now() }];
                  }
                  await ProductsStore.saveAll(updatedProducts);
                  
                  // 3. 自动加入购物车
                  const cartItem: CartItem = {
                    id: newProduct.id,
                    barcode: newProduct.barcode,
                    name: newProduct.name,
                    price: newProduct.price,
                    quantity: 1,
                    unit: newProduct.unit,
                    discount: 0,
                    isWeighted: false,
                    isCounted: false,
                    hasBarcode: newProduct.hasBarcode,
                  };
                  
                  setCartItems(prev => {
                    const existing = prev.find(item => item.barcode === cartItem.barcode);
                    if (existing) {
                      return prev.map(item => 
                        item.barcode === cartItem.barcode 
                          ? { ...item, quantity: item.quantity + 1 }
                          : item
                      );
                    }
                    return [...prev, cartItem];
                  });
                  
                  // 4. 显示成功提示
                  alert(`商品添加成功！\n名称：${newProductForm.name}\n品牌：${newProductForm.brand || '无'}\n规格：${newProductForm.specification || '无'}\n售价：¥${newProductForm.price}\n\n已同步到总部商品库，其他店铺可使用`);
                  
                  // 5. 重置表单并关闭弹窗
                  setNewProductForm({ name: '', barcode: '', brand: '', specification: '', price: '', category: 'snacks', unit: '个', stock: '', imageUrl: '' });
                  setShowProductDialog(false);
                  
                } catch (error) {
                  console.error('[POS] Add product error:', error);
                  alert('商品添加失败，请重试');
                }
              }}
            >
              确认添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 修改价格弹窗 */}
      <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" />
              修改价格
            </DialogTitle>
            <DialogDescription>
              批量修改商品价格
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">搜索商品</label>
              <Input placeholder="输入商品名称或条码" />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 text-center">
                请先搜索选择要修改价格的商品
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriceDialog(false)}>
              取消
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600">
              确认修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 整单改价弹窗 */}
      <Dialog open={showOrderPriceDialog} onOpenChange={setShowOrderPriceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-orange-500" />
              整单改价
            </DialogTitle>
            <DialogDescription>
              修改整单应收金额（支持降价或涨价）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 原价信息 */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">商品原价</span>
                <span className="font-medium">¥{getSubtotal().toFixed(2)}</span>
              </div>
              {getPromotionDiscount() > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">促销优惠</span>
                  <span className="text-orange-500">-¥{getPromotionDiscount().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-700 font-medium">当前应收</span>
                <span className="text-lg font-bold text-blue-600">¥{getSubtotal().toFixed(2)}</span>
              </div>
            </div>

            {/* 新价格输入 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">修改后金额</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={orderPriceInput}
                  onChange={(e) => setOrderPriceInput(e.target.value)}
                  placeholder="输入新金额"
                  className="pl-8 text-lg font-medium"
                />
              </div>
              {orderPriceInput && (
                <div className="flex items-center gap-2 text-sm">
                  {(() => {
                    const newPrice = parseFloat(orderPriceInput) || 0;
                    const currentPrice = getSubtotal();
                    const diff = newPrice - currentPrice;
                    if (diff < 0) {
                      return (
                        <>
                          <Badge className="bg-green-100 text-green-700">
                            降价 ¥{Math.abs(diff).toFixed(2)}
                          </Badge>
                          <span className="text-gray-500">
                            折扣率 {((newPrice / currentPrice) * 100).toFixed(1)}%
                          </span>
                        </>
                      );
                    } else if (diff > 0) {
                      return (
                        <>
                          <Badge className="bg-red-100 text-red-700">
                            涨价 ¥{diff.toFixed(2)}
                          </Badge>
                        </>
                      );
                    }
                    return <span className="text-gray-500">价格未变化</span>;
                  })()}
                </div>
              )}
            </div>

            {/* 改价原因 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">改价原因 <span className="text-gray-400">(可选)</span></label>
              <div className="flex flex-wrap gap-2">
                {['客户议价', '商品瑕疵', '促销活动', '会员优惠', '其他原因'].map((reason) => (
                  <Button
                    key={reason}
                    type="button"
                    variant={orderPriceReason === reason ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOrderPriceReason(reason)}
                    className="text-xs"
                  >
                    {reason}
                  </Button>
                ))}
              </div>
              <Input
                placeholder="或输入其他原因..."
                value={!['客户议价', '商品瑕疵', '促销活动', '会员优惠', '其他原因'].includes(orderPriceReason) ? orderPriceReason : ''}
                onChange={(e) => setOrderPriceReason(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* 快捷改价按钮 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">快捷改价</label>
              <div className="grid grid-cols-4 gap-2">
                {[-5, -3, -2, -1].map((discount) => (
                  <Button
                    key={discount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentPrice = getSubtotal();
                      const newPrice = Math.max(0, currentPrice + discount);
                      setOrderPriceInput(newPrice.toFixed(2));
                    }}
                    className="text-xs"
                  >
                    {discount}元
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['9折', '85折', '8折', '75折'].map((discount) => {
                  const rate = parseFloat(discount) / 10;
                  return (
                    <Button
                      key={discount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentPrice = getSubtotal();
                        const newPrice = currentPrice * rate;
                        setOrderPriceInput(newPrice.toFixed(2));
                      }}
                      className="text-xs"
                    >
                      {discount}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowOrderPriceDialog(false);
                setOrderPriceInput('');
                setOrderPriceReason('');
              }}
            >
              取消
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => {
                const newPrice = parseFloat(orderPriceInput);
                if (isNaN(newPrice) || newPrice < 0) {
                  alert('请输入有效的金额');
                  return;
                }
                const currentPrice = getSubtotal();
                const adjustment = newPrice - currentPrice;
                setPriceAdjustment(adjustment);
                setIsManualPrice(true);
                setShowOrderPriceDialog(false);
                console.log(`[整单改价] 原价: ${currentPrice}, 新价: ${newPrice}, 调整: ${adjustment}, 原因: ${orderPriceReason}`);
              }}
              disabled={!orderPriceInput || parseFloat(orderPriceInput) < 0}
            >
              确认改价
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 打印价签弹窗 */}
      <Dialog open={showLabelDialog} onOpenChange={setShowLabelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5 text-orange-500" />
              打印价签
            </DialogTitle>
            <DialogDescription>
              选择商品打印价签
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">搜索商品</label>
              <Input placeholder="输入商品名称或条码" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">价签模板</label>
              <select className="w-full px-3 py-2 border rounded-lg text-sm">
                <option>标准签 (70×38mm)</option>
                <option>会员签 (60×40mm)</option>
                <option>简洁签 (50×30mm)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">打印数量</label>
              <Input type="number" defaultValue="1" min="1" className="w-24" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLabelDialog(false)}>
              取消
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Printer className="h-4 w-4 mr-2" />
              打印
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 要货申请弹窗 */}
      <Dialog open={showProcurementDialog} onOpenChange={setShowProcurementDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-500" />
              发起要货申请
            </DialogTitle>
            <DialogDescription>
              填写需要补货的商品信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 已选商品列表 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">已选商品 ({procurementItems.length})</label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowProductSelectDialog(true);
                    setProductSelectSearch('');
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加商品
                </Button>
              </div>
              <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {procurementItems.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    暂无商品，点击上方"添加商品"按钮
                  </div>
                ) : (
                  procurementItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">库存: {item.stock}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">申请:</span>
                        <Input 
                          type="number" 
                          value={item.request}
                          onChange={(e) => {
                            const newItems = procurementItems.map(i => 
                              i.id === item.id ? { ...i, request: parseInt(e.target.value) || 0 } : i
                            );
                            setProcurementItems(newItems);
                          }}
                          className="w-20 h-8 text-sm"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:bg-red-50"
                          onClick={() => {
                            setProcurementItems(procurementItems.filter(i => i.id !== item.id));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* 紧急程度 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">紧急程度</label>
              <div className="flex gap-2">
                <Button 
                  variant={procurementUrgency === 'normal' ? 'default' : 'outline'} 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setProcurementUrgency('normal')}
                >
                  普通
                </Button>
                <Button 
                  variant={procurementUrgency === 'urgent' ? 'default' : 'outline'} 
                  size="sm" 
                  className={`flex-1 ${procurementUrgency === 'urgent' ? 'bg-orange-500 hover:bg-orange-600' : 'border-orange-500 text-orange-500'}`}
                  onClick={() => setProcurementUrgency('urgent')}
                >
                  紧急
                </Button>
                <Button 
                  variant={procurementUrgency === 'very-urgent' ? 'default' : 'outline'} 
                  size="sm" 
                  className={`flex-1 ${procurementUrgency === 'very-urgent' ? 'bg-red-500 hover:bg-red-600' : 'border-red-500 text-red-500'}`}
                  onClick={() => setProcurementUrgency('very-urgent')}
                >
                  特急
                </Button>
              </div>
            </div>
            
            {/* 备注 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">备注</label>
              <Input 
                placeholder="填写备注信息（选填）" 
                value={procurementRemark}
                onChange={(e) => setProcurementRemark(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcurementDialog(false)}>
              取消
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => {
                if (procurementItems.length === 0) {
                  alert('请至少添加一个商品');
                  return;
                }
                setShowProcurementDialog(false);
                const urgencyText = procurementUrgency === 'normal' ? '普通' : procurementUrgency === 'urgent' ? '紧急' : '特急';
                alert(`要货申请已提交！\n\n商品数量: ${procurementItems.length}\n紧急程度: ${urgencyText}\n\n等待审批中...`);
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              提交申请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 商品选择弹窗 */}
      <Dialog open={showProductSelectDialog} onOpenChange={setShowProductSelectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              选择商品
            </DialogTitle>
            <DialogDescription>
              选择要添加的商品
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="搜索商品名称或条码..." 
                className="pl-9"
                value={productSelectSearch}
                onChange={(e) => setProductSelectSearch(e.target.value)}
              />
            </div>
            
            {/* 商品列表 */}
            <div className="border rounded-lg max-h-80 overflow-y-auto">
              {productsByCategory.all
                .filter((p: Product) => 
                  !procurementItems.find(i => i.id === p.id) &&
                  (productSelectSearch === '' || 
                   p.name.toLowerCase().includes(productSelectSearch.toLowerCase()) ||
                   (p.barcode && p.barcode.includes(productSelectSearch)))
                )
                .slice(0, 10)
                .map((product: Product) => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      // 添加商品到列表
                      setProcurementItems([
                        ...procurementItems,
                        {
                          id: product.id,
                          name: product.name,
                          stock: product.stock,
                          request: 10, // 默认申请数量
                        }
                      ]);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{product.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">库存: {product.stock} | ¥{product.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <Plus className="h-5 w-5 text-orange-500" />
                  </div>
                ))}
              {productsByCategory.all.filter((p: Product) => 
                !procurementItems.find(i => i.id === p.id) &&
                (productSelectSearch === '' || 
                 p.name.toLowerCase().includes(productSelectSearch.toLowerCase()) ||
                 (p.barcode && p.barcode.includes(productSelectSearch)))
              ).length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {productSelectSearch ? '未找到匹配的商品' : '暂无可添加的商品'}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductSelectDialog(false)}>
              完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 挂单列表弹窗 */}
      <Dialog open={showSuspendedOrders} onOpenChange={setShowSuspendedOrders}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-orange-500" />
              挂单列表
            </DialogTitle>
            <DialogDescription>
              共 {suspendedOrders.length} 个挂单，点击取单可恢复到购物车
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {suspendedOrders.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>暂无挂单</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suspendedOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-800">
                          {order.itemCount} 件商品
                        </p>
                        <p className="text-sm text-gray-500">
                          挂单时间: {formatSuspendTime(order.createdAt)}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-orange-500">
                        ¥{order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    
                    {/* 商品预览 */}
                    <div className="text-xs text-gray-500 mb-3 truncate">
                      {order.items.slice(0, 3).map(i => i.name).join('、')}
                      {order.items.length > 3 && ` 等${order.items.length}件`}
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                        onClick={() => resumeOrder(order)}
                      >
                        取单
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => deleteSuspendedOrder(order.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendedOrders(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 退货弹窗 */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <RotateCcw className="h-5 w-5 text-red-500" />
              退货
            </DialogTitle>
          </DialogHeader>
          
          {/* 订单信息栏 */}
          {refundOrderData && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4 shrink-0">
              <div className="flex justify-between items-start">
                <div className="flex gap-6">
                  <div>
                    <span className="text-gray-500 text-xs">应收</span>
                    <span className="font-bold ml-1">¥{refundOrderData.totalAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">优惠</span>
                    <span className="font-bold ml-1 text-red-500">¥{refundOrderData.discount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">实收</span>
                    <span className="font-bold ml-1 text-green-600">¥{refundOrderData.paidAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>收银员: {refundOrderData.cashier}</p>
                  <p>订单号: {refundOrderData.id}</p>
                  <p>下单时间: {refundOrderData.time}</p>
                  <p>支付方式: {refundOrderData.paymentMethod}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
            {/* 左侧商品列表 */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* 退货金额 */}
              <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={refundItems.every(item => item.selected)}
                    onChange={(e) => {
                      setRefundItems(refundItems.map(item => ({
                        ...item,
                        selected: e.target.checked
                      })));
                    }}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">商品信息</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">退货金额: </span>
                  <span className="text-red-500 font-bold text-lg">
                    ¥{refundItems.filter(i => i.selected).reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* 商品表格 */}
              <div className="flex-1 overflow-auto border rounded-lg">
                {/* 表头 */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 border-b text-xs text-gray-500 sticky top-0">
                  <div className="col-span-1"></div>
                  <div className="col-span-4">商品</div>
                  <div className="col-span-2 text-center">单价</div>
                  <div className="col-span-2 text-center">数量</div>
                  <div className="col-span-3 text-right">实收</div>
                </div>
                
                {/* 商品列表 */}
                {refundItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 px-3 py-3 border-b hover:bg-gray-50 items-center">
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(e) => {
                          const newItems = [...refundItems];
                          newItems[index].selected = e.target.checked;
                          setRefundItems(newItems);
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </div>
                    <div className="col-span-4 flex items-center gap-2">
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-lg shrink-0">
                        {item.image}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">原购买: {item.maxQuantity}件</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm">¥{item.price.toFixed(2)}</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <button
                        className="w-6 h-6 rounded bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center text-sm font-bold"
                        onClick={() => {
                          if (item.quantity > 0) {
                            const newItems = [...refundItems];
                            newItems[index].quantity = item.quantity - 1;
                            if (newItems[index].quantity === 0) {
                              newItems[index].selected = false;
                            }
                            setRefundItems(newItems);
                          }
                        }}
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        className="w-6 h-6 rounded bg-green-100 text-green-500 hover:bg-green-200 flex items-center justify-center text-sm font-bold"
                        onClick={() => {
                          if (item.quantity < item.maxQuantity) {
                            const newItems = [...refundItems];
                            newItems[index].quantity = item.quantity + 1;
                            setRefundItems(newItems);
                          }
                        }}
                      >
                        +
                      </button>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className="text-sm font-medium text-green-600">
                        ¥{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧配置区 */}
            <div className="w-56 shrink-0 space-y-4">
              {/* 退款方式 */}
              <div className="bg-white border rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">退款方式</h4>
                <div className="space-y-2">
                  {[
                    { key: 'original', label: '原路退款' },
                    { key: 'cash', label: '现金退款' },
                    { key: 'wechat', label: '微信转账' },
                    { key: 'alipay', label: '支付宝转账' },
                  ].map((method) => (
                    <label key={method.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="refundMethod"
                        checked={refundMethod === method.key}
                        onChange={() => setRefundMethod(method.key as any)}
                        className="w-4 h-4 text-red-500"
                      />
                      <span className="text-sm">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 退货类型 */}
              <div className="bg-white border rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">退货类型</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="refundType"
                      checked={refundType === 'refund-return'}
                      onChange={() => setRefundType('refund-return')}
                      className="w-4 h-4 text-red-500"
                    />
                    <span className="text-sm">退货退款</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="refundType"
                      checked={refundType === 'refund-only'}
                      onChange={() => setRefundType('refund-only')}
                      className="w-4 h-4 text-red-500"
                    />
                    <span className="text-sm">仅退款</span>
                  </label>
                </div>
              </div>

              {/* 退货原因 */}
              <div className="bg-white border rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">退货原因</h4>
                <div className="space-y-2">
                  {[
                    '顾客不想要了',
                    '商品破损',
                    '商品有质量问题',
                    '无理由退换货',
                    '其他原因',
                  ].map((reason) => (
                    <label key={reason} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="refundReason"
                        checked={refundReason === reason}
                        onChange={() => setRefundReason(reason)}
                        className="w-4 h-4 text-red-500"
                      />
                      <span className="text-sm">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 备注 */}
              <div className="bg-white border rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">备注</h4>
                <textarea
                  className="w-full border rounded p-2 text-sm resize-none"
                  rows={2}
                  placeholder="请输入备注信息..."
                  value={refundRemark}
                  onChange={(e) => setRefundRemark(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 mt-4">
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              取消
            </Button>
            <Button 
              className="bg-red-500 hover:bg-red-600"
              onClick={async () => {
                const selectedItems = refundItems.filter(item => item.selected && item.quantity > 0);
                if (selectedItems.length === 0) {
                  alert('请选择要退货的商品');
                  return;
                }

                const refundAmount = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
                const itemCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
                
                const refundMethodName = refundMethod === 'original' ? '原路退款' :
                                         refundMethod === 'cash' ? '现金退款' :
                                         refundMethod === 'wechat' ? '微信转账' : '支付宝转账';
                
                const refundTypeName = refundType === 'refund-return' ? '退货退款' : '仅退款';

                // 打印退货小票
                try {
                  const receiptData = {
                    shopName: shopConfig.name,
                    shopAddress: shopConfig.address,
                    shopPhone: shopConfig.phone,
                    orderNumber: `TH${Date.now().toString().slice(-10)}`,
                    timestamp: new Date().toLocaleString('zh-CN'),
                    cashier: user?.name,
                    items: selectedItems.map(item => ({
                      name: item.name,
                      price: item.price,
                      quantity: item.quantity,
                      unit: '件',
                      subtotal: item.price * item.quantity,
                    })),
                    subtotal: refundAmount,
                    discount: 0,
                    totalAmount: refundAmount,
                    paymentMethod: refundMethodName,
                    footer: '【退货小票】',
                  };
                  await printReceipt(receiptData);
                } catch (printError) {
                  console.error('打印退货小票失败:', printError);
                }

                // 现金退款时打开钱箱
                if (refundMethod === 'cash') {
                  try {
                    await openCashbox();
                  } catch (error) {
                    console.error('打开钱箱失败:', error);
                  }
                }

                setShowRefundDialog(false);
                alert(`退货成功！\n\n退货类型: ${refundTypeName}\n退款方式: ${refundMethodName}\n退货商品: ${itemCount}件\n退款金额: ¥${refundAmount.toFixed(2)}\n退货原因: ${refundReason}`);
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              确认退款
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 优惠券核销弹窗 */}
      <Dialog open={showCouponVerifyDialog} onOpenChange={setShowCouponVerifyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-orange-500" />
              优惠券核销
            </DialogTitle>
            <DialogDescription>
              输入优惠券核销码或优惠券码进行核销
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">核销码/优惠券码</Label>
              <Input
                id="coupon-code"
                placeholder="请输入核销码或优惠券码"
                value={couponVerifyCode}
                onChange={(e) => setCouponVerifyCode(e.target.value.toUpperCase())}
                className="text-center text-lg tracking-widest font-mono"
              />
            </div>
            
            {couponVerifyResult && (
              <div className={`p-4 rounded-lg ${couponVerifyResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`font-medium ${couponVerifyResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {couponVerifyResult.message}
                </p>
                {couponVerifyResult.coupon && (
                  <div className="mt-3 space-y-1 text-sm">
                    <p><span className="text-gray-500">优惠券:</span> {couponVerifyResult.coupon.templateName}</p>
                    <p><span className="text-gray-500">类型:</span> {
                      couponVerifyResult.coupon.couponType === 'fullreduce' ? '满减券' :
                      couponVerifyResult.coupon.couponType === 'discount' ? '折扣券' : '代金券'
                    }</p>
                    {couponVerifyResult.coupon.minAmount && (
                      <p><span className="text-gray-500">满减门槛:</span> ¥{couponVerifyResult.coupon.minAmount}</p>
                    )}
                    {couponVerifyResult.coupon.discountAmount && (
                      <p><span className="text-gray-500">优惠金额:</span> ¥{couponVerifyResult.coupon.discountAmount}</p>
                    )}
                    {couponVerifyResult.coupon.discountRate && (
                      <p><span className="text-gray-500">折扣:</span> {couponVerifyResult.coupon.discountRate * 10}折</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowCouponVerifyDialog(false);
              setCouponVerifyCode('');
              setCouponVerifyResult(null);
            }}>
              取消
            </Button>
            <Button 
              onClick={async () => {
                if (!couponVerifyCode.trim()) {
                  alert('请输入核销码或优惠券码');
                  return;
                }
                setCouponVerifyLoading(true);
                setCouponVerifyResult(null);
                try {
                  const response = await fetch('/api/coupon/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      code: couponVerifyCode.trim(),
                      storeId: shopConfig.id,
                      verifyChannel: 'offline',
                    }),
                  });
                  const data = await response.json();
                  setCouponVerifyResult(data);
                  if (data.success) {
                    // 核销成功，清空输入
                    setCouponVerifyCode('');
                  }
                } catch (error) {
                  console.error('优惠券核销失败:', error);
                  setCouponVerifyResult({
                    success: false,
                    message: '核销失败，请稍后重试',
                  });
                } finally {
                  setCouponVerifyLoading(false);
                }
              }}
              disabled={couponVerifyLoading}
            >
              {couponVerifyLoading ? '核销中...' : '确认核销'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 打印弹窗 */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-blue-500" />
              打印功能
            </DialogTitle>
            <DialogDescription>
              选择打印内容
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button 
              variant="outline" 
              className="w-full justify-start h-12"
              onClick={async () => {
                if (cartItems.length === 0) {
                  alert('购物车为空，无法打印');
                  return;
                }
                try {
                  const { printService } = await import('@/lib/print-service');
                  const receiptData = {
                    shopName: shopConfig.name,
                    shopAddress: shopConfig.address,
                    shopPhone: shopConfig.phone,
                    orderNumber: `D${Date.now().toString().slice(-10)}`,
                    timestamp: new Date().toLocaleString('zh-CN'),
                    cashier: user?.name,
                    items: cartItems.map(item => ({
                      name: item.name,
                      price: item.price,
                      quantity: item.quantity,
                      unit: item.unit || '件',
                      subtotal: item.price * item.quantity,
                    })),
                    subtotal: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
                    discount: 0,
                    totalAmount: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
                    paymentMethod: '未结算',
                    footer: '【预打印小票】',
                  };
                  const result = await printService.print(receiptData);
                  setShowPrintDialog(false);
                  alert(result.message);
                } catch (error) {
                  console.error('打印失败:', error);
                  alert('打印失败，请检查打印机连接');
                }
              }}
            >
              <FileText className="h-4 w-4 mr-3 text-blue-500" />
              打印当前购物车小票
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-12"
              onClick={async () => {
                // 打开钱箱
                try {
                  const { printService } = await import('@/lib/print-service');
                  const success = await printService.openCashbox();
                  setShowPrintDialog(false);
                  alert(success ? '钱箱已打开' : '钱箱打开失败');
                } catch (error) {
                  alert('操作失败');
                }
              }}
            >
              <Box className="h-4 w-4 mr-3 text-green-500" />
              打开钱箱
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-12"
              onClick={() => {
                setShowPrintDialog(false);
                setCurrentView('printer-settings');
              }}
            >
              <Settings className="h-4 w-4 mr-3 text-gray-500" />
              打印机设置
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-12"
              onClick={() => {
                setShowPrintDialog(false);
                setCurrentView('label-settings');
              }}
            >
              <Tag className="h-4 w-4 mr-3 text-orange-500" />
              价签打印
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>

      {/* 锁屏遮罩 - 放在最外层确保覆盖全屏 */}
      {isLocked && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 w-96 shadow-2xl">
            <div className="text-center mb-6">
              <Lock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-800">屏幕已锁定</h2>
              <p className="text-gray-500 mt-2">请输入解锁密码</p>
            </div>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="请输入解锁密码"
                className="text-center text-lg h-12"
                value={lockPassword}
                onChange={(e) => {
                  setLockPassword(e.target.value);
                  setLockError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (lockPassword === '123456' || lockPassword === 'admin') {
                      setIsLocked(false);
                      setLockPassword('');
                      setLockError('');
                    } else {
                      setLockError('密码错误，请重试');
                    }
                  }
                }}
                autoFocus
              />
              {lockError && (
                <p className="text-red-500 text-sm text-center">{lockError}</p>
              )}
              <Button 
                className="w-full h-12 text-lg bg-orange-500 hover:bg-orange-600"
                onClick={() => {
                  if (lockPassword === '123456' || lockPassword === 'admin') {
                    setIsLocked(false);
                    setLockPassword('');
                    setLockError('');
                  } else {
                    setLockError('密码错误，请重试');
                  }
                }}
              >
                解锁
              </Button>
              <p className="text-xs text-gray-400 text-center">
                默认密码: 123456 或 admin
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI 客服浮动按钮 */}
      <AiAssistantButton storeId={shopConfig.id} />
    </>
  );
}
