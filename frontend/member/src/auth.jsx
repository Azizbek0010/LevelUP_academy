import { createContext, useContext, useEffect, useState } from 'react';
import { api, setOnTokenRefreshed } from './api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // При старте пробуем восстановить сессию по refresh-cookie
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

  // login = ЛОГИН-КОД (не email), Google-входа у member нет
  const login = async (loginCode, password) => {
    const d = await api.loginMember(loginCode, password);
    setToken(d.accessToken);
    setUser(d.user);
  };

  /**
   * Вход через Telegram: сессия уже выдана бэкендом (он проверил, что чат
   * привязан к аккаунту), здесь её остаётся только принять. Отдельно от
   * login(), потому что пароль в этом пути не участвует вовсе.
   */
  const adoptSession = ({ accessToken, user: u }) => {
    setToken(accessToken);
    setUser(u);
  };

  const logout = async () => {
    await api.logout().catch(() => {});
    setToken(null);
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ token, user, loading, login, logout, adoptSession }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
