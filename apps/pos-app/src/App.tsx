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

// 认证守卫组件
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentEmployee } = useEmployeeStore();
  
  if (!currentEmployee) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// 默认重定向到登录页
function DefaultRoute() {
  const { currentEmployee } = useEmployeeStore();
  
  if (currentEmployee) {
    // 已登录，根据角色跳转到对应页面
    const rolePaths = {
      admin: '/dashboard',
      manager: '/assistant',
      cashier: '/pos/cashier',
    };
    return <Navigate to={rolePaths[currentEmployee.role] || '/pos/cashier'} replace />;
  }
  
  // 未登录，跳转到登录页
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DefaultRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pos/cashier" element={<AuthGuard><CashierPage /></AuthGuard>} />
        <Route path="/pos/member" element={<AuthGuard><MemberPage /></AuthGuard>} />
        <Route path="/pos/suspended" element={<AuthGuard><SuspendedOrdersPage /></AuthGuard>} />
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
