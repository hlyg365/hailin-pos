'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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
  Truck,
  Package,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Store,
  Calendar,
  Download,
  Filter,
  BarChart3,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Minus,
} from 'lucide-react';

// 店铺列表
const stores = [
  { id: 'all', name: '全部店铺' },
  { id: 'store_001', name: '南山店' },
  { id: 'store_002', name: '福田店' },
  { id: 'store_003', name: '罗湖店' },
  { id: 'store_004', name: '宝安店' },
];

// 汇总数据
const summaryData = {
  purchase: {
    totalAmount: 328500.00,
    totalOrders: 86,
    completedOrders: 78,
    pendingOrders: 5,
    shippedOrders: 3,
    totalItems: 28560,
  },
  sales: {
    totalAmount: 456800.00,
    totalOrders: 3562,
    totalItems: 28950,
    avgOrderValue: 128.20,
  },
  outbound: {
    total: 35280,
    sales: 28950,
    transfer: 4850,
    loss: 1480,
  },
  transfer: {
    total: 35,
    completed: 32,
    pending: 3,
    totalItems: 4850,
  },
};

// 采购记录
const purchaseRecords = [
  { id: 'PO202503170001', supplier: '可口可乐公司', store: '南山店', amount: 12500.00, items: 120, status: 'pending', createTime: '2025-03-17 10:30' },
  { id: 'PO202503170002', supplier: '农夫山泉', store: '福田店', amount: 8600.00, items: 85, status: 'completed', createTime: '2025-03-17 09:15' },
  { id: 'PO202503160001', supplier: '乐事公司', store: '罗湖店', amount: 5280.00, items: 60, status: 'completed', createTime: '2025-03-16 14:20' },
  { id: 'PO202503160002', supplier: '蒙牛乳业', store: '宝安店', amount: 15800.00, items: 200, status: 'shipped', createTime: '2025-03-16 11:00' },
  { id: 'PO202503150001', supplier: '统一企业', store: '南山店', amount: 9200.00, items: 95, status: 'completed', createTime: '2025-03-15 16:45' },
  { id: 'PO202503150002', supplier: '康师傅', store: '福田店', amount: 7800.00, items: 80, status: 'completed', createTime: '2025-03-15 13:30' },
];

// 出库记录
const outboundRecords = [
  { id: 'OUT202503170001', type: 'sales', store: '南山店', product: '矿泉水 500ml', quantity: 50, reason: '销售出库', time: '2025-03-17 11:30' },
  { id: 'OUT202503170002', type: 'transfer', store: '福田店', product: '可乐 330ml', quantity: 30, reason: '调拨至罗湖店', time: '2025-03-17 10:00' },
  { id: 'OUT202503170003', type: 'loss', store: '罗湖店', product: '苹果 红富士', quantity: 5, reason: '损耗', time: '2025-03-17 09:00' },
  { id: 'OUT202503160001', type: 'sales', store: '宝安店', product: '牛奶 250ml', quantity: 80, reason: '销售出库', time: '2025-03-16 18:00' },
  { id: 'OUT202503160002', type: 'transfer', store: '南山店', product: '薯片', quantity: 20, reason: '调拨至福田店', time: '2025-03-16 15:00' },
];

// 调拨记录
const transferRecords = [
  { id: 'TF202503170001', from: '南山店', to: '福田店', items: 5, quantity: 50, status: 'pending', createTime: '2025-03-17 11:00' },
  { id: 'TF202503160001', from: '福田店', to: '罗湖店', items: 8, quantity: 80, status: 'completed', createTime: '2025-03-16 15:30' },
  { id: 'TF202503160002', from: '宝安店', to: '南山店', items: 3, quantity: 30, status: 'completed', createTime: '2025-03-16 10:00' },
  { id: 'TF202503150001', from: '罗湖店', to: '宝安店', items: 6, quantity: 60, status: 'completed', createTime: '2025-03-15 14:00' },
];

// 店铺进销存汇总
const storePSASummary = [
  { store: '南山店', purchase: 85600, sales: 125800, transferIn: 12500, transferOut: 8500, stock: 32560, stockValue: 168500 },
  { store: '福田店', purchase: 72300, sales: 98500, transferIn: 8500, transferOut: 12000, stock: 28450, stockValue: 142300 },
  { store: '罗湖店', purchase: 65800, sales: 85600, transferIn: 12000, transferOut: 5000, stock: 35120, stockValue: 175600 },
  { store: '宝安店', purchase: 104800, sales: 146900, transferIn: 5000, transferOut: 8000, stock: 31200, stockValue: 156000 },
];

