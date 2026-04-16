// ============================================
// 海邻到家 - 会员Hook
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MemberService, Member, MemberLevel, MemberStatus, MEMBER_LEVEL_CONFIG, MemberLoginResponse } from '../services/memberService';
import { useAuthStore } from '@hailin/core';

interface UseMemberOptions {
  autoLoad?: boolean;
}

interface UseMemberResult {
  currentMember: Member | null;
  loading: boolean;
  error: string | null;
  isLoggedIn: boolean;
  login: (phone: string, password?: string) => Promise<Member>;
  quickLogin: (phone: string) => Promise<Member>;
  logout: () => void;
  verifyCode: (code: string) => Promise<Member>;
  refresh: () => Promise<void>;
  update: (data: Partial<Member>) => Promise<Member>;
}

/** 当前会员Hook */
export function useMember(options: UseMemberOptions = {}): UseMemberResult {
  const { autoLoad = false } = options;
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 从本地存储恢复
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem('hailin_current_member');
    if (stored) {
      try {
        setCurrentMember(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('hailin_current_member');
      }
    }
  }, []);

  // 保存到本地
  const saveToStorage = useCallback((member: Member | null) => {
    if (typeof window === 'undefined') return;
    
    if (member) {
      localStorage.setItem('hailin_current_member', JSON.stringify(member));
    } else {
      localStorage.removeItem('hailin_current_member');
    }
  }, []);

  const login = useCallback(async (phone: string, password?: string): Promise<Member> => {
    setLoading(true);
    setError(null);

    try {
      const response = await MemberService.login(phone, password);

      if (response.success) {
        setCurrentMember(response.data.member);
        saveToStorage(response.data.member);
        return response.data.member;
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [saveToStorage]);

  const quickLogin = useCallback(async (phone: string): Promise<Member> => {
    setLoading(true);
    setError(null);

    try {
      const response = await MemberService.quickLogin(phone);

      if (response.success) {
        setCurrentMember(response.data.member);
        saveToStorage(response.data.member);
        return response.data.member;
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [saveToStorage]);

  const logout = useCallback(() => {
    setCurrentMember(null);
    saveToStorage(null);
  }, [saveToStorage]);

  const verifyCode = useCallback(async (code: string): Promise<Member> => {
    setLoading(true);
    setError(null);

    try {
      const response = await MemberService.verifyMemberCode(code);

      if (response.success) {
        setCurrentMember(response.data);
        saveToStorage(response.data);
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [saveToStorage]);

  const refresh = useCallback(async () => {
    if (!currentMember?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await MemberService.getById(currentMember.id);

      if (response.success) {
        setCurrentMember(response.data);
        saveToStorage(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentMember?.id, saveToStorage]);

  const update = useCallback(async (data: Partial<Member>): Promise<Member> => {
    if (!currentMember?.id) {
      throw new Error('未登录');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await MemberService.update(currentMember.id, data);

      if (response.success) {
        setCurrentMember(response.data);
        saveToStorage(response.data);
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentMember?.id, saveToStorage]);

  return {
    currentMember,
    loading,
    error,
    isLoggedIn: !!currentMember,
    login,
    quickLogin,
    logout,
    verifyCode,
    refresh,
    update,
  };
}

/** 会员折扣计算Hook */
export function useMemberDiscount() {
  const { currentMember } = useMember();

  const isBirthday = useMemo(() => {
    if (!currentMember?.birthday) return false;
    const today = new Date().toISOString().slice(5, 10); // MM-DD
    return currentMember.birthday.slice(5, 10) === today;
  }, [currentMember?.birthday]);

  const levelConfig = useMemo(() => {
    if (!currentMember) return MEMBER_LEVEL_CONFIG[MemberLevel.NORMAL];
    return MEMBER_LEVEL_CONFIG[currentMember.level];
  }, [currentMember?.level]);

  const calculateDiscount = useCallback((amount: number): number => {
    return MemberService.calculateDiscount(amount, currentMember?.level || MemberLevel.NORMAL, isBirthday);
  }, [currentMember?.level, isBirthday]);

  const calculatePoints = useCallback((amount: number): number => {
    return MemberService.calculatePoints(amount, currentMember?.level || MemberLevel.NORMAL, isBirthday);
  }, [currentMember?.level, isBirthday]);

  return {
    currentMember,
    levelConfig,
    isBirthday,
    levelName: levelConfig.name,
    discountRate: levelConfig.discount,
    pointsMultiplier: levelConfig.pointsMultiplier,
    calculateDiscount,
    calculatePoints,
  };
}

/** 会员列表Hook */
export function useMemberList(options: {
  storeId?: string;
  keyword?: string;
  level?: MemberLevel;
  status?: MemberStatus;
} = {}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = useCallback(async (params: any = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await MemberService.getList({
        storeId: options.storeId,
        level: options.level,
        status: options.status,
        keyword: options.keyword,
        page,
        pageSize,
        ...params,
      });

      if (response.success) {
        setMembers(response.data.members);
        setTotal(response.data.total);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [options.storeId, options.level, options.status, options.keyword, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const search = useCallback(async (keyword: string) => {
    setPage(1);
    await load({ keyword });
  }, [load]);

  return {
    members,
    loading,
    error,
    total,
    page,
    pageSize,
    load,
    search,
    nextPage: () => setPage(p => p + 1),
    prevPage: () => setPage(p => Math.max(1, p - 1)),
  };
}

/** 会员积分历史Hook */
export function useMemberPointsHistory(memberId: string) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (params: any = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await MemberService.getPointsHistory({
        memberId,
        page: 1,
        pageSize: 50,
        ...params,
      });

      if (response.success) {
        setRecords(response.data.records);
        setTotal(response.data.total);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  return { records, loading, error, total, load };
}
