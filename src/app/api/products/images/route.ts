import { NextRequest, NextResponse } from 'next/server';
import {
  ProductImageService,
  type ImageType,
  type ImageChannel,
} from '@/lib/product-image-service';

export const dynamic = 'force-dynamic';

// 延迟导入S3Storage，避免构建时解析langchain问题
let storage: any = null;

async function getStorage() {
  if (!storage) {
    const { S3Storage } = await import('coze-coding-dev-sdk');
    storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: "",
      secretKey: "",
      bucketName: process.env.COZE_BUCKET_NAME,
      region: "cn-beijing",
    });
  }
  return storage;
}

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
      error: '缺少productId参数',
    }, { status: 400 });
  }
  
  try {
    const config = await ProductImageService.getProductImageConfig(productId);
    
    // 如果指定了渠道，过滤该渠道的图片
    let filteredImages = [...(config.detailImages || [])];
    if (config.mainImage) {
      filteredImages.unshift(config.mainImage);
    }
    if (channel) {
      filteredImages = filteredImages.filter(img => 
        img.channels.includes(channel as ImageChannel) || img.channels.includes('all')
      );
    }
    
    return NextResponse.json({
      success: true,
      data: filteredImages,
    });
  } catch (error: any) {
    console.error('[ProductImages] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '获取图片配置失败',
    }, { status: 500 });
  }
}

/**
 * 上传商品图片
 * POST /api/products/images
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, imageType, imageKey, imageUrl, channels } = body;
    
    if (!productId || !imageKey || !imageUrl) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数',
      }, { status: 400 });
    }
    
    const result = await ProductImageService.addProductImage(
      productId,
      imageType as ImageType || 'main',
      imageKey,
      imageUrl,
      channels || ['all'],
      body.operator || 'admin'
    );
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[ProductImages] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '上传图片失败',
    }, { status: 500 });
  }
}

/**
 * 更新图片信息
 * PUT /api/products/images
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageId, channels, sortOrder } = body;
    
    if (!imageId) {
      return NextResponse.json({
        success: false,
        error: '缺少imageId参数',
      }, { status: 400 });
    }
    
    const result = await ProductImageService.updateImageSort(imageId, sortOrder || 0);
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[ProductImages] PUT error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '更新图片失败',
    }, { status: 500 });
  }
}

/**
 * 删除图片
 * DELETE /api/products/images?imageId=xxx
 */
export async function DELETE(request: NextRequest) {
  const imageId = request.nextUrl.searchParams.get('imageId');
  
  if (!imageId) {
    return NextResponse.json({
      success: false,
      error: '缺少imageId参数',
    }, { status: 400 });
  }
  
  try {
    await ProductImageService.deleteImage(imageId);
    
    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('[ProductImages] DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '删除图片失败',
    }, { status: 500 });
  }
}
