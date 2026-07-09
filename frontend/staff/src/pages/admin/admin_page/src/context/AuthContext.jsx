import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { login as apiLogin } from '../services/adminService.js';

const AuthContext = createContext(null);

function getInitialUser() {
  try {
    const stored = localStorage.getItem('admin_user');
    if (stored) return JSON.parse(stored);
  } catch {}
  // Demo mode: auto-setup mock auth
  const mockUser = { firstName: 'Admin', lastName: '' };
  localStorage.setItem('admin_user', JSON.stringify(mockUser));
  localStorage.setItem('admin_token', 'mock-token');
  return mockUser;
}

function getInitialToken() {
  const stored = localStorage.getItem('admin_token');
  if (stored) return stored;
  // Token was set by getInitialUser above
  return 'mock-token';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  const [token, setToken] = useState(getInitialToken);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      const { token: t, user: u } = res;
      localStorage.setItem('admin_token', t);
      localStorage.setItem('admin_user', JSON.stringify(u));
      setToken(t);
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) return;
    const handle = setInterval(() => {
      const t = localStorage.getItem('admin_token');
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
