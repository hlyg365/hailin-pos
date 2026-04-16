// ============================================
// 海邻到家 - 会员模块导出
// ============================================

export { MemberService, MemberLevel, MemberStatus, MEMBER_LEVEL_CONFIG, type Member, type RegisterMemberRequest, type UpdateMemberRequest, type PointsRecord } from './services/memberService';
export { useMember, useMemberDiscount, useMemberList, useMemberPointsHistory } from './hooks/useMember';
