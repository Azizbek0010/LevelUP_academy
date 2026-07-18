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
      { id: 'hw-001', title: 'Домашнее задание #5', score: 88, maxScore: 100, gradedAt: '2026-07-14T10:00:00.000Z', groupName: 'Математика A', description: 'Решить задачи на квадратные уравнения (стр. 45, №№ 12-18). Показать все решения с проверкой.' },
      { id: 'hw-002', title: 'Домашнее задание #4', score: 92, maxScore: 100, gradedAt: '2026-07-10T10:00:00.000Z', groupName: 'Английский B', description: 'Написать эссе на тему "My Future Profession" (200-250 слов). Использовать CONDITIONAL SECOND TYPE минимум 3 раза.' },
      { id: 'hw-003', title: 'Домашнее задание #3', score: 75, maxScore: 100, gradedAt: '2026-07-06T10:00:00.000Z', groupName: 'Математика A', description: 'Выполнить упражнения на систему линейных уравнений (стр. 38, №№ 5-10). Составить уравнения по условию задачи.' },
      { id: 'hw-004', title: 'Домашнее задание #2', score: 95, maxScore: 100, gradedAt: '2026-07-02T10:00:00.000Z', groupName: 'Информатика', description: 'Написать программу на Python: сортировка массива методом пузырька. Добавить комментарии к каждому шагу.' },
    ],
    tests: [
      { id: 'test-001', title: 'Тест по алгебре', score: 8, maxScore: 10, finishedAt: '2026-07-13T14:00:00.000Z', groupName: 'Математика A', durationMin: 30,
        questions: [
          { q: 'Решите: x² - 5x + 6 = 0', options: ['x=2, x=3', 'x=1, x=6', 'x=-2, x=-3', 'x=0, x=5'], correct: 0, studentAnswer: 0 },
          { q: 'Дискриминант уравнения 2x² + 3x - 5 = 0 равен:', options: ['49', '25', '1', '9'], correct: 0, studentAnswer: 0 },
          { q: 'Какое число является корнем x² = 16?', options: ['4', '-4', '±4', '8'], correct: 2, studentAnswer: 0 },
          { q: 'Сумма корней уравнения x² - 7x + 12 = 0 равна:', options: ['7', '12', '-7', '19'], correct: 0, studentAnswer: 0 },
          { q: 'Произведение корней уравнения x² - 5x + 6 = 0:', options: ['5', '6', '11', '-6'], correct: 1, studentAnswer: 0 },
          { q: 'Решите: x² + 2x - 8 = 0', options: ['x=2, x=-4', 'x=-2, x=4', 'x=1, x=-8', 'x=8, x=-1'], correct: 0, studentAnswer: 0 },
          { q: 'При каком значении k уравнение x² + kx + 9 = 0 имеет один корень?', options: ['k=6', 'k=-6', 'k=±6', 'k=9'], correct: 2, studentAnswer: 1 },
          { q: 'Решите неравенство: x² - 4 > 0', options: ['x > 2', 'x < -2 или x > 2', '-2 < x < 2', 'x ≠ ±2'], correct: 1, studentAnswer: 1 },
          { q: 'Корни уравнения 3x² - 12x + 9 = 0:', options: ['x=1, x=3', 'x=2, x=6', 'x=3, x=9', 'x=0, x=4'], correct: 0, studentAnswer: 0 },
          { q: 'Дискриминант: x² - 6x + 9 = 0', options: ['0', '36', '9', '12'], correct: 0, studentAnswer: 0 },
        ]},
      { id: 'test-002', title: 'Тест по геометрии', score: 6, maxScore: 10, finishedAt: '2026-07-08T14:00:00.000Z', groupName: 'Математика A', durationMin: 25,
        questions: [
          { q: 'Площадь треугольника с основанием 10 и высотой 6:', options: ['30', '60', '16', '24'], correct: 0, studentAnswer: 0 },
          { q: 'Пифагорова теорема для прямоугольного треугольника:', options: ['a² + b² = c²', 'a + b = c', 'a² - b² = c²', '2a + 2b = c'], correct: 0, studentAnswer: 0 },
          { q: 'Сумма углов треугольника равна:', options: ['90°', '180°', '270°', '360°'], correct: 1, studentAnswer: 1 },
          { q: 'Гипотенуза прямоугольного треугольника со сторонами 3 и 4:', options: ['5', '7', '12', '25'], correct: 0, studentAnswer: 2 },
          { q: 'Площадь круга с радиусом 5 (π ≈ 3.14):', options: ['78.5', '31.4', '15.7', '157'], correct: 0, studentAnswer: 0 },
          { q: 'Длина окружности с радиусом 3:', options: ['6π', '3π', '9π', '12π'], correct: 0, studentAnswer: 1 },
          { q: 'Вид равнобедренного треугольника:', options: ['2 стороны равны', 'Все стороны равны', 'Все углы равны', 'Нет особых свойств'], correct: 0, studentAnswer: 0 },
          { q: 'Площадь ромба с диагоналями 6 и 8:', options: ['24', '48', '14', '7'], correct: 0, studentAnswer: 2 },
          { q: 'В прямоугольнике диагонали:', options: ['Равны', 'Перпендикулярны', 'Не равны', 'Равны и перпендикулярны'], correct: 0, studentAnswer: 1 },
          { q: 'Площадь параллелограмма: основание 12, высота 5:', options: ['60', '34', '17', '120'], correct: 0, studentAnswer: 0 },
        ]},
      { id: 'test-003', title: 'Тест по лексике', score: 9, maxScore: 10, finishedAt: '2026-07-05T14:00:00.000Z', groupName: 'Английский B', durationMin: 20,
        questions: [
          { q: '"Achieve" means:', options: ['To reach a goal', 'To give up', 'To sleep', 'To eat'], correct: 0, studentAnswer: 0 },
          { q: 'Choose the correct form: "She ___ to school every day."', options: ['goes', 'go', 'going', 'gone'], correct: 0, studentAnswer: 0 },
          { q: '"Diligent" is closest in meaning to:', options: ['Hard-working', 'Lazy', 'Angry', 'Happy'], correct: 0, studentAnswer: 0 },
          { q: '"I wish I ___ a bird."', options: ['were', 'was', 'am', 'be'], correct: 0, studentAnswer: 0 },
          { q: 'Plural of "child":', options: ['children', 'childs', 'childes', 'childern'], correct: 0, studentAnswer: 0 },
          { q: '"Despite the rain, we ___ went out."', options: ['still', 'already', 'yet', 'ever'], correct: 0, studentAnswer: 1 },
          { q: '"She has been studying ___ 3 hours."', options: ['for', 'since', 'from', 'during'], correct: 0, studentAnswer: 0 },
          { q: '"If I ___ rich, I would travel the world."', options: ['were', 'am', 'will be', 'be'], correct: 0, studentAnswer: 0 },
          { q: '"The book is ___ the table."', options: ['on', 'in', 'at', 'by'], correct: 0, studentAnswer: 0 },
          { q: '"He asked me where ___."', options: ['I lived', 'did I live', 'I live', 'do I live'], correct: 0, studentAnswer: 0 },
        ]},
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

  // HOMEWORK DETAIL
  if (path.startsWith('/parent/homework/')) {
    const hwId = path.split('/').pop();
    const hw = MOCK_OVERVIEW.grades.homework.find((h) => h.id === hwId);
    if (!hw) { const e = new Error('Not found'); e.status = 404; throw e; }
    const mistakes = hw.score < hw.maxScore ? [
      { question: 'Задание 3', studentAnswer: 'Неправильная формулировка ответа', correctAnswer: 'Требуется пересмотреть решение', comment: 'Проверь знаки при подстановке' },
    ] : [];
    return { data: { ...hw, mistakes, comment: hw.score >= 90 ? 'Отличная работа!' : hw.score >= 75 ? 'Хорошо, но есть замечания' : 'Нужно повторить материал' } };
  }

  // TEST DETAIL
  if (path.startsWith('/parent/tests/')) {
    const testId = path.split('/').pop();
    const test = MOCK_OVERVIEW.grades.tests.find((t) => t.id === testId);
    if (!test) { const e = new Error('Not found'); e.status = 404; throw e; }
    const wrongAnswers = test.questions.filter((q) => q.studentAnswer !== q.correct).map((q, i) => ({
      question: q.q,
      studentAnswer: q.options[q.studentAnswer],
      correctAnswer: q.options[q.correct],
      isCorrect: false,
    }));
    const correctAnswers = test.questions.filter((q) => q.studentAnswer === q.correct).map((q) => ({
      question: q.q,
      studentAnswer: q.options[q.studentAnswer],
      correctAnswer: q.options[q.correct],
      isCorrect: true,
    }));
    return { data: { ...test, wrongAnswers, correctAnswers, totalQuestions: test.questions.length, correctCount: correctAnswers.length, wrongCount: wrongAnswers.length } };
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
  parentHomeworkDetail: (token, homeworkId) => request(`/parent/homework/${homeworkId}`, { token }),
  parentTestDetail: (token, testId) => request(`/parent/tests/${testId}`, { token }),

  chatMessages: (token, roomKey) =>
    request(`/chat/${encodeURIComponent(roomKey)}/messages`, { token }),

  notifications: (token) => request('/parent/notifications', { token }),
};
