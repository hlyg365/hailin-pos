// 导入 Supabase 客户端获取函数
import { getSupabaseClient } from '../storage/database/supabase-client';

// 审批流程类型定义
export type FlowType = 'store_promotion' | 'hq_promotion' | 'store_purchase' | 'hq_purchase';
export type RequestType = 'promotion' | 'purchase';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ApprovalStep {
  role: string;
  step_name: string;
  step_order: number;
}

export interface ApprovalFlow {
  id: string;
  flow_type: FlowType;
  flow_name: string;
  description: string;
  approval_steps: ApprovalStep[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApprovalHistoryItem {
  step_order: number;
  step_name: string;
  approver_id: string;
  approver_name: string;
  action: 'approved' | 'rejected' | 'cancelled';
  comment?: string;
  timestamp: string;
}

export interface ApprovalRecord {
  id: string;
  request_id: string;
  request_type: RequestType;
  title: string;
  applicant_id: string;
  applicant_name: string;
  store_id?: string;
  store_name?: string;
  flow_type: FlowType;
  flow_config: ApprovalFlow;
  current_step: number;
  status: ApprovalStatus;
  request_data: Record<string, any>;
  approval_history: ApprovalHistoryItem[];
  approver_id?: string;
  approver_name?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// 创建审批申请
export async function createApprovalRequest(params: {
  requestId: string;
  requestType: RequestType;
  title: string;
  applicantId: string;
  applicantName: string;
  storeId?: string;
  storeName?: string;
  flowType: FlowType;
  requestData: Record<string, any>;
}): Promise<ApprovalRecord> {
  // 获取 Supabase 客户端（按需创建）
  const supabase = getSupabaseClient();

  // 获取审批流程配置
  const flow = await getApprovalFlow(params.flowType);
  if (!flow) {
    throw new Error(`未找到审批流程: ${params.flowType}`);
  }

  // 确定当前步骤（如果是申请人的角色，从0开始）
  let currentStep = 1;
  let approverId = '';
  let approverName = '';

  // 查找第一个需要审批的步骤
  const firstApprovalStep = flow.approval_steps.find(step => step.step_order > 0);
  if (firstApprovalStep) {
    currentStep = firstApprovalStep.step_order;
    approverId = getApproverByRole(firstApprovalStep.role)?.id || '';
    approverName = getApproverByRole(firstApprovalStep.role)?.name || '';
  }

  const record: Omit<ApprovalRecord, 'id' | 'created_at' | 'updated_at'> = {
    request_id: params.requestId,
    request_type: params.requestType,
    title: params.title,
    applicant_id: params.applicantId,
    applicant_name: params.applicantName,
    store_id: params.storeId,
    store_name: params.storeName,
    flow_type: params.flowType,
    flow_config: flow,
    current_step: currentStep,
    status: 'pending',
    request_data: params.requestData,
    approval_history: [],
    approver_id: approverId,
    approver_name: approverName,
  };

  // 插入数据库
  const { data, error } = await supabase
    .from('approval_records')
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  return data as ApprovalRecord;
}

// 审批申请
export async function approveRequest(params: {
  recordId: string;
  approverId: string;
  approverName: string;
  action: 'approved' | 'rejected' | 'cancelled';
  comment?: string;
}): Promise<ApprovalRecord> {
  // 获取 Supabase 客户端（按需创建）
  const supabase = getSupabaseClient();

  // 获取审批记录
  const { data: record, error: fetchError } = await supabase
    .from('approval_records')
    .select('*')
    .eq('id', params.recordId)
    .single();

  if (fetchError || !record) throw fetchError || new Error('审批记录不存在');

  const currentRecord = record as ApprovalRecord;

  // 添加审批历史
  const newHistory: ApprovalHistoryItem = {
    step_order: currentRecord.current_step,
    step_name: currentRecord.flow_config.approval_steps.find(
      step => step.step_order === currentRecord.current_step
    )?.step_name || '未知步骤',
    approver_id: params.approverId,
    approver_name: params.approverName,
    action: params.action,
    comment: params.comment,
    timestamp: new Date().toISOString(),
  };

  const updatedHistory = [...currentRecord.approval_history, newHistory];

  // 根据审批结果更新状态
  let newStatus = currentRecord.status;
  let newCurrentStep = currentRecord.current_step;
  let newApproverId = currentRecord.approver_id;
  let newApproverName = currentRecord.approver_name;
  let completedAt = currentRecord.completed_at;

  if (params.action === 'rejected' || params.action === 'cancelled') {
    // 拒绝或取消，流程结束
    newStatus = params.action;
    newApproverId = '';
    newApproverName = '';
    completedAt = new Date().toISOString();
  } else if (params.action === 'approved') {
    // 检查是否还有下一步
    const nextStep = currentRecord.flow_config.approval_steps.find(
      step => step.step_order > currentRecord.current_step
    );

    if (nextStep) {
      // 进入下一步
      newCurrentStep = nextStep.step_order;
      const nextApprover = getApproverByRole(nextStep.role);
      newApproverId = nextApprover?.id || '';
      newApproverName = nextApprover?.name || '';
    } else {
      // 所有步骤完成，审批通过
      newStatus = 'approved';
      newApproverId = '';
      newApproverName = '';
      completedAt = new Date().toISOString();
    }
  }

  // 更新数据库
  const { data: updatedRecord, error: updateError } = await supabase
    .from('approval_records')
    .update({
      current_step: newCurrentStep,
      status: newStatus,
      approval_history: updatedHistory,
      approver_id: newApproverId,
      approver_name: newApproverName,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.recordId)
    .select()
    .single();

  if (updateError) throw updateError;
  return updatedRecord as ApprovalRecord;
}

// 获取审批流程配置
export async function getApprovalFlow(flowType: FlowType): Promise<ApprovalFlow | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('approval_flows')
    .select('*')
    .eq('flow_type', flowType)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // 记录不存在
    }
    throw error;
  }
  return data as ApprovalFlow;
}

// 获取待审批列表
export async function getPendingApprovals(params: {
  approverId?: string;
  role?: string;
  status?: ApprovalStatus;
  flowType?: FlowType;
  limit?: number;
  offset?: number;
}): Promise<{ records: ApprovalRecord[]; total: number }> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('approval_records')
    .select('*', { count: 'exact' });

