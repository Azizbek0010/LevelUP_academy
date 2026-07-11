import { createContext, useContext, useEffect, useState } from 'react';
import { api, setAccessToken, setOnSessionExpired, setOnPaymentOverdue } from './api.js';

const AuthCtx = createContext(null);

/** URL общего входа (панель member) — там логинятся student и parent. */
export const MEMBER_URL =
  (typeof import.meta !== 'undefined' && import.meta.env.VITE_MEMBER_URL) ||
  'http://localhost:5175';

/**
 * Логин — не зона этой панели (его делает общий Auth-модуль, member).
 * Здесь только подхват уже готовой сессии: refresh-cookie выставлен общим
 * входом → api.refresh() отдаёт accessToken + user. Нет сессии → user null.
 *
 * overdue — 402 от blockIfOverdue: у студента просроченный счёт, бэкенд не
 * отдаёт вообще ничего до оплаты. Держим отдельно от ошибок страниц.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [overdue, setOverdue] = useState(null);

  useEffect(() => {
    setOnSessionExpired(() => {
      setAccessToken(null);
      setUser(null);
    });
    setOnPaymentOverdue((amount) => setOverdue({ amount }));

    api
      .refresh()
      .then((d) => {
        setAccessToken(d.accessToken);
        setUser(d.user);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const logout = async () => {
    await api.logout().catch(() => {});
    setAccessToken(null);
    setUser(null);
    window.location.href = `${MEMBER_URL}/login`;
  };

  return (
    <AuthCtx.Provider value={{ user, ready, overdue, logout }}>{children}</AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
