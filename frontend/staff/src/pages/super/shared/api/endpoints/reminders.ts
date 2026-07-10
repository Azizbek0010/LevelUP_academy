import { http } from '../http';

export interface ReminderItem {
  id: string;
  studentId: string;
  studentName: string;
  parentPhone: string;
  message: string;
  periodMonth: number;
  periodYear: number;
  status: 'sent' | 'failed' | 'pending';
  telegramMessageId: string | null;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
}

export const remindersApi = {
  list: () => http.get<{ items: ReminderItem[] }>('/superadmin/reminders'),
  create: (studentId: string, message: string) =>
    http.post<ReminderItem>('/superadmin/reminders', { studentId, message }),
  update: (id: string, message: string) =>
    http.patch<ReminderItem>(`/superadmin/reminders/${id}`, { message }),
  remove: (id: string) => http.delete<{ ok: boolean }>(`/superadmin/reminders/${id}`),
  resend: (id: string) => http.post<ReminderItem>(`/superadmin/reminders/${id}/resend`),
};
