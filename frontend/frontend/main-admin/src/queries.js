import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api.js';
import { useAuth } from './auth.jsx';

// общий useQuery: включается только с токеном + разлогинивает на 401
function useAuthedQuery(queryKey, queryFn, opts = {}) {
  const { token, logout } = useAuth();
  const q = useQuery({ queryKey, queryFn, enabled: !!token, ...opts });
  useEffect(() => {
    if (q.error?.status === 401) logout();
  }, [q.error, logout]);
  return q;
}

export function useDashboard() {
  const { token } = useAuth();
  return useAuthedQuery(['dashboard'], () => api.dashboard(token));
}

export function useLeads() {
  const { token } = useAuth();
  return useAuthedQuery(['leads'], () => api.leads(token), { select: (d) => d.leads });
}

export function usePricing() {
  const { token } = useAuth();
  return useAuthedQuery(['pricing'], () => api.getPricing(token), { select: (d) => d.pricing });
}

// сбросить кэш после мутаций (онбординг, статус, цены…)
export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}
