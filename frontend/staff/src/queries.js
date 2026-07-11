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
export function useMentorGroups() {
  const { token } = useAuth();
  return useAuthedQuery(['mentor-groups'], () => api.mentorGroups(token));
}

export function useMentorGroupStudents(groupId) {
  const { token } = useAuth();
  return useAuthedQuery(['mentor-group-students', groupId], () => api.mentorGroupStudents(token, groupId), {
    enabled: !!groupId,
  });
}

export function useMentorAttendance(groupId, date) {
  const { token } = useAuth();
  return useAuthedQuery(
    ['mentor-attendance', groupId, date],
    () => api.mentorAttendance(token, groupId, { date }),
    { enabled: !!groupId && !!date },
  );
}

export function useMentorHomeworkList(groupId) {
  const { token } = useAuth();
  return useAuthedQuery(['mentor-homework', groupId], () => api.mentorHomeworkList(token, groupId), {
    enabled: !!groupId,
  });
}

export function useMentorHomeworkSubmissions(homeworkId) {
  const { token } = useAuth();
  return useAuthedQuery(
    ['mentor-submissions', homeworkId],
    () => api.mentorHomeworkSubmissions(token, homeworkId),
    { enabled: !!homeworkId },
  );
}

export function useMentorCoinHistory(studentId) {
  const { token } = useAuth();
  return useAuthedQuery(['mentor-coin-history', studentId], () => api.mentorCoinHistory(token, studentId), {
    enabled: !!studentId,
  });
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
