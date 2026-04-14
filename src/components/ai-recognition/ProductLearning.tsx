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
import { ProductSample, useAIRecognition } from '@/hooks/useAIRecognition';

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
  { value: 'back', label: '反面', description: '商品反面照片' },
  { value: 'side', label: '侧面', description: '商品侧面照片' },
  { value: 'top', label: '顶部', description: '商品顶部照片' },
  { value: 'other', label: '其他', description: '其他角度照片' },
] as const;

export function ProductLearning({
  product,
  onLearn,
  onClose,
  className,
}: ProductLearningProps) {
  const [selectedAngle, setSelectedAngle] = useState<ProductSample['angle']>('front');
  const [isLearning, setIsLearning] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  
  const {
    learnProductSample,
    getProductSamples,
    deleteProductSample,
    error,
    clearError,
  } = useAIRecognition();

  const samples = product ? getProductSamples(product.id) : [];
  const sampleCount = samples.length;
  const targetCount = 20; // 建议每个商品学习20张
  const progress = Math.min((sampleCount / targetCount) * 100, 100);

  // 学习样本
  const handleLearn = async () => {
    if (!product) return;
    
    setIsLearning(true);
    clearError();
    
    const sample = await learnProductSample(product.id, selectedAngle);
    
    if (sample && onLearn) {
      onLearn(sample);
    }
    
    setIsLearning(false);
  };

  // 删除样本
  const handleDeleteSample = (sampleId: string) => {
    if (!product) return;
    deleteProductSample(product.id, sampleId);
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
          <Badge variant={sampleCount >= targetCount ? 'success' : 'secondary'}>
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
                onClick={() => setSelectedAngle(angle.value)}
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

        {/* 错误提示 */}
        {error && (
          <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button 
            onClick={handleLearn} 
            disabled={isLearning}
            className="flex-1 gap-2"
          >
            <Camera className="w-4 h-4" />
            {isLearning ? '学习中...' : '拍照学习'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowSamples(true)}
            className="gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            查看样本
          </Button>
        </div>

        {/* 学习提示 */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-2">💡 学习建议：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>每个角度建议拍摄3-5张照片</li>
            <li>覆盖带包装/不带包装状态</li>
            <li>覆盖装袋/不装袋状态</li>
            <li>不同光线条件下拍摄</li>
            <li>避免过度曝光或模糊</li>
          </ul>
        </div>
      </CardContent>

      {/* 样本查看对话框 */}
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
                  src={sample.imagePath}
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
