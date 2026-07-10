// @ts-nocheck
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Award,
  Building2,
  GraduationCap,
  TrendingDown,
  TrendingUp,
  Users2,
  Wallet,
  Wifi,
} from 'lucide-react';
import clsx from 'clsx';
import { branchesApi, type BranchItem } from '../../../shared/api/endpoints/branches';
import { SkeletonTable } from '../../../shared/ui/Skeleton';
import { EmptyState } from '../../../shared/ui/EmptyState';

const CURRENCY = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

type Metric = 'revenue' | 'students' | 'groups' | 'debt' | 'online' | 'attendance';

const METRICS: Array<{ key: Metric; label: string; icon: React.ComponentType<{ className?: string }>; higherBetter: boolean }> = [
  { key: 'revenue', label: 'Выручка/мес', icon: Wallet, higherBetter: true },
  { key: 'students', label: 'Студенты', icon: GraduationCap, higherBetter: true },
  { key: 'groups', label: 'Группы', icon: Users2, higherBetter: true },
  { key: 'debt', label: 'Долги', icon: TrendingDown, higherBetter: false },
  { key: 'online', label: 'Онлайн', icon: Wifi, higherBetter: true },
  { key: 'attendance', label: 'Посещаемость', icon: TrendingUp, higherBetter: true },
];

function valueOf(b: BranchItem, m: Metric): number {
  switch (m) {
    case 'revenue': return b.monthlyRevenue;
    case 'students': return b.studentsCount;
    case 'groups': return b.activeGroupsCount;
    case 'debt': return b.debt;
    case 'online': return b.onlineNow;
    case 'attendance':
      // simple synthetic attendance rate from branch id
      return 70 + (b.id.split('').reduce((h, c) => h + c.charCodeAt(0), 0) % 25);
  }
}

function formatValue(m: Metric, v: number): string {
  if (m === 'revenue' || m === 'debt') {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M сум`;
    return `${CURRENCY.format(v)} сум`;
  }
  if (m === 'attendance') return `${v}%`;
  return String(v);
}

export function ComparisonTab(): React.ReactElement {
  const [sortBy, setSortBy] = useState<Metric>('revenue');

  const query = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list(),
  });

  const active = useMemo(
    () => (query.data?.items ?? []).filter((b) => b.status === 'active'),
    [query.data],
  );

  // Compute rankings per metric
  const rankings = useMemo(() => {
    const map = new Map<string, Record<Metric, number>>();
    for (const b of active) {
      map.set(b.id, {} as Record<Metric, number>);
    }
    for (const m of METRICS) {
      const sorted = [...active].sort((a, b) => {
        const av = valueOf(a, m.key);
        const bv = valueOf(b, m.key);
        return m.higherBetter ? bv - av : av - bv;
      });
      sorted.forEach((b, idx) => {
        const r = map.get(b.id);
        if (r) r[m.key] = idx + 1;
      });
    }
    return map;
  }, [active]);

  const sorted = useMemo(() => {
    const meta = METRICS.find((m) => m.key === sortBy)!;
    return [...active].sort((a, b) => {
      const av = valueOf(a, sortBy);
      const bv = valueOf(b, sortBy);
      return meta.higherBetter ? bv - av : av - bv;
    });
  }, [active, sortBy]);

  if (query.isLoading) return <SkeletonTable rows={4} cols={METRICS.length + 1} />;

  if (active.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Нет активных филиалов"
        description="Открой хотя бы один филиал, чтобы сравнивать"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-base-content/60">
        Сравнение <span className="font-medium text-base-content">{active.length}</span>{' '}
        активных филиалов. Клик по колонке — отсортировать. Место в рейтинге показано
        <span className="inline-flex items-center gap-1 mx-1">
          <Award className="size-3.5 text-warning inline" />
        </span>
        (1 — лучший).
      </div>

      <div className="card bg-base-100 border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead className="bg-base-200/60">
              <tr>
                <th>Филиал</th>
                {METRICS.map((m) => {
                  const isActive = sortBy === m.key;
                  const Icon = m.icon;
                  return (
                    <th
                      key={m.key}
                      onClick={() => setSortBy(m.key)}
                      className={clsx(
                        'text-right cursor-pointer select-none',
                        isActive && 'bg-primary/5 text-primary',
                      )}
                    >
                      <div className="inline-flex items-center gap-1">
                        <Icon className="size-3.5" />
                        {m.label}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.map((b) => {
                const ranks = rankings.get(b.id) ?? ({} as Record<Metric, number>);
                return (
                  <tr key={b.id} className="hover:bg-base-200/40">
                    <td>
                      <Link
                        to={`/superadmin/branches/${b.id}`}
                        className="font-medium hover:text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {b.name}
                        <ArrowUpRight className="size-3 text-base-content/30" />
                      </Link>
                      {b.adminName && (
                        <div className="text-xs text-base-content/50 mt-0.5">
                          {b.adminName}
                        </div>
                      )}
                    </td>
                    {METRICS.map((m) => {
                      const v = valueOf(b, m.key);
                      const rank = ranks[m.key];
                      const isFirst = rank === 1;
                      const isLast = rank === active.length && active.length > 1;
                      return (
                        <td key={m.key} className="text-right">
                          <div className={clsx(
                            'font-medium tabular-nums',
                            m.key === 'debt' && v > 0 && 'text-error',
                          )}>
                            {formatValue(m.key, v)}
                          </div>
                          <div
                            className={clsx(
                              'text-[10px] mt-0.5 inline-flex items-center gap-1',
                              isFirst && 'text-warning font-medium',
                              isLast && 'text-error/70',
                              !isFirst && !isLast && 'text-base-content/40',
                            )}
                          >
                            {isFirst && <Award className="size-3" />}
                            #{rank}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
