'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Building2,
} from 'lucide-react';

// 员工接口
interface Employee {
  id: number;
  name: string;
  role: '店长' | '营业员' | '店员';
  phone: string;
  password: string;
  status: 'active' | 'inactive';
  hireDate: string;
  shopId: number;
  shopName: string;
}

// 销售业绩接口
interface SalesPerformance {
  employeeId: number;
  employeeName: string;
  shopName: string;
  role: string;
  orderCount: number;
  totalSales: number;
  avgOrderValue: number;
  todayOrders: number;
  todaySales: number;
  monthOrders: number;
  monthSales: number;
}

// 店铺列表
const shops = [
  { id: 1, name: '南山店' },
  { id: 2, name: '福田店' },
  { id: 3, name: '龙华店' },
];

// 模拟员工数据
const mockEmployees: Employee[] = [
  { id: 1, name: '王小明', role: '店长', phone: '13800138001', password: '123456', status: 'active', hireDate: '2023-01-15', shopId: 1, shopName: '南山店' },
  { id: 2, name: '李小红', role: '店员', phone: '13800138002', password: '123456', status: 'active', hireDate: '2023-03-20', shopId: 1, shopName: '南山店' },
  { id: 3, name: '张小华', role: '店员', phone: '13800138003', password: '123456', status: 'active', hireDate: '2023-06-10', shopId: 1, shopName: '南山店' },
  { id: 4, name: '陈小龙', role: '店员', phone: '13800138004', password: '123456', status: 'inactive', hireDate: '2023-08-01', shopId: 1, shopName: '南山店' },
  { id: 5, name: '刘大伟', role: '店长', phone: '13800138005', password: '123456', status: 'active', hireDate: '2023-02-10', shopId: 2, shopName: '福田店' },
  { id: 6, name: '赵小燕', role: '店员', phone: '13800138006', password: '123456', status: 'active', hireDate: '2023-04-15', shopId: 2, shopName: '福田店' },
  { id: 7, name: '周小强', role: '店长', phone: '13800138007', password: '123456', status: 'active', hireDate: '2023-03-08', shopId: 3, shopName: '龙华店' },
  { id: 8, name: '吴小梅', role: '店员', phone: '13800138008', password: '123456', status: 'active', hireDate: '2023-05-20', shopId: 3, shopName: '龙华店' },
];

// 模拟绩效数据
const mockPerformances: SalesPerformance[] = [
  { employeeId: 1, employeeName: '王小明', shopName: '南山店', role: '店长', orderCount: 456, totalSales: 28560, avgOrderValue: 62.63, todayOrders: 12, todaySales: 780, monthOrders: 156, monthSales: 9820 },
  { employeeId: 2, employeeName: '李小红', shopName: '南山店', role: '店员', orderCount: 328, totalSales: 18650, avgOrderValue: 56.86, todayOrders: 18, todaySales: 1020, monthOrders: 128, monthSales: 7250 },
  { employeeId: 3, employeeName: '张小华', shopName: '南山店', role: '店员', orderCount: 275, totalSales: 15230, avgOrderValue: 55.38, todayOrders: 15, todaySales: 890, monthOrders: 102, monthSales: 5680 },
  { employeeId: 5, employeeName: '刘大伟', shopName: '福田店', role: '店长', orderCount: 389, totalSales: 23450, avgOrderValue: 60.28, todayOrders: 14, todaySales: 920, monthOrders: 142, monthSales: 8650 },
  { employeeId: 6, employeeName: '赵小燕', shopName: '福田店', role: '店员', orderCount: 256, totalSales: 14320, avgOrderValue: 55.94, todayOrders: 12, todaySales: 680, monthOrders: 95, monthSales: 5280 },
  { employeeId: 7, employeeName: '周小强', shopName: '龙华店', role: '店长', orderCount: 412, totalSales: 25680, avgOrderValue: 62.33, todayOrders: 16, todaySales: 1050, monthOrders: 148, monthSales: 9120 },
  { employeeId: 8, employeeName: '吴小梅', shopName: '龙华店', role: '店员', orderCount: 298, totalSales: 16890, avgOrderValue: 56.68, todayOrders: 13, todaySales: 760, monthOrders: 112, monthSales: 6350 },
];

