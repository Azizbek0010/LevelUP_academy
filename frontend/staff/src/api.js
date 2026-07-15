// Все запросы идут на /api (dev-прокси Vite → http://localhost:4000).
// VITE_API_URL — боевой бэкенд (Render) для production build.
// USE_MOCKS = true — эмуляция на localStorage для разработки без бэкенда.

const API_BASE = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL || '' : '';
const USE_MOCKS = false; // true = mock (backend kerak emas), false = real backend

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// -------- Super Admin mock helpers --------
const getMockData = () => {
  let branches = JSON.parse(localStorage.getItem('mock_branches'));
  let admins = JSON.parse(localStorage.getItem('mock_admins'));

  if (!branches) {
    branches = [
      {
        id: 'downtown-branch-uuid-1111', name: 'Downtown Academy',
        address: '123 Main St, Central District', phone: '+998901234567',
        isMain: true, isArchived: false, admins: 2, students: 450,
        revenue: 1200000000, debt: 15000000, createdAt: '2026-01-15T08:00:00.000Z',
      },
      {
        id: 'chilanzar-branch-uuid-2222', name: 'Chilanzar Branch',
        address: 'Kamil Yashen St, Chilanzar', phone: '+998909876543',
        isMain: false, isArchived: false, admins: 1, students: 280,
        revenue: 850000000, debt: 8000000, createdAt: '2026-02-10T09:30:00.000Z',
      },
      {
        id: 'sergeli-branch-uuid-3333', name: 'Sergeli Branch',
        address: 'Yangihayot District, Sergeli', phone: '+998905556677',
        isMain: false, isArchived: true, admins: 0, students: 120,
        revenue: 320000000, debt: 22000000, createdAt: '2026-03-01T10:00:00.000Z',
      },
    ];
    localStorage.setItem('mock_branches', JSON.stringify(branches));
  }

  if (!admins) {
    admins = [
      {
        id: 'admin-uuid-1111', firstName: 'Ильхом', lastName: 'Кадыров',
        email: 'ilkhom@levelup.local', status: 'active',
        branchId: 'downtown-branch-uuid-1111', branchName: 'Downtown Academy',
        phone: '+998901112233', createdAt: '2026-01-20T11:00:00.000Z',
      },
      {
        id: 'admin-uuid-2222', firstName: 'Джасур', lastName: 'Усманов',
        email: 'jasur@levelup.local', status: 'active',
        branchId: 'downtown-branch-uuid-1111', branchName: 'Downtown Academy',
        phone: '+998902223344', createdAt: '2026-01-22T12:00:00.000Z',
      },
      {
        id: 'admin-uuid-3333', firstName: 'Малика', lastName: 'Шарипова',
        email: 'malika@levelup.local', status: 'frozen',
        branchId: 'chilanzar-branch-uuid-2222', branchName: 'Chilanzar Branch',
        phone: '+998903334455', createdAt: '2026-02-15T10:00:00.000Z',
      },
    ];
    localStorage.setItem('mock_admins', JSON.stringify(admins));
  }

  return { branches, admins };
};

const saveMockData = (branches, admins) => {
  if (branches) localStorage.setItem('mock_branches', JSON.stringify(branches));
  if (admins) localStorage.setItem('mock_admins', JSON.stringify(admins));
};

/** Мок-данные для методиста */
function getMethodistMocks() {
  let tt = JSON.parse(localStorage.getItem('mock_tt') || '[]');
  if (tt.length === 0) {
    tt = [
      { id: 'tt-1', name: 'Веб-разработка', description: 'Frontend & Backend', icon: '🌐', sort_order: 0, created_at: '2026-06-01T10:00:00Z', topics_count: 2 },
      { id: 'tt-2', name: 'Python', description: 'Основы программирования', icon: '🐍', sort_order: 1, created_at: '2026-06-10T10:00:00Z', topics_count: 1 },
    ];
    localStorage.setItem('mock_tt', JSON.stringify(tt));
  }

  let topics = JSON.parse(localStorage.getItem('mock_topics') || '[]');
  if (topics.length === 0) {
    topics = [
      { id: 'tp-1', training_type_id: 'tt-1', name: 'HTML/CSS', description: 'Вёрстка', sort_order: 0, created_at: '2026-06-05T10:00:00Z', lessons_count: 2 },
      { id: 'tp-2', training_type_id: 'tt-1', name: 'JavaScript', description: 'Основы JS', sort_order: 1, created_at: '2026-06-08T10:00:00Z', lessons_count: 1 },
      { id: 'tp-3', training_type_id: 'tt-2', name: 'Основы Python', description: '', sort_order: 0, created_at: '2026-06-12T10:00:00Z', lessons_count: 1 },
    ];
    localStorage.setItem('mock_topics', JSON.stringify(topics));
  }

  let lessons = JSON.parse(localStorage.getItem('mock_lessons') || '[]');
  if (lessons.length === 0) {
    lessons = [
      { id: 'ls-1', topic_id: 'tp-1', title: 'HTML Теги', lesson_type: 'test', description: '', instruction: 'Изучите основные HTML теги', coin_reward: 10, sort_order: 0, created_at: '2026-06-06T10:00:00Z', questions_count: 3 },
      { id: 'ls-2', topic_id: 'tp-1', title: 'Flexbox практика', lesson_type: 'practical', description: 'Сверстать макет используя Flexbox', instruction: '', coin_reward: 20, sort_order: 1, created_at: '2026-06-07T10:00:00Z', questions_count: 2 },
      { id: 'ls-3', topic_id: 'tp-2', title: 'Переменные и типы', lesson_type: 'test', description: '', instruction: '', coin_reward: 10, sort_order: 0, created_at: '2026-06-09T10:00:00Z', questions_count: 4 },
      { id: 'ls-4', topic_id: 'tp-3', title: 'Hello World', lesson_type: 'test', description: '', instruction: '', coin_reward: 5, sort_order: 0, created_at: '2026-06-13T10:00:00Z', questions_count: 2 },
    ];
    localStorage.setItem('mock_lessons', JSON.stringify(lessons));
  }

  let questions = JSON.parse(localStorage.getItem('mock_questions') || '[]');
  if (questions.length === 0) {
    questions = [
      { id: 'q-1', lesson_id: 'ls-1', question_text: 'Какой тег для заголовка H1?', option_a: '<h1>', option_b: '<head>', option_c: '<heading>', option_d: '<title>', correct_answer: 'A', sort_order: 0 },
      { id: 'q-2', lesson_id: 'ls-1', question_text: 'Какой атрибут для ссылки?', option_a: 'src', option_b: 'href', option_c: 'link', option_d: 'url', correct_answer: 'B', sort_order: 1 },
      { id: 'q-3', lesson_id: 'ls-1', question_text: 'Тег для изображения?', option_a: '<img>', option_b: '<pic>', option_c: '<image>', option_d: '<src>', correct_answer: 'A', sort_order: 2 },
      { id: 'q-4', lesson_id: 'ls-2', question_text: 'Свойство для flex-контейнера?', option_a: 'display: block', option_b: 'display: flex', option_c: 'display: inline', option_d: 'display: grid', correct_answer: 'B', sort_order: 0 },
      { id: 'q-5', lesson_id: 'ls-2', question_text: 'Ось по умолчанию в flex?', option_a: 'column', option_b: 'row', option_c: 'vertical', option_d: 'auto', correct_answer: 'B', sort_order: 1 },
      { id: 'q-6', lesson_id: 'ls-3', question_text: 'Как объявить переменную?', option_a: 'var x', option_b: 'variable x', option_c: 'v x', option_d: 'int x', correct_answer: 'A', sort_order: 0 },
      { id: 'q-7', lesson_id: 'ls-3', question_text: 'Тип данных "Привет"?', option_a: 'number', option_b: 'boolean', option_c: 'string', option_d: 'object', correct_answer: 'C', sort_order: 1 },
      { id: 'q-8', lesson_id: 'ls-3', question_text: 'Какой оператор присваивания?', option_a: '==', option_b: '=', option_c: '===', option_d: '=>', correct_answer: 'B', sort_order: 2 },
      { id: 'q-9', lesson_id: 'ls-3', question_text: 'Число 42 — это какой тип?', option_a: 'string', option_b: 'boolean', option_c: 'number', option_d: 'bigint', correct_answer: 'C', sort_order: 3 },
      { id: 'q-10', lesson_id: 'ls-4', question_text: 'Функция вывода в Python?', option_a: 'console.log', option_b: 'print', option_c: 'echo', option_d: 'output', correct_answer: 'B', sort_order: 0 },
      { id: 'q-11', lesson_id: 'ls-4', question_text: '.py — это расширение?', option_a: 'Java', option_b: 'C++', option_c: 'Python', option_d: 'Ruby', correct_answer: 'C', sort_order: 1 },
    ];
    localStorage.setItem('mock_questions', JSON.stringify(questions));
  }

  return { tt, topics, lessons, questions };
}

