// Все запросы идут на /api (dev-прокси Vite → http://localhost:4000).
// credentials:'include' — чтобы refresh-cookie ставилась и слалась.

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`/api${path}`, {
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
