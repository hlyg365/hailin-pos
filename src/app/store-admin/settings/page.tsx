'use client';

import { useState } from 'react';
import {
  Store,
  MapPin,
  Phone,
  Clock,
  Users,
  Bell,
  Shield,
  CreditCard,
  Truck,
  Save,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// 店铺信息初始值
const initialStoreInfo = {
  name: '海邻到家·阳光店',
  address: '北京市朝阳区阳光小区1号楼底商',
  phone: '010-12345678',
  businessHours: '07:00-22:00',
  description: '海邻到家社区便利店，为您提供便捷的购物体验',
};

// 通知设置初始值
const initialNotificationSettings = {
  orderNotification: true,
  stockWarning: true,
  memberRegister: true,
  promotionRemind: true,
  systemAnnounce: true,
};

export default function StoreSettingsPage() {
  const [storeInfo, setStoreInfo] = useState(initialStoreInfo);
  const [notifications, setNotifications] = useState(initialNotificationSettings);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // 保存设置
  const handleSave = async () => {
    setSaving(true);
    // 模拟保存
    setTimeout(() => {
      setSaving(false);
      setSaveMessage('保存成功');
      setTimeout(() => setSaveMessage(''), 3000);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">店铺设置</h1>
          <p className="text-gray-500 mt-1">管理店铺基本信息和系统设置</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? '保存中...' : '保存设置'}
        </Button>
      </div>

      {/* 保存成功提示 */}
      {saveMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-600 text-sm">
          {saveMessage}
        </div>
      )}

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="notification">通知设置</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
          <TabsTrigger value="business">营业设置</TabsTrigger>
        </TabsList>

        {/* 基本信息 */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="h-5 w-5" />
                店铺信息
              </CardTitle>
              <CardDescription>店铺的基本信息将在小程序和APP中展示</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 店铺Logo */}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/store-logo.png" />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                    海邻
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    上传Logo
                  </Button>
                  <p className="text-xs text-gray-500">
                    建议尺寸 200x200px，支持 PNG、JPG 格式
                  </p>
                </div>
              </div>

              <Separator />

              {/* 店铺名称 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="storeName">店铺名称</Label>
                  <Input
                    id="storeName"
                    value={storeInfo.name}
                    onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storePhone">联系电话</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="storePhone"
                      value={storeInfo.phone}
                      onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* 店铺地址 */}
              <div className="space-y-2">
                <Label htmlFor="storeAddress">店铺地址</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Textarea
                    id="storeAddress"
                    value={storeInfo.address}
                    onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
                    className="pl-10 min-h-[80px]"
                  />
                </div>
              </div>

              {/* 营业时间 */}
              <div className="space-y-2">
                <Label htmlFor="businessHours">营业时间</Label>
                <div className="relative max-w-xs">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="businessHours"
                    value={storeInfo.businessHours}
                    onChange={(e) => setStoreInfo({ ...storeInfo, businessHours: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 店铺简介 */}
              <div className="space-y-2">
                <Label htmlFor="description">店铺简介</Label>
                <Textarea
                  id="description"
                  value={storeInfo.description}
                  onChange={(e) => setStoreInfo({ ...storeInfo, description: e.target.value })}
                  placeholder="请输入店铺简介..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* 店铺二维码 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">店铺小程序码</CardTitle>
              <CardDescription>用于顾客扫码进入店铺小程序</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
                  <div className="text-center text-gray-400">
                    <Store className="h-8 w-8 mx-auto mb-1" />
                    <p className="text-xs">小程序码</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    将此小程序码展示在店铺内，顾客扫码即可进入线上商城
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">下载小程序码</Button>
                    <Button variant="outline" size="sm">重新生成</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知设置 */}
        <TabsContent value="notification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-5 w-5" />
                消息通知
              </CardTitle>
              <CardDescription>设置接收哪些类型的通知消息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">新订单通知</p>
                  <p className="text-sm text-gray-500">有新订单时推送通知</p>
                </div>
                <Switch
                  checked={notifications.orderNotification}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, orderNotification: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">库存预警通知</p>
                  <p className="text-sm text-gray-500">商品库存不足时提醒</p>
                </div>
                <Switch
                  checked={notifications.stockWarning}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, stockWarning: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">会员注册通知</p>
                  <p className="text-sm text-gray-500">新会员注册时通知</p>
                </div>
                <Switch
                  checked={notifications.memberRegister}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, memberRegister: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">促销活动提醒</p>
                  <p className="text-sm text-gray-500">促销活动开始前提醒</p>
                </div>
                <Switch
                  checked={notifications.promotionRemind}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, promotionRemind: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">系统公告</p>
                  <p className="text-sm text-gray-500">系统更新和重要公告</p>
                </div>
                <Switch
                  checked={notifications.systemAnnounce}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, systemAnnounce: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 安全设置 */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5" />
                账号安全
              </CardTitle>
              <CardDescription>管理您的账号密码和安全设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">登录密码</p>
                  <p className="text-sm text-gray-500">定期修改密码可以保护账号安全</p>
                </div>
                <Button variant="outline" size="sm">修改密码</Button>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">绑定手机</p>
                  <p className="text-sm text-gray-500">已绑定 138****8888</p>
                </div>
                <Button variant="outline" size="sm">更换手机</Button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">登录设备管理</p>
                  <p className="text-sm text-gray-500">查看和管理已登录的设备</p>
                </div>
                <Button variant="outline" size="sm">查看设备</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                API密钥
              </CardTitle>
              <CardDescription>用于第三方系统对接的密钥</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        value="YOUR_API_KEY_HERE"
                        readOnly
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button variant="outline">复制</Button>
                    <Button variant="outline">重新生成</Button>
                  </div>
                </div>
                <p className="text-xs text-red-500">
                  请妥善保管API密钥，不要泄露给他人
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 营业设置 */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-5 w-5" />
                配送设置
              </CardTitle>
              <CardDescription>设置配送范围和配送费用</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>配送范围</Label>
                  <Select defaultValue="3">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1公里</SelectItem>
                      <SelectItem value="2">2公里</SelectItem>
                      <SelectItem value="3">3公里</SelectItem>
                      <SelectItem value="5">5公里</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>起送金额</Label>
                  <Input type="number" defaultValue="20" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>配送费</Label>
                  <Input type="number" defaultValue="3" />
                </div>
                <div className="space-y-2">
                  <Label>满额免配送费</Label>
                  <Input type="number" defaultValue="50" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                会员设置
              </CardTitle>
              <CardDescription>设置会员积分规则和等级</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">积分功能</p>
                  <p className="text-sm text-gray-500">开启后顾客消费可获得积分</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">积分比例</p>
                  <p className="text-sm text-gray-500">每消费1元获得的积分数量</p>
                </div>
                <Input type="number" defaultValue="1" className="w-20" />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">积分抵扣</p>
                  <p className="text-sm text-gray-500">每100积分可抵扣金额</p>
                </div>
                <Input type="number" defaultValue="1" className="w-20" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 底部保存按钮 */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button variant="outline">取消</Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? '保存中...' : '保存设置'}
        </Button>
      </div>
    </div>
  );
}
