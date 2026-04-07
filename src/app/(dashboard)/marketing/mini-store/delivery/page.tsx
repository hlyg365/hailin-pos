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
  MapPin,
  Navigation,
  Store,
  Truck,
  Package,
  Clock,
  Users,
  Settings,
  Edit,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Target,
  Route,
  Timer,
} from 'lucide-react';

// 店铺数据类型
interface Store {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  status: 'active' | 'inactive';
  deliveryRadius: number; // 配送半径（公里）
  minOrderAmount: number; // 起送金额
  deliveryFee: number; // 配送费
  freeDeliveryAmount: number; // 满免配送费金额
  deliveryTime: number; // 预计配送时间（分钟）
  coverageAreas: string[]; // 覆盖区域
  currentOrders: number; // 当前订单数
  capacity: number; // 最大接单能力
}

// 配送区域类型
interface DeliveryArea {
  id: string;
  name: string;
  storeId: string;
  storeName: string;
  radius: number;
  minOrder: number;
  deliveryFee: number;
  status: 'active' | 'inactive';
  orderCount: number;
}

// 配送员类型
interface DeliveryRider {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  storeId: string;
  storeName: string;
  status: 'online' | 'offline' | 'delivering';
  currentOrders: number;
  completedToday: number;
  rating: number;
}

// 库存预警类型
interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  currentStock: number;
  minStock: number;
  status: 'low' | 'critical';
}

