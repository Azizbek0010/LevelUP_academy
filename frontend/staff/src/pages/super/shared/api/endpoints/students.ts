import { http } from '../http';

export interface StudentCreateInput { firstName: string; lastName: string; phone?: string; parentPhone: string; groupId?: string; }
export interface StudentUpdateInput { firstName?: string; lastName?: string; phone?: string; parentPhone?: string; }

export interface StudentListItem {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  parentPhone: string;
  parentPhone2: string | null;
  telegramChatId: string | null;
  isArchived: boolean;
  isFrozen?: boolean;
  freezeReason?: string | null;
  expectedReturnAt?: string | null;
  createdAt: string;
  updatedAt: string;
  groupCount: number;
}

export interface StudentDetail extends Omit<StudentListItem, 'groupCount'> {
  groups: Array<{
    id: string;
    name: string;
    status: 'active' | 'archived';
    joinedAt: string;
  }>;
  recentPayments: Array<{
    id: string;
    amount: string;
    method: 'cash' | 'card' | 'split';
    periodMonth: number;
    periodYear: number;
    paidAt: string;
  }>;
  attendanceStats: {
    present: number;
    absent: number;
    unknown: number;
  };
  // Расширенная финансовая сводка + заморозка (freeze)
  monthsPaid: number;
  paidTotal: number;
  currentDebt: number;
  currentMonthStatus: 'paid' | 'debt' | 'frozen' | 'unknown';
  freeze: {
    since: string;
    reason: string;
    expectedReturnAt: string | null; // YYYY-MM-DD
    note?: string;
  } | null;
  lastVisitAt: string | null;
  sentMessages: Array<{
    id: string;
    message: string;
    via: 'telegram' | 'sms';
    senderId: string;
    senderName: string;
    senderRole: 'superadmin' | 'admin' | 'mentor';
    status: 'pending' | 'sent' | 'failed';
    error?: string;
    sentAt: string;
  }>;
}

export interface UpcomingReturn {
  id: string;
  firstName: string;
  lastName: string;
  parentPhone: string;
  telegramChatId: string | null;
  freeze: {
    since: string;
    reason: string;
    expectedReturnAt: string | null;
    note?: string;
  };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface StudentListParams {
  search?: string;
  isArchived?: boolean;
  frozen?: boolean;
  groupId?: string;
  page?: number;
  pageSize?: number;
}

export const studentsApi = {
  list: (params: StudentListParams = {}) =>
    http.get<Paginated<StudentListItem>>('/superadmin/students', {
      query: {
        search: params.search,
        isArchived: params.isArchived === undefined ? undefined : String(params.isArchived),
        frozen: params.frozen === undefined ? undefined : String(params.frozen),
        groupId: params.groupId,
        page: params.page,
        pageSize: params.pageSize,
      },
    }),
  get: (id: string) => http.get<StudentDetail>(`/superadmin/students/${id}`),
  create: (input: StudentCreateInput) =>
    http.post<StudentListItem>('/superadmin/students', input),
  update: (id: string, input: StudentUpdateInput) =>
    http.patch<StudentListItem>(`/superadmin/students/${id}`, input),
  archive: (id: string) => http.post<StudentListItem>(`/superadmin/students/${id}/archive`),
  unarchive: (id: string) => http.post<StudentListItem>(`/superadmin/students/${id}/unarchive`),
  remove: (id: string) => http.delete<{ ok: boolean }>(`/superadmin/students/${id}`),
  freeze: (
    id: string,
    input: { reason: string; expectedReturnAt: string | null; note?: string },
  ) => http.post<StudentDetail>(`/superadmin/students/${id}/freeze`, input),
  upcomingReturns: () =>
    http.get<{ items: UpcomingReturn[] }>('/superadmin/students/upcoming-returns'),
  unfreeze: (id: string) =>
    http.post<StudentDetail>(`/superadmin/students/${id}/unfreeze`),
  sendMessage: (id: string, input: { message: string; via: 'telegram' | 'sms' }) =>
    http.post<{ ok: boolean }>(`/superadmin/students/${id}/message`, input),
};
