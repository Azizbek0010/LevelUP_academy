import { authStore } from '../stores/auth';

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: ApiErrorPayload,
  ) {
    super(payload.message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
}

const BASE = '/api';

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken: string };
      authStore.setToken(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = path.startsWith('/') ? `${BASE}${path}` : `${BASE}/${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    params.append(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function doFetch(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, init);
}

async function parseError(res: Response): Promise<ApiError> {
  let payload: ApiErrorPayload;
  try {
    const data = (await res.json()) as { error?: ApiErrorPayload };
    payload = data.error ?? { code: 'UNKNOWN', message: res.statusText };
  } catch {
    payload = { code: 'UNKNOWN', message: res.statusText };
  }
  return new ApiError(res.status, payload);
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, query, auth = true, headers, ...rest } = opts;

  const url = buildUrl(path, query);

  const buildInit = (token: string | null): RequestInit => {
    const finalHeaders = new Headers(headers);
    if (body !== undefined && !(body instanceof FormData)) {
      finalHeaders.set('Content-Type', 'application/json');
    }
    if (auth && token) {
      finalHeaders.set('Authorization', `Bearer ${token}`);
    }
    return {
      ...rest,
      headers: finalHeaders,
      credentials: 'include',
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    };
  };

  let token = authStore.getToken();
  let res = await doFetch(url, buildInit(token));

  if (res.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      authStore.clear();
      throw await parseError(res);
    }
    token = newToken;
    res = await doFetch(url, buildInit(token));
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  return (await res.text()) as T;
}

export const http = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'PUT', body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'DELETE' }),
};
