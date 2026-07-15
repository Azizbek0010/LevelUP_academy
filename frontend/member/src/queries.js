import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api.js';
import { useAuth } from './auth.jsx';

function useAuthedQuery(queryKey, queryFn, opts = {}) {
  const { token, logout } = useAuth();
  const q = useQuery({ queryKey, queryFn, enabled: !!token, ...opts });
  useEffect(() => {
    if (q.error?.status === 401) logout();
  }, [q.error, logout]);
  return q;
}

export function useParentChildren() {
  const { token } = useAuth();
  return useAuthedQuery(['parent-children'], () => api.parentChildren(token));
}

export function useParentOverview(childId) {
  const { token } = useAuth();
  return useAuthedQuery(['parent-overview', childId], () => api.parentOverview(token, childId), {
    enabled: !!childId,
  });
}

export function useChatMessages(roomKey) {
  const { token } = useAuth();
  return useAuthedQuery(['chat-messages', roomKey], () => api.chatMessages(token, roomKey), {
    enabled: !!roomKey && !!token,
  });
}

export function useNotifications() {
  const { token } = useAuth();
  return useAuthedQuery(['notifications'], () => api.notifications(token));
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}
