import api from './api.js';

// ==================== AUTH ====================
export const login = (email, password) =>
  api.post('/auth/staff/login', { login: email, password }).then((r) => r.data);

// ==================== DASHBOARD ====================
export const fetchDashboard = () =>
  api.get('/admin/dashboard').then((r) => r.data);

// ==================== EXPENSES ====================
export const fetchExpenses = (params = {}) =>
  api.get('/admin/expenses', { params }).then((r) => r.data);

export const createExpense = (data) =>
  api.post('/admin/expenses', data).then((r) => r.data);

export const deleteExpense = (id) =>
  api.delete(`/admin/expenses/${id}`).then((r) => r.data);

// ==================== STUDENTS ====================
export const fetchStudents = (params = {}) =>
  api.get('/admin/students', { params }).then((r) => r.data);

export const fetchStudentDetail = (id) =>
  api.get(`/admin/students/${id}`).then((r) => r.data);

export const createStudent = (data) =>
  api.post('/admin/students', data).then((r) => r.data);

export const updateStudent = (id, data) =>
  api.patch(`/admin/students/${id}`, data).then((r) => r.data);

export const freezeStudent = (id, frozen, reason) =>
  api.post(`/admin/students/${id}/freeze`, { frozen, reason }).then((r) => r.data);

export const regenerateStudentPassword = (id) =>
  api.post(`/admin/students/${id}/regenerate-password`).then((r) => r.data);

export const deleteStudent = (id) =>
  api.delete(`/admin/students/${id}`).then((r) => r.data);

// ==================== MENTORS ====================
export const fetchMentors = () =>
  api.get('/admin/mentors').then((r) => r.data);

export const createMentor = (data) =>
  api.post('/admin/mentors', data).then((r) => r.data);

export const updateMentor = (id, data) =>
  api.patch(`/admin/mentors/${id}`, data).then((r) => r.data);

export const freezeMentor = (id, frozen) =>
  api.post(`/admin/mentors/${id}/freeze`, { frozen }).then((r) => r.data);

export const deleteMentor = (id) =>
  api.delete(`/admin/mentors/${id}`).then((r) => r.data);

// ==================== GROUPS ====================
export const fetchGroups = (params = {}) =>
  api.get('/admin/groups', { params }).then((r) => r.data);

export const fetchGroupDetail = (id) =>
  api.get(`/admin/groups/${id}`).then((r) => r.data);

export const createGroup = (data) =>
  api.post('/admin/groups', data).then((r) => r.data);

export const updateGroup = (id, data) =>
  api.patch(`/admin/groups/${id}`, data).then((r) => r.data);

export const archiveGroup = (id) =>
  api.post(`/admin/groups/${id}/archive`).then((r) => r.data);

export const unarchiveGroup = (id) =>
  api.post(`/admin/groups/${id}/unarchive`).then((r) => r.data);

export const addStudentToGroup = (groupId, studentId) =>
  api.post(`/admin/groups/${groupId}/students`, { studentId }).then((r) => r.data);

export const removeStudentFromGroup = (groupId, studentId) =>
  api.delete(`/admin/groups/${groupId}/students/${studentId}`).then((r) => r.data);

// ==================== PAYMENTS ====================
export const fetchInvoices = (params = {}) =>
  api.get('/admin/payments/invoices', { params }).then((r) => r.data);

export const createPayment = (data) =>
  api.post('/admin/payments', data).then((r) => r.data);

export const payInvoice = (id, data) =>
  api.post(`/admin/payments/invoices/${id}/pay`, data).then((r) => r.data);

export const refundTransaction = (id, reason) =>
  api.post(`/admin/payments/transactions/${id}/refund`, { reason }).then((r) => r.data);

// ==================== REPORTS ====================
export const fetchReports = (params = {}) =>
  api.get('/admin/reports', { params }).then((r) => r.data);

// ==================== SETTINGS ====================
// TODO: Backend /admin/settings endpoint TBD — placeholder for branch settings
export const fetchSettings = () =>
  api.get('/admin/settings').then((r) => r.data);

export const updateSettings = (data) =>
  api.put('/admin/settings', data).then((r) => r.data);
