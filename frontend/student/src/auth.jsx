import { createContext, useContext, useEffect, useState } from 'react';
import { api, setAccessToken, setOnSessionExpired } from './api.js';

const AuthCtx = createContext(null);

/**
 * Логин — не зона этой панели (его делает общий Auth-модуль, Elyor).
 * Здесь только подхват уже готовой сессии: refresh-cookie выставлен общим
 * входом → api.refresh() отдаёт accessToken + user. Нет сессии → user null.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOnSessionExpired(() => {
      setAccessToken(null);
      setUser(null);
    });
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
  };

  return <AuthCtx.Provider value={{ user, ready, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
