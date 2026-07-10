import { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Coins,
  Split,
  User as UserIcon,
  X,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import clsx from 'clsx';
import { Avatar } from '../../../shared/ui/PageHeader';

/**
 * Модалка «Платежи за день» — открывается кликом по точке на графике выручки.
 *
 * Сейчас данные генерируются детерминированно из даты (для демо).
 * В проде — заменить на реальный запрос `GET /superadmin/payments?date=YYYY-MM-DD`.
 */

const METHOD_META: Record<
  'cash' | 'card' | 'split',
  { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }
> = {
  cash: { label: 'Наличные', icon: Coins, cls: 'bg-warning/15 text-warning border-warning/30' },
  card: { label: 'Карта', icon: CreditCard, cls: 'bg-info/15 text-info border-info/30' },
  split: { label: 'Разбит', icon: Split, cls: 'bg-primary/15 text-primary border-primary/30' },
};

type Method = keyof typeof METHOD_META;

interface SplitInstallment {
  dueDate: string;   // ISO date
  amount: number;
  status: 'paid' | 'due-soon' | 'due' | 'overdue';
}

interface Payment {
  id: string;
  studentName: string;
  studentId: string;
  amount: number;
  method: Method;
  time: string; // HH:MM
  period: string; // MM.YYYY
  groupName: string;
  addedByName: string;
  addedByRole: 'admin' | 'superadmin';
  note?: string;
  // Только для split:
  splitPlan?: {
    totalAmount: number;
    installments: SplitInstallment[];
  };
}

const STUDENTS: Array<{ name: string; id: string }> = [
  { name: 'Каримов Азиз', id: 'student-014' },
  { name: 'Мирзаев Отабек', id: 'student-001' },
  { name: 'Насриддинов Мохира', id: 'student-002' },
  { name: 'Собиров Гульнара', id: 'student-003' },
  { name: 'Юлдашев Расул', id: 'student-004' },
  { name: 'Джураев Нозима', id: 'student-005' },
  { name: 'Эшонов Мадина', id: 'student-006' },
  { name: 'Юсупов Элёр', id: 'student-007' },
  { name: 'Абдуллаев Азиза', id: 'student-008' },
  { name: 'Ибрагимов Улугбек', id: 'student-009' },
  { name: 'Кучкаров Шахло', id: 'student-010' },
  { name: 'Хасанов Хушнуд', id: 'student-011' },
];

const GROUPS = [
  'Frontend · Junior · MW-Evening',
  'Python · Middle · TT-Morning',
  'Дизайн UI/UX · Sat',
  'English B2 · MWF',
  'DevOps · Weekend',
];

const AMOUNTS = [450_000, 600_000, 750_000, 900_000, 550_000];
const METHODS: Method[] = ['cash', 'card', 'split'];
const ADMINS: Array<{ name: string; role: 'admin' | 'superadmin' }> = [
  { name: 'Нодира Юсупова', role: 'admin' },
  { name: 'Азиз Каримов', role: 'superadmin' },
  { name: 'Умид Ахмедов', role: 'admin' },
];

function seedFromDate(iso: string): number {
  return iso.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
}

function toDateStr(iso: string): string {
  return iso.slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return toDateStr(d.toISOString());
}

function makeSplitPlan(total: number, firstDate: string, seed: number): Payment['splitPlan'] {
  // 3–4 равные части раз в 2 недели. Часть уже оплачена (первая — в день транзакции).
  const parts = 3 + (seed % 2);
  const each = Math.round(total / parts / 1000) * 1000;
  const today = toDateStr(new Date().toISOString());
  const installments: SplitInstallment[] = [];
  for (let i = 0; i < parts; i++) {
    const due = i === 0 ? firstDate : addDays(firstDate, i * 14);
    let status: SplitInstallment['status'];
    if (due <= today) {
      status = i === 0 ? 'paid' : 'overdue';
    } else if (due <= addDays(today, 3)) {
      status = 'due-soon';
    } else {
      status = 'due';
    }
    // Первый взнос всегда считаем оплаченным
    if (i === 0) status = 'paid';
    installments.push({ dueDate: due, amount: each, status });
  }
  // корректируем последний взнос, чтобы сумма сошлась
  const sum = installments.reduce((s, x) => s + x.amount, 0);
  installments[installments.length - 1]!.amount += total - sum;
  return { totalAmount: total, installments };
}

function generateDayPayments(iso: string, targetTotal: number): Payment[] {
  const seed = seedFromDate(iso);
  const count = Math.min(12, Math.max(3, Math.round(targetTotal / 700_000)));
  const list: Payment[] = [];
  let acc = 0;
  for (let i = 0; i < count; i++) {
    const s = seed + i * 37;
    const student = STUDENTS[s % STUDENTS.length]!;
    const method = METHODS[s % METHODS.length]!;
    const group = GROUPS[s % GROUPS.length]!;
    const admin = ADMINS[s % ADMINS.length]!;
    const amount = AMOUNTS[s % AMOUNTS.length]!;
    const hour = 9 + ((s * 3) % 10);
    const minute = (s * 7) % 60;
    const periodDate = new Date(iso);
    periodDate.setMonth(periodDate.getMonth() - ((s % 3) + 0));
    const period = `${String(periodDate.getMonth() + 1).padStart(2, '0')}.${periodDate.getFullYear()}`;
    const splitPlan =
      method === 'split' ? makeSplitPlan(amount, toDateStr(iso), s) : undefined;
    // Первый взнос split-плана — это то что реально принято сегодня
    const receivedAmount =
      method === 'split' && splitPlan
        ? splitPlan.installments[0]!.amount
        : amount;
    list.push({
      id: `pay-${iso}-${i}`,
      studentName: student.name,
      studentId: student.id,
      amount: receivedAmount,
      method,
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      period,
      groupName: group,
      addedByName: admin.name,
      addedByRole: admin.role,
      splitPlan,
      note: s % 5 === 0 ? 'Оплата через инкассацию, чек в кассе' : undefined,
    });
    acc += receivedAmount;
    if (acc >= targetTotal * 0.9 && i >= 2) break;
  }
  return list.sort((a, b) => a.time.localeCompare(b.time));
}

const CURRENCY = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

const ROLE_LABEL: Record<string, string> = {
  admin: 'админ',
  superadmin: 'супер-админ',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const STATUS_META: Record<
  SplitInstallment['status'],
  { label: string; cls: string; dot: string }
> = {
  paid: { label: 'оплачено', cls: 'text-success', dot: 'bg-success' },
  'due-soon': { label: 'скоро', cls: 'text-warning', dot: 'bg-warning wow-pulse' },
  due: { label: 'ожидается', cls: 'text-base-content/60', dot: 'bg-base-content/30' },
  overdue: { label: 'просрочка', cls: 'text-error', dot: 'bg-error wow-pulse' },
};

interface Props {
  open: boolean;
  onClose: () => void;
  date: string | null;
  totalHint?: number;
}

export function PaymentDayModal({
  open,
  onClose,
  date,
  totalHint = 3_000_000,
}: Props): React.ReactElement | null {
  const [expanded, setExpanded] = useState<string | null>(null);

  const payments = useMemo(
    () => (date ? generateDayPayments(date, totalHint) : []),
    [date, totalHint],
  );

  const byMethod = useMemo(() => {
    const acc: Record<string, { count: number; sum: number }> = {};
    for (const p of payments) {
      const key = p.method;
      if (!acc[key]) acc[key] = { count: 0, sum: 0 };
      acc[key].count++;
      acc[key].sum += p.amount;
    }
    return acc;
  }, [payments]);

  const totalSum = payments.reduce((s, p) => s + p.amount, 0);

  if (!open || !date) return null;

  const d = new Date(date);
  const dateLabel = d.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm wow-rise"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-base-100 border border-base-300 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-base-100/95 backdrop-blur border-b border-base-300 px-6 py-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-base-content/50 font-mono">
              Платежи за день
            </div>
            <h2 className="text-2xl font-semibold tracking-tight mt-1 first-letter:uppercase">
              {dateLabel}
            </h2>
            <div className="text-[12px] text-base-content/60 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <TrendingUp className="size-3.5 text-success" />
                <span className="font-mono">{CURRENCY.format(totalSum)} сум</span>
              </span>
              <span>·</span>
              <span>{payments.length} транзакц.</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:text-base-content"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Разбивка по способам оплаты */}
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => {
              const meta = METHOD_META[m];
              const info = byMethod[m];
              const Icon = meta.icon;
              return (
                <div
                  key={m}
                  className={clsx(
                    'rounded-xl border p-3 wow-lift',
                    info
                      ? meta.cls
                      : 'bg-base-200/40 text-base-content/40 border-base-300',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="size-4" />
                    <span className="text-[10px] uppercase tracking-widest font-bold">
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-1 text-lg font-bold tabular-nums leading-tight">
                    {info ? CURRENCY.format(info.sum) : '—'}
                  </div>
                  <div className="text-[10px] font-mono opacity-70">
                    {info ? `${info.count} транз.` : 'нет'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Список платежей */}
          <div className="bg-base-100 border border-base-300 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-base-300 bg-base-200/40 flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest font-bold text-base-content/50">
                Транзакции · по времени
              </div>
              <div className="text-[10px] text-base-content/40 font-mono">
                клик = детали
              </div>
            </div>
            <ul className="divide-y divide-base-300">
              {payments.map((p) => {
                const meta = METHOD_META[p.method];
                const Icon = meta.icon;
                const isOpen = expanded === p.id;
                return (
                  <li key={p.id} className="transition-colors">
                    <button
                      type="button"
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-base-200/40 transition-colors"
                      onClick={() => setExpanded(isOpen ? null : p.id)}
                    >
                      <div className="text-base-content/40 shrink-0">
                        {isOpen ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </div>
                      <div className="font-mono text-[13px] text-base-content/70 tabular-nums w-14 shrink-0">
                        {p.time}
                      </div>
                      <Avatar name={p.studentName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[14px] truncate">
                          {p.studentName}
                        </div>
                        <div className="text-[11px] text-base-content/50 font-mono truncate">
                          {p.groupName} · период {p.period}
                        </div>
                      </div>
                      <div
                        className={clsx(
                          'inline-flex items-center gap-1 h-5 px-2 rounded-full border text-[10px] font-bold uppercase tracking-wide shrink-0',
                          meta.cls,
                        )}
                      >
                        <Icon className="size-3" />
                        {meta.label}
                      </div>
                      <div className="text-right w-28 shrink-0">
                        <div className="font-mono font-bold tabular-nums text-[14px]">
                          {CURRENCY.format(p.amount)}
                        </div>
                        <div className="text-[10px] text-base-content/40 truncate">
                          принял {p.addedByName.split(' ')[0]}
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 bg-base-200/30 border-t border-base-300 wow-rise">
                        {/* Meta grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                          <MetaItem
                            icon={UserIcon}
                            label="Принял"
                            value={p.addedByName}
                            sub={ROLE_LABEL[p.addedByRole] ?? p.addedByRole}
                          />
                          <MetaItem
                            icon={Clock}
                            label="Время"
                            value={p.time}
                            sub={new Date(date).toLocaleDateString('ru-RU')}
                          />
                          <MetaItem
                            icon={Icon}
                            label="Способ"
                            value={meta.label}
                            sub={p.method === 'split' ? 'частями' : 'разовый'}
                          />
                          <MetaItem
                            icon={Calendar}
                            label="Период"
                            value={p.period}
                            sub="абонемент"
                          />
                        </div>

                        {/* Split-plan */}
                        {p.method === 'split' && p.splitPlan && (
                          <div className="border border-base-300 rounded-lg bg-base-100 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="text-[10px] uppercase tracking-widest font-bold text-base-content/50">
                                  План рассрочки
                                </div>
                                <div className="text-[13px] font-medium">
                                  {p.splitPlan.installments.length} взноса · всего{' '}
                                  {CURRENCY.format(p.splitPlan.totalAmount)} сум
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-primary">
                                каждые 14 дней
                              </span>
                            </div>
                            <ol className="space-y-1.5">
                              {p.splitPlan.installments.map((inst, i) => {
                                const st = STATUS_META[inst.status];
                                return (
                                  <li
                                    key={i}
                                    className="flex items-center gap-3 text-[13px]"
                                  >
                                    <span
                                      className={clsx(
                                        'size-6 rounded-full text-[10px] grid place-items-center font-bold shrink-0',
                                        inst.status === 'paid'
                                          ? 'bg-success/20 text-success'
                                          : inst.status === 'overdue'
                                            ? 'bg-error/20 text-error'
                                            : 'bg-base-200 text-base-content/60',
                                      )}
                                    >
                                      {inst.status === 'paid' ? (
                                        <Check className="size-3" />
                                      ) : (
                                        i + 1
                                      )}
                                    </span>
                                    <div className="flex-1 flex items-center gap-2 min-w-0">
                                      <span className="text-base-content/70 font-mono text-[12px]">
                                        {formatDate(inst.dueDate)}
                                      </span>
                                      <span
                                        className={clsx(
                                          'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide',
                                          st.cls,
                                        )}
                                      >
                                        <span
                                          className={clsx(
                                            'size-1.5 rounded-full',
                                            st.dot,
                                          )}
                                        />
                                        {st.label}
                                      </span>
                                    </div>
                                    <span className="font-mono font-bold tabular-nums">
                                      {CURRENCY.format(inst.amount)}
                                    </span>
                                  </li>
                                );
                              })}
                            </ol>
                          </div>
                        )}

                        {p.note && (
                          <div className="mt-3 rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-[12px] text-base-content/70 flex items-start gap-2">
                            <span className="text-primary/60 font-mono">▸</span>
                            <span>{p.note}</span>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-end gap-2">
                          <a
                            href={`/superadmin/students/${p.studentId}`}
                            className="btn btn-primary btn-xs rounded-md wow-shine"
                          >
                            Открыть карточку студента →
                          </a>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="px-4 py-3 border-t border-base-300 bg-base-200/40 flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-1.5 text-base-content/60">
                <DollarSign className="size-3.5" /> Итого
              </div>
              <div className="font-mono font-bold text-base tabular-nums">
                {CURRENCY.format(totalSum)} сум
              </div>
            </div>
          </div>

          <div className="text-[11px] text-base-content/40 font-mono">
            ▸ демо-режим · в проде — запрос{' '}
            <span className="text-base-content/60">
              GET /superadmin/payments?date={date}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border border-base-300 rounded-lg bg-base-100 px-3 py-2">
      <div className="text-[9px] uppercase tracking-widest text-base-content/50 font-semibold flex items-center gap-1">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="text-[13px] font-medium truncate">{value}</div>
      {sub && (
        <div className="text-[10px] text-base-content/50 font-mono truncate">
          {sub}
        </div>
      )}
    </div>
  );
}
