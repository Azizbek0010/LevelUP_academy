import { http } from '../http';

export type GroupKind = 'individual' | 'group';

export interface GroupItem {
  id: string;
  name: string;
  mentorName: string;
  lessonDays: string[];
  lessonStartTime: string;
  lessonEndTime: string;
  monthlyFee: number;
  studentCount: number;
  status: 'active' | 'archived';
  kind?: GroupKind;
}

export interface GroupCreateInput {
  name: string;
  mentorName: string;
  lessonDays: string[];
  lessonStartTime: string;
  lessonEndTime: string;
  monthlyFee: number;
  kind?: GroupKind;
}

export interface GroupUpdateInput extends Partial<GroupCreateInput> {}

export interface GroupDetail extends GroupItem {
  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
    parentPhone: string;
    telegramChatId: string | null;
  }>;
}

export const groupsApi = {
  list: () => http.get<{ items: GroupItem[] }>('/superadmin/groups'),
  get: (id: string) => http.get<GroupDetail>(`/superadmin/groups/${id}`),
  create: (input: GroupCreateInput) => http.post<GroupItem>('/superadmin/groups', input),
  update: (id: string, input: GroupUpdateInput) =>
    http.patch<GroupItem>(`/superadmin/groups/${id}`, input),
  remove: (id: string) => http.delete<{ ok: boolean }>(`/superadmin/groups/${id}`),
  archive: (id: string) => http.post<GroupItem>(`/superadmin/groups/${id}/archive`),
  unarchive: (id: string) => http.post<GroupItem>(`/superadmin/groups/${id}/unarchive`),
  addStudents: (groupId: string, studentIds: string[]) =>
    http.post<{ ok: boolean; added: number }>(
      `/superadmin/groups/${groupId}/students`,
      { studentIds },
    ),
  removeStudent: (groupId: string, studentId: string) =>
    http.delete<{ ok: boolean }>(
      `/superadmin/groups/${groupId}/students/${studentId}`,
    ),
};
