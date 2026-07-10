import { useMemo } from 'react';
import {
  Users,
  Wallet,
  AlertCircle,
  TrendingUp,
  X,
  CreditCard,
  Coins,
  Split,
  Building2,
  ArrowUpRight,
} from 'lucide-react';
import clsx from 'clsx';
import { Avatar } from '../../../shared/ui/PageHeader';

/**
 * Модалка «Обзор месяца» — открывается кликом по любой точке/области дашборд-графика.
 * Показывает агрегированную статистику:
 *  - сколько студентов заплатили vs остались (collection rate)
 *  - топ платежей (кто больше всего внёс)
 *  - топ долгов (кто больше всего должен)
 *  - разбивка по способам оплаты
 *  - разбивка по филиалам
 */

const CURRENCY = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

const STUDENTS_POOL = [
  'Каримов Азиз',
  'Мирзаев Отабек',
  'Насриддинов Мохира',
  'Собиров Гульнара',
  'Юлдашев Расул',
  'Джураев Нозима',
  'Эшонов Мадина',
  'Юсупов Элёр',
  'Абдуллаев Азиза',
  'Ибрагимов Улугбек',
  'Кучкаров Шахло',
  'Хасанов Хушнуд',
  'Рахимов Тимур',
  'Тошматов Шохрух',
  'Комилов Феруз',
];

function seedFromKey(key: string): number {
  return key.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
}

interface Payer {
  id: string;
  name: string;
  total: number;
  txns: number;
  method: 'card' | 'cash' | 'split';
  branch: string;
}

interface Debtor {
  id: string;
  name: string;
  owed: number;
  monthsOverdue: number;
  lastPaid: string | null;
  branch: string;
}

function generateData(
  monthKey: string,
  totalRevenue: number,
  branches: Array<{ id: string; name: string; monthlyRevenue: number; studentsCount: number }>,
) {
  const seed = seedFromKey(monthKey);

  // Всего студентов и оплатили
  const totalStudents = branches.reduce((s, b) => s + b.studentsCount, 0) || 155;
  const paidRate = 0.68 + ((seed % 15) / 100); // 68..82%
  const paidStudents = Math.round(totalStudents * paidRate);
  const unpaidStudents = totalStudents - paidStudents;

  const expectedRevenue = Math.round(totalRevenue / paidRate);
  const owedTotal = expectedRevenue - totalRevenue;

  // Топ 5 плательщиков — от текущего месяца
  const methods = ['card', 'cash', 'split'] as const;
  const topPayers: Payer[] = [];
  for (let i = 0; i < 6; i++) {
    const s = seed + i * 41;
    const total = 600_000 + ((s * 137) % 6) * 150_000;
    const txns = 1 + (s % 3);
    topPayers.push({
      id: `payer-${i}`,
      name: STUDENTS_POOL[s % STUDENTS_POOL.length]!,
      total,
      txns,
      method: methods[s % methods.length]!,
      branch:
        branches[s % Math.max(1, branches.length)]?.name ??
        (['Юнусабад', 'Чиланзар', 'Мирзо-Улугбек'][s % 3] ?? 'Юнусабад'),
    });
  }
  topPayers.sort((a, b) => b.total - a.total);

  // Топ 5 должников
  const topDebtors: Debtor[] = [];
  for (let i = 0; i < 6; i++) {
    const s = seed + i * 71 + 1000;
    const owed = 300_000 + ((s * 89) % 12) * 100_000;
    const monthsOverdue = 1 + (s % 3);
    const daysAgo = 30 + (s % 60);
    const lastPaid = new Date(Date.now() - daysAgo * 86400_000).toISOString();
    topDebtors.push({
      id: `debtor-${i}`,
      name: STUDENTS_POOL[(s + 3) % STUDENTS_POOL.length]!,
      owed,
      monthsOverdue,
      lastPaid,
      branch:
        branches[s % Math.max(1, branches.length)]?.name ??
        (['Юнусабад', 'Чиланзар', 'Мирзо-Улугбек'][s % 3] ?? 'Юнусабад'),
    });
  }
  topDebtors.sort((a, b) => b.owed - a.owed);

  // Разбивка по способам (доля от выручки)
  const methodBreakdown = [
    { key: 'card' as const, label: 'Карта', share: 0.48 },
    { key: 'cash' as const, label: 'Наличные', share: 0.32 },
    { key: 'split' as const, label: 'Разбит', share: 0.20 },
  ].map((m) => ({
    ...m,
    amount: Math.round(totalRevenue * m.share),
  }));

  return {
    totalStudents,
    paidStudents,
    unpaidStudents,
    paidRate: Math.round(paidRate * 100),
    expectedRevenue,
    owedTotal,
    topPayers: topPayers.slice(0, 5),
    topDebtors: topDebtors.slice(0, 5),
    methodBreakdown,
  };
}

