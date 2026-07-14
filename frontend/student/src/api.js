// Все запросы идут на /api (dev-прокси Vite → http://localhost:4000).
// VITE_API_URL — боевой бэкенд (Render) для production build.
// USE_MOCKS — демо-данные в памяти для просмотра панели без бэкенда.
//   По умолчанию включены; выключить боевым бэком: VITE_USE_MOCKS=false в .env.

const API_BASE = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL || '' : '';
const USE_MOCKS =
  typeof import.meta !== 'undefined' ? import.meta.env.VITE_USE_MOCKS !== 'false' : true;

let accessToken = null;
let onSessionExpired = () => {};
let onPaymentOverdue = () => {};
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function setOnSessionExpired(handler) {
  onSessionExpired = handler;
}

/** 402 от blockIfOverdue: у студента просроченный счёт — панель закрыта до оплаты. */
export function setOnPaymentOverdue(handler) {
  onPaymentOverdue = handler;
}

// ============================================================
//  MOCK LAYER — демо-кабинет студента без бэкенда
// ============================================================
const delay = (ms = 260) => new Promise((r) => setTimeout(r, ms));

const mock = {
  user: {
    id: 'stud-001',
    firstName: 'Алишер',
    lastName: 'Рахимов',
    role: 'student',
    branchId: 'branch-001',
  },
  coins: 420,
  totalDebt: 350000,
  groups: [
    { id: 'g1', name: 'Frontend React', subject: 'Веб-разработка', mentorName: 'Ильхом Кадыров' },
    { id: 'g2', name: 'Python BootCamp', subject: 'Программирование', mentorName: 'Джасур Усманов' },
  ],
  homework: [
    {
      id: 'hw1', group_id: 'g1', title: 'Свёрстать карточку товара', description: 'Flexbox + адаптив, приложи ссылку на CodeSandbox.',
      max_score: 100, coin_reward: 20, deadline: new Date(Date.now() + 2 * 864e5).toISOString(),
      created_at: new Date(Date.now() - 3 * 864e5).toISOString(), submission_status: null, score: null, text_answer: null,
    },
    {
      id: 'hw2', group_id: 'g2', title: 'Функция FizzBuzz', description: 'Классика на циклы и условия.',
      max_score: 100, coin_reward: 15, deadline: new Date(Date.now() + 5 * 864e5).toISOString(),
      created_at: new Date(Date.now() - 1 * 864e5).toISOString(), submission_status: 'submitted', score: null, text_answer: 'готово',
    },
    {
      id: 'hw3', group_id: 'g1', title: 'Промисы и async/await', description: 'Три задачи на асинхронность.',
      max_score: 100, coin_reward: 25, deadline: new Date(Date.now() - 1 * 864e5).toISOString(),
      created_at: new Date(Date.now() - 6 * 864e5).toISOString(), submission_status: 'graded', score: 92, text_answer: 'решено',
    },
  ],
  tests: [
    {
      id: 't1', group_id: 'g1', title: 'Основы HTML/CSS', duration_min: 10, coin_reward: 30,
      starts_at: null, ends_at: null, created_at: new Date(Date.now() - 2 * 864e5).toISOString(),
      started_at: null, finished_at: null, score: null,
      questions: [
        { q: 'Какой тег задаёт заголовок первого уровня?', options: ['<h1>', '<head>', '<header>', '<title>'], correct: 0 },
        { q: 'Свойство для горизонтального центрирования flex-элементов?', options: ['align-items', 'justify-content', 'text-align', 'float'], correct: 1 },
        { q: 'Единица, зависящая от размера шрифта родителя?', options: ['px', 'vw', 'em', '%'], correct: 2 },
        { q: 'Как сделать элемент невидимым, сохранив место?', options: ['display:none', 'visibility:hidden', 'opacity:1', 'hidden'], correct: 1 },
      ],
    },
    {
      id: 't2', group_id: 'g2', title: 'Python: типы и циклы', duration_min: 15, coin_reward: 25,
      starts_at: null, ends_at: null, created_at: new Date(Date.now() - 4 * 864e5).toISOString(),
      started_at: new Date(Date.now() - 3 * 864e5).toISOString(), finished_at: new Date(Date.now() - 3 * 864e5).toISOString(), score: 80,
      questions: [
        { q: 'Функция вывода в консоль?', options: ['echo', 'print', 'console.log', 'puts'], correct: 1 },
        { q: 'Тип значения "42"?', options: ['int', 'str', 'float', 'bool'], correct: 1 },
      ],
    },
    {
      id: 't3', group_id: 'g1', title: 'JavaScript: массивы (скоро)', duration_min: 12, coin_reward: 20,
      starts_at: new Date(Date.now() + 3 * 864e5).toISOString(), ends_at: null, created_at: new Date().toISOString(),
      started_at: null, finished_at: null, score: null,
      questions: [{ q: 'Заглушка', options: ['a', 'b'], correct: 0 }],
    },
  ],
  videos: [
    { id: 'v1', group_id: 'g1', title: 'Урок 1. Введение во Flexbox', duration_sec: 725, created_at: new Date(Date.now() - 5 * 864e5).toISOString() },
    { id: 'v2', group_id: 'g1', title: 'Урок 2. Grid за 20 минут', duration_sec: 1240, created_at: new Date(Date.now() - 2 * 864e5).toISOString() },
    { id: 'v3', group_id: 'g2', title: 'Python. Списки и словари', duration_sec: 980, created_at: new Date(Date.now() - 1 * 864e5).toISOString() },
  ],
  shopItems: [
    { id: 'i1', name: 'Стикерпак LevelUp', image_key: null, coin_price: 100, stock: 24 },
    { id: 'i2', name: 'Термокружка', image_key: null, coin_price: 350, stock: 8 },
    { id: 'i3', name: 'Футболка academy', image_key: null, coin_price: 500, stock: 5 },
    { id: 'i4', name: 'Наушники', image_key: null, coin_price: 1500, stock: 2 },
  ],
  orders: [
    { id: 'o1', item_id: 'i1', item_name: 'Стикерпак LevelUp', image_key: null, coin_price: 100, created_at: new Date(Date.now() - 7 * 864e5).toISOString() },
  ],
  attempts: {}, // testId -> { endsAt }
};

