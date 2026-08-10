/* ─────────────────────────────────────────────────────────────────────────────
   Finance Manager — STATIC demo data по всей организации с разбивкой по
   филиалам. Backend-роль ещё не заведена (как у branch_manager), поэтому все
   данные хардкодятся здесь и панель работает полностью автономно.

   Инвариант: для текущего месяца суммы транзакций INCOME/EXPENSES/SALARIES
   каждого филиала должны совпадать с серией SERIES[<branchId>] того же месяца,
   иначе цифры на дашборде и в таблицах разойдутся.
   ────────────────────────────────────────────────────────────────────────── */

export const ORG = {
  name: 'LevelUp Academy',
  city: 'Toshkent',
};

/* ── Налоговые ставки (Узбекистан) ── */
export const TAX = {
  ndss: 0.20,       // НДС
  soc_nalog: 0.10,  // Соцналог
  otzyvnoy_nalog: 0.015, // Оборотный налог
};

/* ── Профиль Finance Manager (демо-данные, редактируется локально) ── */
export const PROFILE = {
  firstName: 'Jamshid',
  lastName: 'Nazarov',
  role: 'Finance Manager',
  email: 'finance.manager@gmail.com',
  phone: '+998 90 555-77-88',
  city: 'Toshkent',
};

export const BRANCHES = [
  { id: 'downtown',   name: 'Downtown Academy', address: "Toshkent sh., Amir Temur ko'chasi 108", phone: '+998 90 123-45-67', students: 450, groups: 12, staff: 9,  isMain: true },
  { id: 'chilanzar',  name: 'Chilanzar Campus',  address: 'Toshkent sh., Chilanzar 9-kvartal 12',    phone: '+998 90 234-56-78', students: 310, groups: 8,  staff: 6,  isMain: false },
  { id: 'yunusabad',  name: 'Yunusabad Campus',  address: 'Toshkent sh., Yunusobod 12-mavze 5',     phone: '+998 90 345-67-89', students: 230, groups: 6,  staff: 4,  isMain: false },
];

export const MONTHS = [
  { key: '2026-03', label: 'Mart' },
  { key: '2026-04', label: 'Aprel' },
  { key: '2026-05', label: 'May' },
  { key: '2026-06', label: 'Iyun' },
  { key: '2026-07', label: 'Iyul' },
  { key: '2026-08', label: 'Avgust' },
];

export const CURRENT_MONTH = MONTHS[MONTHS.length - 1].key;

export const MONTH_LABEL = Object.fromEntries(MONTHS.map((m) => [m.key, m.label]));

/* Помесячные income / expenses / salaries по каждому филиалу. */
export const SERIES = {
  downtown: [
    { monthKey: '2026-03', income: 4200000, expenses: 1100000, salaries: 3100000 },
    { monthKey: '2026-04', income: 5100000, expenses: 1400000, salaries: 3400000 },
    { monthKey: '2026-05', income: 4800000, expenses: 1300000, salaries: 3400000 },
    { monthKey: '2026-06', income: 6000000, expenses: 1600000, salaries: 3900000 },
    { monthKey: '2026-07', income: 5600000, expenses: 1500000, salaries: 3900000 },
    { monthKey: '2026-08', income: 6800000, expenses: 1500000, salaries: 4200000 },
  ],
  chilanzar: [
    { monthKey: '2026-03', income: 2800000, expenses: 900000,  salaries: 2000000 },
    { monthKey: '2026-04', income: 3400000, expenses: 1100000, salaries: 2200000 },
    { monthKey: '2026-05', income: 3600000, expenses: 1000000, salaries: 2300000 },
    { monthKey: '2026-06', income: 4100000, expenses: 1200000, salaries: 2500000 },
    { monthKey: '2026-07', income: 3900000, expenses: 1100000, salaries: 2600000 },
    { monthKey: '2026-08', income: 4600000, expenses: 1300000, salaries: 2800000 },
  ],
  yunusabad: [
    { monthKey: '2026-03', income: 1900000, expenses: 700000,  salaries: 1300000 },
    { monthKey: '2026-04', income: 2300000, expenses: 800000,  salaries: 1500000 },
    { monthKey: '2026-05', income: 2500000, expenses: 800000,  salaries: 1500000 },
    { monthKey: '2026-06', income: 3000000, expenses: 1000000, salaries: 1800000 },
    { monthKey: '2026-07', income: 3200000, expenses: 900000,  salaries: 1900000 },
    { monthKey: '2026-08', income: 3700000, expenses: 1100000, salaries: 2100000 },
  ],
};

