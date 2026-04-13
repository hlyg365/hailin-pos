import { NextRequest, NextResponse } from 'next/server';
import { approveRequest, getApprovalRecord, cancelApprovalRequest } from '@/lib/approval-service';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取审批记录详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recordId } = await params;
    const record = await getApprovalRecord(recordId);

    if (!record) {
      return NextResponse.json({
        success: false,
        error: '审批记录不存在',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('获取审批记录失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取审批记录失败',
    }, { status: 500 });
  }
}

// 审批操作（通过、拒绝、取消）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recordId } = await params;
    const body = await request.json();
    const { action, approverId, approverName, comment } = body;

    // 验证必填字段
    if (!action || !approverId || !approverName) {
      return NextResponse.json({
        success: false,
        error: '缺少必填字段',
      }, { status: 400 });
    }

    if (!['approved', 'rejected', 'cancelled'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: '无效的审批操作',
      }, { status: 400 });
    }

    const updatedRecord = await approveRequest({
      recordId,
      approverId,
      approverName,
      action,
      comment,
    });

    // 如果审批通过，需要执行相应的业务逻辑
    if (updatedRecord.status === 'approved' && updatedRecord.request_type === 'promotion') {
      // 创建实际的促销活动
      await createPromotionFromApproval(updatedRecord);
    } else if (updatedRecord.status === 'approved' && updatedRecord.request_type === 'purchase') {
      // 创建实际的采购订单
      await createPurchaseFromApproval(updatedRecord);
    }

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: getApprovalMessage(action, updatedRecord),
    });
  } catch (error) {
    console.error('审批操作失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '审批操作失败',
    }, { status: 500 });
  }
}

// 取消审批申请
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recordId } = await params;
    const { searchParams } = new URL(request.url);
    const applicantId = searchParams.get('applicantId');

    if (!applicantId) {
      return NextResponse.json({
        success: false,
        error: '缺少申请人ID',
      }, { status: 400 });
    }

    const updatedRecord = await cancelApprovalRequest(recordId, applicantId);

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: '审批申请已取消',
    });
  } catch (error) {
    console.error('取消审批申请失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '取消审批申请失败',
    }, { status: 500 });
  }
}

// 从审批记录创建促销活动
async function createPromotionFromApproval(record: any) {
  const { request_data, store_id, store_name } = record;
  const promotionData = {
    name: request_data.name,
    type: request_data.type,
    start_date: request_data.start_date,
    end_date: request_data.end_date,
    products: request_data.products,
    remark: request_data.remark,
    shop_id: store_id,
    shop_name: store_name,
    status: 'active',
    approval_record_id: record.id,
    created_at: new Date().toISOString(),
  };

  // 这里应该保存到促销活动表中
  // 示例代码
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('promotion_activities')
      .insert(promotionData);

    if (error) {
      console.error('创建促销活动失败:', error);
    }
  } catch (error) {
    console.error('创建促销活动失败:', error);
  }
}

// 从审批记录创建采购订单
async function createPurchaseFromApproval(record: any) {
  const { request_data } = record;
  const purchaseData = {
    ...request_data,
    approval_record_id: record.id,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  // 这里应该保存到采购订单表中
  // 示例代码
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('purchase_orders')
      .insert(purchaseData);

    if (error) {
      console.error('创建采购订单失败:', error);
    }
  } catch (error) {
    console.error('创建采购订单失败:', error);
  }
}

// 获取审批消息
function getApprovalMessage(action: string, record: any): string {
  if (action === 'approved') {
    if (record.status === 'approved') {
      return '审批已通过，已创建相应的业务记录';
    } else {
      return '审批已通过，进入下一审批环节';
    }
  } else if (action === 'rejected') {
    return '审批已拒绝';
  } else if (action === 'cancelled') {
    return '审批申请已取消';
  }
  return '操作完成';
}

