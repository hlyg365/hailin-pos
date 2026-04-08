'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Printer,
  Plus,
  Edit,
  Trash2,
  Settings,
  Wifi,
  Bluetooth,
  Usb,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  Tag,
  Truck,
  ShoppingCart,
  Copy,
  Eye,
  Download,
  Power,
  PowerOff,
  TestTube,
} from 'lucide-react';

// 打印机类型
type PrinterType = 'bluetooth' | 'wifi' | 'usb';

// 打印机状态
type PrinterStatus = 'online' | 'offline' | 'error';

// 打印用途
type PrinterUsage = 'receipt' | 'label' | 'delivery' | 'all';

// 打印机配置类型
interface PrinterConfig {
  id: string;
  name: string;
  type: PrinterType;
  status: PrinterStatus;
  usage: PrinterUsage;
  // 连接信息
  macAddress?: string; // 蓝牙MAC地址
  ipAddress?: string; // WiFi IP地址
  port?: number; // 端口
  // 打印设置
  paperWidth: 58 | 80; // 纸张宽度(mm)
  autoCut: boolean; // 自动切纸
  openCashDrawer: boolean; // 打开钱箱
  printCopies: number; // 打印份数
  // 模板设置
  headerText: string; // 小票头部文字
  footerText: string; // 小票底部文字
  showLogo: boolean; // 显示Logo
  showQrCode: boolean; // 显示二维码
  qrCodeContent: string; // 二维码内容
  // 统计信息
  totalPrints: number;
  lastPrintTime?: string;
  createTime: string;
}

// 打印记录类型
interface PrintRecord {
  id: string;
  type: 'receipt' | 'label' | 'delivery';
  typeName: string;
  printerName: string;
  content: string;
  orderId?: string;
  orderAmount?: number;
  itemCount?: number;
  status: 'success' | 'failed';
  errorMessage?: string;
  createTime: string;
}

// 打印机类型配置
const printerTypeConfig: Record<PrinterType, { label: string; icon: any; color: string }> = {
  bluetooth: { label: '蓝牙打印机', icon: Bluetooth, color: 'text-blue-600' },
  wifi: { label: 'WiFi打印机', icon: Wifi, color: 'text-green-600' },
  usb: { label: 'USB打印机', icon: Usb, color: 'text-purple-600' },
};

// 打印用途配置
const printerUsageConfig: Record<PrinterUsage, { label: string; icon: any }> = {
  receipt: { label: '小票打印', icon: FileText },
  label: { label: '价格签打印', icon: Tag },
  delivery: { label: '配送单打印', icon: Truck },
  all: { label: '全部用途', icon: Copy },
};

