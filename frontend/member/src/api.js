// Все запросы идут на /api (dev-прокси Vite → http://localhost:4000).
// VITE_API_URL — боевой бэкенд (Render) для production build.
// USE_MOCKS = true — эмуляция на localStorage для разработки без бэкенда.
//
// Вход учеников/родителей: POST /api/auth/member/login, поле называется `login`
// (в него кладут ЛОГИН-КОД, не email). Тело идентично staff/main. Google-входа нет.

const API_BASE = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL || '' : '';
// По умолчанию включены (разработка без бэкенда); выключить реальным бэком: VITE_USE_MOCKS=false в .env.
const USE_MOCKS =
  typeof import.meta !== 'undefined' ? import.meta.env.VITE_USE_MOCKS !== 'false' : true;

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

async function rawRequest(path, { method = 'GET', body, token } = {}) {
  if (USE_MOCKS) {
    await delay();

    // -------- AUTH (member — student/parent) --------
    if (path === '/auth/member/login') {
      const { login, password } = body;

      // Мок-креды (совпадают с backend seed / CLAUDE.md)
      const MOCK_MEMBERS = [
        { code: 'demostud', password: '123456', role: 'student', firstName: 'Диёр', lastName: 'Собиров' },
        { code: 'demopare', password: '654321', role: 'parent', firstName: 'Нодира', lastName: 'Собирова' },
      ];

      const account = MOCK_MEMBERS.find(
        (m) => m.code === String(login).trim().toLowerCase() && m.password === password
      );

      if (!account) {
        const err = new Error('Неверный логин-код или пароль');
        err.status = 401;
        throw err;
      }

      const user = {
        id: `mock-${account.role}-id-001`,
        firstName: account.firstName,
        lastName: account.lastName,
        role: account.role,
        loginCode: account.code,
      };
      localStorage.setItem('mock_member_token', `mock-jwt-${account.role}-xyz`);
      localStorage.setItem('mock_member_user', JSON.stringify(user));
      return { user, accessToken: `mock-jwt-${account.role}-xyz` };
    }

    if (path === '/auth/refresh') {
      const mockToken = localStorage.getItem('mock_member_token');
      const mockUser = JSON.parse(localStorage.getItem('mock_member_user') || 'null');
      if (mockToken && mockUser) {
        return { user: mockUser, accessToken: mockToken };
      }
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }

    if (path === '/auth/logout') {
      localStorage.removeItem('mock_member_token');
      localStorage.removeItem('mock_member_user');
      return { success: true };
    }

    const err = new Error('Mock route not implemented: ' + path);
    err.status = 404;
    throw err;
  }

  // Реальный бэкенд-запрос (credentials:'include' — иначе refresh-cookie не работает)
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.fields = data.details || data.errors || null;
    throw err;
  }
  return data;
}

// Пути, которым нельзя подсовывать авто-refresh (иначе цикл/логин ломается)
const AUTH_PATHS = new Set(['/auth/member/login', '/auth/refresh', '/auth/logout']);

// Единый refreshPromise — параллельные 401 ждут один и тот же refresh, не долбят его по отдельности
let refreshPromise = null;
let onTokenRefreshed = null;
export function setOnTokenRefreshed(cb) { onTokenRefreshed = cb; }

function refreshOnce() {
  if (!refreshPromise) {
    refreshPromise = rawRequest('/auth/refresh', { method: 'POST' })
      .then((d) => {
        onTokenRefreshed?.(d);
        return d.accessToken;
      })
      .catch((err) => {
        onTokenRefreshed?.(null);
        throw err;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

// Авто-refresh на 401: один раз пробуем обновить токен и повторить запрос
async function request(path, opts = {}) {
  try {
    return await rawRequest(path, opts);
  } catch (err) {
    if (err.status === 401 && !AUTH_PATHS.has(path) && !opts._retried) {
      const newToken = await refreshOnce();
      return rawRequest(path, { ...opts, token: newToken, _retried: true });
    }
    throw err;
  }
}

export const api = {
  // Вход ученика/родителя — поле `login` = логин-код (8 символов)
  loginMember: (login, password) =>
    request('/auth/member/login', { method: 'POST', body: { login, password } }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
};
