import { NextRequest, NextResponse } from 'next/server';
import { getPendingApprovals, getAllApprovalFlows } from '@/lib/approval-service';

// 获取待审批列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const approverId = searchParams.get('approverId');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const flowType = searchParams.get('flowType');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await getPendingApprovals({
      approverId: approverId || undefined,
      role: role || undefined,
      status: status as any,
      flowType: flowType as any,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result.records,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('获取待审批列表失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取待审批列表失败',
    }, { status: 500 });
  }
}

// 获取所有审批流程配置
export async function OPTIONS(request: NextRequest) {
  try {
    const flows = await getAllApprovalFlows();
    return NextResponse.json({
      success: true,
      data: flows,
    });
  } catch (error) {
    console.error('获取审批流程配置失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取审批流程配置失败',
    }, { status: 500 });
  }
}
