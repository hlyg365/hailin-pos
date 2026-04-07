'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Clock,
  Users,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Gift,
  Award,
  Phone,
  User,
  Package,
  TrendingDown,
  Share2,
  Star,
} from 'lucide-react';

// 接龙活动类型
type DragonStatus = 'draft' | 'active' | 'completed' | 'cancelled';
type CommissionType = 'none' | 'percent' | 'fixed';

// 组织者类型（谁组织谁收益）
interface Organizer {
  id: string;
  name: string;
  avatar: string;
  phone?: string;
  level?: number;
  levelName?: string;
}

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
  storeId: string;
  storeName: string;
  leaderId: string;
  leaderName: string;
  leaderAvatar: string;
  leaderPhone?: string;
  groupId: string;
  groupName: string;
  orders: DragonOrder[];
  createTime: string;
  commissionType: CommissionType;
  commissionValue: number;
  estimatedCommission: number;
}

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
  // 订单归属的组织者（谁分享谁收益）
  organizerId: string;
  organizerName: string;
  // 该订单产生的佣金
  commissionAmount: number;
}

// 模拟团长/组织者数据
const mockOrganizers: Record<string, Organizer> = {
  'leader_001': {
    id: 'leader_001',
    name: '张美丽',
    avatar: '👩',
    phone: '13800138001',
    level: 5,
    levelName: '钻石团长',
  },
  'leader_002': {
    id: 'leader_002',
    name: '王建国',
    avatar: '👨',
    phone: '13900139002',
    level: 4,
    levelName: '白金团长',
  },
  'leader_003': {
    id: 'leader_003',
    name: '李小华',
    avatar: '👩‍💼',
    phone: '13700137003',
    level: 3,
    levelName: '金牌团长',
  },
};

// 模拟接龙活动数据（实际应从API获取）
const mockActivities: Record<string, DragonActivity> = {
  '1': {
    id: '1',
    title: '新鲜草莓 3斤装',
    description: '产地直发，新鲜美味，限时不限量！丹东99草莓，个大味甜，保证新鲜！',
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
    leaderPhone: '138****1234',
    groupId: 'group_001',
    groupName: '海邻小区业主群',
    orders: [],
    createTime: '2026-03-16 20:00:00',
    commissionType: 'percent',
    commissionValue: 5,
    estimatedCommission: 147.5,
  },
};

