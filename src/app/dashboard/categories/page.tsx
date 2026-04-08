'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CategoryIconPicker, CategoryIconDisplay, getIconConfig } from '@/components/category-icon-picker';
import { cn } from '@/lib/utils';
import { 
  Plus, Tag, MoreHorizontal, Edit, Trash2,
  GripVertical, Save, X, Package,
  Search, ArrowUpRight, ArrowDownRight, Sparkles
} from 'lucide-react';

// 分类接口
interface Category {
  id: string;
  name: string;
  icon: string; // 使用新图标系统的 iconId
  description?: string;
  sort: number;
  productCount: number;
  status: 'active' | 'inactive';
  createTime: string;
}

// 模拟分类数据（使用新图标ID）
const initialCategories: Category[] = [
  { id: 'drinks', name: '饮品', icon: 'glass-water', description: '各类饮料、矿泉水、果汁等', sort: 1, productCount: 25, status: 'active', createTime: '2025-01-01' },
  { id: 'fruits', name: '水果', icon: 'apple', description: '新鲜水果', sort: 2, productCount: 18, status: 'active', createTime: '2025-01-01' },
  { id: 'vegetables', name: '蔬菜', icon: 'salad', description: '新鲜蔬菜', sort: 3, productCount: 22, status: 'active', createTime: '2025-01-01' },
  { id: 'snacks', name: '零食', icon: 'cookie', description: '休闲零食、糖果、饼干等', sort: 4, productCount: 35, status: 'active', createTime: '2025-01-01' },
  { id: 'fresh', name: '生鲜', icon: 'beef', description: '生鲜食品、烘焙面包等', sort: 5, productCount: 15, status: 'active', createTime: '2025-01-01' },
  { id: 'daily', name: '日用品', icon: 'home', description: '日常生活用品', sort: 6, productCount: 42, status: 'active', createTime: '2025-01-01' },
  { id: 'frozen', name: '冷冻食品', icon: 'snowflake', description: '冷冻冷藏食品', sort: 7, productCount: 12, status: 'inactive', createTime: '2025-02-15' },
  { id: 'dairy', name: '乳制品', icon: 'milk', description: '牛奶、酸奶等乳制品', sort: 8, productCount: 20, status: 'active', createTime: '2025-02-20' },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // 统计
  const stats = {
    total: categories.length,
    active: categories.filter(c => c.status === 'active').length,
    inactive: categories.filter(c => c.status === 'inactive').length,
    totalProducts: categories.reduce((sum, c) => sum + c.productCount, 0),
  };

  // 过滤分类
  const filteredCategories = categories.filter(category => {
    const matchesSearch = !searchTerm || 
      category.name.includes(searchTerm) ||
      (category.description && category.description.includes(searchTerm));
    const matchesStatus = statusFilter === 'all' || category.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 按排序获取分类列表
  const sortedCategories = [...filteredCategories].sort((a, b) => a.sort - b.sort);

  // 打开新增/编辑对话框
  const handleEdit = (category: Category | null) => {
    setEditingCategory(category);
    if (category) {
      setFormData({ ...category });
    } else {
      setFormData({
        icon: 'package',
        sort: categories.length + 1,
        status: 'active',
      });
    }
    setDialogOpen(true);
  };

  // 保存分类
  const handleSave = () => {
    if (!formData.name || !formData.name.trim()) {
      alert('请输入分类名称');
      return;
    }
    
    if (!editingCategory) {
      // 新增时生成ID
      const id = 'cat_' + Date.now();
      
      const newCategory: Category = {
        id,
        name: formData.name.trim(),
        icon: formData.icon || 'package',
        description: formData.description,
        sort: formData.sort || categories.length + 1,
        productCount: 0,
        status: formData.status as 'active' | 'inactive' || 'active',
        createTime: new Date().toISOString().slice(0, 10),
      };
      setCategories([...categories, newCategory]);
    } else {
      // 编辑
      setCategories(categories.map(c => 
        c.id === editingCategory.id 
          ? { 
              ...c, 
              name: formData.name?.trim() || c.name,
              icon: formData.icon || c.icon,
              description: formData.description,
              sort: formData.sort || c.sort,
              status: formData.status || c.status,
            } 
          : c
      ));
    }
    setDialogOpen(false);
  };

  // 删除分类
  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!categoryToDelete) return;
    
    if (categoryToDelete.productCount > 0) {
      alert('该分类下还有商品，无法删除');
      setDeleteDialogOpen(false);
      return;
    }
    
    setCategories(categories.filter(c => c.id !== categoryToDelete.id));
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  // 切换状态
  const toggleStatus = (category: Category) => {
    setCategories(categories.map(c => 
      c.id === category.id 
        ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } 
        : c
    ));
  };

  // 移动排序
  const moveSort = (category: Category, direction: 'up' | 'down') => {
    const sortedList = [...categories].sort((a, b) => a.sort - b.sort);
    const currentIndex = sortedList.findIndex(c => c.id === category.id);
    
    if (direction === 'up' && currentIndex > 0) {
      const prevCategory = sortedList[currentIndex - 1];
      setCategories(categories.map(c => {
        if (c.id === category.id) return { ...c, sort: prevCategory.sort };
        if (c.id === prevCategory.id) return { ...c, sort: category.sort };
        return c;
      }));
    } else if (direction === 'down' && currentIndex < sortedList.length - 1) {
      const nextCategory = sortedList[currentIndex + 1];
      setCategories(categories.map(c => {
        if (c.id === category.id) return { ...c, sort: nextCategory.sort };
        if (c.id === nextCategory.id) return { ...c, sort: category.sort };
        return c;
      }));
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">分类管理</h2>
          <p className="text-muted-foreground">管理商品分类，支持排序和状态控制</p>
        </div>
        <Button onClick={() => handleEdit(null)}>
          <Plus className="mr-2 h-4 w-4" />
          新增分类
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-sm">
                <Tag className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">分类总数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg shadow-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <div className="text-sm text-muted-foreground">启用分类</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-slate-400 to-gray-500 rounded-lg shadow-sm">
                <Tag className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.inactive}</div>
                <div className="text-sm text-muted-foreground">停用分类</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-sm">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <div className="text-sm text-muted-foreground">商品总数</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选条件 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索分类名称或描述"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                全部
              </Button>
              <Button 
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                启用
              </Button>
              <Button 
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('inactive')}
              >
                停用
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 分类列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">分类列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">排序</TableHead>
                <TableHead className="w-16">图标</TableHead>
                <TableHead>分类名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead className="w-24">商品数量</TableHead>
                <TableHead className="w-24">状态</TableHead>
                <TableHead className="w-32">创建时间</TableHead>
                <TableHead className="w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCategories.map((category, index) => {
                const iconConfig = getIconConfig(category.icon);
                
                return (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <span className="font-medium">{category.sort}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <CategoryIconDisplay iconId={category.icon} size="md" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.name}</span>
                        {iconConfig && (
                          <span className="text-xs text-muted-foreground">{iconConfig.name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {category.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{category.productCount} 件</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={cn(
                          category.status === 'active' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                            : 'bg-gradient-to-r from-gray-400 to-slate-500'
                        )}
                      >
                        {category.status === 'active' ? '启用' : '停用'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{category.createTime}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* 排序按钮 */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          disabled={index === 0}
                          onClick={() => moveSort(category, 'up')}
                          title="上移"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          disabled={index === sortedCategories.length - 1}
                          onClick={() => moveSort(category, 'down')}
                          title="下移"
                        >
                          <ArrowDownRight className="h-4 w-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStatus(category)}>
                              {category.status === 'active' ? (
                                <>
                                  <X className="h-4 w-4 mr-2" />
                                  停用
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  启用
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteClick(category)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategory ? '编辑分类' : '新增分类'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? '修改分类信息' : '创建新的商品分类'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>分类名称 *</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="输入分类名称"
              />
            </div>
            
            <div className="space-y-2">
              <Label>分类图标</Label>
              <CategoryIconPicker
                value={formData.icon}
                onChange={(iconId) => setFormData({ ...formData, icon: iconId })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>分类描述</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="输入分类描述（选填）"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>排序</Label>
                <Input
                  type="number"
                  value={formData.sort || ''}
                  onChange={(e) => setFormData({ ...formData, sort: parseInt(e.target.value) || 0 })}
                  placeholder="排序号"
                />
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <div className="flex items-center gap-4 h-10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === 'active'}
                      onChange={() => setFormData({ ...formData, status: 'active' })}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">启用</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === 'inactive'}
                      onChange={() => setFormData({ ...formData, status: 'inactive' })}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">停用</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除分类 &ldquo;{categoryToDelete?.name}&rdquo; 吗？
            </DialogDescription>
          </DialogHeader>
          {categoryToDelete && categoryToDelete.productCount > 0 && (
            <div className="py-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
              该分类下还有 {categoryToDelete.productCount} 件商品，无法删除。
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={categoryToDelete?.productCount ? categoryToDelete.productCount > 0 : false}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
