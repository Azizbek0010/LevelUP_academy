import { useEffect } from 'react';
import { useAuth } from '../../auth.jsx';
import { useAuthStore } from './shared/stores/auth';

/**
 * Мост между общим auth-контекстом staff (useAuth) и отдельным zustand-стором
 * ported-кода Super Admin (frontend/superadmin, ветка shohjahon). Один логин
 * (staff Login.jsx, /api/auth/staff/login) — токен/юзер уже известны в
 * useAuth(), здесь просто зеркалим их в useAuthStore, чтобы shared/api/http.ts
 * (Bearer-заголовок) и компоненты, читающие useAuthStore напрямую, работали
 * без второго независимого запроса /auth/refresh.
 */
export default function AuthSync({ children }) {
  const { token, user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (token && user) {
      useAuthStore.setState({ accessToken: token, user, status: 'authenticated' });
    } else {
      useAuthStore.setState({ accessToken: null, user: null, status: 'unauthenticated' });
    }
  }, [token, user, loading]);

  if (loading) return null;
  return children;
}
