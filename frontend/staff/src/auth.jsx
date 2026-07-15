import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const AuthCtx = createContext(null);

const STORAGE_KEY_TOKEN = 'staff_access_token';
const STORAGE_KEY_USER = 'staff_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY_TOKEN); } catch { return null; }
  });
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USER);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Persist token + user to localStorage whenever they change
  useEffect(() => {
    try {
      if (token) localStorage.setItem(STORAGE_KEY_TOKEN, token);
      else localStorage.removeItem(STORAGE_KEY_TOKEN);
    } catch {}
  }, [token]);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY_USER);
    } catch {}
  }, [user]);

  useEffect(() => {
    // If we already have a token from localStorage, skip refresh
    if (token) { setLoading(false); return; }
    api
      .refresh()
      .then((d) => {
        setToken(d.accessToken);
        setUser(d.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
    try {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch {}
  };

  return (
    <AuthCtx.Provider value={{ token, user, loading, login, loginWithGoogle, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
