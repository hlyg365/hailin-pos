'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  GripVertical,
  Check,
  X,
  Plus,
  Eye,
  Store,
  Smartphone,
  Users,
  Loader2,
  QrCode,
  Camera,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import QRCode from 'qrcode';
import { cn } from '@/lib/utils';

// 图片类型
export type ImageType = 'main' | 'detail';

// 使用渠道
export type ImageChannel = 'pos' | 'miniapp' | 'groupbuy' | 'all';

// 商品图片接口
export interface ProductImage {
  id: string;
  productId: string;
  type: ImageType;
  imageKey: string;
  imageUrl: string;
  sortOrder: number;
  channels: ImageChannel[];
  isDefault: boolean;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
}

// 渠道配置
const channelConfig: Record<ImageChannel, { label: string; icon: any; color: string }> = {
  pos: { label: '收银台', icon: Store, color: 'bg-blue-100 text-blue-700' },
  miniapp: { label: '小程序', icon: Smartphone, color: 'bg-green-100 text-green-700' },
  groupbuy: { label: '团购', icon: Users, color: 'bg-orange-100 text-orange-700' },
  all: { label: '全渠道', icon: ImageIcon, color: 'bg-purple-100 text-purple-700' },
};

interface ProductImageManagerProps {
  productId: string;
  productName?: string;
  onImagesChange?: (mainImage: string | null, detailImages: string[]) => void;
  compact?: boolean; // 紧凑模式（用于商品编辑弹窗中）
}

/**
 * 统一的商品图片管理组件
 * 支持本地上传和扫码上传两种方式
 */
