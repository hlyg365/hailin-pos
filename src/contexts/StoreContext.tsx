'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 店铺接口
export interface Store {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  status: 'active' | 'inactive';
  type: 'flagship' | 'branch' | 'franchise';
}

// 店铺列表
const stores: Store[] = [
  {
    id: 'store_001',
    name: '海邻到家·南山总店',
    code: 'NS001',
    address: '深圳市南山区科技园路88号',
    phone: '0755-8888-0001',
    status: 'active',
    type: 'flagship',
  },
  {
    id: 'store_002',
    name: '海邻到家·福田分店',
    code: 'FT001',
    address: '深圳市福田区华强北路168号',
    phone: '0755-8888-0002',
    status: 'active',
    type: 'branch',
  },
  {
    id: 'store_003',
    name: '海邻到家·宝安分店',
    code: 'BA001',
    address: '深圳市宝安区新安街道50号',
    phone: '0755-8888-0003',
    status: 'active',
    type: 'branch',
  },
];

// 营业员接口
export interface Cashier {
  id: string;
  name: string;
  code: string;
  role: 'admin' | 'manager' | 'cashier';
}

// 营业员列表
const cashiers: Cashier[] = [
  { id: 'cashier_001', name: '张三', code: '001', role: 'manager' },
  { id: 'cashier_002', name: '李四', code: '002', role: 'cashier' },
  { id: 'cashier_003', name: '王五', code: '003', role: 'cashier' },
];

// 上下文类型
interface StoreContextType {
  // 当前店铺
  currentStore: Store | null;
  stores: Store[];
  setCurrentStore: (store: Store) => void;
  
  // 当前营业员
  currentCashier: Cashier | null;
  cashiers: Cashier[];
  setCurrentCashier: (cashier: Cashier) => void;
  
  // 交接班状态
  shiftStatus: 'idle' | 'working' | 'handover';
  setShiftStatus: (status: 'idle' | 'working' | 'handover') => void;
  shiftStartTime: Date | null;
  setShiftStartTime: (time: Date | null) => void;
  
  // 店铺筛选器（用于数据过滤）
  storeFilter: string;
  setStoreFilter: (filter: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Provider组件
export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [currentCashier, setCurrentCashier] = useState<Cashier | null>(null);
  const [shiftStatus, setShiftStatus] = useState<'idle' | 'working' | 'handover'>('idle');
  const [shiftStartTime, setShiftStartTime] = useState<Date | null>(null);
  const [storeFilter, setStoreFilter] = useState('current');

  // 初始化：从localStorage读取
  useEffect(() => {
    const savedStoreId = localStorage.getItem('pos_current_store');
    const savedCashierId = localStorage.getItem('pos_current_cashier');
    const savedShiftStatus = localStorage.getItem('pos_shift_status');
    const savedShiftStart = localStorage.getItem('pos_shift_start');

    if (savedStoreId) {
      const store = stores.find(s => s.id === savedStoreId);
      if (store) setCurrentStore(store);
    } else {
      // 默认选择第一个店铺
      setCurrentStore(stores[0]);
    }

    if (savedCashierId) {
      const cashier = cashiers.find(c => c.id === savedCashierId);
      if (cashier) setCurrentCashier(cashier);
    }

    if (savedShiftStatus) {
      setShiftStatus(savedShiftStatus as 'idle' | 'working' | 'handover');
    }

    if (savedShiftStart) {
      setShiftStartTime(new Date(savedShiftStart));
    }
  }, []);

  // 保存到localStorage
  useEffect(() => {
    if (currentStore) {
      localStorage.setItem('pos_current_store', currentStore.id);
    }
  }, [currentStore]);

  useEffect(() => {
    if (currentCashier) {
      localStorage.setItem('pos_current_cashier', currentCashier.id);
    }
  }, [currentCashier]);

  useEffect(() => {
    localStorage.setItem('pos_shift_status', shiftStatus);
  }, [shiftStatus]);

  useEffect(() => {
    if (shiftStartTime) {
      localStorage.setItem('pos_shift_start', shiftStartTime.toISOString());
    }
  }, [shiftStartTime]);

  return (
    <StoreContext.Provider
      value={{
        currentStore,
        stores,
        setCurrentStore,
        currentCashier,
        cashiers,
        setCurrentCashier,
        shiftStatus,
        setShiftStatus,
        shiftStartTime,
        setShiftStartTime,
        storeFilter,
        setStoreFilter,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

// Hook
export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

// 导出数据供其他模块使用
export { stores as storeList, cashiers as cashierList };
