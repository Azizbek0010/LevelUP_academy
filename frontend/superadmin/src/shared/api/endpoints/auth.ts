import { http } from '../http';
import type { AuthUser } from '../../stores/auth';

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export const authApi = {
  login: (login: string, password: string) =>
    http.post<LoginResponse>('/auth/staff/login', { login, password }, { auth: false }),
  logout: () => http.post<void>('/auth/logout', undefined, { auth: false }),
  me: () => http.get<AuthUser>('/auth/me'),
};
