'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { 
  Camera, Trash2, Check, AlertCircle, Image as ImageIcon, 
  RotateCcw, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { ProductSample, AIRecognitionSettings, useAIRecognition } from '@/hooks/useAIRecognition';

interface Product {
  id: string;
  name: string;
  category: string;
  image?: string;
}

interface ProductLearningProps {
  product?: Product;
  onLearn?: (sample: ProductSample) => void;
  onClose?: () => void;
  className?: string;
}

const ANGLES = [
  { value: 'front', label: '正面', description: '商品正面照片' },
  { value: 'left', label: '左面', description: '商品左侧面照片' },
  { value: 'right', label: '右面', description: '商品右侧面照片' },
  { value: 'top', label: '顶部', description: '商品顶部照片' },
  { value: 'back', label: '背面', description: '商品背面照片' },
] as const;

export function ProductLearning({
  product,
  onLearn,
  onClose,
  className,
}: ProductLearningProps) {
  const [selectedAngle, setSelectedAngle] = useState<'front' | 'left' | 'right' | 'top' | 'back'>('front');
  const [isLearning, setIsLearning] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  
  // AI识别设置（简化版，不需要真实配置）
  const aiSettings: AIRecognitionSettings = {
    enabled: false,
    brand: 'custom',
    triggerWeight: 100,
    triggerMode: 'stable',
    similarityThreshold: 75,
  };
  
  const {
    learnProductSample,
    getProductSamples,
    deleteProductSample,
    error,
    clearError,
    captureImage,
  } = useAIRecognition({ settings: aiSettings });

  const samples = product ? getProductSamples(product.id) : [];
  const sampleCount = samples.length;
  const targetCount = 20; // 建议每个商品学习20张
  const progress = Math.min((sampleCount / targetCount) * 100, 100);

  // 学习样本
  const handleLearn = async () => {
    if (!product) return;
    
    setIsLearning(true);
    clearError();
    
    try {
      // 拍照获取图片
      const imageData = await captureImage();
      if (!imageData) {
        setIsLearning(false);
        return;
      }
      
      // 保存样本
      const sample = learnProductSample(product.id, product.name, imageData, selectedAngle);
      
      if (sample && onLearn) {
        onLearn(sample);
      }
    } catch (e) {
      console.error('Failed to learn sample:', e);
    } finally {
      setIsLearning(false);
    }
  };

  // 删除样本
  const handleDeleteSample = (sampleId: string) => {
    deleteProductSample(sampleId);
  };

  // 角度分组统计
  const angleGroups = ANGLES.map(angle => ({
    ...angle,
    count: samples.filter(s => s.angle === angle.value).length,
  }));

  if (!product) {
    return (
      <Card className={cn('p-8', className)}>
        <CardContent className="flex flex-col items-center justify-center text-gray-500">
          <ImageIcon className="w-16 h-16 mb-4" />
          <p>请选择一个商品开始学习</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">商品学习</CardTitle>
            <CardDescription>
              为 {product.name} 拍摄多角度照片，提高识别准确率
            </CardDescription>
          </div>
          <Badge variant={sampleCount >= targetCount ? 'secondary' : 'outline'} className={sampleCount >= targetCount ? 'bg-green-500 text-white' : 'text-gray-500'}>
            {sampleCount}/{targetCount}
          </Badge>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>学习进度</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 角度选择 */}
        <div>
          <Label className="text-sm font-medium mb-2 block">拍摄角度</Label>
          <div className="grid grid-cols-5 gap-2">
            {angleGroups.map(angle => (
              <button
                key={angle.value}
                onClick={() => setSelectedAngle(angle.value as 'front' | 'left' | 'right' | 'top' | 'back')}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all',
                  selectedAngle === angle.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <span className="text-sm font-medium">{angle.label}</span>
                <Badge variant="outline" className="mt-1 text-xs">
                  {angle.count}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button
            onClick={handleLearn}
            disabled={isLearning}
            className="flex-1"
          >
            {isLearning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                拍摄中...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                拍照学习
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowSamples(true)}
            disabled={samples.length === 0}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            查看样本 ({samples.length})
          </Button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto h-auto p-1">
              <span className="sr-only">关闭</span>
              <span>×</span>
            </Button>
          </div>
        )}

        {/* 学习提示 */}
        <div className="text-sm text-gray-500">
          <p>提示：建议每个角度拍摄 4-5 张照片，覆盖不同光照和角度</p>
        </div>
      </CardContent>

      {/* 样本查看弹窗 */}
      <Dialog open={showSamples} onOpenChange={setShowSamples}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>学习样本 - {product.name}</DialogTitle>
            <DialogDescription>
              共 {sampleCount} 张照片
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {samples.map(sample => (
              <div key={sample.id} className="relative group">
                <img
                  src={`data:image/jpeg;base64,${sample.imageData}`}
                  alt={`${ANGLES.find(a => a.value === sample.angle)?.label}照片`}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary">
                    {ANGLES.find(a => a.value === sample.angle)?.label}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteSample(sample.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {samples.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-16 h-16 mx-auto mb-4" />
              <p>还没有学习样本</p>
              <p className="text-sm mt-2">点击"拍照学习"按钮开始</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSamples(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
