'use client';

import { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  UserPlus,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  XCircle,
  Key,
  Store,
  Search,
  RefreshCw,
} from 'lucide-react';

interface StoreManager {
  id: string;
  name: string;
  phone: string;
  username: string;
  password: string;
  storeId: string;
  storeName: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLoginAt?: string;
}

// 模拟店铺数据
const stores = [
  { id: 'store-001', name: '海邻到家·阳光店' },
  { id: 'store-002', name: '海邻到家·福田店' },
  { id: 'store-003', name: '海邻到家·罗湖店' },
  { id: 'store-004', name: '海邻到家·宝安店' },
  { id: 'store-005', name: '海邻到家·龙岗店' },
];

// 初始店长数据
const initialManagers: StoreManager[] = [
  {
    id: '1',
    name: '张店长',
    phone: '138****1234',
    username: 'admin',
    password: '123456',
    storeId: 'store-001',
    storeName: '海邻到家·阳光店',
    status: 'active',
    createdAt: '2024-01-15',
    lastLoginAt: '2024-03-20 14:30',
  },
  {
    id: '2',
    name: '李店长',
    phone: '139****5678',
    username: 'manager_ft',
    password: '123456',
    storeId: 'store-002',
    storeName: '海邻到家·福田店',
    status: 'active',
    createdAt: '2024-02-20',
    lastLoginAt: '2024-03-19 09:15',
  },
  {
    id: '3',
    name: '王店长',
    phone: '137****9012',
    username: 'manager_lh',
    password: '123456',
    storeId: 'store-003',
    storeName: '海邻到家·罗湖店',
    status: 'inactive',
    createdAt: '2024-03-10',
  },
];

export default function StoreManagersPage() {
  const [managers, setManagers] = useState<StoreManager[]>(initialManagers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<StoreManager | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    username: '',
    password: '',
    storeId: '',
    status: 'active' as 'active' | 'inactive',
  });

  // 过滤搜索结果
  const filteredManagers = managers.filter(manager =>
    manager.name.includes(searchTerm) ||
    manager.username.includes(searchTerm) ||
    manager.storeName.includes(searchTerm)
  );

  const handleAdd = () => {
    setEditingManager(null);
    setFormData({
      name: '',
      phone: '',
      username: '',
      password: '',
      storeId: '',
      status: 'active',
    });
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (manager: StoreManager) => {
    setEditingManager(manager);
    setFormData({
      name: manager.name,
      phone: manager.phone,
      username: manager.username,
      password: manager.password,
      storeId: manager.storeId,
      status: manager.status,
    });
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const selectedStore = stores.find(s => s.id === formData.storeId);
    
    if (editingManager) {
      // 编辑模式
      setManagers(prev => prev.map(m => 
        m.id === editingManager.id 
          ? {
              ...m,
              ...formData,
              storeName: selectedStore?.name || m.storeName,
            }
          : m
      ));
    } else {
      // 新增模式
      const newManager: StoreManager = {
        id: Date.now().toString(),
        ...formData,
        storeName: selectedStore?.name || '',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setManagers(prev => [...prev, newManager]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个店长账号吗？')) {
      setManagers(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleToggleStatus = (id: string) => {
    setManagers(prev => prev.map(m => 
      m.id === id 
        ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' }
        : m
    ));
  };

  const handleResetPassword = (manager: StoreManager) => {
    if (confirm(`确定要重置 ${manager.name} 的密码吗？密码将被重置为 123456`)) {
      setManagers(prev => prev.map(m => 
        m.id === manager.id 
          ? { ...m, password: '123456' }
          : m
      ));
      alert('密码已重置为 123456');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="店长账号管理" 
        description="统一管理各门店店长的登录账号，店长可通过店长助手APP或PC端登录"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>店长账号列表</CardTitle>
              <CardDescription>共 {managers.length} 个店长账号</CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <UserPlus className="h-4 w-4 mr-2" />
              新增店长
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索栏 */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索店长姓名、账号或门店..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* 账号列表 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>店长信息</TableHead>
                  <TableHead>登录账号</TableHead>
                  <TableHead>所属门店</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>最后登录</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredManagers.map((manager) => (
                  <TableRow key={manager.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {manager.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{manager.name}</div>
                          <div className="text-sm text-gray-500">{manager.phone}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm">{manager.username}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-gray-400" />
                        <span>{manager.storeName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={manager.status === 'active' ? 'default' : 'secondary'}>
                        {manager.status === 'active' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> 已启用</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> 已停用</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {manager.lastLoginAt || '从未登录'}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {manager.createdAt}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(manager)}>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑账号
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(manager)}>
                            <Key className="h-4 w-4 mr-2" />
                            重置密码
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(manager.id)}>
                            {manager.status === 'active' ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                停用账号
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                启用账号
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(manager.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除账号
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredManagers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      暂无匹配的店长账号
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 新增/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingManager ? '编辑店长账号' : '新增店长账号'}</DialogTitle>
            <DialogDescription>
              {editingManager ? '修改店长的账号信息和权限' : '为门店创建新的店长账号'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入店长姓名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">手机号 *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="请输入手机号"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeId">所属门店 *</Label>
              <Select
                value={formData.storeId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, storeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择门店" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">登录账号 *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="请输入登录账号"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">登录密码 *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="请输入密码"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '隐藏' : '显示'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">账号状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">已启用</SelectItem>
                  <SelectItem value="inactive">已停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              {editingManager ? '保存修改' : '创建账号'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>1. 店长账号由总部统一创建和管理，每个门店可创建一个店长账号</p>
          <p>2. 店长可使用账号登录「店长管理助手」APP 或 PC 网页版</p>
          <p>3. 登录地址：<code className="px-2 py-1 bg-gray-100 rounded">/store-admin</code></p>
          <p>4. 默认密码为 <code className="px-2 py-1 bg-gray-100 rounded">123456</code>，建议店长首次登录后修改密码</p>
          <p>5. 停用账号后，该店长将无法登录店长管理系统</p>
        </CardContent>
      </Card>
    </div>
  );
}
