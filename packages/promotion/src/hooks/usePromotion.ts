// ============================================
// 海邻到家 - 促销Hook
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PromotionService, Promotion, PromotionType, PromotionStatus, CreatePromotionRequest, PromotionResult, CalculatePromotionRequest } from '../services/promotionService';
import type { OrderItem } from '@hailin/order';
import type { MemberLevel } from '@hailin/member';

interface UsePromotionsOptions {
  storeId?: string;
  autoLoad?: boolean;
}

interface UsePromotionsResult {
  promotions: Promotion[];
  loading: boolean;
  error: string | null;
  total: number;
  load: () => Promise<void>;
  create: (request: CreatePromotionRequest) => Promise<Promotion>;
  update: (id: string, request: Partial<CreatePromotionRequest>) => Promise<Promotion>;
  delete: (id: string) => Promise<void>;
  submitForApproval: (id: string) => Promise<void>;
  approve: (id: string, approved: boolean, reason?: string) => Promise<void>;
  pause: (id: string) => Promise<void>;
  resume: (id: string) => Promise<void>;
}

/** 促销列表Hook */
export function usePromotions(options: UsePromotionsOptions = {}): UsePromotionsResult {
  const { storeId, autoLoad = false } = options;
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = useCallback(async (params: any = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await PromotionService.getList({
        storeId,
        page,
        pageSize,
        ...params,
      });

      if (response.success) {
        setPromotions(response.data.promotions);
        setTotal(response.data.total);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeId, page, pageSize]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  const create = useCallback(async (request: CreatePromotionRequest): Promise<Promotion> => {
    const response = await PromotionService.create(request);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    await load();
    return response.data;
  }, [load]);

  const update = useCallback(async (id: string, request: Partial<CreatePromotionRequest>): Promise<Promotion> => {
    const response = await PromotionService.update(id, request);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    setPromotions(prev => prev.map(p => p.id === id ? response.data : p));
    return response.data;
  }, []);

  const deletePromotion = useCallback(async (id: string): Promise<void> => {
    const response = await PromotionService.delete(id);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    setPromotions(prev => prev.filter(p => p.id !== id));
  }, []);

  const submitForApproval = useCallback(async (id: string): Promise<void> => {
    const response = await PromotionService.submitForApproval(id);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    await load();
  }, [load]);

  const approve = useCallback(async (id: string, approved: boolean, reason?: string): Promise<void> => {
    const response = await PromotionService.approve(id, approved, reason);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    await load();
  }, [load]);

  const pause = useCallback(async (id: string): Promise<void> => {
    const response = await PromotionService.pause(id);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, status: PromotionStatus.PAUSED } : p));
  }, []);

  const resume = useCallback(async (id: string): Promise<void> => {
    const response = await PromotionService.resume(id);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, status: PromotionStatus.RUNNING } : p));
  }, []);

  return {
    promotions,
    loading,
    error,
    total,
    load,
    create,
    update,
    delete: deletePromotion,
    submitForApproval,
    approve,
    pause,
    resume,
  };
}

/** 促销计算Hook */
export function usePromotionCalculator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PromotionResult[]>([]);
  const [appliedPromotions, setAppliedPromotions] = useState<Set<string>>(new Set());

  const calculate = useCallback(async (request: CalculatePromotionRequest): Promise<PromotionResult[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await PromotionService.calculate(request);

      if (response.success) {
        setResults(response.data);
        return response.data;
      } else {
        setError(response.message);
        return [];
      }
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const apply = useCallback(async (promotionId: string, orderId: string): Promise<void> => {
    const response = await PromotionService.apply(promotionId, orderId);

    if (!response.success) {
      throw new Error(response.message);
    }

    setAppliedPromotions(prev => new Set([...prev, promotionId]));
  }, []);

  const cancelApply = useCallback(async (promotionId: string, orderId: string): Promise<void> => {
    const response = await PromotionService.cancelApply(promotionId, orderId);

    if (!response.success) {
      throw new Error(response.message);
    }

    setAppliedPromotions(prev => {
      const next = new Set(prev);
      next.delete(promotionId);
      return next;
    });
  }, []);

  const getTotalDiscount = useCallback((): number => {
    return results
      .filter(r => appliedPromotions.has(r.promotionId))
      .reduce((sum, r) => sum + r.discountAmount, 0);
  }, [results, appliedPromotions]);

  const getTotalPointsBonus = useCallback((): number => {
    return results
      .filter(r => appliedPromotions.has(r.promotionId))
      .reduce((sum, r) => sum + (r.pointsBonus || 0), 0);
  }, [results, appliedPromotions]);

  const togglePromotion = useCallback((promotionId: string, selected: boolean) => {
    setAppliedPromotions(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(promotionId);
      } else {
        next.delete(promotionId);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setAppliedPromotions(new Set());
  }, []);

  return {
    loading,
    error,
    results,
    appliedPromotions,
    appliedCount: appliedPromotions.size,
    calculate,
    apply,
    cancelApply,
    togglePromotion,
    getTotalDiscount,
    getTotalPointsBonus,
    clear,
  };
}

/** 可用促销Hook */
export function useAvailablePromotions(storeId: string, memberId?: string, memberLevel?: MemberLevel) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (totalAmount?: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await PromotionService.getAvailable({
        storeId,
        memberId,
        memberLevel,
        totalAmount,
      });

      if (response.success) {
        setPromotions(response.data);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeId, memberId, memberLevel]);

  useEffect(() => {
    load();
  }, [load]);

  return { promotions, loading, error, load, reload: load };
}

/** 晚8点清货Hook */
export function useClearanceMode() {
  const [isClearanceMode, setIsClearanceMode] = useState(false);
  const [clearanceDiscount, setClearanceDiscount] = useState(0.8); // 8折

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      // 晚上8点到11点为清货时间
      setIsClearanceMode(hour >= 20 && hour < 23);
    };

    checkTime();
    const timer = setInterval(checkTime, 60000); // 每分钟检查

    return () => clearInterval(timer);
  }, []);

  const calculateClearancePrice = useCallback((price: number): number => {
    if (!isClearanceMode) return price;
    return Math.round(price * clearanceDiscount * 100) / 100;
  }, [isClearanceMode, clearanceDiscount]);

  return {
    isClearanceMode,
    clearanceDiscount,
    calculateClearancePrice,
    setClearanceDiscount,
  };
}
