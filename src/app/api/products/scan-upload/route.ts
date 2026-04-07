import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 动态导入以避免编译问题
    const { setUploadSession } = await import('@/lib/upload-session');
    
    // 生成唯一token
    const token = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    // 创建会话
    setUploadSession(token, {
      status: 'pending',
    });

    // 生成扫码上传页面URL
    const host = request.headers.get('host') || 'localhost:5000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const uploadUrl = `${protocol}://${host}/pos/products/scan-upload/${token}`;

    return NextResponse.json({
      success: true,
      data: {
        token,
        uploadUrl,
        expiresIn: 300, // 5分钟有效期
      }
    });

  } catch (error) {
    console.error('创建上传会话失败:', error);
    return NextResponse.json(
      { success: false, error: '创建失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: '缺少token参数' },
        { status: 400 }
      );
    }

    // 动态导入
    const { getUploadSession, deleteUploadSession } = await import('@/lib/upload-session');
    
    const session = getUploadSession(token);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: '会话不存在或已过期' },
        { status: 404 }
      );
    }

    // 检查是否过期
    if (Date.now() - session.createdAt > 5 * 60 * 1000) {
      deleteUploadSession(token);
      return NextResponse.json(
        { success: false, error: '会话已过期' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        status: session.status,
        imageUrl: session.imageUrl,
        fileKey: session.fileKey,
      }
    });

  } catch (error) {
    console.error('检查上传状态失败:', error);
    return NextResponse.json(
      { success: false, error: '检查失败，请稍后重试' },
      { status: 500 }
    );
  }
}
