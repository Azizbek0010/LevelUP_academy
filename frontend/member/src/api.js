const API_BASE = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL || '' : '';
const USE_MOCKS =
  typeof import.meta !== 'undefined' ? import.meta.env.VITE_USE_MOCKS !== 'false' : true;

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

// -------- MOCK DATA --------
const MOCK_CHILDREN = [
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
];

const MOCK_OVERVIEW = {
  child: { id: 'mock-child-001', firstName: 'Диёр', lastName: 'Собиров', avatarKey: null, frozen: false },
  coins: 350,
  totalDebt: '150000.00',
  rank: { rank: 3, coins: 350 },
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
};

const MOCK_CHAT_MESSAGES = {
  global: [
    {
      id: 'msg-001',
      chat_type: 'global',
      room_key: 'global',
      sender_id: 'mock-admin-001',
      body: 'Уважаемые родители! С 20 июля начинаются летние интенсивы по математике и английскому языку. Запись уже открыта!',
      attachment_key: null,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      sender_first_name: 'Нурбек',
      sender_last_name: 'Алиев',
      sender_role: 'admin',
    },
    {
      id: 'msg-002',
      chat_type: 'global',
      room_key: 'global',
      sender_id: 'mock-mentor-001',
      body: 'Добрый день! Напоминаю, что завтра контрольная работа по алгебре. Пусть дети повторят тему "Квадратные уравнения".',
      attachment_key: null,
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      sender_first_name: 'Акбар',
      sender_last_name: 'Каримов',
      sender_role: 'mentor',
    },
    {
      id: 'msg-003',
      chat_type: 'global',
      room_key: 'global',
      sender_id: 'mock-parent-id-001',
      body: 'Спасибо за информацию! Диёр уже готовится.',
      attachment_key: null,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      sender_first_name: 'Нодира',
      sender_last_name: 'Собирова',
      sender_role: 'parent',
    },
  ],
  direct: [
    {
      id: 'msg-010',
      chat_type: 'direct',
      room_key: 'parent:mock-parent-id-001',
      sender_id: 'mock-mentor-001',
      body: 'Здравствуйте, Нодира! Хотел сообщить, что Диёр очень хорошо себя ведёт на занятиях. Последние две недели заметен прогресс в математике.',
      attachment_key: null,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      sender_first_name: 'Акбар',
      sender_last_name: 'Каримов',
      sender_role: 'mentor',
    },
    {
      id: 'msg-011',
      chat_type: 'direct',
      room_key: 'parent:mock-parent-id-001',
      sender_id: 'mock-parent-id-001',
      body: 'Большое спасибо за обратную связь! Очень приятно слышать. Он действительно старается.',
      attachment_key: null,
      created_at: new Date(Date.now() - 86400000 + 600000).toISOString(),
      sender_first_name: 'Нодира',
      sender_last_name: 'Собирова',
      sender_role: 'parent',
    },
    {
      id: 'msg-012',
      chat_type: 'direct',
      room_key: 'parent:mock-parent-id-001',
      sender_id: 'mock-mentor-001',
      body: 'Кстати, на следующей неделе будет олимпиада по алгебре. Может, Диёр хочет поучаствовать? Он точно способен занять призовое место.',
      attachment_key: null,
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      sender_first_name: 'Акбар',
      sender_last_name: 'Каримов',
      sender_role: 'mentor',
    },
  ],
};

let mockMsgCounter = 100;

// -------- MOCK REQUEST HANDLER --------
async function mockRequest(path, { method = 'GET', body } = {}) {
  await delay();

  // AUTH
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
    if (mockToken && mockUser) return { user: mockUser, accessToken: mockToken };
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  if (path === '/auth/logout') {
    localStorage.removeItem('mock_member_token');
    localStorage.removeItem('mock_member_user');
    return { success: true };
  }

  // PARENT
  if (path === '/parent/children') return { data: MOCK_CHILDREN };

  if (path === '/parent/children/mock-child-002/overview') {
    return {
      data: {
        ...MOCK_OVERVIEW,
        child: { id: 'mock-child-002', firstName: 'Алия', lastName: 'Собирова', avatarKey: null, frozen: false },
        coins: 120,
        totalDebt: '0.00',
        rank: { rank: 12, coins: 120 },
      },
    };
  }

  if (path === '/parent/children/mock-child-001/overview') {
    return { data: MOCK_OVERVIEW };
  }

  // CHAT — match both encoded and non-encoded
  if (path === '/chat/global/messages' || path === '/chat/global%2Fmessages') {
    return { data: { messages: MOCK_CHAT_MESSAGES.global, nextCursor: null } };
  }

  if (path.startsWith('/chat/parent:') && path.endsWith('/messages')) {
    return { data: { messages: MOCK_CHAT_MESSAGES.direct, nextCursor: null } };
  }

  // NOTIFICATIONS
  if (path === '/parent/notifications') {
    return {
      data: [
        {
          id: 'n1',
          type: 'grade',
          title: 'Новая оценка',
          body: 'Диёр получил 88/100 по ДЗ #5',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          read: false,
        },
        {
          id: 'n2',
          type: 'attendance',
          title: 'Опоздание',
          body: 'Диёр опоздал на занятие по Английскому',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          read: true,
        },
        {
          id: 'n3',
          type: 'payment',
          title: 'Напоминание об оплате',
          body: 'Срок оплаты — 25 июля',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          read: true,
        },
      ],
    };
  }

  const err = new Error('Mock route not implemented: ' + path);
  err.status = 404;
  throw err;
}

// -------- REAL REQUEST --------
async function realRequest(path, { method = 'GET', body, token } = {}) {
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
    throw err;
  }
  return data;
}

// -------- PUBLIC API --------
async function request(path, opts = {}) {
  return USE_MOCKS ? mockRequest(path, opts) : realRequest(path, opts);
}

// Mock chat send — returns message object
export function mockChatSend(roomKey, body, user) {
  mockMsgCounter++;
  const msg = {
    id: `msg-${mockMsgCounter}`,
    chat_type: roomKey === 'global' ? 'global' : 'direct',
    room_key: roomKey,
    sender_id: user?.id || 'mock-parent-id-001',
    body,
    attachment_key: null,
    created_at: new Date().toISOString(),
    sender_first_name: user?.firstName || 'Нодира',
    sender_last_name: user?.lastName || 'Собирова',
    sender_role: 'parent',
  };
  if (roomKey === 'global') {
    MOCK_CHAT_MESSAGES.global.push(msg);
  } else {
    MOCK_CHAT_MESSAGES.direct.push(msg);
  }
  return msg;
}

export const api = {
  loginMember: (login, password) =>
    request('/auth/member/login', { method: 'POST', body: { login, password } }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  parentChildren: (token) => request('/parent/children', { token }),
  parentOverview: (token, childId) => request(`/parent/children/${childId}/overview`, { token }),

  chatMessages: (token, roomKey) =>
    request(`/chat/${encodeURIComponent(roomKey)}/messages`, { token }),

  notifications: (token) => request('/parent/notifications', { token }),
};