export default function MiniStoreDeliveryPage() {
  // 店铺数据
  const [stores, setStores] = useState<Store[]>([
    {
      id: 'store_001',
      name: '海邻到家南山店',
      address: '深圳市南山区科技园南区海邻大厦1楼',
      latitude: 22.5312,
      longitude: 113.9455,
      phone: '0755-8888-0001',
      status: 'active',
      deliveryRadius: 3,
      minOrderAmount: 20,
      deliveryFee: 5,
      freeDeliveryAmount: 50,
      deliveryTime: 30,
      coverageAreas: ['海邻小区', '科技园南区', '深圳湾科技生态园'],
      currentOrders: 12,
      capacity: 50,
    },
    {
      id: 'store_002',
      name: '海邻到家福田店',
      address: '深圳市福田区华强北路赛格广场1楼',
      latitude: 22.5473,
      longitude: 114.0886,
      phone: '0755-8888-0002',
      status: 'active',
      deliveryRadius: 3,
      minOrderAmount: 25,
      deliveryFee: 6,
      freeDeliveryAmount: 60,
      deliveryTime: 35,
      coverageAreas: ['华强北', '福田中心区', '岗厦'],
      currentOrders: 8,
      capacity: 40,
    },
    {
      id: 'store_003',
      name: '海邻到家罗湖店',
      address: '深圳市罗湖区东门步行街',
      latitude: 22.5469,
      longitude: 114.1204,
      phone: '0755-8888-0003',
      status: 'active',
      deliveryRadius: 2.5,
      minOrderAmount: 20,
      deliveryFee: 5,
      freeDeliveryAmount: 50,
      deliveryTime: 25,
      coverageAreas: ['东门', '人民南', '国贸'],
      currentOrders: 5,
      capacity: 30,
    },
  ]);

  // 配送区域数据
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([
    { id: '1', name: '海邻小区', storeId: 'store_001', storeName: '南山店', radius: 1.5, minOrder: 20, deliveryFee: 0, status: 'active', orderCount: 156 },
    { id: '2', name: '科技园南区', storeId: 'store_001', storeName: '南山店', radius: 3, minOrder: 20, deliveryFee: 5, status: 'active', orderCount: 89 },
    { id: '3', name: '华强北商圈', storeId: 'store_002', storeName: '福田店', radius: 2.5, minOrder: 25, deliveryFee: 5, status: 'active', orderCount: 234 },
    { id: '4', name: '东门步行街', storeId: 'store_003', storeName: '罗湖店', radius: 2, minOrder: 20, deliveryFee: 5, status: 'active', orderCount: 178 },
  ]);

  // 配送员数据
  const [riders, setRiders] = useState<DeliveryRider[]>([
    { id: 'rider_001', name: '张三', phone: '138****1234', avatar: '👨', storeId: 'store_001', storeName: '南山店', status: 'online', currentOrders: 3, completedToday: 12, rating: 4.9 },
    { id: 'rider_002', name: '李四', phone: '139****5678', avatar: '👩', storeId: 'store_001', storeName: '南山店', status: 'delivering', currentOrders: 2, completedToday: 8, rating: 4.8 },
    { id: 'rider_003', name: '王五', phone: '137****9012', avatar: '👴', storeId: 'store_002', storeName: '福田店', status: 'online', currentOrders: 1, completedToday: 15, rating: 4.7 },
    { id: 'rider_004', name: '赵六', phone: '136****3456', avatar: '👨‍💼', storeId: 'store_003', storeName: '罗湖店', status: 'offline', currentOrders: 0, completedToday: 0, rating: 4.6 },
  ]);

  // 库存预警数据
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([
    { id: '1', productId: 'prod_001', productName: '进口香蕉 500g', storeId: 'store_001', storeName: '南山店', currentStock: 5, minStock: 10, status: 'low' },
    { id: '2', productId: 'prod_002', productName: '纯牛奶 250ml*12', storeId: 'store_001', storeName: '南山店', currentStock: 2, minStock: 5, status: 'critical' },
    { id: '3', productId: 'prod_003', productName: '土鸡蛋 30枚', storeId: 'store_002', storeName: '福田店', currentStock: 8, minStock: 15, status: 'low' },
  ]);

  // 用户当前位置（模拟）
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [nearestStore, setNearestStore] = useState<Store | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [storeConfigDialogOpen, setStoreConfigDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Store>>({});

  // 模拟获取用户位置
  const handleGetLocation = () => {
    // 模拟定位（实际项目中会调用浏览器 Geolocation API）
    setTimeout(() => {
      const mockLocation = {
        lat: 22.5320,
        lng: 113.9460,
        address: '深圳市南山区科技园南区海邻小区',
      };
      setUserLocation(mockLocation);
      
      // 计算最近店铺
      const nearest = findNearestStore(mockLocation.lat, mockLocation.lng);
      setNearestStore(nearest);
      
      setLocationDialogOpen(true);
    }, 1000);
  };

  // 计算距离（使用 Haversine 公式）
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 查找最近店铺
  const findNearestStore = (lat: number, lng: number): Store | null => {
    let nearest: Store | null = null;
    let minDistance = Infinity;
    
    stores.filter(s => s.status === 'active').forEach(store => {
      const distance = calculateDistance(lat, lng, store.latitude, store.longitude);
      if (distance < minDistance && distance <= store.deliveryRadius) {
        minDistance = distance;
        nearest = store;
      }
    });
    
    return nearest;
  };

  // 获取店铺距离列表
  const getStoreDistances = (lat: number, lng: number) => {
    return stores.map(store => ({
      ...store,
      distance: calculateDistance(lat, lng, store.latitude, store.longitude),
    })).sort((a, b) => a.distance - b.distance);
  };

  // 打开店铺配置对话框
  const handleEditStore = (store: Store) => {
    setSelectedStore(store);
    setEditFormData({ ...store });
    setStoreConfigDialogOpen(true);
  };

  // 保存店铺配置
  const handleSaveStoreConfig = () => {
    if (selectedStore && editFormData) {
      setStores(stores.map(s => 
        s.id === selectedStore.id ? { ...s, ...editFormData } as Store : s
      ));
    }
    setStoreConfigDialogOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="配送管理" description="管理店铺定位、配送区域和配送员">
        <Button variant="outline" onClick={handleGetLocation}>
          <Navigation className="h-4 w-4 mr-2" />
          模拟定位
        </Button>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          配送设置
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 定位信息卡片 */}
          {userLocation && nearestStore && (
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">当前位置：{userLocation.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Store className="h-4 w-4 text-green-600" />
                      <span>最近店铺：<strong className="text-green-600">{nearestStore.name}</strong></span>
                      <span className="mx-2">|</span>
                      <Clock className="h-4 w-4" />
                      <span>预计 {nearestStore.deliveryTime} 分钟送达</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setLocationDialogOpen(true)}>
                    切换店铺
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Store className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stores.filter(s => s.status === 'active').length}</p>
                    <p className="text-sm text-muted-foreground">营业店铺</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Truck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{riders.filter(r => r.status !== 'offline').length}</p>
                    <p className="text-sm text-muted-foreground">在线配送员</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Package className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stores.reduce((sum, s) => sum + s.currentOrders, 0)}</p>
                    <p className="text-sm text-muted-foreground">配送中订单</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stockAlerts.length}</p>
                    <p className="text-sm text-muted-foreground">库存预警</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="stores" className="space-y-4">
            <TabsList>
              <TabsTrigger value="stores">
                <Store className="h-4 w-4 mr-2" />
                店铺管理
              </TabsTrigger>
              <TabsTrigger value="areas">
                <Target className="h-4 w-4 mr-2" />
                配送区域
              </TabsTrigger>
              <TabsTrigger value="riders">
                <Truck className="h-4 w-4 mr-2" />
                配送员
              </TabsTrigger>
              <TabsTrigger value="alerts">
                <AlertCircle className="h-4 w-4 mr-2" />
                库存预警
              </TabsTrigger>
            </TabsList>

            {/* 店铺管理 */}
            <TabsContent value="stores">
              <Card>
                <CardHeader>
                  <CardTitle>店铺列表</CardTitle>
                  <CardDescription>管理所有店铺的位置和配送配置</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>店铺名称</TableHead>
                        <TableHead>地址</TableHead>
                        <TableHead>配送半径</TableHead>
                        <TableHead>起送/配送费</TableHead>
                        <TableHead>当前订单</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stores.map(store => (
                        <TableRow key={store.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🏪</span>
                              <div>
                                <p className="font-medium">{store.name}</p>
                                <p className="text-xs text-muted-foreground">{store.phone}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {store.address}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Route className="h-3 w-3 text-muted-foreground" />
                              {store.deliveryRadius} 公里
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>起送：¥{store.minOrderAmount}</p>
                              <p className="text-muted-foreground">配送费：¥{store.deliveryFee}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${store.currentOrders / store.capacity > 0.8 ? 'bg-red-500' : 'bg-green-500'}`}
                                  style={{ width: `${(store.currentOrders / store.capacity) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm">{store.currentOrders}/{store.capacity}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={store.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                              {store.status === 'active' ? '营业中' : '已关闭'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEditStore(store)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 配送区域 */}
            <TabsContent value="areas">
              <Card>
                <CardHeader>
                  <CardTitle>配送区域管理</CardTitle>
                  <CardDescription>配置各店铺的配送范围和费用</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>区域名称</TableHead>
                        <TableHead>关联店铺</TableHead>
                        <TableHead>配送半径</TableHead>
                        <TableHead>起送金额</TableHead>
                        <TableHead>配送费</TableHead>
                        <TableHead>累计订单</TableHead>
                        <TableHead>状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveryAreas.map(area => (
                        <TableRow key={area.id}>
                          <TableCell className="font-medium">{area.name}</TableCell>
                          <TableCell>{area.storeName}</TableCell>
                          <TableCell>{area.radius} 公里</TableCell>
                          <TableCell>¥{area.minOrder}</TableCell>
                          <TableCell>{area.deliveryFee === 0 ? '免运费' : `¥${area.deliveryFee}`}</TableCell>
                          <TableCell>{area.orderCount}</TableCell>
                          <TableCell>
                            <Badge className={area.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                              {area.status === 'active' ? '启用' : '禁用'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 配送员管理 */}
            <TabsContent value="riders">
              <Card>
                <CardHeader>
                  <CardTitle>配送员列表</CardTitle>
                  <CardDescription>管理各店铺的配送员</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {riders.map(rider => (
                      <Card key={rider.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{rider.avatar}</span>
                              <div>
                                <p className="font-medium">{rider.name}</p>
                                <p className="text-sm text-muted-foreground">{rider.phone}</p>
                              </div>
                            </div>
                            <Badge className={
                              rider.status === 'online' ? 'bg-green-500' : 
                              rider.status === 'delivering' ? 'bg-orange-500' : 'bg-gray-500'
                            }>
                              {rider.status === 'online' ? '在线' : 
                               rider.status === 'delivering' ? '配送中' : '离线'}
                            </Badge>
                          </div>
                          <div className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">所属店铺</span>
                              <span>{rider.storeName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">当前订单</span>
                              <span>{rider.currentOrders}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">今日完成</span>
                              <span>{rider.completedToday}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">评分</span>
                              <span className="text-yellow-500">⭐ {rider.rating}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 库存预警 */}
            <TabsContent value="alerts">
              <Card>
                <CardHeader>
                  <CardTitle>库存预警</CardTitle>
                  <CardDescription>需要补货的商品列表，配送完成后自动扣减库存</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>商品名称</TableHead>
                        <TableHead>所属店铺</TableHead>
                        <TableHead>当前库存</TableHead>
                        <TableHead>最低库存</TableHead>
                        <TableHead>预警等级</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockAlerts.map(alert => (
                        <TableRow key={alert.id}>
                          <TableCell className="font-medium">{alert.productName}</TableCell>
                          <TableCell>{alert.storeName}</TableCell>
                          <TableCell>
                            <span className={alert.status === 'critical' ? 'text-red-600 font-bold' : 'text-orange-600'}>
                              {alert.currentStock}
                            </span>
                          </TableCell>
                          <TableCell>{alert.minStock}</TableCell>
                          <TableCell>
                            <Badge className={alert.status === 'critical' ? 'bg-red-500' : 'bg-orange-500'}>
                              {alert.status === 'critical' ? '严重不足' : '库存偏低'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                              一键补货
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 定位结果对话框 */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              选择配送店铺
            </DialogTitle>
            <DialogDescription>
              根据您的位置，为您推荐最近的配送店铺
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">当前位置：{userLocation?.address}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>附近店铺</Label>
              {userLocation && getStoreDistances(userLocation.lat, userLocation.lng).map(store => (
                <Card 
                  key={store.id} 
                  className={`cursor-pointer transition-all ${
                    nearestStore?.id === store.id ? 'ring-2 ring-green-500 bg-green-50' : ''
                  } ${store.distance > store.deliveryRadius ? 'opacity-50' : ''}`}
                  onClick={() => {
                    if (store.distance <= store.deliveryRadius) {
                      setNearestStore(store);
                    }
                  }}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🏪</span>
                        <div>
                          <p className="font-medium">{store.name}</p>
                          <p className="text-sm text-muted-foreground">{store.address}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{(store.distance as number).toFixed(2)} 公里</p>
                        <p className="text-xs text-muted-foreground">
                          {store.distance > store.deliveryRadius ? '超出配送范围' : `预计${store.deliveryTime}分钟送达`}
                        </p>
                      </div>
                    </div>
                    {nearestStore?.id === store.id && (
                      <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        已选择此店铺配送
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 店铺配置对话框 */}
      <Dialog open={storeConfigDialogOpen} onOpenChange={setStoreConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>店铺配送配置</DialogTitle>
            <DialogDescription>
              配置店铺的配送范围和费用规则
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>店铺名称</Label>
                <Input value={editFormData.name || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>联系电话</Label>
                <Input value={editFormData.phone || ''} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label>店铺地址</Label>
              <Input value={editFormData.address || ''} disabled />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>配送半径（公里）</Label>
                <Input 
                  type="number" 
                  value={editFormData.deliveryRadius || ''} 
                  onChange={(e) => setEditFormData({ ...editFormData, deliveryRadius: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>起送金额（元）</Label>
                <Input 
                  type="number" 
                  value={editFormData.minOrderAmount || ''} 
                  onChange={(e) => setEditFormData({ ...editFormData, minOrderAmount: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>配送费（元）</Label>
                <Input 
                  type="number" 
                  value={editFormData.deliveryFee || ''} 
                  onChange={(e) => setEditFormData({ ...editFormData, deliveryFee: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>满免配送费金额（元）</Label>
                <Input 
                  type="number" 
                  value={editFormData.freeDeliveryAmount || ''} 
                  onChange={(e) => setEditFormData({ ...editFormData, freeDeliveryAmount: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>预计配送时间（分钟）</Label>
                <Input 
                  type="number" 
                  value={editFormData.deliveryTime || ''} 
                  onChange={(e) => setEditFormData({ ...editFormData, deliveryTime: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>覆盖区域</Label>
              <Textarea 
                value={editFormData.coverageAreas?.join('、') || ''} 
                onChange={(e) => setEditFormData({ ...editFormData, coverageAreas: e.target.value.split('、') })}
                placeholder="用顿号分隔多个区域"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStoreConfigDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveStoreConfig}>保存配置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
