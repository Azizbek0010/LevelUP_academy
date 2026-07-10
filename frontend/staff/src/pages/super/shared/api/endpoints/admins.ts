import { http } from '../http';

export interface AdminItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: 'active' | 'frozen';
  branchId: string;
  branchName: string;
  createdAt: string;
}

export interface AdminCreateInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  branchId: string;
  phone?: string;
}

export interface AdminUpdateInput {
  firstName?: string;
  lastName?: string;
  branchId?: string;
  phone?: string;
}

export const adminsApi = {
  list: () => http.get<{ admins: AdminItem[] }>('/super/admins'),
  create: (input: AdminCreateInput) => http.post<{ admin: AdminItem }>('/super/admins', input),
  update: (id: string, input: AdminUpdateInput) =>
    http.patch<{ admin: AdminItem }>(`/super/admins/${id}`, input),
  freeze: (id: string, frozen: boolean) =>
    http.patch<{ admin: AdminItem }>(`/super/admins/${id}/freeze`, { frozen }),
};
