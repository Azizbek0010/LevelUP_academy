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

export function useSuperMethodists() {
  const { token } = useAuth();
  return useAuthedQuery(['super-methodists'], () => api.superMethodists(token));
}

// -------- ADMIN --------
export function useAdminDashboard() {
  const { token } = useAuth();
  return useAuthedQuery(['admin-dashboard'], () => api.adminDashboard(token));
}

export function useAdminExpenses(qs = '') {
  const { token } = useAuth();
  return useAuthedQuery(['admin-expenses', qs], () => api.adminExpenses(token, qs));
}

export function useAdminStudents(qs = '') {
  const { token } = useAuth();
  return useAuthedQuery(['admin-students', qs], () => api.adminStudents(token, qs));
}

export function useAdminStudentDetail(id) {
  const { token } = useAuth();
  return useAuthedQuery(['admin-student', id], () => api.adminStudentDetail(token, id), { enabled: !!id });
}

export function useAdminGroups(qs = '') {
  const { token } = useAuth();
  return useAuthedQuery(['admin-groups', qs], () => api.adminGroups(token, qs));
}

export function useAdminGroupDetail(id) {
  const { token } = useAuth();
  return useAuthedQuery(['admin-group', id], () => api.adminGroupDetail(token, id), { enabled: !!id });
}

export function useAdminMentors() {
  const { token } = useAuth();
  return useAuthedQuery(['admin-mentors'], () => api.adminMentors(token));
}

export function useAdminInvoices(qs = '') {
  const { token } = useAuth();
  return useAuthedQuery(['admin-invoices', qs], () => api.adminInvoices(token, qs));
}

export function useAdminStudentDetail(id) {
  const { token } = useAuth();
  return useAuthedQuery(['admin-student', id], () => api.adminStudentDetail(token, id), { enabled: !!id });
}

export function useAdminReports(qs = '') {
  const { token } = useAuth();
  return useAuthedQuery(['admin-reports', qs], () => api.adminReports(token, qs));
}

export function useAdminGroupAttendance(groupId, date) {
  const { token } = useAuth();
  return useAuthedQuery(
    ['admin-group-attendance', groupId, date],
    () => api.adminGroupAttendance(token, groupId, date),
    { enabled: !!groupId && !!date },
  );
}

export function useAdminGroupHomework(groupId) {
  const { token } = useAuth();
  return useAuthedQuery(
    ['admin-group-homework', groupId],
    () => api.adminGroupHomework(token, groupId),
    { enabled: !!groupId },
  );
}

export function useAdminGroupFeedback(groupId) {
  const { token } = useAuth();
  return useAuthedQuery(
    ['admin-group-feedback', groupId],
    () => api.adminGroupFeedback(token, groupId),
    { enabled: !!groupId },
  );
}

export function useAdminSettings() {
  const { token } = useAuth();
  return useAuthedQuery(['admin-settings'], () => api.adminSettings(token), { retry: false });
}

// -------- ADMIN: Group Attendance --------
export function useAdminGroupAttendance(groupId, date) {
  const { token } = useAuth();
  return useAuthedQuery(
    ['admin-group-attendance', groupId, date],
    () => api.adminGroupAttendance(token, groupId, date),
    { enabled: !!groupId && !!date }
  );
}

// -------- ADMIN: Group Homework --------
export function useAdminGroupHomework(groupId) {
  const { token } = useAuth();
  return useAuthedQuery(
    ['admin-group-homework', groupId],
    () => api.adminGroupHomework(token, groupId),
    { enabled: !!groupId }
  );
}

// -------- ADMIN: Group Feedback --------
export function useAdminGroupFeedback(groupId) {
  const { token } = useAuth();
  return useAuthedQuery(
    ['admin-group-feedback', groupId],
    () => api.adminGroupFeedback(token, groupId),
    { enabled: !!groupId }
  );
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

export function useMentorAttendance(groupId, params) {
  const { token } = useAuth();
  // params: { date } ИЛИ { from, to } — прокидываем как есть (api.mentorAttendance сам выберет ветку)
  return useAuthedQuery(
    ['mentor-attendance', groupId, params],
    () => api.mentorAttendance(token, groupId, params),
    { enabled: !!groupId && !!params && (!!params.date || (!!params.from && !!params.to)) },
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

// -------- MAIN ADMIN --------
export function useMainDashboard() {
  const { token } = useAuth();
  return useAuthedQuery(['main-dashboard'], () => api.mainDashboard(token));
}

export function useMainLeads() {
  const { token } = useAuth();
  return useAuthedQuery(['main-leads'], () => api.mainLeads(token), { select: (d) => d.leads });
}

export function useMainPricing() {
  const { token } = useAuth();
  return useAuthedQuery(['main-pricing'], () => api.mainGetPricing(token), { select: (d) => d.pricing });
}

// -------- INVALIDATE --------
export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}
