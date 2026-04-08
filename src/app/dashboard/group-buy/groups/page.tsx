'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
  MessageCircle,
  Users,
  Plus,
  Edit,
  Trash2,
  QrCode,
  Link as LinkIcon,
  Copy,
  Share2,
  Eye,
  EyeOff,
  Store,
  User,
  TrendingUp,
  ShoppingCart,
  Clock,
  CheckCircle,
} from 'lucide-react';

// 团购群数据类型
interface GroupChat {
  id: string;
  name: string;
  qrCode: string;
  leaderId: string;
  leaderName: string;
  storeId: string;
  storeName: string;
  memberCount: number;
  maxMembers: number;
  status: 'active' | 'inactive';
  type: 'owner' | 'cooperate'; // 自建群 or 合作群
  totalOrders: number;
  totalSales: number;
  lastActivity: string;
  createTime: string;
  inviteLink?: string;
}

export default function GroupChatsPage() {
  const [groups, setGroups] = useState<GroupChat[]>([
    {
      id: '1',
      name: '海邻小区业主群',
      qrCode: '📱',
      leaderId: 'leader_001',
      leaderName: '王大姐',
      storeId: 'store_001',
      storeName: '海邻到家南山店',
      memberCount: 486,
      maxMembers: 500,
      status: 'active',
      type: 'owner',
      totalOrders: 1256,
      totalSales: 89560,
      lastActivity: '2026-03-17 11:30',
      createTime: '2023-06-15',
      inviteLink: 'https://weixin.qq.com/g1/xxx',
    },
    {
      id: '2',
      name: '海邻团购2群',
      qrCode: '📱',
      leaderId: 'leader_001',
      leaderName: '王大姐',
      storeId: 'store_001',
      storeName: '海邻到家南山店',
      memberCount: 328,
      maxMembers: 500,
      status: 'active',
      type: 'owner',
      totalOrders: 856,
      totalSales: 62340,
      lastActivity: '2026-03-17 10:45',
      createTime: '2024-01-20',
      inviteLink: 'https://weixin.qq.com/g2/xxx',
    },
    {
      id: '3',
      name: '阳光花园团购群',
      qrCode: '📱',
      leaderId: 'leader_002',
      leaderName: '张阿姨',
      storeId: 'store_001',
      storeName: '海邻到家南山店',
      memberCount: 215,
      maxMembers: 500,
      status: 'active',
      type: 'cooperate',
      totalOrders: 568,
      totalSales: 45230,
      lastActivity: '2026-03-17 09:20',
      createTime: '2024-02-10',
    },
    {
      id: '4',
      name: '翠海花园业主群',
      qrCode: '📱',
      leaderId: 'leader_003',
      leaderName: '李大哥',
      storeId: 'store_002',
      storeName: '海邻到家福田店',
      memberCount: 392,
      maxMembers: 500,
      status: 'active',
      type: 'cooperate',
      totalOrders: 423,
      totalSales: 35680,
      lastActivity: '2026-03-17 08:55',
      createTime: '2024-03-05',
    },
    {
      id: '5',
      name: '科技公寓团购群',
      qrCode: '📱',
      leaderId: 'leader_004',
      leaderName: '陈姐',
      storeId: 'store_001',
      storeName: '海邻到家南山店',
      memberCount: 156,
      maxMembers: 500,
      status: 'inactive',
      type: 'owner',
      totalOrders: 89,
      totalSales: 8960,
      lastActivity: '2026-03-10 15:30',
      createTime: '2024-04-01',
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    leaderId: string;
    storeId: string;
    type: 'owner' | 'cooperate';
    memberCount: number;
  }>({
    name: '',
    leaderId: '',
    storeId: '',
    type: 'owner',
    memberCount: 0,
  });

  const handleEditGroup = (group: GroupChat) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      leaderId: group.leaderId,
      storeId: group.storeId,
      type: group.type,
      memberCount: group.memberCount,
    });
    setDialogOpen(true);
  };

  const handleAddGroup = () => {
    setSelectedGroup(null);
    setFormData({
      name: '',
      leaderId: '',
      storeId: '',
      type: 'owner',
      memberCount: 0,
    });
    setDialogOpen(true);
  };

  const handleSaveGroup = () => {
    if (selectedGroup) {
      setGroups(groups.map(g => 
        g.id === selectedGroup.id 
          ? { 
              ...g, 
              ...formData,
              leaderName: formData.leaderId === 'leader_001' ? '王大姐' : 
                         formData.leaderId === 'leader_002' ? '张阿姨' : 
                         formData.leaderId === 'leader_003' ? '李大哥' : '陈姐',
              storeName: formData.storeId === 'store_001' ? '海邻到家南山店' : '海邻到家福田店',
            }
          : g
      ));
    } else {
      const newGroup: GroupChat = {
        id: Date.now().toString(),
        name: formData.name,
        qrCode: '📱',
        leaderId: formData.leaderId,
        leaderName: formData.leaderId === 'leader_001' ? '王大姐' : 
                   formData.leaderId === 'leader_002' ? '张阿姨' : 
                   formData.leaderId === 'leader_003' ? '李大哥' : '陈姐',
        storeId: formData.storeId,
        storeName: formData.storeId === 'store_001' ? '海邻到家南山店' : '海邻到家福田店',
        memberCount: formData.memberCount,
        maxMembers: 500,
        status: 'active',
        type: formData.type as 'owner' | 'cooperate',
        totalOrders: 0,
        totalSales: 0,
        lastActivity: new Date().toISOString().replace('T', ' ').slice(0, 16),
        createTime: new Date().toISOString().split('T')[0],
      };
      setGroups([...groups, newGroup]);
    }
    setDialogOpen(false);
  };

  const handleShowQrCode = (group: GroupChat) => {
    setSelectedGroup(group);
    setQrDialogOpen(true);
  };

  const handleCopyInviteLink = (group: GroupChat) => {
    if (group.inviteLink) {
      navigator.clipboard.writeText(group.inviteLink);
      alert('邀请链接已复制到剪贴板！');
    }
  };

  const handleToggleStatus = (id: string) => {
    setGroups(groups.map(g => 
      g.id === id ? { ...g, status: g.status === 'active' ? 'inactive' : 'active' } : g
    ));
  };

  const activeGroups = groups.filter(g => g.status === 'active').length;
  const totalMembers = groups.reduce((sum, g) => sum + g.memberCount, 0);
  const totalSales = groups.reduce((sum, g) => sum + g.totalSales, 0);
  const totalOrders = groups.reduce((sum, g) => sum + g.totalOrders, 0);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="团购群管理" description="管理微信群，关联团长和店铺">
        <Button onClick={handleAddGroup}>
          <Plus className="h-4 w-4 mr-2" />
          添加团购群
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
                    <p className="text-sm text-muted-foreground">团购群总数</p>
                    <p className="text-2xl font-bold">{groups.length}</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总成员数</p>
                    <p className="text-2xl font-bold">{totalMembers.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总订单数</p>
                    <p className="text-2xl font-bold">{totalOrders.toLocaleString()}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-purple-500" />
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
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 团购群列表 */}
          <Card>
            <CardHeader>
              <CardTitle>团购群列表</CardTitle>
              <CardDescription>
                共 {groups.length} 个群，活跃 {activeGroups} 个
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>群信息</TableHead>
                    <TableHead>关联店铺</TableHead>
                    <TableHead>团长</TableHead>
                    <TableHead>成员/容量</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>业绩</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                            <MessageCircle className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">{group.name}</div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              最近活跃: {group.lastActivity}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{group.storeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{group.leaderName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            {group.memberCount}/{group.maxMembers}
                          </div>
                          <Progress 
                            value={(group.memberCount / group.maxMembers) * 100}
                            className="h-1.5 w-20"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={group.type === 'owner' ? 'default' : 'outline'}>
                          {group.type === 'owner' ? '自建群' : '合作群'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{group.totalOrders} 单</div>
                          <div className="text-green-600">¥{group.totalSales.toLocaleString()}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
                          {group.status === 'active' ? '活跃' : '停用'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowQrCode(group)}
                            title="群二维码"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          {group.inviteLink && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyInviteLink(group)}
                              title="复制邀请链接"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(group.id)}
                          >
                            {group.status === 'active' ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditGroup(group)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setGroups(groups.filter(g => g.id !== group.id))}
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

          {/* 群类型说明 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">自建群</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                    由店铺或团长创建并管理
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                    可生成群二维码和邀请链接
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                    支持机器人自动推送商品
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">合作群</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-blue-500" />
                    与社区其他群主合作推广
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-blue-500" />
                    需手动分享商品链接
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-blue-500" />
                    按合作约定分成
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 编辑团购群对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedGroup ? '编辑团购群' : '添加团购群'}</DialogTitle>
            <DialogDescription>
              配置团购群基本信息和关联关系
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>群名称</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：海邻小区业主群"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label>关联团长</Label>
                <Select
                  value={formData.leaderId}
                  onValueChange={(value) => setFormData({ ...formData, leaderId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择团长" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leader_001">王大姐</SelectItem>
                    <SelectItem value="leader_002">张阿姨</SelectItem>
                    <SelectItem value="leader_003">李大哥</SelectItem>
                    <SelectItem value="leader_004">陈姐</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>群类型</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as 'owner' | 'cooperate' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">自建群</SelectItem>
                    <SelectItem value="cooperate">合作群</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>当前成员数</Label>
                <Input
                  type="number"
                  value={formData.memberCount}
                  onChange={(e) => setFormData({ ...formData, memberCount: Number(e.target.value) })}
                  placeholder="成员数量"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveGroup}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 群二维码对话框 */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>群二维码</DialogTitle>
            <DialogDescription>
              {selectedGroup?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedGroup && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="h-48 w-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <QrCode className="h-24 w-24 text-gray-400" />
                </div>
                <p className="text-sm text-muted-foreground">扫码加入群聊</p>
              </div>

              {selectedGroup.inviteLink && (
                <div className="space-y-2">
                  <Label>邀请链接</Label>
                  <div className="flex gap-2">
                    <Input value={selectedGroup.inviteLink} readOnly className="text-sm" />
                    <Button onClick={() => handleCopyInviteLink(selectedGroup)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  分享二维码
                </Button>
                <Button variant="outline" className="w-full">
                  下载二维码
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