export default function DragonJoinPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const dragonId = params.id as string;
  // 从URL获取组织者ID（谁分享谁收益）
  const organizerIdFromUrl = searchParams.get('leader') || searchParams.get('organizer');
  
  const [activity, setActivity] = useState<DragonActivity | null>(null);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<DragonOrder | null>(null);
  const [orderInfo, setOrderInfo] = useState({
    customerName: '',
    customerPhone: '',
    quantity: 1,
    remark: '',
  });

  useEffect(() => {
    // 从API获取接龙活动数据
    const fetchDragonActivity = async () => {
      try {
        const response = await fetch(`/api/group-buy/dragon/?id=${dragonId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          // API返回的是数组，找到对应的活动
          const dragonData = Array.isArray(result.data) 
            ? result.data.find((d: any) => d.id === dragonId)
            : result.data;
          
          if (dragonData) {
            // 转换API数据为页面需要的格式
            const activityData: DragonActivity = {
              id: dragonData.id,
              title: dragonData.name || dragonData.title || '接龙活动',
              description: dragonData.description || '',
              product: {
                name: dragonData.products?.[0]?.name || '商品',
                image: dragonData.products?.[0]?.image || '📦',
                originalPrice: dragonData.products?.[0]?.originalPrice || dragonData.products?.[0]?.price || 0,
                groupPrice: dragonData.products?.[0]?.groupPrice || dragonData.products?.[0]?.price || 0,
              },
              targetCount: dragonData.targetCount || dragonData.products?.[0]?.targetCount || 100,
              currentCount: dragonData.currentCount || dragonData.orders?.length || 0,
              status: dragonData.status || 'active',
              startTime: dragonData.startTime || dragonData.created_at || '',
              endTime: dragonData.endTime || dragonData.end_time || '',
              storeId: dragonData.storeId || dragonData.store_ids?.[0] || '',
              storeName: dragonData.storeName || '',
              leaderId: dragonData.leaderId || dragonData.leader_ids?.[0] || '',
              leaderName: dragonData.leaderName || dragonData.organizer_name || '',
              leaderAvatar: dragonData.leaderAvatar || '👤',
              leaderPhone: dragonData.leaderPhone || '',
              groupId: dragonData.groupId || dragonData.target_group_ids?.[0] || '',
              groupName: dragonData.groupName || '',
              orders: dragonData.orders || [],
              createTime: dragonData.createTime || dragonData.created_at || '',
              commissionType: dragonData.commissionType || dragonData.commission_type || 'percent',
              commissionValue: dragonData.commissionValue || dragonData.commission_value || 0,
              estimatedCommission: dragonData.estimatedCommission || dragonData.estimated_commission || 0,
            };
            
            setActivity(activityData);
            
            // 确定组织者：优先使用URL中的组织者ID，否则使用活动的默认团长
            const effectiveOrganizerId = organizerIdFromUrl || activityData.leaderId;
            const org = mockOrganizers[effectiveOrganizerId];
            if (org) {
              setOrganizer(org);
            } else {
              // 如果找不到组织者，使用活动默认团长
              setOrganizer({
                id: activityData.leaderId,
                name: activityData.leaderName || '组织者',
                avatar: activityData.leaderAvatar || '👤',
                phone: activityData.leaderPhone,
              });
            }
          } else {
            // 如果API中没有找到，尝试使用本地模拟数据
            const localData = mockActivities[dragonId];
            if (localData) {
              setActivity(localData);
              const effectiveOrganizerId = organizerIdFromUrl || localData.leaderId;
              const org = mockOrganizers[effectiveOrganizerId];
              if (org) {
                setOrganizer(org);
              } else {
                setOrganizer({
                  id: localData.leaderId,
                  name: localData.leaderName,
                  avatar: localData.leaderAvatar,
                  phone: localData.leaderPhone,
                });
              }
            }
          }
        } else {
          // API失败，使用本地模拟数据
          const localData = mockActivities[dragonId];
          if (localData) {
            setActivity(localData);
            const effectiveOrganizerId = organizerIdFromUrl || localData.leaderId;
            const org = mockOrganizers[effectiveOrganizerId];
            if (org) {
              setOrganizer(org);
            } else {
              setOrganizer({
                id: localData.leaderId,
                name: localData.leaderName,
                avatar: localData.leaderAvatar,
                phone: localData.leaderPhone,
              });
            }
          }
        }
      } catch (error) {
        console.error('获取接龙活动失败:', error);
        // 出错时使用本地模拟数据
        const localData = mockActivities[dragonId];
        if (localData) {
          setActivity(localData);
          const effectiveOrganizerId = organizerIdFromUrl || localData.leaderId;
          const org = mockOrganizers[effectiveOrganizerId];
          if (org) {
            setOrganizer(org);
          } else {
            setOrganizer({
              id: localData.leaderId,
              name: localData.leaderName,
              avatar: localData.leaderAvatar,
              phone: localData.leaderPhone,
            });
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDragonActivity();
  }, [dragonId, organizerIdFromUrl]);

  // 计算订单佣金
  const calculateCommission = (amount: number): number => {
    if (!activity || activity.commissionType === 'none') return 0;
    if (activity.commissionType === 'percent') {
      return amount * (activity.commissionValue / 100);
    }
    return activity.commissionValue * orderInfo.quantity; // fixed
  };

  const handleSubmitOrder = () => {
    if (!orderInfo.customerName.trim()) {
      alert('请输入您的姓名');
      return;
    }
    if (!orderInfo.customerPhone.trim() || !/^1\d{10}$/.test(orderInfo.customerPhone)) {
      alert('请输入正确的手机号');
      return;
    }
    if (orderInfo.quantity < 1) {
      alert('购买数量至少为1');
      return;
    }

    const amount = activity!.product.groupPrice * orderInfo.quantity;
    const commissionAmount = calculateCommission(amount);

    // 创建订单（自动归属当前组织者 - 谁分享谁收益）
    const newOrder: DragonOrder = {
      id: `order_${Date.now()}`,
      orderNo: `JL${Date.now().toString().slice(-10)}`,
      customer: {
        name: orderInfo.customerName,
        avatar: '👤',
        phone: orderInfo.customerPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      },
      quantity: orderInfo.quantity,
      amount,
      status: 'pending',
      remark: orderInfo.remark,
      createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      // 关键：订单归属分享链接中的组织者
      organizerId: organizer!.id,
      organizerName: organizer!.name,
      // 该订单产生的佣金
      commissionAmount,
    };

    // 更新活动数据
    setActivity(prev => prev ? {
      ...prev,
      currentCount: prev.currentCount + orderInfo.quantity,
      orders: [...prev.orders, newOrder],
    } : null);

    setSubmittedOrder(newOrder);
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">接龙不存在</h2>
            <p className="text-gray-600">该接龙活动可能已结束或已被删除</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activity.status !== 'active') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {activity.status === 'draft' ? '接龙未开始' : 
               activity.status === 'completed' ? '接龙已结束' : '接龙已取消'}
            </h2>
            <p className="text-gray-600">请关注团长发布的其他接龙活动</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted && submittedOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">接龙成功！</h2>
            
            {/* 组织者信息（谁组织谁收益） */}
            <div className="flex items-center justify-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                {organizer?.avatar}
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-600">您的订单由</p>
                <p className="font-medium text-blue-600">{organizer?.name} 提供</p>
              </div>
              {organizer?.levelName && (
                <Badge className="bg-blue-500">{organizer.levelName}</Badge>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 my-4 text-left">
              <p className="text-sm text-gray-600 mb-2">订单信息</p>
              <p className="font-medium">商品：{activity!.product.name}</p>
              <p className="font-medium">数量：{orderInfo.quantity}件</p>
              <p className="font-medium text-red-500">金额：¥{submittedOrder.amount.toFixed(2)}</p>
              {submittedOrder.commissionAmount > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  订单号：{submittedOrder.orderNo}
                </p>
              )}
            </div>
            <p className="text-gray-600 mb-4">
              请联系 <span className="font-medium text-blue-600">{organizer?.name}</span> 完成付款
            </p>
            {organizer?.phone && (
              <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500" onClick={() => window.open(`tel:${organizer.phone}`)}>
                <Phone className="h-4 w-4 mr-2" />
                联系组织者
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (activity.currentCount / activity.targetCount) * 100;
  const remaining = activity.targetCount - activity.currentCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* 头部商品信息 */}
      <div className="bg-gradient-to-br from-orange-400 to-red-500 text-white">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* 组织者信息（谁组织谁收益） */}
          <div className="flex items-center gap-3 mb-6 bg-white/20 rounded-lg p-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">
              {organizer?.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{organizer?.name}</p>
                {organizer?.levelName && (
                  <Badge className="bg-yellow-400 text-yellow-900 text-xs">{organizer.levelName}</Badge>
                )}
              </div>
              <p className="text-sm text-white/80">
                <Share2 className="h-3 w-3 inline mr-1" />
                组织者 · 分享接龙
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">组织者收益</p>
              <p className="font-bold text-yellow-300">
                {activity.commissionType === 'percent' 
                  ? `${activity.commissionValue}%` 
                  : activity.commissionType === 'fixed' 
                    ? `¥${activity.commissionValue}/件` 
                    : '-'}
              </p>
            </div>
          </div>

          {/* 商品信息 */}
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 bg-white/30 rounded-2xl flex items-center justify-center text-6xl">
              {activity.product.image}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-2">{activity.title}</h1>
              <p className="text-sm text-white/80 mb-3 line-clamp-2">{activity.description}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">¥{activity.product.groupPrice}</span>
                <span className="text-sm line-through text-white/60">¥{activity.product.originalPrice}</span>
                <Badge className="bg-yellow-400 text-yellow-900">
                  省¥{activity.product.originalPrice - activity.product.groupPrice}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 接龙进度 */}
      <div className="max-w-lg mx-auto px-4 -mt-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">接龙进度</span>
              </div>
              <span className="text-sm text-gray-500">
                {activity.currentCount}/{activity.targetCount}件
              </span>
            </div>
            <Progress value={progress} className="h-2 mb-2" />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>已接 {activity.currentCount} 件</span>
              <span>剩余 {remaining} 件</span>
            </div>

            {/* 截止时间 */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-gray-600">
                截止时间：{activity.endTime}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 下单表单 */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-orange-500" />
              参与接龙
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 商品确认 */}
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Package className="h-5 w-5 text-orange-500" />
              <div className="flex-1">
                <p className="font-medium">{activity.product.name}</p>
                <p className="text-sm text-gray-500">¥{activity.product.groupPrice}/件</p>
              </div>
            </div>

            {/* 姓名 */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                您的姓名 *
              </Label>
              <Input
                id="name"
                placeholder="请输入姓名"
                value={orderInfo.customerName}
                onChange={(e) => setOrderInfo({ ...orderInfo, customerName: e.target.value })}
              />
            </div>

            {/* 手机号 */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                手机号 *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="请输入手机号"
                value={orderInfo.customerPhone}
                onChange={(e) => setOrderInfo({ ...orderInfo, customerPhone: e.target.value })}
              />
            </div>

            {/* 数量 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <ShoppingCart className="h-4 w-4" />
                购买数量
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOrderInfo({ ...orderInfo, quantity: Math.max(1, orderInfo.quantity - 1) })}
                  disabled={orderInfo.quantity <= 1}
                >
                  -
                </Button>
                <Input
                  type="number"
                  className="w-20 text-center"
                  value={orderInfo.quantity}
                  onChange={(e) => setOrderInfo({ ...orderInfo, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                  min={1}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOrderInfo({ ...orderInfo, quantity: orderInfo.quantity + 1 })}
                  disabled={orderInfo.quantity >= remaining}
                >
                  +
                </Button>
              </div>
            </div>

            {/* 备注 */}
            <div className="space-y-2">
              <Label htmlFor="remark">备注（选填）</Label>
              <Textarea
                id="remark"
                placeholder="如有特殊要求请备注"
                value={orderInfo.remark}
                onChange={(e) => setOrderInfo({ ...orderInfo, remark: e.target.value })}
                rows={2}
              />
            </div>

            {/* 金额汇总 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">商品单价</span>
                <span>¥{activity.product.groupPrice}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">购买数量</span>
                <span>{orderInfo.quantity}件</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-medium">合计</span>
                <span className="text-xl font-bold text-red-500">
                  ¥{(activity.product.groupPrice * orderInfo.quantity).toFixed(2)}
                </span>
              </div>
            </div>

            {/* 提交按钮 */}
            <Button 
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              size="lg"
              onClick={handleSubmitOrder}
            >
              确认接龙
            </Button>

            {/* 提示 */}
            <p className="text-xs text-gray-500 text-center">
              接龙成功后请联系团长完成付款
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 接龙记录 */}
      {activity.orders.length > 0 && (
        <div className="max-w-lg mx-auto px-4 pb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                接龙记录 ({activity.orders.length}人)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activity.orders.slice(-5).reverse().map((order) => (
                  <div key={order.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-lg">
                      {order.customer.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{order.customer.name}</p>
                      <p className="text-xs text-gray-500">{order.createTime.split(' ')[1]}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{order.quantity}件</p>
                      <p className="text-xs text-gray-500">¥{order.amount}</p>
                    </div>
                  </div>
                ))}
                {activity.orders.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    还有 {activity.orders.length - 5} 条记录...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
