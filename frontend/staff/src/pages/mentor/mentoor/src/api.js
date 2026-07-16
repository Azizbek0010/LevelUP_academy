const API_BASE = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL || '' : '';

const TOKEN_KEY = 'mentor_token';
const USER_KEY = 'mentor_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    if (res.status === 401) {
      clearAuth();
    }
    throw err;
  }

  return data;
}

export const api = {
  // -------- AUTH --------
  login: (login, password) =>
    request('/auth/staff/login', { method: 'POST', body: { login, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // -------- MENTOR: Groups --------
  getGroups: (token) => request('/mentor/groups', { token }),
  getGroupStudents: (token, groupId) =>
    request(`/mentor/groups/${groupId}/students`, { token }),

  // -------- MENTOR: Attendance --------
  getAttendance: (token, groupId, params) => {
    const query = params.date
      ? `?date=${params.date}`
      : `?from=${params.from}&to=${params.to}`;
    return request(`/mentor/attendance/groups/${groupId}${query}`, { token });
  },
  markAttendance: (token, groupId, body) =>
    request(`/mentor/attendance/groups/${groupId}`, { method: 'POST', token, body }),

  // -------- MENTOR: Homework (faqat ko'rish va baholash) --------
  getHomeworkList: (token, groupId) =>
    request(`/mentor/homework/groups/${groupId}`, { token }),
  getSubmissions: (token, homeworkId) =>
    request(`/mentor/homework/${homeworkId}/submissions`, { token }),
  gradeSubmission: (token, submissionId, body) =>
    request(`/mentor/homework/submissions/${submissionId}/grade`, {
      method: 'POST',
      token,
      body,
    }),

  // -------- MENTOR: Coins --------
  grantCoins: (token, body) =>
    request('/mentor/coins', { method: 'POST', token, body }),
  getCoinHistory: (token, studentId) =>
    request(`/mentor/coins/students/${studentId}`, { token }),


  // -------- MENTOR: Salary --------
  getSalary: (token, mentorId, params) => {
    const query = params?.year ? `?year=${params.year}` : '';
    return request(`/mentor/salary/mentors/${mentorId}${query}`, { token });
  },
  getSalarySuggestion: (token, mentorId, month) =>
    request(`/mentor/salary/mentors/${mentorId}/suggestion?month=${month}`, { token }),
};