  if (params.approverId) {
    query = query.eq('approver_id', params.approverId);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.flowType) {
    query = query.eq('flow_type', params.flowType);
  }

  // 如果指定了角色，需要通过 flow_config.approval_steps 过滤
  // 这需要在应用层处理

  if (params.limit) {
    query = query.limit(params.limit);
  }

  if (params.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) throw error;

  let records = data as ApprovalRecord[];

  // 如果指定了角色，在应用层过滤
  if (params.role) {
    records = records.filter(record => {
      const currentStepConfig = record.flow_config.approval_steps.find(
        step => step.step_order === record.current_step
      );
      return currentStepConfig?.role === params.role;
    });
  }

  return {
    records,
    total: count || records.length,
  };
}

// 获取我的申请列表
export async function getMyApplications(params: {
  applicantId: string;
  status?: ApprovalStatus;
  limit?: number;
  offset?: number;
}): Promise<{ records: ApprovalRecord[]; total: number }> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('approval_records')
    .select('*', { count: 'exact' })
    .eq('applicant_id', params.applicantId);

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  if (params.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    records: data as ApprovalRecord[],
    total: count || 0,
  };
}

// 获取审批记录详情
export async function getApprovalRecord(recordId: string): Promise<ApprovalRecord | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('approval_records')
    .select('*')
    .eq('id', recordId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  return data as ApprovalRecord;
}

// 取消审批申请
export async function cancelApprovalRequest(
  recordId: string,
  applicantId: string
): Promise<ApprovalRecord> {
  const record = await getApprovalRecord(recordId);
  if (!record) throw new Error('审批记录不存在');
  if (record.applicant_id !== applicantId) {
    throw new Error('只有申请人可以取消审批');
  }
  if (record.status !== 'pending') {
    throw new Error('只有待审批状态的申请可以取消');
  }

  return approveRequest({
    recordId,
    approverId: applicantId,
    approverName: record.applicant_name,
    action: 'cancelled',
    comment: '申请人主动取消',
  });
}

// 获取所有审批流程配置
export async function getAllApprovalFlows(): Promise<ApprovalFlow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('approval_flows')
    .select('*')
    .eq('is_active', true)
    .order('flow_type');

  if (error) throw error;
  return data as ApprovalFlow[];
}

// 根据角色获取审批人（示例，实际应该从用户表查询）
function getApproverByRole(role: string): { id: string; name: string } | null {
  // 这里应该从数据库或配置中获取对应的审批人
  // 示例映射
  const roleMap: Record<string, { id: string; name: string }> = {
    superadmin: { id: 'hq-001', name: '超级管理员' },
    manager: { id: 'hq-002', name: '运营经理' },
    finance: { id: 'hq-003', name: '财务主管' },
    supply: { id: 'hq-004', name: '供应链专员' },
  };
  return roleMap[role] || null;
}

// 检查用户是否有权限审批某个记录
export function canUserApprove(record: ApprovalRecord, userRole: string): boolean {
  if (record.status !== 'pending') return false;

  const currentStepConfig = record.flow_config.approval_steps.find(
    step => step.step_order === record.current_step
  );

  return currentStepConfig?.role === userRole;
}

// 获取审批进度百分比
export function getApprovalProgress(record: ApprovalRecord): number {
  const totalSteps = record.flow_config.approval_steps.length;
  if (totalSteps === 0) return 0;

  const currentStepIndex = record.flow_config.approval_steps.findIndex(
    step => step.step_order === record.current_step
  );

  if (record.status === 'approved') return 100;
  if (record.status === 'rejected' || record.status === 'cancelled') {
    return Math.round(((currentStepIndex + 1) / totalSteps) * 100);
  }

  return Math.round((currentStepIndex / totalSteps) * 100);
}

// 获取下一步审批人信息
export function getNextApprover(record: ApprovalRecord): {
  role: string;
  stepName: string;
} | null {
  const nextStep = record.flow_config.approval_steps.find(
    step => step.step_order > record.current_step
  );

  if (!nextStep) return null;

  return {
    role: nextStep.role,
    stepName: nextStep.step_name,
  };
}
