import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CashierPage from './pages/CashierPage';
import DashboardPage from './pages/DashboardPage';
import MiniStorePage from './pages/MiniStorePage';
import AssistantPage from './pages/AssistantPage';
import LoginPage from './pages/LoginPage';
import MemberPage from './pages/MemberPage';
import SuspendedOrdersPage from './pages/SuspendedOrdersPage';
import SettingsPage from './pages/SettingsPage';
import BIPage from './pages/BIPage';
import StoreOpsPage from './pages/StoreOpsPage';
import PromotionPage from './pages/PromotionPage';
import AuthPage from './pages/AuthPage';
import CustomerDisplay from './pages/CustomerDisplay';
import DeviceDebugPage from './pages/DeviceDebugPage';
import { useEmployeeStore } from './store';

// 检测是否为原生APP - 使用useState在组件内检测更可靠
function useIsNativeApp() {
  const [isNative] = useState(() => {
    if (typeof window === 'undefined') return false;
    // 检查Capacitor
    const hasCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
    // 检查UserAgent
    const isMobileUA = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const forceApp = urlParams.get('app') === '1';
    return hasCapacitor || isMobileUA || forceApp;
  });
  return isNative;
}

// 收银台认证守卫
function CashierAuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// 默认路由
function DefaultRoute() {
  const isNativeApp = useIsNativeApp();
  
  if (isNativeApp) {
    return <Navigate to="/pos/login" replace />;
  }
  return <HomePage />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DefaultRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pos/login" element={<LoginPage isCashier={true} />} />
        <Route path="/pos/cashier" element={<CashierAuthGuard><CashierPage /></CashierAuthGuard>} />
        <Route path="/pos/member" element={<CashierAuthGuard><MemberPage /></CashierAuthGuard>} />
        <Route path="/pos/suspended" element={<CashierAuthGuard><SuspendedOrdersPage /></CashierAuthGuard>} />
        <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
        <Route path="/dashboard/bi" element={<AuthGuard><BIPage /></AuthGuard>} />
        <Route path="/dashboard/store-ops" element={<AuthGuard><StoreOpsPage /></AuthGuard>} />
        <Route path="/dashboard/promotion" element={<AuthGuard><PromotionPage /></AuthGuard>} />
        <Route path="/dashboard/auth" element={<AuthGuard><AuthPage /></AuthGuard>} />
        <Route path="/mini" element={<MiniStorePage />} />
        <Route path="/assistant" element={<AuthGuard><AssistantPage /></AuthGuard>} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/customer-display" element={<CustomerDisplay />} />
        <Route path="/device-debug" element={<DeviceDebugPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
