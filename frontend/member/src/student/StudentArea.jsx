import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { fmtMoney } from './format.js';
import { setAccessToken, setOnPaymentOverdue, setOnSessionExpired } from './api.js';
import { Button } from './components/ui.jsx';

function InfoScreen({ title, children, action }) {
  return (
    <div className="min-h-screen grid place-items-center px-6" style={{ background: 'var(--bg)' }}>
      <div className="card bg-base-100 rounded-3xl max-w-md w-full p-8 text-center animate-scale-in">
        <img src="/logo-mark.svg" alt="" width={44} className="mx-auto mb-5" />
        <h2 className="text-xl font-extrabold mb-2">{title}</h2>
        <div className="text-sm text-base-content/55 leading-relaxed mb-6">{children}</div>
        {action}
      </div>
    </div>
  );
}

/** 402 от blockIfOverdue — просроченный счёт закрывает весь кабинет студента до оплаты. */
function PaymentOverdue({ amount, onLogout }) {
  return (
    <InfoScreen
      title="Доступ приостановлен"
      action={<Button hue="slate" onClick={onLogout}>Выйти</Button>}
    >
      По твоему счёту есть просроченная задолженность
      {amount ? <> — <b className="text-base-content">{fmtMoney(amount)}</b></> : null}. Кабинет
      откроется сразу после оплаты — обратись к администратору учебного центра.
    </InfoScreen>
  );
}

/**
 * Мост между корневой сессией панели member (auth.jsx, токен в React-state) и
 * самостоятельным api.js кабинета студента (перенесён из бывшего frontend/student
 * без изменений во внутренней логике — у него своя память токена в модуле).
 * Смонтирован один раз над всеми /student/* роутами.
 */
export default function StudentArea() {
  const { token, logout } = useAuth();
  const [overdue, setOverdue] = useState(null);

  useEffect(() => {
    setAccessToken(token);
  }, [token]);

  useEffect(() => {
    setOnPaymentOverdue((amount) => setOverdue({ amount }));
    setOnSessionExpired(() => logout());
  }, [logout]);

  if (overdue) return <PaymentOverdue amount={overdue.amount} onLogout={logout} />;

  return <Outlet />;
}
