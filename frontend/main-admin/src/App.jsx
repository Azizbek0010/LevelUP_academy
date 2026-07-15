import { useRef } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { useDashboard } from './queries.js';
import Layout from './components/Layout.jsx';
import Splash from './components/Splash.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leads from './pages/Leads.jsx';
import Organizations from './pages/Organizations.jsx';
import OrgDetail from './pages/OrgDetail.jsx';
import Billing from './pages/Billing.jsx';
import Revenue from './pages/Revenue.jsx';
import Settings from './pages/Settings.jsx';

function BootGate({ children }) {
  const { token, loading } = useAuth();
  const { data } = useDashboard();
  const booted = useRef(false);
  if (data) booted.current = true;

  if (loading) return <Splash />;
  if (token && !booted.current) return <Splash />;
  return children;
}

function Protected({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { token } = useAuth();
  return (
    <BootGate>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
        <Route element={<Protected><Layout /></Protected>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/organizations/:id" element={<OrgDetail />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/revenue" element={<Revenue />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BootGate>
  );
}
