import { NextRequest, NextResponse } from 'next/server';
import { createApprovalRequest, getMyApplications, ApprovalRecord } from '@/lib/approval-service';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取促销申请列表
export async function GET(request: NextRequest) {
  const supabase = getSupabaseClient();
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    if (userId) {
      // 获取用户的申请列表
      const result = await getMyApplications({
        applicantId: userId,
        status: status as any,
      });
      return NextResponse.json({
        success: true,
        data: result.records,
        total: result.total,
      });
    }

    // 获取所有待审批的促销申请
    const { data, error } = await supabase
      .from('approval_records')
      .select('*')
      .eq('request_type', 'promotion')
      .eq('status', status || 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      total: data?.length || 0,
    });
  } catch (error) {
    console.error('获取促销申请列表失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取促销申请列表失败',
    }, { status: 500 });
  }
}

// 创建促销申请
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      start_date,
      end_date,
      products,
      remark,
      shopId,
      shopName,
      applicantId,
      applicantName,
      // 区分店铺促销还是总部促销
      isHeadquarters = false,
    } = body;

    // 验证必填字段
    if (!name || !start_date || !end_date || !products || products.length === 0) {
      return NextResponse.json({
        success: false,
        error: '请填写完整的促销信息',
      }, { status: 400 });
    }

    // 生成请求ID
    const requestId = `promo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 保存促销数据到临时存储（审批通过后才会真正创建促销活动）
    const promotionData = {
      name,
      type,
      start_date,
      end_date,
      products,
      remark,
      shopId: shopId || null,
      shopName: shopName || null,
    };

    // 创建审批记录
    const flowType: 'store_promotion' | 'hq_promotion' = isHeadquarters
      ? 'hq_promotion'
      : 'store_promotion';

    const approvalRecord = await createApprovalRequest({
      requestId,
      requestType: 'promotion',
      title: `${isHeadquarters ? '总部' : '店铺'}促销申请: ${name}`,
      applicantId: applicantId || 'system',
      applicantName: applicantName || '系统',
      storeId: isHeadquarters ? undefined : shopId,
      storeName: isHeadquarters ? undefined : shopName,
      flowType,
      requestData: promotionData,
    });

    return NextResponse.json({
      success: true,
      data: {
        requestId,
        approvalRecord,
        message: isHeadquarters
          ? '总部促销申请已提交，等待运营经理审批'
          : '店铺促销申请已提交，等待运营经理审批',
      },
    });
  } catch (error) {
    console.error('创建促销申请失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '创建促销申请失败',
    }, { status: 500 });
  }
}
