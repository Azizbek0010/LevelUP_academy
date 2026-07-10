import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// ─── In-memory access token (XSS-safe vs localStorage) ──────
let _accessToken = null;

export function setAccessToken(token) {
  _accessToken = token;
}

export function getAccessToken() {
  return _accessToken;
}

// ─── Axios instance ────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,              // httpOnly refresh_token cookie
  headers: { 'Content-Type': 'application/json' },
});

// Attach in-memory JWT on every request
api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// ─── 401 → auto-refresh → retry ────────────────────────────
let _isRefreshing = false;
let _refreshQueue = [];

function onRefreshed(newToken) {
  _refreshQueue.forEach(({ resolve }) => resolve(newToken));
  _refreshQueue = [];
}

function onRefreshFailed(error) {
  _refreshQueue.forEach(({ reject }) => reject(error));
  _refreshQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Not a 401, or already retried → reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Prevent refresh loop for the refresh endpoint itself
    if (originalRequest.url?.includes('/auth/refresh')) {
      _accessToken = null;
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (_isRefreshing) {
      return new Promise((resolve, reject) => {
        _refreshQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    _isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${API_URL}/auth/refresh`,
        {},
        { withCredentials: true },    // sends httpOnly refresh_token cookie
      );
      const newToken = data.accessToken;
      _accessToken = newToken;
      onRefreshed(newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      _accessToken = null;
      onRefreshFailed(refreshError);
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      _isRefreshing = false;
    }
  },
);

export default api;
