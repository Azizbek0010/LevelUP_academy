import { http } from '../http';

export interface MethodistItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: 'active' | 'frozen';
  createdAt: string;
}

export interface MethodistCreateInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface MethodistUpdateInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export const methodistsApi = {
  list: () => http.get<{ methodists: MethodistItem[] }>('/super/methodists'),
  create: (input: MethodistCreateInput) =>
    http.post<{ methodist: MethodistItem }>('/super/methodists', input),
  update: (id: string, input: MethodistUpdateInput) =>
    http.patch<{ methodist: MethodistItem }>(`/super/methodists/${id}`, input),
  freeze: (id: string, frozen: boolean) =>
    http.patch<{ methodist: MethodistItem }>(`/super/methodists/${id}/freeze`, { frozen }),
};
