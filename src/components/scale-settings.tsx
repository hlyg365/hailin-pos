'use client';

import { useState, useEffect } from 'react';
import { Scale, Wifi, WifiOff, RefreshCw, Check, X, Plug, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { topScaleService, ScaleConfig } from '@/lib/topscale-os2-service';

interface ScaleSettingsProps {
  onConnect?: (connected: boolean) => void;
}

// 预设的电子秤参数（根据顶尖OS2协议）
const PRESET_CONFIGS = {
  'OS2T325490065': {
    model: 'OS2T325490065',
    maxWeight: 15,
    baudRate: 9600,
    description: '顶尖OS2收银一体秤 15kg',
  },
};

export function ScaleSettings({ onConnect }: ScaleSettingsProps) {
  const [connectionType, setConnectionType] = useState<'serial' | 'network'>('network');
  const [config, setConfig] = useState<ScaleConfig>({
    ip: '',
    port: 4001,
    model: 'OS2T325490065',
    maxWeight: 15,
    enabled: false,
  });
  const [serialConfig, setSerialConfig] = useState({
    port: 'COM3',
    baudRate: 9600,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [testWeight, setTestWeight] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // 加载预设配置
  const loadPreset = (model: string) => {
    if (PRESET_CONFIGS[model as keyof typeof PRESET_CONFIGS]) {
      const preset = PRESET_CONFIGS[model as keyof typeof PRESET_CONFIGS];
      setConfig({ ...config, model: preset.model, maxWeight: preset.maxWeight });
      setSerialConfig({ ...serialConfig, baudRate: preset.baudRate });
      setMessage(`已加载预设: ${preset.description}`);
    }
  };

  useEffect(() => {
    // 加载配置
    const savedConfig = topScaleService.getConfig();
    const savedSerialConfig = topScaleService.getSerialConfig();
    const savedConnectionType = topScaleService.getConnectionType();
    
    setConfig(savedConfig);
    setSerialConfig(savedSerialConfig);
    setConnectionType(savedConnectionType);
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
    setMessage(null);
    
    try {
      // 保存所有配置
      topScaleService.saveConfig(config);
      topScaleService.saveSerialConfig(serialConfig);
      topScaleService.setConnectionType(connectionType);
      
      // 连接
      const result = await topScaleService.connect(connectionType);
      
      if (result.success) {
        setIsConnected(true);
        setMessage(result.message);
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
    setMessage('已断开电子秤');
    onConnect?.(false);
  };

  const handleTest = () => {
    topScaleService.tare();
    setMessage('已发送去皮命令');
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
            连接顶尖OS2协议收银一体秤（机号: OS2T325490065）
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
                  {isConnected 
                    ? connectionType === 'network' 
                      ? `网络: ${config.ip}:${config.port}`
                      : `串口: ${serialConfig.port} @ ${serialConfig.baudRate}bps`
                    : '请配置并连接'
                  }
                </p>
              </div>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'} className={isConnected ? 'bg-green-500' : ''}>
              {isConnected ? '在线' : '离线'}
            </Badge>
          </div>

          {/* 连接类型选择 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>连接方式</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowHelp(!showHelp)}
                className="h-6 text-xs"
              >
                <Info className="h-3 w-3 mr-1" />
                {showHelp ? '隐藏帮助' : '显示帮助'}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={connectionType === 'network' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConnectionType('network')}
                disabled={isConnected}
                className="flex-1"
              >
                <Wifi className="h-4 w-4 mr-2" />
                网络连接
              </Button>
              <Button
                variant={connectionType === 'serial' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConnectionType('serial')}
                disabled={isConnected}
                className="flex-1"
              >
                <Plug className="h-4 w-4 mr-2" />
                串口连接
              </Button>
            </div>
          </div>

          {/* 帮助信息 */}
          {showHelp && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm space-y-2">
              <p className="font-medium text-blue-700">连接说明：</p>
              <p>• <strong>网络连接</strong>：电子秤需配置IP地址，端口默认4001</p>
              <p>• <strong>串口连接</strong>：使用USB转串口线，波特率9600</p>
              <p>• 查看电子秤IP：电子秤设置菜单 → 串口设置</p>
              <p>• 您的电子秤：顶尖OS2，量程15kg，波特率9600</p>
            </div>
          )}

          {/* 网络设置 */}
          {connectionType === 'network' ? (
            <div className="space-y-4">
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
                  <Label htmlFor="scale-port">端口号</Label>
                  <Input
                    id="scale-port"
                    type="number"
                    placeholder="4001"
                    value={config.port}
                    onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 4001 })}
                    disabled={isConnected}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                💡 电子秤IP通常在 192.168.1.x 网段，请在电子秤上查看具体IP
              </p>
            </div>
          ) : (
            /* 串口设置 */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serial-port">串口地址</Label>
                  <Select
                    value={serialConfig.port}
                    onValueChange={(v) => setSerialConfig({ ...serialConfig, port: v })}
                    disabled={isConnected}
                  >
                    <SelectTrigger id="serial-port">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COM1">COM1</SelectItem>
                      <SelectItem value="COM2">COM2</SelectItem>
                      <SelectItem value="COM3">COM3</SelectItem>
                      <SelectItem value="COM4">COM4</SelectItem>
                      <SelectItem value="COM5">COM5</SelectItem>
                      <SelectItem value="COM6">COM6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baud-rate">波特率</Label>
                  <Select
                    value={String(serialConfig.baudRate)}
                    onValueChange={(v) => setSerialConfig({ ...serialConfig, baudRate: parseInt(v) })}
                    disabled={isConnected}
                  >
                    <SelectTrigger id="baud-rate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2400">2400 bps</SelectItem>
                      <SelectItem value="4800">4800 bps</SelectItem>
                      <SelectItem value="9600">9600 bps</SelectItem>
                      <SelectItem value="19200">19200 bps</SelectItem>
                      <SelectItem value="38400">38400 bps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                💡 请在电子秤上确认波特率设置（您的电子秤为9600）
              </p>
            </div>
          )}

          {/* 电子秤信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scale-model">机号/型号</Label>
              <div className="flex gap-2">
                <Input
                  id="scale-model"
                  placeholder="OS2T325490065"
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadPreset('OS2T325490065')}
                >
                  预设
                </Button>
              </div>
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

          {/* 消息提示 */}
          {message && (
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg text-sm flex items-center gap-2">
              <Check className="h-4 w-4" />
              {message}
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <X className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2">
            {!isConnected ? (
              <Button 
                className="flex-1" 
                onClick={handleConnect}
                disabled={isConnecting || (!config.ip && connectionType === 'network')}
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
          {isConnected && (
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-green-600 mb-1">
                {testWeight !== null ? '当前重量' : '等待称重...'}
              </p>
              {testWeight !== null ? (
                <>
                  <p className="text-3xl font-bold text-green-700">
                    {testWeight.toFixed(3)} kg
                  </p>
                  <p className="text-xs text-green-500 mt-1">
                    {(testWeight * 2).toFixed(2)} 斤
                  </p>
                </>
              ) : (
                <div className="animate-pulse">
                  <p className="text-xl text-green-400">0.000 kg</p>
                </div>
              )}
            </div>
          )}

          {/* 技术参数 */}
          <div className="text-xs text-gray-400 space-y-1 border-t pt-3">
            <p className="font-medium">电子秤技术参数：</p>
            <p>• 型号：OS2T325490065（顶尖OS2收银一体秤）</p>
            <p>• 量程：15kg / 精度：双量程中精度</p>
            <p>• 协议：顶尖OS2主动协议 / 波特率：9600</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
