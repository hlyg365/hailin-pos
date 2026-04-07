import { NextRequest, NextResponse } from 'next/server';
import {
  getCouponTemplates,
  createCouponTemplate,
  updateCouponTemplate,
  CouponTemplate,
} from '@/lib/coupon-service';

// 获取优惠券模板列表
export async function GET(request: NextRequest) {
  const templates = getCouponTemplates();
  return NextResponse.json({
    success: true,
    data: templates,
  });
}

// 创建优惠券模板
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const template = createCouponTemplate(body as Partial<CouponTemplate>);
    return NextResponse.json({
      success: true,
      data: template,
      message: '优惠券模板创建成功',
    });
  } catch (error) {
    console.error('创建优惠券模板失败:', error);
    return NextResponse.json({
      success: false,
      error: '创建失败',
    }, { status: 500 });
  }
}

// 更新优惠券模板
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少优惠券ID',
      }, { status: 400 });
    }
    
    const template = updateCouponTemplate(id, data as Partial<CouponTemplate>);
    
    if (!template) {
      return NextResponse.json({
        success: false,
        error: '优惠券不存在',
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: template,
      message: '优惠券更新成功',
    });
  } catch (error) {
    console.error('更新优惠券模板失败:', error);
    return NextResponse.json({
      success: false,
      error: '更新失败',
    }, { status: 500 });
  }
}
