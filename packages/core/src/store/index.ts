// ============================================
// 海邻到家 - 统一状态管理
// 使用Zustand实现，适配多端
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { 
  Staff, Store, Cart, Member, Product, Order 
} from '../types';

// ============ 认证状态 ============

interface AuthState {
  user: Staff | null;
  store: Store | null;
  token: string | null;
  isAuthenticated: boolean;
  loginType: 'pos' | 'dashboard' | 'assistant' | 'store-admin' | null;
  
  // Actions
  setAuth: (user: Staff, store: Store | null, token: string, loginType: AuthState['loginType']) => void;
  logout: () => void;
  updateUser: (user: Partial<Staff>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      store: null,
      token: null,
      isAuthenticated: false,
      loginType: null,
      
      setAuth: (user, store, token, loginType) => set({
        user,
        store,
        token,
        isAuthenticated: true,
        loginType,
      }),
      
      logout: () => set({
        user: null,
        store: null,
        token: null,
        isAuthenticated: false,
        loginType: null,
      }),
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
    }),
    {
      name: 'hailin-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        store: state.store,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        loginType: state.loginType,
      }),
    }
  )
);

// ============ 购物车状态 ============

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  
  // Actions
  setCart: (cart: Cart | null) => void;
  setLoading: (loading: boolean) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  cart: null,
  isLoading: false,
  
  setCart: (cart) => set({ cart }),
  setLoading: (isLoading) => set({ isLoading }),
  clearCart: () => set({ cart: null }),
}));

// ============ 会员状态 ============

interface MemberState {
  currentMember: Member | null;
  isLoading: boolean;
  
  // Actions
  setCurrentMember: (member: Member | null) => void;
  setLoading: (loading: boolean) => void;
  updatePoints: (points: number) => void;
}

export const useMemberStore = create<MemberState>()((set) => ({
  currentMember: null,
  isLoading: false,
  
  setCurrentMember: (currentMember) => set({ currentMember }),
  setLoading: (isLoading) => set({ isLoading }),
  updatePoints: (points) => set((state) => ({
    currentMember: state.currentMember 
      ? { ...state.currentMember, points: state.currentMember.points + points }
      : null,
  })),
}));

// ============ 设备状态 ============

interface DeviceState {
  printerConnected: boolean;
  scannerConnected: boolean;
  cashboxConnected: boolean;
  scaleConnected: boolean;
  displayConnected: boolean;
  
  // Actions
  updateDeviceStatus: (device: string, connected: boolean) => void;
  resetDevices: () => void;
}

export const useDeviceStore = create<DeviceState>()((set) => ({
  printerConnected: false,
  scannerConnected: false,
  cashboxConnected: false,
  scaleConnected: false,
  displayConnected: false,
  
  updateDeviceStatus: (device, connected) => set((state) => ({
    [`${device}Connected`]: connected,
  })),
  
  resetDevices: () => set({
    printerConnected: false,
    scannerConnected: false,
    cashboxConnected: false,
    scaleConnected: false,
    displayConnected: false,
  }),
}));

// ============ 应用状态 ============

interface AppState {
  // 晚8点清货模式
  nightModeEnabled: boolean;
  nightModeDiscount: number;
  
  // 离线状态
  isOnline: boolean;
  pendingSyncCount: number;
  
  // Actions
  setNightMode: (enabled: boolean, discount?: number) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  setPendingSyncCount: (count: number) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  nightModeEnabled: false,
  nightModeDiscount: 0.8, // 8折
  
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingSyncCount: 0,
  
  setNightMode: (enabled, discount = 0.8) => set({ 
    nightModeEnabled: enabled, 
    nightModeDiscount: discount 
  }),
  
  setOnlineStatus: (isOnline) => set({ isOnline }),
  
  setPendingSyncCount: (count) => set({ pendingSyncCount: count }),
}));

// ============ 导出所有Store ============

export const stores = {
  auth: useAuthStore,
  cart: useCartStore,
  member: useMemberStore,
  device: useDeviceStore,
  app: useAppStore,
};

export default stores;
