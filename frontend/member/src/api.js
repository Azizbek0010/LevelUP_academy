const API_BASE = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL || '' : '';
const USE_MOCKS =
  typeof import.meta !== 'undefined' ? import.meta.env.VITE_USE_MOCKS !== 'false' : true;

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(path, { method = 'GET', body, token } = {}) {
  if (USE_MOCKS) {
    await delay();

    // -------- AUTH (member — student/parent) --------
    if (path === '/auth/member/login') {
      const { login, password } = body;
      const MOCK_MEMBERS = [
        { code: 'demostud', password: '123456', role: 'student', firstName: 'Диёр', lastName: 'Собиров' },
        { code: 'demopare', password: '654321', role: 'parent', firstName: 'Нодира', lastName: 'Собирова' },
      ];
      const account = MOCK_MEMBERS.find(
        (m) => m.code === String(login).trim().toLowerCase() && m.password === password
      );
      if (!account) {
        const err = new Error('Неверный логин-код или пароль');
        err.status = 401;
        throw err;
      }
      const user = {
        id: `mock-${account.role}-id-001`,
        firstName: account.firstName,
        lastName: account.lastName,
        role: account.role,
        loginCode: account.code,
      };
      localStorage.setItem('mock_member_token', `mock-jwt-${account.role}-xyz`);
      localStorage.setItem('mock_member_user', JSON.stringify(user));
      return { user, accessToken: `mock-jwt-${account.role}-xyz` };
    }

    if (path === '/auth/refresh') {
      const mockToken = localStorage.getItem('mock_member_token');
      const mockUser = JSON.parse(localStorage.getItem('mock_member_user') || 'null');
      if (mockToken && mockUser) {
        return { user: mockUser, accessToken: mockToken };
      }
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }

    if (path === '/auth/logout') {
      localStorage.removeItem('mock_member_token');
      localStorage.removeItem('mock_member_user');
      return { success: true };
    }

    // -------- PARENT: children list --------
    if (path === '/parent/children') {
      return {
        data: [
          {
            id: 'mock-child-001',
            firstName: 'Диёр',
            lastName: 'Собиров',
            avatarKey: null,
            branchId: 'mock-branch-001',
            coins: 350,
            totalDebt: '150000.00',
            frozen: false,
          },
          {
            id: 'mock-child-002',
            firstName: 'Алия',
            lastName: 'Собирова',
            avatarKey: null,
            branchId: 'mock-branch-001',
            coins: 120,
            totalDebt: '0.00',
            frozen: false,
          },
        ],
      };
    }

    // -------- PARENT: child overview --------
    const overviewMatch = path.match(/^\/parent\/children\/([^/]+)\/overview$/);
    if (overviewMatch) {
      const childId = overviewMatch[1];
      const isSecond = childId === 'mock-child-002';
      return {
        data: {
          child: {
            id: childId,
            firstName: isSecond ? 'Алия' : 'Диёр',
            lastName: isSecond ? 'Собирова' : 'Собиров',
            avatarKey: null,
            frozen: false,
          },
          coins: isSecond ? 120 : 350,
          totalDebt: isSecond ? '0.00' : '150000.00',
          rank: { rank: isSecond ? 12 : 3, coins: isSecond ? 120 : 350 },
          groups: [
            { id: 'g1', name: 'Математика A', subject: 'Математика', mentorName: 'Акбар Каримов' },
            { id: 'g2', name: 'Английский B', subject: 'Английский', mentorName: 'Мария Иванова' },
            { id: 'g3', name: 'Информатика', subject: 'Программирование', mentorName: 'Шерзод Тўраев' },
          ],
          attendance: {
            windowDays: 30,
            summary: { present: 18, absent: 2, late: 1, excused: 1, total: 22 },
            recent: [
              { lessonDate: '2026-07-14', status: 'present', comment: null, groupName: 'Математика A' },
              { lessonDate: '2026-07-13', status: 'late', comment: 'Опоздал на 10 минут', groupName: 'Английский B' },
              { lessonDate: '2026-07-12', status: 'present', comment: null, groupName: 'Математика A' },
              { lessonDate: '2026-07-11', status: 'absent', comment: 'Без уважительной причины', groupName: 'Английский B' },
              { lessonDate: '2026-07-10', status: 'present', comment: null, groupName: 'Информатика' },
              { lessonDate: '2026-07-09', status: 'excused', comment: 'Болел', groupName: 'Математика A' },
              { lessonDate: '2026-07-08', status: 'present', comment: null, groupName: 'Английский B' },
            ],
          },
          grades: {
            homework: [
              { title: 'Домашнее задание #5', score: 88, maxScore: 100, gradedAt: '2026-07-14T10:00:00.000Z' },
              { title: 'Домашнее задание #4', score: 92, maxScore: 100, gradedAt: '2026-07-10T10:00:00.000Z' },
              { title: 'Домашнее задание #3', score: 75, maxScore: 100, gradedAt: '2026-07-06T10:00:00.000Z' },
              { title: 'Домашнее задание #2', score: 95, maxScore: 100, gradedAt: '2026-07-02T10:00:00.000Z' },
            ],
            tests: [
              { title: 'Тест по алгебре', score: 8, maxScore: 10, finishedAt: '2026-07-13T14:00:00.000Z' },
              { title: 'Тест по геометрии', score: 6, maxScore: 10, finishedAt: '2026-07-08T14:00:00.000Z' },
              { title: 'Тест по лексике', score: 9, maxScore: 10, finishedAt: '2026-07-05T14:00:00.000Z' },
            ],
          },
        },
      };
    }

    // -------- CHAT: messages --------
    const chatMatch = path.match(/^\/chat\/(.+\/messages)/);
    if (chatMatch) {
      return {
        data: {
          messages: [
            {
              id: 'msg-001',
              chat_type: 'direct',
              room_key: `parent:mock-parent-id-001`,
              sender_id: 'mock-mentor-001',
              body: 'Здравствуйте! Диёр хорошо себя ведёт на занятиях.',
              attachment_key: null,
              created_at: '2026-07-14T10:30:00.000Z',
              sender_first_name: 'Акбар',
              sender_last_name: 'Каримов',
              sender_role: 'mentor',
            },
            {
              id: 'msg-002',
              chat_type: 'global',
              room_key: 'global',
              sender_id: 'mock-admin-001',
              body: 'Уважаемые родители! С 20 июля начинаются летние интенсивы.',
              attachment_key: null,
              created_at: '2026-07-13T09:00:00.000Z',
              sender_first_name: 'Нурбек',
              sender_last_name: 'Алиев',
              sender_role: 'admin',
            },
            {
              id: 'msg-003',
              chat_type: 'global',
              room_key: 'global',
              sender_id: 'mock-parent-id-001',
              body: 'Спасибо за информацию!',
              attachment_key: null,
              created_at: '2026-07-13T09:15:00.000Z',
              sender_first_name: 'Нодира',
              sender_last_name: 'Собирова',
              sender_role: 'parent',
            },
          ],
          nextCursor: null,
        },
      };
    }

    const err = new Error('Mock route not implemented: ' + path);
    err.status = 404;
    throw err;
  }

  // Реальный бэкенд-запрос
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.fields = data.details || data.errors || null;
    throw err;
  }
  return data;
}

export const api = {
  loginMember: (login, password) =>
    request('/auth/member/login', { method: 'POST', body: { login, password } }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  parentChildren: (token) => request('/parent/children', { token }),
  parentOverview: (token, childId) => request(`/parent/children/${childId}/overview`, { token }),

  chatMessages: (token, roomKey) => request(`/chat/${encodeURIComponent(roomKey)}/messages`, { token }),
};
