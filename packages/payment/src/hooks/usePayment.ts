// ============================================
// 海邻到家 - 支付Hook
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { PaymentService, PaymentChannel, PaymentStatus, PaymentResponse, RefundRequest } from '../services/paymentService';
import type { Order, PaymentDetail } from '@hailin/order';

interface UsePaymentOptions {
  order?: Order | null;
  amount?: number;
  onSuccess?: (response: PaymentResponse) => void;
  onFailed?: (error: string) => void;
}

interface UsePaymentResult {
  status: PaymentStatus;
  loading: boolean;
  error: string | null;
  qrcode: string | null;
  transactionNo: string | null;
  pollTimer: number | null;
  startPayment: (channel: PaymentChannel, amount?: number) => Promise<PaymentResponse>;
  cancelPayment: () => Promise<void>;
  checkPaymentStatus: () => Promise<PaymentStatus>;
  refund: (request: RefundRequest) => Promise<any>;
}

/** 支付Hook */
export function usePayment(options: UsePaymentOptions = {}): UsePaymentResult {
  const { order, onSuccess, onFailed } = options;
  const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [transactionNo, setTransactionNo] = useState<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  // 清理轮询
  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // 轮询支付状态
  const startPolling = useCallback((orderId: string) => {
    clearPollTimer();
    
    pollTimerRef.current = window.setInterval(async () => {
      try {
        const response = await PaymentService.queryPayment(orderId);
        
        if (response.success) {
          const { status: paymentStatus } = response.data;
          
          if (paymentStatus === PaymentStatus.SUCCESS) {
            clearPollTimer();
            setStatus(PaymentStatus.SUCCESS);
            setTransactionNo(response.data.transactionNo);
            onSuccess?.(response.data);
          } else if (paymentStatus === PaymentStatus.FAILED || paymentStatus === PaymentStatus.CANCELLED) {
            clearPollTimer();
            setStatus(PaymentStatus.FAILED);
            setError('支付失败或已取消');
            onFailed?.('支付失败或已取消');
          }
        }
      } catch (err: any) {
        console.error('Poll payment status error:', err);
      }
    }, 2000); // 每2秒轮询
  }, [clearPollTimer, onSuccess, onFailed]);

  // 开始支付
  const startPayment = useCallback(async (channel: PaymentChannel, amount?: number): Promise<PaymentResponse> => {
    if (!order) {
      throw new Error('订单信息不存在');
    }

    setLoading(true);
    setError(null);
    setStatus(PaymentStatus.PROCESSING);
    setQrcode(null);
    setTransactionNo(null);

    try {
      const response = await PaymentService.createPayment({
        orderId: order.id,
        orderNo: order.orderNo,
        amount: amount || order.finalAmount,
        channel,
        subject: `海邻到家订单-${order.orderNo}`,
        operatorId: order.operatorId,
        operatorName: order.operatorName,
        terminalNo: order.terminalNo,
      });

      if (response.success) {
        const { status: paymentStatus, qrcode: qr, transactionNo: txNo } = response.data;
        
        setStatus(paymentStatus);
        
        if (qr) {
          setQrcode(qr);
        }
        
        if (txNo) {
          setTransactionNo(txNo);
        }

        // 扫码支付需要轮询
        if (channel !== PaymentChannel.CASH) {
          startPolling(order.id);
        }

        if (paymentStatus === PaymentStatus.SUCCESS) {
          onSuccess?.(response.data);
        } else if (paymentStatus === PaymentStatus.FAILED) {
          setError('支付失败');
          onFailed?.('支付失败');
        }

        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setStatus(PaymentStatus.FAILED);
      setError(err.message);
      onFailed?.(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [order, startPolling, onSuccess, onFailed]);

  // 取消支付
  const cancelPayment = useCallback(async () => {
    if (!order) return;

    clearPollTimer();
    
    try {
      await PaymentService.cancelPayment(order.id);
    } finally {
      setStatus(PaymentStatus.CANCELLED);
      setQrcode(null);
    }
  }, [order, clearPollTimer]);

  // 检查支付状态
  const checkPaymentStatus = useCallback(async (): Promise<PaymentStatus> => {
    if (!order) return PaymentStatus.PENDING;

    const response = await PaymentService.queryPayment(order.id);
    
    if (response.success) {
      setStatus(response.data.status);
      return response.data.status;
    }
    
    return PaymentStatus.PENDING;
  }, [order]);

  // 退款
  const refund = useCallback(async (request: RefundRequest): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const response = await PaymentService.refund(request);
      
      if (response.success) {
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
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      clearPollTimer();
    };
  }, [clearPollTimer]);

  return {
    status,
    loading,
    error,
    qrcode,
    transactionNo,
    pollTimer: pollTimerRef.current,
    startPayment,
    cancelPayment,
    checkPaymentStatus,
    refund,
  };
}

/** 现金支付Hook */
export function useCashPayment() {
  const [received, setReceived] = useState<number>(0);
  const [change, setChange] = useState<number>(0);
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});

  const updateReceived = useCallback((amount: number) => {
    setReceived(amount);
    const newChange = PaymentService.calculateChange(0, amount); // 稍后用实际金额
    setChange(newChange);
    setBreakdown(PaymentService.calculateChangeBreakdown(0, amount));
  }, []);

  const calculateChange = useCallback((amount: number, received: number) => {
    setReceived(received);
    setChange(PaymentService.calculateChange(amount, received));
    setBreakdown(PaymentService.calculateChangeBreakdown(amount, received));
  }, []);

  const quickReceive = useCallback((totalAmount: number) => {
    // 快捷收款金额
    const quickAmounts = [
      totalAmount,
      Math.ceil(totalAmount / 10) * 10,
      Math.ceil(totalAmount / 50) * 50,
      Math.ceil(totalAmount / 100) * 100,
      Math.ceil(totalAmount / 200) * 200,
    ];
    return [...new Set(quickAmounts)];
  }, []);

  return {
    received,
    change,
    breakdown,
    updateReceived,
    calculateChange,
    quickReceive,
  };
}

/** 支付记录Hook */
export function usePaymentRecords(options: {
  storeId?: string;
  channel?: PaymentChannel;
  status?: PaymentStatus;
} = {}) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = useCallback(async (params: any = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await PaymentService.getPaymentRecords({
        storeId: options.storeId,
        channel: options.channel,
        status: options.status,
        page,
        pageSize,
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
  }, [options.storeId, options.channel, options.status, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    records,
    loading,
    error,
    total,
    page,
    pageSize,
    load,
    nextPage: () => setPage(p => p + 1),
    prevPage: () => setPage(p => Math.max(1, p - 1)),
  };
}