export const branchSeries = (id) => SERIES[id] ?? [];

export const monthRow = (id, monthKey) =>
  branchSeries(id).find((r) => r.monthKey === monthKey);

/* ── Расчёт налогов по данным филиала ──
   return { ndss, soc_nalog, otzyvnoy_nalog, total } */
export function taxCalc(row, branch) {
  const income  = row.income;
  const expenses = row.expenses;
  const salaries = row.salaries;
  const profit  = income - expenses - salaries;
  const net     = income - expenses - salaries; // чистая прибыль (до налогов)
  return {
    ndss:          income * TAX.ndss,
    soc_nalog:     (income - expenses) * TAX.soc_nalog,
    otzyvnoy_nalog: Math.max(0, net) * TAX.otzyvnoy_nalog,
    total:         income * TAX.ndss + (income - expenses) * TAX.soc_nalog + Math.max(0, net) * TAX.otzyvnoy_nalog,
    profit,
    net,
    branch,
  };
}

/* ── Статусы платежей ── */
export const PAYMENT_STATUS = {
  paid:    { label: "To'langan",       cls: 'badge-success' },
  pending: { label: 'Qisman to\u2018langan', cls: 'badge-warning' },
  overdue: { label: "Muddati o'tgan",  cls: 'badge-error' },
};

/* ── Доходы текущего месяца по филиалам (суммы = серия 2026-08) ── */
export const INCOME = {
  downtown: [
    { id: 'p1',  date: '2026-08-03', student: "O'zbekov Sardor",   group: 'Frontend React',   amount: 850000,  method: 'Karta', status: 'paid' },
    { id: 'p2',  date: '2026-08-03', student: 'Karimova Nilufar',   group: 'Python Bootcamp', amount: 900000,  method: 'Naqd',  status: 'paid' },
    { id: 'p3',  date: '2026-08-02', student: 'Hasanov Botir',     group: 'Frontend React',   amount: 850000,  method: 'Karta', status: 'pending' },
    { id: 'p4',  date: '2026-08-02', student: 'Rahimova Gulnora',   group: 'Python Bootcamp', amount: 450000,  method: 'Naqd',  status: 'paid' },
    { id: 'p5',  date: '2026-08-01', student: 'Abdullayev Javlon',  group: 'UI/UX Design',    amount: 800000,  method: 'Karta', status: 'paid' },
    { id: 'p6',  date: '2026-08-01', student: 'Tursunov Dilshod',   group: 'Frontend React',  amount: 850000,  method: 'Naqd',  status: 'overdue' },
    { id: 'p7',  date: '2026-07-31', student: 'Nazarova Malika',    group: 'IELTS Intensive', amount: 1200000, method: 'Karta', status: 'paid' },
    { id: 'p8',  date: '2026-07-30', student: 'Aliyev Bekzod',      group: 'English A2',      amount: 900000,  method: 'Naqd',  status: 'paid' },
  ],
  chilanzar: [
    { id: 'c1', date: '2026-08-04', student: 'Yuldashev Otabek',    group: 'Python Bootcamp', amount: 950000, method: 'Karta', status: 'paid' },
    { id: 'c2', date: '2026-08-04', student: 'Raxmonova Dildora',   group: 'English A2',      amount: 800000, method: 'Naqd',  status: 'paid' },
    { id: 'c3', date: '2026-08-03', student: 'Toshpulatov Sardor',  group: 'Frontend React',  amount: 900000, method: 'Karta', status: 'paid' },
    { id: 'c4', date: '2026-08-02', student: 'Murodova Dilafruz',   group: 'IELTS Intensive', amount: 950000, method: 'Karta', status: 'pending' },
    { id: 'c5', date: '2026-08-02', student: 'Xakimov Shohruh',     group: 'English B1',      amount: 1000000, method: 'Naqd', status: 'paid' },
  ],
  yunusabad: [
    { id: 'y1', date: '2026-08-04', student: 'Abdurahmonova Zilola', group: 'Speaking Club', amount: 700000, method: 'Karta', status: 'paid' },
    { id: 'y2', date: '2026-08-03', student: 'Erkinov Farrux',       group: 'Python Bootcamp', amount: 800000, method: 'Naqd', status: 'paid' },
    { id: 'y3', date: '2026-08-02', student: 'Saidova Malika',       group: 'IELTS Intensive', amount: 850000, method: 'Karta', status: 'paid' },
    { id: 'y4', date: '2026-08-01', student: 'Yusupov Jasur',        group: 'Frontend React', amount: 850000, method: 'Naqd', status: 'paid' },
    { id: 'y5', date: '2026-08-01', student: 'Karimov Davron',       group: 'English A2',     amount: 500000, method: 'Karta', status: 'pending' },
  ],
};

