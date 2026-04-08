'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Store, Save, Building2, MapPin, Phone, Clock } from 'lucide-react';

export default function ShopSettingsPage() {
  const [shopConfig, setShopConfig] = useState({
    name: '海邻到家',
    logo: '/logo.png', // 默认logo
    address: '深圳市南山区科技园',
    phone: '0755-12345678',
    businessHours: '08:00-22:00',
    description: '社区便利店智能收银系统',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    // 验证文件大小（最大2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过2MB');
      return;
    }

    setIsUploading(true);

    try {
      // 创建预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setShopConfig({
          ...shopConfig,
          logo: e.target?.result as string,
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);

      // 实际项目中，这里应该上传到服务器
      // const formData = new FormData();
      // formData.append('file', file);
      // const response = await fetch('/api/upload', { method: 'POST', body: formData });
      // const result = await response.json();
      // setShopConfig({ ...shopConfig, logo: result.url });
    } catch (error) {
      console.error('Logo upload failed:', error);
      alert('上传失败，请重试');
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // 实际项目中，这里应该保存到服务器
      // const response = await fetch('/api/shop/config', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(shopConfig),
      // });

      // 模拟保存
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 保存到localStorage
      localStorage.setItem('shopConfig', JSON.stringify(shopConfig));

      alert('保存成功');
    } catch (error) {
      console.error('Save failed:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="店铺设置" description="配置店铺基本信息" />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 店铺基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                店铺基本信息
              </CardTitle>
              <CardDescription>
                设置店铺名称、Logo等基本信息，这些信息将在收银台显示
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 店铺Logo */}
              <div className="space-y-2">
                <Label>店铺Logo</Label>
                <div className="flex items-start gap-6">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-2 border-dashed border-gray-300 group-hover:border-blue-500 transition-colors">
                      <AvatarImage src={shopConfig.logo} alt="店铺Logo" />
                      <AvatarFallback>
                        <Store className="h-8 w-8 text-gray-400" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-muted-foreground">
                      支持 JPG、PNG 格式，建议尺寸 200x200 像素，大小不超过 2MB
                    </p>
                  </div>
                </div>
              </div>

              {/* 店铺名称 */}
              <div className="space-y-2">
                <Label htmlFor="shopName">店铺名称 *</Label>
                <Input
                  id="shopName"
                  value={shopConfig.name}
                  onChange={(e) => setShopConfig({ ...shopConfig, name: e.target.value })}
                  placeholder="请输入店铺名称"
                  maxLength={50}
                />
                <p className="text-sm text-muted-foreground">
                  店铺名称将在收银台顶部显示
                </p>
              </div>

              {/* 店铺地址 */}
              <div className="space-y-2">
                <Label htmlFor="address">店铺地址</Label>
                <div className="flex gap-2">
                  <MapPin className="h-10 w-10 text-gray-400 mt-2" />
                  <Input
                    id="address"
                    value={shopConfig.address}
                    onChange={(e) => setShopConfig({ ...shopConfig, address: e.target.value })}
                    placeholder="请输入店铺地址"
                    maxLength={200}
                  />
                </div>
              </div>

              {/* 联系电话 */}
              <div className="space-y-2">
                <Label htmlFor="phone">联系电话</Label>
                <div className="flex gap-2">
                  <Phone className="h-10 w-10 text-gray-400 mt-2" />
                  <Input
                    id="phone"
                    value={shopConfig.phone}
                    onChange={(e) => setShopConfig({ ...shopConfig, phone: e.target.value })}
                    placeholder="请输入联系电话"
                    maxLength={20}
                  />
                </div>
              </div>

              {/* 营业时间 */}
              <div className="space-y-2">
                <Label htmlFor="businessHours">营业时间</Label>
                <div className="flex gap-2">
                  <Clock className="h-10 w-10 text-gray-400 mt-2" />
                  <Input
                    id="businessHours"
                    value={shopConfig.businessHours}
                    onChange={(e) => setShopConfig({ ...shopConfig, businessHours: e.target.value })}
                    placeholder="例如：08:00-22:00"
                    maxLength={20}
                  />
                </div>
              </div>

              {/* 店铺描述 */}
              <div className="space-y-2">
                <Label htmlFor="description">店铺描述</Label>
                <Textarea
                  id="description"
                  value={shopConfig.description}
                  onChange={(e) => setShopConfig({ ...shopConfig, description: e.target.value })}
                  placeholder="请输入店铺描述"
                  rows={3}
                  maxLength={500}
                />
              </div>
            </CardContent>
          </Card>

          {/* 保存按钮 */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              重置
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
