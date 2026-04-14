'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Key,
  Check,
  AlertCircle,
  ExternalLink,
  Save,
  Trash2,
  Loader2,
  ArrowLeft,
  Cloud,
  Globe,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ApiConfig {
  hasShanhaiyunKey: boolean;
  hasRolltoolsKey: boolean;
  hasTencentKey: boolean;
  hasShowapiKey: boolean;
}

export default function BarcodeApiConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [config, setConfig] = useState<ApiConfig>({ 
    hasShanhaiyunKey: false, 
    hasRolltoolsKey: false,
    hasTencentKey: false,
    hasShowapiKey: false,
  });
  
  // 山海云端API配置
  const [shanhaiyunKey, setShanhaiyunKey] = useState('');
  
  // RollToolsAPI配置
  const [rolltoolsAppId, setRolltoolsAppId] = useState('');
  const [rolltoolsAppSecret, setRolltoolsAppSecret] = useState('');
  
  // 腾讯云配置
  const [tencentSecretId, setTencentSecretId] = useState('');
  const [tencentSecretKey, setTencentSecretKey] = useState('');
  
  // 万维易源配置
  const [showapiAppKey, setShowapiAppKey] = useState('');
  
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

  // 保存山海云端API配置
  const saveShanhaiyun = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings/api-config/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shanhaiyunApiKey: shanhaiyunKey }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: '山海云端API配置保存成功！所有店铺均可使用。' });
        setShanhaiyunKey('');
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

  // 保存RollToolsAPI配置
  const saveRolltools = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings/api-config/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rolltoolsAppId: rolltoolsAppId,
          rolltoolsAppSecret: rolltoolsAppSecret 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'RollToolsAPI配置保存成功！所有店铺均可使用。' });
        setRolltoolsAppId('');
        setRolltoolsAppSecret('');
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

  // 保存腾讯云配置
  const saveTencent = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings/api-config/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tencentSecretId: tencentSecretId,
          tencentSecretKey: tencentSecretKey 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: '腾讯云配置保存成功！可使用AI商品识别功能。' });
        setTencentSecretId('');
        setTencentSecretKey('');
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

  // 保存万维易源配置
  const saveShowapi = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings/api-config/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          showapiAppKey: showapiAppKey
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: '万维易源配置保存成功！可使用条码识别功能。' });
        setShowapiAppKey('');
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

  // 清除配置
  const clearConfig = async (type: 'shanhaiyun' | 'rolltools' | 'tencent' | 'showapi') => {
    if (!confirm('确定要清除该API配置吗？清除后所有店铺将无法使用此API进行条码识别。')) {
      return;
    }
    
    setLoading(true);
    try {
      let body: Record<string, string> = {};
      if (type === 'shanhaiyun') {
        body = { shanhaiyunApiKey: '' };
      } else if (type === 'rolltools') {
        body = { rolltoolsAppId: '', rolltoolsAppSecret: '' };
      } else if (type === 'tencent') {
        body = { tencentSecretId: '', tencentSecretKey: '' };
      } else if (type === 'showapi') {
        body = { showapiAppKey: '' };
      }
      
      const res = await fetch('/api/settings/api-config/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: '配置已清除' });
        fetchConfig();
      }
    } catch (error) {
      setMessage({ type: 'error', text: '清除失败' });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 返回按钮和标题 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/settings/ai-config')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">条码识别API配置</h1>
          <p className="text-sm text-gray-500">配置第三方条码查询API，所有店铺共享使用</p>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'} className={message.type === 'success' ? 'border-green-200 bg-green-50' : ''}>
          {message.type === 'success' ? <Check className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{message.type === 'success' ? '成功' : '错误'}</AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* 说明卡片 */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>智能识别流程（自我学习系统）</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>系统采用多级识别策略，逐步降低对第三方AI的依赖：</p>
          <div className="mt-2 space-y-1 text-sm">
            <p><span className="font-medium text-green-600">1. 学习库</span> - 相同图片直接返回历史识别结果（零AI调用）</p>
            <p><span className="font-medium text-teal-600">2. 非标品库</span> - 匹配散装/生鲜等无条码商品</p>
            <p><span className="font-medium text-blue-600">3. 总部商品库</span> - 匹配已录入的标准商品信息</p>
            <p><span className="font-medium text-orange-600">4. 第三方API</span> - 条码查询API获取商品信息</p>
            <p><span className="font-medium text-purple-600">5. AI识别</span> - 视觉模型识别商品图片</p>
          </div>
          <div className="mt-3 p-2 bg-green-50 rounded text-xs text-green-800">
            <strong>自我学习机制：</strong>无法识别时，可通过摄像头采集商品图片，添加到非标品库实现学习。系统自动记录每次识别结果，随着使用时间增加，学习库命中率提升，第三方AI调用将大幅减少。
          </div>
        </AlertDescription>
      </Alert>

      {/* 腾讯云AI商品识别配置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-base">腾讯云AI商品识别</CardTitle>
              <Badge variant="outline" className="ml-2">推荐</Badge>
            </div>
            {config.hasTencentKey ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                <Check className="h-3 w-3 mr-1" />已配置
              </Badge>
            ) : (
              <Badge variant="secondary">未配置</Badge>
            )}
          </div>
          <CardDescription>
            基于腾讯云AI图像识别，支持商品图片识别，准确率高
            <a href="https://console.cloud.tencent.com/cam/capi" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 inline-flex items-center">
              前往获取密钥 <ExternalLink className="h-3 w-3 ml-0.5" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tencent-id">Secret ID</Label>
              <Input
                id="tencent-id"
                type="password"
                placeholder={config.hasTencentKey ? '******已配置' : '请输入Secret ID'}
                value={tencentSecretId}
                onChange={(e) => setTencentSecretId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tencent-key">Secret Key</Label>
              <Input
                id="tencent-key"
                type="password"
                placeholder={config.hasTencentKey ? '******已配置' : '请输入Secret Key'}
                value={tencentSecretKey}
                onChange={(e) => setTencentSecretKey(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={saveTencent} 
              disabled={loading || !tencentSecretId || !tencentSecretKey}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Save className="h-4 w-4 mr-1" />
              保存
            </Button>
            {config.hasTencentKey && (
              <Button variant="outline" onClick={() => clearConfig('tencent')} disabled={loading}>
                <Trash2 className="h-4 w-4 mr-1" />
                清除
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 山海云端API配置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-base">山海云端API</CardTitle>
              <Badge variant="outline" className="ml-2">免费</Badge>
            </div>
            {config.hasShanhaiyunKey ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                <Check className="h-3 w-3 mr-1" />已配置
              </Badge>
            ) : (
              <Badge variant="secondary">未配置</Badge>
            )}
          </div>
          <CardDescription>
            完全免费，支持国内条码查询，响应格式规范
            <a href="https://api.yyy001.com" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 inline-flex items-center">
              前往注册 <ExternalLink className="h-3 w-3 ml-0.5" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shanhaiyun-key">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="shanhaiyun-key"
                type="password"
                placeholder={config.hasShanhaiyunKey ? '******已配置，输入新的可更新' : '请输入API Key'}
                value={shanhaiyunKey}
                onChange={(e) => setShanhaiyunKey(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={saveShanhaiyun} 
                disabled={loading || !shanhaiyunKey}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Save className="h-4 w-4 mr-1" />
                保存
              </Button>
              {config.hasShanhaiyunKey && (
                <Button variant="outline" onClick={() => clearConfig('shanhaiyun')} disabled={loading}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  清除
                </Button>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• API地址：<code className="bg-gray-100 px-1 rounded">https://apione.apibyte.cn/api/barcode</code></p>
            <p>• 支持通过URL参数或Header传递Key</p>
            <p>• 返回商品名称、品牌、规格、分类、价格等详细信息</p>
          </div>
        </CardContent>
      </Card>

      {/* 万维易源配置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-teal-500" />
              <CardTitle className="text-base">万维易源</CardTitle>
              <Badge variant="outline" className="ml-2">条码+AI识别</Badge>
            </div>
            {config.hasShowapiKey ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                <Check className="h-3 w-3 mr-1" />已配置
              </Badge>
            ) : (
              <Badge variant="secondary">未配置</Badge>
            )}
          </div>
          <CardDescription>
            提供条码查询、AI商品图像识别等多种API服务
            <a href="https://www.showapi.com/apiGateway/view/?apiCode=1847" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 inline-flex items-center">
              前往获取密钥 <ExternalLink className="h-3 w-3 ml-0.5" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="showapi-key">AppKey</Label>
            <Input
              id="showapi-key"
              type="password"
              placeholder={config.hasShowapiKey ? '******已配置' : '请输入AppKey'}
              value={showapiAppKey}
              onChange={(e) => setShowapiAppKey(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={saveShowapi} 
              disabled={loading || !showapiAppKey}
              className="bg-teal-500 hover:bg-teal-600"
            >
              <Save className="h-4 w-4 mr-1" />
              保存
            </Button>
            {config.hasShowapiKey && (
              <Button variant="outline" onClick={() => clearConfig('showapi')} disabled={loading}>
                <Trash2 className="h-4 w-4 mr-1" />
                清除
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* RollToolsAPI配置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-base">RollToolsAPI</CardTitle>
            </div>
            {config.hasRolltoolsKey ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                <Check className="h-3 w-3 mr-1" />已配置
              </Badge>
            ) : (
              <Badge variant="secondary">未配置</Badge>
            )}
          </div>
          <CardDescription>
            免费使用，需注册获取AppID和AppSecret
            <a href="https://www.mxnzp.com" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 inline-flex items-center">
              前往注册 <ExternalLink className="h-3 w-3 ml-0.5" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rolltools-id">App ID</Label>
              <Input
                id="rolltools-id"
                type="password"
                placeholder={config.hasRolltoolsKey ? '******已配置' : '请输入App ID'}
                value={rolltoolsAppId}
                onChange={(e) => setRolltoolsAppId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rolltools-secret">App Secret</Label>
              <Input
                id="rolltools-secret"
                type="password"
                placeholder={config.hasRolltoolsKey ? '******已配置' : '请输入App Secret'}
                value={rolltoolsAppSecret}
                onChange={(e) => setRolltoolsAppSecret(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={saveRolltools} 
              disabled={loading || !rolltoolsAppId || !rolltoolsAppSecret}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <Save className="h-4 w-4 mr-1" />
              保存
            </Button>
            {config.hasRolltoolsKey && (
              <Button variant="outline" onClick={() => clearConfig('rolltools')} disabled={loading}>
                <Trash2 className="h-4 w-4 mr-1" />
                清除
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 识别流程说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">识别流程说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">1</Badge>
              <span><strong>本地商品库</strong> - 各店铺自行维护的商品数据</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">2</Badge>
              <span><strong>总部商品库</strong> - 总部统一维护的商品主数据</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">3</Badge>
              <span><strong>第三方API</strong> - 山海云端/RollTools/万维易源条码查询</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">4</Badge>
              <span><strong>腾讯云AI识别</strong> - 通过商品图片AI识别商品信息</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">5</Badge>
              <span><strong>大数据搜索</strong> - AI网络搜索识别（兜底方案）</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