export default function PSAReportPage() {
  const [selectedStore, setSelectedStore] = useState('all');
  const [dateRange, setDateRange] = useState('month');

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      pending: { label: '待处理', className: 'bg-yellow-100 text-yellow-700' },
      completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
      shipped: { label: '配送中', className: 'bg-blue-100 text-blue-700' },
    };
    return configs[status] || configs.pending;
  };

  // 获取出库类型配置
  const getOutboundTypeConfig = (type: string) => {
    const configs: Record<string, { label: string; className: string; icon: typeof Package }> = {
      sales: { label: '销售', className: 'bg-blue-100 text-blue-700', icon: Package },
      transfer: { label: '调拨', className: 'bg-purple-100 text-purple-700', icon: ArrowRightLeft },
      loss: { label: '损耗', className: 'bg-red-100 text-red-700', icon: AlertTriangle },
    };
    return configs[type] || configs.sales;
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="进销存报表"
        description="采购、销售、库存全方位数据分析"
        showStoreSelector={false}
      >
        <div className="flex items-center gap-2">
          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger className="w-32">
              <Store className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stores.map(store => (
                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-28">
              <Calendar className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">今日</SelectItem>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季度</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            导出报表
          </Button>
        </div>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        {/* 核心指标 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Truck className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">采购总额</div>
                  <div className="text-xl font-bold">¥{summaryData.purchase.totalAmount.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">销售总额</div>
                  <div className="text-xl font-bold">¥{summaryData.sales.totalAmount.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <ArrowRightLeft className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">调拨次数</div>
                  <div className="text-xl font-bold">{summaryData.transfer.total}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <Package className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">出库总量</div>
                  <div className="text-xl font-bold">{summaryData.outbound.total.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="purchase" className="w-full">
          <div className="border-b px-4 pt-4">
            <TabsList>
              <TabsTrigger value="purchase">
                <Truck className="h-4 w-4 mr-1" />
                采购管理
              </TabsTrigger>
              <TabsTrigger value="outbound">
                <Package className="h-4 w-4 mr-1" />
                出库管理
              </TabsTrigger>
              <TabsTrigger value="transfer">
                <ArrowRightLeft className="h-4 w-4 mr-1" />
                调拨管理
              </TabsTrigger>
              <TabsTrigger value="store">
                <Store className="h-4 w-4 mr-1" />
                店铺汇总
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-4">
            {/* 采购管理 */}
            <TabsContent value="purchase">
              <div className="space-y-4">
                {/* 采购统计 */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-green-50">
                    <div className="text-sm text-muted-foreground">采购单数</div>
                    <div className="text-xl font-bold">{summaryData.purchase.totalOrders}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50">
                    <div className="text-sm text-muted-foreground">已完成</div>
                    <div className="text-xl font-bold text-green-600">{summaryData.purchase.completedOrders}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-50">
                    <div className="text-sm text-muted-foreground">待处理</div>
                    <div className="text-xl font-bold text-yellow-600">{summaryData.purchase.pendingOrders}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50">
                    <div className="text-sm text-muted-foreground">配送中</div>
                    <div className="text-xl font-bold text-blue-600">{summaryData.purchase.shippedOrders}</div>
                  </div>
                </div>

                {/* 采购记录表 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">采购记录</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>采购单号</TableHead>
                          <TableHead>供应商</TableHead>
                          <TableHead>店铺</TableHead>
                          <TableHead className="text-right">金额</TableHead>
                          <TableHead className="text-right">商品数</TableHead>
                          <TableHead className="text-center">状态</TableHead>
                          <TableHead>创建时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseRecords.map(record => {
                          const statusConfig = getStatusConfig(record.status);
                          return (
                            <TableRow key={record.id}>
                              <TableCell className="font-mono text-sm">{record.id}</TableCell>
                              <TableCell>{record.supplier}</TableCell>
                              <TableCell>{record.store}</TableCell>
                              <TableCell className="text-right font-medium">¥{record.amount.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{record.items}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{record.createTime}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 出库管理 */}
            <TabsContent value="outbound">
              <div className="space-y-4">
                {/* 出库统计 */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50">
                    <div className="text-sm text-muted-foreground">出库总量</div>
                    <div className="text-xl font-bold">{summaryData.outbound.total.toLocaleString()}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50">
                    <div className="text-sm text-muted-foreground">销售出库</div>
                    <div className="text-xl font-bold text-blue-600">{summaryData.outbound.sales.toLocaleString()}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50">
                    <div className="text-sm text-muted-foreground">调拨出库</div>
                    <div className="text-xl font-bold text-purple-600">{summaryData.outbound.transfer.toLocaleString()}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50">
                    <div className="text-sm text-muted-foreground">损耗出库</div>
                    <div className="text-xl font-bold text-red-600">{summaryData.outbound.loss.toLocaleString()}</div>
                  </div>
                </div>

                {/* 出库记录表 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">出库记录</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>出库单号</TableHead>
                          <TableHead>类型</TableHead>
                          <TableHead>店铺</TableHead>
                          <TableHead>商品</TableHead>
                          <TableHead className="text-right">数量</TableHead>
                          <TableHead>原因</TableHead>
                          <TableHead>时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {outboundRecords.map(record => {
                          const typeConfig = getOutboundTypeConfig(record.type);
                          return (
                            <TableRow key={record.id}>
                              <TableCell className="font-mono text-sm">{record.id}</TableCell>
                              <TableCell>
                                <Badge className={typeConfig.className}>{typeConfig.label}</Badge>
                              </TableCell>
                              <TableCell>{record.store}</TableCell>
                              <TableCell>{record.product}</TableCell>
                              <TableCell className="text-right font-medium">{record.quantity}</TableCell>
                              <TableCell>{record.reason}</TableCell>
                              <TableCell className="text-muted-foreground">{record.time}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 调拨管理 */}
            <TabsContent value="transfer">
              <div className="space-y-4">
                {/* 调拨统计 */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-purple-50">
                    <div className="text-sm text-muted-foreground">调拨总次数</div>
                    <div className="text-xl font-bold">{summaryData.transfer.total}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50">
                    <div className="text-sm text-muted-foreground">已完成</div>
                    <div className="text-xl font-bold text-green-600">{summaryData.transfer.completed}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-50">
                    <div className="text-sm text-muted-foreground">待处理</div>
                    <div className="text-xl font-bold text-yellow-600">{summaryData.transfer.pending}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50">
                    <div className="text-sm text-muted-foreground">调拨商品数</div>
                    <div className="text-xl font-bold">{summaryData.transfer.totalItems.toLocaleString()}</div>
                  </div>
                </div>

                {/* 调拨记录表 */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">调拨记录</CardTitle>
                      <Button size="sm" asChild>
                        <a href="/inventory/transfer">
                          <ArrowRightLeft className="h-4 w-4 mr-1" />
                          新建调拨
                        </a>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>调拨单号</TableHead>
                          <TableHead>调出店铺</TableHead>
                          <TableHead></TableHead>
                          <TableHead>调入店铺</TableHead>
                          <TableHead className="text-right">商品种类</TableHead>
                          <TableHead className="text-right">总数量</TableHead>
                          <TableHead className="text-center">状态</TableHead>
                          <TableHead>创建时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transferRecords.map(record => {
                          const statusConfig = getStatusConfig(record.status);
                          return (
                            <TableRow key={record.id}>
                              <TableCell className="font-mono text-sm">{record.id}</TableCell>
                              <TableCell>{record.from}</TableCell>
                              <TableCell className="text-center">
                                <ArrowRightLeft className="h-4 w-4 text-purple-500 mx-auto" />
                              </TableCell>
                              <TableCell>{record.to}</TableCell>
                              <TableCell className="text-right">{record.items}</TableCell>
                              <TableCell className="text-right font-medium">{record.quantity}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{record.createTime}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 店铺汇总 */}
            <TabsContent value="store">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">各店铺进销存汇总</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>店铺</TableHead>
                        <TableHead className="text-right">采购额</TableHead>
                        <TableHead className="text-right">销售额</TableHead>
                        <TableHead className="text-right">调入</TableHead>
                        <TableHead className="text-right">调出</TableHead>
                        <TableHead className="text-right">当前库存</TableHead>
                        <TableHead className="text-right">库存价值</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {storePSASummary.map(item => (
                        <TableRow key={item.store}>
                          <TableCell className="font-medium">{item.store}</TableCell>
                          <TableCell className="text-right text-green-600">¥{item.purchase.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-blue-600">¥{item.sales.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-purple-600">+{item.transferIn.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-purple-600">-{item.transferOut.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-bold">{item.stock.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">¥{item.stockValue.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {/* 合计行 */}
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-bold">合计</TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          ¥{storePSASummary.reduce((sum, item) => sum + item.purchase, 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-600">
                          ¥{storePSASummary.reduce((sum, item) => sum + item.sales, 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold text-purple-600">
                          +{storePSASummary.reduce((sum, item) => sum + item.transferIn, 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold text-purple-600">
                          -{storePSASummary.reduce((sum, item) => sum + item.transferOut, 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {storePSASummary.reduce((sum, item) => sum + item.stock, 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ¥{storePSASummary.reduce((sum, item) => sum + item.stockValue, 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </CardContent>
        </Tabs>
      </div>
    </div>
  );
}
