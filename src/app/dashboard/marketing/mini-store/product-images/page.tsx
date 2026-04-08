'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Image as ImageIcon,
  Upload,
  Check,
  Eye,
  Store,
  Smartphone,
  Users,
  Loader2,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { ProductImageManager } from '@/components/product-image-manager';

// 商品接口
interface Product {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
}

// 图片状态
interface ImageStatus {
  hasMainImage: boolean;
  detailImageCount: number;
}

// 模拟商品数据
const mockProducts: Product[] = [
  { id: 'prod-1', name: '可口可乐 500ml', category: '饮品', imageUrl: '' },
  { id: 'prod-2', name: '乐事薯片 原味', category: '零食', imageUrl: '' },
  { id: 'prod-3', name: '红富士苹果 500g', category: '水果', imageUrl: '' },
  { id: 'prod-4', name: '清风抽纸 3包装', category: '日用品', imageUrl: '' },
  { id: 'prod-5', name: '康师傅红烧牛肉面', category: '方便食品', imageUrl: '' },
  { id: 'prod-6', name: '伊利纯牛奶 250ml', category: '乳制品', imageUrl: '' },
];

export default function ProductImagesPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [imageStatuses, setImageStatuses] = useState<Record<string, ImageStatus>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // 获取单个商品的图片状态
  const fetchImageStatus = useCallback(async (productId: string): Promise<ImageStatus> => {
    try {
      const response = await fetch(`/api/products/images?productId=${productId}`);
      const result = await response.json();
      
      if (result.success) {
        return {
          hasMainImage: !!result.data.mainImage,
          detailImageCount: result.data.detailImages?.length || 0,
        };
      }
    } catch (error) {
      console.error('获取图片状态失败:', error);
    }
    
    return { hasMainImage: false, detailImageCount: 0 };
  }, []);

  // 加载所有商品的图片状态
  const loadAllImageStatuses = useCallback(async () => {
    setLoading(true);
    const statuses: Record<string, ImageStatus> = {};
    
    for (const product of products) {
      statuses[product.id] = await fetchImageStatus(product.id);
    }
    
    setImageStatuses(statuses);
    setLoading(false);
  }, [products, fetchImageStatus]);

  // 初始加载
  useEffect(() => {
    loadAllImageStatuses();
  }, [loadAllImageStatuses]);

  // 打开图片管理弹窗
  const handleManageImages = (product: Product) => {
    setSelectedProduct(product);
    setShowImageDialog(true);
  };

  // 关闭弹窗并刷新状态
  const handleCloseDialog = () => {
    setShowImageDialog(false);
    setSelectedProduct(null);
    // 刷新该商品的图片状态
    if (selectedProduct) {
      fetchImageStatus(selectedProduct.id).then(status => {
        setImageStatuses(prev => ({
          ...prev,
          [selectedProduct.id]: status,
        }));
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">商品图片管理</h1>
          <p className="text-gray-500 mt-1">
            管理商品主图和详情图，支持收银台、小程序、团购多渠道共享
          </p>
        </div>
        <Button variant="outline" onClick={loadAllImageStatuses} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Loader2 className="h-4 w-4 mr-2" />
          )}
          刷新状态
        </Button>
      </div>

      {/* 使用说明 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ImageIcon className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-blue-700">图片管理说明</p>
              <p className="text-blue-600">
                • <strong>主图</strong>：商品主图，收银台、小程序、团购共用，每个商品仅一张
              </p>
              <p className="text-blue-600">
                • <strong>详情图</strong>：小程序商品详情页专用，可上传多张
              </p>
              <p className="text-blue-600">
                • 支持两种上传方式：<strong>本地上传</strong> 和 <strong>扫码上传</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 商品列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">商品列表</CardTitle>
          <CardDescription>
            点击"管理图片"为商品上传或编辑图片
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {products.map((product) => {
              const status = imageStatuses[product.id] || { hasMainImage: false, detailImageCount: 0 };
              
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* 商品图标 */}
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  
                  {/* 商品信息 */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  
                  {/* 图片状态 */}
                  <div className="flex items-center gap-4">
                    {/* 主图状态 */}
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">主图</span>
                      {status.hasMainImage ? (
                        <Badge className="bg-green-100 text-green-700">
                          <Check className="h-3 w-3 mr-1" />
                          已上传
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          未上传
                        </Badge>
                      )}
                    </div>
                    
                    {/* 详情图状态 */}
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">详情图</span>
                      <Badge variant={status.detailImageCount > 0 ? "default" : "outline"} className={status.detailImageCount > 0 ? "bg-blue-100 text-blue-700" : "text-gray-500"}>
                        {status.detailImageCount} 张
                      </Badge>
                    </div>
                    
                    {/* 管理按钮 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageImages(product)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      管理图片
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 图片管理弹窗 */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {selectedProduct?.name} - 图片管理
            </DialogTitle>
            <DialogDescription>
              管理商品主图和详情图，支持本地上传和扫码上传
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <ProductImageManager
              productId={selectedProduct.id}
              productName={selectedProduct.name}
              onImagesChange={(mainImage, detailImages) => {
                // 更新商品图片状态
                setImageStatuses(prev => ({
                  ...prev,
                  [selectedProduct.id]: {
                    hasMainImage: !!mainImage,
                    detailImageCount: detailImages.length,
                  },
                }));
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