async function request(path, { method = 'GET', body, token } = {}) {
  if (USE_MOCKS) {
    await delay();
    const mocks = getMethodistMocks();

    // -------- AUTH --------
    if (path === '/auth/staff/login') {
      const { login, password } = body;

      // Мок-креды по ролям (совпадают с backend seed env-переменными)
      const MOCK_ACCOUNTS = [
        { email: 'azizbekamangeldiev.2010@gmail.com', password: 'ChangeMe123!', role: 'superadmin', firstName: 'Demo', lastName: 'Superadmin' },
        { email: 'hp8187081014laptop@gmail.com', password: 'ChangeMe123!', role: 'admin', firstName: 'Demo', lastName: 'Admin' },
        { email: 'mentor.demo@levelup.local', password: 'ChangeMe123!', role: 'mentor', firstName: 'Demo', lastName: 'Mentor' },
        { email: 'methodist@levelup.local', password: 'ChangeMe123!', role: 'methodist', firstName: 'Мадина', lastName: 'Рахимова' },
      ];

      const account = MOCK_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === login.toLowerCase() && a.password === password
      );

      if (!account) {
        const err = new Error('Неверный email или пароль');
        err.status = 401;
        throw err;
      }

      const user = {
        id: `mock-${account.role}-id-001`,
        firstName: account.firstName,
        lastName: account.lastName,
        role: account.role,
        email: login,
      };
      localStorage.setItem('mock_token', `mock-jwt-${account.role}-xyz`);
      localStorage.setItem('mock_user', JSON.stringify(user));
      return { user, accessToken: `mock-jwt-${account.role}-xyz` };
    }

    if (path === '/auth/staff/google') {
      // В мок-режиме Google-вход имитирует superadmin
      const user = {
        id: 'mock-superadmin-google-id-001',
        firstName: 'Demo',
        lastName: 'Superadmin',
        role: 'superadmin',
        email: 'azizbekamangeldiev.2010@gmail.com',
      };
      localStorage.setItem('mock_token', 'mock-jwt-superadmin-xyz');
      localStorage.setItem('mock_user', JSON.stringify(user));
      return { user, accessToken: 'mock-jwt-superadmin-xyz' };
    }

    if (path === '/auth/refresh') {
      const mockToken = localStorage.getItem('mock_token');
      const mockUser = JSON.parse(localStorage.getItem('mock_user'));
      if (mockToken && mockUser) {
        return { user: mockUser, accessToken: mockToken };
      }
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }

    if (path === '/auth/logout') {
      localStorage.removeItem('mock_token');
      localStorage.removeItem('mock_user');
      return { success: true };
    }

    // -------- SUPER ADMIN: Organization Settings --------
    if (path === '/super/organization') {
      let org = JSON.parse(localStorage.getItem('mock_organization'));
      if (!org) {
        org = {
          id: 'org-uuid-001',
          name: 'LevelUp Academy',
          domain: 'levelup.uz',
          status: 'active',
          createdAt: '2026-01-10T08:00:00.000Z',
          plan: { branchLimit: null, diskSpace: '500 GB' },
        };
        localStorage.setItem('mock_organization', JSON.stringify(org));
      }
      if (method === 'PATCH') {
        org = { ...org, ...body };
        localStorage.setItem('mock_organization', JSON.stringify(org));
        return { organization: org };
      }
      return { organization: org };
    }

    // -------- SUPER ADMIN: Dashboard --------
    if (path === '/super/dashboard') {
      const { branches, admins } = getMockData();
      const totals = {
        branches: branches.length,
        activeStudents: branches.reduce((sum, b) => sum + (b.isArchived ? 0 : b.students || 0), 0),
        admins: admins.length,
        revenue: branches.reduce((sum, b) => sum + Number(b.revenue || 0), 0),
        outstandingDebt: branches.reduce((sum, b) => sum + Number(b.debt || 0), 0),
        currency: 'UZS',
      };
      return { totals, branches };
    }

    // -------- SUPER ADMIN: Branches --------
    if (path === '/super/branches') {
      const { branches, admins } = getMockData();
      if (method === 'POST') {
        const newBranch = {
          id: `branch-uuid-${Math.random().toString(36).substr(2, 9)}`,
          name: body.name, address: body.address || '', phone: body.phone || '',
          isMain: branches.length === 0, isArchived: false,
          admins: 0, students: 0, revenue: 0, debt: 0,
          createdAt: new Date().toISOString(),
        };
        branches.push(newBranch);
        saveMockData(branches, admins);
        return { branch: newBranch };
      }
      return { branches };
    }

    if (path.startsWith('/super/branches/')) {
      const { branches, admins } = getMockData();
      const parts = path.split('/');
      const id = parts[3];
      const subAction = parts[4];
      const idx = branches.findIndex((b) => b.id === id);
      if (idx === -1) { const err = new Error('Филиал не найден'); err.status = 404; throw err; }

      if (method === 'PATCH') {
        if (branches[idx].isArchived) { const err = new Error('Нельзя редактировать архивный филиал'); err.status = 403; throw err; }
        branches[idx] = { ...branches[idx],
          name: body.name !== undefined ? body.name : branches[idx].name,
          address: body.address !== undefined ? body.address : branches[idx].address,
          phone: body.phone !== undefined ? body.phone : branches[idx].phone };
        saveMockData(branches, admins);
        return { branch: branches[idx] };
      }
      if (method === 'POST' && subAction === 'archive') { branches[idx].isArchived = true; saveMockData(branches, admins); return { branch: branches[idx] }; }
      if (method === 'POST' && subAction === 'unarchive') { branches[idx].isArchived = false; saveMockData(branches, admins); return { branch: branches[idx] }; }
      if (method === 'GET') {
        const branchAdmins = admins.filter((a) => a.branchId === id);
        const groups = [
          { id: 'g1', name: 'Frontend React/Vue', subject: 'Веб-разработка', monthlyPrice: 800000 },
          { id: 'g2', name: 'Python BootCamp', subject: 'Программирование', monthlyPrice: 900000 },
        ];
        return { branch: { ...branches[idx], admins: branchAdmins, groups: branches[idx].isArchived ? [] : groups } };
      }
    }

    // -------- SUPER ADMIN: Admins --------
    if (path === '/super/admins') {
      const { branches, admins } = getMockData();
      if (method === 'POST') {
        if (admins.some((a) => a.email.toLowerCase() === body.email.toLowerCase())) { const err = new Error('Этот email уже занят'); err.status = 409; throw err; }
        const b = branches.find((x) => x.id === body.branchId);
        const newAdmin = {
          id: `admin-uuid-${Math.random().toString(36).substr(2, 9)}`,
          firstName: body.firstName, lastName: body.lastName, email: body.email,
          status: 'active', branchId: body.branchId, branchName: b ? b.name : '—',
          phone: body.phone || '', createdAt: new Date().toISOString(),
        };
        admins.push(newAdmin);
        if (b) b.admins = (b.admins || 0) + 1;
        saveMockData(branches, admins);
        return { admin: newAdmin };
      }
      return { admins };
    }

    if (path.startsWith('/super/admins/')) {
      const { branches, admins } = getMockData();
      const parts = path.split('/');
      const id = parts[3];
      const subAction = parts[4];
      const idx = admins.findIndex((a) => a.id === id);
      if (idx === -1) { const err = new Error('Администратор не найден'); err.status = 404; throw err; }
      if (method === 'PATCH' && subAction === 'freeze') { admins[idx].status = body.frozen ? 'frozen' : 'active'; saveMockData(branches, admins); return { admin: admins[idx] }; }
      if (method === 'PATCH') {
        const oldBranchId = admins[idx].branchId; const newBranchId = body.branchId;
        if (newBranchId && newBranchId !== oldBranchId) {
          const ob = branches.find((x) => x.id === oldBranchId); const nb = branches.find((x) => x.id === newBranchId);
          if (ob) ob.admins = Math.max(0, (ob.admins || 0) - 1);
          if (nb) nb.admins = (nb.admins || 0) + 1;
          admins[idx].branchId = newBranchId; admins[idx].branchName = nb ? nb.name : '—';
        }
        admins[idx].firstName = body.firstName !== undefined ? body.firstName : admins[idx].firstName;
        admins[idx].lastName = body.lastName !== undefined ? body.lastName : admins[idx].lastName;
        admins[idx].phone = body.phone !== undefined ? body.phone : admins[idx].phone;
        saveMockData(branches, admins);
        return { admin: admins[idx] };
      }
    }

    // -------- SUPER ADMIN: Methodists --------
    if (path === '/super/methodists') {
      if (method === 'POST') {
        const methodistList = JSON.parse(localStorage.getItem('mock_methodists') || '[]');
        if (methodistList.some((m) => m.email.toLowerCase() === body.email.toLowerCase())) { const err = new Error('Этот email уже занят'); err.status = 409; throw err; }
        const newMethodist = {
          id: `methodist-uuid-${Math.random().toString(36).substr(2, 9)}`,
          firstName: body.firstName, lastName: body.lastName, email: body.email,
          status: 'active', phone: body.phone || '', createdAt: new Date().toISOString(),
        };
        methodistList.push(newMethodist);
        localStorage.setItem('mock_methodists', JSON.stringify(methodistList));
        return { methodist: newMethodist };
      }
      let methodists = JSON.parse(localStorage.getItem('mock_methodists') || '[]');
      if (methodists.length === 0) {
        methodists = [
          { id: 'methodist-uuid-1111', firstName: 'Мадина', lastName: 'Рахимова', email: 'madina@levelup.local', status: 'active', phone: '+998901234561', createdAt: '2026-06-01T10:00:00.000Z' },
          { id: 'methodist-uuid-2222', firstName: 'Бобур', lastName: 'Каримов', email: 'bobur@levelup.local', status: 'active', phone: '+998901234562', createdAt: '2026-06-15T12:00:00.000Z' },
        ];
        localStorage.setItem('mock_methodists', JSON.stringify(methodists));
      }
      return { methodists };
    }

    if (path.startsWith('/super/methodists/')) {
      const parts = path.split('/');
      const id = parts[3]; const subAction = parts[4];
      let methodists = JSON.parse(localStorage.getItem('mock_methodists') || '[]');
      const idx = methodists.findIndex((m) => m.id === id);
      if (idx === -1) { const err = new Error('Методист не найден'); err.status = 404; throw err; }
      if (method === 'PATCH' && subAction === 'freeze') { methodists[idx].status = body.frozen ? 'frozen' : 'active'; localStorage.setItem('mock_methodists', JSON.stringify(methodists)); return { methodist: methodists[idx] }; }
      if (method === 'PATCH') {
        methodists[idx].firstName = body.firstName !== undefined ? body.firstName : methodists[idx].firstName;
        methodists[idx].lastName = body.lastName !== undefined ? body.lastName : methodists[idx].lastName;
        methodists[idx].phone = body.phone !== undefined ? body.phone : methodists[idx].phone;
        localStorage.setItem('mock_methodists', JSON.stringify(methodists));
        return { methodist: methodists[idx] };
      }
    }

    // -------- SUPER ADMIN: Organization --------
    if (path === '/super/organization') {
      let org = JSON.parse(localStorage.getItem('mock_org') || 'null');
      if (!org) {
        org = { id: 'org-uuid-0001', name: 'LevelUp Academy', domain: 'levelup.uz', status: 'active', createdAt: '2026-01-01T00:00:00.000Z', plan: { branchLimit: 10, diskSpace: '500 ГБ' } };
        localStorage.setItem('mock_org', JSON.stringify(org));
      }
      if (method === 'PATCH') { org = { ...org, ...body }; localStorage.setItem('mock_org', JSON.stringify(org)); return { organization: org }; }
      return { organization: org };
    }

    // -------- TRAINING TYPES --------
    if (path === '/methodist/training-types') {
      if (method === 'POST') {
        const newItem = {
          id: `tt-${Date.now()}`,
          name: body.name,
          description: body.description || '',
          icon: body.icon || '📚',
          sort_order: mocks.tt.length,
          created_at: new Date().toISOString(),
          topics_count: 0,
        };
        mocks.tt.push(newItem);
        localStorage.setItem('mock_tt', JSON.stringify(mocks.tt));
        return { success: true, data: newItem };
      }
      return { success: true, data: mocks.tt };
    }

    if (path.startsWith('/methodist/training-types/') && path.endsWith('/archive')) {
      const id = path.split('/')[3];
      mocks.tt = mocks.tt.filter((t) => t.id !== id);
      localStorage.setItem('mock_tt', JSON.stringify(mocks.tt));
      return { success: true };
    }

    if (path.match(/^\/methodist\/training-types\/([^/]+)$/)) {
      const id = path.split('/')[3];
      if (method === 'PATCH') {
        const idx = mocks.tt.findIndex((t) => t.id === id);
        if (idx >= 0) {
          Object.assign(mocks.tt[idx], body);
          localStorage.setItem('mock_tt', JSON.stringify(mocks.tt));
          return { success: true, data: mocks.tt[idx] };
        }
      }
    }

    // -------- TOPICS --------
    const topicMatch = path.match(/^\/methodist\/training-types\/([^/]+)\/topics$/);
    if (topicMatch) {
      const trainingTypeId = topicMatch[1];
      const filtered = mocks.topics.filter((t) => t.training_type_id === trainingTypeId);
      return { success: true, data: filtered };
    }

    if (path === '/methodist/topics') {
      if (method === 'POST') {
        const newItem = {
          id: `tp-${Date.now()}`,
          training_type_id: body.trainingTypeId,
          name: body.name,
          description: body.description || '',
          sort_order: mocks.topics.length,
          created_at: new Date().toISOString(),
          lessons_count: 0,
        };
        mocks.topics.push(newItem);
        localStorage.setItem('mock_topics', JSON.stringify(mocks.topics));
        // update topics_count in training type
        const ttIdx = mocks.tt.findIndex((t) => t.id === body.trainingTypeId);
        if (ttIdx >= 0) {
          mocks.tt[ttIdx].topics_count = (mocks.tt[ttIdx].topics_count || 0) + 1;
          localStorage.setItem('mock_tt', JSON.stringify(mocks.tt));
        }
        return { success: true, data: newItem };
      }
    }

    if (path.match(/^\/methodist\/topics\/([^/]+)$/)) {
      const id = path.split('/')[3];
      if (method === 'PATCH') {
        const idx = mocks.topics.findIndex((t) => t.id === id);
        if (idx >= 0) {
          Object.assign(mocks.topics[idx], body);
          localStorage.setItem('mock_topics', JSON.stringify(mocks.topics));
          return { success: true, data: mocks.topics[idx] };
        }
      }
    }

    if (path.match(/^\/methodist\/topics\/([^/]+)\/archive$/)) {
      const id = path.split('/')[3];
      mocks.topics = mocks.topics.filter((t) => t.id !== id);
      localStorage.setItem('mock_topics', JSON.stringify(mocks.topics));
      return { success: true };
    }

    // -------- LESSONS --------
    const lessonMatch = path.match(/^\/methodist\/topics\/([^/]+)\/lessons$/);
    if (lessonMatch) {
      const topicId = lessonMatch[1];
      const filtered = mocks.lessons.filter((l) => l.topic_id === topicId);
      return { success: true, data: filtered };
    }

    if (path === '/methodist/lessons') {
      if (method === 'POST') {
        const newItem = {
          id: `ls-${Date.now()}`,
          topic_id: body.topicId,
          title: body.title,
          lesson_type: body.lessonType,
          description: body.description || '',
          instruction: body.instruction || '',
          coin_reward: body.coinReward || 0,
          sort_order: mocks.lessons.length,
          created_at: new Date().toISOString(),
          questions_count: 0,
        };
        mocks.lessons.push(newItem);
        localStorage.setItem('mock_lessons', JSON.stringify(mocks.lessons));
        return { success: true, data: newItem };
      }
    }

    if (path.match(/^\/methodist\/lessons\/([^/]+)$/)) {
      const id = path.split('/')[3];
      if (method === 'GET') {
        const lesson = mocks.lessons.find((l) => l.id === id);
        const qs = mocks.questions.filter((q) => q.lesson_id === id);
        return { success: true, data: { ...lesson, questions: qs } };
      }
      if (method === 'PATCH') {
        const idx = mocks.lessons.findIndex((l) => l.id === id);
        if (idx >= 0) {
          Object.assign(mocks.lessons[idx], body);
          localStorage.setItem('mock_lessons', JSON.stringify(mocks.lessons));
          return { success: true, data: mocks.lessons[idx] };
        }
      }
    }

    if (path.match(/^\/methodist\/lessons\/([^/]+)\/archive$/)) {
      const id = path.split('/')[3];
      mocks.lessons = mocks.lessons.filter((l) => l.id !== id);
      localStorage.setItem('mock_lessons', JSON.stringify(mocks.lessons));
      return { success: true };
    }

    const copyMatch = path.match(/^\/methodist\/lessons\/([^/]+)\/copy$/);
    if (copyMatch && method === 'POST') {
      const lessonId = copyMatch[1];
      const { targetTopicId } = body;
      const original = mocks.lessons.find((l) => l.id === lessonId);
      if (original) {
        const newLesson = {
          ...original,
          id: `ls-${Date.now()}`,
          topic_id: targetTopicId,
          title: `${original.title} (копия)`,
          created_at: new Date().toISOString(),
          questions_count: original.questions_count,
        };
        mocks.lessons.push(newLesson);
        localStorage.setItem('mock_lessons', JSON.stringify(mocks.lessons));
        // copy questions
        const qs = mocks.questions.filter((q) => q.lesson_id === lessonId);
        const newQs = qs.map((q) => ({ ...q, id: `q-${Date.now()}-${Math.random()}`, lesson_id: newLesson.id }));
        mocks.questions.push(...newQs);
        localStorage.setItem('mock_questions', JSON.stringify(mocks.questions));
        return { success: true, data: newLesson };
      }
    }

    // -------- QUESTIONS --------
    const qMatch = path.match(/^\/methodist\/lessons\/([^/]+)\/questions$/);
    if (qMatch) {
      const lessonId = qMatch[1];
      const filtered = mocks.questions.filter((q) => q.lesson_id === lessonId);
      return { success: true, data: filtered };
    }

    if (path === '/methodist/questions') {
      if (method === 'POST') {
        const newItem = {
          id: `q-${Date.now()}`,
          lesson_id: body.lessonId,
          question_text: body.questionText,
          option_a: body.optionA,
          option_b: body.optionB,
          option_c: body.optionC,
          option_d: body.optionD,
          correct_answer: body.correctAnswer,
          sort_order: mocks.questions.length,
        };
        mocks.questions.push(newItem);
        localStorage.setItem('mock_questions', JSON.stringify(mocks.questions));
        return { success: true, data: newItem };
      }
    }

    if (path === '/methodist/questions/batch') {
      if (method === 'POST') {
        const newQs = body.questions.map((q, i) => ({
          id: `q-${Date.now()}-${i}`,
          lesson_id: q.lessonId,
          question_text: q.questionText,
          option_a: q.optionA,
          option_b: q.optionB,
          option_c: q.optionC,
          option_d: q.optionD,
          correct_answer: q.correctAnswer,
          sort_order: mocks.questions.length + i,
        }));
        mocks.questions.push(...newQs);
        localStorage.setItem('mock_questions', JSON.stringify(mocks.questions));
        return { success: true, data: newQs };
      }
    }

    if (path.match(/^\/methodist\/questions\/([^/]+)$/)) {
      const id = path.split('/')[3];
      if (method === 'PATCH') {
        const idx = mocks.questions.findIndex((q) => q.id === id);
        if (idx >= 0) {
          Object.assign(mocks.questions[idx], body);
          localStorage.setItem('mock_questions', JSON.stringify(mocks.questions));
          return { success: true, data: mocks.questions[idx] };
        }
      }
      if (method === 'DELETE') {
        mocks.questions = mocks.questions.filter((q) => q.id !== id);
        localStorage.setItem('mock_questions', JSON.stringify(mocks.questions));
        return { success: true };
      }
    }

    // -------- ANALYTICS --------
    if (path === '/methodist/difficulty') {
      return {
        success: true,
        data: {
          tests: [
            { test_id: 't1', title: 'HTML Теги', group_name: 'Frontend React/Vue', subject: 'Веб-разработка', branch_name: 'Downtown Academy', attempts: 15, avg_score: '68.5', question_count: 3 },
            { test_id: 't2', title: 'Переменные и типы', group_name: 'Frontend React/Vue', subject: 'Веб-разработка', branch_name: 'Downtown Academy', attempts: 12, avg_score: '45.2', question_count: 4 },
            { test_id: 't3', title: 'Hello World', group_name: 'Python BootCamp', subject: 'Программирование', branch_name: 'Chilanzar Branch', attempts: 10, avg_score: '82.0', question_count: 2 },
          ],
          homework: [
            { homework_id: 'h1', title: 'Flexbox Layout', group_name: 'Frontend React/Vue', subject: 'Веб-разработка', branch_name: 'Downtown Academy', submissions: 14, avg_score: '78.5', max_score: 100 },
            { homework_id: 'h2', title: 'Python Dictionary', group_name: 'Python BootCamp', subject: 'Программирование', branch_name: 'Chilanzar Branch', submissions: 8, avg_score: '52.3', max_score: 100 },
          ],
        },
      };
    }

    if (path === '/methodist/groups') {
      return {
        success: true,
        data: [
          { id: 'g1', name: 'Frontend React/Vue', subject: 'Веб-разработка', branch_name: 'Downtown Academy', mentor_name: 'Ильхом Кадыров', student_count: 15 },
          { id: 'g2', name: 'Python BootCamp', subject: 'Программирование', branch_name: 'Chilanzar Branch', mentor_name: 'Джасур Усманов', student_count: 12 },
        ],
      };
    }

    if (path === '/methodist/students') {
      return {
        success: true,
        data: [
          { id: 's1', first_name: 'Анвар', last_name: 'Собиров', branch_name: 'Downtown Academy', groups: [{ id: 'g1', name: 'Frontend React/Vue', subject: 'Веб-разработка' }] },
          { id: 's2', first_name: 'Гульноза', last_name: 'Каримова', branch_name: 'Chilanzar Branch', groups: [{ id: 'g2', name: 'Python BootCamp', subject: 'Программирование' }] },
          { id: 's3', first_name: 'Ботир', last_name: 'Хасанов', branch_name: 'Downtown Academy', groups: [{ id: 'g1', name: 'Frontend React/Vue', subject: 'Веб-разработка' }] },
        ],
      };
    }

    // -------- MENTOR: Helper --------
    function getMockBalances() {
      return JSON.parse(localStorage.getItem('mock_coin_balances') || '{}');
    }

    const DEFAULT_BALANCES = { 's-1': 150, 's-2': 210, 's-3': 95, 's-4': 130, 's-5': 60, 's-6': 175, 's-7': 80, 's-8': 200, 's-9': 90, 's-10': 45 };

    function studentWithBalance(s) {
      const balances = getMockBalances();
      return { ...s, coin_balance: balances[s.id] ?? DEFAULT_BALANCES[s.id] ?? 0 };
    }

    // -------- MENTOR: Groups --------
    if (path === '/mentor/groups') {
      return {
        success: true,
        data: [
          { id: 'g-1', name: 'Frontend React N13', subject: 'Veb-development', monthly_price: 800000, students_count: 15 },
          { id: 'g-2', name: 'Python Bootcamp', subject: 'Programming', monthly_price: 900000, students_count: 12 },
          { id: 'g-3', name: 'English Advanced', subject: 'English', monthly_price: 600000, students_count: 10 },
        ],
      };
    }

    const groupsMatch = path.match(/^\/mentor\/groups\/([^/]+)\/students$/);
    if (groupsMatch) {
      const groupId = groupsMatch[1];
      const studentsByGroup = {
        'g-1': [
          { id: 's-1', first_name: 'Anvar', last_name: 'Sobirov', phone: '+998901234561', status: 'active', student_code: 'ST001' },
          { id: 's-2', first_name: 'Malika', last_name: 'Yusupova', phone: '+998901234562', status: 'active', student_code: 'ST002' },
          { id: 's-3', first_name: 'Javlon', last_name: 'Rustamov', phone: '+998901234563', status: 'frozen', student_code: 'ST003' },
          { id: 's-4', first_name: 'Dilnoza', last_name: 'Karimova', phone: '+998901234564', status: 'active', student_code: 'ST004' },
          { id: 's-5', first_name: 'Sardor', last_name: 'Aliyev', phone: '+998901234565', status: 'active', student_code: 'ST005' },
        ],
        'g-2': [
          { id: 's-6', first_name: 'Kamola', last_name: 'Nortojiyeva', phone: '+998901234566', status: 'active', student_code: 'ST006' },
          { id: 's-7', first_name: 'Otabek', last_name: "Yo'ldoshev", phone: '+998901234567', status: 'active', student_code: 'ST007' },
          { id: 's-8', first_name: 'Nilufar', last_name: 'Xoshimova', phone: '+998901234568', status: 'frozen', student_code: 'ST008' },
        ],
        'g-3': [
          { id: 's-9', first_name: 'Botir', last_name: 'Xasanov', phone: '+998901234569', status: 'active', student_code: 'ST009' },
          { id: 's-10', first_name: 'Gulnora', last_name: 'Karimova', phone: '+998901234570', status: 'active', student_code: 'ST010' },
        ],
      };
      return { success: true, data: (studentsByGroup[groupId] || []).map(studentWithBalance) };
    }

    // -------- MENTOR: Attendance --------
    const attMatch = path.match(/^\/mentor\/attendance\/groups\/([^/]+)/);
    if (attMatch) {
      const groupId = attMatch[1];
      if (method === 'POST') {
        return { success: true, data: body.records };
      }
      // GET - extract date params from query string
      const url = new URL(path, 'http://localhost');
      const dateParam = url.searchParams.get('date');
      const fromParam = url.searchParams.get('from');
      const toParam = url.searchParams.get('to');

      // Generate attendance records for each date in range
      const startDate = dateParam || fromParam || '2026-07-01';
      const endDate = toParam || startDate;

      const allRecords = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      const statuses = ['present', 'present', 'present', 'absent', 'present', 'late', 'present'];
      const studentIds = ['s-1', 's-2', 's-3', 's-4', 's-5'];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        studentIds.forEach((sid, i) => {
          // Random-ish but deterministic pattern per student per day
          const idx = (d.getDate() + i) % statuses.length;
          allRecords.push({
            student_id: sid,
            date: dateStr,
            status: statuses[idx],
          });
        });
      }

      return { success: true, data: allRecords };
    }

    // -------- MENTOR: Homework --------
    const hwListMatch = path.match(/^\/mentor\/homework\/groups\/([^/]+)$/);
    if (hwListMatch && method === 'GET') {
      return {
        success: true,
        data: [
          { id: 'hw-1', title: 'Flexbox Layout', description: 'Create a responsive layout using Flexbox', max_score: 100, coin_reward: 10, deadline: '2026-07-20T23:59:00Z', submissions_count: 5, graded_count: 2, created_at: '2026-07-15T10:00:00Z' },
          { id: 'hw-2', title: 'JavaScript Functions', description: 'Write 10 functions', max_score: 100, coin_reward: 15, deadline: '2026-07-25T23:59:00Z', submissions_count: 3, graded_count: 0, created_at: '2026-07-18T10:00:00Z' },
          { id: 'hw-3', title: 'Python Dictionary', description: 'Working with dictionaries', max_score: 50, coin_reward: 5, deadline: '2026-07-22T23:59:00Z', submissions_count: 7, graded_count: 4, created_at: '2026-07-16T10:00:00Z' },
        ],
      };
    }

    const subMatch = path.match(/^\/mentor\/homework\/([^/]+)\/submissions$/);
    if (subMatch && method === 'GET') {
      return {
        success: true,
        data: [
          { id: 'sub-1', homework_id: subMatch[1], student_id: 's-1', first_name: 'Anvar', last_name: 'Sobirov', status: 'submitted', score: null, file_key: null, text_answer: 'Here is my flexbox layout code', submitted_at: '2026-07-18T14:30:00Z', graded_at: null },
          { id: 'sub-2', homework_id: subMatch[1], student_id: 's-2', first_name: 'Malika', last_name: 'Yusupova', status: 'submitted', score: null, file_key: null, text_answer: 'Complete all tasks', submitted_at: '2026-07-19T09:15:00Z', graded_at: null },
          { id: 'sub-3', homework_id: subMatch[1], student_id: 's-4', first_name: 'Dilnoza', last_name: 'Karimova', status: 'graded', score: 85, file_key: null, text_answer: 'Done', submitted_at: '2026-07-17T16:00:00Z', graded_at: '2026-07-18T10:00:00Z' },
        ],
      };
    }

    const gradeMatch = path.match(/^\/mentor\/homework\/submissions\/([^/]+)\/grade$/);
    if (gradeMatch && method === 'POST') {
      return { success: true, data: { id: gradeMatch[1], score: body.score, status: 'graded' } };
    }

    // -------- MENTOR: Coins --------
    if (path === '/mentor/coins' && method === 'POST') {
      const historyKey = `mock_coin_history_${body.studentId}`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      history.unshift({
        id: `ch-${Date.now()}`,
        amount: body.amount,
        reason: body.reason,
        operation: body.amount > 0 ? 'reward' : 'deduction',
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(historyKey, JSON.stringify(history));
      // Update balance in localStorage so student roster shows updated value
      const balances = getMockBalances();
      const oldBal = DEFAULT_BALANCES[body.studentId] ?? 0;
      balances[body.studentId] = (balances[body.studentId] ?? oldBal) + body.amount;
      localStorage.setItem('mock_coin_balances', JSON.stringify(balances));
      return { success: true, data: { balance_after: balances[body.studentId] } };
    }

    const coinHistMatch = path.match(/^\/mentor\/coins\/students\/([^/]+)$/);
    if (coinHistMatch && method === 'GET') {
      const historyKey = `mock_coin_history_${coinHistMatch[1]}`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      return { success: true, data: { history, balance: history.reduce((s, h) => s + h.amount, 100) } };
    }

    // Fallback
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
  // -------- MENTOR: Groups --------
  mentorGroups: (token) => request('/mentor/groups', { token }),
  mentorGroupStudents: (token, groupId) => request(`/mentor/groups/${groupId}/students`, { token }),

  // -------- MENTOR: Attendance --------
  mentorAttendance: (token, groupId, params) => {
    const query = params.date
      ? `?date=${params.date}`
      : `?from=${params.from}&to=${params.to}`;
    return request(`/mentor/attendance/groups/${groupId}${query}`, { token });
  },
  mentorMarkAttendance: (token, groupId, body) =>
    request(`/mentor/attendance/groups/${groupId}`, { method: 'POST', token, body }),

  // -------- MENTOR: Homework (view + grade only) --------
  mentorHomeworkList: (token, groupId) => request(`/mentor/homework/groups/${groupId}`, { token }),
  mentorHomeworkSubmissions: (token, homeworkId) =>
    request(`/mentor/homework/${homeworkId}/submissions`, { token }),
  mentorGradeSubmission: (token, submissionId, body) =>
    request(`/mentor/homework/submissions/${submissionId}/grade`, { method: 'POST', token, body }),

  // -------- MENTOR: Coins --------
  mentorGrantCoins: (token, body) => request('/mentor/coins', { method: 'POST', token, body }),
  mentorCoinHistory: (token, studentId) => request(`/mentor/coins/students/${studentId}`, { token }),

  // -------- AUTH (staff — admin/superadmin/mentor/methodist) --------
  loginStaff: (login, password) =>
    request('/auth/staff/login', { method: 'POST', body: { login, password } }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  googleLogin: (idToken) => request('/auth/staff/google', { method: 'POST', body: { idToken } }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body }),

  // -------- SUPER ADMIN --------
  superDashboard: (token) => request('/super/dashboard', { token }),
  superBranches: (token) => request('/super/branches', { token }),
  superBranchDetail: (token, id) => request(`/super/branches/${id}`, { token }),
  superCreateBranch: (token, body) => request('/super/branches', { method: 'POST', token, body }),
  superUpdateBranch: (token, id, body) => request(`/super/branches/${id}`, { method: 'PATCH', token, body }),
  superArchiveBranch: (token, id) => request(`/super/branches/${id}/archive`, { method: 'POST', token }),
  superUnarchiveBranch: (token, id) => request(`/super/branches/${id}/unarchive`, { method: 'POST', token }),
  superAdmins: (token) => request('/super/admins', { token }),
  superCreateAdmin: (token, body) => request('/super/admins', { method: 'POST', token, body }),
  superUpdateAdmin: (token, id, body) => request(`/super/admins/${id}`, { method: 'PATCH', token, body }),
  superFreezeAdmin: (token, id) => request(`/super/admins/${id}/freeze`, { method: 'PATCH', token, body: { frozen: true } }),
  superUnfreezeAdmin: (token, id) => request(`/super/admins/${id}/freeze`, { method: 'PATCH', token, body: { frozen: false } }),
  superGetOrganization: (token) => request('/super/organization', { token }),
  superUpdateOrganization: (token, body) => request('/super/organization', { method: 'PATCH', token, body }),
  superMethodists: (token) => request('/super/methodists', { token }),
  superCreateMethodist: (token, body) => request('/super/methodists', { method: 'POST', token, body }),
  superUpdateMethodist: (token, id, body) => request(`/super/methodists/${id}`, { method: 'PATCH', token, body }),
  superFreezeMethodist: (token, id) => request(`/super/methodists/${id}/freeze`, { method: 'PATCH', token, body: { frozen: true } }),
  superUnfreezeMethodist: (token, id) => request(`/super/methodists/${id}/freeze`, { method: 'PATCH', token, body: { frozen: false } }),

  // -------- SUPER ADMIN: Students --------
  superStudents: (token, qs = '') => request(`/super/students${qs}`, { token }),
  superDeleteStudent: (token, id) => request(`/super/students/${id}`, { method: 'DELETE', token }),

  // -------- SUPER ADMIN: Groups --------
  superGroups: (token) => request('/super/groups', { token }),
  superArchiveGroup: (token, id) => request(`/super/groups/${id}/archive`, { method: 'POST', token }),
  superUnarchiveGroup: (token, id) => request(`/super/groups/${id}/unarchive`, { method: 'POST', token }),
  superDeleteGroup: (token, id) => request(`/super/groups/${id}`, { method: 'DELETE', token }),

  // -------- SUPER ADMIN: Audit --------
  superAudit: (token) => request('/super/audit', { token }),

  // -------- SUPER ADMIN: Announcements --------
  superAnnouncements: (token) => request('/super/announcements', { token }),
  superCreateAnnouncement: (token, body) => request('/super/announcements', { method: 'POST', token, body }),
  superDeleteAnnouncement: (token, id) => request(`/super/announcements/${id}`, { method: 'DELETE', token }),

  // -------- SUPER ADMIN: Reminders --------
  superReminders: (token) => request('/super/reminders', { token }),
  superDeleteReminder: (token, id) => request(`/super/reminders/${id}`, { method: 'DELETE', token }),
  superResendReminder: (token, id) => request(`/super/reminders/${id}/resend`, { method: 'POST', token }),

  // -------- SUPER ADMIN: Attendance --------
  superAttendance: (token, qs = '') => request(`/super/attendance${qs}`, { token }),

  // -------- METHODIST CONTENT --------
  methodistTrainingTypes: (token) => request('/methodist/training-types', { token }),
  methodistCreateTrainingType: (token, body) => request('/methodist/training-types', { method: 'POST', token, body }),
  methodistUpdateTrainingType: (token, id, body) => request(`/methodist/training-types/${id}`, { method: 'PATCH', token, body }),
  methodistArchiveTrainingType: (token, id) => request(`/methodist/training-types/${id}/archive`, { method: 'POST', token }),

  methodistTopics: (token, trainingTypeId) => request(`/methodist/training-types/${trainingTypeId}/topics`, { token }),
  methodistCreateTopic: (token, body) => request('/methodist/topics', { method: 'POST', token, body }),
  methodistUpdateTopic: (token, id, body) => request(`/methodist/topics/${id}`, { method: 'PATCH', token, body }),
  methodistArchiveTopic: (token, id) => request(`/methodist/topics/${id}/archive`, { method: 'POST', token }),

  methodistLessons: (token, topicId) => request(`/methodist/topics/${topicId}/lessons`, { token }),
  methodistCreateLesson: (token, body) => request('/methodist/lessons', { method: 'POST', token, body }),
  methodistGetLesson: (token, id) => request(`/methodist/lessons/${id}`, { token }),
  methodistUpdateLesson: (token, id, body) => request(`/methodist/lessons/${id}`, { method: 'PATCH', token, body }),
  methodistArchiveLesson: (token, id) => request(`/methodist/lessons/${id}/archive`, { method: 'POST', token }),
  methodistCopyLesson: (token, id, targetTopicId) => request(`/methodist/lessons/${id}/copy`, { method: 'POST', token, body: { targetTopicId } }),

  methodistQuestions: (token, lessonId) => request(`/methodist/lessons/${lessonId}/questions`, { token }),
  methodistCreateQuestion: (token, body) => request('/methodist/questions', { method: 'POST', token, body }),
  methodistCreateQuestionsBatch: (token, questions) => request('/methodist/questions/batch', { method: 'POST', token, body: { questions } }),
  methodistUpdateQuestion: (token, id, body) => request(`/methodist/questions/${id}`, { method: 'PATCH', token, body }),
  methodistDeleteQuestion: (token, id) => request(`/methodist/questions/${id}`, { method: 'DELETE', token }),

  // -------- METHODIST ANALYTICS --------
  methodistDifficulty: (token) => request('/methodist/difficulty', { token }),
  methodistGroups: (token) => request('/methodist/groups', { token }),
  methodistStudents: (token) => request('/methodist/students', { token }),

  // -------- ADMIN (branch) --------
  adminDashboard: (token) => request('/admin/dashboard', { token }),
  adminReports: (token, qs = '') => request(`/admin/reports${qs}`, { token }),

  adminExpenses: (token, qs = '') => request(`/admin/expenses${qs}`, { token }),
  adminCreateExpense: (token, body) => request('/admin/expenses', { method: 'POST', token, body }),
  adminDeleteExpense: (token, id) => request(`/admin/expenses/${id}`, { method: 'DELETE', token }),

  adminStudents: (token, qs = '') => request(`/admin/students${qs}`, { token }),
  adminStudentDetail: (token, id) => request(`/admin/students/${id}`, { token }),
  adminCreateStudent: (token, body) => request('/admin/students', { method: 'POST', token, body }),
  adminUpdateStudent: (token, id, body) => request(`/admin/students/${id}`, { method: 'PATCH', token, body }),
  adminFreezeStudent: (token, id, frozen, reason) => request(`/admin/students/${id}/freeze`, { method: 'POST', token, body: { frozen, reason } }),
  adminRegenStudentPassword: (token, id) => request(`/admin/students/${id}/regenerate-password`, { method: 'POST', token }),
  adminDeleteStudent: (token, id) => request(`/admin/students/${id}`, { method: 'DELETE', token }),

  adminMentors: (token) => request('/admin/mentors', { token }),
  adminCreateMentor: (token, body) => request('/admin/mentors', { method: 'POST', token, body }),
  adminUpdateMentor: (token, id, body) => request(`/admin/mentors/${id}`, { method: 'PATCH', token, body }),
  adminFreezeMentor: (token, id, frozen) => request(`/admin/mentors/${id}/freeze`, { method: 'POST', token, body: { frozen } }),
  adminDeleteMentor: (token, id) => request(`/admin/mentors/${id}`, { method: 'DELETE', token }),

  adminGroups: (token, qs = '') => request(`/admin/groups${qs}`, { token }),
  adminGroupDetail: (token, id) => request(`/admin/groups/${id}`, { token }),
  adminCreateGroup: (token, body) => request('/admin/groups', { method: 'POST', token, body }),
  adminUpdateGroup: (token, id, body) => request(`/admin/groups/${id}`, { method: 'PATCH', token, body }),
  adminArchiveGroup: (token, id) => request(`/admin/groups/${id}/archive`, { method: 'POST', token }),
  adminUnarchiveGroup: (token, id) => request(`/admin/groups/${id}/unarchive`, { method: 'POST', token }),
  adminAddStudentToGroup: (token, groupId, studentId) => request(`/admin/groups/${groupId}/students`, { method: 'POST', token, body: { studentId } }),
  adminRemoveStudentFromGroup: (token, groupId, studentId) => request(`/admin/groups/${groupId}/students/${studentId}`, { method: 'DELETE', token }),

  adminInvoices: (token, qs = '') => request(`/admin/payments/invoices${qs}`, { token }),
  adminCreatePayment: (token, body) => request('/admin/payments', { method: 'POST', token, body }),
  adminPayInvoice: (token, id, body) => request(`/admin/payments/invoices/${id}/pay`, { method: 'POST', token, body }),
  adminRefundTransaction: (token, id, reason) => request(`/admin/payments/transactions/${id}/refund`, { method: 'POST', token, body: { reason } }),

  adminSettings: (token) => request('/admin/settings', { token }),
  adminUpdateSettings: (token, body) => request('/admin/settings', { method: 'PUT', token, body }),

  // -------- MAIN ADMIN --------
  mainDashboard: (token) => request('/main/dashboard', { token }),
  mainPartners: (token) => request('/main/partners', { token }),
  mainSetPartnerStatus: (token, id, status) =>
    request(`/main/partners/${id}/status`, { method: 'PATCH', token, body: { status } }),
  mainOnboardPartner: (token, body) =>
    request('/main/partners', { method: 'POST', token, body }),
  mainLeads: (token) => request('/main/leads', { token }),
  mainUpdateLead: (token, id, body) =>
    request(`/main/leads/${id}`, { method: 'PATCH', token, body }),
  mainGetPricing: (token) => request('/main/pricing', { token }),
  mainUpdatePricing: (token, body) => request('/main/pricing', { method: 'PUT', token, body }),
};
