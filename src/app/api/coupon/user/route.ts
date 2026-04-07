import { NextRequest, NextResponse } from 'next/server';
import {
  getUserCoupons,
  issueCouponToUser,
  getAllUserCoupons,
} from '@/lib/coupon-service';

// 获取用户优惠券列表
export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get('memberId');
  const all = request.nextUrl.searchParams.get('all');

  if (all === 'true') {
    // 获取所有用户优惠券（管理端用）
    const coupons = getAllUserCoupons();
    return NextResponse.json({
      success: true,
      data: coupons,
    });
  }

  if (!memberId) {
    return NextResponse.json({
      success: false,
      error: '缺少会员ID',
    }, { status: 400 });
  }

  const coupons = getUserCoupons(memberId);
  return NextResponse.json({
    success: true,
    data: coupons,
  });
}

// 发放优惠券给用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, memberId, memberName, memberPhone, source } = body;

    if (!templateId || !memberId || !memberName || !memberPhone) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数',
      }, { status: 400 });
    }

    const result = issueCouponToUser(
      templateId,
      memberId,
      memberName,
      memberPhone,
      source || 'manual'
    );

    if ('error' in result) {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: '优惠券发放成功',
    });
  } catch (error) {
    console.error('发放优惠券失败:', error);
    return NextResponse.json({
      success: false,
      error: '发放失败',
    }, { status: 500 });
  }
}
