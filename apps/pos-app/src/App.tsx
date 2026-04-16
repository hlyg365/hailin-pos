import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PosAuthProvider } from '@hailin/core';
import { CartProvider } from '@hailin/cart';
import { MemberProvider } from '@hailin/member';
import { useOnlineStatus, useHardware } from '@hailin/hardware';
import { useClearanceMode } from '@hailin/promotion';

// 页面组件
import LoginPage from './pages/LoginPage';
import CashierPage from './pages/CashierPage';
import MemberPage from './pages/MemberPage';
import SuspendedOrdersPage from './pages/SuspendedOrdersPage';
import SettingsPage from './pages/SettingsPage';
import OfflineIndicator from './components/OfflineIndicator';
import ClearanceModeIndicator from './components/ClearanceModeIndicator';

function AppContent() {
  const isOnline = useOnlineStatus();
  const { isClearanceMode } = useClearanceMode();

  return (
    <>
      {/* 离线指示器 */}
      {!isOnline && <OfflineIndicator />}
      
      {/* 晚8点清货模式 */}
      {isClearanceMode && <ClearanceModeIndicator />}
      
      <Routes>
        {/* 登录页 */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* 收银台主页 */}
        <Route path="/cashier" element={<CashierPage />} />
        
        {/* 会员管理 */}
        <Route path="/member" element={<MemberPage />} />
        
        {/* 挂单列表 */}
        <Route path="/suspended" element={<SuspendedOrdersPage />} />
        
        {/* 设置 */}
        <Route path="/settings" element={<SettingsPage />} />
        
        {/* 默认跳转 */}
        <Route path="*" element={<Navigate to="/cashier" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <PosAuthProvider>
        <CartProvider>
          <MemberProvider>
            <AppContent />
          </MemberProvider>
        </CartProvider>
      </PosAuthProvider>
    </BrowserRouter>
  );
}

export default App;
