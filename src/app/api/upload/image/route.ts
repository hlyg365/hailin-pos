import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { getUploadSessions } from '@/lib/upload-sessions';

export const dynamic = 'force-dynamic';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

// 图片上传API
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const sessionId = formData.get('sessionId') as string; // 用于扫码上传场景
    
    if (!file) {
      return NextResponse.json({ success: false, error: '没有上传文件' }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: '不支持的文件类型，仅支持 JPG、PNG、GIF、WebP' 
      }, { status: 400 });
    }

    // 验证文件大小（最大5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: '文件大小不能超过5MB' 
      }, { status: 400 });
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 生成文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = productId 
      ? `products/${productId}/${timestamp}_${randomStr}.${ext}`
      : `products/temp/${timestamp}_${randomStr}.${ext}`;

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

    // 如果有sessionId，直接更新会话状态（优化：减少一次请求）
    if (sessionId) {
      try {
        const uploadSessions = getUploadSessions();
        const session = uploadSessions.get(sessionId);
        
        if (session && Date.now() <= session.expiresAt) {
          // 添加上传的图片到会话
          session.uploadedImages.push({ key: fileKey, url: imageUrl });
        }
      } catch (sessionError) {
        console.error('更新会话失败:', sessionError);
        // 不影响上传结果，继续返回成功
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        key: fileKey,
        url: imageUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        sessionId, // 返回sessionId供前端确认
      }
    });
  } catch (error) {
    console.error('图片上传失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '上传失败，请稍后重试' 
    }, { status: 500 });
  }
}

// 获取图片URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ success: false, error: '缺少文件key' }, { status: 400 });
    }

    // 生成访问URL
    const imageUrl = await storage.generatePresignedUrl({
      key: key,
      expireTime: 30 * 24 * 60 * 60, // 30天
    });

    return NextResponse.json({
      success: true,
      data: { url: imageUrl }
    });
  } catch (error) {
    console.error('获取图片URL失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '获取失败' 
    }, { status: 500 });
  }
}

// 删除图片
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ success: false, error: '缺少文件key' }, { status: 400 });
    }

    await storage.deleteFile({ fileKey: key });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除图片失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '删除失败' 
    }, { status: 500 });
  }
}