export function ProductImageManager({
  productId,
  productName = '商品',
  onImagesChange,
  compact = false,
}: ProductImageManagerProps) {
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // 弹窗状态
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<ProductImage | null>(null);
  
  // 扫码上传相关
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 上传表单
  const [uploadForm, setUploadForm] = useState<{
    type: ImageType;
    channels: ImageChannel[];
    file: File | null;
  }>({
    type: 'main',
    channels: ['all'],
    file: null,
  });

  // 获取商品图片
  const fetchProductImages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/images?productId=${productId}`);
      const result = await response.json();
      
      if (result.success) {
        const images: ProductImage[] = [];
        if (result.data.mainImage) {
          images.push(result.data.mainImage);
        }
        images.push(...result.data.detailImages);
        setProductImages(images);
        
        // 通知父组件
        if (onImagesChange) {
          const mainImage = result.data.mainImage?.imageUrl || null;
          const detailImages = result.data.detailImages.map((img: ProductImage) => img.imageUrl);
          onImagesChange(mainImage, detailImages);
        }
      }
    } catch (error) {
      console.error('获取商品图片失败:', error);
    } finally {
      setLoading(false);
    }
  }, [productId, onImagesChange]);

  // 初始加载
  useEffect(() => {
    fetchProductImages();
  }, [fetchProductImages]);

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    setPolling(false);
  }, []);

  // 组件卸载时停止轮询
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // 本地上传图片
  const handleLocalUpload = async () => {
    if (!uploadForm.file) {
      toast.error('请选择图片');
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('type', uploadForm.type);
      formData.append('channels', JSON.stringify(uploadForm.channels));
      formData.append('file', uploadForm.file);
      formData.append('uploadedBy', 'admin');
      
      const response = await fetch('/api/products/images', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        fetchProductImages();
        setShowUploadDialog(false);
        setUploadForm({ type: 'main', channels: ['all'], file: null });
      } else {
        toast.error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      toast.error('上传图片失败');
    } finally {
      setUploading(false);
    }
  };

  // 生成扫码上传二维码
  const handleShowQrCode = async () => {
    try {
      // 创建上传会话
      const response = await fetch('/api/upload/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, imageType: uploadForm.type }),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setSessionId(result.data.sessionId);
        
        // 使用本地库生成二维码
        const dataUrl = await QRCode.toDataURL(result.data.uploadUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrCodeDataUrl(dataUrl);
        setShowQrDialog(true);
        
        // 开始轮询检查上传状态
        setPolling(true);
        pollSession(result.data.sessionId);
      } else {
        toast.error('生成二维码失败');
      }
    } catch (error) {
      console.error('生成二维码失败:', error);
      toast.error('生成二维码失败');
    }
  };

  // 轮询检查上传状态
  const pollSession = useCallback(async (sid: string, retryCount = 0) => {
    if (retryCount > 1200) {
      toast.error('上传等待超时');
      stopPolling();
      return;
    }

    try {
      const response = await fetch(`/api/upload/session?sessionId=${sid}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const images = result.data.uploadedImages;
        if (images && images.length > 0) {
          const latestImage = images[images.length - 1];
          
          // 保存到商品图片库
          const saveResponse = await fetch('/api/products/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId,
              type: uploadForm.type,
              imageKey: latestImage.key,
              imageUrl: latestImage.url,
              channels: uploadForm.channels,
              uploadedBy: 'scan',
            }),
          });
          
          const saveResult = await saveResponse.json();
          
          if (saveResult.success) {
            toast.success('图片上传成功');
            fetchProductImages();
            setShowQrDialog(false);
            setShowUploadDialog(false);
            stopPolling();
            
            // 完成会话
            fetch('/api/upload/session', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: sid }),
            }).catch(console.error);
          }
          return;
        }
        
        if (result.data.status === 'expired') {
          toast.error('二维码已过期');
          setShowQrDialog(false);
          stopPolling();
          return;
        }
      }
    } catch (error) {
      console.error('轮询失败:', error);
    }
    
    // 继续轮询
    pollingRef.current = setTimeout(() => pollSession(sid, retryCount + 1), 500);
  }, [productId, uploadForm.type, uploadForm.channels, fetchProductImages, stopPolling]);

  // 删除图片
  const handleDeleteImage = async () => {
    if (!imageToDelete) return;
    
    try {
      const response = await fetch(
        `/api/products/images?imageId=${imageToDelete.id}&imageKey=${encodeURIComponent(imageToDelete.imageKey)}`,
        { method: 'DELETE' }
      );
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('删除成功');
        fetchProductImages();
      } else {
        toast.error(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除图片失败:', error);
      toast.error('删除图片失败');
    } finally {
      setShowDeleteDialog(false);
      setImageToDelete(null);
    }
  };

  // 更新图片渠道
  const handleUpdateChannels = async (imageId: string, channels: ImageChannel[]) => {
    try {
      const response = await fetch('/api/products/images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, channels }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('更新成功');
        fetchProductImages();
      }
    } catch (error) {
      console.error('更新渠道失败:', error);
      toast.error('更新失败');
    }
  };

  // 拖拽排序
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const detailImages = productImages.filter(img => img.type === 'detail');
    const items = Array.from(detailImages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // 更新排序
    for (let i = 0; i < items.length; i++) {
      items[i].sortOrder = i;
      await fetch('/api/products/images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: items[i].id, sortOrder: i }),
      });
    }
    
    fetchProductImages();
  };

  // 渲染渠道标签
  const renderChannelBadge = (channel: ImageChannel) => {
    const config = channelConfig[channel];
    const Icon = config.icon;
    return (
      <Badge key={channel} className={`${config.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // 主图
  const mainImage = productImages.find(img => img.type === 'main');
  
  // 详情图
  const detailImages = productImages
    .filter(img => img.type === 'detail')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // 紧凑模式渲染
  if (compact) {
    return (
      <div className="space-y-4">
        {/* 主图 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">主图</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setUploadForm({ type: 'main', channels: ['all'], file: null });
                setShowUploadDialog(true);
              }}
            >
              <Upload className="h-4 w-4 mr-1" />
              上传
            </Button>
          </div>
          {mainImage ? (
            <div className="relative group w-24 h-24 rounded-lg overflow-hidden border">
              <img src={mainImage.imageUrl} alt="主图" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:text-white"
                  onClick={() => window.open(mainImage.imageUrl, '_blank')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-300 hover:text-red-400"
                  onClick={() => {
                    setImageToDelete(mainImage);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => {
                setUploadForm({ type: 'main', channels: ['all'], file: null });
                setShowUploadDialog(true);
              }}
            >
              <ImageIcon className="h-8 w-8 text-gray-400 mb-1" />
              <span className="text-xs text-gray-500">添加主图</span>
            </div>
          )}
        </div>

        {/* 详情图 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">详情图</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setUploadForm({ type: 'detail', channels: ['miniapp'], file: null });
                setShowUploadDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              添加
            </Button>
          </div>
          {detailImages.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {detailImages.map((img, index) => (
                <div key={img.id} className="relative group w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={img.imageUrl} alt={`详情图${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-300 hover:text-red-400"
                      onClick={() => {
                        setImageToDelete(img);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="w-full h-16 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => {
                setUploadForm({ type: 'detail', channels: ['miniapp'], file: null });
                setShowUploadDialog(true);
              }}
            >
              <span className="text-sm text-gray-500">添加详情图（小程序商品详情页）</span>
            </div>
          )}
        </div>

        {/* 上传弹窗 */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                上传{uploadForm.type === 'main' ? '主图' : '详情图'}
              </DialogTitle>
              <DialogDescription>
                支持「本地上传」和「扫码上传」两种方式
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* 图片类型选择 */}
              {uploadForm.type !== 'main' && (
                <div className="space-y-2">
                  <Label>图片类型</Label>
                  <Select
                    value={uploadForm.type}
                    onValueChange={(v) => setUploadForm({
                      ...uploadForm,
                      type: v as ImageType,
                      channels: v === 'main' ? ['all'] : ['miniapp'],
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">主图（全渠道共用）</SelectItem>
                      <SelectItem value="detail">详情图（小程序详情页）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 使用渠道 */}
              <div className="space-y-2">
                <Label>使用渠道</Label>
                <div className="flex flex-wrap gap-2">
                  {(['pos', 'miniapp', 'groupbuy', 'all'] as ImageChannel[]).map((channel) => (
                    <Badge
                      key={channel}
                      className={cn(
                        "cursor-pointer transition-colors",
                        uploadForm.channels.includes(channel)
                          ? channelConfig[channel].color
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      )}
                      onClick={() => {
                        if (channel === 'all') {
                          setUploadForm({ ...uploadForm, channels: ['all'] });
                        } else {
                          const newChannels = uploadForm.channels.filter(c => c !== 'all');
                          if (newChannels.includes(channel)) {
                            const filtered = newChannels.filter(c => c !== channel);
                            setUploadForm({
                              ...uploadForm,
                              channels: filtered.length === 0 ? ['all'] : filtered,
                            });
                          } else {
                            setUploadForm({ ...uploadForm, channels: [...newChannels, channel] });
                          }
                        }
                      }}
                    >
                      {channelConfig[channel].label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 上传方式选择 */}
              <div className="grid grid-cols-2 gap-3">
                {/* 本地上传 */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">本地上传</Label>
                  <div
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">点击或拖拽上传</p>
                    <p className="text-xs text-gray-400 mt-1">JPG/PNG/WEBP</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadForm({ ...uploadForm, file });
                      }
                    }}
                  />
                </div>

                {/* 扫码上传 */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">扫码上传</Label>
                  <div
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={handleShowQrCode}
                  >
                    <QrCode className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">扫码上传</p>
                    <p className="text-xs text-gray-400 mt-1">手机扫码</p>
                  </div>
                </div>
              </div>

              {/* 已选择文件预览 */}
              {uploadForm.file && (
                <div className="rounded-lg overflow-hidden bg-gray-50 p-2">
                  <img
                    src={URL.createObjectURL(uploadForm.file)}
                    alt="预览"
                    className="max-h-40 mx-auto object-contain"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                取消
              </Button>
              <Button onClick={handleLocalUpload} disabled={uploading || !uploadForm.file}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    确认上传
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 扫码上传弹窗 */}
        <Dialog open={showQrDialog} onOpenChange={(open) => {
          setShowQrDialog(open);
          if (!open) stopPolling();
        }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                扫码上传
              </DialogTitle>
              <DialogDescription>
                使用手机微信或浏览器扫描二维码上传图片
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center py-4">
              {qrCodeDataUrl && (
                <img src={qrCodeDataUrl} alt="扫码上传" className="w-64 h-64 rounded-lg border" />
              )}
              {polling && (
                <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  等待上传中...
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* 删除确认弹窗 */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除这张图片吗？删除后将无法恢复。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteImage} className="bg-red-500 hover:bg-red-600">
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // 完整模式渲染
  return (
    <div className="space-y-4">
      <Tabs defaultValue="main">
        <TabsList>
          <TabsTrigger value="main">主图（收银台）</TabsTrigger>
          <TabsTrigger value="detail">详情图（小程序）</TabsTrigger>
        </TabsList>

        {/* 主图管理 */}
        <TabsContent value="main" className="space-y-4">
          {mainImage ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={mainImage.imageUrl} alt="主图" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">使用渠道：</span>
                      <div className="flex gap-1 flex-wrap">
                        {mainImage.channels.map(renderChannelBadge)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>上传时间：{mainImage.uploadedAt}</span>
                      <span>上传人：{mainImage.uploadedBy}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(mainImage.imageUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        查看原图
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUploadForm({ type: 'main', channels: mainImage.channels, file: null });
                          setShowUploadDialog(true);
                        }}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        替换主图
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500"
                        onClick={() => {
                          setImageToDelete(mainImage);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <ImageIcon className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">暂无主图</p>
              <Button
                variant="outline"
                onClick={() => {
                  setUploadForm({ type: 'main', channels: ['all'], file: null });
                  setShowUploadDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                添加主图
              </Button>
            </div>
          )}
        </TabsContent>

        {/* 详情图管理 */}
        <TabsContent value="detail" className="space-y-4">
          {detailImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <ImageIcon className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">暂无详情图</p>
              <Button
                variant="outline"
                onClick={() => {
                  setUploadForm({ type: 'detail', channels: ['miniapp'], file: null });
                  setShowUploadDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                添加详情图
              </Button>
            </div>
          ) : (
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUploadForm({ type: 'detail', channels: ['miniapp'], file: null });
                  setShowUploadDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                添加详情图
              </Button>
            </div>
          )}
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="detail-images">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {detailImages.map((image, index) => (
                    <Draggable key={image.id} draggableId={image.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "flex gap-4 p-3 bg-white border rounded-lg",
                            snapshot.isDragging && "shadow-lg"
                          )}
                        >
                          <div {...provided.dragHandleProps} className="flex items-center">
                            <GripVertical className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={image.imageUrl} alt="详情图" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">第 {index + 1} 张</span>
                                <div className="flex gap-1">
                                  {image.channels.map(renderChannelBadge)}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500">
                                上传时间：{image.uploadedAt}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(image.imageUrl, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => {
                                  setImageToDelete(image);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </TabsContent>
      </Tabs>

      {/* 上传弹窗 - 完整版 */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              上传{uploadForm.type === 'main' ? '主图' : '详情图'}
            </DialogTitle>
            <DialogDescription>
              支持「本地上传」和「扫码上传」两种方式
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 图片类型 */}
            <div className="space-y-2">
              <Label>图片类型</Label>
              <Select
                value={uploadForm.type}
                onValueChange={(v) => setUploadForm({
                  ...uploadForm,
                  type: v as ImageType,
                  channels: v === 'main' ? ['all'] : ['miniapp'],
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">主图（全渠道共用）</SelectItem>
                  <SelectItem value="detail">详情图（小程序详情页）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 使用渠道 */}
            <div className="space-y-2">
              <Label>使用渠道</Label>
              <div className="flex flex-wrap gap-2">
                {(['pos', 'miniapp', 'groupbuy', 'all'] as ImageChannel[]).map((channel) => (
                  <Badge
                    key={channel}
                    className={cn(
                      "cursor-pointer transition-colors",
                      uploadForm.channels.includes(channel)
                        ? channelConfig[channel].color
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    )}
                    onClick={() => {
                      if (channel === 'all') {
                        setUploadForm({ ...uploadForm, channels: ['all'] });
                      } else {
                        const newChannels = uploadForm.channels.filter(c => c !== 'all');
                        if (newChannels.includes(channel)) {
                          const filtered = newChannels.filter(c => c !== channel);
                          setUploadForm({
                            ...uploadForm,
                            channels: filtered.length === 0 ? ['all'] : filtered,
                          });
                        } else {
                          setUploadForm({ ...uploadForm, channels: [...newChannels, channel] });
                        }
                      }
                    }}
                  >
                    {channelConfig[channel].label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 上传方式选择 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 本地上传 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  本地上传
                </Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">点击选择图片</p>
                  <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG、WEBP、GIF</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadForm({ ...uploadForm, file });
                    }
                  }}
                />
              </div>

              {/* 扫码上传 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  扫码上传
                </Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={handleShowQrCode}
                >
                  <QrCode className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">手机扫码上传</p>
                  <p className="text-xs text-gray-400 mt-1">使用微信扫描</p>
                </div>
              </div>
            </div>

            {/* 已选择文件预览 */}
            {uploadForm.file && (
              <div className="rounded-lg overflow-hidden bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-2">预览：</p>
                <img
                  src={URL.createObjectURL(uploadForm.file)}
                  alt="预览"
                  className="max-h-48 mx-auto object-contain rounded"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              取消
            </Button>
            <Button onClick={handleLocalUpload} disabled={uploading || !uploadForm.file}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  确认上传
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 扫码上传弹窗 */}
      <Dialog open={showQrDialog} onOpenChange={(open) => {
        setShowQrDialog(open);
        if (!open) stopPolling();
      }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              扫码上传
            </DialogTitle>
            <DialogDescription>
              使用手机微信或浏览器扫描二维码上传图片
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {qrCodeDataUrl && (
              <img src={qrCodeDataUrl} alt="扫码上传" className="w-64 h-64 rounded-lg border" />
            )}
            {polling && (
              <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                等待上传中...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这张图片吗？删除后将无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteImage} className="bg-red-500 hover:bg-red-600">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
