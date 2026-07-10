import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { login as apiLogin } from '../services/adminService.js';
import { setAccessToken, getAccessToken } from '../services/api.js';

const AuthContext = createContext(null);

const DEMO_USER = { firstName: 'Admin', lastName: '' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_USER);
  const [token, setToken] = useState(() => getAccessToken() || 'demo-token');
  const [loading, setLoading] = useState(false);

  // Sync token with api.js module-level variable
  const updateToken = useCallback((t) => {
    setAccessToken(t);
    setToken(t);
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      const { token: t, user: u } = res;
      updateToken(t);
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }, [updateToken]);

  const logout = useCallback(() => {
    updateToken(null);
    setUser(null);
  }, [updateToken]);

  // Periodic check that token is still alive
  useEffect(() => {
    if (!token) return;
    const handle = setInterval(() => {
      const t = getAccessToken();
      if (!t) logout();
    }, 60000);
    return () => clearInterval(handle);
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
