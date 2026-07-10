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
import Billing from './pages/Billing.jsx';
import Placeholder from './pages/Placeholder.jsx';

// Пока идёт восстановление сессии и первая загрузка данных — показываем сплэш с логотипом.
// Дальше между страницами данные берутся из кэша (React Query), сплэша больше нет.
function BootGate({ children }) {
  const { token, loading } = useAuth();
  const { data } = useDashboard(); // префетч данных платформы + гейт
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
        <Route
          element={
            <Protected>
              <Layout />
            </Protected>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/billing" element={<Billing />} />
          <Route
            path="/revenue"
            element={
              <Placeholder
                title="Доход — отчёты"
                note="Графики дохода во времени появятся, когда накопится история платежей (модуль K-ADMIN). Сейчас текущий срез дохода — на Дашборде и в Тарифах."
              />
            }
          />
          <Route
            path="/settings"
            element={<Placeholder title="Настройки" note="Профиль платформы и параметры — в разработке." />}
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BootGate>
  );
}
