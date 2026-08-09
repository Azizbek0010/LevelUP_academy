import { createContext, useContext, useEffect, useState } from 'react';
import { api, setOnTokenRefreshed } from './api.js';

const AuthCtx = createContext({ token: null, user: null, loading: true, login: null, loginWithGoogle: null, logout: null });

/* Сессия живёт в httpOnly-cookie — из JS её не прочитать. Поэтому держим
   лёгкую клиентскую отметку: был ли вход. Без неё (гость или после выхода)
   refresh на старте НЕ дёргаем — иначе браузер пишет красный 401 «Refresh
   token required» на странице входа при каждой загрузке. Ставим отметку при
   успешном входе/refresh, снимаем при выходе и при 401. */
const SESSION_FLAG = 'staff_has_session';
const hasSessionFlag = () => {
  try { return localStorage.getItem(SESSION_FLAG) === '1'; } catch { return false; }
};
const setSessionFlag = (on) => {
  try {
    if (on) localStorage.setItem(SESSION_FLAG, '1');
    else localStorage.removeItem(SESSION_FLAG);
  } catch { /* localStorage недоступен (private mode) — не критично */ }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Нет отметки о входе → сессии заведомо нет, refresh не шлём (чистая консоль).
    if (!hasSessionFlag()) { setLoading(false); return; }
    api
      .refresh()
      .then((d) => {
        setToken(d.accessToken);
        setUser(d.user);
        setSessionFlag(true);
      })
      .catch(() => { setSessionFlag(false); })
      .finally(() => setLoading(false));
  }, []);

  // Авто-refresh на 401 (из api.js) обновляет сессию здесь же, без ре-логина
  useEffect(() => {
    setOnTokenRefreshed((d) => {
      if (d) {
        setToken(d.accessToken);
        setUser(d.user);
        setSessionFlag(true);
      } else {
        setToken(null);
        setUser(null);
        setSessionFlag(false);
      }
    });
  }, []);

  const login = async (email, password) => {
    const d = await api.loginStaff(email, password);
    setToken(d.accessToken);
    setUser(d.user);
    setSessionFlag(true);
  };

  const loginWithGoogle = async () => {
    const { signInWithGoogle } = await import('./firebase.js');
    const idToken = await signInWithGoogle();
    const d = await api.googleLogin(idToken);
    setToken(d.accessToken);
    setUser(d.user);
    setSessionFlag(true);
  };

  const logout = async () => {
    await api.logout().catch(() => {});
    setToken(null);
    setUser(null);
    setSessionFlag(false);
  };

  /* Профиль правится на своей странице, а имя и аватар живут ещё и в шапке.
     Без этого после сохранения в шапке оставалось прежнее имя — до
     перелогина пользователь видел два разных себя одновременно. */
  const patchUser = (patch) => setUser((prev) => (prev ? { ...prev, ...patch } : prev));

  return (
    <AuthCtx.Provider value={{ token, user, loading, login, loginWithGoogle, logout, patchUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx) ?? { token: null, user: null, loading: false, login: null, loginWithGoogle: null, logout: null };