export default function StaffManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterShop, setFilterShop] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // 新建/编辑员工对话框
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '店员' as '店长' | '店员',
    phone: '',
    password: '',
    status: 'active' as 'active' | 'inactive',
    shopId: 1,
  });

  // 筛选员工
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.includes(searchTerm) || emp.phone.includes(searchTerm);
    const matchesShop = filterShop === 'all' || emp.shopId === parseInt(filterShop);
    const matchesRole = filterRole === 'all' || emp.role === filterRole;
    const matchesStatus = filterStatus === 'all' || emp.status === filterStatus;
    return matchesSearch && matchesShop && matchesRole && matchesStatus;
  });

  // 打开新建对话框
  const openCreateDialog = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      role: '店员',
      phone: '',
      password: '',
      status: 'active',
      shopId: 1,
    });
    setShowEditDialog(true);
  };

  // 打开编辑对话框
  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      role: employee.role as '店长' | '店员',
      phone: employee.phone,
      password: employee.password,
      status: employee.status,
      shopId: employee.shopId,
    });
    setShowEditDialog(true);
  };

  // 保存员工
  const saveEmployee = () => {
    if (!formData.name || !formData.phone) {
      alert('请填写完整信息');
      return;
    }

    const shop = shops.find(s => s.id === formData.shopId);

    if (editingEmployee) {
      // 编辑
      setEmployees(employees.map(emp => 
        emp.id === editingEmployee.id 
          ? { ...emp, ...formData, shopName: shop?.name || '' }
          : emp
      ));
    } else {
      // 新建
      const newEmployee: Employee = {
        id: Date.now(),
        ...formData,
        shopName: shop?.name || '',
        hireDate: new Date().toISOString().slice(0, 10),
      };
      setEmployees([...employees, newEmployee]);
    }

    setShowEditDialog(false);
  };

  // 删除员工
  const deleteEmployee = (id: number) => {
    if (confirm('确定要删除该员工吗？')) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  // 统计数据
  const stats = {
    totalEmployees: employees.filter(e => e.status === 'active').length,
    totalShops: shops.length,
    todayTotalSales: mockPerformances.reduce((sum, p) => sum + p.todaySales, 0),
    monthTotalSales: mockPerformances.reduce((sum, p) => sum + p.monthSales, 0),
  };

  // 按店铺统计
  const shopStats = shops.map(shop => {
    const shopEmployees = employees.filter(e => e.shopId === shop.id && e.status === 'active');
    const shopPerformances = mockPerformances.filter(p => p.shopName === shop.name);
    return {
      ...shop,
      employeeCount: shopEmployees.length,
      todaySales: shopPerformances.reduce((sum, p) => sum + p.todaySales, 0),
      monthSales: shopPerformances.reduce((sum, p) => sum + p.monthSales, 0),
    };
  });

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">员工管理</h1>
          <p className="text-muted-foreground mt-1">管理所有店铺员工信息和绩效统计</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          添加员工
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                <div className="text-xs text-muted-foreground">在职员工</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Building2 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalShops}</div>
                <div className="text-xs text-muted-foreground">门店数量</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">¥{stats.todayTotalSales.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">今日销售总额</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">¥{stats.monthTotalSales.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">本月销售总额</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 店铺概览 */}
      <Card>
        <CardHeader>
          <CardTitle>店铺概览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {shopStats.map((shop) => (
              <Card key={shop.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{shop.name}</h3>
                    <Badge variant="secondary">{shop.employeeCount} 人</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">今日销售</span>
                      <span className="font-medium text-green-600">¥{shop.todaySales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">本月销售</span>
                      <span className="font-medium">¥{shop.monthSales.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 员工列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索姓名/手机号"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterShop} onValueChange={setFilterShop}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="选择店铺" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部店铺</SelectItem>
                {shops.map(shop => (
                  <SelectItem key={shop.id} value={shop.id.toString()}>{shop.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="店长">店长</SelectItem>
                <SelectItem value="店员">店员</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">在职</SelectItem>
                <SelectItem value="inactive">离职</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>员工</TableHead>
                <TableHead>所属店铺</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>入职日期</TableHead>
                <TableHead>今日销售</TableHead>
                <TableHead>本月销售</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => {
                const perf = mockPerformances.find(p => p.employeeId === employee.id);
                return (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          {employee.name.charAt(0)}
                        </div>
                        <span className="font-medium">{employee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{employee.shopName}</Badge>
                    </TableCell>
                    <TableCell>{employee.phone}</TableCell>
                    <TableCell>
                      <Badge variant={employee.role === '店长' ? 'default' : 'secondary'}>
                        {employee.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={employee.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}>
                        {employee.status === 'active' ? '在职' : '离职'}
                      </Badge>
                    </TableCell>
                    <TableCell>{employee.hireDate}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      ¥{perf?.todaySales.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="font-medium">
                      ¥{perf?.monthSales.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(employee)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteEmployee(employee.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 编辑员工对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEmployee ? '编辑员工' : '添加员工'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>所属店铺</Label>
              <Select value={formData.shopId.toString()} onValueChange={(v) => setFormData({ ...formData, shopId: parseInt(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {shops.map(shop => (
                    <SelectItem key={shop.id} value={shop.id.toString()}>{shop.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>姓名</Label>
              <Input
                placeholder="请输入姓名"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>手机号</Label>
              <Input
                placeholder="请输入手机号"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>密码</Label>
              <Input
                type="password"
                placeholder="请输入密码"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <Label>角色</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as '店长' | '店员' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="店长">店长</SelectItem>
                  <SelectItem value="店员">店员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>状态</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as 'active' | 'inactive' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">在职</SelectItem>
                  <SelectItem value="inactive">离职</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={saveEmployee}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
