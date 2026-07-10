import { http } from '../http';

export interface OrganizationPlan {
  branchLimit?: number;
  diskSpace?: string;
}

export interface OrganizationData {
  id: string;
  name: string;
  domain: string | null;
  status: string;
  createdAt: string;
  plan?: OrganizationPlan;
}

export const organizationApi = {
  get: () =>
    http.get<{ organization: OrganizationData }>('/super/organization'),

  update: (input: { name?: string; domain?: string }) =>
    http.patch<{ organization: OrganizationData }>('/super/organization', input),
};
