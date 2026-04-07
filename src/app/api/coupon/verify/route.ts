import { NextRequest, NextResponse } from 'next/server';
import {
  verifyCoupon,
  getVerificationRecords,
  getCouponByCouponCode,
  getCouponByVerificationCode,
} from '@/lib/coupon-service';

// 核销优惠券
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code, // 优惠券码或核销码
      channel, // mini_program 或 offline_store
      orderId,
      orderAmount,
      storeId,
      storeName,
      operatorId,
      operatorName,
    } = body;

    if (!code || !channel || !orderId || orderAmount === undefined) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数',
      }, { status: 400 });
    }

    const result = verifyCoupon(
      code,
      channel,
      orderId,
      orderAmount,
      storeId,
      storeName,
      operatorId,
      operatorName
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        discountAmount: result.discountAmount,
        message: '核销成功',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('核销优惠券失败:', error);
    return NextResponse.json({
      success: false,
      error: '核销失败',
    }, { status: 500 });
  }
}

// 获取核销记录
export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get('storeId') || undefined;
  const startDate = request.nextUrl.searchParams.get('startDate') || undefined;
  const endDate = request.nextUrl.searchParams.get('endDate') || undefined;

  const records = getVerificationRecords(storeId, startDate, endDate);
  return NextResponse.json({
    success: true,
    data: records,
  });
}

// 查询优惠券信息（核销前预览）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({
        success: false,
        error: '请输入优惠券码',
      }, { status: 400 });
    }

    let coupon = getCouponByVerificationCode(code);
    if (!coupon) {
      coupon = getCouponByCouponCode(code);
    }

    if (!coupon) {
      return NextResponse.json({
        success: false,
        error: '优惠券不存在',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: coupon.id,
        templateName: coupon.templateName,
        couponCode: coupon.couponCode,
        verificationCode: coupon.verificationCode,
        type: coupon.type,
        discountRate: coupon.discountRate,
        fullAmount: coupon.fullAmount,
        reduceAmount: coupon.reduceAmount,
        cashAmount: coupon.cashAmount,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        useChannel: coupon.useChannel,
        validStartTime: coupon.validStartTime,
        validEndTime: coupon.validEndTime,
        status: coupon.status,
        memberName: coupon.memberName,
        memberPhone: coupon.memberPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      },
    });
  } catch (error) {
    console.error('查询优惠券失败:', error);
    return NextResponse.json({
      success: false,
      error: '查询失败',
    }, { status: 500 });
  }
}
