import { http } from '../http';

export interface AuditItem {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: 'superadmin' | 'admin' | 'mentor' | 'unknown';
  action: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string;
  meta: Record<string, unknown> | null;
  status?: 'success' | 'failure';
  statusCode?: number;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export const auditApi = {
  list: (params?: { search?: string; entityType?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.entityType) qs.set('entityType', params.entityType);
    if (params?.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return http.get<{ items: AuditItem[] }>(`/superadmin/audit${suffix}`);
  },
};
