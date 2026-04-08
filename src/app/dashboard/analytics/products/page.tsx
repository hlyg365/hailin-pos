'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  TrendingUp,
  TrendingDown,
  Package,
  Calendar,
  Download,
  BarChart3,
  Tag,
  Layers,
  Star,
} from 'lucide-react';

// 模拟数据
const productStats = {
  totalProducts: 567,
  activeProducts: 523,
  lowStock: 23,
  outOfStock: 5,
  turnover: 2.3,
};

const topProducts = [
  { rank: 1, name: '可乐 330ml', category: '饮料', sales: 1256, amount: 4396.00, growth: 15.2, stock: 156 },
  { rank: 2, name: '矿泉水 500ml', category: '饮料', sales: 1089, amount: 2178.00, growth: 8.5, stock: 289 },
  { rank: 3, name: '薯片 原味', category: '零食', sales: 756, amount: 6048.00, growth: -2.3, stock: 45 },
  { rank: 4, name: '方便面 桶装', category: '速食', sales: 654, amount: 1962.00, growth: 5.8, stock: 78 },
  { rank: 5, name: '牛奶 250ml', category: '乳制品', sales: 523, amount: 2092.00, growth: 12.1, stock: 123 },
  { rank: 6, name: '酸奶 原味', category: '乳制品', sales: 489, amount: 1956.00, growth: 18.6, stock: 67 },
  { rank: 7, name: '饼干 巧克力味', category: '零食', sales: 445, amount: 1335.00, growth: -5.2, stock: 89 },
  { rank: 8, name: '面包 全麦', category: '烘焙', sales: 412, amount: 1236.00, growth: 8.9, stock: 34 },
  { rank: 9, name: '巧克力 牛奶巧克力', category: '零食', sales: 389, amount: 1945.00, growth: 6.7, stock: 56 },
  { rank: 10, name: '果汁 橙汁', category: '饮料', sales: 356, amount: 1068.00, growth: 9.3, stock: 67 },
];

const categoryStats = [
  { name: '饮料', sales: 54230.00, percentage: 43.2, growth: 10.5, products: 89 },
  { name: '零食', sales: 31245.00, percentage: 24.9, growth: 5.2, products: 156 },
  { name: '日化', sales: 18956.00, percentage: 15.1, growth: -3.1, products: 78 },
  { name: '乳制品', sales: 15678.00, percentage: 12.5, growth: 8.7, products: 45 },
  { name: '烘焙', sales: 12360.00, percentage: 9.8, growth: 12.3, products: 34 },
];

const lowStockProducts = [
  { name: '薯片 原味', stock: 8, minStock: 20, salesLast7Days: 45 },
  { name: '方便面 桶装', stock: 12, minStock: 30, salesLast7Days: 52 },
  { name: '酸奶 原味', stock: 5, minStock: 15, salesLast7Days: 38 },
  { name: '饼干 巧克力味', stock: 10, minStock: 25, salesLast7Days: 32 },
  { name: '牛奶 250ml', stock: 15, minStock: 40, salesLast7Days: 65 },
];

export default function ProductsAnalysisPage() {
  const [period, setPeriod] = useState('week');

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="商品分析"
        description="商品销售排行与品类分析"
      >
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">今日</SelectItem>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季度</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出报表
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="ranking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ranking">商品排行</TabsTrigger>
          <TabsTrigger value="category">品类分析</TabsTrigger>
          <TabsTrigger value="inventory">库存预警</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="space-y-4">
          {/* 商品概览卡片 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">在售商品</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productStats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  活跃 {productStats.activeProducts}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">低库存预警</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{productStats.lowStock}</div>
                <p className="text-xs text-muted-foreground">
                  需要补货
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">缺货商品</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{productStats.outOfStock}</div>
                <p className="text-xs text-muted-foreground">
                  立即补货
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">库存周转率</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productStats.turnover}</div>
                <p className="text-xs text-muted-foreground">
                  次/月
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">动销率</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92.3%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">↑ 3.2%</span> 较上周
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 商品销售排行 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                商品销售排行
              </CardTitle>
              <CardDescription>按销售额排序的商品排行</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">排名</TableHead>
                    <TableHead>商品名称</TableHead>
                    <TableHead>品类</TableHead>
                    <TableHead className="text-right">销量</TableHead>
                    <TableHead className="text-right">销售额</TableHead>
                    <TableHead className="text-right">环比</TableHead>
                    <TableHead className="text-right">库存</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product) => (
                    <TableRow key={product.rank}>
                      <TableCell>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          product.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                          product.rank === 2 ? 'bg-gray-100 text-gray-600' :
                          product.rank === 3 ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {product.rank}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {product.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{product.sales}</TableCell>
                      <TableCell className="text-right font-medium">
                        ¥{product.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={product.growth >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {product.growth >= 0 ? '↑' : '↓'} {Math.abs(product.growth)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={
                          product.stock < 20 ? 'text-red-500' :
                          product.stock < 50 ? 'text-orange-500' : 'text-green-500'
                        }>
                          {product.stock}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          {/* 品类销售分析 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                品类销售分析
              </CardTitle>
              <CardDescription>各品类销售额与占比</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryStats.map((category, index) => (
                  <div key={category.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Tag className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {category.products} 个商品
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">
                          ¥{category.sales.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          占比 {category.percentage}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={category.growth >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {category.growth >= 0 ? '↑' : '↓'} {Math.abs(category.growth)}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          {/* 库存预警 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-orange-500" />
                库存预警商品
              </CardTitle>
              <CardDescription>库存低于安全库存的商品</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品名称</TableHead>
                    <TableHead className="text-right">当前库存</TableHead>
                    <TableHead className="text-right">安全库存</TableHead>
                    <TableHead className="text-right">近7日销量</TableHead>
                    <TableHead className="text-right">状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right text-red-500 font-bold">
                        {product.stock}
                      </TableCell>
                      <TableCell className="text-right">{product.minStock}</TableCell>
                      <TableCell className="text-right">{product.salesLast7Days}</TableCell>
                      <TableCell className="text-right">
                        <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs">
                          需补货
                        </span>
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
  );
}
