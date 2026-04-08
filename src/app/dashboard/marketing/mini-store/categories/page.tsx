'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Plus,
  Edit,
  Trash2,
  FolderOpen,
  Package,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Image,
} from 'lucide-react';

// 分类数据类型
interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  sortOrder: number;
  productCount: number;
  status: 'active' | 'inactive';
  createTime: string;
}

export default function MiniStoreCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: '1',
      name: '水果',
      icon: '🍎',
      description: '新鲜水果，每日直采',
      sortOrder: 1,
      productCount: 45,
      status: 'active',
      createTime: '2024-01-01',
    },
    {
      id: '2',
      name: '蔬菜',
      icon: '🥬',
      description: '有机蔬菜，健康生活',
      sortOrder: 2,
      productCount: 38,
      status: 'active',
      createTime: '2024-01-01',
    },
    {
      id: '3',
      name: '乳制品',
      icon: '🥛',
      description: '鲜奶酸奶，营养美味',
      sortOrder: 3,
      productCount: 26,
      status: 'active',
      createTime: '2024-01-01',
    },
    {
      id: '4',
      name: '肉禽蛋',
      icon: '🥚',
      description: '优质肉类，放心品质',
      sortOrder: 4,
      productCount: 32,
      status: 'active',
      createTime: '2024-01-01',
    },
    {
      id: '5',
      name: '零食饮料',
      icon: '🍪',
      description: '精选零食，美味饮品',
      sortOrder: 5,
      productCount: 58,
      status: 'active',
      createTime: '2024-01-01',
    },
    {
      id: '6',
      name: '日用百货',
      icon: '🧴',
      description: '生活用品，一站购齐',
      sortOrder: 6,
      productCount: 72,
      status: 'active',
      createTime: '2024-01-01',
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const handleAddCategory = () => {
    setSelectedCategory({
      id: '',
      name: '',
      icon: '📦',
      description: '',
      sortOrder: categories.length + 1,
      productCount: 0,
      status: 'active',
      createTime: new Date().toISOString().split('T')[0],
    });
    setDialogOpen(true);
  };

  const handleSaveCategory = () => {
    if (selectedCategory) {
      if (selectedCategory.id) {
        setCategories(categories.map(c => c.id === selectedCategory.id ? selectedCategory : c));
      } else {
        setCategories([...categories, { ...selectedCategory, id: Date.now().toString() }]);
      }
      setDialogOpen(false);
    }
  };

  const handleMoveUp = (id: string) => {
    const index = categories.findIndex(c => c.id === id);
    if (index > 0) {
      const newCategories = [...categories];
      [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];
      // 更新排序
      newCategories.forEach((c, idx) => c.sortOrder = idx + 1);
      setCategories(newCategories);
    }
  };

  const handleMoveDown = (id: string) => {
    const index = categories.findIndex(c => c.id === id);
    if (index < categories.length - 1) {
      const newCategories = [...categories];
      [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
      // 更新排序
      newCategories.forEach((c, idx) => c.sortOrder = idx + 1);
      setCategories(newCategories);
    }
  };

  const handleToggleStatus = (id: string) => {
    setCategories(categories.map(c => 
      c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c
    ));
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="商城分类管理" description="管理小程序商城的商品分类">
        <Button onClick={handleAddCategory}>
          <Plus className="h-4 w-4 mr-2" />
          新增分类
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* 分类预览 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>分类预览</CardTitle>
              <CardDescription>小程序商城底部导航展示效果</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 justify-center">
                {categories.filter(c => c.status === 'active').map((category) => (
                  <div key={category.id} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="text-3xl">{category.icon}</span>
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 分类列表 */}
          <Card>
            <CardHeader>
              <CardTitle>分类列表</CardTitle>
              <CardDescription>
                共 {categories.length} 个分类，
                已启用 {categories.filter(c => c.status === 'active').length} 个
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">排序</TableHead>
                    <TableHead>分类信息</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>商品数</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category, index) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleMoveUp(category.id)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleMoveDown(category.id)}
                            disabled={index === categories.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{category.icon}</span>
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <div className="text-xs text-muted-foreground">
                              创建于 {category.createTime}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <span className="text-sm text-muted-foreground truncate block">
                          {category.description}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{category.productCount} 个</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.status === 'active' ? 'default' : 'secondary'}>
                          {category.status === 'active' ? '已启用' : '已禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(category.id)}
                          >
                            {category.status === 'active' ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCategories(categories.filter(c => c.id !== category.id))}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总分类数</p>
                    <p className="text-2xl font-bold">{categories.length}</p>
                  </div>
                  <FolderOpen className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总商品数</p>
                    <p className="text-2xl font-bold">
                      {categories.reduce((sum, c) => sum + c.productCount, 0)}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">已启用分类</p>
                    <p className="text-2xl font-bold">
                      {categories.filter(c => c.status === 'active').length}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 分类编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCategory?.id ? '编辑分类' : '新增分类'}</DialogTitle>
            <DialogDescription>
              配置商品分类信息
            </DialogDescription>
          </DialogHeader>
          
          {selectedCategory && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>分类名称</Label>
                <Input
                  value={selectedCategory.name}
                  onChange={(e) => setSelectedCategory({ ...selectedCategory, name: e.target.value })}
                  placeholder="请输入分类名称"
                />
              </div>
              
              <div className="space-y-2">
                <Label>分类图标</Label>
                <div className="flex gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-2xl">
                    {selectedCategory.icon}
                  </div>
                  <Input
                    value={selectedCategory.icon}
                    onChange={(e) => setSelectedCategory({ ...selectedCategory, icon: e.target.value })}
                    placeholder="选择图标"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>分类描述</Label>
                <Textarea
                  value={selectedCategory.description}
                  onChange={(e) => setSelectedCategory({ ...selectedCategory, description: e.target.value })}
                  placeholder="请输入分类描述"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>排序</Label>
                  <Input
                    type="number"
                    value={selectedCategory.sortOrder}
                    onChange={(e) => setSelectedCategory({ ...selectedCategory, sortOrder: Number(e.target.value) })}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>状态</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      checked={selectedCategory.status === 'active'}
                      onCheckedChange={(checked) => setSelectedCategory({
                        ...selectedCategory,
                        status: checked ? 'active' : 'inactive'
                      })}
                    />
                    <span className="text-sm">
                      {selectedCategory.status === 'active' ? '已启用' : '已禁用'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveCategory}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
