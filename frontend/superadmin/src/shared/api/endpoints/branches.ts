import { http } from '../http';

export interface BranchItem {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isMain: boolean;
  isArchived: boolean;
  admins: number;
  students: number;
  createdAt: string;
}

export interface BranchCreateInput {
  name: string;
  address?: string;
  phone?: string;
}

export interface BranchUpdateInput {
  name?: string;
  address?: string;
  phone?: string;
}

export interface BranchAdminItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

export interface BranchGroupItem {
  id: string;
  name: string;
  subject: string;
  monthlyPrice: number;
}

export interface BranchDetail extends Omit<BranchItem, 'admins'> {
  admins: BranchAdminItem[] | number;
  groups: BranchGroupItem[];
}

export const branchesApi = {
  list: () => http.get<{ branches: BranchItem[] }>('/super/branches'),
  get: (id: string) => http.get<{ branch: BranchDetail }>(`/super/branches/${id}`),
  create: (input: BranchCreateInput) =>
    http.post<{ branch: BranchItem }>('/super/branches', input),
  update: (id: string, input: BranchUpdateInput) =>
    http.patch<{ branch: BranchItem }>(`/super/branches/${id}`, input),
  archive: (id: string) => http.post<{ branch: BranchItem }>(`/super/branches/${id}/archive`),
  unarchive: (id: string) =>
    http.post<{ branch: BranchItem }>(`/super/branches/${id}/unarchive`),
};
