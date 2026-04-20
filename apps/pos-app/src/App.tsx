import { useState, useEffect } from 'react';
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

// 收银台认证守卫
function CashierAuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// 默认路由 - APP直接进入收银台登录页，PC显示首页
function DefaultRoute() {
  // 检查是否在Android APP中运行
  const isAndroidApp = typeof window !== 'undefined' && 
    /Android/.test(navigator.userAgent) &&
    (window as any).Capacitor?.Plugins?.AppInfo !== undefined;
  
  // 简化的检测：只要有Capacitor就认为是APP
  const hasCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;
  
  console.log('[路由] isAndroidApp:', isAndroidApp, 'hasCapacitor:', hasCapacitor, 'userAgent:', navigator.userAgent);
  
  if (hasCapacitor) {
    // APP端：直接进入收银台登录页
    return <Navigate to="/pos/login" replace />;
  } else {
    // PC端：显示首页
    return <HomePage />;
  }
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
