import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import {
  ProductImageService,
  type ImageType,
  type ImageChannel,
} from '@/lib/product-image-service';

export const dynamic = 'force-dynamic';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

/**
 * 获取商品图片配置
 * GET /api/products/images?productId=xxx
 */
export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get('productId');
  const channel = request.nextUrl.searchParams.get('channel') as ImageChannel | null;
  
  if (!productId) {
    return NextResponse.json({
      success: false,
      error: '缺少商品ID',
    }, { status: 400 });
  }
  
  try {
    if (channel) {
      // 根据渠道获取图片
      const images = await ProductImageService.getImagesByChannel(productId, channel);
      return NextResponse.json({
        success: true,
        data: images,
      });
    } else {
      // 获取完整图片配置
      const config = await ProductImageService.getProductImageConfig(productId);
      return NextResponse.json({
        success: true,
        data: config,
      });
    }
  } catch (error) {
    console.error('获取商品图片失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取商品图片失败',
    }, { status: 500 });
  }
}

/**
 * 上传商品图片
 * POST /api/products/images
 * 方式1 (本地上传): FormData { productId, type, file, channels, uploadedBy }
 * 方式2 (扫码上传): JSON { productId, type, imageKey, imageUrl, channels, uploadedBy }
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // 判断请求类型
    if (contentType.includes('multipart/form-data')) {
      // 方式1: FormData（本地上传）
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const productId = formData.get('productId') as string;
      const type = (formData.get('type') as ImageType) || 'main';
      const channelsStr = formData.get('channels') as string;
      const uploadedBy = (formData.get('uploadedBy') as string) || 'system';
      
      if (!file || !productId) {
        return NextResponse.json({
          success: false,
          error: '缺少必要参数',
        }, { status: 400 });
      }
      
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({
          success: false,
          error: '不支持的文件类型，仅支持 JPG、PNG、GIF、WebP',
        }, { status: 400 });
      }
      
      // 验证文件大小（最大5MB）
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json({
          success: false,
          error: '文件大小不能超过5MB',
        }, { status: 400 });
      }
      
      // 读取文件内容
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // 生成文件名
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `products/${productId}/${type}_${timestamp}_${randomStr}.${ext}`;
      
      // 上传到对象存储
      const fileKey = await storage.uploadFile({
        fileContent: buffer,
        fileName: fileName,
        contentType: file.type,
      });
      
      // 生成访问URL（有效期30天）
      const imageUrl = await storage.generatePresignedUrl({
        key: fileKey,
        expireTime: 30 * 24 * 60 * 60, // 30天
      });
      
      // 解析渠道
      const channels: ImageChannel[] = channelsStr
        ? (JSON.parse(channelsStr) as ImageChannel[])
        : type === 'main'
          ? ['all']
          : ['miniapp'];
      
      // 保存图片信息到数据库
      const image = await ProductImageService.addProductImage(
        productId,
        type,
        fileKey,
        imageUrl,
        channels,
        uploadedBy
      );
      
      return NextResponse.json({
        success: true,
        data: image,
        message: type === 'main' ? '主图上传成功' : '详情图上传成功',
      });
    } else {
      // 方式2: JSON（扫码上传后保存）
      const body = await request.json();
      const { productId, type, imageKey, imageUrl, channels, uploadedBy } = body;
      
      if (!productId || !imageKey || !imageUrl) {
        return NextResponse.json({
          success: false,
          error: '缺少必要参数',
        }, { status: 400 });
      }
      
      // 保存图片信息到数据库
      const image = await ProductImageService.addProductImage(
        productId,
        type || 'main',
        imageKey,
        imageUrl,
        channels || ['all'],
        uploadedBy || 'scan'
      );
      
      return NextResponse.json({
        success: true,
        data: image,
        message: type === 'main' ? '主图保存成功' : '详情图保存成功',
      });
    }
  } catch (error) {
    console.error('图片上传失败:', error);
    return NextResponse.json({
      success: false,
      error: '图片上传失败',
    }, { status: 500 });
  }
}

/**
 * 更新图片信息
 * PUT /api/products/images
 * Body: { imageId, channels?: [], sortOrder?: number }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageId, channels, sortOrder } = body;
    
    if (!imageId) {
      return NextResponse.json({
        success: false,
        error: '缺少图片ID',
      }, { status: 400 });
    }
    
    // 更新渠道
    if (channels) {
      await ProductImageService.updateImageChannels(imageId, channels as ImageChannel[]);
    }
    
    // 更新排序
    if (sortOrder !== undefined) {
      await ProductImageService.updateImageSort(imageId, sortOrder);
    }
    
    return NextResponse.json({
      success: true,
      message: '更新成功',
    });
  } catch (error) {
    console.error('更新图片失败:', error);
    return NextResponse.json({
      success: false,
      error: '更新失败',
    }, { status: 500 });
  }
}

/**
 * 删除图片
 * DELETE /api/products/images?imageId=xxx&imageKey=xxx
 */
export async function DELETE(request: NextRequest) {
  const imageId = request.nextUrl.searchParams.get('imageId');
  const imageKey = request.nextUrl.searchParams.get('imageKey');
  
  if (!imageId) {
    return NextResponse.json({
      success: false,
      error: '缺少图片ID',
    }, { status: 400 });
  }
  
  try {
    // 从数据库中删除记录
    const deleted = await ProductImageService.deleteImage(imageId);
    
    // 可选：从对象存储删除（根据需求决定是否执行）
    // if (imageKey && deleted) {
    //   await storage.deleteFile({ key: imageKey });
    // }
    
    return NextResponse.json({
      success: deleted,
      message: deleted ? '删除成功' : '图片不存在',
    });
  } catch (error) {
    console.error('删除图片失败:', error);
    return NextResponse.json({
      success: false,
      error: '删除失败',
    }, { status: 500 });
  }
}
