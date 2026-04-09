'use client';

import { useState, useEffect } from 'react';
import { Scale, Wifi, WifiOff, Settings, RefreshCw, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { topScaleService, ScaleConfig } from '@/lib/topscale-os2-service';

interface ScaleSettingsProps {
  onConnect?: (connected: boolean) => void;
}

export function ScaleSettings({ onConnect }: ScaleSettingsProps) {
  const [config, setConfig] = useState<ScaleConfig>({
    ip: '192.168.1.100',
    port: 4001,
    model: 'OS2T325490065',
    maxWeight: 15,
    enabled: false,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [testWeight, setTestWeight] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 加载配置
    const savedConfig = topScaleService.getConfig();
    setConfig(savedConfig);
    setIsConnected(topScaleService.getIsConnected());

    // 设置回调
    topScaleService.setCallback((data) => {
      if (data.stable) {
        setTestWeight(data.weight);
      }
    });
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // 保存配置
      topScaleService.saveConfig(config);
      
      // 连接
      const result = await topScaleService.connect();
      
      if (result.success) {
        setIsConnected(true);
        onConnect?.(true);
      } else {
        setError(result.message);
      }
    } catch (e: any) {
      setError(e.message || '连接失败');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    topScaleService.disconnect();
    setIsConnected(false);
    setTestWeight(null);
    onConnect?.(false);
  };

  const handleTest = async () => {
    // 测试去皮
    topScaleService.tare();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            电子秤连接设置
          </CardTitle>
          <CardDescription>
            连接顶尖OS2协议收银一体秤
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 连接状态 */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">
                  {isConnected ? '已连接电子秤' : '未连接'}
                </p>
                <p className="text-xs text-gray-500">
                  {isConnected ? `${config.ip}:${config.port}` : '请点击连接按钮'}
                </p>
              </div>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'} className={isConnected ? 'bg-green-500' : ''}>
              {isConnected ? '在线' : '离线'}
            </Badge>
          </div>

          {/* 连接参数 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scale-ip">电子秤IP地址</Label>
              <Input
                id="scale-ip"
                placeholder="192.168.1.100"
                value={config.ip}
                onChange={(e) => setConfig({ ...config, ip: e.target.value })}
                disabled={isConnected}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scale-port">端口</Label>
              <Input
                id="scale-port"
                placeholder="4001"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 4001 })}
                disabled={isConnected}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scale-model">机号/型号</Label>
              <Input
                id="scale-model"
                placeholder="OS2T325490065"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scale-max">最大称重 (kg)</Label>
              <Input
                id="scale-max"
                type="number"
                placeholder="15"
                value={config.maxWeight}
                onChange={(e) => setConfig({ ...config, maxWeight: parseFloat(e.target.value) || 15 })}
              />
            </div>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2">
            {!isConnected ? (
              <Button 
                className="flex-1" 
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    连接中...
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-2" />
                    连接电子秤
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleTest}
                >
                  去皮
                </Button>
                <Button 
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDisconnect}
                >
                  <X className="h-4 w-4 mr-2" />
                  断开
                </Button>
              </>
            )}
          </div>

          {/* 实时重量显示 */}
          {isConnected && testWeight !== null && (
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-green-600 mb-1">当前重量</p>
              <p className="text-3xl font-bold text-green-700">
                {testWeight.toFixed(3)} kg
              </p>
              <p className="text-xs text-green-500 mt-1">
                {(testWeight * 2).toFixed(2)} 斤
              </p>
            </div>
          )}

          {/* 提示信息 */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• 顶尖OS2协议电子秤默认端口为 4001</p>
            <p>• 请确保电子秤和收银机在同一网络</p>
            <p>• 首次连接可能需要输入电子秤的IP地址</p>
            <p>• 支持的电子秤型号：OS2T、OS2等顶尖系列</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
