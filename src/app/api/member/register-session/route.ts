import { NextRequest, NextResponse } from 'next/server';
import { getSession, completeSession, createSession } from '@/lib/member-register-sessions';

// 查询会话状态
export async function GET(request: NextRequest) {
  const session = request.nextUrl.searchParams.get('session');

  if (!session) {
    return NextResponse.json({ error: '缺少session参数' }, { status: 400 });
  }

  const sessionData = getSession(session);

  if (!sessionData) {
    return NextResponse.json({ error: '会话不存在或已过期' }, { status: 404 });
  }

  return NextResponse.json({
    status: sessionData.status,
    member: sessionData.member,
  });
}

// 提交会员信息完成注册
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session, phone, name, birthday, gender } = body;

    if (!session || !phone) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 验证手机号
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: '手机号格式不正确' }, { status: 400 });
    }

    // 检查会话是否存在
    let sessionData = getSession(session);
    if (!sessionData) {
      // 如果会话不存在，创建一个新会话（兼容直接访问的情况）
      sessionData = createSession(session);
    }

    // 完成注册
    const member = {
      id: `M${Date.now().toString(36).toUpperCase()}`,
      phone,
      name: name || '新会员',
      birthday,
      gender,
    };

    completeSession(session, member);

    return NextResponse.json({
      success: true,
      message: '注册成功',
      member,
    });
  } catch (error) {
    console.error('会员注册失败:', error);
    return NextResponse.json({ error: '注册失败，请重试' }, { status: 500 });
  }
}
