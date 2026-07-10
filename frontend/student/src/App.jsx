import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';

import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Tests from './pages/Tests.jsx';
import TestTake from './pages/TestTake.jsx';
import Homework from './pages/Homework.jsx';
import Videos from './pages/Videos.jsx';
import Shop from './pages/Shop.jsx';
import Leaderboard from './pages/Leaderboard.jsx';

function Splash() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src="/logo-mark.svg" alt="LevelUp Academy" width={48} />
    </div>
  );
}

/** Сессии нет — вход делает общий Auth-модуль, не эта панель. */
function NoSession() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        textAlign: 'center',
        padding: 24,
      }}
    >
      <img src="/logo-mark.svg" alt="" width={44} />
      <h2>Нужен вход</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '38ch' }}>
        Сессия не найдена. Войди через общий вход LevelUp Academy — после авторизации кабинет
        студента откроется автоматически.
      </p>
    </div>
  );
}

export default function App() {
  const { user, ready } = useAuth();

  if (!ready) return <Splash />;
  if (!user) return <NoSession />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tests" element={<Tests />} />
        <Route path="/tests/:testId" element={<TestTake />} />
        <Route path="/homework" element={<Homework />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
