/**
 * Mock data for the Stats page: time-series (revenue, attendance, new students),
 * payment methods distribution, top groups by revenue.
 *
 * Uses a deterministic seeded PRNG so the numbers are stable across HMR reloads.
 */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface TimePoint {
  date: string;
  revenue: number;
  attendance: number;
  newStudents: number;
}

/** Generate `days` days of data ending today. */
function buildTimeSeries(days: number, seed: number): TimePoint[] {
  const rand = mulberry32(seed);
  const points: TimePoint[] = [];
  const now = new Date();

  let revenue = 800_000 + rand() * 300_000;
  let attendance = 82 + rand() * 6;
  let newStudents = 1 + Math.floor(rand() * 2);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const day = d.getDay();

    const weekendDip = day === 0 || day === 6 ? 0.6 : 1;
    const revJitter = (rand() - 0.5) * 100_000;
    const attJitter = (rand() - 0.5) * 5;
    const growth = 1 + (days - i) * 0.0015;

    const dayRevenue = Math.max(150_000, (revenue + revJitter) * weekendDip * growth);
    const dayAttendance = Math.min(98, Math.max(65, attendance + attJitter));
    const dayNew = rand() < 0.25 ? 1 + Math.floor(rand() * 3) : 0;

    points.push({
      date: d.toISOString().slice(0, 10),
      revenue: Math.round(dayRevenue),
      attendance: Math.round(dayAttendance * 10) / 10,
      newStudents: dayNew,
    });

    revenue += (rand() - 0.5) * 50_000;
    attendance += (rand() - 0.5) * 0.8;
    newStudents = dayNew;
  }
  return points;
}

export const TIME_SERIES_90D = buildTimeSeries(90, 42);

export function getSeries(rangeDays: number): TimePoint[] {
  return TIME_SERIES_90D.slice(-rangeDays);
}

export interface StatsSummary {
  revenueTotal: number;
  revenueDelta: number; // percent vs prev period
  attendanceAvg: number;
  attendanceDelta: number;
  studentsActive: number;
  studentsDelta: number;
  unpaidStudents: number;
  unpaidDelta: number;
}

export function computeSummary(rangeDays: number): StatsSummary {
  const current = getSeries(rangeDays);
  const prev = TIME_SERIES_90D.slice(-rangeDays * 2, -rangeDays);

  const sum = (arr: TimePoint[], key: keyof TimePoint) =>
    arr.reduce((acc, p) => acc + (typeof p[key] === 'number' ? (p[key] as number) : 0), 0);
  const avg = (arr: TimePoint[], key: keyof TimePoint) =>
    arr.length === 0 ? 0 : sum(arr, key) / arr.length;

  const revCurrent = sum(current, 'revenue');
  const revPrev = prev.length > 0 ? sum(prev, 'revenue') : revCurrent;
  const revenueDelta = revPrev === 0 ? 0 : ((revCurrent - revPrev) / revPrev) * 100;

  const attCurrent = avg(current, 'attendance');
  const attPrev = prev.length > 0 ? avg(prev, 'attendance') : attCurrent;
  const attendanceDelta = attPrev === 0 ? 0 : attCurrent - attPrev;

  const newCurrent = sum(current, 'newStudents');
  const newPrev = prev.length > 0 ? sum(prev, 'newStudents') : newCurrent;
  const studentsDelta = newPrev === 0 ? 0 : ((newCurrent - newPrev) / newPrev) * 100;

  return {
    revenueTotal: revCurrent,
    revenueDelta,
    attendanceAvg: Math.round(attCurrent * 10) / 10,
    attendanceDelta: Math.round(attendanceDelta * 10) / 10,
    studentsActive: 35,
    studentsDelta,
    unpaidStudents: 8,
    unpaidDelta: -12.5,
  };
}

export const PAYMENT_METHODS_DIST = [
  { name: 'Карта', value: 48, color: 'oklch(70% 0.16 215)' },
  { name: 'Наличные', value: 32, color: 'oklch(75% 0.18 80)' },
  { name: 'Разбит', value: 20, color: 'oklch(85% 0.22 130)' },
];

export const TOP_GROUPS = [
  { name: 'DevOps · Weekend', revenue: 8_100_000, students: 9 },
  { name: 'Python · Middle · TT-Morning', revenue: 6_750_000, students: 9 },
  { name: 'Frontend · Junior · MW-Evening', revenue: 5_400_000, students: 9 },
  { name: 'Дизайн UI/UX · Sat', revenue: 4_400_000, students: 8 },
  { name: 'English B2 · MWF', revenue: 3_150_000, students: 7 },
];
