'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Phone,
  Mail,
  MapPin,
  Building,
  Package,
  DollarSign,
  Star,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail?: string;
  address?: string;
  status: 'active' | 'inactive';
  level: 'A' | 'B' | 'C';
  creditPeriod: number;
  rating: number;
  totalOrders: number;
  totalAmount: number;
  paymentMethod: string;
  bankAccount?: string;
  bankName?: string;
  remark?: string;
  createTime: string;
  updateTime: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: '1',
      name: '康师傅食品有限公司',
      code: 'SUP001',
      contactPerson: '张经理',
      contactPhone: '138****0001',
      contactEmail: 'zhang@masterkong.com',
      address: '上海市浦东新区XX路123号',
      status: 'active',
      level: 'A',
      creditPeriod: 30,
      rating: 5,
      totalOrders: 156,
      totalAmount: 123450,
      paymentMethod: '月结',
      bankAccount: '6222021234567890123',
      bankName: '工商银行',
      remark: '主要供应商，信誉良好',
      createTime: '2024-01-01 10:00:00',
      updateTime: '2024-03-15 14:30:00',
    },
    {
      id: '2',
      name: '可口可乐有限公司',
      code: 'SUP002',
      contactPerson: '李经理',
      contactPhone: '139****0002',
      contactEmail: 'li@coca-cola.com',
      address: '北京市朝阳区XX路456号',
      status: 'active',
      level: 'A',
      creditPeriod: 30,
      rating: 5,
      totalOrders: 234,
      totalAmount: 234567,
      paymentMethod: '月结',
      bankAccount: '6222021234567890124',
      bankName: '建设银行',
      remark: '饮料类主要供应商',
      createTime: '2024-01-05 14:30:00',
      updateTime: '2024-03-10 09:15:00',
    },
    {
      id: '3',
      name: '农夫山泉股份有限公司',
      code: 'SUP003',
      contactPerson: '王经理',
      contactPhone: '137****0003',
      address: '杭州市西湖区XX路789号',
      status: 'active',
      level: 'A',
      creditPeriod: 30,
      rating: 4,
      totalOrders: 189,
      totalAmount: 156789,
      paymentMethod: '月结',
      remark: '水类商品供应商',
      createTime: '2024-02-01 10:00:00',
      updateTime: '2024-03-12 16:45:00',
    },
    {
      id: '4',
      name: '伊利集团',
      code: 'SUP004',
      contactPerson: '赵经理',
      contactPhone: '136****0004',
      address: '内蒙古呼和浩特市XX路321号',
      status: 'active',
      level: 'B',
      creditPeriod: 15,
      rating: 4,
      totalOrders: 123,
      totalAmount: 98765,
      paymentMethod: '现结',
      remark: '乳制品供应商',
      createTime: '2024-02-10 11:20:00',
      updateTime: '2024-03-08 13:20:00',
    },
    {
      id: '5',
      name: '蒙牛乳业',
      code: 'SUP005',
      contactPerson: '钱经理',
      contactPhone: '135****0005',
      address: '内蒙古呼和浩特市XX路654号',
      status: 'inactive',
      level: 'C',
      creditPeriod: 15,
      rating: 3,
      totalOrders: 56,
      totalAmount: 34567,
      paymentMethod: '现结',
      remark: '暂时合作较少',
      createTime: '2024-03-01 09:00:00',
      updateTime: '2024-03-05 15:30:00',
    },
  ]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    level: 'B' as const,
    creditPeriod: 30,
    rating: 3,
    paymentMethod: '',
    bankAccount: '',
    bankName: '',
    remark: '',
  });

  const handleSearch = () => {
    console.log('Searching for:', searchKeyword);
  };

  const handleCreateSupplier = () => {
    const newSupplier: Supplier = {
      id: Date.now().toString(),
      ...formData,
      status: 'active',
      totalOrders: 0,
      totalAmount: 0,
      createTime: new Date().toLocaleString(),
      updateTime: new Date().toLocaleString(),
    };
    setSuppliers([...suppliers, newSupplier]);
    setCreateDialogOpen(false);
    resetForm();
  };

  const handleToggleStatus = (supplierId: string) => {
    setSuppliers(
      suppliers.map((supplier) =>
        supplier.id === supplierId
          ? {
              ...supplier,
              status: supplier.status === 'active' ? 'inactive' : 'active',
            }
          : supplier
      )
    );
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (window.confirm('确定要删除这个供应商吗？')) {
      setSuppliers(suppliers.filter((s) => s.id !== supplierId));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      address: '',
      level: 'B',
      creditPeriod: 30,
      rating: 3,
      paymentMethod: '',
      bankAccount: '',
      bankName: '',
      remark: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">合作中</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">已停用</Badge>;
      default:
        return <Badge>未知</Badge>;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'A':
        return <Badge className="bg-blue-500">A类</Badge>;
      case 'B':
        return <Badge className="bg-yellow-500">B类</Badge>;
      case 'C':
        return <Badge className="bg-gray-500">C类</Badge>;
      default:
        return <Badge>未知</Badge>;
    }
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${
              index < rating
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.includes(searchKeyword) ||
      supplier.code.includes(searchKeyword) ||
      supplier.contactPerson.includes(searchKeyword);
    const matchesStatus =
      statusFilter === 'all' || supplier.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || supplier.level === levelFilter;
    return matchesSearch && matchesStatus && matchesLevel;
  });

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="供应商管理"
        description="管理供应商信息和合作关系"
      >
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          添加供应商
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 搜索和筛选 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">搜索供应商</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="search"
                      placeholder="输入供应商名称、编码或联系人"
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
                      <SelectItem value="active">合作中</SelectItem>
                      <SelectItem value="inactive">已停用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-48">
                  <Label htmlFor="levelFilter">等级筛选</Label>
                  <Select
                    value={levelFilter}
                    onValueChange={setLevelFilter}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部等级</SelectItem>
                      <SelectItem value="A">A类</SelectItem>
                      <SelectItem value="B">B类</SelectItem>
                      <SelectItem value="C">C类</SelectItem>
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
                      供应商总数
                    </p>
                    <p className="text-2xl font-bold">{suppliers.length}</p>
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
                      合作中
                    </p>
                    <p className="text-2xl font-bold">
                      {suppliers.filter((s) => s.status === 'active').length}
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
                      采购订单
                    </p>
                    <p className="text-2xl font-bold">
                      {suppliers.reduce((sum, s) => sum + s.totalOrders, 0)}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      采购总额
                    </p>
                    <p className="text-2xl font-bold">
                      ¥{(suppliers.reduce((sum, s) => sum + s.totalAmount, 0) / 10000).toFixed(1)}万
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 供应商列表 */}
          <Card>
            <CardHeader>
              <CardTitle>供应商列表</CardTitle>
              <CardDescription>
                共 {filteredSuppliers.length} 个供应商
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>供应商</TableHead>
                    <TableHead>联系人</TableHead>
                    <TableHead>等级</TableHead>
                    <TableHead>信用期</TableHead>
                    <TableHead>付款方式</TableHead>
                    <TableHead>评级</TableHead>
                    <TableHead>合作情况</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {supplier.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{supplier.contactPerson}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {supplier.contactPhone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getLevelBadge(supplier.level)}</TableCell>
                      <TableCell>{supplier.creditPeriod}天</TableCell>
                      <TableCell>{supplier.paymentMethod}</TableCell>
                      <TableCell>
                        {getRatingStars(supplier.rating)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{supplier.totalOrders} 订单</div>
                          <div className="text-xs text-muted-foreground">
                            ¥{supplier.totalAmount.toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {supplier.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(supplier.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {supplier.status === 'inactive' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(supplier.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSupplier(supplier.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredSuppliers.length === 0 && (
                <div className="text-center py-12">
                  <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    暂无供应商，点击右上角添加
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 添加供应商对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加供应商</DialogTitle>
            <DialogDescription>
              填写供应商基本信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">供应商名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="例如：康师傅食品有限公司"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">供应商编码 *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="例如：SUP001"
                />
              </div>
            </div>

            {/* 联系信息 */}
            <div className="space-y-2">
              <Label htmlFor="contactPerson">联系人 *</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
                placeholder="例如：张经理"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">联系电话 *</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                  placeholder="例如：138****0001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">联系邮箱</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  placeholder="例如：zhang@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">地址</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="供应商地址"
                rows={2}
              />
            </div>

            <Separator />

            {/* 合作信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">供应商等级 *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A类（核心供应商）</SelectItem>
                    <SelectItem value="B">B类（普通供应商）</SelectItem>
                    <SelectItem value="C">C类（临时供应商）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="creditPeriod">信用期（天）*</Label>
                <Input
                  id="creditPeriod"
                  type="number"
                  value={formData.creditPeriod}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      creditPeriod: Number(e.target.value),
                    })
                  }
                  placeholder="例如：30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rating">供应商评级 *</Label>
                <Select
                  value={formData.rating.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, rating: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ 非常满意</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ 满意</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ 一般</SelectItem>
                    <SelectItem value="2">⭐⭐ 不满意</SelectItem>
                    <SelectItem value="1">⭐ 非常不满意</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">付款方式 *</Label>
                <Input
                  id="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value })
                  }
                  placeholder="例如：月结、现结"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">开户银行</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData({ ...formData, bankName: e.target.value })
                  }
                  placeholder="例如：工商银行"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccount">银行账号</Label>
                <Input
                  id="bankAccount"
                  value={formData.bankAccount}
                  onChange={(e) =>
                    setFormData({ ...formData, bankAccount: e.target.value })
                  }
                  placeholder="例如：6222021234567890123"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remark">备注</Label>
              <Textarea
                id="remark"
                value={formData.remark}
                onChange={(e) =>
                  setFormData({ ...formData, remark: e.target.value })
                }
                placeholder="供应商备注信息"
                rows={2}
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
            <Button onClick={handleCreateSupplier}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
