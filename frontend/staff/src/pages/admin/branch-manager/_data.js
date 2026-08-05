/* ─────────────────────────────────────────────────────────────────────────────
   Branch Manager — STATIC demo data.
   Backendda branch_manager roli hali yo'q (backendga tegish yomon), shuning
   uchun hamma ma'lumotlar shu yerda, fayl ichida hardcode qilingan. API chaqiruvi
   yo'q — panel to'liq mustaqil ishlaydi. Keyinchalik backend tayyor bo'lgach,
   bu array'lar react-query hook'lariga almashtiriladi.

   Muhim: har oy uchun PAYMENTS yig'indisi MONTHS[].income ga, EXPENSES
   yig'indisi MONTHS[].expenses ga TENG — aks holda dashboard va daromad/
   xarajat sahifalaridagi raqamlar bir-biriga mos kelmay qoladi.
   ────────────────────────────────────────────────────────────────────────── */

export const BRANCH = {
  id: 'downtown-branch-uuid-1111',
  name: 'Downtown Academy',
  isMain: true,
  address: "Toshkent sh., Amir Temur ko'chasi 108",
  phone: '+998 90 123-45-67',
  email: 'downtown@levelup.uz',
  telegram: '@downtown_levelup',
  workHours: 'Dush–Shan · 9:00–21:00',
  founded: 'Yanvar 2026',
  coords: '41.3111° N, 69.2797° E',
  mapUrl: 'https://yandex.uz/maps/?text=41.3111,69.2797',
  manager: { firstName: 'Baxtiyor', lastName: 'Umarov', phone: '+998 90 765-43-21' },
  stats: { students: 450, groups: 12, staff: 9, debt: 3400000 },
};

/* 6 oylik moliyaviy seriya — dashboard, income/expenses chart va reports uchun. */
export const MONTHS = [
  { key: '2026-03', label: 'Mart',   income: 4200000, expenses: 1100000, payments: 4 },
  { key: '2026-04', label: 'Aprel',  income: 5100000, expenses: 1400000, payments: 5 },
  { key: '2026-05', label: 'May',    income: 4800000, expenses: 1300000, payments: 6 },
  { key: '2026-06', label: 'Iyun',   income: 6000000, expenses: 1600000, payments: 7 },
  { key: '2026-07', label: 'Iyul',   income: 5600000, expenses: 1500000, payments: 7 },
  { key: '2026-08', label: 'Avgust', income: 6800000, expenses: 1500000, payments: 8 },
];

export const CURRENT_MONTH = MONTHS[MONTHS.length - 1].key;

export const PAYMENT_STATUS = {
  paid: { label: "To'langan", cls: 'badge-success' },
  pending: { label: 'Qisman', cls: 'badge-warning' },
  overdue: { label: "Muddati o'tgan", cls: 'badge-error' },
};

