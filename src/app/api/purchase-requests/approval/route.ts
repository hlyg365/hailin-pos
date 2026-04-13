import { NextRequest, NextResponse } from 'next/server';
import { createApprovalRequest, getMyApplications } from '@/lib/approval-service';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取采购申请列表
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
        data: result.records.filter(r => r.request_type === 'purchase'),
        total: result.total,
      });
    }

    // 获取所有待审批的采购申请
    const { data, error } = await supabase
      .from('approval_records')
      .select('*')
      .eq('request_type', 'purchase')
      .eq('status', status || 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      total: data?.length || 0,
    });
  } catch (error) {
    console.error('获取采购申请列表失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取采购申请列表失败',
    }, { status: 500 });
  }
}

// 创建采购申请（带审批流程）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeId,
      storeName,
      items,
      totalAmount,
      remark,
      applicantId,
      applicantName,
      isHeadquarters = false,
    } = body;

    // 验证必填字段
    if (!storeId || !items || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: '请填写完整的采购信息',
      }, { status: 400 });
    }

    // 生成请求ID
    const requestId = `purchase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 保存采购数据
    const purchaseData = {
      storeId,
      storeName,
      items,
      totalAmount,
      remark,
    };

    // 创建审批记录
    const flowType: 'store_purchase' | 'hq_purchase' = isHeadquarters
      ? 'hq_purchase'
      : 'store_purchase';

    const approvalRecord = await createApprovalRequest({
      requestId,
      requestType: 'purchase',
      title: `${isHeadquarters ? '总部' : '店铺'}采购申请: ${storeName}`,
      applicantId: applicantId || 'system',
      applicantName: applicantName || '系统',
      storeId,
      storeName,
      flowType,
      requestData: purchaseData,
    });

    return NextResponse.json({
      success: true,
      data: {
        requestId,
        approvalRecord,
        message: isHeadquarters
          ? '总部采购申请已提交，等待三级审批（运营经理→财务经理→总经理）'
          : '店铺采购申请已提交，等待运营经理审批',
      },
    });
  } catch (error) {
    console.error('创建采购申请失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '创建采购申请失败',
    }, { status: 500 });
  }
}
