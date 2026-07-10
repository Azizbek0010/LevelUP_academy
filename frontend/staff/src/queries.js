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

// -------- SUPER ADMIN --------
export function useSuperDashboard() {
  const { token } = useAuth();
  return useAuthedQuery(['super-dashboard'], () => api.superDashboard(token));
}

export function useSuperBranches() {
  const { token } = useAuth();
  return useAuthedQuery(['super-branches'], () => api.superBranches(token));
}

export function useSuperBranchDetail(id) {
  const { token } = useAuth();
  return useAuthedQuery(['super-branch', id], () => api.superBranchDetail(token, id), {
    enabled: !!id,
  });
}

export function useSuperAdmins() {
  const { token } = useAuth();
  return useAuthedQuery(['super-admins'], () => api.superAdmins(token));
}

export function useSuperOrganization() {
  const { token } = useAuth();
  return useAuthedQuery(['super-organization'], () => api.superGetOrganization(token));
}

// -------- ADMIN --------
export function useAdminDashboard() {
  const { token } = useAuth();
  return useAuthedQuery(['admin-dashboard'], () => api.adminDashboard(token));
}

// -------- MENTOR --------
export function useMentorDashboard() {
  const { token } = useAuth();
  return useAuthedQuery(['mentor-dashboard'], () => api.mentorDashboard(token));
}

// -------- METHODIST CONTENT --------
export function useTrainingTypes() {
  const { token } = useAuth();
  return useAuthedQuery(['training-types'], () => api.methodistTrainingTypes(token));
}

export function useTopics(trainingTypeId) {
  const { token } = useAuth();
  return useAuthedQuery(['topics', trainingTypeId], () => api.methodistTopics(token, trainingTypeId), { enabled: !!trainingTypeId });
}

export function useLessons(topicId) {
  const { token } = useAuth();
  return useAuthedQuery(['lessons', topicId], () => api.methodistLessons(token, topicId), { enabled: !!topicId });
}

export function useLessonDetails(lessonId) {
  const { token } = useAuth();
  return useAuthedQuery(['lesson', lessonId], () => api.methodistGetLesson(token, lessonId), { enabled: !!lessonId });
}

export function useQuestions(lessonId) {
  const { token } = useAuth();
  return useAuthedQuery(['questions', lessonId], () => api.methodistQuestions(token, lessonId), { enabled: !!lessonId });
}

// -------- METHODIST ANALYTICS --------
export function useMethodistAnalytics() {
  const { token } = useAuth();
  return useAuthedQuery(['methodist-analytics'], () => api.methodistDifficulty(token));
}

// -------- INVALIDATE --------
export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}
