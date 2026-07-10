import { http } from '../http';

export interface RuleItem {
  id: string;
  event: string;
  eventLabel: string;
  description: string;
  channel: 'telegram';
  template: string;
  enabled: boolean;
  triggeredCount: number;
  lastTriggered: string | null;
}

export const rulesApi = {
  list: () => http.get<{ items: RuleItem[] }>('/superadmin/rules'),
  update: (id: string, patch: { enabled?: boolean; template?: string }) =>
    http.patch<RuleItem>(`/superadmin/rules/${id}`, patch),
};
