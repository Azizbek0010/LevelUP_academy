import { createContext, useContext, useEffect, useState } from 'react';
import { api, setOnTokenRefreshed } from './api.js';

const AuthCtx = createContext({ token: null, user: null, loading: true, login: null, loginWithGoogle: null, logout: null });

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .refresh()
      .then((d) => {
        setToken(d.accessToken);
        setUser(d.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Авто-refresh на 401 (из api.js) обновляет сессию здесь же, без ре-логина
  useEffect(() => {
    setOnTokenRefreshed((d) => {
      if (d) {
        setToken(d.accessToken);
        setUser(d.user);
      } else {
        setToken(null);
        setUser(null);
      }
    });
  }, []);

  const login = async (email, password) => {
    const d = await api.loginStaff(email, password);
    setToken(d.accessToken);
    setUser(d.user);
  };

  const loginWithGoogle = async () => {
    const { signInWithGoogle } = await import('./firebase.js');
    const idToken = await signInWithGoogle();
    const d = await api.googleLogin(idToken);
    setToken(d.accessToken);
    setUser(d.user);
  };

  const logout = async () => {
    await api.logout().catch(() => {});
    setToken(null);
    setUser(null);
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
