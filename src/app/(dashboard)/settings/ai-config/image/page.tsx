'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Image,
  Check,
  AlertCircle,
  ExternalLink,
  Save,
  Trash2,
  Loader2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageHeader } from '@/components/page-header';

interface ApiConfig {
  hasShowapiImageKey: boolean;
}

export default function ImageRecognitionConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [config, setConfig] = useState<ApiConfig>({ 
    hasShowapiImageKey: false, 
  });
  
  // 万维易源图像识别配置
  const [showapiImageAppKey, setShowapiImageAppKey] = useState('');
  
  // 消息提示
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 加载当前配置状态
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setPageLoading(true);
      const res = await fetch('/api/settings/api-config/');
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    } finally {
      setPageLoading(false);
    }
  };

  // 保存万维易源图像识别配置
  const saveShowapiImage = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings/api-config/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showapiImageAppKey: showapiImageAppKey }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: '万维易源图像识别配置保存成功！所有店铺均可使用。' });
        setShowapiImageAppKey('');
        fetchConfig();
      } else {
        setMessage({ type: 'error', text: '保存失败，请重试' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败，请检查网络' });
    } finally {
      setLoading(false);
    }
  };

  // 删除万维易源图像识别配置
  const deleteShowapiImage = async () => {
    if (!confirm('确定要删除万维易源图像识别配置吗？')) return;
    
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings/api-config/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showapiImageAppKey: '' }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: '万维易源图像识别配置已删除' });
        fetchConfig();
      } else {
        setMessage({ type: 'error', text: '删除失败，请重试' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '删除失败，请检查网络' });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="图像识别配置"
        description="配置AI图像识别能力，支持商品图片自动识别"
      />

      {/* 说明卡片 */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Image className="h-5 w-5 text-purple-500 mt-0.5" />
            <div className="text-sm text-purple-700">
              <p className="font-medium mb-1">AI图像识别</p>
              <p>配置第三方图像识别API后，收银台可通过拍照识别商品，无需扫码。支持识别包装商品、水果、蔬菜等各类商品。</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 消息提示 */}
      {message && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'} className={message.type === 'success' ? 'border-green-500 bg-green-50' : ''}>
          {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription className={message.type === 'success' ? 'text-green-700' : ''}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* 万维易源图像识别API配置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-base">万维易源图像识别</CardTitle>
            </div>
            {config.hasShowapiImageKey ? (
              <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                <Check className="h-3 w-3 mr-1" />已配置
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                未配置
              </Badge>
            )}
          </div>
          <CardDescription>
            支持商品识别、水果识别、菜品识别等多种场景
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-700 mb-2">
              <strong>功能说明：</strong>
            </p>
            <ul className="text-sm text-blue-600 space-y-1 list-disc list-inside">
              <li>商品识别(标准版)：识别图片中的商品名称和位置</li>
              <li>水果识别：识别水果种类</li>
              <li>菜品识别：识别菜品名称</li>
              <li>通用图像打标：为图片打标签</li>
            </ul>
          </div>
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="showapi-image-key">AppKey</Label>
              <div className="flex gap-2">
                <Input
                  id="showapi-image-key"
                  type="password"
                  placeholder={config.hasShowapiImageKey ? '******已配置' : '请输入万维易源AppKey'}
                  value={showapiImageAppKey}
                  onChange={(e) => setShowapiImageAppKey(e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500">
                在 
                <a href="https://www.showapi.com/apiGateway/view/1754" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mx-1">
                  万维易源官网 <ExternalLink className="h-3 w-3 inline" />
                </a> 
                注册并获取AppKey
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={saveShowapiImage} 
              disabled={loading || !showapiImageAppKey}
              className="flex-1"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              保存配置
            </Button>
            {config.hasShowapiImageKey && (
              <Button 
                variant="destructive" 
                onClick={deleteShowapiImage}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
            <p>在万维易源官网注册账号并开通图像识别服务</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
            <p>获取AppKey并填写到上方配置中</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
            <p>在收银台点击拍照按钮，对准商品拍照即可识别</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
            <p>系统会自动学习识别结果，下次识别更准确</p>
          </div>
        </CardContent>
      </Card>

      {/* 返回按钮 */}
      <div className="pt-4">
        <Button variant="outline" onClick={() => router.push('/settings/ai-config')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回AI功能配置
        </Button>
      </div>
    </div>
  );
}
