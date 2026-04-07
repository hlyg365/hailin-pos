import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    // 动态导入
    const { getUploadSession, setUploadSession } = await import('@/lib/upload-session');
    
    // 验证token
    const session = getUploadSession(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '上传链接已过期，请重新扫码' },
        { status: 410 }
      );
    }

    if (session.status === 'uploaded') {
      return NextResponse.json(
        { success: false, error: '该链接已使用，请重新扫码' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '请选择要上传的图片' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '仅支持 JPG、PNG、GIF、WebP 格式的图片' },
        { status: 400 }
      );
    }

    // 验证文件大小 (最大1MB)
    const maxSize = 1 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: '图片大小不能超过1MB' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 初始化对象存储
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: "",
      secretKey: "",
      bucketName: process.env.COZE_BUCKET_NAME,
      region: "cn-beijing",
    });

    // 生成文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `products/scan_${timestamp}_${randomStr}.${ext}`;

    // 上传到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: file.type,
    });

    // 生成签名URL（有效期7天）
    const imageUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 604800,
    });

    // 更新会话状态
    setUploadSession(token, {
      status: 'uploaded',
      imageUrl,
      fileKey,
    });

    return NextResponse.json({
      success: true,
      data: {
        imageUrl,
        fileKey,
      }
    });

  } catch (error) {
    console.error('扫码上传失败:', error);
    return NextResponse.json(
      { success: false, error: '上传失败，请稍后重试' },
      { status: 500 }
    );
  }
}
