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

// Платформенный доход — наш счёт партнёрам. Отдельный endpoint, не дашборд:
// у него свои поля (activePartners, tier у каждого партнёра).
export function useRevenue() {
  const { token } = useAuth();
  return useAuthedQuery(['revenue'], () => api.revenue(token));
}

export function useVideoStorageCosts() {
  const { token } = useAuth();
  return useAuthedQuery(['videoStorageCosts'], () => api.videoStorageCosts(token));
}

export function useProfile() {
  const { token } = useAuth();
  return useAuthedQuery(['profile'], () => api.getProfile(token), { select: (d) => d.profile });
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

export function useAddonPrices() {
  const { token } = useAuth();
  return useAuthedQuery(['addonPrices'], () => api.addonPrices(token), { select: (d) => d.features });
}

export function usePartnerFeatures(id) {
  const { token } = useAuth();
  return useAuthedQuery(['partnerFeatures', id], () => api.partnerFeatures(token, id), { enabled: !!id });
}

export function useOrgLedger(id) {
  const { token } = useAuth();
  return useAuthedQuery(['orgLedger', id], () => api.orgLedger(token, id), {
    enabled: !!id,
    select: (d) => d.ledger,
  });
}

export function useExpenses() {
  const { token } = useAuth();
  return useAuthedQuery(['expenses'], () => api.expenses(token), { select: (d) => d.expenses });
}

export function useFinance() {
  const { token } = useAuth();
  return useAuthedQuery(['finance'], () => api.finance(token));
}

export function useFeatureRequests(status) {
  const { token } = useAuth();
  return useAuthedQuery(['featureRequests', status], () => api.featureRequests(token, status), {
    select: (d) => d.requests,
  });
}
