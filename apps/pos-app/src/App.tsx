import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CashierPage from './pages/CashierPage';
import MemberPage from './pages/MemberPage';
import SuspendedOrdersPage from './pages/SuspendedOrdersPage';
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';
import MiniStorePage from './pages/MiniStorePage';
import AssistantPage from './pages/AssistantPage';
import OfflineIndicator from './components/OfflineIndicator';
import ClearanceModeIndicator from './components/ClearanceModeIndicator';

function App() {
  return (
    <>
      <OfflineIndicator />
      <ClearanceModeIndicator />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pos" element={<HomePage />} />
          <Route path="/pos/login" element={<LoginPage />} />
          <Route path="/pos/cashier" element={<CashierPage />} />
          <Route path="/pos/member" element={<MemberPage />} />
          <Route path="/pos/suspended" element={<SuspendedOrdersPage />} />
          <Route path="/pos/settings" element={<SettingsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/*" element={<DashboardPage />} />
          <Route path="/mini" element={<MiniStorePage />} />
          <Route path="/mini/*" element={<MiniStorePage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/assistant/*" element={<AssistantPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
