import { http } from '../http';

export interface DashboardTotals {
  branches: number;
  activeStudents: number;
  admins: number;
  revenue: number;
  outstandingDebt: number;
  currency: string;
}

export interface DashboardBranchItem {
  id: string;
  name: string;
  isMain: boolean;
  isArchived: boolean;
  students: number;
  admins: number;
  revenue: number;
  debt: number;
}

export interface DashboardData {
  totals: DashboardTotals;
  branches: DashboardBranchItem[];
}

export const dashboardApi = {
  get: () => http.get<DashboardData>('/super/dashboard'),
};
