import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, MEMBER_URL } from './auth.jsx';
import { fmtMoney } from './format.js';

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

const screenStyle = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 14,
  textAlign: 'center',
  padding: 24,
};

const actionStyle = {
  padding: '10px 20px',
  borderRadius: 10,
  background: 'var(--accent, #C6FF34)',
  color: '#000',
  fontWeight: 600,
  textDecoration: 'none',
  border: 'none',
  cursor: 'pointer',
};

/** Сессии нет — вход делает общий Auth-модуль (member), не эта панель. */
function NoSession() {
  return (
    <div style={screenStyle}>
      <img src="/logo-mark.svg" alt="" width={44} />
      <h2>Нужен вход</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '38ch' }}>
        Сессия не найдена. Войди через общий вход LevelUp Academy — после авторизации кабинет
        студента откроется автоматически.
      </p>
      <a href={`${MEMBER_URL}/login`} style={actionStyle}>
        Перейти к входу
      </a>
    </div>
  );
}

/** Вошёл не студент (например, родитель) — этот кабинет не для него. */
function WrongRole({ onLogout }) {
  return (
    <div style={screenStyle}>
      <img src="/logo-mark.svg" alt="" width={44} />
      <h2>Кабинет ученика</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '38ch' }}>
        Эта панель доступна только ученикам. Войди под учётной записью ученика.
      </p>
      <button type="button" onClick={onLogout} style={actionStyle}>
        Выйти
      </button>
    </div>
  );
}

/** 402 от blockIfOverdue — просроченный счёт закрывает весь кабинет до оплаты. */
function PaymentOverdue({ amount, onLogout }) {
  return (
    <div style={screenStyle}>
      <img src="/logo-mark.svg" alt="" width={44} />
      <h2>Доступ приостановлен</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '42ch' }}>
        По твоему счёту есть просроченная задолженность
        {amount ? (
          <>
            {' '}
            — <b>{fmtMoney(amount)}</b>
          </>
        ) : null}
        . Кабинет откроется сразу после оплаты — обратись к администратору учебного центра.
      </p>
      <button type="button" onClick={onLogout} style={actionStyle}>
        Выйти
      </button>
    </div>
  );
}

export default function App() {
  const { user, ready, overdue, logout } = useAuth();

  if (!ready) return <Splash />;
  if (!user) return <NoSession />;
  if (user.role !== 'student') return <WrongRole onLogout={logout} />;
  if (overdue) return <PaymentOverdue amount={overdue.amount} onLogout={logout} />;

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
