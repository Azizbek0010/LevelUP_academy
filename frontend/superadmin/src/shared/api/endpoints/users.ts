import type { Role } from '@/shared/types';
import { http } from '../http';

export interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  note?: string | null;
  workingSince?: string | null; // ISO дата начала работы
  position?: string | null;
}

export interface UserCreateInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: Role;
  password: string;
  note?: string | null;
  workingSince?: string | null;
  position?: string | null;
}

export interface UserUpdateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  role?: Role;
  note?: string | null;
  workingSince?: string | null;
  position?: string | null;
}

export interface ChangePasswordInput {
  password: string;
}

export const usersApi = {
  list: (params?: { role?: Role; isActive?: boolean }) =>
    http.get<{ items: UserItem[] }>('/superadmin/users', {
      query: {
        role: params?.role,
        isActive: params?.isActive === undefined ? undefined : String(params.isActive),
      },
    }),
  get: (id: string) => http.get<UserItem>(`/superadmin/users/${id}`),
  create: (input: UserCreateInput) => http.post<UserItem>('/superadmin/users', input),
  update: (id: string, input: UserUpdateInput) =>
    http.patch<UserItem>(`/superadmin/users/${id}`, input),
  remove: (id: string) => http.delete<{ ok: boolean }>(`/superadmin/users/${id}`),
  archive: (id: string) => http.post<UserItem>(`/superadmin/users/${id}/archive`),
  unarchive: (id: string) => http.post<UserItem>(`/superadmin/users/${id}/unarchive`),
  changePassword: (id: string, input: ChangePasswordInput) =>
    http.post<{ ok: boolean }>(`/superadmin/users/${id}/password`, input),

  updateMe: (input: UserUpdateInput) => http.patch<UserItem>('/auth/me', input),
  changeMyPassword: (input: { currentPassword: string; newPassword: string }) =>
    http.post<{ ok: boolean }>('/auth/me/password', input),
};