function mockLeaderboard(period) {
  const base = [
    { studentId: 'x1', firstName: 'Мадина', lastName: 'Юсупова', coins: period === 'week' ? 640 : 2100 },
    { studentId: 'x2', firstName: 'Тимур', lastName: 'Алиев', coins: period === 'week' ? 580 : 1980 },
    { studentId: mock.user.id, firstName: mock.user.firstName, lastName: mock.user.lastName, coins: mock.coins },
    { studentId: 'x3', firstName: 'Нигора', lastName: 'Ким', coins: period === 'week' ? 300 : 1200 },
    { studentId: 'x4', firstName: 'Botir', lastName: 'Хасанов', coins: period === 'week' ? 260 : 990 },
  ]
    .sort((a, b) => b.coins - a.coins)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  const me = base.find((r) => r.studentId === mock.user.id);
  return { period, top: base, me: me ? { rank: me.rank, coins: me.coins } : { rank: null, coins: 0 } };
}

async function mockRequest(path, { method = 'GET', body } = {}) {
  await delay();
  const seg = path.split('?')[0].split('/').filter(Boolean); // ['student','tests','t1']
  const query = Object.fromEntries(new URLSearchParams(path.split('?')[1] || ''));

  // -- session --
  if (path === '/auth/refresh') return { user: mock.user, accessToken: 'mock-token' };
  if (path === '/auth/logout') return { success: true };

  // -- /student/... --
  if (seg[0] === 'student') {
    const [, area, id, action] = seg;

    if (area === 'home') {
      const now = Date.now();
      const upcomingHomework = mock.homework
        .filter((h) => new Date(h.deadline).getTime() > now && h.submission_status !== 'graded')
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);
      return { data: { coins: mock.coins, totalDebt: mock.totalDebt, rank: mockLeaderboard('week').me, groups: mock.groups, upcomingHomework } };
    }

    if (area === 'tests') {
      if (!id) return { data: mock.tests.map((t) => ({ ...t, questions: t.questions.map(({ q, options }) => ({ q, options })) })) };
      const test = mock.tests.find((t) => t.id === id);
      if (!test) throw mkErr(404, 'Test not found');
      if (!action) return { data: { ...test, questions: test.questions.map(({ q, options }) => ({ q, options })) } };
      if (action === 'start') {
        const endsAt = new Date(Date.now() + test.duration_min * 60_000).toISOString();
        mock.attempts[id] = { endsAt };
        return { data: { startedAt: new Date().toISOString(), durationMin: test.duration_min, endsAt } };
      }
      if (action === 'submit') {
        const answers = body?.answers ?? [];
        const correct = test.questions.reduce((acc, qn, i) => acc + (answers[i] === qn.correct ? 1 : 0), 0);
        const score = Math.round((correct / test.questions.length) * 100);
        test.finished_at = new Date().toISOString();
        test.started_at = test.started_at || new Date().toISOString();
        test.score = score;
        if (score >= 50) mock.coins += test.coin_reward;
        return { data: { score } };
      }
    }

    if (area === 'homework') {
      if (!id) return { data: mock.homework };
      const hw = mock.homework.find((h) => h.id === id);
      if (!hw) throw mkErr(404, 'Homework not found');
      if (action === 'upload-url') return { data: { uploadUrl: 'mock://skip', fileKey: `mock/${query.filename || 'file'}` } };
      if (action === 'submit') {
        if (hw.submission_status === 'graded') throw mkErr(409, 'Already graded');
        hw.submission_status = Date.now() > new Date(hw.deadline).getTime() ? 'late' : 'submitted';
        hw.text_answer = body?.textAnswer ?? hw.text_answer;
        return { data: { status: hw.submission_status } };
      }
    }

    if (area === 'videos') {
      if (!id) return { data: mock.videos };
      if (action === 'stream-url')
        return { data: { streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' } };
    }

    if (area === 'shop') {
      if (id === 'items' && !action) return { data: mock.shopItems.filter((i) => i.stock > 0) };
      if (id === 'items' && action) {
        // /shop/items/:itemId/purchase → seg = ['student','shop','items',itemId,'purchase']
        const itemId = seg[3];
        const item = mock.shopItems.find((i) => i.id === itemId);
        if (!item) throw mkErr(404, 'Item not found');
        if (mock.coins < item.coin_price) throw mkErr(422, 'Not enough coins');
        mock.coins -= item.coin_price;
        item.stock -= 1;
        const order = { id: `o${Date.now()}`, item_id: item.id, item_name: item.name, image_key: item.image_key, coin_price: item.coin_price, created_at: new Date().toISOString() };
        mock.orders.unshift(order);
        return { data: order };
      }
      if (id === 'orders') return { data: mock.orders };
    }

    if (area === 'leaderboard') return { data: mockLeaderboard(query.period || 'week') };
  }

  throw mkErr(404, `Mock route not implemented: ${path}`);
}

function mkErr(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// ============================================================
//  REAL HTTP
// ============================================================
async function rawRequest(path, { method = 'GET', body, skipAuth = false } = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(!skipAuth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.details = data.details || null;
    err.fields = data.details || data.errors || null;
    throw err;
  }
  return data;
}

async function refreshSession() {
  if (USE_MOCKS) return mockRequest('/auth/refresh');
  if (!refreshPromise) {
    refreshPromise = rawRequest('/auth/refresh', { method: 'POST', skipAuth: true }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function request(path, opts = {}) {
  if (USE_MOCKS) return mockRequest(path, opts);
  try {
    return await rawRequest(path, opts);
  } catch (err) {
    // 402 — просроченный счёт: бэкенд закрыл весь student-домен, повтор не поможет.
    if (err.status === 402) {
      onPaymentOverdue(err.details?.amount ?? null);
      throw err;
    }
    if (err.status !== 401 || opts.skipAuth) throw err;
    try {
      const session = await refreshSession();
      accessToken = session.accessToken;
    } catch {
      accessToken = null;
      onSessionExpired();
      throw err;
    }
    return rawRequest(path, opts);
  }
}

export const api = {
  // -------- SESSION (вход делает общий Auth-модуль; здесь только подхват) --------
  refresh: () => refreshSession(),
  logout: () => (USE_MOCKS ? mockRequest('/auth/logout') : rawRequest('/auth/logout', { method: 'POST' })),

  // -------- STUDENT: Home --------
  home: () => request('/student/home'),

  // -------- STUDENT: Tests --------
  tests: () => request('/student/tests'),
  test: (testId) => request(`/student/tests/${testId}`),
  startTest: (testId) => request(`/student/tests/${testId}/start`, { method: 'POST' }),
  submitTest: (testId, answers) =>
    request(`/student/tests/${testId}/submit`, { method: 'POST', body: { answers } }),

  // -------- STUDENT: Homework --------
  homework: () => request('/student/homework'),
  homeworkUploadUrl: (homeworkId, filename, contentType) =>
    request(
      `/student/homework/${homeworkId}/upload-url?filename=${encodeURIComponent(filename)}&contentType=${encodeURIComponent(contentType)}`,
    ),
  submitHomework: (homeworkId, body) =>
    request(`/student/homework/${homeworkId}/submit`, { method: 'POST', body }),

  // -------- STUDENT: Videos --------
  videos: () => request('/student/videos'),
  videoStreamUrl: (videoId) => request(`/student/videos/${videoId}/stream-url`),

  // -------- STUDENT: Shop --------
  shopItems: () => request('/student/shop/items'),
  purchase: (itemId) => request(`/student/shop/items/${itemId}/purchase`, { method: 'POST' }),
  orders: () => request('/student/shop/orders'),

  // -------- STUDENT: Leaderboard --------
  leaderboard: (period = 'week') => request(`/student/leaderboard?period=${period}`),
};

/** PUT файла напрямую в S3/MinIO по presigned URL (в mock-режиме URL 'mock://skip' — пропускаем). */
export async function uploadToPresignedUrl(uploadUrl, file) {
  if (uploadUrl.startsWith('mock://')) return;
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!res.ok) throw new Error(`Не удалось загрузить файл (HTTP ${res.status})`);
}
