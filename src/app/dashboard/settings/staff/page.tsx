'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  UserPlus,
  Edit,
  Trash2,
  Shield,
  MoreVertical,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Staff {
  id: number;
  name: string;
  phone: string;
  username: string;
  role: 'admin' | 'cashier' | 'manager';
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<Staff[]>([
    {
      id: 1,
      name: '张三',
      phone: '138****1234',
      username: 'zhangsan',
      role: 'admin',
      status: 'active',
      createdAt: '2024-01-15',
    },
    {
      id: 2,
      name: '李四',
      phone: '139****5678',
      username: 'lisi',
      role: 'cashier',
      status: 'active',
      createdAt: '2024-02-20',
    },
    {
      id: 3,
      name: '王五',
      phone: '137****9012',
      username: 'wangwu',
      role: 'manager',
      status: 'active',
      createdAt: '2024-03-10',
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    username: '',
    password: '',
    role: 'cashier' as 'admin' | 'cashier' | 'manager',
    status: 'active' as 'active' | 'inactive',
  });

  const handleAdd = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      phone: '',
      username: '',
      password: '',
      role: 'cashier',
      status: 'active',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      phone: staff.phone,
      username: staff.username,
      password: '',
      role: staff.role,
      status: staff.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('确定要删除该营业员吗？')) {
      setStaffList(staffList.filter((s) => s.id !== id));
    }
  };

  const handleToggleStatus = (id: number) => {
    setStaffList(
      staffList.map((s) =>
        s.id === id
          ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' }
          : s
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 简单验证
    if (!formData.name || !formData.phone || !formData.username) {
      alert('请填写必填项');
      return;
    }

    if (editingStaff) {
      // 编辑
      setStaffList(
        staffList.map((s) =>
          s.id === editingStaff.id
            ? {
                ...s,
                name: formData.name,
                phone: formData.phone,
                username: formData.username,
                role: formData.role,
                status: formData.status,
              }
            : s
        )
      );
    } else {
      // 新增
      if (!formData.password) {
        alert('请设置初始密码');
        return;
      }

      const newStaff: Staff = {
        id: Date.now(),
        name: formData.name,
        phone: formData.phone,
        username: formData.username,
        role: formData.role,
        status: formData.status,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setStaffList([...staffList, newStaff]);
    }

    setIsDialogOpen(false);
    alert(editingStaff ? '修改成功' : '添加成功');
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: '管理员',
      manager: '店长',
      cashier: '收银员',
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      manager: 'bg-blue-100 text-blue-700',
      cashier: 'bg-green-100 text-green-700',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="收银员管理"
        description="管理店铺收银员账号、权限和状态"
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      总人数
                    </p>
                    <p className="text-2xl font-bold">{staffList.length}</p>
                  </div>
                  <UserPlus className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      在岗人员
                    </p>
                    <p className="text-2xl font-bold">
                      {staffList.filter((s) => s.status === 'active').length}
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
                      离岗人员
                    </p>
                    <p className="text-2xl font-bold">
                      {staffList.filter((s) => s.status === 'inactive').length}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 营业员列表 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    营业员列表
                  </CardTitle>
                  <CardDescription>
                    管理所有营业员账号，可添加、编辑或删除
                  </CardDescription>
                </div>
                <Button onClick={handleAdd}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  添加营业员
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffList.map((staff) => (
                  <div
                    key={staff.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {staff.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{staff.name}</div>
                          <Badge className={getRoleColor(staff.role)}>
                            {getRoleLabel(staff.role)}
                          </Badge>
                          {staff.status === 'active' ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              在岗
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              离岗
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          用户名: {staff.username} | 电话: {staff.phone}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          创建时间: {staff.createdAt}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(staff)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(staff.id)}
                      >
                        {staff.status === 'active' ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(staff.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {staffList.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无营业员，点击"添加营业员"开始添加</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 添加/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? '编辑营业员' : '添加营业员'}
            </DialogTitle>
            <DialogDescription>
              {editingStaff ? '修改营业员信息' : '创建新的营业员账号'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  姓名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="请输入姓名"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">
                  用户名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="请输入用户名（登录账号）"
                  required
                  disabled={!!editingStaff}
                />
                {editingStaff && (
                  <p className="text-xs text-muted-foreground">
                    用户名创建后不可修改
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  手机号 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="请输入手机号"
                  required
                />
              </div>

              {!editingStaff && (
                <div className="space-y-2">
                  <Label htmlFor="password">
                    密码 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="请设置初始密码"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    密码长度至少6位
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="role">角色</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">管理员</SelectItem>
                    <SelectItem value="manager">店长</SelectItem>
                    <SelectItem value="cashier">收银员</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingStaff && (
                <div className="space-y-2">
                  <Label htmlFor="status">状态</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">在岗</SelectItem>
                      <SelectItem value="inactive">离岗</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit">
                {editingStaff ? '保存' : '添加'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