export const EXPENSE_CATEGORIES = [
  'Ijara', 'Oylik', 'Reklama', 'Kommunal', 'Jihozlar', 'Kanselyariya',
];

export const EXPENSES = {
  downtown: [
    { id: 'e1', date: '2026-08-04', category: 'Jihozlar', amount: 250000, note: '3 ta klaviatura + sichqoncha' },
    { id: 'e2', date: '2026-08-01', category: 'Oylik',    amount: 800000, note: 'Tozalash xodimi avans' },
    { id: 'e3', date: '2026-07-30', category: 'Kommunal', amount: 450000, note: 'Elektr + suv, iyul' },
  ],
  chilanzar: [
    { id: 'ce1', date: '2026-08-05', category: 'Kanselyariya', amount: 300000, note: 'Daftar, ruchka, qog\u2018oz' },
    { id: 'ce2', date: '2026-08-02', category: 'Reklama',      amount: 400000, note: 'Instagram kampaniya' },
    { id: 'ce3', date: '2026-07-30', category: 'Kommunal',     amount: 600000, note: 'Elektr + suv, iyul' },
  ],
  yunusabad: [
    { id: 'ye1', date: '2026-08-03', category: 'Ijara',   amount: 700000, note: 'Avgust oyi ijarasi' },
    { id: 'ye2', date: '2026-08-01', category: 'Oylik',   amount: 400000, note: 'Tozalash xodimi avans' },
  ],
};

/* ── Зарплатная ведомость текущего месяца (суммы = серия 2026-08) ── */
export const SALARIES = {
  downtown: [
    { id: 's1', name: 'Umarov Baxtiyor',  position: 'Branch manager', amount: 2000000 },
    { id: 's2', name: 'Karimov Shoxrux',  position: 'Mentor',         amount: 800000 },
    { id: 's3', name: 'Raximova Feruza',  position: 'Mentor',         amount: 700000 },
    { id: 's4', name: 'Nazarov Jamshid',  position: 'Mentor',         amount: 700000 },
  ],
  chilanzar: [
    { id: 'cs1', name: 'Xodjayev Aziz',   position: 'Branch manager', amount: 1400000 },
    { id: 'cs2', name: 'Tursunova Nozima', position: 'Mentor',        amount: 700000 },
    { id: 'cs3', name: 'Qodirov Sanjar',  position: 'Mentor',         amount: 700000 },
  ],
  yunusabad: [
    { id: 'ys1', name: 'Sattorov Ilhom',    position: 'Branch manager', amount: 1100000 },
    { id: 'ys2', name: 'Mirzayeva Gulbahor', position: 'Mentor',        amount: 1000000 },
  ],
};

/* ── Агрегированные ряды по организации и по филиалу ── */
export const orgSeries = (branchId = null) =>
  MONTHS.map((m) => {
    const rows = branchId
      ? [monthRow(branchId, m.key)].filter(Boolean)
      : BRANCHES.map((b) => monthRow(b.id, m.key));
    const sum = (k) => rows.reduce((acc, r) => acc + r[k], 0);
    return { monthKey: m.key, label: m.label, income: sum('income'), expenses: sum('expenses'), salaries: sum('salaries'), profit: sum('income') - sum('expenses') };
  });
