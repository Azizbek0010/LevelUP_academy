// Все запросы идут на /api (dev-прокси Vite → http://localhost:4000).
// VITE_API_URL — боевой бэкенд (Render) для production build.
// credentials:'include' — чтобы refresh-cookie ставилась и слалась.

const API_BASE = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL || '' : '';

async function rawRequest(path, { method = 'GET', body, token } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      method,
      credentials: 'include',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch сам бросает сырой TypeError ("Failed to fetch") при обрыве сети/
    // недоступном сервере — до пользователя это доходить не должно
    const err = new Error('Сервер недоступен. Проверьте подключение и попробуйте ещё раз');
    err.status = 0;
    throw err;
  }
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
const AUTH_PATHS = new Set([
  '/auth/main/login', '/auth/main/google', '/auth/refresh', '/auth/logout',
  '/auth/forgot-password', '/auth/reset-password',
]);

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
  // auth
  loginMain: (login, password) =>
    request('/auth/main/login', { method: 'POST', body: { login, password } }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  googleLogin: (idToken) => request('/auth/main/google', { method: 'POST', body: { idToken } }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body }),

  // dashboard / partners
  dashboard: (token) => request('/main/dashboard', { token }),
  partners: (token) => request('/main/partners', { token }),
  setPartnerStatus: (token, id, status) =>
    request(`/main/partners/${id}/status`, { method: 'PATCH', token, body: { status } }),
  onboardPartner: (token, body) =>
    request('/main/partners', { method: 'POST', token, body }),

  // leads
  leads: (token, status) =>
    request(`/main/leads${status ? `?status=${status}` : ''}`, { token }),
  updateLead: (token, id, body) =>
    request(`/main/leads/${id}`, { method: 'PATCH', token, body }),

  // pricing
  getPricing: (token) => request('/main/pricing', { token }),
  updatePricing: (token, body) => request('/main/pricing', { method: 'PUT', token, body }),
};
