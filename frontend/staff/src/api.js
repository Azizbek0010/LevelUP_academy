// Все запросы идут на /api (dev-прокси Vite → http://localhost:4000).
// VITE_API_URL — боевой бэкенд (Render) для production build.
// VITE_USE_MOCKS=false — отключает моки, использует реальный бэкенд.
// По умолчанию true: эмуляция на localStorage для разработки без бэкенда.

const API_BASE = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL || '' : '';
const USE_MOCKS =
  typeof import.meta !== 'undefined' ? import.meta.env.VITE_USE_MOCKS !== 'false' : true;

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

    // -------- ADMIN: Dashboard --------
    if (path === '/admin/dashboard') {
      return {
        totals: {
          totalStudents: 142,
          activeStudents: 128,
          frozenStudents: 14,
          totalGroups: 8,
          totalMentors: 6,
          totalRevenue: 42500000,
          totalExpenses: 8200000,
          outstandingDebt: 3400000,
          currency: 'UZS',
        },
        thisMonth: {
          newStudents: 12,
          revenue: 6800000,
          expenses: 1500000,
          payments: 23,
        },
        recentActivity: [
          { id: 'a1', type: 'payment', message: 'O\'zbekov Sardor — 850,000 UZS', time: '2 soat oldin' },
          { id: 'a2', type: 'student', message: 'Yangi talaba: Karimova Nilufar', time: '5 soat oldin' },
          { id: 'a3', type: 'expense', message: 'Xarajat: Ofis jihozlari — 320,000 UZS', time: 'Kecha' },
          { id: 'a4', type: 'group', message: 'Frontend React guruhiga 3 ta talaba qo\'shildi', time: '2 kun oldin' },
        ],
      };
    }

    // -------- ADMIN: Students --------
    if (path === '/admin/students' && method === 'GET') {
      let students = JSON.parse(localStorage.getItem('mock_admin_students') || '[]');
      if (students.length === 0) {
        students = [
          { id: 'st-1', firstName: 'Sardor', lastName: 'O\'zbekov', phone: '+998901112233', status: 'active', balance: 1250000, coins: 340, groupName: 'Frontend React', mentorName: 'Ilhom Karimov', createdAt: '2026-01-15T10:00:00Z', loginCode: 'demostud' },
          { id: 'st-2', firstName: 'Nilufar', lastName: 'Karimova', phone: '+998902223344', status: 'active', balance: 850000, coins: 210, groupName: 'Python Bootcamp', mentorName: 'Jasur Usmanov', createdAt: '2026-01-20T11:00:00Z', loginCode: 'nilufar1' },
          { id: 'st-3', firstName: 'Botir', lastName: 'Hasanov', phone: '+998903334455', status: 'active', balance: 2100000, coins: 520, groupName: 'Frontend React', mentorName: 'Ilhom Karimov', createdAt: '2026-02-01T09:00:00Z', loginCode: 'botir12' },
          { id: 'st-4', firstName: 'Gulnora', lastName: 'Rahimova', phone: '+998904445566', status: 'frozen', balance: 450000, coins: 80, groupName: 'Python Bootcamp', mentorName: 'Jasur Usmanov', createdAt: '2026-02-10T08:30:00Z', loginCode: 'gulno4' },
          { id: 'st-5', firstName: 'Javlon', lastName: 'Abdullayev', phone: '+998905556677', status: 'active', balance: 980000, coins: 175, groupName: 'UI/UX Design', mentorName: 'Malika Sharipova', createdAt: '2026-02-15T14:00:00Z', loginCode: 'javlon5' },
          { id: 'st-6', firstName: 'Dilshod', lastName: 'Tursunov', phone: '+998906667788', status: 'active', balance: 1560000, coins: 290, groupName: 'Frontend React', mentorName: 'Ilhom Karimov', createdAt: '2026-03-01T10:00:00Z', loginCode: 'dilsh6' },
          { id: 'st-7', firstName: 'Malika', lastName: 'Nazarova', phone: '+998907778899', status: 'active', balance: 720000, coins: 145, groupName: 'Backend Node.js', mentorName: 'Sardor Rakhimov', createdAt: '2026-03-05T11:30:00Z', loginCode: 'malik7' },
          { id: 'st-8', firstName: 'Otabek', lastName: 'Mirzayev', phone: '+998908889900', status: 'active', balance: 1890000, coins: 410, groupName: 'UI/UX Design', mentorName: 'Malika Sharipova', createdAt: '2026-03-10T09:00:00Z', loginCode: 'otab8' },
          { id: 'st-9', firstName: 'Shahzoda', lastName: 'Ismoilova', phone: '+998909990011', status: 'active', balance: 630000, coins: 95, groupName: 'Python Bootcamp', mentorName: 'Jasur Usmanov', createdAt: '2026-03-15T10:00:00Z', loginCode: 'shahz9' },
          { id: 'st-10', firstName: 'Sardor', lastName: 'Jumaev', phone: '+998901112200', status: 'active', balance: 1340000, coins: 260, groupName: 'Backend Node.js', mentorName: 'Sardor Rakhimov', createdAt: '2026-03-20T12:00:00Z', loginCode: 'sard10' },
          { id: 'st-11', firstName: 'Nodira', lastName: 'Karimova', phone: '+998902223300', status: 'active', balance: 890000, coins: 180, groupName: 'Frontend React', mentorName: 'Ilhom Karimov', createdAt: '2026-04-01T08:00:00Z', loginCode: 'nodir11' },
          { id: 'st-12', firstName: 'Akbar', lastName: 'Sultanov', phone: '+998903334400', status: 'active', balance: 1120000, coins: 225, groupName: 'UI/UX Design', mentorName: 'Malika Sharipova', createdAt: '2026-04-05T10:00:00Z', loginCode: 'akbar12' },
        ];
        localStorage.setItem('mock_admin_students', JSON.stringify(students));
      }
      return { students, total: students.length };
    }

    if (path === '/admin/students' && method === 'POST') {
      const students = JSON.parse(localStorage.getItem('mock_admin_students') || '[]');
      const newStudent = {
        id: `st-${Date.now()}`,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone || '',
        status: 'active',
        balance: 0,
        coins: 0,
        groupName: body.groupName || '',
        mentorName: body.mentorName || '',
        createdAt: new Date().toISOString(),
        loginCode: `user${Math.floor(1000 + Math.random() * 9000)}`,
      };
      students.push(newStudent);
      localStorage.setItem('mock_admin_students', JSON.stringify(students));
      return { student: newStudent };
    }

    if (path.match(/^\/admin\/students\/([^/]+)$/) && method === 'GET') {
      const id = path.split('/')[3];
      const students = JSON.parse(localStorage.getItem('mock_admin_students') || '[]');
      const student = students.find(s => s.id === id);
      if (!student) { const err = new Error('Талаба не найден'); err.status = 404; throw err; }
      return {
        student: {
          ...student,
          groups: [{ id: 'g1', name: student.groupName, subject: 'Frontend' }],
          payments: [
            { id: 'p1', amount: 850000, date: '2026-06-01T10:00:00Z', type: 'cash', status: 'paid' },
            { id: 'p2', amount: 500000, date: '2026-05-01T10:00:00Z', type: 'card', status: 'paid' },
          ],
        },
      };
    }

    if (path.match(/^\/admin\/students\/([^/]+)$/) && method === 'PATCH') {
      const id = path.split('/')[3];
      const students = JSON.parse(localStorage.getItem('mock_admin_students') || '[]');
      const idx = students.findIndex(s => s.id === id);
      if (idx === -1) { const err = new Error('Талаба не найден'); err.status = 404; throw err; }
      students[idx] = { ...students[idx], ...body };
      localStorage.setItem('mock_admin_students', JSON.stringify(students));
      return { student: students[idx] };
    }

    if (path.match(/^\/admin\/students\/([^/]+)$/) && method === 'DELETE') {
      const id = path.split('/')[3];
      let students = JSON.parse(localStorage.getItem('mock_admin_students') || '[]');
      students = students.filter(s => s.id !== id);
      localStorage.setItem('mock_admin_students', JSON.stringify(students));
      return { success: true };
    }

    if (path.match(/^\/admin\/students\/([^/]+)\/freeze$/)) {
      const id = path.split('/')[3];
      const students = JSON.parse(localStorage.getItem('mock_admin_students') || '[]');
      const idx = students.findIndex(s => s.id === id);
      if (idx === -1) { const err = new Error('Талаба не найден'); err.status = 404; throw err; }
      students[idx].status = body.frozen ? 'frozen' : 'active';
      localStorage.setItem('mock_admin_students', JSON.stringify(students));
      return { student: students[idx] };
    }

    if (path.match(/^\/admin\/students\/([^/]+)\/regenerate-password$/)) {
      const id = path.split('/')[3];
      const students = JSON.parse(localStorage.getItem('mock_admin_students') || '[]');
      const idx = students.findIndex(s => s.id === id);
      if (idx === -1) { const err = new Error('Талаба не найден'); err.status = 404; throw err; }
      students[idx].loginCode = `new${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('mock_admin_students', JSON.stringify(students));
      return { success: true, loginCode: students[idx].loginCode };
    }

    // -------- ADMIN: Groups --------
    if (path === '/admin/groups' && method === 'GET') {
      let groups = JSON.parse(localStorage.getItem('mock_admin_groups') || '[]');
      if (groups.length === 0) {
        groups = [
          { id: 'g1', name: 'Frontend React', subject: 'Frontend', mentorName: 'Ilhom Karimov', studentCount: 18, maxStudents: 20, schedule: 'Dush-Jum 09:00-11:00', monthlyPrice: 850000, status: 'active', createdAt: '2026-01-10T10:00:00Z' },
          { id: 'g2', name: 'Python Bootcamp', subject: 'Backend', mentorName: 'Jasur Usmanov', studentCount: 14, maxStudents: 15, schedule: 'Dush-Jum 11:00-13:00', monthlyPrice: 750000, status: 'active', createdAt: '2026-01-15T10:00:00Z' },
          { id: 'g3', name: 'UI/UX Design', subject: 'Design', mentorName: 'Malika Sharipova', studentCount: 12, maxStudents: 15, schedule: 'Sesh-Pay 14:00-16:00', monthlyPrice: 700000, status: 'active', createdAt: '2026-02-01T10:00:00Z' },
          { id: 'g4', name: 'Backend Node.js', subject: 'Backend', mentorName: 'Sardor Rakhimov', studentCount: 16, maxStudents: 20, schedule: 'Dush-Jum 14:00-16:00', monthlyPrice: 900000, status: 'active', createdAt: '2026-02-10T10:00:00Z' },
          { id: 'g5', name: 'Mobile Flutter', subject: 'Mobile', mentorName: 'Ilhom Karimov', studentCount: 10, maxStudents: 15, schedule: 'Sesh-Shan 10:00-12:00', monthlyPrice: 800000, status: 'active', createdAt: '2026-03-01T10:00:00Z' },
          { id: 'g6', name: 'English Basic', subject: 'Language', mentorName: 'Dilnoza Karimova', studentCount: 20, maxStudents: 20, schedule: 'Dush-Jum 09:00-10:30', monthlyPrice: 500000, status: 'archived', createdAt: '2026-01-20T10:00:00Z' },
        ];
        localStorage.setItem('mock_admin_groups', JSON.stringify(groups));
      }
      return { groups, total: groups.length };
    }

    if (path === '/admin/groups' && method === 'POST') {
      const groups = JSON.parse(localStorage.getItem('mock_admin_groups') || '[]');
      const newGroup = {
        id: `g-${Date.now()}`,
        name: body.name,
        subject: body.subject || '',
        mentorName: body.mentorName || '',
        studentCount: 0,
        maxStudents: body.maxStudents || 15,
        schedule: body.schedule || '',
        monthlyPrice: body.monthlyPrice || 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      groups.push(newGroup);
      localStorage.setItem('mock_admin_groups', JSON.stringify(groups));
      return { group: newGroup };
    }

    if (path.match(/^\/admin\/groups\/([^/]+)$/) && method === 'GET') {
      const id = path.split('/')[3];
      const groups = JSON.parse(localStorage.getItem('mock_admin_groups') || '[]');
      const group = groups.find(g => g.id === id);
      if (!group) { const err = new Error('Группа не найдена'); err.status = 404; throw err; }
      return {
        group: {
          ...group,
          students: [
            { id: 'st-1', firstName: 'Sardor', lastName: 'O\'zbekov', phone: '+998901112233' },
            { id: 'st-3', firstName: 'Botir', lastName: 'Hasanov', phone: '+998903334455' },
            { id: 'st-6', firstName: 'Dilshod', lastName: 'Tursunov', phone: '+998906667788' },
          ],
        },
      };
    }

    if (path.match(/^\/admin\/groups\/([^/]+)$/) && method === 'PATCH') {
      const id = path.split('/')[3];
      const groups = JSON.parse(localStorage.getItem('mock_admin_groups') || '[]');
      const idx = groups.findIndex(g => g.id === id);
      if (idx === -1) { const err = new Error('Группа не найдена'); err.status = 404; throw err; }
      groups[idx] = { ...groups[idx], ...body };
      localStorage.setItem('mock_admin_groups', JSON.stringify(groups));
      return { group: groups[idx] };
    }

    if (path.match(/^\/admin\/groups\/([^/]+)\/archive$/) && method === 'POST') {
      const id = path.split('/')[3];
      const groups = JSON.parse(localStorage.getItem('mock_admin_groups') || '[]');
      const idx = groups.findIndex(g => g.id === id);
      if (idx === -1) { const err = new Error('Группа не найдена'); err.status = 404; throw err; }
      groups[idx].status = 'archived';
      localStorage.setItem('mock_admin_groups', JSON.stringify(groups));
      return { group: groups[idx] };
    }

    if (path.match(/^\/admin\/groups\/([^/]+)\/unarchive$/) && method === 'POST') {
      const id = path.split('/')[3];
      const groups = JSON.parse(localStorage.getItem('mock_admin_groups') || '[]');
      const idx = groups.findIndex(g => g.id === id);
      if (idx === -1) { const err = new Error('Группа не найдена'); err.status = 404; throw err; }
      groups[idx].status = 'active';
      localStorage.setItem('mock_admin_groups', JSON.stringify(groups));
      return { group: groups[idx] };
    }

    if (path.match(/^\/admin\/groups\/([^/]+)\/students$/) && method === 'POST') {
      return { success: true };
    }

    if (path.match(/^\/admin\/groups\/([^/]+)\/students\/([^/]+)$/) && method === 'DELETE') {
      return { success: true };
    }

    // -------- ADMIN: Mentors --------
    if (path === '/admin/mentors' && method === 'GET') {
      let mentors = JSON.parse(localStorage.getItem('mock_admin_mentors') || '[]');
      if (mentors.length === 0) {
        mentors = [
          { id: 'm1', firstName: 'Ilhom', lastName: 'Karimov', email: 'ilhom@levelup.local', phone: '+998901112233', status: 'active', groups: ['Frontend React', 'Mobile Flutter'], salary: 3500000, createdAt: '2026-01-05T10:00:00Z' },
          { id: 'm2', firstName: 'Jasur', lastName: 'Usmanov', email: 'jasur@levelup.local', phone: '+998902223344', status: 'active', groups: ['Python Bootcamp'], salary: 3000000, createdAt: '2026-01-10T10:00:00Z' },
          { id: 'm3', firstName: 'Malika', lastName: 'Sharipova', email: 'malika@levelup.local', phone: '+998903334455', status: 'active', groups: ['UI/UX Design'], salary: 3200000, createdAt: '2026-02-01T10:00:00Z' },
          { id: 'm4', firstName: 'Sardor', lastName: 'Rakhimov', email: 'sardor@levelup.local', phone: '+998904445566', status: 'active', groups: ['Backend Node.js'], salary: 3400000, createdAt: '2026-02-10T10:00:00Z' },
          { id: 'm5', firstName: 'Dilnoza', lastName: 'Karimova', email: 'dilnoza@levelup.local', phone: '+998905556677', status: 'frozen', groups: ['English Basic'], salary: 2800000, createdAt: '2026-03-01T10:00:00Z' },
        ];
        localStorage.setItem('mock_admin_mentors', JSON.stringify(mentors));
      }
      return { mentors, total: mentors.length };
    }

    if (path === '/admin/mentors' && method === 'POST') {
      const mentors = JSON.parse(localStorage.getItem('mock_admin_mentors') || '[]');
      const newMentor = {
        id: `m-${Date.now()}`,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email || '',
        phone: body.phone || '',
        status: 'active',
        groups: [],
        salary: body.salary || 0,
        createdAt: new Date().toISOString(),
      };
      mentors.push(newMentor);
      localStorage.setItem('mock_admin_mentors', JSON.stringify(mentors));
      return { mentor: newMentor };
    }

    if (path.match(/^\/admin\/mentors\/([^/]+)$/) && method === 'PATCH') {
      const id = path.split('/')[3];
      const mentors = JSON.parse(localStorage.getItem('mock_admin_mentors') || '[]');
      const idx = mentors.findIndex(m => m.id === id);
      if (idx === -1) { const err = new Error('Ментор не найден'); err.status = 404; throw err; }
      mentors[idx] = { ...mentors[idx], ...body };
      localStorage.setItem('mock_admin_mentors', JSON.stringify(mentors));
      return { mentor: mentors[idx] };
    }

    if (path.match(/^\/admin\/mentors\/([^/]+)$/) && method === 'DELETE') {
      const id = path.split('/')[3];
      let mentors = JSON.parse(localStorage.getItem('mock_admin_mentors') || '[]');
      mentors = mentors.filter(m => m.id !== id);
      localStorage.setItem('mock_admin_mentors', JSON.stringify(mentors));
      return { success: true };
    }

    if (path.match(/^\/admin\/mentors\/([^/]+)\/freeze$/)) {
      const id = path.split('/')[3];
      const mentors = JSON.parse(localStorage.getItem('mock_admin_mentors') || '[]');
      const idx = mentors.findIndex(m => m.id === id);
      if (idx === -1) { const err = new Error('Ментор не найден'); err.status = 404; throw err; }
      mentors[idx].status = body.frozen ? 'frozen' : 'active';
      localStorage.setItem('mock_admin_mentors', JSON.stringify(mentors));
      return { mentor: mentors[idx] };
    }

    // -------- ADMIN: Expenses --------
    if (path === '/admin/expenses' && method === 'GET') {
      let expenses = JSON.parse(localStorage.getItem('mock_admin_expenses') || '[]');
      if (expenses.length === 0) {
        expenses = [
          { id: 'e1', category: 'Ofis jihozlari', description: 'Kompyuter monitori', amount: 3200000, date: '2026-06-10T10:00:00Z', status: 'approved', createdBy: 'Demo Admin' },
          { id: 'e2', category: 'Kommunal', description: 'Elektr energiyasi', amount: 450000, date: '2026-06-05T10:00:00Z', status: 'approved', createdBy: 'Demo Admin' },
          { id: 'e3', category: 'O\'qituvchi maoshi', description: 'Ilhom Karimov — iyun', amount: 3500000, date: '2026-06-01T10:00:00Z', status: 'approved', createdBy: 'Demo Admin' },
          { id: 'e4', category: 'Reklama', description: 'Instagram reklama', amount: 800000, date: '2026-06-15T10:00:00Z', status: 'pending', createdBy: 'Demo Admin' },
          { id: 'e5', category: 'Ovqat', description: 'O\'quvchilar uchun çay', amount: 120000, date: '2026-06-12T10:00:00Z', status: 'approved', createdBy: 'Demo Admin' },
        ];
        localStorage.setItem('mock_admin_expenses', JSON.stringify(expenses));
      }
      return { expenses, total: expenses.length };
    }

    if (path === '/admin/expenses' && method === 'POST') {
      const expenses = JSON.parse(localStorage.getItem('mock_admin_expenses') || '[]');
      const newExpense = {
        id: `e-${Date.now()}`,
        category: body.category,
        description: body.description || '',
        amount: body.amount,
        date: new Date().toISOString(),
        status: 'pending',
        createdBy: 'Demo Admin',
      };
      expenses.push(newExpense);
      localStorage.setItem('mock_admin_expenses', JSON.stringify(expenses));
      return { expense: newExpense };
    }

    if (path.match(/^\/admin\/expenses\/([^/]+)$/) && method === 'DELETE') {
      const id = path.split('/')[3];
      let expenses = JSON.parse(localStorage.getItem('mock_admin_expenses') || '[]');
      expenses = expenses.filter(e => e.id !== id);
      localStorage.setItem('mock_admin_expenses', JSON.stringify(expenses));
      return { success: true };
    }

    // -------- ADMIN: Payments/Invoices --------
    if (path === '/admin/payments/invoices' && method === 'GET') {
      let invoices = JSON.parse(localStorage.getItem('mock_admin_invoices') || '[]');
      if (invoices.length === 0) {
        invoices = [
          { id: 'inv-1', studentName: 'Sardor O\'zbekov', groupName: 'Frontend React', amount: 850000, paidAmount: 850000, status: 'paid', dueDate: '2026-06-01T00:00:00Z', paidAt: '2026-06-01T10:00:00Z', paymentMethod: 'cash' },
          { id: 'inv-2', studentName: 'Nilufar Karimova', groupName: 'Python Bootcamp', amount: 750000, paidAmount: 0, status: 'pending', dueDate: '2026-07-01T00:00:00Z', paidAt: null, paymentMethod: null },
          { id: 'inv-3', studentName: 'Botir Hasanov', groupName: 'Frontend React', amount: 850000, paidAmount: 500000, status: 'partial', dueDate: '2026-07-01T00:00:00Z', paidAt: '2026-06-28T14:00:00Z', paymentMethod: 'card' },
          { id: 'inv-4', studentName: 'Gulnora Rahimova', groupName: 'Python Bootcamp', amount: 750000, paidAmount: 750000, status: 'paid', dueDate: '2026-06-01T00:00:00Z', paidAt: '2026-05-30T11:00:00Z', paymentMethod: 'cash' },
          { id: 'inv-5', studentName: 'Javlon Abdullayev', groupName: 'UI/UX Design', amount: 700000, paidAmount: 0, status: 'overdue', dueDate: '2026-06-01T00:00:00Z', paidAt: null, paymentMethod: null },
          { id: 'inv-6', studentName: 'Dilshod Tursunov', groupName: 'Frontend React', amount: 850000, paidAmount: 850000, status: 'paid', dueDate: '2026-07-01T00:00:00Z', paidAt: '2026-06-29T09:00:00Z', paymentMethod: 'card' },
        ];
        localStorage.setItem('mock_admin_invoices', JSON.stringify(invoices));
      }
      return { invoices, total: invoices.length };
    }

    if (path.match(/^\/admin\/payments\/invoices\/([^/]+)\/pay$/) && method === 'POST') {
      const id = path.split('/')[4];
      const invoices = JSON.parse(localStorage.getItem('mock_admin_invoices') || '[]');
      const idx = invoices.findIndex(i => i.id === id);
      if (idx === -1) { const err = new Error('Invoice не найден'); err.status = 404; throw err; }
      invoices[idx].paidAmount += body.amount || 0;
      invoices[idx].status = invoices[idx].paidAmount >= invoices[idx].amount ? 'paid' : 'partial';
      invoices[idx].paidAt = new Date().toISOString();
      invoices[idx].paymentMethod = body.method || 'cash';
      localStorage.setItem('mock_admin_invoices', JSON.stringify(invoices));
      return { invoice: invoices[idx] };
    }

    if (path.match(/^\/admin\/payments\/transactions\/([^/]+)\/refund$/) && method === 'POST') {
      return { success: true, message: 'Возврат выполнен' };
    }

    if (path.match(/^\/admin\/payments\/transactions\/([^/]+)\/void$/) && method === 'POST') {
      return { success: true, message: 'Транзакция аннулирована' };
    }

    // -------- ADMIN: Reports --------
    if (path === '/admin/reports' && method === 'GET') {
      return {
        revenue: {
          total: 42500000,
          thisMonth: 6800000,
          lastMonth: 5900000,
          currency: 'UZS',
        },
        groups: [
          { name: 'Frontend React', students: 18, revenue: 15300000 },
          { name: 'Python Bootcamp', students: 14, revenue: 10500000 },
          { name: 'UI/UX Design', students: 12, revenue: 8400000 },
          { name: 'Backend Node.js', students: 16, revenue: 14400000 },
          { name: 'Mobile Flutter', students: 10, revenue: 8000000 },
        ],
        monthly: [
          { month: 'Yanvar', revenue: 3200000 },
          { month: 'Fevral', revenue: 4100000 },
          { month: 'Mart', revenue: 5200000 },
          { month: 'Aprel', revenue: 5800000 },
          { month: 'May', revenue: 5900000 },
          { month: 'Iyun', revenue: 6800000 },
        ],
        debts: [
          { studentName: 'Javlon Abdullayev', amount: 700000, overdueDays: 45 },
          { studentName: 'Shahzoda Ismoilova', amount: 350000, overdueDays: 15 },
        ],
      };
    }

    // -------- ADMIN: Settings --------
    if (path === '/admin/settings' && method === 'GET') {
      let settings = JSON.parse(localStorage.getItem('mock_admin_settings') || 'null');
      if (!settings) {
        settings = {
          branchName: 'Downtown Academy',
          address: '123 Main St, Central District',
          phone: '+998901234567',
          email: 'admin@levelup.uz',
          currency: 'UZS',
          timezone: 'Asia/Tashkent',
          language: 'uz',
          notifications: { email: true, sms: false, telegram: true },
          theme: 'system',
        };
        localStorage.setItem('mock_admin_settings', JSON.stringify(settings));
      }
      return { settings };
    }

    if (path === '/admin/settings' && method === 'PATCH') {
      let settings = JSON.parse(localStorage.getItem('mock_admin_settings') || '{}');
      settings = { ...settings, ...body };
      localStorage.setItem('mock_admin_settings', JSON.stringify(settings));
      return { settings };
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
  // -------- AUTH (staff — admin/superadmin/mentor/methodist) --------
  loginStaff: (login, password) =>
    request('/auth/staff/login', { method: 'POST', body: { login, password } }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  googleLogin: (idToken) => request('/auth/staff/google', { method: 'POST', body: { idToken } }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body }),

  // -------- ADMIN (branch admin panel) --------
  adminDashboard: (token) => request('/admin/dashboard', { token }),
  adminSettings: (token) => request('/admin/settings', { token }),
  adminUpdateSettings: (token, body) => request('/admin/settings', { method: 'PATCH', token, body }),
  adminExpenses: (token, qs = '') => request(`/admin/expenses${qs}`, { token }),
  adminCreateExpense: (token, body) => request('/admin/expenses', { method: 'POST', token, body }),
  adminDeleteExpense: (token, id) => request(`/admin/expenses/${id}`, { method: 'DELETE', token }),
  adminStudents: (token, qs = '') => request(`/admin/students${qs}`, { token }),
  adminCreateStudent: (token, body) => request('/admin/students', { method: 'POST', token, body }),
  adminStudentDetail: (token, id) => request(`/admin/students/${id}`, { token }),
  adminUpdateStudent: (token, id, body) => request(`/admin/students/${id}`, { method: 'PATCH', token, body }),
  adminFreezeStudent: (token, id, frozen) => request(`/admin/students/${id}/freeze`, { method: 'POST', token, body: { frozen } }),
  adminDeleteStudent: (token, id) => request(`/admin/students/${id}`, { method: 'DELETE', token }),
  adminGroups: (token, qs = '') => request(`/admin/groups${qs}`, { token }),
  adminCreateGroup: (token, body) => request('/admin/groups', { method: 'POST', token, body }),
  adminGroupDetail: (token, id) => request(`/admin/groups/${id}`, { token }),
  adminUpdateGroup: (token, id, body) => request(`/admin/groups/${id}`, { method: 'PATCH', token, body }),
  adminArchiveGroup: (token, id) => request(`/admin/groups/${id}/archive`, { method: 'POST', token }),
  adminUnarchiveGroup: (token, id) => request(`/admin/groups/${id}/unarchive`, { method: 'POST', token }),
  adminMentors: (token) => request('/admin/mentors', { token }),
  adminCreateMentor: (token, body) => request('/admin/mentors', { method: 'POST', token, body }),
  adminUpdateMentor: (token, id, body) => request(`/admin/mentors/${id}`, { method: 'PATCH', token, body }),
  adminFreezeMentor: (token, id, frozen) => request(`/admin/mentors/${id}/freeze`, { method: 'POST', token, body: { frozen } }),
  adminDeleteMentor: (token, id) => request(`/admin/mentors/${id}`, { method: 'DELETE', token }),
  adminRegenStudentPassword: (token, id) => request(`/admin/students/${id}/regenerate-password`, { method: 'POST', token }),

  // -------- ADMIN: Groups — add/remove students --------
  adminAddStudentToGroup: (token, groupId, studentId) =>
    request(`/admin/groups/${groupId}/students`, { method: 'POST', token, body: { studentId } }),
  adminRemoveStudentFromGroup: (token, groupId, studentId) =>
    request(`/admin/groups/${groupId}/students/${studentId}`, { method: 'DELETE', token }),

  // -------- ADMIN: Payments (invoices) --------
  adminInvoices: (token, qs = '') => request(`/admin/payments/invoices${qs}`, { token }),
  adminPayInvoice: (token, invoiceId, body) =>
    request(`/admin/payments/invoices/${invoiceId}/pay`, { method: 'POST', token, body }),

  // -------- ADMIN: Payments (refund / void) --------
  adminRefundTransaction: (token, transactionId, body) =>
    request(`/admin/payments/transactions/${transactionId}/refund`, { method: 'POST', token, body }),
  adminVoidTransaction: (token, transactionId, body) =>
    request(`/admin/payments/transactions/${transactionId}/void`, { method: 'POST', token, body }),

  // -------- ADMIN: Reports --------
  adminReports: (token, qs = '') => request(`/admin/reports${qs}`, { token }),

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
};