export const PAYMENTS = [
  // ── Avgust (6 800 000) ──
  { id: 'p1',  monthKey: '2026-08', date: '2026-08-03', student: "O'zbekov Sardor",   group: 'Frontend React',  amount: 850000, method: 'Karta', status: 'paid' },
  { id: 'p2',  monthKey: '2026-08', date: '2026-08-03', student: 'Karimova Nilufar',   group: 'Python Bootcamp', amount: 900000, method: 'Naqd',  status: 'paid' },
  { id: 'p3',  monthKey: '2026-08', date: '2026-08-02', student: 'Hasanov Botir',     group: 'Frontend React',  amount: 850000, method: 'Karta', status: 'pending' },
  { id: 'p4',  monthKey: '2026-08', date: '2026-08-02', student: 'Rahimova Gulnora',   group: 'Python Bootcamp', amount: 450000, method: 'Naqd',  status: 'paid' },
  { id: 'p5',  monthKey: '2026-08', date: '2026-08-01', student: 'Abdullayev Javlon',  group: 'UI/UX Design',    amount: 800000, method: 'Karta', status: 'paid' },
  { id: 'p6',  monthKey: '2026-08', date: '2026-08-01', student: 'Tursunov Dilshod',   group: 'Frontend React',  amount: 850000, method: 'Naqd',  status: 'overdue' },
  { id: 'p7',  monthKey: '2026-08', date: '2026-07-31', student: 'Nazarova Malika',    group: 'IELTS Intensive', amount: 1200000, method: 'Karta', status: 'paid' },
  { id: 'p8',  monthKey: '2026-08', date: '2026-07-30', student: 'Aliyev Bekzod',      group: 'English A2',      amount: 900000, method: 'Naqd',  status: 'paid' },
  // ── Iyul (5 600 000) ──
  { id: 'p9',  monthKey: '2026-07', date: '2026-07-28', student: 'Nazarova Malika',    group: 'UI/UX Design',    amount: 800000, method: 'Karta', status: 'paid' },
  { id: 'p10', monthKey: '2026-07', date: '2026-07-25', student: "O'zbekov Sardor",    group: 'Frontend React',  amount: 850000, method: 'Karta', status: 'paid' },
  { id: 'p11', monthKey: '2026-07', date: '2026-07-22', student: 'Yusupova Aziza',     group: 'IELTS Intensive', amount: 950000, method: 'Naqd',  status: 'pending' },
  { id: 'p12', monthKey: '2026-07', date: '2026-07-20', student: 'Aliyev Bekzod',      group: 'English B1',      amount: 750000, method: 'Karta', status: 'paid' },
  { id: 'p13', monthKey: '2026-07', date: '2026-07-18', student: 'Toshmatov Jasur',    group: 'Frontend React',  amount: 850000, method: 'Naqd',  status: 'overdue' },
  { id: 'p14', monthKey: '2026-07', date: '2026-07-15', student: 'Sattorova Kamola',   group: 'English A2',      amount: 750000, method: 'Karta', status: 'paid' },
  { id: 'p15', monthKey: '2026-07', date: '2026-07-12', student: 'Ismoilova Dilnoza',  group: 'Speaking Club',  amount: 650000, method: 'Naqd',  status: 'paid' },
  // ── Iyun (6 000 000) ──
  { id: 'p16', monthKey: '2026-06', date: '2026-06-27', student: 'Ismoilova Dilnoza',  group: 'English A2',      amount: 700000, method: 'Karta', status: 'paid' },
  { id: 'p17', monthKey: '2026-06', date: '2026-06-24', student: 'Mirzayev Temur',     group: 'Python Bootcamp', amount: 900000, method: 'Karta', status: 'paid' },
  { id: 'p18', monthKey: '2026-06', date: '2026-06-20', student: 'Qodirova Shahzoda',  group: 'IELTS Intensive', amount: 950000, method: 'Naqd',  status: 'pending' },
  { id: 'p19', monthKey: '2026-06', date: '2026-06-15', student: 'Sattorova Kamola',   group: 'English B1',      amount: 750000, method: 'Karta', status: 'paid' },
  { id: 'p20', monthKey: '2026-06', date: '2026-06-10', student: 'Ergashev Doston',    group: 'Frontend React',  amount: 850000, method: 'Naqd',  status: 'paid' },
  { id: 'p21', monthKey: '2026-06', date: '2026-06-05', student: 'Xolmatov Ulugbek',   group: 'Python Bootcamp', amount: 900000, method: 'Karta', status: 'overdue' },
  { id: 'p22', monthKey: '2026-06', date: '2026-06-02', student: 'Yusupova Aziza',     group: 'IELTS Intensive', amount: 950000, method: 'Karta', status: 'paid' },
  // ── May (4 800 000) ──
  { id: 'p23', monthKey: '2026-05', date: '2026-05-26', student: 'Karimova Nilufar',   group: 'Python Bootcamp', amount: 900000, method: 'Karta', status: 'paid' },
  { id: 'p24', monthKey: '2026-05', date: '2026-05-20', student: 'Yusupova Aziza',     group: 'IELTS Intensive', amount: 950000, method: 'Naqd',  status: 'paid' },
  { id: 'p25', monthKey: '2026-05', date: '2026-05-12', student: 'Aliyev Bekzod',      group: 'English B1',      amount: 750000, method: 'Karta', status: 'pending' },
  { id: 'p26', monthKey: '2026-05', date: '2026-05-08', student: 'Rahimova Gulnora',   group: 'Python Bootcamp', amount: 450000, method: 'Naqd',  status: 'paid' },
  { id: 'p27', monthKey: '2026-05', date: '2026-05-05', student: 'Toshmatov Jasur',    group: 'Frontend React',  amount: 900000, method: 'Karta', status: 'paid' },
  { id: 'p28', monthKey: '2026-05', date: '2026-05-03', student: 'Karimova Nilufar',   group: 'Frontend React',  amount: 850000, method: 'Naqd',  status: 'paid' },
  // ── Aprel (5 100 000) ──
  { id: 'p29', monthKey: '2026-04', date: '2026-04-25', student: 'Mirzayev Temur',     group: 'Frontend React',  amount: 1100000, method: 'Karta', status: 'paid' },
  { id: 'p30', monthKey: '2026-04', date: '2026-04-20', student: 'Qodirova Shahzoda',  group: 'Python Bootcamp', amount: 1100000, method: 'Naqd',  status: 'paid' },
  { id: 'p31', monthKey: '2026-04', date: '2026-04-15', student: 'Abdullayev Javlon',  group: 'UI/UX Design',    amount: 1000000, method: 'Karta', status: 'paid' },
  { id: 'p32', monthKey: '2026-04', date: '2026-04-10', student: 'Yusupova Aziza',     group: 'IELTS Intensive', amount: 1000000, method: 'Naqd',  status: 'pending' },
  { id: 'p33', monthKey: '2026-04', date: '2026-04-05', student: 'Aliyev Bekzod',      group: 'English A2',      amount: 900000, method: 'Karta', status: 'paid' },
  // ── Mart (4 200 000) ──
  { id: 'p34', monthKey: '2026-03', date: '2026-03-28', student: 'Ergashev Doston',    group: 'Frontend React',  amount: 1200000, method: 'Karta', status: 'paid' },
  { id: 'p35', monthKey: '2026-03', date: '2026-03-22', student: 'Xolmatov Ulugbek',   group: 'Python Bootcamp', amount: 1100000, method: 'Naqd',  status: 'paid' },
  { id: 'p36', monthKey: '2026-03', date: '2026-03-15', student: 'Nazarova Malika',    group: 'IELTS Intensive', amount: 1000000, method: 'Karta', status: 'paid' },
  { id: 'p37', monthKey: '2026-03', date: '2026-03-08', student: 'Sattorova Kamola',   group: 'English B1',      amount: 900000, method: 'Naqd',  status: 'pending' },
];

