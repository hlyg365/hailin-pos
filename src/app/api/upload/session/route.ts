import { NextRequest, NextResponse } from 'next/server';
import { getUploadSessions, cleanupExpiredSessions } from '@/lib/upload-sessions';

export const dynamic = 'force-dynamic';

// 创建上传会话
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId } = body;
    
    // 生成会话ID
    const sessionId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    // 会话有效期10分钟
    const expiresAt = Date.now() + 10 * 60 * 1000;
    
    // 创建会话
    const uploadSessions = getUploadSessions();
    uploadSessions.set(sessionId, {
      productId: productId || '',
      createdAt: Date.now(),
      expiresAt,
      uploadedImages: [],
      status: 'pending',
    });

    // 生成扫码上传页面URL
    const domain = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'http://localhost:5000';
    const uploadUrl = `${domain}/upload-mobile?session=${sessionId}`;

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        uploadUrl,
        expiresAt,
        expiresIn: 600, // 秒
      }
    });
  } catch (error) {
    console.error('创建上传会话失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '创建会话失败' 
    }, { status: 500 });
  }
}

// 查询会话状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ success: false, error: '缺少会话ID' }, { status: 400 });
    }

    // 清理过期会话
    cleanupExpiredSessions();

    const uploadSessions = getUploadSessions();
    const session = uploadSessions.get(sessionId);
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: '会话不存在或已过期' 
      }, { status: 404 });
    }

    // 检查是否过期
    if (Date.now() > session.expiresAt) {
      session.status = 'expired';
      uploadSessions.delete(sessionId);
      return NextResponse.json({ 
        success: false, 
        error: '会话已过期' 
      }, { status: 410 });
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        productId: session.productId,
        uploadedImages: session.uploadedImages,
        status: session.status,
        expiresAt: session.expiresAt,
      }
    });
  } catch (error) {
    console.error('查询会话失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '查询失败' 
    }, { status: 500 });
  }
}

// 更新会话（添加上传的图片）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, imageKey, imageUrl } = body;
    
    if (!sessionId || !imageKey) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    const uploadSessions = getUploadSessions();
    const session = uploadSessions.get(sessionId);
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: '会话不存在或已过期' 
      }, { status: 404 });
    }

    // 检查是否过期
    if (Date.now() > session.expiresAt) {
      uploadSessions.delete(sessionId);
      return NextResponse.json({ 
        success: false, 
        error: '会话已过期' 
      }, { status: 410 });
    }

    // 添加上传的图片
    session.uploadedImages.push({ key: imageKey, url: imageUrl });
    
    return NextResponse.json({
      success: true,
      data: {
        uploadedImages: session.uploadedImages,
      }
    });
  } catch (error) {
    console.error('更新会话失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '更新失败' 
    }, { status: 500 });
  }
}

// 完成会话
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      return NextResponse.json({ success: false, error: '缺少会话ID' }, { status: 400 });
    }

    const uploadSessions = getUploadSessions();
    const session = uploadSessions.get(sessionId);
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: '会话不存在' 
      }, { status: 404 });
    }

    // 标记会话完成
    session.status = 'completed';
    
    // 返回上传的图片列表
    const result = {
      sessionId,
      productId: session.productId,
      uploadedImages: session.uploadedImages,
    };
    
    // 清理会话（延迟清理，给客户端足够时间获取结果）
    setTimeout(() => {
      uploadSessions.delete(sessionId);
    }, 60000); // 1分钟后清理

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('完成会话失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '操作失败' 
    }, { status: 500 });
  }
}
