import { http } from '../http';

export type AnnouncementTarget = 'all-staff' | 'all-admins' | 'all-mentors' | `branch:${string}`;

export interface AnnouncementReader {
  id: string;
  name: string;
  role: 'superadmin' | 'admin' | 'mentor';
  readAt: string | null; // null → ещё не прочитал
  lastOnlineAt: string | null; // когда был в системе последний раз
}

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  targetType: AnnouncementTarget;
  targetLabel: string;
  senderName: string;
  recipientCount: number;
  readCount: number;
  readers?: AnnouncementReader[]; // все получатели с датой прочтения (или null)
  sentAt: string;
}

export interface AnnouncementCreateInput {
  title: string;
  body: string;
  targetType: AnnouncementTarget;
  targetLabel: string;
}

export const announcementsApi = {
  list: () => http.get<{ items: AnnouncementItem[] }>('/superadmin/announcements'),
  create: (input: AnnouncementCreateInput) =>
    http.post<AnnouncementItem>('/superadmin/announcements', input),
  remove: (id: string) => http.delete<{ ok: boolean }>(`/superadmin/announcements/${id}`),
};
