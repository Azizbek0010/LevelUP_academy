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
    <div className="min-h-screen grid place-items-center" style={{ background: 'var(--bg)' }}>
      <img src="/logo-mark.svg" alt="LevelUp Academy" width={48} className="animate-fade-in" />
    </div>
  );
}

/** Общая обёртка для полноэкранных информационных экранов (без сессии и т.п.). */
function InfoScreen({ title, children, action }) {
  return (
    <div className="min-h-screen grid place-items-center px-6" style={{ background: 'var(--bg)' }}>
      <div className="card bg-base-100 max-w-md w-full p-8 text-center animate-scale-in">
        <img src="/logo-mark.svg" alt="" width={44} className="mx-auto mb-5" />
        <h2 className="text-xl font-extrabold mb-2">{title}</h2>
        <div className="text-sm text-base-content/55 leading-relaxed mb-6">{children}</div>
        {action}
      </div>
    </div>
  );
}

/** Сессии нет — вход делает общий Auth-модуль (member), не эта панель. */
function NoSession() {
  return (
    <InfoScreen
      title="Нужен вход"
      action={<a href={`${MEMBER_URL}/login`} className="btn btn-primary">Перейти к входу</a>}
    >
      Сессия не найдена. Войди через общий вход LevelUp Academy — после авторизации кабинет студента
      откроется автоматически.
    </InfoScreen>
  );
}

/** Вошёл не студент (например, родитель) — этот кабинет не для него. */
function WrongRole({ onLogout }) {
  return (
    <InfoScreen
      title="Кабинет ученика"
      action={<button type="button" onClick={onLogout} className="btn btn-neutral">Выйти</button>}
    >
      Эта панель доступна только ученикам. Войди под учётной записью ученика.
    </InfoScreen>
  );
}

/** 402 от blockIfOverdue — просроченный счёт закрывает весь кабинет до оплаты. */
function PaymentOverdue({ amount, onLogout }) {
  return (
    <InfoScreen
      title="Доступ приостановлен"
      action={<button type="button" onClick={onLogout} className="btn btn-neutral">Выйти</button>}
    >
      По твоему счёту есть просроченная задолженность
      {amount ? <> — <b className="text-base-content">{fmtMoney(amount)}</b></> : null}. Кабинет
      откроется сразу после оплаты — обратись к администратору учебного центра.
    </InfoScreen>
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