export const EXPENSE_CATEGORIES = [
  'Ijara', 'Oylik', 'Reklama', 'Kommunal', 'Jihozlar', 'Kanselyariya',
];

export const EXPENSES = [
  // ── Avgust (1 500 000) ──
  { id: 'e1',  monthKey: '2026-08', date: '2026-08-04', category: 'Jihozlar',   amount: 250000, note: "3 ta klaviatura + sichqoncha" },
  { id: 'e2',  monthKey: '2026-08', date: '2026-08-01', category: 'Oylik',      amount: 800000, note: "Tozalash xodimi avans" },
  { id: 'e3',  monthKey: '2026-08', date: '2026-07-30', category: 'Kommunal',   amount: 450000, note: "Elektr + suv, iyul" },
  // ── Iyul (1 500 000) ──
  { id: 'e4',  monthKey: '2026-07', date: '2026-07-28', category: 'Reklama',    amount: 300000, note: "Instagram kampaniya" },
  { id: 'e5',  monthKey: '2026-07', date: '2026-07-22', category: 'Ijara',      amount: 1200000, note: "Iyul oyi ijarasi" },
  // ── Iyun (1 600 000) ──
  { id: 'e6',  monthKey: '2026-06', date: '2026-06-27', category: 'Jihozlar',   amount: 800000, note: "Interaktiv doska qismi" },
  { id: 'e7',  monthKey: '2026-06', date: '2026-06-20', category: 'Reklama',    amount: 500000, note: "Telegram kanal joylashuv" },
  { id: 'e8',  monthKey: '2026-06', date: '2026-06-15', category: 'Kommunal',   amount: 300000, note: "Elektr + suv, may" },
  // ── May (1 300 000) ──
  { id: 'e9',  monthKey: '2026-05', date: '2026-05-25', category: 'Oylik',      amount: 750000, note: "Mentorlar oyligi (qism)" },
  { id: 'e10', monthKey: '2026-05', date: '2026-05-18', category: 'Kommunal',   amount: 300000, note: "Elektr + suv, aprel" },
  { id: 'e11', monthKey: '2026-05', date: '2026-05-10', category: 'Reklama',    amount: 250000, note: "Banner + tarqatma" },
  // ── Aprel (1 400 000) ──
  { id: 'e12', monthKey: '2026-04', date: '2026-04-25', category: 'Ijara',      amount: 800000, note: "Aprel oyi ijarasi (qism)" },
  { id: 'e13', monthKey: '2026-04', date: '2026-04-18', category: 'Reklama',    amount: 400000, note: "Telegram + Instagram" },
  { id: 'e14', monthKey: '2026-04', date: '2026-04-10', category: 'Kanselyariya', amount: 200000, note: "Daftar, ruchka, printer qog'ozi" },
  // ── Mart (1 100 000) ──
  { id: 'e15', monthKey: '2026-03', date: '2026-03-20', category: 'Reklama',    amount: 600000, note: "Ochilish kampaniyasi" },
  { id: 'e16', monthKey: '2026-03', date: '2026-03-12', category: 'Kommunal',   amount: 500000, note: "Elektr + suv, fevral" },
];

export const MONTHLY_SUMMARY = MONTHS.map((m) => ({
  ...m,
  profit: m.income - m.expenses,
}));