export default function PrinterSettingsPage() {
  // 打印机配置数据
  const [printers, setPrinters] = useState<PrinterConfig[]>([
    {
      id: 'printer_001',
      name: '前台小票打印机',
      type: 'bluetooth',
      status: 'online',
      usage: 'receipt',
      macAddress: '00:11:22:33:44:55',
      paperWidth: 80,
      autoCut: true,
      openCashDrawer: true,
      printCopies: 1,
      headerText: '海邻到家便利店',
      footerText: '感谢您的光临，欢迎再次惠顾！',
      showLogo: true,
      showQrCode: true,
      qrCodeContent: 'https://mp.weixin.qq.com/xxx',
      totalPrints: 1256,
      lastPrintTime: '2026-03-17 11:30:45',
      createTime: '2025-01-15 10:00:00',
    },
    {
      id: 'printer_002',
      name: '价格签打印机',
      type: 'usb',
      status: 'online',
      usage: 'label',
      paperWidth: 58,
      autoCut: true,
      openCashDrawer: false,
      printCopies: 1,
      headerText: '',
      footerText: '',
      showLogo: false,
      showQrCode: false,
      qrCodeContent: '',
      totalPrints: 523,
      lastPrintTime: '2026-03-17 09:15:20',
      createTime: '2025-02-20 14:30:00',
    },
    {
      id: 'printer_003',
      name: '外卖配送单打印机',
      type: 'wifi',
      status: 'online',
      usage: 'delivery',
      ipAddress: '192.168.1.100',
      port: 9100,
      paperWidth: 80,
      autoCut: true,
      openCashDrawer: false,
      printCopies: 2,
      headerText: '海邻到家 - 外卖配送单',
      footerText: '配送热线：400-888-8888',
      showLogo: true,
      showQrCode: true,
      qrCodeContent: 'https://hailin.com/order/',
      totalPrints: 89,
      lastPrintTime: '2026-03-17 11:45:10',
      createTime: '2025-03-01 09:00:00',
    },
    {
      id: 'printer_004',
      name: '备用打印机',
      type: 'bluetooth',
      status: 'offline',
      usage: 'all',
      macAddress: 'AA:BB:CC:DD:EE:FF',
      paperWidth: 80,
      autoCut: true,
      openCashDrawer: true,
      printCopies: 1,
      headerText: '海邻到家便利店',
      footerText: '感谢您的光临！',
      showLogo: true,
      showQrCode: false,
      qrCodeContent: '',
      totalPrints: 0,
      createTime: '2025-03-10 16:20:00',
    },
  ]);

  // 打印记录数据
  const [printRecords, setPrintRecords] = useState<PrintRecord[]>([
    {
      id: 'pr_001',
      type: 'receipt',
      typeName: '销售小票',
      printerName: '前台小票打印机',
      content: '订单号：POS20260317008',
      orderId: 'POS20260317008',
      orderAmount: 125.80,
      itemCount: 5,
      status: 'success',
      createTime: '2026-03-17 11:30:45',
    },
    {
      id: 'pr_002',
      type: 'delivery',
      typeName: '配送单',
      printerName: '外卖配送单打印机',
      content: '订单号：WX202603170001',
      orderId: 'WX202603170001',
      orderAmount: 54.20,
      itemCount: 3,
      status: 'success',
      createTime: '2026-03-17 11:15:20',
    },
    {
      id: 'pr_003',
      type: 'label',
      typeName: '价格签',
      printerName: '价格签打印机',
      content: '商品：进口香蕉 500g',
      itemCount: 1,
      status: 'success',
      createTime: '2026-03-17 09:15:20',
    },
    {
      id: 'pr_004',
      type: 'receipt',
      typeName: '销售小票',
      printerName: '前台小票打印机',
      content: '订单号：POS20260317007',
      orderId: 'POS20260317007',
      orderAmount: 45.60,
      itemCount: 3,
      status: 'failed',
      errorMessage: '打印机缺纸',
      createTime: '2026-03-17 10:45:30',
    },
  ]);

  const [selectedPrinter, setSelectedPrinter] = useState<PrinterConfig | null>(null);
  const [printerDialogOpen, setPrinterDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewType, setPreviewType] = useState<'receipt' | 'label' | 'delivery'>('receipt');
  const [formData, setFormData] = useState<Partial<PrinterConfig>>({});

  // 统计数据
  const stats = {
    total: printers.length,
    online: printers.filter(p => p.status === 'online').length,
    offline: printers.filter(p => p.status === 'offline').length,
    todayPrints: printRecords.filter(r => r.createTime.startsWith('2026-03-17') && r.status === 'success').length,
  };

  // 打开编辑对话框
  const handleEditPrinter = (printer: PrinterConfig | null) => {
    setSelectedPrinter(printer);
    if (printer) {
      setFormData({ ...printer });
    } else {
      setFormData({
        name: '',
        type: 'bluetooth',
        status: 'offline',
        usage: 'receipt',
        paperWidth: 80,
        autoCut: true,
        openCashDrawer: false,
        printCopies: 1,
        headerText: '海邻到家便利店',
        footerText: '感谢您的光临！',
        showLogo: true,
        showQrCode: false,
        qrCodeContent: '',
        totalPrints: 0,
        createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      });
    }
    setPrinterDialogOpen(true);
  };

  // 保存打印机配置
  const handleSavePrinter = () => {
    if (selectedPrinter) {
      setPrinters(printers.map(p => 
        p.id === selectedPrinter.id ? { ...p, ...formData } as PrinterConfig : p
      ));
    } else {
      const newPrinter: PrinterConfig = {
        id: `printer_${Date.now()}`,
        name: formData.name || '新打印机',
        type: formData.type as PrinterType || 'bluetooth',
        status: 'offline',
        usage: formData.usage as PrinterUsage || 'receipt',
        paperWidth: formData.paperWidth || 80,
        autoCut: formData.autoCut ?? true,
        openCashDrawer: formData.openCashDrawer ?? false,
        printCopies: formData.printCopies || 1,
        headerText: formData.headerText || '',
        footerText: formData.footerText || '',
        showLogo: formData.showLogo ?? false,
        showQrCode: formData.showQrCode ?? false,
        qrCodeContent: formData.qrCodeContent || '',
        totalPrints: 0,
        createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        ...(formData.type === 'bluetooth' && { macAddress: formData.macAddress }),
        ...(formData.type === 'wifi' && { ipAddress: formData.ipAddress, port: formData.port }),
      };
      setPrinters([...printers, newPrinter]);
    }
    setPrinterDialogOpen(false);
  };

  // 测试打印
  const handleTestPrint = (printer: PrinterConfig) => {
    // 模拟测试打印
    const record: PrintRecord = {
      id: `pr_${Date.now()}`,
      type: printer.usage === 'label' ? 'label' : printer.usage === 'delivery' ? 'delivery' : 'receipt',
      typeName: printer.usage === 'label' ? '价格签' : printer.usage === 'delivery' ? '配送单' : '测试小票',
      printerName: printer.name,
      content: '测试打印',
      status: 'success',
      createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setPrintRecords([record, ...printRecords]);
    alert(`测试打印已发送到 ${printer.name}`);
  };

  // 切换打印机状态
  const handleToggleStatus = (printer: PrinterConfig) => {
    const newStatus = printer.status === 'online' ? 'offline' : 'online';
    setPrinters(printers.map(p => 
      p.id === printer.id ? { ...p, status: newStatus } : p
    ));
  };

  // 删除打印机
  const handleDeletePrinter = (printer: PrinterConfig) => {
    if (confirm(`确定要删除打印机 "${printer.name}" 吗？`)) {
      setPrinters(printers.filter(p => p.id !== printer.id));
    }
  };

  // 获取状态徽章
  const getStatusBadge = (status: PrinterStatus) => {
    const config = {
      online: { label: '在线', color: 'bg-green-500', icon: CheckCircle },
      offline: { label: '离线', color: 'bg-gray-500', icon: PowerOff },
      error: { label: '异常', color: 'bg-red-500', icon: AlertCircle },
    };
    const { label, color, icon: Icon } = config[status];
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="打印设置" description="管理打印机和打印模板配置">
        <Button variant="outline" onClick={() => setPreviewDialogOpen(true)}>
          <Eye className="h-4 w-4 mr-2" />
          打印预览
        </Button>
        <Button onClick={() => handleEditPrinter(null)}>
          <Plus className="h-4 w-4 mr-2" />
          添加打印机
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Printer className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">打印机总数</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.online}</p>
                    <p className="text-sm text-muted-foreground">在线设备</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <PowerOff className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.offline}</p>
                    <p className="text-sm text-muted-foreground">离线设备</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FileText className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.todayPrints}</p>
                    <p className="text-sm text-muted-foreground">今日打印</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="printers" className="space-y-4">
            <TabsList>
              <TabsTrigger value="printers">
                <Printer className="h-4 w-4 mr-2" />
                打印机管理
              </TabsTrigger>
              <TabsTrigger value="templates">
                <FileText className="h-4 w-4 mr-2" />
                打印模板
              </TabsTrigger>
              <TabsTrigger value="records">
                <Copy className="h-4 w-4 mr-2" />
                打印记录
              </TabsTrigger>
            </TabsList>

            {/* 打印机管理 */}
            <TabsContent value="printers">
              <Card>
                <CardHeader>
                  <CardTitle>打印机列表</CardTitle>
                  <CardDescription>管理收银台连接的打印设备</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>打印机名称</TableHead>
                        <TableHead>连接类型</TableHead>
                        <TableHead>用途</TableHead>
                        <TableHead>纸张宽度</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>累计打印</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {printers.map(printer => {
                        const typeConfig = printerTypeConfig[printer.type];
                        const usageConfig = printerUsageConfig[printer.usage];
                        const TypeIcon = typeConfig.icon;
                        const UsageIcon = usageConfig.icon;
                        
                        return (
                          <TableRow key={printer.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Printer className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{printer.name}</p>
                                  {printer.type === 'bluetooth' && printer.macAddress && (
                                    <p className="text-xs text-muted-foreground">{printer.macAddress}</p>
                                  )}
                                  {printer.type === 'wifi' && printer.ipAddress && (
                                    <p className="text-xs text-muted-foreground">{printer.ipAddress}:{printer.port}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <TypeIcon className={`h-4 w-4 ${typeConfig.color}`} />
                                <span className="text-sm">{typeConfig.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <UsageIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{usageConfig.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>{printer.paperWidth}mm</TableCell>
                            <TableCell>{getStatusBadge(printer.status)}</TableCell>
                            <TableCell>{printer.totalPrints} 次</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleToggleStatus(printer)}
                                  title={printer.status === 'online' ? '禁用' : '启用'}
                                >
                                  {printer.status === 'online' ? (
                                    <Power className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <PowerOff className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleTestPrint(printer)}
                                  disabled={printer.status !== 'online'}
                                  title="测试打印"
                                >
                                  <TestTube className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleEditPrinter(printer)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeletePrinter(printer)}
                                  className="text-red-600"
                                >
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
            </TabsContent>

            {/* 打印模板 */}
            <TabsContent value="templates">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 小票模板 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                      销售小票
                    </CardTitle>
                    <CardDescription>收银台交易完成后的打印小票</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs space-y-2">
                      <div className="text-center font-bold">海邻到家便利店</div>
                      <div className="text-center text-gray-500">南山店</div>
                      <div className="border-t border-dashed pt-2">
                        <div>订单号：POS20260317008</div>
                        <div>时间：2026-03-17 11:30</div>
                        <div>收银员：张三</div>
                      </div>
                      <div className="border-t border-dashed pt-2">
                        <div className="flex justify-between">
                          <span>进口香蕉 500g</span>
                          <span>¥5.90</span>
                        </div>
                        <div className="flex justify-between">
                          <span>纯牛奶 250ml*12</span>
                          <span>¥35.90</span>
                        </div>
                      </div>
                      <div className="border-t border-dashed pt-2">
                        <div className="flex justify-between font-bold">
                          <span>合计</span>
                          <span>¥41.80</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>支付方式</span>
                          <span>微信支付</span>
                        </div>
                      </div>
                      <div className="border-t border-dashed pt-2 text-center text-gray-500">
                        感谢您的光临！
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      编辑模板
                    </Button>
                  </CardContent>
                </Card>

                {/* 价格签模板 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-green-600" />
                      价格签
                    </CardTitle>
                    <CardDescription>商品货架价格标签打印</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-white border-2 border-gray-200 p-4 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold mb-1">进口香蕉</div>
                        <div className="text-xs text-gray-500 mb-2">规格：500g/份</div>
                        <div className="text-3xl font-bold text-red-600">
                          ¥5.90
                        </div>
                        <div className="text-xs text-gray-400 mt-1 line-through">原价 ¥8.90</div>
                        <div className="mt-2 inline-block bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded">
                          会员专享
                        </div>
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      编辑模板
                    </Button>
                  </CardContent>
                </Card>

                {/* 配送单模板 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-orange-600" />
                      外卖配送单
                    </CardTitle>
                    <CardDescription>外卖订单配送单打印</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs space-y-2">
                      <div className="text-center font-bold text-base">海邻到家 - 外卖配送单</div>
                      <div className="border-t border-dashed pt-2">
                        <div><strong>订单号：</strong>WX202603170001</div>
                        <div><strong>下单时间：</strong>2026-03-17 10:23</div>
                      </div>
                      <div className="border-t border-dashed pt-2">
                        <div><strong>收货人：</strong>张三 138****8001</div>
                        <div><strong>地址：</strong>海邻小区A栋301</div>
                        <div><strong>备注：</strong>请放门口</div>
                      </div>
                      <div className="border-t border-dashed pt-2">
                        <div>进口香蕉 500g x2 ¥11.80</div>
                        <div>纯牛奶 250ml*12 x1 ¥35.90</div>
                      </div>
                      <div className="border-t border-dashed pt-2">
                        <div className="flex justify-between font-bold">
                          <span>订单金额</span>
                          <span>¥54.20</span>
                        </div>
                        <div className="flex justify-between">
                          <span>配送费</span>
                          <span>¥0.00</span>
                        </div>
                      </div>
                      <div className="border-t border-dashed pt-2 text-center">
                        <div className="text-gray-500">配送热线：400-888-8888</div>
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      编辑模板
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 打印记录 */}
            <TabsContent value="records">
              <Card>
                <CardHeader>
                  <CardTitle>打印记录</CardTitle>
                  <CardDescription>查看所有打印历史记录</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>打印类型</TableHead>
                        <TableHead>打印机</TableHead>
                        <TableHead>内容摘要</TableHead>
                        <TableHead>订单信息</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>打印时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {printRecords.map(record => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {record.type === 'receipt' && <ShoppingCart className="h-4 w-4 text-blue-600" />}
                              {record.type === 'label' && <Tag className="h-4 w-4 text-green-600" />}
                              {record.type === 'delivery' && <Truck className="h-4 w-4 text-orange-600" />}
                              <span>{record.typeName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{record.printerName}</TableCell>
                          <TableCell className="max-w-48 truncate">{record.content}</TableCell>
                          <TableCell>
                            {record.orderId && (
                              <div className="text-sm">
                                <div>{record.orderId}</div>
                                {record.orderAmount && (
                                  <div className="text-muted-foreground">¥{record.orderAmount}</div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={record.status === 'success' ? 'bg-green-500' : 'bg-red-500'}>
                              {record.status === 'success' ? '成功' : '失败'}
                            </Badge>
                            {record.errorMessage && (
                              <p className="text-xs text-red-500 mt-1">{record.errorMessage}</p>
                            )}
                          </TableCell>
                          <TableCell>{record.createTime}</TableCell>
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

      {/* 打印机配置对话框 */}
      <Dialog open={printerDialogOpen} onOpenChange={setPrinterDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPrinter ? '编辑打印机' : '添加打印机'}</DialogTitle>
            <DialogDescription>
              配置打印机连接参数和打印选项
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h4 className="font-medium">基本信息</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>打印机名称</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：前台小票打印机"
                  />
                </div>
                <div className="space-y-2">
                  <Label>连接类型</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as PrinterType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bluetooth">蓝牙打印机</SelectItem>
                      <SelectItem value="wifi">WiFi打印机</SelectItem>
                      <SelectItem value="usb">USB打印机</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>用途</Label>
                  <Select value={formData.usage} onValueChange={(value) => setFormData({ ...formData, usage: value as PrinterUsage })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receipt">小票打印</SelectItem>
                      <SelectItem value="label">价格签打印</SelectItem>
                      <SelectItem value="delivery">配送单打印</SelectItem>
                      <SelectItem value="all">全部用途</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>纸张宽度</Label>
                  <Select value={String(formData.paperWidth)} onValueChange={(value) => setFormData({ ...formData, paperWidth: Number(value) as 58 | 80 })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58">58mm</SelectItem>
                      <SelectItem value="80">80mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 连接信息 */}
            <div className="space-y-4">
              <h4 className="font-medium">连接信息</h4>
              {formData.type === 'bluetooth' && (
                <div className="space-y-2">
                  <Label>蓝牙MAC地址</Label>
                  <Input
                    value={formData.macAddress || ''}
                    onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                    placeholder="00:11:22:33:44:55"
                  />
                </div>
              )}
              {formData.type === 'wifi' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>IP地址</Label>
                    <Input
                      value={formData.ipAddress || ''}
                      onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                      placeholder="192.168.1.100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>端口</Label>
                    <Input
                      type="number"
                      value={formData.port || ''}
                      onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                      placeholder="9100"
                    />
                  </div>
                </div>
              )}
              {formData.type === 'usb' && (
                <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
                  USB打印机将自动检测连接，无需额外配置
                </div>
              )}
            </div>

            {/* 打印设置 */}
            <div className="space-y-4">
              <h4 className="font-medium">打印设置</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>打印份数</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={formData.printCopies || 1}
                    onChange={(e) => setFormData({ ...formData, printCopies: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoCut}
                      onChange={(e) => setFormData({ ...formData, autoCut: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">自动切纸</span>
                  </label>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.openCashDrawer}
                      onChange={(e) => setFormData({ ...formData, openCashDrawer: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">打开钱箱</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 小票内容 */}
            {formData.usage !== 'label' && (
              <div className="space-y-4">
                <h4 className="font-medium">小票内容</h4>
                <div className="space-y-2">
                  <Label>头部文字</Label>
                  <Input
                    value={formData.headerText || ''}
                    onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                    placeholder="店铺名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label>底部文字</Label>
                  <Input
                    value={formData.footerText || ''}
                    onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                    placeholder="感谢语或宣传语"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.showLogo}
                      onChange={(e) => setFormData({ ...formData, showLogo: e.target.checked })}
                      className="rounded"
                    />
                    <Label className="cursor-pointer">显示Logo</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.showQrCode}
                      onChange={(e) => setFormData({ ...formData, showQrCode: e.target.checked })}
                      className="rounded"
                    />
                    <Label className="cursor-pointer">显示二维码</Label>
                  </div>
                </div>
                {formData.showQrCode && (
                  <div className="space-y-2">
                    <Label>二维码内容</Label>
                    <Input
                      value={formData.qrCodeContent || ''}
                      onChange={(e) => setFormData({ ...formData, qrCodeContent: e.target.value })}
                      placeholder="小程序链接或其他内容"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPrinterDialogOpen(false)}>取消</Button>
            <Button onClick={handleSavePrinter}>保存配置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 打印预览对话框 */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>打印预览</DialogTitle>
            <DialogDescription>
              预览各类打印模板效果
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button 
                variant={previewType === 'receipt' ? 'default' : 'outline'}
                onClick={() => setPreviewType('receipt')}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                销售小票
              </Button>
              <Button 
                variant={previewType === 'label' ? 'default' : 'outline'}
                onClick={() => setPreviewType('label')}
              >
                <Tag className="h-4 w-4 mr-2" />
                价格签
              </Button>
              <Button 
                variant={previewType === 'delivery' ? 'default' : 'outline'}
                onClick={() => setPreviewType('delivery')}
              >
                <Truck className="h-4 w-4 mr-2" />
                配送单
              </Button>
            </div>

            <div className="flex justify-center bg-gray-100 p-8 rounded-lg">
              {previewType === 'receipt' && (
                <div className="bg-white w-80 p-4 font-mono text-sm shadow-lg">
                  <div className="text-center font-bold text-lg">海邻到家便利店</div>
                  <div className="text-center text-gray-500 text-xs mt-1">南山店 | 电话：0755-8888-0001</div>
                  <div className="border-t border-dashed my-3 pt-3 text-xs">
                    <div className="flex justify-between">
                      <span>订单号：</span>
                      <span>POS20260317008</span>
                    </div>
                    <div className="flex justify-between">
                      <span>时间：</span>
                      <span>2026-03-17 11:30:45</span>
                    </div>
                    <div className="flex justify-between">
                      <span>收银员：</span>
                      <span>张三</span>
                    </div>
                    <div className="flex justify-between">
                      <span>会员：</span>
                      <span>138****8001 (钻石)</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed my-3 pt-3 text-xs">
                    <div className="flex justify-between py-1">
                      <span>进口香蕉 500g x2</span>
                      <span>¥11.80</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>纯牛奶 250ml*12</span>
                      <span>¥35.90</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>有机西红柿 500g</span>
                      <span>¥6.50</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed my-3 pt-3 text-xs">
                    <div className="flex justify-between py-1">
                      <span>商品小计</span>
                      <span>¥54.20</span>
                    </div>
                    <div className="flex justify-between py-1 text-red-500">
                      <span>会员折扣(85折)</span>
                      <span>-¥8.13</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold text-base border-t mt-2 pt-2">
                      <span>实收金额</span>
                      <span className="text-red-600">¥46.07</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed my-3 pt-3 text-xs">
                    <div className="flex justify-between">
                      <span>支付方式</span>
                      <span>微信支付</span>
                    </div>
                    <div className="flex justify-between">
                      <span>获得积分</span>
                      <span className="text-orange-600">+92</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed my-3 pt-3 text-center text-xs text-gray-500">
                    <div>感谢您的光临，欢迎再次惠顾！</div>
                    <div className="mt-2">
                      <div className="inline-block w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        二维码
                      </div>
                    </div>
                    <div className="mt-1">扫码关注小程序</div>
                  </div>
                </div>
              )}

              {previewType === 'label' && (
                <div className="flex gap-4">
                  <div className="bg-white w-48 p-4 border-2 border-gray-300 shadow-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold">进口香蕉</div>
                      <div className="text-xs text-gray-500 mt-1">规格：500g/份</div>
                      <div className="text-3xl font-bold text-red-600 mt-2">
                        ¥5.90
                      </div>
                      <div className="text-xs text-gray-400 line-through mt-1">原价 ¥8.90</div>
                      <div className="mt-2 inline-block bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded">
                        会员专享
                      </div>
                    </div>
                  </div>
                  <div className="bg-white w-48 p-4 border-2 border-gray-300 shadow-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold">纯牛奶</div>
                      <div className="text-xs text-gray-500 mt-1">规格：250ml*12盒</div>
                      <div className="text-3xl font-bold text-green-600 mt-2">
                        ¥35.90
                      </div>
                      <div className="text-xs text-gray-400 line-through mt-1">原价 ¥42.00</div>
                      <div className="mt-2 inline-block bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded">
                        限时特价
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {previewType === 'delivery' && (
                <div className="bg-white w-80 p-4 font-mono text-sm shadow-lg">
                  <div className="text-center font-bold text-lg border-b pb-2">海邻到家 - 外卖配送单</div>
                  <div className="mt-3 text-xs">
                    <div className="flex justify-between">
                      <span className="font-bold">订单号：</span>
                      <span>WX202603170001</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="font-bold">下单时间：</span>
                      <span>2026-03-17 10:23:45</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed mt-3 pt-3 text-xs">
                    <div className="font-bold mb-2">【收货信息】</div>
                    <div className="flex justify-between">
                      <span>收货人：</span>
                      <span>张三 138****8001</span>
                    </div>
                    <div className="mt-1">
                      <span>地址：</span>
                      <span className="block ml-12">深圳市南山区海邻小区A栋301</span>
                    </div>
                    <div className="mt-1">
                      <span>备注：</span>
                      <span className="text-orange-600">请放门口，谢谢</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed mt-3 pt-3 text-xs">
                    <div className="font-bold mb-2">【商品明细】</div>
                    <div className="flex justify-between py-1">
                      <span>进口香蕉 500g x2</span>
                      <span>¥11.80</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>纯牛奶 250ml*12 x1</span>
                      <span>¥35.90</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>有机西红柿 500g x1</span>
                      <span>¥6.50</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed mt-3 pt-3 text-xs">
                    <div className="flex justify-between py-1">
                      <span>商品小计</span>
                      <span>¥54.20</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>配送费</span>
                      <span>¥0.00</span>
                    </div>
                    <div className="flex justify-between py-1 text-red-500">
                      <span>优惠券</span>
                      <span>-¥5.00</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold text-base border-t mt-2 pt-2">
                      <span>订单金额</span>
                      <span className="text-red-600">¥49.20</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed mt-3 pt-3 text-center text-xs text-gray-500">
                    <div>配送热线：400-888-8888</div>
                    <div className="mt-1">如有问题请及时联系我们</div>
                  </div>
                  <div className="mt-3 flex justify-center">
                    <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-xs">
                      二维码
                    </div>
                  </div>
                  <div className="text-center text-xs text-gray-400 mt-1">扫码查看订单详情</div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>关闭</Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              打印测试
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