const METHOD_META: Record<
  'card' | 'cash' | 'split',
  { label: string; icon: React.ComponentType<{ className?: string }>; cls: string; dot: string }
> = {
  card: {
    label: 'Карта',
    icon: CreditCard,
    cls: 'text-info',
    dot: 'bg-info',
  },
  cash: {
    label: 'Наличные',
    icon: Coins,
    cls: 'text-warning',
    dot: 'bg-warning',
  },
  split: {
    label: 'Разбит',
    icon: Split,
    cls: 'text-primary',
    dot: 'bg-primary',
  },
};

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400_000);
  if (days < 30) return `${days} дн назад`;
  const months = Math.floor(days / 30);
  return `${months} мес назад`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  monthName: string | null;
  totalRevenue: number;
  branches: Array<{ id: string; name: string; monthlyRevenue: number; studentsCount: number }>;
}

export function MonthDetailsModal({
  open,
  onClose,
  monthName,
  totalRevenue,
  branches,
}: Props): React.ReactElement | null {
  const data = useMemo(
    () =>
      monthName
        ? generateData(monthName, totalRevenue, branches)
        : null,
    [monthName, totalRevenue, branches],
  );

  if (!open || !monthName || !data) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm wow-rise"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-base-100 border border-base-300 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-base-100/95 backdrop-blur border-b border-base-300 px-6 py-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-base-content/50 font-mono">
              Обзор месяца
            </div>
            <h2 className="text-2xl font-semibold tracking-tight mt-1">
              {monthName} · {new Date().getFullYear()}
            </h2>
            <div className="text-[12px] text-base-content/60 mt-1 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Wallet className="size-3.5 text-success" />
                <span className="font-mono">{CURRENCY.format(totalRevenue)} сум</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Users className="size-3.5" />
                {data.paidStudents} из {data.totalStudents} оплатили
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-primary font-semibold">
                {data.paidRate}% сбор
              </span>
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
          {/* 4 KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiTile
              icon={Wallet}
              label="Собрано"
              value={`${CURRENCY.format(totalRevenue)} сум`}
              tone="success"
              hint={`из ${CURRENCY.format(data.expectedRevenue)} ожидаемых`}
            />
            <KpiTile
              icon={Users}
              label="Оплатили"
              value={`${data.paidStudents} чел.`}
              tone="primary"
              hint={`из ${data.totalStudents} всего`}
            />
            <KpiTile
              icon={AlertCircle}
              label="Не оплатили"
              value={`${data.unpaidStudents} чел.`}
              tone="error"
              hint={`долг ${CURRENCY.format(data.owedTotal)} сум`}
            />
            <KpiTile
              icon={TrendingUp}
              label="Собираемость"
              value={`${data.paidRate}%`}
              tone={
                data.paidRate >= 80
                  ? 'success'
                  : data.paidRate >= 60
                    ? 'warning'
                    : 'error'
              }
              hint="от ожидания"
            />
          </div>

          {/* Прогресс сбора */}
          <div className="bg-base-100 border border-base-300 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2 text-[11px] font-mono text-base-content/60">
              <span>
                Оплатили{' '}
                <span className="text-base-content font-semibold">
                  {data.paidStudents}
                </span>{' '}
                / {data.totalStudents}
              </span>
              <span className="text-primary font-semibold">{data.paidRate}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden bg-base-200 flex">
              <div
                className="h-full bg-gradient-to-r from-success/80 to-primary transition-all"
                style={{ width: `${data.paidRate}%` }}
              />
              <div
                className="h-full bg-error/40 transition-all"
                style={{ width: `${100 - data.paidRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono text-base-content/50">
              <span className="text-success">▸ оплачено</span>
              <span className="text-error">не оплатили ◂</span>
            </div>
          </div>

          {/* Разбивка по способам */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-base-content/50 font-bold mb-2">
              Способы оплаты · доля в выручке
            </div>
            <div className="bg-base-100 border border-base-300 rounded-xl overflow-hidden">
              <div className="flex h-2">
                {data.methodBreakdown.map((m) => (
                  <div
                    key={m.key}
                    className={METHOD_META[m.key].dot}
                    style={{ width: `${m.share * 100}%` }}
                    title={`${m.label}: ${Math.round(m.share * 100)}%`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 divide-x divide-base-300">
                {data.methodBreakdown.map((m) => {
                  const meta = METHOD_META[m.key];
                  const Icon = meta.icon;
                  return (
                    <div key={m.key} className="px-4 py-3">
                      <div
                        className={clsx(
                          'flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide',
                          meta.cls,
                        )}
                      >
                        <Icon className="size-3.5" /> {m.label}
                      </div>
                      <div className="text-base font-bold tabular-nums mt-0.5">
                        {CURRENCY.format(m.amount)}
                      </div>
                      <div className="text-[11px] text-base-content/50">
                        {Math.round(m.share * 100)}% от выручки
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Топ платящих + Топ должников */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopList
              title="Кто больше принёс"
              subtitle="топ 5 плательщиков"
              icon={ArrowUpRight}
              iconCls="text-success"
              rows={data.topPayers.map((p, i) => {
                const meta = METHOD_META[p.method];
                return {
                  id: p.id,
                  rank: i + 1,
                  name: p.name,
                  sub: (
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <Building2 className="size-3 opacity-50" />
                      <span>{p.branch}</span>
                      <span className="opacity-30">·</span>
                      <meta.icon
                        className={clsx('size-3', meta.cls)}
                      />
                      <span>{meta.label}</span>
                    </span>
                  ),
                  value: `+ ${CURRENCY.format(p.total)}`,
                  valueCls: 'text-success',
                  suffix: `${p.txns} транз.`,
                };
              })}
            />
            <TopList
              title="Кто больше должен"
              subtitle="топ 5 должников"
              icon={AlertCircle}
              iconCls="text-error"
              rows={data.topDebtors.map((d, i) => ({
                id: d.id,
                rank: i + 1,
                name: d.name,
                sub: (
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <Building2 className="size-3 opacity-50" />
                    <span>{d.branch}</span>
                    <span className="opacity-30">·</span>
                    <span>
                      просрочка{' '}
                      <span className="font-semibold text-error">
                        {d.monthsOverdue} мес
                      </span>
                    </span>
                  </span>
                ),
                value: `− ${CURRENCY.format(d.owed)}`,
                valueCls: 'text-error',
                suffix: d.lastPaid
                  ? `последний: ${relativeDate(d.lastPaid)}`
                  : 'ни разу',
              }))}
            />
          </div>

          <div className="text-[11px] text-base-content/40 font-mono">
            ▸ демо-режим · в проде — запрос{' '}
            <span className="text-base-content/60">
              GET /superadmin/months/{monthName.toLowerCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  tone: 'success' | 'primary' | 'error' | 'warning';
}) {
  const toneCls = {
    success: 'text-success bg-success/10 border-success/30',
    primary: 'text-primary bg-primary/10 border-primary/30',
    error: 'text-error bg-error/10 border-error/30',
    warning: 'text-warning bg-warning/10 border-warning/30',
  }[tone];
  return (
    <div className={clsx('rounded-xl border p-3 wow-lift', toneCls)}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="text-lg font-bold tabular-nums mt-1 leading-tight">
        {value}
      </div>
      {hint && (
        <div className="text-[10px] opacity-70 mt-0.5 font-mono truncate">
          {hint}
        </div>
      )}
    </div>
  );
}

interface TopRow {
  id: string;
  rank: number;
  name: string;
  sub: React.ReactNode;
  value: string;
  valueCls: string;
  suffix?: string;
}

function TopList({
  title,
  subtitle,
  icon: Icon,
  iconCls,
  rows,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconCls: string;
  rows: TopRow[];
}) {
  return (
    <div className="bg-base-100 border border-base-300 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-base-300 bg-base-200/30 flex items-center gap-2">
        <Icon className={clsx('size-4', iconCls)} />
        <div>
          <div className="text-[13px] font-semibold leading-tight">{title}</div>
          <div className="text-[10px] uppercase tracking-widest text-base-content/50 font-mono">
            {subtitle}
          </div>
        </div>
      </div>
      <ul className="divide-y divide-base-300">
        {rows.map((r) => (
          <li
            key={r.id}
            className="px-4 py-2.5 flex items-center gap-3 hover:bg-base-200/30 transition-colors"
          >
            <div className="size-6 rounded-full bg-base-200 grid place-items-center text-[11px] font-bold tabular-nums text-base-content/60 shrink-0">
              {r.rank}
            </div>
            <Avatar name={r.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-[13px] truncate">{r.name}</div>
              <div className="text-[11px] text-base-content/50 font-mono flex items-center gap-1.5 truncate">
                {r.sub}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div
                className={clsx(
                  'font-mono font-bold tabular-nums text-[13px]',
                  r.valueCls,
                )}
              >
                {r.value}
              </div>
              {r.suffix && (
                <div className="text-[10px] text-base-content/40 font-mono">
                  {r.suffix}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
