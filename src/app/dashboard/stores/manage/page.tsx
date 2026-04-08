'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Store,
  Settings,
  BarChart3,
  Users,
  DollarSign,
} from 'lucide-react';

interface Store {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  contactPerson: string;
  contactPhone: string;
  status: 'active' | 'inactive' | 'closed';
  businessHours: string;
  area: number;
  openDate: string;
  logo?: string;
  description?: string;
  totalStaff: number;
  totalMembers: number;
  monthlySales: number;
  inventoryCount: number;
  createTime: string;
  updateTime: string;
}

export default function StoresManagePage() {
  const [stores, setStores] = useState<Store[]>([
    {
      id: '1',
      name: '南山科技园店',
      code: 'STORE001',
      address: '深圳市南山区科技园南区XX路123号',
      phone: '0755-12345678',
      contactPerson: '张店长',
      contactPhone: '138****0001',
      status: 'active',
      businessHours: '08:00-22:00',
      area: 80,
      openDate: '2023-01-15',
      description: '科技园核心区旗舰店',
      totalStaff: 12,
      totalMembers: 3456,
      monthlySales: 568000,
      inventoryCount: 567,
      createTime: '2023-01-15 10:00:00',
      updateTime: '2024-03-15 14:30:00',
    },
    {
      id: '2',
      name: '福田中心店',
      code: 'STORE002',
      address: '深圳市福田区中心城XX路456号',
      phone: '0755-87654321',
      contactPerson: '李店长',
      contactPhone: '139****0002',
      status: 'active',
      businessHours: '07:30-23:00',
      area: 120,
      openDate: '2023-06-20',
      description: '福田CBD旗舰店',
      totalStaff: 18,
      totalMembers: 5678,
      monthlySales: 892000,
      inventoryCount: 890,
      createTime: '2023-06-20 14:30:00',
      updateTime: '2024-03-15 16:20:00',
    },
    {
      id: '3',
      name: '罗湖东门店',
      code: 'STORE003',
      address: '深圳市罗湖区东门步行街XX号',
      phone: '0755-11223344',
      contactPerson: '王店长',
      contactPhone: '137****0003',
      status: 'active',
      businessHours: '09:00-23:30',
      area: 150,
      openDate: '2023-09-10',
      description: '东门商圈旗舰店',
      totalStaff: 22,
      totalMembers: 8900,
      monthlySales: 1234000,
      inventoryCount: 1234,
      createTime: '2023-09-10 09:00:00',
      updateTime: '2024-03-15 17:45:00',
    },
    {
      id: '4',
      name: '宝安西乡店',
      code: 'STORE004',
      address: '深圳市宝安区西乡街道XX路789号',
      phone: '0755-55667788',
      contactPerson: '赵店长',
      contactPhone: '136****0004',
      status: 'active',
      businessHours: '08:00-22:00',
      area: 100,
      openDate: '2023-12-01',
      description: '西乡核心区标准店',
      totalStaff: 15,
      totalMembers: 4567,
      monthlySales: 678000,
      inventoryCount: 756,
      createTime: '2023-12-01 11:00:00',
      updateTime: '2024-03-15 18:30:00',
    },
    {
      id: '5',
      name: '龙岗坂田店',
      code: 'STORE005',
      address: '深圳市龙岗区坂田街道XX路321号',
      phone: '0755-99887766',
      contactPerson: '钱店长',
      contactPhone: '135****0005',
      status: 'inactive',
      businessHours: '08:30-21:30',
      area: 90,
      openDate: '2024-01-15',
      description: '坂田筹备中',
      totalStaff: 8,
      totalMembers: 1234,
      monthlySales: 234000,
      inventoryCount: 456,
      createTime: '2024-01-15 15:00:00',
      updateTime: '2024-03-15 19:15:00',
    },
  ]);

  const [currentStoreId, setCurrentStoreId] = useState('1');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    contactPerson: '',
    contactPhone: '',
    status: 'active' as const,
    businessHours: '',
    area: 0,
    openDate: '',
    description: '',
  });

  useEffect(() => {
    // 加载当前选择的店铺
    const savedStoreId = localStorage.getItem('currentStoreId');
    if (savedStoreId) {
      setCurrentStoreId(savedStoreId);
    }
  }, []);

  const handleSearch = () => {
    console.log('Searching for:', searchKeyword);
  };

  const handleCreateStore = () => {
    const newStore: Store = {
      id: Date.now().toString(),
      ...formData,
      totalStaff: 0,
      totalMembers: 0,
      monthlySales: 0,
      inventoryCount: 0,
      createTime: new Date().toLocaleString(),
      updateTime: new Date().toLocaleString(),
    };
    setStores([...stores, newStore]);
    setCreateDialogOpen(false);
    resetForm();
  };

  const handleToggleStatus = (storeId: string) => {
    setStores(
      stores.map((store) =>
        store.id === storeId
          ? {
              ...store,
              status: store.status === 'active' ? 'inactive' : 'active',
            }
          : store
      )
    );
  };

  const handleDeleteStore = (storeId: string) => {
    if (window.confirm('确定要删除这个店铺吗？')) {
      setStores(stores.filter((store) => store.id !== storeId));
    }
  };

  const handleSwitchStore = (storeId: string) => {
    setCurrentStoreId(storeId);
    localStorage.setItem('currentStoreId', storeId);
    alert('已切换到店铺：' + stores.find((s) => s.id === storeId)?.name);
  };

  const handleViewDetail = (store: Store) => {
    setSelectedStore(store);
    setDetailDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      phone: '',
      contactPerson: '',
      contactPhone: '',
      status: 'active',
      businessHours: '',
      area: 0,
      openDate: '',
      description: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">营业中</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">停业</Badge>;
      case 'closed':
        return <Badge className="bg-red-500">已关闭</Badge>;
      default:
        return <Badge>未知</Badge>;
    }
  };

  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      store.name.includes(searchKeyword) ||
      store.code.includes(searchKeyword) ||
      store.address.includes(searchKeyword);
    const matchesStatus =
      statusFilter === 'all' || store.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="多店管理" description="管理连锁店铺信息和数据">
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新增店铺
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 搜索和筛选 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">搜索店铺</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="search"
                      placeholder="输入店铺名称、编码或地址"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch}>
                      <Search className="h-4 w-4 mr-2" />
                      搜索
                    </Button>
                  </div>
                </div>
                <div className="w-48">
                  <Label htmlFor="statusFilter">状态筛选</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="active">营业中</SelectItem>
                      <SelectItem value="inactive">停业</SelectItem>
                      <SelectItem value="closed">已关闭</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      店铺总数
                    </p>
                    <p className="text-2xl font-bold">{stores.length}</p>
                  </div>
                  <Building className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      营业中
                    </p>
                    <p className="text-2xl font-bold">
                      {stores.filter((s) => s.status === 'active').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      总员工数
                    </p>
                    <p className="text-2xl font-bold">
                      {stores.reduce((sum, s) => sum + s.totalStaff, 0)}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      月度总销售额
                    </p>
                    <p className="text-2xl font-bold">
                      ¥{(stores.reduce((sum, s) => sum + s.monthlySales, 0) / 10000).toFixed(1)}万
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 店铺列表 */}
          <Card>
            <CardHeader>
              <CardTitle>店铺列表</CardTitle>
              <CardDescription>
                共 {filteredStores.length} 个店铺，当前选中：
                <Badge className="ml-2 bg-blue-500">
                  {stores.find((s) => s.id === currentStoreId)?.name || '无'}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>店铺信息</TableHead>
                    <TableHead>联系方式</TableHead>
                    <TableHead>营业信息</TableHead>
                    <TableHead>运营数据</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                            <Store className="h-5 w-5 text-orange-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{store.name}</span>
                              {store.id === currentStoreId && (
                                <Badge className="bg-blue-500">当前</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {store.code}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-xs">{store.address}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {store.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {store.businessHours}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {store.area}㎡
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>员工：{store.totalStaff}人</div>
                          <div>会员：{store.totalMembers}人</div>
                          <div>
                            月销：¥{(store.monthlySales / 10000).toFixed(1)}万
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(store.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {store.id !== currentStoreId && store.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSwitchStore(store.id)}
                            >
                              切换
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(store)}
                          >
                            详情
                          </Button>
                          {store.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(store.id)}
                            >
                              停业
                            </Button>
                          )}
                          {store.status === 'inactive' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(store.id)}
                            >
                              开业
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStore(store.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredStores.length === 0 && (
                <div className="text-center py-12">
                  <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    暂无店铺，点击右上角新增
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 新增店铺对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增店铺</DialogTitle>
            <DialogDescription>
              填写店铺基本信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">店铺名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="例如：南山科技园店"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">店铺编码 *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="例如：STORE001"
                />
              </div>
            </div>

            {/* 联系信息 */}
            <div className="space-y-2">
              <Label htmlFor="address">店铺地址 *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="详细地址"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">店铺电话 *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="例如：0755-12345678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">店铺面积（㎡）*</Label>
                <Input
                  id="area"
                  type="number"
                  value={formData.area}
                  onChange={(e) =>
                    setFormData({ ...formData, area: Number(e.target.value) })
                  }
                  placeholder="例如：100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">联系人 *</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  placeholder="例如：张店长"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">联系电话 *</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactPhone: e.target.value,
                    })
                  }
                  placeholder="例如：138****0001"
                />
              </div>
            </div>

            {/* 营业信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessHours">营业时间 *</Label>
                <Input
                  id="businessHours"
                  value={formData.businessHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessHours: e.target.value,
                    })
                  }
                  placeholder="例如：08:00-22:00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="openDate">开业日期 *</Label>
                <Input
                  id="openDate"
                  type="date"
                  value={formData.openDate}
                  onChange={(e) =>
                    setFormData({ ...formData, openDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">店铺描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="店铺简介"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleCreateStore}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 店铺详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>店铺详情</DialogTitle>
            <DialogDescription>
              {selectedStore?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedStore && (
            <div className="space-y-4 py-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">店铺名称：</span>
                  {selectedStore.name}
                </div>
                <div>
                  <span className="text-muted-foreground">店铺编码：</span>
                  {selectedStore.code}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">店铺地址：</span>
                  {selectedStore.address}
                </div>
                <div>
                  <span className="text-muted-foreground">店铺电话：</span>
                  {selectedStore.phone}
                </div>
                <div>
                  <span className="text-muted-foreground">营业时间：</span>
                  {selectedStore.businessHours}
                </div>
                <div>
                  <span className="text-muted-foreground">店铺面积：</span>
                  {selectedStore.area}㎡
                </div>
                <div>
                  <span className="text-muted-foreground">开业日期：</span>
                  {selectedStore.openDate}
                </div>
              </div>

              {/* 联系人信息 */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="font-medium">联系人信息</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">联系人：</span>
                    {selectedStore.contactPerson}
                  </div>
                  <div>
                    <span className="text-muted-foreground">联系电话：</span>
                    {selectedStore.contactPhone}
                  </div>
                </div>
              </div>

              {/* 运营数据 */}
              <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                <div className="font-medium">运营数据</div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedStore.totalStaff}
                    </div>
                    <div className="text-sm text-muted-foreground">员工数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedStore.totalMembers}
                    </div>
                    <div className="text-sm text-muted-foreground">会员数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      ¥{(selectedStore.monthlySales / 10000).toFixed(1)}万
                    </div>
                    <div className="text-sm text-muted-foreground">月销售额</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedStore.inventoryCount}
                    </div>
                    <div className="text-sm text-muted-foreground">商品数</div>
                  </div>
                </div>
              </div>

              {/* 快捷操作 */}
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  店铺设置
                </Button>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  员工管理
                </Button>
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  数据报表
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
            {selectedStore && selectedStore.id !== currentStoreId && (
              <Button onClick={() => handleSwitchStore(selectedStore.id)}>
                切换到此店铺
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
