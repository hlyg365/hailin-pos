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
import { Progress } from '@/components/ui/progress';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Package,
  ClipboardList,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  FileText,
  Download,
  Save,
  Clock,
  Barcode,
} from 'lucide-react';

interface StocktakeItem {
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  unit: string;
  systemStock: number;
  actualStock: number;
  variance: number;
  costPrice: number;
  varianceAmount: number;
}

interface Stocktake {
  id: string;
  stocktakeNo: string;
  name: string;
  type: 'full' | 'partial' | 'cycle';
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  operator: string;
  items: StocktakeItem[];
  totalVariance: number;
  totalVarianceAmount: number;
  remark?: string;
  createTime: string;
}

export default function StocktakePage() {
  const [stocktakes, setStocktakes] = useState<Stocktake[]>([
    {
      id: '1',
      stocktakeNo: 'ST20240315001',
      name: '月度盘点 - 2024年3月',
      type: 'full',
      status: 'completed',
      startTime: '2024-03-15 08:00:00',
      endTime: '2024-03-15 18:30:00',
      operator: '张三',
      items: [],
      totalVariance: 0,
      totalVarianceAmount: 0,
      createTime: '2024-03-14 16:00:00',
    },
    {
      id: '2',
      stocktakeNo: 'ST20240320001',
      name: '饮料类专项盘点',
      type: 'partial',
      status: 'in_progress',
      startTime: '2024-03-20 09:00:00',
      operator: '李四',
      items: [
        {
          productId: '1',
          productCode: 'P001',
          productName: '可乐 330ml',
          category: '饮料',
          unit: '罐',
          systemStock: 100,
          actualStock: 98,
          variance: -2,
          costPrice: 2.50,
          varianceAmount: -5.00,
        },
        {
          productId: '2',
          productCode: 'P002',
          productName: '矿泉水 500ml',
          category: '饮料',
          unit: '瓶',
          systemStock: 200,
          actualStock: 203,
          variance: 3,
          costPrice: 1.50,
          varianceAmount: 4.50,
        },
      ],
      totalVariance: 1,
      totalVarianceAmount: -0.50,
      remark: '饮料类商品盘点',
      createTime: '2024-03-19 17:00:00',
    },
    {
      id: '3',
      stocktakeNo: 'ST20240325001',
      name: '日化用品循环盘点',
      type: 'cycle',
      status: 'draft',
      operator: '王五',
      items: [],
      totalVariance: 0,
      totalVarianceAmount: 0,
      createTime: '2024-03-25 10:00:00',
    },
  ]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedStocktake, setSelectedStocktake] = useState<Stocktake | null>(
    null
  );
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    type: 'full' as const,
    remark: '',
  });

  // 当前正在盘点的商品列表（模拟）
  const [stocktakingItems, setStocktakingItems] = useState<StocktakeItem[]>([
    {
      productId: '1',
      productCode: 'P001',
      productName: '可乐 330ml',
      category: '饮料',
      unit: '罐',
      systemStock: 100,
      actualStock: 0,
      variance: 0,
      costPrice: 2.50,
      varianceAmount: 0,
    },
    {
      productId: '2',
      productCode: 'P002',
      productName: '矿泉水 500ml',
      category: '饮料',
      unit: '瓶',
      systemStock: 200,
      actualStock: 0,
      variance: 0,
      costPrice: 1.50,
      varianceAmount: 0,
    },
    {
      productId: '3',
      productCode: 'P003',
      productName: '薯片 原味',
      category: '零食',
      unit: '包',
      systemStock: 50,
      actualStock: 0,
      variance: 0,
      costPrice: 8.00,
      varianceAmount: 0,
    },
  ]);

  const handleCreateStocktake = () => {
    const newStocktake: Stocktake = {
      id: Date.now().toString(),
      stocktakeNo: `ST${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(stocktakes.length + 1).padStart(3, '0')}`,
      ...formData,
      status: 'draft',
      operator: '当前用户',
      items: [],
      totalVariance: 0,
      totalVarianceAmount: 0,
      createTime: new Date().toLocaleString(),
    };
    setStocktakes([...stocktakes, newStocktake]);
    setCreateDialogOpen(false);
    resetForm();
  };

  const handleStartStocktake = (stocktakeId: string) => {
    setStocktakes(
      stocktakes.map((st) =>
        st.id === stocktakeId
          ? {
              ...st,
              status: 'in_progress' as const,
              startTime: new Date().toLocaleString(),
            }
          : st
      )
    );
  };

  const handleCompleteStocktake = (stocktakeId: string) => {
    if (window.confirm('确定要完成本次盘点吗？完成后将锁定数据。')) {
      setStocktakes(
        stocktakes.map((st) =>
          st.id === stocktakeId
            ? {
                ...st,
                status: 'completed' as const,
                endTime: new Date().toLocaleString(),
              }
            : st
        )
      );
    }
  };

  const handleCancelStocktake = (stocktakeId: string) => {
    if (window.confirm('确定要取消本次盘点吗？')) {
      setStocktakes(
        stocktakes.map((st) =>
          st.id === stocktakeId
            ? { ...st, status: 'cancelled' as const }
            : st
        )
      );
    }
  };

  const handleViewDetail = (stocktake: Stocktake) => {
    setSelectedStocktake(stocktake);
    setDetailDialogOpen(true);
  };

  const handleUpdateActualStock = (productId: string, value: number) => {
    setStocktakingItems(
      stocktakingItems.map((item) => {
        if (item.productId === productId) {
          const variance = value - item.systemStock;
          return {
            ...item,
            actualStock: value,
            variance,
            varianceAmount: variance * item.costPrice,
          };
        }
        return item;
      })
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'full',
      remark: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-500">草稿</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">盘点中</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">已完成</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">已取消</Badge>;
      default:
        return <Badge>未知</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'full':
        return <Badge variant="outline">全面盘点</Badge>;
      case 'partial':
        return <Badge variant="outline">部分盘点</Badge>;
      case 'cycle':
        return <Badge variant="outline">循环盘点</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const filteredStocktakes = stocktakes.filter((st) => {
    const matchesSearch =
      st.name.includes(searchKeyword) || st.stocktakeNo.includes(searchKeyword);
    const matchesStatus =
      statusFilter === 'all' || st.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 计算当前盘点的进度
  const completedItems = stocktakingItems.filter((item) => item.actualStock > 0).length;
  const progress = (completedItems / stocktakingItems.length) * 100;
  const totalVariance = stocktakingItems.reduce((sum, item) => sum + item.variance, 0);
  const totalVarianceAmount = stocktakingItems.reduce((sum, item) => sum + item.varianceAmount, 0);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="库存盘点"
        description="进行库存盘点和差异分析"
      >
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          创建盘点单
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="stocktakes" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stocktakes">盘点记录</TabsTrigger>
              <TabsTrigger value="stocktaking">正在盘点</TabsTrigger>
            </TabsList>

            {/* 盘点记录 */}
            <TabsContent value="stocktakes" className="space-y-6">
              {/* 搜索和筛选 */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="search">搜索盘点</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="search"
                          placeholder="输入盘点单号或名称"
                          value={searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                        <Button>
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
                          <SelectItem value="draft">草稿</SelectItem>
                          <SelectItem value="in_progress">盘点中</SelectItem>
                          <SelectItem value="completed">已完成</SelectItem>
                          <SelectItem value="cancelled">已取消</SelectItem>
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
                          盘点单总数
                        </p>
                        <p className="text-2xl font-bold">{stocktakes.length}</p>
                      </div>
                      <ClipboardList className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          正在盘点
                        </p>
                        <p className="text-2xl font-bold">
                          {stocktakes.filter((st) => st.status === 'in_progress').length}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          已完成
                        </p>
                        <p className="text-2xl font-bold">
                          {stocktakes.filter((st) => st.status === 'completed').length}
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
                          差异总金额
                        </p>
                        <p className="text-2xl font-bold">
                          ¥{Math.abs(stocktakes.reduce((sum, st) => sum + st.totalVarianceAmount, 0)).toFixed(2)}
                        </p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 盘点列表 */}
              <Card>
                <CardHeader>
                  <CardTitle>盘点记录</CardTitle>
                  <CardDescription>
                    共 {filteredStocktakes.length} 条记录
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>盘点单</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>盘点人</TableHead>
                        <TableHead>盘点时间</TableHead>
                        <TableHead>盘点结果</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStocktakes.map((stocktake) => (
                        <TableRow key={stocktake.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{stocktake.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {stocktake.stocktakeNo}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(stocktake.type)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {stocktake.operator}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {stocktake.startTime?.split(' ')[0]}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>
                                差异数量: {stocktake.totalVariance}
                              </div>
                              <div className="text-muted-foreground">
                                差异金额: ¥{stocktake.totalVarianceAmount.toFixed(2)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(stocktake.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {stocktake.status === 'draft' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartStocktake(stocktake.id)}
                                >
                                  开始盘点
                                </Button>
                              )}
                              {stocktake.status === 'in_progress' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCompleteStocktake(stocktake.id)}
                                  >
                                    完成
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCancelStocktake(stocktake.id)}
                                  >
                                    取消
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetail(stocktake)}
                              >
                                详情
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {filteredStocktakes.length === 0 && (
                    <div className="text-center py-12">
                      <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        暂无盘点记录，点击右上角创建
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 正在盘点 */}
            <TabsContent value="stocktaking" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>饮料类专项盘点</CardTitle>
                      <CardDescription>
                        盘点单号: {stocktakes[1]?.stocktakeNo}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Save className="h-4 w-4 mr-2" />
                        暂存
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        导出
                      </Button>
                      <Button>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        完成盘点
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 进度统计 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        盘点进度
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="flex-1" />
                        <span className="text-sm font-medium">{completedItems}/{stocktakingItems.length}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        盘点差异
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`text-lg font-bold ${
                            totalVariance >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {totalVariance >= 0 ? '+' : ''}
                          {totalVariance}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        盘点差异金额
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          totalVarianceAmount >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {totalVarianceAmount >= 0 ? '+' : ''}
                        ¥{totalVarianceAmount.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        盘点人员
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm">张三</span>
                      </div>
                    </div>
                  </div>

                  {/* 扫码快速录入 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">快速录入</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Input
                          placeholder="扫描商品条码或输入商品编码"
                          className="flex-1"
                        />
                        <Button>
                          <Barcode className="h-4 w-4 mr-2" />
                          扫码
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 商品盘点列表 */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>商品</TableHead>
                        <TableHead>分类</TableHead>
                        <TableHead>系统库存</TableHead>
                        <TableHead>实际库存</TableHead>
                        <TableHead>差异</TableHead>
                        <TableHead>差异金额</TableHead>
                        <TableHead>状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stocktakingItems.map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.productName}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.productCode}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {item.systemStock} {item.unit}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.actualStock}
                              onChange={(e) =>
                                handleUpdateActualStock(
                                  item.productId,
                                  Number(e.target.value)
                                )
                              }
                              className="w-24"
                              min="0"
                            />
                          </TableCell>
                          <TableCell>
                            <div
                              className={`font-medium ${
                                item.variance === 0
                                  ? 'text-gray-500'
                                  : item.variance > 0
                                  ? 'text-green-500'
                                  : 'text-red-500'
                              }`}
                            >
                              {item.variance === 0
                                ? '-'
                                : item.variance > 0
                                ? `+${item.variance}`
                                : item.variance}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className={`font-medium ${
                                item.varianceAmount === 0
                                  ? 'text-gray-500'
                                  : item.varianceAmount > 0
                                  ? 'text-green-500'
                                  : 'text-red-500'
                              }`}
                            >
                              {item.varianceAmount === 0
                                ? '-'
                                : `¥${item.varianceAmount.toFixed(2)}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.actualStock > 0 ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-gray-400" />
                            )}
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

      {/* 创建盘点单对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>创建盘点单</DialogTitle>
            <DialogDescription>
              设置盘点单基本信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">盘点单名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="例如：月度盘点 - 2024年3月"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">盘点类型 *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">全面盘点</SelectItem>
                  <SelectItem value="partial">部分盘点</SelectItem>
                  <SelectItem value="cycle">循环盘点</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remark">备注</Label>
              <Textarea
                id="remark"
                value={formData.remark}
                onChange={(e) =>
                  setFormData({ ...formData, remark: e.target.value })
                }
                placeholder="备注信息"
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
            <Button onClick={handleCreateStocktake}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 盘点详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>盘点详情</DialogTitle>
            <DialogDescription>
              {selectedStocktake?.stocktakeNo}
            </DialogDescription>
          </DialogHeader>

          {selectedStocktake && (
            <div className="space-y-4 py-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">盘点名称：</span>
                  {selectedStocktake.name}
                </div>
                <div>
                  <span className="text-muted-foreground">盘点类型：</span>
                  {getTypeBadge(selectedStocktake.type)}
                </div>
                <div>
                  <span className="text-muted-foreground">盘点人：</span>
                  {selectedStocktake.operator}
                </div>
                <div>
                  <span className="text-muted-foreground">状态：</span>
                  {getStatusBadge(selectedStocktake.status)}
                </div>
                {selectedStocktake.startTime && (
                  <div>
                    <span className="text-muted-foreground">开始时间：</span>
                    {selectedStocktake.startTime}
                  </div>
                )}
                {selectedStocktake.endTime && (
                  <div>
                    <span className="text-muted-foreground">结束时间：</span>
                    {selectedStocktake.endTime}
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-muted-foreground">总差异：</span>
                  <span
                    className={`font-bold ${
                      selectedStocktake.totalVariance >= 0
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}
                  >
                    {selectedStocktake.totalVariance >= 0 ? '+' : ''}
                    {selectedStocktake.totalVariance}
                  </span>
                  <span className="ml-4">
                    <span className="text-muted-foreground">差异金额：</span>
                    <span
                      className={`font-bold ${
                        selectedStocktake.totalVarianceAmount >= 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {selectedStocktake.totalVarianceAmount >= 0 ? '+' : ''}
                      ¥{selectedStocktake.totalVarianceAmount.toFixed(2)}
                    </span>
                  </span>
                </div>
              </div>

              {selectedStocktake.remark && (
                <div className="space-y-2">
                  <Label>备注</Label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {selectedStocktake.remark}
                  </div>
                </div>
              )}

              {/* 盘点明细 */}
              {selectedStocktake.items.length > 0 && (
                <div className="space-y-2">
                  <Label>盘点明细</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>商品</TableHead>
                        <TableHead>系统库存</TableHead>
                        <TableHead>实际库存</TableHead>
                        <TableHead>差异</TableHead>
                        <TableHead>差异金额</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStocktake.items.map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.productName}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.productCode}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.systemStock}</TableCell>
                          <TableCell>{item.actualStock}</TableCell>
                          <TableCell
                            className={
                              item.variance === 0
                                ? ''
                                : item.variance > 0
                                ? 'text-green-500'
                                : 'text-red-500'
                            }
                          >
                            {item.variance === 0
                              ? '-'
                              : item.variance > 0
                              ? `+${item.variance}`
                              : item.variance}
                          </TableCell>
                          <TableCell
                            className={
                              item.varianceAmount === 0
                                ? ''
                                : item.varianceAmount > 0
                                ? 'text-green-500'
                                : 'text-red-500'
                            }
                          >
                            ¥{item.varianceAmount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              导出报告
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
