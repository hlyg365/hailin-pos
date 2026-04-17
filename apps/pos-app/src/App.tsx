import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pos/cashier" element={<CashierPage />} />
        <Route path="/pos/member" element={<MemberPage />} />
        <Route path="/pos/suspended" element={<SuspendedOrdersPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/bi" element={<BIPage />} />
        <Route path="/dashboard/store-ops" element={<StoreOpsPage />} />
        <Route path="/dashboard/promotion" element={<PromotionPage />} />
        <Route path="/dashboard/auth" element={<AuthPage />} />
        <Route path="/mini" element={<MiniStorePage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/customer-display" element={<CustomerDisplay />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
