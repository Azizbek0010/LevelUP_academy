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

// Super Admin переехал в отдельное приложение (frontend/superadmin) — хуки
// super-* удалены отсюда вместе со старыми pages/super/*.

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
