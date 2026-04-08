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
  Users,
  UserPlus,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Store,
  MessageCircle,
  Star,
  TrendingUp,
  Package,
  Eye,
  EyeOff,
  Plus,
  Award,
  DollarSign,
  ShoppingCart,
  Calendar,
  CheckCircle,
} from 'lucide-react';

// 团长数据类型
interface GroupLeader {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  wechat: string;
  storeId: string;
  storeName: string;
  community: string;
  address: string;
  groups: string[];
  status: 'active' | 'inactive';
  level: 1 | 2 | 3 | 4 | 5;
  totalSales: number;
  totalOrders: number;
  commission: number;
  createTime: string;
}

// 接龙订单类型
interface LeaderOrder {
  id: string;
  orderNo: string;
  dragonId: string;
  dragonTitle: string;
  customerName: string;
  customerPhone: string;
  quantity: number;
  amount: number;
  commissionAmount: number;
  status: 'pending' | 'paid' | 'settled';
  createTime: string;
  payTime?: string;
  settleTime?: string;
}

export default function GroupLeadersPage() {
  const [leaders, setLeaders] = useState<GroupLeader[]>([
    {
      id: '1',
      name: '王大姐',
      avatar: '👩',
      phone: '138****1234',
      wechat: 'wangdajie_001',
      storeId: 'store_001',
      storeName: '海邻到家南山店',
      community: '海邻小区',
      address: '深圳市南山区科技园南区海邻小区A栋1楼',
      groups: ['海邻小区业主群', '海邻团购2群'],
      status: 'active',
      level: 5,
      totalSales: 125680,
      totalOrders: 358,
      commission: 6284,
      createTime: '2024-01-15',
    },
    {
      id: '2',
      name: '张阿姨',
      avatar: '👵',
      phone: '139****5678',
      wechat: 'zhanga_002',
      storeId: 'store_001',
      storeName: '海邻到家南山店',
      community: '阳光花园',
      address: '深圳市南山区阳光花园B栋301',
      groups: ['阳光花园团购群'],
      status: 'active',
      level: 4,
      totalSales: 89650,
      totalOrders: 245,
      commission: 4482,
      createTime: '2024-02-20',
    },
    {
      id: '3',
      name: '李大哥',
      avatar: '👨',
      phone: '137****9012',
      wechat: 'librother_003',
      storeId: 'store_002',
      storeName: '海邻到家福田店',
      community: '翠海花园',
      address: '深圳市福田区翠海花园C栋502',
      groups: ['翠海花园业主群', '翠海团购VIP群'],
      status: 'active',
      level: 3,
      totalSales: 45230,
      totalOrders: 128,
      commission: 2261,
      createTime: '2024-03-10',
    },
    {
      id: '4',
      name: '陈姐',
      avatar: '👩‍💼',
      phone: '136****3456',
      wechat: 'chenjie_004',
      storeId: 'store_001',
      storeName: '海邻到家南山店',
      community: '科技公寓',
      address: '深圳市南山区科技公寓D栋1201',
      groups: ['科技公寓团购群'],
      status: 'inactive',
      level: 2,
      totalSales: 18960,
      totalOrders: 56,
      commission: 948,
      createTime: '2024-04-05',
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<GroupLeader | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    wechat: '',
    storeId: '',
    community: '',
    address: '',
  });

  // 业绩详情弹窗
  const [performanceDialogOpen, setPerformanceDialogOpen] = useState(false);
  const [selectedLeaderForPerformance, setSelectedLeaderForPerformance] = useState<GroupLeader | null>(null);

  // 模拟团长关联的接龙订单
  const [leaderOrders, setLeaderOrders] = useState<LeaderOrder[]>([
    {
      id: '1',
      orderNo: 'JL202603170001',
      dragonId: '1',
      dragonTitle: '新鲜草莓 3斤装',
      customerName: '张三',
      customerPhone: '138****1234',
      quantity: 2,
      amount: 118,
      commissionAmount: 5.9,
      status: 'paid',
      createTime: '2026-03-17 08:15:23',
      payTime: '2026-03-17 08:15:45',
    },
    {
      id: '2',
      orderNo: 'JL202603170002',
      dragonId: '1',
      dragonTitle: '新鲜草莓 3斤装',
      customerName: '李四',
      customerPhone: '139****5678',
      quantity: 1,
      amount: 59,
      commissionAmount: 2.95,
      status: 'pending',
      createTime: '2026-03-17 08:20:12',
    },
    {
      id: '3',
      orderNo: 'JL202603160001',
      dragonId: '2',
      dragonTitle: '进口车厘子 2斤装',
      customerName: '王五',
      customerPhone: '137****9012',
      quantity: 3,
      amount: 264,
      commissionAmount: 13.2,
      status: 'settled',
      createTime: '2026-03-16 10:30:00',
      payTime: '2026-03-16 10:35:00',
      settleTime: '2026-03-18 15:00:00',
    },
  ]);

  // 佣金结算
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [selectedLeaderForSettle, setSelectedLeaderForSettle] = useState<GroupLeader | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);

  const handleEditLeader = (leader: GroupLeader) => {
    setSelectedLeader(leader);
    setFormData({
      name: leader.name,
      phone: leader.phone,
      wechat: leader.wechat,
      storeId: leader.storeId,
      community: leader.community,
      address: leader.address,
    });
    setDialogOpen(true);
  };

  const handleAddLeader = () => {
    setSelectedLeader(null);
    setFormData({
      name: '',
      phone: '',
      wechat: '',
      storeId: '',
      community: '',
      address: '',
    });
    setDialogOpen(true);
  };

  const handleSaveLeader = () => {
    if (selectedLeader) {
      // 编辑
      setLeaders(leaders.map(l => 
        l.id === selectedLeader.id 
          ? { ...l, ...formData }
          : l
      ));
    } else {
      // 新增
      const newLeader: GroupLeader = {
        id: Date.now().toString(),
        name: formData.name,
        avatar: '👤',
        phone: formData.phone,
        wechat: formData.wechat,
        storeId: formData.storeId,
        storeName: formData.storeId === 'store_001' ? '海邻到家南山店' : '海邻到家福田店',
        community: formData.community,
        address: formData.address,
        groups: [],
        status: 'active',
        level: 1,
        totalSales: 0,
        totalOrders: 0,
        commission: 0,
        createTime: new Date().toISOString().split('T')[0],
      };
      setLeaders([...leaders, newLeader]);
    }
    setDialogOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    setLeaders(leaders.map(l => 
      l.id === id ? { ...l, status: l.status === 'active' ? 'inactive' : 'active' } : l
    ));
  };

  // 查看团长业绩
  const handleViewPerformance = (leader: GroupLeader) => {
    setSelectedLeaderForPerformance(leader);
    setPerformanceDialogOpen(true);
  };

  // 打开佣金结算弹窗
  const handleOpenSettle = (leader: GroupLeader) => {
    setSelectedLeaderForSettle(leader);
    // 计算待结算佣金
    const unpaidOrders = leaderOrders.filter(o => o.status === 'paid');
    const totalUnpaidCommission = unpaidOrders.reduce((sum, o) => sum + o.commissionAmount, 0);
    setSettleAmount(totalUnpaidCommission);
    setSettleDialogOpen(true);
  };

  // 执行佣金结算
  const handleSettleCommission = () => {
    // 将已付款订单标记为已结算
    setLeaderOrders(leaderOrders.map(o => 
      o.status === 'paid' ? { ...o, status: 'settled' as const, settleTime: new Date().toISOString().replace('T', ' ').slice(0, 19) } : o
    ));
    
    // 更新团长佣金（扣除已结算部分）
    if (selectedLeaderForSettle) {
      setLeaders(leaders.map(l => 
        l.id === selectedLeaderForSettle.id 
          ? { ...l, commission: l.commission - settleAmount }
          : l
      ));
    }
    
    setSettleDialogOpen(false);
  };

  const getLevelStars = (level: number) => {
    return '⭐'.repeat(level);
  };

  const getLevelBadge = (level: number) => {
    const config: Record<number, { label: string; className: string }> = {
      1: { label: '铜牌团长', className: 'bg-orange-100 text-orange-700' },
      2: { label: '银牌团长', className: 'bg-gray-200 text-gray-700' },
      3: { label: '金牌团长', className: 'bg-yellow-100 text-yellow-700' },
      4: { label: '白金团长', className: 'bg-blue-100 text-blue-700' },
      5: { label: '钻石团长', className: 'bg-purple-100 text-purple-700' },
    };
    return <Badge className={config[level].className}>{config[level].label}</Badge>;
  };

  const activeLeaders = leaders.filter(l => l.status === 'active').length;
  const totalSales = leaders.reduce((sum, l) => sum + l.totalSales, 0);
  const totalCommission = leaders.reduce((sum, l) => sum + l.commission, 0);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="社区团长管理" description="管理社区团购团长，关联店铺和团购群">
        <Button onClick={handleAddLeader}>
          <UserPlus className="h-4 w-4 mr-2" />
          添加团长
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">团长总数</p>
                    <p className="text-2xl font-bold">{leaders.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">活跃团长</p>
                    <p className="text-2xl font-bold text-green-600">{activeLeaders}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总销售额</p>
                    <p className="text-2xl font-bold">¥{totalSales.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总佣金</p>
                    <p className="text-2xl font-bold">¥{totalCommission.toLocaleString()}</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 团长列表 */}
          <Card>
            <CardHeader>
              <CardTitle>团长列表</CardTitle>
              <CardDescription>
                共 {leaders.length} 位团长，活跃 {activeLeaders} 位
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>团长信息</TableHead>
                    <TableHead>关联店铺</TableHead>
                    <TableHead>社区/地址</TableHead>
                    <TableHead>团购群</TableHead>
                    <TableHead>等级</TableHead>
                    <TableHead>业绩</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaders.map((leader) => (
                    <TableRow key={leader.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{leader.avatar}</span>
                          <div>
                            <div className="font-medium">{leader.name}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {leader.phone}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              微信: {leader.wechat}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{leader.storeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{leader.community}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {leader.address}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {leader.groups.map((group, idx) => (
                            <Badge key={idx} variant="outline" className="mr-1">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              {group}
                            </Badge>
                          ))}
                          {leader.groups.length === 0 && (
                            <span className="text-xs text-muted-foreground">暂无</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getLevelBadge(leader.level)}
                          <div className="text-xs">{getLevelStars(leader.level)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>销售: ¥{leader.totalSales.toLocaleString()}</div>
                          <div>订单: {leader.totalOrders}</div>
                          <div className="text-green-600">佣金: ¥{leader.commission}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={leader.status === 'active' ? 'default' : 'secondary'}>
                          {leader.status === 'active' ? '活跃' : '停用'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPerformance(leader)}
                            title="查看业绩"
                          >
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenSettle(leader)}
                            title="佣金结算"
                          >
                            <DollarSign className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(leader.id)}
                            title={leader.status === 'active' ? '停用' : '启用'}
                          >
                            {leader.status === 'active' ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditLeader(leader)}
                            title="编辑"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLeaders(leaders.filter(l => l.id !== leader.id))}
                            title="删除"
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

          {/* 团长等级说明 */}
          <Card>
            <CardHeader>
              <CardTitle>团长等级说明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { level: 1, name: '铜牌团长', sales: '0-5万', commission: '3%', color: 'orange' },
                  { level: 2, name: '银牌团长', sales: '5-10万', commission: '4%', color: 'gray' },
                  { level: 3, name: '金牌团长', sales: '10-30万', commission: '5%', color: 'yellow' },
                  { level: 4, name: '白金团长', sales: '30-50万', commission: '6%', color: 'blue' },
                  { level: 5, name: '钻石团长', sales: '50万+', commission: '7%', color: 'purple' },
                ].map((item) => (
                  <div key={item.level} className={`p-4 rounded-lg bg-${item.color}-50 border border-${item.color}-200`}>
                    <div className="text-lg font-bold mb-1">{item.name}</div>
                    <div className="text-xs text-muted-foreground mb-2">销售额: {item.sales}</div>
                    <div className="text-sm font-medium">佣金比例: {item.commission}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 编辑团长对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedLeader ? '编辑团长' : '添加团长'}</DialogTitle>
            <DialogDescription>
              配置团长基本信息和关联店铺
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>姓名</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="团长姓名"
                />
              </div>
              <div className="space-y-2">
                <Label>手机号</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="手机号"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>微信号</Label>
                <Input
                  value={formData.wechat}
                  onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
                  placeholder="微信号"
                />
              </div>
              <div className="space-y-2">
                <Label>关联店铺</Label>
                <Select
                  value={formData.storeId}
                  onValueChange={(value) => setFormData({ ...formData, storeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择店铺" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="store_001">海邻到家南山店</SelectItem>
                    <SelectItem value="store_002">海邻到家福田店</SelectItem>
                    <SelectItem value="store_003">海邻到家罗湖店</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>所在社区</Label>
              <Input
                value={formData.community}
                onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                placeholder="例如：海邻小区"
              />
            </div>

            <div className="space-y-2">
              <Label>详细地址</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="详细地址"
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveLeader}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 团长业绩详情弹窗 */}
      <Dialog open={performanceDialogOpen} onOpenChange={setPerformanceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              团长业绩详情 - {selectedLeaderForPerformance?.name}
            </DialogTitle>
            <DialogDescription>
              查看团长的接龙订单和佣金明细
            </DialogDescription>
          </DialogHeader>

          {selectedLeaderForPerformance && (
            <div className="space-y-4">
              {/* 业绩统计 */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">总销售额</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ¥{selectedLeaderForPerformance.totalSales.toLocaleString()}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">总订单数</div>
                  <div className="text-2xl font-bold text-green-600">
                    {selectedLeaderForPerformance.totalOrders}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">累计佣金</div>
                  <div className="text-2xl font-bold text-purple-600">
                    ¥{selectedLeaderForPerformance.commission.toFixed(2)}
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">团长等级</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {getLevelBadge(selectedLeaderForPerformance.level)}
                  </div>
                </div>
              </div>

              {/* 订单列表 */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  接龙订单明细
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>订单号</TableHead>
                      <TableHead>接龙活动</TableHead>
                      <TableHead>客户</TableHead>
                      <TableHead>数量</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>佣金</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">{order.orderNo}</TableCell>
                        <TableCell>{order.dragonTitle}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell>{order.quantity}件</TableCell>
                        <TableCell className="font-medium">¥{order.amount}</TableCell>
                        <TableCell className="text-green-600 font-medium">¥{order.commissionAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={
                            order.status === 'settled' ? 'bg-green-500' :
                            order.status === 'paid' ? 'bg-blue-500' : 'bg-yellow-500'
                          }>
                            {order.status === 'settled' ? '已结算' :
                             order.status === 'paid' ? '已付款' : '待付款'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div>{order.createTime}</div>
                          {order.payTime && <div className="text-xs">付款: {order.payTime}</div>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPerformanceDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 佣金结算弹窗 */}
      <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              佣金结算 - {selectedLeaderForSettle?.name}
            </DialogTitle>
            <DialogDescription>
              确认结算团长的待结算佣金
            </DialogDescription>
          </DialogHeader>

          {selectedLeaderForSettle && (
            <div className="space-y-4 py-4">
              {/* 待结算订单 */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">待结算订单</span>
                  <Badge>{leaderOrders.filter(o => o.status === 'paid').length} 笔</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {leaderOrders.filter(o => o.status === 'paid').map(o => o.orderNo).join(', ') || '无待结算订单'}
                </div>
              </div>

              {/* 结算金额 */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">本次结算金额</div>
                    <div className="text-3xl font-bold text-green-600">
                      ¥{settleAmount.toFixed(2)}
                    </div>
                  </div>
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
              </div>

              {/* 结算后余额 */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">结算后待结算佣金</span>
                <span className="font-medium">¥{(selectedLeaderForSettle.commission - settleAmount).toFixed(2)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleSettleCommission}
              disabled={settleAmount <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              确认结算
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
